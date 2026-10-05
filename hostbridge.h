#ifndef HOSTBRIDGE_H
#define HOSTBRIDGE_H

#include <QObject>
#include <QString>

class HostBridge : public QObject
{
    Q_OBJECT

public:
    explicit HostBridge(QObject *parent = nullptr);

    void setCanvasPath(const QString &path);

    Q_INVOKABLE QString canvasStateJson() const;
    Q_INVOKABLE QString notesJson() const;
    Q_INVOKABLE void saveState(const QString &json);
    Q_INVOKABLE void saveNotes(const QString &json);
    Q_INVOKABLE void setStatus(const QString &text);
    Q_INVOKABLE void openUrl(const QString &url);
    Q_INVOKABLE QString viewTheme() const;
    Q_INVOKABLE void saveViewTheme(const QString &theme);

signals:
    void statusMessage(const QString &text);

private:
    QString sidecarPath(const QString &suffix) const;
    static QString readFileOr(const QString &path, const QString &fallback);
    bool writeJsonFile(const QString &path, const QByteArray &json);

    QString m_canvasPath;
};

#endif
