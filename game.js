import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

const qs = s => document.querySelector(s);
const intro = qs('#intro'), startBtn = qs('#start'), pauseEl = qs('#pause');
const newWorldBtn=qs('#newWorld'), saveStateEl=qs('#saveState'), saveToast=qs('#saveToast');
const resumeBtn=qs('#resumeBtn'), saveBtn=qs('#saveBtn'), resetBtn=qs('#resetBtn');
const posEl=qs('#pos'), biomeEl=qs('#biome'), hotbar=qs('#hotbar'), objective=qs('#objective');

const SAVE_KEY = 'ex.aljazira.production.rc1';
const SAVE_VERSION = 1;
let initialSave = null;
try { initialSave = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch {}
const params = new URLSearchParams(location.search);
let SEED = Number(params.get('seed')) || initialSave?.seed || 2030;
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || matchMedia('(pointer:coarse)').matches;
const QUALITY = localStorage.getItem('ex.aljazira.quality') || (IS_TOUCH ? 'balanced' : 'high');
const QUALITY_PROFILE = {
  performance:{mobilePixel:0.9,desktopPixel:1.0,shadows:false},
  balanced:{mobilePixel:1.15,desktopPixel:1.35,shadows:true},
  high:{mobilePixel:1.35,desktopPixel:1.8,shadows:true}
}[QUALITY] || {mobilePixel:1.15,desktopPixel:1.35,shadows:true};
let gameActive = false;
let gameStartedAt = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9db7c1);
scene.fog = new THREE.FogExp2(0xc7b890, 0.0028);

const camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, 0.05, 850);
camera.rotation.order = 'YXZ';
camera.position.set(0, 18, 0);

const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? QUALITY_PROFILE.mobilePixel : QUALITY_PROFILE.desktopPixel));
renderer.shadowMap.enabled = QUALITY_PROFILE.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.domElement.style.touchAction='none';
document.body.prepend(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xcfe4ff,0x8c6843,2.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe0ae,3.1);
sun.position.set(-90,120,55); sun.castShadow=true;
sun.shadow.mapSize.set(IS_TOUCH?1024:2048,IS_TOUCH?1024:2048);
sun.shadow.camera.left=-120;sun.shadow.camera.right=120;sun.shadow.camera.top=120;sun.shadow.camera.bottom=-120;
scene.add(sun);

const controls = new PointerLockControls(camera, renderer.domElement);

function startPlay(){
  if(gameActive) return;
  gameActive=true;
  gameStartedAt=performance.now();
  document.body.classList.add('in-game');
  intro?.classList.add('intro-exit');
  setTimeout(()=>{ if(intro) intro.style.display='none'; }, 360);
  saveGame(true);
  if(!IS_TOUCH) setTimeout(()=>controls.lock(),80);
}
startBtn.onclick=startPlay;
if(initialSave){
  startBtn.textContent='تابع العالم // CONTINUE WORLD';
  saveStateEl.textContent=`LOCAL SAVE // SEED ${initialSave.seed} // ${new Date(initialSave.savedAt||Date.now()).toLocaleString()}`;
}else{
  saveStateEl.textContent=`NEW WORLD // SEED ${SEED}`;
}
newWorldBtn.onclick=()=>{
  if(!confirm('إنشاء عالم جديد؟ سيتم حذف الحفظ المحلي الحالي على هذا الجهاز.')) return;
  localStorage.removeItem(SAVE_KEY);
  const nextSeed=Math.floor(100000+Math.random()*899999);
  location.href=`${location.pathname}?seed=${nextSeed}`;
};
renderer.domElement.addEventListener('click',()=>{
  if(!IS_TOUCH && gameActive && !paused && !controls.isLocked) controls.lock();
});

const WORLD = 76;
const HALF = WORLD>>1;
const noise = new ImprovedNoise();
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
const worldRand = mulberry32(SEED >>> 0);

const blockDefs = [
  {id:0,name:'حجر الحجاز',c:0x86756a},
  {id:1,name:'رمل',c:0xd8b574},
  {id:2,name:'صخر أسود',c:0x2c2b2a},
  {id:3,name:'تربة واحة',c:0x7a5c38},
  {id:4,name:'خشب نخيل',c:0x795536},
  {id:5,name:'جص بلدي',c:0xd5c5a7},
  {id:6,name:'حجر مرجاني',c:0xb29b84}
];
let selected=1;
blockDefs.forEach((b,i)=>{
  const s=document.createElement('div');s.className='slot'+(i===selected?' sel':'');
  s.innerHTML=`<div class="cube" style="background:#${b.c.toString(16).padStart(6,'0')}"></div>${i+1} ${b.name}`;
  const choose=(e)=>{e.preventDefault();e.stopPropagation();select(i)};
  s.addEventListener('pointerdown',choose,{passive:false});
  hotbar.appendChild(s);
});
function select(i){selected=i;[...hotbar.children].forEach((e,j)=>e.classList.toggle('sel',j===i));}

const boxGeo = new THREE.BoxGeometry(1,1,1);
const mats = blockDefs.map(b=>new THREE.MeshStandardMaterial({color:b.c,roughness:.92,metalness:0}));
const groups = blockDefs.map((b,i)=> {
  const mesh=new THREE.InstancedMesh(boxGeo,mats[i],28000);
  mesh.castShadow=i!==1 && !IS_TOUCH;
  mesh.receiveShadow=true; mesh.count=0; scene.add(mesh);
  return {mesh,count:0,positions:new Map()};
});

const occupied = new Map();
const key=(x,y,z)=>`${x}|${y}|${z}`;
const dummy = new THREE.Object3D();

function biomeAt(x,z){
  const n=noise.noise(x*.018,0,z*.018);
  if(x < -18 && z > 5) return 'HIJAZ';
  if(x > 18 && z < -8) return 'RUB_AL_KHALI';
  if(z > 24) return 'HARRAT';
  if(Math.abs(x)<10 && z<-22) return 'OASIS';
  return n>.42?'TUWAIQ':'NAJD';
}
function heightAt(x,z){
  const b=biomeAt(x,z);
  const n1=noise.noise((x+SEED)*.028,0,(z-SEED)*.028);
  const n2=noise.noise((x-SEED)*.075,4,(z+SEED)*.075);
  if(b==='HIJAZ') return Math.max(3, Math.floor(8 + Math.abs(n1)*12 + n2*4));
  if(b==='RUB_AL_KHALI') return Math.max(2, Math.floor(4 + Math.sin(x*.18+z*.11)*2 + n1*3));
  if(b==='HARRAT') return Math.max(4, Math.floor(7 + n1*5));
  if(b==='OASIS') return Math.max(2, Math.floor(3+n1*1.5));
  if(b==='TUWAIQ') return Math.max(3, Math.floor(6+n1*3 + (x>0?2:0)));
  return Math.max(3, Math.floor(5+n1*2+n2));
}
function topType(x,z,y){
  const b=biomeAt(x,z);
  if(b==='RUB_AL_KHALI') return 1;
  if(b==='HARRAT') return 2;
  if(b==='OASIS') return 3;
  if(b==='HIJAZ') return y>12?0:6;
  return 0;
}
const addedEdits = new Map();
const removedEdits = new Set();
let restoringEdits = false;

function addBlock(x,y,z,type,record=false){
  const k=key(x,y,z); if(occupied.has(k)) return false;
  const g=groups[type], idx=g.count++;
  dummy.position.set(x,y,z); dummy.updateMatrix();
  g.mesh.setMatrixAt(idx,dummy.matrix); g.mesh.count=g.count; g.mesh.instanceMatrix.needsUpdate=true;
  g.positions.set(idx,{x,y,z,type}); occupied.set(k,{type,idx});
  if(record && !restoringEdits){
    addedEdits.set(k,{x,y,z,type});
    removedEdits.delete(k);
  }
  return true;
}
function removeBlock(x,y,z,record=false){
  const k=key(x,y,z), item=occupied.get(k); if(!item) return false;
  const g=groups[item.type], last=g.count-1;
  if(item.idx!==last){
    const moved=g.positions.get(last);
    dummy.position.set(moved.x,moved.y,moved.z); dummy.updateMatrix();
    g.mesh.setMatrixAt(item.idx,dummy.matrix);
    g.positions.set(item.idx,moved);
    occupied.set(key(moved.x,moved.y,moved.z),{type:item.type,idx:item.idx});
  }
  g.positions.delete(last); g.count--; g.mesh.count=g.count; g.mesh.instanceMatrix.needsUpdate=true; occupied.delete(k);
  if(record && !restoringEdits){
    if(addedEdits.has(k)) addedEdits.delete(k); else removedEdits.add(k);
  }
  return true;
}
function buildWorld(){
  for(let x=-HALF;x<HALF;x++) for(let z=-HALF;z<HALF;z++){
    const h=heightAt(x,z), t=topType(x,z,h);
    const depth = Math.max(0,h-3);
    for(let y=depth;y<=h;y++) addBlock(x,y,z,y===h?t:(t===1?1:0));
    if(biomeAt(x,z)==='OASIS' && worldRand()<.045) palm(x,h+1,z);
  }
  for(let i=0;i<18;i++){
    const x=-8+(i%6)*4, z=8+Math.floor(i/6)*5;
    house(x,heightAt(x,z)+1,z,2+(i%3),i%2?5:6);
  }
  for(let z=-20;z<22;z+=2) for(let y=6;y<13;y++) addBlock(16,y,z,0);
}
function house(x,y,z,floors,type){
  const w=3,d=3,h=floors*3;
  for(let yy=0;yy<h;yy++) for(let xx=0;xx<w;xx++) for(let zz=0;zz<d;zz++){
    const wall=xx===0||xx===w-1||zz===0||zz===d-1;
    if(wall || yy===h-1) addBlock(x+xx,y+yy,z+zz,type);
  }
  if(floors>1) for(let yy=3;yy<h-1;yy+=3) for(let xx=0;xx<w;xx++) addBlock(x+xx,y+yy,z-1,4);
}
function palm(x,y,z){
  for(let i=0;i<5;i++) addBlock(x,y+i,z,4);
  for(let dx=-2;dx<=2;dx++) for(let dz=-2;dz<=2;dz++) if(Math.abs(dx)+Math.abs(dz)<=3) addBlock(x+dx,y+5,z+dz,3);
}
buildWorld();

function restoreWorldEdits(){
  if(!initialSave?.world) return;
  restoringEdits=true;
  for(const k of initialSave.world.removed || []){
    const [x,y,z]=k.split('|').map(Number); removeBlock(x,y,z,false); removedEdits.add(k);
  }
  for(const b of initialSave.world.added || []){
    addBlock(b.x,b.y,b.z,b.type,false); addedEdits.set(key(b.x,b.y,b.z),b);
  }
  restoringEdits=false;
}
restoreWorldEdits();

const waterMat=new THREE.MeshPhysicalMaterial({color:0x1b7e96,transparent:true,opacity:.64,roughness:.18,metalness:.05});
const water=new THREE.Mesh(new THREE.PlaneGeometry(90,45),waterMat);
water.rotation.x=-Math.PI/2;water.position.set(-35,2,-47);scene.add(water);

const beaconMat=new THREE.MeshBasicMaterial({color:0x69f0c8});
const beaconGeo=new THREE.CylinderGeometry(.13,.13,8,10);
[['AL-BALAD',-5,10],['TUWAIQ',16,0],['OASIS',2,-28],['HARRAT',0,30]].forEach(([name,x,z])=>{
 const h=heightAt(x,z),b=new THREE.Mesh(beaconGeo,beaconMat);b.position.set(x,h+5,z);scene.add(b);
});

let velocityY=0, canJump=false, paused=false, collected=0, placed=0;
const keys={};
let moveInput={x:0,y:0};
let touchYaw=0, touchPitch=0;
let playerGround=0;

addEventListener('keydown',e=>{
 keys[e.code]=true;
 if(/^Digit[1-7]$/.test(e.code))select(parseInt(e.code.slice(5))-1);
 if(e.code==='KeyR')reload(); if(e.code==='KeyQ')swapWeapon(); if(e.code==='KeyF')fortify();
 if(e.code==='KeyP'){
   paused=!paused; pauseEl.style.display=paused?'flex':'none';
   if(paused && !IS_TOUCH) controls.unlock();
   if(!paused && !IS_TOUCH && gameActive) controls.lock();
 }
});
addEventListener('keyup',e=>keys[e.code]=false);

const raycaster=new THREE.Raycaster();
raycaster.far=6;
function pick(){
 raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
 let best=null;
 for(let t=0;t<groups.length;t++){
  const hits=raycaster.intersectObject(groups[t].mesh,false);
  if(hits.length && (!best||hits[0].distance<best.distance)){
    const p=groups[t].positions.get(hits[0].instanceId);
    if(p) best={...hits[0],p};
  }
 }
 return best;
}
function breakTarget(){
 const h=pick(); if(h&&removeBlock(h.p.x,h.p.y,h.p.z,true)){collected++;updateMission();return true} return false;
}
function placeTarget(){
 const h=pick(); if(!h)return false;
 const n=h.face.normal.clone();
 const nx=h.p.x+Math.round(n.x),ny=h.p.y+Math.round(n.y),nz=h.p.z+Math.round(n.z);
 const pp=camera.position;
 if(Math.abs(pp.x-nx)<.75 && Math.abs(pp.z-nz)<.75 && Math.abs((pp.y-1)-ny)<1.8) return false;
 if(addBlock(nx,ny,nz,selected,true)){placed++;updateMission();return true}
 return false;
}
renderer.domElement.addEventListener('mousedown',e=>{
 if(IS_TOUCH || !controls.isLocked || paused) return;
 if(e.button===0) shoot(); else if(e.button===1) breakTarget(); else if(e.button===2) placeTarget();
});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());

function updateMission(){
 if(collected<12) objective.innerHTML=`<b>FOUNDING MISSION // DEFEND</b><div>اصمد أمام الموجة، ثم اجمع موارد التحصين: ${collected}/12</div>`;
 else if(placed<8) objective.innerHTML=`<b>FOUNDING MISSION // 002</b><div>ابنِ علامة من 8 كتل على الأقل: ${placed}/8</div>`;
 else objective.innerHTML=`<b>THE KINGDOM IS YOURS.</b><div>العالم مفتوح. استكشف الحجاز، نجد، الحرات، الواحة والربع الخالي.</div>`;
}

// ---------- V2 COMBAT / DEFENSE ----------
const hpBar=qs('#hpBar'),armorBar=qs('#armorBar'),energyBar=qs('#energyBar'),hpText=qs('#hpText'),armorText=qs('#armorText'),energyText=qs('#energyText'),ammoEl=qs('#ammo'),weaponNameEl=qs('#weaponName'),missionBanner=qs('#missionBanner'),hitFlash=qs('#hitFlash'),modeBadge=qs('#modeBadge');
let health=100,armor=50,energy=100,kills=0,wave=0,combatStarted=false,gameOver=false,ammo=30,reserve=120,reloading=false,lastShot=0,currentWeapon=0;
const weapons=[{name:'EX//ARC-7',mag:30,damage:34,rate:105,spread:.007,color:0x67f0c7},{name:'NAJD//PULSE-12',mag:8,damage:76,rate:520,spread:.025,color:0xffc66d}];
const enemyGeo=new THREE.BoxGeometry(.72,1.7,.72),enemyMat=new THREE.MeshStandardMaterial({color:0x5c1d1d,roughness:.78}),eliteMat=new THREE.MeshStandardMaterial({color:0x252a31,roughness:.52,metalness:.35});
const enemies=[],tracers=[],pickups=[],pickupGeo=new THREE.BoxGeometry(.42,.42,.42),ammoMat=new THREE.MeshStandardMaterial({color:0xe7c15e,emissive:0x3a2b00}),healthMat=new THREE.MeshStandardMaterial({color:0x63e8a8,emissive:0x083a25});
function banner(t,ms=2200){missionBanner.textContent=t;missionBanner.style.opacity=1;clearTimeout(banner.t);banner.t=setTimeout(()=>missionBanner.style.opacity=0,ms)}
function hud(){hpBar.style.width=health+'%';armorBar.style.width=armor+'%';energyBar.style.width=energy+'%';hpText.textContent=Math.ceil(health);armorText.textContent=Math.ceil(armor);energyText.textContent=Math.ceil(energy);weaponNameEl.textContent=weapons[currentWeapon].name;ammoEl.textContent=`${ammo} / ${reserve}`}
function hurt(n){let a=Math.min(armor,n*.58);armor=Math.max(0,armor-a);health=Math.max(0,health-(n-a));hitFlash.classList.add('active');setTimeout(()=>hitFlash.classList.remove('active'),130);hud();if(health<=0&&!gameOver){gameOver=true;banner('SIGNAL LOST',1100);setTimeout(respawn,1250)}}
function respawn(){health=100;armor=35;energy=100;ammo=weapons[currentWeapon].mag;reserve=Math.max(reserve,60);camera.position.set(0,highestSurfaceBelow(0,0,100)+EYE_HEIGHT,0);gameOver=false;hud()}
function spawnEnemy(x,z,elite=false){
  if(!Number.isFinite(x)||!Number.isFinite(z)) return;
  let surface=highestSurfaceBelow(x,z,100);
  let m=new THREE.Mesh(enemyGeo,elite?eliteMat:enemyMat);
  m.position.set(x,surface+.85,z);
  m.castShadow=!IS_TOUCH;scene.add(m);
  enemies.push({mesh:m,hp:elite?160:80,speed:elite?1.45:1.8,damage:elite?18:10,lastAttack:0,elite,dead:false});
}
function startWave(){if(gameOver)return;combatStarted=true;wave++;let n=Math.min(4+wave*2,14);for(let i=0;i<n;i++){let a=i/n*Math.PI*2+Math.random()*.4,r=14+Math.random()*10;spawnEnemy(camera.position.x+Math.cos(a)*r,camera.position.z+Math.sin(a)*r,wave>1&&i%5===0)}banner(`WAVE ${wave} // DEFEND`,1250);modeBadge.textContent=`WAVE ${wave}`}
function tracer(a,b,c){let g=new THREE.BufferGeometry().setFromPoints([a,b]),m=new THREE.LineBasicMaterial({color:c,transparent:true,opacity:.9}),l=new THREE.Line(g,m);scene.add(l);tracers.push({line:l,t:.07})}
function kill(e){e.dead=true;kills++;let pos=e.mesh.position.clone();scene.remove(e.mesh);if(Math.random()<.5){let type=Math.random()<.72?'ammo':'health',m=new THREE.Mesh(pickupGeo,type==='ammo'?ammoMat:healthMat);m.position.copy(pos);scene.add(m);pickups.push({mesh:m,type})}if(enemies.filter(x=>!x.dead).length===0)setTimeout(startWave,4200)}
function shoot(){if(!gameActive||paused||gameOver||reloading)return;let now=performance.now(),w=weapons[currentWeapon];if(now-lastShot<w.rate)return;lastShot=now;if(ammo<=0){reload();return}ammo--;hud();let o=camera.position.clone(),d=new THREE.Vector3();camera.getWorldDirection(d);d.x+=(Math.random()-.5)*w.spread;d.y+=(Math.random()-.5)*w.spread;d.z+=(Math.random()-.5)*w.spread;d.normalize();raycaster.set(o,d);raycaster.far=45;let target=null,dist=45;for(let e of enemies){if(e.dead)continue;let h=raycaster.intersectObject(e.mesh,false)[0];if(h&&h.distance<dist){target=e;dist=h.distance}}if(target){target.hp-=w.damage;if(target.hp<=0)kill(target)}tracer(o.clone().add(d.clone().multiplyScalar(.5)),o.clone().add(d.clone().multiplyScalar(dist)),w.color)}
function reload(){if(reloading||reserve<=0)return;let w=weapons[currentWeapon],need=w.mag-ammo;if(need<=0)return;reloading=true;weaponNameEl.textContent='RELOADING...';setTimeout(()=>{let n=Math.min(need,reserve);ammo+=n;reserve-=n;reloading=false;hud()},850)}
function swapWeapon(){currentWeapon=(currentWeapon+1)%weapons.length;ammo=Math.min(ammo,weapons[currentWeapon].mag);hud();banner(`${weapons[currentWeapon].name}`,650)}
function fortify(){let d=new THREE.Vector3();camera.getWorldDirection(d);d.y=0;d.normalize();let cx=Math.round(camera.position.x+d.x*2.5),cz=Math.round(camera.position.z+d.z*2.5),gy=Math.round(highestSurfaceBelow(cx,cz,camera.position.y)+.5),built=0;for(let dx=-2;dx<=2;dx++)for(let yy=0;yy<3;yy++){let x=cx+Math.round(-d.z*dx),z=cz+Math.round(d.x*dx);if(addBlock(x,gy+yy,z,2,true))built++}banner(`FORTIFY +${built}`,650)}
function updateCombat(dt){for(let e of enemies){if(e.dead)continue;let d=new THREE.Vector3(camera.position.x-e.mesh.position.x,0,camera.position.z-e.mesh.position.z),dist=d.length();if(dist>1.25){d.normalize();e.mesh.position.addScaledVector(d,e.speed*dt);e.mesh.lookAt(camera.position.x,e.mesh.position.y,camera.position.z)}else if(performance.now()-e.lastAttack>720){e.lastAttack=performance.now();hurt(e.damage)}}for(let i=pickups.length-1;i>=0;i--){let p=pickups[i];p.mesh.rotation.y+=dt*3;if(p.mesh.position.distanceTo(camera.position)<1.7){if(p.type==='ammo')reserve=Math.min(240,reserve+30);else health=Math.min(100,health+30);scene.remove(p.mesh);pickups.splice(i,1);hud()}}for(let i=tracers.length-1;i>=0;i--){if((tracers[i].t-=dt)<=0){scene.remove(tracers[i].line);tracers.splice(i,1)}}energy=Math.max(0,energy-dt*.25)}
hud();


// ---------- PRODUCTION PERSISTENCE ----------
let lastSaveAt=0;
function flashSaved(){
  if(!saveToast)return;
  saveToast.style.opacity='1';
  clearTimeout(flashSaved.t);flashSaved.t=setTimeout(()=>saveToast.style.opacity='0',900);
}
function saveGame(silent=false){
  if(!gameActive) return;
  const now=Date.now();
  if(now-lastSaveAt<1200 && !silent) return;
  lastSaveAt=now;
  const state={
    version:SAVE_VERSION, seed:SEED, savedAt:now, day,
    player:{x:camera.position.x,y:camera.position.y,z:camera.position.z,rx:camera.rotation.x,ry:camera.rotation.y},
    combat:{health,armor,energy,kills,wave,ammo,reserve,currentWeapon},
    build:{selected,collected,placed},
    world:{added:[...addedEdits.values()].slice(-3500),removed:[...removedEdits].slice(-3500)}
  };
  try{
    localStorage.setItem(SAVE_KEY,JSON.stringify(state));
    if(!silent) flashSaved();
  }catch(err){
    banner('SAVE STORAGE FULL // OLDEST EDITS LIMITED',1800);
    console.warn('ALJAZIRA save failed',err);
  }
}
function resetWorld(){
  if(!confirm('RESET WORLD سيحذف تقدم هذا العالم من هذا الجهاز. هل أنت متأكد؟'))return;
  localStorage.removeItem(SAVE_KEY); location.reload();
}
resumeBtn?.addEventListener('click',()=>{paused=false;pauseEl.style.display='none';if(!IS_TOUCH&&gameActive)controls.lock()});
saveBtn?.addEventListener('click',()=>saveGame(false));
resetBtn?.addEventListener('click',resetWorld);
setInterval(()=>saveGame(true),15000);
addEventListener('beforeunload',()=>saveGame(true));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveGame(true)});

// ---------- Better voxel collision / ground ----------
const EYE_HEIGHT=1.62, PLAYER_RADIUS=.28, STEP=.55;
function blockExistsAtWorld(x,y,z){
 return occupied.has(key(Math.round(x),Math.round(y),Math.round(z)));
}
function highestSurfaceBelow(x,z,maxFoot){
 const gx=Math.round(x), gz=Math.round(z);
 let best=-Infinity;
 const ceiling=Math.min(45,Math.floor(maxFoot+STEP));
 for(let y=ceiling;y>=-2;y--){
   if(occupied.has(key(gx,y,gz))){
     best=y+.5; break;
   }
 }
 if(best===-Infinity) best=heightAt(gx,gz)+.5;
 return best;
}
function collidesBody(x,footY,z){
 const samples=[
   [x-PLAYER_RADIUS,z-PLAYER_RADIUS],[x+PLAYER_RADIUS,z-PLAYER_RADIUS],
   [x-PLAYER_RADIUS,z+PLAYER_RADIUS],[x+PLAYER_RADIUS,z+PLAYER_RADIUS]
 ];
 for(const [sx,sz] of samples){
   for(const by of [footY+.22, footY+.9, footY+1.48]){
     if(blockExistsAtWorld(sx,by,sz)) return true;
   }
 }
 return false;
}
function tryHorizontalMove(dx,dz){
 const footY=camera.position.y-EYE_HEIGHT;
 const nx=camera.position.x+dx, nz=camera.position.z+dz;
 // X and Z separately = much less "sticky" against walls.
 const testX=camera.position.x+dx;
 if(!collidesBody(testX,footY,camera.position.z)) camera.position.x=testX;
 const testZ=camera.position.z+dz;
 if(!collidesBody(camera.position.x,footY,testZ)) camera.position.z=testZ;
}
function snapOrFall(dt){
 let foot=camera.position.y-EYE_HEIGHT;
 const ground=highestSurfaceBelow(camera.position.x,camera.position.z,foot+.7);
 playerGround=ground;
 velocityY-=24*dt;
 foot += velocityY*dt;
 if(foot<=ground){
   foot=ground; velocityY=0; canJump=true;
 } else canJump=false;
 camera.position.y=foot+EYE_HEIGHT;
}

const startSurface=highestSurfaceBelow(0,0,100);
camera.position.set(0,startSurface+EYE_HEIGHT,0);
if(initialSave?.player){
  const p=initialSave.player;
  if([p.x,p.y,p.z].every(Number.isFinite)) camera.position.set(p.x,p.y,p.z);
  if(Number.isFinite(p.rx)&&Number.isFinite(p.ry)) camera.rotation.set(p.rx,p.ry,0,'YXZ');
}
if(initialSave?.combat){
  health=Math.max(1,Math.min(100,Number(initialSave.combat.health)||100));
  armor=Math.max(0,Math.min(100,Number(initialSave.combat.armor)||0));
  energy=Math.max(0,Math.min(100,Number(initialSave.combat.energy)||100));
  kills=Math.max(0,Number(initialSave.combat.kills)||0);
  wave=Math.max(0,Number(initialSave.combat.wave)||0);
  ammo=Math.max(0,Number(initialSave.combat.ammo)||weapons[0].mag);
  reserve=Math.max(0,Number(initialSave.combat.reserve)||120);
  currentWeapon=Math.max(0,Math.min(weapons.length-1,Number(initialSave.combat.currentWeapon)||0));
}
if(initialSave?.build){
  selected=Math.max(0,Math.min(blockDefs.length-1,Number(initialSave.build.selected)||0)); select(selected);
  collected=Math.max(0,Number(initialSave.build.collected)||0);
  placed=Math.max(0,Number(initialSave.build.placed)||0);
}
hud(); updateMission();
touchYaw=camera.rotation.y; touchPitch=camera.rotation.x;

let day = Number.isFinite(initialSave?.day) ? initialSave.day : 0.18;
const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.035);
 if(!paused){
   day=(day+dt*.0025)%1;
   const ang=day*Math.PI*2-Math.PI*.1;
   sun.position.set(Math.cos(ang)*120,Math.sin(ang)*110,45);
   sun.intensity=Math.max(.15,Math.sin(ang)*3.0);
   const daylight=Math.max(.08,Math.sin(ang)*.75+.28);
   hemi.intensity=.45+daylight*1.65;
   const sky=new THREE.Color().setHSL(.56-daylight*.035,.28+.14*daylight,.11+.58*daylight);
   scene.background.copy(sky); scene.fog.color.copy(sky);

   const active = gameActive && (IS_TOUCH || controls.isLocked);
   if(active){
     let forward = (keys.KeyW||keys.ArrowUp ? 1 : 0) - (keys.KeyS||keys.ArrowDown ? 1 : 0);
     let side = (keys.KeyD||keys.ArrowRight ? 1 : 0) - (keys.KeyA||keys.ArrowLeft ? 1 : 0);
     if(IS_TOUCH){ forward = -moveInput.y; side = moveInput.x; }

     const len=Math.hypot(forward,side);
     if(len>1){forward/=len;side/=len}

     const sprint = IS_TOUCH ? len>.82 : (keys.ShiftLeft||keys.ShiftRight);
     const speed=sprint?6.9:4.45;

     const fwd=new THREE.Vector3();
     camera.getWorldDirection(fwd); fwd.y=0;
     if(fwd.lengthSq()<.001)fwd.set(0,0,-1); fwd.normalize();
     const right=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize();

     const dx=(fwd.x*forward + right.x*side)*speed*dt;
     const dz=(fwd.z*forward + right.z*side)*speed*dt;
     tryHorizontalMove(dx,dz);

     if(keys.Space && canJump){velocityY=8.4;canJump=false;keys.Space=false}
     snapOrFall(dt);
   }

   if(!Number.isFinite(camera.position.x) || !Number.isFinite(camera.position.y) || !Number.isFinite(camera.position.z)){
     const safeGround=highestSurfaceBelow(0,0,100);
     camera.position.set(0,safeGround+EYE_HEIGHT,0);
     velocityY=0;
     moveInput.x=0; moveInput.y=0;
     banner('POSITION RECOVERED // INPUT RESET',1200);
   }
   if(gameActive&&!gameOver) updateCombat(dt);
   if(gameActive&&!combatStarted && gameStartedAt>0 && performance.now()-gameStartedAt>4200) startWave();
   const x=camera.position.x,z=camera.position.z;
   posEl.textContent=`${x.toFixed(1)},${camera.position.y.toFixed(1)},${z.toFixed(1)}`;
   biomeEl.textContent=biomeAt(x,z);
 }
 renderer.render(scene,camera);
}
animate();

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

// ---------- iPhone / Android controls: no Pointer Lock dependency ----------
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function joystick(el, onMove){
 const knob=el.querySelector('.knob');
 let id=null, rect=null;
 const reset=()=>{id=null;rect=null;knob.style.transform='translate(-50%,-50%)';onMove(0,0)};
 const update=e=>{
   if(e.pointerId!==id||!rect)return;
   const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
   let dx=(e.clientX-cx)/(rect.width*.37), dy=(e.clientY-cy)/(rect.height*.37);
   const l=Math.hypot(dx,dy); if(l>1){dx/=l;dy/=l}
   knob.style.transform=`translate(calc(-50% + ${dx*30}px),calc(-50% + ${dy*30}px))`;
   onMove(dx,dy);
 };
 el.addEventListener('pointerdown',e=>{e.preventDefault();id=e.pointerId;rect=el.getBoundingClientRect();el.setPointerCapture(id);update(e)},{passive:false});
 el.addEventListener('pointermove',e=>{e.preventDefault();update(e)},{passive:false});
 el.addEventListener('pointerup',e=>{e.preventDefault();if(e.pointerId===id)reset()},{passive:false});
 el.addEventListener('pointercancel',reset);
}
function lookPad(el){
 const knob=el.querySelector('.knob');
 let id=null,last=null,rect=null;
 const reset=()=>{id=null;last=null;knob.style.transform='translate(-50%,-50%)'};
 el.addEventListener('pointerdown',e=>{
   e.preventDefault();id=e.pointerId;last={x:e.clientX,y:e.clientY};rect=el.getBoundingClientRect();el.setPointerCapture(id)
 },{passive:false});
 el.addEventListener('pointermove',e=>{
   if(e.pointerId!==id||!last)return;e.preventDefault();
   const dx=e.clientX-last.x,dy=e.clientY-last.y;last={x:e.clientX,y:e.clientY};
   touchYaw-=dx*.0065;touchPitch=clamp(touchPitch-dy*.0055,-1.42,1.42);
   camera.rotation.set(touchPitch,touchYaw,0,'YXZ');
   const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
   const kx=clamp((e.clientX-cx)*.32,-28,28),ky=clamp((e.clientY-cy)*.32,-28,28);
   knob.style.transform=`translate(calc(-50% + ${kx}px),calc(-50% + ${ky}px))`;
 },{passive:false});
 el.addEventListener('pointerup',e=>{e.preventDefault();if(e.pointerId===id)reset()},{passive:false});
 el.addEventListener('pointercancel',reset);
}

if(IS_TOUCH){
 qs('#mobile').style.display='block';
 const introFine=qs('#intro .fine');
 if(introFine) introFine.textContent='الجوال: يسار للحركة، يمين للنظر، FIRE للإطلاق، R تعبئة، Q تبديل، ↑ قفز، − كسر، ＋ بناء.';
 joystick(qs('#movePad'),(x,y)=>{moveInput.x=x;moveInput.y=y});
 lookPad(qs('#lookPad'));
 const hold=(el,fn)=>{
   if(!el)return;
   el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();fn()},{passive:false});
 };
 hold(qs('#jumpBtn'),()=>{ if(canJump){velocityY=8.4;canJump=false} });
 hold(qs('#breakBtn'),breakTarget);
 hold(qs('#placeBtn'),placeTarget); hold(qs('#fireBtn'),shoot); hold(qs('#reloadBtn'),reload); hold(qs('#swapBtn'),swapWeapon);
 document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
}
