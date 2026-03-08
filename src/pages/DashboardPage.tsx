import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/useProjectStore";
import { Plus, Copy, Trash2, FolderOpen } from "lucide-react";
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
    <div className="h-full overflow-auto p-8 scrollbar-thin">
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">작업 목록</h1>
            <p className="text-sm text-muted-foreground mt-1">카드뉴스 프로젝트를 관리하세요</p>
          </div>
          <button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            새 카드뉴스 만들기
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 glass-panel">
            <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">프로젝트가 없습니다</h2>
            <p className="text-sm text-muted-foreground mb-6">새 카드뉴스를 만들어보세요</p>
            <button
              onClick={() => navigate("/create")}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              시작하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/editor/${project.id}`)}
                className="group glass-panel p-4 cursor-pointer hover:border-primary/40 transition-all"
              >
                {/* Thumbnail placeholder */}
                <div className="aspect-[4/3] rounded-lg bg-surface mb-3 flex items-center justify-center overflow-hidden">
                  <span className="text-3xl font-bold text-muted-foreground/30">
                    {project.slides.length}장
                  </span>
                </div>

                <h3 className="font-medium text-foreground text-sm truncate">{project.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_COLORS[project.status])}>
                    {STATUS_LABELS[project.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(project.updatedAt)}
                  </span>
                </div>

                {/* Quick actions */}
                <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDuplicate(project.id, e)}
                    className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground"
                    title="복제"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
