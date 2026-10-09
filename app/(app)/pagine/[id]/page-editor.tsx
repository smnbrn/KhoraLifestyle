"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChartGantt, CheckSquare, CornerDownRight, Heading1, Plus, Table2, Trash2, Type, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GanttChart } from "@/components/shared/gantt-chart";
import { cn, formatCurrency } from "@/lib/utils";
import {
  COLUMN_TYPE_LABEL,
  asChecklist,
  asGantt,
  ganttRows,
  asTable,
  asText,
  columnSum,
  newId,
  type CellValue,
  type ChecklistContent,
  type ColumnType,
  type GanttContent,
  type TableContent,
  type TextContent,
} from "@/lib/page-blocks";
import type { Json } from "@/types/database.types";
import { addBlock, removeBlock, saveBlock, saveBlockOrder } from "../actions";

export type EditorBlock = { id: string; type: "heading" | "text" | "checklist" | "table" | "gantt"; content: Json };

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Salva il contenuto di un blocco con debounce (600 ms). All'uscita dalla pagina
 * (unmount) l'ultima modifica in sospeso viene salvata subito, così non si perde nulla.
 */
function useAutosave(blockId: string, onState: (s: SaveState) => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Json | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (pending.current === null) return;
    const content = pending.current;
    pending.current = null;
    onState("saving");
    const result = await saveBlock(blockId, content);
    onState(result.success ? "saved" : "error");
    if (!result.success) toast.error(result.error);
  }, [blockId, onState]);

  const schedule = useCallback(
    (content: Json) => {
      pending.current = content;
      onState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 600);
    },
    [flush, onState]
  );

  useEffect(() => () => void flush(), [flush]);
  return schedule;
}

// ---------------------------------------------------------------- testo / titolo
function TextBlock({ block, heading, onState }: { block: EditorBlock; heading: boolean; onState: (s: SaveState) => void }) {
  const [value, setValue] = useState<TextContent>(() => asText(block.content));
  const schedule = useAutosave(block.id, onState);

  function change(text: string) {
    const next = { text };
    setValue(next);
    schedule(next);
  }

  return heading ? (
    <Input
      value={value.text}
      onChange={(e) => change(e.target.value)}
      placeholder="Titolo"
      className="h-auto border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
    />
  ) : (
    <Textarea
      value={value.text}
      onChange={(e) => change(e.target.value)}
      placeholder="Scrivi qualcosa…"
      rows={Math.min(14, Math.max(3, value.text.split("\n").length + 1))}
      className="resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
    />
  );
}

// ---------------------------------------------------------------- elenco spunte
function ChecklistBlock({ block, onState }: { block: EditorBlock; onState: (s: SaveState) => void }) {
  const [value, setValue] = useState<ChecklistContent>(() => asChecklist(block.content));
  const schedule = useAutosave(block.id, onState);

  function update(next: ChecklistContent) {
    setValue(next);
    schedule(next);
  }

  const done = value.items.filter((i) => i.done).length;

  return (
    <div className="space-y-1.5">
      {value.items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {done} di {value.items.length} completati
        </p>
      )}
      {value.items.map((item, index) => (
        <div key={item.id} className="group flex items-center gap-2">
          <Checkbox
            checked={item.done}
            onCheckedChange={(v) =>
              update({ items: value.items.map((i) => (i.id === item.id ? { ...i, done: v === true } : i)) })
            }
          />
          <Input
            value={item.text}
            onChange={(e) => update({ items: value.items.map((i) => (i.id === item.id ? { ...i, text: e.target.value } : i)) })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const items = [...value.items];
                items.splice(index + 1, 0, { id: newId(), text: "", done: false });
                update({ items });
              }
            }}
            placeholder="Elemento"
            className={cn("h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-1", item.done && "text-muted-foreground line-through")}
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => update({ items: value.items.filter((i) => i.id !== item.id) })}
          >
            <X />
            <span className="sr-only">Rimuovi</span>
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => update({ items: [...value.items, { id: newId(), text: "", done: false }] })}
      >
        <Plus />
        Aggiungi elemento
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- tabella
function CellInput({
  type,
  value,
  onChange,
}: {
  type: ColumnType;
  value: CellValue | undefined;
  onChange: (v: CellValue) => void;
}) {
  if (type === "checkbox") {
    return (
      <div className="flex h-8 items-center justify-center">
        <Checkbox checked={value === true} onCheckedChange={(v) => onChange(v === true)} />
      </div>
    );
  }
  const numeric = type === "number" || type === "currency";
  return (
    <Input
      type={type === "date" ? "date" : numeric ? "number" : "text"}
      step={numeric ? "any" : undefined}
      value={value == null || typeof value === "boolean" ? "" : String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(numeric ? (raw === "" ? null : Number(raw)) : raw);
      }}
      className={cn("h-8 border-0 bg-transparent px-2 shadow-none focus-visible:ring-1", numeric && "tabular text-right")}
    />
  );
}

function TableBlock({ block, onState }: { block: EditorBlock; onState: (s: SaveState) => void }) {
  const [table, setTable] = useState<TableContent>(() => asTable(block.content));
  const schedule = useAutosave(block.id, onState);

  function update(next: TableContent) {
    setTable(next);
    schedule(next as unknown as Json);
  }

  const hasSums = table.columns.some((c) => c.type === "number" || c.type === "currency");

  return (
    <div className="space-y-2">
      <Input
        value={table.title}
        onChange={(e) => update({ ...table, title: e.target.value })}
        placeholder="Titolo della tabella (facoltativo)"
        className="h-8 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
      />
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40">
              {table.columns.map((col) => (
                <th key={col.id} className="min-w-36 border-r p-1 text-left align-top font-normal">
                  <div className="flex items-center gap-1">
                    <Input
                      value={col.name}
                      onChange={(e) =>
                        update({ ...table, columns: table.columns.map((c) => (c.id === col.id ? { ...c, name: e.target.value } : c)) })
                      }
                      placeholder="Colonna"
                      className="h-7 border-0 bg-transparent px-1 text-xs font-medium shadow-none focus-visible:ring-1"
                    />
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                      title="Elimina colonna"
                      onClick={() => {
                        if (table.columns.length <= 1) return void toast.error("Serve almeno una colonna.");
                        update({ ...table, columns: table.columns.filter((c) => c.id !== col.id) });
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  <Select
                    value={col.type}
                    onValueChange={(v) =>
                      update({ ...table, columns: table.columns.map((c) => (c.id === col.id ? { ...c, type: v as ColumnType } : c)) })
                    }
                  >
                    <SelectTrigger className="h-6 border-0 bg-transparent px-1 text-[11px] text-muted-foreground shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COLUMN_TYPE_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </th>
              ))}
              <th className="w-20 p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => update({ ...table, columns: [...table.columns, { id: newId(), name: "", type: "text" }] })}
                >
                  <Plus />
                  Colonna
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.id} className="group border-t">
                {table.columns.map((col) => (
                  <td key={col.id} className="border-r p-0">
                    <CellInput
                      type={col.type}
                      value={row.cells[col.id]}
                      onChange={(v) =>
                        update({
                          ...table,
                          rows: table.rows.map((r) => (r.id === row.id ? { ...r, cells: { ...r.cells, [col.id]: v } } : r)),
                        })
                      }
                    />
                  </td>
                ))}
                <td className="p-0 text-center">
                  <button
                    type="button"
                    className="rounded p-1 text-muted-foreground opacity-0 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    title="Elimina riga"
                    onClick={() => update({ ...table, rows: table.rows.filter((r) => r.id !== row.id) })}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {hasSums && (
            <tfoot>
              <tr className="border-t bg-muted/30 text-xs text-muted-foreground">
                {table.columns.map((col) => (
                  <td key={col.id} className="tabular border-r px-2 py-1.5 text-right">
                    {col.type === "number" || col.type === "currency" ? (
                      <>
                        Somma:{" "}
                        <span className="font-medium text-foreground">
                          {col.type === "currency"
                            ? formatCurrency(columnSum(table, col.id))
                            : new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(columnSum(table, col.id))}
                        </span>
                      </>
                    ) : null}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => update({ ...table, rows: [...table.rows, { id: newId(), cells: {} }] })}
      >
        <Plus />
        Nuova riga
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- gantt
function GanttBlock({ block, onState }: { block: EditorBlock; onState: (s: SaveState) => void }) {
  const [gantt, setGantt] = useState<GanttContent>(() => asGantt(block.content));
  const schedule = useAutosave(block.id, onState);

  function update(next: GanttContent) {
    // la prima riga è sempre una macro attività
    if (next.items.length > 0 && next.items[0].micro) {
      next = { ...next, items: next.items.map((i, idx) => (idx === 0 ? { ...i, micro: false } : i)) };
    }
    setGantt(next);
    schedule(next as unknown as Json);
  }

  function patch(id: string, values: Partial<GanttContent["items"][number]>) {
    update({ ...gantt, items: gantt.items.map((i) => (i.id === id ? { ...i, ...values } : i)) });
  }

  function addRow(micro: boolean) {
    const last = [...gantt.items].reverse().find((i) => i.start);
    update({
      ...gantt,
      items: [
        ...gantt.items,
        { id: newId(), name: "", start: last?.start ?? new Date().toISOString().slice(0, 10), days: 7, done: false, micro },
      ],
    });
  }

  const rows = ganttRows(gantt);

  return (
    <div className="space-y-3">
      <Input
        value={gantt.title}
        onChange={(e) => update({ ...gantt, title: e.target.value })}
        placeholder="Titolo del Gantt (facoltativo)"
        className="h-8 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
      />

      <div className="space-y-1.5">
        {gantt.items.map((item, index) => (
          <div key={item.id} className={cn("group flex flex-wrap items-center gap-2", item.micro && "pl-7")}>
            <Checkbox checked={item.done} onCheckedChange={(v) => patch(item.id, { done: v === true })} aria-label="Completata" />
            <Input
              value={item.name}
              onChange={(e) => patch(item.id, { name: e.target.value })}
              placeholder={item.micro ? "Micro attività" : "Macro attività"}
              className={cn(
                "h-8 min-w-40 flex-1 px-2",
                !item.micro && "font-medium",
                item.done && "text-muted-foreground line-through"
              )}
            />
            <Input
              type="date"
              value={item.start}
              onChange={(e) => patch(item.id, { start: e.target.value })}
              className="h-8 w-40 px-2"
              aria-label="Data di inizio"
            />
            <Input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={item.days ?? ""}
              onChange={(e) => patch(item.id, { days: e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value))) })}
              className="tabular h-8 w-20 px-2 text-right"
              placeholder="giorni"
              aria-label="Durata in giorni"
            />
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-8", item.micro ? "text-primary" : "text-muted-foreground")}
              disabled={index === 0}
              title={item.micro ? "Micro attività (clic per renderla macro)" : "Macro attività (clic per renderla micro della precedente)"}
              onClick={() => patch(item.id, { micro: !item.micro })}
            >
              <CornerDownRight />
              <span className="sr-only">Cambia tra macro e micro attività</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground opacity-0 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
              onClick={() => update({ ...gantt, items: gantt.items.filter((i) => i.id !== item.id) })}
            >
              <Trash2 />
              <span className="sr-only">Elimina attività</span>
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => addRow(false)}>
          <Plus />
          Macro attività
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          disabled={gantt.items.length === 0}
          onClick={() => addRow(true)}
        >
          <Plus />
          Micro attività
        </Button>
      </div>

      <div className="rounded-md border p-3">
        <GanttChart phases={rows} emptyText="Dai a ogni attività una data di inizio e una durata in giorni: il diagramma compare qui." />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- editor
const ADD_OPTIONS = [
  { type: "heading", label: "Titolo", icon: Heading1 },
  { type: "text", label: "Testo", icon: Type },
  { type: "checklist", label: "Elenco spunte", icon: CheckSquare },
  { type: "table", label: "Tabella", icon: Table2 },
  { type: "gantt", label: "Gantt", icon: ChartGantt },
] as const;

export function PageEditor({ pageId, initialBlocks }: { pageId: string; initialBlocks: EditorBlock[] }) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(initialBlocks);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isPending, startTransition] = useTransition();

  const onState = useCallback((s: SaveState) => setSaveState(s), []);

  function add(type: string) {
    startTransition(async () => {
      const result = await addBlock(pageId, type);
      if (!result.success) return void toast.error(result.error);
      setBlocks((b) => [...b, { id: result.data.id, type: result.data.type as EditorBlock["type"], content: result.data.content }]);
    });
  }

  function remove(id: string) {
    const block = blocks.find((b) => b.id === id);
    if (block?.type === "table" && !window.confirm("Eliminare questa tabella e tutti i suoi dati?")) return;
    if (block?.type === "gantt" && !window.confirm("Eliminare questo Gantt e tutte le sue attività?")) return;
    setBlocks((b) => b.filter((x) => x.id !== id));
    startTransition(async () => {
      const result = await removeBlock(id);
      if (!result.success) {
        toast.error(result.error);
        router.refresh();
      }
    });
  }

  function move(id: string, delta: -1 | 1) {
    const index = blocks.findIndex((b) => b.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
    startTransition(async () => {
      const result = await saveBlockOrder(pageId, next.map((b) => b.id));
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex h-5 justify-end text-xs text-muted-foreground">
        {saveState === "saving" && "Salvataggio…"}
        {saveState === "saved" && "Salvato ✓"}
        {saveState === "error" && <span className="text-destructive">Non salvato</span>}
      </div>

      {blocks.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Pagina vuota: aggiungi un blocco qui sotto — un titolo, del testo, un elenco di spunte, una tabella o un Gantt.
        </p>
      )}

      {blocks.map((block, index) => (
        <div key={block.id} className="group relative rounded-lg border border-transparent p-2 hover:border-border">
          <div className="absolute -top-3 right-2 z-10 hidden items-center gap-0.5 rounded-md border bg-card p-0.5 shadow-sm group-hover:flex group-focus-within:flex">
            <Button variant="ghost" size="icon" className="size-6" disabled={index === 0} onClick={() => move(block.id, -1)}>
              <ArrowUp />
              <span className="sr-only">Sposta su</span>
            </Button>
            <Button variant="ghost" size="icon" className="size-6" disabled={index === blocks.length - 1} onClick={() => move(block.id, 1)}>
              <ArrowDown />
              <span className="sr-only">Sposta giù</span>
            </Button>
            <Button variant="ghost" size="icon" className="size-6 hover:text-destructive" onClick={() => remove(block.id)}>
              <Trash2 />
              <span className="sr-only">Elimina blocco</span>
            </Button>
          </div>
          {block.type === "heading" && <TextBlock block={block} heading onState={onState} />}
          {block.type === "text" && <TextBlock block={block} heading={false} onState={onState} />}
          {block.type === "checklist" && <ChecklistBlock block={block} onState={onState} />}
          {block.type === "table" && <TableBlock block={block} onState={onState} />}
          {block.type === "gantt" && <GanttBlock block={block} onState={onState} />}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <span className="text-xs text-muted-foreground">Aggiungi:</span>
        {ADD_OPTIONS.map(({ type, label, icon: Icon }) => (
          <Button key={type} variant="outline" size="sm" disabled={isPending} onClick={() => add(type)}>
            <Icon />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
