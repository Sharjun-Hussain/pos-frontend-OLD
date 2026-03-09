"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format, subDays } from "date-fns";
import {
  Printer,
  Download,
  Search,
  Calendar as CalendarIcon,
  RotateCcw,
  Eye,
  FileText,
  ChevronRight,
  TrendingUp,
  Box,
  Users,
  CreditCard,
  RefreshCcw,
  Clock,
  ArrowUpRight,
  X,
  Hash,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function SalesReturnHistoryPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDate } = useAppSettings();
  const [date, setDate] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Create query string helper
  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  // Check URL for returnId on mount or update
  useEffect(() => {
    const returnId = searchParams.get("returnId");
    if (returnId) {
        // If we have data, try to find it
        const item = data.find((s) => s.id == returnId);
        if (item) {
            setSelectedReturn(item);
            setIsDetailOpen(true);
        } else {
             // If not in current list (maybe outside date range), fetch it specifically
             fetchSingleReturn(returnId);
        }
    } else {
        setIsDetailOpen(false);
    }
  }, [searchParams, data]);

  const fetchSingleReturn = async (id) => {
      if (!session?.accessToken) return;
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/returns/${id}`, {
              headers: { Authorization: `Bearer ${session.accessToken}` }
          });
          const result = await res.json();
          if (result.status === "success" && result.data) {
              setSelectedReturn(result.data);
              setIsDetailOpen(true);
          }
      } catch (error) {
          console.error("Failed to fetch specific return:", error);
      }
  };

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/returns?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success" && result.data) {
        setData(result.data.data || result.data); // Fallback for backward compatibility
      } else {
        toast.error(result.message || "Failed to fetch return data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, date]);

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.return_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sale?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalReturnVal = filteredData.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
    const totalRefunded = filteredData.reduce((sum, item) => sum + parseFloat(item.refund_amount || 0), 0);
    const uniqueCustomers = new Set(filteredData.map(s => s.customer_id)).size;
    
    return [
      { 
        label: "Total Returns", 
        value: filteredData.length, 
        icon: RotateCcw, 
        gradient: "from-orange-500 to-red-400",
        shadow: "shadow-orange-100",
        trend: "up",
        change: "+2%" 
      },
      { 
        label: "Return Value", 
        value: `LKR ${totalReturnVal.toLocaleString()}`, 
        icon: TrendingUp, 
        gradient: "from-blue-500 to-cyan-400",
        shadow: "shadow-blue-100",
        trend: "down",
        change: "-5%" 
      },
      { 
        label: "Refunded Amount", 
        value: `LKR ${totalRefunded.toLocaleString()}`, 
        icon: ArrowUpRight, 
        gradient: "from-emerald-500 to-teal-400",
        shadow: "shadow-emerald-100",
        trend: "stable",
        change: "0%" 
      },
      { 
        label: "Affected Customers", 
        value: uniqueCustomers, 
        icon: Users, 
        gradient: "from-purple-500 to-violet-400",
        shadow: "shadow-purple-100",
        trend: "up",
        change: "+1" 
      },
    ];
  }, [filteredData]);

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      "Return #": item.return_number,
      Date: item.return_date,
      "Invoice #": item.sale?.invoice_number || "N/A",
      Customer: item.customer?.name || "Walk-in",
      "Return Value": item.total_amount,
      "Refund Amount": item.refund_amount,
      Status: item.status,
    }));
    exportToCSV(exportData, "Sales_Return_Report");
  };

  const handleViewDetails = (item) => {
    // Update URL to include returnId, prevent scroll reset
    router.push(pathname + "?" + createQueryString("returnId", item.id), { scroll: false });
  };

  const handleCloseDetails = (open) => {
      if (!open) {
          router.push(pathname, { scroll: false });
      }
      setIsDetailOpen(open);
  };

  return (
    <div className="flex-1 min-h-screen bg-muted/20 p-8 space-y-8 pb-20">
      {/* --- Header Actions --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Sales Returns</h1>
          <p className="text-sm text-muted-foreground font-medium">Monitor and audit customer return activities</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="bg-card hover:bg-muted/30 border-border/50 h-11 px-5 font-bold gap-2 rounded-xl transition-all shadow-sm">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6 font-bold gap-2 rounded-xl transition-all shadow-lg active:scale-95">
            <Printer className="h-4 w-4" /> Print View
          </Button>
        </div>
      </div>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="group relative bg-card rounded-2xl p-6 border border-border/30 shadow-sm hover:shadow-xl hover:shadow-foreground/5 hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden">
            {/* Subtle Background Decoration */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${stat.gradient} opacity-[0.03] rounded-bl-full group-hover:scale-150 transition-transform duration-500`} />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-xl bg-linear-to-br ${stat.gradient} text-white shadow-lg ${stat.shadow}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>

            <div className="relative z-10">
              <p className="text-sm font-semibold text-muted-foreground mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-foreground tracking-tight">
                {stat.value}
              </h3>
              
              <div className="flex items-center mt-3">
                <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-background text-muted-foreground`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground/60 ml-2">vs last period</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Search & Filter Bar --- */}
      <Card className="border-none shadow-sm bg-card/80 backdrop-blur-sm sticky top-4 z-20">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Transaction Audit</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                  placeholder="Search by Return #, Invoice #, or Customer..." 
                  className="pl-11 h-12 bg-muted/20 border-border/30 rounded-xl focus:bg-card transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full lg:w-72 space-y-2">
              <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Return Timeline</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-bold h-12 border-border/30 bg-muted/20 rounded-xl px-4",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground/60" />
                    {date?.from ? (
                      date.to ? (
                        <span className="text-foreground">{format(date.from, "MMM dd")} - {format(date.to, "MMM dd, y")}</span>
                      ) : (
                        format(date.from, "MMM dd, y")
                      )
                    ) : (
                      <span>Select period</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    className="rounded-xl border-none"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={fetchData} variant="secondary" className="h-12 w-12 rounded-xl bg-background hover:bg-muted text-muted-foreground transition-all p-0 shadow-sm">
              <RefreshCcw className={cn("h-5 w-5", loading && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Data Table --- */}
      <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/20 border-b border-border/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest w-40">Return #</TableHead>
                <TableHead className="py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</TableHead>
                <TableHead className="py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Invoice Ref</TableHead>
                <TableHead className="py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Customer</TableHead>
                <TableHead className="text-right py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Value</TableHead>
                <TableHead className="text-right py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Refunded</TableHead>
                <TableHead className="text-center py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Audit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={8} className="h-16 bg-muted/10"></TableCell>
                  </TableRow>
                ))
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 group border-b border-border/30 transition-colors">
                    <TableCell className="pl-8 py-4">
                      <span className="font-mono text-[13px] font-black text-orange-600 tracking-tighter uppercase">
                        {item.return_number}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-[12px] font-medium">
                          {format(new Date(item.return_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-bold text-muted-foreground text-[12px] hover:text-emerald-500 cursor-pointer transition-colors">
                        {item.sale?.invoice_number || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                          {(item.customer?.name || "W").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground text-[13px]">
                          {item.customer?.name || "Walk-in Customer"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4 font-bold text-muted-foreground">
                      {formatCurrency(item.total_amount)}
                    </TableCell>
                    <TableCell className="text-right py-4 font-black text-emerald-600">
                      {formatCurrency(item.refund_amount)}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge className="text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm bg-emerald-500 hover:bg-emerald-600">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8 py-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 px-4 gap-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg font-bold transition-all"
                        onClick={() => handleViewDetails(item)}
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                      <RotateCcw className="h-12 w-12 text-muted-foreground/40" />
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No matching return records found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* --- Detail Sheet --- */}
      <Sheet open={isDetailOpen} onOpenChange={handleCloseDetails}>
        <SheetContent className="sm:max-w-[600px] flex flex-col h-full p-0 overflow-hidden border-l border-border/50">
          <SheetHeader className="relative p-8 bg-emerald-600 text-white shrink-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-emerald-500 rounded-md">
                    <RotateCcw className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[10px] font-black tracking-[0.2em] text-emerald-100 uppercase">Return Voucher</span>
                </div>
                <SheetTitle className="text-3xl font-black text-white tracking-tight">
                  {selectedReturn?.return_number}
                </SheetTitle>
                <SheetDescription className="text-emerald-100 font-medium tracking-wide">
                  Return initiated on {selectedReturn && formatDate(selectedReturn.return_date)}
                </SheetDescription>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <Badge className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-lg">
                  {selectedReturn?.status}
                </Badge>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-1">Refund Value</p>
                  <p className="text-2xl font-black text-white tracking-tighter">
                    {selectedReturn && formatCurrency(selectedReturn.refund_amount)}
                  </p>
                </div>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 bg-card min-h-0">
            <div className="p-8 space-y-10">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <User className="h-3.5 w-3.5 text-muted-foreground/60" />
                      <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Client Info</h4>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-foreground">{selectedReturn?.customer?.name || "Walk-in Customer"}</p>
                    <p className="text-sm text-muted-foreground">{selectedReturn?.customer?.phone || "No contact info"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground/60" />
                      <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Original Reference</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-foreground">{selectedReturn?.sale?.invoice_number || 'N/A'}</p>
                    <Badge variant="secondary" className="bg-background text-foreground font-bold uppercase text-[9px]">
                        METHOD: {selectedReturn?.refund_method || 'CASH'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Returned Items</h4>
                    <Badge variant="outline" className="text-[9px] font-bold py-0">{selectedReturn?.items?.length || 0} ITEMS</Badge>
                </div>
                
                <div className="rounded-xl border border-border/30 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow className="hover:bg-transparent border-border/30">
                        <TableHead className="h-10 text-[10px] font-bold text-muted-foreground uppercase px-4">Description</TableHead>
                        <TableHead className="h-10 text-[10px] font-bold text-muted-foreground uppercase text-center w-20">Qty</TableHead>
                        <TableHead className="h-10 text-[10px] font-bold text-muted-foreground uppercase text-right w-24">Unit</TableHead>
                        <TableHead className="h-10 text-[10px] font-bold text-muted-foreground uppercase text-right w-28 px-4">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReturn?.items?.map((item, idx) => (
                        <TableRow key={idx} className="border-border/30 group hover:bg-muted/20 transition-colors">
                          <TableCell className="py-4 px-4">
                            <span className="text-[13px] font-bold text-foreground leading-tight">
                              {item.product?.name}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[11px] font-bold">
                              {parseFloat(item.quantity).toFixed(0)}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-right text-[12px] text-muted-foreground font-medium">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="py-4 text-right px-4">
                            <span className="text-[13px] font-bold text-foreground">
                              {formatCurrency(item.total_amount)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedReturn?.notes && (
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Audit Notes</h4>
                  <p className="text-sm text-amber-700 font-medium leading-relaxed italic">
                    "{selectedReturn.notes}"
                  </p>
                </div>
              )}

              <div className="bg-muted/30/80 rounded-2xl p-6 space-y-4 border border-border/30">
                <div className="flex justify-between items-center py-2">
                  <div>
                    <h3 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-1">Return Value</h3>
                    <span className="text-xl font-black text-foreground tracking-tighter">{selectedReturn && formatCurrency(selectedReturn.total_amount)}</span>
                  </div>
                  <div className="text-right">
                    <h3 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-1">Total Refunded</h3>
                    <Badge className="bg-orange-50 text-orange-600 border-orange-100 text-sm font-black px-4 py-1">
                      {selectedReturn && formatCurrency(selectedReturn.refund_amount)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-6 bg-card border-t border-border/30 flex gap-4 shrink-0">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-bold gap-2 shadow-lg"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              PRINT RETURN RECEIPT
            </Button>
            <Button
              variant="outline"
              className="h-12 w-12 rounded-xl border-border/50 hover:bg-muted/30 hover:text-red-500"
              onClick={() => handleCloseDetails(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
