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
  ChevronRight,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import sub-components
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

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const params = new URLSearchParams();
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeItem = sidebarItems.find(i => i.id === activeTab);

  return (
    <div className="flex min-h-full bg-background">

      {/* ─── SIDEBAR ─── */}
      <aside className="w-72 shrink-0 border-r border-border/30 bg-card/50 backdrop-blur-sm hidden md:flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[13px] font-black text-foreground uppercase tracking-widest">System Settings</h2>
              <p className="text-[10px] text-muted-foreground/60 font-medium">Configuration Center</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 shadow-sm"
                    : "text-muted-foreground hover:bg-muted/30 hover:text-foreground border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-lg transition-all",
                    isActive ? "bg-[#10b981]/15 text-[#10b981]" : "bg-muted/40 text-muted-foreground/50 group-hover:text-foreground"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className={cn("font-black text-[12px] uppercase tracking-wider", isActive ? "text-[#10b981]" : "")}>{item.label}</div>
                    <div className="text-[10px] font-medium text-muted-foreground/50 mt-0.5 normal-case tracking-normal">{item.desc}</div>
                  </div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-[#10b981] shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/20">
          <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Elite Emerald</p>
            <p className="text-[10px] font-medium text-muted-foreground/60 mt-0.5">Configuration Dashboard v2.0</p>
          </div>
        </div>
      </aside>

      {/* ─── CONTENT AREA ─── */}
      <main className="flex-1 overflow-y-auto">
        {/* Content Header */}
        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border/30 px-8 py-5">
          <div className="flex items-center gap-3">
            {activeItem && (
              <>
                <div className="p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981]">
                  <activeItem.icon className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base font-black text-foreground uppercase tracking-widest">{activeItem.label}</h1>
                  <p className="text-[10px] text-muted-foreground/60 font-medium">{activeItem.desc}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "general" && <GeneralSettings />}
          {activeTab === "business" && <BusinessSettings />}
          {activeTab === "pos" && <PosSettings />}
          {activeTab === "communication" && <CommunicationSettings />}
          {activeTab === "receipt" && <ReceiptSettings />}
          {activeTab === "import" && <DataImportSettings />}
        </div>
      </main>
    </div>
  );
}