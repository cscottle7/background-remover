import { c as create_ssr_component, a as subscribe } from "../../../chunks/ssr.js";
import { p as page } from "../../../chunks/stores.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_page();
  return `  ${$$result.head += `<!-- HEAD_svelte-1li57c7_START -->${$$result.title = `<title>Redirecting... - CharacterCut</title>`, ""}<meta name="description" content="Redirecting to image refinement tools"><!-- HEAD_svelte-1li57c7_END -->`, ""}  <div class="flex items-center justify-center min-h-screen" data-svelte-h="svelte-10yq3ij"><div class="text-center"><div class="w-8 h-8 mx-auto mb-4 border-2 border-magic-400/20 border-t-magic-400 rounded-full animate-spin"></div> <p class="text-dark-text-secondary">Redirecting to image refinement...</p></div></div>`;
});
export {
  Page as default
};
