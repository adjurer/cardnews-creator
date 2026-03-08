import { Slide, ThemePreset } from "@/types/project";
import { generateId } from "@/lib/utils/helpers";

export interface CardNewsGenerationInput {
  sourceType: "text" | "url" | "news" | "feed" | "example";
  content: string;
  title?: string;
}

export interface CardNewsGenerationOutput {
  title: string;
  themePreset: ThemePreset;
  slides: Slide[];
}

export interface CardNewsGenerationProvider {
  generate(input: CardNewsGenerationInput): Promise<CardNewsGenerationOutput>;
}

function splitTextToSlides(text: string): Slide[] {
  const sentences = text.split(/[.!?。！？]\s*/).filter(s => s.trim().length > 5);
  const chunks: string[][] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    chunks.push(sentences.slice(i, i + 2));
  }

  const titleSentence = sentences[0] || "카드뉴스";
  const slides: Slide[] = [];

  slides.push({
    id: generateId(), type: "cover", title: titleSentence.slice(0, 30),
    subtitle: "AI가 자동 생성한 카드뉴스", layoutType: "center-title",
    textAlign: "center", themePreset: "cyan-accent",
  });

  slides.push({
    id: generateId(), type: "summary", title: "핵심 요약",
    body: sentences.slice(0, 3).join(". ") + ".",
    layoutType: "title-body", textAlign: "center", themePreset: "cyan-accent",
  });

  chunks.slice(1, 4).forEach((chunk, i) => {
    slides.push({
      id: generateId(), type: "detail", title: `포인트 ${i + 1}`,
      body: chunk.join(". ") + ".",
      layoutType: "title-body", textAlign: "left", themePreset: "cyan-accent",
    });
  });

  if (sentences.length > 4) {
    slides.push({
      id: generateId(), type: "list", title: "주요 포인트",
      bullets: sentences.slice(4, 8).map(s => s.trim()),
      layoutType: "bullet-list", textAlign: "left", themePreset: "cyan-accent",
    });
  }

  slides.push({
    id: generateId(), type: "cta", title: "더 알아보기",
    cta: "자세한 내용은 원문을 확인하세요",
    layoutType: "cta", textAlign: "center", themePreset: "cyan-accent",
  });

  return slides;
}

export class MockCardNewsGenerationProvider implements CardNewsGenerationProvider {
  async generate(input: CardNewsGenerationInput): Promise<CardNewsGenerationOutput> {
    // Simulate async processing
    await new Promise(r => setTimeout(r, 500));

    const slides = splitTextToSlides(input.content);
    return {
      title: input.title || slides[0]?.title || "새 카드뉴스",
      themePreset: "cyan-accent",
      slides,
    };
  }
}

export const defaultProvider = new MockCardNewsGenerationProvider();
