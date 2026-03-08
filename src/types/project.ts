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
