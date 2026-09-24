'use client';

import React from 'react';
import { ViewMode } from '@/types/song';

interface SkeletonLoaderProps {
  viewMode: ViewMode;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  viewMode,
  count = 6,
}) => {
  if (viewMode === 'table') {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-800">
            {Array.from({ length: count }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-4 px-3 w-10">
                  <div className="h-4 w-4 rounded bg-slate-800" />
                </td>
                <td className="py-4 px-3 w-32">
                  <div className="h-10 w-28 rounded-lg bg-slate-800" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-4 w-40 rounded bg-slate-800 mb-2" />
                  <div className="h-3 w-24 rounded bg-slate-800/60" />
                </td>
                <td className="py-4 px-3">
                  <div className="h-5 w-20 rounded bg-slate-800" />
                </td>
                <td className="py-4 px-3">
                  <div className="h-4 w-14 rounded bg-slate-800 mb-1" />
                  <div className="h-3 w-10 rounded bg-slate-800/60" />
                </td>
                <td className="py-4 px-3">
                  <div className="h-4 w-12 rounded bg-slate-800 mb-1" />
                  <div className="h-3 w-12 rounded bg-slate-800/60" />
                </td>
                <td className="py-4 px-3">
                  <div className="h-4 w-10 rounded bg-slate-800" />
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <div className="h-8 w-16 rounded-lg bg-slate-800" />
                    <div className="h-8 w-8 rounded-lg bg-slate-800" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg animate-pulse"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="h-5 w-44 rounded-md bg-slate-800 mb-2" />
                <div className="h-3 w-28 rounded-md bg-slate-800/60" />
              </div>
              <div className="h-6 w-6 rounded-md bg-slate-800" />
            </div>

            <div className="mt-3 flex gap-2">
              <div className="h-5 w-20 rounded-md bg-slate-800" />
              <div className="h-5 w-16 rounded-md bg-slate-800" />
            </div>

            <div className="mt-4 h-[74px] w-full rounded-xl bg-slate-800/80" />

            <div className="mt-3.5 h-12 w-full rounded-xl bg-slate-950/40" />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between">
            <div className="h-7 w-28 rounded-lg bg-slate-800" />
            <div className="h-7 w-7 rounded-lg bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
};
