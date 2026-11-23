const EMAIL_LITERAL_RE = /(["'`])[^"'`\s]+@[^"'`\s]+\.[^"'`\s]+\1/g;
const CREDENTIAL_FILL_RE =
  /getByLabel\(\s*[^)]*(?:email|password)[^)]*\)[\s\S]{0,80}?\.fill\(\s*(["'`])[^"'`]+\1\s*\)/gi;

/**
 * Pure scanner that reports any literal email addresses or literal credential strings
 * passed to email/password `.fill(...)` calls in E2E source files.
 */
export function findCredentialLiterals(source: string): string[] {
  const findings: string[] = [];

  for (const match of source.matchAll(EMAIL_LITERAL_RE)) {
    findings.push(`email literal: ${match[0]}`);
  }
  for (const match of source.matchAll(CREDENTIAL_FILL_RE)) {
    findings.push(`credential fill literal: ${match[0]}`);
  }

  return findings;
}
