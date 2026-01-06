import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/date";

export function ResAssignmentsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ resursbehov: "", employeeId: "", belaggningPct: 1, fran: "", till: "", status: "NY" });

  const loadAssignments = () => {
    api.assignments().then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  };

  useEffect(() => {
    loadAssignments();
    api.employees().then((r) => {
      const consultants = r.items.filter((e: any) => (e.roll === "KONSULT" || e.roll === "TEKNIKCHEF") && e.status !== "INAKTIV" && e.status !== "UPPSAGD");
      setEmployees(consultants);
    });
  }, []);

  const utilizationByEmployee = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((a) => {
      const empId = typeof a.employeeId === "object" ? a.employeeId?._id : a.employeeId;
      if (empId && a.status !== "SLUTFÖRD") {
        map[empId] = (map[empId] || 0) + (a.belaggningPct || 0);
      }
    });
    return map;
  }, [items]);

  const statusLabel = (status: string) => t(`status.${status}`, status);

  const startEdit = (assignment: any) => {
    const today = new Date().toISOString().slice(0, 10);
    const projectData = assignment.projectId as any;
    const dealEndDate = projectData?.dealId?.forvantatAvslut || projectData?.slut;

    setEditingId(assignment._id);
    setFormData({
      resursbehov: assignment.resursbehov || "",
      employeeId: typeof assignment.employeeId === "object" ? assignment.employeeId?._id : assignment.employeeId || "",
      belaggningPct: Math.max(1, assignment.belaggningPct || 0),
      fran: assignment.fran ? new Date(assignment.fran).toISOString().slice(0, 10) : today,
      till: assignment.till ? new Date(assignment.till).toISOString().slice(0, 10) : (dealEndDate ? new Date(dealEndDate).toISOString().slice(0, 10) : ""),
      status: assignment.status || "NY",
    });
  };

  const handleSave = async (assignmentId: string) => {
    setFel(null);
    try {
      const body = {
        ...formData,
        belaggningPct: Math.max(1, Number(formData.belaggningPct)),
        ...(formData.fran ? { fran: new Date(formData.fran).toISOString() } : {}),
        ...(formData.till ? { till: new Date(formData.till).toISOString() } : {}),
      };

      const original = items.find((x) => x._id === assignmentId);

      // Prevent overbooking: compute current load for selected consultant, minus this assignment's existing load if same consultant
      const selectedEmpId = body.employeeId;
      const originalEmpId = typeof original?.employeeId === "object" ? original?.employeeId?._id : original?.employeeId;
      const baseBooked = utilizationByEmployee[selectedEmpId] || 0;
      const currentAssignmentLoad = selectedEmpId && originalEmpId === selectedEmpId ? (original?.belaggningPct || 0) : 0;
      const newTotal = baseBooked - currentAssignmentLoad + body.belaggningPct;
      if (newTotal > 100) {
        setFel(t("errors.consultantFullyBooked"));
        return;
      }

      await api.patch(`/res/assignments/${assignmentId}`, body);

      if (formData.status && original?.status && formData.status !== original.status) {
        await api.patch(`/res/assignments/${assignmentId}/status`, { status: formData.status });
      }

      loadAssignments();
      setEditingId(null);
      setFormData({ resursbehov: "", employeeId: "", belaggningPct: 0, fran: "", till: "", status: "NY" });
    } catch (err: any) {
      setFel(err.message);
    }
  };

  const handleStatusChange = async (assignmentId: string, newStatus: string) => {
    setFel(null);
    try {
      await api.patch(`/res/assignments/${assignmentId}/status`, { status: newStatus });
      loadAssignments();
    } catch (err: any) {
      setFel(err.message);
    }
  };

  const handleCopyAssignment = async (assignment: any) => {
    setFel(null);
    try {
      const projectData = assignment.projectId as any;
      const dealEndDate = projectData?.dealId?.forvantatAvslut || projectData?.slut || assignment.till;
      const today = new Date().toISOString();

      const employeeId = typeof assignment.employeeId === "object" ? assignment.employeeId?._id : assignment.employeeId;
      if (!employeeId) {
        setFel(t("common.selectConsultant"));
        return;
      }

      const newAssignment = {
        projectId: typeof assignment.projectId === "object" ? assignment.projectId._id : assignment.projectId,
        employeeId,
        belaggningPct: Math.max(1, assignment.belaggningPct || 0),
        resursbehov: assignment.resursbehov || "",
        status: "NY",
        fran: today,
        till: dealEndDate ? new Date(dealEndDate).toISOString() : today,
      };
      await api.post("/res/assignments", newAssignment);
      loadAssignments();
    } catch (err: any) {
      setFel(err.message);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t("res.assignmentsTitle")}</h2>
      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t("table.name")}</th>
            <th>{t("table.project")}</th>
            <th>{t("table.customer")}</th>
            <th>{t("table.resourceNeeds")}</th>
            <th>{t("table.utilization")}</th>
            <th>{t("table.from")}</th>
            <th>{t("table.to")}</th>
            <th>{t("table.status")}</th>
            <th>{t("table.action")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a._id}>
              <td>
                {editingId === a._id ? (
                  <select
                    className="input"
                    style={{ padding: 4, fontSize: 12, width: "100%" }}
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  >
                    <option value="">{t("assignments.selectConsultant")}</option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.namn} ({t("assignments.bookedPct", { pct: utilizationByEmployee[e._id] || 0 })})
                      </option>
                    ))}
                  </select>
                ) : (
                  typeof a.employeeId === "object" ? a.employeeId?.namn : a.employeeId || "-"
                )}
              </td>
              <td>{typeof a.projectId === "object" ? (typeof a.projectId.dealId === "object" ? a.projectId.dealId?.namn : a.projectId?.namn || "-") : a.projectId || "-"}</td>
              <td>{typeof a.projectId === "object" ? (typeof a.projectId.accountId === "object" ? a.projectId.accountId?.namn : a.projectId.accountId || "-") : "-"}</td>
              <td>
                {editingId === a._id ? (
                  <input
                    className="input"
                    style={{ padding: 4, fontSize: 12, width: "100%" }}
                    value={formData.resursbehov}
                    onChange={(e) => setFormData({ ...formData, resursbehov: e.target.value })}
                    placeholder={t("assignments.resourceNeedsPlaceholder")}
                  />
                ) : (
                  <span className="small">{a.resursbehov || "-"}</span>
                )}
              </td>
              <td>
                {editingId === a._id ? (
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={100}
                    style={{ padding: 4, fontSize: 12, width: 90 }}
                    value={formData.belaggningPct}
                    onChange={(e) => setFormData({ ...formData, belaggningPct: Number(e.target.value) })}
                  />
                ) : (
                  <span className="badge">{a.belaggningPct}%</span>
                )}
              </td>
              <td>
                {editingId === a._id ? (
                  <input
                    className="input"
                    type="date"
                    style={{ padding: 4, fontSize: 12 }}
                    value={formData.fran}
                    onChange={(e) => setFormData({ ...formData, fran: e.target.value })}
                  />
                ) : (
                  formatDate(a.fran)
                )}
              </td>
              <td>
                {editingId === a._id ? (
                  <input
                    className="input"
                    type="date"
                    style={{ padding: 4, fontSize: 12 }}
                    value={formData.till}
                    onChange={(e) => setFormData({ ...formData, till: e.target.value })}
                  />
                ) : (
                  formatDate(a.till)
                )}
              </td>
              <td>
                {editingId === a._id ? (
                  <select
                    className="input"
                    style={{ padding: 4, fontSize: 12, width: "100%" }}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="NY">{t("assignmentStatus.NY")}</option>
                    <option value="BEMANNAD">{t("assignmentStatus.BEMANNAD")}</option>
                    <option value="SLUTFÖRD">{t("assignmentStatus.SLUTFORD")}</option>
                  </select>
                ) : (
                  <span className="badge">{statusLabel(a.status)}</span>
                )}
              </td>
              <td>
                {editingId === a._id ? (
                  <button
                    className="button"
                    style={{ padding: "4px 8px", fontSize: 12 }}
                    onClick={() => handleSave(a._id)}
                  >
                    {t("actions.save")}
                  </button>
                ) : (
                  <>
                    <button
                      className="button ghost"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      onClick={() => startEdit(a)}
                    >
                      {a.status === "NY" ? t("actions.assign") : t("actions.edit")}
                    </button>
                    <button
                      className="button ghost"
                      style={{ padding: "4px 8px", fontSize: 12, marginLeft: 4 }}
                      onClick={() => handleCopyAssignment(a)}
                    >
                      {t("actions.copy", "Kopiera")}
                    </button>
                  </>
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
