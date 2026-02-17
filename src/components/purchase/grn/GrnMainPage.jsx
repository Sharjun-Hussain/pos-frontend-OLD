"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  PackageCheck,
  ChevronsUpDown,
  Check,
  Loader2,
} from "lucide-react";

import { useFormRestore } from "@/hooks/use-form-restore";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import CreateGRNSkeleton from "@/app/skeletons/CreateGRNSkeleton";

// --- ZOD SCHEMA ---
const grnItemSchema = z.object({
  poItemId: z.string().optional(),
  productId: z.string(),
  productVariantId: z.string().nullable().optional(),
  name: z.string(),
  sku: z.string(),
  orderedQty: z.number(),
  receivedQty: z.coerce.number().min(0),
  freeQty: z.coerce.number().min(0).default(0),
  unitCost: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0),
  expiryDate: z.date().optional(),
  batchNumber: z.string().optional(),
});

const formSchema = z.object({
  grnDate: z.date({ required_error: "Date is required" }),
  branchId: z.string().min(1, "Branch is required"),
  invoiceNumber: z.string().min(1, "Invoice # is required"),
  invoiceFile: z.any().optional(),
  remarks: z.string().optional(),
  items: z.array(grnItemSchema).min(1),
});

// --- HELPER COMPONENT ---
const RestrictedProductSelect = ({ value, onChange, availableProducts }) => {
  const [open, setOpen] = useState(false);
  const selectedProduct = availableProducts.find((p) => (p.poItemId || p.productId) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-white h-9", !value && "text-muted-foreground")}
        >
          {selectedProduct ? (
            <span className="truncate font-medium text-sm">{selectedProduct.name}</span>
          ) : (
            <span className="text-sm">Select...</span>
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search within PO..." />
          <CommandList>
            <CommandEmpty>Item not found.</CommandEmpty>
            <CommandGroup>
              {availableProducts.map((product) => (
                <CommandItem
                  key={product.poItemId || product.productId}
                  value={product.name}
                  onSelect={() => {
                    onChange(product.poItemId || product.productId);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === (product.poItemId || product.productId) ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-xs text-muted-foreground">Ord: {product.orderedQty}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// --- MAIN PAGE ---

export default function GRNPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poData, setPoData] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grnDate: new Date(),
      branchId: "",
      invoiceNumber: "",
      remarks: "",
      items: [],
    },
  });

  const { clearSavedData } = useFormRestore(form);

  // Set default branch if user has only one
  useEffect(() => {
    if (session?.user?.branches?.length === 1) {
      form.setValue("branchId", session.user.branches[0].id);
    } else if (poData?.branch_id && session?.user?.branches?.find(b => b.id === poData.branch_id)) {
        // If PO has a branch and user has access to it, pre-select it
        form.setValue("branchId", poData.branch_id);
    }
  }, [session, poData, form]);

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    async function loadData() {
      if (!params.poid || status !== "authenticated" || !session?.accessToken) {
          if (params.poid === undefined || session?.accessToken === undefined) {
             // Still initializing
          } else {
             setIsDataLoading(false);
          }
          return;
      }
      try {
        setIsDataLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${params.poid}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        
        if (!response.ok) throw new Error("Failed to fetch Purchase Order");
        
        const result = await response.json();
        if (result.status !== "success") throw new Error(result.message || "Failed to fetch PO");

        const data = result.data;
        setPoData(data);

        // Map PO items to GRN items
        const mappedItems = data.items.map((item) => {
          const productName = item.product?.name || item.product_name || 'Unknown Product';
          const variantName = item.variant?.name || item.variant?.sku || '';
          const fullName = variantName ? `${productName} - ${variantName}` : productName;

          return {
            poItemId: item.id,
            productId: item.product_id || item.productId,
            productVariantId: item.product_variant_id || item.variantId,
            name: fullName,
            sku: item.variant?.sku || item.product?.sku || item.sku || "",
            orderedQty: Number(item.quantity || item.orderedQty) || 0,
            receivedQty: Number(item.quantity || item.orderedQty) || 0,
            freeQty: 0,
            unitCost: Number(item.unit_cost || item.unitCost || item.unit_price || item.cost) || 0,
            wholesalePrice: 0,
            sellingPrice: Number(item.unit_cost || item.unit_price || item.cost || 0) * 1.25,
            batchNumber: "",
            expiryDate: undefined,
          };
        });
        replace(mappedItems);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Purchase Order details");
      } finally {
        setIsDataLoading(false);
      }
    }
    
    if (status === "authenticated") {
        loadData();
    }
  }, [params.poid, replace, status, session]);

  if (status === "loading" || isDataLoading) {
    return <CreateGRNSkeleton />;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  async function onSubmit(data) {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      if (data.invoiceFile) formData.append("invoiceFile", data.invoiceFile);

      const payload = {
        purchase_order_id: poData.id,
        branch_id: data.branchId,
        supplier_id: poData.supplier?.id || poData.supplier_id,
        grn_date: format(data.grnDate, "yyyy-MM-dd"),
        invoice_number: data.invoiceNumber,
        remarks: data.remarks,
        total_amount: grandTotal,
        items: data.items.map((item) => ({
          product_id: item.productId,
          product_variant_id: item.productVariantId || null,
          quantity_received: item.receivedQty,
          ordered_qty: item.orderedQty,
          free_qty: item.freeQty,
          unit_cost: item.unitCost,
          selling_price: item.sellingPrice,
          wholesale_price: item.wholesalePrice,
          batch_number: item.batchNumber,
          expiry_date: item.expiryDate ? format(item.expiryDate, "yyyy-MM-dd") : null,
        })),
      };

      formData.append("data", JSON.stringify(payload));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to create GRN");
      }

      toast.success("GRN Created Successfully");
      clearSavedData();
      router.push("/purchase/grn"); // Redirect to GRN list
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create GRN");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculations
  const watchedItems = form.watch("items");
  const grandTotal = watchedItems?.reduce((acc, item) => acc + (item.unitCost || 0) * (item.receivedQty || 0), 0) || 0;

  const handleProductSelect = (index, poItemId) => {
    const poItem = poData.items.find((p) => p.id === poItemId);
    if (poItem) {
      const productName = poItem.product?.name || poItem.product_name || 'Unknown Product';
      const variantName = poItem.variant?.name || poItem.variant?.sku || '';
      const fullName = variantName ? `${productName} - ${variantName}` : productName;

      const current = form.getValues(`items.${index}`);
      form.setValue(`items.${index}`, { 
          ...current, 
          poItemId: poItem.id,
          productId: poItem.product_id,
          productVariantId: poItem.product_variant_id,
          name: fullName,
          sku: poItem.variant?.sku || poItem.product?.sku || poItem.sku || "",
          unitCost: Number(poItem.unit_cost || poItem.unit_price || poItem.cost) || 0, 
          orderedQty: Number(poItem.quantity || poItem.orderedQty) || 0,
          receivedQty: Number(poItem.quantity || poItem.orderedQty) || 0 
      });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Linked to {poData?.referenceNo || poData?.po_number}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Process GRN</h1>
        </div>
        <Button variant="outline" asChild className="bg-white">
          <Link href="/purchase/purchase-orders"><ArrowLeft className="mr-2 h-4 w-4" /> Back to PO List</Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1 md:col-span-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supplier</span>
                  <div className="font-medium text-lg">{poData?.supplier?.name || poData?.supplier_name}</div>
                  <div className="text-sm text-gray-500">{poData?.supplier?.email || poData?.supplier_email}</div>
                </div>

                <div className="space-y-1 md:col-span-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Date</span>
                  <div className="font-medium text-base">{poData?.orderDate || poData?.created_at?.split('T')[0]}</div>
                  <div className="text-sm text-gray-500">Ref: {poData?.referenceNo || poData?.po_number}</div>
                </div>

                <div className="space-y-1 md:col-span-1">
                     <FormField
                        control={form.control}
                        name="branchId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Branch <span className="text-red-500">*</span></FormLabel>
                            <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value} 
                                value={field.value}
                                disabled={session?.user?.branches?.length <= 1}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {session?.user?.branches?.map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                </div>

                <div className="md:col-span-1 grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice No <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="e.g. INV-99887" {...field} className="bg-gray-50/30" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="grnDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Received Date <span className="text-red-500">*</span></FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-gray-50/30", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="invoiceFile"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Attach Invoice</FormLabel>
                        <FormControl>
                          <Input {...fieldProps} type="file" accept=".jpg,.png,.pdf" onChange={(e) => onChange(e.target.files && e.target.files[0])} className="cursor-pointer bg-gray-50/30" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-gray-50 border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Received Items</CardTitle>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground block">Total GRN Value</span>
                  <span className="text-2xl font-bold text-gray-900">LKR {grandTotal.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </CardHeader>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 min-w-[200px]">Product</th>
                    <th className="px-4 py-3 w-[100px]">Batch</th>
                    <th className="px-4 py-3 w-[130px]">Expiry</th>
                    <th className="px-4 py-3 w-[80px] text-center bg-yellow-50/50">Ord.</th>
                    <th className="px-4 py-3 w-[100px]">Rec.</th>
                    <th className="px-4 py-3 w-[80px]">Free</th>
                    <th className="px-4 py-3 w-[110px]">Cost</th>
                    <th className="px-4 py-3 w-[110px]">Wholesale</th>
                    <th className="px-4 py-3 w-[110px]">Sell</th>
                    <th className="px-4 py-3 w-[120px] text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, index) => {
                    const qty = form.watch(`items.${index}.receivedQty`) || 0;
                    const ordered = form.watch(`items.${index}.orderedQty`) || 0;
                    const total = qty * (form.watch(`items.${index}.unitCost`) || 0);
                    const isOver = qty > ordered;

                    return (
                      <tr key={field.id} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <RestrictedProductSelect 
                            value={form.watch(`items.${index}.poItemId`)} 
                            availableProducts={poData.items.map(i => {
                              const productName = i.product?.name || i.product_name || 'Unknown Product';
                              const variantName = i.variant?.name || i.variant?.sku || '';
                              const fullName = variantName ? `${productName} - ${variantName}` : productName;

                              return {
                                ...i, 
                                poItemId: i.id,
                                productId: i.product_id || i.productId, 
                                name: fullName, 
                                orderedQty: i.quantity || i.orderedQty
                              };
                            })} 
                            onChange={(val) => handleProductSelect(index, val)} 
                          />
                        </td>
                        <td className="px-4 py-2"><Input className="h-8 text-xs" placeholder="Batch #" {...form.register(`items.${index}.batchNumber`)} /></td>
                        <td className="px-4 py-2">
                           <Input type="date" className="h-8 text-xs" {...form.register(`items.${index}.expiryDate`, { valueAsDate: true })} />
                        </td>
                        <td className="px-4 py-2 text-center bg-yellow-50/30 font-semibold text-gray-700">{ordered}</td>
                        <td className="px-4 py-2">
                          <Input type="number" className={cn("h-8 font-medium", isOver && "border-orange-300 bg-orange-50 text-orange-700")} {...form.register(`items.${index}.receivedQty`)} />
                        </td>
                        <td className="px-4 py-2"><Input type="number" className="h-8 bg-green-50 text-xs" {...form.register(`items.${index}.freeQty`)} /></td>
                        <td className="px-4 py-2"><Input type="number" className="h-8 text-xs" step="0.01" {...form.register(`items.${index}.unitCost`)} /></td>
                        <td className="px-4 py-2"><Input type="number" className="h-8 text-amber-600 font-medium text-xs" step="0.01" {...form.register(`items.${index}.wholesalePrice`)} /></td>
                        <td className="px-4 py-2"><Input type="number" className="h-8 text-blue-600 font-medium text-xs" step="0.01" {...form.register(`items.${index}.sellingPrice`)} /></td>
                        <td className="px-4 py-2 text-right font-medium">{total.toLocaleString("en-LK", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex gap-4 justify-end mt-6">
            <Button variant="destructive" size="lg" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" size="lg" disabled={isSubmitting} className="gap-2 min-w-[150px] bg-gray-900 text-white hover:bg-gray-800">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />} Confirm GRN
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}