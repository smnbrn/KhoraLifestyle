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
