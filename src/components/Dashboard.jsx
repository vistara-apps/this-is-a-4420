import React from 'react';
import { useCampaign } from '../context/CampaignContext';
import { Plus, Image, TrendingUp, Zap } from 'lucide-react';
import CreativeCard from './CreativeCard';

function Dashboard({ setActiveView }) {
  const { campaigns, creatives } = useCampaign();
  
  const totalCampaigns = campaigns.length;
  const totalCreatives = creatives.length;
  const activeCreatives = creatives.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-effect rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Welcome to AdSpark AI
            </h1>
            <p className="text-white/80 text-sm sm:text-base">
              Generate high-converting social media ads in seconds with AI
            </p>
          </div>
          <button
            onClick={() => setActiveView('create')}
            className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg 
                     font-semibold flex items-center gap-2 transition-colors
                     shadow-card hover:shadow-dropdown"
          >
            <Plus className="w-5 h-5" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCampaigns}</p>
              <p className="text-white/70 text-sm">Total Campaigns</p>
            </div>
          </div>
        </div>
        
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Image className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCreatives}</p>
              <p className="text-white/70 text-sm">Ad Creatives</p>
            </div>
          </div>
        </div>
        
        <div className="glass-effect rounded-xl p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeCreatives}</p>
              <p className="text-white/70 text-sm">Active Tests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Creatives */}
      {creatives.length > 0 && (
        <div className="glass-effect rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Ad Creatives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creatives.slice(0, 6).map((creative) => (
              <CreativeCard key={creative.variationId} creative={creative} />
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {campaigns.length === 0 && (
        <div className="glass-effect rounded-2xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Ready to create your first campaign?
            </h3>
            <p className="text-white/70 mb-6">
              Upload a product image and let AI generate multiple ad variations for testing
            </p>
            <button
              onClick={() => setActiveView('create')}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg 
                       font-semibold transition-colors shadow-card hover:shadow-dropdown"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;