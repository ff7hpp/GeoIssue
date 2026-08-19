import { useState } from "react";

function AuthPage({ mode, onSubmit, onSwitch, busy, serverError }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const isRegister = mode === "register";

  function handleSubmit(event) {
    event.preventDefault();

    if ((isRegister && !name.trim()) || !email.includes("@") || password.length < 6) {
      setFormError("Enter a valid email and a password with at least 6 characters.");
      return;
    }

    setFormError("");
    onSubmit({ name: name.trim(), email: email.trim(), password }, mode);
  }

  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">CITY ISSUE REPORTING</p>
        <h1>Keep your city moving.</h1>
        <p>Report local problems, place them on a real map, and follow their progress.</p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>{isRegister ? "Create account" : "Welcome back"}</h2>
        <p>{isRegister ? "Create an account to submit reports." : "Sign in to continue to GeoIssue."}</p>

        {isRegister && (
          <>
            <label htmlFor="name">Full name</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </>
        )}

        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />

        {(formError || serverError) && <p className="form-error">{formError || serverError}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={busy}>
          {busy ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
        </button>
        <button className="auth-switch" type="button" onClick={() => onSwitch(isRegister ? "sign-in" : "register")}>
          {isRegister ? "Already have an account? Sign in" : "Need an account? Create one"}
        </button>
      </form>
    </section>
  );
}

export default AuthPage;
