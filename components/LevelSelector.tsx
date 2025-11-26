
import React from 'react';
import { CambridgeLevel } from '../types';
import { Star, Zap, Award } from 'lucide-react';

interface Props {
  currentLevel: CambridgeLevel;
  onSelect: (level: CambridgeLevel) => void;
}

export const LevelSelector: React.FC<Props> = ({ currentLevel, onSelect }) => {
  const levels: { id: CambridgeLevel; color: string; icon: React.ReactNode }[] = [
    { id: 'Starters', color: 'text-red-500', icon: <Star size={14} className="fill-current" /> },
    { id: 'Movers', color: 'text-blue-500', icon: <Zap size={14} className="fill-current" /> },
    { id: 'Flyers', color: 'text-purple-500', icon: <Award size={14} className="fill-current" /> },
  ];

  return (
    <div className="bg-gray-100 p-1.5 rounded-2xl flex relative mb-6 shadow-inner">
      {levels.map((lvl) => {
        const isActive = currentLevel === lvl.id;
        return (
          <button
            key={lvl.id}
            onClick={() => onSelect(lvl.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 relative z-10 ${
              isActive 
                ? 'text-gray-800 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {isActive && (
                <div className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10 animate-in fade-in zoom-in-95 duration-200"></div>
            )}
            <span className={isActive ? lvl.color : ''}>{lvl.icon}</span>
            {lvl.id}
          </button>
        );
      })}
    </div>
  );
};
