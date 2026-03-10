"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  ShoppingBag, 
  Search, 
  Download,
  Calendar,
  Building2,
  Package,
  ArrowUpRight,
  TrendingDown,
  Award,
  Truck,
  FileText
} from "lucide-react";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function SupplierPerformancePage() {
  const { data: session } = useSession();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/purchase/supplier-performance`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch supplier performance");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load supplier performance");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map(item => ({
      "Supplier Name": item.name,
      "Company": item.company || '-',
      "Active Products": item.productCount,
      "Total Orders": item.orderCount,
      "Total Purchase Value": item.totalPurchase
    }));
    exportToCSV(exportData, "Supplier_Performance_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Supplier Name": item.name,
      "Company": item.company || '-',
      "Active Products": item.productCount,
      "Total Orders": item.orderCount,
      "Total Purchase Value": item.totalPurchase
    }));
    exportToExcel(exportData, "Supplier_Performance_Report");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken]);

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.company && item.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topSupplier = data.length > 0 ? data[0] : null;

  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-slate-800/50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-200">Supplier Performance</h1>
          <p className="text-slate-500 dark:text-slate-400">Analytics on procurement volume and reliability by supplier.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                <Award className="h-4 w-4" /> Top Strategic Partner
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-40 bg-blue-50 dark:bg-blue-500/100" /> : (
                <>
                    <div className="text-2xl font-black">{topSupplier?.name || 'N/A'}</div>
                    <p className="text-xs text-blue-100 mt-1 uppercase font-bold tracking-widest">{topSupplier?.company}</p>
                    <div className="mt-6 pt-4 border-t border-b dark:border-slate-800lue-500/50 flex justify-between">
                        <div>
                            <p className="text-[10px] text-blue-200 uppercase font-black">Total Procurement</p>
                            <p className="text-lg font-bold">LKR {topSupplier?.totalPurchase?.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-blue-200 uppercase font-black">Orders</p>
                            <p className="text-lg font-bold">{topSupplier?.orderCount}</p>
                        </div>
                    </div>
                </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Supplier Analytics Overview</CardTitle>
                <CardDescription>Procurement distribution across your supplier network.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-8 h-32">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Suppliers</span>
                        <span className="text-3xl font-black text-slate-900 dark:text-slate-200">{data.length}</span>
                    </div>
                    <div className="w-px h-16 bg-slate-100 dark:bg-slate-800" />
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Purchase Volume</span>
                        <span className="text-3xl font-black text-slate-900 dark:text-slate-200">LKR {data.reduce((s,i) => s + i.totalPurchase, 0).toLocaleString()}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or company..." 
              className="pl-10 h-10 shadow-none border-slate-200 dark:border-slate-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0 bg-white dark:bg-slate-900">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="pl-6">Supplier</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-center">Active Products</TableHead>
                <TableHead className="text-center">Total Orders</TableHead>
                <TableHead className="text-right pr-6">Purchase Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500 dark:text-slate-400">
                    No suppliers found records.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
                    <TableCell className="pl-6 font-semibold text-slate-900 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            {item.name}
                        </div>
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{item.company || '-'}</TableCell>
                    <TableCell className="text-center font-medium">
                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800">{item.productCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium text-slate-700">
                        {item.orderCount}
                    </TableCell>
                    <TableCell className="text-right pr-6 font-black text-blue-600">
                        LKR {item.totalPurchase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
