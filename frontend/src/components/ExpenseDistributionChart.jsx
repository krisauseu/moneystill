import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTheme } from '../context/ThemeContext';

// Pastel color palette for categories
const COLORS = [
    '#60a5fa', // blue-400
    '#f472b6', // pink-400
    '#34d399', // emerald-400
    '#fbbf24', // amber-400
    '#a78bfa', // violet-400
    '#fb923c', // orange-400
    '#2dd4bf', // teal-400
    '#f87171', // red-400
    '#818cf8', // indigo-400
    '#4ade80', // green-400
    '#facc15', // yellow-400
    '#c084fc', // purple-400
];

export default function ExpenseDistributionChart({ data, loading, selectedMonth = 0 }) {
    const { isDark } = useTheme();
    // Helper to get amount for a category based on month filter
    const getCategoryTotal = (category) => {
        if (selectedMonth === 0) {
            // Full year: sum all months
            return category.monthly_values?.reduce((sum, mv) => sum + (mv.amount || 0), 0) || 0;
        } else {
            // Specific month
            const monthValue = category.monthly_values?.find(mv => mv.month === selectedMonth);
            return monthValue?.amount || 0;
        }
    };

    // Filter only expense categories and calculate totals
    const expenseData = data
        ?.filter(cat => cat.type === 'expense')
        .map((cat, index) => {
            const total = getCategoryTotal(cat);
            return {
                name: cat.name,
                value: total,
                color: COLORS[index % COLORS.length],
            };
        })
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value) || [];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const total = expenseData.reduce((sum, item) => sum + item.value, 0);
            const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

            return (
                <div className="glass rounded-xl p-3 shadow-xl border border-white/50 dark:border-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-white">{data.name}</p>
                    <p className="text-slate-600 dark:text-slate-300">{formatCurrency(data.value)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{percent}% of expenses</p>
                </div>
            );
        }
        return null;
    };

    const renderLegend = (props) => {
        const { payload } = props;
        return (
            <div className="max-h-56 overflow-y-auto pr-2" data-pdf-legend>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {payload.map((entry, index) => (
                        <li key={`legend-${index}`} className="flex items-center gap-1.5">
                            <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-600 dark:text-slate-400 text-ellipsis overflow-hidden" title={entry.value}>
                                {entry.value}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4"></div>
                <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
            </div>
        );
    }

    if (expenseData.length === 0) {
        return (
            <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Expense Distribution</h3>
                <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    No expenses recorded
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Ausgaben-Verteilung</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={expenseData}
                            cx="40%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {expenseData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            content={renderLegend}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
