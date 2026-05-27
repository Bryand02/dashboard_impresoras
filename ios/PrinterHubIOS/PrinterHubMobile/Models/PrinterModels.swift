import Foundation
import ActivityKit

struct BootstrapResponse: Decodable {
    let printers: [PrinterStatus]
}

struct PrinterStatus: Identifiable, Codable, Hashable, Decodable {
    let id: String
    let name: String
    let state: String
    let powerState: String
    let activeMaterial: String?
    let telemetry: PrinterTelemetry
}

struct PrinterTelemetry: Codable, Hashable, Decodable {
    let progress: Double
    let remainingMinutes: Int
    let estimatedMinutes: Int
    let currentFile: String
}

struct CachedWidgetPayload: Codable {
    let updatedAt: Date
    let printers: [PrinterStatus]
}

struct PrinterActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var state: String
        var progress: Double
        var remainingMinutes: Int
        var currentFile: String
    }

    var printerId: String
    var printerName: String
}
