"use client";

import { useState } from "react";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { signOut } from "@/lib/auth";

export function UserProfile() {
  const { user, loading } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      // ハードリロードでログインページに遷移（レイアウトを完全にクリア）
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full animate-pulse bg-gray-200"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const fullName =
    user.user_metadata?.full_name || user.user_metadata?.name || "User";

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-700"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-gray-300 text-gray-700">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium">{displayName}</span>
      </button>

      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          ></div>
          <div className="absolute top-full right-0 mt-2 w-56 rounded-lg shadow-lg border border-gray-200 bg-white py-2 z-[60]">
            <div className="px-4 pt-2 pb-1">
              <p className="text-sm font-medium text-gray-900">{fullName}</p>
            </div>
            <div className="px-4 pt-0 pb-4 border-b border-gray-100">
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left flex items-center text-sm transition-colors text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
