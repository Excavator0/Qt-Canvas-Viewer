function hostStatus(text) {
  const status = document.getElementById("host-status");
  if (status) status.textContent = text;
  if (window.bridge && window.bridge.setStatus) window.bridge.setStatus(text);
}

const history = [];
let applyMarksRef = null;
let redrawRef = null;
let toggleDraw = function () {};
let clearInk = function () {};

function notesObject() {
  if (!window.__NOTES__ || typeof window.__NOTES__ !== "object") window.__NOTES__ = { marks: [], strokes: [] };
  if (!Array.isArray(window.__NOTES__.marks)) window.__NOTES__.marks = [];
  if (!Array.isArray(window.__NOTES__.strokes)) window.__NOTES__.strokes = [];
  return window.__NOTES__;
}

function cloneNotes() {
  const current = notesObject();
  return {
    marks: current.marks.map((mark) => ({
      id: mark.id,
      kind: mark.kind,
      quote: mark.quote,
      prefix: mark.prefix || "",
      suffix: mark.suffix || "",
      note: mark.note || "",
    })),
    strokes: current.strokes.map((stroke) => ({
      id: stroke.id,
      color: stroke.color || "#599CE7",
      width: stroke.width || 2.5,
      points: (stroke.points || []).map((point) => [point[0], point[1]]),
    })),
  };
}

function persistNotes() {
  const clean = cloneNotes();
  if (window.bridge && window.bridge.saveNotes) window.bridge.saveNotes(JSON.stringify(clean));
}

function syncUndo() {
  const button = document.getElementById("btn-undo");
  if (button) button.disabled = history.length === 0;
}

function remember(entry) {
  history.push(entry);
  if (history.length > 200) history.shift();
  syncUndo();
}

function rememberNotes() {
  remember({ type: "notes", state: cloneNotes() });
}

function undo() {
  const entry = history.pop();
  syncUndo();
  if (!entry) {
    hostStatus("Нечего отменять");
    return false;
  }
  if (entry.type === "notes") {
    const current = notesObject();
    current.marks = entry.state.marks;
    current.strokes = entry.state.strokes;
    persistNotes();
    if (applyMarksRef) applyMarksRef();
    if (redrawRef) redrawRef();
  } else if (entry.type === "theme") {
    if (window.bridge && window.bridge.saveViewTheme) window.bridge.saveViewTheme(entry.theme);
    if (window.setViewTheme) window.setViewTheme(entry.theme);
  } else if (entry.type === "draw") {
    const ink = document.getElementById("ink");
    const drawButton = document.getElementById("btn-draw");
    if (ink) ink.classList.toggle("drawing", entry.on);
    if (drawButton) drawButton.classList.toggle("active", entry.on);
  }
  hostStatus("Отменено");
  return true;
}

function isTypingTarget(target) {
  if (!target || !target.tagName) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return !!target.isContentEditable;
}

function collectText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const parts = [];
  let full = "";
  let node = walker.nextNode();
  while (node) {
    const text = node.nodeValue || "";
    parts.push({ node, start: full.length, text });
    full += text;
    node = walker.nextNode();
  }
  return { full, parts };
}

function unwrap(root) {
  const spans = Array.from(root.querySelectorAll("span.ann"));
  for (let i = spans.length - 1; i >= 0; i -= 1) {
    const span = spans[i];
    const parent = span.parentNode;
    if (!parent) continue;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
  }
  root.normalize();
}

function findQuote(full, mark) {
  const quote = mark.quote || "";
  if (!quote) return -1;
  const prefix = mark.prefix || "";
  const suffix = mark.suffix || "";
  if (prefix || suffix) {
    const at = full.indexOf(prefix + quote + suffix);
    if (at >= 0) return at + prefix.length;
  }
  return full.indexOf(quote);
}

function slicesFor(parts, full, mark) {
  const start = findQuote(full, mark);
  if (start < 0) return [];
  const end = start + mark.quote.length;
  const slices = [];
  parts.forEach((part, index) => {
    const partEnd = part.start + part.text.length;
    if (partEnd <= start || part.start >= end) return;
    const localStart = Math.max(0, start - part.start);
    const localEnd = Math.min(part.text.length, end - part.start);
    if (localEnd <= localStart) return;
    slices.push({ index, node: part.node, localStart, localEnd, mark });
  });
  return slices;
}

function wrapSlice(slice) {
  const node = slice.node;
  if (!node || !node.parentNode) return;
  if (slice.localEnd > node.nodeValue.length) return;
  const range = document.createRange();
  range.setStart(node, slice.localStart);
  range.setEnd(node, slice.localEnd);
  const span = document.createElement("span");
  span.className = slice.mark.kind === "note" ? "ann ann-note" : "ann ann-bold";
  span.dataset.annId = slice.mark.id;
  if (slice.mark.note) span.title = slice.mark.note;
  range.surroundContents(span);
}

function renderList(root, marks, onDelete) {
  const list = document.getElementById("note-list");
  if (!list) return;
  while (list.firstChild) list.removeChild(list.firstChild);
  if (!marks.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Пока нет пометок. Выделите текст в canvas.";
    list.appendChild(empty);
    return;
  }
  marks.forEach((mark) => {
    const item = document.createElement("div");
    item.className = "note-item";
    const main = document.createElement("div");
    main.className = "note-main";
    const kind = document.createElement("div");
    kind.className = "note-kind";
    kind.textContent = mark.kind === "note" ? "Заметка" : "Жирный";
    const quote = document.createElement("div");
    quote.textContent = mark.quote;
    main.appendChild(kind);
    main.appendChild(quote);
    if (mark.note) {
      const body = document.createElement("div");
      body.className = "note-body";
      body.textContent = mark.note;
      main.appendChild(body);
    }
    if (!mark.found) {
      const miss = document.createElement("div");
      miss.className = "note-miss";
      miss.textContent = "Не найдено на этой странице";
      main.appendChild(miss);
    }
    main.addEventListener("click", () => {
      const span = root.querySelector('[data-ann-id="' + mark.id + '"]');
      if (span && span.scrollIntoView) span.scrollIntoView({ block: "center" });
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "note-delete";
    remove.title = "Удалить";
    remove.setAttribute("aria-label", "Удалить");
    remove.innerHTML = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.4"/></svg>';
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      if (onDelete) onDelete(mark.id);
    });
    item.appendChild(main);
    item.appendChild(remove);
    list.appendChild(item);
  });
}

function captureSelection(root) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  const quote = range.toString();
  if (!quote || !quote.trim()) return null;
  const { full, parts } = collectText(root);
  if (range.startContainer.nodeType !== Node.TEXT_NODE) return { quote, prefix: "", suffix: "" };
  const part = parts.find((item) => item.node === range.startContainer);
  if (!part) return { quote, prefix: "", suffix: "" };
  const start = part.start + range.startOffset;
  const end = start + quote.length;
  return {
    quote,
    prefix: full.slice(Math.max(0, start - 24), start),
    suffix: full.slice(end, end + 24),
  };
}

export function installAnnotator(root) {
  if (root.dataset.annotator === "1") return;
  root.dataset.annotator = "1";

  let observer = null;

  function applyMarks() {
    if (observer) observer.disconnect();
    unwrap(root);
    const notes = window.__NOTES__ || { marks: [] };
    const marks = Array.isArray(notes.marks) ? notes.marks : [];
    marks.forEach((mark) => {
      const collected = collectText(root);
      const found = slicesFor(collected.parts, collected.full, mark);
      mark.found = found.length > 0;
      found.sort((a, b) => b.index - a.index || b.localStart - a.localStart);
      found.forEach(wrapSlice);
    });
    if (observer) observer.observe(root, { childList: true, subtree: true, characterData: true });
    renderList(root, marks, deleteMark);
  }

  function deleteMark(id) {
    const notes = notesObject();
    const index = notes.marks.findIndex((mark) => mark.id === id);
    if (index < 0) return false;
    rememberNotes();
    notes.marks.splice(index, 1);
    persistNotes();
    applyMarks();
    hostStatus("Пометка удалена");
    return true;
  }

  function addMark(kind, note) {
    const selected = window.__selection;
    if (!selected) {
      hostStatus("Сначала выделите текст в canvas");
      return false;
    }
    const notes = notesObject();
    const noteText = note || "";
    const duplicate = notes.marks.some(
      (mark) => mark.kind === kind && mark.quote === selected.quote && (mark.note || "") === noteText && mark.prefix === selected.prefix,
    );
    if (duplicate) return false;
    rememberNotes();
    notes.marks.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      kind,
      quote: selected.quote,
      prefix: selected.prefix,
      suffix: selected.suffix,
      note: noteText,
    });
    persistNotes();
    applyMarks();
    return true;
  }

  observer = new MutationObserver(() => {
    applyMarks();
  });

  function isInteractive(event) {
    const target = event.target;
    if (!target || typeof target.closest !== "function") return false;
    return !!target.closest("button, input, textarea, select, option, a, label, summary");
  }

  function prepareForReact(event) {
    if (!isInteractive(event)) return;
    if (observer) observer.disconnect();
    unwrap(root);
    if (observer) observer.observe(root, { childList: true, subtree: true, characterData: true });
  }

  function restoreMarks(event) {
    if (!isInteractive(event)) return;
    applyMarks();
  }

  root.addEventListener("click", (event) => {
    const span = event.target.closest ? event.target.closest(".ann-note") : null;
    if (!span || !root.contains(span)) return;
    hostStatus(span.title || "Заметка");
  }, true);
  root.addEventListener("mousedown", prepareForReact, true);
  root.addEventListener("click", prepareForReact, true);
  root.addEventListener("input", prepareForReact, true);
  root.addEventListener("change", prepareForReact, true);
  root.addEventListener("mousedown", restoreMarks);
  root.addEventListener("click", restoreMarks);
  root.addEventListener("input", restoreMarks);
  root.addEventListener("change", restoreMarks);

  root.addEventListener("mouseup", () => {
    const selected = captureSelection(root);
    if (!selected) return;
    window.__selection = selected;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (rect.width || rect.height) window.__selectionRect = { top: rect.bottom + 8, left: rect.left };
  });

  const boldButton = document.getElementById("btn-bold");
  const noteButton = document.getElementById("btn-note");
  const noteInput = document.getElementById("note-input");
  const notePopover = document.getElementById("note-popover");
  const noteSave = document.getElementById("btn-note-save");

  function placeNotePopover() {
    if (!notePopover) return;
    let top = 56;
    let left = 16;
    const saved = window.__selectionRect;
    if (saved) {
      top = saved.top;
      left = saved.left;
    }
    const width = 280;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    top = Math.max(52, Math.min(top, window.innerHeight - 56));
    notePopover.style.top = top + "px";
    notePopover.style.left = left + "px";
  }

  function closeNotePopover() {
    if (!notePopover) return;
    notePopover.hidden = true;
    if (noteInput) noteInput.value = "";
  }

  function saveNote() {
    const text = noteInput ? noteInput.value.trim() : "";
    if (!text) {
      hostStatus("Впишите текст заметки");
      if (noteInput) noteInput.focus();
      return;
    }
    addMark("note", text);
    closeNotePopover();
  }

  function openNote() {
    if (!notePopover) return;
    if (!notePopover.hidden) {
      closeNotePopover();
      return;
    }
    notePopover.hidden = false;
    placeNotePopover();
    if (noteInput) noteInput.focus();
  }

  if (boldButton) boldButton.addEventListener("click", () => addMark("bold", ""));
  if (noteButton) noteButton.addEventListener("click", openNote);
  if (noteSave) noteSave.addEventListener("click", saveNote);
  if (noteInput) {
    noteInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveNote();
      } else if (event.key === "Escape") {
        closeNotePopover();
      }
    });
  }

  const undoButton = document.getElementById("btn-undo");
  if (undoButton) undoButton.addEventListener("click", () => undo());
  window.toggleTheme = function toggleTheme() {
    const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    remember({ type: "theme", theme: current });
    if (window.bridge && window.bridge.saveViewTheme) window.bridge.saveViewTheme(next);
    if (window.setViewTheme) window.setViewTheme(next);
  };
  document.addEventListener("keydown", (event) => {
    if (isTypingTarget(event.target)) return;
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "b" && !event.shiftKey) {
      event.preventDefault();
      addMark("bold", "");
    } else if (key === "m" && !event.shiftKey) {
      event.preventDefault();
      openNote();
    } else if (key === "d" && !event.shiftKey) {
      event.preventDefault();
      toggleDraw();
    } else if (key === "e" && !event.shiftKey) {
      event.preventDefault();
      clearInk();
    } else if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      undo();
    } else if (key === "t" && event.shiftKey) {
      event.preventDefault();
      window.toggleTheme();
    }
  });

  applyMarksRef = applyMarks;
  window.canvasAnnotator = { addMark, applyMarks, deleteMark, undo };
  applyMarks();
  installInk();
  syncUndo();
}

function installInk() {
  const stage = document.getElementById("page-column");
  const ink = document.getElementById("ink");
  const root = document.getElementById("root");
  if (!stage || !ink || !root || ink.dataset.ready === "1") return;
  ink.dataset.ready = "1";

  function notes() {
    return notesObject();
  }

  function drawStroke(ctx, stroke) {
    const points = stroke.points || [];
    if (!points.length) return;
    ctx.strokeStyle = stroke.color || "#599CE7";
    ctx.fillStyle = stroke.color || "#599CE7";
    ctx.lineWidth = stroke.width || 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0][0], points[0][1], (stroke.width || 2.5) / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
    ctx.stroke();
  }

  function redraw() {
    const ctx = ink.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, ink.width, ink.height);
    notes().strokes.forEach((stroke) => drawStroke(ctx, stroke));
  }

  function resize() {
    const width = stage.clientWidth || root.clientWidth || 1;
    const height = Math.max(root.offsetHeight, stage.clientHeight, 1);
    const dpr = window.devicePixelRatio || 1;
    ink.style.width = width + "px";
    ink.style.height = height + "px";
    const bitmapWidth = Math.max(1, Math.round(width * dpr));
    const bitmapHeight = Math.max(1, Math.round(height * dpr));
    if (ink.width !== bitmapWidth || ink.height !== bitmapHeight) {
      ink.width = bitmapWidth;
      ink.height = bitmapHeight;
    }
    redraw();
  }

  let drawing = false;
  let active = null;

  function pointFromEvent(event) {
    const rect = ink.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  ink.addEventListener("pointerdown", (event) => {
    if (!ink.classList.contains("drawing")) return;
    if (ink.setPointerCapture) ink.setPointerCapture(event.pointerId);
    drawing = true;
    active = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      color: "#599CE7",
      width: 2.5,
      points: [pointFromEvent(event)],
    };
  });

  ink.addEventListener("pointermove", (event) => {
    if (!drawing || !active) return;
    active.points.push(pointFromEvent(event));
    redraw();
    const ctx = ink.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawStroke(ctx, active);
  });

  function finishStroke(event) {
    if (!drawing || !active) return;
    if (event) active.points.push(pointFromEvent(event));
    drawing = false;
    if (active.points.length) {
      rememberNotes();
      notes().strokes.push(active);
      persistNotes();
    }
    active = null;
    redraw();
  }

  ink.addEventListener("pointerup", finishStroke);
  ink.addEventListener("pointercancel", finishStroke);

  toggleDraw = function toggleDrawMode() {
    const drawButton = document.getElementById("btn-draw");
    remember({ type: "draw", on: ink.classList.contains("drawing") });
    const on = ink.classList.toggle("drawing");
    if (drawButton) drawButton.classList.toggle("active", on);
    hostStatus(on ? "Рисование включено" : "Рисование выключено");
  };

  clearInk = function clearInkStrokes() {
    if (!notes().strokes.length) {
      hostStatus("Рисунка нет");
      return;
    }
    rememberNotes();
    notes().strokes = [];
    persistNotes();
    redraw();
    hostStatus("Рисунок стёрт");
  };

  const drawButton = document.getElementById("btn-draw");
  if (drawButton) drawButton.addEventListener("click", () => toggleDraw());

  const clearButton = document.getElementById("btn-clear-ink");
  if (clearButton) clearButton.addEventListener("click", () => clearInk());

  window.canvasInk = {
    addStroke(points, id) {
      const stroke = {
        id: id || Date.now().toString(36),
        color: "#599CE7",
        width: 2.5,
        points: points,
      };
      rememberNotes();
      const list = notes().strokes;
      const index = list.findIndex((item) => item.id === stroke.id);
      if (index >= 0) list[index] = stroke;
      else list.push(stroke);
      persistNotes();
      resize();
      return list.length;
    },
    redraw() {
      resize();
    },
    strokeCount() {
      return notes().strokes.length;
    },
  };

  redrawRef = redraw;
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => resize());
    observer.observe(root);
    observer.observe(stage);
  }
  window.addEventListener("resize", resize);
  resize();
}
