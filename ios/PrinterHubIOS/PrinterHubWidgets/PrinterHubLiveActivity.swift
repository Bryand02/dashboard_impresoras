import SwiftUI
import WidgetKit
import ActivityKit

@available(iOS 17.0, *)
struct PrinterHubLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PrinterActivityAttributes.self) { context in
            VStack(alignment: .leading, spacing: 8) {
                Text(context.attributes.printerName)
                    .font(.headline)
                Text(context.state.currentFile)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                ProgressView(value: context.state.progress)
                Text("\(Int(context.state.progress * 100))% • \(context.state.remainingMinutes)m")
                    .font(.caption2)
            }
            .padding()
            .activityBackgroundTint(Color.black)
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.attributes.printerName)
                        .font(.caption)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.remainingMinutes)m")
                        .font(.caption)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ProgressView(value: context.state.progress)
                }
            } compactLeading: {
                Text("3D")
            } compactTrailing: {
                Text("\(Int(context.state.progress * 100))%")
            } minimal: {
                Text("3D")
            }
        }
    }
}
