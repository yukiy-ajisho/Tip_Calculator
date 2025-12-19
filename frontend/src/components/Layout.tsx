"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Calculator, FileText, Settings, Menu } from "lucide-react";
import { UserProfile } from "./UserProfile";

// ナビゲーション項目
const navigationItems = [
  {
    id: "tip",
    label: "Tip",
    icon: Calculator,
    href: "/tip",
  },
  {
    id: "records",
    label: "Records",
    icon: FileText,
    href: "/records",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

// レイアウトコンテンツコンポーネント
export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarMode, setSidebarMode] = useState<"compact" | "full">("compact");
  const [isHovered, setIsHovered] = useState(false);

  // 現在のページに応じたタイトルを取得
  const getPageTitle = () => {
    const currentItem = navigationItems.find((item) => item.href === pathname);
    return currentItem ? currentItem.label : "Tip Calculator";
  };

  // サイドバーの表示モードを切り替え
  const toggleSidebarMode = () => {
    setSidebarMode((prev) => (prev === "compact" ? "full" : "compact"));
  };

  // サイドバーの実際の表示状態を決定
  // コンパクトモード時のみホバーで一時的に開く
  const isSidebarExpanded =
    sidebarMode === "full" || (sidebarMode === "compact" && isHovered);

  // サイドバーの幅を決定
  const sidebarWidth = isSidebarExpanded ? "178px" : "64px";

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ヘッダー（上部60px、左端まで） */}
      <header className="h-[60px] bg-white shadow-sm border-b border-gray-200 px-6 flex items-center justify-between">
        {/* 左側：アプリアイコン + 名前、ハンバーガーメニュー、ページタイトル */}
        <div className="flex items-center space-x-4">
          {/* アプリアイコン + 名前 */}
          <div className="flex items-center gap-2">
            <Image
              src="/app_logo.png"
              alt="Tip Calculator Logo"
              width={32}
              height={32}
              className="w-6 h-6"
            />
            <h1 className="text-lg font-bold text-gray-900">Tip Calculator</h1>
          </div>

          {/* ハンバーガーメニュー */}
          <button
            onClick={toggleSidebarMode}
            className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            title={
              sidebarMode === "compact" ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* ページタイトル */}
          <h2 className="text-xl font-bold text-gray-900">{getPageTitle()}</h2>
        </div>

        {/* 右側：ユーザープロファイル */}
        <UserProfile />
      </header>

      {/* メインコンテンツエリア（ヘッダーの下） */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左端ホバー領域（サイドバーがコンパクトモードの時のみ有効） */}
        {sidebarMode === "compact" && (
          <div
            className="absolute left-0 top-0 bottom-0 w-[10px] z-10"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />
        )}

        {/* サイドバー（左側、ヘッダーの下から） */}
        <div
          className="h-full bg-white shadow-lg flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden"
          style={{
            width: sidebarWidth,
          }}
          onMouseEnter={() => {
            if (sidebarMode === "compact") {
              setIsHovered(true);
            }
          }}
          onMouseLeave={() => {
            if (sidebarMode === "compact") {
              setIsHovered(false);
            }
          }}
        >
          {/* ナビゲーション項目 */}
          <nav className="flex-1 px-3 pb-3 overflow-hidden pt-6">
            <div className="flex flex-col h-full gap-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                // Tipリンクの場合、現在のパスが/tip/editまたは/tip/calculateの場合にsessionStorageフラグを設定
                const handleTipLinkClick = () => {
                  if (item.id === "tip") {
                    const SESSION_FLAG_KEY = "directNavigationFromEdit";
                    if (
                      pathname.startsWith("/tip/edit") ||
                      pathname.startsWith("/tip/calculate")
                    ) {
                      sessionStorage.setItem(SESSION_FLAG_KEY, "true");
                    }
                  }
                };

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={handleTipLinkClick}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors border-0 no-underline rounded-md ${
                      isActive
                        ? "text-blue-700 font-semibold"
                        : "text-gray-600 hover:text-blue-700"
                    }`}
                    style={{
                      backgroundColor: "white",
                      transition:
                        "background-color 0.2s ease, border-radius 0.2s ease",
                      color: isActive ? "#1d4ed8" : "#6b7280",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#dbeafe";
                      e.currentTarget.style.color = "#1d4ed8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                      e.currentTarget.style.color = isActive
                        ? "#1d4ed8"
                        : "#6b7280";
                    }}
                  >
                    <IconComponent className="h-5 w-5 flex-shrink-0" />
                    {isSidebarExpanded && (
                      <span className="text-sm whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* コンテンツエリア（右側残り全スペース） */}
        <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
          {/* メインコンテンツ */}
          <main
            className="flex-1 overflow-y-auto bg-gray-50"
            style={{ scrollbarGutter: "stable" }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
