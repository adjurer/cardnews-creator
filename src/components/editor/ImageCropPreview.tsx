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
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const scaleRef = useRef(image.scale ?? 1);
  scaleRef.current = image.scale ?? 1;

  const [expW, expH] = exportSize.split("x").map(Number);
  const exportAspect = expW / expH; // e.g. 0.8 for 1080x1350
  const imgW = imgNaturalSize.w || 1;
  const imgH = imgNaturalSize.h || 1;
  const imgAspect = imgW / imgH;

  const posX = image.posX ?? 0;
  const posY = image.posY ?? 0;
  const scale = image.scale ?? 1;

  // --- Viewport calculation (must match SlideRenderer exactly) ---
  // SlideRenderer uses:
  // - background-size: cover
  // - background-position: (50+posX)% (50+posY)%
  // - transform: scale(scale) on the whole layer (center-origin)
  //
  // 1) f0 = visible fraction at scale=1 (cover crop)
  // 2) f = f0 / scale (zoomed visible fraction)
  // 3) left/top must include center-zoom offset: +(f0 - f)/2

  const f0x = imgAspect > exportAspect ? (exportAspect / imgAspect) : 1;
  const f0y = imgAspect > exportAspect ? 1 : (imgAspect / exportAspect);

  const fx = Math.max(0.01, Math.min(1, f0x / scale));
  const fy = Math.max(0.01, Math.min(1, f0y / scale));

  // Position: posX/posY range is -50..50, maps to background-position 0%..100%
  const pX = (50 + posX) / 100;
  const pY = (50 + posY) / 100;

  const baseLeft = (1 - f0x) * pX;
  const baseTop = (1 - f0y) * pY;

  // Center-origin scale compensation
  const left = baseLeft + (f0x - fx) / 2;
  const top = baseTop + (f0y - fy) / 2;

  const vpW = fx * 100;
  const vpH = fy * 100;
  const vpLeft = Math.max(0, Math.min(100 - vpW, left * 100));
  const vpTop = Math.max(0, Math.min(100 - vpH, top * 100));

  const handleImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  // Native wheel for non-passive preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.5, Math.min(3, parseFloat((scaleRef.current + delta).toFixed(2))));
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
    const startVpLeft = vpLeft;
    const startVpTop = vpTop;

    const onMove = (ev: MouseEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;

      const maxLeft = Math.max(0.0001, 100 - vpW);
      const maxTop = Math.max(0.0001, 100 - vpH);

      const newVpLeft = Math.max(0, Math.min(100 - vpW, startVpLeft + dx));
      const newVpTop = Math.max(0, Math.min(100 - vpH, startVpTop + dy));

      // Convert viewport position back to posX/posY (-50..50)
      const newX = maxLeft <= 0.001 ? 0 : (newVpLeft / maxLeft) * 100 - 50;
      const newY = maxTop <= 0.001 ? 0 : (newVpTop / maxTop) * 100 - 50;

      onUpdate({
        posX: Math.max(-50, Math.min(50, parseFloat(newX.toFixed(2)))),
        posY: Math.max(-50, Math.min(50, parseFloat(newY.toFixed(2)))),
      });
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [onUpdate, vpH, vpLeft, vpTop, vpW]);

  const handleReset = () => onUpdate({ posX: 0, posY: 0, scale: 1 });

  const rightInset = 100 - (vpLeft + vpW);
  const bottomInset = 100 - (vpTop + vpH);

  const loaded = imgNaturalSize.w > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Move className="w-3 h-3" /> 드래그: 위치 · 휠: 확대/축소
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => onUpdate({ scale: Math.max(0.5, parseFloat((scale - 0.1).toFixed(2))) })}
            className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground" title="축소">
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[9px] text-muted-foreground tabular-nums w-8 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => onUpdate({ scale: Math.min(3, parseFloat((scale + 0.1).toFixed(2))) })}
            className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground" title="확대">
            <ZoomIn className="w-3 h-3" />
          </button>
          <button onClick={handleReset}
            className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground ml-1" title="초기화">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden bg-card border border-border"
        style={{ aspectRatio: `${imgW}/${imgH}`, maxHeight: "220px" }}
      >
        {/* Dimmed full image */}
        <img src={image.url} alt="" draggable={false} onLoad={handleImgLoad}
          className="w-full h-full object-contain pointer-events-none opacity-30" />

        {loaded && (
          <>
            {/* Bright clip of visible region */}
            <img src={image.url} alt="" draggable={false}
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
                <div className="w-4 h-[1px] bg-primary/40" />
                <div className="absolute w-[1px] h-4 bg-primary/40" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between text-[9px] text-muted-foreground px-1">
        <span>X: {posX}% · Y: {posY}%</span>
        <span>{expW}×{expH} · {scale.toFixed(1)}x</span>
      </div>
    </div>
  );
}
