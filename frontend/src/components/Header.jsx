import { ChevronLeft, ChevronRight, Edit3, Save, X, Wallet, FileDown, Loader2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Header({
    year,
    onYearChange,
    editMode,
    onEditModeToggle,
    onSave,
    onCancel,
    hasChanges,
    loading,
    onExportPDF,
    isExporting,
    activeTab
}) {
    const { isDark, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

    return (
        <header className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <img
                        src="/logo.png"
                        alt="moneystill logo"
                        className="w-12 h-12 object-contain transition-all"
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                            money<span className="font-light text-slate-500">still</span>
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Budget Planner</p>
                    </div>
                </div>

                {/* Year Selector */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    <button
                        onClick={() => onYearChange(year - 1)}
                        disabled={loading}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Previous year"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <select
                        value={year}
                        onChange={(e) => onYearChange(parseInt(e.target.value))}
                        disabled={loading}
                        className="bg-white dark:bg-slate-700 dark:text-white px-4 py-2 rounded-lg font-semibold text-lg border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => onYearChange(year + 1)}
                        disabled={loading}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Next year"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* User Info */}
                {user && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm" data-pdf-hide>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden md:block">
                                {user.email}
                            </span>
                        </div>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <button
                            onClick={signOut}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Edit Mode Controls */}
                <div className="flex items-center gap-2" data-pdf-hide>
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 
                                   rounded-xl transition-colors"
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDark ? (
                            <Sun className="w-5 h-5 text-amber-500" />
                        ) : (
                            <Moon className="w-5 h-5 text-slate-600" />
                        )}
                    </button>

                    {/* PDF Export Button */}
                    <button
                        onClick={onExportPDF}
                        disabled={loading || isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 
                         hover:from-slate-700 hover:to-slate-800 text-white rounded-xl font-medium 
                         shadow-lg shadow-slate-500/25 transition-all disabled:opacity-50"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FileDown className="w-4 h-4" />
                                PDF Export
                            </>
                        )}
                    </button>

                    {activeTab === 'overview' && (
                        editMode ? (
                            <>
                                <button
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 
                             text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                                <button
                                    onClick={onSave}
                                    disabled={loading || !hasChanges}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 
                             hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium 
                             shadow-lg shadow-green-500/25 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    <Save className="w-4 h-4" />
                                    Save
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onEditModeToggle}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 
                           hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium 
                           shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </button>
                        )
                    )}
                </div>
            </div>
        </header>
    );
}

