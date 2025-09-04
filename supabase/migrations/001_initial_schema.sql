-- AdSpark AI Database Schema
-- Based on PRD Data Model Specifications

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  credits_remaining INTEGER DEFAULT 5,
  total_campaigns INTEGER DEFAULT 0,
  total_creatives INTEGER DEFAULT 0
);

-- Ad Campaigns table
CREATE TABLE public.ad_campaigns (
  campaign_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_image_url TEXT NOT NULL,
  product_description TEXT,
  selected_platforms TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
  total_variations INTEGER DEFAULT 0,
  total_cost DECIMAL(10,3) DEFAULT 0.000
);

-- Ad Creative Variations table
CREATE TABLE public.ad_creative_variations (
  variation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.ad_campaigns(campaign_id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'twitter', 'linkedin')),
  ad_type TEXT NOT NULL CHECK (ad_type IN ('feed', 'story', 'reel', 'carousel')),
  prompt TEXT NOT NULL,
  generated_image_url TEXT,
  generated_copy TEXT,
  post_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'posted', 'failed')),
  generation_cost DECIMAL(10,3) DEFAULT 0.000,
  
  -- Performance data (JSON for flexibility)
  performance_data JSONB DEFAULT '{
    "views": 0,
    "likes": 0,
    "shares": 0,
    "comments": 0,
    "clicks": 0,
    "engagement_rate": 0.0,
    "last_updated": null
  }'::jsonb
);

-- Test Accounts table
CREATE TABLE public.test_accounts (
  account_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'twitter', 'linkedin')),
  account_handle TEXT NOT NULL,
  account_name TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Store encrypted auth credentials (if available)
  auth_credentials JSONB DEFAULT '{}'::jsonb,
  
  -- Account metadata
  metadata JSONB DEFAULT '{
    "follower_count": 0,
    "following_count": 0,
    "post_count": 0,
    "last_sync": null
  }'::jsonb,
  
  -- Unique constraint per user per platform per handle
  UNIQUE(user_id, platform, account_handle)
);

-- Payment Transactions table
CREATE TABLE public.payment_transactions (
  transaction_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.ad_campaigns(campaign_id) ON DELETE SET NULL,
  amount DECIMAL(10,3) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'crypto',
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Analytics Events table (for tracking user interactions)
CREATE TABLE public.analytics_events (
  event_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for common queries
  INDEX idx_analytics_user_id ON public.analytics_events(user_id),
  INDEX idx_analytics_event_type ON public.analytics_events(event_type),
  INDEX idx_analytics_created_at ON public.analytics_events(created_at)
);

-- Create indexes for better performance
CREATE INDEX idx_campaigns_user_id ON public.ad_campaigns(user_id);
CREATE INDEX idx_campaigns_status ON public.ad_campaigns(status);
CREATE INDEX idx_campaigns_created_at ON public.ad_campaigns(created_at);

CREATE INDEX idx_variations_campaign_id ON public.ad_creative_variations(campaign_id);
CREATE INDEX idx_variations_platform ON public.ad_creative_variations(platform);
CREATE INDEX idx_variations_status ON public.ad_creative_variations(status);
CREATE INDEX idx_variations_created_at ON public.ad_creative_variations(created_at);

CREATE INDEX idx_test_accounts_user_id ON public.test_accounts(user_id);
CREATE INDEX idx_test_accounts_platform ON public.test_accounts(platform);
CREATE INDEX idx_test_accounts_active ON public.test_accounts(is_active);

CREATE INDEX idx_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_transactions_created_at ON public.payment_transactions(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_creative_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Campaigns policies
CREATE POLICY "Users can view own campaigns" ON public.ad_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaigns" ON public.ad_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON public.ad_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON public.ad_campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Creative variations policies
CREATE POLICY "Users can view own variations" ON public.ad_creative_variations
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.ad_campaigns WHERE campaign_id = ad_creative_variations.campaign_id)
  );

CREATE POLICY "Users can create own variations" ON public.ad_creative_variations
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.ad_campaigns WHERE campaign_id = ad_creative_variations.campaign_id)
  );

CREATE POLICY "Users can update own variations" ON public.ad_creative_variations
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM public.ad_campaigns WHERE campaign_id = ad_creative_variations.campaign_id)
  );

-- Test accounts policies
CREATE POLICY "Users can manage own test accounts" ON public.test_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Payment transactions policies
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Analytics events policies
CREATE POLICY "Users can view own analytics" ON public.analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variations_updated_at BEFORE UPDATE ON public.ad_creative_variations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_accounts_updated_at BEFORE UPDATE ON public.test_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user stats when campaigns/creatives are created
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'ad_campaigns' THEN
    UPDATE public.users 
    SET total_campaigns = (
      SELECT COUNT(*) FROM public.ad_campaigns WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
  ELSIF TG_TABLE_NAME = 'ad_creative_variations' THEN
    UPDATE public.users 
    SET total_creatives = (
      SELECT COUNT(*) FROM public.ad_creative_variations 
      WHERE campaign_id IN (
        SELECT campaign_id FROM public.ad_campaigns WHERE user_id = (
          SELECT user_id FROM public.ad_campaigns WHERE campaign_id = NEW.campaign_id
        )
      )
    )
    WHERE id = (
      SELECT user_id FROM public.ad_campaigns WHERE campaign_id = NEW.campaign_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to update user stats
CREATE TRIGGER update_user_campaign_stats
  AFTER INSERT ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_user_creative_stats
  AFTER INSERT ON public.ad_creative_variations
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();
