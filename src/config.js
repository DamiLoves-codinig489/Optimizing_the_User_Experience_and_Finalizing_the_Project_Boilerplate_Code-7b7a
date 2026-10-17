export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_MODEL = "llama-3.3-70b-versatile";

export const MOODS = ["Cozy", "Adventurous", "Mysterious", "Emotional", "Funny"];
export const GENRES = ["Fantasy", "Science Fiction", "Mystery", "Romance", "History", "Self Help"];

export const OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json";
export const OPEN_LIBRARY_WORK = "https://openlibrary.org";
export const COVER_URL = (coverId, size = "M") =>
    coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : "";