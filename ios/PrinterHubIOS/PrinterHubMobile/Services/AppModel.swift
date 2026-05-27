import Foundation
import ActivityKit

@MainActor
final class AppModel: ObservableObject {
    @Published var serverURLString = UserDefaults.standard.string(forKey: "server_url") ?? "https://gestor3d.platia.com.co/"
    @Published var printers: [PrinterStatus] = []
    @Published var isLoading = false
    @Published var errorMessage = ""

    private let client = BootstrapClient()

    func saveServerURL() {
        UserDefaults.standard.set(serverURLString, forKey: "server_url")
    }

    func refresh() async {
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }

        guard let url = URL(string: serverURLString) else {
            errorMessage = "La URL del servidor no es valida."
            return
        }

        do {
            let loadedPrinters = try await client.fetchPrinters(serverURL: url)
            printers = loadedPrinters
            SharedStatusStore.save(loadedPrinters)
            await syncLiveActivities()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func startLiveActivity(for printer: PrinterStatus) async {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let attributes = PrinterActivityAttributes(printerId: printer.id, printerName: printer.name)
        let state = PrinterActivityAttributes.ContentState(
            state: printer.state,
            progress: max(0, min(1, printer.telemetry.progress / 100)),
            remainingMinutes: printer.telemetry.remainingMinutes,
            currentFile: printer.telemetry.currentFile
        )

        do {
            _ = try Activity.request(attributes: attributes, content: .init(state: state, staleDate: nil))
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func endLiveActivities() async {
        for activity in Activity<PrinterActivityAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }

    private func syncLiveActivities() async {
        let activities = Activity<PrinterActivityAttributes>.activities
        for activity in activities {
            guard let printer = printers.first(where: { $0.id == activity.attributes.printerId }) else { continue }
            let state = PrinterActivityAttributes.ContentState(
                state: printer.state,
                progress: max(0, min(1, printer.telemetry.progress / 100)),
                remainingMinutes: printer.telemetry.remainingMinutes,
                currentFile: printer.telemetry.currentFile
            )
            await activity.update(.init(state: state, staleDate: nil))
        }
    }
}
