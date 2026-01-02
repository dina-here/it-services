import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/date";

export function ErpInvoicesPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);

  useEffect(() => {
    api.invoices().then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t("erp.invoicesTitle")}</h2>
      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      <table className="table">
        <thead>
          <tr>
            <th>DealId</th>
            <th>Belopp</th>
            <th>Status</th>
            <th>Förfallodatum</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i._id}>
              <td className="small">{String(i.dealId)}</td>
              <td>{Number(i.beloppSEK).toLocaleString()} SEK</td>
              <td><span className="badge">{i.status}</span></td>
              <td>{formatDate(i.forfallodatum)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
