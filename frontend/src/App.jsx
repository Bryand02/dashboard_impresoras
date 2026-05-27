import { useEffect, useMemo, useState } from "react";
import { DispatchPrintModal } from "./components/DispatchPrintModal";
import { FileLibrary } from "./components/FileLibrary";
import { FloatingCameraWindow } from "./components/FloatingCameraWindow";
import { PrinterConfigModal } from "./components/PrinterConfigModal";
import { APP_VERSION } from "./config/version";
import { fallbackData } from "./data/fallbackData";
import { DashboardSection } from "./sections/DashboardSection";
import {
  createPrinter,
  createSocket,
  deleteLibraryFile,
  dispatchLibraryFile,
  fetchAssignmentPreview,
  fetchBootstrap,
  importLibraryFile,
  markPrinterReady,
  togglePrinterLight,
  updatePrinter,
  updatePrinterPower
} from "./services/api";

function App() {
  const [data, setData] = useState(fallbackData);
  const [configPrinter, setConfigPrinter] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [dispatchState, setDispatchState] = useState({ file: null, preview: null });
  const [activityMessage, setActivityMessage] = useState("");
  const [floatingCamera, setFloatingCamera] = useState(null);

  useEffect(() => {
    let socket;
    document.title = `Printer Hub v${APP_VERSION}`;
    fetchBootstrap()
      .then((bootstrap) => {
        setData({
          printers: bootstrap.printers,
          library: bootstrap.library,
          queue: bootstrap.queue
        });
      })
      .catch(() => {
        setData(fallbackData);
      });

    socket = createSocket((message) => {
      if (message.type === "snapshot") {
        setData(message.payload);
      }
    });

    return () => socket?.close();
  }, []);

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
    setActivityMessage(`Impresora ${name} agregada.`);
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
    setConfigPrinter(null);
    setActivityMessage(`Configuracion actualizada para ${printer.name}.`);
  };

  const handleToggleLight = async (printer) => {
    if (printer.state === "printing") {
      setActivityMessage(`${printer.name} esta imprimiendo. La luz no se puede cambiar ahora.`);
      return;
    }
    await togglePrinterLight(printer.id);
    setActivityMessage(`Luz actualizada en ${printer.name}.`);
  };

  const handleMarkReady = async (printer) => {
    await markPrinterReady(printer.id);
    setActivityMessage(`${printer.name} confirmada como lista para la siguiente impresion.`);
  };

  const handlePowerAction = async (printer, action) => {
    if (printer.state === "printing") {
      setActivityMessage(`${printer.name} esta imprimiendo. El control de energia esta bloqueado.`);
      return;
    }
    await updatePrinterPower(printer.id, action);
    setActivityMessage(`${printer.name}: ${action}.`);
  };

  const summary = useMemo(() => {
    const printing = data.printers.filter((printer) => printer.state === "printing").length;
    return { printing };
  }, [data.printers]);

  const filteredLibrary = useMemo(() => {
    const term = libraryQuery.toLowerCase().trim();
    if (!term) return data.library;
    return data.library.filter((file) =>
      [file.name, file.material, file.filename, file.description].join(" ").toLowerCase().includes(term)
    );
  }, [data.library, libraryQuery]);

  const handleImportLibraryFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const payload = new FormData();
    payload.append("file", file);
    const imported = await importLibraryFile(payload);
    const importedFile = imported.file || imported;
    setActivityMessage(`Archivo ${importedFile.name} importado automaticamente.`);
    event.target.value = "";
  };

  const handleDeleteLibraryFile = async (fileId) => {
    await deleteLibraryFile(fileId);
    setActivityMessage(`Archivo ${fileId} eliminado.`);
  };

  const handleOpenDispatch = async (file) => {
    const preview = await fetchAssignmentPreview(file.id);
    setDispatchState({ file, preview });
  };

  const handleConfirmDispatch = async (payload) => {
    const response = await dispatchLibraryFile(dispatchState.file.id, payload);
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

  const handleOpenFloatingCamera = (printer) => {
    setFloatingCamera(printer);
  };

  return (
    <div className="panel-grid min-h-screen bg-grid px-3 py-3 text-slate-100 sm:px-4 xl:px-5">
      <div className="mx-auto max-w-[2300px] space-y-4">
        <header className="glass rounded-[24px] border border-white/10 p-4 shadow-glow">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-bold leading-none sm:text-4xl">Printer Hub</h1>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">Seguimiento rapido de la flota y biblioteca unificada de G-codes.</p>
              {activityMessage && <p className="mt-2 text-xs text-slate-500">{activityMessage}</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Imprimiendo ahora</p>
                <p className="mt-2 font-display text-4xl text-slate-100">{summary.printing}</p>
              </div>
              <button
                type="button"
                onClick={handleAddPrinter}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200"
              >
                Agregar impresora
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ["dashboard", "Dashboard"],
              ["library", "Biblioteca"]
            ].map(([id, label]) => (
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
          </div>
        </header>

        {activeView === "dashboard" && (
          <DashboardSection
            printers={data.printers}
            onOpenConfig={handleOpenConfig}
            onToggleLight={handleToggleLight}
            onPowerAction={handlePowerAction}
            onMarkReady={handleMarkReady}
            onOpenFloatingCamera={handleOpenFloatingCamera}
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
              printers={data.printers}
              query={libraryQuery}
              onQueryChange={setLibraryQuery}
              onOpenUpload={() => document.getElementById("library-file-input")?.click()}
              onDelete={handleDeleteLibraryFile}
              onOpenDispatch={handleOpenDispatch}
            />
          </>
        )}

        <PrinterConfigModal
          printer={configPrinter}
          onClose={() => setConfigPrinter(null)}
          onSave={handleSaveConfig}
        />
        <DispatchPrintModal
          file={dispatchState.file}
          preview={dispatchState.preview}
          onClose={() => setDispatchState({ file: null, preview: null })}
          onConfirm={handleConfirmDispatch}
        />
        {floatingCamera && (
          <FloatingCameraWindow
            printer={floatingCamera}
            onClose={() => setFloatingCamera(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
