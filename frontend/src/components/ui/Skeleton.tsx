import { cn } from "@/utils/helpers";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rect" | "circle";
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({
  className,
  variant = "rect",
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const base = cn(
    "shimmer animate-shimmer",
    variant === "circle" && "rounded-full",
    variant === "text" && "rounded-md h-4",
    variant === "rect" && "rounded-xl",
    className
  );

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={base}
          style={{
            width: width ?? "100%",
            height: height ?? (variant === "text" ? 16 : 48),
          }}
        />
      ))}
    </>
  );
}

/** Pre-built skeleton for a subject card */
export function SubjectCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <Skeleton height={8} className="rounded-full" />
    </div>
  );
}

/** Pre-built skeleton for a stat card */
export function StatCardSkeleton() {
  return (
    <div className="card p-5 space-y-2">
      <Skeleton variant="text" width="50%" height={12} />
      <Skeleton variant="text" width="30%" height={32} />
    </div>
  );
}
