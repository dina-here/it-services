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
  const [otherKalla, setOtherKalla] = useState("");
  const [kallaSelect, setKallaSelect] = useState<string>("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const leadSources = [
    t("leadSource.inbound"),
    t("leadSource.outbound"),
    t("leadSource.referral"),
    t("leadSource.partner"),
    t("leadSource.event"),
    t("leadSource.ad"),
    "LinkedIn",
    t("leadSource.crm")
  ];
  const selectedSource = kallaSelect || (leadSources.includes(formData.kalla) ? formData.kalla : otherKalla ? "OTHER" : "");
  const showOtherSourceInput = selectedSource === "OTHER";

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
    const isPreset = leadSources.includes(l.kalla);
    setOtherKalla(isPreset ? "" : l.kalla || "");
    setKallaSelect(isPreset ? l.kalla : "OTHER");
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ namn: "", epost: "", kalla: "", accountId: "", status: "NY" });
    setOtherKalla("");
    setKallaSelect("");
    setFel(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFel(null);
    try {
      const name = formData.namn.trim();
      if (name.length < 2) {
        setFel(t("errors.leadNameMin"));
        setLoading(false);
        return;
      }
      if (!/^[a-zA-ZåäöÅÄÖ ]+$/.test(name)) {
        setFel(t("errors.leadNameLetters"));
        setLoading(false);
        return;
      }
      const finalKalla = kallaSelect === "OTHER" ? otherKalla.trim() : formData.kalla;
      if (!finalKalla) {
        setFel(t("errors.selectSourceRequired"));
        setLoading(false);
        return;
      }

      const payload = { ...formData, namn: name, kalla: finalKalla };

      if (editingId) {
        await api.patch(`/crm/leads/${editingId}`, payload);
      } else {
        await api.post("/crm/leads", payload);
      }
      resetForm();
      setShowForm(false);
      loadLeads();
    } catch (err: any) {
      setFel(err.message || t("errors.generic"));
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
            if (showForm) setFel(null);
          }}>
            {showForm ? t("common.cancel") : t("common.addLead")}
          </button>
        </div>
      </div>

      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      {showForm && (
        <form onSubmit={handleSave} style={{ marginBottom: 20, padding: 15, border: "1px solid #ddd", borderRadius: 4 }}>
          <div style={{ marginBottom: 10 }}>
            <label>{t("table.name")} *</label>
            <input
              className="input"
              type="text"
              value={formData.namn}
              onChange={(e) => setFormData({ ...formData, namn: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>{t("table.email")} *</label>
            <input
              className="input"
              type="email"
              value={formData.epost}
              onChange={(e) => setFormData({ ...formData, epost: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>{t("form.source")} *</label>
            <select
              className="input"
              value={selectedSource}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "OTHER") {
                  setFormData({ ...formData, kalla: "" });
                } else {
                  setFormData({ ...formData, kalla: val });
                  setOtherKalla("");
                }
              }}
              required
            >
              <option value="">{t("form.selectSource")}</option>
              {leadSources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="OTHER">{t("form.otherFreetext")}</option>
            </select>
            {showOtherSourceInput ? (
              <div style={{ marginTop: 8 }}>
                <input
                  className="input"
                  type="text"
                  placeholder={t("form.writeSource")}
                  value={otherKalla}
                  onChange={(e) => {
                    setOtherKalla(e.target.value);
                    setFormData({ ...formData, kalla: "" });
                  }}
                  required={showOtherSourceInput}
                />
              </div>
            ) : null}
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>{t("table.account")}</label>
            <select
              className="input"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            >
              <option value="">{t("form.selectAccount")}</option>
              {accounts.filter((a) => a.status !== "INAKTIV").map((a) => (
                <option key={a._id} value={a._id}>
                  {a.namn}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>{t("table.status")} *</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="NY">{t("leadStatus.NY")}</option>
              <option value="KONTAKTAD">{t("leadStatus.KONTAKTAD")}</option>
              <option value="KVALIFICERAD">{t("leadStatus.KVALIFICERAD")}</option>
              <option value="AVSLUTAD">{t("leadStatus.AVSLUTAD")}</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="button" type="submit" disabled={loading}>
              {loading ? t("common.saving") : editingId ? t("form.saveChanges") : t("form.saveLead")}
            </button>
            {editingId ? (
              <button className="button ghost" type="button" onClick={() => resetForm()}>
                {t("common.clear")}
              </button>
            ) : null}
          </div>
        </form>
      )}

      <div className="table-wrapper">
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
              <td><span className="badge">{t(`leadStatus.${l.status}`)}</span></td>
              <td>
                <button className="button ghost" onClick={() => startEdit(l)}>
                  {t("common.edit")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
