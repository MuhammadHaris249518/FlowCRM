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

export interface EmailDraftContext {
  contactName?: string | null;
  companyName?: string | null;
  leadStatus?: string | null;
  leadSource?: string | null;
  dealStage?: string | null;
  dealTitle?: string | null;
  notes?: string | null;
}

export interface EmailDraftRequest {
  instructions: string;
  context: EmailDraftContext;
}

export interface EmailDraftJobCreated {
  jobId: string;
  status: string;
}

export interface EmailDraftResult {
  subject: string;
  body: string;
  revisionCount: number;
  finalFeedback: string;
}

export interface EmailDraftJobStatus {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  result: EmailDraftResult | null;
  error: string | null;
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

  async createEmailDraft(input: EmailDraftRequest): Promise<EmailDraftJobCreated> {
    const res = await fetch(`${AI_SERVICE_URL}/email/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Service-Key": INTERNAL_SERVICE_KEY,
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw new Error(`ai-service POST /email/draft failed with status ${res.status}`);
    }

    return res.json();
  },

  async getEmailDraftStatus(jobId: string): Promise<EmailDraftJobStatus> {
    const res = await fetch(`${AI_SERVICE_URL}/email/draft/${jobId}`, {
      headers: { "X-Internal-Service-Key": INTERNAL_SERVICE_KEY },
    });

    if (!res.ok) {
      throw new Error(`ai-service GET /email/draft/${jobId} failed with status ${res.status}`);
    }

    return res.json();
  },
};
