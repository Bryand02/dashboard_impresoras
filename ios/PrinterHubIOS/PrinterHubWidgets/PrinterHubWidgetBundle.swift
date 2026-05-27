import WidgetKit
import SwiftUI

@main
struct PrinterHubWidgetBundle: WidgetBundle {
    var body: some Widget {
        PrinterHubStatusWidget()
        if #available(iOS 17.0, *) {
            PrinterHubLiveActivityWidget()
        }
    }
}
