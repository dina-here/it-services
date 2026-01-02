import { EventModel } from "./event.model.js";

/**
 * Skriv en händelse till datalagret.
 * Poängen är att visa en "liten dataplattform" i POC:en.
 */
export async function loggaEvent(input: {
  typ: string;
  entitet: string;
  entitetId: string;
  actorUserId?: string;
  payload?: Record<string, unknown>;
}) {
  await EventModel.create({
    typ: input.typ,
    entitet: input.entitet,
    entitetId: input.entitetId,
    actorUserId: input.actorUserId,
    payload: input.payload ?? {},
  });
}

/**
 * KPI:er med enkel aggregation.
 * - MRR-ish (summa betalda fakturor under period)
 * - Win rate (vunna deals / (vunna+förlorade))
 * - Utilization (medelbeläggning av aktiva assignments)
 */
export async function hamtaKpis(deps: {
  InvoiceModel: any;
  DealModel: any;
  AssignmentModel: any;
}, from: Date, to: Date) {
  const betalda = await deps.InvoiceModel.aggregate([
    { $match: { status: "BETALD", skapad: { $gte: from, $lte: to } } },
    { $group: { _id: null, total: { $sum: "$beloppSEK" } } },
  ]);

  const dealsAgg = await deps.DealModel.aggregate([
    { $match: { skapad: { $gte: from, $lte: to } } },
    { $group: { _id: "$fas", count: { $sum: 1 } } },
  ]);

  const vunna = dealsAgg.find((d: any) => d._id === "VUNNEN")?.count ?? 0;
  const forl = dealsAgg.find((d: any) => d._id === "FORLORAD")?.count ?? 0;
  const winRate = (vunna + forl) === 0 ? 0 : Math.round((vunna / (vunna + forl)) * 100);

  const assAgg = await deps.AssignmentModel.aggregate([
    { $match: { skapad: { $gte: from, $lte: to } } },
    { $group: { _id: null, avg: { $avg: "$belaggningPct" } } },
  ]);

  return {
    intakterSEK: betalda[0]?.total ?? 0,
    winRatePct: winRate,
    belaggningAvgPct: Math.round(assAgg[0]?.avg ?? 0),
  };
}
