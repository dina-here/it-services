import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

import { getToken, setToken, api } from "../lib/api";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CrmDealsPage } from "./pages/CrmDealsPage";
import { CrmLeadsPage } from "./pages/CrmLeadsPage";
import { CrmAccountsPage } from "./pages/CrmAccountsPage";
import { CrmContactsPage } from "./pages/CrmContactsPage";
import { HrEmployeesPage } from "./pages/HrEmployeesPage";
import { ResProjectsPage } from "./pages/ResProjectsPage";
import { ResAssignmentsPage } from "./pages/ResAssignmentsPage";
import { ErpInvoicesPage } from "./pages/ErpInvoicesPage";
import { DataEventsPage } from "./pages/DataEventsPage";

type Me = { id: string; epost: string; roll: string } | null;

export function App() {
  const { t, i18n } = useTranslation();
  const [me, setMe] = useState<Me>(null);

  // Försök läsa "me" om token finns
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    api.me()
      .then((r) => setMe(r.user))
      .catch(() => {
        setToken(null);
        setMe(null);
      });
  }, []);

  const loggedIn = Boolean(getToken());

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="row" style={{ alignItems: "center" }}>
            <div className="brand">{t("appName")}</div>
            <nav className="nav small" aria-label="Huvudmeny">
              <Link to="/dashboard">{t("nav.dashboard")}</Link>
              <Link to="/crm/deals">{t("nav.crm")}</Link>
              <Link to="/hr/employees">{t("nav.hr")}</Link>
              <Link to="/res/assignments">{t("nav.resurs")}</Link>
              <Link to="/erp/invoices">{t("nav.erp")}</Link>
              <Link to="/data/events">{t("nav.data")}</Link>
            </nav>
          </div>

          <div className="row" style={{ alignItems: "center" }}>
            <button
              className="btn"
              onClick={() => i18n.changeLanguage(i18n.language === "sv" ? "en" : "sv")}
              title="Byt språk"
            >
              {i18n.language === "sv" ? "EN" : "SV"}
            </button>

            {loggedIn ? (
              <>
                <span className="badge">{me ? `${me.epost} · ${me.roll}` : "Inloggad"}</span>
                <button
                  className="btn"
                  onClick={() => {
                    setToken(null);
                    setMe(null);
                    window.location.href = "/login";
                  }}
                >
                  {t("auth.logout")}
                </button>
              </>
            ) : (
              <Link className="btn" to="/login">
                {t("auth.login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage onLogin={(user) => setMe(user)} />} />

          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />

          <Route path="/crm/deals" element={<RequireAuth><CrmDealsPage /></RequireAuth>} />
          <Route path="/crm/leads" element={<RequireAuth><CrmLeadsPage /></RequireAuth>} />
          <Route path="/crm/accounts" element={<RequireAuth><CrmAccountsPage /></RequireAuth>} />
          <Route path="/crm/contacts" element={<RequireAuth><CrmContactsPage /></RequireAuth>} />

          <Route path="/hr/employees" element={<RequireAuth><HrEmployeesPage /></RequireAuth>} />

          <Route path="/res/projects" element={<RequireAuth><ResProjectsPage /></RequireAuth>} />
          <Route path="/res/assignments" element={<RequireAuth><ResAssignmentsPage /></RequireAuth>} />

          <Route path="/erp/invoices" element={<RequireAuth><ErpInvoicesPage /></RequireAuth>} />

          <Route path="/data/events" element={<RequireAuth><DataEventsPage /></RequireAuth>} />

          <Route path="*" element={<div className="card">404</div>} />
        </Routes>
      </main>
    </>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
