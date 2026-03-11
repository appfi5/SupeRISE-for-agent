import type { AuditLogDto } from "@superise/app-contracts";

type AuditLogPanelProps = {
  audits: AuditLogDto[];
};

export function AuditLogPanel({ audits }: AuditLogPanelProps) {
  return (
    <section className="panel">
      <h2>审计日志</h2>
      <div className="audit-list">
        {audits.map((entry) => (
          <article key={entry.auditId} className="audit-item">
            <div>
              <strong>{entry.action}</strong>
              <span>{entry.actorRole}</span>
            </div>
            <div>
              <span>{entry.result}</span>
              <span>{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
