"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const STORAGE_KEY = "lastTipSession";
const SESSION_FLAG_KEY = "directNavigationFromEdit";

interface LastTipSession {
  storeId: string;
  lastPage: "edit" | "calculate";
  calculationId?: string;
}

export default function TipPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // 1. sessionStorageフラグをチェック（Layout.tsxのonClickで設定されたフラグ）
        const directNavigationFlag = sessionStorage.getItem(SESSION_FLAG_KEY);
        if (directNavigationFlag === "true") {
          // 直接ナビゲーションの場合、/tip/importにリダイレクト
          // localStorageのクリアは/tip/import/page.tsxで行う
          router.push("/tip/import");
          return;
        }

        // 2. localStorageから前回のセッション情報を取得
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          // localStorageに情報がない場合、/tip/importにリダイレクト
          router.push("/tip/import");
          return;
        }

        const lastSession: LastTipSession = JSON.parse(stored);

        if (lastSession.lastPage === "calculate" && lastSession.calculationId) {
          // 前回がcalculateページだった場合、/tip/calculateにリダイレクト
          router.push(
            `/tip/calculate?calculationId=${lastSession.calculationId}`
          );
          return;
        }

        if (lastSession.lastPage === "edit" && lastSession.storeId) {
          // 前回がeditページだった場合、statusをチェック
          try {
            const response = await api.tips.getCalculationStatus(
              lastSession.storeId
            );

            if (response.success) {
              if (
                response.status === "processing" &&
                response.calculationId
              ) {
                // status === "processing"の場合、/tip/editにリダイレクト
                router.push(`/tip/edit?storeId=${lastSession.storeId}`);
                return;
              } else if (
                response.status === "completed" &&
                response.calculationId
              ) {
                // status === "completed"の場合、/tip/calculateにリダイレクト
                router.push(
                  `/tip/calculate?calculationId=${response.calculationId}`
                );
                return;
              }
            }
          } catch (error) {
            console.error("Failed to check calculation status:", error);
            // エラーが発生した場合、/tip/importにリダイレクト
          }
        }

        // それ以外の場合、/tip/importにリダイレクト
        router.push("/tip/import");
      } catch (error) {
        console.error("Error checking localStorage:", error);
        // エラーが発生した場合、/tip/importにリダイレクト
        router.push("/tip/import");
      }
    };

    checkAndRedirect();
  }, [router]);

  // リダイレクト中は何も表示しない
  return null;
}
