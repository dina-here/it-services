import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/date";

export function CrmDealsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [fel, setFel] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    namn: "", 
    accountId: "", 
    vardeSEK: 0, 
    agareEmployeeId: "", 
    forvantatAvslut: "",
    kontaktNamn: "",
    kontaktEpost: "",
    kontaktLeadId: "",
    kontaktKalla: "CRM"
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [otherKalla, setOtherKalla] = useState("");
  const [kallaSelect, setKallaSelect] = useState<string>("");
  const leadSources = [
    t("leadSource.inbound"),
    t("leadSource.outbound"),
    t("leadSource.referral"),
    t("leadSource.partner"),
    t("leadSource.event"),
    t("leadSource.ad"),
    "LinkedIn",
    t("leadSource.crm")
  ];
  const selectedSource = kallaSelect || (leadSources.includes(formData.kontaktKalla) ? formData.kontaktKalla : otherKalla ? "OTHER" : t("leadSource.crm"));
  const showOtherSourceInput = selectedSource === "OTHER";

  const loadDeals = () => {
    api.deals().then((r) => setItems(r.items)).catch((e) => setFel(e.message));
  };

  useEffect(() => {
    loadDeals();
    api.accounts().then((r) => setAccounts(r.items)).catch(() => {});
    api.me().then((r) => {
      setMe(r.user);
      if (r.user?.employeeId && !formData.agareEmployeeId) {
        setFormData((prev) => ({ ...prev, agareEmployeeId: r.user.employeeId }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.accountId) {
      api.leads().then((r) => {
        const filteredLeads = r.items.filter((l: any) => l.accountId?._id === formData.accountId || l.accountId === formData.accountId);
        setLeads(filteredLeads);
        setFormData((prev) => {
          const stillSameLead = filteredLeads.some((l: any) => l._id === prev.kontaktLeadId);
          if (stillSameLead || (!prev.kontaktNamn && !prev.kontaktEpost && filteredLeads.length > 0)) {
            const nextLead = filteredLeads.find((l: any) => l._id === prev.kontaktLeadId) || filteredLeads[0];
            const chosenKalla = nextLead?.kalla || prev.kontaktKalla;
            const inList = chosenKalla && leadSources.includes(chosenKalla);
            if (chosenKalla && !inList) {
              setOtherKalla(chosenKalla);
              setKallaSelect("OTHER");
            } else {
              setOtherKalla("");
              setKallaSelect(chosenKalla || "");
            }
            return {
              ...prev,
              kontaktLeadId: nextLead?._id || "",
              kontaktNamn: nextLead?.namn || prev.kontaktNamn,
              kontaktEpost: nextLead?.epost || prev.kontaktEpost,
              kontaktKalla: inList ? chosenKalla : prev.kontaktKalla,
            };
          }
          // If switching account and current lead doesn't belong, clear contact fields
          return {
            ...prev,
            kontaktLeadId: "",
            kontaktNamn: prev.kontaktNamn ? prev.kontaktNamn : "",
            kontaktEpost: prev.kontaktEpost ? prev.kontaktEpost : "",
          };
        });
      }).catch(() => {});
    } else {
      setLeads([]);
      setFormData((prev) => ({ ...prev, kontaktLeadId: "" }));
    }
  }, [formData.accountId]);

  const startEdit = (d: any) => {
    setEditingDealId(d._id);
    
    // Om det finns en lead kopplad, hämta den senaste källan från leaden
    if (d.kontaktLeadId) {
      api.get(`/crm/leads/${d.kontaktLeadId}`).then((lead: any) => {
        const chosenKalla = lead?.kalla || "CRM";
        const inList = leadSources.includes(chosenKalla);
        
        if (chosenKalla && !inList) {
          setOtherKalla(chosenKalla);
          setKallaSelect("OTHER");
        } else {
          setOtherKalla("");
          setKallaSelect(chosenKalla);
        }
        
        setFormData({
          namn: d.namn,
          accountId: typeof d.accountId === "string" ? d.accountId : d.accountId?._id || "",
          vardeSEK: d.vardeSEK,
          agareEmployeeId: d.agareEmployeeId || me?.employeeId || "",
          forvantatAvslut: d.forvantatAvslut ? new Date(d.forvantatAvslut).toISOString().slice(0, 10) : "",
          kontaktNamn: d.kontaktNamn || "",
          kontaktEpost: d.kontaktEpost || "",
          kontaktLeadId: d.kontaktLeadId || "",
          kontaktKalla: inList ? chosenKalla : "CRM"
        });
      }).catch(() => {
        // Om vi inte kan hämta lead, sätt standard-värden
        setFormData({
          namn: d.namn,
          accountId: typeof d.accountId === "string" ? d.accountId : d.accountId?._id || "",
          vardeSEK: d.vardeSEK,
          agareEmployeeId: d.agareEmployeeId || me?.employeeId || "",
          forvantatAvslut: d.forvantatAvslut ? new Date(d.forvantatAvslut).toISOString().slice(0, 10) : "",
          kontaktNamn: d.kontaktNamn || "",
          kontaktEpost: d.kontaktEpost || "",
          kontaktLeadId: d.kontaktLeadId || "",
          kontaktKalla: "CRM"
        });
        setOtherKalla("");
        setKallaSelect("");
      });
    } else {
      setFormData({
        namn: d.namn,
        accountId: typeof d.accountId === "string" ? d.accountId : d.accountId?._id || "",
        vardeSEK: d.vardeSEK,
        agareEmployeeId: d.agareEmployeeId || me?.employeeId || "",
        forvantatAvslut: d.forvantatAvslut ? new Date(d.forvantatAvslut).toISOString().slice(0, 10) : "",
        kontaktNamn: d.kontaktNamn || "",
        kontaktEpost: d.kontaktEpost || "",
        kontaktLeadId: d.kontaktLeadId || "",
        kontaktKalla: "CRM"
      });
      setOtherKalla("");
      setKallaSelect("");
    }
    
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingDealId(null);
    setFormData({ 
      namn: "", 
      accountId: "", 
      vardeSEK: 0, 
      agareEmployeeId: me?.employeeId || "", 
      forvantatAvslut: "",
      kontaktNamn: "",
      kontaktEpost: "",
      kontaktLeadId: "",
      kontaktKalla: "CRM"
    });
    setOtherKalla("");
    setKallaSelect("");
  };

  const ensureLeadAndContact = async (accountId: string) => {
    const namn = formData.kontaktNamn.trim();
    const epost = formData.kontaktEpost.trim();

    const wantsContact = namn || epost;
    if (!wantsContact) return { leadId: undefined, kontakt: null as any };
    if (!namn || !epost) throw new Error("Fyll i både kontaktperson och email.");

    const finalKalla = kallaSelect === "OTHER" ? otherKalla.trim() : formData.kontaktKalla;

    // Om en lead är vald, använd den som kontakt också (och uppdatera källa)
    if (formData.kontaktLeadId) {
      await api.patch(`/crm/leads/${formData.kontaktLeadId}`, { kalla: finalKalla || "CRM" });
      await api.post("/crm/contacts", { accountId, namn, epost, titel: "Kontaktperson" });
      return { leadId: formData.kontaktLeadId, kontakt: { namn, epost } };
    }

    // Kolla om lead redan finns med samma email
    const existingLeadsRes = await api.leads();
    const existingLead = existingLeadsRes.items.find((l: any) => l.epost.toLowerCase() === epost.toLowerCase());
    
    if (existingLead) {
      // Uppdatera befintlig lead med ny källa och koppla till konto
      await api.patch(`/crm/leads/${existingLead._id}`, { 
        kalla: finalKalla || "CRM",
        accountId,
        status: "KVALIFICERAD"
      });
      await api.post("/crm/contacts", { accountId, namn, epost, titel: "Kontaktperson" });
      setFormData((prev) => ({ ...prev, kontaktLeadId: existingLead._id }));
      return { leadId: existingLead._id, kontakt: { namn, epost } };
    }

    // Annars skapa ny lead + kontakt
    const lead = await api.post("/crm/leads", {
      namn,
      epost,
      kalla: finalKalla || "CRM",
      accountId,
      status: "KVALIFICERAD",
    });
    await api.post("/crm/contacts", { accountId, namn, epost, titel: "Kontaktperson" });
    setFormData((prev) => ({ ...prev, kontaktLeadId: lead._id }));
    return { leadId: lead._id, kontakt: { namn, epost } };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFel(null);
    try {
      const payload: any = {
        namn: formData.namn,
        accountId: formData.accountId,
        vardeSEK: Number(formData.vardeSEK),
        forvantatAvslut: new Date(formData.forvantatAvslut).toISOString(),
      };

      if (formData.agareEmployeeId || me?.employeeId) {
        payload.agareEmployeeId = formData.agareEmployeeId || me?.employeeId;
      }

      const wantsContact = formData.kontaktNamn.trim() || formData.kontaktEpost.trim();
      if (wantsContact && (!formData.kontaktNamn.trim() || !formData.kontaktEpost.trim())) {
        setFel("Fyll i både kontaktperson och email.");
        return;
      }

      if (wantsContact) {
        const contactResult = await ensureLeadAndContact(payload.accountId);
        payload.kontaktLeadId = contactResult?.leadId;
        payload.kontaktNamn = formData.kontaktNamn.trim();
        payload.kontaktEpost = formData.kontaktEpost.trim();
      }

      if (editingDealId) {
        await api.patch(`/crm/deals/${editingDealId}`, payload);
      } else {
        await api.post("/crm/deals", payload);
      }

      resetForm();
      setShowForm(false);
      loadDeals();
    } catch (err: any) {
      setFel(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newFas: string) => {
    setFel(null);
    try {
      await api.patch(`/crm/deals/${id}/stage`, { fas: newFas });
      loadDeals();
      setEditingId(null);
    } catch (err: any) {
      setFel(err.message);
    }
  };

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ marginTop: 0 }}>{t("crm.dealsTitle")}</h2>
        <button className="button" onClick={() => {
          if (showForm) { resetForm(); }
          setShowForm(!showForm);
        }}>
          {showForm ? t("common.cancel") : t("common.addDeal")}
        </button>
      </div>

      {fel ? <div className="small" style={{ color: "crimson" }}>{fel}</div> : null}

      {showForm && (
        <form onSubmit={handleSave} style={{ marginBottom: 20, padding: 15, border: "1px solid #ddd", borderRadius: 4 }}>
          <div style={{ marginBottom: 10 }}>
            <label>{t("table.name")} *</label>
            <input
              className="input"
              type="text"
              value={formData.namn}
              onChange={(e) => setFormData({ ...formData, namn: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>{t("table.customer")} *</label>
            <select
              className="input"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              required
            >
              <option value="">{t("form.selectAccount")}</option>
              {accounts.filter((a) => a.status !== "INAKTIV").map((a) => (
                <option key={a._id} value={a._id}>
                  {a.namn}
                </option>
              ))}
            </select>
          </div>
          
          {/* Kontaktperson fält */}
          <div style={{ marginBottom: 10, padding: 10, background: "#f9f9f9", borderRadius: 4 }}>
            <label style={{ fontWeight: 600 }}>{t("form.contactPerson")}</label>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 13 }}>{t("form.selectFromLeads")}</label>
              <select
                className="input"
                value={formData.kontaktLeadId}
                onChange={(e) => {
                  const selectedLead = leads.find(l => l._id === e.target.value);
                  if (selectedLead) {
                    const chosenKalla = selectedLead.kalla;
                    const inList = chosenKalla && leadSources.includes(chosenKalla);
                    if (chosenKalla && !inList) {
                      setOtherKalla(chosenKalla);
                      setKallaSelect("OTHER");
                    } else {
                      setOtherKalla("");
                      setKallaSelect(chosenKalla || "");
                    }
                    setFormData({ 
                      ...formData, 
                      kontaktLeadId: e.target.value,
                      kontaktNamn: selectedLead.namn,
                      kontaktEpost: selectedLead.epost,
                      kontaktKalla: inList ? chosenKalla : formData.kontaktKalla,
                    });
                  } else {
                    setFormData({ ...formData, kontaktLeadId: "" });
                  }
                }}
                disabled={!formData.accountId}
              >
                <option value="">{t("form.selectLeadOrManual")}</option>
                {leads.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.namn} ({l.epost})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 13 }}>{t("form.orEnterNewName")}</label>
              <input
                className="input"
                type="text"
                placeholder={t("form.contactName")}
                value={formData.kontaktNamn}
                onChange={(e) => setFormData({ ...formData, kontaktNamn: e.target.value, kontaktLeadId: "" })}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 13 }}>{t("form.andEmail")}</label>
              <input
                className="input"
                type="email"
                placeholder="kontakt@exempel.se"
                value={formData.kontaktEpost}
                onChange={(e) => setFormData({ ...formData, kontaktEpost: e.target.value })}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 13 }}>{t("form.source")}</label>
              <select
                className="input"
                value={selectedSource}
                onChange={(e) => {
                  const val = e.target.value;
                  setKallaSelect(val);
                  if (val === "OTHER") {
                    setFormData({ ...formData, kontaktKalla: "" });
                  } else {
                    setFormData({ ...formData, kontaktKalla: val });
                    setOtherKalla("");
                  }
                }}
              >
                {leadSources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="OTHER">{t("form.otherFreetext")}</option>
              </select>
              {showOtherSourceInput ? (
                <div style={{ marginTop: 4 }}>
                  <input
                    className="input"
                    type="text"
                    placeholder={t("form.writeSource")}
                    value={otherKalla}
                    onChange={(e) => {
                      setOtherKalla(e.target.value);
                      setFormData({ ...formData, kontaktKalla: "" });
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>{t("form.value")} *</label>
            <input
              className="input"
              type="number"
              value={formData.vardeSEK}
              onChange={(e) => setFormData({ ...formData, vardeSEK: Number(e.target.value) })}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>{t("form.expectedCompletion")} *</label>
            <input
              className="input"
              type="date"
              value={formData.forvantatAvslut}
              onChange={(e) => setFormData({ ...formData, forvantatAvslut: e.target.value })}
              required
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="button" type="submit" disabled={loading}>
              {loading ? t("common.saving") : editingDealId ? t("form.saveChanges") : t("form.saveDeal")}
            </button>
            {editingDealId ? (
              <button className="button ghost" type="button" onClick={() => resetForm()}>
                {t("common.clear")}
              </button>
            ) : null}
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>{t("table.project")}</th>
            <th>{t("table.customer")}</th>
            <th>{t("table.value")}</th>
            <th>{t("table.stage")}</th>
            <th>{t("table.probability")}</th>
            <th>{t("table.expectedCompletion")}</th>
            <th>{t("table.contact")}</th>
            <th>{t("table.action")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d._id}>
              <td>{d.namn}</td>
              <td>{typeof d.accountId === "string" ? d.accountId : d.accountId?.namn || "-"}</td>
              <td>{Number(d.vardeSEK).toLocaleString()} SEK</td>
              <td>
                {editingId === d._id ? (
                  <select
                    className="input"
                    style={{ padding: 4, fontSize: 12 }}
                    defaultValue={d.fas}
                    onChange={(e) => handleStatusChange(d._id, e.target.value)}
                    disabled={d.fas === "VUNNEN" || d.fas === "FORLORAD"}
                  >
                    <option value="PROSPEKT">{t("stage.PROSPEKT")}</option>
                    <option value="MOTE">{t("stage.MOTE")}</option>
                    <option value="OFFERT">{t("stage.OFFERT")}</option>
                    <option value="VUNNEN">{t("stage.VUNNEN")}</option>
                    <option value="FORLORAD">{t("stage.FORLORAD")}</option>
                  </select>
                ) : (
                  <span className="badge">{t(`stage.${d.fas}`)}</span>
                )}
              </td>
              <td>{d.sannolikhet}%</td>
              <td>{formatDate(d.forvantatAvslut)}</td>
              <td>
                {d.kontaktNamn ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span className="small" style={{ fontWeight: 600 }}>{d.kontaktNamn}</span>
                    <span className="small" style={{ color: "#555" }}>{d.kontaktEpost}</span>
                  </div>
                ) : (
                  <span className="small">-</span>
                )}
              </td>
              <td>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className="button ghost"
                    style={{ padding: "4px 8px", fontSize: 12 }}
                    onClick={() => startEdit(d)}
                  >
                    {t("common.edit")}
                  </button>
                  {d.fas !== "VUNNEN" && d.fas !== "FORLORAD" && (
                    <button
                      className="button ghost"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      onClick={() => setEditingId(editingId === d._id ? null : d._id)}
                    >
                      {editingId === d._id ? t("common.cancel") : t("common.changeStatus")}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
