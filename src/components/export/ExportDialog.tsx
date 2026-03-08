import { useState, useRef, useCallback } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { SlideRenderer } from "@/components/preview/SlideRenderer";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { slugify } from "@/lib/utils/helpers";
import { toast } from "sonner";
import type { Project, ExportSize } from "@/types/project";
import { cn } from "@/lib/utils";

interface Props {
  project: Project;
  currentSlideIndex: number;
  onClose: () => void;
}

const SIZES: { value: ExportSize; label: string }[] = [
  { value: "1080x1350", label: "1080 × 1350 (4:5)" },
  { value: "1080x1080", label: "1080 × 1080 (1:1)" },
  { value: "1080x1920", label: "1080 × 1920 (9:16)" },
];

export function ExportDialog({ project, currentSlideIndex, onClose }: Props) {
  const [mode, setMode] = useState<"current" | "all">("current");
  const [size, setSize] = useState<ExportSize>(project.exportPreset.size);
  const [exporting, setExporting] = useState(false);
  const renderRef = useRef<HTMLDivElement>(null);

  const [w, h] = size.split("x").map(Number);
  const slug = slugify(project.title) || "cardnews";

  const exportSlide = useCallback(async (slideIndex: number): Promise<Blob> => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = `${w}px`;
    container.style.height = `${h}px`;
    document.body.appendChild(container);

    const { createRoot } = await import("react-dom/client");
    const root = createRoot(container);

    return new Promise((resolve, reject) => {
      root.render(
        <SlideRenderer
          slide={project.slides[slideIndex]}
          width={w}
          height={h}
          isExport
        />
      );

      setTimeout(async () => {
        try {
          const dataUrl = await toPng(container, {
            width: w,
            height: h,
            pixelRatio: 2,
            cacheBust: true,
          });
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          resolve(blob);
        } catch (err) {
          reject(err);
        } finally {
          root.unmount();
          document.body.removeChild(container);
        }
      }, 200);
    });
  }, [project, w, h]);

  const handleExportCurrent = async () => {
    setExporting(true);
    try {
      const blob = await exportSlide(currentSlideIndex);
      saveAs(blob, `${slug}_slide-${String(currentSlideIndex + 1).padStart(2, "0")}.png`);
      toast.success("슬라이드가 저장되었습니다");
    } catch (err) {
      toast.error("내보내기에 실패했습니다");
    }
    setExporting(false);
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      if (project.slides.length === 1) {
        const blob = await exportSlide(0);
        saveAs(blob, `${slug}_slide-01.png`);
      } else {
        const zip = new JSZip();
        for (let i = 0; i < project.slides.length; i++) {
          const blob = await exportSlide(i);
          zip.file(`${slug}_slide-${String(i + 1).padStart(2, "0")}.png`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, `${slug}_all-slides.zip`);
      }
      toast.success("전체 슬라이드가 저장되었습니다");
    } catch (err) {
      toast.error("내보내기에 실패했습니다");
    }
    setExporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-panel p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">내보내기</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-surface text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode selection */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode("current")}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
              mode === "current" ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
            )}>현재 슬라이드</button>
          <button onClick={() => setMode("all")}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
              mode === "all" ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
            )}>전체 ({project.slides.length}장)</button>
        </div>

        {/* Size selection */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-2 block">사이즈</label>
          <div className="flex gap-2">
            {SIZES.map(s => (
              <button key={s.value} onClick={() => setSize(s.value)}
                className={cn("flex-1 py-2 rounded-md text-xs font-medium transition-all",
                  size === s.value ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
                )}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Export button */}
        <button
          onClick={mode === "current" ? handleExportCurrent : handleExportAll}
          disabled={exporting}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "내보내는 중..." : "PNG 내보내기"}
        </button>

        {mode === "all" && project.slides.length > 1 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">전체 슬라이드는 ZIP 파일로 저장됩니다</p>
        )}
      </div>
    </div>
  );
}
