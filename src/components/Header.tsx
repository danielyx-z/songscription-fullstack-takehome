'use client';

import React from 'react';
import Image from 'next/image';
import { Music2, Clock, Target } from 'lucide-react';

interface HeaderProps {
  totalSongs: number;
  totalPracticeSeconds: number;
  averageAccuracy: number;
}

export const Header: React.FC<HeaderProps> = ({
  totalSongs,
  totalPracticeSeconds,
  averageAccuracy,
}) => {
  const practiceHours = (totalPracticeSeconds / 3600).toFixed(1);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-700/80 bg-[#0d1424]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo & Wordmark */}
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-md flex items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="Play Anything Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <Image
                src="/images/play-anything-wordmark-white.svg"
                alt="Play Anything"
                width={150}
                height={26}
                className="h-6 w-auto object-contain"
                priority
              />
            </div>
            <span className="sr-only">Play Anything</span>
          </div>

          {/* Quick Library Statistics with high contrast and #28ba90 accent */}
          <div className="hidden md:flex items-center gap-6 px-5 py-2.5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#28ba90]/15 text-[#28ba90] font-bold">
                <Music2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Songs</div>
                <div className="text-sm font-bold text-white">{totalSongs}</div>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#28ba90]/15 text-[#28ba90] font-bold">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Practice</div>
                <div className="text-sm font-bold text-white">{practiceHours} hrs</div>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#28ba90]/15 text-[#28ba90] font-bold">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Accuracy</div>
                <div className="text-sm font-bold text-white">
                  {averageAccuracy > 0 ? `${Math.round(averageAccuracy)}%` : '--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
