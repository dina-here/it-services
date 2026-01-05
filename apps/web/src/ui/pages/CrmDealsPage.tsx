import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/date";

export function CrmDealsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    namn: "", 
    accountId: "", 
    vardeSEK: 0, 
    agareEmployeeId: "", 
    forvantatAvslut: "",
    kontaktNamn: "",
    kontaktEpost: "",
    kontaktLeadId: ""
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);

  const loadDeals = () => {
    api.deals().then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  };

  useEffect(() => {
    loadDeals();
    api.accounts().then((r) => setAccounts(r.items)).catch(() => {});
    api.employees().then((r) => setEmployees(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.accountId) {
      api.leads().then((r) => {
        const filteredLeads = r.items.filter((l: any) => l.accountId?._id === formData.accountId || l.accountId === formData.accountId);
        setLeads(filteredLeads);
      }).catch(() => {});
    } else {
      setLeads([]);
    }
  }, [formData.accountId]);

  const startEdit = (d: any) => {
    setEditingDealId(d._id);
    setFormData({
      namn: d.namn,
      accountId: typeof d.accountId === "string" ? d.accountId : d.accountId?._id || "",
      vardeSEK: d.vardeSEK,
      agareEmployeeId: d.agareEmployeeId,
      forvantatAvslut: d.forvantatAvslut ? new Date(d.forvantatAvslut).toISOString().slice(0, 16) : "",
      kontaktNamn: "",
      kontaktEpost: "",
      kontaktLeadId: ""
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingDealId(null);
    setFormData({ 
      namn: "", 
      accountId: "", 
      vardeSEK: 0, 
      agareEmployeeId: "", 
      forvantatAvslut: "",
      kontaktNamn: "",
      kontaktEpost: "",
      kontaktLeadId: ""
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFel(null);
    try {
      const payload = {
        namn: formData.namn,
        accountId: formData.accountId,
        vardeSEK: Number(formData.vardeSEK),
        agareEmployeeId: formData.agareEmployeeId,
        forvantatAvslut: new Date(formData.forvantatAvslut).toISOString(),
      };

      if (editingDealId) {
        await api.patch(`/crm/deals/${editingDealId}`, payload);
      } else {
        await api.post("/crm/deals", payload);
      }
      
      resetForm();
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
        <button className="button" onClick={() => {
          if (showForm) { resetForm(); }
          setShowForm(!showForm);
        }}>
          {showForm ? "Avbryt" : "+ Lägg till affär"}
        </button>
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
          
          {/* Kontaktperson fält */}
          <div style={{ marginBottom: 10, padding: 10, background: "#f9f9f9", borderRadius: 4 }}>
            <label style={{ fontWeight: 600 }}>Kontaktperson</label>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 13 }}>Välj från leads (samma kund)</label>
              <select
                className="input"
                value={formData.kontaktLeadId}
                onChange={(e) => {
                  const selectedLead = leads.find(l => l._id === e.target.value);
                  if (selectedLead) {
                    setFormData({ 
                      ...formData, 
                      kontaktLeadId: e.target.value,
                      kontaktNamn: selectedLead.namn,
                      kontaktEpost: selectedLead.epost
                    });
                  } else {
                    setFormData({ ...formData, kontaktLeadId: "" });
                  }
                }}
                disabled={!formData.accountId}
              >
                <option value="">-- Välj lead eller fyll i manuellt --</option>
                {leads.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.namn} ({l.epost})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 13 }}>Eller skriv in nytt namn</label>
              <input
                className="input"
                type="text"
                placeholder="Kontaktpersonens namn"
                value={formData.kontaktNamn}
                onChange={(e) => setFormData({ ...formData, kontaktNamn: e.target.value, kontaktLeadId: "" })}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 13 }}>Och email</label>
              <input
                className="input"
                type="email"
                placeholder="kontakt@exempel.se"
                value={formData.kontaktEpost}
                onChange={(e) => setFormData({ ...formData, kontaktEpost: e.target.value })}
              />
            </div>
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
          <div style={{ display: "flex", gap: 10 }}>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Sparar..." : editingDealId ? "Spara ändring" : "Spara affär"}
            </button>
            {editingDealId ? (
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
            <th>{t("table.customer")}</th>
            <th>{t("table.value")}</th>
            <th>{t("table.stage")}</th>
            <th>{t("table.probability")}</th>
            <th>{t("table.expectedCompletion")}</th>
            <th>{t("table.action")}</th>
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
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className="button ghost"
                    style={{ padding: "4px 8px", fontSize: 12 }}
                    onClick={() => startEdit(d)}
                  >
                    Redigera
                  </button>
                  <button
                    className="button ghost"
                    style={{ padding: "4px 8px", fontSize: 12 }}
                    onClick={() => setEditingId(editingId === d._id ? null : d._id)}
                  >
                    {editingId === d._id ? "Avbryt" : "Ändra status"}
                  </button>
                </div>
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
