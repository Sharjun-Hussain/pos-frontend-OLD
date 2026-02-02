"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Printer,
  Download,
  MoreHorizontal,
  Edit,
  FileText,
  Upload,
  
  ClipboardCheck,
  Eye,
  FileIcon,
  Image as ImageIcon,
  X,
  Search,
  
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { useSession } from "next-auth/react";
import { PurchaseOrderTemplate } from "@/components/Template/PurchaseOrderTemplate";
import { toast } from "sonner";
import { format } from "date-fns";

// --- 1. API HELPERS ---

async function fetchPO(id, token) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch Purchase Order");
  const data = await response.json();
  return data.data;
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR",
  }).format(parseFloat(amount));
};

// --- 2. HELPER: Attachment Item ---
const AttachmentItem = ({ file }) => {
  const isImage = file.type.startsWith("image/");

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Thumbnail Logic */}
      <div className="h-10 w-10 rounded bg-gray-100 shrink-0 overflow-hidden border flex items-center justify-center">
          {isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <FileIcon className="h-5 w-5 text-blue-500" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">{file.size}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {/* View Action (Only for Images mostly, or handled via browser for PDF) */}
        {isImage ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-blue-600"
                title="View Full Screen"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black border-none">
              <div className="relative w-full h-[80vh] flex items-center justify-center">
                 <img
                    src={file.url}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain"
                  />
                  <DialogClose className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white">
                    <X className="h-4 w-4"/>
                  </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-blue-600"
            title="View File"
            onClick={() => window.open(file.url, "_blank")}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-green-600"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function PurchaseOrderView() {
  const params = useParams();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [poData, setPoData] = useState(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");

const printComponentRef = useRef();

const handlePrint = useReactToPrint({
    contentRef: printComponentRef, // <--- User requested syntax
    documentTitle: poData ? `PO_${poData.po_number}` : "PurchaseOrder",
  });

  // 1. Fetch Data
  useEffect(() => {
    const load = async () => {
      if (!session?.accessToken || !params?.poid) return;
      setIsLoading(true);
      try {
        const data = await fetchPO(params.poid, session.accessToken);
        setPoData(data);
      } catch (error) {
        console.error("Error fetching PO:", error);
        toast.error("Failed to load Purchase Order details");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params, session?.accessToken]);

  const handleApprove = async () => {
    if (!session?.accessToken) return;
    setIsActionLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${poData.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      if (response.ok) {
        toast.success("Purchase Order approved successfully");
        // Refresh data
        const updated = await fetchPO(poData.id, session.accessToken);
        setPoData(updated);
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to approve Purchase Order");
      }
    } catch (error) {
      toast.error("An error occurred during approval");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!session?.accessToken) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${poData.id}/pdf`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PO-${poData.po_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        toast.error("Failed to generate PDF");
      }
    } catch (error) {
      toast.error("Error downloading PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-500 font-medium">Loading Order...</span>
      </div>
    );
  }
  
if (!poData) return <div>Not Found</div>;

  // 2. Filter Items Logic (Name, Code/SKU, Barcode)
  const filteredItems = (poData.items || []).filter((item) => {
    const query = searchQuery.toLowerCase();
    const productName = item.product?.name || item.name || "";
    const productCode = item.product?.code || "";
    const variantSku = item.variant?.sku || "";
    const variantBarcode = item.variant?.barcode || "";
    
    return (
      productName.toLowerCase().includes(query) ||
      productCode.toLowerCase().includes(query) ||
      variantSku.toLowerCase().includes(query) ||
      variantBarcode.toLowerCase().includes(query)
    );
  });

  // Helper to determine badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "received": return "bg-green-100 text-green-700 border-green-200";
      case "partially_received": return "bg-amber-100 text-amber-700 border-amber-200";
      case "pending": return "bg-blue-100 text-blue-700 border-blue-200";
      case "ordered": return "bg-purple-100 text-purple-700 border-purple-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };


  return (
    <div className="flex-1 space-y-6 p-6 bg-gray-50/50 min-h-screen">
      
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Purchase Order #{poData.po_number}
            </h1>
            <Badge
              variant="secondary"
              className={`px-3 capitalize ${getStatusColor(poData.status)}`}
            >
              {poData.status?.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Created on {poData.order_date ? format(new Date(poData.order_date), "MMM dd, yyyy") : "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/purchase/purchase-orders/${poData.id}/edit`}>
            <Button variant="outline" className="bg-white hidden sm:flex">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
          
          {/* Approval Action */}
          {poData.status === "pending" && (
            <Button 
                onClick={handleApprove} 
                disabled={isActionLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
            >
                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve Order
            </Button>
          )}

          {/* Only show Generate GRN if ordered or partially received */}
          {(poData.status === "ordered" || poData.status === "partially_received") && (
            <Link href={`/purchase/grn/${poData.id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <ClipboardCheck className="mr-2 h-4 w-4" /> 
                    Receive Goods
                </Button>
            </Link>
          )}

          <div className="hidden">
            {poData && <PurchaseOrderTemplate ref={printComponentRef} data={poData} />}
          </div>

          <div className="flex items-center border rounded-md bg-white ml-2 shadow-sm">
            <Button onClick={handlePrint} variant="ghost" size="icon" className="h-9 w-9 border-r rounded-none hover:bg-gray-50" title="Print UI">
              <Printer className="h-4 w-4 text-gray-500" />
            </Button>
            <Button onClick={handleDownloadPDF} variant="ghost" size="icon" className="h-9 w-9 border-r rounded-none hover:bg-gray-50" title="Download Professional PDF">
              <Download className="h-4 w-4 text-gray-500" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none hover:bg-gray-50">
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-red-600">Cancel Order</DropdownMenuItem>
                <DropdownMenuItem>Email Supplier</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* --- Info Cards --- */}
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
                  <span className="col-span-2 font-medium text-gray-900">{poData.supplier?.name || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Code</span>
                  <span className="col-span-2 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded w-fit text-gray-700">{poData.supplier?.id?.substring(0, 8) || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Contact</span>
                  <span className="col-span-2 text-gray-900">{poData.supplier?.contact || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="col-span-2 text-gray-900">{poData.supplier?.phone || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <a href={`mailto:${poData.supplier?.email}`} className="col-span-2 text-blue-600 hover:underline truncate">{poData.supplier?.email || "N/A"}</a>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Address</span>
                  <span className="col-span-2 text-gray-900">{poData.supplier?.address || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* PO Details */}
            <div className="border-t md:border-t-0 md:border-l md:pl-8 pt-6 md:pt-0 border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Order Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">PO Number</span>
                  <span className="col-span-2 font-bold text-gray-900">{poData.po_number}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Date</span>
                  <span className="col-span-2 text-gray-900">{poData.order_date ? format(new Date(poData.order_date), "MMM dd, yyyy") : "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Expected</span>
                  <span className="col-span-2 text-gray-900">{poData.expected_delivery_date ? format(new Date(poData.expected_delivery_date), "MMM dd, yyyy") : "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Created By</span>
                  <span className="col-span-2 flex items-center gap-2">
                     <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                        {poData.created_by_user?.name?.charAt(0) || "U"}
                     </div>
                     {poData.created_by_user?.name || "System"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="col-span-2 text-gray-900">{poData.payment_terms || "N/A"}</span>
                </div>
                {poData.notes && (
                    <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="col-span-2 text-amber-700 bg-amber-50 p-2 rounded-md text-xs">
                        {poData.notes}
                    </span>
                    </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Order Items Table --- */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50">
          <CardTitle className="text-lg font-semibold">Order Items</CardTitle>
          
          {/* SEARCH BAR */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                <Input 
                    placeholder="Search by Name, SKU, or Barcode..." 
                    className="pl-9 h-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
            <Table>
              <TableHeader className="bg-gray-50/50">
                 <TableRow>
                    <TableHead className="pl-6 text-xs uppercase font-semibold text-gray-500">Product</TableHead>
                    <TableHead className="text-xs uppercase font-semibold text-gray-500">Code / SKU</TableHead>
                    <TableHead className="text-right text-xs uppercase font-semibold text-gray-500">Ordered</TableHead>
                    
                    {/* Hide "Received" column if Pending */}
                    {poData.status !== "pending" && (
                        <TableHead className="text-right text-xs uppercase font-semibold text-gray-500">Received</TableHead>
                    )}
                    
                    <TableHead className="text-right text-xs uppercase font-semibold text-gray-500">Unit Cost</TableHead>
                    <TableHead className="text-right pr-6 text-xs uppercase font-semibold text-gray-500">Total</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {filteredItems.length > 0 ? (
                     filteredItems.map((item, idx) => (
                        <TableRow key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <TableCell className="pl-6">
                                <div className="font-medium text-gray-900">
                                    {item.product?.name || item.name || <span className="text-gray-400 italic">Product Unavailable</span>}
                                </div>
                                <div className="text-xs text-muted-foreground md:hidden">
                                    {item.product?.code || item.code || "N/A"}
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className="font-mono text-xs text-gray-600 bg-gray-100 w-fit px-1.5 py-0.5 rounded">
                                    {item.variant?.sku || item.product?.code || "N/A"}
                                </div>
                                {item.variant?.barcode && (
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                        {item.variant.barcode}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-right font-medium text-gray-700">{item.quantity}</TableCell>
                            
                            {/* Hide Received Cell if Pending */}
                            {poData.status !== "pending" && (
                                <TableCell className="text-right">
                                    <span className={item.quantity_received < item.quantity ? "text-amber-600 font-bold" : "text-green-600 font-bold"}>
                                        {item.quantity_received || 0}
                                    </span>
                                    {(item.quantity_received || 0) < item.quantity && (
                                        <span className="text-[10px] text-amber-500 block">
                                            {item.quantity - (item.quantity_received || 0)} Pending
                                        </span>
                                    )}
                                </TableCell>
                            )}

                            <TableCell className="text-right text-gray-600">{formatCurrency(item.unit_cost)}</TableCell>
                            <TableCell className="text-right pr-6 font-semibold text-gray-900">{formatCurrency(item.total_amount)}</TableCell>
                        </TableRow>
                    ))
                 ) : (
                    <TableRow>
                        <TableCell colSpan={poData.status === "pending" ? 5 : 6} className="h-24 text-center text-gray-500">
                            No items found matching "{searchQuery}"
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
           </Table>

           {/* Financial Footer */}
            <div className="flex justify-end p-6 bg-gray-50/30">
              <div className="w-64 space-y-2">
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(poData.total_amount)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-green-600">-{formatCurrency(0)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{formatCurrency(0)}</span>
                 </div>
                 <Separator className="my-2"/>
                 <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Grand Total</span>
                    <span>{formatCurrency(poData.total_amount)}</span>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>

      {/* --- GRN History --- */}
      {poData.status !== "pending" && (
        <Card className="border-none shadow-sm bg-white">
            <CardHeader className="px-6 py-4">
                <CardTitle className="text-base font-semibold">GRN History</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-2">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="pl-6 text-xs uppercase">GRN #</TableHead>
                            <TableHead className="text-xs uppercase">Date</TableHead>
                            <TableHead className="text-xs uppercase">Status</TableHead>
                            <TableHead className="text-right pr-6 text-xs uppercase">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {poData.grns && poData.grns.length > 0 ? (
                            poData.grns.map((grn) => (
                                <TableRow key={grn.id}>
                                    <TableCell className="pl-6 font-medium text-blue-600">{grn.grn_number}</TableCell>
                                    <TableCell>{format(new Date(grn.received_date), "MMM dd, yyyy")}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 capitalize">{grn.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs border">View GRN</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                    No Goods Received Notes generated yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}

      {/* --- Bottom Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Timeline */}
         <Card className="lg:col-span-2 border-none shadow-sm bg-white">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-2">
                    {(poData.timeline || [
                        {
                            title: "Purchase Order Created",
                            by: poData.created_by_user?.name || "System",
                            date: poData.order_date ? format(new Date(poData.order_date), "MMM dd, yyyy") : "N/A"
                        }
                    ]).map((event, idx) => (
                        <div key={idx} className="relative pl-8">
                             <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white ${idx === 0 ? "bg-blue-500" : "bg-gray-200"}`}></div>
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                                    <p className="text-xs text-gray-500">by {event.by} on {event.date}</p>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </CardContent>
         </Card>

         {/* Attachments */}
         <Card className="border-none shadow-sm bg-white">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 {/* List existing attachments */}
                 {poData.attachments && poData.attachments.length > 0 ? (
                    poData.attachments.map((file) => (
                        <AttachmentItem key={file.id} file={file} />
                    ))
                 ) : (
                    <div className="text-sm text-gray-400 text-center py-4 italic">
                        No attachments found.
                    </div>
                 )}

                 {/* Upload Area */}
                 <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all group">
                     <div className="bg-gray-50 p-3 rounded-full mb-2 group-hover:bg-blue-100 transition-colors">
                        <Upload className="h-6 w-6 text-gray-400 group-hover:text-blue-600" />
                     </div>
                     <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700">Click to Upload</span>
                     <span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (Max 5MB)</span>
                 </div>
            </CardContent>
         </Card>

      </div>
    </div>
  );
}