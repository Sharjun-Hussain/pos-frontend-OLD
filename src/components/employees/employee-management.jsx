"use client"; // Required for useState

import { useState } from "react";
import { columns } from "@/components/employees/columns";
import { DataTable } from "@/components/general/data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Search,
  Download,
  Filter,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Briefcase,
  LoaderIcon,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mockEmployees = [
  {
    id: "emp_1",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    image: "https://via.placeholder.com/40",
    role: "Manager",
    status: "active",
    phone: "0751234567",
    hireDate: "2023-05-15",
  },
  {
    id: "emp_2",
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    image: "https://via.placeholder.com/40",
    role: "Cashier",
    status: "active",
    phone: "0751234567",
    hireDate: "2024-01-10",
  },
  {
    id: "emp_3",
    name: "David Smith",
    email: "david.smith@example.com",
    image: "https://via.placeholder.com/40",
    role: "Cashier",
    status: "inactive",
    phone: "0751234567",
    hireDate: "2023-11-20",
  },
  {
    id: "emp_4",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    image: "https://via.placeholder.com/40",
    role: "Shift Supervisor",
    status: "active",
    phone: "0751234567",
    hireDate: "2023-08-01",
  },
];

const EmployeeBulkActions = ({ table }) => {
  const numSelected = table.getFilteredSelectedRowModel().rows.length;
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleDeactivate = () => {
    const selectedIds = selectedRows.map((row) => row.original.id);
    console.log("Deactivating employees:", selectedIds);
    // Add your API call logic here
    table.resetRowSelection(); // Clear selection after action
  };

  const handleDelete = () => {
    const selectedIds = selectedRows.map((row) => row.original.id);
    console.log("Deleting employees:", selectedIds);
    // Add your API call logic here
    table.resetRowSelection();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Actions ({numSelected})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDeactivate}>
          Deactivate Selected
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-500" onClick={handleDelete}>
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const EmployeeTableToolbar = ({ table, bulkActionsComponent }) => {
  const numSelected = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex items-center justify-between space-x-4 mb-4">
      <div className="flex flex-1 items-center space-x-2">
        {/* Filter by Name (Search Input) */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter employees by name..."
            value={table.getColumn("name")?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-10"
          />
        </div>

        <Select
          value={table.getColumn("role")?.getFilterValue() ?? ""}
          onValueChange={(value) => {
            table.getColumn("role")?.setFilterValue(value || undefined);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={undefined}>All Roles</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="cashier">Cashier</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={table.getColumn("status")?.getFilterValue() ?? ""}
          onValueChange={(value) => {
            table.getColumn("status")?.setFilterValue(value || undefined);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={undefined}>All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* TODO: Add filter by Role (similar to status) */}
      </div>

      {numSelected > 0 && bulkActionsComponent}
    </div>
  );
};

// 6. CHANGED: Statistics for employees
const employeeStats = {
  totalEmployees: mockEmployees.length,
  activeStaff: mockEmployees.filter((emp) => emp.status === "active").length,
  inactiveStaff: mockEmployees.filter((emp) => emp.status === "inactive")
    .length,
  roles: new Set(mockEmployees.map((emp) => emp.role)).size,
};

// 7. CHANGED: Main page component
export default function EmployeesPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const data = mockEmployees; // Use employee data

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div className="hidden h-full flex-1 flex-col space-y-6 px-6 pb-6 pt-3 md:flex">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Employee Management
          </h1>
          <p className="text-muted-foreground">
            Manage your staff, roles, and permissions.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link href="/employees/new" passHref>
            {" "}
            {/* CHANGED: Link */}
            <Button
              onClick={() => setIsNavigating(true)}
              disabled={isNavigating}
              className="gap-2"
            >
              {isNavigating ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* 9. CHANGED: Employees Table Section */}
      <Card>
        {/* <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee List</CardTitle>
              <CardDescription>
                All employees in your system. Manage access and personal
                details.
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {mockEmployees.length} employees
            </div>
          </div>
        </CardHeader> */}
        <CardContent>
          <EmployeeTableToolbar
            table={table}
            bulkActionsComponent={<EmployeeBulkActions table={table} />}
          />

          <DataTable table={table} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
