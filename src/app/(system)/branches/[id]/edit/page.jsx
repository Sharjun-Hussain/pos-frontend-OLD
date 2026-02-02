"use client";

// React & Next.js
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// Third-party
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, LoaderIcon } from "lucide-react";

// Local UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BranchForm } from "@/components/branches/new/branches-form";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/lib/permissions";

export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const branchId = params.id;

  const [branchData, setBranchData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect for handling authentication status
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Effect for fetching branch data
  useEffect(() => {
    // Only fetch data if authenticated and we have a token
    if (status === "authenticated" && accessToken) {
      const fetchBranchData = async () => {
        setIsLoading(true);
        setError(null);

        const branchApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/${branchId}`;

        try {
          const response = await fetch(branchApiUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch data");
          }

          const data = await response.json();
          if (data.status === "success") {
            setBranchData(data.data);
          } else {
            throw new Error(data.message || "Failed to fetch");
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred";
          setError(errorMessage);
          toast.error(errorMessage || "Failed to load branch data.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchBranchData();
    }
  }, [status, accessToken, branchId]); // 'router' was removed, as it's not used in this effect

  // Wait for both session authentication and data fetching
  if (isLoading || status === "loading") {
    return (
      <div className="flex gap-3 h-[80vh] w-full items-center justify-center">
        <LoaderIcon className="h-6 w-6 animate-spin text-muted-foreground" />{" "}
        Loading Branch Details ...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center text-red-500">
        <p>Failed to load branch data. Please try again.</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <ProtectedRoute permission={PERMISSIONS.BRANCH_UPDATE}>
      <div className="px-6 pb-6 pt-3">
        <div className="flex items-center justify-between space-y-2 mb-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Edit Branch</h2>
            <p className="text-muted-foreground">
              Fill in the details below to edit this branch.
            </p>
          </div>
        </div>
        {branchData && <BranchForm initialData={branchData} />}
      </div>
    </ProtectedRoute>
  );
}
