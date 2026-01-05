import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";

export function CrmLeadsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ namn: "", epost: "", kalla: "", accountId: "", status: "NY" });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadLeads = () => {
    api.leads(q || undefined).then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  };

  useEffect(() => {
    loadLeads();
    api.accounts().then((r) => setAccounts(r.items)).catch(() => {});
  }, [q]);

  const startEdit = (l: any) => {
    setEditingId(l._id);
    setFormData({ namn: l.namn, epost: l.epost, kalla: l.kalla, accountId: l.accountId?._id || "", status: l.status });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ namn: "", epost: "", kalla: "", accountId: "", status: "NY" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFel(null);
    try {
      if (editingId) {
        await api.patch(`/crm/leads/${editingId}`, formData);
      } else {
        await api.post("/crm/leads", formData);
      }
      resetForm();
      setShowForm(false);
      loadLeads();
    } catch (err: any) {
      setFel(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ marginTop: 0 }}>{t("crm.leadsTitle")}</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" style={{ maxWidth: 320 }} placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="button" onClick={() => {
            if (showForm) { resetForm(); }
            setShowForm(!showForm);
          }}>
            {showForm ? "Avbryt" : "+ Lägg till lead"}
          </button>
        </div>
      </div>

      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      {showForm && (
        <form onSubmit={handleSave} style={{ marginBottom: 20, padding: 15, border: "1px solid #ddd", borderRadius: 4 }}>
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
            <label>E-post *</label>
            <input
              className="input"
              type="email"
              value={formData.epost}
              onChange={(e) => setFormData({ ...formData, epost: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Källa *</label>
            <input
              className="input"
              type="text"
              value={formData.kalla}
              onChange={(e) => setFormData({ ...formData, kalla: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Kund (Account)</label>
            <select
              className="input"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
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
            <label>Status *</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="NY">NY</option>
              <option value="KONTAKTAD">KONTAKTAD</option>
              <option value="KVALIFICERAD">KVALIFICERAD</option>
              <option value="AVSLUTAD">AVSLUTAD</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Sparar..." : editingId ? "Spara ändring" : "Spara lead"}
            </button>
            {editingId ? (
              <button className="button ghost" type="button" onClick={() => resetForm()}>
                Rensa
              </button>
            ) : null}
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>{t("table.name")}</th>
            <th>{t("table.email")}</th>
            <th>{t("table.source")}</th>
            <th>{t("table.account")}</th>
            <th>{t("table.status")}</th>
            <th style={{ width: 120 }}>{t("table.action")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((l) => (
            <tr key={l._id}>
              <td>{l.namn}</td>
              <td>{l.epost}</td>
              <td>{l.kalla}</td>
              <td>{l.accountId?.namn || "-"}</td>
              <td><span className="badge">{l.status}</span></td>
              <td>
                <button className="button ghost" onClick={() => startEdit(l)}>
                  Redigera
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
