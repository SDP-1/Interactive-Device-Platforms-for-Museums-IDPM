import React from 'react';

type SkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
  rounded?: string;
  variant?: 'default' | 'futuristic';
};

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style = {}, rounded = 'md' }) => {
  const radius = rounded === 'full' ? '9999px' : rounded === 'sm' ? '6px' : rounded === 'lg' ? '12px' : '8px';
  return (
    <div
      className={`skeleton ${className}`}
      style={{ borderRadius: radius, ...style }}
      aria-hidden
    />
  );
};

export const SkeletonHeader: React.FC = () => (
  <div className="space-y-2">
    <Skeleton className="w-48 h-6" />
    <Skeleton className="w-32 h-4" />
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="p-4 bg-white rounded-xl shadow-sm">
    <Skeleton className="w-24 h-5 mb-3" />
    <Skeleton className="w-full h-6" />
  </div>
);

export default Skeleton;
