import SwiftUI

@main
struct PrinterHubMobileApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            NavigationStack {
                ContentView()
                    .environmentObject(model)
            }
        }
    }
}
