import {
    ComposedChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceArea,
    ReferenceDot,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export default function TrendChart({ data, loading, selectedMonth = 0 }) {
    const { isDark } = useTheme();

    // Theme-aware colors
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const axisColor = isDark ? '#475569' : '#cbd5e1';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const tooltipBorder = isDark ? 'border-slate-700' : 'border-white/50';
    const tooltipText = isDark ? 'text-slate-200' : 'text-slate-800';
    const legendText = isDark ? 'text-slate-400' : 'text-slate-600';
    const monthlyData = MONTHS.map((month, index) => {
        const monthNum = index + 1;

        let income = 0;
        let expense = 0;

        data?.forEach(cat => {
            const monthValue = cat.monthly_values?.find(mv => mv.month === monthNum);
            const amount = monthValue?.amount || 0;

            if (cat.type === 'income') {
                income += amount;
            } else if (cat.type === 'expense') {
                expense += amount;
            }
        });

        return {
            month,
            monthNum,
            income,
            expense,
            surplus: income - expense,
            isSelected: selectedMonth === monthNum,
        };
    });

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
            const isSelected = selectedMonth > 0 && MONTHS[selectedMonth - 1] === label;
            return (
                <div className={`glass rounded-xl p-4 shadow-xl border ${isSelected ? 'border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900' : tooltipBorder}`}>
                    <p className={`font-semibold mb-2 ${isSelected ? 'text-blue-700 dark:text-blue-400' : tooltipText}`}>
                        {label} {isSelected && '(ausgewählt)'}
                    </p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Custom dot renderer to highlight selected month
    const renderCustomDot = (props, isSelected) => {
        const { cx, cy, stroke, dataKey } = props;

        if (props.payload?.isSelected && selectedMonth > 0) {
            return (
                <g>
                    {/* Outer glow */}
                    <circle cx={cx} cy={cy} r={10} fill={stroke} fillOpacity={0.2} />
                    {/* Main dot */}
                    <circle cx={cx} cy={cy} r={6} fill={stroke} stroke="white" strokeWidth={2} />
                </g>
            );
        }

        return (
            <circle cx={cx} cy={cy} r={4} fill={stroke} strokeWidth={2} />
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

    // Calculate ReferenceArea position for selected month
    const selectedIndex = selectedMonth > 0 ? selectedMonth - 1 : -1;
    const showReferenceArea = selectedMonth > 0;

    return (
        <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Annual Trend</h3>
                {selectedMonth > 0 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg font-medium">
                        {MONTHS[selectedMonth - 1]} highlighted
                    </span>
                )}
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyData}>
                        <defs>
                            <linearGradient id="surplusGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="highlightGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />

                        {/* Highlight reference area for selected month */}
                        {showReferenceArea && (
                            <ReferenceArea
                                x1={MONTHS[selectedIndex]}
                                x2={MONTHS[selectedIndex]}
                                y1={0}
                                fill="url(#highlightGradient)"
                                fillOpacity={1}
                                stroke="#3b82f6"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                            />
                        )}

                        <XAxis
                            dataKey="month"
                            tick={({ x, y, payload }) => {
                                const isSelected = selectedMonth > 0 && MONTHS[selectedMonth - 1] === payload.value;
                                return (
                                    <g transform={`translate(${x},${y})`}>
                                        {isSelected && (
                                            <rect
                                                x={-16}
                                                y={2}
                                                width={32}
                                                height={18}
                                                rx={4}
                                                fill="#3b82f6"
                                            />
                                        )}
                                        <text
                                            x={0}
                                            y={12}
                                            dy={2}
                                            textAnchor="middle"
                                            fill={isSelected ? '#ffffff' : textColor}
                                            fontSize={12}
                                            fontWeight={isSelected ? 600 : 400}
                                        >
                                            {payload.value}
                                        </text>
                                    </g>
                                );
                            }}
                            axisLine={{ stroke: axisColor }}
                            tickLine={false}
                            height={30}
                        />
                        <YAxis
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            tick={{ fill: textColor, fontSize: 12 }}
                            axisLine={{ stroke: axisColor }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => (
                                <span className={`${legendText} text-sm`}>{value}</span>
                            )}
                        />
                        <Area
                            type="monotone"
                            dataKey="surplus"
                            name="Surplus"
                            stroke="transparent"
                            fill="url(#surplusGradient)"
                        />
                        <Line
                            type="monotone"
                            dataKey="income"
                            name="Income"
                            stroke="#22c55e"
                            strokeWidth={3}
                            dot={(props) => renderCustomDot(props)}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="expense"
                            name="Expenses"
                            stroke="#f97316"
                            strokeWidth={3}
                            dot={(props) => renderCustomDot(props)}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
