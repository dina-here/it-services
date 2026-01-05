import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";

export function CrmAccountsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ namn: "", bransch: "" });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadAccounts = () => {
    api.accounts(q || undefined).then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  };

  useEffect(() => {
    loadAccounts();
  }, [q]);

  const startEdit = (a: any) => {
    setEditingId(a._id);
    setFormData({ namn: a.namn, bransch: a.bransch });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ namn: "", bransch: "" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFel(null);
    try {
      if (editingId) {
        await api.patch(`/crm/accounts/${editingId}`, formData);
      } else {
        await api.post("/crm/accounts", formData);
      }
      resetForm();
      setShowForm(false);
      loadAccounts();
    } catch (err: any) {
      setFel(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ marginTop: 0 }}>{t("crm.accountsTitle")}</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" style={{ maxWidth: 320 }} placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="button" onClick={() => {
            if (showForm) { resetForm(); }
            setShowForm(!showForm);
          }}>
            {showForm ? "Avbryt" : "+ Lägg till kund"}
          </button>
        </div>
      </div>

      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      {showForm && (
        <form onSubmit={handleSave} style={{ marginBottom: 20, padding: 15, border: "1px solid #ddd", borderRadius: 4 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Kundnamn *</label>
            <input
              className="input"
              type="text"
              value={formData.namn}
              onChange={(e) => setFormData({ ...formData, namn: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Bransch *</label>
            <input
              className="input"
              type="text"
              value={formData.bransch}
              onChange={(e) => setFormData({ ...formData, bransch: e.target.value })}
              required
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Sparar..." : editingId ? "Spara ändring" : "Spara kund"}
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
            <th>{t("table.industry")}</th>
            <th style={{ width: 120 }}>{t("table.action")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a._id}>
              <td>{a.namn}</td>
              <td>{a.bransch}</td>
              <td>
                <button className="button ghost" onClick={() => startEdit(a)}>
                  Redigera
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="small" style={{ marginTop: 10 }}>
        Tips: Gå vidare till CRM → Kontakter för att se kontaktpersoner.
      </p>
    </div>
  );
}
