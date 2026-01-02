import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, AuthedRequest } from "../auth/auth.middleware.js";
import { ProjectModel } from "./project.model.js";
import { AssignmentModel } from "./assignment.model.js";
import { loggaEvent } from "../data/data.service.js";

export const resursRouter = Router();

resursRouter.use(requireAuth);

// Projekt
resursRouter.get("/projects", async (req, res, next) => {
  try {
    const accountId = String(req.query.accountId || "").trim();
    const filter = accountId ? { accountId } : {};
    const items = await ProjectModel.find(filter)
      .populate("accountId", "namn bransch")
      .sort({ skapad: -1 })
      .limit(200)
      .lean();
    const itemsWithStringIds = items.map((item: any) => ({
      ...item,
      accountId: String(item.accountId?._id || item.accountId),
    }));
    res.json({ items: itemsWithStringIds });
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
    const created = await ProjectModel.create({
      ...body,
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
      .populate("projectId", "namn start slut accountId")
      .sort({ skapad: -1 })
      .limit(200)
      .lean();
    const itemsWithStringIds = items.map((item: any) => ({
      ...item,
      employeeId: String(item.employeeId?._id || item.employeeId),
      projectId: String(item.projectId?._id || item.projectId),
    }));
    res.json({ items: itemsWithStringIds });
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
