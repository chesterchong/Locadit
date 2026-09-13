// Tree QR from tree.icqr.com: the payload is "20" + URL, base64 without padding.
export function treeQrUrl(link: string): string {
  const b64 = typeof window === "undefined" ? Buffer.from("20" + link).toString("base64") : btoa("20" + link);
  return `https://tree.icqr.com/?q=${b64.replace(/=+$/, "")}`;
}
