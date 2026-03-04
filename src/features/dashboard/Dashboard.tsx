import { useEnergyStore } from "@/store/useEnergyStore"
import EnergyBar from "@/components/ui/EnergyBar"
import { useEffect } from "react"

export default function Dashboard() {

  const level = useEnergyStore((state) => state.level)
  const updated_at = useEnergyStore((state) => state.updated_at)
  const adjustLevel = useEnergyStore((state) => state.adjustLevel)
  const loadEnergy = useEnergyStore((s) => s.loadEnergy)

  useEffect(() => {
    loadEnergy()
  }, [loadEnergy])

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">HumanHab</h1>

      <div className="mb-4 text-xl">
        Energy Level: <span className="font-semibold">{level}</span>
      </div>
      {updated_at && (
        <div className="text-sm text-neutral-400 mt-2">
          Last update: {new Date(updated_at).toLocaleString()}
        </div>
      )}

      <EnergyBar level={level} />

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => adjustLevel(5)}
          className="px-4 py-2 bg-green-600 rounded"
        >
          +5
        </button>

        <button
          onClick={() => adjustLevel(-5)}
          className="px-4 py-2 bg-red-600 rounded"
        >
          -5
        </button>
      </div>
    </div>
  )
}