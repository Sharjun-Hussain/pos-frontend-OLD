"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Building, LoaderIcon, Plus, Save, X, Globe, Phone, MapPin, Mail, User, Shield, Calendar, CreditCard, Camera, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react"; // --- CHANGED --- (useEffect not needed for this form)
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // --- CHANGED ---
import { toast } from "sonner"; // --- CHANGED ---
import { useFormRestore } from "@/hooks/use-form-restore";

import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

// ... (imports remain the same)

export const formSchema = z.object({
  logo: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      `Max image size is 5MB.`
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
  website: z.string().optional().or(z.literal("")),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  address: z.string().optional().or(z.literal("")),
  name: z
    .string()
    .min(2, { message: "Organization name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  city: z.string().min(2, { message: "City must be at least 2 characters." }),
  
  // New Fields for Shop Owner (Optional for updates as they are hidden)
  owner_name: z.string().optional().or(z.literal("")),
  owner_password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  owner_phone: z.string().optional(),

  // New Fields for Main Branch
  branch_name: z.string().optional(),
  
  // Subscription Fields
  subscription_tier: z.enum(['Basic', 'Pro', 'Enterprise']).optional(),
  billing_cycle: z.enum(['Monthly', 'Yearly', 'Lifetime']).optional(),
  subscription_status: z.enum(['Active', 'Expired', 'Trial', 'Suspended']).optional(),
  subscription_expiry_date: z.string().optional(),
  amount: z.string().optional(),
  payment_method: z.string().optional(),
  
  subscription_plan: z.string().optional(),
  status: z.string({ required_error: "Please select a status." }),
  bank_accounts: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Bank name is required"),
    accountNo: z.string().min(5, "Account number is required"),
    currency: z.string().optional(),
    status: z.string().optional(),
  })).optional(),
});

const subscriptionPlans = [
  { id: "Basic", name: "Basic" },
  { id: "Pro", name: "Pro" },
  { id: "Enterprise", name: "Enterprise" },
];

const statuses = [
  { id: "active", name: "Active" },
  { id: "suspended", name: "Suspended" },
];

// --- CHANGED --- Added initialData prop
export function OrganizationForm({ initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const router = useRouter();

  const isEditMode = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          logo: undefined,
          website: initialData.website || "",
          address: initialData.address || "",
          phone: initialData.phone || "",
          email: initialData.email || "",
          city: initialData.city || "",
          subscription_plan: initialData.subscription_plan || undefined,
          subscription_tier: initialData.subscription_tier || undefined,
          billing_cycle: initialData.billing_cycle || undefined,
          subscription_status: initialData.subscription_status || undefined,
          subscription_expiry_date: initialData.subscription_expiry_date ? new Date(initialData.subscription_expiry_date).toISOString().split('T')[0] : "",
          amount: "",
          payment_method: "",
          status: initialData.status || "active",
          // Owner/Branch fields might not be present in initialData if fetching Org only
          owner_name: "", 
          owner_password: "",
          owner_phone: "",
          branch_name: "Main Branch",
          bank_accounts: initialData.bank_accounts || [],
        }
      : {
          logo: undefined,
          name: "",
          phone: "",
          website: "",
          address: "",
          email: "",
          city: "",
          subscription_plan: undefined,
          subscription_tier: undefined,
          billing_cycle: undefined,
          subscription_status: undefined,
          subscription_expiry_date: "",
          amount: "",
          payment_method: "",
          status: "active",
          owner_name: "",
          owner_password: "",
          owner_phone: "",
          branch_name: "Main Branch",
          bank_accounts: [],
        },
  });

  // Enable form data restoration
  const { clearSavedData } = useFormRestore(form);

  const logo = form.watch("logo");
  const newLogoPreview = logo ? URL.createObjectURL(logo) : null;
  const previewUrl =
    newLogoPreview || `https://apipos.inzeedo.com/${initialData?.logo}` || "";

  async function onSubmit(data) {
    if (!accessToken) {
      toast.error("Authentication failed. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    // Organization Details
    formData.append("name", data.name);
    // Code removed
    formData.append("email", data.email);
    formData.append("city", data.city);
    formData.append("phone", data.phone);
    if (data.address) formData.append("address", data.address);
    if (data.website) formData.append("website", data.website);
    
    // Main Branch Details
    formData.append("branch_name", data.branch_name || "Main Branch");
    // We can reuse org address/phone for main branch if not explicitly separate
    formData.append("branch_address", data.address || "");
    formData.append("branch_phone", data.phone || "");

    // Shop Owner Details
    formData.append("owner_name", data.owner_name);
    formData.append("owner_email", data.email); // Assume Org email is owner email/username
    if (data.owner_password) formData.append("owner_password", data.owner_password);
    formData.append("owner_phone", data.owner_phone || data.phone);

    if (data.subscription_plan)
      formData.append("subscription_plan", data.subscription_plan);
    
    // Subscription Fields
    if (data.subscription_tier) formData.append("subscription_tier", data.subscription_tier);
    if (data.billing_cycle) formData.append("billing_cycle", data.billing_cycle);
    if (data.subscription_status) formData.append("subscription_status", data.subscription_status);
    if (data.subscription_expiry_date) formData.append("subscription_expiry_date", data.subscription_expiry_date);
    if (data.amount) formData.append("amount", data.amount);
    if (data.payment_method) formData.append("payment_method", data.payment_method);
    
    // Bank Accounts
    if (data.bank_accounts && data.bank_accounts.length > 0) {
      formData.append("bank_accounts", JSON.stringify(data.bank_accounts));
    }
    
    formData.append("status", data.status);
    // is_multi_branch removed

    if (data.logo) {
      formData.append("logo", data.logo);
    }

    const url = isEditMode
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${initialData.id}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/create`; // Use the new create endpoint

    const method = isEditMode ? "PATCH" : "POST";

    if (isEditMode) {
      formData.append("_method", "PATCH");
    }

    try {
      const response = await fetch(url, {
        method: method,
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${isEditMode ? "update" : "create"} organization.`
        );
      }

      toast.success(
        `Organization ${isEditMode ? "updated" : "created"} successfully!`
      );

      router.refresh();
      clearSavedData(); // Clear saved session data
      router.back();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  }
  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500 mx-auto px-4 md:px-10 py-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          
          {/* Header section with back button and title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-inner text-[#10b981]">
                <Building className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Business Enrollment
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 font-medium">
                  <span>System Settings</span>
                  <span className="text-muted-foreground/30">/</span>
                  <span>Organizations</span>
                  <span className="text-muted-foreground/30">/</span>
                  <span className="text-[#10b981]">Enrollment</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/organizations">
                <Button variant="outline" type="button" className="bg-card text-foreground border-border/50 shadow-sm gap-2 hover:bg-muted/30 h-10 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95" disabled={isSubmitting}>
                  <ArrowLeft className="h-4 w-4" /> Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-xl h-10 px-6 bg-[#10b981] hover:bg-[#0da371] text-white font-bold transition-all shadow-lg shadow-[#10b981]/20 active:scale-[0.98] uppercase text-xs tracking-widest border-none gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  </>
                ) : isEditMode ? (
                  <>
                    <Save className="h-4 w-4"/> Commit
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4"/> Register
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Form Sections */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Business Details */}
              <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border border-border/10">
                <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#10b981]/10 text-[#10b981]">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Business Details</CardTitle>
                    <CardDescription className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tight">Core business identity and contact information</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Business Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Apex Global" 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-11 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-sm transition-all"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">City</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Colombo" 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-11 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-sm transition-all"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Headquarters Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/50" />
                            <Input 
                              placeholder="Full physical address..." 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-11 pl-10 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-sm transition-all"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Business Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/50" />
                              <Input 
                                type="email" 
                                placeholder="contact@business.com" 
                                {...field} 
                                disabled={isSubmitting || isEditMode}
                                className="h-11 pl-10 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-sm transition-all"
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-tight mt-1.5 opacity-60">
                            * Principal email for system alerts
                          </FormDescription>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Contact Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/50" />
                              <Input 
                                type="tel" 
                                placeholder="+94 7X XXX XXXX" 
                                {...field} 
                                disabled={isSubmitting}
                                className="h-11 pl-10 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-sm transition-all"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Website (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/50" />
                            <Input 
                              placeholder="https://www.business.com" 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-11 pl-10 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-sm transition-all"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2. Primary Administrator (Only for Create Mode) */}
              {!isEditMode && (
                <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border border-border/10">
                  <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Primary Administrator</CardTitle>
                      <CardDescription className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tight">Root account and default branch setup</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="owner_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Manager Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/50" />
                                <Input 
                                  placeholder="Primary login name" 
                                  {...field} 
                                  disabled={isSubmitting}
                                  className="h-11 pl-10 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-sm transition-all"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="owner_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Secure Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                disabled={isSubmitting}
                                className="h-11 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-sm transition-all"
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="branch_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Main Branch Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Main Hub" 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-11 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-sm transition-all"
                            />
                          </FormControl>
                          <FormDescription className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-tight mt-1 opacity-60">
                            The system will auto-initialize this as your first location.
                          </FormDescription>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* 3. Subscription (Edit Mode Only) */}
              {isEditMode && (
                <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border border-border/10">
                  <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Subscription Status</CardTitle>
                      <CardDescription className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tight">Plan management and billing cycles</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="subscription_tier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Plan Tier</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-semibold text-sm focus:ring-[#10b981]/20 transition-all">
                                  <SelectValue placeholder="Identify plan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-border/50 p-1 shadow-xl">
                                <SelectItem value="Basic" className="rounded-lg py-2 font-semibold text-xs">Basic Edition</SelectItem>
                                <SelectItem value="Pro" className="rounded-lg py-2 font-semibold text-xs">Professional</SelectItem>
                                <SelectItem value="Enterprise" className="rounded-lg py-2 font-semibold text-xs">Enterprise Elite</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="billing_cycle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Billing Cycle</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-semibold text-sm focus:ring-[#10b981]/20 transition-all">
                                  <SelectValue placeholder="Select cycle" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-border/50 p-1 shadow-xl">
                                <SelectItem value="Monthly" className="rounded-lg py-2 font-semibold text-xs">Monthly</SelectItem>
                                <SelectItem value="Yearly" className="rounded-lg py-2 font-semibold text-xs">Yearly (Save 20%)</SelectItem>
                                <SelectItem value="Lifetime" className="rounded-lg py-2 font-semibold text-xs">Lifetime License</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Billing Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/50" />
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field} 
                                  disabled={isSubmitting}
                                  className="h-11 pl-10 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-sm transition-all"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subscription_expiry_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Expiry Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                disabled={isSubmitting}
                                className="h-11 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-sm transition-all"
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Logo & Status */}
            <div className="space-y-8">
              {/* Branding Sidebar */}
              <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border border-border/10">
                <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#10b981]/10 text-[#10b981]">
                    <Camera className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-foreground">Brand Identity</CardTitle>
                    <CardDescription className="text-[8px] font-medium text-muted-foreground/60 uppercase tracking-tight">Logo and visual assets</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col items-center gap-6">
                          <div className="relative group">
                            <Avatar className="w-32 h-32 rounded-3xl border-2 border-border/50 shadow-md ring-2 ring-transparent group-hover:ring-[#10b981]/20 transition-all overflow-hidden bg-muted/20">
                              <AvatarImage src={previewUrl} alt="Logo" className="object-cover h-full w-full" />
                              <AvatarFallback className="bg-muted/10 text-muted-foreground rounded-3xl border-dashed border-2 border-border/50">
                                <Building className="w-10 h-10 opacity-30" />
                              </AvatarFallback>
                            </Avatar>
                            <label 
                              htmlFor="file-upload"
                              className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center rounded-3xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]"
                            >
                              <Plus className="h-6 w-6 mb-1" />
                              <span className="text-[10px] uppercase font-bold tracking-widest">Update</span>
                            </label>
                          </div>
                          
                          <div className="text-center space-y-1">
                            <h4 className="text-sm font-bold text-foreground">Company Logo</h4>
                            <p className="text-[9px] text-muted-foreground/60 uppercase font-black tracking-widest leading-relaxed">Square PNG or WEBP<br/>(Max 5MB)</p>
                          </div>

                          <FormControl>
                            <Input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              className="hidden"
                              id="file-upload"
                              onChange={(e) =>
                                field.onChange(e.target.files?.[0] ?? null)
                              }
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <Button 
                            asChild 
                            variant="outline" 
                            size="sm"
                            className="w-full rounded-xl border-border/50 bg-background font-bold text-[10px] uppercase tracking-wider h-11 shadow-sm transition-all active:scale-95 hover:bg-[#10b981]/5 hover:border-[#10b981]/30 hover:text-[#10b981]"
                            disabled={isSubmitting}
                          >
                            <label htmlFor="file-upload">Upload Logo</label>
                          </Button>
                        </div>
                        <FormMessage className="text-center mt-2 text-[10px]" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Status Section */}
              <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border border-border/10">
                <CardHeader className="pb-4 border-b border-border/30 bg-muted/5">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-foreground">Operational Status</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">System Access</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-semibold text-sm focus:ring-[#10b981]/20 transition-all">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-border/50 p-1 shadow-xl">
                            <SelectItem value="active" className="rounded-lg py-2 font-semibold text-xs text-[#10b981]">Active Profile</SelectItem>
                            <SelectItem value="suspended" className="rounded-lg py-2 font-semibold text-xs text-red-500">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  {isEditMode && (
                    <FormField
                      control={form.control}
                      name="subscription_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-bold text-xs uppercase tracking-widest">Payment Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background font-semibold text-sm focus:ring-[#10b981]/20 transition-all">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-border/50 p-1 shadow-xl">
                              <SelectItem value="Active" className="rounded-lg py-2 font-semibold text-xs text-[#10b981]">Current</SelectItem>
                              <SelectItem value="Trial" className="rounded-lg py-2 font-semibold text-xs text-blue-500">Trial Period</SelectItem>
                              <SelectItem value="Expired" className="rounded-lg py-2 font-semibold text-xs text-red-500">Payment Due</SelectItem>
                              <SelectItem value="Suspended" className="rounded-lg py-2 font-semibold text-xs text-muted-foreground">Paused</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Pro-Tips / Note */}
              <div className="p-6 rounded-2xl bg-[#10b981]/5 border border-[#10b981]/10">
                <p className="text-[10px] text-[#10b981]/90 font-bold uppercase tracking-widest leading-relaxed">
                  Important Note:
                </p>
                <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-relaxed">
                  Verify business details carefully. This information will appear on legal invoices, tax reports, and customer receipts.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Bank Account Management */}
          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-2xl border border-border/10">
            <CardHeader className="pb-4 border-b border-border/30 bg-muted/5 flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-[#10b981]/10 text-[#10b981]">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Bank Accounts</CardTitle>
                  <CardDescription className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tight">Corporate accounts for financial settlements</CardDescription>
                </div>
              </div>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider gap-2 border-border/50 text-[#10b981] hover:bg-[#10b981]/5 active:scale-95 transition-all"
                onClick={() => {
                  const currentAccounts = form.getValues("bank_accounts") || [];
                  form.setValue("bank_accounts", [
                    ...currentAccounts, 
                    { name: "", accountNo: "", currency: "LKR", status: "active" }
                  ]);
                }}
              >
                <Plus className="h-4 w-4" /> Add Account
              </Button>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                {(form.watch("bank_accounts")?.length === 0 || !form.watch("bank_accounts")) ? (
                  <div className="text-center py-16 rounded-3xl border-2 border-dashed border-border/50 bg-muted/5">
                    <div className="mx-auto w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                      <CreditCard className="h-7 w-7 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">No accounts registered</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-[0.2em]">Begin by adding your first settlement account</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {form.watch("bank_accounts")?.map((_, index) => (
                      <div key={index} className="p-6 rounded-2xl border border-border/50 bg-background shadow-sm hover:border-[#10b981]/30 transition-all group relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 right-4 h-8 w-8 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => {
                            const currentAccounts = form.getValues("bank_accounts") || [];
                            form.setValue("bank_accounts", currentAccounts.filter((__, i) => i !== index));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="mb-4">
                          <span className="text-[9px] font-black text-[#10b981] uppercase tracking-[0.2em] px-2.5 py-1 bg-[#10b981]/10 rounded-lg">Account {index + 1}</span>
                        </div>

                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`bank_accounts.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bank Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. Bank of Ceylon" 
                                    {...field} 
                                    className="h-10 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-bold text-xs transition-all"
                                  />
                                </FormControl>
                                <FormMessage className="text-[9px]" />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name={`bank_accounts.${index}.accountNo`}
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account #</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="XXXX XXXX" 
                                      {...field} 
                                      className="h-10 rounded-xl border-border/50 bg-background focus:ring-[#10b981]/10 focus:border-[#10b981] font-bold text-xs font-mono transition-all"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-[9px]" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`bank_accounts.${index}.currency`}
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Currency</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-10 rounded-xl border-border/50 bg-background font-bold text-xs focus:ring-[#10b981]/20 transition-all">
                                        <SelectValue placeholder="CUR" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl border-border/50 p-1 shadow-xl">
                                      <SelectItem value="LKR" className="rounded-lg py-1.5 font-bold text-[10px]">LKR</SelectItem>
                                      <SelectItem value="USD" className="rounded-lg py-1.5 font-bold text-[10px]">USD</SelectItem>
                                      <SelectItem value="EUR" className="rounded-lg py-1.5 font-bold text-[10px]">EUR</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </form>
      </Form>
    </div>
  );
}
