import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseBrowserConfiguration = {
  url?: string;
  publishableKey?: string;
};

export class SupabaseConfigurationError extends Error {
  constructor() {
    super(
      "Revival needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before GitHub sign-in can start.",
    );
    this.name = "SupabaseConfigurationError";
  }
}

let browserClient: SupabaseClient | undefined;

export function hasSupabaseBrowserConfiguration(
  configuration: SupabaseBrowserConfiguration = browserConfiguration(),
): configuration is Required<SupabaseBrowserConfiguration> {
  return Boolean(configuration.url?.trim() && configuration.publishableKey?.trim());
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const configuration = browserConfiguration();
  if (!hasSupabaseBrowserConfiguration(configuration)) {
    throw new SupabaseConfigurationError();
  }

  browserClient = createClient(configuration.url, configuration.publishableKey, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

function browserConfiguration(): SupabaseBrowserConfiguration {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}
