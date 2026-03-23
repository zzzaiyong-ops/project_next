export interface Stage {
  id: number;
  name: string;
  short: string;
  color: string;
  bg: string;
}

export interface Product {
  id: number;
  name: string;
  company: string;
  brand: string;
  cat: string;
  code: string;
  price: number;
  ship: string;
  owner: string;
  stock: number;
  revenue: number;
  infSize: string;
  period: string;
  desc: string;
}

export interface Campaign {
  id: number;
  productName: string;
  stage: string;
  brand: string;
  cat: string;
  owner: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: string;
  mcn?: string;
  mcnList?: McnEntry[];
  [key: string]: unknown;
}

export interface McnEntry {
  agency: string;
  [key: string]: unknown;
}

export interface Influencer {
  id: number;
  name: string;
  channel: string;
  followers: number;
  cat: string;
  tier: string;
  [key: string]: unknown;
}

export interface Match {
  id: number;
  campaignId: number;
  influencerId: number;
  status: string;
  [key: string]: unknown;
}

export interface Settlement {
  id: number;
  campaignId: number;
  amount: number;
  status: string;
  [key: string]: unknown;
}

export interface AppDB {
  products: Product[];
  campaigns: Campaign[];
  influencers: Influencer[];
  matches: Match[];
  mcnRequests: unknown[];
  appMarketing: unknown[];
  settlements: Settlement[];
  progress: unknown[];
  activities: unknown[];
  comments: Record<string, unknown>;
  files: Record<string, unknown>;
  history: Record<string, unknown>;
  notifications: unknown[];
}

export type UserRole = "admin" | "manager" | "md" | "viewer" | "external_mcn";

export interface UserInfo {
  name: string;
  email: string;
  role: UserRole;
  uid: string;
  mcnCompany?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "전체 관리자",
  manager: "내부 담당자",
  md: "내부 MD",
  viewer: "내부 조회자",
  external_mcn: "외부 MCN",
};

export const STAGES: Stage[] = [
  { id: 1, name: "1.캠페인요청", short: "캠페인요청", color: "#6c5ce7", bg: "rgba(108,92,231,0.15)" },
  { id: 2, name: "2.캠페인확정", short: "캠페인확정", color: "#0984e3", bg: "rgba(9,132,227,0.15)" },
  { id: 3, name: "3.상품정보등록", short: "상품정보등록", color: "#00cec9", bg: "rgba(0,206,201,0.15)" },
  { id: 4, name: "4.MCN요청", short: "MCN요청", color: "#fd79a8", bg: "rgba(253,121,168,0.15)" },
  { id: 5, name: "5.인플루언서확정", short: "인플확정", color: "#e17055", bg: "rgba(225,112,85,0.15)" },
  { id: 6, name: "6.APP마케팅확정", short: "APP마케팅", color: "#fdcb6e", bg: "rgba(253,203,110,0.15)" },
  { id: 7, name: "7.정산", short: "정산", color: "#00b894", bg: "rgba(0,184,148,0.15)" },
  { id: 8, name: "8.성과분석", short: "성과분석", color: "#a29bfe", bg: "rgba(162,155,254,0.15)" },
];
