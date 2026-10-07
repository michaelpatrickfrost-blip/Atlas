import { auditSources } from "./source-audit";
const audit = auditSources(process.cwd());
console.log(JSON.stringify({ coverage: audit.coverage, findings: audit.findings }, null, 2));
process.exitCode = audit.findings.some(finding => finding.kind === "BROKEN_LINK" || finding.kind === "EMPTY_PAGE") ? 1 : 0;
