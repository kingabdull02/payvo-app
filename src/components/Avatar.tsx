import React from 'react';

interface AvatarProps {
  /** Full display name — used to derive initials. */
  name?: string;
  /** Optional URL. If absent, an initials circle is shown instead. */
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-20 h-20 text-xl',
} as const;

/** Derives up to 2 uppercase initials from a name string. */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

/**
 * Displays the user's avatar image when available.
 * Falls back to a Deep Navy circle with the user's initials.
 */
export const Avatar: React.FC<AvatarProps> = ({
  name = '',
  avatarUrl,
  size = 'md',
  className = '',
  onClick,
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const cursor = onClick ? 'cursor-pointer' : '';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onClick={onClick}
        className={`${sizeClass} rounded-full object-cover ${cursor} ${className}`}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${sizeClass} rounded-full bg-deepNavy text-white flex items-center justify-center font-bold select-none ${cursor} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
