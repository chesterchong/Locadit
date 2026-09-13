"use client";

import { useEffect, useRef, useState } from "react";
import qrcode from "qrcode-generator";

export default function ShareQr({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const qr = qrcode(0, "H"); // high error correction leaves room for the wordmark in the middle
    const inviteUrl = new URL(`/t/${encodeURIComponent(code)}`, window.location.origin).toString();
    qr.addData(inviteUrl, "Byte");
    qr.make();

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const modules = qr.getModuleCount();
    const quietZone = 4;
    const cell = 8;
    const size = (modules + quietZone * 2) * cell;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * scale;
    canvas.height = size * scale;
    canvas.style.aspectRatio = "1";
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.fillStyle = "#171411";

    // Wordmark badge snapped to whole modules (odd count, centred) so no module is cut in half.
    // Covers ~9% of the modules, well inside level-H's 30% tolerance.
    let badgeCells = Math.round(modules * 0.3); if (badgeCells % 2 !== modules % 2) badgeCells += 1;
    const first = (modules - badgeCells) / 2, last = first + badgeCells - 1;
    const inBadge = (r: number, c: number) => r >= first && r <= last && c >= first && c <= last;
    for (let row = 0; row < modules; row += 1) {
      for (let col = 0; col < modules; col += 1) {
        if (qr.isDark(row, col) && !inBadge(row, col)) {
          context.fillRect((col + quietZone) * cell, (row + quietZone) * cell, cell, cell);
        }
      }
    }
    const badge = badgeCells * cell, x = (first + quietZone) * cell, y = x, r = cell * 1.5;
    context.fillStyle = "#ffffff";
    context.fillRect(x, y, badge, badge);
    context.strokeStyle = "#171411";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(x + cell * 0.5, y + cell * 0.5, badge - cell, badge - cell, r);
    context.stroke();
    const face = getComputedStyle(document.documentElement).getPropertyValue("--font-caveat").trim() || "cursive";
    context.fillStyle = "#171411";
    let px = Math.round(badge * 0.36);
    context.font = `700 ${px}px ${face}, cursive`;
    while (px > 8 && context.measureText("Locadit").width > badge * 0.72) { px -= 1; context.font = `700 ${px}px ${face}, cursive`; }
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Locadit", size / 2, size / 2 + badge * 0.02);
  }, [code, open]);

  async function copyImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `locadit-${code}.png`;
      a.click();
    }
  }

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <aside className={`share-qr ${open ? "is-open" : ""}`} aria-label="Room invite QR code">
      {open ? (
        <div className="share-qr-panel">
          <div className="share-qr-heading">
            <strong>Room <span className="mono">{code}</span></strong>
            <button type="button" className="share-qr-close" aria-label="Close QR code" onClick={() => setOpen(false)}>×</button>
          </div>
          <canvas ref={canvasRef} className="share-qr-code" role="img" aria-label={`Scannable invite QR for room ${code}`} />
          <button type="button" className="btn btn-primary w-full !py-2 text-sm" onClick={copyImage}>{copied ? "Copied" : "Copy QR image"}</button>
        </div>
      ) : (
        <button type="button" className="share-qr-trigger" aria-expanded="false" onClick={() => setOpen(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3h7v7H3V3Zm2 2v3h3V5H5Zm9-2h7v7h-7V3Zm2 2v3h3V5h-3ZM3 14h7v7H3v-7Zm2 2v3h3v-3H5Zm9-2h3v3h-3v-3Zm4 0h3v3h-3v-3Zm-4 4h3v3h-3v-3Zm4 0h3v3h-3v-3Z" fill="currentColor" />
          </svg>
          Share QR
        </button>
      )}
    </aside>
  );
}
