import { EmployeeForm } from "@/components/employees/new/employee-add-new-form";

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

export default function AddEmployeePage() {
  return (
   
      
      <EmployeeForm />
    
  );
}

export const metadata = {
  title: "Add New Employee | Inzeedo POS",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};
