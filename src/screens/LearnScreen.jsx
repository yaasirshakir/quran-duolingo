import { useState, useMemo } from 'react';
import { X, Check, Zap } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const wordKey = (w) => `w${w.id}`;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function buildExercises(verses, learnedWords) {
  const allTranslations = [];
  const exercises = [];

  verses.forEach((verse) => {
    verse.words
      .filter((w) => w.char_type_name === 'word' && w.translation?.text)
      .forEach((w) => allTranslations.push(w.translation.text));
  });

  verses.forEach((verse) => {
    const words = verse.words.filter(
      (w) => w.char_type_name === 'word' && w.translation?.text
    );
    words.forEach((targetWord) => {
      if (learnedWords[wordKey(targetWord)]) return;

      const pool = allTranslations.filter((t) => t !== targetWord.translation.text);
      const distractors = shuffle(pool).slice(0, 3);
      const options = shuffle([targetWord.translation.text, ...distractors]);

      exercises.push({ targetWord, verse, options });
    });
  });

  return exercises.slice(0, 10);
}

const verseRef = (verse, chapterNames) => {
  const [ch] = verse.verse_key.split(':');
  const name = chapterNames?.[parseInt(ch)] || '';
  return name ? `${name} ${verse.verse_key}` : verse.verse_key;
};

export default function LearnScreen({ verses, chapterNames, onComplete }) {
  const { learnedWords, learnWord } = useAppStore();

  const exercises = useMemo(
    () => buildExercises(verses, learnedWords),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verses]
  );

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  if (exercises.length === 0) {
    return <AllDoneScreen onComplete={onComplete} />;
  }

  if (done) {
    return <CompletionScreen correct={correctCount} total={exercises.length} onComplete={onComplete} />;
  }

  const { targetWord, verse, options } = exercises[idx];
  const isCorrect = selected === targetWord.translation.text;
  const progress = (idx / exercises.length) * 100;

  const handleSelect = (opt) => {
    if (showFeedback) return;
    setSelected(opt);
    setShowFeedback(true);
    if (opt === targetWord.translation.text) {
      setCorrectCount((c) => c + 1);
      learnWord(wordKey(targetWord), {
        arabic: targetWord.text_uthmani,
        translation: targetWord.translation.text,
        verseKey: verse.verse_key,
      });
    }
  };

  const handleContinue = () => {
    if (idx + 1 >= exercises.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 shrink-0">
        <button onClick={onComplete} className="text-gray-300 hover:text-gray-500 btn-bounce">
          <X size={22} />
        </button>
        <div className="flex-1 bg-gray-100 rounded-full h-3.5 overflow-hidden">
          <div
            className="bg-emerald-400 h-3.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-black text-gray-400 w-10 text-right">
          {idx + 1}/{exercises.length}
        </span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pb-4">
        <p className="px-4 text-xs font-black text-gray-400 tracking-widest uppercase mb-3">
          What does this word mean?
        </p>

        {/* Verse card — full bleed */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-y border-emerald-100 px-5 py-5 mb-5 shadow-sm">
          {/* Full Arabic verse */}
          <div className="arabic-text text-right text-[1.45rem] leading-[2.5] mb-4 select-none">
            {verse.words
              .filter((w) => w.char_type_name === 'word')
              .map((w) => (
                <span
                  key={w.id}
                  className={`inline-block mx-0.5 px-1.5 rounded-lg transition-all ${
                    w.id === targetWord.id
                      ? 'bg-yellow-300 text-yellow-900 font-bold shadow-sm ring-2 ring-yellow-400'
                      : 'text-gray-700'
                  }`}
                >
                  {w.text_uthmani}
                </span>
              ))}
          </div>

          {/* Verse reference */}
          <p className="text-[11px] font-black text-emerald-500 text-center mb-3 tracking-wide">
            {verseRef(verse, chapterNames)}
          </p>

          {/* Target word spotlight */}
          <div className="border-t border-emerald-200 pt-4 flex flex-col items-center gap-1">
            <div className="arabic-text text-4xl text-emerald-700 font-bold">
              {targetWord.text_uthmani}
            </div>
            {targetWord.transliteration?.text && (
              <div className="text-sm text-gray-500 italic font-semibold">
                {targetWord.transliteration.text}
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2.5 px-4">
          {options.map((opt, i) => {
            let cls =
              'bg-white border-2 border-gray-200 text-gray-700 shadow-sm';
            if (showFeedback) {
              if (opt === targetWord.translation.text) {
                cls = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-800 shadow-sm';
              } else if (opt === selected) {
                cls = 'bg-red-50 border-2 border-red-400 text-red-800 shadow-sm';
              } else {
                cls = 'bg-white border-2 border-gray-100 text-gray-400';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(opt)}
                className={`w-full rounded-xl px-5 py-4 text-left font-bold text-sm transition-all btn-bounce flex items-center justify-between ${cls}`}
              >
                <span>{opt}</span>
                {showFeedback && opt === targetWord.translation.text && (
                  <Check size={18} className="text-emerald-500 shrink-0" />
                )}
                {showFeedback && opt === selected && opt !== targetWord.translation.text && (
                  <X size={18} className="text-red-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback bottom sheet */}
      {showFeedback && (
        <div
          className={`shrink-0 px-4 py-4 border-t-2 ${
            isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            {isCorrect ? (
              <>
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                  <Check size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-emerald-700">Correct! +10 XP</p>
                  <p className="text-sm text-emerald-600 font-semibold">
                    {targetWord.text_uthmani} = {targetWord.translation.text}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-red-400 rounded-full flex items-center justify-center shrink-0">
                  <X size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-red-700">Incorrect</p>
                  <p className="text-sm text-red-600 font-semibold">
                    Correct answer: <strong>{targetWord.translation.text}</strong>
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleContinue}
            className={`w-full py-4 rounded-xl font-black text-white text-sm tracking-wider transition-all btn-bounce ${
              isCorrect ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-red-400'
            }`}
          >
            CONTINUE
          </button>
        </div>
      )}
    </div>
  );
}

function AllDoneScreen({ onComplete }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
      <div className="text-7xl mb-5">🎉</div>
      <h2 className="text-2xl font-black text-gray-800 mb-2">All Caught Up!</h2>
      <p className="text-gray-500 font-semibold mb-8 max-w-xs">
        You've learned all available words in this chapter. Go test yourself!
      </p>
      <button
        onClick={onComplete}
        className="bg-emerald-500 text-white px-10 py-4 rounded-xl font-black text-sm tracking-wider shadow-lg shadow-emerald-200 btn-bounce"
      >
        BACK TO HOME
      </button>
    </div>
  );
}

function CompletionScreen({ correct, total, onComplete }) {
  const pct = Math.round((correct / total) * 100);
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
      <div className="text-7xl mb-5">{pct === 100 ? '🌟' : pct >= 60 ? '✨' : '📚'}</div>
      <h2 className="text-2xl font-black text-gray-800 mb-1">Lesson Complete!</h2>
      <p className="text-gray-500 font-semibold mb-6">
        {correct}/{total} correct
      </p>
      <div className="bg-gradient-to-br from-yellow-400 to-amber-400 rounded-2xl px-8 py-5 mb-8 shadow-lg">
        <div className="flex items-center gap-2 justify-center">
          <Zap size={20} className="text-white" />
          <span className="text-3xl font-black text-white">+{correct * 10} XP</span>
        </div>
        <p className="text-yellow-100 text-sm font-bold mt-1">{pct}% accuracy</p>
      </div>
      <button
        onClick={onComplete}
        className="bg-emerald-500 text-white px-10 py-4 rounded-xl font-black text-sm tracking-wider shadow-lg shadow-emerald-200 btn-bounce"
      >
        CONTINUE
      </button>
    </div>
  );
}
