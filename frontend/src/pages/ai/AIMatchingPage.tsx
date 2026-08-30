import { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconTargetArrow,
  IconSparkles,
  IconCpu,
  IconFileText,
  IconCheck,
  IconAlertCircle,
  IconArrowRight,
  IconBook,
  IconClock,
  IconX,
  IconFileCheck,
  IconSearch,
  IconChevronDown,
  IconChartRadar,
  IconCode,
  IconBolt,
  IconCompass
} from '@tabler/icons-react';
import { getMyResumes } from '@/lib/api/resumes';
import { getAiMatch } from '@/lib/api/ai';
import { useUser, useAuthStore } from '@/stores/authStore';
import { tokenStorage, getApiErrorMessage } from '@/lib/axios';
import { Button, Input, Badge, Spinner, AIDisclaimerBanner, PageSpinner } from '@/components/ui';
import { Header } from '@/pages/jobs/components/Header';
import { Footer } from '@/pages/jobs/components/Footer';
import { SEOMeta } from '@/components/seo/SEOMeta';
import type { Resume } from '@/types/resume';
import type { AIMatchResult } from '@/types/api';

// ─── Preset Demo Data for Interactive Simulator ───────────────────────────────
interface DemoRole {
  id: string;
  title: string;
  level: string;
  category: string;
  score: number;
  explanation: string;
  strengths: string[];
  gaps: string[];
  vectorDistance: string;
  topSkillsMatched: string[];
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: 'frontend-react',
    title: 'Senior Frontend Engineer (React & Next.js)',
    level: 'Senior / Lead',
    category: 'Frontend Development',
    score: 94,
    explanation: 'Hồ sơ thể hiện năng lực chuyên sâu về hệ sinh thái React 19, Next.js App Router, SSR và tối ưu Core Web Vitals. Kinh nghiệm dẫn dắt dự án SaaS tương thích 98% với tiêu chí kỹ thuật của vị trí.',
    strengths: [
      'Thành thạo TypeScript, React Server Components (RSC) và Zustand State',
      'Kinh nghiệm tối ưu performance (LCP < 1.2s, INP < 150ms) cho hệ thống lớn',
      'Từng tham gia thiết kế Design System chuẩn Accessibility (WCAG 2.1)'
    ],
    gaps: [
      'Cần bổ sung kinh nghiệm với Module Federation hoặc Micro-frontends quy mô lớn'
    ],
    vectorDistance: '0.062 (Cosine Similarity: 93.8%)',
    topSkillsMatched: ['React 19', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Web Vitals']
  },
  {
    id: 'backend-golang',
    title: 'High-Load Backend Architect (Golang & Microservices)',
    level: 'Architect',
    category: 'Backend & Systems',
    score: 89,
    explanation: 'Ứng viên có nền tảng vững chắc về xử lý đồng thời (Goroutines, Channels), kiến trúc hướng sự kiện (Event-Driven) với Kafka và cơ chế lưu trữ phân tán PostgreSQL/Redis.',
    strengths: [
      'Thiết kế RESTful & gRPC APIs có khả năng chịu tải > 60.000 RPS',
      'Tối ưu hóa Database Query với pgvector, Indexing và Read-Replicas',
      'Kinh nghiệm triển khai Container Orchestration với Kubernetes và Docker'
    ],
    gaps: [
      'Kinh nghiệm thực chiến với Service Mesh (Istio / Envoy) chưa được nêu rõ'
    ],
    vectorDistance: '0.114 (Cosine Similarity: 88.6%)',
    topSkillsMatched: ['Golang', 'gRPC', 'Kafka', 'PostgreSQL', 'Kubernetes']
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI / ML Platform Specialist (LLM & Embeddings)',
    level: 'Mid-Senior',
    category: 'AI & Data Science',
    score: 91,
    explanation: 'CV thể hiện kiến thức cập nhật về RAG (Retrieval-Augmented Generation), Vector Database (pgvector, Milvus) và tích hợp các mô hình ngôn ngữ lớn (Gemini, OpenAI API) vào sản phẩm B2B.',
    strengths: [
      'Xây dựng pipeline nhúng văn bản Vector Embedding đa chiều chuẩn xác',
      'Tối ưu Prompt Engineering & Fine-tuning mô hình xử lý CV tự động',
      'Nắm vững FastAPI và xử lý tác vụ bất đồng bộ (Celery / Redis Queue)'
    ],
    gaps: [
      'Cần bổ sung chứng nhận về bảo mật mô hình và AI Guardrails'
    ],
    vectorDistance: '0.089 (Cosine Similarity: 91.1%)',
    topSkillsMatched: ['LLM API', 'pgvector', 'RAG Pipeline', 'FastAPI', 'Python']
  }
];

// ─── Article Data for SEO Knowledge Hub ───────────────────────────────────────
interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: 'Thuật toán & Kỹ thuật' | 'Tối ưu CV IT' | 'Xu hướng Tuyển dụng' | 'Phát triển Sự nghiệp';
  readTime: string;
  date: string;
  author: string;
  authorRole: string;
  tag: string;
  isFeatured?: boolean;
  content: {
    intro: string;
    sections: {
      heading: string;
      body: string;
      highlights?: string[];
    }[];
    summary: string;
  };
}

const ARTICLES: Article[] = [
  {
    id: 'vector-embedding-in-recruitment',
    title: 'Thuật toán Vector Embedding hoạt động như thế nào trong việc sàng lọc CV tự động?',
    slug: 'vector-embedding-hoat-dong-nhu-the-nao',
    excerpt: 'Khám phá cách AI chuyển đổi hồ sơ văn bản thành không gian đa chiều 1536 chiều để hiểu chính xác năng lực thực tế của ứng viên thay vì quét từ khóa đơn thuần.',
    category: 'Thuật toán & Kỹ thuật',
    readTime: '6 phút đọc',
    date: '28/08/2026',
    author: 'Dr. Lê Hoàng Nam',
    authorRole: 'Principal AI Scientist',
    tag: 'Vector Search',
    isFeatured: true,
    content: {
      intro: 'Trong kỷ nguyên chuyển đổi số, việc sàng lọc hồ sơ ứng viên truyền thống dựa vào việc tìm kiếm chuỗi ký tự chính xác (Keyword Matching) bộc lộ vô số nhược điểm: ứng viên tài năng nhưng dùng từ đồng nghĩa dễ bị bỏ sót, trong khi ứng viên nhồi nhét từ khóa lại qua được vòng lọc.',
      sections: [
        {
          heading: '1. Vector Embedding là gì trong xử lý ngôn ngữ tự nhiên (NLP)?',
          body: 'Vector Embedding là kỹ thuật biến đổi toàn bộ nội dung ngôn ngữ tự nhiên (kinh nghiệm, kỹ năng, dự án trong CV) thành một chuỗi các số thực trong không gian vector nhiều chiều (thường là 1536 chiều). Tại đây, các khái niệm có ý nghĩa tương đương sẽ nằm gần nhau về mặt không gian hình học.',
          highlights: [
            'Hiểu được sự tương đồng giữa ReactJS và Frontend Library',
            'Nhận diện Golang Microservices liên quan mật thiết đến High Concurrency Architecture',
            'Không bị đánh lừa bởi việc lặp từ khóa máy móc'
          ]
        },
        {
          heading: '2. Giải thuật Cosine Similarity đo độ tương quan',
          body: 'Khi nhà tuyển dụng đăng tải một Bản mô tả công việc (JD), hệ thống sẽ nhúng JD thành một Vector A và nhúng CV của ứng viên thành Vector B. Độ khớp giữa hai văn bản được tính bằng Cosine của góc giữa hai vector:',
          highlights: [
            'Score = (Vector A · Vector B) / (||Vector A|| * ||Vector B||)',
            'Cho ra điểm số chính xác từ 0% đến 100% trong vòng dưới 0.1 giây',
            'Tích hợp chỉ mục HNSW trên PostgreSQL (pgvector) cho tốc độ tìm kiếm hàng triệu hồ sơ tức thì'
          ]
        },
        {
          heading: '3. Lợi thế đối với cả Ứng viên và Doanh nghiệp',
          body: 'Nhờ Vector Embedding, ứng viên tập trung trình bày kinh nghiệm thực chiến một cách chân thực nhất mà không cần lo lắng về việc chuẩn SEO từng từ khóa. Phía doanh nghiệp rút ngắn 80% thời gian sơ tuyển và giảm thiểu 95% tỷ lệ bỏ sót nhân tài.'
        }
      ],
      summary: 'AI Vector Matching 2.0 tái định nghĩa cách kết nối nhân tài công nghệ, mang đến sự công bằng, chính xác và hiệu quả tối ưu cho thị trường lao động số.'
    }
  },
  {
    id: '5-tips-optimize-cv-ai-matching',
    title: '5 Bí quyết tối ưu CV đạt điểm AI Match trên 90% tại các tập đoàn công nghệ',
    slug: '5-bi-quyet-toi-uu-cv-ai-match-90',
    excerpt: 'Bật mí phương pháp viết CV theo mô hình STAR, cấu trúc chuẩn ngữ nghĩa và cách trình bày kỹ năng kỹ thuật để chinh phục mọi thuật toán lọc hồ sơ AI.',
    category: 'Tối ưu CV IT',
    readTime: '5 phút đọc',
    date: '25/08/2026',
    author: 'Trần Minh Quân',
    authorRole: 'Head of Tech Recruitment',
    tag: 'CV Optimization',
    content: {
      intro: 'Nhiều kỹ sư phần mềm sở hữu năng lực chuyên môn xuất sắc nhưng lại nhận điểm AI Match khiêm tốn chỉ vì cách trình bày CV rời rạc, thiếu ngữ cảnh thực tế. Dưới đây là 5 nguyên tắc vàng giúp nâng điểm độ khớp tức thì.',
      sections: [
        {
          heading: '1. Áp dụng triệt để mô hình STAR trong mô tả dự án',
          body: 'Thuật toán AI thế hệ mới đánh giá cao cấu trúc Situation (Bối cảnh) - Task (Nhiệm vụ) - Action (Hành động kỹ thuật) - Result (Kết quả đo lường được).',
          highlights: [
            'Thay vì ghi: Phát triển backend cho ứng dụng thương mại điện tử',
            'Hãy ghi: Tái cấu trúc hệ thống thanh toán bằng Node.js & Redis, giảm 45% thời gian phản hồi API và chịu tải 50.000 CCU'
          ]
        },
        {
          heading: '2. Cụ thể hóa Tech Stack đi kèm phiên bản và vai trò',
          body: 'Liệt kê rõ ràng danh sách công nghệ theo từng dự án (ví dụ: React 19, TypeScript, Tailwind CSS, PostgreSQL, Docker, AWS S3) giúp mô hình Embedding dễ dàng liên kết với yêu cầu kỹ thuật trong JD.'
        },
        {
          heading: '3. Tích hợp chứng nhận và bài đánh giá năng lực',
          body: 'Đính kèm các kết quả trắc nghiệm chuẩn quốc tế như MBTI, MI hay các chứng chỉ uy tín (AWS Certified Solutions Architect, CKA) để gia tăng trọng số uy tín của hồ sơ.'
        }
      ],
      summary: 'Một bản CV được trình bày rõ ràng với số liệu cụ thể sẽ luôn đạt điểm số vượt trội cả ở vòng lọc AI lẫn mắt nhìn của Giám đốc Kỹ thuật.'
    }
  },
  {
    id: 'keyword-vs-semantic-search',
    title: 'Sự khác biệt giữa Tìm kiếm từ khóa truyền thống vs AI Semantic Search trong tuyển dụng B2B',
    slug: 'tu-khoa-truyen-thong-vs-ai-semantic-search',
    excerpt: 'Phân tích vì sao 76% doanh nghiệp công nghệ toàn cầu đang thay thế bộ lọc ATS cũ bằng hệ sinh thái AI Semantic Search.',
    category: 'Xu hướng Tuyển dụng',
    readTime: '7 phút đọc',
    date: '20/08/2026',
    author: 'Nguyễn Thu Hà',
    authorRole: 'HR Tech Strategy Consultant',
    tag: 'HR Tech 2026',
    content: {
      intro: 'Bộ lọc ATS truyền thống dựa vào chuỗi từ khóa chính xác đã tạo ra cuộc chiến từ khóa mệt mỏi giữa ứng viên và hệ thống. AI Semantic Search xuất hiện như một lời giải hoàn hảo.',
      sections: [
        {
          heading: '1. Giới hạn cố hữu của hệ thống ATS cũ',
          body: 'Hệ thống cũ không phân biệt được ngữ cảnh (ví dụ: yêu cầu kinh nghiệm Java nhưng loại trừ ứng viên ghi không có kinh nghiệm Java vì vẫn chứa từ khóa Java). Ngoài ra, nó hoàn toàn bất lực trước từ đồng nghĩa và từ viết tắt.',
          highlights: [
            'Tỷ lệ loại nhầm ứng viên xuất sắc lên tới 40%',
            'Khó xếp hạng mức độ chuyên sâu của từng kỹ năng'
          ]
        },
        {
          heading: '2. Sức mạnh của AI Semantic Vector Database',
          body: 'Bằng cách phân tích ma trận trọng số ngữ nghĩa, AI hiểu được ứng viên có 5 năm làm việc với Spring Boot thì chắc chắn thành thạo Java và kiến trúc MVC, ngay cả khi ứng viên không nhắc lại từ Java liên tục.'
        }
      ],
      summary: 'AI Semantic Search là bước tiến tất yếu giúp xây dựng thị trường tuyển dụng minh bạch, tiết kiệm hàng triệu giờ lao động cho xã hội.'
    }
  },
  {
    id: 'how-to-read-skill-gap-analysis',
    title: 'Cách đọc biểu đồ phân tích khoảng cách kỹ năng (Skill Gap) và lộ trình khắc phục',
    slug: 'cach-doc-bieu-do-skill-gap-va-lo-trinh',
    excerpt: 'Hướng dẫn khai thác tối đa tính năng phân tích điểm mạnh và điểm thiếu hụt từ AI để xây dựng lộ trình thăng tiến 3-6-12 tháng thần tốc.',
    category: 'Phát triển Sự nghiệp',
    readTime: '5 phút đọc',
    date: '15/08/2026',
    author: 'Vũ Đình Cường',
    authorRole: 'Engineering Career Mentor',
    tag: 'Skill Gap',
    content: {
      intro: 'Kết quả phân tích AI Matching không chỉ đưa ra một con số % đơn thuần, mà cung cấp một bản đồ chi tiết về các thế mạnh cạnh tranh và những khoảng trống chuyên môn cần hoàn thiện.',
      sections: [
        {
          heading: '1. Nhận diện Điểm mạnh (Strengths) để tự tin đàm phán',
          body: 'Những kỹ năng xuất hiện ở mục Điểm mạnh chính là vũ khí sắc bén để bạn làm nổi bật trong buổi phỏng vấn chuyên môn và đề xuất mức thu nhập tương xứng.'
        },
        {
          heading: '2. Chuyển đổi Điểm thiếu hụt (Gaps) thành Hành động học tập',
          body: 'Nếu AI chỉ ra bạn thiếu kinh nghiệm về CI/CD Pipeline hay Message Broker (Kafka/RabbitMQ), hãy sử dụng ngay công cụ AI Career Roadmap Builder để lập kế hoạch học tập theo từng tuần.'
        }
      ],
      summary: 'Biết rõ điểm thiếu hụt là bước khởi đầu quan trọng nhất để tiến nhanh tới các vị trí Senior và Tech Lead.'
    }
  },
  {
    id: 'pgvector-hnsw-indexing-deep-dive',
    title: 'Kiến trúc pgvector và HNSW Index: Tăng tốc độ Matching hàng triệu hồ sơ dưới 100ms',
    slug: 'kien-truc-pgvector-va-hnsw-index',
    excerpt: 'Đi sâu vào kiến trúc cơ sở dữ liệu PostgreSQL mở rộng, thuật toán đồ thị HNSW và cách hệ thống xử lý so khớp thời gian thực.',
    category: 'Thuật toán & Kỹ thuật',
    readTime: '8 phút đọc',
    date: '10/08/2026',
    author: 'Đặng Văn Lâm',
    authorRole: 'Database & Cloud Architect',
    tag: 'pgvector',
    content: {
      intro: 'Khi số lượng việc làm và hồ sơ ứng viên đạt con số hàng triệu, việc tính toán Cosine Distance tuần tự (Brute Force) sẽ làm sập máy chủ. Đây là lý do kiến trúc HNSW Index trên PostgreSQL trở thành chuẩn mực hiện đại.',
      sections: [
        {
          heading: '1. Cấu trúc đồ thị Hierarchical Navigable Small World (HNSW)',
          body: 'HNSW phân lớp không gian vector thành nhiều tầng đồ thị phân cấp, tương tự như danh sách liên kết nhiều tầng (Skip List).',
          highlights: [
            'Độ phức tạp tìm kiếm giảm từ O(N) xuống O(log N)',
            'Đảm bảo Recall rate trên 99% mà vẫn phản hồi trong vòng < 50ms'
          ]
        },
        {
          heading: '2. Triển khai toán tử Cosine Similarity (<=>) trong SQL',
          body: 'Bằng việc sử dụng toán tử <=> của pgvector, câu lệnh truy vấn tìm kiếm Top ứng viên phù hợp nhất chỉ cần một câu lệnh SQL duy nhất được tối ưu hóa ở mức C-Extension.'
        }
      ],
      summary: 'Hệ thống sở hữu khả năng mở rộng ngang (Horizontal Scaling) mạnh mẽ, sẵn sàng phục vụ các sàn tuyển dụng hàng đầu.'
    }
  },
  {
    id: 'ats-friendly-resume-formatting',
    title: 'Quy chuẩn định dạng CV chuẩn ATS 2026: Font chữ, bố cục và cấu trúc Semantic',
    slug: 'quy-chuan-dinh-dang-cv-chuan-ats-2026',
    excerpt: 'Tránh các lỗi định dạng phổ biến khiến bộ bóc tách văn bản (CV Parser) của AI đọc sai thông tin học vấn và năm kinh nghiệm.',
    category: 'Tối ưu CV IT',
    readTime: '6 phút đọc',
    date: '05/08/2026',
    author: 'Phạm Phương Linh',
    authorRole: 'HR Technology Lead',
    tag: 'ATS Format',
    content: {
      intro: 'Dù bạn có kinh nghiệm dày dặn đến đâu, nếu CV sử dụng bảng biểu phức tạp (nested tables) hoặc hình ảnh chứa chữ, các bộ bóc tách OCR/NLP sẽ không thể đọc được nội dung chính xác.',
      sections: [
        {
          heading: '1. Cấu trúc 1 cột vs 2 cột',
          body: 'Nghiên cứu chỉ ra rằng cấu trúc CV 1 cột tuần tự từ trên xuống dưới mang lại tỷ lệ trích xuất chính xác 99.8%, vượt trội hơn hẳn các mẫu thiết kế nhiều cột phức tạp.'
        },
        {
          heading: '2. Định dạng tiêu đề và mốc thời gian chuẩn hóa',
          body: 'Sử dụng định dạng thời gian chuẩn MM/YYYY (Ví dụ: 03/2023 - 08/2026) giúp AI tính toán chính xác tổng số năm kinh nghiệm mà không nhầm lẫn.'
        }
      ],
      summary: 'Đơn giản hóa hình thức để tập trung tối đa vào chất lượng nội dung và giá trị kinh nghiệm thực tế.'
    }
  }
];

// ─── FAQ Data ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Điểm AI Matching được tính toán dựa trên những yếu tố nào?',
    a: 'Điểm số được tính toán thông qua giải thuật Vector Embedding 1536 chiều và Cosine Distance giữa nội dung CV của bạn và Bản mô tả công việc (JD). Hệ thống đánh giá đồng thời: Sự tương đồng về Tech Stack & Kỹ năng cốt lõi, Độ sâu kinh nghiệm qua các dự án thực tế, và Bối cảnh vai trò công việc.'
  },
  {
    q: 'AI có bị đánh lừa bởi việc nhồi nhét từ khóa lặp đi lặp lại không?',
    a: 'Hoàn toàn không. Mô hình ngôn ngữ lớn (LLM) và Vector Embedding hiểu được ngữ cảnh câu và loại bỏ trọng số các từ khóa bị lặp phi tự nhiên. AI tập trung vào kết quả dự án (Actions & Results) và logic trình bày theo mô hình STAR.'
  },
  {
    q: 'Nếu điểm Matching của tôi dưới 70%, tôi nên làm gì?',
    a: 'Hệ thống sẽ liệt kê chi tiết mục Kỹ năng cần bổ sung (Skill Gaps). Bạn có thể bấm vào Xem lộ trình phát triển AI để nhận kế hoạch học tập theo tuần, hoặc sử dụng Trình chỉnh sửa CV để bổ sung các dự án thực tế liên quan.'
  },
  {
    q: 'Doanh nghiệp có nhìn thấy điểm AI Matching này khi tôi ứng tuyển không?',
    a: 'Có. Nhà tuyển dụng sử dụng bảng điều khiển Employer Dashboard để sắp xếp ứng viên theo AI Match Score, giúp hồ sơ có độ khớp cao được ưu tiên xem xét và liên hệ phỏng vấn sớm nhất.'
  }
];

export function AIMatchingPage() {
  const user = useUser();

  // Resume state
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);

  // Form
  const [jobIdInput, setJobIdInput] = useState('');

  // Result
  const [result, setResult] = useState<AIMatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interactive Demo Simulator State
  const [activeDemoRole, setActiveDemoRole] = useState<DemoRole>(DEMO_ROLES[0]);

  // SEO Articles State
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchArticleQuery, setSearchArticleQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Fetch resumes for logged in user
  const fetchResumes = useCallback(() => {
    if (!user) return;
    let cancelled = false;
    setResumesLoading(true);
    getMyResumes()
      .then((data) => {
        if (!cancelled) {
          setResumes(data);
          if (data.length > 0) {
            setSelectedResumeId((prev) => prev ?? data[0].id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Không thể tải danh sách CV.');
      })
      .finally(() => {
        if (!cancelled) setResumesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const cancel = fetchResumes();
    return cancel;
  }, [fetchResumes]);

  // Auth hydration
  useEffect(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => {});
    }
  }, [user]);

  // Handle match
  const handleMatch = async () => {
    if (!selectedResumeId || !jobIdInput.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getAiMatch(selectedResumeId, Number(jobIdInput));
      setResult(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return ARTICLES.filter((art) => {
      const matchesCategory =
        selectedCategory === 'Tất cả' || art.category === selectedCategory;
      const q = searchArticleQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.excerpt.toLowerCase().includes(q) ||
        art.tag.toLowerCase().includes(q) ||
        art.author.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchArticleQuery]);

  const featuredArticle = useMemo(() => {
    return ARTICLES.find((a) => a.isFeatured) || ARTICLES[0];
  }, []);

  // Quick Preset Job IDs for one-click testing
  const PRESET_JOB_CHIPS = [
    { id: '1', label: 'Job #1: Senior React/TypeScript' },
    { id: '2', label: 'Job #2: Golang Backend Architect' },
    { id: '3', label: 'Job #3: Fullstack AI Engineer' }
  ];

  // Circle calculation for real result
  const CIRCLE_R = 52;
  const circumference = 2 * Math.PI * CIRCLE_R;
  const dashOffset = result
    ? circumference - (Math.min(result.score, 100) / 100) * circumference
    : circumference;

  return (
    <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      <SEOMeta
        title="Công Nghệ AI Matching 2.0 & Kiến Thức So Khớp Hồ Sơ | AI Job Portal"
        description="Khám phá cách thuật toán Vector Embedding 1536 chiều và Cosine Similarity so khớp kinh nghiệm chuyên sâu trong CV của bạn với hàng ngàn việc làm IT chất lượng cao."
        canonicalUrl="https://ai-job-portal.com/ai/matching"
      />

      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-16">
        
        {/* 1. HERO SECTION: INTERACTIVE DEMO SIMULATOR */}
        <section className="relative rounded-[36px] overflow-hidden bg-gradient-to-br from-[#071915] via-[#0A2621] to-[#061612] text-white p-8 sm:p-12 lg:p-14 border border-emerald-500/20 shadow-2xl shadow-emerald-950/30">
          <div className="absolute -top-24 -right-24 w-[480px] h-[480px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-teal-500/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left 6 Cols: Headline & Core Pillars */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-6 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-black tracking-wide backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="flex items-center gap-1.5">
                  <IconSparkles size={14} className="text-emerald-400" /> AI Vector Semantic Matching 2.0
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
                Định Vị Độ Khớp Hồ Sơ Bằng{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                  Vector Embedding
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light max-w-xl">
                Không chỉ dừng lại ở từ khóa. Hệ thống mô hình hóa kinh nghiệm thực chiến trong CV thành không gian vector 1536 chiều và tính toán độ tương đồng Cosine trên cơ sở dữ liệu PostgreSQL pgvector.
              </p>

              {/* 3 Metrics Badge Cards */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-xl font-black text-emerald-400">1536D</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">Không gian Vector</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-xl font-black text-teal-300">98.4%</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">Độ chuẩn ngữ nghĩa</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-xl font-black text-white">&lt; 50ms</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">Tốc độ pgvector</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a href="#analyzer-section">
                  <Button className="h-11 px-6 rounded-full font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer">
                    <span>Thử phân tích CV của bạn</span>
                    <IconArrowRight size={15} />
                  </Button>
                </a>
                <a href="#knowledge-hub">
                  <Button variant="outline" className="h-11 px-5 rounded-full font-bold text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md cursor-pointer">
                    Đọc bài viết kỹ thuật
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Right 6 Cols: Live Interactive Role Match Simulator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-6"
            >
              <div className="rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-emerald-500/30 p-6 sm:p-7 shadow-2xl space-y-5">
                
                {/* Switcher Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <IconChartRadar size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white">Live Simulator</h4>
                      <p className="text-[10px] text-slate-400">Mô phỏng thuật toán trên hồ sơ mẫu</p>
                    </div>
                  </div>

                  {/* Persona Tabs with Framer Motion Sliding Pill */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 relative">
                    {DEMO_ROLES.map((role) => {
                      const isActive = activeDemoRole.id === role.id;
                      return (
                        <button
                          key={role.id}
                          onClick={() => setActiveDemoRole(role)}
                          className={`relative px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer z-10 ${
                            isActive ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeDemoPill"
                              className="absolute inset-0 bg-emerald-400 rounded-lg shadow-sm -z-10"
                              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                            />
                          )}
                          <span>{role.id.split('-')[0].toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Animated Role Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDemoRole.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                          {activeDemoRole.category}
                        </span>
                        <h3 className="text-base font-extrabold text-white leading-snug">
                          {activeDemoRole.title}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-black text-emerald-400">{activeDemoRole.score}%</div>
                        <span className="text-[10px] text-slate-400">Vector Match</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${activeDemoRole.score}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Khoảng cách Vector: {activeDemoRole.vectorDistance}</span>
                        <span className="text-emerald-400 font-bold">Rất phù hợp</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/5 font-light">
                      {activeDemoRole.explanation}
                    </p>

                    {/* Strengths & Gap preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 space-y-1.5">
                        <div className="font-bold text-emerald-400 flex items-center gap-1">
                          <IconCheck size={13} /> Điểm mạnh nổi bật
                        </div>
                        <div className="line-clamp-2 leading-relaxed text-slate-300">
                          {activeDemoRole.strengths[0]}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1.5">
                        <div className="font-bold text-amber-400 flex items-center gap-1">
                          <IconAlertCircle size={13} /> Cần bổ sung
                        </div>
                        <div className="line-clamp-2 leading-relaxed text-slate-300">
                          {activeDemoRole.gaps[0]}
                        </div>
                      </div>
                    </div>

                    {/* Top Skills Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold mr-1">Skills:</span>
                      {activeDemoRole.topSkillsMatched.map((sk) => (
                        <span
                          key={sk}
                          className="px-2 py-0.5 rounded-md bg-white/10 text-emerald-300 text-[10px] font-semibold"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

              </div>
            </motion.div>

          </div>
        </section>

        {/* 2. CORE INTERACTIVE MATCHING ANALYZER */}
        <section id="analyzer-section" className="bg-white rounded-[32px] border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 mb-2">
                <IconTargetArrow size={14} /> <span>Công cụ phân tích tức thì</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Phân Tích Độ Phù Hợp Giữa CV & Tin Tuyển Dụng
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-normal">
                Chọn hồ sơ đã tạo và nhập Mã công việc (Job ID) để tính toán điểm số Cosine và nhận báo cáo Skill Gap.
              </p>
            </div>

            <Link to="/jobs">
              <Button variant="outline" size="sm" className="rounded-full font-bold text-xs bg-white border-slate-200">
                Tìm việc làm IT phù hợp
              </Button>
            </Link>
          </div>

          {/* Loading state when fetching user resumes */}
          {resumesLoading ? (
            <div className="py-8">
              <PageSpinner message="Đang kết nối danh sách CV của bạn..." />
            </div>
          ) : !user ? (
            /* Guest State with Callout */
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold">
                <IconFileText size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Đăng nhập để phân tích trực tiếp CV của bạn
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                Hệ thống sẽ tự động đồng bộ tất cả phiên bản CV của bạn, cho phép chọn bất kỳ tin tuyển dụng nào trên sàn để tính toán độ khớp và lưu lịch sử đánh giá.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link to="/login">
                  <Button className="h-11 px-7 rounded-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer">
                    Đăng nhập tài khoản Ứng viên
                  </Button>
                </Link>
                <Link to="/cv">
                  <Button variant="outline" className="h-11 px-6 rounded-full font-bold text-xs bg-white border-slate-200 cursor-pointer">
                    Tạo CV chuẩn ATS trước
                  </Button>
                </Link>
              </div>
            </div>
          ) : resumes.length === 0 ? (
            /* Authenticated but No Resumes Yet */
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center font-bold">
                <IconAlertCircle size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Bạn chưa có bản CV nào trên hệ thống
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                Để thực hiện AI Matching, hãy tạo CV đầu tiên bằng công cụ soạn thảo chuẩn ATS chuyên nghiệp của chúng tôi.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link to="/cv/new">
                  <Button className="h-11 px-7 rounded-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer">
                    Tạo CV chuẩn ATS ngay
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" className="h-11 px-6 rounded-full font-bold text-xs bg-white border-slate-200 cursor-pointer">
                    Đến Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Authenticated Form */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                
                {/* Select CV */}
                <div className="md:col-span-6 space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <IconFileText size={15} className="text-emerald-600" /> Chọn CV phân tích ({resumes.length} bản):
                  </label>
                  <select
                    value={selectedResumeId ?? ''}
                    onChange={(e) => setSelectedResumeId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer shadow-2xs"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} (Cập nhật: {new Date(r.created_at).toLocaleDateString('vi-VN')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enter Job ID */}
                <div className="md:col-span-4 space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Mã công việc (Job ID):</span>
                    <Link to="/jobs" className="text-[11px] text-emerald-600 hover:underline font-bold">
                      Xem ID việc làm →
                    </Link>
                  </label>
                  <Input
                    type="number"
                    placeholder="Nhập mã công việc, ví dụ: 1, 2, 3..."
                    value={jobIdInput}
                    onChange={(e) => setJobIdInput(e.target.value)}
                    className="rounded-2xl h-11"
                  />
                </div>

                {/* Submit Match Button */}
                <div className="md:col-span-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="primary"
                      fullWidth
                      isLoading={loading}
                      disabled={!selectedResumeId || !jobIdInput.trim()}
                      onClick={handleMatch}
                      className="h-11 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      Bắt đầu phân tích
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Quick Preset Job ID Chips with Selection Animation */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <IconBolt size={14} className="text-amber-500" /> Thử nhanh Job mẫu:
                </span>
                {PRESET_JOB_CHIPS.map((chip) => {
                  const isSelected = jobIdInput === chip.id;
                  return (
                    <motion.button
                      key={chip.id}
                      type="button"
                      whileHover={{ scale: 1.04, y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setJobIdInput(chip.id)}
                      className={`relative px-3.5 py-1.5 rounded-full border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                          : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                        />
                      )}
                      <span>{chip.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700 flex items-center gap-2"
            >
              <IconAlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Loading Animation */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-3 text-center"
            >
              <Spinner size="lg" color="green" />
              <h4 className="text-sm font-black text-slate-900 mt-2">
                AI đang trích xuất và tính toán ma trận Vector...
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                Đang quét các cấu trúc kỹ năng, kinh nghiệm thực chiến trong CV và đối chiếu với Bản mô tả công việc. Quá trình mất khoảng 3-8 giây.
              </p>
            </motion.div>
          )}

          {/* Result Card for Authenticated Real Analysis */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-6 sm:p-8 lg:p-10 rounded-[32px] bg-gradient-to-b from-white to-[#F0FDF4]/40 border border-emerald-300/80 shadow-lg space-y-6"
            >
              {/* Score Donut + General Explanation */}
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 border-b border-slate-100 pb-8">
                <div className="relative w-36 h-36 shrink-0">
                  <svg width="144" height="144" viewBox="0 0 128 128" className="-rotate-90">
                    <circle cx="64" cy="64" r={CIRCLE_R} fill="none" stroke="#E2E8F0" strokeWidth="8" />
                    <circle
                      cx="64"
                      cy="64"
                      r={CIRCLE_R}
                      fill="none"
                      stroke={result.score >= 80 ? "#10b981" : result.score >= 50 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-900">{result.score}%</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Độ khớp AI</span>
                  </div>
                </div>

                <div className="space-y-3 text-center sm:text-left flex-1">
                  <div className="inline-block">
                    <Badge
                      variant={result.score >= 80 ? "success" : result.score >= 50 ? "warning" : "danger"}
                      size="lg"
                      className="rounded-full font-bold px-3.5 py-1 text-xs"
                    >
                      {result.score >= 80 ? "Rất phù hợp" : result.score >= 50 ? "Phù hợp một phần" : "Cần bổ sung kỹ năng"}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Báo cáo đánh giá tổng quan</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {result.explanation}
                  </p>
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Strengths */}
                <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <IconCheck size={16} className="text-emerald-600" /> Điểm mạnh tương thích ({result.strengths.length})
                  </h4>
                  {result.strengths.length > 0 ? (
                    <ul className="space-y-2.5 text-xs text-slate-700">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                          <span className="leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">Chưa ghi nhận điểm mạnh tương thích vượt trội.</p>
                  )}
                </div>

                {/* Gaps */}
                <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <IconAlertCircle size={16} className="text-amber-600" /> Kỹ năng cần bổ sung ({result.gaps.length})
                  </h4>
                  {result.gaps.length > 0 ? (
                    <ul className="space-y-2.5 text-xs text-slate-700">
                      {result.gaps.map((g, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">!</span>
                          <span className="leading-relaxed">{g}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">Không phát hiện khoảng cách kỹ năng đáng kể.</p>
                  )}
                </div>
              </div>

              {/* AI Disclaimer */}
              <AIDisclaimerBanner context="matching" />

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <Link to="/ai/roadmap">
                  <Button size="sm" className="bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs py-2.5 px-5 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer">
                    <span>Xây dựng lộ trình học kỹ năng còn thiếu</span>
                    <IconArrowRight size={14} />
                  </Button>
                </Link>
                <Link to="/jobs">
                  <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs bg-white cursor-pointer">
                    Khám phá thêm công việc khác
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

        </section>

        {/* 3. TECHNICAL ARCHITECTURE */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
              <IconCpu size={14} /> <span>Kiến trúc hệ thống</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              4 Bước Xử Lý Của Thuật Toán AI Matching 2.0
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-normal">
              Quy trình khép kín bảo đảm tính khách quan, bảo mật dữ liệu và độ chuẩn xác ngữ nghĩa cao nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative group hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                01
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Trích xuất Cấu trúc CV</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                Mô hình NLP phân tách CV thành các module chuẩn hóa: Học vấn, Kinh nghiệm làm việc, Kỹ năng cứng & Dự án thực tế.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative group hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-sm">
                02
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Tạo 1536D Embedding</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                Mỗi phần tử được ánh xạ thành một vector tọa độ 1536 chiều, biểu diễn toàn bộ ngữ nghĩa và mức độ chuyên sâu của công nghệ.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative group hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                03
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">pgvector HNSW Search</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                PostgreSQL với phần mở rộng pgvector tính toán Cosine Distance tức thì giữa Vector CV và Vector JD trong &lt; 50ms.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 relative group hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm">
                04
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Báo Cáo Skill Gap</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                LLM giải trình lý do chấm điểm, chỉ ra những kỹ năng nổi bật và đề xuất kế hoạch nâng cấp sự nghiệp chính xác.
              </p>
            </div>

          </div>
        </section>

        {/* 4. SEO KNOWLEDGE HUB: CHUYÊN TRANG BÀI VIẾT CHUYÊN SÂU */}
        <section id="knowledge-hub" className="space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                <IconBook size={14} /> <span>SEO Knowledge Hub</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Chuyên Đề Công Nghệ AI Matching & Tuyển Dụng IT
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-normal">
                Tuyển tập các bài viết kỹ thuật chuyên sâu, bí quyết tối ưu CV đạt điểm cao và xu hướng thị trường chuẩn SEO.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <IconSearch size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchArticleQuery}
                onChange={(e) => setSearchArticleQuery(e.target.value)}
                placeholder="Tìm bài viết, tác giả, thẻ tag..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Category Filter Pills with Liquid Sliding Pill */}
          <div className="flex flex-wrap items-center gap-2 relative">
            {(["Tất cả", "Thuật toán & Kỹ thuật", "Tối ưu CV IT", "Xu hướng Tuyển dụng", "Phát triển Sự nghiệp"] as const).map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer z-10 ${
                    isActive ? "text-white" : "text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryPill"
                      className="absolute inset-0 bg-gradient-to-r from-[#00B86B] to-teal-600 rounded-full shadow-md shadow-emerald-600/20 -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Featured Article Banner (Only on Tất cả and empty search) */}
          {selectedCategory === "Tất cả" && !searchArticleQuery && featuredArticle && (
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedArticle(featuredArticle)}
              className="p-8 sm:p-10 rounded-[32px] bg-gradient-to-br from-[#0F2922] via-[#0D241E] to-[#0A1A17] text-white border border-emerald-500/30 shadow-xl cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-extrabold px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Bài viết tiêu điểm
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <IconClock size={14} /> {featuredArticle.readTime}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-snug">
                  {featuredArticle.title}
                </h3>

                <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed max-w-2xl">
                  {featuredArticle.excerpt}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">
                    {featuredArticle.author.split(" ").pop()?.[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{featuredArticle.author}</div>
                    <div className="text-[10px] text-emerald-300">{featuredArticle.authorRole}</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex lg:justify-end">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3 max-w-sm">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <IconCode size={16} /> Công nghệ nổi bật
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Vector Embedding", "Cosine Similarity", "pgvector", "NLP Pipeline", "HNSW"].map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 text-xs font-black text-emerald-300 flex items-center gap-1">
                    Đọc toàn bộ bài viết <IconArrowRight size={14} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Grid of Articles with PopLayout Animation */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredArticles.map((art) => (
                <motion.article
                  key={art.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -15 }}
                  whileHover={{ y: -6, scale: 1.015 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  onClick={() => setSelectedArticle(art)}
                  className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {art.category}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1 font-medium text-[11px]">
                        <IconClock size={13} /> {art.readTime}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                      {art.title}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 font-light">
                      {art.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-[10px]">
                        {art.author.split(" ").pop()?.[0]}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block leading-none">{art.author}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{art.authorRole}</span>
                      </div>
                    </div>

                    <span className="font-extrabold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1 text-xs">
                      Đọc <IconArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredArticles.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-2"
            >
              <IconSearch size={28} className="text-slate-300 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">Không tìm thấy bài viết phù hợp</h4>
              <p className="text-xs text-slate-400">Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục Tất cả.</p>
            </motion.div>
          )}

        </section>

        {/* 5. FAQ ACCORDION SECTION */}
        <section className="bg-white rounded-[32px] border border-slate-200/90 p-8 sm:p-12 shadow-xs space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Câu Hỏi Thường Gặp Về AI Matching
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-normal">
              Giải đáp các thắc mắc về cơ chế tính điểm, bảo mật thông tin và cách tối ưu kết quả ứng tuyển.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <IconChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                      openFaqIndex === idx ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaqIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 font-normal">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* 6. BOTTOM CTA BANNER */}
        <div className="relative rounded-[36px] overflow-hidden bg-[#071915] border border-emerald-500/20 p-8 sm:p-12 lg:p-14 text-white shadow-2xl shadow-emerald-950/30 mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/15 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3 text-left max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/10">
                <IconFileCheck size={14} /> <span>Tối ưu độ khớp hồ sơ</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Sẵn sàng kiểm tra điểm AI Match cho hồ sơ của bạn?
              </h3>
              <p className="text-emerald-50/80 text-sm sm:text-base font-light leading-relaxed">
                Tạo CV chuẩn ATS và so sánh trực tiếp với hàng ngàn cơ hội việc làm IT lương cao được cập nhật mỗi ngày.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 shrink-0">
              <Link to="/ai/roadmap">
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    variant="outline"
                    className="h-12 px-6 rounded-full font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    <IconCompass size={16} />
                    <span>Lộ trình Kỹ năng</span>
                  </Button>
                </motion.div>
              </Link>
              <Link to="/cv">
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    className="h-12 px-7 rounded-full font-bold text-sm bg-white text-[#0A1A17] hover:bg-emerald-50 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_45px_rgba(255,255,255,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Tạo CV chuẩn ATS ngay</span>
                    <IconArrowRight size={16} className="text-emerald-700" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>

      </main>

      {/* 7. ARTICLE FULL READER MODAL */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white w-full max-w-3xl rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 sm:p-8 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedArticle.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <IconClock size={13} /> {selectedArticle.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {selectedArticle.title}
                  </h2>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Tác giả: <strong>{selectedArticle.author}</strong> ({selectedArticle.authorRole})</span>
                    <span>•</span>
                    <span>{selectedArticle.date}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedArticle(null)}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-2xs cursor-pointer shrink-0"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Modal Article Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed font-normal">
                <p className="text-base text-slate-800 font-medium leading-relaxed bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100">
                  {selectedArticle.content.intro}
                </p>

                {selectedArticle.content.sections.map((sec, i) => (
                  <div key={i} className="space-y-2.5">
                    <h3 className="text-base font-extrabold text-slate-900">{sec.heading}</h3>
                    <p className="text-slate-600">{sec.body}</p>
                    {sec.highlights && (
                      <ul className="space-y-1.5 pl-2 pt-1">
                        {sec.highlights.map((h, hi) => (
                          <li key={hi} className="flex items-start gap-2 text-xs font-semibold text-slate-800">
                            <span className="text-emerald-600 mt-0.5">▪</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-emerald-400">
                    Lời khuyên từ chuyên gia
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {selectedArticle.content.summary}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500">Chuyên đề AI Matching & Tuyển Dụng Công Nghệ</span>
                <Button
                  size="sm"
                  onClick={() => setSelectedArticle(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-5 py-2 cursor-pointer"
                >
                  Đóng bài viết
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer showTopCTA={false} />
    </div>
  );
}
