import { useEffect, useState } from "react";
import { THEME_MAP } from "@/lib/themes";
import type { Slide, ElementKey, ElementOverride, SlideLogo, OverlayDirection } from "@/types/project";

const DEG_MAP: Record<OverlayDirection, string> = {
  "top-left": "135deg", "top-center": "180deg", "top-right": "225deg",
  "center-left": "90deg", "center": "", "center-right": "270deg",
  "bottom-left": "45deg", "bottom-center": "0deg", "bottom-right": "315deg",
};

interface Props {
  slide: Slide;
  width?: number;
  height?: number;
  className?: string;
  isExport?: boolean;
  selectedElement?: ElementKey | null;
  onElementClick?: (key: ElementKey) => void;
}

const GRADIENT_MAP: Record<string, string> = {
  "none": "",
  "dark-fade": "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)",
  "primary-glow": "radial-gradient(ellipse at 30% 80%, rgba(57,210,192,0.15) 0%, transparent 70%)",
  "warm-sunset": "linear-gradient(135deg, rgba(193,127,89,0.2) 0%, rgba(0,0,0,0.6) 100%)",
  "cool-ocean": "linear-gradient(180deg, rgba(0,100,150,0.2) 0%, rgba(0,0,0,0.7) 100%)",
  "purple-haze": "linear-gradient(135deg, rgba(120,50,180,0.2) 0%, rgba(0,0,0,0.6) 100%)",
};

function getOverride(slide: Slide, key: ElementKey): ElementOverride {
  return slide.elementOverrides?.[key] || {};
}

function isHidden(slide: Slide, key: ElementKey): boolean {
  return getOverride(slide, key).hidden === true;
}

function elementStyle(slide: Slide, key: ElementKey): React.CSSProperties {
  const ovr = getOverride(slide, key);
  return {
    position: "relative",
    transform: ovr.offsetX || ovr.offsetY ? `translate(${ovr.offsetX || 0}px, ${ovr.offsetY || 0}px)` : undefined,
    backgroundColor: ovr.boxBg ? `${ovr.boxBg}${Math.round((ovr.boxBgOpacity ?? 1) * 255).toString(16).padStart(2, "0")}` : undefined,
    padding: ovr.boxPadding ? `${ovr.boxPadding}px` : undefined,
    borderRadius: ovr.boxRadius ? `${ovr.boxRadius}px` : undefined,
    zIndex: ovr.zIndex,
  };
}

export function SlideRenderer({ slide, width = 1080, height = 1350, className, isExport, selectedElement, onElementClick }: Props) {
  const theme = THEME_MAP[slide.themePreset];
  const typo = slide.typography || {};
  const colors = slide.colors || {};
  const vis = slide.visibility || {};
  const pos = slide.position || {};

  const bg = colors.backgroundColor || theme.background;
  const textColor = colors.textColor || theme.primaryText;
  const accentColor = colors.accentColor || theme.accent;
  const secondaryText = theme.secondaryText;

  const paddingX = pos.contentPaddingX ?? 8;
  const paddingY = pos.contentPaddingY ?? 8;
  const titleBoxWidth = pos.titleBoxWidth ?? 100;
  const contentAlign = pos.contentAlign || "center";
  const gradient = GRADIENT_MAP[colors.gradientPreset || "none"] || "";

  const titleFamily = typo.titleFontFamily || "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";
  const bodyFamily = typo.bodyFontFamily || "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

  const containerStyle: React.CSSProperties = {
    width: isExport ? width : "100%",
    height: isExport ? height : "100%",
    aspectRatio: isExport ? undefined : `${width}/${height}`,
    background: gradient ? `${gradient}, ${bg}` : bg,
    color: textColor,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily: bodyFamily,
    borderRadius: colors.containerRadius ? `${colors.containerRadius}px` : undefined,
    border: colors.borderEnabled ? `1px solid ${colors.borderColor || theme.border}` : undefined,
    boxShadow: colors.shadowIntensity
      ? `0 ${4 + colors.shadowIntensity * 20}px ${10 + colors.shadowIntensity * 40}px rgba(0,0,0,${colors.shadowIntensity * 0.5})`
      : undefined,
  };

  const imageUrl = slide.image?.url;
  const overlayOpacity = slide.image?.overlayOpacity ?? 0;
  const imgScale = slide.image?.scale ?? 1;
  const imgBorderRadius = slide.image?.borderRadius ?? 0;
  const [imageAspect, setImageAspect] = useState(1);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setImageAspect(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const frameAspect = width / height;
  const baseBgW = imageAspect > frameAspect ? (imageAspect / frameAspect) * 100 : 100;
  const baseBgH = imageAspect > frameAspect ? 100 : (frameAspect / imageAspect) * 100;
  const bgSizeW = baseBgW * imgScale;
  const bgSizeH = baseBgH * imgScale;

  const buildImageFilter = () => {
    const img = slide.image;
    if (!img) return undefined;
    const parts = [
      img.blur ? `blur(${img.blur}px)` : "",
      img.brightness !== undefined && img.brightness !== 1 ? `brightness(${img.brightness})` : "",
      img.contrast !== undefined && img.contrast !== 1 ? `contrast(${img.contrast})` : "",
      img.saturate !== undefined && img.saturate !== 1 ? `saturate(${img.saturate})` : "",
      img.grayscale ? `grayscale(${img.grayscale})` : "",
      img.sepia ? `sepia(${img.sepia})` : "",
      img.hueRotate ? `hue-rotate(${img.hueRotate}deg)` : "",
    ].filter(Boolean).join(" ");
    return parts || undefined;
  };
  const imageFilter = buildImageFilter();

  const textAlignClass = slide.textAlign === "left" ? "text-left" : slide.textAlign === "right" ? "text-right" : "text-center";
  const justifyMap = { start: "flex-start", center: "center", end: "flex-end" };

  const titleSize = isExport ? `${(typo.titleSize ?? 28) * 1.5}px` : `clamp(16px, 4.5vw, ${typo.titleSize ?? 28}px)`;
  const subtitleSize = isExport ? `${(typo.subtitleSize ?? (typo.bodySize ?? 16) + 2) * 1.3}px` : `clamp(11px, 3vw, ${typo.subtitleSize ?? ((typo.bodySize ?? 16) + 2)}px)`;
  const bodySize = isExport ? `${(typo.bodySize ?? 16) * 1.5}px` : `clamp(10px, 2.8vw, ${typo.bodySize ?? 16}px)`;
  const bulletSize = isExport ? `${(typo.bodySize ?? 16) * 1.4}px` : `clamp(10px, 2.6vw, ${(typo.bodySize ?? 16) - 1}px)`;
  const catSize = isExport ? "16px" : "clamp(8px, 2vw, 12px)";
  const basePadding = isExport ? `${paddingY * 6}px ${paddingX * 6}px` : `${paddingY}% ${paddingX}%`;

  const shouldShow = (key: keyof typeof vis) => vis[key] !== false;

  const eClick = (key: ElementKey) => (e: React.MouseEvent) => {
    if (onElementClick) { e.stopPropagation(); onElementClick(key); }
  };

  const titleStyle: React.CSSProperties = {
    fontSize: titleSize,
    fontWeight: typo.titleWeight ?? 700,
    lineHeight: typo.titleLineHeight ?? 1.3,
    letterSpacing: typo.titleLetterSpacing ? `${typo.titleLetterSpacing}em` : undefined,
    maxWidth: titleBoxWidth < 100 ? `${titleBoxWidth}%` : undefined,
    color: textColor,
    fontFamily: titleFamily,
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: bodySize,
    fontWeight: typo.bodyWeight ?? 400,
    lineHeight: typo.bodyLineHeight ?? 1.6,
    letterSpacing: typo.bodyLetterSpacing ? `${typo.bodyLetterSpacing}em` : undefined,
    color: secondaryText,
    fontFamily: bodyFamily,
  };

  const highlightStyle: React.CSSProperties = {
    display: "inline-block", padding: "2px 10px", borderRadius: "4px",
    background: colors.highlightBg || accentColor,
    color: colors.highlightText || bg,
    fontWeight: 700, fontSize: subtitleSize,
  };

  const renderImage = () => {
    if (!imageUrl) return null;
    if (isHidden(slide, "image")) return null;

    // For title-image layout, image is rendered inline (handled separately)
    if (slide.layoutType === "title-image") return null;

    // Background image for all other layouts (overlay, center-title, title-body, etc.)
    return (
      <>
        <div data-element="image" onClick={eClick("image")} style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("${imageUrl}")`,
          backgroundPosition: `${50 + (slide.image?.posX || 0)}% ${50 + (slide.image?.posY || 0)}%`,
          backgroundSize: `${bgSizeW}% ${bgSizeH}%`,
          backgroundRepeat: "no-repeat",
          borderRadius: imgBorderRadius,
          filter: imageFilter,
          cursor: onElementClick ? "pointer" : undefined,
          zIndex: getOverride(slide, "image").zIndex,
        }} />
        {(() => {
          const dir = slide.image?.overlayDirection ?? "center";
          const overlayRange = slide.image?.overlayRange ?? [0, 70];
          const overlayBlur = slide.image?.overlayBlur ?? 0;
          const blurDir = slide.image?.overlayBlurDirection ?? "center";
          const blurRange = slide.image?.overlayBlurRange ?? [0, 30];
          const colorStr = `rgba(0,0,0,${overlayOpacity})`;

          const overlayBg = dir === "center"
            ? colorStr
            : `linear-gradient(${DEG_MAP[dir]}, ${colorStr} ${overlayRange[0]}%, transparent ${overlayRange[1]}%)`;

          const blurMask = blurDir === "center"
            ? `radial-gradient(ellipse at center, white ${blurRange[0]}%, transparent ${blurRange[1]}%)`
            : `linear-gradient(${DEG_MAP[blurDir]}, white ${blurRange[0]}%, transparent ${blurRange[1]}%)`;

          return (
            <>
              {overlayBlur > 0 && (
                <div style={{
                  position: "absolute", inset: 0,
                  backdropFilter: `blur(${overlayBlur}px)`,
                  WebkitBackdropFilter: `blur(${overlayBlur}px)`,
                  WebkitMaskImage: blurMask,
                  maskImage: blurMask,
                  pointerEvents: "none",
                }} />
              )}
              <div style={{
                position: "absolute", inset: 0,
                background: overlayBg,
                pointerEvents: "none",
              }} />
            </>
          );
        })()}
      </>
    );
  };

  const renderCategory = () => {
    if (!slide.category || !shouldShow("showCategory") || isHidden(slide, "category")) return null;
    return (
      <span data-element="category" onClick={eClick("category")} style={{
        ...elementStyle(slide, "category"),
        fontSize: catSize, color: accentColor, fontWeight: 600,
        letterSpacing: "0.05em", textTransform: "uppercase",
        marginBottom: isExport ? "16px" : "8px",
        cursor: onElementClick ? "pointer" : undefined,
      }}>{slide.category}</span>
    );
  };

  const renderHighlight = () => {
    if (!slide.highlight || !shouldShow("showHighlight") || isHidden(slide, "highlight")) return null;
    return (
      <span data-element="highlight" onClick={eClick("highlight")} style={{
        ...elementStyle(slide, "highlight"), ...highlightStyle,
        marginBottom: "12px", cursor: onElementClick ? "pointer" : undefined,
      }}>{slide.highlight}</span>
    );
  };

  const renderTitle = (defaultWeight?: number) => (
    <h2 data-element="title" onClick={eClick("title")} style={{
      ...titleStyle, ...elementStyle(slide, "title"),
      fontWeight: typo.titleWeight ?? defaultWeight ?? 700,
      marginBottom: "12px", cursor: onElementClick ? "pointer" : undefined,
    }}>{slide.title}</h2>
  );

  const renderSubtitle = () => {
    if (!slide.subtitle || !shouldShow("showSubtitle") || isHidden(slide, "subtitle")) return null;
    return (
      <p data-element="subtitle" onClick={eClick("subtitle")} style={{
        ...elementStyle(slide, "subtitle"),
        fontSize: subtitleSize, color: secondaryText, lineHeight: 1.5,
        marginBottom: "12px", cursor: onElementClick ? "pointer" : undefined,
      }}>{slide.subtitle}</p>
    );
  };

  const renderBody = () => {
    if (!slide.body || !shouldShow("showBody") || isHidden(slide, "body")) return null;
    return (
      <p data-element="body" onClick={eClick("body")} style={{
        ...bodyStyle, ...elementStyle(slide, "body"),
        whiteSpace: "pre-wrap",
        cursor: onElementClick ? "pointer" : undefined,
      }}>{slide.body}</p>
    );
  };

  const renderSourceLabel = () => {
    if (!slide.sourceLabel || slide.layoutType === "quote" || !shouldShow("showSourceLabel") || isHidden(slide, "sourceLabel")) return null;
    return (
      <div data-element="sourceLabel" onClick={eClick("sourceLabel")} style={{
        ...elementStyle(slide, "sourceLabel"),
        marginTop: "auto", paddingTop: "12px", cursor: onElementClick ? "pointer" : undefined,
      }}>
        <span style={{ fontSize: isExport ? "14px" : "clamp(8px, 2vw, 11px)", color: secondaryText }}>{slide.sourceLabel}</span>
      </div>
    );
  };

  return (
    <div style={containerStyle} className={className}>
      {renderImage()}

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", padding: basePadding, justifyContent: justifyMap[contentAlign] }}
        className={textAlignClass}>

        {renderCategory()}

        {/* Center-title / Cover */}
        {(slide.layoutType === "center-title" || slide.type === "cover") && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: justifyMap[contentAlign], alignItems: slide.textAlign === "left" ? "flex-start" : slide.textAlign === "right" ? "flex-end" : "center", flex: contentAlign !== "start" ? 1 : undefined }}>
            {renderHighlight()}
            {renderTitle(800)}
            {renderSubtitle()}
          </div>
        )}

        {/* Title-body / Title-image */}
        {(slide.layoutType === "title-body" || slide.layoutType === "title-image") && slide.type !== "cover" && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: justifyMap[contentAlign], flex: contentAlign === "center" ? 1 : undefined }}>
            {renderHighlight()}
            {renderTitle()}
            {renderSubtitle()}
            {renderBody()}
            {slide.layoutType === "title-image" && imageUrl && !isHidden(slide, "image") && (
              <div data-element="image" onClick={eClick("image")} style={{ ...elementStyle(slide, "image"), marginTop: "20px", borderRadius: imgBorderRadius, overflow: "hidden", cursor: onElementClick ? "pointer" : undefined }}>
                <img src={imageUrl} alt="" style={{
                  width: "100%", height: "auto", maxHeight: isExport ? "500px" : "40%", objectFit: "cover",
                  transform: `scale(${imgScale})`,
                  filter: imageFilter,
                }} />
              </div>
            )}
          </div>
        )}

        {/* Bullet list */}
        {slide.layoutType === "bullet-list" && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: justifyMap[contentAlign], flex: contentAlign === "center" ? 1 : undefined }}>
            {renderTitle()}
            {shouldShow("showBullets") && !isHidden(slide, "bullets") && (
              <ul data-element="bullets" onClick={eClick("bullets")} style={{ ...elementStyle(slide, "bullets"), listStyle: "none", padding: 0, margin: 0, cursor: onElementClick ? "pointer" : undefined }}>
                {slide.bullets?.map((b, i) => (
                  <li key={i} style={{ fontSize: bulletSize, color: secondaryText, lineHeight: 1.6, padding: "8px 0", borderBottom: `1px solid ${colors.borderColor || theme.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ color: accentColor, fontWeight: 700, fontSize: isExport ? "18px" : "clamp(10px, 2.5vw, 14px)", minWidth: "24px" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>{b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Quote */}
        {slide.layoutType === "quote" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: isExport ? "80px" : "clamp(30px, 10vw, 60px)", color: accentColor, lineHeight: 1, marginBottom: "16px" }}>"</span>
            <p data-element="body" onClick={eClick("body")} style={{
              ...titleStyle, ...elementStyle(slide, "body"),
              fontWeight: 600, fontStyle: "italic", maxWidth: "90%", lineHeight: 1.5,
              cursor: onElementClick ? "pointer" : undefined,
            }}>{slide.body || slide.title}</p>
            {slide.sourceLabel && shouldShow("showSourceLabel") && (
              <span data-element="sourceLabel" onClick={eClick("sourceLabel")} style={{
                ...bodyStyle, ...elementStyle(slide, "sourceLabel"),
                marginTop: "20px", cursor: onElementClick ? "pointer" : undefined,
              }}>— {slide.sourceLabel}</span>
            )}
          </div>
        )}

        {/* Timeline */}
        {slide.layoutType === "timeline" && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: justifyMap[contentAlign], flex: contentAlign === "center" ? 1 : undefined }}>
            {renderTitle()}
            {slide.bullets?.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: accentColor }} />
                  {i < (slide.bullets?.length || 0) - 1 && <div style={{ width: "2px", flex: 1, background: theme.border, marginTop: "4px" }} />}
                </div>
                <p style={{ fontSize: bulletSize, color: secondaryText, lineHeight: 1.5, paddingBottom: "8px" }}>{b}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {slide.layoutType === "cta" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            {renderTitle(800)}
            {slide.cta && shouldShow("showCta") && !isHidden(slide, "cta") && (
              <div data-element="cta" onClick={eClick("cta")} style={{
                ...elementStyle(slide, "cta"),
                display: "inline-block", padding: isExport ? "16px 40px" : "10px 24px",
                background: accentColor, color: bg,
                borderRadius: "999px", fontWeight: 600, fontSize: bodySize,
                cursor: onElementClick ? "pointer" : undefined,
              }}>{slide.cta}</div>
            )}
          </div>
        )}

        {/* Image overlay content */}
        {slide.layoutType === "image-overlay" && slide.type !== "cover" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            {renderHighlight()}
            {renderTitle()}
            {renderBody()}
          </div>
        )}

        {renderSourceLabel()}
      </div>

      {/* Logo overlay */}
      {slide.logo?.url && !isHidden(slide, "logo") && (() => {
        const logo = slide.logo!;
        const pos = logo.position || "top-left";
        const marginVal = logo.margin ?? 24;
        const margin = isExport ? `${marginVal}px` : `${(marginVal / width) * 100}%`;
        const logoW = isExport ? `${logo.width ?? 60}px` : `${((logo.width ?? 60) / width) * 100}%`;

        const ovr = getOverride(slide, "logo");
        const posStyle: React.CSSProperties = {
          position: "absolute",
          zIndex: 10,
          opacity: logo.opacity ?? 1,
          transform: ovr.offsetX || ovr.offsetY ? `translate(${ovr.offsetX || 0}px, ${ovr.offsetY || 0}px)` : undefined,
          ...(pos.includes("top") ? { top: margin } : { bottom: margin }),
          ...(pos.includes("left") ? { left: margin } : pos.includes("right") ? { right: margin } : { left: "50%", transform: `translateX(-50%)${ovr.offsetX || ovr.offsetY ? ` translate(${ovr.offsetX || 0}px, ${ovr.offsetY || 0}px)` : ""}` }),
        };

        return (
          <div data-element="logo" onClick={eClick("logo")} style={{
            ...posStyle,
            width: logoW,
            cursor: onElementClick ? "pointer" : undefined,
          }}>
            <img src={logo.url} alt="Logo" style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }} />
          </div>
        );
      })()}
    </div>
  );
}
