import fs from "fs";

const MENU_VISITS_PATH = "/home/sasquatch/docker/menu/visits.json";

// Misma lista de redes de confianza que usa menu.platia.com.co, para que el
// rol de "superusuario" se resuelva igual en ambos sitios. Se configura por
// variable de entorno (TRUSTED_IP_PREFIXES, separados por coma) para no
// publicar direcciones IP privadas en el repositorio.
const TRUSTED_CIDRS = (process.env.TRUSTED_IP_PREFIXES || "")
  .split(",")
  .map((prefix) => prefix.trim())
  .filter(Boolean);

function isTrustedIp(ip) {
  return TRUSTED_CIDRS.some((prefix) => ip.startsWith(prefix));
}

export function realIp(req) {
  // Cf-Connecting-Ip lo garantiza Cloudflare en su borde (el cliente no lo
  // puede falsificar); X-Forwarded-For si se puede falsificar, asi que solo
  // se usa como respaldo para acceso directo por LAN (sin pasar por Cloudflare).
  const cfip = req.headers["cf-connecting-ip"];
  if (cfip) return String(cfip).split(",")[0].trim();
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return req.socket.remoteAddress || "";
}

function readMenuRole(ip) {
  try {
    const raw = fs.readFileSync(MENU_VISITS_PATH, "utf8");
    const data = JSON.parse(raw);
    const entry = data.knownIps && data.knownIps[ip];
    return entry ? entry.role || "guest" : "guest";
  } catch {
    return "guest";
  }
}

export function currentRole(req) {
  const ip = realIp(req);
  if (isTrustedIp(ip)) return "superuser";
  return readMenuRole(ip);
}

export function isSuperuser(req) {
  return currentRole(req) === "superuser";
}
