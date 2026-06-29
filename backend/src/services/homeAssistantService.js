import { env } from "../config/env.js";
import { printerConfigService } from "./printerConfigService.js";

const DEFAULT_TIMEOUT_MS = 8000;

class HomeAssistantService {
  normalizeSelectValue(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[_\s-]+/g, "");
  }

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

  async getSelectOptions(entityIds = []) {
    const candidates = (Array.isArray(entityIds) ? entityIds : [entityIds])
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    if (!candidates.length) {
      throw new Error("entity_id is required");
    }

    if (!this.isConfigured()) {
      return [];
    }

    const collected = [];
    const seen = new Set();

    for (const entityId of candidates) {
      try {
        const entity = await this.getEntityState(entityId);
        const options = entity?.attributes?.options;
        if (Array.isArray(options)) {
          options.forEach((option) => {
            const cleanedOption = String(option || "").trim();
            const normalizedOption = this.normalizeSelectValue(cleanedOption);
            if (!cleanedOption || seen.has(normalizedOption)) return;
            seen.add(normalizedOption);
            collected.push(cleanedOption);
          });
        }
      } catch {
        // Try the next candidate entity.
      }
    }

    return collected;
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

  async selectOption(entityIds, option) {
    const candidates = (Array.isArray(entityIds) ? entityIds : [entityIds])
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    if (!candidates.length || !option) {
      throw new Error("entity_id and option are required");
    }

    if (!this.isConfigured()) {
      return {
        message: `Simulacion preset: ${option} -> ${candidates[0]}`
      };
    }

    const normalizedTarget = this.normalizeSelectValue(option);
    const rankedCandidates = [];

    for (const entityId of candidates) {
      try {
        const entity = await this.getEntityState(entityId);
        const options = Array.isArray(entity?.attributes?.options) ? entity.attributes.options : [];
        const hasExact = options.includes(option);
        const hasNormalized = options.some((item) => this.normalizeSelectValue(item) === normalizedTarget);
        rankedCandidates.push({
          entityId,
          score: hasExact ? 2 : hasNormalized ? 1 : 0,
          options
        });
      } catch {
        rankedCandidates.push({
          entityId,
          score: 0,
          options: []
        });
      }
    }

    rankedCandidates.sort((left, right) => right.score - left.score);

    let lastError = null;

    for (const candidate of rankedCandidates) {
      try {
        const resolvedOption =
          candidate.options.find((item) => this.normalizeSelectValue(item) === normalizedTarget) || option;
        await this.request("/api/services/select/select_option", {
          method: "POST",
          body: JSON.stringify({
            entity_id: candidate.entityId,
            option: resolvedOption
          })
        });

        return {
          message: `Home Assistant preset: ${resolvedOption} -> ${candidate.entityId}`
        };
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new Error("No available entity accepted the requested preset option.");
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
