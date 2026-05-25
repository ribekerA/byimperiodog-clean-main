"use server";

import type { AIInsightPayload } from "./AIInsightsPanel";
import { refreshOperationalInsights } from "./insights";

export async function refreshOperationalInsightsAction(): Promise<AIInsightPayload> {
  return refreshOperationalInsights();
}
