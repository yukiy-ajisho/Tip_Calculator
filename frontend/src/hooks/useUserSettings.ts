"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { UserSettings } from "@/types";

export function useUserSettings() {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.userSettings.getUserSettings();
        setUserSettings(data);
      } catch (err: any) {
        console.error("Failed to fetch user settings:", err);
        setError(err.message || "Failed to fetch user settings.");
        // Default to 24h and false if fetch fails
        setUserSettings({
          id: "",
          user_id: "",
          time_format: "24h",
          show_archived_records: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSettings();
  }, []);

  return {
    userSettings,
    timeFormat: userSettings?.time_format || "24h",
    showArchivedRecords: userSettings?.show_archived_records ?? false,
    isLoading,
    error,
  };
}
