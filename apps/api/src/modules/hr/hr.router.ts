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
  namn: z.string().min(2),
  epost: z.string().email(),
  roll: z.enum(["KONSULT", "SALJ", "HR", "TEKNIKCHEF", "VD"]),
  kompetenser: z.array(z.string().min(2)).default([]),
  startdatum: z.string().datetime(),
  status: z.enum(["AKTIV", "ONBOARDING", "OFFBOARDING", "UPPSAGD"]).optional(),
});

hrRouter.post("/employees", requireRole("ADMIN", "CHEF"), async (req: AuthedRequest, res, next) => {
  try {
    const body = EmployeeCreate.parse(req.body);
    const created = await EmployeeModel.create({ ...body, startdatum: new Date(body.startdatum) });
    await loggaEvent({ typ: "EMPLOYEE_SKAPAD", entitet: "employee", entitetId: String(created._id), actorUserId: req.user!.id, payload: body });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

const EmployeeStatusPatch = z.object({
  status: z.enum(["AKTIV", "ONBOARDING", "OFFBOARDING", "UPPSAGD"]),
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
