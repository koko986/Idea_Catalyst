export type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  image: string;
  seller: string;
  rating: number;
  verified: boolean;
  trial: boolean;
  carbonKg: number;
};

export const listings: Listing[] = [
  {
    id: "iphone-13",
    title: "iPhone 13 · 128 GB",
    price: 1480000,
    category: "Phones",
    condition: "Excellent",
    location: "Within 500 m of Junction City",
    image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=1200&q=80",
    seller: "May Thiri",
    rating: 4.9,
    verified: true,
    trial: true,
    carbonKg: 55,
  },
  {
    id: "camera-x100",
    title: "Fujifilm X100V",
    price: 3250000,
    category: "Cameras",
    condition: "Like new",
    location: "Near Myanmar Plaza",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    seller: "Htet Aung",
    rating: 4.8,
    verified: true,
    trial: true,
    carbonKg: 31,
  },
  {
    id: "chair-oak",
    title: "Oak lounge chair",
    price: 280000,
    category: "Home",
    condition: "Good",
    location: "Within 1 km of Sanchaung",
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80",
    seller: "Nandar",
    rating: 4.7,
    verified: true,
    trial: false,
    carbonKg: 42,
  },
  {
    id: "bike-city",
    title: "City commuter bicycle",
    price: 460000,
    category: "Sports",
    condition: "Good",
    location: "Near Kandawgyi Park",
    image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1200&q=80",
    seller: "Ko Lin",
    rating: 4.6,
    verified: false,
    trial: false,
    carbonKg: 95,
  },
  {
    id: "macbook-air",
    title: "MacBook Air M2",
    price: 2890000,
    category: "Computers",
    condition: "Excellent",
    location: "Within 500 m of Hledan Centre",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    seller: "Su Mon",
    rating: 5,
    verified: true,
    trial: true,
    carbonKg: 146,
  },
  {
    id: "speaker",
    title: "Marshall Acton speaker",
    price: 620000,
    category: "Audio",
    condition: "Very good",
    location: "Near Tamwe Plaza",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80",
    seller: "Zin Min",
    rating: 4.8,
    verified: true,
    trial: true,
    carbonKg: 18,
  },
];

export const orderTimeline = [
  ["Payment secured", "1,480,000 MMK held in escrow", true],
  ["Shipment verified", "Product + package evidence added · Aug 28, 14:32", true],
  ["Arrived at G&G Hledan", "Locker B-14 · pickup code ready", true],
  ["Inspection window", "22h 18m remaining", false],
  ["Seller payout", "After both parties confirm", false],
] as const;

export function money(value: number) {
  return new Intl.NumberFormat("en-US").format(value) + " MMK";
}
