import type { Application, BusinessDocument } from "./types";

export const expiringDocumentLabels = [
  "Resale certificate",
  "Certificate of insurance",
  "Proof of auto insurance",
  "Vehicle registration",
  "Business license or state registration",
  "Product liability or compliance documents, if applicable"
];

export function requiresExpirationDate(label: string) {
  return expiringDocumentLabels.includes(label);
}

export function getExpirationState(document: BusinessDocument, today = new Date()) {
  if (!requiresExpirationDate(document.label)) {
    return { label: "No expiration required", tone: "neutral" as const, daysUntilExpiration: null };
  }

  if (!document.expiresAt) {
    return { label: "Expiration date needed", tone: "warning" as const, daysUntilExpiration: null };
  }

  const expiration = new Date(`${document.expiresAt}T00:00:00`);
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const daysUntilExpiration = Math.ceil((expiration.getTime() - start.getTime()) / 86_400_000);

  if (daysUntilExpiration < 0) {
    return { label: "Expired", tone: "danger" as const, daysUntilExpiration };
  }

  if (daysUntilExpiration <= 30) {
    return { label: `Expires in ${daysUntilExpiration} days`, tone: "warning" as const, daysUntilExpiration };
  }

  return { label: `Expires ${document.expiresAt}`, tone: "good" as const, daysUntilExpiration };
}

export function getDocumentAlerts(applications: Application[], type?: Application["type"]) {
  return applications
    .filter((application) => !type || application.type === type)
    .flatMap((application) =>
      application.documents
        .map((document) => ({
          application,
          document,
          expiration: getExpirationState(document)
        }))
        .filter(({ expiration }) => expiration.tone === "danger" || expiration.tone === "warning")
    );
}
