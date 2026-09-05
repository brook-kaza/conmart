// =============================================================================
// ConMart — Buyer Multi-Product Procurement Cart Context
// =============================================================================
// Provides client-side state for bundling materials across suppliers and depots.
// Persists automatically to localStorage.
// =============================================================================

"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export interface CartItem {
  listingId: string;
  sellerId: string;
  depotCode: string;
  location: string;
  productTitle: string;
  unit: string;
  imageUrl: string | null;
  qty: number;
  unitPrice: number;
  subtotal: number;
  minQty: number;
  maxQty: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateItemQty: (listingId: string, qty: number, unitPrice?: number) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  totalItemCount: number;
  distinctDepotCount: number;
  baseSubtotal: number;
  platformFee: number;
  tax: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "conmart_buyer_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount with defensive validation
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any corrupted, partial, or malformed items
          const sanitized = parsed.filter(
            (item): item is CartItem =>
              Boolean(item) &&
              typeof item.listingId === "string" &&
              typeof item.qty === "number" &&
              !isNaN(item.qty) &&
              item.qty > 0 &&
              typeof item.unitPrice === "number" &&
              !isNaN(item.unitPrice) &&
              item.unitPrice >= 0
          );
          queueMicrotask(() => {
            setItems(sanitized);
            setIsLoaded(true);
          });
          return;
        }
      }
    } catch (e) {
      console.error("Non-fatal: Failed to load cart from localStorage (resetting):", e);
    }
    queueMicrotask(() => {
      setIsLoaded(true);
    });
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items, isLoaded]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.listingId === newItem.listingId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const mergedQty = Math.max(newItem.qty, updated[existingIndex].qty);
        updated[existingIndex] = {
          ...newItem,
          qty: mergedQty,
          subtotal: Math.round(mergedQty * newItem.unitPrice * 100) / 100,
        };
        return updated;
      }
      return [...prev, newItem];
    });
    setIsOpen(true);
  };

  const updateItemQty = (listingId: string, qty: number, unitPrice?: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.listingId !== listingId) return item;
          const price = unitPrice ?? item.unitPrice;
          return {
            ...item,
            qty,
            unitPrice: price,
            subtotal: Math.round(qty * price * 100) / 100,
          };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const calculations = useMemo(() => {
    const baseSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const platformFee = Math.round(baseSubtotal * 0.1 * 100) / 100;
    const tax = Math.round((baseSubtotal + platformFee) * 0.15 * 100) / 100;
    const grandTotal = Math.round((baseSubtotal + platformFee + tax) * 100) / 100;

    const uniqueDepots = new Set(items.map((i) => i.depotCode));

    return {
      baseSubtotal,
      platformFee,
      tax,
      grandTotal,
      distinctDepotCount: uniqueDepots.size,
      totalItemCount: items.length,
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateItemQty,
        removeItem,
        clearCart,
        isOpen,
        setIsOpen,
        ...calculations,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
