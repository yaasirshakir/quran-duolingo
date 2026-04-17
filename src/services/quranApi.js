const BASE_URL = 'https://api.quran.com/api/v4';
const CACHE_KEY = (id) => `quran-verses-v1-chapter-${id}`;

const getCached = (chapterId) => {
  try {
    const raw = localStorage.getItem(CACHE_KEY(chapterId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCache = (chapterId, verses) => {
  try {
    localStorage.setItem(CACHE_KEY(chapterId), JSON.stringify(verses));
  } catch {
    // Storage full — silently skip
  }
};

export const fetchVersesByChapter = async (chapterId) => {
  const cached = getCached(chapterId);
  if (cached) return cached;

  const url = `${BASE_URL}/verses/by_chapter/${chapterId}?words=true&translations=131&word_fields=text_uthmani,transliteration&per_page=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();

  setCache(chapterId, data.verses);
  return data.verses;
};

// Load many chapters: cached ones return instantly, uncached ones fetch in parallel
export const fetchManyChapters = async (chapterIds) => {
  return Promise.all(chapterIds.map((id) => fetchVersesByChapter(id)));
};

// Read chapters from cache without any network call (returns null if any are missing)
export const loadAllFromCache = (chapterIds) => {
  const results = chapterIds.map((id) => getCached(id));
  return results.every(Boolean) ? results.flat() : null;
};

const CHAPTER_NAMES_KEY = 'quran-chapter-names-v1';

export const fetchChapterNames = async () => {
  try {
    const raw = localStorage.getItem(CHAPTER_NAMES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  const res = await fetch(`${BASE_URL}/chapters?language=en`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();

  // Store as { chapterId: name_simple } map
  const map = Object.fromEntries(data.chapters.map((c) => [c.id, c.name_simple]));
  try { localStorage.setItem(CHAPTER_NAMES_KEY, JSON.stringify(map)); } catch {}
  return map;
};
