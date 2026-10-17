function StatusBanner({ loading, text, error }) {
    if (error) return <div className="status-banner error">{error}</div>;
    if (!loading) return null;

    return (
        <div className="status-banner loading">
            <div className="typing-dots"><span></span><span></span><span></span></div>
            <p>{text}</p>
        </div>
    );
}

export default StatusBanner;