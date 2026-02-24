import { useState, useEffect, useCallback } from 'react';
import { Loader2, Pencil, Trash2, Plus, Check, X, ArrowRightToLine } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthlyInput = ({ initialValue, onBlur, isFlashing, className }) => {
    const [localValue, setLocalValue] = useState(
        initialValue !== 0 ? initialValue.toFixed(2) : ''
    );

    // Sync local value when initialValue changes from outside (e.g., Auto-Fill)
    useEffect(() => {
        setLocalValue(initialValue !== 0 ? initialValue.toFixed(2) : '');
    }, [initialValue]);

    return (
        <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => onBlur(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur();
                if (e.key === 'Escape') {
                    setLocalValue(initialValue !== 0 ? initialValue.toFixed(2) : '');
                    e.target.blur();
                }
            }}
            className={`${className} ${isFlashing ? 'auto-fill-flash' : ''}`}
            placeholder="-"
        />
    );
};

export default function BudgetTable({
    data,
    summary,
    editMode,
    onChange,
    loading,
    year,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    onAutoFill,
    autoFillFlash
}) {
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [addingToSection, setAddingToSection] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const formatCurrency = (value, showZero = false) => {
        if (!showZero && (value === 0 || value === null || value === undefined)) {
            return '-';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value || 0);
    };

    const parseCurrency = (value) => {
        if (value === null || value === undefined || value === '') return 0;

        // Convert to string and handle common US formats
        let cleaned = value.toString()
            .trim()
            .replace(/[$\s]/g, ''); // Remove currency and spaces

        if (cleaned === '-' || cleaned === '') return 0;

        // Handle US formatting where , is thousand separator and . is decimal
        if (cleaned.includes(',') && cleaned.includes('.')) {
            // US format: 1,234.56
            cleaned = cleaned.replace(/,/g, '');
        } else if (cleaned.includes(',')) {
            // Could be thousands separator without decimal: 1,234
            cleaned = cleaned.replace(/,/g, '');
        }

        const result = parseFloat(cleaned);
        return isNaN(result) ? 0 : result;
    };

    const getValueForMonth = (category, month) => {
        const monthData = category.monthly_values?.find(mv => mv.month === month);
        return monthData?.amount || 0;
    };

    const getCategoryYearlyTotal = (category) => {
        if (!category.monthly_values) return 0;
        return category.monthly_values.reduce((sum, mv) => sum + parseFloat(mv.amount || 0), 0);
    };

    const handleValueChange = (categoryId, month, value) => {
        onChange(categoryId, month, parseCurrency(value));
    };

    // Group categories
    const incomeCategories = data.filter(c => c.type === 'income');
    const fixedExpenseCategories = data.filter(c => c.type === 'expense' && c.is_fixed);
    const variableExpenseCategories = data.filter(c => c.type === 'expense' && !c.is_fixed);

    // Calculate totals
    const getMonthlyIncome = (month) => {
        return incomeCategories.reduce((sum, cat) => sum + getValueForMonth(cat, month), 0);
    };

    const getMonthlyFixedExpense = (month) => {
        return fixedExpenseCategories.reduce((sum, cat) => sum + getValueForMonth(cat, month), 0);
    };

    const getMonthlyVariableExpense = (month) => {
        return variableExpenseCategories.reduce((sum, cat) => sum + getValueForMonth(cat, month), 0);
    };

    const getMonthlyTotalExpense = (month) => {
        return getMonthlyFixedExpense(month) + getMonthlyVariableExpense(month);
    };

    const getMonthlyBalance = (month) => {
        return getMonthlyIncome(month) - getMonthlyTotalExpense(month);
    };

    const getYearlyIncomeTotal = () => {
        return incomeCategories.reduce((sum, cat) => sum + getCategoryYearlyTotal(cat), 0);
    };

    const getYearlyFixedExpenseTotal = () => {
        return fixedExpenseCategories.reduce((sum, cat) => sum + getCategoryYearlyTotal(cat), 0);
    };

    const getYearlyVariableExpenseTotal = () => {
        return variableExpenseCategories.reduce((sum, cat) => sum + getCategoryYearlyTotal(cat), 0);
    };

    const getYearlyTotalExpense = () => {
        return getYearlyFixedExpenseTotal() + getYearlyVariableExpenseTotal();
    };

    const getYearlyBalance = () => {
        return getYearlyIncomeTotal() - getYearlyTotalExpense();
    };

    // Category management handlers
    const handleStartEdit = (category) => {
        setEditingCategory(category.category_id);
        setEditingName(category.name);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setEditingName('');
    };

    const handleSaveEdit = async (category) => {
        if (editingName.trim() && editingName !== category.name) {
            await onUpdateCategory(category.category_id, {
                name: editingName.trim(),
                type: category.type,
                is_fixed: category.is_fixed,
                display_order: category.display_order
            });
        }
        setEditingCategory(null);
        setEditingName('');
    };

    const handleDeleteClick = (category) => {
        setDeleteConfirm(category);
    };

    const handleConfirmDelete = async () => {
        if (deleteConfirm) {
            await onDeleteCategory(deleteConfirm.category_id);
            setDeleteConfirm(null);
        }
    };

    const handleStartAdd = (sectionType) => {
        setAddingToSection(sectionType);
        setNewCategoryName('');
    };

    const handleCancelAdd = () => {
        setAddingToSection(null);
        setNewCategoryName('');
    };

    const handleSaveAdd = async () => {
        if (newCategoryName.trim()) {
            const isFixed = addingToSection === 'fixed';
            const type = addingToSection === 'income' ? 'income' : 'expense';
            await onAddCategory({
                name: newCategoryName.trim(),
                type,
                is_fixed: isFixed
            });
        }
        setAddingToSection(null);
        setNewCategoryName('');
    };

    if (loading) {
        return (
            <div className="glass rounded-2xl p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-slate-600 dark:text-slate-400">Loading data...</span>
            </div>
        );
    }

    const renderValueCell = (category, month) => {
        const value = getValueForMonth(category, month);
        const isFlashing = autoFillFlash?.categoryId === category.category_id;

        if (editMode) {
            return (
                <div className="flex items-center justify-end gap-1 group/cell">
                    <MonthlyInput
                        initialValue={value}
                        onBlur={(newVal) => handleValueChange(category.category_id, month, newVal)}
                        isFlashing={isFlashing}
                        className="value-input w-14"
                    />
                    <button
                        onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling;
                            const inputVal = input?.value || '';
                            onAutoFill(category.category_id, month, parseCurrency(inputVal) || value);
                        }}
                        className="flex items-center justify-center p-2.5 bg-indigo-600 dark:bg-indigo-500 
                                   text-white rounded-lg transition-all shadow-sm active:scale-95
                                   sm:opacity-0 sm:group-hover/cell:opacity-100 min-w-[36px] min-h-[36px]"
                        title="Auto-fill forward (from here)"
                    >
                        <ArrowRightToLine className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        return (
            <span className={value === 0 ? 'text-slate-300 dark:text-slate-600' : ''}>
                {formatCurrency(value)}
            </span>
        );
    };

    const renderCategoryNameCell = (category, bgClass = 'bg-white dark:bg-slate-800/50') => {
        const isEditing = editingCategory === category.category_id;

        if (isEditing) {
            return (
                <td className={`py-2 px-4 sticky left-0 ${bgClass} z-10`}>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(category);
                                if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 
                                       focus:ring-blue-500 focus:border-blue-500 text-sm w-32
                                       bg-white dark:bg-slate-800 dark:text-white"
                            autoFocus
                        />
                        <button
                            onClick={() => handleSaveEdit(category)}
                            className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </td>
            );
        }

        return (
            <td className={`py-2 px-4 sticky left-0 ${bgClass} z-10 group`}>
                <div className="flex items-center gap-2">
                    <span className="truncate">{category.name}</span>
                    {editMode && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleStartEdit(category)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                                title="Rename"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => handleDeleteClick(category)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </td>
        );
    };

    const renderSectionHeader = (title, bgColor, darkBgColor) => (
        <tr>
            <td
                colSpan={14}
                className={`${bgColor} ${darkBgColor} font-semibold text-sm py-2 px-4 sticky left-0`}
            >
                {title}
            </td>
        </tr>
    );

    const renderAddCategoryRow = (sectionType, bgColor) => {
        if (!editMode) return null;

        const isAdding = addingToSection === sectionType;

        if (isAdding) {
            return (
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/30">
                    <td className="py-2 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveAdd();
                                    if (e.key === 'Escape') handleCancelAdd();
                                }}
                                placeholder="Category name..."
                                className="px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 
                                           focus:ring-blue-500 focus:border-blue-500 text-sm w-40
                                           bg-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                                autoFocus
                            />
                            <button
                                onClick={handleSaveAdd}
                                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                                disabled={!newCategoryName.trim()}
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCancelAdd}
                                className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                    <td colSpan={13}></td>
                </tr>
            );
        }

        return (
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/30">
                <td className="py-2 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10">
                    <button
                        onClick={() => handleStartAdd(sectionType)}
                        className={`flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                                    hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors`}
                    >
                        <Plus className="w-4 h-4" />
                        Add category
                    </button>
                </td>
                <td colSpan={13}></td>
            </tr>
        );
    };

    const renderTotalRow = (title, getMonthlyValue, getYearlyValue, bgColor, darkBgColor, textColor = '', darkTextColor = '') => (
        <tr className={`${bgColor} ${darkBgColor} font-semibold`}>
            <td className={`py-2 px-4 sticky left-0 ${bgColor} ${darkBgColor} ${textColor} ${darkTextColor}`}>
                {title}
            </td>
            {MONTHS.map((_, idx) => {
                const value = getMonthlyValue(idx + 1);
                return (
                    <td
                        key={idx}
                        className={`py-2 transition-all duration-300 text-right ${textColor} ${darkTextColor} ${editMode ? 'pl-2 pr-8' : 'px-2'
                            }`}
                    >
                        {formatCurrency(value, true)}
                    </td>
                );
            })}
            <td className={`py-2 px-4 text-right font-bold ${textColor} ${darkTextColor}`}>
                {formatCurrency(getYearlyValue(), true)}
            </td>
        </tr>
    );

    const renderBalanceRow = () => {
        const yearlyBalance = getYearlyBalance();
        const isPositive = yearlyBalance >= 0;

        return (
            <tr className={`font-bold text-lg ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <td className={`py-3 px-4 sticky left-0 ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'}`}>
                    Surplus / Deficit
                </td>
                {MONTHS.map((_, idx) => {
                    const value = getMonthlyBalance(idx + 1);
                    const cellPositive = value >= 0;
                    return (
                        <td
                            key={idx}
                            className={`py-3 transition-all duration-300 text-right ${cellPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                                } ${editMode ? 'pl-2 pr-8' : 'px-2'}`}
                        >
                            {formatCurrency(value, true)}
                        </td>
                    );
                })}
                <td className={`py-3 px-4 text-right ${isPositive ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                    {formatCurrency(yearlyBalance, true)}
                </td>
            </tr>
        );
    };

    return (
        <>
            <div className="glass rounded-2xl">
                <div className="overflow-x-auto w-full">
                    <table className="w-full min-w-max text-sm">
                        <thead>
                            <tr className="bg-slate-800 text-white">
                                <th className="py-3 px-4 text-left font-semibold sticky left-0 bg-slate-800 z-10 min-w-[180px]">
                                    Category
                                </th>
                                {MONTHS.map((month) => (
                                    <th
                                        key={month}
                                        className={`py-3 font-semibold transition-all duration-300 text-right ${editMode ? 'pl-2 pr-8 min-w-[100px]' : 'px-2 min-w-[70px]'
                                            }`}
                                    >
                                        {month}
                                    </th>
                                ))}
                                <th className="py-3 px-4 text-right font-semibold min-w-[110px] bg-slate-700">
                                    Annual Total
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* INCOME Section */}
                            {renderSectionHeader('Income', 'bg-green-200 text-green-900', 'dark:bg-green-900/40 dark:text-green-300')}

                            {incomeCategories.map((category) => (
                                <tr key={category.category_id} className="border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    {renderCategoryNameCell(category)}
                                    {MONTHS.map((_, idx) => (
                                        <td key={idx} className="py-2 px-2 text-right">
                                            {renderValueCell(category, idx + 1)}
                                        </td>
                                    ))}
                                    <td className="py-2 px-4 text-right font-medium bg-slate-50 dark:bg-slate-800/50">
                                        {formatCurrency(getCategoryYearlyTotal(category), true)}
                                    </td>
                                </tr>
                            ))}

                            {renderAddCategoryRow('income', 'bg-green-100')}

                            {/* Total Income */}
                            {renderTotalRow('Total / Month', getMonthlyIncome, getYearlyIncomeTotal, 'bg-green-100', 'dark:bg-green-900/30', 'text-green-800', 'dark:text-green-400')}

                            {/* Spacer */}
                            <tr><td colSpan={14} className="py-2"></td></tr>

                            {/* FIXED EXPENSES Section */}
                            {renderSectionHeader('Fixed Expenses', 'bg-amber-200 text-amber-900', 'dark:bg-amber-900/40 dark:text-amber-300')}

                            {fixedExpenseCategories.map((category) => (
                                <tr key={category.category_id} className="border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    {renderCategoryNameCell(category)}
                                    {MONTHS.map((_, idx) => (
                                        <td key={idx} className="py-2 px-2 text-right">
                                            {renderValueCell(category, idx + 1)}
                                        </td>
                                    ))}
                                    <td className="py-2 px-4 text-right font-medium bg-slate-50 dark:bg-slate-800/50">
                                        {formatCurrency(getCategoryYearlyTotal(category), true)}
                                    </td>
                                </tr>
                            ))}

                            {renderAddCategoryRow('fixed', 'bg-amber-100')}

                            {/* Spacer before variable */}
                            <tr><td colSpan={14} className="py-1"></td></tr>

                            {/* VARIABLE EXPENSES Section */}
                            {renderSectionHeader('Variable Expenses', 'bg-orange-200 text-orange-900', 'dark:bg-orange-900/40 dark:text-orange-300')}

                            {variableExpenseCategories.map((category) => (
                                <tr key={category.category_id} className="border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    {renderCategoryNameCell(category)}
                                    {MONTHS.map((_, idx) => (
                                        <td key={idx} className="py-2 px-2 text-right">
                                            {renderValueCell(category, idx + 1)}
                                        </td>
                                    ))}
                                    <td className="py-2 px-4 text-right font-medium bg-slate-50 dark:bg-slate-800/50">
                                        {formatCurrency(getCategoryYearlyTotal(category), true)}
                                    </td>
                                </tr>
                            ))}

                            {renderAddCategoryRow('variable', 'bg-orange-100')}

                            {/* Total Expenses */}
                            {renderTotalRow('Total Expenses', getMonthlyTotalExpense, getYearlyTotalExpense, 'bg-orange-100', 'dark:bg-orange-900/30', 'text-orange-800', 'dark:text-orange-400')}

                            {/* Spacer */}
                            <tr><td colSpan={14} className="py-2"></td></tr>

                            {/* BALANCE Row */}
                            {renderBalanceRow()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm !== null}
                title="Delete Category"
                message={`Are you sure you want to delete the category "${deleteConfirm?.name}"? All associated values will be lost.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirm(null)}
                destructive={true}
            />
        </>
    );
}
