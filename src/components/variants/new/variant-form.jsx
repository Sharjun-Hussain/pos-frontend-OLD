"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Save,
  PlusCircle,
  RefreshCw,
  Box,
  ArrowLeft,
  QrCode,
  Search,
  Barcode,
  Upload,
  X,
  History,
  ImagePlus,
  Check,
  ChevronRight,
  Palette,
  Camera,
  Zap,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useFormRestore } from "@/hooks/use-form-restore";
import { useSession } from "next-auth/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  fetchTaxes,
} from "@/utils/frontend-api-functions";
import { useRouter } from "next/navigation";
import { ProductFormSkeleton } from "@/app/skeletons/products/product-form-skeleton";
import FileUpload from "@/components/common/file-upload";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

// --- ZOD SCHEMA ---
const variantFormSchema = z.object({
  product_id: z.string().min(1, "Parent Product is required"),
  sku: z.string().min(1, "SKU is required"),
  code: z.string().min(1, "Code is required"),
  barcode: z.string().optional(),
  price: z.coerce.number().min(0).default(0),
  wholesale_price: z.coerce.number().min(0).default(0),
  cost_price: z.coerce.number().min(0).default(0),
  stock_quantity: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
  images: z.any().optional(),
  attributes: z.array(z.object({
    attribute_id: z.string(),
    name: z.string(),
    value: z.string()
  })).optional()
});

// --- COMPONENT: EXISTING VARIANTS LIST ---
const ExistingVariantsList = ({ variants }) => {
  if (!variants || variants.length === 0) {
    return (
      <div className="p-10 text-center bg-muted/20 border border-dashed border-border/60 rounded-2xl m-4">
        <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-muted/50 mb-4 border border-border/40 shadow-sm">
          <Box className="size-5 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold text-foreground tracking-tight">No variants created yet</p>
        <p className="text-[11px] text-muted-foreground/60 font-medium mt-1">
          Start by creating your first variant
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[350px]">
      <Table>
        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <TableRow className="hover:bg-transparent border-border/40">
            <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              Variant Code
            </TableHead>
            <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              Attributes
            </TableHead>
            <TableHead className="h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((v) => (
            <TableRow key={v.id} className="hover:bg-muted/30 border-border/40 group transition-colors">
              <TableCell className="py-4">
                <div className="font-semibold text-[13px] text-foreground tracking-tight group-hover:text-emerald-600 transition-colors">{v.code}</div>
                <div className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">{v.sku}</div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex flex-wrap gap-1.5">
                  {v.attribute_values?.map((av, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-black uppercase tracking-wider bg-muted/50 text-muted-foreground/70 border-border/40">
                      <span className="opacity-40 mr-1">{av.attribute?.name}:</span>
                      {av.value}
                    </Badge>
                  ))}
                  {(!v.attribute_values || v.attribute_values.length === 0) && (
                    <span className="text-[11px] text-muted-foreground/40 italic">No attributes</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-4 text-right">
                <Badge
                  variant={v.is_active ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md transition-all",
                    v.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-sm shadow-emerald-500/10" : "opacity-40"
                  )}
                >
                  {v.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

// --- COMPONENT: SETTINGS CARD ---
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
        ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/20" 
        : "border-border bg-muted/30 hover:bg-muted/50"
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

export function ProductVariantForm({ initialData = null }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parentProducts, setParentProducts] = useState([]);
  const [detailedParent, setDetailedParent] = useState(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Multiple Image State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const { data: session } = useSession();
  const router = useRouter();
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(variantFormSchema),
    defaultValues: initialData
      ? { ...initialData, images: [] }
      : {
          product_id: "",
          sku: "",
          code: "",
          barcode: "",
          price: 0,
          wholesale_price: 0,
          cost_price: 0,
          stock_quantity: 0,
          description: "",
          is_active: true,
          is_default: false,
          images: [],
          attributes: [],
        },
  });

  const { clearSavedData } = useFormRestore(form);

  const selectedProductId = form.watch("product_id");

  // Fetch Parent Products
  useEffect(() => {
    let isMounted = true;
    const fetchList = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list`,
          {
            headers: { Authorization: `Bearer ${session?.accessToken}` },
          }
        );
        const json = await res.json();
        if (isMounted && json.data) setParentProducts(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (session?.accessToken) fetchList();
    return () => {
      isMounted = false;
    };
  }, [session]);

  // Fetch Parent Details when product is selected
  useEffect(() => {
    const fetchParentDetails = async () => {
      if (!selectedProductId) {
        setDetailedParent(null);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${selectedProductId}`,
          {
            headers: { Authorization: `Bearer ${session?.accessToken}` },
          }
        );
        const json = await res.json();
        if (json.status === "success") {
          setDetailedParent(json.data);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load product details");
      }
    };

    if (selectedProductId) {
      fetchParentDetails();
    }
  }, [selectedProductId, session]);

  // Sync attributes when detailedParent changes
  useEffect(() => {
    if (detailedParent && detailedParent.attributes) {
      const currentAttrs = form.getValues("attributes") || [];
      const newAttrs = detailedParent.attributes.map(attr => {
        const existing = currentAttrs.find(a => a.attribute_id === attr.id);
        return {
          attribute_id: attr.id,
          name: attr.name,
          value: existing ? existing.value : ""
        };
      });
      form.setValue("attributes", newAttrs);
    }
  }, [detailedParent, form]);

  // --- MULTIPLE IMAGE HANDLERS ---
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 10); // Limit to 10 files
      setSelectedFiles(updatedFiles);
      form.setValue("images", updatedFiles);

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews].slice(0, 10));
    }
  };

  const removeImage = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
    form.setValue("images", updatedFiles);
  };

  // Populate image previews for existing variant
  useEffect(() => {
    if (initialData && initialData.image) {
      try {
        const images = JSON.parse(initialData.image);
        if (Array.isArray(images)) {
          setImagePreviews(images.map(path => `${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${path}`));
        } else {
          setImagePreviews([`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${initialData.image}`]);
        }
      } catch (e) {
        // If not JSON, it's a single path string
        setImagePreviews([`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${initialData.image}`]);
      }
    }
  }, [initialData]);

  const generateUniqueSKU = () => {
    if (!detailedParent) {
      toast.error("Please select a parent product first");
      return;
    }
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const parentCode = detailedParent?.code || "VAR";
    const code = `${parentCode}-${timestamp}`;
    const sku = `${parentCode}-${timestamp}-${random}`;
    form.setValue("code", code);
    form.setValue("sku", sku);
  };

  const handleServerSubmit = async (data, resetAfter = false) => {
    setSubmitting(true);
    if (!session?.accessToken) return;

    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (key === "images") return;

        if (key === "attributes") {
          formData.append(key, JSON.stringify(value));
          return;
        }

        if (typeof value === "boolean") {
          formData.append(key, value ? "1" : "0");
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      selectedFiles.forEach((file) => {
        formData.append("images[]", file);
      });

      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${data.product_id}/variants/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${data.product_id}/variants`;

      if (isEditing) {
        formData.append("_method", "PUT");
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      toast.success(isEditing ? "Variant Updated" : "Variant Created");

      if (resetAfter && !isEditing) {
        clearSavedData();
        form.reset({
          ...data,
          sku: "",
          code: "",
          barcode: "",
          description: "",
          images: [],
        });
        setSelectedFiles([]);
        setImagePreviews([]);
      } else {
        clearSavedData();
        router.push("/variants");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save variant");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ProductFormSkeleton />;

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
                    {isEditing ? "Edit Variant" : "Add New Variant"}
                  </h1>
                  <p className="text-muted-foreground/60 text-[11px] font-bold uppercase tracking-widest mt-2">
                    {isEditing
                      ? "Update Details"
                      : "Create Variant"}
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
                  className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 border-none transition-all active:scale-95"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-3" />
                  ) : (
                    <Save className="w-4 h-4 mr-3" />
                  )}
                  {isEditing ? "Commit Changes" : "Finalize Variant"}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-4">
              {/* Parent Product Selection */}
              <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Box className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-[15px] font-black tracking-tight">Parent Product</CardTitle>
                      <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">Product Information</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  {detailedParent ? (
                    <div className="bg-emerald-500/3 border border-emerald-500/20 rounded-2xl p-5 shadow-sm shadow-emerald-500/2 flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                        <div className="size-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                          <Box className="size-6 text-emerald-600" />
                        </div>
                        <div className="flex flex-col">
                          <h4 className="font-black text-base text-foreground tracking-tight leading-none group-hover:text-emerald-600 transition-colors">
                            {detailedParent.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/40 bg-muted/50 px-2 py-0.5 rounded-md border border-border/40">
                              {detailedParent.code}
                            </span>
                            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600/70 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                              {detailedParent.variants?.length || 0} variants
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          form.setValue("product_id", 0);
                          setDetailedParent(null);
                        }}
                        className="text-[11px] font-black uppercase tracking-widest text-emerald-600 decoration-emerald-600/30 hover:decoration-emerald-600 transition-all hover:translate-x-1"
                      >
                        Change <ChevronRight className="size-3 ml-1" />
                      </Button>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="product_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1">
                            Identification Search
                          </FormLabel>
                          <Popover
                            open={isPopoverOpen}
                            onOpenChange={setIsPopoverOpen}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isPopoverOpen}
                                  className={cn(
                                    "w-full h-14 justify-between text-left font-bold tracking-tight bg-background/50 border-border/60 rounded-2xl hover:bg-muted/30 focus:ring-emerald-500/20 text-base shadow-sm ring-offset-background",
                                    !field.value && "text-muted-foreground/40 font-medium"
                                  )}
                                >
                                  {field.value
                                    ? parentProducts.find(
                                        (p) => p.id === field.value
                                      )?.name
                                    : "Scan or search catalog products..."}
                                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 ml-2 animate-pulse">
                                    <Search className="size-4 shrink-0 text-emerald-600" />
                                  </div>
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[500px] p-0 rounded-2xl border-border shadow-2xl bg-background/95 backdrop-blur-xl"
                              align="start"
                            >
                              <Command className="rounded-2xl">
                                <CommandInput
                                  placeholder="Type name, SKU, or master code..."
                                  className="h-14 font-semibold tracking-tight"
                                />
                                <CommandList className="max-h-[400px]">
                                  <CommandEmpty className="py-10 text-center">
                                    <div className="inline-flex size-12 rounded-2xl bg-muted/50 items-center justify-center mb-4">
                                      <Search className="size-5 text-muted-foreground/40" />
                                    </div>
                                    <p className="text-[13px] font-bold text-foreground">No matches found</p>
                                    <p className="text-[11px] text-muted-foreground/60 mt-1">Try a different keyword</p>
                                  </CommandEmpty>
                                  <CommandGroup className="px-2 pb-2">
                                    {parentProducts.map((product) => (
                                      <CommandItem
                                        value={`${product.name} ${product.code}`}
                                        key={product.id}
                                        onSelect={() => {
                                          form.setValue(
                                            "product_id",
                                            product.id
                                          );
                                          setIsPopoverOpen(false);
                                        }}
                                        className="h-14 cursor-pointer rounded-xl px-4 m-1 hover:bg-emerald-500/10 hover:text-emerald-600 transition-all group"
                                      >
                                        <div className={cn(
                                          "mr-4 size-6 rounded-lg flex items-center justify-center border transition-all",
                                          product.id === field.value 
                                            ? "bg-emerald-500/20 border-emerald-500/40" 
                                            : "bg-muted border-border/60 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20"
                                        )}>
                                          <Check
                                            className={cn(
                                              "size-3.5",
                                              product.id === field.value
                                                ? "opacity-100 text-emerald-600"
                                                : "opacity-0"
                                            )}
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <div className="font-bold tracking-tight group-hover:translate-x-1 transition-transform">
                                            {product.name}
                                          </div>
                                          <div className="text-[10px] font-black tracking-widest uppercase opacity-40 mt-0.5 group-hover:opacity-60 transition-opacity">
                                            {product.code}
                                          </div>
                                        </div>
                                        <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/40 bg-muted group-hover:bg-emerald-500/20 group-hover:text-emerald-700 px-2 py-0.5 rounded-md border border-border/40 transition-all">
                                          {product.variants?.length || 0} VAR
                                        </div>
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
                  )}
                </CardContent>
              </Card>

                {/* Variant Details */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Attributes Section */}
                  <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                    <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Palette className="size-4 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-[15px] font-black tracking-tight">Variant Attributes</CardTitle>
                          <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">Custom Specifications</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      {/* Dynamic Attributes Section */}
                      {form.watch("attributes")?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {form.watch("attributes").map((attr, index) => (
                            <div key={attr.attribute_id} className="space-y-3 p-4 border border-emerald-500/10 rounded-2xl bg-emerald-500/2 hover:bg-emerald-500/4 transition-colors group">
                              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 group-hover:text-emerald-600 transition-colors ml-1">
                                {attr.name}
                              </FormLabel>
                              <Input
                                placeholder={`e.g., ${attr.name === 'Color' ? 'Emerald' : 'Large'}`}
                                className="h-11 bg-background border-border/60 rounded-xl focus:ring-emerald-500/20 font-bold tracking-tight text-[13px] shadow-sm"
                                value={form.watch(`attributes.${index}.value`)}
                                onChange={(e) => {
                                  form.setValue(`attributes.${index}.value`, e.target.value);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 text-center border-2 border-dashed border-border/60 rounded-3xl bg-muted/10 mx-auto max-w-sm">
                          <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border/40">
                            <Palette className="size-7 text-muted-foreground/30" />
                          </div>
                          <p className="text-sm font-bold text-foreground tracking-tight">No attributes available</p>
                          <p className="text-[11px] text-muted-foreground/60 font-medium mt-1">Select a product with defined attributes to proceed</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <FormField
                          name="cost_price"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                                Cost Price
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-black text-xs group-focus-within:text-emerald-600 transition-colors">$</div>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-12 pl-7 bg-background border-border/60 rounded-xl focus:ring-emerald-500/20 font-bold tracking-tight text-[13px] shadow-sm transition-all"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          name="wholesale_price"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                                Wholesale
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-black text-xs group-focus-within:text-emerald-600 transition-colors">$</div>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-12 pl-7 bg-background border-border/60 rounded-xl focus:ring-emerald-500/20 font-bold tracking-tight text-[13px] shadow-sm transition-all"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          name="price"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                                Sale Price
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-black text-xs group-focus-within:text-emerald-600 transition-colors">$</div>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-12 pl-7 bg-emerald-500/2 border-emerald-500/20 rounded-xl focus:ring-emerald-500/20 font-black tracking-tight text-[13px] shadow-sm transition-all text-emerald-600"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          name="stock_quantity"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                                Initial Level
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <Box className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-emerald-600 transition-colors" />
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    className="h-12 pl-10 bg-background border-border/60 rounded-xl focus:ring-emerald-500/20 font-bold tracking-tight text-[13px] shadow-sm transition-all"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Description */}
                      <FormField
                        name="description"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                              Variant Brief
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Textarea
                                  placeholder="Additional nuances, quality markers, or handling notes..."
                                  className="min-h-[120px] bg-background border-border/60 rounded-2xl focus:ring-emerald-500/20 font-medium tracking-tight text-[13px] shadow-sm resize-none p-4"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Identification Section */}
                  <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                    <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <QrCode className="size-4 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-[15px] font-black tracking-tight">Identification</CardTitle>
                          <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">SKU & Barcode</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          name="code"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                                Variant Code
                              </FormLabel>
                              <div className="flex gap-2 group/code">
                                <FormControl>
                                  <div className="relative flex-1">
                                    <Input
                                      placeholder="e.g., VAR-DELTA-9"
                                      className="h-12 bg-background border-border/60 rounded-xl focus:ring-emerald-500/20 font-black tracking-tight text-base shadow-sm group-focus-within/code:border-emerald-500/40 transition-all"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={generateUniqueSKU}
                                  className="size-12 rounded-xl bg-background border-border/60 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-emerald-600 shadow-sm transition-all animate-in zoom-in-75 duration-300"
                                  disabled={!detailedParent}
                                >
                                  <RefreshCw className="size-4" />
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          name="sku"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                                Stock Keeping Unit (SKU)
                              </FormLabel>
                              <FormControl>
                                <div className="relative group/sku">
                                  <Input
                                    placeholder="PROD-VAR-X"
                                    className="h-12 bg-background border-border/60 rounded-xl focus:ring-emerald-500/20 font-black tracking-tight text-base shadow-sm group-focus-within/sku:border-emerald-500/40 transition-all uppercase"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        name="barcode"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                              POS Scannable Barcode
                            </FormLabel>
                            <FormControl>
                              <div className="relative group/barcode">
                                <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/30 group-focus-within:text-emerald-600 transition-colors" />
                                <Input
                                  className="h-14 pl-12 bg-background border-border/60 rounded-2xl focus:ring-emerald-500/20 font-black tracking-[0.2em] text-lg shadow-sm group-focus-within:border-emerald-500/40 transition-all"
                                  placeholder="SCAN OR INPUT"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Settings Section */}
                  <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                    <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Check className="size-4 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-[15px] font-black tracking-tight">Variant Status</CardTitle>
                          <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">Active & Default Settings</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="is_active"
                          render={({ field }) => (
                            <SettingsCard
                              label="Active Status"
                              description="Make variant available for sales"
                              icon={Zap}
                              isActive={field.value}
                              onToggle={field.onChange}
                            />
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="is_default"
                          render={({ field }) => (
                            <SettingsCard
                              label="Master Default"
                              description="Primary selection for catalog"
                              icon={Check}
                              isActive={field.value}
                              onToggle={field.onChange}
                            />
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4">
              {/* Variant History */}
              <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <History className="size-4 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-[15px] font-black tracking-tight">Existing Variants</CardTitle>
                        <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">Product History</p>
                      </div>
                    </div>
                    {detailedParent?.variants?.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        {detailedParent.variants.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {detailedParent ? (
                    <ExistingVariantsList variants={detailedParent.variants} />
                  ) : (
                    <div className="p-12 text-center">
                      <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-muted/50 mb-4 border border-border/40">
                        <Search className="size-7 text-muted-foreground/30" />
                      </div>
                      <p className="text-[13px] font-bold text-foreground">No Product Selected</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">Select a product to view variants</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Image Upload - Redesigned */}
              <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
                <CardHeader className="pb-2.5 bg-muted/30 border-b border-border/40 px-6 pt-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Camera className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-[15px] font-black tracking-tight">Variant Images</CardTitle>
                      <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">Gallery Assets</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-6">
                    {/* Image Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {imagePreviews.map((src, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-2xl border border-border/60 overflow-hidden group hover:ring-2 hover:ring-emerald-500/40 transition-all shadow-sm"
                        >
                          <img
                            src={src}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 size-8 bg-black/60 backdrop-blur-md text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110"
                          >
                            <X className="size-3.5" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                              Primary Image
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Image Button */}
                      {imagePreviews.length < 10 && (
                        <div
                          className={cn(
                            "aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                            "border-border/60 hover:border-emerald-500/40 hover:bg-emerald-500/3 hover:shadow-inner group"
                          )}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="size-12 rounded-2xl bg-muted/50 group-hover:bg-emerald-500/10 border border-border/40 group-hover:border-emerald-500/20 flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                            <PlusCircle className="size-6 text-muted-foreground/40 group-hover:text-emerald-600 transition-colors" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-emerald-700 transition-colors">
                            Add Image
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {imagePreviews.length}/10 slots
                          </span>
                        </div>
                      )}
                    </div>

                    <Input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />

                    {imagePreviews.length === 0 && (
                      <div className="text-center py-10 border border-dashed border-border/60 rounded-3xl bg-muted/10">
                        <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border/40">
                          <Camera className="size-7 text-muted-foreground/30" />
                        </div>
                        <p className="text-[13px] font-bold text-foreground">No imagery added</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1 px-8 leading-relaxed">
                          Please upload product variant images
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/40">
                      {[
                        "First image will be the primary identification",
                        "High fidelity formats: JPG, PNG, WebP supported",
                        "Maximum file size: 5MB per image"
                      ].map((hint, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="size-1 rounded-full bg-emerald-500/30" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{hint}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border border-emerald-500/10 shadow-xl shadow-emerald-500/2 rounded-3xl overflow-hidden bg-emerald-500/2 backdrop-blur-sm">
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
                    onClick={generateUniqueSKU}
                    disabled={!detailedParent}
                  >
                    <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform mr-4 shadow-sm">
                      <RefreshCw className="size-4 text-emerald-600 group-hover:rotate-180 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-black uppercase tracking-widest text-foreground leading-none">Auto-Generate</span>
                      <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Codes & SKU</span>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-14 bg-background/50 border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/20 rounded-2xl transition-all group px-5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform mr-4 shadow-sm">
                      <Upload className="size-4 text-emerald-600" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-black uppercase tracking-widest text-foreground leading-none">Upload Photos</span>
                      <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Gallery Upload</span>
                    </div>
                  </Button>

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
    </div>
  );
}
