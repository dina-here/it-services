import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { LeadModel } from "../modules/crm/lead.model.js";
import { AccountModel } from "../modules/crm/account.model.js";
import { ContactModel } from "../modules/crm/contact.model.js";
import { DealModel } from "../modules/crm/deal.model.js";
import { InvoiceModel } from "../modules/erp/invoice.model.js";
import { EmployeeModel } from "../modules/hr/employee.model.js";
import { ProjectModel } from "../modules/resurs/project.model.js";
import { AssignmentModel } from "../modules/resurs/assignment.model.js";
import { EventModel } from "../modules/data/event.model.js";
import { UserModel } from "../modules/auth/user.model.js";

import { connectDb } from "../server/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Seedar databasen med realistisk demo-data (svenska namn, företag, tjänster).
 * Varje kollektion har en egen JSON-fil i src/seed/data.
 *
 * OBS: Seed tömmer kollektionerna för att ge en ren demo varje gång.
 */
export async function seedAll() {
  console.log("Startar seed...");

  // Koppla upp databasen innan vi använder modellerna
  await connectDb();
  await mongoose.connection.asPromise();

  const dataDir = path.join(__dirname, "data");

  // 1) Läs JSON-filer
  const [
    employeesRaw,
    usersRaw,
    leadsRaw,
    accountsRaw,
    contactsRaw,
    dealsRaw,
    invoicesRaw,
    projectsRaw,
    assignmentsRaw,
    eventsRaw,
  ] = await Promise.all([
    readJson(dataDir, "employees.json"),
    readJson(dataDir, "users.json"),
    readJson(dataDir, "leads.json"),
    readJson(dataDir, "accounts.json"),
    readJson(dataDir, "contacts.json"),
    readJson(dataDir, "deals.json"),
    readJson(dataDir, "invoices.json"),
    readJson(dataDir, "projects.json"),
    readJson(dataDir, "assignments.json"),
    readJson(dataDir, "events.json"),
  ]);

  // 2) Rensa i "rätt" ordning
  await Promise.all([
    EventModel.deleteMany({}),
    AssignmentModel.deleteMany({}),
    ProjectModel.deleteMany({}),
    InvoiceModel.deleteMany({}),
    DealModel.deleteMany({}),
    ContactModel.deleteMany({}),
    AccountModel.deleteMany({}),
    LeadModel.deleteMany({}),
    UserModel.deleteMany({}),
    EmployeeModel.deleteMany({}),
  ]);

  // 3) Skapa Employees först (för att kunna koppla owners/assignments)
  const employees = await EmployeeModel.insertMany(
    employeesRaw.map((e: any) => ({
      ...e,
      epost: e.epost.toLowerCase(),
      startdatum: new Date(e.startdatum),
    }))
  );

  // Map för att kunna referera via "nyckel" i JSON (t.ex. employeeKey)
  const employeeByKey = new Map<string, string>();
  for (const e of employees as any[]) employeeByKey.set(e.employeeKey, String(e._id));

  // 4) Skapa Users (lösen hashad), koppla till employeeId vid behov
  const users = await UserModel.insertMany(
    await Promise.all(
      usersRaw.map(async (u: any) => ({
        epost: u.epost.toLowerCase(),
        losenHash: await bcrypt.hash(u.losen, 10),
        roll: u.roll,
        employeeId: u.employeeKey ? employeeByKey.get(u.employeeKey) : undefined,
      }))
    )
  );

  const userByKey = new Map<string, string>();
  for (const u of users as any[]) userByKey.set(u.userKey, String(u._id));

  // 5) CRM: leads, accounts, contacts, deals
  const accounts = await AccountModel.insertMany(accountsRaw);

  const accountByKey = new Map<string, string>();
  for (const a of accounts as any[]) accountByKey.set(a.accountKey, String(a._id));

  const leads = await LeadModel.insertMany(
    leadsRaw.map((l: any) => ({ ...l, accountId: l._accountKey ? accountByKey.get(l._accountKey) : undefined }))
  );

  const contacts = await ContactModel.insertMany(
    contactsRaw.map((c: any) => ({ ...c, accountId: accountByKey.get(c.accountKey) }))
  );

  const deals = await DealModel.insertMany(
    dealsRaw.map((d: any) => ({
      ...d,
      accountId: accountByKey.get(d.accountKey),
      agareEmployeeId: employeeByKey.get(d.agareEmployeeKey),
      forvantatAvslut: new Date(d.forvantatAvslut),
    }))
  );

  const dealByKey = new Map<string, string>();
  const dealById = new Map<string, any>();
  for (const d of deals as any[]) dealByKey.set(d.dealKey, String(d._id));
  for (const d of deals as any[]) dealById.set(String(d._id), d);

  // 6) Resurs: projects (kopplade till deals)
  const projects = await ProjectModel.insertMany(
    projectsRaw.map((p: any) => ({
      ...p,
      dealId: p.dealKey ? dealByKey.get(p.dealKey) : undefined,
      accountId: accountByKey.get(p.accountKey),
      start: new Date(p.start),
      ...(p.slut ? { slut: new Date(p.slut) } : {}),
    }))
  );

  const projectByKey = new Map<string, string>();
  for (const p of projects as any[]) projectByKey.set(p.projectKey, String(p._id));

  // 7) ERP: invoices (kopplade till projects)
  const invoices = await InvoiceModel.insertMany(
    invoicesRaw.map((inv: any) => ({
      ...inv,
      projectId: projectByKey.get(inv.projectKey),
      forfallodatum: new Date(inv.forfallodatum),
    }))
  );

  // Ensure every project has at least one invoice (helps seeded assignments complete properly)
  const projectIdsWithInvoice = new Set<string>((invoices as any[]).map((inv) => String(inv.projectId)));
  for (const project of projects as any[]) {
    const pid = String(project._id);
    if (projectIdsWithInvoice.has(pid)) continue;

    const dealForProject = project.dealId ? dealById.get(String(project.dealId)) : null;
    const beloppSEK = typeof dealForProject?.vardeSEK === "number" ? dealForProject.vardeSEK : 0;

    const inv = await InvoiceModel.create({
      projectId: project._id,
      beloppSEK,
      status: "UTKAST",
      forfallodatum: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    projectIdsWithInvoice.add(pid);

    await EventModel.create({
      typ: "INVOICE_SKAPAD",
      entitet: "invoice",
      entitetId: String(inv._id),
      payload: { fromSeed: true, projectId: pid },
    });
  }

  // 8) Resurs: assignments
  const assignments = await AssignmentModel.insertMany(
    assignmentsRaw.map((a: any) => ({
      ...a,
      employeeId: employeeByKey.get(a.employeeKey),
      projectId: projectByKey.get(a.projectKey),
      fran: new Date(a.fran),
      till: new Date(a.till),
    }))
  );

  // 8) Events (valfritt extra, visar hur dataplattformen kan se ut)
  await EventModel.insertMany(
    eventsRaw.map((ev: any) => ({
      ...ev,
      actorUserId: ev.userKey ? userByKey.get(ev.userKey) : undefined,
    }))
  );

  console.log("Seed klar:");
  console.log("- employees:", employees.length);
  console.log("- users:", users.length);
  console.log("- leads:", leads.length);
  console.log("- accounts:", accounts.length);
  console.log("- contacts:", contacts.length);
  console.log("- deals:", deals.length);
  console.log("- invoices:", invoices.length);
  console.log("- projects:", projects.length);
  console.log("- assignments:", assignments.length);
}

/** Läser JSON från fil och returnerar array/object */
async function readJson(dir: string, file: string) {
  const p = path.join(dir, file);
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw);
}
