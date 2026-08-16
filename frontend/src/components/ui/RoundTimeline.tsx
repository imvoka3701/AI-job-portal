/** Vertical round timeline with schedule form, quick-pick presets, live preview. */

import { useState, useEffect } from "react";
import { getRounds, createRound, updateRound, type RoundItem } from "@/lib/api/rounds";
import { apiClient } from "@/lib/axios";

const ROUND_TYPE_OPTIONS = [
  { value: "cv_screen", label: "Duyệt CV", color: "text-sky-600 bg-sky-50 border-sky-200" },
  { value: "tech", label: "PV Kỹ thuật", color: "text-primary bg-primary-light border-primary/20" },
  { value: "hr", label: "PV HR", color: "text-sky-600 bg-sky-50 border-sky-200" },
  { value: "final", label: "Vòng cuối", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "custom", label: "Khác", color: "text-gray-600 bg-gray-50 border-gray-200" },
];

const QUICK_PICKS = [
  { label: "Ngày mai 9h", days: 1, hour: 9 },
  { label: "Ngày mai 14h", days: 1, hour: 14 },
  { label: "Tuần sau", days: 7, hour: 9 },
];

const STATUS_ICONS: Record<string, string> = {
  passed: "✓", failed: "✗", pending: "○", in_progress: "◉", skipped: "→",
};

interface Props {
  applicationId: number;
}

export function RoundTimeline({ applicationId }: Props) {
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState("tech");
  const [newName, setNewName] = useState("");

  // ── Schedule form state ──────────────────────────────────────────────────
  const [scheduleRoundId, setScheduleRoundId] = useState<number | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedMode, setSchedMode] = useState<"online" | "offline">("online");
  const [schedLocation, setSchedLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Scoring panel ─────────────────────────────────────────────────────────
  const DEFAULT_CRITERIA = ["Kỹ năng chuyên môn", "Kỹ năng giao tiếp", "Kinh nghiệm thực tế", "Thái độ / Tinh thần", "Phù hợp văn hóa"];
  const [scoreRoundId, setScoreRoundId] = useState<number | null>(null);
  const [criteriaScores, setCriteriaScores] = useState<Array<{ criteria_name: string; score: number; notes: string }>>([]);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  const openScoring = async (round: RoundItem) => {
    setScoreRoundId(round.id);
    setScoreSaved(false);
    setScoreLoading(true);
    try {
      const { data } = await apiClient.get(`/rounds/${round.id}/criteria`);
      if (data.length > 0) {
        setCriteriaScores(data.map((c: { criteria_name: string; score: number; notes: string | null }) => ({ criteria_name: c.criteria_name, score: c.score, notes: c.notes || "" })));
      } else {
        setCriteriaScores(DEFAULT_CRITERIA.map((c) => ({ criteria_name: c, score: 5, notes: "" })));
      }
    } catch { setCriteriaScores(DEFAULT_CRITERIA.map((c) => ({ criteria_name: c, score: 5, notes: "" }))); }
    finally { setScoreLoading(false); }
  };

  const handleSaveCriteria = async () => {
    if (!scoreRoundId) return;
    setScoreLoading(true);
    try {
      await apiClient.put(`/rounds/${scoreRoundId}/criteria`, { criteria: criteriaScores });
      setScoreSaved(true);
      // Update local round score
      const avg = Math.round(criteriaScores.reduce((s, c) => s + c.score, 0) / criteriaScores.length);
      setRounds((rs) => rs.map((r) => r.id === scoreRoundId ? { ...r, score: avg } : r));
      setTimeout(() => { setScoreSaved(false); setScoreRoundId(null); }, 1500);
    } catch { /* ignore */ }
    finally { setScoreLoading(false); }
  };

  const fetch = () => {
    setLoading(true); setError(null);
    getRounds(applicationId)
      .then(setRounds)
      .catch(() => setError("Không thể tải danh sách vòng."))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, [applicationId]);

  // ── Optimistic status ────────────────────────────────────────────────────
  const handleStatus = async (roundId: number, status: string, idx: number) => {
    const prev = [...rounds];
    setRounds((rs) => rs.map((r, i) => i === idx ? { ...r, status: status as RoundItem["status"] } : r));
    try { await updateRound(roundId, { status }); }
    catch { setRounds(prev); setError("Cập nhật thất bại."); }
  };

  // ── Add round ────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    try {
      const r = await createRound(applicationId, newType, newName || undefined);
      setRounds((prev) => [...prev, r]); setAdding(false); setNewType("tech"); setNewName("");
    } catch { setError("Không thể tạo vòng mới."); }
  };

  // ── Quick-pick schedule ──────────────────────────────────────────────────
  const applyQuickPick = (days: number, hour: number) => {
    const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0);
    setSchedDate(d.toISOString().slice(0, 10));
    setSchedTime(`${String(hour).padStart(2, "0")}:00`);
  };

  // ── Save schedule ────────────────────────────────────────────────────────
  const handleSaveSchedule = async () => {
    if (!scheduleRoundId || !schedDate || !schedTime) return;
    setSaving(true);
    const iso = new Date(`${schedDate}T${schedTime}:00`).toISOString();
    const loc = schedMode === "online" ? schedLocation || "Online (link sẽ được gửi sau)" : schedLocation;
    try {
      await updateRound(scheduleRoundId, { scheduled_at: iso, location: loc, status: "in_progress" });
      setSaved(true);
      setRounds((rs) => rs.map((r) => r.id === scheduleRoundId ? { ...r, scheduled_at: iso, location: loc, status: "in_progress" } : r));
      setTimeout(() => { setSaved(false); setScheduleRoundId(null); }, 1500);
    } catch { setError("Không thể lưu lịch."); }
    finally { setSaving(false); }
  };

  // Live preview string
  const previewDate = schedDate && schedTime
    ? new Date(`${schedDate}T${schedTime}:00`).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })
    : "";
  const previewTime = schedTime ? `${schedTime.replace(":", "h")}` : "";

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) { return <div className="space-y-3 py-4">{[1,2,3].map(i=><div key={i} className="flex gap-3"><div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse mt-1"/><div className="flex-1 space-y-2"><div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"/><div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse"/></div></div>)}</div>; }
  if (error) { return <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>; }

  const autoRounds = rounds.filter((r) => (r.round_name || "").startsWith("Auto:"));
  const manualRounds = rounds.filter((r) => !(r.round_name || "").startsWith("Auto:"));

  return (
    <div className="space-y-4">
      {manualRounds.length === 0 && !adding && (
        <p className="text-sm text-gray-500 text-center py-4">Chưa có vòng tuyển dụng nào.</p>
      )}

      <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
        {manualRounds.map((r) => {
          const manualIdx = manualRounds.indexOf(r);
          const typeInfo = ROUND_TYPE_OPTIONS.find((t) => t.value === r.round_type) || ROUND_TYPE_OPTIONS[4];
          const isPassed = r.status === "passed";
          const isFailed = r.status === "failed";
          const isCurrent = r.status === "pending" || r.status === "in_progress";
          const isScheduled = !!r.scheduled_at;
          const showSchedule = scheduleRoundId === r.id;

          return (
            <div key={r.id} className="relative animate-[fadeIn_0.3s_ease-out] opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: `${manualIdx * 80}ms` }}>
              <div className={`absolute -left-[1.7rem] w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                isPassed ? "bg-green-500 border-green-500 text-white" : isFailed ? "bg-red-500 border-red-500 text-white" :
                isCurrent ? "bg-amber-100 border-amber-400 text-amber-700" : "bg-gray-100 border-gray-300 text-gray-400"
              }`}>{STATUS_ICONS[r.status] || "○"}</div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                    <span className="ml-2 text-sm font-semibold text-gray-900">{r.round_name || `Vòng ${r.round_number}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isScheduled && (
                      <span className="text-[10px] text-gray-400">
                        {new Date(r.scheduled_at!).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })} {new Date(r.scheduled_at!).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    <button onClick={() => setScheduleRoundId(showSchedule ? null : r.id)} className="text-[10px] text-primary hover:text-primary-hover font-medium">
                      {showSchedule ? "Ẩn" : isScheduled ? "Sửa lịch" : "Đặt lịch"}
                    </button>
                  </div>
                </div>

                {/* Score display + scoring button */}
                {r.score != null && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 rounded-full px-2 py-0.5">
                    Điểm: {r.score}/10
                  </span>
                )}
                <button onClick={() => scoreRoundId === r.id ? setScoreRoundId(null) : openScoring(r)}
                  className="text-[11px] text-primary hover:text-primary-hover font-medium ml-2">
                  {scoreRoundId === r.id ? "Ẩn chấm điểm" : r.score != null ? "Sửa điểm" : "Chấm điểm phỏng vấn"}
                </button>

                {/* Actions */}
                <div className="flex gap-1 mt-3">
                  {(["passed","failed","skipped"] as const).map((s) => (
                    <button key={s} onClick={() => handleStatus(r.id, s, manualIdx)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all active:scale-95 ${
                        r.status===s ? (s==="passed"?"bg-green-500 text-white":s==="failed"?"bg-red-500 text-white":"bg-gray-400 text-white")
                        : s==="passed"?"bg-green-50 text-green-700 hover:bg-green-100":s==="failed"?"bg-red-50 text-red-700 hover:bg-red-100":"bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >{s==="passed"?"✓ Qua":s==="failed"?"✗ Rớt":"→ Bỏ qua"}</button>
                  ))}
                </div>

                {/* Scoring panel */}
                {scoreRoundId === r.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-[fadeIn_0.2s_ease-out]">
                    {scoreLoading ? (
                      <div className="flex justify-center py-4"><span className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
                    ) : (
                      <>
                        {criteriaScores.map((c, ci) => (
                          <div key={c.criteria_name} className="flex items-center gap-3">
                            <label className="text-xs font-medium text-gray-700 w-32 shrink-0">{c.criteria_name}</label>
                            <input type="range" min="0" max="10" value={c.score}
                              onChange={(e) => {
                                const newScores = [...criteriaScores];
                                newScores[ci] = { ...c, score: Number(e.target.value) };
                                setCriteriaScores(newScores);
                              }}
                              className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 accent-blue-600 cursor-pointer" />
                            <span className="text-xs font-bold text-gray-900 w-6 text-right">{c.score}</span>
                          </div>
                        ))}
                        <textarea placeholder="Ghi chú chung cho lần chấm điểm này..."
                          value={criteriaScores[0]?.notes || ""}
                          onChange={(e) => {
                            const ns = [...criteriaScores];
                            if (ns[0]) ns[0] = { ...ns[0], notes: e.target.value };
                            setCriteriaScores(ns);
                          }}
                          className="w-full h-16 rounded-lg border border-gray-200 bg-white text-xs p-2 resize-y" />
                        <button onClick={handleSaveCriteria} disabled={scoreLoading}
                          className={`w-full h-9 rounded-lg text-sm font-medium transition-all ${scoreSaved ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"} disabled:opacity-50`}>
                          {scoreSaved ? "✓ Đã lưu điểm" : "Lưu điểm"}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Schedule form */}
                {showSchedule && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-[fadeIn_0.2s_ease-out]">
                    {/* Quick picks */}
                    <div className="flex gap-1.5 flex-wrap">
                      {QUICK_PICKS.map((qp) => (
                        <button key={qp.label} onClick={() => applyQuickPick(qp.days, qp.hour)} type="button"
                          className="px-2.5 py-1 rounded-full border border-gray-200 text-[11px] text-gray-600 hover:border-blue-300 hover:text-blue-600 bg-white transition-colors"
                        >{qp.label}</button>
                      ))}
                      <button onClick={() => { setSchedDate(""); setSchedTime(""); }} type="button"
                        className="px-2.5 py-1 rounded-full border border-gray-200 text-[11px] text-gray-400 hover:text-gray-600 bg-white transition-colors"
                      >Xóa</button>
                    </div>

                    <div className="flex gap-2">
                      <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)}
                        className="flex-1 h-9 rounded-lg border border-gray-200 bg-white text-sm px-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)}
                        className="w-28 h-9 rounded-lg border border-gray-200 bg-white text-sm px-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>

                    {/* Online/Offline toggle */}
                    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                      <button onClick={() => setSchedMode("online")} type="button"
                        className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${schedMode==="online"?"bg-white text-blue-600 shadow-sm":"text-gray-500 hover:text-gray-700"}`}
                      >📹 Online</button>
                      <button onClick={() => setSchedMode("offline")} type="button"
                        className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${schedMode==="offline"?"bg-white text-blue-600 shadow-sm":"text-gray-500 hover:text-gray-700"}`}
                      >📍 Offline</button>
                    </div>

                    <input type="text" value={schedLocation}
                      onChange={(e) => setSchedLocation(e.target.value)}
                      placeholder={schedMode === "online" ? "Link Google Meet / Zoom..." : "Địa chỉ văn phòng..."}
                      className="w-full h-9 rounded-lg border border-gray-200 bg-white text-sm px-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />

                    {/* Live preview */}
                    {schedDate && schedTime && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Thông tin sẽ gửi</p>
                        <p className="font-semibold text-gray-900">📅 {previewDate} lúc {previewTime}</p>
                        <p className="text-xs text-gray-600">{schedMode === "online" ? "📹" : "📍"} {schedLocation || (schedMode === "online" ? "Online (link sẽ được gửi sau)" : "Chưa có địa điểm")}</p>
                      </div>
                    )}

                    <button onClick={handleSaveSchedule} disabled={saving || !schedDate || !schedTime} type="button"
                      className={`w-full h-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        saved ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
                      } disabled:opacity-50`}
                    >
                      {saving ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> :
                       saved ? "✓ Đã lưu" : "Lưu lịch"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add new round button */}
        {adding ? (
          <div className="relative animate-[fadeIn_0.2s_ease-out]">
            <div className="absolute -left-[1.7rem] w-5 h-5 rounded-full border-2 border-dashed border-blue-400 bg-blue-50 flex items-center justify-center text-blue-500 text-xs">+</div>
            <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/30 p-4 space-y-3">
              <select value={newType} onChange={(e) => setNewType(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 bg-white text-sm px-2">
                {ROUND_TYPE_OPTIONS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
              <input type="text" placeholder="Tên vòng (tùy chọn)" value={newName} onChange={(e) => setNewName(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 bg-white text-sm px-2" onKeyDown={(e) => { if (e.key==="Enter") handleAdd(); }} />
              <div className="flex gap-2">
                <button onClick={handleAdd} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">Thêm</button>
                <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">Hủy</button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="relative flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            <div className="absolute -left-[1.7rem] w-5 h-5 rounded-full border-2 border-dashed border-blue-300 bg-white flex items-center justify-center text-blue-500 text-xs">+</div>
            <span className="ml-1">Thêm vòng mới</span>
          </button>
        )}
      </div>

      {autoRounds.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 font-medium">
            Lịch sử tự động ({autoRounds.length} cập nhật nhanh)
          </summary>
          <div className="mt-2 space-y-1 pl-4 border-l border-gray-100">
            {autoRounds.map((r) => (
              <div key={r.id} className="text-xs text-gray-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                {r.round_name?.replace("Auto: ", "")} — {new Date(r.created_at).toLocaleDateString("vi-VN")}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
