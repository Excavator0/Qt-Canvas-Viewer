#include "mainwindow.h"

#include "hostbridge.h"

#include <QAction>
#include <QApplication>
#include <QCryptographicHash>
#include <QDesktopServices>
#include <QDir>
#include <QFile>
#include <QFileDialog>
#include <QFileInfo>
#include <QJsonDocument>
#include <QJsonObject>
#include <QMenuBar>
#include <QMessageBox>
#include <QProcess>
#include <QStandardPaths>
#include <QStatusBar>
#include <QTimer>
#include <QUrl>
#include <QtWebChannel/QWebChannel>
#include <QtWebEngineWidgets/QWebEnginePage>
#include <QtWebEngineWidgets/QWebEngineSettings>
#include <QtWebEngineWidgets/QWebEngineView>

namespace {

class CanvasPage : public QWebEnginePage
{
public:
    explicit CanvasPage(QObject *parent = nullptr)
        : QWebEnginePage(parent)
    {
    }

protected:
    bool acceptNavigationRequest(const QUrl &url, NavigationType type, bool isMainFrame) override
    {
        Q_UNUSED(isMainFrame);
        if (type == NavigationTypeLinkClicked
            && (url.scheme() == QLatin1String("http") || url.scheme() == QLatin1String("https"))) {
            QDesktopServices::openUrl(url);
            return false;
        }
        return QWebEnginePage::acceptNavigationRequest(url, type, isMainFrame);
    }
};

QString fileHash(const QString &path)
{
    QFile file(path);
    if (!file.open(QIODevice::ReadOnly))
        return QString();
    return QString::fromLatin1(QCryptographicHash::hash(file.readAll(), QCryptographicHash::Sha256).toHex());
}

const char *kInteractionScript = R"JS(
(function () {
  var quote = "динамический массив";
  var h1 = document.querySelector("#root h1");
  var box = document.querySelector("#root input[type=checkbox]");
  if (box && !box.checked) box.click();
  var found = false;
  var root = document.getElementById("root");
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  var node;
  while ((node = walker.nextNode())) {
    var index = node.nodeValue.indexOf(quote);
    if (index < 0) continue;
    var range = document.createRange();
    range.setStart(node, index);
    range.setEnd(node, index + quote.length);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    root.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    found = true;
    break;
  }
  document.getElementById("btn-bold").click();
  document.getElementById("btn-note").click();
  document.getElementById("note-input").value = "проверка просмотрщика";
  document.getElementById("btn-note-save").click();
  var strokes = 0;
  if (window.canvasInk) strokes = window.canvasInk.addStroke([[8, 12], [36, 40], [64, 18]], "selftest-stroke");
  var noteBefore = document.querySelectorAll(".ann-note").length;
  var strokeBefore = window.canvasInk ? window.canvasInk.strokeCount() : 0;
  var noteMarks = (window.__NOTES__.marks || []).filter(function (mark) {
    return mark.kind === "note" && document.querySelector('[data-ann-id="' + mark.id + '"]');
  });
  var lastNote = noteMarks.length ? noteMarks[noteMarks.length - 1] : null;
  var deleted = false;
  var restored = false;
  if (lastNote && window.canvasAnnotator) {
    window.canvasAnnotator.deleteMark(lastNote.id);
    deleted = document.querySelectorAll('[data-ann-id="' + lastNote.id + '"]').length === 0;
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
    restored = document.querySelectorAll('[data-ann-id="' + lastNote.id + '"]').length > 0
      && document.querySelectorAll(".ann-note").length === noteBefore;
  }
  window.canvasInk.addStroke([[1, 2], [3, 4]], "undo-temp-stroke");
  document.getElementById("btn-undo").click();
  var strokeUndone = window.canvasInk.strokeCount() === strokeBefore;
  document.getElementById("btn-clear-ink").click();
  var cleared = window.canvasInk.strokeCount() === 0;
  document.getElementById("btn-undo").click();
  var clearUndone = cleared && window.canvasInk.strokeCount() === strokeBefore;
  var drawBefore = document.getElementById("ink").classList.contains("drawing");
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "d", ctrlKey: true, bubbles: true }));
  var drawToggled = document.getElementById("ink").classList.contains("drawing") !== drawBefore;
  document.getElementById("btn-undo").click();
  var drawRestored = document.getElementById("ink").classList.contains("drawing") === drawBefore;
  var themeBefore = document.documentElement.dataset.theme;
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "T", ctrlKey: true, shiftKey: true, bubbles: true }));
  var themeToggled = document.documentElement.dataset.theme !== themeBefore;
  document.getElementById("btn-undo").click();
  var themeRestored = document.documentElement.dataset.theme === themeBefore;
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "m", ctrlKey: true, bubbles: true }));
  var noteOpened = document.getElementById("note-popover").hidden === false;
  document.getElementById("note-input").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  var boldKeep = document.querySelectorAll(".ann-bold").length;
  var noteKeep = document.querySelectorAll(".ann-note").length;
  var page = document.querySelector("#root p") || document.getElementById("root");
  ["mousedown", "mouseup", "click"].forEach(function (type) {
    page.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
    root.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
  });
  var marksKept = document.querySelectorAll(".ann-bold").length === boldKeep
    && document.querySelectorAll(".ann-note").length === noteKeep;
  var column = document.getElementById("page-column");
  var toolbar = document.getElementById("toolbar");
  var before = toolbar.getBoundingClientRect().top;
  column.scrollTop = Math.min(900, column.scrollHeight);
  var after = toolbar.getBoundingClientRect().top;
  var popover = document.getElementById("note-popover");
  return JSON.stringify({
    title: h1 ? h1.textContent : "",
    checked: !!(box && box.checked),
    found: found,
    bold: document.querySelectorAll(".ann-bold").length,
    note: document.querySelectorAll(".ann-note").length,
    strokes: strokes,
    toolbarFixed: before === after && toolbar.parentElement === document.body,
    scrolled: column.scrollTop > 200,
    icons: toolbar.querySelectorAll("button[title]").length >= 5,
    noteClosed: popover.hidden === true && noteOpened,
    noteOutside: toolbar.contains(document.getElementById("note-input")) === false,
    deleted: deleted,
    restored: restored,
    strokeUndone: strokeUndone,
    clearUndone: clearUndone,
    drawToggled: drawToggled,
    drawRestored: drawRestored,
    themeToggled: themeToggled,
    themeRestored: themeRestored,
    shortcuts: toolbar.querySelector("#btn-bold").title.indexOf("Ctrl+B") >= 0
      && toolbar.querySelector("#btn-undo").title.indexOf("Ctrl+Z") >= 0,
    marksKept: marksKept
  });
})()
)JS";

const char *kClickIntroScript = R"JS(
(function () {
  var buttons = document.querySelectorAll("#root button");
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i].textContent.replace(/^\s+|\s+$/g, "").indexOf("Выбор") === 0) {
      buttons[i].click();
      return true;
    }
  }
  return false;
})()
)JS";

const char *kHeadingScript = R"JS(
(function () {
  var h2 = document.querySelector("#root h2");
  return h2 ? h2.textContent : "";
})()
)JS";

const char *kClickVectorScript = R"JS(
(function () {
  var buttons = document.querySelectorAll("#root button");
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i].textContent.replace(/^\s+|\s+$/g, "").indexOf("vector") === 0) {
      buttons[i].click();
      return true;
    }
  }
  return false;
})()
)JS";

const char *kMarksScript = R"JS(
(function () {
  var h2 = document.querySelector("#root h2");
  return JSON.stringify({
    h2: h2 ? h2.textContent : "",
    bold: document.querySelectorAll(".ann-bold").length,
    note: document.querySelectorAll(".ann-note").length,
    strokes: window.canvasInk ? window.canvasInk.strokeCount() : 0,
    ready: window.__canvasReady === true
  });
})()
)JS";

} // namespace

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , m_view(new QWebEngineView(this))
    , m_bridge(new HostBridge(this))
    , m_build(nullptr)
    , m_selfTest(false)
    , m_testStep(0)
    , m_loadCount(0)
{
    setWindowTitle(QStringLiteral("Просмотр canvas"));
    resize(1200, 800);
    setCentralWidget(m_view);

    auto *page = new CanvasPage(m_view);
    m_view->setPage(page);
    page->settings()->setAttribute(QWebEngineSettings::LocalContentCanAccessFileUrls, true);
    page->settings()->setAttribute(QWebEngineSettings::JavascriptEnabled, true);

    auto *channel = new QWebChannel(page);
    channel->registerObject(QStringLiteral("bridge"), m_bridge);
    page->setWebChannel(channel);

    connect(m_bridge, &HostBridge::statusMessage, this, [this](const QString &text) {
        statusBar()->showMessage(text);
    });
    connect(m_view, &QWebEngineView::loadFinished, this, [this](bool ok) {
        if (!m_selfTest) {
            statusBar()->showMessage(ok ? QStringLiteral("Готово") : QStringLiteral("Страница не открылась"));
            return;
        }
        if (!ok) {
            failTest(QStringLiteral("страница не открылась"));
            return;
        }
        ++m_loadCount;
        pollReady();
    });

    auto *openAction = new QAction(QStringLiteral("Открыть…"), this);
    openAction->setShortcut(QKeySequence::Open);
    connect(openAction, &QAction::triggered, this, &MainWindow::chooseCanvas);
    auto *quitAction = new QAction(QStringLiteral("Выход"), this);
    quitAction->setShortcut(QKeySequence::Quit);
    connect(quitAction, &QAction::triggered, qApp, &QApplication::quit);

    auto *fileMenu = menuBar()->addMenu(QStringLiteral("Файл"));
    fileMenu->addAction(openAction);
    fileMenu->addSeparator();
    fileMenu->addAction(quitAction);

    statusBar()->showMessage(QStringLiteral("Откройте файл .canvas.tsx"));
}

QString MainWindow::nodeProgram() const
{
    const QString fromPath = QStandardPaths::findExecutable(QStringLiteral("node"));
    if (!fromPath.isEmpty())
        return fromPath;

    QDir versions(QDir::homePath() + QStringLiteral("/.nvm/versions/node"));
    const QStringList names = versions.entryList(QDir::Dirs | QDir::NoDotAndDotDot, QDir::Name | QDir::Reversed);
    for (const QString &name : names) {
        const QString candidate = versions.filePath(name + QStringLiteral("/bin/node"));
        if (QFileInfo::exists(candidate))
            return candidate;
    }
    return QString();
}

void MainWindow::chooseCanvas()
{
    QString start = QStringLiteral("/home/user/.cursor/projects/home-user-projects-learncpp/canvases");
    if (!QDir(start).exists())
        start = QDir::homePath();
    const QString path = QFileDialog::getOpenFileName(
        this,
        QStringLiteral("Открыть canvas"),
        start,
        QStringLiteral("Canvas (*.canvas.tsx)"));
    if (!path.isEmpty())
        openCanvas(path);
}

void MainWindow::runSelfTest(const QString &canvasPath)
{
    m_selfTest = true;
    m_tsxHash = fileHash(canvasPath);
    QTimer::singleShot(120000, this, [this] {
        failTest(QStringLiteral("таймаут проверки"));
    });
    openCanvas(canvasPath);
}

void MainWindow::openCanvas(const QString &path)
{
    if (!QFileInfo::exists(path)) {
        showBuildError(QStringLiteral("Файл не найден: ") + path);
        return;
    }

    m_canvasPath = path;
    m_bridge->setCanvasPath(path);
    setWindowTitle(QFileInfo(path).fileName());
    statusBar()->showMessage(QStringLiteral("Сборка…"));

    const QString node = nodeProgram();
    if (node.isEmpty()) {
        showBuildError(QStringLiteral("Не найден node. Нужен Node.js, чтобы собрать canvas."));
        return;
    }

    const QString webDir = QStringLiteral(CANVAS_WEB_DIR);
    if (m_build) {
        m_build->kill();
        m_build->deleteLater();
    }
    m_build = new QProcess(this);
    m_build->setProgram(node);
    m_build->setArguments({
        webDir + QStringLiteral("/build-canvas.mjs"),
        path,
        webDir + QStringLiteral("/dist/bundle.js"),
    });
    m_build->setWorkingDirectory(webDir);
    m_build->setProcessChannelMode(QProcess::MergedChannels);
    connect(m_build, QOverload<int, QProcess::ExitStatus>::of(&QProcess::finished),
            this, &MainWindow::onBuildFinished);
    m_build->start();
    if (!m_build->waitForStarted(5000))
        showBuildError(QStringLiteral("Не удалось запустить сборку canvas"));
}

void MainWindow::onBuildFinished(int exitCode)
{
    const QString output = QString::fromUtf8(m_build->readAll());
    if (exitCode != 0) {
        showBuildError(output.isEmpty() ? QStringLiteral("Сборка canvas завершилась с ошибкой") : output);
        return;
    }
    loadPage();
}

void MainWindow::loadPage()
{
    const QString page = QStringLiteral(CANVAS_WEB_DIR) + QStringLiteral("/dist/host.html");
    m_view->load(QUrl::fromLocalFile(page));
}

void MainWindow::showBuildError(const QString &message)
{
    statusBar()->showMessage(QStringLiteral("Ошибка сборки"));
    m_view->setHtml(
        QStringLiteral("<pre style=\"color:#FC6B83;background:#181818;padding:16px;white-space:pre-wrap;font-family:monospace\">")
        + message.toHtmlEscaped()
        + QStringLiteral("</pre>"));
    if (m_selfTest)
        failTest(message);
}

void MainWindow::failTest(const QString &reason)
{
    if (!m_selfTest)
        return;
    m_selfTest = false;
    QFile log(QStringLiteral("/tmp/canvasviewer-selftest.json"));
    if (log.open(QIODevice::WriteOnly | QIODevice::Truncate)) {
        QJsonObject obj;
        obj.insert(QStringLiteral("ok"), false);
        obj.insert(QStringLiteral("reason"), reason);
        obj.insert(QStringLiteral("script"), m_lastScriptResult);
        log.write(QJsonDocument(obj).toJson());
    }
    qCritical().noquote() << "SELFTEST FAIL" << reason;
    QTimer::singleShot(0, qApp, [] { QCoreApplication::exit(1); });
}

void MainWindow::passTest()
{
    if (!m_selfTest)
        return;
    m_selfTest = false;
    QFile log(QStringLiteral("/tmp/canvasviewer-selftest.json"));
    if (log.open(QIODevice::WriteOnly | QIODevice::Truncate)) {
        QJsonObject obj;
        obj.insert(QStringLiteral("ok"), true);
        log.write(QJsonDocument(obj).toJson());
    }
    qInfo().noquote() << "SELFTEST OK";
    QTimer::singleShot(0, qApp, [] { QCoreApplication::exit(0); });
}

void MainWindow::pollReady()
{
    if (!m_selfTest)
        return;
    m_view->page()->runJavaScript(QStringLiteral("window.__canvasReady === true"), [this](const QVariant &ready) {
        if (!m_selfTest)
            return;
        if (!ready.toBool()) {
            QTimer::singleShot(200, this, &MainWindow::pollReady);
            return;
        }
        QTimer::singleShot(800, this, &MainWindow::runTestStep);
    });
}

void MainWindow::runTestStep()
{
    if (!m_selfTest)
        return;

    if (m_loadCount == 1 && m_testStep == 0) {
        m_view->page()->runJavaScript(QString::fromUtf8(kInteractionScript), [this](const QVariant &result) {
            m_lastScriptResult = result.toString();
            const QJsonObject obj = QJsonDocument::fromJson(result.toString().toUtf8()).object();
            if (!obj.value(QStringLiteral("title")).toString().contains(QStringLiteral("Структуры C++"))) {
                failTest(QStringLiteral("нет заголовка: ") + result.toString());
                return;
            }
            if (!obj.value(QStringLiteral("checked")).toBool()) {
                failTest(QStringLiteral("галочка не включилась: ") + result.toString());
                return;
            }
            if (!obj.value(QStringLiteral("found")).toBool()) {
                failTest(QStringLiteral("фраза для пометки не найдена: ") + result.toString());
                return;
            }
            if (obj.value(QStringLiteral("bold")).toInt() < 1 || obj.value(QStringLiteral("note")).toInt() < 1) {
                failTest(QStringLiteral("пометки не появились: ") + result.toString());
                return;
            }
            if (obj.value(QStringLiteral("strokes")).toInt() < 1) {
                failTest(QStringLiteral("рисунок не появился: ") + result.toString());
                return;
            }
            if (!obj.value(QStringLiteral("toolbarFixed")).toBool() || !obj.value(QStringLiteral("scrolled")).toBool()) {
                failTest(QStringLiteral("панель уехала при прокрутке: ") + result.toString());
                return;
            }
            if (!obj.value(QStringLiteral("icons")).toBool() || !obj.value(QStringLiteral("noteClosed")).toBool()
                || !obj.value(QStringLiteral("noteOutside")).toBool() || !obj.value(QStringLiteral("shortcuts")).toBool()) {
                failTest(QStringLiteral("кнопки или окно заметки не те: ") + result.toString());
                return;
            }
            if (!obj.value(QStringLiteral("marksKept")).toBool()) {
                failTest(QStringLiteral("пометки пропали после клика: ") + result.toString());
                return;
            }
            if (!obj.value(QStringLiteral("deleted")).toBool() || !obj.value(QStringLiteral("restored")).toBool()) {
                failTest(QStringLiteral("удаление пометки не отменилось: ") + result.toString());
                return;
            }
            if (!obj.value(QStringLiteral("strokeUndone")).toBool() || !obj.value(QStringLiteral("clearUndone")).toBool()
                || !obj.value(QStringLiteral("drawToggled")).toBool() || !obj.value(QStringLiteral("drawRestored")).toBool()
                || !obj.value(QStringLiteral("themeToggled")).toBool() || !obj.value(QStringLiteral("themeRestored")).toBool()) {
                failTest(QStringLiteral("отмена действия не сработала: ") + result.toString());
                return;
            }
            m_testStep = 1;
            QTimer::singleShot(200, this, [this] {
                m_view->page()->runJavaScript(QString::fromUtf8(kClickIntroScript), [this](const QVariant &clicked) {
                    if (!clicked.toBool()) {
                        failTest(QStringLiteral("нет кнопки главы «Выбор»"));
                        return;
                    }
                    QTimer::singleShot(400, this, [this] {
                        m_view->page()->runJavaScript(QString::fromUtf8(kHeadingScript), [this](const QVariant &heading) {
                            if (!heading.toString().contains(QStringLiteral("Сложность и выбор"))) {
                                failTest(QStringLiteral("глава не переключилась: ") + heading.toString());
                                return;
                            }
                            m_view->page()->runJavaScript(QString::fromUtf8(kClickVectorScript), [this](const QVariant &back) {
                                if (!back.toBool()) {
                                    failTest(QStringLiteral("нет кнопки главы vector"));
                                    return;
                                }
                                QTimer::singleShot(700, this, &MainWindow::reloadForCheck);
                            });
                        });
                    });
                });
            });
        });
        return;
    }

    if (m_loadCount >= 2) {
        m_view->page()->runJavaScript(QString::fromUtf8(kMarksScript), [this](const QVariant &result) {
            m_lastScriptResult = result.toString();
            const QJsonObject obj = QJsonDocument::fromJson(result.toString().toUtf8()).object();
            if (obj.value(QStringLiteral("bold")).toInt() < 1 || obj.value(QStringLiteral("note")).toInt() < 1) {
                failTest(QStringLiteral("пометки не восстановились: ") + result.toString());
                return;
            }
            if (!obj.value(QStringLiteral("h2")).toString().contains(QStringLiteral("Динамический массив"))) {
                failTest(QStringLiteral("после переоткрытия открыта не та глава: ") + result.toString());
                return;
            }
            if (obj.value(QStringLiteral("strokes")).toInt() < 1) {
                failTest(QStringLiteral("рисунок не восстановился: ") + result.toString());
                return;
            }
            m_view->page()->runJavaScript(QStringLiteral(
                "(function(){ window.setViewTheme('light'); return getComputedStyle(document.body).backgroundColor; })()"
            ), [this](const QVariant &color) {
                const QString colorName = color.toString();
                if (!colorName.contains(QLatin1String("252"))) {
                    failTest(QStringLiteral("светлая тема не применилась: ") + colorName);
                    return;
                }
                m_view->page()->runJavaScript(QStringLiteral("window.setViewTheme('dark')"));
                finishTestChecks();
            });
        });
    }
}

void MainWindow::reloadForCheck()
{
    m_view->page()->runJavaScript(QStringLiteral("window.__canvasReady = false"));
    loadPage();
}

void MainWindow::finishTestChecks()
{
    if (fileHash(m_canvasPath) != m_tsxHash) {
        failTest(QStringLiteral("исходный .tsx изменился"));
        return;
    }

    const QString base = m_canvasPath.left(m_canvasPath.size() - QStringLiteral(".canvas.tsx").size());
    QFile stateFile(base + QStringLiteral(".canvas.data.json"));
    if (!stateFile.open(QIODevice::ReadOnly)) {
        failTest(QStringLiteral("нет файла состояния"));
        return;
    }
    const QJsonObject state = QJsonDocument::fromJson(stateFile.readAll()).object();
    if (state.value(QStringLiteral("chapter")).toString() != QLatin1String("vector")) {
        failTest(QStringLiteral("в состоянии не vector: ") + QString::fromUtf8(QJsonDocument(state).toJson()));
        return;
    }
    if (!state.value(QStringLiteral("done")).isObject() || state.value(QStringLiteral("done")).toObject().isEmpty()) {
        failTest(QStringLiteral("галочка не сохранилась"));
        return;
    }

    QFile notesFile(base + QStringLiteral(".canvas.notes.json"));
    if (!notesFile.open(QIODevice::ReadOnly)) {
        failTest(QStringLiteral("нет файла пометок"));
        return;
    }
    const QString notes = QString::fromUtf8(notesFile.readAll());
    if (!notes.contains(QStringLiteral("динамический массив")) || !notes.contains(QStringLiteral("проверка просмотрщика"))) {
        failTest(QStringLiteral("пометки не те: ") + notes);
        return;
    }
    if (!notes.contains(QStringLiteral("bold")) || !notes.contains(QStringLiteral("note"))) {
        failTest(QStringLiteral("нет обоих видов пометок"));
        return;
    }
    if (!notes.contains(QStringLiteral("selftest-stroke"))) {
        failTest(QStringLiteral("рисунок не записан: ") + notes);
        return;
    }
    passTest();
}
