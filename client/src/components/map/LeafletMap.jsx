import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { StatusBadge } from "../common/StatusBadge";
import { PriorityBadge } from "../common/PriorityBadge";
import { Users, FileText, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ISTANBUL_CENTER, ISTANBUL_MAP_BOUNDS } from "../../config/location";

const STATUS_LEGEND = [
  { className: "status-yellow", keys: ["submitted", "in_review"] },
  { className: "status-blue", keys: ["accepted"] },
  { className: "status-red", keys: ["in_progress"] },
  { className: "status-green", keys: ["resolved"] }
];
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom(), { animate: false });
  }, [center[0], center[1], zoom, map]);
  return null;
}
function MapViewport({ issues }) {
  const map = useMap();
  const coordinates = JSON.stringify(issues.map((i) => [Number(i.latitude), Number(i.longitude)]));
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  useEffect(() => {
    const points = JSON.parse(coordinates);
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 15, animate: false });
  }, [coordinates, map]);
  return null;
}
const LeafletMap = ({
  issues,
  selectedIssue,
  onSelectIssue,
  center = ISTANBUL_CENTER,
  zoom = 13,
  height = "100%"
}) => {
  const { t } = useTranslation();
  const validIssues = issues.filter((issue) => issue.latitude != null && issue.longitude != null && Number.isFinite(Number(issue.latitude)) && Number.isFinite(Number(issue.longitude)) && Math.abs(Number(issue.latitude)) <= 90 && Math.abs(Number(issue.longitude)) <= 180);
  const createIssueIcon = (issue, isSelected) => {
    const statusClass = `marker-${issue.status}`;
    const selectedClass = isSelected ? "selected-marker" : "";
    return L.divIcon({
      className: "custom-leaflet-marker-wrapper",
      html: `
        <div class="custom-issue-marker ${statusClass} ${selectedClass}" style="${isSelected ? "transform: scale(1.3); border-width: 3px; z-index: 999;" : ""}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20]
    });
  };
  const activeCenter = selectedIssue ? [Number(selectedIssue.latitude), Number(selectedIssue.longitude)] : center;
  return <div style={{ width: "100%", height, position: "relative", overflow: "hidden" }}>
      <div className="map-status-legend" aria-label={t("explore.allStatuses")}>
        {STATUS_LEGEND.map((item) => <span key={item.className}>
            <i className={item.className} aria-hidden="true" />
            {item.keys.map((key) => t(`status.${key}`)).join(" / ")}
          </span>)}
      </div>
      <MapContainer
    center={activeCenter}
    zoom={zoom}
    style={{ width: "100%", height: "100%" }}
    zoomControl={true}
    zoomAnimation={false}
    maxBounds={ISTANBUL_MAP_BOUNDS}
    maxBoundsViscosity={1}
  >
        <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />

        <MapViewport issues={validIssues} />
        {selectedIssue && <MapRecenter
    center={[Number(selectedIssue.latitude), Number(selectedIssue.longitude)]}
    zoom={15}
  />}

        {validIssues.map((issue) => {
    const isSelected = selectedIssue?.id === issue.id;
    const pos = [
      Number(issue.latitude),
      Number(issue.longitude)
    ];
    return <Marker
      key={issue.id}
      title={issue.title}
      alt={issue.title}
      position={pos}
      icon={createIssueIcon(issue, isSelected)}
      eventHandlers={{
        click: () => onSelectIssue && onSelectIssue(issue)
      }}
    >
              <Popup maxWidth={260}>
                <div style={{ padding: "8px", maxWidth: "240px", overflowWrap: "anywhere" }}>
                  <p>{issue.category?.name}</p>
                  <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "8px",
        gap: "8px"
      }}
    >
                    <StatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.priority} supporterCount={issue.supporter_count} />
                  </div>

                  <h4
      style={{
        fontSize: "0.9375rem",
        fontWeight: 600,
        marginBottom: "6px",
        color: "var(--text-primary)"
      }}
    >
                    {issue.title}
                  </h4>

                  {issue.summary && <p
      style={{
        fontSize: "0.8125rem",
        color: "var(--text-secondary)",
        marginBottom: "10px",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }}
    >
                      {issue.summary}
                    </p>}

                  <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.75rem",
        color: "var(--text-tertiary)",
        borderTop: "1px solid var(--border-default)",
        paddingTop: "8px",
        marginTop: "8px"
      }}
    >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FileText size={12} /> {issue.report_count}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Users size={12} /> {issue.supporter_count || 0}
                      </span>
                    </div>

                    <Link
      to={`/issues/${issue.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        color: "var(--accent-primary)",
        fontWeight: 600
      }}
    >
                      <span>{t("issue.details")}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>;
  })}
      </MapContainer>
    </div>;
};
export {
  LeafletMap
};
