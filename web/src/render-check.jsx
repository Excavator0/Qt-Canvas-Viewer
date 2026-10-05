import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "cursor/canvas";
import Canvas from "virtual:canvas";

globalThis.__CANVAS_STATE__ = { chapter: "vector" };
globalThis.__NOTES__ = { marks: [] };

const html = renderToStaticMarkup(React.createElement(Canvas));
if (!html.includes("Структуры C++ для LeetCode")) {
  console.error("missing title");
  process.exit(1);
}
if (!html.includes("динамический массив")) {
  console.error("missing vector lead");
  process.exit(1);
}
if (!html.includes("#E4E4E411")) {
  console.error("dark code background missing");
  process.exit(1);
}

const light = renderToStaticMarkup(
  React.createElement(ThemeProvider, { theme: "light" }, React.createElement(Canvas)),
);
if (!light.includes("#14141414")) {
  console.error("light code background missing");
  process.exit(1);
}
console.log("render-check ok", html.length);
