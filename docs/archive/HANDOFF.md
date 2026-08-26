# GeoIssue — Project Handoff for Analysis

## تعليمات للمحادثة الجديدة

حلل هذا المشروع قبل كتابة أي كود. لا تفترض أن الميزات مكتملة من وجود ملفات أو واجهات. افصل دائمًا بين `VERIFIED` و`IMPLEMENTED, NOT VERIFIED` و`MISSING` و`BLOCKED` و`N/A`.

## الفكرة في جملة واحدة

GeoIssue منصة خرائط مدنية تجمع بلاغات المواطنين المتشابهة في مشكلة واحدة، وتحسب حجمها وأولويتها وتتابع حالتها حتى الحل.

## المشكلة

عندما يرسل 100 شخص صورًا لنفس الحفرة أو الطريق المتضرر، تظهر 100 تقارير منفصلة. هذا يصعّب معرفة المشكلة الحقيقية وحجمها وأولويتها. الحل هو فصل **البلاغ Report** عن **المشكلة Issue**:

- Report: إرسال مواطن واحد، مع صورة ووصف وموقع.
- Issue: مشكلة موحدة قد تحتوي عدة Reports ومؤيدين.

## الفئة المستهدفة

- المواطنون الذين يرصدون مشكلات مكانية.
- المراجعون أو فرق التشغيل التي تحتاج قائمة مرتبة.
- المديرون الذين يحتاجون إحصاءات مجمعة.

## الأدوار

- Visitor: قراءة الخريطة والمشكلات العامة.
- User: إنشاء بلاغ، تأييد مشكلة، متابعة بلاغاته، وتعديل/حذف ما يسمح به النظام.
- Reviewer: مراجعة المشكلات وتغيير حالتها وأولويتها.
- Admin: إدارة المستخدمين والأدوار والفئات وسجل التدقيق.

## التدفق الأساسي

```text
فتح الخريطة → إرسال بلاغ → تحقق من المدخلات والهوية
→ البحث عن مشكلة مشابهة قريبة
→ ربط البلاغ بمشكلة موجودة أو إنشاء مشكلة جديدة
→ مراجعة المشرف → معالجة → إغلاق مع ملاحظة/إثبات
```

## MVP المطلوب

1. Firebase email/password authentication.
2. خريطة Leaflet/OpenStreetMap.
3. تحديد الموقع بالنقر أو GPS والبحث عن المكان.
4. إنشاء Report بوصف وفئة وموقع وصورة اختيارية.
5. حفظ دائم في Neon PostgreSQL.
6. تجميع مبدئي للتقارير القريبة والمتشابهة.
7. دعم/تأييد مشكلة بدل تكرارها.
8. حالات: `submitted`, `in_review`, `accepted`, `in_progress`, `resolved`, `rejected`.
9. Dashboard للمستخدم وDashboard للمراجع.
10. Authorization على الخادم، لا على الواجهة فقط.
11. اختبارات API وE2E للمسارات الرئيسية.

## ما يؤجل

PostGIS، Redis، queues، CDN، load balancing، تطبيق جوال، ذكاء اصطناعي لتصنيف الصور، تكامل مباشر مع البلدية أو الإسعاف، وتتبع المركبات اللحظي. لا تضفها إلا إذا ظهر احتياج مثبت.

## التقنية الحالية/المستهدفة

- Frontend: React + Vite + TypeScript.
- Backend: Node.js + Express + TypeScript.
- Auth: Firebase Authentication + Firebase Admin token verification.
- Database: Neon PostgreSQL مع migrations وconstraints وindexes.
- Maps: Leaflet + OpenStreetMap.
- Geocoding: Nominatim عبر الخادم، مع timeout وfallback.
- Quality: lint, typecheck, unit tests, Playwright E2E.
- Delivery: GitHub، فروع `feat/*`، وبيئات local/staging/production.

## الجداول الأساسية

- `users`: هوية المستخدم والدور واللغة وحالة الحساب.
- `issues`: المشكلة الموحدة، موقعها، فئتها، أولويتها وحالتها.
- `reports`: البلاغ الفردي المرتبط بالمشكلة وصاحبه وصورته.
- `issue_supporters`: المستخدمون الذين أيدوا المشكلة.
- `issue_status_history`: تاريخ تغييرات الحالة.
- `audit_logs`: العمليات الإدارية الحساسة.

## APIs المقترحة

```text
GET    /api/health
GET    /api/issues?page=1&limit=20&status=...
GET    /api/issues/:id
GET    /api/me
GET    /api/me/reports
POST   /api/reports
PUT    /api/reports/:id
DELETE /api/reports/:id
POST   /api/issues/:id/support
GET    /api/geocode?q=...
GET    /api/admin/issues
PATCH  /api/admin/issues/:id/status
PATCH  /api/admin/issues/:id/priority
GET    /api/admin/users
GET    /api/admin/audit-logs
```

## الصفحات

عامة: `/`, `/issues`, `/issues/:id`, `/login`, `/register`, `/about`.

مستخدم: `/dashboard`, `/reports/new`, `/my-reports`, `/settings`.

إدارة: `/admin`, `/admin/issues`, `/admin/issues/:id`, `/admin/users`, `/admin/audit-log`.

## العرض التدريجي

في الأسبوع الأول يُعرض الـfrontend والـwireframes فقط، وهذا ليس نسخة منفصلة من المشروع. الواجهة يجب أن تكون مبنية على نفس الـroutes والـdata model، ثم تُربط تدريجيًا:

- أسبوع 1: HTML/CSS وRTL وresponsive وواجهة الخريطة.
- أسبوع 2: JavaScript، forms، validation وmock state.
- أسبوع 3: React، components، routing وstates.
- أسبوع 4: Express وREST API.
- أسبوع 5: Firebase Auth وownership.
- أسبوع 6: Neon وCRUD دائم.
- أسبوع 7: reviewer/admin وaudit.
- أسبوع 8: tests، deployment، demo.

## الوثائق المطلوبة قبل الكود

1. Problem statement.
2. Personas وactors.
3. Functional/non-functional requirements.
4. User stories وacceptance criteria.
5. Use Case Diagram.
6. Activity/User Flow Diagram.
7. ERD وقواعد البيانات.
8. Architecture Diagram.
9. API contract وأشكال الأخطاء.
10. Permission matrix.
11. Wireframes بسيطة.
12. MVP مقابل Full Scope.
13. Test plan.
14. Deployment and rollback plan.

## أسئلة التحليل المطلوبة

- هل فصل Report عن Issue ممثل بشكل صحيح في البيانات والـAPI؟
- كيف نحدد أن بلاغين لنفس المشكلة؟ وما حدود الخطأ؟
- هل الملكية والصلاحيات enforced server-side؟
- هل الحذف والتعديل مسموحان قبل/بعد المراجعة؟
- هل البيانات الخاصة مخفية عن القراءة العامة؟
- هل Neon يحفظ البيانات بعد إعادة تشغيل الخادم؟
- ماذا يحدث عند فشل GPS أو geocoding أو رفع الصورة؟
- هل pagination والـrate limits مطلوبة؟
- هل كل requirement مرتبط بشاشة وAPI وجدول واختبار؟
- ما الذي هو فعليًا مكتمل وما الذي ما زال خطة؟

## معيار النجاح

يستطيع مستخدم مصادق إنشاء بلاغ بموقع دقيق، يحفظه الخادم في Neon، يربطه بمشكلة موجودة أو ينشئ مشكلة جديدة، يظهر على الخريطة، يستطيع مستخدم آخر تأييده، ويستطيع Reviewer معتمد تغيير حالته، مع منع العمليات غير المصرح بها وتسجيل التغييرات الحساسة.

## المستودعات

- `GeoIssue`: التطبيق النهائي المتكامل.
- `ankageo-web-training`: التمارين واليوميات وأدلة التعلم والعروض الأسبوعية.

لا تنسخ كود التطبيق كاملًا إلى مستودع التدريب. اربط كل تمرين أو أسبوع بـcommit أو feature مطبق في GeoIssue.

## المطلوب من المحلل

أخرج تقريرًا قبل التنفيذ يتضمن: الفجوات، القرارات التي تحتاج موافقة، مخططًا معماريًا مقترحًا، خطة تنفيذ مرتبة، مخطط قاعدة البيانات، permission matrix، API contract، test plan، ومخاطر المشروع. لا تبدأ بالتعديل قبل إنهاء هذا التحليل.
