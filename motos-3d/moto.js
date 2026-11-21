import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const PI= Math.PI;
const clamp= (v, a, b)=> Math.min(b, Math.max(a, v));
const lerp= (a, b, t)=> a+ (b- a)* t;
const V3= (x= 0, y= 0, z= 0)=> new THREE.Vector3(x, y, z);
const hayDom= typeof document!== 'undefined';

export const GRUPOS= [
  {id: 'carenado', nombre: 'Carenado'},
  {id: 'tanque', nombre: 'Tanque y asientos'},
  {id: 'colin', nombre: 'Colín'},
  {id: 'ruedas', nombre: 'Ruedas y frenos'},
  {id: 'chasis', nombre: 'Chasis y suspensión'},
  {id: 'motor', nombre: 'Motor y escape'},
  {id: 'mandos', nombre: 'Manubrio y mandos'},
  {id: 'luces', nombre: 'Luces'}
];

export const ACABADOS= {
  brillante: {nombre: 'Brillante', metalness: 0, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.03},
  metalizado: {nombre: 'Metalizado', metalness: 0.62, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.05},
  satinado: {nombre: 'Satinado', metalness: 0.12, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.45},
  mate: {nombre: 'Mate', metalness: 0, roughness: 0.88, clearcoat: 0, clearcoatRoughness: 1},
  cromado: {nombre: 'Cromado', metalness: 1, roughness: 0.07, clearcoat: 0, clearcoatRoughness: 0},
  anodizado: {nombre: 'Anodizado', metalness: 0.88, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.2},
  tornasol: {nombre: 'Tornasol', metalness: 0.45, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 1, iridescenceIOR: 1.8, rango: [250, 950]},
  carbono: {nombre: 'Carbono', metalness: 0.25, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.03, carbono: true},
  goma: {nombre: 'Goma', metalness: 0, roughness: 0.93, clearcoat: 0, clearcoatRoughness: 1, interno: true},
  cuero: {nombre: 'Cuero', metalness: 0, roughness: 0.66, clearcoat: 0.12, clearcoatRoughness: 0.55, sheen: 0.5, interno: true},
  metal: {nombre: 'Metal', metalness: 1, roughness: 0.34, clearcoat: 0, clearcoatRoughness: 0, interno: true}
};

const cacheTex= {};
function lienzo(w, h, dibujar){
  if (!hayDom) return null;
  const c= document.createElement('canvas');
  c.width= w;
  c.height= h;
  dibujar(c.getContext('2d'), w, h);
  const t= new THREE.CanvasTexture(c);
  t.colorSpace= THREE.SRGBColorSpace;
  t.wrapS= t.wrapT= THREE.RepeatWrapping;
  t.anisotropy= 4;
  return t;
}

export function texturaCarbono(){
  if (cacheTex.carbono!== undefined) return cacheTex.carbono;
  cacheTex.carbono= lienzo(128, 128, (g, w)=> {
    const n= 8, s= w/ n;
    for (let i= 0; i< n; i++) for (let j= 0; j< n; j++){
      const urdimbre= ((i+ j)% 4)< 2;
      const gr= urdimbre? g.createLinearGradient(i* s, 0, i* s+ s, 0): g.createLinearGradient(0, j* s, 0, j* s+ s);
      gr.addColorStop(0, '#3a3a3a');
      gr.addColorStop(0.5, urdimbre? '#bdbdbd': '#9a9a9a');
      gr.addColorStop(1, '#3a3a3a');
      g.fillStyle= gr;
      g.fillRect(i* s, j* s, s, s);
    }
  });
  if (cacheTex.carbono) cacheTex.carbono.repeat.set(36, 36);
  return cacheTex.carbono;
}

function texturaRejilla(){
  if (cacheTex.rejilla!== undefined) return cacheTex.rejilla;
  cacheTex.rejilla= lienzo(64, 64, (g, w)=> {
    g.fillStyle= '#0c0c0d';
    g.fillRect(0, 0, w, w);
    g.strokeStyle= '#55575c';
    g.lineWidth= 5;
    g.beginPath();
    for (let k= -w; k<= w* 2; k+= 16){
      g.moveTo(k, 0);
      g.lineTo(k+ w, w);
      g.moveTo(k, w);
      g.lineTo(k+ w, 0);
    }
    g.stroke();
  });
  if (cacheTex.rejilla) cacheTex.rejilla.repeat.set(26, 26);
  return cacheTex.rejilla;
}

function texturaRadiador(){
  if (cacheTex.radiador!== undefined) return cacheTex.radiador;
  cacheTex.radiador= lienzo(128, 128, (g, w)=> {
    g.fillStyle= '#2c2e31';
    g.fillRect(0, 0, w, w);
    g.fillStyle= '#0d0e10';
    for (let x= 0; x< w; x+= 4) g.fillRect(x, 0, 2, w);
    g.fillStyle= '#4a4d52';
    for (let y= 0; y< w; y+= 16) g.fillRect(0, y, w, 4);
  });
  if (cacheTex.radiador) cacheTex.radiador.repeat.set(5, 5);
  return cacheTex.radiador;
}

function texturaPantalla(){
  if (cacheTex.pantalla!== undefined) return cacheTex.pantalla;
  cacheTex.pantalla= lienzo(256, 128, (g, w, h)=> {
    g.fillStyle= '#020304';
    g.fillRect(0, 0, w, h);
    for (let i= 0; i< 34; i++){
      const x= 14+ i* 6.6;
      const alto= 6+ i* 0.55;
      g.fillStyle= i> 28? '#ff3b30': i< 12? '#2ee6ff': '#e9f6ff';
      g.globalAlpha= i< 9? 1: 0.22;
      g.fillRect(x, 28- alto, 4.2, alto);
    }
    g.globalAlpha= 1;
    g.fillStyle= '#ffffff';
    g.font= 'bold 64px sans-serif';
    g.textAlign= 'right';
    g.fillText('0', 150, 100);
    g.font= '600 16px sans-serif';
    g.textAlign= 'left';
    g.fillText('km/h', 156, 98);
    g.strokeStyle= '#2ee6ff';
    g.lineWidth= 2;
    g.strokeRect(200, 44, 40, 52);
    g.fillStyle= '#2ee6ff';
    g.font= 'bold 40px sans-serif';
    g.textAlign= 'center';
    g.fillText('N', 220, 86);
    g.fillStyle= '#9fb3c2';
    g.font= '600 13px sans-serif';
    g.textAlign= 'left';
    g.fillText('12:00', 16, 120);
    for (let i= 0; i< 6; i++){
      g.fillStyle= i< 5? '#e9f6ff': '#333';
      g.fillRect(16+ i* 9, 46, 6, 14);
    }
  });
  if (cacheTex.pantalla) cacheTex.pantalla.wrapS= cacheTex.pantalla.wrapT= THREE.ClampToEdgeWrapping;
  return cacheTex.pantalla;
}

export function aplicarAcabado(m, hex, acabado){
  const a= ACABADOS[acabado]|| ACABADOS.brillante;
  m.color.set(hex);
  m.metalness= a.metalness;
  m.roughness= a.roughness;
  m.clearcoat= a.clearcoat|| 0;
  m.clearcoatRoughness= a.clearcoatRoughness?? 0.1;
  m.iridescence= a.iridescence|| 0;
  if (a.iridescence){
    m.iridescenceIOR= a.iridescenceIOR;
    m.iridescenceThicknessRange= a.rango;
  }
  m.sheen= a.sheen|| 0;
  if (a.sheen) m.sheenColor.set(hex).lerp(new THREE.Color('#ffffff'), 0.3);
  const mapa= a.carbono? texturaCarbono(): null;
  if (m.map!== mapa){
    m.map= mapa;
    m.needsUpdate= true;
  }
}

function pchip(xs, ys){
  const n= xs.length;
  const h= [], d= [], m= new Array(n).fill(0);
  for (let i= 0; i< n- 1; i++){
    h.push(xs[i+ 1]- xs[i]);
    d.push((ys[i+ 1]- ys[i])/ h[i]);
  }
  const borde= (h0, h1, d0, d1)=> {
    let v= ((2* h0+ h1)* d0- h0* d1)/ (h0+ h1);
    if (Math.sign(v)!== Math.sign(d0)) v= 0;
    else if (Math.sign(d0)!== Math.sign(d1)&& Math.abs(v)> Math.abs(3* d0)) v= 3* d0;
    return v;
  };
  if (n=== 2){
    m[0]= d[0];
    m[1]= d[0];
  }
  else {
    for (let i= 1; i< n- 1; i++){
      if (d[i- 1]* d[i]<= 0) m[i]= 0;
      else {
        const w1= 2* h[i]+ h[i- 1], w2= h[i]+ 2* h[i- 1];
        m[i]= (w1+ w2)/ (w1/ d[i- 1]+ w2/ d[i]);
      }
    }
    m[0]= borde(h[0], h[1], d[0], d[1]);
    m[n- 1]= borde(h[n- 2], h[n- 3], d[n- 2], d[n- 3]);
  }
  return x=> {
    if (x<= xs[0]) return ys[0];
    if (x>= xs[n- 1]) return ys[n- 1];
    let i= 0;
    while (i< n- 2&& x> xs[i+ 1]) i++;
    const t= (x- xs[i])/ h[i], t2= t* t, t3= t2* t;
    return (2* t3- 3* t2+ 1)* ys[i]+ (t3- 2* t2+ t)* h[i]* m[i]+ (-2* t3+ 3* t2)* ys[i+ 1]+ (t3- t2)* h[i]* m[i+ 1];
  };
}

function envolvente(claves){
  const k= [...claves].sort((a, b)=> a[0]- b[0]);
  const xs= k.map(r=> r[0]);
  const fn= [1, 2, 3, 4, 5, 6].map(i=> pchip(xs, k.map(r=> r[i])));
  const sec= x=> ({yt: fn[0](x), ym: fn[1](x), yb: fn[2](x), w: Math.max(fn[3](x), 0.0005), nt: fn[4](x), nb: fn[5](x)});
  const pt= (x, f, off= 0, out= new THREE.Vector3())=> {
    const s= sec(x);
    const c= Math.cos(f), sn= Math.sin(f);
    const e= 2/ (c>= 0? s.nt: s.nb);
    const z= Math.max(s.w+ off, 0)* Math.sign(sn)* Math.pow(Math.abs(sn), e);
    const y= c>= 0? s.ym+ Math.max(s.yt- s.ym+ off, 0)* Math.pow(c, e): s.ym- Math.max(s.ym- s.yb+ off, 0)* Math.pow(-c, e);
    return out.set(x, y, z);
  };
  const lado= (x, y)=> {
    const s= sec(x);
    if (y>= s.ym) return Math.acos(Math.pow(clamp((y- s.ym)/ Math.max(s.yt- s.ym, 1e-6), 0, 1), s.nt/ 2));
    return Math.acos(-Math.pow(clamp((s.ym- y)/ Math.max(s.ym- s.yb, 1e-6), 0, 1), s.nb/ 2));
  };
  const arriba= (x, z)=> {
    const s= sec(x);
    return Math.sign(z)* Math.asin(Math.pow(clamp(Math.abs(z)/ s.w, 0, 1), s.nt/ 2));
  };
  const abajo= (x, z)=> {
    const s= sec(x);
    return PI- Math.sign(z)* Math.asin(Math.pow(clamp(Math.abs(z)/ s.w, 0, 1), s.nb/ 2));
  };
  const convertir= p=> {
    let f;
    if (p.f!== undefined) f= p.f;
    else if (p.a!== undefined) f= arriba(p.x, p.a);
    else if (p.b!== undefined) f= abajo(p.x, p.b);
    else {
      f= lado(p.x, p.y);
      if (p.i) f= -f;
      if (p.j) f= 2* PI- f;
    }
    return {x: p.x, f, c: !!p.c};
  };
  const interior= P=> V3(P.x, sec(P.x).ym, 0);
  return {sec, pt, lado, arriba, abajo, convertir, interior, x0: xs[0], x1: xs[xs.length- 1]};
}

const P= (x, y, c)=> ({x, y, c});
const Pi= (x, y, c)=> ({x, y, i: 1, c});
const Pj= (x, y, c)=> ({x, y, j: 1, c});
const Pa= (x, z, c)=> ({x, a: z, c});
const Pb= (x, z, c)=> ({x, b: z, c});
const Pf= (x, f, c)=> ({x, f, c});

function remuestrear(sup, seg, off, n){
  const m= seg.length- 1;
  const tg= seg.map((p, i)=> {
    const a= seg[Math.max(i- 1, 0)], b= seg[Math.min(i+ 1, m)];
    const k= (i=== 0|| i=== m)? 1: 0.5;
    return {x: (b.x- a.x)* k, f: (b.f- a.f)* k};
  });
  const den= [];
  const sub= 16;
  for (let i= 0; i< m; i++){
    const p0= seg[i], p1= seg[i+ 1], m0= tg[i], m1= tg[i+ 1];
    for (let k= 0; k< sub; k++){
      const t= k/ sub, t2= t* t, t3= t2* t;
      const h00= 2* t3- 3* t2+ 1, h10= t3- 2* t2+ t, h01= -2* t3+ 3* t2, h11= t3- t2;
      den.push({x: h00* p0.x+ h10* m0.x+ h01* p1.x+ h11* m1.x, f: h00* p0.f+ h10* m0.f+ h01* p1.f+ h11* m1.f});
    }
  }
  den.push({x: seg[m].x, f: seg[m].f});
  const pts= den.map(p=> sup.pt(p.x, p.f, off));
  const acum= [0];
  for (let i= 1; i< pts.length; i++) acum.push(acum[i- 1]+ pts[i].distanceTo(pts[i- 1]));
  const L= acum[acum.length- 1];
  const out= [];
  if (L< 1e-6){
    for (let i= 0; i<= n; i++){
      const s= (den.length- 1)* i/ n, k= Math.min(Math.floor(s), den.length- 2), t= s- k;
      out.push({x: lerp(den[k].x, den[k+ 1].x, t), f: lerp(den[k].f, den[k+ 1].f, t)});
    }
    return out;
  }
  let k= 0;
  for (let i= 0; i<= n; i++){
    const s= L* i/ n;
    while (k< acum.length- 2&& acum[k+ 1]< s) k++;
    const dd= acum[k+ 1]- acum[k];
    const t= dd> 1e-12? clamp((s- acum[k])/ dd, 0, 1): 0;
    out.push({x: lerp(den[k].x, den[k+ 1].x, t), f: lerp(den[k].f, den[k+ 1].f, t)});
  }
  return out;
}

function repartir(lista, n, ins){
  const acum= [0];
  for (let i= 1; i< lista.length; i++) acum.push(acum[i- 1]+ lista[i].distanceTo(lista[i- 1]));
  const L= acum[acum.length- 1];
  const out= [];
  if (L< 1e-7){
    for (let i= 0; i<= n; i++) out.push(lista[0].clone());
    return out;
  }
  const e= Math.min(ins, L* 0.3);
  let k= 0;
  for (let i= 0; i<= n; i++){
    const s= e+ (L- 2* e)* i/ n;
    while (k< acum.length- 2&& acum[k+ 1]< s) k++;
    const dd= acum[k+ 1]- acum[k];
    const t= dd> 1e-12? clamp((s- acum[k])/ dd, 0, 1): 0;
    out.push(new THREE.Vector3().lerpVectors(lista[k], lista[k+ 1], t));
  }
  return out;
}

function panel(sup, pts, op= {}){
  const off= op.off|| 0;
  const gro= op.gro!== undefined? op.gro: 0.005;
  const borde= op.borde!== false;
  const r= gro/ 2;
  const ins= op.ins!== undefined? op.ins: borde? (op.junta!== undefined? op.junta: 0.004)/ 2+ r: 0;
  const paso= op.paso|| 0.012;
  const K= 5;
  const q= pts.map(p=> sup.convertir? sup.convertir(p): {x: p.x, f: p.f, c: !!p.c});
  const esq= [];
  q.forEach((p, i)=> { if (p.c) esq.push(i); });
  if (esq.length!== 4) throw new Error('El panel necesita 4 esquinas y tiene '+ esq.length);
  const seg= [];
  for (let k= 0; k< 4; k++){
    const s= [];
    for (let i= esq[k]; ; i= (i+ 1)% q.length){
      s.push(q[i]);
      if (i=== esq[(k+ 1)% 4]) break;
    }
    seg.push(s);
  }
  const largo= s=> {
    let L= 0;
    for (let i= 1; i< s.length; i++) L+= sup.pt(s[i].x, s[i].f, off).distanceTo(sup.pt(s[i- 1].x, s[i- 1].f, off));
    return L;
  };
  const N= clamp(Math.round(Math.max(largo(seg[0]), largo(seg[2]))/ paso), 3, 110);
  const M= clamp(Math.round(Math.max(largo(seg[1]), largo(seg[3]))/ paso), 3, 110);
  const ND= N* 3, MD= M* 3;
  const B= remuestrear(sup, seg[0], off, ND), R= remuestrear(sup, seg[1], off, MD);
  const T= remuestrear(sup, seg[2], off, ND).reverse(), L= remuestrear(sup, seg[3], off, MD).reverse();
  const c0= B[0], c1= B[ND], c2= T[ND], c3= T[0];
  const cols= [];
  for (let j= 0; j<= MD; j++) cols.push([]);
  for (let i= 0; i<= ND; i++){
    const s= i/ ND;
    for (let j= 0; j<= MD; j++){
      const t= j/ MD;
      const w00= (1- s)* (1- t), w10= s* (1- t), w01= (1- s)* t, w11= s* t;
      const x= (1- t)* B[i].x+ t* T[i].x+ (1- s)* L[j].x+ s* R[j].x- (w00* c0.x+ w10* c1.x+ w01* c3.x+ w11* c2.x);
      const f= (1- t)* B[i].f+ t* T[i].f+ (1- s)* L[j].f+ s* R[j].f- (w00* c0.f+ w10* c1.f+ w01* c3.f+ w11* c2.f);
      cols[j].push(sup.pt(x, f, off));
    }
  }
  const E= cols.map(c=> repartir(c, N, ins));
  const G= [];
  for (let i= 0; i<= N; i++) G.push(repartir(E.map(c=> c[i]), M, ins));
  const crudo= [];
  let signo= 0;
  for (let i= 0; i<= N; i++){
    const fila= [];
    for (let j= 0; j<= M; j++){
      const a= new THREE.Vector3().subVectors(G[Math.min(i+ 1, N)][j], G[Math.max(i- 1, 0)][j]);
      const b= new THREE.Vector3().subVectors(G[i][Math.min(j+ 1, M)], G[i][Math.max(j- 1, 0)]);
      const n= new THREE.Vector3().crossVectors(a, b);
      if (n.lengthSq()> 1e-18) signo+= Math.sign(n.dot(new THREE.Vector3().subVectors(G[i][j], sup.interior(G[i][j]))));
      fila.push(n);
    }
    crudo.push(fila);
  }
  const voltear= signo< 0;
  const nor= crudo.map((fila, i)=> fila.map((n, j)=> {
    if (n.lengthSq()<= 1e-18) return new THREE.Vector3().subVectors(G[i][j], sup.interior(G[i][j])).normalize();
    return (voltear? n.negate(): n).normalize();
  }));
  const pos= [], uv= [], idx= [];
  const U= [], W= [];
  for (let i= 0; i<= N; i++){
    U.push(new Array(M+ 1).fill(0));
    W.push(new Array(M+ 1).fill(0));
  }
  for (let j= 0; j<= M; j++) for (let i= 1; i<= N; i++) U[i][j]= U[i- 1][j]+ G[i][j].distanceTo(G[i- 1][j]);
  for (let i= 0; i<= N; i++) for (let j= 1; j<= M; j++) W[i][j]= W[i][j- 1]+ G[i][j].distanceTo(G[i][j- 1]);
  const id= (i, j)=> i* (M+ 1)+ j;
  for (let i= 0; i<= N; i++) for (let j= 0; j<= M; j++){
    pos.push(G[i][j].x, G[i][j].y, G[i][j].z);
    uv.push(U[i][j], W[i][j]);
  }
  const tri= (a, b, c)=> voltear? idx.push(a, c, b): idx.push(a, b, c);
  for (let i= 0; i< N; i++) for (let j= 0; j< M; j++){
    const a= id(i, j), b= id(i+ 1, j), c= id(i+ 1, j+ 1), d= id(i, j+ 1);
    tri(a, b, c);
    tri(a, c, d);
  }
  let nExt= idx.length;
  if (borde){
    const base= (N+ 1)* (M+ 1);
    for (let i= 0; i<= N; i++) for (let j= 0; j<= M; j++){
      const p= G[i][j], n= nor[i][j];
      pos.push(p.x- n.x* gro, p.y- n.y* gro, p.z- n.z* gro);
      uv.push(U[i][j], W[i][j]);
    }
    const lazo= [];
    for (let i= 0; i< N; i++) lazo.push([i, 0]);
    for (let j= 0; j< M; j++) lazo.push([N, j]);
    for (let i= N; i> 0; i--) lazo.push([i, M]);
    for (let j= M; j> 0; j--) lazo.push([0, j]);
    const esquinas= new Set([0, N, N+ M, 2* N+ M]);
    const nl= lazo.length;
    const fuera= (Pt, t, n, ref)=> {
      const e= new THREE.Vector3().crossVectors(t, n);
      const w= new THREE.Vector3().subVectors(Pt, ref);
      if (e.lengthSq()< 1e-16) e.copy(w).addScaledVector(n, -w.dot(n));
      e.normalize();
      if (e.dot(w)< 0) e.negate();
      return e;
    };
    const entradas= [];
    for (let e= 0; e< nl; e++){
      const [i, j]= lazo[e];
      const Pt= G[i][j], n= nor[i][j];
      const ant= G[lazo[(e- 1+ nl)% nl][0]][lazo[(e- 1+ nl)% nl][1]];
      const sig= G[lazo[(e+ 1)% nl][0]][lazo[(e+ 1)% nl][1]];
      const ref= G[clamp(i, 1, N- 1)][clamp(j, 1, M- 1)];
      if (esquinas.has(e)){
        const e1= fuera(Pt, new THREE.Vector3().subVectors(Pt, ant), n, ref);
        const e2= fuera(Pt, new THREE.Vector3().subVectors(sig, Pt), n, ref);
        const em= new THREE.Vector3().addVectors(e1, e2);
        if (em.lengthSq()< 0.01){
          const w= new THREE.Vector3().subVectors(Pt, ref);
          em.copy(w.addScaledVector(n, -w.dot(n)));
        }
        em.normalize();
        for (let k= 0; k<= 4; k++){
          const t= k/ 4;
          const dd= t< 0.5? new THREE.Vector3().lerpVectors(e1, em, t* 2): new THREE.Vector3().lerpVectors(em, e2, t* 2- 1);
          entradas.push({i, j, n, Pt, e: dd.normalize()});
        }
      }
      else entradas.push({i, j, n, Pt, e: fuera(Pt, new THREE.Vector3().subVectors(sig, ant), n, ref)});
    }
    const anillo= entradas.map(en=> {
      const fila= [id(en.i, en.j)];
      for (let k= 1; k< K; k++){
        const th= PI* k/ K, s= r* Math.sin(th), c= r* (1- Math.cos(th));
        pos.push(en.Pt.x+ en.e.x* s- en.n.x* c, en.Pt.y+ en.e.y* s- en.n.y* c, en.Pt.z+ en.e.z* s- en.n.z* c);
        uv.push(U[en.i][en.j], W[en.i][en.j]);
        fila.push(pos.length/ 3- 1);
      }
      fila.push(base+ id(en.i, en.j));
      return fila;
    });
    const ne= anillo.length;
    const vec= i=> V3(pos[i* 3], pos[i* 3+ 1], pos[i* 3+ 2]);
    let e0= 5;
    while (e0< ne- 1&& esquinas.has(e0)) e0++;
    const pa= vec(anillo[e0][2]), pb= vec(anillo[(e0+ 1)% ne][2]), pc= vec(anillo[(e0+ 1)% ne][3]);
    const fn= new THREE.Vector3().crossVectors(pb.sub(pa), pc.sub(pa));
    const inv= fn.dot(entradas[e0].e)< 0;
    for (let e= 0; e< ne; e++){
      const A= anillo[e], Bq= anillo[(e+ 1)% ne];
      for (let k= 0; k< K; k++){
        const a= A[k], b= Bq[k], c= Bq[k+ 1], d= A[k+ 1];
        if (inv) idx.push(a, c, b, a, d, c);
        else idx.push(a, b, c, a, c, d);
      }
    }
    nExt= idx.length;
    for (let i= 0; i< N; i++) for (let j= 0; j< M; j++){
      const a= base+ id(i, j), b= base+ id(i+ 1, j), c= base+ id(i+ 1, j+ 1), d= base+ id(i, j+ 1);
      tri(a, c, b);
      tri(a, d, c);
    }
  }
  const geo= new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  if (borde){
    geo.addGroup(0, nExt, 0);
    geo.addGroup(nExt, idx.length- nExt, 1);
  }
  geo.computeVertexNormals();
  return geo;
}

function espejo(geo){
  const g= geo.clone();
  g.scale(1, 1, -1);
  if (!g.index){
    const a= [];
    for (let i= 0; i< g.attributes.position.count; i++) a.push(i);
    g.setIndex(a);
  }
  const ix= g.index.array;
  for (let i= 0; i< ix.length; i+= 3){
    const t= ix[i+ 1];
    ix[i+ 1]= ix[i+ 2];
    ix[i+ 2]= t;
  }
  g.index.needsUpdate= true;
  return g;
}

function orientar(pos, idx, interior){
  const a= V3(), b= V3(), c= V3(), n= V3(), m= V3();
  for (let t= 0; t< idx.length; t+= 3){
    a.fromArray(pos, idx[t]* 3);
    b.fromArray(pos, idx[t+ 1]* 3);
    c.fromArray(pos, idx[t+ 2]* 3);
    m.copy(a).add(b).add(c).multiplyScalar(1/ 3);
    n.crossVectors(b.clone().sub(a), c.clone().sub(a));
    if (n.dot(m.clone().sub(interior(m)))< 0){
      const s= idx[t+ 1];
      idx[t+ 1]= idx[t+ 2];
      idx[t+ 2]= s;
    }
  }
}

function geometria(pos, idx, uv){
  const g= new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function solido(env, nx= 36, nf= 44){
  const pos= [], idx= [], uv= [];
  const xs= [];
  for (let i= 1; i< nx; i++) xs.push(lerp(env.x0, env.x1, (1- Math.cos(PI* i/ nx))/ 2));
  xs.forEach(x=> {
    for (let j= 0; j< nf; j++){
      const p= env.pt(x, -PI+ 2* PI* j/ nf);
      pos.push(p.x, p.y, p.z);
      uv.push(x* 4, j/ nf);
    }
  });
  const i0= pos.length/ 3;
  pos.push(env.x0, env.sec(env.x0).ym, 0);
  uv.push(env.x0* 4, 0.5);
  const i1= pos.length/ 3;
  pos.push(env.x1, env.sec(env.x1).ym, 0);
  uv.push(env.x1* 4, 0.5);
  const id= (i, j)=> i* nf+ (j% nf);
  for (let i= 0; i< xs.length- 1; i++) for (let j= 0; j< nf; j++) idx.push(id(i, j), id(i+ 1, j), id(i+ 1, j+ 1), id(i, j), id(i+ 1, j+ 1), id(i, j+ 1));
  for (let j= 0; j< nf; j++){
    idx.push(i0, id(0, j), id(0, j+ 1));
    idx.push(i1, id(xs.length- 1, j), id(xs.length- 1, j+ 1));
  }
  orientar(pos, idx, env.interior);
  return geometria(pos, idx, uv);
}

function barrido(camino, seccion, arriba= V3(0, 1, 0)){
  const marco= u=> {
    const e= 1e-3;
    const p= camino(u);
    const t= new THREE.Vector3().subVectors(camino(Math.min(u+ e, 1)), camino(Math.max(u- e, 0))).normalize();
    const b= new THREE.Vector3().crossVectors(t, arriba).normalize();
    const n= new THREE.Vector3().crossVectors(b, t).normalize();
    return {p, t, b, n};
  };
  const pt= (u, f, off= 0, out= new THREE.Vector3())=> {
    const m= marco(u);
    const [px, py]= seccion(u, f);
    const rr= Math.hypot(px, py);
    const k= rr> 1e-9? (rr+ off)/ rr: 1;
    return out.copy(m.p).addScaledVector(m.b, px* k).addScaledVector(m.n, py* k);
  };
  const interior= Q=> {
    let mejor= null, bd= Infinity;
    for (let i= 0; i<= 60; i++){
      const c= camino(i/ 60), d= c.distanceToSquared(Q);
      if (d< bd){
        bd= d;
        mejor= c;
      }
    }
    return mejor.clone();
  };
  return {pt, interior, marco, camino};
}

function solidoBarrido(sup, nu= 30, nf= 28, tapas= true){
  const pos= [], idx= [], uv= [];
  for (let i= 0; i<= nu; i++) for (let j= 0; j< nf; j++){
    const p= sup.pt(i/ nu, 2* PI* j/ nf);
    pos.push(p.x, p.y, p.z);
    uv.push(i/ nu, j/ nf);
  }
  const id= (i, j)=> i* nf+ (j% nf);
  for (let i= 0; i< nu; i++) for (let j= 0; j< nf; j++) idx.push(id(i, j), id(i+ 1, j), id(i+ 1, j+ 1), id(i, j), id(i+ 1, j+ 1), id(i, j+ 1));
  if (tapas){
    const a= sup.camino(0), b= sup.camino(1);
    const ia= pos.length/ 3;
    pos.push(a.x, a.y, a.z);
    uv.push(0, 0.5);
    const ib= pos.length/ 3;
    pos.push(b.x, b.y, b.z);
    uv.push(1, 0.5);
    for (let j= 0; j< nf; j++){
      idx.push(ia, id(0, j), id(0, j+ 1));
      idx.push(ib, id(nu, j), id(nu, j+ 1));
    }
  }
  const t0= sup.camino(0), t1= sup.camino(1);
  orientar(pos, idx, Q=> {
    if (tapas){
      const d= new THREE.Vector3().subVectors(t1, t0);
      const u= clamp(new THREE.Vector3().subVectors(Q, t0).dot(d)/ d.lengthSq(), 0, 1);
      if (u<= 0.0001) return t0.clone().addScaledVector(d, 0.02);
      if (u>= 0.9999) return t1.clone().addScaledVector(d, -0.02);
    }
    return sup.interior(Q);
  });
  return geometria(pos, idx, uv);
}

function arco(cx, cy, R, ancho, caida, perfil= ()=> 1){
  const pt= (a, v, off= 0, out= new THREE.Vector3())=> {
    const w= ancho* perfil(a);
    const ps= clamp(v, -1, 1)* PI/ 2;
    const s= Math.sin(ps), c= Math.cos(ps);
    const z= (w+ off)* Math.sign(s)* Math.pow(Math.abs(s), 0.75);
    const rad= R+ off- (caida+ off)* (1- Math.pow(Math.abs(c), 0.75));
    return out.set(cx+ Math.cos(a)* rad, cy+ Math.sin(a)* rad, z);
  };
  return {pt, interior: Q=> V3(cx, cy, Q.z* 0.2)};
}

function cilindro(p, q, r1, r2= r1, seg= 20, abierto= false){
  const d= new THREE.Vector3().subVectors(q, p);
  const L= d.length();
  const g= new THREE.CylinderGeometry(r2, r1, L, seg, 1, abierto);
  g.translate(0, L/ 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.normalize()));
  g.translate(p.x, p.y, p.z);
  return g;
}

function tubo(puntos, r, seg= 48, rseg= 10){
  const curva= new THREE.CatmullRomCurve3(puntos.map(p=> p.isVector3? p: V3(...p)), false, 'centripetal');
  return new THREE.TubeGeometry(curva, seg, r, rseg, false);
}

function caja(w, h, d, r, pos, rotZ= 0, seg= 3){
  const g= new RoundedBoxGeometry(w, h, d, seg, Math.min(r, Math.min(w, h, d)/ 2- 0.0005));
  if (rotZ) g.rotateZ(rotZ);
  g.translate(pos[0], pos[1], pos[2]);
  return g;
}

function torno(perfil, seg= 48){
  const g= new THREE.LatheGeometry(perfil.map(([r, a])=> new THREE.Vector2(r, a)), seg);
  g.rotateX(PI/ 2);
  return g;
}

function extruir(forma, prof, bisel= 0.002, curvas= 10){
  const g= new THREE.ExtrudeGeometry(forma, {depth: prof, bevelEnabled: bisel> 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 2, curveSegments: curvas});
  g.translate(0, 0, -prof/ 2);
  return g;
}

function unir(lista){
  const g= lista.map(x=> {
    let y= x.index? x.toNonIndexed(): x;
    if (!y.attributes.uv){
      y= y.clone();
      y.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(y.attributes.position.count* 2), 2));
    }
    for (const k of Object.keys(y.attributes)) if (!['position', 'normal', 'uv'].includes(k)) y.deleteAttribute(k);
    if (!y.attributes.normal) y.computeVertexNormals();
    return y;
  });
  return mergeGeometries(g, false);
}

function formaPoligono(pts){
  const s= new THREE.Shape();
  pts.forEach(([x, y], i)=> i=== 0? s.moveTo(x, y): s.lineTo(x, y));
  s.closePath();
  return s;
}

function comunes(){
  const est= (o)=> new THREE.MeshStandardMaterial(o);
  return {
    interior: est({color: 0x0f1012, roughness: 0.85, metalness: 0}),
    plastico: est({color: 0x16171a, roughness: 0.7, metalness: 0}),
    goma: est({color: 0x151516, roughness: 0.93, metalness: 0}),
    acero: est({color: 0xa6aab0, roughness: 0.27, metalness: 1}),
    aluminio: est({color: 0xc5c8cd, roughness: 0.36, metalness: 1}),
    oscuro: est({color: 0x26282c, roughness: 0.5, metalness: 0.65}),
    cromo: est({color: 0xeceef2, roughness: 0.05, metalness: 1}),
    espejo: est({color: 0xe3e9f0, roughness: 0.01, metalness: 1}),
    rejilla: est({color: 0xffffff, roughness: 0.65, metalness: 0.2, map: texturaRejilla()}),
    radiador: est({color: 0xffffff, roughness: 0.55, metalness: 0.5, map: texturaRadiador()}),
    lente: new THREE.MeshPhysicalMaterial({color: 0x08090b, roughness: 0.05, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02}),
    led: est({color: 0xffffff, emissive: 0xeef5ff, emissiveIntensity: 2.4, roughness: 0.3}),
    ledAmbar: est({color: 0xffb340, emissive: 0xff9a14, emissiveIntensity: 1.6, roughness: 0.3}),
    ledRojo: est({color: 0xff3030, emissive: 0xff1010, emissiveIntensity: 1.9, roughness: 0.3}),
    rojoLente: new THREE.MeshPhysicalMaterial({color: 0x5a0508, roughness: 0.08, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.9}),
    pantalla: est({color: 0x000000, emissive: 0xffffff, emissiveMap: texturaPantalla(), emissiveIntensity: 1.2, roughness: 0.15}),
    placa: est({color: 0xf2f2ee, roughness: 0.4, metalness: 0.1}),
    titanio: est({color: 0x8d8a86, roughness: 0.3, metalness: 1}),
    cadena: est({color: 0x3c3e42, roughness: 0.42, metalness: 0.85})
  };
}

const AZUL= '#1b3aa6', PLATA= '#b9bdc4', NEGRO= '#141518', GRAFITO= '#2b2d31', GOMA= '#18181a', CELESTE= '#35a3e6', ACERO= '#a2a7ae', TITANIO= '#8e8b87';

export function crearMoto(){
  const raiz= new THREE.Group();
  raiz.name= 'Moto deportiva';
  const piezas= [];
  const C= comunes();

  function nueva(d){
    const obj= new THREE.Group();
    obj.name= d.id;
    raiz.add(obj);
    const tipo= d.tipo|| 'pintura';
    let mat= null;
    if (tipo=== 'pintura'){
      mat= new THREE.MeshPhysicalMaterial();
      aplicarAcabado(mat, d.hex, d.acabado|| 'brillante');
    }
    else if (tipo=== 'vidrio') mat= new THREE.MeshPhysicalMaterial({color: d.hex, transparent: true, opacity: 0.48, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false, side: THREE.DoubleSide});
    const p= {
      id: d.id, nombre: d.nombre, grupo: d.grupo, rol: d.rol|| null, lado: d.lado|| null, par: d.par|| null, tipo,
      pintable: tipo!== 'luz', explota: V3(...(d.explota|| [0, 0, 0])).multiplyScalar(1.25), obj, mat,
      base: {hex: d.hex|| '#888888', acabado: d.acabado|| (tipo=== 'vidrio'? 'vidrio': 'brillante')}
    };
    obj.userData.pieza= p.id;
    piezas.push(p);
    return p;
  }
  function agregar(p, geo, mat){
    const m= new THREE.Mesh(geo, mat|| p.mat);
    m.userData.pieza= p.id;
    p.obj.add(m);
    return m;
  }
  function conInterior(p){
    return [p.mat, C.interior];
  }
  function par(d, construir){
    const ex= d.explota|| [0, 0, 0];
    const der= nueva({...d, id: d.id+ '-d', nombre: d.nombres[0], lado: 'der', par: d.id+ '-i'});
    const izq= nueva({...d, id: d.id+ '-i', nombre: d.nombres[1], lado: 'izq', par: d.id+ '-d', explota: [ex[0], ex[1], -ex[2]]});
    construir(der, 1);
    construir(izq, -1);
    return [der, izq];
  }
  function parPanel(d, sup, pts, op){
    const geo= panel(sup, pts, op);
    const gi= espejo(geo);
    return par(d, (p, s)=> agregar(p, s> 0? geo: gi, conInterior(p)));
  }
  function unico(d, sup, pts, op){
    const p= nueva(d);
    agregar(p, panel(sup, pts, op), conInterior(p));
    return p;
  }
  const lados= g=> [g, espejo(g)];

  const N= envolvente([
    [0.895, 0.766, 0.758, 0.750, 0.004, 2.0, 3.0],
    [0.880, 0.778, 0.756, 0.730, 0.030, 2.0, 3.2],
    [0.850, 0.798, 0.753, 0.708, 0.062, 2.0, 3.6],
    [0.800, 0.826, 0.749, 0.686, 0.104, 2.0, 4.0],
    [0.740, 0.858, 0.745, 0.666, 0.140, 2.05, 4.5],
    [0.680, 0.892, 0.741, 0.646, 0.168, 2.1, 5.0],
    [0.640, 0.928, 0.739, 0.626, 0.181, 2.2, 5.0],
    [0.600, 0.978, 0.737, 0.565, 0.192, 2.2, 5.0],
    [0.550, 1.042, 0.735, 0.480, 0.200, 2.2, 5.0],
    [0.500, 1.106, 0.733, 0.440, 0.204, 2.2, 5.0],
    [0.440, 1.095, 0.729, 0.425, 0.203, 2.25, 5.0],
    [0.360, 1.010, 0.725, 0.425, 0.199, 2.3, 5.0],
    [0.260, 0.930, 0.721, 0.440, 0.191, 2.4, 5.0],
    [0.160, 0.860, 0.717, 0.490, 0.180, 2.5, 5.0],
    [0.060, 0.800, 0.713, 0.560, 0.165, 2.5, 5.0]
  ]);
  const F= envolvente([
    [0.640, 0.760, 0.610, 0.500, 0.186, 2.4, 2.6],
    [0.520, 0.775, 0.535, 0.240, 0.199, 2.4, 2.6],
    [0.400, 0.780, 0.490, 0.158, 0.204, 2.4, 2.6],
    [0.250, 0.775, 0.470, 0.150, 0.200, 2.4, 2.6],
    [0.100, 0.745, 0.455, 0.152, 0.188, 2.4, 2.6],
    [-0.020, 0.705, 0.440, 0.176, 0.170, 2.4, 2.6]
  ]);
  const T= envolvente([
    [0.365, 0.880, 0.842, 0.800, 0.085, 2.4, 2.2],
    [0.320, 0.928, 0.850, 0.760, 0.140, 2.4, 2.2],
    [0.240, 0.970, 0.855, 0.722, 0.170, 2.4, 2.2],
    [0.120, 0.995, 0.850, 0.702, 0.180, 2.4, 2.2],
    [0.000, 0.985, 0.835, 0.700, 0.168, 2.4, 2.2],
    [-0.100, 0.945, 0.815, 0.708, 0.140, 2.4, 2.2],
    [-0.170, 0.880, 0.795, 0.720, 0.115, 2.4, 2.2],
    [-0.210, 0.832, 0.786, 0.742, 0.088, 2.4, 2.2]
  ]);
  const S= envolvente([
    [-0.100, 0.780, 0.700, 0.560, 0.125, 3.2, 3.0],
    [-0.250, 0.785, 0.712, 0.566, 0.135, 3.2, 2.8],
    [-0.450, 0.800, 0.736, 0.600, 0.128, 3.2, 2.4],
    [-0.600, 0.840, 0.780, 0.650, 0.115, 3.2, 2.4],
    [-0.750, 0.877, 0.822, 0.712, 0.098, 3.2, 2.4],
    [-0.880, 0.905, 0.862, 0.780, 0.075, 3.2, 2.4],
    [-0.970, 0.925, 0.893, 0.842, 0.048, 3.2, 2.4],
    [-1.020, 0.935, 0.915, 0.886, 0.022, 3.2, 2.4],
    [-1.048, 0.930, 0.925, 0.918, 0.004, 3.2, 2.4]
  ]);

  unico({id: 'nariz', nombre: 'Carenado frontal', grupo: 'carenado', rol: 'base', hex: AZUL, explota: [0.28, 0.07, 0]}, N, [
    P(0.828, 0.712, 1), P(0.760, 0.684), P(0.700, 0.660), P(0.648, 0.642, 1),
    P(0.620, 0.740), P(0.592, 0.840), P(0.567, 0.945), P(0.600, 0.930), P(0.660, 0.896), P(0.700, 0.868), Pa(0.712, 0.06), Pa(0.716, 0), Pa(0.712, -0.06), Pi(0.700, 0.868), Pi(0.660, 0.896), Pi(0.600, 0.930), Pi(0.567, 0.945), Pi(0.592, 0.840), Pi(0.620, 0.740),
    Pi(0.648, 0.642, 1), Pi(0.700, 0.660), Pi(0.760, 0.684), Pi(0.828, 0.712, 1),
    Pf(0.803, -1.9), Pf(0.796, -1.45), Pf(0.800, -1.15), Pf(0.824, -0.9), Pf(0.851, -0.6), Pf(0.871, -0.3), Pf(0.879, 0), Pf(0.871, 0.3), Pf(0.851, 0.6), Pf(0.824, 0.9), Pf(0.800, 1.15), Pf(0.796, 1.45), Pf(0.803, 1.9)
  ]);

  const burbuja= nueva({id: 'burbuja', nombre: 'Burbuja (parabrisas)', grupo: 'carenado', rol: 'vidrio', tipo: 'vidrio', hex: '#3d4a57', explota: [0.12, 0.27, 0]});
  agregar(burbuja, panel(N, [
    P(0.712, 0.850, 1), P(0.660, 0.885), P(0.600, 0.920), P(0.550, 0.945), P(0.510, 0.958, 1),
    Pa(0.490, 0.12), Pa(0.476, 0.06), Pa(0.470, 0), Pa(0.476, -0.06), Pa(0.490, -0.12),
    Pi(0.510, 0.958, 1), Pi(0.550, 0.945), Pi(0.600, 0.920), Pi(0.660, 0.885), Pi(0.712, 0.850, 1),
    Pa(0.722, -0.06), Pa(0.727, 0), Pa(0.722, 0.06)
  ], {off: 0.007, gro: 0.003}));

  const faro= nueva({id: 'faro', nombre: 'Faro delantero', grupo: 'luces', rol: 'luz', tipo: 'luz'});
  agregar(faro, panel(N, [Pf(0.788, 2.05, 1), Pf(0.895, 2.05, 1), Pf(0.895, -2.05, 1), Pf(0.788, -2.05, 1), Pf(0.788, 0)], {off: -0.004, borde: false}), C.lente);
  const ojo= panel(N, [Pf(0.803, 1.60, 1), Pf(0.803, 1.43, 1), Pf(0.861, 1.50, 1), Pf(0.861, 1.64, 1)], {off: -0.0025, borde: false});
  agregar(faro, ojo, C.led);
  agregar(faro, espejo(ojo), C.led);
  const drl= panel(N, [Pf(0.803, 1.30, 1), Pf(0.803, 1.245, 1), Pf(0.866, 1.085, 1), Pf(0.866, 1.14, 1)], {off: -0.0025, borde: false});
  agregar(faro, drl, C.led);
  agregar(faro, espejo(drl), C.led);

  unico({id: 'toma-frontal', nombre: 'Toma de aire frontal', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0.22, -0.1, 0]}, N, [
    Pf(0.648, 2.05, 1), Pf(0.895, 2.05, 1), Pf(0.895, 2* PI- 2.05, 1), Pf(0.648, 2* PI- 2.05, 1)
  ], {off: -0.0035, gro: 0.004, ins: 0});

  parPanel({id: 'lat-sup', nombres: ['Lateral superior derecho', 'Lateral superior izquierdo'], grupo: 'carenado', rol: 'base', hex: AZUL, explota: [0.07, 0.05, 0.32]}, N, [
    P(0.648, 0.640, 1), P(0.560, 0.603), P(0.460, 0.584), P(0.360, 0.588), P(0.270, 0.612), P(0.190, 0.658), P(0.142, 0.698, 1),
    P(0.132, 0.720, 1), P(0.200, 0.752), P(0.280, 0.785), P(0.360, 0.830), P(0.420, 0.872), P(0.470, 0.915), P(0.525, 0.955), P(0.565, 0.950, 1),
    P(0.592, 0.840), P(0.620, 0.740)
  ], {off: 0.006});

  parPanel({id: 'toma', nombres: ['Toma de aire derecha', 'Toma de aire izquierda'], grupo: 'carenado', rol: 'acento', hex: CELESTE, explota: [0.04, 0.0, 0.48]}, F, [
    P(0.600, 0.625, 1), P(0.450, 0.594), P(0.330, 0.598), P(0.240, 0.625), P(0.170, 0.672, 1),
    P(0.162, 0.645, 1), P(0.230, 0.598), P(0.330, 0.566), P(0.450, 0.560), P(0.530, 0.568, 1)
  ], {off: -0.012, gro: 0.004});

  parPanel({id: 'lat-inf', nombres: ['Lateral inferior derecho', 'Lateral inferior izquierdo'], grupo: 'carenado', rol: 'base', hex: AZUL, explota: [0.0, -0.03, 0.34]}, F, [
    P(0.365, 0.300, 1), P(0.385, 0.390), P(0.410, 0.460), P(0.450, 0.520), P(0.490, 0.556, 1),
    P(0.420, 0.553), P(0.340, 0.558), P(0.260, 0.580), P(0.190, 0.618), P(0.125, 0.652), P(0.075, 0.665, 1),
    P(0.088, 0.580), P(0.105, 0.480), P(0.110, 0.390), P(0.095, 0.322, 1),
    P(0.200, 0.306), P(0.300, 0.301)
  ]);

  unico({id: 'quilla', nombre: 'Quilla', grupo: 'carenado', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0, -0.2, 0]}, F, [
    P(0.365, 0.296, 1), P(0.250, 0.300), P(0.160, 0.308), P(0.095, 0.318, 1),
    Pb(0.070, 0.08), Pb(0.055, 0), Pb(0.070, -0.08),
    Pj(0.095, 0.318, 1), Pj(0.160, 0.308), Pj(0.250, 0.300), Pj(0.365, 0.296, 1),
    Pb(0.385, -0.10), Pb(0.396, 0), Pb(0.385, 0.10)
  ]);

  unico({id: 'cubre-tanque', nombre: 'Cubre tanque', grupo: 'tanque', rol: 'base', hex: AZUL, explota: [0, 0.24, 0]}, T, [
    P(0.335, 0.893, 1), P(0.240, 0.935), P(0.120, 0.955), P(0.000, 0.945), P(-0.100, 0.905), P(-0.165, 0.862, 1),
    Pa(-0.190, 0.05), Pa(-0.196, 0), Pa(-0.190, -0.05),
    Pi(-0.165, 0.862, 1), Pi(-0.100, 0.905), Pi(0.000, 0.945), Pi(0.120, 0.955), Pi(0.240, 0.935), Pi(0.335, 0.893, 1),
    Pa(0.352, -0.05), Pa(0.357, 0), Pa(0.352, 0.05)
  ]);

  parPanel({id: 'tapa-tanque', nombres: ['Tapa lateral del tanque derecha', 'Tapa lateral del tanque izquierda'], grupo: 'tanque', rol: 'detalle', hex: PLATA, acabado: 'metalizado', explota: [0, 0.1, 0.25]}, T, [
    P(0.335, 0.893, 1), P(0.240, 0.935), P(0.120, 0.955), P(0.000, 0.945), P(-0.100, 0.905), P(-0.165, 0.862, 1),
    P(-0.180, 0.800), P(-0.170, 0.745, 1),
    P(-0.080, 0.716), P(0.050, 0.706), P(0.180, 0.713), P(0.280, 0.746), P(0.335, 0.800, 1),
    P(0.345, 0.845)
  ], {off: 0.002});

  const tapaGas= nueva({id: 'tapa-gas', nombre: 'Tapa de gasolina', grupo: 'tanque', rol: 'metal', hex: '#c9ccd1', acabado: 'metal', explota: [0, 0.38, 0]});
  {
    const yt= T.sec(0.14).yt;
    const g= torno([[0.05, 0], [0.05, 0.004], [0.046, 0.009], [0.03, 0.011], [0, 0.011]], 40);
    g.rotateX(-PI/ 2);
    g.rotateZ(-0.12);
    g.translate(0.14, yt- 0.004, 0);
    agregar(tapaGas, g);
  }

  parPanel({id: 'tapa-asiento', nombres: ['Tapa bajo asiento derecha', 'Tapa bajo asiento izquierda'], grupo: 'colin', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0, -0.02, 0.27]}, S, [
    P(-0.115, 0.618, 1), P(-0.105, 0.690), P(-0.110, 0.762, 1),
    P(-0.220, 0.768), P(-0.340, 0.775), P(-0.445, 0.786, 1),
    P(-0.430, 0.710), P(-0.410, 0.640, 1),
    P(-0.280, 0.628), P(-0.180, 0.622)
  ]);

  parPanel({id: 'colin', nombres: ['Colín derecho', 'Colín izquierdo'], grupo: 'colin', rol: 'base', hex: AZUL, explota: [-0.06, 0.07, 0.29]}, S, [
    P(-0.415, 0.632, 1), Pf(-0.550, 2.25), Pf(-0.700, 2.22), Pf(-0.850, 2.20), Pf(-0.950, 2.18), Pf(-1.012, 2.15, 1),
    Pf(-1.020, 1.05, 1), Pf(-0.940, 1.08), Pf(-0.860, 1.10), Pf(-0.775, 1.10), Pf(-0.700, 1.05), Pf(-0.600, 0.95), Pf(-0.520, 0.85), P(-0.455, 0.788, 1),
    P(-0.435, 0.710)
  ], {off: 0.003});

  unico({id: 'tapa-colin', nombre: 'Tapa del colín', grupo: 'colin', rol: 'detalle', hex: PLATA, acabado: 'metalizado', explota: [-0.2, 0.15, 0]}, S, [
    Pf(-0.775, 1.10, 1), Pf(-0.860, 1.10), Pf(-0.940, 1.08), Pf(-1.020, 1.05, 1),
    Pf(-1.040, 0.5), Pf(-1.046, 0), Pf(-1.040, -0.5),
    Pf(-1.020, -1.05, 1), Pf(-0.940, -1.08), Pf(-0.860, -1.10), Pf(-0.775, -1.10, 1),
    Pf(-0.768, -0.5), Pf(-0.765, 0), Pf(-0.768, 0.5)
  ], {off: 0.003});

  unico({id: 'bandeja', nombre: 'Bandeja bajo el colín', grupo: 'colin', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [-0.04, -0.15, 0]}, S, [
    Pf(-0.420, 2.20, 1), Pf(-0.600, 2.20), Pf(-0.800, 2.20), Pf(-0.950, 2.20, 1),
    Pf(-0.955, 2.6), Pf(-0.958, PI), Pf(-0.955, 2* PI- 2.6),
    Pf(-0.950, 2* PI- 2.20, 1), Pf(-0.800, 2* PI- 2.20), Pf(-0.600, 2* PI- 2.20), Pf(-0.420, 2* PI- 2.20, 1),
    Pf(-0.412, 2* PI- 2.6), Pf(-0.410, PI), Pf(-0.412, 2.6)
  ], {off: -0.004});

  const stop= nueva({id: 'stop', nombre: 'Stop trasero', grupo: 'luces', rol: 'luz', tipo: 'luz', explota: [-0.25, 0.1, 0]});
  agregar(stop, panel(S, [Pf(-0.952, 2.12, 1), Pf(-1.048, 2.12, 1), Pf(-1.048, 2* PI- 2.12, 1), Pf(-0.952, 2* PI- 2.12, 1)], {off: -0.001, borde: false}), C.ledRojo);

  const asientoP= nueva({id: 'asiento', nombre: 'Asiento del piloto', grupo: 'tanque', rol: 'asiento', hex: '#1c1c1e', acabado: 'cuero', explota: [0, 0.22, 0]});
  agregar(asientoP, solido(envolvente([
    [-0.138, 0.815, 0.802, 0.790, 0.012, 4, 4],
    [-0.152, 0.830, 0.806, 0.766, 0.066, 4, 4],
    [-0.200, 0.817, 0.796, 0.756, 0.096, 4, 4],
    [-0.300, 0.801, 0.781, 0.746, 0.130, 4, 4],
    [-0.400, 0.803, 0.783, 0.752, 0.137, 4, 4],
    [-0.455, 0.813, 0.793, 0.765, 0.117, 4, 4],
    [-0.476, 0.818, 0.802, 0.786, 0.012, 4, 4]
  ])));
  const asientoA= nueva({id: 'asiento-pas', nombre: 'Asiento del pasajero', grupo: 'tanque', rol: 'asiento', hex: '#1c1c1e', acabado: 'cuero', explota: [-0.06, 0.3, 0]});
  agregar(asientoA, solido(envolvente([
    [-0.462, 0.836, 0.830, 0.825, 0.010, 4, 4],
    [-0.476, 0.858, 0.838, 0.806, 0.080, 4, 4],
    [-0.520, 0.867, 0.846, 0.812, 0.104, 4, 4],
    [-0.620, 0.877, 0.857, 0.826, 0.099, 4, 4],
    [-0.720, 0.889, 0.869, 0.846, 0.085, 4, 4],
    [-0.772, 0.893, 0.876, 0.859, 0.060, 4, 4],
    [-0.788, 0.881, 0.876, 0.871, 0.010, 4, 4]
  ])));

  const guardaD= nueva({id: 'guarda-del', nombre: 'Guardabarro delantero', grupo: 'carenado', rol: 'base', hex: AZUL, explota: [0.14, -0.06, 0]});
  agregar(guardaD, panel(arco(0.69, 0.293, 0.316, 0.058, 0.036, a=> clamp((a- 0.46)/ 0.34, 0.32, 1)* clamp((2.52- a)/ 0.3, 0.55, 1)), [
    Pf(0.52, -1, 1), Pf(2.42, -1, 1), Pf(2.42, 1, 1), Pf(0.52, 1, 1), Pf(0.40, 0)
  ], {gro: 0.004}), conInterior(guardaD));

  const guardaT= nueva({id: 'guarda-tras', nombre: 'Guardabarro trasero', grupo: 'colin', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0, -0.04, 0]});
  agregar(guardaT, panel(arco(-0.69, 0.314, 0.338, 0.08, 0.05), [
    Pf(0.42, -1, 1), Pf(1.86, -1, 1), Pf(1.86, 1, 1), Pf(0.42, 1, 1)
  ], {gro: 0.004}), conInterior(guardaT));

  const placa= nueva({id: 'portaplaca', nombre: 'Portaplaca', grupo: 'colin', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [-0.2, -0.1, 0]});
  {
    const a= V3(-0.905, 0.805, 0), b= V3(-1.04, 0.672, 0);
    const sup= barrido(u=> a.clone().lerp(b, u), (u, f)=> {
      const c= Math.cos(f), s= Math.sin(f);
      return [lerp(0.06, 0.042, u)* Math.sign(c)* Math.pow(Math.abs(c), 0.4), 0.011* Math.sign(s)* Math.pow(Math.abs(s), 0.4)];
    });
    agregar(placa, solidoBarrido(sup, 16, 24));
    const marco= caja(0.012, 0.135, 0.2, 0.004, [0, 0, 0]);
    marco.rotateZ(-0.26);
    marco.translate(-1.058, 0.6, 0);
    agregar(placa, marco);
    const lamina= new THREE.PlaneGeometry(0.182, 0.118);
    lamina.rotateY(-PI/ 2);
    lamina.rotateZ(-0.26);
    lamina.translate(-1.0655, 0.598, 0);
    agregar(placa, lamina, C.placa);
  }

  const direccional= nueva({id: 'direccionales', nombre: 'Direccionales traseras', grupo: 'luces', rol: 'luz', tipo: 'luz', explota: [-0.2, -0.08, 0]});
  for (const s of [1, -1]){
    agregar(direccional, cilindro(V3(-0.95, 0.765, 0.045* s), V3(-0.955, 0.765, 0.105* s), 0.005, 0.005, 10), C.plastico);
    agregar(direccional, caja(0.034, 0.016, 0.028, 0.006, [-0.958, 0.765, 0.118* s]), C.ledAmbar);
  }

  const rr= 0.2159;
  function rueda(id, nombre, cx, cy, R, anchoL, anchoRin, delantera){
    const w= anchoRin/ 2;
    const rin= nueva({id: 'rin-'+ id, nombre: 'Rin '+ nombre, grupo: 'ruedas', rol: 'ruedas', hex: AZUL, acabado: 'brillante'});
    const perfilRin= [
      [rr+ 0.010, -w], [rr+ 0.012, -w+ 0.004], [rr+ 0.003, -w+ 0.008], [rr- 0.002, -w+ 0.012], [rr- 0.004, -0.018], [rr- 0.016, -0.010],
      [rr- 0.016, 0.010], [rr- 0.004, 0.018], [rr- 0.002, w- 0.012], [rr+ 0.003, w- 0.008], [rr+ 0.012, w- 0.004], [rr+ 0.010, w],
      [rr- 0.004, w+ 0.001], [rr- 0.020, w* 0.55], [rr- 0.024, 0], [rr- 0.020, -w* 0.55], [rr- 0.004, -w- 0.001], [rr+ 0.010, -w]
    ];
    const piezasRin= [torno(perfilRin, 96)];
    const rIn= 0.05, rOut= rr- 0.016;
    for (let k= 0; k< 5; k++){
      const s= new THREE.Shape();
      const pol= (r, a)=> [r* Math.cos(a), r* Math.sin(a)];
      s.moveTo(rIn, -0.017);
      s.quadraticCurveTo(0.09, -0.011, 0.128, -0.0105);
      s.lineTo(...pol(rOut, -0.165));
      s.lineTo(...pol(rOut, -0.085));
      s.quadraticCurveTo(0.17, -0.006, 0.152, 0);
      s.quadraticCurveTo(0.17, 0.006, ...pol(rOut, 0.085));
      s.lineTo(...pol(rOut, 0.165));
      s.lineTo(0.128, 0.0105);
      s.quadraticCurveTo(0.09, 0.011, rIn, 0.017);
      s.closePath();
      const g= extruir(s, 0.012, 0.0035, 8);
      g.rotateZ(k* 2* PI/ 5+ (delantera? 0.3: 0.9));
      piezasRin.push(g);
    }
    piezasRin.push(torno([[0.018, -0.05], [0.04, -0.05], [0.054, -0.036], [0.054, 0.036], [0.04, 0.05], [0.018, 0.05]], 40));
    const gr= unir(piezasRin);
    gr.translate(cx, cy, 0);
    agregar(rin, gr);
    const llanta= nueva({id: 'llanta-'+ id, nombre: 'Llanta '+ nombre, grupo: 'ruedas', rol: 'goma', hex: GOMA, acabado: 'goma'});
    const h= R- rr, Bh= h* 0.6;
    const perfil= [[rr+ 0.006, -anchoRin* 0.42]];
    for (let k= 0; k<= 28; k++){
      const t= -PI* 0.6+ PI* 1.2* k/ 28;
      perfil.push([R- Bh+ Bh* Math.cos(t), Math.sin(t)* anchoL/ 2]);
    }
    perfil.push([rr+ 0.006, anchoRin* 0.42]);
    const gl= torno(perfil, 120);
    gl.translate(cx, cy, 0);
    agregar(llanta, gl);
    return {rin, llanta};
  }

  const AX= V3(0.69, 0.293, 0), RX= V3(-0.69, 0.314, 0);
  rueda('del', 'delantero', AX.x, AX.y, 0.293, 0.112, 0.076, true);
  rueda('tras', 'trasero', RX.x, RX.y, 0.314, 0.142, 0.102, false);
  const nombreLlantas= piezas.filter(p=> p.id.startsWith('llanta-'));
  nombreLlantas[0].nombre= 'Llanta delantera';
  nombreLlantas[1].nombre= 'Llanta trasera';

  function discoGeo(rExt, rInt, ondas, filas){
    const s= new THREE.Shape();
    const n= 260;
    for (let i= 0; i<= n; i++){
      const a= 2* PI* i/ n;
      const r= rExt- 0.0032* (0.5+ 0.5* Math.cos(a* ondas));
      if (i=== 0) s.moveTo(r* Math.cos(a), r* Math.sin(a));
      else s.lineTo(r* Math.cos(a), r* Math.sin(a));
    }
    const hueco= new THREE.Path();
    hueco.absarc(0, 0, rInt, 0, 2* PI, true);
    s.holes.push(hueco);
    const banda= rExt- rInt;
    for (let f= 0; f< filas; f++){
      const rad= rInt+ banda* (0.3+ 0.42* f/ Math.max(filas- 1, 1));
      for (let k= 0; k< 14; k++){
        const a= 2* PI* (k+ f* 0.5)/ 14;
        const hp= new THREE.Path();
        hp.absarc(rad* Math.cos(a), rad* Math.sin(a), 0.0034, 0, 2* PI, true);
        s.holes.push(hp);
      }
    }
    return extruir(s, 0.0045, 0, 6);
  }
  function arana(r0, r1, brazos){
    const lista= [torno([[0.03, -0.004], [r0, -0.004], [r0, 0.004], [0.03, 0.004]], 40)];
    for (let k= 0; k< brazos; k++){
      const a= 2* PI* k/ brazos;
      const g= caja(r1- r0+ 0.012, 0.016, 0.007, 0.002, [(r0+ r1)/ 2- 0.004, 0, 0]);
      g.rotateZ(a);
      lista.push(g);
      const b= cilindro(V3((r1- 0.002)* Math.cos(a), (r1- 0.002)* Math.sin(a), -0.006), V3((r1- 0.002)* Math.cos(a), (r1- 0.002)* Math.sin(a), 0.006), 0.0065, 0.0065, 14);
      lista.push(b);
    }
    return unir(lista);
  }
  const discoD= nueva({id: 'disco-del', nombre: 'Disco de freno delantero', grupo: 'ruedas', rol: 'metal', hex: ACERO, acabado: 'metal'});
  {
    const g= discoGeo(0.149, 0.108, 22, 3);
    g.translate(AX.x, AX.y, 0.066);
    agregar(discoD, g);
    const a= arana(0.072, 0.112, 6);
    a.translate(AX.x, AX.y, 0.062);
    agregar(discoD, a, C.aluminio);
  }
  const discoT= nueva({id: 'disco-tras', nombre: 'Disco de freno trasero', grupo: 'ruedas', rol: 'metal', hex: ACERO, acabado: 'metal'});
  {
    const g= discoGeo(0.11, 0.07, 18, 2);
    g.translate(RX.x, RX.y, 0.078);
    agregar(discoT, g);
    const a= torno([[0.03, -0.004], [0.074, -0.004], [0.074, 0.004], [0.03, 0.004]], 40);
    a.translate(RX.x, RX.y, 0.074);
    agregar(discoT, a, C.aluminio);
  }
  const rake= 25* PI/ 180;
  const u= V3(-Math.sin(rake), Math.cos(rake), 0);
  const atras= V3(-Math.cos(rake), -Math.sin(rake), 0);
  const enHorquilla= (t, z= 0)=> AX.clone().addScaledVector(u, t).setZ(z);

  const caliperD= nueva({id: 'caliper-del', nombre: 'Caliper delantero', grupo: 'ruedas', rol: 'freno', hex: '#3a3d42', acabado: 'anodizado'});
  {
    const a= PI* 0.8, rc= 0.128;
    const g= caja(0.082, 0.05, 0.05, 0.012, [0, 0, 0]);
    g.rotateZ(a+ PI/ 2);
    g.translate(AX.x+ Math.cos(a)* rc, AX.y+ Math.sin(a)* rc, 0.07);
    agregar(caliperD, g);
    const pz= caja(0.03, 0.03, 0.02, 0.006, [0, 0, 0]);
    pz.rotateZ(a);
    pz.translate(AX.x+ Math.cos(a)* (rc+ 0.03), AX.y+ Math.sin(a)* (rc+ 0.03), 0.088);
    agregar(caliperD, pz);
  }
  const caliperT= nueva({id: 'caliper-tras', nombre: 'Caliper trasero', grupo: 'ruedas', rol: 'freno', hex: '#3a3d42', acabado: 'anodizado'});
  {
    const a= -PI* 0.3, rc= 0.092;
    const g= caja(0.06, 0.04, 0.042, 0.01, [0, 0, 0]);
    g.rotateZ(a+ PI/ 2);
    g.translate(RX.x+ Math.cos(a)* rc, RX.y+ Math.sin(a)* rc, 0.082);
    agregar(caliperT, g);
    const br= caja(0.13, 0.03, 0.008, 0.004, [0, 0, 0]);
    br.rotateZ(a+ 0.6);
    br.translate(RX.x+ Math.cos(a)* 0.05, RX.y+ Math.sin(a)* 0.05, 0.096);
    agregar(caliperT, br, C.oscuro);
  }

  const catalina= nueva({id: 'catalina', nombre: 'Catalina (sprocket)', grupo: 'ruedas', rol: 'metal', hex: '#c7cace', acabado: 'anodizado'});
  {
    const dientes= 42, rRaiz= 0.1, alto= 0.0075;
    const s= new THREE.Shape();
    const n= dientes* 8;
    for (let i= 0; i<= n; i++){
      const a= 2* PI* i/ n;
      const fr= (i% 8)/ 8;
      const perfil= fr< 0.2? 0: fr< 0.4? (fr- 0.2)/ 0.2: fr< 0.6? 1: fr< 0.8? 1- (fr- 0.6)/ 0.2: 0;
      const r= rRaiz+ alto* perfil;
      if (i=== 0) s.moveTo(r* Math.cos(a), r* Math.sin(a));
      else s.lineTo(r* Math.cos(a), r* Math.sin(a));
    }
    const centro= new THREE.Path();
    centro.absarc(0, 0, 0.034, 0, 2* PI, true);
    s.holes.push(centro);
    for (let k= 0; k< 5; k++){
      const a0= 2* PI* k/ 5+ 0.25, a1= a0+ 2* PI/ 5- 0.5;
      const hp= new THREE.Path();
      hp.absarc(0, 0, 0.082, a0, a1, false);
      hp.absarc(0, 0, 0.05, a1, a0, true);
      hp.closePath();
      s.holes.push(hp);
    }
    const g= extruir(s, 0.006, 0.0008, 6);
    g.translate(RX.x, RX.y, -0.084);
    agregar(catalina, g);
  }

  const cadena= nueva({id: 'cadena', nombre: 'Cadena', grupo: 'ruedas', rol: 'metal', hex: '#3c3e42', acabado: 'metal'});
  const PIN= V3(-0.072, 0.385, 0);
  {
    const c1= PIN, r1= 0.036, c2= RX, r2= 0.106;
    const d= new THREE.Vector2(c2.x- c1.x, c2.y- c1.y);
    const L= d.length(), al= Math.atan2(d.y, d.x);
    const be= Math.acos((r1- r2)/ L);
    const tSup= al+ be, tInf= al- be;
    const camino= [];
    const arcoPts= (c, r, a0, a1, n)=> { for (let i= 0; i<= n; i++){ const a= lerp(a0, a1, i/ n); camino.push(new THREE.Vector2(c.x+ r* Math.cos(a), c.y+ r* Math.sin(a))); } };
    arcoPts(c2, r2, tInf, tSup, 60);
    arcoPts(c1, r1, tSup, tInf+ 2* PI, 30);
    camino.push(camino[0].clone());
    const acum= [0];
    for (let i= 1; i< camino.length; i++) acum.push(acum[i- 1]+ camino[i].distanceTo(camino[i- 1]));
    const tot= acum[acum.length- 1];
    const paso= 0.0159;
    const nEsl= Math.round(tot/ paso);
    const enLargo= s=> {
      let k= 0;
      while (k< acum.length- 2&& acum[k+ 1]< s) k++;
      const t= (s- acum[k])/ Math.max(acum[k+ 1]- acum[k], 1e-9);
      return camino[k].clone().lerp(camino[k+ 1], t);
    };
    const lista= [];
    for (let i= 0; i< nEsl; i++){
      const s0= tot* i/ nEsl, s1= tot* (i+ 1)/ nEsl;
      const p0= enLargo(s0), p1= enLargo(s1);
      const ang= Math.atan2(p1.y- p0.y, p1.x- p0.x);
      const mid= p0.clone().lerp(p1, 0.5);
      for (const z of [-0.0058, 0.0058]){
        const pl= caja(0.021, 0.0085, 0.0016, 0.0007, [0, 0, 0], 0, 1);
        pl.rotateZ(ang);
        pl.translate(mid.x, mid.y, -0.084+ z* (i% 2? 1.18: 1));
        lista.push(pl);
      }
      const ro= new THREE.CylinderGeometry(0.0036, 0.0036, 0.009, 8);
      ro.rotateX(PI/ 2);
      ro.translate(p0.x, p0.y, -0.084);
      lista.push(ro);
    }
    agregar(cadena, unir(lista));
  }

  const cubreCadena= nueva({id: 'cubre-cadena', nombre: 'Cubre cadena', grupo: 'colin', rol: 'oscuro', hex: NEGRO, acabado: 'satinado', explota: [0, 0.02, -0.14]});
  {
    const a= V3(-0.30, 0.452, -0.088), b= V3(-0.62, 0.44, -0.088);
    const sup= barrido(t=> a.clone().lerp(b, t), (t, f)=> {
      const c= Math.cos(f), s= Math.sin(f);
      return [0.017* Math.sign(c)* Math.pow(Math.abs(c), 0.5), 0.006* s+ 0.004];
    });
    agregar(cubreCadena, solidoBarrido(sup, 12, 20));
  }

  const barras= nueva({id: 'barras', nombre: 'Barras de la horquilla', grupo: 'chasis', rol: 'metal', hex: '#e2e4e8', acabado: 'cromado'});
  const botellas= nueva({id: 'botellas', nombre: 'Botellas de la horquilla', grupo: 'chasis', rol: 'chasis', hex: GRAFITO, acabado: 'satinado'});
  const tijeras= nueva({id: 'tijeras', nombre: 'Tijeras de la dirección', grupo: 'chasis', rol: 'chasis', hex: GRAFITO, acabado: 'satinado'});
  for (const z of [0.098, -0.098]){
    agregar(barras, cilindro(enHorquilla(0.37, z), enHorquilla(0.718, z), 0.0205, 0.0205, 24));
    agregar(botellas, cilindro(enHorquilla(-0.03, z), enHorquilla(0.40, z), 0.031, 0.029, 24));
    agregar(botellas, cilindro(enHorquilla(0.395, z), enHorquilla(0.418, z), 0.027, 0.024, 24), C.goma);
    agregar(botellas, cilindro(V3(AX.x, AX.y, z- 0.03* Math.sign(z)), V3(AX.x, AX.y, z+ 0.034* Math.sign(z)), 0.026, 0.026, 18));
    agregar(tijeras, cilindro(enHorquilla(0.712, z), enHorquilla(0.728, z), 0.019, 0.017, 18), C.aluminio);
  }
  agregar(botellas, cilindro(V3(AX.x, AX.y, -0.14), V3(AX.x, AX.y, 0.14), 0.011, 0.011, 14), C.acero);
  for (const t of [0.53, 0.676]){
    const g= caja(0.085, 0.03, 0.27, 0.012, [0, 0, 0]);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), u));
    const c= enHorquilla(t).addScaledVector(atras, 0.022);
    g.translate(c.x, c.y, c.z);
    agregar(tijeras, g);
  }
  agregar(tijeras, cilindro(enHorquilla(0.69).addScaledVector(atras, 0.03), enHorquilla(0.71).addScaledVector(atras, 0.03), 0.016, 0.014, 6), C.aluminio);

  const chasis= nueva({id: 'chasis', nombre: 'Chasis', grupo: 'chasis', rol: 'chasis', hex: GRAFITO, acabado: 'satinado'});
  const cab= enHorquilla(0.6).addScaledVector(atras, 0.03);
  agregar(chasis, cilindro(cab.clone().addScaledVector(u, -0.08), cab.clone().addScaledVector(u, 0.08), 0.03, 0.03, 20));
  const sup0= cab.clone().addScaledVector(u, 0.055), inf0= cab.clone().addScaledVector(u, -0.06);
  const ladoTubo= s=> {
    const sup= [V3(sup0.x, sup0.y, 0.03* s), V3(0.30, 0.80, 0.09* s), V3(0.15, 0.725, 0.112* s), V3(0.0, 0.68, 0.118* s), V3(-0.10, 0.622, 0.114* s), V3(-0.136, 0.56, 0.114* s)];
    const inf= [V3(inf0.x, inf0.y, 0.03* s), V3(0.35, 0.735, 0.095* s), V3(0.285, 0.625, 0.11* s), V3(0.235, 0.515, 0.11* s)];
    const lista= [tubo(sup, 0.0155, 60, 10), tubo(inf, 0.0155, 30, 10)];
    const cs= new THREE.CatmullRomCurve3(sup, false, 'centripetal'), ci= new THREE.CatmullRomCurve3(inf, false, 'centripetal');
    lista.push(cilindro(cs.getPoint(0.22), ci.getPoint(0.62), 0.011, 0.011, 10));
    lista.push(cilindro(cs.getPoint(0.36), ci.getPoint(1), 0.011, 0.011, 10));
    lista.push(cilindro(cs.getPoint(0.5), V3(0.13, 0.49, 0.11* s), 0.011, 0.011, 10));
    lista.push(cilindro(V3(0.0, 0.68, 0.116* s), V3(-0.02, 0.48, 0.11* s), 0.012, 0.012, 10));
    const placa= extruir(formaPoligono([[-0.158, 0.6], [-0.095, 0.605], [-0.052, 0.52], [-0.05, 0.37], [-0.098, 0.33], [-0.152, 0.36], [-0.17, 0.5]]), 0.012, 0.003);
    placa.translate(0, 0, 0.122* s);
    lista.push(placa);
    return lista;
  };
  agregar(chasis, unir([...ladoTubo(1), ...ladoTubo(-1), cilindro(V3(-0.1, 0.42, -0.135), V3(-0.1, 0.42, 0.135), 0.013, 0.013, 14)]));

  const subchasis= nueva({id: 'subchasis', nombre: 'Subchasis', grupo: 'chasis', rol: 'chasis', hex: GRAFITO, acabado: 'satinado'});
  {
    const lista= [];
    for (const s of [1, -1]){
      lista.push(tubo([V3(-0.12, 0.64, 0.105* s), V3(-0.4, 0.705, 0.088* s), V3(-0.65, 0.76, 0.07* s), V3(-0.86, 0.805, 0.05* s)], 0.011, 40, 8));
      lista.push(tubo([V3(-0.136, 0.565, 0.112* s), V3(-0.3, 0.62, 0.092* s), V3(-0.52, 0.71, 0.078* s)], 0.0105, 30, 8));
    }
    lista.push(cilindro(V3(-0.8, 0.795, -0.056), V3(-0.8, 0.795, 0.056), 0.01, 0.01, 8));
    agregar(subchasis, unir(lista));
  }

  const PIV= V3(-0.10, 0.42, 0);
  const basculante= nueva({id: 'basculante', nombre: 'Basculante', grupo: 'chasis', rol: 'chasis', hex: '#9da2a8', acabado: 'satinado'});
  {
    const lista= [];
    for (const z of [0.108, -0.114]){
      const a= V3(PIV.x, PIV.y, z), b= V3(RX.x+ 0.01, RX.y, z);
      const sup= barrido(t=> a.clone().lerp(b, t), (t, f)=> {
        const c= Math.cos(f), s= Math.sin(f);
        return [0.018* Math.sign(c)* Math.pow(Math.abs(c), 0.5), lerp(0.04, 0.026, t)* Math.sign(s)* Math.pow(Math.abs(s), 0.5)];
      });
      lista.push(solidoBarrido(sup, 20, 24));
      lista.push(caja(0.04, 0.03, 0.026, 0.006, [RX.x+ 0.005, RX.y, z]));
    }
    const brace= caja(0.05, 0.06, 0.22, 0.012, [0, 0, 0]);
    brace.rotateZ(Math.atan2(RX.y- PIV.y, RX.x- PIV.x)+ PI);
    brace.translate(-0.195, 0.405, -0.003);
    lista.push(brace);
    lista.push(cilindro(V3(PIV.x, PIV.y, -0.13), V3(PIV.x, PIV.y, 0.13), 0.021, 0.021, 18));
    agregar(basculante, unir(lista));
    agregar(basculante, cilindro(V3(RX.x, RX.y, -0.135), V3(RX.x, RX.y, 0.135), 0.0115, 0.0115, 14), C.acero);
  }

  const resorte= nueva({id: 'resorte', nombre: 'Resorte del amortiguador', grupo: 'chasis', rol: 'acento', hex: '#d0282e', acabado: 'brillante'});
  const amort= nueva({id: 'amortiguador', nombre: 'Amortiguador', grupo: 'chasis', rol: 'metal', hex: '#3a3d42', acabado: 'satinado'});
  {
    const a= V3(-0.212, 0.448, 0), b= V3(-0.162, 0.668, 0);
    const d= new THREE.Vector3().subVectors(b, a).normalize();
    agregar(amort, cilindro(a, b, 0.017, 0.022, 16));
    agregar(amort, cilindro(a.clone().addScaledVector(d, -0.02), a.clone().addScaledVector(d, 0.025), 0.012, 0.012, 12), C.aluminio);
    agregar(amort, cilindro(b.clone().addScaledVector(d, -0.03), b.clone().addScaledVector(d, 0.02), 0.026, 0.026, 16), C.aluminio);
    const q= new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d);
    const pts= [];
    const vueltas= 7.5, L= a.distanceTo(b)- 0.07;
    for (let i= 0; i<= 240; i++){
      const t= i/ 240, ang= t* vueltas* 2* PI;
      pts.push(V3(0.031* Math.cos(ang), 0.02+ t* L, 0.031* Math.sin(ang)).applyQuaternion(q).add(a));
    }
    agregar(resorte, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 480, 0.0058, 8, false));
  }

  const motor= nueva({id: 'motor', nombre: 'Bloque del motor', grupo: 'motor', rol: 'motor', hex: '#25272b', acabado: 'satinado'});
  const cil= 25* PI/ 180;
  const dcil= V3(Math.sin(cil), Math.cos(cil), 0);
  const baseCil= V3(0.17, 0.46, 0);
  const enCil= t=> baseCil.clone().addScaledVector(dcil, t);
  {
    const lista= [];
    lista.push(caja(0.24, 0.25, 0.25, 0.045, [0.16, 0.345, 0]));
    lista.push(caja(0.17, 0.22, 0.15, 0.035, [0.005, 0.36, 0]));
    lista.push(caja(0.28, 0.06, 0.19, 0.022, [0.1, 0.236, 0]));
    const blo= caja(0.108, 0.125, 0.236, 0.016, [0, 0, 0]);
    blo.rotateZ(-cil);
    const cb= enCil(0.06);
    blo.translate(cb.x, cb.y, 0);
    lista.push(blo);
    for (let k= 0; k< 5; k++){
      const ale= caja(0.122, 0.006, 0.25, 0.002, [0, 0, 0], 0, 1);
      ale.rotateZ(-cil);
      const ca= enCil(0.02+ k* 0.022);
      ale.translate(ca.x, ca.y, 0);
      lista.push(ale);
    }
    const cul= caja(0.116, 0.062, 0.244, 0.014, [0, 0, 0]);
    cul.rotateZ(-cil);
    const cc= enCil(0.152);
    cul.translate(cc.x, cc.y, 0);
    lista.push(cul);
    lista.push(cilindro(V3(-0.03, 0.5, -0.07), V3(-0.03, 0.5, 0.06), 0.028, 0.028, 16));
    agregar(motor, unir(lista));
  }
  const valvulas= nueva({id: 'tapa-valvulas', nombre: 'Tapa de válvulas', grupo: 'motor', rol: 'motor', hex: '#bfc3c9', acabado: 'metalizado'});
  {
    const g= caja(0.104, 0.038, 0.226, 0.016, [0, 0, 0]);
    g.rotateZ(-cil);
    const c= enCil(0.2);
    g.translate(c.x, c.y, 0);
    agregar(valvulas, g);
  }
  const domo= (r, h)=> torno([[r, 0], [r, h* 0.25], [r* 0.94, h* 0.62], [r* 0.78, h* 0.9], [r* 0.45, h], [0, h]], 48);
  const clutch= nueva({id: 'tapa-clutch', nombre: 'Tapa del clutch', grupo: 'motor', rol: 'motor', hex: '#bfc3c9', acabado: 'metalizado', explota: [0, 0, 0.12]});
  {
    const g= domo(0.084, 0.04);
    g.translate(0.025, 0.35, 0.116);
    agregar(clutch, g);
    agregar(motor, cilindro(V3(0.025, 0.35, 0.07), V3(0.025, 0.35, 0.118), 0.088, 0.088, 40));
  }
  const alternador= nueva({id: 'tapa-alternador', nombre: 'Tapa del alternador', grupo: 'motor', rol: 'motor', hex: '#bfc3c9', acabado: 'metalizado', explota: [0, 0, -0.12]});
  {
    const g= domo(0.084, 0.04);
    g.translate(0.18, 0.36, 0.122);
    agregar(alternador, espejo(g));
  }
  const tapaPinon= nueva({id: 'tapa-pinon', nombre: 'Tapa del piñón', grupo: 'motor', rol: 'motor', hex: '#25272b', acabado: 'satinado', explota: [0, 0, -0.1]});
  agregar(tapaPinon, caja(0.11, 0.1, 0.022, 0.012, [-0.072, 0.39, -0.135]));

  const radiador= nueva({id: 'radiador', nombre: 'Radiador', grupo: 'motor', rol: 'oscuro', hex: '#1d1e21', acabado: 'satinado'});
  {
    const inc= 0.21;
    const g= caja(0.032, 0.31, 0.29, 0.008, [0, 0, 0]);
    g.rotateZ(inc);
    g.translate(0.365, 0.565, 0);
    agregar(radiador, g);
    const panalG= new THREE.PlaneGeometry(0.28, 0.29);
    panalG.rotateY(PI/ 2);
    panalG.rotateZ(inc);
    panalG.translate(0.365+ Math.cos(inc)* 0.0165, 0.565+ Math.sin(inc)* 0.0165, 0);
    agregar(radiador, panalG, C.radiador);
    for (const s of [1, -1]){
      const t= caja(0.04, 0.32, 0.024, 0.008, [0, 0, 0]);
      t.rotateZ(inc);
      t.translate(0.362, 0.565, 0.152* s);
      agregar(radiador, t);
    }
    agregar(radiador, tubo([V3(0.33, 0.70, 0.06), V3(0.30, 0.68, 0.07), V3(0.27, 0.64, 0.07)], 0.012, 12, 8), C.goma);
  }

  const colector= nueva({id: 'colector', nombre: 'Colector del escape', grupo: 'motor', rol: 'metal', hex: TITANIO, acabado: 'metal'});
  {
    const lista= [];
    for (const z of [0.055, -0.055]){
      const sal= enCil(0.13).addScaledVector(V3(Math.cos(cil), -Math.sin(cil), 0), 0.056);
      lista.push(tubo([V3(sal.x, sal.y, z), V3(sal.x+ 0.04, sal.y- 0.06, z* 1.05), V3(0.33, 0.38, z* 1.1), V3(0.31, 0.26, z), V3(0.24, 0.205, z* 0.8), V3(0.14, 0.198, z* 0.4)], 0.018, 50, 12));
    }
    const pre= barrido(t=> V3(lerp(0.16, -0.13, t), lerp(0.196, 0.205, t), 0), (t, f)=> {
      const k= Math.min(1, Math.sin(PI* t)* 1.6+ 0.35);
      return [0.07* k* Math.cos(f), 0.03* k* Math.sin(f)];
    });
    lista.push(solidoBarrido(pre, 20, 24));
    lista.push(tubo([V3(-0.12, 0.205, 0.02), V3(-0.2, 0.235, 0.09), V3(-0.25, 0.275, 0.15), V3(-0.272, 0.298, 0.172)], 0.02, 24, 12));
    agregar(colector, unir(lista));
  }
  const escape= nueva({id: 'escape', nombre: 'Silenciador del escape', grupo: 'motor', rol: 'oscuro', hex: '#202124', acabado: 'satinado', explota: [-0.04, 0, 0.1]});
  const protector= nueva({id: 'protector', nombre: 'Protector del escape', grupo: 'motor', rol: 'acento', hex: '#2a2a2c', acabado: 'carbono', explota: [-0.04, 0, 0.16]});
  {
    const a= V3(-0.255, 0.3, 0.176), b= V3(-0.585, 0.458, 0.2);
    const sec= (t, f)=> {
      const k= t< 0.12? 0.72+ 0.28* Math.sin(t/ 0.12* PI/ 2): 1- Math.max(0, t- 0.9)* 0.8;
      const c= Math.cos(f), s= Math.sin(f);
      return [0.056* k* Math.sign(c)* Math.pow(Math.abs(c), 0.62), 0.042* k* Math.sign(s)* Math.pow(Math.abs(s), 0.62)];
    };
    const sup= barrido(t=> a.clone().lerp(b, t), sec, V3(0, 0, 1));
    agregar(escape, solidoBarrido(sup, 36, 36));
    const tapa= barrido(t=> b.clone().lerp(b.clone().add(new THREE.Vector3().subVectors(b, a).normalize().multiplyScalar(0.03)), t), (t, f)=> {
      const k= 0.92- t* 0.25;
      const c= Math.cos(f), s= Math.sin(f);
      return [0.056* k* Math.sign(c)* Math.pow(Math.abs(c), 0.62), 0.042* k* Math.sign(s)* Math.pow(Math.abs(s), 0.62)];
    }, V3(0, 0, 1));
    agregar(escape, solidoBarrido(tapa, 4, 36), C.titanio);
    const dir= new THREE.Vector3().subVectors(b, a).normalize();
    const fin= b.clone().addScaledVector(dir, 0.03);
    for (const k of [-1, 1]){
      const o= fin.clone().add(V3(0, 0.016* k, 0));
      agregar(escape, cilindro(o.clone().addScaledVector(dir, -0.02), o.clone().addScaledVector(dir, 0.012), 0.011, 0.011, 16, true), C.titanio);
    }
    agregar(protector, panel(sup, [Pf(0.16, PI/ 2- 0.62, 1), Pf(0.86, PI/ 2- 0.62, 1), Pf(0.86, PI/ 2+ 0.5, 1), Pf(0.16, PI/ 2+ 0.5, 1)], {off: 0.005, gro: 0.004}), conInterior(protector));
  }

  const manubrio= nueva({id: 'manubrio', nombre: 'Manubrio', grupo: 'mandos', rol: 'oscuro', hex: NEGRO, acabado: 'satinado'});
  const punos= nueva({id: 'punos', nombre: 'Puños', grupo: 'mandos', rol: 'goma', hex: GOMA, acabado: 'goma'});
  const manetas= nueva({id: 'manetas', nombre: 'Manetas', grupo: 'mandos', rol: 'metal', hex: '#bfc3c9', acabado: 'anodizado'});
  for (const s of [1, -1]){
    const c= enHorquilla(0.655, 0.098* s);
    agregar(manubrio, cilindro(c.clone().addScaledVector(u, -0.02), c.clone().addScaledVector(u, 0.02), 0.03, 0.03, 18));
    const a0= V3(c.x- 0.01, c.y- 0.004, 0.12* s), a1= V3(c.x- 0.075, c.y- 0.032, 0.345* s);
    agregar(manubrio, cilindro(V3(c.x, c.y, 0.1* s), a0, 0.016, 0.012, 14));
    agregar(manubrio, cilindro(a0, a1, 0.011, 0.011, 14));
    const dir= new THREE.Vector3().subVectors(a1, a0).normalize();
    const p0= a0.clone().addScaledVector(dir, 0.105), p1= a0.clone().addScaledVector(dir, 0.222);
    agregar(punos, cilindro(p0, p1, 0.0175, 0.0175, 20));
    agregar(punos, cilindro(p1, p1.clone().addScaledVector(dir, 0.006), 0.019, 0.019, 20));
    agregar(manubrio, cilindro(p1.clone().addScaledVector(dir, 0.006), p1.clone().addScaledVector(dir, 0.03), 0.016, 0.014, 18), C.aluminio);
    const sw= a0.clone().addScaledVector(dir, 0.075);
    agregar(manubrio, caja(0.05, 0.042, 0.05, 0.012, [sw.x, sw.y, sw.z]), C.plastico);
    const piv= a0.clone().addScaledVector(dir, 0.09).add(V3(0.045, 0.002, 0));
    agregar(manetas, tubo([piv, piv.clone().add(V3(0.022, -0.004, 0.04* s)), piv.clone().add(V3(0.03, -0.01, 0.1* s)), piv.clone().add(V3(0.026, -0.018, 0.16* s))], 0.0055, 24, 8));
    if (s> 0){
      agregar(manubrio, caja(0.05, 0.03, 0.035, 0.008, [a0.x+ 0.03, a0.y+ 0.012, 0.15]), C.plastico);
      agregar(manubrio, cilindro(V3(a0.x+ 0.03, a0.y+ 0.03, 0.15), V3(a0.x+ 0.03, a0.y+ 0.065, 0.15), 0.016, 0.016, 14), C.plastico);
      agregar(manubrio, tubo([V3(a0.x+ 0.03, a0.y, 0.13), V3(0.47, 0.74, 0.13), V3(0.6, 0.5, 0.115), V3(AX.x+ Math.cos(PI* 0.8)* 0.17, AX.y+ Math.sin(PI* 0.8)* 0.17, 0.1)], 0.0045, 40, 6), C.goma);
    }
  }

  const tablero= nueva({id: 'tablero', nombre: 'Tablero', grupo: 'mandos', rol: 'oscuro', hex: NEGRO, acabado: 'satinado'});
  {
    const g= caja(0.04, 0.098, 0.168, 0.012, [0, 0, 0]);
    g.rotateZ(-0.72);
    g.translate(0.462, 0.958, 0);
    agregar(tablero, g);
    const pa= new THREE.PlaneGeometry(0.15, 0.075);
    pa.rotateY(-PI/ 2);
    pa.rotateZ(-0.72);
    pa.translate(0.462- Math.cos(0.72)* 0.0205, 0.958+ Math.sin(0.72)* 0.0205, 0);
    agregar(tablero, pa, C.pantalla);
  }

  par({id: 'espejo', nombres: ['Espejo derecho', 'Espejo izquierdo'], grupo: 'mandos', rol: 'oscuro', hex: NEGRO, acabado: 'brillante', explota: [0.04, 0.06, 0.12]}, (p, s)=> {
    const base= V3(0.592, 0.952, 0.14* s);
    const cen= V3(0.575, 1.0, 0.31* s);
    agregar(p, tubo([base, V3(0.585, 0.975, 0.23* s), V3(0.578, 0.99, 0.27* s)], 0.008, 16, 8), C.plastico);
    const g= caja(0.042, 0.064, 0.13, 0.016, [cen.x, cen.y, cen.z]);
    agregar(p, g);
    const vid= new THREE.PlaneGeometry(0.118, 0.052);
    vid.rotateY(-PI/ 2);
    vid.translate(cen.x- 0.0215, cen.y, cen.z);
    agregar(p, vid, C.espejo);
    agregar(p, caja(0.004, 0.009, 0.1, 0.002, [cen.x+ 0.021, cen.y- 0.016, cen.z]), C.ledAmbar);
  });

  par({id: 'estribera', nombres: ['Estribera derecha', 'Estribera izquierda'], grupo: 'mandos', rol: 'metal', hex: '#c3c6cb', acabado: 'metal', explota: [0, 0, 0.1]}, (p, s)=> {
    const pl= extruir(formaPoligono([[-0.12, 0.565], [-0.082, 0.54], [-0.142, 0.4], [-0.168, 0.34], [-0.2, 0.352], [-0.17, 0.44], [-0.152, 0.555]]), 0.008, 0.002);
    pl.translate(0, 0, 0.148* s);
    agregar(p, pl);
    agregar(p, cilindro(V3(-0.18, 0.352, 0.15* s), V3(-0.18, 0.352, 0.232* s), 0.011, 0.011, 14), C.goma);
    const pp= extruir(formaPoligono([[-0.34, 0.66], [-0.31, 0.64], [-0.4, 0.47], [-0.44, 0.452], [-0.452, 0.48], [-0.37, 0.62]]), 0.007, 0.002);
    pp.translate(0, 0, 0.142* s);
    agregar(p, pp);
    agregar(p, cilindro(V3(-0.437, 0.466, 0.142* s), V3(-0.437, 0.466, 0.215* s), 0.0095, 0.0095, 12), C.goma);
    if (s> 0){
      agregar(p, tubo([V3(-0.17, 0.375, 0.165), V3(-0.115, 0.356, 0.172), V3(-0.07, 0.338, 0.178)], 0.0065, 14, 8));
      agregar(p, caja(0.03, 0.008, 0.03, 0.003, [-0.066, 0.336, 0.188]), C.goma);
    }
    else {
      agregar(p, tubo([V3(-0.13, 0.43, -0.168), V3(-0.1, 0.418, -0.172), V3(-0.072, 0.405, -0.176)], 0.006, 14, 8));
      agregar(p, cilindro(V3(-0.072, 0.405, -0.176), V3(-0.072, 0.405, -0.212), 0.007, 0.007, 10), C.goma);
    }
  });

  const pata= nueva({id: 'pata', nombre: 'Pata lateral', grupo: 'chasis', rol: 'chasis', hex: GRAFITO, acabado: 'satinado'});
  agregar(pata, unir([tubo([V3(-0.11, 0.33, -0.13), V3(-0.2, 0.3, -0.142), V3(-0.31, 0.29, -0.146)], 0.0095, 16, 8), caja(0.04, 0.008, 0.03, 0.003, [-0.315, 0.288, -0.147])]));

  const centro= new THREE.Box3().setFromObject(raiz);
  for (const p of piezas){
    p.obj.updateMatrixWorld(true);
    const b= new THREE.Box3().setFromObject(p.obj);
    p.centro= b.getCenter(new THREE.Vector3());
    p.caja= b;
    p.tris= 0;
    p.obj.traverse(o=> { if (o.isMesh) p.tris+= (o.geometry.index? o.geometry.index.count: o.geometry.attributes.position.count)/ 3; });
  }
  return {raiz, piezas, caja: centro};
}
