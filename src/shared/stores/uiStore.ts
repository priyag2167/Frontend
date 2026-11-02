import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  reportingDays: number;
  setReportingDays: (days: number) => void;
  signInNotice: string | null;
  setSignInNotice: (message: string) => void;
  toast: { id: number; message: string } | null;
  notify: (message: string) => void;
  clearToast: () => void;
  reset: () => void;
}
// Transient interface state only. HCP, session, training and content data stay in Query's memory cache.
export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  search: "",
  setSearch: (search) => set({ search }),
  reportingDays: 30,
  setReportingDays: (reportingDays) => set({ reportingDays }),
  signInNotice: null,
  setSignInNotice: (signInNotice) => set({ signInNotice }),
  toast: null,
  notify: (message) => set({ toast: { id: Date.now(), message } }),
  clearToast: () => set({ toast: null }),
  reset: () =>
    set({
      sidebarOpen: false,
      search: "",
      reportingDays: 30,
      signInNotice: null,
      toast: null,
    }),
}));
