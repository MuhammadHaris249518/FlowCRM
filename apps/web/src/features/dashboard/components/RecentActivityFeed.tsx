import type { Activity } from "../types";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

const TYPE_DOT: Record<string, string> = {
  LEAD_CREATED: "bg-blue-400",
  EMAIL_SENT: "bg-emerald-400",
  CALL_LOGGED: "bg-amber-400",
  MEETING_SCHEDULED: "bg-amber-400",
  DEAL_STAGE_CHANGED: "bg-brand-400",
  NOTE_ADDED: "bg-ink-300",
  TASK_COMPLETED: "bg-emerald-400",
};

export function RecentActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-ink-900">Recent Activities</h2>

      {activities.length === 0 ? (
        <p className="text-sm text-ink-500">No activity yet — it'll show up here as your team works leads and deals.</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-start gap-3">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  TYPE_DOT[activity.type] ?? "bg-ink-300"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm text-ink-700">{activity.message}</p>
              </div>
              <span className="shrink-0 text-xs text-ink-300">{timeAgo(activity.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
