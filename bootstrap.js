const fatal=document.querySelector('#fatal');
const fatalText=document.querySelector('#fatalText');

function showFatal(err){
  console.error('[EX ALJAZIRA]',err);
  if(fatal){
    fatal.style.display='flex';
    if(fatalText) fatalText.textContent=String(err?.stack||err?.message||err||'Unknown startup error');
  }
}
window.addEventListener('error',e=>showFatal(e.error||e.message));
window.addEventListener('unhandledrejection',e=>showFatal(e.reason||'Unhandled promise rejection'));

// RC2.1 compatibility: keep an invisible legacy help target for mobile code.
const intro=document.querySelector('#intro');
if(intro && !intro.querySelector('.fine')){
  const fine=document.createElement('span');
  fine.className='fine';
  fine.hidden=true;
  fine.setAttribute('aria-hidden','true');
  intro.appendChild(fine);
}

if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')){
  addEventListener('load',()=>{
    navigator.serviceWorker
      .register('./service-worker.js?v=3.1.1-hotfix1',{updateViaCache:'none'})
      .then(reg=>reg.update())
      .catch(console.warn);
  });
}

import('./game.js?v=3.1.1-hotfix1').catch(showFatal);
