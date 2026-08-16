import { useState } from "react";
import {
  Building2,
  Bot,
  Bell,
  Shield,
  Upload,
  Check,
  Copy,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  MapPin,
  Sliders,
  Sparkles,
  Webhook,
  Key,
  Lock,
} from "lucide-react";
import { Button, Input, Card, Badge, PageTransition } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/stores/authStore";
import { useEmployerCompany } from "@/contexts/EmployerCompanyContext";

type SettingsTab = "company" | "ai" | "notifications" | "security";

export function EmployerSettingsPage() {
  const user = useUser();
  const { data: companyContext } = useEmployerCompany();
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [webhookTested, setWebhookTested] = useState(false);

  // Form State: Company
  const [companyName, setCompanyName] = useState(companyContext?.company.name || user?.company_name || "TechCorp VN");
  const [taxCode, setTaxCode] = useState("0109887766");
  const [industry, setIndustry] = useState("Công nghệ thông tin & AI");
  const [scale, setScale] = useState("100-500 nhân viên");
  const [website, setWebsite] = useState("https://techcorp.vn");
  const [address, setAddress] = useState("Tầng 12, Tòa nhà Keangnam Landmark 72, Phạm Hùng, Hà Nội");
  const [contactEmail, setContactEmail] = useState(user?.email || "hr@techcorp.vn");
  const [contactPhone, setContactPhone] = useState("0902123456");
  const [description, setDescription] = useState(
    user?.company_description ||
      "TechCorp VN là tập đoàn công nghệ hàng đầu chuyên cung cấp giải pháp phần mềm doanh nghiệp, hạ tầng Cloud và ứng dụng AI thông minh cho thị trường Việt Nam và khu vực Đông Nam Á."
  );

  // Form State: AI Settings
  const [minMatchThreshold, setMinMatchThreshold] = useState(80);
  const [weightSkills, setWeightSkills] = useState(40);
  const [weightExp, setWeightExp] = useState(30);
  const [weightEdu, setWeightEdu] = useState(15);
  const [weightCulture, setWeightCulture] = useState(15);
  const [autoEmailDraft, setAutoEmailDraft] = useState(true);
  const [autoQuestions, setAutoQuestions] = useState(true);

  // Form State: Notifications
  const [emailOnHighMatch, setEmailOnHighMatch] = useState(true);
  const [interviewReminder, setInterviewReminder] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.slack.com/services/T00/B00/techcorp-recruitment");

  // Form State: Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [apiKey, setApiKey] = useState("tc_live_9a8b7c6d5e4f3a2b1c0d_sec_2026");

  const totalWeight = weightSkills + weightExp + weightEdu + weightCulture;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateApiKey = () => {
    const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setApiKey(`tc_live_${randomHex}_sec_2026`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestWebhook = () => {
    setWebhookTested(true);
    setTimeout(() => setWebhookTested(false), 3000);
  };

  const TABS = [
    { id: "company" as const, label: "Hồ sơ Doanh nghiệp", icon: Building2 },
    { id: "ai" as const, label: "Cấu hình AI & Matching", icon: Bot },
    { id: "notifications" as const, label: "Thông báo & Webhook", icon: Bell },
    { id: "security" as const, label: "Bảo mật & API Key", icon: Shield },
  ];

  return (
    <PageTransition className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-primary">Cài đặt hệ thống</span>
            <Badge variant="primary" size="sm">Doanh nghiệp</Badge>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản trị & Cấu hình Tuyển dụng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tùy biến hồ sơ công ty, trọng số thuật toán AI Matching và các tích hợp thông báo tự động.
          </p>
        </div>

        <AnimatePresence>
          {savedSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              Đã lưu thay đổi thành công!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <form onSubmit={handleSave}>
        {activeTab === "company" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Branding Header Card */}
            <Card className="p-6 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white border border-gray-200">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-white border-2 border-primary/20 shadow-md flex items-center justify-center text-2xl font-bold text-primary">
                    TC
                  </div>
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Upload className="w-5 h-5 mb-1" />
                    Đổi Logo
                  </button>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-gray-900">{companyName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{industry} · {scale}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-center sm:justify-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {address}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <Upload className="w-4 h-4" /> Tải ảnh bìa văn phòng
                </Button>
              </div>
            </Card>

            {/* General Info Grid */}
            <Card className="p-6 space-y-6">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Thông tin chung Doanh nghiệp
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Tên pháp nhân công ty <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="VD: Công ty Cổ phần TechCorp Việt Nam"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Mã số thuế (MST) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    required
                    placeholder="VD: 0109887766"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Lĩnh vực hoạt động
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="Công nghệ thông tin & AI">Công nghệ thông tin & AI</option>
                    <option value="Fintech & Ngân hàng">Fintech & Ngân hàng</option>
                    <option value="Thương mại điện tử & Logistics">Thương mại điện tử & Logistics</option>
                    <option value="Sản xuất & Tự động hóa">Sản xuất & Tự động hóa</option>
                    <option value="Y tế & Giáo dục">Y tế & Giáo dục</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Quy mô nhân sự
                  </label>
                  <select
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="10-50 nhân viên">10-50 nhân viên</option>
                    <option value="50-100 nhân viên">50-100 nhân viên</option>
                    <option value="100-500 nhân viên">100-500 nhân viên</option>
                    <option value="500-1000 nhân viên">500-1000 nhân viên</option>
                    <option value="Trên 1000 nhân viên">Trên 1000 nhân viên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-gray-400" /> Website chính thức
                  </label>
                  <Input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://company.vn"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> Email nhận thông báo tuyển dụng
                  </label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="tuyendung@company.vn"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Hotline phòng Nhân sự
                  </label>
                  <Input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0901234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> Địa chỉ trụ sở chính
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Địa chỉ số nhà, đường, quận, thành phố"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Giới thiệu tổng quan về Doanh nghiệp & Môi trường làm việc
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Mô tả văn hóa, các sản phẩm chủ lực và phúc lợi nổi bật..."
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button type="submit" className="px-6 shadow-sm">
                  Lưu hồ sơ công ty
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "ai" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* AI Fast Track Rule */}
            <Card className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Ngưỡng Điểm AI Fast-Track (Tự Động Phân Loại)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Hồ sơ ứng viên có điểm AI Matching đạt từ mức này trở lên sẽ được gắn nhãn{" "}
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Được đề xuất</span> và tự động gợi ý lịch phỏng vấn.
                  </p>
                </div>
                <span className="text-2xl font-bold text-primary bg-primary/10 px-3 py-1 rounded-xl">
                  {minMatchThreshold}%
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={minMatchThreshold}
                  onChange={(e) => setMinMatchThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                  <span>50% (Tiêu chuẩn cơ bản)</span>
                  <span>75% (Khuyến nghị)</span>
                  <span>95% (Chỉ lấy xuất sắc)</span>
                </div>
              </div>
            </Card>

            {/* AI Weighting Configuration */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-primary" />
                    Trọng số Thuật toán Phân tích AI Matching
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tùy chỉnh tỷ lệ đóng góp của từng khía cạnh vào tổng điểm tương thích (Tổng = 100%).
                  </p>
                </div>
                <Badge variant={totalWeight === 100 ? "primary" : "default"} size="sm">
                  Tổng: {totalWeight}%
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 p-4 rounded-xl bg-gray-50/70 border border-gray-200/80">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>1. Kỹ năng Chuyên môn (Skills)</span>
                    <span className="text-primary">{weightSkills}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={70}
                    step={5}
                    value={weightSkills}
                    onChange={(e) => setWeightSkills(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-[11px] text-gray-500">Đối chiếu từ khóa kỹ năng trong CV với yêu cầu bài đăng.</p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-gray-50/70 border border-gray-200/80">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>2. Kinh nghiệm Thực chiến (Experience)</span>
                    <span className="text-primary">{weightExp}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={70}
                    step={5}
                    value={weightExp}
                    onChange={(e) => setWeightExp(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-[11px] text-gray-500">Đánh giá số năm làm việc, quy mô dự án và vị trí tương đương.</p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-gray-50/70 border border-gray-200/80">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>3. Học vấn & Chứng chỉ (Education)</span>
                    <span className="text-primary">{weightEdu}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={5}
                    value={weightEdu}
                    onChange={(e) => setWeightEdu(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-[11px] text-gray-500">Bằng đại học, chứng chỉ chuyên ngành (AWS, PMP, IELTS...).</p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-gray-50/70 border border-gray-200/80">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>4. Khớp Văn hóa & Kỹ năng mềm (Culture)</span>
                    <span className="text-primary">{weightCulture}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={5}
                    value={weightCulture}
                    onChange={(e) => setWeightCulture(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-[11px] text-gray-500">Khả năng làm việc nhóm, giao tiếp và sự phù hợp văn hóa công ty.</p>
                </div>
              </div>
            </Card>

            {/* AI Automation Switches */}
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Tự động hóa Tuyển dụng với DeepSeek LLM
              </h3>

              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Tự động soạn sẵn bản nháp Email (Gmail Studio)</p>
                    <p className="text-xs text-gray-500">AI tự động chuẩn bị email mời PV, thư đề nghị nhận việc và thư từ chối.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoEmailDraft}
                    onChange={(e) => setAutoEmailDraft(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Gợi ý bộ câu hỏi phỏng vấn theo JD & CV</p>
                    <p className="text-xs text-gray-500">Tự động trích xuất các kỹ năng cần kiểm chứng và tạo bộ câu hỏi chuyên sâu.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoQuestions}
                    onChange={(e) => setAutoQuestions(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button type="submit" className="px-6 shadow-sm">
                  Lưu cấu hình AI
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Email Notifications */}
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Thông báo qua Email
              </h3>

              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Thông báo khi có ứng viên AI Match cao (≥80%)</p>
                    <p className="text-xs text-gray-500">Gửi email tức thì để HR không bỏ lỡ nhân tài sáng giá.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailOnHighMatch}
                    onChange={(e) => setEmailOnHighMatch(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Nhắc nhở lịch phỏng vấn trước 2 giờ</p>
                    <p className="text-xs text-gray-500">Gửi nhắc nhở kèm link Google Meet/Zoom cho cả HR và Interviewer.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={interviewReminder}
                    onChange={(e) => setInterviewReminder(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Báo cáo tổng kết tuần (Thứ Hai 08:00)</p>
                    <p className="text-xs text-gray-500">Tổng hợp số lượng CV mới, tỷ lệ chuyển đổi vòng và các lịch PV trong tuần.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>
            </Card>

            {/* Webhooks Integration */}
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Webhook className="w-4 h-4 text-primary" />
                    Webhook Tích hợp Hệ thống (Slack / Telegram / ERP)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hệ thống sẽ gửi HTTP POST payload JSON đến URL này mỗi khi có sự kiện ứng tuyển mới.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Webhook Endpoint URL
                </label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-domain.com/api/webhook"
                    className="font-mono text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestWebhook}
                    className="gap-1.5 shrink-0"
                  >
                    {webhookTested ? <Check className="w-4 h-4 text-emerald-600" /> : <RefreshCw className="w-4 h-4" />}
                    {webhookTested ? "Đã gửi test!" : "Gửi Test Ping"}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">Mẫu Payload JSON gửi đi:</p>
                <pre className="text-[11px] font-mono text-gray-600 overflow-x-auto p-2 bg-white rounded border border-gray-200">
{`{
  "event": "candidate.applied",
  "candidate_name": "Nguyễn Văn An",
  "job_title": "Senior Fullstack Engineer",
  "ai_match_score": 96.5,
  "timestamp": "2026-08-16T19:30:00Z"
}`}
                </pre>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button type="submit" className="px-6 shadow-sm">
                  Lưu cấu hình thông báo
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* API Key Management */}
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    Enterprise API Key
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sử dụng khóa này để xác thực khi tích hợp API tuyển dụng vào phần mềm nhân sự nội bộ.
                  </p>
                </div>
                <Badge variant="primary" size="sm">Active · Production</Badge>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  readOnly
                  className="font-mono text-xs bg-gray-50 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyApiKey}
                  className="gap-1.5 shrink-0"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiedKey ? "Đã copy!" : "Sao chép"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRegenerateApiKey}
                  className="gap-1.5 shrink-0 text-red-600 hover:bg-red-50"
                  title="Tạo lại mã mới"
                >
                  <RefreshCw className="w-4 h-4" />
                  Đổi khóa
                </Button>
              </div>
              <p className="text-[11px] text-gray-400">
                Lưu ý: Không chia sẻ API Key cho bên thứ ba không tin cậy. Khi tạo lại khóa, các tích hợp cũ sẽ dừng hoạt động.
              </p>
            </Card>

            {/* Password Change */}
            <Card className="p-6 space-y-5">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Đổi Mật khẩu Quản trị
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="2fa"
                    checked={twoFactorEnabled}
                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="2fa" className="text-xs text-gray-700 font-medium cursor-pointer">
                    Bật xác thực 2 bước (2FA OTP) khi đăng nhập từ thiết bị lạ
                  </label>
                </div>

                <Button type="submit" className="px-6 shadow-sm">
                  Cập nhật bảo mật
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </form>
    </PageTransition>
  );
}
