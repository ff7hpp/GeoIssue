export const issues = [
  {
    id: 1,
    title: "Pothole on Main St",
    description: "Large pothole near the bus stop.",
    category: "Road",
    status: "Pending",
    reporter: "Ayse Demir",
    latitude: 39.9207,
    longitude: 32.8541,
    createdAt: "2026-08-18",
  },
  {
    id: 2,
    title: "Leaking fire hydrant",
    description: "Water has been leaking since this morning.",
    category: "Water",
    status: "In Progress",
    reporter: "Mert Kaya",
    latitude: 39.919,
    longitude: 32.853,
    createdAt: "2026-08-17",
  },
  {
    id: 3,
    title: "Broken streetlight",
    description: "The street is very dark at night.",
    category: "Electricity",
    status: "Resolved",
    reporter: "Zeynep Yilmaz",
    latitude: 39.9215,
    longitude: 32.855,
    createdAt: "2026-08-16",
  },
];

let nextId = 4;

export function getNextId() {
  const id = nextId;
  nextId += 1;
  return id;
}
