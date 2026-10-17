import { useEffect, useMemo, useState } from "react";
import { GENRES, MOODS } from "./config";
import Header from "./components/Header";
import PickerPanel from "./components/PickerPanel";
import RecommendationText from "./components/RecommendationText";
import StatusBanner from "./components/StatusBanner";
import BookStrip from "./components/BookStrip";
import BookModal from "./components/BookModal";
import { extractTitles } from "./utils/helpers";
import { getAiRecommendations, getWorkDetails, searchBooksFromTitles } from "./utils/api";
import "./App.css";

const AGE_MODES = ["Kids", "Teens", "Adults"];

function App() {
  const [mood, setMood] = useState("Cozy");
  const [genre, setGenre] = useState("Fantasy");
  const [ageMode, setAgeMode] = useState("Teens");
  const [aiText, setAiText] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookDetails, setBookDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  const extractedTitles = useMemo(() => extractTitles(aiText), [aiText]);

  async function prefetchDetails(bookList) {
    const uncached = bookList.filter((book) => !bookDetails[book.workKey]);
    const entries = await Promise.all(
      uncached.map(async (book) => {
        try {
          const details = await getWorkDetails(book.workKey);
          return [book.workKey, details];
        } catch {
          return null;
        }
      })
    );

    const validEntries = entries.filter(Boolean);
    if (validEntries.length) {
      setBookDetails((prev) => ({ ...prev, ...Object.fromEntries(validEntries) }));
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setAiText("");
    setBooks([]);
    setStatusText("Asking AI for age-appropriate book recommendations...");

    try {
      const text = await getAiRecommendations({ mood, genre, ageMode });
      setAiText(text);

      setStatusText("Extracting book titles and matching Open Library books...");
      const matchedBooks = await searchBooksFromTitles(extractTitles(text));
      setBooks(matchedBooks);

      setStatusText("Prefetching details for faster interactions...");
      await prefetchDetails(matchedBooks);

      setStatusText("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function openBook(book) {
    setSelectedBook(book);

    if (bookDetails[book.workKey]) return;

    setDetailsLoading(true);
    try {
      const details = await getWorkDetails(book.workKey);
      setBookDetails((prev) => ({ ...prev, [book.workKey]: details }));
    } catch {
      setError("Could not load this book's details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="page">
      <Header />

      <div className="layout">
        <div className="left-column">
          <PickerPanel
            title="Pick a Mood"
            subtitle="This shapes the emotional vibe of the recommendations."
            options={MOODS}
            value={mood}
            onChange={setMood}
          />
          <PickerPanel
            title="Pick a Genre"
            subtitle="This guides the type of books AI will suggest."
            options={GENRES}
            value={genre}
            onChange={setGenre}
          />
          <PickerPanel
            title="Pick an Age Mode"
            subtitle="Recommendations will be adjusted for the selected age group."
            options={AGE_MODES}
            value={ageMode}
            onChange={setAgeMode}
          />
          <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate Book Recommendations"}
          </button>
        </div>

        <div className="right-column">
          <StatusBanner loading={loading} text={statusText} error={error} />
          <RecommendationText text={aiText} />
          <div className="panel compact-panel">
            <p className="eyebrow accent">Extracted titles</p>
            <div className="tag-row">
              {extractedTitles.length
                ? extractedTitles.map((title) => <span key={title} className="info-tag">{title}</span>)
                : <span className="muted-text">No extracted titles yet.</span>}
            </div>
          </div>
          <BookStrip books={books} onOpen={openBook} />
        </div>
      </div>

      <BookModal
        book={selectedBook}
        details={selectedBook ? bookDetails[selectedBook.workKey] : null}
        loading={detailsLoading}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
}

export default App;