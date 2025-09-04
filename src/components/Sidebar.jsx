import React from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Image, 
  BarChart3, 
  Settings,
  X
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'create', label: 'Create Campaign', icon: Plus },
  { id: 'creatives', label: 'Ad Creatives', icon: Image },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function Sidebar({ activeView, setActiveView, isOpen, setIsOpen }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/10 backdrop-blur-md
        border-r border-white/20 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 lg:hidden">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mt-8 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2
                  transition-all duration-200 text-left
                  ${isActive 
                    ? 'bg-white/20 text-white shadow-card' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export default Sidebar;