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
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    namn: "",
    epost: "",
    roll: "KONSULT",
    startdatum: "",
    kompetenser: "",
    status: "AKTIV",
  });

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
      const name = formData.namn.trim();
      if (name.length < 2) {
        setFel(t("errors.employeeNameMin"));
        setLoading(false);
        return;
      }
      if (!/^[a-zA-ZåäöÅÄÖ ]+$/.test(name)) {
        setFel(t("errors.employeeNameLetters"));
        setLoading(false);
        return;
      }
      await api.post("/hr/employees", {
        ...formData,
        startdatum: new Date(formData.startdatum).toISOString(),
        kompetenser: formData.kompetenser.split(",").map((k) => k.trim()).filter((k) => k),
      });
      setFormData({ namn: "", epost: "", roll: "KONSULT", startdatum: "", kompetenser: "" });
      setShowForm(false);
      loadEmployees();
    } catch (err: any) {
      setFel(err.message || t("errors.generic"));
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
      setFel(err.message || t("errors.generic"));
    }
  };

  const startEdit = (emp: any) => {
    setEditingEmployeeId(emp._id);
    setEditFormData({
      namn: emp.namn,
      epost: emp.epost,
      roll: emp.roll,
      startdatum: emp.startdatum ? new Date(emp.startdatum).toISOString().slice(0, 10) : "",
      kompetenser: (emp.kompetenser || []).join(", "),
      status: emp.status,
    });
  };

  const handleEdit = async (id: string) => {
    setFel(null);
    try {
      const name = editFormData.namn.trim();
      if (name.length < 2) {
        setFel(t("errors.employeeNameMin"));
        return;
      }
      if (!/^[a-zA-ZåäöÅÄÖ ]+$/.test(name)) {
        setFel(t("errors.employeeNameLetters"));
        return;
      }
      await api.patch(`/hr/employees/${id}`, {
        ...editFormData,
        startdatum: new Date(editFormData.startdatum).toISOString(),
        kompetenser: editFormData.kompetenser.split(",").map((k) => k.trim()).filter((k) => k),
      });
      loadEmployees();
      setEditingEmployeeId(null);
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
          <button className="button" onClick={() => {
            if (showForm) {
              setFormData({ namn: "", epost: "", roll: "KONSULT", startdatum: "", kompetenser: "" });
              setFel(null);
            }
            setShowForm(!showForm);
          }}>
            {showForm ? t("common.cancel") : t("common.addEmployee")}
          </button>
        </div>
      </div>

      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      {showForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: 20, padding: 15, border: "1px solid #ddd", borderRadius: 4 }}>
          <div style={{ marginBottom: 10 }}>
            <label>{t("table.name")} *</label>
            <input className="input" type="text" value={formData.namn} onChange={(e) => setFormData({ ...formData, namn: e.target.value })} required />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>{t("table.email")} *</label>
            <input className="input" type="email" value={formData.epost} onChange={(e) => setFormData({ ...formData, epost: e.target.value })} required />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>{t("form.role")} *</label>
            <select className="input" value={formData.roll} onChange={(e) => setFormData({ ...formData, roll: e.target.value })}>
              <option value="KONSULT">{t("role.KONSULT")}</option>
              <option value="SALJ">{t("role.SALJ")}</option>
              <option value="HR">{t("role.HR")}</option>
              <option value="TEKNIKCHEF">{t("role.TEKNIKCHEF")}</option>
              <option value="VD">{t("role.VD")}</option>
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>{t("form.startDate")} *</label>
            <input className="input" type="date" value={formData.startdatum} onChange={(e) => setFormData({ ...formData, startdatum: e.target.value })} required />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>{t("form.competencies")}</label>
            <input className="input" type="text" placeholder="t.ex: JavaScript, React, Node.js" value={formData.kompetenser} onChange={(e) => setFormData({ ...formData, kompetenser: e.target.value })} />
          </div>
          <button className="button" type="submit" disabled={loading}>
            {loading ? t("common.saving") : t("form.saveEmployee")}
          </button>
        </form>
      )}

      <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t("table.name")}</th>
            <th>{t("table.role")}</th>
            <th>{t("table.competencies")}</th>
            <th>{t("table.start")}</th>
            <th>{t("table.action")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e._id}>
              <td>
                {editingEmployeeId === e._id ? (
                  <input className="input" style={{ padding: 4, fontSize: 12 }} value={editFormData.namn} onChange={(ev) => setEditFormData({ ...editFormData, namn: ev.target.value })} />
                ) : (
                  e.namn
                )}
              </td>
              <td>
                {editingEmployeeId === e._id ? (
                  <select className="input" style={{ padding: 4, fontSize: 12 }} value={editFormData.roll} onChange={(ev) => setEditFormData({ ...editFormData, roll: ev.target.value })}>
                    <option value="KONSULT">{t("role.KONSULT")}</option>
                    <option value="SALJ">{t("role.SALJ")}</option>
                    <option value="HR">{t("role.HR")}</option>
                    <option value="TEKNIKCHEF">{t("role.TEKNIKCHEF")}</option>
                    <option value="VD">{t("role.VD")}</option>
                  </select>
                ) : (
                  <span className="badge">{t(`role.${e.roll}`)}</span>
                )}
              </td>
              <td className="small">
                {editingEmployeeId === e._id ? (
                  <input className="input" style={{ padding: 4, fontSize: 12 }} placeholder={t("form.competenciesPlaceholder")}
                    value={editFormData.kompetenser}
                    onChange={(ev) => setEditFormData({ ...editFormData, kompetenser: ev.target.value })}
                  />
                ) : (
                  (e.kompetenser || []).join(", ")
                )}
              </td>
              <td>
                {editingEmployeeId === e._id ? (
                  <input className="input" type="date" style={{ padding: 4, fontSize: 12 }} value={editFormData.startdatum} onChange={(ev) => setEditFormData({ ...editFormData, startdatum: ev.target.value })} />
                ) : (
                  formatDate(e.startdatum)
                )}
              </td>
              <td>
                {editingEmployeeId === e._id ? (
                  <button
                    className="button"
                    style={{ padding: "4px 8px", fontSize: 12 }}
                    onClick={() => handleEdit(e._id)}
                  >
                    {t("actions.save")}
                  </button>
                ) : (
                  <button
                    className="button ghost"
                    style={{ padding: "4px 8px", fontSize: 12 }}
                    onClick={() => startEdit(e)}
                  >
                    {t("common.edit")}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
