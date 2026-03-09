"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Package, 
  Calendar as CalendarIcon, 
  User, 
  CheckCircle2,
  Loader2,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useReactToPrint } from "react-to-print";
import { GRNPrintTemplate } from "@/components/Template/GRNPrintTemplate";

export default function GRNDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: grn ? `GRN-${grn.grn_number}` : "GRN Receipt",
  });

  useEffect(() => {
    async function fetchGRNDetails() {
      if (!params.id || !session?.accessToken) {
          if (params.id === undefined || session?.accessToken === undefined) {
             // Still initializing
          } else {
             setLoading(false);
          }
          return;
      }
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn/${params.id}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const result = await response.json();
        if (result.status === "success") {
          setGrn(result.data);
        } else {
          toast.error(result.message || "Failed to load GRN details");
        }
      } catch (error) {
        console.error("Failed to fetch GRN", error);
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchGRNDetails();
  }, [params.id, session]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-muted-foreground/70 font-medium font-outfit">Retrieving receipt details...</p>
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="p-6 text-center py-20 bg-background min-h-screen">
         <h1 className="text-2xl font-bold text-foreground/90">GRN Not Found</h1>
         <Button variant="link" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }


  const downloadPDF = async () => {
    if (!grn || !session?.accessToken) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn/${params.id}/pdf`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      
      if (!response.ok) throw new Error("Failed to download PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `GRN-${grn.grn_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download PDF");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen print:p-0 print:bg-card">
      {/* ── Premium Header ── */}
      <div className="flex items-center justify-between mb-2 print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl border border-border/50 bg-card h-10 w-10 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20">
              <Package className="w-4.5 h-4.5 text-[#10b981]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Receipt Details</h1>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
                Goods Received Note
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button size="sm" className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20" onClick={downloadPDF}>
            <Download className="w-4 h-4" /> PDF Receipt
          </Button>
        </div>
      </div>

      {/* Hidden GRN Print Template — only rendered during print */}
      <div className="hidden">
        <GRNPrintTemplate ref={printRef} data={grn} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-card border-b px-8 py-6">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <Package className="w-8 h-8" />
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                           <CardTitle className="text-2xl font-black text-foreground tracking-tight">{grn.grn_number}</CardTitle>
                           <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 uppercase text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-md border-none">
                              Completed
                           </Badge>
                        </div>
                        <CardDescription className="font-medium text-muted-foreground/70 mt-1">
                           Received on {format(new Date(grn.received_date), "EEEE, MMMM do, yyyy")}
                        </CardDescription>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/50 mb-1">Total GRN Value</div>
                     <div className="text-3xl font-black text-foreground">LKR {parseFloat(grn.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-muted/20">
                    <TableRow className="border-border/30">
                       <TableHead className="pl-8 py-4 text-xs font-bold uppercase text-muted-foreground/70 tracking-wider">Item Details</TableHead>
                       <TableHead className="text-center text-xs font-bold uppercase text-muted-foreground/70 tracking-wider">Received Qty</TableHead>
                       <TableHead className="text-right text-xs font-bold uppercase text-muted-foreground/70 tracking-wider">Unit Cost</TableHead>
                       <TableHead className="pr-8 text-right text-xs font-bold uppercase text-muted-foreground/70 tracking-wider">Subtotal</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {grn.items?.map((item) => (
                       <TableRow key={item.id} className="border-border/20 hover:bg-muted/20 transition-colors">
                          <TableCell className="pl-8 py-4">
                             <div className="font-bold text-foreground text-base">{item.product?.name}</div>
                             <div className="flex items-center gap-3 mt-1.5">
                                {item.variant && (
                                   <Badge variant="outline" className="bg-muted/30 text-[10px] text-muted-foreground/70 border-border/50 font-bold px-1.5 py-0 leading-none h-5">
                                      {item.variant.name}
                                   </Badge>
                                )}
                                {item.batch_number && (
                                   <span className="text-[10px] font-mono text-muted-foreground/50 bg-muted/40 px-1 rounded uppercase">Batch: {item.batch_number}</span>
                                )}
                                {item.expiry_date && (
                                   <span className="text-[10px] font-mono text-orange-500 bg-orange-500/10 px-1 rounded uppercase">Exp: {format(new Date(item.expiry_date), "MM/yy")}</span>
                                )}
                             </div>
                          </TableCell>
                          <TableCell className="text-center font-black text-foreground text-lg">
                             {parseFloat(item.quantity_received).toFixed(0)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-muted-foreground">
                             {parseFloat(item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="pr-8 text-right font-black text-foreground text-lg">
                             {parseFloat(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
               </Table>
               
               <div className="p-8 bg-muted/20">
                  <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border/30 shadow-sm">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                           <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                           <div className="text-sm font-bold text-foreground">Verification Complete</div>
                           <div className="text-xs text-muted-foreground/70">Stock updated and ledger entry created successfully.</div>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-xs text-muted-foreground/50 font-medium uppercase tracking-widest mb-1">Final Amount Due</div>
                        <div className="text-2xl font-black text-emerald-500">LKR {parseFloat(grn.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          {grn.notes && (
             <Card className="border border-border/50 shadow-sm bg-muted/20">
                <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Receiving Notes
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-foreground/80 leading-relaxed font-outfit">{grn.notes}</p>
                </CardContent>
             </Card>
          )}
        </div>

        {/* Sidebar Intel */}
        <div className="space-y-6">
           {/* Supplier Insight */}
           <Card className="border border-border/50 shadow-sm bg-card overflow-hidden">
               <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6">
                 <div className="text-[10px] uppercase font-black tracking-widest text-emerald-100 mb-2">Primary Supplier</div>
                 <div className="text-white font-black text-xl truncate">{grn.supplier?.name}</div>
                 <div className="text-emerald-100/70 text-xs mt-1 truncate">{grn.supplier?.email}</div>
               </div>
              <CardContent className="p-6 space-y-4">
                 <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="h-8 w-8 bg-muted/30 rounded-lg flex items-center justify-center border border-border/30"><User className="w-4 h-4 text-muted-foreground/50" /></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter leading-none mb-1">Contact Person</span>
                       <span className="font-bold text-foreground/90 tracking-tight">{grn.supplier?.contact_person || 'N/A'}</span>
                    </div>
                 </div>
                 <Separator className="bg-muted/30" />
                 <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="h-8 w-8 bg-muted/30 rounded-lg flex items-center justify-center border border-border/30"><CalendarIcon className="w-4 h-4 text-muted-foreground/50" /></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter leading-none mb-1">Purchase Date</span>
                       <span className="font-bold text-foreground/90 tracking-tight">{format(new Date(grn.received_date), "PPP")}</span>
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* Branch/Info */}
           <Card className="border border-border/50 shadow-sm bg-card">
              <CardContent className="p-6 space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground/70 font-medium">Receiving Branch</span>
                    <Badge variant="secondary" className="bg-muted/40 text-foreground/80 hover:bg-muted/40 font-bold tracking-tight">
                       {grn.branch?.name}
                    </Badge>
                 </div>
                 <Separator className="bg-muted/30" />
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground/70 font-medium">Logged By</span>
                    <span className="text-foreground font-bold">{grn.received_by_user?.name || 'Authorized Staff'}</span>
                 </div>
              </CardContent>
           </Card>

           {/* Quick Actions */}
           <Card className="border border-border/50 shadow-sm bg-emerald-600 text-white group cursor-pointer hover:bg-emerald-700 transition-all overflow-hidden relative">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-125 transition-transform">
                 <Printer className="w-24 h-24 rotate-12" />
              </div>
              <CardContent className="p-6">
                 <div className="font-black text-lg mb-1 tracking-tight">Need a hard copy?</div>
                 <p className="text-emerald-100 text-sm font-medium mb-4">Generate a professional print-ready receipt for filing.</p>
                 <Button className="w-full bg-card text-emerald-500 hover:bg-emerald-500/5 border-none font-bold" onClick={handlePrint}>Print Official Receipt</Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
