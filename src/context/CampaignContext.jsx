import React, { createContext, useContext, useState } from 'react';

const CampaignContext = createContext();

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within CampaignProvider');
  }
  return context;
}

export function CampaignProvider({ children }) {
  const [campaigns, setCampaigns] = useState([]);
  const [creatives, setCreatives] = useState([]);

  const createCampaign = ({ productImageURL, productDescription, selectedPlatforms }) => {
    const campaign = {
      campaignId: `camp_${Date.now()}`,
      userId: 'user_1', // In real app, get from auth
      productImageURL,
      productDescription,
      selectedPlatforms,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    setCampaigns(prev => [...prev, campaign]);
    return campaign;
  };

  const addCreatives = (newCreatives) => {
    setCreatives(prev => [...prev, ...newCreatives]);
  };

  const updateCreative = (variationId, updates) => {
    setCreatives(prev =>
      prev.map(creative =>
        creative.variationId === variationId
          ? { ...creative, ...updates }
          : creative
      )
    );
  };

  const value = {
    campaigns,
    creatives,
    createCampaign,
    addCreatives,
    updateCreative
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}