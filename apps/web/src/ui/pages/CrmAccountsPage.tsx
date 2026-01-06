import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";

export function CrmAccountsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ namn: "", bransch: "", status: "AKTIV" });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [branchMode, setBranchMode] = useState<"select" | "new">("select");
  const [newBranch, setNewBranch] = useState("");

  const loadAccounts = () => {
    api.accounts(q || undefined).then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  };

  useEffect(() => {
    loadAccounts();
  }, [q]);

  useEffect(() => {
    const opts = Array.from(new Set(items.map((i) => i.bransch).filter(Boolean))).sort();
    setBranchOptions(opts);
    if (formData.bransch && !opts.includes(formData.bransch)) {
      setBranchMode("new");
      setNewBranch(formData.bransch);
    }
  }, [items]);

  const startEdit = (a: any) => {
    setEditingId(a._id);
    setFormData({ namn: a.namn, bransch: a.bransch, status: a.status || "AKTIV" });
    setBranchMode(branchOptions.includes(a.bransch) ? "select" : "new");
    setNewBranch(branchOptions.includes(a.bransch) ? "" : a.bransch || "");
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ namn: "", bransch: "", status: "AKTIV" });
    setBranchMode("select");
    setNewBranch("");
    setFel(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFel(null);
    try {
      const name = formData.namn.trim();
      if (name.length < 2) {
        setFel(t("errors.accountNameMin"));
        setLoading(false);
        return;
      }
      if (!/[a-zA-ZåäöÅÄÖ]/.test(name)) {
        setFel(t("errors.accountNameLetters"));
        setLoading(false);
        return;
      }
      const bransch = branchMode === "new" ? newBranch.trim() || formData.bransch : formData.bransch;
      if (!bransch) {
        setFel(t("errors.industryRequired"));
        setLoading(false);
        return;
      }
      const payload = { ...formData, namn: name, bransch };

      if (editingId) {
        await api.patch(`/crm/accounts/${editingId}`, payload);
      } else {
        await api.post("/crm/accounts", payload);
      }
      resetForm();
      setShowForm(false);
      loadAccounts();
    } catch (err: any) {
      setFel(err.message || t("errors.generic"));
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
            if (showForm) setFel(null);
          }}>
            {showForm ? t("common.cancel") : t("common.addAccount")}
          </button>
        </div>
      </div>

      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      {showForm && (
        <form onSubmit={handleSave} style={{ marginBottom: 20, padding: 15, border: "1px solid #ddd", borderRadius: 4 }}>
          <div style={{ marginBottom: 10 }}>
            <label>{t("form.customerName")} *</label>
            <input
              className="input"
              type="text"
              value={formData.namn}
              onChange={(e) => setFormData({ ...formData, namn: e.target.value })}
              list="account-name-suggestions"
              required
            />
            <datalist id="account-name-suggestions">
              {Array.from(new Set(items.map((i) => i.namn).filter(Boolean))).map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>{t("form.industry")} *</label>
            <select
              className="input"
              value={branchMode === "new" ? "__new" : formData.bransch}
              onChange={(e) => {
                if (e.target.value === "__new") {
                  setBranchMode("new");
                  setNewBranch("");
                } else {
                  setBranchMode("select");
                  setFormData({ ...formData, bransch: e.target.value });
                  setNewBranch("");
                }
              }}
            >
              <option value="">{t("form.selectIndustry")}</option>
              {branchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value="__new">{t("form.addNewIndustry")}</option>
            </select>
            {branchMode === "new" ? (
              <input
                className="input"
                style={{ marginTop: 6 }}
                type="text"
                placeholder={t("form.newIndustry")}
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                list="branch-suggestions"
                required
              />
            ) : null}
            <datalist id="branch-suggestions">
              {branchOptions.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="button" type="submit" disabled={loading}>
              {loading ? t("common.saving") : editingId ? t("form.saveChanges") : t("form.saveAccount")}
            </button>
            {editingId ? (
              <button className="button ghost" type="button" onClick={() => resetForm()}>
                {t("common.clear")}
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
                  {t("common.edit")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
