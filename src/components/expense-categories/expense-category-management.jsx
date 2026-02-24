"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getExpenseCategoryColumns } from "./expense-category-column";
import OrganizationPageSkeleton from "@/app/skeletons/Organization-skeleton";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";

export default function ExpenseCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { EXPENSE } = MODULES;

  const fetchCategories = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      if (data.status === "success") {
        setCategories(data?.data?.data || data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch categories");
      }
    } catch (err) {
      setError(err.message);
      // Fallback to mock data if API fails
      setCategories([
        { id: 1, name: "Utilities", description: "Electricity, Water, Internet", is_active: true },
        { id: 2, name: "Rent", description: "Office and warehouse rent", is_active: true },
        { id: 3, name: "Salaries", description: "Employee monthly salaries", is_active: true },
        { id: 4, name: "Marketing", description: "Ads and promotions", is_active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCategories();
    }
  }, [status, session]);

  const handleAddClick = () => {
    router.push("/expense-categories/new");
  };

  const handleEditClick = (category) => {
    router.push(`/expense-categories/${category.id}/edit`);
  };

  const handleDelete = async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchCategories();
          return "Category deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  };

  const columns = getExpenseCategoryColumns({
    onEdit: canUpdate(EXPENSE) ? handleEditClick : null,
    onDelete: canDelete(EXPENSE) ? handleDelete : null,
  });

  return (
    <ResourceManagementLayout
      data={categories}
      columns={columns}
      isLoading={loading || status === "loading"}
      isError={!!error && categories.length === 0}
      errorMessage={error}
      onRetry={fetchCategories}
      headerTitle="Expense Categories"
      headerDescription="Manage categories to organize your business expenses."
      addButtonLabel="Add Category"
      onAddClick={canCreate(EXPENSE) ? handleAddClick : null}
      searchColumn="name"
      searchPlaceholder="Filter categories by name..."
      loadingSkeleton={<OrganizationPageSkeleton />}
    />
  );
}
