import { create } from 'zustand';

type LoaderState = {
  count: number;
  isLoading: boolean;
  show: () => void;
  hide: () => void;
};

export const useLoaderStore = create<LoaderState>((set, get) => ({
  count: 0,
  isLoading: false,
  show: () => {
    const count = get().count + 1;
    set({ count, isLoading: count > 0 });
  },
  hide: () => {
    const count = Math.max(0, get().count - 1);
    set({ count, isLoading: count > 0 });
  },
}));
