/**
 * StatCard - Reusable metric card for the dashboard.
 *
 * Displays a single KPI with a title, value, optional subtitle, optional icon,
 * and a coloured left-border accent.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

// Map of colour names to Tailwind border-colour classes.
// We use a plain object instead of template literals so Tailwind's JIT scanner
// can detect the classes at build time.
const borderColorMap: Record<string, string> = {
  indigo: 'border-indigo-500',
  green: 'border-green-500',
  red: 'border-red-500',
  amber: 'border-amber-500',
  blue: 'border-blue-500',
  purple: 'border-purple-500',
  gray: 'border-gray-400',
};

const iconColorMap: Record<string, string> = {
  indigo: 'text-indigo-500',
  green: 'text-green-500',
  red: 'text-red-500',
  amber: 'text-amber-500',
  blue: 'text-blue-500',
  purple: 'text-purple-500',
  gray: 'text-gray-400',
};

export interface StatCardProps {
  /** Card heading, e.g. "Available Equipment" */
  title: string;
  /** Primary metric value */
  value: string | number;
  /** Secondary line below the value */
  subtitle?: string;
  /** Optional icon rendered in the top-right */
  icon?: ReactNode;
  /**
   * Accent colour key (maps to a Tailwind colour).
   * Supported: "indigo" | "green" | "red" | "amber" | "blue" | "purple" | "gray"
   * Defaults to "indigo".
   */
  color?: string;
  /** Optional link destination - wraps the whole card in a react-router Link */
  to?: string;
  /** True while the parent is still loading data */
  loading?: boolean;
}

function CardContent({ title, value, subtitle, icon, color = 'indigo', loading }: StatCardProps) {
  const border = borderColorMap[color] ?? borderColorMap['indigo'];
  const iconColor = iconColorMap[color] ?? iconColorMap['indigo'];

  return (
    <div
      className={`relative bg-white rounded-lg shadow-sm overflow-hidden border-l-4 ${border} px-5 py-6`}
    >
      {/* Icon */}
      {icon && (
        <div className={`absolute top-4 right-4 ${iconColor} opacity-80`} aria-hidden="true">
          <div className="h-8 w-8">{icon}</div>
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-gray-500 truncate pr-10">{title}</p>

      {/* Value */}
      {loading ? (
        <div className="mt-2 h-8 w-20 rounded bg-gray-200 animate-pulse" />
      ) : (
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      )}

      {/* Subtitle */}
      {subtitle && !loading && (
        <p className="mt-1 text-xs text-gray-500 truncate">{subtitle}</p>
      )}
    </div>
  );
}

/**
 * A single stat card.  When `to` is provided the card is wrapped in a
 * react-router <Link> so it behaves like a navigation element.
 */
export default function StatCard(props: StatCardProps) {
  if (props.to) {
    return (
      <Link
        to={props.to}
        className="block hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
      >
        <CardContent {...props} />
      </Link>
    );
  }

  return <CardContent {...props} />;
}
