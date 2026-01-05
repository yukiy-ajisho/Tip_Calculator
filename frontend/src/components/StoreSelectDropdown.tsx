"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Store {
  id: string;
  name: string;
  abbreviation: string;
}

interface StoreSelectDropdownProps {
  stores: Store[];
  selectedStore: string;
  onStoreSelect: (storeId: string) => void;
  storeDataStatus: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
}

export function StoreSelectDropdown({
  stores,
  selectedStore,
  onStoreSelect,
  storeDataStatus,
  isLoading,
  error,
}: StoreSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredStoreId, setHoveredStoreId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // クリックアウトサイドで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHoveredStoreId(null);
        setTooltipPosition(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedStoreName = stores.find((s) => s.id === selectedStore);
  const displayText = selectedStoreName
    ? `${selectedStoreName.name} (${selectedStoreName.abbreviation})`
    : isLoading
    ? "Loading stores..."
    : error
    ? "Error loading stores"
    : "-- Choose a store --";

  const handleStoreClick = (storeId: string) => {
    onStoreSelect(storeId);
    setIsOpen(false);
    setHoveredStoreId(null);
    setTooltipPosition(null);
  };

  const handleOptionMouseEnter = (
    storeId: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (storeDataStatus[storeId]) {
      setHoveredStoreId(storeId);
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.right + 10,
        y: rect.top + rect.height / 2,
      });
    }
  };

  const handleOptionMouseLeave = () => {
    setHoveredStoreId(null);
    setTooltipPosition(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center justify-between px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs disabled:bg-gray-100 disabled:cursor-not-allowed min-w-[200px] text-left"
      >
        <span>{displayText}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[200px]">
          <div
            className="px-2 py-1.5 text-xs text-gray-500 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoading
              ? "Loading stores..."
              : error
              ? "Error loading stores"
              : "-- Choose a store --"}
          </div>
          {stores.map((store) => (
            <div
              key={store.id}
              className={`px-2 py-1.5 text-xs cursor-pointer hover:bg-blue-50 ${
                selectedStore === store.id ? "bg-blue-100" : ""
              }`}
              onClick={() => handleStoreClick(store.id)}
              onMouseEnter={(e) => handleOptionMouseEnter(store.id, e)}
              onMouseLeave={handleOptionMouseLeave}
            >
              {store.name} ({store.abbreviation})
              {storeDataStatus[store.id] ? " 🔵" : ""}
            </div>
          ))}
        </div>
      )}

      {hoveredStoreId && tooltipPosition && (
        <div
          className="fixed px-3 py-2 bg-gray-800 text-white text-sm rounded pointer-events-none whitespace-nowrap z-50"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: "translateY(-50%)",
          }}
        >
          Working Data exist
          <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
        </div>
      )}
    </div>
  );
}
