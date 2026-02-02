"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Search, 
  AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date Filters (Default to current month)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchData = async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
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
        setData(result.data);
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
    fetchData();
  }, [session?.accessToken, startDate, endDate]);

  // Calculate totals for summary cards
  const summary = data.reduce((acc, curr) => ({
    totalSales: acc.totalSales + curr.total_sales,
    totalRevenue: acc.totalRevenue + Number(curr.total_amount),
    totalCustomers: acc.totalCustomers + curr.total_customers
  }), { totalSales: 0, totalRevenue: 0, totalCustomers: 0 });

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employee Performance</h1>
          <p className="text-slate-500">Track sales & revenue contributions by employee.</p>
        </div>

        <div className="flex gap-2">
           <Button onClick={handleExportCSV} variant="outline" className="gap-2">
             <Download className="h-4 w-4" /> CSV
           </Button>
           <Button onClick={handleExportExcel} variant="outline" className="gap-2">
             <BarChart3 className="h-4 w-4" /> Excel
           </Button>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 px-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filter:</span>
            </div>
            <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 w-fit bg-transparent border-0 focus-visible:ring-0 px-2"
            />
            <span className="text-slate-400">-</span>
            <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 w-fit bg-transparent border-0 focus-visible:ring-0 px-2"
            />
            <Button size="sm" onClick={fetchData} variant="secondary" className="h-8">
                Refresh
            </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="font-bold text-green-600">Rs</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">LKR {summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">Total sales revenue in period</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales Count</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summary.totalSales}</div>
                <p className="text-xs text-muted-foreground">Total completed transactions</p>
            </CardContent>
        </Card>
        {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{summary.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Across all employees</p>
            </CardContent>
        </Card> */}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-semibold text-slate-800">Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            {error ? (
                <Alert variant="destructive" className="m-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead className="w-[80px]">Rank</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead className="text-right">Sales Count</TableHead>
                            <TableHead className="text-right">Customers Reached</TableHead>
                            <TableHead className="text-right">Avg. Sale Value</TableHead>
                            <TableHead className="text-right">Total Revenue</TableHead>
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
                                <TableRow key={emp.id} className="hover:bg-slate-50">
                                    <TableCell className="font-medium text-slate-500">
                                        {index + 1 <= 3 ? (
                                            <div className={`
                                                flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white
                                                ${index === 0 ? 'bg-amber-400 ring-4 ring-amber-100' : ''}
                                                ${index === 1 ? 'bg-slate-400' : ''}
                                                ${index === 2 ? 'bg-amber-700' : ''}
                                            `}>
                                                {index + 1}
                                            </div>
                                        ) : (
                                            <span className="pl-2">{index + 1}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border border-slate-200">
                                                <AvatarImage src={emp.profile_image} />
                                                <AvatarFallback className="bg-blue-50 text-blue-600 font-medium">
                                                    {emp.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-slate-900">{emp.name}</p>
                                                <p className="text-xs text-slate-500">{emp.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {emp.total_sales}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {emp.totalCustomers || emp.total_customers}
                                    </TableCell>
                                    <TableCell className="text-right text-slate-600">
                                        LKR {Number(emp.average_sale_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-900">
                                        LKR {Number(emp.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
