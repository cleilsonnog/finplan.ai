import { extractTextItems } from "unpdf";

// Turns a PDF into plain text per column. Bills like Santander's print two cards side by side;
// read as one stream, their lines interleave and models skip whole blocks. Text items carry
// x/y positions, so a vertical strip with no text near the middle of the page marks a column
// break; each column is then rebuilt line by line (same y → same line, sorted by x).

interface Item {
  str: string;
  x: number;
  y: number;
  width: number;
}

/** x where the page splits into two columns, or null for single-column pages */
const findColumnSplit = (items: Item[]) => {
  if (items.length < 20) return null;
  const left = Math.min(...items.map((i) => i.x));
  const right = Math.max(...items.map((i) => i.x + i.width));
  const width = right - left;
  const buckets = 200;
  const coverage = new Array<number>(buckets).fill(0);
  for (const it of items) {
    const from = Math.floor(((it.x - left) / width) * buckets);
    const to = Math.floor(((it.x + it.width - left) / width) * buckets);
    for (let b = Math.max(from, 0); b <= Math.min(to, buckets - 1); b++) coverage[b]++;
  }
  // Longest run of near-empty buckets in the middle band (35%–65% of the width)
  const limit = Math.max(1, Math.round(items.length * 0.01));
  let best: { start: number; len: number } | null = null;
  let start = -1;
  for (let b = Math.floor(buckets * 0.35); b <= Math.ceil(buckets * 0.65); b++) {
    if (coverage[b] <= limit) {
      if (start < 0) start = b;
      const len = b - start + 1;
      if (!best || len > best.len) best = { start, len };
    } else {
      start = -1;
    }
  }
  if (!best || best.len < 2) return null;
  return left + ((best.start + best.len / 2) / buckets) * width;
};

const toLines = (items: Item[]) => {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: Item[][] = [];
  for (const it of sorted) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(line[0].y - it.y) <= 2.5) line.push(it);
    else lines.push([it]);
  }
  return lines
    .map((line) =>
      line
        .sort((a, b) => a.x - b.x)
        .reduce((text, it, i, arr) => {
          if (i === 0) return it.str;
          const gap = it.x - (arr[i - 1].x + arr[i - 1].width);
          // Wide gaps separate table columns — keep them visible as " | "
          return text + (gap > 12 ? "  |  " : gap > 1 ? " " : "") + it.str;
        }, "")
        .trim(),
    )
    .filter(Boolean);
};

export interface PdfPageText {
  page: number;
  /** One entry per column (one for single-column pages) */
  columns: string[];
}

export const extractPdfColumns = async (buffer: Buffer): Promise<PdfPageText[]> => {
  const { items } = await extractTextItems(new Uint8Array(buffer));
  return items.map((pageItems, index) => {
    const clean = pageItems.filter((i) => i.str.trim());
    const split = findColumnSplit(clean);
    const groups = split === null ? [clean] : [clean.filter((i) => i.x < split), clean.filter((i) => i.x >= split)];
    return { page: index + 1, columns: groups.map((g) => toLines(g).join("\n")).filter(Boolean) };
  });
};
