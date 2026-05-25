import { generateDeepInsights } from "@/lib/ai/deep-insights";
import type { AIInsightPayload } from "./AIInsightsPanel";

export function mapDeepInsightsToPayload(data: any): AIInsightPayload {
  const summary = data?.summary || "Nenhum insight disponível.";
  const opportunities = (data?.opportunities || [])
    .map((item: any) => item?.detail || item?.title)
    .filter(Boolean);
  const risks = (data?.risks || [])
    .map((item: any) => item?.detail || item?.title)
    .filter(Boolean);
  const recommendationsSource = data?.recommendations?.length ? data.recommendations : data?.dailyInsights || [];
  const recommendations = recommendationsSource
    .map((item: any) => (item?.title && item?.detail ? `${item.title}: ${item.detail}` : item?.detail || item?.title))
    .filter(Boolean);

  const riskLevel: AIInsightPayload["riskLevel"] = risks.length > 2 ? "alto" : risks.length ? "medio" : "baixo";

  return {
    summary,
    opportunities,
    risks,
    recommendations,
    riskLevel,
    generatedAt: new Date().toISOString(),
  };
}

export async function refreshOperationalInsights(): Promise<AIInsightPayload> {
  const deepInsights = await generateDeepInsights();
  return mapDeepInsightsToPayload(deepInsights);
}
