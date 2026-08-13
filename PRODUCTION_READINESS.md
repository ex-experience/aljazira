# EX™ ALJAZIRA — PRODUCTION RC1

هذه النسخة تنقل المشروع من MVP تقني إلى **Production Candidate قابل للنشر كـPublic Beta أحادي اللاعب**.

## ما تم تحصينه
- إصلاحات الحركة وNaN من V2.1.
- أزرار القتال على الجوال أصبحت موجودة فعليًا.
- حفظ محلي + Continue World + Autosave كل 15 ثانية.
- حفظ: Seed، موقع اللاعب، زاوية الكاميرا، الصحة، الدرع، الطاقة، الذخيرة، السلاح، الموجة، القتلى، الكتل المضافة والمحذوفة.
- World edits bounded لحماية LocalStorage.
- New World / Reset World.
- Recovery تلقائي للإحداثيات غير الصالحة.
- Service Worker + PWA cache بعد أول تحميل.
- أيقونات PWA 192/512.
- شاشة Fatal Error بدل شاشة بيضاء صامتة.
- SEO / social metadata.
- ملفات جودة CI لـ GitHub.
- Versioning واضح: 3.0.0-rc.1.

## ماذا يعني Production هنا؟
هذه النسخة مناسبة لإطلاق **Public Beta / Marketing Campaign** للـsingle-player demo بعد اختبار الأجهزة الموضحة في QA_CHECKLIST.md.

ليست بعد Production عالمي متعدد اللاعبين. الخصائص التالية تحتاج Backend منفصل قبل اعتبارها Production:
- الحسابات.
- Multiplayer authoritative server.
- Live chat.
- Cloud saves.
- moderation / abuse prevention.
- purchases/economy.
- creator uploads/mod hosting.

## Gate قبل الحملة
لا تنشر إعلانًا مدفوعًا قبل نجاح:
1. Windows Chrome/Edge.
2. iPhone Safari.
3. Android Chrome.
4. Reload + Continue World.
5. البناء/التكسير.
6. إطلاق النار/Reload/Swap.
7. 20 دقيقة لعب بدون NaN أو سقوط غير مبرر.
