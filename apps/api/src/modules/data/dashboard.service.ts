import mongoose from "mongoose";
import { DealModel } from "../crm/deal.model.js";
import { InvoiceModel } from "../erp/invoice.model.js";
import { AssignmentModel } from "../resurs/assignment.model.js";
import { EmployeeModel } from "../hr/employee.model.js";
import { ProjectModel } from "../resurs/project.model.js";

/**
 * Dashboard KPIs och aggregerade data
 */

export async function getDashboardKPIs() {
  // Deals overview
  const dealsByFas = await DealModel.aggregate([
    { $group: { _id: "$fas", count: { $sum: 1 }, totalVarde: { $sum: "$vardeSEK" } } },
  ]);

  // Invoices overview
  const invoicesByStatus = await InvoiceModel.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 }, totalBelopp: { $sum: "$beloppSEK" } } },
  ]);

  // Total revenue (paid invoices)
  const totalRevenue = invoicesByStatus.find((x: any) => x._id === "BETALD")?.totalBelopp || 0;

  // Employee status
  const employeesByStatus = await EmployeeModel.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const activeEmployees = employeesByStatus.find((x: any) => x._id === "AKTIV")?.count || 0;

  return {
    deals: dealsByFas,
    invoices: invoicesByStatus,
    employees: employeesByStatus,
    kpis: {
      totalRevenue,
      activeEmployees,
      totalDeals: dealsByFas.reduce((sum: number, x: any) => sum + x.count, 0),
      totalInvoices: invoicesByStatus.reduce((sum: number, x: any) => sum + x.count, 0),
    },
  };
}

export async function getConsultantUtilization() {
  const now = new Date();

  // Get all active consultants and tech leads
  const consultants = await EmployeeModel.find({ roll: { $in: ["KONSULT", "TEKNIKCHEF"] }, status: "AKTIV" }).lean();

  const utilizationData = await Promise.all(
    consultants.map(async (consultant: any) => {
      // Get ongoing or upcoming assignments (until date in future, ignore start date so planned work is visible as soon as it is scheduled)
      const assignments = await AssignmentModel.find({
        employeeId: consultant._id,
        till: { $gte: now },
        status: { $ne: "SLUTFÖRD" },
      })
        .populate("projectId", "namn accountId")
        .lean();

      const totalBelaggning = assignments.reduce((sum: number, a: any) => sum + a.belaggningPct, 0);

      return {
        employeeId: consultant._id,
        employeeNamn: consultant.namn,
        belaggningPct: Math.min(totalBelaggning, 100),
        assignments: assignments.length,
        projects: assignments.map((a: any) => ({
          projectId: a.projectId?._id,
          projectNamn: a.projectId?.namn,
          belaggningPct: a.belaggningPct,
          fran: a.fran,
          till: a.till,
        })),
      };
    })
  );

  return utilizationData;
}

export async function getRevenueByCustomer() {
  // Revenue per account (via deals and invoices)
  const revenueData = await InvoiceModel.aggregate([
    {
      $match: { status: "BETALD" },
    },
    {
      $lookup: {
        from: "projects",
        localField: "projectId",
        foreignField: "_id",
        as: "project",
      },
    },
    { $unwind: "$project" },
    {
      $lookup: {
        from: "deals",
        localField: "project.dealId",
        foreignField: "_id",
        as: "deal",
      },
    },
    { $unwind: { path: "$deal", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        accountId: { $ifNull: ["$deal.accountId", "$project.accountId"] },
      },
    },
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "account",
      },
    },
    { $unwind: "$account" },
    {
      $group: {
        _id: "$account._id",
        accountNamn: { $first: "$account.namn" },
        accountBransch: { $first: "$account.bransch" },
        totalRevenue: { $sum: "$beloppSEK" },
        invoiceCount: { $sum: 1 },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  return revenueData;
}

export async function getRevenueByConsultant() {
  // Revenue per consultant (based on assignments and invoices)
  // This is a simplified version - assumes revenue is distributed by assignment
  const consultants = await EmployeeModel.find({ roll: { $in: ["KONSULT", "TEKNIKCHEF"] }, status: { $nin: ["INAKTIV", "UPPSAGD"] } }).lean();

  const revenueData = await Promise.all(
    consultants.map(async (consultant: any) => {
      const assignments = await AssignmentModel.find({ employeeId: consultant._id }).populate("projectId").lean();
      if (!assignments.length) {
        return { employeeId: consultant._id, employeeNamn: consultant.namn, estimatedRevenue: 0, assignments: 0 };
      }

      const projectIds = Array.from(
        new Set(
          assignments
            .map((a: any) => {
              const p = a.projectId as any;
              return p?._id ? String(p._id) : a.projectId ? String(a.projectId) : null;
            })
            .filter((id): id is string => Boolean(id))
        )
      );

      const projectObjectIds = projectIds.map((id: string) => new mongoose.Types.ObjectId(id));

      const invoicesByProjectRaw = await InvoiceModel.aggregate([
        { $match: { projectId: { $in: projectObjectIds }, status: "BETALD" } },
        { $group: { _id: "$projectId", total: { $sum: "$beloppSEK" } } },
      ]);
      const invoicesByProject = new Map(invoicesByProjectRaw.map((x: any) => [String(x._id), x.total]));

      const totalBelaggByProjectRaw = await AssignmentModel.aggregate([
        { $match: { projectId: { $in: projectObjectIds } } },
        { $group: { _id: "$projectId", totalBelaggning: { $sum: "$belaggningPct" } } },
      ]);
      const totalBelaggByProject = new Map(totalBelaggByProjectRaw.map((x: any) => [String(x._id), x.totalBelaggning]));

      let totalContribution = 0;
      for (const projectId of projectIds) {
        const consultantBelagg = assignments
          .filter((a: any) => {
            const pid = (a.projectId as any)?._id ? String((a.projectId as any)._id) : String(a.projectId);
            return pid === projectId;
          })
          .reduce((sum: number, a: any) => sum + (a.belaggningPct || 0), 0);

        const projectRevenue = invoicesByProject.get(projectId) || 0;
        const projectTotalBelagg = totalBelaggByProject.get(projectId) || 100;

        if (projectRevenue > 0 && projectTotalBelagg > 0) {
          const weight = consultantBelagg / projectTotalBelagg;
          totalContribution += projectRevenue * weight;
        }
      }

      return {
        employeeId: consultant._id,
        employeeNamn: consultant.namn,
        estimatedRevenue: Math.round(totalContribution),
        assignments: assignments.length,
      };
    })
  );

  return revenueData.sort((a: any, b: any) => b.estimatedRevenue - a.estimatedRevenue);
}
