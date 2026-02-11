"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { getRarityColor } from "@/lib/rarityColors";

const PASTEL_COLORS = [
  "#A8D4E6",
  "#F5E6A4",
  "#F8B4C4",
  "#B8E0C8",
  "#D4C4E8",
  "#FFDAB9",
  "#B8E6D8",
  "#E0D4F0",
];

const BAR_COLOR = "#A8D4E6";
const GRID_STROKE = "#e7e5e4";
const AXIS_STROKE = "#a8a29e";
const TICK_FONT_SIZE = 13;

function formatMonth(monthStr: string) {
  const [y, m] = monthStr.split("-");
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: unknown[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const first = payload[0] as { value?: number } | undefined;
  const value = first?.value ?? 0;
  return (
    <div className="bg-white rounded-lg shadow-md border border-stone-200 px-4 py-3 text-base">
      <p className="font-semibold text-stone-800 mb-0.5">{label ?? ""}</p>
      <p className="text-stone-600">{value} {value === 1 ? "card" : "cards"}</p>
    </div>
  );
}

type Props = {
  byYear: { year: number; count: number }[];
  bySet: { setName: string; count: number }[];
  byRarity: { rarity: string; count: number }[];
  byMonth: { month: string; count: number }[];
};

export function AnalyticsCharts({
  byYear,
  bySet,
  byRarity,
  byMonth,
}: Props) {
  return (
    <div className="space-y-10">
      {byMonth.length > 0 ? (
        <Card className="p-6">
          <CardTitle>Cards added over time</CardTitle>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byMonth.map((d) => ({ ...d, monthLabel: formatMonth(d.month) }))}
                margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: TICK_FONT_SIZE, fill: AXIS_STROKE }}
                  tickLine={false}
                  axisLine={{ stroke: AXIS_STROKE }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: TICK_FONT_SIZE, fill: AXIS_STROKE }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Cards", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: AXIS_STROKE } }}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: "rgba(168, 212, 230, 0.15)" }} />
                <Bar
                  dataKey="count"
                  fill={BAR_COLOR}
                  name="Cards"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <CardTitle>Cards added over time</CardTitle>
          <p className="text-stone-500 text-sm py-8 text-center">
            No data yet
          </p>
        </Card>
      )}

      {byYear.length > 0 ? (
        <Card className="p-6">
          <CardTitle>Cards by year</CardTitle>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byYear} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: TICK_FONT_SIZE, fill: AXIS_STROKE }}
                  tickLine={false}
                  axisLine={{ stroke: AXIS_STROKE }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: TICK_FONT_SIZE, fill: AXIS_STROKE }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Cards", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: AXIS_STROKE } }}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: "rgba(245, 230, 164, 0.2)" }} />
                <Bar
                  dataKey="count"
                  fill={PASTEL_COLORS[1]}
                  name="Cards"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <CardTitle>Cards by year</CardTitle>
          <p className="text-stone-500 text-sm py-8 text-center">No data yet</p>
        </Card>
      )}

      {bySet.length > 0 ? (
        <Card className="p-6">
          <CardTitle>Top sets</CardTitle>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bySet}
                layout="vertical"
                margin={{ left: 8, right: 24, top: 16, bottom: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: TICK_FONT_SIZE, fill: AXIS_STROKE }}
                  tickLine={false}
                  axisLine={{ stroke: AXIS_STROKE }}
                />
                <YAxis
                  type="category"
                  dataKey="setName"
                  width={140}
                  tick={{ fontSize: 12, fill: AXIS_STROKE }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: "rgba(248, 180, 196, 0.15)" }} />
                <Bar
                  dataKey="count"
                  fill={PASTEL_COLORS[2]}
                  name="Cards"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <CardTitle>Top sets</CardTitle>
          <p className="text-stone-500 text-sm py-8 text-center">No data yet</p>
        </Card>
      )}

      {byRarity.length > 0 ? (
        <Card className="p-6">
          <CardTitle>Cards by rarity</CardTitle>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byRarity}
                  dataKey="count"
                  nameKey="rarity"
                  cx="50%"
                  cy="50%"
                  outerRadius="65%"
                  paddingAngle={2}
                  label={({ rarity, count }) => `${rarity}: ${count}`}
                  labelLine={{ stroke: AXIS_STROKE, strokeWidth: 1 }}
                >
                  {byRarity.map((entry) => (
                    <Cell
                      key={entry.rarity}
                      fill={getRarityColor(entry.rarity)}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-white rounded-lg shadow-md border border-stone-200 px-4 py-3 text-base">
                        <p className="font-semibold text-stone-800 mb-0.5">
                          {payload[0].name}
                        </p>
                        <p className="text-stone-600">
                          {payload[0].value} {Number(payload[0].value) === 1 ? "card" : "cards"}
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: 16 }}
                  formatter={(value) => <span className="text-stone-700 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <CardTitle>Cards by rarity</CardTitle>
          <p className="text-stone-500 text-sm py-8 text-center">No data yet</p>
        </Card>
      )}

      {byYear.length === 0 &&
        bySet.length === 0 &&
        byRarity.length === 0 &&
        byMonth.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-stone-500">Add some cards to see analytics here.</p>
          </Card>
        )}
    </div>
  );
}
