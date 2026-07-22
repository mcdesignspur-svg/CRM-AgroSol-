import {
  getActiveDeliveryStepLabel,
  getDeliveryFlowSteps,
  type DeliveryFlowInput,
} from "@/lib/delivery/flow";

interface DeliveryFlowProgressProps extends DeliveryFlowInput {
  compact?: boolean;
}

function StepDot({
  done,
  active,
  label,
}: {
  done: boolean;
  active: boolean;
  label: string;
}) {
  return (
    <span
      title={label}
      className={`inline-block h-2 w-2 rounded-full shrink-0 ${
        done
          ? "bg-emerald-500"
          : active
            ? "bg-primary animate-pulse"
            : "bg-gray-200"
      }`}
    />
  );
}

export function DeliveryFlowProgress({
  compact = false,
  ...input
}: DeliveryFlowProgressProps) {
  const steps = getDeliveryFlowSteps(input);
  if (!steps) {
    return null;
  }

  const activeLabel = getActiveDeliveryStepLabel(steps);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="flex items-center gap-1">
          {steps.map((step) => (
            <StepDot
              key={step.id}
              done={step.done}
              active={step.active}
              label={step.label}
            />
          ))}
        </div>
        {activeLabel && (
          <span className="text-xs text-on-surface-variant truncate">
            {activeLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-1 flex-1 min-w-0">
            <StepDot
              done={step.done}
              active={step.active}
              label={step.label}
            />
            {index < steps.length - 1 && (
              <span
                className={`h-px flex-1 ${
                  step.done ? "bg-emerald-200" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-1">
        {steps.map((step) => (
          <span
            key={step.id}
            className={`text-[10px] leading-tight text-center flex-1 ${
              step.active
                ? "text-primary font-medium"
                : step.done
                  ? "text-emerald-700"
                  : "text-on-surface-variant"
            }`}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
