import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MainCategorySkeleton() {
  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* --- Header Section --- */}
      {/* Matches the specific "Icon + Title + Description" layout in your page */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {/* Icon Box */}
          <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
          <div className="space-y-2">
            {/* Title */}
            <Skeleton className="h-6 w-48" />
            {/* Description */}
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        {/* Add Button */}
        <Skeleton className="h-10 w-36 rounded-md shrink-0" />
      </div>

      {/* --- Main Content Card --- */}
      <Card className="border shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          {/* Toolbar: Search (Left) & Actions (Right) */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
            {/* Search Input */}
            <Skeleton className="h-10 w-full md:w-[300px] rounded-md" />

            {/* Toolbar Buttons (View, Columns, etc.) */}
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {/* Checkbox Column */}
                  <TableHead className="w-[50px] pl-4">
                    <Skeleton className="h-4 w-4 rounded" />
                  </TableHead>

                  {/* Name Column (Main) */}
                  <TableHead className="w-[300px]">
                    <Skeleton className="h-4 w-24" />
                  </TableHead>

                  {/* Code / Extra Info */}
                  <TableHead className="hidden md:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </TableHead>

                  {/* Description */}
                  <TableHead className="hidden lg:table-cell w-full">
                    <Skeleton className="h-4 w-32" />
                  </TableHead>

                  {/* Status */}
                  <TableHead className="w-[100px]">
                    <Skeleton className="h-4 w-16" />
                  </TableHead>

                  {/* Actions Column */}
                  <TableHead className="w-[80px] text-right pr-4">
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Render 5 Skeleton Rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-16 hover:bg-transparent">
                    {/* Checkbox */}
                    <TableCell className="pl-4">
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>

                    {/* Name + Avatar Group */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16 opacity-70" />
                        </div>
                      </div>
                    </TableCell>

                    {/* Code */}
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>

                    {/* Description */}
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-full max-w-[200px]" />
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>

                    {/* Action Button */}
                    <TableCell className="text-right pr-4">
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <Skeleton className="h-4 w-48" /> {/* "Selected rows..." text */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-20" /> {/* Prev */}
              <Skeleton className="h-8 w-20" /> {/* Next */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
