import { Project } from "@/types/project";
import { generateId } from "@/lib/utils/helpers";
import type { Slide } from "@/types/project";

const makeSlide = (partial: Partial<Slide>): Slide => ({
  id: generateId(),
  type: "detail",
  title: "",
  layoutType: "title-body",
  textAlign: "center",
  themePreset: "cyan-accent",
  ...partial,
});

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    title: "AI 브라우저의 등장과 Chrome의 미래",
    sourceType: "text",
    createdAt: "2025-12-01T10:00:00Z",
    updatedAt: "2025-12-05T14:30:00Z",
    status: "generated",
    themePreset: "cyan-accent",
    exportPreset: { format: "png", size: "1080x1350" },
    metadata: { tags: ["AI", "브라우저", "기술"] },
    slides: [
      makeSlide({ type: "cover", title: "AI 브라우저의 등장", subtitle: "Chrome의 시대는 끝나는가?", layoutType: "center-title", themePreset: "cyan-accent" }),
      makeSlide({ type: "summary", title: "핵심 요약", body: "AI 기반 브라우저가 기존 웹 브라우저의 패러다임을 바꾸고 있습니다.", layoutType: "title-body" }),
      makeSlide({ type: "detail", title: "검색의 변화", body: "키워드 검색에서 대화형 질의로 전환되고 있습니다.", layoutType: "title-body" }),
      makeSlide({ type: "detail", title: "생산성 혁신", body: "웹 페이지 요약, 자동 번역, 콘텐츠 추출이 브라우저 내장 기능이 됩니다.", layoutType: "title-body" }),
      makeSlide({ type: "list", title: "주요 AI 브라우저", bullets: ["Arc Browser", "Brave Leo", "Opera Aria", "SigmaOS"], layoutType: "bullet-list" }),
      makeSlide({ type: "detail", title: "Chrome의 대응", body: "구글도 Gemini를 Chrome에 통합하며 반격에 나섰습니다.", layoutType: "title-image" }),
      makeSlide({ type: "cta", title: "당신의 브라우저는?", cta: "새로운 브라우저를 경험해보세요", layoutType: "cta" }),
    ],
  },
  {
    id: "proj-2",
    title: "퇴사 3일 만에 구독자 100만",
    sourceType: "news",
    createdAt: "2025-11-20T09:00:00Z",
    updatedAt: "2025-11-22T11:00:00Z",
    status: "exported",
    themePreset: "editorial-dark",
    exportPreset: { format: "png", size: "1080x1350" },
    slides: [
      makeSlide({ type: "cover", title: "퇴사 3일 만에", subtitle: "구독자 100만 달성한 비결", layoutType: "center-title", themePreset: "editorial-dark" }),
      makeSlide({ type: "summary", title: "어떻게 가능했을까?", body: "평범한 직장인이 유튜브에서 100만 구독자를 달성한 전략을 분석합니다.", layoutType: "title-body", themePreset: "editorial-dark" }),
      makeSlide({ type: "detail", title: "콘텐츠 전략", body: "퇴사 전부터 6개월간 준비한 콘텐츠 파이프라인이 핵심이었습니다.", layoutType: "title-body", themePreset: "editorial-dark" }),
      makeSlide({ type: "quote", title: "본인의 말", body: "\"회사를 다니면서 매일 1시간씩 영상을 만들었습니다.\"", layoutType: "quote", themePreset: "editorial-dark" }),
      makeSlide({ type: "list", title: "성공 요인 5가지", bullets: ["일관된 업로드", "트렌드 분석", "짧은 포맷", "강한 썸네일", "커뮤니티 소통"], layoutType: "bullet-list", themePreset: "editorial-dark" }),
      makeSlide({ type: "cta", title: "당신도 시작할 수 있습니다", cta: "지금 바로 첫 영상을 올려보세요", layoutType: "cta", themePreset: "editorial-dark" }),
    ],
  },
  {
    id: "proj-3",
    title: "인간 최후의 승리, 2016년 3월",
    sourceType: "example",
    createdAt: "2025-11-15T08:00:00Z",
    updatedAt: "2025-11-15T08:00:00Z",
    status: "draft",
    themePreset: "dark-minimal",
    exportPreset: { format: "png", size: "1080x1350" },
    slides: [
      makeSlide({ type: "cover", title: "인간 최후의 승리", subtitle: "2016년 3월, 이세돌 vs AlphaGo", layoutType: "center-title", themePreset: "dark-minimal" }),
      makeSlide({ type: "detail", title: "4국의 기적", body: "모두가 패배를 예상한 그 순간, 이세돌은 78수의 신의 한 수를 두었습니다.", layoutType: "title-body", themePreset: "dark-minimal" }),
      makeSlide({ type: "cta", title: "인간의 가능성", cta: "AI 시대에도 인간만의 창의성은 빛납니다", layoutType: "cta", themePreset: "dark-minimal" }),
    ],
  },
  {
    id: "proj-4",
    title: "2025 콘텐츠 마케팅의 변화",
    sourceType: "feed",
    createdAt: "2025-12-10T07:00:00Z",
    updatedAt: "2025-12-12T16:00:00Z",
    status: "generated",
    themePreset: "warm-neutral",
    exportPreset: { format: "png", size: "1080x1080" },
    slides: [
      makeSlide({ type: "cover", title: "2025 콘텐츠 마케팅", subtitle: "무엇이 달라지는가", layoutType: "center-title", themePreset: "warm-neutral" }),
      makeSlide({ type: "list", title: "주요 트렌드", bullets: ["숏폼 → 미드폼", "AI 자동 생성", "인터랙티브 콘텐츠", "개인화 피드"], layoutType: "bullet-list", themePreset: "warm-neutral" }),
      makeSlide({ type: "cta", title: "마케팅 전략을 바꾸세요", cta: "지금이 전환의 적기입니다", layoutType: "cta", themePreset: "warm-neutral" }),
    ],
  },
  {
    id: "proj-5",
    title: "PM이 스타트업에서 일하는 법",
    sourceType: "text",
    createdAt: "2025-12-08T12:00:00Z",
    updatedAt: "2025-12-09T09:00:00Z",
    status: "generated",
    themePreset: "mono-contrast",
    exportPreset: { format: "png", size: "1080x1350" },
    slides: [
      makeSlide({ type: "cover", title: "스타트업 PM의 하루", subtitle: "모든 것을 해야 하는 사람", layoutType: "center-title", themePreset: "mono-contrast" }),
      makeSlide({ type: "detail", title: "역할의 범위", body: "스타트업 PM은 기획, 디자인, QA, 고객 응대까지 모두 담당합니다.", layoutType: "title-body", themePreset: "mono-contrast" }),
      makeSlide({ type: "cta", title: "PM으로 성장하기", cta: "체계적인 프레임워크를 만들어보세요", layoutType: "cta", themePreset: "mono-contrast" }),
    ],
  },
  {
    id: "proj-6",
    title: "크리에이터가 생산성 툴을 고르는 기준",
    sourceType: "url",
    createdAt: "2025-12-06T15:00:00Z",
    updatedAt: "2025-12-07T10:00:00Z",
    status: "draft",
    themePreset: "cyan-accent",
    exportPreset: { format: "png", size: "1080x1350" },
    slides: [
      makeSlide({ type: "cover", title: "생산성 툴 선택 가이드", subtitle: "크리에이터를 위한", layoutType: "center-title" }),
      makeSlide({ type: "list", title: "평가 기준", bullets: ["학습 곡선", "자동화 기능", "협업 지원", "가격 대비 성능"], layoutType: "bullet-list" }),
      makeSlide({ type: "cta", title: "최적의 도구를 찾으세요", cta: "비교표를 확인해보세요", layoutType: "cta" }),
    ],
  },
];

export const MOCK_NEWS = [
  { id: "news-1", title: "OpenAI, GPT-5 출시 임박… 멀티모달 성능 대폭 향상", source: "TechCrunch", date: "2025-12-10", category: "AI", summary: "OpenAI가 차세대 모델 GPT-5의 출시를 앞두고 있으며, 이미지와 영상 이해 능력이 크게 향상되었다." },
  { id: "news-2", title: "애플, Vision Pro 2세대 개발 중… 더 가볍고 저렴하게", source: "Bloomberg", date: "2025-12-09", category: "Tech", summary: "애플이 차세대 Vision Pro를 개발 중이며, 무게를 30% 줄이고 가격도 인하할 계획이다." },
  { id: "news-3", title: "유튜브 쇼츠, 3분으로 확장… 크리에이터 반응 엇갈려", source: "The Verge", date: "2025-12-08", category: "Creator", summary: "유튜브가 쇼츠의 최대 길이를 3분으로 늘렸으나, 크리에이터들의 반응은 엇갈리고 있다." },
  { id: "news-4", title: "네이버, AI 검색 '큐(Cue)' 정식 출시", source: "한국경제", date: "2025-12-07", category: "AI", summary: "네이버가 AI 기반 검색 서비스 '큐'를 정식 출시하며 검색 패러다임 전환을 선언했다." },
  { id: "news-5", title: "인스타그램, 텍스트 기반 게시물 강화… 스레드와 통합", source: "Wired", date: "2025-12-06", category: "Marketing", summary: "인스타그램이 텍스트 중심 콘텐츠를 강화하며 스레드와의 연동을 확대한다." },
  { id: "news-6", title: "스타트업 투자 한파 풀리나… 4분기 투자 반등 신호", source: "매일경제", date: "2025-12-05", category: "Tech", summary: "2025년 4분기 스타트업 투자가 반등 조짐을 보이며, AI와 SaaS 분야에 자금이 집중되고 있다." },
  { id: "news-7", title: "클로드 4, 코딩 벤치마크 1위 달성", source: "Anthropic Blog", date: "2025-12-04", category: "AI", summary: "Anthropic의 Claude 4가 주요 코딩 벤치마크에서 1위를 기록하며 개발자 도구 시장에서 주목받고 있다." },
  { id: "news-8", title: "틱톡 Shop, 한국 정식 론칭… 이커머스 판도 변화", source: "조선비즈", date: "2025-12-03", category: "Marketing", summary: "틱톡이 한국에서 커머스 기능을 정식 출시하며 소셜 커머스 경쟁이 본격화되었다." },
];

export const MOCK_FEEDS = [
  {
    id: "feed-1",
    name: "TechInsight 뉴스레터",
    entries: [
      { id: "fe-1", title: "AI가 바꾸는 디자인 워크플로우", date: "2025-12-10", preview: "Figma, Canva 등 디자인 도구에 AI가 통합되면서..." },
      { id: "fe-2", title: "노코드 도구의 한계와 가능성", date: "2025-12-08", preview: "노코드로 MVP를 만들 수 있지만, 확장성에는 한계가..." },
      { id: "fe-3", title: "2025년 프론트엔드 트렌드", date: "2025-12-06", preview: "React Server Components, Astro, Svelte 5 등..." },
    ],
  },
  {
    id: "feed-2",
    name: "크리에이터 이코노미 위클리",
    entries: [
      { id: "fe-4", title: "1인 크리에이터의 수익 다변화 전략", date: "2025-12-09", preview: "광고 수익만으로는 부족한 시대, 멤버십과 디지털 상품으로..." },
      { id: "fe-5", title: "숏폼 콘텐츠 제작 효율화 팁", date: "2025-12-07", preview: "하루 3개의 숏폼을 만들기 위한 워크플로우..." },
    ],
  },
];

export const MOCK_EXAMPLES = [
  {
    id: "example-1",
    title: "AI 시대의 필수 역량 5가지",
    description: "인공지능 시대에 살아남기 위해 갖춰야 할 핵심 스킬을 정리한 카드뉴스",
    slides: [
      makeSlide({ type: "cover", title: "AI 시대의 필수 역량", subtitle: "살아남기 위한 5가지 스킬", layoutType: "center-title" }),
      makeSlide({ type: "summary", title: "왜 지금 준비해야 할까?", body: "AI가 대체하지 못하는 역량을 갖추는 것이 핵심입니다.", layoutType: "title-body" }),
      makeSlide({ type: "detail", title: "1. 비판적 사고", body: "AI의 결과물을 검증하고 판단하는 능력이 중요합니다.", layoutType: "title-body" }),
      makeSlide({ type: "detail", title: "2. 창의적 문제해결", body: "새로운 관점으로 문제를 정의하고 해결하는 능력.", layoutType: "title-body" }),
      makeSlide({ type: "detail", title: "3. 소통과 협업", body: "AI와 사람 모두와 효과적으로 소통하는 능력.", layoutType: "title-body" }),
      makeSlide({ type: "list", title: "4-5. 추가 역량", bullets: ["데이터 리터러시", "적응력과 학습 민첩성"], layoutType: "bullet-list" }),
      makeSlide({ type: "cta", title: "지금 시작하세요", cta: "AI 시대의 경쟁력을 키우세요", layoutType: "cta" }),
    ],
  },
  {
    id: "example-2",
    title: "효과적인 카드뉴스 만들기 가이드",
    description: "인스타그램에서 반응을 이끌어내는 카드뉴스 제작 팁",
    slides: [
      makeSlide({ type: "cover", title: "카드뉴스 제작 가이드", subtitle: "반응을 이끌어내는 비결", layoutType: "center-title", themePreset: "editorial-dark" }),
      makeSlide({ type: "summary", title: "핵심 원칙", body: "첫 장에서 관심을 끌고, 마지막 장에서 행동을 유도하세요.", layoutType: "title-body", themePreset: "editorial-dark" }),
      makeSlide({ type: "list", title: "필수 체크리스트", bullets: ["강한 첫 문장", "한 슬라이드 한 메시지", "시각적 일관성", "명확한 CTA"], layoutType: "bullet-list", themePreset: "editorial-dark" }),
      makeSlide({ type: "detail", title: "디자인 팁", body: "여백을 충분히 주고, 폰트 크기는 모바일 기준으로 설정하세요.", layoutType: "title-body", themePreset: "editorial-dark" }),
      makeSlide({ type: "cta", title: "지금 만들어보세요", cta: "AI 카드뉴스 스튜디오에서 시작하기", layoutType: "cta", themePreset: "editorial-dark" }),
    ],
  },
];

export const MOCK_IMAGE_RESULTS = [
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=500&fit=crop",
];
