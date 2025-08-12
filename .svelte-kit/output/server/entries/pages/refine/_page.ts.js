import { e as error } from "../../../chunks/index.js";
const load = async ({ url, params }) => {
  const sessionId = url.searchParams.get("session");
  const source = url.searchParams.get("source") || "direct-link";
  if (!sessionId) {
    throw error(400, {
      message: "No image session provided",
      details: "Please navigate to this page from the main application"
    });
  }
  return {
    sessionId,
    source,
    timestamp: Date.now()
  };
};
export {
  load
};
