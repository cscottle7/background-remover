import * as universal from '../entries/pages/refine/_page.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/refine/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/refine/+page.ts";
export const imports = ["_app/immutable/nodes/3.ef5e1bd3.js","_app/immutable/chunks/index.8f2ca6db.js","_app/immutable/chunks/control.c2cf8273.js","_app/immutable/chunks/scheduler.f95f0c95.js","_app/immutable/chunks/index.a7b2bf40.js","_app/immutable/chunks/stores.8ea5e46b.js","_app/immutable/chunks/singletons.74f99aa4.js","_app/immutable/chunks/index.711ff95f.js","_app/immutable/chunks/navigation.8acfbf1a.js"];
export const stylesheets = [];
export const fonts = [];
