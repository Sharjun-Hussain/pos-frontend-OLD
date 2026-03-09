"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProductVariantForm } from "@/components/variants/new/variant-form";
import { ProductFormSkeleton } from "@/app/skeletons/products/product-form-skeleton";
import { toast } from "sonner";

export default function EditVariantPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVariant = async () => {
      if (!params.id || !session?.accessToken) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/variants/${params.id}`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }
        );
        const result = await response.json();

        if (result.status === "success") {
          setVariant(result.data);
        } else {
          toast.error(result.message || "Failed to load variant");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Network error while loading variant");
      } finally {
        setLoading(false);
      }
    };

    fetchVariant();
  }, [params.id, session]);

  if (loading) return <ProductFormSkeleton />;
  if (!variant) return <div className="p-8 text-center text-muted-foreground">Variant not found</div>;

  return (
    <div className="px-6 pb-6 pt-3">
      <ProductVariantForm initialData={variant} />
    </div>
  );
}
