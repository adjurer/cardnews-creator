import { useEffect, useRef, useState, useCallback } from "react";
import type { ElementKey } from "@/types/project";

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
  selectedElement: ElementKey | null;
  onSelectElement: (key: ElementKey | null) => void;
  onUpdateOffset: (key: ElementKey, dx: number, dy: number) => void;
  onResizeElement?: (key: ElementKey, dw: number, dh: number, handle: string) => void;
  showGrid: boolean;
  showSafeArea: boolean;
  gridSize: number;
  locked?: Record<string, boolean>;
  canvasScale?: number;
  marginInset?: number; // margin inset as percentage (0-50), 0 = no margin
}

interface ElementRect {
  key: ElementKey;
  rect: DOMRect;
}

type InteractionMode = "idle" | "dragging" | "resizing";
type ResizeHandle = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", se: "nwse-resize",
  n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
};

export function CanvasOverlay({
  containerRef, selectedElement, onSelectElement, onUpdateOffset,
  onResizeElement, showGrid, showSafeArea, gridSize, locked = {}, canvasScale = 1, marginInset = 0,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<ElementRect[]>([]);
  const [mode, setMode] = useState<InteractionMode>("idle");
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const accumDelta = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [hoveredElement, setHoveredElement] = useState<ElementKey | null>(null);
  const [centerGuides, setCenterGuides] = useState<{ h: boolean; v: boolean }>({ h: false, v: false });

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

  // Center alignment guides
  useEffect(() => {
    if (!selectedElement || !overlayRef.current) {
      setCenterGuides({ h: false, v: false });
      return;
    }
    const selEl = elements.find(el => el.key === selectedElement);
    const overlay = overlayRef.current;
    if (!selEl || !overlay) return;

    const containerW = overlay.clientWidth;
    const containerH = overlay.clientHeight;
    const elCenterX = selEl.rect.x + selEl.rect.width / 2;
    const elCenterY = selEl.rect.y + selEl.rect.height / 2;

    setCenterGuides({
      v: Math.abs(elCenterX - containerW / 2) < 3,
      h: Math.abs(elCenterY - containerH / 2) < 3,
    });
  }, [elements, selectedElement]);

  const handleClick = (e: React.MouseEvent) => {
    if (mode !== "idle") return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const overlayRect = overlay.getBoundingClientRect();
    const x = e.clientX - overlayRect.x;
    const y = e.clientY - overlayRect.y;

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

    // Check resize handles - larger hit area for easier grabbing
    const handleHitSize = 10;
    const r = selEl.rect;
    const handles: { handle: ResizeHandle; x: number; y: number }[] = [
      { handle: "nw", x: r.x, y: r.y },
      { handle: "ne", x: r.x + r.width, y: r.y },
      { handle: "sw", x: r.x, y: r.y + r.height },
      { handle: "se", x: r.x + r.width, y: r.y + r.height },
      { handle: "n", x: r.x + r.width / 2, y: r.y },
      { handle: "s", x: r.x + r.width / 2, y: r.y + r.height },
      { handle: "w", x: r.x, y: r.y + r.height / 2 },
      { handle: "e", x: r.x + r.width, y: r.y + r.height / 2 },
    ];

    for (const h of handles) {
      if (Math.abs(x - h.x) <= handleHitSize && Math.abs(y - h.y) <= handleHitSize) {
        setMode("resizing");
        setActiveHandle(h.handle);
        dragStart.current = { x: e.clientX, y: e.clientY };
        accumDelta.current = { dx: 0, dy: 0 };
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }

    // Drag
    if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
      dragStart.current = { x: e.clientX, y: e.clientY };
      accumDelta.current = { dx: 0, dy: 0 };
      setMode("dragging");
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStart.current || !selectedElement) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    if (mode === "dragging" && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
      onUpdateOffset(selectedElement, dx, dy);
      dragStart.current = { x: e.clientX, y: e.clientY };
    } else if (mode === "resizing" && activeHandle && onResizeElement) {
      // Accumulate deltas for smoother resize
      accumDelta.current.dx += dx;
      accumDelta.current.dy += dy;
      dragStart.current = { x: e.clientX, y: e.clientY };
      
      // Fire resize with accumulated delta scaled to content space
      const scaledDx = accumDelta.current.dx / canvasScale;
      const scaledDy = accumDelta.current.dy / canvasScale;
      
      if (Math.abs(scaledDx) >= 1 || Math.abs(scaledDy) >= 1) {
        onResizeElement(selectedElement, scaledDx, scaledDy, activeHandle);
        accumDelta.current = { dx: 0, dy: 0 };
      }
    }
  }, [mode, selectedElement, activeHandle, onUpdateOffset, onResizeElement, canvasScale]);

  const handleMouseUp = useCallback(() => {
    setMode("idle");
    setActiveHandle(null);
    dragStart.current = null;
    accumDelta.current = { dx: 0, dy: 0 };
  }, []);

  useEffect(() => {
    if (mode !== "idle") {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [mode, handleMouseMove, handleMouseUp]);

  // Hover tracking
  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (mode !== "idle") return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const overlayRect = overlay.getBoundingClientRect();
    const x = e.clientX - overlayRect.x;
    const y = e.clientY - overlayRect.y;

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (x >= el.rect.x && x <= el.rect.x + el.rect.width &&
          y >= el.rect.y && y <= el.rect.y + el.rect.height) {
        setHoveredElement(el.key);
        return;
      }
    }
    setHoveredElement(null);
  };

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
  const getCursor = () => {
    if (mode === "dragging") return "grabbing";
    if (mode === "resizing" && activeHandle) return HANDLE_CURSORS[activeHandle];
    if (hoveredElement && selectedElement === hoveredElement) return "grab";
    if (hoveredElement) return "pointer";
    return "default";
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-10"
      style={{ cursor: getCursor() }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleOverlayMouseMove}
    >
      {/* Grid */}
      {showGrid && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15">
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
        <div className="absolute pointer-events-none" style={{ inset: "8%", border: "1px dashed hsl(var(--warning) / 0.4)" }}>
          <div className="absolute -top-4 left-0 text-[7px] text-warning/50 font-medium">Safe Area</div>
        </div>
      )}

      {/* Center guides */}
      {selectedElement && centerGuides.v && (
        <div className="absolute pointer-events-none top-0 bottom-0" style={{ left: "50%", width: "1px", background: "hsl(var(--primary) / 0.6)" }} />
      )}
      {selectedElement && centerGuides.h && (
        <div className="absolute pointer-events-none left-0 right-0" style={{ top: "50%", height: "1px", background: "hsl(var(--primary) / 0.6)" }} />
      )}

      {/* Hover highlights */}
      {elements.map(el => {
        if (el.key === selectedElement) return null;
        const isHov = el.key === hoveredElement;
        return (
          <div key={el.key} className="absolute pointer-events-none transition-all"
            style={{
              left: el.rect.x, top: el.rect.y, width: el.rect.width, height: el.rect.height,
              border: isHov ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid transparent",
              background: isHov ? "hsl(var(--primary) / 0.03)" : undefined,
            }}>
            {isHov && (
              <div className="absolute -top-4 left-0 px-1 py-0.5 bg-muted text-[7px] text-muted-foreground font-medium rounded whitespace-nowrap">
                {el.key}
              </div>
            )}
          </div>
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
          {(["nw", "ne", "sw", "se"] as ResizeHandle[]).map(pos => (
            <div key={pos} className="absolute w-3 h-3 bg-primary rounded-[2px] pointer-events-auto border border-primary-foreground/30"
              style={{
                cursor: HANDLE_CURSORS[pos],
                ...(pos.includes("n") ? { top: -6 } : { bottom: -6 }),
                ...(pos.includes("w") ? { left: -6 } : { right: -6 }),
              }}
            />
          ))}
          {/* Edge handles */}
          {(["n", "s", "e", "w"] as ResizeHandle[]).map(pos => (
            <div key={pos} className="absolute bg-primary rounded-[1px] pointer-events-auto border border-primary-foreground/30"
              style={{
                cursor: HANDLE_CURSORS[pos],
                ...(pos === "n" ? { top: -4, left: "50%", transform: "translateX(-50%)", width: 16, height: 5 } : {}),
                ...(pos === "s" ? { bottom: -4, left: "50%", transform: "translateX(-50%)", width: 16, height: 5 } : {}),
                ...(pos === "e" ? { right: -4, top: "50%", transform: "translateY(-50%)", width: 5, height: 16 } : {}),
                ...(pos === "w" ? { left: -4, top: "50%", transform: "translateY(-50%)", width: 5, height: 16 } : {}),
              }}
            />
          ))}
          {/* Label */}
          <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-primary text-primary-foreground text-[7px] font-semibold rounded whitespace-nowrap">
            {selectedRect.key}
          </div>
          {/* Size info during resize */}
          {mode === "resizing" && (
            <div className="absolute -bottom-5 right-0 px-1.5 py-0.5 bg-primary text-primary-foreground text-[7px] font-semibold rounded whitespace-nowrap tabular-nums">
              {Math.round(selectedRect.rect.width)}×{Math.round(selectedRect.rect.height)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
