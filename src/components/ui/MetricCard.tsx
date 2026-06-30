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
      className={`industrial-border p-6 flex flex-col justify-between ${
        isAlert ? "bg-primary text-white" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-start">
        <span
          className={`text-sm font-bold uppercase ${
            isAlert ? "text-white" : "text-on-surface-variant"
          }`}
        >
          {label}
        </span>
        <span
          className={`material-symbols-outlined ${
            isAlert ? "text-white" : "text-primary"
          }`}
          style={isAlert ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </span>
      </div>
      <div className="mt-4">
        <span className="text-4xl font-extrabold">{value}</span>
        {subtitle && <div className="text-xs font-bold mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}
