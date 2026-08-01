const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? "";

export interface ScoreLeadRequest {
  source: string | null;
  notes: string | null;
  status: string;
  daysSinceCreated: number;
  contact: {
    hasFullName: boolean;
    hasEmail: boolean;
    hasPhone: boolean;
    companyName: string | null;
    companyDomain: string | null;
  } | null;
}

export interface ScoreLeadResponse {
  score: number;
  reasoning: string;
}

export const aiServiceClient = {
  async scoreLead(input: ScoreLeadRequest): Promise<ScoreLeadResponse> {
    const res = await fetch(`${AI_SERVICE_URL}/score-lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Service-Key": INTERNAL_SERVICE_KEY,
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw new Error(`ai-service /score-lead failed with status ${res.status}`);
    }

    return res.json();
  },
};
