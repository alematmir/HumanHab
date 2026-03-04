import { supabase } from "@/lib/supabase"

export const energyRepository = {
  async getByUser(userId: string) {
  const { data, error } = await supabase
    .from("energy")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  return data
},

  async upsert(userId: string, level: number) {
  const { error } = await supabase
    .from("energy")
    .upsert(
      {
        user_id: userId,
        level,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (error) throw error
}
}