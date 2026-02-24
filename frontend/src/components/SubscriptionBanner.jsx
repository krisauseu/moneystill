import { useState } from 'react';
import { AlertTriangle, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import { pb } from '../lib/pocketbase';

export default function SubscriptionBanner() {
    const [loading, setLoading] = useState(false);

    const handleSubscription = async () => {
        setLoading(true);
        try {
            const response = await pb.send('/api/stripe-checkout', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + pb.authStore.token,
                },
            });

            if (response.url) {
                window.location.href = response.url;
            }
        } catch (err) {
            console.error('Stripe checkout error:', err);
            alert('Error creating Stripe session. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg border border-blue-500/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles className="w-24 h-24" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-1">Your trial has expired</h3>
                        <p className="text-blue-100 max-w-md">
                            To keep access to your analytics and future planning features,
                            please activate your unlimited subscription now.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSubscription}
                    disabled={loading}
                    className="flex items-center gap-3 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all hover:scale-105 shadow-xl whitespace-nowrap disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <CreditCard className="w-5 h-5" />
                    )}
                    Unlock Now
                </button>
            </div>
        </div>
    );
}
