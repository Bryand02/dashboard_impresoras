import { env } from "../config/env.js";
import { printerConfigService } from "./printerConfigService.js";

const DEFAULT_TIMEOUT_MS = 8000;

class HomeAssistantService {
  isConfigured() {
    return Boolean(env.homeAssistantUrl && env.homeAssistantToken);
  }

  normalizeBaseUrl(url) {
    return url.replace(/\/+$/, "");
  }

  async request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(`${this.normalizeBaseUrl(env.homeAssistantUrl)}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${env.homeAssistantToken}`,
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });
      if (!response.ok) {
        throw new Error(`Home Assistant request failed with ${response.status}`);
      }
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return response.json();
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getEntityState(entityId) {
    if (!this.isConfigured() || !entityId) return null;
    return this.request(`/api/states/${entityId}`);
  }

  async sendPowerCommand(printer, action) {
    if (!this.isConfigured()) {
      return {
        message: `Simulacion Home Assistant: ${action} -> ${printer.homeAssistantEntity}`
      };
    }

    await this.request(`/api/services/switch/${action === "on" ? "turn_on" : "turn_off"}`, {
      method: "POST",
      body: JSON.stringify({
        entity_id: printer.homeAssistantEntity
      })
    });

    return {
      message: `Home Assistant: ${action} -> ${printer.homeAssistantEntity}`
    };
  }

  async sendLightCommand(printer, action) {
    const entityId = printer.lightEntity || `light.${printer.id}`;
    if (!this.isConfigured()) {
      return {
        message: `Simulacion luz: ${action} -> ${entityId}`
      };
    }

    await this.request(`/api/services/light/${action}`, {
      method: "POST",
      body: JSON.stringify({
        entity_id: entityId
      })
    });

    return {
      message: `Home Assistant luz: ${action} -> ${entityId}`
    };
  }

  async selectOption(entityId, option) {
    if (!entityId || !option) {
      throw new Error("entity_id and option are required");
    }

    if (!this.isConfigured()) {
      return {
        message: `Simulacion preset: ${option} -> ${entityId}`
      };
    }

    await this.request("/api/services/select/select_option", {
      method: "POST",
      body: JSON.stringify({
        entity_id: entityId,
        option
      })
    });

    return {
      message: `Home Assistant preset: ${option} -> ${entityId}`
    };
  }

  async syncPrintersPowerStates() {
    const printers = printerConfigService.list().filter((printer) => printer.powerEnabled && printer.homeAssistantEntity);
    if (!this.isConfigured()) return;

    await Promise.all(
      printers.map(async (printer) => {
        try {
          const entity = await this.getEntityState(printer.homeAssistantEntity);
          const powerState = entity?.state === "on" ? "on" : "off";
          printerConfigService.syncPowerState(printer.id, powerState);
        } catch {
          // Keep the last known state if Home Assistant is temporarily unavailable.
        }
      })
    );
  }
}

export const homeAssistantService = new HomeAssistantService();
