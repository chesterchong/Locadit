// Collage placeholder slots for the landing intro.
// Coordinates are centres in a fixed 1600×900 stage that is scaled to the viewport.
// To swap in real artwork: set kind: "img" and src: "/collage/your-cutout.png" (put files in /public/collage).
// `layer` decides when a piece pops in (layer N appears with wordmark style N).
// `to` is where a piece settles when the wordmark leaves and the phone cards arrive.
export type Piece = {
  id: string;
  layer: 1 | 2 | 3 | 4 | 5;
  kind: "emoji" | "text" | "checker" | "polaroid" | "cloud" | "img";
  content?: string;
  src?: string;
  x: number;
  y: number;
  size: number;
  h?: number;
  rot?: number;
  z?: number;
  font?: "hand" | "serif" | "mono" | "pixel" | "caption";
  color?: string;
  underline?: boolean;
  to?: { x?: number; y?: number; size?: number; rot?: number };
  hideAtEnd?: boolean;
  hover?: boolean; // grows slightly on hover
  wind?: number;   // sway amplitude in degrees (default 2.5); light or tall things get more
  cycle?: string[]; // text pieces only: lines to rotate through
};

export const PIECES: Piece[] = [
  // Layer 1 · beach scene (serif wordmark)
  { id: "umb-l", wind: 4, layer: 1, kind: "img", src: "/collage/umb-l.png", content: "⛱️", x: 330, y: 470, size: 230, rot: -10 },
  { id: "umb-r", wind: 4, layer: 1, kind: "img", src: "/collage/umb-r.png", content: "⛱️", x: 1240, y: 430, size: 200, rot: 8 },
  { id: "beach", wind: 2, layer: 1, kind: "img", src: "/collage/beach.png", content: "🏖️", x: 880, y: 810, size: 300, z: 8 },
  { id: "rock-l", wind: 0.6, layer: 1, kind: "img", src: "/collage/rock-l.png", content: "🪨", x: 180, y: 770, size: 200, rot: -6 },
  { id: "rock-r", wind: 0.6, layer: 1, kind: "img", src: "/collage/rock-r.png", content: "🪨", x: 1380, y: 800, size: 170, rot: 12 },
  { id: "palm-a", wind: 7, layer: 1, kind: "img", src: "/collage/palm-a.png", content: "🌴", x: 640, y: 360, size: 150, rot: -4, to: { x: 110, y: 230, size: 300 } },
  { id: "palm-b", wind: 7, layer: 1, kind: "img", src: "/collage/palm-b.png", content: "🌴", x: 960, y: 360, size: 150, rot: 4, to: { x: 1480, y: 200, size: 300 } },

  // Layer 2 · sunflower, palms, city (heavy sans wordmark)
  { id: "sun", wind: 4, hover: true, layer: 2, kind: "img", src: "/collage/sun.png", content: "🌻", x: 800, y: 380, size: 440, z: 5, to: { x: 150, y: 560, size: 270, rot: -15 } },
  { id: "palm-c", wind: 7.5, layer: 2, kind: "img", src: "/collage/palm-c.png", content: "🌴", x: 250, y: 280, size: 300, rot: -8 },
  { id: "palm-d", wind: 7, layer: 2, kind: "img", src: "/collage/palm-d.png", content: "🌴", x: 1330, y: 280, size: 280, rot: 6 },
  { id: "city", wind: 0.8, hover: true, layer: 2, kind: "img", src: "/collage/city.png", content: "🏙️", x: 1470, y: 560, size: 320 },
  { id: "lantern", wind: 5, layer: 2, kind: "img", src: "/collage/lantern.png", content: "🏮", x: 1520, y: 400, size: 140, rot: 10 },

  // Layer 3 · objects and people (rounded wordmark)
  { id: "phone", wind: 2, hover: true, layer: 3, kind: "img", src: "/collage/phone.png", content: "☎️", x: 450, y: 330, size: 170, rot: -18, to: { x: 420, y: 330 } },
  { id: "octo", wind: 2, hover: true, layer: 3, kind: "img", src: "/collage/octo.png", content: "🐙", x: 1090, y: 640, size: 210, rot: 15 },
  { id: "book", wind: 2.5, hover: true, layer: 3, kind: "img", src: "/collage/book.png", content: "📙", x: 1350, y: 720, size: 230, rot: 14 },
  { id: "portrait", wind: 1.5, hover: true, layer: 3, kind: "img", src: "/collage/portrait.png", content: "🧑‍🎤", x: 150, y: 640, size: 230, rot: -5 },
  { id: "opera", wind: 0.8, hover: true, layer: 3, kind: "img", src: "/collage/opera.png", content: "🏛️", x: 1510, y: 660, size: 270 },
  { id: "drink", layer: 3, kind: "text", content: "DEPART", x: 600, y: 520, size: 22, font: "serif", color: "#222" },
  { id: "fish", wind: 3, layer: 3, kind: "img", src: "/collage/fish.png", content: "🐠", x: 520, y: 580, size: 90, rot: -10 },
  { id: "cactus-l", wind: 2, layer: 3, kind: "img", src: "/collage/cactus-l.png", content: "🌵", x: 340, y: 820, size: 180, rot: -6 },
  { id: "cactus-r", wind: 6, layer: 3, kind: "img", src: "/collage/cactus-r.png", content: "🌵", x: 1190, y: 830, size: 170, rot: 8 },
  { id: "flower", wind: 5, layer: 3, kind: "img", src: "/collage/flower.png", content: "🌸", x: 1020, y: 790, size: 100 },

  // Layer 4 · sky, clouds, devices (pixel wordmark)
  { id: "cloud-a", layer: 4, kind: "cloud", x: 560, y: 170, size: 170, h: 70, z: 3 },
  { id: "cloud-b", layer: 4, kind: "cloud", x: 930, y: 100, size: 130, h: 55, z: 3 },
  { id: "cloud-c", layer: 4, kind: "cloud", x: 1230, y: 220, size: 150, h: 60, z: 3 },
  { id: "balloon", wind: 6, hover: true, layer: 4, kind: "img", src: "/collage/balloon.png", content: "🎈", x: 1420, y: 300, size: 120, rot: 5 },
  { id: "tape", wind: 2, layer: 4, kind: "img", src: "/collage/tape.png", content: "📼", x: 720, y: 520, size: 170, rot: -12, hideAtEnd: true },
  { id: "camera", wind: 2, hover: true, layer: 4, kind: "img", src: "/collage/camera.png", content: "📷", x: 1480, y: 400, size: 150, rot: -15, to: { x: 1540, y: 420 } },
  { id: "birds", layer: 4, kind: "text", content: "🐦 🐦  🐦", x: 1300, y: 330, size: 26, rot: -8 },

  // Layer 5 · final details (geometric wordmark)
  { id: "ufo", wind: 5, layer: 5, kind: "img", src: "/collage/ufo.png", content: "🛸", x: 1300, y: 55, size: 100, rot: -10 },
  { id: "bfly-a", wind: 8, layer: 5, kind: "img", src: "/collage/bfly-a.png", content: "🦋", x: 640, y: 210, size: 60, rot: 15 },
  { id: "bfly-b", wind: 8, layer: 5, kind: "img", src: "/collage/bfly-b.png", content: "🦋", x: 1060, y: 150, size: 50, rot: -20 },
  { id: "affaire", layer: 5, kind: "text", content: "FOR THE TWO\nOF YOU", cycle: ["FOR THE TWO\nOF YOU", "ONE PLAN FOR\nTHE WHOLE FAMILY", "BEST FRIENDS,\nZERO ARGUMENTS", "MARRIED, AND\nSTILL EXPLORING", "TRIPS THAT KEEP\nTHE GROUP TOGETHER"], x: 1165, y: 100, size: 24, font: "caption", color: "#fff", rot: -4 },
  { id: "lookup", layer: 5, kind: "text", content: "Look up!", x: 1400, y: 520, size: 44, font: "hand", color: "#111", rot: -12 },
  { id: "friends", layer: 5, kind: "text", content: "LET'S GO!", x: 330, y: 600, size: 40, font: "hand", color: "#111", rot: -6, underline: true },
  { id: "robot", wind: 1.2, hover: true, layer: 5, kind: "img", src: "/collage/robot.png", content: "🤖", x: 240, y: 190, size: 190, rot: -8 },
  { id: "disco", wind: 4, hover: true, layer: 5, kind: "img", src: "/collage/disco.png", content: "🪩", x: 90, y: 180, size: 130 },
  { id: "pol-a", wind: 3, hover: true, layer: 5, kind: "img", src: "/collage/pol-a.png", x: 380, y: 360, size: 90, h: 150, rot: 12, color: "linear-gradient(160deg,#5b7cfa,#1b2a7a)" },
  { id: "pol-b", wind: 3, hover: true, layer: 5, kind: "img", src: "/collage/pol-b.png", x: 470, y: 290, size: 96, h: 160, rot: -8, color: "linear-gradient(160deg,#ffb36b,#ff5e8a)" },
  { id: "pol-c", wind: 3, hover: true, layer: 5, kind: "img", src: "/collage/pol-c.png", x: 560, y: 330, size: 80, h: 130, rot: 18, color: "linear-gradient(160deg,#7ee0c2,#1d8a6b)" },
  { id: "daisy", wind: 5, layer: 5, kind: "img", src: "/collage/daisy.png", content: "🌼", x: 460, y: 870, size: 80 },
  { id: "alien", wind: 0.8, layer: 5, kind: "img", src: "/collage/alien.png", content: "👾", x: 1290, y: 880, size: 120 },
  { id: "wheel", wind: 1, hover: true, layer: 5, kind: "img", src: "/collage/wheel.png", content: "🎡", x: 1580, y: 520, size: 200 },
  { id: "heart", layer: 5, kind: "text", content: "♡", x: 1470, y: 210, size: 60, font: "hand", color: "#111", rot: 15 },
];
