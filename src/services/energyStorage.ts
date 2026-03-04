const ENERGY_KEY = "humanhab_energy"

export interface StoredEnergy {
  level: number
  updatedAt: string
}

export const saveEnergy = (value: number) => {
  const payload: StoredEnergy = {
    level: value,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(ENERGY_KEY, JSON.stringify(payload))
}

export const loadEnergy = (): StoredEnergy | null => {
  const stored = localStorage.getItem(ENERGY_KEY)
  return stored ? JSON.parse(stored) : null
}