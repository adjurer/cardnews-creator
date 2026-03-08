import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SLIDE_TOOL = {
  type: "function" as const,
  function: {
    name: "update_slide",
    description: "Generate or rewrite a single card news slide",
    parameters: {
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
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, slide, projectTitle, allSlides, instruction } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (mode === "rewrite") {
      systemPrompt = `당신은 인스타그램 카드뉴스 편집 전문가입니다.
현재 슬라이드의 내용을 더 좋게 다시 작성합니다.
- 한국어로 작성
- 모바일 가독성 우선
- 한 슬라이드에 적절한 양의 텍스트
- 기존 type과 layoutType은 유지`;

      userPrompt = `프로젝트: ${projectTitle}
현재 슬라이드: ${JSON.stringify(slide)}
${instruction ? `요청사항: ${instruction}` : "이 슬라이드의 텍스트를 더 임팩트 있게 다시 써주세요."}`;
    } else {
      // "improve" mode
      systemPrompt = `당신은 인스타그램 카드뉴스 편집 전문가입니다.
사용자의 요청에 따라 슬라이드를 수정합니다.`;

      userPrompt = `프로젝트: ${projectTitle}
전체 슬라이드 맥락: ${JSON.stringify(allSlides?.map((s: any) => ({ type: s.type, title: s.title })))}
수정 대상 슬라이드: ${JSON.stringify(slide)}
요청: ${instruction || "더 좋게 개선해주세요"}`;
    }

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
        tools: [SLIDE_TOOL],
        tool_choice: { type: "function", function: { name: "update_slide" } },
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

      return new Response(JSON.stringify({ error: "슬라이드 재생성에 실패했습니다." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "update_slide") {
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
    console.error("regenerate-slide error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
