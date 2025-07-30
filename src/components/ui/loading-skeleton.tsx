import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// Pre-built skeleton components for common UI patterns
const SkeletonCard = ({ className, ...props }: SkeletonProps) => (
  <div className={cn("p-4 border rounded-lg space-y-3", className)} {...props}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-8 w-20" />
  </div>
);

const SkeletonTable = ({ rows = 5, className, ...props }: SkeletonProps & { rows?: number }) => (
  <div className={cn("space-y-3", className)} {...props}>
    <div className="grid grid-cols-4 gap-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid grid-cols-4 gap-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    ))}
  </div>
);

const SkeletonForm = ({ className, ...props }: SkeletonProps) => (
  <div className={cn("space-y-4", className)} {...props}>
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-20 w-full" />
    </div>
    <Skeleton className="h-10 w-24" />
  </div>
);

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonForm };