"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation"; // Removed Next.js specific import
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Lock, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Zod schema for password validation, ensuring both fields match
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match. Please try again.",
    path: ["confirmPassword"], // Error will be shown under the confirmPassword field
  });

export default function ModernResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter(); // Removed Next.js specific hook

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values) {
    setIsLoading(true);
    console.log("Resetting password with new password:", values.password);

    // Simulate an API call to update the password
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Password Reset Successful!", {
      description: "You can now log in with your new password.",
      duration: 5000,
    });

    setIsLoading(false);

    // Redirect to the login page using standard browser navigation
    setTimeout(() => {
      window.location.href = "/"; // Redirect to the main login page
    }, 2000);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="w-full max-w-md bg-white shadow-xl border-slate-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-800">
            Set a New Password
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm mt-1">
            Your new password must be at least 8 characters long.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">
                        New Password
                      </FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type="password"
                            className="pl-10 bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">
                        Confirm New Password
                      </FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type="password"
                            className="pl-10 bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm rounded-lg transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password and Login"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
