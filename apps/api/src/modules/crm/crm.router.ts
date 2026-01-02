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

export const crmRouter = Router();

// Alla CRM-endpoints kräver inloggning
crmRouter.use(requireAuth);

// === Leads ===
const LeadCreate = z.object({
  namn: z.string().min(2),
  epost: z.string().email(),
  kalla: z.string().min(2),
  status: z.enum(["NY", "KONTAKTAD", "KVALIFICERAD", "AVSLUTAD"]).optional(),
});

crmRouter.get("/leads", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = q
      ? { $or: [{ namn: { $regex: q, $options: "i" } }, { epost: { $regex: q, $options: "i" } }, { kalla: { $regex: q, $options: "i" } }] }
      : {};

    const items = await LeadModel.find(filter).sort({ skapad: -1 }).limit(200).lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

crmRouter.post("/leads", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const body = LeadCreate.parse(req.body);
    const created = await LeadModel.create(body);
    await loggaEvent({ typ: "LEAD_SKAPAD", entitet: "lead", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// === Accounts ===
const AccountCreate = z.object({ namn: z.string().min(2), bransch: z.string().min(2) });

crmRouter.get("/accounts", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = q ? { namn: { $regex: q, $options: "i" } } : {};
    const items = await AccountModel.find(filter).sort({ skapad: -1 }).limit(200).lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

crmRouter.post("/accounts", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const body = AccountCreate.parse(req.body);
    const created = await AccountModel.create(body);
    await loggaEvent({ typ: "ACCOUNT_SKAPAD", entitet: "account", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
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
  namn: z.string().min(2),
  vardeSEK: z.number().nonnegative(),
  fas: z.enum(["PROSPEKT", "MOTE", "OFFERT", "VUNNEN", "FORLORAD"]).optional(),
  sannolikhet: z.number().min(0).max(100).optional(),
  agareEmployeeId: z.string().min(1),
  forvantatAvslut: z.string().datetime(),
});

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
    const created = await DealModel.create({ ...body, forvantatAvslut: new Date(body.forvantatAvslut) });
    await loggaEvent({ typ: "DEAL_SKAPAD", entitet: "deal", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
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

    const updated = await DealModel.findByIdAndUpdate(
      id,
      { $set: { fas: patch.fas, ...(patch.sannolikhet !== undefined ? { sannolikhet: patch.sannolikhet } : {}) } },
      { new: true }
    ).lean();

    if (!updated) throw new HttpError(404, "Affär hittades inte.");

    await loggaEvent({ typ: "DEAL_FAS_ANDRAD", entitet: "deal", entitetId: String(id), actorUserId: req.user!.id, payload: patch });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Move won deal to ERP (create Invoice)
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

    // Create invoice in ERP
    const invoice = await InvoiceModel.create({
      dealId: id,
      beloppSEK: body.beloppSEK,
      forfallodatum: new Date(body.forfallodatum),
      status: "UTKAST",
    });

    await loggaEvent({
      typ: "DEAL_TILL_FAKTURA",
      entitet: "deal",
      entitetId: String(id),
      actorUserId: req.user!.id,
      payload: { invoiceId: String(invoice._id), beloppSEK: body.beloppSEK },
    });

    res.status(201).json({ invoice, deal });
  } catch (err) {
    next(err);
  }
});
