import * as THREE from "three/webgpu";
import {FPSInput} from "./core/Input.js";
import {SaveStore} from "./core/IndexedDBSave.js";
import {ChunkManager} from "./world/ChunkManager.js";
import {PulseGrid} from "./world/PulseGrid.js";
import {RaidDirector} from "./game/RaidDirector.js";
import {EnemyManager} from "./game/EnemyManager.js";
import {ChatAdapter} from "./net/ChatAdapter.js";
import {AnalyticsAdapter} from "./core/AnalyticsAdapter.js";

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const root=$("#root"),menu=$("#menu"),hud=$("#hud");
const analytics=new AnalyticsAdapter({gameId:"EX_ALJAZIRA"}),saveStore=new SaveStore(),chat=new ChatAdapter();
let renderer,scene,camera,input,chunks,enemies,pulse,raid,started=false,worldId="world-main",mode="survival",seed=1;
let hp=100,hunger=100,shield=25,day=1,timeOfDay=8,score=0,lastSave=0,selected=0;
const player={x:0,y:10,z:0,vy:0,on:false,speed:5.2};
const blocks=["SAND","STONE","WOOD","WALL","PULSE","LAMP"],inventory={SAND:30,STONE:18,WOOD:12,WALL:10,PULSE:5,LAMP:3};
const built=[];

async function setup(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x7db9cf);scene.fog=new THREE.Fog(0x91c4cf,36,110);
  camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,180);camera.rotation.order="YXZ";
  renderer=new THREE.WebGPURenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.setAnimationLoop(frame);root.appendChild(renderer.domElement);
  input=new FPSInput(renderer.domElement);
  const hemi=new THREE.HemisphereLight(0xc6f2ff,0x5e503f,1.5);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe4b1,2.4);sun.position.set(20,32,14);sun.userData.sun=true;scene.add(sun);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(800,800),new THREE.MeshStandardMaterial({color:0x167b95,roughness:.22,metalness:.05,transparent:true,opacity:.76}));water.rotation.x=-Math.PI/2;water.position.y=1.8;scene.add(water);
  addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
}
function hotbar(){$("#hotbar").innerHTML=blocks.map((b,i)=>`<div class="slot ${i===selected?"active":""}"><b>${i+1}</b><span>${b}</span><small>${mode==="creative"?"∞":inventory[b]||0}</small></div>`).join("")}
async function start(request){
  if(!renderer)await setup();
  if(request==="continue"){const s=await saveStore.get(worldId);if(s){mode=s.mode;seed=s.seed;Object.assign(player,s.player);Object.assign(inventory,s.inventory||{});day=s.day||1;timeOfDay=s.timeOfDay||8;score=s.score||0}else request="new"}
  if(request==="new"){seed=Math.floor(Math.random()*9999999);mode="survival";player.x=0;player.y=12;player.z=0}
  else if(request!=="continue")mode=request;
  chunks=new ChunkManager(scene,{seed,activeRadius:1,visibleRadius:2,prefetchRadius:3});pulse=new PulseGrid();raid=new RaidDirector();enemies=new EnemyManager(scene,(x,z)=>chunks.heightAt(x,z));
  pulse.add("core","CORE");pulse.setSource("core",true);
  started=true;menu.classList.add("hidden");root.classList.remove("hidden");hud.classList.remove("hidden");$("#mode").textContent=mode.toUpperCase();hotbar();analytics.track("world_loaded",{mode,seed});
}
function damage(n){if(mode==="creative"||mode==="spectator")return;if(shield>0){const a=Math.min(shield,n);shield-=a;n-=a}hp-=n;if(hp<=0){analytics.track("player_death",{mode,score});if(mode==="hardcore")saveStore.del(worldId);hp=100;hunger=80;shield=15;player.x=0;player.z=0;player.y=12}}
function shoot(){const dir=new THREE.Vector3();camera.getWorldDirection(dir);if(enemies.rayHit(camera.position,dir)){score+=80;analytics.track("enemy_kill",{score})}}
function mine(){/* terrain edits are intentionally adapter-based in V2; use this hook for block-delta persistence */ score+=1}
function build(){const type=blocks[selected];if(mode!=="creative"&&(inventory[type]||0)<=0)return;if(mode!=="creative")inventory[type]--;score+=3;hotbar()}
async function save(){const payload={id:worldId,mode,seed,player:{...player},inventory:{...inventory},day,timeOfDay,score,pulse:pulse.serialize(),modifiedAt:Date.now()};await saveStore.put(payload);lastSave=performance.now()}
let prev=performance.now(),fireCd=0;
function frame(ms){
  const dt=Math.min(.04,(ms-prev)/1000||0);prev=ms;if(!started)return;const a=input.axis(),sp=player.speed*((input.keys.ShiftLeft||input.keys.ShiftRight)?1.55:1),sin=Math.sin(input.yaw),cos=Math.cos(input.yaw);
  player.x+=(a.x*cos-a.z*sin)*sp*dt;player.z+=(a.x*sin+a.z*cos)*sp*dt;
  const fly=mode==="creative"||mode==="spectator";if(fly){if(input.keys.Space)player.y+=sp*dt;if(input.keys.KeyQ)player.y-=sp*dt}else{player.vy-=15*dt;if(input.keys.Space&&player.on){player.vy=6.2;player.on=false}player.y+=player.vy*dt;const g=chunks.heightAt(player.x,player.z)+1.7;if(player.y<=g){player.y=g;player.vy=0;player.on=true}}
  camera.position.set(player.x,player.y,player.z);camera.rotation.y=input.yaw;camera.rotation.x=input.pitch;chunks.update(player.x,player.z);
  if(input.keys.Digit1)selected=0;if(input.keys.Digit2)selected=1;if(input.keys.Digit3)selected=2;if(input.keys.Digit4)selected=3;if(input.keys.Digit5)selected=4;if(input.keys.Digit6)selected=5;hotbar();
  fireCd=Math.max(0,fireCd-dt);if((input.primary||input.keys.KeyF)&&fireCd<=0){shoot();fireCd=.16}if(input.secondary){build();input.secondary=false}if(input.keys.KeyM){mine();input.keys.KeyM=false}
  enemies.update(dt,player,damage);raid.update(dt,{days:day,baseValue:score*.05,weapons:1,players:1},cost=>enemies.spawn(player,cost));pulse.tick();
  timeOfDay+=dt*.18;if(timeOfDay>=24){timeOfDay-=24;day++}if(mode==="survival"||mode==="hardcore"||mode==="adventure"){hunger=Math.max(0,hunger-dt*.2);if(hunger<=0)damage(dt*2)}
  const sun=scene.children.find(x=>x.userData?.sun);if(sun){const daylight=.2+.8*Math.max(0,Math.sin((timeOfDay-6)/24*Math.PI*2));sun.intensity=.25+daylight*2.4;sun.position.set(Math.cos(timeOfDay/24*Math.PI*2)*40,10+daylight*42,18);scene.background.setHSL(.54,.38,.18+daylight*.44);scene.fog.color.copy(scene.background)}
  $("#hp").style.width=Math.max(0,hp)+"%";$("#hunger").style.width=Math.max(0,hunger)+"%";$("#shield").style.width=Math.max(0,shield)+"%";$("#clock").textContent=`DAY ${day} • ${String(Math.floor(timeOfDay)).padStart(2,"0")}:${String(Math.floor((timeOfDay%1)*60)).padStart(2,"0")}`;
  if(ms-lastSave>15000)save();renderer.render(scene,camera)
}
$$("[data-mode]").forEach(b=>b.onclick=()=>start(b.dataset.mode));
const chatBox=$("#chat"),messages=$("#messages"),form=$("#chatForm"),inputEl=$("#chatInput");
function addMessage(m){const p=document.createElement("p");p.textContent=`${m.player}: ${m.text}`;messages.appendChild(p);messages.scrollTop=messages.scrollHeight}
chat.onMessage(addMessage);$("#chatBtn").onclick=()=>chatBox.classList.remove("hidden");$("#closeChat").onclick=()=>chatBox.classList.add("hidden");form.onsubmit=e=>{e.preventDefault();chat.send(inputEl.value);inputEl.value=""};
analytics.track("game_visit");
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
