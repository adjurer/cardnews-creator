import type { OverlayDirection } from "@/types/project";

interface Props {
  value: OverlayDirection;
  onChange: (dir: OverlayDirection) => void;
}

const DIRS: OverlayDirection[] = [
  "top-left", "top-center", "top-right",
  "center-left", "center", "center-right",
  "bottom-left", "bottom-center", "bottom-right",
];

export function OverlayDirectionGrid({ value, onChange }: Props) {
  return (
    <div className="inline-grid grid-cols-3 gap-1.5 p-1.5 bg-card rounded-lg border border-border">
      {DIRS.map((dir) => (
        <button
          key={dir}
          onClick={() => onChange(dir)}
          className={`w-5 h-5 rounded-full border-2 transition-all ${
            dir === value
              ? "bg-primary border-primary scale-110"
              : "bg-muted border-border hover:border-muted-foreground"
          }`}
          title={dir}
        />
      ))}
    </div>
  );
}
