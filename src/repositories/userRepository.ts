import { supabase } from "@/lib/supabase"

export const userRepository = {
  async findByCode(code: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("code", code)
      .single()

        console.log("DATA:", data)
        console.log("ERROR:", error)

    if (error) throw error
    return data
  },
}