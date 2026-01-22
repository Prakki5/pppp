
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import CreativeStudio from './components/CreativeStudio';
import LiveInterface from './components/LiveInterface';
import { Capability } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Capability>('brain');

  const renderContent = () => {
    switch (activeTab) {
      case 'brain':
        return <ChatInterface />;
      case 'studio':
        return <CreativeStudio />;
      case 'voice':
        return <LiveInterface />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Dynamic Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <Sidebar active={activeTab} onNavigate={setActiveTab} />
      
      <main className="flex-1 relative overflow-hidden">
        <div className="h-full overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
