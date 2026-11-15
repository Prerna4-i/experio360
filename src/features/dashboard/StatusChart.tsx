import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { DailyPoint } from "@/domain/filters";
import { formatShortDay } from "@/lib/format";

const config = {
  Success: { label: "Success", color: "var(--success)" },
  Pending: { label: "Pending", color: "var(--warning)" },
  Unknown: { label: "Outcome unknown", color: "var(--info)" },
  Failed: { label: "Failed", color: "var(--destructive)" },
  Reversed: { label: "Reversed", color: "var(--neutral)" },
} satisfies ChartConfig;

export function StatusChart({ data }: { data: DailyPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-[300px] w-full" role="img" aria-label="Daily transactions stacked by status">
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={formatShortDay} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => formatShortDay(String(v))} />} />
        <ChartLegend content={<ChartLegendContent />} />
        {(Object.keys(config) as (keyof typeof config)[]).map((k, i, arr) => (
          <Bar key={k} dataKey={k} stackId="s" fill={`var(--color-${k})`} radius={i === arr.length - 1 ? [3, 3, 0, 0] : 0} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
