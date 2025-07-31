

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.89b4b372.js","_app/immutable/chunks/scheduler.64c0ae6a.js","_app/immutable/chunks/index.5f42ba5d.js","_app/immutable/chunks/singletons.67dcb63c.js","_app/immutable/chunks/index.675a9ea6.js"];
export const stylesheets = [];
export const fonts = [];
