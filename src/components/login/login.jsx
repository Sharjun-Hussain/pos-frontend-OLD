"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Icons
import {
  Mail,
  Lock,
  Loader2,
  AlertTriangle,
  WifiOff,
  Eye,
  EyeOff,
  Terminal,
  ArrowRight,
  XCircle,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

// --- Schema ---
const formSchema = z.object({
  email: z.string().email("Invalid email address").trim(),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Sign In");
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isOnline = useOnlineStatus();
  
  // Refs for GSAP
  const containerRef = useRef(null);
  const formRef = useRef(null);

  // --- Optimized GSAP Animation ---
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // 1. PERFORMANCE FIX: Static Background, Animated Content
    tl.set(".left-panel", { opacity: 1 }) // Ensure visibility
      .from(".left-panel-bg", {
        opacity: 0,
        duration: 1.5,
        ease: "power2.inOut"
      })
      .from(".left-panel-content", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        force3D: true // Hardware acceleration
      }, "-=1.0")
      
      // 2. Right Side Content
      .from(".login-right-content", { 
        opacity: 0, 
        x: 20, 
        duration: 0.8,
        force3D: true 
      }, "-=0.6")
      
      // 3. Stagger Form Inputs
      .from(".stagger-input", { 
        y: 10, 
        opacity: 0, 
        stagger: 0.08, 
        duration: 0.5,
        clearProps: "all" // Cleanup to prevent text blurring
      }, "-=0.4");

  }, { scope: containerRef });

  // --- Logic ---
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const stopRetrying = () => {
    setIsRetrying(false);
    setIsLoading(false);
    setStatusMessage("Sign In");
    setServerError("Login process cancelled by user.");
  };

  async function onSubmit(values) {
    setIsLoading(true);
    setIsRetrying(true);
    setServerError(null);
    setStatusMessage("Authenticating...");

    // Loop Control
    let active = true;

    while (active) {
      // 1. Network Check
      if (!navigator.onLine) {
        setStatusMessage("Waiting for connection...");
        await new Promise((resolve) => {
          const goOnline = () => {
            window.removeEventListener("online", goOnline);
            resolve(true);
          };
          window.addEventListener("online", goOnline);
        });
        setStatusMessage("Reconnecting...");
        await new Promise((r) => setTimeout(r, 1500));
      }

      try {
        if (!active) break; 

        setStatusMessage("Verifying Credentials...");
        
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 15000)
        );

        const result = await Promise.race([
          signIn("credentials", {
            redirect: false,
            email: values.email,
            password: values.password,
          }),
          timeoutPromise,
        ]);

        // Success
        if (result?.ok) {
          setStatusMessage("Redirecting...");
          toast.success("Access Granted");
          
          // Animate out
          gsap.to(containerRef.current, { opacity: 0, y: -20, duration: 0.5 });
          
          setTimeout(() => {
            const returnUrl = searchParams.get("redirect") || "/";
            router.push(returnUrl);
          }, 500);
          
          return;
        }

        // Credential Errors (Stop Retrying)
        if (result?.status === 401 || result?.status === 403) {
          toast.error("Invalid Credentials");
          setServerError("The email or password you entered is incorrect.");
          setIsLoading(false);
          setIsRetrying(false);
          
          // Shake animation
          gsap.fromTo(formRef.current, 
            { x: -10 }, 
            { x: 10, duration: 0.1, repeat: 5, yoyo: true }
          );
          return; 
        }

        // Server/Network Errors -> Retry Loop
        console.warn("Retrying login...", result?.error);
        setStatusMessage("Server busy. Retrying...");
        await new Promise((r) => setTimeout(r, 3000));
        
      } catch (error) {
        if (!active) break;
        console.error("Login Exception:", error);
        setStatusMessage("Connection unstable. Retrying...");
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  return (
    <main 
      ref={containerRef} 
      className="flex min-h-screen w-full bg-slate-50 overflow-hidden"
    >
      {/* --- Left Panel: Optimized Animation --- */}
      <div className="left-panel hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center p-12 overflow-hidden">
        
        {/* Background (Static Fade Only) */}
        <div className="left-panel-bg absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-zinc-900 to-black opacity-80" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
        </div>
        
        {/* Content (Slides In) */}
        <div className="left-panel-content relative z-10 max-w-lg will-change-transform">
          <div className="mb-6 inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 backdrop-blur-md text-blue-400">
            <Terminal className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Advanced POS <br /> Management System
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Secure, real-time access to your industrial operations, inventory management, and financial reporting.
          </p>
          
          {/* Decorative stats */}
          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-sm text-zinc-500">System Uptime</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-bold text-blue-400">Secure</div>
              <div className="text-sm text-zinc-500">End-to-End Encrypted</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Right Panel: Form --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="login-right-content w-full max-w-[420px] will-change-transform">
          
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 stagger-input">
              Welcome back
            </h2>
            <p className="text-slate-500 mt-2 stagger-input">
              Enter your credentials to access the terminal.
            </p>
          </div>

          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="stagger-input">
                    <FormLabel className="text-slate-700 font-medium">Email Address</FormLabel>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <FormControl>
                        <Input
                          placeholder="admin@company.com"
                          type="email"
                          autoComplete="username"
                          className="pl-10 h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all shadow-sm"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="stagger-input">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-slate-700 font-medium">Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="pl-10 pr-10 h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Alerts */}
              <div className="space-y-3 stagger-input">
                {!isOnline && (
                  <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                    <WifiOff className="h-4 w-4 text-amber-600" />
                    <AlertTitle>No Internet</AlertTitle>
                    <AlertDescription>We will auto-retry when connection returns.</AlertDescription>
                  </Alert>
                )}

                {serverError && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="pt-2 stagger-input space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-blue-200 shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{statusMessage}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>

                {/* Escape Hatch for Infinite Loop */}
                {isRetrying && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={stopRetrying}
                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                  >
                    <XCircle className="w-3 h-3 mr-2" />
                    Cancel Retry
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>

        <div className="absolute bottom-6 text-center w-full text-xs text-slate-400">
           &copy; {new Date().getFullYear()} Inzeedo Systems. Secured by 256-bit encryption.
        </div>
      </div>
    </main>
  );
}