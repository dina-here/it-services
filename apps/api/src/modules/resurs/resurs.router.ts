import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth, requireRole, AuthedRequest } from "../auth/auth.middleware.js";
import { ProjectModel } from "./project.model.js";
import { AssignmentModel } from "./assignment.model.js";
import { loggaEvent } from "../data/data.service.js";
import { InvoiceModel } from "../erp/invoice.model.js";
import { HttpError } from "../../server/httpError.js";
import { EmployeeModel } from "../hr/employee.model.js";

export const resursRouter = Router();

resursRouter.use(requireAuth);

function resolveLang(headerLang?: string): "en" | "sv" {
  const raw = (headerLang || "").toLowerCase();
  if (raw.startsWith("en")) return "en";
  return "sv";
}

async function ensureCapacity(employeeId: string, requestedPct: number, excludeAssignmentId?: string, headerLang?: string) {
  let employeeObjectId: mongoose.Types.ObjectId;
  try {
    employeeObjectId = new mongoose.Types.ObjectId(employeeId);
  } catch (err) {
    throw new HttpError(400, "Ogiltigt konsult-id", { employeeId });
  }

  const employee = await EmployeeModel.findById(employeeObjectId).select("namn");
  if (!employee) {
    throw new HttpError(404, "Konsult inte funnen", { employeeId });
  }

  const match: any = { employeeId: employeeObjectId, status: { $ne: "SLUTFÖRD" } };
  if (excludeAssignmentId) {
    try {
      match._id = { $ne: new mongoose.Types.ObjectId(excludeAssignmentId) };
    } catch (err) {
      // ignore invalid exclude id; validation will still work without it
    }
  }

  const agg = await AssignmentModel.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$belaggningPct" } } },
  ]);

  const currentTotal = agg?.[0]?.total || 0;
  const remaining = Math.max(0, 100 - currentTotal);

  if (requestedPct > remaining) {
    const lang = resolveLang(headerLang);
    const msg = lang === "en"
      ? `${employee.namn} only has ${remaining}% left to allocate.`
      : `${employee.namn} har bara ${remaining}% kvar att fördela.`;
    throw new HttpError(400, msg, {
      employeeId,
      remainingPct: remaining,
      code: "CONSULTANT_OVERBOOKED",
      lang,
    });
  }
}

// Projekt
resursRouter.get("/projects", async (req, res, next) => {
  try {
    const accountId = String(req.query.accountId || "").trim();
    const filter = accountId ? { accountId } : {};
    const items = await ProjectModel.find(filter)
      .populate("accountId", "namn bransch")
      .populate("dealId", "namn")
      .sort({ skapad: -1 })
      .limit(200)
      .lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

const ProjectCreate = z.object({
  accountId: z.string().min(1),
  namn: z.string().min(2),
  start: z.string().datetime(),
  slut: z.string().datetime().optional(),
});

resursRouter.post("/projects", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const body = ProjectCreate.parse(req.body);
    const projectKey = `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const created = await ProjectModel.create({
      ...body,
      projectKey,
      start: new Date(body.start),
      ...(body.slut ? { slut: new Date(body.slut) } : {}),
    });

    await loggaEvent({ typ: "PROJECT_SKAPAD", entitet: "project", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Assignments
resursRouter.get("/assignments", async (req, res, next) => {
  try {
    const projectId = String(req.query.projectId || "").trim();
    const employeeId = String(req.query.employeeId || "").trim();

    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (employeeId) filter.employeeId = employeeId;

    const items = await AssignmentModel.find(filter)
      .populate("employeeId", "namn epost roll status")
      .populate({
        path: "projectId",
        select: "namn start slut accountId dealId",
        populate: [
          { path: "accountId", select: "namn bransch" },
          { path: "dealId", select: "namn forvantatAvslut" }
        ]
      })
      .sort({ skapad: -1 })
      .limit(200)
      .lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

const AssignmentCreate = z.object({
  employeeId: z.string().min(1),
  projectId: z.string().min(1),
  belaggningPct: z.number().min(0).max(100),
  fran: z.string().datetime(),
  till: z.string().datetime(),
});

resursRouter.post("/assignments", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const body = AssignmentCreate.parse(req.body);
    await ensureCapacity(body.employeeId, body.belaggningPct, undefined, req.headers["accept-language"] as string);
    const created = await AssignmentModel.create({
      ...body,
      fran: new Date(body.fran),
      till: new Date(body.till),
    });

    await loggaEvent({ typ: "ASSIGNMENT_SKAPAD", entitet: "assignment", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

const ProjectStatusUpdate = z.object({
  status: z.enum(["BEKRÄFTAD", "PLANERING", "BEMANNING", "SLUTFÖRD"]),
});

resursRouter.patch("/projects/:id/status", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const { id } = req.params;
    const body = ProjectStatusUpdate.parse(req.body);
    
    const updated = await ProjectModel.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Projekt inte funnet" });
    }

    await loggaEvent({ typ: "PROJECT_STATUS_ANDRAD", entitet: "project", entitetId: id, actorUserId: req.user!.id, payload: { status: body.status } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

const AssignmentUpdate = z.object({
  resursbehov: z.string().optional(),
  employeeId: z.string().optional(),
  belaggningPct: z.number().min(0).max(100).optional(),
  fran: z.string().datetime().optional(),
  till: z.string().datetime().optional(),
});

const AssignmentStatusUpdate = z.object({
  status: z.enum(["NY", "BEMANNAD", "SLUTFÖRD"]),
});

resursRouter.patch("/assignments/:id", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const { id } = req.params;
    const body = AssignmentUpdate.parse(req.body);

    const assignment = await AssignmentModel.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: "Beläggning inte funnen" });
    }

    const targetEmployeeId = (body.employeeId || assignment.employeeId)?.toString();
    const targetLoad = body.belaggningPct ?? assignment.belaggningPct;
    if (targetEmployeeId && typeof targetLoad === "number") {
      await ensureCapacity(targetEmployeeId, targetLoad, assignment._id.toString(), req.headers["accept-language"] as string);
    }

    // If employee is being assigned, auto-change status to BEMANNAD and create Invoice
    if (body.employeeId && assignment.status === "NY") {
      assignment.employeeId = body.employeeId as any;
      assignment.status = "BEMANNAD";
      if (body.resursbehov !== undefined) assignment.resursbehov = body.resursbehov;
      if (body.belaggningPct !== undefined) assignment.belaggningPct = body.belaggningPct;
      if (body.fran) assignment.fran = new Date(body.fran);
      if (body.till) assignment.till = new Date(body.till);
      await assignment.save();

      await loggaEvent({ typ: "ASSIGNMENT_EMPLOYEE_ASSIGNED", entitet: "assignment", entitetId: id, actorUserId: req.user!.id, payload: body });

      const project = await ProjectModel.findById(assignment.projectId).populate("dealId", "vardeSEK namn");
      if (project) {
        const dealValue = typeof project.dealId === "object" && project.dealId !== null && "vardeSEK" in project.dealId ? (project.dealId as any).vardeSEK : undefined;
        const beloppSEK = typeof dealValue === "number" ? dealValue : 0;
        const existingInvoice = await InvoiceModel.findOne({ projectId: project._id });
        if (!existingInvoice) {
          const invoice = await InvoiceModel.create({
            projectId: project._id,
            beloppSEK,
            status: "UTKAST",
            forfallodatum: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });

          await loggaEvent({ typ: "INVOICE_SKAPAD", entitet: "invoice", entitetId: String(invoice._id), actorUserId: req.user!.id, payload: { fromAssignment: id } });
        }
      }
    } else {
      if (body.resursbehov !== undefined) assignment.resursbehov = body.resursbehov;
      if (body.employeeId !== undefined) assignment.employeeId = body.employeeId as any;
      if (body.belaggningPct !== undefined) assignment.belaggningPct = body.belaggningPct;
      if (body.fran) assignment.fran = new Date(body.fran);
      if (body.till) assignment.till = new Date(body.till);
      await assignment.save();

      await loggaEvent({ typ: "ASSIGNMENT_UPPDATERAD", entitet: "assignment", entitetId: id, actorUserId: req.user!.id, payload: body });
    }

    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

resursRouter.patch("/assignments/:id/status", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const { id } = req.params;
    const body = AssignmentStatusUpdate.parse(req.body);

    const assignment = await AssignmentModel.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ error: "Beläggning inte funnen" });
    }

    await loggaEvent({ typ: "ASSIGNMENT_STATUS_ANDRAD", entitet: "assignment", entitetId: id, actorUserId: req.user!.id, payload: { status: body.status } });

    // If assignment is marked as SLUTFÖRD, ensure an invoice exists then move UTKAST to SKICKAD
    if (body.status === "SLUTFÖRD") {
      const project = await ProjectModel.findById(assignment.projectId).populate("dealId", "vardeSEK namn");
      if (project) {
        let invoice = await InvoiceModel.findOne({ projectId: project._id });

        // If no invoice exists (common in seeded data), create a draft one from deal value
        if (!invoice) {
          const dealValue = typeof project.dealId === "object" && project.dealId !== null && "vardeSEK" in project.dealId ? (project.dealId as any).vardeSEK : undefined;
          const beloppSEK = typeof dealValue === "number" ? dealValue : 0;

          invoice = await InvoiceModel.create({
            projectId: project._id,
            beloppSEK,
            status: "UTKAST",
            forfallodatum: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });

          await loggaEvent({ typ: "INVOICE_SKAPAD", entitet: "invoice", entitetId: String(invoice._id), actorUserId: req.user!.id, payload: { fromAssignment: id } });
        }

        if (invoice.status === "UTKAST") {
          invoice.status = "SKICKAD";
          await invoice.save();

          await loggaEvent({ typ: "INVOICE_STATUS_ANDRAD", entitet: "invoice", entitetId: String(invoice._id), actorUserId: req.user!.id, payload: { status: "SKICKAD", fromAssignment: id } });
        }
      }
    }

    res.json(assignment);
  } catch (err) {
    next(err);
  }
});
