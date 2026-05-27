import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        List {
            Section("Servidor") {
                TextField("https://gestor3d.platia.com.co/", text: $model.serverURLString)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.URL)
                    .autocorrectionDisabled()
                Button("Guardar URL") {
                    model.saveServerURL()
                }
                Button(model.isLoading ? "Actualizando..." : "Actualizar estado") {
                    Task { await model.refresh() }
                }
                .disabled(model.isLoading)
                if !model.errorMessage.isEmpty {
                    Text(model.errorMessage)
                        .foregroundStyle(.red)
                        .font(.footnote)
                }
            }

            Section("Impresoras") {
                ForEach(model.printers) { printer in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(printer.name)
                                .font(.headline)
                            Spacer()
                            Text(printer.state.uppercased())
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        ProgressView(value: max(0, min(1, printer.telemetry.progress / 100)))
                        Text(printer.telemetry.currentFile)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("Falta aprox: \(printer.telemetry.remainingMinutes)m")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        HStack {
                            Button("Live Activity") {
                                Task { await model.startLiveActivity(for: printer) }
                            }
                            .buttonStyle(.borderedProminent)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }

            Section("Live Activities") {
                Button("Cerrar todas") {
                    Task { await model.endLiveActivities() }
                }
            }
        }
        .navigationTitle("Printer Hub")
        .task {
            if model.printers.isEmpty {
                await model.refresh()
            }
        }
    }
}
