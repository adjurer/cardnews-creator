export type ThemePreset = "dark-minimal" | "cyan-accent" | "editorial-dark" | "warm-neutral" | "mono-contrast";
export type LayoutType = "center-title" | "title-body" | "title-image" | "image-overlay" | "bullet-list" | "timeline" | "quote" | "cta";
export type SlideType = "cover" | "summary" | "detail" | "list" | "quote" | "timeline" | "cta";
export type SourceType = "text" | "url" | "news" | "feed" | "example";
export type ProjectStatus = "draft" | "generated" | "exported";
export type ExportSize = "1080x1350" | "1080x1080" | "1080x1920";
export type TextAlign = "left" | "center" | "right";
export type ImageMode = "upload" | "generate" | "search";

export type ElementKey = "category" | "title" | "subtitle" | "highlight" | "body" | "bullets" | "cta" | "sourceLabel" | "image" | "logo";

export type OverlayDirection = "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right";

export interface SlideImage {
  mode: ImageMode;
  url: string;
  prompt?: string;
  posX?: number;
  posY?: number;
  scale?: number;
  overlayOpacity?: number;
  overlayDirection?: OverlayDirection;
  overlayRange?: [number, number]; // [start%, end%] of overlay gradient
  overlayBlur?: number;
  overlayBlurDirection?: OverlayDirection;
  overlayBlurRange?: [number, number]; // [start%, end%] of blur mask gradient
  borderRadius?: number;
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  grayscale?: number;
  sepia?: number;
  hueRotate?: number;
}

export interface SlideTypography {
  titleSize?: number;
  titleWeight?: number;
  titleLineHeight?: number;
  titleLetterSpacing?: number;
  titleFontFamily?: string;
  bodySize?: number;
  subtitleSize?: number;
  highlightSize?: number;
  categorySize?: number;
  bulletSize?: number;
  ctaSize?: number;
  sourceLabelSize?: number;
  bodyWeight?: number;
  bodyLineHeight?: number;
  bodyLetterSpacing?: number;
  bodyFontFamily?: string;
}

export interface SlideColors {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  highlightBg?: string;
  highlightText?: string;
  gradientPreset?: "none" | "dark-fade" | "primary-glow" | "warm-sunset" | "cool-ocean" | "purple-haze";
  containerRadius?: number;
  borderEnabled?: boolean;
  borderColor?: string;
  shadowIntensity?: number;
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
  contentPaddingX?: number;
  contentPaddingY?: number;
  titleBoxWidth?: number;
  contentAlign?: "start" | "center" | "end";
}

export interface ElementOverride {
  offsetX?: number;
  offsetY?: number;
  color?: string;        // per-element text color
  fontWeight?: number;   // per-element font weight
  lineHeight?: number;   // per-element line height
  letterSpacing?: number; // per-element letter spacing (em)
  boxBg?: string;
  boxBgOpacity?: number;
  boxPadding?: number;
  boxRadius?: number;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
}

export interface SlideLogo {
  url: string;
  width?: number;   // in px (at export resolution)
  height?: number;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  opacity?: number;
  margin?: number;   // margin from edge in px
}

export type AutoLayoutPreset = "none" | "centered" | "top-heavy" | "bottom-heavy" | "split-horizontal" | "editorial" | "minimal-quote";

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
  logo?: SlideLogo;
  typography?: SlideTypography;
  colors?: SlideColors;
  visibility?: SlideVisibility;
  position?: SlidePosition;
  elementOverrides?: Partial<Record<ElementKey, ElementOverride>>;
  autoLayout?: AutoLayoutPreset;
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
  // Style presets saved per project
  stylePresets?: StylePreset[];
  // Master style applied to all slides
  masterStyle?: MasterStyle;
}

export interface StylePreset {
  id: string;
  name: string;
  target: "title" | "body" | "cta" | "highlight";
  typography?: Partial<SlideTypography>;
  colors?: Partial<SlideColors>;
  textBox?: Partial<ElementOverride>;
}

export interface MasterStyle {
  themePreset?: ThemePreset;
  typography?: Partial<SlideTypography>;
  colors?: Partial<SlideColors>;
  position?: Partial<SlidePosition>;
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

export interface UploadedFont {
  id: string;
  name: string;
  family: string;
  url: string;
  format: "truetype" | "opentype" | "woff2";
  isFavorite?: boolean;
  target?: "title" | "body" | "both";
  addedAt: string;
}
