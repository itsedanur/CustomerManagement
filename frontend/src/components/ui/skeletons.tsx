import React from 'react';
import { Skeleton } from './skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48 bg-slate-200" />
        <Skeleton className="h-9 w-32 bg-slate-200" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24 bg-slate-200" />
              <Skeleton className="h-8 w-8 rounded-lg bg-slate-200" />
            </div>
            <Skeleton className="h-7 w-16 bg-slate-200" />
            <Skeleton className="h-3 w-32 bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
          <Skeleton className="h-5 w-40 bg-slate-200" />
          <Skeleton className="h-64 w-full bg-slate-100 rounded-lg" />
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
          <Skeleton className="h-5 w-40 bg-slate-200" />
          <Skeleton className="h-64 w-full bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-40 bg-slate-200" />
        <Skeleton className="h-9 w-28 bg-slate-200" />
      </div>
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex gap-3 mb-4">
          <Skeleton className="h-9 w-64 bg-slate-200" />
          <Skeleton className="h-9 w-32 bg-slate-200" />
          <Skeleton className="h-9 w-32 bg-slate-200" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100">
            <Skeleton className="h-4 w-36 bg-slate-200" />
            <Skeleton className="h-4 w-28 bg-slate-200" />
            <Skeleton className="h-4 w-40 bg-slate-200" />
            <Skeleton className="h-6 w-16 rounded-full bg-slate-200" />
            <Skeleton className="h-8 w-16 bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center border-b pb-4">
        <Skeleton className="h-8 w-64 bg-slate-200" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 bg-slate-200" />
          <Skeleton className="h-9 w-24 bg-slate-200" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl bg-white border border-slate-200" />
          <Skeleton className="h-64 w-full rounded-xl bg-white border border-slate-200" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl bg-white border border-slate-200" />
        </div>
      </div>
    </div>
  );
};
