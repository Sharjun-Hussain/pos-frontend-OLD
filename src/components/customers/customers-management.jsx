"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Plus, Search, Users, RefreshCcw, Download, Printer, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomersTable } from "./customers-table";
import { AddCustomerDialog } from "./add-customer-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerStats } from "./customer-stats";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CustomerLedgerSheet } from "./CustomerLedgerSheet";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { exportToCSV } from "@/lib/exportUtils";

export function CustomersManagement() {
  const { data: session } = useSession();
  const { canCreate } = usePermission();
  const CUSTOMER = "customer"; 
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    const customerId = searchParams.get("customerId");
    if (customerId) {
        const customer = customers.find((c) => c.id == customerId);
        if (customer) {
            setSelectedCustomer(customer);
            setIsLedgerOpen(true);
        } else if (customers.length > 0) {
             fetchSingleCustomer(customerId);
        }
    } else {
        setIsLedgerOpen(false);
    }
  }, [searchParams, customers]);

  const fetchSingleCustomer = async (id) => {
      if (!session?.accessToken) return;
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${id}`, {
              headers: { Authorization: `Bearer ${session.accessToken}` }
          });
          const result = await res.json();
          if (result.status === "success") {
              setSelectedCustomer(result.data);
              setIsLedgerOpen(true);
          }
      } catch (error) {
          console.error("Failed to fetch specific customer:", error);
      }
  };

  const fetchCustomers = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      const result = await response.json();
      if (result.status === "success") {
        setCustomers(Array.isArray(result.data) ? result.data : (result.data.data || []));
      } else {
        toast.error(result.message || "Failed to fetch customers");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("An error occurred while fetching customers");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        searchQuery === "" ||
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery);

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "active" && customer.is_active === true) ||
        (activeTab === "inactive" && customer.is_active === false) ||
        (activeTab === "vip" && customer.loyaltyPoints >= 500);

      return matchesSearch && matchesTab;
    });
  }, [customers, searchQuery, activeTab]);

  const handleExportCSV = () => {
    const exportData = filteredCustomers.map(c => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone,
      Address: c.address,
      Status: c.is_active ? "Active" : "Inactive",
      "Total Spent": c.totalSpent,
      "Loyalty Points": c.loyaltyPoints
    }));
    exportToCSV(exportData, "Customers_List");
  };

  const handleDelete = async (id) => {
    if (!session?.accessToken) return;
    if (!confirm("Are you sure you want to delete this customer profile?")) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success("Customer profile purged successfully");
        fetchCustomers();
      } else {
        toast.error(result.message || "Failed to delete customer");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("An error occurred while deleting customer");
    }
  };

  const handleViewLedger = (customer) => {
    router.push(pathname + "?" + createQueryString("customerId", customer.id), { scroll: false });
  };

  const handleCloseLedger = (open) => {
      if (!open) {
          router.push(pathname, { scroll: false });
      }
      setIsLedgerOpen(open);
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#10b981] opacity-20" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Synchronizing Profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-background p-6 md:p-10 space-y-8 pb-32 overflow-y-auto max-w-[1600px] mx-auto w-full">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Client Management</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Customer Intelligence</span>
              <span className="text-muted-foreground/30">/</span>
              <span>CRM</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Relationship Portfolios</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {canCreate(CUSTOMER) && (
            <AddCustomerDialog onAdd={fetchCustomers}>
              <Button className="bg-[#10b981] hover:bg-[#059669] text-white h-10 px-6 font-bold gap-2 rounded-xl transition-all shadow-lg active:scale-95 border-none">
                <Plus className="h-5 w-5" /> Register Client
              </Button>
            </AddCustomerDialog>
          )}
        </div>
      </div>

      {/* --- STATS --- */}
      <CustomerStats customers={customers} />

      {/* --- FILTERS & SEARCH --- */}
      <Card className="border-none shadow-sm bg-card/80 backdrop-blur-md sticky top-4 z-20 border-border/10 overflow-visible">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-8 items-end">
            <div className="w-full lg:w-fit space-y-2.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Profile Category</label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: "all", label: "All Clients" },
                  { id: "active", label: "Active Status" },
                  { id: "vip", label: "VIP Tier" },
                  { id: "inactive", label: "Inactive" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border",
                      activeTab === tab.id
                        ? "bg-[#10b981] text-white border-[#10b981] shadow-lg shadow-[#10b981]/20 scale-[1.02]"
                        : "bg-background text-muted-foreground border-border/50 hover:border-[#10b981]/30 hover:bg-muted/20"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-2.5 w-full">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Universal Discovery</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#10b981] transition-colors" />
                <Input 
                  placeholder="Query by Name, Identification, or Contact Digits..." 
                  className="pl-12 h-12 bg-background/50 border-border/50 rounded-xl focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all font-bold text-[11px] uppercase tracking-wider placeholder:lowercase placeholder:font-medium placeholder:text-muted-foreground/40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={fetchCustomers} variant="outline" className="h-12 w-12 rounded-xl bg-background border-border/50 hover:bg-muted/30 text-muted-foreground hover:text-[#10b981] transition-all p-0 shadow-sm">
              <RefreshCcw className={cn("h-5 w-5", loading && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- TABLE --- */}
      <CustomersTable
        customers={filteredCustomers}
        onUpdate={fetchCustomers}
        onDelete={handleDelete}
        onViewLedger={handleViewLedger}
      />

      <CustomerLedgerSheet
        customer={selectedCustomer}
        open={isLedgerOpen}
        onOpenChange={handleCloseLedger}
        accessToken={session?.accessToken}
      />
    </div>
  );
}
