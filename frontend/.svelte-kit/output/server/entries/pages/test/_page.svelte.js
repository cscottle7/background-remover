import { c as create_ssr_component, e as escape } from "../../../chunks/ssr.js";
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: "h1.svelte-1gugxwj{color:#00ff88;font-size:2rem}p.svelte-1gugxwj{color:#ffffff;font-size:1rem}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  console.log("Test page loaded successfully");
  $$result.css.add(css);
  return `<h1 class="svelte-1gugxwj" data-svelte-h="svelte-1imantn">Test Page</h1> <p class="svelte-1gugxwj" data-svelte-h="svelte-irgg3e">If you can see this, the server is working.</p> <p class="svelte-1gugxwj">Current time: ${escape((/* @__PURE__ */ new Date()).toISOString())}</p>`;
});
export {
  Page as default
};
