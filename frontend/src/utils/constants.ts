export const SUBJECTS = [
  { slug: "python", name: "Python", emoji: "🐍" },
  { slug: "sql", name: "SQL", emoji: "💾" },
  { slug: "excel", name: "Excel", emoji: "📊" },
  { slug: "power-bi", name: "Power BI", emoji: "📈" },
  { slug: "statistics", name: "Statistics", emoji: "📉" },
  { slug: "machine-learning", name: "Machine Learning", emoji: "🤖" },
  { slug: "deep-learning", name: "Deep Learning", emoji: "🧠" },
  { slug: "nlp", name: "NLP", emoji: "💬" },
  { slug: "cloud", name: "Cloud", emoji: "☁️" },
  { slug: "linux", name: "Linux", emoji: "🐧" },
  { slug: "hr-interview", name: "HR Interview", emoji: "💼" },
  { slug: "aptitude", name: "Aptitude", emoji: "📝" },
] as const;

export const COMPANIES = [
  "Amazon",
  "Google",
  "Microsoft",
  "TCS",
  "Infosys",
  "Deloitte",
  "Accenture",
  "Capgemini",
] as const;

export const QUIZ_QUESTION_COUNTS = [10, 15, 20, 30, "all"] as const;

export const QUIZ_TIMER_OPTIONS = [
  { label: "No Timer", value: 0 },
  { label: "5 Minutes", value: 5 },
  { label: "10 Minutes", value: 10 },
  { label: "20 Minutes", value: 20 },
  { label: "30 Minutes", value: 30 },
] as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  SUBJECTS: "/subjects",
  SUBJECT: (slug: string) => `/subjects/${slug}`,
  NOTES: (slug: string) => `/subjects/${slug}/notes`,
  QUIZ: (slug: string) => `/subjects/${slug}/quiz`,
  MOCK_INTERVIEW: (slug: string) => `/subjects/${slug}/mock-interview`,
  CODING: (slug: string) => `/subjects/${slug}/coding`,
  AI_CHAT: (slug: string) => `/subjects/${slug}/ai-assistant`,
  PROGRESS: "/progress",
  RESUME_INTERVIEW: "/resume-interview",
  COMPANY_INTERVIEW: "/company-interview",
  ADMIN: "/admin",
} as const;

export const ACCESS_TOKEN_KEY = "if_access_token";
export const REFRESH_TOKEN_KEY = "if_refresh_token";
