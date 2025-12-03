"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        // まずセッションをチェック（セッションがない場合はエラーにならない）
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // セッションがある場合のみgetUser()を呼び出す
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();

          if (error) {
            // エラーは無視（セッションが無効な場合など）
            setUser(null);
          } else {
            setUser(user);
          }
        } else {
          // セッションがない場合はユーザーもnull
          setUser(null);
        }
      } catch (error) {
        // エラーは無視（セッションがない場合など）
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
