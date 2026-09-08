# Application Architecture & Structure Guide

## Frontend

واجهة التطبيق موجودة في `client/src/`:

- `app/`: تشغيل التطبيق والـ routes.
- `components/`: مكونات صغيرة مشتركة مثل الهيدر، الخريطة، الحالات، والأزرار.
- `features/`: صفحات المنتج الأساسية: المشاكل، البلاغات، الإدارة، وتسجيل الدخول.
- `services/`: الاتصال بالـ API، المصادقة، والثيم.
- `locales/`: نصوص اللغات العربية والإنجليزية والتركية.
- `styles/`: التصميم العام، المتغيرات، الخريطة، وتنسيقات الصفحات.

ابدأ بـ `client/src/app/App.jsx` ثم `client/src/app/router.jsx` لفهم تركيب التطبيق والمسارات، وبعدها `client/src/features/issues/IssueExplore.jsx` و`client/src/services/api.js`.

## Backend

هذا الدليل يشرح هيكلية الباك-إند (Express + JavaScript Modular Monolith):

```text
server/src/
├── config/              # إعدادات البيئة و Firebase
│   ├── env.js          # قراءة المتغيرات البيئية والتأكد من صحتها
│   └── firebase.js     # تهيئة Firebase Admin SDK
│
├── db/                  # طبقة قاعدة البيانات (PostgreSQL / Neon)
│   ├── pool.js         # الاتصال بقاعدة البيانات + In-Memory Mock Store للتطوير المحلي
│   ├── schema.sql      # مخطط الجداول والقيود والفهارس (6 جداول رئيسية)
│   └── migrations.js   # مشغل ترحيل المخطط لقاعدة البيانات الحية
│
├── middleware/          # البرمجيات الوسيطة
│   ├── auth.middleware.js     # فك رموز JWT من Firebase وتحديد الأدوار + مستخدم تجريبي محلي
│   ├── validate.middleware.js # التحقق من صحة المدخلات باستخدام Zod
│   └── error.middleware.js    # معالج الأخطاء المركزي الموحد
│
├── modules/             # وحدات الأعمال (Feature Modules)
│   ├── issues/         # عرض واستكشاف وتفاصيل المشكلات الموحدة
│   ├── reports/        # إنشاء البلاغات وربطها بالمشكلات عبر Haversine
│   ├── support/        # تأييد المشكلات وإلغاء التأييد
│   ├── categories/     # فئات المشكلات (طرق، مياه، كهرباء...)
│   ├── users/          # ملف المستخدم والمزامنة وبلاغاتي
│   ├── admin/          # لوحة التحكم وتغيير الحالات وإدارة المستخدمين
│   └── geocoding/      # البحث العكسي والمواقع عبر Nominatim Proxy
│
├── shared/              # الكود المشترك والمنطق الرياضي
│   ├── haversine.js    # خوارزمية حساب المسافة الجغرافية والتجميع (50 متر)
│   ├── stateMachine.js # آلة حالات دورة حياة المشكلة وقواعد الانتقال
│   ├── errors.js       # كلاسات الأخطاء المخصصة (AppError, UnauthorizedError...)
│
├── tests/               # الاختبارات الآلية (Vitest)
│   ├── haversine.test.js    # اختبار دقة حساب المسافات
│   ├── stateMachine.test.js # اختبار صحة انتقالات الحالات
│   ├── permissions.test.js  # اختبار أذونات الأدوار (Visitor, User, Admin)
│   └── api.smoke.test.js    # اختبار استجابات الـ API وأكواد الأمان
│
├── app.js               # تجميع Express وتثبيت الـ Middlewares والـ Routes
└── server.js            # نقطة البداية وتشغيل الخادم على المنفذ 4000
```

## نمط التصميم (Controller-Service-Repository)

لكل وحدة في `modules/`:
1. **Routes (`*.routes.js`)**: تحديد مسارات الـ HTTP والـ Middlewares المناسبة (مثل `requireAuth`, `requireRole('admin')`, `validate(schema)`).
2. **Controller (`*.controller.js`)**: استقبال الطلبات (HTTP Request)، استخراج البيانات، واستدعاء الخدمة، وإرجاع الرد (HTTP Response Envelope).
3. **Service (`*.service.js`)**: منطق الأعمال (Business Logic)، مثل تطبيق خوارزمية Haversine، التحقق من الشروط، والتحكم بالبيانات.
4. **Repository (`*.repository.js`)**: الاستعلامات المباشرة لقاعدة البيانات (PostgreSQL Queries أو الـ In-Memory fallback).
