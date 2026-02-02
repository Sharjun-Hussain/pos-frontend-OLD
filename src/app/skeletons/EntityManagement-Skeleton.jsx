const { CardFooter } = require("@/components/ui/card");
const { Skeleton } = require("@/components/ui/skeleton");
const {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} = require("@/components/ui/table");

export const EntityManagementSkeleton = ({ columns, defaultPageSize = 10 }) => {
  const visibleColumns = columns.filter((col) => col.visible !== false);

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col gap-6">
      {/* Header Skeleton */}
      <div className=" rounded-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="w-full md:w-1/3 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-10 w-full md:w-[180px]" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row lg:items-center gap-4">
        <Skeleton className="h-10 lg:flex-grow" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-full sm:w-[180px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden border rounded-md">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col.key}>
                  <Skeleton className="h-5 w-3/4" />
                </TableHead>
              ))}
              <TableHead className="text-right">
                <Skeleton className="h-5 w-1/2 ml-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: defaultPageSize }).map((_, index) => (
              <TableRow key={index}>
                {visibleColumns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <CardFooter className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t">
          <Skeleton className="h-5 w-24" />
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </CardFooter>
      </div>
    </div>
  );
};
