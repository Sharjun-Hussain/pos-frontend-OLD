"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import {
  Printer,
  Download,
  FileText,
  History,
  AlertCircle,
  CheckCircle2,
  Landmark,
  RefreshCw,
  Search,
  Filter,
  CreditCard,
  Ban,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function ChequeSummaryPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDate } = useAppSettings();
  const [data, setData] = useState({
    details: [],
    summary: { total: 0, cleared: 0, pending: 0, bounced: 0 }
  });
  const [type, setType] = useState("receivable");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/cheques?type=${type}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to fetch cheque data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = data.details.map((item) => ({
      "Cheque #": item.cheque_number,
      Bank: item.bank_name,
      "Payee/Payor": item.payee_payor_name || "N/A",
      Date: formatDate(item.cheque_date),
      Amount: item.amount,
      Status: item.status,
      Branch: item.branch?.name,
    }));
    exportToCSV(exportData, `Cheque_${type}_Report`);
  };

  const handleExportExcel = () => {
    const exportData = data.details.map((item) => ({
      "Cheque #": item.cheque_number,
      Bank: item.bank_name,
      "Payee/Payor": item.payee_payor_name || "N/A",
      Date: formatDate(item.cheque_date),
      Amount: item.amount,
      Status: item.status,
      Branch: item.branch?.name,
    }));
    exportToExcel(exportData, `Cheque_${type}_Report`);
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, type]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'cleared':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold gap-1.5 shadow-none">
            <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-2.5 py-1 rounded-lg font-bold gap-1.5 shadow-none">
            <Clock className="w-3.5 h-3.5" /> Pending
          </Badge>
        );
      case 'bounced':
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 px-2.5 py-1 rounded-lg font-bold gap-1.5 shadow-none">
            <Ban className="w-3.5 h-3.5" /> Bounced
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="px-2.5 py-1 rounded-lg font-bold">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1400px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Cheque Summary</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Financial Hub</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Cheques</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button onClick={() => window.print()} className="bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 gap-2 hover:bg-[#0da371] h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-all active:scale-95">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button onClick={fetchData} className="h-10 w-10 rounded-xl bg-card border border-border/50 text-foreground hover:bg-muted/30 shadow-sm transition-all active:scale-95" variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex justify-center md:justify-start">
        <Tabs value={type} onValueChange={setType} className="w-full max-w-[440px]">
          <TabsList className="grid grid-cols-2 bg-muted/50 p-1.5 rounded-2xl border border-border/40 backdrop-blur-md h-12 shadow-inner">
            <TabsTrigger value="receivable" className="rounded-xl data-[state=active]:bg-[#10b981] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold text-xs uppercase tracking-wider">
               Customer Cheques
            </TabsTrigger>
            <TabsTrigger value="payable" className="rounded-xl data-[state=active]:bg-[#10b981] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold text-xs uppercase tracking-wider">
               Supplier Cheques
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* --- STATS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Value */}
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-blue-500/10" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <CreditCard className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="bg-blue-500/5 text-blue-500 border-blue-500/20 text-[10px] uppercase font-black tracking-widest px-2 py-0.5">Overall</Badge>
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">Total Portfolio</p>
                <h3 className="text-2xl font-black text-foreground tabular-nums tracking-tight">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(data.summary.total)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cleared */}
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-emerald-500/10" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px] uppercase font-black tracking-widest px-2 py-0.5">Verified</Badge>
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">Cleared Amount</p>
                <h3 className="text-2xl font-black text-emerald-600 tabular-nums tracking-tight">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(data.summary.cleared)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-amber-500/10" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Clock className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-500/20 text-[10px] uppercase font-black tracking-widest px-2 py-0.5">In Transit</Badge>
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">Pending Clearance</p>
                <h3 className="text-2xl font-black text-amber-600 tabular-nums tracking-tight">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(data.summary.pending)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bounced */}
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-500 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-red-500/10" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Ban className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="bg-red-500/5 text-red-500 border-red-500/20 text-[10px] uppercase font-black tracking-widest px-2 py-0.5">Action Req.</Badge>
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-70 mb-1">Bounced / Rejected</p>
                <h3 className="text-2xl font-black text-red-600 tabular-nums tracking-tight">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(data.summary.bounced)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- DATA TABLE --- */}
      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-[#10b981]" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">Transaction Log</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5">Detailed view of all registered cheques in the system</CardDescription>
              </div>
            </div>
            <div className="relative group max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-[#10b981] transition-colors" />
              <input 
                type="text" 
                placeholder="Search cheques..." 
                className="w-full bg-muted/30 border border-border/50 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
              />
            </div>
          </div>
        </CardHeader>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="pl-6 font-bold text-foreground py-4 text-[10px] uppercase tracking-widest">Cheque Details</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Payee / Payor</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Due Date</TableHead>
              <TableHead className="text-right font-bold text-foreground text-[10px] uppercase tracking-widest">Amount</TableHead>
              <TableHead className="text-center font-bold text-foreground text-[10px] uppercase tracking-widest">Status</TableHead>
              <TableHead className="text-right pr-6 font-bold text-foreground text-[10px] uppercase tracking-widest min-w-[120px]">Branch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20 mt-1" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-lg" /></TableCell>
                  <TableCell className="pr-6"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data.details.length > 0 ? (
              data.details.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border/40 group">
                  <TableCell className="pl-6 py-4">
                    <div className="font-bold text-sm text-[#10b981] mb-0.5 tabular-nums">#{item.cheque_number}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase flex items-center gap-1.5">
                       <Landmark className="w-2.5 h-2.5" /> {item.bank_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      {item.payee_payor_name || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-muted-foreground text-xs flex items-center gap-1.5 tabular-nums">
                      {formatDate(item.cheque_date)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-foreground tabular-nums tracking-tight">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="text-right pr-6 min-w-[120px]">
                    <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded shadow-none opacity-60 group-hover:opacity-100 transition-opacity">
                      {item.branch?.name}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-32 text-center py-20">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/20">
                      <History className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="font-bold text-muted-foreground">No Records Found</h4>
                      <p className="text-xs text-muted-foreground/60 font-medium">No {type} cheques were discovered for this period.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* --- FOOTER INFO --- */}
      <Card className="border-none shadow-sm bg-[#10b981]/5 overflow-hidden font-sans border-l-4 border-l-[#10b981]">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-[#10b981]/10 text-[#10b981] shrink-0 h-fit">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-[#10b981] text-xs mb-1.5 uppercase tracking-[0.2em]">Cheque Management Protocol</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-bold uppercase tracking-wide opacity-80">
                This report displays real-time status of bank cheques. Receivable cheques represent customer payments in transit, while Payable cheques represent obligations to suppliers. Bounced cheques require immediate reconciliation in the accounting ledger.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
