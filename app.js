/* global supabase */

const SUPABASE_URL = "https://nxzuqwbmtbrmkgwazojt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xOAZSQ8gkd_ZUFHgud7DRA_JeXjZXqR";
const SUPABASE_STORAGE_BUCKET = "moss-quilt";
const STORAGE_PREFIX = "pieces";
const MAX_BYTES = 5 * 1024 * 1024;

const EMPTY_FILL = "#B8E600";

const BLOCK_NAMES = [
  "Log Cabin",
  "Ohio Star",
  "Flying Geese",
  "Nine Patch",
  "Chimneys and Cornerstones",
  "Courthouse Steps",
];

let BLOCKS = [];

const SVG_VIEW_WIDTH = 1440;
const SVG_VIEW_HEIGHT = 1439.22;
const COLS = 2;
const ROWS = 3;
const CELL_W = SVG_VIEW_WIDTH / COLS;
const CELL_H = SVG_VIEW_HEIGHT / ROWS;

function parseTransform(transformAttr) {
  if (!transformAttr) return (x, y) => [x, y];
  const tx = 0, ty = 0;
  let a = 1, b = 0, c = 0, d = 1, e = 0, f = 0;
  const translateMatch = transformAttr.match(/translate\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/);
  const rotateMatch = transformAttr.match(/rotate\s*\(\s*([-\d.]+)\s*\)/);
  if (rotateMatch) {
    const deg = parseFloat(rotateMatch[1]);
    const r = (deg * Math.PI) / 180;
    a = Math.cos(r); b = Math.sin(r); c = -b; d = a;
  }
  if (translateMatch) {
    e = parseFloat(translateMatch[1]);
    f = parseFloat(translateMatch[2]);
  }
  return (x, y) => [a * x + c * y + e, b * x + d * y + f];
}

function rectToPoints(rect) {
  const x = parseFloat(rect.getAttribute("x")) || 0;
  const y = parseFloat(rect.getAttribute("y")) || 0;
  const w = parseFloat(rect.getAttribute("width")) || 0;
  const h = parseFloat(rect.getAttribute("height")) || 0;
  const tr = parseTransform(rect.getAttribute("transform"));
  const corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  return corners.map(([px, py]) => tr(px, py));
}

function polygonToPoints(polygon) {
  const points = polygon.getAttribute("points").trim().split(/[\s,]+/).map(Number);
  const out = [];
  for (let i = 0; i < points.length; i += 2) out.push([points[i], points[i + 1]]);
  return out;
}

function centroid(points) {
  let sx = 0, sy = 0, n = points.length;
  for (const [px, py] of points) { sx += px; sy += py; }
  return [sx / n, sy / n];
}

function cellIndex(cx, cy) {
  const col = Math.floor(cx / CELL_W);
  const row = Math.floor(cy / CELL_H);
  const c = Math.max(0, Math.min(COLS - 1, col));
  const r = Math.max(0, Math.min(ROWS - 1, row));
  return r * COLS + c;
}

function normalizeToBlock(points, blockMinX, blockMinY, blockW, blockH) {
  if (blockW <= 0 || blockH <= 0) return points.map(([px, py]) => `${px},${py}`);
  return points.map(([px, py]) =>
    `${((px - blockMinX) / blockW * 100).toFixed(2)},${((py - blockMinY) / blockH * 100).toFixed(2)}`
  ).join(" ");
}

async function loadBlocksFromSVG() {
  const res = await fetch("moss-quilts-grid.svg");
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const shapes = [];
  const walk = (el) => {
    if (!el) return;
    const tag = el.tagName?.toLowerCase();
    if (tag === "rect" && (el.getAttribute("class") === "st0" || el.getAttribute("class") === "st1")) {
      const w = parseFloat(el.getAttribute("width")) || 0;
      const h = parseFloat(el.getAttribute("height")) || 0;
      if (w > 600 && h > 600) return;
      const pts = rectToPoints(el);
      if (pts.length >= 3) shapes.push(pts);
    } else if (tag === "polygon" && el.getAttribute("class") === "st0") {
      const pts = polygonToPoints(el);
      if (pts.length >= 3) shapes.push(pts);
    }
    if (el.children) for (const c of el.children) walk(c);
  };
  walk(doc.documentElement);
  const ohioStarCenterTriangles = [
    [[834.525, 376.57], [949.05, 262.04], [1178.1, 262.04]],
    [[834.525, 376.57], [1178.1, 262.04], [1178.1, 491.09]],
    [[834.525, 376.57], [1178.1, 491.09], [949.05, 491.09]],
    [[834.525, 376.57], [949.05, 491.09], [949.05, 262.04]],
  ];
  ohioStarCenterTriangles.forEach(tri => shapes.push(tri));
  const byCell = Array.from({ length: 6 }, () => []);
  for (const pts of shapes) {
    const [cx, cy] = centroid(pts);
    const idx = cellIndex(cx, cy);
    byCell[idx].push(pts);
  }
  const blocks = [];
  for (let i = 0; i < 6; i++) {
    const list = byCell[i];
    if (list.length === 0) {
      blocks.push({ id: i + 1, name: BLOCK_NAMES[i], pieces: [] });
      continue;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const pts of list) {
      for (const [px, py] of pts) {
        minX = Math.min(minX, px); minY = Math.min(minY, py);
        maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
      }
    }
    const blockW = maxX - minX || 1;
    const blockH = maxY - minY || 1;
    const pieces = list.map(pts => normalizeToBlock(pts, minX, minY, blockW, blockH));
    blocks.push({ id: i + 1, name: BLOCK_NAMES[i], pieces });
  }
  return blocks;
}

function $(sel) {
  return document.querySelector(sel);
}

function el(tag, attrs = {}) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, String(v));
  }
  return node;
}

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function pieceId(blockId, pieceIndex) {
  return `block-${blockId}-piece-${pieceIndex}`;
}

function storagePathFor(piece) {
  return `${STORAGE_PREFIX}/${piece}`;
}

function safeCreateClient() {
  if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
  if (!SUPABASE_URL.startsWith("https://") || SUPABASE_URL.includes("YOUR-PROJECT")) return null;
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("YOUR_PUBLIC_ANON_KEY")) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const client = safeCreateClient();

function render() {
  const quilt = $("#quilt");
  quilt.innerHTML = "";

  for (const block of BLOCKS) {
    const blockEl = el("div", { class: "block", "data-block": String(block.id), "aria-label": block.name });

    const arrow = el("div", { class: "upload-arrow", "aria-hidden": "true" });
    blockEl.appendChild(arrow);

    const svg = svgEl("svg", {
      viewBox: "0 0 100 100",
      preserveAspectRatio: "none",
      role: "img",
      "aria-label": block.name,
    });

    const defs = svgEl("defs");
    svg.appendChild(defs);

    block.pieces.forEach((points, i) => {
      const idx = i + 1;
      const id = pieceId(block.id, idx);
      const clipId = `clip-${id}`;

      const g = svgEl("g", { class: "piece", "data-piece": id, tabindex: "0" });

      const clip = svgEl("clipPath", { id: clipId });
      const clipPoly = svgEl("polygon", { points });
      clip.appendChild(clipPoly);
      defs.appendChild(clip);

      const shape = svgEl("polygon", { class: "piece-shape", points, fill: EMPTY_FILL });
      g.appendChild(shape);

      const img = svgEl("image", {
        class: "piece-image",
        x: "0",
        y: "0",
        width: "100",
        height: "100",
        href: "",
        "clip-path": `url(#${clipId})`,
        preserveAspectRatio: "xMidYMid slice",
      });
      g.appendChild(img);

      const outline = svgEl("polygon", { class: "piece-outline", points });
      g.appendChild(outline);

      svg.appendChild(g);
    });

    blockEl.appendChild(svg);
    quilt.appendChild(blockEl);
  }
}

function showArrow(blockEl, clientX, clientY) {
  const arrow = blockEl.querySelector(".upload-arrow");
  const rect = blockEl.getBoundingClientRect();
  const x = Math.max(10, Math.min(rect.width - 10, clientX - rect.left));
  const y = Math.max(10, Math.min(rect.height - 10, clientY - rect.top));
  arrow.style.left = `${x}px`;
  arrow.style.top = `${y}px`;
  blockEl.classList.add("is-hovering");
}

function hideArrow(blockEl) {
  blockEl.classList.remove("is-hovering");
}

async function maybeLoadExistingImages() {
  if (!client) return;

  for (const block of BLOCKS) {
    for (let i = 1; i <= block.pieces.length; i++) {
      const id = pieceId(block.id, i);
      const path = storagePathFor(id);
      const { data } = client.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
      const url = data?.publicUrl;
      if (!url) continue;

      try {
        const res = await fetch(url, { method: "HEAD", cache: "no-store" });
        if (!res.ok) continue;
      } catch {
        continue;
      }

      setPieceImage(id, `${url}?t=${Date.now()}`);
      lockPiece(id);
    }
  }
}

function setPieceImage(id, url) {
  const node = document.querySelector(`.piece[data-piece="${id}"] image.piece-image`);
  if (!node) return;
  node.classList.remove("is-visible");
  node.setAttribute("href", url);

  const onLoad = () => {
    node.classList.add("is-visible");
    node.removeEventListener("load", onLoad);
  };
  node.addEventListener("load", onLoad);
}

function lockPiece(id) {
  const piece = document.querySelector(`.piece[data-piece="${id}"]`);
  if (!piece) return;
  piece.dataset.locked = "true";
}

function bindFactsPopup() {
  const btn = $("#factsButton");
  const dlg = $("#factsDialog");
  const backdrop = $("#factsBackdrop");

  function open() {
    btn.setAttribute("aria-expanded", "true");
    backdrop.hidden = false;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.removeAttribute("hidden");
  }

  function close() {
    btn.setAttribute("aria-expanded", "false");
    backdrop.hidden = true;
    if (typeof dlg.close === "function" && dlg.open) dlg.close();
    else dlg.setAttribute("hidden", "true");
  }

  btn.addEventListener("click", () => {
    if (dlg.open) close();
    else open();
  });

  backdrop.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  dlg.addEventListener("click", (e) => {
    const rect = dlg.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) close();
  });
}

function bindUploads() {
  const picker = $("#filePicker");
  let currentPiece = null;

  function requestUpload(piece) {
    currentPiece = piece;
    picker.value = "";
    picker.click();
  }

  document.addEventListener("pointerover", (e) => {
    const piece = e.target.closest?.(".piece");
    if (!piece) return;
    if (piece.dataset.locked === "true") return;
    const blockEl = piece.closest(".block");
    if (!blockEl) return;
    showArrow(blockEl, e.clientX, e.clientY);
  });

  document.addEventListener("pointermove", (e) => {
    const piece = e.target.closest?.(".piece");
    if (!piece) return;
    if (piece.dataset.locked === "true") return;
    const blockEl = piece.closest(".block");
    if (!blockEl) return;
    showArrow(blockEl, e.clientX, e.clientY);
  });

  document.addEventListener("pointerout", (e) => {
    const blockEl = e.target.closest?.(".block");
    if (!blockEl) return;
    const related = e.relatedTarget;
    if (related && blockEl.contains(related)) return;
    hideArrow(blockEl);
  });

  document.addEventListener("click", (e) => {
    const piece = e.target.closest?.(".piece");
    if (!piece) return;
    if (piece.dataset.locked === "true") return;
    const id = piece.getAttribute("data-piece");
    if (!id) return;
    requestUpload(id);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const piece = document.activeElement?.closest?.(".piece");
    if (!piece) return;
    if (piece.dataset.locked === "true") return;
    e.preventDefault();
    const id = piece.getAttribute("data-piece");
    if (!id) return;
    requestUpload(id);
  });

  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];
    if (!file || !currentPiece) return;
    if (file.size > MAX_BYTES) return;

    const tempUrl = URL.createObjectURL(file);
    setPieceImage(currentPiece, tempUrl);

    if (!client) return;
    const path = storagePathFor(currentPiece);

    try {
      const { error } = await client.storage.from(SUPABASE_STORAGE_BUCKET).upload(path, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type || "image/jpeg",
      });
      if (error) return;

      const { data } = client.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
      const url = data?.publicUrl;
      if (url) {
        setPieceImage(currentPiece, `${url}?t=${Date.now()}`);
        lockPiece(currentPiece);
      }
    } finally {
      setTimeout(() => URL.revokeObjectURL(tempUrl), 2000);
    }
  });
}

loadBlocksFromSVG()
  .then((blocks) => {
    BLOCKS = blocks;
    render();
    bindFactsPopup();
    bindUploads();
    maybeLoadExistingImages();
  })
  .catch((err) => {
    console.error("Failed to load quilt SVG", err);
    document.getElementById("quilt").innerHTML = "<p>Quilt failed to load.</p>";
  });

