"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Save,
  PlusCircle,
  RefreshCw,
  Box,
  Settings2,
  LayoutGrid,
  Check,
  ChevronsUpDown,
  ArrowLeft,
  
  Plus,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MultiSelect } from "@/components/ui/multi-select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";


import { ProductFormSkeleton } from "@/app/skeletons/product-form-skeleton";
import { toast } from "sonner";

// --- ZOD SCHEMA ---
const variantSchema = z.object({
  name: z.string().min(1, "Variant Name is required"),
  sku: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  stock_quantity: z.coerce.number().min(0, "Stock must be positive"),
  is_active: z.boolean().default(true),
  attributes: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional()
});

const formSchema = z.object({
  code: z.string().min(1, "Product Code is required"),
  name: z.string().min(1, "Product Name is required"),
  brand_id: z.string().min(1, "Brand is required"),
  main_category_id: z.string().min(1, "Main Category is required"),
  sub_category_id: z.string().min(1, "Sub Category is required"),
  measurement_id: z.string().min(1, "Measurement Unit is required"),
  unit_id: z.string().min(1, "Unit is required"),
  container_id: z.string().min(1, "Container is required"),
  description: z.string().optional().nullable(), // Allow null for API compatibility
  is_variant: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_active: z.boolean().default(true),
  product_attributes: z.array(z.string()).optional(), // Array of Attribute UUIDs
  supplier_id: z.string().optional(), // Default Supplier ID
  suppliers: z.array(z.string()).optional(), // Multi-Suppliers
});

// --- REUSABLE SEARCHABLE SELECT ---
const SearchableSelect = ({
  form,
  name,
  label,
  options,
  placeholder = "Select...",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>
            {label} <span className="text-red-500">*</span>
          </FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={disabled}
                  aria-expanded={open}
                  className={cn(
                    "w-full justify-between bg-background hover:bg-accent hover:text-accent-foreground",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value
                    ? options.find((item) => item.id === field.value)?.name
                    : placeholder}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder={`Search ${label.toLowerCase()}...`}
                />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((item) => (
                      <CommandItem
                        value={item.name}
                        key={item.id}
                        onSelect={() => {
                          form.setValue(name, item.id);
                          form.clearErrors(name);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            item.id === field.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {item.name}
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
  );
};

// --- MAIN COMPONENT ---
// Accepts initialData prop for Edit Mode
export function ProductForm({ initialData = null }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const isEditing = !!initialData; // Boolean flag to check mode

  // --- API DATA STATE ---
  const [options, setOptions] = useState({
    mainCategories: [],
    subCategories: [],
    brands: [],
    units: [],
    measurements: [],
    containers: [],
    measurements: [],
    containers: [],
    attributes: [],
    suppliers: [], // Added suppliers option
  });

  // --- ATTRIBUTE QUICK-CREATE STATE ---
  const [showAttrDialog, setShowAttrDialog] = useState(false);
  const [newAttrName, setNewAttrName] = useState("");
  const [creatingAttr, setCreatingAttr] = useState(false);

  // --- DELETE CONFIRM STATE ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // --- INIT FORM ---
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          // --- EDIT MODE DEFAULTS ---
          code: initialData.code || "",
          name: initialData.name || "",
          description: initialData.description || "",
          // Ensure these are strings for the Select components (UUIDs)
          brand_id: initialData.brand_id || "",
          main_category_id: initialData.main_category_id || "",
          sub_category_id: initialData.sub_category_id || "",
          measurement_id: initialData.measurement_id || "",
          unit_id: initialData.unit_id || "",
          unit_id: initialData.unit_id || "",
          container_id: initialData.container_id || "",
          supplier_id: initialData.supplier_id || "",
          suppliers: initialData.suppliers?.map(s => s.id) || [], 
          // Ensure booleans
          is_active: Boolean(initialData.is_active),
          product_attributes: initialData.attributes?.map(a => a.id) || [],
        }
      : {
          // --- CREATE MODE DEFAULTS ---
          code: "",
          name: "",
          brand_id: "",
          main_category_id: "",
          sub_category_id: "",
          measurement_id: "",
          unit_id: "",
          container_id: "",
          supplier_id: "",
          suppliers: [],
          description: "",
          is_variant: false,
          is_active: true,
          product_attributes: [],
        },
  });

  const hasVariants = form.watch("is_variant");
  const selectedMainCategory = form.watch("main_category_id");

  // --- FETCH DROPDOWN OPTIONS ---
  // ... (existing code) ...

  // --- RENDER VARIANTS UI ---
  // ... (inside the JSX) ...

  useEffect(() => {
    let isMounted = true;

    const fetchOptions = async () => {
      try {
        const [commonResponse, suppliersResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/common/bulk-options`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.accessToken}`,
            },
          })
        ]);
        
        const commonResult = await commonResponse.json();
        const suppliersResult = await suppliersResponse.json();

        if (isMounted && commonResponse.ok) {
          const { data } = commonResult;
          setOptions({
            mainCategories: data.mainCategories || [],
            subCategories: data.subCategories || [],
            brands: data.brands || [],
            units: data.units || [],
            measurements: data.measurements || [],
            containers: data.containers || [],
            attributes: data.attributes || [],
            suppliers: suppliersResponse.ok ? suppliersResult.data : [],
          });
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch form options:", error);
          toast.error("Network Error", {
            description: "Could not load dropdown options.",
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchOptions();
    }

    return () => {
      isMounted = false;
    };
  }, [session]);

  const handleCreateAttribute = async () => {
    if (!newAttrName.trim() || !session?.accessToken) return;
    setCreatingAttr(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attributes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ name: newAttrName.trim() }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Attribute created");
        // Update local options
        setOptions(prev => ({
          ...prev,
          attributes: [...prev.attributes, result.data].sort((a, b) => a.name.localeCompare(b.name))
        }));
        // Select it
        const current = form.getValues("product_attributes") || [];
        form.setValue("product_attributes", [...current, result.data.id]);
        
        setShowAttrDialog(false);
        setNewAttrName("");
      } else {
        toast.error(result.message || "Failed to create attribute");
      }
    } catch (error) {
      toast.error("Network Error");
    } finally {
      setCreatingAttr(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product?.id || !session?.accessToken) return;
    setDeleting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${product.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        toast.success("Product deleted successfully");
        router.push("/products");
      } else {
        const result = await response.json();
        toast.error(result.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Network Error");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // --- FILTER SUB-CATEGORIES ---
  const filteredSubCategories = useMemo(() => {
    if (!selectedMainCategory) return [];
    return options.subCategories.filter(
      (sub) => sub.main_category_id === selectedMainCategory
    );
  }, [selectedMainCategory, options.subCategories]);

  // Reset Sub Category when Main Category changes (User Interaction Only)
  useEffect(() => {
    // Only reset if we are not loading initial data for the first time
    // We check if the current value matches the filtered list to allow initial load
    const currentSub = form.getValues("sub_category_id");
    if (currentSub && selectedMainCategory) {
      const isValid = filteredSubCategories.find(
        (sub) => sub.id === currentSub
      );
      if (!isValid && filteredSubCategories.length > 0 && !loading) {
        form.setValue("sub_category_id", "");
      }
    }
  }, [
    selectedMainCategory,
    form.setValue,
    form.getValues,
    filteredSubCategories,
    loading,
  ]);

  // --- SUBMIT HANDLER ---
  const handleServerSubmit = async (data, resetAfter = false) => {
    setSubmitting(true);

    if (!session?.accessToken) {
      toast.error("Authentication Error");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...data,
        brand_id: data.brand_id,
        main_category_id: data.main_category_id,
        sub_category_id: data.sub_category_id,
        measurement_id: data.measurement_id,
        unit_id: data.unit_id,
        container_id: data.container_id,
      };

      // --- DYNAMIC URL & METHOD ---
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/products`;

      const method = isEditing ? "PUT" : "POST"; // Use PUT or PATCH based on API

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Failed to ${isEditing ? "update" : "create"} product`
        );
      }

      toast.success(isEditing ? "Product Updated" : "Product Created", {
        description: `${data.name} has been ${
          isEditing ? "updated" : "added"
        }.`,
        duration: 4000,
        icon: "✅",
      });

      if (resetAfter && !isEditing) {
        // Create Mode: Reset and stay
        form.reset({
          code: "",
          name: "",
          description: "",
          is_variant: false,
          is_active: true,
          brand_id: data.brand_id, // Keep previous selections for ease
          main_category_id: data.main_category_id,
          sub_category_id: data.sub_category_id,
          measurement_id: data.measurement_id,
          unit_id: data.unit_id,
          container_id: data.container_id,
        });
        const codeInput = document.querySelector('input[name="code"]');
        if (codeInput) codeInput.focus();
      } else {
        // Edit Mode OR Create & Exit: Go back
        router.push("/products");
      }
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error("Error", {
        description: error.message || "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ProductFormSkeleton />;
  }

  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-4">
      <Form {...form}>
        <form className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {isEditing ? "Edit Product" : "Create Product"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {isEditing
                  ? `Update details for ${initialData?.name || "this product"}.`
                  : "Add a new item to your inventory system."}
              </p>
            </div>
            {!isEditing && (
              <div className="hidden md:flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    form.reset();
                  }}
                  className="bg-background"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* --- LEFT COLUMN (Primary Info) --- */}
            <div className="lg:col-span-8 space-y-8">
              {/* Card 1: Identity */}
              <Card className="border-t-4 border-t-blue-500 shadow-sm py-5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Box className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Product Identity</CardTitle>
                  </div>
                  <CardDescription>
                    Core details used to identify the product.
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      name="code"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Product Code <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="PROD-001"
                              className="bg-background"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="name"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>
                            Product Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Wireless Headphones"
                              className="bg-background"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed product features and specifications..."
                            className="min-h-[80px] bg-background resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Card 2: Classification & Specs */}
              <Card className="border-t-4 border-t-purple-500 shadow-sm py-5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-lg">
                      Classification & Specifications
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Categorization and physical attributes.
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SearchableSelect
                      form={form}
                      name="brand_id"
                      label="Brand"
                      options={options.brands}
                      placeholder="Select Brand"
                    />
                     <SearchableSelect
                      form={form}
                      name="supplier_id"
                      label="Default Supplier"
                      options={options.suppliers}
                      placeholder="Select Supplier"
                    />
                     <FormField
                      control={form.control}
                      name="suppliers"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>All Available Suppliers</FormLabel>
                          <FormControl>
                            <MultiSelect
                              selected={field.value?.map(id => {
                                 const s = options.suppliers.find(op => op.id === id);
                                 return s ? { label: s.name, value: s.id } : null;
                              }).filter(Boolean) || []}
                              options={options.suppliers.map(s => ({ label: s.name, value: s.id }))}
                              onChange={(newItems) => {
                                 field.onChange(newItems.map(item => item.value));
                              }}
                              placeholder="Select suppliers..."
                            />
                          </FormControl>
                          <FormMessage />
                          <FormDescription>
                             Select all suppliers who can provide this product.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    <SearchableSelect
                      form={form}
                      name="main_category_id"
                      label="Main Category"
                      options={options.mainCategories}
                      placeholder="Select Category"
                    />
                    <SearchableSelect
                      form={form}
                      name="sub_category_id"
                      label="Sub Category"
                      options={filteredSubCategories}
                      placeholder={
                        selectedMainCategory
                          ? "Select Sub Category"
                          : "Select Main Category First"
                      }
                      // In edit mode, if main category is set, enable this
                      disabled={!selectedMainCategory}
                    />
                    <SearchableSelect
                      form={form}
                      name="unit_id"
                      label="Base Unit"
                      options={options.units}
                      placeholder="e.g. Piece"
                    />
                    <SearchableSelect
                      form={form}
                      name="measurement_id"
                      label="Measurement"
                      options={options.measurements}
                      placeholder="e.g. Kg"
                    />
                    <SearchableSelect
                      form={form}
                      name="container_id"
                      label="Container Type"
                      options={options.containers}
                      placeholder="e.g. Box"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Attribute Configuration */}
              {hasVariants && (
                <Card className="border-t-4 border-t-amber-500 shadow-sm py-5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-amber-500" />
                        <CardTitle className="text-lg">
                          Attribute Configuration
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => setShowAttrDialog(true)}
                      >
                        <Plus className="h-4 w-4" />
                        New Attribute
                      </Button>
                    </div>
                    <CardDescription>
                      Select which attributes are applicable to this product.
                    </CardDescription>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {options.attributes.map((attr) => (
                        <div
                          key={attr.id}
                          className={cn(
                            "flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors",
                            form.watch("product_attributes")?.includes(attr.id) ? "bg-amber-50 border-amber-200" : "bg-white"
                          )}
                          onClick={() => {
                            const current = form.getValues("product_attributes") || [];
                            const updated = current.includes(attr.id)
                              ? current.filter(id => id !== attr.id)
                              : [...current, attr.id];
                            form.setValue("product_attributes", updated);
                          }}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center",
                            form.watch("product_attributes")?.includes(attr.id) ? "bg-amber-600 border-amber-600 text-white" : "bg-white border-slate-300"
                          )}>
                            {form.watch("product_attributes")?.includes(attr.id) && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-sm font-medium">{attr.name}</span>
                        </div>
                      ))}
                    </div>
                    {options.attributes.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                        No attributes defined. Click "New Attribute" to create one.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Attribute Creation Dialog */}
              <Dialog open={showAttrDialog} onOpenChange={setShowAttrDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Attribute</DialogTitle>
                    <DialogDescription>
                      Add a new attribute type like "Color", "Size", or "Material".
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                       <FormLabel>Attribute Name</FormLabel>
                       <Input 
                        placeholder="e.g. Storage Capacity" 
                        value={newAttrName}
                        onChange={(e) => setNewAttrName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateAttribute();
                          }
                        }}
                       />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowAttrDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={handleCreateAttribute}
                      disabled={creatingAttr || !newAttrName.trim()}
                    >
                      {creatingAttr ? "Creating..." : "Create Attribute"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* --- RIGHT COLUMN (Settings & Actions) --- */}
            <div className="lg:col-span-4 space-y-8">
              <Card className="border-t-4 border-t-green-500 shadow-sm py-5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg">Configuration</CardTitle>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-3 pt-6">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/10">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <FormDescription className="text-xs">
                            Available in POS
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_variant"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/10">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Has Variants
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Size, Color, etc.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="grid gap-3 sticky top-4">
                {/* Only show "Save & Add Another" in Create Mode */}
                {!isEditing && (
                  <Button
                    type="button"
                    size="lg"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg"
                    disabled={submitting}
                    onClick={form.handleSubmit((d) =>
                      handleServerSubmit(d, true)
                    )}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <PlusCircle className="w-4 h-4 mr-2" />
                    )}
                    Save & Add Another
                  </Button>
                )}

                <Button
                  type="button"
                  size="lg"
                  variant={isEditing ? "default" : "secondary"}
                  className={cn(
                    "w-full shadow-sm border",
                    !isEditing
                      ? "bg-white hover:bg-gray-100 text-slate-900"
                      : ""
                  )}
                  disabled={submitting}
                  onClick={form.handleSubmit((d) =>
                    handleServerSubmit(d, false)
                  )}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isEditing ? "Update Product" : "Save Product"}
                </Button>

                {isEditing && (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                    disabled={submitting || deleting}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete Product
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the 
              product and all its variants from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
