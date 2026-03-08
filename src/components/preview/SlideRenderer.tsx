import { THEME_MAP } from "@/lib/themes";
import type { Slide } from "@/types/project";

interface Props {
  slide: Slide;
  width?: number;
  height?: number;
  className?: string;
  isExport?: boolean;
}

const GRADIENT_MAP: Record<string, string> = {
  "none": "",
  "dark-fade": "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)",
  "primary-glow": "radial-gradient(ellipse at 30% 80%, rgba(57,210,192,0.15) 0%, transparent 70%)",
  "warm-sunset": "linear-gradient(135deg, rgba(193,127,89,0.2) 0%, rgba(0,0,0,0.6) 100%)",
  "cool-ocean": "linear-gradient(180deg, rgba(0,100,150,0.2) 0%, rgba(0,0,0,0.7) 100%)",
  "purple-haze": "linear-gradient(135deg, rgba(120,50,180,0.2) 0%, rgba(0,0,0,0.6) 100%)",
};

export function SlideRenderer({ slide, width = 1080, height = 1350, className, isExport }: Props) {
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
    fontFamily: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif",
    borderRadius: colors.containerRadius ? `${colors.containerRadius}px` : undefined,
    border: colors.borderEnabled ? `1px solid ${colors.borderColor || theme.border}` : undefined,
    boxShadow: colors.shadowIntensity
      ? `0 ${4 + colors.shadowIntensity * 20}px ${10 + colors.shadowIntensity * 40}px rgba(0,0,0,${colors.shadowIntensity * 0.5})`
      : undefined,
  };

  const imageUrl = slide.image?.url;
  const overlayOpacity = slide.image?.overlayOpacity ?? 0.5;
  const imgScale = slide.image?.scale ?? 1;
  const imgBorderRadius = slide.image?.borderRadius ?? 0;

  const textAlignClass = slide.textAlign === "left" ? "text-left" : slide.textAlign === "right" ? "text-right" : "text-center";
  const justifyMap = { start: "flex-start", center: "center", end: "flex-end" };

  // Font sizes - responsive or export
  const titleSize = isExport ? `${(typo.titleSize ?? 28) * 1.5}px` : `clamp(16px, 4.5vw, ${typo.titleSize ?? 28}px)`;
  const subtitleSize = isExport ? `${(typo.bodySize ?? 16) * 1.3}px` : `clamp(11px, 3vw, ${(typo.bodySize ?? 16) + 2}px)`;
  const bodySize = isExport ? `${(typo.bodySize ?? 16) * 1.5}px` : `clamp(10px, 2.8vw, ${typo.bodySize ?? 16}px)`;
  const bulletSize = isExport ? `${(typo.bodySize ?? 16) * 1.4}px` : `clamp(10px, 2.6vw, ${(typo.bodySize ?? 16) - 1}px)`;
  const catSize = isExport ? "16px" : "clamp(8px, 2vw, 12px)";

  const basePadding = isExport ? `${paddingY * 6}px ${paddingX * 6}px` : `${paddingY}% ${paddingX}%`;

  const renderImage = () => {
    if (!imageUrl) return null;
    if (slide.layoutType === "image-overlay") {
      return (
        <>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: `${50 + (slide.image?.posX || 0)}% ${50 + (slide.image?.posY || 0)}%`,
            transform: `scale(${imgScale})`,
            borderRadius: imgBorderRadius,
            filter: [
              slide.image?.blur ? `blur(${slide.image.blur}px)` : "",
              slide.image?.brightness !== undefined && slide.image.brightness !== 1 ? `brightness(${slide.image.brightness})` : "",
            ].filter(Boolean).join(" ") || undefined,
          }} />
          <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})` }} />
        </>
      );
    }
    return null;
  };

  const shouldShow = (key: keyof typeof vis) => vis[key] !== false;

  const titleStyle: React.CSSProperties = {
    fontSize: titleSize,
    fontWeight: typo.titleWeight ?? 700,
    lineHeight: typo.titleLineHeight ?? 1.3,
    letterSpacing: typo.titleLetterSpacing ? `${typo.titleLetterSpacing}em` : undefined,
    maxWidth: titleBoxWidth < 100 ? `${titleBoxWidth}%` : undefined,
    color: textColor,
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: bodySize,
    fontWeight: typo.bodyWeight ?? 400,
    lineHeight: typo.bodyLineHeight ?? 1.7,
    letterSpacing: typo.bodyLetterSpacing ? `${typo.bodyLetterSpacing}em` : undefined,
    color: secondaryText,
  };

  const highlightStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "4px",
    background: colors.highlightBg || accentColor,
    color: colors.highlightText || bg,
    fontWeight: 700,
    fontSize: subtitleSize,
  };

  return (
    <div style={containerStyle} className={className}>
      {renderImage()}

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", padding: basePadding, justifyContent: justifyMap[contentAlign] }}
        className={textAlignClass}>

        {/* Category */}
        {slide.category && shouldShow("showCategory") && (
          <span style={{ fontSize: catSize, color: accentColor, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: isExport ? "16px" : "8px" }}>
            {slide.category}
          </span>
        )}

        {/* Center-title / Cover */}
        {(slide.layoutType === "center-title" || slide.type === "cover") && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: justifyMap[contentAlign], alignItems: slide.textAlign === "left" ? "flex-start" : slide.textAlign === "right" ? "flex-end" : "center", flex: contentAlign === "center" ? 1 : undefined }}>
            {slide.highlight && shouldShow("showHighlight") && (
              <span style={{ ...highlightStyle, marginBottom: "12px" }}>{slide.highlight}</span>
            )}
            <h1 style={{ ...titleStyle, fontWeight: typo.titleWeight ?? 800, marginBottom: "12px" }}>{slide.title}</h1>
            {slide.subtitle && shouldShow("showSubtitle") && (
              <p style={{ fontSize: subtitleSize, color: secondaryText, lineHeight: 1.5 }}>{slide.subtitle}</p>
            )}
          </div>
        )}

        {/* Title-body */}
        {(slide.layoutType === "title-body" || slide.layoutType === "title-image") && slide.type !== "cover" && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: justifyMap[contentAlign], flex: contentAlign === "center" ? 1 : undefined }}>
            {slide.highlight && shouldShow("showHighlight") && (
              <span style={{ ...highlightStyle, marginBottom: "12px" }}>{slide.highlight}</span>
            )}
            <h2 style={{ ...titleStyle, marginBottom: "16px" }}>{slide.title}</h2>
            {slide.subtitle && shouldShow("showSubtitle") && (
              <p style={{ fontSize: subtitleSize, color: secondaryText, lineHeight: 1.5, marginBottom: "12px" }}>{slide.subtitle}</p>
            )}
            {slide.body && shouldShow("showBody") && (
              <p style={bodyStyle}>{slide.body}</p>
            )}
            {slide.layoutType === "title-image" && imageUrl && (
              <div style={{ marginTop: "20px", borderRadius: imgBorderRadius, overflow: "hidden" }}>
                <img src={imageUrl} alt="" style={{
                  width: "100%", height: "auto", maxHeight: isExport ? "500px" : "40%", objectFit: "cover",
                  transform: `scale(${imgScale})`,
                  filter: slide.image?.brightness !== undefined && slide.image.brightness !== 1 ? `brightness(${slide.image.brightness})` : undefined,
                }} />
              </div>
            )}
          </div>
        )}

        {/* Bullet list */}
        {slide.layoutType === "bullet-list" && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: justifyMap[contentAlign], flex: contentAlign === "center" ? 1 : undefined }}>
            <h2 style={{ ...titleStyle, marginBottom: "24px" }}>{slide.title}</h2>
            {shouldShow("showBullets") && (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {slide.bullets?.map((b, i) => (
                  <li key={i} style={{ fontSize: bulletSize, color: secondaryText, lineHeight: 1.6, padding: "8px 0", borderBottom: `1px solid ${colors.borderColor || theme.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ color: accentColor, fontWeight: 700, fontSize: isExport ? "18px" : "clamp(10px, 2.5vw, 14px)", minWidth: "24px" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {b}
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
            <p style={{ ...titleStyle, fontWeight: 600, fontStyle: "italic", maxWidth: "90%", lineHeight: 1.5 }}>
              {slide.body || slide.title}
            </p>
            {slide.sourceLabel && shouldShow("showSourceLabel") && (
              <span style={{ ...bodyStyle, marginTop: "20px" }}>— {slide.sourceLabel}</span>
            )}
          </div>
        )}

        {/* Timeline */}
        {slide.layoutType === "timeline" && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: justifyMap[contentAlign], flex: contentAlign === "center" ? 1 : undefined }}>
            <h2 style={{ ...titleStyle, marginBottom: "24px" }}>{slide.title}</h2>
            {slide.bullets?.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: accentColor }} />
                  {i < (slide.bullets?.length || 0) - 1 && (
                    <div style={{ width: "2px", flex: 1, background: theme.border, marginTop: "4px" }} />
                  )}
                </div>
                <p style={{ fontSize: bulletSize, color: secondaryText, lineHeight: 1.5, paddingBottom: "8px" }}>{b}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {slide.layoutType === "cta" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <h2 style={{ ...titleStyle, fontWeight: 800, marginBottom: "20px" }}>{slide.title}</h2>
            {slide.cta && shouldShow("showCta") && (
              <div style={{
                display: "inline-block", padding: isExport ? "16px 40px" : "10px 24px",
                background: accentColor, color: bg,
                borderRadius: "999px", fontWeight: 600, fontSize: bodySize,
              }}>
                {slide.cta}
              </div>
            )}
          </div>
        )}

        {/* Image overlay content */}
        {slide.layoutType === "image-overlay" && slide.type !== "cover" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            {slide.highlight && shouldShow("showHighlight") && (
              <span style={{ ...highlightStyle, marginBottom: "12px", alignSelf: "flex-start" }}>{slide.highlight}</span>
            )}
            <h2 style={{ ...titleStyle, marginBottom: "12px" }}>{slide.title}</h2>
            {slide.body && shouldShow("showBody") && (
              <p style={bodyStyle}>{slide.body}</p>
            )}
          </div>
        )}

        {/* Source label */}
        {slide.sourceLabel && slide.layoutType !== "quote" && shouldShow("showSourceLabel") && (
          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            <span style={{ fontSize: isExport ? "14px" : "clamp(8px, 2vw, 11px)", color: secondaryText }}>
              {slide.sourceLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
