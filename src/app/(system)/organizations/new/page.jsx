import { OrganizationForm } from "@/components/organizations/new/organization-form";

// Mock data for dropdowns, which would normally come from an API
const mockCategories = [
  { id: "cat_apparel", name: "Apparel" },
  { id: "cat_electronics", name: "Electronics" },
  { id: "cat_grocery", name: "Groceries" },
];
const mockBrands = [
  { id: "brand_nike", name: "Nike" },
  { id: "brand_apple", name: "Apple" },
  { id: "brand_starbucks", name: "Starbucks" },
];

import { Building, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Mock data removed as it was unused in the component

export default function AddOrganizationPage() {
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
              Create Business Profile
            </h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.08em] opacity-80">
              Registration • Setup New Corporate Entity
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
        <OrganizationForm />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Add New Organization | Inzeedo POS",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};
