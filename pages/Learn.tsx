
import React, { useState, useEffect } from 'react';
import { CambridgeLevel, VocabularyCard, UserProgress } from '../types';
import { FULL_SYLLABUS } from '../data/syllabus';
import { generateVocabBatch, generateIllustration } from '../services/geminiService';
import { Button } from '../components/Button';
import { Volume2, Image as ImageIcon, ChevronRight, Gamepad2, Check, ArrowLeft, Lock, Share2, Star, Sparkles, Coins, Play, CheckCircle2, WifiOff } from 'lucide-react';
import { playSFX } from '../utils/soundEffects';
import { speak } from '../utils/textToSpeech';

interface Props {
  level: CambridgeLevel;
  addCoin: (amount: number) => void;
  progress: UserProgress;
  onLevelComplete: (unitId: string, stars: number) => void;
  onMistake: (word: string, unitId: string) => void; 
}

type Mode = 'topic-selection' | 'loading' | 'study' | 'game' | 'game-success';

export const Learn: React.FC<Props> = ({ level, addCoin, progress, onLevelComplete, onMistake }) => {
  const [mode, setMode] = useState<Mode>('topic-selection');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [vocabList, setVocabList] = useState<VocabularyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Image Generation State
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

  // Game State
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [shuffledCards, setShuffledCards] = useState<{left: VocabularyCard[], right: VocabularyCard[]}>({ left: [], right: [] });

  const currentUnits = FULL_SYLLABUS.filter(unit => unit.level === level);

  useEffect(() => {
    setMode('topic-selection');
  }, [level]);

  const handleSelectUnit = async (unitId: string, isLocked: boolean) => {
    if (isLocked) {
      playSFX('wrong');
      return;
    }

    const unit = FULL_SYLLABUS.find(u => u.id === unitId);
    if (!unit) return;

    playSFX('click');
    setSelectedUnitId(unitId);
    setMode('loading');
    setIsOfflineMode(false);
    
    try {
      const cards = await generateVocabBatch(level, unit.title, unit.words);
      if (cards.length === 0) throw new Error("No cards generated");
      
      // Check if we got fallback data (indicated by specific ID format)
      if (cards[0].id.startsWith('offline-')) {
          setIsOfflineMode(true);
      }

      setVocabList(cards);
      setCurrentIndex(0);
      setMode('study');
    } catch (e) {
      console.error(e);
      setMode('topic-selection');
      // Gentle toast instead of blocking alert
      console.log("Could not load lesson data.");
    }
  };

  const handleNextLevel = () => {
      const currentIndex = currentUnits.findIndex(u => u.id === selectedUnitId);
      if (currentIndex !== -1 && currentIndex < currentUnits.length - 1) {
          const nextUnit = currentUnits[currentIndex + 1];
          handleSelectUnit(nextUnit.id, false); 
      } else {
          setMode('topic-selection');
      }
  };

  const handleGenerateImage = async () => {
    playSFX('click');
    const card = vocabList[currentIndex];
    if (!card || generatedImages[card.id]) return;
    
    // Skip if offline mode to save user frustration
    if (isOfflineMode) {
        alert("Image generation requires internet and API quota.");
        return;
    }

    setImageLoading(true);
    try {
      const prompt = card.imagePrompt ? `${card.word}, ${card.imagePrompt}` : card.word;
      const base64 = await generateIllustration(prompt);
      if (base64) {
        setGeneratedImages(prev => ({ ...prev, [card.id]: base64 }));
        addCoin(5);
      } else {
        alert("Could not paint picture right now. Try again later!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setImageLoading(false);
    }
  };

  const startGame = () => {
    playSFX('success');
    const left = [...vocabList].sort(() => Math.random() - 0.5);
    const right = [...vocabList].sort(() => Math.random() - 0.5);
    setShuffledCards({ left, right });
    setMatchedIds(new Set());
    setSelectedMatchId(null);
    setMode('game');
  };

  const handleMatchClick = (id: string, side: 'word' | 'def') => {
    if (matchedIds.has(id)) return;
    playSFX('click');

    if (!selectedMatchId) {
      setSelectedMatchId(id);
    } else {
      if (selectedMatchId === id) {
          playSFX('correct');
          const newMatched = new Set(matchedIds);
          newMatched.add(id);
          setMatchedIds(newMatched);
          addCoin(2); 
          if (newMatched.size === vocabList.length) {
              const stars = 3; 
              onLevelComplete(selectedUnitId, stars);
              setTimeout(() => setMode('game-success'), 500);
          }
      } else {
          playSFX('wrong');
          const mistakenCard = vocabList.find(c => c.id === id || c.id === selectedMatchId);
          if (mistakenCard) {
              onMistake(mistakenCard.word, selectedUnitId);
          }
      }
      setSelectedMatchId(null);
    }
  };

  const handleShare = async () => {
    playSFX('click');
    const unitTitle = FULL_SYLLABUS.find(u => u.id === selectedUnitId)?.title;
    const text = `I just mastered the "${unitTitle}" unit in Cambridge Kids AI! 🌟`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My English Progress',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert("Text copied!");
    }
  };

  // --- RENDERERS ---

  if (mode === 'topic-selection') {
    return (
      <div className="space-y-6 pb-20">
        <div className="text-center mb-8 px-4">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{level} Map</h2>
          <p className="text-slate-500 font-medium">Follow the path to master English!</p>
        </div>
        
        {currentUnits.length === 0 ? (
             <div className="text-center p-10 bg-white rounded-3xl mx-4">
                <p className="text-slate-400">Content for {level} coming soon!</p>
             </div>
        ) : (
            <div className="flex flex-col gap-8 relative px-4">
                <div className="absolute left-1/2 top-10 bottom-10 w-2 -translate-x-1/2 -z-10 opacity-20">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <path 
                            d={`M 0,0 
                            Q -40,100 0,200 
                            T 0,400 
                            T 0,600 
                            T 0,800
                            T 0,1000`} 
                            fill="none" 
                            stroke="#94A3B8" 
                            strokeWidth="4" 
                            strokeDasharray="12 12"
                        />
                    </svg>
                </div>

                {currentUnits.map((unit, index) => {
                    const isLocked = !progress.unlockedUnits.includes(unit.id);
                    const isCompleted = progress.completedUnits[unit.id] !== undefined;
                    const stars = progress.completedUnits[unit.id] || 0;
                    const isNext = !isLocked && !isCompleted;

                    const alignment = index % 2 === 0 ? 'items-start pl-2' : 'items-end pr-2';

                    return (
                    <div key={unit.id} className={`flex flex-col ${alignment} relative`}>
                        <button
                            disabled={isLocked}
                            onClick={() => handleSelectUnit(unit.id, isLocked)}
                            className={`relative w-40 h-36 rounded-[2rem] border-b-8 transition-all duration-300 p-4 flex flex-col items-center justify-center gap-3 shadow-xl z-10 group
                                ${isLocked 
                                    ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' 
                                    : isCompleted
                                        ? 'bg-white border-green-200 ring-4 ring-green-50'
                                        : `${unit.color} hover:scale-105 active:scale-95 active:border-b-4 translate-y-0 ring-4 ring-white`
                                }`}
                        >
                            {isLocked ? (
                                <Lock className="text-slate-300 mb-1" size={32} />
                            ) : (
                                <>
                                    <span className="text-4xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">{unit.icon}</span>
                                    <div className="leading-none text-center">
                                        <span className={`font-black text-lg block tracking-tight ${isCompleted ? 'text-green-600' : ''}`}>{unit.title}</span>
                                        <span className="text-[10px] uppercase font-bold opacity-70 tracking-wider block mt-1.5">{unit.description}</span>
                                    </div>
                                    
                                    {isCompleted && (
                                        <>
                                            <div className="flex gap-1 absolute -top-3 -right-3 bg-white px-2 py-1.5 rounded-full shadow-md border border-yellow-100 rotate-3 z-20">
                                                {[...Array(3)].map((_, i) => (
                                                    <Star key={i} size={12} className={`${i < stars ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-100'}`} />
                                                ))}
                                            </div>
                                            <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                                                <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                                    <Check size={10} strokeWidth={4} /> DONE
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    
                                    {isNext && (
                                        <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg animate-bounce z-20">
                                            START
                                        </div>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                    )
                })}
            </div>
        )}
      </div>
    );
  }

  if (mode === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8">
        <div className="relative">
          <div className="w-32 h-32 bg-blue-100 rounded-full animate-ping absolute opacity-50"></div>
          <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center relative z-10 text-5xl animate-bounce shadow-xl shadow-blue-300">
            ✨
          </div>
        </div>
        <div>
            <h2 className="text-2xl font-black text-slate-700 mb-2">Preparing Lesson...</h2>
            <p className="text-slate-400 font-medium max-w-[200px] mx-auto leading-relaxed">Crafting magical words and pictures just for you.</p>
        </div>
      </div>
    );
  }

  if (mode === 'study') {
    const card = vocabList[currentIndex];
    const hasImage = generatedImages[card.id];
    const displayEmoji = card.emoji && card.emoji.length <= 2 ? card.emoji : "🌟";

    return (
      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center px-1">
            <button onClick={() => setMode('topic-selection')} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold transition-colors">
                <ArrowLeft size={18}/> Map
            </button>
            {isOfflineMode && (
                <div className="flex items-center gap-1 text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold">
                    <WifiOff size={12}/> Offline Mode
                </div>
            )}
            <div className="flex gap-1.5 bg-white p-1 rounded-full shadow-sm border border-slate-100">
                {vocabList.map((_, i) => (
                    <div key={i} className={`h-2 w-2 rounded-full transition-all ${i === currentIndex ? 'bg-blue-500 w-6' : 'bg-slate-200'}`} />
                ))}
            </div>
        </div>

        {/* Card Component */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden border border-white ring-1 ring-slate-100 min-h-[500px] flex flex-col relative transform transition-all duration-500">
           <div className="aspect-[4/3] bg-gradient-to-b from-blue-50 to-white relative flex items-center justify-center overflow-hidden shrink-0 group">
             {hasImage ? (
                <img src={hasImage} alt={card.word} className="w-full h-full object-cover animate-in fade-in duration-700" />
             ) : (
                <div className="text-center p-4">
                    <span className="text-8xl sm:text-9xl mb-4 block animate-bounce-slow filter drop-shadow-xl transform group-hover:scale-110 transition-transform duration-300">{displayEmoji}</span>
                </div>
             )}
             
             {!hasImage && !imageLoading && !isOfflineMode && (
                <Button variant="secondary" size="sm" onClick={handleGenerateImage} className="absolute bottom-6 right-6 shadow-xl z-10 rounded-full pl-3 pr-4 py-2 border-white/50 border-t backdrop-blur-md">
                    <ImageIcon size={18} /> Reveal Magic
                </Button>
             )}

             {imageLoading && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center flex-col gap-3 z-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                    <span className="text-blue-500 font-bold text-sm">Painting...</span>
                 </div>
             )}
          </div>

          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between relative bg-white">
            <Button 
                onClick={() => speak(card.word)} 
                variant="outline" 
                className="absolute top-2 right-4 sm:-top-6 sm:right-6 rounded-full !p-3 shadow-lg bg-white border-2 border-blue-100 hover:border-blue-300 text-blue-500 z-10"
            >
                <Volume2 size={24} />
            </Button>

            <div className="text-center mb-6 mt-2">
                <h1 className={`font-black text-slate-800 tracking-tight mb-2 leading-tight ${card.word.length > 8 ? 'text-3xl' : 'text-4xl sm:text-5xl'}`}>
                    {card.word}
                </h1>
                <p className="text-slate-500 font-mono text-lg tracking-wide bg-slate-100 inline-block px-4 py-1.5 rounded-full border border-slate-200">
                    {card.pronunciation || '...'}
                </p>
            </div>

            <div className="space-y-4 pb-4">
                <div className="bg-orange-50/80 p-4 rounded-2xl border border-orange-100 text-center">
                    <p className="text-slate-800 font-bold leading-relaxed text-sm sm:text-base">{card.definition || 'Definition loading...'}</p>
                </div>

                <div 
                    className="text-left bg-blue-50/50 p-4 rounded-2xl border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors group" 
                    onClick={() => speak(card.exampleSentence)}
                >
                    <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-lg text-blue-500 mt-0.5 shrink-0">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <p className="text-blue-950 font-bold italic text-base sm:text-lg leading-snug mb-1 group-hover:text-blue-700 transition-colors">"{card.exampleSentence || 'Example...'}"</p>
                            <p className="text-slate-600 text-sm font-medium">{card.sentenceTranslation || '...'}</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 px-2">
            <Button 
                disabled={currentIndex === 0}
                onClick={() => {
                    playSFX('click');
                    setCurrentIndex(c => c - 1);
                }}
                variant="outline"
                className="flex-1 rounded-2xl h-14"
            >
                Prev
            </Button>
            
            {currentIndex === vocabList.length - 1 ? (
                <Button onClick={startGame} variant="accent" className="flex-[2] rounded-2xl h-14 shadow-green-200 shadow-lg text-lg">
                    Start Challenge! <Gamepad2 size={20} className="ml-2" />
                </Button>
            ) : (
                <Button onClick={() => {
                    playSFX('click');
                    setCurrentIndex(c => c + 1);
                }} variant="primary" className="flex-[2] rounded-2xl h-14 shadow-blue-200 shadow-lg text-lg">
                    Next Word <ChevronRight className="ml-1" />
                </Button>
            )}
        </div>
      </div>
    );
  }

  // ... game renderers logic remains similar, just pass-through
  if (mode === 'game') {
      return (
          <div className="space-y-4 pb-20">
              <div className="flex justify-between items-center px-2 mb-2">
                <button onClick={() => setMode('study')} className="text-slate-400 flex items-center gap-1 text-sm font-bold hover:text-slate-600">
                    <ArrowLeft size={16}/> Quit
                </button>
                <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Matches</span>
                    <div className="flex gap-1">
                        {[...Array(vocabList.length)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${i < matchedIds.size ? 'bg-green-500 scale-125' : 'bg-slate-200'}`}></div>
                        ))}
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                      {shuffledCards.left.map(card => {
                          const isMatched = matchedIds.has(card.id);
                          const isSelected = selectedMatchId === card.id;
                          return (
                              <button
                                key={`l-${card.id}`}
                                disabled={isMatched}
                                onClick={() => handleMatchClick(card.id, 'word')}
                                className={`w-full p-2 h-32 rounded-3xl flex items-center justify-center font-bold text-lg border-b-[6px] transition-all duration-200 relative ${
                                    isMatched 
                                    ? 'bg-green-50 text-green-300 border-green-100 scale-95 shadow-none' 
                                    : isSelected
                                        ? 'bg-blue-600 text-white border-blue-800 scale-105 shadow-xl z-10 translate-y-[-4px]'
                                        : 'bg-white text-slate-700 border-slate-200 shadow-md hover:border-blue-200'
                                }`}
                              >
                                {isMatched && <div className="absolute inset-0 flex items-center justify-center"><Check size={32} /></div>}
                                <span className={isMatched ? 'opacity-0' : ''}>{card.word}</span>
                              </button>
                          )
                      })}
                  </div>
                  <div className="space-y-4">
                      {shuffledCards.right.map(card => {
                           const isMatched = matchedIds.has(card.id);
                           const displayEmoji = card.emoji && card.emoji.length <= 2 ? card.emoji : "✨";
                           
                           return (
                            <button
                                key={`r-${card.id}`}
                                disabled={isMatched}
                                onClick={() => handleMatchClick(card.id, 'def')}
                                className={`w-full p-3 h-32 rounded-3xl flex flex-col items-center justify-center text-sm border-b-[6px] transition-all duration-200 relative ${
                                    isMatched 
                                    ? 'bg-green-50 text-green-300 border-green-100 scale-95 shadow-none' 
                                    : 'bg-white text-slate-600 border-slate-200 shadow-md hover:border-blue-200'
                                }`}
                              >
                                {isMatched ? <Check size={32} /> : (
                                    <>
                                        <span className="text-4xl mb-2 filter drop-shadow-sm">{displayEmoji}</span>
                                        <span className="leading-tight text-xs font-bold text-slate-400 line-clamp-2">{card.definition}</span>
                                    </>
                                )}
                              </button>
                           )
                      })}
                  </div>
              </div>
          </div>
      )
  }

  if (mode === 'game-success') {
      const currentUnitIndex = currentUnits.findIndex(u => u.id === selectedUnitId);
      const nextUnit = currentUnitIndex !== -1 && currentUnitIndex < currentUnits.length - 1 
        ? currentUnits[currentUnitIndex + 1] 
        : null;

      return (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-8 animate-in zoom-in duration-500 px-6">
              <div className="relative">
                  <div className="absolute inset-0 bg-yellow-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative z-10 flex gap-3 items-end">
                     <Star size={56} className="text-yellow-400 fill-yellow-400 animate-bounce delay-100 filter drop-shadow-md" />
                     <Star size={80} className="text-yellow-400 fill-yellow-400 animate-bounce filter drop-shadow-lg" />
                     <Star size={56} className="text-yellow-400 fill-yellow-400 animate-bounce delay-200 filter drop-shadow-md" />
                  </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">Level Complete!</h1>
                <p className="text-slate-500 text-lg font-medium">You unlocked the next adventure!</p>
                
                <div className="flex items-center justify-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-100 w-fit mx-auto mt-4">
                     <Coins size={20} className="fill-yellow-500"/>
                     <span className="font-bold">+30 Coins</span>
                </div>
              </div>
              
              <div className="w-full max-w-xs space-y-4 pt-8">
                  {nextUnit && (
                      <Button onClick={handleNextLevel} fullWidth size="lg" className="bg-blue-500 border-blue-700 hover:bg-blue-600 shadow-blue-200 shadow-xl rounded-2xl py-4 text-xl">
                          Next Lesson: {nextUnit.title} <Play size={20} className="ml-2 fill-current" />
                      </Button>
                  )}
                  
                  <div className="flex gap-3">
                      <Button onClick={handleShare} fullWidth size="lg" className="bg-green-500 border-green-700 hover:bg-green-600 shadow-green-200 shadow-xl rounded-2xl py-4 flex-1">
                          Share <Share2 size={20} className="ml-2" />
                      </Button>
                      <Button onClick={() => setMode('topic-selection')} fullWidth size="lg" variant="outline" className="border-2 rounded-2xl py-4 flex-1">
                          Map
                      </Button>
                  </div>
              </div>
          </div>
      )
  }

  return null;
};
