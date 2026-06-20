import { useMemo, useState } from "react";
import { createShareLink, revokeShareLink } from "../services/api";

const DURATION_OPTIONS = [
  { hours: 1, label: "1 hora" },
  { hours: 8, label: "8 horas" },
  { hours: 24, label: "24 horas" },
  { hours: 168, label: "7 dias" }
];

function panelButtonClass(isPrimary = false) {
  return isPrimary
    ? "rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-400/15"
    : "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 transition hover:bg-white/10";
}

export function ShareStreamModal({ open, onClose, shareTarget }) {
  const [isBusy, setIsBusy] = useState(false);
  const [shareInfo, setShareInfo] = useState(null);
  const [feedback, setFeedback] = useState("");

  const expiresText = useMemo(() => {
    if (!shareInfo?.expiresAt) return "";
    return new Date(shareInfo.expiresAt).toLocaleString("es-CO");
  }, [shareInfo]);

  if (!open || !shareTarget) return null;

  const handleCreate = async (durationHours) => {
    try {
      setIsBusy(true);
      setFeedback("");
      const response = await createShareLink({
        cameraId: shareTarget.cameraId,
        cameraName: shareTarget.cameraName,
        presetLabel: shareTarget.presetLabel,
        streamUrl: shareTarget.streamUrl,
        embedUrl: shareTarget.embedUrl,
        durationHours
      });
      setShareInfo(response);
    } catch (error) {
      setFeedback(error.message || "No fue posible generar el enlace.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!shareInfo?.url) return;
    try {
      await navigator.clipboard.writeText(shareInfo.url);
      setFeedback("Enlace copiado.");
    } catch {
      setFeedback("No se pudo copiar automaticamente.");
    }
  };

  const handleRevoke = async () => {
    if (!shareInfo?.token) return;
    try {
      setIsBusy(true);
      await revokeShareLink(shareInfo.token);
      setShareInfo((current) => (current ? { ...current, revoked: true } : current));
      setFeedback("Enlace revocado.");
    } catch (error) {
      setFeedback(error.message || "No fue posible revocar el enlace.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[175] bg-black/60 p-3 sm:p-6">
      <div className="mx-auto max-w-2xl rounded-[28px] border border-white/10 bg-[#080b11] p-4 shadow-[0_32px_80px_rgba(0,0,0,0.78)] sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-accent">Share Link</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-white">{shareTarget.cameraName}</h2>
            <p className="mt-1 text-sm text-slate-500">{shareTarget.presetLabel || "Vista activa"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200"
          >
            Cerrar
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0f141c] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Duracion</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.hours}
                type="button"
                disabled={isBusy}
                onClick={() => handleCreate(option.hours)}
                className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-left text-sm font-semibold text-slate-100 transition hover:border-cyan-300/25 hover:bg-slate-950/65 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {option.label}
              </button>
            ))}
          </div>

          {shareInfo && (
            <div className="mt-4 rounded-3xl border border-cyan-300/12 bg-slate-950/35 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Enlace generado</p>
              <div className="mt-2 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-slate-200 break-all">
                {shareInfo.url}
              </div>
              <p className="mt-3 text-sm text-slate-400">Expira: {expiresText}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={handleCopy} className={panelButtonClass(true)}>
                  Copiar
                </button>
                {!shareInfo.revoked && (
                  <button type="button" onClick={handleRevoke} className={panelButtonClass()}>
                    Revocar
                  </button>
                )}
              </div>
            </div>
          )}

          {feedback && <p className="mt-4 text-sm text-slate-400">{feedback}</p>}
        </div>
      </div>
    </div>
  );
}
