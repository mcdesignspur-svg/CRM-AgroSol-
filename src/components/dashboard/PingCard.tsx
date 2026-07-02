import type { Ping } from "@/lib/types";

const priorityStyles: Record<
  Ping["priority"],
  { badge: string; border: string; label: string }
> = {
  urgente: {
    badge: "bg-primary text-white",
    border: "industrial-border bg-white industrial-shadow",
    label: "Urgente",
  },
  sistema: {
    badge: "text-primary",
    border: "border-l-4 border-primary bg-surface-container",
    label: "Sistema",
  },
  advertencia: {
    badge: "text-secondary",
    border: "border-l-4 border-secondary bg-surface-container",
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
    <div className={`p-4 ${styles.border}`}>
      <div className="flex justify-between items-start mb-2">
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 ${styles.badge}`}
        >
          {styles.label}
        </span>
        <span className="text-[10px] font-mono opacity-60">{ping.timeAgo}</span>
      </div>
      <p className="text-sm font-bold">{ping.title}</p>
      <p className="text-xs text-on-surface-variant mt-1">{ping.description}</p>
      {ping.priority === "urgente" && onDismiss && onCallDriver && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onDismiss(ping.id)}
            className="text-[10px] font-bold uppercase border border-black px-3 py-2 min-h-[44px] hover:bg-gray-100 transition-colors"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={() => onCallDriver(ping)}
            className="text-[10px] font-bold uppercase bg-black text-white px-3 py-2 min-h-[44px] hover:bg-primary transition-colors"
          >
            Llamar
          </button>
        </div>
      )}
    </div>
  );
}
