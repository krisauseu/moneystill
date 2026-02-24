import { useState } from 'react';
import { Calendar } from 'lucide-react';
import QuickStatsCards from './QuickStatsCards';
import ExpenseDistributionChart from './ExpenseDistributionChart';
import SankeyChart from './SankeyChart';
import TrendChart from './TrendChart';

const MONTHS = [
    { value: 0, label: 'Full Year' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

export default function AnalysisPage({ data, summary, year, loading }) {
    const [selectedMonth, setSelectedMonth] = useState(0); // 0 = Full Year

    return (
        <div className="space-y-6">
            {/* Month Selector */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">Period:</span>
                </div>
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="glass rounded-xl px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300
                             border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 
                             focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer
                             bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
                    disabled={loading}
                >
                    {MONTHS.map((month) => (
                        <option key={month.value} value={month.value}>
                            {month.label}
                        </option>
                    ))}
                </select>
                {selectedMonth > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                        {MONTHS[selectedMonth].label} {year}
                    </span>
                )}
            </div>

            {/* Quick Stats Cards */}
            <QuickStatsCards
                summary={summary}
                data={data}
                loading={loading}
                selectedMonth={selectedMonth}
            />

            {/* Sankey Flow Chart - full width */}
            <SankeyChart
                data={data}
                loading={loading}
                selectedMonth={selectedMonth}
            />

            {/* Charts Grid - responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Distribution (Doughnut) */}
                <ExpenseDistributionChart
                    data={data}
                    loading={loading}
                    selectedMonth={selectedMonth}
                />

                {/* Trend Chart (Area/Line) */}
                <TrendChart
                    data={data}
                    loading={loading}
                    selectedMonth={selectedMonth}
                />
            </div>
        </div>
    );
}
