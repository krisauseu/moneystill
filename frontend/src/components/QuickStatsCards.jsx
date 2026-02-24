import { Percent, TrendingUp, Trophy } from 'lucide-react';

export default function QuickStatsCards({ summary, data, loading, selectedMonth = 0 }) {
    // Helper to get amount for a category in a specific month or sum of all months
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

    // Calculate income and expenses based on filter
    const calcTotals = () => {
        let income = 0;
        let expense = 0;

        data?.forEach(cat => {
            const total = getCategoryTotal(cat);
            if (cat.type === 'income') {
                income += total;
            } else if (cat.type === 'expense') {
                expense += total;
            }
        });

        return { income, expense, balance: income - expense };
    };

    const { income, expense, balance } = calcTotals();

    // Calculate savings rate
    const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

    // Calculate average monthly surplus (only relevant for full year)
    const avgMonthlySurplus = selectedMonth === 0 ? balance / 12 : balance;
    const surplusLabel = selectedMonth === 0 ? 'Avg. Surplus / Month' : 'Surplus';
    const surplusSubtitle = selectedMonth === 0
        ? 'Average monthly balance'
        : 'Balance for this month';

    // Find Top 5 expense categories (excluding "Rent")
    const expenseCategories = data?.filter(cat =>
        cat.type === 'expense' &&
        cat.name.toLowerCase() !== 'rent'
    ) || [];

    const topExpenses = expenseCategories
        .map(cat => ({
            name: cat.name,
            total: getCategoryTotal(cat)
        }))
        .filter(cat => cat.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    // Calculate total expenses for progress bar (excluding Rent)
    const totalExpensesExclRent = topExpenses.reduce((sum, cat) => sum + cat.total, 0);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-3"></div>
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Savings Rate Card */}
            <div className={`glass rounded-2xl p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30
                         border border-white/50 dark:border-emerald-900/30 shadow-xl shadow-emerald-500/20 transition-transform hover:scale-[1.02]`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Savings Rate</span>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 
                                  flex items-center justify-center shadow-lg">
                        <Percent className="w-5 h-5 text-white" />
                    </div>
                </div>
                <p className={`text-2xl font-bold ${parseFloat(savingsRate) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'} truncate`}>
                    {savingsRate}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Percentage of income saved</p>
            </div>

            {/* Surplus Card */}
            <div className={`glass rounded-2xl p-6 bg-gradient-to-br ${avgMonthlySurplus >= 0 ? 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30' : 'from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30'} 
                         border border-white/50 dark:border-slate-800 shadow-xl ${avgMonthlySurplus >= 0 ? 'shadow-blue-500/20' : 'shadow-red-500/20'} transition-transform hover:scale-[1.02]`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{surplusLabel}</span>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avgMonthlySurplus >= 0 ? 'from-blue-500 to-indigo-600' : 'from-red-500 to-pink-600'} 
                                  flex items-center justify-center shadow-lg`}>
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                </div>
                <p className={`text-2xl font-bold ${avgMonthlySurplus >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'} truncate`}>
                    {formatCurrency(avgMonthlySurplus)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{surplusSubtitle}</p>
            </div>

            {/* Top 5 Expenses Card */}
            <div className="glass rounded-2xl p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30
                         border border-white/50 dark:border-amber-900/30 shadow-xl shadow-amber-500/20 transition-transform hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Top 5 Expenses</span>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 
                                  flex items-center justify-center shadow-lg">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                </div>

                {topExpenses.length > 0 ? (
                    <div className="space-y-2">
                        {topExpenses.map((cat, index) => {
                            const percentage = totalExpensesExclRent > 0
                                ? (cat.total / totalExpensesExclRent) * 100
                                : 0;
                            return (
                                <div key={cat.name} className="group">
                                    <div className="flex items-center justify-between text-xs mb-0.5">
                                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate flex-1 mr-2" title={cat.name}>
                                            {index + 1}. {cat.name}
                                        </span>
                                        <span className="text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">
                                            {formatCurrency(cat.total)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No expenses recorded</p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">excl. Rent</p>
            </div>
        </div>
    );
}
