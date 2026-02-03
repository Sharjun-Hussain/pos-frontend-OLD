"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Printer,
  ArrowLeft,
  Loader2,
  FileIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR",
  }).format(parseFloat(amount || 0));
};

export default function ReturnDetails({ id: propId }) {
  const router = useRouter();
  const params = useParams();
  const id = propId || params?.id;
  
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [returnData, setReturnData] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!session?.accessToken || !id) {
          // If we don't have what we need, stop loading so we don't hang
          if (session?.accessToken === undefined || id === undefined) {
             // Still waiting for hooks to initialize
          } else {
             setIsLoading(false);
          }
          return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-returns/${id}`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        
        if (!response.ok) throw new Error("Failed to fetch return details");
        
        const result = await response.json();
        if (result.status === 'success') {
            setReturnData(result.data);
        } else {
             throw new Error(result.message || "Failed to fetch return");
        }
      } catch (error) {
        console.error("Error fetching Return:", error);
        toast.error("Failed to load Purchase Return details");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, session?.accessToken]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500 font-medium">Loading Return...</span>
      </div>
    );
  }

  if (!returnData) return <div className="p-8 text-center text-red-500">Return Not Found</div>;

  return (
    <div className="flex-1 space-y-6 p-6 bg-gray-50/50 min-h-screen">
      
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
             </Button>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Purchase Return #{returnData.return_number}
            </h1>
            <Badge
              variant={returnData.status === 'completed' ? 'default' : 'outline'}
              className="px-3 capitalize"
            >
              {returnData.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 ml-12">
            Date: {returnData.return_date ? format(new Date(returnData.return_date), "MMM dd, yyyy") : "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
            </Button>
        </div>
      </div>

      {/* --- Info info --- */}
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Supplier Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                Supplier Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Name</span>
                  <span className="col-span-2 font-medium text-gray-900">{returnData.supplier?.name || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <span className="col-span-2 text-blue-600">{returnData.supplier?.email || "N/A"}</span>
                </div>
                 <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="col-span-2">{returnData.supplier?.phone || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Return Details */}
            <div className="border-t md:border-t-0 md:border-l md:pl-8 pt-6 md:pt-0 border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Meta Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Created By</span>
                  <span className="col-span-2">{returnData.created_by_user?.name || "System"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Branch</span>
                  <span className="col-span-2">{returnData.branch?.name || "N/A"}</span>
                </div>
                 {returnData.notes && (
                    <div className="grid grid-cols-3 gap-4">
                        <span className="text-muted-foreground">Notes</span>
                        <span className="col-span-2 text-amber-700 bg-amber-50 p-2 rounded-md text-xs">{returnData.notes}</span>
                    </div>
                 )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Items Table --- */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="px-6 py-4 border-b border-gray-50">
          <CardTitle className="text-lg font-semibold">Returned Items</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
            <Table>
              <TableHeader className="bg-gray-50/50">
                 <TableRow>
                    <TableHead className="pl-6">Product</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right pr-6">Total</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {returnData.items?.map((item, idx) => (
                    <TableRow key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <TableCell className="pl-6">
                            <div className="font-medium text-gray-900">
                                {item.product?.name || "Unknown"}
                            </div>
                            {item.variant && (
                                <div className="text-xs text-muted-foreground">
                                    Variant: {item.variant.name}
                                </div>
                            )}
                        </TableCell>
                        <TableCell>
                            <span className="italic text-gray-500">{item.reason || "-"}</span>
                        </TableCell>
                         <TableCell>
                            <span className="font-mono text-xs">{item.batch_number || "N/A"}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-right text-gray-600">{formatCurrency(item.unit_cost)}</TableCell>
                        <TableCell className="text-right pr-6 font-semibold text-gray-900">{formatCurrency(item.total_amount)}</TableCell>
                    </TableRow>
                 ))}
              </TableBody>
           </Table>

           {/* Financial Footer */}
            <div className="flex justify-end p-6 bg-gray-50/30">
              <div className="w-64 space-y-2">
                 <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span>{formatCurrency(returnData.total_amount)}</span>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
