(()=>{
  const $=s=>document.querySelector(s);

  // Compact mobile icon language.
  const labels={jumpBtn:'↥',breakBtn:'◇',placeBtn:'＋',fireBtn:'◎',reloadBtn:'↻',swapBtn:'⇄'};
  Object.entries(labels).forEach(([id,label])=>{
    const el=document.getElementById(id);
    if(el){el.textContent=label;el.setAttribute('aria-label',id)}
  });

  // Materials drawer.
  let materials=document.getElementById('materialsToggle');
  if(!materials){
    materials=document.createElement('button');
    materials.id='materialsToggle';
    materials.type='button';
    materials.textContent='▦';
    materials.setAttribute('aria-label','مواد البناء');
    document.body.appendChild(materials);
  }
  materials.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    document.body.classList.toggle('materials-open');
  });
  document.getElementById('hotbar')?.addEventListener('pointerdown',()=>{
    setTimeout(()=>document.body.classList.remove('materials-open'),180);
  });

  // Keep the baked cover buttons functional without adding visible text.
  const open=id=>document.getElementById(id)?.classList.add('open');
  const close=id=>document.getElementById(id)?.classList.remove('open');

  $('#howToPlay')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open('helpModal')});
  $('#settingsBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();syncQuality();open('settingsModal')});
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>close(b.dataset.close)));
  document.querySelectorAll('.menuModal').forEach(m=>m.addEventListener('pointerdown',e=>{
    if(e.target===m)close(m.id);
  }));

  const QUALITY_KEY='ex.aljazira.quality';
  function syncQuality(){
    const q=localStorage.getItem(QUALITY_KEY)||(matchMedia('(pointer:coarse)').matches?'balanced':'high');
    document.querySelectorAll('.qualityBtn').forEach(b=>b.classList.toggle('active',b.dataset.quality===q));
  }
  document.querySelectorAll('.qualityBtn').forEach(b=>b.addEventListener('click',()=>{
    localStorage.setItem(QUALITY_KEY,b.dataset.quality);
    syncQuality();
  }));
  $('#applySettings')?.addEventListener('click',()=>location.reload());

  addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      document.querySelectorAll('.menuModal.open').forEach(m=>m.classList.remove('open'));
      document.body.classList.remove('materials-open');
    }
  });
  syncQuality();
})();