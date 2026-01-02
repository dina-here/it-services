import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/date";

export function ResAssignmentsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);

  useEffect(() => {
    api.assignments().then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t("res.assignmentsTitle")}</h2>
      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      <table className="table">
        <thead>
          <tr>
            <th>EmployeeId</th>
            <th>ProjectId</th>
            <th>Beläggning</th>
            <th>Från</th>
            <th>Till</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a._id}>
              <td className="small">{String(a.employeeId)}</td>
              <td className="small">{String(a.projectId)}</td>
              <td><span className="badge">{a.belaggningPct}%</span></td>
              <td>{formatDate(a.fran)}</td>
              <td>{formatDate(a.till)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
