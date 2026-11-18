# دليل نشر أبواب تطمئن على Cloudflare Free

> هذا الدليل للتحضير فقط. لا تُغيّر رابط GitHub Pages أو إعدادات Auth الإنتاجية قبل الاختبار.

## النظام الحالي
- GitHub: `momosyria7/abwab-tatmain`
- قاعدة البيانات: مشروع Supabase الحالي `hxogatyazevahtxwbwhv` (لا نقل للبيانات)
- الموقع الإنتاجي يبقى على GitHub Pages إلى حين مراجعة التغيير.

## خطوات الربط
1. من لوحة Cloudflare، أنشئ مشروع Pages أو Workers Static Assets، واختر الاتصال بـ GitHub.
2. اسمح بوصول Cloudflare إلى مستودع `momosyria7/abwab-tatmain` فقط.
3. استخدم مشروع HTML ثابتًا: لا حاجة إلى أمر Build أو تثبيت dependencies.
4. إذا تطلبت منصة النشر **Build output directory**، استخدم المجلد الجذر عند دعمه، أو أنشئ سكربت نسخ ينشر فقط `index.html` و`app.js` و`_headers` و`.nojekyll`.
5. اضبط فرع الإنتاج على `main`. فرع `dev/abwab-staging-20261118` للاختبار فقط.
6. بعد الحصول على رابط Cloudflare تجريبي، أضفه إلى Supabase Authentication → URL Configuration → Redirect URLs.
7. افحص تسجيل الدخول، تفعيل الدعوات، استعادة كلمة المرور، وأدوار المشرف والطالب وولي الأمر في بيئة اختبار وبحسابات وهمية.
8. بعد اعتماد الاختبارات فقط، بدّل رابط الإنتاج أو النطاق. أبقِ GitHub Pages يعمل حتى التأكد من نجاح النقل.

## الأمان والخصوصية
- لا تضع `service_role` أو `sb_secret_` أو كلمة مرور قاعدة البيانات في GitHub أو ملفات العميل.
- يستخدم متصفح الموقع مفتاح publishable فقط، والصلاحيات تنفذها سياسات Supabase RLS.
- لا تنسخ بيانات الطلاب إلى بيئات تجريبية أو Cloudflare.
- ملف `_headers` يعمل على Cloudflare Pages وقد لا ينطبق على GitHub Pages.
- لا تنشئ مشروع قاعدة بيانات جديدًا لمجرد نقل الواجهة.
