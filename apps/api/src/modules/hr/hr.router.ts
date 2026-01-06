import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, AuthedRequest } from "../auth/auth.middleware.js";
import { EmployeeModel } from "./employee.model.js";
import { loggaEvent } from "../data/data.service.js";

export const hrRouter = Router();

hrRouter.use(requireAuth);

hrRouter.get("/employees", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = q ? { namn: { $regex: q, $options: "i" } } : {};
    const items = await EmployeeModel.find(filter).sort({ skapad: -1 }).limit(200).lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

const EmployeeCreate = z.object({
  namn: z.string().min(2, "Employee name must be at least 2 characters.").regex(/^[a-zA-ZåäöÅÄÖ ]+$/, "Employee name can only contain letters and spaces."),
  epost: z.string().email(),
  roll: z.enum(["KONSULT", "SALJ", "HR", "TEKNIKCHEF", "VD"]),
  kompetenser: z.array(z.string().min(2)).default([]),
  startdatum: z.string().datetime(),
  status: z.enum(["AKTIV", "ONBOARDING", "OFFBOARDING", "UPPSAGD", "INAKTIV"]).optional(),
});

hrRouter.post("/employees", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const body = EmployeeCreate.parse(req.body);
    
    // Check if employee with same name already exists
    const existing = await EmployeeModel.findOne({ namn: body.namn });
    if (existing) {
      const { HttpError } = await import("../../server/httpError.js");
      throw new HttpError(400, "En anst\u00e4lld med samma namn finns redan.");
    }
    
    const employeeKey = `e_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const created = await EmployeeModel.create({ ...body, employeeKey, startdatum: new Date(body.startdatum) });
    await loggaEvent({ typ: "EMPLOYEE_SKAPAD", entitet: "employee", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

const EmployeeUpdate = z.object({
  namn: z.string().min(2).optional(),
  epost: z.string().email().optional(),
  roll: z.enum(["KONSULT", "SALJ", "HR", "TEKNIKCHEF", "VD"]).optional(),
  kompetenser: z.array(z.string().min(2)).optional(),
  startdatum: z.string().datetime().optional(),
  status: z.enum(["AKTIV", "ONBOARDING", "OFFBOARDING", "UPPSAGD", "INAKTIV"]).optional(),
});

hrRouter.patch("/employees/:id", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const id = req.params.id;
    const body = EmployeeUpdate.parse(req.body);
    
    // Check if updating to a name that already exists (excluding current employee)
    if (body.namn) {
      const existing = await EmployeeModel.findOne({ namn: body.namn, _id: { $ne: id } });
      if (existing) {
        const { HttpError } = await import("../../server/httpError.js");
        throw new HttpError(400, "En anst\u00e4lld med samma namn finns redan.");
      }
    }
    
    const updateData: any = { ...body };
    if (body.startdatum) {
      updateData.startdatum = new Date(body.startdatum);
    }

    const updated = await EmployeeModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updated) {
      const { HttpError } = await import("../../server/httpError.js");
      throw new HttpError(404, "Anställd hittades inte.");
    }

    await loggaEvent({
      typ: "EMPLOYEE_ANDRAD",
      entitet: "employee",
      entitetId: String(id),
      actorUserId: req.user!.id,
      payload: body,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

const EmployeeStatusPatch = z.object({
  status: z.enum(["AKTIV", "ONBOARDING", "OFFBOARDING", "UPPSAGD", "INAKTIV"]),
});

hrRouter.patch("/employees/:id/status", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const id = req.params.id;
    const patch = EmployeeStatusPatch.parse(req.body);

    const updated = await EmployeeModel.findByIdAndUpdate(
      id,
      { $set: { status: patch.status } },
      { new: true }
    ).lean();

    if (!updated) {
      const { HttpError } = await import("../../server/httpError.js");
      throw new HttpError(404, "Anställd hittades inte.");
    }

    await loggaEvent({
      typ: "EMPLOYEE_STATUS_ANDRAD",
      entitet: "employee",
      entitetId: String(id),
      actorUserId: req.user!.id,
      payload: patch,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});
