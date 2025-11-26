import React, { useState } from 'react';
import { UserProgress, CambridgeLevel } from '../types';
import { FULL_SYLLABUS } from '../data/syllabus';
import { Button } from '../components/Button';
import { Trash2, Volume2, CheckCircle, Keyboard, AlertCircle, RefreshCw, Eraser, PenTool, XCircle } from 'lucide-react';
import { playSFX } from '../utils/soundEffects';
import { speak } from '../utils/textToSpeech';

interface Props {
  progress: UserProgress;
  onResolveMistake: (word: string) => void;
  onMistake: (word: string, unitId: string) => void;
  addCoin: (amount: number) => void;
  level: CambridgeLevel;
}

type Mode = 'menu' | 'spelling-setup' | 'spelling-test';

export const Review: React.FC<Props> = ({ progress, onResolveMistake, onMistake, addCoin, level }) => {
  const [activeTab, setActiveTab] = useState<'mistakes' | 'spelling'>('mistakes');
  
  // Spelling Test State
  const [mode, setMode] = useState<Mode>('menu');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [testWords, setTestWords] = useState<{word: string, unitId: string}[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');

  // Filter syllabus by level
  const currentUnits = FULL_SYLLABUS.filter(u => u.level === level);

  const startSpellingTest = (unitId: string) => {
    playSFX('click');
    let words: string[] = [];
    if (unitId === 'all') {
        // Only get words from unlocked units of the CURRENT level
        const unlockedIds = progress.unlockedUnits.filter(uid => 
            currentUnits.some(u => u.id === uid)
        );
        
        unlockedIds.forEach(uid => {
            const unit = currentUnits.find(u => u.id === uid);
            if (unit) words = [...words, ...unit.words];
        });
    } else {
        const unit = currentUnits.find(u => u.id === unitId);
        if (unit) words = [...unit.words];
    }

    if (words.length === 0) {
        alert("No words unlocked in this level yet!");
        return;
    }

    const shuffled = words.sort(() => 0.5 - Math.random()).slice(0, 10);
    setTestWords(shuffled.map(w => ({ word: w, unitId: unitId === 'all' ? 'mixed' : unitId })));
    setCurrentTestIndex(0);
    setUserInput('');
    setFeedback('none');
    setMode('spelling-test');
    
    setTimeout(() => speak(shuffled[0]), 500);
  };

  const checkSpelling = () => {
    const currentWord = testWords[currentTestIndex].word;
    
    if (userInput.toLowerCase().trim() === currentWord.toLowerCase()) {
        playSFX('correct');
        setFeedback('correct');
        addCoin(5);
        
        if (progress.mistakes.find(m => m.word === currentWord)) {
            onResolveMistake(currentWord);
        }

        setTimeout(() => {
            if (currentTestIndex < testWords.length - 1) {
                setCurrentTestIndex(prev => prev + 1);
                setUserInput('');
                setFeedback('none');
                setTimeout(() => speak(testWords[currentTestIndex + 1].word), 300);
            } else {
                playSFX('success');
                alert("Test Complete! +50 Coins Bonus!");
                addCoin(50);
                setMode('menu');
            }
        }, 1500);
    } else {
        playSFX('wrong');
        setFeedback('wrong');
        onMistake(currentWord, testWords[currentTestIndex].unitId);
    }
  };

  const renderMistakesTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
        {progress.mistakes.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center bg-white rounded-[2rem] shadow-sm border border-slate-100">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100">
                    <CheckCircle size={48} className="text-green-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">All Clear!</h3>
                <p className="text-slate-400 font-medium px-8 leading-relaxed">You've mastered all your words. Amazing job!</p>
                <Button onClick={() => setActiveTab('spelling')} variant="primary" className="mt-8 rounded-xl shadow-blue-200">
                    Take a Spelling Test
                </Button>
            </div>
        ) : (
            <div className="space-y-3">
                <div className="flex justify-between items-center mb-2 px-1">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Mistake Bank ({progress.mistakes.length})</h3>
                </div>
                {progress.mistakes.map((mistake, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl border-l-[6px] border-red-400 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                        <div>
                            <span className="text-2xl font-black text-slate-800 block mb-1">{mistake.word}</span>
                            <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-full border border-red-100 tracking-wide uppercase">Needs Practice</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => speak(mistake.word)}
                                className="p-3 bg-slate-50 rounded-xl text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                            >
                                <Volume2 size={20} />
                            </button>
                            <button 
                                onClick={() => {
                                    playSFX('success');
                                    onResolveMistake(mistake.word);
                                }}
                                className="p-3 bg-green-50 rounded-xl text-green-500 hover:bg-green-100 hover:text-green-600 border border-green-100 transition-colors"
                                title="I know this now"
                            >
                                <CheckCircle size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  const renderSpellingTab = () => {
    if (mode === 'menu') {
        return (
            <div className="space-y-6">
                <div className="bg-purple-50/80 p-6 rounded-[2rem] border border-purple-100 shadow-inner">
                    <h3 className="font-bold text-purple-900 flex items-center gap-2 text-lg mb-2">
                        <PenTool size={20} className="fill-purple-200" /> {level} Spelling Bee
                    </h3>
                    <p className="text-sm text-purple-800/70 font-medium leading-relaxed">Listen to the word and type it correctly. Focus on {level} vocabulary!</p>
                </div>
                
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Select a Unit</h4>
                {currentUnits.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">Content for {level} coming soon!</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => startSpellingTest('all')}
                            className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-[1.5rem] shadow-lg shadow-blue-200 font-bold text-left active:scale-95 transition-transform border border-white/20"
                        >
                            All Unlocked <br/>
                            <span className="text-xs opacity-70 font-medium block mt-1">Mixed Challenge</span>
                        </button>
                        {currentUnits.map(unit => {
                            const isLocked = !progress.unlockedUnits.includes(unit.id);
                            return (
                                <button
                                    key={unit.id}
                                    disabled={isLocked}
                                    onClick={() => startSpellingTest(unit.id)}
                                    className={`p-4 rounded-[1.5rem] border-2 text-left transition-all duration-300 ${
                                        isLocked 
                                        ? 'bg-slate-50 border-slate-100 text-slate-300' 
                                        : 'bg-white border-slate-100 hover:border-blue-300 text-slate-700 active:scale-95 shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    <span className="text-3xl block mb-2 filter drop-shadow-sm">{isLocked ? '🔒' : unit.icon}</span>
                                    <span className="font-black text-sm leading-tight block">{unit.title}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    if (mode === 'spelling-test') {
        const currentWord = testWords[currentTestIndex];
        return (
            <div className="flex flex-col items-center pt-8 px-4 h-full">
                <div className="w-full flex justify-between items-center mb-12">
                     <span className="text-slate-400 font-bold text-sm tracking-wide">Word {currentTestIndex + 1} / {testWords.length}</span>
                     <button onClick={() => setMode('menu')} className="text-slate-300 hover:text-red-500 transition-colors"><XCircle size={24}/></button>
                </div>

                <button 
                    onClick={() => speak(currentWord.word)}
                    className="w-32 h-32 bg-blue-500 rounded-full shadow-2xl shadow-blue-300 flex items-center justify-center text-white mb-10 active:scale-90 transition-transform cursor-pointer group"
                >
                    <Volume2 size={48} className="group-hover:animate-ping" />
                </button>
                
                <div className="text-center mb-8">
                    <p className="text-slate-500 font-medium">Tap button to listen, then spell it!</p>
                </div>

                <div className="w-full max-w-xs relative">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => {
                            setUserInput(e.target.value);
                            setFeedback('none');
                        }}
                        placeholder="..."
                        className={`w-full text-center text-4xl font-black tracking-[0.2em] py-4 border-b-4 bg-transparent outline-none transition-colors ${
                            feedback === 'correct' ? 'border-green-500 text-green-600' :
                            feedback === 'wrong' ? 'border-red-500 text-red-500' :
                            'border-slate-200 text-slate-800 focus:border-blue-500'
                        }`}
                        autoFocus
                    />
                    {feedback === 'correct' && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in spin-in-90 duration-300">
                            <CheckCircle size={32} />
                        </div>
                    )}
                    {feedback === 'wrong' && (
                         <div className="absolute right-0 top-1/2 -translate-y-1/2 text-red-500 animate-in zoom-in shake">
                            <AlertCircle size={32} />
                         </div>
                    )}
                </div>

                {feedback === 'wrong' && (
                    <div className="mt-8 text-red-500 bg-red-50 px-6 py-3 rounded-2xl animate-in slide-in-from-top-4 border border-red-100 shadow-sm">
                        Correct spelling: <span className="font-black tracking-widest ml-2">{currentWord.word}</span>
                    </div>
                )}

                <div className="mt-auto pb-8 w-full">
                    <Button 
                        onClick={checkSpelling} 
                        fullWidth 
                        size="lg" 
                        className={`rounded-2xl shadow-lg h-16 text-xl ${feedback === 'correct' ? 'opacity-0 pointer-events-none' : ''}`}
                        disabled={userInput.length === 0}
                    >
                        Check Answer
                    </Button>
                </div>
            </div>
        )
    }

    return null;
  };

  return (
    <div className="pb-24">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 mx-4">
        <button 
            onClick={() => setActiveTab('mistakes')}
            className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 ${
                activeTab === 'mistakes' 
                ? 'bg-white text-red-500 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
        >
            <Eraser size={16} /> Mistakes
        </button>
        <button 
            onClick={() => {
                setActiveTab('spelling');
                setMode('menu');
            }}
            className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 ${
                activeTab === 'spelling' 
                ? 'bg-white text-purple-500 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
        >
            <Keyboard size={16} /> Spelling
        </button>
      </div>

      <div className="px-4">
        {activeTab === 'mistakes' ? renderMistakesTab() : renderSpellingTab()}
      </div>
    </div>
  );
};