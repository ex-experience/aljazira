import * as THREE from "three/webgpu";
const CHUNK=16;
export class ChunkManager {
  constructor(scene,{seed,activeRadius=1,visibleRadius=2,prefetchRadius=3}){this.scene=scene;this.seed=seed;this.activeRadius=activeRadius;this.visibleRadius=visibleRadius;this.prefetchRadius=prefetchRadius;this.chunks=new Map();this.pending=new Set();this.worker=new Worker(new URL("../../workers/chunk-worker.js",import.meta.url),{type:"module"});this.worker.onmessage=e=>this._accept(e.data);this.materials=[
    new THREE.MeshStandardMaterial({color:0xcaa66c,roughness:.9}),
    new THREE.MeshStandardMaterial({color:0x557b4c,roughness:.9}),
    new THREE.MeshStandardMaterial({color:0x777570,roughness:.95}),
    new THREE.MeshStandardMaterial({color:0x4d8b57,roughness:.86})
  ];this.geo=new THREE.BoxGeometry(1,1,1);this.tmp=new THREE.Object3D()
  }
  key(cx,cz){return `${cx},${cz}`}
  request(cx,cz){const k=this.key(cx,cz);if(this.chunks.has(k)||this.pending.has(k))return;this.pending.add(k);this.worker.postMessage({cx,cz,seed:this.seed})}
  update(px,pz){
    const pcx=Math.floor(px/CHUNK),pcz=Math.floor(pz/CHUNK);
    for(let dz=-this.prefetchRadius;dz<=this.prefetchRadius;dz++)for(let dx=-this.prefetchRadius;dx<=this.prefetchRadius;dx++)this.request(pcx+dx,pcz+dz);
    for(const [k,c] of this.chunks){const d=Math.max(Math.abs(c.cx-pcx),Math.abs(c.cz-pcz));c.group.visible=d<=this.visibleRadius;if(d>this.prefetchRadius+1){this.scene.remove(c.group);for(const m of c.meshes){m.geometry.dispose()}this.chunks.delete(k)}}
  }
  _accept({cx,cz,heights,types}){const k=this.key(cx,cz);this.pending.delete(k);if(this.chunks.has(k))return;const group=new THREE.Group(),meshes=[];
    for(let type=0;type<4;type++){let arr=[];for(let i=0;i<heights.length;i++)if(types[i]===type)arr.push(i);if(!arr.length)continue;let mesh=new THREE.InstancedMesh(this.geo,this.materials[type],arr.length);let n=0;
      for(const i of arr){const x=i%CHUNK,z=(i/CHUNK)|0,h=heights[i];this.tmp.position.set(cx*CHUNK+x,h/2,cz*CHUNK+z);this.tmp.scale.set(1,h,1);this.tmp.updateMatrix();mesh.setMatrixAt(n++,this.tmp.matrix)}
      mesh.instanceMatrix.needsUpdate=true;mesh.userData={terrain:true,cx,cz};group.add(mesh);meshes.push(mesh)}
    this.scene.add(group);this.chunks.set(k,{cx,cz,group,meshes,heights,types})
  }
  heightAt(x,z){const cx=Math.floor(x/CHUNK),cz=Math.floor(z/CHUNK),c=this.chunks.get(this.key(cx,cz));if(!c)return 4;let lx=((Math.floor(x)%CHUNK)+CHUNK)%CHUNK,lz=((Math.floor(z)%CHUNK)+CHUNK)%CHUNK;return c.heights[lz*CHUNK+lx]||4}
}