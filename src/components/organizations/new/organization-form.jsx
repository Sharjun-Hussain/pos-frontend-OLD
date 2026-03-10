"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Building, LoaderIcon, Plus, Save, X, Globe, Phone, MapPin, Mail, User, Shield, Calendar, CreditCard, Camera, Trash2 } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-6 w-full mx-auto pb-12">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Form Sections */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Basic Information */}
              <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-[#10b981]">
                    <Building className="h-4 w-4" />
                  </div>
                  <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Profile Details</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-bold text-[13px]">Business Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Apex Global Corp" 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-11 rounded-xl border-slate-200 focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-[13px]"
                            />
                          </FormControl>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-bold text-[13px]">Registred City</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Colombo" 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-11 rounded-xl border-slate-200 focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-[13px]"
                            />
                          </FormControl>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-bold text-[13px]">HQ Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                            <Input 
                              placeholder="Full registered address..." 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-[13px]"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-bold text-[13px]">Business Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                              <Input 
                                type="email" 
                                placeholder="contact@business.com" 
                                {...field} 
                                disabled={isSubmitting || isEditMode}
                                className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-[13px]"
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-[10px] text-slate-400 font-medium italic mt-1.5">
                            * Principal email used for system notifications
                          </FormDescription>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-bold text-[13px]">Primary Contact Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                              <Input 
                                type="tel" 
                                placeholder="+94 7X XXX XXXX" 
                                {...field} 
                                disabled={isSubmitting}
                                className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-[13px]"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-bold text-[13px]">Corporate Website (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                            <Input 
                              placeholder="https://www.business.com" 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-[13px]"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 2. Team & Access (Only for Create Mode) */}
              {!isEditMode && (
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-500">
                      <Shield className="h-4 w-4" />
                    </div>
                    <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Ownership & Initial Access</h3>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="owner_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-bold text-[13px]">Full Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                <Input 
                                  placeholder="Primary Administrator" 
                                  {...field} 
                                  disabled={isSubmitting}
                                  className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-[13px]"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="owner_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-bold text-[13px]">Security Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                disabled={isSubmitting}
                                className="h-11 rounded-xl border-slate-200 focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-[13px]"
                              />
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="branch_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-bold text-[13px]">Default Branch Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Main Hub" 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-11 rounded-xl border-slate-200 focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-[13px]"
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] text-slate-400 font-medium mt-1">
                            The system will automatically initialize this as your primary branch.
                          </FormDescription>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* 3. Subscription Management (Edit Mode Only) */}
              {isEditMode && (
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Subscription & Plans</h3>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="subscription_tier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-bold text-[13px]">Tier Plan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 font-semibold text-[13px]">
                                  <SelectValue placeholder="Identify plan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                <SelectItem value="Basic">Basic Edition</SelectItem>
                                <SelectItem value="Pro">Professional</SelectItem>
                                <SelectItem value="Enterprise">Enterprise Elite</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="billing_cycle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-bold text-[13px]">Billing Cycle</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 font-semibold text-[13px]">
                                  <SelectValue placeholder="Select cycle" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Yearly">Yearly (Save 20%)</SelectItem>
                                <SelectItem value="Lifetime">Lifetime License</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[11px]" />
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
                            <FormLabel className="text-slate-700 font-bold text-[13px]">Payment Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field} 
                                  disabled={isSubmitting}
                                  className="h-11 pl-10 rounded-xl border-slate-200 focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-[13px]"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subscription_expiry_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-bold text-[13px]">Expiry Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                disabled={isSubmitting}
                                className="h-11 rounded-xl border-slate-200 focus:ring-[#10b981]/10 focus:border-[#10b981] font-semibold text-[13px]"
                              />
                            </FormControl>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Logo & Status */}
            <div className="space-y-6">
              {/* Branding Sidebar */}
              <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-[#10b981]">
                    <Camera className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Brand Visuals</h3>
                </div>
                <CardContent className="p-6">
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col items-center gap-6">
                          <div className="relative group">
                            <Avatar className="w-28 h-28 rounded-2xl border-2 border-slate-100 shadow-md">
                              <AvatarImage src={previewUrl} alt="Logo" className="object-cover" />
                              <AvatarFallback className="bg-slate-50 text-slate-400 rounded-2xl border-dashed border-2 border-slate-200">
                                <Building className="w-10 h-10 opacity-30" />
                              </AvatarFallback>
                            </Avatar>
                            <label 
                              htmlFor="file-upload"
                              className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]"
                            >
                              <Plus className="h-6 w-6 mb-1" />
                              <span className="text-[10px] uppercase font-bold tracking-widest">Change</span>
                            </label>
                          </div>
                          
                          <div className="text-center">
                            <h4 className="text-[13px] font-bold text-slate-900 leading-tight">Business Identity</h4>
                            <p className="text-[11px] text-slate-400 mt-1">Square ratio works best (512x512px)</p>
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
                            className="w-full rounded-xl border-slate-200 font-bold text-[11px] uppercase tracking-wider h-10 shadow-sm"
                            disabled={isSubmitting}
                          >
                            <label htmlFor="file-upload">Upload New Logo</label>
                          </Button>
                        </div>
                        <FormMessage className="text-center mt-2 text-[11px]" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Status Section */}
              <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                  <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Visibility & Access</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-bold text-[12px]">System Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 font-semibold text-[13px]">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                            <SelectItem value="active" className="text-emerald-600 font-semibold">Active Profile</SelectItem>
                            <SelectItem value="suspended" className="text-red-500 font-semibold">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  {isEditMode && (
                    <FormField
                      control={form.control}
                      name="subscription_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-bold text-[12px]">Payment Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-xl border-slate-200 font-semibold text-[13px]">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                              <SelectItem value="Active" className="text-emerald-600 font-semibold">Current</SelectItem>
                              <SelectItem value="Trial" className="text-blue-600 font-semibold">Trial Period</SelectItem>
                              <SelectItem value="Expired" className="text-red-600 font-semibold">Payment Due</SelectItem>
                              <SelectItem value="Suspended" className="text-slate-500 font-semibold">Paused</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Quick Summary (Optional) */}
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                  Carefully verify all profile information. These details will appear on your corporate invoices, reports, and digital receipts.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Bank Account Management (New Section) */}
          <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden mt-8">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-[#10b981]">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Corporate Bank Accounts</h3>
              </div>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                className="h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider gap-2 border-emerald-100 text-[#10b981] hover:bg-emerald-50"
                onClick={() => {
                  const currentAccounts = form.getValues("bank_accounts") || [];
                  form.setValue("bank_accounts", [
                    ...currentAccounts, 
                    { name: "", accountNo: "", currency: "LKR", status: "active" }
                  ]);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add Account
              </Button>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {form.watch("bank_accounts")?.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30">
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <CreditCard className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-[13px] font-bold text-slate-400">No bank accounts added</p>
                    <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest">Click 'Add Account' to register a corporate account</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.watch("bank_accounts")?.map((_, index) => (
                      <div key={index} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-emerald-200 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">Account #{index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => {
                              const currentAccounts = form.getValues("bank_accounts") || [];
                              form.setValue("bank_accounts", currentAccounts.filter((__, i) => i !== index));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`bank_accounts.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Bank Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g. Bank of Ceylon" 
                                    {...field} 
                                    className="h-10 rounded-xl border-slate-100 focus:ring-emerald-500/10 focus:border-emerald-500 font-semibold text-[13px]"
                                  />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name={`bank_accounts.${index}.accountNo`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Account No</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="XXXX XXXX XXXX" 
                                      {...field} 
                                      className="h-10 rounded-xl border-slate-100 focus:ring-emerald-500/10 focus:border-emerald-500 font-semibold text-[13px]"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`bank_accounts.${index}.currency`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Currency</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-10 rounded-xl border-slate-100 font-semibold text-[12px]">
                                        <SelectValue placeholder="CUR" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                      <SelectItem value="LKR">LKR</SelectItem>
                                      <SelectItem value="USD">USD</SelectItem>
                                      <SelectItem value="EUR">EUR</SelectItem>
                                      <SelectItem value="GBP">GBP</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-[10px]" />
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

          {/* Form ActionsBar */}
          <div className="sticky bottom-6 left-0 right-0 z-10">
            <div className="bg-white/80 backdrop-blur-lg border border-slate-100 shadow-xl rounded-2xl p-4 flex items-center justify-end gap-3 w-full mx-auto">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl h-11 px-6 font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all uppercase text-[11px] tracking-widest"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4 opacity-60"/> Discard
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-xl h-11 px-8 bg-[#10b981] hover:bg-[#10b981]/90 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 uppercase text-[11px] tracking-widest"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <LoaderIcon className="h-4 w-4 animate-spin" /> Processing...
                  </span>
                ) : isEditMode ? (
                  <>
                  <Save className="mr-2 h-4 w-4"/>
                  Commit Changes
                  </>
                ) : (
                  <>
                  <Plus className="mr-2 h-4 w-4"/>
                  Publish Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
