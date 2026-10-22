// Morse engine from the morse-translator-me package (ITU-R M.1677-1 table),
// inlined so the extension stays a zero-dependency, no-build zip.
const MORSE_BY_CHARACTER = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", 0: "-----", 1: ".----", 2: "..---",
  3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...",
  8: "---..", 9: "----.", ".": ".-.-.-", ",": "--..--",
  "?": "..--..", "'": ".----.", "!": "-.-.--", "/": "-..-.",
  "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-",
  _: "..--.-", '"': ".-..-.", $: "...-..-", "@": ".--.-.",
};

const CHARACTER_BY_MORSE = Object.fromEntries(
  Object.entries(MORSE_BY_CHARACTER).map(([character, code]) => [code, character]),
);

function encodeText(input) {
  const unsupported = [];
  const lines = input.split("\n").map((line) =>
    line
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) =>
        Array.from(word.toUpperCase())
          .flatMap((character) => {
            const code = MORSE_BY_CHARACTER[character];
            if (code) return [code];
            unsupported.push(character);
            return [];
          })
          .join(" "),
      )
      .filter(Boolean)
      .join(" / "),
  );
  return {
    output: lines.join("\n"),
    warnings: [...new Set(unsupported)].slice(0, 5),
    warningCount: unsupported.length,
  };
}

function decodeMorse(input) {
  const invalid = [];
  const lines = input.split("\n").map((line) =>
    line
      .trim()
      .split(/\s*\/\s*|\s{3,}/)
      .filter(Boolean)
      .map((word) =>
        word
          .trim()
          .split(/\s{1,2}/)
          .filter(Boolean)
          .map((token) => {
            const character = CHARACTER_BY_MORSE[token];
            if (character) return character;
            invalid.push(token);
            return "\uFFFD";
          })
          .join(""),
      )
      .join(" "),
  );
  return {
    output: lines.join("\n"),
    warnings: [...new Set(invalid)].slice(0, 5),
    warningCount: invalid.length,
  };
}

const textEl = document.getElementById("text");
const morseEl = document.getElementById("morse");
const warningEl = document.getElementById("warning");

let lock = null; // which textarea the user is editing

function showWarnings(result) {
  const has = result.warningCount > 0;
  warningEl.hidden = !has;
  if (has) {
    const shown = result.warnings.join(" ");
    const more = result.warningCount - result.warnings.length;
    warningEl.textContent =
      `Skipped ${result.warningCount}: ${shown}${more > 0 ? ` +${more} more` : ""}`;
  }
}

textEl.addEventListener("input", () => {
  lock = "text";
  const result = encodeText(textEl.value);
  morseEl.value = result.output;
  showWarnings(result);
});

morseEl.addEventListener("input", () => {
  lock = "morse";
  const result = decodeMorse(morseEl.value);
  textEl.value = result.output;
  showWarnings(result);
});

document.getElementById("swap").addEventListener("click", () => {
  const a = textEl.value;
  textEl.value = morseEl.value;
  morseEl.value = a;
});

document.getElementById("clear").addEventListener("click", () => {
  textEl.value = "";
  morseEl.value = "";
  warningEl.hidden = true;
  textEl.focus();
});

// Audio: 600 Hz tone, 15 WPM => unit = 1.2 / 15 = 80 ms (PARIS timing).
let audioContext = null;
let currentOsc = null;

function morseToTimeline(morse) {
  const timeline = [];
  for (const token of morse.split(/\s+/).filter(Boolean)) {
    if (token === "/") {
      timeline.push({ on: false, units: 4 }); // word gap minus the in-word gap
      continue;
    }
    for (const symbol of token) {
      if (symbol === ".") timeline.push({ on: true, units: 1 });
      else if (symbol === "-") timeline.push({ on: true, units: 3 });
      timeline.push({ on: false, units: 1 });
    }
    timeline.push({ on: false, units: 2 }); // letter gap minus the symbol gap
  }
  return timeline;
}

function stopPlayback() {
  if (currentOsc) {
    try {
      currentOsc.stop();
    } catch {
      // already stopped
    }
    currentOsc.disconnect();
    currentOsc = null;
  }
}

document.getElementById("play").addEventListener("click", () => {
  const morse = lock === "text" || morseEl.value ? morseEl.value : encodeText(textEl.value).output;
  if (!morse.trim()) return;

  stopPlayback();
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();

  const UNIT = 1.2 / 15; // seconds
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.frequency.value = 600;
  osc.connect(gain).connect(audioContext.destination);
  currentOsc = osc;

  let time = audioContext.currentTime + 0.05;
  gain.gain.setValueAtTime(0, time);
  for (const step of morseToTimeline(morse)) {
    if (step.on) {
      gain.gain.setValueAtTime(0.25, time);
      time += step.units * UNIT;
      gain.gain.setValueAtTime(0, time);
    } else {
      time += step.units * UNIT;
    }
  }
  osc.start();
  osc.stop(time + 0.1);
});

document.getElementById("stop").addEventListener("click", stopPlayback);
