#include "hostbridge.h"

#include <QDesktopServices>
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QSaveFile>
#include <QSettings>
#include <QUrl>

HostBridge::HostBridge(QObject *parent)
    : QObject(parent)
{
}

void HostBridge::setCanvasPath(const QString &path)
{
    m_canvasPath = path;
}

QString HostBridge::sidecarPath(const QString &suffix) const
{
    const QString ending = QStringLiteral(".canvas.tsx");
    if (m_canvasPath.endsWith(ending))
        return m_canvasPath.left(m_canvasPath.size() - ending.size()) + suffix;
    return m_canvasPath + suffix;
}

QString HostBridge::readFileOr(const QString &path, const QString &fallback)
{
    QFile file(path);
    if (!file.open(QIODevice::ReadOnly))
        return fallback;
    const QByteArray data = file.readAll();
    if (data.trimmed().isEmpty())
        return fallback;
    return QString::fromUtf8(data);
}

bool HostBridge::writeJsonFile(const QString &path, const QByteArray &json)
{
    QSaveFile file(path);
    if (!file.open(QIODevice::WriteOnly)) {
        emit statusMessage(QStringLiteral("Не удалось записать ") + path);
        return false;
    }
    file.write(json);
    if (!file.commit()) {
        emit statusMessage(QStringLiteral("Не удалось записать ") + path);
        return false;
    }
    return true;
}

QString HostBridge::canvasStateJson() const
{
    return readFileOr(sidecarPath(QStringLiteral(".canvas.data.json")), QStringLiteral("{}"));
}

QString HostBridge::notesJson() const
{
    return readFileOr(sidecarPath(QStringLiteral(".canvas.notes.json")), QStringLiteral("{\"marks\":[]}"));
}

void HostBridge::saveState(const QString &json)
{
    QJsonParseError incomingError;
    const QJsonDocument incomingDoc = QJsonDocument::fromJson(json.toUtf8(), &incomingError);
    if (incomingError.error != QJsonParseError::NoError || !incomingDoc.isObject()) {
        emit statusMessage(QStringLiteral("Состояние canvas не записано: неверный JSON"));
        return;
    }

    QJsonObject merged;
    const QString path = sidecarPath(QStringLiteral(".canvas.data.json"));
    QJsonParseError existingError;
    const QJsonDocument existingDoc = QJsonDocument::fromJson(readFileOr(path, QStringLiteral("{}")).toUtf8(), &existingError);
    if (existingError.error == QJsonParseError::NoError && existingDoc.isObject())
        merged = existingDoc.object();

    const QJsonObject incoming = incomingDoc.object();
    for (auto it = incoming.begin(); it != incoming.end(); ++it)
        merged.insert(it.key(), it.value());

    writeJsonFile(path, QJsonDocument(merged).toJson(QJsonDocument::Indented));
}

void HostBridge::saveNotes(const QString &json)
{
    QJsonParseError error;
    const QJsonDocument doc = QJsonDocument::fromJson(json.toUtf8(), &error);
    if (error.error != QJsonParseError::NoError || !doc.isObject()) {
        emit statusMessage(QStringLiteral("Пометки не записаны: неверный JSON"));
        return;
    }
    writeJsonFile(sidecarPath(QStringLiteral(".canvas.notes.json")), doc.toJson(QJsonDocument::Indented));
}

void HostBridge::setStatus(const QString &text)
{
    emit statusMessage(text);
}

void HostBridge::openUrl(const QString &url)
{
    QDesktopServices::openUrl(QUrl(url));
}

QString HostBridge::viewTheme() const
{
    const QString theme = QSettings().value(QStringLiteral("viewTheme"), QStringLiteral("dark")).toString();
    return theme == QLatin1String("light") ? QStringLiteral("light") : QStringLiteral("dark");
}

void HostBridge::saveViewTheme(const QString &theme)
{
    QSettings().setValue(QStringLiteral("viewTheme"), theme == QLatin1String("light") ? QStringLiteral("light") : QStringLiteral("dark"));
}
