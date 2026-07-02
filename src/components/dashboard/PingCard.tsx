import type { Ping } from "@/lib/types";

const priorityStyles: Record<
  Ping["priority"],
  { badge: string; border: string; label: string }
> = {
  urgente: {
    badge: "bg-red-50 text-red-700",
    border: "rounded-lg border border-red-200 bg-red-50/50",
    label: "Urgente",
  },
  sistema: {
    badge: "bg-blue-50 text-blue-700",
    border: "rounded-lg border border-outline bg-surface",
    label: "Sistema",
  },
  advertencia: {
    badge: "bg-amber-50 text-amber-700",
    border: "rounded-lg border border-amber-200 bg-amber-50/50",
    label: "Advertencia",
  },
};

interface PingCardProps {
  ping: Ping;
  onDismiss?: (id: string) => void;
  onCallDriver?: (ping: Ping) => void;
}

export function PingCard({ ping, onDismiss, onCallDriver }: PingCardProps) {
  const styles = priorityStyles[ping.priority];

  return (
    <div className={`p-3.5 ${styles.border}`}>
      <div className="flex justify-between items-start mb-1.5">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}
        >
          {styles.label}
        </span>
        <span className="text-xs font-mono text-on-surface-variant">
          {ping.timeAgo}
        </span>
      </div>
      <p className="text-sm font-medium text-on-surface">{ping.title}</p>
      <p className="text-xs text-on-surface-variant mt-0.5">{ping.description}</p>
      {ping.priority === "urgente" && onDismiss && onCallDriver && (
        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            onClick={() => onDismiss(ping.id)}
            className="text-xs font-medium border border-outline rounded-md px-3 py-1.5 min-h-[36px] hover:bg-surface-container transition-colors"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={() => onCallDriver(ping)}
            className="text-xs font-medium bg-primary text-white rounded-md px-3 py-1.5 min-h-[36px] hover:bg-primary/90 transition-colors"
          >
            Llamar
          </button>
        </div>
      )}
    </div>
  );
}
