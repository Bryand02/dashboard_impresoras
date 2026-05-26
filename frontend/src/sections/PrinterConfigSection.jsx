import { useState } from "react";

const emptyPrinter = {
  name: "",
  moonrakerUrl: "",
  cameraUrl: "",
  homeAssistantEntity: "",
  profile: "",
  materials: "PLA,PETG",
  volumeX: 220,
  volumeY: 220,
  volumeZ: 250,
  image: ""
};

export function PrinterConfigSection({ printers, onCreate, onDelete }) {
  const [form, setForm] = useState(emptyPrinter);

  const submit = (event) => {
    event.preventDefault();
    onCreate({
      name: form.name,
      moonrakerUrl: form.moonrakerUrl,
      cameraUrl: form.cameraUrl,
      homeAssistantEntity: form.homeAssistantEntity,
      profile: form.profile,
      materials: form.materials.split(",").map((item) => item.trim()),
      volume: { x: Number(form.volumeX), y: Number(form.volumeY), z: Number(form.volumeZ) },
      image: form.image || "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=600&q=80"
    });
    setForm(emptyPrinter);
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[1.1fr_1.4fr]">
      <form onSubmit={submit} className="glass rounded-[28px] border border-white/10 p-5 shadow-glow">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Printer setup</p>
        <h2 className="mt-1 font-display text-3xl">Agregar impresora</h2>
        <div className="mt-5 grid gap-3">
          {[
            ["name", "Nombre"],
            ["moonrakerUrl", "URL Moonraker"],
            ["cameraUrl", "URL Camara"],
            ["homeAssistantEntity", "Entidad Home Assistant"],
            ["profile", "Perfil"],
            ["materials", "Materiales"],
            ["image", "Imagen"]
          ].map(([key, label]) => (
            <input
              key={key}
              value={form[key]}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              placeholder={label}
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100"
            />
          ))}
          <div className="grid grid-cols-3 gap-3">
            {["volumeX", "volumeY", "volumeZ"].map((key) => (
              <input
                key={key}
                type="number"
                value={form[key]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                placeholder={key}
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100"
              />
            ))}
          </div>
          <button type="submit" className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
            Guardar impresora
          </button>
        </div>
      </form>

      <div className="glass rounded-[28px] border border-white/10 p-5 shadow-glow">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Registered fleet</p>
        <h2 className="mt-1 font-display text-3xl">Flota configurada</h2>
        <div className="mt-5 space-y-3">
          {printers.map((printer) => (
            <div key={printer.id} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-100">{printer.name}</p>
                <p className="text-sm text-slate-400">{printer.moonrakerUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(printer.id)}
                className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
