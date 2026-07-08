export type StrengthLevel = "weak" | "fair" | "strong" | "excellent";

export interface StrengthResult {
  level: StrengthLevel;
  label: string;
  score: number;
  warnings: string[];
}

const SEQUENCES = ["0123456789", "abcdefghijklmnopqrstuvwxyz", "qwertyuiop"];

function hasSimpleSequence(password: string): boolean {
  const lower = password.toLowerCase();
  for (const seq of SEQUENCES) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const chunk = seq.slice(i, i + 4);
      if (lower.includes(chunk) || lower.includes([...chunk].reverse().join(""))) {
        return true;
      }
    }
  }
  return /(.)\1{2,}/.test(password);
}

function charsetVariety(password: string): number {
  let count = 0;
  if (/[a-z]/.test(password)) count++;
  if (/[A-Z]/.test(password)) count++;
  if (/[0-9]/.test(password)) count++;
  if (/[^a-zA-Z0-9]/.test(password)) count++;
  return count;
}

export function evaluateStrength(
  password: string,
  mode: "random" | "memorable" = "random",
): StrengthResult {
  const warnings: string[] = [];
  let score = 0;

  if (password.length < 8) {
    warnings.push("WPA recommends at least 8 characters");
  }

  if (password.length >= 8) score += 15;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 5;

  const variety = charsetVariety(password);
  score += variety * 10;

  if (mode === "memorable") {
    const wordParts = password.split("-").filter((part) => /[a-zA-Z]{3,}/.test(part));
    if (wordParts.length >= 3) score += 15;
    if (wordParts.length >= 4) score += 10;
    if (variety < 2 && !/\d/.test(password)) {
      warnings.push("Enable capitalization or number suffix for better security");
    }
  } else if (variety < 2) {
    warnings.push("Use multiple character types for better security");
  }

  if (mode === "random" && hasSimpleSequence(password)) {
    score -= 15;
    warnings.push("Avoid simple sequences or repeated characters");
  }

  score = Math.max(0, Math.min(100, score));

  let level: StrengthLevel;
  let label: string;

  if (score < 40) {
    level = "weak";
    label = "Weak";
  } else if (score < 60) {
    level = "fair";
    label = "Fair";
  } else if (score < 80) {
    level = "strong";
    label = "Strong";
  } else {
    level = "excellent";
    label = "Excellent";
  }

  return { level, label, score, warnings };
}
