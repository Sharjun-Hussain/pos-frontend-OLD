"use client";

// React & Next.js
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// Third-party
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { LoaderIcon } from "lucide-react";

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
            document.title = `Edit ${label} | EMI-POS`;
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
      <div className="flex gap-3 h-[80vh] w-full items-center justify-center">
        <LoaderIcon className="h-6 w-6 animate-spin text-muted-foreground" />{" "}
        Loading Organization Details ...
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
    <div className="px-6 pb-6 pt-3">
      <div className="flex items-center justify-between space-y-2 mb-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Edit Organization
          </h2>
          <p className="text-muted-foreground">
            Fill in the details below to edit this organization.
          </p>
        </div>
      </div>
      {OrganizationData && <OrganizationForm initialData={OrganizationData} />}
    </div>
  );
}
