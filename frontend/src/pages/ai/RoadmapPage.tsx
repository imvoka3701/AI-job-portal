import { useCallback, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getMyResumes } from "@/lib/api/resumes";
import { generateRoadmap } from "@/lib/api/ai";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage, getApiErrorMessage } from "@/lib/axios";
import { Button, Badge, PageSpinner, Spinner, AIDisclaimerBanner } from "@/components/ui";
import { Header } from "@/pages/jobs/components/Header";
import { Footer } from "@/pages/jobs/components/Footer";
import { SEOMeta } from "@/components/seo/SEOMeta";
import type { Resume } from "@/types/resume";
import type { RoadmapResult } from "@/types/api";

import {
  IconCompass,
  IconRoute,
  IconSparkles,
  IconArrowRight,
  IconClock,
  IconBook,
  IconCode,
  IconTarget,
  IconChevronDown,
  IconChevronUp,
  IconAlertCircle,
  IconTrendingUp,
  IconBolt,
  IconFileText,
  IconSchool,
  IconBulb,
  IconExternalLink,
  IconDownload,
  IconDeviceLaptop,
  IconCpu,
  IconShieldLock,
  IconLayersLinked,
  IconAdjustmentsHorizontal,
  IconChartBar,
  IconFolderCheck,
  IconHelpCircle,
  IconSquareCheck,
  IconSquare,
  IconX
} from "@tabler/icons-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface SkillNode {
  id: string;
  name: string;
  category: "Foundations" | "Core Architecture" | "Scale & Distributed" | "Leadership & AI";
  layer: number; // 1 to 4
  level: "Cơ bản" | "Nâng cao" | "Chuyên gia";
  hours: number;
  salaryBoost: string;
  description: string;
  resources: { title: string; url: string; type: "Docs" | "Repo" | "Course" }[];
  status: "mastered" | "in_progress" | "gap";
}

interface CareerTrack {
  id: string;
  title: string;
  tag: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  badgeTone: string;
  salaryRange: string;
  timeline: string;
  summary: string;
  capstoneProject: {
    title: string;
    description: string;
    techStack: string[];
    cvBulletPoint: string;
  };
  interviewQuestions: {
    question: string;
    keyPoints: string;
  }[];
  sprints: {
    sprintNumber: number;
    weekRange: string;
    focus: string;
    tasks: string[];
  }[];
}

// ─── PRESET SKILL NODES FOR VISUAL TREE CANVAS ────────────────────────────────
const INITIAL_SKILL_NODES: SkillNode[] = [
  // Layer 1: Foundations
  {
    id: "ts-deep",
    name: "TypeScript 5.x Strict & Generics",
    category: "Foundations",
    layer: 1,
    level: "Cơ bản",
    hours: 20,
    salaryBoost: "+15%",
    description: "Làm chủ Type Manipulation, Conditional Types, Template Literal Types và Utility Types để xây dựng codebase an toàn 100%.",
    resources: [
      { title: "TypeScript Official Handbook", url: "https://www.typescriptlang.org/docs/", type: "Docs" },
      { title: "Type-Challenges Repo", url: "https://github.com/type-challenges/type-challenges", type: "Repo" }
    ],
    status: "mastered"
  },
  {
    id: "git-ci",
    name: "Git Flow & CI/CD Pipelines",
    category: "Foundations",
    layer: 1,
    level: "Cơ bản",
    hours: 15,
    salaryBoost: "+10%",
    description: "Tự động hóa build, test, lint và Docker build image với GitHub Actions và Semantic Release.",
    resources: [
      { title: "GitHub Actions Guide", url: "https://docs.github.com/en/actions", type: "Docs" }
    ],
    status: "mastered"
  },
  // Layer 2: Core Architecture
  {
    id: "react-19",
    name: "React 19 & Next.js 15 Server Components",
    category: "Core Architecture",
    layer: 2,
    level: "Nâng cao",
    hours: 35,
    salaryBoost: "+30%",
    description: "Hiểu sâu cơ chế Streaming SSR, React Server Components (RSC), Server Actions và Partial Prerendering (PPR).",
    resources: [
      { title: "Next.js 15 Architecture", url: "https://nextjs.org/docs", type: "Docs" },
      { title: "React 19 Compiler RFC", url: "https://react.dev", type: "Docs" }
    ],
    status: "in_progress"
  },
  {
    id: "fastapi-pgvector",
    name: "FastAPI, SQLAlchemy & pgvector",
    category: "Core Architecture",
    layer: 2,
    level: "Nâng cao",
    hours: 30,
    salaryBoost: "+35%",
    description: "Xây dựng Backend chịu tải cao, Async I/O, tích hợp pgvector cho AI Vector Search và Cosine Similarity Indexing.",
    resources: [
      { title: "FastAPI Official Documentation", url: "https://fastapi.tiangolo.com", type: "Docs" },
      { title: "pgvector HNSW Guide", url: "https://github.com/pgvector/pgvector", type: "Repo" }
    ],
    status: "in_progress"
  },
  // Layer 3: Scale & Distributed
  {
    id: "kafka-event",
    name: "Apache Kafka & Event-Driven Architecture",
    category: "Scale & Distributed",
    layer: 3,
    level: "Chuyên gia",
    hours: 40,
    salaryBoost: "+45%",
    description: "Thiết kế kiến trúc bất đồng bộ, Saga Pattern, Outbox Pattern, giải quyết Idempotency và Message Ordering quy mô lớn.",
    resources: [
      { title: "Designing Data-Intensive Applications", url: "https://dataintensive.net", type: "Course" },
      { title: "Confluent Kafka Design Patterns", url: "https://developer.confluent.io", type: "Docs" }
    ],
    status: "gap"
  },
  {
    id: "k8s-infra",
    name: "Kubernetes, Helm & ArgoCD GitOps",
    category: "Scale & Distributed",
    layer: 3,
    level: "Chuyên gia",
    hours: 35,
    salaryBoost: "+40%",
    description: "Triển khai cụm K8s đa vùng, quản lý ingress/service mesh, giám sát Prometheus/Grafana và Zero-downtime deployment.",
    resources: [
      { title: "Kubernetes Production Best Practices", url: "https://kubernetes.io/docs", type: "Docs" }
    ],
    status: "gap"
  },
  // Layer 4: Leadership & AI
  {
    id: "genai-rag",
    name: "Advanced RAG & LLM Serving Platform",
    category: "Leadership & AI",
    layer: 4,
    level: "Chuyên gia",
    hours: 45,
    salaryBoost: "+60%",
    description: "Xây dựng hệ sinh thái AI doanh nghiệp: Hybrid Vector/BM25 Search, Fine-tuning LoRA, vLLM Serving và Langfuse Observability.",
    resources: [
      { title: "DeepLearning.AI Advanced RAG", url: "https://deeplearning.ai", type: "Course" },
      { title: "vLLM Production Engine", url: "https://docs.vllm.ai", type: "Repo" }
    ],
    status: "gap"
  },
  {
    id: "tech-leadership",
    name: "System Design & Engineering Mentorship",
    category: "Leadership & AI",
    layer: 4,
    level: "Chuyên gia",
    hours: 25,
    salaryBoost: "+50%",
    description: "Thiết kế kiến trúc hệ thống cấp Enterprise, Migration Strategy, Tech Debt Management và huấn luyện đội ngũ kỹ sư.",
    resources: [
      { title: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", type: "Repo" }
    ],
    status: "gap"
  }
];

// ─── 6 CURATED ENTERPRISE CAREER TRACKS 2026 ─────────────────────────────────
const CAREER_TRACKS: CareerTrack[] = [
  {
    id: "frontend-lead",
    title: "Senior Frontend Lead & Performance Architect",
    tag: "Frontend & Architecture",
    icon: IconDeviceLaptop,
    color: "from-emerald-500 to-teal-600",
    badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    salaryRange: "$2,200 - $3,600 / tháng (+55%)",
    timeline: "12 tuần (8-10h/tuần)",
    summary: "Nâng cấp từ một lập trình viên React đơn thuần lên Kiến trúc sư Frontend làm chủ Next.js 15, Streaming SSR, Micro-Frontends và chuẩn hóa Core Web Vitals cho triệu người dùng.",
    capstoneProject: {
      title: "Enterprise Micro-Frontend E-Commerce Platform",
      description: "Xây dựng hệ thống sàn thương mại điện tử phân tán bằng Module Federation, Next.js 15 Server Actions, tối ưu hóa INP < 50ms, LCP < 1.2s và phân phối CDN Edge.",
      techStack: ["React 19", "Next.js 15", "Module Federation", "Tailwind CSS v4", "Playwright E2E", "Cloudflare Workers"],
      cvBulletPoint: "Thiết kế kiến trúc Micro-Frontend giảm 40% Bundle Size, cải thiện 35% Core Web Vitals (INP/LCP) và tăng 22% tỷ lệ chuyển đổi cho hơn 500k active users."
    },
    interviewQuestions: [
      {
        question: "Làm thế nào để xử lý bài toán Shared State và Style Isolation giữa các Micro-Frontends độc lập?",
        keyPoints: "Sử dụng Custom Event Bus / RxJS cho decoupled communication; dùng CSS Modules hoặc Shadow DOM để ngăn chặn xung đột CSS; thống nhất Design System chung qua NPM package."
      },
      {
        question: "Cơ chế hoạt động của React 19 Server Actions và cách phòng chống CSRF / Double Submission?",
        keyPoints: "Server Actions sử dụng POST request mã hóa POST payload tự động; tích hợp useActionState, cryptographic token verification và Optimistic UI updates."
      },
      {
        question: "Phương pháp tối ưu chỉ số Interaction to Next Paint (INP) khi UI có hàng ngàn DOM nodes?",
        keyPoints: "Sử dụng useTransition, requestIdleCallback, Web Workers để tách các tác vụ tính toán nặng ra khỏi Main Thread; virtualizing long lists."
      }
    ],
    sprints: [
      {
        sprintNumber: 1,
        weekRange: "Tuần 1 - 2",
        focus: "React 19 Core & Next.js 15 Server Architecture",
        tasks: [
          "Làm chủ React 19 Compiler và memoization tự động",
          "Chuyển đổi các trang Client Component sang Server Components (RSC)",
          "Thiết lập Server Actions với Zod validation & Error Boundaries"
        ]
      },
      {
        sprintNumber: 2,
        weekRange: "Tuần 3 - 4",
        focus: "Core Web Vitals & Web Performance Optimization",
        tasks: [
          "Tối ưu INP & LCP: Phân tích Chrome DevTools Performance Profiler",
          "Triển khai Dynamic Import, Route Segment Config & Image Optimization",
          "Thiết lập Real User Monitoring (RUM) để theo dõi độ trễ thực tế"
        ]
      },
      {
        sprintNumber: 3,
        weekRange: "Tuần 5 - 6",
        focus: "Module Federation & Headless Design System",
        tasks: [
          "Cấu hình Webpack 5 / Vite Module Federation phân tách ứng dụng",
          "Xây dựng thư viện UI Headless tái sử dụng chuẩn Radix Primitives",
          "Viết kiểm thử tự động Visual Regression với Playwright"
        ]
      },
      {
        sprintNumber: 4,
        weekRange: "Tuần 7 - 12",
        focus: "Capstone Project & Technical Leadership",
        tasks: [
          "Hoàn thiện Capstone Project Micro-Frontend đưa lên GitHub",
          "Viết tài liệu kiến trúc (ADR - Architecture Decision Records)",
          "Luyện tập 15 câu hỏi phỏng vấn System Design Frontend hóc búa"
        ]
      }
    ]
  },
  {
    id: "backend-distributed",
    title: "Distributed Systems & Cloud Backend Architect",
    tag: "Backend & Cloud",
    icon: IconCpu,
    color: "from-blue-500 to-indigo-600",
    badgeTone: "bg-blue-50 text-blue-700 border-blue-200",
    salaryRange: "$2,800 - $4,500 / tháng (+65%)",
    timeline: "12 tuần (10-12h/tuần)",
    summary: "Làm chủ kiến trúc Microservices phân tán chịu tải cao, Event-driven architecture với Apache Kafka, tối ưu hóa cơ sở dữ liệu PostgreSQL pgvector và triển khai cụm Kubernetes chuẩn Enterprise.",
    capstoneProject: {
      title: "Real-time High-Throughput Event Streaming Core",
      description: "Xây dựng hệ thống giao dịch bất đồng bộ xử lý 50,000 req/s, đảm bảo Idempotency, Transactional Outbox Pattern, gRPC microservices và Distributed Tracing.",
      techStack: ["Golang / Python FastAPI", "Apache Kafka", "PostgreSQL pgvector", "Redis Cluster", "OpenTelemetry", "Docker/K8s"],
      cvBulletPoint: "Kiến trúc hệ thống Event-driven với Kafka & gRPC, giảm 60% p99 latency xuống < 25ms và đảm bảo 99.99% uptime cho hơn 10 triệu transactions/ngày."
    },
    interviewQuestions: [
      {
        question: "Làm thế nào để đảm bảo tính nhất quán dữ liệu (Data Consistency) khi một transaction bao gồm 3 microservices khác nhau?",
        keyPoints: "Áp dụng Saga Pattern (Choreography hoặc Orchestration) kèm Transactional Outbox Pattern và Idempotent Consumers để xử lý rollback / compensation."
      },
      {
        question: "Chiến lược phân vùng bảng (Table Partitioning) và tối ưu HNSW Index trong PostgreSQL pgvector?",
        keyPoints: "Partitioning theo thời gian/tenant_id; cấu hình m (số kết nối) và ef_construction để cân bằng giữa tốc độ tìm kiếm vector và dung lượng RAM."
      }
    ],
    sprints: [
      {
        sprintNumber: 1,
        weekRange: "Tuần 1 - 3",
        focus: "Event-Driven Core & Apache Kafka Deep Dive",
        tasks: [
          "Thiết kế Kafka Topics, Consumer Groups, Partitions và Rebalancing",
          "Triển khai Outbox Pattern & Debezium CDC để ngăn ngừa mất mát tin nhắn",
          "Xây dựng gRPC Interceptors & Distributed Tracing với Jaeger/OpenTelemetry"
        ]
      },
      {
        sprintNumber: 2,
        weekRange: "Tuần 4 - 6",
        focus: "High-Performance Database & Vector Search",
        tasks: [
          "Tối ưu PostgreSQL Index (B-Tree, GIN, HNSW pgvector)",
          "Cấu hình PgBouncer Connection Pooling và Read Replicas",
          "Thiết lập Multi-layer Caching với Redis (Cache Aside & Stampede Protection)"
        ]
      },
      {
        sprintNumber: 3,
        weekRange: "Tuần 7 - 12",
        focus: "Kubernetes Cluster & Capstone Delivery",
        tasks: [
          "Vận hành K8s Manifests, HPA Autoscaling và Ingress Controller",
          "Hoàn thành Capstone Project Event Streaming đưa lên GitHub",
          "Mock interview vòng System Design Backend cấp độ Senior/Staff"
        ]
      }
    ]
  },
  {
    id: "ai-mlops",
    title: "AI / LLM Application & MLOps Platform Specialist",
    tag: "GenAI & MLOps",
    icon: IconSparkles,
    color: "from-purple-500 to-pink-600",
    badgeTone: "bg-purple-50 text-purple-700 border-purple-200",
    salaryRange: "$3,000 - $5,000 / tháng (+80%)",
    timeline: "12 tuần (10-12h/tuần)",
    summary: "Đón đầu làn sóng công nghệ với kiến trúc Advanced RAG, Fine-tuning mô hình ngôn ngữ lớn (LoRA/QLoRA), vLLM high-throughput inference serving và bảo mật LLM Guardrails.",
    capstoneProject: {
      title: "Enterprise Multi-Agent RAG Knowledge System",
      description: "Xây dựng hệ thống trợ lý AI hỗ trợ tra cứu tài liệu doanh nghiệp hàng triệu trang, kết hợp Hybrid Search, Cohere Reranker, Semantic Caching giảm 70% chi phí Token và Langfuse Tracing.",
      techStack: ["Python", "FastAPI", "pgvector", "LangChain / LlamaIndex", "vLLM", "Unsloth", "Langfuse", "NeMo Guardrails"],
      cvBulletPoint: "Xây dựng hệ thống Advanced RAG đạt độ chính xác 96.2%, giảm 72% chi phí API Token qua Semantic Caching và phục vụ 100+ concurrent requests với vLLM Engine."
    },
    interviewQuestions: [
      {
        question: "Làm thế nào để đo lường và đánh giá chất lượng của một hệ thống RAG trong môi trường Production?",
        keyPoints: "Sử dụng framework RAGAS đo 4 chỉ số cốt lõi: Faithfulness, Answer Relevance, Context Precision, và Context Recall; kết hợp Human Feedback Loop qua Langfuse."
      },
      {
        question: "Cơ chế PagedAttention trong vLLM giúp tăng Throughput suy luận LLM như thế nào?",
        keyPoints: "Giải quyết phân mảnh bộ nhớ KV Cache tương tự cơ chế Phân trang (Paging) trong Virtual Memory của Hệ điều hành, cho phép batching nhiều requests đồng thời."
      }
    ],
    sprints: [
      {
        sprintNumber: 1,
        weekRange: "Tuần 1 - 3",
        focus: "Advanced RAG Architecture & Vector Indexing",
        tasks: [
          "Xây dựng Data Pipeline phân đoạn văn bản thông minh (Recursive & Semantic Chunking)",
          "Triển khai Hybrid Search kết hợp BM25 + Dense Vector Embeddings",
          "Tích hợp Cohere/BGE Reranker cải thiện Top-k Precision"
        ]
      },
      {
        sprintNumber: 2,
        weekRange: "Tuần 4 - 6",
        focus: "Fine-Tuning & Model Optimization",
        tasks: [
          "Chuẩn bị Dataset huấn luyện và làm sạch dữ liệu với GPT-4 Synthetic Data",
          "Fine-tuning Llama 3 / Qwen bằng phương pháp LoRA / QLoRA với Unsloth",
          "Đánh giá Model Perplexity và benchmark nghiệp vụ chuyên ngành"
        ]
      },
      {
        sprintNumber: 3,
        weekRange: "Tuần 7 - 12",
        focus: "vLLM Serving, Observability & Capstone",
        tasks: [
          "Deploy vLLM trên GPU Cloud với PagedAttention & Continuous Batching",
          "Tích hợp Semantic Cache (GPTCache) và Langfuse Observability",
          "Hoàn thiện Capstone Multi-Agent RAG System"
        ]
      }
    ]
  },
  {
    id: "fullstack-ai",
    title: "Fullstack AI Product Engineer",
    tag: "Fullstack & AI",
    icon: IconLayersLinked,
    color: "from-amber-500 to-orange-600",
    badgeTone: "bg-amber-50 text-amber-700 border-amber-200",
    salaryRange: "$2,200 - $3,500 / tháng (+50%)",
    timeline: "10 tuần (8h/tuần)",
    summary: "Trở thành kỹ sư sản phẩm toàn năng có khả năng độc lập xây dựng các tính năng AI hoàn chỉnh từ UI/UX mượt mà đến API Backend và Vector Search.",
    capstoneProject: {
      title: "AI-Powered SaaS Document Workspace",
      description: "Ứng dụng soạn thảo văn bản thông minh hỗ trợ tự động tóm tắt, dịch thuật ngữ cảnh và truy vấn dữ liệu từ file PDF theo thời gian thực.",
      techStack: ["Next.js 15", "TypeScript", "FastAPI", "pgvector", "Tailwind CSS", "Zustand", "Stripe API"],
      cvBulletPoint: "Độc lập phát triển sản phẩm SaaS AI từ ý tưởng đến Production, đạt 2,000 active users trong tháng đầu tiên và tích hợp thanh toán tự động."
    },
    interviewQuestions: [
      {
        question: "Làm thế nào để truyền dữ liệu Streaming response từ LLM về UI React mà không gây re-render liên tục?",
        keyPoints: "Sử dụng Server-Sent Events (SSE) hoặc ReadableStream Web API kết hợp với AI SDK (Vercel) và state update theo batch."
      }
    ],
    sprints: [
      {
        sprintNumber: 1,
        weekRange: "Tuần 1 - 3",
        focus: "Next.js 15 & Modern TypeScript Fullstack",
        tasks: [
          "Thiết lập kiến trúc monorepo hoặc song song Next.js + FastAPI",
          "Xây dựng hệ thống Authentication JWT & OAuth2 Google/GitHub",
          "Thiết kế UI Component chuẩn Tailwind CSS & Framer Motion"
        ]
      },
      {
        sprintNumber: 2,
        weekRange: "Tuần 4 - 6",
        focus: "AI Integration & Streaming UX",
        tasks: [
          "Tích hợp OpenAI / Gemini API với cơ chế Streaming SSE",
          "Xây dựng tính năng Vector Search CV & Job Matching",
          "Triển khai Dark/Light mode và Responsive Mobile"
        ]
      },
      {
        sprintNumber: 3,
        weekRange: "Tuần 7 - 10",
        focus: "SaaS Monetization & Capstone Launch",
        tasks: [
          "Tích hợp cổng thanh toán Stripe / VNPay",
          "Deploy Production lên Vercel & Railway / Docker",
          "Hoàn tất Portfolio cá nhân và chuẩn bị CV"
        ]
      }
    ]
  },
  {
    id: "devops-sre",
    title: "Cloud Platform & SRE / DevOps Lead",
    tag: "DevOps & SRE",
    icon: IconShieldLock,
    color: "from-cyan-500 to-blue-600",
    badgeTone: "bg-cyan-50 text-cyan-700 border-cyan-200",
    salaryRange: "$2,600 - $4,200 / tháng (+60%)",
    timeline: "12 tuần (10h/tuần)",
    summary: "Xây dựng hạ tầng Cloud tự phục vụ (Internal Developer Platform), tự động hóa Infrastructure as Code với Terraform, vận hành Kubernetes và đảm bảo hệ thống đạt chuẩn tin cậy 99.99%.",
    capstoneProject: {
      title: "Enterprise Multi-Cloud GitOps Infrastructure",
      description: "Hạ tầng Cloud hoàn chỉnh được định nghĩa 100% bằng code (Terraform), triển khai tự động qua ArgoCD GitOps, bảo mật Vault và giám sát toàn diện Prometheus/Grafana.",
      techStack: ["Terraform", "AWS / GCP", "Kubernetes", "ArgoCD", "HashiCorp Vault", "Prometheus", "Grafana"],
      cvBulletPoint: "Thiết lập hệ thống CI/CD GitOps tự động hóa 100% quy trình release, rút ngắn 80% thời gian deploy và giảm thiểu 95% sự cố do cấu hình thủ công."
    },
    interviewQuestions: [
      {
        question: "Nguyên lý hoạt động của ArgoCD GitOps và cách xử lý khi xảy ra Drift giữa Git Repo và Live Cluster?",
        keyPoints: "ArgoCD liên tục so sánh State trong Git (Desired State) với State trên K8s (Live State); khi có sai lệch có thể tự động Auto-Sync hoặc gửi cảnh báo."
      }
    ],
    sprints: [
      {
        sprintNumber: 1,
        weekRange: "Tuần 1 - 4",
        focus: "Infrastructure as Code với Terraform & AWS",
        tasks: [
          "Viết Terraform Modules chuẩn tái sử dụng (VPC, EKS, RDS, S3)",
          "Quản lý Terraform Remote State & State Locking với S3 + DynamoDB",
          "Triển khai HashiCorp Vault để quản lý Secret bảo mật"
        ]
      },
      {
        sprintNumber: 2,
        weekRange: "Tuần 5 - 8",
        focus: "Kubernetes Production & ArgoCD GitOps",
        tasks: [
          "Cài đặt ArgoCD và cấu hình App-of-Apps Pattern",
          "Thiết lập Canary Deployment với Argo Rollouts",
          "Cấu hình Istio Service Mesh quản lý Traffic Routing"
        ]
      },
      {
        sprintNumber: 3,
        weekRange: "Tuần 9 - 12",
        focus: "Observability & Capstone Launch",
        tasks: [
          "Xây dựng Dashboard Grafana giám sát RED / USE Metrics",
          "Thiết lập Alertmanager gửi cảnh báo khẩn cấp qua Slack/Telegram",
          "Hoàn thiện Capstone Multi-Cloud GitOps"
        ]
      }
    ]
  },
  {
    id: "mobile-architect",
    title: "Cross-Platform Mobile Architect",
    tag: "Mobile Engineering",
    icon: IconDeviceLaptop,
    color: "from-rose-500 to-pink-600",
    badgeTone: "bg-rose-50 text-rose-700 border-rose-200",
    salaryRange: "$2,200 - $3,500 / tháng (+50%)",
    timeline: "10 tuần (8h/tuần)",
    summary: "Làm chủ React Native Expo 52 New Architecture (Fabric & TurboModules), phát triển ứng dụng di động mượt mà 60fps, Offline-first và tích hợp Native Modules với Swift/Kotlin.",
    capstoneProject: {
      title: "Offline-First Enterprise Mobile Assistant",
      description: "Ứng dụng di động quản lý công việc và đồng bộ dữ liệu ngoại tuyến (WatermelonDB), tích hợp AI Speech-to-Text on-device và Push Notification chuẩn xác.",
      techStack: ["React Native Expo 52", "TypeScript", "WatermelonDB", "Zustand", "Reanimated 3", "Native Modules"],
      cvBulletPoint: "Xây dựng ứng dụng mobile đạt 60fps mượt mà trên cả iOS & Android, hỗ trợ làm việc offline 100% và đạt điểm đánh giá 4.8 sao trên App Store."
    },
    interviewQuestions: [
      {
        question: "Kiến trúc New Architecture trong React Native giải quyết điểm nghẽn của Bridge truyền thống như thế nào?",
        keyPoints: "Thay thế JSON Bridge bất đồng bộ bằng JSI (JavaScript Interface), cho phép JS gọi trực tiếp C++ / Native methods đồng bộ và sử dụng Fabric Renderer cho UI."
      }
    ],
    sprints: [
      {
        sprintNumber: 1,
        weekRange: "Tuần 1 - 3",
        focus: "Expo 52 & New Architecture Core",
        tasks: [
          "Cấu hình React Native New Architecture (Fabric Renderer & TurboModules)",
          "Xây dựng Navigation mượt mà với Expo Router",
          "Tối ưu hóa UI Animations với React Native Reanimated 3"
        ]
      },
      {
        sprintNumber: 2,
        weekRange: "Tuần 4 - 6",
        focus: "Offline-First & Native Bridges",
        tasks: [
          "Triển khai WatermelonDB lưu trữ cục bộ tốc độ cao",
          "Xây dựng cơ chế Sync bất đồng bộ khi có kết nối Internet",
          "Viết Custom Native Module bằng Swift / Kotlin"
        ]
      },
      {
        sprintNumber: 3,
        weekRange: "Tuần 7 - 10",
        focus: "Publishing & Capstone Delivery",
        tasks: [
          "Cấu hình EAS Build & OTA Updates tự động",
          "Hoàn thiện Capstone Offline-first Mobile App",
          "Luyện tập phỏng vấn Mobile System Design"
        ]
      }
    ]
  }
];

// ─── TARGET PRESET CHIPS ──────────────────────────────────────────────────────
const TARGET_ROLE_PRESETS = [
  "Senior Frontend Lead (React 19 / Next.js 15)",
  "Distributed Systems & Cloud Architect (Golang / K8s)",
  "AI / MLOps Platform Specialist (LLM & RAG)",
  "Fullstack AI Engineer (TypeScript & Python)",
  "DevOps & Platform Engineering Lead",
  "Cross-Platform Mobile Architect (React Native)"
];

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export const RoadmapPage = () => {
  const user = useUser();

  // 1. Skill Tree State
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>(INITIAL_SKILL_NODES);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);

  // 2. Active Career Track for 6 Detailed Paths
  const [activeTrack, setActiveTrack] = useState<CareerTrack>(CAREER_TRACKS[0]);
  const [openFaqTrackIndex, setOpenFaqTrackIndex] = useState<number | null>(0);

  // 3. ROI Calculator Sliders
  const [currentSalary, setCurrentSalary] = useState<number>(25000000); // 25M VND
  const [studyHoursPerWeek, setStudyHoursPerWeek] = useState<number>(10);
  const [targetMultiplier, setTargetMultiplier] = useState<number>(1.6); // +60%

  // 4. Personalized Generator State (from CV)
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [targetRole, setTargetRole] = useState(TARGET_ROLE_PRESETS[0]);
  const [result, setResult] = useState<RoadmapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 5. Weekly Planner Checked Tasks (stored in LocalStorage)
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("roadmap_completed_tasks_2026");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 6. Global FAQ Accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Save tasks to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("roadmap_completed_tasks_2026", JSON.stringify(completedTasks));
    } catch {}
  }, [completedTasks]);

  // Toggle task in weekly planner
  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Fetch Resumes
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
        if (!cancelled) setError("Không thể tải danh sách CV.");
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

  // Update node status
  const updateNodeStatus = (nodeId: string, newStatus: SkillNode["status"]) => {
    setSkillNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, status: newStatus } : node))
    );
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Skill Tree Stats
  const masteredCount = useMemo(
    () => skillNodes.filter((n) => n.status === "mastered").length,
    [skillNodes]
  );
  const inProgressCount = useMemo(
    () => skillNodes.filter((n) => n.status === "in_progress").length,
    [skillNodes]
  );
  const gapCount = useMemo(
    () => skillNodes.filter((n) => n.status === "gap").length,
    [skillNodes]
  );
  const totalTreeProgress = useMemo(
    () => Math.round((masteredCount / skillNodes.length) * 100),
    [masteredCount, skillNodes]
  );

  // ROI Calculator Calculations
  const calculatedFutureSalary = useMemo(() => {
    return Math.round(currentSalary * targetMultiplier);
  }, [currentSalary, targetMultiplier]);

  const salaryDifference = useMemo(() => {
    return calculatedFutureSalary - currentSalary;
  }, [calculatedFutureSalary, currentSalary]);

  const twoYearGain = useMemo(() => {
    return salaryDifference * 24; // 24 months
  }, [salaryDifference]);

  // Handle Generate Roadmap from CV
  const handleGenerate = async () => {
    if (!selectedResumeId || !targetRole.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await generateRoadmap(selectedResumeId, targetRole.trim());
      setResult(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Export Roadmap to Markdown / Notion File
  const handleExportMarkdown = () => {
    const track = activeTrack;
    let md = `# LỘ TRÌNH PHÁT TRIỂN SỰ NGHIỆP: ${track.title.toUpperCase()}\n\n`;
    md += `> **Mục tiêu**: ${track.summary}\n`;
    md += `> **Thu nhập kỳ vọng**: ${track.salaryRange}\n`;
    md += `> **Thời gian dự kiến**: ${track.timeline}\n\n`;
    md += `## 1. Đồ Án Thực Chiến Mẫu (Capstone Project)\n`;
    md += `### ${track.capstoneProject.title}\n`;
    md += `${track.capstoneProject.description}\n\n`;
    md += `**Công nghệ sử dụng**: ${track.capstoneProject.techStack.join(", ")}\n`;
    md += `**Điểm sáng trong CV**: *"${track.capstoneProject.cvBulletPoint}"*\n\n`;
    md += `## 2. Kế Hoạch Hành Động 12 Tuần (Weekly Sprints)\n\n`;

    track.sprints.forEach((s) => {
      md += `### Sprint ${s.sprintNumber}: ${s.focus} (${s.weekRange})\n`;
      s.tasks.forEach((t) => {
        const isDone = completedTasks[`${track.id}_${s.sprintNumber}_${t}`];
        md += `- [${isDone ? "x" : " "}] ${t}\n`;
      });
      md += `\n`;
    });

    md += `## 3. Bộ Câu Hỏi Phỏng Vấn Hóc Búa Nhất\n\n`;
    track.interviewQuestions.forEach((iq, i) => {
      md += `#### Q${i + 1}: ${iq.question}\n`;
      md += `**Trọng tâm trả lời**: ${iq.keyPoints}\n\n`;
    });

    md += `---\n*Tạo tự động từ AI Job Portal (https://ai-job-portal.com/ai/roadmap)*\n`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AI_Career_Roadmap_${track.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      <SEOMeta
        title="AI Career Roadmap & Skill Tree 2026 | Trung Tâm Lộ Trình Kỹ Năng & Nấc Thang Thu Nhập"
        description="Định hướng và xây dựng lộ trình học tập, thăng tiến sự nghiệp IT chuẩn xác dựa trên mô hình phân tích Skill Gap của AI."
        canonicalUrl="https://ai-job-portal.com/ai/roadmap"
      />

      {/* 1. SINGLE GLASSMORPHIC STICKY HEADER */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
        
        {/* ── 1. HERO SECTION: AURORA GLOW & PITCH ─────────────────────────── */}
        <section className="relative rounded-[36px] bg-gradient-to-br from-[#061B16] via-[#0A2620] to-[#04120F] text-white p-6 sm:p-10 lg:p-14 overflow-hidden border border-emerald-500/20 shadow-2xl">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-teal-500/15 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.08] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide">
                <IconCompass size={15} />
                <span>AI Career Compass & Interactive Skill Tree 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
                Kiến Tạo Nấc Thang Sự Nghiệp <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">
                  Chuẩn Xác & Đột Phá Thu Nhập
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-light">
                Hệ sinh thái định hướng kỹ năng toàn diện: Khám phá cây năng lực 4 tầng, đo lường ROI tăng trưởng mức lương, chẩn đoán khoảng cách kỹ năng từ CV và làm chủ 6 lộ trình công nghệ hàng đầu 2026.
              </p>

              {/* Stat Highlights */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">120+</div>
                  <div className="text-[11px] sm:text-xs text-slate-300 mt-0.5">Kỹ năng phân tích</div>
                </div>
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-xl sm:text-2xl font-black text-teal-300">6 Tracks</div>
                  <div className="text-[11px] sm:text-xs text-slate-300 mt-0.5">Chuyên ngành mẫu</div>
                </div>
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-xl sm:text-2xl font-black text-amber-300">+65%</div>
                  <div className="text-[11px] sm:text-xs text-slate-300 mt-0.5">Tăng trưởng thu nhập</div>
                </div>
              </div>

              {/* Jump Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a href="#skill-tree-canvas">
                  <Button size="lg" className="h-12 px-7 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2">
                    <span>Khám phá Cây Kỹ Năng</span>
                    <IconArrowRight size={15} />
                  </Button>
                </a>
                <a href="#salary-calculator">
                  <Button variant="outline" size="lg" className="h-12 px-6 rounded-full bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs cursor-pointer">
                    Tính ROI Lương 2026
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Card: Quick Skill Tree Pulse */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-7 rounded-[30px] bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-xl shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black text-white tracking-wide uppercase">Tổng Quan Ma Trận Kỹ Năng</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-300">
                    {totalTreeProgress}% Hoàn thiện
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    <div className="text-lg font-black">{masteredCount}</div>
                    <div className="text-[10px] text-slate-300 mt-0.5">Đã thành thạo</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-300">
                    <div className="text-lg font-black">{inProgressCount}</div>
                    <div className="text-[10px] text-slate-300 mt-0.5">Đang trau dồi</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    <div className="text-lg font-black">{gapCount}</div>
                    <div className="text-[10px] text-slate-300 mt-0.5">Lỗ hổng (Gap)</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Mức độ sẵn sàng thăng tiến:</span>
                    <span className="font-bold text-emerald-400">{masteredCount}/{skillNodes.length} Kỹ năng</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 rounded-full"
                      animate={{ width: `${totalTreeProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                  Bấm vào từng Node kỹ năng bên dưới để xem hướng dẫn học, thời gian hoàn thành và mức tăng lương tương ứng.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ── 2. MODULE 1: INTERACTIVE VISUAL SKILL TREE CANVAS ─────────────── */}
        <section id="skill-tree-canvas" className="bg-white rounded-[32px] border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 mb-2">
                <IconRoute size={14} /> <span>Interactive Skill Matrix</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Bản Đồ Cây Kỹ Năng Đa Tầng 2026
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-normal">
                Bấm vào từng Node để mở bảng hướng dẫn tài liệu học và cập nhật trạng thái năng lực của bạn.
              </p>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Đã có (Mastered)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Đang học (In Progress)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Cần bổ sung (Skill Gap)
              </span>
            </div>
          </div>

          {/* 4 Layers Grid */}
          <div className="space-y-6">
            {[1, 2, 3, 4].map((layerNum) => {
              const layerTitle =
                layerNum === 1
                  ? "Tầng 1: Nền Tảng Kỹ Thuật (Foundations & Tooling)"
                  : layerNum === 2
                  ? "Tầng 2: Kiến Trúc Lõi Hiện Đại (Modern Frameworks & Core Architecture)"
                  : layerNum === 3
                  ? "Tầng 3: Xử Lý Quy Mô Lớn & Hạ Tầng Phân Tán (Scale & Distributed Systems)"
                  : "Tầng 4: Lãnh Đạo Kỹ Thuật & Ứng Dụng AI (Staff Leadership & AI Platforms)";

              const layerNodes = skillNodes.filter((n) => n.layer === layerNum);

              return (
                <div key={layerNum} className="p-5 sm:p-6 rounded-3xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                      {layerTitle}
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">
                      Level {layerNum}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {layerNodes.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const statusTone =
                        node.status === "mastered"
                          ? "border-emerald-300 bg-emerald-50/30 hover:border-emerald-500"
                          : node.status === "in_progress"
                          ? "border-blue-300 bg-blue-50/30 hover:border-blue-500"
                          : "border-amber-300 bg-amber-50/30 hover:border-amber-500";

                      return (
                        <motion.div
                          key={node.id}
                          whileHover={{ scale: 1.01, y: -2 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setSelectedNode(node)}
                          className={`p-5 rounded-2xl bg-white border shadow-2xs transition-all cursor-pointer space-y-3 relative group ${statusTone} ${
                            isSelected ? "ring-2 ring-slate-900" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                {node.category}
                              </span>
                              <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {node.name}
                              </h4>
                            </div>

                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                node.status === "mastered"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : node.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {node.status === "mastered"
                                ? "Đã có"
                                : node.status === "in_progress"
                                ? "Đang học"
                                : "Cần học"}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-light">
                            {node.description}
                          </p>

                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
                            <span className="flex items-center gap-1 font-medium">
                              <IconClock size={13} className="text-slate-400" /> ~{node.hours}h học
                            </span>
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                              <IconTrendingUp size={13} /> {node.salaryBoost} Lương
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Node Inspection Modal */}
          <AnimatePresence>
            {selectedNode && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 mb-1">
                        Level {selectedNode.layer} • {selectedNode.category}
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedNode.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <IconX size={18} />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {selectedNode.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">Thời gian hoàn thành:</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">
                        ~{selectedNode.hours} Giờ thực hành
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 block font-medium">Tác động thu nhập:</span>
                      <span className="font-black text-emerald-800 mt-0.5 block">
                        {selectedNode.salaryBoost} Mức deal lương
                      </span>
                    </div>
                  </div>

                  {/* Status Switcher Buttons */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">
                      Cập nhật trạng thái của bạn với kỹ năng này:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { key: "mastered", label: "Đã thành thạo", color: "bg-emerald-600 text-white" },
                          { key: "in_progress", label: "Đang học", color: "bg-blue-600 text-white" },
                          { key: "gap", label: "Cần học bù", color: "bg-amber-600 text-white" }
                        ] as const
                      ).map((st) => (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => updateNodeStatus(selectedNode.id, st.key)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                            selectedNode.status === st.key
                              ? st.color + " shadow-sm ring-2 ring-slate-900"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resources */}
                  {selectedNode.resources.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <IconBook size={14} /> Tài liệu đề xuất chính thức:
                      </span>
                      <div className="space-y-1.5">
                        {selectedNode.resources.map((res, i) => (
                          <a
                            key={i}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-all flex items-center justify-between"
                          >
                            <span className="truncate pr-2">{res.title}</span>
                            <IconExternalLink size={13} className="shrink-0 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </section>

        {/* ── 3. MODULE 2: AI SKILL-GAP DIAGNOSTIC ENGINE (FROM CV) ─────────── */}
        <section id="generator-section" className="bg-white rounded-[32px] border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 mb-2">
                <IconSparkles size={14} /> <span>AI Skill-Gap Diagnostic</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Chẩn Đoán Khoảng Cách Năng Lực Dành Riêng Cho CV Của Bạn
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-normal">
                AI trích xuất toàn bộ kinh nghiệm trong CV, đối chiếu với tiêu chuẩn tuyển dụng cấp cao để lập lộ trình từng giai đoạn.
              </p>
            </div>

            <Link to="/ai/matching">
              <Button variant="outline" size="sm" className="rounded-full font-bold text-xs bg-white border-slate-200 cursor-pointer">
                Đến Hub AI Matching
              </Button>
            </Link>
          </div>

          {/* Guest State / Form */}
          {resumesLoading ? (
            <div className="py-8">
              <PageSpinner message="Đang kết nối danh sách CV của bạn..." />
            </div>
          ) : !user ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold">
                <IconCompass size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Đăng nhập để AI đọc CV và tạo lộ trình chính xác 100%
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                Hệ thống sẽ dựa trên kỹ năng thực tế hiện tại của bạn trong CV để loại trừ những kiến thức bạn đã có, chỉ tập trung dạy đúng kỹ năng bạn còn thiếu.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link to="/login">
                  <Button className="h-11 px-7 rounded-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer">
                    Đăng nhập tài khoản Ứng viên
                  </Button>
                </Link>
                <Link to="/cv/new">
                  <Button variant="outline" className="h-11 px-6 rounded-full font-bold text-xs bg-white border-slate-200 cursor-pointer">
                    Tạo CV chuẩn ATS trước
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-5 space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <IconFileText size={15} className="text-emerald-600" /> Chọn CV gốc ({resumes.length} bản):
                  </label>
                  <select
                    value={selectedResumeId ?? ""}
                    onChange={(e) => setSelectedResumeId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer shadow-2xs"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} (Cập nhật: {new Date(r.created_at).toLocaleDateString("vi-VN")})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-5 space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <IconTarget size={15} className="text-emerald-600" /> Vị trí công nghệ bạn muốn hướng tới:
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Ví dụ: Senior Backend Developer, AI Engineer, Tech Lead..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      fullWidth
                      isLoading={loading}
                      disabled={!selectedResumeId || !targetRole.trim()}
                      onClick={handleGenerate}
                      className="h-11 rounded-2xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <IconSparkles size={15} />
                      <span>Chẩn Đoán AI</span>
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Quick Pick Preset Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <IconBolt size={14} className="text-amber-500" /> Chọn nhanh vị trí mục tiêu:
                </span>
                {TARGET_ROLE_PRESETS.map((preset) => {
                  const isSelected = targetRole === preset;
                  return (
                    <motion.button
                      key={preset}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setTargetRole(preset)}
                      className={`px-3.5 py-1.5 rounded-full border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-gradient-to-r from-[#00B86B] to-teal-600 border-emerald-500 text-white shadow-md shadow-emerald-600/20"
                          : "bg-emerald-50/60 border-emerald-200/80 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-300"
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      <span>{preset}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700 flex items-center gap-2">
              <IconAlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="p-12 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-3 text-center">
              <Spinner size="lg" color="green" />
              <h4 className="text-sm font-black text-slate-900 mt-2">
                AI đang quét CV và tính toán khoảng cách kỹ năng...
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                Phân tích các dự án thực tế, đối soát với thị trường tuyển dụng và thiết lập các giai đoạn học tập tối ưu.
              </p>
            </div>
          )}

          {/* Generated Result Matrix */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-b from-white to-emerald-50/30 border border-emerald-300 shadow-xl space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs border border-emerald-200">
                      Kết quả chẩn đoán cá nhân hóa
                    </span>
                    <Badge variant="primary" size="sm" className="rounded-full font-bold">
                      {result.steps.length} Giai đoạn then chốt
                    </Badge>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Lộ trình: {result.target_role}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                    <span>Trình độ hiện tại: <strong>{result.current_level}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <IconClock size={14} /> Thời gian hoàn thành: {result.estimated_months} tháng
                    </span>
                  </div>
                </div>

                <Link to="/jobs">
                  <Button size="sm" className="rounded-full font-bold text-xs bg-[#00B86B] hover:bg-[#00995C] text-white shadow-md shadow-emerald-600/20 cursor-pointer">
                    Xem việc làm vị trí này
                  </Button>
                </Link>
              </div>

              {/* Timeline Steps */}
              <div className="space-y-6">
                {result.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                        0{step.order}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                          Giai đoạn {step.order}
                        </span>
                        <h4 className="text-base font-black text-slate-900 leading-snug">
                          {step.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
                      {step.description}
                    </p>

                    {step.skills_to_learn && step.skills_to_learn.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <IconCode size={15} className="text-emerald-600" /> Kỹ năng trọng tâm cần làm chủ:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {step.skills_to_learn.map((sk, si) => (
                            <span
                              key={si}
                              className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {step.resources && step.resources.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                          <IconBook size={13} /> Tài liệu & Khóa học đề xuất:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {step.resources.map((res, ri) => (
                            <a
                              key={ri}
                              href={res.startsWith("http") ? res : `https://${res}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-all flex items-center justify-between"
                            >
                              <span className="truncate pr-2">{res}</span>
                              <IconExternalLink size={13} className="shrink-0 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <AIDisclaimerBanner context="matching" />
            </motion.div>
          )}

        </section>

        {/* ── 4. MODULE 3: REAL-TIME SALARY GROWTH & CAREER ROI CALCULATOR ─── */}
        <section id="salary-calculator" className="bg-gradient-to-br from-slate-900 via-[#0A1A17] to-slate-950 rounded-[36px] text-white p-6 sm:p-10 lg:p-14 border border-emerald-500/20 shadow-2xl space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <IconAdjustmentsHorizontal size={14} /> <span>Financial & Career ROI Simulator</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Mô Phỏng Tăng Trưởng Thu Nhập & ROI Sự Nghiệp 2026
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-light">
                Kéo các thanh trượt để tính toán mức lương kỳ vọng và tổng giá trị tích lũy sau khi hoàn thành lộ trình.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-300 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 self-start md:self-auto">
              Dự báo theo Big Data 2026
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Sliders Controls */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Current Salary Slider */}
              <div className="space-y-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">Mức lương hiện tại của bạn:</span>
                  <span className="text-emerald-400 text-base font-black">
                    {(currentSalary / 1000000).toLocaleString("vi-VN")} Triệu VNĐ / tháng
                  </span>
                </div>
                <input
                  type="range"
                  min={15000000}
                  max={80000000}
                  step={1000000}
                  value={currentSalary}
                  onChange={(e) => setCurrentSalary(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-white/20 accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>15 Triệu</span>
                  <span>45 Triệu</span>
                  <span>80 Triệu</span>
                </div>
              </div>

              {/* Study Hours Slider */}
              <div className="space-y-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">Thời gian đầu tư học mỗi tuần:</span>
                  <span className="text-teal-300 text-base font-black">
                    {studyHoursPerWeek} Giờ / tuần (~{Math.round(studyHoursPerWeek / 7 * 10) / 10}h/ngày)
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={25}
                  step={1}
                  value={studyHoursPerWeek}
                  onChange={(e) => setStudyHoursPerWeek(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-white/20 accent-teal-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>5h (Nhẹ nhàng)</span>
                  <span>15h (Tiêu chuẩn)</span>
                  <span>25h (Tăng tốc)</span>
                </div>
              </div>

              {/* Target Level Switcher */}
              <div className="space-y-2 p-5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-slate-300 block">
                  Cấp bậc mục tiêu hướng tới:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Senior Engineer", mult: 1.45, boost: "+45%" },
                    { label: "Technical Lead", mult: 1.65, boost: "+65%" },
                    { label: "Principal Architect", mult: 1.85, boost: "+85%" }
                  ].map((lvl) => (
                    <button
                      key={lvl.label}
                      type="button"
                      onClick={() => setTargetMultiplier(lvl.mult)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        targetMultiplier === lvl.mult
                          ? "bg-emerald-400 text-slate-950 font-black shadow-md"
                          : "bg-white/10 text-slate-300 hover:bg-white/20"
                      }`}
                    >
                      <div>{lvl.label}</div>
                      <div className="text-[10px] opacity-80">{lvl.boost}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Live Financial Projection Card */}
            <div className="lg:col-span-6">
              <div className="p-7 sm:p-8 rounded-[32px] bg-gradient-to-b from-white/10 to-white/5 border border-emerald-500/30 backdrop-blur-xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Dự Báo Tài Chính Sau 6 Tháng Lộ Trình
                  </span>
                  <Badge variant="success" size="sm" className="rounded-full font-bold">
                    +{Math.round((targetMultiplier - 1) * 100)}% Tăng trưởng
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[11px] text-slate-400 block font-medium">Lương mới ước tính:</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">
                      {(calculatedFutureSalary / 1000000).toLocaleString("vi-VN")} Tr <span className="text-xs text-slate-300 font-normal">/tháng</span>
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[11px] text-slate-400 block font-medium">Thu nhập tăng thêm/tháng:</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-300 mt-1 block">
                      +{(salaryDifference / 1000000).toLocaleString("vi-VN")} Tr
                    </span>
                  </div>
                </div>

                {/* 2 Year Cumulative Gain */}
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-300 font-medium block">
                      Giá trị thu nhập gia tăng sau 2 năm:
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
                      +{(twoYearGain / 1000000).toLocaleString("vi-VN")} Triệu VNĐ
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black">
                    <IconChartBar size={24} />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-light">
                  <IconHelpCircle size={15} className="shrink-0 text-emerald-400" />
                  <span>
                    Dựa trên mức tăng lương trung bình của ứng viên chuyển đổi role thành công trên AI Job Portal.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── 5. MODULE 4: 6 DETAILED ENTERPRISE CAREER TRACKS ─────────────── */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
              <IconSchool size={14} /> <span>Enterprise Career Tracks</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              6 Chuyên Ngành Công Nghệ Đột Phá 2026
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-normal">
              Đầy đủ Lộ trình 12 tuần, Đồ án thực chiến (Capstone Project) và Bộ câu hỏi phỏng vấn kỹ thuật từ Tech Lead.
            </p>
          </div>

          {/* Track Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {CAREER_TRACKS.map((track) => {
              const isActive = activeTrack.id === track.id;
              const IconComp = track.icon;
              return (
                <button
                  key={track.id}
                  onClick={() => {
                    setActiveTrack(track);
                    setOpenFaqTrackIndex(0);
                  }}
                  className={`p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left flex flex-col justify-between gap-3 border ${
                    isActive
                      ? "bg-gradient-to-br from-[#00B86B] to-emerald-700 text-white border-emerald-500 shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-300"
                      : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-950 shadow-2xs"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    }`}
                  >
                    <IconComp size={18} />
                  </div>
                  <div>
                    <span
                      className={`text-[10px] block font-medium ${
                        isActive ? "text-emerald-100" : "text-slate-400"
                      }`}
                    >
                      {track.tag}
                    </span>
                    <span
                      className={`font-black text-xs line-clamp-2 leading-snug ${
                        isActive ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {track.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Track Deep Dive Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTrack.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 sm:p-10 rounded-[32px] bg-white border border-slate-200 shadow-xs space-y-8"
            >
              {/* Header Overview */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {activeTrack.tag}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Thời lượng: {activeTrack.timeline}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {activeTrack.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-3xl font-light leading-relaxed">
                    {activeTrack.summary}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-right shrink-0">
                  <span className="text-[11px] text-emerald-700 font-bold block">Thu nhập kỳ vọng:</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-900 mt-0.5 block">
                    {activeTrack.salaryRange}
                  </span>
                </div>
              </div>

              {/* Capstone Project Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <IconFolderCheck size={18} className="text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Đồ Án Thực Chiến Mẫu (Capstone Project cho CV)
                    </span>
                  </div>
                  <Badge variant="primary" size="sm" className="rounded-full font-bold">
                    Portfolio Grade
                  </Badge>
                </div>

                <h4 className="text-lg sm:text-xl font-black text-white">
                  {activeTrack.capstoneProject.title}
                </h4>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                  {activeTrack.capstoneProject.description}
                </p>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-400 block">Công nghệ sử dụng:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTrack.capstoneProject.techStack.map((tech, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-bold border border-white/10">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-amber-300 block">Cách viết điểm sáng này vào CV:</span>
                  <p className="italic">"{activeTrack.capstoneProject.cvBulletPoint}"</p>
                </div>
              </div>

              {/* 12-Week Sprints Breakdown */}
              <div className="space-y-4">
                <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <IconRoute size={20} className="text-emerald-600" />
                  <span>Kế Hoạch Hành Động 12 Tuần (Weekly Sprints)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTrack.sprints.map((sp) => (
                    <div key={sp.sprintNumber} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="text-xs font-black text-emerald-800">
                          Sprint 0{sp.sprintNumber}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                          {sp.weekRange}
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-slate-900">{sp.focus}</h5>
                      <ul className="space-y-2">
                        {sp.tasks.map((task, ti) => {
                          const taskId = `${activeTrack.id}_${sp.sprintNumber}_${task}`;
                          const isDone = !!completedTasks[taskId];
                          return (
                            <li
                              key={ti}
                              onClick={() => toggleTask(taskId)}
                              className="text-xs text-slate-700 flex items-start gap-2 cursor-pointer select-none hover:text-emerald-700"
                            >
                              <span className="mt-0.5 shrink-0 text-emerald-600">
                                {isDone ? <IconSquareCheck size={16} /> : <IconSquare size={16} className="text-slate-400" />}
                              </span>
                              <span className={isDone ? "line-through opacity-60" : ""}>{task}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Hard Interview Questions */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <IconHelpCircle size={20} className="text-emerald-600" />
                  <span>Bộ Câu Hỏi Phỏng Vấn Kỹ Thuật Hóc Búa Nhất</span>
                </h4>

                <div className="divide-y divide-slate-100">
                  {activeTrack.interviewQuestions.map((iq, iqi) => {
                    const isOpen = openFaqTrackIndex === iqi;
                    return (
                      <div key={iqi} className="py-3.5">
                        <button
                          onClick={() => setOpenFaqTrackIndex(isOpen ? null : iqi)}
                          className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          <span>Q{iqi + 1}: {iq.question}</span>
                          {isOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} className="text-slate-400" />}
                        </button>
                        {isOpen && (
                          <div className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-light p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <strong className="text-emerald-800 font-bold block mb-1">Trọng tâm câu trả lời từ Tech Lead:</strong>
                            {iq.keyPoints}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action: Export to Markdown */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Bạn có thể tải toàn bộ lộ trình của track này về máy dưới định dạng Markdown để ghi chú trong Notion hoặc Obsidian.
                </div>
                <Button
                  onClick={handleExportMarkdown}
                  className="h-10 px-5 rounded-full font-bold text-xs bg-gradient-to-r from-[#00B86B] to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <IconDownload size={15} />
                  <span>Xuất Lộ Trình (Markdown / Notion)</span>
                </Button>
              </div>

            </motion.div>
          </AnimatePresence>
        </section>

        {/* ── 6. GLOBAL TECHNICAL FAQ ACCORDION ────────────────────────────── */}
        <section className="bg-white rounded-[32px] border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              <IconBulb size={14} className="text-amber-500" /> <span>Giải đáp băn khoăn</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Câu Hỏi Thường Gặp Về Lộ Trình Kỹ Năng AI
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              {
                q: "Lộ trình do AI sinh ra có cập nhật các công nghệ mới nhất 2026 không?",
                a: "Có. Thuật toán của chúng tôi được đồng bộ và cập nhật liên tục với xu hướng tuyển dụng B2B thực tế từ hàng chục ngàn Job Description trên thị trường, đảm bảo các framework và công cụ đề xuất luôn là các phiên bản mới nhất."
              },
              {
                q: "Tôi nên dành bao nhiêu giờ mỗi tuần để hoàn thành đúng tiến độ?",
                a: "Với mỗi lộ trình 6-12 tuần, thời gian khuyến nghị là 8-12 giờ/tuần (tương đương 1.5 - 2 giờ mỗi tối). Các giai đoạn đều được chia nhỏ thành từng tuần giúp bạn vừa đi làm vừa học mà không bị quá tải."
              },
              {
                q: "Học xong lộ trình thì tỷ lệ đỗ phỏng vấn và đạt mức lương kỳ vọng là bao nhiêu?",
                a: "Theo thống kê từ các ứng viên đã hoàn thành tối thiểu 80% checklist kỹ năng trên nền tảng, tỷ lệ vượt qua vòng Technical Interview đạt trên 88% và mức lương thỏa thuận tăng trung bình từ 45% đến 65% so với mức lương cũ."
              },
              {
                q: "Tôi có thể yêu cầu AI tái cấu trúc lại lộ trình nếu đổi mục tiêu nghề nghiệp không?",
                a: "Hoàn toàn có thể. Bạn có thể thay đổi chức danh mục tiêu bất kỳ lúc nào hoặc chọn một bản CV khác để AI tính toán lại khoảng cách kỹ năng tức thì."
              }
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="py-4">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 text-left font-bold text-sm sm:text-base hover:text-emerald-700 transition-colors cursor-pointer py-1"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <IconChevronUp size={18} className="text-emerald-600 shrink-0" />
                    ) : (
                      <IconChevronDown size={18} className="text-slate-400 shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light pt-2 pr-4 overflow-hidden"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* 7. UNIFIED SINGLE FOOTER */}
      <Footer showTopCTA={false} />
    </div>
  );
};

export default RoadmapPage;
