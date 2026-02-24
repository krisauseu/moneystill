import { useState } from 'react';
import { X, Plus, Copy } from 'lucide-react';

export default function ScenarioModal({ isOpen, onClose, onCreate, year }) {
    const [name, setName] = useState('');
    const [copyFromLive, setCopyFromLive] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim(), copyFromLive);
            setName('');
            setCopyFromLive(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                            <Plus className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New Scenario</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Scenario Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={`e.g., Best Case ${year}`}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all dark:text-white"
                            autoFocus
                        />
                    </div>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                            ${copyFromLive
                                ? 'bg-violet-600 border-violet-600'
                                : 'border-slate-300 dark:border-slate-600'}`}
                        >
                            {copyFromLive && <Copy className="w-3 h-3 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            checked={copyFromLive}
                            onChange={(e) => setCopyFromLive(e.target.checked)}
                            className="hidden"
                        />
                        <div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Copy live data</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Start with your current budget values as a baseline
                            </p>
                        </div>
                    </label>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600
                                       hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-500/25"
                        >
                            <Plus className="w-4 h-4" />
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
