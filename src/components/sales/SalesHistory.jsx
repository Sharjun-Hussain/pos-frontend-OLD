"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect, useMemo } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  Receipt,
  Users,
  CreditCard,
  RefreshCcw,
  Clock,
  ArrowUpRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { exportToCSV } from "@/lib/exportUtils";
import SaleDetailSheet from "@/components/pos/SaleDetailSheet";

export default function SalesHistory() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [date, setDate] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Detail Sheet State
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchSales = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        status: 'completed'
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === 'success') {
        setData(result.data.data || result.data || []);
      } else {
        toast.error(result.message || "Failed to fetch sales");
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [session?.accessToken, date]);

  const filteredData = useMemo(() => {
    return data.filter(sale => 
      sale.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum, s) => sum + parseFloat(s.payable_amount || 0), 0);
    const avgTicket = filteredData.length > 0 ? totalRevenue / filteredData.length : 0;
    const uniqueCustomers = new Set(filteredData.map(s => s.customer_id)).size;
    
    return [
      { label: "Total Revenue", value: `LKR ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Transactions", value: filteredData.length, icon: Receipt, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Avg. Ticket", value: `LKR ${avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: ArrowUpRight, color: "text-purple-600", bg: "bg-purple-50" },
      { label: "Unique Customers", value: uniqueCustomers, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
    ];
  }, [filteredData]);

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 p-8 space-y-8 pb-20">
      {/* --- Header Actions --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500 font-medium">Audit and manage all historical sales records</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={() => exportToCSV(filteredData, "Sales_History")} variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 h-11 px-5 font-bold gap-2 rounded-xl transition-all shadow-sm">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => window.print()} className="bg-slate-900 hover:bg-black text-white h-11 px-6 font-bold gap-2 rounded-xl transition-all shadow-lg active:scale-95">
            <Printer className="h-4 w-4" /> Print Report
          </Button>
        </div>
      </div>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- Search & Filter Bar --- */}
      <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm sticky top-4 z-20">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Search</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  placeholder="Invoice #, Customer Name, or Phone..." 
                  className="pl-11 h-12 bg-slate-50/50 border-slate-100 rounded-xl focus:bg-white transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full lg:w-72 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Visibility</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-bold h-12 border-slate-100 bg-slate-50/50 rounded-xl px-4",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-slate-400" />
                    {date?.from ? (
                      date.to ? (
                        <span className="text-slate-700">{format(date.from, "MMM dd")} - {format(date.to, "MMM dd, y")}</span>
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

            <Button onClick={fetchSales} variant="secondary" className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all p-0 shadow-sm overflow-hidden relative">
              <RefreshCcw className={cn("h-5 w-5", loading && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Data Table --- */}
      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest w-40">Invoice</TableHead>
                <TableHead className="py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</TableHead>
                <TableHead className="py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Client</TableHead>
                <TableHead className="py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Method</TableHead>
                <TableHead className="text-right py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Value</TableHead>
                <TableHead className="text-center py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={7} className="h-16 bg-slate-50/20"></TableCell>
                  </TableRow>
                ))
              ) : filteredData.length > 0 ? (
                filteredData.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-slate-50 group border-b border-slate-50 transition-colors">
                    <TableCell className="pl-8 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[13px] font-black text-blue-600 tracking-tighter uppercase">
                          {sale.invoice_number}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{sale.branch?.name || 'Main Branch'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span className="text-[12px] font-medium">
                          {format(new Date(sale.created_at), 'MMM dd, yyyy • hh:mm a')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500">
                          {(sale.customer?.name || "W").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-700 text-[13px]">
                          {sale.customer?.name || "Walk-in Customer"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[9px] font-black uppercase tracking-widest py-0 px-2 border-slate-200 text-slate-500">
                          {sale.payment_method}
                        </Badge>
                        <span className="text-[9px] text-slate-400 font-medium px-1">By {sale.cashier?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <span className="text-[14px] font-black text-slate-900">
                        LKR {parseFloat(sale.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Badge className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm",
                        sale.payment_status === 'paid' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"
                      )}>
                        {sale.payment_status || 'Success'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8 py-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 px-4 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-bold transition-all border border-transparent hover:border-blue-100"
                        onClick={() => handleViewDetails(sale)}
                      >
                        <Eye className="h-4 w-4" />
                        Audit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                      <Receipt className="h-12 w-12 text-slate-300" />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No matching transactions found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <SaleDetailSheet 
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        sale={selectedSale}
        onReprint={(sale) => {
          toast.success("Initializing print for " + sale.invoice_number);
          // Actual print logic would go here, connecting to top-level printer
        }}
      />
    </div>
  );
}
