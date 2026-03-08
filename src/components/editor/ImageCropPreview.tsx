import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Move, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { SlideImage, ExportSize } from "@/types/project";

interface Props {
  image: SlideImage;
  exportSize?: ExportSize;
  onUpdate: (updates: Partial<SlideImage>) => void;
}

export function ImageCropPreview({ image, exportSize = "1080x1350", onUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 1, h: 1 });
  const scaleRef = useRef(image.scale ?? 1);
  scaleRef.current = image.scale ?? 1;

  const [expW, expH] = exportSize.split("x").map(Number);
  const frameAspect = expW / expH;
  const imageAspect = imgNaturalSize.w / imgNaturalSize.h;

  const posX = image.posX ?? 0;
  const posY = image.posY ?? 0;
  const scale = image.scale ?? 1;

  // Match SlideRenderer logic: background-size cover + transform scale
  const baseVisibleX = imageAspect >= frameAspect ? frameAspect / imageAspect : 1;
  const baseVisibleY = imageAspect >= frameAspect ? 1 : imageAspect / frameAspect;

  const visibleX = Math.max(0.01, Math.min(1, baseVisibleX / scale));
  const visibleY = Math.max(0.01, Math.min(1, baseVisibleY / scale));

  const vpW = visibleX * 100;
  const vpH = visibleY * 100;

  // CSS background-position mapping (same behavior as renderer)
  const bgPosX = Math.max(0, Math.min(100, 50 + posX));
  const bgPosY = Math.max(0, Math.min(100, 50 + posY));

  const vpLeft = Math.max(0, Math.min(100 - vpW, (bgPosX / 100) * (100 - vpW)));
  const vpTop = Math.max(0, Math.min(100 - vpH, (bgPosY / 100) * (100 - vpH)));

  const handleImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.5, Math.min(2.5, parseFloat((scaleRef.current + delta).toFixed(2))));
      onUpdate({ scale: newScale });
    };

    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [onUpdate]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = image.posX ?? 0;
    const startPosY = image.posY ?? 0;

    const onMove = (ev: MouseEvent) => {
      const dx = -((ev.clientX - startX) / rect.width) * 100;
      const dy = -((ev.clientY - startY) / rect.height) * 100;
      const newX = Math.max(-50, Math.min(50, Math.round(startPosX + dx)));
      const newY = Math.max(-50, Math.min(50, Math.round(startPosY + dy)));
      onUpdate({ posX: newX, posY: newY });
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [image.posX, image.posY, onUpdate]);

  const handleReset = () => onUpdate({ posX: 0, posY: 0, scale: 1 });

  const rightInset = 100 - (vpLeft + vpW);
  const bottomInset = 100 - (vpTop + vpH);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Move className="w-3 h-3" /> 드래그: 위치 · 휠: 확대/축소
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => onUpdate({ scale: Math.max(0.5, parseFloat((scale - 0.1).toFixed(2))) })} className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground" title="축소">
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[9px] text-muted-foreground tabular-nums w-8 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => onUpdate({ scale: Math.min(2.5, parseFloat((scale + 0.1).toFixed(2))) })} className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground" title="확대">
            <ZoomIn className="w-3 h-3" />
          </button>
          <button onClick={handleReset} className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground ml-1" title="초기화">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full rounded-lg overflow-hidden bg-card border border-border" style={{ aspectRatio: `${imgNaturalSize.w}/${imgNaturalSize.h}`, maxHeight: "220px" }}>
        {/* Base dimmed image */}
        <img src={image.url} alt="" draggable={false} onLoad={handleImgLoad} className="w-full h-full object-contain pointer-events-none opacity-35" />

        {/* Highlight visible area using clip-path */}
        <img
          src={image.url}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ clipPath: `inset(${vpTop}% ${rightInset}% ${bottomInset}% ${vpLeft}%)` }}
        />

        {/* Viewport frame */}
        <div
          onMouseDown={handleMouseDown}
          className={cn("absolute border-2 border-primary rounded-sm", dragging ? "cursor-grabbing" : "cursor-grab hover:border-primary/80")}
          style={{ left: `${vpLeft}%`, top: `${vpTop}%`, width: `${vpW}%`, height: `${vpH}%` }}
        >
          {["-top-0.5 -left-0.5", "-top-0.5 -right-0.5", "-bottom-0.5 -left-0.5", "-bottom-0.5 -right-0.5"].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-1.5 h-1.5 bg-primary rounded-full`} />
          ))}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-[1px] bg-primary/50" />
            <div className="absolute w-[1px] h-3 bg-primary/50" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] text-muted-foreground px-1">
        <span>X: {posX}% · Y: {posY}%</span>
        <span>배율: {scale.toFixed(1)}x</span>
      </div>
    </div>
  );
}
