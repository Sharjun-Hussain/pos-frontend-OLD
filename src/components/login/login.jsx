"use client";

import React, { useState, useRef, useMemo, memo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
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

// --- 1. MEMOIZED LEFT PANEL (Performance) ---
const LeftPanel = memo(() => {
  return (
    <div className="left-panel hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center p-12 overflow-hidden">
      {/* FIX #1: Added 'opacity-0 invisible' here. 
         This ensures it is HIDDEN by default in CSS before JS loads.
      */}
      <div className="left-panel-bg absolute inset-0 w-full h-full opacity-0 invisible">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-zinc-900 to-black opacity-80" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      {/* FIX #1: Added 'opacity-0 invisible' and 'translate-y-4' for initial state */}
      <div className="left-panel-content relative z-10 max-w-lg will-change-transform opacity-0 invisible translate-y-5">
        <div className="mb-6 inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 backdrop-blur-md text-blue-400">
          <Terminal className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Advanced POS <br /> Management System
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          Secure, real-time access to your industrial operations, inventory
          management, and financial reporting.
        </p>

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
  );
});
LeftPanel.displayName = "LeftPanel";

// --- 2. LOGIC COMPONENT ---
function LoginForm() {
  const [loginState, setLoginState] = useState({
    isLoading: false,
    isRetrying: false,
    statusMessage: "Sign In",
    serverError: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const updateState = (updates) =>
    setLoginState((prev) => ({ ...prev, ...updates }));

  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();
  const containerRef = useRef(null);
  const formRef = useRef(null);

  // --- GSAP Animation FIX ---
  useGSAP(
    () => {
      // FIX #2: Use 'to' animations with autoAlpha.
      // Since we hid elements with CSS, we now animate them TO visibility.
      // This completely eliminates the render flicker.

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl
        // 1. Fade in Background
        .to(".left-panel-bg", {
          autoAlpha: 1, // Handles opacity: 1 + visibility: visible
          duration: 1.5,
          ease: "power2.inOut",
        })
        // 2. Slide up Content
        .to(
          ".left-panel-content",
          {
            autoAlpha: 1,
            y: 0, // Animate from translate-y-5 (set in CSS) to 0
            duration: 0.8,
            force3D: true,
          },
          "-=1.0",
        )
        // 3. Right Side Content
        .to(
          ".login-right-content",
          {
            autoAlpha: 1,
            x: 0, // Animate from translate-x-5 (set in CSS)
            duration: 0.8,
            force3D: true,
          },
          "-=0.6",
        )
        // 4. Stagger Form Inputs
        .to(
          ".stagger-input",
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.5,
          },
          "-=0.4",
        );
    },
    { scope: containerRef },
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const stopRetrying = () => {
    updateState({
      isRetrying: false,
      isLoading: false,
      statusMessage: "Sign In",
      serverError: "Login process cancelled by user.",
    });
  };

  async function onSubmit(values) {
    updateState({
      isLoading: true,
      isRetrying: true,
      serverError: null,
      statusMessage: "Authenticating...",
    });

    let active = true;
    while (active) {
      if (!navigator.onLine) {
        updateState({ statusMessage: "Waiting for connection..." });
        await new Promise((resolve) => {
          const goOnline = () => {
            window.removeEventListener("online", goOnline);
            resolve(true);
          };
          window.addEventListener("online", goOnline);
        });
        updateState({ statusMessage: "Reconnecting..." });
        await new Promise((r) => setTimeout(r, 1500));
      }

      try {
        if (!active) break;
        updateState({ statusMessage: "Verifying Credentials..." });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 15000),
        );
        const result = await Promise.race([
          signIn("credentials", {
            redirect: false,
            email: values.email,
            password: values.password,
          }),
          timeoutPromise,
        ]);

        if (result?.ok) {
          updateState({ statusMessage: "Redirecting..." });
          toast.success("Access Granted");
          gsap.to(containerRef.current, { opacity: 0, y: -20, duration: 0.5 });
          setTimeout(() => {
            const returnUrl = searchParams.get("redirect") || "/";
            router.push(returnUrl);
          }, 500);
          return;
        }

        if (result?.status === 401 || result?.status === 403) {
          toast.error("Invalid Credentials");
          updateState({
            isLoading: false,
            isRetrying: false,
            serverError: "The email or password you entered is incorrect.",
          });
          gsap.fromTo(
            formRef.current,
            { x: -10 },
            { x: 10, duration: 0.1, repeat: 5, yoyo: true },
          );
          return;
        }

        updateState({ statusMessage: "Server busy. Retrying..." });
        await new Promise((r) => setTimeout(r, 3000));
      } catch (error) {
        if (!active) break;
        updateState({ statusMessage: "Connection unstable. Retrying..." });
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  return (
    <main
      ref={containerRef}
      className="flex min-h-screen w-full bg-slate-50 overflow-hidden"
    >
      <LeftPanel />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        {/* FIX #1: Added initial invisible state and transforms here */}
        <div className="login-right-content w-full max-w-[420px] will-change-transform opacity-0 invisible translate-x-5">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 stagger-input opacity-0 invisible translate-y-3">
              Welcome back
            </h2>
            <p className="text-slate-500 mt-2 stagger-input opacity-0 invisible translate-y-3">
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
                  <FormItem className="stagger-input opacity-0 invisible translate-y-3">
                    <FormLabel className="text-slate-700 font-medium">
                      Email Address
                    </FormLabel>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <FormControl>
                        <Input
                          placeholder="admin@company.com"
                          type="email"
                          autoComplete="username"
                          className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-blue-600"
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
                  <FormItem className="stagger-input opacity-0 invisible translate-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-slate-700 font-medium">
                        Password
                      </FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-blue-600 hover:underline"
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
                          className="pl-10 pr-10 h-11 bg-white border-slate-200 focus-visible:ring-blue-600"
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

              <div className="space-y-3 stagger-input opacity-0 invisible translate-y-3">
                {!isOnline && (
                  <Alert
                    variant="destructive"
                    className="bg-amber-50 border-amber-200 text-amber-900"
                  >
                    <WifiOff className="h-4 w-4 text-amber-600" />
                    <AlertTitle>No Internet</AlertTitle>
                    <AlertDescription>
                      We will auto-retry when connection returns.
                    </AlertDescription>
                  </Alert>
                )}
                {loginState.serverError && (
                  <Alert
                    variant="destructive"
                    className="bg-red-50 border-red-200 text-red-900"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {loginState.serverError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="pt-2 stagger-input space-y-3 opacity-0 invisible translate-y-3">
                <Button
                  type="submit"
                  disabled={loginState.isLoading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-blue-200 shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                >
                  {loginState.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{loginState.statusMessage}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
                {loginState.isRetrying && (
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
          &copy; {new Date().getFullYear()} Inzeedo Systems. Secured by 256-bit
          encryption.
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-slate-50" />}>
      <LoginForm />
    </Suspense>
  );
}
