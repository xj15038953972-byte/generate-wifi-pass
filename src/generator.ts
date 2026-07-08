import { WORD_LIST } from "./wordlist";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}";
const AMBIGUOUS = new Set("0Ool1I");

export type GeneratorMode = "random" | "memorable";

export interface GeneratorOptions {
  mode: GeneratorMode;
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  wordCount: number;
  capitalizeWords: boolean;
  addNumberSuffix: boolean;
}

export const DEFAULT_OPTIONS: GeneratorOptions = {
  mode: "random",
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: true,
  wordCount: 4,
  capitalizeWords: true,
  addNumberSuffix: true,
};

export const DEFAULT_MEMORABLE_OPTIONS: Pick<
  GeneratorOptions,
  "wordCount" | "capitalizeWords" | "addNumberSuffix"
> = {
  wordCount: 4,
  capitalizeWords: true,
  addNumberSuffix: true,
};

function filterAmbiguous(charset: string, exclude: boolean): string {
  if (!exclude) return charset;
  return [...charset].filter((c) => !AMBIGUOUS.has(c)).join("");
}

function getCharsets(options: GeneratorOptions): string[] {
  const sets: string[] = [];
  if (options.uppercase) sets.push(filterAmbiguous(UPPER, options.excludeAmbiguous));
  if (options.lowercase) sets.push(filterAmbiguous(LOWER, options.excludeAmbiguous));
  if (options.numbers) sets.push(filterAmbiguous(DIGITS, options.excludeAmbiguous));
  if (options.symbols) sets.push(filterAmbiguous(SYMBOLS, options.excludeAmbiguous));
  return sets.filter((s) => s.length > 0);
}

export function buildCharset(options: GeneratorOptions): string {
  const sets = getCharsets(options);
  return sets.join("");
}

function randomIndex(max: number): number {
  if (max <= 0) throw new Error("Charset is empty");
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function pickChar(charset: string): string {
  return charset[randomIndex(charset.length)];
}

function pickWord(): string {
  return WORD_LIST[randomIndex(WORD_LIST.length)];
}

function maybeCapitalize(word: string, enabled: boolean): string {
  if (!enabled || randomIndex(2) === 0) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function generateMemorablePassword(options: GeneratorOptions): string {
  const wordCount = Math.min(6, Math.max(3, options.wordCount));
  const words: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    words.push(maybeCapitalize(pickWord(), options.capitalizeWords));
  }

  if (options.addNumberSuffix) {
    const n = randomIndex(100);
    words.push(String(n).padStart(2, "0"));
  }

  let password = words.join("-");

  if (password.length < 8) {
    password += `-${pickWord()}`;
  }

  return password.slice(0, 63);
}

export function generatePassword(options: GeneratorOptions): string {
  if (options.mode === "memorable") {
    return generateMemorablePassword(options);
  }

  const sets = getCharsets(options);
  if (sets.length === 0) {
    throw new Error("Select at least one character type");
  }

  const charset = sets.join("");
  const length = Math.min(63, Math.max(8, options.length));

  const chars: string[] = [];

  for (const set of sets) {
    chars.push(pickChar(set));
  }

  while (chars.length < length) {
    chars.push(pickChar(charset));
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

export function buildWifiQrPayload(
  ssid: string,
  password: string,
  security: "WPA" | "WEP" | "nopass" = "WPA",
): string {
  const escape = (value: string) =>
    value.replace(/([\\;,:"])/g, "\\$1");

  if (security === "nopass") {
    return `WIFI:T:nopass;S:${escape(ssid)};;`;
  }

  return `WIFI:T:${security};S:${escape(ssid)};P:${escape(password)};;`;
}
