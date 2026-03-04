/* global supabase */

const SUPABASE_URL = "[https://nxzuqwbmtbrmkgwazojt.supabase.co](https://nxzuqwbmtbrmkgwazojt.supabase.co/)";
const SUPABASE_ANON_KEY = "sb_publishable_xOAZSQ8gkd_ZUFHgud7DRA_JeXjZXqR";
const SUPABASE_STORAGE_BUCKET = "moss-quilt";
const STORAGE_PREFIX = "pieces";
const MAX_BYTES = 5 * 1024 * 1024;

const EMPTY_FILL = "#B8E600";

const BLOCKS = [
  {
    id: 1,
    name: "Log Cabin",
    pieces: [
      // center
      "40,40 60,40 60,60 40,60",
      // ring 1
      "40,25 60,25 60,40 40,40",
      "60,25 75,25 75,75 60,75 60,60 60,40",
      "25,60 40,60 40,75 25,75",
      "25,25 40,25 40,60 25,60",
      "25,75 75,75 75,85 25,85",
      "75,25 85,25 85,85 75,85 75,75",
      "25,15 85,15 85,25 25,25",
      "15,15 25,15 25,85 15,85",
      "15,85 85,85 85,95 15,95",
      "85,15 95,15 95,95 85,95 85,85",
    ],
  },
  {
    id: 2,
    name: "Ohio Star",
    pieces: [
      // 3x3-ish with star points
      "0,0 33.33,0 33.33,33.33 0,33.33",
      "33.33,0 66.66,0 66.66,33.33 33.33,33.33",
      "66.66,0 100,0 100,33.33 66.66,33.33",
      "0,33.33 33.33,33.33 33.33,66.66 0,66.66",
      // center square
      "33.33,33.33 66.66,33.33 66.66,66.66 33.33,66.66",
      "66.66,33.33 100,33.33 100,66.66 66.66,66.66",
      "0,66.66 33.33,66.66 33.33,100 0,100",
      "33.33,66.66 66.66,66.66 66.66,100 33.33,100",
      "66.66,66.66 100,66.66 100,100 66.66,100",
      // add 4 star-point triangles overlay areas as separate uploadable pieces
      "33.33,0 66.66,0 50,16.66",
      "100,33.33 100,66.66 83.33,50",
      "33.33,100 66.66,100 50,83.33",
      "0,33.33 0,66.66 16.66,50",
    ],
  },
  {
    id: 3,
    name: "Flying Geese",
    pieces: [
      // four geese units stacked
      "0,0 100,0 75,25 25,25",
      "0,0 25,25 0,25",
      "100,0 100,25 75,25",
      "0,25 100,25 75,50 25,50",
      "0,25 25,50 0,50",
      "100,25 100,50 75,50",
      "0,50 100,50 75,75 25,75",
      "0,50 25,75 0,75",
      "100,50 100,75 75,75",
      "0,75 100,75 75,100 25,100",
      "0,75 25,100 0,100",
      "100,75 100,100 75,100",
    ],
  },
  {
    id: 4,
    name: "Nine Patch",
    pieces: [
      "0,0 33.33,0 33.33,33.33 0,33.33",
      "33.33,0 66.66,0 66.66,33.33 33.33,33.33",
      "66.66,0 100,0 100,33.33 66.66,33.33",
      "0,33.33 33.33,33.33 33.33,66.66 0,66.66",
      "33.33,33.33 66.66,33.33 66.66,66.66 33.33,66.66",
      "66.66,33.33 100,33.33 100,66.66 66.66,66.66",
      "0,66.66 33.33,66.66 33.33,100 0,100",
      "33.33,66.66 66.66,66.66 66.66,100 33.33,100",
      "66.66,66.66 100,66.66 100,100 66.66,100",
    ],
  },
  {
    id: 5,
    name: "Chimneys and Cornerstones",
    pieces: [
      // large center
      "20,20 80,20 80,80 20,80",
      // cornerstones
      "0,0 20,0 20,20 0,20",
      "80,0 100,0 100,20 80,20",
      "0,80 20,80 20,100 0,100",
      "80,80 100,80 100,100 80,100",
      // chimneys (rect strips)
      "20,0 80,0 80,20 20,20",
      "0,20 20,20 20,80 0,80",
      "80,20 100,20 100,80 80,80",
      "20,80 80,80 80,100 20,100",
      // inner chimney accents
      "35,20 45,20 45,80 35,80",
      "55,20 65,20 65,80 55,80",
      "20,35 80,35 80,45 20,45",
      "20,55 80,55 80,65 20,65",
    ],
  },
  {
    id: 6,
    name: "Courthouse Steps",
    pieces: [
      "40,40 60,40 60,60 40,60",
      "40,30 60,30 60,40 40,40",
      "60,30 70,30 70,70 60,70 60,60 60,40",
      "30,60 40,60 40,70 30,70",
      "30,30 40,30 40,60 30,60",
      "30,70 70,70 70,80 30,80",
      "70,30 80,30 80,80 70,80 70,70",
      "30,20 80,20 80,30 30,30",
      "20,20 30,20 30,80 20,80",
      "20,80 80,80 80,90 20,90",
      "80,20 90,20 90,90 80,90 80,80",
      "20,10 90,10 90,20 20,20",
      "10,10 20,10 20,90 10,90",
      "10,90 90,90 90,100 10,100",
      "90,10 100,10 100,100 90,100 90,90",
    ],
  },
];

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

function showArrow(blockEl) {
  const arrow = blockEl.querySelector(".upload-arrow");
  arrow.style.left = "50%";
  arrow.style.top = "50%";
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
    showArrow(blockEl);
  });

  document.addEventListener("pointermove", (e) => {
    const piece = e.target.closest?.(".piece");
    if (!piece) return;
    if (piece.dataset.locked === "true") return;
    const blockEl = piece.closest(".block");
    if (!blockEl) return;
    showArrow(blockEl);
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

render();
bindFactsPopup();
bindUploads();
maybeLoadExistingImages();

