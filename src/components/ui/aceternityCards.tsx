"use client";
import React, { useEffect } from 'react';
import { animate } from 'motion';
import { cn } from '../../lib/utils';

export const Card = ({ className, children }: { className?: string; children: React.ReactNode; }) => {
  return (
    <div
      className={cn(
        'max-w-sm w-full mx-auto p-6 rounded-2xl border border-[#D9E2E7] bg-white shadow-paper',
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
  <h3 className={cn('text-lg font-bold font-serif text-[#0F2A3A] py-1', className)}>{children}</h3>
);

export const CardDescription = ({ children, className }: { children: React.ReactNode; className?: string; }) => (
  <p className={cn('text-sm text-[#5B7280]', className)}>{children}</p>
);

export const CardSkeletonContainer = ({ className, children, showGradient = true }: { className?: string; children: React.ReactNode; showGradient?: boolean; }) => (
  <div
    className={cn(
      'h-[12rem] rounded-xl relative overflow-hidden bg-[#EEF3F5] border border-[#D9E2E7]/60',
      className,
      showGradient &&
        'bg-[#EEF3F5] [mask-image:radial-gradient(50%_50%_at_50%_50%,black_0%,transparent_100%)]'
    )}
  >
    {children}
  </div>
);

export const CardDemo = () => {
  useEffect(() => {
    animate(
      [
        ['.pulse', { scale: [1, 1.05, 1] }, { duration: 1.2 }],
      ],
      { repeat: Infinity, repeatDelay: 0.5 }
    );
  }, []);
  return (
    <Card>
      <CardSkeletonContainer>
        <div className="pulse absolute inset-0" />
      </CardSkeletonContainer>
      <CardTitle>Damn good card</CardTitle>
      <CardDescription>A card that showcases a set of tools that you use to create your product.</CardDescription>
    </Card>
  );
};


