# Application Architecture & Structure Guide

## Frontend

واجهة التطبيق موجودة في `client/src/`:

- `app/`: تشغيل التطبيق والـ routes.
- `components/`: مكونات صغيرة مشتركة مثل الهيدر، الخريطة، الحالات، والأزرار.
- `features/`: صفحات المنتج الأساسية: المشاكل، البلاغات، الإدارة، وتسجيل الدخول.
- `services/`: الاتصال بالـ API، المصادقة، والثيم.
- `locales/`: نصوص اللغات العربية والإنجليزية والتركية.
- `styles/`: التصميم العام، المتغيرات، الخريطة، وتنسيقات الصفحات.
- `types/`: أنواع TypeScript المشتركة.

ابدأ بـ `client/src/app/App.tsx` ثم `client/src/app/router.tsx` لفهم تركيب التطبيق والمسارات، وبعدها `client/src/features/issues/IssueExplore.tsx` و`client/src/services/api.ts`.

## Backend

هذا الدليل يشرح هيكلية الباك-إند (Express + TypeScript Modular Monolith):

```text
server/src/
├── config/              # إعدادات البيئة و Firebase
│   ├── env.ts          # قراءة المتغيرات البيئية والتأكد من صحتها
│   └── firebase.ts     # تهيئة Firebase Admin SDK
│
├── db/                  # طبقة قاعدة البيانات (PostgreSQL / Neon)
│   ├── pool.ts         # الاتصال بقاعدة البيانات + In-Memory Mock Store للتطوير المحلي
│   ├── schema.sql      # مخطط الجداول والقيود والفهارس (6 جداول رئيسية)
│   └── migrations.ts   # مشغل ترحيل المخطط لقاعدة البيانات الحية
│
├── middleware/          # البرمجيات الوسيطة
│   ├── auth.middleware.ts     # فك رموز JWT من Firebase وتحديد الأدوار + مستخدم تجريبي محلي
│   ├── validate.middleware.ts # التحقق من صحة المدخلات باستخدام Zod
│   └── error.middleware.ts    # معالج الأخطاء المركزي الموحد
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
│   ├── haversine.ts    # خوارزمية حساب المسافة الجغرافية والتجميع (50 متر)
│   ├── stateMachine.ts # آلة حالات دورة حياة المشكلة وقواعد الانتقال
│   ├── errors.ts       # كلاسات الأخطاء المخصصة (AppError, UnauthorizedError...)
│   └── types.ts        # تعريفات TypeScript العامة للنماذج
│
├── tests/               # الاختبارات الآلية (Vitest)
│   ├── haversine.test.ts    # اختبار دقة حساب المسافات
│   ├── stateMachine.test.ts # اختبار صحة انتقالات الحالات
│   ├── permissions.test.ts  # اختبار أذونات الأدوار (Visitor, User, Admin)
│   └── api.smoke.test.ts    # اختبار استجابات الـ API وأكواد الأمان
│
├── app.ts               # تجميع Express وتثبيت الـ Middlewares والـ Routes
└── server.ts            # نقطة البداية وتشغيل الخادم على المنفذ 4000
```

## نمط التصميم (Controller-Service-Repository)

لكل وحدة في `modules/`:
1. **Routes (`*.routes.ts`)**: تحديد مسارات الـ HTTP والـ Middlewares المناسبة (مثل `requireAuth`, `requireRole('admin')`, `validate(schema)`).
2. **Controller (`*.controller.ts`)**: استقبال الطلبات (HTTP Request)، استخراج البيانات، واستدعاء الخدمة، وإرجاع الرد (HTTP Response Envelope).
3. **Service (`*.service.ts`)**: منطق الأعمال (Business Logic)، مثل تطبيق خوارزمية Haversine، التحقق من الشروط، والتحكم بالبيانات.
4. **Repository (`*.repository.ts`)**: الاستعلامات المباشرة لقاعدة البيانات (PostgreSQL Queries أو الـ In-Memory fallback).
