export function PrinterModelPreview({ fileName, image }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
      <img src={image} alt={fileName} className="h-24 w-full object-cover opacity-75" />
      <div className="p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Modelo</p>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-100">{fileName}</p>
      </div>
    </div>
  );
}
