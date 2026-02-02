"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Building, LoaderIcon, Plus, Save, X } from "lucide-react";
import { useState } from "react"; // --- CHANGED --- (useEffect not needed for this form)
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // --- CHANGED ---
import { toast } from "sonner"; // --- CHANGED ---

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

// --- CHANGED --- Made optional fields handle empty strings like the example
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
  website: z.string().optional().or(z.literal("")), // --- CHANGED ---
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  address: z.string().optional().or(z.literal("")), // --- CHANGED ---
  name: z
    .string()
    .min(2, { message: "Organization name must be at least 2 characters." }),
  code: z
    .string()
    .min(4, { message: "Org. code must be at least 4 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  city: z.string().min(2, { message: "City must be at least 2 characters." }),
  subscription_plan: z.string().optional(),
  status: z.string({ required_error: "Please select a status." }),
  is_multi_branch: z.boolean().default(false).optional(),
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
  // --- CHANGED --- Renamed to isSubmitting for consistency
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const router = useRouter();

  // --- CHANGED --- Detect edit mode
  const isEditMode = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    // --- CHANGED --- Set default values based on initialData
    defaultValues: initialData
      ? {
          ...initialData,
          logo: undefined, // File input cannot be pre-filled
          website: initialData.website || "",
          address: initialData.address || "",
          phone: initialData.phone || "",
          is_multi_branch: !!initialData.is_multi_branch,
          email: initialData.email || "",
          city: initialData.city || "",
          subscription_plan: initialData.subscription_plan || undefined,
          status: initialData.status || "active",
        }
      : {
          logo: undefined,
          name: "",
          code: "",
          phone: "",
          website: "",
          address: "",
          email: "",
          city: "",
          subscription_plan: undefined,
          status: "active",
          is_multi_branch: false,
        },
  });

  // --- CHANGED --- Updated logo preview logic
  const logo = form.watch("logo");
  const newLogoPreview = logo ? URL.createObjectURL(logo) : null;
  // Assumes the existing logo URL is passed as `logo_url` in initialData
  const previewUrl =
    newLogoPreview || `https://apipos.inzeedo.com/${initialData?.logo}` || "";

  async function onSubmit(data) {
    if (!accessToken) {
      toast.error("Authentication failed. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("code", data.code);
    formData.append("email", data.email);
    formData.append("city", data.city);
    formData.append("phone", data.phone);
    if (data.address) formData.append("address", data.address);
    if (data.website) formData.append("website", data.website);
    if (data.subscription_plan)
      formData.append("subscription_plan", data.subscription_plan);
    formData.append("status", data.status);
    formData.append("is_multi_branch", data.is_multi_branch ? "1" : "0");

    // Only append the logo if a *new* one was selected
    if (data.logo) {
      formData.append("logo", data.logo);
    }

    const url = isEditMode
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${initialData.id}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations`;

    const method = isEditMode ? "PATCH" : "POST";
    console.log(method);

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

      // Navigate back on success
      router.back();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "An unexpected error occurred.");
      setIsSubmitting(false); // Only set to false on error
    }
  }

  return (
    <Card className="">
      <CardContent className="pt-6">
        {" "}
        {/* --- CHANGED --- Added padding top */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Organization Details</h3>

              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-6">
                      <Avatar className="w-20 h-20">
                        {/* --- CHANGED --- Use dynamic previewUrl */}
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
                          disabled={isSubmitting} // --- CHANGED ---
                        />
                      </FormControl>
                      <Button
                        asChild
                        variant="outline"
                        disabled={isSubmitting} // --- CHANGED ---
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
                        <Input
                          placeholder="Enter organization name"
                          {...field}
                          disabled={isSubmitting} // --- CHANGED ---
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter unique code (e.g., ABCD004)"
                          {...field}
                          // --- CHANGED --- Org code is often immutable
                          disabled={isSubmitting || isEditMode}
                        />
                      </FormControl>
                      {/* --- CHANGED --- Added description */}
                      <FormDescription>
                        Cannot be changed after creation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner's Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter owner's email address"
                          {...field}
                          // --- CHANGED --- Owner email is often immutable
                          disabled={isSubmitting || isEditMode}
                        />
                      </FormControl>
                      {/* --- CHANGED --- Added description */}
                      <FormDescription>
                        Cannot be changed after creation.
                      </FormDescription>
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
                        <Input
                          placeholder="Enter city"
                          {...field}
                          disabled={isSubmitting} // --- CHANGED ---
                        />
                      </FormControl>
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
                        <Input
                          type="tel" // --- CHANGED --- Use type "tel"
                          placeholder="Enter phone"
                          {...field}
                          disabled={isSubmitting} // --- CHANGED ---
                        />
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
                        <Input
                          placeholder="Enter address"
                          {...field}
                          disabled={isSubmitting} // --- CHANGED ---
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          {...field}
                          disabled={isSubmitting} // --- CHANGED ---
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">
                Settings
              </h3>
              <div className="space-y-6">
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="subscription_plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription Plan</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          // --- CHANGED --- Use value prop for controlled component
                          value={field.value}
                          disabled={isSubmitting} // --- CHANGED ---
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subscriptionPlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          // --- CHANGED --- Use value prop for controlled component
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status.id} value={status.id}>
                                {status.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div> */}

                <FormField
                  control={form.control}
                  name="is_multi_branch"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Multi-Branch</FormLabel>
                        <FormDescription>
                          Allow this organization to create and manage multiple
                          branches.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting} // --- CHANGED ---
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* --- CHANGED --- Updated buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
              <X/> Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <LoaderIcon className="h-4 w-4 animate-spin" /> Saving...
                  </span>
                ) : isEditMode ? (
                 <>
                 <Save/>
                 Save Changes
                 </>
                ) : (
                 <>
                 <Plus/>
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
