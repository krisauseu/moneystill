import { ResponsiveSankey } from '@nivo/sankey';
import { useTheme } from '../context/ThemeContext';

// Same color palette as ExpenseDistributionChart
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

const INCOME_COLOR = '#22c55e';        // green-500
const TOTAL_INCOME_COLOR = '#10b981';  // emerald-500
const SONSTIGE_COLOR = '#94a3b8';      // slate-400

const TOP_N = 5;

function buildSankeyData(data, selectedMonth) {
    if (!data || data.length === 0) return null;

    const getCategoryTotal = (category) => {
        if (selectedMonth === 0) {
            return category.monthly_values?.reduce((sum, mv) => sum + (mv.amount || 0), 0) || 0;
        }
        const monthValue = category.monthly_values?.find(mv => mv.month === selectedMonth);
        return monthValue?.amount || 0;
    };

    // Calculate income categories
    const incomeCategories = data
        .filter(cat => cat.type === 'income')
        .map(cat => ({ name: cat.name, value: getCategoryTotal(cat) }))
        .filter(item => item.value > 0);

    const totalIncome = incomeCategories.reduce((sum, item) => sum + item.value, 0);
    if (totalIncome === 0) return null;

    // Calculate expense categories
    const expenseCategories = data
        .filter(cat => cat.type === 'expense')
        .map(cat => ({ name: cat.name, value: getCategoryTotal(cat) }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);

    const totalExpenses = expenseCategories.reduce((sum, item) => sum + item.value, 0);
    if (totalExpenses === 0) return null;

    // Top N + Sonstige grouping
    const topExpenses = expenseCategories.slice(0, TOP_N);
    const remainingExpenses = expenseCategories.slice(TOP_N);
    const sonstigeTotal = remainingExpenses.reduce((sum, item) => sum + item.value, 0);

    // Build nodes
    const nodes = [];
    const nodeColorMap = {};

    // Income nodes (left)
    incomeCategories.forEach((item) => {
        const id = `income_${item.name}`;
        nodes.push({ id, label: item.name });
        nodeColorMap[id] = INCOME_COLOR;
    });

    // Central node
    const totalId = 'Gesamteinkommen';
    nodes.push({ id: totalId, label: 'Gesamteinkommen' });
    nodeColorMap[totalId] = TOTAL_INCOME_COLOR;

    // Savings node (if income > expenses)
    const savings = totalIncome - totalExpenses;
    if (savings > 0) {
        nodes.push({ id: 'Sparen', label: 'Sparen' });
        nodeColorMap['Sparen'] = '#22d3ee'; // cyan-400
    }

    // Expense nodes (right) – top N
    topExpenses.forEach((item, index) => {
        const id = `expense_${item.name}`;
        nodes.push({ id, label: item.name });
        nodeColorMap[id] = COLORS[index % COLORS.length];
    });

    // Sonstige node
    if (sonstigeTotal > 0) {
        nodes.push({ id: 'Sonstige', label: 'Sonstige' });
        nodeColorMap['Sonstige'] = SONSTIGE_COLOR;
    }

    // Build links
    const links = [];

    // Income → Gesamteinkommen
    incomeCategories.forEach((item) => {
        links.push({
            source: `income_${item.name}`,
            target: totalId,
            value: item.value,
        });
    });

    // Gesamteinkommen → individual expenses
    topExpenses.forEach((item) => {
        links.push({
            source: totalId,
            target: `expense_${item.name}`,
            value: item.value,
        });
    });

    // Gesamteinkommen → Sonstige
    if (sonstigeTotal > 0) {
        links.push({
            source: totalId,
            target: 'Sonstige',
            value: sonstigeTotal,
        });
    }

    // Gesamteinkommen → Sparen
    if (savings > 0) {
        links.push({
            source: totalId,
            target: 'Sparen',
            value: savings,
        });
    }

    return { nodes, links, nodeColorMap, totalIncome };
}

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);

export default function SankeyChart({ data, loading, selectedMonth = 0 }) {
    const { isDark } = useTheme();

    const sankeyData = buildSankeyData(data, selectedMonth);

    if (loading) {
        return (
            <div className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4"></div>
                <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
            </div>
        );
    }

    if (!sankeyData) {
        return (
            <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Geldfluss</h3>
                <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    Keine Daten vorhanden
                </div>
            </div>
        );
    }

    const { nodes, links, nodeColorMap, totalIncome } = sankeyData;

    const CustomTooltip = ({ node }) => {
        const percent = totalIncome > 0 ? ((node.value / totalIncome) * 100).toFixed(1) : 0;
        return (
            <div className="glass rounded-xl p-3 shadow-xl border border-white/50 dark:border-slate-700">
                <p className="font-semibold text-slate-800 dark:text-white">{node.label}</p>
                <p className="text-slate-600 dark:text-slate-300">{formatCurrency(node.value)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{percent}% vom Einkommen</p>
            </div>
        );
    };

    const LinkTooltip = ({ link }) => {
        const percent = totalIncome > 0 ? ((link.value / totalIncome) * 100).toFixed(1) : 0;
        return (
            <div className="glass rounded-xl p-3 shadow-xl border border-white/50 dark:border-slate-700">
                <p className="font-semibold text-slate-800 dark:text-white">
                    {link.source.label} → {link.target.label}
                </p>
                <p className="text-slate-600 dark:text-slate-300">{formatCurrency(link.value)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{percent}% vom Einkommen</p>
            </div>
        );
    };

    const nivoTheme = {
        labels: {
            text: {
                fill: isDark ? '#e2e8f0' : '#1e293b', // slate-200 / slate-800
                fontSize: 13,
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                fontWeight: 600,
            },
        },
        tooltip: {
            container: {
                background: 'transparent',
                boxShadow: 'none',
                padding: 0,
            },
        },
    };

    return (
        <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Geldfluss</h3>
            <div className="h-[400px]">
                <ResponsiveSankey
                    data={{ nodes, links }}
                    theme={nivoTheme}
                    margin={{ top: 20, right: 160, bottom: 20, left: 160 }}
                    align="justify"
                    colors={(node) => nodeColorMap[node.id] || '#94a3b8'}
                    nodeOpacity={1}
                    nodeHoverOpacity={1}
                    nodeHoverOthersOpacity={0.25}
                    nodeThickness={18}
                    nodeSpacing={24}
                    nodeBorderWidth={0}
                    nodeBorderRadius={3}
                    linkOpacity={0.4}
                    linkHoverOpacity={0.7}
                    linkHoverOthersOpacity={0.1}
                    linkContract={3}
                    linkBlendMode={isDark ? 'screen' : 'multiply'}
                    enableLinkGradient={true}
                    labelPosition="outside"
                    labelOrientation="horizontal"
                    labelPadding={16}
                    label={(node) => node.label || node.id}
                    labelTextColor={(node) => nodeColorMap[node.id] || (isDark ? '#e2e8f0' : '#1e293b')}
                    nodeTooltip={CustomTooltip}
                    linkTooltip={LinkTooltip}
                    motionConfig="gentle"
                    animate={true}
                />
            </div>
        </div>
    );
}
