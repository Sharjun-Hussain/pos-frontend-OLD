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
  Plus,
  Trash2,
  Zap,
  History,
  Palette,
  QrCode,
  Camera,
  Upload,
  ArrowLeft,
  CircleDot,
  Search,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { ProductFormSkeleton } from "@/app/skeletons/products/product-form-skeleton";

import { toast } from "sonner";
import { useFormRestore } from "@/hooks/use-form-restore";

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
  product_attributes: z.array(z.string()).optional(),
  supplier_id: z.string().optional(),
  suppliers: z.array(z.string()).optional(),
});

const SettingsCard = ({
  label,
  description,
  isActive,
  onToggle,
  icon: Icon,
}) => (
  <div
    className={cn(
      "flex items-center justify-between rounded-2xl border p-5 transition-all duration-300",
      isActive
        ? "border-emerald-500/20 bg-emerald-500/3 shadow-sm shadow-emerald-500/5 ring-1 ring-emerald-500/10"
        : "border-border/60 bg-muted/20 hover:bg-muted/40"
    )}
  >
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "size-10 rounded-xl flex items-center justify-center border transition-all duration-300",
          isActive
            ? "bg-emerald-500/10 border-emerald-500/20 shadow-sm shadow-emerald-500/10"
            : "bg-muted/50 border-border/40"
        )}
      >
        <Icon
          className={cn(
            "size-4.5 transition-colors duration-300",
            isActive ? "text-emerald-600" : "text-muted-foreground/40"
          )}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[13px] font-bold tracking-tight cursor-pointer text-foreground leading-tight">{label}</Label>
        <p className="text-[11px] text-muted-foreground/60 font-medium">{description}</p>
      </div>
    </div>
    <Switch
      checked={isActive}
      onCheckedChange={onToggle}
      className={cn(
        isActive && "ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/10"
      )}
    />
  </div>
);

// --- REUSABLE SEARCHABLE SELECT ---
const SearchableSelect = ({
  form,
  name,
  label,
  options,
  placeholder = "Select...",
  disabled = false,
  icon: Icon = CircleDot,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2.5">
          <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
            {label}
          </FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={disabled}
                  className={cn(
                    "h-12 w-full justify-between bg-background border-border/60 rounded-xl px-4 font-bold tracking-tight text-[13px] shadow-sm transition-all focus:ring-emerald-500/20",
                    !field.value && "text-muted-foreground/40 font-medium"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("size-4 opacity-40", field.value && "text-emerald-600 opacity-100")} />
                    {field.value
                      ? options.find((item) => item.id === field.value)?.name
                      : placeholder}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-20" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 rounded-2xl border-border/60 shadow-2xl overflow-hidden" align="start">
              <Command className="bg-popover/90 backdrop-blur-xl">
                <CommandInput
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="h-12 border-none focus:ring-0 font-bold"
                />
                <CommandList className="max-h-[300px] scrollbar-thin">
                  <CommandEmpty className="py-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">No results found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((item) => (
                      <CommandItem
                        value={item.name}
                        key={item.id}
                        className="py-3 px-4 flex items-center justify-between cursor-pointer aria-selected:bg-emerald-500/10 aria-selected:text-emerald-600 transition-colors"
                        onSelect={() => {
                          form.setValue(name, item.id);
                          form.clearErrors(name);
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "size-2 rounded-full transition-all",
                            item.id === field.value ? "bg-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/20"
                          )} />
                          <span className="font-bold tracking-tight">{item.name}</span>
                        </div>
                        {item.id === field.value && (
                          <Check className="size-4 text-emerald-600 animate-in zoom-in-50 duration-300" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage className="text-[10px] font-bold text-red-500/80 ml-1 uppercase tracking-widest" />
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

  const { clearSavedData } = useFormRestore(form);

  const hasVariants = form.watch("is_variant");
  const selectedMainCategory = form.watch("main_category_id");

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
    if (!initialData?.id || !session?.accessToken) return;
    setDeleting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${initialData.id}`, {
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
        clearSavedData();
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
        clearSavedData();
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
    <div className="min-h-screen bg-background p-4 md:px-8 md:pt-4 md:pb-12">
      <div className="fixed inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.1),rgba(0,0,0,0))]"></div>
      </div>
      <Form {...form}>
        <form className="max-w-[1400px] mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                  <PlusCircle className="size-7 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-black tracking-tight text-foreground leading-none capitalize">
                    {isEditing ? "Edit Product" : "Add New Product"}
                  </h1>
                  <p className="text-muted-foreground/60 text-[11px] font-bold uppercase tracking-widest mt-2">
                    {isEditing
                      ? "Update Details"
                      : "Create Product"}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={submitting}
                    onClick={form.handleSubmit((d) =>
                      handleServerSubmit(d, true)
                    )}
                    className="h-12 px-6 rounded-xl border-border/60 bg-muted/20 hover:bg-muted/40 font-bold uppercase text-[10px] tracking-widest transition-all"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-3 opacity-60" />
                    ) : (
                      <PlusCircle className="w-4 h-4 mr-3 opacity-60" />
                    )}
                    Save & Continue
                  </Button>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  onClick={form.handleSubmit((d) =>
                    handleServerSubmit(d, false)
                  )}
                  className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-3 opacity-60" />
                  ) : (
                    <Save className="w-4 h-4 mr-3 opacity-60" />
                  )}
                  {isEditing ? "Finalize Changes" : "Save Product"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-4">
              {/* Card 1: Identity */}
              <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Box className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-[15px] font-black tracking-tight">Main Details</CardTitle>
                      <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">Product Identification</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 grid gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      name="code"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="space-y-2.5">
                          <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
                            Product Code
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="PROD-001"
                              className="h-12 bg-background border-border/60 rounded-xl px-4 font-bold tracking-tight text-[13px] shadow-sm focus:ring-emerald-500/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold text-red-500/80 ml-1 uppercase tracking-widest" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="name"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="space-y-2.5">
                          <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
                            Product Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Wireless Headphones"
                              className="h-12 bg-background border-border/60 rounded-xl px-4 font-bold tracking-tight text-[13px] shadow-sm focus:ring-emerald-500/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold text-red-500/80 ml-1 uppercase tracking-widest" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="space-y-2.5">
                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed product features and specifications..."
                            className="min-h-[100px] bg-background border-border/60 rounded-2xl px-4 py-3 font-bold tracking-tight text-[13px] shadow-sm focus:ring-emerald-500/20 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold text-red-500/80 ml-1 uppercase tracking-widest" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Card 2: Classification & Specs */}
              <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <LayoutGrid className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-[15px] font-black tracking-tight">Classification</CardTitle>
                      <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">Categorization & Measurements</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SearchableSelect
                      form={form}
                      name="brand_id"
                      label="Brand"
                      options={options.brands}
                      placeholder="Select Brand"
                      icon={Palette}
                    />
                     <SearchableSelect
                      form={form}
                      name="supplier_id"
                      label="Main Supplier"
                      options={options.suppliers}
                      placeholder="Select Supplier"
                      icon={History}
                    />
                     <FormField
                      control={form.control}
                      name="suppliers"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2 space-y-2.5">
                          <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Supplier Network</FormLabel>
                          <FormControl>
                            <MultiSelect
                              className="rounded-xl border-border/60 bg-background shadow-sm"
                              selected={field.value?.map(id => {
                                 const s = options.suppliers.find(op => op.id === id);
                                 return s ? { label: s.name, value: s.id } : null;
                              }).filter(Boolean) || []}
                              options={options.suppliers.map(s => ({ label: s.name, value: s.id }))}
                              onChange={(newItems) => {
                                 field.onChange(newItems.map(item => item.value));
                              }}
                              placeholder="Connect multiple suppliers..."
                            />
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold text-red-500/80 ml-1 uppercase tracking-widest" />
                        </FormItem>
                      )}
                    />
                    <SearchableSelect
                      form={form}
                      name="main_category_id"
                      label="Main Category"
                      options={options.mainCategories}
                      placeholder="Select Category"
                      icon={LayoutGrid}
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
                      disabled={!selectedMainCategory}
                      icon={CircleDot}
                    />
                    <SearchableSelect
                      form={form}
                      name="unit_id"
                      label="Base Unit"
                      options={options.units}
                      placeholder="e.g. Piece"
                      icon={QrCode}
                    />
                    <SearchableSelect
                      form={form}
                      name="measurement_id"
                      label="Measurement"
                      options={options.measurements}
                      placeholder="e.g. Kg"
                      icon={Palette}
                    />
                    <SearchableSelect
                      form={form}
                      name="container_id"
                      label="Container Type"
                      options={options.containers}
                      placeholder="e.g. Box"
                      icon={Box}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Attribute Configuration */}
              {hasVariants && (
                <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                  <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Settings2 className="size-4 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-[15px] font-black tracking-tight">Attributes</CardTitle>
                          <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">Product Variations</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 font-bold uppercase text-[9px] tracking-widest transition-all"
                        onClick={() => setShowAttrDialog(true)}
                      >
                        <Plus className="h-3 w-3 mr-1.5" />
                        Add New
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {options.attributes.map((attr) => (
                        <div
                          key={attr.id}
                          className={cn(
                            "group flex items-center justify-between border rounded-xl p-3 cursor-pointer transition-all duration-300",
                            form.watch("product_attributes")?.includes(attr.id) 
                              ? "bg-emerald-500/10 border-emerald-500/20 shadow-sm shadow-emerald-500/10" 
                              : "bg-background border-border/60 hover:bg-muted/20"
                          )}
                          onClick={() => {
                            const current = form.getValues("product_attributes") || [];
                            const updated = current.includes(attr.id)
                              ? current.filter(id => id !== attr.id)
                              : [...current, attr.id];
                            form.setValue("product_attributes", updated);
                          }}
                        >
                          <span className={cn(
                            "text-[12px] font-bold tracking-tight transition-colors",
                            form.watch("product_attributes")?.includes(attr.id) ? "text-emerald-700" : "text-muted-foreground/60 group-hover:text-foreground"
                          )}>{attr.name}</span>
                          <div className={cn(
                            "size-5 rounded-lg border flex items-center justify-center transition-all",
                            form.watch("product_attributes")?.includes(attr.id) ? "bg-emerald-500 border-emerald-500/20 text-white scale-110 shadow-lg shadow-emerald-500/20" : "bg-muted/50 border-border/40"
                          )}>
                            {form.watch("product_attributes")?.includes(attr.id) && <Check className="size-3" />}
                          </div>
                        </div>
                      ))}
                    </div>
                    {options.attributes.length === 0 && (
                      <div className="text-center py-10 rounded-2xl border-2 border-dashed border-border/40 bg-muted/10">
                        <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border/40">
                          <Settings2 className="size-6 text-muted-foreground/30" />
                        </div>
                        <p className="text-[13px] font-bold text-foreground">No attributes available</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">Add attributes to enable product variants</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Attribute Creation Dialog */}
              <Dialog open={showAttrDialog} onOpenChange={setShowAttrDialog}>
                <DialogContent className="sm:max-w-md rounded-3xl border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl">
                  <DialogHeader>
                    <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-sm shadow-emerald-500/10">
                      <Settings2 className="size-6 text-emerald-600" />
                    </div>
                    <DialogTitle className="text-xl font-black tracking-tight">New Attribute</DialogTitle>
                    <DialogDescription className="text-[12px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                      Add a new characteristic for variant management
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-6">
                    <FormItem className="space-y-2.5">
                       <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Attribute Name</FormLabel>
                       <FormControl>
                          <Input 
                            placeholder="e.g. Storage Capacity" 
                            className="h-12 bg-background border-border/60 rounded-xl px-4 font-bold tracking-tight text-[13px] shadow-sm focus:ring-emerald-500/20"
                            value={newAttrName}
                            onChange={(e) => setNewAttrName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateAttribute();
                              }
                            }}
                          />
                       </FormControl>
                    </FormItem>
                  </div>
                  <DialogFooter className="gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all"
                      onClick={() => setShowAttrDialog(false)}
                    >
                      Dismiss
                    </Button>
                    <Button 
                      type="button"
                      className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                      onClick={handleCreateAttribute}
                      disabled={creatingAttr || !newAttrName.trim()}
                    >
                      {creatingAttr ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-3" />
                      ) : (
                        <Check className="w-4 h-4 mr-3" />
                      )}
                      Save Attribute
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Card 4: Product Images (Asset Hub) */}
              <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Camera className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-[15px] font-black tracking-tight">Product Images</CardTitle>
                      <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">Gallery Assets</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-border/40 bg-muted/10">
                    <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border/40">
                      <Camera className="size-7 text-muted-foreground/30" />
                    </div>
                    <p className="text-[13px] font-bold text-foreground">Awaiting Media Integration</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1 px-8 text-center leading-relaxed">
                      Image upload functionality for main products is typically managed through variants. 
                      However, you can upload primary gallery assets here once enabled.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-6 rounded-xl border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 font-bold uppercase text-[9px] tracking-widest transition-all"
                      disabled
                    >
                      <Upload className="size-3 mr-2" />
                      Add Primary Photo
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-4 border-t border-border/40 mt-5">
                    {[
                      "Primary image will be the default view for all variants",
                      "Supports high-fidelity formats: JPG, PNG, WebP",
                      "Recommended minimum resolution: 1000x1000px"
                    ].map((hint, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="size-1 rounded-full bg-emerald-500/30" />
                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{hint}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4">
              {/* Variant History - Placeholder for Consistency */}
              <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <History className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-[15px] font-black tracking-tight">Status & Protocol</CardTitle>
                      <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">Control Panel</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <SettingsCard
                        label="Active Status"
                        description="Available in POS"
                        icon={Zap}
                        isActive={field.value}
                        onToggle={field.onChange}
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_variant"
                    render={({ field }) => (
                      <SettingsCard
                        label="Has Variants"
                        description="Size, Color, etc."
                        icon={Palette}
                        isActive={field.value}
                        onToggle={field.onChange}
                      />
                    )}
                  />
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border border-emerald-500/10 shadow-xl shadow-emerald-500/2 rounded-3xl overflow-hidden bg-emerald-500/2 backdrop-blur-sm p-0 gap-0">
                <CardHeader className="pb-2.5 bg-emerald-500/3 border-b border-emerald-500/10 px-6 pt-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Zap className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-[15px] font-black tracking-tight">Quick Actions</CardTitle>
                      <p className="text-[11px] text-emerald-600/60 font-bold uppercase tracking-wider">Tools & Navigation</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-14 bg-background/50 border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/20 rounded-2xl transition-all group px-5"
                    onClick={() => form.reset()}
                    disabled={submitting}
                  >
                    <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform mr-4 shadow-sm">
                      <RefreshCw className="size-4 text-emerald-600 group-hover:rotate-180 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-black uppercase tracking-widest text-foreground leading-none">Reset Form</span>
                      <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Clear all inputs</span>
                    </div>
                  </Button>

                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start h-14 bg-red-500/5 border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 rounded-2xl transition-all group px-5"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={submitting || deleting}
                    >
                      <div className="size-9 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform mr-4 shadow-sm">
                        <Trash2 className="size-4 text-red-600" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-[11px] font-black uppercase tracking-widest text-red-600 leading-none">Delete Product</span>
                        <span className="text-[9px] font-bold text-red-600/60 uppercase tracking-widest mt-1">Permanent removal</span>
                      </div>
                    </Button>
                  )}

                  <Separator className="bg-emerald-500/10" />
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-center h-12 text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="size-4 mr-3 opacity-40" />
                    Revert to List
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-3xl border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader>
            <div className="size-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4 shadow-sm shadow-red-500/10 mx-auto">
              <Trash2 className="size-7 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-black tracking-tight text-center">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] font-medium text-muted-foreground/60 text-center leading-relaxed">
              This action cannot be undone. This will permanently delete the 
              product and all its variants from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-6">
            <AlertDialogCancel disabled={deleting} className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-border/60">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
              className="h-12 px-8 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95 border-none"
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-3" />
              ) : (
                <Trash2 className="w-4 h-4 mr-3" />
              )}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
