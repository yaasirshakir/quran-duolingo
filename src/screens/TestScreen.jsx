import { useState, useMemo, useCallback } from 'react';
import { X, Check, BookOpen } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const wordKey = (w) => `w${w.id}`;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const stripParens = (t) => t.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();

function buildTestExercises(verses, learnedWords) {
  const allTranslations = [];
  verses.forEach((verse) => {
    verse.words
      .filter((w) => w.char_type_name === 'word' && w.translation?.text)
      .forEach((w) => {
        if (!learnedWords[wordKey(w)]) allTranslations.push(w.translation.text);
      });
  });

  const exercises = [];

  for (const verse of verses) {
    const words = verse.words.filter((w) => w.char_type_name === 'word');
    const testedWords = words.filter((w) => learnedWords[wordKey(w)]);
    if (testedWords.length === 0) continue;

    const correctTexts = testedWords.map((w) => w.translation.text);
    const distractors = shuffle(
      allTranslations.filter((t) => !correctTexts.includes(t))
    ).slice(0, Math.max(3, testedWords.length));

    const bankItems = shuffle([...correctTexts, ...distractors]).map((text, i) => ({
      id: i,
      text,
    }));

    const correctMap = Object.fromEntries(testedWords.map((w) => [w.id, w.translation.text]));

    exercises.push({ verse, words, testedWordIds: new Set(testedWords.map((w) => w.id)), bankItems, correctMap });
  }

  return exercises;
}

export default function TestScreen({ verses, onComplete }) {
  const { learnedWords } = useAppStore();

  const exercises = useMemo(
    () => buildTestExercises(verses, learnedWords),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verses, Object.keys(learnedWords).length]
  );

  const [idx, setIdx] = useState(0);
  const [filledBlanks, setFilledBlanks] = useState({});
  const [usedBankIds, setUsedBankIds] = useState(new Set());
  const [activeBubble, setActiveBubble] = useState(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const reset = useCallback(() => {
    setFilledBlanks({});
    setUsedBankIds(new Set());
    setActiveBubble(null);
    setChecked(false);
  }, []);

  if (exercises.length === 0) return <NoWordsScreen onComplete={onComplete} />;
  if (done) return <TestCompleteScreen correct={correctCount} total={exercises.length} onComplete={onComplete} />;

  const { verse, words, testedWordIds, bankItems, correctMap } = exercises[idx];
  const blankSlots = words.filter((w) => testedWordIds.has(w.id)).map((w) => w.id);
  const nextEmpty = blankSlots.find((id) => !filledBlanks[id]);
  const allFilled = blankSlots.every((id) => filledBlanks[id] !== undefined);
  const progress = (idx / exercises.length) * 100;

  const allCorrect =
    checked && blankSlots.every((id) => filledBlanks[id]?.text === correctMap[id]);

  const handleBankTap = (item) => {
    if (checked || usedBankIds.has(item.id) || nextEmpty === undefined) return;
    setFilledBlanks((prev) => ({ ...prev, [nextEmpty]: item }));
    setUsedBankIds((prev) => new Set([...prev, item.id]));
  };

  const handleBlankTap = (wordId) => {
    if (checked) return;
    const item = filledBlanks[wordId];
    if (!item) return;
    setUsedBankIds((prev) => {
      const s = new Set(prev);
      s.delete(item.id);
      return s;
    });
    setFilledBlanks((prev) => {
      const n = { ...prev };
      delete n[wordId];
      return n;
    });
  };

  const handleCheck = () => {
    if (!allFilled) return;
    setChecked(true);
    const correct = blankSlots.every((id) => filledBlanks[id]?.text === correctMap[id]);
    if (correct) setCorrectCount((c) => c + 1);
  };

  const handleContinue = () => {
    if (idx + 1 >= exercises.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      reset();
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-white"
      onClick={() => setActiveBubble(null)}
    >
      {/* Top bar */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 shrink-0">
        <button onClick={onComplete} className="text-gray-300 hover:text-gray-500 btn-bounce">
          <X size={22} />
        </button>
        <div className="flex-1 bg-gray-100 rounded-full h-3.5 overflow-hidden">
          <div
            className="bg-purple-400 h-3.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-black text-gray-400 w-10 text-right">
          {idx + 1}/{exercises.length}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-4">
        <p className="px-4 text-xs font-black text-gray-400 tracking-widest uppercase">
          Fill in the blanks
        </p>

        {/* Arabic verse — full bleed, tappable words */}
        <div
          className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border-y border-purple-100 px-4 py-4 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="arabic-text text-right text-[1.4rem] leading-[2.8] select-none relative">
            {words.map((w) => {
              const isTested = testedWordIds.has(w.id);
              const isActive = activeBubble === w.id;

              return (
                <span key={w.id} className="relative inline-block mx-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBubble(isActive ? null : w.id);
                    }}
                    className={`px-1.5 rounded-lg transition-all ${
                      isTested
                        ? 'bg-purple-200 text-purple-800 font-bold ring-1 ring-purple-300'
                        : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    {w.text_uthmani}
                  </button>

                  {/* Bubble */}
                  {isActive && (
                    <span
                      className="absolute z-20 pointer-events-none"
                      style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '6px' }}
                    >
                      <span className="block bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                        {isTested ? '?' : (w.translation?.text || '')}
                      </span>
                      <span
                        className="block w-2.5 h-2.5 bg-gray-800 rotate-45 mx-auto -mt-1.5 rounded-sm"
                        style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}
                      />
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          <p className="text-[10px] text-purple-400 font-bold text-right mt-1">
            Tap words to see translation · Purple words are tested
          </p>
        </div>

        {/* Translation with blanks */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm mx-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">
            English Translation
          </p>
          <div className="flex flex-wrap gap-x-1.5 gap-y-2 items-center text-sm leading-relaxed">
            {words.map((w) => {
              if (!testedWordIds.has(w.id)) {
                return (
                  <span key={w.id} className="text-gray-600 font-semibold">
                    {stripParens(w.translation?.text || '')}
                  </span>
                );
              }

              const filled = filledBlanks[w.id];
              let blankCls = 'min-w-[64px] px-2.5 py-1 rounded-lg border-b-2 font-bold text-xs';
              if (checked && filled) {
                blankCls += filled.text === correctMap[w.id]
                  ? ' bg-emerald-50 border-emerald-400 text-emerald-700'
                  : ' bg-red-50 border-red-400 text-red-700';
              } else if (filled) {
                blankCls += ' bg-purple-50 border-purple-400 text-purple-700';
              } else {
                blankCls += ' bg-gray-100 border-gray-300 text-gray-400';
              }

              return (
                <button
                  key={w.id}
                  onClick={(e) => { e.stopPropagation(); handleBlankTap(w.id); }}
                  className={`${blankCls} btn-bounce`}
                >
                  {filled ? filled.text : '⬜ tap word'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Word bank */}
        {!checked && (
          <div className="px-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
              Word Bank
            </p>
            <div className="flex flex-wrap gap-2">
              {bankItems.map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => { e.stopPropagation(); handleBankTap(item); }}
                  disabled={usedBankIds.has(item.id)}
                  className={`px-4 py-2.5 rounded-xl border-2 font-bold text-sm btn-bounce transition-all ${
                    usedBankIds.has(item.id)
                      ? 'opacity-25 border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-gray-200 text-gray-700 shadow-sm hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Correct answers revealed */}
        {checked && !allCorrect && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mx-4">
            <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-2">Correct Answers</p>
            {blankSlots.map((id) => {
              const w = words.find((x) => x.id === id);
              return (
                <div key={id} className="flex items-center gap-2 text-sm mb-1">
                  <span className="arabic-text text-red-700 text-base">{w.text_uthmani}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-bold text-red-700">{correctMap[id]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {checked ? (
        <div className={`shrink-0 px-4 py-4 border-t-2 ${allCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${allCorrect ? 'bg-emerald-500' : 'bg-red-400'}`}>
              {allCorrect ? <Check size={20} className="text-white" /> : <X size={20} className="text-white" />}
            </div>
            <div>
              <p className={`font-black ${allCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                {allCorrect ? 'All correct!' : 'Not quite'}
              </p>
              <p className={`text-sm font-semibold ${allCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                {allCorrect ? 'Great job on this verse!' : 'Review the answers above'}
              </p>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className={`w-full py-4 rounded-xl font-black text-white text-sm tracking-wider btn-bounce ${
              allCorrect ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-red-400'
            }`}
          >
            CONTINUE
          </button>
        </div>
      ) : (
        <div className="shrink-0 px-4 py-4 bg-white border-t-2 border-gray-100">
          <button
            onClick={handleCheck}
            disabled={!allFilled}
            className={`w-full py-4 rounded-xl font-black text-sm tracking-wider transition-all btn-bounce ${
              allFilled
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            CHECK ANSWER
          </button>
        </div>
      )}
    </div>
  );
}

function NoWordsScreen({ onComplete }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-5">
        <BookOpen size={36} className="text-purple-400" />
      </div>
      <h2 className="text-2xl font-black text-gray-800 mb-2">Learn First!</h2>
      <p className="text-gray-500 font-semibold mb-8 max-w-xs">
        You need to learn some words before you can test yourself. Start with the Learn section!
      </p>
      <button
        onClick={onComplete}
        className="bg-purple-500 text-white px-10 py-4 rounded-xl font-black text-sm tracking-wider shadow-lg btn-bounce"
      >
        GO LEARN
      </button>
    </div>
  );
}

function TestCompleteScreen({ correct, total, onComplete }) {
  const pct = Math.round((correct / total) * 100);
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
      <div className="text-7xl mb-5">{pct === 100 ? '🏆' : pct >= 60 ? '🎯' : '📖'}</div>
      <h2 className="text-2xl font-black text-gray-800 mb-1">Test Complete!</h2>
      <p className="text-gray-500 font-semibold mb-6">{correct}/{total} verses correct</p>
      <div className="bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl px-10 py-5 mb-8 shadow-lg">
        <p className="text-5xl font-black text-white">{pct}%</p>
        <p className="text-purple-200 font-bold mt-1">Accuracy</p>
      </div>
      <button
        onClick={onComplete}
        className="bg-purple-500 text-white px-10 py-4 rounded-xl font-black text-sm tracking-wider shadow-lg btn-bounce"
      >
        CONTINUE
      </button>
    </div>
  );
}
