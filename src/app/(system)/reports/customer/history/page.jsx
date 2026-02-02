"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Search, 
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  ArrowRight,
  User as UserIcon,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CustomerHistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/customers/history`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch customer history");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map(item => ({
      "Customer Name": item.name,
      "Phone": item.phone || '-',
      "Email": item.email || '-',
      "Total Visits": item.totalSales,
      "Total Spent": item.totalSpent,
      "Last Visit": item.lastVisit ? format(new Date(item.lastVisit), 'yyyy-MM-dd') : 'Never'
    }));
    exportToCSV(exportData, "Customer_Purchase_History");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Customer Name": item.name,
      "Phone": item.phone || '-',
      "Email": item.email || '-',
      "Total Visits": item.totalSales,
      "Total Spent": item.totalSpent,
      "Last Visit": item.lastVisit ? format(new Date(item.lastVisit), 'yyyy-MM-dd') : 'Never'
    }));
    exportToExcel(exportData, "Customer_Purchase_History");
  };

  useEffect(() => {
    fetchData();
  }, [session?.accessToken]);

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.phone && item.phone.includes(searchQuery))
  );

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Purchase History</h1>
          <p className="text-slate-500">Summary of customer interactions, total spending, and visit frequency.</p>
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

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or phone..." 
              className="pl-10 h-10 shadow-none border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0 bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead className="text-right">Total Visits</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /></div></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    No customers found records.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100">
                          <AvatarFallback className="bg-blue-50 text-blue-600 font-bold uppercase">
                            {item.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{item.name}</span>
                            <span className="text-xs text-slate-400">ID: {item.id.substring(0,8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-slate-700">{item.phone || '-'}</span>
                            <span className="text-xs text-slate-400">{item.email || '-'}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-900">
                        {item.totalSales}
                    </TableCell>
                    <TableCell className="text-right font-bold text-blue-600">
                        LKR {item.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                        {item.lastVisit ? format(new Date(item.lastVisit), 'MMM dd, yyyy') : 'Never'}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="text-slate-400 hover:text-blue-600 gap-1 h-8"
                         onClick={() => router.push(`/customers?id=${item.id}`)}
                       >
                           Profile <ArrowRight className="h-3 w-3" />
                       </Button>
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
