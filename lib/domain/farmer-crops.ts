export const FARMER_CROPS = [
  {
    id: "nashik-red-onion",
    name: "Nashik Red Onion",
    supported: true,
    note: "The only crop with a registered price, wastage curve, and route.",
  },
  {
    id: "tomato",
    name: "Tomato",
    supported: false,
    note: "No price or wastage curve is registered for tomato.",
  },
  {
    id: "grape",
    name: "Grape",
    supported: false,
    note: "No price or wastage curve is registered for grape.",
  },
] as const;
