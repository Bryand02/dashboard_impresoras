export function NotificationSetup({
  compact = false,
  permission,
  subscribed,
  busy,
  expanded,
  preferences,
  options,
  onToggleExpanded,
  onPreferenceChange,
  onEnable,
  onDisable,
  onTest
}) {
  const containerClass = compact
    ? "rounded-2xl border border-white/10 bg-[#0f141c] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.42)] backdrop-blur-none"
    : "glass rounded-[24px] border border-white/10 p-4 shadow-glow";

  return (
    <section className={containerClass}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">iPhone</p>
            {!compact && (
              <button
                type="button"
                onClick={onToggleExpanded}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300"
              >
                Notificaciones
              </button>
            )}
          </div>
          <h2 className={`mt-2 font-display ${compact ? "text-lg" : "text-2xl"}`}>Notificaciones y widget</h2>
          <p className={`mt-2 ${compact ? "text-xs" : "text-sm"} text-slate-400`}>
            Activa el push en tu iPhone y elige exactamente que eventos quieres recibir: inicio, pausa, finalizacion, energia y cambios de estado.
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

      {(expanded || compact) && subscribed && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b1017] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">Checklist de avisos</div>
          <div className={`grid gap-2 ${compact ? "md:grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"}`}>
            {options.map((option) => (
              <label
                key={option.key}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={preferences[option.key] !== false}
                  onChange={(event) => onPreferenceChange(option.key, event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-slate-950 text-emerald-400 focus:ring-emerald-400/40"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={`mt-3 text-xs text-slate-500 ${compact ? "max-w-md" : ""}`}>
        En iPhone: Safari - Compartir - Agregar a pantalla de inicio - abrir la app instalada - permitir notificaciones.
      </div>
    </section>
  );
}
