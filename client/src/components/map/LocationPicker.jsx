import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Navigation, Search, MapPin, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
function MapClickHandler({
  onSelect
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}
function MapCenterController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: false });
  }, [center[0], center[1], map]);
  return null;
}
const LocationPicker = ({
  latitude,
  longitude,
  hasSelection,
  onChange
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [addressLabel, setAddressLabel] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [permissionState, setPermissionState] = useState(null);
  const selectionVersion = useRef(0);
  const pickerIcon = L.divIcon({
    className: "custom-picker-pin-wrapper",
    html: `
      <div class="picker-pin-marker">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });
  const handleSelectLocation = async (lat, lon, gpsAccuracy) => {
    const numericLat = Number(lat);
    const numericLon = Number(lon);
    if (!Number.isFinite(numericLat) || !Number.isFinite(numericLon) || Math.abs(numericLat) > 90 || Math.abs(numericLon) > 180) {
      setLocationError(t("location.invalidCoordinates"));
      return;
    }
    const version = ++selectionVersion.current;
    setAccuracy(Number.isFinite(Number(gpsAccuracy)) && Number(gpsAccuracy) >= 0 ? Number(gpsAccuracy) : null);
    setAddressLabel(null);
    setLocationError(null);
    onChange(numericLat, numericLon, "");
    try {
      const addr = await api.reverseGeocode(numericLat, numericLon);
      if (addr && version === selectionVersion.current) {
        setAddressLabel(addr);
        onChange(numericLat, numericLon, addr);
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    }
  };
  const handleUseGps = async () => {
    setLocationError(null);
    if (typeof window === "undefined" || !window.isSecureContext) {
      setLocationError(t("location.secureContext"));
      return;
    }
    if (!navigator.geolocation) {
      setLocationError(t("location.unsupported"));
      return;
    }
    if (navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        setPermissionState(permission.state);
        if (permission.state === "denied") {
          setLocationError(t("location.denied"));
          return;
        }
      } catch {
        // Permission API is optional; getCurrentPosition will still request access.
      }
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGps(false);
        handleSelectLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        setIsLocatingGps(false);
        setLocationError(t(err.code === 1 ? "location.denied" : err.code === 3 ? "location.timeout" : "location.unavailable"));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await api.searchGeocode(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setLocationError(t("location.searchFailed"));
    } finally {
      setIsSearching(false);
    }
  };
  const handleSelectSearchResult = (result) => {
    handleSelectLocation(result.lat, result.lon);
    setAddressLabel(result.display_name);
    setSearchResults([]);
    setSearchQuery("");
  };
  return <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {locationError && <p className="field-error" role="alert">{locationError}</p>}
      {permissionState === "prompt" && <p role="status">{t("location.permissionPrompt")}</p>}
      {accuracy !== null && <p role="status">{t("location.accuracy", { meters: Math.round(accuracy) })}</p>}
      {
    /* Search & GPS Controls Bar */
  }
      <div style={{ display: "flex", gap: "8px", position: "relative" }}>
        <form onSubmit={handleSearch} style={{ flex: 1, position: "relative" }}>
          <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder={t("reportWizard.searchLocation")}
    style={{
      width: "100%",
      padding: "10px 12px",
      paddingInlineStart: "36px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)",
      fontSize: "0.875rem"
    }}
  />
          <Search
    size={16}
    style={{
      position: "absolute",
      top: "50%",
      insetInlineStart: "12px",
      transform: "translateY(-50%)",
      color: "var(--text-tertiary)"
    }}
  />
          {isSearching && <Loader2
    size={16}
    className="animate-spin"
    style={{
      position: "absolute",
      top: "50%",
      insetInlineEnd: "12px",
      transform: "translateY(-50%)",
      color: "var(--text-tertiary)"
    }}
  />}
        </form>

        <button
    type="button"
    onClick={handleUseGps}
    className="btn btn-secondary"
    disabled={isLocatingGps}
    title={t("reportWizard.useGps")}
    aria-label={t("reportWizard.useGps")}
    style={{ padding: "8px 14px", fontSize: "0.875rem", gap: "6px" }}
  >
          {isLocatingGps ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          <span style={{ display: "none" }} className="gps-btn-text">
            GPS
          </span>
        </button>

        {
    /* Search Autocomplete Results Dropdown */
  }
        {searchResults.length > 0 && <div
    style={{
      position: "absolute",
      top: "calc(100% + 4px)",
      insetInlineStart: 0,
      insetInlineEnd: 0,
      backgroundColor: "var(--bg-surface-elevated)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-overlay)",
      zIndex: 3e3,
      maxHeight: "220px",
      overflowY: "auto",
      padding: "4px"
    }}
  >
            {searchResults.map((item) => <button
    key={item.place_id}
    type="button"
    onClick={() => handleSelectSearchResult(item)}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
      padding: "10px 12px",
      textAlign: "start",
      fontSize: "0.8125rem",
      borderRadius: "var(--radius-sm)",
      color: "var(--text-primary)",
      borderBottom: "1px solid var(--border-subtle)"
    }}
  >
                <MapPin size={14} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.display_name}
                </span>
              </button>)}
          </div>}
      </div>

      {
    /* Interactive Map Surface */
  }
      <div
    style={{
      width: "100%",
      height: "340px",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      border: "1px solid var(--border-default)",
      position: "relative"
    }}
  >
        <MapContainer
    center={[latitude, longitude]}
    zoom={15}
    zoomAnimation={false}
    style={{ width: "100%", height: "100%" }}
  >
          <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
          <MapCenterController center={[latitude, longitude]} />
          <MapClickHandler onSelect={handleSelectLocation} />
          {hasSelection && <Marker position={[latitude, longitude]} icon={pickerIcon} />}
          {hasSelection && accuracy !== null && <Circle center={[latitude, longitude]} radius={accuracy} pathOptions={{ color: "#2563eb" }} />}
        </MapContainer>
      </div>

      {
    /* Coordinate & Address info display */
  }
      <div
    style={{
      padding: "10px 14px",
      backgroundColor: "var(--bg-surface-subtle)",
      borderRadius: "var(--radius-md)",
      fontSize: "0.8125rem",
      color: "var(--text-secondary)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: "1px solid var(--border-default)"
    }}
  >
        <MapPin size={16} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
        {hasSelection ? <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </div>
          {addressLabel && <div style={{ fontSize: "0.75rem", marginTop: "2px", color: "var(--text-tertiary)" }}>
              {addressLabel}
            </div>}
        </div> : <span>{t("location.noSelection")}</span>}
      </div>

      <style>{`
        @media (min-width: 480px) {
          .gps-btn-text {
            display: inline !important;
          }
        }
      `}</style>
    </div>;
};
export {
  LocationPicker
};
