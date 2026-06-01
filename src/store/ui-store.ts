import { create } from "zustand";

interface UIStore {
  theme: "dark";
  bellLastTolled: string | null;
  setBellTolled: (time: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: "dark",
  bellLastTolled: null,
  setBellTolled: (time: string) => set({ bellLastTolled: time }),
}));
