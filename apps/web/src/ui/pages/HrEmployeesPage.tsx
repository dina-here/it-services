import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/date";

export function HrEmployeesPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    namn: "",
    epost: "",
    roll: "KONSULT",
    startdatum: "",
    kompetenser: "",
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  const loadEmployees = () => {
    api.employees(q || undefined).then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  };

  useEffect(() => {
    loadEmployees();
  }, [q]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFel(null);
    try {
      await api.post("/hr/employees", {
        ...formData,
        startdatum: new Date(formData.startdatum).toISOString(),
        kompetenser: formData.kompetenser.split(",").map((k) => k.trim()).filter((k) => k),
      });
      setFormData({ namn: "", epost: "", roll: "KONSULT", startdatum: "", kompetenser: "" });
      setShowForm(false);
      loadEmployees();
    } catch (err: any) {
      setFel(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setFel(null);
    try {
      await api.patch(`/hr/employees/${id}/status`, { status });
      loadEmployees();
      setEditingId(null);
    } catch (err: any) {
      setFel(err.message);
    }
  };

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ marginTop: 0 }}>{t("hr.employeesTitle")}</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" style={{ maxWidth: 320 }} placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="button" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Avbryt" : "+ Lägg till anställd"}
          </button>
        </div>
      </div>

      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      {showForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: 20, padding: 15, border: "1px solid #ddd", borderRadius: 4 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Namn *</label>
            <input className="input" type="text" value={formData.namn} onChange={(e) => setFormData({ ...formData, namn: e.target.value })} required />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>E-post *</label>
            <input className="input" type="email" value={formData.epost} onChange={(e) => setFormData({ ...formData, epost: e.target.value })} required />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Roll *</label>
            <select className="input" value={formData.roll} onChange={(e) => setFormData({ ...formData, roll: e.target.value })}>
              <option value="KONSULT">Konsult</option>
              <option value="SALJ">Försäljning</option>
              <option value="HR">HR</option>
              <option value="TEKNIKCHEF">Teknikchef</option>
              <option value="VD">VD</option>
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Startdatum *</label>
            <input className="input" type="date" value={formData.startdatum} onChange={(e) => setFormData({ ...formData, startdatum: e.target.value })} required />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Kompetenser (komma-separerade)</label>
            <input className="input" type="text" placeholder="t.ex: JavaScript, React, Node.js" value={formData.kompetenser} onChange={(e) => setFormData({ ...formData, kompetenser: e.target.value })} />
          </div>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Sparar..." : "Spara anställd"}
          </button>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Namn</th>
            <th>Roll</th>
            <th>Kompetenser</th>
            <th>Start</th>
            <th>Status</th>
            <th>Åtgärd</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e._id}>
              <td>{e.namn}</td>
              <td><span className="badge">{e.roll}</span></td>
              <td className="small">{(e.kompetenser || []).join(", ")}</td>
              <td>{formatDate(e.startdatum)}</td>
              <td>
                {editingId === e._id ? (
                  <select
                    className="input"
                    style={{ padding: 4, fontSize: 12 }}
                    defaultValue={e.status}
                    onChange={(e) => handleStatusChange(e.currentTarget.dataset.id || "", e.target.value)}
                    data-id={e._id}
                  >
                    <option value="AKTIV">AKTIV</option>
                    <option value="ONBOARDING">ONBOARDING</option>
                    <option value="OFFBOARDING">OFFBOARDING</option>
                    <option value="UPPSAGD">UPPSAGD</option>
                  </select>
                ) : (
                  <span className="badge">{e.status}</span>
                )}
              </td>
              <td>
                <button
                  className="button"
                  style={{ padding: "4px 8px", fontSize: 12 }}
                  onClick={() => setEditingId(editingId === e._id ? null : e._id)}
                >
                  {editingId === e._id ? "Avbryt" : "Ändra status"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
