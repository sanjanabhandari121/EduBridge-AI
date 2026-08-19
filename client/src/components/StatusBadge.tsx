import { TeacherStudent } from "../types";

const STATUS_STYLES: Record<TeacherStudent["status"], { label: string; className: string }> = {
  MASTERED: { label: "Mastered", className: "bg-teal-light text-teal-dark" },
  STABLE: { label: "Stable", className: "bg-paper-dim text-slate" },
  IMPROVING: { label: "Improving", className: "bg-teal-light text-teal-dark" },
  MONITOR: { label: "Monitor", className: "bg-marigold-light text-[#8A5A12]" },
  NEEDS_ATTENTION: { label: "Needs attention", className: "bg-coral-light text-coral" },
};

export function StatusBadge({ status }: { status: TeacherStudent["status"] }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}
