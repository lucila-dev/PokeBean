"use client";

import { useEffect, useState } from "react";
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
import { getChartColor, getRarityColor } from "@/lib/rarityColors";

const TICK_FONT_SIZE = 13;

function useChartTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark
    ? {
        grid: "#44403c",
        axis: "#e7e5e4",
        pieStroke: "#1c1917",
      }
    : {
        grid: "#e7e5e4",
        axis: "#a8a29e",
        pieStroke: "#ffffff",
      };
}

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
  const first = payload[0] as { value?: number; payload?: { fill?: string } } | undefined;
  const value = first?.value ?? 0;
  return (
    <div className="bg-white dark:bg-stone-900 rounded-lg shadow-md border border-stone-200 dark:border-stone-700 px-4 py-3 text-base text-stone-800 dark:text-stone-100">
      <p className="font-semibold text-stone-800 dark:text-stone-100 mb-0.5">{label ?? ""}</p>
      <p className="text-stone-600 dark:text-stone-300">
        {value} {value === 1 ? "card" : "cards"}
      </p>
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
  const theme = useChartTheme();

  return (
    <div className="space-y-10">
      {byMonth.length > 0 ? (
        <Card className="p-6 overflow-visible">
          <CardTitle>Cards added over time</CardTitle>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byMonth.map((d) => ({ ...d, monthLabel: formatMonth(d.month) }))}
                margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: TICK_FONT_SIZE, fill: theme.axis }}
                  tickLine={false}
                  axisLine={{ stroke: theme.axis }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: TICK_FONT_SIZE, fill: theme.axis }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Cards",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12, fill: theme.axis },
                  }}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: "rgba(59, 130, 246, 0.12)" }} />
                <Bar dataKey="count" name="Cards" radius={[6, 6, 0, 0]}>
                  {byMonth.map((entry, index) => (
                    <Cell key={entry.month} fill={getChartColor(index, entry.month)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <CardTitle>Cards added over time</CardTitle>
          <p className="text-stone-500 dark:text-stone-300 text-sm py-8 text-center">No data yet</p>
        </Card>
      )}

      {byYear.length > 0 ? (
        <Card className="p-6 overflow-visible">
          <CardTitle>Cards by year</CardTitle>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byYear} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: TICK_FONT_SIZE, fill: theme.axis }}
                  tickLine={false}
                  axisLine={{ stroke: theme.axis }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: TICK_FONT_SIZE, fill: theme.axis }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Cards",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12, fill: theme.axis },
                  }}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: "rgba(245, 158, 11, 0.12)" }} />
                <Bar dataKey="count" name="Cards" radius={[6, 6, 0, 0]}>
                  {byYear.map((entry, index) => (
                    <Cell key={entry.year} fill={getChartColor(index, String(entry.year))} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <CardTitle>Cards by year</CardTitle>
          <p className="text-stone-500 dark:text-stone-300 text-sm py-8 text-center">No data yet</p>
        </Card>
      )}

      {bySet.length > 0 ? (
        <Card className="p-6 overflow-visible">
          <CardTitle>Top sets</CardTitle>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bySet}
                layout="vertical"
                margin={{ left: 8, right: 24, top: 16, bottom: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: TICK_FONT_SIZE, fill: theme.axis }}
                  tickLine={false}
                  axisLine={{ stroke: theme.axis }}
                />
                <YAxis
                  type="category"
                  dataKey="setName"
                  width={140}
                  tick={{ fontSize: 12, fill: theme.axis }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} />} cursor={{ fill: "rgba(236, 72, 153, 0.1)" }} />
                <Bar dataKey="count" name="Cards" radius={[0, 6, 6, 0]}>
                  {bySet.map((entry, index) => (
                    <Cell key={entry.setName} fill={getChartColor(index, entry.setName)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <CardTitle>Top sets</CardTitle>
          <p className="text-stone-500 dark:text-stone-300 text-sm py-8 text-center">No data yet</p>
        </Card>
      )}

      {byRarity.length > 0 ? (
        <Card className="p-6 overflow-visible">
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
                  labelLine={{ stroke: theme.axis, strokeWidth: 1 }}
                >
                  {byRarity.map((entry) => (
                    <Cell
                      key={entry.rarity}
                      fill={getRarityColor(entry.rarity)}
                      stroke={theme.pieStroke}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-white dark:bg-stone-900 rounded-lg shadow-md border border-stone-200 dark:border-stone-700 px-4 py-3 text-base text-stone-800 dark:text-stone-100">
                        <p className="font-semibold text-stone-800 dark:text-stone-100 mb-0.5">
                          {payload[0].name}
                        </p>
                        <p className="text-stone-600 dark:text-stone-300">
                          {payload[0].value}{" "}
                          {Number(payload[0].value) === 1 ? "card" : "cards"}
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
                  formatter={(value) => (
                    <span className="text-stone-700 dark:text-stone-200 text-sm">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <CardTitle>Cards by rarity</CardTitle>
          <p className="text-stone-500 dark:text-stone-300 text-sm py-8 text-center">No data yet</p>
        </Card>
      )}

      {byYear.length === 0 &&
        bySet.length === 0 &&
        byRarity.length === 0 &&
        byMonth.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-stone-500 dark:text-stone-300">Add some cards to see analytics here.</p>
          </Card>
        )}
    </div>
  );
}
