import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, AuthedRequest } from "../auth/auth.middleware.js";
import { HttpError } from "../../server/httpError.js";
import { InvoiceModel } from "./invoice.model.js";
import { loggaEvent } from "../data/data.service.js";

export const erpRouter = Router();

erpRouter.use(requireAuth);

erpRouter.get("/invoices", async (_req, res, next) => {
  try {
    const items = await InvoiceModel.find()
      .populate("dealId", "namn fas vardeSEK accountId")
      .sort({ skapad: -1 })
      .limit(200)
      .lean();
    const itemsWithStringIds = items.map((item: any) => ({
      ...item,
      dealId: String(item.dealId?._id || item.dealId),
    }));
    res.json({ items: itemsWithStringIds });
  } catch (err) {
    next(err);
  }
});

const InvoiceCreate = z.object({
  dealId: z.string().min(1),
  beloppSEK: z.number().nonnegative(),
  status: z.enum(["UTKAST", "SKICKAD", "BETALD"]).optional(),
  forfallodatum: z.string().datetime(),
});

erpRouter.post("/invoices", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const body = InvoiceCreate.parse(req.body);
    const created = await InvoiceModel.create({ ...body, forfallodatum: new Date(body.forfallodatum) });
    await loggaEvent({ typ: "INVOICE_SKAPAD", entitet: "invoice", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

erpRouter.post("/invoices/:id/pay", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const id = req.params.id;
    const updated = await InvoiceModel.findByIdAndUpdate(id, { $set: { status: "BETALD" } }, { new: true }).lean();
    if (!updated) throw new HttpError(404, "Faktura hittades inte.");

    await loggaEvent({ typ: "INVOICE_BETALD", entitet: "invoice", entitetId: id, actorUserId: req.user!.id, payload: { status: "BETALD" } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

const InvoiceStatusPatch = z.object({
  status: z.enum(["UTKAST", "SKICKAD", "BETALD"]),
});

erpRouter.patch("/invoices/:id/status", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const id = req.params.id;
    const patch = InvoiceStatusPatch.parse(req.body);

    const updated = await InvoiceModel.findByIdAndUpdate(
      id,
      { $set: { status: patch.status } },
      { new: true }
    ).lean();

    if (!updated) throw new HttpError(404, "Faktura hittades inte.");

    await loggaEvent({
      typ: "INVOICE_STATUS_ANDRAD",
      entitet: "invoice",
      entitetId: id,
      actorUserId: req.user!.id,
      payload: patch,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});
