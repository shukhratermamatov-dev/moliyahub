// Общая модель бизнес-плана, сформированного ИИ. Используется генерацией
// (lib/ai/business-plan.ts), экспортом в Excel/PDF (lib/business-plan/*) и
// сохранением в личный кабинет (Supabase-таблица business_plans, data jsonb).

export type BusinessPlanStage = "IDEA" | "MVP" | "GROWTH" | "SCALE";

export type BusinessPlanInput = {
  industryId: string;
  subIndustryId?: string;
  projectName: string;
  idea: string;
  region: string;
  investmentAmount: number;
  stage: BusinessPlanStage;
  teamSize?: string;
  timeframeMonths?: number;
};

export type BusinessPlanSource = {
  title: string;
  url: string;
};

export type BusinessPlanForeignMarket = {
  country: string;
  body: string;
};

export type BusinessPlanFinancialLine = {
  label: string;
  amount: number;
  note?: string;
};

export type BusinessPlanFinancials = {
  currency: "UZS";
  initialInvestment: number;
  startupCosts: BusinessPlanFinancialLine[];
  monthlyRevenue: BusinessPlanFinancialLine[];
  monthlyCosts: BusinessPlanFinancialLine[];
  breakEvenMonths: number;
  paybackMonths: number;
  assumptions: string;
};

export type BusinessPlan = {
  projectName: string;
  industryLabel: string;
  subIndustryLabel?: string;
  region: string;
  idea: string;
  generatedAt: string;
  executiveSummary: string;
  companyDescription: string;
  marketAnalysisUzbekistan: string;
  marketAnalysisForeign: BusinessPlanForeignMarket[];
  marketing: string;
  operations: string;
  organization: string;
  risks: string;
  financials: BusinessPlanFinancials;
  sources: BusinessPlanSource[];
};
