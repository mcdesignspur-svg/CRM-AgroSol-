interface MetricCardProps {
  label: string;
  value: string | number;
  icon: string;
  subtitle?: React.ReactNode;
  variant?: "default" | "alert";
}

export function MetricCard({
  label,
  value,
  icon,
  subtitle,
  variant = "default",
}: MetricCardProps) {
  const isAlert = variant === "alert";

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 flex flex-col justify-between transition-shadow hover:shadow-sm ${
        isAlert
          ? "bg-primary-container border-red-200"
          : "bg-white border-outline"
      }`}
    >
      <div className="flex justify-between items-start">
        <span
          className={`text-sm font-medium ${
            isAlert ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          {label}
        </span>
        <span
          className={`material-symbols-outlined text-xl ${
            isAlert ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3">
        <span
          className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
            isAlert ? "text-primary" : "text-on-surface"
          }`}
        >
          {value}
        </span>
        {subtitle && (
          <div className="text-xs text-on-surface-variant mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
