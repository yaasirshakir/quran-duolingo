import { BookOpen, Home, FlaskConical } from 'lucide-react';

const tabs = [
  { id: 'home', label: 'HOME', Icon: Home },
  { id: 'learn', label: 'LEARN', Icon: BookOpen },
  { id: 'test', label: 'TEST', Icon: FlaskConical },
];

export default function BottomNav({ current, onChange }) {
  return (
    <nav className="flex border-t-2 border-gray-100 bg-white shrink-0">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors btn-bounce ${
            current === id
              ? 'text-emerald-600'
              : 'text-gray-300'
          }`}
        >
          <Icon
            size={22}
            strokeWidth={current === id ? 2.5 : 2}
            className={current === id ? 'text-emerald-600' : 'text-gray-300'}
          />
          <span
            className={`text-[10px] font-black tracking-wider ${
              current === id ? 'text-emerald-600' : 'text-gray-300'
            }`}
          >
            {label}
          </span>
          {current === id && (
            <div className="absolute bottom-0 w-8 h-0.5 bg-emerald-500 rounded-t-full" />
          )}
        </button>
      ))}
    </nav>
  );
}
