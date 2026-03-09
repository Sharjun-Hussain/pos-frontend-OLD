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
      <SheetContent className="sm:max-w-md flex flex-col h-full bg-card/50 backdrop-blur-xl p-0 overflow-hidden border-l border-border/60 shadow-2xl">
        <SheetHeader className="p-6 border-b border-border/50 bg-muted/30">
          <SheetTitle className="text-2xl font-black text-foreground">
            {isEditing ? "Edit Measurement Unit" : "Create Measurement Unit"}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground font-medium">
            {isEditing
              ? "Make changes to the measurement unit details here."
              : "Add a new measurement unit to your inventory."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Unit Name (e.g. Liter)" 
                        className="h-11 bg-background border-border/50 focus-visible:ring-emerald-500 font-bold"
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
                    <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">Short Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. L" 
                        className="h-11 bg-background border-border/50 focus-visible:ring-emerald-500 font-mono"
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
                    <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Volume" 
                        className="h-11 bg-background border-border/50 focus-visible:ring-emerald-500 font-bold"
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
                    <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest pl-1">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description..."
                        className="resize-none min-h-[100px] border-border/50 bg-background/50 focus-visible:ring-emerald-500"
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

        <SheetFooter className="p-6 border-t border-border/50 bg-muted/20 flex-none">
          <div className="flex w-full items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className=" px-6 font-bold text-muted-foreground hover:bg-muted transition-colors rounded-xl border-border/50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
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
