"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // Added for redirect
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
import { ProtectedComponent } from "@/components/auth/ProtectedComponent";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";

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

  // Group permissions for UI display
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
      {/* SCROLL FIX: 
         1. max-h-[85vh] limits height to viewport.
         2. h-[85vh] forces it to be tall.
         3. flex flex-col allows us to stack Header, Content, Footer.
         4. overflow-hidden prevents body scroll.
      */}
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>
            {initialData ? "Edit Role & Permissions" : "Create New Role"}
          </DialogTitle>
          <DialogDescription>
            Configure the access level and specific permissions for this role.
          </DialogDescription>
        </DialogHeader>

        {/* Main Content Area - Grow to fill space */}
        <div className="flex flex-col flex-1 overflow-hidden bg-slate-50/50 min-h-0">
          {/* Role Name (Fixed at top of scroll area) */}
          <div className="p-6 pb-2 bg-white shrink-0">
            <Label className="mb-2 block">
              Role Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g. Sales Manager"
              {...form.register("name")}
              className="max-w-md"
            />
             {form.formState.errors.name && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Permissions Header (Sticky) */}
          <div className="px-6 py-2 flex items-center justify-between bg-white border-b shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-sm">
                Permissions Configuration
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">
                {selectedPermIds.length} selected
              </span>
              <Button
                variant={
                  selectedPermIds.length === allPermissions.length
                    ? "destructive"
                    : "outline"
                }
                size="sm"
                onClick={toggleAll}
                className="h-8 text-xs"
              >
                {selectedPermIds.length === allPermissions.length
                  ? "Deselect All"
                  : "Select All System"}
              </Button>
            </div>
          </div>

          {/* Scrollable Permissions Matrix */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 grid grid-cols-1 gap-6">
              {Object.keys(groupedPermissions).map((group) => {
                const groupPerms = groupedPermissions[group];
                const allInGroupSelected =
                  groupPerms.length > 0 &&
                  groupPerms.every((p) => selectedPermIds.includes(p.id));
                const someInGroupSelected = groupPerms.some((p) =>
                  selectedPermIds.includes(p.id)
                );

                return (
                  <div
                    key={group}
                    className="bg-white border rounded-lg shadow-sm overflow-hidden"
                  >
                    {/* Group Header */}
                    <div
                      className="px-4 py-3 bg-slate-50/80 border-b flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleGroup(group)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                                        ${
                                          allInGroupSelected
                                            ? "bg-blue-600 border-blue-600 text-white"
                                            : "bg-white border-slate-300"
                                        }
                                    `}
                        >
                          {allInGroupSelected && <Check className="w-3 h-3" />}
                          {!allInGroupSelected && someInGroupSelected && (
                            <div className="w-2 h-2 bg-blue-600 rounded-sm" />
                          )}
                        </div>
                        <span className="font-semibold text-sm text-slate-800">
                          {group}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-white border"
                      >
                        {
                          groupPerms.filter((p) =>
                            selectedPermIds.includes(p.id)
                          ).length
                        }{" "}
                        / {groupPerms.length}
                      </Badge>
                    </div>

                    {/* Permissions Grid */}
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupPerms.map((perm) => {
                        const isSelected = selectedPermIds.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            className={`
                                                group flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-all duration-200
                                                ${
                                                  isSelected
                                                    ? "bg-blue-50/50 border-blue-200 shadow-sm"
                                                    : "hover:bg-slate-50 border-transparent"
                                                }
                                            `}
                            onClick={() => togglePermission(perm.id)}
                          >
                            <div
                              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-slate-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span
                                className={`text-xs font-medium leading-none ${
                                  isSelected
                                    ? "text-blue-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {perm.name}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1 font-mono">
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

        <DialogFooter className="px-6 py-4 border-t bg-white shrink-0">
          <Button variant="destructive" onClick={onClose} disabled={isSubmitting}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button
            onClick={hookFormSubmit(onSubmit)}
            disabled={isSubmitting}
            className=" text-white"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {initialData ?<>   <Pencil className="w-4 h-4 mr-2" /> Update Role</> : <><Plus className="w-4 h-4 mr-2" /> Create Role</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function UserManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDevMode, setIsDevMode] = useState(false);
  const { canCreate, canUpdate, canDelete, canView } = usePermission();

  // Data States
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");

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

  // --- 1. AUTH REDIRECT ---
  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  // --- 2. FETCH DATA ---
  const fetchData = async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      };

      const [usersRes, rolesRes, permsRes, branchesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, { headers }),
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/permissions?per_page=200`,
          { headers }
        ),
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
      console.error("Failed to fetch data", error);
      toast.error("Failed to load user management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, session]);

  // --- HANDLERS: ROLES ---
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setIsRoleDialogOpen(true);
  };

  const handleOpenEditRole = (role) => {
    setEditingRole(role);
    setIsRoleDialogOpen(true);
  };

  const handleSaveRole = async (payload, roleId) => {
    try {
      const url = roleId
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${roleId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`;

      const method = roleId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          roleId ? "Role Updated Successfully" : "Role Created Successfully"
        );
        fetchData();
      } else {
        throw new Error(data.message || "Failed to save role");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${roleId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );

      if (res.ok) {
        toast.success("Role Deleted");
        fetchData();
      } else {
        toast.error("Failed to delete role");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const handleOpenEditUser = (user) => {
    setEditingUser({
      id: user.id,
      firstName: user.name.split(' ')[0] || "",
      lastName: user.name.split(' ').slice(1).join(' ') || "",
      email: user.email,
      roleId: user.roles?.[0]?.name || "",
      branchIds: user.branches?.map(b => b.id) || [],
      isActive: user.is_active
    });
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      const payload = {
        name: `${editingUser.firstName} ${editingUser.lastName}`,
        email: editingUser.email,
        is_active: editingUser.isActive,
        role_ids: [roles.find(r => r.name === editingUser.roleId)?.id].filter(Boolean),
        branch_ids: editingUser.branchIds,
      };

      if (editingUser.password) {
        payload.password = editingUser.password;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

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
      console.error(error);
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      if (res.ok) {
        toast.success("User deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleCreateUser = async () => {
    // Validation
    if (
      !newUser.firstName ||
      !newUser.lastName ||
      !newUser.email ||
      !newUser.password ||
      !newUser.password_confirmation ||
      !newUser.roleId
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newUser.password !== newUser.password_confirmation) {
      toast.error("Passwords do not match");
      return;
    }

    setIsCreatingUser(true);
    try {
      const payload = {
        name: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        password: newUser.password,
        password_confirmation: newUser.password_confirmation,
        role: newUser.roleId,
        roles: [newUser.roleId], // Legacy support
        role_ids: [roles.find(r => r.name === newUser.roleId)?.id].filter(Boolean),
        branch_ids: newUser.branchIds,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("User created successfully");
        setIsUserDialogOpen(false);
        setNewUser({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          password_confirmation: "",
          roleId: "",
          branchIds: [],
        });
        setShowPassword(false);
        setShowConfirmPassword(false);
        fetchData();
      } else {
        throw new Error(data.message || "Failed to create user");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-6 bg-slate-50/50 min-h-screen font-sans text-slate-900 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            User Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage system access, roles, and permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProtectedComponent permission={PERMISSIONS.USER_CREATE}>
            <Button
              className=" shadow-sm text-sm"
              onClick={() => setIsUserDialogOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </ProtectedComponent>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className=" h-10 p-1 w-[400px] grid grid-cols-2">
          {canView("User") && <TabsTrigger value="users">Users</TabsTrigger>}
          {canView("Role") && <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>}
        </TabsList>

        {/* ================= USERS TAB ================= */}
        <TabsContent value="users" className="space-y-6">
          <Card className="border shadow-sm bg-white overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-sm">
                All Users ({users.length})
              </h3>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 h-9"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="p-0">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="pl-6">Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Branches</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-slate-50/50">
                        <TableCell className="pl-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border">
                              <AvatarImage src={user.profile_image} />
                              <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {user.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((r) => (
                              <Badge
                                key={r.id}
                                variant="secondary"
                                className="font-normal text-xs border bg-white"
                              >
                                {r.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.branches?.map((b) => (
                              <Badge
                                key={b.id}
                                variant="outline"
                                className="font-normal text-[10px] border bg-slate-50 text-slate-600"
                              >
                                {b.name}
                              </Badge>
                            ))}
                            {(!user.branches || user.branches.length === 0) && (
                              <span className="text-[10px] text-slate-400">No Branch</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_active ? "outline" : "destructive"}
                            className={
                              user.is_active
                                ? "text-green-600 border-green-200 bg-green-50"
                                : ""
                            }
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <ProtectedComponent permission={PERMISSIONS.USER_EDIT}>
                                <DropdownMenuItem onClick={() => handleOpenEditUser(user)}>
                                  Edit
                                </DropdownMenuItem>
                              </ProtectedComponent>
                              <ProtectedComponent permission={PERMISSIONS.USER_DELETE}>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </ProtectedComponent>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ================= ROLES TAB ================= */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProtectedComponent permission={PERMISSIONS.ROLE_CREATE}>
              <button
                onClick={handleOpenCreateRole}
                className="group border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50 transition-all min-h-[200px]"
              >
                <div className="h-12 w-12 rounded-full bg-slate-50 group-hover:bg-white border shadow-sm flex items-center justify-center mb-4 text-blue-600 transition-colors">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-slate-900">Create New Role</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  Define a new set of permissions for a specific team function.
                </p>
              </button>
            </ProtectedComponent>

            {roles.map((role) => (
              <Card
                key={role.id}
                className="group hover:shadow-md transition-all border-slate-200 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-indigo-500"></div>

                <CardHeader className="pb-3 pt-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <h3 className="font-bold text-lg text-slate-900">
                        {role.name}
                      </h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mr-2 text-slate-400"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ProtectedComponent permission={PERMISSIONS.ROLE_EDIT}>
                          <DropdownMenuItem
                            onClick={() => handleOpenEditRole(role)}
                          >
                            <Pencil className="w-4 h-4 mr-2" /> Edit Permissions
                          </DropdownMenuItem>
                        </ProtectedComponent>
                        <DropdownMenuSeparator />
                        <ProtectedComponent permission={PERMISSIONS.ROLE_DELETE}>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Role
                          </DropdownMenuItem>
                        </ProtectedComponent>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="text-xs">
                    Access level: {role.guard_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Permissions Granted</span>
                      <Badge variant="secondary" className="bg-white">
                        {role.permissions?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 h-12 overflow-hidden relative">
                      {role.permissions?.slice(0, 5).map((p) => (
                        <span
                          key={p.id}
                          className="text-[10px] px-1.5 py-0.5 bg-white border rounded text-slate-600"
                        >
                          {p.name.replace(/(Index|Create|Update|Delete)/g, "")}
                        </span>
                      ))}
                      {(role.permissions?.length || 0) > 5 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                          ...
                        </span>
                      )}
                      <div className="absolute bottom-0 left-0 w-full h-4 bg-linear-to-t from-slate-50 to-transparent"></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Created: {new Date(role.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-600"
                      onClick={() => handleOpenEditRole(role)}
                    >
                      Manage Access
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 1. ROLE CREATION / EDITING */}
      <RoleFormDialog
        isOpen={isRoleDialogOpen}
        onClose={() => setIsRoleDialogOpen(false)}
        initialData={editingRole}
        allPermissions={permissions}
        onSave={handleSaveRole}
      />

      {/* 2. INVITE USER */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  placeholder="John"
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newUser.password_confirmation}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      password_confirmation: e.target.value,
                    })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign Roles</Label>
              <Select
                value={newUser.roleId}
                onValueChange={(val) => setNewUser({ ...newUser, roleId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.name)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign Branches</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md bg-slate-50">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center space-x-2">
                    <CheckSquare
                      className={`w-4 h-4 cursor-pointer ${
                        newUser.branchIds.includes(b.id)
                          ? "text-blue-600"
                          : "text-slate-300"
                      }`}
                      onClick={() => {
                        const newIds = newUser.branchIds.includes(b.id)
                          ? newUser.branchIds.filter((id) => id !== b.id)
                          : [...newUser.branchIds, b.id];
                        setNewUser({ ...newUser, branchIds: newIds });
                      }}
                    />
                    <span className="text-xs text-slate-700">{b.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Pick one or more branches for this user.</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setIsUserDialogOpen(false)}
              disabled={isCreatingUser}
            >
              Cancel
            </Button>
            <Button
              className="bg-slate-900"
              onClick={handleCreateUser}
              disabled={isCreatingUser}
            >
              {isCreatingUser && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 3. EDIT USER DIALOG */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>Modify user account details and branch access.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  placeholder="John"
                  value={editingUser?.firstName || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={editingUser?.lastName || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={editingUser?.email || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>New Password (Optional)</Label>
              <Input
                type="password"
                placeholder="Leave blank to keep current"
                onChange={(e) =>
                  setEditingUser({ ...editingUser, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Assign Roles</Label>
              <Select
                value={editingUser?.roleId || ""}
                onValueChange={(val) => setEditingUser({ ...editingUser, roleId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.name)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign Branches</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md bg-slate-50">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center space-x-2">
                    <CheckSquare
                      className={`w-4 h-4 cursor-pointer ${
                        editingUser?.branchIds?.includes(b.id)
                          ? "text-blue-600"
                          : "text-slate-300"
                      }`}
                      onClick={() => {
                        const newIds = editingUser.branchIds.includes(b.id)
                          ? editingUser.branchIds.filter((id) => id !== b.id)
                          : [...editingUser.branchIds, b.id];
                        setEditingUser({ ...editingUser, branchIds: newIds });
                      }}
                    />
                    <span className="text-xs text-slate-700">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
               <Switch 
                  id="user-active-edit"
                  checked={editingUser?.isActive}
                  onCheckedChange={(val) => setEditingUser({ ...editingUser, isActive: val })}
               />
               <Label htmlFor="user-active-edit">User Active Status</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setIsEditUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-slate-900"
              onClick={handleUpdateUser}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
