import { useCallback, useEffect, useMemo, useState } from "react";
import { DispatchPrintModal } from "./components/DispatchPrintModal";
import { FileLibrary } from "./components/FileLibrary";
import { NotificationSetup } from "./components/NotificationSetup";
import { PrinterConfigModal } from "./components/PrinterConfigModal";
import { StreamingConfigModal } from "./components/StreamingConfigModal";
import { StreamingSection } from "./components/StreamingSection";
import { APP_VERSION } from "./config/version";
import { fallbackData } from "./data/fallbackData";
import { DashboardSection } from "./sections/DashboardSection";
import {
  createPrinter,
  createLibraryFolder,
  createSocket,
  deleteLibraryFolder,
  deleteLibraryFile,
  dispatchLibraryFile,
  fetchNotificationConfig,
  fetchNotificationStatus,
  fetchAssignmentPreview,
  fetchBootstrap,
  importLibraryFile,
  markPrinterReady,
  moveLibraryFile,
  restartPrinterService,
  sendTestNotification,
  subscribeNotifications,
  togglePrinterLight,
  unsubscribeNotifications,
  updateNotificationPreferences,
  updatePrinter,
  updatePrinterPower,
  getLibraryDownloadUrl
} from "./services/api";
import { getPushSubscription, subscribeToPush, unsubscribeFromPush } from "./services/pwa";

const REFRESH_INTERVAL_MS = 8000;

function App() {
  const [data, setData] = useState(fallbackData);
  const [configPrinter, setConfigPrinter] = useState(null);
  const [streamingConfigOpen, setStreamingConfigOpen] = useState(false);
  const [streamingConfigVersion, setStreamingConfigVersion] = useState(0);
  const [activeView, setActiveView] = useState("dashboard");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [activeLibraryFolder, setActiveLibraryFolder] = useState("General");
  const [dispatchState, setDispatchState] = useState({ file: null, preview: null });
  const [activityMessage, setActivityMessage] = useState("");
  const [notificationState, setNotificationState] = useState({
    permission: typeof Notification !== "undefined" ? Notification.permission : "default",
    subscribed: false,
    busy: false,
    expanded: false,
    options: [],
    preferences: {}
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const refreshNotificationState = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const subscription = await getPushSubscription();
    let config = null;
    let status = null;
    try {
      config = await fetchNotificationConfig();
      status = await fetchNotificationStatus();
    } catch {}
    const currentEndpoint = subscription?.endpoint;
    const matchedDevice = currentEndpoint
      ? status?.subscriptions?.find((item) => item.id === currentEndpoint)
      : null;
    setNotificationState((current) => ({
      ...current,
      permission: typeof Notification !== "undefined" ? Notification.permission : "default",
      subscribed: Boolean(subscription),
      options: config?.options || current.options,
      preferences: matchedDevice?.preferences || config?.defaults || current.preferences || {}
    }));
  }, []);

  const applySnapshot = useCallback((payload) => {
    setData({
      printers: payload.printers,
      library: payload.library,
      libraryFolders: payload.libraryFolders || fallbackData.libraryFolders,
      queue: payload.queue
    });
    setLastSyncedAt(payload.lastUpdatedAt || new Date().toISOString());
  }, []);

  const reloadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const bootstrap = await fetchBootstrap();
      applySnapshot(bootstrap);
    } finally {
      setIsRefreshing(false);
    }
  }, [applySnapshot]);

  useEffect(() => {
    let socket;
    let reconnectTimer;
    let refreshTimer;
    let isDisposed = false;

    const connectSocket = () => {
      socket = createSocket((message) => {
        if (message.type === "snapshot") {
          applySnapshot(message.payload);
        }
      });

      socket.addEventListener("open", () => {
        setSocketConnected(true);
      });

      socket.addEventListener("close", () => {
        setSocketConnected(false);
        if (!isDisposed) {
          reconnectTimer = window.setTimeout(() => {
            connectSocket();
          }, 2500);
        }
      });

      socket.addEventListener("error", () => {
        setSocketConnected(false);
      });
    };

    const handleForegroundRefresh = () => {
      if (document.hidden) return;
      reloadData().catch(() => {});
    };

    document.title = `Printer Hub v${APP_VERSION}`;
    reloadData().catch(() => {
      setData(fallbackData);
    });
    refreshNotificationState().catch(() => {});
    connectSocket();

    refreshTimer = window.setInterval(() => {
      if (!document.hidden) {
        reloadData().catch(() => {});
      }
    }, REFRESH_INTERVAL_MS);

    window.addEventListener("focus", handleForegroundRefresh);
    window.addEventListener("pageshow", handleForegroundRefresh);
    window.addEventListener("online", handleForegroundRefresh);
    document.addEventListener("visibilitychange", handleForegroundRefresh);

    return () => {
      isDisposed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (refreshTimer) window.clearInterval(refreshTimer);
      window.removeEventListener("focus", handleForegroundRefresh);
      window.removeEventListener("pageshow", handleForegroundRefresh);
      window.removeEventListener("online", handleForegroundRefresh);
      document.removeEventListener("visibilitychange", handleForegroundRefresh);
      socket?.close();
    };
  }, [applySnapshot, reloadData, refreshNotificationState]);

  const handleAddPrinter = async () => {
    const name = window.prompt("Nombre de la impresora");
    if (!name) return;
    const moonrakerUrl = window.prompt("URL de Moonraker", "https://");
    if (!moonrakerUrl) return;
    await createPrinter({
      name,
      moonrakerUrl,
      cameraUrl: "",
      syncMode: "live",
      lightEnabled: false,
      lightState: "off",
      profile: "Moonraker Live",
      materials: ["PLA"],
      volume: { x: 235, y: 235, z: 250 },
      image: ""
    });
    await reloadData();
    setActivityMessage(`Impresora ${name} agregada.`);
    setHeaderMenuOpen(false);
  };

  const handleOpenConfig = (printer) => {
    if (printer.state === "printing") {
      setActivityMessage(`${printer.name} esta imprimiendo. La configuracion esta bloqueada.`);
      return;
    }
    setConfigPrinter(printer);
  };

  const handleSaveConfig = async (printer, form) => {
    await updatePrinter(printer.id, form);
    await reloadData();
    setConfigPrinter(null);
    setActivityMessage(`Configuracion actualizada para ${printer.name}.`);
  };

  const handleToggleLight = async (printer) => {
    if (printer.state === "printing") {
      setActivityMessage(`${printer.name} esta imprimiendo. La luz no se puede cambiar ahora.`);
      return;
    }
    await togglePrinterLight(printer.id);
    await reloadData();
    setActivityMessage(`Luz actualizada en ${printer.name}.`);
  };

  const handleMarkReady = async (printer) => {
    await markPrinterReady(printer.id);
    await reloadData();
    setActivityMessage(`${printer.name} confirmada como lista para la siguiente impresion.`);
  };

  const handlePowerAction = async (printer, action) => {
    if (printer.state === "printing") {
      setActivityMessage(`${printer.name} esta imprimiendo. El control de energia esta bloqueado.`);
      return;
    }
    await updatePrinterPower(printer.id, action);
    await reloadData();
    setActivityMessage(
      action === "on"
        ? `${printer.name} encendida. Si sigue offline, puedes reiniciar Klipper o Moonraker.`
        : `${printer.name} apagada desde Home Assistant.`
    );
  };

  const handleRestartService = async (printer, target) => {
    const response = await restartPrinterService(printer.id, target);
    await reloadData();
    setActivityMessage(
      response.message
        ? response.message
        : `${target === "moonraker" ? "Moonraker" : "Klipper"} reiniciado en ${printer.name}.`
    );
  };

  const handleCreateLibraryFolder = async (explicitParent = null) => {
    const name = window.prompt("Nombre de la carpeta");
    if (!name) return;
    const parent = explicitParent ?? (activeLibraryFolder === "Todas" ? "" : activeLibraryFolder);
    const response = await createLibraryFolder(name, parent);
    await reloadData();
    setActiveLibraryFolder(response.name || name);
    setActivityMessage(`Carpeta ${response.name || name} creada.`);
  };

  const handleDeleteLibraryFolder = async (folderName = activeLibraryFolder) => {
    if (!folderName || folderName === "Todas") return;
    const confirmed = window.confirm(`Eliminar carpeta ${folderName}? Solo se podra borrar si esta vacia.`);
    if (!confirmed) return;
    const response = await deleteLibraryFolder(folderName);
    if (response.success) {
      await reloadData();
      setActiveLibraryFolder("Todas");
      setActivityMessage(`Carpeta ${folderName} eliminada.`);
      return;
    }
    await reloadData();
    setActivityMessage(response.message || "No se pudo eliminar la carpeta.");
  };

  const filteredLibrary = useMemo(() => {
    const term = libraryQuery.toLowerCase().trim();
    const byFolder = activeLibraryFolder === "Todas"
      ? data.library
      : data.library.filter((file) => {
        const folder = file.folder || "General";
        return folder === activeLibraryFolder || folder.startsWith(`${activeLibraryFolder}/`);
      });
    if (!term) return byFolder;
    return byFolder.filter((file) =>
      [file.name, file.material, file.filename, file.description].join(" ").toLowerCase().includes(term)
    );
  }, [activeLibraryFolder, data.library, libraryQuery]);

  const handleImportLibraryFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const payload = new FormData();
    payload.append("file", file);
    payload.append("folder", activeLibraryFolder === "Todas" ? "General" : activeLibraryFolder);
    const imported = await importLibraryFile(payload);
    await reloadData();
    const importedFile = imported.file || imported;
    setActivityMessage(`Archivo ${importedFile.name} importado automaticamente.`);
    event.target.value = "";
  };

  const handleDeleteLibraryFile = async (fileId) => {
    await deleteLibraryFile(fileId);
    await reloadData();
    setActivityMessage(`Archivo ${fileId} eliminado.`);
  };

  const handleMoveLibraryFile = async (file) => {
    const availableFolders = (data.libraryFolders || fallbackData.libraryFolders).join(", ");
    const targetFolder = window.prompt(
      `Mover "${file.name}" a que carpeta?\n\nDisponibles: ${availableFolders}`,
      file.folder || activeLibraryFolder || "General"
    );
    if (!targetFolder) return;
    await moveLibraryFile(file.id, targetFolder);
    await reloadData();
    setActivityMessage(`Archivo ${file.name} movido a ${targetFolder}.`);
  };

  const handleDownloadLibraryFile = (file) => {
    const url = getLibraryDownloadUrl(file.id);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenDispatch = async (file) => {
    const preview = await fetchAssignmentPreview(file.id);
    setDispatchState({ file, preview });
  };

  const handleConfirmDispatch = async (payload) => {
    const response = await dispatchLibraryFile(dispatchState.file.id, payload);
    await reloadData();
    if (response.mode === "assigned") {
      setActivityMessage(`Trabajo enviado a ${response.selectedPrinter.name}.`);
    } else if (response.mode === "assigned_manual") {
      setActivityMessage(
        response.reason
          ? `Trabajo enviado manualmente a ${response.selectedPrinter.name}. Nota: ${response.reason}.`
          : `Trabajo enviado manualmente a ${response.selectedPrinter.name}.`
      );
    } else if (response.mode === "blocked") {
      setActivityMessage(response.message || "La impresora seleccionada no esta disponible.");
    } else {
      setActivityMessage("No habia impresoras libres para este envio.");
    }
    setDispatchState({ file: null, preview: null });
  };

  const handleEnableNotifications = async () => {
    try {
      setNotificationState((current) => ({ ...current, busy: true }));
      if (typeof Notification === "undefined") {
        throw new Error("Este navegador no soporta notificaciones.");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setActivityMessage("Permiso de notificaciones denegado.");
        return;
      }
      const { publicKey } = await fetchNotificationConfig();
      const subscription = await subscribeToPush(publicKey);
      await subscribeNotifications({
        subscription,
        deviceLabel: navigator.userAgent.includes("iPhone") ? "iPhone" : "Web App",
        platform: navigator.userAgent,
        preferences: notificationState.preferences
      });
      await refreshNotificationState();
      setActivityMessage("Notificaciones activadas correctamente.");
    } catch (error) {
      setActivityMessage(error.message || "No fue posible activar notificaciones.");
    } finally {
      setNotificationState((current) => ({ ...current, busy: false }));
    }
  };

  const handleDisableNotifications = async () => {
    try {
      setNotificationState((current) => ({ ...current, busy: true }));
      const subscription = await unsubscribeFromPush();
      if (subscription?.endpoint) {
        await unsubscribeNotifications(subscription.endpoint);
      }
      await refreshNotificationState();
      setActivityMessage("Notificaciones desactivadas.");
    } catch (error) {
      setActivityMessage(error.message || "No fue posible desactivar notificaciones.");
    } finally {
      setNotificationState((current) => ({ ...current, busy: false }));
    }
  };

  const handleTestNotification = async () => {
    try {
      setNotificationState((current) => ({ ...current, busy: true }));
      await sendTestNotification();
      const status = await fetchNotificationStatus();
      if (status.lastReport?.sent > 0) {
        setActivityMessage(`Notificacion de prueba enviada a ${status.lastReport.sent} dispositivo(s).`);
      } else {
        setActivityMessage(status.lastReport?.errors?.[0] || "No fue posible entregar la notificacion.");
      }
    } catch (error) {
      setActivityMessage(error.message || "No fue posible enviar la notificacion de prueba.");
    } finally {
      setNotificationState((current) => ({ ...current, busy: false }));
    }
  };

  const handleToggleNotificationPanel = () => {
    setNotificationState((current) => ({ ...current, expanded: !current.expanded }));
  };

  const handlePreferenceChange = async (key, enabled) => {
    const nextPreferences = { ...notificationState.preferences, [key]: enabled };
    setNotificationState((current) => ({ ...current, preferences: nextPreferences }));
    try {
      const subscription = await getPushSubscription();
      if (subscription?.endpoint) {
        await updateNotificationPreferences(subscription.endpoint, nextPreferences);
      }
      setActivityMessage("Preferencias de notificacion actualizadas.");
    } catch (error) {
      setActivityMessage(error.message || "No fue posible actualizar las preferencias.");
    }
  };

  const handleManualRefresh = async () => {
    try {
      await reloadData();
      setActivityMessage("Panel actualizado.");
    } catch (error) {
      setActivityMessage(error.message || "No fue posible actualizar el panel.");
    }
  };

  const syncStatusText = useMemo(() => {
    if (!lastSyncedAt) return "Sin sincronizar aun";
    const stamp = new Date(lastSyncedAt);
    return `Actualizado ${stamp.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })}`;
  }, [lastSyncedAt]);

  const navButtons = [
    ["dashboard", "Dashboard"],
    ["library", "Biblioteca"],
    ["streaming", "Streaming"]
  ];

  return (
    <div className="panel-grid min-h-screen bg-grid px-3 py-3 text-slate-100 sm:px-4 xl:px-5">
      <div className="mx-auto max-w-[2300px] space-y-4">
        <header className="glass rounded-[24px] border border-white/10 p-3 shadow-glow sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold leading-none sm:text-3xl">Printer Hub</h1>
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    v{APP_VERSION}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    socketConnected
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                      : "border-amber-400/20 bg-amber-400/10 text-amber-200"
                  }`}>
                    {socketConnected ? "Live" : "Reconectando"}
                  </span>
                </div>
                <div className="hidden items-center gap-2 lg:flex">
                  {navButtons.map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveView(id)}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                        activeView === id ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200"
                  >
                    {isRefreshing ? "Actualizando..." : "Actualizar"}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {syncStatusText}
                {isRefreshing ? " · Actualizando..." : ` · Auto-refresh ${REFRESH_INTERVAL_MS / 1000}s`}
              </p>
              {activityMessage && <p className="mt-1 text-xs text-slate-500">{activityMessage}</p>}
            </div>
            <div className="relative z-[90] shrink-0 isolate">
              <button
                type="button"
                onClick={() => setHeaderMenuOpen((current) => !current)}
                className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-[#0d1219] px-3 text-slate-200 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-none"
              >
                <span className="flex flex-col gap-1 sm:hidden">
                  <span className="h-0.5 w-4 rounded-full bg-current" />
                  <span className="h-0.5 w-4 rounded-full bg-current" />
                  <span className="h-0.5 w-4 rounded-full bg-current" />
                </span>
                <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] sm:inline">Menu</span>
                <span className="text-xs text-slate-500">{headerMenuOpen ? "^" : "?"}</span>
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 lg:hidden">
            {navButtons.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveView(id)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                  activeView === id ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleManualRefresh}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200"
            >
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </header>

        {headerMenuOpen && (
          <div className="fixed inset-0 z-[140]">
            <button
              type="button"
              aria-label="Cerrar menu"
              onClick={() => setHeaderMenuOpen(false)}
              className="absolute inset-0 h-full w-full bg-black/35"
            />
            <div className="pointer-events-none absolute inset-0 overflow-y-auto p-3 sm:p-4">
              <div className="flex min-h-full items-start justify-end">
                <div className="pointer-events-auto mt-14 max-h-[calc(100vh-5.5rem)] w-[min(92vw,26rem)] overflow-y-auto rounded-3xl border border-white/10 bg-[#080b11] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.82)] overscroll-contain">
                  <div className="mb-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStreamingConfigOpen(true);
                        setHeaderMenuOpen(false);
                      }}
                      className="rounded-2xl border border-white/10 bg-[#11161f] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-200"
                    >
                      Configuracion
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPrinter}
                      className="rounded-2xl border border-white/10 bg-[#11161f] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-200"
                    >
                      Agregar impresora
                    </button>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-[#0f141c] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <NotificationSetup
                      compact
                      permission={notificationState.permission}
                      subscribed={notificationState.subscribed}
                      busy={notificationState.busy}
                      expanded={notificationState.expanded}
                      preferences={notificationState.preferences}
                      options={notificationState.options}
                      onToggleExpanded={handleToggleNotificationPanel}
                      onPreferenceChange={handlePreferenceChange}
                      onEnable={handleEnableNotifications}
                      onDisable={handleDisableNotifications}
                      onTest={handleTestNotification}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === "dashboard" && (
          <DashboardSection
            printers={data.printers}
            onOpenConfig={handleOpenConfig}
            onToggleLight={handleToggleLight}
            onPowerAction={handlePowerAction}
            onRestartService={handleRestartService}
            onMarkReady={handleMarkReady}
          />
        )}

        {activeView === "library" && (
          <>
            <input
              id="library-file-input"
              type="file"
              accept=".gcode,.gc,.txt"
              className="hidden"
              onChange={handleImportLibraryFile}
            />
            <FileLibrary
              files={filteredLibrary}
              allFiles={data.library}
              folders={["Todas", ...(data.libraryFolders || fallbackData.libraryFolders)]}
              printers={data.printers}
              query={libraryQuery}
              activeFolder={activeLibraryFolder}
              onFolderChange={setActiveLibraryFolder}
              onCreateFolder={handleCreateLibraryFolder}
              onDeleteFolder={handleDeleteLibraryFolder}
              onQueryChange={setLibraryQuery}
              onOpenUpload={() => document.getElementById("library-file-input")?.click()}
              onDelete={handleDeleteLibraryFile}
              onMove={handleMoveLibraryFile}
              onDownload={handleDownloadLibraryFile}
              onOpenDispatch={handleOpenDispatch}
            />
          </>
        )}

        {activeView === "streaming" && (
          <StreamingSection
            configVersion={streamingConfigVersion}
            printers={data.printers}
          />
        )}

        <PrinterConfigModal
          printer={configPrinter}
          onClose={() => setConfigPrinter(null)}
          onSave={handleSaveConfig}
        />
        <StreamingConfigModal
          open={streamingConfigOpen}
          onClose={() => setStreamingConfigOpen(false)}
          onSaved={() => {
            setStreamingConfigVersion((current) => current + 1);
            setActivityMessage("Configuracion de streaming actualizada.");
          }}
        />
        <DispatchPrintModal
          file={dispatchState.file}
          preview={dispatchState.preview}
          onClose={() => setDispatchState({ file: null, preview: null })}
          onConfirm={handleConfirmDispatch}
        />
      </div>
    </div>
  );
}

export default App;

