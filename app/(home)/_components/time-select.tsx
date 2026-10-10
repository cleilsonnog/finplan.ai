"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  currentPeriod,
  formatPeriod,
  parsePeriod,
  periodLabel,
  shiftPeriod,
  type Period,
} from "@/app/_utils/period";

// Two years back and one ahead of today covers history and future installments/bills
const MONTHS_BACK = 24;
const MONTHS_AHEAD = 12;

const TimeSelect = () => {
  const { push } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = currentPeriod();
  const selected = parsePeriod(searchParams.get("month")) ?? today;
  const value = formatPeriod(selected);

  const options: Period[] = [];
  for (let i = MONTHS_AHEAD; i >= -MONTHS_BACK; i--) options.push(shiftPeriod(today, i));
  if (!options.some((p) => formatPeriod(p) === value)) options.push(selected);

  const go = (period: Period) => push(`${pathname}?month=${formatPeriod(period)}`);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={() => go(shiftPeriod(selected, -1))}
        aria-label="Mês anterior"
      >
        <ChevronLeftIcon size={16} />
      </Button>
      <Select value={value} onValueChange={(v) => go(parsePeriod(v) ?? today)}>
        <SelectTrigger className="w-[180px] rounded-full capitalize">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((p) => (
            <SelectItem key={formatPeriod(p)} value={formatPeriod(p)} className="capitalize">
              {periodLabel(p)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={() => go(shiftPeriod(selected, 1))}
        aria-label="Próximo mês"
      >
        <ChevronRightIcon size={16} />
      </Button>
    </div>
  );
};

export default TimeSelect;
