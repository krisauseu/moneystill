import { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export default function DeleteAccountModal({
    isOpen,
    onConfirm,
    onCancel,
    loading
}) {
    const [confirmationText, setConfirmationText] = useState('');
    const isValid = confirmationText === 'DELETE';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={!loading ? onCancel : undefined}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Permanently delete account</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Are you sure? All your data (categories, monthly budgets, and scenarios) will be <strong>permanently</strong> deleted. This action cannot be undone.
                    </p>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Please type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm:
                        </label>
                        <input
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder="DELETE"
                            disabled={loading}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600
                                   hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!isValid || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/25"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}
