import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, AuthedRequest } from "../auth/auth.middleware.js";
import { HttpError } from "../../server/httpError.js";
import { LeadModel } from "./lead.model.js";
import { AccountModel } from "./account.model.js";
import { ContactModel } from "./contact.model.js";
import { DealModel } from "./deal.model.js";
import { loggaEvent } from "../data/data.service.js";
import { InvoiceModel } from "../erp/invoice.model.js";
import { ProjectModel } from "../resurs/project.model.js";
import { AssignmentModel } from "../resurs/assignment.model.js";

export const crmRouter = Router();

// Alla CRM-endpoints kräver inloggning
crmRouter.use(requireAuth);

// === Leads ===
const LeadCreate = z.object({
  namn: z.string().min(2, "Lead name must be at least 2 characters.").regex(/^[a-zA-ZåäöÅÄÖ ]+$/, "Lead name can only contain letters and spaces."),
  epost: z.string().email(),
  kalla: z.string().min(2),
  accountId: z.string().min(1, "Account is required").optional(),
  status: z.enum(["NY", "KONTAKTAD", "KVALIFICERAD", "AVSLUTAD"]).optional(),
});
const LeadUpdate = LeadCreate.partial();

crmRouter.get("/leads", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = q
      ? { $or: [{ namn: { $regex: q, $options: "i" } }, { epost: { $regex: q, $options: "i" } }, { kalla: { $regex: q, $options: "i" } }] }
      : {};

    const items = await LeadModel.find(filter).populate("accountId", "namn bransch").sort({ skapad: -1 }).limit(200).lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

crmRouter.post("/leads", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const body = LeadCreate.parse(req.body);
    
    // Check if lead with same name and email already exists
    const existing = await LeadModel.findOne({ namn: body.namn, epost: body.epost });
    if (existing) {
      throw new HttpError(400, "En lead med samma namn och e-post finns redan.");
    }
    
    const created = await LeadModel.create(body);
    await loggaEvent({ typ: "LEAD_SKAPAD", entitet: "lead", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

crmRouter.patch("/leads/:id", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const id = req.params.id;
    const body = LeadUpdate.parse(req.body);

    // Check if updating to a name+email combo that already exists (excluding current lead)
    if (body.namn && body.epost) {
      const existing = await LeadModel.findOne({ namn: body.namn, epost: body.epost, _id: { $ne: id } });
      if (existing) {
        throw new HttpError(400, "En lead med samma namn och e-post finns redan.");
      }
    }

    const updated = await LeadModel.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
    if (!updated) throw new HttpError(404, "Lead hittades inte.");

    await loggaEvent({ typ: "LEAD_ANDRAD", entitet: "lead", entitetId: String(id), actorUserId: req.user!.id, payload: body });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// === Accounts ===
const AccountCreate = z.object({ 
  namn: z.string().min(2).regex(/[a-zA-ZåäöÅÄÖ]/, "Customer name must contain at least one letter."), 
  bransch: z.string().min(2), 
  status: z.enum(["AKTIV", "INAKTIV"]).optional() 
});
const AccountUpdate = AccountCreate.partial();

crmRouter.get("/accounts", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();
    const filter: any = q ? { namn: { $regex: q, $options: "i" } } : {};
    if (status) filter.status = status;
    const items = await AccountModel.find(filter).sort({ skapad: -1 }).limit(200).lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

crmRouter.post("/accounts", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const body = AccountCreate.parse(req.body);
    
    // Check if account with same name already exists
    const existing = await AccountModel.findOne({ namn: body.namn });
    if (existing) {
      throw new HttpError(400, "En kund med samma namn finns redan.");
    }
    
    const accountKey = `a_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const created = await AccountModel.create({ ...body, accountKey });
    await loggaEvent({ typ: "ACCOUNT_SKAPAD", entitet: "account", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

crmRouter.patch("/accounts/:id", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const id = req.params.id;
    const body = AccountUpdate.parse(req.body);

    // Check if updating to a name that already exists (excluding current account)
    if (body.namn) {
      const existing = await AccountModel.findOne({ namn: body.namn, _id: { $ne: id } });
      if (existing) {
        throw new HttpError(400, "En kund med samma namn finns redan.");
      }
    }

    const updated = await AccountModel.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
    if (!updated) throw new HttpError(404, "Kund hittades inte.");

    await loggaEvent({ typ: "ACCOUNT_ANDRAD", entitet: "account", entitetId: String(id), actorUserId: req.user!.id, payload: body });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// === Contacts ===
const ContactCreate = z.object({
  accountId: z.string().min(1),
  namn: z.string().min(2),
  epost: z.string().email(),
  titel: z.string().min(2),
});

crmRouter.get("/contacts", async (req, res, next) => {
  try {
    const accountId = String(req.query.accountId || "").trim();
    const filter = accountId ? { accountId } : {};
    const items = await ContactModel.find(filter).sort({ skapad: -1 }).limit(200).lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

crmRouter.post("/contacts", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const body = ContactCreate.parse(req.body);
    const created = await ContactModel.create(body);
    await loggaEvent({ typ: "CONTACT_SKAPAD", entitet: "contact", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// === Deals ===
const DealCreate = z.object({
  accountId: z.string().min(1),
  namn: z
    .string()
    .min(2, "Deal name must be at least 2 characters.")
    .regex(/[a-zA-ZåäöÅÄÖ]/, "Deal name must include at least one letter (A-Ö)."),
  vardeSEK: z.number().nonnegative(),
  fas: z.enum(["PROSPEKT", "MOTE", "OFFERT", "VUNNEN", "FORLORAD"]).optional(),
  sannolikhet: z.number().min(0).max(100).optional(),
  agareEmployeeId: z.string().min(1).optional(),
  forvantatAvslut: z.string().datetime(),
  kontaktLeadId: z.string().optional(),
  kontaktNamn: z.string().min(1).optional(),
  kontaktEpost: z.string().email().optional(),
  kontaktTitel: z.string().min(1).optional(),
});
const DealUpdate = DealCreate.partial();

crmRouter.get("/deals", async (_req, res, next) => {
  try {
    const items = await DealModel.find()
      .populate("accountId", "namn bransch")
      .sort({ skapad: -1 })
      .limit(200)
      .lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

crmRouter.post("/deals", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const body = DealCreate.parse(req.body);
    const dealKey = `d_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const agareEmployeeId = body.agareEmployeeId || req.user?.employeeId || req.user!.id;
    const created = await DealModel.create({ ...body, agareEmployeeId, dealKey, forvantatAvslut: new Date(body.forvantatAvslut) });
    await loggaEvent({ typ: "DEAL_SKAPAD", entitet: "deal", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

crmRouter.patch("/deals/:id", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const id = req.params.id;
    const body = DealUpdate.parse(req.body);
    
    const updateData: any = { ...body };
    if (body.forvantatAvslut) {
      updateData.forvantatAvslut = new Date(body.forvantatAvslut);
    }

    const updated = await DealModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    if (!updated) throw new HttpError(404, "Affär hittades inte.");

    await loggaEvent({ typ: "DEAL_ANDRAD", entitet: "deal", entitetId: String(id), actorUserId: req.user!.id, payload: body });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

const DealStagePatch = z.object({
  fas: z.enum(["PROSPEKT", "MOTE", "OFFERT", "VUNNEN", "FORLORAD"]),
  sannolikhet: z.number().min(0).max(100).optional(),
});

crmRouter.patch("/deals/:id/stage", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const id = req.params.id;
    const patch = DealStagePatch.parse(req.body);

    // If fas is VUNNEN, automatically set sannolikhet to 100
    const updateData: any = { fas: patch.fas };
    if (patch.fas === "VUNNEN") {
      updateData.sannolikhet = 100;
    } else if (patch.sannolikhet !== undefined) {
      updateData.sannolikhet = patch.sannolikhet;
    }

    const updated = await DealModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updated) throw new HttpError(404, "Affär hittades inte.");

    await loggaEvent({ typ: "DEAL_FAS_ANDRAD", entitet: "deal", entitetId: String(id), actorUserId: req.user!.id, payload: patch });
    // When Deal becomes VUNNEN, auto-create Project and Assignment
    if (patch.fas === "VUNNEN") {
      // Create Project with status BEKRÄFTAD
      const project = await ProjectModel.create({
        dealId: updated._id,
        accountId: updated.accountId,
        start: new Date(),
        status: "BEKRÄFTAD",
      });

      await loggaEvent({ typ: "PROJECT_SKAPAD", entitet: "project", entitetId: String(project._id), actorUserId: req.user!.id, payload: { fromDeal: id } });

      // Create Assignment with status NY (no employee assigned yet)
      const tillDate = updated.forvantatAvslut ? new Date(updated.forvantatAvslut) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      const assignment = await AssignmentModel.create({
        projectId: project._id,
        belaggningPct: 100,
        fran: new Date(),
        till: tillDate,
        status: "NY",
        resursbehov: "Consultant needed",
      });

      await loggaEvent({ typ: "ASSIGNMENT_SKAPAD", entitet: "assignment", entitetId: String(assignment._id), actorUserId: req.user!.id, payload: { fromProject: String(project._id) } });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DEPRECATED: Move won deal to ERP (create Invoice)
// NOTE: Invoices should now be created from Projects, not directly from Deals
// This endpoint is kept for backwards compatibility but should create a project first
const DealToInvoice = z.object({
  beloppSEK: z.number().nonnegative(),
  forfallodatum: z.string().datetime(),
});

crmRouter.post("/deals/:id/to-invoice", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const id = req.params.id;
    const body = DealToInvoice.parse(req.body);

    // Verify deal exists and is VUNNEN
    const deal = await DealModel.findById(id);
    if (!deal) throw new HttpError(404, "Affär hittades inte.");
    if (deal.fas !== "VUNNEN") throw new HttpError(400, "Affären måste ha status VUNNEN för att skapa faktura.");

    // TODO: This should create a Project first, then create Invoice for that Project
    // For now, return error message suggesting proper workflow
    throw new HttpError(400, "Skapa först ett projekt från denna affär, sedan skapa faktura för projektet.");
  } catch (err) {
    next(err);
  }
});
