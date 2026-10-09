"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SortSelect({ options, paramName = "ordina" }: { options: Record<string, string>; paramName?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? Object.keys(options)[0];

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-[170px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(options).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
