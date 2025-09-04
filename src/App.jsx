import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CampaignCreate from './components/CampaignCreate';
import { CampaignProvider } from './context/CampaignContext';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <CampaignProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-orange-500 to-yellow-400">
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar 
            activeView={activeView} 
            setActiveView={setActiveView}
            isOpen={sidebarOpen}
            setIsOpen={setSidebarOpen}
          />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header setSidebarOpen={setSidebarOpen} />
            
            <main className="flex-1 overflow-y-auto">
              <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {activeView === 'dashboard' && <Dashboard setActiveView={setActiveView} />}
                {activeView === 'create' && <CampaignCreate setActiveView={setActiveView} />}
              </div>
            </main>
          </div>
        </div>
      </div>
    </CampaignProvider>
  );
}

export default App;