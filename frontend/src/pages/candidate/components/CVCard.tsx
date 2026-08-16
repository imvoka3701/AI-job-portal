import { FileText, Trash2, Eye, Loader2, AlertCircle, Zap } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import type { Resume } from "@/types/resume";

interface CVCardProps {
  resume: Resume;
  onDelete: (id: number) => void;
  onPreview: (id: number) => void;
  onEvaluate: (id: number) => void;
  state?: "idle" | "loading" | "error";
  isEvaluating?: boolean;
}

export function CVCard({ resume, onDelete, onPreview, onEvaluate, state = "idle", isEvaluating = false }: CVCardProps) {
  const isReady = !!resume.ai_evaluation_json;

  return (
    <div className={`relative group p-5 bg-white border rounded-xl transition-all duration-300 shadow-sm
      ${state === "error" ? "border-red-200 bg-red-50" : "border-gray-200 hover:border-primary hover:shadow-md"}`}>
      
      {state === "loading" && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl z-10">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors
          ${state === "error" ? "bg-red-100 text-red-600" : "bg-primary-light text-primary-dark group-hover:bg-primary group-hover:text-white"}`}>
          <FileText className="w-6 h-6" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-[15px] font-semibold text-gray-900 truncate" title={resume.title || `CV #${resume.id}`}>
              {resume.title || `CV #${resume.id}`}
            </h3>
            
            {state === "error" ? (
              <Badge variant="danger" size="sm" className="shrink-0 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Lỗi
              </Badge>
            ) : isReady ? (
              <Badge variant="success" size="sm" className="shrink-0">Sẵn sàng AI</Badge>
            ) : (
              <Badge variant="warning" size="sm" className="shrink-0">Đang phân tích...</Badge>
            )}
          </div>
          
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span>Tải lên {new Date(resume.created_at).toLocaleDateString("vi-VN")}</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-2 pt-4 border-t border-gray-100">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 h-9"
          onClick={() => onPreview(resume.id)}
          disabled={!resume.file_url || state !== "idle" || isEvaluating}
        >
          <Eye className="w-4 h-4 mr-2 text-gray-500" />
          Xem CV
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary h-9 font-medium"
          onClick={() => onEvaluate(resume.id)}
          isLoading={isEvaluating}
          disabled={state !== "idle" || isEvaluating}
        >
          {!isEvaluating && <Zap className="w-4 h-4 mr-2 text-primary" />}
          AI Review
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-9 h-9 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
          onClick={() => {
            if (window.confirm("Bạn có chắc chắn muốn xóa CV này?")) {
              onDelete(resume.id);
            }
          }}
          disabled={state !== "idle" || isEvaluating}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
