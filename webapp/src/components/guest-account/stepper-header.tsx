import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StepperStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function StepperHeader({ steps, activeId }: { steps: StepperStep[]; activeId: string }) {
  const activeIndex = steps.findIndex((s) => s.id === activeId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, index) => {
        const isActive = step.id === activeId;
        const isDone = index < activeIndex;

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  isActive || isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {step.icon}
              </div>
              <div className="hidden sm:block">
                <div className={cn("font-medium text-sm", !isActive && !isDone && "text-muted-foreground")}>
                  {step.label}
                </div>
                <div className="text-muted-foreground text-xs">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
          </div>
        );
      })}
    </div>
  );
}
