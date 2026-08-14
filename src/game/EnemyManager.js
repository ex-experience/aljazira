import * as THREE from "three/webgpu";
export class EnemyManager {
  constructor(scene,heightAt){this.scene=scene;this.heightAt=heightAt;this.list=[]}
  spawn(player,cost=1){const a=Math.random()*Math.PI*2,r=18+Math.random()*10,x=player.x+Math.cos(a)*r,z=player.z+Math.sin(a)*r,y=this.heightAt(x,z)+.8;const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(.75,1.1,.55),new THREE.MeshStandardMaterial({color:cost>=3?0x702f2f:cost===2?0x4b555d:0x4e4035,roughness:.8}));body.position.y=.4;
    const head=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),new THREE.MeshStandardMaterial({color:0xa36d4c,roughness:.85}));head.position.y=1.2;g.add(body,head);g.position.set(x,y,z);this.scene.add(g);this.list.push({g,hp:cost>=3?7:cost===2?4:2,speed:cost>=3?1.1:1.5,cost,cd:0})
  }
  update(dt,player,onDamage){for(const e of this.list){if(e.hp<=0)continue;const dx=player.x-e.g.position.x,dz=player.z-e.g.position.z,d=Math.hypot(dx,dz)||1;e.g.lookAt(player.x,e.g.position.y,player.z);e.cd=Math.max(0,e.cd-dt);
      if(d>1.25){e.g.position.x+=dx/d*e.speed*dt;e.g.position.z+=dz/d*e.speed*dt;e.g.position.y=this.heightAt(e.g.position.x,e.g.position.z)+.8}else if(e.cd<=0){onDamage(8+e.cost*2);e.cd=.8}}
    for(const e of this.list.filter(x=>x.hp<=0))this.scene.remove(e.g);this.list=this.list.filter(x=>x.hp>0)}
  rayHit(origin,dir){let best=null,bd=Infinity;for(const e of this.list){const v=e.g.position.clone().sub(origin),t=v.dot(dir);if(t<0||t>40)continue;const closest=origin.clone().add(dir.clone().multiplyScalar(t));const d=closest.distanceTo(e.g.position);if(d<.9&&t<bd){best=e;bd=t}}if(best){best.hp--;return true}return false}
}