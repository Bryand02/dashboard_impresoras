class HomeAssistantService {
  async sendPowerCommand(printer, action) {
    return {
      message: `Simulacion Home Assistant: ${action} -> ${printer.homeAssistantEntity}`
    };
  }

  async sendLightCommand(printer, action) {
    return {
      message: `Simulacion luz: ${action} -> ${printer.lightEntity || `light.${printer.id}`}`
    };
  }

  // Integracion real:
  // 1. Llamar /api/services/switch/turn_on o turn_off.
  // 2. Mapear restart a secuencia off/on o script dedicado.
  // 3. Para luces usar /api/services/light/turn_on y turn_off.
}

export const homeAssistantService = new HomeAssistantService();
