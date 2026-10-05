import React from "react";

function hostWindow() {
  if (typeof window !== "undefined") return window;
  return globalThis;
}

const paletteDark = {
  foreground: "#E4E4E4EB",
  foregroundSecondary: "#E4E4E48D",
  foregroundTertiary: "#E4E4E45E",
  foregroundQuaternary: "#E4E4E442",
  editor: "#181818",
  chrome: "#141414",
  sidebar: "#141414",
  elevated: "#181818",
  fillPrimary: "#E4E4E430",
  fillSecondary: "#E4E4E41E",
  fillTertiary: "#E4E4E411",
  fillQuaternary: "#E4E4E40A",
  strokePrimary: "#E4E4E433",
  strokeSecondary: "#E4E4E41F",
  strokeTertiary: "#E4E4E414",
  accent: "#599CE7",
  buttonBackground: "#599CE7",
  buttonForeground: "#191c22",
  buttonHoverBackground: "#6AABE9",
  link: "#87c3ff",
  diffInsertedLine: "#3FA26633",
  diffRemovedLine: "#B8004933",
  diffStripAdded: "#3FA2668F",
  diffStripRemoved: "#FC6B838F",
};

const paletteLight = {
  foreground: "#141414F0",
  foregroundSecondary: "#141414BD",
  foregroundTertiary: "#1414148A",
  foregroundQuaternary: "#1414145C",
  editor: "#FCFCFC",
  chrome: "#F8F8F8",
  sidebar: "#F3F3F3",
  elevated: "#FCFCFC",
  fillPrimary: "#14141433",
  fillSecondary: "#14141424",
  fillTertiary: "#14141414",
  fillQuaternary: "#1414140F",
  strokePrimary: "#14141433",
  strokeSecondary: "#1414141F",
  strokeTertiary: "#14141414",
  accent: "#3685BF",
  buttonBackground: "#3685BF",
  buttonForeground: "#FCFCFC",
  buttonHoverBackground: "#2E76AB",
  link: "#3685BF",
  diffInsertedLine: "#1F8A651F",
  diffRemovedLine: "#CF2D5614",
  diffStripAdded: "#1F8A65CC",
  diffStripRemoved: "#CF2D56CC",
};

function tokensFrom(palette) {
  return {
    bg: { editor: palette.editor, chrome: palette.chrome, elevated: palette.elevated },
    text: {
      primary: palette.foreground,
      secondary: palette.foregroundSecondary,
      tertiary: palette.foregroundTertiary,
      quaternary: palette.foregroundQuaternary,
      link: palette.link,
      onAccent: palette.buttonForeground,
    },
    stroke: {
      primary: palette.strokePrimary,
      secondary: palette.strokeSecondary,
      tertiary: palette.strokeTertiary,
    },
    fill: {
      primary: palette.fillPrimary,
      secondary: palette.fillSecondary,
      tertiary: palette.fillTertiary,
      quaternary: palette.fillQuaternary,
    },
    accent: {
      primary: palette.accent,
      control: palette.buttonBackground,
      controlHover: palette.buttonHoverBackground,
    },
    diff: {
      insertedLine: palette.diffInsertedLine,
      removedLine: palette.diffRemovedLine,
      stripAdded: palette.diffStripAdded,
      stripRemoved: palette.diffStripRemoved,
    },
  };
}

export const canvasPaletteDark = paletteDark;
export const canvasPaletteLight = paletteLight;
export const canvasTokens = tokensFrom(paletteDark);
export const canvasTokensLight = tokensFrom(paletteLight);

const darkTheme = {
  kind: "dark",
  tokens: canvasTokens,
  palette: paletteDark,
  ...canvasTokens,
};

const lightTheme = {
  kind: "light",
  tokens: canvasTokensLight,
  palette: paletteLight,
  ...canvasTokensLight,
};

const ThemeContext = React.createContext(darkTheme);

export function ThemeProvider({ theme, children }) {
  const value = theme === "light" ? lightTheme : darkTheme;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useHostTheme() {
  return React.useContext(ThemeContext);
}

export const colorPalette = {
  gray: "#8888A8E0",
  purple: "#7B64B8F0",
  green: "#1F8A65E8",
  yellow: "#E8C030E0",
  pink: "#C85898E0",
  blue: "#2E79B5E0",
  orange: "#F0A040E0",
};

export const usageColorSequence = ["gray", "purple", "green", "yellow", "pink", "blue", "orange"];

const chartColorSequence = [
  "#1F8A65E8",
  "#70B0D8E0",
  "#5A6CC0F0",
  "#F0A040E0",
  "#C06028E0",
  "#E8C030E0",
  "#C85898E0",
  "#F0A088E0",
  "#7B64B8F0",
  "#7DCAB0E0",
  "#8888A8E0",
  "#2A9A8AE0",
];

const toneColor = {
  success: "#3FA266",
  danger: "#FC6B83",
  warning: "#E8C030",
  info: "#599CE7",
  neutral: "#8888A8",
  added: "#3FA266",
  deleted: "#FC6B83",
  renamed: "#E8C030",
};

export function mergeStyle(base, override) {
  if (!override) return base || {};
  return Object.assign({}, base || {}, override);
}

const TextNest = React.createContext(false);

function parseInline(text) {
  const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  const pieces = [];
  let last = 0;
  let match = pattern.exec(text);
  let index = 0;
  while (match) {
    if (match.index > last) pieces.push(text.slice(last, match.index));
    if (match[1] != null) pieces.push(<Code key={"c" + index}>{match[1]}</Code>);
    else pieces.push(<Link key={"l" + index} href={match[3]}>{match[2]}</Link>);
    last = match.index + match[0].length;
    index += 1;
    match = pattern.exec(text);
  }
  if (!pieces.length) return text;
  if (last < text.length) pieces.push(text.slice(last));
  return pieces;
}

function renderRich(children) {
  return React.Children.map(children, (child, index) => {
    if (typeof child === "string") return <React.Fragment key={index}>{parseInline(child)}</React.Fragment>;
    return child;
  });
}

export function Stack({ children, gap = 0, style }) {
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column", gap }, style)}>
      {children}
    </div>
  );
}

export function Row({ children, gap = 0, align = "stretch", justify = "start", wrap = false, style }) {
  const alignItems = align === "start" ? "flex-start" : align === "end" ? "flex-end" : align;
  const justifyContent = justify === "start" ? "flex-start" : justify === "end" ? "flex-end" : justify === "space-between" ? "space-between" : "center";
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "row", gap, alignItems, justifyContent, flexWrap: wrap ? "wrap" : "nowrap" }, style)}>
      {children}
    </div>
  );
}

export function Grid({ children, columns, gap = 0, align = "stretch", style }) {
  const template = typeof columns === "number" ? "repeat(" + columns + ", minmax(0, 1fr))" : columns;
  const alignItems = align === "start" ? "start" : align === "end" ? "end" : align;
  return (
    <div style={mergeStyle({ display: "grid", gridTemplateColumns: template, gap, alignItems }, style)}>
      {children}
    </div>
  );
}

export function Divider({ style }) {
  const theme = useHostTheme();
  return <hr style={mergeStyle({ border: 0, borderTop: "1px solid " + theme.stroke.tertiary, margin: 0, width: "100%" }, style)} />;
}

export function Spacer() {
  return <div style={{ flex: 1 }} />;
}

const weightValue = { normal: 400, medium: 500, semibold: 600, bold: 700 };

export function Text({ children, tone = "primary", size = "body", as, weight = "normal", italic = false, truncate = false, style }) {
  const theme = useHostTheme();
  const nested = React.useContext(TextNest);
  const Tag = as || (nested ? "span" : "p");
  const fontSize = size === "small" ? 12 : 14;
  const lineHeight = size === "small" ? "16px" : "20px";
  const truncateStyle = truncate
    ? {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        direction: truncate === "start" ? "rtl" : "ltr",
      }
    : null;
  return (
    <TextNest.Provider value={true}>
      <Tag
        style={mergeStyle(
          {
            margin: 0,
            color: theme.text[tone] || theme.text.primary,
            fontSize,
            lineHeight,
            fontWeight: weightValue[weight] || 400,
            fontStyle: italic ? "italic" : "normal",
            ...truncateStyle,
          },
          style,
        )}
      >
        {renderRich(children)}
      </Tag>
    </TextNest.Provider>
  );
}

function Heading({ tag, fontSize, lineHeight, children, style }) {
  const theme = useHostTheme();
  const Tag = tag;
  return (
    <TextNest.Provider value={true}>
      <Tag style={mergeStyle({ margin: 0, color: theme.text.primary, fontSize, lineHeight, fontWeight: 600 }, style)}>
        {renderRich(children)}
      </Tag>
    </TextNest.Provider>
  );
}

export function H1(props) {
  return <Heading tag="h1" fontSize={24} lineHeight="30px" {...props} />;
}

export function H2(props) {
  return <Heading tag="h2" fontSize={18} lineHeight="24px" {...props} />;
}

export function H3(props) {
  return <Heading tag="h3" fontSize={16} lineHeight="22px" {...props} />;
}

export function Code({ children, style }) {
  const theme = useHostTheme();
  return (
    <code
      style={mergeStyle(
        {
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.92em",
          background: theme.fill.tertiary,
          padding: "1px 4px",
          borderRadius: 4,
        },
        style,
      )}
    >
      {children}
    </code>
  );
}

export function Link({ children, href, style }) {
  const theme = useHostTheme();
  return (
    <a
      href={href}
      style={mergeStyle({ color: theme.text.link, textDecoration: "underline" }, style)}
      onClick={(event) => {
        event.preventDefault();
        if (hostWindow().bridge && hostWindow().bridge.openUrl) hostWindow().bridge.openUrl(href);
      }}
    >
      {children}
    </a>
  );
}

export function CanvasChevron({ expanded }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d={expanded ? "M2 4 L6 8 L10 4" : "M4 2 L8 6 L4 10"} fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

const CardState = React.createContext({ open: true, size: "base", collapsible: false, toggle: () => {} });

export function Card({ children, variant = "default", size = "base", collapsible = false, defaultOpen = true, open, onOpenChange, style }) {
  const theme = useHostTheme();
  const [inner, setInner] = React.useState(defaultOpen);
  const isOpen = open === undefined ? inner : open;
  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setInner(next);
    if (onOpenChange) onOpenChange(next);
  };
  return (
    <CardState.Provider value={{ open: collapsible ? isOpen : true, size, collapsible, toggle }}>
      <section
        style={mergeStyle(
          {
            border: variant === "borderless" ? "none" : "1px solid " + theme.stroke.secondary,
            borderRadius: variant === "borderless" ? 0 : 8,
            background: theme.bg.elevated,
          },
          style,
        )}
      >
        {children}
      </section>
    </CardState.Provider>
  );
}

export function CardHeader({ children, trailing, style }) {
  const theme = useHostTheme();
  const ctx = React.useContext(CardState);
  return (
    <div
      onClick={ctx.collapsible ? ctx.toggle : undefined}
      style={mergeStyle(
        {
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: ctx.size === "lg" ? 32 : 28,
          padding: "0 12px",
          fontSize: 12,
          color: theme.text.primary,
          cursor: ctx.collapsible ? "pointer" : "default",
        },
        style,
      )}
    >
      {ctx.collapsible ? <CanvasChevron expanded={ctx.open} /> : null}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {trailing}
    </div>
  );
}

export function CardBody({ children, style }) {
  const ctx = React.useContext(CardState);
  if (!ctx.open) return null;
  return <div style={mergeStyle({ padding: 12 }, style)}>{children}</div>;
}

export function Button({ children, variant = "secondary", disabled = false, type = "button", style, onClick }) {
  const theme = useHostTheme();
  const background = variant === "primary" ? theme.accent.control : variant === "ghost" ? "transparent" : theme.fill.secondary;
  const color = variant === "primary" ? theme.text.onAccent : theme.text.primary;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={mergeStyle(
        {
          height: 24,
          padding: "0 10px",
          borderRadius: 6,
          border: variant === "ghost" ? "none" : "1px solid " + theme.stroke.secondary,
          background,
          color,
          font: "inherit",
          cursor: disabled ? "default" : "pointer",
        },
        style,
      )}
    >
      {children}
    </button>
  );
}

export function Pill({ children, active = false, tone = "neutral", size = "md", leadingContent, keyboardHint, disabled = false, title, style, onClick }) {
  const theme = useHostTheme();
  const toneValue = toneColor[tone] || theme.text.primary;
  const color = tone === "neutral" ? theme.text.primary : toneValue;
  const background = active ? (tone === "neutral" ? theme.fill.primary : toneValue + "33") : "transparent";
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      style={mergeStyle(
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          borderRadius: 999,
          border: size === "sm" ? "none" : "1px solid " + (tone === "neutral" ? theme.stroke.secondary : toneValue),
          background,
          color,
          padding: size === "sm" ? "2px 8px" : "4px 10px",
          font: "inherit",
          fontSize: size === "sm" ? 12 : 13,
          lineHeight: "16px",
          cursor: disabled ? "default" : "pointer",
          textAlign: "left",
        },
        style,
      )}
    >
      {leadingContent}
      <span>{children}</span>
      {keyboardHint ? <span style={{ color: theme.text.tertiary }}>{keyboardHint}</span> : null}
    </button>
  );
}

export function Stat({ value, label, tone, style }) {
  const theme = useHostTheme();
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column", gap: 4 }, style)}>
      <div style={{ fontSize: 22, lineHeight: "28px", fontWeight: 600, color: tone ? toneColor[tone] : theme.text.primary }}>{value}</div>
      <div style={{ fontSize: 12, color: theme.text.secondary }}>{label}</div>
    </div>
  );
}

const rowToneFill = {
  success: "#3FA26622",
  danger: "#B8004922",
  warning: "#E8C03022",
  info: "#599CE722",
  neutral: "transparent",
};

export function Table({ headers, rows, columnAlign, rowTone, framed = true, striped = false, stickyHeader = false, style, emptyMessage }) {
  const theme = useHostTheme();
  const body = rows && rows.length
    ? rows.map((row, rowIndex) => (
        <tr key={rowIndex} style={{ background: (rowTone && rowTone[rowIndex] && rowToneFill[rowTone[rowIndex]]) || (striped && rowIndex % 2 === 1 ? theme.fill.quaternary : "transparent") }}>
          {headers.map((_, column) => (
            <td key={column} style={{ padding: "8px 10px", textAlign: (columnAlign && columnAlign[column]) || "left", verticalAlign: "top", borderTop: "1px solid " + theme.stroke.tertiary }}>
              {row[column] == null ? "" : row[column]}
            </td>
          ))}
        </tr>
      ))
    : (
        <tr>
          <td colSpan={Math.max(headers.length, 1)} style={{ padding: "8px 10px", color: theme.text.tertiary }}>{emptyMessage || ""}</td>
        </tr>
      );
  return (
    <div style={mergeStyle({ overflow: "auto", border: framed ? "1px solid " + theme.stroke.tertiary : "none", borderRadius: framed ? 8 : 0, maxHeight: stickyHeader ? 480 : undefined }, style)}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                style={{
                  padding: "8px 10px",
                  textAlign: (columnAlign && columnAlign[index]) || "left",
                  color: theme.text.secondary,
                  fontWeight: 600,
                  background: theme.bg.elevated,
                  position: stickyHeader ? "sticky" : "static",
                  top: 0,
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{body}</tbody>
      </table>
    </div>
  );
}

export function Callout({ children, tone = "info", title, icon, style }) {
  const color = toneColor[tone] || toneColor.info;
  return (
    <div style={mergeStyle({ border: "1px solid " + color, background: color + "22", borderRadius: 8, padding: 12 }, style)}>
      {title ? (
        <div style={{ display: "flex", gap: 8, color, fontWeight: 600, marginBottom: 4 }}>
          {icon}
          <span>{title}</span>
        </div>
      ) : null}
      <div>{children}</div>
    </div>
  );
}

export function Checkbox({ checked = false, onChange, disabled = false, label, style }) {
  const theme = useHostTheme();
  return (
    <label style={mergeStyle({ display: "inline-flex", alignItems: "center", gap: 8, color: theme.text.primary }, style)}>
      <input
        type="checkbox"
        checked={!!checked}
        disabled={disabled}
        onChange={(event) => {
          if (onChange) onChange(event.target.checked);
        }}
      />
      {label}
    </label>
  );
}

export function Toggle({ checked = false, onChange, disabled = false, size = "sm", style }) {
  const theme = useHostTheme();
  const height = size === "md" ? 20 : 16;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={!!checked}
      onClick={() => onChange && onChange(!checked)}
      style={mergeStyle(
        {
          width: height * 1.8,
          height,
          borderRadius: 999,
          border: "none",
          background: checked ? theme.accent.control : theme.fill.primary,
          position: "relative",
          padding: 0,
          cursor: "pointer",
        },
        style,
      )}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? height * 0.8 : 2,
          width: height - 4,
          height: height - 4,
          borderRadius: 999,
          background: theme.text.primary,
        }}
      />
    </button>
  );
}

export function TextInput({ value = "", onChange, placeholder, disabled = false, type = "text", style }) {
  const theme = useHostTheme();
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange && onChange(event.target.value)}
      style={mergeStyle(
        {
          height: 28,
          boxSizing: "border-box",
          width: "100%",
          background: theme.bg.editor,
          color: theme.text.primary,
          border: "1px solid " + theme.stroke.secondary,
          borderRadius: 6,
          padding: "0 8px",
          font: "inherit",
        },
        style,
      )}
    />
  );
}

export function TextArea({ value = "", onChange, placeholder, disabled = false, rows = 3, style }) {
  const theme = useHostTheme();
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      onChange={(event) => onChange && onChange(event.target.value)}
      style={mergeStyle(
        {
          width: "100%",
          boxSizing: "border-box",
          background: theme.bg.editor,
          color: theme.text.primary,
          border: "1px solid " + theme.stroke.secondary,
          borderRadius: 6,
          padding: 8,
          font: "inherit",
          resize: "vertical",
        },
        style,
      )}
    />
  );
}

export function Select({ value, onChange, options = [], placeholder, disabled = false, style }) {
  const theme = useHostTheme();
  return (
    <select
      value={value || ""}
      disabled={disabled}
      onChange={(event) => onChange && onChange(event.target.value)}
      style={mergeStyle(
        {
          height: 28,
          background: theme.bg.editor,
          color: theme.text.primary,
          border: "1px solid " + theme.stroke.secondary,
          borderRadius: 6,
          font: "inherit",
        },
        style,
      )}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function IconButton({ children, onClick, disabled = false, title, variant = "default", size = "md", style }) {
  const theme = useHostTheme();
  const box = size === "sm" ? 16 : 20;
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={mergeStyle(
        {
          width: box + 8,
          height: box + 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderRadius: variant === "circle" ? 999 : 6,
          background: variant === "circle" ? theme.fill.secondary : "transparent",
          color: theme.text.primary,
          cursor: "pointer",
        },
        style,
      )}
    >
      {children}
    </button>
  );
}

export function UsageBar({ segments = [], total = 0, topLeftLabel, topRightLabel, style }) {
  const theme = useHostTheme();
  const safeTotal = total > 0 ? total : 1;
  const used = segments.reduce((sum, segment) => sum + (Number.isFinite(segment.value) && segment.value > 0 ? segment.value : 0), 0);
  const remainder = Math.max(0, total - used);
  return (
    <div style={style}>
      {(topLeftLabel || topRightLabel) ? (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.text.secondary, marginBottom: 6 }}>
          <span>{topLeftLabel}</span>
          <span>{topRightLabel}</span>
        </div>
      ) : null}
      <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", background: theme.fill.tertiary }}>
        {segments.map((segment, index) => {
          const value = Number.isFinite(segment.value) && segment.value > 0 ? segment.value : 0;
          const color = segment.color ? colorPalette[segment.color] || segment.color : colorPalette[usageColorSequence[index % usageColorSequence.length]];
          return <div key={segment.id} style={{ width: (value / safeTotal) * 100 + "%", background: color }} />;
        })}
        {remainder > 0 ? <div style={{ width: (remainder / safeTotal) * 100 + "%", background: theme.fill.quaternary }} /> : null}
      </div>
    </div>
  );
}

export function Swatch({ color, style }) {
  return <span style={mergeStyle({ display: "inline-block", width: 24, height: 24, borderRadius: 6, background: colorPalette[color] || color }, style)} />;
}

export function CollapsibleSection({ title, leading, count, trailing, children, style }) {
  const theme = useHostTheme();
  const [open, setOpen] = React.useState(false);
  return (
    <div style={style}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", color: theme.text.primary, padding: "6px 0", cursor: "pointer", font: "inherit", textAlign: "left" }}
      >
        <CanvasChevron expanded={open} />
        {leading}
        <span style={{ fontWeight: 600 }}>{title}</span>
        {count != null ? <span style={{ color: theme.text.tertiary }}>{count}</span> : null}
        <span style={{ flex: 1 }} />
        <span style={{ color: theme.text.tertiary }}>{trailing}</span>
      </button>
      {open ? <div style={{ paddingLeft: 20 }}>{children}</div> : null}
    </div>
  );
}

function seriesColor(series, index, perPoint) {
  if (!perPoint && series.tone && toneColor[series.tone]) return toneColor[series.tone];
  return chartColorSequence[index % chartColorSequence.length];
}

function ChartLegend({ items }) {
  const theme = useHostTheme();
  if (items.length < 2) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: theme.text.secondary, marginTop: 8 }}>
      {items.map((item) => (
        <span key={item.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, background: item.color, borderRadius: 2 }} />
          {item.name}
        </span>
      ))}
    </div>
  );
}

export function BarChart({ categories = [], series = [], height = 220, stacked = false, horizontal = false, normalized = false, valueSuffix = "", style }) {
  const theme = useHostTheme();
  const width = 640;
  const pad = { left: horizontal ? 120 : 36, right: 12, top: 12, bottom: horizontal ? 28 : 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const groups = categories.map((_, categoryIndex) => {
    const values = series.map((item) => Number(item.data[categoryIndex]) || 0);
    const sum = values.reduce((total, value) => total + Math.max(0, value), 0) || 1;
    return normalized ? values.map((value) => (Math.max(0, value) / sum) * 100) : values;
  });
  const max = Math.max(1, ...groups.flat());
  const colors = series.map((item, index) => seriesColor(item, index, false));
  const bars = [];
  categories.forEach((category, categoryIndex) => {
    const slot = horizontal ? innerH / categories.length : innerW / categories.length;
    let offset = 0;
    groups[categoryIndex].forEach((value, seriesIndex) => {
      const span = (value / max) * (horizontal ? innerW : innerH);
      const thickness = stacked || normalized ? slot * 0.7 : (slot * 0.7) / series.length;
      const start = stacked || normalized ? 0 : seriesIndex * thickness;
      if (horizontal) {
        const y = pad.top + categoryIndex * slot + (slot - (stacked || normalized ? thickness : slot * 0.7)) / 2 + start;
        bars.push(<rect key={category + seriesIndex} x={pad.left + offset} y={y} width={span} height={thickness - 2} fill={series.length === 1 ? chartColorSequence[categoryIndex % chartColorSequence.length] : colors[seriesIndex]} />);
        if (stacked || normalized) offset += span;
      } else {
        const x = pad.left + categoryIndex * slot + (slot - (stacked || normalized ? thickness : slot * 0.7)) / 2 + start;
        bars.push(<rect key={category + seriesIndex} x={x} y={pad.top + innerH - offset - span} width={thickness - 2} height={span} fill={series.length === 1 ? chartColorSequence[categoryIndex % chartColorSequence.length] : colors[seriesIndex]} />);
        if (stacked || normalized) offset += span;
      }
    });
  });
  return (
    <div style={style}>
      <svg viewBox={"0 0 " + width + " " + height} width="100%" height={height} role="img">
        <line x1={pad.left} y1={pad.top + innerH} x2={pad.left + innerW} y2={pad.top + innerH} stroke={theme.stroke.secondary} />
        {bars}
        {categories.map((category, index) => {
          const slot = horizontal ? innerH / categories.length : innerW / categories.length;
          const label = String(category) + (normalized && horizontal ? "" : "");
          if (horizontal) {
            return <text key={category} x={pad.left - 8} y={pad.top + index * slot + slot / 2} textAnchor="end" fill={theme.text.tertiary} fontSize="11">{label}</text>;
          }
          return <text key={category} x={pad.left + index * slot + slot / 2} y={height - 16} textAnchor="middle" fill={theme.text.tertiary} fontSize="11">{label}</text>;
        })}
        <text x={pad.left} y={12} fill={theme.text.tertiary} fontSize="11">{valueSuffix}</text>
      </svg>
      <ChartLegend items={series.map((item, index) => ({ name: item.name, color: colors[index] }))} />
    </div>
  );
}

export function LineChart({ categories = [], series = [], height = 220, fill = false, valueSuffix = "", style }) {
  const theme = useHostTheme();
  const width = 640;
  const pad = { left: 36, right: 12, top: 16, bottom: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...series.flatMap((item) => item.data.map((value) => Number(value) || 0)));
  const colors = series.map((item, index) => seriesColor(item, index, false));
  const step = categories.length > 1 ? innerW / (categories.length - 1) : innerW;
  return (
    <div style={style}>
      <svg viewBox={"0 0 " + width + " " + height} width="100%" height={height} role="img">
        {series.map((item, seriesIndex) => {
          const points = item.data.map((value, index) => {
            const x = pad.left + index * step;
            const y = pad.top + innerH - ((Number(value) || 0) / max) * innerH;
            return [x, y];
          });
          const line = points.map((point, index) => (index === 0 ? "M" : "L") + point[0] + " " + point[1]).join(" ");
          const area = points.length
            ? line + " L " + points[points.length - 1][0] + " " + (pad.top + innerH) + " L " + points[0][0] + " " + (pad.top + innerH) + " Z"
            : "";
          return (
            <g key={item.name}>
              {fill ? <path d={area} fill={colors[seriesIndex]} opacity="0.2" /> : null}
              <path d={line} fill="none" stroke={colors[seriesIndex]} strokeWidth="2" />
              {points.map((point, index) => <circle key={index} cx={point[0]} cy={point[1]} r="3" fill={colors[seriesIndex]} />)}
            </g>
          );
        })}
        {categories.map((category, index) => (
          <text key={category} x={pad.left + index * step} y={height - 12} textAnchor="middle" fill={theme.text.tertiary} fontSize="11">{category}</text>
        ))}
        <text x={8} y={14} fill={theme.text.tertiary} fontSize="11">{valueSuffix}</text>
      </svg>
      <ChartLegend items={series.map((item, index) => ({ name: item.name, color: colors[index] }))} />
    </div>
  );
}

export function PieChart({ data = [], size = 180, donut = false, style }) {
  const theme = useHostTheme();
  const total = data.reduce((sum, point) => sum + Math.max(0, Number(point.value) || 0), 0) || 1;
  const cx = size / 2 + 8;
  const cy = size / 2 + 8;
  const radius = size / 2 - 4;
  let angle = 0;
  const slices = data.map((point, index) => {
    const value = Math.max(0, Number(point.value) || 0);
    const sweep = (value / total) * 360;
    const start = angle;
    angle += sweep;
    const color = point.tone && toneColor[point.tone] ? toneColor[point.tone] : chartColorSequence[index % chartColorSequence.length];
    return { ...point, start, end: angle, color, value };
  });
  function point(deg, r) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }
  return (
    <div style={style}>
      <svg viewBox={"0 0 " + (size + 16) + " " + (size + 16)} width={size} height={size} role="img">
        {slices.map((slice) => {
          if (slice.value <= 0) return null;
          const [x1, y1] = point(slice.start, radius);
          const [x2, y2] = point(slice.end, radius);
          const large = slice.end - slice.start > 180 ? 1 : 0;
          const d = "M " + cx + " " + cy + " L " + x1 + " " + y1 + " A " + radius + " " + radius + " 0 " + large + " 1 " + x2 + " " + y2 + " Z";
          return <path key={slice.label} d={d} fill={slice.color} />;
        })}
        {donut ? <circle cx={cx} cy={cy} r={radius * 0.55} fill={theme.bg.editor} /> : null}
      </svg>
      <ChartLegend items={slices.map((slice) => ({ name: slice.label + " " + Math.round((slice.value / total) * 100) + "%", color: slice.color }))} />
    </div>
  );
}

export function DiffStats({ additions = 0, deletions = 0, style }) {
  if (!additions && !deletions) return null;
  return (
    <span style={mergeStyle({ fontVariantNumeric: "tabular-nums", fontSize: 12 }, style)}>
      {additions ? <span style={{ color: toneColor.success }}>+{additions}</span> : null}
      {additions && deletions ? " " : null}
      {deletions ? <span style={{ color: toneColor.danger }}>-{deletions}</span> : null}
    </span>
  );
}

export function DiffView({ lines = [], showLineNumbers = true, coloredLineNumbers = true, showAccentStrip = true, style }) {
  const theme = useHostTheme();
  return (
    <div style={mergeStyle({ fontFamily: "ui-monospace, monospace", fontSize: 12, overflow: "auto" }, style)}>
      {lines.map((line, index) => {
        const background = line.type === "added" ? theme.diff.insertedLine : line.type === "removed" ? theme.diff.removedLine : "transparent";
        const strip = line.type === "added" ? theme.diff.stripAdded : line.type === "removed" ? theme.diff.stripRemoved : "transparent";
        const numberColor = coloredLineNumbers && line.type === "added" ? toneColor.success : coloredLineNumbers && line.type === "removed" ? toneColor.danger : theme.text.tertiary;
        return (
          <div key={index} style={{ display: "flex", background }}>
            {showAccentStrip ? <span style={{ width: 3, background: strip, flex: "0 0 3px" }} /> : null}
            {showLineNumbers ? <span style={{ width: 40, textAlign: "right", padding: "0 8px", color: numberColor }}>{line.lineNumber ?? ""}</span> : null}
            <span style={{ whiteSpace: "pre", paddingRight: 8 }}>{line.content}</span>
          </div>
        );
      })}
    </div>
  );
}

const todoMark = { pending: "·", in_progress: "…", completed: "✓", cancelled: "×" };

export function TodoList({ todos = [], dimmedTodoIds, onTodoClick, style }) {
  const theme = useHostTheme();
  if (!todos.length) return null;
  return (
    <div style={style}>
      {todos.map((todo) => {
        const dimmed = dimmedTodoIds && dimmedTodoIds.has && dimmedTodoIds.has(todo.id);
        return (
          <button
            key={todo.id}
            type="button"
            onClick={() => onTodoClick && onTodoClick(todo)}
            style={{
              display: "flex",
              gap: 8,
              width: "100%",
              textAlign: "left",
              background: "transparent",
              border: "none",
              color: dimmed ? theme.text.quaternary : theme.text.primary,
              padding: "4px 0",
              cursor: "pointer",
              font: "inherit",
            }}
          >
            <span style={{ width: 16 }}>{todoMark[todo.status] || "·"}</span>
            <span>{todo.content}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TodoListCard({ todos = [], dimmedTodoIds, defaultExpanded = false, onTodoClick, style }) {
  const theme = useHostTheme();
  const [open, setOpen] = React.useState(!!defaultExpanded);
  if (!todos.length) return null;
  const done = todos.filter((todo) => todo.status === "completed").length;
  return (
    <div style={mergeStyle({ border: "1px solid " + theme.stroke.secondary, borderRadius: 8 }, style)}>
      <button type="button" onClick={() => setOpen((value) => !value)} style={{ display: "flex", gap: 8, width: "100%", background: "transparent", border: "none", color: theme.text.primary, padding: 8, cursor: "pointer", font: "inherit" }}>
        <CanvasChevron expanded={open} />
        <span>{done} из {todos.length}</span>
      </button>
      {open ? <div style={{ padding: "0 8px 8px" }}><TodoList todos={todos} dimmedTodoIds={dimmedTodoIds} onTodoClick={onTodoClick} /></div> : null}
    </div>
  );
}

let canvasState = null;
const stateListeners = new Set();
let stateTimer = null;

function ensureState() {
  if (canvasState) return canvasState;
  const host = hostWindow();
  canvasState = host.__CANVAS_STATE__ && typeof host.__CANVAS_STATE__ === "object" ? host.__CANVAS_STATE__ : {};
  return canvasState;
}

function scheduleStateSave() {
  if (typeof setTimeout !== "function") return;
  clearTimeout(stateTimer);
  stateTimer = setTimeout(() => {
    const bridge = hostWindow().bridge;
    if (bridge && bridge.saveState) bridge.saveState(JSON.stringify(canvasState));
  }, 200);
}

export function useCanvasState(key, defaultValue) {
  const [, rerender] = React.useState(0);
  React.useEffect(() => {
    const notify = () => rerender((value) => value + 1);
    stateListeners.add(notify);
    return () => stateListeners.delete(notify);
  }, []);
  const current = ensureState();
  const value = Object.prototype.hasOwnProperty.call(current, key) ? current[key] : defaultValue;
  const setValue = (action) => {
    const prevState = ensureState();
    const prev = Object.prototype.hasOwnProperty.call(prevState, key) ? prevState[key] : defaultValue;
    const next = typeof action === "function" ? action(prev) : action;
    canvasState = Object.assign({}, prevState, { [key]: next });
    hostWindow().__CANVAS_STATE__ = canvasState;
    stateListeners.forEach((notify) => notify());
    scheduleStateSave();
  };
  return [value, setValue];
}

export function useCanvasAction() {
  return (action) => {
    const label = "Действие IDE недоступно вне Cursor" + (action && action.type ? ": " + action.type : "");
    const status = typeof document !== "undefined" ? document.getElementById("host-status") : null;
    if (status) status.textContent = label;
    const bridge = hostWindow().bridge;
    if (bridge && bridge.setStatus) bridge.setStatus(label);
  };
}

export function computeDAGLayout(options) {
  const nodes = (options && options.nodes) || [];
  const edges = (options && options.edges) || [];
  const direction = (options && options.direction) || "vertical";
  const nodeWidth = options && options.nodeWidth != null ? options.nodeWidth : 160;
  const nodeHeight = options && options.nodeHeight != null ? options.nodeHeight : 40;
  const rankGap = options && options.rankGap != null ? options.rankGap : 64;
  const nodeGap = options && options.nodeGap != null ? options.nodeGap : 48;
  const padding = options && options.padding != null ? options.padding : 24;
  const ids = nodes.map((node) => node.id);
  const outgoing = new Map(ids.map((id) => [id, []]));
  const color = new Map(ids.map((id) => [id, 0]));
  edges.forEach((edge) => {
    if (outgoing.has(edge.from)) outgoing.get(edge.from).push(edge.to);
  });
  const back = new Set();
  function visit(id) {
    color.set(id, 1);
    (outgoing.get(id) || []).forEach((to) => {
      if (!color.has(to)) return;
      if (color.get(to) === 1) back.add(id + "\u2192" + to);
      else if (color.get(to) === 0) visit(to);
    });
    color.set(id, 2);
  }
  ids.forEach((id) => {
    if (color.get(id) === 0) visit(id);
  });
  const rank = new Map(ids.map((id) => [id, 0]));
  const indegree = new Map(ids.map((id) => [id, 0]));
  edges.forEach((edge) => {
    if (!indegree.has(edge.to) || back.has(edge.from + "\u2192" + edge.to)) return;
    indegree.set(edge.to, indegree.get(edge.to) + 1);
  });
  const queue = ids.filter((id) => indegree.get(id) === 0);
  const seen = new Set();
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    (outgoing.get(id) || []).forEach((to) => {
      if (!rank.has(to) || back.has(id + "\u2192" + to)) return;
      rank.set(to, Math.max(rank.get(to), rank.get(id) + 1));
      indegree.set(to, indegree.get(to) - 1);
      if (indegree.get(to) === 0) queue.push(to);
    });
  }
  const byRank = new Map();
  ids.forEach((id) => {
    const layer = rank.get(id) || 0;
    if (!byRank.has(layer)) byRank.set(layer, []);
    byRank.get(layer).push(id);
  });
  const layers = Array.from(byRank.keys()).sort((a, b) => a - b);
  const pos = new Map();
  layers.forEach((layer) => {
    byRank.get(layer).forEach((id, order) => {
      const x = direction === "horizontal" ? padding + layer * (nodeWidth + rankGap) : padding + order * (nodeWidth + nodeGap);
      const y = direction === "horizontal" ? padding + order * (nodeHeight + nodeGap) : padding + layer * (nodeHeight + rankGap);
      pos.set(id, { id, x, y, rank: layer, order });
    });
  });
  const layoutNodes = ids.map((id) => pos.get(id));
  const layoutEdges = edges.map((edge) => {
    const from = pos.get(edge.from) || { x: 0, y: 0 };
    const to = pos.get(edge.to) || { x: 0, y: 0 };
    const horizontal = direction === "horizontal";
    return {
      from: edge.from,
      to: edge.to,
      sourceX: horizontal ? from.x + nodeWidth : from.x + nodeWidth / 2,
      sourceY: horizontal ? from.y + nodeHeight / 2 : from.y + nodeHeight,
      targetX: horizontal ? to.x : to.x + nodeWidth / 2,
      targetY: horizontal ? to.y + nodeHeight / 2 : to.y,
      isBackEdge: back.has(edge.from + "\u2192" + edge.to),
    };
  });
  const ranks = layers.map((layer) => {
    const row = byRank.get(layer).map((id) => pos.get(id));
    const x = Math.min(...row.map((item) => item.x));
    const y = Math.min(...row.map((item) => item.y));
    const right = Math.max(...row.map((item) => item.x + nodeWidth));
    const bottom = Math.max(...row.map((item) => item.y + nodeHeight));
    return { rank: layer, x, y, width: right - x, height: bottom - y, nodeIds: byRank.get(layer).slice() };
  });
  const widest = Math.max(1, ...layers.map((layer) => byRank.get(layer).length));
  const depth = Math.max(1, layers.length);
  const width = direction === "horizontal"
    ? padding * 2 + depth * nodeWidth + Math.max(0, depth - 1) * rankGap
    : padding * 2 + widest * nodeWidth + Math.max(0, widest - 1) * nodeGap;
  const height = direction === "horizontal"
    ? padding * 2 + widest * nodeHeight + Math.max(0, widest - 1) * nodeGap
    : padding * 2 + depth * nodeHeight + Math.max(0, depth - 1) * rankGap;
  return { nodes: layoutNodes, edges: layoutEdges, ranks, direction, width, height };
}
