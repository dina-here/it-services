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

  const loadAccounts = () => {
    api.accounts(q || undefined).then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  };

  useEffect(() => {
    loadAccounts();
  }, [q]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFel(null);
    try {
      await api.post("/crm/accounts", formData);
      setFormData({ namn: "", bransch: "" });
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
          <button className="button" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Avbryt" : "+ Lägg till kund"}
          </button>
        </div>
      </div>

      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      {showForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: 20, padding: 15, border: "1px solid #ddd", borderRadius: 4 }}>
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
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Sparar..." : "Spara kund"}
          </button>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Namn</th>
            <th>Bransch</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a._id}>
              <td>{a.namn}</td>
              <td>{a.bransch}</td>
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
