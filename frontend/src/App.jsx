import { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import TabNav from './components/TabNav';
import SummaryCards from './components/SummaryCards';
import BudgetTable from './components/BudgetTable';
import AnalysisPage from './components/AnalysisPage';
import PlanningView from './components/PlanningView';
import LoginPage from './components/LoginPage';
import OnboardingWizard from './components/OnboardingWizard';
import DangerZone from './components/DangerZone';
import SubscriptionBanner from './components/SubscriptionBanner';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import {
    getValuesByYear,
    getSummary,
    batchUpdateValues,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from './api/budgetApi';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import generatePDF from './utils/generatePDF';

function App() {
    const { user, loading: authLoading, canAccessPremium } = useAuth();
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [pendingChanges, setPendingChanges] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [autoFillFlash, setAutoFillFlash] = useState(null); // { categoryId, timestamp }
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'analysis'
    const [isExporting, setIsExporting] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // First check if user has any categories
            const categories = await getCategories();

            if (categories.length === 0) {
                setShowOnboarding(true);
                setLoading(false);
                return;
            }

            setShowOnboarding(false);

            const [valuesData, summaryData] = await Promise.all([
                getValuesByYear(year),
                getSummary(year),
            ]);
            setData(valuesData);
            setSummary(summaryData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error loading data. Please check your server connection.');
        } finally {
            setLoading(false);
        }
    }, [year, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Early returns AFTER all hooks
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    const handleYearChange = (newYear) => {
        if (Object.keys(pendingChanges).length > 0) {
            if (!confirm('You have unsaved changes. Do you want to continue?')) {
                return;
            }
        }
        setPendingChanges({});
        setEditMode(false);
        setYear(newYear);
    };

    const handleValueChange = (categoryId, month, amount) => {
        const key = `${categoryId}-${month}`;
        setPendingChanges(prev => ({
            ...prev,
            [key]: { category_id: categoryId, year, month, amount }
        }));

        // Also update local data for immediate feedback
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

    const handleSave = async () => {
        const changesToSave = { ...pendingChanges };
        if (Object.keys(changesToSave).length === 0) {
            setEditMode(false);
            return;
        }

        setSaving(true);
        try {
            const updates = Object.values(changesToSave);
            await batchUpdateValues(updates);
            await fetchData();
            setPendingChanges({});
            setEditMode(false);
        } catch (err) {
            console.error('Error saving changes:', err);
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
        fetchData(); // Reload original data
    };

    const handleEditModeToggle = () => {
        setEditMode(true);
    };

    // Category management handlers
    const handleAddCategory = async (categoryData) => {
        setSaving(true);
        try {
            await createCategory(categoryData);
            await fetchData();
        } catch (err) {
            console.error('Error adding category:', err);
            setError('Error adding category.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateCategory = async (categoryId, categoryData) => {
        setSaving(true);
        try {
            await updateCategory(categoryId, categoryData);
            await fetchData();
        } catch (err) {
            console.error('Error updating category:', err);
            setError('Error updating category.');
        } finally {
            setSaving(false);
        }
    };

    // Auto-Fill handler: copies value from startMonth to end of year
    const handleAutoFill = async (categoryId, startMonth, amount) => {
        // Build updates for months from startMonth to 12
        const updates = [];
        for (let month = startMonth; month <= 12; month++) {
            const key = `${categoryId}-${month}`;
            updates.push({ category_id: categoryId, year, month, amount });
            setPendingChanges(prev => ({
                ...prev,
                [key]: { category_id: categoryId, year, month, amount }
            }));
        }

        // Update local data immediately for relevant months
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

        // Trigger flash animation
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

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await generatePDF(year);
        } catch (err) {
            console.error('Error generating PDF:', err);
            setError('Error generating PDF.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-[1800px] mx-auto">
                <Header
                    year={year}
                    onYearChange={handleYearChange}
                    editMode={editMode}
                    onEditModeToggle={handleEditModeToggle}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    hasChanges={Object.keys(pendingChanges).length > 0}
                    loading={loading || saving}
                    onExportPDF={handleExportPDF}
                    isExporting={isExporting}
                    activeTab={activeTab}
                />

                {showOnboarding && !loading && (
                    <OnboardingWizard onComplete={() => {
                        setShowOnboarding(false);
                        fetchData();
                    }} />
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                        <button
                            onClick={fetchData}
                            className="ml-auto flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                    </div>
                )}

                {/* Tab Navigation */}
                <div data-tab-nav data-pdf-hide>
                    <TabNav
                        activeTab={activeTab}
                        onTabChange={(tab) => {
                            if ((tab === 'analysis' || tab === 'planning') && !canAccessPremium) {
                                // Block access to premium tabs
                                return;
                            }
                            setActiveTab(tab);
                        }}
                        disabled={loading || saving}
                    />
                </div>

                {!canAccessPremium && !loading && <SubscriptionBanner />}

                {/* Content based on active tab */}
                {activeTab === 'overview' ? (
                    <>
                        <div data-pdf-summary-cards>
                            <SummaryCards summary={summary} loading={loading} />
                        </div>

                        <div data-pdf-budget-table>
                            <BudgetTable
                                data={data}
                                summary={summary}
                                editMode={editMode}
                                onChange={handleValueChange}
                                loading={loading}
                                year={year}
                                onAddCategory={handleAddCategory}
                                onUpdateCategory={handleUpdateCategory}
                                onDeleteCategory={handleDeleteCategory}
                                onAutoFill={handleAutoFill}
                                autoFillFlash={autoFillFlash}
                            />
                        </div>
                    </>
                ) : activeTab === 'analysis' ? (
                    <div data-pdf-analysis>
                        <AnalysisPage
                            data={data}
                            summary={summary}
                            year={year}
                            loading={loading}
                        />
                    </div>
                ) : activeTab === 'planning' ? (
                    <PlanningView
                        year={year}
                        onAddCategory={handleAddCategory}
                        onUpdateCategory={handleUpdateCategory}
                    />
                ) : null}

                {/* Danger Zone */}
                <DangerZone />

                <Footer />
            </div>
        </div>
    );
}

export default App;
