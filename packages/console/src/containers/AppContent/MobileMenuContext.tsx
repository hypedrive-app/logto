import { createContext } from 'react';

/**
 * Drives the mobile (≤768px) off-canvas sidebar drawer. On desktop the sidebar
 * is always visible and this state is ignored; on mobile the topbar hamburger
 * toggles it and the backdrop / navigation closes it.
 */
export type MobileMenuContextType = {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
};

export const MobileMenuContext = createContext<MobileMenuContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});
