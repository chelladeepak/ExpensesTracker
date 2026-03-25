import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://rztkjacjylsrmcrthjdd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6dGtqYWNqeWxzcm1jcnRoamRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTg2NDQsImV4cCI6MjA5MDAzNDY0NH0.74gAEcSZd6GXEsIHSCmOD7Eu_QITvEodGRFYZrZKZuw";
const APP_STATE_ID = 'salary-tracker-one-year'

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function loadAppDataFromSupabase() {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('app_state')
    .select('payload')
    .eq('id', APP_STATE_ID)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.payload ?? null
}

export async function saveAppDataToSupabase(payload) {
  if (!supabase) return

  const { error } = await supabase
    .from('app_state')
    .upsert(
      {
        id: APP_STATE_ID,
        payload,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      },
    )

  if (error) {
    throw error
  }
}