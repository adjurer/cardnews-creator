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

  const posX = image.posX ?? 0;
  const posY = image.posY ?? 0;
  const scale = image.scale ?? 1;

  // Viewport width/height as % of container, based on scale
  // At scale=1 the viewport fills the container; higher scale = smaller viewport
  const imgAspect = imgNaturalSize.w / imgNaturalSize.h;
  const exportAspect = expW / expH;

  // The viewport represents what portion of the image is visible
  const vpW = Math.min(100, 100 / scale);
  // Height is derived from width + aspect ratios
  const vpH = Math.min(100, (vpW * imgAspect) / exportAspect);

  // Map posX/posY (-50..50) to viewport center (0%..100%)
  const vpCenterX = 50 - posX;
  const vpCenterY = 50 - posY;
  const vpLeft = Math.max(0, Math.min(100 - vpW, vpCenterX - vpW / 2));
  const vpTop = Math.max(0, Math.min(100 - vpH, vpCenterY - vpH / 2));

  const handleImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  // Use native wheel listener to prevent page scroll
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

  const handleReset = () => {
    onUpdate({ posX: 0, posY: 0, scale: 1 });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Move className="w-3 h-3" /> 드래그: 위치 · 휠: 확대/축소
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate({ scale: Math.max(0.5, parseFloat((scale - 0.1).toFixed(2))) })}
            className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground" title="축소"
          ><ZoomOut className="w-3 h-3" /></button>
          <span className="text-[9px] text-muted-foreground tabular-nums w-8 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => onUpdate({ scale: Math.min(2.5, parseFloat((scale + 0.1).toFixed(2))) })}
            className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground" title="확대"
          ><ZoomIn className="w-3 h-3" /></button>
          <button onClick={handleReset}
            className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground ml-1" title="초기화"
          ><RotateCcw className="w-3 h-3" /></button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden bg-black/80 border border-border"
        style={{ aspectRatio: `${imgNaturalSize.w}/${imgNaturalSize.h}`, maxHeight: "200px" }}
      >
        {/* Full image (dimmed) */}
        <img
          src={image.url} alt="" draggable={false} onLoad={handleImgLoad}
          className="w-full h-full object-contain pointer-events-none opacity-40"
        />

        {/* Viewport rectangle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute border-2 border-primary rounded-sm",
            dragging ? "cursor-grabbing" : "cursor-grab hover:border-primary/80"
          )}
          style={{
            left: `${vpLeft}%`,
            top: `${vpTop}%`,
            width: `${vpW}%`,
            height: `${vpH}%`,
          }}
        >
          {/* Corner dots */}
          {["-top-0.5 -left-0.5", "-top-0.5 -right-0.5", "-bottom-0.5 -left-0.5", "-bottom-0.5 -right-0.5"].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-1.5 h-1.5 bg-primary rounded-full`} />
          ))}

          {/* Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-[1px] bg-primary/50" />
            <div className="absolute w-[1px] h-3 bg-primary/50" />
          </div>

          {/* Bright image inside viewport */}
          <div className="absolute inset-0 overflow-hidden rounded-sm pointer-events-none">
            <img
              src={image.url} alt="" draggable={false}
              className="pointer-events-none"
              style={{
                position: "absolute",
                width: `${(100 / vpW) * 100}%`,
                height: `${(100 / vpH) * 100}%`,
                left: `${-(vpLeft / vpW) * 100}%`,
                top: `${-(vpTop / vpH) * 100}%`,
                objectFit: "contain",
              }}
            />
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
