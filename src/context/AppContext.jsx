// ════════════════════════════════════════════════════════════════════════════
// AppContext.jsx — Global shared state
// ════════════════════════════════════════════════════════════════════════════
import { extractTitles } from '../utils/textParser';
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { STAGE, AGE } from '../constants';
import { omdbSearch, omdbDetails, callGroq } from '../utils/api';
import { MAX_CHAT_HISTORY, FILTER_WORDS } from '../constants';

// ──────────────────── LESSON 6 ────────────────────
// TODO: Import extractTitles from '../utils/textParser'
// ──────────────────── STUBS: delete after adding real code ────────────────
// (no stub needed — just add the import above)
// ──────────────────── END ─────────────────────────


const AppContext = createContext(null);

export function AppProvider({ children }) {

  const [theme, setTheme] = useState(() => localStorage.getItem('cv_theme') || 'dark');
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : '';
    localStorage.setItem('cv_theme', theme);
  }, [theme]);

  const [userName,       setUserName]       = useState('');
  const [userAge,        setUserAge]        = useState(AGE.ADULT);
  const [userMood,       setUserMood]       = useState('');
  const [userCategories, setUserCategories] = useState([]);
  const [userLanguage,   setUserLanguage]   = useState(['Any Language']);

  const userAgeRef = useRef(AGE.ADULT);
  useEffect(() => { userAgeRef.current = userAge; }, [userAge]);

  const [stage,       setStage]       = useState(STAGE.NAME);
  const [chatMsgs,    setChatMsgs]    = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const msgCounter = useRef(0);
  const newId = () => `msg-${++msgCounter.current}`;

  const addMsg = useCallback((role, content) =>
    setChatMsgs(prev => [...prev, { id: newId(), role, content }]), []);

  const pushHistory = useCallback((role, content) =>
    setChatHistory(prev => {
      const next = [...prev, { role, content }];
      return next.length > MAX_CHAT_HISTORY ? next.slice(-MAX_CHAT_HISTORY) : next;
    }), []);

  const resetModalRef = useRef(null);
  const resetChat = useCallback(() => {
    setChatMsgs([]); setChatHistory([]);
    setUserName(''); setUserAge(AGE.ADULT); userAgeRef.current = AGE.ADULT;
    setUserMood(''); setUserCategories([]); setUserLanguage(['Any Language']);
    setIsBotTyping(false); setStage(STAGE.NAME);
    if (resetModalRef.current) resetModalRef.current();
  }, []);

  // ─────────────────────────── LESSON 4 START ──────────────────────────────
  const searchForStrip = useCallback(async (query) => {
    if (!query.trim()) return [];
    try { return (await omdbSearch(query)).slice(0, 12); }
    catch { return []; }
  }, []);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal,     setShowModal]     = useState(false);

  resetModalRef.current = () => setShowModal(false);

  const openMovie = useCallback((movie) => {
    setSelectedMovie(movie);
    setShowModal(true);
    if (movie?.imdbID) {
      omdbDetails(movie.imdbID)
        .then(full => { if (full) setSelectedMovie(full); })
        .catch(() => {});
    }
  }, []);
  // ─────────────────────────── LESSON 4 END ────────────────────────────────


  // ─────────────────────────── LESSON 5 START ──────────────────────────────
  const callAI = useCallback(async (userMessage) => {
    const currentAge = userAgeRef.current;
    const messages = [
      { role: 'system', content: buildSystemPrompt(userName, currentAge, userCategories, userMood, userLanguage) },
      ...chatHistory,
      { role: 'user', content: userMessage },
    ];
    const result = await callGroq(messages);
    if (result.success) {
      pushHistory('user', userMessage);
      pushHistory('assistant', result.reply);
      return result.reply;
    }
    return ({
      no_key: 'No API key — add your Groq key to .env.',
      auth: 'Invalid API key — check .env.',
      rate_limit: "I'm a bit overloaded. Wait a moment and try again!",
      all_models_failed: 'All AI models are busy. Try again in a minute!',
      timeout: 'Request timed out. Try again!',
      network_error: 'No internet — check your connection.',
    })[result.error] || 'Something went wrong. Please try again!';
  }, [userName, userCategories, userMood, userLanguage, chatHistory, pushHistory]);

  const isRestricted = useCallback(
    query => FILTER_WORDS.some(w => query.toLowerCase().includes(w)), []);

  const switchAge = useCallback((newAge) => {
    setUserAge(newAge);
    userAgeRef.current = newAge;
    addMsg('bot', `Switched to ${{ [AGE.KIDS]: '🔥 Trending mode', [AGE.TEEN]: '🎞️ Nostalgic mode', [AGE.ADULT]: '⭐ Popular mode' }[newAge]}! What would you like to watch?`);
  }, [addMsg]);
  // ─────────────────────────── LESSON 5 END ────────────────────────────────


  // ──────────────────── LESSON 6 ────────────────────
  // TODO: Upgrade callAIWithSearch to:
  //   1. Extract **bold** titles from the AI reply using extractTitles()
  //   2. Search OMDb for each title using omdbSearch()
  //   3. Filter results by age-appropriate ratings
  //   4. Return { reply, movieResults, hasAgeSwitchOffer }
  // ──────────────────── STUBS: delete after adding real code ────────────────
  const callAIWithSearch = useCallback(async (userMessage) => {
      const rawReply = await callAI(userMessage);
      if (!rawReply) return { reply: '', movieResults: [], hasAgeSwitchOffer: false };

      const hasAgeSwitchOffer = rawReply.includes('AGE_SWITCH_OFFER');
      const cleanReply = rawReply.replace(/AGE_SWITCH_OFFER/g, '').trim();
      const currentAge = userAgeRef.current;

      const allowedRatings = {
        [AGE.KIDS]: ['G', 'PG'],
        [AGE.TEEN]: ['G', 'PG', 'PG-13'],
        [AGE.ADULT]: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR', 'N/A', 'NOT RATED', 'UNRATED', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'],
      };
      const allowed = allowedRatings[currentAge] || allowedRatings[AGE.ADULT];
      const isAgeOk = m => !m.Rated || m.Rated === 'N/A'
        ? currentAge !== AGE.KIDS
        : allowed.some(r => m.Rated.toUpperCase().includes(r));

      const titles = extractTitles(rawReply);
      let movieResults = [];

      if (titles.length) {
        try {
          const searches = await Promise.all(titles.slice(0, 6).map(t => omdbSearch(t).catch(() => [])));
          const seen = new Set();
          searches.forEach(results => {
            const best = results.find(m => m.Poster && m.Poster !== 'N/A' && isAgeOk(m)) || results.find(m => isAgeOk(m));
            if (best && !seen.has(best.imdbID)) { seen.add(best.imdbID); movieResults.push(best); }
          });
          movieResults = movieResults.slice(0, 6);
        } catch { /* chat still works fine */ }
      }

      if (!movieResults.length && !titles.length) {
        try {
          const fallback = await omdbSearch(userMessage).catch(() => []);
          const seen = new Set();
          fallback.filter(m => isAgeOk(m)).slice(0, 4).forEach(m => {
            if (!seen.has(m.imdbID)) { seen.add(m.imdbID); movieResults.push(m); }
          });
        } catch { /* ok */ }
      }

      return { reply: cleanReply, movieResults, hasAgeSwitchOffer };
    }, [callAI]);

    // openMovie — open the detail modal; fetch full details in the background
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [showModal, setShowModal] = useState(false);

    resetModalRef.current = () => setShowModal(false);

    const openMovie = useCallback((movie) => {
      setSelectedMovie(movie);
      setShowModal(true);
      if (movie?.imdbID) {
        omdbDetails(movie.imdbID)
          .then(full => { if (full) setSelectedMovie(full); })
          .catch(() => { });
      }
    }, []);
  // ──────────────────── END ─────────────────────────


  const value = {
    selectedMovie, showModal, setShowModal, openMovie,
    theme, setTheme,
    userName, setUserName, userAge, setUserAge,
    userMood, setUserMood, userCategories, setUserCategories,
    userLanguage, setUserLanguage,
    stage, setStage, chatMsgs, setChatMsgs, addMsg,
    isBotTyping, setIsBotTyping, resetChat,
    searchForStrip, selectedMovie, showModal, setShowModal, openMovie,
    callAI, callAIWithSearch, switchAge, isRestricted,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside <AppProvider>');
  return ctx;
}


// ─────────────────────────── LESSON 5 (buildSystemPrompt) ────────────────
function buildSystemPrompt(name, age, categories, mood, language) {
  const genres   = categories.length ? categories.join(', ') : 'any genre';
  const langLine = language && !language.includes('Any Language') ? `Preferred languages: ${language.join(', ')}` : '';
  const moodLine = mood ? `User mood: "${mood}"` : '';
  const nameTag  = name ? ` User's name is ${name}.` : '';

  if (age === AGE.KIDS) return `CRITICAL RULE — READ THIS FIRST BEFORE ANYTHING ELSE:
You are talking to a CHILD under 13. You MUST ONLY recommend G or PG animated/family films.
FORBIDDEN: any romance, violence, horror, crime, or PG-13+ content.
ONLY ALLOWED: Disney, Pixar, DreamWorks family films.
If asked for forbidden content: one sentence explanation + new line: AGE_SWITCH_OFFER
You are CineBot, a fun AI movie companion for children.${name ? ` Child's name is ${name}.` : ''}
${langLine ? langLine + '\n' : ''}${moodLine ? moodLine + '\n' : ''}
- Wrap every title in **double asterisks**
- Recommend 2-3 movies max
- Use 1-2 fun emojis per response 🎬✨
- Always end with a question`;

  if (age === AGE.TEEN) return `You are CineBot, a fun AI movie companion for teenagers.${nameTag}
Genres: ${genres}.${moodLine ? '\n' + moodLine : ''}${langLine ? '\n' + langLine : ''}
TEEN MODE - PG or PG-13 only.
- Wrap every title in **double asterisks**
- Recommend 2-4 movies
- Use emojis naturally (1-3 per response)
- Always end with a question`;

  return `You are CineBot, a warm enthusiastic AI movie companion.${nameTag}
Genres: ${genres}.${moodLine ? '\n' + moodLine : ''}${langLine ? '\n' + langLine : ''}
- Wrap every title in **double asterisks**
- Recommend 2-4 movies
- Use emojis naturally (1-3 per response)
- Warm conversational tone
- Always end with a question`;
}
