import { supabase, handleSupabaseError } from '../lib/supabase.js';
import { analyticsApi } from './api.js';

/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */

export class AuthService {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
  }

  /**
   * Initialize auth service and check for existing session
   */
  async initialize() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      this.currentUser = session?.user || null;
      this.isInitialized = true;
      
      if (this.currentUser) {
        await analyticsApi.trackEvent('session_restored', {
          userId: this.currentUser.id
        });
      }
      
      return this.currentUser;
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.isInitialized = true;
      return null;
    }
  }

  /**
   * Sign up new user with email and password
   */
  async signUp({ email, password, metadata = {} }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            app_name: 'AdSpark AI'
          }
        }
      });

      if (error) handleSupabaseError(error, 'signing up');

      if (data.user) {
        await analyticsApi.trackEvent('user_signup', {
          userId: data.user.id,
          email: data.user.email,
          provider: 'email'
        });
      }

      return {
        user: data.user,
        session: data.session,
        needsConfirmation: !data.session
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign in user with email and password
   */
  async signIn({ email, password }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) handleSupabaseError(error, 'signing in');

      this.currentUser = data.user;

      if (data.user) {
        await analyticsApi.trackEvent('user_signin', {
          userId: data.user.id,
          email: data.user.email,
          provider: 'email'
        });
      }

      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign in with OAuth provider (Google, GitHub, etc.)
   */
  async signInWithProvider(provider) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) handleSupabaseError(error, `signing in with ${provider}`);

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      const userId = this.currentUser?.id;
      
      const { error } = await supabase.auth.signOut();
      if (error) handleSupabaseError(error, 'signing out');

      if (userId) {
        await analyticsApi.trackEvent('user_signout', {
          userId
        });
      }

      this.currentUser = null;
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) handleSupabaseError(error, 'resetting password');

      await analyticsApi.trackEvent('password_reset_requested', {
        email
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) handleSupabaseError(error, 'updating password');

      if (data.user) {
        await analyticsApi.trackEvent('password_updated', {
          userId: data.user.id
        });
      }

      return data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user email
   */
  async updateEmail(newEmail) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) handleSupabaseError(error, 'updating email');

      if (data.user) {
        await analyticsApi.trackEvent('email_updated', {
          userId: data.user.id,
          newEmail
        });
      }

      return data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Get user session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) handleSupabaseError(error, 'getting session');
      return session;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) handleSupabaseError(error, 'refreshing session');
      
      this.currentUser = data.user;
      return data.session;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      this.currentUser = session?.user || null;
      
      // Track auth events
      if (event === 'SIGNED_IN' && session?.user) {
        await analyticsApi.trackEvent('auth_state_changed', {
          event,
          userId: session.user.id
        });
      } else if (event === 'SIGNED_OUT') {
        await analyticsApi.trackEvent('auth_state_changed', {
          event
        });
      }
      
      callback(event, session);
    });
  }

  /**
   * Verify email confirmation
   */
  async verifyEmail(token, type = 'signup') {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type
      });

      if (error) handleSupabaseError(error, 'verifying email');

      if (data.user) {
        await analyticsApi.trackEvent('email_verified', {
          userId: data.user.id,
          type
        });
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend confirmation email
   */
  async resendConfirmation(email) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) handleSupabaseError(error, 'resending confirmation');

      await analyticsApi.trackEvent('confirmation_resent', {
        email
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has required permissions
   */
  hasPermission(permission) {
    if (!this.currentUser) return false;
    
    // Basic permission system - can be extended
    const userPermissions = this.currentUser.user_metadata?.permissions || [];
    return userPermissions.includes(permission) || userPermissions.includes('admin');
  }

  /**
   * Get user subscription tier
   */
  async getSubscriptionTier() {
    try {
      if (!this.currentUser) return 'free';
      
      const { data, error } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', this.currentUser.id)
        .single();

      if (error) return 'free';
      return data?.subscription_tier || 'free';
    } catch (error) {
      return 'free';
    }
  }

  /**
   * Check if user can perform action based on subscription
   */
  async canPerformAction(action) {
    const tier = await this.getSubscriptionTier();
    
    const permissions = {
      free: {
        create_campaigns: 5,
        generate_creatives: 25,
        test_accounts: 1
      },
      pro: {
        create_campaigns: 50,
        generate_creatives: 500,
        test_accounts: 5
      },
      enterprise: {
        create_campaigns: -1, // unlimited
        generate_creatives: -1,
        test_accounts: -1
      }
    };

    return permissions[tier]?.[action] || 0;
  }
}

export default new AuthService();
