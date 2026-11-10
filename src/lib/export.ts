/** Getting a diagram out of the app: as an SVG or PNG file, or a sheet as JSON. */

export function svgMarkup(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  const [, , w, h] = (clone.getAttribute("viewBox") ?? "0 0 400 400").split(" ").map(Number);
  clone.setAttribute("width", String(w * 2));
  clone.setAttribute("height", String(h * 2));
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}

export function download(filename: string, data: Blob): void {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(svg: SVGSVGElement, filename: string): void {
  download(filename, new Blob([svgMarkup(svg)], { type: "image/svg+xml" }));
}

/** Render at 4x the SVG's natural size so the PNG stays sharp when printed. */
export async function svgToPngBlob(svg: SVGSVGElement, scale = 4): Promise<Blob> {
  const markup = svgMarkup(svg);
  const [, , w, h] = (svg.getAttribute("viewBox") ?? "0 0 400 400").split(" ").map(Number);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
  try {
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encoding failed"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadPng(svg: SVGSVGElement, filename: string): Promise<void> {
  download(filename, await svgToPngBlob(svg));
}

/** Copy a PNG of the diagram, for pasting into a document. Returns false where unsupported. */
export async function copyPng(svg: SVGSVGElement): Promise<boolean> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false;
  await navigator.clipboard.write([new ClipboardItem({ "image/png": svgToPngBlob(svg) })]);
  return true;
}

export function slug(text: string, fallback = "diagram"): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || fallback;
}
