import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/date";

export function DataEventsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [fel, setFel] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.events(page, 20)
      .then((r) => { setItems(r.items); setTotal(r.total); })
      .catch((e) => setFel(e.message));
  }, [page]);

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ marginTop: 0 }}>{t("data.eventsTitle")}</h2>
        <div className="row" style={{ alignItems: "center" }}>
          <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>←</button>
          <span className="small"> {page} / {pages} </span>
          <button className="btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>→</button>
        </div>
      </div>

      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Tidstämpel</th>
              <th>Händelsetyp</th>
              <th>Entitet</th>
              <th>Detaljer</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tbody key={e._id}>
                <tr onClick={() => setExpandedId(expandedId === e._id ? null : e._id)} style={{ cursor: "pointer" }}>
                  <td>{e.skapad ? formatDate(e.skapad) : "—"}</td>
                  <td><span className="badge">{e.typ}</span></td>
                  <td>{e.entitet} ({e.entitetId?.substring(0, 8)}...)</td>
                  <td className="small">{e.payload ? JSON.stringify(e.payload).substring(0, 40) : "—"}...</td>
                </tr>
                {expandedId === e._id && (
                  <tr style={{ backgroundColor: "#f5f5f5" }}>
                    <td colSpan={4}>
                      <div style={{ padding: 10, fontSize: 12 }}>
                        <div><strong>Entitet:</strong> {e.entitet}</div>
                        <div><strong>EntitetId:</strong> {e.entitetId}</div>
                        <div><strong>Typ:</strong> {e.typ}</div>
                        <div><strong>Aktör:</strong> {e.actorUserId || "—"}</div>
                        <div><strong>Skapad:</strong> {e.skapad ? formatDate(e.skapad) : "—"}</div>
                        <div style={{ marginTop: 8 }}>
                          <strong>Payload:</strong>
                          <pre style={{ backgroundColor: "#fff", padding: 8, borderRadius: 4, overflowX: "auto", fontSize: 11 }}>
                            {JSON.stringify(e.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
