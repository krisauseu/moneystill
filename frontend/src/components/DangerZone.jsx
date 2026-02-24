import { useState, useRef } from 'react';
import { AlertCircle, Download, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import DeleteAccountModal from './DeleteAccountModal';
import { pb } from '../lib/pocketbase';
import { exportUserData, importUserData, downloadJson } from '../utils/importExportUtils';
import { useAuth } from '../context/AuthContext';

export default function DangerZone() {
    const { isSubscriptionActive } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importMessage, setImportMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const handleDeleteAccount = async () => {
        setLoading(true);
        setError(null);
        try {
            const userId = pb.authStore.model.id;

            // Manual cleanup of dependent records as cascade delete seems to be blocked by 'required' constraints
            // 1. Delete monthly values
            const monthlyValues = await pb.collection('monthly_values').getFullList({ filter: `user = "${userId}"` });
            for (const val of monthlyValues) {
                await pb.collection('monthly_values').delete(val.id);
            }

            // 2. Delete scenario values
            const scenarioValues = await pb.collection('scenario_values').getFullList({ filter: `user = "${userId}"` });
            for (const val of scenarioValues) {
                await pb.collection('scenario_values').delete(val.id);
            }

            // 3. Delete scenarios
            const scenarios = await pb.collection('scenarios').getFullList({ filter: `user = "${userId}"` });
            for (const s of scenarios) {
                await pb.collection('scenarios').delete(s.id);
            }

            // 4. Delete categories
            const categories = await pb.collection('categories').getFullList({ filter: `user = "${userId}"` });
            for (const cat of categories) {
                await pb.collection('categories').delete(cat.id);
            }

            // Finally delete the user account
            await pb.collection('users').delete(userId);

            // Clear local auth store
            pb.authStore.clear();
            window.location.href = '/'; // Hard redirect to landing/login
        } catch (err) {
            console.error('Error deleting account:', err);
            setError('Error deleting account. The system could not automatically remove some linked data.');
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);
        try {
            const data = await exportUserData();
            const date = new Date().toISOString().split('T')[0];
            downloadJson(data, `moneystill_backup_${date}.json`);
        } catch (err) {
            console.error('Export error:', err);
            setError('Error exporting data.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setError(null);
        setShowSuccess(false);
        setImportProgress(0);
        setImportMessage('Reading file...');

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result);
                await importUserData(json, (msg, progress) => {
                    setImportMessage(msg);
                    setImportProgress(progress);
                });
                setShowSuccess(true);
                // Reset file input
                e.target.value = '';
                // Reload after a delay to show success
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (err) {
                console.error('Import error:', err);
                setError('Error importing: ' + (err.message || 'Invalid file format'));
                setIsImporting(false);
            }
        };
        reader.onerror = () => {
            setError('Error reading the file.');
            setIsImporting(false);
        };
        reader.readAsText(file);
    };

    return (
        <div className="mt-12 mb-8 pt-8 border-t border-slate-200 dark:border-slate-800" data-pdf-hide>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Data Transfer Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Download className="w-5 h-5 text-blue-500" />
                            Data Transfer
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Export your data as a backup or import it into another instance.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            disabled={isExporting || isImporting}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Export
                        </button>

                        <button
                            onClick={handleImportClick}
                            disabled={isExporting || isImporting}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            Import
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Import Progress / Success / Error */}
                {(isImporting || showSuccess) && (
                    <div className={`p-4 rounded-xl border ${showSuccess ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-400' : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-400'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium flex items-center gap-2">
                                {showSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                                {showSuccess ? 'Import successful! Reloading page...' : importMessage}
                            </span>
                            <span className="text-xs font-mono">{importProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${showSuccess ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${importProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Subscription Management Section */}
                {isSubscriptionActive && (
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                Subscription & Billing
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Manage your subscription, update payment methods, or download invoices.
                            </p>
                        </div>

                        <button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const response = await pb.send('/api/stripe-portal', {
                                        method: 'POST',
                                        headers: { 'Authorization': 'Bearer ' + pb.authStore.token }
                                    });
                                    if (response.url) {
                                        window.location.href = response.url;
                                    }
                                } catch (err) {
                                    console.error('Portal error:', err);
                                    setError('Could not load the portal. Please try again later.');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Manage Subscription
                        </button>
                    </div>
                )}

                {/* Account Deletion Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Danger Zone
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Actions in this section cannot be undone. Please be careful.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={isExporting || isImporting}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    >
                        Delete Account
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}
            </div>

            <DeleteAccountModal
                isOpen={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onConfirm={handleDeleteAccount}
                loading={loading}
            />
        </div>
    );
}
