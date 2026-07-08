import QRCode from "qrcode";
import { copyText, showToast } from "./clipboard";
import {
  DEFAULT_MEMORABLE_OPTIONS,
  DEFAULT_OPTIONS,
  type GeneratorMode,
  type GeneratorOptions,
  buildWifiQrPayload,
  generatePassword,
} from "./generator";
import { evaluateStrength } from "./strength";
import "./styles.css";

const els = {
  password: document.getElementById("password") as HTMLOutputElement,
  strengthFill: document.getElementById("strength-fill") as HTMLDivElement,
  strengthLabel: document.getElementById("strength-label") as HTMLSpanElement,
  strengthBar: document.querySelector(".strength-bar") as HTMLDivElement,
  strengthWarnings: document.getElementById("strength-warnings") as HTMLParagraphElement,
  modeRandom: document.getElementById("mode-random") as HTMLInputElement,
  modeMemorable: document.getElementById("mode-memorable") as HTMLInputElement,
  modeHint: document.getElementById("mode-hint") as HTMLParagraphElement,
  randomSettings: document.getElementById("random-settings") as HTMLDivElement,
  memorableSettings: document.getElementById("memorable-settings") as HTMLDivElement,
  length: document.getElementById("length") as HTMLInputElement,
  lengthValue: document.getElementById("length-value") as HTMLSpanElement,
  wordCount: document.getElementById("word-count") as HTMLInputElement,
  wordCountValue: document.getElementById("word-count-value") as HTMLSpanElement,
  uppercase: document.getElementById("uppercase") as HTMLInputElement,
  lowercase: document.getElementById("lowercase") as HTMLInputElement,
  numbers: document.getElementById("numbers") as HTMLInputElement,
  symbols: document.getElementById("symbols") as HTMLInputElement,
  excludeAmbiguous: document.getElementById("exclude-ambiguous") as HTMLInputElement,
  capitalizeWords: document.getElementById("capitalize-words") as HTMLInputElement,
  addNumberSuffix: document.getElementById("add-number-suffix") as HTMLInputElement,
  btnRegenerate: document.getElementById("btn-regenerate") as HTMLButtonElement,
  btnCopy: document.getElementById("btn-copy") as HTMLButtonElement,
  btnRecommended: document.getElementById("btn-recommended") as HTMLButtonElement,
  ssid: document.getElementById("ssid") as HTMLInputElement,
  security: document.getElementById("security") as HTMLSelectElement,
  qrCanvas: document.getElementById("qr-canvas") as HTMLCanvasElement,
  qrHint: document.getElementById("qr-hint") as HTMLParagraphElement,
  btnDownloadQr: document.getElementById("btn-download-qr") as HTMLButtonElement,
};

const MODE_HINTS: Record<GeneratorMode, string> = {
  random: "Random mixed characters — maximum entropy",
  memorable: "Word-based passphrase — easier to remember, e.g. River-Happy-Cloud-42",
};

let currentPassword = "";

function getMode(): GeneratorMode {
  return els.modeMemorable.checked ? "memorable" : "random";
}

function readOptions(): GeneratorOptions {
  return {
    mode: getMode(),
    length: Number(els.length.value),
    uppercase: els.uppercase.checked,
    lowercase: els.lowercase.checked,
    numbers: els.numbers.checked,
    symbols: els.symbols.checked,
    excludeAmbiguous: els.excludeAmbiguous.checked,
    wordCount: Number(els.wordCount.value),
    capitalizeWords: els.capitalizeWords.checked,
    addNumberSuffix: els.addNumberSuffix.checked,
  };
}

function updateModeUi(): void {
  const memorable = getMode() === "memorable";
  els.randomSettings.hidden = memorable;
  els.memorableSettings.hidden = !memorable;
  els.modeHint.textContent = MODE_HINTS[getMode()];
  els.password.classList.toggle("password--memorable", memorable);
}

function applyRecommended(): void {
  els.modeRandom.checked = true;
  els.length.value = String(DEFAULT_OPTIONS.length);
  els.lengthValue.textContent = String(DEFAULT_OPTIONS.length);
  els.uppercase.checked = DEFAULT_OPTIONS.uppercase;
  els.lowercase.checked = DEFAULT_OPTIONS.lowercase;
  els.numbers.checked = DEFAULT_OPTIONS.numbers;
  els.symbols.checked = DEFAULT_OPTIONS.symbols;
  els.excludeAmbiguous.checked = DEFAULT_OPTIONS.excludeAmbiguous;
  els.wordCount.value = String(DEFAULT_MEMORABLE_OPTIONS.wordCount);
  els.wordCountValue.textContent = String(DEFAULT_MEMORABLE_OPTIONS.wordCount);
  els.capitalizeWords.checked = DEFAULT_MEMORABLE_OPTIONS.capitalizeWords;
  els.addNumberSuffix.checked = DEFAULT_MEMORABLE_OPTIONS.addNumberSuffix;
  updateModeUi();
}

function updateStrength(password: string): void {
  const result = evaluateStrength(password, getMode());

  els.strengthFill.style.width = `${result.score}%`;
  els.strengthFill.dataset.level = result.level;
  els.strengthLabel.textContent = result.label;
  els.strengthBar.setAttribute("aria-valuenow", String(result.score));
  els.strengthBar.setAttribute("aria-valuetext", result.label);

  if (result.warnings.length > 0) {
    els.strengthWarnings.hidden = false;
    els.strengthWarnings.textContent = result.warnings.join(" · ");
  } else {
    els.strengthWarnings.hidden = true;
    els.strengthWarnings.textContent = "";
  }
}

async function updateQr(): Promise<void> {
  const ssid = els.ssid.value.trim();
  const security = els.security.value as "WPA" | "WEP" | "nopass";

  if (!ssid) {
    els.qrCanvas.hidden = true;
    els.qrHint.hidden = false;
    els.btnDownloadQr.disabled = true;
    return;
  }

  const payload = buildWifiQrPayload(
    ssid,
    security === "nopass" ? "" : currentPassword,
    security,
  );

  try {
    await QRCode.toCanvas(els.qrCanvas, payload, {
      width: 200,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    els.qrCanvas.hidden = false;
    els.qrHint.hidden = true;
    els.btnDownloadQr.disabled = false;
  } catch {
    els.qrCanvas.hidden = true;
    els.qrHint.hidden = false;
    els.qrHint.textContent = "Could not generate QR code";
    els.btnDownloadQr.disabled = true;
  }
}

function regenerate(): void {
  try {
    currentPassword = generatePassword(readOptions());
    els.password.textContent = currentPassword;
    updateStrength(currentPassword);
    void updateQr();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    els.password.textContent = "—";
    showToast(message);
  }
}

for (const input of [els.modeRandom, els.modeMemorable]) {
  input.addEventListener("change", () => {
    updateModeUi();
    regenerate();
  });
}

els.length.addEventListener("input", () => {
  els.lengthValue.textContent = els.length.value;
  regenerate();
});

els.wordCount.addEventListener("input", () => {
  els.wordCountValue.textContent = els.wordCount.value;
  regenerate();
});

for (const input of [
  els.uppercase,
  els.lowercase,
  els.numbers,
  els.symbols,
  els.excludeAmbiguous,
  els.capitalizeWords,
  els.addNumberSuffix,
]) {
  input.addEventListener("change", regenerate);
}

els.btnRegenerate.addEventListener("click", regenerate);

els.btnCopy.addEventListener("click", async () => {
  if (!currentPassword) return;
  const ok = await copyText(currentPassword);
  if (ok) {
    const original = els.btnCopy.textContent;
    els.btnCopy.textContent = "Copied ✓";
    showToast("Password copied");
    window.setTimeout(() => {
      els.btnCopy.textContent = original;
    }, 2000);
  } else {
    showToast("Copy failed — select and copy manually");
  }
});

els.btnRecommended.addEventListener("click", () => {
  applyRecommended();
  regenerate();
});

els.ssid.addEventListener("input", () => void updateQr());
els.security.addEventListener("change", () => void updateQr());

els.btnDownloadQr.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `wifi-${els.ssid.value.trim() || "qr"}.png`;
  link.href = els.qrCanvas.toDataURL("image/png");
  link.click();
});

applyRecommended();
regenerate();
