export type ThemePreset = "dark-minimal" | "cyan-accent" | "editorial-dark" | "warm-neutral" | "mono-contrast";
export type LayoutType = "center-title" | "title-body" | "title-image" | "image-overlay" | "bullet-list" | "timeline" | "quote" | "cta";
export type SlideType = "cover" | "summary" | "detail" | "list" | "quote" | "timeline" | "cta";
export type SourceType = "text" | "url" | "news" | "feed" | "example";
export type ProjectStatus = "draft" | "generated" | "exported";
export type ExportSize = "1080x1350" | "1080x1080" | "1080x1920";
export type TextAlign = "left" | "center" | "right";
export type ImageMode = "upload" | "generate" | "search";

export interface SlideImage {
  mode: ImageMode;
  url: string;
  prompt?: string;
  posX?: number;
  posY?: number;
  scale?: number;
  overlayOpacity?: number;
  borderRadius?: number;
  blur?: number;
  brightness?: number;
}

export interface SlideTypography {
  titleSize?: number;       // px
  titleWeight?: number;     // 400-900
  titleLineHeight?: number; // multiplier e.g. 1.3
  titleLetterSpacing?: number; // em e.g. -0.02
  bodySize?: number;
  bodyWeight?: number;
  bodyLineHeight?: number;
  bodyLetterSpacing?: number;
}

export interface SlideColors {
  backgroundColor?: string;  // hex
  textColor?: string;
  accentColor?: string;
  highlightBg?: string;      // highlight badge background
  highlightText?: string;
  gradientPreset?: "none" | "dark-fade" | "primary-glow" | "warm-sunset" | "cool-ocean" | "purple-haze";
  containerRadius?: number;
  borderEnabled?: boolean;
  borderColor?: string;
  shadowIntensity?: number; // 0-1
  overlayColor?: string;
}

export interface SlideVisibility {
  showCategory?: boolean;
  showSubtitle?: boolean;
  showBody?: boolean;
  showBullets?: boolean;
  showCta?: boolean;
  showSourceLabel?: boolean;
  showHighlight?: boolean;
}

export interface SlidePosition {
  contentPaddingX?: number; // percentage 5-20
  contentPaddingY?: number;
  titleBoxWidth?: number;   // percentage 50-100
  contentAlign?: "start" | "center" | "end"; // vertical alignment
}

export interface Slide {
  id: string;
  type: SlideType;
  category?: string;
  title: string;
  subtitle?: string;
  highlight?: string;
  body?: string;
  bullets?: string[];
  cta?: string;
  sourceLabel?: string;
  layoutType: LayoutType;
  textAlign: TextAlign;
  themePreset: ThemePreset;
  image?: SlideImage;
  typography?: SlideTypography;
  colors?: SlideColors;
  visibility?: SlideVisibility;
  position?: SlidePosition;
}

export interface ExportPreset {
  format: "png";
  size: ExportSize;
}

export interface Project {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceInput?: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  themePreset: ThemePreset;
  slides: Slide[];
  exportPreset: ExportPreset;
  metadata?: {
    summary?: string;
    tags?: string[];
    recentPath?: string;
  };
}

export interface ThemeColors {
  background: string;
  panelBg: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  border: string;
  overlay: string;
}
