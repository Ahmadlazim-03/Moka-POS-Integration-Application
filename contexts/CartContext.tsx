"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Types
export interface CartItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  stock: number;
  variant_id: number;
  category_id: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  outletId: number | null;
  outletName: string;
  addToCart: (product: Omit<CartItem, "quantity">, outletId: number, outletName: string) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "moka-pos-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [outletId, setOutletId] = useState<number | null>(null);
  const [outletName, setOutletName] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed.items || []);
        setOutletId(parsed.outletId || null);
        setOutletName(parsed.outletName || "");
      }
    } catch (error) {
      console.error("Error loading cart from storage:", error);
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ items, outletId, outletName })
      );
    }
  }, [items, outletId, outletName, isHydrated]);

  const addToCart = useCallback(
    (product: Omit<CartItem, "quantity">, newOutletId: number, newOutletName: string) => {
      // Check if adding from different outlet
      if (outletId && outletId !== newOutletId && items.length > 0) {
        const confirm = window.confirm(
          `Keranjang berisi item dari outlet "${outletName}". Hapus keranjang dan tambahkan dari outlet "${newOutletName}"?`
        );
        if (!confirm) return;
        setItems([]);
      }

      setOutletId(newOutletId);
      setOutletName(newOutletName);

      setItems((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === product.id);
        if (existingIndex >= 0) {
          // Update quantity
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          };
          return updated;
        }
        // Add new item
        return [...prev, { ...product, quantity: 1 }];
      });

      setIsOpen(true);
    },
    [outletId, outletName, items.length]
  );

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    setOutletId(null);
    setOutletName("");
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        outletId,
        outletName,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
