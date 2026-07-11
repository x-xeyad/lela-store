import React from "react";

export const SkeletonCard = () => {
  return (
    <div className="flex flex-col w-full rounded-2xl overflow-hidden bg-white dark:bg-brand-dark-card border border-primary/5 dark:border-secondary/5 p-5 space-y-4">
      {/* Image Skeleton */}
      <div className="aspect-[3/4] w-full rounded-xl animate-shimmer bg-slate-100 dark:bg-slate-800" />

      {/* Category Info Skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-3 w-1/4 rounded-full animate-shimmer bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-8 rounded-full animate-shimmer bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* Title Skeleton */}
      <div className="h-4 w-3/4 rounded-full animate-shimmer bg-slate-100 dark:bg-slate-800" />

      {/* Description Snippet Skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full animate-shimmer bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-5/6 rounded-full animate-shimmer bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* Divider */}
      <hr className="border-primary/5 dark:border-secondary/5 pt-1" />

      {/* Price Skeleton */}
      <div className="space-y-1">
        <div className="h-4 w-1/3 rounded-full animate-shimmer bg-slate-100 dark:bg-slate-800" />
        <div className="h-2 w-1/2 rounded-full animate-shimmer bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
};
