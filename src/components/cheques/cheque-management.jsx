"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getChequeColumns } from "./cheque-column";
import ChequePageSkeleton from "@/app/skeletons/cheques/cheque-page-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Landmark, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, History, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
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
  const { hasPermission } = usePermission();
  const canManage = hasPermission(PERMISSIONS.FINANCE_MANAGE);

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
    onUpdateStatus: canManage ? handleUpdateStatus : null,
    onDelete: canManage ? handleDelete : null,
    onView: handleViewClick,
  });

  const receivable = cheques.filter(c => c.type === "receivable").reduce((acc, c) => acc + parseFloat(c.amount), 0);
  const payable = cheques.filter(c => c.type === "payable").reduce((acc, c) => acc + parseFloat(c.amount), 0);
  const pendingCount = cheques.filter(c => c.status === "pending").length;

  const statCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="relative overflow-hidden border border-emerald-500/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl shadow-emerald-500/5 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors duration-700" />
        <CardContent className="p-8">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-[0.15em]">Receivable Assets</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                LKR {receivable.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600/60 tracking-widest">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Inflow
              </div>
            </div>
            <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <ArrowDownLeft className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border border-red-500/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl shadow-red-500/5 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-500/10 transition-colors duration-700" />
        <CardContent className="p-8">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-red-600 dark:text-red-400 tracking-[0.15em]">Payable Liabilities</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                LKR {payable.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-red-600/60 tracking-widest">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Scheduled Outflow
              </div>
            </div>
            <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <ArrowUpRight className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border border-amber-500/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl shadow-amber-500/5 group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors duration-700" />
        <CardContent className="p-8">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 tracking-[0.15em]">Pending Verification</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {pendingCount} <span className="text-sm font-bold text-muted-foreground tracking-widest ml-1">Instruments</span>
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600/60 tracking-widest">
                <History className="h-3 w-3" />
                Awaiting Clearance
              </div>
            </div>
            <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const headerTitle = (
    <div className="flex items-center gap-6">
      <div className="relative group">
        <div className="absolute -inset-2 bg-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700" />
        <div className="relative p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/10 shadow-2xl transition-all group-hover:border-emerald-500/30 group-hover:rotate-3">
          <Landmark className="w-6 h-6 text-emerald-600" />
        </div>
      </div>
      <div className="flex flex-col">
        <h1 className="text-3xl font-black text-foreground tracking-tight leading-none mb-1.5 flex items-center gap-3">
          Cheque <span className="text-emerald-600">Workspace</span>
          <Badge variant="outline" className="h-6 border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-3 py-0.5 rounded-md tracking-widest hidden sm:flex">
            Financial v2.0
          </Badge>
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-emerald-600 tracking-[0.15em] bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">
            Secure Asset Ledger
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
          <p className="text-[10px] text-muted-foreground font-black tracking-[0.15em] opacity-60">
            Cross-institutional instrument tracking
          </p>
        </div>
      </div>
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
        headerTitle={headerTitle}
        addButtonLabel="Secure Instrument"
        onAddClick={canManage ? () => router.push("/cheques/new") : null}
        searchColumn="cheque_number"
        searchPlaceholder="Search by cheque #..."
        loadingSkeleton={<ChequePageSkeleton />}
        statCardsComponent={statCards}
      />

      {/* Clear Cheque Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="sm:max-w-md border-emerald-500/20 backdrop-blur-3xl bg-white/95 dark:bg-slate-950/95 shadow-2xl p-0 overflow-hidden rounded-3xl">
          <div className="relative shrink-0 overflow-hidden bg-emerald-600 p-8 pt-10">
            <div className="absolute inset-0 bg-white/10 opacity-20"
                 style={{backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '15px 15px'}} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />

            <div className="relative z-10 flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 shadow-inner">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl font-black text-white tracking-tight leading-none mb-1.5">
                  Instrument Clearance
                </DialogTitle>
                <DialogDescription>
                  <p className="text-slate-500 dark:text-slate-400 font-bold tracking-[0.15em] text-[10px] flex items-center gap-2">
                    Serial: <span className="text-white bg-white/10 px-2 py-0.5 rounded-md font-bold">{selectedCheque?.cheque_number}</span>
                  </p>
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-black tracking-widest text-muted-foreground ml-1">Destination Gateway</Label>
              <Select onValueChange={setSelectedAccount} value={selectedAccount}>
                <SelectTrigger className="h-14 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 focus:border-emerald-500/40 focus:ring-emerald-500/5 transition-all px-5 font-bold text-sm">
                  <SelectValue placeholder="Select high-liquidity account..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-emerald-500/20">
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="rounded-xl focus:bg-emerald-500 focus:text-white transition-colors py-3">
                      <div className="flex flex-col">
                        <span className="font-black text-[10px] tracking-widest">{acc.name}</span>
                        <span className="text-[9px] opacity-70 font-bold">{acc.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-6 bg-slate-900 dark:bg-slate-800 rounded-3xl text-white shadow-xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
              <div className="relative z-10 grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[8px] font-black tracking-[0.15em] text-emerald-400">Origin Bank</p>
                  <p className="text-sm font-black truncate">{selectedCheque?.bank_name}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-black tracking-[0.15em] text-emerald-400">Clearance Value</p>
                  <p className="text-sm font-black text-emerald-400">LKR {parseFloat(selectedCheque?.amount || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 pt-0 flex flex-col gap-3">
            <Button 
                onClick={handleClearCheque} 
                disabled={isUpdating}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs tracking-[0.15em] shadow-xl shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                {isUpdating ? "Executing Protocol..." : "Finalize Clearance"}
              </div>
            </Button>
            <Button 
                variant="ghost" 
                onClick={() => setIsClearDialogOpen(false)}
                className="w-full h-11 rounded-xl text-[10px] font-black tracking-widest text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all"
            >
              Abort Operation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
