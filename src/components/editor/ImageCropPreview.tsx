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

  // --- Viewport calculation ---
  // The viewport rectangle should have the SAME aspect ratio as the export (e.g., 4:5)
  // and represent the visible portion of the image in the final render.

  // At scale=1, the image covers the frame (background-size: cover behavior).
  // baseW/baseH = image dimensions as % of frame when scale=1
  const baseW = imgAspect > exportAspect ? (imgAspect / exportAspect) * 100 : 100;
  const baseH = imgAspect > exportAspect ? 100 : (exportAspect / imgAspect) * 100;

  // Scaled image size (as % of frame)
  const bgW = baseW * scale;
  const bgH = baseH * scale;

  // Viewport size in image-space %:
  // The viewport is the frame (100% of export), mapped back to image coordinates.
  // Since image is bgW% x bgH% of frame, the visible portion is (100/bgW)% x (100/bgH)% of image.
  const vpWImg = Math.max(0.01, Math.min(100, (100 / bgW) * 100));
  const vpHImg = Math.max(0.01, Math.min(100, (100 / bgH) * 100));

  // Position: posX/posY range is -50..50, maps to background-position 0..100%
  const pX = (50 + posX) / 100;
  const pY = (50 + posY) / 100;

  // Viewport left/top in image-space %
  const vpLeftImg = Math.max(0, Math.min(100 - vpWImg, pX * (100 - vpWImg)));
  const vpTopImg = Math.max(0, Math.min(100 - vpHImg, pY * (100 - vpHImg)));

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
    const startVpLeft = vpLeftImg;
    const startVpTop = vpTopImg;

    const onMove = (ev: MouseEvent) => {
      // dx/dy as % of the container (which displays the full image)
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;

      const maxLeft = Math.max(0.0001, 100 - vpWImg);
      const maxTop = Math.max(0.0001, 100 - vpHImg);

      const newVpLeft = Math.max(0, Math.min(100 - vpWImg, startVpLeft + dx));
      const newVpTop = Math.max(0, Math.min(100 - vpHImg, startVpTop + dy));

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
  }, [onUpdate, vpHImg, vpLeftImg, vpTopImg, vpWImg]);

  const handleReset = () => onUpdate({ posX: 0, posY: 0, scale: 1 });

  const loaded = imgNaturalSize.w > 0;

  // For clip-path on the bright image overlay
  const rightInsetImg = 100 - (vpLeftImg + vpWImg);
  const bottomInsetImg = 100 - (vpTopImg + vpHImg);

  // --- Calculate viewport box dimensions that PRESERVE export aspect ratio ---
  // The container displays the full image with object-contain.
  // We need to find where the image actually renders within the container,
  // then position the viewport box accordingly.

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
        className="relative rounded-lg overflow-hidden bg-card border border-border mx-auto"
        style={{ aspectRatio: `${imgW}/${imgH}`, maxHeight: "220px", maxWidth: "100%" }}
      >
        {/* Dimmed full image */}
        <img src={image.url} alt="" draggable={false} onLoad={handleImgLoad}
          className="w-full h-full object-contain pointer-events-none opacity-30" />

        {loaded && (
          <>
            {/* Bright clip of visible region - uses image-space percentages */}
            <img src={image.url} alt="" draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ clipPath: `inset(${vpTopImg}% ${rightInsetImg}% ${bottomInsetImg}% ${vpLeftImg}%)` }}
            />

            {/* Viewport frame - positioned in image-space % with export aspect ratio */}
            <ViewportFrame
              imgAspect={imgAspect}
              exportAspect={exportAspect}
              vpLeftImg={vpLeftImg}
              vpTopImg={vpTopImg}
              vpWImg={vpWImg}
              vpHImg={vpHImg}
              dragging={dragging}
              onMouseDown={handleMouseDown}
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

// Separate component to render viewport frame with correct aspect ratio
function ViewportFrame({
  imgAspect,
  exportAspect,
  vpLeftImg,
  vpTopImg,
  vpWImg,
  vpHImg,
  dragging,
  onMouseDown,
}: {
  imgAspect: number;
  exportAspect: number;
  vpLeftImg: number;
  vpTopImg: number;
  vpWImg: number;
  vpHImg: number;
  dragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  // The viewport in image-space has vpWImg% width and vpHImg% height.
  // But we want the VISUAL box to maintain the export aspect ratio.
  // 
  // The actual aspect ratio of the viewport in image-space is:
  // viewportAspectInImageSpace = (vpWImg / 100 * imgW) / (vpHImg / 100 * imgH)
  //                            = (vpWImg * imgAspect) / vpHImg
  //
  // This should equal exportAspect by construction. Let's just use the computed values directly.

  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        "absolute border-2 border-primary rounded-sm",
        dragging ? "cursor-grabbing" : "cursor-grab hover:border-primary/80"
      )}
      style={{
        left: `${vpLeftImg}%`,
        top: `${vpTopImg}%`,
        width: `${vpWImg}%`,
        height: `${vpHImg}%`,
      }}
    >
      {/* Corner handles */}
      {["-top-0.5 -left-0.5", "-top-0.5 -right-0.5", "-bottom-0.5 -left-0.5", "-bottom-0.5 -right-0.5"].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-1.5 h-1.5 bg-primary rounded-full`} />
      ))}
      {/* Center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-4 h-[1px] bg-primary/40" />
        <div className="absolute w-[1px] h-4 bg-primary/40" />
      </div>
      {/* Aspect ratio indicator */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] text-primary/60 whitespace-nowrap">
        {exportAspect < 1 ? `${Math.round(exportAspect * 10)}:${10}` : exportAspect === 1 ? "1:1" : `${10}:${Math.round(10 / exportAspect)}`}
      </div>
    </div>
  );
}
