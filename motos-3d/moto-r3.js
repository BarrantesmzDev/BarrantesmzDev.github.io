import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

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

let texCarbono;
export function texturaCarbono(){
  if (texCarbono!== undefined) return texCarbono;
  texCarbono= null;
  if (!hayDom) return null;
  const c= document.createElement('canvas');
  c.width= c.height= 128;
  const g= c.getContext('2d');
  const n= 8, s= 128/ n;
  for (let i= 0; i< n; i++) for (let j= 0; j< n; j++){
    const urdimbre= ((i+ j)% 4)< 2;
    const gr= urdimbre? g.createLinearGradient(i* s, 0, i* s+ s, 0): g.createLinearGradient(0, j* s, 0, j* s+ s);
    gr.addColorStop(0, '#3a3a3a');
    gr.addColorStop(0.5, urdimbre? '#bdbdbd': '#9a9a9a');
    gr.addColorStop(1, '#3a3a3a');
    g.fillStyle= gr;
    g.fillRect(i* s, j* s, s, s);
  }
  texCarbono= new THREE.CanvasTexture(c);
  texCarbono.colorSpace= THREE.SRGBColorSpace;
  texCarbono.wrapS= texCarbono.wrapT= THREE.RepeatWrapping;
  texCarbono.anisotropy= 4;
  texCarbono.repeat.set(44, 44);
  return texCarbono;
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

function interiorOscuro(m){
  m.side= THREE.DoubleSide;
  m.onBeforeCompile= sh=> {
    sh.fragmentShader= sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n\tif ( !gl_FrontFacing ) diffuseColor.rgb= vec3( 0.03 );');
  };
  m.customProgramCacheKey= ()=> 'interior-oscuro';
}

function fijos(){
  const est= o=> new THREE.MeshStandardMaterial({side: THREE.DoubleSide, ...o});
  const fis= o=> new THREE.MeshPhysicalMaterial({side: THREE.DoubleSide, ...o});
  return {
    plastico: est({color: 0x17181b, roughness: 0.62, metalness: 0}),
    negro: est({color: 0x111214, roughness: 0.48, metalness: 0.25}),
    negroTextura: est({color: 0x1b1c1f, roughness: 0.74, metalness: 0.1}),
    cromo: est({color: 0xe6e8ec, roughness: 0.06, metalness: 1}),
    aluminio: est({color: 0xbcc0c6, roughness: 0.3, metalness: 1}),
    reflector: est({color: 0xf2f4f7, roughness: 0.05, metalness: 1}),
    vidrio: fis({color: 0xe8eef4, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.32, clearcoat: 1, depthWrite: false}),
    ambar: est({color: 0xff8a1c, roughness: 0.3, metalness: 0.1, emissive: 0x3a1600}),
    ambarVidrio: fis({color: 0xffa040, roughness: 0.04, transparent: true, opacity: 0.62, clearcoat: 1, depthWrite: false}),
    ambarLed: est({color: 0xffa83a, roughness: 0.35, emissive: 0xff8a00, emissiveIntensity: 0.22}),
    rojo: est({color: 0xa8121a, roughness: 0.3, metalness: 0.05, emissive: 0x1c0000}),
    rojoVidrio: fis({color: 0x8a0a10, roughness: 0.04, transparent: true, opacity: 0.78, clearcoat: 1, depthWrite: false}),
    rojoLed: est({color: 0xd01822, roughness: 0.3, emissive: 0xff1010, emissiveIntensity: 0.3}),
    pantalla: est({color: 0x07090c, roughness: 0.12, metalness: 0.3, emissive: 0x0e2233, emissiveIntensity: 0.8}),
    radiador: est({color: 0x2a2c30, roughness: 0.55, metalness: 0.5}),
    relleno: new THREE.MeshBasicMaterial({color: 0x050506})
  };
}

export async function cargarMoto(url, progreso){
  const cargador= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf= await cargador.loadAsync(url, e=> { if (progreso&& e.total) progreso(Math.min(1, e.loaded/ e.total)); });
  gltf.scene.updateMatrixWorld(true);
  const raiz= new THREE.Group();
  raiz.name= 'Yamaha R3';
  raiz.userData.credito= 'Basado en «Yamaha YZF R3 2015» (https://sketchfab.com/3d-models/yamaha-yzf-r3-2015-3b1aa6970bc944299c3f1e4914e630ca) de Nieve5677 (https://sketchfab.com/niev), licencia CC BY 4.0 (http://creativecommons.org/licenses/by/4.0/). Modificado en Motos 3D: orientación, piezas separadas, nombres y materiales.';
  const F= fijos();
  const piezas= [];
  let relleno= null;
  const base= gltf.scene.getObjectByName('moto')|| gltf.scene;
  for (const nodo of [...base.children]){
    const e= nodo.userData|| {};
    const tipo= e.tipo|| 'pintura';
    const obj= new THREE.Group();
    obj.name= nodo.name;
    raiz.add(obj);
    obj.add(nodo);
    if (tipo=== 'relleno'){
      nodo.traverse(m=> { if (m.isMesh) m.material= F.relleno; });
      relleno= obj;
      continue;
    }
    let mat= null;
    if (tipo=== 'pintura'){
      mat= new THREE.MeshPhysicalMaterial();
      interiorOscuro(mat);
      aplicarAcabado(mat, e.hex, e.acabado|| 'brillante');
    }
    else if (tipo=== 'vidrio') mat= new THREE.MeshPhysicalMaterial({color: e.hex, transparent: true, opacity: 0.48, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false, side: THREE.DoubleSide});
    nodo.traverse(m=> {
      if (!m.isMesh) return;
      const n= (m.material&& m.material.name)|| '';
      const viejo= m.material;
      m.material= n.startsWith('pintura:')&& mat? mat: (F[n.replace('fijo:', '')]|| F.plastico);
      if (viejo&& viejo!== m.material) viejo.dispose();
      m.userData.pieza= obj.name;
    });
    piezas.push({
      id: nodo.name, nombre: e.nombre|| nodo.name, grupo: e.grupo, rol: e.rol|| null, lado: e.lado|| null, par: e.par|| null, tipo, carenado: !!e.carenado,
      pintable: tipo=== 'pintura'|| tipo=== 'vidrio', explota: new THREE.Vector3(...(e.explota|| [0, 0, 0])).multiplyScalar(1.25), obj, mat,
      base: {hex: e.hex|| '#888888', acabado: e.acabado|| (tipo=== 'vidrio'? 'vidrio': 'brillante')},
      ancla: Array.isArray(e.ancla)? new THREE.Vector3(...e.ancla): null
    });
  }
  raiz.updateMatrixWorld(true);
  const caja= new THREE.Box3();
  for (const p of piezas){
    const b= new THREE.Box3().setFromObject(p.obj);
    caja.union(b);
    p.centro= p.ancla? p.ancla.clone(): b.getCenter(new THREE.Vector3());
    p.caja= b;
    p.tris= 0;
    p.obj.traverse(o=> { if (o.isMesh) p.tris+= (o.geometry.index? o.geometry.index.count: o.geometry.attributes.position.count)/ 3; });
  }
  return {raiz, piezas, caja, relleno};
}
