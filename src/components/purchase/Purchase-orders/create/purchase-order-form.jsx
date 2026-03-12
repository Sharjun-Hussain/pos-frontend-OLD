"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Check,
  ChevronsUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreatePOSkeleton } from "@/app/skeletons/purchases/create-po-skeleton";
import { CreateSupplierSheet } from "@/components/purchase/suppliers/create-supplier-sheet";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// eslint-disable-next-line no-unused-vars
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";

// --- 2. Zod Schema ---

const itemSchema = z.object({
  productId: z.coerce.string().min(1, "Product is required"),
  unitCost: z.coerce.number().min(0, "Cost must be valid"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  discount: z.coerce.number().min(0).optional().default(0),
  taxRate: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional(),
});

const formSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier."),
  branchId: z.string().min(1, "Please select a branch."),
  orderDate: z.date({ required_error: "Order date is required." }),
  expectedDate: z.date().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
  paymentTerms: z.string().optional(),
  deliveryAddress: z.string().optional(),
});

// --- 3. Helper Component for Product Search (UX Focus) ---
const ProductSelect = ({ value, onChange, products, autoFocus, onSelect }) => {
  const [open, setOpen] = useState(false);

  // Handle both string and number IDs
  const selectedProduct = products.find((p) => String(p.id) === String(value));

  useEffect(() => {
    if (autoFocus) {
      setOpen(true);
    }
  }, [autoFocus]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white border-0 border-b-2 rounded-none shadow-none hover:bg-transparent hover:border-primary/20 focus:border-primary/80 pl-3 text-left font-normal  ",
            !value && "text-muted-foreground"
          )}
        >
          {selectedProduct ? (
            <span className="truncate font-medium">{selectedProduct.fullName || selectedProduct.name}</span>
          ) : (
            "Select product/variant..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or SKU..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {products.map((product, idx) => (
                <CommandItem
                  key={`${product.id}-${idx}`}
                  value={`${product.fullName} ${product.sku || ''} ${product.barcode || ''}`}
                  onSelect={() => {
                    onChange(product.id);
                    setOpen(false);
                    if (onSelect) onSelect();
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      String(value) === String(product.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{product.fullName || product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.code}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        Stock:
                        {/* Optional chaining for null safety as requested */}
                        <span
                          className={cn(
                            "ml-1 font-medium",
                            (product?.stock_quantity || 0) === 0
                              ? "text-red-500"
                              : "text-emerald-500"
                          )}
                        >
                          {product?.stock_quantity ?? "N/A"} units
                        </span>
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {/* Assuming cost_price is available, otherwise 0 */}
                        LKR {(Number(product.cost_price) || 0).toLocaleString()}
                      </span>
                    </div>
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

export default function CreatePurchaseOrder({ initialData }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItemAdded, setNewItemAdded] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  
  // Popover States
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [orderDateOpen, setOrderDateOpen] = useState(false);
  const [expectedDateOpen, setExpectedDateOpen] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);

  // New Feature: Filter by Supplier
  const [filterBySupplier, setFilterBySupplier] = useState(true);

  // Refs for focus management
  const unitCostRef = useRef(null);
  const quantityRef = useRef(null);

  const [branches, setBranches] = useState([]);
  const isSuperAdmin = session?.user?.roles?.includes("Super Admin");
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: initialData?.supplier_id || "",
      branchId: initialData?.branch_id || session?.user?.branch_id || "",
      orderDate: initialData?.order_date
        ? new Date(initialData.order_date)
        : new Date(),
      expectedDate: initialData?.expected_delivery_date
        ? new Date(initialData.expected_delivery_date)
        : undefined,
      reference: initialData?.reference_number || "",
      notes: initialData?.notes || "",
      paymentTerms: initialData?.payment_terms || "",
      deliveryAddress: initialData?.delivery_address || "",
      items: initialData?.items?.map((item) => ({
        productId: item.variant_id || item.product_id, // Handle potential API variations
        unitCost: item.unit_cost,
        quantity: item.quantity_ordered,
        discount: item.discount_percentage,
        taxRate: item.tax_rate,
        notes: item.notes,
      })) || [
        {
          productId: "",
          unitCost: 0,
          quantity: 1,
          discount: 0,
          taxRate: 0,
          notes: "",
        },
      ],
    },
  });

  const { fields, prepend, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) return;
      try {
        setIsLoadingData(true);
        const [suppliersRes, productsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
        ]);

        if (suppliersRes.ok) {
          const data = await suppliersRes.json();
          setSuppliers(data.data || []);
        }
        if (productsRes.ok) {
          const data = await productsRes.json();
          const allProducts = data.data || [];
          
          // Flatten products into variants for easier selection
          const flattened = [];
          allProducts.forEach(product => {
            if (product.variants && product.variants.length > 0) {
              product.variants.forEach(variant => {
                flattened.push({
                  ...variant,
                  productName: product.name,
                  fullName: `${product.name} - ${variant.name || variant.sku || variant.barcode || 'Default'}`,
                  parentProduct: product
                });
              });
            } else {
              // If no variants, add the product itself as a virtual variant
              flattened.push({
                id: product.id,
                name: product.name,
                productName: product.name,
                fullName: product.name,
                sku: product.sku,
                barcode: product.barcode,
                cost_price: product.cost_price || 0,
                parentProduct: product
              });
            }
          });
          setProducts(flattened);
        }

        // Fetch branches if Super Admin
        if (isSuperAdmin) {
          const branchesRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          });
          if (branchesRes.ok) {
            const data = await branchesRes.json();
            setBranches(data.data || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Failed to load required data");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (session?.accessToken) {
      fetchData();
    }
  }, [session?.accessToken, isSuperAdmin]);

  // Keyboard Shortcut: Ctrl + n to add new item
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        prepend({ productId: "", unitCost: 0, quantity: 1 });
        setNewItemAdded(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prepend]);

  // Reset newItemAdded after focus is handled (optional, but good for cleanup)
  useEffect(() => {
    if (newItemAdded) {
      const timer = setTimeout(() => setNewItemAdded(false), 500);
      return () => clearTimeout(timer);
    }
  }, [newItemAdded]);

  // Handle URL Prefill (e.g., from Low Stock Report)
  useEffect(() => {
    if (typeof window === "undefined" || isEditing || hasPrefilled || products.length === 0) return;
    
    const params = new URLSearchParams(window.location.search);
    const variantsParam = params.get("variants");
    
    if (!variantsParam) {
      setHasPrefilled(true);
      return;
    }

    const variantIds = variantsParam.split(",");
    const newItems = variantIds.map(vId => {
      // Find exact variant ID first, falling back to parent product ID
      let p = products.find(prod => String(prod.id) === String(vId));
      
      if (!p) {
        // If not found in exact IDs, check if vId matches a parent product ID. 
        // `products` array contains flattened variants AND pseudo-variants.
        p = products.find(prod => String(prod.parentProduct?.id) === String(vId));
      }

      if (!p) return null;
      return {
        productId: String(p.id), // Ensure we map to the exact internal ID of the flatten structure
        unitCost: Number(p.cost_price) || 0,
        quantity: 1, // Defaulting to 1 to allow user to adjust
        discount: 0,
        taxRate: 0,
        notes: "",
      };
    }).filter(Boolean);

    if (newItems.length > 0) {
      // Optionally pick supplier from the first matched product if not set
      const firstProduct = products.find(prod => String(prod.id) === String(newItems[0].productId));
      if (firstProduct && !form.getValues('supplierId')) {
         const parent = firstProduct.parentProduct || firstProduct;
         const pSupplierId = parent.supplier_id;
         if (pSupplierId) {
             form.setValue("supplierId", String(pSupplierId));
         } else if (parent.suppliers?.length > 0) {
             form.setValue("supplierId", String(parent.suppliers[0].id));
         }
      }

      form.setValue("items", newItems);
      // Turn off filter by supplier out of caution so all pre-selected products show up in the dropdowns.
      setFilterBySupplier(false);
    }
    setHasPrefilled(true);
  }, [products, isEditing, hasPrefilled, form]);

  // Keyboard Shortcut: Ctrl + Enter to submit form
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form, onSubmit]);

  // Calculations
  const watchedItems = form.watch("items");
  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((acc, item) => {
      return acc + (Number(item.unitCost) || 0) * (Number(item.quantity) || 0);
    }, 0);
    const taxRate = 0.0;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, total } = calculateTotals();

  // --- Filtered Products Logic ---
  const selectedSupplierId = form.watch("supplierId");
  
  const filteredProducts = useMemo(() => {
    if (filterBySupplier && selectedSupplierId) {
      // Filter products where product.supplier_id matches
      return products.filter(p => {
        // Check parent product supplier ID (handle string/number mismatch)
        const parent = p.parentProduct || p;
        const pSupplierId = parent.supplier_id || p.supplier_id;
        const pSuppliers = parent.suppliers || [];
        
        const isPrimary = String(pSupplierId) === String(selectedSupplierId);
        const isSecondary = pSuppliers.some(s => String(s.id) === String(selectedSupplierId));
        
        return isPrimary || isSecondary;
      });
    }
    return products;
  }, [products, filterBySupplier, selectedSupplierId]);

  // Auto-fill cost when product is selected
   const handleProductSelect = (index, variantId) => {
    const variant = products.find((p) => String(p.id) === String(variantId));
    if (variant) {
      form.setValue(`items.${index}.productId`, variantId);
      form.setValue(`items.${index}.unitCost`, Number(variant.cost_price) || 0);
      
      // Focus Unit Cost after selection
      if (index === 0 && unitCostRef.current) {
         setTimeout(() => unitCostRef.current.focus(), 100);
      }
    }
  };

  async function onSubmit(data) {
    if (!session?.accessToken) return;
    setIsSubmitting(true);

    try {
      // Construct Payload
      const payload = {
        supplier_id: data.supplierId,
        organization_id: session.user?.organization_id, 
        branch_id: data.branchId || session.user?.branch_id, 
        order_date: format(data.orderDate, "yyyy-MM-dd"),
        expected_delivery_date: data.expectedDate
          ? format(data.expectedDate, "yyyy-MM-dd")
          : null,
        payment_terms: data.paymentTerms || "Net 30",
        delivery_address: data.deliveryAddress || "",
        notes: data.notes || "",
        status: initialData?.status || "pending",
        items: data.items.map((item) => ({
          variant_id: item.productId, // This is the variant ID from the flattened list
          quantity_ordered: Number(item.quantity),
          unit_cost: Number(item.unitCost),
          notes: item.notes || "",
        })),
      };

      console.log("Submitting Payload:", payload);

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `Purchase Order ${isEditing ? "updated" : "created"} successfully!`
        );
        router.push("/purchase/purchase-orders"); // Redirect to list
      } else {
        toast.error(
          result.message ||
            `Failed to ${isEditing ? "update" : "create"} Purchase Order`
        );
        console.error("API Error:", result);
      }
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  function onInvalid(errors) {
    console.log("Form Validation Errors:", errors);
    toast.error("Please check the form for errors.");
    // Optional: Expand specific errors if needed
    if (errors.supplierId) toast.error(errors.supplierId.message);
    if (errors.items) toast.error("Please add valid items to the order.");
  }

  if (isLoadingData) {
    return <CreatePOSkeleton />;
  }

  return (
    <div className="flex-1 space-y-6 p-6 bg-background min-h-screen">
      {/* ── Premium Header ── */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl border border-border/50 bg-card h-10 w-10 shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20">
              <FileSpreadsheet className="w-4.5 h-4.5 text-[#10b981]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                {isEditing ? "Edit Purchase Order" : "Create Purchase Order"}
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80">
                {isEditing ? "Update procurement details" : "New procurement & restocking"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-8"
        >
          {/* --- Top Section: Supplier & Dates --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Supplier Details</CardTitle>
                <CardDescription>Select the vendor and dates.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                {/* Searchable Supplier Dropdown */}
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Supplier</FormLabel>
                      <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? suppliers.find(
                                    (supplier) =>
                                      String(supplier.id) ===
                                      String(field.value)
                                  )?.name
                                : "Select supplier"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search supplier..." />
                            <CommandList>
                              <CommandEmpty className="p-2">
                                <p className="text-sm text-muted-foreground mb-2">No supplier found.</p>
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full gap-2 border-dashed"
                                  onClick={() => setIsCreateSupplierOpen(true)}
                                >
                                  <Plus className="h-4 w-4" />
                                  Create New Supplier
                                </Button>
                              </CommandEmpty>
                              <CommandGroup>
                                <div className="p-1 border-b border-slate-100 mb-1">
                                  <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full justify-start gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => setIsCreateSupplierOpen(true)}
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add New Supplier
                                  </Button>
                                </div>
                                {suppliers.map((supplier) => (
                                  <CommandItem
                                    value={supplier.name}
                                    key={supplier.id}
                                    onSelect={() => {
                                      form.setValue("supplierId", supplier.id);
                                      setSupplierOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        String(supplier.id) ===
                                          String(field.value)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
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

                {isSuperAdmin && (
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a branch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.map((branch) => (
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
                )}

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference No.</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. PO-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Shadcn Calendar - Order Date */}
                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Order Date</FormLabel>
                      <Popover open={orderDateOpen} onOpenChange={setOrderDateOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setOrderDateOpen(false);
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Shadcn Calendar - Expected Date */}
                <FormField
                  control={form.control}
                  name="expectedDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expected Delivery</FormLabel>
                      <Popover
                        open={expectedDateOpen}
                        onOpenChange={setExpectedDateOpen}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setExpectedDateOpen(false);
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card className="lg:col-span-1 border border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Notes & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Net 30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Warehouse address..."
                          className="resize-none min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add private notes..."
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* --- Section 2: Order Items --- */}
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Order Items</CardTitle>
                <CardDescription>Add products to the order.</CardDescription>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Supplier Filter Checkbox */}
                <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                    <Checkbox 
                      id="filterSupplier" 
                      checked={filterBySupplier}
                      onCheckedChange={setFilterBySupplier}
                      disabled={!form.watch("supplierId")}
                    />
                    <label
                      htmlFor="filterSupplier"
                      className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Filter by Supplier
                    </label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 border-dashed"
                  onClick={() => {
                    prepend({ productId: "", unitCost: 0, quantity: 1 });
                    setNewItemAdded(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Table Header - Desktop */}
              <div className="hidden md:grid grid-cols-12 gap-4 mb-4 text-sm font-semibold text-muted-foreground/60 px-2 uppercase tracking-wider">
                <div className="col-span-6">Product Details</div>
                <div className="col-span-2">Unit Cost (LKR)</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2 text-right">Line Total</div>
              </div>

              {/* Dynamic Rows */}
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const isFirstItem = index === 0;
                  const currentCost =
                    form.getValues(`items.${index}.unitCost`) || 0;
                  const currentQty =
                    form.getValues(`items.${index}.quantity`) || 0;
                  const lineTotal = (currentCost * currentQty).toLocaleString(
                    "en-LK",
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  );

                  return (
                    <Collapsible
                      key={field.id}
                      className="border border-border/60 rounded-xl bg-card shadow-sm group"
                    >
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          {/* 1. Product Select (Main Row) */}
                          <div className="col-span-1 md:col-span-5">
                            <FormLabel className="md:hidden mb-2 block">
                              Product
                            </FormLabel>
                            <ProductSelect
                              value={form.watch(`items.${index}.productId`)}
                              products={filteredProducts}
                              autoFocus={isFirstItem && newItemAdded}
                              onChange={(val) =>
                                handleProductSelect(index, val)
                              }
                              onSelect={() => {
                                // Logic handled in handleProductSelect
                              }}
                            />
                          </div>

                          {/* 2. Unit Cost (Main Row) */}
                          <div className="col-span-1 md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.unitCost`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="md:hidden">
                                    Unit Cost
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">
                                        LKR
                                      </span>
                                      <Input
                                        type="number"
                                        className="pl-9"
                                        min="0"
                                        step="0.01"
                                        {...field}
                                        ref={isFirstItem ? unitCostRef : null}
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (quantityRef.current) {
                                              quantityRef.current.focus();
                                            }
                                          }
                                        }}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* 3. Quantity (Main Row) */}
                          <div className="col-span-1 md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="md:hidden">
                                    Quantity
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="1" 
                                      {...field} 
                                      ref={isFirstItem ? quantityRef : null}
                                      onFocus={(e) => e.target.select()}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          prepend({ productId: "", unitCost: 0, quantity: 1 });
                                          setNewItemAdded(true);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* 4. Line Total & Actions (Main Row) */}
                          <div className="col-span-1 md:col-span-3 flex items-center justify-between md:justify-end gap-3 mt-2 md:mt-0">
                            {/* Line Total Display */}
                            <div className="text-right mr-2">
                              <span className="text-xs text-muted-foreground md:hidden">
                                Total:{" "}
                              </span>
                              <span className="font-semibold text-foreground">
                                {lineTotal}
                              </span>
                            </div>

                            {/* Toggle Details Button */}
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                className="p-0 h-8 w-8 hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180"
                              >
                                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                                <span className="sr-only">Toggle details</span>
                              </Button>
                            </CollapsibleTrigger>

                            {/* Delete Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* --- EXPANDABLE SECTION (Accordion) --- */}
                      <CollapsibleContent className="bg-muted/20 border-t border-border/30 px-4 py-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Discount Field */}
                          <FormField
                            control={form.control}
                            name={`items.${index}.discount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">
                                  Discount (%)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="bg-background h-9"
                                    placeholder="0"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {/* Tax Rate Field */}
                          <FormField
                            control={form.control}
                            name={`items.${index}.taxRate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">
                                  Tax Rate (%)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="bg-background h-9"
                                    placeholder="0"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {/* Item Specific Notes */}
                          <div className="md:col-span-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.notes`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">
                                    Item Note
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Specific details for this item (e.g. Size L, Blue)"
                                      className="bg-background h-9"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>



              {/* Summary Section */}
              <div className="mt-8 flex justify-end">
                <div className="w-full md:w-1/3 bg-card p-6 rounded-xl border border-border/50 shadow-sm space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      LKR{" "}
                      {subtotal.toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <Separator />
                  <div className="flex justify-between text-xl font-bold text-foreground">
                    <span>Total</span>
                    <span>
                      LKR{" "}
                      {total.toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Footer Actions ── */}
          <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-card/80 backdrop-blur-md p-4 border-t border-border/50 -mx-6 -mb-6 shadow-lg md:static md:bg-transparent md:backdrop-blur-none md:border-0 md:shadow-none md:p-0 md:mx-0 md:mb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="gap-2 rounded-xl border-border/60"
            >
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button type="button" variant="secondary" className="gap-2 rounded-xl">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button
              type="submit"
              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {isEditing ? "Update Purchase Order" : "Submit Purchase Order"}
            </Button>
          </div>
        </form>
      </Form>

      <CreateSupplierSheet 
        open={isCreateSupplierOpen} 
        onOpenChange={setIsCreateSupplierOpen}
        onSuccess={(newSupplier) => {
          setSuppliers(prev => [newSupplier, ...prev]);
          form.setValue("supplierId", newSupplier.id);
          setSupplierOpen(false);
        }}
      />
    </div>
  );
}
