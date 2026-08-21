import { useState } from "react";
import { ArrowLeft, CheckCircle2, MapPinned, ShieldCheck, Workflow } from "lucide-react";

function AuthPage({ mode, onSubmit, onSwitch, busy, serverError }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const isRegister = mode === "register";

  function handleSubmit(event) {
    event.preventDefault();

    if ((isRegister && !name.trim()) || !email.includes("@") || password.length < 6) {
      setFormError("أدخل بريدًا صحيحًا وكلمة مرور من 6 أحرف على الأقل.");
      return;
    }

    setFormError("");
    onSubmit({ name: name.trim(), email: email.trim(), password }, mode);
  }

  return (
    <section className="auth-layout" aria-labelledby="auth-title">
      <div className="auth-intro">
        <div className="auth-badge"><span className="live-dot" /> منصة بلاغات مدينية موثوقة</div>
        <p className="eyebrow">مدينتك تبدأ بملاحظتك</p>
        <h1 id="auth-title">حوّل ملاحظتك إلى <em>أثر واضح.</em></h1>
        <p>أبلغ عن المشكلات الحضرية، حدّد موقعها بدقة، وتابع رحلة معالجتها من بلاغ إلى حل.</p>
        <div className="auth-benefits">
          <span><MapPinned size={18} />تحديد دقيق على الخريطة</span>
          <span><Workflow size={18} />متابعة شفافة للحالة</span>
          <span><ShieldCheck size={18} />حساب آمن وبيانات موثوقة</span>
        </div>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="section-label">{isRegister ? "انضم إلى المجتمع" : "مساحتك الخاصة"}</span>
        <h2>{isRegister ? "أنشئ حسابك" : "أهلًا بعودتك"}</h2>
        <p>{isRegister ? "ابدأ بالمساهمة في تحسين الأماكن من حولك." : "سجّل الدخول لمتابعة بلاغاتك وحالة المدينة."}</p>

        {isRegister && (
          <>
            <label htmlFor="name">الاسم الكامل</label>
            <input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="اكتب اسمك" />
          </>
        )}

        <label htmlFor="email">البريد الإلكتروني</label>
        <input id="email" type="email" dir="ltr" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />

        <label htmlFor="password">كلمة المرور</label>
        <input id="password" type="password" dir="ltr" autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />

        {(formError || serverError) && <p className="form-error">{formError || serverError}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={busy}>
          {busy ? "جارٍ التحقق..." : isRegister ? <><CheckCircle2 size={17} />إنشاء الحساب</> : <>الدخول إلى المنصة<ArrowLeft size={17} /></>}
        </button>
        <button className="auth-switch" type="button" onClick={() => onSwitch(isRegister ? "sign-in" : "register")}>
          {isRegister ? "لديك حساب؟ تسجيل الدخول" : "مستخدم جديد؟ أنشئ حسابًا مجانًا"}
        </button>
      </form>
    </section>
  );
}

export default AuthPage;
