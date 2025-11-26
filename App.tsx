
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CambridgeLevel, AppState, UserProgress } from './types';
import { FULL_SYLLABUS } from './data/syllabus';
import { LevelSelector } from './components/LevelSelector';
import { Learn } from './pages/Learn';
import { Quiz } from './pages/Quiz';
import { Chat } from './pages/Chat';
import { Review } from './pages/Review';
import { playSFX } from './utils/soundEffects';
import { BookOpen, HelpCircle, MessageCircle, Coins, Star, Flame, X, RotateCcw, ShoppingBag, Check, Cloud } from 'lucide-react';
import { Button } from './components/Button';

// Avatar List
const AVATARS = [
    { id: 'student', icon: '👦', name: 'Student', price: 0 },
    { id: 'girl', icon: '👧', name: 'Girl', price: 0 },
    { id: 'lion', icon: '🦁', name: 'Lion King', price: 50 },
    { id: 'astro', icon: '👩‍🚀', name: 'Explorer', price: 100 },
    { id: 'dino', icon: '🦖', name: 'Rex', price: 150 },
    { id: 'unicorn', icon: '🦄', name: 'Sparkle', price: 200 },
    { id: 'robot', icon: '🤖', name: 'Bot', price: 250 },
];

const INITIAL_PROGRESS: UserProgress = {
  // CRITICAL UPDATE: Unlock ALL units by default for testing/preview
  unlockedUnits: FULL_SYLLABUS.map(u => u.id),
  completedUnits: {} as any,
  totalStars: 0,
  mistakes: []
};

const INITIAL_STATE: AppState = {
  currentTab: 'learn',
  level: 'Starters',
  coins: 100,
  progress: INITIAL_PROGRESS,
  lastLoginDate: '',
  streakDays: 0,
  currentAvatar: 'student',
  unlockedAvatars: ['student', 'girl']
};

const App: React.FC = () => {
  // Initialize state from localStorage if available
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('cambridge-kids-state-v6'); // Bump version to force reset
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          progress: {
            ...parsed.progress,
            // Ensure all units remain unlocked even if loading old state
            unlockedUnits: [...new Set([...(parsed.progress.unlockedUnits || []), ...FULL_SYLLABUS.map(u => u.id)])],
          },
          // Ensure defaults exist
          currentAvatar: parsed.currentAvatar || 'student',
          unlockedAvatars: parsed.unlockedAvatars || ['student', 'girl']
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
        // If error, return initial state (which has everything unlocked)
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Daily Bonus Logic
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.lastLoginDate !== today) {
      let newStreak = state.streakDays;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      if (state.lastLoginDate === yesterdayString) {
        newStreak += 1;
      } else {
        newStreak = 1; 
      }

      setState(prev => ({
        ...prev,
        lastLoginDate: today,
        streakDays: newStreak
      }));
      
      // Delay bonus show slightly
      setTimeout(() => {
          setShowDailyBonus(true);
          playSFX('success');
      }, 1000);
    }
  }, []);

  // Save state
  useEffect(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('cambridge-kids-state-v6', JSON.stringify(state));
      setTimeout(() => setSaveStatus('saved'), 500);
    } catch (e) {
      console.error("Failed to save state", e);
    }
  }, [state]);

  const addCoin = (amount: number = 5) => {
    setState(prev => ({ ...prev, coins: prev.coins + amount }));
    playSFX('coin');
  };

  const claimBonus = () => {
    addCoin(20);
    setShowDailyBonus(false);
  };

  const handleLevelComplete = (unitId: string, stars: number) => {
    playSFX('success');
    setState(prev => {
      const newCompleted = { ...prev.progress.completedUnits, [unitId]: stars };
      return {
        ...prev,
        coins: prev.coins + (stars * 10), 
        progress: {
          ...prev.progress,
          completedUnits: newCompleted,
          totalStars: prev.progress.totalStars + stars
        }
      };
    });
  };

  const handleRecordMistake = (word: string, unitId: string) => {
    setState(prev => {
      if (prev.progress.mistakes.some(m => m.word === word)) return prev;
      return {
        ...prev,
        progress: {
          ...prev.progress,
          mistakes: [
            ...prev.progress.mistakes, 
            { word, unitId, timestamp: Date.now() }
          ]
        }
      };
    });
  };

  const handleResolveMistake = (word: string) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        mistakes: prev.progress.mistakes.filter(m => m.word !== word)
      }
    }));
  };

  const handleTabChange = (tab: AppState['currentTab']) => {
    playSFX('click');
    setState(prev => ({ ...prev, currentTab: tab }));
  };

  const handleBuyAvatar = (avatarId: string, price: number) => {
      if (state.coins >= price) {
          playSFX('success');
          setState(prev => ({
              ...prev,
              coins: prev.coins - price,
              unlockedAvatars: [...prev.unlockedAvatars, avatarId],
              currentAvatar: avatarId // Auto equip
          }));
      } else {
          playSFX('wrong');
          alert("Not enough coins!");
      }
  };

  const handleEquipAvatar = (avatarId: string) => {
      playSFX('click');
      setState(prev => ({ ...prev, currentAvatar: avatarId }));
  };

  const currentAvatarIcon = AVATARS.find(a => a.id === state.currentAvatar)?.icon || '👦';

  const NavItem = ({ id, icon, label, badge }: { id: AppState['currentTab'], icon: React.ReactNode, label: string, badge?: number }) => (
    <button 
        onClick={() => handleTabChange(id)}
        className={`flex flex-col items-center justify-center py-2 flex-1 transition-all duration-300 relative group ${
            state.currentTab === id 
            ? 'text-blue-600 -translate-y-2' 
            : 'text-gray-400 hover:text-gray-500'
        }`}
    >
        <div className={`p-3 rounded-2xl transition-all shadow-sm ${
            state.currentTab === id 
            ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg scale-110' 
            : 'bg-transparent group-hover:bg-gray-50'
        }`}>
            {icon}
            {badge && badge > 0 ? (
               <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md border-2 border-white">
                 {badge}
               </div>
            ) : null}
        </div>
        <span className={`text-[10px] uppercase tracking-wide font-bold mt-1 transition-opacity ${
            state.currentTab === id ? 'opacity-100' : 'opacity-0'
        }`}>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans selection:bg-blue-100">
      <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen sm:shadow-2xl sm:my-4 sm:rounded-[40px] relative flex flex-col overflow-hidden ring-8 ring-black/5">
        
        {/* Header */}
        <header className="px-6 py-5 bg-white/80 backdrop-blur-md z-20 sticky top-0 border-b border-gray-100 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setShowShop(true)}
                    className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl shadow-inner border-2 border-white relative overflow-hidden active:scale-95 transition-transform"
                >
                    {currentAvatarIcon}
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-blue-500/20"></div>
                </button>
                <div>
                    <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none flex items-center gap-2">
                        Hi, Friend! 
                        <Cloud size={14} className={`transition-colors ${saveStatus === 'saved' ? 'text-green-400' : 'text-slate-300 animate-pulse'}`} />
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            <Star size={10} className="text-yellow-400 fill-yellow-400"/> {state.progress.totalStars}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100">
                            <Flame size={10} className="text-orange-500 fill-orange-500"/> {state.streakDays}
                        </div>
                    </div>
                </div>
            </div>
            <button 
                onClick={() => { playSFX('click'); setShowShop(true); }}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-amber-100 pl-2 pr-3 py-1.5 rounded-full border border-yellow-200 shadow-sm active:scale-95 transition-transform"
            >
                <div className="bg-white rounded-full p-1 shadow-sm">
                    <Coins size={16} className="text-yellow-600 fill-yellow-500" />
                </div>
                <span className="text-sm font-black text-yellow-800">{state.coins}</span>
            </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 pb-32 overflow-y-auto no-scrollbar scroll-smooth">
            {state.currentTab !== 'review' && (
               <LevelSelector 
                  currentLevel={state.level} 
                  onSelect={(l) => {
                      playSFX('click');
                      setState(prev => ({ ...prev, level: l }));
                  }} 
               />
            )}
            
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                {state.currentTab === 'learn' && (
                  <Learn 
                    level={state.level} 
                    addCoin={addCoin} 
                    progress={state.progress}
                    onLevelComplete={handleLevelComplete}
                    onMistake={handleRecordMistake}
                  />
                )}
                {state.currentTab === 'quiz' && (
                  <Quiz 
                    level={state.level} 
                    addCoin={addCoin} 
                  />
                )}
                {state.currentTab === 'chat' && <Chat level={state.level} />}
                {state.currentTab === 'review' && (
                  <Review 
                    progress={state.progress}
                    onResolveMistake={handleResolveMistake}
                    addCoin={addCoin}
                    level={state.level}
                    onMistake={handleRecordMistake}
                  />
                )}
            </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe pt-2 px-6 pb-6 flex justify-between items-end z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
            <NavItem id="learn" icon={<BookOpen size={20} />} label="Learn" />
            <NavItem id="quiz" icon={<HelpCircle size={20} />} label="Quiz" />
            <NavItem id="review" icon={<RotateCcw size={20} />} label="Review" badge={state.progress.mistakes.length} />
            <NavItem id="chat" icon={<MessageCircle size={20} />} label="Buddy" />
        </nav>

        {/* Daily Bonus Modal */}
        {showDailyBonus && (
            <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="bg-white rounded-[32px] p-8 w-full max-w-xs text-center shadow-2xl transform scale-100 animate-in zoom-in-95 duration-300 border-4 border-white ring-4 ring-yellow-200/50">
                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-inner">
                        <span className="text-5xl animate-bounce filter drop-shadow-sm">🎁</span>
                        <div className="absolute inset-0 rounded-full border-4 border-yellow-300 animate-ping opacity-20"></div>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Daily Reward!</h2>
                    <p className="text-slate-500 mb-8 font-medium">You're back! Here are some coins for your adventure.</p>
                    
                    <div className="flex items-center justify-center gap-3 mb-8 bg-yellow-50 p-5 rounded-2xl border-2 border-yellow-100 dashed">
                        <Coins size={36} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-4xl font-black text-yellow-600 tracking-tight">+20</span>
                    </div>

                    <button 
                        onClick={claimBonus}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-200 border-b-4 border-blue-700 active:scale-95 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        Awesome!
                    </button>
                </div>
            </div>
        )}

        {/* SHOP MODAL */}
        {showShop && (
            <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center animate-in fade-in duration-300">
                <div className="bg-white rounded-t-[32px] sm:rounded-[32px] sm:m-6 h-[85vh] sm:h-auto overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300 flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10 sticky top-0">
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <ShoppingBag className="text-blue-500" /> Avatar Shop
                        </h2>
                        <button onClick={() => setShowShop(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                         <div className="grid grid-cols-2 gap-4">
                             {AVATARS.map(avatar => {
                                 const isUnlocked = state.unlockedAvatars.includes(avatar.id);
                                 const isEquipped = state.currentAvatar === avatar.id;
                                 
                                 return (
                                     <div key={avatar.id} className={`bg-white p-4 rounded-3xl border-2 flex flex-col items-center shadow-sm relative ${isEquipped ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100'}`}>
                                         <div className="text-6xl mb-4 transform hover:scale-110 transition-transform cursor-pointer" onClick={() => isUnlocked && handleEquipAvatar(avatar.id)}>
                                             {avatar.icon}
                                         </div>
                                         <span className="font-bold text-slate-700 mb-3">{avatar.name}</span>
                                         
                                         {isUnlocked ? (
                                             <Button 
                                                onClick={() => handleEquipAvatar(avatar.id)}
                                                variant={isEquipped ? 'outline' : 'primary'}
                                                size="sm"
                                                fullWidth
                                                className={`rounded-xl ${isEquipped ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}`}
                                                disabled={isEquipped}
                                             >
                                                {isEquipped ? 'Equipped' : 'Wear'}
                                             </Button>
                                         ) : (
                                             <Button 
                                                onClick={() => handleBuyAvatar(avatar.id, avatar.price)}
                                                variant="secondary"
                                                size="sm"
                                                fullWidth
                                                className="rounded-xl flex items-center justify-center gap-1"
                                             >
                                                <Coins size={14} /> {avatar.price}
                                             </Button>
                                         )}
                                     </div>
                                 )
                             })}
                         </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;
