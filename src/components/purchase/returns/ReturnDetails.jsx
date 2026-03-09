"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Printer,
  ArrowLeft,
  Loader2,
  RotateCcw,
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
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="text-muted-foreground/70 font-medium text-sm">Loading return details...</span>
      </div>
    );
  }

  if (!returnData) return <div className="p-8 text-center text-red-500">Return Not Found</div>;

  return (
    <div className="flex-1 space-y-6 p-6 bg-background min-h-screen">
      
      {/* ── Premium Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl border border-border/50 bg-card h-10 w-10 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <RotateCcw className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground tracking-tight">Purchase Return</h1>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border text-xs font-bold">
                  #{returnData.return_number}
                </Badge>
                <Badge
                  variant="outline"
                  className={returnData.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 capitalize' : 'bg-amber-500/10 text-amber-600 border-amber-500/20 capitalize'}
                >
                  {returnData.status}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
                {returnData.return_date ? format(new Date(returnData.return_date), "MMM dd, yyyy") : "N/A"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* ── Info Cards ── */}
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Supplier Details */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Supplier Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Name</span>
                  <span className="col-span-2 font-medium text-foreground">{returnData.supplier?.name || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <span className="col-span-2 text-emerald-500">{returnData.supplier?.email || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="col-span-2 text-foreground">{returnData.supplier?.phone || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Return Meta */}
            <div className="border-t md:border-t-0 md:border-l md:pl-8 pt-6 md:pt-0 border-border/30">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Meta Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Created By</span>
                  <span className="col-span-2 text-foreground">{returnData.created_by_user?.name || "System"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Branch</span>
                  <span className="col-span-2 text-foreground">{returnData.branch?.name || "N/A"}</span>
                </div>
                {returnData.notes && (
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="col-span-2 text-amber-600 bg-amber-500/10 p-2 rounded-md text-xs">{returnData.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Items Table ── */}
      <Card className="border border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-border/30">
          <CardTitle className="text-base font-semibold">Returned Items</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
            <Table>
              <TableHeader>
                 <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 pl-6">Product</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Reason</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Batch</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 text-right">Qty</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 text-right">Unit Cost</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 text-right pr-6">Total</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                  {returnData.items?.map((item, idx) => (
                     <TableRow key={idx} className="border-b border-border/30 hover:bg-muted/20 last:border-0">
                         <TableCell className="pl-6">
                             <div className="font-medium text-foreground">
                                 {item.product?.name || "Unknown"}
                             </div>
                             {item.variant && (
                                 <div className="text-xs text-muted-foreground">
                                     Variant: {item.variant.name}
                                 </div>
                             )}
                         </TableCell>
                         <TableCell>
                             <span className="italic text-muted-foreground/70 text-sm">{item.reason || "-"}</span>
                         </TableCell>
                          <TableCell>
                             <span className="font-mono text-xs text-muted-foreground">{item.batch_number || "N/A"}</span>
                         </TableCell>
                         <TableCell className="text-right font-medium text-foreground">{item.quantity}</TableCell>
                         <TableCell className="text-right text-muted-foreground">{formatCurrency(item.unit_cost)}</TableCell>
                         <TableCell className="text-right pr-6 font-semibold text-foreground">{formatCurrency(item.total_amount)}</TableCell>
                     </TableRow>
                  ))}
              </TableBody>
           </Table>

           {/* Financial Footer */}
            <div className="flex justify-end px-6 py-4 bg-muted/10 border-t border-border/30">
              <div className="space-y-1">
                 <div className="flex justify-between gap-16 text-xl font-bold text-foreground">
                    <span>Total Amount</span>
                    <span className="text-emerald-500">{formatCurrency(returnData.total_amount)}</span>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
