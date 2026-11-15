import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TXN_LABEL } from "@/components/common/StatusPill";
import { validateDateRange, type RangePreset } from "@/domain/filters";
import { TXN_STATUSES, type TxnStatus } from "@/domain/types";

interface Props {
  preset: RangePreset;
  customFrom?: string | undefined;
  customTo?: string | undefined;
  status: TxnStatus | "all";
  maxDate: string;
  onPreset: (p: RangePreset) => void;
  onCustom: (r: { from?: string | undefined; to?: string | undefined }) => void;
  onStatus: (s: TxnStatus | "all") => void;
  onReset: () => void;
}

export function DashboardFilters({ preset, customFrom, customTo, status, maxDate, onPreset, onCustom, onStatus, onReset }: Props) {
  const rangeError = preset === "custom" ? validateDateRange(customFrom, customTo) : null;
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card lg:flex-row lg:items-end">
      <div className="space-y-1.5">
        <Label id="range-label">Date range</Label>
        <ToggleGroup type="single" variant="outline" value={preset} onValueChange={(v) => v && onPreset(v as RangePreset)} aria-labelledby="range-label" className="justify-start">
          <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
          <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
          <ToggleGroupItem value="90d">90 days</ToggleGroupItem>
          <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {preset === "custom" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="dash-from">From</Label>
              <Input id="dash-from" type="date" max={maxDate} value={customFrom ?? ""} aria-invalid={!!rangeError} onChange={(e) => onCustom({ from: e.target.value || undefined, to: customTo })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dash-to">To</Label>
              <Input id="dash-to" type="date" max={maxDate} value={customTo ?? ""} aria-invalid={!!rangeError} onChange={(e) => onCustom({ from: customFrom, to: e.target.value || undefined })} />
            </div>
          </div>
          {rangeError && (
            <p role="alert" className="text-xs text-destructive">
              {rangeError}
            </p>
          )}
        </div>
      )}
      <div className="space-y-1.5 lg:w-52">
        <Label htmlFor="dash-status">Transaction status</Label>
        <Select value={status} onValueChange={(v) => onStatus(v as TxnStatus | "all")}>
          <SelectTrigger id="dash-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TXN_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {TXN_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="ghost" onClick={onReset} className="lg:ml-auto">
        <RotateCcw /> Reset
      </Button>
    </div>
  );
}
