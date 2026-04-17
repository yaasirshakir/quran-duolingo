import { RefreshCw } from 'lucide-react';
import useAppStore from '../store/useAppStore';

export default function HomeScreen({ verses, loadedChapters, onNavigate, onShuffle }) {
  const { xp, streak, getLearnedCount } = useAppStore();
  const learnedCount = getLearnedCount();

  const totalWords = verses.reduce(
    (sum, v) => sum + v.words.filter((w) => w.char_type_name === 'word').length,
    0
  );
  const progress = totalWords > 0 ? Math.min((learnedCount / totalWords) * 100, 100) : 0;
  const chapterList = loadedChapters?.length
    ? `Surahs ${loadedChapters.join(', ')}`
    : 'Loading…';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-emerald-600 px-5 pt-10 pb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <p className="text-emerald-300 text-xs font-black tracking-widest uppercase mb-0.5">
              Now studying
            </p>
            <h1 className="text-2xl font-black text-white">
              {loadedChapters?.length} Random Surahs
            </h1>
            <p className="text-emerald-300 text-xs font-semibold mt-1 truncate">{chapterList}</p>
          </div>
          <button
            onClick={onShuffle}
            className="ml-3 bg-emerald-500 hover:bg-emerald-400 text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 btn-bounce"
            title="Load new random surahs"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="bg-emerald-700 rounded-2xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-emerald-200 font-bold">{learnedCount} words learned</span>
            <span className="text-emerald-300 font-bold">{totalWords} total</span>
          </div>
          <div className="bg-emerald-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-3 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-emerald-300 text-xs font-bold mt-2">
            {verses.length} verses · {progress < 100 ? `${Math.round(progress)}% of words learned` : '🎉 All done!'}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-5 -mt-4">
        <StatCard emoji="🔥" value={streak} label="Day Streak" color="from-orange-400 to-red-400" />
        <StatCard emoji="⭐" value={xp} label="Total XP" color="from-yellow-400 to-amber-400" />
        <StatCard emoji="📝" value={learnedCount} label="Words" color="from-emerald-400 to-teal-400" />
      </div>

      {/* Actions */}
      <div className="px-5 mt-5 space-y-3">
        <p className="text-xs font-black text-gray-400 tracking-widest uppercase">Ready to practice?</p>

        <ActionButton
          icon="📖"
          title="Learn New Words"
          subtitle={learnedCount < totalWords ? `${totalWords - learnedCount} words remaining` : 'All words learned!'}
          gradient="from-blue-500 to-indigo-600"
          onClick={() => onNavigate('learn')}
        />

        <ActionButton
          icon="✏️"
          title="Test Yourself"
          subtitle={learnedCount > 0 ? `Test ${learnedCount} learned words` : 'Learn words first'}
          gradient="from-purple-500 to-fuchsia-600"
          onClick={() => onNavigate('test')}
          disabled={learnedCount === 0}
        />
      </div>

      {/* Tips */}
      <div className="mx-5 mt-5 bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-1">💡 How it works</p>
        <p className="text-sm text-amber-800 font-semibold leading-relaxed">
          Learn each Arabic word in the context of its verse, then fill in the blanks of the English translation. Tap 🔄 to shuffle new random surahs.
        </p>
      </div>

      <div className="h-6" />
    </div>
  );
}

function StatCard({ emoji, value, label, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-3 text-white text-center shadow-sm`}>
      <div className="text-xl mb-0.5">{emoji}</div>
      <div className="text-xl font-black">{value}</div>
      <div className="text-[10px] font-bold opacity-90">{label}</div>
    </div>
  );
}

function ActionButton({ icon, title, subtitle, gradient, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-gradient-to-r ${gradient} rounded-2xl p-4 text-left shadow-lg btn-bounce flex items-center gap-4 transition-opacity ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-black text-white text-base">{title}</p>
        <p className="text-white/70 text-xs font-semibold">{subtitle}</p>
      </div>
    </button>
  );
}
