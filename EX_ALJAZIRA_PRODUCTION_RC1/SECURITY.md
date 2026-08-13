# SECURITY

ALJAZIRA RC1 static single-player client stores save data in browser LocalStorage only.

- لا توجد أسرار أو API keys داخل العميل.
- لا توجد حسابات أو محادثات أو مدفوعات في RC1.
- لا تثق بأي نتيجة Score قادمة من العميل عند إضافة Leaderboards مستقبلًا؛ يجب التحقق منها Server-side.
- عند إضافة Multiplayer/Chat يجب إضافة authentication, authorization, rate limits, moderation, abuse reporting and server-authoritative state.
