import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function OrganizationPageSkeleton() {
  return (
    <div className="hidden h-full flex-1 flex-col space-y-6 px-6 pb-6 pt-3 md:flex">
      {/* Header Section Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-[90px]" />
          <Skeleton className="h-10 w-[160px]" />
        </div>
      </div>

      {/* Statistics Cards Skeleton */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-7 w-[80px]" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div> */}

      {/* Organizations Table Section Skeleton */}
      <Card>
        <CardContent className="pt-6">
          {/* Toolbar Skeleton */}
          <div className="flex items-center justify-between space-x-4 mb-4">
            <div className="flex flex-1 items-center space-x-2">
              <Skeleton className="h-10 w-full max-w-sm" />
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="rounded-md border">
            {/* Table Header */}
            <div className="border-b p-4">
              <Skeleton className="h-5 w-full" />
            </div>
            {/* Table Body */}
            <div className="space-y-4 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-between space-x-2 pt-4">
            <Skeleton className="h-8 w-[150px]" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
