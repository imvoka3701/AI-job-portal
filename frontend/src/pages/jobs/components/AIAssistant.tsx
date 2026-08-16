import { useState } from "react";
import { Sparkles, X, Send } from "lucide-react";

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-[340px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#E5EAF0] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#0F1B2D] to-[#1a2e4c] p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00B86B]/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#00B86B]" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px]">AI Job Assistant</h3>
                <p className="text-[12px] text-white/70">Sẵn sàng hỗ trợ bạn</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/80" />
            </button>
          </div>

          <div className="h-[320px] p-4 overflow-y-auto bg-page-bg">
            <div className="bg-white border border-[#E5EAF0] p-3 rounded-xl rounded-tl-none shadow-sm text-[14px] text-[#172033] w-[85%] mb-4">
              Xin chào! Tôi có thể giúp bạn tìm công việc phù hợp dựa trên kỹ năng của bạn.
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <button className="px-3 py-2 bg-white border border-[#00B86B]/30 text-[#00B86B] text-[13px] font-medium rounded-lg text-left hover:bg-emerald-50 transition-colors">
                Tìm việc IT tại Hà Nội
              </button>
              <button className="px-3 py-2 bg-white border border-[#00B86B]/30 text-[#00B86B] text-[13px] font-medium rounded-lg text-left hover:bg-emerald-50 transition-colors">
                Gợi ý công việc Remote
              </button>
              <button className="px-3 py-2 bg-white border border-[#00B86B]/30 text-[#00B86B] text-[13px] font-medium rounded-lg text-left hover:bg-emerald-50 transition-colors">
                Phân tích độ phù hợp CV
              </button>
            </div>
          </div>

          <div className="p-3 bg-white border-t border-[#E5EAF0] flex items-center gap-2">
            <input 
              type="text"
              placeholder="Nhắn tin cho AI..." 
              className="flex-1 bg-page-bg border border-[#E5EAF0] h-10 rounded-lg px-3 text-[14px] text-[#172033] outline-none focus:border-[#00B86B]"
            />
            <button className="w-10 h-10 bg-[#00B86B] text-white rounded-lg flex items-center justify-center hover:bg-[#00A35E] transition-colors shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#00B86B] text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
        >
          <Sparkles className="w-6 h-6" />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#0F1B2D] text-white text-[13px] font-medium py-1.5 px-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-md">
            AI Job Assistant
            <div className="absolute top-1/2 -translate-y-1/2 right-[-4px] border-4 border-transparent border-l-[#0F1B2D]"></div>
          </div>
        </button>
      )}
    </div>
  );
}
