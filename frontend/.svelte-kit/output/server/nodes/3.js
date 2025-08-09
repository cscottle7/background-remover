import * as universal from '../entries/pages/refine/_page.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/refine/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/refine/+page.ts";
export const imports = ["_app/immutable/nodes/3.67524b28.js","_app/immutable/chunks/index.8f2ca6db.js","_app/immutable/chunks/control.c2cf8273.js","_app/immutable/chunks/scheduler.f95f0c95.js","_app/immutable/chunks/index.a7b2bf40.js","_app/immutable/chunks/stores.9a472d22.js","_app/immutable/chunks/singletons.0cfefb10.js","_app/immutable/chunks/index.711ff95f.js","_app/immutable/chunks/navigation.b60605a7.js"];
export const stylesheets = [];
export const fonts = [];
