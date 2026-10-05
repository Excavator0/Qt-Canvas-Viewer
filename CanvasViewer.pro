QT       += core gui widgets

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

CONFIG += c++11

# Транзитивные зависимости WebEngine (libre2) лежат рядом с библиотекой.
QMAKE_LFLAGS += -Wl,--disable-new-dtags

# Qt WebEngine не установлен в систему: заголовки и библиотеки лежат в локальном sysroot.
WEBENGINE_ROOT = $$PWD/third_party/sysroot
INCLUDEPATH += $$WEBENGINE_ROOT/usr/include/x86_64-linux-gnu/qt5

DEFINES += "WEBENGINE_PROCESS_PATH=\\\"$$WEBENGINE_ROOT/usr/lib/x86_64-linux-gnu/qt5/libexec/QtWebEngineProcess\\\""
DEFINES += "WEBENGINE_LIB_DIR=\\\"$$WEBENGINE_ROOT/usr/lib/x86_64-linux-gnu\\\""
DEFINES += "CANVAS_WEB_DIR=\\\"$$PWD/web\\\""

LIBS += -L$$WEBENGINE_ROOT/usr/lib/x86_64-linux-gnu -lQt5WebEngineWidgets -lQt5WebEngineCore
LIBS += -l:libQt5WebChannel.so.5

QMAKE_RPATHDIR += $$WEBENGINE_ROOT/usr/lib/x86_64-linux-gnu

SOURCES += \
    main.cpp \
    mainwindow.cpp \
    hostbridge.cpp

HEADERS += \
    mainwindow.h \
    hostbridge.h

RESOURCES_DIR = $$WEBENGINE_ROOT/usr/share/qt5/resources
LOCALES_DIR = $$WEBENGINE_ROOT/usr/share/qt5/translations/qtwebengine_locales
PROCESS_DIR = $$WEBENGINE_ROOT/usr/lib/x86_64-linux-gnu/qt5/libexec
QMAKE_POST_LINK += $$quote(ln -sfn $$RESOURCES_DIR/qtwebengine_resources.pak $$OUT_PWD/qtwebengine_resources.pak && ln -sfn $$RESOURCES_DIR/qtwebengine_resources_100p.pak $$OUT_PWD/qtwebengine_resources_100p.pak && ln -sfn $$RESOURCES_DIR/qtwebengine_resources_200p.pak $$OUT_PWD/qtwebengine_resources_200p.pak && ln -sfn $$RESOURCES_DIR/qtwebengine_devtools_resources.pak $$OUT_PWD/qtwebengine_devtools_resources.pak && ln -sfn $$LOCALES_DIR $$OUT_PWD/qtwebengine_locales && ln -sfn $$RESOURCES_DIR/qtwebengine_resources.pak $$PROCESS_DIR/qtwebengine_resources.pak && ln -sfn $$RESOURCES_DIR/qtwebengine_resources_100p.pak $$PROCESS_DIR/qtwebengine_resources_100p.pak && ln -sfn $$RESOURCES_DIR/qtwebengine_resources_200p.pak $$PROCESS_DIR/qtwebengine_resources_200p.pak && ln -sfn $$RESOURCES_DIR/qtwebengine_devtools_resources.pak $$PROCESS_DIR/qtwebengine_devtools_resources.pak && ln -sfn $$LOCALES_DIR $$PROCESS_DIR/qtwebengine_locales)

TARGET = CanvasViewer
