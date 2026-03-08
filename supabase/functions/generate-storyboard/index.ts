import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORYBOARD_SCHEMA = {
  type: "function" as const,
  function: {
    name: "create_storyboard",
    description: "Generate a short-form video storyboard from card news slides",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "영상 전체 컨셉 요약 (1~2문장)" },
        totalDurationSec: { type: "number", description: "총 영상 길이(초), 30~60초 권장" },
        bgmSuggestion: { type: "string", description: "추천 배경음악 스타일 (예: 트렌디한 일렉트로닉, 차분한 피아노)" },
        scenes: {
          type: "array",
          description: "각 슬라이드에 대응하는 씬 배열",
          items: {
            type: "object",
            properties: {
              slideIndex: { type: "number", description: "원본 슬라이드 인덱스 (0부터)" },
              durationSec: { type: "number", description: "이 씬의 재생 시간(초)" },
              motion: {
                type: "string",
                enum: ["fade-in", "zoom-in", "zoom-out", "slide-left", "slide-right", "slide-up", "ken-burns", "bounce-in", "typewriter", "split-reveal", "none"],
                description: "주요 모션 애니메이션",
              },
              motionDetail: { type: "string", description: "모션 상세 설명 (예: 제목이 왼쪽에서 슬라이드, 0.3초 후 본문 페이드인)" },
              transition: {
                type: "string",
                enum: ["cut", "crossfade", "wipe-left", "wipe-up", "zoom-transition", "morph", "glitch", "none"],
                description: "다음 씬으로의 전환 효과",
              },
              textAnimation: { type: "string", description: "텍스트 등장 애니메이션 설명" },
              narration: { type: "string", description: "이 씬의 나레이션 스크립트 (TTS용)" },
              visualNote: { type: "string", description: "추가 시각 연출 메모 (이모지, 효과음 타이밍 등)" },
              emphasis: {
                type: "array",
                items: { type: "string" },
                description: "강조할 키워드 목록",
              },
            },
            required: ["slideIndex", "durationSec", "motion", "motionDetail", "transition", "narration"],
            additionalProperties: false,
          },
        },
      },
      required: ["summary", "totalDurationSec", "bgmSuggestion", "scenes"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectTitle, slides, targetPlatform, tone } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const slidesSummary = slides.map((s: any, i: number) => {
      const parts = [`[슬라이드 ${i + 1}] 타입: ${s.type}, 제목: "${s.title}"`];
      if (s.subtitle) parts.push(`부제: "${s.subtitle}"`);
      if (s.body) parts.push(`본문: "${s.body.substring(0, 100)}"`);
      if (s.bullets?.length) parts.push(`불릿: ${s.bullets.join(", ")}`);
      if (s.highlight) parts.push(`하이라이트: "${s.highlight}"`);
      if (s.cta) parts.push(`CTA: "${s.cta}"`);
      return parts.join(" | ");
    }).join("\n");

    const systemPrompt = `당신은 숏폼 영상 전문 스토리보드 디렉터입니다.
카드뉴스 슬라이드를 분석하여 인스타그램 릴스/유튜브 쇼츠/틱톡에 적합한 숏폼 영상 스토리보드를 생성합니다.

규칙:
- 총 영상 길이는 30~60초 (플랫폼: ${targetPlatform || "instagram-reels"})
- 각 씬은 3~8초 (핵심 메시지일수록 길게)
- 첫 2초에 시선을 사로잡는 훅 (강렬한 모션 + 텍스트)
- 나레이션은 자연스러운 한국어, TTS로 읽었을 때 자연스럽게
- 톤: ${tone || "전문적이면서 트렌디"}
- 모션은 슬라이드 내용과 분위기에 맞게 선택
- 전환 효과는 다양하게 믹스하되 일관성 유지
- 텍스트 애니메이션은 구체적으로 설명 (어떤 텍스트가 어떻게 등장하는지)
- 강조 키워드를 통해 동적 타이포그래피 효과 힌트 제공
- 마지막 씬은 CTA와 함께 여운 있게 마무리`;

    const userPrompt = `프로젝트: "${projectTitle}"

슬라이드 내용:
${slidesSummary}

이 카드뉴스를 숏폼 영상 스토리보드로 변환해주세요.`;

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
        tools: [STORYBOARD_SCHEMA],
        tool_choice: { type: "function", function: { name: "create_storyboard" } },
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

      return new Response(JSON.stringify({ error: "스토리보드 생성에 실패했습니다." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "create_storyboard") {
      console.error("Unexpected response:", JSON.stringify(data));
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
    console.error("generate-storyboard error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
