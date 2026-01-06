import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/date";

export function ResProjectsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadProjects = () => {
    api.projects().then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setFel(null);
    try {
      await api.patch(`/res/projects/${id}/status`, { status: newStatus });
      loadProjects();
      setEditingId(null);
    } catch (err: any) {
      setFel(err.message);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t("res.projectsTitle")}</h2>
      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t("table.name")}</th>
            <th>{t("table.customer")}</th>
            <th>{t("table.start")}</th>
            <th>{t("table.end")}</th>
            <th>{t("table.status")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p._id}>
              <td>{typeof p.dealId === "object" ? p.dealId?.namn : p.namn || "-"}</td>
              <td>{typeof p.accountId === "object" ? p.accountId?.namn : p.accountId || "-"}</td>
              <td>{formatDate(p.start)}</td>
              <td>{p.slut ? formatDate(p.slut) : "—"}</td>
              <td>
                {editingId === p._id ? (
                  <select
                    className="input"
                    style={{ padding: 4, fontSize: 12 }}
                    defaultValue={p.status}
                    onChange={(e) => handleStatusChange(p._id, e.target.value)}
                  >
                    <option value="BEKRÄFTAD">BEKRÄFTAD</option>
                    <option value="PLANERING">PLANERING</option>
                    <option value="BEMANNING">BEMANNING</option>
                    <option value="SLUTFÖRD">SLUTFÖRD</option>
                  </select>
                ) : (
                  <span style={{ cursor: "pointer" }} onClick={() => setEditingId(p._id)}>
                    <span className="badge">{p.status}</span>
                  </span>
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
