

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/test-refine/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/6.1fbb5d7f.js","_app/immutable/chunks/scheduler.f95f0c95.js","_app/immutable/chunks/index.a7b2bf40.js","_app/immutable/chunks/globals.7f7f1b26.js","_app/immutable/chunks/navigation.9fa37e41.js","_app/immutable/chunks/singletons.1a838f73.js","_app/immutable/chunks/index.711ff95f.js","_app/immutable/chunks/RefineToolbox.bd88cd4f.js","_app/immutable/chunks/each.e59479a4.js"];
export const stylesheets = ["_app/immutable/assets/6.b4115635.css","_app/immutable/assets/RefineToolbox.b693a743.css"];
export const fonts = [];
