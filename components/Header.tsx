
import React from 'react';
import { SparklesIcon } from './Icons';

interface HeaderProps {
  isOnline?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isOnline = true }) => {
  return (
    <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <SparklesIcon />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                NanoEdit
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Professional Image Studio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
              isOnline 
              ? 'bg-green-500/10 border-green-500/20 text-green-500' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              {isOnline ? 'Online' : 'Offline Mode'}
            </div>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-indigo-400 border border-gray-700">
              Experimental
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
