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

  // Get all active consultants
  const consultants = await EmployeeModel.find({ roll: "KONSULT", status: "AKTIV" }).lean();

  const utilizationData = await Promise.all(
    consultants.map(async (consultant: any) => {
      // Get current assignments
      const assignments = await AssignmentModel.find({
        employeeId: consultant._id,
        fran: { $lte: now },
        till: { $gte: now },
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
        from: "deals",
        localField: "dealId",
        foreignField: "_id",
        as: "deal",
      },
    },
    { $unwind: "$deal" },
    {
      $lookup: {
        from: "accounts",
        localField: "deal.accountId",
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
  const now = new Date();

  const consultants = await EmployeeModel.find({ roll: "KONSULT", status: "AKTIV" }).lean();

  const revenueData = await Promise.all(
    consultants.map(async (consultant: any) => {
      // Get all assignments
      const assignments = await AssignmentModel.find({
        employeeId: consultant._id,
      })
        .populate("projectId")
        .lean();

      // Get invoices for projects this consultant worked on
      const projectIds = assignments.map((a: any) => a.projectId);

      // Simplified: count consultant's contribution to project revenue
      let totalContribution = 0;
      for (const assignment of assignments) {
        const project = assignment.projectId as any;
        if (project?.accountId) {
          // Get deals for this account
          const deals = await DealModel.find({ accountId: project.accountId }).lean();
          for (const deal of deals) {
            const invoices = await InvoiceModel.find({
              dealId: deal._id,
              status: "BETALD",
            }).lean();

            // Simplified: distribute revenue by consultant's belaggning
            const dealRevenue = invoices.reduce((sum: number, inv: any) => sum + inv.beloppSEK, 0);
            totalContribution += (dealRevenue * assignment.belaggningPct) / 100;
          }
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
