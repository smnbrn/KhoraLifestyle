import type { Json } from "@/types/database.types";

// Forme dei contenuti dei blocchi (colonna jsonb). Il DB non le garantisce, quindi
// ogni lettura passa da qui: dati mancanti o malformati diventano valori sicuri.

export type ColumnType = "text" | "number" | "currency" | "date" | "checkbox";
export type CellValue = string | number | boolean | null;

export type TextContent = { text: string };
export type ChecklistItem = { id: string; text: string; done: boolean };
export type ChecklistContent = { items: ChecklistItem[] };
export type TableColumn = { id: string; name: string; type: ColumnType };
export type TableRow = { id: string; cells: Record<string, CellValue> };
export type TableContent = { title: string; columns: TableColumn[]; rows: TableRow[] };

/**
 * Gantt: una lista di attività con inizio e durata. Un'attività con `micro: true` è una micro
 * attività della macro attività che la precede (come nei progetti).
 */
export type GanttBlockItem = { id: string; name: string; start: string; days: number | null; done: boolean; micro: boolean };
export type GanttContent = { title: string; items: GanttBlockItem[] };

export const COLUMN_TYPE_LABEL: Record<ColumnType, string> = {
  text: "Testo",
  number: "Numero",
  currency: "Valuta (€)",
  date: "Data",
  checkbox: "Spunta",
};

const COLUMN_TYPES = Object.keys(COLUMN_TYPE_LABEL) as ColumnType[];

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function objectsOf(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as unknown[]).filter(isObject) : [];
}

export function newId(): string {
  return crypto.randomUUID();
}

export function asText(content: Json): TextContent {
  return { text: isObject(content) && typeof content.text === "string" ? content.text : "" };
}

export function asChecklist(content: Json): ChecklistContent {
  const items = objectsOf(isObject(content) ? content.items : []).map((i) => ({
    id: typeof i.id === "string" ? i.id : newId(),
    text: typeof i.text === "string" ? i.text : "",
    done: i.done === true,
  }));
  return { items };
}

export function asTable(content: Json): TableContent {
  const obj = isObject(content) ? content : {};
  const columns = objectsOf(obj.columns).map((c) => ({
    id: typeof c.id === "string" ? c.id : newId(),
    name: typeof c.name === "string" ? c.name : "",
    type: COLUMN_TYPES.includes(c.type as ColumnType) ? (c.type as ColumnType) : "text",
  }));
  const rows = objectsOf(obj.rows).map((r) => ({
    id: typeof r.id === "string" ? r.id : newId(),
    cells: isObject(r.cells) ? (r.cells as Record<string, CellValue>) : {},
  }));
  return { title: typeof obj.title === "string" ? obj.title : "", columns, rows };
}

/** Somma di una colonna numerica ignorando celle vuote o non numeriche. */
export function columnSum(table: TableContent, columnId: string): number {
  return table.rows.reduce((sum, row) => {
    const v = row.cells[columnId];
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : NaN;
    return Number.isFinite(n) ? sum + n : sum;
  }, 0);
}

export function asGantt(content: Json): GanttContent {
  const obj = isObject(content) ? content : {};
  const items = objectsOf(obj.items).map((i) => ({
    id: typeof i.id === "string" ? i.id : newId(),
    name: typeof i.name === "string" ? i.name : "",
    start: typeof i.start === "string" ? i.start : "",
    days: typeof i.days === "number" && Number.isFinite(i.days) && i.days >= 0 ? Math.floor(i.days) : null,
    done: i.done === true,
    micro: i.micro === true,
  }));
  // la prima riga non può essere una micro attività: non avrebbe una macro a cui appartenere
  if (items.length > 0) items[0].micro = false;
  return { title: typeof obj.title === "string" ? obj.title : "", items };
}

/** Righe del Gantt pronte per il disegno: scarta quelle senza data di inizio o senza durata. */
export function ganttRows(g: GanttContent) {
  const rows: {
    id: string;
    name: string;
    start_date: string;
    duration_days: number;
    timeline_running: boolean;
    frozen_since: string | null;
    frozen_days: number;
    completed: boolean;
    parent_id: string | null;
  }[] = [];
  let parentId: string | null = null;
  for (const item of g.items) {
    if (!item.micro) parentId = item.id;
    if (!item.start || item.days == null) continue;
    rows.push({
      id: item.id,
      name: item.name.trim() || "Senza nome",
      start_date: item.start,
      duration_days: item.days,
      timeline_running: true,
      frozen_since: null,
      frozen_days: 0,
      completed: item.done,
      parent_id: item.micro ? parentId : null,
    });
  }
  return rows;
}
