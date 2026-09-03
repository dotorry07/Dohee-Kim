export type AuthProvider = "mock" | "supabase";

export function getAuthProvider(): AuthProvider {
  const configuredProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER?.trim().toLowerCase();

  if (configuredProvider === "mock" || configuredProvider === "supabase") {
    return configuredProvider;
  }

  return hasSupabaseBrowserConfig() ? "supabase" : "mock";
}

export function hasSupabaseBrowserConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
      && (
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
          || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
      )
  );
}
