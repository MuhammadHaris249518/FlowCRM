import type { AuthContext } from "../../middleware/auth";
import { aiServiceClient } from "../../lib/ai-service-client";
import { dashboardService } from "../dashboard/dashboard.service";
import { reportsService } from "../reports/reports.service";
import { leadsService } from "../leads/leads.service";
import { assistantRepository } from "./assistant.repository";
import type { AssistantActionDTO, AssistantToolDefinition } from "./assistant.types";

const EMAIL_DRAFT_POLL_MS = 400;
const EMAIL_DRAFT_TIMEOUT_MS = 20_000;

export const ASSISTANT_TOOLS: AssistantToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_workspace_snapshot",
      description:
        "High-level counts for this user's scope: revenue/leads this month, pipeline by stage, follow-up leads, stuck deals, overdue tasks.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_leads",
      description:
        "Search leads. Use sortBy=score to find the best target / highest-scoring leads.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Match contact name or email" },
          status: {
            type: "string",
            enum: ["NEW", "CONTACTED", "QUALIFIED", "DISQUALIFIED", "CONVERTED"],
          },
          minScore: { type: "integer", minimum: 0, maximum: 100 },
          sortBy: { type: "string", enum: ["score", "createdAt", "updatedAt"] },
          limit: { type: "integer", minimum: 1, maximum: 15 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_lead",
      description: "Get one lead by id, including contact, company, notes, and score.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_contacts",
      description: "Search contacts by name or email.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 15 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_companies",
      description: "Search companies by name.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 15 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_deals",
      description:
        "Search pipeline deals. Use stuckDays (e.g. 5) to find deals that have not moved.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          stage: {
            type: "string",
            enum: [
              "NEW",
              "CONTACTED",
              "QUALIFIED",
              "MEETING",
              "PROPOSAL",
              "NEGOTIATION",
              "WON",
              "LOST",
            ],
          },
          stuckDays: { type: "integer", minimum: 1 },
          limit: { type: "integer", minimum: 1, maximum: 15 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_deal",
      description: "Get one deal by id.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_tasks",
      description: "Search tasks. Set overdue=true for past-due open tasks.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          overdue: { type: "boolean" },
          completed: { type: "boolean" },
          limit: { type: "integer", minimum: 1, maximum: 15 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_reports",
      description: "Conversion funnel, win/loss (including lost reasons), or monthly trends.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["funnel", "win_loss", "trends"] },
          range: { type: "string", enum: ["this_week", "this_month", "this_quarter"] },
          months: { type: "integer", minimum: 3, maximum: 12 },
        },
        required: ["kind"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_messages",
      description: "List email thread messages for a lead or contact. Does not send mail.",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "string" },
          contactId: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 15 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_workflows",
      description: "List automation workflows in this organization (name, active, node count).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_documents",
      description: "List documents. libraryOnly=true for reusable library files.",
      parameters: {
        type: "object",
        properties: {
          libraryOnly: { type: "boolean" },
          limit: { type: "integer", minimum: 1, maximum: 15 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "score_lead",
      description:
        "Run Groq AI scoring on one lead and persist the score. Requires a real lead id from search_leads or get_lead.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_email",
      description:
        "Draft an outreach email for a lead via the AI email loop. Creates a DRAFT message and a review Task. Never sends.",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "string" },
          instructions: {
            type: "string",
            description: "What the email should accomplish, 1–2000 characters.",
          },
        },
        required: ["leadId", "instructions"],
      },
    },
  },
];

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

async function waitForEmailDraft(jobId: string) {
  const deadline = Date.now() + EMAIL_DRAFT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const status = await aiServiceClient.getEmailDraftStatus(jobId);
    if (status.status === "completed" && status.result) return status.result;
    if (status.status === "failed") {
      throw new Error(status.error ?? "Email draft job failed");
    }
    await new Promise((resolve) => setTimeout(resolve, EMAIL_DRAFT_POLL_MS));
  }
  throw new Error("Timed out waiting for the email draft");
}

export async function executeAssistantTool(
  auth: AuthContext,
  name: string,
  args: Record<string, unknown>,
  actions: AssistantActionDTO[]
): Promise<unknown> {
  switch (name) {
    case "get_workspace_snapshot": {
      const [summary, pipeline, insights] = await Promise.all([
        dashboardService.getSummary(auth, "this_month"),
        dashboardService.getPipelineOverview(auth),
        dashboardService.getAiInsights(auth),
      ]);
      return { summary, pipeline, insights };
    }
    case "search_leads":
      return assistantRepository.searchLeads(auth, {
        search: asString(args.search),
        status: asString(args.status),
        minScore: asNumber(args.minScore),
        sortBy: asString(args.sortBy) as "score" | "createdAt" | "updatedAt" | undefined,
        limit: asNumber(args.limit),
      });
    case "get_lead": {
      const id = asString(args.id);
      if (!id) return { error: "id is required" };
      const lead = await assistantRepository.getLead(auth, id);
      return lead ?? { error: "Lead not found in your scope" };
    }
    case "search_contacts":
      return assistantRepository.searchContacts(auth, {
        search: asString(args.search),
        limit: asNumber(args.limit),
      });
    case "search_companies":
      return assistantRepository.searchCompanies(auth, {
        search: asString(args.search),
        limit: asNumber(args.limit),
      });
    case "search_deals":
      return assistantRepository.searchDeals(auth, {
        search: asString(args.search),
        stage: asString(args.stage),
        stuckDays: asNumber(args.stuckDays),
        limit: asNumber(args.limit),
      });
    case "get_deal": {
      const id = asString(args.id);
      if (!id) return { error: "id is required" };
      const deal = await assistantRepository.getDeal(auth, id);
      return deal ?? { error: "Deal not found in your scope" };
    }
    case "search_tasks":
      return assistantRepository.searchTasks(auth, {
        search: asString(args.search),
        overdue: asBoolean(args.overdue),
        completed: asBoolean(args.completed),
        limit: asNumber(args.limit),
      });
    case "get_reports": {
      const kind = asString(args.kind);
      const range =
        (asString(args.range) as "this_week" | "this_month" | "this_quarter" | undefined) ??
        "this_month";
      if (kind === "funnel") return reportsService.getConversionFunnel(auth, range);
      if (kind === "win_loss") return reportsService.getWinLossReport(auth, range);
      if (kind === "trends") return reportsService.getTrends(auth, asNumber(args.months) ?? 6);
      return { error: "kind must be funnel, win_loss, or trends" };
    }
    case "list_messages":
      return assistantRepository.listMessages(auth, {
        leadId: asString(args.leadId),
        contactId: asString(args.contactId),
        limit: asNumber(args.limit),
      });
    case "list_workflows":
      return assistantRepository.listWorkflows(auth);
    case "list_documents":
      return assistantRepository.listDocuments(auth, {
        libraryOnly: asBoolean(args.libraryOnly),
        limit: asNumber(args.limit),
      });
    case "score_lead": {
      const id = asString(args.id);
      if (!id) return { error: "id is required" };
      const result = await leadsService.scoreWithAi(auth, id);
      actions.push({
        type: "lead_scored",
        leadId: result.lead.id,
        score: result.lead.score,
        reasoning: result.reasoning,
      });
      return {
        leadId: result.lead.id,
        contactName: result.lead.contactName,
        score: result.lead.score,
        reasoning: result.reasoning,
      };
    }
    case "draft_email": {
      const leadId = asString(args.leadId);
      const instructions = asString(args.instructions);
      if (!leadId || !instructions) return { error: "leadId and instructions are required" };
      if (instructions.length > 2000) return { error: "instructions must be 2000 characters or fewer" };

      const lead = await assistantRepository.getLead(auth, leadId);
      if (!lead) return { error: "Lead not found in your scope" };

      const job = await aiServiceClient.createEmailDraft({
        instructions,
        context: {
          contactName: lead.contact?.fullName ?? null,
          companyName: lead.contact?.company?.name ?? null,
          leadStatus: lead.status,
          leadSource: lead.source,
          notes: lead.notes,
        },
      });
      const drafted = await waitForEmailDraft(job.jobId);
      const artifacts = await assistantRepository.createEmailDraftArtifacts({
        organizationId: auth.organizationId,
        userId: auth.userId,
        leadId: lead.id,
        contactId: lead.contact?.id ?? null,
        toAddress: lead.contact?.email ?? null,
        subject: drafted.subject,
        body: drafted.body,
        revisionCount: drafted.revisionCount,
      });
      actions.push({
        type: "email_draft",
        messageId: artifacts.messageId,
        taskId: artifacts.taskId,
        leadId: lead.id,
        subject: drafted.subject,
      });
      return {
        sent: false,
        messageId: artifacts.messageId,
        taskId: artifacts.taskId,
        subject: drafted.subject,
        body: drafted.body,
        toAddress: lead.contact?.email ?? null,
        note: "Draft saved for human review. It was not sent.",
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
