import BranchesPage from "@/components/branches/branches-management";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PERMISSIONS } from "@/lib/permissions";

export default function Page() {
  return (
    <ProtectedRoute permission={PERMISSIONS.BRANCH_VIEW}>
      <BranchesPage />
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Branches | EMI-POS  ",
  description: "Developed By : Inzeedo (PVT) Ltd.",
};
