import { COVER_URL } from "../config";

function BookStrip({ books, onOpen }) {
    if (!books.length) {
        return (
            <section className="panel empty-panel">
                <h2>No books yet</h2>
                <p>Generate recommendations to see visual results here.</p>
            </section>
        );
    }

    return (
        <section className="panel">
            <div className="section-head">
                <div>
                    <p className="eyebrow accent">Visual results</p>
                    <h2>Scrollable Book Strip</h2>
                </div>
            </div>

            <div className="book-strip">
                {books.map((book) => (
                    <article key={book.key} className="book-card" onClick={() => onOpen(book)}>
                        <img
                            src={COVER_URL(book.coverId) || "https://placehold.co/240x340?text=No+Cover"}
                            alt={book.title}
                        />
                        <div className="book-card-body">
                            <h3>{book.title}</h3>
                            <p>{book.author}</p>
                            <span>{book.year}</span>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default BookStrip;