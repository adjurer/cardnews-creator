import type { AutoLayoutPreset, Slide, SlidePosition, SlideVisibility, SlideTypography, TextAlign } from "@/types/project";

export interface AutoLayoutConfig {
  label: string;
  description: string;
  icon: string; // emoji
}

export const AUTO_LAYOUT_PRESETS: Record<AutoLayoutPreset, AutoLayoutConfig> = {
  none: { label: "사용자 정의", description: "수동 배치", icon: "✏️" },
  centered: { label: "중앙 집중", description: "모든 요소 중앙 정렬", icon: "🎯" },
  "top-heavy": { label: "상단 강조", description: "제목을 상단에 크게 배치", icon: "⬆️" },
  "bottom-heavy": { label: "하단 강조", description: "콘텐츠를 하단에 집중", icon: "⬇️" },
  "split-horizontal": { label: "상하 분할", description: "제목 상단, 본문 하단", icon: "↕️" },
  editorial: { label: "에디토리얼", description: "잡지풍 좌측 정렬", icon: "📰" },
  "minimal-quote": { label: "미니멀 인용", description: "넓은 여백의 인용 스타일", icon: "💬" },
  "bold-statement": { label: "볼드 스테이트먼트", description: "큰 제목 중심 임팩트", icon: "💥" },
  "card-news": { label: "카드뉴스", description: "카드뉴스 기본형", icon: "📋" },
  "magazine-cover": { label: "매거진 커버", description: "잡지 표지 스타일", icon: "📖" },
  "data-highlight": { label: "데이터 강조", description: "숫자/데이터 중심 배치", icon: "📊" },
  "sns-promo": { label: "SNS 프로모", description: "SNS 홍보용 레이아웃", icon: "📱" },
};

interface LayoutResult {
  position: Partial<SlidePosition>;
  typography: Partial<SlideTypography>;
  textAlign: TextAlign;
  visibility: Partial<SlideVisibility>;
}

export function applyAutoLayout(preset: AutoLayoutPreset, slide: Slide): Partial<Slide> {
  if (preset === "none") return { autoLayout: "none" };

  const result: LayoutResult = getLayoutResult(preset);

  return {
    autoLayout: preset,
    position: { ...slide.position, ...result.position },
    typography: { ...slide.typography, ...result.typography },
    textAlign: result.textAlign,
    visibility: { ...slide.visibility, ...result.visibility },
    // Reset element offsets for clean layout
    elementOverrides: resetOffsets(slide),
  };
}

function resetOffsets(slide: Slide): Slide["elementOverrides"] {
  const overrides = { ...slide.elementOverrides };
  for (const key of Object.keys(overrides) as Array<keyof typeof overrides>) {
    if (overrides[key]) {
      overrides[key] = { ...overrides[key], offsetX: 0, offsetY: 0 };
    }
  }
  return overrides;
}

function getLayoutResult(preset: AutoLayoutPreset): LayoutResult {
  switch (preset) {
    case "centered":
      return {
        position: { contentPaddingX: 10, contentPaddingY: 8, contentAlign: "center", titleBoxWidth: 90 },
        typography: { titleSize: 28, titleWeight: 700, bodySize: 15 },
        textAlign: "center",
        visibility: { showCategory: true, showSubtitle: true, showBody: true },
      };

    case "top-heavy":
      return {
        position: { contentPaddingX: 8, contentPaddingY: 6, contentAlign: "start", titleBoxWidth: 95 },
        typography: { titleSize: 34, titleWeight: 800, bodySize: 14 },
        textAlign: "left",
        visibility: { showCategory: true, showSubtitle: true, showBody: true },
      };

    case "bottom-heavy":
      return {
        position: { contentPaddingX: 8, contentPaddingY: 8, contentAlign: "end", titleBoxWidth: 90 },
        typography: { titleSize: 26, titleWeight: 700, bodySize: 15 },
        textAlign: "left",
        visibility: { showCategory: true, showSubtitle: true, showBody: true },
      };

    case "split-horizontal":
      return {
        position: { contentPaddingX: 10, contentPaddingY: 10, contentAlign: "center", titleBoxWidth: 100 },
        typography: { titleSize: 30, titleWeight: 700, titleLineHeight: 1.2, bodySize: 14, bodyLineHeight: 1.8 },
        textAlign: "center",
        visibility: { showCategory: false, showSubtitle: true, showBody: true },
      };

    case "editorial":
      return {
        position: { contentPaddingX: 12, contentPaddingY: 10, contentAlign: "center", titleBoxWidth: 85 },
        typography: { titleSize: 26, titleWeight: 600, titleLetterSpacing: -0.02, bodySize: 14, bodyLineHeight: 1.9 },
        textAlign: "left",
        visibility: { showCategory: true, showSubtitle: true, showBody: true, showSourceLabel: true },
      };

    case "minimal-quote":
      return {
        position: { contentPaddingX: 15, contentPaddingY: 15, contentAlign: "center", titleBoxWidth: 80 },
        typography: { titleSize: 24, titleWeight: 500, titleLineHeight: 1.6, bodySize: 16 },
        textAlign: "center",
        visibility: { showCategory: false, showSubtitle: false, showBody: true, showBullets: false, showCta: false, showSourceLabel: true },
      };

    case "bold-statement":
      return {
        position: { contentPaddingX: 8, contentPaddingY: 10, contentAlign: "center", titleBoxWidth: 100 },
        typography: { titleSize: 42, titleWeight: 900, titleLineHeight: 1.1, titleLetterSpacing: -0.03, bodySize: 14 },
        textAlign: "center",
        visibility: { showCategory: false, showSubtitle: false, showBody: false, showHighlight: true, showCta: false, showSourceLabel: false },
      };

    case "card-news":
      return {
        position: { contentPaddingX: 8, contentPaddingY: 6, contentAlign: "start", titleBoxWidth: 95 },
        typography: { titleSize: 24, titleWeight: 700, titleLineHeight: 1.4, bodySize: 15, bodyLineHeight: 1.7 },
        textAlign: "left",
        visibility: { showCategory: true, showSubtitle: true, showBody: true, showSourceLabel: true, showHighlight: false },
      };

    case "magazine-cover":
      return {
        position: { contentPaddingX: 10, contentPaddingY: 8, contentAlign: "end", titleBoxWidth: 80 },
        typography: { titleSize: 36, titleWeight: 800, titleLineHeight: 1.15, titleLetterSpacing: -0.02, bodySize: 13, subtitleSize: 16 },
        textAlign: "left",
        visibility: { showCategory: true, showSubtitle: true, showBody: false, showHighlight: false, showCta: false, showSourceLabel: false },
      };

    case "data-highlight":
      return {
        position: { contentPaddingX: 10, contentPaddingY: 10, contentAlign: "center", titleBoxWidth: 90 },
        typography: { titleSize: 48, titleWeight: 900, titleLineHeight: 1.0, bodySize: 14, bodyLineHeight: 1.6, subtitleSize: 18 },
        textAlign: "center",
        visibility: { showCategory: true, showSubtitle: true, showBody: true, showHighlight: false, showBullets: false, showCta: false },
      };

    case "sns-promo":
      return {
        position: { contentPaddingX: 7, contentPaddingY: 7, contentAlign: "center", titleBoxWidth: 95 },
        typography: { titleSize: 26, titleWeight: 700, titleLineHeight: 1.3, bodySize: 15, bodyLineHeight: 1.5, ctaSize: 18 },
        textAlign: "center",
        visibility: { showCategory: false, showSubtitle: true, showBody: true, showHighlight: true, showCta: true, showSourceLabel: false },
      };

    default:
      return {
        position: {},
        typography: {},
        textAlign: "center",
        visibility: {},
      };
  }
}
