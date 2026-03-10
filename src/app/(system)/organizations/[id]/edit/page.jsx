"use client";

// React & Next.js
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// Third-party
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { LoaderIcon, Building, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { OrganizationForm } from "@/components/organizations/new/organization-form";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

export default function EditOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const organizationId = params.id;
  const { setBreadcrumb } = useBreadcrumbStore();

  const [OrganizationData, setOrganizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect for handling authentication status
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Effect for fetching organization data
  useEffect(() => {
    // Only fetch data if authenticated and we have a token
    if (status === "authenticated" && accessToken) {
      const fetchOrganizationData = async () => {
        setIsLoading(true);
        setError(null);

        const organizationApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}`;

        try {
          const response = await fetch(organizationApiUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch data");
          }

          const data = await response.json();
          if (data.status === "success") {
            setOrganizationData(data.data);
            // Set Breadcrumb Label
            const label = data.data.name || `Organization #${data.data.id}`;
            setBreadcrumb(organizationId, label);
            // Set Document Title
            document.title = `Edit ${label} | Inzeedo POS`;
          } else {
            throw new Error(data.message || "Failed to fetch");
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred";
          setError(errorMessage);
          toast.error(errorMessage || "Failed to load organization data.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrganizationData();
    }
  }, [status, accessToken, organizationId, setBreadcrumb]); // 'router' was removed, as it's not used in this effect

  // Wait for both session authentication and data fetching
  if (isLoading || status === "loading") {
    return (
      <div className="flex flex-col gap-3 h-[80vh] w-full items-center justify-center animate-in fade-in duration-700">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
          <Building className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-emerald-500 opacity-50" />
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-4">
          Synchronizing Profile Data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center text-red-500">
        <p>Failed to load organization data. Please try again.</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500 mx-auto px-4 md:px-8 py-8">
      {/* Header section with back button and title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 shadow-sm shadow-emerald-500/5">
            <Building className="w-6 h-6 text-[#10b981]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Edit Business Profile
            </h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.08em] opacity-80">
              Registration • {OrganizationData?.name || "Corporate Entity"}
            </p>
          </div>
        </div>
        
        <Link href="/organizations">
          <Button variant="ghost" className="rounded-xl font-bold text-[11px] uppercase tracking-wider text-slate-500 hover:bg-slate-100 h-10 px-4 group">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Profiles
          </Button>
        </Link>
      </div>

      <div className="mt-2">
        {OrganizationData && <OrganizationForm initialData={OrganizationData} />}
      </div>
    </div>
  );
}
