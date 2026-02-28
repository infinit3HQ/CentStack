import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDecryptedTransactions } from '@/hooks/useDecryptedTransactions';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { CATEGORY_COLORS } from '@/lib/categoryUtils';

const CHART_STYLE = {
  tooltip: {
    backgroundColor: 'hsl(222.2, 84%, 4.9%)',
    border: '1px solid hsl(217.2, 32.6%, 17.5%)',
    borderRadius: '8px',
    color: 'hsl(210, 40%, 98%)',
    fontSize: '12px',
  },
};

export function SpendingCharts() {
  const transactions = useDecryptedTransactions();

  const categoryData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const byCategory: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense') {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      }
    }

    return Object.entries(byCategory)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Math.round(value * 100) / 100,
        fill: CATEGORY_COLORS[name] || CATEGORY_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const byMonth: Record<string, { income: number; expenses: number }> = {};

    for (const t of transactions) {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!byMonth[key]) byMonth[key] = { income: 0, expenses: 0 };

      if (t.type === 'income') {
        byMonth[key].income += t.amount;
      } else {
        byMonth[key].expenses += t.amount;
      }
    }

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => {
        const [year, m] = month.split('-');
        const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleString('default', { month: 'short' });
        return {
          name: `${monthName} '${year.slice(2)}`,
          income: Math.round(data.income * 100) / 100,
          expenses: Math.round(data.expenses * 100) / 100,
        };
      });
  }, [transactions]);

  if (!transactions || transactions.length === 0) return null;
  if (categoryData.length === 0 && monthlyData.length === 0) return null;

  const totalExpenses = categoryData.reduce((sum, d) => sum + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-semibold font-mono">analytics.view</h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        {categoryData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="p-6 rounded-xl border border-border bg-card/50"
          >
            <h4 className="text-sm font-medium text-muted-foreground mb-4 font-mono">spending_by_category</h4>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_STYLE.tooltip}
                  formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {categoryData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span>{entry.name}</span>
                  <span className="text-foreground/60 font-mono">
                    {totalExpenses > 0 ? Math.round((entry.value / totalExpenses) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Monthly Bar Chart */}
        {monthlyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="p-6 rounded-xl border border-border bg-card/50"
          >
            <h4 className="text-sm font-medium text-muted-foreground mb-4 font-mono">monthly_overview</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2, 32.6%, 17.5%)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(215, 20.2%, 65.1%)', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(217.2, 32.6%, 17.5%)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'hsl(215, 20.2%, 65.1%)', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(217.2, 32.6%, 17.5%)' }}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={CHART_STYLE.tooltip}
                  formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: 'hsl(215, 20.2%, 65.1%)' }}
                />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
