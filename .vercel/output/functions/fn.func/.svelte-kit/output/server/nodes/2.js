

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.82c7cadb.js","_app/immutable/chunks/scheduler.f95f0c95.js","_app/immutable/chunks/index.a7b2bf40.js","_app/immutable/chunks/index.711ff95f.js","_app/immutable/chunks/globals.7f7f1b26.js","_app/immutable/chunks/each.e59479a4.js","_app/immutable/chunks/appState.be2a1895.js"];
export const stylesheets = ["_app/immutable/assets/2.13752b1d.css"];
export const fonts = [];
