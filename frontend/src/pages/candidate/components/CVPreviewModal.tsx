import { X, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { apiClient } from "@/lib/axios";
interface CVPreviewModalProps {
  url: string | null;
  onClose: () => void;
}

export function CVPreviewModal({ url, onClose }: CVPreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (url) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [url]);

  useEffect(() => {
    if (!url) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, url]);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      setError(false);
      return;
    }

    let isMounted = true;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(false);

    // Fetch PDF via configured axios to auto-attach token and bypass IDM
    apiClient.get(url, { 
      responseType: "arraybuffer",
      headers: {
        Accept: "application/pdf",
      }
    })
      .then((res: { data: ArrayBuffer }) => {
        if (!isMounted) return;
        const pdfBlob = new Blob([res.data], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(pdfBlob);
        setBlobUrl(objectUrl);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Xem trước CV</h2>
            {error && <span className="text-sm text-red-500 ml-2">(Không thể tải CV)</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              disabled={!blobUrl}
              onClick={() => blobUrl && window.open(blobUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="w-4 h-4" />
              Mở tab mới
            </Button>
            <button 
              onClick={onClose}
              aria-label="Đóng xem trước CV"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content (Iframe) */}
        <div className="flex-1 w-full h-full bg-gray-100 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500">Đang tải CV...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
              <p className="text-gray-600 mb-4">Không thể tải PDF. Trình duyệt có thể đang bị phần mềm IDM chặn.</p>
              {blobUrl ? (
                <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Tải xuống trực tiếp
                </a>
              ) : (
                <span className="text-sm text-gray-500">Vui lòng thử lại sau.</span>
              )}
            </div>
          )}
          {blobUrl && (
            <object 
              data={`${blobUrl}#toolbar=0`} 
              type="application/pdf"
              className="absolute inset-0 w-full h-full border-0"
              title="CV Preview"
            >
              <div className="flex flex-col items-center justify-center h-full bg-white">
                <p className="text-gray-600 mb-4">Trình duyệt của bạn không hỗ trợ xem trực tiếp PDF.</p>
                <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Nhấn vào đây để tải/xem ở tab mới
                </a>
              </div>
            </object>
          )}
        </div>
      </div>
    </div>
  );
}
