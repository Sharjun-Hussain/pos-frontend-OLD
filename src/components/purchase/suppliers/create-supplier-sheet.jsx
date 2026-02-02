"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Trash2, 
  PlusCircle,
  Building2,
  Contact,
  CreditCard,
  CheckCircle2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const supplierSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(3, "Code must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  description: z.string().optional(),
  
  // Step 2: Contact & Address
  contact_person_name: z.string().min(2, "Contact person is required"),
  contact_person_phone: z.string().regex(phoneRegex, "Invalid contact person phone"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  
  // Step 3: Bank Accounts
  bank_accounts: z.array(z.object({
    bank_name: z.string().min(2, "Bank name is required"),
    account_holder_name: z.string().min(2, "Account holder name is required"),
    branch_name: z.string().min(2, "Branch name is required"),
    account_number: z.string().min(5, "Account number is required"),
    is_default: z.boolean().default(false),
  })).min(1, "At least one bank account is required"),
});

const STEPS = [
  { id: 1, title: "Basic Info", icon: Building2 },
  { id: 2, title: "Contact & Address", icon: Contact },
  { id: 3, title: "Bank Accounts", icon: CreditCard },
];

export function CreateSupplierSheet({ open, onOpenChange, onSuccess }) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      code: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
      email: "",
      phone: "",
      description: "",
      contact_person_name: "",
      contact_person_phone: "",
      address: "",
      city: "",
      state: "",
      country: "Sri Lanka",
      bank_accounts: [{
        bank_name: "",
        account_holder_name: "",
        branch_name: "",
        account_number: "",
        is_default: true,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bank_accounts",
  });

  const nextStep = async () => {
    const fieldsToValidate = currentStep === 1 
      ? ['name', 'code', 'email', 'phone']
      : currentStep === 2
      ? ['contact_person_name', 'contact_person_phone', 'address', 'city', 'state', 'country']
      : [];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    if (!session?.accessToken) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // Append regular fields
      const regularFields = [
        'name', 'code', 'email', 'phone', 'description',
        'contact_person_name', 'contact_person_phone', 
        'address', 'city', 'state', 'country'
      ];
      regularFields.forEach(key => {
        if (data[key]) formData.append(key, data[key]);
      });

      // Append bank details as arrays
      data.bank_accounts.forEach((account) => {
        formData.append("bank_names[]", account.bank_name);
        formData.append("account_holder_names[]", account.account_holder_name);
        formData.append("branch_names[]", account.branch_name);
        formData.append("account_numbers[]", account.account_number);
        formData.append("is_default[]", account.is_default ? "1" : "0");
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Supplier created successfully!");
        form.reset();
        setCurrentStep(1);
        onSuccess(result.data);
        onOpenChange(false);
      } else {
        toast.error(result.message || "Failed to create supplier");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] p-0 flex flex-col h-full border-none shadow-2xl">
        <SheetHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100">
          <SheetTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Create New Supplier
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            Follow the steps to add a new vendor to your system.
          </SheetDescription>
          
          {/* Progress Bar */}
          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1 flex items-center gap-2">
                <div 
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                    currentStep >= step.id 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                      : "bg-slate-200 text-slate-500"
                  )}
                >
                  {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    currentStep > step.id ? "bg-blue-600" : "bg-slate-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Basic Information
                  </div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Supplier Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Global Traders" className="h-11 border-slate-200 focus:border-blue-600 focus:ring-blue-600" {...field} />
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
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Supplier Code</FormLabel>
                        <FormControl>
                          <Input placeholder="SUP-001" className="h-11 border-slate-200 focus:border-blue-600 focus:ring-blue-600" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="vendor@example.com" className="h-11 border-slate-200 focus:border-blue-600 focus:ring-blue-600" {...field} />
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
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+94..." className="h-11 border-slate-200 focus:border-blue-600 focus:ring-blue-600" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief notes about the supplier..." className="min-h-[100px] border-slate-200 focus:border-blue-600 focus:ring-blue-600 resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Contact & Address */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
                    <Contact className="h-5 w-5 text-blue-600" />
                    Contact & Address
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact_person_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="Name" className="h-11 border-slate-200 focus:border-blue-600 focus:ring-blue-600" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_person_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone" className="h-11 border-slate-200 focus:border-blue-600 focus:ring-blue-600" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" className="h-11 border-slate-200 focus:border-blue-600 focus:ring-blue-600" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" className="h-11 border-slate-200 focus:border-blue-600 focus:ring-blue-600" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" className="h-11 border-slate-200 focus:border-blue-600 focus:ring-blue-600" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" className="h-11 border-slate-200 focus:border-blue-600 focus:ring-blue-600" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Bank Accounts */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Bank Accounts
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-blue-600 border-blue-100 hover:bg-blue-50"
                      onClick={() => append({ bank_name: "", account_holder_name: "", branch_name: "", account_number: "", is_default: fields.length === 0 })}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Account
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 relative space-y-4 group transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`bank_accounts.${index}.bank_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bank Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. BOC" className="h-10 border-slate-200 focus:border-blue-600" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`bank_accounts.${index}.account_holder_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Account Holder</FormLabel>
                              <FormControl>
                                <Input placeholder="Name on account" className="h-10 border-slate-200 focus:border-blue-600" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`bank_accounts.${index}.branch_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Branch Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Branch" className="h-10 border-slate-200 focus:border-blue-600" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`bank_accounts.${index}.account_number`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Account Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Number" className="h-10 border-slate-200 focus:border-blue-600" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`bank_accounts.${index}.is_default`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    const currentAccounts = form.getValues("bank_accounts");
                                    const newAccounts = currentAccounts.map((acc, i) => ({
                                      ...acc,
                                      is_default: i === index,
                                    }));
                                    form.setValue("bank_accounts", newAccounts);
                                  } else {
                                    field.onChange(false);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-medium text-slate-600 cursor-pointer">Set as default account</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}

            </form>
          </Form>
        </div>

        <SheetFooter className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 text-slate-500 hover:text-slate-700"
            >
              Cancel
            </Button>
          </div>

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={nextStep}
              className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              Next Step
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
              className="h-11 px-10 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Supplier
                </>
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
