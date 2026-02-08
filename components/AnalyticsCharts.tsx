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
} from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";

const CHART_COLORS = [
  "#3c5aa6", // pokemon blue
  "#ffcb05", // pokemon yellow
  "#c7a008", // yellow dark
  "#5c7cbd", // blue light
  "#2a4365",
  "#16a34a", // success
  "#718096",
  "#4a5568",
];

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
    <div className="bg-white rounded-card shadow-card border border-stone-200 px-3 py-2 text-sm">
      <p className="font-medium text-stone-800">{label ?? ""}</p>
      <p className="text-stone-600">{value} cards</p>
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byMonth.map((d) => ({ ...d, monthLabel: formatMonth(d.month) }))}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={(props) => <CustomTooltip {...props} />} />
                <Bar
                  dataKey="count"
                  fill={CHART_COLORS[0]}
                  name="Cards"
                  radius={[4, 4, 0, 0]}
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byYear} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <XAxis dataKey="year" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={(props) => <CustomTooltip {...props} />} />
                <Bar
                  dataKey="count"
                  fill={CHART_COLORS[1]}
                  name="Cards"
                  radius={[4, 4, 0, 0]}
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
                margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
              >
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="setName"
                  width={120}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} />} />
                <Bar
                  dataKey="count"
                  fill={CHART_COLORS[2]}
                  name="Cards"
                  radius={[0, 4, 4, 0]}
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
                  outerRadius="70%"
                  label={({ rarity, count }) => `${rarity}: ${count}`}
                  labelLine={false}
                >
                  {byRarity.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-white rounded-card shadow-card-hover border border-stone-200 px-3 py-2 text-sm">
                        <p className="font-medium text-stone-800">
                          {payload[0].name}
                        </p>
                        <p className="text-stone-600">{payload[0].value} cards</p>
                      </div>
                    ) : null
                  }
                />
                <Legend />
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
