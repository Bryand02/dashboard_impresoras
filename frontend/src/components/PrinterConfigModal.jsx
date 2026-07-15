import { useEffect, useState } from "react";

const emptyForm = {
  moonrakerUrl: "",
  cameraUrl: "",
  powerEnabled: true,
  homeAssistantEntity: "",
  lightEnabled: false,
  lightEntity: ""
};

const emptySpoolForm = {
  color: "#8fd3ff",
  material: "PLA",
  grams: ""
};

const MATERIAL_OPTIONS = ["PLA", "PETG", "ABS", "ASA", "TPU", "NYLON"];

export function PrinterConfigModal({ printer, onClose, onSave, onSaveSpool }) {
  const [form, setForm] = useState(emptyForm);
  const [spoolForm, setSpoolForm] = useState(emptySpoolForm);

  useEffect(() => {
    if (!printer) return;
    setForm({
      moonrakerUrl: printer.moonrakerUrl || "",
      cameraUrl: printer.cameraUrl || "",
      powerEnabled: printer.powerEnabled ?? true,
      homeAssistantEntity: printer.homeAssistantEntity || "",
      lightEnabled: Boolean(printer.lightEnabled),
      lightEntity: printer.lightEntity || ""
    });
    setSpoolForm({
      color: printer.spool?.color || "#8fd3ff",
      material: printer.spool?.material || "PLA",
      grams: ""
    });
  }, [printer]);

  if (!printer) return null;

  const submit = (event) => {
    event.preventDefault();
    onSave(printer, form);
  };

  const submitSpool = (event) => {
    event.preventDefault();
    if (!spoolForm.grams || Number(spoolForm.grams) <= 0) return;
    onSaveSpool(printer, spoolForm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 p-4">
      <form onSubmit={submit} className="glass w-full max-w-xl rounded-[28px] border border-white/10 p-5 shadow-glow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Configuracion</p>
            <h2 className="mt-1 font-display text-3xl">{printer.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
            Cerrar
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">URL Moonraker</span>
            <input
              value={form.moonrakerUrl}
              onChange={(event) => setForm((current) => ({ ...current, moonrakerUrl: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">URL Camara</span>
            <input
              value={form.cameraUrl}
              onChange={(event) => setForm((current) => ({ ...current, cameraUrl: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={form.powerEnabled}
              onChange={(event) => setForm((current) => ({ ...current, powerEnabled: event.target.checked }))}
            />
            Habilitar encendido y apagado con Home Assistant
          </label>

          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Entidad de energia</span>
            <input
              value={form.homeAssistantEntity}
              onChange={(event) => setForm((current) => ({ ...current, homeAssistantEntity: event.target.value }))}
              disabled={!form.powerEnabled}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 disabled:opacity-40"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={form.lightEnabled}
              onChange={(event) => setForm((current) => ({ ...current, lightEnabled: event.target.checked }))}
            />
            Habilitar lampara en esta impresora
          </label>

          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Entidad de luz</span>
            <input
              value={form.lightEntity}
              onChange={(event) => setForm((current) => ({ ...current, lightEntity: event.target.value }))}
              disabled={!form.lightEnabled}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 disabled:opacity-40"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="submit" className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
            Guardar cambios
          </button>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Material / Rollo</p>
          {printer.spool && (
            <p className="mt-2 text-xs text-slate-400">
              Rollo actual: <span className="font-semibold text-slate-200">{printer.spool.material}</span>{" "}
              — {printer.spool.remainingGrams}g de {printer.spool.initialGrams}g restantes
            </p>
          )}

          <div className="mt-3 grid grid-cols-3 gap-3">
            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Color</span>
              <input
                type="color"
                value={spoolForm.color}
                onChange={(event) => setSpoolForm((current) => ({ ...current, color: event.target.value }))}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-2"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Material</span>
              <select
                value={spoolForm.material}
                onChange={(event) => setSpoolForm((current) => ({ ...current, material: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-3 text-sm text-slate-100"
              >
                {MATERIAL_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Gramos nuevos</span>
              <input
                type="number"
                min="1"
                placeholder="1000"
                value={spoolForm.grams}
                onChange={(event) => setSpoolForm((current) => ({ ...current, grams: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-3 text-sm text-slate-100"
              />
            </label>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={submitSpool}
              className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200"
            >
              Cambiar rollo
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
