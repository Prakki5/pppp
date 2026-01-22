
import React from 'react';
import { Capability } from '../types';

interface SidebarProps {
  active: Capability;
  onNavigate: (cap: Capability) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate }) => {
  const items = [
    { id: 'brain' as Capability, label: 'Neural Brain', icon: '🧠', desc: 'Reasoning & Search' },
    { id: 'studio' as Capability, label: 'Creative Studio', icon: '🎨', desc: 'Image & Video' },
    { id: 'voice' as Capability, label: 'Apex Live', icon: '🎙️', desc: 'Real-time Voice' },
  ];

  return (
    <aside className="w-20 md:w-72 h-screen flex flex-col border-r border-gray-800 bg-gray-950/50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">A</div>
        <div className="hidden md:block">
          <h1 className="font-bold text-lg tracking-tight">Apex AI</h1>
          <p className="text-xs text-gray-500 font-medium">NEXT GEN MULTIMODAL</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-2 mt-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
              active === item.id 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="hidden md:block text-left">
              <div className="font-semibold text-sm">{item.label}</div>
              <div className="text-[10px] opacity-60 font-medium uppercase tracking-wider">{item.desc}</div>
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-900">
        <div className="md:flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
          <img src="https://picsum.photos/40/40" className="w-8 h-8 rounded-full border border-gray-700" alt="Avatar" />
          <div className="hidden md:block">
            <div className="text-sm font-medium">Developer Mode</div>
            <div className="text-[10px] text-gray-500 font-mono">v3.1 Preview</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
