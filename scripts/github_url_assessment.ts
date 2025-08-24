// scripts/oneoff_trufflehog.ts
/* 
  One-time TruffleHog + tech assessment
  - Reads repos from either a static list or GitHub org
  - Writes results to data/security/
*/

import { Octokit } from "@octokit/rest";
import { spawn } from "node:child_process";
import { mkdir, writeFile, appendFile } from "node:fs/promises";
import { basename } from "node:path";

type RepoRef = {
  owner: string;
  name: string;
  url: string;
  defaultBranch?: string;
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const ORG = process.env.GITHUB_ORG || ""; // optional: org to enumerate
const OUT_DIR = "data/security";

function assertEnv() {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is required");
}
function createGitHub() {
  return new Octokit({ auth: GITHUB_TOKEN, request: { timeout: 30_000 } });
}
function isRateLimited(e: any): boolean {
  const status = e?.status || e?.response?.status;
  const remaining = e?.response?.headers?.["x-ratelimit-remaining"];
  return status === 403 || status === 429 || remaining === "0";
}

// Option A: static list
const STATIC_REPOS: string[] = [
    
  // "https://github.com/org/repo",
];

// Option B: fetch from org
async function listReposFromOrg(
  octokit: Octokit,
  org: string
): Promise<RepoRef[]> {
  const res = await octokit.paginate(octokit.repos.listForOrg, {
    org,
    per_page: 100,
  });
  return res.map((r) => ({
    owner: r.owner!.login!,
    name: r.name,
    url: r.html_url!,
    defaultBranch: r.default_branch || "main",
  }));
}
function parseUrl(url: string): RepoRef {
  const [owner, name] = url.replace("https://github.com/", "").split("/");
  return { owner, name, url, defaultBranch: "main" };
}

async function getRepoMeta(octokit: Octokit, repo: RepoRef) {
  // languages
  const langs = await octokit.repos.listLanguages({
    owner: repo.owner,
    repo: repo.name,
  });

  // basic manifests to detect tech
  const manifestPaths = [
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "go.mod",
    "Cargo.toml",
    "Dockerfile",
  ];
  const tech: Record<string, any> = {
    frameworks: [],
    libs: [],
    apis: [],
    manifests: {},
  };

  for (const path of manifestPaths) {
    try {
      const res = await octokit.repos.getContent({
        owner: repo.owner,
        repo: repo.name,
        path,
        ref: repo.defaultBranch,
      });
      if (!("content" in res.data)) continue;
      const content = Buffer.from(res.data.content || "", "base64").toString(
        "utf8"
      );
      tech.manifests[path] = content;

      if (path === "package.json") {
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const names = Object.keys(deps || {});
        // Quick heuristics
        if (names.includes("next")) tech.frameworks.push("Next.js");
        if (names.includes("react")) tech.frameworks.push("React");
        if (names.includes("prisma")) tech.libs.push("Prisma");
        if (names.includes("pg") || names.includes("postgres"))
          tech.libs.push("Postgres Client");
        if (names.includes("axios") || names.includes("node-fetch"))
          tech.libs.push("HTTP client");
      } else if (path === "requirements.txt" || path === "pyproject.toml") {
        if (content.match(/fastapi/i)) tech.frameworks.push("FastAPI");
        if (content.match(/sqlalchemy/i)) tech.libs.push("SQLAlchemy");
        if (content.match(/psycopg/i)) tech.libs.push("psycopg");
      } else if (path === "go.mod") {
        if (content.match(/gin-gonic/i)) tech.frameworks.push("Gin");
        if (content.match(/gorm.io/i)) tech.libs.push("GORM");
      } else if (path === "Dockerfile") {
        if (content.match(/node/i)) tech.frameworks.push("Node (Docker)");
        if (content.match(/python/i)) tech.frameworks.push("Python (Docker)");
      }
    } catch (e: any) {
      if (isRateLimited(e)) throw new Error("GITHUB_RATE_LIMIT");
      // ignore missing files
    }
  }

  return { languages: langs.data, tech };
}

async function runTrufflehogGithub(
  repo: RepoRef,
  outBase: string
): Promise<{ findings: number; summary: Record<string, number> }> {
  const args = [
    "run",
    "--rm",
    "-e",
    `GITHUB_TOKEN=${GITHUB_TOKEN}`,
    "trufflesecurity/trufflehog:latest",
    "github",
    "--repo",
    `https://github.com/${repo.owner}/${repo.name}`,
    "--json",
  ];
  const proc = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });

  let findings = 0;
  const summary: Record<string, number> = {};
  const jsonlPath = `${outBase}-trufflehog.jsonl`;

  proc.stdout.setEncoding("utf8");
  proc.stdout.on("data", async (chunk: string) => {
    for (const line of chunk.split("\n")) {
      const l = line.trim();
      if (!l) continue;
      try {
        const obj = JSON.parse(l);
        findings++;
        const detector = obj?.DetectorName || obj?.DetectorType || "unknown";
        summary[detector] = (summary[detector] || 0) + 1;
        await appendFile(jsonlPath, l + "\n");
      } catch {
        // ignore non-JSON lines
      }
    }
  });

  let stderrBuf = "";
  proc.stderr.on("data", (d: Buffer) => {
    stderrBuf += d.toString("utf8");
  });

  const exitCode: number = await new Promise((resolve) =>
    proc.on("close", resolve as any)
  );

  if (exitCode !== 0) {
    if (/rate.?limit/i.test(stderrBuf)) {
      const err = new Error("TRUFFLEHOG_RATE_LIMIT");
      (err as any).details = stderrBuf;
      throw err;
    }
    const err = new Error(`TRUFFLEHOG_FAILED (code ${exitCode})`);
    (err as any).details = stderrBuf.slice(0, 2000);
    throw err;
  }

  return { findings, summary };
}

async function main() {
  assertEnv();
  const octokit = createGitHub();
  await mkdir(OUT_DIR, { recursive: true });

  // Build repo list
  let repos: RepoRef[] = [];
  if (STATIC_REPOS.length > 0) {
    repos = STATIC_REPOS.map(parseUrl);
  } else if (ORG) {
    repos = await listReposFromOrg(octokit, ORG);
  } else {
    throw new Error("Provide repos via STATIC_REPOS or set GITHUB_ORG");
  }

  for (const repo of repos) {
    const safeName = `${repo.owner}-${repo.name}`;
    const outBase = `${OUT_DIR}/${safeName}`;
    console.log(`\n=== ${repo.url} ===`);

    // 1) tech + languages
    let techMeta: any = {};
    try {
      const meta = await getRepoMeta(octokit, repo);
      techMeta = meta;
      await writeFile(`${outBase}-tech.json`, JSON.stringify(meta, null, 2));
      console.log(`tech: written ${basename(outBase)}-tech.json`);
    } catch (e: any) {
      if (isRateLimited(e) || e?.message === "GITHUB_RATE_LIMIT") {
        console.error("GitHub rate limited. Stopping.");
        process.exit(2);
      }
      console.error(`tech-meta error: ${e?.message || e}`);
      // continue; still attempt trufflehog
    }

    // 2) trufflehog
    try {
      await writeFile(`${outBase}-trufflehog.jsonl`, ""); // ensure file exists
      const { findings, summary } = await runTrufflehogGithub(repo, outBase);
      await writeFile(
        `${outBase}-summary.json`,
        JSON.stringify({ findings, summary }, null, 2)
      );
      console.log(`trufflehog: ${findings} findings`);
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes("TRUFFLEHOG_RATE_LIMIT")) {
        console.error("TruffleHog rate limited. Stopping.");
        process.exit(3);
      }
      console.error(`trufflehog error: ${msg}`);
      if (e?.details) console.error(e.details);
      process.exit(4);
    }
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
