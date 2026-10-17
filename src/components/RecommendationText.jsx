function RecommendationText({ text }) {
    return (
        <section className="panel">
            <div className="section-head">
                <div>
                    <p className="eyebrow accent">AI output</p>
                    <h2>Recommendation Text</h2>
                </div>
            </div>
            <pre className="ai-text">{text || "Ask AI to generate recommendations."}</pre>
        </section>
    );
}

export default RecommendationText;