import { PrinterRow } from "../components/PrinterRow";

export function DashboardSection({ printers, onOpenConfig, onToggleLight, onPowerAction, onMarkReady, onOpenFloatingCamera }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {printers.map((printer) => (
        <PrinterRow
          key={printer.id}
          printer={printer}
          onOpenConfig={() => onOpenConfig(printer)}
          onToggleLight={() => onToggleLight(printer)}
          onPowerAction={(action) => onPowerAction(printer, action)}
          onMarkReady={() => onMarkReady(printer)}
          onOpenFloatingCamera={() => onOpenFloatingCamera(printer)}
        />
      ))}
    </section>
  );
}
