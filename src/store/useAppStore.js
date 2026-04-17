import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set, get) => ({
      learnedWords: {},
      xp: 0,
      streak: 1,

      learnWord: (wordKey, wordData) =>
        set((state) => ({
          learnedWords: { ...state.learnedWords, [wordKey]: wordData },
          xp: state.xp + 10,
        })),

      hasLearnedWord: (wordKey) => !!get().learnedWords[wordKey],
      getLearnedCount: () => Object.keys(get().learnedWords).length,
    }),
    { name: 'quran-learner-v1' }
  )
);

export default useAppStore;
