import { useState, useEffect, useCallback, useRef } from 'react';
import { Lightbulb, Plus, Trash2, AlertCircle, Wrench, Save, X, TrendingUp } from 'lucide-react';
import SummaryCards from './SummaryCards';
import BudgetTable from './BudgetTable';
import ScenarioModal from './ScenarioModal';
import ConfirmDialog from './ConfirmDialog';
import {
    getValuesByYear,
    getSummary,
    batchUpdateValues,
    createCategory,
    updateCategory,
    deleteCategory,
    getScenarios,
    createScenario,
    deleteScenario
} from '../api/budgetApi';
import ComparisonChart from './ComparisonChart';
import { mergeScenarioData } from '../utils/chartDataMapper';

export default function PlanningView({ year, onAddCategory, onUpdateCategory }) {
    const [scenarios, setScenarios] = useState([]);
    const [activeScenario, setActiveScenario] = useState(null); // null = Live data
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [liveSummary, setLiveSummary] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [pendingChanges, setPendingChanges] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [autoFillFlash, setAutoFillFlash] = useState(null);
    const chartRef = useRef(null);

    // Fetch scenarios for the current year
    const fetchScenarios = useCallback(async () => {
        try {
            const scenariosData = await getScenarios(year);
            setScenarios(scenariosData);
        } catch (err) {
            console.error('Error fetching scenarios:', err);
        }
    }, [year]);

    // Fetch data for active scenario or live
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const scenarioId = activeScenario?.id || null;

            // Promise array for parallel requests
            const requests = [
                getValuesByYear(year, scenarioId),
                getSummary(year, scenarioId),
            ];

            // If a scenario is active, also fetch the live summary for comparison
            if (scenarioId) {
                requests.push(getSummary(year, null));
            }

            const results = await Promise.all(requests);

            setData(results[0]);
            setSummary(results[1]);

            if (scenarioId) {
                setLiveSummary(results[2]);
            } else {
                setLiveSummary(null);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error loading data.');
        } finally {
            setLoading(false);
        }
    }, [year, activeScenario]);

    useEffect(() => {
        fetchScenarios();
    }, [fetchScenarios]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);



    const handleScenarioChange = (e) => {
        const scenarioId = e.target.value;
        if (scenarioId === 'live') {
            setActiveScenario(null);
        } else {
            const scenario = scenarios.find(s => s.id === scenarioId);
            setActiveScenario(scenario);
        }
        setPendingChanges({});
        setEditMode(false);
    };

    const handleCreateScenario = async (name, copyFromLive) => {
        try {
            const newScenario = await createScenario(name, year, copyFromLive);
            await fetchScenarios();
            setActiveScenario(newScenario);
        } catch (err) {
            console.error('Error creating scenario:', err);
            setError('Error creating scenario.');
        }
    };

    const handleDeleteScenario = async () => {
        if (!activeScenario) return;

        try {
            await deleteScenario(activeScenario.id);
            await fetchScenarios();
            setActiveScenario(null);
            setShowDeleteConfirm(false);
        } catch (err) {
            console.error('Error deleting scenario:', err);
            setError('Error deleting scenario.');
        }
    };

    const handleValueChange = (categoryId, month, amount) => {
        const key = `${categoryId}-${month}`;
        setPendingChanges(prev => ({
            ...prev,
            [key]: {
                category_id: categoryId,
                year,
                month,
                amount,
                scenario_id: activeScenario?.id || null
            }
        }));

        setData(prevData =>
            prevData.map(category => {
                if (category.category_id !== categoryId) return category;

                const existingMonth = category.monthly_values?.find(mv => mv.month === month);
                if (existingMonth) {
                    return {
                        ...category,
                        monthly_values: category.monthly_values.map(mv =>
                            mv.month === month ? { ...mv, amount } : mv
                        )
                    };
                } else {
                    return {
                        ...category,
                        monthly_values: [...(category.monthly_values || []), { month, amount }]
                    };
                }
            })
        );
    };

    const handleAutoFill = async (categoryId, startMonth, amount) => {
        const updates = [];
        for (let month = startMonth; month <= 12; month++) {
            const key = `${categoryId}-${month}`;
            updates.push({
                category_id: categoryId,
                year,
                month,
                amount,
                scenario_id: activeScenario?.id || null
            });
            setPendingChanges(prev => ({
                ...prev,
                [key]: {
                    category_id: categoryId,
                    year,
                    month,
                    amount,
                    scenario_id: activeScenario?.id || null
                }
            }));
        }

        setData(prevData =>
            prevData.map(category => {
                if (category.category_id !== categoryId) return category;

                // Merge new values into existing monthly_values
                const existingValues = [...(category.monthly_values || [])];
                for (let month = startMonth; month <= 12; month++) {
                    const idx = existingValues.findIndex(mv => mv.month === month);
                    if (idx > -1) {
                        existingValues[idx] = { ...existingValues[idx], amount };
                    } else {
                        existingValues.push({ month, amount });
                    }
                }

                return {
                    ...category,
                    monthly_values: existingValues
                };
            })
        );

        setAutoFillFlash({ categoryId, timestamp: Date.now() });
        setTimeout(() => setAutoFillFlash(null), 600);
    };

    const handleDeleteCategory = async (categoryId) => {
        setSaving(true);
        try {
            await deleteCategory(categoryId);
            await fetchData();
        } catch (err) {
            console.error('Error deleting category:', err);
            setError('Error deleting category.');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        const changesToSave = { ...pendingChanges };
        if (Object.keys(changesToSave).length === 0) {
            setEditMode(false);
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const updates = Object.values(changesToSave);
            console.log('PlanningView: Saving updates:', updates);
            await batchUpdateValues(updates);
            await fetchData();
            setPendingChanges({});
            setEditMode(false);
        } catch (err) {
            console.error('Save error:', err);
            setError('Error saving. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (Object.keys(pendingChanges).length > 0) {
            if (!confirm('All unsaved changes will be discarded. Continue?')) {
                return;
            }
        }
        setPendingChanges({});
        setEditMode(false);
        fetchData();
    };

    const scrollToChart = () => {
        chartRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="space-y-6">
            {/* Scenario Control Bar */}
            <div className="glass rounded-xl p-5 border-2 border-violet-200 dark:border-violet-800">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Lightbulb className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Scenario Planning
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Experiment with different budget scenarios
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                        {/* Scenario Selector */}
                        <select
                            value={activeScenario?.id || 'live'}
                            onChange={handleScenarioChange}
                            className="flex-1 lg:flex-none px-4 py-2.5 bg-white dark:bg-slate-800 border border-violet-300 dark:border-violet-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-violet-500"
                            disabled={loading}
                        >
                            <option value="live">Live Data (Real-time)</option>
                            {scenarios.map(scenario => (
                                <option key={scenario.id} value={scenario.id}>
                                    {scenario.name}
                                </option>
                            ))}
                        </select>

                        {/* Analysis Scroll Button (only visible in planning mode) */}
                        {activeScenario && (
                            <button
                                onClick={scrollToChart}
                                className="animate-analysis-entry flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-medium transition-all group"
                                title="Jump to analysis chart"
                            >
                                <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline">Analysis</span>
                            </button>
                        )}

                        {/* New Scenario Button */}
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 font-medium shadow-lg shadow-violet-500/25 transition-all"
                            disabled={loading}
                        >
                            <Plus className="w-4 h-4" />
                            New Scenario
                        </button>

                        {/* Delete Scenario Button */}
                        {activeScenario && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 font-medium transition-colors"
                                disabled={loading}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Scenario
                            </button>
                        )}

                        {/* Edit Mode Toggle / Save Cancel Buttons */}
                        {!editMode ? (
                            <button
                                onClick={() => setEditMode(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 font-medium shadow-lg shadow-violet-500/25 transition-all"
                                disabled={loading}
                                title="Enable edit mode"
                            >
                                <Wrench className="w-4 h-4" />
                                <span className="hidden sm:inline">Edit</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium shadow-lg shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading || saving}
                                >
                                    <Save className="w-4 h-4" />
                                    <span className="hidden sm:inline">Save</span>
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-all"
                                    disabled={loading || saving}
                                >
                                    <X className="w-4 h-4" />
                                    <span className="hidden sm:inline">Cancel</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Active Scenario Badge */}
                {activeScenario && (
                    <div className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-800">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/50 border-2 border-violet-300 dark:border-violet-700 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            <span className="font-bold text-violet-900 dark:text-violet-100">
                                PLANNING MODE: {activeScenario.name}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Summary Cards */}
            <SummaryCards summary={summary} loading={loading} />

            {/* Budget Table */}
            <BudgetTable
                data={data}
                summary={summary}
                editMode={editMode}
                onChange={handleValueChange}
                loading={loading}
                year={year}
                onAddCategory={onAddCategory}
                onUpdateCategory={onUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onAutoFill={handleAutoFill}
                autoFillFlash={autoFillFlash}
            />

            {/* Comparison Chart - Only show when a scenario is active */}
            {activeScenario && liveSummary && summary && (
                <div ref={chartRef} className="scroll-mt-24">
                    <ComparisonChart
                        data={mergeScenarioData(liveSummary, summary)}
                        loading={loading}
                        scenarioName={activeScenario.name}
                    />
                </div>
            )}



            {/* Modals */}
            <ScenarioModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onCreate={handleCreateScenario}
                year={year}
            />

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteScenario}
                title="Delete Scenario"
                message={`Are you sure you want to delete the scenario "${activeScenario?.name}"? All associated data will be permanently deleted.`}
                confirmText="Delete"
                confirmStyle="danger"
            />
        </div>
    );
}
