
import React, { useState, useEffect } from 'react';
import { CambridgeLevel, QuizQuestion } from '../types';
import { generateQuiz } from '../services/geminiService';
import { Button } from '../components/Button';
import { CheckCircle, XCircle, Brain, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { playSFX } from '../utils/soundEffects';

interface Props {
  level: CambridgeLevel;
  addCoin: (amount: number) => void;
}

export const Quiz: React.FC<Props> = ({ level, addCoin }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  // Multiple Choice State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Scramble State
  const [scramblePool, setScramblePool] = useState<{id: string, word: string}[]>([]);
  const [scrambleAnswer, setScrambleAnswer] = useState<{id: string, word: string}[]>([]);

  const loadQuiz = async () => {
    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    try {
      const data = await generateQuiz(level);
      setQuestions(data);
      // Initialize first question state if it exists
      if (data.length > 0 && data[0].type === 'scramble') {
          initScramble(data[0].scrambleSentence || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const initScramble = (sentence: string) => {
      const words = sentence.split(' ').map((w, i) => ({ id: `${i}-${w}`, word: w }));
      // Shuffle words
      setScramblePool(words.sort(() => Math.random() - 0.5));
      setScrambleAnswer([]);
  };

  useEffect(() => {
    loadQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const handleMCAnswer = (index: number) => {
    if (showResult) return;
    const currentQ = questions[currentIndex];
    setSelectedOption(index);
    setShowResult(true);
    
    if (index === currentQ.correctAnswer) {
      setScore(s => s + 1);
      addCoin(10);
      playSFX('correct');
    } else {
      playSFX('wrong');
    }
  };

  const handleScrambleWordClick = (wordObj: {id: string, word: string}, from: 'pool' | 'answer') => {
      if (showResult) return;
      playSFX('click');

      if (from === 'pool') {
          setScramblePool(prev => prev.filter(w => w.id !== wordObj.id));
          setScrambleAnswer(prev => [...prev, wordObj]);
      } else {
          setScrambleAnswer(prev => prev.filter(w => w.id !== wordObj.id));
          setScramblePool(prev => [...prev, wordObj]);
      }
  };

  const checkScrambleAnswer = () => {
      const currentQ = questions[currentIndex];
      const builtSentence = scrambleAnswer.map(w => w.word).join(' ');
      const targetSentence = currentQ.scrambleSentence || "";
      
      // Remove punctuation for easier matching
      const cleanBuilt = builtSentence.replace(/[.,!?]/g, '').toLowerCase().trim();
      const cleanTarget = targetSentence.replace(/[.,!?]/g, '').toLowerCase().trim();

      setShowResult(true);
      if (cleanBuilt === cleanTarget) {
          setScore(s => s + 1);
          addCoin(15); // Higher reward for scramble
          playSFX('correct');
      } else {
          playSFX('wrong');
      }
  };

  const nextQuestion = () => {
    playSFX('click');
    setSelectedOption(null);
    setShowResult(false);
    
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      const nextQ = questions[nextIdx];
      setCurrentIndex(nextIdx);
      if (nextQ.type === 'scramble') {
          initScramble(nextQ.scrambleSentence || "");
      }
    } else {
      // End of quiz
      loadQuiz();
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-6">
        <div className="relative">
            <div className="absolute inset-0 bg-purple-200 rounded-full animate-ping opacity-20"></div>
            <Brain className="w-16 h-16 text-purple-500 animate-pulse relative z-10" />
        </div>
        <p className="font-medium animate-pulse">Thinking up tricky questions...</p>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const progressPercent = ((currentIndex) / questions.length) * 100;
  const isScramble = currentQ.type === 'scramble';

  return (
    <div className="space-y-6 pb-24">
      {/* Progress Bar */}
      <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
          </div>
          <span className="text-xs font-bold text-slate-400 tabular-nums">
              {currentIndex + 1} / {questions.length}
          </span>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-white ring-1 ring-slate-100 min-h-[400px] flex flex-col">
        <div className="mb-8">
            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-lg mb-3 border ${isScramble ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                {isScramble ? '🧩 Sentence Builder' : '📝 Grammar Challenge'}
            </span>
            <h3 className="text-xl font-bold text-slate-800 leading-relaxed">
                {currentQ.question}
            </h3>
        </div>

        {/* MULTIPLE CHOICE UI */}
        {!isScramble && currentQ.options && (
            <div className="space-y-4 flex-1">
            {currentQ.options.map((option, idx) => {
                let stateStyle = "bg-white border-slate-200 hover:border-blue-300 text-slate-700 shadow-sm";
                let icon = null;

                if (showResult) {
                if (idx === currentQ.correctAnswer) {
                    stateStyle = "bg-green-50 border-green-500 text-green-700 shadow-green-100";
                    icon = <CheckCircle size={20} className="text-green-600" />;
                } else if (idx === selectedOption) {
                    stateStyle = "bg-red-50 border-red-500 text-red-700 shadow-red-100";
                    icon = <XCircle size={20} className="text-red-500" />;
                } else {
                    stateStyle = "opacity-40 grayscale border-slate-100 bg-slate-50";
                }
                } else if (selectedOption === idx) {
                    stateStyle = "bg-purple-50 border-purple-500 text-purple-800";
                }

                return (
                <button
                    key={idx}
                    disabled={showResult}
                    onClick={() => handleMCAnswer(idx)}
                    className={`w-full p-5 rounded-2xl border-2 text-left font-bold text-lg transition-all duration-200 flex items-center justify-between active:scale-98 ${stateStyle}`}
                >
                    <span>{option}</span>
                    {icon}
                </button>
                );
            })}
            </div>
        )}

        {/* SCRAMBLE UI */}
        {isScramble && (
            <div className="flex-1 flex flex-col justify-between">
                {/* Answer Area */}
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 min-h-[100px] mb-6 flex flex-wrap gap-2 content-start">
                    {scrambleAnswer.length === 0 && !showResult && (
                        <span className="text-slate-300 font-bold text-sm w-full text-center mt-6">Tap words below to build the sentence</span>
                    )}
                    {scrambleAnswer.map(wordObj => (
                        <button
                            key={wordObj.id}
                            disabled={showResult}
                            onClick={() => handleScrambleWordClick(wordObj, 'answer')}
                            className="bg-white px-4 py-2 rounded-xl border-b-4 border-blue-200 text-blue-600 font-bold shadow-sm active:scale-95 transition-transform"
                        >
                            {wordObj.word}
                        </button>
                    ))}
                </div>

                {/* Word Pool */}
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                    {scramblePool.map(wordObj => (
                        <button
                            key={wordObj.id}
                            disabled={showResult}
                            onClick={() => handleScrambleWordClick(wordObj, 'pool')}
                            className="bg-orange-50 px-4 py-3 rounded-xl border-b-4 border-orange-200 text-orange-700 font-bold shadow-sm active:scale-95 transition-transform hover:bg-orange-100"
                        >
                            {wordObj.word}
                        </button>
                    ))}
                </div>

                {!showResult && (
                     <Button 
                        onClick={checkScrambleAnswer} 
                        fullWidth 
                        variant="accent"
                        disabled={scrambleAnswer.length === 0}
                     >
                        Check My Sentence
                     </Button>
                )}
            </div>
        )}

        {showResult && (
          <div className="mt-8 pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="bg-blue-50/80 p-5 rounded-2xl text-blue-900 text-sm mb-6 flex gap-3 border border-blue-100">
                <Sparkles size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold block mb-1 text-blue-600">Teacher's Note:</span>
                    <span className="leading-relaxed">
                        {isScramble ? `Correct Sentence: "${currentQ.scrambleSentence}"` : currentQ.explanation}
                    </span>
                </div>
            </div>
            <Button onClick={nextQuestion} fullWidth variant="primary" size="lg" className="rounded-2xl shadow-blue-200 shadow-lg">
              {isLast ? "Finish Quiz" : "Next Question"} <ArrowRight className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
