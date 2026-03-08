import { THEME_MAP } from "@/lib/themes";
import type { Slide } from "@/types/project";
import { cn } from "@/lib/utils";

interface Props {
  slide: Slide;
  width?: number;
  height?: number;
  className?: string;
  isExport?: boolean;
}

export function SlideRenderer({ slide, width = 1080, height = 1350, className, isExport }: Props) {
  const theme = THEME_MAP[slide.themePreset];
  const scale = isExport ? 1 : 1;

  const containerStyle: React.CSSProperties = {
    width: isExport ? width : "100%",
    height: isExport ? height : "100%",
    aspectRatio: isExport ? undefined : `${width}/${height}`,
    background: theme.background,
    color: theme.primaryText,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif",
  };

  const imageUrl = slide.image?.url;
  const overlayOpacity = slide.image?.overlayOpacity ?? 0.5;
  const imgScale = slide.image?.scale ?? 1;
  const imgBorderRadius = slide.image?.borderRadius ?? 0;

  const textAlignClass = slide.textAlign === "left" ? "text-left" : slide.textAlign === "right" ? "text-right" : "text-center";

  const renderImage = () => {
    if (!imageUrl) return null;
    if (slide.layoutType === "image-overlay") {
      return (
        <>
          <div style={{
            position: "absolute", inset: 0, backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover", backgroundPosition: `${50 + (slide.image?.posX || 0)}% ${50 + (slide.image?.posY || 0)}%`,
            transform: `scale(${imgScale})`, borderRadius: imgBorderRadius,
            filter: slide.image?.blur ? `blur(${slide.image.blur}px)` : undefined,
          }} />
          <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})` }} />
        </>
      );
    }
    return null;
  };

  const basePadding = isExport ? "60px" : "8%";
  const titleSize = isExport ? "42px" : "clamp(18px, 5vw, 28px)";
  const subtitleSize = isExport ? "28px" : "clamp(12px, 3.5vw, 18px)";
  const bodySize = isExport ? "24px" : "clamp(11px, 3vw, 16px)";
  const bulletSize = isExport ? "22px" : "clamp(10px, 2.8vw, 15px)";

  return (
    <div style={containerStyle} className={className}>
      {renderImage()}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", padding: basePadding }}
        className={textAlignClass}>

        {/* Category */}
        {slide.category && (
          <span style={{ fontSize: isExport ? "16px" : "clamp(8px, 2vw, 12px)", color: theme.accent, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: isExport ? "16px" : "8px" }}>
            {slide.category}
          </span>
        )}

        {/* Layout-specific rendering */}
        {(slide.layoutType === "center-title" || slide.type === "cover") && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: slide.textAlign === "left" ? "flex-start" : slide.textAlign === "right" ? "flex-end" : "center" }}>
            {slide.highlight && (
              <span style={{ fontSize: subtitleSize, color: theme.accent, fontWeight: 700, marginBottom: "8px" }}>
                {slide.highlight}
              </span>
            )}
            <h1 style={{ fontSize: titleSize, fontWeight: 800, lineHeight: 1.3, marginBottom: "12px" }}>
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p style={{ fontSize: subtitleSize, color: theme.secondaryText, lineHeight: 1.5 }}>
                {slide.subtitle}
              </p>
            )}
          </div>
        )}

        {(slide.layoutType === "title-body" || slide.layoutType === "title-image") && slide.type !== "cover" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 style={{ fontSize: titleSize, fontWeight: 700, marginBottom: "16px", lineHeight: 1.3 }}>
              {slide.title}
            </h2>
            {slide.body && (
              <p style={{ fontSize: bodySize, color: theme.secondaryText, lineHeight: 1.7 }}>
                {slide.body}
              </p>
            )}
            {slide.layoutType === "title-image" && imageUrl && (
              <div style={{ marginTop: "20px", borderRadius: imgBorderRadius, overflow: "hidden" }}>
                <img src={imageUrl} alt="" style={{ width: "100%", height: "auto", maxHeight: isExport ? "500px" : "40%", objectFit: "cover", transform: `scale(${imgScale})` }} />
              </div>
            )}
          </div>
        )}

        {slide.layoutType === "bullet-list" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 style={{ fontSize: titleSize, fontWeight: 700, marginBottom: "24px", lineHeight: 1.3 }}>
              {slide.title}
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {slide.bullets?.map((b, i) => (
                <li key={i} style={{ fontSize: bulletSize, color: theme.secondaryText, lineHeight: 1.6, padding: "8px 0", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: theme.accent, fontWeight: 700, fontSize: isExport ? "18px" : "clamp(10px, 2.5vw, 14px)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {slide.layoutType === "quote" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: isExport ? "80px" : "clamp(30px, 10vw, 60px)", color: theme.accent, lineHeight: 1, marginBottom: "16px" }}>"</span>
            <p style={{ fontSize: titleSize, fontWeight: 600, lineHeight: 1.5, maxWidth: "90%", fontStyle: "italic" }}>
              {slide.body || slide.title}
            </p>
            {slide.sourceLabel && (
              <span style={{ fontSize: bodySize, color: theme.secondaryText, marginTop: "20px" }}>
                — {slide.sourceLabel}
              </span>
            )}
          </div>
        )}

        {slide.layoutType === "timeline" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 style={{ fontSize: titleSize, fontWeight: 700, marginBottom: "24px" }}>{slide.title}</h2>
            {slide.bullets?.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: theme.accent }} />
                  {i < (slide.bullets?.length || 0) - 1 && (
                    <div style={{ width: "2px", flex: 1, background: theme.border, marginTop: "4px" }} />
                  )}
                </div>
                <p style={{ fontSize: bulletSize, color: theme.secondaryText, lineHeight: 1.5, paddingBottom: "8px" }}>{b}</p>
              </div>
            ))}
          </div>
        )}

        {slide.layoutType === "cta" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <h2 style={{ fontSize: titleSize, fontWeight: 800, marginBottom: "20px", lineHeight: 1.3 }}>
              {slide.title}
            </h2>
            {slide.cta && (
              <div style={{
                display: "inline-block", padding: isExport ? "16px 40px" : "10px 24px",
                background: theme.accent, color: theme.background,
                borderRadius: "999px", fontWeight: 600, fontSize: bodySize,
              }}>
                {slide.cta}
              </div>
            )}
          </div>
        )}

        {slide.layoutType === "image-overlay" && slide.type !== "cover" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <h2 style={{ fontSize: titleSize, fontWeight: 700, marginBottom: "12px", lineHeight: 1.3 }}>
              {slide.title}
            </h2>
            {slide.body && (
              <p style={{ fontSize: bodySize, color: theme.secondaryText, lineHeight: 1.6 }}>{slide.body}</p>
            )}
          </div>
        )}

        {/* Source label */}
        {slide.sourceLabel && slide.layoutType !== "quote" && (
          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            <span style={{ fontSize: isExport ? "14px" : "clamp(8px, 2vw, 11px)", color: theme.secondaryText }}>
              {slide.sourceLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
