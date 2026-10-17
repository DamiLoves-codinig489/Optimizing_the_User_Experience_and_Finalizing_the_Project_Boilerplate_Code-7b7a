export function extractTitles(text) {
    const quotedTitles = [...text.matchAll(/"([^"]+)"/g)].map((match) => match[1].trim());
    if (quotedTitles.length) return unique(quotedTitles).slice(0, 6);

    const numbered = text
        .split("\n")
        .map((line) => line.replace(/^\s*\d+[.)-]?\s*/, "").trim())
        .filter(Boolean)
        .map((line) => line.split(" - ")[0].split(":")[0].trim())
        .filter((line) => line.length > 2);

    return unique(numbered).slice(0, 6);
}

export function unique(list) {
    return [...new Set(list)];
}

export function shortText(text, max = 220) {
    if (!text) return "No description available.";
    return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

export function normalizeBook(doc) {
    return {
        key: doc.key,
        workKey: doc.key,
        title: doc.title,
        author: doc.author_name?.[0] || "Unknown Author",
        year: doc.first_publish_year || "—",
        coverId: doc.cover_i || null,
        subjects: doc.subject?.slice(0, 4) || [],
        editionCount: doc.edition_count || 0,
    };
}