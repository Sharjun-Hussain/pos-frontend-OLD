"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { JoinedDatePicker } from "./JoinedDatePicker";

// --- 1. Define the Zod Schema ---
// This schema defines the validation rules for your form.

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const formSchema = z.object({
  profilePicture: z
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
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters." }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits." }),
  role: z.string({ required_error: "Please select a role." }),
  joined_date: z.date({
    required_error: "A joined date is required.",
    invalid_type_error: "That's not a valid date!",
  }),
});

// --- 2. Create the Form Component ---

// Example data for roles. In a real app, you'd pass this as a prop.
const exampleRoles = [
  { id: "admin", name: "Administrator" },
  { id: "manager", name: "Manager" },
  { id: "cashier", name: "Cashier" },
];

const title = [
  { id: "mr", name: "Mr." },
  { id: "miss", name: "Miss." },
  { id: "mrs", name: "Mrs." },
];
// Define permissions structure for easy mapping
const permissionItems = [
  { id: "accessReports", label: "Access Reports" },
  { id: "processRefunds", label: "Process Refunds" },
  { id: "manageInventory", label: "Manage Inventory" },
  { id: "voidTransactions", label: "Void Transactions" },
  { id: "editProducts", label: "Edit Products" },
]; // 'as const' gives us a strict type

export function EmployeeForm() {
  // --- 3. Set up the form with react-hook-form ---
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      nic: "",
      joined_date: undefined,
      phoneNumber: "",
      employee_type: "",
      employee_code: "",
      card_number: "",
      role: "",
    },
  });

  // Handle image preview
  const profilePicture = form.watch("profilePicture");
  const previewUrl = profilePicture
    ? URL.createObjectURL(profilePicture)
    : null;

  // --- 4. Define the submit handler ---
  function onSubmit(data) {
    // In a real app, you'd send this data to your API
    console.log("Employee data submitted:", data);
    alert("Employee saved! Check the console for the data.");
  }

  return (
    <Card className="">
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* --- Profile Information Section --- */}
            <div>
              <h3 className="text-lg font-medium mb-4">Profile Information</h3>
              <FormField
                control={form.control}
                name="profilePicture"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-6">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={previewUrl || ""} alt="Profile" />
                        <AvatarFallback>
                          <User className="w-10 h-10" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <FormLabel>Profile Picture</FormLabel>
                        <FormDescription>PNG or JPG. Max 5MB.</FormDescription>
                      </div>
                      <FormControl>
                        {/* Hidden file input */}
                        <Input
                          type="file"
                          accept="image/png, image/jpeg"
                          className="hidden"
                          id="file-upload"
                          onChange={(e) =>
                            field.onChange(e.target.files?.[0] ?? null)
                          }
                        />
                      </FormControl>
                      {/* Custom-styled button to trigger file input */}
                      <Button asChild variant="outline">
                        <label htmlFor="file-upload">Upload Image</label>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {title.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
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
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIC</FormLabel>
                      <FormControl>
                        <Input
                          type="nic"
                          placeholder="Enter the NIC"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joined_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col  ">
                      {/* We use FormItem and FormMessage to handle validation errors.
                    Your component already has a <Label>, so we can omit <FormLabel>
                    if we want.
                  */}
                      <FormControl>
                        <JoinedDatePicker
                          label="Joined Date"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exampleRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* --- Role & Permissions Section --- */}
            {/* <div>
              <h3 className="text-lg font-medium mb-4">Role & Permissions</h3>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-1/5">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exampleRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div> */}

            {/* --- Form Actions --- */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="destructive">
                Cancel
              </Button>
              <Button type="submit">Save Employee</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
