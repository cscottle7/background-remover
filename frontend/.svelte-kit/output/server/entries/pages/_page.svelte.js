import { n as noop, c as create_ssr_component, b as compute_rest_props, d as createEventDispatcher, o as onDestroy, f as spread, e as escape, g as escape_attribute_value, h as escape_object, i as add_attribute, v as validate_component, j as assign, k as identity, a as subscribe, l as each } from "../../chunks/ssr.js";
import { fromEvent } from "file-selector";
import { w as writable, d as derived } from "../../chunks/index2.js";
import { a as appState } from "../../chunks/appState.js";
const is_client = typeof window !== "undefined";
let now = is_client ? () => window.performance.now() : () => Date.now();
let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
const tasks = /* @__PURE__ */ new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
const Dropzone_svelte_svelte_type_style_lang = "";
const css$6 = {
  code: ".dropzone.svelte-817dg2{flex:1;display:flex;flex-direction:column;align-items:center;padding:20px;border-width:2px;border-radius:2px;border-color:#eeeeee;border-style:dashed;background-color:#fafafa;color:#bdbdbd;outline:none;transition:border 0.24s ease-in-out}.dropzone.svelte-817dg2:focus{border-color:#2196f3}",
  map: null
};
const Dropzone = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let defaultPlaceholderString;
  let $$restProps = compute_rest_props($$props, [
    "accept",
    "disabled",
    "getFilesFromEvent",
    "maxSize",
    "minSize",
    "multiple",
    "preventDropOnDocument",
    "noClick",
    "noKeyboard",
    "noDrag",
    "noDragEventsBubbling",
    "containerClasses",
    "containerStyles",
    "disableDefaultStyles",
    "name",
    "inputElement",
    "required"
  ]);
  let { accept = void 0 } = $$props;
  let { disabled = false } = $$props;
  let { getFilesFromEvent = fromEvent } = $$props;
  let { maxSize = Infinity } = $$props;
  let { minSize = 0 } = $$props;
  let { multiple = true } = $$props;
  let { preventDropOnDocument = true } = $$props;
  let { noClick = false } = $$props;
  let { noKeyboard = false } = $$props;
  let { noDrag = false } = $$props;
  let { noDragEventsBubbling = false } = $$props;
  let { containerClasses = "" } = $$props;
  let { containerStyles = "" } = $$props;
  let { disableDefaultStyles = false } = $$props;
  let { name = "" } = $$props;
  let { inputElement = void 0 } = $$props;
  let { required = false } = $$props;
  createEventDispatcher();
  let rootRef;
  onDestroy(() => {
    inputElement = null;
  });
  if ($$props.accept === void 0 && $$bindings.accept && accept !== void 0)
    $$bindings.accept(accept);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  if ($$props.getFilesFromEvent === void 0 && $$bindings.getFilesFromEvent && getFilesFromEvent !== void 0)
    $$bindings.getFilesFromEvent(getFilesFromEvent);
  if ($$props.maxSize === void 0 && $$bindings.maxSize && maxSize !== void 0)
    $$bindings.maxSize(maxSize);
  if ($$props.minSize === void 0 && $$bindings.minSize && minSize !== void 0)
    $$bindings.minSize(minSize);
  if ($$props.multiple === void 0 && $$bindings.multiple && multiple !== void 0)
    $$bindings.multiple(multiple);
  if ($$props.preventDropOnDocument === void 0 && $$bindings.preventDropOnDocument && preventDropOnDocument !== void 0)
    $$bindings.preventDropOnDocument(preventDropOnDocument);
  if ($$props.noClick === void 0 && $$bindings.noClick && noClick !== void 0)
    $$bindings.noClick(noClick);
  if ($$props.noKeyboard === void 0 && $$bindings.noKeyboard && noKeyboard !== void 0)
    $$bindings.noKeyboard(noKeyboard);
  if ($$props.noDrag === void 0 && $$bindings.noDrag && noDrag !== void 0)
    $$bindings.noDrag(noDrag);
  if ($$props.noDragEventsBubbling === void 0 && $$bindings.noDragEventsBubbling && noDragEventsBubbling !== void 0)
    $$bindings.noDragEventsBubbling(noDragEventsBubbling);
  if ($$props.containerClasses === void 0 && $$bindings.containerClasses && containerClasses !== void 0)
    $$bindings.containerClasses(containerClasses);
  if ($$props.containerStyles === void 0 && $$bindings.containerStyles && containerStyles !== void 0)
    $$bindings.containerStyles(containerStyles);
  if ($$props.disableDefaultStyles === void 0 && $$bindings.disableDefaultStyles && disableDefaultStyles !== void 0)
    $$bindings.disableDefaultStyles(disableDefaultStyles);
  if ($$props.name === void 0 && $$bindings.name && name !== void 0)
    $$bindings.name(name);
  if ($$props.inputElement === void 0 && $$bindings.inputElement && inputElement !== void 0)
    $$bindings.inputElement(inputElement);
  if ($$props.required === void 0 && $$bindings.required && required !== void 0)
    $$bindings.required(required);
  $$result.css.add(css$6);
  defaultPlaceholderString = multiple ? "Drag 'n' drop some files here, or click to select files" : "Drag 'n' drop a file here, or click to select a file";
  return ` <div${spread(
    [
      { tabindex: "0" },
      { role: "button" },
      {
        class: escape(disableDefaultStyles ? "" : "dropzone", true) + " " + escape(containerClasses, true)
      },
      {
        style: escape_attribute_value(containerStyles)
      },
      escape_object($$restProps)
    ],
    { classes: "svelte-817dg2" }
  )}${add_attribute("this", rootRef, 0)}><input${add_attribute("accept", accept?.toString(), 0)} ${multiple ? "multiple" : ""} ${required ? "required" : ""} type="file"${add_attribute("name", name, 0)} autocomplete="off" tabindex="-1" style="display: none;"> ${slots.default ? slots.default({}) : ` <p>${escape(defaultPlaceholderString)}</p> `} </div>`;
});
const UnifiedInput_svelte_svelte_type_style_lang = "";
const css$5 = {
  code: ".unified-input-container.svelte-1yokvc6{width:100%;max-width:600px;margin:0 auto}.dropzone.svelte-1yokvc6{position:relative;min-height:400px;border-radius:0.75rem;border:2px dashed rgba(156, 163, 175, 0.5);background-color:rgba(26, 26, 26, 0.8);transition:all 300ms ease-in-out;display:flex;align-items:center;justify-content:center;padding:2rem}.dropzone.svelte-1yokvc6:hover{background-color:rgba(38, 38, 38, 0.9);border-color:rgba(156, 163, 175, 0.7)}.dropzone-active.svelte-1yokvc6{border-color:rgba(0, 255, 136, 0.8);background-color:rgba(0, 255, 136, 0.05);box-shadow:0 25px 50px -12px rgba(0, 255, 136, 0.2);transform:scale(1.02);border-style:solid}.character-guide.svelte-1yokvc6{background-image:radial-gradient(circle at center, rgba(0, 255, 136, 0.1) 0%, transparent 70%);background-size:200px 200px;background-position:center;background-repeat:no-repeat}",
  map: null
};
const UnifiedInput = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { disabled = false } = $$props;
  let { showPasteHint = true } = $$props;
  createEventDispatcher();
  onDestroy(() => {
  });
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  if ($$props.showPasteHint === void 0 && $$bindings.showPasteHint && showPasteHint !== void 0)
    $$bindings.showPasteHint(showPasteHint);
  $$result.css.add(css$5);
  return `  <div class="unified-input-container svelte-1yokvc6"> <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/tiff" class="hidden" ${disabled ? "disabled" : ""}>  ${validate_component(Dropzone, "Dropzone").$$render(
    $$result,
    {
      accept: "image/*",
      multiple: false,
      disableDefaultStyles: true,
      containerClasses: "dropzone-container",
      disabled,
      noClick: true
    },
    {},
    {
      default: () => {
        return `<div class="${[
          "dropzone " + escape("", true) + " " + escape(
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            true
          ) + " svelte-1yokvc6",
          ""
        ].join(" ").trim()}"> <div class="character-guide absolute inset-0 pointer-events-none opacity-20 svelte-1yokvc6"></div>  <div class="flex flex-col items-center justify-center space-y-6 relative z-10"> <div class="w-24 h-24 rounded-full bg-magic-400/10 flex items-center justify-center" data-svelte-h="svelte-zpjsso"><svg class="w-12 h-12 text-magic-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg></div>  <div class="text-center" data-svelte-h="svelte-1noa2ng"><h2 class="text-2xl font-semibold text-magic-gradient mb-2">Place Character Here</h2> <p class="text-dark-text-secondary text-lg">Watch backgrounds disappear like magic</p></div>  <div class="flex flex-col sm:flex-row gap-4 w-full max-w-md"> <button class="btn btn-magic flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200" ${disabled ? "disabled" : ""}><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            Choose Image</button>  ${``}</div>  <div class="text-center text-sm text-dark-text-muted space-y-1"><p>Drag &amp; drop, choose file${``}</p> <p class="opacity-75" data-svelte-h="svelte-oom6db">Supports JPEG, PNG, WebP • Max 10MB • Up to 4K resolution</p></div></div>  ${``}</div>`;
      }
    }
  )} </div>`;
});
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function quintOut(t) {
  return --t * t * t * t * t + 1;
}
function get_interpolator(a, b) {
  if (a === b || a !== a)
    return () => a;
  const type = typeof a;
  if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    throw new Error("Cannot interpolate values of different type");
  }
  if (Array.isArray(a)) {
    const arr = b.map((bi, i) => {
      return get_interpolator(a[i], bi);
    });
    return (t) => arr.map((fn) => fn(t));
  }
  if (type === "object") {
    if (!a || !b)
      throw new Error("Object cannot be null");
    if (is_date(a) && is_date(b)) {
      a = a.getTime();
      b = b.getTime();
      const delta = b - a;
      return (t) => new Date(a + t * delta);
    }
    const keys = Object.keys(b);
    const interpolators = {};
    keys.forEach((key) => {
      interpolators[key] = get_interpolator(a[key], b[key]);
    });
    return (t) => {
      const result = {};
      keys.forEach((key) => {
        result[key] = interpolators[key](t);
      });
      return result;
    };
  }
  if (type === "number") {
    const delta = b - a;
    return (t) => a + t * delta;
  }
  throw new Error(`Cannot interpolate ${type} values`);
}
function tweened(value, defaults = {}) {
  const store = writable(value);
  let task;
  let target_value = value;
  function set(new_value, opts) {
    if (value == null) {
      store.set(value = new_value);
      return Promise.resolve();
    }
    target_value = new_value;
    let previous_task = task;
    let started = false;
    let {
      delay = 0,
      duration = 400,
      easing = identity,
      interpolate = get_interpolator
    } = assign(assign({}, defaults), opts);
    if (duration === 0) {
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      store.set(value = target_value);
      return Promise.resolve();
    }
    const start = now() + delay;
    let fn;
    task = loop((now2) => {
      if (now2 < start)
        return true;
      if (!started) {
        fn = interpolate(value, new_value);
        if (typeof duration === "function")
          duration = duration(value, new_value);
        started = true;
      }
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      const elapsed = now2 - start;
      if (elapsed > /** @type {number} */
      duration) {
        store.set(value = new_value);
        return false;
      }
      store.set(value = fn(easing(elapsed / duration)));
      return true;
    });
    return task.promise;
  }
  return {
    set,
    update: (fn, opts) => set(fn(target_value, value), opts),
    subscribe: store.subscribe
  };
}
const ScanlineProcessor_svelte_svelte_type_style_lang = "";
const BeforeAfterPreview_svelte_svelte_type_style_lang = "";
const ProcessingFeedback_svelte_svelte_type_style_lang = "";
const ErrorDisplay_svelte_svelte_type_style_lang = "";
class AnalyticsService {
  isEnabled = true;
  sessionHash;
  sessionStartTime;
  sessionMetrics;
  constructor() {
    this.sessionHash = this.generateSessionHash();
    this.sessionStartTime = Date.now();
    this.sessionMetrics = {
      session_hash: this.sessionHash,
      start_time: this.sessionStartTime,
      images_processed: 0,
      total_processing_time: 0,
      successful_completions: 0,
      failed_attempts: 0,
      meets_continuity_target: false,
      session_duration: 0
    };
    this.initializeSession();
  }
  generateSessionHash() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const combined = `${timestamp}_${random}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `session_${Math.abs(hash).toString(36)}`;
  }
  async sendEvent(event) {
    if (!this.isEnabled)
      return;
    try {
      console.log("📊 Analytics Event:", event);
    } catch (error) {
      console.warn("Analytics event failed:", error);
    }
  }
  async initializeSession() {
    if (typeof window === "undefined")
      return;
    await this.trackEvent("session_start", {
      user_agent: navigator.userAgent.substring(0, 100),
      // Truncated for privacy
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      referrer: (typeof document !== "undefined" ? document.referrer : "") || "direct",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  async trackEvent(eventType, data) {
    const event = {
      event_type: eventType,
      session_hash: this.sessionHash,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      data: data || {}
    };
    await this.sendEvent(event);
  }
  // KPI Tracking Methods (Phase 5 requirements)
  /**
   * Track unique active users (KPI requirement: 250 users)
   */
  async trackUniqueUser(referrer) {
    await this.trackEvent("unique_session", {
      referrer: referrer || (typeof document !== "undefined" ? document.referrer : "") || "direct",
      is_return_user: this.isReturnUser()
    });
  }
  /**
   * Track image processing start
   */
  async trackProcessingStart(image, inputMethod) {
    this.sessionMetrics.images_processed++;
    await this.trackEvent("processing_start", {
      input_method: inputMethod,
      file_size: image.file.size,
      file_type: image.file.type,
      image_dimensions: image.dimensions
    });
  }
  /**
   * Track task completion rate (KPI requirement: 95%)
   */
  async trackTaskCompletion(success, processingTime, error) {
    this.sessionMetrics.total_processing_time += processingTime;
    if (success) {
      this.sessionMetrics.successful_completions++;
    } else {
      this.sessionMetrics.failed_attempts++;
    }
    await this.trackEvent("task_completion", {
      success,
      processing_time_seconds: processingTime,
      under_5_seconds: processingTime < 5,
      // Key performance metric
      error_type: error ? this.classifyError(error) : void 0
    });
  }
  /**
   * Track batch processing completion
   */
  async trackBatchCompletion(successfulCount, totalImages) {
    const success = successfulCount > 0;
    const completionRate = totalImages > 0 ? successfulCount / totalImages * 100 : 0;
    this.sessionMetrics.images_processed += totalImages;
    this.sessionMetrics.successful_completions += successfulCount;
    this.sessionMetrics.failed_attempts += totalImages - successfulCount;
    await this.trackEvent("batch_completion", {
      successful_count: successfulCount,
      total_images: totalImages,
      completion_rate: completionRate,
      success,
      batch_size: totalImages
    });
  }
  /**
   * Track session continuity (KPI requirement: 2+ images per session)
   */
  async trackSessionContinuity() {
    this.sessionMetrics.meets_continuity_target = this.sessionMetrics.images_processed >= 2;
    await this.trackEvent("session_continuity", {
      images_processed: this.sessionMetrics.images_processed,
      meets_target: this.sessionMetrics.meets_continuity_target,
      avg_processing_time: this.sessionMetrics.total_processing_time / Math.max(1, this.sessionMetrics.successful_completions)
    });
  }
  /**
   * Track download event
   */
  async trackDownload(format, fileSize) {
    await this.trackEvent("download", {
      format,
      file_size: fileSize,
      time_to_download: Date.now() - this.sessionStartTime
    });
  }
  /**
   * Track user choosing to process another image
   */
  async trackProcessAnother() {
    await this.trackEvent("process_another", {
      session_images_count: this.sessionMetrics.images_processed,
      session_duration: Date.now() - this.sessionStartTime
    });
  }
  /**
   * Track NPS survey response
   */
  async trackNPSResponse(score, feedback) {
    await this.trackEvent("nps_response", {
      score,
      has_feedback: !!feedback,
      feedback_length: feedback?.length || 0,
      session_images_processed: this.sessionMetrics.images_processed
    });
  }
  /**
   * Track qualitative feedback submission
   */
  async trackFeedbackSubmission(feedbackType, content) {
    await this.trackEvent("feedback_submission", {
      feedback_type: feedbackType,
      content_length: content.length,
      session_context: {
        images_processed: this.sessionMetrics.images_processed,
        successful_completions: this.sessionMetrics.successful_completions,
        failed_attempts: this.sessionMetrics.failed_attempts
      }
    });
  }
  /**
   * End session tracking
   */
  async endSession() {
    this.sessionMetrics.session_duration = Date.now() - this.sessionStartTime;
    await this.trackEvent("session_end", {
      session_summary: this.sessionMetrics,
      completion_rate: this.sessionMetrics.successful_completions / Math.max(1, this.sessionMetrics.images_processed),
      avg_processing_time: this.sessionMetrics.total_processing_time / Math.max(1, this.sessionMetrics.successful_completions)
    });
  }
  // Utility methods
  isReturnUser() {
    if (typeof window === "undefined")
      return false;
    const hasVisited = localStorage.getItem("charactercut_visited");
    if (!hasVisited) {
      localStorage.setItem("charactercut_visited", "1");
      return false;
    }
    return true;
  }
  classifyError(error) {
    const errorLower = error.toLowerCase();
    if (errorLower.includes("network") || errorLower.includes("fetch")) {
      return "network";
    } else if (errorLower.includes("size") || errorLower.includes("large")) {
      return "file_size";
    } else if (errorLower.includes("format") || errorLower.includes("type")) {
      return "file_format";
    } else if (errorLower.includes("timeout")) {
      return "timeout";
    } else {
      return "unknown";
    }
  }
  // Getters for external access
  get sessionId() {
    return this.sessionHash;
  }
  get metrics() {
    return { ...this.sessionMetrics };
  }
  // Enable/disable analytics
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}
const analyticsService = new AnalyticsService();
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    analyticsService.endSession();
  });
}
const NPSSurvey_svelte_svelte_type_style_lang = "";
const css$4 = {
  code: ".nps-survey.svelte-gf0zay.svelte-gf0zay{backdrop-filter:blur(10px);box-shadow:0 25px 50px -12px rgba(0, 0, 0, 0.25),\n      0 0 0 1px rgba(255, 255, 255, 0.05)}.score-button.svelte-gf0zay.svelte-gf0zay{transition:all 0.2s ease}.score-button.selected.svelte-gf0zay.svelte-gf0zay{transform:scale(1.1);box-shadow:0 4px 8px rgba(0, 255, 136, 0.3)}.score-button.hover-effect.svelte-gf0zay.svelte-gf0zay:hover{transform:scale(1.05)}.nps-survey.svelte-gf0zay .svelte-gf0zay{transition:all 0.2s ease}@media(max-width: 640px){.nps-survey.svelte-gf0zay.svelte-gf0zay{bottom:1rem;right:1rem;left:1rem;max-width:none}.grid.grid-cols-11.svelte-gf0zay.svelte-gf0zay{grid-template-columns:repeat(11, minmax(0, 1fr));gap:0.25rem}.score-button.svelte-gf0zay.svelte-gf0zay{width:1.75rem;height:1.75rem;font-size:0.75rem}}@media(prefers-reduced-motion: reduce){.nps-survey.svelte-gf0zay.svelte-gf0zay,.score-button.svelte-gf0zay.svelte-gf0zay{transition:none;animation:none}.score-button.selected.svelte-gf0zay.svelte-gf0zay{transform:none}.score-button.hover-effect.svelte-gf0zay.svelte-gf0zay:hover{transform:none}}",
  map: null
};
const NPSSurvey = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $fadeOut, $$unsubscribe_fadeOut;
  let $slideIn, $$unsubscribe_slideIn;
  let { visible = false } = $$props;
  let { imagesProcessed = 0 } = $$props;
  let { autoShowDelay = 5e3 } = $$props;
  createEventDispatcher();
  let selectedScore = null;
  let slideIn = tweened(0, { duration: 400, easing: quintOut });
  $$unsubscribe_slideIn = subscribe(slideIn, (value) => $slideIn = value);
  let fadeOut = tweened(1, { duration: 300, easing: quintOut });
  $$unsubscribe_fadeOut = subscribe(fadeOut, (value) => $fadeOut = value);
  if ($$props.visible === void 0 && $$bindings.visible && visible !== void 0)
    $$bindings.visible(visible);
  if ($$props.imagesProcessed === void 0 && $$bindings.imagesProcessed && imagesProcessed !== void 0)
    $$bindings.imagesProcessed(imagesProcessed);
  if ($$props.autoShowDelay === void 0 && $$bindings.autoShowDelay && autoShowDelay !== void 0)
    $$bindings.autoShowDelay(autoShowDelay);
  $$result.css.add(css$4);
  {
    if (visible) {
      slideIn.set(1);
    }
  }
  $$unsubscribe_fadeOut();
  $$unsubscribe_slideIn();
  return `  ${visible ? `<div class="nps-survey fixed bottom-6 right-6 max-w-sm bg-dark-elevated border border-magic-400/20 rounded-xl p-6 shadow-2xl z-50 svelte-gf0zay" style="${"opacity: " + escape($fadeOut, true) + "; transform: translateY(" + escape((1 - $slideIn) * 20, true) + "px)"}">${` <div class="space-y-4 svelte-gf0zay"> <div class="flex items-start justify-between svelte-gf0zay"><div class="svelte-gf0zay" data-svelte-h="svelte-1034g7d"><h3 class="text-lg font-semibold text-magic-gradient mb-1 svelte-gf0zay">Quick feedback?</h3> <p class="text-sm text-dark-text-secondary svelte-gf0zay">Help us improve CharacterCut for developers like you</p></div> <button class="text-dark-text-muted hover:text-dark-text p-1 rounded transition-colors svelte-gf0zay" data-svelte-h="svelte-182shzu"><svg class="w-4 h-4 svelte-gf0zay" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" class="svelte-gf0zay"></path></svg></button></div>  <div class="space-y-3 svelte-gf0zay"><p class="text-sm text-dark-text svelte-gf0zay" data-svelte-h="svelte-16p3lp3">How likely are you to recommend CharacterCut to other developers?</p>  <div class="space-y-2 svelte-gf0zay"><div class="grid grid-cols-11 gap-1 svelte-gf0zay">${each(Array(11), (_, i) => {
    return `<button class="${[
      "score-button w-8 h-8 rounded-md border text-xs font-medium transition-all svelte-gf0zay",
      (selectedScore === i ? "selected" : "") + " " + (selectedScore !== i ? "hover-effect" : "") + " " + (selectedScore === i ? "border-magic-400" : "") + " " + (selectedScore === i ? "bg-magic-400" : "") + " " + (selectedScore === i ? "text-white" : "") + " " + (selectedScore !== i ? "border-gray-600" : "") + " " + (selectedScore !== i ? "text-dark-text-muted" : "") + " " + (selectedScore !== i ? "hover:border-magic-400" : "") + " " + (selectedScore !== i ? "hover:text-magic-400" : "")
    ].join(" ").trim()}">${escape(i)} </button>`;
  })}</div>  <div class="flex justify-between text-xs text-dark-text-muted svelte-gf0zay" data-svelte-h="svelte-qpw09z"><span class="svelte-gf0zay">Not likely</span> <span class="svelte-gf0zay">Very likely</span></div></div></div>  ${``}  ${``}</div>`}</div>` : ``}`;
});
const FeedbackCollection_svelte_svelte_type_style_lang = "";
const css$3 = {
  code: ".feedback-modal.svelte-1adc9lu.svelte-1adc9lu.svelte-1adc9lu{backdrop-filter:blur(10px);box-shadow:0 25px 50px -12px rgba(0, 0, 0, 0.4),\n      0 0 0 1px rgba(255, 255, 255, 0.05)}.feedback-type-option.svelte-1adc9lu input.svelte-1adc9lu:checked+.feedback-type-card.svelte-1adc9lu{border-color:rgba(0, 255, 136, 0.6);background-color:rgba(0, 255, 136, 0.1)}.feedback-type-card.svelte-1adc9lu.svelte-1adc9lu.svelte-1adc9lu{transition:all 0.2s ease}.feedback-type-card.svelte-1adc9lu.svelte-1adc9lu.svelte-1adc9lu:hover{transform:translateY(-1px)}textarea.svelte-1adc9lu.svelte-1adc9lu.svelte-1adc9lu{min-height:120px}@media(max-width: 640px){.feedback-modal.svelte-1adc9lu.svelte-1adc9lu.svelte-1adc9lu{margin:1rem;max-height:calc(100vh - 2rem)}}@media(prefers-reduced-motion: reduce){.feedback-type-card.svelte-1adc9lu.svelte-1adc9lu.svelte-1adc9lu,.feedback-modal.svelte-1adc9lu .svelte-1adc9lu.svelte-1adc9lu{transition:none;animation:none}.feedback-type-card.svelte-1adc9lu.svelte-1adc9lu.svelte-1adc9lu:hover{transform:none}}",
  map: null
};
const FeedbackCollection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let isValidFeedback;
  let currentTypeInfo;
  let { visible = false } = $$props;
  let { feedbackType = "general" } = $$props;
  let { contextData = {} } = $$props;
  createEventDispatcher();
  let selectedType = feedbackType;
  let feedbackContent = "";
  let userEmail = "";
  let includeContext = true;
  let isSubmitting = false;
  let characterCount = 0;
  const feedbackTypes = {
    feature_request: {
      label: "Feature Request",
      placeholder: "Describe the feature you'd like to see in CharacterCut. How would it improve your developer workflow?",
      icon: "💡",
      examples: ["Batch processing multiple images", "API integration", "Browser extension"]
    },
    bug_report: {
      label: "Bug Report",
      placeholder: "Describe the issue you encountered. What were you trying to do, and what happened instead?",
      icon: "🐛",
      examples: [
        "Processing failed unexpectedly",
        "Image quality issues",
        "Interface not responding"
      ]
    },
    improvement: {
      label: "Improvement Suggestion",
      placeholder: "How can we make CharacterCut better for your specific use case?",
      icon: "⚡",
      examples: ["Faster processing", "Better edge detection", "More format support"]
    },
    general: {
      label: "General Feedback",
      placeholder: "Share your thoughts, suggestions, or experiences with CharacterCut.",
      icon: "💬",
      examples: ["Overall experience", "Interface feedback", "Workflow suggestions"]
    }
  };
  if ($$props.visible === void 0 && $$bindings.visible && visible !== void 0)
    $$bindings.visible(visible);
  if ($$props.feedbackType === void 0 && $$bindings.feedbackType && feedbackType !== void 0)
    $$bindings.feedbackType(feedbackType);
  if ($$props.contextData === void 0 && $$bindings.contextData && contextData !== void 0)
    $$bindings.contextData(contextData);
  $$result.css.add(css$3);
  characterCount = feedbackContent.length;
  isValidFeedback = feedbackContent.trim().length >= 10;
  currentTypeInfo = feedbackTypes[selectedType];
  return `  ${visible ? `<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="feedback-modal bg-dark-elevated border border-magic-400/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto svelte-1adc9lu">${` <div class="p-6 space-y-6 svelte-1adc9lu"> <div class="flex items-start justify-between svelte-1adc9lu"><div class="svelte-1adc9lu" data-svelte-h="svelte-179tctb"><h3 class="text-xl font-semibold text-magic-gradient mb-2 svelte-1adc9lu">Share Your Feedback</h3> <p class="text-sm text-dark-text-secondary svelte-1adc9lu">Help us make CharacterCut better for developers like you</p></div> <button class="text-dark-text-muted hover:text-dark-text p-2 rounded transition-colors svelte-1adc9lu" data-svelte-h="svelte-1jbsco1"><svg class="w-5 h-5 svelte-1adc9lu" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" class="svelte-1adc9lu"></path></svg></button></div>  <div class="space-y-3 svelte-1adc9lu"><label class="block text-sm font-medium text-dark-text svelte-1adc9lu" data-svelte-h="svelte-p24gya">What type of feedback is this?</label> <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 svelte-1adc9lu">${each(Object.entries(feedbackTypes), ([type, info]) => {
    return `<label class="feedback-type-option svelte-1adc9lu"><input type="radio"${add_attribute("value", type, 0)} class="sr-only svelte-1adc9lu"${type === selectedType ? add_attribute("checked", true, 1) : ""}> <div class="feedback-type-card p-4 rounded-lg border border-gray-600 hover:border-magic-400 cursor-pointer transition-all svelte-1adc9lu"><div class="flex items-center space-x-3 svelte-1adc9lu"><span class="text-2xl svelte-1adc9lu">${escape(info.icon)}</span> <div class="svelte-1adc9lu"><div class="font-medium text-dark-text svelte-1adc9lu">${escape(info.label)}</div> <div class="text-xs text-dark-text-muted mt-1 svelte-1adc9lu">${escape(info.examples.slice(0, 2).join(", "))} </div></div> </div></div> </label>`;
  })}</div></div>  <div class="space-y-3 svelte-1adc9lu"><div class="flex items-center justify-between svelte-1adc9lu"><label class="block text-sm font-medium text-dark-text svelte-1adc9lu" data-svelte-h="svelte-103pnj1">Your feedback</label> <span class="text-xs text-dark-text-muted svelte-1adc9lu">${escape(characterCount)} characters ${escape(characterCount < 10 ? "(minimum 10)" : "")}</span></div> <textarea${add_attribute("placeholder", currentTypeInfo.placeholder, 0)} class="w-full px-4 py-3 bg-dark-base border border-gray-600 rounded-lg text-dark-text placeholder-dark-text-muted resize-none focus:border-magic-400 focus:outline-none transition-colors svelte-1adc9lu" rows="6">${escape("")}</textarea> ${currentTypeInfo.examples.length > 0 ? `<div class="text-xs text-dark-text-muted svelte-1adc9lu"><span class="font-medium svelte-1adc9lu" data-svelte-h="svelte-3udf47">Examples:</span> ${escape(currentTypeInfo.examples.join(" • "))}</div>` : ``}</div>  <div class="space-y-3 svelte-1adc9lu"><label class="block text-sm font-medium text-dark-text svelte-1adc9lu" data-svelte-h="svelte-1ywtpsi">Email (optional)</label> <input type="email" placeholder="your.email@example.com" class="w-full px-4 py-3 bg-dark-base border border-gray-600 rounded-lg text-dark-text placeholder-dark-text-muted focus:border-magic-400 focus:outline-none transition-colors svelte-1adc9lu"${add_attribute("value", userEmail, 0)}> <p class="text-xs text-dark-text-muted svelte-1adc9lu" data-svelte-h="svelte-va0wj3">Only provide if you&#39;d like us to follow up. We respect your privacy.</p></div>  <div class="space-y-3 svelte-1adc9lu"><label class="flex items-center space-x-3 svelte-1adc9lu"><input type="checkbox" class="w-4 h-4 text-magic-400 border-gray-600 rounded focus:ring-magic-400 svelte-1adc9lu"${add_attribute("checked", includeContext, 1)}> <span class="text-sm text-dark-text svelte-1adc9lu" data-svelte-h="svelte-sohnzt">Include technical context (helps us understand your situation better)</span></label> ${Object.keys(contextData).length > 0 ? `<div class="text-xs text-dark-text-muted bg-dark-base/50 rounded p-3 svelte-1adc9lu"><strong class="svelte-1adc9lu" data-svelte-h="svelte-1m9jhps">Context includes:</strong> ${contextData.images_processed ? `Images processed: ${escape(contextData.images_processed)} •` : ``} ${contextData.processing_time ? `Avg processing time: ${escape(contextData.processing_time.toFixed(1))}s •` : ``}
                Browser info, session data</div>` : ``}</div>  <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700 svelte-1adc9lu"><button ${!isValidFeedback || isSubmitting ? "disabled" : ""} class="flex-1 btn btn-magic py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed svelte-1adc9lu">${`<svg class="w-5 h-5 mr-2 svelte-1adc9lu" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" class="svelte-1adc9lu"></path></svg>
                Submit Feedback`}</button> <button class="px-6 py-3 text-dark-text-muted hover:text-dark-text transition-colors font-medium svelte-1adc9lu" data-svelte-h="svelte-1ibbsx6">Cancel</button></div></div>`}</div></div>` : ``}`;
});
const AnalyticsDashboard_svelte_svelte_type_style_lang = "";
const css$2 = {
  code: ".analytics-dashboard.svelte-1dl4xtl.svelte-1dl4xtl{backdrop-filter:blur(10px);box-shadow:0 25px 50px -12px rgba(0, 0, 0, 0.4),\n      0 0 0 1px rgba(255, 255, 255, 0.05)}.metric-card.svelte-1dl4xtl.svelte-1dl4xtl,.kpi-card.svelte-1dl4xtl.svelte-1dl4xtl,.insights-card.svelte-1dl4xtl.svelte-1dl4xtl{transition:all 0.2s ease}.metric-card.svelte-1dl4xtl.svelte-1dl4xtl:hover,.kpi-card.svelte-1dl4xtl.svelte-1dl4xtl:hover,.insights-card.svelte-1dl4xtl.svelte-1dl4xtl:hover{transform:translateY(-1px);border-color:rgba(0, 255, 136, 0.3)}.progress-bar.svelte-1dl4xtl.svelte-1dl4xtl{overflow:hidden}@media(max-width: 768px){.analytics-dashboard.svelte-1dl4xtl.svelte-1dl4xtl{margin:1rem;max-height:calc(100vh - 2rem)}.grid.grid-cols-2.md\\\\.svelte-1dl4xtl.svelte-1dl4xtl:grid-cols-4{grid-template-columns:1fr 1fr}.grid.grid-cols-1.md\\\\:grid-cols-2.lg\\\\.svelte-1dl4xtl.svelte-1dl4xtl:grid-cols-3{grid-template-columns:1fr}}@media(prefers-reduced-motion: reduce){.metric-card.svelte-1dl4xtl.svelte-1dl4xtl,.kpi-card.svelte-1dl4xtl.svelte-1dl4xtl,.insights-card.svelte-1dl4xtl.svelte-1dl4xtl{transition:none}.metric-card.svelte-1dl4xtl.svelte-1dl4xtl:hover,.kpi-card.svelte-1dl4xtl.svelte-1dl4xtl:hover,.insights-card.svelte-1dl4xtl.svelte-1dl4xtl:hover{transform:none}.progress-bar.svelte-1dl4xtl div.svelte-1dl4xtl{transition:none}}",
  map: null
};
function getStatusColor(current, target, isPercentage = false) {
  const percentage = isPercentage ? current : current / target * 100;
  if (percentage >= 90)
    return "text-green-400";
  if (percentage >= 70)
    return "text-yellow-400";
  return "text-red-400";
}
function getProgressWidth(current, target) {
  return Math.min(current / target * 100, 100);
}
const AnalyticsDashboard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let taskCompletionRate;
  let sessionContinuityRate;
  let averageNPS;
  let { visible = false } = $$props;
  let { isDevMode = false } = $$props;
  createEventDispatcher();
  let sessionMetrics = analyticsService.metrics;
  const kpiTargets = {
    uniqueActiveUsers: 250,
    taskCompletionRate: 95,
    // percentage
    sessionContinuityRate: 15,
    // percentage of sessions with 2+ images
    avgProcessingTime: 5,
    // seconds
    npsScore: 0,
    // positive score target
    feedbackSubmissions: 15
  };
  let analyticsData = {
    uniqueActiveUsers: 0,
    totalSessions: 0,
    totalImages: 0,
    successfulProcessings: 0,
    failedProcessings: 0,
    avgProcessingTime: 0,
    under5SecondRate: 0,
    sessionContinuityCount: 0,
    npsResponses: [],
    feedbackSubmissions: 0,
    topReferrers: [],
    errorCategories: {},
    hourlyMetrics: []
  };
  if ($$props.visible === void 0 && $$bindings.visible && visible !== void 0)
    $$bindings.visible(visible);
  if ($$props.isDevMode === void 0 && $$bindings.isDevMode && isDevMode !== void 0)
    $$bindings.isDevMode(isDevMode);
  $$result.css.add(css$2);
  taskCompletionRate = 0;
  sessionContinuityRate = 0;
  averageNPS = analyticsData.npsResponses.length > 0 ? analyticsData.npsResponses.reduce((sum, score) => sum + score, 0) / analyticsData.npsResponses.length : 0;
  return `  ${visible && isDevMode ? `<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div class="analytics-dashboard bg-dark-elevated border border-magic-400/20 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto svelte-1dl4xtl"> <div class="p-6 border-b border-gray-700"><div class="flex items-center justify-between"><div data-svelte-h="svelte-1ryvpqg"><h2 class="text-2xl font-bold text-magic-gradient mb-2">CharacterCut Analytics Dashboard</h2> <p class="text-sm text-dark-text-secondary">Phase 5 Success Metrics Tracking • Dev Mode</p></div> <div class="flex items-center space-x-3"><button class="btn btn-outline border-magic-400 text-magic-400 hover:bg-magic-400 hover:text-white px-4 py-2 rounded text-sm" data-svelte-h="svelte-1hzqfkc">Export Data</button> <button class="text-dark-text-muted hover:text-dark-text p-2 rounded transition-colors" data-svelte-h="svelte-9m0buy"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div></div></div>  <div class="p-6 border-b border-gray-700"><h3 class="text-lg font-semibold text-dark-text mb-4" data-svelte-h="svelte-1y0f3ps">Current Session</h3> <div class="grid grid-cols-2 md:grid-cols-4 gap-4"><div class="metric-card bg-dark-base/50 rounded-lg p-4 svelte-1dl4xtl"><div class="text-2xl font-bold text-magic-400">${escape(sessionMetrics.images_processed)}</div> <div class="text-sm text-dark-text-muted" data-svelte-h="svelte-ehd65n">Images Processed</div></div> <div class="metric-card bg-dark-base/50 rounded-lg p-4 svelte-1dl4xtl"><div class="${"text-2xl font-bold " + escape(
    sessionMetrics.meets_continuity_target ? "text-green-400" : "text-yellow-400",
    true
  )}">${escape(sessionMetrics.meets_continuity_target ? "✅" : "⏳")}</div> <div class="text-sm text-dark-text-muted" data-svelte-h="svelte-158k1ee">Continuity Target</div></div> <div class="metric-card bg-dark-base/50 rounded-lg p-4 svelte-1dl4xtl"><div class="text-2xl font-bold text-blue-400">${escape(Math.round(sessionMetrics.session_duration / 1e3))}s</div> <div class="text-sm text-dark-text-muted" data-svelte-h="svelte-1sdj5gt">Session Duration</div></div> <div class="metric-card bg-dark-base/50 rounded-lg p-4 svelte-1dl4xtl"><div class="${"text-2xl font-bold " + escape(
    sessionMetrics.failed_attempts === 0 ? "text-green-400" : "text-red-400",
    true
  )}">${escape(sessionMetrics.successful_completions)}/${escape(sessionMetrics.successful_completions + sessionMetrics.failed_attempts)}</div> <div class="text-sm text-dark-text-muted" data-svelte-h="svelte-s2mmy6">Success Rate</div></div></div></div>  <div class="p-6"><h3 class="text-lg font-semibold text-dark-text mb-6" data-svelte-h="svelte-wnxoev">Phase 5 KPIs Progress</h3> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700 svelte-1dl4xtl"><div class="flex items-center justify-between mb-4"><h4 class="font-medium text-dark-text" data-svelte-h="svelte-1p1xeb3">Unique Active Users</h4> <span class="${escape(getStatusColor(analyticsData.uniqueActiveUsers, kpiTargets.uniqueActiveUsers), true) + " text-sm font-medium svelte-1dl4xtl"}">${escape(analyticsData.uniqueActiveUsers)}/${escape(kpiTargets.uniqueActiveUsers)}</span></div> <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2 svelte-1dl4xtl"><div class="bg-magic-400 h-2 rounded-full transition-all duration-500 svelte-1dl4xtl" style="${"width: " + escape(getProgressWidth(analyticsData.uniqueActiveUsers, kpiTargets.uniqueActiveUsers), true) + "%"}"></div></div> <div class="text-xs text-dark-text-muted">${escape((analyticsData.uniqueActiveUsers / kpiTargets.uniqueActiveUsers * 100).toFixed(1))}% of target</div></div>  <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700 svelte-1dl4xtl"><div class="flex items-center justify-between mb-4"><h4 class="font-medium text-dark-text" data-svelte-h="svelte-tx3wcr">Task Completion Rate</h4> <span class="${escape(getStatusColor(taskCompletionRate, kpiTargets.taskCompletionRate, true), true) + " text-sm font-medium svelte-1dl4xtl"}">${escape(taskCompletionRate.toFixed(1))}%</span></div> <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2 svelte-1dl4xtl"><div class="bg-green-400 h-2 rounded-full transition-all duration-500 svelte-1dl4xtl" style="${"width: " + escape(Math.min(taskCompletionRate, 100), true) + "%"}"></div></div> <div class="text-xs text-dark-text-muted">Target: ${escape(kpiTargets.taskCompletionRate)}%</div></div>  <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700 svelte-1dl4xtl"><div class="flex items-center justify-between mb-4"><h4 class="font-medium text-dark-text" data-svelte-h="svelte-1pjdus8">Avg Processing Time</h4> <span class="${escape(
    "text-green-400",
    true
  ) + " text-sm font-medium"}">${escape(analyticsData.avgProcessingTime.toFixed(2))}s</span></div> <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2 svelte-1dl4xtl"><div class="bg-blue-400 h-2 rounded-full transition-all duration-500 svelte-1dl4xtl" style="${"width: " + escape(Math.min(kpiTargets.avgProcessingTime / Math.max(analyticsData.avgProcessingTime, kpiTargets.avgProcessingTime) * 100, 100), true) + "%"}"></div></div> <div class="text-xs text-dark-text-muted">Target: &lt;${escape(kpiTargets.avgProcessingTime)}s • ${escape(analyticsData.under5SecondRate.toFixed(1))}% under 5s</div></div>  <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700 svelte-1dl4xtl"><div class="flex items-center justify-between mb-4"><h4 class="font-medium text-dark-text" data-svelte-h="svelte-1sx6yj2">Session Continuity</h4> <span class="${escape(getStatusColor(sessionContinuityRate, kpiTargets.sessionContinuityRate, true), true) + " text-sm font-medium svelte-1dl4xtl"}">${escape(sessionContinuityRate.toFixed(1))}%</span></div> <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2 svelte-1dl4xtl"><div class="bg-yellow-400 h-2 rounded-full transition-all duration-500 svelte-1dl4xtl" style="${"width: " + escape(Math.min(sessionContinuityRate, 100), true) + "%"}"></div></div> <div class="text-xs text-dark-text-muted">${escape(analyticsData.sessionContinuityCount)} sessions with 2+ images</div></div>  <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700 svelte-1dl4xtl"><div class="flex items-center justify-between mb-4"><h4 class="font-medium text-dark-text" data-svelte-h="svelte-jzhokp">NPS Score</h4> <span class="${escape(averageNPS >= 0 ? "text-green-400" : "text-red-400", true) + " text-sm font-medium"}">${escape(averageNPS > 0 ? "+" : "")}${escape(averageNPS.toFixed(1))}</span></div> <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2 svelte-1dl4xtl"><div class="bg-purple-400 h-2 rounded-full transition-all duration-500 svelte-1dl4xtl" style="${"width: " + escape((averageNPS + 10) / 20 * 100, true) + "%"}"></div></div> <div class="text-xs text-dark-text-muted">${escape(analyticsData.npsResponses.length)} responses • Target: positive</div></div>  <div class="kpi-card bg-dark-base/30 rounded-lg p-6 border border-gray-700 svelte-1dl4xtl"><div class="flex items-center justify-between mb-4"><h4 class="font-medium text-dark-text" data-svelte-h="svelte-86cqka">Feedback Submissions</h4> <span class="${escape(getStatusColor(analyticsData.feedbackSubmissions, kpiTargets.feedbackSubmissions), true) + " text-sm font-medium svelte-1dl4xtl"}">${escape(analyticsData.feedbackSubmissions)}/${escape(kpiTargets.feedbackSubmissions)}</span></div> <div class="progress-bar bg-dark-elevated rounded-full h-2 mb-2 svelte-1dl4xtl"><div class="bg-orange-400 h-2 rounded-full transition-all duration-500 svelte-1dl4xtl" style="${"width: " + escape(getProgressWidth(analyticsData.feedbackSubmissions, kpiTargets.feedbackSubmissions), true) + "%"}"></div></div> <div class="text-xs text-dark-text-muted" data-svelte-h="svelte-4uopxu">Detailed qualitative feedback</div></div></div>  <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"> <div class="insights-card bg-dark-base/30 rounded-lg p-6 border border-gray-700 svelte-1dl4xtl"><h4 class="font-medium text-dark-text mb-4" data-svelte-h="svelte-1q20frz">Top Referrers</h4> <div class="space-y-2">${analyticsData.topReferrers.slice(0, 5).length ? each(analyticsData.topReferrers.slice(0, 5), (referrer) => {
    return `<div class="flex items-center justify-between text-sm"><span class="text-dark-text-secondary">${escape(referrer.source)}</span> <span class="text-magic-400">${escape(referrer.count)}</span> </div>`;
  }) : `<div class="text-sm text-dark-text-muted" data-svelte-h="svelte-vgmp68">No referrer data available</div>`}</div></div>  <div class="insights-card bg-dark-base/30 rounded-lg p-6 border border-gray-700 svelte-1dl4xtl"><h4 class="font-medium text-dark-text mb-4" data-svelte-h="svelte-1ncaf6w">Error Categories</h4> <div class="space-y-2">${Object.entries(analyticsData.errorCategories).slice(0, 5).length ? each(Object.entries(analyticsData.errorCategories).slice(0, 5), ([category, count]) => {
    return `<div class="flex items-center justify-between text-sm"><span class="text-dark-text-secondary">${escape(category)}</span> <span class="text-red-400">${escape(count)}</span> </div>`;
  }) : `<div class="text-sm text-dark-text-muted" data-svelte-h="svelte-b9oudv">No error data (good!)</div>`}</div></div></div></div></div></div>` : ``}`;
});
const ModelSelector_svelte_svelte_type_style_lang = "";
const ImageRefinementEditor_svelte_svelte_type_style_lang = "";
const BatchProcessor_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".batch-overlay.svelte-8o0g4x{position:fixed;inset:0;background:rgba(0, 0, 0, 0.9);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}.batch-container.svelte-8o0g4x{background:linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(38, 38, 38, 0.9) 100%);border:1px solid rgba(0, 255, 136, 0.2);border-radius:12px;max-width:90vw;max-height:90vh;width:900px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0, 0, 0, 0.4)}.batch-header.svelte-8o0g4x{padding:20px 24px 16px;border-bottom:1px solid rgba(255, 255, 255, 0.1);position:relative}.close-button.svelte-8o0g4x{position:absolute;top:16px;right:20px;background:transparent;border:none;color:#666;cursor:pointer;padding:4px;transition:color 0.2s}.close-button.svelte-8o0g4x:hover{color:#fff}.drop-zone.svelte-8o0g4x{margin:20px;padding:60px 20px;border:2px dashed rgba(0, 255, 136, 0.3);border-radius:12px;text-align:center;transition:all 0.3s ease;cursor:pointer}.drop-zone.svelte-8o0g4x:hover,.drop-zone.drag-active.svelte-8o0g4x{border-color:rgba(0, 255, 136, 0.6);background:rgba(0, 255, 136, 0.05)}.drop-zone-content.svelte-8o0g4x{display:flex;flex-direction:column;align-items:center}.file-list-container.svelte-8o0g4x{flex:1;overflow:hidden;display:flex;flex-direction:column;padding:20px}.file-list-header.svelte-8o0g4x{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.file-list-actions.svelte-8o0g4x{display:flex;gap:8px}.file-list.svelte-8o0g4x{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;max-height:400px}.file-item.svelte-8o0g4x{display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255, 255, 255, 0.05);border:1px solid rgba(255, 255, 255, 0.1);border-radius:8px;transition:all 0.2s}.file-item.svelte-8o0g4x:hover{background:rgba(255, 255, 255, 0.08);border-color:rgba(0, 255, 136, 0.3)}.file-preview.svelte-8o0g4x{width:60px;height:60px;border-radius:6px;overflow:hidden;flex-shrink:0}.preview-image.svelte-8o0g4x{width:100%;height:100%;object-fit:cover}.file-info.svelte-8o0g4x{flex:1;min-width:0}.file-name.svelte-8o0g4x{font-weight:500;color:#fff;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.file-size.svelte-8o0g4x{font-size:12px;color:#999;margin-bottom:4px}.file-status.svelte-8o0g4x{font-size:12px;display:flex;align-items:center;gap:4px}.file-status.status-pending.svelte-8o0g4x{color:#ccc}.file-status.status-processing.svelte-8o0g4x{color:#00ff88}.file-status.status-completed.svelte-8o0g4x{color:#00ff88}.file-status.status-failed.svelte-8o0g4x{color:#ff4444}.processing-indicator.svelte-8o0g4x{display:flex;align-items:center;gap:4px}.spinner.svelte-8o0g4x{width:12px;height:12px;border:2px solid rgba(0, 255, 136, 0.3);border-top:2px solid #00ff88;border-radius:50%;animation:svelte-8o0g4x-spin 1s linear infinite}@keyframes svelte-8o0g4x-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.file-error.svelte-8o0g4x{font-size:11px;color:#ff4444;margin-top:2px}.file-actions.svelte-8o0g4x{display:flex;gap:8px;flex-shrink:0}.processing-controls.svelte-8o0g4x{padding:20px;border-top:1px solid rgba(255, 255, 255, 0.1);text-align:center}.processing-status.svelte-8o0g4x{display:flex;flex-direction:column;align-items:center;gap:12px}.processing-progress.svelte-8o0g4x{width:100%;max-width:400px}.progress-bar.svelte-8o0g4x{width:100%;height:8px;background:rgba(255, 255, 255, 0.1);border-radius:4px;overflow:hidden;margin-bottom:8px}.progress-fill.svelte-8o0g4x{height:100%;background:linear-gradient(90deg, #00ff88, #00d4aa);transition:width 0.3s ease}.progress-text.svelte-8o0g4x{color:#00ff88;font-size:14px}.batch-results.svelte-8o0g4x{display:flex;flex-direction:column;align-items:center;gap:16px}.results-summary.svelte-8o0g4x{text-align:center}.results-actions.svelte-8o0g4x{display:flex;gap:12px}.hidden.svelte-8o0g4x{display:none}@media(max-width: 768px){.batch-container.svelte-8o0g4x{width:100%;max-width:100vw;max-height:100vh;border-radius:0}.file-item.svelte-8o0g4x{flex-direction:column;align-items:flex-start;gap:8px}.file-actions.svelte-8o0g4x{align-self:flex-end}.results-actions.svelte-8o0g4x{flex-direction:column;width:100%}}",
  map: null
};
const BatchProcessor = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { isVisible = false } = $$props;
  let { maxFiles = 10 } = $$props;
  createEventDispatcher();
  let selectedFiles = [];
  let imagePreviewUrls = [];
  let fileStatuses = [];
  if ($$props.isVisible === void 0 && $$bindings.isVisible && isVisible !== void 0)
    $$bindings.isVisible(isVisible);
  if ($$props.maxFiles === void 0 && $$bindings.maxFiles && maxFiles !== void 0)
    $$bindings.maxFiles(maxFiles);
  $$result.css.add(css$1);
  return `  ${isVisible ? `<div class="batch-overlay svelte-8o0g4x"><div class="batch-container svelte-8o0g4x"> <div class="batch-header svelte-8o0g4x"><h3 class="text-xl font-semibold text-magic-gradient" data-svelte-h="svelte-fvixf7">Batch Processing</h3> <p class="text-sm text-dark-text-secondary mt-1">Process multiple images simultaneously (max ${escape(maxFiles)} files)</p> <button class="close-button svelte-8o0g4x" aria-label="Close batch processor" data-svelte-h="svelte-1x1er5t"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>  ${selectedFiles.length === 0 ? `<div class="${"drop-zone " + escape("", true) + " svelte-8o0g4x"}"><div class="drop-zone-content svelte-8o0g4x"><svg class="w-12 h-12 text-magic-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg> <h4 class="text-lg font-semibold text-dark-text mb-2" data-svelte-h="svelte-7cq59c">Drop images here or click to select</h4> <p class="text-sm text-dark-text-secondary mb-4">Support for JPG, PNG, WebP • Max 10MB per file • Up to ${escape(maxFiles)} files</p> <button class="btn btn-magic" ${""}><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Select Files</button></div> <input type="file" multiple accept="image/*" class="hidden svelte-8o0g4x"></div>` : ``}  ${selectedFiles.length > 0 ? `<div class="file-list-container svelte-8o0g4x"><div class="file-list-header svelte-8o0g4x"><h4 class="text-lg font-semibold text-dark-text">Selected Files (${escape(selectedFiles.length)}/${escape(maxFiles)})</h4> <div class="file-list-actions svelte-8o0g4x"><button class="btn btn-outline btn-sm" ${selectedFiles.length >= maxFiles ? "disabled" : ""}>Add More</button> <button class="btn btn-outline btn-sm" ${""}>Clear All</button></div></div> <div class="file-list svelte-8o0g4x">${each(selectedFiles, (file, index) => {
    return `<div class="file-item svelte-8o0g4x"><div class="file-preview svelte-8o0g4x"><img${add_attribute("src", imagePreviewUrls[index], 0)}${add_attribute("alt", file.name, 0)} class="preview-image svelte-8o0g4x"></div> <div class="file-info svelte-8o0g4x"><div class="file-name svelte-8o0g4x">${escape(file.name)}</div> <div class="file-size svelte-8o0g4x">${escape((file.size / (1024 * 1024)).toFixed(2))} MB</div>  ${fileStatuses[index] ? `<div class="${"file-status status-" + escape(fileStatuses[index].status, true) + " svelte-8o0g4x"}">${fileStatuses[index].status === "pending" ? `<span data-svelte-h="svelte-1cs9spj">Ready</span>` : `${fileStatuses[index].status === "processing" ? `<div class="processing-indicator svelte-8o0g4x" data-svelte-h="svelte-jkqr7"><div class="spinner svelte-8o0g4x"></div> <span>Processing...</span> </div>` : `${fileStatuses[index].status === "completed" ? `<span class="text-green-400" data-svelte-h="svelte-1hum4cp">✓ Completed</span>` : `${fileStatuses[index].status === "failed" ? `<span class="text-red-400" data-svelte-h="svelte-hchxnj">✗ Failed</span>` : ``}`}`}`}</div> ${fileStatuses[index].error ? `<div class="file-error svelte-8o0g4x">${escape(fileStatuses[index].error)}</div>` : ``}` : ``}</div> <div class="file-actions svelte-8o0g4x">${fileStatuses[index]?.status === "completed" && fileStatuses[index].downloadUrl ? `<button class="btn btn-sm btn-magic" title="Download processed image" data-svelte-h="svelte-wys4yr"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4"></path></svg> </button>` : ``} <button class="btn btn-sm btn-outline border-red-500 text-red-400 hover:bg-red-500 hover:text-white" ${""} title="Remove file"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> </button></div> </div>`;
  })}</div> <input type="file" multiple accept="image/*" class="hidden svelte-8o0g4x"></div>  <div class="processing-controls svelte-8o0g4x">${`<button class="btn btn-magic btn-lg" ${selectedFiles.length === 0 ? "disabled" : ""}><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Process ${escape(selectedFiles.length)} Image${escape(selectedFiles.length > 1 ? "s" : "")}</button>`}</div>` : ``}</div></div>` : ``}`;
});
const inputState = writable({
  currentState: "idle",
  inputMethod: "none",
  isDragActive: false,
  isClipboardReady: false,
  errorMessage: null,
  successMessage: null,
  canAcceptInput: true,
  showPasteHint: true
});
derived(inputState, ($state) => ({
  isIdle: $state.currentState === "idle",
  isActive: $state.currentState === "active" || $state.isDragActive,
  isProcessing: $state.currentState === "processing",
  hasError: $state.currentState === "error",
  hasSuccess: $state.currentState === "success",
  showDropZone: $state.canAcceptInput && ["idle", "hover", "active"].includes($state.currentState)
}));
const inputAnalytics = writable({
  dragEvents: 0,
  pasteEvents: 0,
  uploadEvents: 0,
  successfulInputs: 0,
  failedInputs: 0,
  averageInputTime: 0
});
const validTransitions = [
  // From idle
  { from: "idle", to: "hover", trigger: "DRAG_ENTER" },
  { from: "idle", to: "active", trigger: "PASTE_READY", method: "paste" },
  { from: "idle", to: "active", trigger: "UPLOAD_CLICK", method: "upload" },
  { from: "idle", to: "processing", trigger: "FILE_SELECTED" },
  // From hover
  { from: "hover", to: "idle", trigger: "DRAG_LEAVE" },
  { from: "hover", to: "active", trigger: "DRAG_OVER" },
  { from: "hover", to: "hover", trigger: "DRAG_ENTER" },
  // Stay in hover on repeated drag enter
  { from: "hover", to: "processing", trigger: "DROP", method: "drop" },
  // From active
  { from: "active", to: "idle", trigger: "CANCEL" },
  { from: "active", to: "processing", trigger: "FILE_SELECTED" },
  { from: "active", to: "processing", trigger: "DROP", method: "drop" },
  { from: "active", to: "active", trigger: "DRAG_OVER" },
  // Stay active on repeated drag over
  { from: "active", to: "hover", trigger: "DRAG_LEAVE" },
  { from: "active", to: "success", trigger: "PROCESS_COMPLETE" },
  // Direct success from active
  { from: "active", to: "error", trigger: "PROCESS_ERROR" },
  // Direct error from active
  // From processing
  { from: "processing", to: "success", trigger: "PROCESS_COMPLETE" },
  { from: "processing", to: "error", trigger: "PROCESS_ERROR" },
  // From success
  { from: "success", to: "idle", trigger: "RESET" },
  { from: "success", to: "processing", trigger: "PROCESS_ANOTHER" },
  // From error
  { from: "error", to: "idle", trigger: "RESET" },
  { from: "error", to: "processing", trigger: "RETRY" }
];
const inputActions = {
  // Core state transitions
  transition(trigger, method, data) {
    inputState.update((current) => {
      const validTransition = validTransitions.find(
        (t) => t.from === current.currentState && t.trigger === trigger
      );
      if (!validTransition) {
        console.warn(`Invalid transition: ${current.currentState} -> ${trigger}`);
        return current;
      }
      const newState = {
        ...current,
        currentState: validTransition.to,
        inputMethod: validTransition.method || method || current.inputMethod,
        errorMessage: validTransition.to !== "error" ? null : current.errorMessage,
        successMessage: validTransition.to !== "success" ? null : current.successMessage,
        ...data
      };
      console.log(`Input state: ${current.currentState} -> ${newState.currentState} (${trigger})`);
      return newState;
    });
  },
  // Drag and drop actions
  dragEnter() {
    inputActions.transition("DRAG_ENTER");
    inputState.update((state) => ({ ...state, isDragActive: true }));
  },
  dragLeave() {
    inputActions.transition("DRAG_LEAVE");
    inputState.update((state) => ({ ...state, isDragActive: false }));
  },
  dragOver() {
    inputActions.transition("DRAG_OVER");
  },
  drop(files) {
    if (files.length === 0)
      return;
    inputActions.transition("DROP", "drop");
    inputState.update((state) => ({
      ...state,
      isDragActive: false,
      canAcceptInput: false
    }));
    inputAnalytics.update((analytics) => ({
      ...analytics,
      dragEvents: analytics.dragEvents + 1
    }));
  },
  // Clipboard actions
  pasteReady() {
    inputActions.transition("PASTE_READY", "paste");
  },
  paste() {
    inputActions.transition("FILE_SELECTED", "paste");
    inputState.update((state) => ({ ...state, canAcceptInput: false }));
    inputAnalytics.update((analytics) => ({
      ...analytics,
      pasteEvents: analytics.pasteEvents + 1
    }));
  },
  // Upload actions
  uploadClick() {
    inputActions.transition("UPLOAD_CLICK", "upload");
  },
  uploadSelected(file) {
    inputActions.transition("FILE_SELECTED", "upload");
    inputState.update((state) => ({ ...state, canAcceptInput: false }));
    inputAnalytics.update((analytics) => ({
      ...analytics,
      uploadEvents: analytics.uploadEvents + 1
    }));
  },
  // Processing actions
  startProcessing() {
    inputActions.transition("FILE_SELECTED");
  },
  completeProcessing(successMessage = "Processing complete!") {
    inputActions.transition("PROCESS_COMPLETE");
    inputState.update((state) => ({
      ...state,
      successMessage,
      canAcceptInput: true
    }));
    inputAnalytics.update((analytics) => ({
      ...analytics,
      successfulInputs: analytics.successfulInputs + 1
    }));
  },
  errorProcessing(errorMessage) {
    inputActions.transition("PROCESS_ERROR");
    inputState.update((state) => ({
      ...state,
      errorMessage,
      canAcceptInput: true
    }));
    inputAnalytics.update((analytics) => ({
      ...analytics,
      failedInputs: analytics.failedInputs + 1
    }));
  },
  // Reset actions
  reset() {
    inputActions.transition("RESET");
    inputState.update((state) => ({
      ...state,
      inputMethod: "none",
      isDragActive: false,
      errorMessage: null,
      successMessage: null,
      canAcceptInput: true
    }));
  },
  processAnother() {
    inputActions.transition("PROCESS_ANOTHER");
    inputState.update((state) => ({
      ...state,
      inputMethod: "none",
      isDragActive: false,
      errorMessage: null,
      successMessage: null,
      canAcceptInput: true
    }));
  },
  retry() {
    inputActions.transition("RETRY");
    inputState.update((state) => ({
      ...state,
      errorMessage: null,
      canAcceptInput: true
    }));
  },
  // Clipboard readiness detection
  setClipboardReady(ready) {
    inputState.update((state) => ({
      ...state,
      isClipboardReady: ready,
      showPasteHint: ready
    }));
  },
  // Validation and error handling
  validateInput(file) {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"];
    if (file.size > maxSize) {
      return { valid: false, error: "File size too large (max 10MB)" };
    }
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: "Unsupported file type" };
    }
    return { valid: true };
  }
};
if (typeof window !== "undefined") {
  const clipboardSupported = !!(navigator.clipboard && navigator.clipboard.read);
  inputActions.setClipboardReady(clipboardSupported);
}
const sessionContinuity = writable({
  sessionId: generateSessionId(),
  startTime: Date.now(),
  imagesProcessed: 0,
  successfulImages: 0,
  totalProcessingTime: 0,
  averageProcessingTime: 0,
  sessionDuration: 0,
  meetsTarget: false,
  showProcessAnotherPrompt: false,
  history: []
});
const continuityStatus = derived(sessionContinuity, ($session) => ({
  isFirstImage: $session.imagesProcessed === 0,
  hasProcessedImages: $session.imagesProcessed > 0,
  meetsTarget: $session.imagesProcessed >= 2,
  shouldShowProcessAnother: $session.successfulImages > 0,
  successRate: $session.imagesProcessed > 0 ? $session.successfulImages / $session.imagesProcessed * 100 : 0,
  isActiveSession: $session.sessionDuration < 30 * 60 * 1e3,
  // 30 minutes
  performanceGood: $session.averageProcessingTime < 5e3
  // < 5 seconds
}));
const sessionAnalytics = derived(sessionContinuity, ($session) => ({
  sessionDuration: formatDuration($session.sessionDuration),
  imagesPerMinute: $session.sessionDuration > 0 ? ($session.imagesProcessed / ($session.sessionDuration / 6e4)).toFixed(1) : "0",
  averageProcessingTime: formatDuration($session.averageProcessingTime),
  mostUsedInputMethod: getMostUsedInputMethod($session.history),
  quickestProcessingTime: getQuickestProcessingTime($session.history),
  sessionScore: calculateSessionScore($session)
}));
const continuityActions = {
  // Start new session
  startNewSession() {
    sessionContinuity.set({
      sessionId: generateSessionId(),
      startTime: Date.now(),
      imagesProcessed: 0,
      successfulImages: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      sessionDuration: 0,
      meetsTarget: false,
      showProcessAnotherPrompt: false,
      history: []
    });
  },
  // Record successful processing
  recordProcessing(filename, processingTime, inputMethod, recoveryAttempts = 0) {
    sessionContinuity.update((session) => {
      const newEntry = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        filename,
        processingTime,
        success: true,
        inputMethod,
        recoveryAttempts
      };
      const updatedHistory = [...session.history, newEntry];
      const imagesProcessed = session.imagesProcessed + 1;
      const successfulImages = session.successfulImages + 1;
      const totalProcessingTime = session.totalProcessingTime + processingTime;
      const sessionDuration = Date.now() - session.startTime;
      return {
        ...session,
        imagesProcessed,
        successfulImages,
        totalProcessingTime,
        averageProcessingTime: totalProcessingTime / imagesProcessed,
        sessionDuration,
        meetsTarget: imagesProcessed >= 2,
        showProcessAnotherPrompt: true,
        history: updatedHistory
      };
    });
    this.trackContinuityEvent("image_processed", {
      processingTime,
      inputMethod,
      recoveryAttempts
    });
  },
  // Record failed processing
  recordFailure(filename, inputMethod, recoveryAttempts = 0) {
    sessionContinuity.update((session) => {
      const newEntry = {
        id: `fail_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        filename,
        processingTime: 0,
        success: false,
        inputMethod,
        recoveryAttempts
      };
      const updatedHistory = [...session.history, newEntry];
      const imagesProcessed = session.imagesProcessed + 1;
      const sessionDuration = Date.now() - session.startTime;
      return {
        ...session,
        imagesProcessed,
        sessionDuration,
        history: updatedHistory
      };
    });
    this.trackContinuityEvent("image_failed", {
      inputMethod,
      recoveryAttempts
    });
  },
  // Handle "Process Another" action
  processAnother() {
    sessionContinuity.update((session) => ({
      ...session,
      showProcessAnotherPrompt: false,
      sessionDuration: Date.now() - session.startTime
    }));
    this.trackContinuityEvent("process_another_clicked");
  },
  // End current session
  endSession() {
    sessionContinuity.update((session) => {
      const finalDuration = Date.now() - session.startTime;
      this.trackContinuityEvent("session_ended", {
        imagesProcessed: session.imagesProcessed,
        successfulImages: session.successfulImages,
        sessionDuration: finalDuration,
        meetsTarget: session.imagesProcessed >= 2
      });
      return {
        ...session,
        sessionDuration: finalDuration
      };
    });
  },
  // Update session duration (call periodically)
  updateSessionDuration() {
    sessionContinuity.update((session) => ({
      ...session,
      sessionDuration: Date.now() - session.startTime
    }));
  },
  // Get session summary for analytics
  getSessionSummary() {
    return new Promise((resolve) => {
      const unsubscribe = sessionContinuity.subscribe((session) => {
        unsubscribe();
        const analyticsUnsubscribe = sessionAnalytics.subscribe((analytics) => {
          analyticsUnsubscribe();
          resolve({ ...session, analytics });
        });
      });
    });
  },
  // Track continuity events for analytics
  trackContinuityEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      sessionId: null,
      // Will be set by session store
      data: data || {}
    };
    console.log("Session continuity event:", event);
    try {
      const existing = JSON.parse(localStorage.getItem("session_events") || "[]");
      existing.push(event);
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }
      localStorage.setItem("session_events", JSON.stringify(existing));
    } catch (e) {
    }
  },
  // Clear session data
  clearSession() {
    continuityActions.startNewSession();
  }
};
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function formatDuration(milliseconds) {
  if (milliseconds < 1e3)
    return `${milliseconds}ms`;
  if (milliseconds < 6e4)
    return `${(milliseconds / 1e3).toFixed(1)}s`;
  return `${Math.floor(milliseconds / 6e4)}m ${Math.floor(milliseconds % 6e4 / 1e3)}s`;
}
function getMostUsedInputMethod(history) {
  if (history.length === 0)
    return "none";
  const counts = history.reduce((acc, entry) => {
    acc[entry.inputMethod] = (acc[entry.inputMethod] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
}
function getQuickestProcessingTime(history) {
  const successfulTimes = history.filter((entry) => entry.success && entry.processingTime > 0).map((entry) => entry.processingTime);
  return successfulTimes.length > 0 ? Math.min(...successfulTimes) : 0;
}
function calculateSessionScore(session) {
  let score = 0;
  score += session.imagesProcessed * 20;
  score += session.successfulImages * 10;
  if (session.meetsTarget)
    score += 50;
  if (session.averageProcessingTime < 5e3)
    score += 20;
  if (session.sessionDuration > 5 * 60 * 1e3)
    score += 30;
  return Math.min(score, 100);
}
if (typeof window !== "undefined") {
  setInterval(() => {
    continuityActions.updateSessionDuration();
  }, 3e4);
  window.addEventListener("beforeunload", () => {
    continuityActions.endSession();
  });
}
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: ".page-container.svelte-1blw2di{min-height:calc(100vh - 140px)}.hero.svelte-1blw2di{background:radial-gradient(ellipse at top, rgba(0, 255, 136, 0.1) 0%, transparent 50%),\r\n      radial-gradient(ellipse at bottom, rgba(0, 136, 255, 0.05) 0%, transparent 50%)}.processing-container.svelte-1blw2di{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:min(900px, 90vw);min-height:min(400px, 60vh);background:linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(38, 38, 38, 0.9) 100%);border:1px solid rgba(0, 255, 136, 0.2);border-radius:12px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0, 0, 0, 0.4),\r\n      0 0 0 1px rgba(255, 255, 255, 0.05);display:flex;align-items:center;justify-content:center;box-sizing:border-box}.success-card.svelte-1blw2di,.feature-card.svelte-1blw2di{border:1px solid rgba(56, 189, 248, 0.2);transition:all 0.3s ease}.success-card.svelte-1blw2di:hover,.feature-card.svelte-1blw2di:hover{border-color:rgba(56, 189, 248, 0.4);transform:translateY(-2px)}.success-card.svelte-1blw2di{animation:svelte-1blw2di-slideUp 0.5s ease-out}@keyframes svelte-1blw2di-slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes svelte-1blw2di-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}.processing-section.svelte-1blw2di{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0, 0, 0, 0.8);backdrop-filter:blur(4px);z-index:1000}@media(max-width: 768px){.processing-container.svelte-1blw2di{width:min(95vw, 600px);min-height:min(350px, 50vh)}}@media(max-width: 480px){.processing-container.svelte-1blw2di{width:min(calc(100vw - 24px), 400px);min-height:min(300px, 45vh)}}.processing-container.svelte-1blw2di::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 40%, rgba(0, 255, 136, 0.1) 0%, transparent 50%),\r\n      radial-gradient(circle at 70% 60%, rgba(0, 136, 255, 0.05) 0%, transparent 50%);pointer-events:none;z-index:1}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_continuityStatus;
  let $appState, $$unsubscribe_appState;
  $$unsubscribe_continuityStatus = subscribe(continuityStatus, (value) => value);
  $$unsubscribe_appState = subscribe(appState, (value) => $appState = value);
  let processing = false;
  let showNPSSurvey = false;
  let showFeedbackCollection = false;
  let showAnalyticsDashboard = false;
  let showBatchProcessor = false;
  $$result.css.add(css);
  $appState.currentImage;
  $appState.processingState.status;
  $$unsubscribe_continuityStatus();
  $$unsubscribe_appState();
  return `  ${$$result.head += `<!-- HEAD_svelte-thm2db_START -->${$$result.title = `<title>CharacterCut - Transform Your Characters with Magic</title>`, ""}<meta name="description" content="Remove backgrounds from AI-generated characters instantly. Drag, drop, or paste - watch backgrounds disappear like magic."><!-- HEAD_svelte-thm2db_END -->`, ""} <div class="page-container svelte-1blw2di"> <section class="hero py-12 sm:py-20 svelte-1blw2di" data-svelte-h="svelte-1h6iamq"><div class="container text-center"> <div class="mb-8"><h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"><span class="text-magic-gradient">Transform Characters</span> <br> <span class="text-dark-text">with Magic</span></h1> <p class="text-xl sm:text-2xl text-dark-text-secondary max-w-2xl mx-auto leading-relaxed">Watch backgrounds disappear effortlessly. Perfect for 
          <span class="text-magic-400 font-medium">AI-generated character assets</span>.</p></div>  <div class="flex items-center justify-center space-x-2 mb-12 text-dark-text-muted"><svg class="w-5 h-5 text-magic-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg> <span class="text-sm">Average processing time: &lt;5 seconds</span></div></div></section>  <section class="interface py-8"><div class="container">${` <div class="max-w-2xl mx-auto">${validate_component(UnifiedInput, "UnifiedInput").$$render($$result, { disabled: processing }, {}, {})}  <div class="text-center batch-button-container mt-6"><button class="btn btn-outline border-magic-400 text-magic-400 hover:bg-magic-400 hover:text-white py-2 px-4 rounded-lg font-medium text-sm" data-svelte-h="svelte-1tvqvdp"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              Process Multiple Images</button></div></div>`} ${``} ${``} ${``}</div></section>  ${``}  ${`<section class="features py-16 sm:py-24" data-svelte-h="svelte-6b4rhs"><div class="container"><div class="text-center mb-12"><h2 class="text-3xl font-bold text-dark-text mb-4">Built for Developer Workflow</h2> <p class="text-lg text-dark-text-secondary max-w-2xl mx-auto">Designed for speed and efficiency. Get back to building faster.</p></div> <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"> <div class="feature-card glass-card rounded-xl p-6 text-center svelte-1blw2di"><div class="w-12 h-12 mx-auto mb-4 rounded-lg bg-magic-400/20 flex items-center justify-center"><svg class="w-6 h-6 text-magic-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div> <h3 class="text-lg font-semibold text-dark-text mb-2">Lightning Fast</h3> <p class="text-sm text-dark-text-secondary">Average processing under 5 seconds. Keep your momentum going.</p></div>  <div class="feature-card glass-card rounded-xl p-6 text-center svelte-1blw2di"><div class="w-12 h-12 mx-auto mb-4 rounded-lg bg-magic-400/20 flex items-center justify-center"><svg class="w-6 h-6 text-magic-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></div> <h3 class="text-lg font-semibold text-dark-text mb-2">Seamless Paste</h3> <p class="text-sm text-dark-text-secondary">Cmd+V from any AI generator. Results auto-copy to clipboard.</p></div>  <div class="feature-card glass-card rounded-xl p-6 text-center svelte-1blw2di"><div class="w-12 h-12 mx-auto mb-4 rounded-lg bg-magic-400/20 flex items-center justify-center"><svg class="w-6 h-6 text-magic-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div> <h3 class="text-lg font-semibold text-dark-text mb-2">Privacy First</h3> <p class="text-sm text-dark-text-secondary">Images auto-delete after 1 hour. No tracking, no accounts needed.</p></div></div></div></section>`}</div>   ${validate_component(NPSSurvey, "NPSSurvey").$$render(
    $$result,
    {
      visible: showNPSSurvey,
      imagesProcessed: analyticsService.metrics.images_processed
    },
    {},
    {}
  )}  ${validate_component(FeedbackCollection, "FeedbackCollection").$$render(
    $$result,
    {
      visible: showFeedbackCollection,
      contextData: {
        images_processed: analyticsService.metrics.images_processed,
        successful_completions: analyticsService.metrics.successful_completions,
        failed_attempts: analyticsService.metrics.failed_attempts,
        processing_time: analyticsService.metrics.total_processing_time / Math.max(1, analyticsService.metrics.successful_completions),
        session_duration: analyticsService.metrics.session_duration
      }
    },
    {},
    {}
  )}  ${validate_component(AnalyticsDashboard, "AnalyticsDashboard").$$render(
    $$result,
    {
      visible: showAnalyticsDashboard,
      isDevMode: true
    },
    {},
    {}
  )}  ${`<button class="fixed bottom-6 left-6 bg-magic-400/20 hover:bg-magic-400/30 border border-magic-400/40 rounded-full p-3 transition-all duration-200 z-40" title="Send Feedback" data-svelte-h="svelte-10pz063"><svg class="w-5 h-5 text-magic-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v10a2 2 0 002 2h8a2 2 0 002-2V8M9 12h6"></path></svg></button>`}  ${``}  ${validate_component(BatchProcessor, "BatchProcessor").$$render($$result, { isVisible: showBatchProcessor }, {}, {})}`;
});
export {
  Page as default
};
