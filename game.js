import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const root=$("#gameRoot"),menu=$("#menu"),hud=$("#hud"),mobile=$("#mobile"),death=$("#death");
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const SAVE="ex_aljazira_world_v1";
let scene,camera,renderer,clock,raycaster,mode="survival",worldSeed=0,started=false,locked=false;
let yaw=0,pitch=0,day=1,timeOfDay=8,raidTimer=45,raidWave=0,score=0;
let hp=100,hunger=100,shield=25,dead=false,selected=0;
const keys={},touch={forward:0,back:0,left:0,right:0,jump:0,fire:0,mine:0,build:0};
const blocks=["SAND","STONE","WOOD","WALL","PULSE","LAMP"],inventory={SAND:24,STONE:14,WOOD:10,WALL:8,PULSE:4,LAMP:2};
const blockMap=new Map(),worldMeshes=[],built=[],enemies=[],projectiles=[],particles=[];
let terrainMeshes=[],water,sun,ambient,player={x:0,y:9,z:0,vy:0,on:false,speed:5.2};

const toast=(t,ms=1000)=>{let q=$("#toast");q.textContent=t;q.classList.add("show");clearTimeout(q._);q._=setTimeout(()=>q.classList.remove("show"),ms)};
const hash=(x,z,s=worldSeed)=>{let n=Math.sin(x*127.1+z*311.7+s*74.7)*43758.5453;return n-Math.floor(n)};
const noise=(x,z)=>{let a=0,amp=.5,f=.08;for(let i=0;i<4;i++){a+=(hash(Math.floor(x*f),Math.floor(z*f))*2-1)*amp;f*=2;amp*=.5}return a};
const key=(x,y,z)=>`${Math.round(x)},${Math.round(y)},${Math.round(z)}`;

function mat(c,rough=.86,em=0){return new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:.04,emissive:em?c:0x000000,emissiveIntensity:em})}
const mats={
 SAND:mat(0xc8a363),GRASS:mat(0x507d4b),STONE:mat(0x77736c),WOOD:mat(0x704f34),
 WALL:mat(0x8c7b62),PULSE:mat(0x19d7cf,.45,.5),LAMP:mat(0xffd36a,.4,.7),WATER:new THREE.MeshStandardMaterial({color:0x177a91,transparent:true,opacity:.72,roughness:.2,metalness:.1})
};
const geo=new THREE.BoxGeometry(1,1,1);

function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x72b5cf);scene.fog=new THREE.Fog(0x8bc1cf,24,74);
 camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,110);camera.rotation.order="YXZ";
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=false;root.appendChild(renderer.domElement);
 raycaster=new THREE.Raycaster();raycaster.far=6;clock=new THREE.Clock();
 ambient=new THREE.HemisphereLight(0xbfefff,0x5d4b37,1.6);scene.add(ambient);
 sun=new THREE.DirectionalLight(0xffe8bd,2.4);sun.position.set(20,32,12);scene.add(sun);
 let wg=new THREE.PlaneGeometry(120,120),wm=mats.WATER;water=new THREE.Mesh(wg,wm);water.rotation.x=-Math.PI/2;water.position.y=1.7;scene.add(water);
 buildWorld();makeHotbar();bind();animate()
}
function buildWorld(){
 terrainMeshes.forEach(m=>scene.remove(m));terrainMeshes=[];blockMap.clear();built.splice(0);
 const byType={SAND:[],GRASS:[],STONE:[]};
 const size=42;
 for(let x=-size/2;x<size/2;x++)for(let z=-size/2;z<size/2;z++){
  let r=Math.hypot(x,z)/(size*.54),n=noise(x,z),h=Math.floor(2+(1-r)*5+n*2.8);
  if(r>1.04+noise(x*2,z*2)*.08)continue;
  h=Math.max(1,h);
  let type=h<=2?"SAND":h>=6?"STONE":"GRASS";
  byType[type].push({x,y:h,z});blockMap.set(key(x,h,z),{x,y:h,z,type,base:true});
 }
 for(const [type,arr] of Object.entries(byType)){if(!arr.length)continue;let mesh=new THREE.InstancedMesh(geo,mats[type],arr.length),o=new THREE.Object3D();arr.forEach((p,i)=>{o.position.set(p.x,p.y,p.z);o.updateMatrix();mesh.setMatrixAt(i,o.matrix)});mesh.userData={type,instances:arr};mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);terrainMeshes.push(mesh);worldMeshes.push(mesh)}
 // original island landmarks
 makeBlock(-5,7,-4,"WOOD",true);makeBlock(-5,8,-4,"LAMP",true);makeBlock(6,6,2,"PULSE",true);makeBlock(7,6,2,"LAMP",true);
}
function makeBlock(x,y,z,type,free=false){
 if(!free&&mode!=="creative"&&inventory[type]<=0)return false;
 const k=key(x,y,z);if(blockMap.has(k))return false;
 let m=new THREE.Mesh(geo,mats[type]||mats.STONE);m.position.set(Math.round(x),Math.round(y),Math.round(z));m.userData={type,built:true};scene.add(m);worldMeshes.push(m);built.push(m);blockMap.set(k,{x:m.position.x,y:m.position.y,z:m.position.z,type,built:true,mesh:m});
 if(!free&&mode!=="creative")inventory[type]--;return true
}
function removeBlock(obj,point){
 let item;
 if(obj.isInstancedMesh&&point){let id=point.instanceId,p=obj.userData.instances[id];if(!p)return;item=blockMap.get(key(p.x,p.y,p.z));if(!item)return; // base terrain is collectible but visually sunk
   let dummy=new THREE.Object3D();dummy.position.set(0,-1000,0);dummy.updateMatrix();obj.setMatrixAt(id,dummy.matrix);obj.instanceMatrix.needsUpdate=true;blockMap.delete(key(p.x,p.y,p.z));
 }else{item=blockMap.get(key(obj.position.x,obj.position.y,obj.position.z));if(!item)return;scene.remove(obj);worldMeshes.splice(worldMeshes.indexOf(obj),1);blockMap.delete(key(obj.position.x,obj.position.y,obj.position.z))}
 let give=item.type==="GRASS"?"SAND":item.type;inventory[give]=(inventory[give]||0)+1;score+=8;makeHotbar();burst(item.x,item.y,item.z,0xd9c899)
}
function terrainHeight(x,z){
 let best=1.8;for(let y=14;y>=1;y--){if(blockMap.has(key(Math.round(x),y,Math.round(z))))return y+.82}return best
}
function makeHotbar(){$("#hotbar").innerHTML=blocks.map((b,i)=>`<div class="slot ${i===selected?"active":""}" data-i="${i}"><b>${i+1}</b><span>${b}</span><small>${mode==="creative"?"∞":inventory[b]||0}</small></div>`).join("")}
function bind(){
 addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
 addEventListener("keydown",e=>{keys[e.code]=1;if(/^Digit[1-6]$/.test(e.code)){selected=Number(e.code.at(-1))-1;makeHotbar()}if(e.code==="KeyC")toggleChat()});
 addEventListener("keyup",e=>keys[e.code]=0);
 renderer.domElement.addEventListener("click",()=>{if(!locked&&!matchMedia("(pointer:coarse)").matches)renderer.domElement.requestPointerLock()});
 document.addEventListener("pointerlockchange",()=>locked=document.pointerLockElement===renderer.domElement);
 document.addEventListener("mousemove",e=>{if(!locked)return;yaw-=e.movementX*.0022;pitch=clamp(pitch-e.movementY*.0022,-1.4,1.4)});
 renderer.domElement.addEventListener("mousedown",e=>{if(e.button===0)actionMine();if(e.button===2)actionBuild()});renderer.domElement.addEventListener("contextmenu",e=>e.preventDefault());
 $$(".mobile button").forEach(b=>{let m=b.dataset.m,a=b.dataset.a;b.onpointerdown=e=>{e.preventDefault();if(m)touch[m]=1;if(a)touch[a]=1};b.onpointerup=b.onpointercancel=b.onpointerleave=e=>{e.preventDefault();if(m)touch[m]=0;if(a)touch[a]=0}});
}
function actionMine(){
 if(mode==="spectator")return;
 raycaster.setFromCamera(new THREE.Vector2(0,0),camera);let hits=raycaster.intersectObjects(worldMeshes,false);if(hits[0])removeBlock(hits[0].object,hits[0])
}
function actionBuild(){
 if(mode==="spectator"||mode==="adventure")return;
 raycaster.setFromCamera(new THREE.Vector2(0,0),camera);let hits=raycaster.intersectObjects(worldMeshes,false);if(!hits[0])return;
 let p=hits[0].point.clone().add(hits[0].face.normal.multiplyScalar(.52));let type=blocks[selected];if(makeBlock(Math.round(p.x),Math.round(p.y),Math.round(p.z),type)){score+=4;makeHotbar();toast(`${type} PLACED`)}
}
function fire(){
 if(mode==="spectator")return;let d=new THREE.Vector3();camera.getWorldDirection(d);let s=new THREE.Mesh(new THREE.SphereGeometry(.07,6,6),new THREE.MeshBasicMaterial({color:0x55fff1}));s.position.copy(camera.position).add(d.clone().multiplyScalar(.6));scene.add(s);projectiles.push({m:s,v:d.multiplyScalar(25),life:1.3});score+=1
}
function spawnEnemy(){
 let a=Math.random()*Math.PI*2,r=18+Math.random()*8,x=player.x+Math.cos(a)*r,z=player.z+Math.sin(a)*r,y=terrainHeight(x,z)+.8;
 let g=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(.75,1.1,.55),mat(0x4b2d2c,.7)),head=new THREE.Mesh(new THREE.BoxGeometry(.52,.52,.52),mat(0xa36b4c,.8)),eye=new THREE.Mesh(new THREE.BoxGeometry(.1,.08,.05),mat(0xff4b3e,.2,.8));body.position.y=.4;head.position.y=1.2;eye.position.set(0,1.23,.285);g.add(body,head,eye);g.position.set(x,y,z);scene.add(g);enemies.push({g,hp:3+raidWave,speed:1.45+raidWave*.08,hit:0})
}
function startRaid(){raidWave++;let n=3+raidWave*2;for(let i=0;i<n;i++)spawnEnemy();toast(`RAID WAVE ${raidWave}`,1600);$("#objective").textContent=`DEFEND // ${n} HOSTILES`}
function updateEnemies(dt){
 for(const e of enemies){if(e.hp<=0)continue;let dx=player.x-e.g.position.x,dz=player.z-e.g.position.z,dist=Math.hypot(dx,dz);e.g.lookAt(player.x,e.g.position.y,player.z);if(dist>1.25){e.g.position.x+=dx/dist*e.speed*dt;e.g.position.z+=dz/dist*e.speed*dt;e.g.position.y=terrainHeight(e.g.position.x,e.g.position.z)+.8}else if(!e.hit){damage(10);e.hit=.8}e.hit=Math.max(0,e.hit-dt)}
 enemies.filter(e=>e.hp<=0).forEach(e=>scene.remove(e.g));enemies.splice(0,enemies.length,...enemies.filter(e=>e.hp>0));
 if(raidWave&&enemies.length===0){$("#objective").textContent="EXPAND • BUILD • PREPARE";shield=Math.min(100,shield+15);raidTimer=65;raidWave=0;score+=500}
}
function burst(x,y,z,c){for(let i=0;i<8;i++){let m=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08),new THREE.MeshBasicMaterial({color:c}));m.position.set(x,y,z);scene.add(m);particles.push({m,v:new THREE.Vector3((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3),life:.45})}}
function damage(n){if(mode==="creative"||mode==="spectator")return;if(shield>0){let a=Math.min(shield,n);shield-=a;n-=a}hp-=n;if(hp<=0)die()}
function die(){dead=true;hp=0;document.exitPointerLock?.();death.classList.remove("hidden");$("#deathTitle").textContent=mode==="hardcore"?"HARDCORE WORLD LOST.":"YOU FELL.";$("#deathText").textContent=mode==="hardcore"?"تم حذف حفظ العالم المحلي لهذا العالم المتشدد.":"يمكنك العودة إلى نفس العالم.";if(mode==="hardcore")localStorage.removeItem(SAVE)}
function save(){
 let data={seed:worldSeed,mode,inventory,player:{x:player.x,y:player.y,z:player.z},built:built.map(m=>({x:m.position.x,y:m.position.y,z:m.position.z,type:m.userData.type})),day,timeOfDay,score};localStorage.setItem(SAVE,JSON.stringify(data))
}
function loadSave(){
 try{let d=JSON.parse(localStorage.getItem(SAVE)||"null");if(!d)return false;worldSeed=d.seed||1;mode=d.mode||"survival";Object.assign(inventory,d.inventory||{});player={...player,...d.player};day=d.day||1;timeOfDay=d.timeOfDay||8;score=d.score||0;buildWorld();(d.built||[]).forEach(b=>makeBlock(b.x,b.y,b.z,b.type,true));return true}catch{return false}
}
function begin(requested){
 if(!scene)init();
 if(requested==="new"){localStorage.removeItem(SAVE);worldSeed=Math.floor(Math.random()*9999999);mode="survival";buildWorld();player={...player,x:0,y:9,z:0};}
 else if(requested==="survival"&&localStorage.getItem(SAVE)){loadSave()}
 else{mode=requested;worldSeed=Math.floor(Math.random()*9999999);buildWorld();player={...player,x:0,y:9,z:0}}
 started=true;dead=false;hp=100;hunger=100;shield=mode==="creative"?100:25;menu.classList.add("hidden");root.classList.remove("hidden");hud.classList.remove("hidden");$("#mode").textContent=mode.toUpperCase();if(matchMedia("(pointer:coarse)").matches)mobile.classList.remove("hidden");makeHotbar();toast("WORLD ONLINE");setTimeout(()=>{if(mode!=="creative"&&mode!=="spectator")startRaid()},8000)
}
function update(dt){
 if(!started||dead)return;
 let forward=(keys.KeyW||touch.forward?1:0)-(keys.KeyS||touch.back?1:0),side=(keys.KeyD||touch.right?1:0)-(keys.KeyA||touch.left?1:0),sprint=keys.ShiftLeft||keys.ShiftRight,spd=player.speed*(sprint?1.55:1);
 let sin=Math.sin(yaw),cos=Math.cos(yaw),dx=(side*cos-forward*sin)*spd*dt,dz=(side*sin+forward*cos)*spd*dt;
 player.x+=dx;player.z+=dz;
 let fly=mode==="creative"||mode==="spectator";
 if(fly){if(keys.Space||touch.jump)player.y+=spd*dt;if(keys.KeyQ)player.y-=spd*dt}
 else{player.vy-=15*dt;if((keys.Space||touch.jump)&&player.on){player.vy=6.3;player.on=false}player.y+=player.vy*dt;let g=terrainHeight(player.x,player.z)+1.55;if(player.y<=g){player.y=g;player.vy=0;player.on=true}}
 camera.position.set(player.x,player.y,player.z);camera.rotation.y=yaw;camera.rotation.x=pitch;
 if(keys.KeyF||touch.fire){if(!update.fireCd)update.fireCd=0;update.fireCd-=dt;if(update.fireCd<=0){fire();update.fireCd=.18}}else update.fireCd=0;
 if(touch.mine){actionMine();touch.mine=0}if(touch.build){actionBuild();touch.build=0}
 projectiles.forEach(p=>{p.m.position.addScaledVector(p.v,dt);p.life-=dt;for(const e of enemies){if(e.hp>0&&p.m.position.distanceTo(e.g.position)<.9){e.hp--;p.life=0;burst(e.g.position.x,e.g.position.y+1,e.g.position.z,0x55fff1);score+=75;break}}});projectiles.filter(p=>p.life<=0).forEach(p=>scene.remove(p.m));projectiles.splice(0,projectiles.length,...projectiles.filter(p=>p.life>0));
 particles.forEach(p=>{p.m.position.addScaledVector(p.v,dt);p.v.y-=7*dt;p.life-=dt});particles.filter(p=>p.life<=0).forEach(p=>scene.remove(p.m));particles.splice(0,particles.length,...particles.filter(p=>p.life>0));
 updateEnemies(dt);
 timeOfDay+=dt*.18;if(timeOfDay>=24){timeOfDay-=24;day++}let daylight=.25+.75*Math.max(0,Math.sin((timeOfDay-6)/24*Math.PI*2));ambient.intensity=.45+daylight*1.35;sun.intensity=.2+daylight*2.2;scene.background.setHSL(.54,.38,.16+daylight*.48);scene.fog.color.copy(scene.background);sun.position.set(Math.cos(timeOfDay/24*Math.PI*2)*30,12+daylight*30,18);
 if(mode==="survival"||mode==="hardcore"||mode==="adventure"){hunger=clamp(hunger-dt*.23*(sprint?1.8:1),0,100);if(hunger<=0)damage(dt*2.2)}
 raidTimer-=dt;if(raidTimer<=0&&enemies.length===0&&mode!=="creative"&&mode!=="spectator"){startRaid();raidTimer=999}
 $("#hp").style.width=clamp(hp,0,100)+"%";$("#hunger").style.width=clamp(hunger,0,100)+"%";$("#shield").style.width=clamp(shield,0,100)+"%";$("#clock").textContent=`DAY ${day} • ${String(Math.floor(timeOfDay)).padStart(2,"0")}:${String(Math.floor((timeOfDay%1)*60)).padStart(2,"0")}`;
 if(Math.floor(timeOfDay*10)%80===0)save()
}
function animate(){requestAnimationFrame(animate);if(!renderer)return;let dt=Math.min(.04,clock.getDelta());update(dt);water.position.y=1.7+Math.sin(performance.now()*.001)*.04;renderer.render(scene,camera)}
function toggleChat(){window.EXChat?.toggle?.()}
$$("[data-mode]").forEach(b=>b.onclick=()=>begin(b.dataset.mode));$("#howBtn").onclick=()=>$("#how").classList.remove("hidden");$("#closeHow").onclick=()=>$("#how").classList.add("hidden");
$("#respawn").onclick=()=>{death.classList.add("hidden");dead=false;hp=100;hunger=80;player.x=0;player.z=0;player.y=9};$("#backMenu").onclick=()=>location.reload();
window.EXAljazira={begin,toggleChat,save};
