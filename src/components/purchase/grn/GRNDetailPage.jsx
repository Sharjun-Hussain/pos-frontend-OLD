"use client";

import { useState, useEffect } from "react";
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

export default function GRNDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGRNDetails() {
      if (!params.id || !session?.accessToken) return;
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium font-outfit">Retrieving receipt details...</p>
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="p-6 text-center py-20 bg-slate-50/50 min-h-screen">
         <h1 className="text-2xl font-bold text-slate-800">GRN Not Found</h1>
         <Button variant="link" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const printGRN = () => {
    window.print();
  };

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
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen print:p-0 print:bg-white">
      {/* Action Header */}
      <div className="flex items-center justify-between mb-2 print:hidden">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-white shadow-sm border border-slate-200">
             <ArrowLeft className="w-4 h-4" />
           </Button>
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-slate-900">Receipt Details</h1>
             <p className="text-sm text-slate-500">View and print Good Received Note.</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="bg-white" onClick={printGRN}>
             <Printer className="w-4 h-4 mr-2" /> Print
           </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md" onClick={downloadPDF}>
              <Download className="w-4 h-4 mr-2" /> PDF Receipt
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b px-8 py-6">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Package className="w-8 h-8" />
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                           <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{grn.grn_number}</CardTitle>
                           <Badge className="bg-green-100 text-green-700 hover:bg-green-100 uppercase text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-md border-none">
                              Completed
                           </Badge>
                        </div>
                        <CardDescription className="font-medium text-slate-500 mt-1">
                           Received on {format(new Date(grn.received_date), "EEEE, MMMM do, yyyy")}
                        </CardDescription>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Total GRN Value</div>
                     <div className="text-3xl font-black text-slate-900">LKR {parseFloat(grn.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-slate-100">
                       <TableHead className="pl-8 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Item Details</TableHead>
                       <TableHead className="text-center text-xs font-bold uppercase text-slate-500 tracking-wider">Received Qty</TableHead>
                       <TableHead className="text-right text-xs font-bold uppercase text-slate-500 tracking-wider">Unit Cost</TableHead>
                       <TableHead className="pr-8 text-right text-xs font-bold uppercase text-slate-500 tracking-wider">Subtotal</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {grn.items?.map((item) => (
                       <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                          <TableCell className="pl-8 py-4">
                             <div className="font-bold text-slate-900 text-base">{item.product?.name}</div>
                             <div className="flex items-center gap-3 mt-1.5">
                                {item.variant && (
                                   <Badge variant="outline" className="bg-slate-50 text-[10px] text-slate-500 border-slate-200 font-bold px-1.5 py-0 leading-none h-5">
                                      {item.variant.name}
                                   </Badge>
                                )}
                                {item.batch_number && (
                                   <span className="text-[10px] font-mono text-slate-400 bg-slate-100/50 px-1 rounded uppercase">Batch: {item.batch_number}</span>
                                )}
                                {item.expiry_date && (
                                   <span className="text-[10px] font-mono text-orange-400 bg-orange-50 px-1 rounded uppercase">Exp: {format(new Date(item.expiry_date), "MM/yy")}</span>
                                )}
                             </div>
                          </TableCell>
                          <TableCell className="text-center font-black text-slate-900 text-lg">
                             {parseFloat(item.quantity_received).toFixed(0)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-600">
                             {parseFloat(item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="pr-8 text-right font-black text-slate-900 text-lg">
                             {parseFloat(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
               </Table>
               
               <div className="p-8 bg-slate-50/30">
                  <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                           <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                           <div className="text-sm font-bold text-slate-900">Verification Complete</div>
                           <div className="text-xs text-slate-500">Stock updated and ledger entry created successfully.</div>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Final Amount Due</div>
                        <div className="text-2xl font-black text-blue-600">LKR {parseFloat(grn.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          {grn.notes && (
             <Card className="border-none shadow-sm bg-blue-50/30">
                <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Receiving Notes
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-blue-800 leading-relaxed font-outfit">{grn.notes}</p>
                </CardContent>
             </Card>
          )}
        </div>

        {/* Sidebar Intel */}
        <div className="space-y-6">
           {/* Supplier Insight */}
           <Card className="border-none shadow-sm bg-white overflow-hidden">
              <div className="bg-slate-900 p-6">
                 <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Primary Supplier</div>
                 <div className="text-white font-black text-xl truncate">{grn.supplier?.name}</div>
                 <div className="text-slate-400 text-xs mt-1 truncate">{grn.supplier?.email}</div>
              </div>
              <CardContent className="p-6 space-y-4">
                 <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100"><User className="w-4 h-4 text-slate-400" /></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Contact Person</span>
                       <span className="font-bold text-slate-800 tracking-tight">{grn.supplier?.contact_person || 'N/A'}</span>
                    </div>
                 </div>
                 <Separator className="bg-slate-50" />
                 <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100"><CalendarIcon className="w-4 h-4 text-slate-400" /></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Purchase Date</span>
                       <span className="font-bold text-slate-800 tracking-tight">{format(new Date(grn.received_date), "PPP")}</span>
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* Branch/Info */}
           <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-6 space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Receiving Branch</span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 font-bold tracking-tight">
                       {grn.branch?.name}
                    </Badge>
                 </div>
                 <Separator className="bg-slate-50" />
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Logged By</span>
                    <span className="text-slate-900 font-bold">{grn.received_by_user?.name || 'Authorized Staff'}</span>
                 </div>
              </CardContent>
           </Card>

           {/* Quick Actions */}
           <Card className="border-none shadow-md bg-blue-600 text-white group cursor-pointer hover:bg-blue-700 transition-all overflow-hidden relative">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-125 transition-transform">
                 <Printer className="w-24 h-24 rotate-12" />
              </div>
              <CardContent className="p-6">
                 <div className="font-black text-lg mb-1 tracking-tight">Need a hard copy?</div>
                 <p className="text-blue-100 text-sm font-medium mb-4">Generate a professional print-ready receipt for filing.</p>
                 <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 border-none font-bold" onClick={printGRN}>Print Official Receipt</Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
