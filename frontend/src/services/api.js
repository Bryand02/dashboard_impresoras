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

export const fetchBootstrap = async () => {
  const response = await fetch(`${API_URL}/system/bootstrap`);
  if (!response.ok) throw new Error("No fue posible cargar bootstrap");
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
  const response = await fetch(`${API_URL}/library/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
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
