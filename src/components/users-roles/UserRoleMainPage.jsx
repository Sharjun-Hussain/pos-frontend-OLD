"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MoreHorizontal,
  Users,
  Shield,
  Check,
  UserPlus,
  Loader2,
  CheckSquare,
  Square,
  X,
  ShieldCheck,
  LayoutGrid,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Building,
  Lock,
  Calendar,
  Settings,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFormRestore } from "@/hooks/use-form-restore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ProtectedComponent } from "@/components/auth/ProtectedComponent";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import UsersPageSkeleton from "@/app/skeletons/Users-skeleton";

import { toast } from "sonner";

// --- HELPER: Group Permissions by 'group_name' ---
const groupPermissionsBySection = (permissions) => {
  if (!permissions) return {};
  return permissions.reduce((groups, perm) => {
    const group = perm.group_name || "Other Permissions";
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(perm);
    return groups;
  }, {});
};

// --- ZOD SCHEMA ---
const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  permissions: z.array(z.number()).default([]),
});

// --- COMPONENT: ROLE FORM DIALOG ---
const RoleFormDialog = ({
  isOpen,
  onClose,
  initialData,
  allPermissions,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedPermissions = useMemo(
    () => groupPermissionsBySection(allPermissions),
    [allPermissions]
  );

  const form = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
  });

  const { clearSavedData } = useFormRestore(form, "user_role_dialog_form");
  const { setValue, watch, handleSubmit: hookFormSubmit, reset } = form;
  const selectedPermIds = watch("permissions");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
            name: initialData.name,
            permissions: initialData.permissions ? initialData.permissions.map(p => p.id) : []
        });
      } else {
        reset({
            name: "",
            permissions: []
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const togglePermission = (id) => {
    const current = selectedPermIds || [];
    const updated = current.includes(id)
      ? current.filter((p) => p !== id)
      : [...current, id];
    setValue("permissions", updated, { shouldDirty: true });
  };

  const toggleGroup = (groupName) => {
    const groupPerms = groupedPermissions[groupName];
    const groupIds = groupPerms.map((p) => p.id);
    const current = selectedPermIds || [];
    const allSelected = groupIds.every((id) => current.includes(id));

    let updated;
    if (allSelected) {
      updated = current.filter((id) => !groupIds.includes(id));
    } else {
      updated = [...new Set([...current, ...groupIds])];
    }
    setValue("permissions", updated, { shouldDirty: true });
  };

  const toggleAll = () => {
    if (selectedPermIds.length === allPermissions.length) {
      setValue("permissions", [], { shouldDirty: true });
    } else {
      setValue("permissions", allPermissions.map((p) => p.id), { shouldDirty: true });
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    await onSave(data, initialData?.id);
    clearSavedData();
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[950px] max-h-[90vh] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none bg-card/95 backdrop-blur-xl shadow-2xl rounded-3xl">
        <DialogHeader className="px-8 py-6 border-b border-white/10 shrink-0 bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Shield className="w-5 h-5 text-glow-emerald" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {initialData ? "Edit Role & Permissions" : "Create New Role"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Configure the access level and specific permissions for this role.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-8 pb-4 shrink-0">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                Role Identity <span className="text-emerald-500">*</span>
              </label>
              <Input
                placeholder="e.g. Sales Manager"
                {...form.register("name")}
                className="max-w-md h-12 bg-white/5 border-border/50 rounded-2xl focus:border-emerald-500 transition-all font-bold text-base shadow-inner"
              />
               {form.formState.errors.name && (
                <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
                    {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div className="px-8 py-4 flex items-center justify-between border-y border-white/5 bg-white/5 backdrop-blur-md shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h4 className="font-bold text-xs uppercase tracking-widest text-foreground">
                Permissions Matrix
              </h4>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold ml-2">
                {selectedPermIds.length} Selected
              </Badge>
            </div>
            <Button
              variant={"ghost"}
              size="sm"
              onClick={toggleAll}
              className={cn(
                  "h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                  selectedPermIds.length === allPermissions.length
                    ? "text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border border-emerald-500/20"
              )}
            >
              {selectedPermIds.length === allPermissions.length
                ? "Deselect All System"
                : "Select All System"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-emerald-500/[0.01]">
            <div className="p-8 grid grid-cols-1 gap-8">
              {Object.keys(groupedPermissions).map((group) => {
                const groupPerms = groupedPermissions[group];
                const allInGroupSelected =
                  groupPerms.length > 0 &&
                  groupPerms.every((p) => selectedPermIds.includes(p.id));
                const someInGroupSelected = groupPerms.some((p) =>
                  selectedPermIds.includes(p.id)
                );

                return (
                  <div key={group} className="overflow-hidden group/section">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleGroup(group)}>
                         <div className={cn(
                            "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                            allInGroupSelected ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : someInGroupSelected ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "bg-white/5 border-white/20"
                          )}>
                          {allInGroupSelected ? <Check className="w-3.5 h-3.5 stroke-[4]" /> : someInGroupSelected ? <div className="w-2 h-0.5 bg-emerald-500 rounded-full" /> : null}
                        </div>
                        <span className="font-black text-xs uppercase tracking-widest text-foreground opacity-80 group-hover/section:opacity-100 transition-opacity">
                          {group}
                        </span>
                        <div className="h-[1px] w-24 bg-gradient-to-r from-emerald-500/30 to-transparent hidden sm:block" />
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-muted-foreground">
                        {groupPerms.filter((p) => selectedPermIds.includes(p.id)).length} OF {groupPerms.length}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupPerms.map((perm) => {
                        const isSelected = selectedPermIds.includes(perm.id);
                        return (
                          <div key={perm.id} className={cn("group/item flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden relative", isSelected ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.1)] translate-y-[-1px]" : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10")} onClick={() => togglePermission(perm.id)}>
                            {isSelected && <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 blur-2xl rounded-full -mr-6 -mt-6" />}
                            <div className={cn("mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all duration-300", isSelected ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "border-white/20 border-2")}>
                              {isSelected && <Check className="w-3 h-3 stroke-[4]" />}
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className={cn("text-[12px] font-bold leading-tight transition-colors truncate", isSelected ? "text-emerald-500" : "text-foreground opacity-80")}>
                                {perm.name}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-medium opacity-50 uppercase tracking-tighter truncate">
                                {perm.guard_name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 py-6 border-t border-white/10 bg-card shrink-0 flex items-center justify-between sm:justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="h-11 px-8 rounded-xl border-border/50 hover:bg-muted font-bold text-[10px] uppercase tracking-widest transition-all">
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button onClick={hookFormSubmit(onSubmit)} disabled={isSubmitting} className="h-11 px-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95 border-none">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : initialData ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {initialData ? "Update Role" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- COMPONENT: PERMISSION MATRIX ---
const PermissionMatrix = ({ roles, permissions, onToggle, isUpdating }) => {
  const groupedPermissions = useMemo(
    () => groupPermissionsBySection(permissions),
    [permissions]
  );

  return (
    <div className="relative rounded-3xl border border-white/5 bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="overflow-x-auto custom-scrollbar">
        <Table className="border-collapse">
          <TableHeader className="bg-emerald-500/5 backdrop-blur-md sticky top-0 z-30">
            <TableRow className="hover:bg-transparent border-white/10">
              <TableHead className="w-[300px] min-w-[300px] sticky left-0 z-40 bg-card/95 backdrop-blur-xl border-r border-white/10 py-6 px-8 text-[11px] font-black text-foreground uppercase tracking-[0.2em]">
                Permission Capabilities
              </TableHead>
              {roles.map((role) => (
                <TableHead key={role.id} className="min-w-[180px] text-center py-6 px-4 border-r border-white/5 last:border-r-0">
                  <div className="flex flex-col items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-500 mb-1" />
                    <span className="text-[11px] font-black text-foreground uppercase tracking-widest">{role.name}</span>
                    <Badge variant="outline" className="mt-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-bold">
                      {role.permissions?.length || 0} PERMS
                    </Badge>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(groupedPermissions).map((group) => (
              <React.Fragment key={group}>
                <TableRow className="bg-emerald-500/3 hover:bg-emerald-500/5 border-white/10">
                  <TableCell className="sticky left-0 z-20 bg-emerald-500/10 border-r border-white/10 py-3 px-8 text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em] backdrop-blur-md" colSpan={1}>
                    {group}
                  </TableCell>
                  <TableCell colSpan={roles.length} className="bg-emerald-500/5" />
                </TableRow>
                
                {groupedPermissions[group].map((perm) => (
                  <TableRow key={perm.id} className="hover:bg-white/5 group/row border-white/5 transition-colors">
                    <TableCell className="sticky left-0 z-20 bg-card/95 backdrop-blur-xl border-r border-white/10 py-4 px-8 group-hover/row:bg-emerald-500/2 transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[12px] font-bold text-foreground/80 group-hover/row:text-emerald-500 transition-colors">
                          {perm.name}
                        </span>
                        <span className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-tighter">
                          {perm.guard_name}
                        </span>
                      </div>
                    </TableCell>
                    {roles.map((role) => {
                      const isSelected = role.permissions?.some(p => p.id === perm.id);
                      return (
                        <TableCell key={`${role.id}-${perm.id}`} className="text-center p-0 border-r border-white/5 last:border-r-0">
                          <div 
                            className={cn(
                                "flex items-center justify-center h-14 w-full cursor-pointer transition-all duration-300",
                                isSelected ? "bg-emerald-500/5" : "hover:bg-white/2"
                            )}
                            onClick={() => !isUpdating && onToggle(role, perm.id, isSelected)}
                          >
                            <div className={cn(
                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                                isSelected 
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                                    : "bg-white/5 border-white/10 group-hover/row:border-white/20"
                            )}>
                              {isSelected && <Check className="w-4 h-4 stroke-4" />}
                            </div>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      {isUpdating && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <div className="bg-card/80 p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            <span className="text-sm font-bold text-foreground">Syncing Permissions...</span>
          </div>
        </div>
      )}
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---
export default function UserManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canView } = usePermission();

  // Data States
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingMatrix, setIsUpdatingMatrix] = useState(false);

  // UI States
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [roleViewMode, setRoleViewMode] = useState("cards"); // "cards" | "matrix"

  // New User Form State
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    password_confirmation: "",
    roleId: "",
    branchIds: [],
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" };
      const [usersRes, rolesRes, permsRes, branchesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/permissions?per_page=200`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`, { headers }),
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      const branchesData = await branchesRes.json();

      if (usersData.status === "success") setUsers(usersData.data.data || usersData.data);
      if (rolesData.status === "success") setRoles(rolesData.data.data || rolesData.data);
      if (permsData.status === "success") setPermissions(permsData.data.data || permsData.data);
      if (branchesData.status === "success") setBranches(branchesData.data.data || branchesData.data);
    } catch (error) {
      toast.error("Failed to load user management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status, session]);

  const handleOpenCreateRole = () => { setEditingRole(null); setIsRoleDialogOpen(true); };
  const handleOpenEditRole = (role) => { setEditingRole(role); setIsRoleDialogOpen(true); };

  const handleSaveRole = async (payload, roleId) => {
    try {
      const url = roleId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${roleId}` : `${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`;
      const method = roleId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { toast.success(roleId ? "Role Updated Successfully" : "Role Created Successfully"); fetchData(); } else { throw new Error(data.message || "Failed to save role"); }
    } catch (error) { toast.error(error.message); }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${roleId}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}` } });
      if (res.ok) { toast.success("Role Deleted"); fetchData(); } else { toast.error("Failed to delete role"); }
    } catch (e) { toast.error("Network error"); }
  };

  const handleOpenEditUser = (user) => {
    setEditingUser({ id: user.id, firstName: user.name.split(' ')[0] || "", lastName: user.name.split(' ').slice(1).join(' ') || "", email: user.email, roleId: user.roles?.[0]?.name || "", branchIds: user.branches?.map(b => b.id) || [], isActive: user.is_active });
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      const payload = { name: `${editingUser.firstName} ${editingUser.lastName}`, email: editingUser.email, is_active: editingUser.isActive, role_ids: [roles.find(r => r.name === editingUser.roleId)?.id].filter(Boolean), branch_ids: editingUser.branchIds };
      if (editingUser.password) payload.password = editingUser.password;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${editingUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { 
        toast.success("User updated successfully"); 
        setIsEditUserDialogOpen(false); 
        setEditingUser(null); 
        fetchData(); 
      } else { 
        throw new Error(data.message || "Failed to update user"); 
      }
    } catch (error) { 
        toast.error(error.message); 
    }
  };

  const handleToggleMatrixPermission = async (role, permId, isRemoving) => {
    setIsUpdatingMatrix(true);
    try {
        const currentPermIds = role.permissions?.map(p => p.id) || [];
        const updatedPermIds = isRemoving 
            ? currentPermIds.filter(id => id !== permId)
            : [...currentPermIds, permId];

        const payload = {
            name: role.name,
            permissions: updatedPermIds
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${role.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            toast.success(`Access updated for ${role.name}`, { icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> });
            await fetchData();
        } else {
            throw new Error("Failed to sync permission");
        }
    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsUpdatingMatrix(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}` } });
      if (res.ok) { toast.success("User deleted successfully"); fetchData(); } else { toast.error("Failed to delete user"); }
    } catch (error) { toast.error("Network error"); }
  };

  const handleCreateUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password || !newUser.password_confirmation || !newUser.roleId) { toast.error("Please fill in all fields"); return; }
    if (newUser.password !== newUser.password_confirmation) { toast.error("Passwords do not match"); return; }
    setIsCreatingUser(true);
    try {
      const payload = { name: `${newUser.firstName} ${newUser.lastName}`, email: newUser.email, password: newUser.password, password_confirmation: newUser.password_confirmation, role: newUser.roleId, roles: [newUser.roleId], role_ids: [roles.find(r => r.name === newUser.roleId)?.id].filter(Boolean), branch_ids: newUser.branchIds };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { toast.success("User created successfully"); setIsUserDialogOpen(false); setNewUser({ firstName: "", lastName: "", email: "", password: "", password_confirmation: "", roleId: "", branchIds: [] }); setShowPassword(false); setShowConfirmPassword(false); fetchData(); } else { throw new Error(data.message || "Failed to create user"); }
    } catch (error) { toast.error(error.message); } finally { setIsCreatingUser(false); }
  };

  const filteredUsers = users.filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));

  if (loading && users.length === 0) return <div className="p-10"><UsersPageSkeleton /></div>;

  return (
    <div className="flex-1 min-h-screen bg-background p-6 md:p-10 space-y-8 pb-32 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Users className="h-7 w-7 text-emerald-500" />
            </div>
            User Access Control
          </h1>
          <p className="text-muted-foreground font-medium mt-1 flex items-center gap-2">
            Global system permissions and role hierarchy management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProtectedComponent permission={PERMISSIONS.USER_CREATE}>
            <Button onClick={() => setIsUserDialogOpen(true)} className="h-12 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95 border-none">
              <UserPlus className="mr-2 h-4 w-4" /> Add New User
            </Button>
          </ProtectedComponent>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-8">
        <TabsList className="h-14 p-1.5 bg-muted/40 backdrop-blur-md rounded-2xl w-full sm:w-[500px] border border-white/5 transition-all">
          {canView("User") && (
            <TabsTrigger value="users" className="flex-1 h-full rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-[10px] uppercase tracking-widest transition-all">
              <Users className="w-4 h-4 mr-2" /> System Users
            </TabsTrigger>
          )}
          {canView("Role") && (
            <TabsTrigger value="roles" className="flex-1 h-full rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-[10px] uppercase tracking-widest transition-all">
              <Shield className="w-4 h-4 mr-2" /> Roles & Access
            </TabsTrigger>
          )}
        </TabsList>

        {/* ================= USERS TAB ================= */}
        <TabsContent value="users" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative group w-full sm:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                <Input placeholder="Search users by name or email..." className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all font-medium text-sm shadow-inner" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Listing {filteredUsers.length} Users</p>
            </div>
          </div>

          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-3xl border-border/10">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 backdrop-blur-md">
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="py-5 pl-8 text-[10px] font-black text-foreground uppercase tracking-widest">Name & Profile</TableHead>
                    <TableHead className="py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Assigned Role</TableHead>
                    <TableHead className="py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Branch Access</TableHead>
                    <TableHead className="py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Status</TableHead>
                    <TableHead className="py-5 text-[10px] font-black text-foreground uppercase tracking-widest">Last Activity</TableHead>
                    <TableHead className="py-5 pr-8 text-right text-[10px] font-black text-foreground uppercase tracking-widest">Execution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 group border-border/20 transition-all duration-300">
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-11 w-11 border-2 border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <AvatarImage src={user.profile_image} />
                              <AvatarFallback className="bg-emerald-500/10 text-emerald-500 font-black text-sm">{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {user.is_active && <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background shadow-lg" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">{user.name}</span>
                            <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5"><Mail className="w-3 h-3" /> {user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles?.map((r) => (
                            <Badge key={r.id} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none font-bold text-[10px] uppercase tracking-wider py-0.5 px-2 rounded-lg">
                               <Shield className="w-2.5 h-2.5 mr-1" /> {r.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.branches?.map((b) => (
                            <Badge key={b.id} variant="outline" className="font-bold text-[9px] border-white/10 bg-white/5 text-muted-foreground px-2 py-0 rounded-md">
                              {b.name}
                            </Badge>
                          ))}
                          {(!user.branches || user.branches.length === 0) && <span className="text-[10px] font-medium text-muted-foreground/40 italic">Global Restricted</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "outline" : "destructive"} className={cn("px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-widest", user.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
                          {user.is_active ? "Active" : "Locked"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-muted-foreground/60">
                        {user.last_login_at ? (
                            <div className="flex flex-col gap-0.5">
                                <span>{new Date(user.last_login_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className="text-[9px] opacity-60 uppercase">{new Date(user.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ) : <span className="text-[10px] italic opacity-40">No Record</span>}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted/50 transition-colors">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/40 shadow-xl p-1">
                            <DropdownMenuLabel className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/70 px-3 py-2">User Actions</DropdownMenuLabel>
                            <ProtectedComponent permission={PERMISSIONS.USER_EDIT}>
                              <DropdownMenuItem onClick={() => handleOpenEditUser(user)} className="rounded-lg py-2 focus:bg-emerald-500/10 focus:text-emerald-500 cursor-pointer font-bold text-xs"><Pencil className="w-4 h-4 mr-2" /> Edit Records</DropdownMenuItem>
                            </ProtectedComponent>
                            <DropdownMenuSeparator className="bg-border/40" />
                            <ProtectedComponent permission={PERMISSIONS.USER_DELETE}>
                              <DropdownMenuItem className="text-red-500 rounded-lg py-2 focus:bg-red-500/10 focus:text-red-500 cursor-pointer font-bold text-xs" onClick={() => handleDeleteUser(user.id)}><Trash2 className="w-4 h-4 mr-2" /> Revoke Access</DropdownMenuItem>
                            </ProtectedComponent>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} className="h-64 text-center text-muted-foreground font-bold opacity-40 italic">No users matching criteria found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ================= ROLES TAB ================= */}
        <TabsContent value="roles" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 bg-muted/30 backdrop-blur-md p-1 rounded-2xl border border-white/5 shadow-sm">
                <Button 
                    variant={roleViewMode === "cards" ? "secondary" : "ghost"} 
                    onClick={() => setRoleViewMode("cards")}
                    className={cn(
                        "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                        roleViewMode === "cards" && "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                    )}
                >
                    <LayoutGrid className="w-4 h-4 mr-2" /> Card View
                </Button>
                <Button 
                    variant={roleViewMode === "matrix" ? "secondary" : "ghost"} 
                    onClick={() => setRoleViewMode("matrix")}
                    className={cn(
                        "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                        roleViewMode === "matrix" && "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                    )}
                >
                    <ShieldCheck className="w-4 h-4 mr-2" /> Permission Matrix
                </Button>
            </div>
            
            {roleViewMode === "cards" && (
                <ProtectedComponent permission={PERMISSIONS.ROLE_CREATE}>
                    <Button onClick={handleOpenCreateRole} className="h-11 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all border-none">
                        <Plus className="mr-2 h-4 w-4" /> New Privilege Role
                    </Button>
                </ProtectedComponent>
            )}
          </div>

          {roleViewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ProtectedComponent permission={PERMISSIONS.ROLE_CREATE}>
                <button onClick={handleOpenCreateRole} className="group border-2 border-dashed border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center hover:border-emerald-500/50 hover:bg-emerald-500/2 transition-all duration-500 min-h-[280px]">
                    <div className="h-16 w-16 rounded-[1.25rem] bg-emerald-500/10 group-hover:bg-emerald-500 shadow-xl group-hover:shadow-emerald-500/30 group-hover:translate-y-[-5px] flex items-center justify-center mb-6 text-emerald-500 group-hover:text-white transition-all duration-500">
                    <Plus className="h-8 w-8 stroke-3" />
                    </div>
                    <h3 className="font-black uppercase tracking-widest text-foreground text-sm">Forge New Role</h3>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 max-w-[200px] leading-relaxed uppercase tracking-tighter opacity-60">Define high-level permissions for organizational hierarchy</p>
                </button>
                </ProtectedComponent>

                {roles.map((role) => (
                <Card key={role.id} className="group hover:shadow-2xl transition-all duration-500 border-white/5 bg-card/60 backdrop-blur-md relative overflow-hidden rounded-[2rem] border hover:border-emerald-500/30">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-4 pt-8 px-8 flex flex-row items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">Access Guard: {role.guard_name}</Badge>
                            </div>
                            <h3 className="font-black text-xl text-foreground tracking-tight">{role.name}</h3>
                        </div>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-white/5 text-muted-foreground/60"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl p-1 shadow-2xl w-48 font-bold">
                            <ProtectedComponent permission={PERMISSIONS.ROLE_EDIT}>
                            <DropdownMenuItem onClick={() => handleOpenEditRole(role)} className="rounded-xl py-2.5 focus:bg-emerald-500 focus:text-white cursor-pointer text-xs"><Pencil className="w-4 h-4 mr-2" /> Modify Access</DropdownMenuItem>
                            </ProtectedComponent>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <ProtectedComponent permission={PERMISSIONS.ROLE_DELETE}>
                            <DropdownMenuItem className="text-red-500 rounded-xl py-2.5 focus:bg-red-500 focus:text-white cursor-pointer text-xs" onClick={() => handleDeleteRole(role.id)}><Trash2 className="w-4 h-4 mr-2" /> Erase Role</DropdownMenuItem>
                            </ProtectedComponent>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5 shadow-inner">
                        <div className="flex items-center justify-between font-black text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                        <span>Capabilities Ledger</span>
                        <span className="text-emerald-500">{role.permissions?.length || 0} ACTIVE</span>
                        </div>
                        <div className="flex flex-wrap gap-2 h-20 overflow-hidden relative group-hover:h-auto transition-all duration-500">
                        {role.permissions?.slice(0, 8).map((p) => (
                            <Badge key={p.id} variant="secondary" className="text-[9px] px-2 py-0 border-none bg-white/10 text-muted-foreground transition-all group-hover:bg-emerald-500/20 group-hover:text-emerald-500 whitespace-nowrap">
                            {p.name.replace(/(Index|Create|Update|Delete)/g, "")}
                            </Badge>
                        ))}
                        {(role.permissions?.length || 0) > 8 && <span className="text-[10px] font-bold text-muted-foreground opacity-30 mt-1">+{role.permissions.length - 8} more</span>}
                        {!role.permissions?.length && <span className="text-[10px] italic opacity-30">No permissions mapped</span>}
                        {role.permissions?.length > 8 && <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/5 to-transparent group-hover:hidden" />}
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Created Genesis</span>
                            <span className="text-xs font-bold text-muted-foreground/80 flex items-center gap-2 pt-1"><Calendar className="w-3 h-3" /> {new Date(role.created_at).toLocaleDateString()}</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-10 px-5 rounded-xl border-emerald-500/20 text-emerald-500 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white shadow-lg shadow-emerald-500/10 transition-all active:scale-95" onClick={() => handleOpenEditRole(role)}>
                        Configure
                        </Button>
                    </div>
                    </CardContent>
                </Card>
                ))}
            </div>
          ) : (
            <PermissionMatrix roles={roles} permissions={permissions} onToggle={handleToggleMatrixPermission} isUpdating={isUpdatingMatrix} />
          )}
        </TabsContent>
      </Tabs>

      {/* ─── ROLE FORM DIALOG ─── */}
      <RoleFormDialog isOpen={isRoleDialogOpen} onClose={() => setIsRoleDialogOpen(false)} initialData={editingRole} allPermissions={permissions} onSave={handleSaveRole} />

      {/* ─── ADD USER DIALOG ─── */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 border-none bg-card/95 backdrop-blur-xl shadow-3xl rounded-[2.5rem] overflow-hidden">
          <DialogHeader className="px-10 py-8 bg-emerald-500/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-xl shadow-emerald-500/5">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">Provision Member</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">Create a high-access system account</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-10 py-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Legal First Name</Label>
                <Input placeholder="John" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Legal Last Name</Label>
                <Input placeholder="Doe" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Authorization Email</Label>
              <Input type="email" placeholder="staff@enterprise.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Secure Code</Label>
                <div className="relative group">
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-emerald-500 transition-colors">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Verify Code</Label>
                <div className="relative group">
                  <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={newUser.password_confirmation} onChange={(e) => setNewUser({ ...newUser, password_confirmation: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all pr-12" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-emerald-500 transition-colors">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Security Privilege</Label>
                  <Select value={newUser.roleId} onValueChange={(val) => setNewUser({ ...newUser, roleId: val })}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all">
                      <Shield className="w-4 h-4 mr-2 text-emerald-500" />
                      <SelectValue placeholder="Identify Role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl p-1 shadow-2xl">
                      {roles.map((r) => <SelectItem key={r.id} value={String(r.name)} className="rounded-xl py-2.5 focus:bg-emerald-500 focus:text-white font-bold text-xs">{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Operations Domain (Branches)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 border border-white/5 bg-white/5 rounded-[1.5rem] shadow-inner">
                    {branches.map((b) => (
                      <div key={b.id} onClick={() => { const newIds = newUser.branchIds.includes(b.id) ? newUser.branchIds.filter(id => id !== b.id) : [...newUser.branchIds, b.id]; setNewUser({ ...newUser, branchIds: newIds }); }} className={cn("flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-all", newUser.branchIds.includes(b.id) ? "bg-emerald-500/20 border-emerald-500/20 text-emerald-500 shadow-sm" : "hover:bg-white/5 border-transparent opacity-60")}>
                        {newUser.branchIds.includes(b.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        <span className="text-[11px] font-black uppercase tracking-tighter">{b.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          </div>
          <DialogFooter className="px-10 py-8 border-t border-white/10 bg-card/50 flex flex-row items-center justify-end gap-3 shadow-[0_-15px_30px_rgba(0,0,0,0.05)]">
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)} disabled={isCreatingUser} className="h-12 px-8 rounded-2xl border-white/10 font-black text-xs uppercase tracking-widest hover:bg-white/5">Cancel</Button>
            <Button onClick={handleCreateUser} disabled={isCreatingUser} className="h-12 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95 border-none">
              {isCreatingUser ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Settings className="w-4 h-4 mr-2" />} Initialize Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT USER DIALOG ─── */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 border-none bg-card/95 backdrop-blur-xl shadow-3xl rounded-[2.5rem] overflow-hidden">
          <DialogHeader className="px-10 py-8 bg-emerald-500/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-xl shadow-emerald-500/5">
                <Pencil className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">Record Refinement</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">Update system identity and access scope</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-10 py-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Revised First Name</Label>
                <Input placeholder="John" value={editingUser?.firstName || ""} onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Revised Last Name</Label>
                <Input placeholder="Doe" value={editingUser?.lastName || ""} onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Registered Email</Label>
              <Input type="email" placeholder="staff@enterprise.com" value={editingUser?.email || ""} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all opacity-80 cursor-not-allowed" disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Override Password (Optional)</Label>
              <Input type="password" placeholder="Leave blank to maintain current" onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all" />
            </div>
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Promotion / Demotion</Label>
                  <Select value={editingUser?.roleId || ""} onValueChange={(val) => setEditingUser({ ...editingUser, roleId: val })}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-emerald-500 transition-all">
                      <Shield className="w-4 h-4 mr-2 text-emerald-500" />
                      <SelectValue placeholder="Update Role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl p-1 shadow-2xl">
                      {roles.map((r) => <SelectItem key={r.id} value={String(r.name)} className="rounded-xl py-2.5 focus:bg-emerald-500 focus:text-white font-bold text-xs">{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">Expand / Limit Domain</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 border border-white/5 bg-white/5 rounded-[1.5rem] shadow-inner">
                    {branches.map((b) => (
                      <div key={b.id} onClick={() => { const newIds = editingUser.branchIds.includes(b.id) ? editingUser.branchIds.filter(id => id !== b.id) : [...editingUser.branchIds, b.id]; setEditingUser({ ...editingUser, branchIds: newIds }); }} className={cn("flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-all", editingUser?.branchIds?.includes(b.id) ? "bg-emerald-500/20 border-emerald-500/20 text-emerald-500 shadow-sm" : "hover:bg-white/5 border-transparent opacity-60")}>
                        {editingUser?.branchIds?.includes(b.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        <span className="text-[11px] font-black uppercase tracking-tighter">{b.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
            <div className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/5">
               <div>
                  <h4 className="font-bold text-sm text-foreground">Operational Status</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Grant or suspend system compute</p>
               </div>
               <Switch checked={editingUser?.isActive} onCheckedChange={(val) => setEditingUser({ ...editingUser, isActive: val })} className="data-[state=checked]:bg-emerald-500" />
            </div>
          </div>
          <DialogFooter className="px-10 py-8 border-t border-white/10 bg-card/50 flex flex-row items-center justify-end gap-3 shadow-[0_-15px_30px_rgba(0,0,0,0.05)]">
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)} className="h-12 px-8 rounded-2xl border-white/10 font-black text-xs uppercase tracking-widest hover:bg-white/5">Reject Changes</Button>
            <Button onClick={handleUpdateUser} className="h-12 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95 border-none">
              Commit Refinement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
