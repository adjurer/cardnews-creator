import { useEffect, useRef, useState, useCallback } from "react";
import type { ElementKey, ElementOverride } from "@/types/project";

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
  selectedElement: ElementKey | null;
  onSelectElement: (key: ElementKey | null) => void;
  onUpdateOffset: (key: ElementKey, dx: number, dy: number) => void;
  showGrid: boolean;
  showSafeArea: boolean;
  gridSize: number;
  locked?: Record<string, boolean>;
}

interface ElementRect {
  key: ElementKey;
  rect: DOMRect;
}

export function CanvasOverlay({
  containerRef, selectedElement, onSelectElement, onUpdateOffset,
  showGrid, showSafeArea, gridSize, locked = {},
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<ElementRect[]>([]);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const scanElements = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const els: ElementRect[] = [];

    container.querySelectorAll("[data-element]").forEach(el => {
      const key = el.getAttribute("data-element") as ElementKey;
      const rect = el.getBoundingClientRect();
      els.push({
        key,
        rect: new DOMRect(
          rect.x - containerRect.x,
          rect.y - containerRect.y,
          rect.width,
          rect.height
        ),
      });
    });
    setElements(els);
  }, [containerRef]);

  useEffect(() => {
    scanElements();
    const observer = new MutationObserver(scanElements);
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true, attributes: true });
    }
    window.addEventListener("resize", scanElements);
    const interval = setInterval(scanElements, 500);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scanElements);
      clearInterval(interval);
    };
  }, [scanElements, containerRef]);

  const handleClick = (e: React.MouseEvent) => {
    if (dragging) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const overlayRect = overlay.getBoundingClientRect();
    const x = e.clientX - overlayRect.x;
    const y = e.clientY - overlayRect.y;

    // Find clicked element (reverse order = top element first)
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (x >= el.rect.x && x <= el.rect.x + el.rect.width &&
          y >= el.rect.y && y <= el.rect.y + el.rect.height) {
        onSelectElement(el.key);
        return;
      }
    }
    onSelectElement(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedElement || locked[selectedElement]) return;
    const selEl = elements.find(el => el.key === selectedElement);
    if (!selEl) return;
    const overlayRect = overlayRef.current!.getBoundingClientRect();
    const x = e.clientX - overlayRect.x;
    const y = e.clientY - overlayRect.y;
    if (x >= selEl.rect.x && x <= selEl.rect.x + selEl.rect.width &&
        y >= selEl.rect.y && y <= selEl.rect.y + selEl.rect.height) {
      dragStart.current = { x: e.clientX, y: e.clientY };
      setDragging(true);
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !dragStart.current || !selectedElement) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      onUpdateOffset(selectedElement, dx, dy);
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  }, [dragging, selectedElement, onUpdateOffset]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    dragStart.current = null;
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Arrow key nudging
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedElement || locked[selectedElement]) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName || "")) return;
      const step = e.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;
      if (e.key === "ArrowLeft") dx = -step;
      if (e.key === "ArrowRight") dx = step;
      if (e.key === "ArrowUp") dy = -step;
      if (e.key === "ArrowDown") dy = step;
      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        onUpdateOffset(selectedElement, dx, dy);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedElement, locked, onUpdateOffset]);

  const selectedRect = elements.find(el => el.key === selectedElement);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-10"
      style={{ cursor: dragging ? "grabbing" : "default" }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Grid */}
      {showGrid && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <defs>
            <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      )}

      {/* Safe area */}
      {showSafeArea && (
        <div className="absolute pointer-events-none" style={{ inset: "8%", border: "1px dashed hsl(var(--warning) / 0.5)" }}>
          <div className="absolute -top-4 left-0 text-[8px] text-warning/50">Safe Area</div>
        </div>
      )}

      {/* Hover highlights */}
      {elements.map(el => {
        if (el.key === selectedElement) return null;
        return (
          <div key={el.key} className="absolute pointer-events-none border border-transparent hover:border-primary/30 transition-colors"
            style={{ left: el.rect.x, top: el.rect.y, width: el.rect.width, height: el.rect.height }} />
        );
      })}

      {/* Selected element bounding box */}
      {selectedRect && (
        <div className="absolute pointer-events-none" style={{
          left: selectedRect.rect.x - 1,
          top: selectedRect.rect.y - 1,
          width: selectedRect.rect.width + 2,
          height: selectedRect.rect.height + 2,
          border: "2px solid hsl(var(--primary))",
          borderRadius: "2px",
        }}>
          {/* Corner handles */}
          {["nw", "ne", "sw", "se"].map(pos => (
            <div key={pos} className="absolute w-2 h-2 bg-primary rounded-sm pointer-events-auto"
              style={{
                cursor: `${pos}-resize`,
                ...(pos.includes("n") ? { top: -4 } : { bottom: -4 }),
                ...(pos.includes("w") ? { left: -4 } : { right: -4 }),
              }}
            />
          ))}
          {/* Label */}
          <div className="absolute -top-5 left-0 px-1 py-0.5 bg-primary text-primary-foreground text-[8px] font-semibold rounded whitespace-nowrap">
            {selectedRect.key}
          </div>
        </div>
      )}
    </div>
  );
}
