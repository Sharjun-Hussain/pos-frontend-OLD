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
import OrganizationPageSkeleton from "@/app/skeletons/Organization-skeleton";
import { ResourceManagementLayout } from "../general/resource-management-layout";
import { getOrganizationColumns } from "./organization-column";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Organizations
              </p>
              <p className="text-2xl font-bold">
                {organizationStats?.totalOrganizations}
              </p>
            </div>
            <Building className="h-8 w-8 text-blue-500" />
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
      headerTitle="Organization Management"
      headerDescription="Manage your organizations, branches, and settings."
      addButtonLabel="Add Organization"
      onAddClick={canCreate(ORG) ? handleAddClick : null}
      isAdding={isNavigating}
      onExportClick={() => console.log("Export clicked")}
      // statCardsComponent={statCards}
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
      searchPlaceholder="Filter organizations by name..."
      loadingSkeleton={<OrganizationPageSkeleton />}
      filterComponents={(table) => <OrganizationFilters table={table} />}
    />
  );
}
