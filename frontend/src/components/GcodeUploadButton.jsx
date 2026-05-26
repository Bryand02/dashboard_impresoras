export function GcodeUploadButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-accent/30 bg-accent/10 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent transition hover:bg-accent/20"
    >
      G-code
    </button>
  );
}
