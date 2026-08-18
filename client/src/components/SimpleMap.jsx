function markerPosition(lat, lng) {
  return {
    left: `${((lng - 32.72) / 0.32) * 100}%`,
    top: `${((40.02 - lat) / 0.2) * 100}%`,
  };
}

function SimpleMap({ issues, form, onSelect }) {
  return (
    <section className="map-section">
      <h2>Select Location</h2>
      <p>Click anywhere in the map box.</p>

      <button className="simple-map" type="button" onClick={onSelect}>
        <span className="map-name">ANKARA</span>
        {issues.map((issue) => (
          <span
            className="issue-marker"
            key={issue.id}
            style={markerPosition(issue.lat, issue.lng)}
            title={issue.title}
          />
        ))}
        <span className="selected-marker" style={markerPosition(form.lat, form.lng)} />
      </button>

      <div className="map-legend">
        <span><i className="legend-dot issue-dot" /> Issue</span>
        <span><i className="legend-dot selected-dot" /> Selected point</span>
      </div>
    </section>
  );
}

export default SimpleMap;
