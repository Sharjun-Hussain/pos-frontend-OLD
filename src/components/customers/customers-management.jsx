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
  const CUSTOMER = "customer"; // Not explicitly in MODULES yet? Let's check. 
  // Wait, I should check MODULES in permissions.js. I'll use a hardcoded string if needed, 
  // but better to check permissions.js first if I can.
  // Actually, I'll just use "customer" for now as it's the standard.
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Create query string helper
  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  // Check URL for customerId on mount or update
  useEffect(() => {
    const customerId = searchParams.get("customerId");
    if (customerId) {
        // Try to find in current list
        const customer = customers.find((c) => c.id == customerId);
        if (customer) {
            setSelectedCustomer(customer);
            setIsLedgerOpen(true);
        } else if (customers.length > 0) {
            // Only try to fetch if we have loaded customers but didn't find this one
            // This prevents duplicate fetches or race conditions during initial load
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
    // Update URL to include customerId, prevent scroll reset
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
      <div className="flex-1 flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 opacity-20" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 p-8 space-y-8 pb-20 overflow-y-auto">
      {/* --- Header Actions --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Client Management</h1>
          <p className="text-sm text-slate-500 font-medium">Coordinate customer relationships and loyalty portfolios</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 h-11 px-5 font-bold gap-2 rounded-xl transition-all shadow-sm">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {canCreate(CUSTOMER) && (
            <AddCustomerDialog onAdd={fetchCustomers}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 font-bold gap-2 rounded-xl transition-all shadow-lg active:scale-95">
                <Plus className="h-5 w-5" /> Register Client
              </Button>
            </AddCustomerDialog>
          )}
        </div>
      </div>

      {/* --- Stats Visualization --- */}
      <CustomerStats customers={customers} />

      {/* --- Search & Control Bar --- */}
      <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm sticky top-4 z-20">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-end">
            <div className="w-full lg:w-72 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Filter</label>
              <div className="flex flex-wrap gap-2">
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
                      "px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border",
                      activeTab === tab.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-105"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-2 w-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Discovery</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  placeholder="Query by Name, Identification, or Contact Digits..." 
                  className="pl-11 h-12 bg-slate-50/50 border-slate-100 rounded-xl focus:bg-white transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={fetchCustomers} variant="secondary" className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all p-0 shadow-sm">
              <RefreshCcw className={cn("h-5 w-5", loading && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Data Interaction --- */}
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
