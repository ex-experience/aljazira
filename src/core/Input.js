export class FPSInput {
  constructor(canvas){this.canvas=canvas;this.keys={};this.yaw=0;this.pitch=0;this.locked=false;this.primary=false;this.secondary=false;
    addEventListener("keydown",e=>this.keys[e.code]=true);addEventListener("keyup",e=>this.keys[e.code]=false);
    canvas.addEventListener("click",()=>{if(!this.locked)canvas.requestPointerLock?.()});document.addEventListener("pointerlockchange",()=>this.locked=document.pointerLockElement===canvas);
    document.addEventListener("mousemove",e=>{if(!this.locked)return;this.yaw-=e.movementX*.0022;this.pitch=Math.max(-1.4,Math.min(1.4,this.pitch-e.movementY*.0022))});
    canvas.addEventListener("mousedown",e=>{if(e.button===0)this.primary=true;if(e.button===2)this.secondary=true});canvas.addEventListener("mouseup",e=>{if(e.button===0)this.primary=false;if(e.button===2)this.secondary=false});canvas.addEventListener("contextmenu",e=>e.preventDefault())
  }
  axis(){return{x:(this.keys.KeyD?1:0)-(this.keys.KeyA?1:0),z:(this.keys.KeyW?1:0)-(this.keys.KeyS?1:0)}}
}