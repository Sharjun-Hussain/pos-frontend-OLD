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
import { useRouter } from "next/navigation";
import { ProductFormSkeleton } from "@/app/skeletons/product-form-skeleton";
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
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
          <Box className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm text-muted-foreground">No variants created yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start by creating your first variant
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <Table>
        <TableHeader className="sticky top-0 bg-white">
          <TableRow>
            <TableHead className="h-11 font-medium text-xs text-muted-foreground">
              Variant Code
            </TableHead>
            <TableHead className="h-11 font-medium text-xs text-muted-foreground">
              Attributes
            </TableHead>
            <TableHead className="h-11 font-medium text-xs text-muted-foreground text-right">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((v) => (
            <TableRow key={v.id} className="hover:bg-slate-50/50">
              <TableCell className="py-3">
                <div className="font-medium text-sm">{v.code}</div>
                <div className="text-xs text-muted-foreground">{v.sku}</div>
              </TableCell>
              <TableCell className="py-3">
                <div className="flex flex-wrap gap-1">
                  {v.attribute_values?.map((av, idx) => (
                    <Badge key={idx} variant="outline" className="text-[10px] py-0 h-5 font-normal bg-slate-50">
                      <span className="text-muted-foreground mr-1">{av.attribute?.name}:</span>
                      {av.value}
                    </Badge>
                  ))}
                  {(!v.attribute_values || v.attribute_values.length === 0) && (
                    <span className="text-xs text-muted-foreground italic">No attributes</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-3 text-right">
                <Badge
                  variant={v.is_active ? "default" : "secondary"}
                  className="text-xs font-normal"
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
      "flex items-center justify-between rounded-lg border p-4 transition-all",
      isActive ? "border-blue-200 bg-blue-50/50" : "border-slate-200 bg-white"
    )}
  >
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "p-2 rounded-lg",
          isActive ? "bg-blue-100" : "bg-slate-100"
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4",
            isActive ? "text-blue-600" : "text-slate-500"
          )}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch
      checked={isActive}
      onCheckedChange={onToggle}
      className={cn(
        "data-[state=checked]:bg-blue-600",
        isActive && "ring-2 ring-blue-200"
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <Form {...form}>
        <form className="max-w-[1400px] mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {isEditing ? "Edit Product Variant" : "Create New Variant"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEditing
                    ? "Update variant details and attributes"
                    : "Add a new variant to your product catalog"}
                </p>
              </div>
              <div className="flex gap-3">
                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={submitting}
                    onClick={form.handleSubmit((d) =>
                      handleServerSubmit(d, true)
                    )}
                    className="h-11 px-6"
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
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  onClick={form.handleSubmit((d) =>
                    handleServerSubmit(d, false)
                  )}
                  className="h-11 px-8"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isEditing ? "Update Variant" : "Create Variant"}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Parent Product Selection */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">
                    Parent Product
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select the main product this variant belongs to
                  </p>
                </CardHeader>
                <CardContent>
                  {detailedParent ? (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Box className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">
                              {detailedParent.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {detailedParent.code}
                              </span>
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                {detailedParent.variants?.length || 0} variants
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setValue("product_id", 0);
                            setDetailedParent(null);
                          }}
                          className="text-muted-foreground"
                        >
                          Change Product
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="product_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium mb-2">
                            Search Parent Product *
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
                                    "w-full h-12 justify-between text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? parentProducts.find(
                                        (p) => p.id === field.value
                                      )?.name
                                    : "Search products..."}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[500px] p-0"
                              align="start"
                            >
                              <Command>
                                <CommandInput
                                  placeholder="Search products by name or code..."
                                  className="h-12"
                                />
                                <CommandList>
                                  <CommandEmpty className="py-6 text-center text-sm">
                                    No products found.
                                  </CommandEmpty>
                                  <CommandGroup className="max-h-64">
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
                                        className="h-12 cursor-pointer"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-3 h-4 w-4",
                                            product.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        <div className="flex-1">
                                          <div className="font-medium">
                                            {product.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {product.code}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                          <FormDescription className="text-xs mt-2">
                            The main product this variant will be associated
                            with
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Variant Details */}
              <div className="grid grid-cols-1 gap-6">
                {/* Attributes Section */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      Variant Attributes
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Define the specific characteristics of this variant
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Dynamic Attributes Section */}
                    {form.watch("attributes")?.length > 0 ? (
                      <div className="space-y-4">
                        <FormLabel className="text-sm font-medium">
                          Variant Specification
                        </FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {form.watch("attributes").map((attr, index) => (
                            <div key={attr.attribute_id} className="space-y-2 p-3 border rounded-lg bg-blue-50/30 border-blue-100">
                              <FormLabel className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                                {attr.name}
                              </FormLabel>
                              <Input
                                placeholder={`Enter ${attr.name} (e.g. ${attr.name === 'Color' ? 'Red' : 'XL'})`}
                                className="h-10 bg-white border-blue-100 focus:border-blue-300 focus:ring-blue-100"
                                value={form.watch(`attributes.${index}.value`)}
                                onChange={(e) => {
                                  form.setValue(`attributes.${index}.value`, e.target.value);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center border-2 border-dashed rounded-lg bg-slate-50/50">
                        <Palette className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground font-medium">No attributes defined for this product</p>
                        <p className="text-xs text-muted-foreground">Select a product with defined attributes to configure variants</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8!">
                      <FormField
                        name="cost_price"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Cost Price
                            </FormLabel>
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="h-11"
                              {...field}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="wholesale_price"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Wholesale Price
                            </FormLabel>
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="h-11"
                              {...field}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="price"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Sale Price
                            </FormLabel>
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="h-11"
                              {...field}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="stock_quantity"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Initial Quantity
                            </FormLabel>
                            <Input
                              type="number"
                              placeholder="0"
                              className="h-11"
                              {...field}
                            />
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
                        <FormItem className="mt-6!">
                          <FormLabel className="text-sm font-medium">
                            Description
                          </FormLabel>
                          <Textarea
                            placeholder="Additional details about this variant..."
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                          <FormDescription className="text-xs">
                            Optional notes about this specific variant
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Identification Section */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      Identification Codes
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Unique identifiers for inventory and sales
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name="code"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Variant Code *
                            </FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="e.g., VAR-001-BLUE"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={generateUniqueSKU}
                                title="Generate Code"
                                className="h-11 w-11"
                                disabled={!detailedParent}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormMessage />
                            <FormDescription className="text-xs">
                              Unique internal identifier
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="sku"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              SKU *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., PROD-VAR-001"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                            <FormDescription className="text-xs">
                              Stock Keeping Unit for inventory
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      name="barcode"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Barcode
                          </FormLabel>
                          <div className="relative">
                            <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-10 h-11"
                              placeholder="Enter or scan barcode..."
                              {...field}
                            />
                          </div>
                          <FormDescription className="text-xs">
                            Optional barcode for point-of-sale systems
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Settings Section - Fixed Toggle Cards */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      Settings
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Control variant visibility and defaults
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <SettingsCard
                            label="Active Status"
                            description="Make variant available for sales"
                            icon={Box}
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
                            label="Default Variant"
                            description="Set as primary variant for the product"
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
            <div className="space-y-6">
              {/* Variant History */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-500" />
                      Existing Variants
                    </CardTitle>
                    {detailedParent?.variants?.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {detailedParent.variants.length} total
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Other variants of this product
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  {detailedParent ? (
                    <ExistingVariantsList variants={detailedParent.variants} />
                  ) : (
                    <div className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                        <Search className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select a product to view variants
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Image Upload - Redesigned */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">
                    Variant Images
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload images for this variant
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Image Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {imagePreviews.map((src, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg border overflow-hidden group hover:ring-2 hover:ring-blue-500 transition-all"
                        >
                          <img
                            src={src}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Image Button - Redesigned */}
                      {imagePreviews.length < 10 && (
                        <div
                          className={cn(
                            "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all",
                            "border-slate-300 hover:border-blue-400 hover:bg-blue-50/30",
                            "group"
                          )}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="p-3 rounded-full bg-slate-100 group-hover:bg-blue-100 transition-colors mb-2">
                            <Camera className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            Add Image
                          </span>
                          <span className="text-xs text-muted-foreground mt-1 text-center px-2">
                            {imagePreviews.length}/10 images
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
                      <div className="text-center py-4 border rounded-lg bg-slate-50/50">
                        <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No images uploaded yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click "Add Image" to upload variant photos
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• First image will be used as primary</p>
                      <p>• Supported formats: JPG, PNG, WebP</p>
                      <p>• Maximum size: 5MB per image</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border shadow-sm bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-11"
                    onClick={generateUniqueSKU}
                    disabled={!detailedParent}
                  >
                    <RefreshCw className="w-4 h-4 mr-3" />
                    Generate SKU & Code
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-11"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-3" />
                    Upload Images
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 text-muted-foreground"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="w-4 h-4 mr-3" />
                    Back to Variants
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
