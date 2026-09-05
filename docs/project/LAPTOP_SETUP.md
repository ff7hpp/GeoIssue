# تشغيل GeoIssue على لابتوب العرض (Windows + WSL)

نفّذ هذه الخطوات بعد أن يتم رفع فرع `A` إلى GitHub. هذا الفرع هو نسخة JavaScript؛ لا تحتاج إلى TypeScript أو `tsx`.

## 1. التثبيت مرة واحدة

1. ثبّت **Git for Windows** و**Node.js 20 LTS** و**Docker Desktop**.
2. من PowerShell ثبّت Ubuntu في WSL ثم أعد تشغيل الجهاز عند طلب ذلك:

   ```powershell
   wsl --install -d Ubuntu
   ```

3. افتح Docker Desktop ثم Settings > Resources > WSL Integration وفعّل Ubuntu. تحقق من الطرفية:

   ```powershell
   wsl -d Ubuntu -- bash -lc "docker --version && node --version"
   ```

## 2. جلب المشروع

في PowerShell، داخل مجلد تريد حفظ المشروع فيه:

```powershell
git clone <GITHUB_REPOSITORY_URL> GeoIssue
cd GeoIssue
git switch A
npm ci --prefix server
npm ci --prefix client
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

ضع إعدادات Firebase المحلية في `client/.env` و`server/.env` عند الحاجة، ولا ترفع أي ملف `.env` إلى GitHub.

## 3. تشغيل العرض المحلي

افتح طرفيتين في جذر المشروع:

```powershell
# الطرفية الأولى: PostgreSQL وAPI
docker compose up -d postgres
npm run migrate --prefix server
npm run dev --prefix server
```

```powershell
# الطرفية الثانية: الواجهة
npm run dev --prefix client
```

افتح `http://localhost:5173` وتحقق من `http://localhost:4000/api/health`.

## 4. فحص قبل العرض

```powershell
npm test --prefix server
npm run build --prefix client
```

إذا كنت ستعرض المشروع بدون إنترنت، شغّل التطبيق مرة واحدة مع اتصال إنترنت قبل العرض لتأكيد تحميل خرائط OpenStreetMap وFirebase.
