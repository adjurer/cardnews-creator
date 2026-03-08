import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toPng } from "html-to-image";
import { SlideRenderer } from "@/components/preview/SlideRenderer";
import { toast } from "sonner";
import type { Project } from "@/types/project";

interface UseInstagramPublishOptions {
  project: Project;
  exportWidth: number;
  exportHeight: number;
}

export function useInstagramPublish({ project, exportWidth, exportHeight }: UseInstagramPublishOptions) {
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState("");

  const renderSlideToBlob = async (slideIndex: number): Promise<Blob> => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = `${exportWidth}px`;
    container.style.height = `${exportHeight}px`;
    document.body.appendChild(container);

    const { createRoot } = await import("react-dom/client");
    const root = createRoot(container);

    return new Promise((resolve, reject) => {
      root.render(
        <SlideRenderer
          slide={project.slides[slideIndex]}
          width={exportWidth}
          height={exportHeight}
          isExport
        />
      );

      setTimeout(async () => {
        try {
          const dataUrl = await toPng(container, {
            width: exportWidth,
            height: exportHeight,
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
  };

  const uploadToStorage = async (blob: Blob, filename: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from("cardnews-exports")
      .upload(filename, blob, { contentType: "image/png", upsert: true });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from("cardnews-exports")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const publish = useCallback(async (
    mode: "current" | "all",
    currentSlideIndex: number,
    caption: string,
    accessToken: string,
    igUserId: string
  ) => {
    setPublishing(true);
    try {
      const slideIndices = mode === "current"
        ? [currentSlideIndex]
        : project.slides.map((_, i) => i);

      // Step 1: Render and upload images
      const imageUrls: string[] = [];
      for (let i = 0; i < slideIndices.length; i++) {
        setProgress(`이미지 렌더링 중... (${i + 1}/${slideIndices.length})`);
        const blob = await renderSlideToBlob(slideIndices[i]);
        const filename = `ig_${project.id}_${Date.now()}_${i}.png`;
        setProgress(`업로드 중... (${i + 1}/${slideIndices.length})`);
        const url = await uploadToStorage(blob, filename);
        imageUrls.push(url);
      }

      // Step 2: Call edge function
      setProgress("인스타그램에 게시 중...");
      const { data, error } = await supabase.functions.invoke("publish-instagram", {
        body: { imageUrls, caption, accessToken, igUserId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("인스타그램에 게시되었습니다! 🎉");
      return data;
    } catch (err: any) {
      toast.error(`게시 실패: ${err.message}`);
      throw err;
    } finally {
      setPublishing(false);
      setProgress("");
    }
  }, [project, exportWidth, exportHeight]);

  return { publish, publishing, progress };
}
