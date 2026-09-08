const ISTANBUL_CENTER = Object.freeze([41.0082, 28.9784]);
const ISTANBUL_BOUNDS = Object.freeze({
  south: 40.75,
  north: 41.6,
  west: 27.95,
  east: 29.95
});
const ISTANBUL_MAP_BOUNDS = Object.freeze([
  [ISTANBUL_BOUNDS.south, ISTANBUL_BOUNDS.west],
  [ISTANBUL_BOUNDS.north, ISTANBUL_BOUNDS.east]
]);

function isWithinIstanbul(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  return Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= ISTANBUL_BOUNDS.south &&
    lat <= ISTANBUL_BOUNDS.north &&
    lon >= ISTANBUL_BOUNDS.west &&
    lon <= ISTANBUL_BOUNDS.east;
}

export {
  ISTANBUL_BOUNDS,
  ISTANBUL_CENTER,
  ISTANBUL_MAP_BOUNDS,
  isWithinIstanbul
};
