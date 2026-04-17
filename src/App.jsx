import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import LearnScreen from './screens/LearnScreen';
import TestScreen from './screens/TestScreen';
import { fetchManyChapters, loadAllFromCache, fetchChapterNames } from './services/quranApi';

const CHAPTER_POOL = [
  1, 36, 55, 67, 71, 73, 74, 75, 76, 77,
  78, 79, 80, 81, 82, 83, 84, 85, 86, 87,
  88, 89, 90, 91, 92, 93, 94, 95, 96, 97,
  98, 99, 100, 101, 102, 103, 104, 105, 106,
  107, 108, 109, 110, 111, 112, 113, 114,
];
const CHAPTERS_TO_LOAD = 8;
const SELECTION_KEY = 'quran-selected-chapters-v1';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const getSavedChapters = () => {
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveChapters = (ids) => {
  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify(ids));
  } catch {}
};

export default function App() {
  const [screen, setScreen] = useState('home');
  const [verses, setVerses] = useState([]);
  const [loadedChapters, setLoadedChapters] = useState([]);
  const [chapterNames, setChapterNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch chapter names (cached after first load)
    fetchChapterNames().then(setChapterNames).catch(() => {});

    // Try to hydrate instantly from cache before touching the network
    const saved = getSavedChapters();
    if (saved) {
      const cached = loadAllFromCache(saved);
      if (cached) {
        setVerses(shuffle(cached));
        setLoadedChapters([...saved].sort((a, b) => a - b));
        setLoading(false);
        return;
      }
    }
    // First visit or partial cache — fetch from API
    fetchChapters(saved || shuffle(CHAPTER_POOL).slice(0, CHAPTERS_TO_LOAD));
  }, []);

  const fetchChapters = async (selected) => {
    setLoading(true);
    setError(null);
    try {
      saveChapters(selected);
      const results = await fetchManyChapters(selected);
      setVerses(shuffle(results.flat()));
      setLoadedChapters([...selected].sort((a, b) => a - b));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShuffle = () => {
    const selected = shuffle(CHAPTER_POOL).slice(0, CHAPTERS_TO_LOAD);
    fetchChapters(selected);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-0 sm:p-4">
      <div className="phone-container">
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <ErrorScreen error={error} onRetry={() => fetchChapters(getSavedChapters() || shuffle(CHAPTER_POOL).slice(0, CHAPTERS_TO_LOAD))} />
        ) : (
          <>
            <div className="flex-1 overflow-hidden">
              {screen === 'home' && (
                <HomeScreen
                  verses={verses}
                  loadedChapters={loadedChapters}
                  onNavigate={setScreen}
                  onShuffle={handleShuffle}
                />
              )}
              {screen === 'learn' && (
                <LearnScreen verses={verses} chapterNames={chapterNames} onComplete={() => setScreen('home')} />
              )}
              {screen === 'test' && (
                <TestScreen verses={verses} chapterNames={chapterNames} onComplete={() => setScreen('home')} />
              )}
            </div>
            <BottomNav current={screen} onChange={setScreen} />
          </>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white gap-4">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
        <Loader2 size={32} className="text-emerald-500 animate-spin" />
      </div>
      <div className="text-center">
        <p className="font-black text-gray-700 text-lg">Loading Quran</p>
        <p className="text-sm text-gray-400 font-semibold mt-1">
          Fetching {CHAPTERS_TO_LOAD} random surahs…
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white gap-4 p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <div>
        <p className="font-black text-gray-700 text-lg">Failed to load</p>
        <p className="text-sm text-gray-400 font-semibold mt-1">{error}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-sm btn-bounce"
      >
        <RefreshCw size={16} />
        Try Again
      </button>
    </div>
  );
}
