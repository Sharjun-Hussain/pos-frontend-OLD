"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Building, LoaderIcon, Plus, Save, X } from "lucide-react";
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
    <Card className="">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* 1. Organization Details */}
            <div>
              <h3 className="text-lg font-medium mb-4">Organization Details</h3>
              
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-6">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={previewUrl} alt="Logo" />
                        <AvatarFallback>
                          <Building className="w-10 h-10" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <FormLabel>Organization Logo</FormLabel>
                        <FormDescription>PNG or JPG. Max 5MB.</FormDescription>
                      </div>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/png, image/jpeg"
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
                        disabled={isSubmitting}
                      >
                        <label htmlFor="file-upload">Upload Logo</label>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter organization name" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} disabled={isSubmitting || isEditMode} />
                      </FormControl>
                      <FormDescription>Used as owner's login email.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter phone" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* 2. Main Branch Details */}
             <div>
              <h3 className="text-lg font-medium mb-4">Main Branch Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="branch_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Branch Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Branch" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>Will be created as the default branch.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* 3. Shop Owner Details */}
            {!isEditMode && (
              <div>
                <h3 className="text-lg font-medium mb-4">Shop Owner Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="owner_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full Name" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="owner_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="owner_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Same as Org Phone if empty" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {/* 4. Subscription Management (Edit Mode Only) */}
            {isEditMode && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4">Subscription Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="subscription_tier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscription Tier</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Basic">Basic</SelectItem>
                              <SelectItem value="Pro">Pro</SelectItem>
                              <SelectItem value="Enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billing_cycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Cycle</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cycle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Yearly">Yearly</SelectItem>
                              <SelectItem value="Lifetime">Lifetime</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subscription_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscription Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Trial">Trial</SelectItem>
                              <SelectItem value="Expired">Expired</SelectItem>
                              <SelectItem value="Suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subscription_expiry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Paid</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormDescription>Leave empty if not updating payment</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <FormControl>
                            <Input placeholder="Cash, Bank Transfer, etc." {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}
            
            {/* Status and Multi-Branch (Existing) - Multi-Branch Removed */}
            <div className={`mt-6 ${!isEditMode ? 'hidden' : ''}`}>
               {/* Multi Branch checkbox was here, removed as irrelevant */}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4"/> Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <LoaderIcon className="h-4 w-4 animate-spin" /> Saving...
                  </span>
                ) : isEditMode ? (
                 <>
                 <Save className="mr-2 h-4 w-4"/>
                 Save Changes
                 </>
                ) : (
                 <>
                 <Plus className="mr-2 h-4 w-4"/>
                 Create Organization
                 </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
