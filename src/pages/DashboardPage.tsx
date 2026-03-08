import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/useProjectStore";
import { Plus, Copy, Trash2, FolderOpen, Layers } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  generated: "생성완료",
  exported: "내보냄",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  generated: "bg-primary/20 text-primary",
  exported: "bg-success/20 text-success",
};

export default function DashboardPage() {
  const { projects, loadProjects, removeProject, copyProject } = useProjectStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeProject(id);
    toast.success("프로젝트가 삭제되었습니다");
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await copyProject(id);
    toast.success("프로젝트가 복제되었습니다");
  };

  return (
    <div className="h-full overflow-auto p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-foreground">작업 목록</h1>
            <p className="text-xs text-muted-foreground mt-1">{projects.length}개의 프로젝트</p>
          </div>
          <button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            새 카드뉴스 만들기
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-base font-medium text-foreground mb-1">프로젝트가 없습니다</h2>
            <p className="text-sm text-muted-foreground mb-6">새 카드뉴스를 만들어보세요</p>
            <button
              onClick={() => navigate("/create")}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              시작하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/editor/${project.id}`)}
                className="group relative rounded-xl border border-border bg-card hover:border-primary/40 cursor-pointer transition-all overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-surface flex items-center justify-center relative">
                  <div className="text-center">
                    <Layers className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
                    <span className="text-lg font-bold text-muted-foreground/40">{project.slides.length}장</span>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => handleDuplicate(project.id, e)}
                      className="p-2 rounded-lg bg-surface/80 text-foreground hover:bg-muted transition-colors"
                      title="복제"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="p-2 rounded-lg bg-surface/80 text-destructive hover:bg-destructive/20 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-medium text-foreground text-sm truncate leading-snug">{project.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", STATUS_COLORS[project.status])}>
                      {STATUS_LABELS[project.status]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(project.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
