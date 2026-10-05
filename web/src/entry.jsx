import React from "react";
import { createRoot } from "react-dom/client";
import Canvas from "virtual:canvas";
import { ThemeProvider } from "cursor/canvas";
import { installAnnotator } from "./annotator.js";

class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const text = this.state.error.stack || String(this.state.error);
      return <pre className="error">{text}</pre>;
    }
    return this.props.children;
  }
}

window.bootstrap = async function bootstrap() {
  const bridge = window.bridge;
  let state = {};
  let notes = { marks: [] };
  try {
    if (bridge) {
      const stateText = await bridge.canvasStateJson();
      const notesText = await bridge.notesJson();
      state = stateText ? JSON.parse(stateText) : {};
      notes = notesText ? JSON.parse(notesText) : { marks: [] };
    }
  } catch (error) {
    const status = document.getElementById("host-status");
    if (status) status.textContent = "Не удалось прочитать файлы canvas: " + error;
  }
  if (!notes || typeof notes !== "object") notes = { marks: [], strokes: [] };
  if (!Array.isArray(notes.marks)) notes.marks = [];
  if (!Array.isArray(notes.strokes)) notes.strokes = [];
  window.__CANVAS_STATE__ = state;
  window.__NOTES__ = notes;

  let theme = "dark";
  if (bridge && bridge.viewTheme) {
    const stored = await bridge.viewTheme();
    if (stored === "light" || stored === "dark") theme = stored;
  }
  window.__VIEW_THEME__ = theme;

  let setTheme = null;
  window.setViewTheme = function setViewTheme(next) {
    const value = next === "light" ? "light" : "dark";
    window.__VIEW_THEME__ = value;
    document.documentElement.dataset.theme = value;
    const themeButton = document.getElementById("btn-theme");
    if (themeButton) {
      const label = (value === "light" ? "Тёмная тема" : "Светлая тема") + " (Ctrl+Shift+T)";
      themeButton.title = label;
      themeButton.setAttribute("aria-label", label);
    }
    if (setTheme) setTheme(value);
  };
  window.setViewTheme(theme);

  function Viewer() {
    const [current, update] = React.useState(window.__VIEW_THEME__ || "dark");
    setTheme = update;
    return (
      <ThemeProvider theme={current}>
        <Boundary>
          <Canvas key={current} />
        </Boundary>
      </ThemeProvider>
    );
  }

  const rootEl = document.getElementById("root");
  createRoot(rootEl).render(<Viewer />);
  installAnnotator(rootEl);
  window.__canvasReady = true;
};
