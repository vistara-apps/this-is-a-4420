import React, { useState } from 'react';
import { Share2, Eye, Heart, Share, ExternalLink } from 'lucide-react';

function CreativeCard({ creative, variant = 'withImageAndText' }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (variant === 'loading') {
    return (
      <div className="bg-white/10 rounded-lg p-4 animate-pulse">
        <div className="w-full h-48 bg-white/10 rounded-lg mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="text-red-300 text-center">
          <p className="font-medium">Failed to load creative</p>
          <p className="text-sm opacity-70">Please try again</p>
        </div>
      </div>
    );
  }

  const platformColors = {
    instagram: 'bg-pink-500',
    tiktok: 'bg-gray-900',
    facebook: 'bg-blue-600',
    twitter: 'bg-blue-400',
    youtube: 'bg-red-600'
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden
                  hover:bg-white/15 transition-all duration-200 shadow-card hover:shadow-dropdown">
      {/* Image */}
      <div className="relative h-48">
        <img
          src={creative.generatedImageUrl}
          alt="Ad Creative"
          className={`w-full h-full object-cover transition-opacity duration-300 
                     ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white/10 animate-pulse" />
        )}
        
        {/* Platform Badge */}
        <div className="absolute top-3 left-3">
          <span className={`
            px-2 py-1 rounded-full text-xs font-medium text-white capitalize
            ${platformColors[creative.platform] || 'bg-gray-500'}
          `}>
            {creative.platform}
          </span>
        </div>

        {/* Ad Type Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-black/50 text-white rounded-full text-xs font-medium capitalize">
            {creative.adType}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Ad Copy */}
        <div>
          <p className="text-white text-sm leading-relaxed line-clamp-3">
            {creative.generatedCopy}
          </p>
        </div>

        {/* Performance Metrics */}
        {creative.performanceData && (
          <div className="flex items-center gap-4 text-xs text-white/70">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{creative.performanceData.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{creative.performanceData.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share className="w-3 h-3" />
              <span>{creative.performanceData.shares}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button className="flex-1 bg-accent/20 hover:bg-accent/30 text-accent px-3 py-2 
                           rounded-md text-sm font-medium transition-colors flex items-center 
                           justify-center gap-1">
            <Share2 className="w-4 h-4" />
            Post
          </button>
          
          {creative.postUrl && (
            <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 
                             rounded-md text-sm transition-colors">
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Created Date */}
        <div className="text-xs text-white/50 pt-1">
          Created {new Date(creative.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

export default CreativeCard;