#include "mainwindow.h"

#include <QApplication>
#include <QByteArray>
#include <QDir>

int main(int argc, char *argv[])
{
    qputenv("QTWEBENGINEPROCESS_PATH", WEBENGINE_PROCESS_PATH);
    qputenv("QTWEBENGINE_DISABLE_SANDBOX", "1");
    qputenv("QTWEBENGINE_CHROMIUM_FLAGS", "--disable-gpu --no-sandbox --disable-dev-shm-usage");

    QByteArray libraryPath = WEBENGINE_LIB_DIR;
    const QByteArray current = qgetenv("LD_LIBRARY_PATH");
    if (!current.isEmpty()) {
        libraryPath += ':';
        libraryPath += current;
    }
    qputenv("LD_LIBRARY_PATH", libraryPath);

    QCoreApplication::setAttribute(Qt::AA_ShareOpenGLContexts);
    QCoreApplication::setAttribute(Qt::AA_EnableHighDpiScaling);

    QApplication app(argc, argv);
    app.setOrganizationName(QStringLiteral("CanvasViewer"));
    app.setApplicationName(QStringLiteral("CanvasViewer"));

    MainWindow window;
    QStringList args = app.arguments();
    args.removeFirst();
    if (!args.isEmpty() && args.first() == QLatin1String("--self-test")) {
        args.removeFirst();
        if (args.isEmpty())
            return 2;
        window.runSelfTest(args.first());
    } else if (!args.isEmpty()) {
        window.openCanvas(args.first());
    }
    window.show();
    return app.exec();
}
