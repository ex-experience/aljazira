const $=s=>document.querySelector(s);
const box=$("#chat"),msgs=$("#messages"),form=$("#chatForm"),input=$("#chatInput");
let open=false,backend=false,db=null,auth=null,fn=null;
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function add(name,text,system=false){let p=document.createElement("p");p.className=system?"system":"";p.innerHTML=system?esc(text):`<b>${esc(name)}</b> — ${esc(text)}`;msgs.appendChild(p);msgs.scrollTop=msgs.scrollHeight}
function toggle(){open=!open;box.classList.toggle("hidden",!open);if(open)setTimeout(()=>input.focus(),50)}
$("#chatBtn").onclick=toggle;$("#closeChat").onclick=toggle;
form.onsubmit=async e=>{e.preventDefault();let t=input.value.trim().slice(0,180);if(!t)return;input.value="";
 if(backend&&fn){try{await fn.httpsCallable("sendGlobalChat")({text:t})}catch(err){add("SYSTEM","Message was not sent: "+err.message,true)}}else add("YOU",t)
};
async function init(){
 try{
  const r=await fetch("./chat-config.json",{cache:"no-store"});if(!r.ok)return;const cfg=await r.json();if(!cfg.enabled)return;
  await Promise.all(["firebase-app-compat.js","firebase-auth-compat.js","firebase-firestore-compat.js","firebase-functions-compat.js"].map(n=>new Promise((res,rej)=>{let s=document.createElement("script");s.src="https://www.gstatic.com/firebasejs/10.8.1/"+n;s.onload=res;s.onerror=rej;document.head.appendChild(s)})));
  const app=firebase.apps.length?firebase.app():firebase.initializeApp(cfg.firebase);auth=firebase.auth(app);db=firebase.firestore(app);fn=firebase.functions(app);if(!auth.currentUser)await auth.signInAnonymously();backend=true;msgs.innerHTML="";
  db.collection("GlobalChat").orderBy("CreatedAt","desc").limit(60).onSnapshot(s=>{msgs.innerHTML="";[...s.docs].reverse().forEach(d=>{let x=d.data();add(x.PlayerTag||"PLAYER",x.Text||"")})});
 }catch(e){add("SYSTEM","Local chat mode active.",true)}
}
window.EXChat={toggle};init();