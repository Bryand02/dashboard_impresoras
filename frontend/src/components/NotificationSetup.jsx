export function NotificationSetup({
  permission,
  subscribed,
  busy,
  onEnable,
  onDisable,
  onTest
}) {
  return (
    <section className="glass rounded-[24px] border border-white/10 p-4 shadow-glow">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">iPhone</p>
          <h2 className="mt-1 font-display text-2xl">Notificaciones y widget</h2>
          <p className="mt-2 text-sm text-slate-400">
            Instala esta web como app en tu iPhone, habilita notificaciones y usa la app iOS nativa para widget y lock screen.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Estado actual: {subscribed ? "notificaciones activas" : permission === "denied" ? "bloqueadas por el navegador" : "sin activar"}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!subscribed ? (
            <button
              type="button"
              disabled={busy}
              onClick={onEnable}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200 disabled:opacity-50"
            >
              Activar push
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onTest}
                className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200 disabled:opacity-50"
              >
                Probar aviso
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onDisable}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 disabled:opacity-50"
              >
                Desactivar
              </button>
            </>
          )}
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-500">
        En iPhone: Safari - Compartir - Agregar a pantalla de inicio - abrir la app instalada - permitir notificaciones.
      </div>
    </section>
  );
}
