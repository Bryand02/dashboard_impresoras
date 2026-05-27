const ModelPlaceholder = () => (
  <div className="flex h-24 w-full items-center justify-center bg-[radial-gradient(circle_at_top,#18253a_0%,#0b1220_58%,#050914_100%)]">
    <div className="relative h-12 w-16 opacity-80">
      <div className="absolute inset-x-0 bottom-0 h-2 rounded-full border border-cyan-400/20 bg-cyan-400/10" />
      <div className="absolute left-2 top-2 h-7 w-12 skew-x-[-16deg] rounded border border-cyan-300/20 bg-slate-900/70 shadow-[0_0_24px_rgba(34,211,238,0.08)]" />
      <div className="absolute left-5 top-0 h-7 w-6 rounded border border-cyan-300/25 bg-slate-950/80" />
    </div>
  </div>
);

export function PrinterModelPreview({ fileName, image }) {
  const hasRealImage = Boolean(image) && !/^https:\/\/images\.unsplash\.com\//i.test(image);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
      {hasRealImage ? (
        <img src={image} alt={fileName} className="h-24 w-full object-cover opacity-90" />
      ) : (
        <ModelPlaceholder />
      )}
      <div className="p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Modelo</p>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-100">{fileName}</p>
        {!hasRealImage && <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">Sin thumbnail</p>}
      </div>
    </div>
  );
}
