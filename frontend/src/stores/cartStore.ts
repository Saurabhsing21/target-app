import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  setQty: (productId: number, quantity: number) => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set) => ({
        items: [],
        setQty: (productId, quantity) =>
          set((state) => ({
            items: state.items
              .map((i) => (i.productId === productId ? { ...i, quantity } : i))
              .filter((i) => i.quantity > 0),
          })),
        addItem: (item, quantity = 1) =>
          set((state) => {
            const existing = state.items.find((i) => i.productId === item.productId);
            if (!existing) return { items: [...state.items, { ...item, quantity }] };
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
              ),
            };
          }),
        removeItem: (productId) =>
          set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
        clear: () => set({ items: [] }),
      }),
      { name: "targetapp-cart" },
    ),
  ),
);
