import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { EventModel } from "./event.model.js";
import { hamtaKpis } from "./data.service.js";
import { InvoiceModel } from "../erp/invoice.model.js";
import { DealModel } from "../crm/deal.model.js";
import { AssignmentModel } from "../resurs/assignment.model.js";
import {
  getDashboardKPIs,
  getConsultantUtilization,
  getRevenueByCustomer,
  getRevenueByConsultant,
} from "./dashboard.service.js";

export const dataRouter = Router();

dataRouter.get("/events", requireAuth, async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Math.min(Number(req.query.pageSize || 20), 100);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      EventModel.find().sort({ skapad: -1 }).skip(skip).limit(pageSize).lean(),
      EventModel.countDocuments(),
    ]);

    res.json({ items, page, pageSize, total });
  } catch (err) {
    next(err);
  }
});

const KpiQuery = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

dataRouter.get("/kpis", requireAuth, async (req, res, next) => {
  try {
    const q = KpiQuery.parse(req.query);
    const from = new Date(q.from);
    const to = new Date(q.to);

    const kpis = await hamtaKpis({ InvoiceModel, DealModel, AssignmentModel }, from, to);
    res.json(kpis);
  } catch (err) {
    next(err);
  }
});

// Dashboard endpoints
dataRouter.get("/dashboard/overview", requireAuth, async (_req, res, next) => {
  try {
    const data = await getDashboardKPIs();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

dataRouter.get("/dashboard/consultant-utilization", requireAuth, async (_req, res, next) => {
  try {
    const data = await getConsultantUtilization();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

dataRouter.get("/dashboard/revenue-by-customer", requireAuth, async (_req, res, next) => {
  try {
    const data = await getRevenueByCustomer();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

dataRouter.get("/dashboard/revenue-by-consultant", requireAuth, async (_req, res, next) => {
  try {
    const data = await getRevenueByConsultant();
    res.json(data);
  } catch (err) {
    next(err);
  }
});
