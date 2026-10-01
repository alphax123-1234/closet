"use client"; // Uses state + browser events + Framer Motion, so it must be a client component.

// frontend/components/FittingRoomLayout.tsx
// ---------------------------------------------------------------------------
// SYSTEM FLOW
//   1. User clicks "Try On" on a product card.
//   2. We POST { mannequinUrl, garmentUrl, clothingCategory } to the Express API
//      (NEXT_PUBLIC_API_URL). No secrets are used here.
//   3. While waiting, `isLoading` is true -> shimmering blur overlay shows.
//   4. API returns { imageUrl } -> we store it as the new model image.
//      That result becomes the base for the NEXT try-on, so a top + bottoms can be layered.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { products, type Product } from "@/data/products";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const BASE_MANNEQUIN_URL = process.env.NEXT_PUBLIC_MANNEQUIN_URL ?? "";

// UGX has no minor unit, so no decimals.
const formatUGX = (n: number) => `UGX ${n.toLocaleString("en-UG")}`;

export default function FittingRoomLayout() {
  // The image currently shown on the left (starts as the bare mannequin).
  const [modelUrl, setModelUrl] = useState(BASE_MANNEQUIN_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null); // card being processed
  const [error, setError] = useState<string | null>(null);

  async function handleTryOn(product: Product) {
    if (isLoading) return; // prevent double-submits (each call costs credits)
    setIsLoading(true);
    setActiveId(product.id);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/try-on`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mannequinUrl: modelUrl, // current look (may already include a layered garment)
          garmentUrl: product.imageUrl,
          clothingCategory: product.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Try-on failed.");
      setModelUrl(data.imageUrl); // show the dressed mannequin
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
      setActiveId(null);
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      {/* 12-column grid on EVERY screen size: the model stays beside the feed,
          so shoppers never scroll back up to see the result.
          Mobile: 5 / 7 split. Desktop: 4 / 8 split. */}
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-3 px-3 py-3 md:gap-8 md:px-8 md:py-8">
        {/* ============ LEFT PANEL (col-span-4): sticky model view ============ */}
        <aside className="col-span-5 self-start sticky top-3 md:col-span-4 md:top-8">
          <div>
            <div className="relative mx-auto aspect-[3/4] max-h-[calc(100dvh-5.5rem)] overflow-hidden rounded-2xl bg-stone-200 shadow-lg ring-1 ring-stone-300">
              {modelUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={modelUrl} alt="Mannequin wearing your selection" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-stone-500">
                  Set NEXT_PUBLIC_MANNEQUIN_URL in frontend/.env.local to show your mannequin.
                </div>
              )}

              {/* Loading skeleton: blur + moving highlight while a request is in flight */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 overflow-hidden backdrop-blur-md bg-stone-200/40"
                    role="status"
                    aria-label="Fitting garment"
                  >
                    {/* The shimmer: a wide soft-white gradient sweeping left to right */}
                    <motion.div
                      className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: "250%" }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="absolute bottom-3 left-2 right-2 text-center text-xs font-medium md:text-sm text-stone-700">
                      Fitting your garment…
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error message with a clear next step */}
            {error && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </p>
            )}

            {/* Reset to the bare mannequin */}
            <button
              onClick={() => { setModelUrl(BASE_MANNEQUIN_URL); setError(null); }}
              disabled={isLoading}
              className="mt-2 w-full rounded-lg border border-stone-300 py-2 text-sm font-medium transition hover:bg-stone-200 disabled:opacity-50"
            >
              Start over
            </button>
          </div>
        </aside>

        {/* ============ RIGHT PANEL (col-span-8): product feed ============ */}
        <section className="col-span-7 min-w-0 md:col-span-8">
          <h1 className="mb-4 text-xl font-semibold tracking-tight md:mb-6 md:text-2xl">Silhouette Marketplace</h1>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {products.map((p) => (
              <motion.article
                key={p.id}
                whileHover={{ y: -6 }} // smooth lift on hover
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200 hover:shadow-xl"
              >
                <div className="aspect-[3/4] overflow-hidden bg-stone-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1 p-3 md:p-4">
                  <p className="text-xs text-stone-500">{p.boutiqueName}</p>
                  <h2 className="font-medium">{p.title}</h2>
                  <p className="text-sm text-stone-700">{formatUGX(p.priceUGX)}</p>
                  <button
                    onClick={() => handleTryOn(p)}
                    disabled={isLoading}
                    className="mt-3 w-full rounded-lg bg-stone-900 py-2 text-sm font-medium text-white transition hover:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {activeId === p.id ? "Fitting…" : "Try On"}
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
