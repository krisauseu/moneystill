import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

export default function ComparisonChart({ data, loading, scenarioName }) {
    const { isDark } = useTheme();

    // Theme-aware colors
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const axisColor = isDark ? '#475569' : '#cbd5e1';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const tooltipBg = isDark ? 'bg-slate-900/90' : 'bg-white/90';
    const tooltipBorder = isDark ? 'border-slate-700' : 'border-slate-200';

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const plan = payload.find(p => p.dataKey === 'plan')?.value || 0;
            const live = payload.find(p => p.dataKey === 'live')?.value || 0;
            const diff = live - plan;
            const diffPercent = plan !== 0 ? (diff / Math.abs(plan)) * 100 : 0;

            return (
                <div className={`glass rounded-xl p-4 shadow-xl border ${tooltipBg} ${tooltipBorder}`}>
                    <p className="font-bold text-slate-900 dark:text-blue-400 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">
                        {label}
                    </p>
                    <div className="space-y-1.5">
                        <div className="flex justify-between gap-8 text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Plan ({scenarioName}):</span>
                            <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                                {formatCurrency(plan)}
                            </span>
                        </div>
                        <div className="flex justify-between gap-8 text-sm">
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Actual (Live):</span>
                            <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                                {formatCurrency(live)}
                            </span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between gap-8 text-sm">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Difference:</span>
                                <span className={`font-mono font-bold ${diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {diff > 0 ? '+' : ''}{formatCurrency(diff)} ({diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-64 mb-6"></div>
                <div className="h-72 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-6 border-2 border-indigo-100 dark:border-indigo-900/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Comparison: Live vs. {scenarioName || 'Scenario'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Monthly surplus comparison
                    </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-sm"></div>
                        <span className="text-slate-600 dark:text-slate-400">Scenario</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                        <span className="text-slate-600 dark:text-slate-400">Actual Data</span>
                    </div>
                </div>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: textColor, fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: textColor, fontSize: 12 }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }} />
                        <Legend verticalAlign="top" align="right" height={36} content={() => null} />

                        <Bar
                            dataKey="plan"
                            name="Scenario"
                            radius={[4, 4, 0, 0]}
                            barSize={40}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={isDark ? 'rgba(71, 85, 105, 0.4)' : 'rgba(148, 163, 184, 0.3)'}
                                    stroke={isDark ? '#475569' : '#cbd5e1'}
                                />
                            ))}
                        </Bar>

                        <Line
                            type="monotone"
                            dataKey="live"
                            name="Actual Data"
                            stroke="#6366f1"
                            strokeWidth={4}
                            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#ffffff' }}
                            activeDot={{ r: 7, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
