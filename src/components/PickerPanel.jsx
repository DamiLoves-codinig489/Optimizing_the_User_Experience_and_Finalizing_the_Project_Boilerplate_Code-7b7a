function PickerPanel({ title, subtitle, options, value, onChange }) {
    return (
        <section className="panel">
            <div className="section-head">
                <div>
                    <p className="eyebrow accent">Choose</p>
                    <h2>{title}</h2>
                </div>
                <p className="section-note">{subtitle}</p>
            </div>

            <div className="chip-row">
                {options.map((option) => (
                    <button
                        key={option}
                        className={`chip ${value === option ? "selected" : ""}`}
                        onClick={() => onChange(option)}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </section>
    );
}

export default PickerPanel;