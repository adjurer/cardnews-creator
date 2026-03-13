import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SLIDES_TOOL = {
  type: "function" as const,
  function: {
    name: "rewrite_project",
    description: "Rewrite or restructure the entire card news project slides",
    parameters: {
      type: "object",
      properties: {
        slides: {
          type: "array",
          description: "재구성된 슬라이드 배열",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["cover", "summary", "detail", "list", "quote", "timeline", "cta"],
              },
              category: { type: "string" },
              title: { type: "string" },
              subtitle: { type: "string" },
              highlight: { type: "string" },
              body: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
              cta: { type: "string" },
              sourceLabel: { type: "string" },
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
      required: ["slides"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectTitle, slides, instruction } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `당신은 인스타그램 카드뉴스 카피라이터입니다.
사용자의 요청에 따라 전체 프로젝트의 슬라이드를 재구성합니다.

글쓰기 원칙:
- 제목 15자 이내, 본문 80자 이내, 불릿 각 15자 이내
- 군더더기 없는 개조식/명사형 문체 선호
- 모바일 가독성 우선

구조 규칙:
- 첫 장은 cover(layoutType: center-title), 마지막 장은 cta(layoutType: cta) 유지
- list 타입은 layoutType: bullet-list, quote는 layoutType: quote
- 요청에 슬라이드 수 변경이 있으면 반영
- 요청에 톤 변경이 있으면 전체에 일관되게 적용
- category는 영어 대문자`;

    const slideSummary = slides.map((s: any, i: number) =>
      `[${i + 1}] ${s.type}: ${s.title} ${s.body ? `- ${s.body.substring(0, 50)}` : ""}`
    ).join("\n");

    const userPrompt = `프로젝트: ${projectTitle}
현재 슬라이드 (${slides.length}장):
${slideSummary}

요청: ${instruction}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [SLIDES_TOOL],
        tool_choice: { type: "function", function: { name: "rewrite_project" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI 크레딧이 부족합니다." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "프로젝트 재구성에 실패했습니다." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "rewrite_project") {
      return new Response(JSON.stringify({ error: "AI 응답 형식이 올바르지 않습니다." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rewrite-project error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
