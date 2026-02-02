"use client";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, BadgeCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

// Zod schema for the 6-digit token
const formSchema = z.object({
  token: z.string().min(6, { message: "Token must be 6 digits." }),
});

export default function ModernVerifyTokenPage() {
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter(); // Removed Next.js specific hook

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { token: "" },
  });

  async function onSubmit(values) {
    setIsLoading(true);
    console.log("Verifying token:", values.token);

    // Simulate an API call to verify the token
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Example of failed verification
    if (values.token !== "123456") {
      toast.error("Invalid Token", {
        description: "The token you entered is incorrect. Please try again.",
      });
      setIsLoading(false);
      form.reset(); // Clear the input on error
      return;
    }

    toast.success("Token Verified!", {
      description: "You can now set your new password.",
      duration: 3000,
    });

    setIsLoading(false);

    // On success, redirect to the reset password page using standard navigation
    setTimeout(() => {
      window.location.href = "/reset-password";
    }, 1000);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="w-full max-w-md bg-white shadow-xl border-slate-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BadgeCheck className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-800">
            Enter Verification Token
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm mt-1">
            Please enter the 6-digit token sent to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel className="text-slate-700">
                      Verification Token
                    </FormLabel>
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        {...field}
                        // Style the OTP input to match the theme
                        className="[&_input]:bg-slate-100 [&_input]:border-slate-300 [&_input]:text-slate-900"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 text-sm rounded-lg transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Token"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <a
            href="/"
            className="text-sm text-slate-500 hover:text-blue-600 transition-colors duration-200 flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </a>
        </CardFooter>
      </Card>
    </main>
  );
}
