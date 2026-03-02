"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [appPublicSettings, setAppPublicSettings] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    ...firebaseUser,
                    full_name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email,
                    uid: firebaseUser.uid
                });
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setIsLoadingAuth(false);
        }, (error) => {
            console.error('Auth error:', error);
            setAuthError(error);
            setIsLoadingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    const checkAppState = async () => {
        // App state checking omitted as we migrated to pure Firebase
    };

    const logout = async (shouldRedirect = true) => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setIsAuthenticated(false);
            if (shouldRedirect) {
                router.push('/');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const navigateToLogin = () => {
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            isLoadingPublicSettings,
            authError,
            appPublicSettings,
            logout,
            navigateToLogin,
            checkAppState
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
