import { divIcon } from "leaflet";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getApproximateLocation, reverseGeocode, searchPlaces } from "../api";

function markerIcon(status, selected = false) {
  const statusClass = status?.toLowerCase().replace(" ", "-") || "pending";
  return divIcon({
    className: "map-marker-wrapper",
    html: `<span class="${selected ? "selected-map-marker" : `issue-map-marker ${statusClass}`}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function MapInteraction({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], 15, { duration: 0.7 });
  }, [latitude, longitude, map]);

  return null;
}

function IssueMap({ latitude, longitude, issues, onPick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [showApproximate, setShowApproximate] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("Click the map to identify an address.");

  async function selectAndReadLocation(selectedLatitude, selectedLongitude) {
    onPick(selectedLatitude, selectedLongitude);
    setLocationMessage("Finding the nearest mapped address...");

    try {
      const place = await reverseGeocode(selectedLatitude, selectedLongitude);
      setSelectedAddress(place.name);
      setLocationMessage("Location selected. Check the address and marker before submitting.");
    } catch (error) {
      setSelectedAddress("Address could not be identified. Check the marker and coordinates.");
      setLocationMessage(error.message);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    if (query.trim().length < 2) return;

    try {
      setSearching(true);
      setLocationMessage("");
      const data = await searchPlaces(query.trim());
      setResults(data.results);
      if (data.results.length === 0) setLocationMessage("No locations found.");
    } catch (error) {
      setLocationMessage(error.message);
    } finally {
      setSearching(false);
    }
  }

  function chooseResult(place) {
    onPick(place.latitude, place.longitude);
    setQuery(place.name);
    setSelectedAddress(place.name);
    setResults([]);
    setLocationMessage("Location selected. Check the address and marker before submitting.");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser.");
      setShowApproximate(true);
      return;
    }

    if (!window.isSecureContext) {
      setLocationMessage("Current location requires HTTPS. It also works on localhost during development.");
      setShowApproximate(true);
      return;
    }

    setShowApproximate(false);
    setLocationMessage("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setQuery("Current location");
        setResults([]);
        setShowApproximate(false);
        await selectAndReadLocation(position.coords.latitude, position.coords.longitude);
        setLocationMessage(`Current location selected (accurate to about ${Math.round(position.coords.accuracy)} meters). Check the address below.`);
      },
      (error) => {
        const messages = {
          1: "Location permission is blocked. Allow location access in your browser and try again.",
          2: "Your device could not determine its location. Turn on GPS or location services and try again.",
          3: "Location took too long. Move near a window or check your connection and try again.",
        };
        setLocationMessage(messages[error.code] || "Current location is unavailable.");
        setShowApproximate(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function useApproximateLocation() {
    try {
      setLocationMessage("Finding your approximate location...");
      const location = await getApproximateLocation();
      onPick(location.latitude, location.longitude);
      setQuery(location.label || "Approximate location");
      setSelectedAddress(location.label || "Approximate city location");
      setResults([]);
      setLocationMessage("Approximate city location selected. Click the map to mark the exact issue position.");
    } catch (error) {
      setLocationMessage(error.message);
    }
  }

  return (
    <section className="panel location-panel">
      <div className="panel-title-row">
        <h2>Select Location</h2>
        <div className="location-actions">
          <button className="secondary-button location-button" type="button" onClick={useCurrentLocation}>
            <LocateFixed size={15} />Use exact location
          </button>
          {showApproximate && (
            <button className="secondary-button location-button" type="button" onClick={useApproximateLocation}>
              <MapPin size={15} />Use approximate location
            </button>
          )}
        </div>
      </div>

      <form className="location-search" onSubmit={handleSearch}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Ankara or another place in Turkey" />
        <button className="primary-button" type="submit" disabled={searching}>
          <Search size={16} />{searching ? "Searching..." : "Search"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="location-results">
          {results.map((place) => (
            <button key={place.id} type="button" onClick={() => chooseResult(place)}>
              {place.name}
            </button>
          ))}
        </div>
      )}
      {locationMessage && <p className="location-message">{locationMessage}</p>}

      <MapContainer className="live-map" center={[latitude, longitude]} zoom={13} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInteraction onMapClick={selectAndReadLocation} />
        <RecenterMap latitude={latitude} longitude={longitude} />

        {issues.map((issue) => (
          <Marker key={issue.id} position={[issue.latitude, issue.longitude]} icon={markerIcon(issue.status)}>
            <Popup><strong>{issue.title}</strong><br />{issue.status}</Popup>
          </Marker>
        ))}

        <Marker position={[latitude, longitude]} icon={markerIcon(null, true)}>
          <Popup>Selected report location</Popup>
        </Marker>
      </MapContainer>

      <div className="selected-location" aria-live="polite">
        <strong>Selected address</strong>
        <span>{selectedAddress}</span>
        <small>{latitude.toFixed(5)}, {longitude.toFixed(5)}</small>
      </div>

      <p className="map-instruction">Click the map, search for a place, or use your current location.</p>
    </section>
  );
}

export default IssueMap;
