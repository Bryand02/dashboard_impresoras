import { useEffect, useState } from "react";
import { PrinterMobileCard } from "../components/PrinterMobileCard";
import { PrinterRow } from "../components/PrinterRow";

export function DashboardSection({
  printers,
  onOpenConfig,
  onToggleLight,
  onPowerAction,
  onRestartService,
  onMarkReady,
  onOpenFloatingCamera
}) {
  const [selectedPrinterId, setSelectedPrinterId] = useState(null);

  useEffect(() => {
    if (!selectedPrinterId) return;
    if (!printers.some((printer) => printer.id === selectedPrinterId)) {
      setSelectedPrinterId(null);
    }
  }, [printers, selectedPrinterId]);

  return (
    <>
      <section className="grid gap-2 md:hidden">
        {printers.map((printer) => (
          <div key={printer.id} className="space-y-2">
            <PrinterMobileCard
              printer={{ ...printer, isExpanded: selectedPrinterId === printer.id }}
              onOpen={() => setSelectedPrinterId((current) => (current === printer.id ? null : printer.id))}
            />
            {selectedPrinterId === printer.id && (
              <PrinterRow
                printer={printer}
                onOpenConfig={() => onOpenConfig(printer)}
                onToggleLight={() => onToggleLight(printer)}
                onPowerAction={(action) => onPowerAction(printer, action)}
                onRestartService={(target) => onRestartService(printer, target)}
                onMarkReady={() => onMarkReady(printer)}
                onOpenFloatingCamera={() => onOpenFloatingCamera(printer)}
              />
            )}
          </div>
        ))}
      </section>

      <section className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-5">
        {printers.map((printer) => (
          <PrinterRow
            key={printer.id}
            printer={printer}
            onOpenConfig={() => onOpenConfig(printer)}
            onToggleLight={() => onToggleLight(printer)}
            onPowerAction={(action) => onPowerAction(printer, action)}
            onRestartService={(target) => onRestartService(printer, target)}
            onMarkReady={() => onMarkReady(printer)}
            onOpenFloatingCamera={() => onOpenFloatingCamera(printer)}
          />
        ))}
      </section>
    </>
  );
}
