

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.69a945a6.js","_app/immutable/chunks/scheduler.64c0ae6a.js","_app/immutable/chunks/index.5f42ba5d.js","_app/immutable/chunks/appState.a823ac89.js","_app/immutable/chunks/index.675a9ea6.js"];
export const stylesheets = ["_app/immutable/assets/2.0bd26f77.css"];
export const fonts = [];
