import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SLIDE_SCHEMA = {
  type: "function" as const,
  function: {
    name: "create_cardnews",
    description: "Generate a structured card news project with slides",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "프로젝트 제목 (간결하고 임팩트 있게)" },
        themePreset: {
          type: "string",
          enum: ["dark-minimal", "cyan-accent", "editorial-dark", "warm-neutral"],
          description: "테마 프리셋",
        },
        slides: {
          type: "array",
          description: "슬라이드 배열",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["cover", "summary", "detail", "list", "quote", "timeline", "cta"],
              },
              category: { type: "string", description: "카테고리 라벨 (예: AI & INSIGHT)" },
              title: { type: "string", description: "슬라이드 제목" },
              subtitle: { type: "string", description: "부제" },
              highlight: { type: "string", description: "하이라이트 문구" },
              body: { type: "string", description: "본문 텍스트" },
              bullets: {
                type: "array",
                items: { type: "string" },
                description: "불릿 리스트 항목",
              },
              cta: { type: "string", description: "CTA 문구" },
              sourceLabel: { type: "string", description: "출처 라벨" },
              layoutType: {
                type: "string",
                enum: ["center-title", "title-body", "title-image", "image-overlay", "bullet-list", "timeline", "quote", "cta"],
              },
              textAlign: { type: "string", enum: ["left", "center", "right"] },
            },
            required: ["type", "title", "layoutType", "textAlign"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "themePreset", "slides"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceType, content, title, brief } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build brief context for the prompt
    let briefContext = "";
    if (brief) {
      const parts: string[] = [];
      if (brief.projectTitle) parts.push(`프로젝트 제목: ${brief.projectTitle}`);
      if (brief.coreMessage) parts.push(`핵심 메시지: ${brief.coreMessage}`);
      if (brief.goal) parts.push(`목표: ${brief.goal}`);
      if (brief.targetAudience) parts.push(`타깃 독자: ${brief.targetAudience}`);
      if (brief.tone) parts.push(`톤앤매너: ${brief.tone}`);
      if (brief.platform) parts.push(`게시 플랫폼: ${brief.platform}`);
      if (brief.slideCount) parts.push(`희망 슬라이드 수: ${brief.slideCount}장`);
      if (brief.cta) parts.push(`CTA 문구: ${brief.cta}`);
      if (brief.brandKeywords) parts.push(`브랜드 키워드: ${brief.brandKeywords}`);
      if (brief.memo) parts.push(`추가 메모: ${brief.memo}`);
      if (parts.length > 0) {
        briefContext = `\n\n## 제작 브리프\n${parts.join("\n")}`;
      }
    }

    const slideCountInstruction = brief?.slideCount
      ? `정확히 ${brief.slideCount}장의 슬라이드를 생성하세요.`
      : "6~8장의 슬라이드를 생성하세요.";

    const toneInstruction = brief?.tone
      ? `톤앤매너는 "${brief.tone}" 스타일로 작성하세요.`
      : "";

    const ctaInstruction = brief?.cta
      ? `마지막 CTA 슬라이드의 cta 필드에 "${brief.cta}"를 사용하세요.`
      : "";

    const systemPrompt = `당신은 인스타그램용 카드뉴스 전문 작성자이자 카피라이터입니다.
사용자가 제공한 텍스트/URL/뉴스를 분석하여 ${slideCountInstruction}
${toneInstruction}
${ctaInstruction}

## 글쓰기 원칙 (매우 중요!)
- 카드뉴스는 "짧고 임팩트 있는 카피"가 핵심입니다
- 제목(title): 최대 15자 이내. 핵심 키워드만. 긴 문장 절대 금지
- 부제(subtitle): 최대 20자 이내. 제목을 보충하는 한 줄
- 하이라이트(highlight): 핵심 수치나 팩트 한 줄 (예: "전년 대비 23% 감소")
- 본문(body): 2~3문장 이내, 총 80자 이내. 군더더기 없이 핵심만
- 불릿(bullets): 각 항목 15자 이내, 최대 3~4개
- CTA: 10자 이내의 행동 유도 문구
- 모든 텍스트에서 "~입니다", "~합니다" 같은 장황한 서술체 최소화
- 명사형/개조식 문체 선호 (예: "집값 하락세 본격화" > "집값이 하락세로 접어들었습니다")

## 구조 규칙
- 첫 장(cover): 강한 훅이 되는 제목 + category 라벨. body/bullets 불필요
- 두 번째 장(summary): 핵심 3줄 요약. layoutType은 "title-body"
- 중간 장(detail/list): 1장 1메시지. list는 bullets 활용, detail은 body 활용
- 마지막 장(cta): 결론 + CTA 버튼 문구
- category는 영어 대문자로 (예: AI & INSIGHT, ECONOMY & HOUSING)
- 각 슬라이드에 적절한 layoutType 지정
- cover 슬라이드의 layoutType은 반드시 "center-title"
- list 슬라이드의 layoutType은 반드시 "bullet-list"
- quote 슬라이드의 layoutType은 반드시 "quote"
- cta 슬라이드의 layoutType은 반드시 "cta"
- themePreset: 기술=cyan-accent, 트렌드=editorial-dark, 따뜻한=warm-neutral, 미니멀=dark-minimal`;

    const userPrompt = `${title ? `제목: ${title}\n` : ""}소스 타입: ${sourceType}\n\n내용:\n${content}${briefContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [SLIDE_SCHEMA],
        tool_choice: { type: "function", function: { name: "create_cardnews" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI 크레딧이 부족합니다." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI 생성에 실패했습니다." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "create_cardnews") {
      console.error("Unexpected response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI 응답 형식이 올바르지 않습니다." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cardnews error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
