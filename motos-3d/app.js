import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutlinePass} from 'three/addons/postprocessing/OutlinePass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {HorizontalBlurShader} from 'three/addons/shaders/HorizontalBlurShader.js';
import {VerticalBlurShader} from 'three/addons/shaders/VerticalBlurShader.js';
import {crearMoto, GRUPOS, ACABADOS, aplicarAcabado} from './moto.js?v=20261121b';

const $= id=> document.getElementById(id);
const esc= s=> String(s).replace(/[&<>"']/g, c=> ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
const reducido= matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactil= matchMedia('(pointer: coarse)').matches;
const guardado= {
  leer(k, d){ try{ const v= localStorage.getItem(k); return v=== null? d: JSON.parse(v); }catch(e){ return d; } },
  poner(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const sinTildes= s=> s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const PALETA= [
  ['Negro', '#121316'], ['Grafito', '#2b2d31'], ['Gris', '#6b6f75'], ['Plata', '#b9bdc4'], ['Blanco', '#f1f1ec'],
  ['Azul racing', '#1b3aa6'], ['Azul noche', '#13235b'], ['Celeste', '#35a3e6'], ['Cian', '#12b5c9'], ['Verde', '#138a4a'],
  ['Verde lima', '#6fbf2b'], ['Amarillo', '#f2c200'], ['Dorado', '#c9a43a'], ['Naranja', '#f0641a'], ['Rojo', '#c4161c'],
  ['Vino', '#6e1020'], ['Rosado', '#e0508e'], ['Morado', '#5b2d8e']
];
const VISIBLES= ['brillante', 'metalizado', 'satinado', 'mate', 'cromado', 'anodizado', 'tornasol', 'carbono'];
const MUESTRA_ACABADO= {
  brillante: 'radial-gradient(circle at 35% 30%,#fff 0 12%,#3c5bd0 30%,#14266e 100%)',
  metalizado: 'radial-gradient(circle at 35% 30%,#fff 0 10%,#8fa0b8 28%,#3e4756 100%)',
  satinado: 'radial-gradient(circle at 35% 30%,#d9dce2 0 14%,#7b8494 50%,#4a515d 100%)',
  mate: 'linear-gradient(#5a5f69,#41454d)',
  cromado: 'linear-gradient(160deg,#fff 0 20%,#9aa3ad 38%,#f4f6f8 55%,#59616b 80%,#cfd5db 100%)',
  anodizado: 'radial-gradient(circle at 35% 30%,#fff 0 8%,#d1a43b 32%,#6e4f12 100%)',
  tornasol: 'conic-gradient(from 30deg,#6b5bd6,#28c2d8,#9ee06b,#e8b13a,#d6467a,#6b5bd6)',
  carbono: 'repeating-linear-gradient(45deg,#1c1c1e 0 4px,#4a4a4e 4px 8px)'
};
const LETRA= {brillante: 'b', metalizado: 'm', satinado: 's', mate: 't', cromado: 'c', anodizado: 'a', tornasol: 'i', carbono: 'k', goma: 'g', cuero: 'u', metal: 'l', vidrio: 'v'};
const DE_LETRA= Object.fromEntries(Object.entries(LETRA).map(([k, v])=> [v, k]));
const ROLES= {
  base: 'Color principal', detalle: 'Detalles', acento: 'Acentos', oscuro: 'Partes negras',
  ruedas: 'Rines', chasis: 'Chasis y basculante', motor: 'Motor', freno: 'Calipers', asiento: 'Asientos'
};
const COMBOS= [
  {nombre: 'Azul de pista', r: {base: ['#1b3aa6', 'brillante'], detalle: ['#b9bdc4', 'metalizado'], acento: ['#35a3e6', 'brillante'], oscuro: ['#141518', 'satinado'], ruedas: ['#1b3aa6', 'brillante'], chasis: ['#2b2d31', 'satinado'], freno: ['#3a3d42', 'anodizado']}},
  {nombre: 'Medianoche', r: {base: ['#141518', 'mate'], detalle: ['#2b2d31', 'satinado'], acento: ['#d81f26', 'brillante'], oscuro: ['#0d0d0f', 'mate'], ruedas: ['#d81f26', 'brillante'], chasis: ['#141518', 'mate'], freno: ['#d81f26', 'anodizado']}},
  {nombre: 'Blanco perla', r: {base: ['#f1f1ec', 'brillante'], detalle: ['#1b3aa6', 'brillante'], acento: ['#d81f26', 'brillante'], oscuro: ['#141518', 'satinado'], ruedas: ['#1b3aa6', 'brillante'], chasis: ['#2b2d31', 'satinado'], freno: ['#c9a43a', 'anodizado']}},
  {nombre: 'Verde lima', r: {base: ['#6fbf2b', 'brillante'], detalle: ['#141518', 'brillante'], acento: ['#f1f1ec', 'brillante'], oscuro: ['#141518', 'mate'], ruedas: ['#6fbf2b', 'brillante'], chasis: ['#141518', 'satinado'], freno: ['#6fbf2b', 'anodizado']}},
  {nombre: 'Naranja fuego', r: {base: ['#f0641a', 'brillante'], detalle: ['#1c1d21', 'satinado'], acento: ['#f1f1ec', 'brillante'], oscuro: ['#141518', 'satinado'], ruedas: ['#f0641a', 'brillante'], chasis: ['#1c1d21', 'satinado'], freno: ['#f0641a', 'anodizado']}},
  {nombre: 'Rojo carrera', r: {base: ['#c4161c', 'brillante'], detalle: ['#f1f1ec', 'brillante'], acento: ['#141518', 'brillante'], oscuro: ['#141518', 'satinado'], ruedas: ['#141518', 'brillante'], chasis: ['#c4161c', 'brillante'], freno: ['#c9a43a', 'anodizado']}},
  {nombre: 'Cemento', r: {base: ['#8a8d91', 'mate'], detalle: ['#2b2d31', 'mate'], acento: ['#f2c200', 'brillante'], oscuro: ['#1a1b1e', 'mate'], ruedas: ['#f2c200', 'brillante'], chasis: ['#2b2d31', 'mate'], freno: ['#f2c200', 'anodizado']}},
  {nombre: 'Tornasol', r: {base: ['#3d3f9a', 'tornasol'], detalle: ['#1c1c1e', 'carbono'], acento: ['#35d0e6', 'brillante'], oscuro: ['#121316', 'satinado'], ruedas: ['#1c1c1e', 'brillante'], chasis: ['#1c1c1e', 'satinado'], freno: ['#35d0e6', 'anodizado']}},
  {nombre: 'Carbono y oro', r: {base: ['#2a2a2c', 'carbono'], detalle: ['#141518', 'brillante'], acento: ['#c9a43a', 'metalizado'], oscuro: ['#121316', 'mate'], ruedas: ['#c9a43a', 'metalizado'], chasis: ['#141518', 'satinado'], freno: ['#c9a43a', 'anodizado']}}
];
const CARENADO= ['nariz', 'lat-sup-d', 'lat-sup-i', 'toma-d', 'toma-i', 'lat-inf-d', 'lat-inf-i', 'quilla', 'toma-frontal', 'guarda-del', 'cubre-tanque', 'tapa-tanque-d', 'tapa-tanque-i', 'tapa-asiento-d', 'tapa-asiento-i', 'colin-d', 'colin-i', 'tapa-colin', 'bandeja'];
const VISTAS= {tres: [1, 0.36, 0.92], izq: [0.02, 0.1, -1], der: [0.02, 0.1, 1], frente: [1, 0.14, 0.001], atras: [-1, 0.2, 0.001], arriba: [0.0005, 1, 0.0003]};
const DIR_MINI= {der: [0.3, 0.22, 1], izq: [0.3, 0.22, -1], centro: [1, 0.5, 0.75], arriba: [0.35, 1, 0.55], abajo: [0.3, -0.75, 0.75], frente: [1, 0.25, 0.4]};
const MINI_ESPECIAL= {'cubre-tanque': 'arriba', 'tapa-colin': 'arriba', 'quilla': 'abajo', 'bandeja': 'abajo', 'toma-frontal': 'frente', 'nariz': 'frente', 'faro': 'frente', 'tapa-gas': 'arriba', 'guarda-del': 'frente'};

const escena= $('escena');
const lienzo= $('lienzo');
const renderer= new THREE.WebGLRenderer({canvas: lienzo, antialias: false, alpha: true, powerPreference: 'high-performance'});
const dpr= Math.min(window.devicePixelRatio|| 1, 2);
renderer.setPixelRatio(dpr);
renderer.toneMapping= THREE.NeutralToneMapping;
renderer.toneMappingExposure= 1.02;
const scene= new THREE.Scene();
const camara= new THREE.PerspectiveCamera(30, 1, 0.05, 60);
camara.position.set(3.2, 1.6, 3.0);
const controles= new OrbitControls(camara, lienzo);
controles.enableDamping= true;
controles.dampingFactor= 0.085;
controles.maxPolarAngle= Math.PI* 0.495;
controles.minDistance= 0.55;
controles.maxDistance= 9;
controles.autoRotateSpeed= 1.4;
controles.screenSpacePanning= true;
controles.target.set(0, 0.55, 0);

const composer= new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, samples: 4}));
composer.addPass(new RenderPass(scene, camara));
const pasoHover= new OutlinePass(new THREE.Vector2(1, 1), scene, camara);
const pasoSel= new OutlinePass(new THREE.Vector2(1, 1), scene, camara);
for (const [paso, fuerza, grosor, visible, oculto] of [[pasoHover, 2.4, 1.2, '#ffffff', '#c8ccd2'], [pasoSel, 5, 2, '#ff5a1f', '#ff9a72']]){
  paso.edgeStrength= fuerza;
  paso.edgeGlow= 0;
  paso.edgeThickness= grosor;
  paso.pulsePeriod= 0;
  paso.visibleEdgeColor.set(visible);
  paso.hiddenEdgeColor.set(oculto);
  const m= paso.overlayMaterial;
  m.fragmentShader= m.fragmentShader.replace('gl_FragColor = finalColor;', 'gl_FragColor = clamp(finalColor, 0.0, 1.0);');
  m.blending= THREE.CustomBlending;
  m.blendSrc= THREE.OneFactor;
  m.blendDst= THREE.OneMinusSrcAlphaFactor;
  m.blendSrcAlpha= THREE.OneFactor;
  m.blendDstAlpha= THREE.OneMinusSrcAlphaFactor;
  m.needsUpdate= true;
  composer.addPass(paso);
}
composer.addPass(new OutputPass());

function estudio(){
  const s= new THREE.Scene();
  const mat= k=> new THREE.MeshBasicMaterial({color: new THREE.Color(k, k, k), side: THREE.DoubleSide});
  const cuarto= new THREE.Mesh(new THREE.BoxGeometry(24, 12, 24), mat(0.32));
  cuarto.material.side= THREE.BackSide;
  cuarto.position.y= 5;
  s.add(cuarto);
  const piso= new THREE.Mesh(new THREE.PlaneGeometry(24, 24), mat(0.5));
  piso.rotation.x= -Math.PI/ 2;
  piso.position.y= -0.95;
  s.add(piso);
  const panel= (w, h, x, y, z, k)=> {
    const m= new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(k));
    m.position.set(x, y, z);
    m.lookAt(0, 0.6, 0);
    s.add(m);
  };
  panel(8, 3, 0, 7, 0.01, 4.2);
  panel(1.4, 6, 0.5, 3, 6.5, 3);
  panel(1.4, 6, -0.5, 3, -6.5, 3);
  panel(5, 3.5, 7, 2.5, 2.5, 2.2);
  panel(3, 5, -7, 3, -1.5, 2.4);
  const pm= new THREE.PMREMGenerator(renderer);
  const tex= pm.fromScene(s, 0.04).texture;
  pm.dispose();
  s.traverse(o=> { if (o.isMesh){ o.geometry.dispose(); o.material.dispose(); } });
  return tex;
}
scene.environment= estudio();
const luzClave= new THREE.DirectionalLight(0xffffff, 1.25);
luzClave.position.set(3, 6, 4);
scene.add(luzClave);

const sonda= document.createElement('span');
sonda.style.cssText= 'position:absolute;width:0;height:0;overflow:hidden';
document.body.appendChild(sonda);
function colorCss(nombre){
  sonda.style.color= 'var('+ nombre+ ')';
  return getComputedStyle(sonda).color;
}
let texFondo= null;
function fondo(){
  const arriba= colorCss('--estudio-arriba'), abajo= colorCss('--estudio-abajo');
  const rgb= (arriba.match(/\d+(\.\d+)?/g)|| [255, 255, 255]).map(Number);
  const claro= (rgb[0]* 0.3+ rgb[1]* 0.59+ rgb[2]* 0.11)> 128;
  const cv= document.createElement('canvas');
  cv.width= 512;
  cv.height= 512;
  const g= cv.getContext('2d');
  const lg= g.createLinearGradient(0, 0, 0, 512);
  lg.addColorStop(0, arriba);
  lg.addColorStop(0.56, arriba);
  lg.addColorStop(1, abajo);
  g.fillStyle= lg;
  g.fillRect(0, 0, 512, 512);
  const rg= g.createRadialGradient(256, 300, 10, 256, 300, 330);
  rg.addColorStop(0, claro? 'rgba(255,255,255,0.5)': 'rgba(255,255,255,0.08)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle= rg;
  g.fillRect(0, 0, 512, 512);
  if (texFondo) texFondo.dispose();
  texFondo= new THREE.CanvasTexture(cv);
  texFondo.colorSpace= THREE.SRGBColorSpace;
  scene.background= texFondo;
  pedir();
}

const sombra= {grupo: null, rt: null, rtB: null, plano: null, blur: null, cam: null};
const matProf= new THREE.MeshDepthMaterial();
matProf.userData.oscuridad= {value: 1.3};
matProf.onBeforeCompile= sh=> {
  sh.uniforms.oscuridad= matProf.userData.oscuridad;
  sh.fragmentShader= 'uniform float oscuridad;\n'+ sh.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );', 'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * oscuridad );');
};
matProf.depthTest= false;
matProf.depthWrite= false;
const blurH= new THREE.ShaderMaterial({...HorizontalBlurShader, uniforms: THREE.UniformsUtils.clone(HorizontalBlurShader.uniforms)});
const blurV= new THREE.ShaderMaterial({...VerticalBlurShader, uniforms: THREE.UniformsUtils.clone(VerticalBlurShader.uniforms)});
blurH.depthTest= false;
blurV.depthTest= false;
function crearSombra(){
  const w= 3.4, d= 2.2, h= 1.3;
  sombra.rt= new THREE.WebGLRenderTarget(512, 332);
  sombra.rtB= new THREE.WebGLRenderTarget(512, 332);
  sombra.rt.texture.generateMipmaps= false;
  sombra.rtB.texture.generateMipmaps= false;
  const geo= new THREE.PlaneGeometry(w, d).rotateX(Math.PI/ 2);
  sombra.plano= new THREE.Mesh(geo, new THREE.MeshBasicMaterial({map: sombra.rt.texture, transparent: true, opacity: 0.85, depthWrite: false}));
  sombra.plano.renderOrder= 1;
  sombra.plano.scale.y= -1;
  sombra.blur= new THREE.Mesh(geo);
  sombra.blur.visible= false;
  sombra.cam= new THREE.OrthographicCamera(-w/ 2, w/ 2, d/ 2, -d/ 2, 0, h);
  sombra.cam.rotation.x= Math.PI/ 2;
  sombra.grupo= new THREE.Group();
  sombra.grupo.position.set(-0.05, 0.001, 0);
  sombra.grupo.add(sombra.plano, sombra.blur, sombra.cam);
  scene.add(sombra.grupo);
}
function dibujarSombra(){
  if (!sombra.grupo) return;
  scene.updateMatrixWorld(true);
  const bg= scene.background;
  const alfa= renderer.getClearAlpha();
  scene.background= null;
  sombra.plano.visible= false;
  const ocultos= [];
  for (const p of piezas) if (p.tipo=== 'vidrio'){ p.obj.visible= false; ocultos.push(p); }
  renderer.setClearAlpha(0);
  scene.overrideMaterial= matProf;
  renderer.setRenderTarget(sombra.rt);
  renderer.clear();
  renderer.render(scene, sombra.cam);
  scene.overrideMaterial= null;
  difuminar(2.6);
  difuminar(1.1);
  renderer.setRenderTarget(null);
  renderer.setClearAlpha(alfa);
  scene.background= bg;
  sombra.plano.visible= true;
  for (const p of ocultos) p.obj.visible= true;
}
function difuminar(a){
  const {blur, cam, rt, rtB}= sombra;
  blur.visible= true;
  blur.material= blurH;
  blurH.uniforms.tDiffuse.value= rt.texture;
  blurH.uniforms.h.value= a/ 256;
  renderer.setRenderTarget(rtB);
  renderer.render(blur, cam);
  blur.material= blurV;
  blurV.uniforms.tDiffuse.value= rtB.texture;
  blurV.uniforms.v.value= a/ 256;
  renderer.setRenderTarget(rt);
  renderer.render(blur, cam);
  blur.visible= false;
}

let piezas= [], porId= new Map(), moto= null;
const actual= new Map();
const sel= new Set();
let principal= null, hover= null;
let simetrico= guardado.leer('m3d:sim', true);
let varias= false, solo= false, nombres= false, girando= false;
let acabadoActual= 'brillante';
let pila= [], rehechos= [];
let misColores= guardado.leer('m3d:colores', []).filter(c=> c&& /^#[0-9a-f]{6}$/i.test(c.hex));
let despiece= 0, despieceObj= 0, tweenDespiece= null, tweenCam= null;
let necesita= true;
const pedir= ()=> { necesita= true; };
let destellos= [];
const colaMinis= [];
const filas= new Map();
const etqs= new Map();
const fantasma= new THREE.MeshBasicMaterial({color: 0x8f959d, transparent: true, opacity: 0.1, depthWrite: false});

function nombreGrupo(id){ return (GRUPOS.find(g=> g.id=== id)|| {}).nombre|| ''; }
function sinLado(p){ return p.nombre.replace(/ (derecho|derecha|izquierdo|izquierda)$/i, ''); }
function nombreColor(hex){
  const h= hex.toLowerCase();
  const a= PALETA.find(c=> c[1]=== h)|| misColores.find(c=> c.hex.toLowerCase()=== h);
  if (a) return Array.isArray(a)? a[0]: (a.nombre|| a.hex);
  return hex.toUpperCase();
}
function pintura(p){ return actual.get(p.id)|| p.base; }

function pintarPieza(p, v){
  if (!p.pintable) return;
  if (p.tipo=== 'vidrio'){
    p.mat.color.set(v.hex);
    const c= new THREE.Color(v.hex);
    p.mat.opacity= 0.36+ (1- (c.r+ c.g+ c.b)/ 3)* 0.3;
  }
  else aplicarAcabado(p.mat, v.hex, v.acabado);
  actual.set(p.id, {hex: v.hex, acabado: v.acabado});
}

function describir(ids){
  const ps= ids.map(i=> porId.get(i)).filter(Boolean);
  if (!ps.length) return null;
  if (ps.length=== 1) return {nombre: ps[0].nombre, sub: nombreGrupo(ps[0].grupo)};
  if (ps.length=== 2&& ps[0].par=== ps[1].id) return {nombre: sinLado(ps[0]), sub: 'Los dos lados · '+ nombreGrupo(ps[0].grupo)};
  if (ps.length=== CARENADO.length&& CARENADO.every(i=> ids.includes(i))) return {nombre: 'Todo el carenado', sub: ps.length+ ' piezas'};
  const vistos= [];
  for (const p of ps){
    const n= p.par&& ids.includes(p.par)? sinLado(p): p.nombre;
    if (!vistos.includes(n)) vistos.push(n);
  }
  return {nombre: ps.length+ ' piezas', sub: vistos.slice(0, 3).join(', ')+ (vistos.length> 3? '…': '')};
}
function gotaCss(ids){
  const cols= [...new Set(ids.map(i=> porId.get(i)).filter(p=> p&& p.pintable).map(p=> pintura(p).hex))];
  if (!cols.length) return 'repeating-linear-gradient(45deg,#ddd 0 3px,#bbb 3px 6px)';
  if (cols.length=== 1) return cols[0];
  return 'conic-gradient('+ cols.slice(0, 6).map((c, i, a)=> c+ ' '+ (i/ a.length* 360)+ 'deg '+ ((i+ 1)/ a.length* 360)+ 'deg').join(',')+ ')';
}

function expandir(id){
  const p= porId.get(id);
  const r= [id];
  if (simetrico&& p&& p.par) r.push(p.par);
  return r;
}
function tocarPieza(p, alternar){
  const ids= expandir(p.id);
  if (alternar|| varias){
    const todos= ids.every(i=> sel.has(i));
    for (const i of ids) todos? sel.delete(i): sel.add(i);
    principal= todos? ([...sel].pop()?? null): p.id;
  }
  else {
    sel.clear();
    for (const i of ids) sel.add(i);
    principal= p.id;
  }
  cambioSeleccion(true);
}
function fijarSeleccion(ids, prin){
  sel.clear();
  for (const i of ids) sel.add(i);
  principal= prin?? ids[0]?? null;
  cambioSeleccion(true);
}
function limpiarSeleccion(){
  if (!sel.size) return;
  sel.clear();
  principal= null;
  cambioSeleccion(false);
}

function cambioSeleccion(animar){
  const ids= [...sel];
  pasoSel.selectedObjects= ids.flatMap(i=> porId.get(i).mallas);
  if (hover&& sel.has(hover.id)) pasoHover.selectedObjects= [];
  const d= describir(ids);
  const chip= $('chip');
  chip.classList.toggle('vacio', !d);
  $('chipNombre').textContent= d? d.nombre: (tactil? 'Toca una pieza para seleccionarla': 'Haz clic en una pieza para seleccionarla');
  $('chipSub').textContent= d? d.sub: '';
  $('chipGota').style.background= d? gotaCss(ids): '';
  if (animar&& d&& !reducido){
    const c= $('chipIn');
    c.classList.remove('salta');
    void c.offsetWidth;
    c.classList.add('salta');
  }
  const info= $('selInfo');
  info.classList.toggle('vacio', !d);
  $('selGota').style.background= d? gotaCss(ids): '';
  ponerFotoSel();
  $('selNombre').textContent= d? d.nombre: 'Nada seleccionado';
  const ps= ids.map(i=> porId.get(i));
  const soloLuces= ps.length&& ps.every(p=> !p.pintable);
  $('selSub').textContent= !d? (tactil? 'Toca una pieza de la moto o elígela en Piezas': 'Haz clic en una pieza o elígela en Piezas'): soloLuces? 'Las luces no se pintan': ps.some(p=> p.tipo=== 'vidrio')? d.sub+ ' · la burbuja lleva tinte': d.sub;
  for (const [id, el] of filas) el.setAttribute('aria-pressed', sel.has(id)? 'true': 'false');
  $('bCarenado').setAttribute('aria-pressed', CARENADO.every(i=> sel.has(i))&& sel.size=== CARENADO.length? 'true': 'false');
  marcarColores();
  if (solo) aplicarSolo();
  if (tactil&& animar&& navigator.vibrate) navigator.vibrate(12);
  pedir();
}

function ponerFotoSel(){
  const p= principal&& porId.get(principal);
  const img= $('selImg');
  if (p&& p.mini){
    if (img.src!== p.mini) img.src= p.mini;
    img.hidden= false;
  }
  else img.hidden= true;
}
function marcarColores(){
  const ps= [...sel].map(i=> porId.get(i)).filter(p=> p.pintable);
  const cols= new Set(ps.map(p=> pintura(p).hex.toLowerCase()));
  const acs= new Set(ps.map(p=> pintura(p).acabado));
  document.querySelectorAll('.color[data-hex]').forEach(b=> b.setAttribute('aria-pressed', cols.size=== 1&& cols.has(b.dataset.hex.toLowerCase())? 'true': 'false'));
  if (acs.size=== 1){
    const a= [...acs][0];
    if (VISIBLES.includes(a)) acabadoActual= a;
  }
  document.querySelectorAll('.acabado').forEach(b=> b.setAttribute('aria-pressed', b.dataset.ac=== acabadoActual? 'true': 'false'));
  $('nombreColor').textContent= cols.size=== 1&& ps.length? 'Color actual: '+ nombreColor([...cols][0])+ ' · '+ (ACABADOS[[...acs][0]]|| {}).nombre: '';
}

function aplicarSolo(){
  for (const p of piezas){
    const ver= !solo|| !sel.size|| sel.has(p.id);
    for (const m of p.mallas){
      if (ver){
        if (m.userData.matSolo){
          m.material= m.userData.matSolo;
          delete m.userData.matSolo;
        }
      }
      else if (!m.userData.matSolo){
        m.userData.matSolo= m.material;
        m.material= fantasma;
      }
    }
  }
  pedir();
}

function aplicar(cambios, registrar= true){
  for (const [id, , nuevo] of cambios) pintarPieza(porId.get(id), nuevo);
  if (registrar){
    pila.push(cambios);
    if (pila.length> 80) pila.shift();
    rehechos= [];
  }
  despuesDePintar(cambios.map(c=> c[0]));
}
function deshacer(){
  const c= pila.pop();
  if (!c) return;
  for (const [id, viejo] of c) pintarPieza(porId.get(id), viejo);
  rehechos.push(c);
  despuesDePintar(c.map(x=> x[0]));
  aviso('Se deshizo el último cambio');
}
function rehacer(){
  const c= rehechos.pop();
  if (!c) return;
  for (const [id, , nuevo] of c) pintarPieza(porId.get(id), nuevo);
  pila.push(c);
  despuesDePintar(c.map(x=> x[0]));
}
function despuesDePintar(ids){
  for (const id of ids){
    const el= filas.get(id);
    if (el) el.querySelector('.g').style.background= pintura(porId.get(id)).hex;
    const p= porId.get(id);
    if (p&& !colaMinis.includes(p)) colaMinis.push(p);
  }
  $('bDeshacer').disabled= !pila.length;
  $('bRehacer').disabled= !rehechos.length;
  $('chipGota').style.background= sel.size? gotaCss([...sel]): '';
  $('selGota').style.background= sel.size? gotaCss([...sel]): '';
  marcarColores();
  pintarRoles();
  guardarDiseno();
  pedir();
}
function destellar(ps){
  if (reducido) return;
  const mats= ps.filter(p=> p.tipo=== 'pintura').map(p=> p.mat);
  destellos.push({mats, t0: performance.now()});
  pedir();
}

function pintarSeleccion(hex){
  if (!sel.size){
    aviso(tactil? 'Primero toca una pieza de la moto': 'Primero haz clic en una pieza de la moto');
    sacudirChip();
    return;
  }
  const ps= [...sel].map(i=> porId.get(i)).filter(p=> p.pintable);
  if (!ps.length){
    aviso('Las luces no se pintan');
    return;
  }
  const cambios= ps.map(p=> [p.id, {...pintura(p)}, {hex, acabado: p.tipo=== 'vidrio'? 'vidrio': acabadoActual}]);
  aplicar(cambios);
  destellar(ps);
  const d= describir(ps.map(p=> p.id));
  aviso(d.nombre+ ' → '+ nombreColor(hex), true);
}
function ponerAcabado(ac){
  acabadoActual= ac;
  document.querySelectorAll('.acabado').forEach(b=> b.setAttribute('aria-pressed', b.dataset.ac=== ac? 'true': 'false'));
  const ps= [...sel].map(i=> porId.get(i)).filter(p=> p.tipo=== 'pintura');
  if (!ps.length) return;
  const cambios= ps.map(p=> [p.id, {...pintura(p)}, {hex: pintura(p).hex, acabado: ac}]);
  aplicar(cambios);
  destellar(ps);
  aviso(describir(ps.map(p=> p.id)).nombre+ ' → '+ ACABADOS[ac].nombre, true);
}
function sacudirChip(){
  const c= $('chipIn');
  if (reducido|| !c.animate) return;
  c.animate([{transform: 'translateX(0)'}, {transform: 'translateX(-8px)'}, {transform: 'translateX(8px)'}, {transform: 'translateX(0)'}], {duration: 320});
}

let tAviso= 0;
function aviso(txt, conDeshacer= false){
  $('toastTxt').textContent= txt;
  $('toastBtn').hidden= !conDeshacer;
  $('toast').classList.add('ver');
  clearTimeout(tAviso);
  tAviso= setTimeout(()=> $('toast').classList.remove('ver'), conDeshacer? 3600: 2200);
}

function guardarDiseno(){
  guardado.poner('m3d:diseno', codificar());
}
function codificar(){
  const partes= [];
  piezas.forEach((p, i)=> {
    if (!p.pintable) return;
    const v= pintura(p);
    if (v.hex.toLowerCase()=== p.base.hex.toLowerCase()&& v.acabado=== p.base.acabado) return;
    partes.push(i.toString(36).padStart(2, '0')+ v.hex.slice(1).toLowerCase()+ (LETRA[v.acabado]|| 'b'));
  });
  return partes.join('.');
}
function decodificar(txt){
  const cambios= [];
  for (const parte of String(txt|| '').split('.')){
    const m= /^([0-9a-z]{2})([0-9a-f]{6})([a-z])$/.exec(parte);
    if (!m) continue;
    const p= piezas[parseInt(m[1], 36)];
    if (!p|| !p.pintable) continue;
    cambios.push([p.id, {...pintura(p)}, {hex: '#'+ m[2], acabado: DE_LETRA[m[3]]|| 'brillante'}]);
  }
  return cambios;
}

function aplicarCombo(c){
  const cambios= [];
  for (const p of piezas){
    if (!p.pintable|| !c.r[p.rol]) continue;
    const [hex, ac]= c.r[p.rol];
    cambios.push([p.id, {...pintura(p)}, {hex, acabado: ac}]);
  }
  aplicar(cambios);
  destellar(piezas.filter(p=> c.r[p.rol]));
  aviso('Combinación «'+ c.nombre+ '» aplicada', true);
}
function hexHsl(h, s, l){
  const c= new THREE.Color().setHSL(((h% 1)+ 1)% 1, s, l, THREE.SRGBColorSpace);
  return '#'+ c.getHexString(THREE.SRGBColorSpace);
}
function sorprender(){
  const h= Math.random();
  const esquema= Math.floor(Math.random()* 4);
  const acs= ['brillante', 'metalizado', 'mate', 'satinado'];
  const acBase= acs[Math.floor(Math.random()* acs.length)];
  const base= hexHsl(h, 0.62+ Math.random()* 0.3, 0.38+ Math.random()* 0.16);
  const comp= esquema=== 0? hexHsl(h+ 0.5, 0.75, 0.52): esquema=== 1? hexHsl(h+ 0.08, 0.7, 0.6): esquema=== 2? '#f1f1ec': '#141518';
  const det= esquema=== 2? '#141518': esquema=== 3? hexHsl(h, 0.12, 0.7): '#2b2d31';
  aplicarCombo({nombre: 'Sorpresa', r: {base: [base, acBase], detalle: [det, 'satinado'], acento: [comp, 'brillante'], oscuro: ['#141518', 'satinado'], ruedas: [Math.random()< 0.5? base: comp, 'brillante'], chasis: ['#1c1d21', 'satinado'], freno: [comp, 'anodizado']}});
}

function reiniciar(){
  const cambios= piezas.filter(p=> p.pintable).map(p=> [p.id, {...pintura(p)}, {...p.base}]);
  aplicar(cambios);
  aviso('Colores de fábrica', true);
}

const rt1= new THREE.WebGLRenderTarget(1, 1);
const buf= new Uint8Array(4);
const matsPick= [];
function matPick(i){
  if (!matsPick[i]){
    const n= i+ 1;
    const m= new THREE.MeshBasicMaterial({side: THREE.DoubleSide, toneMapped: false});
    m.color.setRGB(((n>> 16)& 255)/ 255, ((n>> 8)& 255)/ 255, (n& 255)/ 255, THREE.LinearSRGBColorSpace);
    matsPick[i]= m;
  }
  return matsPick[i];
}
function elegir(cx, cy){
  const r= lienzo.getBoundingClientRect();
  const x= (cx- r.left)* dpr, y= (cy- r.top)* dpr;
  const W= r.width* dpr, H= r.height* dpr;
  if (x< 0|| y< 0|| x>= W|| y>= H) return null;
  camara.setViewOffset(W, H, x, y, 1, 1);
  const bg= scene.background;
  scene.background= null;
  sombra.plano&& (sombra.plano.visible= false);
  for (const p of piezas){
    const fant= solo&& sel.size&& !sel.has(p.id);
    for (const m of p.mallas){
      m.userData.matP= m.material;
      m.material= matPick(p.indice);
      m.userData.visP= m.visible;
      if (fant) m.visible= false;
    }
  }
  const alfa= renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 0);
  renderer.setRenderTarget(rt1);
  renderer.clear();
  renderer.render(scene, camara);
  renderer.readRenderTargetPixels(rt1, 0, 0, 1, 1, buf);
  renderer.setRenderTarget(null);
  renderer.setClearAlpha(alfa);
  for (const p of piezas) for (const m of p.mallas){
    m.material= m.userData.matP;
    m.visible= m.userData.visP;
  }
  scene.background= bg;
  sombra.plano&& (sombra.plano.visible= true);
  camara.clearViewOffset();
  if (buf[3]=== 0) return null;
  const id= ((buf[0]<< 16)| (buf[1]<< 8)| buf[2])- 1;
  return piezas[id]|| null;
}

function centroMundo(p, out= new THREE.Vector3()){
  return out.copy(p.centro).add(p.obj.position);
}
const v3= new THREE.Vector3();
function aPantalla(p3){
  v3.copy(p3).project(camara);
  const r= lienzo.getBoundingClientRect();
  return {x: (v3.x* 0.5+ 0.5)* r.width, y: (-v3.y* 0.5+ 0.5)* r.height, z: v3.z, w: r.width, h: r.height};
}

function dibujarLlamada(){
  const svg= $('guias');
  const capa= $('etiquetas');
  let ll= capa.querySelector('.llamada'), pt= capa.querySelector('.punto');
  const p0= principal&& porId.get(principal);
  if (!p0|| nombres){
    if (ll) ll.remove();
    if (pt) pt.remove();
    svg.innerHTML= '';
    return;
  }
  let p= p0;
  if (p0.par&& sel.has(p0.par)){
    const a= centroMundo(p0, new THREE.Vector3()).distanceTo(camara.position);
    const b= centroMundo(porId.get(p0.par), new THREE.Vector3()).distanceTo(camara.position);
    if (b< a) p= porId.get(p0.par);
  }
  const s= aPantalla(centroMundo(p, new THREE.Vector3()));
  if (s.z> 1|| s.x< -20|| s.y< -20|| s.x> s.w+ 20|| s.y> s.h+ 20){
    if (ll) ll.style.display= 'none';
    if (pt) pt.style.display= 'none';
    svg.innerHTML= '';
    return;
  }
  if (!ll){
    ll= document.createElement('div');
    ll.className= 'llamada';
    capa.appendChild(ll);
    pt= document.createElement('div');
    pt.className= 'punto';
    capa.appendChild(pt);
  }
  ll.style.display= '';
  pt.style.display= '';
  const d= describir([...sel]);
  const html= '<b>'+ esc(d? d.nombre: p.nombre)+ '</b><span>'+ esc(d? d.sub: '')+ '</span>';
  if (ll.dataset.h!== html){
    ll.innerHTML= html;
    ll.dataset.h= html;
  }
  const lw= ll.offsetWidth, lh= ll.offsetHeight;
  const derecha= s.x< s.w* 0.55;
  let lx= derecha? s.x+ 44: s.x- 44- lw;
  let ly= s.y- 64- lh/ 2;
  const arriba= window.innerWidth>= 900? 72: 76;
  lx= Math.max(10, Math.min(s.w- lw- 10, lx));
  ly= Math.max(arriba, Math.min(s.h- lh- 80, ly));
  ll.style.transform= `translate(${lx}px,${ly}px)`;
  pt.style.transform= `translate(${s.x}px,${s.y}px)`;
  const ex= derecha? lx: lx+ lw, ey= ly+ lh/ 2;
  svg.innerHTML= `<path d="M${s.x},${s.y} L${ex},${ey}" stroke="var(--tinta)" stroke-width="1.6" fill="none" opacity=".75"/>`;
}

function dibujarEtiquetas(){
  const capa= $('etiquetas');
  if (!nombres){
    if (etqs.size){
      for (const el of etqs.values()) el.remove();
      etqs.clear();
    }
    return;
  }
  const lista= [];
  for (const p of piezas){
    if (solo&& sel.size&& !sel.has(p.id)) continue;
    const s= aPantalla(centroMundo(p, new THREE.Vector3()));
    if (s.z> 1|| s.x< 0|| s.y< 0|| s.x> s.w|| s.y> s.h) continue;
    const prio= sel.has(p.id)? 0: CARENADO.includes(p.id)|| p.id=== 'burbuja'? 1: ['asiento', 'asiento-pas', 'rin-del', 'rin-tras', 'escape', 'basculante', 'radiador', 'motor', 'espejo-d', 'espejo-i', 'tapa-gas', 'faro', 'stop'].includes(p.id)? 2: 3;
    lista.push({p, s, prio, d: centroMundo(p, new THREE.Vector3()).distanceTo(camara.position)});
  }
  lista.sort((a, b)=> a.prio- b.prio|| a.d- b.d);
  const puestos= [];
  const usados= new Set();
  for (const it of lista){
    let el= etqs.get(it.p.id);
    if (!el){
      el= document.createElement('button');
      el.className= 'etq';
      el.textContent= it.p.nombre;
      el.addEventListener('click', ev=> {
        ev.stopPropagation();
        tocarPieza(it.p, ev.ctrlKey|| ev.metaKey|| ev.shiftKey);
      });
      capa.appendChild(el);
      etqs.set(it.p.id, el);
    }
    const w= el.offsetWidth|| 90, h= el.offsetHeight|| 24;
    const cx= Math.max(w/ 2+ 6, Math.min(it.s.w- w/ 2- 6, it.s.x));
    const cy= Math.max(70+ h/ 2, Math.min(it.s.h- 70- h/ 2, it.s.y));
    it.s.x= cx;
    it.s.y= cy;
    const caja= {x: cx- w/ 2- 3, y: cy- h/ 2- 3, w: w+ 6, h: h+ 6};
    const choca= puestos.some(b=> caja.x< b.x+ b.w&& caja.x+ caja.w> b.x&& caja.y< b.y+ b.h&& caja.y+ caja.h> b.y);
    if (choca&& it.prio> 0){
      el.style.display= 'none';
      continue;
    }
    puestos.push(caja);
    usados.add(it.p.id);
    el.style.display= '';
    el.classList.toggle('on', sel.has(it.p.id));
    el.style.transform= `translate(${it.s.x}px,${it.s.y}px) translate(-50%,-50%)`;
  }
  for (const [id, el] of etqs) if (!usados.has(id)) el.style.display= 'none';
}

function suavizar(t){ return t< 0.5? 4* t* t* t: 1- Math.pow(-2* t+ 2, 3)/ 2; }
function volar(pos, mira, ms= 850){
  if (reducido) ms= 0;
  tweenCam= {p0: camara.position.clone(), p1: pos.clone(), m0: controles.target.clone(), m1: mira.clone(), t0: performance.now(), ms};
  pedir();
}
function distanciaPara(radio){
  const vfov= THREE.MathUtils.degToRad(camara.fov);
  const hfov= 2* Math.atan(Math.tan(vfov/ 2)* camara.aspect);
  return radio/ Math.sin(Math.min(vfov, hfov)/ 2);
}
function encuadre(caja, dir, margen= 1.06){
  const cajas= Array.isArray(caja)? caja: [caja];
  const r= escena.getBoundingClientRect();
  const libreV= Math.max(0.45, (r.height- (despieceObj> 0? 196: 132))/ r.height), libreH= Math.max(0.6, (r.width- (window.innerWidth>= 900? 150: 24))/ r.width);
  const tv= Math.tan(THREE.MathUtils.degToRad(camara.fov)/ 2)* libreV;
  const th= Math.tan(THREE.MathUtils.degToRad(camara.fov)/ 2)* camara.aspect* libreH;
  const d= dir.clone().normalize();
  const arriba= Math.abs(d.y)> 0.95? new THREE.Vector3(1, 0, 0): new THREE.Vector3(0, 1, 0);
  const der= new THREE.Vector3().crossVectors(arriba, d).normalize();
  const up= new THREE.Vector3().crossVectors(d, der).normalize();
  const total= new THREE.Box3();
  for (const b of cajas) total.union(b);
  const pts= [];
  for (const b of cajas) for (let i= 0; i< 8; i++) pts.push(new THREE.Vector3(i& 1? b.max.x: b.min.x, i& 2? b.max.y: b.min.y, i& 4? b.max.z: b.min.z));
  const c= total.getCenter(new THREE.Vector3());
  let xmin= Infinity, xmax= -Infinity, ymin= Infinity, ymax= -Infinity;
  for (const p of pts){
    const q= p.clone().sub(c);
    xmin= Math.min(xmin, q.dot(der));
    xmax= Math.max(xmax, q.dot(der));
    ymin= Math.min(ymin, q.dot(up));
    ymax= Math.max(ymax, q.dot(up));
  }
  c.addScaledVector(der, (xmin+ xmax)/ 2).addScaledVector(up, (ymin+ ymax)/ 2);
  let dist= 0;
  for (const p of pts){
    const q= p.clone().sub(c);
    const prof= q.dot(d);
    dist= Math.max(dist, prof+ Math.abs(q.dot(der))* margen/ th, prof+ Math.abs(q.dot(up))* margen/ tv);
  }
  return {centro: c, dist: Math.max(dist, 0.6)};
}
function irVista(nombre, conDespiece= despieceObj){
  const dir= new THREE.Vector3(...VISTAS[nombre]).normalize();
  const {centro, dist}= encuadre(cajaObjetivo(conDespiece), dir);
  volar(centro.clone().addScaledVector(dir, dist), centro);
}
function cajaObjetivo(k){
  const lista= [];
  for (const p of piezas){
    if (solo&& sel.size&& !sel.has(p.id)) continue;
    lista.push(p.caja.clone().translate(p.explota.clone().multiplyScalar(k)));
  }
  return lista;
}
function enfocar(p){
  const c= centroMundo(p, new THREE.Vector3());
  const t= p.caja.getSize(new THREE.Vector3()).length();
  let dir;
  if (p.lado=== 'der') dir= new THREE.Vector3(0.35, 0.32, 1);
  else if (p.lado=== 'izq') dir= new THREE.Vector3(0.35, 0.32, -1);
  else {
    dir= new THREE.Vector3().subVectors(camara.position, controles.target);
    dir.y= Math.max(dir.y, dir.length()* 0.25);
  }
  dir.normalize();
  const caja= p.caja.clone().translate(p.obj.position);
  if (p.par&& sel.has(p.par)&& !p.lado) caja.union(porId.get(p.par).caja.clone().translate(porId.get(p.par).obj.position));
  const {dist}= encuadre(caja, dir, 1.9);
  volar(c.clone().addScaledVector(dir, Math.max(0.7, Math.min(dist, 3.2))), c);
}

function fijarDespiece(on, cantidad){
  const meta= on? (cantidad?? Number($('rangoDespiece').value)/ 100): 0;
  $('bDespiezar').setAttribute('aria-pressed', on? 'true': 'false');
  $('deslizador').hidden= !on;
  escena.classList.toggle('con-desliz', on);
  tweenDespiece= {d0: despiece, d1: meta, t0: performance.now(), ms: reducido? 0: 750};
  const antes= despieceObj;
  despieceObj= meta;
  if (on&& antes=== 0){
    const dir= new THREE.Vector3().subVectors(camara.position, controles.target).normalize();
    const {centro, dist}= encuadre(cajaObjetivo(meta), dir, 1.02);
    if (camara.position.distanceTo(controles.target)< dist* 0.98|| camara.position.distanceTo(controles.target)> dist* 1.6) volar(centro.clone().addScaledVector(dir, dist), centro, 750);
  }
  pedir();
}
function moverDespiece(k){
  despiece= k;
  for (const p of piezas) p.obj.position.copy(p.explota).multiplyScalar(k);
}

let tSombra= 0;
function sombraLuego(){
  clearTimeout(tSombra);
  tSombra= setTimeout(()=> { dibujarSombra(); pedir(); }, 120);
}

const MW= 120, MH= 90;
const lienzoMini= document.createElement('canvas');
lienzoMini.width= MW;
lienzoMini.height= MH;
const ctxMini= lienzoMini.getContext('2d');
const camMini= new THREE.PerspectiveCamera(24, MW/ MH, 0.02, 30);
function hacerMinis(limite){
  if (!colaMinis.length) return;
  const r= lienzo.getBoundingClientRect();
  if (r.width< MW|| r.height< MH) return;
  const bg= scene.background;
  scene.background= null;
  if (sombra.plano) sombra.plano.visible= false;
  const vis= piezas.map(p=> p.obj.visible);
  const pos= piezas.map(p=> p.obj.position.clone());
  const alfa= renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 0);
  renderer.setScissorTest(true);
  renderer.setViewport(0, r.height- MH, MW, MH);
  renderer.setScissor(0, r.height- MH, MW, MH);
  let n= 0;
  while (colaMinis.length&& n< limite){
    const p= colaMinis.shift();
    for (const q of piezas) q.obj.visible= q=== p;
    p.obj.position.set(0, 0, 0);
    const solos= [];
    for (const m of p.mallas) if (m.userData.matSolo){
      solos.push([m, m.material]);
      m.material= m.userData.matSolo;
    }
    const c= p.caja.getCenter(new THREE.Vector3());
    const t= p.caja.getSize(new THREE.Vector3());
    const clave= MINI_ESPECIAL[p.id]|| (p.lado|| 'centro');
    const dir= new THREE.Vector3(...DIR_MINI[clave]).normalize();
    const rad= t.length()* 0.5;
    const dist= rad/ Math.sin(THREE.MathUtils.degToRad(camMini.fov)/ 2)* 0.74;
    camMini.position.copy(c).addScaledVector(dir, dist);
    camMini.up.set(0, 1, 0);
    if (Math.abs(dir.y)> 0.9) camMini.up.set(1, 0, 0);
    camMini.lookAt(c);
    camMini.near= Math.max(0.01, dist- rad* 2);
    camMini.far= dist+ rad* 2;
    camMini.updateProjectionMatrix();
    renderer.clear();
    renderer.render(scene, camMini);
    ctxMini.clearRect(0, 0, MW, MH);
    ctxMini.drawImage(renderer.domElement, 0, 0, MW* dpr, MH* dpr, 0, 0, MW, MH);
    p.mini= lienzoMini.toDataURL('image/png');
    const el= filas.get(p.id);
    if (el) el.querySelector('img').src= p.mini;
    if (p.id=== principal) ponerFotoSel();
    for (const [m, mat] of solos) m.material= mat;
    n++;
  }
  piezas.forEach((p, i)=> {
    p.obj.visible= vis[i];
    p.obj.position.copy(pos[i]);
  });
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, r.width, r.height);
  renderer.setClearAlpha(alfa);
  scene.background= bg;
  if (sombra.plano) sombra.plano.visible= true;
}

function construirPanel(){
  $('colores').innerHTML= PALETA.map(([n, h])=> `<button class="color" data-hex="${h}" style="background:${h}" title="${esc(n)}" aria-label="${esc(n)}" aria-pressed="false"></button>`).join('');
  pintarMisColores();
  $('acabados').innerHTML= VISIBLES.map(k=> `<button class="acabado" data-ac="${k}" aria-pressed="${k=== acabadoActual}"><i style="background:${MUESTRA_ACABADO[k]}"></i>${ACABADOS[k].nombre}</button>`).join('');
  const grupos= $('grupos');
  grupos.innerHTML= '';
  for (const g of GRUPOS){
    const ps= piezas.filter(p=> p.grupo=== g.id);
    if (!ps.length) continue;
    const sec= document.createElement('section');
    sec.className= 'grupo';
    sec.dataset.grupo= g.id;
    sec.innerHTML= `<div class="grupo-cab"><h3>${esc(g.nombre)}</h3><span>${ps.length}</span><button data-elegir="${g.id}">Elegir todo</button></div><div class="lista"></div>`;
    const lista= sec.querySelector('.lista');
    for (const p of ps){
      const b= document.createElement('button');
      b.className= 'fila';
      b.dataset.id= p.id;
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML= `<img class="mini" alt="" width="58" height="44"><span class="n">${esc(p.nombre)}</span><i class="g" style="background:${p.pintable? pintura(p).hex: 'repeating-linear-gradient(45deg,#eee 0 3px,#bbb 3px 6px)'}"></i>`;
      lista.appendChild(b);
      filas.set(p.id, b);
    }
    grupos.appendChild(sec);
  }
  $('combos').innerHTML= COMBOS.map((c, i)=> `<button class="combo" data-combo="${i}"><span class="barras"><i style="background:${c.r.base[0]}"></i><i style="background:${c.r.detalle[0]}"></i><i style="background:${c.r.acento[0]}"></i><i style="background:${c.r.ruedas[0]}"></i></span><b>${esc(c.nombre)}</b></button>`).join('');
  pintarRoles();
}
function pintarMisColores(){
  $('misColores').innerHTML= misColores.map((c, i)=> `<button class="color" data-hex="${c.hex}" style="background:${c.hex}" title="${esc(c.nombre|| c.hex)}" aria-label="${esc(c.nombre|| c.hex)}" aria-pressed="false"><span class="x" data-borrar="${i}" aria-label="Borrar color">×</span></button>`).join('')+ (misColores.length? '': '<p class="nota" style="grid-column:1/-1;margin:0">Agrega los colores que quieras probar. Se guardan en este teléfono.</p>');
  marcarColores();
}
function pintarRoles(){
  $('roles').innerHTML= Object.entries(ROLES).map(([k, n])=> {
    const ps= piezas.filter(p=> p.rol=== k);
    if (!ps.length) return '';
    const nombresR= [];
    for (const p of ps){
      const t= p.par? sinLado(p): p.nombre;
      if (!nombresR.includes(t)) nombresR.push(t);
    }
    return `<div class="rol"><span class="gota" style="background:${gotaCss(ps.map(p=> p.id))}"></span><div><b>${esc(n)}</b><span>${esc(nombresR.join(', '))}</span></div><button data-rol="${k}">Elegir</button></div>`;
  }).join('');
}

function cambiarPestana(id){
  for (const [t, p] of [['tPintar', 'pPintar'], ['tPiezas', 'pPiezas'], ['tEstilos', 'pEstilos']]){
    const on= t=== id;
    $(t).setAttribute('aria-selected', on? 'true': 'false');
    $(p).hidden= !on;
  }
}

function eventos(){
  let abajo= null, presion= 0, ultimoToque= {t: 0, id: null};
  lienzo.addEventListener('pointerdown', e=> {
    abajo= {x: e.clientX, y: e.clientY, t: performance.now(), tipo: e.pointerType};
    if (girando) ponerGiro(false);
    clearTimeout(presion);
    if (e.pointerType!== 'mouse'){
      presion= setTimeout(()=> {
        if (!abajo) return;
        const p= elegir(abajo.x, abajo.y);
        if (p){
          tocarPieza(p, true);
          aviso(sel.has(p.id)? 'Se sumó '+ p.nombre: 'Se quitó '+ p.nombre);
          if (navigator.vibrate) navigator.vibrate(25);
        }
        abajo= null;
      }, 520);
    }
  });
  lienzo.addEventListener('pointermove', e=> {
    if (abajo&& Math.hypot(e.clientX- abajo.x, e.clientY- abajo.y)> 8) clearTimeout(presion);
    if (e.pointerType=== 'mouse'&& !abajo) moverHover(e.clientX, e.clientY);
  });
  lienzo.addEventListener('pointerup', e=> {
    clearTimeout(presion);
    if (!abajo) return;
    const d= Math.hypot(e.clientX- abajo.x, e.clientY- abajo.y);
    const dt= performance.now()- abajo.t;
    abajo= null;
    if (d> 8|| dt> 600) return;
    const p= elegir(e.clientX, e.clientY);
    const ahora= performance.now();
    if (p){
      if (ultimoToque.id=== p.id&& ahora- ultimoToque.t< 330){
        enfocar(p);
        ultimoToque= {t: 0, id: null};
        return;
      }
      ultimoToque= {t: ahora, id: p.id};
      tocarPieza(p, e.ctrlKey|| e.metaKey|| e.shiftKey);
      if (window.innerWidth< 900) cambiarPestana('tPintar');
    }
    else if (!varias) limpiarSeleccion();
  });
  lienzo.addEventListener('pointerleave', ()=> ponerHover(null));
  lienzo.addEventListener('contextmenu', e=> e.preventDefault());
  controles.addEventListener('start', ()=> {
    tweenCam= null;
    $('tip').classList.remove('ver');
  });
  controles.addEventListener('change', pedir);
  $('chipX').addEventListener('click', limpiarSeleccion);
  $('bDespiezar').addEventListener('click', ()=> fijarDespiece(despieceObj=== 0));
  $('rangoDespiece').addEventListener('input', e=> {
    const k= Number(e.target.value)/ 100;
    despieceObj= k;
    tweenDespiece= null;
    moverDespiece(k);
    sombraLuego();
    pedir();
  });
  $('bNombres').addEventListener('click', ()=> {
    nombres= !nombres;
    $('bNombres').setAttribute('aria-pressed', nombres? 'true': 'false');
    if (nombres&& despieceObj=== 0) fijarDespiece(true);
    pedir();
  });
  $('bSolo').addEventListener('click', ()=> {
    if (!solo&& !sel.size){
      aviso('Primero elige una o varias piezas');
      sacudirChip();
      return;
    }
    solo= !solo;
    $('bSolo').setAttribute('aria-pressed', solo? 'true': 'false');
    aplicarSolo();
    if (solo){
      const dir= new THREE.Vector3().subVectors(camara.position, controles.target).normalize();
      const {centro, dist}= encuadre(cajaObjetivo(despieceObj), dir, 1.25);
      volar(centro.clone().addScaledVector(dir, Math.max(0.8, dist)), centro);
    }
  });
  if (window.innerWidth< 900) $('vistas').hidden= true;
  $('bVistas').addEventListener('click', ()=> {
    const v= $('vistas');
    v.hidden= !v.hidden;
    $('bVistas').setAttribute('aria-pressed', v.hidden? 'false': 'true');
  });
  $('vistas').addEventListener('click', e=> {
    const b= e.target.closest('[data-vista]');
    if (!b) return;
    irVista(b.dataset.vista);
    if (window.innerWidth< 900){
      $('vistas').hidden= true;
      $('bVistas').setAttribute('aria-pressed', 'false');
    }
  });
  $('bGirar').addEventListener('click', ()=> ponerGiro(!girando));
  $('bFoto').addEventListener('click', foto);
  $('bDeshacer').addEventListener('click', deshacer);
  $('bRehacer').addEventListener('click', rehacer);
  $('toastBtn').addEventListener('click', ()=> {
    deshacer();
    $('toast').classList.remove('ver');
  });
  $('bCompartir').addEventListener('click', compartir);
  $('bAyuda').addEventListener('click', ()=> $('dlgAyuda').showModal());
  $('bCerrarAyuda').addEventListener('click', ()=> $('dlgAyuda').close());
  $('bReiniciar').addEventListener('click', ()=> {
    $('dlgAyuda').close();
    reiniciar();
  });
  $('bGlb').addEventListener('click', descargarGlb);
  $('asa').addEventListener('click', ()=> {
    $('panel').classList.toggle('grande');
    document.body.classList.toggle('panel-grande', $('panel').classList.contains('grande'));
  });
  for (const id of ['tPintar', 'tPiezas', 'tEstilos']) $(id).addEventListener('click', ()=> cambiarPestana(id));
  $('colores').addEventListener('click', e=> {
    const b= e.target.closest('[data-hex]');
    if (b) pintarSeleccion(b.dataset.hex);
  });
  $('misColores').addEventListener('click', e=> {
    const x= e.target.closest('[data-borrar]');
    if (x){
      e.stopPropagation();
      misColores.splice(Number(x.dataset.borrar), 1);
      guardado.poner('m3d:colores', misColores);
      pintarMisColores();
      return;
    }
    const b= e.target.closest('[data-hex]');
    if (b) pintarSeleccion(b.dataset.hex);
  });
  $('bNuevoColor').addEventListener('click', ()=> {
    const f= $('formColor');
    f.hidden= !f.hidden;
    if (!f.hidden) $('inColor').click();
  });
  $('formColor').addEventListener('submit', e=> {
    e.preventDefault();
    const hex= $('inColor').value.toLowerCase();
    const nombre= $('inNombre').value.trim().slice(0, 24);
    misColores= [{hex, nombre}, ...misColores.filter(c=> c.hex!== hex)].slice(0, 24);
    guardado.poner('m3d:colores', misColores);
    $('inNombre').value= '';
    $('formColor').hidden= true;
    pintarMisColores();
    if (sel.size) pintarSeleccion(hex);
    else aviso('Color guardado en Mis colores');
  });
  $('acabados').addEventListener('click', e=> {
    const b= e.target.closest('[data-ac]');
    if (b) ponerAcabado(b.dataset.ac);
  });
  $('bCarenado').addEventListener('click', ()=> {
    const todo= CARENADO.every(i=> sel.has(i))&& sel.size=== CARENADO.length;
    if (todo) limpiarSeleccion();
    else fijarSeleccion(CARENADO, 'lat-sup-d');
  });
  $('bSimetrico').setAttribute('aria-pressed', simetrico? 'true': 'false');
  $('bSimetrico').addEventListener('click', ()=> {
    simetrico= !simetrico;
    guardado.poner('m3d:sim', simetrico);
    $('bSimetrico').setAttribute('aria-pressed', simetrico? 'true': 'false');
    if (simetrico&& principal) tocarPieza(porId.get(principal), false);
    aviso(simetrico? 'Los dos lados se eligen juntos': 'Ahora se elige un solo lado');
  });
  $('bVarias').addEventListener('click', ()=> {
    varias= !varias;
    $('bVarias').setAttribute('aria-pressed', varias? 'true': 'false');
    aviso(varias? 'Cada toque suma o quita una pieza': 'Cada toque elige una sola pieza');
  });
  $('grupos').addEventListener('click', e=> {
    const g= e.target.closest('[data-elegir]');
    if (g){
      const ids= piezas.filter(p=> p.grupo=== g.dataset.elegir).map(p=> p.id);
      fijarSeleccion(ids);
      return;
    }
    const f= e.target.closest('.fila');
    if (!f) return;
    const p= porId.get(f.dataset.id);
    tocarPieza(p, e.ctrlKey|| e.metaKey|| e.shiftKey);
    if (sel.has(p.id)) enfocar(p);
  });
  $('grupos').addEventListener('pointerover', e=> {
    if (e.pointerType!== 'mouse') return;
    const f= e.target.closest('.fila');
    ponerHover(f? porId.get(f.dataset.id): null);
  });
  $('grupos').addEventListener('pointerleave', ()=> ponerHover(null));
  $('buscar').addEventListener('input', e=> {
    const q= sinTildes(e.target.value.trim());
    for (const sec of document.querySelectorAll('.grupo')){
      let n= 0;
      for (const f of sec.querySelectorAll('.fila')){
        const ok= !q|| sinTildes(f.textContent).includes(q);
        f.hidden= !ok;
        if (ok) n++;
      }
      sec.hidden= n=== 0;
    }
  });
  $('combos').addEventListener('click', e=> {
    const b= e.target.closest('[data-combo]');
    if (b) aplicarCombo(COMBOS[Number(b.dataset.combo)]);
  });
  $('bSorpresa').addEventListener('click', sorprender);
  $('roles').addEventListener('click', e=> {
    const b= e.target.closest('[data-rol]');
    if (!b) return;
    fijarSeleccion(piezas.filter(p=> p.rol=== b.dataset.rol).map(p=> p.id));
    cambiarPestana('tPintar');
  });
  window.addEventListener('keydown', e=> {
    if (e.target.closest('input,textarea')) return;
    if (e.key=== 'Escape') limpiarSeleccion();
    else if ((e.ctrlKey|| e.metaKey)&& e.key.toLowerCase()=== 'z'){
      e.preventDefault();
      e.shiftKey? rehacer(): deshacer();
    }
    else if ((e.ctrlKey|| e.metaKey)&& e.key.toLowerCase()=== 'y'){
      e.preventDefault();
      rehacer();
    }
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', fondo);
  new ResizeObserver(redimensionar).observe(escena);
}

let rafHover= 0, ultimoHover= null;
function moverHover(x, y){
  ultimoHover= {x, y};
  if (rafHover) return;
  rafHover= requestAnimationFrame(()=> {
    rafHover= 0;
    if (!ultimoHover|| tweenCam) return;
    const p= elegir(ultimoHover.x, ultimoHover.y);
    ponerHover(p, ultimoHover.x, ultimoHover.y);
  });
}
function ponerHover(p, x, y){
  const tip= $('tip');
  if (p!== hover){
    hover= p;
    pasoHover.selectedObjects= p&& !sel.has(p.id)? p.mallas: [];
    lienzo.style.cursor= p? 'pointer': '';
    pedir();
  }
  if (p&& x!== undefined&& !sel.has(p.id)){
    const r= escena.getBoundingClientRect();
    tip.innerHTML= esc(p.nombre)+ '<small>'+ esc(nombreGrupo(p.grupo))+ '</small>';
    const tx= Math.min(x- r.left, r.width- tip.offsetWidth- 24);
    tip.style.left= tx+ 'px';
    tip.style.top= (y- r.top)+ 'px';
    tip.classList.add('ver');
  }
  else tip.classList.remove('ver');
}

function ponerGiro(on){
  girando= on;
  controles.autoRotate= on;
  $('bGirar').setAttribute('aria-pressed', on? 'true': 'false');
  pedir();
}

function compartir(){
  const url= location.origin+ location.pathname+ '#d='+ codificar();
  history.replaceState(null, '', '#d='+ codificar());
  if (navigator.share&& tactil){
    navigator.share({title: 'Mi moto en Motos 3D', url}).catch(()=> {});
    return;
  }
  (navigator.clipboard? navigator.clipboard.writeText(url): Promise.reject()).then(()=> aviso('Link copiado. Quien lo abra ve tu moto con estos colores')).catch(()=> {
    window.prompt('Copia este link:', url);
  });
}
function foto(){
  pasoSel.selectedObjects= [];
  pasoHover.selectedObjects= [];
  composer.render();
  const url= renderer.domElement.toDataURL('image/png');
  pasoSel.selectedObjects= [...sel].flatMap(i=> porId.get(i).mallas);
  pedir();
  const a= document.createElement('a');
  a.href= url;
  a.download= 'mi-moto-3d.png';
  a.click();
  aviso('Foto descargada');
}
async function descargarGlb(){
  aviso('Preparando el archivo…');
  try{
    const {GLTFExporter}= await import('three/addons/exporters/GLTFExporter.js');
    const pos= piezas.map(p=> p.obj.position.clone());
    moverDespiece(0);
    const datos= await new GLTFExporter().parseAsync(moto.raiz, {binary: true});
    piezas.forEach((p, i)=> p.obj.position.copy(pos[i]));
    const url= URL.createObjectURL(new Blob([datos], {type: 'model/gltf-binary'}));
    const a= document.createElement('a');
    a.href= url;
    a.download= 'moto-deportiva-3d.glb';
    a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 4000);
    aviso('Modelo descargado');
  }catch(e){
    console.error(e);
    aviso('No se pudo exportar el modelo');
  }
}

function redimensionar(){
  const r= escena.getBoundingClientRect();
  const w= Math.max(1, Math.round(r.width)), h= Math.max(1, Math.round(r.height));
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  pasoHover.setSize(w* dpr, h* dpr);
  pasoSel.setSize(w* dpr, h* dpr);
  camara.aspect= w/ h;
  camara.updateProjectionMatrix();
  pedir();
}

function bucle(ahora){
  requestAnimationFrame(bucle);
  let animando= false;
  if (tweenCam){
    const t= tweenCam.ms? Math.min(1, (ahora- tweenCam.t0)/ tweenCam.ms): 1;
    const k= suavizar(t);
    camara.position.lerpVectors(tweenCam.p0, tweenCam.p1, k);
    controles.target.lerpVectors(tweenCam.m0, tweenCam.m1, k);
    if (t>= 1) tweenCam= null;
    animando= true;
  }
  if (tweenDespiece){
    const t= tweenDespiece.ms? Math.min(1, (ahora- tweenDespiece.t0)/ tweenDespiece.ms): 1;
    moverDespiece(lerp(tweenDespiece.d0, tweenDespiece.d1, suavizar(t)));
    if (t>= 1){
      tweenDespiece= null;
      sombraLuego();
    }
    animando= true;
  }
  if (destellos.length){
    const vivos= [];
    for (const d of destellos){
      const t= (ahora- d.t0)/ 520;
      const k= t< 1? Math.sin(Math.PI* Math.min(1, t))* 0.32: 0;
      for (const m of d.mats){
        m.emissive.setRGB(k, k, k);
      }
      if (t< 1) vivos.push(d);
    }
    destellos= vivos;
    animando= true;
  }
  const movio= controles.update();
  if (colaMinis.length&& !animando&& !movio&& !tweenCam){
    hacerMinis(tactil? 3: 5);
    necesita= true;
  }
  if (!necesita&& !animando&& !movio) return;
  necesita= false;
  composer.render();
  dibujarLlamada();
  dibujarEtiquetas();
}
const lerp= (a, b, t)=> a+ (b- a)* t;

async function iniciar(){
  await new Promise(r=> requestAnimationFrame(()=> setTimeout(r, 40)));
  try{
    moto= crearMoto();
  }catch(e){
    console.error(e);
    $('cargaTxt').textContent= 'No se pudo armar la moto en este navegador.';
    return;
  }
  piezas= moto.piezas;
  piezas.forEach((p, i)=> {
    p.indice= i;
    p.mallas= [];
    p.obj.traverse(o=> { if (o.isMesh) p.mallas.push(o); });
    porId.set(p.id, p);
    actual.set(p.id, {...p.base});
  });
  scene.add(moto.raiz);
  crearSombra();
  fondo();
  construirPanel();
  eventos();
  redimensionar();
  const hash= /#d=([0-9a-z.]*)/.exec(location.hash);
  const previo= hash? hash[1]: guardado.leer('m3d:diseno', '');
  const cambios= decodificar(previo);
  if (cambios.length) aplicar(cambios, false);
  for (const p of piezas) if (p.pintable) pintarPieza(p, pintura(p));
  despuesDePintar([]);
  dibujarSombra();
  cambioSeleccion(false);
  irVista('tres');
  tweenCam.ms= 0;
  colaMinis.push(...piezas);
  $('cargando').hidden= true;
  if (hash&& cambios.length) aviso('Estás viendo una moto compartida');
  requestAnimationFrame(bucle);
  window.__m3d= {piezas, sel, tocarPieza, fijarSeleccion, fijarDespiece, pintarSeleccion, aplicarCombo, irVista, elegir, camara, controles, porId, codificar};
}
iniciar();
