import { createContext, useContext, useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(pb.authStore.model);
    const [loading, setLoading] = useState(false);

    const checkTrialStatus = (userData) => {
        if (!userData) return { isTrialActive: false, isSubscriptionActive: false, canAccessPremium: false };

        const now = new Date();
        const trialEndsAt = userData.trial_ends_at ? new Date(userData.trial_ends_at) : null;
        const isTrialActive = trialEndsAt && trialEndsAt > now;
        const subEnd = userData.subscription_end ? new Date(userData.subscription_end) : null;

        const isSubscriptionActive = userData.subscription_status === 'active' ||
            (userData.subscription_status === 'canceled' && subEnd && subEnd > now);

        return {
            isTrialActive,
            isSubscriptionActive,
            canAccessPremium: isTrialActive || isSubscriptionActive,
            subscriptionEnd: subEnd
        };
    };

    useEffect(() => {
        // Listen for changes
        const unsubscribe = pb.authStore.onChange((token, model) => {
            setUser(model);
        });

        return () => unsubscribe();
    }, []);

    const trialStatus = checkTrialStatus(user);

    const value = {
        signUp: async ({ email, password }) => {
            // Create the user
            const result = await pb.collection('users').create({
                email,
                password,
                passwordConfirm: password,
                emailVisibility: true,
            });
            // Request verification email - mandatory for manual record creation
            await pb.collection('users').requestVerification(email);
            // Return success without session (user needs to verify email first)
            return { user: result, needsVerification: true };
        },

        signIn: async ({ email, password }) => {
            const authData = await pb.collection('users').authWithPassword(email, password);
            // Check if user is verified
            if (!authData.record.verified) {
                // Clear the auth store - don't allow login for unverified users
                pb.authStore.clear();
                throw new Error('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Prüfen Sie Ihren Posteingang.');
            }
            return authData;
        },
        signInWithGoogle: async () => {
            const authData = await pb.collection('users').authWithOAuth2({ provider: 'google' });
            return authData;
        },
        signOut: () => pb.authStore.clear(),
        resendVerification: (email) => pb.collection('users').requestVerification(email),
        user,
        ...trialStatus,
        session: pb.authStore.token ? { access_token: pb.authStore.token } : null,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
