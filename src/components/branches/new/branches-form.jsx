"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// --- 1. ZOD SCHEMA (Unchanged) ---
const formSchema = z.object({
  organization_id: z.string().optional(), // UUID string
  name: z.string().min(3, "Branch name must be at least 3 characters."),
  code: z.string().min(1, "Branch code is required."),
  phone: z.string().min(10, "A valid phone number is required."),
  address: z.string().min(5, "Address is required."),
  city: z.string().min(2, "City is required."),
  email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")),
  manager_name: z.string().optional().or(z.literal("")),
  manager_email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")),
  manager_phone: z.string().optional().or(z.literal("")),
  opening_time: z.string().optional().or(z.literal("")),
  closing_time: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  is_main_branch: z.boolean().default(false),
});

const organizationFetcher = async ([url, token]) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.message || "Failed to fetch organizations");
  }

  const data = await response.json();
  if (data.status === "success") {
    return data?.data?.data?.filter(
      (org) => org?.is_active
    );
  } else {
    throw new Error(data?.message || "Failed to fetch");
  }
};

export function BranchForm({ initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const isEditMode = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          email: initialData.email || "",
          code: initialData.code || "",
          city: initialData.city || "",
          manager_name: initialData.manager_name || "",
          manager_email: initialData.manager_email || "",
          manager_phone: initialData.manager_phone || "",
          opening_time: initialData.opening_time || "",
          closing_time: initialData.closing_time || "",
          is_active: initialData.is_active !== undefined ? initialData.is_active : true,
          is_main_branch: initialData.is_main || false, // Map backend 'is_main' to form 'is_main_branch'
          organization_id: initialData.organization_id // Ensure org ID is set
        }
      : {
          organization_id: undefined,
          name: "",
          code: "",
          phone: "",
          address: "",
          city: "",
          email: "",
          manager_name: "",
          manager_email: "",
          manager_phone: "",
          opening_time: "",
          closing_time: "",
          is_active: true,
          is_main_branch: false,
        },
  });

  // --- 4. SWR HOOK for organizations ---
  const organizationsUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations`;
  const swrKey = accessToken ? [organizationsUrl, accessToken] : null;

  const {
    data: organizations,
    error,
    isLoading: isFetchingOrgs,
  } = useSWR(swrKey, organizationFetcher, {
    revalidateOnFocus: false,
  });

  // Handle SWR errors
  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to load organizations.");
      console.error(error);
    }
  }, [error]);

  // --- 5. UPDATED ONSUBMIT ---
  const isSuperAdmin = session?.user?.roles?.includes("Super Admin");

  const onSubmit = async (values) => {
    if (!accessToken) {
      toast.error("Authentication failed. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    // Clear any previous general server errors
    form.clearErrors("root.serverError");

    const url = isEditMode
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/${initialData?.id}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`;

    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(values),
      });

      const responseData = await response.json(); // Always parse the JSON response

      if (!response.ok) {
        // --- START: NEW ERROR HANDLING LOGIC ---
        let errorMessage = responseData.message || "An unknown error occurred.";

        // Check for the specific validation error structure you provided
        if (responseData.errors && Array.isArray(responseData.errors)) {
          errorMessage =
            responseData.message ||
            "Please review the form and correct the issues.";

          responseData.errors.forEach((error) => {
            const fieldName = error.field;
            const message = error.messages?.[0]; // Get the first message

            if (fieldName && message) {
              // Set the error for the specific field.
              // This will automatically be displayed by the <FormMessage /> component.
              form.setError(fieldName, {
                type: "server",
                message: message,
              });
            }
          });
        } else if (responseData.message) {
          // Handle generic, non-field-specific errors
          form.setError("root.serverError", {
            type: "server",
            message: responseData.message,
          });
        }

        toast.error(errorMessage); // Show a general toast notification
        // --- END: NEW ERROR HANDLING LOGIC ---
      } else {
        // --- SUCCESS CASE (No changes) ---
        toast.success(
          `Branch ${isEditMode ? "updated" : "created"} successfully!`
        );

        // Navigate back to the previous page on success
        router.back();
      }
    } catch (error) {
      // --- CATCH BLOCK (For network errors, etc.) ---
      const genericMessage =
        "A network or server error occurred. Please try again.";
      toast.error(error.message || genericMessage);
      form.setError("root.serverError", {
        type: "server",
        message: error.message || genericMessage,
      });
      console.error("Submission error:", error);
    } finally {
      // This will run regardless of success or failure
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full ">
      {/* <CardHeader>
        <CardTitle>
          {isEditMode ? "Edit Branch" : "Create New Branch"}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? "Make changes to your branch here."
            : "Add a new branch to an organization."}
        </CardDescription>
      </CardHeader> */}
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Branch Details</h3>
              <div className="space-y-4">
                {isSuperAdmin && (
                <FormField
                  control={form.control}
                  name="organization_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : undefined}
                        onValueChange={field.onChange}
                        disabled={isFetchingOrgs} // Allow editing even in edit mode for Super Admin
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isFetchingOrgs
                                  ? "Loading organizations..."
                                  : "Select an organization"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(organizations || []).length === 0 &&
                            !isFetchingOrgs && (
                              <SelectItem value="none" disabled>
                                No organizations found
                              </SelectItem>
                            )}
                          {(organizations || []).map((org) => (
                            <SelectItem key={org.id} value={String(org.id)}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Assign this branch to an organization.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Main Branch" {...field} />
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
                        <FormLabel>Branch Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., BR001" {...field} />
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
                        <FormLabel>Branch Email (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="branch@example.com"
                            {...field}
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
                        <FormLabel>Branch Phone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1234567890"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">Location & Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
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
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="opening_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Time (Optional)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="closing_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Closing Time (Optional)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">Manager (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="manager_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manager_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="manager@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manager_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1234567891"
                          {...field}
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
              <h3 className="text-lg font-medium mb-4">Settings</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription>
                          Inactive branches will not be visible to customers.
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
                  name="is_main_branch"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Main Branch</FormLabel>
                        <FormDescription>
                          Mark this as the primary branch for the organization.
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
              </div>
            </div>

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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </span>
                ) : isEditMode ? (
               <>
               <Save/> Save Changes
               </>  
                ) : (
               <>
               <Plus/> Create Branch
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
