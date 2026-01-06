import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/date";

export function ErpInvoicesPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadInvoices = () => {
    api.invoices().then((r) => {
      // Gruppera fakturor per projekt och lägg till sekvensnummer
      const itemsWithSequence = r.items.map((item: any, index: number, array: any[]) => {
        const projectId = typeof item.projectId === 'string' ? item.projectId : item.projectId?._id;
        const sameProjectInvoices = array.filter((inv: any) => {
          const invProjectId = typeof inv.projectId === 'string' ? inv.projectId : inv.projectId?._id;
          return invProjectId === projectId;
        });
        const sequenceNumber = sameProjectInvoices.findIndex((inv: any) => inv._id === item._id) + 1;
        return { ...item, sequenceNumber, totalForProject: sameProjectInvoices.length };
      });
      setItems(itemsWithSequence);
    }).catch((e) => setFel(e.message));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setFel(null);
    try {
      await api.patch(`/erp/invoices/${id}/status`, { status: newStatus });
      loadInvoices();
      setEditingId(null);
    } catch (err: any) {
      setFel(err.message);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t("erp.invoicesTitle")}</h2>
      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      <table className="table">
        <thead>
          <tr>
            <th>{t("table.customer")}</th>
            <th>{t("table.deal")}</th>
            <th>#</th>
            <th>{t("table.amount")}</th>
            <th>{t("table.status")}</th>
            <th>{t("table.dueDate")}</th>
            <th>{t("table.action")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => {
            const project = i.projectId;
            const account = typeof project?.accountId === 'object' ? project.accountId : null;
            const deal = typeof project?.dealId === 'object' ? project.dealId : null;
            
            return (
              <tr key={i._id}>
                <td>{account?.namn || project?.accountId || "-"}</td>
                <td>{deal?.namn || project?.dealId || "-"}</td>
                <td className="small">{i.totalForProject > 1 ? `${i.sequenceNumber}` : "1"}</td>
                <td>{Number(i.beloppSEK).toLocaleString()} SEK</td>
                <td>
                  {editingId === i._id ? (
                    <select
                      className="input"
                      style={{ padding: 4, fontSize: 12 }}
                      defaultValue={i.status}
                      onChange={(e) => handleStatusChange(i._id, e.target.value)}
                    >
                      <option value="UTKAST">{t("invoiceStatus.UTKAST")}</option>
                      <option value="SKICKAD">{t("invoiceStatus.SKICKAD")}</option>
                      <option value="BETALD">{t("invoiceStatus.BETALD")}</option>
                    </select>
                  ) : (
                    <span className="badge">{t(`invoiceStatus.${i.status}`)}</span>
                  )}
                </td>
                <td>{formatDate(i.forfallodatum)}</td>
                <td>
                  <button
                    className="button ghost"
                    style={{ padding: "4px 8px", fontSize: 12 }}
                    onClick={() => setEditingId(editingId === i._id ? null : i._id)}
                  >
                    {editingId === i._id ? t("common.cancel") : t("common.changeStatus")}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
