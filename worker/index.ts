// @ts-nocheck
/** Cloudflare Worker entry point that delegates to vinext. */
import handler from "vinext/server/fetch-handler";

export default {
  fetch(request, env, ctx) {
    return handler.fetch(request, env, ctx);
  },
};
