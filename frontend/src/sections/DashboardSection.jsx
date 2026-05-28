import { useEffect, useMemo, useState } from "react";
import { PrinterDetailModal } from "../components/PrinterDetailModal";
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

  const selectedPrinter = useMemo(
    () => printers.find((printer) => printer.id === selectedPrinterId) || null,
    [printers, selectedPrinterId]
  );

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
          <PrinterMobileCard
            key={printer.id}
            printer={printer}
            onOpen={() => setSelectedPrinterId(printer.id)}
          />
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

      <PrinterDetailModal
        printer={selectedPrinter}
        onClose={() => setSelectedPrinterId(null)}
        onOpenConfig={() => selectedPrinter && onOpenConfig(selectedPrinter)}
        onToggleLight={() => selectedPrinter && onToggleLight(selectedPrinter)}
        onPowerAction={(action) => selectedPrinter && onPowerAction(selectedPrinter, action)}
        onRestartService={(target) => selectedPrinter && onRestartService(selectedPrinter, target)}
        onMarkReady={() => selectedPrinter && onMarkReady(selectedPrinter)}
        onOpenFloatingCamera={() => selectedPrinter && onOpenFloatingCamera(selectedPrinter)}
      />
    </>
  );
}
