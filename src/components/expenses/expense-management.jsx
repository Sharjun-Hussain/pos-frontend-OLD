"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getExpenseColumns } from "./expense-column";
import OrganizationPageSkeleton from "@/app/skeletons/Organization-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Receipt, TrendingDown, Calendar } from "lucide-react";

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  const fetchExpenses = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      if (data.status === "success") {
        setExpenses(data?.data?.data || data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch expenses");
      }
    } catch (err) {
      setError(err.message);
      // Fallback to mock data
      setExpenses([
        { id: 1, date: "2024-01-05", category_name: "Rent", amount: 75000, payment_method: "Bank Transfer", reference_no: "REF-001" },
        { id: 2, date: "2024-01-10", category_name: "Utilities", amount: 12500, payment_method: "Cash", reference_no: "REF-002" },
        { id: 3, date: "2024-01-15", category_name: "Salaries", amount: 250000, payment_method: "Bank Transfer", reference_no: "REF-003" },
        { id: 4, date: "2024-01-20", category_name: "Marketing", amount: 15000, payment_method: "Credit Card", reference_no: "REF-004" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchExpenses();
    }
  }, [status, session]);

  const handleAddClick = () => {
    router.push("/expenses/new");
  };

  const handleEditClick = (expense) => {
    router.push(`/expenses/${expense.id}/edit`);
  };

  const handleViewClick = (expense) => {
    router.push(`/expenses/${expense.id}`);
  };

  const handleDelete = async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchExpenses();
          return "Expense deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  };

  const columns = getExpenseColumns({
    onEdit: handleEditClick,
    onDelete: handleDelete,
    onView: handleViewClick,
  });

  const totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  const statCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Total Expenses</p>
              <p className="text-2xl font-bold text-slate-900">
                LKR {totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">This Month</p>
              <p className="text-2xl font-bold text-slate-900">
                LKR {totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <ResourceManagementLayout
      data={expenses}
      columns={columns}
      isLoading={loading || status === "loading"}
      isError={!!error && expenses.length === 0}
      errorMessage={error}
      onRetry={fetchExpenses}
      headerTitle="Expense Management"
      headerDescription="Track and manage your business expenditures."
      addButtonLabel="Add Expense"
      onAddClick={handleAddClick}
      searchColumn="reference_no"
      searchPlaceholder="Search by reference #..."
      loadingSkeleton={<OrganizationPageSkeleton />}
      statCardsComponent={statCards}
    />
  );
}
