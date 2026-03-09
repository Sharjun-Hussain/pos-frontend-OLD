"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierLedgerSheet } from "./SupplierLedgerSheet";
import { SupplierDetailSheet } from "./SupplierDetailSheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Swapped Building for Briefcase as it's more supplier-oriented
import { Users, UserCheck, UserX, Briefcase, Building, CheckCircle2, XCircle, Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getSupplierColumns } from "./supplier-column";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import SupplierSkeleton from "@/app/skeletons/purchases/supplier-skeleton";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";

const SupplierHeaderContent = () => (
  <div className="flex items-center gap-6">
    <div className="relative group">
      <div className="absolute -inset-2 bg-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700" />
      <div className="relative p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/10 shadow-2xl transition-all group-hover:border-emerald-500/30 group-hover:rotate-3">
        <Briefcase className="w-6 h-6 text-emerald-600" />
      </div>
    </div>
    <div className="flex flex-col">
      <h1 className="text-3xl font-black text-foreground tracking-tight leading-none mb-1.5 flex items-center gap-3">
        Supplier Registry
        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest hidden sm:flex">
          Strategic v2
        </Badge>
      </h1>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">
          Operational Core
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] opacity-60">
          Global Vendor Intelligence
        </p>
      </div>
    </div>
  </div>
);

const calculateSupplierStats = (suppliers) => ({
  total: suppliers?.length || 0,
  active: suppliers?.filter((sup) => sup.is_active).length || 0,
  suspended: suppliers?.filter((sup) => !sup.is_active).length || 0,
  // Approximate exposure calculation if available
  exposure: suppliers?.reduce((acc, sup) => acc + (Math.abs(sup.current_balance || 0)), 0) || 0,
});

// Simplified filters for suppliers
const SupplierFilters = ({ table }) => {
  if (!table) return null;
  return (
    <div className="flex items-center gap-3">
      <Select
        value={String(table.getColumn("is_active")?.getFilterValue() ?? "all")}
        onValueChange={(value) => {
          table
            .getColumn("is_active")
            ?.setFilterValue(value === "all" ? undefined : value === "true");
        }}
      >
        <SelectTrigger className="w-[200px] h-11 rounded-xl border-2 border-emerald-500/10 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all font-black text-[11px] uppercase tracking-widest text-emerald-800 dark:text-emerald-500">
          <SelectValue placeholder="Protocol Status" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-2 border-emerald-500/10 shadow-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
          <SelectItem value="all" className="py-3 font-black text-[10px] uppercase tracking-widest focus:bg-emerald-500/10 focus:text-emerald-700">All Protocols</SelectItem>
          <SelectItem value="true" className="py-3 font-black text-[10px] uppercase tracking-widest focus:bg-emerald-500/10 focus:text-emerald-700">Active Only</SelectItem>
          <SelectItem value="false" className="py-3 font-black text-[10px] uppercase tracking-widest focus:bg-emerald-500/10 focus:text-red-700">Suspended Only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

const SupplierBulkActions = ({ table, onDelete, onBulkActivation }) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);
  const numSelected = selectedIds.length;

  const handleDeactivate = () => {
    onBulkActivation(selectedIds, "deactivate");
    table.resetRowSelection();
  };

  const handleActivate = () => {
    onBulkActivation(selectedIds, "activate");
    table.resetRowSelection();
  };
  const handleDelete = () => {
    onDelete(selectedIds);
    table.resetRowSelection();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-11 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-500 hover:bg-emerald-500/10 transition-all font-black text-[11px] uppercase tracking-widest gap-3 shadow-sm">
          Batch Execution ({numSelected}) <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-3 rounded-2xl shadow-2xl border-2 border-emerald-500/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
        <DropdownMenuItem
          className="rounded-xl py-3 text-[11px] font-black uppercase tracking-widest text-emerald-600 focus:text-emerald-700 focus:bg-emerald-500/10 cursor-pointer transition-all"
          onClick={handleActivate}
        >
          <CheckCircle2 className="mr-3 h-4 w-4" />
          Activate Units
        </DropdownMenuItem>

        <DropdownMenuItem
          className="rounded-xl py-3 text-[11px] font-black uppercase tracking-widest text-amber-600 focus:text-amber-700 focus:bg-amber-500/10 cursor-pointer transition-all"
          onClick={handleDeactivate}
        >
          <XCircle className="mr-3 h-4 w-4" />
          Suspend Units
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-3 bg-emerald-500/10" />

        <DropdownMenuItem
          className="rounded-xl py-3 text-[11px] font-black uppercase tracking-widest text-red-600 focus:text-red-700 focus:bg-red-500/10 cursor-pointer transition-all"
          onClick={handleDelete}
        >
          <Trash2 className="mr-3 h-4 w-4" />
          Purge Selection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function SupplierPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [suppliers, setSuppliers] = useState([]); // Renamed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { SUPPLIER } = MODULES;

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  const fetchSuppliers = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      // Updated API endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.status === "success") {
        // Updated state setter
        setSuppliers(data?.data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchSuppliers();
    }
  }, [status, session]);

  const handleAddClick = () => {
    setIsNavigating(true);
    router.push("/purchase/suppliers/new");
  };

  const handleEditClick = (supplier) => {
    setIsNavigating(true);
    router.push(`/purchase/suppliers/${supplier.id}/edit`);
  };

  const handleDelete = async (ids) => {
    const isBulk = Array.isArray(ids);
    const idsToDelete = isBulk ? ids : [ids];

    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchSuppliers();
          return "Supplier(s) deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  };

  const handleToggleStatus = async (supplier) => {
    const action = supplier?.is_active ? "deactivate" : "activate";
    toast.promise(
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplier?.id}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
        success: () => {
          fetchSuppliers();
          return `Supplier ${action}d successfully!`;
        },
        error: "Action failed.",
      }
    );
  };

  const handleBulkActivation = async (ids, type) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${id}/${
              type === "activate" ? "activate" : "deactivate"
            }`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          )
        )
      ),
      {
        loading: type === "activate" ? "Activating..." : "Deactivating...",
        success: () => {
          fetchSuppliers(); // Refetch data
          return `Suppliers ${
            type === "activate" ? "activated" : "deactivated"
          } successfully!`;
        },
        error: "Action failed.",
      }
    );
  };

  // Updated to use getSupplierColumns
  const columns = getSupplierColumns({
    onDelete: canDelete(SUPPLIER) ? handleDelete : null,
    onToggleStatus: canUpdate(SUPPLIER) ? handleToggleStatus : null,
    onEdit: canUpdate(SUPPLIER) ? handleEditClick : null,
    onViewLedger: (supplier) => {
      setSelectedSupplier(supplier);
      setLedgerOpen(true);
    },
    onSettle: (supplier) => {
      setSelectedSupplier(supplier);
      setLedgerOpen(true); // Open ledger which contains settle button
    },
    onViewDetails: (supplier) => {
      setSelectedSupplier(supplier);
      setDetailOpen(true);
    },
  });

  // Updated stats calculation
  const stats = calculateSupplierStats(suppliers);
  const statCards = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { 
          label: "Strategic Portfolio", 
          val: stats.total, 
          icon: Briefcase, 
          color: "text-emerald-600",
          bg: "bg-emerald-500/10",
          desc: "Total Registered Entities"
        },
        { 
          label: "Active Protocols", 
          val: stats.active, 
          icon: UserCheck, 
          color: "text-emerald-500",
          bg: "bg-emerald-500/5",
          desc: "Operational Pipelines"
        },
        { 
          label: "Suspended Units", 
          val: stats.suspended, 
          icon: UserX, 
          color: "text-amber-500",
          bg: "bg-amber-500/5",
          desc: "Risk Management Halt"
        },
        { 
          label: "Market Exposure", 
          val: `LKR ${(stats.exposure / 1000000).toFixed(1)}M`, 
          icon: Activity, 
          color: "text-blue-500",
          bg: "bg-blue-500/5",
          desc: "Cumulative Liability"
        },
      ].map((card, i) => (
        <Card key={i} className="group relative overflow-hidden border-2 border-emerald-500/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-xl shadow-emerald-500/2 hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors" />
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {card.label}
                </p>
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  {card.val}
                </h3>
                <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  {card.desc}
                </p>
              </div>
              <div className={cn("p-3 rounded-2xl border-2 border-white dark:border-slate-800 shadow-lg", card.bg)}>
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <ResourceManagementLayout
      data={suppliers} // Updated data
      columns={columns}
      isLoading={loading || status === "loading"}
      isError={!!error}
      errorMessage={error}
      onRetry={fetchSuppliers} // Updated retry function
      headerTitle={<SupplierHeaderContent />}
      addButtonLabel="Initialize New Partner" // Updated button label
      onAddClick={canCreate(SUPPLIER) ? handleAddClick : null}
      isAdding={isNavigating}
      onExportClick={() => console.log("Export clicked")}
      statCardsComponent={statCards} 
      bulkActionsComponent={
        canDelete(SUPPLIER) ? (
          <SupplierBulkActions // Renamed component
            onDelete={handleDelete}
            onDeactivate={handleBulkActivation}
            onBulkActivation={handleBulkActivation}
          />
        ) : null
      }
      searchColumn="name"
      searchPlaceholder="Filter suppliers by name..." // Updated placeholder
      loadingSkeleton={<SupplierSkeleton />}
      filterComponents={(table) => <SupplierFilters table={table} />} // Renamed component
    >
      <SupplierLedgerSheet
        supplier={selectedSupplier}
        open={ledgerOpen}
        onOpenChange={setLedgerOpen}
        accessToken={session?.accessToken}
      />
      <SupplierDetailSheet
        supplier={selectedSupplier}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        accessToken={session?.accessToken}
      />
    </ResourceManagementLayout>
  );
}
