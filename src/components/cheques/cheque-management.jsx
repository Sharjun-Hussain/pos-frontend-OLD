"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getChequeColumns } from "./cheque-column";
import OrganizationPageSkeleton from "@/app/skeletons/Organization-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Landmark, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ChequeManagement() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();

  const fetchCheques = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/cheques`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch cheques");
      const data = await response.json();
      if (data.status === "success") {
        setCheques(data?.data?.data || data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch cheques");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    if (!session?.accessToken) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        setAccounts(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch accounts", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCheques();
      fetchAccounts();
    }
  }, [status, session]);

  const handleUpdateStatus = async (cheque, newStatus) => {
    if (newStatus === "cleared") {
      setSelectedCheque(cheque);
      setIsClearDialogOpen(true);
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/cheques/${cheque.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed");

      toast.success(`Cheque marked as ${newStatus}`);
      fetchCheques();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCheque = async () => {
    if (!selectedAccount) {
      toast.error("Please select an account for clearing");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/cheques/${selectedCheque.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            status: "cleared",
            account_id: selectedAccount,
            cleared_date: new Date()
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed");

      toast.success("Cheque cleared successfully");
      setIsClearDialogOpen(false);
      setSelectedAccount("");
      fetchCheques();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewClick = (cheque) => {
    // Implement view details if needed, or just toast for now
    toast.info(`Cheque Details: ${cheque.cheque_number} from ${cheque.bank_name}`);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/cheques/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to delete cheque");
      toast.success("Cheque deleted successfully");
      fetchCheques();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = getChequeColumns({
    onUpdateStatus: handleUpdateStatus,
    onDelete: handleDelete,
    onView: handleViewClick,
  });

  const receivable = cheques.filter(c => c.type === "receivable").reduce((acc, c) => acc + parseFloat(c.amount), 0);
  const payable = cheques.filter(c => c.type === "payable").reduce((acc, c) => acc + parseFloat(c.amount), 0);
  const pendingCount = cheques.filter(c => c.status === "pending").length;

  const statCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Receivable Cheques</p>
              <p className="text-2xl font-bold text-green-600">
                LKR {receivable.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center">
              <ArrowDownLeft className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Payable Cheques</p>
              <p className="text-2xl font-bold text-red-600">
                LKR {payable.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Pending Cheques</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <ResourceManagementLayout
        data={cheques}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error && cheques.length === 0}
        errorMessage={error}
        onRetry={fetchCheques}
        headerTitle="Cheque Management"
        headerDescription="Track and manage your receivable and payable cheques."
        addButtonLabel="Record Cheque"
        onAddClick={() => router.push("/cheques/new")}
        searchColumn="cheque_number"
        searchPlaceholder="Search by cheque #..."
        loadingSkeleton={<OrganizationPageSkeleton />}
        statCardsComponent={statCards}
      />

      {/* Clear Cheque Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Clear Cheque</DialogTitle>
            <DialogDescription>
              Select the bank account where this cheque {selectedCheque?.type === "receivable" ? "will be deposited" : "will be paid from"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="account">Bank Account</Label>
              <Select onValueChange={setSelectedAccount} value={selectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Cheque Number:</span>
                <span className="font-medium">{selectedCheque?.cheque_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Bank:</span>
                <span className="font-medium">{selectedCheque?.bank_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-blue-600">LKR {parseFloat(selectedCheque?.amount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClearDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleClearCheque} disabled={isUpdating}>
              {isUpdating ? "Processing..." : "Confirm Clearing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
