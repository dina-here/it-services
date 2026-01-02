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

  useEffect(() => {
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
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="card"><p>Laddar dashboard...</p></div>;
  }

  return (
    <div>
      <div className="row">
        <div className="col card">
          <h2 style={{ marginTop: 0 }}>Dashboard - KPI Översikt</h2>
          {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

          <div className="row">
            <Kpi title="Total Intäkt (Betald)" value={overview?.kpis?.totalRevenue ? `${overview.kpis.totalRevenue.toLocaleString()} SEK` : "—"} />
            <Kpi title="Aktiva Anställda" value={overview?.kpis?.activeEmployees || "—"} />
            <Kpi title="Totala Affärer" value={overview?.kpis?.totalDeals || "—"} />
            <Kpi title="Totala Fakturor" value={overview?.kpis?.totalInvoices || "—"} />
          </div>

          <h3>Affärer per status</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Fas</th>
                <th>Antal</th>
                <th>Total värde</th>
              </tr>
            </thead>
            <tbody>
              {overview?.deals?.map((d: any) => (
                <tr key={d._id}>
                  <td><span className="badge">{d._id}</span></td>
                  <td>{d.count}</td>
                  <td>{d.totalVarde?.toLocaleString()} SEK</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col card">
          <h3 style={{ marginTop: 0 }}>Intäkt per kund</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Kund</th>
                <th>Intäkt</th>
                <th>Fakturor</th>
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

      <div className="row">
        <div className="col card">
          <h3 style={{ marginTop: 0 }}>Beläggning per konsult</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Konsult</th>
                <th>Beläggning</th>
                <th>Projekt</th>
              </tr>
            </thead>
            <tbody>
              {utilization?.map((u: any) => (
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

        <div className="col card">
          <h3 style={{ marginTop: 0 }}>Intäkt per konsult</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Konsult</th>
                <th>Estimerad intäkt</th>
              </tr>
            </thead>
            <tbody>
              {revenueByConsultant?.slice(0, 10)?.map((c: any) => (
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
