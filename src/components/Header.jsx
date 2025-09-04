import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Menu, Sparkles } from 'lucide-react';

function Header({ setSidebarOpen }) {
  return (
    <header className="glass-effect border-b border-white/20 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white hidden sm:block">
              AdSpark AI
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <p className="text-sm text-white/80">Generate & Test Social Ads Instantly</p>
          </div>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

export default Header;