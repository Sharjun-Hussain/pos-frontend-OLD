"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, FolderDown } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export function ExpenseCategorySheet({ isOpen, onClose, onSuccess, initialData }) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          name: initialData.name || "",
          description: initialData.description || "",
          is_active: initialData.is_active === 1 || initialData.is_active === true,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          is_active: true,
        });
      }
    }
  }, [isOpen, initialData, form]);

  async function onSubmit(data) {
    try {
      setIsSubmitting(true);
      
      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories`;
        
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          ...data,
          is_active: data.is_active ? 1 : 0
        }),
      });

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || `Failed to ${isEditing ? 'update' : 'create'} category`);
      }

      toast.success(`Expense category ${isEditing ? 'updated' : 'created'} successfully`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} category`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden bg-background border-l border-border/50 [&>button]:hidden text-foreground">
        <SheetHeader className="px-6 py-6 border-b border-border/30 bg-muted/10 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/50" 
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <FolderDown className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-left space-y-0.5">
              <SheetTitle className="text-base font-semibold leading-none tracking-tight">
                {isEditing ? "Edit Expense Category" : "Add Expense Category"}
              </SheetTitle>
              <SheetDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground/70">
                {isEditing ? "Modify existing category" : "Create new expense category"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <Form {...form}>
            <form id="expense-category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70">Expense Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Utilities, Rent, Marketing" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Briefly describe what this category covers..." 
                        className="resize-none min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/5 p-4">
                    <div className="space-y-1">
                      <FormLabel className="text-[13px] font-medium text-foreground">Active Status</FormLabel>
                      <FormDescription className="text-xs text-muted-foreground max-w-[200px] leading-snug">
                        Inactive categories cannot be selected for new expenses.
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
            </form>
          </Form>
        </div>

        <div className="p-6 border-t border-border/30 bg-muted/10 flex justify-end gap-3 mt-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="expense-category-form"
            disabled={isSubmitting} 
            className="rounded-xl min-w-[120px] bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FolderDown className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Update Expense Category" : "Save Expense Category"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
