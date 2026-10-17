import { COVER_URL, GROQ_API_KEY, GROQ_MODEL, GROQ_URL, OPEN_LIBRARY_SEARCH, OPEN_LIBRARY_WORK } from "../config";
import { normalizeBook } from "./helpers";

export async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error("Request failed.");
  return response.json();
}

export async function getAiRecommendations({ mood, genre, ageMode }) {
  if (!GROQ_API_KEY || GROQ_API_KEY === "your_groq_api_key_here") {
    throw new Error("Please add your Groq API key inside the .env file.");
  }

  const messages = [
    {
      role: "system",
      content:
        "You are a helpful book recommendation assistant. Recommend exactly 5 books. Return each title in double quotes, each on a new line, followed by a very short reason. Keep suggestions age-appropriate."
    },
    {
      role: "user",
      content: `Mood: ${mood}. Genre: ${genre}. Age mode: ${ageMode}. Recommend books.`
    }
  ];

  const data = await requestJson(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 350,
    }),
  });

  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function searchBookByTitle(title) {
  const data = await requestJson(`${OPEN_LIBRARY_SEARCH}?title=${encodeURIComponent(title)}&limit=1`);
  return data.docs?.[0] ? normalizeBook(data.docs[0]) : null;
}

export async function searchBooksFromTitles(titles) {
  const books = await Promise.all(titles.map(searchBookByTitle));
  return books.filter(Boolean);
}

export async function getWorkDetails(workKey) {
  const data = await requestJson(`${OPEN_LIBRARY_WORK}${workKey}.json`);
  const description =
    typeof data.description === "string"
      ? data.description
      : data.description?.value || "";

  const subjects = data.subjects?.slice(0, 8) || [];
  const covers = data.covers || [];

  return {
    description,
    subjects,
    coverLarge: covers[0] ? COVER_URL(covers[0], "L") : "",
    title: data.title || "",
  };
}