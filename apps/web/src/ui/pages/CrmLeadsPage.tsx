import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";

export function CrmLeadsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);

  useEffect(() => {
    api.leads(q || undefined).then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  }, [q]);

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ marginTop: 0 }}>{t("crm.leadsTitle")}</h2>
        <input className="input" style={{ maxWidth: 320 }} placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      <table className="table">
        <thead>
          <tr>
            <th>Namn</th>
            <th>E-post</th>
            <th>Källa</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((l) => (
            <tr key={l._id}>
              <td>{l.namn}</td>
              <td>{l.epost}</td>
              <td>{l.kalla}</td>
              <td><span className="badge">{l.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
