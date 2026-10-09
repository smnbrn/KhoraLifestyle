"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERIOD_LABELS, type PeriodKey } from "@/lib/report-periods";

export function PeriodFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("periodo") as PeriodKey) ?? "questo-mese";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={current} onValueChange={(v) => setParam("periodo", v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {current === "personalizzato" && (
        <>
          <Input
            type="date"
            className="w-[160px]"
            defaultValue={searchParams.get("dal") ?? ""}
            onChange={(e) => setParam("dal", e.target.value)}
          />
          <span className="text-sm text-muted-foreground">→</span>
          <Input
            type="date"
            className="w-[160px]"
            defaultValue={searchParams.get("al") ?? ""}
            onChange={(e) => setParam("al", e.target.value)}
          />
        </>
      )}
    </div>
  );
}
