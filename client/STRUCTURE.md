# Frontend Structure

هذا الدليل يشرح مكان كل نوع من الكود:

- `src/app/`: تشغيل التطبيق والـ routes.
- `src/components/`: مكونات صغيرة مشتركة مثل الهيدر، الخريطة، الحالات، والأزرار.
- `src/features/`: صفحات المنتج الأساسية: المشاكل، البلاغات، الإدارة، وتسجيل الدخول.
- `src/services/`: الاتصال بالـ API، المصادقة، والثيم.
- `src/locales/`: نصوص اللغات العربية والإنجليزية والتركية.
- `src/styles/`: التصميم العام، المتغيرات، الخريطة، وتنسيقات الصفحات.
- `src/types/`: أنواع TypeScript المشتركة.

## أين أبدأ بالتعلم؟

1. `src/app/App.tsx` لفهم تركيب التطبيق.
2. `src/app/router.tsx` لفهم الصفحات والمسارات.
3. `src/features/issues/IssueExplore.tsx` لفهم شاشة استكشاف المشاكل.
4. `src/styles/explore.css` لفهم تصميم الشاشة والاستجابة للهاتف.
5. `src/services/api.ts` لفهم طلبات الـ API.
6. `src/services/auth.context.tsx` لفهم حالة تسجيل الدخول.
