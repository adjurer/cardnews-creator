import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Move, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { SlideImage, ExportSize } from "@/types/project";

interface Props {
  image: SlideImage;
  exportSize?: ExportSize;
  onUpdate: (updates: Partial<SlideImage>) => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function ImageCropPreview({ image, exportSize = "1080x1350", onUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const scaleRef = useRef(image.scale ?? 1);
  scaleRef.current = image.scale ?? 1;

  const [expW, expH] = exportSize.split("x").map(Number);
  const frameAspect = expW / expH;
  const imgW = imgNaturalSize.w || 1;
  const imgH = imgNaturalSize.h || 1;
  const imgAspect = imgW / imgH;

  const posX = image.posX ?? 0;
  const posY = image.posY ?? 0;
  const scale = image.scale ?? 1;

  // Must match SlideRenderer background-size: cover logic
  const baseBgW = imgAspect > frameAspect ? (imgAspect / frameAspect) * 100 : 100;
  const baseBgH = imgAspect > frameAspect ? 100 : (frameAspect / imgAspect) * 100;
  const bgW = baseBgW * scale;
  const bgH = baseBgH * scale;

  // Visible region in image-space (%)
  const vpWImg = Math.max(0.01, Math.min(100, (100 / bgW) * 100));
  const vpHImg = Math.max(0.01, Math.min(100, (100 / bgH) * 100));

  // Position mapping from renderer range (-50..50)
  const pX = (50 + posX) / 100;
  const pY = (50 + posY) / 100;

  const maxLeftOffset = Math.max(0, 100 - vpWImg);
  const maxTopOffset = Math.max(0, 100 - vpHImg);
  const vpLeftImg = pX * maxLeftOffset;
  const vpTopImg = pY * maxTopOffset;

  const handleImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  // Track real preview container size (important for object-contain letterbox cases)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Wheel zoom
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

  // Real rendered image rect inside object-contain container
  const containerW = containerSize.w || 1;
  const containerH = containerSize.h || 1;
  const containerAspect = containerW / containerH;

  let imageRect: Rect = { x: 0, y: 0, w: containerW, h: containerH };
  if (containerAspect > imgAspect) {
    const renderedW = containerH * imgAspect;
    imageRect = {
      x: (containerW - renderedW) / 2,
      y: 0,
      w: renderedW,
      h: containerH,
    };
  } else {
    const renderedH = containerW / imgAspect;
    imageRect = {
      x: 0,
      y: (containerH - renderedH) / 2,
      w: containerW,
      h: renderedH,
    };
  }

  const vpLeftPx = imageRect.x + (vpLeftImg / 100) * imageRect.w;
  const vpTopPx = imageRect.y + (vpTopImg / 100) * imageRect.h;
  const vpWPx = (vpWImg / 100) * imageRect.w;
  const vpHPx = (vpHImg / 100) * imageRect.h;

  const clipTop = (vpTopPx / containerH) * 100;
  const clipRight = 100 - ((vpLeftPx + vpWPx) / containerW) * 100;
  const clipBottom = 100 - ((vpTopPx + vpHPx) / containerH) * 100;
  const clipLeft = (vpLeftPx / containerW) * 100;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startVpLeft = vpLeftImg;
    const startVpTop = vpTopImg;

    const dragW = Math.max(1, imageRect.w);
    const dragH = Math.max(1, imageRect.h);

    const onMove = (ev: MouseEvent) => {
      // Convert cursor delta to image-space percentages (not container-space)
      const dx = ((ev.clientX - startX) / dragW) * 100;
      const dy = ((ev.clientY - startY) / dragH) * 100;

      const maxLeft = Math.max(0.0001, 100 - vpWImg);
      const maxTop = Math.max(0.0001, 100 - vpHImg);

      const newVpLeft = Math.max(0, Math.min(100 - vpWImg, startVpLeft + dx));
      const newVpTop = Math.max(0, Math.min(100 - vpHImg, startVpTop + dy));

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
  }, [imageRect.h, imageRect.w, onUpdate, vpHImg, vpLeftImg, vpTopImg, vpWImg]);

  const handleReset = () => onUpdate({ posX: 0, posY: 0, scale: 1 });
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
        className="relative rounded-lg overflow-hidden bg-card border border-border mx-auto w-full"
        style={{
          aspectRatio: `${imgW}/${imgH}`,
          maxHeight: "220px",
          maxWidth: `${220 * imgAspect}px`,
        }}
      >
        <img src={image.url} alt="" draggable={false} onLoad={handleImgLoad}
          className="w-full h-full object-contain pointer-events-none opacity-30" />

        {loaded && (
          <>
            <img src={image.url} alt="" draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ clipPath: `inset(${clipTop}% ${clipRight}% ${clipBottom}% ${clipLeft}%)` }}
            />

            <ViewportFrame
              exportW={expW}
              exportH={expH}
              dragging={dragging}
              onMouseDown={handleMouseDown}
              leftPx={vpLeftPx}
              topPx={vpTopPx}
              widthPx={vpWPx}
              heightPx={vpHPx}
            />
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

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function ViewportFrame({
  exportW,
  exportH,
  dragging,
  onMouseDown,
  leftPx,
  topPx,
  widthPx,
  heightPx,
}: {
  exportW: number;
  exportH: number;
  dragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
}) {
  const g = gcd(exportW, exportH);
  const ratioLabel = `${exportW / g}:${exportH / g}`;

  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        "absolute border-2 border-primary rounded-sm",
        dragging ? "cursor-grabbing" : "cursor-grab hover:border-primary/80"
      )}
      style={{
        left: `${leftPx}px`,
        top: `${topPx}px`,
        width: `${widthPx}px`,
        height: `${heightPx}px`,
      }}
    >
      {["-top-0.5 -left-0.5", "-top-0.5 -right-0.5", "-bottom-0.5 -left-0.5", "-bottom-0.5 -right-0.5"].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-1.5 h-1.5 bg-primary rounded-full`} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-4 h-[1px] bg-primary/40" />
        <div className="absolute w-[1px] h-4 bg-primary/40" />
      </div>
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] text-primary/60 whitespace-nowrap">
        {ratioLabel}
      </div>
    </div>
  );
}

