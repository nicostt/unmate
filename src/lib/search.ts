import { normalize } from "./format";

// Buscador del catálogo: sin tildes ni mayúsculas, con resaltado de lo que
// coincide y con "parecidos" para cuando alguien escribe con un error.

// Las palabras de una búsqueda, ya normalizadas: "Bombillón  pico" -> ["bombillon", "pico"].
export function searchWords(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean);
}

// ¿Están todas las palabras en el texto? (en cualquier orden)
export function matches(text: string, words: string[]): boolean {
  const haystack = normalize(text);
  return words.every((word) => haystack.includes(word));
}

// Parte un texto en pedazos, marcando cuáles coinciden con alguna de las
// palabras buscadas, para dibujarlos resaltados:
//   highlightParts("Bombillón recto", ["bombillon"])
//   -> [{ text: "Bombillón", hit: true }, { text: " recto", hit: false }]
export function highlightParts(text: string, words: string[]): { text: string; hit: boolean }[] {
  if (!words.length) return [{ text, hit: false }];

  // Se busca en la versión sin tildes, pero hay que marcar el texto
  // original: `origin[i]` dice de qué letra del original salió la letra i.
  let plain = "";
  const origin: number[] = [];
  for (let i = 0; i < text.length; i++) {
    for (const char of normalize(text[i])) {
      plain += char;
      origin.push(i);
    }
  }

  const hit = new Array<boolean>(text.length).fill(false);
  for (const word of words) {
    for (let at = plain.indexOf(word); at !== -1; at = plain.indexOf(word, at + 1)) {
      for (let i = origin[at]; i <= origin[at + word.length - 1]; i++) hit[i] = true;
    }
  }

  const parts: { text: string; hit: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.hit === hit[i]) last.text += text[i];
    else parts.push({ text: text[i], hit: hit[i] });
  }
  return parts;
}

// Cuántas letras hay que cambiar, agregar o sacar para pasar de una palabra
// a la otra (distancia de Levenshtein). "bombiya" -> "bombilla" = 2.
function distance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[b.length];
}

// ¿Lo escrito se parece a esta palabra? Perdona un error en palabras cortas
// y dos en las largas. También compara contra el comienzo de la palabra,
// para que "bombiy" (a medio escribir) se parezca a "bombilla".
function alike(typed: string, word: string): boolean {
  if (typed.length < 3) return word.startsWith(typed);
  const tolerance = typed.length <= 4 ? 1 : 2;
  return distance(typed, word) <= tolerance || distance(typed, word.slice(0, typed.length)) <= tolerance;
}

// ¿El texto tiene palabras parecidas a todas las buscadas? Se usa solo
// cuando la búsqueda exacta no encontró nada.
export function similar(text: string, words: string[]): boolean {
  const candidates = normalize(text).split(/[^a-z0-9ñ]+/).filter(Boolean);
  return words.every((typed) => candidates.some((word) => alike(typed, word)));
}
