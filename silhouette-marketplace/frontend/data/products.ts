// frontend/data/products.ts
// Mock catalogue. Boutique names are fictional placeholders.
// Replace imageUrl values with real, publicly hosted, isolated-background PNGs.

export type ClothingCategory = "tops" | "bottoms";

export interface Product {
  id: string;
  boutiqueName: string;
  title: string;
  priceUGX: number;
  imageUrl: string; // isolated-background garment PNG (must be public)
  category: ClothingCategory;
}

export const products: Product[] = [
  { id: "p-001", boutiqueName: "Kololo Atelier", title: "Linen Button Shirt", priceUGX: 85000,
    imageUrl: "https://placehold.co/600x800/png?text=Linen+Shirt", category: "tops" },
  { id: "p-002", boutiqueName: "Bugolobi Bespoke", title: "Kitenge Print Blouse", priceUGX: 70000,
    imageUrl: "https://placehold.co/600x800/png?text=Kitenge+Blouse", category: "tops" },
  { id: "p-003", boutiqueName: "Ntinda Threads", title: "Ribbed Knit Top", priceUGX: 55000,
    imageUrl: "https://placehold.co/600x800/png?text=Knit+Top", category: "tops" },
  { id: "p-004", boutiqueName: "Kabalagala Style House", title: "High-Waist Trousers", priceUGX: 120000,
    imageUrl: "https://placehold.co/600x800/png?text=Trousers", category: "bottoms" },
  { id: "p-005", boutiqueName: "Kololo Atelier", title: "Pleated Midi Skirt", priceUGX: 95000,
    imageUrl: "https://placehold.co/600x800/png?text=Midi+Skirt", category: "bottoms" },
  { id: "p-006", boutiqueName: "Muyenga Denim Co.", title: "Straight-Leg Jeans", priceUGX: 110000,
    imageUrl: "https://placehold.co/600x800/png?text=Jeans", category: "bottoms" },
];
