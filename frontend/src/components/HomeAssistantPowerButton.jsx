export function HomeAssistantPowerButton({ powerState, onAction, disabled = false }) {
  const isOn = powerState === "on";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAction(isOn ? "off" : "on")}
      className={`w-full rounded-2xl border px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition ${
        isOn
          ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-200"
          : "border-white/10 bg-white/5 text-slate-200"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {isOn ? "Apagar impresora" : "Encender impresora"}
    </button>
  );
}
