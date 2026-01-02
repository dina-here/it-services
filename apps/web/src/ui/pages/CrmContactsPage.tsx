import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";

export function CrmContactsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);

  useEffect(() => {
    // I POC: vi hämtar alla kontakter (kan filtreras på accountId via query)
    api.contacts().then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  }, []);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t("crm.contactsTitle")}</h2>
      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      <table className="table">
        <thead>
          <tr>
            <th>Namn</th>
            <th>E-post</th>
            <th>Titel</th>
            <th>AccountId</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c._id}>
              <td>{c.namn}</td>
              <td>{c.epost}</td>
              <td>{c.titel}</td>
              <td className="small">{c.accountId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
