

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/test/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.d8700fe5.js","_app/immutable/chunks/scheduler.64c0ae6a.js","_app/immutable/chunks/index.5f42ba5d.js"];
export const stylesheets = ["_app/immutable/assets/3.9653ff6a.css"];
export const fonts = [];
