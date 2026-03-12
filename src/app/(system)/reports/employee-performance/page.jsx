"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Download, 
  Search, 
  AlertCircle,
  FileText,
  RefreshCw,
  Trophy,
  Target,
  TrendingUp,
  Users,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeePerformancePage() {
  const { data: session } = useSession();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalRevenue: 0, totalCustomers: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date Filters (Default to current month)
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const fetchData = async (targetPage = pagination.page) => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        page: targetPage,
        limit: 10
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-performance?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch performance data");
      }

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data.data || []);
        setSummary(result.data.summary || { totalSales: 0, totalRevenue: 0, totalCustomers: 0 });
        setPagination(result.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      } else {
        throw new Error(result.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error("Failed to load performance data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = data.map((emp, index) => ({
      "Rank": index + 1,
      "Employee": emp.name,
      "Email": emp.email,
      "Sales Count": emp.total_sales,
      "Customers Reached": emp.totalCustomers || emp.total_customers,
      "Avg. Sale Value": emp.average_sale_value,
      "Total Revenue": emp.total_amount
    }));
    exportToCSV(exportData, "Employee_Performance_Report");
  };

  const handleExportExcel = () => {
    const exportData = data.map((emp, index) => ({
      "Rank": index + 1,
      "Employee": emp.name,
      "Email": emp.email,
      "Sales Count": emp.total_sales,
      "Customers Reached": emp.totalCustomers || emp.total_customers,
      "Avg. Sale Value": emp.average_sale_value,
      "Total Revenue": emp.total_amount
    }));
    exportToExcel(exportData, "Employee_Performance_Report");
  };

  useEffect(() => {
    fetchData(1);
  }, [session?.accessToken, date]);

  // Calculate totals for summary cards (Removed client-side calculation to use backend totals)

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 bg-background max-w-[1600px] mx-auto w-full font-sans text-foreground">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20">
            <BarChart3 className="w-6 h-6 text-[#10b981]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Performance</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>Reports</span>
              <span className="text-muted-foreground/40">/</span>
              <span>Employees</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-foreground font-medium">Performance Analysis</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* DATE RANGE PICKER */}
          <div className="bg-card p-1 rounded-xl border border-border/50 shadow-sm mr-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"ghost"}
                  className={cn(
                    "w-fit justify-start text-left font-normal h-9 px-3 gap-2",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 text-[#10b981]" />
                  <span className="text-sm font-medium">
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </span>
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
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button size="icon" variant="ghost" onClick={() => fetchData(1)} disabled={isLoading} className="h-9 w-9 text-[#10b981] hover:bg-[#10b981]/10 bg-card border border-border/50 shadow-sm rounded-xl mr-2">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          
          <Button onClick={handleExportCSV} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-9">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-9">
            <FileText className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* --- ANALYTICAL DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-[#10b981]" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-2xl font-black text-foreground mt-0.5">
                  LKR {summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">Total Sales Count</p>
                <h3 className="text-2xl font-black text-foreground mt-0.5">{summary.totalSales}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">Total Customers Reach</p>
                <h3 className="text-2xl font-black text-foreground mt-0.5">{summary.totalCustomers}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-border/30 bg-sidebar-accent/5 backdrop-blur-md flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Performance Leaderboard
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            {error ? (
                <div className="p-8 text-center text-destructive">
                   <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-50" />
                   <p className="font-medium">{error}</p>
                </div>
            ) : (
                <Table>
                    <TableHeader className="bg-sidebar-accent/10">
                        <TableRow className="border-border/30 hover:bg-transparent">
                            <TableHead className="w-[80px] pl-6 font-bold text-muted-foreground text-xs uppercase tracking-wider">Rank</TableHead>
                            <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-wider">Employee</TableHead>
                            <TableHead className="text-right font-bold text-muted-foreground text-xs uppercase tracking-wider">Sales Count</TableHead>
                            <TableHead className="text-right font-bold text-muted-foreground text-xs uppercase tracking-wider">Customers</TableHead>
                            <TableHead className="text-right font-bold text-muted-foreground text-xs uppercase tracking-wider">Avg. Sale</TableHead>
                            <TableHead className="text-right pr-6 font-bold text-muted-foreground text-xs uppercase tracking-wider">Total Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No performance data found for this period.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((emp, index) => (
                                <TableRow key={emp.id} className="hover:bg-sidebar-accent/10 transition-colors border-b border-border/20 last:border-0">
                                    <TableCell className="pl-6 py-4">
                                        {index === 0 ? (
                                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] text-white text-xs font-black">1</div>
                                        ) : index === 1 ? (
                                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.4)] text-white text-xs font-black">2</div>
                                        ) : index === 2 ? (
                                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 shadow-[0_0_12px_rgba(180,83,9,0.4)] text-white text-xs font-black">3</div>
                                        ) : (
                                            <span className="text-muted-foreground font-bold pl-2">#{index + 1}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border-2 border-border shadow-sm">
                                                <AvatarImage src={emp.profile_image} />
                                                <AvatarFallback className="bg-[#10b981]/10 text-[#10b981] font-black text-xs">
                                                    {emp.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-foreground leading-none">{emp.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{emp.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-black text-foreground">
                                        {emp.total_sales}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-muted-foreground">
                                        {emp.totalCustomers || emp.total_customers}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground font-medium">
                                        LKR {Number(emp.average_sale_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right pr-6 font-black text-[#10b981] text-base">
                                        LKR {Number(emp.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            )}

            <div className="px-6 py-4 flex items-center justify-between bg-muted/10 border-t border-border/30">
                <div className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Showing <span className="text-foreground font-black">{data.length}</span> of <span className="text-foreground font-black">{pagination.total}</span> records
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-lg text-xs" 
                        disabled={pagination.page <= 1 || isLoading}
                        onClick={() => fetchData(pagination.page - 1)}
                    >
                        <ChevronLeft className="h-3 w-3 mr-1"/> Prev
                    </Button>
                    <div className="text-xs font-bold px-2">
                        {pagination.page} / {pagination.totalPages}
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-lg text-xs" 
                        disabled={pagination.page >= pagination.totalPages || isLoading}
                        onClick={() => fetchData(pagination.page + 1)}
                    >
                        Next <ChevronRight className="h-3 w-3 ml-1"/>
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
