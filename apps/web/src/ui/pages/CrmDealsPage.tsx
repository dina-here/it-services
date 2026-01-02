import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/date";

export function CrmDealsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ namn: "", accountId: "", vardeSEK: 0, agareEmployeeId: "", forvantatAvslut: "" });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  const loadDeals = () => {
    api.deals().then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  };

  useEffect(() => {
    loadDeals();
    api.accounts().then((r) => setAccounts(r.items)).catch(() => {});
    api.employees().then((r) => setEmployees(r.items)).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFel(null);
    try {
      await api.post("/crm/deals", {
        ...formData,
        vardeSEK: Number(formData.vardeSEK),
        forvantatAvslut: new Date(formData.forvantatAvslut).toISOString(),
      });
      setFormData({ namn: "", accountId: "", vardeSEK: 0, agareEmployeeId: "", forvantatAvslut: "" });
      setShowForm(false);
      loadDeals();
    } catch (err: any) {
      setFel(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newFas: string) => {
    setFel(null);
    try {
      await api.patch(`/crm/deals/${id}/stage`, { fas: newFas });
      loadDeals();
      setEditingId(null);
    } catch (err: any) {
      setFel(err.message);
    }
  };

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ marginTop: 0 }}>{t("crm.dealsTitle")}</h2>
        <button className="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Avbryt" : "+ Lägg till affär"}
        </button>
      </div>

      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      {showForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: 20, padding: 15, border: "1px solid #ddd", borderRadius: 4 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Namn *</label>
            <input
              className="input"
              type="text"
              value={formData.namn}
              onChange={(e) => setFormData({ ...formData, namn: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Kund *</label>
            <select
              className="input"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              required
            >
              <option value="">-- Välj kund --</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.namn}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Värde (SEK) *</label>
            <input
              className="input"
              type="number"
              value={formData.vardeSEK}
              onChange={(e) => setFormData({ ...formData, vardeSEK: Number(e.target.value) })}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Affärsägare *</label>
            <select
              className="input"
              value={formData.agareEmployeeId}
              onChange={(e) => setFormData({ ...formData, agareEmployeeId: e.target.value })}
              required
            >
              <option value="">-- Välj person --</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.namn}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Förväntat avslut *</label>
            <input
              className="input"
              type="datetime-local"
              value={formData.forvantatAvslut}
              onChange={(e) => setFormData({ ...formData, forvantatAvslut: e.target.value })}
              required
            />
          </div>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Sparar..." : "Spara affär"}
          </button>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Namn</th>
            <th>Kund</th>
            <th>Värde</th>
            <th>Fas</th>
            <th>Sannolikhet</th>
            <th>Förväntat avslut</th>
            <th>Åtgärd</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d._id}>
              <td>{d.namn}</td>
              <td>{typeof d.accountId === "string" ? d.accountId : d.accountId?.namn || "-"}</td>
              <td>{Number(d.vardeSEK).toLocaleString()} SEK</td>
              <td>
                {editingId === d._id ? (
                  <select
                    className="input"
                    style={{ padding: 4, fontSize: 12 }}
                    defaultValue={d.fas}
                    onChange={(e) => handleStatusChange(d._id, e.target.value)}
                  >
                    <option value="PROSPEKT">PROSPEKT</option>
                    <option value="MOTE">MÖTE</option>
                    <option value="OFFERT">OFFERT</option>
                    <option value="VUNNEN">VUNNEN</option>
                    <option value="FORLORAD">FÖRLORAD</option>
                  </select>
                ) : (
                  <span className="badge">{d.fas}</span>
                )}
              </td>
              <td>{d.sannolikhet}%</td>
              <td>{formatDate(d.forvantatAvslut)}</td>
              <td>
                <button
                  className="button"
                  style={{ padding: "4px 8px", fontSize: 12 }}
                  onClick={() => setEditingId(editingId === d._id ? null : d._id)}
                >
                  {editingId === d._id ? "Avbryt" : "Ändra status"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="small" style={{ marginTop: 10 }}>
        Obs: i denna POC visas tabeller enkelt, men API:t har stöd för mer filtrering/pagination.
      </p>
    </div>
  );
}
