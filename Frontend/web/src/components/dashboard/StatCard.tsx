import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon: LucideIcon;
  badge?: string;
  href?: string;
  onClick?: () => void;
}

export default function StatCard({
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  badge,
  href,
  onClick,
}: StatCardProps) {
  const content = (
    <div className={`bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs transition-all flex flex-col justify-between h-full ${
      href || onClick ? "hover:border-stone-400 hover:shadow-sm cursor-pointer group" : ""
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium text-stone-500 ${href || onClick ? "group-hover:text-stone-900 transition-colors" : ""}`}>{label}</span>
        <div className={`w-8 h-8 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-600 ${href || onClick ? "group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors" : ""}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
          {value}
        </span>
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
        {subtitle && <span>{subtitle}</span>}
        {trend && (
          <span className="text-emerald-600 font-medium text-[11px]">
            {trend}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} className="block h-full">
        {content}
      </div>
    );
  }

  return content;
}

