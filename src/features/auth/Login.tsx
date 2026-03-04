import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    if (error) {
      setError("Credenciales inválidas")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
      <div className="bg-neutral-900 p-8 rounded w-80">
        <h1 className="text-xl mb-4">Iniciar sesión</h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-3 bg-neutral-800 rounded outline-none"
          placeholder="Email"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 bg-neutral-800 rounded outline-none"
          placeholder="Password"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-2 bg-blue-600 rounded"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>

        {error && (
          <p className="text-red-400 text-sm mt-3">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}