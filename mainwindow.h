#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QString>

class QProcess;
class QWebEngineView;
class HostBridge;

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = nullptr);
    void openCanvas(const QString &path);
    void runSelfTest(const QString &canvasPath);

private slots:
    void chooseCanvas();
    void onBuildFinished(int exitCode);

private:
    QString nodeProgram() const;
    void showBuildError(const QString &message);
    void loadPage();
    void failTest(const QString &reason);
    void passTest();
    void pollReady();
    void runTestStep();
    void reloadForCheck();
    void finishTestChecks();

    QWebEngineView *m_view;
    HostBridge *m_bridge;
    QProcess *m_build;
    QString m_canvasPath;
    bool m_selfTest;
    int m_testStep;
    int m_loadCount;
    QString m_tsxHash;
    QString m_lastScriptResult;
};

#endif
