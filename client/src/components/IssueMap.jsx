import { divIcon } from "leaflet";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getApproximateLocation, reverseGeocode, searchPlaces } from "../api";

const DEFAULT_MAP_CENTER = { latitude: 39.9207, longitude: 32.8541 };

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
  const mapLatitude = Number.isFinite(latitude) ? latitude : DEFAULT_MAP_CENTER.latitude;
  const mapLongitude = Number.isFinite(longitude) ? longitude : DEFAULT_MAP_CENTER.longitude;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [showApproximate, setShowApproximate] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("اضغط على الخريطة لتحديد عنوان البلاغ.");

  async function selectAndReadLocation(selectedLatitude, selectedLongitude) {
    onPick(selectedLatitude, selectedLongitude);
    setLocationMessage("جارٍ التعرّف على أقرب عنوان...");

    try {
      const place = await reverseGeocode(selectedLatitude, selectedLongitude);
      setSelectedAddress(place.name);
      setLocationMessage("تم تحديد الموقع. راجع العنوان والعلامة قبل الإرسال.");
    } catch (error) {
      setSelectedAddress("تعذر تحديد العنوان. راجع العلامة والإحداثيات.");
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
      if (data.results.length === 0) setLocationMessage("لم نعثر على مواقع مطابقة.");
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
    setLocationMessage("تم تحديد الموقع. راجع العنوان والعلامة قبل الإرسال.");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("هذا المتصفح لا يدعم تحديد الموقع.");
      setShowApproximate(true);
      return;
    }

    if (!window.isSecureContext) {
      setLocationMessage("تحديد الموقع الحالي يحتاج اتصالًا آمنًا.");
      setShowApproximate(true);
      return;
    }

    setShowApproximate(false);
    setLocationMessage("جارٍ تحديد موقعك...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setQuery("موقعي الحالي");
        setResults([]);
        setShowApproximate(false);
        await selectAndReadLocation(position.coords.latitude, position.coords.longitude);
        setLocationMessage(`تم تحديد موقعك بدقة تقارب ${Math.round(position.coords.accuracy)} مترًا. راجع العنوان أدناه.`);
      },
      (error) => {
        const messages = {
          1: "إذن الموقع محظور. اسمح بالوصول من المتصفح ثم حاول مجددًا.",
          2: "تعذر على جهازك تحديد الموقع. فعّل خدمات الموقع ثم حاول مجددًا.",
          3: "استغرق تحديد الموقع وقتًا طويلًا. تحقق من الاتصال وحاول مجددًا.",
        };
        setLocationMessage(messages[error.code] || "الموقع الحالي غير متاح.");
        setShowApproximate(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function useApproximateLocation() {
    try {
      setLocationMessage("جارٍ تحديد موقعك التقريبي...");
      const location = await getApproximateLocation();
      onPick(location.latitude, location.longitude);
      setQuery(location.label || "الموقع التقريبي");
      setSelectedAddress(location.label || "موقع تقريبي داخل المدينة");
      setResults([]);
      setLocationMessage("تم تحديد موقع تقريبي. اضغط على الخريطة لتثبيت موقع المشكلة بدقة.");
    } catch (error) {
      setLocationMessage(error.message);
    }
  }

  return (
    <section className="panel location-panel">
      <div className="panel-title-row">
        <div><span className="section-label">الخريطة التفاعلية</span><h2>حدد موقع المشكلة</h2></div>
        <div className="location-actions">
          <button className="secondary-button location-button" type="button" onClick={useCurrentLocation}>
            <LocateFixed size={15} />استخدم موقعي
          </button>
          {showApproximate && (
            <button className="secondary-button location-button" type="button" onClick={useApproximateLocation}>
              <MapPin size={15} />موقع تقريبي
            </button>
          )}
        </div>
      </div>

      <form className="location-search" onSubmit={handleSearch}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن حي، شارع، أو معلم قريب" />
        <button className="primary-button" type="submit" disabled={searching}>
          <Search size={16} />{searching ? "جارٍ البحث..." : "بحث"}
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

      <MapContainer className="live-map" center={[mapLatitude, mapLongitude]} zoom={13} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInteraction onMapClick={selectAndReadLocation} />
        <RecenterMap latitude={mapLatitude} longitude={mapLongitude} />

        {issues.map((issue) => (
          <Marker key={issue.id} position={[issue.latitude, issue.longitude]} icon={markerIcon(issue.status)}>
            <Popup><strong>{issue.title}</strong><br />{issue.status}</Popup>
          </Marker>
        ))}

        {Number.isFinite(latitude) && Number.isFinite(longitude) && (
          <Marker position={[latitude, longitude]} icon={markerIcon(null, true)}>
            <Popup>موقع البلاغ المحدد</Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="selected-location" aria-live="polite">
        <strong>العنوان المحدد</strong>
         <span>{Number.isFinite(latitude) && Number.isFinite(longitude) ? selectedAddress : "لم يتم تحديد موقع البلاغ بعد."}</span>
         {Number.isFinite(latitude) && Number.isFinite(longitude) && (
           <small>{latitude.toFixed(5)}, {longitude.toFixed(5)}</small>
         )}
      </div>

      <p className="map-instruction">اضغط على الخريطة، ابحث عن مكان، أو استخدم موقعك الحالي.</p>
    </section>
  );
}

export default IssueMap;
