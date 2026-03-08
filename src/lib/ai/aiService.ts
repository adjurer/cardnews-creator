import { supabase } from "@/integrations/supabase/client";
import type { Slide, SourceType, ThemePreset } from "@/types/project";
import { generateId } from "@/lib/utils/helpers";

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
    console.error("Edge function error:", error);
    throw new Error(error.message || "카드뉴스 생성에 실패했습니다.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  // Add IDs and default themePreset to each slide
  const slides: Slide[] = data.slides.map((s: any) => ({
    id: generateId(),
    type: s.type || "detail",
    category: s.category,
    title: s.title || "",
    subtitle: s.subtitle,
    highlight: s.highlight,
    body: s.body,
    bullets: s.bullets,
    cta: s.cta,
    sourceLabel: s.sourceLabel,
    layoutType: s.layoutType || "title-body",
    textAlign: s.textAlign || "center",
    themePreset: data.themePreset || "cyan-accent",
  }));

  return {
    title: data.title,
    themePreset: data.themePreset || "cyan-accent",
    slides,
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
    body: {
      mode,
      slide: {
        type: slide.type,
        category: slide.category,
        title: slide.title,
        subtitle: slide.subtitle,
        highlight: slide.highlight,
        body: slide.body,
        bullets: slide.bullets,
        cta: slide.cta,
        sourceLabel: slide.sourceLabel,
        layoutType: slide.layoutType,
        textAlign: slide.textAlign,
      },
      projectTitle,
      allSlides: allSlides.map(s => ({ type: s.type, title: s.title })),
      instruction,
    },
  });

  if (error) {
    throw new Error(error.message || "슬라이드 재생성에 실패했습니다.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    type: data.type,
    category: data.category,
    title: data.title,
    subtitle: data.subtitle,
    highlight: data.highlight,
    body: data.body,
    bullets: data.bullets,
    cta: data.cta,
    sourceLabel: data.sourceLabel,
    layoutType: data.layoutType,
    textAlign: data.textAlign,
  };
}
