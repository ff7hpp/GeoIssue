const ISTANBUL_BOUNDS = Object.freeze({
  south: 40.75,
  north: 41.6,
  west: 27.95,
  east: 29.95
});

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
  isWithinIstanbul
};
