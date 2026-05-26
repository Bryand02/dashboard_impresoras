class PrinterDiscoveryService {
  discover() {
    return {
      source: "mock",
      printersFound: 4,
      message: "Descubrimiento simulado. Aqui ira autodiscovery de Moonraker o inventario central."
    };
  }
}

export const printerDiscoveryService = new PrinterDiscoveryService();
