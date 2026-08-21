import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { BarChart3, FilePlus2, LogOut, MapPinned, Moon, Plus, Sparkles, Sun, TrendingUp } from "lucide-react";
import { issueApi } from "./api";
import AuthPage from "./components/AuthPage";
import IssueMap from "./components/IssueMap";
import IssueTable from "./components/IssueTable";
import { auth } from "./firebase";
import "./App.css";

const categories = ["Road", "Water", "Electricity", "Traffic", "Environment", "Other"];
const statuses = ["Pending", "In Progress", "Resolved"];
const categoryLabels = { Road: "الطرق", Water: "المياه", Electricity: "الكهرباء", Traffic: "المرور", Environment: "البيئة", Other: "أخرى" };
const statusLabels = { Pending: "جديد", "In Progress": "قيد المعالجة", Resolved: "تم الحل" };
const emptyForm = {
  title: "",
  description: "",
  category: "Road",
  latitude: null,
  longitude: null,
};

function authMessage(error) {
  const messages = {
    "auth/email-already-in-use": "هذا البريد مرتبط بحساب موجود.",
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/operation-not-allowed": "تسجيل الدخول بالبريد غير متاح حاليًا.",
    "auth/too-many-requests": "محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.",
  };
  return messages[error.code] || error.message || "تعذر تسجيل الدخول.";
}

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("geoissue-theme");
    if (savedTheme) return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [page, setPage] = useState("sign-in");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    localStorage.setItem("geoissue-theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (account) => {
      setUser(account);
      setAuthLoading(false);
      setPage((currentPage) => {
        if (!account) return "sign-in";
        return currentPage === "sign-in" || currentPage === "register" ? "reports" : currentPage;
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    async function loadIssues() {
      try {
        const data = await issueApi.list();
        setIssues(data.issues);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setIssuesLoading(false);
      }
    }

    loadIssues();
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const text = `${issue.title} ${issue.description} ${issue.reporter}`.toLowerCase();
      return (
        text.includes(search.toLowerCase()) &&
        (categoryFilter === "All" || issue.category === categoryFilter) &&
        (statusFilter === "All" || issue.status === statusFilter)
      );
    });
  }, [issues, search, categoryFilter, statusFilter]);

  async function handleAuthentication(account, mode) {
    try {
      setAuthBusy(true);
      setAuthError("");

      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, account.email, account.password);
        await updateProfile(credential.user, { displayName: account.name });
        await credential.user.reload();
        setUser(auth.currentUser);
      } else {
        await signInWithEmailAndPassword(auth, account.email, account.password);
      }
    } catch (error) {
      setAuthError(authMessage(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setForm(emptyForm);
    setEditingId(null);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function chooseLocation(latitude, longitude) {
    setForm((current) => ({
      ...current,
      latitude: Number(latitude.toFixed(5)),
      longitude: Number(longitude.toFixed(5)),
    }));
  }

  async function saveIssue(event) {
    event.preventDefault();
    setMessage("");

    if (!form.title.trim() || !form.description.trim()) {
      setMessage("أدخل عنوان البلاغ ووصفه قبل الإرسال.");
      return;
    }

    if (!Number.isFinite(form.latitude) || !Number.isFinite(form.longitude)) {
      setMessage("حدد موقع البلاغ من الخريطة أو استخدم موقعك الحالي قبل الإرسال.");
      return;
    }

    try {
      const data = editingId === null
        ? await issueApi.create(form)
        : await issueApi.update(editingId, form);

      setIssues((current) => editingId === null
        ? [data.issue, ...current]
        : current.map((issue) => (issue.id === data.issue.id ? data.issue : issue)));
      cancelEdit();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function startEdit(issue) {
    setForm({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      latitude: issue.latitude,
      longitude: issue.longitude,
    });
    setEditingId(issue.id);
    setPage("reports");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function removeIssue(id) {
    if (!window.confirm("هل تريد حذف هذا البلاغ نهائيًا؟")) return;

    try {
      await issueApi.remove(id);
      setIssues((current) => current.filter((issue) => issue.id !== id));
      if (editingId === id) cancelEdit();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      const data = await issueApi.updateStatus(id, status);
      setIssues((current) => current.map((issue) => (issue.id === id ? data.issue : issue)));
    } catch (error) {
      setMessage(error.message);
    }
  }

  const userName = user?.displayName || user?.email?.split("@")[0] || "مستخدم";
  const totalIssues = issues.length;
  const pendingIssues = issues.filter((issue) => issue.status === "Pending").length;
  const resolvedIssues = issues.filter((issue) => issue.status === "Resolved").length;
  const themeLabel = theme === "dark" ? "استخدام الوضع الفاتح" : "استخدام الوضع الداكن";

  const themeButton = (
    <button className="icon-button theme-toggle" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={themeLabel} title={themeLabel}>
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

  if (authLoading) {
    return <div className="app-loading"><span className="brand-mark">G</span><p>جارٍ تجهيز منصّة GeoIssue...</p></div>;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" type="button" onClick={() => setPage(user ? "reports" : "sign-in")}><span className="brand-mark">G</span><span><b>GeoIssue</b><small>منصة البلاغات الحضرية</small></span></button>

          {user ? (
            <>
              <nav className="main-nav" aria-label="التنقل الرئيسي">
                <button className={page === "dashboard" ? "nav-link active" : "nav-link"} type="button" onClick={() => setPage("dashboard")}><BarChart3 size={17} />لوحة المتابعة</button>
                <button className={page === "reports" ? "nav-link active" : "nav-link"} type="button" onClick={() => setPage("reports")}><MapPinned size={17} />البلاغات</button>
                <button className={page === "insights" ? "nav-link active" : "nav-link"} type="button" onClick={() => setPage("insights")}><TrendingUp size={17} />التحليلات</button>
              </nav>
              <div className="account-area"><span className="user-chip"><small>مرحبًا</small>{userName}</span>{themeButton}<button className="sign-out-button" type="button" onClick={signOut}><LogOut size={16} />خروج</button></div>
            </>
          ) : (
            <nav className="auth-nav">
              {themeButton}
              <button className="nav-link" type="button" onClick={() => { setAuthError(""); setPage("sign-in"); }}>تسجيل الدخول</button>
              <button className="header-register" type="button" onClick={() => { setAuthError(""); setPage("register"); }}>إنشاء حساب</button>
            </nav>
          )}
        </div>
      </header>

      <main className="page-content">
        {message && <p className="message" role="alert">{message}</p>}

        {!user ? (
          <AuthPage mode={page} onSubmit={handleAuthentication} onSwitch={(nextPage) => { setAuthError(""); setPage(nextPage); }} busy={authBusy} serverError={authError} />
        ) : page === "reports" ? (
          <ReportsPage
            form={form}
            editingId={editingId}
            issues={filteredIssues}
            allIssues={issues}
            search={search}
            categoryFilter={categoryFilter}
            currentUserId={user.uid}
            onChange={updateForm}
            onChooseLocation={chooseLocation}
            onSubmit={saveIssue}
            onCancel={cancelEdit}
            onSearch={setSearch}
            onCategoryFilter={setCategoryFilter}
            onEdit={startEdit}
            onRemove={removeIssue}
            loading={issuesLoading}
          />
        ) : page === "dashboard" ? (
          <DashboardPage
            total={totalIssues}
            pending={pendingIssues}
            resolved={resolvedIssues}
            issues={filteredIssues}
            search={search}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            currentUserId={user.uid}
            onSearch={setSearch}
            onCategoryFilter={setCategoryFilter}
            onStatusFilter={setStatusFilter}
            onCreate={() => setPage("reports")}
            onEdit={startEdit}
            onRemove={removeIssue}
            onStatusChange={updateStatus}
            loading={issuesLoading}
          />
        ) : (
          <InsightsPage issues={issues} onCreate={() => setPage("reports")} />
        )}
      </main>

      <footer className="footer"><span>GeoIssue</span><p>مدينة أوضح تبدأ ببلاغ أدق.</p></footer>
    </div>
  );
}

function ReportsPage({ form, editingId, issues, allIssues, search, categoryFilter, currentUserId, onChange, onChooseLocation, onSubmit, onCancel, onSearch, onCategoryFilter, onEdit, onRemove, loading }) {
  return (
    <section>
      <div className="page-heading"><p className="eyebrow">بلاغ جديد</p><h1>ساعدنا في تحسين مدينتك</h1><p>صف المشكلة وحدد موقعها على الخريطة، وسنتابع حالة البلاغ معك.</p></div>
      <div className="report-layout">
        <section className="panel report-form-panel">
          <div className="section-kicker"><FilePlus2 size={19} /><span>تفاصيل البلاغ</span></div><h2>{editingId !== null ? "تعديل البلاغ" : "ما المشكلة التي لاحظتها؟"}</h2>
          <form onSubmit={onSubmit}>
            <label htmlFor="title">عنوان مختصر</label>
            <input id="title" value={form.title} onChange={(event) => onChange("title", event.target.value)} placeholder="مثال: حفرة كبيرة في الطريق الرئيسي" />
            <label htmlFor="description">وصف المشكلة</label>
            <textarea id="description" rows="5" value={form.description} onChange={(event) => onChange("description", event.target.value)} placeholder="أضف تفاصيل تساعد فريق المعالجة على فهم المشكلة..." />
            <label htmlFor="category">التصنيف</label>
            <select id="category" value={form.category} onChange={(event) => onChange("category", event.target.value)}>{categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select>
            <label>إحداثيات الموقع</label>
            <div className="two-fields coordinates" dir="ltr">
              <input aria-label="خط العرض" readOnly value={Number.isFinite(form.latitude) ? `Lat: ${form.latitude.toFixed(5)}` : "Lat: —"} />
              <input aria-label="خط الطول" readOnly value={Number.isFinite(form.longitude) ? `Lng: ${form.longitude.toFixed(5)}` : "Lng: —"} />
            </div>
            <div className="form-actions">{editingId !== null && <button className="secondary-button" type="button" onClick={onCancel}>إلغاء</button>}<button className="primary-button" type="submit">{editingId !== null ? "حفظ التعديلات" : "إرسال البلاغ"}</button></div>
          </form>
        </section>
        <IssueMap latitude={form.latitude} longitude={form.longitude} issues={allIssues} onPick={onChooseLocation} />
      </div>

      <section className="panel reports-panel">
        <div className="panel-title-row table-title-row"><div><span className="section-label">المجتمع</span><h2>أحدث البلاغات</h2></div><div className="filters"><input aria-label="البحث في البلاغات" type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="ابحث في البلاغات..." /><select aria-label="تصفية حسب التصنيف" value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)}><option value="All">كل التصنيفات</option>{categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select></div></div>
        <IssueTable issues={issues} currentUserId={currentUserId} onEdit={onEdit} onRemove={onRemove} loading={loading} />
      </section>
    </section>
  );
}

function DashboardPage({ total, pending, resolved, issues, search, categoryFilter, statusFilter, currentUserId, onSearch, onCategoryFilter, onStatusFilter, onCreate, onEdit, onRemove, onStatusChange, loading }) {
  return (
    <section>
      <div className="page-heading dashboard-heading"><div><p className="eyebrow">مركز المتابعة</p><h1>صورة واضحة عن المدينة</h1><p>تابع البلاغات ومراحل معالجتها من مكان واحد.</p></div><button className="primary-button" type="button" onClick={onCreate}><Plus size={17} />إنشاء بلاغ</button></div>
      <div className="stat-grid"><StatCard label="إجمالي البلاغات" value={total} type="total" /><StatCard label="بانتظار المراجعة" value={pending} type="pending" /><StatCard label="تم حلها" value={resolved} type="resolved" /></div>
      <section className="panel admin-panel">
        <div className="panel-title-row table-title-row"><div><span className="section-label">إدارة البلاغات</span><h2>سجل النشاط</h2></div><div className="filters admin-filters"><input aria-label="البحث في البلاغات" type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="ابحث عن بلاغ..." /><select aria-label="تصفية حسب التصنيف" value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)}><option value="All">كل التصنيفات</option>{categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select><select aria-label="تصفية حسب الحالة" value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)}><option value="All">كل الحالات</option>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></div></div>
        <IssueTable admin issues={issues} currentUserId={currentUserId} onEdit={onEdit} onRemove={onRemove} onStatusChange={onStatusChange} loading={loading} />
      </section>
    </section>
  );
}

function StatCard({ label, value, type }) {
  return <section className={`stat-card ${type}`}><span>{label}</span><strong>{value}</strong><small>محدّث الآن</small></section>;
}

function InsightsPage({ issues, onCreate }) {
  const total = issues.length;
  const resolved = issues.filter((issue) => issue.status === "Resolved").length;
  const progress = issues.filter((issue) => issue.status === "In Progress").length;
  const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;
  const categoryCounts = categories.map((category) => ({
    category,
    count: issues.filter((issue) => issue.category === category).length,
  })).sort((a, b) => b.count - a.count);
  const highest = Math.max(...categoryCounts.map((item) => item.count), 1);

  return (
    <section>
      <div className="page-heading dashboard-heading">
        <div><p className="eyebrow">رؤية وتحليل</p><h1>بيانات تساعد على اتخاذ القرار</h1><p>ملخص حيّ لاتجاهات البلاغات وأداء المعالجة.</p></div>
        <button className="primary-button" type="button" onClick={onCreate}><Plus size={17} />إضافة بلاغ</button>
      </div>
      <div className="insight-hero panel">
        <div><span className="section-label">معدل الإنجاز</span><strong>{resolutionRate}%</strong><p>من إجمالي البلاغات المسجلة تم حلها بنجاح.</p></div>
        <div className="progress-ring" style={{ "--progress": `${resolutionRate * 3.6}deg` }}><span>{resolutionRate}%</span></div>
      </div>
      <div className="insights-grid">
        <section className="panel insight-panel">
          <div className="panel-title-row"><div><span className="section-label">حسب التصنيف</span><h2>توزيع البلاغات</h2></div><Sparkles size={20} /></div>
          <div className="bar-list">
            {categoryCounts.map(({ category, count }) => (
              <div className="bar-item" key={category}><div><span>{categoryLabels[category]}</span><b>{count}</b></div><div className="bar-track"><span style={{ width: `${(count / highest) * 100}%` }} /></div></div>
            ))}
          </div>
        </section>
        <section className="panel insight-panel response-card">
          <span className="section-label">حالة العمل</span><h2>مؤشرات سريعة</h2>
          <div className="metric-row"><span>قيد المعالجة الآن</span><strong>{progress}</strong></div>
          <div className="metric-row"><span>تم إغلاقها</span><strong>{resolved}</strong></div>
          <div className="metric-row"><span>إجمالي السجل</span><strong>{total}</strong></div>
          <p className="insight-note">تساعد هذه المؤشرات فرق المدينة على ترتيب الأولويات ومتابعة الإنجاز.</p>
        </section>
      </div>
    </section>
  );
}

export default App;
