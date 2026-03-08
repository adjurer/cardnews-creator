import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Move, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { SlideImage, ExportSize } from "@/types/project";

interface Props {
  image: SlideImage;
  exportSize?: ExportSize;
  onUpdate: (updates: Partial<SlideImage>) => void;
}

/**
 * Visual crop/viewport tool for positioning images.
 * Shows the full image with a draggable viewport rectangle
 * representing the visible area in the slide.
 */
export function ImageCropPreview({ image, exportSize = "1080x1350", onUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 1, h: 1 });

  // Parse export aspect ratio
  const [expW, expH] = exportSize.split("x").map(Number);
  const exportAspect = expW / expH;

  // Calculate viewport rect position based on posX/posY
  const posX = image.posX ?? 0;   // -50 to 50
  const posY = image.posY ?? 0;   // -50 to 50
  const scale = image.scale ?? 1; // 0.5 to 2.5

  // Viewport size relative to container (inverse of scale)
  const vpW = Math.min(100, 100 / scale);
  const vpH = Math.min(100, (100 / scale) / (imgNaturalSize.w / imgNaturalSize.h) * exportAspect);
  const clampedVpH = Math.min(100, vpH);
  const clampedVpW = Math.min(100, vpW);

  // Map posX/posY (-50..50) to viewport center position (0%..100%)
  const vpCenterX = 50 - posX;
  const vpCenterY = 50 - posY;

  // Clamp so viewport stays within bounds
  const vpLeft = Math.max(0, Math.min(100 - clampedVpW, vpCenterX - clampedVpW / 2));
  const vpTop = Math.max(0, Math.min(100 - clampedVpH, vpCenterY - clampedVpH / 2));

  const handleImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

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
      // Moving viewport right = image shifts left = posX increases
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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.max(0.5, Math.min(2.5, parseFloat(((image.scale ?? 1) + delta).toFixed(2))));
    onUpdate({ scale: newScale });
  }, [image.scale, onUpdate]);

  const handleReset = () => {
    onUpdate({ posX: 0, posY: 0, scale: 1 });
  };

  return (
    <div className="space-y-1.5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Move className="w-3 h-3" /> 뷰포트를 드래그하여 범위 지정
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate({ scale: Math.max(0.5, parseFloat(((image.scale ?? 1) - 0.1).toFixed(2))) })}
            className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground"
            title="축소"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[9px] text-muted-foreground tabular-nums w-8 text-center">
            {parseFloat(((image.scale ?? 1) * 100).toFixed(0))}%
          </span>
          <button
            onClick={() => onUpdate({ scale: Math.min(2.5, parseFloat(((image.scale ?? 1) + 0.1).toFixed(2))) })}
            className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground"
            title="확대"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={handleReset}
            className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground ml-1"
            title="초기화"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Image with viewport overlay */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden bg-black/80 border border-border"
        style={{ aspectRatio: `${imgNaturalSize.w}/${imgNaturalSize.h}`, maxHeight: "200px" }}
        onWheel={handleWheel}
      >
        {/* Full image (dimmed) */}
        <img
          src={image.url}
          alt=""
          draggable={false}
          onLoad={handleImgLoad}
          className="w-full h-full object-contain pointer-events-none opacity-40"
        />

        {/* Viewport rectangle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute border-2 border-primary rounded-sm transition-shadow",
            dragging ? "border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-grabbing" : "shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] cursor-grab hover:border-primary/80"
          )}
          style={{
            left: `${vpLeft}%`,
            top: `${vpTop}%`,
            width: `${clampedVpW}%`,
            height: `${clampedVpH}%`,
            aspectRatio: `${expW}/${expH}`,
          }}
        >
          {/* Corner indicators */}
          <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-primary rounded-full" />
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full" />
          <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-primary rounded-full" />
          <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full" />

          {/* Cross-hair center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-[1px] bg-primary/50" />
            <div className="absolute w-[1px] h-3 bg-primary/50" />
          </div>

          {/* Bright image inside viewport */}
          <div className="absolute inset-0 overflow-hidden rounded-sm">
            <img
              src={image.url}
              alt=""
              draggable={false}
              className="pointer-events-none"
              style={{
                position: "absolute",
                width: `${100 / clampedVpW * 100}%`,
                height: `${100 / clampedVpH * 100}%`,
                left: `-${vpLeft / clampedVpW * 100}%`,
                top: `-${vpTop / clampedVpH * 100}%`,
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      </div>

      {/* Position info */}
      <div className="flex items-center justify-between text-[9px] text-muted-foreground px-1">
        <span>X: {posX}% · Y: {posY}%</span>
        <span>배율: {parseFloat(((image.scale ?? 1)).toFixed(2))}x</span>
      </div>
    </div>
  );
}
