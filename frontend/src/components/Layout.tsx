"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, FileText, Settings } from "lucide-react";
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

  // 現在のページに応じたタイトルを取得
  const getPageTitle = () => {
    const currentItem = navigationItems.find((item) => item.href === pathname);
    return currentItem ? currentItem.label : "Tip Calculator";
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* ナビゲーションバー（左側178px固定） */}
      <div className="w-0 xl:w-[178px] h-screen bg-white shadow-lg flex flex-col border-r border-gray-200 transition-[width,transform] duration-300 ease-in-out transform -translate-x-full xl:translate-x-0 overflow-hidden">
        {/* ロゴ・アプリ名 */}
        <div className="p-4">
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
        </div>

        {/* ナビゲーション項目 */}
        <nav className="flex-1 px-3 pb-3 overflow-hidden pt-6">
          <div className="flex flex-col h-full gap-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.id}
                  href={item.href}
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
                  <IconComponent className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* コンテンツエリア（右側残り全スペース、スムーズ拡張） */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        {/* ヘッダー（上部60px） */}
        <header className="h-[60px] bg-white shadow-sm border-b border-gray-200 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>

          {/* ユーザープロファイル（ヘッダー右上） */}
          <UserProfile />
        </header>

        {/* メインコンテンツ（下部残りスペース） */}
        <main
          className="flex-1 overflow-y-auto bg-gray-50"
          style={{ scrollbarGutter: "stable" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
