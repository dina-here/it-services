import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api, setToken } from "../../lib/api";

export function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const { t } = useTranslation();
  const [epost, setEpost] = useState("admin@karriarops.se");
  const [losen, setLosen] = useState("Losen123!");
  const [fel, setFel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFel(null);
    setLoading(true);
    try {
      const res = await api.login(epost, losen);
      setToken(res.token);
      onLogin(res.user);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setFel(err.message || "Kunde inte logga in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>{t("auth.login")}</h2>
      <p className="small">{t("auth.demoHint")}</p>

      <form onSubmit={submit} className="row" style={{ flexDirection: "column" }}>
        <label>
          <div className="small">{t("auth.email")}</div>
          <input className="input" value={epost} onChange={(e) => setEpost(e.target.value)} />
        </label>

        <label>
          <div className="small">{t("auth.password")}</div>
          <input className="input" type="password" value={losen} onChange={(e) => setLosen(e.target.value)} />
        </label>

        {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

        <button className="btn" disabled={loading} type="submit">
          {loading ? "..." : t("auth.login")}
        </button>
      </form>
    </div>
  );
}
