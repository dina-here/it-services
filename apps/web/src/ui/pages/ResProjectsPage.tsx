import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/date";

export function ResProjectsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);

  useEffect(() => {
    api.projects().then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t("res.projectsTitle")}</h2>
      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      <table className="table">
        <thead>
          <tr>
            <th>Namn</th>
            <th>Start</th>
            <th>Slut</th>
            <th>AccountId</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p._id}>
              <td>{p.namn}</td>
              <td>{formatDate(p.start)}</td>
              <td>{p.slut ? formatDate(p.slut) : "—"}</td>
              <td className="small">{String(p.accountId)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
