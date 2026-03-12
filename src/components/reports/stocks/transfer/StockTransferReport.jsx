"use client";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import {
  Printer,
  Download,
  Search,
  Calendar as CalendarIcon,
  Truck,
  ArrowRight,
  FileText,
  RefreshCw,
  Check,
  ChevronsUpDown,
  Filter,
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function StockTransferReportPage() {
  const { data: session } = useSession();
  const { formatDate } = useAppSettings();
  const [date, setDate] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fromBranch, setFromBranch] = useState("all");
  const [toBranch, setToBranch] = useState("all");
  const [fromBranchOpen, setFromBranchOpen] = useState(false);
  const [toBranchOpen, setToBranchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranches = async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === 'success') setBranches(result.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchBranches();
  }, [session?.accessToken]);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
        from_branch: fromBranch,
        to_branch: toBranch
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/transfers?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to fetch transfer data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      "Transfer #": item.transfer_number,
      Date: item.transfer_date,
      From: item.from_branch?.name,
      To: item.to_branch?.name,
      Items: item.items?.length || 0,
      Status: item.status,
      "Processed By": item.user?.name,
    }));
    exportToCSV(exportData, "Stock_Transfer_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      "Transfer #": item.transfer_number,
      Date: item.transfer_date,
      From: item.from_branch?.name,
      To: item.to_branch?.name,
      Items: item.items?.length || 0,
      Status: item.status,
      "Processed By": item.user?.name,
    }));
    exportToExcel(exportData, "Stock_Transfer_Report");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken, date, fromBranch, toBranch]);

  const filteredData = data.filter((item) =>
    item.transfer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.from_branch?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.to_branch?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 bg-background max-w-[1600px] mx-auto w-full font-sans text-foreground pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Stock Transfers</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
              <span>Inventory Hub</span>
              <span className="text-muted-foreground/30">/</span>
              <span>Reports</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-[#10b981]">Logistics History</span>
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

      {/* --- FILTERS --- */}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center gap-3">
          <Filter className="w-4 h-4 text-[#10b981]" />
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Advanced Logistics Filter</CardTitle>
            <CardDescription className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tight">Trace movements across dates and branch routes</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Transfer period</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left h-11 rounded-xl border-border/50 bg-background font-bold text-xs">
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#10b981]" />
                    {date?.from ? (date.to ? <>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</> : format(date.from, "LLL dd, y")) : <span>Pick a date range</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Origin Branch</label>
                <Popover open={fromBranchOpen} onOpenChange={setFromBranchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={fromBranchOpen}
                      className="w-full justify-between h-11 rounded-xl border-border/50 bg-background font-bold text-xs group"
                    >
                      <span className="truncate">{fromBranch === "all" ? "All Origin Locations" : branches.find((b) => String(b.id) === String(fromBranch))?.name || "All Branches"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:text-[#10b981] transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search originating locations..." className="font-bold border-none h-11 uppercase" />
                      <CommandList>
                        <CommandEmpty className="py-4 text-xs font-bold text-muted-foreground uppercase text-center">No location found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="All Branches"
                            onSelect={() => {
                              setFromBranch("all");
                              setFromBranchOpen(false);
                            }}
                            className="font-bold text-xs py-3"
                          >
                            <Check className={cn("mr-2 h-4 w-4", fromBranch === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                            All Origin Locations
                          </CommandItem>
                          {branches.map((b) => (
                            <CommandItem
                              key={b.id}
                              value={b.name}
                              onSelect={() => {
                                setFromBranch(b.id);
                                setFromBranchOpen(false);
                              }}
                              className="font-bold text-xs py-3"
                            >
                              <Check className={cn("mr-2 h-4 w-4", String(fromBranch) === String(b.id) ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                              {b.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Destination Branch</label>
                <Popover open={toBranchOpen} onOpenChange={setToBranchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={toBranchOpen}
                      className="w-full justify-between h-11 rounded-xl border-border/50 bg-background font-bold text-xs group"
                    >
                      <span className="truncate">{toBranch === "all" ? "All Destination Locations" : branches.find((b) => String(b.id) === String(toBranch))?.name || "All Branches"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:text-[#10b981] transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search destination locations..." className="font-bold border-none h-11 uppercase" />
                      <CommandList>
                        <CommandEmpty className="py-4 text-xs font-bold text-muted-foreground uppercase text-center">No location found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="All Branches"
                            onSelect={() => {
                              setToBranch("all");
                              setToBranchOpen(false);
                            }}
                            className="font-bold text-xs py-3"
                          >
                            <Check className={cn("mr-2 h-4 w-4", toBranch === "all" ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                            All Destination Locations
                          </CommandItem>
                          {branches.map((b) => (
                            <CommandItem
                              key={b.id}
                              value={b.name}
                              onSelect={() => {
                                setToBranch(b.id);
                                setToBranchOpen(false);
                              }}
                              className="font-bold text-xs py-3"
                            >
                              <Check className={cn("mr-2 h-4 w-4", String(toBranch) === String(b.id) ? "opacity-100 text-[#10b981]" : "opacity-0")} />
                              {b.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Quick Search</label>
                <div className="relative group/search">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-[#10b981] transition-colors" />
                    <Input 
                        placeholder="Transfer # or branch..." 
                        className="pl-11 h-11 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                        value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- DATA TABLE --- */}
      <Card className="border-none shadow-sm overflow-hidden bg-card">
        <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-[#10b981]" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">Logistics Ledger</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60 mt-0.5">Chronological log of internal stock distribution</CardDescription>
              </div>
            </div>
            {isLoading && <Badge className="bg-[#10b981]/10 text-[#10b981] animate-pulse rounded-lg font-bold border-none uppercase text-[9px] tracking-widest px-2 shadow-none">Syncing Ledger</Badge>}
        </CardHeader>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="pl-6 font-bold text-foreground py-4 text-[10px] uppercase tracking-widest">Transaction #</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Execution Date</TableHead>
              <TableHead className="font-bold text-foreground text-[10px] uppercase tracking-widest">Distribution Route</TableHead>
              <TableHead className="text-center font-bold text-foreground text-[10px] uppercase tracking-widest">Payload</TableHead>
              <TableHead className="text-center font-bold text-foreground text-[10px] uppercase tracking-widest">Status</TableHead>
              <TableHead className="text-right pr-6 font-bold text-foreground text-[10px] uppercase tracking-widest">Processed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-lg" /></TableCell>
                  <TableCell className="text-right pr-6"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border/40 group">
                  <TableCell className="pl-6 font-mono text-xs font-black text-foreground group-hover:text-[#10b981] transition-colors">
                    {item.transfer_number}
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground font-bold uppercase tracking-tight">
                    {formatDate(item.transfer_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-foreground/80">{item.from_branch?.name}</span>
                        <div className="p-1 rounded-full bg-muted/60 text-muted-foreground/40 group-hover:bg-[#10b981]/10 group-hover:text-[#10b981] transition-all">
                          <ArrowRight className="h-3 w-3" />
                        </div>
                        <span className="text-xs font-black text-[#10b981] uppercase tracking-wide">{item.to_branch?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-muted/40 text-muted-foreground/60 border-border/40 px-2.5 h-6 text-[9px] font-black uppercase tracking-widest shadow-none">
                        {item.items?.length || 0} Assets
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Badge variant="outline" className={cn(
                          "uppercase text-[9px] font-black tracking-widest h-6 px-3 flex items-center shadow-none w-fit border-none rounded-lg transition-all duration-300",
                          item.status === 'completed' ? "bg-[#10b981]/10 text-[#10b981] shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]" :
                          item.status === 'pending' ? "bg-amber-500/10 text-amber-600 shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]" :
                          "bg-red-500/10 text-red-600 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]"
                      )}>
                          {item.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.1em]">{item.user?.name}</p>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-48 text-center py-20">
                   <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-full bg-muted/30 text-muted-foreground/20">
                      <Truck className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="font-bold text-muted-foreground text-sm uppercase tracking-widest">No logistics records found</h4>
                      <p className="text-xs text-muted-foreground/60 font-medium">Try adjusting your date range or branch filters.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="px-6 py-4 flex justify-between items-center border-t border-border/30 bg-muted/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
             Tracing {filteredData.length} distribution events
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-30" disabled>Next</Button>
          </div>
        </div>
      </Card>

    </div>
  );
}
