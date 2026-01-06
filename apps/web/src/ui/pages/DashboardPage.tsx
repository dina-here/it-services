import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { iso } from "../../lib/date";

export function DashboardPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<any>(null);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [revenueByCustomer, setRevenueByCustomer] = useState<any[]>([]);
  const [revenueByConsultant, setRevenueByConsultant] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const utilRows = useMemo(() => utilization.filter((u) => (u.belaggningPct || 0) > 0), [utilization]);
  const revenueConsultantRows = useMemo(() => revenueByConsultant.filter((c) => (c.estimatedRevenue || 0) > 0), [revenueByConsultant]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [ovData, utilData, custData, consData] = await Promise.all([
        api.get("/data/dashboard/overview"),
        api.get("/data/dashboard/consultant-utilization"),
        api.get("/data/dashboard/revenue-by-customer"),
        api.get("/data/dashboard/revenue-by-consultant"),
      ]);
      setOverview(ovData);
      setUtilization(utilData);
      setRevenueByCustomer(custData);
      setRevenueByConsultant(consData);
    } catch (err: any) {
      setFel(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.me().then((r) => setMe(r.user)).catch(() => {});
    loadDashboard();
  }, []);

  const handleDemoReset = async () => {
    if (!window.confirm(t("dashboard.demoResetConfirm"))) return;
    setResetMsg(null);
    try {
      const res = await api.demoReset();
      setResetMsg(res.message || t("dashboard.demoResetDone"));
      await loadDashboard();
    } catch (err: any) {
      setResetMsg(err.message || "Fel vid reset");
    }
  };

  if (loading) {
    return <div className="card"><p>Laddar dashboard...</p></div>;
  }

  return (
    <div>
      <div className="row">
        <div className="col card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ marginTop: 0 }}>{t("dashboard.title")}</h2>
            {me?.roll === "SUPERADMIN" ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="button ghost" onClick={handleDemoReset}>
                  {t("dashboard.demoReset")}
                </button>
                {resetMsg ? <span className="small">{resetMsg}</span> : null}
              </div>
            ) : null}
          </div>
          {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

          <div className="row">
            <Kpi title="Total Intäkt (Betald)" value={overview?.kpis?.totalRevenue ? `${overview.kpis.totalRevenue.toLocaleString()} SEK` : "—"} />
            <Kpi title="Aktiva Anställda" value={overview?.kpis?.activeEmployees || "—"} />
            <Kpi title="Totala Affärer" value={overview?.kpis?.totalDeals || "—"} />
            <Kpi title="Totala Fakturor" value={overview?.kpis?.totalInvoices || "—"} />
          </div>

          <h3>{t("dashboard.dealsTitle")}</h3>
          <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t("table.stage")}</th>
                <th>{t("table.count")}</th>
                <th>{t("table.totalValue")}</th>
              </tr>
            </thead>
            <tbody>
              {overview?.deals?.map((d: any) => (
                <tr key={d._id}>
                  <td><span className="badge">{t(`stage.${d._id}`)}</span></td>
                  <td>{d.count}</td>
                  <td>{d.totalVarde?.toLocaleString()} SEK</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="col card">
          <h3 style={{ marginTop: 0 }}>{t("dashboard.revenueByCustomer")}</h3>
          <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t("table.customer")}</th>
                <th>{t("dashboard.kpiRevenue")}</th>
                <th>{t("table.invoices")}</th>
              </tr>
            </thead>
            <tbody>
              {revenueByCustomer?.slice(0, 10)?.map((c: any) => (
                <tr key={c._id}>
                  <td>{c.accountNamn}</td>
                  <td>{c.totalRevenue?.toLocaleString()} SEK</td>
                  <td>{c.invoiceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col card">
          <h3 style={{ marginTop: 0 }}>{t("dashboard.utilizationByConsultant")}</h3>
          <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t("table.consultant")}</th>
                <th>{t("table.utilization")}</th>
                <th>{t("table.project")}</th>
              </tr>
            </thead>
            <tbody>
              {(utilRows?.length ? utilRows : []).map((u: any) => (
                <tr key={u.employeeId}>
                  <td>{u.employeeNamn}</td>
                  <td>
                    <div style={{ position: "relative", width: 100, height: 20, border: "1px solid #ddd", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          position: "absolute",
                          width: `${u.belaggningPct}%`,
                          height: "100%",
                          backgroundColor: u.belaggningPct > 80 ? "#4caf50" : u.belaggningPct > 50 ? "#ff9800" : "#e0e0e0",
                        }}
                      />
                      <div style={{ position: "relative", textAlign: "center", fontSize: 12, fontWeight: 600, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {u.belaggningPct}%
                      </div>
                    </div>
                  </td>
                  <td>{u.assignments}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="col card">
          <h3 style={{ marginTop: 0 }}>{t("dashboard.revenueByConsultant")}</h3>
          <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t("table.consultant")}</th>
                <th>{t("table.estimatedRevenue")}</th>
              </tr>
            </thead>
            <tbody>
              {(revenueConsultantRows?.slice(0, 10) || []).map((c: any) => (
                <tr key={c.employeeId}>
                  <td>{c.employeeNamn}</td>
                  <td>{c.estimatedRevenue?.toLocaleString()} SEK</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="card" style={{ padding: 12, minWidth: 150 }}>
      <div className="small">{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
