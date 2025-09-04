import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.js';
import { userApi } from '../services/api.js';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.initialize();
      setUser(currentUser);
      
      if (currentUser) {
        await loadUserProfile();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      toast.error('Failed to initialize authentication');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const loadUserProfile = async () => {
    try {
      const userProfile = await userApi.getProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Don't show error toast for profile loading as it's not critical
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    if (!initialized) return;

    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setUser(session?.user || null);
        
        if (session?.user) {
          await loadUserProfile();
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [initialized]);

  const signUp = async ({ email, password, metadata = {} }) => {
    try {
      setLoading(true);
      const result = await authService.signUp({ email, password, metadata });
      
      if (result.needsConfirmation) {
        toast.success('Please check your email to confirm your account');
      } else {
        toast.success('Account created successfully!');
        setUser(result.user);
        if (result.user) {
          await loadUserProfile();
        }
      }
      
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async ({ email, password }) => {
    try {
      setLoading(true);
      const result = await authService.signIn({ email, password });
      
      toast.success('Welcome back!');
      setUser(result.user);
      
      if (result.user) {
        await loadUserProfile();
      }
      
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider) => {
    try {
      setLoading(true);
      const result = await authService.signInWithProvider(provider);
      return result;
    } catch (error) {
      console.error('OAuth sign in error:', error);
      toast.error(error.message || `Failed to sign in with ${provider}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setProfile(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(error.message || 'Failed to sign out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      await authService.resetPassword(email);
      toast.success('Password reset email sent');
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send reset email');
      throw error;
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const updatedUser = await authService.updatePassword(newPassword);
      setUser(updatedUser);
      toast.success('Password updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password');
      throw error;
    }
  };

  const updateEmail = async (newEmail) => {
    try {
      const updatedUser = await authService.updateEmail(newEmail);
      setUser(updatedUser);
      toast.success('Email update initiated. Please check your new email for confirmation.');
      return updatedUser;
    } catch (error) {
      console.error('Email update error:', error);
      toast.error(error.message || 'Failed to update email');
      throw error;
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updatedProfile = await userApi.updateProfile(updates);
      setProfile(updatedProfile);
      toast.success('Profile updated successfully');
      return updatedProfile;
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const refreshProfile = async () => {
    try {
      await loadUserProfile();
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  const deductCredits = async (amount) => {
    try {
      const updatedProfile = await userApi.deductCredits(amount);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Credit deduction error:', error);
      toast.error(error.message || 'Insufficient credits');
      throw error;
    }
  };

  const hasPermission = (permission) => {
    return authService.hasPermission(permission);
  };

  const getSubscriptionTier = async () => {
    return await authService.getSubscriptionTier();
  };

  const canPerformAction = async (action) => {
    return await authService.canPerformAction(action);
  };

  const value = {
    // State
    user,
    profile,
    loading,
    initialized,
    isAuthenticated: !!user,
    
    // Auth methods
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    updateEmail,
    
    // Profile methods
    updateProfile,
    refreshProfile,
    deductCredits,
    
    // Permission methods
    hasPermission,
    getSubscriptionTier,
    canPerformAction,
    
    // Computed values
    creditsRemaining: profile?.credits_remaining || 0,
    subscriptionTier: profile?.subscription_tier || 'free',
    totalCampaigns: profile?.total_campaigns || 0,
    totalCreatives: profile?.total_creatives || 0
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
