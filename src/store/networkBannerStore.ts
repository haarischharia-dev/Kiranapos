import { create } from 'zustand';

/** Slim strip height — tab bar shifts up by this amount when the banner is visible. */
export const NETWORK_BANNER_HEIGHT = 28;

interface NetworkBannerState {
  bottomInset: number;
  setBottomInset: (inset: number) => void;
}

export const useNetworkBannerStore = create<NetworkBannerState>((set) => ({
  bottomInset: 0,
  setBottomInset: (inset) => set({ bottomInset: inset }),
}));
