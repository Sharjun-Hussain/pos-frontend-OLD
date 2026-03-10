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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f0] dark:bg-emerald-500/10 text-[#00b076] dark:text-emerald-500">
            <Receipt className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground tracking-tight">
              Create New Expense
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wider mt-0.5">
              RECORD BUSINESS EXPENDITURE
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          asChild
          className="h-10 px-6 font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors rounded-full border-slate-200 shadow-sm"
        >
          <Link href="/expenses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-slate-100 dark:border-border/60 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-card">
                <CardHeader className="border-b border-slate-50 dark:border-border/40 bg-slate-50/30 dark:bg-muted/10 p-6">
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-foreground flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-[#00b076]" />
                    Expense Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground tracking-widest pl-1 mb-1 block">Expense Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full h-11 pl-3 text-left font-semibold bg-white dark:bg-background border-slate-200 dark:border-border/50 hover:bg-slate-50 focus:ring-[#00b076] rounded-xl shadow-sm transition-all",
                                  !field.value && "text-slate-400 font-medium"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-40 text-[#00b076]" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-xl overflow-hidden border-slate-200 shadow-xl" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              className="rounded-xl"
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
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground tracking-widest pl-1 mb-1 block">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-white dark:bg-background border-slate-200 dark:border-border/50 focus:ring-[#00b076] font-semibold text-slate-900 rounded-xl shadow-sm">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-slate-200">
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()} className="font-medium">
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
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground tracking-widest pl-1 mb-1 block">Amount (LKR)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            className="h-11 bg-white dark:bg-background border-slate-200 dark:border-border/50 focus-visible:ring-[#00b076] focus-visible:ring-offset-0 font-semibold text-slate-900 rounded-xl shadow-sm"
                            {...field} 
                          />
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
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground tracking-widest pl-1 mb-1 block">Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-white dark:bg-background border-slate-200 dark:border-border/50 focus:ring-[#00b076] font-semibold text-slate-900 rounded-xl shadow-sm">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-slate-200">
                            <SelectItem value="cash" className="font-medium">Cash</SelectItem>
                            <SelectItem value="bank_transfer" className="font-medium">Bank Transfer</SelectItem>
                            <SelectItem value="cheque" className="font-medium">Cheque</SelectItem>
                            <SelectItem value="credit_card" className="font-medium">Credit Card</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("payment_method") === "cheque" && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 p-5 border rounded-2xl bg-emerald-50/30 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20 shadow-inner">
                      <FormField
                        control={form.control}
                        name="cheque_details.bank_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 tracking-widest pl-1 mb-1 block">Bank Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter bank name" className="h-11 bg-white dark:bg-background border-emerald-200 focus-visible:ring-[#00b076] rounded-xl font-semibold shadow-sm" {...field} />
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
                            <FormLabel className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 tracking-widest pl-1 mb-1 block">Cheque Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter cheque number" className="h-11 bg-white dark:bg-background border-emerald-200 focus-visible:ring-[#00b076] rounded-xl font-semibold shadow-sm" {...field} />
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
                            <FormLabel className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 tracking-widest pl-1 mb-1 block">Cheque Date</FormLabel>
                            <FormControl>
                              <Input type="date" className="h-11 bg-white dark:bg-background border-emerald-200 focus-visible:ring-[#00b076] rounded-xl font-semibold shadow-sm" {...field} />
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
                            <FormLabel className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 tracking-widest pl-1 mb-1 block">Payee Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter payee name" className="h-11 bg-white dark:bg-background border-emerald-200 focus-visible:ring-[#00b076] rounded-xl font-semibold shadow-sm" {...field} />
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
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground tracking-widest pl-1 mb-1 block">Reference Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Invoice #, Receipt #" className="h-11 bg-white dark:bg-background border-slate-200 dark:border-border/50 focus-visible:ring-[#00b076] font-semibold text-slate-900 rounded-xl shadow-sm" {...field} />
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
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground tracking-widest pl-1 mb-1 block">Note</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional details about this expense..." 
                            className="resize-none min-h-[100px] border-slate-200 dark:border-border/50 bg-white dark:bg-background focus-visible:ring-[#00b076] font-medium text-slate-900 rounded-xl p-3 shadow-sm"
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
              <Card className="border-slate-100 dark:border-border/60 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-card">
                <CardHeader className="border-b border-slate-50 dark:border-border/40 bg-slate-50/30 dark:bg-muted/10 p-6">
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-foreground flex items-center gap-2">
                    <Upload className="h-5 w-5 text-[#00b076]" />
                    Attachment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <FormField
                    control={form.control}
                    name="attachment"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-border/50 rounded-2xl p-8 hover:border-[#00b076]/50 hover:bg-[#e6f7f0]/10 transition-all cursor-pointer relative group">
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => onChange(e.target.files?.[0])}
                              {...fieldProps}
                            />
                            {value ? (
                              <div className="flex flex-col items-center gap-3">
                                <div className="p-3 bg-[#e6f7f0] rounded-full">
                                  <Upload className="h-6 w-6 text-[#00b076]" />
                                </div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-foreground truncate max-w-[180px]">
                                  {value.name}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full font-bold uppercase text-[10px] tracking-widest"
                                  onClick={(e) => {
                                      e.preventDefault();
                                      onChange(null);
                                  }}
                                >
                                  Remove File
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3 text-slate-500 text-center">
                                <div className="p-3 bg-slate-100 dark:bg-muted/50 rounded-full group-hover:bg-[#e6f7f0] group-hover:text-[#00b076] transition-colors">
                                  <Upload className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-sm font-bold text-slate-900 dark:text-foreground block">Drop Receipt Here</span>
                                  <span className="text-xs font-medium text-slate-500 block">JPG, PNG, PDF (Max 5MB)</span>
                                </div>
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

              <div className="bg-[#e6f7f0]/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-6 space-y-5 shadow-sm">
                <h3 className="font-bold text-[#00b076] uppercase text-[11px] tracking-widest flex items-center gap-2 border-b border-emerald-100 dark:border-emerald-500/10 pb-3">
                  <Receipt className="h-5 w-5" />
                  Expense Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="font-bold text-slate-900 dark:text-foreground">LKR {form.watch("amount")?.toLocaleString() || "0.00"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Tax (0%)</span>
                    <span className="font-bold text-slate-900 dark:text-foreground">LKR 0.00</span>
                  </div>
                  <div className="pt-4 border-t border-emerald-100 dark:border-emerald-500/10 flex justify-between items-center text-lg">
                    <span className="font-bold text-slate-900 dark:text-foreground">Grand Total</span>
                    <span className="font-black text-[#00b076]">LKR {form.watch("amount")?.toLocaleString() || "0.00"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-100 dark:border-border/40 mt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="h-11 px-8 font-bold text-slate-600 dark:text-muted-foreground bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-muted transition-colors rounded-full border-slate-200 dark:border-border/50 shadow-sm"
            >
              Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="h-11 px-10 bg-[#00b076] hover:bg-[#00b076]/90 text-white rounded-full font-bold uppercase tracking-widest text-[11px] shadow-md shadow-[#00b076]/20 transition-all active:scale-95 border-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-[18px] w-[18px]" />
                  Record Expense
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
