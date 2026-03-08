// AI Service - Mock provider abstraction
// This file provides the interface for AI operations.
// Currently uses mock implementations. Will be replaced with real AI (Claude/Gemini) later.

import type { Slide, SourceType, ThemePreset } from "@/types/project";

export interface CardNewsGenerationResult {
  title: string;
  themePreset: ThemePreset;
  slides: Slide[];
}

// Mock implementation - to be replaced with Edge Function calls
export async function generateCardNews(
  sourceType: SourceType,
  content: string,
  title?: string
): Promise<CardNewsGenerationResult> {
  // Simulate API delay
  await new Promise(r => setTimeout(r, 1500));

  return {
    title: title || "새 카드뉴스",
    themePreset: "cyan-accent",
    slides: [],
  };
}

export async function regenerateSlide(
  slide: Slide,
  projectTitle: string,
  allSlides: Slide[],
  mode: "rewrite" | "improve" = "rewrite",
  instruction?: string
): Promise<Partial<Slide>> {
  // Mock implementation
  await new Promise(r => setTimeout(r, 800));

  return {
    title: slide.title + " (개선됨)",
    body: slide.body ? slide.body + " — AI가 개선한 내용입니다." : undefined,
  };
}
