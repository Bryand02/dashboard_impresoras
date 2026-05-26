export function CameraPreview({ printer }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65">
      <div className="relative h-24">
        <img src={printer.image} alt={printer.name} className="h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
          Camara
        </div>
      </div>
      <div className="px-3 py-2">
        <span className="block truncate text-[11px] text-slate-500">{printer.cameraUrl || "Sin URL de camara"}</span>
      </div>
    </div>
  );
}
