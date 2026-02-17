"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Save, Calendar as CalendarIcon, Upload, X, Receipt } from "lucide-react";
import { useFormRestore } from "@/hooks/use-form-restore";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import Link from "next/link";

const formSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  category_id: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  payment_method: z.string().min(1, "Payment method is required"),
  reference_no: z.string().optional(),
  note: z.string().optional(),
  attachment: z.any().optional(),
  cheque_details: z.object({
    bank_name: z.string().optional(),
    cheque_number: z.string().optional(),
    cheque_date: z.string().optional(),
    payee_payor_name: z.string().optional(),
  }).optional(),
});

export default function CreateExpense() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      category_id: "",
      amount: 0,
      payment_method: "cash",
      reference_no: "",
      note: "",
      cheque_details: {
        bank_name: "",
        cheque_number: "",
        cheque_date: "",
        payee_payor_name: "",
      },
    },
});

  const { clearSavedData } = useFormRestore(form);

  useEffect(() => {
    async function fetchCategories() {
      if (!session?.accessToken) return;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }
        );
        const data = await response.json();
        if (data.status === "success") {
          setCategories(data?.data?.data || data?.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
        // Fallback mock categories
        setCategories([
          { id: "1", name: "Utilities" },
          { id: "2", name: "Rent" },
          { id: "3", name: "Salaries" },
          { id: "4", name: "Marketing" },
        ]);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCategories();
  }, [session]);

  async function onSubmit(data) {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      
      const payload = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      };
      
      // If there's an attachment, we use FormData
      if (data.attachment) {
          formData.append("attachment", data.attachment);
          delete payload.attachment;
      }
      
      formData.append("data", JSON.stringify(payload));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to create expense");
      }

      toast.success("Expense recorded successfully");
      clearSavedData();
      router.push("/expenses");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to record expense");
      // For demo
      if (process.env.NODE_ENV === "development") {
          setTimeout(() => router.push("/expenses"), 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Record New Expense</h1>
          <p className="text-sm text-slate-500">Enter the details of the business expenditure.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/expenses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expense Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (LKR)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("payment_method") === "cheque" && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-amber-50/30 border-amber-100">
                      <FormField
                        control={form.control}
                        name="cheque_details.bank_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-amber-800">Bank Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter bank name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cheque_details.cheque_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-amber-800">Cheque Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter cheque number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cheque_details.cheque_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-amber-800">Cheque Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cheque_details.payee_payor_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-amber-800">Payee Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter payee name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="reference_no"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Reference Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Invoice #, Receipt #" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Note</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional details about this expense..." 
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attachment</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="attachment"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer relative">
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => onChange(e.target.files?.[0])}
                              {...fieldProps}
                            />
                            {value ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="p-2 bg-blue-50 rounded-full">
                                  <Upload className="h-6 w-6 text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">
                                  {value.name}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={(e) => {
                                      e.preventDefault();
                                      onChange(null);
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-slate-500">
                                <Upload className="h-8 w-8" />
                                <span className="text-sm">Click or drag to upload receipt</span>
                                <span className="text-xs">JPG, PNG, PDF (Max 5MB)</span>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Expense Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Amount</span>
                    <span className="font-medium">LKR {form.watch("amount")?.toLocaleString() || "0.00"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Tax (0%)</span>
                    <span className="font-medium">LKR 0.00</span>
                  </div>
                  <div className="pt-2 border-t border-blue-200 flex justify-between">
                    <span className="font-bold text-blue-900">Total</span>
                    <span className="font-bold text-blue-900">LKR {form.watch("amount")?.toLocaleString() || "0.00"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px] bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Expense
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
