import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  IconCalculator,
  IconCheck,
  IconCopy,
  IconUsers
} from "@tabler/icons-react";
import { toast } from "sonner";

// Regional minimum wages (Vùng I, II, III, IV)
const REGIONS = [
  { id: 1, name: "Vùng I (Hà Nội, TP.HCM, Bình Dương, Đồng Nai...)", minWage: 4960000 },
  { id: 2, name: "Vùng II (Đà Nẵng, Cần Thơ, Hải Phòng, Nha Trang...)", minWage: 4410000 },
  { id: 3, name: "Vùng III (Các thành phố/thị xã trực thuộc tỉnh)", minWage: 3860000 },
  { id: 4, name: "Vùng IV (Các địa bàn còn lại)", minWage: 3450000 },
];

const BASE_SALARY = 2340000; // Lương cơ sở mới nhất
const MAX_BHXH_BHYT_SALARY = BASE_SALARY * 20; // 46.800.000
const PERSONAL_DEDUCTION = 11000000; // 11 triệu/tháng
const DEPENDENT_DEDUCTION = 4400000; // 4.4 triệu/tháng

const TAX_BRACKETS = [
  { threshold: 5000000, rate: 0.05 },
  { threshold: 10000000, rate: 0.10 },
  { threshold: 18000000, rate: 0.15 },
  { threshold: 32000000, rate: 0.20 },
  { threshold: 52000000, rate: 0.25 },
  { threshold: 80000000, rate: 0.30 },
  { threshold: Infinity, rate: 0.35 },
];

function calculatePIT(taxableIncome: number) {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let remaining = taxableIncome;
  let previousThreshold = 0;

  for (const bracket of TAX_BRACKETS) {
    const bracketSize = bracket.threshold === Infinity ? Infinity : bracket.threshold - previousThreshold;
    if (remaining > bracketSize) {
      tax += bracketSize * bracket.rate;
      remaining -= bracketSize;
      previousThreshold = bracket.threshold;
    } else {
      tax += remaining * bracket.rate;
      break;
    }
  }
  return Math.round(tax);
}

function convertNetToTaxableIncome(convertedIncome: number) {
  if (convertedIncome <= 0) return 0;
  if (convertedIncome <= 4750000) return convertedIncome / 0.95;
  if (convertedIncome <= 9250000) return (convertedIncome - 250000) / 0.9;
  if (convertedIncome <= 16050000) return (convertedIncome - 750000) / 0.85;
  if (convertedIncome <= 27250000) return (convertedIncome - 1650000) / 0.8;
  if (convertedIncome <= 42250000) return (convertedIncome - 3250000) / 0.75;
  if (convertedIncome <= 61850000) return (convertedIncome - 5850000) / 0.7;
  return (convertedIncome - 9850000) / 0.65;
}

export function GrossNetCalculator({ onClose }: { onClose?: () => void }) {
  const [mode, setMode] = useState<"gross-to-net" | "net-to-gross">("gross-to-net");
  const [salaryInput, setSalaryInput] = useState<string>("25000000");
  const [dependents, setDependents] = useState<number>(0);
  const [selectedRegionId, setSelectedRegionId] = useState<number>(1);
  const [insuranceType, setInsuranceType] = useState<"official" | "custom">("official");
  const [customInsuranceSalary, setCustomInsuranceSalary] = useState<string>("5000000");
  const [copied, setCopied] = useState(false);

  const region = useMemo(() => REGIONS.find((r) => r.id === selectedRegionId) || REGIONS[0], [selectedRegionId]);
  const maxBHTNSalary = region.minWage * 20;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Math.max(0, Math.round(num)));
  };

  const rawSalary = parseFloat(salaryInput.replace(/[^0-9]/g, "")) || 0;
  const rawCustomInsurance = parseFloat(customInsuranceSalary.replace(/[^0-9]/g, "")) || 0;

  const calculation = useMemo(() => {
    let grossSalary = 0;
    let netSalary = 0;

    const insSalaryBase = insuranceType === "official" ? rawSalary : rawCustomInsurance;
    const bhxhBhytBase = Math.min(insSalaryBase, MAX_BHXH_BHYT_SALARY);
    const bhtnBase = Math.min(insSalaryBase, maxBHTNSalary);

    if (mode === "gross-to-net") {
      grossSalary = rawSalary;
      const bhxh = bhxhBhytBase * 0.08;
      const bhyt = bhxhBhytBase * 0.015;
      const bhtn = bhtnBase * 0.01;
      const totalInsurance = bhxh + bhyt + bhtn;

      const preTaxIncome = grossSalary - totalInsurance;
      const totalDeduction = PERSONAL_DEDUCTION + dependents * DEPENDENT_DEDUCTION;
      const taxableIncome = Math.max(0, preTaxIncome - totalDeduction);
      const pitTax = calculatePIT(taxableIncome);

      netSalary = grossSalary - totalInsurance - pitTax;

      const employerBHXH = bhxhBhytBase * 0.175;
      const employerBHYT = bhxhBhytBase * 0.03;
      const employerBHTN = bhtnBase * 0.01;
      const employerBHTNLD = bhxhBhytBase * 0.005;
      const totalEmployerInsurance = employerBHXH + employerBHYT + employerBHTN + employerBHTNLD;
      const totalEmployerCost = grossSalary + totalEmployerInsurance;

      return {
        grossSalary,
        netSalary,
        bhxh,
        bhyt,
        bhtn,
        totalInsurance,
        preTaxIncome,
        totalDeduction,
        taxableIncome,
        pitTax,
        employerBHXH,
        employerBHYT,
        employerBHTN,
        employerBHTNLD,
        totalEmployerInsurance,
        totalEmployerCost,
      };
    } else {
      netSalary = rawSalary;
      const totalDeduction = PERSONAL_DEDUCTION + dependents * DEPENDENT_DEDUCTION;
      const convertedIncome = Math.max(0, netSalary - totalDeduction);
      const taxableIncome = convertNetToTaxableIncome(convertedIncome);
      const pitTax = calculatePIT(taxableIncome);

      const incomeBeforeInsuranceAndTax = netSalary + pitTax;
      let candidateGross = incomeBeforeInsuranceAndTax;

      if (insuranceType === "official") {
        const standardRate = 0.105;
        const estGross = incomeBeforeInsuranceAndTax / (1 - standardRate);
        const estBHXH = Math.min(estGross, MAX_BHXH_BHYT_SALARY) * 0.08;
        const estBHYT = Math.min(estGross, MAX_BHXH_BHYT_SALARY) * 0.015;
        const estBHTN = Math.min(estGross, maxBHTNSalary) * 0.01;
        candidateGross = incomeBeforeInsuranceAndTax + estBHXH + estBHYT + estBHTN;
      } else {
        const estBHXH = Math.min(rawCustomInsurance, MAX_BHXH_BHYT_SALARY) * 0.08;
        const estBHYT = Math.min(rawCustomInsurance, MAX_BHXH_BHYT_SALARY) * 0.015;
        const estBHTN = Math.min(rawCustomInsurance, maxBHTNSalary) * 0.01;
        candidateGross = incomeBeforeInsuranceAndTax + estBHXH + estBHYT + estBHTN;
      }

      grossSalary = Math.round(candidateGross);
      const finalInsSalary = insuranceType === "official" ? grossSalary : rawCustomInsurance;
      const finalBhxhBhytBase = Math.min(finalInsSalary, MAX_BHXH_BHYT_SALARY);
      const finalBhtnBase = Math.min(finalInsSalary, maxBHTNSalary);

      const bhxh = finalBhxhBhytBase * 0.08;
      const bhyt = finalBhxhBhytBase * 0.015;
      const bhtn = finalBhtnBase * 0.01;
      const totalInsurance = bhxh + bhyt + bhtn;

      const employerBHXH = finalBhxhBhytBase * 0.175;
      const employerBHYT = finalBhxhBhytBase * 0.03;
      const employerBHTN = finalBhtnBase * 0.01;
      const employerBHTNLD = finalBhxhBhytBase * 0.005;
      const totalEmployerInsurance = employerBHXH + employerBHYT + employerBHTN + employerBHTNLD;
      const totalEmployerCost = grossSalary + totalEmployerInsurance;

      return {
        grossSalary,
        netSalary,
        bhxh,
        bhyt,
        bhtn,
        totalInsurance,
        preTaxIncome: grossSalary - totalInsurance,
        totalDeduction,
        taxableIncome,
        pitTax,
        employerBHXH,
        employerBHYT,
        employerBHTN,
        employerBHTNLD,
        totalEmployerInsurance,
        totalEmployerCost,
      };
    }
  }, [mode, rawSalary, dependents, insuranceType, rawCustomInsurance, maxBHTNSalary]);

  const handleCopyBreakdown = () => {
    const text = `📊 BẢNG QUY ĐỔI LƯƠNG GROSS ⇆ NET 2026 (AI JOB PORTAL)
• Lương Gross: ${formatVND(calculation.grossSalary)}
• BHXH (8%): ${formatVND(calculation.bhxh)}
• BHYT (1.5%): ${formatVND(calculation.bhyt)}
• BHTN (1%): ${formatVND(calculation.bhtn)}
• Tổng bảo hiểm: ${formatVND(calculation.totalInsurance)}
• Giảm trừ gia cảnh: ${formatVND(calculation.totalDeduction)}
• Thuế TNCN: ${formatVND(calculation.pitTax)}
================================
✨ LƯƠNG NET THỰC NHẬN: ${formatVND(calculation.netSalary)}
🏢 Chi phí người sử dụng LĐ: ${formatVND(calculation.totalEmployerCost)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Đã sao chép kết quả bảng tính lương!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-900/5 overflow-hidden"
    >
      {/* Header Bar with Animated Toggle */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70">
        <div className="flex items-center gap-3.5">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.05 }}
            className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shadow-2xs"
          >
            <IconCalculator size={22} stroke={1.8} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">Tính Lương Gross ⇆ Net</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Quy định 2026
              </span>
            </div>
            <p className="text-xs text-slate-500">Giảm trừ 11tr/tháng · Lương cơ sở 2.340.000đ</p>
          </div>
        </div>

        {/* Mode Toggle with Animated Glide Pill */}
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 rounded-2xl bg-slate-200/60 relative">
            <button
              onClick={() => setMode("gross-to-net")}
              className={`relative px-4 py-2 rounded-xl text-xs font-extrabold transition-colors z-10 cursor-pointer ${
                mode === "gross-to-net" ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {mode === "gross-to-net" && (
                <motion.div
                  layoutId="calcModePill"
                  className="absolute inset-0 bg-white rounded-xl shadow-xs"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">Gross → Net</span>
            </button>

            <button
              onClick={() => setMode("net-to-gross")}
              className={`relative px-4 py-2 rounded-xl text-xs font-extrabold transition-colors z-10 cursor-pointer ${
                mode === "net-to-gross" ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {mode === "net-to-gross" && (
                <motion.div
                  layoutId="calcModePill"
                  className="absolute inset-0 bg-white rounded-xl shadow-xs"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">Net → Gross</span>
            </button>
          </div>

          {onClose && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs cursor-pointer"
            >
              Thu gọn
            </motion.button>
          )}
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Salary Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>{mode === "gross-to-net" ? "Mức lương Gross:" : "Mức lương Net mong muốn:"}</span>
              <span className="text-[11px] font-normal text-slate-400">Nhập số tiền VNĐ</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={Number(rawSalary).toLocaleString("vi-VN")}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setSalaryInput(val);
                }}
                placeholder="25.000.000"
                className="w-full pl-4 pr-14 py-3 rounded-2xl bg-slate-50/70 border border-slate-200 text-lg font-black text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>

            {/* Quick preset chips with spring animation */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[15000000, 20000000, 30000000, 45000000, 60000000].map((quick) => (
                <motion.button
                  key={quick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSalaryInput(quick.toString())}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                    rawSalary === quick
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  {(quick / 1000000)} triệu
                </motion.button>
              ))}
            </div>
          </div>

          {/* Dependents Counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <IconUsers size={15} className="text-slate-500" /> Người phụ thuộc:
              </span>
              <span className="text-emerald-700 font-semibold">Giảm {formatVND(dependents * DEPENDENT_DEDUCTION)}</span>
            </div>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map((num) => (
                <motion.button
                  key={num}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDependents(num)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    dependents === num
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Region selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Vùng làm việc:
            </label>
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 transition-all cursor-pointer"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Insurance selection */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-800 block">Mức đóng bảo hiểm:</label>
            <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="insType"
                  checked={insuranceType === "official"}
                  onChange={() => setInsuranceType("official")}
                  className="accent-emerald-600"
                />
                <span>Lương chính thức</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="insType"
                  checked={insuranceType === "custom"}
                  onChange={() => setInsuranceType("custom")}
                  className="accent-emerald-600"
                />
                <span>Mức quy định khác</span>
              </label>
            </div>
            {insuranceType === "custom" && (
              <input
                type="text"
                value={Number(rawCustomInsurance).toLocaleString("vi-VN")}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setCustomInsuranceSalary(val);
                }}
                placeholder="5.000.000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 mt-2"
              />
            )}
          </div>
        </div>

        {/* Right Summary Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Key Metric Highlight Cards with spring physics */}
          <div className="grid grid-cols-2 gap-3.5">
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 shadow-xs"
            >
              <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider block mb-1">
                LƯƠNG NET THỰC NHẬN
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 block">
                {formatVND(calculation.netSalary)}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Về tài khoản sau khấu trừ</span>
            </motion.div>

            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs"
            >
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                LƯƠNG GROSS
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
                {formatVND(calculation.grossSalary)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">Mức lương thỏa thuận</span>
            </motion.div>
          </div>

          {/* Breakdown Card */}
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs space-y-2.5">
            <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
              <span>Lương Gross</span>
              <span>{formatVND(calculation.grossSalary)}</span>
            </div>
            
            <div className="flex justify-between items-center text-slate-600 pl-2">
              <span>- Bảo hiểm người lao động (10.5%)</span>
              <span className="text-rose-600 font-bold">-{formatVND(calculation.totalInsurance)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 pl-4">
              <span>BHXH (8%): {formatVND(calculation.bhxh)} · BHYT (1.5%): {formatVND(calculation.bhyt)} · BHTN (1%): {formatVND(calculation.bhtn)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600 pl-2 border-t border-slate-200/60 pt-2">
              <span>- Giảm trừ gia cảnh</span>
              <span className="font-semibold">-{formatVND(calculation.totalDeduction)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600 pl-2">
              <span>- Thuế thu nhập cá nhân (PIT)</span>
              <span className="text-rose-600 font-bold">-{formatVND(calculation.pitTax)}</span>
            </div>

            <div className="flex justify-between items-center font-black text-emerald-800 pt-3 border-t border-slate-200 text-base">
              <span>Lương Net nhận về ví:</span>
              <span className="text-emerald-600 text-lg">{formatVND(calculation.netSalary)}</span>
            </div>
          </div>

          {/* Footer stats & 1-click copy button with bouncy tap */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 text-xs text-slate-500">
            <span>Chi phí DN chi trả (bao gồm 21.5% BH công ty): <strong className="text-slate-800">{formatVND(calculation.totalEmployerCost)}</strong></span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyBreakdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold border border-emerald-200 cursor-pointer shadow-2xs transition-colors"
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              <span>{copied ? "Đã sao chép" : "Sao chép kết quả"}</span>
            </motion.button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
