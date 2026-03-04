import { create } from "zustand"
import { energyRepository } from "@/repositories/energyRepository"
import { useAuthStore } from "@/store/authStore"

interface EnergyState {
  level: number
  updated_at: string | null
  loadEnergy: () => Promise<void>
  setLevel: (value: number) => Promise<void>
  adjustLevel: (delta: number) => Promise<void>
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const useEnergyStore = create<EnergyState>((set, get) => ({
  level: 80,
  updated_at: null,

  async loadEnergy() {
    const user = useAuthStore.getState().user
    if (!user) return

    const data = await energyRepository.getByUser(user.id)

    if (data) {
      set({
        level: data.level,
        updated_at: data.updated_at,
      })
    }
  },

  async setLevel(value) {
    const user = useAuthStore.getState().user
    if (!user) return

    const newLevel = clamp(value, 0, 100)

    await energyRepository.upsert(user.id, newLevel)

    set({
      level: newLevel,
      updated_at: new Date().toISOString(),
    })
  },

  async adjustLevel(delta) {
    const user = useAuthStore.getState().user
    if (!user) return

    const newLevel = clamp(get().level + delta, 0, 100)

    await energyRepository.upsert(user.id, newLevel)

    set({
      level: newLevel,
      updated_at: new Date().toISOString(),
    })
  },
}))