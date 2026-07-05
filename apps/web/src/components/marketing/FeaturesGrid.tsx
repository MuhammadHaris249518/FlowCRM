import {
  Users,
  BarChart3,
  Sparkles,
  Zap,
  MessageSquare,
  CalendarDays,
  LineChart,
  Link2,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: Users,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Lead Management",
    description:
      "Capture leads from any source, qualify them with AI, and never lose an opportunity.",
  },
  {
    icon: BarChart3,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "Sales Pipeline",
    description:
      "Visualize your sales process, track deals, and forecast revenue with confidence.",
  },
  {
    icon: Sparkles,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "AI Assistant",
    description:
      "Get AI-powered insights, auto-generated emails, follow-ups, and smart recommendations.",
  },
  {
    icon: Zap,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    title: "Automation",
    description:
      "Automate follow-ups, tasks, workflows, and notifications to save hours every week.",
  },
  {
    icon: MessageSquare,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-600",
    title: "Communication Hub",
    description: "Manage Email, SMS, WhatsApp conversations in one unified inbox.",
  },
  {
    icon: CalendarDays,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    title: "Calendar & Booking",
    description: "Schedule meetings, sync calendars, and automate reminders.",
  },
  {
    icon: LineChart,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    title: "Reports & Analytics",
    description: "Track performance, analyze data, and make smarter business decisions.",
  },
  {
    icon: Link2,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    title: "Integrations",
    description: "Connect your favorite tools and apps to streamline your entire workflow.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="bg-surface-muted py-20">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
            Everything You Need
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Powerful Features to Scale Your Business
          </h2>
          <p className="mt-3 text-base text-ink-500">
            All the tools you need to attract, engage, and convert more customers.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-surface-border bg-white p-6 shadow-card transition-shadow hover:shadow-panel"
            >
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${feature.iconBg}`}
              >
                <feature.icon className={`h-5 w-5 ${feature.iconColor}`} aria-hidden />
              </div>
              <h3 className="text-sm font-semibold text-ink-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
