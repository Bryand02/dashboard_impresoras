import Foundation
import WidgetKit

enum SharedStatusStore {
    static let appGroup = "group.com.platia.printerhub"
    static let key = "cached_printers"

    static func save(_ printers: [PrinterStatus]) {
        guard let defaults = UserDefaults(suiteName: appGroup) else { return }
        let payload = CachedWidgetPayload(updatedAt: Date(), printers: printers)
        guard let encoded = try? JSONEncoder().encode(payload) else { return }
        defaults.set(encoded, forKey: key)
        WidgetCenter.shared.reloadAllTimelines()
    }

    static func load() -> CachedWidgetPayload? {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let data = defaults.data(forKey: key),
            let decoded = try? JSONDecoder().decode(CachedWidgetPayload.self, from: data)
        else {
            return nil
        }
        return decoded
    }
}
