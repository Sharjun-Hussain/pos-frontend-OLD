"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronsUpDown,
  Check,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar } from "@/components/ui/calendar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const returnItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productVariantId: z.string().nullable().optional(),
  name: z.string(),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0),
  reason: z.string().optional(),
  batchNumber: z.string().optional(),
});

const formSchema = z.object({
  returnDate: z.date({ required_error: "Date is required" }),
  branchId: z.string().min(1, "Branch is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  purchaseOrderId: z.string().optional(),
  grnId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(returnItemSchema).min(1, "At least one item is required"),
});

export default function CreateReturn() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [grns, setGrns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form Setup
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
        returnDate: new Date(),
        branchId: session?.user?.branch_id || "",
        supplierId: "",
        purchaseOrderId: "",
        grnId: "",
        notes: "",
        items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Fetch PO/GRN Items when selected
  useEffect(() => {
    async function fetchItems() {
        if (!session?.accessToken) return;
        const watchPo = form.watch("purchaseOrderId");
        const watchGrn = form.watch("grnId");

        if (!watchPo && !watchGrn) return;

        try {
            let url = "";
            let items = [];
            
            if (watchPo) {
                url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${watchPo}`;
            } else if (watchGrn) {
                url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn/${watchGrn}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            const result = await res.json();

            if (result.status === 'success') {
                const data = result.data;
                const fetchedItems = (data.items || []).map(item => ({
                    productId: item.product_id,
                    productVariantId: item.product_variant_id || null,
                    name: (item.variant?.name || item.product?.name) || "",
                    quantity: parseFloat(item.quantity_received || item.quantity || 0),
                    unitCost: parseFloat(item.unit_cost || 0),
                    reason: "",
                    batchNumber: item.batch?.batch_number || item.batch_number || ""
                }));

                // Reset items and append new ones
                form.setValue("items", fetchedItems);
                
                // Set supplier if not set
                if (data.supplier_id && !form.getValues("supplierId")) {
                    form.setValue("supplierId", data.supplier_id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch PO/GRN items", error);
            toast.error("Failed to load items from selection");
        }
    }

    const subscription = form.watch((value, { name }) => {
        if (name === "supplierId") {
            // Clear selections when supplier changes
            form.setValue("purchaseOrderId", "");
            form.setValue("grnId", "");
            form.setValue("items", []);
        } else if (name === "purchaseOrderId" && value.purchaseOrderId) {
            form.setValue("grnId", ""); // Mutually exclusive
            fetchItems();
        } else if (name === "grnId" && value.grnId) {
            form.setValue("purchaseOrderId", ""); // Mutually exclusive
            fetchItems();
        }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, session, form.setValue]);

  // Initial Fetch for dropdowns
  useEffect(() => {
    async function fetchData() {
        if (!session?.accessToken) {
            if (status === 'unauthenticated') {
                setLoadingInitial(false);
            }
            return;
        }
        try {
            const [suppliersRes, productsRes, branchesRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=100`, { 
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                })
            ]);

            const suppliersData = await suppliersRes.json();
            const productsData = await productsRes.json();
            if (suppliersData.status === 'success') {
                setSuppliers(suppliersData.data || []);
            }
            if (productsData.status === 'success') {
                setProducts(productsData.data?.data || productsData.data || []);
            }

            if (branchesRes.ok) {
                const branchesData = await branchesRes.json();
                if (branchesData.status === 'success') {
                    setBranches(branchesData.data || []);
                    if (branchesData.data?.length === 1 && !form.getValues("branchId")) {
                        form.setValue("branchId", branchesData.data[0].id);
                    }
                }
            }

        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load initial data");
        } finally {
            setLoadingInitial(false);
        }
    }
    if (status === 'authenticated') {
        fetchData();
    }
  }, [session, status, form]);

  // Watch supplierId for linked docs fetch
  const selectedSupplierId = form.watch("supplierId");

  // Fetch POs and GRNs when Supplier is selected
  useEffect(() => {
    async function fetchLinkedDocs() {
        if (!session?.accessToken || !selectedSupplierId) {
            setPurchaseOrders([]);
            setGrns([]);
            return;
        }

        try {
            const [poRes, grnRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders?supplier_id=${supplierId}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn?supplier_id=${supplierId}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                })
            ]);

            const poData = await poRes.json();
            const grnData = await grnRes.json();

            if (poData.status === 'success') {
                setPurchaseOrders(poData.data?.data || poData.data || []);
            }
            if (grnData.status === 'success') {
                setGrns(grnData.data?.data || grnData.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch linked docs", error);
        }
    }
    fetchLinkedDocs();
  }, [selectedSupplierId, session?.accessToken]);

  const onSubmit = async (data) => {
    try {
        setIsSubmitting(true);
        const payload = {
            return_date: data.returnDate,
            branch_id: data.branchId,
            supplier_id: data.supplierId,
            purchase_order_id: data.purchaseOrderId || null,
            grn_id: data.grnId || null,
            notes: data.notes,
            items: data.items.map(item => ({
                product_id: item.productId,
                product_variant_id: item.productVariantId || null,
                quantity: item.quantity,
                unit_cost: item.unitCost,
                reason: item.reason,
                batch_number: item.batchNumber
            }))
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-returns`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.accessToken}` 
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok || result.status !== 'success') {
            throw new Error(result.message || 'Failed to create return');
        }

        toast.success("Purchase Return Created Successfully");
        router.push("/purchase/returns");

    } catch (error) {
        console.error(error);
        toast.error(error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const addItem = () => {
    append({
        productId: "",
        productVariantId: null,
        name: "",
        quantity: 1,
        unitCost: 0,
        reason: "",
        batchNumber: ""
    });
  };

  const watchPoId = form.watch("purchaseOrderId");
  const watchGrnId = form.watch("grnId");
  const isPoOrGrnSelected = !!(watchPoId || watchGrnId);

  if(!session || loadingInitial) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Create Return</h2>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Return Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="returnDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="branchId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Branch</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" role="combobox" className={cn("justify-between", !field.value && "text-muted-foreground")}>
                                                {field.value ? branches.find((b) => b.id === field.value)?.name : "Select branch"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search branch..." />
                                            <CommandList>
                                                <CommandEmpty>No branch found.</CommandEmpty>
                                                <CommandGroup>
                                                    {branches.map((branch) => (
                                                        <CommandItem key={branch.id} value={branch.name} onSelect={() => form.setValue("branchId", branch.id)}>
                                                            <Check className={cn("mr-2 h-4 w-4", branch.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {branch.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="supplierId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Supplier</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" role="combobox" className={cn("justify-between", !field.value && "text-muted-foreground")}>
                                                {field.value ? suppliers.find((s) => s.id === field.value)?.name : "Select supplier"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search supplier..." />
                                            <CommandList>
                                                <CommandEmpty>No supplier found.</CommandEmpty>
                                                <CommandGroup>
                                                    {suppliers.map((supplier) => (
                                                        <CommandItem key={supplier.id} value={supplier.name} onSelect={() => form.setValue("supplierId", supplier.id)}>
                                                            <Check className={cn("mr-2 h-4 w-4", supplier.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {supplier.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="purchaseOrderId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Purchase Order (Optional)</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" role="combobox" className={cn("justify-between", !field.value && "text-muted-foreground")}>
                                                {field.value ? purchaseOrders.find((p) => p.id === field.value)?.reference_number || field.value : "Select PO"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search PO..." />
                                            <CommandList>
                                                <CommandEmpty>No PO found.</CommandEmpty>
                                                <CommandGroup>
                                                    {purchaseOrders.map((po) => (
                                                        <CommandItem key={po.id} value={po.reference_number} onSelect={() => form.setValue("purchaseOrderId", po.id)}>
                                                            <Check className={cn("mr-2 h-4 w-4", po.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {po.reference_number}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="grnId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>GRN (Optional)</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" role="combobox" className={cn("justify-between", !field.value && "text-muted-foreground")}>
                                                {field.value ? grns.find((g) => g.id === field.value)?.invoice_number || field.value : "Select GRN"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search GRN..." />
                                            <CommandList>
                                                <CommandEmpty>No GRN found.</CommandEmpty>
                                                <CommandGroup>
                                                    {grns.map((grn) => (
                                                        <CommandItem key={grn.id} value={grn.invoice_number} onSelect={() => form.setValue("grnId", grn.id)}>
                                                            <Check className={cn("mr-2 h-4 w-4", grn.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {grn.invoice_number}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Reason for return..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Items</CardTitle>
                    <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border p-4 rounded-md">
                             {/* Product Select - Simplified for V1 */}
                            <div className="md:col-span-4">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.productId`}
                                    render={({ field: itemField }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className={index !== 0 && "sr-only"}>Product</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant="outline" role="combobox" className={cn("justify-between w-full", !itemField.value && "text-muted-foreground")}>
                                                            {itemField.value ? products.find((p) => p.id === itemField.value)?.name || form.getValues(`items.${index}.name`) : "Select product"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search product..." />
                                                        <CommandList>
                                                            <CommandEmpty>No product found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {products.map((product) => (
                                                                    <CommandItem 
                                                                        key={product.id} 
                                                                        value={product.name} 
                                                                        onSelect={() => {
                                                                            form.setValue(`items.${index}.productId`, product.id);
                                                                            form.setValue(`items.${index}.name`, product.name);
                                                                            form.setValue(`items.${index}.unitCost`, product.cost_price || 0);
                                                                        }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", product.id === itemField.value ? "opacity-100" : "opacity-0")} />
                                                                        {product.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.batchNumber`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 && "sr-only"}>Batch #</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Optional" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 && "sr-only"}>Qty</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.unitCost`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className={index !== 0 && "sr-only"}>Cost</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="md:col-span-1">
                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="md:col-span-11 mt-2">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.reason`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="Reason for return (Damaged, Expired, etc.)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </div>
                    ))}
                    {fields.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            No items added. Click "Add Item" to begin.
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Return
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
