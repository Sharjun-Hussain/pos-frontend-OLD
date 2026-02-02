"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  Store, 
  Receipt, 
  Settings2, 
  Monitor, 
  Mail, 
  Database,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Import your sub-components
import { GeneralSettings } from "./general-settings";
import { BusinessSettings } from "./business-settings";
import { PosSettings } from "./pos-settings";
import { CommunicationSettings } from "./communication-settings";
import { ReceiptSettings } from "./receipt-settings";
import { DataImportSettings } from "./data-import-settings";

const sidebarItems = [
  { id: "general", label: "General", icon: Settings2, desc: "App preferences & localization" },
  { id: "business", label: "Business Info", icon: Store, desc: "Contact & address details" },
  { id: "pos", label: "POS Terminal", icon: Monitor, desc: "Checkout & device settings" },
  { id: "communication", label: "Communication", icon: Mail, desc: "Email & SMS setup" },
  { id: "receipt", label: "Receipts", icon: Receipt, desc: "Print templates & logos" },
  { id: "import", label: "Data Import", icon: Database, desc: "Bulk upload products" },
];

export function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize active tab from URL query param or default to 'general'
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");

  // Sync state when URL param changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    // Update URL, and clear any config/sub params from previous tabs
    const params = new URLSearchParams();
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50/50">
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white hidden md:block">
          <nav className="p-4 space-y-1 sticky top-0">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400")} />
                    <div className="text-left">
                      <div className="font-semibold">{item.label}</div>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-blue-500" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-10">
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === "general" && <GeneralSettings />}
            {activeTab === "business" && <BusinessSettings />}
            {activeTab === "pos" && <PosSettings />}
            {activeTab === "communication" && <CommunicationSettings />}
            {activeTab === "receipt" && <ReceiptSettings />}
            {activeTab === "import" && <DataImportSettings />}
          </div>
        </main>
      </div>
    </div>
  );
}