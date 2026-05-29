export const isWebUrl = (url = "") => /^https?:\/\//i.test(url);

export const getGo2RtcSource = (cameraUrl) => {
  try {
    const parsed = new URL(cameraUrl);
    const src = parsed.searchParams.get("src");
    if (!src) return null;
    return {
      webRtcUrl: `${parsed.origin}/webrtc.html?src=${encodeURIComponent(src)}&media=video`
    };
  } catch {
    return null;
  }
};
