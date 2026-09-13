"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function TreeQr({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  const toggle = () => {
    if (open) return setOpen(false);
    setInviteUrl(new URL(`/t/${encodeURIComponent(code)}`, window.location.origin).toString());
    setOpen(true);
  };

  return (
    <aside className={`tree-qr ${open ? "is-open" : ""}`} aria-label="Room invite QR code">
      <button
        type="button"
        className="tree-qr-toggle"
        aria-expanded={open}
        aria-controls="room-invite-qr"
        aria-label={open ? "Hide invite QR code" : "Show invite QR code"}
        onClick={toggle}
      >
        {open ? (
          <span id="room-invite-qr" className="tree-qr-panel">
            <span className="tree-qr-title">Scan to join</span>
            <QRCodeSVG
              className="tree-qr-code"
              value={inviteUrl}
              size={224}
              level="M"
              marginSize={4}
              bgColor="#ffffff"
              fgColor="#171411"
              title={`Invite to room ${code}`}
            />
            <span className="tree-qr-room">Room <b className="mono">{code}</b></span>
            <span className="tree-qr-hint">Tap to close</span>
          </span>
        ) : (
          <span className="tree-qr-closed">
            <TreeArt />
            <span className="tree-qr-label">Share QR</span>
          </span>
        )}
      </button>
    </aside>
  );
}

function TreeArt() {
  return (
    <svg className="tree-qr-art" viewBox="0 0 128 148" role="img" aria-label="Autumn tree">
      <ellipse cx="64" cy="138" rx="52" ry="8" fill="#c8bba8" opacity=".42" />
      <path d="M55 134c8-28 4-52 10-80 5 25 3 52 10 80Z" fill="#75452f" />
      <path d="M62 93 39 70M68 82l25-27M63 72 48 44M70 104l25-20" fill="none" stroke="#75452f" strokeWidth="6" strokeLinecap="round" />
      <g className="tree-qr-leaves">
        <circle cx="41" cy="45" r="21" fill="#f3a64b" />
        <circle cx="65" cy="32" r="25" fill="#ffc55c" />
        <circle cx="89" cy="49" r="22" fill="#f09245" />
        <circle cx="30" cy="70" r="20" fill="#ffc95f" />
        <circle cx="57" cy="66" r="25" fill="#f5a044" />
        <circle cx="83" cy="72" r="25" fill="#ffc85d" />
        <circle cx="104" cy="75" r="17" fill="#ee9142" />
        <circle cx="45" cy="91" r="20" fill="#f7b34e" />
        <circle cx="75" cy="94" r="23" fill="#ffca63" />
      </g>
      <g fill="#e58b3f" opacity=".9">
        <path d="m25 112 7-3-2 8Z" /><path d="m98 116 8 3-7 5Z" /><path d="m44 124 8-2-3 7Z" />
      </g>
    </svg>
  );
}
