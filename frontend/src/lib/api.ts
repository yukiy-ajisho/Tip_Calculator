import { createClient } from "@/lib/supabase-client";
import { Store } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error("No session found or session error:", sessionError);
    // Optionally redirect to login or throw a more specific error
    throw new Error("Authentication required.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || "An API error occurred.");
  }

  return response.json();
}

export const api = {
  stores: {
    getStores: (): Promise<Store[]> => {
      return apiRequest<Store[]>("/api/stores");
    },
    addStore: (name: string, abbreviation: string): Promise<Store> => {
      return apiRequest<Store>("/api/stores", {
        method: "POST",
        body: JSON.stringify({
          storeName: name,
          storeAbbreviation: abbreviation,
        }),
      });
    },
  },
  // Add other API categories here as needed
};
