const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") return `${window.location.origin}/api`;
  return "http://localhost:8099/api";
};

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }
  return "ws://localhost:8099/ws";
};

const API_URL = getApiUrl();
const WS_URL = getWsUrl();

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  const normalized = String(text || "").trim();
  if (!response.ok) {
    if (normalized.startsWith("<!DOCTYPE") || normalized.startsWith("<html")) {
      throw new Error("El servidor devolvio una pagina de error HTML. Revisa el proxy o el servicio de streaming.");
    }
    throw new Error(text || "La respuesta del servidor no fue valida.");
  }
  throw new Error("El backend no devolvio JSON. Verifica que la API este actualizada.");
};

export const fetchBootstrap = async () => {
  const response = await fetch(`${API_URL}/system/bootstrap`, {
    cache: "no-store"
  });
  if (!response.ok) throw new Error("No fue posible cargar bootstrap");
  return response.json();
};

export const fetchNotificationConfig = async () => {
  const response = await fetch(`${API_URL}/notifications/config`);
  if (!response.ok) throw new Error("No fue posible cargar configuracion de notificaciones");
  return response.json();
};

export const fetchNotificationStatus = async () => {
  const response = await fetch(`${API_URL}/notifications/status`);
  if (!response.ok) throw new Error("No fue posible consultar el estado de notificaciones");
  return response.json();
};

export const subscribeNotifications = async (payload) => {
  const response = await fetch(`${API_URL}/notifications/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const unsubscribeNotifications = async (endpoint) => {
  const response = await fetch(`${API_URL}/notifications/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint })
  });
  return response.json();
};

export const updateNotificationPreferences = async (endpoint, preferences) => {
  const response = await fetch(`${API_URL}/notifications/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, preferences })
  });
  return response.json();
};

export const sendTestNotification = async () => {
  const response = await fetch(`${API_URL}/notifications/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  return response.json();
};

export const updatePrinterPower = async (printerId, action) => {
  const response = await fetch(`${API_URL}/printers/${printerId}/power`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action })
  });
  return response.json();
};

export const restartPrinterService = async (printerId, target) => {
  const response = await fetch(`${API_URL}/printers/${printerId}/restart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target })
  });
  return response.json();
};

export const createPrinter = async (payload) => {
  const response = await fetch(`${API_URL}/printers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const updatePrinter = async (printerId, payload) => {
  const response = await fetch(`${API_URL}/printers/${printerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const togglePrinterLight = async (printerId) => {
  const response = await fetch(`${API_URL}/printers/${printerId}/light`, {
    method: "POST"
  });
  return response.json();
};

export const markPrinterReady = async (printerId) => {
  const response = await fetch(`${API_URL}/printers/${printerId}/ready`, {
    method: "POST"
  });
  return response.json();
};

export const deletePrinter = async (printerId) => {
  const response = await fetch(`${API_URL}/printers/${printerId}`, {
    method: "DELETE"
  });
  return response.json();
};

export const createLibraryFile = async (payload) => {
  const response = await fetch(`${API_URL}/library`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const importLibraryFile = async (payload) => {
  if (payload instanceof FormData) {
    const response = await fetch(`${API_URL}/files/local`, {
      method: "POST",
      body: payload
    });
    return response.json();
  }
  const response = await fetch(`${API_URL}/library/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const createLibraryFolder = async (name, parent = "") => {
  const response = await fetch(`${API_URL}/library/folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parent })
  });
  return response.json();
};

export const deleteLibraryFolder = async (name) => {
  const response = await fetch(`${API_URL}/library/folders`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  return response.json();
};

export const updateLibraryFile = async (fileId, payload) => {
  const response = await fetch(`${API_URL}/library/${fileId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const moveLibraryFile = async (fileId, folder) => {
  const response = await fetch(`${API_URL}/library/${fileId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder })
  });
  return response.json();
};

export const getLibraryDownloadUrl = (fileId) => `${API_URL}/library/${fileId}/download`;

export const deleteLibraryFile = async (fileId) => {
  const response = await fetch(`${API_URL}/library/${fileId}`, {
    method: "DELETE"
  });
  return response.json();
};

export const autoAssignFile = async (fileId) => {
  const response = await fetch(`${API_URL}/queue/auto-assign/${fileId}`, {
    method: "POST"
  });
  return response.json();
};

export const fetchAssignmentPreview = async (fileId) => {
  const response = await fetch(`${API_URL}/queue/assignment-preview/${fileId}`);
  return response.json();
};

export const dispatchLibraryFile = async (fileId, payload) => {
  const response = await fetch(`${API_URL}/queue/dispatch/${fileId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const updateQueueItem = async (queueId, payload) => {
  const response = await fetch(`${API_URL}/queue/${queueId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return response.json();
};

export const deleteQueueItem = async (queueId) => {
  const response = await fetch(`${API_URL}/queue/${queueId}`, {
    method: "DELETE"
  });
  return response.json();
};

export const createSocket = (onMessage) => {
  const socket = new WebSocket(WS_URL);
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  });
  return socket;
};

export const createShareLink = async (payload) => {
  const response = await fetch(`${API_URL}/share-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(data.message || "No fue posible crear el enlace temporal.");
  }
  return data;
};

export const revokeShareLink = async (token) => {
  const response = await fetch(`${API_URL}/share-links/${token}/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(data.message || "No fue posible revocar el enlace.");
  }
  return data;
};

export const moveStreamingPreset = async (entityId, option, entityIds = []) => {
  const response = await fetch(`${API_URL}/streaming/preset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityId, option, entityIds })
  });
  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(data.message || "No fue posible mover la camara.");
  }
  return data;
};

export const fetchStreamingPresets = async (entityId, entityIds = []) => {
  const params = new URLSearchParams();
  params.set("entityId", entityId);
  entityIds.forEach((candidate) => {
    if (candidate && candidate !== entityId) params.append("entityIds", candidate);
  });
  const response = await fetch(`${API_URL}/streaming/presets?${params.toString()}`);
  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(data.message || "No fue posible leer los presets.");
  }
  return data;
};
