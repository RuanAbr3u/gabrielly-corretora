if (!window.supabaseClient) {
  window.SUPABASE_URL = window.APP_CONFIG?.supabase?.url || "";
  window.SUPABASE_KEY = window.APP_CONFIG?.supabase?.key || "";

  if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
    console.warn("Configuração do Supabase não encontrada.");
  } else if (!window.supabase?.createClient) {
    console.warn("Biblioteca Supabase não carregada.");
  } else {
    window.supabaseClient = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        db: {
          schema: "public",
        },
        global: {
          headers: {
            "x-application-name": "gabrielly-corretora",
          },
        },
      },
    );
  }
}
