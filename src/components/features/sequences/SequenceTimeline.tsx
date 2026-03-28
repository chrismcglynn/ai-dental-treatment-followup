"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Mail,
  Phone,
  GripVertical,
  X,
  Plus,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type StepData, type Channel } from "./types";

const channelConfig: Record<Channel, { icon: typeof MessageSquare; color: string; bg: string; border: string }> = {
  sms: { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  email: { icon: Mail, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  voicemail: { icon: Phone, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
};

interface TimelineNodeProps {
  step: StepData;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onPreview: () => void;
  isLast: boolean;
}

function SortableTimelineNode({
  step,
  isSelected,
  onSelect,
  onDelete,
  onPreview,
  isLast,
}: TimelineNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = channelConfig[step.channel];
  const Icon = config.icon;

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="flex">
        {/* Timeline line */}
        <div className="flex flex-col items-center mr-4">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
              config.bg,
              config.border,
              isSelected && "ring-2 ring-primary ring-offset-2"
            )}
          >
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          {!isLast && (
            <div className="w-0.5 flex-1 min-h-[2rem] bg-border" />
          )}
        </div>

        {/* Node content */}
        <motion.div
          className={cn(
            "flex-1 rounded-lg border p-3 mb-3 cursor-pointer transition-all group",
            isDragging && "opacity-50",
            isSelected
              ? "border-primary bg-primary/5 shadow-sm"
              : "hover:border-muted-foreground/30 hover:shadow-sm"
          )}
          onClick={onSelect}
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-start gap-2">
            <button
              className="mt-0.5 cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50 hover:text-muted-foreground"
              aria-label={`Reorder step day ${step.dayOffset}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">
                  Day {step.dayOffset}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0 capitalize",
                    step.channel === "sms"
                      ? "bg-blue-500/10 text-blue-600"
                      : step.channel === "email"
                      ? "bg-purple-500/10 text-purple-600"
                      : "bg-amber-500/10 text-amber-600"
                  )}
                >
                  {step.channel}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                  {step.tone}
                </Badge>
              </div>

              {step.templateOverride ? (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {step.templateOverride}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  AI-generated message
                </p>
              )}
            </div>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Preview step day ${step.dayOffset}`}
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Delete step day ${step.dayOffset}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface SequenceTimelineProps {
  steps: StepData[];
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
  onDeleteStep: (id: string) => void;
  onReorderSteps: (steps: StepData[]) => void;
  onAddStep: () => void;
  onPreviewStep: (step: StepData) => void;
}

export function SequenceTimeline({
  steps,
  selectedStepId,
  onSelectStep,
  onDeleteStep,
  onReorderSteps,
  onAddStep,
  onPreviewStep,
}: SequenceTimelineProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      const newSteps = arrayMove(steps, oldIndex, newIndex).map(
        (step, i) => ({ ...step, position: i })
      );
      onReorderSteps(newSteps);
    }
  }

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-1">No steps yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          Add your first step to start building the follow-up sequence
        </p>
        <Button onClick={onAddStep}>
          <Plus className="mr-2 h-4 w-4" />
          Add First Step
        </Button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {steps.map((step, i) => (
            <SortableTimelineNode
              key={step.id}
              step={step}
              isSelected={step.id === selectedStepId}
              onSelect={() => onSelectStep(step.id)}
              onDelete={() => onDeleteStep(step.id)}
              onPreview={() => onPreviewStep(step)}
              isLast={i === steps.length - 1}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex ml-14 mt-1">
        <Button variant="outline" size="sm" onClick={onAddStep}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Step
        </Button>
      </div>
    </div>
  );
}
