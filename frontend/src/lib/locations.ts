/** Canonical job locations shared across search UI and client-side fallback filtering. */

export interface JobLocationOption {
  label: string;
  value: string;
  searchTerms: string[];
}

export const JOB_LOCATION_OPTIONS: JobLocationOption[] = [
  { label: "Hà Nội", value: "Hà Nội", searchTerms: ["hà nội", "ha noi", "hn"] },
  { label: "TP. Hồ Chí Minh", value: "TP. Hồ Chí Minh", searchTerms: ["tp. hồ chí minh", "tp hồ chí minh", "hồ chí minh", "ho chi minh", "tphcm", "hcm"] },
  { label: "Đà Nẵng", value: "Đà Nẵng", searchTerms: ["đà nẵng", "da nang"] },
  { label: "An Giang", value: "An Giang", searchTerms: ["an giang"] },
  { label: "Bà Rịa - Vũng Tàu", value: "Bà Rịa - Vũng Tàu", searchTerms: ["bà rịa", "vũng tàu", "ba ria", "vung tau"] },
  { label: "Bắc Giang", value: "Bắc Giang", searchTerms: ["bắc giang", "bac giang"] },
  { label: "Bắc Kạn", value: "Bắc Kạn", searchTerms: ["bắc kạn", "bac kan"] },
  { label: "Bạc Liêu", value: "Bạc Liêu", searchTerms: ["bạc liêu", "bac lieu"] },
  { label: "Bắc Ninh", value: "Bắc Ninh", searchTerms: ["bắc ninh", "bac ninh"] },
  { label: "Bến Tre", value: "Bến Tre", searchTerms: ["bến tre", "ben tre"] },
  { label: "Bình Định", value: "Bình Định", searchTerms: ["bình định", "binh dinh"] },
  { label: "Bình Dương", value: "Bình Dương", searchTerms: ["bình dương", "binh duong"] },
  { label: "Bình Phước", value: "Bình Phước", searchTerms: ["bình phước", "binh phuoc"] },
  { label: "Bình Thuận", value: "Bình Thuận", searchTerms: ["bình thuận", "binh thuan"] },
  { label: "Cà Mau", value: "Cà Mau", searchTerms: ["cà mau", "ca mau"] },
  { label: "Cần Thơ", value: "Cần Thơ", searchTerms: ["cần thơ", "can tho"] },
  { label: "Cao Bằng", value: "Cao Bằng", searchTerms: ["cao bằng", "cao bang"] },
  { label: "Đắk Lắk", value: "Đắk Lắk", searchTerms: ["đắk lắk", "dak lak"] },
  { label: "Đắk Nông", value: "Đắk Nông", searchTerms: ["đắk nông", "dak nong"] },
  { label: "Điện Biên", value: "Điện Biên", searchTerms: ["điện biên", "dien bien"] },
  { label: "Đồng Nai", value: "Đồng Nai", searchTerms: ["đồng nai", "dong nai"] },
  { label: "Đồng Tháp", value: "Đồng Tháp", searchTerms: ["đồng tháp", "dong thap"] },
  { label: "Gia Lai", value: "Gia Lai", searchTerms: ["gia lai"] },
  { label: "Hà Giang", value: "Hà Giang", searchTerms: ["hà giang", "ha giang"] },
  { label: "Hà Nam", value: "Hà Nam", searchTerms: ["hà nam", "ha nam"] },
  { label: "Hà Tĩnh", value: "Hà Tĩnh", searchTerms: ["hà tĩnh", "ha tinh"] },
  { label: "Hải Dương", value: "Hải Dương", searchTerms: ["hải dương", "hai duong"] },
  { label: "Hải Phòng", value: "Hải Phòng", searchTerms: ["hải phòng", "hai phong"] },
  { label: "Hậu Giang", value: "Hậu Giang", searchTerms: ["hậu giang", "hau giang"] },
  { label: "Hòa Bình", value: "Hòa Bình", searchTerms: ["hòa bình", "hoa binh"] },
  { label: "Hưng Yên", value: "Hưng Yên", searchTerms: ["hưng yên", "hung yen"] },
  { label: "Khánh Hòa", value: "Khánh Hòa", searchTerms: ["khánh hòa", "khanh hoa"] },
  { label: "Kiên Giang", value: "Kiên Giang", searchTerms: ["kiên giang", "kien giang"] },
  { label: "Kon Tum", value: "Kon Tum", searchTerms: ["kon tum"] },
  { label: "Lai Châu", value: "Lai Châu", searchTerms: ["lai châu", "lai chau"] },
  { label: "Lâm Đồng", value: "Lâm Đồng", searchTerms: ["lâm đồng", "lam dong", "đà lạt", "da lat"] },
  { label: "Lạng Sơn", value: "Lạng Sơn", searchTerms: ["lạng sơn", "lang son"] },
  { label: "Lào Cai", value: "Lào Cai", searchTerms: ["lào cai", "lao cai"] },
  { label: "Long An", value: "Long An", searchTerms: ["long an"] },
  { label: "Nam Định", value: "Nam Định", searchTerms: ["nam định", "nam dinh"] },
  { label: "Nghệ An", value: "Nghệ An", searchTerms: ["nghệ an", "nghe an"] },
  { label: "Ninh Bình", value: "Ninh Bình", searchTerms: ["ninh bình", "ninh binh"] },
  { label: "Ninh Thuận", value: "Ninh Thuận", searchTerms: ["ninh thuận", "ninh thuan"] },
  { label: "Phú Thọ", value: "Phú Thọ", searchTerms: ["phú thọ", "phu tho"] },
  { label: "Phú Yên", value: "Phú Yên", searchTerms: ["phú yên", "phu yen"] },
  { label: "Quảng Bình", value: "Quảng Bình", searchTerms: ["quảng bình", "quang binh"] },
  { label: "Quảng Nam", value: "Quảng Nam", searchTerms: ["quảng nam", "quang nam"] },
  { label: "Quảng Ngãi", value: "Quảng Ngãi", searchTerms: ["quảng ngãi", "quang ngai"] },
  { label: "Quảng Ninh", value: "Quảng Ninh", searchTerms: ["quảng ninh", "quang ninh"] },
  { label: "Quảng Trị", value: "Quảng Trị", searchTerms: ["quảng trị", "quang tri"] },
  { label: "Sóc Trăng", value: "Sóc Trăng", searchTerms: ["sóc trăng", "soc trang"] },
  { label: "Sơn La", value: "Sơn La", searchTerms: ["sơn la", "son la"] },
  { label: "Tây Ninh", value: "Tây Ninh", searchTerms: ["tây ninh", "tay ninh"] },
  { label: "Thái Bình", value: "Thái Bình", searchTerms: ["thái bình", "thai binh"] },
  { label: "Thái Nguyên", value: "Thái Nguyên", searchTerms: ["thái nguyên", "thai nguyen"] },
  { label: "Thanh Hóa", value: "Thanh Hóa", searchTerms: ["thanh hóa", "thanh hoa"] },
  { label: "Thừa Thiên Huế", value: "Thừa Thiên Huế", searchTerms: ["thừa thiên huế", "thua thien hue", "huế", "hue"] },
  { label: "Tiền Giang", value: "Tiền Giang", searchTerms: ["tiền giang", "tien giang"] },
  { label: "Trà Vinh", value: "Trà Vinh", searchTerms: ["trà vinh", "tra vinh"] },
  { label: "Tuyên Quang", value: "Tuyên Quang", searchTerms: ["tuyên quang", "tuyen quang"] },
  { label: "Vĩnh Long", value: "Vĩnh Long", searchTerms: ["vĩnh long", "vinh long"] },
  { label: "Vĩnh Phúc", value: "Vĩnh Phúc", searchTerms: ["vĩnh phúc", "vinh phuc"] },
  { label: "Yên Bái", value: "Yên Bái", searchTerms: ["yên bái", "yen bai"] }
];

const ALIAS_TO_CANONICAL = new Map<string, string>();
for (const option of JOB_LOCATION_OPTIONS) {
  ALIAS_TO_CANONICAL.set(option.value.toLowerCase(), option.value);
  ALIAS_TO_CANONICAL.set(option.label.toLowerCase(), option.value);
  for (const term of option.searchTerms) {
    ALIAS_TO_CANONICAL.set(term, option.value);
  }
}

/** Map picker/sidebar input to canonical location value stored in filters/API. */
export function normalizeLocation(value: string): string {
  const cleaned = value.trim();
  if (!cleaned) return cleaned;
  return ALIAS_TO_CANONICAL.get(cleaned.toLowerCase()) ?? cleaned;
}

/** Normalize and deduplicate selected locations. */
export function normalizeLocations(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const canonical = normalizeLocation(value);
    if (canonical && !seen.has(canonical)) {
      seen.add(canonical);
      result.push(canonical);
    }
  }
  return result;
}

/** Whether a job location matches any selected canonical locations. */
export function jobMatchesLocations(
  jobLocation: string | null | undefined,
  selectedLocations: string[]
): boolean {
  if (selectedLocations.length === 0) return true;
  if (!jobLocation) return false;

  const jobLower = jobLocation.toLowerCase();
  return selectedLocations.some((selected) => {
    const option = JOB_LOCATION_OPTIONS.find((item) => item.value === selected);
    if (!option) {
      return jobLower.includes(selected.toLowerCase());
    }
    return option.searchTerms.some(
      (term) => jobLower.includes(term) || term.includes(jobLower)
    );
  });
}

/** Province list for LocationPicker (canonical values). */
export const LOCATION_PICKER_OPTIONS = JOB_LOCATION_OPTIONS.map((item) => item.value);
