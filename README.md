# صيدلية حياة المجد

متجر عربي RTL مبني بـ Next.js App Router وTypeScript وTailwind CSS، مع Supabase Auth وPostgres وStorage. الطلب عبر واتساب دون دفع إلكتروني. لا تُحفظ بيانات الزبون على الخادم؛ تُستخدم لبناء رابط الرسالة، وتبقى السلة محلياً.

## التشغيل المحلي

يتطلب Node.js 22 أو أحدث.

```powershell
npm ci
Copy-Item .env.example .env.local
```

للمعاينة دون Supabase ضع `DEMO_MODE=true` في `.env.local`، ثم:

```powershell
npm run dev
```

افتح http://127.0.0.1:3000، والإدارة في http://127.0.0.1:3000/admin. تم تجهيز `.env.local` محلياً بالوضع التجريبي، وهو مستثنى من Git. لا تستبدله إن أضفت مفاتيحك إليه بالفعل.

المعاينة تعرض ستة منتجات وهمية ورسومات SVG أصلية موسومة بالتجريب. زر الطلب يعرض نص الرسالة محلياً فقط في هذا الوضع، ولا يفتح واتساب بمنتجات غير حقيقية. لا يوجد حساب إدارة افتراضي أو تجاوز للمصادقة.

## إعداد Supabase

1. أنشئ مشروع Supabase. من SQL Editor نفّذ `supabase/schema.sql` مرة واحدة. ينشئ المنتجات وجدول المديرين وسياسات RLS وحاوية `product-images` العامة للصور بحد 5 MB وأنواع JPEG وPNG وWebP. كل منتجات الجدول ظاهرة للزوار، بما فيها النافدة مع تعطيل الإضافة.
2. من إعدادات المشروع انسخ Project URL وPublishable key إلى `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
DEMO_MODE=false
NEXT_PUBLIC_LOGO_URL=
```

المفتاح المنشور ليس سرياً، وسياسات RLS هي حاجز الصلاحيات. لا يحتاج التطبيق `service_role` ولا يجب وضع أي مفتاح سري في `NEXT_PUBLIC_*`.

3. في Authentication عطّل **Allow new users to sign up**. أنشئ مستخدم الدكتور من Users → Add user، بالبريد وكلمة مرور قوية مع تأكيد البريد. لا توجد صفحة تسجيل حساب عامة.
4. انسخ UUID المستخدم ونفّذ في SQL Editor:

```sql
insert into public.admins(user_id) values ('UUID_OF_ADMIN');
```

لا يمكن للمستخدمين إضافة أنفسهم لجدول المديرين. للتحكم في الوصول أضف/احذف العضوية من SQL Editor فقط.

5. أعد تشغيل الخادم، ثم سجّل الدخول من `/admin`. أضف المنتجات الحقيقية وصورها، وحدد التوفر والتمييز. صور التخزين دائمة ومستقلة عن مجلد التطبيق. حذف منتج لا يحذف صورته تلقائياً لتجنب حذف صورة مشتركة؛ يمكن تنظيف الصور غير المستخدمة من لوحة Storage.
6. اختيارياً نفّذ `supabase/seed.sql` لإدخال عينات داخل قاعدة البيانات. المنتجات الموسومة `is_demo` محظورة من الطلب الحقيقي. احذفها من الإدارة أو باستخدام `delete from public.products where is_demo=true;` قبل الإطلاق.

## الشعار والمظهر

الشعار الأصلي المرفق موجود في `public/logo.png` ويُعرض تلقائياً في الهيدر والتذييل والإدارة. بقي ملف المصدر `logo` دون تعديل. يمكن تغيير المسار باستخدام `NEXT_PUBLIC_LOGO_URL`. التصميم الجديد في `src/app/storefront.css`، والأنماط الأساسية في `src/app/globals.css`، والهوية في `src/components/brand.tsx`. خط Noto Sans Arabic مستضاف محلياً من حزمة Fontsource. صورة الواجهة في `public/images/care-editorial.png` ومواصفات توليدها في `public/images/ASSETS.md`. رسوم المنتجات تجريبية في `public/products` وتُستبدل بصور المنتجات الحقيقية من لوحة الإدارة.

## التحقق والاختبارات

```powershell
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

اختبارات الوحدة تتحقق من ترميز رسالة واتساب والإجمالي وتغيّر الأسعار ونفاد/حذف المنتجات وصحة المدخلات. اختبارات المتصفح التجريبية تغطي البحث والتصنيف والتفاصيل والسلة وحفظها بعد التحديث ومعاينة الرسالة وعدم التمرير الأفقي ومنع الزائر من الإدارة. شغّلها في وضع `DEMO_MODE=true` دون مفاتيح Supabase؛ لا تستخدمها على بيانات إنتاجية.

اختبار الإدارة الفعلي موجود في `tests/e2e/admin-live.spec.ts` ويُتخطّى حتى تضبط الاتصال وحساب المدير. في مشروع Supabase مخصص للاختبار، شغّل الخادم مع بيانات الاتصال الصحيحة و`DEMO_MODE=false` ثم نفّذ في PowerShell:

```powershell
$env:LIVE_ADMIN_EMAIL='your-test-admin@example.com'
$env:LIVE_ADMIN_PASSWORD='your-test-admin-password'
npx playwright test admin-live
```

ينشئ الاختبار منتجاً مؤقتاً، ويرفع صورة PNG، ويعدّل السعر، ويتحقق من تغيّر السعر في الطلب، ويعترض رابط واتساب قبل مغادرة المتجر (دون إرسال رسالة)، ثم يحذف المنتج ويختبر تسجيل الخروج. تبقى صورة الاختبار في التخزين ويمكن حذفها من لوحة Supabase. لا تضع بيانات حساب الاختبار في Git. يمكن حذف المتغيرين بعد الاختبار باستخدام `Remove-Item Env:LIVE_ADMIN_EMAIL, Env:LIVE_ADMIN_PASSWORD`.

## مسار الطلب

الخادم يعيد قراءة السعر والتوفر من Supabase عند كل محاولة. اختلاف السعر أو حذف/نفاد المنتج يعيد `409` ويظهر تنبيهاً بالسلة، ويتطلب مراجعة الزبون وإعادة المحاولة. الاسم والهاتف والعنوان إلزامية. رقم الهاتف يقبل `07xxxxxxxxx` أو `9647xxxxxxxxx` أو `+9647xxxxxxxxx`. لا يُفرّغ فتح واتساب السلة، ولا يعني أن الطلب أُرسل أو قُبل. رسوم التوصيل تُؤكد عبر المحادثة.

## النشر

انشر على بيئة تدعم Next.js Node runtime (ليس تصديراً ثابتاً)، واضبط متغيرات Supabase و`DEMO_MODE=false`، ثم `npm run build` و`npm start`، مع HTTPS في الإنتاج. اضبط Site URL في Supabase على نطاق المتجر. تأكد أن الوكيل العكسي يحتفظ بترويسة Host الأصلية كي يعمل فحص مصدر الطلب. لا تخزّن صفحات الإدارة أو استجابات المصادقة في CDN.

## حالة التسليم

تم تشغيل البناء وTypeScript وESLint واختبارات الوحدة والمتصفح التجريبية محلياً. لم يُنفذ اختبار دخول الدكتور والحفظ والرفع الفعلي في Supabase لعدم وجود عنوان المشروع والمفتاح وحساب المدير. يلزم توفير هذه القيم وتطبيق SQL ثم تشغيل اختبار `admin-live` قبل استخدام المتجر للطلبات الفعلية.

مراجع التنفيذ: [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)، [Supabase SSR](https://supabase.com/docs/guides/auth/server-side).

## ????? ??????? ? ?????? ????

??????? ??????? ?? `src/components/storefront/home.tsx`? ?? ?????? ?????? ???????? ????????? ?????? ????????. ?????? ??????? ????? ??????? ????? ?????? ?????? ???? WebP ????? ?? ??????? ???????. ??????? ????? ?? ???????? ???????? ???? ?????? ?????? ????? ??????. ???? ?????? Supabase ????????? ??????? ?? ????? ??? ?????.

- [???? ???????](docs/design-system.md)
- [??????? ??????](docs/visual-direction.md)
- [??? ??????](docs/asset-inventory.md)
- [????? ??????](docs/verification.md)

?????? ?????? ??? ???????? ?????? ??? ???? ?????? ????: `node scripts/review-storefront.mjs`. ???? ????? ????? ????? ?????? `REVIEW_BASE_URL`. ????? ?? `artifacts/premium-review/`. ??????? ??????? ?? `mobile-store.css` ??? ??????? ?`components/store.tsx` ???? ??? ??????? ??????. ???? ?? ??? ??????? ?????? ?? Git ????????? `f45352d` ??? ????? `design/premium-storefront`.
