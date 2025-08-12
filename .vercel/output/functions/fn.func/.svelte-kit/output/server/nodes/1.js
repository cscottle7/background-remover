

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.782da166.js","_app/immutable/chunks/scheduler.f95f0c95.js","_app/immutable/chunks/index.a7b2bf40.js","_app/immutable/chunks/stores.bcc05b25.js","_app/immutable/chunks/singletons.1a838f73.js","_app/immutable/chunks/index.711ff95f.js"];
export const stylesheets = [];
export const fonts = [];
