/* global supabase */

const SUPABASE_URL = "https://nxzuqwbmtbrmkgwazojt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xOAZSQ8gkd_ZUFHgud7DRA_JeXjZ";
const SUPABASE_STORAGE_BUCKET = "moss-quilt";
const STORAGE_PREFIX = "pieces";
const MAX_BYTES = 5 * 1024 * 1024;

const SVG_VIEW_WIDTH = 1440;
const SVG_VIEW_HEIGHT = 1439.22;
const COLS = 2;
const ROWS = 3;
const CELL_W = SVG_VIEW_WIDTH / COLS;
const CELL_H = SVG_VIEW_HEIGHT / ROWS;

function $(sel) {
  return typeof sel === "string" ? document.querySelector(sel) : sel;
}

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function pieceId(blockIndex, pieceIndex) {
  return `block-${blockIndex + 1}-piece-${pieceIndex}`;
}

function storagePathFor(id) {
  return `${STORAGE_PREFIX}/${id}`;
}

function safeCreateClient() {
  if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
  if (!SUPABASE_URL.startsWith("https://")) return null;
  if (!SUPABASE_ANON_KEY) return null;
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const client = safeCreateClient();

/** Parse path d attribute: extract all coordinate pairs, return [{x,y}, ...] */
function parsePathVertices(d) {
  const pts = [];
  if (!d || typeof d !== "string") return pts;
  const numRe = /[-+]?(?:\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
  let curX = 0, curY = 0;
  let subpathStartX = 0, subpathStartY = 0;
  let i = 0;
  const dTrim = d.trim();
  const skipWs = () => { while (i < dTrim.length && /[\s,]/.test(dTrim[i])) i++; };
  while (i < dTrim.length) {
    skipWs();
    if (i >= dTrim.length) break;
    const cmd = dTrim[i++];
    const isRel = cmd === cmd.toLowerCase();
    const readOne = () => {
      const m = numRe.exec(dTrim.slice(i));
      if (!m) return null;
      i += m.index + m[0].length;
      return Number(m[0]);
    };
    const readPair = () => {
      const x = readOne();
      const y = readOne();
      return x != null && y != null ? { x, y } : null;
    };
    if (cmd === "M" || cmd === "m") {
      const p = readPair();
      if (!p) continue;
      if (isRel) { curX += p.x; curY += p.y; } else { curX = p.x; curY = p.y; }
      subpathStartX = curX; subpathStartY = curY;
      pts.push({ x: curX, y: curY });
      while (true) {
        const n = readOne(), n2 = readOne();
        if (n == null || n2 == null) break;
        if (isRel) { curX += n; curY += n2; } else { curX = n; curY = n2; }
        pts.push({ x: curX, y: curY });
      }
    } else if (cmd === "L" || cmd === "l") {
      let p = readPair();
      while (p) {
        if (isRel) { curX += p.x; curY += p.y; } else { curX = p.x; curY = p.y; }
        pts.push({ x: curX, y: curY });
        p = readPair();
      }
    } else if (cmd === "H" || cmd === "h") {
      let n = readOne();
      while (n != null) {
        if (isRel) curX += n; else curX = n;
        pts.push({ x: curX, y: curY });
        n = readOne();
      }
    } else if (cmd === "V" || cmd === "v") {
      let n = readOne();
      while (n != null) {
        if (isRel) curY += n; else curY = n;
        pts.push({ x: curX, y: curY });
        n = readOne();
      }
    } else if (cmd === "Z" || cmd === "z") {
      pts.push({ x: subpathStartX, y: subpathStartY });
      curX = subpathStartX; curY = subpathStartY;
    } else if (cmd === "C" || cmd === "c") {
      let p = readPair();
      while (p) {
        readOne(); readOne();
        const p2 = readPair();
        if (!p2) break;
        if (isRel) { curX += p2.x; curY += p2.y; } else { curX = p2.x; curY = p2.y; }
        pts.push({ x: curX, y: curY });
        p = readPair();
      }
    } else if (cmd === "S" || cmd === "s" || cmd === "Q" || cmd === "q") {
      let p = readPair();
      while (p) {
        const p2 = readPair();
        if (!p2) break;
        if (isRel) { curX += p2.x; curY += p2.y; } else { curX = p2.x; curY = p2.y; }
        pts.push({ x: curX, y: curY });
        p = readPair();
      }
    } else if (cmd === "T" || cmd === "t") {
      const p = readPair();
      if (p) {
        if (isRel) { curX += p.x; curY += p.y; } else { curX = p.x; curY = p.y; }
        pts.push({ x: curX, y: curY });
      }
    } else if (cmd === "A" || cmd === "a") {
      readOne(); readOne(); readOne(); readOne(); readOne();
      const p = readPair();
      if (p) {
        if (isRel) { curX += p.x; curY += p.y; } else { curX = p.x; curY = p.y; }
        pts.push({ x: curX, y: curY });
      }
    }
  }
  return pts;
}

/** Geometric centroid of shape in SVG user coords (uses getBBox for transforms). */
function shapeCentroid(el) {
  const b = el.getBBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

function centroidToViewport(svg, el, cx, cy) {
  const pt = svg.createSVGPoint();
  pt.x = cx;
  pt.y = cy;
  const ctm = el.getScreenCTM();
  if (!ctm) return null;
  const p = pt.matrixTransform(ctm);
  return { x: p.x, y: p.y };
}

function cellIndex(cx, cy) {
  const col = Math.max(0, Math.min(COLS - 1, Math.floor(cx / CELL_W)));
  const row = Math.max(0, Math.min(ROWS - 1, Math.floor(cy / CELL_H)));
  return row * COLS + col;
}

function setPieceImage(meta, url) {
  if (!meta.imageEl) return;
  meta.imageEl.classList.remove("is-visible");
  meta.imageEl.setAttribute("href", url);
  meta.imageEl.addEventListener("load", function onLoad() {
    meta.imageEl.classList.add("is-visible");
    meta.imageEl.removeEventListener("load", onLoad);
  }, { once: true });
}

function initQuiltPieces(svg) {
  const defs = svg.querySelector("defs") || svg.insertBefore(svgEl("defs"), svg.firstChild);
  const hitLayer = svgEl("g", { "class": "piece-hit-layer" });
  svg.appendChild(hitLayer);

  // Only closed shapes (rect, polygon) are upload pieces. Stroke-only elements (line, path outlines) are excluded.
  const shapes = [];
  const walk = (el) => {
    if (!el) return;
    const tag = el.tagName?.toLowerCase();
    if (tag === "line") return; // stroke-only outline, not a piece
    if (tag === "rect") {
      const w = parseFloat(el.getAttribute("width")) || 0;
      const h = parseFloat(el.getAttribute("height")) || 0;
      if (w > 600 && h > 600) return; // frame/background rect, not a piece
      shapes.push(el);
    } else if (tag === "polygon") {
      shapes.push(el);
    }
    if (el.children) for (const c of el.children) walk(c);
  };
  walk(svg);

  const byCell = Array.from({ length: 6 }, () => []);
  for (const el of shapes) {
    const { x: cx, y: cy } = shapeCentroid(el);
    const idx = cellIndex(cx, cy);
    byCell[idx].push({ el, cx, cy });
  }

  const elToMeta = new WeakMap();
  const byId = new Map();
  let globalPieceIndex = 0;

  for (let cell = 0; cell < 6; cell++) {
    const list = byCell[cell];
    const blockId = cell + 1;
    list.forEach(({ el, cx, cy }, i) => {
      const pieceIndex = i + 1;
      const id = pieceId(blockId - 1, pieceIndex);
      globalPieceIndex++;

      const clipId = `clip-${id}`;
      const clip = svgEl("clipPath", { id: clipId });
      clip.appendChild(el.cloneNode(true));
      defs.appendChild(clip);

      const bbox = el.getBBox();
      const imageEl = svgEl("image", {
        "class": "piece-image",
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
        href: "",
        "clip-path": `url(#${clipId})`,
        preserveAspectRatio: "xMidYMid slice",
      });
      el.parentNode.insertBefore(imageEl, el);

      const hit = el.cloneNode(true);
      hit.setAttribute("class", "piece-hit");
      hit.setAttribute("fill", "transparent");
      hit.removeAttribute("stroke");
      hit.setAttribute("data-piece-id", id);
      hitLayer.appendChild(hit);

      const meta = {
        id,
        el: hit,
        imageEl,
        originalEl: el,
        location_description: null,
        city_state: null,
      };
      elToMeta.set(hit, meta);
      byId.set(id, meta);
    });
  }

  console.log("Upload pieces registered:", byId.size);
  return { elToMeta, byId };
}

/** Fetch all piece_ids from uploads table. */
async function fetchUploadedPieces() {
  const uploaded = new Set();
  if (!client) return uploaded;
  try {
    const { data: rows, error } = await client.from("uploads").select("piece_id, photo_url, location_description, city_state");
    if (error || !rows) return uploaded;
    for (const row of rows) {
      uploaded.add(row.piece_id);
    }
  } catch (_) {}
  return uploaded;
}

/** Load existing photos and metadata into byId. */
async function loadExistingImages(byId, uploadedPieces) {
  if (!client) return;
  try {
    const { data: rows } = await client.from("uploads").select("piece_id, photo_url, location_description, city_state");
    if (!rows) return;
    for (const row of rows) {
      uploadedPieces.add(row.piece_id);
      const meta = byId.get(row.piece_id);
      if (!meta) continue;
      setPieceImage(meta, (row.photo_url || "").includes("?") ? row.photo_url + "&t=" + Date.now() : row.photo_url + "?t=" + Date.now());
      meta.location_description = row.location_description || null;
      meta.city_state = row.city_state || null;
    }
  } catch (_) {}
}

function bindFactsPopup() {
  const btn = $("#factsButton");
  const dlg = $("#factsDialog");
  const backdrop = $("#factsBackdrop");
  if (!btn || !dlg) return;
  function open() {
    btn.setAttribute("aria-expanded", "true");
    if (backdrop) backdrop.hidden = false;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.removeAttribute("hidden");
  }
  function close() {
    btn.setAttribute("aria-expanded", "false");
    if (backdrop) backdrop.hidden = true;
    if (typeof dlg.close === "function" && dlg.open) dlg.close();
    else dlg.setAttribute("hidden", "true");
  }
  btn.addEventListener("click", () => { if (dlg.open) close(); else open(); });
  if (backdrop) backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  dlg.addEventListener("click", (e) => {
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
  });
}

function showLoading(show) {
  const el = $("#uploadLoading");
  if (el) el.hidden = !show;
}

function showError(msg) {
  const el = $("#uploadError");
  if (el) {
    el.textContent = msg || "Something went wrong.";
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 5000);
  }
}

function bindMetadataDialog(byId, onClose) {
  const dlg = $("#metadataDialog");
  const form = $("#metadataForm");
  const skipBtn = $("#metadataSkip");
  if (!dlg || !form) return;

  let currentRowId = null;
  let currentPieceId = null;

  function close() {
    currentRowId = null;
    currentPieceId = null;
    if (typeof dlg.close === "function" && dlg.open) dlg.close();
    else dlg.setAttribute("hidden", "true");
    if (onClose) onClose();
  }

  skipBtn?.addEventListener("click", () => close());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentRowId || !client) { close(); return; }
    const loc = form.location?.value?.trim() || null;
    const city = form.city_state?.value?.trim() || null;
    try {
      await client.from("uploads").update({ location_description: loc, city_state: city }).eq("id", currentRowId);
      const meta = byId.get(currentPieceId);
      if (meta) {
        meta.location_description = loc;
        meta.city_state = city;
      }
    } catch (_) {}
    close();
  });

  return {
    open(rowId, pieceId) {
      currentRowId = rowId;
      currentPieceId = pieceId;
      form.location.value = "";
      form.city_state.value = "";
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.removeAttribute("hidden");
    },
    close,
  };
}

function bindUploads(svg, elToMeta, byId, uploadedPieces) {
  const picker = $("#filePicker");
  const hoverArrow = $("#hoverArrow");
  const piecePopup = $("#pieceHoverPopup");
  let currentId = null;
  let uploading = false;

  const metadataDialog = bindMetadataDialog(byId, () => { showLoading(false); });

  function findMeta(target) {
    let t = target;
    while (t && t !== svg) {
      if (elToMeta.has(t)) return elToMeta.get(t);
      t = t.parentNode;
    }
    return null;
  }

  function hideHover() {
    if (hoverArrow) {
      hoverArrow.hidden = true;
      hoverArrow.style.left = "-9999px";
      hoverArrow.style.top = "-9999px";
    }
    if (piecePopup) {
      piecePopup.classList.remove("is-visible");
      piecePopup.textContent = "";
    }
  }

  function showIconAt(meta) {
    const { x, y } = shapeCentroid(meta.originalEl);
    const vp = centroidToViewport(svg, meta.originalEl, x, y);
    if (!vp || !hoverArrow) return;
    hoverArrow.hidden = false;
    hoverArrow.style.left = vp.x + "px";
    hoverArrow.style.top = vp.y + "px";
    hoverArrow.style.transform = "translate(-50%, -50%)";
  }

  function showLocationPopup(meta) {
    if (!piecePopup) return;
    const lines = [];
    if (meta.location_description) lines.push(meta.location_description);
    if (meta.city_state) lines.push(meta.city_state);
    piecePopup.textContent = lines.length ? lines.join("\n") : "No location added.";
    piecePopup.classList.add("is-visible");
    const { x, y } = shapeCentroid(meta.originalEl);
    const vp = centroidToViewport(svg, meta.originalEl, x, y);
    if (vp) {
      piecePopup.style.left = (vp.x - 245 / 2) + "px";
      piecePopup.style.top = (vp.y - 125 / 2) + "px";
    }
  }

  svg.addEventListener("pointermove", (e) => {
    if (uploading) return hideHover();
    const meta = findMeta(e.target);
    if (!meta) return hideHover();
    if (uploadedPieces.has(meta.id)) {
      if (hoverArrow) hoverArrow.hidden = true;
      showLocationPopup(meta);
    } else {
      piecePopup.classList.remove("is-visible");
      piecePopup.textContent = "";
      showIconAt(meta);
    }
  });

  svg.addEventListener("pointerleave", hideHover);

  svg.addEventListener("click", (e) => {
    if (uploading) return;
    const meta = findMeta(e.target);
    if (!meta || uploadedPieces.has(meta.id)) return;
    currentId = meta.id;
    picker.value = "";
    picker.click();
  });

  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];
    if (!file || !currentId) return;
    if (file.size > MAX_BYTES) {
      showError("Photo must be under 5MB.");
      return;
    }
    const meta = byId.get(currentId);
    if (!meta || uploadedPieces.has(currentId)) return;

    uploading = true;
    showLoading(true);
    hideHover();

    const tempUrl = URL.createObjectURL(file);
    setPieceImage(meta, tempUrl);

    if (!client) {
      showLoading(false);
      showError("Upload is not available.");
      uploading = false;
      return;
    }

    const path = storagePathFor(currentId);
    try {
      const { error } = await client.storage.from(SUPABASE_STORAGE_BUCKET).upload(path, file, {
        upsert: false,
        cacheControl: "3600",
        contentType: file.type || "image/jpeg",
      });

      if (error) {
        showLoading(false);
        if ((error.message || "").includes("already exists")) {
          const { data } = client.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
          const url = data?.publicUrl;
          if (url) {
            uploadedPieces.add(currentId);
            setPieceImage(meta, url + "?t=" + Date.now());
          }
        } else {
          showError("Upload failed: " + (error.message || "unknown"));
        }
        uploading = false;
        return;
      }

      const { data } = client.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
      const photoUrl = data?.publicUrl ? data.publicUrl + "?t=" + Date.now() : null;

      if (photoUrl) {
        try {
          const insertRes = await client.from("uploads").insert({ piece_id: currentId, photo_url: photoUrl }).select("id").single();
          if (insertRes.error) {
            showLoading(false);
            showError("Database error.");
            uploading = false;
            return;
          }
          uploadedPieces.add(currentId);
          showLoading(false);
          metadataDialog.open(insertRes.data.id, currentId);
        } catch (_) {
          showLoading(false);
          showError("Database error.");
        }
      } else {
        uploadedPieces.add(currentId);
        showLoading(false);
      }
    } catch (err) {
      showLoading(false);
      showError("Upload failed.");
    } finally {
      uploading = false;
      setTimeout(() => URL.revokeObjectURL(tempUrl), 2000);
    }
  });
}

const quiltEl = $("#quilt");
const svg = quiltEl?.querySelector("svg");
if (svg) {
  const { elToMeta, byId } = initQuiltPieces(svg);
  window.__quiltPieceCount = byId.size;
  bindFactsPopup();
  (async () => {
    const uploadedPieces = await fetchUploadedPieces();
    await loadExistingImages(byId, uploadedPieces);
    bindUploads(svg, elToMeta, byId, uploadedPieces);
  })();
}
