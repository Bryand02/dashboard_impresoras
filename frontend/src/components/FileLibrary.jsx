import { useEffect, useMemo, useState } from "react";

const formatMinutes = (minutes) => {
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
};

function FolderIcon() {
  return (
    <span className="relative block h-4 w-5 shrink-0 rounded-sm bg-amber-300/95">
      <span className="absolute -top-1 left-0 h-2 w-2.5 rounded-t-sm bg-amber-200/95" />
    </span>
  );
}

function ModelPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(70,92,115,0.32),transparent_55%),linear-gradient(180deg,#0d1218_0%,#090c11_100%)]">
      <div className="relative h-14 w-14 rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="absolute inset-x-3 bottom-3 h-4 rounded-sm border border-white/15 bg-white/[0.04]" />
        <div className="absolute left-4 top-3 h-6 w-6 rounded border border-cyan-300/20 bg-cyan-300/10" />
        <div className="absolute right-4 top-6 h-3 w-3 rounded-full border border-white/15 bg-white/[0.05]" />
      </div>
    </div>
  );
}

function ThumbnailCell({ file }) {
  return (
    <div className="h-20 w-28 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      {file.thumbnail ? (
        <img src={file.thumbnail} alt={file.name} className="h-full w-full object-contain p-1" />
      ) : (
        <ModelPlaceholder />
      )}
    </div>
  );
}

const buildFolderTree = (folders, allFiles) => {
  const root = {
    id: "Todas",
    name: "Todas",
    path: "Todas",
    depth: 0,
    count: allFiles.length,
    children: []
  };

  const nodes = new Map([["Todas", root]]);

  folders
    .filter((folder) => folder !== "Todas")
    .forEach((folder) => {
      const parts = folder.split("/");
      let currentPath = "";
      let parentPath = "Todas";

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!nodes.has(currentPath)) {
          const node = {
            id: currentPath,
            name: part,
            path: currentPath,
            depth: index,
            count: allFiles.filter((file) => {
              const fileFolder = file.folder || "General";
              return fileFolder === currentPath || fileFolder.startsWith(`${currentPath}/`);
            }).length,
            children: []
          };
          nodes.set(currentPath, node);
          nodes.get(parentPath)?.children.push(node);
        }
        parentPath = currentPath;
      });
    });

  return root;
};

function FolderRow({
  node,
  activeFolder,
  expanded,
  onToggleExpand,
  onSelect,
  onCreateFolder,
  onDeleteFolder
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.path);
  const active = node.path === activeFolder;
  const canDelete = node.path !== "Todas";

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-2 rounded-xl px-2 py-2 ${
          active ? "bg-white text-slate-950" : "text-slate-200 hover:bg-white/5"
        }`}
        style={{ marginLeft: `${node.depth * 14}px` }}
      >
        <button
          type="button"
          onClick={() => (hasChildren ? onToggleExpand(node.path) : onSelect(node.path))}
          className={`flex h-6 w-6 items-center justify-center rounded-md text-sm ${hasChildren ? "" : "opacity-30"}`}
        >
          <span className={`transition ${hasChildren && isExpanded ? "rotate-90" : ""}`}>{">"}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelect(node.path)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <FolderIcon />
          <span className="truncate text-sm font-medium">{node.name}</span>
          <span className={`ml-auto text-[11px] ${active ? "text-slate-700" : "text-slate-500"}`}>{node.count}</span>
        </button>

        <button
          type="button"
          title={`Crear carpeta dentro de ${node.name}`}
          onClick={() => onCreateFolder(node.path === "Todas" ? "" : node.path)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-base ${
            active ? "border-slate-300/20 bg-slate-900/10 text-slate-700" : "border-white/10 bg-black/20 text-slate-300"
          }`}
        >
          +
        </button>

        <button
          type="button"
          title={`Eliminar carpeta ${node.name}`}
          disabled={!canDelete}
          onClick={() => onDeleteFolder(node.path)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm ${
            canDelete
              ? active
                ? "border-rose-300/30 bg-rose-500/10 text-rose-700"
                : "border-rose-300/20 bg-rose-500/10 text-rose-200"
              : "cursor-not-allowed border-white/10 bg-white/5 text-slate-500 opacity-50"
          }`}
        >
          x
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {node.children
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <FolderRow
                key={child.path}
                node={child}
                activeFolder={activeFolder}
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                onCreateFolder={onCreateFolder}
                onDeleteFolder={onDeleteFolder}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function FileLibrary({
  files,
  allFiles = [],
  folders = [],
  printers = [],
  query,
  activeFolder,
  onFolderChange,
  onCreateFolder,
  onDeleteFolder,
  onQueryChange,
  onOpenUpload,
  onDelete,
  onOpenDispatch
}) {
  const printerNameMap = new Map(printers.map((printer) => [printer.id, printer.name]));
  const folderTree = useMemo(() => buildFolderTree(folders, allFiles), [folders, allFiles]);
  const [expanded, setExpanded] = useState(new Set(["Todas", "General", "Inbox", "Orca Imports"]));

  const toggleExpand = (path) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  useEffect(() => {
    setExpanded((current) => {
      const next = new Set(current);
      next.add("Todas");
      if (activeFolder && activeFolder !== "Todas") {
        const parts = activeFolder.split("/");
        let currentPath = "";
        parts.forEach((part) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          next.add(currentPath);
        });
      }
      return next;
    });
  }, [activeFolder, folders]);

  return (
    <section className="space-y-4">
      <header className="glass rounded-[24px] border border-white/10 p-4 shadow-glow">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Biblioteca unificada</p>
            <h2 className="mt-1 font-display text-3xl">G-code Library</h2>
            <p className="mt-2 text-sm text-slate-400">Organiza archivos por carpeta y despacha impresiones desde una sola cola central.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar por nombre, material o archivo"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100"
            />
            <button
              type="button"
              onClick={onOpenUpload}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100"
            >
              Subir G-code
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="glass rounded-[24px] border border-white/10 p-4 shadow-glow">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Carpetas</p>
            <p className="mt-1 text-sm text-slate-400">Navega la biblioteca como un explorador de archivos.</p>
          </div>

          <div className="mt-4 space-y-1">
            <FolderRow
              node={folderTree}
              activeFolder={activeFolder}
              expanded={expanded}
              onToggleExpand={toggleExpand}
              onSelect={onFolderChange}
              onCreateFolder={onCreateFolder}
              onDeleteFolder={onDeleteFolder}
            />
          </div>
        </aside>

        <div className="glass overflow-hidden rounded-[24px] border border-white/10 shadow-glow">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="grid grid-cols-[132px_1.8fr_0.8fr_0.8fr_1fr_auto] items-center gap-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  <span>Preview</span>
                  <span>Archivo</span>
                  <span>Duracion</span>
                  <span>Material</span>
                  <span>Subido</span>
                  <span className="text-right">Acciones</span>
                </div>
              </div>

              <div className="divide-y divide-white/8">
                {files.length === 0 && (
                  <div className="px-5 py-8 text-sm text-slate-500">No hay archivos en esta carpeta.</div>
                )}
                {files.map((file) => (
                  <article
                    key={file.id}
                    className="grid grid-cols-[132px_1.8fr_0.8fr_0.8fr_1fr_auto] items-center gap-4 px-4 py-4"
                  >
                    <ThumbnailCell file={file} />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-lg font-semibold text-slate-100">{file.name}</h3>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                          {file.folder || "General"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500">{file.filename}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {file.compatibility.map((machine) => (
                          <span
                            key={machine}
                            className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-400"
                          >
                            {printerNameMap.get(machine) || machine}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Duracion</p>
                      <p className="mt-1 font-display text-2xl text-slate-100">{formatMinutes(file.estimatedMinutes)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Material</p>
                      <p className="mt-1 text-lg font-semibold text-slate-100">{file.material}</p>
                      <p className="text-sm text-slate-500">{file.weightGrams || 0}g</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Fecha</p>
                      <p className="mt-1 text-sm font-medium text-slate-200">{formatDate(file.uploadedAt)}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenDispatch(file)}
                        className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200"
                      >
                        Enviar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(file.id)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
