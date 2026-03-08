import { clearAllData } from "@/lib/persistence/storage";
import { ArrowLeft, Moon, Sun, Monitor, Check, Instagram, Plus, Trash2, Star, Loader2, Type } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useThemeStore, type ThemeMode } from "@/store/useThemeStore";
import { useInstagramStore } from "@/store/useInstagramStore";
import { useAuth } from "@/contexts/AuthContext";
import { useFontStore } from "@/store/useFontStore";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: { mode: ThemeMode; icon: typeof Sun; label: string; desc: string }[] = [
  { mode: "light", icon: Sun, label: "라이트", desc: "밝은 배경" },
  { mode: "dark", icon: Moon, label: "다크", desc: "어두운 배경" },
  { mode: "system", icon: Monitor, label: "시스템", desc: "OS 설정에 따름" },
];

function InstagramAccountManager() {
  const { user } = useAuth();
  const { accounts, loading, fetchAccounts, addAccount, removeAccount, setDefaultAccount } = useInstagramStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [igUserId, setIgUserId] = useState("");
  const [igUsername, setIgUsername] = useState("");
  const [igToken, setIgToken] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user) fetchAccounts();
  }, [user]);

  const handleAdd = async () => {
    if (!igUserId || !igToken) {
      toast.error("User ID와 Access Token을 입력해주세요");
      return;
    }
    setAdding(true);
    await addAccount(igUserId, igUsername || igUserId, igToken);
    setIgUserId("");
    setIgUsername("");
    setIgToken("");
    setShowAddForm(false);
    setAdding(false);
  };

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Instagram className="w-4 h-4" /> Instagram 계정
        </h3>
        <p className="text-xs text-muted-foreground">로그인 후 Instagram 계정을 연결할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Instagram className="w-4 h-4" /> Instagram 계정
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> 계정 추가
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Account list */}
      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface border border-border">
              {acc.profile_picture_url ? (
                <img src={acc.profile_picture_url} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(320,70%,50%)] to-[hsl(30,90%,55%)] flex items-center justify-center">
                  <Instagram className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">@{acc.username}</p>
                <p className="text-[10px] text-muted-foreground">ID: {acc.ig_user_id}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDefaultAccount(acc.id)}
                  title={acc.is_default ? "기본 계정" : "기본 계정으로 설정"}
                  className={cn("p-1.5 rounded-md transition-all", acc.is_default ? "text-warning" : "text-muted-foreground hover:text-foreground")}
                >
                  <Star className={cn("w-3.5 h-3.5", acc.is_default && "fill-current")} />
                </button>
                <button
                  onClick={() => removeAccount(acc.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive transition-all"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {accounts.length === 0 && !loading && !showAddForm && (
        <p className="text-xs text-muted-foreground text-center py-3">
          연결된 Instagram 계정이 없습니다
        </p>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="space-y-2 p-3 rounded-lg bg-surface border border-border">
          <p className="text-[10px] text-muted-foreground mb-2">
            Instagram Business 계정의 User ID와 Access Token을 입력하세요.
            <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener" className="text-primary ml-1 hover:underline">
              Graph API Explorer에서 발급 →
            </a>
          </p>
          <input
            type="text"
            value={igUserId}
            onChange={e => setIgUserId(e.target.value)}
            placeholder="Instagram User ID (예: 17841400...)"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            value={igUsername}
            onChange={e => setIgUsername(e.target.value)}
            placeholder="사용자명 (선택, 자동 가져오기)"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            value={igToken}
            onChange={e => setIgToken(e.target.value)}
            placeholder="Access Token (EAAxxxxxx...)"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowAddForm(false)}
              className="flex-1 py-2 rounded-lg text-xs text-muted-foreground bg-background border border-border hover:text-foreground transition-colors">
              취소
            </button>
            <button onClick={handleAdd} disabled={adding || !igUserId || !igToken}
              className="flex-1 py-2 rounded-lg text-xs bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1 transition-all">
              {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              연결
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FontManagerSettings() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { fonts, loadFonts, addFont, removeFont } = useFontStore();

  useEffect(() => { loadFonts(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await addFont(file);
    if (result) toast.success(`${result.family} 폰트가 추가되었습니다`);
    else toast.error("지원하지 않는 폰트 형식입니다 (.otf, .ttf, .woff2)");
    e.target.value = "";
  };

  const BUILTIN = ["Pretendard Variable", "Freesentation", "Paperlogy", "A2z"];

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground">기본 폰트: {BUILTIN.join(", ")}</p>
      {fonts.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground">업로드한 폰트</span>
          {fonts.map(f => (
            <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border">
              <span className="text-xs font-medium text-foreground" style={{ fontFamily: f.family }}>{f.family}</span>
              <button onClick={() => removeFont(f.id)} className="text-destructive hover:text-destructive/80">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept=".otf,.ttf,.woff2" onChange={handleUpload} className="hidden" />
      <button onClick={() => fileRef.current?.click()}
        className="w-full py-2 rounded-lg border border-dashed border-border hover:border-primary/50 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors">
        <Plus className="w-3.5 h-3.5" /> 폰트 업로드 (.otf, .ttf, .woff2)
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { mode, setMode } = useThemeStore();

  return (
    <div className="h-full overflow-auto p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-md mx-auto animate-fade-in">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> 작업 목록
        </button>

        <h1 className="text-xl font-bold text-foreground mb-6">설정</h1>

        <div className="space-y-4">
          {/* Theme selector */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">테마</h3>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(opt => (
                <button
                  key={opt.mode}
                  onClick={() => setMode(opt.mode)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-xs",
                    mode === opt.mode
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  )}
                >
                  <opt.icon className="w-5 h-5" />
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                  {mode === opt.mode && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Font management */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Type className="w-4 h-4" /> 폰트 관리
            </h3>
            <FontManagerSettings />
          </div>

          {/* Instagram accounts */}
          <InstagramAccountManager />

          {/* Data management */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">데이터 관리</h3>
            <button onClick={() => { clearAllData(); toast.success("모든 데이터가 초기화되었습니다. 새로고침하세요."); }}
              className="w-full py-2 rounded-lg bg-destructive/10 text-sm text-destructive hover:bg-destructive/20 transition-colors">
              모든 데이터 초기화
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-1">AI CardNews Studio</h3>
            <p className="text-xs text-muted-foreground">v1.0.0 · 텍스트를 인스타그램 스타일 카드뉴스로 변환</p>
          </div>
        </div>
      </div>
    </div>
  );
}
