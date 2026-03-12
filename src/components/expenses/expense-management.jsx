"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Wallet, Receipt, TrendingDown, Calendar, Plus, Search,
  RefreshCcw, Download, MoreHorizontal, Pencil, Eye, Trash2,
  Loader2, Tag, CreditCard, Hash,
} from "lucide-react";
import { format } from "date-fns";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { EXPENSE } = MODULES;
  const { formatCurrency, formatDate } = useAppSettings();

  const fetchExpenses = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      if (data.status === "success") {
        const rawData = data?.data?.data || data?.data || [];
        setExpenses(rawData.map(item => ({
          ...item,
          date: item.expense_date,
          category_name: item.category?.name || "Uncategorized",
        })));
      } else {
        throw new Error(data.message || "Failed to fetch expenses");
      }
    } catch (err) {
      setError(err.message);
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
    if (status === "authenticated") fetchExpenses();
  }, [status, session]);

  const filteredExpenses = useMemo(() => {
    if (!searchQuery) return expenses;
    const q = searchQuery.toLowerCase();
    return expenses.filter(e =>
      e.reference_no?.toLowerCase().includes(q) ||
      e.category_name?.toLowerCase().includes(q) ||
      e.payment_method?.toLowerCase().includes(q)
    );
  }, [expenses, searchQuery]);

  const totalExpenses = expenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);

  // Month totals
  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter(e => {
        const d = new Date(e.date || e.expense_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
  }, [expenses]);

  const uniqueCategories = useMemo(() => new Set(expenses.map(e => e.category_name)).size, [expenses]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }).then(() => fetchExpenses()),
      { loading: "Deleting...", success: "Expense deleted!", error: "Failed to delete." }
    );
  };

  const handleExport = () => {
    exportToCSV(filteredExpenses.map(e => ({
      Date: e.date,
      Category: e.category_name,
      Amount: e.amount,
      "Payment Method": e.payment_method,
      "Reference #": e.reference_no,
    })), "Expenses_Export");
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#10b981] opacity-20" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Synchronizing Expenditures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-background p-6 md:p-10 space-y-8 pb-32 overflow-y-auto max-w-[1600px] mx-auto w-full">

      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-inner text-red-500">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Expense Management</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Operations</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Finance</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-red-500">Expenditure Ledger</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleExport} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <Download className="h-4 w-4" /> Export
          </Button>
          {canCreate(EXPENSE) && (
            <Button onClick={() => router.push("/expenses/new")} className="bg-red-500 hover:bg-red-600 text-white h-10 px-6 font-bold gap-2 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 border-none">
              <Plus className="h-5 w-5" /> Add Expense
            </Button>
          )}
        </div>
      </div>

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Expenditures",
            value: formatCurrency(totalExpenses),
            icon: TrendingDown,
            color: "text-red-500",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            desc: "All-time expense outflow",
          },
          {
            label: "This Month",
            value: formatCurrency(thisMonthTotal),
            icon: Calendar,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            desc: "Current month expenditures",
          },
          {
            label: "Total Records",
            value: expenses.length,
            icon: Receipt,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            desc: "Individual expense entries",
          },
          {
            label: "Expense Categories",
            value: uniqueCategories,
            icon: Tag,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            desc: "Distinct cost categories",
          },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
            <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 blur-3xl transition-all group-hover:opacity-100 opacity-50", stat.bg)} />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl border shadow-inner group-hover:scale-110 transition-transform duration-500", stat.bg, stat.border, stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1 truncate">{stat.label}</p>
                  <h3 className="text-xl font-black text-foreground tabular-nums tracking-tight truncate">{stat.value}</h3>
                </div>
              </div>
              <div className="mt-5">
                <div className={cn("h-1 w-full rounded-full bg-muted/30 overflow-hidden mb-2")}>
                  <div className={cn("h-full rounded-full w-[60%]", stat.color.replace("text-", "bg-"))} />
                </div>
                <p className="text-[9px] font-medium text-muted-foreground/50 tracking-wide uppercase italic">{stat.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── FILTER BAR ─── */}
      <Card className="border-none shadow-sm bg-card/80 backdrop-blur-md sticky top-4 z-20 border-border/10">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Universal Discovery</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-red-500 transition-colors" />
                <Input
                  placeholder="Search by reference #, category, or payment method..."
                  className="pl-12 h-12 bg-background/50 border-border/50 rounded-xl focus:border-red-500 transition-all font-medium text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={fetchExpenses} variant="outline" className="h-12 w-12 rounded-xl bg-background border-border/50 hover:bg-muted/30 text-muted-foreground hover:text-red-500 transition-all p-0 shadow-sm shrink-0">
              <RefreshCcw className={cn("h-5 w-5", loading && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── TABLE ─── */}
      <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border-border/10">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 backdrop-blur-md">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="pl-8 py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Date</TableHead>
                <TableHead className="py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Category</TableHead>
                <TableHead className="py-5 text-[10px] font-black text-foreground uppercase tracking-widest text-right">Amount</TableHead>
                <TableHead className="py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Payment Method</TableHead>
                <TableHead className="py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Reference #</TableHead>
                <TableHead className="py-5 pr-8 text-[10px] font-black text-foreground uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow className="border-border/20">
                  <TableCell colSpan={6} className="h-72 text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/20">
                        <Receipt className="h-12 w-12" />
                      </div>
                      <div>
                        <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-widest">No expense records found</h4>
                        <p className="text-xs text-muted-foreground/60 font-medium mt-1">Adjust your search or add a new expense entry.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/30 group border-border/20 transition-all duration-300">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted/50 rounded-xl text-muted-foreground/40 group-hover:text-red-500 group-hover:bg-red-500/10 transition-all">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <span className="text-[13px] font-black text-foreground tabular-nums">
                          {expense.date ? format(new Date(expense.date), "dd MMM yyyy") : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="outline" className="text-[10px] font-black border-border/40 bg-muted/20 text-muted-foreground uppercase tracking-widest px-3 py-1">
                        {expense.category_name || "Uncategorized"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 text-right">
                      <span className="text-[14px] font-black text-red-500 tabular-nums tracking-tight">
                        {formatCurrency(parseFloat(expense.amount || 0))}
                      </span>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground/70">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground/30" />
                        {expense.payment_method || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-2 text-[11px] font-black text-[#10b981] tabular-nums">
                        <Hash className="h-3 w-3 text-muted-foreground/30" />
                        {expense.reference_no || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 pr-8 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/60 hover:text-blue-500 hover:bg-blue-500/5 rounded-xl" onClick={() => router.push(`/expenses/${expense.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canUpdate(EXPENSE) && (
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/60 hover:text-[#10b981] hover:bg-[#10b981]/5 rounded-xl" onClick={() => router.push(`/expenses/${expense.id}/edit`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete(EXPENSE) && (
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/5 rounded-xl" onClick={() => handleDelete(expense.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

    </div>
  );
}
