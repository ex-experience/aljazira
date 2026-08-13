const fatal=document.querySelector('#fatal');
const fatalText=document.querySelector('#fatalText');
function showFatal(err){
  console.error(err);
  if(fatal){
    fatal.style.display='flex';
    fatalText.textContent=String(err?.stack||err?.message||err);
  }
}
window.addEventListener('error',e=>showFatal(e.error||e.message));
window.addEventListener('unhandledrejection',e=>showFatal(e.reason||'Unhandled promise rejection'));

if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')){
  addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(console.warn));
}
import('./game.js').catch(showFatal);
