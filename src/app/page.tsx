import Link from "next/link";
import HackerCompletenessChart from "@/components/analytics/hackerCompleteness/Chart";
import { computeHackerCompleteness } from "@/components/analytics/hackerCompleteness/compute";
import HackerGrowthChart from "@/components/analytics/hackerGrowth/Chart";
import { computeHackerGrowth } from "@/components/analytics/hackerGrowth/compute";
import ProjectStatusesChart from "@/components/analytics/projectStatuses/Chart";
import { computeProjectStatuses } from "@/components/analytics/projectStatuses/compute";
import ProjectCompletenessChart from "@/components/analytics/projectCompleteness/Chart";
import { computeProjectCompleteness } from "@/components/analytics/projectCompleteness/compute";
import ProjectStatisticsChart from "@/components/analytics/projectStatistics/Chart";
import { computeProjectStatistics } from "@/components/analytics/projectStatistics/compute";
import ProjectGrowthChart from "@/components/analytics/projectGrowth/Chart";
import { computeProjectGrowth } from "@/components/analytics/projectGrowth/compute";
import ProlificParticipantsChart from "@/components/analytics/prolificParticipants/Chart";
import { computeProlificParticipants } from "@/components/analytics/prolificParticipants/compute";
import ProlificLeadsChart from "@/components/analytics/prolificLeads/Chart";
import { computeProlificLeads } from "@/components/analytics/prolificLeads/compute";
import ProjectTagsChart from "@/components/analytics/projectTags/Chart";
import { computeProjectTags } from "@/components/analytics/projectTags/compute";

export const dynamic = "force-dynamic";

// Server Component
type ViewKey =
  | "hacker-completeness"
  | "hacker-growth"
  | "project-growth"
  | "project-statuses"
  | "project-completeness"
  | "project-statistics"
  | "project-tags"
  | "prolific-participants"
  | "prolific-leads";

const VIEWS: Array<{ key: ViewKey; label: string }> = [
  { key: "project-statistics", label: "Project Statistics" },
  { key: "prolific-leads", label: "Prolific Leads" },
  { key: "prolific-participants", label: "Prolific Participants" },
  { key: "hacker-completeness", label: "Hacker Completeness" },
  { key: "hacker-growth", label: "Hacker Growth" },
  { key: "project-growth", label: "Project Growth" },
  { key: "project-statuses", label: "Project Statuses" },
  { key: "project-completeness", label: "Project Completeness" },
  { key: "project-tags", label: "Project Tags" },
];

export default async function TestPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  try {
    const sp = await searchParams;
    const view = (sp?.view as ViewKey) ?? "project-statistics";

    // Computing ONLY the selected analytic to minimize DB connections
    let content: React.ReactNode = null;
    switch (view) {
      case "hacker-completeness": {
        const data = await computeHackerCompleteness();
        content = <HackerCompletenessChart data={data} />;
        break;
      }
      case "hacker-growth": {
        const data = await computeHackerGrowth();
        content = <HackerGrowthChart data={data} />;
        break;
      }
      case "project-growth": {
        const data = await computeProjectGrowth();
        content = <ProjectGrowthChart data={data} />;
        break;
      }
      case "project-statuses": {
        const data = await computeProjectStatuses();
        content = <ProjectStatusesChart data={data} />;
        break;
      }
      case "project-completeness": {
        const data = await computeProjectCompleteness();
        content = <ProjectCompletenessChart data={data} />;
        break;
      }
      case "project-statistics": {
        const project_stats_data = await computeProjectStatistics();
        const tags_data = await computeProjectTags();
        content = (
          <ProjectStatisticsChart
            project_stats_data={project_stats_data}
            tags_data={tags_data}
          />
        );
        break;
      }
      case "project-tags": {
        const data = await computeProjectTags();
        content = <ProjectTagsChart data={data} />;
        break;
      }
      case "prolific-participants": {
        const data = await computeProlificParticipants(20);
        content = <ProlificParticipantsChart data={data} />;
        break;
      }
      case "prolific-leads": {
        const data = await computeProlificLeads(20);
        content = <ProlificLeadsChart data={data} />;
        break;
      }
      default: {
        const data = await computeHackerGrowth();
        content = <HackerGrowthChart data={data} />;
      }
    }

    return (
      <main style={{ padding: 24 }}>
        <nav
          style={{
            display: "flex",
            gap: 8,
            borderBottom: "1px solid #1f2937",
            paddingBottom: 8,
            marginBottom: 16,
          }}
        >
          {VIEWS.map((v) => {
            const active = v.key === view;
            return (
              <Link
                key={v.key}
                href={`?view=${v.key}`}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontWeight: 600,
                  color: active ? "#0ea5e9" : "#e5e7eb",
                  background: active ? "#0b1020" : "transparent",
                  border: active
                    ? "1px solid #0ea5e9"
                    : "1px solid transparent",
                }}
              >
                {v.label}
              </Link>
            );
          })}
        </nav>

        {content}
      </main>
    );
  } catch (err) {
    console.error("Error loading analytics:", err);
    const message = process.env.DATABASE_URL
      ? "Failed to query the database for analytics. Check schema, migrations, and connection permissions."
      : "DATABASE_URL is not set. Create .env.local with your Postgres connection string.";

    return (
      <main style={{ padding: 24 }}>
        <h2 style={{ color: "#ef4444", fontWeight: 700, marginBottom: 8 }}>
          Failed to load analytics
        </h2>
        <p style={{ color: "#9ca3af" }}>{message}</p>
      </main>
    );
  }
}
