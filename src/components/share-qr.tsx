"use client";

import { useEffect, useRef, useState } from "react";
import qrcode from "qrcode-generator";

export default function ShareQr({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const qr = qrcode(0, "M");
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

    for (let row = 0; row < modules; row += 1) {
      for (let col = 0; col < modules; col += 1) {
        if (qr.isDark(row, col)) {
          context.fillRect((col + quietZone) * cell, (row + quietZone) * cell, cell, cell);
        }
      }
    }
  }, [code, open]);

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
            <strong>Scan to join</strong>
            <button type="button" className="share-qr-close" aria-label="Close QR code" onClick={() => setOpen(false)}>×</button>
          </div>
          <canvas ref={canvasRef} className="share-qr-code" role="img" aria-label={`Scannable invite QR for room ${code}`} />
          <span className="share-qr-room">Room <b className="mono">{code}</b></span>
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
