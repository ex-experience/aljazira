# EX™ ALJAZIRA — RC2 UI DEPLOY

هذه النسخة تستبدل واجهة البداية القديمة بالغلاف الرسمي، مع أزرار HTML حقيقية فوق الصورة.

## الأزرار الفعلية
- CONTINUE: يبدأ/يستكمل العالم عبر نفس `#start` الذي يستخدمه محرك اللعبة.
- NEW WORLD: ينشئ Seed جديدًا ويحذف الحفظ المحلي بعد التأكيد.
- HOW TO PLAY: نافذة تعليمات حقيقية.
- SETTINGS: اختيار HIGH / BALANCED / PERFORMANCE وحفظه في Local Storage.
- أيقونات OPEN WORLD / SURVIVAL / CREATIVE / COMBAT: معلومات تفاعلية.

## GitHub Pages
استبدل محتويات المستودع `ex-experience/ex-aljazira` بمحتويات هذا المجلد مع الحفاظ على نفس البنية.

يجب أن تكون الملفات التالية في جذر المستودع:
- index.html
- game.js
- bootstrap.js
- menu-ui.js
- service-worker.js
- manifest.webmanifest
- version.json
- .nojekyll
- assets/menu-cover.webp
- assets/menu-cover.jpg
- assets/icon-192.png
- assets/icon-512.png

ثم:
Settings → Pages → Deploy from a branch → main → /(root)

بعد النشر، على iPhone إذا ظهرت الواجهة القديمة بسبب PWA cache:
1. افتح الرابط في Safari.
2. Refresh.
3. إذا بقيت النسخة القديمة: Settings → Safari → Advanced → Website Data، احذف بيانات موقع GitHub Pages الخاص باللعبة، ثم افتحه مجددًا.
