export function QueueManager({ assignmentPreview }) {
  return (
    <section className="glass rounded-[28px] border border-white/10 p-5 shadow-glow">
      <p className="text-xs uppercase tracking-[0.28em] text-accent">Assignment engine</p>
      <h2 className="mt-1 font-display text-3xl">Motor de asignacion</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Logica actual</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>Libre y online</li>
            <li>Material compatible</li>
            <li>Volumen suficiente</li>
            <li>Material ya cargado</li>
            <li>Menor carga y mayor velocidad</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ultimo resultado</p>
          <p className="mt-3 text-sm text-slate-300">{assignmentPreview || "Aun no se ha ejecutado asignacion automatica."}</p>
        </div>
      </div>
    </section>
  );
}
