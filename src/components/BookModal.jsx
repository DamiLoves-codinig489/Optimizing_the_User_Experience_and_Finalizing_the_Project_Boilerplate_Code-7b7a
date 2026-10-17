import { COVER_URL } from "../config";
import { shortText } from "../utils/helpers";

function BookModal({ book, details, loading, onClose }) {
    if (!book) return null;

    const image = details?.coverLarge || COVER_URL(book.coverId, "L") || "https://placehold.co/320x460?text=No+Cover";

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                <div className="modal-layout">
                    <img className="modal-cover" src={image} alt={book.title} />

                    <div>
                        <p className="eyebrow accent">Book details</p>
                        <h2>{details?.title || book.title}</h2>
                        <div className="meta-list">
                            <span>{book.author}</span>
                            <span>{book.year}</span>
                            <span>{book.editionCount} editions</span>
                        </div>

                        {loading ? (
                            <div className="inline-loading">Loading details...</div>
                        ) : (
                            <>
                                <p className="modal-description">{shortText(details?.description, 420)}</p>
                                <div className="tag-row">
                                    {(details?.subjects?.length ? details.subjects : book.subjects).slice(0, 6).map((tag) => (
                                        <span key={tag} className="info-tag">{tag}</span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookModal;