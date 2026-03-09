"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { useFormRestore } from "@/hooks/use-form-restore";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  short_code: z.string().min(1, "Short code is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
});

export function MeasurementUnitDialog({ open, onOpenChange, onSuccess, session, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      short_code: "",
      type: "",
      description: "",
    },
  });

  const { clearSavedData } = useFormRestore(form, "measurement_unit_dialog_form");

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        short_code: initialData.short_code || "",
        type: initialData.type || "",
        description: initialData.description || "",
      });
    } else {
      form.reset({
        name: "",
        short_code: "",
        type: "",
        description: "",
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data) => {
    if (!session?.accessToken) return;
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/measurement-units/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/measurement-units`;
      
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Measurement Unit ${isEditing ? "updated" : "created"} successfully`);
        onSuccess(result.data);
        onOpenChange(false);
        clearSavedData();
        form.reset();
      } else {
        toast.error(result.message || `Failed to ${isEditing ? "update" : "create"} measurement unit`);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full bg-white dark:bg-card p-0 overflow-hidden border-l border-slate-100 dark:border-border/60 shadow-2xl">
        <SheetHeader className="p-6 border-b border-slate-100 dark:border-border/50 bg-slate-50/50 dark:bg-muted/30">
          <SheetTitle className="text-xl font-bold text-slate-900 dark:text-foreground">
            {isEditing ? "Edit Measurement Unit" : "Create Measurement Unit"}
          </SheetTitle>
          <SheetDescription className="text-sm font-medium text-slate-500 dark:text-muted-foreground mt-1.5">
            {isEditing
              ? "Make changes to the measurement unit details here."
              : "Add a new measurement unit to your inventory."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground tracking-widest pl-1 mb-1.5 block">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Unit Name (e.g. Liter)" 
                        className="h-11 bg-white dark:bg-background border-slate-200 dark:border-border/50 focus-visible:ring-[#00b076] focus-visible:ring-offset-0 focus-visible:border-[#00b076] font-semibold text-slate-900 dark:text-foreground placeholder:font-medium placeholder:text-slate-400 rounded-xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="short_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground tracking-widest pl-1 mb-1.5 block">Short Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. L" 
                        className="h-11 bg-white dark:bg-background border-slate-200 dark:border-border/50 focus-visible:ring-[#00b076] focus-visible:ring-offset-0 focus-visible:border-[#00b076] font-mono font-semibold text-slate-900 dark:text-foreground placeholder:font-medium placeholder:text-slate-400 rounded-xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground tracking-widest pl-1 mb-1.5 block">Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Volume" 
                        className="h-11 bg-white dark:bg-background border-slate-200 dark:border-border/50 focus-visible:ring-[#00b076] focus-visible:ring-offset-0 focus-visible:border-[#00b076] font-semibold text-slate-900 dark:text-foreground placeholder:font-medium placeholder:text-slate-400 rounded-xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground tracking-widest pl-1 mb-1.5 block">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description..."
                        className="resize-none min-h-[100px] bg-white dark:bg-background border-slate-200 dark:border-border/50 focus-visible:ring-[#00b076] focus-visible:ring-offset-0 focus-visible:border-[#00b076] font-medium text-slate-900 dark:text-foreground placeholder:text-slate-400 rounded-xl p-3"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <SheetFooter className="p-6 border-t border-slate-100 dark:border-border/50 bg-slate-50/50 dark:bg-muted/20 flex-none">
          <div className="flex w-full items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-6 font-bold text-slate-600 dark:text-muted-foreground bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-muted transition-colors rounded-full border-slate-200 dark:border-border/50 shadow-sm"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="h-10 px-8 bg-[#00b076] hover:bg-[#00b076]/90 text-white rounded-full font-bold uppercase tracking-wider text-[11px] shadow-md shadow-[#00b076]/20 transition-all active:scale-95 border-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {isEditing ? <Save className="h-[18px] w-[18px]" /> : <Plus className="h-[18px] w-[18px]" />}
                  {isEditing ? "Save Changes" : "Create Unit"}
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
