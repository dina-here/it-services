// Delade typer och valideringsscheman (Zod) mellan API och Web.

import { z } from "zod";

// Roller (RBAC)
export const RollSchema = z.enum(["ADMIN", "CHEF", "MEDARBETARE"]);
export type Roll = z.infer<typeof RollSchema>;

// Allmän pagination
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

// === CRM ===
export const LeadSchema = z.object({
  _id: z.string().optional(),
  namn: z.string().min(2),
  epost: z.string().email(),
  kalla: z.string().min(2),
  status: z.enum(["NY", "KONTAKTAD", "KVALIFICERAD", "AVSLUTAD"]).default("NY"),
  skapad: z.string().datetime().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const AccountSchema = z.object({
  _id: z.string().optional(),
  namn: z.string().min(2),
  bransch: z.string().min(2),
  skapad: z.string().datetime().optional(),
});
export type Account = z.infer<typeof AccountSchema>;

export const ContactSchema = z.object({
  _id: z.string().optional(),
  accountId: z.string(),
  namn: z.string().min(2),
  epost: z.string().email(),
  titel: z.string().min(2),
  skapad: z.string().datetime().optional(),
});
export type Contact = z.infer<typeof ContactSchema>;

export const DealSchema = z.object({
  _id: z.string().optional(),
  accountId: z.string(),
  namn: z.string().min(2),
  vardeSEK: z.number().nonnegative(),
  fas: z.enum(["PROSPEKT", "MOTE", "OFFERT", "VUNNEN", "FORLORAD"]).default("PROSPEKT"),
  sannolikhet: z.number().min(0).max(100).default(20),
  agareEmployeeId: z.string(),
  forvantatAvslut: z.string().datetime(),
  skapad: z.string().datetime().optional(),
});
export type Deal = z.infer<typeof DealSchema>;

// === ERP (mini) ===
export const InvoiceSchema = z.object({
  _id: z.string().optional(),
  dealId: z.string(),
  beloppSEK: z.number().nonnegative(),
  status: z.enum(["UTKAST", "SKICKAD", "BETALD"]).default("UTKAST"),
  forfallodatum: z.string().datetime(),
  skapad: z.string().datetime().optional(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

// === HR ===
export const EmployeeSchema = z.object({
  _id: z.string().optional(),
  namn: z.string().min(2),
  epost: z.string().email(),
  roll: z.enum(["KONSULT", "SALJ", "HR", "TEKNIKCHEF", "VD"]),
  kompetenser: z.array(z.string().min(2)).default([]),
  startdatum: z.string().datetime(),
  status: z.enum(["AKTIV", "ONBOARDING", "OFFBOARDING"]).default("AKTIV"),
  skapad: z.string().datetime().optional(),
});
export type Employee = z.infer<typeof EmployeeSchema>;

// === Resurs ===
export const ProjectSchema = z.object({
  _id: z.string().optional(),
  accountId: z.string(),
  namn: z.string().min(2),
  start: z.string().datetime(),
  slut: z.string().datetime().optional(),
  skapad: z.string().datetime().optional(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const AssignmentSchema = z.object({
  _id: z.string().optional(),
  employeeId: z.string(),
  projectId: z.string(),
  belaggningPct: z.number().min(0).max(100),
  fran: z.string().datetime(),
  till: z.string().datetime(),
  skapad: z.string().datetime().optional(),
});
export type Assignment = z.infer<typeof AssignmentSchema>;

// === Data ===
export const EventSchema = z.object({
  _id: z.string().optional(),
  typ: z.string().min(2),
  entitet: z.string().min(2),
  entitetId: z.string().min(2),
  actorUserId: z.string().optional(),
  payload: z.record(z.any()).default({}),
  skapad: z.string().datetime().optional(),
});
export type EventLogg = z.infer<typeof EventSchema>;
