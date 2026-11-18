import { create } from 'zustand'

interface CommandPaletteStore {
  open: boolean
  setOpen: (open: boolean) => void
}

export const useCommandPalette = create<CommandPaletteStore>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

/** "⌘K" on a Mac, "Ctrl K" elsewhere. */
export const COMMAND_SHORTCUT = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K'
