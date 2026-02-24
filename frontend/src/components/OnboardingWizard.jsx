import React, { useState, useEffect } from 'react';
import {
    ChevronRight,
    ChevronLeft,
    Check,
    Loader2,
    Briefcase,
    GraduationCap,
    Home,
    User,
    Users,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    TrendingDown,
    TrendingUp,
    X
} from 'lucide-react';
import onboardingProfiles from '../data/onboardingProfiles.json';
import { pb } from '../lib/pocketbase';

const OnboardingWizard = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const totalSteps = 4;

    const profileIcons = {
        'student_intern': GraduationCap,
        'family': Users,
        'freelancer': Briefcase,
        'single': User,
        'homeowner': Home
    };

    const selectedProfile = onboardingProfiles.find(p => p.id === selectedProfileId);

    useEffect(() => {
        if (selectedProfile) {
            setSelectedCategories(selectedProfile.categories.map(cat => ({ ...cat, selected: true })));
        }
    }, [selectedProfileId]);

    const handleProfileSelect = (profileId) => {
        setSelectedProfileId(profileId);
        setStep(3);
    };

    const toggleCategory = (index) => {
        const newCategories = [...selectedCategories];
        newCategories[index].selected = !newCategories[index].selected;
        setSelectedCategories(newCategories);
    };

    const handleFinish = async () => {
        setLoading(true);
        setError(null);
        try {
            const user = pb.authStore.model;
            if (!user) throw new Error('Not authenticated');

            const categoriesToApply = selectedCategories
                .filter(cat => cat.selected)
                .map((cat, index) => {
                    let isFixed = false;
                    // Mapping logic for is_fixed and type
                    if (cat.type === 'income') {
                        isFixed = cat.is_fixed !== undefined ? cat.is_fixed : true;
                    } else if (cat.type === 'fixed_expense') {
                        isFixed = true;
                    } else if (cat.type === 'variable_expense') {
                        isFixed = false;
                    }

                    return {
                        name: cat.name,
                        type: cat.type === 'income' ? 'income' : 'expense',
                        is_fixed: isFixed,
                        user: user.id,
                        display_order: index + 1
                    };
                });

            // Using individual creates instead of batch as it might be disabled on the server
            for (const catData of categoriesToApply) {
                await pb.collection('categories').create(catData);
            }


            onComplete();
        } catch (err) {
            console.error('Error in onboarding:', err);
            setError('Error creating your budget. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 ring-1 ring-emerald-500/30">
                                <Sparkles className="w-10 h-10" />
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome to moneystill</h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                                The first step to financial clarity. Let's build your budget framework together.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                            {[
                                { icon: ShieldCheck, title: "Secure", desc: "Your data stays private" },
                                { icon: Briefcase, title: "Personalized", desc: "Profiles for every life stage" },
                                { icon: Check, title: "Quick", desc: "Done in under 2 minutes" }
                            ].map((item, i) => (
                                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                                    <item.icon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.title}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/20"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Choose Your Profile</h2>
                            <p className="text-slate-500 dark:text-slate-400">Matching categories for your current life stage.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {onboardingProfiles.map((p) => {
                                const Icon = profileIcons[p.id] || User;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => handleProfileSelect(p.id)}
                                        className={`p-5 text-left rounded-2xl border transition-all duration-300 group relative overflow-hidden ${selectedProfileId === p.id
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20'
                                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 text-slate-900 dark:text-white'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-xl mb-4 w-fit transition-colors ${selectedProfileId === p.id ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                            }`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                                        <p className={`text-sm leading-relaxed ${selectedProfileId === p.id ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                                            }`}>
                                            {p.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review Categories</h2>
                            <p className="text-slate-500 dark:text-slate-400">These categories will be created for you. You can deselect any you don't need.</p>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 gap-2">
                                {selectedCategories.map((cat, index) => (
                                    <button
                                        key={index}
                                        onClick={() => toggleCategory(index)}
                                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${cat.selected
                                            ? 'bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/10'
                                            : 'opacity-50 grayscale border-transparent'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${cat.selected
                                            ? (cat.type === 'income' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white')
                                            : 'bg-slate-200 dark:bg-slate-700'
                                            }`}>
                                            {cat.selected ? <Check className="w-4 h-4" /> : <X className="w-3 h-3 text-slate-400" />}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-medium text-slate-900 dark:text-white text-sm">{cat.name}</div>
                                            <div className="text-[10px] uppercase font-bold tracking-wider opacity-50 flex items-center gap-1">
                                                {cat.type === 'income' ? (
                                                    <span className="text-emerald-500">Income</span>
                                                ) : (
                                                    <span className="text-amber-500">Expense</span>
                                                )}
                                                <span>•</span>
                                                <span>{cat.is_fixed || cat.type === 'fixed_expense' ? 'Fixed' : 'Variable'}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(4)}
                                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-8 py-8 animate-in fade-in zoom-in duration-500">
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-blue-600/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto ring-4 ring-blue-600/5">
                                <Check className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">All set!</h2>
                                <p className="text-slate-500 dark:text-slate-400">
                                    We'll now create your budget with <span className="text-blue-600 dark:text-blue-400 font-bold">{selectedCategories.filter(c => c.selected).length} categories</span>.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                disabled={loading}
                                onClick={handleFinish}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating budget...
                                    </>
                                ) : (
                                    'Create Budget'
                                )}
                            </button>
                            <button
                                disabled={loading}
                                onClick={() => setStep(3)}
                                className="w-full py-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
                            >
                                Review once more
                            </button>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 flex bg-slate-100 dark:bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>

                <div className="p-8 md:p-12">
                    {renderStep()}
                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
