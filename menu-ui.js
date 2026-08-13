
(() => {
  const $ = (s) => document.querySelector(s);
  const open = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    const focusable = el.querySelector('button');
    focusable?.focus({preventScroll:true});
  };
  const close = (id) => document.getElementById(id)?.classList.remove('open');

  $('#howToPlay')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); open('helpModal'); });
  $('#settingsBtn')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); syncQuality(); open('settingsModal'); });

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => close(btn.dataset.close));
  });
  document.querySelectorAll('.menuModal').forEach(modal => {
    modal.addEventListener('pointerdown', (e) => {
      if (e.target === modal) close(modal.id);
    });
  });

  const modeCopy = {
    modeOpen: ['OPEN WORLD', 'استكشف مناطق ALJAZIRA بحرية: الحجاز، نجد، الحرات، الواحات والربع الخالي. العالم يُولد وفق Seed ويحفظ تقدمك محليًا.'],
    modeSurvival: ['SURVIVAL', 'قاتل، اجمع الموارد، حافظ على الصحة والدرع والطاقة، وابنِ تحصيناتك أثناء موجات التهديد.'],
    modeCreative: ['CREATIVE', 'مساحة البناء الحر هي اتجاه التطوير القادم. النسخة الحالية تسمح بالبناء والتكسير داخل عالم البقاء.'],
    modeCombat: ['COMBAT', 'أسلحة EX الأصلية، ذخيرة، Reload، تبديل سلاح، خصوم وموجات قتال ودفاع عن الجزيرة.']
  };
  Object.entries(modeCopy).forEach(([id, data]) => {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault();
      $('#modeTitle').textContent = data[0];
      $('#modeDescription').textContent = data[1];
      open('modeModal');
    });
  });

  const QUALITY_KEY = 'ex.aljazira.quality';
  function syncQuality(){
    const q = localStorage.getItem(QUALITY_KEY) || (matchMedia('(pointer:coarse)').matches ? 'balanced' : 'high');
    document.querySelectorAll('.qualityBtn').forEach(b => b.classList.toggle('active', b.dataset.quality === q));
  }
  document.querySelectorAll('.qualityBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.setItem(QUALITY_KEY, btn.dataset.quality);
      syncQuality();
    });
  });
  $('#applySettings')?.addEventListener('click', () => location.reload());

  document.querySelectorAll('.menuHotspot').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 180);
    });
  });

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.menuModal.open').forEach(m => m.classList.remove('open'));
    }
    if (e.key === 'Enter' && !document.querySelector('.menuModal.open') && !document.body.classList.contains('in-game')) {
      $('#start')?.click();
    }
  });

  syncQuality();
})();
