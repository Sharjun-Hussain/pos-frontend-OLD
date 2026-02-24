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
import OrganizationPageSkeleton from "@/app/skeletons/Organization-skeleton";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";

// Simplified stats for suppliers
const calculateSupplierStats = (suppliers) => ({
  totalSuppliers: suppliers?.length,
  activeSuppliers: suppliers?.filter((sup) => sup.is_active).length,
  inactiveSuppliers: suppliers?.filter((sup) => !sup.is_active).length,
});

// Simplified filters for suppliers
const SupplierFilters = ({ table }) => {
  return (
    <>
      {/* Filter by Status */}
      <Select
        value={String(table.getColumn("is_active")?.getFilterValue() ?? "all")}
        onValueChange={(value) => {
          table
            .getColumn("is_active")
            ?.setFilterValue(value === "all" ? undefined : value === "true");
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="true">Active</SelectItem>
          <SelectItem value="false">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </>
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
        <Button variant="outline" className="ml-auto">
          Actions ({numSelected}) <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
          onClick={handleActivate}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Activate Selected
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-amber-600 focus:text-amber-700 focus:bg-amber-50 cursor-pointer"
          onClick={handleDeactivate}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Deactivate Selected
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
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
  const supplierStats = calculateSupplierStats(suppliers);
  const statCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Suppliers
              </p>
              <p className="text-2xl font-bold">
                {supplierStats?.totalSuppliers}
              </p>
            </div>
            {/* Updated Icon */}
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      {/* You can add more stat cards here for active/inactive suppliers */}
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
      headerTitle="Supplier Management" // Updated title
      headerDescription="Manage your suppliers, contacts, and settings." // Updated description
      addButtonLabel="Add Supplier" // Updated button label
      onAddClick={canCreate(SUPPLIER) ? handleAddClick : null}
      isAdding={isNavigating}
      onExportClick={() => console.log("Export clicked")}
      // statCardsComponent={statCards} // Kept commented as in original
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
      loadingSkeleton={<OrganizationPageSkeleton />} // Updated skeleton
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
