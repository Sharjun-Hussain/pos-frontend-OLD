"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  Mail, 
  Loader2, 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// --- Schema ---
const formSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .trim(),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Refs
  const containerRef = useRef(null);
  
  // --- Optimized GSAP Animation ---
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // PERFORMANCE FIX: 
    // Instead of moving the whole leftPanelRef (heavy), we only fade it in
    // and move the *content* inside it.
    
    tl.set(".left-panel", { opacity: 1 }) // Ensure visibility
      .from(".left-panel-bg", {
        opacity: 0,
        duration: 1.5,
        ease: "power2.inOut"
      })
      .from(".left-panel-content", {
        y: 20, // Reduced distance for smoothness
        opacity: 0,
        duration: 0.8,
        force3D: true // Hardware acceleration
      }, "-=1.0")
      
      // Right side animations
      .from(".right-panel-content", { 
        opacity: 0, 
        x: 20, 
        duration: 0.8,
        force3D: true
      }, "-=0.6")
      
      // Stagger inputs
      .from(".stagger-item", { 
        y: 10, 
        opacity: 0, 
        stagger: 0.08, 
        duration: 0.5,
        clearProps: "all" // Clean up after animation to prevent blurry text
      }, "-=0.4");

  }, { scope: containerRef });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values) {
    setIsLoading(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Animate Form Out
    gsap.to(".form-container", {
      opacity: 0,
      y: -10,
      duration: 0.3,
      onComplete: () => {
        setIsSuccess(true);
        setIsLoading(false);
        // Animate Success In
        setTimeout(() => {
            gsap.fromTo(".success-container", 
                { opacity: 0, scale: 0.95 }, 
                { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }
            );
        }, 50);
      }
    });

    toast.success("Reset link sent");
  }

  return (
    <main 
      ref={containerRef}
      className="flex min-h-screen w-full bg-slate-50 overflow-hidden"
    >
      {/* --- Left Panel --- */}
      {/* Added 'will-change-transform' to help browser optimize */}
      <div className="left-panel hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center p-12 overflow-hidden">
        
        {/* Background Elements (Static or simple fade) */}
        <div className="left-panel-bg absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900 via-zinc-900 to-black opacity-80" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
        </div>
        
        {/* Animated Content Wrapper */}
        <div className="left-panel-content relative z-10 max-w-lg text-center will-change-transform">
           <div className="mb-6 inline-flex items-center justify-center h-20 w-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md text-indigo-400">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
            Account Recovery
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Don't worry, it happens to the best of us. We'll help you secure your account and get you back on track in seconds.
          </p>
        </div>
      </div>

      {/* --- Right Panel --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="right-panel-content w-full max-w-[400px] will-change-transform">
          
          {/* VIEW 1: FORM INPUT */}
          {!isSuccess && (
            <div className="form-container">
              <div className="mb-8 text-center lg:text-left">
                <div className="inline-flex lg:hidden items-center justify-center h-12 w-12 rounded-xl bg-blue-100 text-blue-600 mb-4">
                    <KeyRound className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 stagger-item">
                  Forgot password?
                </h2>
                <p className="text-slate-500 mt-2 stagger-item">
                  Enter your email for reset instructions.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="stagger-item">
                        <FormLabel className="text-slate-700 font-medium">Email Address</FormLabel>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                          <FormControl>
                            <Input
                              placeholder="name@company.com"
                              type="email"
                              autoComplete="email"
                              className="pl-10 h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 transition-all shadow-sm"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-600" />
                      </FormItem>
                    )}
                  />

                  <div className="stagger-item">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-indigo-200 shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>

              <div className="mt-8 text-center stagger-item">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          )}

          {/* VIEW 2: SUCCESS STATE */}
          {isSuccess && (
            <div className="success-container text-center space-y-6">
              <div className="mx-auto h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900">Check your mail</h2>
              
              <p className="text-slate-500">
                We have sent a password reset link to <br/>
                <span className="font-medium text-slate-900">{form.getValues("email")}</span>
              </p>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-500">
                Didn't receive the email? Check your spam filter or{" "}
                <button 
                    onClick={() => {
                        setIsSuccess(false);
                        gsap.fromTo(".form-container", {opacity: 0}, {opacity: 1, duration: 0.5});
                    }}
                    className="text-indigo-600 font-medium hover:underline underline-offset-2"
                >
                    try another email address
                </button>.
              </div>

              <div className="pt-4">
                 <Link
                  href="/"
                  className="w-full inline-flex justify-center items-center h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="absolute bottom-6 text-center w-full text-xs text-slate-400">
           &copy; {new Date().getFullYear()} Inzeedo Systems.
        </div>
      </div>
    </main>
  );
}