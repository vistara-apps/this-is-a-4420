import { supabase, TABLES, handleSupabaseError } from '../lib/supabase.js';

/**
 * API Service Layer for AdSpark AI
 * Provides abstraction over Supabase operations
 */

// User API
export const userApi = {
  // Get current user profile
  async getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) handleSupabaseError(error, 'getting user profile');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  async updateProfile(updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'updating user profile');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Deduct credits from user account
  async deductCredits(amount) {
    try {
      const profile = await this.getProfile();
      if (profile.credits_remaining < amount) {
        throw new Error('Insufficient credits');
      }

      return await this.updateProfile({
        credits_remaining: profile.credits_remaining - amount
      });
    } catch (error) {
      throw error;
    }
  }
};

// Campaign API
export const campaignApi = {
  // Get all campaigns for current user
  async getCampaigns() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.AD_CAMPAIGNS)
        .select(`
          *,
          ad_creative_variations (
            variation_id,
            platform,
            status,
            performance_data
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'getting campaigns');
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // Get single campaign by ID
  async getCampaign(campaignId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.AD_CAMPAIGNS)
        .select(`
          *,
          ad_creative_variations (*)
        `)
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (error) handleSupabaseError(error, 'getting campaign');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Create new campaign
  async createCampaign(campaignData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.AD_CAMPAIGNS)
        .insert({
          ...campaignData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'creating campaign');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update campaign
  async updateCampaign(campaignId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.AD_CAMPAIGNS)
        .update(updates)
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'updating campaign');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Delete campaign
  async deleteCampaign(campaignId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from(TABLES.AD_CAMPAIGNS)
        .delete()
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id);

      if (error) handleSupabaseError(error, 'deleting campaign');
      return true;
    } catch (error) {
      throw error;
    }
  }
};

// Creative Variations API
export const creativeApi = {
  // Get all creatives for current user
  async getCreatives() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.AD_CREATIVE_VARIATIONS)
        .select(`
          *,
          ad_campaigns!inner (
            user_id,
            product_description,
            selected_platforms
          )
        `)
        .eq('ad_campaigns.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'getting creatives');
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // Get creatives for specific campaign
  async getCampaignCreatives(campaignId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.AD_CREATIVE_VARIATIONS)
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'getting campaign creatives');
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // Create new creative variation
  async createCreative(creativeData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.AD_CREATIVE_VARIATIONS)
        .insert(creativeData)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'creating creative');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update creative variation
  async updateCreative(variationId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.AD_CREATIVE_VARIATIONS)
        .update(updates)
        .eq('variation_id', variationId)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'updating creative');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update creative performance data
  async updatePerformanceData(variationId, performanceData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.AD_CREATIVE_VARIATIONS)
        .update({
          performance_data: {
            ...performanceData,
            last_updated: new Date().toISOString()
          }
        })
        .eq('variation_id', variationId)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'updating performance data');
      return data;
    } catch (error) {
      throw error;
    }
  }
};

// Test Accounts API
export const testAccountApi = {
  // Get all test accounts for current user
  async getTestAccounts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.TEST_ACCOUNTS)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'getting test accounts');
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // Create new test account
  async createTestAccount(accountData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.TEST_ACCOUNTS)
        .insert({
          ...accountData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'creating test account');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update test account
  async updateTestAccount(accountId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.TEST_ACCOUNTS)
        .update(updates)
        .eq('account_id', accountId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'updating test account');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Delete test account
  async deleteTestAccount(accountId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from(TABLES.TEST_ACCOUNTS)
        .update({ is_active: false })
        .eq('account_id', accountId)
        .eq('user_id', user.id);

      if (error) handleSupabaseError(error, 'deleting test account');
      return true;
    } catch (error) {
      throw error;
    }
  }
};

// Payment Transactions API
export const paymentApi = {
  // Create payment transaction
  async createTransaction(transactionData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.PAYMENT_TRANSACTIONS)
        .insert({
          ...transactionData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'creating transaction');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update transaction status
  async updateTransaction(transactionId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.PAYMENT_TRANSACTIONS)
        .update(updates)
        .eq('transaction_id', transactionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'updating transaction');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get user transactions
  async getTransactions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.PAYMENT_TRANSACTIONS)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'getting transactions');
      return data || [];
    } catch (error) {
      throw error;
    }
  }
};

// Analytics API
export const analyticsApi = {
  // Track user event
  async trackEvent(eventType, eventData = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Don't throw error for analytics

      const { error } = await supabase
        .from(TABLES.ANALYTICS_EVENTS)
        .insert({
          user_id: user.id,
          event_type: eventType,
          event_data: eventData
        });

      if (error) console.warn('Analytics tracking failed:', error);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  },

  // Get user analytics
  async getUserAnalytics(startDate, endDate) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(TABLES.ANALYTICS_EVENTS)
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'getting analytics');
      return data || [];
    } catch (error) {
      throw error;
    }
  }
};
