import { supabase } from "@/integrations/supabase/client";
import type { Slide, SourceType, ThemePreset } from "@/types/project";

export interface CardNewsGenerationResult {
  title: string;
  themePreset: ThemePreset;
  slides: Slide[];
}

export async function generateCardNews(
  sourceType: SourceType,
  content: string,
  title?: string
): Promise<CardNewsGenerationResult> {
  const { data, error } = await supabase.functions.invoke("generate-cardnews", {
    body: { sourceType, content, title },
  });

  if (error) {
    console.error("generate-cardnews error:", error);
    throw new Error(error.message || "카드뉴스 생성에 실패했습니다.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    title: data.title || title || "새 카드뉴스",
    themePreset: data.themePreset || "cyan-accent",
    slides: (data.slides || []).map((s: any) => ({
      ...s,
      themePreset: data.themePreset || "cyan-accent",
    })),
  };
}

export async function regenerateSlide(
  slide: Slide,
  projectTitle: string,
  allSlides: Slide[],
  mode: "rewrite" | "improve" = "rewrite",
  instruction?: string
): Promise<Partial<Slide>> {
  const { data, error } = await supabase.functions.invoke("regenerate-slide", {
    body: { mode, slide, projectTitle, allSlides, instruction },
  });

  if (error) {
    console.error("regenerate-slide error:", error);
    throw new Error(error.message || "슬라이드 재생성에 실패했습니다.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
