import { TableProperties, BarChart3, Lightbulb } from 'lucide-react';

export default function TabNav({ activeTab, onTabChange, disabled }) {
    const tabs = [
        { id: 'overview', label: 'Overview', icon: TableProperties },
        { id: 'analysis', label: 'Analysis', icon: BarChart3 },
        { id: 'planning', label: 'Planning', icon: Lightbulb },
    ];

    return (
        <div className="glass rounded-xl p-1 mb-6 inline-flex">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    disabled={disabled}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all
                        ${activeTab === tab.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
