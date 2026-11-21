import {NodeIO, Document} from '@gltf-transform/core';
import {EXTMeshoptCompression, KHRMeshQuantization} from '@gltf-transform/extensions';
import {meshopt, reorder} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptSimplifier} from 'meshoptimizer';
import fs from 'node:fs';

const [ruta, salida, resumen]= process.argv.slice(2);
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

const io= new NodeIO();
const src= await io.read(ruta);
const fuentes= new Map();
for (const nodo of src.getRoot().listNodes()){
  const malla= nodo.getMesh();
  if (!malla) continue;
  const num= malla.getName().split('_')[1];
  const W= nodo.getWorldMatrix();
  const pos= [], nor= [], idx= [];
  let mat= null;
  for (const prim of malla.listPrimitives()){
    mat= prim.getMaterial()? prim.getMaterial().getName(): 'material';
    const pa= prim.getAttribute('POSITION'), na= prim.getAttribute('NORMAL'), ia= prim.getIndices();
    const base= pos.length/ 3;
    const v= [0, 0, 0], n= [0, 0, 0];
    for (let i= 0; i< pa.getCount(); i++){
      pa.getElement(i, v);
      const x= W[0]* v[0]+ W[4]* v[1]+ W[8]* v[2]+ W[12], y= W[1]* v[0]+ W[5]* v[1]+ W[9]* v[2]+ W[13], z= W[2]* v[0]+ W[6]* v[1]+ W[10]* v[2]+ W[14];
      pos.push(-y- 0.046, z, -x);
      if (na){
        na.getElement(i, n);
        let a= W[0]* n[0]+ W[4]* n[1]+ W[8]* n[2], b= W[1]* n[0]+ W[5]* n[1]+ W[9]* n[2], c= W[2]* n[0]+ W[6]* n[1]+ W[10]* n[2];
        const l= Math.hypot(a, b, c)|| 1;
        nor.push(-b/ l, c/ l, -a/ l);
      }
      else nor.push(0, 1, 0);
    }
    if (ia) for (let t= 0; t< ia.getCount(); t++) idx.push(base+ ia.getScalar(t));
    else for (let t= 0; t< pa.getCount(); t++) idx.push(base+ t);
  }
  fuentes.set(num, {num, mat, pos: Float32Array.from(pos), nor: Float32Array.from(nor), idx: Uint32Array.from(idx)});
}

function soldar(f){
  const n= f.pos.length/ 3, mapa= new Map(), s= new Int32Array(n);
  for (let i= 0; i< n; i++){
    const k= Math.round(f.pos[i* 3]* 2e4)+ ','+ Math.round(f.pos[i* 3+ 1]* 2e4)+ ','+ Math.round(f.pos[i* 3+ 2]* 2e4);
    if (!mapa.has(k)) mapa.set(k, mapa.size);
    s[i]= mapa.get(k);
  }
  return {s, total: mapa.size};
}
function centroides(f){
  const nt= f.idx.length/ 3, C= new Float32Array(nt* 3);
  for (let t= 0; t< nt; t++) for (let k= 0; k< 3; k++) C[t* 3+ k]= (f.pos[f.idx[t* 3]* 3+ k]+ f.pos[f.idx[t* 3+ 1]* 3+ k]+ f.pos[f.idx[t* 3+ 2]* 3+ k])/ 3;
  return C;
}
function islas(f, lista){
  const {s, total}= soldar(f);
  const padre= new Int32Array(total).map((_, i)=> i);
  const buscar= a=> { while (padre[a]!== a){ padre[a]= padre[padre[a]]; a= padre[a]; } return a; };
  const nt= f.idx.length/ 3;
  const tris= lista|| [...Array(nt).keys()];
  for (const t of tris){
    const a= s[f.idx[t* 3]], b= s[f.idx[t* 3+ 1]], c= s[f.idx[t* 3+ 2]];
    let ra= buscar(a), rb= buscar(b);
    if (ra!== rb) padre[ra]= rb;
    ra= buscar(b); rb= buscar(c);
    if (ra!== rb) padre[ra]= rb;
  }
  const g= new Map();
  for (const t of tris){
    const r= buscar(s[f.idx[t* 3]]);
    if (!g.has(r)) g.set(r, []);
    g.get(r).push(t);
  }
  return [...g.values()].sort((a, b)=> b.length- a.length);
}
function curvatura(f, tris, radio, umbral, minimo){
  const {s}= soldar(f);
  const C= centroides(f);
  const N= [], A= [];
  for (const t of tris){
    const p= [0, 1, 2].map(j=> [f.pos[f.idx[t* 3+ j]* 3], f.pos[f.idx[t* 3+ j]* 3+ 1], f.pos[f.idx[t* 3+ j]* 3+ 2]]);
    const u= [0, 1, 2].map(k=> p[1][k]- p[0][k]), w= [0, 1, 2].map(k=> p[2][k]- p[0][k]);
    const n= [u[1]* w[2]- u[2]* w[1], u[2]* w[0]- u[0]* w[2], u[0]* w[1]- u[1]* w[0]];
    const l= Math.hypot(...n)|| 1e-12;
    N[t]= n.map(x=> x/ l);
    A[t]= l/ 2;
  }
  const grid= new Map();
  const clave= (x, y, z)=> Math.floor(x/ radio)+ ','+ Math.floor(y/ radio)+ ','+ Math.floor(z/ radio);
  for (const t of tris){
    const k= clave(C[t* 3], C[t* 3+ 1], C[t* 3+ 2]);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(t);
  }
  const plano= new Set();
  for (const t of tris){
    const cx= C[t* 3], cy= C[t* 3+ 1], cz= C[t* 3+ 2];
    const ix= Math.floor(cx/ radio), iy= Math.floor(cy/ radio), iz= Math.floor(cz/ radio);
    const m= [0, 0, 0];
    for (let a= -1; a<= 1; a++) for (let b= -1; b<= 1; b++) for (let c= -1; c<= 1; c++){
      const l= grid.get((ix+ a)+ ','+ (iy+ b)+ ','+ (iz+ c));
      if (!l) continue;
      for (const u of l){
        if (Math.hypot(C[u* 3]- cx, C[u* 3+ 1]- cy, C[u* 3+ 2]- cz)> radio) continue;
        const sg= N[u][0]* N[t][0]+ N[u][1]* N[t][1]+ N[u][2]* N[t][2]>= 0? 1: -1;
        for (let k= 0; k< 3; k++) m[k]+= sg* N[u][k]* A[u];
      }
    }
    const l= Math.hypot(...m)|| 1;
    if (1- (m[0]* N[t][0]+ m[1]* N[t][1]+ m[2]* N[t][2])/ l< umbral) plano.add(t);
  }
  const comps= islas(f, [...plano]).filter(c=> c.length>= minimo);
  const et= new Map();
  comps.forEach((c, i)=> { for (const t of c) et.set(t, i); });
  const porV= new Map();
  for (const t of tris) for (let j= 0; j< 3; j++){
    const v= s[f.idx[t* 3+ j]];
    if (!porV.has(v)) porV.set(v, []);
    porV.get(v).push(t);
  }
  let frente= [...et.keys()];
  while (frente.length){
    const nuevo= [];
    for (const t of frente){
      const e= et.get(t);
      for (let j= 0; j< 3; j++) for (const u of porV.get(s[f.idx[t* 3+ j]])) if (!et.has(u)){ et.set(u, e); nuevo.push(u); }
    }
    frente= nuevo;
  }
  const segs= comps.map(()=> []);
  for (const t of tris) if (et.has(t)) segs[et.get(t)].push(t);
  return segs.map(sg=> {
    const c= [0, 0, 0];
    for (const t of sg) for (let k= 0; k< 3; k++) c[k]+= C[t* 3+ k]/ sg.length;
    return {tris: sg, c};
  });
}
const lineaFin= [[0.10, 0.636], [0.173, 0.664], [0.2675, 0.696], [0.3515, 0.740], [0.425, 0.757], [0.530, 0.771], [0.5825, 0.774], [0.635, 0.770], [0.698, 0.754], [0.735, 0.741], [0.761, 0.728], [0.80, 0.712], [0.85, 0.69]];
function yFin(x){
  if (x<= lineaFin[0][0]) return lineaFin[0][1]+ (x- lineaFin[0][0])* 0.38;
  for (let i= 1; i< lineaFin.length; i++){
    const [x0, y0]= lineaFin[i- 1], [x1, y1]= lineaFin[i];
    if (x<= x1) return y0+ (y1- y0)* (x- x0)/ (x1- x0);
  }
  return lineaFin[lineaFin.length- 1][1];
}

const asignacion= new Map();
function asignar(num, funcion){
  const f= fuentes.get(num);
  if (!f){ console.warn('falta malla', num); return; }
  const nt= f.idx.length/ 3, C= centroides(f), a= new Array(nt);
  for (let t= 0; t< nt; t++) a[t]= typeof funcion=== 'string'? funcion: funcion(t, C[t* 3], C[t* 3+ 1], C[t* 3+ 2]);
  asignacion.set(num, a);
}
const porLado= (d, i)=> (t, x, y, z)=> z>= 0? d: i;

function cortar(f, tris, fn){
  const pos= Array.from(f.pos), nor= Array.from(f.nor), idx= Array.from(f.idx);
  const valor= v=> { const r= fn(pos[v* 3], pos[v* 3+ 1], pos[v* 3+ 2]); return r=== 0? 1e-9: r; };
  const cache= new Map();
  const punto= (a, b, fa, fb)=> {
    const k= a< b? a+ ':'+ b: b+ ':'+ a;
    if (cache.has(k)) return cache.get(k);
    const t= fa/ (fa- fb);
    const n= pos.length/ 3;
    for (let k2= 0; k2< 3; k2++) pos.push(pos[a* 3+ k2]+ (pos[b* 3+ k2]- pos[a* 3+ k2])* t);
    const nn= [0, 1, 2].map(k2=> nor[a* 3+ k2]+ (nor[b* 3+ k2]- nor[a* 3+ k2])* t);
    const l= Math.hypot(...nn)|| 1;
    nor.push(nn[0]/ l, nn[1]/ l, nn[2]/ l);
    cache.set(k, n);
    return n;
  };
  const mas= [], menos= [], quitados= [];
  const nuevo= (a, b, c, lista)=> { lista.push(idx.length/ 3); idx.push(a, b, c); };
  for (const t of tris){
    const v= [idx[t* 3], idx[t* 3+ 1], idx[t* 3+ 2]];
    const fv= v.map(valor);
    const sg= fv.map(x=> x> 0);
    if (sg[0]=== sg[1]&& sg[1]=== sg[2]){ (sg[0]? mas: menos).push(t); continue; }
    quitados.push(t);
    let s0= sg[0]!== sg[1]&& sg[0]!== sg[2]? 0: sg[1]!== sg[0]&& sg[1]!== sg[2]? 1: 2;
    const a= v[s0], b= v[(s0+ 1)% 3], c= v[(s0+ 2)% 3];
    const fa= fv[s0], fb= fv[(s0+ 1)% 3], fc= fv[(s0+ 2)% 3];
    const mab= punto(a, b, fa, fb), mac= punto(a, c, fa, fc);
    const solo= sg[s0]? mas: menos, otros= sg[s0]? menos: mas;
    nuevo(a, mab, mac, solo);
    nuevo(mab, b, c, otros);
    nuevo(mab, c, mac, otros);
  }
  f.pos= Float32Array.from(pos);
  f.nor= Float32Array.from(nor);
  f.idx= Uint32Array.from(idx);
  return {mas, menos, quitados};
}

{
  const f= fuentes.get('002');
  const C0= centroides(f);
  const is= islas(f);
  const fijo= new Map();
  for (const t of is[0]) fijo.set(t, 'guarda-del');
  const segs= curvatura(f, is[2], 0.012, 0.012, 150);
  for (const sg of segs){
    const id= sg.c[2]> 0.05? 'colin-d': sg.c[2]< -0.05? 'colin-i': 'colin-base';
    for (const t of sg.tris) fijo.set(t, id);
  }
  for (const t of is[2]) if (!fijo.has(t)) fijo.set(t, C0[t* 3+ 2]> 0.05? 'colin-d': C0[t* 3+ 2]< -0.05? 'colin-i': 'colin-base');
  for (const t of is[3]) fijo.set(t, 'frontal');
  is.slice(4).forEach(lista=> { for (const t of lista) fijo.set(t, 'tablero'); });
  const lados= cortar(f, is[1], (x, y, z)=> z);
  const finD= cortar(f, lados.mas, (x, y, z)=> y- yFin(x)- 0.003);
  for (const t of finD.mas) fijo.set(t, 'panel-sup-d');
  for (const t of finD.menos) fijo.set(t, 'lateral-d');
  const finI= cortar(f, lados.menos, (x, y, z)=> y- yFin(x)- 0.003);
  for (const t of finI.mas) fijo.set(t, 'panel-sup-i');
  for (const t of finI.menos) fijo.set(t, 'lateral-i');
  for (const t of [...lados.quitados, ...finD.quitados, ...finI.quitados]) fijo.delete(t);
  const a= new Array(f.idx.length/ 3).fill(null);
  for (const [t, id] of fijo) a[t]= id;
  asignacion.set('002', a);
}
{
  const f= fuentes.get('005');
  const C= centroides(f);
  const is= islas(f);
  const a= new Array(f.idx.length/ 3);
  const nombres= ['carenado-inf-', 'carenado-inf-', 'tapa-tanque-', 'tapa-tanque-', 'tapa-asiento-', 'tapa-asiento-'];
  is.forEach((lista, k)=> {
    let z= 0;
    for (const t of lista) z+= C[t* 3+ 2]/ lista.length;
    const lado= z>= 0? 'd': 'i';
    for (const t of lista) a[t]= (nombres[k]|| 'tapa-asiento-')+ lado;
  });
  asignacion.set('005', a);
}
{
  const f= fuentes.get('163');
  const C= centroides(f);
  const is= islas(f);
  const a= new Array(f.idx.length/ 3);
  const cx= is.map(l=> l.reduce((s, t)=> s+ C[t* 3], 0)/ l.length);
  is.forEach((lista, k)=> { for (const t of lista) a[t]= cx[k]> -0.52? 'asiento': 'asiento-pas'; });
  asignacion.set('163', a);
}

const reglas= {
  '001': 'rin-del', '003': 'rin-tras', '010': 'llanta-del', '014': 'llanta-tras',
  '004': 'tapa-clutch', '076': 'tapa-clutch', '080': 'tapa-clutch', '099': 'tapa-clutch', '105': 'tapa-clutch',
  '012': 'tapa-alternador', '073': 'tapa-alternador', '074': 'tapa-alternador',
  '085': 'tapa-pinon',
  '006': 'tablero', '007': 'cadena',
  '008': 'chasis', '139': 'chasis', '017': 'chasis', '086': 'relleno', '143': 'chasis', '140': 'chasis', '157': 'chasis', '167': 'chasis', '079': 'chasis',
  '009': 'estribera-i', '100': 'estribera-i', '141': 'estribera-i', '144': 'estribera-i',
  '149': 'estribera-d', '150': 'estribera-d', '151': 'estribera-d', '152': 'estribera-d', '155': 'estribera-d',
  '147': porLado('estribera-d', 'estribera-i'), '145': porLado('estribera-d', 'estribera-i'),
  '011': porLado('estribera-pas-d', 'estribera-pas-i'), '116': porLado('estribera-pas-d', 'estribera-pas-i'),
  '013': 'portaplaca', '136': 'portaplaca', '133': 'placa',
  '015': 'faro', '068': 'faro', '069': 'faro', '070': 'faro', '023': 'faro', '026': 'faro',
  '016': 'frente-int', '024': 'rejilla',
  '018': 'interior', '054': 'interior', '042': 'interior', '019': 'interior', '025': 'interior', '049': 'interior',
  '020': 'tijeras', '021': 'tijeras', '027': 'tijeras', '029': 'tijeras', '031': 'tijeras',
  '022': 'tapa-gas', '071': 'tapa-gas',
  '028': 'manubrio', '035': 'manubrio', '036': 'manubrio', '037': 'manubrio', '039': 'manubrio', '040': 'manubrio', '041': 'manubrio', '044': 'manubrio', '045': 'manubrio', '046': 'manubrio', '047': 'manubrio', '048': 'manubrio', '050': 'manubrio', '051': 'manubrio', '052': 'manubrio', '087': 'manubrio', '089': 'manubrio',
  '030': 'punos', '032': 'punos', '033': 'manetas', '034': 'manetas',
  '091': porLado('espejo-d', 'espejo-i'), '092': porLado('espejo-d', 'espejo-i'), '038': porLado('espejo-d', 'espejo-i'), '043': porLado('espejo-d', 'espejo-i'),
  '090': 'burbuja', '088': 'burbuja',
  '053': 'radiador', '062': 'radiador', '111': 'radiador',
  '055': 'botellas', '096': 'botellas', '115': 'botellas', '067': 'barras',
  '056': 'motor', '057': 'motor', '058': 'motor', '059': 'motor', '060': 'motor', '077': 'motor', '078': 'motor', '081': 'motor', '082': 'motor', '083': 'motor', '084': 'motor', '093': 'motor', '106': 'motor', '107': 'motor',
  '061': 'cables', '156': 'cables',
  '063': 'direc-del', '064': 'direc-del', '065': 'direc-del', '066': 'direc-del',
  '072': 'tanque-sup', '075': 'tanque',
  '094': 'disco-del', '095': 'disco-del', '097': 'disco-del', '098': 'disco-del',
  '101': 'caliper-del', '102': 'caliper-del', '104': 'caliper-del',
  '103': 'colector', '148': 'colector',
  '108': 'botellas', '109': 'botellas', '110': 'botellas', '134': 'portaplaca', '135': 'portaplaca',
  '112': porLado('protector-d', 'protector-i'), '113': porLado('protector-d', 'protector-i'),
  '114': 'guarda-del',
  '117': 'colin-base', '159': 'colin-base',
  '118': 'bandeja',
  '119': 'punta-escape',
  '120': 'caliper-tras', '122': 'caliper-tras', '123': 'caliper-tras',
  '121': 'disco-tras',
  '124': 'basculante', '161': 'basculante', '164': 'basculante', '162': 'basculante',
  '125': 'stop', '126': 'stop', '127': 'stop',
  '128': 'direc-tras', '129': 'direc-tras', '130': 'direc-tras', '131': 'direc-tras', '132': 'direc-tras',
  '137': 'portaplaca', '138': 'portaplaca',
  '142': 'pata', '146': 'pata',
  '153': 'amortiguador', '154': 'resorte',
  '158': 'escape', '160': 'escape', '166': 'escape', '165': 'protector-escape'
};
for (const [num, r] of Object.entries(reglas)) if (!asignacion.has(num)) asignar(num, r);

const AZUL= '#1b3aa6', PLATA= '#b9bdc4', NEGRO= '#141518', GRAFITO= '#26282c', GOMA= '#18181a';
const PIEZAS= {
  'frontal': {nombre: 'Carenado frontal', grupo: 'carenado', rol: 'base', hex: AZUL, explota: [0.34, 0.1, 0], carenado: true, pinta: ['002']},
  'burbuja': {nombre: 'Burbuja (parabrisas)', grupo: 'carenado', rol: 'vidrio', tipo: 'vidrio', hex: '#2b333d', explota: [0.18, 0.32, 0], pinta: ['090']},
  'panel-sup-d': {nombre: 'Panel superior derecho', grupo: 'carenado', rol: 'acento', hex: PLATA, acabado: 'metalizado', explota: [0.06, 0.14, 0.42], carenado: true, pinta: ['002']},
  'panel-sup-i': {nombre: 'Panel superior izquierdo', grupo: 'carenado', rol: 'acento', hex: PLATA, acabado: 'metalizado', explota: [0.06, 0.14, -0.42], carenado: true, pinta: ['002']},
  'lateral-d': {nombre: 'Lateral derecho', grupo: 'carenado', rol: 'detalle', hex: PLATA, acabado: 'metalizado', explota: [0.04, -0.02, 0.36], carenado: true, pinta: ['002']},
  'lateral-i': {nombre: 'Lateral izquierdo', grupo: 'carenado', rol: 'detalle', hex: PLATA, acabado: 'metalizado', explota: [0.04, -0.02, -0.36], carenado: true, pinta: ['002']},
  'carenado-inf-d': {nombre: 'Carenado inferior derecho', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0, -0.06, 0.26], carenado: true, pinta: ['005']},
  'carenado-inf-i': {nombre: 'Carenado inferior izquierdo', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0, -0.06, -0.26], carenado: true, pinta: ['005']},
  'tapa-tanque-d': {nombre: 'Tapa lateral del tanque derecha', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0.02, 0.1, 0.3], carenado: true, pinta: ['005']},
  'tapa-tanque-i': {nombre: 'Tapa lateral del tanque izquierda', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0.02, 0.1, -0.3], carenado: true, pinta: ['005']},
  'tapa-asiento-d': {nombre: 'Tapa bajo el asiento derecha', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [-0.04, 0.08, 0.24], carenado: true, pinta: ['005']},
  'tapa-asiento-i': {nombre: 'Tapa bajo el asiento izquierda', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [-0.04, 0.08, -0.24], carenado: true, pinta: ['005']},
  'interior': {nombre: 'Carenado interior', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0.1, 0.16, 0], pinta: ['018', '054', '042']},
  'frente-int': {nombre: 'Interior del frontal', grupo: 'carenado', rol: 'oscuro', hex: GRAFITO, acabado: 'satinado', explota: [0.22, 0.02, 0], pinta: ['016']},
  'rejilla': {nombre: 'Rejilla de la toma de aire', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'mate', explota: [0.3, 0.16, 0], pinta: ['024']},
  'protector-d': {nombre: 'Protector del radiador derecho', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0.1, -0.04, 0.3], pinta: ['112', '113']},
  'protector-i': {nombre: 'Protector del radiador izquierdo', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0.1, -0.04, -0.3], pinta: ['112', '113']},
  'guarda-del': {nombre: 'Guardabarro delantero', grupo: 'carenado', rol: 'base', hex: AZUL, explota: [0.16, 0.14, 0], carenado: true, pinta: ['002']},
  'tanque': {nombre: 'Tanque', grupo: 'tanque', rol: 'base', hex: AZUL, explota: [0, 0.3, 0], carenado: true, pinta: ['075']},
  'tanque-sup': {nombre: 'Tapa superior del tanque', grupo: 'tanque', rol: 'detalle', hex: PLATA, acabado: 'metalizado', explota: [0, 0.42, 0], pinta: ['072']},
  'tapa-gas': {nombre: 'Tapa de gasolina', grupo: 'tanque', rol: 'metal', hex: '#c9ccd1', acabado: 'metal', explota: [0, 0.52, 0], pinta: ['022', '071']},
  'asiento': {nombre: 'Asiento del piloto', grupo: 'tanque', rol: 'asiento', hex: '#1c1c1e', acabado: 'cuero', explota: [0, 0.22, 0], pinta: ['163']},
  'asiento-pas': {nombre: 'Asiento del pasajero', grupo: 'tanque', rol: 'asiento', hex: '#1c1c1e', acabado: 'cuero', explota: [-0.08, 0.32, 0], pinta: ['163']},
  'colin-d': {nombre: 'Colín derecho', grupo: 'colin', rol: 'base', hex: AZUL, explota: [-0.06, 0.08, 0.3], carenado: true, pinta: ['002']},
  'colin-i': {nombre: 'Colín izquierdo', grupo: 'colin', rol: 'base', hex: AZUL, explota: [-0.06, 0.08, -0.3], carenado: true, pinta: ['002']},
  'colin-base': {nombre: 'Base del colín', grupo: 'colin', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [-0.04, 0.12, 0], pinta: ['002']},
  'bandeja': {nombre: 'Guardabarro trasero', grupo: 'colin', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [-0.06, -0.12, 0], pinta: ['118']},
  'portaplaca': {nombre: 'Portaplaca', grupo: 'colin', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [-0.24, -0.08, 0], pinta: ['013', '136']},
  'placa': {nombre: 'Placa', grupo: 'colin', rol: null, hex: '#f2f2ee', acabado: 'satinado', explota: [-0.3, -0.08, 0], pinta: ['133']},
  'faro': {nombre: 'Faros', grupo: 'luces', rol: 'luz', tipo: 'luz', explota: [0.12, 0, 0]},
  'stop': {nombre: 'Stop', grupo: 'luces', rol: 'luz', tipo: 'luz', explota: [-0.2, 0.06, 0]},
  'direc-del': {nombre: 'Direccionales delanteras', grupo: 'luces', rol: 'luz', tipo: 'luz', explota: [0.04, 0, 0]},
  'direc-tras': {nombre: 'Direccionales traseras', grupo: 'luces', rol: 'luz', tipo: 'luz', explota: [-0.24, -0.08, 0]},
  'rin-del': {nombre: 'Rin delantero', grupo: 'ruedas', rol: 'ruedas', hex: AZUL, pinta: ['001']},
  'rin-tras': {nombre: 'Rin trasero', grupo: 'ruedas', rol: 'ruedas', hex: AZUL, pinta: ['003']},
  'llanta-del': {nombre: 'Llanta delantera', grupo: 'ruedas', rol: 'goma', hex: GOMA, acabado: 'goma', pinta: ['010']},
  'llanta-tras': {nombre: 'Llanta trasera', grupo: 'ruedas', rol: 'goma', hex: GOMA, acabado: 'goma', pinta: ['014']},
  'disco-del': {nombre: 'Disco de freno delantero', grupo: 'ruedas', rol: 'metal', hex: '#a3a8ae', acabado: 'metal', pinta: ['095']},
  'disco-tras': {nombre: 'Disco de freno trasero', grupo: 'ruedas', rol: 'metal', hex: '#a3a8ae', acabado: 'metal', pinta: ['121']},
  'caliper-del': {nombre: 'Caliper delantero', grupo: 'ruedas', rol: 'freno', hex: '#3a3d42', acabado: 'anodizado', pinta: ['102']},
  'caliper-tras': {nombre: 'Caliper trasero', grupo: 'ruedas', rol: 'freno', hex: '#3a3d42', acabado: 'anodizado', pinta: ['122']},
  'cadena': {nombre: 'Cadena y catalina', grupo: 'ruedas', rol: 'metal', hex: '#5a5d63', acabado: 'metal', pinta: ['007']},
  'relleno': {nombre: 'Relleno interno', grupo: 'interno', rol: null, tipo: 'relleno', pinta: []},
  'chasis': {nombre: 'Chasis', grupo: 'chasis', rol: 'chasis', hex: GRAFITO, acabado: 'satinado', pinta: ['008', '139', '017', '143']},
  'basculante': {nombre: 'Basculante', grupo: 'chasis', rol: 'chasis', hex: GRAFITO, acabado: 'satinado', pinta: ['161', '164']},
  'barras': {nombre: 'Barras de la horquilla', grupo: 'chasis', rol: 'metal', hex: '#e2e4e8', acabado: 'cromado', pinta: ['067']},
  'botellas': {nombre: 'Botellas de la horquilla', grupo: 'chasis', rol: 'chasis', hex: '#1c1d20', acabado: 'satinado', pinta: ['055']},
  'tijeras': {nombre: 'Tijera de la dirección', grupo: 'chasis', rol: 'chasis', hex: GRAFITO, acabado: 'satinado', pinta: ['029']},
  'amortiguador': {nombre: 'Amortiguador', grupo: 'chasis', rol: 'metal', hex: '#2a2c30', acabado: 'satinado', pinta: ['153']},
  'resorte': {nombre: 'Resorte del amortiguador', grupo: 'chasis', rol: 'acento', hex: '#3a3d42', acabado: 'brillante', pinta: ['154']},
  'pata': {nombre: 'Pata lateral', grupo: 'chasis', rol: 'chasis', hex: NEGRO, acabado: 'satinado', pinta: ['146']},
  'estribera-d': {nombre: 'Estribera derecha', grupo: 'chasis', rol: 'metal', hex: '#c3c6cb', acabado: 'metal', explota: [0, 0, 0.1], pinta: ['147', '145']},
  'estribera-i': {nombre: 'Estribera izquierda', grupo: 'chasis', rol: 'metal', hex: '#c3c6cb', acabado: 'metal', explota: [0, 0, -0.1], pinta: ['147', '145']},
  'estribera-pas-d': {nombre: 'Estribera del pasajero derecha', grupo: 'chasis', rol: 'metal', hex: '#c3c6cb', acabado: 'metal', explota: [0, 0, 0.1], pinta: ['011']},
  'estribera-pas-i': {nombre: 'Estribera del pasajero izquierda', grupo: 'chasis', rol: 'metal', hex: '#c3c6cb', acabado: 'metal', explota: [0, 0, -0.1], pinta: ['011']},
  'motor': {nombre: 'Motor', grupo: 'motor', rol: 'motor', hex: '#1f2124', acabado: 'satinado', pinta: ['056', '058', '078', '081', '082', '083']},
  'tapa-clutch': {nombre: 'Tapa del clutch', grupo: 'motor', rol: 'motor', hex: '#1f2124', acabado: 'satinado', explota: [0, 0, 0.14], pinta: ['004']},
  'tapa-alternador': {nombre: 'Tapa del alternador', grupo: 'motor', rol: 'motor', hex: '#1f2124', acabado: 'satinado', explota: [0, 0, -0.14], pinta: ['012']},
  'tapa-pinon': {nombre: 'Tapa del piñón', grupo: 'motor', rol: 'motor', hex: '#1f2124', acabado: 'satinado', explota: [0, 0, -0.12], pinta: ['085']},
  'radiador': {nombre: 'Radiador', grupo: 'motor', rol: null, tipo: 'fijo', explota: [0.06, 0, 0], pinta: []},
  'colector': {nombre: 'Colector del escape', grupo: 'motor', rol: 'metal', hex: '#4a4b4e', acabado: 'metal', pinta: ['103', '148']},
  'escape': {nombre: 'Silenciador', grupo: 'motor', rol: 'oscuro', hex: '#1d1e21', acabado: 'satinado', explota: [-0.04, 0, 0.12], pinta: ['160']},
  'protector-escape': {nombre: 'Protector del escape', grupo: 'motor', rol: 'oscuro', hex: '#26272a', acabado: 'satinado', explota: [-0.04, 0, 0.2], pinta: ['165']},
  'punta-escape': {nombre: 'Punta del escape', grupo: 'motor', rol: 'metal', hex: '#b9bcc0', acabado: 'metal', explota: [-0.12, 0.02, 0.12], pinta: ['119']},
  'cables': {nombre: 'Cables y mangueras', grupo: 'motor', rol: null, hex: '#121214', acabado: 'satinado', pinta: ['061', '156']},
  'manubrio': {nombre: 'Manubrio y controles', grupo: 'mandos', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', pinta: ['028', '037', '044', '045', '047', '087']},
  'punos': {nombre: 'Puños', grupo: 'mandos', rol: 'goma', hex: GOMA, acabado: 'goma', pinta: ['030', '032']},
  'manetas': {nombre: 'Manetas', grupo: 'mandos', rol: 'metal', hex: '#c3c6cb', acabado: 'metal', pinta: ['033', '034']},
  'espejo-d': {nombre: 'Espejo derecho', grupo: 'mandos', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0.04, 0.08, 0.14], pinta: ['091', '038']},
  'espejo-i': {nombre: 'Espejo izquierdo', grupo: 'mandos', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0.04, 0.08, -0.14], pinta: ['091', '038']},
  'tablero': {nombre: 'Tablero', grupo: 'mandos', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0.04, 0.1, 0], pinta: ['006']}
};
const PARES= {};
for (const id of Object.keys(PIEZAS)){
  const m= /^(.*)-(d|i)$/.exec(id);
  if (m&& PIEZAS[m[1]+ '-'+ (m[2]=== 'd'? 'i': 'd')]){
    PIEZAS[id].lado= m[2]=== 'd'? 'der': 'izq';
    PIEZAS[id].par= m[1]+ '-'+ (m[2]=== 'd'? 'i': 'd');
  }
}
const REDUCIR= {
  '001': 0.2, '003': 0.2, '010': 0.35, '014': 0.35, '004': 0.25, '012': 0.3, '013': 0.2, '011': 0.2, '008': 0.25, '009': 0.25,
  '006': 0.3, '007': 0.35, '063': 0.12, '131': 0.12, '064': 0.3, '128': 0.3, '066': 0.4, '132': 0.4, '029': 0.35, '037': 0.3,
  '030': 0.2, '032': 0.2, '147': 0.3, '145': 0.4, '161': 0.4, '164': 0.4, '085': 0.35, '102': 0.5, '122': 0.5, '091': 0.5,
  '119': 0.5, '160': 0.6, '121': 0.5, '095': 0.5, '024': 0.6, '015': 0.5, '069': 0.5, '134': 0.4, '125': 0.6, '139': 0.5,
  '044': 0.5, '047': 0.5, '087': 0.4, '076': 0.4, '116': 0.4, '005': 0.5, '018': 0.7, '118': 0.6, '016': 0.6, '157': 0.5
};
const MANTENER= new Set(['002', '075', '072', '090', '163']);
const PINTURA_FINA= new Set(['005', '018', '118', '016', '112', '113', '001', '003']);
function razon(num, n){
  if (REDUCIR[num]) return REDUCIR[num];
  if (MANTENER.has(num)|| n< 2500) return 1;
  return 0.5;
}
const FIJO= {chrome: 'cromo', silver: 'aluminio', black_m: 'negro', glass: 'vidrio', d_glass: 'vidrio', o_glass: 'ambarVidrio', orange: 'ambar', r_glass: 'rojoVidrio', material_6: 'rojo', gum_texture: 'negroTextura', material: 'plastico', texture: 'plastico'};
const LUCES= {faro: {glass: 'vidrio', chrome: 'reflector', material: 'plastico'}, stop: {material_6: 'rojoLed', r_glass: 'rojoVidrio'}, 'direc-del': {orange: 'ambarLed', o_glass: 'ambarVidrio'}, 'direc-tras': {orange: 'ambarLed', o_glass: 'ambarVidrio'}};

const ESPECIAL= {'tablero|002': 'pantalla', 'radiador|062': 'radiador'};
const partes= new Map();
const faltantes= [];
for (const [num, f] of fuentes){
  const a= asignacion.get(num);
  if (!a){ faltantes.push(num+ '('+ f.mat+ ','+ f.idx.length/ 3+ ')'); continue; }
  for (let t= 0; t< a.length; t++){
    const id= a[t];
    if (!id) continue;
    if (!PIEZAS[id]){ console.warn('pieza sin definir', id); continue; }
    const def= PIEZAS[id];
    let mat;
    if (def.tipo=== 'relleno') mat= 'relleno';
    else if (ESPECIAL[id+ '|'+ num]) mat= ESPECIAL[id+ '|'+ num];
    else if (def.tipo=== 'luz') mat= (LUCES[id]&& LUCES[id][f.mat])|| FIJO[f.mat]|| 'plastico';
    else if (def.tipo=== 'vidrio') mat= def.pinta.includes(num)? 'pintura': FIJO[f.mat]|| 'plastico';
    else mat= def.pinta.includes(num)? 'pintura': FIJO[f.mat]|| 'plastico';
    if (!partes.has(id)) partes.set(id, new Map());
    const grupos= partes.get(id);
    const clave= mat+ '|'+ num;
    if (!grupos.has(clave)) grupos.set(clave, {mat, num, tris: []});
    grupos.get(clave).tris.push(t);
  }
}
if (faltantes.length) console.warn('mallas sin asignar:', faltantes.join(' '));

function construirPrim(num, tris){
  const f= fuentes.get(num);
  const mapa= new Map(), pos= [], nor= [], idx= [];
  for (const t of tris) for (let j= 0; j< 3; j++){
    const v= f.idx[t* 3+ j];
    if (!mapa.has(v)){
      mapa.set(v, pos.length/ 3);
      pos.push(f.pos[v* 3], f.pos[v* 3+ 1], f.pos[v* 3+ 2]);
      nor.push(f.nor[v* 3], f.nor[v* 3+ 1], f.nor[v* 3+ 2]);
    }
    idx.push(mapa.get(v));
  }
  let P= Float32Array.from(pos), Nn= Float32Array.from(nor), I= Uint32Array.from(idx);
  const r= razon(num, I.length/ 3);
  if (r< 1&& I.length> 900){
    const objetivo= Math.max(300, Math.floor(I.length/ 3* r))* 3;
    const [nuevo]= MeshoptSimplifier.simplify(I, P, 3, objetivo, PINTURA_FINA.has(num)? 0.0008: 0.0018, ['LockBorder']);
    const usados= new Map(), p2= [], n2= [], i2= [];
    for (const v of nuevo){
      if (!usados.has(v)){
        usados.set(v, p2.length/ 3);
        p2.push(P[v* 3], P[v* 3+ 1], P[v* 3+ 2]);
        n2.push(Nn[v* 3], Nn[v* 3+ 1], Nn[v* 3+ 2]);
      }
      i2.push(usados.get(v));
    }
    P= Float32Array.from(p2);
    Nn= Float32Array.from(n2);
    I= Uint32Array.from(i2);
  }
  const UV= new Float32Array(P.length/ 3* 2);
  for (let i= 0; i< P.length/ 3; i++){
    const ax= Math.abs(Nn[i* 3]), ay= Math.abs(Nn[i* 3+ 1]), az= Math.abs(Nn[i* 3+ 2]);
    const x= P[i* 3], y= P[i* 3+ 1], z= P[i* 3+ 2];
    let u, v;
    if (az>= ax&& az>= ay){ u= x; v= y; }
    else if (ax>= ay){ u= z; v= y; }
    else { u= x; v= z; }
    UV[i* 2]= Math.min(1, Math.max(0, (u+ 1.2)/ 2.4));
    UV[i* 2+ 1]= Math.min(1, Math.max(0, (v+ 1.2)/ 2.4));
  }
  return {P, N: Nn, UV, I};
}

const doc= new Document();
const buffer= doc.createBuffer();
const escena= doc.createScene('Yamaha R3');
const raiz= doc.createNode('moto');
escena.addChild(raiz);
const materiales= new Map();
const matFijo= nombre=> {
  if (!materiales.has(nombre)) materiales.set(nombre, doc.createMaterial('fijo:'+ nombre));
  return materiales.get(nombre);
};
const informe= [];
let totalTris= 0;
for (const [id, def] of Object.entries(PIEZAS)){
  const grupos= partes.get(id);
  if (!grupos){ console.warn('pieza vacía', id); continue; }
  const malla= doc.createMesh(id);
  let tris= 0;
  const centros= [];
  let area= 0;
  const suma= [0, 0, 0];
  const matPintura= ['luz', 'fijo', 'relleno'].includes(def.tipo)? null: doc.createMaterial('pintura:'+ id);
  for (const g of grupos.values()){
    const {P, N, UV, I}= construirPrim(g.num, g.tris);
    if (!I.length) continue;
    const prim= doc.createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(P).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(N).setBuffer(buffer))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(UV).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(P.length/ 3> 65535? I: Uint16Array.from(I)).setBuffer(buffer))
      .setMaterial(g.mat=== 'pintura'? matPintura: matFijo(g.mat));
    malla.addPrimitive(prim);
    tris+= I.length/ 3;
    for (let t= 0; t< I.length; t+= 3){
      const a= I[t]* 3, b= I[t+ 1]* 3, c= I[t+ 2]* 3;
      const ux= P[b]- P[a], uy= P[b+ 1]- P[a+ 1], uz= P[b+ 2]- P[a+ 2];
      const vx= P[c]- P[a], vy= P[c+ 1]- P[a+ 1], vz= P[c+ 2]- P[a+ 2];
      const ar= Math.hypot(uy* vz- uz* vy, uz* vx- ux* vz, ux* vy- uy* vx)/ 2;
      const cx= (P[a]+ P[b]+ P[c])/ 3, cy= (P[a+ 1]+ P[b+ 1]+ P[c+ 1])/ 3, cz= (P[a+ 2]+ P[b+ 2]+ P[c+ 2])/ 3;
      area+= ar;
      suma[0]+= cx* ar;
      suma[1]+= cy* ar;
      suma[2]+= cz* ar;
      if (g.mat=== 'pintura'|| def.tipo!== 'pintura') centros.push(cx, cy, cz);
    }
  }
  totalTris+= tris;
  const cm= suma.map(v=> v/ (area|| 1));
  let ancla= cm, mejor= Infinity;
  for (let k= 0; k< centros.length; k+= 3){
    const d= (centros[k]- cm[0])** 2+ (centros[k+ 1]- cm[1])** 2+ (centros[k+ 2]- cm[2])** 2;
    if (d< mejor){ mejor= d; ancla= [centros[k], centros[k+ 1], centros[k+ 2]]; }
  }
  const nodo= doc.createNode(id).setMesh(malla);
  nodo.setExtras({
    nombre: def.nombre, grupo: def.grupo, rol: def.rol|| null, tipo: def.tipo|| 'pintura', lado: def.lado|| null, par: def.par|| null,
    hex: def.hex|| '#888888', acabado: def.acabado|| (def.tipo=== 'vidrio'? 'vidrio': 'brillante'), explota: def.explota|| [0, 0, 0], carenado: !!def.carenado,
    ancla: ancla.map(v=> Math.round(v* 1e4)/ 1e4)
  });
  raiz.addChild(nodo);
  informe.push({id, nombre: def.nombre, tris, prims: grupos.size});
}
await doc.transform(reorder({encoder: MeshoptEncoder}), meshopt({encoder: MeshoptEncoder, level: 'high', quantizationVolume: 'scene', quantizePosition: 16, quantizeNormal: 10, quantizeTexcoord: 12}));
const nio= new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({'meshopt.encoder': MeshoptEncoder});
const bin= await nio.writeBinary(doc);
fs.writeFileSync(salida, bin);
fs.writeFileSync(resumen, JSON.stringify(informe, null, 1));
console.log('piezas', informe.length, 'triangulos', totalTris, 'bytes', bin.length);
