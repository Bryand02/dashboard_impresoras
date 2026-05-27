import WidgetKit
import SwiftUI

struct PrinterEntry: TimelineEntry {
    let date: Date
    let printer: PrinterStatus?
}

struct PrinterProvider: TimelineProvider {
    func placeholder(in context: Context) -> PrinterEntry {
        PrinterEntry(
            date: .now,
            printer: PrinterStatus(
                id: "sample",
                name: "SUNLU",
                state: "printing",
                powerState: "on",
                activeMaterial: "PLA",
                telemetry: PrinterTelemetry(progress: 62, remainingMinutes: 54, estimatedMinutes: 140, currentFile: "sample.gcode")
            )
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (PrinterEntry) -> Void) {
        completion(currentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PrinterEntry>) -> Void) {
        let entry = currentEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 5, to: .now) ?? .now.addingTimeInterval(300)
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func currentEntry() -> PrinterEntry {
        let payload = SharedStatusStore.load()
        let activePrinter = payload?.printers.first(where: { $0.state == "printing" }) ?? payload?.printers.first
        return PrinterEntry(date: .now, printer: activePrinter)
    }
}

struct PrinterHubStatusWidgetEntryView: View {
    var entry: PrinterProvider.Entry

    var body: some View {
        if let printer = entry.printer {
            VStack(alignment: .leading, spacing: 8) {
                Text(printer.name)
                    .font(.headline)
                Text(printer.state.uppercased())
                    .font(.caption)
                    .foregroundStyle(.secondary)
                ProgressView(value: max(0, min(1, printer.telemetry.progress / 100)))
                Text("Falta \(printer.telemetry.remainingMinutes)m")
                    .font(.caption2)
                Text(printer.telemetry.currentFile)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .padding()
        } else {
            Text("Sin datos")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

struct PrinterHubLockScreenView: View {
    var entry: PrinterProvider.Entry

    var body: some View {
        if let printer = entry.printer {
            VStack(alignment: .leading, spacing: 4) {
                Text(printer.name)
                    .font(.caption)
                ProgressView(value: max(0, min(1, printer.telemetry.progress / 100)))
                Text("\(Int(printer.telemetry.progress))% • \(printer.telemetry.remainingMinutes)m")
                    .font(.caption2)
            }
        } else {
            Text("Sin señal")
                .font(.caption)
        }
    }
}

struct PrinterHubStatusWidget: Widget {
    let kind: String = "PrinterHubStatusWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrinterProvider()) { entry in
            PrinterHubStatusWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Printer Hub")
        .description("Estado y progreso de la impresora activa.")
        .supportedFamilies([.systemMedium, .accessoryRectangular])
    }
}
