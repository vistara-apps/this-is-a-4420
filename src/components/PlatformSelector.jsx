import React from 'react';

const platforms = [
  { id: 'instagram', name: 'Instagram', color: 'bg-pink-500' },
  { id: 'tiktok', name: 'TikTok', color: 'bg-black' },
  { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
  { id: 'twitter', name: 'Twitter', color: 'bg-blue-400' },
  { id: 'youtube', name: 'YouTube', color: 'bg-red-600' },
];

function PlatformSelector({ selectedPlatforms, onPlatformsChange, variant = 'checkboxes' }) {
  const togglePlatform = (platformId) => {
    if (selectedPlatforms.includes(platformId)) {
      onPlatformsChange(selectedPlatforms.filter(p => p !== platformId));
    } else {
      onPlatformsChange([...selectedPlatforms, platformId]);
    }
  };

  if (variant === 'dropdown') {
    return (
      <select
        multiple
        value={selectedPlatforms}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions, option => option.value);
          onPlatformsChange(selected);
        }}
        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 
                 text-white focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {platforms.map((platform) => (
          <option key={platform.id} value={platform.id}>
            {platform.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-white font-medium">
        Target Platforms
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {platforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          
          return (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`
                flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'border-accent bg-accent/20 text-white'
                  : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                }
              `}
            >
              <div className={`w-4 h-4 rounded ${platform.color}`} />
              <span className="font-medium text-sm">{platform.name}</span>
            </button>
          );
        })}
      </div>
      <p className="text-sm text-white/50">
        Select platforms to optimize ad formats for each channel
      </p>
    </div>
  );
}

export default PlatformSelector;