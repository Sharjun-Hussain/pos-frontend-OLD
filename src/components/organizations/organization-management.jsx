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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserCheck, UserX, Briefcase, Building, CheckCircle2, XCircle, Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import OrganizationPageSkeleton from "@/app/skeletons/organization-skeleton";
import { ResourceManagementLayout } from "../general/resource-management-layout";
import { getOrganizationColumns } from "./organization-column";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";

const calculateOrganizationStats = (organizations) => ({
  totalOrganizations: organizations?.length,
  activeOrganizations: organizations?.filter((org) => org.is_active).length,
  inactiveOrganizations: organizations?.filter((org) => !org.is_active).length,
  multiBranchOrganizations: organizations?.filter((org) => org.is_multi_branch)
    .length,
});

const OrganizationFilters = ({ table }) => {
  return (
    <>
      <Select
        value={String(
          table.getColumn("is_multi_branch")?.getFilterValue() ?? "all"
        )}
        onValueChange={(value) => {
          table
            .getColumn("is_multi_branch")
            ?.setFilterValue(value === "all" ? undefined : value === "true");
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="true">Multi-Branch</SelectItem>
          <SelectItem value="false">Single Branch</SelectItem>
        </SelectContent>
      </Select>

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

const OrganizationBulkActions = ({ table, onDelete, onDeactivate, onActivate }) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);
  const numSelected = selectedIds.length;

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
          onClick={() => {
            onActivate(selectedIds);
            table.resetRowSelection();
          }}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Activate Selected
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-amber-600 focus:text-amber-700 focus:bg-amber-50 cursor-pointer"
          onClick={() => {
            onDeactivate(selectedIds);
            table.resetRowSelection();
          }}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Deactivate Selected
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
          onClick={() => {
            onDelete(selectedIds);
            table.resetRowSelection();
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function OrganizationPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { ORG } = MODULES;
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  const fetchOrganizations = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      if (data.status === "success") {
        setOrganizations(data?.data?.data || []);
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
      fetchOrganizations();
    }
  }, [status, session]); // Re-run when session is ready

  const handleAddClick = () => {
    setIsNavigating(true);
    router.push("/organizations/new");
  };

  const handleDelete = async (ids) => {
    // This now works for single or bulk!
    const isBulk = Array.isArray(ids);
    const idsToDelete = isBulk ? ids : [ids];

    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchOrganizations(); // Refetch data
          return "Organization(s) deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  };

  const handleToggleStatus = async (organization) => {
    const action = organization?.is_active ? "deactivate" : "activate";
    toast.promise(
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organization?.id}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Suspending"}...`,
        success: () => {
          fetchOrganizations(); // Refetch data
          return `Organization ${action}d successfully!`;
        },
        error: "Action failed.",
      }
    );
  };

  const handleBulkActivate = async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${id}/activate`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Activating...",
        success: () => {
          fetchOrganizations();
          return "Organizations activated successfully!";
        },
        error: "Action failed.",
      }
    );
  };

  const handleBulkDeactivate = async (ids) => {
    toast.promise(
      Promise.all(
        ids.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${id}/deactivate`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${session.accessToken}` },
            }
          )
        )
      ),
      {
        loading: "Deactivating...",
        success: () => {
          fetchOrganizations(); // Refetch data
          return "Organizations deactivated successfully!";
        },
        error: "Action failed.",
      }
    );
  };

  const columns = getOrganizationColumns({
    onDelete: canDelete(ORG) ? handleDelete : null,
    onToggleStatus: canUpdate(ORG) ? handleToggleStatus : null,
  });

  const organizationStats = calculateOrganizationStats(organizations);
  const statCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-border/50 shadow-sm bg-card overflow-hidden group hover:border-[#10b981]/30 transition-all rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Organizations</p>
              <p className="text-2xl font-bold text-foreground">{organizationStats?.totalOrganizations}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
              <Building className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm bg-card overflow-hidden group hover:border-[#10b981]/30 transition-all rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Profiles</p>
              <p className="text-2xl font-bold text-foreground">{organizationStats?.activeOrganizations}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 group-hover:bg-[#10b981] group-hover:text-white transition-all duration-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm bg-card overflow-hidden group hover:border-[#10b981]/30 transition-all rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Multi-Branch</p>
              <p className="text-2xl font-bold text-foreground">{organizationStats?.multiBranchOrganizations}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm bg-card overflow-hidden group hover:border-[#10b981]/30 transition-all rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inactive</p>
              <p className="text-2xl font-bold text-foreground">{organizationStats?.inactiveOrganizations}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <ResourceManagementLayout
      data={organizations}
      columns={columns}
      isLoading={loading || status === "loading"}
      isError={!!error}
      errorMessage={error}
      onRetry={fetchOrganizations}
      headerTitle={
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Building className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Business Profiles</h1>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-0.5 font-medium">
              <span>System Settings</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Organizations</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Profiles</span>
            </div>
          </div>
        </div>
      }
      addButtonLabel="Add Profile"
      onAddClick={canCreate(ORG) ? handleAddClick : null}
      isAdding={isNavigating}
      onExportClick={() => console.log("Export clicked")}
      statCardsComponent={statCards}
      bulkActionsComponent={
        canDelete(ORG) ? (
          <OrganizationBulkActions
            onDelete={handleDelete}
            onDeactivate={handleBulkDeactivate}
            onActivate={handleBulkActivate}
          />
        ) : null
      }
      searchColumn="name"
      searchPlaceholder="Search profiles..."
      loadingSkeleton={<OrganizationPageSkeleton />}
      filterComponents={(table) => (
        <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Type</label>
                <div className="flex items-center gap-3">
                    <Select
                        value={String(table.getColumn("is_multi_branch")?.getFilterValue() ?? "all")}
                        onValueChange={(value) => table.getColumn("is_multi_branch")?.setFilterValue(value === "all" ? undefined : value === "true")}
                    >
                        <SelectTrigger className="h-10 w-[180px] rounded-xl border-border/50 bg-card font-semibold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 p-1 shadow-xl">
                            <SelectItem value="all" className="rounded-lg py-2 font-semibold text-xs">All Types</SelectItem>
                            <SelectItem value="true" className="rounded-lg py-2 font-semibold text-xs text-[#10b981]">Multi-Branch</SelectItem>
                            <SelectItem value="false" className="rounded-lg py-2 font-semibold text-xs">Single Branch</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={String(table.getColumn("is_active")?.getFilterValue() ?? "all")}
                        onValueChange={(value) => table.getColumn("is_active")?.setFilterValue(value === "all" ? undefined : value === "true")}
                    >
                        <SelectTrigger className="h-10 w-[160px] rounded-xl border-border/50 bg-card font-semibold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 p-1 shadow-xl">
                            <SelectItem value="all" className="rounded-lg py-2 font-semibold text-xs">All Status</SelectItem>
                            <SelectItem value="true" className="rounded-lg py-2 font-semibold text-xs text-[#10b981]">Active Only</SelectItem>
                            <SelectItem value="false" className="rounded-lg py-2 font-semibold text-xs text-red-500">Inactive Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
      )}
    />
  );
}
