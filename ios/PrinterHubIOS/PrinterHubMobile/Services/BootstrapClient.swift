import Foundation

actor BootstrapClient {
    func fetchPrinters(serverURL: URL) async throws -> [PrinterStatus] {
        let bootstrapURL = serverURL.appendingPathComponent("api/system/bootstrap")
        let (data, _) = try await URLSession.shared.data(from: bootstrapURL)
        let response = try JSONDecoder().decode(BootstrapResponse.self, from: data)
        return response.printers
    }
}
