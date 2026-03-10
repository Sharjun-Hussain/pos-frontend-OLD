"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getChequeColumns } from "./cheque-column";
import ChequePageSkeleton from "@/app/skeletons/cheques/cheque-page-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Landmark, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, History, Loader2, Zap, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChequeDetailsSheet } from "./ChequeDetailsSheet";

export default function ChequeManagement() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isBounceDialogOpen, setIsBounceDialogOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [viewingCheque, setViewingCheque] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
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

    if (newStatus === "bounced") {
      setSelectedCheque(cheque);
      setIsBounceDialogOpen(true);
      return;
    }
  };

  const handleBounceCheque = async () => {
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
          body: JSON.stringify({ status: "bounced" }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed");

      toast.success("Cheque marked as bounced");
      setIsBounceDialogOpen(false);
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
    setViewingCheque(cheque);
    setIsViewSheetOpen(true);
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cheques to Receive</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-foreground">
                LKR {receivable.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <ArrowDownLeft className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cheques to Pay</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-foreground">
                LKR {payable.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Awaiting Clearance</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-foreground">
                {pendingCount}
              </p>
            </div>
            <div className="h-12 w-12 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const headerTitle = (
    <div className="flex items-center gap-4">
      <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
        <Landmark className="h-6 w-6" />
      </div>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground tracking-tight">
          Cheque Management
        </h1>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wider mt-0.5">
          TRACK & MANAGE CHEQUES
        </p>
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
        addButtonLabel="Add Cheque"
        onAddClick={canManage ? () => router.push("/cheques/new") : null}
        searchColumn="cheque_number"
        searchPlaceholder="Search by cheque #..."
        loadingSkeleton={<ChequePageSkeleton />}
        statCardsComponent={statCards}
      />

      {/* Clear Cheque Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="max-w-[360px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
          <div className="p-6 bg-emerald-600 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 -mr-12 -mt-12 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-0.5">
                  <DialogTitle className="text-xl font-bold text-white">Clear Cheque</DialogTitle>
                  <DialogDescription className="text-emerald-50/80 font-medium text-[10px] uppercase tracking-widest italic">Mark as settled</DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4 px-2">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Cheque #</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{selectedCheque?.cheque_number}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Amount</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500">LKR {parseFloat(selectedCheque?.amount || 0).toLocaleString()}</p>
                </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Deposit Account</Label>
              <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isComboboxOpen}
                    className="w-full h-11 justify-between bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-slate-700 dark:text-slate-200 text-xs px-4"
                  >
                    {selectedAccount
                      ? accounts.find((acc) => acc.id === selectedAccount)?.name
                      : "Search account..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0 rounded-xl border-slate-100 dark:border-slate-800 shadow-2xl">
                  <Command className="rounded-xl bg-white dark:bg-slate-900">
                    <CommandInput placeholder="Type account name..." className="h-9 text-xs font-bold" />
                    <CommandList className="max-h-[200px] thin-scrollbar">
                      <CommandEmpty className="py-4 text-center text-xs font-bold text-slate-400 dark:text-slate-500 italic">No account found.</CommandEmpty>
                      <CommandGroup>
                        {accounts.map((acc) => (
                          <CommandItem
                            key={acc.id}
                            value={acc.name}
                            onSelect={() => {
                              setSelectedAccount(acc.id);
                              setIsComboboxOpen(false);
                            }}
                            className="rounded-lg py-2.5 font-bold text-xs uppercase tracking-wider cursor-pointer aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-500/10 aria-selected:text-emerald-600 dark:aria-selected:text-emerald-500"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedAccount === acc.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {acc.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button 
                  onClick={handleClearCheque} 
                  disabled={isUpdating}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] tracking-widest shadow-lg shadow-emerald-600/10 transition-all uppercase"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Clearance"}
              </Button>
              <Button 
                  variant="ghost" 
                  onClick={() => setIsClearDialogOpen(false)}
                  className="w-full h-10 rounded-lg text-[10px] font-bold tracking-widest text-muted-foreground hover:text-red-500 transition-all uppercase"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bounce Cheque Dialog */}
      <Dialog open={isBounceDialogOpen} onOpenChange={setIsBounceDialogOpen}>
        <DialogContent className="max-w-[340px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
          <div className="p-6 bg-red-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 -mr-12 -mt-12 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-lg">
                  <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-0.5">
                  <DialogTitle className="text-xl font-bold text-white">Cheque Bounced</DialogTitle>
                  <DialogDescription className="text-red-50/80 font-medium text-[10px] uppercase tracking-widest italic">Mark as unpaid</DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex flex-col items-center text-center gap-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed px-4">
                  Are you sure you want to mark cheque <span className="font-bold text-slate-700 dark:text-slate-200">#{selectedCheque?.cheque_number}</span> as bounced?
                </p>
                <p className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">This action cannot be undone.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                  onClick={handleBounceCheque} 
                  disabled={isUpdating}
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-[11px] tracking-widest shadow-lg shadow-red-500/10 transition-all uppercase"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Bounce"}
              </Button>
              <Button 
                  variant="ghost" 
                  onClick={() => setIsBounceDialogOpen(false)}
                  className="w-full h-10 rounded-lg text-[10px] font-bold tracking-widest text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-all uppercase"
              >
                Go Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ChequeDetailsSheet 
        open={isViewSheetOpen} 
        onOpenChange={setIsViewSheetOpen} 
        cheque={viewingCheque} 
      />
    </>
  );
}
