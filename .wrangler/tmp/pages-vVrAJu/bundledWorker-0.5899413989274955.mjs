var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../.wrangler/tmp/bundle-QHeiZH/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init3) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init3) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init3] = argArray;
    checkURL(request, init3);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// _worker.js
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = /* @__PURE__ */ __name((fn, res) => /* @__PURE__ */ __name(function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
}, "__init"), "__esm");
var __commonJS = /* @__PURE__ */ __name((cb, mod) => /* @__PURE__ */ __name(function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
}, "__require"), "__commonJS");
var __export = /* @__PURE__ */ __name((target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
}, "__export");
var __copyProps = /* @__PURE__ */ __name((to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp2(to, key2, { get: /* @__PURE__ */ __name(() => from[key2], "get"), enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
}, "__copyProps");
var __toESM = /* @__PURE__ */ __name((mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
  mod
)), "__toESM");
var BROWSER;
var init_false = __esm({
  ".svelte-kit/output/server/chunks/false.js"() {
    BROWSER = false;
  }
});
var init_remote_functions = __esm({
  "node_modules/@sveltejs/kit/src/exports/internal/remote-functions.js"() {
  }
});
var HttpError;
var Redirect;
var SvelteKitError;
var ActionFailure;
var init_internal = __esm({
  "node_modules/@sveltejs/kit/src/exports/internal/index.js"() {
    init_remote_functions();
    HttpError = class {
      static {
        __name(this, "HttpError");
      }
      /**
       * @param {number} status
       * @param {{message: string} extends App.Error ? (App.Error | string | undefined) : App.Error} body
       */
      constructor(status, body2) {
        this.status = status;
        if (typeof body2 === "string") {
          this.body = { message: body2 };
        } else if (body2) {
          this.body = body2;
        } else {
          this.body = { message: `Error: ${status}` };
        }
      }
      toString() {
        return JSON.stringify(this.body);
      }
    };
    Redirect = class {
      static {
        __name(this, "Redirect");
      }
      /**
       * @param {300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308} status
       * @param {string} location
       */
      constructor(status, location) {
        this.status = status;
        this.location = location;
      }
    };
    SvelteKitError = class extends Error {
      static {
        __name(this, "SvelteKitError");
      }
      /**
       * @param {number} status
       * @param {string} text
       * @param {string} message
       */
      constructor(status, text2, message2) {
        super(message2);
        this.status = status;
        this.text = text2;
      }
    };
    ActionFailure = class {
      static {
        __name(this, "ActionFailure");
      }
      /**
       * @param {number} status
       * @param {T} data
       */
      constructor(status, data) {
        this.status = status;
        this.data = data;
      }
    };
  }
});
var true_default;
var init_true = __esm({
  "node_modules/esm-env/true.js"() {
    true_default = true;
  }
});
var node_env;
var dev_fallback_default;
var init_dev_fallback = __esm({
  "node_modules/esm-env/dev-fallback.js"() {
    node_env = "development";
    dev_fallback_default = node_env && !node_env.toLowerCase().startsWith("prod");
  }
});
var init_false2 = __esm({
  "node_modules/esm-env/false.js"() {
  }
});
var init_esm_env = __esm({
  "node_modules/esm-env/index.js"() {
    init_true();
    init_dev_fallback();
    init_false2();
  }
});
var init_pathname = __esm({
  "node_modules/@sveltejs/kit/src/runtime/pathname.js"() {
  }
});
var text_encoder;
var text_decoder;
var init_utils = __esm({
  "node_modules/@sveltejs/kit/src/runtime/utils.js"() {
    init_esm_env();
    text_encoder = new TextEncoder();
    text_decoder = new TextDecoder();
  }
});
var init_version = __esm({
  "node_modules/@sveltejs/kit/src/version.js"() {
  }
});
function error(status, body2) {
  if ((!true_default || dev_fallback_default) && (isNaN(status) || status < 400 || status > 599)) {
    throw new Error(`HTTP error status codes must be between 400 and 599 \u2014 ${status} is invalid`);
  }
  throw new HttpError(status, body2);
}
__name(error, "error");
function redirect(status, location) {
  if ((!true_default || dev_fallback_default) && (isNaN(status) || status < 300 || status > 308)) {
    throw new Error("Invalid status code");
  }
  throw new Redirect(
    // @ts-ignore
    status,
    location.toString()
  );
}
__name(redirect, "redirect");
function json(data, init3) {
  const body2 = JSON.stringify(data);
  const headers2 = new Headers(init3?.headers);
  if (!headers2.has("content-length")) {
    headers2.set("content-length", text_encoder.encode(body2).byteLength.toString());
  }
  if (!headers2.has("content-type")) {
    headers2.set("content-type", "application/json");
  }
  return new Response(body2, {
    ...init3,
    headers: headers2
  });
}
__name(json, "json");
function text(body2, init3) {
  const headers2 = new Headers(init3?.headers);
  if (!headers2.has("content-length")) {
    const encoded = text_encoder.encode(body2);
    headers2.set("content-length", encoded.byteLength.toString());
    return new Response(encoded, {
      ...init3,
      headers: headers2
    });
  }
  return new Response(body2, {
    ...init3,
    headers: headers2
  });
}
__name(text, "text");
var init_exports = __esm({
  "node_modules/@sveltejs/kit/src/exports/index.js"() {
    init_internal();
    init_esm_env();
    init_pathname();
    init_utils();
    init_version();
  }
});
var IN_WEBCONTAINER;
var init_constants = __esm({
  "node_modules/@sveltejs/kit/src/runtime/server/constants.js"() {
    IN_WEBCONTAINER = !!globalThis.process?.versions?.webcontainer;
  }
});
function with_request_store(store, fn) {
  try {
    sync_store = store;
    return als ? als.run(store, fn) : fn();
  } finally {
    if (!IN_WEBCONTAINER) {
      sync_store = null;
    }
  }
}
__name(with_request_store, "with_request_store");
var sync_store;
var als;
var init_event = __esm({
  "node_modules/@sveltejs/kit/src/exports/internal/event.js"() {
    init_constants();
    sync_store = null;
    import("node:async_hooks").then((hooks) => als = new hooks.AsyncLocalStorage()).catch(() => {
    });
  }
});
function merge_tracing(event_like, current2) {
  return {
    ...event_like,
    tracing: {
      ...event_like.tracing,
      current: current2
    }
  };
}
__name(merge_tracing, "merge_tracing");
var init_server = __esm({
  "node_modules/@sveltejs/kit/src/exports/internal/server.js"() {
    init_event();
  }
});
function override(paths) {
  base = paths.base;
  assets = paths.assets;
}
__name(override, "override");
function reset() {
  base = initial.base;
  assets = initial.assets;
}
__name(reset, "reset");
var base;
var assets;
var app_dir;
var relative;
var initial;
var building;
var init_environment = __esm({
  ".svelte-kit/output/server/chunks/environment.js"() {
    base = "";
    assets = base;
    app_dir = "_app";
    relative = true;
    initial = { base, assets };
    building = false;
  }
});
function resolve(base2, path) {
  if (path[0] === "/" && path[1] === "/") return path;
  let url = new URL(base2, internal);
  url = new URL(path, url);
  return url.protocol === internal.protocol ? url.pathname + url.search + url.hash : url.href;
}
__name(resolve, "resolve");
function normalize_path(path, trailing_slash) {
  if (path === "/" || trailing_slash === "ignore") return path;
  if (trailing_slash === "never") {
    return path.endsWith("/") ? path.slice(0, -1) : path;
  } else if (trailing_slash === "always" && !path.endsWith("/")) {
    return path + "/";
  }
  return path;
}
__name(normalize_path, "normalize_path");
function decode_pathname(pathname) {
  return pathname.split("%25").map(decodeURI).join("%25");
}
__name(decode_pathname, "decode_pathname");
function decode_params(params) {
  for (const key2 in params) {
    params[key2] = decodeURIComponent(params[key2]);
  }
  return params;
}
__name(decode_params, "decode_params");
function make_trackable(url, callback2, search_params_callback, allow_hash = false) {
  const tracked = new URL(url);
  Object.defineProperty(tracked, "searchParams", {
    value: new Proxy(tracked.searchParams, {
      get(obj, key2) {
        if (key2 === "get" || key2 === "getAll" || key2 === "has") {
          return (param) => {
            search_params_callback(param);
            return obj[key2](param);
          };
        }
        callback2();
        const value = Reflect.get(obj, key2);
        return typeof value === "function" ? value.bind(obj) : value;
      }
    }),
    enumerable: true,
    configurable: true
  });
  const tracked_url_properties = ["href", "pathname", "search", "toString", "toJSON"];
  if (allow_hash) tracked_url_properties.push("hash");
  for (const property of tracked_url_properties) {
    Object.defineProperty(tracked, property, {
      get() {
        callback2();
        return url[property];
      },
      enumerable: true,
      configurable: true
    });
  }
  {
    tracked[Symbol.for("nodejs.util.inspect.custom")] = (depth, opts, inspect) => {
      return inspect(url, opts);
    };
    tracked.searchParams[Symbol.for("nodejs.util.inspect.custom")] = (depth, opts, inspect) => {
      return inspect(url.searchParams, opts);
    };
  }
  if (!allow_hash) {
    disable_hash(tracked);
  }
  return tracked;
}
__name(make_trackable, "make_trackable");
function disable_hash(url) {
  allow_nodejs_console_log(url);
  Object.defineProperty(url, "hash", {
    get() {
      throw new Error(
        "Cannot access event.url.hash. Consider using `page.url.hash` inside a component instead"
      );
    }
  });
}
__name(disable_hash, "disable_hash");
function disable_search(url) {
  allow_nodejs_console_log(url);
  for (const property of ["search", "searchParams"]) {
    Object.defineProperty(url, property, {
      get() {
        throw new Error(`Cannot access url.${property} on a page with prerendering enabled`);
      }
    });
  }
}
__name(disable_search, "disable_search");
function allow_nodejs_console_log(url) {
  {
    url[Symbol.for("nodejs.util.inspect.custom")] = (depth, opts, inspect) => {
      return inspect(new URL(url), opts);
    };
  }
}
__name(allow_nodejs_console_log, "allow_nodejs_console_log");
function validator(expected) {
  function validate(module, file) {
    if (!module) return;
    for (const key2 in module) {
      if (key2[0] === "_" || expected.has(key2)) continue;
      const values = [...expected.values()];
      const hint = hint_for_supported_files(key2, file?.slice(file.lastIndexOf("."))) ?? `valid exports are ${values.join(", ")}, or anything with a '_' prefix`;
      throw new Error(`Invalid export '${key2}'${file ? ` in ${file}` : ""} (${hint})`);
    }
  }
  __name(validate, "validate");
  return validate;
}
__name(validator, "validator");
function hint_for_supported_files(key2, ext = ".js") {
  const supported_files = [];
  if (valid_layout_exports.has(key2)) {
    supported_files.push(`+layout${ext}`);
  }
  if (valid_page_exports.has(key2)) {
    supported_files.push(`+page${ext}`);
  }
  if (valid_layout_server_exports.has(key2)) {
    supported_files.push(`+layout.server${ext}`);
  }
  if (valid_page_server_exports.has(key2)) {
    supported_files.push(`+page.server${ext}`);
  }
  if (valid_server_exports.has(key2)) {
    supported_files.push(`+server${ext}`);
  }
  if (supported_files.length > 0) {
    return `'${key2}' is a valid export in ${supported_files.slice(0, -1).join(", ")}${supported_files.length > 1 ? " or " : ""}${supported_files.at(-1)}`;
  }
}
__name(hint_for_supported_files, "hint_for_supported_files");
var internal;
var valid_layout_exports;
var valid_page_exports;
var valid_layout_server_exports;
var valid_page_server_exports;
var valid_server_exports;
var validate_layout_exports;
var validate_page_exports;
var validate_layout_server_exports;
var validate_page_server_exports;
var validate_server_exports;
var init_exports2 = __esm({
  ".svelte-kit/output/server/chunks/exports.js"() {
    internal = new URL("sveltekit-internal://");
    valid_layout_exports = /* @__PURE__ */ new Set([
      "load",
      "prerender",
      "csr",
      "ssr",
      "trailingSlash",
      "config"
    ]);
    valid_page_exports = /* @__PURE__ */ new Set([...valid_layout_exports, "entries"]);
    valid_layout_server_exports = /* @__PURE__ */ new Set([...valid_layout_exports]);
    valid_page_server_exports = /* @__PURE__ */ new Set([...valid_layout_server_exports, "actions", "entries"]);
    valid_server_exports = /* @__PURE__ */ new Set([
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
      "HEAD",
      "fallback",
      "prerender",
      "trailingSlash",
      "config",
      "entries"
    ]);
    validate_layout_exports = validator(valid_layout_exports);
    validate_page_exports = validator(valid_page_exports);
    validate_layout_server_exports = validator(valid_layout_server_exports);
    validate_page_server_exports = validator(valid_page_server_exports);
    validate_server_exports = validator(valid_server_exports);
  }
});
function get_relative_path(from, to) {
  const from_parts = from.split(/[/\\]/);
  const to_parts = to.split(/[/\\]/);
  from_parts.pop();
  while (from_parts[0] === to_parts[0]) {
    from_parts.shift();
    to_parts.shift();
  }
  let i4 = from_parts.length;
  while (i4--) from_parts[i4] = "..";
  return from_parts.concat(to_parts).join("/");
}
__name(get_relative_path, "get_relative_path");
function base64_encode(bytes) {
  if (globalThis.Buffer) {
    return globalThis.Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i4 = 0; i4 < bytes.length; i4++) {
    binary += String.fromCharCode(bytes[i4]);
  }
  return btoa(binary);
}
__name(base64_encode, "base64_encode");
function base64_decode(encoded) {
  if (globalThis.Buffer) {
    const buffer = globalThis.Buffer.from(encoded, "base64");
    return new Uint8Array(buffer);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i4 = 0; i4 < binary.length; i4++) {
    bytes[i4] = binary.charCodeAt(i4);
  }
  return bytes;
}
__name(base64_decode, "base64_decode");
var text_encoder2;
var text_decoder2;
var init_utils2 = __esm({
  ".svelte-kit/output/server/chunks/utils.js"() {
    text_encoder2 = new TextEncoder();
    text_decoder2 = new TextDecoder();
  }
});
function noop() {
}
__name(noop, "noop");
function run(fn) {
  return fn();
}
__name(run, "run");
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
__name(blank_object, "blank_object");
function run_all(fns) {
  fns.forEach(run);
}
__name(run_all, "run_all");
function safe_not_equal(a3, b2) {
  return a3 != a3 ? b2 == b2 : a3 !== b2 || a3 && typeof a3 === "object" || typeof a3 === "function";
}
__name(safe_not_equal, "safe_not_equal");
function subscribe(store, ...callbacks) {
  if (store == null) {
    for (const callback2 of callbacks) {
      callback2(void 0);
    }
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
__name(subscribe, "subscribe");
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
  return new CustomEvent(type, { detail, bubbles, cancelable });
}
__name(custom_event, "custom_event");
function set_current_component(component4) {
  current_component = component4;
}
__name(set_current_component, "set_current_component");
function get_current_component() {
  if (!current_component) throw new Error("Function called outside component initialization");
  return current_component;
}
__name(get_current_component, "get_current_component");
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
__name(onDestroy, "onDestroy");
function createEventDispatcher() {
  const component4 = get_current_component();
  return (type, detail, { cancelable = false } = {}) => {
    const callbacks = component4.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(
        /** @type {string} */
        type,
        detail,
        { cancelable }
      );
      callbacks.slice().forEach((fn) => {
        fn.call(component4, event);
      });
      return !event.defaultPrevented;
    }
    return true;
  };
}
__name(createEventDispatcher, "createEventDispatcher");
function setContext(key2, context) {
  get_current_component().$$.context.set(key2, context);
  return context;
}
__name(setContext, "setContext");
function getContext(key2) {
  return get_current_component().$$.context.get(key2);
}
__name(getContext, "getContext");
function ensure_array_like(array_like_or_iterator) {
  return array_like_or_iterator?.length !== void 0 ? array_like_or_iterator : Array.from(array_like_or_iterator);
}
__name(ensure_array_like, "ensure_array_like");
function escape(value, is_attr = false) {
  const str = String(value);
  const pattern2 = is_attr ? ATTR_REGEX : CONTENT_REGEX;
  pattern2.lastIndex = 0;
  let escaped2 = "";
  let last = 0;
  while (pattern2.test(str)) {
    const i4 = pattern2.lastIndex - 1;
    const ch = str[i4];
    escaped2 += str.substring(last, i4) + (ch === "&" ? "&amp;" : ch === '"' ? "&quot;" : "&lt;");
    last = i4 + 1;
  }
  return escaped2 + str.substring(last);
}
__name(escape, "escape");
function each(items, fn) {
  items = ensure_array_like(items);
  let str = "";
  for (let i4 = 0; i4 < items.length; i4 += 1) {
    str += fn(items[i4], i4);
  }
  return str;
}
__name(each, "each");
function validate_component(component4, name) {
  if (!component4 || !component4.$$render) {
    if (name === "svelte:component") name += " this={...}";
    throw new Error(
      `<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules. Otherwise you may need to fix a <${name}>.`
    );
  }
  return component4;
}
__name(validate_component, "validate_component");
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(context || (parent_component ? parent_component.$$.context : [])),
      // these will be immediately discarded
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  __name($$render, "$$render");
  return {
    render: /* @__PURE__ */ __name((props = {}, { $$slots = {}, context = /* @__PURE__ */ new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: /* @__PURE__ */ new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css3) => css3.code).join("\n"),
          map: null
          // TODO
        },
        head: result.title + result.head
      };
    }, "render"),
    $$render
  };
}
__name(create_ssr_component, "create_ssr_component");
function add_attribute(name, value, boolean) {
  if (value == null || boolean) return "";
  const assignment = `="${escape(value, true)}"`;
  return ` ${name}${assignment}`;
}
__name(add_attribute, "add_attribute");
var current_component;
var ATTR_REGEX;
var CONTENT_REGEX;
var missing_component;
var on_destroy;
var init_ssr = __esm({
  ".svelte-kit/output/server/chunks/ssr.js"() {
    ATTR_REGEX = /[&"<]/g;
    CONTENT_REGEX = /[&<]/g;
    missing_component = {
      $$render: /* @__PURE__ */ __name(() => "", "$$render")
    };
  }
});
function readable(value, start) {
  return {
    subscribe: writable(value, start).subscribe
  };
}
__name(readable, "readable");
function writable(value, start = noop) {
  let stop;
  const subscribers = /* @__PURE__ */ new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i4 = 0; i4 < subscriber_queue.length; i4 += 2) {
            subscriber_queue[i4][0](subscriber_queue[i4 + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  __name(set, "set");
  function update(fn) {
    set(fn(value));
  }
  __name(update, "update");
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set, update) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0 && stop) {
        stop();
        stop = null;
      }
    };
  }
  __name(subscribe2, "subscribe2");
  return { set, update, subscribe: subscribe2 };
}
__name(writable, "writable");
var subscriber_queue;
var init_chunks = __esm({
  ".svelte-kit/output/server/chunks/index.js"() {
    init_ssr();
    subscriber_queue = [];
  }
});
function set_private_env(environment) {
  private_env = environment;
}
__name(set_private_env, "set_private_env");
function set_public_env(environment) {
  public_env = environment;
}
__name(set_public_env, "set_public_env");
var private_env;
var public_env;
var init_shared_server = __esm({
  ".svelte-kit/output/server/chunks/shared-server.js"() {
    private_env = {};
    public_env = {};
  }
});
var require_cookie = __commonJS({
  "node_modules/cookie/index.js"(exports) {
    "use strict";
    exports.parse = parse6;
    exports.serialize = serialize3;
    var __toString2 = Object.prototype.toString;
    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
    function parse6(str, options2) {
      if (typeof str !== "string") {
        throw new TypeError("argument str must be a string");
      }
      var obj = {};
      var opt = options2 || {};
      var dec = opt.decode || decode5;
      var index4 = 0;
      while (index4 < str.length) {
        var eqIdx = str.indexOf("=", index4);
        if (eqIdx === -1) {
          break;
        }
        var endIdx = str.indexOf(";", index4);
        if (endIdx === -1) {
          endIdx = str.length;
        } else if (endIdx < eqIdx) {
          index4 = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        var key2 = str.slice(index4, eqIdx).trim();
        if (void 0 === obj[key2]) {
          var val = str.slice(eqIdx + 1, endIdx).trim();
          if (val.charCodeAt(0) === 34) {
            val = val.slice(1, -1);
          }
          obj[key2] = tryDecode(val, dec);
        }
        index4 = endIdx + 1;
      }
      return obj;
    }
    __name(parse6, "parse6");
    function serialize3(name, val, options2) {
      var opt = options2 || {};
      var enc2 = opt.encode || encode5;
      if (typeof enc2 !== "function") {
        throw new TypeError("option encode is invalid");
      }
      if (!fieldContentRegExp.test(name)) {
        throw new TypeError("argument name is invalid");
      }
      var value = enc2(val);
      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError("argument val is invalid");
      }
      var str = name + "=" + value;
      if (null != opt.maxAge) {
        var maxAge = opt.maxAge - 0;
        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError("option maxAge is invalid");
        }
        str += "; Max-Age=" + Math.floor(maxAge);
      }
      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError("option domain is invalid");
        }
        str += "; Domain=" + opt.domain;
      }
      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError("option path is invalid");
        }
        str += "; Path=" + opt.path;
      }
      if (opt.expires) {
        var expires = opt.expires;
        if (!isDate2(expires) || isNaN(expires.valueOf())) {
          throw new TypeError("option expires is invalid");
        }
        str += "; Expires=" + expires.toUTCString();
      }
      if (opt.httpOnly) {
        str += "; HttpOnly";
      }
      if (opt.secure) {
        str += "; Secure";
      }
      if (opt.partitioned) {
        str += "; Partitioned";
      }
      if (opt.priority) {
        var priority = typeof opt.priority === "string" ? opt.priority.toLowerCase() : opt.priority;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError("option priority is invalid");
        }
      }
      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
        switch (sameSite) {
          case true:
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError("option sameSite is invalid");
        }
      }
      return str;
    }
    __name(serialize3, "serialize3");
    function decode5(str) {
      return str.indexOf("%") !== -1 ? decodeURIComponent(str) : str;
    }
    __name(decode5, "decode5");
    function encode5(val) {
      return encodeURIComponent(val);
    }
    __name(encode5, "encode5");
    function isDate2(val) {
      return __toString2.call(val) === "[object Date]" || val instanceof Date;
    }
    __name(isDate2, "isDate2");
    function tryDecode(str, decode6) {
      try {
        return decode6(str);
      } catch (e3) {
        return str;
      }
    }
    __name(tryDecode, "tryDecode");
  }
});
var require_set_cookie = __commonJS({
  "node_modules/set-cookie-parser/lib/set-cookie.js"(exports, module) {
    "use strict";
    var defaultParseOptions = {
      decodeValues: true,
      map: false,
      silent: false
    };
    function isNonEmptyString(str) {
      return typeof str === "string" && !!str.trim();
    }
    __name(isNonEmptyString, "isNonEmptyString");
    function parseString2(setCookieValue, options2) {
      var parts = setCookieValue.split(";").filter(isNonEmptyString);
      var nameValuePairStr = parts.shift();
      var parsed = parseNameValuePair(nameValuePairStr);
      var name = parsed.name;
      var value = parsed.value;
      options2 = options2 ? Object.assign({}, defaultParseOptions, options2) : defaultParseOptions;
      try {
        value = options2.decodeValues ? decodeURIComponent(value) : value;
      } catch (e3) {
        console.error(
          "set-cookie-parser encountered an error while decoding a cookie with value '" + value + "'. Set options.decodeValues to false to disable this feature.",
          e3
        );
      }
      var cookie = {
        name,
        value
      };
      parts.forEach(function(part) {
        var sides = part.split("=");
        var key2 = sides.shift().trimLeft().toLowerCase();
        var value2 = sides.join("=");
        if (key2 === "expires") {
          cookie.expires = new Date(value2);
        } else if (key2 === "max-age") {
          cookie.maxAge = parseInt(value2, 10);
        } else if (key2 === "secure") {
          cookie.secure = true;
        } else if (key2 === "httponly") {
          cookie.httpOnly = true;
        } else if (key2 === "samesite") {
          cookie.sameSite = value2;
        } else if (key2 === "partitioned") {
          cookie.partitioned = true;
        } else {
          cookie[key2] = value2;
        }
      });
      return cookie;
    }
    __name(parseString2, "parseString2");
    function parseNameValuePair(nameValuePairStr) {
      var name = "";
      var value = "";
      var nameValueArr = nameValuePairStr.split("=");
      if (nameValueArr.length > 1) {
        name = nameValueArr.shift();
        value = nameValueArr.join("=");
      } else {
        value = nameValuePairStr;
      }
      return { name, value };
    }
    __name(parseNameValuePair, "parseNameValuePair");
    function parse6(input, options2) {
      options2 = options2 ? Object.assign({}, defaultParseOptions, options2) : defaultParseOptions;
      if (!input) {
        if (!options2.map) {
          return [];
        } else {
          return {};
        }
      }
      if (input.headers) {
        if (typeof input.headers.getSetCookie === "function") {
          input = input.headers.getSetCookie();
        } else if (input.headers["set-cookie"]) {
          input = input.headers["set-cookie"];
        } else {
          var sch = input.headers[Object.keys(input.headers).find(function(key2) {
            return key2.toLowerCase() === "set-cookie";
          })];
          if (!sch && input.headers.cookie && !options2.silent) {
            console.warn(
              "Warning: set-cookie-parser appears to have been called on a request object. It is designed to parse Set-Cookie headers from responses, not Cookie headers from requests. Set the option {silent: true} to suppress this warning."
            );
          }
          input = sch;
        }
      }
      if (!Array.isArray(input)) {
        input = [input];
      }
      if (!options2.map) {
        return input.filter(isNonEmptyString).map(function(str) {
          return parseString2(str, options2);
        });
      } else {
        var cookies = {};
        return input.filter(isNonEmptyString).reduce(function(cookies2, str) {
          var cookie = parseString2(str, options2);
          cookies2[cookie.name] = cookie;
          return cookies2;
        }, cookies);
      }
    }
    __name(parse6, "parse6");
    function splitCookiesString2(cookiesString) {
      if (Array.isArray(cookiesString)) {
        return cookiesString;
      }
      if (typeof cookiesString !== "string") {
        return [];
      }
      var cookiesStrings = [];
      var pos = 0;
      var start;
      var ch;
      var lastComma;
      var nextStart;
      var cookiesSeparatorFound;
      function skipWhitespace() {
        while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
          pos += 1;
        }
        return pos < cookiesString.length;
      }
      __name(skipWhitespace, "skipWhitespace");
      function notSpecialChar() {
        ch = cookiesString.charAt(pos);
        return ch !== "=" && ch !== ";" && ch !== ",";
      }
      __name(notSpecialChar, "notSpecialChar");
      while (pos < cookiesString.length) {
        start = pos;
        cookiesSeparatorFound = false;
        while (skipWhitespace()) {
          ch = cookiesString.charAt(pos);
          if (ch === ",") {
            lastComma = pos;
            pos += 1;
            skipWhitespace();
            nextStart = pos;
            while (pos < cookiesString.length && notSpecialChar()) {
              pos += 1;
            }
            if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
              cookiesSeparatorFound = true;
              pos = nextStart;
              cookiesStrings.push(cookiesString.substring(start, lastComma));
              start = pos;
            } else {
              pos = lastComma + 1;
            }
          } else {
            pos += 1;
          }
        }
        if (!cookiesSeparatorFound || pos >= cookiesString.length) {
          cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
        }
      }
      return cookiesStrings;
    }
    __name(splitCookiesString2, "splitCookiesString2");
    module.exports = parse6;
    module.exports.parse = parse6;
    module.exports.parseString = parseString2;
    module.exports.splitCookiesString = splitCookiesString2;
  }
});
function onMount() {
}
__name(onMount, "onMount");
function afterUpdate() {
}
__name(afterUpdate, "afterUpdate");
var init_ssr2 = __esm({
  ".svelte-kit/output/server/chunks/ssr2.js"() {
  }
});
function defaultCookies(useSecureCookies) {
  const cookiePrefix = useSecureCookies ? "__Secure-" : "";
  return {
    // default cookie options
    sessionToken: {
      name: `${cookiePrefix}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies
      }
    },
    callbackUrl: {
      name: `${cookiePrefix}authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies
      }
    },
    csrfToken: {
      // Default to __Host- for CSRF token for additional protection if using useSecureCookies
      // NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
      name: `${useSecureCookies ? "__Host-" : ""}authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies
      }
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}authjs.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15
        // 15 minutes in seconds
      }
    },
    state: {
      name: `${cookiePrefix}authjs.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15
        // 15 minutes in seconds
      }
    },
    nonce: {
      name: `${cookiePrefix}authjs.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies
      }
    },
    webauthnChallenge: {
      name: `${cookiePrefix}authjs.challenge`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15
        // 15 minutes in seconds
      }
    }
  };
}
__name(defaultCookies, "defaultCookies");
var __classPrivateFieldSet;
var __classPrivateFieldGet;
var _SessionStore_instances;
var _SessionStore_chunks;
var _SessionStore_option;
var _SessionStore_logger;
var _SessionStore_chunk;
var _SessionStore_clean;
var ALLOWED_COOKIE_SIZE;
var ESTIMATED_EMPTY_COOKIE_SIZE;
var CHUNK_SIZE;
var SessionStore;
var init_cookie = __esm({
  "node_modules/@auth/core/lib/utils/cookie.js"() {
    __classPrivateFieldSet = /* @__PURE__ */ __name(function(receiver, state2, value, kind, f4) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f4) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state2 === "function" ? receiver !== state2 || !f4 : !state2.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f4.call(receiver, value) : f4 ? f4.value = value : state2.set(receiver, value), value;
    }, "__classPrivateFieldSet");
    __classPrivateFieldGet = /* @__PURE__ */ __name(function(receiver, state2, kind, f4) {
      if (kind === "a" && !f4) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state2 === "function" ? receiver !== state2 || !f4 : !state2.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f4 : kind === "a" ? f4.call(receiver) : f4 ? f4.value : state2.get(receiver);
    }, "__classPrivateFieldGet");
    ALLOWED_COOKIE_SIZE = 4096;
    ESTIMATED_EMPTY_COOKIE_SIZE = 160;
    CHUNK_SIZE = ALLOWED_COOKIE_SIZE - ESTIMATED_EMPTY_COOKIE_SIZE;
    SessionStore = class {
      static {
        __name(this, "SessionStore");
      }
      constructor(option, cookies, logger) {
        _SessionStore_instances.add(this);
        _SessionStore_chunks.set(this, {});
        _SessionStore_option.set(this, void 0);
        _SessionStore_logger.set(this, void 0);
        __classPrivateFieldSet(this, _SessionStore_logger, logger, "f");
        __classPrivateFieldSet(this, _SessionStore_option, option, "f");
        if (!cookies)
          return;
        const { name: sessionCookiePrefix } = option;
        for (const [name, value] of Object.entries(cookies)) {
          if (!name.startsWith(sessionCookiePrefix) || !value)
            continue;
          __classPrivateFieldGet(this, _SessionStore_chunks, "f")[name] = value;
        }
      }
      /**
       * The JWT Session or database Session ID
       * constructed from the cookie chunks.
       */
      get value() {
        const sortedKeys = Object.keys(__classPrivateFieldGet(this, _SessionStore_chunks, "f")).sort((a3, b2) => {
          const aSuffix = parseInt(a3.split(".").pop() || "0");
          const bSuffix = parseInt(b2.split(".").pop() || "0");
          return aSuffix - bSuffix;
        });
        return sortedKeys.map((key2) => __classPrivateFieldGet(this, _SessionStore_chunks, "f")[key2]).join("");
      }
      /**
       * Given a cookie value, return new cookies, chunked, to fit the allowed cookie size.
       * If the cookie has changed from chunked to unchunked or vice versa,
       * it deletes the old cookies as well.
       */
      chunk(value, options2) {
        const cookies = __classPrivateFieldGet(this, _SessionStore_instances, "m", _SessionStore_clean).call(this);
        const chunked = __classPrivateFieldGet(this, _SessionStore_instances, "m", _SessionStore_chunk).call(this, {
          name: __classPrivateFieldGet(this, _SessionStore_option, "f").name,
          value,
          options: { ...__classPrivateFieldGet(this, _SessionStore_option, "f").options, ...options2 }
        });
        for (const chunk of chunked) {
          cookies[chunk.name] = chunk;
        }
        return Object.values(cookies);
      }
      /** Returns a list of cookies that should be cleaned. */
      clean() {
        return Object.values(__classPrivateFieldGet(this, _SessionStore_instances, "m", _SessionStore_clean).call(this));
      }
    };
    _SessionStore_chunks = /* @__PURE__ */ new WeakMap(), _SessionStore_option = /* @__PURE__ */ new WeakMap(), _SessionStore_logger = /* @__PURE__ */ new WeakMap(), _SessionStore_instances = /* @__PURE__ */ new WeakSet(), _SessionStore_chunk = /* @__PURE__ */ __name(function _SessionStore_chunk2(cookie) {
      const chunkCount = Math.ceil(cookie.value.length / CHUNK_SIZE);
      if (chunkCount === 1) {
        __classPrivateFieldGet(this, _SessionStore_chunks, "f")[cookie.name] = cookie.value;
        return [cookie];
      }
      const cookies = [];
      for (let i4 = 0; i4 < chunkCount; i4++) {
        const name = `${cookie.name}.${i4}`;
        const value = cookie.value.substr(i4 * CHUNK_SIZE, CHUNK_SIZE);
        cookies.push({ ...cookie, name, value });
        __classPrivateFieldGet(this, _SessionStore_chunks, "f")[name] = value;
      }
      __classPrivateFieldGet(this, _SessionStore_logger, "f").debug("CHUNKING_SESSION_COOKIE", {
        message: `Session cookie exceeds allowed ${ALLOWED_COOKIE_SIZE} bytes.`,
        emptyCookieSize: ESTIMATED_EMPTY_COOKIE_SIZE,
        valueSize: cookie.value.length,
        chunks: cookies.map((c4) => c4.value.length + ESTIMATED_EMPTY_COOKIE_SIZE)
      });
      return cookies;
    }, "_SessionStore_chunk2"), _SessionStore_clean = /* @__PURE__ */ __name(function _SessionStore_clean2() {
      const cleanedChunks = {};
      for (const name in __classPrivateFieldGet(this, _SessionStore_chunks, "f")) {
        delete __classPrivateFieldGet(this, _SessionStore_chunks, "f")?.[name];
        cleanedChunks[name] = {
          name,
          value: "",
          options: { ...__classPrivateFieldGet(this, _SessionStore_option, "f").options, maxAge: 0 }
        };
      }
      return cleanedChunks;
    }, "_SessionStore_clean2");
  }
});
function isClientError(error2) {
  if (error2 instanceof AuthError)
    return clientErrors.has(error2.type);
  return false;
}
__name(isClientError, "isClientError");
var AuthError;
var SignInError;
var AdapterError;
var AccessDenied;
var CallbackRouteError;
var ErrorPageLoop;
var EventError;
var InvalidCallbackUrl;
var CredentialsSignin;
var InvalidEndpoints;
var InvalidCheck;
var JWTSessionError;
var MissingAdapter;
var MissingAdapterMethods;
var MissingAuthorize;
var MissingSecret;
var OAuthAccountNotLinked;
var OAuthCallbackError;
var OAuthProfileParseError;
var SessionTokenError;
var OAuthSignInError;
var EmailSignInError;
var SignOutError;
var UnknownAction;
var UnsupportedStrategy;
var InvalidProvider;
var UntrustedHost;
var Verification;
var MissingCSRF;
var clientErrors;
var DuplicateConditionalUI;
var MissingWebAuthnAutocomplete;
var WebAuthnVerificationError;
var AccountNotLinked;
var ExperimentalFeatureNotEnabled;
var init_errors = __esm({
  "node_modules/@auth/core/errors.js"() {
    AuthError = class extends Error {
      static {
        __name(this, "AuthError");
      }
      constructor(message2, errorOptions) {
        if (message2 instanceof Error) {
          super(void 0, {
            cause: { err: message2, ...message2.cause, ...errorOptions }
          });
        } else if (typeof message2 === "string") {
          if (errorOptions instanceof Error) {
            errorOptions = { err: errorOptions, ...errorOptions.cause };
          }
          super(message2, errorOptions);
        } else {
          super(void 0, message2);
        }
        this.name = this.constructor.name;
        this.type = this.constructor.type ?? "AuthError";
        this.kind = this.constructor.kind ?? "error";
        Error.captureStackTrace?.(this, this.constructor);
        const url = `https://errors.authjs.dev#${this.type.toLowerCase()}`;
        this.message += `${this.message ? ". " : ""}Read more at ${url}`;
      }
    };
    SignInError = class extends AuthError {
      static {
        __name(this, "SignInError");
      }
    };
    SignInError.kind = "signIn";
    AdapterError = class extends AuthError {
      static {
        __name(this, "AdapterError");
      }
    };
    AdapterError.type = "AdapterError";
    AccessDenied = class extends AuthError {
      static {
        __name(this, "AccessDenied");
      }
    };
    AccessDenied.type = "AccessDenied";
    CallbackRouteError = class extends AuthError {
      static {
        __name(this, "CallbackRouteError");
      }
    };
    CallbackRouteError.type = "CallbackRouteError";
    ErrorPageLoop = class extends AuthError {
      static {
        __name(this, "ErrorPageLoop");
      }
    };
    ErrorPageLoop.type = "ErrorPageLoop";
    EventError = class extends AuthError {
      static {
        __name(this, "EventError");
      }
    };
    EventError.type = "EventError";
    InvalidCallbackUrl = class extends AuthError {
      static {
        __name(this, "InvalidCallbackUrl");
      }
    };
    InvalidCallbackUrl.type = "InvalidCallbackUrl";
    CredentialsSignin = class extends SignInError {
      static {
        __name(this, "CredentialsSignin");
      }
      constructor() {
        super(...arguments);
        this.code = "credentials";
      }
    };
    CredentialsSignin.type = "CredentialsSignin";
    InvalidEndpoints = class extends AuthError {
      static {
        __name(this, "InvalidEndpoints");
      }
    };
    InvalidEndpoints.type = "InvalidEndpoints";
    InvalidCheck = class extends AuthError {
      static {
        __name(this, "InvalidCheck");
      }
    };
    InvalidCheck.type = "InvalidCheck";
    JWTSessionError = class extends AuthError {
      static {
        __name(this, "JWTSessionError");
      }
    };
    JWTSessionError.type = "JWTSessionError";
    MissingAdapter = class extends AuthError {
      static {
        __name(this, "MissingAdapter");
      }
    };
    MissingAdapter.type = "MissingAdapter";
    MissingAdapterMethods = class extends AuthError {
      static {
        __name(this, "MissingAdapterMethods");
      }
    };
    MissingAdapterMethods.type = "MissingAdapterMethods";
    MissingAuthorize = class extends AuthError {
      static {
        __name(this, "MissingAuthorize");
      }
    };
    MissingAuthorize.type = "MissingAuthorize";
    MissingSecret = class extends AuthError {
      static {
        __name(this, "MissingSecret");
      }
    };
    MissingSecret.type = "MissingSecret";
    OAuthAccountNotLinked = class extends SignInError {
      static {
        __name(this, "OAuthAccountNotLinked");
      }
    };
    OAuthAccountNotLinked.type = "OAuthAccountNotLinked";
    OAuthCallbackError = class extends SignInError {
      static {
        __name(this, "OAuthCallbackError");
      }
    };
    OAuthCallbackError.type = "OAuthCallbackError";
    OAuthProfileParseError = class extends AuthError {
      static {
        __name(this, "OAuthProfileParseError");
      }
    };
    OAuthProfileParseError.type = "OAuthProfileParseError";
    SessionTokenError = class extends AuthError {
      static {
        __name(this, "SessionTokenError");
      }
    };
    SessionTokenError.type = "SessionTokenError";
    OAuthSignInError = class extends SignInError {
      static {
        __name(this, "OAuthSignInError");
      }
    };
    OAuthSignInError.type = "OAuthSignInError";
    EmailSignInError = class extends SignInError {
      static {
        __name(this, "EmailSignInError");
      }
    };
    EmailSignInError.type = "EmailSignInError";
    SignOutError = class extends AuthError {
      static {
        __name(this, "SignOutError");
      }
    };
    SignOutError.type = "SignOutError";
    UnknownAction = class extends AuthError {
      static {
        __name(this, "UnknownAction");
      }
    };
    UnknownAction.type = "UnknownAction";
    UnsupportedStrategy = class extends AuthError {
      static {
        __name(this, "UnsupportedStrategy");
      }
    };
    UnsupportedStrategy.type = "UnsupportedStrategy";
    InvalidProvider = class extends AuthError {
      static {
        __name(this, "InvalidProvider");
      }
    };
    InvalidProvider.type = "InvalidProvider";
    UntrustedHost = class extends AuthError {
      static {
        __name(this, "UntrustedHost");
      }
    };
    UntrustedHost.type = "UntrustedHost";
    Verification = class extends AuthError {
      static {
        __name(this, "Verification");
      }
    };
    Verification.type = "Verification";
    MissingCSRF = class extends SignInError {
      static {
        __name(this, "MissingCSRF");
      }
    };
    MissingCSRF.type = "MissingCSRF";
    clientErrors = /* @__PURE__ */ new Set([
      "CredentialsSignin",
      "OAuthAccountNotLinked",
      "OAuthCallbackError",
      "AccessDenied",
      "Verification",
      "MissingCSRF",
      "AccountNotLinked",
      "WebAuthnVerificationError"
    ]);
    DuplicateConditionalUI = class extends AuthError {
      static {
        __name(this, "DuplicateConditionalUI");
      }
    };
    DuplicateConditionalUI.type = "DuplicateConditionalUI";
    MissingWebAuthnAutocomplete = class extends AuthError {
      static {
        __name(this, "MissingWebAuthnAutocomplete");
      }
    };
    MissingWebAuthnAutocomplete.type = "MissingWebAuthnAutocomplete";
    WebAuthnVerificationError = class extends AuthError {
      static {
        __name(this, "WebAuthnVerificationError");
      }
    };
    WebAuthnVerificationError.type = "WebAuthnVerificationError";
    AccountNotLinked = class extends SignInError {
      static {
        __name(this, "AccountNotLinked");
      }
    };
    AccountNotLinked.type = "AccountNotLinked";
    ExperimentalFeatureNotEnabled = class extends AuthError {
      static {
        __name(this, "ExperimentalFeatureNotEnabled");
      }
    };
    ExperimentalFeatureNotEnabled.type = "ExperimentalFeatureNotEnabled";
  }
});
function isValidHttpUrl(url, baseUrl) {
  try {
    return /^https?:/.test(new URL(url, url.startsWith("/") ? baseUrl : void 0).protocol);
  } catch {
    return false;
  }
}
__name(isValidHttpUrl, "isValidHttpUrl");
function isSemverString(version) {
  return /^v\d+(?:\.\d+){0,2}$/.test(version);
}
__name(isSemverString, "isSemverString");
function assertConfig(request, options2) {
  const { url } = request;
  const warnings = [];
  if (!warned && options2.debug)
    warnings.push("debug-enabled");
  if (!options2.trustHost) {
    return new UntrustedHost(`Host must be trusted. URL was: ${request.url}`);
  }
  if (!options2.secret?.length) {
    return new MissingSecret("Please define a `secret`");
  }
  const callbackUrlParam = request.query?.callbackUrl;
  if (callbackUrlParam && !isValidHttpUrl(callbackUrlParam, url.origin)) {
    return new InvalidCallbackUrl(`Invalid callback URL. Received: ${callbackUrlParam}`);
  }
  const { callbackUrl: defaultCallbackUrl } = defaultCookies(options2.useSecureCookies ?? url.protocol === "https:");
  const callbackUrlCookie = request.cookies?.[options2.cookies?.callbackUrl?.name ?? defaultCallbackUrl.name];
  if (callbackUrlCookie && !isValidHttpUrl(callbackUrlCookie, url.origin)) {
    return new InvalidCallbackUrl(`Invalid callback URL. Received: ${callbackUrlCookie}`);
  }
  let hasConditionalUIProvider = false;
  for (const p3 of options2.providers) {
    const provider = typeof p3 === "function" ? p3() : p3;
    if ((provider.type === "oauth" || provider.type === "oidc") && !(provider.issuer ?? provider.options?.issuer)) {
      const { authorization: a3, token: t3, userinfo: u4 } = provider;
      let key2;
      if (typeof a3 !== "string" && !a3?.url)
        key2 = "authorization";
      else if (typeof t3 !== "string" && !t3?.url)
        key2 = "token";
      else if (typeof u4 !== "string" && !u4?.url)
        key2 = "userinfo";
      if (key2) {
        return new InvalidEndpoints(`Provider "${provider.id}" is missing both \`issuer\` and \`${key2}\` endpoint config. At least one of them is required`);
      }
    }
    if (provider.type === "credentials")
      hasCredentials = true;
    else if (provider.type === "email")
      hasEmail = true;
    else if (provider.type === "webauthn") {
      hasWebAuthn = true;
      if (provider.simpleWebAuthnBrowserVersion && !isSemverString(provider.simpleWebAuthnBrowserVersion)) {
        return new AuthError(`Invalid provider config for "${provider.id}": simpleWebAuthnBrowserVersion "${provider.simpleWebAuthnBrowserVersion}" must be a valid semver string.`);
      }
      if (provider.enableConditionalUI) {
        if (hasConditionalUIProvider) {
          return new DuplicateConditionalUI(`Multiple webauthn providers have 'enableConditionalUI' set to True. Only one provider can have this option enabled at a time`);
        }
        hasConditionalUIProvider = true;
        const hasWebauthnFormField = Object.values(provider.formFields).some((f4) => f4.autocomplete && f4.autocomplete.toString().indexOf("webauthn") > -1);
        if (!hasWebauthnFormField) {
          return new MissingWebAuthnAutocomplete(`Provider "${provider.id}" has 'enableConditionalUI' set to True, but none of its formFields have 'webauthn' in their autocomplete param`);
        }
      }
    }
  }
  if (hasCredentials) {
    const dbStrategy = options2.session?.strategy === "database";
    const onlyCredentials = !options2.providers.some((p3) => (typeof p3 === "function" ? p3() : p3).type !== "credentials");
    if (dbStrategy && onlyCredentials) {
      return new UnsupportedStrategy("Signing in with credentials only supported if JWT strategy is enabled");
    }
    const credentialsNoAuthorize = options2.providers.some((p3) => {
      const provider = typeof p3 === "function" ? p3() : p3;
      return provider.type === "credentials" && !provider.authorize;
    });
    if (credentialsNoAuthorize) {
      return new MissingAuthorize("Must define an authorize() handler to use credentials authentication provider");
    }
  }
  const { adapter, session: session2 } = options2;
  const requiredMethods = [];
  if (hasEmail || session2?.strategy === "database" || !session2?.strategy && adapter) {
    if (hasEmail) {
      if (!adapter)
        return new MissingAdapter("Email login requires an adapter");
      requiredMethods.push(...emailMethods);
    } else {
      if (!adapter)
        return new MissingAdapter("Database session requires an adapter");
      requiredMethods.push(...sessionMethods);
    }
  }
  if (hasWebAuthn) {
    if (options2.experimental?.enableWebAuthn) {
      warnings.push("experimental-webauthn");
    } else {
      return new ExperimentalFeatureNotEnabled("WebAuthn is an experimental feature. To enable it, set `experimental.enableWebAuthn` to `true` in your config");
    }
    if (!adapter)
      return new MissingAdapter("WebAuthn requires an adapter");
    requiredMethods.push(...webauthnMethods);
  }
  if (adapter) {
    const missing = requiredMethods.filter((m) => !(m in adapter));
    if (missing.length) {
      return new MissingAdapterMethods(`Required adapter methods were missing: ${missing.join(", ")}`);
    }
  }
  if (!warned)
    warned = true;
  return warnings;
}
__name(assertConfig, "assertConfig");
var warned;
var hasCredentials;
var hasEmail;
var hasWebAuthn;
var emailMethods;
var sessionMethods;
var webauthnMethods;
var init_assert = __esm({
  "node_modules/@auth/core/lib/utils/assert.js"() {
    init_cookie();
    init_errors();
    warned = false;
    hasCredentials = false;
    hasEmail = false;
    hasWebAuthn = false;
    emailMethods = [
      "createVerificationToken",
      "useVerificationToken",
      "getUserByEmail"
    ];
    sessionMethods = [
      "createUser",
      "getUser",
      "getUserByEmail",
      "getUserByAccount",
      "updateUser",
      "linkAccount",
      "createSession",
      "getSessionAndUser",
      "updateSession",
      "deleteSession"
    ];
    webauthnMethods = [
      "createUser",
      "getUser",
      "linkAccount",
      "getAccount",
      "getAuthenticator",
      "createAuthenticator",
      "listAuthenticatorsByUserId",
      "updateAuthenticatorCounter"
    ];
  }
});
var getGlobal;
var hkdf_default;
var init_hkdf = __esm({
  "node_modules/@panva/hkdf/dist/web/runtime/hkdf.js"() {
    getGlobal = /* @__PURE__ */ __name(() => {
      if (typeof globalThis !== "undefined")
        return globalThis;
      if (typeof self !== "undefined")
        return self;
      if (typeof window !== "undefined")
        return window;
      throw new Error("unable to locate global object");
    }, "getGlobal");
    hkdf_default = /* @__PURE__ */ __name(async (digest2, ikm, salt, info, keylen) => {
      const { crypto: { subtle } } = getGlobal();
      return new Uint8Array(await subtle.deriveBits({
        name: "HKDF",
        hash: `SHA-${digest2.substr(3)}`,
        salt,
        info
      }, await subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]), keylen << 3));
    }, "hkdf_default");
  }
});
function normalizeDigest(digest2) {
  switch (digest2) {
    case "sha256":
    case "sha384":
    case "sha512":
    case "sha1":
      return digest2;
    default:
      throw new TypeError('unsupported "digest" value');
  }
}
__name(normalizeDigest, "normalizeDigest");
function normalizeUint8Array(input, label) {
  if (typeof input === "string")
    return new TextEncoder().encode(input);
  if (!(input instanceof Uint8Array))
    throw new TypeError(`"${label}"" must be an instance of Uint8Array or a string`);
  return input;
}
__name(normalizeUint8Array, "normalizeUint8Array");
function normalizeIkm(input) {
  const ikm = normalizeUint8Array(input, "ikm");
  if (!ikm.byteLength)
    throw new TypeError(`"ikm" must be at least one byte in length`);
  return ikm;
}
__name(normalizeIkm, "normalizeIkm");
function normalizeInfo(input) {
  const info = normalizeUint8Array(input, "info");
  if (info.byteLength > 1024) {
    throw TypeError('"info" must not contain more than 1024 bytes');
  }
  return info;
}
__name(normalizeInfo, "normalizeInfo");
function normalizeKeylen(input, digest2) {
  if (typeof input !== "number" || !Number.isInteger(input) || input < 1) {
    throw new TypeError('"keylen" must be a positive integer');
  }
  const hashlen = parseInt(digest2.substr(3), 10) >> 3 || 20;
  if (input > 255 * hashlen) {
    throw new TypeError('"keylen" too large');
  }
  return input;
}
__name(normalizeKeylen, "normalizeKeylen");
async function hkdf(digest2, ikm, salt, info, keylen) {
  return hkdf_default(normalizeDigest(digest2), normalizeIkm(ikm), normalizeUint8Array(salt, "salt"), normalizeInfo(info), normalizeKeylen(keylen, digest2));
}
__name(hkdf, "hkdf");
var init_web = __esm({
  "node_modules/@panva/hkdf/dist/web/index.js"() {
    init_hkdf();
  }
});
var webcrypto_default;
var isCryptoKey;
var init_webcrypto = __esm({
  "node_modules/jose/dist/browser/runtime/webcrypto.js"() {
    webcrypto_default = crypto;
    isCryptoKey = /* @__PURE__ */ __name((key2) => key2 instanceof CryptoKey, "isCryptoKey");
  }
});
var digest;
var digest_default;
var init_digest = __esm({
  "node_modules/jose/dist/browser/runtime/digest.js"() {
    init_webcrypto();
    digest = /* @__PURE__ */ __name(async (algorithm, data) => {
      const subtleDigest = `SHA-${algorithm.slice(-3)}`;
      return new Uint8Array(await webcrypto_default.subtle.digest(subtleDigest, data));
    }, "digest");
    digest_default = digest;
  }
});
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf2 = new Uint8Array(size);
  let i4 = 0;
  for (const buffer of buffers) {
    buf2.set(buffer, i4);
    i4 += buffer.length;
  }
  return buf2;
}
__name(concat, "concat");
function p2s(alg2, p2sInput) {
  return concat(encoder.encode(alg2), new Uint8Array([0]), p2sInput);
}
__name(p2s, "p2s");
function writeUInt32BE(buf2, value, offset) {
  if (value < 0 || value >= MAX_INT32) {
    throw new RangeError(`value must be >= 0 and <= ${MAX_INT32 - 1}. Received ${value}`);
  }
  buf2.set([value >>> 24, value >>> 16, value >>> 8, value & 255], offset);
}
__name(writeUInt32BE, "writeUInt32BE");
function uint64be(value) {
  const high = Math.floor(value / MAX_INT32);
  const low = value % MAX_INT32;
  const buf2 = new Uint8Array(8);
  writeUInt32BE(buf2, high, 0);
  writeUInt32BE(buf2, low, 4);
  return buf2;
}
__name(uint64be, "uint64be");
function uint32be(value) {
  const buf2 = new Uint8Array(4);
  writeUInt32BE(buf2, value);
  return buf2;
}
__name(uint32be, "uint32be");
function lengthAndInput(input) {
  return concat(uint32be(input.length), input);
}
__name(lengthAndInput, "lengthAndInput");
async function concatKdf(secret, bits, value) {
  const iterations = Math.ceil((bits >> 3) / 32);
  const res = new Uint8Array(iterations * 32);
  for (let iter = 0; iter < iterations; iter++) {
    const buf2 = new Uint8Array(4 + secret.length + value.length);
    buf2.set(uint32be(iter + 1));
    buf2.set(secret, 4);
    buf2.set(value, 4 + secret.length);
    res.set(await digest_default("sha256", buf2), iter * 32);
  }
  return res.slice(0, bits >> 3);
}
__name(concatKdf, "concatKdf");
var encoder;
var decoder;
var MAX_INT32;
var init_buffer_utils = __esm({
  "node_modules/jose/dist/browser/lib/buffer_utils.js"() {
    init_digest();
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    MAX_INT32 = 2 ** 32;
  }
});
var encodeBase64;
var encode;
var decodeBase64;
var decode;
var init_base64url = __esm({
  "node_modules/jose/dist/browser/runtime/base64url.js"() {
    init_buffer_utils();
    encodeBase64 = /* @__PURE__ */ __name((input) => {
      let unencoded = input;
      if (typeof unencoded === "string") {
        unencoded = encoder.encode(unencoded);
      }
      const CHUNK_SIZE2 = 32768;
      const arr = [];
      for (let i4 = 0; i4 < unencoded.length; i4 += CHUNK_SIZE2) {
        arr.push(String.fromCharCode.apply(null, unencoded.subarray(i4, i4 + CHUNK_SIZE2)));
      }
      return btoa(arr.join(""));
    }, "encodeBase64");
    encode = /* @__PURE__ */ __name((input) => {
      return encodeBase64(input).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }, "encode");
    decodeBase64 = /* @__PURE__ */ __name((encoded) => {
      const binary = atob(encoded);
      const bytes = new Uint8Array(binary.length);
      for (let i4 = 0; i4 < binary.length; i4++) {
        bytes[i4] = binary.charCodeAt(i4);
      }
      return bytes;
    }, "decodeBase64");
    decode = /* @__PURE__ */ __name((input) => {
      let encoded = input;
      if (encoded instanceof Uint8Array) {
        encoded = decoder.decode(encoded);
      }
      encoded = encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
      try {
        return decodeBase64(encoded);
      } catch {
        throw new TypeError("The input to be decoded is not correctly encoded.");
      }
    }, "decode");
  }
});
var JOSEError;
var JWTClaimValidationFailed;
var JWTExpired;
var JOSEAlgNotAllowed;
var JOSENotSupported;
var JWEDecryptionFailed;
var JWEInvalid;
var JWSInvalid;
var JWTInvalid;
var JWKInvalid;
var JWKSInvalid;
var JWKSNoMatchingKey;
var JWKSMultipleMatchingKeys;
var JWKSTimeout;
var JWSSignatureVerificationFailed;
var init_errors2 = __esm({
  "node_modules/jose/dist/browser/util/errors.js"() {
    JOSEError = class extends Error {
      static {
        __name(this, "JOSEError");
      }
      constructor(message2, options2) {
        super(message2, options2);
        this.code = "ERR_JOSE_GENERIC";
        this.name = this.constructor.name;
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    JOSEError.code = "ERR_JOSE_GENERIC";
    JWTClaimValidationFailed = class extends JOSEError {
      static {
        __name(this, "JWTClaimValidationFailed");
      }
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } });
        this.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    JWTClaimValidationFailed.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
    JWTExpired = class extends JOSEError {
      static {
        __name(this, "JWTExpired");
      }
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } });
        this.code = "ERR_JWT_EXPIRED";
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    JWTExpired.code = "ERR_JWT_EXPIRED";
    JOSEAlgNotAllowed = class extends JOSEError {
      static {
        __name(this, "JOSEAlgNotAllowed");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JOSE_ALG_NOT_ALLOWED";
      }
    };
    JOSEAlgNotAllowed.code = "ERR_JOSE_ALG_NOT_ALLOWED";
    JOSENotSupported = class extends JOSEError {
      static {
        __name(this, "JOSENotSupported");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JOSE_NOT_SUPPORTED";
      }
    };
    JOSENotSupported.code = "ERR_JOSE_NOT_SUPPORTED";
    JWEDecryptionFailed = class extends JOSEError {
      static {
        __name(this, "JWEDecryptionFailed");
      }
      constructor(message2 = "decryption operation failed", options2) {
        super(message2, options2);
        this.code = "ERR_JWE_DECRYPTION_FAILED";
      }
    };
    JWEDecryptionFailed.code = "ERR_JWE_DECRYPTION_FAILED";
    JWEInvalid = class extends JOSEError {
      static {
        __name(this, "JWEInvalid");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JWE_INVALID";
      }
    };
    JWEInvalid.code = "ERR_JWE_INVALID";
    JWSInvalid = class extends JOSEError {
      static {
        __name(this, "JWSInvalid");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JWS_INVALID";
      }
    };
    JWSInvalid.code = "ERR_JWS_INVALID";
    JWTInvalid = class extends JOSEError {
      static {
        __name(this, "JWTInvalid");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JWT_INVALID";
      }
    };
    JWTInvalid.code = "ERR_JWT_INVALID";
    JWKInvalid = class extends JOSEError {
      static {
        __name(this, "JWKInvalid");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JWK_INVALID";
      }
    };
    JWKInvalid.code = "ERR_JWK_INVALID";
    JWKSInvalid = class extends JOSEError {
      static {
        __name(this, "JWKSInvalid");
      }
      constructor() {
        super(...arguments);
        this.code = "ERR_JWKS_INVALID";
      }
    };
    JWKSInvalid.code = "ERR_JWKS_INVALID";
    JWKSNoMatchingKey = class extends JOSEError {
      static {
        __name(this, "JWKSNoMatchingKey");
      }
      constructor(message2 = "no applicable key found in the JSON Web Key Set", options2) {
        super(message2, options2);
        this.code = "ERR_JWKS_NO_MATCHING_KEY";
      }
    };
    JWKSNoMatchingKey.code = "ERR_JWKS_NO_MATCHING_KEY";
    JWKSMultipleMatchingKeys = class extends JOSEError {
      static {
        __name(this, "JWKSMultipleMatchingKeys");
      }
      constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options2) {
        super(message2, options2);
        this.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
      }
    };
    JWKSMultipleMatchingKeys.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
    JWKSTimeout = class extends JOSEError {
      static {
        __name(this, "JWKSTimeout");
      }
      constructor(message2 = "request timed out", options2) {
        super(message2, options2);
        this.code = "ERR_JWKS_TIMEOUT";
      }
    };
    JWKSTimeout.code = "ERR_JWKS_TIMEOUT";
    JWSSignatureVerificationFailed = class extends JOSEError {
      static {
        __name(this, "JWSSignatureVerificationFailed");
      }
      constructor(message2 = "signature verification failed", options2) {
        super(message2, options2);
        this.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      }
    };
    JWSSignatureVerificationFailed.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  }
});
var random_default;
var init_random = __esm({
  "node_modules/jose/dist/browser/runtime/random.js"() {
    init_webcrypto();
    random_default = webcrypto_default.getRandomValues.bind(webcrypto_default);
  }
});
function bitLength(alg2) {
  switch (alg2) {
    case "A128GCM":
    case "A128GCMKW":
    case "A192GCM":
    case "A192GCMKW":
    case "A256GCM":
    case "A256GCMKW":
      return 96;
    case "A128CBC-HS256":
    case "A192CBC-HS384":
    case "A256CBC-HS512":
      return 128;
    default:
      throw new JOSENotSupported(`Unsupported JWE Algorithm: ${alg2}`);
  }
}
__name(bitLength, "bitLength");
var iv_default;
var init_iv = __esm({
  "node_modules/jose/dist/browser/lib/iv.js"() {
    init_errors2();
    init_random();
    iv_default = /* @__PURE__ */ __name((alg2) => random_default(new Uint8Array(bitLength(alg2) >> 3)), "iv_default");
  }
});
var checkIvLength;
var check_iv_length_default;
var init_check_iv_length = __esm({
  "node_modules/jose/dist/browser/lib/check_iv_length.js"() {
    init_errors2();
    init_iv();
    checkIvLength = /* @__PURE__ */ __name((enc2, iv) => {
      if (iv.length << 3 !== bitLength(enc2)) {
        throw new JWEInvalid("Invalid Initialization Vector length");
      }
    }, "checkIvLength");
    check_iv_length_default = checkIvLength;
  }
});
var checkCekLength;
var check_cek_length_default;
var init_check_cek_length = __esm({
  "node_modules/jose/dist/browser/runtime/check_cek_length.js"() {
    init_errors2();
    checkCekLength = /* @__PURE__ */ __name((cek, expected) => {
      const actual = cek.byteLength << 3;
      if (actual !== expected) {
        throw new JWEInvalid(`Invalid Content Encryption Key length. Expected ${expected} bits, got ${actual} bits`);
      }
    }, "checkCekLength");
    check_cek_length_default = checkCekLength;
  }
});
var timingSafeEqual;
var timing_safe_equal_default;
var init_timing_safe_equal = __esm({
  "node_modules/jose/dist/browser/runtime/timing_safe_equal.js"() {
    timingSafeEqual = /* @__PURE__ */ __name((a3, b2) => {
      if (!(a3 instanceof Uint8Array)) {
        throw new TypeError("First argument must be a buffer");
      }
      if (!(b2 instanceof Uint8Array)) {
        throw new TypeError("Second argument must be a buffer");
      }
      if (a3.length !== b2.length) {
        throw new TypeError("Input buffers must have the same length");
      }
      const len = a3.length;
      let out = 0;
      let i4 = -1;
      while (++i4 < len) {
        out |= a3[i4] ^ b2[i4];
      }
      return out === 0;
    }, "timingSafeEqual");
    timing_safe_equal_default = timingSafeEqual;
  }
});
function unusable(name, prop = "algorithm.name") {
  return new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
}
__name(unusable, "unusable");
function isAlgorithm(algorithm, name) {
  return algorithm.name === name;
}
__name(isAlgorithm, "isAlgorithm");
function getHashLength(hash2) {
  return parseInt(hash2.name.slice(4), 10);
}
__name(getHashLength, "getHashLength");
function checkUsage(key2, usages) {
  if (usages.length && !usages.some((expected) => key2.usages.includes(expected))) {
    let msg = "CryptoKey does not support this operation, its usages must include ";
    if (usages.length > 2) {
      const last = usages.pop();
      msg += `one of ${usages.join(", ")}, or ${last}.`;
    } else if (usages.length === 2) {
      msg += `one of ${usages[0]} or ${usages[1]}.`;
    } else {
      msg += `${usages[0]}.`;
    }
    throw new TypeError(msg);
  }
}
__name(checkUsage, "checkUsage");
function checkEncCryptoKey(key2, alg2, ...usages) {
  switch (alg2) {
    case "A128GCM":
    case "A192GCM":
    case "A256GCM": {
      if (!isAlgorithm(key2.algorithm, "AES-GCM"))
        throw unusable("AES-GCM");
      const expected = parseInt(alg2.slice(1, 4), 10);
      const actual = key2.algorithm.length;
      if (actual !== expected)
        throw unusable(expected, "algorithm.length");
      break;
    }
    case "A128KW":
    case "A192KW":
    case "A256KW": {
      if (!isAlgorithm(key2.algorithm, "AES-KW"))
        throw unusable("AES-KW");
      const expected = parseInt(alg2.slice(1, 4), 10);
      const actual = key2.algorithm.length;
      if (actual !== expected)
        throw unusable(expected, "algorithm.length");
      break;
    }
    case "ECDH": {
      switch (key2.algorithm.name) {
        case "ECDH":
        case "X25519":
        case "X448":
          break;
        default:
          throw unusable("ECDH, X25519, or X448");
      }
      break;
    }
    case "PBES2-HS256+A128KW":
    case "PBES2-HS384+A192KW":
    case "PBES2-HS512+A256KW":
      if (!isAlgorithm(key2.algorithm, "PBKDF2"))
        throw unusable("PBKDF2");
      break;
    case "RSA-OAEP":
    case "RSA-OAEP-256":
    case "RSA-OAEP-384":
    case "RSA-OAEP-512": {
      if (!isAlgorithm(key2.algorithm, "RSA-OAEP"))
        throw unusable("RSA-OAEP");
      const expected = parseInt(alg2.slice(9), 10) || 1;
      const actual = getHashLength(key2.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key2, usages);
}
__name(checkEncCryptoKey, "checkEncCryptoKey");
var init_crypto_key = __esm({
  "node_modules/jose/dist/browser/lib/crypto_key.js"() {
  }
});
function message(msg, actual, ...types2) {
  types2 = types2.filter(Boolean);
  if (types2.length > 2) {
    const last = types2.pop();
    msg += `one of type ${types2.join(", ")}, or ${last}.`;
  } else if (types2.length === 2) {
    msg += `one of type ${types2[0]} or ${types2[1]}.`;
  } else {
    msg += `of type ${types2[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
__name(message, "message");
function withAlg(alg2, actual, ...types2) {
  return message(`Key for the ${alg2} algorithm must be `, actual, ...types2);
}
__name(withAlg, "withAlg");
var invalid_key_input_default;
var init_invalid_key_input = __esm({
  "node_modules/jose/dist/browser/lib/invalid_key_input.js"() {
    invalid_key_input_default = /* @__PURE__ */ __name((actual, ...types2) => {
      return message("Key must be ", actual, ...types2);
    }, "invalid_key_input_default");
  }
});
var is_key_like_default;
var types;
var init_is_key_like = __esm({
  "node_modules/jose/dist/browser/runtime/is_key_like.js"() {
    init_webcrypto();
    is_key_like_default = /* @__PURE__ */ __name((key2) => {
      if (isCryptoKey(key2)) {
        return true;
      }
      return key2?.[Symbol.toStringTag] === "KeyObject";
    }, "is_key_like_default");
    types = ["CryptoKey"];
  }
});
async function cbcDecrypt(enc2, cek, ciphertext, iv, tag2, aad) {
  if (!(cek instanceof Uint8Array)) {
    throw new TypeError(invalid_key_input_default(cek, "Uint8Array"));
  }
  const keySize = parseInt(enc2.slice(1, 4), 10);
  const encKey = await webcrypto_default.subtle.importKey("raw", cek.subarray(keySize >> 3), "AES-CBC", false, ["decrypt"]);
  const macKey = await webcrypto_default.subtle.importKey("raw", cek.subarray(0, keySize >> 3), {
    hash: `SHA-${keySize << 1}`,
    name: "HMAC"
  }, false, ["sign"]);
  const macData = concat(aad, iv, ciphertext, uint64be(aad.length << 3));
  const expectedTag = new Uint8Array((await webcrypto_default.subtle.sign("HMAC", macKey, macData)).slice(0, keySize >> 3));
  let macCheckPassed;
  try {
    macCheckPassed = timing_safe_equal_default(tag2, expectedTag);
  } catch {
  }
  if (!macCheckPassed) {
    throw new JWEDecryptionFailed();
  }
  let plaintext;
  try {
    plaintext = new Uint8Array(await webcrypto_default.subtle.decrypt({ iv, name: "AES-CBC" }, encKey, ciphertext));
  } catch {
  }
  if (!plaintext) {
    throw new JWEDecryptionFailed();
  }
  return plaintext;
}
__name(cbcDecrypt, "cbcDecrypt");
async function gcmDecrypt(enc2, cek, ciphertext, iv, tag2, aad) {
  let encKey;
  if (cek instanceof Uint8Array) {
    encKey = await webcrypto_default.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]);
  } else {
    checkEncCryptoKey(cek, enc2, "decrypt");
    encKey = cek;
  }
  try {
    return new Uint8Array(await webcrypto_default.subtle.decrypt({
      additionalData: aad,
      iv,
      name: "AES-GCM",
      tagLength: 128
    }, encKey, concat(ciphertext, tag2)));
  } catch {
    throw new JWEDecryptionFailed();
  }
}
__name(gcmDecrypt, "gcmDecrypt");
var decrypt;
var decrypt_default;
var init_decrypt = __esm({
  "node_modules/jose/dist/browser/runtime/decrypt.js"() {
    init_buffer_utils();
    init_check_iv_length();
    init_check_cek_length();
    init_timing_safe_equal();
    init_errors2();
    init_webcrypto();
    init_crypto_key();
    init_invalid_key_input();
    init_is_key_like();
    decrypt = /* @__PURE__ */ __name(async (enc2, cek, ciphertext, iv, tag2, aad) => {
      if (!isCryptoKey(cek) && !(cek instanceof Uint8Array)) {
        throw new TypeError(invalid_key_input_default(cek, ...types, "Uint8Array"));
      }
      if (!iv) {
        throw new JWEInvalid("JWE Initialization Vector missing");
      }
      if (!tag2) {
        throw new JWEInvalid("JWE Authentication Tag missing");
      }
      check_iv_length_default(enc2, iv);
      switch (enc2) {
        case "A128CBC-HS256":
        case "A192CBC-HS384":
        case "A256CBC-HS512":
          if (cek instanceof Uint8Array)
            check_cek_length_default(cek, parseInt(enc2.slice(-3), 10));
          return cbcDecrypt(enc2, cek, ciphertext, iv, tag2, aad);
        case "A128GCM":
        case "A192GCM":
        case "A256GCM":
          if (cek instanceof Uint8Array)
            check_cek_length_default(cek, parseInt(enc2.slice(1, 4), 10));
          return gcmDecrypt(enc2, cek, ciphertext, iv, tag2, aad);
        default:
          throw new JOSENotSupported("Unsupported JWE Content Encryption Algorithm");
      }
    }, "decrypt");
    decrypt_default = decrypt;
  }
});
var isDisjoint;
var is_disjoint_default;
var init_is_disjoint = __esm({
  "node_modules/jose/dist/browser/lib/is_disjoint.js"() {
    isDisjoint = /* @__PURE__ */ __name((...headers2) => {
      const sources = headers2.filter(Boolean);
      if (sources.length === 0 || sources.length === 1) {
        return true;
      }
      let acc;
      for (const header of sources) {
        const parameters = Object.keys(header);
        if (!acc || acc.size === 0) {
          acc = new Set(parameters);
          continue;
        }
        for (const parameter of parameters) {
          if (acc.has(parameter)) {
            return false;
          }
          acc.add(parameter);
        }
      }
      return true;
    }, "isDisjoint");
    is_disjoint_default = isDisjoint;
  }
});
function isObjectLike(value) {
  return typeof value === "object" && value !== null;
}
__name(isObjectLike, "isObjectLike");
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
__name(isObject, "isObject");
var init_is_object = __esm({
  "node_modules/jose/dist/browser/lib/is_object.js"() {
  }
});
var bogusWebCrypto;
var bogus_default;
var init_bogus = __esm({
  "node_modules/jose/dist/browser/runtime/bogus.js"() {
    bogusWebCrypto = [
      { hash: "SHA-256", name: "HMAC" },
      true,
      ["sign"]
    ];
    bogus_default = bogusWebCrypto;
  }
});
function checkKeySize(key2, alg2) {
  if (key2.algorithm.length !== parseInt(alg2.slice(1, 4), 10)) {
    throw new TypeError(`Invalid key size for alg: ${alg2}`);
  }
}
__name(checkKeySize, "checkKeySize");
function getCryptoKey(key2, alg2, usage) {
  if (isCryptoKey(key2)) {
    checkEncCryptoKey(key2, alg2, usage);
    return key2;
  }
  if (key2 instanceof Uint8Array) {
    return webcrypto_default.subtle.importKey("raw", key2, "AES-KW", true, [usage]);
  }
  throw new TypeError(invalid_key_input_default(key2, ...types, "Uint8Array"));
}
__name(getCryptoKey, "getCryptoKey");
var wrap;
var unwrap;
var init_aeskw = __esm({
  "node_modules/jose/dist/browser/runtime/aeskw.js"() {
    init_bogus();
    init_webcrypto();
    init_crypto_key();
    init_invalid_key_input();
    init_is_key_like();
    wrap = /* @__PURE__ */ __name(async (alg2, key2, cek) => {
      const cryptoKey = await getCryptoKey(key2, alg2, "wrapKey");
      checkKeySize(cryptoKey, alg2);
      const cryptoKeyCek = await webcrypto_default.subtle.importKey("raw", cek, ...bogus_default);
      return new Uint8Array(await webcrypto_default.subtle.wrapKey("raw", cryptoKeyCek, cryptoKey, "AES-KW"));
    }, "wrap");
    unwrap = /* @__PURE__ */ __name(async (alg2, key2, encryptedKey) => {
      const cryptoKey = await getCryptoKey(key2, alg2, "unwrapKey");
      checkKeySize(cryptoKey, alg2);
      const cryptoKeyCek = await webcrypto_default.subtle.unwrapKey("raw", encryptedKey, cryptoKey, "AES-KW", ...bogus_default);
      return new Uint8Array(await webcrypto_default.subtle.exportKey("raw", cryptoKeyCek));
    }, "unwrap");
  }
});
async function deriveKey(publicKey, privateKey, algorithm, keyLength, apu = new Uint8Array(0), apv = new Uint8Array(0)) {
  if (!isCryptoKey(publicKey)) {
    throw new TypeError(invalid_key_input_default(publicKey, ...types));
  }
  checkEncCryptoKey(publicKey, "ECDH");
  if (!isCryptoKey(privateKey)) {
    throw new TypeError(invalid_key_input_default(privateKey, ...types));
  }
  checkEncCryptoKey(privateKey, "ECDH", "deriveBits");
  const value = concat(lengthAndInput(encoder.encode(algorithm)), lengthAndInput(apu), lengthAndInput(apv), uint32be(keyLength));
  let length;
  if (publicKey.algorithm.name === "X25519") {
    length = 256;
  } else if (publicKey.algorithm.name === "X448") {
    length = 448;
  } else {
    length = Math.ceil(parseInt(publicKey.algorithm.namedCurve.substr(-3), 10) / 8) << 3;
  }
  const sharedSecret = new Uint8Array(await webcrypto_default.subtle.deriveBits({
    name: publicKey.algorithm.name,
    public: publicKey
  }, privateKey, length));
  return concatKdf(sharedSecret, keyLength, value);
}
__name(deriveKey, "deriveKey");
async function generateEpk(key2) {
  if (!isCryptoKey(key2)) {
    throw new TypeError(invalid_key_input_default(key2, ...types));
  }
  return webcrypto_default.subtle.generateKey(key2.algorithm, true, ["deriveBits"]);
}
__name(generateEpk, "generateEpk");
function ecdhAllowed(key2) {
  if (!isCryptoKey(key2)) {
    throw new TypeError(invalid_key_input_default(key2, ...types));
  }
  return ["P-256", "P-384", "P-521"].includes(key2.algorithm.namedCurve) || key2.algorithm.name === "X25519" || key2.algorithm.name === "X448";
}
__name(ecdhAllowed, "ecdhAllowed");
var init_ecdhes = __esm({
  "node_modules/jose/dist/browser/runtime/ecdhes.js"() {
    init_buffer_utils();
    init_webcrypto();
    init_crypto_key();
    init_invalid_key_input();
    init_is_key_like();
  }
});
function checkP2s(p2s2) {
  if (!(p2s2 instanceof Uint8Array) || p2s2.length < 8) {
    throw new JWEInvalid("PBES2 Salt Input must be 8 or more octets");
  }
}
__name(checkP2s, "checkP2s");
var init_check_p2s = __esm({
  "node_modules/jose/dist/browser/lib/check_p2s.js"() {
    init_errors2();
  }
});
function getCryptoKey2(key2, alg2) {
  if (key2 instanceof Uint8Array) {
    return webcrypto_default.subtle.importKey("raw", key2, "PBKDF2", false, ["deriveBits"]);
  }
  if (isCryptoKey(key2)) {
    checkEncCryptoKey(key2, alg2, "deriveBits", "deriveKey");
    return key2;
  }
  throw new TypeError(invalid_key_input_default(key2, ...types, "Uint8Array"));
}
__name(getCryptoKey2, "getCryptoKey2");
async function deriveKey2(p2s2, alg2, p2c, key2) {
  checkP2s(p2s2);
  const salt = p2s(alg2, p2s2);
  const keylen = parseInt(alg2.slice(13, 16), 10);
  const subtleAlg = {
    hash: `SHA-${alg2.slice(8, 11)}`,
    iterations: p2c,
    name: "PBKDF2",
    salt
  };
  const wrapAlg = {
    length: keylen,
    name: "AES-KW"
  };
  const cryptoKey = await getCryptoKey2(key2, alg2);
  if (cryptoKey.usages.includes("deriveBits")) {
    return new Uint8Array(await webcrypto_default.subtle.deriveBits(subtleAlg, cryptoKey, keylen));
  }
  if (cryptoKey.usages.includes("deriveKey")) {
    return webcrypto_default.subtle.deriveKey(subtleAlg, cryptoKey, wrapAlg, false, ["wrapKey", "unwrapKey"]);
  }
  throw new TypeError('PBKDF2 key "usages" must include "deriveBits" or "deriveKey"');
}
__name(deriveKey2, "deriveKey2");
var encrypt;
var decrypt2;
var init_pbes2kw = __esm({
  "node_modules/jose/dist/browser/runtime/pbes2kw.js"() {
    init_random();
    init_buffer_utils();
    init_base64url();
    init_aeskw();
    init_check_p2s();
    init_webcrypto();
    init_crypto_key();
    init_invalid_key_input();
    init_is_key_like();
    encrypt = /* @__PURE__ */ __name(async (alg2, key2, cek, p2c = 2048, p2s2 = random_default(new Uint8Array(16))) => {
      const derived = await deriveKey2(p2s2, alg2, p2c, key2);
      const encryptedKey = await wrap(alg2.slice(-6), derived, cek);
      return { encryptedKey, p2c, p2s: encode(p2s2) };
    }, "encrypt");
    decrypt2 = /* @__PURE__ */ __name(async (alg2, key2, encryptedKey, p2c, p2s2) => {
      const derived = await deriveKey2(p2s2, alg2, p2c, key2);
      return unwrap(alg2.slice(-6), derived, encryptedKey);
    }, "decrypt2");
  }
});
function subtleRsaEs(alg2) {
  switch (alg2) {
    case "RSA-OAEP":
    case "RSA-OAEP-256":
    case "RSA-OAEP-384":
    case "RSA-OAEP-512":
      return "RSA-OAEP";
    default:
      throw new JOSENotSupported(`alg ${alg2} is not supported either by JOSE or your javascript runtime`);
  }
}
__name(subtleRsaEs, "subtleRsaEs");
var init_subtle_rsaes = __esm({
  "node_modules/jose/dist/browser/runtime/subtle_rsaes.js"() {
    init_errors2();
  }
});
var check_key_length_default;
var init_check_key_length = __esm({
  "node_modules/jose/dist/browser/runtime/check_key_length.js"() {
    check_key_length_default = /* @__PURE__ */ __name((alg2, key2) => {
      if (alg2.startsWith("RS") || alg2.startsWith("PS")) {
        const { modulusLength } = key2.algorithm;
        if (typeof modulusLength !== "number" || modulusLength < 2048) {
          throw new TypeError(`${alg2} requires key modulusLength to be 2048 bits or larger`);
        }
      }
    }, "check_key_length_default");
  }
});
var encrypt2;
var decrypt3;
var init_rsaes = __esm({
  "node_modules/jose/dist/browser/runtime/rsaes.js"() {
    init_subtle_rsaes();
    init_bogus();
    init_webcrypto();
    init_crypto_key();
    init_check_key_length();
    init_invalid_key_input();
    init_is_key_like();
    encrypt2 = /* @__PURE__ */ __name(async (alg2, key2, cek) => {
      if (!isCryptoKey(key2)) {
        throw new TypeError(invalid_key_input_default(key2, ...types));
      }
      checkEncCryptoKey(key2, alg2, "encrypt", "wrapKey");
      check_key_length_default(alg2, key2);
      if (key2.usages.includes("encrypt")) {
        return new Uint8Array(await webcrypto_default.subtle.encrypt(subtleRsaEs(alg2), key2, cek));
      }
      if (key2.usages.includes("wrapKey")) {
        const cryptoKeyCek = await webcrypto_default.subtle.importKey("raw", cek, ...bogus_default);
        return new Uint8Array(await webcrypto_default.subtle.wrapKey("raw", cryptoKeyCek, key2, subtleRsaEs(alg2)));
      }
      throw new TypeError('RSA-OAEP key "usages" must include "encrypt" or "wrapKey" for this operation');
    }, "encrypt2");
    decrypt3 = /* @__PURE__ */ __name(async (alg2, key2, encryptedKey) => {
      if (!isCryptoKey(key2)) {
        throw new TypeError(invalid_key_input_default(key2, ...types));
      }
      checkEncCryptoKey(key2, alg2, "decrypt", "unwrapKey");
      check_key_length_default(alg2, key2);
      if (key2.usages.includes("decrypt")) {
        return new Uint8Array(await webcrypto_default.subtle.decrypt(subtleRsaEs(alg2), key2, encryptedKey));
      }
      if (key2.usages.includes("unwrapKey")) {
        const cryptoKeyCek = await webcrypto_default.subtle.unwrapKey("raw", encryptedKey, key2, subtleRsaEs(alg2), ...bogus_default);
        return new Uint8Array(await webcrypto_default.subtle.exportKey("raw", cryptoKeyCek));
      }
      throw new TypeError('RSA-OAEP key "usages" must include "decrypt" or "unwrapKey" for this operation');
    }, "decrypt3");
  }
});
function isJWK(key2) {
  return isObject(key2) && typeof key2.kty === "string";
}
__name(isJWK, "isJWK");
function isPrivateJWK(key2) {
  return key2.kty !== "oct" && typeof key2.d === "string";
}
__name(isPrivateJWK, "isPrivateJWK");
function isPublicJWK(key2) {
  return key2.kty !== "oct" && typeof key2.d === "undefined";
}
__name(isPublicJWK, "isPublicJWK");
function isSecretJWK(key2) {
  return isJWK(key2) && key2.kty === "oct" && typeof key2.k === "string";
}
__name(isSecretJWK, "isSecretJWK");
var init_is_jwk = __esm({
  "node_modules/jose/dist/browser/lib/is_jwk.js"() {
    init_is_object();
  }
});
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
          algorithm = { name: "ECDSA", namedCurve: "P-256" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES384":
          algorithm = { name: "ECDSA", namedCurve: "P-384" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES512":
          algorithm = { name: "ECDSA", namedCurve: "P-521" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "EdDSA":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
__name(subtleMapping, "subtleMapping");
var parse2;
var jwk_to_key_default;
var init_jwk_to_key = __esm({
  "node_modules/jose/dist/browser/runtime/jwk_to_key.js"() {
    init_webcrypto();
    init_errors2();
    parse2 = /* @__PURE__ */ __name(async (jwk) => {
      if (!jwk.alg) {
        throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
      }
      const { algorithm, keyUsages } = subtleMapping(jwk);
      const rest = [
        algorithm,
        jwk.ext ?? false,
        jwk.key_ops ?? keyUsages
      ];
      const keyData = { ...jwk };
      delete keyData.alg;
      delete keyData.use;
      return webcrypto_default.subtle.importKey("jwk", keyData, ...rest);
    }, "parse2");
    jwk_to_key_default = parse2;
  }
});
var exportKeyValue;
var privCache;
var pubCache;
var isKeyObject;
var importAndCache;
var normalizePublicKey;
var normalizePrivateKey;
var normalize_key_default;
var init_normalize_key = __esm({
  "node_modules/jose/dist/browser/runtime/normalize_key.js"() {
    init_is_jwk();
    init_base64url();
    init_jwk_to_key();
    exportKeyValue = /* @__PURE__ */ __name((k3) => decode(k3), "exportKeyValue");
    isKeyObject = /* @__PURE__ */ __name((key2) => {
      return key2?.[Symbol.toStringTag] === "KeyObject";
    }, "isKeyObject");
    importAndCache = /* @__PURE__ */ __name(async (cache, key2, jwk, alg2, freeze = false) => {
      let cached = cache.get(key2);
      if (cached?.[alg2]) {
        return cached[alg2];
      }
      const cryptoKey = await jwk_to_key_default({ ...jwk, alg: alg2 });
      if (freeze)
        Object.freeze(key2);
      if (!cached) {
        cache.set(key2, { [alg2]: cryptoKey });
      } else {
        cached[alg2] = cryptoKey;
      }
      return cryptoKey;
    }, "importAndCache");
    normalizePublicKey = /* @__PURE__ */ __name((key2, alg2) => {
      if (isKeyObject(key2)) {
        let jwk = key2.export({ format: "jwk" });
        delete jwk.d;
        delete jwk.dp;
        delete jwk.dq;
        delete jwk.p;
        delete jwk.q;
        delete jwk.qi;
        if (jwk.k) {
          return exportKeyValue(jwk.k);
        }
        pubCache || (pubCache = /* @__PURE__ */ new WeakMap());
        return importAndCache(pubCache, key2, jwk, alg2);
      }
      if (isJWK(key2)) {
        if (key2.k)
          return decode(key2.k);
        pubCache || (pubCache = /* @__PURE__ */ new WeakMap());
        const cryptoKey = importAndCache(pubCache, key2, key2, alg2, true);
        return cryptoKey;
      }
      return key2;
    }, "normalizePublicKey");
    normalizePrivateKey = /* @__PURE__ */ __name((key2, alg2) => {
      if (isKeyObject(key2)) {
        let jwk = key2.export({ format: "jwk" });
        if (jwk.k) {
          return exportKeyValue(jwk.k);
        }
        privCache || (privCache = /* @__PURE__ */ new WeakMap());
        return importAndCache(privCache, key2, jwk, alg2);
      }
      if (isJWK(key2)) {
        if (key2.k)
          return decode(key2.k);
        privCache || (privCache = /* @__PURE__ */ new WeakMap());
        const cryptoKey = importAndCache(privCache, key2, key2, alg2, true);
        return cryptoKey;
      }
      return key2;
    }, "normalizePrivateKey");
    normalize_key_default = { normalizePublicKey, normalizePrivateKey };
  }
});
function bitLength2(alg2) {
  switch (alg2) {
    case "A128GCM":
      return 128;
    case "A192GCM":
      return 192;
    case "A256GCM":
    case "A128CBC-HS256":
      return 256;
    case "A192CBC-HS384":
      return 384;
    case "A256CBC-HS512":
      return 512;
    default:
      throw new JOSENotSupported(`Unsupported JWE Algorithm: ${alg2}`);
  }
}
__name(bitLength2, "bitLength2");
var cek_default;
var init_cek = __esm({
  "node_modules/jose/dist/browser/lib/cek.js"() {
    init_errors2();
    init_random();
    cek_default = /* @__PURE__ */ __name((alg2) => random_default(new Uint8Array(bitLength2(alg2) >> 3)), "cek_default");
  }
});
async function importJWK(jwk, alg2) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  alg2 || (alg2 = jwk.alg);
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
    case "EC":
    case "OKP":
      return jwk_to_key_default({ ...jwk, alg: alg2 });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
__name(importJWK, "importJWK");
var init_import = __esm({
  "node_modules/jose/dist/browser/key/import.js"() {
    init_base64url();
    init_jwk_to_key();
    init_errors2();
    init_is_object();
  }
});
function checkKeyType(allowJwk, alg2, key2, usage) {
  const symmetric = alg2.startsWith("HS") || alg2 === "dir" || alg2.startsWith("PBES2") || /^A\d{3}(?:GCM)?KW$/.test(alg2);
  if (symmetric) {
    symmetricTypeCheck(alg2, key2, usage, allowJwk);
  } else {
    asymmetricTypeCheck(alg2, key2, usage, allowJwk);
  }
}
__name(checkKeyType, "checkKeyType");
var tag;
var jwkMatchesOp;
var symmetricTypeCheck;
var asymmetricTypeCheck;
var check_key_type_default;
var checkKeyTypeWithJwk;
var init_check_key_type = __esm({
  "node_modules/jose/dist/browser/lib/check_key_type.js"() {
    init_invalid_key_input();
    init_is_key_like();
    init_is_jwk();
    tag = /* @__PURE__ */ __name((key2) => key2?.[Symbol.toStringTag], "tag");
    jwkMatchesOp = /* @__PURE__ */ __name((alg2, key2, usage) => {
      if (key2.use !== void 0 && key2.use !== "sig") {
        throw new TypeError("Invalid key for this operation, when present its use must be sig");
      }
      if (key2.key_ops !== void 0 && key2.key_ops.includes?.(usage) !== true) {
        throw new TypeError(`Invalid key for this operation, when present its key_ops must include ${usage}`);
      }
      if (key2.alg !== void 0 && key2.alg !== alg2) {
        throw new TypeError(`Invalid key for this operation, when present its alg must be ${alg2}`);
      }
      return true;
    }, "jwkMatchesOp");
    symmetricTypeCheck = /* @__PURE__ */ __name((alg2, key2, usage, allowJwk) => {
      if (key2 instanceof Uint8Array)
        return;
      if (allowJwk && isJWK(key2)) {
        if (isSecretJWK(key2) && jwkMatchesOp(alg2, key2, usage))
          return;
        throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
      }
      if (!is_key_like_default(key2)) {
        throw new TypeError(withAlg(alg2, key2, ...types, "Uint8Array", allowJwk ? "JSON Web Key" : null));
      }
      if (key2.type !== "secret") {
        throw new TypeError(`${tag(key2)} instances for symmetric algorithms must be of type "secret"`);
      }
    }, "symmetricTypeCheck");
    asymmetricTypeCheck = /* @__PURE__ */ __name((alg2, key2, usage, allowJwk) => {
      if (allowJwk && isJWK(key2)) {
        switch (usage) {
          case "sign":
            if (isPrivateJWK(key2) && jwkMatchesOp(alg2, key2, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation be a private JWK`);
          case "verify":
            if (isPublicJWK(key2) && jwkMatchesOp(alg2, key2, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation be a public JWK`);
        }
      }
      if (!is_key_like_default(key2)) {
        throw new TypeError(withAlg(alg2, key2, ...types, allowJwk ? "JSON Web Key" : null));
      }
      if (key2.type === "secret") {
        throw new TypeError(`${tag(key2)} instances for asymmetric algorithms must not be of type "secret"`);
      }
      if (usage === "sign" && key2.type === "public") {
        throw new TypeError(`${tag(key2)} instances for asymmetric algorithm signing must be of type "private"`);
      }
      if (usage === "decrypt" && key2.type === "public") {
        throw new TypeError(`${tag(key2)} instances for asymmetric algorithm decryption must be of type "private"`);
      }
      if (key2.algorithm && usage === "verify" && key2.type === "private") {
        throw new TypeError(`${tag(key2)} instances for asymmetric algorithm verifying must be of type "public"`);
      }
      if (key2.algorithm && usage === "encrypt" && key2.type === "private") {
        throw new TypeError(`${tag(key2)} instances for asymmetric algorithm encryption must be of type "public"`);
      }
    }, "asymmetricTypeCheck");
    check_key_type_default = checkKeyType.bind(void 0, false);
    checkKeyTypeWithJwk = checkKeyType.bind(void 0, true);
  }
});
async function cbcEncrypt(enc2, plaintext, cek, iv, aad) {
  if (!(cek instanceof Uint8Array)) {
    throw new TypeError(invalid_key_input_default(cek, "Uint8Array"));
  }
  const keySize = parseInt(enc2.slice(1, 4), 10);
  const encKey = await webcrypto_default.subtle.importKey("raw", cek.subarray(keySize >> 3), "AES-CBC", false, ["encrypt"]);
  const macKey = await webcrypto_default.subtle.importKey("raw", cek.subarray(0, keySize >> 3), {
    hash: `SHA-${keySize << 1}`,
    name: "HMAC"
  }, false, ["sign"]);
  const ciphertext = new Uint8Array(await webcrypto_default.subtle.encrypt({
    iv,
    name: "AES-CBC"
  }, encKey, plaintext));
  const macData = concat(aad, iv, ciphertext, uint64be(aad.length << 3));
  const tag2 = new Uint8Array((await webcrypto_default.subtle.sign("HMAC", macKey, macData)).slice(0, keySize >> 3));
  return { ciphertext, tag: tag2, iv };
}
__name(cbcEncrypt, "cbcEncrypt");
async function gcmEncrypt(enc2, plaintext, cek, iv, aad) {
  let encKey;
  if (cek instanceof Uint8Array) {
    encKey = await webcrypto_default.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  } else {
    checkEncCryptoKey(cek, enc2, "encrypt");
    encKey = cek;
  }
  const encrypted = new Uint8Array(await webcrypto_default.subtle.encrypt({
    additionalData: aad,
    iv,
    name: "AES-GCM",
    tagLength: 128
  }, encKey, plaintext));
  const tag2 = encrypted.slice(-16);
  const ciphertext = encrypted.slice(0, -16);
  return { ciphertext, tag: tag2, iv };
}
__name(gcmEncrypt, "gcmEncrypt");
var encrypt3;
var encrypt_default;
var init_encrypt = __esm({
  "node_modules/jose/dist/browser/runtime/encrypt.js"() {
    init_buffer_utils();
    init_check_iv_length();
    init_check_cek_length();
    init_webcrypto();
    init_crypto_key();
    init_invalid_key_input();
    init_iv();
    init_errors2();
    init_is_key_like();
    encrypt3 = /* @__PURE__ */ __name(async (enc2, plaintext, cek, iv, aad) => {
      if (!isCryptoKey(cek) && !(cek instanceof Uint8Array)) {
        throw new TypeError(invalid_key_input_default(cek, ...types, "Uint8Array"));
      }
      if (iv) {
        check_iv_length_default(enc2, iv);
      } else {
        iv = iv_default(enc2);
      }
      switch (enc2) {
        case "A128CBC-HS256":
        case "A192CBC-HS384":
        case "A256CBC-HS512":
          if (cek instanceof Uint8Array) {
            check_cek_length_default(cek, parseInt(enc2.slice(-3), 10));
          }
          return cbcEncrypt(enc2, plaintext, cek, iv, aad);
        case "A128GCM":
        case "A192GCM":
        case "A256GCM":
          if (cek instanceof Uint8Array) {
            check_cek_length_default(cek, parseInt(enc2.slice(1, 4), 10));
          }
          return gcmEncrypt(enc2, plaintext, cek, iv, aad);
        default:
          throw new JOSENotSupported("Unsupported JWE Content Encryption Algorithm");
      }
    }, "encrypt3");
    encrypt_default = encrypt3;
  }
});
async function wrap2(alg2, key2, cek, iv) {
  const jweAlgorithm = alg2.slice(0, 7);
  const wrapped = await encrypt_default(jweAlgorithm, cek, key2, iv, new Uint8Array(0));
  return {
    encryptedKey: wrapped.ciphertext,
    iv: encode(wrapped.iv),
    tag: encode(wrapped.tag)
  };
}
__name(wrap2, "wrap2");
async function unwrap2(alg2, key2, encryptedKey, iv, tag2) {
  const jweAlgorithm = alg2.slice(0, 7);
  return decrypt_default(jweAlgorithm, key2, encryptedKey, iv, tag2, new Uint8Array(0));
}
__name(unwrap2, "unwrap2");
var init_aesgcmkw = __esm({
  "node_modules/jose/dist/browser/lib/aesgcmkw.js"() {
    init_encrypt();
    init_decrypt();
    init_base64url();
  }
});
async function decryptKeyManagement(alg2, key2, encryptedKey, joseHeader, options2) {
  check_key_type_default(alg2, key2, "decrypt");
  key2 = await normalize_key_default.normalizePrivateKey?.(key2, alg2) || key2;
  switch (alg2) {
    case "dir": {
      if (encryptedKey !== void 0)
        throw new JWEInvalid("Encountered unexpected JWE Encrypted Key");
      return key2;
    }
    case "ECDH-ES":
      if (encryptedKey !== void 0)
        throw new JWEInvalid("Encountered unexpected JWE Encrypted Key");
    case "ECDH-ES+A128KW":
    case "ECDH-ES+A192KW":
    case "ECDH-ES+A256KW": {
      if (!isObject(joseHeader.epk))
        throw new JWEInvalid(`JOSE Header "epk" (Ephemeral Public Key) missing or invalid`);
      if (!ecdhAllowed(key2))
        throw new JOSENotSupported("ECDH with the provided key is not allowed or not supported by your javascript runtime");
      const epk = await importJWK(joseHeader.epk, alg2);
      let partyUInfo;
      let partyVInfo;
      if (joseHeader.apu !== void 0) {
        if (typeof joseHeader.apu !== "string")
          throw new JWEInvalid(`JOSE Header "apu" (Agreement PartyUInfo) invalid`);
        try {
          partyUInfo = decode(joseHeader.apu);
        } catch {
          throw new JWEInvalid("Failed to base64url decode the apu");
        }
      }
      if (joseHeader.apv !== void 0) {
        if (typeof joseHeader.apv !== "string")
          throw new JWEInvalid(`JOSE Header "apv" (Agreement PartyVInfo) invalid`);
        try {
          partyVInfo = decode(joseHeader.apv);
        } catch {
          throw new JWEInvalid("Failed to base64url decode the apv");
        }
      }
      const sharedSecret = await deriveKey(epk, key2, alg2 === "ECDH-ES" ? joseHeader.enc : alg2, alg2 === "ECDH-ES" ? bitLength2(joseHeader.enc) : parseInt(alg2.slice(-5, -2), 10), partyUInfo, partyVInfo);
      if (alg2 === "ECDH-ES")
        return sharedSecret;
      if (encryptedKey === void 0)
        throw new JWEInvalid("JWE Encrypted Key missing");
      return unwrap(alg2.slice(-6), sharedSecret, encryptedKey);
    }
    case "RSA1_5":
    case "RSA-OAEP":
    case "RSA-OAEP-256":
    case "RSA-OAEP-384":
    case "RSA-OAEP-512": {
      if (encryptedKey === void 0)
        throw new JWEInvalid("JWE Encrypted Key missing");
      return decrypt3(alg2, key2, encryptedKey);
    }
    case "PBES2-HS256+A128KW":
    case "PBES2-HS384+A192KW":
    case "PBES2-HS512+A256KW": {
      if (encryptedKey === void 0)
        throw new JWEInvalid("JWE Encrypted Key missing");
      if (typeof joseHeader.p2c !== "number")
        throw new JWEInvalid(`JOSE Header "p2c" (PBES2 Count) missing or invalid`);
      const p2cLimit = options2?.maxPBES2Count || 1e4;
      if (joseHeader.p2c > p2cLimit)
        throw new JWEInvalid(`JOSE Header "p2c" (PBES2 Count) out is of acceptable bounds`);
      if (typeof joseHeader.p2s !== "string")
        throw new JWEInvalid(`JOSE Header "p2s" (PBES2 Salt) missing or invalid`);
      let p2s2;
      try {
        p2s2 = decode(joseHeader.p2s);
      } catch {
        throw new JWEInvalid("Failed to base64url decode the p2s");
      }
      return decrypt2(alg2, key2, encryptedKey, joseHeader.p2c, p2s2);
    }
    case "A128KW":
    case "A192KW":
    case "A256KW": {
      if (encryptedKey === void 0)
        throw new JWEInvalid("JWE Encrypted Key missing");
      return unwrap(alg2, key2, encryptedKey);
    }
    case "A128GCMKW":
    case "A192GCMKW":
    case "A256GCMKW": {
      if (encryptedKey === void 0)
        throw new JWEInvalid("JWE Encrypted Key missing");
      if (typeof joseHeader.iv !== "string")
        throw new JWEInvalid(`JOSE Header "iv" (Initialization Vector) missing or invalid`);
      if (typeof joseHeader.tag !== "string")
        throw new JWEInvalid(`JOSE Header "tag" (Authentication Tag) missing or invalid`);
      let iv;
      try {
        iv = decode(joseHeader.iv);
      } catch {
        throw new JWEInvalid("Failed to base64url decode the iv");
      }
      let tag2;
      try {
        tag2 = decode(joseHeader.tag);
      } catch {
        throw new JWEInvalid("Failed to base64url decode the tag");
      }
      return unwrap2(alg2, key2, encryptedKey, iv, tag2);
    }
    default: {
      throw new JOSENotSupported('Invalid or unsupported "alg" (JWE Algorithm) header value');
    }
  }
}
__name(decryptKeyManagement, "decryptKeyManagement");
var decrypt_key_management_default;
var init_decrypt_key_management = __esm({
  "node_modules/jose/dist/browser/lib/decrypt_key_management.js"() {
    init_aeskw();
    init_ecdhes();
    init_pbes2kw();
    init_rsaes();
    init_base64url();
    init_normalize_key();
    init_errors2();
    init_cek();
    init_import();
    init_check_key_type();
    init_is_object();
    init_aesgcmkw();
    decrypt_key_management_default = decryptKeyManagement;
  }
});
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
__name(validateCrit, "validateCrit");
var validate_crit_default;
var init_validate_crit = __esm({
  "node_modules/jose/dist/browser/lib/validate_crit.js"() {
    init_errors2();
    validate_crit_default = validateCrit;
  }
});
var validateAlgorithms;
var validate_algorithms_default;
var init_validate_algorithms = __esm({
  "node_modules/jose/dist/browser/lib/validate_algorithms.js"() {
    validateAlgorithms = /* @__PURE__ */ __name((option, algorithms) => {
      if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s5) => typeof s5 !== "string"))) {
        throw new TypeError(`"${option}" option must be an array of strings`);
      }
      if (!algorithms) {
        return void 0;
      }
      return new Set(algorithms);
    }, "validateAlgorithms");
    validate_algorithms_default = validateAlgorithms;
  }
});
async function flattenedDecrypt(jwe, key2, options2) {
  if (!isObject(jwe)) {
    throw new JWEInvalid("Flattened JWE must be an object");
  }
  if (jwe.protected === void 0 && jwe.header === void 0 && jwe.unprotected === void 0) {
    throw new JWEInvalid("JOSE Header missing");
  }
  if (jwe.iv !== void 0 && typeof jwe.iv !== "string") {
    throw new JWEInvalid("JWE Initialization Vector incorrect type");
  }
  if (typeof jwe.ciphertext !== "string") {
    throw new JWEInvalid("JWE Ciphertext missing or incorrect type");
  }
  if (jwe.tag !== void 0 && typeof jwe.tag !== "string") {
    throw new JWEInvalid("JWE Authentication Tag incorrect type");
  }
  if (jwe.protected !== void 0 && typeof jwe.protected !== "string") {
    throw new JWEInvalid("JWE Protected Header incorrect type");
  }
  if (jwe.encrypted_key !== void 0 && typeof jwe.encrypted_key !== "string") {
    throw new JWEInvalid("JWE Encrypted Key incorrect type");
  }
  if (jwe.aad !== void 0 && typeof jwe.aad !== "string") {
    throw new JWEInvalid("JWE AAD incorrect type");
  }
  if (jwe.header !== void 0 && !isObject(jwe.header)) {
    throw new JWEInvalid("JWE Shared Unprotected Header incorrect type");
  }
  if (jwe.unprotected !== void 0 && !isObject(jwe.unprotected)) {
    throw new JWEInvalid("JWE Per-Recipient Unprotected Header incorrect type");
  }
  let parsedProt;
  if (jwe.protected) {
    try {
      const protectedHeader2 = decode(jwe.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader2));
    } catch {
      throw new JWEInvalid("JWE Protected Header is invalid");
    }
  }
  if (!is_disjoint_default(parsedProt, jwe.header, jwe.unprotected)) {
    throw new JWEInvalid("JWE Protected, JWE Unprotected Header, and JWE Per-Recipient Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jwe.header,
    ...jwe.unprotected
  };
  validate_crit_default(JWEInvalid, /* @__PURE__ */ new Map(), options2?.crit, parsedProt, joseHeader);
  if (joseHeader.zip !== void 0) {
    throw new JOSENotSupported('JWE "zip" (Compression Algorithm) Header Parameter is not supported.');
  }
  const { alg: alg2, enc: enc2 } = joseHeader;
  if (typeof alg2 !== "string" || !alg2) {
    throw new JWEInvalid("missing JWE Algorithm (alg) in JWE Header");
  }
  if (typeof enc2 !== "string" || !enc2) {
    throw new JWEInvalid("missing JWE Encryption Algorithm (enc) in JWE Header");
  }
  const keyManagementAlgorithms = options2 && validate_algorithms_default("keyManagementAlgorithms", options2.keyManagementAlgorithms);
  const contentEncryptionAlgorithms = options2 && validate_algorithms_default("contentEncryptionAlgorithms", options2.contentEncryptionAlgorithms);
  if (keyManagementAlgorithms && !keyManagementAlgorithms.has(alg2) || !keyManagementAlgorithms && alg2.startsWith("PBES2")) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (contentEncryptionAlgorithms && !contentEncryptionAlgorithms.has(enc2)) {
    throw new JOSEAlgNotAllowed('"enc" (Encryption Algorithm) Header Parameter value not allowed');
  }
  let encryptedKey;
  if (jwe.encrypted_key !== void 0) {
    try {
      encryptedKey = decode(jwe.encrypted_key);
    } catch {
      throw new JWEInvalid("Failed to base64url decode the encrypted_key");
    }
  }
  let resolvedKey = false;
  if (typeof key2 === "function") {
    key2 = await key2(parsedProt, jwe);
    resolvedKey = true;
  }
  let cek;
  try {
    cek = await decrypt_key_management_default(alg2, key2, encryptedKey, joseHeader, options2);
  } catch (err) {
    if (err instanceof TypeError || err instanceof JWEInvalid || err instanceof JOSENotSupported) {
      throw err;
    }
    cek = cek_default(enc2);
  }
  let iv;
  let tag2;
  if (jwe.iv !== void 0) {
    try {
      iv = decode(jwe.iv);
    } catch {
      throw new JWEInvalid("Failed to base64url decode the iv");
    }
  }
  if (jwe.tag !== void 0) {
    try {
      tag2 = decode(jwe.tag);
    } catch {
      throw new JWEInvalid("Failed to base64url decode the tag");
    }
  }
  const protectedHeader = encoder.encode(jwe.protected ?? "");
  let additionalData;
  if (jwe.aad !== void 0) {
    additionalData = concat(protectedHeader, encoder.encode("."), encoder.encode(jwe.aad));
  } else {
    additionalData = protectedHeader;
  }
  let ciphertext;
  try {
    ciphertext = decode(jwe.ciphertext);
  } catch {
    throw new JWEInvalid("Failed to base64url decode the ciphertext");
  }
  const plaintext = await decrypt_default(enc2, cek, ciphertext, iv, tag2, additionalData);
  const result = { plaintext };
  if (jwe.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jwe.aad !== void 0) {
    try {
      result.additionalAuthenticatedData = decode(jwe.aad);
    } catch {
      throw new JWEInvalid("Failed to base64url decode the aad");
    }
  }
  if (jwe.unprotected !== void 0) {
    result.sharedUnprotectedHeader = jwe.unprotected;
  }
  if (jwe.header !== void 0) {
    result.unprotectedHeader = jwe.header;
  }
  if (resolvedKey) {
    return { ...result, key: key2 };
  }
  return result;
}
__name(flattenedDecrypt, "flattenedDecrypt");
var init_decrypt2 = __esm({
  "node_modules/jose/dist/browser/jwe/flattened/decrypt.js"() {
    init_base64url();
    init_decrypt();
    init_errors2();
    init_is_disjoint();
    init_is_object();
    init_decrypt_key_management();
    init_buffer_utils();
    init_cek();
    init_validate_crit();
    init_validate_algorithms();
  }
});
async function compactDecrypt(jwe, key2, options2) {
  if (jwe instanceof Uint8Array) {
    jwe = decoder.decode(jwe);
  }
  if (typeof jwe !== "string") {
    throw new JWEInvalid("Compact JWE must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: encryptedKey, 2: iv, 3: ciphertext, 4: tag2, length } = jwe.split(".");
  if (length !== 5) {
    throw new JWEInvalid("Invalid Compact JWE");
  }
  const decrypted = await flattenedDecrypt({
    ciphertext,
    iv: iv || void 0,
    protected: protectedHeader,
    tag: tag2 || void 0,
    encrypted_key: encryptedKey || void 0
  }, key2, options2);
  const result = { plaintext: decrypted.plaintext, protectedHeader: decrypted.protectedHeader };
  if (typeof key2 === "function") {
    return { ...result, key: decrypted.key };
  }
  return result;
}
__name(compactDecrypt, "compactDecrypt");
var init_decrypt3 = __esm({
  "node_modules/jose/dist/browser/jwe/compact/decrypt.js"() {
    init_decrypt2();
    init_errors2();
    init_buffer_utils();
  }
});
var unprotected;
var init_private_symbols = __esm({
  "node_modules/jose/dist/browser/lib/private_symbols.js"() {
    unprotected = Symbol();
  }
});
var keyToJWK;
var key_to_jwk_default;
var init_key_to_jwk = __esm({
  "node_modules/jose/dist/browser/runtime/key_to_jwk.js"() {
    init_webcrypto();
    init_invalid_key_input();
    init_base64url();
    init_is_key_like();
    keyToJWK = /* @__PURE__ */ __name(async (key2) => {
      if (key2 instanceof Uint8Array) {
        return {
          kty: "oct",
          k: encode(key2)
        };
      }
      if (!isCryptoKey(key2)) {
        throw new TypeError(invalid_key_input_default(key2, ...types, "Uint8Array"));
      }
      if (!key2.extractable) {
        throw new TypeError("non-extractable CryptoKey cannot be exported as a JWK");
      }
      const { ext, key_ops, alg: alg2, use, ...jwk } = await webcrypto_default.subtle.exportKey("jwk", key2);
      return jwk;
    }, "keyToJWK");
    key_to_jwk_default = keyToJWK;
  }
});
async function exportJWK(key2) {
  return key_to_jwk_default(key2);
}
__name(exportJWK, "exportJWK");
var init_export = __esm({
  "node_modules/jose/dist/browser/key/export.js"() {
    init_key_to_jwk();
  }
});
async function encryptKeyManagement(alg2, enc2, key2, providedCek, providedParameters = {}) {
  let encryptedKey;
  let parameters;
  let cek;
  check_key_type_default(alg2, key2, "encrypt");
  key2 = await normalize_key_default.normalizePublicKey?.(key2, alg2) || key2;
  switch (alg2) {
    case "dir": {
      cek = key2;
      break;
    }
    case "ECDH-ES":
    case "ECDH-ES+A128KW":
    case "ECDH-ES+A192KW":
    case "ECDH-ES+A256KW": {
      if (!ecdhAllowed(key2)) {
        throw new JOSENotSupported("ECDH with the provided key is not allowed or not supported by your javascript runtime");
      }
      const { apu, apv } = providedParameters;
      let { epk: ephemeralKey } = providedParameters;
      ephemeralKey || (ephemeralKey = (await generateEpk(key2)).privateKey);
      const { x: x3, y: y2, crv, kty } = await exportJWK(ephemeralKey);
      const sharedSecret = await deriveKey(key2, ephemeralKey, alg2 === "ECDH-ES" ? enc2 : alg2, alg2 === "ECDH-ES" ? bitLength2(enc2) : parseInt(alg2.slice(-5, -2), 10), apu, apv);
      parameters = { epk: { x: x3, crv, kty } };
      if (kty === "EC")
        parameters.epk.y = y2;
      if (apu)
        parameters.apu = encode(apu);
      if (apv)
        parameters.apv = encode(apv);
      if (alg2 === "ECDH-ES") {
        cek = sharedSecret;
        break;
      }
      cek = providedCek || cek_default(enc2);
      const kwAlg = alg2.slice(-6);
      encryptedKey = await wrap(kwAlg, sharedSecret, cek);
      break;
    }
    case "RSA1_5":
    case "RSA-OAEP":
    case "RSA-OAEP-256":
    case "RSA-OAEP-384":
    case "RSA-OAEP-512": {
      cek = providedCek || cek_default(enc2);
      encryptedKey = await encrypt2(alg2, key2, cek);
      break;
    }
    case "PBES2-HS256+A128KW":
    case "PBES2-HS384+A192KW":
    case "PBES2-HS512+A256KW": {
      cek = providedCek || cek_default(enc2);
      const { p2c, p2s: p2s2 } = providedParameters;
      ({ encryptedKey, ...parameters } = await encrypt(alg2, key2, cek, p2c, p2s2));
      break;
    }
    case "A128KW":
    case "A192KW":
    case "A256KW": {
      cek = providedCek || cek_default(enc2);
      encryptedKey = await wrap(alg2, key2, cek);
      break;
    }
    case "A128GCMKW":
    case "A192GCMKW":
    case "A256GCMKW": {
      cek = providedCek || cek_default(enc2);
      const { iv } = providedParameters;
      ({ encryptedKey, ...parameters } = await wrap2(alg2, key2, cek, iv));
      break;
    }
    default: {
      throw new JOSENotSupported('Invalid or unsupported "alg" (JWE Algorithm) header value');
    }
  }
  return { cek, encryptedKey, parameters };
}
__name(encryptKeyManagement, "encryptKeyManagement");
var encrypt_key_management_default;
var init_encrypt_key_management = __esm({
  "node_modules/jose/dist/browser/lib/encrypt_key_management.js"() {
    init_aeskw();
    init_ecdhes();
    init_pbes2kw();
    init_rsaes();
    init_base64url();
    init_normalize_key();
    init_cek();
    init_errors2();
    init_export();
    init_check_key_type();
    init_aesgcmkw();
    encrypt_key_management_default = encryptKeyManagement;
  }
});
var FlattenedEncrypt;
var init_encrypt2 = __esm({
  "node_modules/jose/dist/browser/jwe/flattened/encrypt.js"() {
    init_base64url();
    init_private_symbols();
    init_encrypt();
    init_encrypt_key_management();
    init_errors2();
    init_is_disjoint();
    init_buffer_utils();
    init_validate_crit();
    FlattenedEncrypt = class {
      static {
        __name(this, "FlattenedEncrypt");
      }
      constructor(plaintext) {
        if (!(plaintext instanceof Uint8Array)) {
          throw new TypeError("plaintext must be an instance of Uint8Array");
        }
        this._plaintext = plaintext;
      }
      setKeyManagementParameters(parameters) {
        if (this._keyManagementParameters) {
          throw new TypeError("setKeyManagementParameters can only be called once");
        }
        this._keyManagementParameters = parameters;
        return this;
      }
      setProtectedHeader(protectedHeader) {
        if (this._protectedHeader) {
          throw new TypeError("setProtectedHeader can only be called once");
        }
        this._protectedHeader = protectedHeader;
        return this;
      }
      setSharedUnprotectedHeader(sharedUnprotectedHeader) {
        if (this._sharedUnprotectedHeader) {
          throw new TypeError("setSharedUnprotectedHeader can only be called once");
        }
        this._sharedUnprotectedHeader = sharedUnprotectedHeader;
        return this;
      }
      setUnprotectedHeader(unprotectedHeader) {
        if (this._unprotectedHeader) {
          throw new TypeError("setUnprotectedHeader can only be called once");
        }
        this._unprotectedHeader = unprotectedHeader;
        return this;
      }
      setAdditionalAuthenticatedData(aad) {
        this._aad = aad;
        return this;
      }
      setContentEncryptionKey(cek) {
        if (this._cek) {
          throw new TypeError("setContentEncryptionKey can only be called once");
        }
        this._cek = cek;
        return this;
      }
      setInitializationVector(iv) {
        if (this._iv) {
          throw new TypeError("setInitializationVector can only be called once");
        }
        this._iv = iv;
        return this;
      }
      async encrypt(key2, options2) {
        if (!this._protectedHeader && !this._unprotectedHeader && !this._sharedUnprotectedHeader) {
          throw new JWEInvalid("either setProtectedHeader, setUnprotectedHeader, or sharedUnprotectedHeader must be called before #encrypt()");
        }
        if (!is_disjoint_default(this._protectedHeader, this._unprotectedHeader, this._sharedUnprotectedHeader)) {
          throw new JWEInvalid("JWE Protected, JWE Shared Unprotected and JWE Per-Recipient Header Parameter names must be disjoint");
        }
        const joseHeader = {
          ...this._protectedHeader,
          ...this._unprotectedHeader,
          ...this._sharedUnprotectedHeader
        };
        validate_crit_default(JWEInvalid, /* @__PURE__ */ new Map(), options2?.crit, this._protectedHeader, joseHeader);
        if (joseHeader.zip !== void 0) {
          throw new JOSENotSupported('JWE "zip" (Compression Algorithm) Header Parameter is not supported.');
        }
        const { alg: alg2, enc: enc2 } = joseHeader;
        if (typeof alg2 !== "string" || !alg2) {
          throw new JWEInvalid('JWE "alg" (Algorithm) Header Parameter missing or invalid');
        }
        if (typeof enc2 !== "string" || !enc2) {
          throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter missing or invalid');
        }
        let encryptedKey;
        if (this._cek && (alg2 === "dir" || alg2 === "ECDH-ES")) {
          throw new TypeError(`setContentEncryptionKey cannot be called with JWE "alg" (Algorithm) Header ${alg2}`);
        }
        let cek;
        {
          let parameters;
          ({ cek, encryptedKey, parameters } = await encrypt_key_management_default(alg2, enc2, key2, this._cek, this._keyManagementParameters));
          if (parameters) {
            if (options2 && unprotected in options2) {
              if (!this._unprotectedHeader) {
                this.setUnprotectedHeader(parameters);
              } else {
                this._unprotectedHeader = { ...this._unprotectedHeader, ...parameters };
              }
            } else if (!this._protectedHeader) {
              this.setProtectedHeader(parameters);
            } else {
              this._protectedHeader = { ...this._protectedHeader, ...parameters };
            }
          }
        }
        let additionalData;
        let protectedHeader;
        let aadMember;
        if (this._protectedHeader) {
          protectedHeader = encoder.encode(encode(JSON.stringify(this._protectedHeader)));
        } else {
          protectedHeader = encoder.encode("");
        }
        if (this._aad) {
          aadMember = encode(this._aad);
          additionalData = concat(protectedHeader, encoder.encode("."), encoder.encode(aadMember));
        } else {
          additionalData = protectedHeader;
        }
        const { ciphertext, tag: tag2, iv } = await encrypt_default(enc2, this._plaintext, cek, this._iv, additionalData);
        const jwe = {
          ciphertext: encode(ciphertext)
        };
        if (iv) {
          jwe.iv = encode(iv);
        }
        if (tag2) {
          jwe.tag = encode(tag2);
        }
        if (encryptedKey) {
          jwe.encrypted_key = encode(encryptedKey);
        }
        if (aadMember) {
          jwe.aad = aadMember;
        }
        if (this._protectedHeader) {
          jwe.protected = decoder.decode(protectedHeader);
        }
        if (this._sharedUnprotectedHeader) {
          jwe.unprotected = this._sharedUnprotectedHeader;
        }
        if (this._unprotectedHeader) {
          jwe.header = this._unprotectedHeader;
        }
        return jwe;
      }
    };
  }
});
var epoch_default;
var init_epoch = __esm({
  "node_modules/jose/dist/browser/lib/epoch.js"() {
    epoch_default = /* @__PURE__ */ __name((date) => Math.floor(date.getTime() / 1e3), "epoch_default");
  }
});
var minute;
var hour;
var day;
var week;
var year;
var REGEX;
var secs_default;
var init_secs = __esm({
  "node_modules/jose/dist/browser/lib/secs.js"() {
    minute = 60;
    hour = minute * 60;
    day = hour * 24;
    week = day * 7;
    year = day * 365.25;
    REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
    secs_default = /* @__PURE__ */ __name((str) => {
      const matched = REGEX.exec(str);
      if (!matched || matched[4] && matched[1]) {
        throw new TypeError("Invalid time period format");
      }
      const value = parseFloat(matched[2]);
      const unit = matched[3].toLowerCase();
      let numericDate;
      switch (unit) {
        case "sec":
        case "secs":
        case "second":
        case "seconds":
        case "s":
          numericDate = Math.round(value);
          break;
        case "minute":
        case "minutes":
        case "min":
        case "mins":
        case "m":
          numericDate = Math.round(value * minute);
          break;
        case "hour":
        case "hours":
        case "hr":
        case "hrs":
        case "h":
          numericDate = Math.round(value * hour);
          break;
        case "day":
        case "days":
        case "d":
          numericDate = Math.round(value * day);
          break;
        case "week":
        case "weeks":
        case "w":
          numericDate = Math.round(value * week);
          break;
        default:
          numericDate = Math.round(value * year);
          break;
      }
      if (matched[1] === "-" || matched[4] === "ago") {
        return -numericDate;
      }
      return numericDate;
    }, "secs_default");
  }
});
var normalizeTyp;
var checkAudiencePresence;
var jwt_claims_set_default;
var init_jwt_claims_set = __esm({
  "node_modules/jose/dist/browser/lib/jwt_claims_set.js"() {
    init_errors2();
    init_buffer_utils();
    init_epoch();
    init_secs();
    init_is_object();
    normalizeTyp = /* @__PURE__ */ __name((value) => value.toLowerCase().replace(/^application\//, ""), "normalizeTyp");
    checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => {
      if (typeof audPayload === "string") {
        return audOption.includes(audPayload);
      }
      if (Array.isArray(audPayload)) {
        return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
      }
      return false;
    }, "checkAudiencePresence");
    jwt_claims_set_default = /* @__PURE__ */ __name((protectedHeader, encodedPayload, options2 = {}) => {
      let payload;
      try {
        payload = JSON.parse(decoder.decode(encodedPayload));
      } catch {
      }
      if (!isObject(payload)) {
        throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
      }
      const { typ } = options2;
      if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
        throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
      }
      const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options2;
      const presenceCheck = [...requiredClaims];
      if (maxTokenAge !== void 0)
        presenceCheck.push("iat");
      if (audience !== void 0)
        presenceCheck.push("aud");
      if (subject !== void 0)
        presenceCheck.push("sub");
      if (issuer !== void 0)
        presenceCheck.push("iss");
      for (const claim of new Set(presenceCheck.reverse())) {
        if (!(claim in payload)) {
          throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
        }
      }
      if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
        throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
      }
      if (subject && payload.sub !== subject) {
        throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
      }
      if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
        throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
      }
      let tolerance;
      switch (typeof options2.clockTolerance) {
        case "string":
          tolerance = secs_default(options2.clockTolerance);
          break;
        case "number":
          tolerance = options2.clockTolerance;
          break;
        case "undefined":
          tolerance = 0;
          break;
        default:
          throw new TypeError("Invalid clockTolerance option type");
      }
      const { currentDate } = options2;
      const now2 = epoch_default(currentDate || /* @__PURE__ */ new Date());
      if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
        throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
      }
      if (payload.nbf !== void 0) {
        if (typeof payload.nbf !== "number") {
          throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
        }
        if (payload.nbf > now2 + tolerance) {
          throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
        }
      }
      if (payload.exp !== void 0) {
        if (typeof payload.exp !== "number") {
          throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
        }
        if (payload.exp <= now2 - tolerance) {
          throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
        }
      }
      if (maxTokenAge) {
        const age = now2 - payload.iat;
        const max = typeof maxTokenAge === "number" ? maxTokenAge : secs_default(maxTokenAge);
        if (age - tolerance > max) {
          throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
        }
        if (age < 0 - tolerance) {
          throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
        }
      }
      return payload;
    }, "jwt_claims_set_default");
  }
});
async function jwtDecrypt(jwt, key2, options2) {
  const decrypted = await compactDecrypt(jwt, key2, options2);
  const payload = jwt_claims_set_default(decrypted.protectedHeader, decrypted.plaintext, options2);
  const { protectedHeader } = decrypted;
  if (protectedHeader.iss !== void 0 && protectedHeader.iss !== payload.iss) {
    throw new JWTClaimValidationFailed('replicated "iss" claim header parameter mismatch', payload, "iss", "mismatch");
  }
  if (protectedHeader.sub !== void 0 && protectedHeader.sub !== payload.sub) {
    throw new JWTClaimValidationFailed('replicated "sub" claim header parameter mismatch', payload, "sub", "mismatch");
  }
  if (protectedHeader.aud !== void 0 && JSON.stringify(protectedHeader.aud) !== JSON.stringify(payload.aud)) {
    throw new JWTClaimValidationFailed('replicated "aud" claim header parameter mismatch', payload, "aud", "mismatch");
  }
  const result = { payload, protectedHeader };
  if (typeof key2 === "function") {
    return { ...result, key: decrypted.key };
  }
  return result;
}
__name(jwtDecrypt, "jwtDecrypt");
var init_decrypt4 = __esm({
  "node_modules/jose/dist/browser/jwt/decrypt.js"() {
    init_decrypt3();
    init_jwt_claims_set();
    init_errors2();
  }
});
var CompactEncrypt;
var init_encrypt3 = __esm({
  "node_modules/jose/dist/browser/jwe/compact/encrypt.js"() {
    init_encrypt2();
    CompactEncrypt = class {
      static {
        __name(this, "CompactEncrypt");
      }
      constructor(plaintext) {
        this._flattened = new FlattenedEncrypt(plaintext);
      }
      setContentEncryptionKey(cek) {
        this._flattened.setContentEncryptionKey(cek);
        return this;
      }
      setInitializationVector(iv) {
        this._flattened.setInitializationVector(iv);
        return this;
      }
      setProtectedHeader(protectedHeader) {
        this._flattened.setProtectedHeader(protectedHeader);
        return this;
      }
      setKeyManagementParameters(parameters) {
        this._flattened.setKeyManagementParameters(parameters);
        return this;
      }
      async encrypt(key2, options2) {
        const jwe = await this._flattened.encrypt(key2, options2);
        return [jwe.protected, jwe.encrypted_key, jwe.iv, jwe.ciphertext, jwe.tag].join(".");
      }
    };
  }
});
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
__name(validateInput, "validateInput");
var ProduceJWT;
var init_produce = __esm({
  "node_modules/jose/dist/browser/jwt/produce.js"() {
    init_epoch();
    init_is_object();
    init_secs();
    ProduceJWT = class {
      static {
        __name(this, "ProduceJWT");
      }
      constructor(payload = {}) {
        if (!isObject(payload)) {
          throw new TypeError("JWT Claims Set MUST be an object");
        }
        this._payload = payload;
      }
      setIssuer(issuer) {
        this._payload = { ...this._payload, iss: issuer };
        return this;
      }
      setSubject(subject) {
        this._payload = { ...this._payload, sub: subject };
        return this;
      }
      setAudience(audience) {
        this._payload = { ...this._payload, aud: audience };
        return this;
      }
      setJti(jwtId) {
        this._payload = { ...this._payload, jti: jwtId };
        return this;
      }
      setNotBefore(input) {
        if (typeof input === "number") {
          this._payload = { ...this._payload, nbf: validateInput("setNotBefore", input) };
        } else if (input instanceof Date) {
          this._payload = { ...this._payload, nbf: validateInput("setNotBefore", epoch_default(input)) };
        } else {
          this._payload = { ...this._payload, nbf: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
        }
        return this;
      }
      setExpirationTime(input) {
        if (typeof input === "number") {
          this._payload = { ...this._payload, exp: validateInput("setExpirationTime", input) };
        } else if (input instanceof Date) {
          this._payload = { ...this._payload, exp: validateInput("setExpirationTime", epoch_default(input)) };
        } else {
          this._payload = { ...this._payload, exp: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
        }
        return this;
      }
      setIssuedAt(input) {
        if (typeof input === "undefined") {
          this._payload = { ...this._payload, iat: epoch_default(/* @__PURE__ */ new Date()) };
        } else if (input instanceof Date) {
          this._payload = { ...this._payload, iat: validateInput("setIssuedAt", epoch_default(input)) };
        } else if (typeof input === "string") {
          this._payload = {
            ...this._payload,
            iat: validateInput("setIssuedAt", epoch_default(/* @__PURE__ */ new Date()) + secs_default(input))
          };
        } else {
          this._payload = { ...this._payload, iat: validateInput("setIssuedAt", input) };
        }
        return this;
      }
    };
  }
});
var EncryptJWT;
var init_encrypt4 = __esm({
  "node_modules/jose/dist/browser/jwt/encrypt.js"() {
    init_encrypt3();
    init_buffer_utils();
    init_produce();
    EncryptJWT = class extends ProduceJWT {
      static {
        __name(this, "EncryptJWT");
      }
      setProtectedHeader(protectedHeader) {
        if (this._protectedHeader) {
          throw new TypeError("setProtectedHeader can only be called once");
        }
        this._protectedHeader = protectedHeader;
        return this;
      }
      setKeyManagementParameters(parameters) {
        if (this._keyManagementParameters) {
          throw new TypeError("setKeyManagementParameters can only be called once");
        }
        this._keyManagementParameters = parameters;
        return this;
      }
      setContentEncryptionKey(cek) {
        if (this._cek) {
          throw new TypeError("setContentEncryptionKey can only be called once");
        }
        this._cek = cek;
        return this;
      }
      setInitializationVector(iv) {
        if (this._iv) {
          throw new TypeError("setInitializationVector can only be called once");
        }
        this._iv = iv;
        return this;
      }
      replicateIssuerAsHeader() {
        this._replicateIssuerAsHeader = true;
        return this;
      }
      replicateSubjectAsHeader() {
        this._replicateSubjectAsHeader = true;
        return this;
      }
      replicateAudienceAsHeader() {
        this._replicateAudienceAsHeader = true;
        return this;
      }
      async encrypt(key2, options2) {
        const enc2 = new CompactEncrypt(encoder.encode(JSON.stringify(this._payload)));
        if (this._replicateIssuerAsHeader) {
          this._protectedHeader = { ...this._protectedHeader, iss: this._payload.iss };
        }
        if (this._replicateSubjectAsHeader) {
          this._protectedHeader = { ...this._protectedHeader, sub: this._payload.sub };
        }
        if (this._replicateAudienceAsHeader) {
          this._protectedHeader = { ...this._protectedHeader, aud: this._payload.aud };
        }
        enc2.setProtectedHeader(this._protectedHeader);
        if (this._iv) {
          enc2.setInitializationVector(this._iv);
        }
        if (this._cek) {
          enc2.setContentEncryptionKey(this._cek);
        }
        if (this._keyManagementParameters) {
          enc2.setKeyManagementParameters(this._keyManagementParameters);
        }
        return enc2.encrypt(key2, options2);
      }
    };
  }
});
async function calculateJwkThumbprint(jwk, digestAlgorithm) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  digestAlgorithm ?? (digestAlgorithm = "sha256");
  if (digestAlgorithm !== "sha256" && digestAlgorithm !== "sha384" && digestAlgorithm !== "sha512") {
    throw new TypeError('digestAlgorithm must one of "sha256", "sha384", or "sha512"');
  }
  let components;
  switch (jwk.kty) {
    case "EC":
      check(jwk.crv, '"crv" (Curve) Parameter');
      check(jwk.x, '"x" (X Coordinate) Parameter');
      check(jwk.y, '"y" (Y Coordinate) Parameter');
      components = { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };
      break;
    case "OKP":
      check(jwk.crv, '"crv" (Subtype of Key Pair) Parameter');
      check(jwk.x, '"x" (Public Key) Parameter');
      components = { crv: jwk.crv, kty: jwk.kty, x: jwk.x };
      break;
    case "RSA":
      check(jwk.e, '"e" (Exponent) Parameter');
      check(jwk.n, '"n" (Modulus) Parameter');
      components = { e: jwk.e, kty: jwk.kty, n: jwk.n };
      break;
    case "oct":
      check(jwk.k, '"k" (Key Value) Parameter');
      components = { k: jwk.k, kty: jwk.kty };
      break;
    default:
      throw new JOSENotSupported('"kty" (Key Type) Parameter missing or unsupported');
  }
  const data = encoder.encode(JSON.stringify(components));
  return encode(await digest_default(digestAlgorithm, data));
}
__name(calculateJwkThumbprint, "calculateJwkThumbprint");
var check;
var init_thumbprint = __esm({
  "node_modules/jose/dist/browser/jwk/thumbprint.js"() {
    init_digest();
    init_base64url();
    init_errors2();
    init_buffer_utils();
    init_is_object();
    check = /* @__PURE__ */ __name((value, description) => {
      if (typeof value !== "string" || !value) {
        throw new JWKInvalid(`${description} missing or invalid`);
      }
    }, "check");
  }
});
var base64url_exports = {};
__export(base64url_exports, {
  decode: /* @__PURE__ */ __name(() => decode2, "decode"),
  encode: /* @__PURE__ */ __name(() => encode2, "encode")
});
var encode2;
var decode2;
var init_base64url2 = __esm({
  "node_modules/jose/dist/browser/util/base64url.js"() {
    init_base64url();
    encode2 = encode;
    decode2 = decode;
  }
});
function decodeJwt(jwt) {
  if (typeof jwt !== "string")
    throw new JWTInvalid("JWTs must use Compact JWS serialization, JWT must be a string");
  const { 1: payload, length } = jwt.split(".");
  if (length === 5)
    throw new JWTInvalid("Only JWTs using Compact JWS serialization can be decoded");
  if (length !== 3)
    throw new JWTInvalid("Invalid JWT");
  if (!payload)
    throw new JWTInvalid("JWTs must contain a payload");
  let decoded;
  try {
    decoded = decode2(payload);
  } catch {
    throw new JWTInvalid("Failed to base64url decode the payload");
  }
  let result;
  try {
    result = JSON.parse(decoder.decode(decoded));
  } catch {
    throw new JWTInvalid("Failed to parse the decoded payload as JSON");
  }
  if (!isObject(result))
    throw new JWTInvalid("Invalid JWT Claims Set");
  return result;
}
__name(decodeJwt, "decodeJwt");
var init_decode_jwt = __esm({
  "node_modules/jose/dist/browser/util/decode_jwt.js"() {
    init_base64url2();
    init_buffer_utils();
    init_is_object();
    init_errors2();
  }
});
var init_browser = __esm({
  "node_modules/jose/dist/browser/index.js"() {
    init_decrypt4();
    init_encrypt4();
    init_thumbprint();
    init_decode_jwt();
    init_errors2();
    init_base64url2();
  }
});
var cookie_exports = {};
__export(cookie_exports, {
  parse: /* @__PURE__ */ __name(() => parse3, "parse"),
  serialize: /* @__PURE__ */ __name(() => serialize, "serialize")
});
function parse3(str, options2) {
  const obj = new NullObject();
  const len = str.length;
  if (len < 2)
    return obj;
  const dec = options2?.decode || decode3;
  let index4 = 0;
  do {
    const eqIdx = str.indexOf("=", index4);
    if (eqIdx === -1)
      break;
    const colonIdx = str.indexOf(";", index4);
    const endIdx = colonIdx === -1 ? len : colonIdx;
    if (eqIdx > endIdx) {
      index4 = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }
    const keyStartIdx = startIndex(str, index4, eqIdx);
    const keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
    const key2 = str.slice(keyStartIdx, keyEndIdx);
    if (obj[key2] === void 0) {
      let valStartIdx = startIndex(str, eqIdx + 1, endIdx);
      let valEndIdx = endIndex(str, endIdx, valStartIdx);
      const value = dec(str.slice(valStartIdx, valEndIdx));
      obj[key2] = value;
    }
    index4 = endIdx + 1;
  } while (index4 < len);
  return obj;
}
__name(parse3, "parse3");
function startIndex(str, index4, max) {
  do {
    const code = str.charCodeAt(index4);
    if (code !== 32 && code !== 9)
      return index4;
  } while (++index4 < max);
  return max;
}
__name(startIndex, "startIndex");
function endIndex(str, index4, min) {
  while (index4 > min) {
    const code = str.charCodeAt(--index4);
    if (code !== 32 && code !== 9)
      return index4 + 1;
  }
  return min;
}
__name(endIndex, "endIndex");
function serialize(name, val, options2) {
  const enc2 = options2?.encode || encodeURIComponent;
  if (!cookieNameRegExp.test(name)) {
    throw new TypeError(`argument name is invalid: ${name}`);
  }
  const value = enc2(val);
  if (!cookieValueRegExp.test(value)) {
    throw new TypeError(`argument val is invalid: ${val}`);
  }
  let str = name + "=" + value;
  if (!options2)
    return str;
  if (options2.maxAge !== void 0) {
    if (!Number.isInteger(options2.maxAge)) {
      throw new TypeError(`option maxAge is invalid: ${options2.maxAge}`);
    }
    str += "; Max-Age=" + options2.maxAge;
  }
  if (options2.domain) {
    if (!domainValueRegExp.test(options2.domain)) {
      throw new TypeError(`option domain is invalid: ${options2.domain}`);
    }
    str += "; Domain=" + options2.domain;
  }
  if (options2.path) {
    if (!pathValueRegExp.test(options2.path)) {
      throw new TypeError(`option path is invalid: ${options2.path}`);
    }
    str += "; Path=" + options2.path;
  }
  if (options2.expires) {
    if (!isDate(options2.expires) || !Number.isFinite(options2.expires.valueOf())) {
      throw new TypeError(`option expires is invalid: ${options2.expires}`);
    }
    str += "; Expires=" + options2.expires.toUTCString();
  }
  if (options2.httpOnly) {
    str += "; HttpOnly";
  }
  if (options2.secure) {
    str += "; Secure";
  }
  if (options2.partitioned) {
    str += "; Partitioned";
  }
  if (options2.priority) {
    const priority = typeof options2.priority === "string" ? options2.priority.toLowerCase() : void 0;
    switch (priority) {
      case "low":
        str += "; Priority=Low";
        break;
      case "medium":
        str += "; Priority=Medium";
        break;
      case "high":
        str += "; Priority=High";
        break;
      default:
        throw new TypeError(`option priority is invalid: ${options2.priority}`);
    }
  }
  if (options2.sameSite) {
    const sameSite = typeof options2.sameSite === "string" ? options2.sameSite.toLowerCase() : options2.sameSite;
    switch (sameSite) {
      case true:
      case "strict":
        str += "; SameSite=Strict";
        break;
      case "lax":
        str += "; SameSite=Lax";
        break;
      case "none":
        str += "; SameSite=None";
        break;
      default:
        throw new TypeError(`option sameSite is invalid: ${options2.sameSite}`);
    }
  }
  return str;
}
__name(serialize, "serialize");
function decode3(str) {
  if (str.indexOf("%") === -1)
    return str;
  try {
    return decodeURIComponent(str);
  } catch (e3) {
    return str;
  }
}
__name(decode3, "decode3");
function isDate(val) {
  return __toString.call(val) === "[object Date]";
}
__name(isDate, "isDate");
var cookieNameRegExp;
var cookieValueRegExp;
var domainValueRegExp;
var pathValueRegExp;
var __toString;
var NullObject;
var init_cookie2 = __esm({
  "node_modules/@auth/core/lib/vendored/cookie.js"() {
    cookieNameRegExp = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
    cookieValueRegExp = /^("?)[\u0021\u0023-\u002B\u002D-\u003A\u003C-\u005B\u005D-\u007E]*\1$/;
    domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    __toString = Object.prototype.toString;
    NullObject = /* @__PURE__ */ (() => {
      const C3 = /* @__PURE__ */ __name(function() {
      }, "C3");
      C3.prototype = /* @__PURE__ */ Object.create(null);
      return C3;
    })();
  }
});
async function encode3(params) {
  const { token = {}, secret, maxAge = DEFAULT_MAX_AGE, salt } = params;
  const secrets = Array.isArray(secret) ? secret : [secret];
  const encryptionSecret = await getDerivedEncryptionKey(enc, secrets[0], salt);
  const thumbprint = await calculateJwkThumbprint({ kty: "oct", k: base64url_exports.encode(encryptionSecret) }, `sha${encryptionSecret.byteLength << 3}`);
  return await new EncryptJWT(token).setProtectedHeader({ alg, enc, kid: thumbprint }).setIssuedAt().setExpirationTime(now() + maxAge).setJti(crypto.randomUUID()).encrypt(encryptionSecret);
}
__name(encode3, "encode3");
async function decode4(params) {
  const { token, secret, salt } = params;
  const secrets = Array.isArray(secret) ? secret : [secret];
  if (!token)
    return null;
  const { payload } = await jwtDecrypt(token, async ({ kid, enc: enc2 }) => {
    for (const secret2 of secrets) {
      const encryptionSecret = await getDerivedEncryptionKey(enc2, secret2, salt);
      if (kid === void 0)
        return encryptionSecret;
      const thumbprint = await calculateJwkThumbprint({ kty: "oct", k: base64url_exports.encode(encryptionSecret) }, `sha${encryptionSecret.byteLength << 3}`);
      if (kid === thumbprint)
        return encryptionSecret;
    }
    throw new Error("no matching decryption secret");
  }, {
    clockTolerance: 15,
    keyManagementAlgorithms: [alg],
    contentEncryptionAlgorithms: [enc, "A256GCM"]
  });
  return payload;
}
__name(decode4, "decode4");
async function getDerivedEncryptionKey(enc2, keyMaterial, salt) {
  let length;
  switch (enc2) {
    case "A256CBC-HS512":
      length = 64;
      break;
    case "A256GCM":
      length = 32;
      break;
    default:
      throw new Error("Unsupported JWT Content Encryption Algorithm");
  }
  return await hkdf("sha256", keyMaterial, salt, `Auth.js Generated Encryption Key (${salt})`, length);
}
__name(getDerivedEncryptionKey, "getDerivedEncryptionKey");
var parseCookie;
var DEFAULT_MAX_AGE;
var now;
var alg;
var enc;
var init_jwt = __esm({
  "node_modules/@auth/core/jwt.js"() {
    init_web();
    init_browser();
    init_cookie();
    init_errors();
    init_cookie2();
    ({ parse: parseCookie } = cookie_exports);
    DEFAULT_MAX_AGE = 30 * 24 * 60 * 60;
    now = /* @__PURE__ */ __name(() => Date.now() / 1e3 | 0, "now");
    alg = "dir";
    enc = "A256CBC-HS512";
  }
});
async function createCallbackUrl({ options: options2, paramValue, cookieValue }) {
  const { url, callbacks } = options2;
  let callbackUrl = url.origin;
  if (paramValue) {
    callbackUrl = await callbacks.redirect({
      url: paramValue,
      baseUrl: url.origin
    });
  } else if (cookieValue) {
    callbackUrl = await callbacks.redirect({
      url: cookieValue,
      baseUrl: url.origin
    });
  }
  return {
    callbackUrl,
    // Save callback URL in a cookie so that it can be used for subsequent requests in signin/signout/callback flow
    callbackUrlCookie: callbackUrl !== cookieValue ? callbackUrl : void 0
  };
}
__name(createCallbackUrl, "createCallbackUrl");
var init_callback_url = __esm({
  "node_modules/@auth/core/lib/utils/callback-url.js"() {
  }
});
function setLogger(config) {
  const newLogger = {
    ...defaultLogger
  };
  if (!config.debug)
    newLogger.debug = () => {
    };
  if (config.logger?.error)
    newLogger.error = config.logger.error;
  if (config.logger?.warn)
    newLogger.warn = config.logger.warn;
  if (config.logger?.debug)
    newLogger.debug = config.logger.debug;
  config.logger ?? (config.logger = newLogger);
  return newLogger;
}
__name(setLogger, "setLogger");
var red;
var yellow;
var grey;
var reset2;
var defaultLogger;
var init_logger = __esm({
  "node_modules/@auth/core/lib/utils/logger.js"() {
    init_errors();
    red = "\x1B[31m";
    yellow = "\x1B[33m";
    grey = "\x1B[90m";
    reset2 = "\x1B[0m";
    defaultLogger = {
      error(error2) {
        const name = error2 instanceof AuthError ? error2.type : error2.name;
        console.error(`${red}[auth][error]${reset2} ${name}: ${error2.message}`);
        if (error2.cause && typeof error2.cause === "object" && "err" in error2.cause && error2.cause.err instanceof Error) {
          const { err, ...data } = error2.cause;
          console.error(`${red}[auth][cause]${reset2}:`, err.stack);
          if (data)
            console.error(`${red}[auth][details]${reset2}:`, JSON.stringify(data, null, 2));
        } else if (error2.stack) {
          console.error(error2.stack.replace(/.*/, "").substring(1));
        }
      },
      warn(code) {
        const url = `https://warnings.authjs.dev#${code}`;
        console.warn(`${yellow}[auth][warn][${code}]${reset2}`, `Read more: ${url}`);
      },
      debug(message2, metadata) {
        console.log(`${grey}[auth][debug]:${reset2} ${message2}`, JSON.stringify(metadata, null, 2));
      }
    };
  }
});
function isAuthAction(action) {
  return actions.includes(action);
}
__name(isAuthAction, "isAuthAction");
var actions;
var init_actions = __esm({
  "node_modules/@auth/core/lib/utils/actions.js"() {
    actions = [
      "providers",
      "session",
      "csrf",
      "signin",
      "signout",
      "callback",
      "verify-request",
      "error",
      "webauthn-options"
    ];
  }
});
async function getBody(req) {
  if (!("body" in req) || !req.body || req.method !== "POST")
    return;
  const contentType = req.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return await req.json();
  } else if (contentType?.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(await req.text());
    return Object.fromEntries(params);
  }
}
__name(getBody, "getBody");
async function toInternalRequest(req, config) {
  try {
    if (req.method !== "GET" && req.method !== "POST")
      throw new UnknownAction("Only GET and POST requests are supported");
    config.basePath ?? (config.basePath = "/auth");
    const url = new URL(req.url);
    const { action, providerId } = parseActionAndProviderId(url.pathname, config.basePath);
    return {
      url,
      action,
      providerId,
      method: req.method,
      headers: Object.fromEntries(req.headers),
      body: req.body ? await getBody(req) : void 0,
      cookies: parseCookie2(req.headers.get("cookie") ?? "") ?? {},
      error: url.searchParams.get("error") ?? void 0,
      query: Object.fromEntries(url.searchParams)
    };
  } catch (e3) {
    const logger = setLogger(config);
    logger.error(e3);
    logger.debug("request", req);
  }
}
__name(toInternalRequest, "toInternalRequest");
function toRequest(request) {
  return new Request(request.url, {
    headers: request.headers,
    method: request.method,
    body: request.method === "POST" ? JSON.stringify(request.body ?? {}) : void 0
  });
}
__name(toRequest, "toRequest");
function toResponse(res) {
  const headers2 = new Headers(res.headers);
  res.cookies?.forEach((cookie) => {
    const { name, value, options: options2 } = cookie;
    const cookieHeader = serializeCookie(name, value, options2);
    if (headers2.has("Set-Cookie"))
      headers2.append("Set-Cookie", cookieHeader);
    else
      headers2.set("Set-Cookie", cookieHeader);
  });
  let body2 = res.body;
  if (headers2.get("content-type") === "application/json")
    body2 = JSON.stringify(res.body);
  else if (headers2.get("content-type") === "application/x-www-form-urlencoded")
    body2 = new URLSearchParams(res.body).toString();
  const status = res.redirect ? 302 : res.status ?? 200;
  const response = new Response(body2, { headers: headers2, status });
  if (res.redirect)
    response.headers.set("Location", res.redirect);
  return response;
}
__name(toResponse, "toResponse");
async function createHash(message2) {
  const data = new TextEncoder().encode(message2);
  const hash2 = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash2)).map((b2) => b2.toString(16).padStart(2, "0")).join("").toString();
}
__name(createHash, "createHash");
function randomString(size) {
  const i2hex = /* @__PURE__ */ __name((i4) => ("0" + i4.toString(16)).slice(-2), "i2hex");
  const r4 = /* @__PURE__ */ __name((a3, i4) => a3 + i2hex(i4), "r4");
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes).reduce(r4, "");
}
__name(randomString, "randomString");
function parseActionAndProviderId(pathname, base2) {
  const a3 = pathname.match(new RegExp(`^${base2}(.+)`));
  if (a3 === null)
    throw new UnknownAction(`Cannot parse action at ${pathname}`);
  const actionAndProviderId = a3.at(-1);
  const b2 = actionAndProviderId.replace(/^\//, "").split("/").filter(Boolean);
  if (b2.length !== 1 && b2.length !== 2)
    throw new UnknownAction(`Cannot parse action at ${pathname}`);
  const [action, providerId] = b2;
  if (!isAuthAction(action))
    throw new UnknownAction(`Cannot parse action at ${pathname}`);
  if (providerId && !["signin", "callback", "webauthn-options"].includes(action))
    throw new UnknownAction(`Cannot parse action at ${pathname}`);
  return { action, providerId };
}
__name(parseActionAndProviderId, "parseActionAndProviderId");
var parseCookie2;
var serializeCookie;
var init_web2 = __esm({
  "node_modules/@auth/core/lib/utils/web.js"() {
    init_cookie2();
    init_errors();
    init_logger();
    init_actions();
    ({ parse: parseCookie2, serialize: serializeCookie } = cookie_exports);
  }
});
async function createCSRFToken({ options: options2, cookieValue, isPost, bodyValue }) {
  if (cookieValue) {
    const [csrfToken2, csrfTokenHash2] = cookieValue.split("|");
    const expectedCsrfTokenHash = await createHash(`${csrfToken2}${options2.secret}`);
    if (csrfTokenHash2 === expectedCsrfTokenHash) {
      const csrfTokenVerified = isPost && csrfToken2 === bodyValue;
      return { csrfTokenVerified, csrfToken: csrfToken2 };
    }
  }
  const csrfToken = randomString(32);
  const csrfTokenHash = await createHash(`${csrfToken}${options2.secret}`);
  const cookie = `${csrfToken}|${csrfTokenHash}`;
  return { cookie, csrfToken };
}
__name(createCSRFToken, "createCSRFToken");
function validateCSRF(action, verified) {
  if (verified)
    return;
  throw new MissingCSRF(`CSRF token was missing during an action ${action}`);
}
__name(validateCSRF, "validateCSRF");
var init_csrf_token = __esm({
  "node_modules/@auth/core/lib/actions/callback/oauth/csrf-token.js"() {
    init_web2();
    init_errors();
  }
});
function isObject2(item) {
  return item !== null && typeof item === "object";
}
__name(isObject2, "isObject2");
function merge(target, ...sources) {
  if (!sources.length)
    return target;
  const source = sources.shift();
  if (isObject2(target) && isObject2(source)) {
    for (const key2 in source) {
      if (isObject2(source[key2])) {
        if (!isObject2(target[key2]))
          target[key2] = Array.isArray(source[key2]) ? [] : {};
        merge(target[key2], source[key2]);
      } else if (source[key2] !== void 0)
        target[key2] = source[key2];
    }
  }
  return merge(target, ...sources);
}
__name(merge, "merge");
var init_merge = __esm({
  "node_modules/@auth/core/lib/utils/merge.js"() {
  }
});
var skipCSRFCheck;
var raw;
var customFetch;
var conformInternal;
var init_symbols = __esm({
  "node_modules/@auth/core/lib/symbols.js"() {
    skipCSRFCheck = Symbol("skip-csrf-check");
    raw = Symbol("return-type-raw");
    customFetch = Symbol("custom-fetch");
    conformInternal = Symbol("conform-internal");
  }
});
function parseProviders(params) {
  const { providerId, config } = params;
  const url = new URL(config.basePath ?? "/auth", params.url.origin);
  const providers = config.providers.map((p3) => {
    const provider = typeof p3 === "function" ? p3() : p3;
    const { options: userOptions, ...defaults } = provider;
    const id = userOptions?.id ?? defaults.id;
    const merged = merge(defaults, userOptions, {
      signinUrl: `${url}/signin/${id}`,
      callbackUrl: `${url}/callback/${id}`
    });
    if (provider.type === "oauth" || provider.type === "oidc") {
      merged.redirectProxyUrl ?? (merged.redirectProxyUrl = userOptions?.redirectProxyUrl ?? config.redirectProxyUrl);
      const normalized = normalizeOAuth(merged);
      if (normalized.authorization?.url.searchParams.get("response_mode") === "form_post") {
        delete normalized.redirectProxyUrl;
      }
      normalized[customFetch] ?? (normalized[customFetch] = userOptions?.[customFetch]);
      return normalized;
    }
    return merged;
  });
  return {
    providers,
    provider: providers.find(({ id }) => id === providerId)
  };
}
__name(parseProviders, "parseProviders");
function normalizeOAuth(c4) {
  if (c4.issuer)
    c4.wellKnown ?? (c4.wellKnown = `${c4.issuer}/.well-known/openid-configuration`);
  const authorization = normalizeEndpoint(c4.authorization, c4.issuer);
  if (authorization && !authorization.url?.searchParams.has("scope")) {
    authorization.url.searchParams.set("scope", "openid profile email");
  }
  const token = normalizeEndpoint(c4.token, c4.issuer);
  const userinfo = normalizeEndpoint(c4.userinfo, c4.issuer);
  const checks = c4.checks ?? ["pkce"];
  if (c4.redirectProxyUrl) {
    if (!checks.includes("state"))
      checks.push("state");
    c4.redirectProxyUrl = `${c4.redirectProxyUrl}/callback/${c4.id}`;
  }
  return {
    ...c4,
    authorization,
    token,
    checks,
    userinfo,
    profile: c4.profile ?? defaultProfile,
    account: c4.account ?? defaultAccount
  };
}
__name(normalizeOAuth, "normalizeOAuth");
function stripUndefined(o4) {
  const result = {};
  for (const [k3, v2] of Object.entries(o4)) {
    if (v2 !== void 0)
      result[k3] = v2;
  }
  return result;
}
__name(stripUndefined, "stripUndefined");
function normalizeEndpoint(e3, issuer) {
  if (!e3 && issuer)
    return;
  if (typeof e3 === "string") {
    return { url: new URL(e3) };
  }
  const url = new URL(e3?.url ?? "https://authjs.dev");
  if (e3?.params != null) {
    for (let [key2, value] of Object.entries(e3.params)) {
      if (key2 === "claims") {
        value = JSON.stringify(value);
      }
      url.searchParams.set(key2, String(value));
    }
  }
  return {
    url,
    request: e3?.request,
    conform: e3?.conform,
    ...e3?.clientPrivateKey ? { clientPrivateKey: e3?.clientPrivateKey } : null
  };
}
__name(normalizeEndpoint, "normalizeEndpoint");
function isOIDCProvider(provider) {
  return provider.type === "oidc";
}
__name(isOIDCProvider, "isOIDCProvider");
var defaultProfile;
var defaultAccount;
var init_providers = __esm({
  "node_modules/@auth/core/lib/utils/providers.js"() {
    init_merge();
    init_symbols();
    defaultProfile = /* @__PURE__ */ __name((profile) => {
      return stripUndefined({
        id: profile.sub ?? profile.id ?? crypto.randomUUID(),
        name: profile.name ?? profile.nickname ?? profile.preferred_username,
        email: profile.email,
        image: profile.picture
      });
    }, "defaultProfile");
    defaultAccount = /* @__PURE__ */ __name((account) => {
      return stripUndefined({
        access_token: account.access_token,
        id_token: account.id_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        scope: account.scope,
        token_type: account.token_type,
        session_state: account.session_state
      });
    }, "defaultAccount");
  }
});
async function init({ authOptions: config, providerId, action, url, cookies: reqCookies, callbackUrl: reqCallbackUrl, csrfToken: reqCsrfToken, csrfDisabled, isPost }) {
  const logger = setLogger(config);
  const { providers, provider } = parseProviders({ url, providerId, config });
  const maxAge = 30 * 24 * 60 * 60;
  let isOnRedirectProxy = false;
  if ((provider?.type === "oauth" || provider?.type === "oidc") && provider.redirectProxyUrl) {
    try {
      isOnRedirectProxy = new URL(provider.redirectProxyUrl).origin === url.origin;
    } catch {
      throw new TypeError(`redirectProxyUrl must be a valid URL. Received: ${provider.redirectProxyUrl}`);
    }
  }
  const options2 = {
    debug: false,
    pages: {},
    theme: {
      colorScheme: "auto",
      logo: "",
      brandColor: "",
      buttonText: ""
    },
    // Custom options override defaults
    ...config,
    // These computed settings can have values in userOptions but we override them
    // and are request-specific.
    url,
    action,
    // @ts-expect-errors
    provider,
    cookies: merge(defaultCookies(config.useSecureCookies ?? url.protocol === "https:"), config.cookies),
    providers,
    // Session options
    session: {
      // If no adapter specified, force use of JSON Web Tokens (stateless)
      strategy: config.adapter ? "database" : "jwt",
      maxAge,
      updateAge: 24 * 60 * 60,
      generateSessionToken: /* @__PURE__ */ __name(() => crypto.randomUUID(), "generateSessionToken"),
      ...config.session
    },
    // JWT options
    jwt: {
      secret: config.secret,
      // Asserted in assert.ts
      maxAge: config.session?.maxAge ?? maxAge,
      // default to same as `session.maxAge`
      encode: encode3,
      decode: decode4,
      ...config.jwt
    },
    // Event messages
    events: eventsErrorHandler(config.events ?? {}, logger),
    adapter: adapterErrorHandler(config.adapter, logger),
    // Callback functions
    callbacks: { ...defaultCallbacks, ...config.callbacks },
    logger,
    callbackUrl: url.origin,
    isOnRedirectProxy,
    experimental: {
      ...config.experimental
    }
  };
  const cookies = [];
  if (csrfDisabled) {
    options2.csrfTokenVerified = true;
  } else {
    const { csrfToken, cookie: csrfCookie, csrfTokenVerified } = await createCSRFToken({
      options: options2,
      cookieValue: reqCookies?.[options2.cookies.csrfToken.name],
      isPost,
      bodyValue: reqCsrfToken
    });
    options2.csrfToken = csrfToken;
    options2.csrfTokenVerified = csrfTokenVerified;
    if (csrfCookie) {
      cookies.push({
        name: options2.cookies.csrfToken.name,
        value: csrfCookie,
        options: options2.cookies.csrfToken.options
      });
    }
  }
  const { callbackUrl, callbackUrlCookie } = await createCallbackUrl({
    options: options2,
    cookieValue: reqCookies?.[options2.cookies.callbackUrl.name],
    paramValue: reqCallbackUrl
  });
  options2.callbackUrl = callbackUrl;
  if (callbackUrlCookie) {
    cookies.push({
      name: options2.cookies.callbackUrl.name,
      value: callbackUrlCookie,
      options: options2.cookies.callbackUrl.options
    });
  }
  return { options: options2, cookies };
}
__name(init, "init");
function eventsErrorHandler(methods, logger) {
  return Object.keys(methods).reduce((acc, name) => {
    acc[name] = async (...args) => {
      try {
        const method = methods[name];
        return await method(...args);
      } catch (e3) {
        logger.error(new EventError(e3));
      }
    };
    return acc;
  }, {});
}
__name(eventsErrorHandler, "eventsErrorHandler");
function adapterErrorHandler(adapter, logger) {
  if (!adapter)
    return;
  return Object.keys(adapter).reduce((acc, name) => {
    acc[name] = async (...args) => {
      try {
        logger.debug(`adapter_${name}`, { args });
        const method = adapter[name];
        return await method(...args);
      } catch (e3) {
        const error2 = new AdapterError(e3);
        logger.error(error2);
        throw error2;
      }
    };
    return acc;
  }, {});
}
__name(adapterErrorHandler, "adapterErrorHandler");
var defaultCallbacks;
var init_init = __esm({
  "node_modules/@auth/core/lib/init.js"() {
    init_jwt();
    init_callback_url();
    init_cookie();
    init_csrf_token();
    init_errors();
    init_providers();
    init_logger();
    init_merge();
    defaultCallbacks = {
      signIn() {
        return true;
      },
      redirect({ url, baseUrl }) {
        if (url.startsWith("/"))
          return `${baseUrl}${url}`;
        else if (new URL(url).origin === baseUrl)
          return url;
        return baseUrl;
      },
      session({ session: session2 }) {
        return {
          user: {
            name: session2.user?.name,
            email: session2.user?.email,
            image: session2.user?.image
          },
          expires: session2.expires?.toISOString?.() ?? session2.expires
        };
      },
      jwt({ token }) {
        return token;
      }
    };
  }
});
function d(n3, l3) {
  for (var u4 in l3) n3[u4] = l3[u4];
  return n3;
}
__name(d, "d");
function w(n3) {
  n3 && n3.parentNode && n3.parentNode.removeChild(n3);
}
__name(w, "w");
function _(l3, u4, t3) {
  var i4, o4, r4, f4 = {};
  for (r4 in u4) "key" == r4 ? i4 = u4[r4] : "ref" == r4 ? o4 = u4[r4] : f4[r4] = u4[r4];
  if (arguments.length > 2 && (f4.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps) for (r4 in l3.defaultProps) void 0 === f4[r4] && (f4[r4] = l3.defaultProps[r4]);
  return g(l3, f4, i4, o4, null);
}
__name(_, "_");
function g(n3, t3, i4, o4, r4) {
  var f4 = { type: n3, props: t3, key: i4, ref: o4, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, constructor: void 0, __v: null == r4 ? ++u : r4, __i: -1, __u: 0 };
  return null == r4 && null != l.vnode && l.vnode(f4), f4;
}
__name(g, "g");
function b(n3) {
  return n3.children;
}
__name(b, "b");
function k(n3, l3) {
  this.props = n3, this.context = l3;
}
__name(k, "k");
function x(n3, l3) {
  if (null == l3) return n3.__ ? x(n3.__, n3.__i + 1) : null;
  for (var u4; l3 < n3.__k.length; l3++) if (null != (u4 = n3.__k[l3]) && null != u4.__e) return u4.__e;
  return "function" == typeof n3.type ? x(n3) : null;
}
__name(x, "x");
function C(n3) {
  var l3, u4;
  if (null != (n3 = n3.__) && null != n3.__c) {
    for (n3.__e = n3.__c.base = null, l3 = 0; l3 < n3.__k.length; l3++) if (null != (u4 = n3.__k[l3]) && null != u4.__e) {
      n3.__e = n3.__c.base = u4.__e;
      break;
    }
    return C(n3);
  }
}
__name(C, "C");
function S(n3) {
  (!n3.__d && (n3.__d = true) && i.push(n3) && !M.__r++ || o !== l.debounceRendering) && ((o = l.debounceRendering) || r)(M);
}
__name(S, "S");
function M() {
  var n3, u4, t3, o4, r4, e3, c4, s5;
  for (i.sort(f); n3 = i.shift(); ) n3.__d && (u4 = i.length, o4 = void 0, e3 = (r4 = (t3 = n3).__v).__e, c4 = [], s5 = [], t3.__P && ((o4 = d({}, r4)).__v = r4.__v + 1, l.vnode && l.vnode(o4), O(t3.__P, o4, r4, t3.__n, t3.__P.namespaceURI, 32 & r4.__u ? [e3] : null, c4, null == e3 ? x(r4) : e3, !!(32 & r4.__u), s5), o4.__v = r4.__v, o4.__.__k[o4.__i] = o4, j(c4, o4, s5), o4.__e != e3 && C(o4)), i.length > u4 && i.sort(f));
  M.__r = 0;
}
__name(M, "M");
function P(n3, l3, u4, t3, i4, o4, r4, f4, e3, c4, s5) {
  var a3, p3, y2, d3, w3, _3 = t3 && t3.__k || v, g2 = l3.length;
  for (u4.__d = e3, $(u4, l3, _3), e3 = u4.__d, a3 = 0; a3 < g2; a3++) null != (y2 = u4.__k[a3]) && (p3 = -1 === y2.__i ? h : _3[y2.__i] || h, y2.__i = a3, O(n3, y2, p3, i4, o4, r4, f4, e3, c4, s5), d3 = y2.__e, y2.ref && p3.ref != y2.ref && (p3.ref && N(p3.ref, null, y2), s5.push(y2.ref, y2.__c || d3, y2)), null == w3 && null != d3 && (w3 = d3), 65536 & y2.__u || p3.__k === y2.__k ? e3 = I(y2, e3, n3) : "function" == typeof y2.type && void 0 !== y2.__d ? e3 = y2.__d : d3 && (e3 = d3.nextSibling), y2.__d = void 0, y2.__u &= -196609);
  u4.__d = e3, u4.__e = w3;
}
__name(P, "P");
function $(n3, l3, u4) {
  var t3, i4, o4, r4, f4, e3 = l3.length, c4 = u4.length, s5 = c4, a3 = 0;
  for (n3.__k = [], t3 = 0; t3 < e3; t3++) null != (i4 = l3[t3]) && "boolean" != typeof i4 && "function" != typeof i4 ? (r4 = t3 + a3, (i4 = n3.__k[t3] = "string" == typeof i4 || "number" == typeof i4 || "bigint" == typeof i4 || i4.constructor == String ? g(null, i4, null, null, null) : y(i4) ? g(b, { children: i4 }, null, null, null) : void 0 === i4.constructor && i4.__b > 0 ? g(i4.type, i4.props, i4.key, i4.ref ? i4.ref : null, i4.__v) : i4).__ = n3, i4.__b = n3.__b + 1, o4 = null, -1 !== (f4 = i4.__i = L(i4, u4, r4, s5)) && (s5--, (o4 = u4[f4]) && (o4.__u |= 131072)), null == o4 || null === o4.__v ? (-1 == f4 && a3--, "function" != typeof i4.type && (i4.__u |= 65536)) : f4 !== r4 && (f4 == r4 - 1 ? a3-- : f4 == r4 + 1 ? a3++ : (f4 > r4 ? a3-- : a3++, i4.__u |= 65536))) : i4 = n3.__k[t3] = null;
  if (s5) for (t3 = 0; t3 < c4; t3++) null != (o4 = u4[t3]) && 0 == (131072 & o4.__u) && (o4.__e == n3.__d && (n3.__d = x(o4)), V(o4, o4));
}
__name($, "$");
function I(n3, l3, u4) {
  var t3, i4;
  if ("function" == typeof n3.type) {
    for (t3 = n3.__k, i4 = 0; t3 && i4 < t3.length; i4++) t3[i4] && (t3[i4].__ = n3, l3 = I(t3[i4], l3, u4));
    return l3;
  }
  n3.__e != l3 && (l3 && n3.type && !u4.contains(l3) && (l3 = x(n3)), u4.insertBefore(n3.__e, l3 || null), l3 = n3.__e);
  do {
    l3 = l3 && l3.nextSibling;
  } while (null != l3 && 8 === l3.nodeType);
  return l3;
}
__name(I, "I");
function L(n3, l3, u4, t3) {
  var i4 = n3.key, o4 = n3.type, r4 = u4 - 1, f4 = u4 + 1, e3 = l3[u4];
  if (null === e3 || e3 && i4 == e3.key && o4 === e3.type && 0 == (131072 & e3.__u)) return u4;
  if (t3 > (null != e3 && 0 == (131072 & e3.__u) ? 1 : 0)) for (; r4 >= 0 || f4 < l3.length; ) {
    if (r4 >= 0) {
      if ((e3 = l3[r4]) && 0 == (131072 & e3.__u) && i4 == e3.key && o4 === e3.type) return r4;
      r4--;
    }
    if (f4 < l3.length) {
      if ((e3 = l3[f4]) && 0 == (131072 & e3.__u) && i4 == e3.key && o4 === e3.type) return f4;
      f4++;
    }
  }
  return -1;
}
__name(L, "L");
function T(n3, l3, u4) {
  "-" === l3[0] ? n3.setProperty(l3, null == u4 ? "" : u4) : n3[l3] = null == u4 ? "" : "number" != typeof u4 || p.test(l3) ? u4 : u4 + "px";
}
__name(T, "T");
function A(n3, l3, u4, t3, i4) {
  var o4;
  n: if ("style" === l3) if ("string" == typeof u4) n3.style.cssText = u4;
  else {
    if ("string" == typeof t3 && (n3.style.cssText = t3 = ""), t3) for (l3 in t3) u4 && l3 in u4 || T(n3.style, l3, "");
    if (u4) for (l3 in u4) t3 && u4[l3] === t3[l3] || T(n3.style, l3, u4[l3]);
  }
  else if ("o" === l3[0] && "n" === l3[1]) o4 = l3 !== (l3 = l3.replace(/(PointerCapture)$|Capture$/i, "$1")), l3 = l3.toLowerCase() in n3 || "onFocusOut" === l3 || "onFocusIn" === l3 ? l3.toLowerCase().slice(2) : l3.slice(2), n3.l || (n3.l = {}), n3.l[l3 + o4] = u4, u4 ? t3 ? u4.u = t3.u : (u4.u = e, n3.addEventListener(l3, o4 ? s : c, o4)) : n3.removeEventListener(l3, o4 ? s : c, o4);
  else {
    if ("http://www.w3.org/2000/svg" == i4) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n3) try {
      n3[l3] = null == u4 ? "" : u4;
      break n;
    } catch (n4) {
    }
    "function" == typeof u4 || (null == u4 || false === u4 && "-" !== l3[4] ? n3.removeAttribute(l3) : n3.setAttribute(l3, "popover" == l3 && 1 == u4 ? "" : u4));
  }
}
__name(A, "A");
function F(n3) {
  return function(u4) {
    if (this.l) {
      var t3 = this.l[u4.type + n3];
      if (null == u4.t) u4.t = e++;
      else if (u4.t < t3.u) return;
      return t3(l.event ? l.event(u4) : u4);
    }
  };
}
__name(F, "F");
function O(n3, u4, t3, i4, o4, r4, f4, e3, c4, s5) {
  var a3, h3, v2, p3, w3, _3, g2, m, x3, C3, S2, M2, $2, I2, H, L3, T3 = u4.type;
  if (void 0 !== u4.constructor) return null;
  128 & t3.__u && (c4 = !!(32 & t3.__u), r4 = [e3 = u4.__e = t3.__e]), (a3 = l.__b) && a3(u4);
  n: if ("function" == typeof T3) try {
    if (m = u4.props, x3 = "prototype" in T3 && T3.prototype.render, C3 = (a3 = T3.contextType) && i4[a3.__c], S2 = a3 ? C3 ? C3.props.value : a3.__ : i4, t3.__c ? g2 = (h3 = u4.__c = t3.__c).__ = h3.__E : (x3 ? u4.__c = h3 = new T3(m, S2) : (u4.__c = h3 = new k(m, S2), h3.constructor = T3, h3.render = q), C3 && C3.sub(h3), h3.props = m, h3.state || (h3.state = {}), h3.context = S2, h3.__n = i4, v2 = h3.__d = true, h3.__h = [], h3._sb = []), x3 && null == h3.__s && (h3.__s = h3.state), x3 && null != T3.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = d({}, h3.__s)), d(h3.__s, T3.getDerivedStateFromProps(m, h3.__s))), p3 = h3.props, w3 = h3.state, h3.__v = u4, v2) x3 && null == T3.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), x3 && null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
    else {
      if (x3 && null == T3.getDerivedStateFromProps && m !== p3 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(m, S2), !h3.__e && (null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(m, h3.__s, S2) || u4.__v === t3.__v)) {
        for (u4.__v !== t3.__v && (h3.props = m, h3.state = h3.__s, h3.__d = false), u4.__e = t3.__e, u4.__k = t3.__k, u4.__k.some(function(n4) {
          n4 && (n4.__ = u4);
        }), M2 = 0; M2 < h3._sb.length; M2++) h3.__h.push(h3._sb[M2]);
        h3._sb = [], h3.__h.length && f4.push(h3);
        break n;
      }
      null != h3.componentWillUpdate && h3.componentWillUpdate(m, h3.__s, S2), x3 && null != h3.componentDidUpdate && h3.__h.push(function() {
        h3.componentDidUpdate(p3, w3, _3);
      });
    }
    if (h3.context = S2, h3.props = m, h3.__P = n3, h3.__e = false, $2 = l.__r, I2 = 0, x3) {
      for (h3.state = h3.__s, h3.__d = false, $2 && $2(u4), a3 = h3.render(h3.props, h3.state, h3.context), H = 0; H < h3._sb.length; H++) h3.__h.push(h3._sb[H]);
      h3._sb = [];
    } else do {
      h3.__d = false, $2 && $2(u4), a3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
    } while (h3.__d && ++I2 < 25);
    h3.state = h3.__s, null != h3.getChildContext && (i4 = d(d({}, i4), h3.getChildContext())), x3 && !v2 && null != h3.getSnapshotBeforeUpdate && (_3 = h3.getSnapshotBeforeUpdate(p3, w3)), P(n3, y(L3 = null != a3 && a3.type === b && null == a3.key ? a3.props.children : a3) ? L3 : [L3], u4, t3, i4, o4, r4, f4, e3, c4, s5), h3.base = u4.__e, u4.__u &= -161, h3.__h.length && f4.push(h3), g2 && (h3.__E = h3.__ = null);
  } catch (n4) {
    if (u4.__v = null, c4 || null != r4) {
      for (u4.__u |= c4 ? 160 : 128; e3 && 8 === e3.nodeType && e3.nextSibling; ) e3 = e3.nextSibling;
      r4[r4.indexOf(e3)] = null, u4.__e = e3;
    } else u4.__e = t3.__e, u4.__k = t3.__k;
    l.__e(n4, u4, t3);
  }
  else null == r4 && u4.__v === t3.__v ? (u4.__k = t3.__k, u4.__e = t3.__e) : u4.__e = z(t3.__e, u4, t3, i4, o4, r4, f4, c4, s5);
  (a3 = l.diffed) && a3(u4);
}
__name(O, "O");
function j(n3, u4, t3) {
  u4.__d = void 0;
  for (var i4 = 0; i4 < t3.length; i4++) N(t3[i4], t3[++i4], t3[++i4]);
  l.__c && l.__c(u4, n3), n3.some(function(u5) {
    try {
      n3 = u5.__h, u5.__h = [], n3.some(function(n4) {
        n4.call(u5);
      });
    } catch (n4) {
      l.__e(n4, u5.__v);
    }
  });
}
__name(j, "j");
function z(u4, t3, i4, o4, r4, f4, e3, c4, s5) {
  var a3, v2, p3, d3, _3, g2, m, b2 = i4.props, k3 = t3.props, C3 = t3.type;
  if ("svg" === C3 ? r4 = "http://www.w3.org/2000/svg" : "math" === C3 ? r4 = "http://www.w3.org/1998/Math/MathML" : r4 || (r4 = "http://www.w3.org/1999/xhtml"), null != f4) {
    for (a3 = 0; a3 < f4.length; a3++) if ((_3 = f4[a3]) && "setAttribute" in _3 == !!C3 && (C3 ? _3.localName === C3 : 3 === _3.nodeType)) {
      u4 = _3, f4[a3] = null;
      break;
    }
  }
  if (null == u4) {
    if (null === C3) return document.createTextNode(k3);
    u4 = document.createElementNS(r4, C3, k3.is && k3), c4 && (l.__m && l.__m(t3, f4), c4 = false), f4 = null;
  }
  if (null === C3) b2 === k3 || c4 && u4.data === k3 || (u4.data = k3);
  else {
    if (f4 = f4 && n.call(u4.childNodes), b2 = i4.props || h, !c4 && null != f4) for (b2 = {}, a3 = 0; a3 < u4.attributes.length; a3++) b2[(_3 = u4.attributes[a3]).name] = _3.value;
    for (a3 in b2) if (_3 = b2[a3], "children" == a3) ;
    else if ("dangerouslySetInnerHTML" == a3) p3 = _3;
    else if (!(a3 in k3)) {
      if ("value" == a3 && "defaultValue" in k3 || "checked" == a3 && "defaultChecked" in k3) continue;
      A(u4, a3, null, _3, r4);
    }
    for (a3 in k3) _3 = k3[a3], "children" == a3 ? d3 = _3 : "dangerouslySetInnerHTML" == a3 ? v2 = _3 : "value" == a3 ? g2 = _3 : "checked" == a3 ? m = _3 : c4 && "function" != typeof _3 || b2[a3] === _3 || A(u4, a3, _3, b2[a3], r4);
    if (v2) c4 || p3 && (v2.__html === p3.__html || v2.__html === u4.innerHTML) || (u4.innerHTML = v2.__html), t3.__k = [];
    else if (p3 && (u4.innerHTML = ""), P(u4, y(d3) ? d3 : [d3], t3, i4, o4, "foreignObject" === C3 ? "http://www.w3.org/1999/xhtml" : r4, f4, e3, f4 ? f4[0] : i4.__k && x(i4, 0), c4, s5), null != f4) for (a3 = f4.length; a3--; ) w(f4[a3]);
    c4 || (a3 = "value", "progress" === C3 && null == g2 ? u4.removeAttribute("value") : void 0 !== g2 && (g2 !== u4[a3] || "progress" === C3 && !g2 || "option" === C3 && g2 !== b2[a3]) && A(u4, a3, g2, b2[a3], r4), a3 = "checked", void 0 !== m && m !== u4[a3] && A(u4, a3, m, b2[a3], r4));
  }
  return u4;
}
__name(z, "z");
function N(n3, u4, t3) {
  try {
    if ("function" == typeof n3) {
      var i4 = "function" == typeof n3.__u;
      i4 && n3.__u(), i4 && null == u4 || (n3.__u = n3(u4));
    } else n3.current = u4;
  } catch (n4) {
    l.__e(n4, t3);
  }
}
__name(N, "N");
function V(n3, u4, t3) {
  var i4, o4;
  if (l.unmount && l.unmount(n3), (i4 = n3.ref) && (i4.current && i4.current !== n3.__e || N(i4, null, u4)), null != (i4 = n3.__c)) {
    if (i4.componentWillUnmount) try {
      i4.componentWillUnmount();
    } catch (n4) {
      l.__e(n4, u4);
    }
    i4.base = i4.__P = null;
  }
  if (i4 = n3.__k) for (o4 = 0; o4 < i4.length; o4++) i4[o4] && V(i4[o4], u4, t3 || "function" != typeof n3.type);
  t3 || w(n3.__e), n3.__c = n3.__ = n3.__e = n3.__d = void 0;
}
__name(V, "V");
function q(n3, l3, u4) {
  return this.constructor(n3, u4);
}
__name(q, "q");
var n;
var l;
var u;
var t;
var i;
var o;
var r;
var f;
var e;
var c;
var s;
var a;
var h;
var v;
var p;
var y;
var init_preact_module = __esm({
  "node_modules/preact/dist/preact.module.js"() {
    h = {};
    v = [];
    p = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
    y = Array.isArray;
    n = v.slice, l = { __e: /* @__PURE__ */ __name(function(n3, l3, u4, t3) {
      for (var i4, o4, r4; l3 = l3.__; ) if ((i4 = l3.__c) && !i4.__) try {
        if ((o4 = i4.constructor) && null != o4.getDerivedStateFromError && (i4.setState(o4.getDerivedStateFromError(n3)), r4 = i4.__d), null != i4.componentDidCatch && (i4.componentDidCatch(n3, t3 || {}), r4 = i4.__d), r4) return i4.__E = i4;
      } catch (l4) {
        n3 = l4;
      }
      throw n3;
    }, "__e") }, u = 0, t = /* @__PURE__ */ __name(function(n3) {
      return null != n3 && null == n3.constructor;
    }, "t"), k.prototype.setState = function(n3, l3) {
      var u4;
      u4 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = d({}, this.state), "function" == typeof n3 && (n3 = n3(d({}, u4), this.props)), n3 && d(u4, n3), null != n3 && this.__v && (l3 && this._sb.push(l3), S(this));
    }, k.prototype.forceUpdate = function(n3) {
      this.__v && (this.__e = true, n3 && this.__h.push(n3), S(this));
    }, k.prototype.render = b, i = [], r = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, f = /* @__PURE__ */ __name(function(n3, l3) {
      return n3.__v.__b - l3.__v.__b;
    }, "f"), M.__r = 0, e = 0, c = F(false), s = F(true), a = 0;
  }
});
function l2(e3) {
  if (0 === e3.length || false === s2.test(e3)) return e3;
  for (var t3 = 0, n3 = 0, r4 = "", o4 = ""; n3 < e3.length; n3++) {
    switch (e3.charCodeAt(n3)) {
      case 34:
        o4 = "&quot;";
        break;
      case 38:
        o4 = "&amp;";
        break;
      case 60:
        o4 = "&lt;";
        break;
      default:
        continue;
    }
    n3 !== t3 && (r4 += e3.slice(t3, n3)), r4 += o4, t3 = n3 + 1;
  }
  return n3 !== t3 && (r4 += e3.slice(t3, n3)), r4;
}
__name(l2, "l2");
function h2(e3) {
  var t3 = "";
  for (var n3 in e3) {
    var r4 = e3[n3];
    if (null != r4 && "" !== r4) {
      var o4 = "-" == n3[0] ? n3 : u2[n3] || (u2[n3] = n3.replace(p2, "-$&").toLowerCase()), i4 = ";";
      "number" != typeof r4 || o4.startsWith("--") || f2.has(o4) || (i4 = "px;"), t3 = t3 + o4 + ":" + r4 + i4;
    }
  }
  return t3 || void 0;
}
__name(h2, "h2");
function d2() {
  this.__d = true;
}
__name(d2, "d2");
function _2(e3, t3) {
  return { __v: e3, context: t3, props: e3.props, setState: d2, forceUpdate: d2, __d: true, __h: new Array(0) };
}
__name(_2, "_2");
function D(r4, o4, i4) {
  var a3 = l.__s;
  l.__s = true, k2 = l.__b, w2 = l.diffed, x2 = l.__r, C2 = l.unmount;
  var c4 = _(b, null);
  c4.__k = [r4];
  try {
    var s5 = U(r4, o4 || A2, false, void 0, c4, false, i4);
    return E(s5) ? s5.join(j2) : s5;
  } catch (e3) {
    if (e3.then) throw new Error('Use "renderToStringAsync" for suspenseful rendering.');
    throw e3;
  } finally {
    l.__c && l.__c(r4, L2), l.__s = a3, L2.length = 0;
  }
}
__name(D, "D");
function P2(e3, t3) {
  var n3, r4 = e3.type, o4 = true;
  return e3.__c ? (o4 = false, (n3 = e3.__c).state = n3.__s) : n3 = new r4(e3.props, t3), e3.__c = n3, n3.__v = e3, n3.props = e3.props, n3.context = t3, n3.__d = true, null == n3.state && (n3.state = A2), null == n3.__s && (n3.__s = n3.state), r4.getDerivedStateFromProps ? n3.state = T2({}, n3.state, r4.getDerivedStateFromProps(n3.props, n3.state)) : o4 && n3.componentWillMount ? (n3.componentWillMount(), n3.state = n3.__s !== n3.state ? n3.__s : n3.state) : !o4 && n3.componentWillUpdate && n3.componentWillUpdate(), x2 && x2(e3), n3.render(n3.props, n3.state, t3);
}
__name(P2, "P2");
function U(t3, s5, u4, f4, p3, d3, v2) {
  if (null == t3 || true === t3 || false === t3 || t3 === j2) return j2;
  var m = typeof t3;
  if ("object" != m) return "function" == m ? j2 : "string" == m ? l2(t3) : t3 + j2;
  if (E(t3)) {
    var y2, g2 = j2;
    p3.__k = t3;
    for (var b2 = 0; b2 < t3.length; b2++) {
      var S2 = t3[b2];
      if (null != S2 && "boolean" != typeof S2) {
        var L3, D2 = U(S2, s5, u4, f4, p3, d3, v2);
        "string" == typeof D2 ? g2 += D2 : (y2 || (y2 = []), g2 && y2.push(g2), g2 = j2, E(D2) ? (L3 = y2).push.apply(L3, D2) : y2.push(D2));
      }
    }
    return y2 ? (g2 && y2.push(g2), y2) : g2;
  }
  if (void 0 !== t3.constructor) return j2;
  t3.__ = p3, k2 && k2(t3);
  var F2 = t3.type, M2 = t3.props;
  if ("function" == typeof F2) {
    var W, $2, z2, H = s5;
    if (F2 === b) {
      if ("tpl" in M2) {
        for (var N2 = j2, q2 = 0; q2 < M2.tpl.length; q2++) if (N2 += M2.tpl[q2], M2.exprs && q2 < M2.exprs.length) {
          var B = M2.exprs[q2];
          if (null == B) continue;
          "object" != typeof B || void 0 !== B.constructor && !E(B) ? N2 += B : N2 += U(B, s5, u4, f4, t3, d3, v2);
        }
        return N2;
      }
      if ("UNSTABLE_comment" in M2) return "<!--" + l2(M2.UNSTABLE_comment) + "-->";
      $2 = M2.children;
    } else {
      if (null != (W = F2.contextType)) {
        var I2 = s5[W.__c];
        H = I2 ? I2.props.value : W.__;
      }
      var O2 = F2.prototype && "function" == typeof F2.prototype.render;
      if (O2) $2 = P2(t3, H), z2 = t3.__c;
      else {
        t3.__c = z2 = _2(t3, H);
        for (var R = 0; z2.__d && R++ < 25; ) z2.__d = false, x2 && x2(t3), $2 = F2.call(z2, M2, H);
        z2.__d = true;
      }
      if (null != z2.getChildContext && (s5 = T2({}, s5, z2.getChildContext())), O2 && l.errorBoundaries && (F2.getDerivedStateFromError || z2.componentDidCatch)) {
        $2 = null != $2 && $2.type === b && null == $2.key && null == $2.props.tpl ? $2.props.children : $2;
        try {
          return U($2, s5, u4, f4, t3, d3, v2);
        } catch (e3) {
          return F2.getDerivedStateFromError && (z2.__s = F2.getDerivedStateFromError(e3)), z2.componentDidCatch && z2.componentDidCatch(e3, A2), z2.__d ? ($2 = P2(t3, s5), null != (z2 = t3.__c).getChildContext && (s5 = T2({}, s5, z2.getChildContext())), U($2 = null != $2 && $2.type === b && null == $2.key && null == $2.props.tpl ? $2.props.children : $2, s5, u4, f4, t3, d3, v2)) : j2;
        } finally {
          w2 && w2(t3), t3.__ = null, C2 && C2(t3);
        }
      }
    }
    $2 = null != $2 && $2.type === b && null == $2.key && null == $2.props.tpl ? $2.props.children : $2;
    try {
      var V2 = U($2, s5, u4, f4, t3, d3, v2);
      return w2 && w2(t3), t3.__ = null, l.unmount && l.unmount(t3), V2;
    } catch (n3) {
      if (!d3 && v2 && v2.onError) {
        var K = v2.onError(n3, t3, function(e3) {
          return U(e3, s5, u4, f4, t3, d3, v2);
        });
        if (void 0 !== K) return K;
        var G = l.__e;
        return G && G(n3, t3), j2;
      }
      if (!d3) throw n3;
      if (!n3 || "function" != typeof n3.then) throw n3;
      return n3.then(/* @__PURE__ */ __name(function e3() {
        try {
          return U($2, s5, u4, f4, t3, d3, v2);
        } catch (n4) {
          if (!n4 || "function" != typeof n4.then) throw n4;
          return n4.then(function() {
            return U($2, s5, u4, f4, t3, d3, v2);
          }, e3);
        }
      }, "e3"));
    }
  }
  var J, Q = "<" + F2, X = j2;
  for (var Y in M2) {
    var ee = M2[Y];
    if ("function" != typeof ee || "class" === Y || "className" === Y) {
      switch (Y) {
        case "children":
          J = ee;
          continue;
        case "key":
        case "ref":
        case "__self":
        case "__source":
          continue;
        case "htmlFor":
          if ("for" in M2) continue;
          Y = "for";
          break;
        case "className":
          if ("class" in M2) continue;
          Y = "class";
          break;
        case "defaultChecked":
          Y = "checked";
          break;
        case "defaultSelected":
          Y = "selected";
          break;
        case "defaultValue":
        case "value":
          switch (Y = "value", F2) {
            case "textarea":
              J = ee;
              continue;
            case "select":
              f4 = ee;
              continue;
            case "option":
              f4 != ee || "selected" in M2 || (Q += " selected");
          }
          break;
        case "dangerouslySetInnerHTML":
          X = ee && ee.__html;
          continue;
        case "style":
          "object" == typeof ee && (ee = h2(ee));
          break;
        case "acceptCharset":
          Y = "accept-charset";
          break;
        case "httpEquiv":
          Y = "http-equiv";
          break;
        default:
          if (o2.test(Y)) Y = Y.replace(o2, "$1:$2").toLowerCase();
          else {
            if (r2.test(Y)) continue;
            "-" !== Y[4] && !c2.has(Y) || null == ee ? u4 ? a2.test(Y) && (Y = "panose1" === Y ? "panose-1" : Y.replace(/([A-Z])/g, "-$1").toLowerCase()) : i2.test(Y) && (Y = Y.toLowerCase()) : ee += j2;
          }
      }
      null != ee && false !== ee && (Q = true === ee || ee === j2 ? Q + " " + Y : Q + " " + Y + '="' + ("string" == typeof ee ? l2(ee) : ee + j2) + '"');
    }
  }
  if (r2.test(F2)) throw new Error(F2 + " is not a valid HTML tag name in " + Q + ">");
  if (X || ("string" == typeof J ? X = l2(J) : null != J && false !== J && true !== J && (X = U(J, s5, "svg" === F2 || "foreignObject" !== F2 && u4, f4, t3, d3, v2))), w2 && w2(t3), t3.__ = null, C2 && C2(t3), !X && Z.has(F2)) return Q + "/>";
  var te = "</" + F2 + ">", ne = Q + ">";
  return E(X) ? [ne].concat(X, [te]) : "string" != typeof X ? [ne, X, te] : ne + X + te;
}
__name(U, "U");
var r2;
var o2;
var i2;
var a2;
var c2;
var s2;
var u2;
var f2;
var p2;
var k2;
var w2;
var x2;
var C2;
var A2;
var L2;
var E;
var T2;
var j2;
var Z;
var init_index_module = __esm({
  "node_modules/preact-render-to-string/dist/index.module.js"() {
    init_preact_module();
    r2 = /[\s\n\\/='"\0<>]/;
    o2 = /^(xlink|xmlns|xml)([A-Z])/;
    i2 = /^accessK|^auto[A-Z]|^cell|^ch|^col|cont|cross|dateT|encT|form[A-Z]|frame|hrefL|inputM|maxL|minL|noV|playsI|popoverT|readO|rowS|src[A-Z]|tabI|useM|item[A-Z]/;
    a2 = /^ac|^ali|arabic|basel|cap|clipPath$|clipRule$|color|dominant|enable|fill|flood|font|glyph[^R]|horiz|image|letter|lighting|marker[^WUH]|overline|panose|pointe|paint|rendering|shape|stop|strikethrough|stroke|text[^L]|transform|underline|unicode|units|^v[^i]|^w|^xH/;
    c2 = /* @__PURE__ */ new Set(["draggable", "spellcheck"]);
    s2 = /["&<]/;
    u2 = {};
    f2 = /* @__PURE__ */ new Set(["animation-iteration-count", "border-image-outset", "border-image-slice", "border-image-width", "box-flex", "box-flex-group", "box-ordinal-group", "column-count", "fill-opacity", "flex", "flex-grow", "flex-negative", "flex-order", "flex-positive", "flex-shrink", "flood-opacity", "font-weight", "grid-column", "grid-row", "line-clamp", "line-height", "opacity", "order", "orphans", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-miterlimit", "stroke-opacity", "stroke-width", "tab-size", "widows", "z-index", "zoom"]);
    p2 = /[A-Z]/g;
    A2 = {};
    L2 = [];
    E = Array.isArray;
    T2 = Object.assign;
    j2 = "";
    Z = /* @__PURE__ */ new Set(["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]);
  }
});
function u3(e3, t3, n3, o4, i4, u4) {
  t3 || (t3 = {});
  var a3, c4, l3 = t3;
  "ref" in t3 && (a3 = t3.ref, delete t3.ref);
  var p3 = { type: e3, props: l3, key: n3, ref: a3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, constructor: void 0, __v: --f3, __i: -1, __u: 0, __source: i4, __self: u4 };
  if ("function" == typeof e3 && (a3 = e3.defaultProps)) for (c4 in a3) void 0 === l3[c4] && (l3[c4] = a3[c4]);
  return l.vnode && l.vnode(p3), p3;
}
__name(u3, "u3");
var f3;
var i3;
var init_jsxRuntime_module = __esm({
  "node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js"() {
    init_preact_module();
    init_preact_module();
    f3 = 0;
    i3 = Array.isArray;
  }
});
function ErrorPage(props) {
  const { url, error: error2 = "default", theme: theme2 } = props;
  const signinPageUrl = `${url}/signin`;
  const errors = {
    default: {
      status: 200,
      heading: "Error",
      message: u3("p", { children: u3("a", { className: "site", href: url?.origin, children: url?.host }) })
    },
    Configuration: {
      status: 500,
      heading: "Server error",
      message: u3("div", { children: [u3("p", { children: "There is a problem with the server configuration." }), u3("p", { children: "Check the server logs for more information." })] })
    },
    AccessDenied: {
      status: 403,
      heading: "Access Denied",
      message: u3("div", { children: [u3("p", { children: "You do not have permission to sign in." }), u3("p", { children: u3("a", { className: "button", href: signinPageUrl, children: "Sign in" }) })] })
    },
    Verification: {
      status: 403,
      heading: "Unable to sign in",
      message: u3("div", { children: [u3("p", { children: "The sign in link is no longer valid." }), u3("p", { children: "It may have been used already or it may have expired." })] }),
      signin: u3("a", { className: "button", href: signinPageUrl, children: "Sign in" })
    }
  };
  const { status, heading, message: message2, signin } = errors[error2] ?? errors.default;
  return {
    status,
    html: u3("div", { className: "error", children: [theme2?.brandColor && u3("style", { dangerouslySetInnerHTML: {
      __html: `
        :root {
          --brand-color: ${theme2?.brandColor}
        }
      `
    } }), u3("div", { className: "card", children: [theme2?.logo && u3("img", { src: theme2?.logo, alt: "Logo", className: "logo" }), u3("h1", { children: heading }), u3("div", { className: "message", children: message2 }), signin] })] })
  };
}
__name(ErrorPage, "ErrorPage");
var init_error = __esm({
  "node_modules/@auth/core/lib/pages/error.js"() {
    init_jsxRuntime_module();
  }
});
async function webauthnScript(authURL, providerID) {
  const WebAuthnBrowser = window.SimpleWebAuthnBrowser;
  async function fetchOptions(action) {
    const url = new URL(`${authURL}/webauthn-options/${providerID}`);
    if (action)
      url.searchParams.append("action", action);
    const formFields = getFormFields();
    formFields.forEach((field) => {
      url.searchParams.append(field.name, field.value);
    });
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Failed to fetch options", res);
      return;
    }
    return res.json();
  }
  __name(fetchOptions, "fetchOptions");
  function getForm() {
    const formID = `#${providerID}-form`;
    const form = document.querySelector(formID);
    if (!form)
      throw new Error(`Form '${formID}' not found`);
    return form;
  }
  __name(getForm, "getForm");
  function getFormFields() {
    const form = getForm();
    const formFields = Array.from(form.querySelectorAll("input[data-form-field]"));
    return formFields;
  }
  __name(getFormFields, "getFormFields");
  async function submitForm(action, data) {
    const form = getForm();
    if (action) {
      const actionInput = document.createElement("input");
      actionInput.type = "hidden";
      actionInput.name = "action";
      actionInput.value = action;
      form.appendChild(actionInput);
    }
    if (data) {
      const dataInput = document.createElement("input");
      dataInput.type = "hidden";
      dataInput.name = "data";
      dataInput.value = JSON.stringify(data);
      form.appendChild(dataInput);
    }
    return form.submit();
  }
  __name(submitForm, "submitForm");
  async function authenticationFlow(options2, autofill) {
    const authResp = await WebAuthnBrowser.startAuthentication(options2, autofill);
    return await submitForm("authenticate", authResp);
  }
  __name(authenticationFlow, "authenticationFlow");
  async function registrationFlow(options2) {
    const formFields = getFormFields();
    formFields.forEach((field) => {
      if (field.required && !field.value) {
        throw new Error(`Missing required field: ${field.name}`);
      }
    });
    const regResp = await WebAuthnBrowser.startRegistration(options2);
    return await submitForm("register", regResp);
  }
  __name(registrationFlow, "registrationFlow");
  async function autofillAuthentication() {
    if (!WebAuthnBrowser.browserSupportsWebAuthnAutofill())
      return;
    const res = await fetchOptions("authenticate");
    if (!res) {
      console.error("Failed to fetch option for autofill authentication");
      return;
    }
    try {
      await authenticationFlow(res.options, true);
    } catch (e3) {
      console.error(e3);
    }
  }
  __name(autofillAuthentication, "autofillAuthentication");
  async function setupForm() {
    const form = getForm();
    if (!WebAuthnBrowser.browserSupportsWebAuthn()) {
      form.style.display = "none";
      return;
    }
    if (form) {
      form.addEventListener("submit", async (e3) => {
        e3.preventDefault();
        const res = await fetchOptions(void 0);
        if (!res) {
          console.error("Failed to fetch options for form submission");
          return;
        }
        if (res.action === "authenticate") {
          try {
            await authenticationFlow(res.options, false);
          } catch (e4) {
            console.error(e4);
          }
        } else if (res.action === "register") {
          try {
            await registrationFlow(res.options);
          } catch (e4) {
            console.error(e4);
          }
        }
      });
    }
  }
  __name(setupForm, "setupForm");
  setupForm();
  autofillAuthentication();
}
__name(webauthnScript, "webauthnScript");
var init_webauthn_client = __esm({
  "node_modules/@auth/core/lib/utils/webauthn-client.js"() {
  }
});
function ConditionalUIScript(providerID) {
  const startConditionalUIScript = `
const currentURL = window.location.href;
const authURL = currentURL.substring(0, currentURL.lastIndexOf('/'));
(${webauthnScript})(authURL, "${providerID}");
`;
  return u3(b, { children: u3("script", { dangerouslySetInnerHTML: { __html: startConditionalUIScript } }) });
}
__name(ConditionalUIScript, "ConditionalUIScript");
function SigninPage(props) {
  const { csrfToken, providers = [], callbackUrl, theme: theme2, email, error: errorType } = props;
  if (typeof document !== "undefined" && theme2?.brandColor) {
    document.documentElement.style.setProperty("--brand-color", theme2.brandColor);
  }
  if (typeof document !== "undefined" && theme2?.buttonText) {
    document.documentElement.style.setProperty("--button-text-color", theme2.buttonText);
  }
  const error2 = errorType && (signinErrors[errorType] ?? signinErrors.default);
  const providerLogoPath = "https://authjs.dev/img/providers";
  const conditionalUIProviderID = providers.find((provider) => provider.type === "webauthn" && provider.enableConditionalUI)?.id;
  return u3("div", { className: "signin", children: [theme2?.brandColor && u3("style", { dangerouslySetInnerHTML: {
    __html: `:root {--brand-color: ${theme2.brandColor}}`
  } }), theme2?.buttonText && u3("style", { dangerouslySetInnerHTML: {
    __html: `
        :root {
          --button-text-color: ${theme2.buttonText}
        }
      `
  } }), u3("div", { className: "card", children: [error2 && u3("div", { className: "error", children: u3("p", { children: error2 }) }), theme2?.logo && u3("img", { src: theme2.logo, alt: "Logo", className: "logo" }), providers.map((provider, i4) => {
    let bg, brandColor, logo;
    if (provider.type === "oauth" || provider.type === "oidc") {
      ;
      ({
        bg = "#fff",
        brandColor,
        logo = `${providerLogoPath}/${provider.id}.svg`
      } = provider.style ?? {});
    }
    const color = brandColor ?? bg ?? "#fff";
    return u3("div", { className: "provider", children: [provider.type === "oauth" || provider.type === "oidc" ? u3("form", { action: provider.signinUrl, method: "POST", children: [u3("input", { type: "hidden", name: "csrfToken", value: csrfToken }), callbackUrl && u3("input", { type: "hidden", name: "callbackUrl", value: callbackUrl }), u3("button", { type: "submit", className: "button", style: {
      "--provider-bg": "#fff",
      "--provider-bg-hover": `color-mix(in srgb, ${color} 30%, #fff)`,
      "--provider-dark-bg": "#161b22",
      "--provider-dark-bg-hover": `color-mix(in srgb, ${color} 30%, #000)`
    }, tabIndex: 0, children: [u3("span", { style: {
      filter: "invert(1) grayscale(1) brightness(1.3) contrast(9000)",
      "mix-blend-mode": "luminosity",
      opacity: 0.95
    }, children: ["Sign in with ", provider.name] }), logo && u3("img", { loading: "lazy", height: 24, src: logo })] })] }) : null, (provider.type === "email" || provider.type === "credentials" || provider.type === "webauthn") && i4 > 0 && providers[i4 - 1].type !== "email" && providers[i4 - 1].type !== "credentials" && providers[i4 - 1].type !== "webauthn" && u3("hr", {}), provider.type === "email" && u3("form", { action: provider.signinUrl, method: "POST", children: [u3("input", { type: "hidden", name: "csrfToken", value: csrfToken }), u3("label", { className: "section-header", htmlFor: `input-email-for-${provider.id}-provider`, children: "Email" }), u3("input", { id: `input-email-for-${provider.id}-provider`, autoFocus: true, type: "email", name: "email", value: email, placeholder: "email@example.com", required: true }), u3("button", { id: "submitButton", type: "submit", tabIndex: 0, children: ["Sign in with ", provider.name] })] }), provider.type === "credentials" && u3("form", { action: provider.callbackUrl, method: "POST", children: [u3("input", { type: "hidden", name: "csrfToken", value: csrfToken }), Object.keys(provider.credentials).map((credential) => {
      return u3("div", { children: [u3("label", { className: "section-header", htmlFor: `input-${credential}-for-${provider.id}-provider`, children: provider.credentials[credential].label ?? credential }), u3("input", { name: credential, id: `input-${credential}-for-${provider.id}-provider`, type: provider.credentials[credential].type ?? "text", placeholder: provider.credentials[credential].placeholder ?? "", ...provider.credentials[credential] })] }, `input-group-${provider.id}`);
    }), u3("button", { id: "submitButton", type: "submit", tabIndex: 0, children: ["Sign in with ", provider.name] })] }), provider.type === "webauthn" && u3("form", { action: provider.callbackUrl, method: "POST", id: `${provider.id}-form`, children: [u3("input", { type: "hidden", name: "csrfToken", value: csrfToken }), Object.keys(provider.formFields).map((field) => {
      return u3("div", { children: [u3("label", { className: "section-header", htmlFor: `input-${field}-for-${provider.id}-provider`, children: provider.formFields[field].label ?? field }), u3("input", { name: field, "data-form-field": true, id: `input-${field}-for-${provider.id}-provider`, type: provider.formFields[field].type ?? "text", placeholder: provider.formFields[field].placeholder ?? "", ...provider.formFields[field] })] }, `input-group-${provider.id}`);
    }), u3("button", { id: `submitButton-${provider.id}`, type: "submit", tabIndex: 0, children: ["Sign in with ", provider.name] })] }), (provider.type === "email" || provider.type === "credentials" || provider.type === "webauthn") && i4 + 1 < providers.length && u3("hr", {})] }, provider.id);
  })] }), conditionalUIProviderID && ConditionalUIScript(conditionalUIProviderID)] });
}
__name(SigninPage, "SigninPage");
var signinErrors;
var init_signin = __esm({
  "node_modules/@auth/core/lib/pages/signin.js"() {
    init_jsxRuntime_module();
    init_webauthn_client();
    signinErrors = {
      default: "Unable to sign in.",
      Signin: "Try signing in with a different account.",
      OAuthSignin: "Try signing in with a different account.",
      OAuthCallbackError: "Try signing in with a different account.",
      OAuthCreateAccount: "Try signing in with a different account.",
      EmailCreateAccount: "Try signing in with a different account.",
      Callback: "Try signing in with a different account.",
      OAuthAccountNotLinked: "To confirm your identity, sign in with the same account you used originally.",
      EmailSignin: "The e-mail could not be sent.",
      CredentialsSignin: "Sign in failed. Check the details you provided are correct.",
      SessionRequired: "Please sign in to access this page."
    };
  }
});
function SignoutPage(props) {
  const { url, csrfToken, theme: theme2 } = props;
  return u3("div", { className: "signout", children: [theme2?.brandColor && u3("style", { dangerouslySetInnerHTML: {
    __html: `
        :root {
          --brand-color: ${theme2.brandColor}
        }
      `
  } }), theme2?.buttonText && u3("style", { dangerouslySetInnerHTML: {
    __html: `
        :root {
          --button-text-color: ${theme2.buttonText}
        }
      `
  } }), u3("div", { className: "card", children: [theme2?.logo && u3("img", { src: theme2.logo, alt: "Logo", className: "logo" }), u3("h1", { children: "Signout" }), u3("p", { children: "Are you sure you want to sign out?" }), u3("form", { action: url?.toString(), method: "POST", children: [u3("input", { type: "hidden", name: "csrfToken", value: csrfToken }), u3("button", { id: "submitButton", type: "submit", children: "Sign out" })] })] })] });
}
__name(SignoutPage, "SignoutPage");
var init_signout = __esm({
  "node_modules/@auth/core/lib/pages/signout.js"() {
    init_jsxRuntime_module();
  }
});
var styles_default;
var init_styles = __esm({
  "node_modules/@auth/core/lib/pages/styles.js"() {
    styles_default = `:root {
  --border-width: 1px;
  --border-radius: 0.5rem;
  --color-error: #c94b4b;
  --color-info: #157efb;
  --color-info-hover: #0f6ddb;
  --color-info-text: #fff;
}

.__next-auth-theme-auto,
.__next-auth-theme-light {
  --color-background: #ececec;
  --color-background-hover: rgba(236, 236, 236, 0.8);
  --color-background-card: #fff;
  --color-text: #000;
  --color-primary: #444;
  --color-control-border: #bbb;
  --color-button-active-background: #f9f9f9;
  --color-button-active-border: #aaa;
  --color-separator: #ccc;
}

.__next-auth-theme-dark {
  --color-background: #161b22;
  --color-background-hover: rgba(22, 27, 34, 0.8);
  --color-background-card: #0d1117;
  --color-text: #fff;
  --color-primary: #ccc;
  --color-control-border: #555;
  --color-button-active-background: #060606;
  --color-button-active-border: #666;
  --color-separator: #444;
}

@media (prefers-color-scheme: dark) {
  .__next-auth-theme-auto {
    --color-background: #161b22;
    --color-background-hover: rgba(22, 27, 34, 0.8);
    --color-background-card: #0d1117;
    --color-text: #fff;
    --color-primary: #ccc;
    --color-control-border: #555;
    --color-button-active-background: #060606;
    --color-button-active-border: #666;
    --color-separator: #444;
  }

  button,
  a.button {
    color: var(--provider-dark-color, var(--color-primary)) !important;
    background-color: var(
      --provider-dark-bg,
      var(--color-background)
    ) !important;
  }

    :is(button,a.button):hover {
      background-color: var(
        --provider-dark-bg-hover,
        var(--color-background-hover)
      ) !important;
    }

    :is(button,a.button) span {
      color: var(--provider-dark-bg) !important;
    }
}

html {
  box-sizing: border-box;
}

*,
*:before,
*:after {
  box-sizing: inherit;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--color-background);
  margin: 0;
  padding: 0;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    "Noto Sans",
    sans-serif,
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
    "Noto Color Emoji";
}

h1 {
  margin-bottom: 1.5rem;
  padding: 0 1rem;
  font-weight: 400;
  color: var(--color-text);
}

p {
  margin-bottom: 1.5rem;
  padding: 0 1rem;
  color: var(--color-text);
}

form {
  margin: 0;
  padding: 0;
}

label {
  font-weight: 500;
  text-align: left;
  margin-bottom: 0.25rem;
  display: block;
  color: var(--color-text);
}

input[type] {
  box-sizing: border-box;
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  border: var(--border-width) solid var(--color-control-border);
  background: var(--color-background-card);
  font-size: 1rem;
  border-radius: var(--border-radius);
  color: var(--color-text);
}

p {
  font-size: 1.1rem;
  line-height: 2rem;
}

a.button {
  text-decoration: none;
  line-height: 1rem;
}

a.button:link,
  a.button:visited {
    background-color: var(--color-background);
    color: var(--color-primary);
  }

button,
a.button {
  padding: 0.75rem 1rem;
  color: var(--provider-color, var(--color-primary));
  background-color: var(--provider-bg, var(--color-background));
  border: 1px solid #00000031;
  font-size: 0.9rem;
  height: 50px;
  border-radius: var(--border-radius);
  transition: background-color 250ms ease-in-out;
  font-weight: 300;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:is(button,a.button):hover {
    background-color: var(--provider-bg-hover, var(--color-background-hover));
    cursor: pointer;
  }

:is(button,a.button):active {
    cursor: pointer;
  }

:is(button,a.button) span {
    color: #fff;
  }

#submitButton {
  color: var(--button-text-color, var(--color-info-text));
  background-color: var(--brand-color, var(--color-info));
  width: 100%;
}

#submitButton:hover {
    background-color: var(
      --button-hover-bg,
      var(--color-info-hover)
    ) !important;
  }

a.site {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 1rem;
  line-height: 2rem;
}

a.site:hover {
    text-decoration: underline;
  }

.page {
  position: absolute;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.page > div {
    text-align: center;
  }

.error a.button {
    padding-left: 2rem;
    padding-right: 2rem;
    margin-top: 0.5rem;
  }

.error .message {
    margin-bottom: 1.5rem;
  }

.signin input[type="text"] {
    margin-left: auto;
    margin-right: auto;
    display: block;
  }

.signin hr {
    display: block;
    border: 0;
    border-top: 1px solid var(--color-separator);
    margin: 2rem auto 1rem auto;
    overflow: visible;
  }

.signin hr::before {
      content: "or";
      background: var(--color-background-card);
      color: #888;
      padding: 0 0.4rem;
      position: relative;
      top: -0.7rem;
    }

.signin .error {
    background: #f5f5f5;
    font-weight: 500;
    border-radius: 0.3rem;
    background: var(--color-error);
  }

.signin .error p {
      text-align: left;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      line-height: 1.2rem;
      color: var(--color-info-text);
    }

.signin > div,
  .signin form {
    display: block;
  }

.signin > div input[type], .signin form input[type] {
      margin-bottom: 0.5rem;
    }

.signin > div button, .signin form button {
      width: 100%;
    }

.signin .provider + .provider {
    margin-top: 1rem;
  }

.logo {
  display: inline-block;
  max-width: 150px;
  margin: 1.25rem 0;
  max-height: 70px;
}

.card {
  background-color: var(--color-background-card);
  border-radius: 1rem;
  padding: 1.25rem 2rem;
}

.card .header {
    color: var(--color-primary);
  }

.card input[type]::-moz-placeholder {
    color: color-mix(
      in srgb,
      var(--color-text) 20%,
      var(--color-button-active-background)
    );
  }

.card input[type]::placeholder {
    color: color-mix(
      in srgb,
      var(--color-text) 20%,
      var(--color-button-active-background)
    );
  }

.card input[type] {
    background: color-mix(in srgb, var(--color-background-card) 95%, black);
  }

.section-header {
  color: var(--color-text);
}

@media screen and (min-width: 450px) {
  .card {
    margin: 2rem 0;
    width: 368px;
  }
}

@media screen and (max-width: 450px) {
  .card {
    margin: 1rem 0;
    width: 343px;
  }
}
`;
  }
});
function VerifyRequestPage(props) {
  const { url, theme: theme2 } = props;
  return u3("div", { className: "verify-request", children: [theme2.brandColor && u3("style", { dangerouslySetInnerHTML: {
    __html: `
        :root {
          --brand-color: ${theme2.brandColor}
        }
      `
  } }), u3("div", { className: "card", children: [theme2.logo && u3("img", { src: theme2.logo, alt: "Logo", className: "logo" }), u3("h1", { children: "Check your email" }), u3("p", { children: "A sign in link has been sent to your email address." }), u3("p", { children: u3("a", { className: "site", href: url.origin, children: url.host }) })] })] });
}
__name(VerifyRequestPage, "VerifyRequestPage");
var init_verify_request = __esm({
  "node_modules/@auth/core/lib/pages/verify-request.js"() {
    init_jsxRuntime_module();
  }
});
function send({ html, title, status, cookies, theme: theme2, headTags }) {
  return {
    cookies,
    status,
    headers: { "Content-Type": "text/html" },
    body: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${styles_default}</style><title>${title}</title>${headTags ?? ""}</head><body class="__next-auth-theme-${theme2?.colorScheme ?? "auto"}"><div class="page">${D(html)}</div></body></html>`
  };
}
__name(send, "send");
function renderPage(params) {
  const { url, theme: theme2, query, cookies, pages, providers } = params;
  return {
    csrf(skip, options2, cookies2) {
      if (!skip) {
        return {
          headers: { "Content-Type": "application/json" },
          body: { csrfToken: options2.csrfToken },
          cookies: cookies2
        };
      }
      options2.logger.warn("csrf-disabled");
      cookies2.push({
        name: options2.cookies.csrfToken.name,
        value: "",
        options: { ...options2.cookies.csrfToken.options, maxAge: 0 }
      });
      return { status: 404, cookies: cookies2 };
    },
    providers(providers2) {
      return {
        headers: { "Content-Type": "application/json" },
        body: providers2.reduce((acc, { id, name, type, signinUrl, callbackUrl }) => {
          acc[id] = { id, name, type, signinUrl, callbackUrl };
          return acc;
        }, {})
      };
    },
    signin(providerId, error2) {
      if (providerId)
        throw new UnknownAction("Unsupported action");
      if (pages?.signIn) {
        let signinUrl = `${pages.signIn}${pages.signIn.includes("?") ? "&" : "?"}${new URLSearchParams({ callbackUrl: params.callbackUrl ?? "/" })}`;
        if (error2)
          signinUrl = `${signinUrl}&${new URLSearchParams({ error: error2 })}`;
        return { redirect: signinUrl, cookies };
      }
      const webauthnProvider = providers?.find((p3) => p3.type === "webauthn" && p3.enableConditionalUI && !!p3.simpleWebAuthnBrowserVersion);
      let simpleWebAuthnBrowserScript = "";
      if (webauthnProvider) {
        const { simpleWebAuthnBrowserVersion } = webauthnProvider;
        simpleWebAuthnBrowserScript = `<script src="https://unpkg.com/@simplewebauthn/browser@${simpleWebAuthnBrowserVersion}/dist/bundle/index.umd.min.js" crossorigin="anonymous"><\/script>`;
      }
      return send({
        cookies,
        theme: theme2,
        html: SigninPage({
          csrfToken: params.csrfToken,
          // We only want to render providers
          providers: params.providers?.filter((provider) => (
            // Always render oauth and email type providers
            ["email", "oauth", "oidc"].includes(provider.type) || // Only render credentials type provider if credentials are defined
            provider.type === "credentials" && provider.credentials || // Only render webauthn type provider if formFields are defined
            provider.type === "webauthn" && provider.formFields || // Don't render other provider types
            false
          )),
          callbackUrl: params.callbackUrl,
          theme: params.theme,
          error: error2,
          ...query
        }),
        title: "Sign In",
        headTags: simpleWebAuthnBrowserScript
      });
    },
    signout() {
      if (pages?.signOut)
        return { redirect: pages.signOut, cookies };
      return send({
        cookies,
        theme: theme2,
        html: SignoutPage({ csrfToken: params.csrfToken, url, theme: theme2 }),
        title: "Sign Out"
      });
    },
    verifyRequest(props) {
      if (pages?.verifyRequest)
        return {
          redirect: `${pages.verifyRequest}${url?.search ?? ""}`,
          cookies
        };
      return send({
        cookies,
        theme: theme2,
        html: VerifyRequestPage({ url, theme: theme2, ...props }),
        title: "Verify Request"
      });
    },
    error(error2) {
      if (pages?.error) {
        return {
          redirect: `${pages.error}${pages.error.includes("?") ? "&" : "?"}error=${error2}`,
          cookies
        };
      }
      return send({
        cookies,
        theme: theme2,
        // @ts-expect-error fix error type
        ...ErrorPage({ url, theme: theme2, error: error2 }),
        title: "Error"
      });
    }
  };
}
__name(renderPage, "renderPage");
var init_pages = __esm({
  "node_modules/@auth/core/lib/pages/index.js"() {
    init_index_module();
    init_error();
    init_signin();
    init_signout();
    init_styles();
    init_verify_request();
    init_errors();
  }
});
function fromDate(time, date = Date.now()) {
  return new Date(date + time * 1e3);
}
__name(fromDate, "fromDate");
var init_date = __esm({
  "node_modules/@auth/core/lib/utils/date.js"() {
  }
});
async function handleLoginOrRegister(sessionToken, _profile, _account, options2) {
  if (!_account?.providerAccountId || !_account.type)
    throw new Error("Missing or invalid provider account");
  if (!["email", "oauth", "oidc", "webauthn"].includes(_account.type))
    throw new Error("Provider not supported");
  const { adapter, jwt, events, session: { strategy: sessionStrategy, generateSessionToken } } = options2;
  if (!adapter) {
    return { user: _profile, account: _account };
  }
  const profile = _profile;
  let account = _account;
  const { createUser, updateUser, getUser, getUserByAccount, getUserByEmail, linkAccount, createSession, getSessionAndUser, deleteSession } = adapter;
  let session2 = null;
  let user = null;
  let isNewUser = false;
  const useJwtSession = sessionStrategy === "jwt";
  if (sessionToken) {
    if (useJwtSession) {
      try {
        const salt = options2.cookies.sessionToken.name;
        session2 = await jwt.decode({ ...jwt, token: sessionToken, salt });
        if (session2 && "sub" in session2 && session2.sub) {
          user = await getUser(session2.sub);
        }
      } catch {
      }
    } else {
      const userAndSession = await getSessionAndUser(sessionToken);
      if (userAndSession) {
        session2 = userAndSession.session;
        user = userAndSession.user;
      }
    }
  }
  if (account.type === "email") {
    const userByEmail = await getUserByEmail(profile.email);
    if (userByEmail) {
      if (user?.id !== userByEmail.id && !useJwtSession && sessionToken) {
        await deleteSession(sessionToken);
      }
      user = await updateUser({
        id: userByEmail.id,
        emailVerified: /* @__PURE__ */ new Date()
      });
      await events.updateUser?.({ user });
    } else {
      user = await createUser({ ...profile, emailVerified: /* @__PURE__ */ new Date() });
      await events.createUser?.({ user });
      isNewUser = true;
    }
    session2 = useJwtSession ? {} : await createSession({
      sessionToken: generateSessionToken(),
      userId: user.id,
      expires: fromDate(options2.session.maxAge)
    });
    return { session: session2, user, isNewUser };
  } else if (account.type === "webauthn") {
    const userByAccount2 = await getUserByAccount({
      providerAccountId: account.providerAccountId,
      provider: account.provider
    });
    if (userByAccount2) {
      if (user) {
        if (userByAccount2.id === user.id) {
          const currentAccount2 = { ...account, userId: user.id };
          return { session: session2, user, isNewUser, account: currentAccount2 };
        }
        throw new AccountNotLinked("The account is already associated with another user", { provider: account.provider });
      }
      session2 = useJwtSession ? {} : await createSession({
        sessionToken: generateSessionToken(),
        userId: userByAccount2.id,
        expires: fromDate(options2.session.maxAge)
      });
      const currentAccount = {
        ...account,
        userId: userByAccount2.id
      };
      return {
        session: session2,
        user: userByAccount2,
        isNewUser,
        account: currentAccount
      };
    } else {
      if (user) {
        await linkAccount({ ...account, userId: user.id });
        await events.linkAccount?.({ user, account, profile });
        const currentAccount2 = { ...account, userId: user.id };
        return { session: session2, user, isNewUser, account: currentAccount2 };
      }
      const userByEmail = profile.email ? await getUserByEmail(profile.email) : null;
      if (userByEmail) {
        throw new AccountNotLinked("Another account already exists with the same e-mail address", { provider: account.provider });
      } else {
        user = await createUser({ ...profile });
      }
      await events.createUser?.({ user });
      await linkAccount({ ...account, userId: user.id });
      await events.linkAccount?.({ user, account, profile });
      session2 = useJwtSession ? {} : await createSession({
        sessionToken: generateSessionToken(),
        userId: user.id,
        expires: fromDate(options2.session.maxAge)
      });
      const currentAccount = { ...account, userId: user.id };
      return { session: session2, user, isNewUser: true, account: currentAccount };
    }
  }
  const userByAccount = await getUserByAccount({
    providerAccountId: account.providerAccountId,
    provider: account.provider
  });
  if (userByAccount) {
    if (user) {
      if (userByAccount.id === user.id) {
        return { session: session2, user, isNewUser };
      }
      throw new OAuthAccountNotLinked("The account is already associated with another user", { provider: account.provider });
    }
    session2 = useJwtSession ? {} : await createSession({
      sessionToken: generateSessionToken(),
      userId: userByAccount.id,
      expires: fromDate(options2.session.maxAge)
    });
    return { session: session2, user: userByAccount, isNewUser };
  } else {
    const { provider: p3 } = options2;
    const { type, provider, providerAccountId, userId, ...tokenSet } = account;
    const defaults = { providerAccountId, provider, type, userId };
    account = Object.assign(p3.account(tokenSet) ?? {}, defaults);
    if (user) {
      await linkAccount({ ...account, userId: user.id });
      await events.linkAccount?.({ user, account, profile });
      return { session: session2, user, isNewUser };
    }
    const userByEmail = profile.email ? await getUserByEmail(profile.email) : null;
    if (userByEmail) {
      const provider2 = options2.provider;
      if (provider2?.allowDangerousEmailAccountLinking) {
        user = userByEmail;
        isNewUser = false;
      } else {
        throw new OAuthAccountNotLinked("Another account already exists with the same e-mail address", { provider: account.provider });
      }
    } else {
      user = await createUser({ ...profile, emailVerified: null });
      isNewUser = true;
    }
    await events.createUser?.({ user });
    await linkAccount({ ...account, userId: user.id });
    await events.linkAccount?.({ user, account, profile });
    session2 = useJwtSession ? {} : await createSession({
      sessionToken: generateSessionToken(),
      userId: user.id,
      expires: fromDate(options2.session.maxAge)
    });
    return { session: session2, user, isNewUser };
  }
}
__name(handleLoginOrRegister, "handleLoginOrRegister");
var init_handle_login = __esm({
  "node_modules/@auth/core/lib/actions/callback/handle-login.js"() {
    init_errors();
    init_date();
  }
});
function looseInstanceOf(input, expected) {
  if (input == null) {
    return false;
  }
  try {
    return input instanceof expected || Object.getPrototypeOf(input)[Symbol.toStringTag] === expected.prototype[Symbol.toStringTag];
  } catch {
    return false;
  }
}
__name(looseInstanceOf, "looseInstanceOf");
function CodedTypeError(message2, code, cause) {
  const err = new TypeError(message2, { cause });
  Object.assign(err, { code });
  return err;
}
__name(CodedTypeError, "CodedTypeError");
function buf(input) {
  if (typeof input === "string") {
    return encoder2.encode(input);
  }
  return decoder2.decode(input);
}
__name(buf, "buf");
function b64u(input) {
  if (typeof input === "string") {
    return decodeBase64Url(input);
  }
  return encodeBase64Url(input);
}
__name(b64u, "b64u");
function OPE(message2, code, cause) {
  return new OperationProcessingError(message2, { code, cause });
}
__name(OPE, "OPE");
function assertCryptoKey(key2, it) {
  if (!(key2 instanceof CryptoKey)) {
    throw CodedTypeError(`${it} must be a CryptoKey`, ERR_INVALID_ARG_TYPE);
  }
}
__name(assertCryptoKey, "assertCryptoKey");
function assertPrivateKey(key2, it) {
  assertCryptoKey(key2, it);
  if (key2.type !== "private") {
    throw CodedTypeError(`${it} must be a private CryptoKey`, ERR_INVALID_ARG_VALUE);
  }
}
__name(assertPrivateKey, "assertPrivateKey");
function isJsonObject(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return false;
  }
  return true;
}
__name(isJsonObject, "isJsonObject");
function prepareHeaders(input) {
  if (looseInstanceOf(input, Headers)) {
    input = Object.fromEntries(input.entries());
  }
  const headers2 = new Headers(input ?? {});
  if (USER_AGENT && !headers2.has("user-agent")) {
    headers2.set("user-agent", USER_AGENT);
  }
  if (headers2.has("authorization")) {
    throw CodedTypeError('"options.headers" must not include the "authorization" header name', ERR_INVALID_ARG_VALUE);
  }
  return headers2;
}
__name(prepareHeaders, "prepareHeaders");
function signal(url, value) {
  if (value !== void 0) {
    if (typeof value === "function") {
      value = value(url.href);
    }
    if (!(value instanceof AbortSignal)) {
      throw CodedTypeError('"options.signal" must return or be an instance of AbortSignal', ERR_INVALID_ARG_TYPE);
    }
    return value;
  }
  return void 0;
}
__name(signal, "signal");
function replaceDoubleSlash(pathname) {
  if (pathname.includes("//")) {
    return pathname.replace("//", "/");
  }
  return pathname;
}
__name(replaceDoubleSlash, "replaceDoubleSlash");
function prependWellKnown(url, wellKnown, allowTerminatingSlash = false) {
  if (url.pathname === "/") {
    url.pathname = wellKnown;
  } else {
    url.pathname = replaceDoubleSlash(`${wellKnown}/${allowTerminatingSlash ? url.pathname : url.pathname.replace(/(\/)$/, "")}`);
  }
  return url;
}
__name(prependWellKnown, "prependWellKnown");
function appendWellKnown(url, wellKnown) {
  url.pathname = replaceDoubleSlash(`${url.pathname}/${wellKnown}`);
  return url;
}
__name(appendWellKnown, "appendWellKnown");
async function performDiscovery(input, urlName, transform, options2) {
  if (!(input instanceof URL)) {
    throw CodedTypeError(`"${urlName}" must be an instance of URL`, ERR_INVALID_ARG_TYPE);
  }
  checkProtocol(input, options2?.[allowInsecureRequests] !== true);
  const url = transform(new URL(input.href));
  const headers2 = prepareHeaders(options2?.headers);
  headers2.set("accept", "application/json");
  return (options2?.[customFetch2] || fetch)(url.href, {
    body: void 0,
    headers: Object.fromEntries(headers2.entries()),
    method: "GET",
    redirect: "manual",
    signal: signal(url, options2?.signal)
  });
}
__name(performDiscovery, "performDiscovery");
async function discoveryRequest(issuerIdentifier, options2) {
  return performDiscovery(issuerIdentifier, "issuerIdentifier", (url) => {
    switch (options2?.algorithm) {
      case void 0:
      case "oidc":
        appendWellKnown(url, ".well-known/openid-configuration");
        break;
      case "oauth2":
        prependWellKnown(url, ".well-known/oauth-authorization-server");
        break;
      default:
        throw CodedTypeError('"options.algorithm" must be "oidc" (default), or "oauth2"', ERR_INVALID_ARG_VALUE);
    }
    return url;
  }, options2);
}
__name(discoveryRequest, "discoveryRequest");
function assertNumber(input, allow0, it, code, cause) {
  try {
    if (typeof input !== "number" || !Number.isFinite(input)) {
      throw CodedTypeError(`${it} must be a number`, ERR_INVALID_ARG_TYPE, cause);
    }
    if (input > 0)
      return;
    if (allow0) {
      if (input !== 0) {
        throw CodedTypeError(`${it} must be a non-negative number`, ERR_INVALID_ARG_VALUE, cause);
      }
      return;
    }
    throw CodedTypeError(`${it} must be a positive number`, ERR_INVALID_ARG_VALUE, cause);
  } catch (err) {
    if (code) {
      throw OPE(err.message, code, cause);
    }
    throw err;
  }
}
__name(assertNumber, "assertNumber");
function assertString(input, it, code, cause) {
  try {
    if (typeof input !== "string") {
      throw CodedTypeError(`${it} must be a string`, ERR_INVALID_ARG_TYPE, cause);
    }
    if (input.length === 0) {
      throw CodedTypeError(`${it} must not be empty`, ERR_INVALID_ARG_VALUE, cause);
    }
  } catch (err) {
    if (code) {
      throw OPE(err.message, code, cause);
    }
    throw err;
  }
}
__name(assertString, "assertString");
async function processDiscoveryResponse(expectedIssuerIdentifier, response) {
  const expected = expectedIssuerIdentifier;
  if (!(expected instanceof URL) && expected !== _nodiscoverycheck) {
    throw CodedTypeError('"expectedIssuerIdentifier" must be an instance of URL', ERR_INVALID_ARG_TYPE);
  }
  if (!looseInstanceOf(response, Response)) {
    throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
  }
  if (response.status !== 200) {
    throw OPE('"response" is not a conform Authorization Server Metadata response (unexpected HTTP status code)', RESPONSE_IS_NOT_CONFORM, response);
  }
  assertReadableResponse(response);
  const json2 = await getResponseJsonBody(response);
  assertString(json2.issuer, '"response" body "issuer" property', INVALID_RESPONSE, { body: json2 });
  if (expected !== _nodiscoverycheck && new URL(json2.issuer).href !== expected.href) {
    throw OPE('"response" body "issuer" property does not match the expected value', JSON_ATTRIBUTE_COMPARISON, { expected: expected.href, body: json2, attribute: "issuer" });
  }
  return json2;
}
__name(processDiscoveryResponse, "processDiscoveryResponse");
function assertApplicationJson(response) {
  assertContentType(response, "application/json");
}
__name(assertApplicationJson, "assertApplicationJson");
function notJson(response, ...types2) {
  let msg = '"response" content-type must be ';
  if (types2.length > 2) {
    const last = types2.pop();
    msg += `${types2.join(", ")}, or ${last}`;
  } else if (types2.length === 2) {
    msg += `${types2[0]} or ${types2[1]}`;
  } else {
    msg += types2[0];
  }
  return OPE(msg, RESPONSE_IS_NOT_JSON, response);
}
__name(notJson, "notJson");
function assertContentType(response, contentType) {
  if (getContentType(response) !== contentType) {
    throw notJson(response, contentType);
  }
}
__name(assertContentType, "assertContentType");
function randomBytes() {
  return b64u(crypto.getRandomValues(new Uint8Array(32)));
}
__name(randomBytes, "randomBytes");
function generateRandomCodeVerifier() {
  return randomBytes();
}
__name(generateRandomCodeVerifier, "generateRandomCodeVerifier");
function generateRandomState() {
  return randomBytes();
}
__name(generateRandomState, "generateRandomState");
function generateRandomNonce() {
  return randomBytes();
}
__name(generateRandomNonce, "generateRandomNonce");
async function calculatePKCECodeChallenge(codeVerifier) {
  assertString(codeVerifier, "codeVerifier");
  return b64u(await crypto.subtle.digest("SHA-256", buf(codeVerifier)));
}
__name(calculatePKCECodeChallenge, "calculatePKCECodeChallenge");
function getKeyAndKid(input) {
  if (input instanceof CryptoKey) {
    return { key: input };
  }
  if (!(input?.key instanceof CryptoKey)) {
    return {};
  }
  if (input.kid !== void 0) {
    assertString(input.kid, '"kid"');
  }
  return {
    key: input.key,
    kid: input.kid
  };
}
__name(getKeyAndKid, "getKeyAndKid");
function psAlg(key2) {
  switch (key2.algorithm.hash.name) {
    case "SHA-256":
      return "PS256";
    case "SHA-384":
      return "PS384";
    case "SHA-512":
      return "PS512";
    default:
      throw new UnsupportedOperationError("unsupported RsaHashedKeyAlgorithm hash name", {
        cause: key2
      });
  }
}
__name(psAlg, "psAlg");
function rsAlg(key2) {
  switch (key2.algorithm.hash.name) {
    case "SHA-256":
      return "RS256";
    case "SHA-384":
      return "RS384";
    case "SHA-512":
      return "RS512";
    default:
      throw new UnsupportedOperationError("unsupported RsaHashedKeyAlgorithm hash name", {
        cause: key2
      });
  }
}
__name(rsAlg, "rsAlg");
function esAlg(key2) {
  switch (key2.algorithm.namedCurve) {
    case "P-256":
      return "ES256";
    case "P-384":
      return "ES384";
    case "P-521":
      return "ES512";
    default:
      throw new UnsupportedOperationError("unsupported EcKeyAlgorithm namedCurve", { cause: key2 });
  }
}
__name(esAlg, "esAlg");
function keyToJws(key2) {
  switch (key2.algorithm.name) {
    case "RSA-PSS":
      return psAlg(key2);
    case "RSASSA-PKCS1-v1_5":
      return rsAlg(key2);
    case "ECDSA":
      return esAlg(key2);
    case "Ed25519":
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return key2.algorithm.name;
    case "EdDSA":
      return "Ed25519";
    default:
      throw new UnsupportedOperationError("unsupported CryptoKey algorithm name", { cause: key2 });
  }
}
__name(keyToJws, "keyToJws");
function getClockSkew(client) {
  const skew = client?.[clockSkew];
  return typeof skew === "number" && Number.isFinite(skew) ? skew : 0;
}
__name(getClockSkew, "getClockSkew");
function getClockTolerance(client) {
  const tolerance = client?.[clockTolerance];
  return typeof tolerance === "number" && Number.isFinite(tolerance) && Math.sign(tolerance) !== -1 ? tolerance : 30;
}
__name(getClockTolerance, "getClockTolerance");
function epochTime() {
  return Math.floor(Date.now() / 1e3);
}
__name(epochTime, "epochTime");
function assertAs(as) {
  if (typeof as !== "object" || as === null) {
    throw CodedTypeError('"as" must be an object', ERR_INVALID_ARG_TYPE);
  }
  assertString(as.issuer, '"as.issuer"');
}
__name(assertAs, "assertAs");
function assertClient(client) {
  if (typeof client !== "object" || client === null) {
    throw CodedTypeError('"client" must be an object', ERR_INVALID_ARG_TYPE);
  }
  assertString(client.client_id, '"client.client_id"');
}
__name(assertClient, "assertClient");
function ClientSecretPost(clientSecret) {
  assertString(clientSecret, '"clientSecret"');
  return (_as, client, body2, _headers) => {
    body2.set("client_id", client.client_id);
    body2.set("client_secret", clientSecret);
  };
}
__name(ClientSecretPost, "ClientSecretPost");
function clientAssertionPayload(as, client) {
  const now2 = epochTime() + getClockSkew(client);
  return {
    jti: randomBytes(),
    aud: as.issuer,
    exp: now2 + 60,
    iat: now2,
    nbf: now2,
    iss: client.client_id,
    sub: client.client_id
  };
}
__name(clientAssertionPayload, "clientAssertionPayload");
function PrivateKeyJwt(clientPrivateKey, options2) {
  const { key: key2, kid } = getKeyAndKid(clientPrivateKey);
  assertPrivateKey(key2, '"clientPrivateKey.key"');
  return async (as, client, body2, _headers) => {
    const header = { alg: keyToJws(key2), kid };
    const payload = clientAssertionPayload(as, client);
    options2?.[modifyAssertion]?.(header, payload);
    body2.set("client_id", client.client_id);
    body2.set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
    body2.set("client_assertion", await signJwt(header, payload, key2));
  };
}
__name(PrivateKeyJwt, "PrivateKeyJwt");
function ClientSecretJwt(clientSecret, options2) {
  assertString(clientSecret, '"clientSecret"');
  const modify = options2?.[modifyAssertion];
  let key2;
  return async (as, client, body2, _headers) => {
    key2 ||= await crypto.subtle.importKey("raw", buf(clientSecret), { hash: "SHA-256", name: "HMAC" }, false, ["sign"]);
    const header = { alg: "HS256" };
    const payload = clientAssertionPayload(as, client);
    modify?.(header, payload);
    const data = `${b64u(buf(JSON.stringify(header)))}.${b64u(buf(JSON.stringify(payload)))}`;
    const hmac = await crypto.subtle.sign(key2.algorithm, key2, buf(data));
    body2.set("client_id", client.client_id);
    body2.set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
    body2.set("client_assertion", `${data}.${b64u(new Uint8Array(hmac))}`);
  };
}
__name(ClientSecretJwt, "ClientSecretJwt");
function None() {
  return (_as, client, body2, _headers) => {
    body2.set("client_id", client.client_id);
  };
}
__name(None, "None");
async function signJwt(header, payload, key2) {
  if (!key2.usages.includes("sign")) {
    throw CodedTypeError('CryptoKey instances used for signing assertions must include "sign" in their "usages"', ERR_INVALID_ARG_VALUE);
  }
  const input = `${b64u(buf(JSON.stringify(header)))}.${b64u(buf(JSON.stringify(payload)))}`;
  const signature = b64u(await crypto.subtle.sign(keyToSubtle(key2), key2, buf(input)));
  return `${input}.${signature}`;
}
__name(signJwt, "signJwt");
function checkProtocol(url, enforceHttps) {
  if (enforceHttps && url.protocol !== "https:") {
    throw OPE("only requests to HTTPS are allowed", HTTP_REQUEST_FORBIDDEN, url);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw OPE("only HTTP and HTTPS requests are allowed", REQUEST_PROTOCOL_FORBIDDEN, url);
  }
}
__name(checkProtocol, "checkProtocol");
function validateEndpoint(value, endpoint, useMtlsAlias, enforceHttps) {
  let url;
  if (typeof value !== "string" || !(url = URLParse(value))) {
    throw OPE(`authorization server metadata does not contain a valid ${useMtlsAlias ? `"as.mtls_endpoint_aliases.${endpoint}"` : `"as.${endpoint}"`}`, value === void 0 ? MISSING_SERVER_METADATA : INVALID_SERVER_METADATA, { attribute: useMtlsAlias ? `mtls_endpoint_aliases.${endpoint}` : endpoint });
  }
  checkProtocol(url, enforceHttps);
  return url;
}
__name(validateEndpoint, "validateEndpoint");
function resolveEndpoint(as, endpoint, useMtlsAlias, enforceHttps) {
  if (useMtlsAlias && as.mtls_endpoint_aliases && endpoint in as.mtls_endpoint_aliases) {
    return validateEndpoint(as.mtls_endpoint_aliases[endpoint], endpoint, useMtlsAlias, enforceHttps);
  }
  return validateEndpoint(as[endpoint], endpoint, useMtlsAlias, enforceHttps);
}
__name(resolveEndpoint, "resolveEndpoint");
function parseWwwAuthenticateChallenges(response) {
  if (!looseInstanceOf(response, Response)) {
    throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
  }
  const header = response.headers.get("www-authenticate");
  if (header === null) {
    return void 0;
  }
  const challenges = [];
  let rest = header;
  while (rest) {
    let match = rest.match(schemeRE);
    const scheme = match?.["1"].toLowerCase();
    rest = match?.["2"];
    if (!scheme) {
      return void 0;
    }
    const parameters = {};
    let token68;
    while (rest) {
      let key2;
      let value;
      if (match = rest.match(quotedParamRE)) {
        ;
        [, key2, value, rest] = match;
        if (value.includes("\\")) {
          try {
            value = JSON.parse(`"${value}"`);
          } catch {
          }
        }
        parameters[key2.toLowerCase()] = value;
        continue;
      }
      if (match = rest.match(unquotedParamRE)) {
        ;
        [, key2, value, rest] = match;
        parameters[key2.toLowerCase()] = value;
        continue;
      }
      if (match = rest.match(token68ParamRE)) {
        if (Object.keys(parameters).length) {
          break;
        }
        ;
        [, token68, rest] = match;
        break;
      }
      return void 0;
    }
    const challenge = { scheme, parameters };
    if (token68) {
      challenge.token68 = token68;
    }
    challenges.push(challenge);
  }
  if (!challenges.length) {
    return void 0;
  }
  return challenges;
}
__name(parseWwwAuthenticateChallenges, "parseWwwAuthenticateChallenges");
async function parseOAuthResponseErrorBody(response) {
  if (response.status > 399 && response.status < 500) {
    assertReadableResponse(response);
    assertApplicationJson(response);
    try {
      const json2 = await response.clone().json();
      if (isJsonObject(json2) && typeof json2.error === "string" && json2.error.length) {
        return json2;
      }
    } catch {
    }
  }
  return void 0;
}
__name(parseOAuthResponseErrorBody, "parseOAuthResponseErrorBody");
async function checkOAuthBodyError(response, expected, label) {
  if (response.status !== expected) {
    checkAuthenticationChallenges(response);
    let err;
    if (err = await parseOAuthResponseErrorBody(response)) {
      await response.body?.cancel();
      throw new ResponseBodyError("server responded with an error in the response body", {
        cause: err,
        response
      });
    }
    throw OPE(`"response" is not a conform ${label} response (unexpected HTTP status code)`, RESPONSE_IS_NOT_CONFORM, response);
  }
}
__name(checkOAuthBodyError, "checkOAuthBodyError");
function assertDPoP(option) {
  if (!branded.has(option)) {
    throw CodedTypeError('"options.DPoP" is not a valid DPoPHandle', ERR_INVALID_ARG_VALUE);
  }
}
__name(assertDPoP, "assertDPoP");
async function resourceRequest(accessToken, method, url, headers2, body2, options2) {
  assertString(accessToken, '"accessToken"');
  if (!(url instanceof URL)) {
    throw CodedTypeError('"url" must be an instance of URL', ERR_INVALID_ARG_TYPE);
  }
  checkProtocol(url, options2?.[allowInsecureRequests] !== true);
  headers2 = prepareHeaders(headers2);
  if (options2?.DPoP) {
    assertDPoP(options2.DPoP);
    await options2.DPoP.addProof(url, headers2, method.toUpperCase(), accessToken);
  }
  headers2.set("authorization", `${headers2.has("dpop") ? "DPoP" : "Bearer"} ${accessToken}`);
  const response = await (options2?.[customFetch2] || fetch)(url.href, {
    body: body2,
    headers: Object.fromEntries(headers2.entries()),
    method,
    redirect: "manual",
    signal: signal(url, options2?.signal)
  });
  options2?.DPoP?.cacheNonce(response, url);
  return response;
}
__name(resourceRequest, "resourceRequest");
async function userInfoRequest(as, client, accessToken, options2) {
  assertAs(as);
  assertClient(client);
  const url = resolveEndpoint(as, "userinfo_endpoint", client.use_mtls_endpoint_aliases, options2?.[allowInsecureRequests] !== true);
  const headers2 = prepareHeaders(options2?.headers);
  if (client.userinfo_signed_response_alg) {
    headers2.set("accept", "application/jwt");
  } else {
    headers2.set("accept", "application/json");
    headers2.append("accept", "application/jwt");
  }
  return resourceRequest(accessToken, "GET", url, headers2, null, {
    ...options2,
    [clockSkew]: getClockSkew(client)
  });
}
__name(userInfoRequest, "userInfoRequest");
function getContentType(input) {
  return input.headers.get("content-type")?.split(";")[0];
}
__name(getContentType, "getContentType");
async function processUserInfoResponse(as, client, expectedSubject, response, options2) {
  assertAs(as);
  assertClient(client);
  if (!looseInstanceOf(response, Response)) {
    throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
  }
  checkAuthenticationChallenges(response);
  if (response.status !== 200) {
    throw OPE('"response" is not a conform UserInfo Endpoint response (unexpected HTTP status code)', RESPONSE_IS_NOT_CONFORM, response);
  }
  assertReadableResponse(response);
  let json2;
  if (getContentType(response) === "application/jwt") {
    const { claims, jwt } = await validateJwt(await response.text(), checkSigningAlgorithm.bind(void 0, client.userinfo_signed_response_alg, as.userinfo_signing_alg_values_supported, void 0), getClockSkew(client), getClockTolerance(client), options2?.[jweDecrypt]).then(validateOptionalAudience.bind(void 0, client.client_id)).then(validateOptionalIssuer.bind(void 0, as));
    jwtRefs.set(response, jwt);
    json2 = claims;
  } else {
    if (client.userinfo_signed_response_alg) {
      throw OPE("JWT UserInfo Response expected", JWT_USERINFO_EXPECTED, response);
    }
    json2 = await getResponseJsonBody(response);
  }
  assertString(json2.sub, '"response" body "sub" property', INVALID_RESPONSE, { body: json2 });
  switch (expectedSubject) {
    case skipSubjectCheck:
      break;
    default:
      assertString(expectedSubject, '"expectedSubject"');
      if (json2.sub !== expectedSubject) {
        throw OPE('unexpected "response" body "sub" property value', JSON_ATTRIBUTE_COMPARISON, {
          expected: expectedSubject,
          body: json2,
          attribute: "sub"
        });
      }
  }
  return json2;
}
__name(processUserInfoResponse, "processUserInfoResponse");
async function authenticatedRequest(as, client, clientAuthentication, url, body2, headers2, options2) {
  await clientAuthentication(as, client, body2, headers2);
  headers2.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
  return (options2?.[customFetch2] || fetch)(url.href, {
    body: body2,
    headers: Object.fromEntries(headers2.entries()),
    method: "POST",
    redirect: "manual",
    signal: signal(url, options2?.signal)
  });
}
__name(authenticatedRequest, "authenticatedRequest");
async function tokenEndpointRequest(as, client, clientAuthentication, grantType, parameters, options2) {
  const url = resolveEndpoint(as, "token_endpoint", client.use_mtls_endpoint_aliases, options2?.[allowInsecureRequests] !== true);
  parameters.set("grant_type", grantType);
  const headers2 = prepareHeaders(options2?.headers);
  headers2.set("accept", "application/json");
  if (options2?.DPoP !== void 0) {
    assertDPoP(options2.DPoP);
    await options2.DPoP.addProof(url, headers2, "POST");
  }
  const response = await authenticatedRequest(as, client, clientAuthentication, url, parameters, headers2, options2);
  options2?.DPoP?.cacheNonce(response, url);
  return response;
}
__name(tokenEndpointRequest, "tokenEndpointRequest");
function getValidatedIdTokenClaims(ref) {
  if (!ref.id_token) {
    return void 0;
  }
  const claims = idTokenClaims.get(ref);
  if (!claims) {
    throw CodedTypeError('"ref" was already garbage collected or did not resolve from the proper sources', ERR_INVALID_ARG_VALUE);
  }
  return claims;
}
__name(getValidatedIdTokenClaims, "getValidatedIdTokenClaims");
async function processGenericAccessTokenResponse(as, client, response, additionalRequiredIdTokenClaims, decryptFn, recognizedTokenTypes) {
  assertAs(as);
  assertClient(client);
  if (!looseInstanceOf(response, Response)) {
    throw CodedTypeError('"response" must be an instance of Response', ERR_INVALID_ARG_TYPE);
  }
  await checkOAuthBodyError(response, 200, "Token Endpoint");
  assertReadableResponse(response);
  const json2 = await getResponseJsonBody(response);
  assertString(json2.access_token, '"response" body "access_token" property', INVALID_RESPONSE, {
    body: json2
  });
  assertString(json2.token_type, '"response" body "token_type" property', INVALID_RESPONSE, {
    body: json2
  });
  json2.token_type = json2.token_type.toLowerCase();
  if (json2.expires_in !== void 0) {
    let expiresIn = typeof json2.expires_in !== "number" ? parseFloat(json2.expires_in) : json2.expires_in;
    assertNumber(expiresIn, true, '"response" body "expires_in" property', INVALID_RESPONSE, {
      body: json2
    });
    json2.expires_in = expiresIn;
  }
  if (json2.refresh_token !== void 0) {
    assertString(json2.refresh_token, '"response" body "refresh_token" property', INVALID_RESPONSE, {
      body: json2
    });
  }
  if (json2.scope !== void 0 && typeof json2.scope !== "string") {
    throw OPE('"response" body "scope" property must be a string', INVALID_RESPONSE, { body: json2 });
  }
  if (json2.id_token !== void 0) {
    assertString(json2.id_token, '"response" body "id_token" property', INVALID_RESPONSE, {
      body: json2
    });
    const requiredClaims = ["aud", "exp", "iat", "iss", "sub"];
    if (client.require_auth_time === true) {
      requiredClaims.push("auth_time");
    }
    if (client.default_max_age !== void 0) {
      assertNumber(client.default_max_age, true, '"client.default_max_age"');
      requiredClaims.push("auth_time");
    }
    if (additionalRequiredIdTokenClaims?.length) {
      requiredClaims.push(...additionalRequiredIdTokenClaims);
    }
    const { claims, jwt } = await validateJwt(json2.id_token, checkSigningAlgorithm.bind(void 0, client.id_token_signed_response_alg, as.id_token_signing_alg_values_supported, "RS256"), getClockSkew(client), getClockTolerance(client), decryptFn).then(validatePresence.bind(void 0, requiredClaims)).then(validateIssuer.bind(void 0, as)).then(validateAudience.bind(void 0, client.client_id));
    if (Array.isArray(claims.aud) && claims.aud.length !== 1) {
      if (claims.azp === void 0) {
        throw OPE('ID Token "aud" (audience) claim includes additional untrusted audiences', JWT_CLAIM_COMPARISON, { claims, claim: "aud" });
      }
      if (claims.azp !== client.client_id) {
        throw OPE('unexpected ID Token "azp" (authorized party) claim value', JWT_CLAIM_COMPARISON, { expected: client.client_id, claims, claim: "azp" });
      }
    }
    if (claims.auth_time !== void 0) {
      assertNumber(claims.auth_time, true, 'ID Token "auth_time" (authentication time)', INVALID_RESPONSE, { claims });
    }
    jwtRefs.set(response, jwt);
    idTokenClaims.set(json2, claims);
  }
  if (recognizedTokenTypes?.[json2.token_type] !== void 0) {
    recognizedTokenTypes[json2.token_type](response, json2);
  } else if (json2.token_type !== "dpop" && json2.token_type !== "bearer") {
    throw new UnsupportedOperationError("unsupported `token_type` value", { cause: { body: json2 } });
  }
  return json2;
}
__name(processGenericAccessTokenResponse, "processGenericAccessTokenResponse");
function checkAuthenticationChallenges(response) {
  let challenges;
  if (challenges = parseWwwAuthenticateChallenges(response)) {
    throw new WWWAuthenticateChallengeError("server responded with a challenge in the WWW-Authenticate HTTP Header", { cause: challenges, response });
  }
}
__name(checkAuthenticationChallenges, "checkAuthenticationChallenges");
function validateOptionalAudience(expected, result) {
  if (result.claims.aud !== void 0) {
    return validateAudience(expected, result);
  }
  return result;
}
__name(validateOptionalAudience, "validateOptionalAudience");
function validateAudience(expected, result) {
  if (Array.isArray(result.claims.aud)) {
    if (!result.claims.aud.includes(expected)) {
      throw OPE('unexpected JWT "aud" (audience) claim value', JWT_CLAIM_COMPARISON, {
        expected,
        claims: result.claims,
        claim: "aud"
      });
    }
  } else if (result.claims.aud !== expected) {
    throw OPE('unexpected JWT "aud" (audience) claim value', JWT_CLAIM_COMPARISON, {
      expected,
      claims: result.claims,
      claim: "aud"
    });
  }
  return result;
}
__name(validateAudience, "validateAudience");
function validateOptionalIssuer(as, result) {
  if (result.claims.iss !== void 0) {
    return validateIssuer(as, result);
  }
  return result;
}
__name(validateOptionalIssuer, "validateOptionalIssuer");
function validateIssuer(as, result) {
  const expected = as[_expectedIssuer]?.(result) ?? as.issuer;
  if (result.claims.iss !== expected) {
    throw OPE('unexpected JWT "iss" (issuer) claim value', JWT_CLAIM_COMPARISON, {
      expected,
      claims: result.claims,
      claim: "iss"
    });
  }
  return result;
}
__name(validateIssuer, "validateIssuer");
function brand(searchParams) {
  branded.add(searchParams);
  return searchParams;
}
__name(brand, "brand");
async function authorizationCodeGrantRequest(as, client, clientAuthentication, callbackParameters, redirectUri, codeVerifier, options2) {
  assertAs(as);
  assertClient(client);
  if (!branded.has(callbackParameters)) {
    throw CodedTypeError('"callbackParameters" must be an instance of URLSearchParams obtained from "validateAuthResponse()", or "validateJwtAuthResponse()', ERR_INVALID_ARG_VALUE);
  }
  assertString(redirectUri, '"redirectUri"');
  const code = getURLSearchParameter(callbackParameters, "code");
  if (!code) {
    throw OPE('no authorization code in "callbackParameters"', INVALID_RESPONSE);
  }
  const parameters = new URLSearchParams(options2?.additionalParameters);
  parameters.set("redirect_uri", redirectUri);
  parameters.set("code", code);
  if (codeVerifier !== nopkce) {
    assertString(codeVerifier, '"codeVerifier"');
    parameters.set("code_verifier", codeVerifier);
  }
  return tokenEndpointRequest(as, client, clientAuthentication, "authorization_code", parameters, options2);
}
__name(authorizationCodeGrantRequest, "authorizationCodeGrantRequest");
function validatePresence(required, result) {
  for (const claim of required) {
    if (result.claims[claim] === void 0) {
      throw OPE(`JWT "${claim}" (${jwtClaimNames[claim]}) claim missing`, INVALID_RESPONSE, {
        claims: result.claims
      });
    }
  }
  return result;
}
__name(validatePresence, "validatePresence");
async function processAuthorizationCodeResponse(as, client, response, options2) {
  if (typeof options2?.expectedNonce === "string" || typeof options2?.maxAge === "number" || options2?.requireIdToken) {
    return processAuthorizationCodeOpenIDResponse(as, client, response, options2.expectedNonce, options2.maxAge, options2[jweDecrypt], options2.recognizedTokenTypes);
  }
  return processAuthorizationCodeOAuth2Response(as, client, response, options2?.[jweDecrypt], options2?.recognizedTokenTypes);
}
__name(processAuthorizationCodeResponse, "processAuthorizationCodeResponse");
async function processAuthorizationCodeOpenIDResponse(as, client, response, expectedNonce, maxAge, decryptFn, recognizedTokenTypes) {
  const additionalRequiredClaims = [];
  switch (expectedNonce) {
    case void 0:
      expectedNonce = expectNoNonce;
      break;
    case expectNoNonce:
      break;
    default:
      assertString(expectedNonce, '"expectedNonce" argument');
      additionalRequiredClaims.push("nonce");
  }
  maxAge ??= client.default_max_age;
  switch (maxAge) {
    case void 0:
      maxAge = skipAuthTimeCheck;
      break;
    case skipAuthTimeCheck:
      break;
    default:
      assertNumber(maxAge, true, '"maxAge" argument');
      additionalRequiredClaims.push("auth_time");
  }
  const result = await processGenericAccessTokenResponse(as, client, response, additionalRequiredClaims, decryptFn, recognizedTokenTypes);
  assertString(result.id_token, '"response" body "id_token" property', INVALID_RESPONSE, {
    body: result
  });
  const claims = getValidatedIdTokenClaims(result);
  if (maxAge !== skipAuthTimeCheck) {
    const now2 = epochTime() + getClockSkew(client);
    const tolerance = getClockTolerance(client);
    if (claims.auth_time + maxAge < now2 - tolerance) {
      throw OPE("too much time has elapsed since the last End-User authentication", JWT_TIMESTAMP_CHECK, { claims, now: now2, tolerance, claim: "auth_time" });
    }
  }
  if (expectedNonce === expectNoNonce) {
    if (claims.nonce !== void 0) {
      throw OPE('unexpected ID Token "nonce" claim value', JWT_CLAIM_COMPARISON, {
        expected: void 0,
        claims,
        claim: "nonce"
      });
    }
  } else if (claims.nonce !== expectedNonce) {
    throw OPE('unexpected ID Token "nonce" claim value', JWT_CLAIM_COMPARISON, {
      expected: expectedNonce,
      claims,
      claim: "nonce"
    });
  }
  return result;
}
__name(processAuthorizationCodeOpenIDResponse, "processAuthorizationCodeOpenIDResponse");
async function processAuthorizationCodeOAuth2Response(as, client, response, decryptFn, recognizedTokenTypes) {
  const result = await processGenericAccessTokenResponse(as, client, response, void 0, decryptFn, recognizedTokenTypes);
  const claims = getValidatedIdTokenClaims(result);
  if (claims) {
    if (client.default_max_age !== void 0) {
      assertNumber(client.default_max_age, true, '"client.default_max_age"');
      const now2 = epochTime() + getClockSkew(client);
      const tolerance = getClockTolerance(client);
      if (claims.auth_time + client.default_max_age < now2 - tolerance) {
        throw OPE("too much time has elapsed since the last End-User authentication", JWT_TIMESTAMP_CHECK, { claims, now: now2, tolerance, claim: "auth_time" });
      }
    }
    if (claims.nonce !== void 0) {
      throw OPE('unexpected ID Token "nonce" claim value', JWT_CLAIM_COMPARISON, {
        expected: void 0,
        claims,
        claim: "nonce"
      });
    }
  }
  return result;
}
__name(processAuthorizationCodeOAuth2Response, "processAuthorizationCodeOAuth2Response");
function assertReadableResponse(response) {
  if (response.bodyUsed) {
    throw CodedTypeError('"response" body has been used already', ERR_INVALID_ARG_VALUE);
  }
}
__name(assertReadableResponse, "assertReadableResponse");
function checkRsaKeyAlgorithm(key2) {
  const { algorithm } = key2;
  if (typeof algorithm.modulusLength !== "number" || algorithm.modulusLength < 2048) {
    throw new UnsupportedOperationError(`unsupported ${algorithm.name} modulusLength`, {
      cause: key2
    });
  }
}
__name(checkRsaKeyAlgorithm, "checkRsaKeyAlgorithm");
function ecdsaHashName(key2) {
  const { algorithm } = key2;
  switch (algorithm.namedCurve) {
    case "P-256":
      return "SHA-256";
    case "P-384":
      return "SHA-384";
    case "P-521":
      return "SHA-512";
    default:
      throw new UnsupportedOperationError("unsupported ECDSA namedCurve", { cause: key2 });
  }
}
__name(ecdsaHashName, "ecdsaHashName");
function keyToSubtle(key2) {
  switch (key2.algorithm.name) {
    case "ECDSA":
      return {
        name: key2.algorithm.name,
        hash: ecdsaHashName(key2)
      };
    case "RSA-PSS": {
      checkRsaKeyAlgorithm(key2);
      switch (key2.algorithm.hash.name) {
        case "SHA-256":
        case "SHA-384":
        case "SHA-512":
          return {
            name: key2.algorithm.name,
            saltLength: parseInt(key2.algorithm.hash.name.slice(-3), 10) >> 3
          };
        default:
          throw new UnsupportedOperationError("unsupported RSA-PSS hash name", { cause: key2 });
      }
    }
    case "RSASSA-PKCS1-v1_5":
      checkRsaKeyAlgorithm(key2);
      return key2.algorithm.name;
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
    case "Ed25519":
      return key2.algorithm.name;
  }
  throw new UnsupportedOperationError("unsupported CryptoKey algorithm name", { cause: key2 });
}
__name(keyToSubtle, "keyToSubtle");
async function validateJwt(jws, checkAlg, clockSkew2, clockTolerance2, decryptJwt) {
  let { 0: protectedHeader, 1: payload, length } = jws.split(".");
  if (length === 5) {
    if (decryptJwt !== void 0) {
      jws = await decryptJwt(jws);
      ({ 0: protectedHeader, 1: payload, length } = jws.split("."));
    } else {
      throw new UnsupportedOperationError("JWE decryption is not configured", { cause: jws });
    }
  }
  if (length !== 3) {
    throw OPE("Invalid JWT", INVALID_RESPONSE, jws);
  }
  let header;
  try {
    header = JSON.parse(buf(b64u(protectedHeader)));
  } catch (cause) {
    throw OPE("failed to parse JWT Header body as base64url encoded JSON", PARSE_ERROR, cause);
  }
  if (!isJsonObject(header)) {
    throw OPE("JWT Header must be a top level object", INVALID_RESPONSE, jws);
  }
  checkAlg(header);
  if (header.crit !== void 0) {
    throw new UnsupportedOperationError('no JWT "crit" header parameter extensions are supported', {
      cause: { header }
    });
  }
  let claims;
  try {
    claims = JSON.parse(buf(b64u(payload)));
  } catch (cause) {
    throw OPE("failed to parse JWT Payload body as base64url encoded JSON", PARSE_ERROR, cause);
  }
  if (!isJsonObject(claims)) {
    throw OPE("JWT Payload must be a top level object", INVALID_RESPONSE, jws);
  }
  const now2 = epochTime() + clockSkew2;
  if (claims.exp !== void 0) {
    if (typeof claims.exp !== "number") {
      throw OPE('unexpected JWT "exp" (expiration time) claim type', INVALID_RESPONSE, { claims });
    }
    if (claims.exp <= now2 - clockTolerance2) {
      throw OPE('unexpected JWT "exp" (expiration time) claim value, expiration is past current timestamp', JWT_TIMESTAMP_CHECK, { claims, now: now2, tolerance: clockTolerance2, claim: "exp" });
    }
  }
  if (claims.iat !== void 0) {
    if (typeof claims.iat !== "number") {
      throw OPE('unexpected JWT "iat" (issued at) claim type', INVALID_RESPONSE, { claims });
    }
  }
  if (claims.iss !== void 0) {
    if (typeof claims.iss !== "string") {
      throw OPE('unexpected JWT "iss" (issuer) claim type', INVALID_RESPONSE, { claims });
    }
  }
  if (claims.nbf !== void 0) {
    if (typeof claims.nbf !== "number") {
      throw OPE('unexpected JWT "nbf" (not before) claim type', INVALID_RESPONSE, { claims });
    }
    if (claims.nbf > now2 + clockTolerance2) {
      throw OPE('unexpected JWT "nbf" (not before) claim value', JWT_TIMESTAMP_CHECK, {
        claims,
        now: now2,
        tolerance: clockTolerance2,
        claim: "nbf"
      });
    }
  }
  if (claims.aud !== void 0) {
    if (typeof claims.aud !== "string" && !Array.isArray(claims.aud)) {
      throw OPE('unexpected JWT "aud" (audience) claim type', INVALID_RESPONSE, { claims });
    }
  }
  return { header, claims, jwt: jws };
}
__name(validateJwt, "validateJwt");
function checkSigningAlgorithm(client, issuer, fallback, header) {
  if (client !== void 0) {
    if (typeof client === "string" ? header.alg !== client : !client.includes(header.alg)) {
      throw OPE('unexpected JWT "alg" header parameter', INVALID_RESPONSE, {
        header,
        expected: client,
        reason: "client configuration"
      });
    }
    return;
  }
  if (Array.isArray(issuer)) {
    if (!issuer.includes(header.alg)) {
      throw OPE('unexpected JWT "alg" header parameter', INVALID_RESPONSE, {
        header,
        expected: issuer,
        reason: "authorization server metadata"
      });
    }
    return;
  }
  if (fallback !== void 0) {
    if (typeof fallback === "string" ? header.alg !== fallback : typeof fallback === "function" ? !fallback(header.alg) : !fallback.includes(header.alg)) {
      throw OPE('unexpected JWT "alg" header parameter', INVALID_RESPONSE, {
        header,
        expected: fallback,
        reason: "default value"
      });
    }
    return;
  }
  throw OPE('missing client or server configuration to verify used JWT "alg" header parameter', void 0, { client, issuer, fallback });
}
__name(checkSigningAlgorithm, "checkSigningAlgorithm");
function getURLSearchParameter(parameters, name) {
  const { 0: value, length } = parameters.getAll(name);
  if (length > 1) {
    throw OPE(`"${name}" parameter must be provided only once`, INVALID_RESPONSE);
  }
  return value;
}
__name(getURLSearchParameter, "getURLSearchParameter");
function validateAuthResponse(as, client, parameters, expectedState) {
  assertAs(as);
  assertClient(client);
  if (parameters instanceof URL) {
    parameters = parameters.searchParams;
  }
  if (!(parameters instanceof URLSearchParams)) {
    throw CodedTypeError('"parameters" must be an instance of URLSearchParams, or URL', ERR_INVALID_ARG_TYPE);
  }
  if (getURLSearchParameter(parameters, "response")) {
    throw OPE('"parameters" contains a JARM response, use validateJwtAuthResponse() instead of validateAuthResponse()', INVALID_RESPONSE, { parameters });
  }
  const iss = getURLSearchParameter(parameters, "iss");
  const state2 = getURLSearchParameter(parameters, "state");
  if (!iss && as.authorization_response_iss_parameter_supported) {
    throw OPE('response parameter "iss" (issuer) missing', INVALID_RESPONSE, { parameters });
  }
  if (iss && iss !== as.issuer) {
    throw OPE('unexpected "iss" (issuer) response parameter value', INVALID_RESPONSE, {
      expected: as.issuer,
      parameters
    });
  }
  switch (expectedState) {
    case void 0:
    case expectNoState:
      if (state2 !== void 0) {
        throw OPE('unexpected "state" response parameter encountered', INVALID_RESPONSE, {
          expected: void 0,
          parameters
        });
      }
      break;
    case skipStateCheck:
      break;
    default:
      assertString(expectedState, '"expectedState" argument');
      if (state2 !== expectedState) {
        throw OPE(state2 === void 0 ? 'response parameter "state" missing' : 'unexpected "state" response parameter value', INVALID_RESPONSE, { expected: expectedState, parameters });
      }
  }
  const error2 = getURLSearchParameter(parameters, "error");
  if (error2) {
    throw new AuthorizationResponseError("authorization response from the server is an error", {
      cause: parameters
    });
  }
  const id_token = getURLSearchParameter(parameters, "id_token");
  const token = getURLSearchParameter(parameters, "token");
  if (id_token !== void 0 || token !== void 0) {
    throw new UnsupportedOperationError("implicit and hybrid flows are not supported");
  }
  return brand(new URLSearchParams(parameters));
}
__name(validateAuthResponse, "validateAuthResponse");
async function getResponseJsonBody(response, check2 = assertApplicationJson) {
  let json2;
  try {
    json2 = await response.json();
  } catch (cause) {
    check2(response);
    throw OPE('failed to parse "response" body as JSON', PARSE_ERROR, cause);
  }
  if (!isJsonObject(json2)) {
    throw OPE('"response" body must be a top level object', INVALID_RESPONSE, { body: json2 });
  }
  return json2;
}
__name(getResponseJsonBody, "getResponseJsonBody");
var USER_AGENT;
var ERR_INVALID_ARG_VALUE;
var ERR_INVALID_ARG_TYPE;
var allowInsecureRequests;
var clockSkew;
var clockTolerance;
var customFetch2;
var modifyAssertion;
var jweDecrypt;
var jwksCache;
var encoder2;
var decoder2;
var encodeBase64Url;
var decodeBase64Url;
var UnsupportedOperationError;
var OperationProcessingError;
var URLParse;
var ResponseBodyError;
var AuthorizationResponseError;
var WWWAuthenticateChallengeError;
var tokenMatch;
var token68Match;
var quotedMatch;
var quotedParamMatcher;
var paramMatcher;
var schemeRE;
var quotedParamRE;
var unquotedParamRE;
var token68ParamRE;
var skipSubjectCheck;
var idTokenClaims;
var jwtRefs;
var branded;
var nopkce;
var jwtClaimNames;
var expectNoNonce;
var skipAuthTimeCheck;
var WWW_AUTHENTICATE_CHALLENGE;
var RESPONSE_BODY_ERROR;
var UNSUPPORTED_OPERATION;
var AUTHORIZATION_RESPONSE_ERROR;
var JWT_USERINFO_EXPECTED;
var PARSE_ERROR;
var INVALID_RESPONSE;
var RESPONSE_IS_NOT_JSON;
var RESPONSE_IS_NOT_CONFORM;
var HTTP_REQUEST_FORBIDDEN;
var REQUEST_PROTOCOL_FORBIDDEN;
var JWT_TIMESTAMP_CHECK;
var JWT_CLAIM_COMPARISON;
var JSON_ATTRIBUTE_COMPARISON;
var MISSING_SERVER_METADATA;
var INVALID_SERVER_METADATA;
var skipStateCheck;
var expectNoState;
var _nodiscoverycheck;
var _expectedIssuer;
var init_build = __esm({
  "node_modules/oauth4webapi/build/index.js"() {
    if (typeof navigator === "undefined" || !"Cloudflare-Workers"?.startsWith?.("Mozilla/5.0 ")) {
      const NAME = "oauth4webapi";
      const VERSION2 = "v3.8.2";
      USER_AGENT = `${NAME}/${VERSION2}`;
    }
    ERR_INVALID_ARG_VALUE = "ERR_INVALID_ARG_VALUE";
    ERR_INVALID_ARG_TYPE = "ERR_INVALID_ARG_TYPE";
    allowInsecureRequests = Symbol();
    clockSkew = Symbol();
    clockTolerance = Symbol();
    customFetch2 = Symbol();
    modifyAssertion = Symbol();
    jweDecrypt = Symbol();
    jwksCache = Symbol();
    encoder2 = new TextEncoder();
    decoder2 = new TextDecoder();
    if (Uint8Array.prototype.toBase64) {
      encodeBase64Url = /* @__PURE__ */ __name((input) => {
        if (input instanceof ArrayBuffer) {
          input = new Uint8Array(input);
        }
        return input.toBase64({ alphabet: "base64url", omitPadding: true });
      }, "encodeBase64Url");
    } else {
      const CHUNK_SIZE2 = 32768;
      encodeBase64Url = /* @__PURE__ */ __name((input) => {
        if (input instanceof ArrayBuffer) {
          input = new Uint8Array(input);
        }
        const arr = [];
        for (let i4 = 0; i4 < input.byteLength; i4 += CHUNK_SIZE2) {
          arr.push(String.fromCharCode.apply(null, input.subarray(i4, i4 + CHUNK_SIZE2)));
        }
        return btoa(arr.join("")).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      }, "encodeBase64Url");
    }
    if (Uint8Array.fromBase64) {
      decodeBase64Url = /* @__PURE__ */ __name((input) => {
        try {
          return Uint8Array.fromBase64(input, { alphabet: "base64url" });
        } catch (cause) {
          throw CodedTypeError("The input to be decoded is not correctly encoded.", ERR_INVALID_ARG_VALUE, cause);
        }
      }, "decodeBase64Url");
    } else {
      decodeBase64Url = /* @__PURE__ */ __name((input) => {
        try {
          const binary = atob(input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, ""));
          const bytes = new Uint8Array(binary.length);
          for (let i4 = 0; i4 < binary.length; i4++) {
            bytes[i4] = binary.charCodeAt(i4);
          }
          return bytes;
        } catch (cause) {
          throw CodedTypeError("The input to be decoded is not correctly encoded.", ERR_INVALID_ARG_VALUE, cause);
        }
      }, "decodeBase64Url");
    }
    UnsupportedOperationError = class extends Error {
      static {
        __name(this, "UnsupportedOperationError");
      }
      code;
      constructor(message2, options2) {
        super(message2, options2);
        this.name = this.constructor.name;
        this.code = UNSUPPORTED_OPERATION;
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    OperationProcessingError = class extends Error {
      static {
        __name(this, "OperationProcessingError");
      }
      code;
      constructor(message2, options2) {
        super(message2, options2);
        this.name = this.constructor.name;
        if (options2?.code) {
          this.code = options2?.code;
        }
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    URLParse = URL.parse ? (url, base2) => URL.parse(url, base2) : (url, base2) => {
      try {
        return new URL(url, base2);
      } catch {
        return null;
      }
    };
    ResponseBodyError = class extends Error {
      static {
        __name(this, "ResponseBodyError");
      }
      cause;
      code;
      error;
      status;
      error_description;
      response;
      constructor(message2, options2) {
        super(message2, options2);
        this.name = this.constructor.name;
        this.code = RESPONSE_BODY_ERROR;
        this.cause = options2.cause;
        this.error = options2.cause.error;
        this.status = options2.response.status;
        this.error_description = options2.cause.error_description;
        Object.defineProperty(this, "response", { enumerable: false, value: options2.response });
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    AuthorizationResponseError = class extends Error {
      static {
        __name(this, "AuthorizationResponseError");
      }
      cause;
      code;
      error;
      error_description;
      constructor(message2, options2) {
        super(message2, options2);
        this.name = this.constructor.name;
        this.code = AUTHORIZATION_RESPONSE_ERROR;
        this.cause = options2.cause;
        this.error = options2.cause.get("error");
        this.error_description = options2.cause.get("error_description") ?? void 0;
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    WWWAuthenticateChallengeError = class extends Error {
      static {
        __name(this, "WWWAuthenticateChallengeError");
      }
      cause;
      code;
      response;
      status;
      constructor(message2, options2) {
        super(message2, options2);
        this.name = this.constructor.name;
        this.code = WWW_AUTHENTICATE_CHALLENGE;
        this.cause = options2.cause;
        this.status = options2.response.status;
        this.response = options2.response;
        Object.defineProperty(this, "response", { enumerable: false });
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    tokenMatch = "[a-zA-Z0-9!#$%&\\'\\*\\+\\-\\.\\^_`\\|~]+";
    token68Match = "[a-zA-Z0-9\\-\\._\\~\\+\\/]+[=]{0,2}";
    quotedMatch = '"((?:[^"\\\\]|\\\\.)*)"';
    quotedParamMatcher = "(" + tokenMatch + ")\\s*=\\s*" + quotedMatch;
    paramMatcher = "(" + tokenMatch + ")\\s*=\\s*(" + tokenMatch + ")";
    schemeRE = new RegExp("^[,\\s]*(" + tokenMatch + ")\\s(.*)");
    quotedParamRE = new RegExp("^[,\\s]*" + quotedParamMatcher + "[,\\s]*(.*)");
    unquotedParamRE = new RegExp("^[,\\s]*" + paramMatcher + "[,\\s]*(.*)");
    token68ParamRE = new RegExp("^(" + token68Match + ")(?:$|[,\\s])(.*)");
    skipSubjectCheck = Symbol();
    idTokenClaims = /* @__PURE__ */ new WeakMap();
    jwtRefs = /* @__PURE__ */ new WeakMap();
    branded = /* @__PURE__ */ new WeakSet();
    nopkce = Symbol();
    jwtClaimNames = {
      aud: "audience",
      c_hash: "code hash",
      client_id: "client id",
      exp: "expiration time",
      iat: "issued at",
      iss: "issuer",
      jti: "jwt id",
      nonce: "nonce",
      s_hash: "state hash",
      sub: "subject",
      ath: "access token hash",
      htm: "http method",
      htu: "http uri",
      cnf: "confirmation",
      auth_time: "authentication time"
    };
    expectNoNonce = Symbol();
    skipAuthTimeCheck = Symbol();
    WWW_AUTHENTICATE_CHALLENGE = "OAUTH_WWW_AUTHENTICATE_CHALLENGE";
    RESPONSE_BODY_ERROR = "OAUTH_RESPONSE_BODY_ERROR";
    UNSUPPORTED_OPERATION = "OAUTH_UNSUPPORTED_OPERATION";
    AUTHORIZATION_RESPONSE_ERROR = "OAUTH_AUTHORIZATION_RESPONSE_ERROR";
    JWT_USERINFO_EXPECTED = "OAUTH_JWT_USERINFO_EXPECTED";
    PARSE_ERROR = "OAUTH_PARSE_ERROR";
    INVALID_RESPONSE = "OAUTH_INVALID_RESPONSE";
    RESPONSE_IS_NOT_JSON = "OAUTH_RESPONSE_IS_NOT_JSON";
    RESPONSE_IS_NOT_CONFORM = "OAUTH_RESPONSE_IS_NOT_CONFORM";
    HTTP_REQUEST_FORBIDDEN = "OAUTH_HTTP_REQUEST_FORBIDDEN";
    REQUEST_PROTOCOL_FORBIDDEN = "OAUTH_REQUEST_PROTOCOL_FORBIDDEN";
    JWT_TIMESTAMP_CHECK = "OAUTH_JWT_TIMESTAMP_CHECK_FAILED";
    JWT_CLAIM_COMPARISON = "OAUTH_JWT_CLAIM_COMPARISON_FAILED";
    JSON_ATTRIBUTE_COMPARISON = "OAUTH_JSON_ATTRIBUTE_COMPARISON_FAILED";
    MISSING_SERVER_METADATA = "OAUTH_MISSING_SERVER_METADATA";
    INVALID_SERVER_METADATA = "OAUTH_INVALID_SERVER_METADATA";
    skipStateCheck = Symbol();
    expectNoState = Symbol();
    _nodiscoverycheck = Symbol();
    _expectedIssuer = Symbol();
  }
});
async function sealCookie(name, payload, options2) {
  const { cookies, logger } = options2;
  const cookie = cookies[name];
  const expires = /* @__PURE__ */ new Date();
  expires.setTime(expires.getTime() + COOKIE_TTL * 1e3);
  logger.debug(`CREATE_${name.toUpperCase()}`, {
    name: cookie.name,
    payload,
    COOKIE_TTL,
    expires
  });
  const encoded = await encode3({
    ...options2.jwt,
    maxAge: COOKIE_TTL,
    token: { value: payload },
    salt: cookie.name
  });
  const cookieOptions = { ...cookie.options, expires };
  return { name: cookie.name, value: encoded, options: cookieOptions };
}
__name(sealCookie, "sealCookie");
async function parseCookie3(name, value, options2) {
  try {
    const { logger, cookies, jwt } = options2;
    logger.debug(`PARSE_${name.toUpperCase()}`, { cookie: value });
    if (!value)
      throw new InvalidCheck(`${name} cookie was missing`);
    const parsed = await decode4({
      ...jwt,
      token: value,
      salt: cookies[name].name
    });
    if (parsed?.value)
      return parsed.value;
    throw new Error("Invalid cookie");
  } catch (error2) {
    throw new InvalidCheck(`${name} value could not be parsed`, {
      cause: error2
    });
  }
}
__name(parseCookie3, "parseCookie3");
function clearCookie(name, options2, resCookies) {
  const { logger, cookies } = options2;
  const cookie = cookies[name];
  logger.debug(`CLEAR_${name.toUpperCase()}`, { cookie });
  resCookies.push({
    name: cookie.name,
    value: "",
    options: { ...cookies[name].options, maxAge: 0 }
  });
}
__name(clearCookie, "clearCookie");
function useCookie(check2, name) {
  return async function(cookies, resCookies, options2) {
    const { provider, logger } = options2;
    if (!provider?.checks?.includes(check2))
      return;
    const cookieValue = cookies?.[options2.cookies[name].name];
    logger.debug(`USE_${name.toUpperCase()}`, { value: cookieValue });
    const parsed = await parseCookie3(name, cookieValue, options2);
    clearCookie(name, options2, resCookies);
    return parsed;
  };
}
__name(useCookie, "useCookie");
var COOKIE_TTL;
var pkce;
var STATE_MAX_AGE;
var encodedStateSalt;
var state;
var nonce;
var WEBAUTHN_CHALLENGE_MAX_AGE;
var webauthnChallengeSalt;
var webauthnChallenge;
var init_checks = __esm({
  "node_modules/@auth/core/lib/actions/callback/oauth/checks.js"() {
    init_build();
    init_errors();
    init_jwt();
    COOKIE_TTL = 60 * 15;
    pkce = {
      /** Creates a PKCE code challenge and verifier pair. The verifier in stored in the cookie. */
      async create(options2) {
        const code_verifier = generateRandomCodeVerifier();
        const value = await calculatePKCECodeChallenge(code_verifier);
        const cookie = await sealCookie("pkceCodeVerifier", code_verifier, options2);
        return { cookie, value };
      },
      /**
       * Returns code_verifier if the provider is configured to use PKCE,
       * and clears the container cookie afterwards.
       * An error is thrown if the code_verifier is missing or invalid.
       */
      use: useCookie("pkce", "pkceCodeVerifier")
    };
    STATE_MAX_AGE = 60 * 15;
    encodedStateSalt = "encodedState";
    state = {
      /** Creates a state cookie with an optionally encoded body. */
      async create(options2, origin) {
        const { provider } = options2;
        if (!provider.checks.includes("state")) {
          if (origin) {
            throw new InvalidCheck("State data was provided but the provider is not configured to use state");
          }
          return;
        }
        const payload = {
          origin,
          random: generateRandomState()
        };
        const value = await encode3({
          secret: options2.jwt.secret,
          token: payload,
          salt: encodedStateSalt,
          maxAge: STATE_MAX_AGE
        });
        const cookie = await sealCookie("state", value, options2);
        return { cookie, value };
      },
      /**
       * Returns state if the provider is configured to use state,
       * and clears the container cookie afterwards.
       * An error is thrown if the state is missing or invalid.
       */
      use: useCookie("state", "state"),
      /** Decodes the state. If it could not be decoded, it throws an error. */
      async decode(state2, options2) {
        try {
          options2.logger.debug("DECODE_STATE", { state: state2 });
          const payload = await decode4({
            secret: options2.jwt.secret,
            token: state2,
            salt: encodedStateSalt
          });
          if (payload)
            return payload;
          throw new Error("Invalid state");
        } catch (error2) {
          throw new InvalidCheck("State could not be decoded", { cause: error2 });
        }
      }
    };
    nonce = {
      async create(options2) {
        if (!options2.provider.checks.includes("nonce"))
          return;
        const value = generateRandomNonce();
        const cookie = await sealCookie("nonce", value, options2);
        return { cookie, value };
      },
      /**
       * Returns nonce if the provider is configured to use nonce,
       * and clears the container cookie afterwards.
       * An error is thrown if the nonce is missing or invalid.
       * @see https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes
       * @see https://danielfett.de/2020/05/16/pkce-vs-nonce-equivalent-or-not/#nonce
       */
      use: useCookie("nonce", "nonce")
    };
    WEBAUTHN_CHALLENGE_MAX_AGE = 60 * 15;
    webauthnChallengeSalt = "encodedWebauthnChallenge";
    webauthnChallenge = {
      async create(options2, challenge, registerData) {
        return {
          cookie: await sealCookie("webauthnChallenge", await encode3({
            secret: options2.jwt.secret,
            token: { challenge, registerData },
            salt: webauthnChallengeSalt,
            maxAge: WEBAUTHN_CHALLENGE_MAX_AGE
          }), options2)
        };
      },
      /** Returns WebAuthn challenge if present. */
      async use(options2, cookies, resCookies) {
        const cookieValue = cookies?.[options2.cookies.webauthnChallenge.name];
        const parsed = await parseCookie3("webauthnChallenge", cookieValue, options2);
        const payload = await decode4({
          secret: options2.jwt.secret,
          token: parsed,
          salt: webauthnChallengeSalt
        });
        clearCookie("webauthnChallenge", options2, resCookies);
        if (!payload)
          throw new InvalidCheck("WebAuthn challenge was missing");
        return payload;
      }
    };
  }
});
function formUrlEncode(token) {
  return encodeURIComponent(token).replace(/%20/g, "+");
}
__name(formUrlEncode, "formUrlEncode");
function clientSecretBasic(clientId, clientSecret) {
  const username = formUrlEncode(clientId);
  const password = formUrlEncode(clientSecret);
  const credentials = btoa(`${username}:${password}`);
  return `Basic ${credentials}`;
}
__name(clientSecretBasic, "clientSecretBasic");
async function handleOAuth(params, cookies, options2) {
  const { logger, provider } = options2;
  let as;
  const { token, userinfo } = provider;
  if ((!token?.url || token.url.host === "authjs.dev") && (!userinfo?.url || userinfo.url.host === "authjs.dev")) {
    const issuer = new URL(provider.issuer);
    const discoveryResponse = await discoveryRequest(issuer, {
      [allowInsecureRequests]: true,
      [customFetch2]: provider[customFetch]
    });
    as = await processDiscoveryResponse(issuer, discoveryResponse);
    if (!as.token_endpoint)
      throw new TypeError("TODO: Authorization server did not provide a token endpoint.");
    if (!as.userinfo_endpoint)
      throw new TypeError("TODO: Authorization server did not provide a userinfo endpoint.");
  } else {
    as = {
      issuer: provider.issuer ?? "https://authjs.dev",
      // TODO: review fallback issuer
      token_endpoint: token?.url.toString(),
      userinfo_endpoint: userinfo?.url.toString()
    };
  }
  const client = {
    client_id: provider.clientId,
    ...provider.client
  };
  let clientAuth;
  switch (client.token_endpoint_auth_method) {
    // TODO: in the next breaking major version have undefined be `client_secret_post`
    case void 0:
    case "client_secret_basic":
      clientAuth = /* @__PURE__ */ __name((_as, _client, _body, headers2) => {
        headers2.set("authorization", clientSecretBasic(provider.clientId, provider.clientSecret));
      }, "clientAuth");
      break;
    case "client_secret_post":
      clientAuth = ClientSecretPost(provider.clientSecret);
      break;
    case "client_secret_jwt":
      clientAuth = ClientSecretJwt(provider.clientSecret);
      break;
    case "private_key_jwt":
      clientAuth = PrivateKeyJwt(provider.token.clientPrivateKey, {
        // TODO: review in the next breaking change
        [modifyAssertion](_header, payload) {
          payload.aud = [as.issuer, as.token_endpoint];
        }
      });
      break;
    case "none":
      clientAuth = None();
      break;
    default:
      throw new Error("unsupported client authentication method");
  }
  const resCookies = [];
  const state2 = await state.use(cookies, resCookies, options2);
  let codeGrantParams;
  try {
    codeGrantParams = validateAuthResponse(as, client, new URLSearchParams(params), provider.checks.includes("state") ? state2 : skipStateCheck);
  } catch (err) {
    if (err instanceof AuthorizationResponseError) {
      const cause = {
        providerId: provider.id,
        ...Object.fromEntries(err.cause.entries())
      };
      logger.debug("OAuthCallbackError", cause);
      throw new OAuthCallbackError("OAuth Provider returned an error", cause);
    }
    throw err;
  }
  const codeVerifier = await pkce.use(cookies, resCookies, options2);
  let redirect_uri = provider.callbackUrl;
  if (!options2.isOnRedirectProxy && provider.redirectProxyUrl) {
    redirect_uri = provider.redirectProxyUrl;
  }
  let codeGrantResponse = await authorizationCodeGrantRequest(as, client, clientAuth, codeGrantParams, redirect_uri, codeVerifier ?? "decoy", {
    // TODO: move away from allowing insecure HTTP requests
    [allowInsecureRequests]: true,
    [customFetch2]: (...args) => {
      if (!provider.checks.includes("pkce")) {
        args[1].body.delete("code_verifier");
      }
      return (provider[customFetch] ?? fetch)(...args);
    }
  });
  if (provider.token?.conform) {
    codeGrantResponse = await provider.token.conform(codeGrantResponse.clone()) ?? codeGrantResponse;
  }
  let profile = {};
  const requireIdToken = isOIDCProvider(provider);
  if (provider[conformInternal]) {
    switch (provider.id) {
      case "microsoft-entra-id":
      case "azure-ad": {
        const { tid } = decodeJwt((await codeGrantResponse.clone().json()).id_token);
        if (typeof tid === "string") {
          const tenantRe = /microsoftonline\.com\/(\w+)\/v2\.0/;
          const tenantId = as.issuer?.match(tenantRe)?.[1] ?? "common";
          const issuer = new URL(as.issuer.replace(tenantId, tid));
          const discoveryResponse = await discoveryRequest(issuer, {
            [customFetch2]: provider[customFetch]
          });
          as = await processDiscoveryResponse(issuer, discoveryResponse);
        }
        break;
      }
      default:
        break;
    }
  }
  const processedCodeResponse = await processAuthorizationCodeResponse(as, client, codeGrantResponse, {
    expectedNonce: await nonce.use(cookies, resCookies, options2),
    requireIdToken
  });
  const tokens = processedCodeResponse;
  if (requireIdToken) {
    const idTokenClaims2 = getValidatedIdTokenClaims(processedCodeResponse);
    profile = idTokenClaims2;
    if (provider[conformInternal] && provider.id === "apple") {
      try {
        profile.user = JSON.parse(params?.user);
      } catch {
      }
    }
    if (provider.idToken === false) {
      const userinfoResponse = await userInfoRequest(as, client, processedCodeResponse.access_token, {
        [customFetch2]: provider[customFetch],
        // TODO: move away from allowing insecure HTTP requests
        [allowInsecureRequests]: true
      });
      profile = await processUserInfoResponse(as, client, idTokenClaims2.sub, userinfoResponse);
    }
  } else {
    if (userinfo?.request) {
      const _profile = await userinfo.request({ tokens, provider });
      if (_profile instanceof Object)
        profile = _profile;
    } else if (userinfo?.url) {
      const userinfoResponse = await userInfoRequest(as, client, processedCodeResponse.access_token, { [customFetch2]: provider[customFetch] });
      profile = await userinfoResponse.json();
    } else {
      throw new TypeError("No userinfo endpoint configured");
    }
  }
  if (tokens.expires_in) {
    tokens.expires_at = Math.floor(Date.now() / 1e3) + Number(tokens.expires_in);
  }
  const profileResult = await getUserAndAccount(profile, provider, tokens, logger);
  return { ...profileResult, profile, cookies: resCookies };
}
__name(handleOAuth, "handleOAuth");
async function getUserAndAccount(OAuthProfile, provider, tokens, logger) {
  try {
    const userFromProfile = await provider.profile(OAuthProfile, tokens);
    const user = {
      ...userFromProfile,
      // The user's id is intentionally not set based on the profile id, as
      // the user should remain independent of the provider and the profile id
      // is saved on the Account already, as `providerAccountId`.
      id: crypto.randomUUID(),
      email: userFromProfile.email?.toLowerCase()
    };
    return {
      user,
      account: {
        ...tokens,
        provider: provider.id,
        type: provider.type,
        providerAccountId: userFromProfile.id ?? crypto.randomUUID()
      }
    };
  } catch (e3) {
    logger.debug("getProfile error details", OAuthProfile);
    logger.error(new OAuthProfileParseError(e3, { provider: provider.id }));
  }
}
__name(getUserAndAccount, "getUserAndAccount");
var init_callback = __esm({
  "node_modules/@auth/core/lib/actions/callback/oauth/callback.js"() {
    init_checks();
    init_build();
    init_errors();
    init_providers();
    init_symbols();
    init_browser();
  }
});
function inferWebAuthnOptions(action, loggedIn, userInfoResponse) {
  const { user, exists = false } = userInfoResponse ?? {};
  switch (action) {
    case "authenticate": {
      return "authenticate";
    }
    case "register": {
      if (user && loggedIn === exists)
        return "register";
      break;
    }
    case void 0: {
      if (!loggedIn) {
        if (user) {
          if (exists) {
            return "authenticate";
          } else {
            return "register";
          }
        } else {
          return "authenticate";
        }
      }
      break;
    }
  }
  return null;
}
__name(inferWebAuthnOptions, "inferWebAuthnOptions");
async function getRegistrationResponse(options2, request, user, resCookies) {
  const regOptions = await getRegistrationOptions(options2, request, user);
  const { cookie } = await webauthnChallenge.create(options2, regOptions.challenge, user);
  return {
    status: 200,
    cookies: [...resCookies ?? [], cookie],
    body: {
      action: "register",
      options: regOptions
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
__name(getRegistrationResponse, "getRegistrationResponse");
async function getAuthenticationResponse(options2, request, user, resCookies) {
  const authOptions = await getAuthenticationOptions(options2, request, user);
  const { cookie } = await webauthnChallenge.create(options2, authOptions.challenge);
  return {
    status: 200,
    cookies: [...resCookies ?? [], cookie],
    body: {
      action: "authenticate",
      options: authOptions
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
}
__name(getAuthenticationResponse, "getAuthenticationResponse");
async function verifyAuthenticate(options2, request, resCookies) {
  const { adapter, provider } = options2;
  const data = request.body && typeof request.body.data === "string" ? JSON.parse(request.body.data) : void 0;
  if (!data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string") {
    throw new AuthError("Invalid WebAuthn Authentication response");
  }
  const credentialID = toBase64(fromBase64(data.id));
  const authenticator = await adapter.getAuthenticator(credentialID);
  if (!authenticator) {
    throw new AuthError(`WebAuthn authenticator not found in database: ${JSON.stringify({
      credentialID
    })}`);
  }
  const { challenge: expectedChallenge } = await webauthnChallenge.use(options2, request.cookies, resCookies);
  let verification;
  try {
    const relayingParty = provider.getRelayingParty(options2, request);
    verification = await provider.simpleWebAuthn.verifyAuthenticationResponse({
      ...provider.verifyAuthenticationOptions,
      expectedChallenge,
      response: data,
      authenticator: fromAdapterAuthenticator(authenticator),
      expectedOrigin: relayingParty.origin,
      expectedRPID: relayingParty.id
    });
  } catch (e3) {
    throw new WebAuthnVerificationError(e3);
  }
  const { verified, authenticationInfo } = verification;
  if (!verified) {
    throw new WebAuthnVerificationError("WebAuthn authentication response could not be verified");
  }
  try {
    const { newCounter } = authenticationInfo;
    await adapter.updateAuthenticatorCounter(authenticator.credentialID, newCounter);
  } catch (e3) {
    throw new AdapterError(`Failed to update authenticator counter. This may cause future authentication attempts to fail. ${JSON.stringify({
      credentialID,
      oldCounter: authenticator.counter,
      newCounter: authenticationInfo.newCounter
    })}`, e3);
  }
  const account = await adapter.getAccount(authenticator.providerAccountId, provider.id);
  if (!account) {
    throw new AuthError(`WebAuthn account not found in database: ${JSON.stringify({
      credentialID,
      providerAccountId: authenticator.providerAccountId
    })}`);
  }
  const user = await adapter.getUser(account.userId);
  if (!user) {
    throw new AuthError(`WebAuthn user not found in database: ${JSON.stringify({
      credentialID,
      providerAccountId: authenticator.providerAccountId,
      userID: account.userId
    })}`);
  }
  return {
    account,
    user
  };
}
__name(verifyAuthenticate, "verifyAuthenticate");
async function verifyRegister(options2, request, resCookies) {
  const { provider } = options2;
  const data = request.body && typeof request.body.data === "string" ? JSON.parse(request.body.data) : void 0;
  if (!data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string") {
    throw new AuthError("Invalid WebAuthn Registration response");
  }
  const { challenge: expectedChallenge, registerData: user } = await webauthnChallenge.use(options2, request.cookies, resCookies);
  if (!user) {
    throw new AuthError("Missing user registration data in WebAuthn challenge cookie");
  }
  let verification;
  try {
    const relayingParty = provider.getRelayingParty(options2, request);
    verification = await provider.simpleWebAuthn.verifyRegistrationResponse({
      ...provider.verifyRegistrationOptions,
      expectedChallenge,
      response: data,
      expectedOrigin: relayingParty.origin,
      expectedRPID: relayingParty.id
    });
  } catch (e3) {
    throw new WebAuthnVerificationError(e3);
  }
  if (!verification.verified || !verification.registrationInfo) {
    throw new WebAuthnVerificationError("WebAuthn registration response could not be verified");
  }
  const account = {
    providerAccountId: toBase64(verification.registrationInfo.credentialID),
    provider: options2.provider.id,
    type: provider.type
  };
  const authenticator = {
    providerAccountId: account.providerAccountId,
    counter: verification.registrationInfo.counter,
    credentialID: toBase64(verification.registrationInfo.credentialID),
    credentialPublicKey: toBase64(verification.registrationInfo.credentialPublicKey),
    credentialBackedUp: verification.registrationInfo.credentialBackedUp,
    credentialDeviceType: verification.registrationInfo.credentialDeviceType,
    transports: transportsToString(data.response.transports)
  };
  return {
    user,
    account,
    authenticator
  };
}
__name(verifyRegister, "verifyRegister");
async function getAuthenticationOptions(options2, request, user) {
  const { provider, adapter } = options2;
  const authenticators = user && user["id"] ? await adapter.listAuthenticatorsByUserId(user.id) : null;
  const relayingParty = provider.getRelayingParty(options2, request);
  return await provider.simpleWebAuthn.generateAuthenticationOptions({
    ...provider.authenticationOptions,
    rpID: relayingParty.id,
    allowCredentials: authenticators?.map((a3) => ({
      id: fromBase64(a3.credentialID),
      type: "public-key",
      transports: stringToTransports(a3.transports)
    }))
  });
}
__name(getAuthenticationOptions, "getAuthenticationOptions");
async function getRegistrationOptions(options2, request, user) {
  const { provider, adapter } = options2;
  const authenticators = user["id"] ? await adapter.listAuthenticatorsByUserId(user.id) : null;
  const userID = randomString(32);
  const relayingParty = provider.getRelayingParty(options2, request);
  return await provider.simpleWebAuthn.generateRegistrationOptions({
    ...provider.registrationOptions,
    userID,
    userName: user.email,
    userDisplayName: user.name ?? void 0,
    rpID: relayingParty.id,
    rpName: relayingParty.name,
    excludeCredentials: authenticators?.map((a3) => ({
      id: fromBase64(a3.credentialID),
      type: "public-key",
      transports: stringToTransports(a3.transports)
    }))
  });
}
__name(getRegistrationOptions, "getRegistrationOptions");
function assertInternalOptionsWebAuthn(options2) {
  const { provider, adapter } = options2;
  if (!adapter)
    throw new MissingAdapter("An adapter is required for the WebAuthn provider");
  if (!provider || provider.type !== "webauthn") {
    throw new InvalidProvider("Provider must be WebAuthn");
  }
  return { ...options2, provider, adapter };
}
__name(assertInternalOptionsWebAuthn, "assertInternalOptionsWebAuthn");
function fromAdapterAuthenticator(authenticator) {
  return {
    ...authenticator,
    credentialDeviceType: authenticator.credentialDeviceType,
    transports: stringToTransports(authenticator.transports),
    credentialID: fromBase64(authenticator.credentialID),
    credentialPublicKey: fromBase64(authenticator.credentialPublicKey)
  };
}
__name(fromAdapterAuthenticator, "fromAdapterAuthenticator");
function fromBase64(base64) {
  return new Uint8Array(Buffer.from(base64, "base64"));
}
__name(fromBase64, "fromBase64");
function toBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}
__name(toBase64, "toBase64");
function transportsToString(transports) {
  return transports?.join(",");
}
__name(transportsToString, "transportsToString");
function stringToTransports(tstring) {
  return tstring ? tstring.split(",") : void 0;
}
__name(stringToTransports, "stringToTransports");
var init_webauthn_utils = __esm({
  "node_modules/@auth/core/lib/utils/webauthn-utils.js"() {
    init_errors();
    init_checks();
    init_web2();
  }
});
async function callback(request, options2, sessionStore, cookies) {
  if (!options2.provider)
    throw new InvalidProvider("Callback route called without provider");
  const { query, body: body2, method, headers: headers2 } = request;
  const { provider, adapter, url, callbackUrl, pages, jwt, events, callbacks, session: { strategy: sessionStrategy, maxAge: sessionMaxAge }, logger } = options2;
  const useJwtSession = sessionStrategy === "jwt";
  try {
    if (provider.type === "oauth" || provider.type === "oidc") {
      const params = provider.authorization?.url.searchParams.get("response_mode") === "form_post" ? body2 : query;
      if (options2.isOnRedirectProxy && params?.state) {
        const parsedState = await state.decode(params.state, options2);
        const shouldRedirect = parsedState?.origin && new URL(parsedState.origin).origin !== options2.url.origin;
        if (shouldRedirect) {
          const proxyRedirect = `${parsedState.origin}?${new URLSearchParams(params)}`;
          logger.debug("Proxy redirecting to", proxyRedirect);
          return { redirect: proxyRedirect, cookies };
        }
      }
      const authorizationResult = await handleOAuth(params, request.cookies, options2);
      if (authorizationResult.cookies.length) {
        cookies.push(...authorizationResult.cookies);
      }
      logger.debug("authorization result", authorizationResult);
      const { user: userFromProvider, account, profile: OAuthProfile } = authorizationResult;
      if (!userFromProvider || !account || !OAuthProfile) {
        return { redirect: `${url}/signin`, cookies };
      }
      let userByAccount;
      if (adapter) {
        const { getUserByAccount } = adapter;
        userByAccount = await getUserByAccount({
          providerAccountId: account.providerAccountId,
          provider: provider.id
        });
      }
      const redirect2 = await handleAuthorized({
        user: userByAccount ?? userFromProvider,
        account,
        profile: OAuthProfile
      }, options2);
      if (redirect2)
        return { redirect: redirect2, cookies };
      const { user, session: session2, isNewUser } = await handleLoginOrRegister(sessionStore.value, userFromProvider, account, options2);
      if (useJwtSession) {
        const defaultToken = {
          name: user.name,
          email: user.email,
          picture: user.image,
          sub: user.id?.toString()
        };
        const token = await callbacks.jwt({
          token: defaultToken,
          user,
          account,
          profile: OAuthProfile,
          isNewUser,
          trigger: isNewUser ? "signUp" : "signIn"
        });
        if (token === null) {
          cookies.push(...sessionStore.clean());
        } else {
          const salt = options2.cookies.sessionToken.name;
          const newToken = await jwt.encode({ ...jwt, token, salt });
          const cookieExpires = /* @__PURE__ */ new Date();
          cookieExpires.setTime(cookieExpires.getTime() + sessionMaxAge * 1e3);
          const sessionCookies = sessionStore.chunk(newToken, {
            expires: cookieExpires
          });
          cookies.push(...sessionCookies);
        }
      } else {
        cookies.push({
          name: options2.cookies.sessionToken.name,
          value: session2.sessionToken,
          options: {
            ...options2.cookies.sessionToken.options,
            expires: session2.expires
          }
        });
      }
      await events.signIn?.({
        user,
        account,
        profile: OAuthProfile,
        isNewUser
      });
      if (isNewUser && pages.newUser) {
        return {
          redirect: `${pages.newUser}${pages.newUser.includes("?") ? "&" : "?"}${new URLSearchParams({ callbackUrl })}`,
          cookies
        };
      }
      return { redirect: callbackUrl, cookies };
    } else if (provider.type === "email") {
      const paramToken = query?.token;
      const paramIdentifier = query?.email;
      if (!paramToken) {
        const e3 = new TypeError("Missing token. The sign-in URL was manually opened without token or the link was not sent correctly in the email.", { cause: { hasToken: !!paramToken } });
        e3.name = "Configuration";
        throw e3;
      }
      const secret = provider.secret ?? options2.secret;
      const invite = await adapter.useVerificationToken({
        // @ts-expect-error User-land adapters might decide to omit the identifier during lookup
        identifier: paramIdentifier,
        // TODO: Drop this requirement for lookup in official adapters too
        token: await createHash(`${paramToken}${secret}`)
      });
      const hasInvite = !!invite;
      const expired = hasInvite && invite.expires.valueOf() < Date.now();
      const invalidInvite = !hasInvite || expired || // The user might have configured the link to not contain the identifier
      // so we only compare if it exists
      paramIdentifier && invite.identifier !== paramIdentifier;
      if (invalidInvite)
        throw new Verification({ hasInvite, expired });
      const { identifier } = invite;
      const user = await adapter.getUserByEmail(identifier) ?? {
        id: crypto.randomUUID(),
        email: identifier,
        emailVerified: null
      };
      const account = {
        providerAccountId: user.email,
        userId: user.id,
        type: "email",
        provider: provider.id
      };
      const redirect2 = await handleAuthorized({ user, account }, options2);
      if (redirect2)
        return { redirect: redirect2, cookies };
      const { user: loggedInUser, session: session2, isNewUser } = await handleLoginOrRegister(sessionStore.value, user, account, options2);
      if (useJwtSession) {
        const defaultToken = {
          name: loggedInUser.name,
          email: loggedInUser.email,
          picture: loggedInUser.image,
          sub: loggedInUser.id?.toString()
        };
        const token = await callbacks.jwt({
          token: defaultToken,
          user: loggedInUser,
          account,
          isNewUser,
          trigger: isNewUser ? "signUp" : "signIn"
        });
        if (token === null) {
          cookies.push(...sessionStore.clean());
        } else {
          const salt = options2.cookies.sessionToken.name;
          const newToken = await jwt.encode({ ...jwt, token, salt });
          const cookieExpires = /* @__PURE__ */ new Date();
          cookieExpires.setTime(cookieExpires.getTime() + sessionMaxAge * 1e3);
          const sessionCookies = sessionStore.chunk(newToken, {
            expires: cookieExpires
          });
          cookies.push(...sessionCookies);
        }
      } else {
        cookies.push({
          name: options2.cookies.sessionToken.name,
          value: session2.sessionToken,
          options: {
            ...options2.cookies.sessionToken.options,
            expires: session2.expires
          }
        });
      }
      await events.signIn?.({ user: loggedInUser, account, isNewUser });
      if (isNewUser && pages.newUser) {
        return {
          redirect: `${pages.newUser}${pages.newUser.includes("?") ? "&" : "?"}${new URLSearchParams({ callbackUrl })}`,
          cookies
        };
      }
      return { redirect: callbackUrl, cookies };
    } else if (provider.type === "credentials" && method === "POST") {
      const credentials = body2 ?? {};
      Object.entries(query ?? {}).forEach(([k3, v2]) => url.searchParams.set(k3, v2));
      const userFromAuthorize = await provider.authorize(
        credentials,
        // prettier-ignore
        new Request(url, { headers: headers2, method, body: JSON.stringify(body2) })
      );
      const user = userFromAuthorize;
      if (!user)
        throw new CredentialsSignin();
      else
        user.id = user.id?.toString() ?? crypto.randomUUID();
      const account = {
        providerAccountId: user.id,
        type: "credentials",
        provider: provider.id
      };
      const redirect2 = await handleAuthorized({ user, account, credentials }, options2);
      if (redirect2)
        return { redirect: redirect2, cookies };
      const defaultToken = {
        name: user.name,
        email: user.email,
        picture: user.image,
        sub: user.id
      };
      const token = await callbacks.jwt({
        token: defaultToken,
        user,
        account,
        isNewUser: false,
        trigger: "signIn"
      });
      if (token === null) {
        cookies.push(...sessionStore.clean());
      } else {
        const salt = options2.cookies.sessionToken.name;
        const newToken = await jwt.encode({ ...jwt, token, salt });
        const cookieExpires = /* @__PURE__ */ new Date();
        cookieExpires.setTime(cookieExpires.getTime() + sessionMaxAge * 1e3);
        const sessionCookies = sessionStore.chunk(newToken, {
          expires: cookieExpires
        });
        cookies.push(...sessionCookies);
      }
      await events.signIn?.({ user, account });
      return { redirect: callbackUrl, cookies };
    } else if (provider.type === "webauthn" && method === "POST") {
      const action = request.body?.action;
      if (typeof action !== "string" || action !== "authenticate" && action !== "register") {
        throw new AuthError("Invalid action parameter");
      }
      const localOptions = assertInternalOptionsWebAuthn(options2);
      let user;
      let account;
      let authenticator;
      switch (action) {
        case "authenticate": {
          const verified = await verifyAuthenticate(localOptions, request, cookies);
          user = verified.user;
          account = verified.account;
          break;
        }
        case "register": {
          const verified = await verifyRegister(options2, request, cookies);
          user = verified.user;
          account = verified.account;
          authenticator = verified.authenticator;
          break;
        }
      }
      await handleAuthorized({ user, account }, options2);
      const { user: loggedInUser, isNewUser, session: session2, account: currentAccount } = await handleLoginOrRegister(sessionStore.value, user, account, options2);
      if (!currentAccount) {
        throw new AuthError("Error creating or finding account");
      }
      if (authenticator && loggedInUser.id) {
        await localOptions.adapter.createAuthenticator({
          ...authenticator,
          userId: loggedInUser.id
        });
      }
      if (useJwtSession) {
        const defaultToken = {
          name: loggedInUser.name,
          email: loggedInUser.email,
          picture: loggedInUser.image,
          sub: loggedInUser.id?.toString()
        };
        const token = await callbacks.jwt({
          token: defaultToken,
          user: loggedInUser,
          account: currentAccount,
          isNewUser,
          trigger: isNewUser ? "signUp" : "signIn"
        });
        if (token === null) {
          cookies.push(...sessionStore.clean());
        } else {
          const salt = options2.cookies.sessionToken.name;
          const newToken = await jwt.encode({ ...jwt, token, salt });
          const cookieExpires = /* @__PURE__ */ new Date();
          cookieExpires.setTime(cookieExpires.getTime() + sessionMaxAge * 1e3);
          const sessionCookies = sessionStore.chunk(newToken, {
            expires: cookieExpires
          });
          cookies.push(...sessionCookies);
        }
      } else {
        cookies.push({
          name: options2.cookies.sessionToken.name,
          value: session2.sessionToken,
          options: {
            ...options2.cookies.sessionToken.options,
            expires: session2.expires
          }
        });
      }
      await events.signIn?.({
        user: loggedInUser,
        account: currentAccount,
        isNewUser
      });
      if (isNewUser && pages.newUser) {
        return {
          redirect: `${pages.newUser}${pages.newUser.includes("?") ? "&" : "?"}${new URLSearchParams({ callbackUrl })}`,
          cookies
        };
      }
      return { redirect: callbackUrl, cookies };
    }
    throw new InvalidProvider(`Callback for provider type (${provider.type}) is not supported`);
  } catch (e3) {
    if (e3 instanceof AuthError)
      throw e3;
    const error2 = new CallbackRouteError(e3, { provider: provider.id });
    logger.debug("callback route error details", { method, query, body: body2 });
    throw error2;
  }
}
__name(callback, "callback");
async function handleAuthorized(params, config) {
  let authorized;
  const { signIn: signIn3, redirect: redirect2 } = config.callbacks;
  try {
    authorized = await signIn3(params);
  } catch (e3) {
    if (e3 instanceof AuthError)
      throw e3;
    throw new AccessDenied(e3);
  }
  if (!authorized)
    throw new AccessDenied("AccessDenied");
  if (typeof authorized !== "string")
    return;
  return await redirect2({ url: authorized, baseUrl: config.url.origin });
}
__name(handleAuthorized, "handleAuthorized");
var init_callback2 = __esm({
  "node_modules/@auth/core/lib/actions/callback/index.js"() {
    init_errors();
    init_handle_login();
    init_callback();
    init_checks();
    init_web2();
    init_webauthn_utils();
  }
});
async function session(options2, sessionStore, cookies, isUpdate, newSession) {
  const { adapter, jwt, events, callbacks, logger, session: { strategy: sessionStrategy, maxAge: sessionMaxAge } } = options2;
  const response = {
    body: null,
    headers: { "Content-Type": "application/json" },
    cookies
  };
  const sessionToken = sessionStore.value;
  if (!sessionToken)
    return response;
  if (sessionStrategy === "jwt") {
    try {
      const salt = options2.cookies.sessionToken.name;
      const payload = await jwt.decode({ ...jwt, token: sessionToken, salt });
      if (!payload)
        throw new Error("Invalid JWT");
      const token = await callbacks.jwt({
        token: payload,
        ...isUpdate && { trigger: "update" },
        session: newSession
      });
      const newExpires = fromDate(sessionMaxAge);
      if (token !== null) {
        const session2 = {
          user: { name: token.name, email: token.email, image: token.picture },
          expires: newExpires.toISOString()
        };
        const newSession2 = await callbacks.session({ session: session2, token });
        response.body = newSession2;
        const newToken = await jwt.encode({ ...jwt, token, salt });
        const sessionCookies = sessionStore.chunk(newToken, {
          expires: newExpires
        });
        response.cookies?.push(...sessionCookies);
        await events.session?.({ session: newSession2, token });
      } else {
        response.cookies?.push(...sessionStore.clean());
      }
    } catch (e3) {
      logger.error(new JWTSessionError(e3));
      response.cookies?.push(...sessionStore.clean());
    }
    return response;
  }
  try {
    const { getSessionAndUser, deleteSession, updateSession } = adapter;
    let userAndSession = await getSessionAndUser(sessionToken);
    if (userAndSession && userAndSession.session.expires.valueOf() < Date.now()) {
      await deleteSession(sessionToken);
      userAndSession = null;
    }
    if (userAndSession) {
      const { user, session: session2 } = userAndSession;
      const sessionUpdateAge = options2.session.updateAge;
      const sessionIsDueToBeUpdatedDate = session2.expires.valueOf() - sessionMaxAge * 1e3 + sessionUpdateAge * 1e3;
      const newExpires = fromDate(sessionMaxAge);
      if (sessionIsDueToBeUpdatedDate <= Date.now()) {
        await updateSession({
          sessionToken,
          expires: newExpires
        });
      }
      const sessionPayload = await callbacks.session({
        // TODO: user already passed below,
        // remove from session object in https://github.com/nextauthjs/next-auth/pull/9702
        // @ts-expect-error
        session: { ...session2, user },
        user,
        newSession,
        ...isUpdate ? { trigger: "update" } : {}
      });
      response.body = sessionPayload;
      response.cookies?.push({
        name: options2.cookies.sessionToken.name,
        value: sessionToken,
        options: {
          ...options2.cookies.sessionToken.options,
          expires: newExpires
        }
      });
      await events.session?.({ session: sessionPayload });
    } else if (sessionToken) {
      response.cookies?.push(...sessionStore.clean());
    }
  } catch (e3) {
    logger.error(new SessionTokenError(e3));
  }
  return response;
}
__name(session, "session");
var init_session = __esm({
  "node_modules/@auth/core/lib/actions/session.js"() {
    init_errors();
    init_date();
  }
});
async function getAuthorizationUrl(query, options2) {
  const { logger, provider } = options2;
  let url = provider.authorization?.url;
  let as;
  if (!url || url.host === "authjs.dev") {
    const issuer = new URL(provider.issuer);
    const discoveryResponse = await discoveryRequest(issuer, {
      [customFetch2]: provider[customFetch],
      // TODO: move away from allowing insecure HTTP requests
      [allowInsecureRequests]: true
    });
    const as2 = await processDiscoveryResponse(issuer, discoveryResponse);
    if (!as2.authorization_endpoint) {
      throw new TypeError("Authorization server did not provide an authorization endpoint.");
    }
    url = new URL(as2.authorization_endpoint);
  }
  const authParams = url.searchParams;
  let redirect_uri = provider.callbackUrl;
  let data;
  if (!options2.isOnRedirectProxy && provider.redirectProxyUrl) {
    redirect_uri = provider.redirectProxyUrl;
    data = provider.callbackUrl;
    logger.debug("using redirect proxy", { redirect_uri, data });
  }
  const params = Object.assign({
    response_type: "code",
    // clientId can technically be undefined, should we check this in assert.ts or rely on the Authorization Server to do it?
    client_id: provider.clientId,
    redirect_uri,
    // @ts-expect-error TODO:
    ...provider.authorization?.params
  }, Object.fromEntries(provider.authorization?.url.searchParams ?? []), query);
  for (const k3 in params)
    authParams.set(k3, params[k3]);
  const cookies = [];
  if (
    // Otherwise "POST /redirect_uri" wouldn't include the cookies
    provider.authorization?.url.searchParams.get("response_mode") === "form_post"
  ) {
    options2.cookies.state.options.sameSite = "none";
    options2.cookies.state.options.secure = true;
    options2.cookies.nonce.options.sameSite = "none";
    options2.cookies.nonce.options.secure = true;
  }
  const state2 = await state.create(options2, data);
  if (state2) {
    authParams.set("state", state2.value);
    cookies.push(state2.cookie);
  }
  if (provider.checks?.includes("pkce")) {
    if (as && !as.code_challenge_methods_supported?.includes("S256")) {
      if (provider.type === "oidc")
        provider.checks = ["nonce"];
    } else {
      const { value, cookie } = await pkce.create(options2);
      authParams.set("code_challenge", value);
      authParams.set("code_challenge_method", "S256");
      cookies.push(cookie);
    }
  }
  const nonce2 = await nonce.create(options2);
  if (nonce2) {
    authParams.set("nonce", nonce2.value);
    cookies.push(nonce2.cookie);
  }
  if (provider.type === "oidc" && !url.searchParams.has("scope")) {
    url.searchParams.set("scope", "openid profile email");
  }
  logger.debug("authorization url is ready", { url, cookies, provider });
  return { redirect: url.toString(), cookies };
}
__name(getAuthorizationUrl, "getAuthorizationUrl");
var init_authorization_url = __esm({
  "node_modules/@auth/core/lib/actions/signin/authorization-url.js"() {
    init_checks();
    init_build();
    init_symbols();
  }
});
async function sendToken(request, options2) {
  const { body: body2 } = request;
  const { provider, callbacks, adapter } = options2;
  const normalizer = provider.normalizeIdentifier ?? defaultNormalizer;
  const email = normalizer(body2?.email);
  const defaultUser = { id: crypto.randomUUID(), email, emailVerified: null };
  const user = await adapter.getUserByEmail(email) ?? defaultUser;
  const account = {
    providerAccountId: email,
    userId: user.id,
    type: "email",
    provider: provider.id
  };
  let authorized;
  try {
    authorized = await callbacks.signIn({
      user,
      account,
      email: { verificationRequest: true }
    });
  } catch (e3) {
    throw new AccessDenied(e3);
  }
  if (!authorized)
    throw new AccessDenied("AccessDenied");
  if (typeof authorized === "string") {
    return {
      redirect: await callbacks.redirect({
        url: authorized,
        baseUrl: options2.url.origin
      })
    };
  }
  const { callbackUrl, theme: theme2 } = options2;
  const token = await provider.generateVerificationToken?.() ?? randomString(32);
  const ONE_DAY_IN_SECONDS = 86400;
  const expires = new Date(Date.now() + (provider.maxAge ?? ONE_DAY_IN_SECONDS) * 1e3);
  const secret = provider.secret ?? options2.secret;
  const baseUrl = new URL(options2.basePath, options2.url.origin);
  const sendRequest = provider.sendVerificationRequest({
    identifier: email,
    token,
    expires,
    url: `${baseUrl}/callback/${provider.id}?${new URLSearchParams({
      callbackUrl,
      token,
      email
    })}`,
    provider,
    theme: theme2,
    request: toRequest(request)
  });
  const createToken = adapter.createVerificationToken?.({
    identifier: email,
    token: await createHash(`${token}${secret}`),
    expires
  });
  await Promise.all([sendRequest, createToken]);
  return {
    redirect: `${baseUrl}/verify-request?${new URLSearchParams({
      provider: provider.id,
      type: provider.type
    })}`
  };
}
__name(sendToken, "sendToken");
function defaultNormalizer(email) {
  if (!email)
    throw new Error("Missing email from request body.");
  let [local, domain] = email.toLowerCase().trim().split("@");
  domain = domain.split(",")[0];
  return `${local}@${domain}`;
}
__name(defaultNormalizer, "defaultNormalizer");
var init_send_token = __esm({
  "node_modules/@auth/core/lib/actions/signin/send-token.js"() {
    init_web2();
    init_errors();
  }
});
async function signIn(request, cookies, options2) {
  const signInUrl = `${options2.url.origin}${options2.basePath}/signin`;
  if (!options2.provider)
    return { redirect: signInUrl, cookies };
  switch (options2.provider.type) {
    case "oauth":
    case "oidc": {
      const { redirect: redirect2, cookies: authCookies } = await getAuthorizationUrl(request.query, options2);
      if (authCookies)
        cookies.push(...authCookies);
      return { redirect: redirect2, cookies };
    }
    case "email": {
      const response = await sendToken(request, options2);
      return { ...response, cookies };
    }
    default:
      return { redirect: signInUrl, cookies };
  }
}
__name(signIn, "signIn");
var init_signin2 = __esm({
  "node_modules/@auth/core/lib/actions/signin/index.js"() {
    init_authorization_url();
    init_send_token();
  }
});
async function signOut(cookies, sessionStore, options2) {
  const { jwt, events, callbackUrl: redirect2, logger, session: session2 } = options2;
  const sessionToken = sessionStore.value;
  if (!sessionToken)
    return { redirect: redirect2, cookies };
  try {
    if (session2.strategy === "jwt") {
      const salt = options2.cookies.sessionToken.name;
      const token = await jwt.decode({ ...jwt, token: sessionToken, salt });
      await events.signOut?.({ token });
    } else {
      const session3 = await options2.adapter?.deleteSession(sessionToken);
      await events.signOut?.({ session: session3 });
    }
  } catch (e3) {
    logger.error(new SignOutError(e3));
  }
  cookies.push(...sessionStore.clean());
  return { redirect: redirect2, cookies };
}
__name(signOut, "signOut");
var init_signout2 = __esm({
  "node_modules/@auth/core/lib/actions/signout.js"() {
    init_errors();
  }
});
async function getLoggedInUser(options2, sessionStore) {
  const { adapter, jwt, session: { strategy: sessionStrategy } } = options2;
  const sessionToken = sessionStore.value;
  if (!sessionToken)
    return null;
  if (sessionStrategy === "jwt") {
    const salt = options2.cookies.sessionToken.name;
    const payload = await jwt.decode({ ...jwt, token: sessionToken, salt });
    if (payload && payload.sub) {
      return {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        image: payload.picture
      };
    }
  } else {
    const userAndSession = await adapter?.getSessionAndUser(sessionToken);
    if (userAndSession) {
      return userAndSession.user;
    }
  }
  return null;
}
__name(getLoggedInUser, "getLoggedInUser");
var init_session2 = __esm({
  "node_modules/@auth/core/lib/utils/session.js"() {
  }
});
async function webAuthnOptions(request, options2, sessionStore, cookies) {
  const narrowOptions = assertInternalOptionsWebAuthn(options2);
  const { provider } = narrowOptions;
  const { action } = request.query ?? {};
  if (action !== "register" && action !== "authenticate" && typeof action !== "undefined") {
    return {
      status: 400,
      body: { error: "Invalid action" },
      cookies,
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
  const sessionUser = await getLoggedInUser(options2, sessionStore);
  const getUserInfoResponse = sessionUser ? {
    user: sessionUser,
    exists: true
  } : await provider.getUserInfo(options2, request);
  const userInfo = getUserInfoResponse?.user;
  const decision = inferWebAuthnOptions(action, !!sessionUser, getUserInfoResponse);
  switch (decision) {
    case "authenticate":
      return getAuthenticationResponse(narrowOptions, request, userInfo, cookies);
    case "register":
      if (typeof userInfo?.email === "string") {
        return getRegistrationResponse(narrowOptions, request, userInfo, cookies);
      }
      break;
    default:
      return {
        status: 400,
        body: { error: "Invalid request" },
        cookies,
        headers: {
          "Content-Type": "application/json"
        }
      };
  }
}
__name(webAuthnOptions, "webAuthnOptions");
var init_webauthn_options = __esm({
  "node_modules/@auth/core/lib/actions/webauthn-options.js"() {
    init_session2();
    init_webauthn_utils();
  }
});
var init_actions2 = __esm({
  "node_modules/@auth/core/lib/actions/index.js"() {
    init_callback2();
    init_session();
    init_signin2();
    init_signout2();
    init_webauthn_options();
  }
});
async function AuthInternal(request, authOptions) {
  const { action, providerId, error: error2, method } = request;
  const csrfDisabled = authOptions.skipCSRFCheck === skipCSRFCheck;
  const { options: options2, cookies } = await init({
    authOptions,
    action,
    providerId,
    url: request.url,
    callbackUrl: request.body?.callbackUrl ?? request.query?.callbackUrl,
    csrfToken: request.body?.csrfToken,
    cookies: request.cookies,
    isPost: method === "POST",
    csrfDisabled
  });
  const sessionStore = new SessionStore(options2.cookies.sessionToken, request.cookies, options2.logger);
  if (method === "GET") {
    const render = renderPage({ ...options2, query: request.query, cookies });
    switch (action) {
      case "callback":
        return await callback(request, options2, sessionStore, cookies);
      case "csrf":
        return render.csrf(csrfDisabled, options2, cookies);
      case "error":
        return render.error(error2);
      case "providers":
        return render.providers(options2.providers);
      case "session":
        return await session(options2, sessionStore, cookies);
      case "signin":
        return render.signin(providerId, error2);
      case "signout":
        return render.signout();
      case "verify-request":
        return render.verifyRequest();
      case "webauthn-options":
        return await webAuthnOptions(request, options2, sessionStore, cookies);
      default:
    }
  } else {
    const { csrfTokenVerified } = options2;
    switch (action) {
      case "callback":
        if (options2.provider.type === "credentials")
          validateCSRF(action, csrfTokenVerified);
        return await callback(request, options2, sessionStore, cookies);
      case "session":
        validateCSRF(action, csrfTokenVerified);
        return await session(options2, sessionStore, cookies, true, request.body?.data);
      case "signin":
        validateCSRF(action, csrfTokenVerified);
        return await signIn(request, cookies, options2);
      case "signout":
        validateCSRF(action, csrfTokenVerified);
        return await signOut(cookies, sessionStore, options2);
      default:
    }
  }
  throw new UnknownAction(`Cannot handle action: ${action}`);
}
__name(AuthInternal, "AuthInternal");
var init_lib = __esm({
  "node_modules/@auth/core/lib/index.js"() {
    init_errors();
    init_cookie();
    init_init();
    init_pages();
    init_actions2();
    init_csrf_token();
    init_symbols();
    init_symbols();
  }
});
function setEnvDefaults(envObject, config, suppressBasePathWarning = false) {
  try {
    const url = envObject.AUTH_URL;
    if (url) {
      if (config.basePath) {
        if (!suppressBasePathWarning) {
          const logger = setLogger(config);
          logger.warn("env-url-basepath-redundant");
        }
      } else {
        config.basePath = new URL(url).pathname;
      }
    }
  } catch {
  } finally {
    config.basePath ?? (config.basePath = `/auth`);
  }
  if (!config.secret?.length) {
    config.secret = [];
    const secret = envObject.AUTH_SECRET;
    if (secret)
      config.secret.push(secret);
    for (const i4 of [1, 2, 3]) {
      const secret2 = envObject[`AUTH_SECRET_${i4}`];
      if (secret2)
        config.secret.unshift(secret2);
    }
  }
  config.redirectProxyUrl ?? (config.redirectProxyUrl = envObject.AUTH_REDIRECT_PROXY_URL);
  config.trustHost ?? (config.trustHost = !!(envObject.AUTH_URL ?? envObject.AUTH_TRUST_HOST ?? envObject.VERCEL ?? envObject.CF_PAGES ?? envObject.NODE_ENV !== "production"));
  config.providers = config.providers.map((provider) => {
    const { id } = typeof provider === "function" ? provider({}) : provider;
    const ID = id.toUpperCase().replace(/-/g, "_");
    const clientId = envObject[`AUTH_${ID}_ID`];
    const clientSecret = envObject[`AUTH_${ID}_SECRET`];
    const issuer = envObject[`AUTH_${ID}_ISSUER`];
    const apiKey = envObject[`AUTH_${ID}_KEY`];
    const finalProvider = typeof provider === "function" ? provider({ clientId, clientSecret, issuer, apiKey }) : provider;
    if (finalProvider.type === "oauth" || finalProvider.type === "oidc") {
      finalProvider.clientId ?? (finalProvider.clientId = clientId);
      finalProvider.clientSecret ?? (finalProvider.clientSecret = clientSecret);
      finalProvider.issuer ?? (finalProvider.issuer = issuer);
    } else if (finalProvider.type === "email") {
      finalProvider.apiKey ?? (finalProvider.apiKey = apiKey);
    }
    return finalProvider;
  });
}
__name(setEnvDefaults, "setEnvDefaults");
function createActionURL(action, protocol, headers2, envObject, config) {
  const basePath = config?.basePath;
  const envUrl = envObject.AUTH_URL ?? envObject.NEXTAUTH_URL;
  let url;
  if (envUrl) {
    url = new URL(envUrl);
    if (basePath && basePath !== "/" && url.pathname !== "/") {
      if (url.pathname !== basePath) {
        const logger = setLogger(config);
        logger.warn("env-url-basepath-mismatch");
      }
      url.pathname = "/";
    }
  } else {
    const detectedHost = headers2.get("x-forwarded-host") ?? headers2.get("host");
    const detectedProtocol = headers2.get("x-forwarded-proto") ?? protocol ?? "https";
    const _protocol = detectedProtocol.endsWith(":") ? detectedProtocol : detectedProtocol + ":";
    url = new URL(`${_protocol}//${detectedHost}`);
  }
  const sanitizedUrl = url.toString().replace(/\/$/, "");
  if (basePath) {
    const sanitizedBasePath = basePath?.replace(/(^\/|\/$)/g, "") ?? "";
    return new URL(`${sanitizedUrl}/${sanitizedBasePath}/${action}`);
  }
  return new URL(`${sanitizedUrl}/${action}`);
}
__name(createActionURL, "createActionURL");
var init_env = __esm({
  "node_modules/@auth/core/lib/utils/env.js"() {
    init_logger();
  }
});
async function Auth(request, config) {
  const logger = setLogger(config);
  const internalRequest = await toInternalRequest(request, config);
  if (!internalRequest)
    return Response.json(`Bad request.`, { status: 400 });
  const warningsOrError = assertConfig(internalRequest, config);
  if (Array.isArray(warningsOrError)) {
    warningsOrError.forEach(logger.warn);
  } else if (warningsOrError) {
    logger.error(warningsOrError);
    const htmlPages = /* @__PURE__ */ new Set([
      "signin",
      "signout",
      "error",
      "verify-request"
    ]);
    if (!htmlPages.has(internalRequest.action) || internalRequest.method !== "GET") {
      const message2 = "There was a problem with the server configuration. Check the server logs for more information.";
      return Response.json({ message: message2 }, { status: 500 });
    }
    const { pages, theme: theme2 } = config;
    const authOnErrorPage = pages?.error && internalRequest.url.searchParams.get("callbackUrl")?.startsWith(pages.error);
    if (!pages?.error || authOnErrorPage) {
      if (authOnErrorPage) {
        logger.error(new ErrorPageLoop(`The error page ${pages?.error} should not require authentication`));
      }
      const page2 = renderPage({ theme: theme2 }).error("Configuration");
      return toResponse(page2);
    }
    const url = `${internalRequest.url.origin}${pages.error}?error=Configuration`;
    return Response.redirect(url);
  }
  const isRedirect = request.headers?.has("X-Auth-Return-Redirect");
  const isRaw = config.raw === raw;
  try {
    const internalResponse = await AuthInternal(internalRequest, config);
    if (isRaw)
      return internalResponse;
    const response = toResponse(internalResponse);
    const url = response.headers.get("Location");
    if (!isRedirect || !url)
      return response;
    return Response.json({ url }, { headers: response.headers });
  } catch (e3) {
    const error2 = e3;
    logger.error(error2);
    const isAuthError = error2 instanceof AuthError;
    if (isAuthError && isRaw && !isRedirect)
      throw error2;
    if (request.method === "POST" && internalRequest.action === "session")
      return Response.json(null, { status: 400 });
    const isClientSafeErrorType = isClientError(error2);
    const type = isClientSafeErrorType ? error2.type : "Configuration";
    const params = new URLSearchParams({ error: type });
    if (error2 instanceof CredentialsSignin)
      params.set("code", error2.code);
    const pageKind = isAuthError && error2.kind || "error";
    const pagePath = config.pages?.[pageKind] ?? `${config.basePath}/${pageKind.toLowerCase()}`;
    const url = `${internalRequest.url.origin}${pagePath}?${params}`;
    if (isRedirect)
      return Response.json({ url });
    return Response.redirect(url);
  }
}
__name(Auth, "Auth");
var init_core = __esm({
  "node_modules/@auth/core/index.js"() {
    init_assert();
    init_errors();
    init_lib();
    init_env();
    init_pages();
    init_logger();
    init_web2();
    init_actions();
    init_symbols();
  }
});
function GitHub(config) {
  const baseUrl = config?.enterprise?.baseUrl ?? "https://github.com";
  const apiBaseUrl = config?.enterprise?.baseUrl ? `${config?.enterprise?.baseUrl}/api/v3` : "https://api.github.com";
  return {
    id: "github",
    name: "GitHub",
    type: "oauth",
    authorization: {
      url: `${baseUrl}/login/oauth/authorize`,
      params: { scope: "read:user user:email" }
    },
    token: `${baseUrl}/login/oauth/access_token`,
    userinfo: {
      url: `${apiBaseUrl}/user`,
      async request({ tokens, provider }) {
        const profile = await fetch(provider.userinfo?.url, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "User-Agent": "authjs"
          }
        }).then(async (res) => await res.json());
        if (!profile.email) {
          const res = await fetch(`${apiBaseUrl}/user/emails`, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "User-Agent": "authjs"
            }
          });
          if (res.ok) {
            const emails = await res.json();
            profile.email = (emails.find((e3) => e3.primary) ?? emails[0]).email;
          }
        }
        return profile;
      }
    },
    profile(profile) {
      return {
        id: profile.id.toString(),
        name: profile.name ?? profile.login,
        email: profile.email,
        image: profile.avatar_url
      };
    },
    style: { bg: "#24292f", text: "#fff" },
    options: config
  };
}
__name(GitHub, "GitHub");
var init_github = __esm({
  "node_modules/@auth/core/providers/github.js"() {
  }
});
var hooks_server_exports = {};
__export(hooks_server_exports, {
  handle: /* @__PURE__ */ __name(() => handle, "handle")
});
function setEnvDefaults2(envObject, config) {
  config.trustHost ??= dev;
  config.basePath = `${base}/auth`;
  config.skipCSRFCheck = skipCSRFCheck;
  if (building)
    return;
  setEnvDefaults(envObject, config);
}
__name(setEnvDefaults2, "setEnvDefaults2");
async function signIn2(provider, options2 = {}, authorizationParams, config, event) {
  const { request, url: { protocol } } = event;
  const headers2 = new Headers(request.headers);
  const { redirect: shouldRedirect = true, redirectTo, ...rest } = options2 instanceof FormData ? Object.fromEntries(options2) : options2;
  const callbackUrl = redirectTo?.toString() ?? headers2.get("Referer") ?? "/";
  const signInURL = createActionURL("signin", protocol, headers2, private_env, config);
  if (!provider) {
    signInURL.searchParams.append("callbackUrl", callbackUrl);
    if (shouldRedirect)
      redirect(302, signInURL.toString());
    return signInURL.toString();
  }
  let url = `${signInURL}/${provider}?${new URLSearchParams(authorizationParams)}`;
  let foundProvider = {};
  for (const providerConfig of config.providers) {
    const { options: options22, ...defaults } = typeof providerConfig === "function" ? providerConfig() : providerConfig;
    const id = options22?.id ?? defaults.id;
    if (id === provider) {
      foundProvider = {
        id,
        type: options22?.type ?? defaults.type
      };
      break;
    }
  }
  if (!foundProvider.id) {
    const url2 = `${signInURL}?${new URLSearchParams({ callbackUrl })}`;
    if (shouldRedirect)
      redirect(302, url2);
    return url2;
  }
  if (foundProvider.type === "credentials") {
    url = url.replace("signin", "callback");
  }
  headers2.set("Content-Type", "application/x-www-form-urlencoded");
  const body2 = new URLSearchParams({ ...rest, callbackUrl });
  const req = new Request(url, { method: "POST", headers: headers2, body: body2 });
  const res = await Auth(req, { ...config, raw });
  for (const c4 of res?.cookies ?? []) {
    event.cookies.set(c4.name, c4.value, { path: "/", ...c4.options });
  }
  if (shouldRedirect) {
    return redirect(302, res.redirect);
  }
  return res.redirect;
}
__name(signIn2, "signIn2");
async function signOut2(options2, config, event) {
  const { request, url: { protocol } } = event;
  const headers2 = new Headers(request.headers);
  headers2.set("Content-Type", "application/x-www-form-urlencoded");
  const url = createActionURL("signout", protocol, headers2, private_env, config);
  const callbackUrl = options2?.redirectTo ?? headers2.get("Referer") ?? "/";
  const body2 = new URLSearchParams({ callbackUrl });
  const req = new Request(url, { method: "POST", headers: headers2, body: body2 });
  const res = await Auth(req, { ...config, raw });
  for (const c4 of res?.cookies ?? [])
    event.cookies.set(c4.name, c4.value, { path: "/", ...c4.options });
  if (options2?.redirect ?? true)
    return redirect(302, res.redirect);
  return res;
}
__name(signOut2, "signOut2");
async function auth(event, config) {
  setEnvDefaults2(private_env, config);
  config.trustHost ??= true;
  const { request: req, url: { protocol } } = event;
  const sessionUrl = createActionURL("session", protocol, req.headers, private_env, config);
  const request = new Request(sessionUrl, {
    headers: { cookie: req.headers.get("cookie") ?? "" }
  });
  const response = await Auth(request, config);
  const authCookies = (0, import_set_cookie_parser.parse)(response.headers.getSetCookie());
  for (const cookie of authCookies) {
    const { name, value, ...options2 } = cookie;
    event.cookies.set(name, value, { path: "/", ...options2 });
  }
  const { status = 200 } = response;
  const data = await response.json();
  if (!data || !Object.keys(data).length)
    return null;
  if (status === 200)
    return data;
  throw new Error(data.message);
}
__name(auth, "auth");
function SvelteKitAuth(config) {
  return {
    signIn: /* @__PURE__ */ __name(async (event) => {
      if (building)
        return;
      const { request } = event;
      const _config = typeof config === "object" ? config : await config(event);
      setEnvDefaults2(private_env, _config);
      const formData = await request.formData();
      const { providerId: provider, ...options2 } = Object.fromEntries(formData);
      const authorizationParams = {};
      const _options = {};
      for (const key2 in options2) {
        if (key2.startsWith(authorizationParamsPrefix)) {
          authorizationParams[key2.slice(authorizationParamsPrefix.length)] = options2[key2];
        } else {
          _options[key2] = options2[key2];
        }
      }
      await signIn2(provider, _options, authorizationParams, _config, event);
    }, "signIn"),
    signOut: /* @__PURE__ */ __name(async (event) => {
      if (building)
        return;
      const _config = typeof config === "object" ? config : await config(event);
      setEnvDefaults2(private_env, _config);
      const options2 = Object.fromEntries(await event.request.formData());
      await signOut2(options2, _config, event);
    }, "signOut"),
    async handle({ event, resolve: resolve2 }) {
      if (building) {
        event.locals.auth ??= async () => null;
        event.locals.getSession ??= event.locals.auth;
        return resolve2(event);
      }
      const _config = typeof config === "object" ? config : await config(event);
      setEnvDefaults2(private_env, _config);
      const { url, request } = event;
      event.locals.auth ??= () => auth(event, _config);
      event.locals.getSession ??= event.locals.auth;
      const action = url.pathname.slice(
        // @ts-expect-error - basePath is defined in setEnvDefaults
        _config.basePath.length + 1
      ).split("/")[0];
      if (isAuthAction(action) && url.pathname.startsWith(_config.basePath + "/")) {
        return Auth(request, _config);
      }
      return resolve2(event);
    }
  };
}
__name(SvelteKitAuth, "SvelteKitAuth");
var import_set_cookie_parser;
var dev;
var authorizationParamsPrefix;
var GITHUB_ID;
var GITHUB_SECRET;
var AUTH_SECRET;
var githubId;
var githubSecret;
var authSecret;
var handle;
var init_hooks_server = __esm({
  ".svelte-kit/output/server/chunks/hooks.server.js"() {
    init_exports();
    init_shared_server();
    init_core();
    init_false();
    init_environment();
    init_server();
    import_set_cookie_parser = __toESM(require_set_cookie(), 1);
    init_errors();
    init_github();
    dev = BROWSER;
    authorizationParamsPrefix = "authorizationParams-";
    ({ GITHUB_ID = "", GITHUB_SECRET = "", AUTH_SECRET = "" } = private_env);
    githubId = GITHUB_ID.trim();
    githubSecret = GITHUB_SECRET.trim();
    authSecret = AUTH_SECRET.trim();
    ({ handle } = SvelteKitAuth({
      providers: [
        GitHub({
          clientId: githubId,
          clientSecret: githubSecret,
          authorization: {
            params: {
              scope: "read:user user:email read:org repo read:project"
            }
          }
        })
      ],
      secret: authSecret,
      trustHost: true,
      callbacks: {
        async session({ session: session2, token }) {
          if (session2.user && token) {
            session2.user.login = token.login;
            session2.accessToken = token.accessToken;
          }
          return session2;
        },
        async jwt({ token, profile, account }) {
          if (profile) {
            token.login = profile.login;
          }
          if (account) {
            token.accessToken = account.access_token;
          }
          return token;
        }
      }
    }));
  }
});
var layout_server_ts_exports = {};
__export(layout_server_ts_exports, {
  load: /* @__PURE__ */ __name(() => load, "load")
});
var load;
var init_layout_server_ts = __esm({
  ".svelte-kit/output/server/entries/pages/_layout.server.ts.js"() {
    load = /* @__PURE__ */ __name(async ({ locals }) => {
      const session2 = await locals.getSession();
      return {
        user: session2?.user
      };
    }, "load");
  }
});
function getInitialTheme() {
  return "auto";
}
__name(getInitialTheme, "getInitialTheme");
function createThemeStore() {
  const { subscribe: subscribe2, set, update } = writable(getInitialTheme());
  return {
    subscribe: subscribe2,
    setTheme: /* @__PURE__ */ __name((theme2) => {
      set(theme2);
    }, "setTheme"),
    initialize: /* @__PURE__ */ __name(() => {
    }, "initialize")
  };
}
__name(createThemeStore, "createThemeStore");
var theme;
var init_theme = __esm({
  ".svelte-kit/output/server/chunks/theme.js"() {
    init_chunks();
    theme = createThemeStore();
  }
});
var layout_svelte_exports = {};
__export(layout_svelte_exports, {
  default: /* @__PURE__ */ __name(() => Layout, "default")
});
function createVoiceChatStore() {
  const { subscribe: subscribe2, set } = writable(false);
  return {
    subscribe: subscribe2,
    open: /* @__PURE__ */ __name(() => set(true), "open"),
    close: /* @__PURE__ */ __name(() => set(false), "close"),
    toggle: /* @__PURE__ */ __name(() => {
      let currentValue = false;
      subscribe2((value) => currentValue = value)();
      set(!currentValue);
    }, "toggle")
  };
}
__name(createVoiceChatStore, "createVoiceChatStore");
function createCommandsStore() {
  const { subscribe: subscribe2, set } = writable([]);
  const baseCommands = [
    {
      id: "google-search",
      name: "Google Search",
      description: "Search Google (g %s)",
      shortcut: "g",
      category: "search",
      execute: /* @__PURE__ */ __name((query) => {
      }, "execute")
    },
    {
      id: "amazon-search",
      name: "Amazon Search",
      description: "Search Amazon (am %s)",
      shortcut: "am",
      category: "search",
      execute: /* @__PURE__ */ __name((query) => {
      }, "execute")
    },
    {
      id: "theme-light",
      name: "Theme: Light",
      description: "Switch to light theme",
      category: "theme",
      execute: /* @__PURE__ */ __name(() => {
        theme.setTheme("light");
      }, "execute")
    },
    {
      id: "theme-dark",
      name: "Theme: Dark",
      description: "Switch to dark theme",
      category: "theme",
      execute: /* @__PURE__ */ __name(() => {
        theme.setTheme("dark");
      }, "execute")
    },
    {
      id: "theme-auto",
      name: "Theme: Auto",
      description: "Switch to automatic theme (follows system)",
      category: "theme",
      execute: /* @__PURE__ */ __name(() => {
        theme.setTheme("auto");
      }, "execute")
    },
    {
      id: "voice-chat",
      name: "Start Voice Chat",
      description: "Open AI voice assistant chat session",
      shortcut: "voice",
      category: "custom",
      execute: /* @__PURE__ */ __name(() => {
        voiceChat.open();
      }, "execute")
    }
  ];
  set(baseCommands);
  return {
    subscribe: subscribe2,
    addCommand: /* @__PURE__ */ __name((command) => {
      subscribe2((commands2) => {
        set([...commands2, command]);
        return commands2;
      })();
    }, "addCommand"),
    removeCommand: /* @__PURE__ */ __name((id) => {
      subscribe2((commands2) => {
        set(commands2.filter((cmd) => cmd.id !== id));
        return commands2;
      })();
    }, "removeCommand")
  };
}
__name(createCommandsStore, "createCommandsStore");
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
__name(formatTime, "formatTime");
function convertFloat32ToPCM16(float32Array) {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i4 = 0; i4 < float32Array.length; i4++) {
    const s5 = Math.max(-1, Math.min(1, float32Array[i4]));
    pcm16[i4] = s5 < 0 ? s5 * 32768 : s5 * 32767;
  }
  return pcm16;
}
__name(convertFloat32ToPCM16, "convertFloat32ToPCM16");
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer.buffer);
  for (let i4 = 0; i4 < bytes.byteLength; i4++) {
    binary += String.fromCharCode(bytes[i4]);
  }
  return btoa(binary);
}
__name(arrayBufferToBase64, "arrayBufferToBase64");
var voiceChat;
var commands;
var css$2;
var CommandPalette;
var css$1;
var SILENCE_THRESHOLD;
var SILENCE_DURATION;
var VoiceChat;
var css;
var Layout;
var init_layout_svelte = __esm({
  ".svelte-kit/output/server/entries/pages/_layout.svelte.js"() {
    init_ssr();
    init_theme();
    init_chunks();
    voiceChat = createVoiceChatStore();
    commands = createCommandsStore();
    css$2 = {
      code: ".command-palette-backdrop.svelte-bdp5c2{position:fixed;top:0;left:0;right:0;bottom:0;background-color:rgba(0, 0, 0, 0.5);backdrop-filter:blur(4px);z-index:9999;display:flex;justify-content:center;padding-top:20vh}.command-palette.svelte-bdp5c2{background-color:var(--surface);border-radius:12px;box-shadow:0 20px 60px rgba(0, 0, 0, 0.3);width:100%;max-width:600px;max-height:60vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--border)}.search-container.svelte-bdp5c2{display:flex;align-items:center;padding:1rem;border-bottom:1px solid var(--border);gap:0.75rem}.search-icon.svelte-bdp5c2{font-size:1.25rem;color:var(--text-secondary);opacity:0.5}.search-input.svelte-bdp5c2{flex:1;background:transparent;border:none;outline:none;font-size:1rem;color:var(--text-primary);font-family:inherit}.search-input.svelte-bdp5c2::placeholder{color:var(--text-secondary);opacity:0.6}.escape-hint.svelte-bdp5c2{font-size:0.75rem;color:var(--text-secondary);padding:0.25rem 0.5rem;background-color:var(--surface-variant);border-radius:4px;font-weight:500}.commands-list.svelte-bdp5c2{flex:1;overflow-y:auto;padding:0.5rem}.commands-list.svelte-bdp5c2::-webkit-scrollbar{width:8px}.commands-list.svelte-bdp5c2::-webkit-scrollbar-track{background:transparent}.commands-list.svelte-bdp5c2::-webkit-scrollbar-thumb{background:var(--surface-variant);border-radius:4px}.commands-list.svelte-bdp5c2::-webkit-scrollbar-thumb:hover{background:var(--border)}.command-item.svelte-bdp5c2{width:100%;display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;border:none;background:transparent;cursor:pointer;border-radius:6px;transition:background-color 0.15s ease;text-align:left;gap:1rem}.command-item.svelte-bdp5c2:hover,.command-item.selected.svelte-bdp5c2{background-color:var(--surface-variant)}.command-main.svelte-bdp5c2{flex:1;min-width:0}.command-name.svelte-bdp5c2{font-size:0.9rem;color:var(--text-primary);font-weight:500;margin-bottom:0.15rem}.command-description.svelte-bdp5c2{font-size:0.8rem;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.command-shortcut.svelte-bdp5c2{font-size:0.75rem;color:var(--text-secondary);padding:0.25rem 0.5rem;background-color:var(--surface-container-high);border-radius:4px;font-family:monospace;font-weight:600}.no-results.svelte-bdp5c2{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 1rem;color:var(--text-secondary)}.no-results-icon.svelte-bdp5c2{font-size:3rem;margin-bottom:1rem;opacity:0.5}.no-results-text.svelte-bdp5c2{font-size:0.9rem}.footer.svelte-bdp5c2{border-top:1px solid var(--border);padding:0.75rem 1rem;background-color:var(--surface-variant)}.footer-hint.svelte-bdp5c2{display:flex;gap:1rem;font-size:0.75rem;color:var(--text-secondary);align-items:center}kbd.svelte-bdp5c2{background-color:var(--surface-container-high);padding:0.15rem 0.4rem;border-radius:3px;font-family:monospace;font-size:0.7rem;font-weight:600;border:1px solid var(--border);margin-right:0.25rem}",
      map: '{"version":3,"file":"CommandPalette.svelte","sources":["CommandPalette.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount, onDestroy } from \\"svelte\\";\\nimport { commands } from \\"$lib/stores/commands\\";\\nimport { fly, fade } from \\"svelte/transition\\";\\nexport let isOpen = false;\\nexport let onClose;\\nlet searchInput;\\nlet searchQuery = \\"\\";\\nlet selectedIndex = 0;\\nlet filteredCommands = [];\\nlet allCommands = [];\\nconst unsubscribe = commands.subscribe((cmds) => {\\n  allCommands = cmds;\\n  filterCommands();\\n});\\n$: {\\n  searchQuery;\\n  filterCommands();\\n}\\nfunction filterCommands() {\\n  if (!searchQuery.trim()) {\\n    filteredCommands = allCommands;\\n    selectedIndex = 0;\\n    return;\\n  }\\n  const query = searchQuery.toLowerCase().trim();\\n  const shortcutMatch = query.match(/^(\\\\w+)\\\\s+(.+)$/);\\n  if (shortcutMatch) {\\n    const [, shortcut, searchTerm] = shortcutMatch;\\n    const matchingCommand = allCommands.find((cmd) => cmd.shortcut === shortcut);\\n    if (matchingCommand) {\\n      filteredCommands = [{ ...matchingCommand, name: `${matchingCommand.name}: ${searchTerm}` }];\\n      selectedIndex = 0;\\n      return;\\n    }\\n  }\\n  filteredCommands = allCommands.filter(\\n    (cmd) => cmd.name.toLowerCase().includes(query) || cmd.description.toLowerCase().includes(query) || cmd.shortcut && cmd.shortcut.toLowerCase().includes(query)\\n  );\\n  selectedIndex = 0;\\n}\\nfunction executeCommand(command) {\\n  const query = searchQuery.trim();\\n  const shortcutMatch = query.match(/^(\\\\w+)\\\\s+(.+)$/);\\n  if (shortcutMatch && command.shortcut === shortcutMatch[1]) {\\n    command.execute(shortcutMatch[2]);\\n    closeAndReset();\\n  } else if (command.shortcut && command.category === \\"search\\") {\\n    searchQuery = `${command.shortcut} `;\\n    selectedIndex = 0;\\n    setTimeout(() => {\\n      if (searchInput) {\\n        searchInput.focus();\\n        searchInput.setSelectionRange(searchQuery.length, searchQuery.length);\\n      }\\n    }, 0);\\n  } else {\\n    command.execute();\\n    closeAndReset();\\n  }\\n}\\nfunction handleKeyDown(event) {\\n  if (event.key === \\"Escape\\") {\\n    event.preventDefault();\\n    event.stopPropagation();\\n    if (searchQuery.trim()) {\\n      searchQuery = \\"\\";\\n      selectedIndex = 0;\\n    } else {\\n      closeAndReset();\\n    }\\n  } else if (event.key === \\"ArrowDown\\") {\\n    event.preventDefault();\\n    selectedIndex = (selectedIndex + 1) % filteredCommands.length;\\n  } else if (event.key === \\"ArrowUp\\") {\\n    event.preventDefault();\\n    selectedIndex = selectedIndex === 0 ? filteredCommands.length - 1 : selectedIndex - 1;\\n  } else if (event.key === \\"Enter\\") {\\n    event.preventDefault();\\n    if (filteredCommands.length > 0) {\\n      executeCommand(filteredCommands[selectedIndex]);\\n    }\\n  }\\n}\\nfunction closeAndReset() {\\n  searchQuery = \\"\\";\\n  selectedIndex = 0;\\n  onClose();\\n}\\nfunction handleBackdropClick(event) {\\n  if (event.target === event.currentTarget) {\\n    closeAndReset();\\n  }\\n}\\n$: if (isOpen && searchInput) {\\n  setTimeout(() => searchInput.focus(), 0);\\n}\\nonDestroy(() => {\\n  unsubscribe();\\n});\\n<\/script>\\r\\n\\r\\n{#if isOpen}\\r\\n\\t<div \\r\\n\\t\\tclass=\\"command-palette-backdrop\\" \\r\\n\\t\\ton:click={handleBackdropClick}\\r\\n\\t\\ttransition:fade={{ duration: 150 }}\\r\\n\\t\\trole=\\"presentation\\"\\r\\n\\t>\\r\\n\\t\\t<div class=\\"command-palette\\" transition:fly={{ y: -20, duration: 200 }}>\\r\\n\\t\\t\\t<div class=\\"search-container\\">\\r\\n\\t\\t\\t\\t<div class=\\"search-icon\\">\u2318</div>\\r\\n\\t\\t\\t\\t<input\\r\\n\\t\\t\\t\\t\\tbind:this={searchInput}\\r\\n\\t\\t\\t\\t\\tbind:value={searchQuery}\\r\\n\\t\\t\\t\\t\\ton:keydown={handleKeyDown}\\r\\n\\t\\t\\t\\t\\ttype=\\"text\\"\\r\\n\\t\\t\\t\\t\\tplaceholder=\\"Type a command or search... (e.g., \'g hello\' for Google)\\"\\r\\n\\t\\t\\t\\t\\tclass=\\"search-input\\"\\r\\n\\t\\t\\t\\t\\tautocomplete=\\"off\\"\\r\\n\\t\\t\\t\\t\\tspellcheck=\\"false\\"\\r\\n\\t\\t\\t\\t/>\\r\\n\\t\\t\\t\\t<div class=\\"escape-hint\\">ESC</div>\\r\\n\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t<div class=\\"commands-list\\">\\r\\n\\t\\t\\t\\t{#if filteredCommands.length === 0}\\r\\n\\t\\t\\t\\t\\t<div class=\\"no-results\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"no-results-icon\\">\u{1F50D}</div>\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"no-results-text\\">No commands found</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t{#each filteredCommands as command, index}\\r\\n\\t\\t\\t\\t\\t\\t<button\\r\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"command-item\\"\\r\\n\\t\\t\\t\\t\\t\\t\\tclass:selected={index === selectedIndex}\\r\\n\\t\\t\\t\\t\\t\\t\\ton:click={() => executeCommand(command)}\\r\\n\\t\\t\\t\\t\\t\\t\\ton:mouseenter={() => selectedIndex = index}\\r\\n\\t\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"command-main\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"command-name\\">{command.name}</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"command-description\\">{command.description}</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t{#if command.shortcut}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"command-shortcut\\">{command.shortcut}</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t<div class=\\"footer\\">\\r\\n\\t\\t\\t\\t<div class=\\"footer-hint\\">\\r\\n\\t\\t\\t\\t\\t<kbd>\u2191\u2193</kbd> Navigate\\r\\n\\t\\t\\t\\t\\t<kbd>\u21B5</kbd> Execute\\r\\n\\t\\t\\t\\t\\t<kbd>ESC</kbd> Close\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n{/if}\\r\\n\\r\\n<style>\\r\\n\\t.command-palette-backdrop {\\r\\n\\t\\tposition: fixed;\\r\\n\\t\\ttop: 0;\\r\\n\\t\\tleft: 0;\\r\\n\\t\\tright: 0;\\r\\n\\t\\tbottom: 0;\\r\\n\\t\\tbackground-color: rgba(0, 0, 0, 0.5);\\r\\n\\t\\tbackdrop-filter: blur(4px);\\r\\n\\t\\tz-index: 9999;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tpadding-top: 20vh;\\r\\n\\t}\\r\\n\\r\\n\\t.command-palette {\\r\\n\\t\\tbackground-color: var(--surface);\\r\\n\\t\\tborder-radius: 12px;\\r\\n\\t\\tbox-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tmax-width: 600px;\\r\\n\\t\\tmax-height: 60vh;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\toverflow: hidden;\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t}\\r\\n\\r\\n\\t.search-container {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tborder-bottom: 1px solid var(--border);\\r\\n\\t\\tgap: 0.75rem;\\r\\n\\t}\\r\\n\\r\\n\\t.search-icon {\\r\\n\\t\\tfont-size: 1.25rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\topacity: 0.5;\\r\\n\\t}\\r\\n\\r\\n\\t.search-input {\\r\\n\\t\\tflex: 1;\\r\\n\\t\\tbackground: transparent;\\r\\n\\t\\tborder: none;\\r\\n\\t\\toutline: none;\\r\\n\\t\\tfont-size: 1rem;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tfont-family: inherit;\\r\\n\\t}\\r\\n\\r\\n\\t.search-input::placeholder {\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\topacity: 0.6;\\r\\n\\t}\\r\\n\\r\\n\\t.escape-hint {\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tpadding: 0.25rem 0.5rem;\\r\\n\\t\\tbackground-color: var(--surface-variant);\\r\\n\\t\\tborder-radius: 4px;\\r\\n\\t\\tfont-weight: 500;\\r\\n\\t}\\r\\n\\r\\n\\t.commands-list {\\r\\n\\t\\tflex: 1;\\r\\n\\t\\toverflow-y: auto;\\r\\n\\t\\tpadding: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.commands-list::-webkit-scrollbar {\\r\\n\\t\\twidth: 8px;\\r\\n\\t}\\r\\n\\r\\n\\t.commands-list::-webkit-scrollbar-track {\\r\\n\\t\\tbackground: transparent;\\r\\n\\t}\\r\\n\\r\\n\\t.commands-list::-webkit-scrollbar-thumb {\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t\\tborder-radius: 4px;\\r\\n\\t}\\r\\n\\r\\n\\t.commands-list::-webkit-scrollbar-thumb:hover {\\r\\n\\t\\tbackground: var(--border);\\r\\n\\t}\\r\\n\\r\\n\\t.command-item {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\tpadding: 0.75rem 1rem;\\r\\n\\t\\tborder: none;\\r\\n\\t\\tbackground: transparent;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\tborder-radius: 6px;\\r\\n\\t\\ttransition: background-color 0.15s ease;\\r\\n\\t\\ttext-align: left;\\r\\n\\t\\tgap: 1rem;\\r\\n\\t}\\r\\n\\r\\n\\t.command-item:hover,\\r\\n\\t.command-item.selected {\\r\\n\\t\\tbackground-color: var(--surface-variant);\\r\\n\\t}\\r\\n\\r\\n\\t.command-main {\\r\\n\\t\\tflex: 1;\\r\\n\\t\\tmin-width: 0;\\r\\n\\t}\\r\\n\\r\\n\\t.command-name {\\r\\n\\t\\tfont-size: 0.9rem;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tfont-weight: 500;\\r\\n\\t\\tmargin-bottom: 0.15rem;\\r\\n\\t}\\r\\n\\r\\n\\t.command-description {\\r\\n\\t\\tfont-size: 0.8rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\toverflow: hidden;\\r\\n\\t\\ttext-overflow: ellipsis;\\r\\n\\t\\twhite-space: nowrap;\\r\\n\\t}\\r\\n\\r\\n\\t.command-shortcut {\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tpadding: 0.25rem 0.5rem;\\r\\n\\t\\tbackground-color: var(--surface-container-high);\\r\\n\\t\\tborder-radius: 4px;\\r\\n\\t\\tfont-family: monospace;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t}\\r\\n\\r\\n\\t.no-results {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tpadding: 3rem 1rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t}\\r\\n\\r\\n\\t.no-results-icon {\\r\\n\\t\\tfont-size: 3rem;\\r\\n\\t\\tmargin-bottom: 1rem;\\r\\n\\t\\topacity: 0.5;\\r\\n\\t}\\r\\n\\r\\n\\t.no-results-text {\\r\\n\\t\\tfont-size: 0.9rem;\\r\\n\\t}\\r\\n\\r\\n\\t.footer {\\r\\n\\t\\tborder-top: 1px solid var(--border);\\r\\n\\t\\tpadding: 0.75rem 1rem;\\r\\n\\t\\tbackground-color: var(--surface-variant);\\r\\n\\t}\\r\\n\\r\\n\\t.footer-hint {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tgap: 1rem;\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\talign-items: center;\\r\\n\\t}\\r\\n\\r\\n\\tkbd {\\r\\n\\t\\tbackground-color: var(--surface-container-high);\\r\\n\\t\\tpadding: 0.15rem 0.4rem;\\r\\n\\t\\tborder-radius: 3px;\\r\\n\\t\\tfont-family: monospace;\\r\\n\\t\\tfont-size: 0.7rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tmargin-right: 0.25rem;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"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"}'
    };
    CommandPalette = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { isOpen = false } = $$props;
      let { onClose } = $$props;
      let searchInput;
      let searchQuery = "";
      let selectedIndex = 0;
      let filteredCommands = [];
      let allCommands = [];
      const unsubscribe = commands.subscribe((cmds) => {
        allCommands = cmds;
        filterCommands();
      });
      function filterCommands() {
        if (!searchQuery.trim()) {
          filteredCommands = allCommands;
          selectedIndex = 0;
          return;
        }
        const query = searchQuery.toLowerCase().trim();
        const shortcutMatch = query.match(/^(\w+)\s+(.+)$/);
        if (shortcutMatch) {
          const [, shortcut, searchTerm] = shortcutMatch;
          const matchingCommand = allCommands.find((cmd) => cmd.shortcut === shortcut);
          if (matchingCommand) {
            filteredCommands = [
              {
                ...matchingCommand,
                name: `${matchingCommand.name}: ${searchTerm}`
              }
            ];
            selectedIndex = 0;
            return;
          }
        }
        filteredCommands = allCommands.filter((cmd) => cmd.name.toLowerCase().includes(query) || cmd.description.toLowerCase().includes(query) || cmd.shortcut && cmd.shortcut.toLowerCase().includes(query));
        selectedIndex = 0;
      }
      __name(filterCommands, "filterCommands");
      onDestroy(() => {
        unsubscribe();
      });
      if ($$props.isOpen === void 0 && $$bindings.isOpen && isOpen !== void 0) $$bindings.isOpen(isOpen);
      if ($$props.onClose === void 0 && $$bindings.onClose && onClose !== void 0) $$bindings.onClose(onClose);
      $$result.css.add(css$2);
      {
        {
          filterCommands();
        }
      }
      return `${isOpen ? `<div class="command-palette-backdrop svelte-bdp5c2" role="presentation"><div class="command-palette svelte-bdp5c2"><div class="search-container svelte-bdp5c2"><div class="search-icon svelte-bdp5c2" data-svelte-h="svelte-p0tyjp">\u2318</div> <input type="text" placeholder="Type a command or search... (e.g., 'g hello' for Google)" class="search-input svelte-bdp5c2" autocomplete="off" spellcheck="false"${add_attribute("this", searchInput, 0)}${add_attribute("value", searchQuery, 0)}> <div class="escape-hint svelte-bdp5c2" data-svelte-h="svelte-vpd1j3">ESC</div></div> <div class="commands-list svelte-bdp5c2">${filteredCommands.length === 0 ? `<div class="no-results svelte-bdp5c2" data-svelte-h="svelte-hkckcr"><div class="no-results-icon svelte-bdp5c2">\u{1F50D}</div> <div class="no-results-text svelte-bdp5c2">No commands found</div></div>` : `${each(filteredCommands, (command, index4) => {
        return `<button class="${["command-item svelte-bdp5c2", index4 === selectedIndex ? "selected" : ""].join(" ").trim()}"><div class="command-main svelte-bdp5c2"><div class="command-name svelte-bdp5c2">${escape(command.name)}</div> <div class="command-description svelte-bdp5c2">${escape(command.description)}</div></div> ${command.shortcut ? `<div class="command-shortcut svelte-bdp5c2">${escape(command.shortcut)}</div>` : ``} </button>`;
      })}`}</div> <div class="footer svelte-bdp5c2" data-svelte-h="svelte-b6qwwm"><div class="footer-hint svelte-bdp5c2"><kbd class="svelte-bdp5c2">\u2191\u2193</kbd> Navigate
					<kbd class="svelte-bdp5c2">\u21B5</kbd> Execute
					<kbd class="svelte-bdp5c2">ESC</kbd> Close</div></div></div></div>` : ``}`;
    });
    css$1 = {
      code: ".voice-chat-container.mobile.svelte-4xvwue.svelte-4xvwue{position:fixed;top:0;left:0;right:0;bottom:0;background-color:rgba(0, 0, 0, 0.95);z-index:10000;display:flex;align-items:center;justify-content:center}.voice-chat-container.mobile.svelte-4xvwue .mobile-window.svelte-4xvwue{width:100%;height:100%;border-radius:0;display:flex;flex-direction:column;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%)}.voice-chat-container.desktop.svelte-4xvwue.svelte-4xvwue{position:fixed;bottom:2rem;right:2rem;z-index:10000;display:none}.voice-chat-window.desktop-window.svelte-4xvwue.svelte-4xvwue{width:320px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:16px;box-shadow:0 10px 40px rgba(0, 0, 0, 0.3);overflow:hidden;border:2px solid rgba(255, 255, 255, 0.1)}@media(min-width: 768px){.voice-chat-container.mobile.svelte-4xvwue.svelte-4xvwue{display:none}.voice-chat-container.desktop.svelte-4xvwue.svelte-4xvwue{display:block}}.voice-chat-header.svelte-4xvwue.svelte-4xvwue{padding:1.25rem;display:flex;align-items:center;gap:1rem;background:rgba(0, 0, 0, 0.2);backdrop-filter:blur(10px)}.status-indicator.svelte-4xvwue.svelte-4xvwue{width:2.5rem;height:2.5rem;border-radius:50%;background:rgba(255, 255, 255, 0.2);display:flex;align-items:center;justify-content:center;font-size:1.25rem}.status-indicator.connecting.svelte-4xvwue.svelte-4xvwue{animation:svelte-4xvwue-pulse 1.5s ease-in-out infinite}.status-indicator.connected.svelte-4xvwue.svelte-4xvwue{background:rgba(76, 175, 80, 0.3)}@keyframes svelte-4xvwue-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:0.8}}.call-info.svelte-4xvwue.svelte-4xvwue{flex:1;color:white}.call-title.svelte-4xvwue.svelte-4xvwue{font-weight:600;font-size:1rem;margin-bottom:0.25rem}.call-status.svelte-4xvwue.svelte-4xvwue{font-size:0.875rem;opacity:0.8}.voice-chat-body.svelte-4xvwue.svelte-4xvwue{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;min-height:200px}.avatar.svelte-4xvwue.svelte-4xvwue{position:relative;width:120px;height:120px;margin-bottom:1.5rem}.avatar-pulse.svelte-4xvwue.svelte-4xvwue{position:absolute;inset:-10px;border-radius:50%;background:rgba(255, 255, 255, 0.3);opacity:0;transition:opacity 0.3s}.avatar-pulse.active.svelte-4xvwue.svelte-4xvwue{opacity:1;animation:svelte-4xvwue-ripple 2s ease-out infinite}@keyframes svelte-4xvwue-ripple{0%{transform:scale(0.8);opacity:1}100%{transform:scale(1.4);opacity:0}}.avatar-icon.svelte-4xvwue.svelte-4xvwue{position:relative;width:100%;height:100%;border-radius:50%;background:rgba(255, 255, 255, 0.2);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;font-size:4rem;border:3px solid rgba(255, 255, 255, 0.3)}.connection-status.svelte-4xvwue.svelte-4xvwue{text-align:center;color:white;font-size:0.875rem;opacity:0.9;margin-bottom:1rem}.connection-status.svelte-4xvwue p.processing.svelte-4xvwue{animation:svelte-4xvwue-pulse 1.5s ease-in-out infinite}.conversation-display.svelte-4xvwue.svelte-4xvwue{width:100%;max-height:200px;overflow-y:auto;padding:0.5rem;border-radius:8px;background:rgba(0, 0, 0, 0.2);backdrop-filter:blur(10px)}.message.svelte-4xvwue.svelte-4xvwue{margin-bottom:0.75rem;padding:0.5rem;border-radius:6px;background:rgba(255, 255, 255, 0.1);color:white;font-size:0.8rem}.message.user.svelte-4xvwue.svelte-4xvwue{background:rgba(103, 126, 234, 0.3);border-left:3px solid rgba(103, 126, 234, 0.8)}.message.assistant.svelte-4xvwue.svelte-4xvwue{background:rgba(118, 75, 162, 0.3);border-left:3px solid rgba(118, 75, 162, 0.8)}.role-badge.svelte-4xvwue.svelte-4xvwue{display:inline-block;font-weight:600;font-size:0.7rem;opacity:0.8;margin-right:0.5rem;text-transform:uppercase}.message-text.svelte-4xvwue.svelte-4xvwue{display:block;margin-top:0.25rem;line-height:1.4}.voice-chat-controls.svelte-4xvwue.svelte-4xvwue{padding:1.5rem;display:flex;gap:1rem;justify-content:center;background:rgba(0, 0, 0, 0.2);backdrop-filter:blur(10px)}.control-button.svelte-4xvwue.svelte-4xvwue{width:60px;height:60px;border-radius:50%;border:none;font-size:1.75rem;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;justify-content:center;background:rgba(255, 255, 255, 0.2);backdrop-filter:blur(10px);border:2px solid rgba(255, 255, 255, 0.3)}.control-button.svelte-4xvwue.svelte-4xvwue:hover:not(:disabled){transform:scale(1.1);background:rgba(255, 255, 255, 0.3)}.control-button.svelte-4xvwue.svelte-4xvwue:active:not(:disabled){transform:scale(0.95)}.control-button.svelte-4xvwue.svelte-4xvwue:disabled{opacity:0.5;cursor:not-allowed}.mute-button.active.svelte-4xvwue.svelte-4xvwue{background:rgba(244, 67, 54, 0.3);border-color:rgba(244, 67, 54, 0.5)}.hangup-button.svelte-4xvwue.svelte-4xvwue{background:rgba(244, 67, 54, 0.3);border-color:rgba(244, 67, 54, 0.5);transform:rotate(135deg)}.hangup-button.svelte-4xvwue.svelte-4xvwue:hover{background:rgba(244, 67, 54, 0.5);transform:rotate(135deg) scale(1.1)}.hangup-button.svelte-4xvwue.svelte-4xvwue:active{transform:rotate(135deg) scale(0.95)}@media(min-width: 768px){.voice-chat-body.svelte-4xvwue.svelte-4xvwue{min-height:auto}.avatar.svelte-4xvwue.svelte-4xvwue{width:100px;height:100px;margin-bottom:1rem}.avatar-icon.svelte-4xvwue.svelte-4xvwue{font-size:3rem}.connection-status.svelte-4xvwue.svelte-4xvwue{display:none}}",
      map: `{"version":3,"file":"VoiceChat.svelte","sources":["VoiceChat.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount, onDestroy } from \\"svelte\\";\\nimport { fly, fade } from \\"svelte/transition\\";\\nexport let isOpen = false;\\nexport let onClose;\\nlet isConnected = false;\\nlet isConnecting = false;\\nlet isMuted = false;\\nlet isProcessing = false;\\nlet audioContext = null;\\nlet mediaStream = null;\\nlet webSocket = null;\\nlet elapsedTime = 0;\\nlet timerInterval = null;\\nlet audioProcessor = null;\\nlet isSpeaking = false;\\nlet silenceStart = null;\\nlet conversationMessages = [];\\nconst SILENCE_THRESHOLD = 0.01;\\nconst SILENCE_DURATION = 1e3;\\nconst CLOUDFLARE_REALTIME_URL = typeof window !== \\"undefined\\" ? \`\${window.location.protocol === \\"https:\\" ? \\"wss:\\" : \\"ws:\\"}//\${window.location.host}/api/realtime\` : \\"ws://localhost:5173/api/realtime\\";\\nonMount(() => {\\n  if (isOpen && !isConnected) {\\n    startVoiceChat();\\n  }\\n});\\nonDestroy(() => {\\n  cleanup();\\n});\\n$: if (isOpen && !isConnected && !isConnecting) {\\n  startVoiceChat();\\n}\\n$: if (!isOpen) {\\n  cleanup();\\n}\\nfunction formatTime(seconds) {\\n  const mins = Math.floor(seconds / 60);\\n  const secs = seconds % 60;\\n  return \`\${mins.toString().padStart(2, \\"0\\")}:\${secs.toString().padStart(2, \\"0\\")}\`;\\n}\\nasync function startVoiceChat() {\\n  try {\\n    isConnecting = true;\\n    mediaStream = await navigator.mediaDevices.getUserMedia({\\n      audio: {\\n        echoCancellation: true,\\n        noiseSuppression: true,\\n        autoGainControl: true\\n      }\\n    });\\n    audioContext = new AudioContext({ sampleRate: 16e3 });\\n    const source = audioContext.createMediaStreamSource(mediaStream);\\n    webSocket = new WebSocket(CLOUDFLARE_REALTIME_URL);\\n    console.log(\\"Attempting WebSocket connection to:\\", CLOUDFLARE_REALTIME_URL);\\n    webSocket.onopen = () => {\\n      console.log(\\"Connected to Cloudflare Realtime\\");\\n      isConnected = true;\\n      isConnecting = false;\\n      startTimer();\\n      if (webSocket) {\\n        webSocket.send(JSON.stringify({\\n          type: \\"session.update\\",\\n          session: {\\n            modalities: [\\"text\\", \\"audio\\"],\\n            instructions: \\"You are a helpful AI assistant in a voice conversation.\\",\\n            voice: \\"alloy\\",\\n            input_audio_format: \\"pcm16\\",\\n            output_audio_format: \\"pcm16\\",\\n            turn_detection: {\\n              type: \\"server_vad\\",\\n              threshold: 0.5,\\n              prefix_padding_ms: 300,\\n              silence_duration_ms: 500\\n            }\\n          }\\n        }));\\n      }\\n    };\\n    webSocket.onmessage = async (event) => {\\n      try {\\n        const message = JSON.parse(event.data);\\n        console.log(\\"Received message:\\", message.type);\\n        if (message.type === \\"session.created\\") {\\n          console.log(\\"Session created successfully\\");\\n        }\\n        if (message.type === \\"input_audio_buffer.committed\\") {\\n          console.log(\\"Audio buffer committed, AI processing...\\");\\n          isProcessing = true;\\n        }\\n        if (message.type === \\"conversation.item.created\\" && message.item?.role === \\"user\\") {\\n          const text = message.item.content?.[0]?.text || \\"\\";\\n          if (text) {\\n            conversationMessages = [...conversationMessages, { role: \\"user\\", text }];\\n          }\\n        }\\n        if (message.type === \\"response.text.delta\\" && message.delta) {\\n          conversationMessages = [...conversationMessages, { role: \\"assistant\\", text: message.delta }];\\n        }\\n        if (message.type === \\"response.audio.delta\\" && message.delta) {\\n          await playAudioChunk(message.delta);\\n        }\\n        if (message.type === \\"response.audio.done\\") {\\n          console.log(\\"AI response complete\\");\\n          isProcessing = false;\\n        }\\n        if (message.type === \\"error\\") {\\n          console.error(\\"Cloudflare Realtime error:\\", message.error);\\n          isProcessing = false;\\n        }\\n      } catch (error) {\\n        console.error(\\"Error processing message:\\", error);\\n      }\\n    };\\n    webSocket.onerror = (error) => {\\n      console.error(\\"WebSocket error:\\", error);\\n      console.error(\\"WebSocket URL was:\\", CLOUDFLARE_REALTIME_URL);\\n      isConnecting = false;\\n      isConnected = false;\\n    };\\n    webSocket.onclose = (event) => {\\n      console.log(\\"Disconnected from Cloudflare Realtime\\");\\n      console.log(\\"Close code:\\", event.code, \\"Reason:\\", event.reason);\\n      isConnected = false;\\n      isConnecting = false;\\n      stopTimer();\\n      if (event.code === 1006) {\\n        alert(\\"WebSocket connection failed. This feature requires deployment to Cloudflare Pages to work. WebSockets are not supported in local development.\\");\\n      }\\n    };\\n    audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);\\n    source.connect(audioProcessor);\\n    audioProcessor.connect(audioContext.destination);\\n    audioProcessor.onaudioprocess = (e) => {\\n      if (!isMuted && webSocket && webSocket.readyState === WebSocket.OPEN) {\\n        const inputData = e.inputBuffer.getChannelData(0);\\n        const rms = Math.sqrt(inputData.reduce((sum, val) => sum + val * val, 0) / inputData.length);\\n        const currentTime = Date.now();\\n        if (rms > SILENCE_THRESHOLD) {\\n          if (!isSpeaking) {\\n            console.log(\\"Speech detected, starting audio buffer\\");\\n            isSpeaking = true;\\n          }\\n          silenceStart = null;\\n          const pcm16 = convertFloat32ToPCM16(inputData);\\n          const base64Audio = arrayBufferToBase64(pcm16);\\n          webSocket.send(JSON.stringify({\\n            type: \\"input_audio_buffer.append\\",\\n            audio: base64Audio\\n          }));\\n        } else if (isSpeaking) {\\n          if (!silenceStart) {\\n            silenceStart = currentTime;\\n          } else if (currentTime - silenceStart > SILENCE_DURATION) {\\n            console.log(\\"Silence detected, committing audio buffer\\");\\n            webSocket.send(JSON.stringify({\\n              type: \\"input_audio_buffer.commit\\"\\n            }));\\n            isSpeaking = false;\\n            silenceStart = null;\\n          }\\n        }\\n      }\\n    };\\n  } catch (error) {\\n    console.error(\\"Error starting voice chat:\\", error);\\n    isConnecting = false;\\n    alert(\\"Failed to access microphone or connect to voice service. Please check your permissions.\\");\\n  }\\n}\\nfunction convertFloat32ToPCM16(float32Array) {\\n  const pcm16 = new Int16Array(float32Array.length);\\n  for (let i = 0; i < float32Array.length; i++) {\\n    const s = Math.max(-1, Math.min(1, float32Array[i]));\\n    pcm16[i] = s < 0 ? s * 32768 : s * 32767;\\n  }\\n  return pcm16;\\n}\\nfunction arrayBufferToBase64(buffer) {\\n  let binary = \\"\\";\\n  const bytes = new Uint8Array(buffer.buffer);\\n  for (let i = 0; i < bytes.byteLength; i++) {\\n    binary += String.fromCharCode(bytes[i]);\\n  }\\n  return btoa(binary);\\n}\\nasync function playAudioChunk(base64Audio) {\\n  if (!audioContext) return;\\n  try {\\n    const binaryString = atob(base64Audio);\\n    const bytes = new Uint8Array(binaryString.length);\\n    for (let i = 0; i < binaryString.length; i++) {\\n      bytes[i] = binaryString.charCodeAt(i);\\n    }\\n    const pcm16 = new Int16Array(bytes.buffer);\\n    const float32 = new Float32Array(pcm16.length);\\n    for (let i = 0; i < pcm16.length; i++) {\\n      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 32768 : 32767);\\n    }\\n    const audioBuffer = audioContext.createBuffer(1, float32.length, audioContext.sampleRate);\\n    audioBuffer.getChannelData(0).set(float32);\\n    const source = audioContext.createBufferSource();\\n    source.buffer = audioBuffer;\\n    source.connect(audioContext.destination);\\n    source.start();\\n  } catch (error) {\\n    console.error(\\"Error playing audio chunk:\\", error);\\n  }\\n}\\nfunction startTimer() {\\n  elapsedTime = 0;\\n  timerInterval = window.setInterval(() => {\\n    elapsedTime++;\\n  }, 1e3);\\n}\\nfunction stopTimer() {\\n  if (timerInterval) {\\n    clearInterval(timerInterval);\\n    timerInterval = null;\\n  }\\n  elapsedTime = 0;\\n}\\nfunction toggleMute() {\\n  isMuted = !isMuted;\\n  if (mediaStream) {\\n    mediaStream.getAudioTracks().forEach((track) => {\\n      track.enabled = !isMuted;\\n    });\\n  }\\n}\\nfunction hangup() {\\n  cleanup();\\n  onClose();\\n}\\nfunction cleanup() {\\n  stopTimer();\\n  if (webSocket) {\\n    webSocket.close();\\n    webSocket = null;\\n  }\\n  if (audioProcessor) {\\n    audioProcessor.disconnect();\\n    audioProcessor = null;\\n  }\\n  if (mediaStream) {\\n    mediaStream.getTracks().forEach((track) => track.stop());\\n    mediaStream = null;\\n  }\\n  if (audioContext) {\\n    audioContext.close();\\n    audioContext = null;\\n  }\\n  isConnected = false;\\n  isConnecting = false;\\n  isMuted = false;\\n  isProcessing = false;\\n  isSpeaking = false;\\n  silenceStart = null;\\n  conversationMessages = [];\\n}\\nfunction handleBackdropClick(event) {\\n  if (window.innerWidth < 768 && event.target === event.currentTarget) {\\n    hangup();\\n  }\\n}\\n<\/script>\\r\\n\\r\\n{#if isOpen}\\r\\n\\t<!-- Mobile: Full screen overlay -->\\r\\n\\t<div \\r\\n\\t\\tclass=\\"voice-chat-container mobile\\"\\r\\n\\t\\ton:click={handleBackdropClick}\\r\\n\\t\\ttransition:fade={{ duration: 200 }}\\r\\n\\t\\trole=\\"dialog\\"\\r\\n\\t\\taria-label=\\"Voice chat session\\"\\r\\n\\t>\\r\\n\\t\\t<div class=\\"voice-chat-window mobile-window\\">\\r\\n\\t\\t\\t<div class=\\"voice-chat-header\\">\\r\\n\\t\\t\\t\\t<div class=\\"status-indicator\\" class:connected={isConnected} class:connecting={isConnecting}>\\r\\n\\t\\t\\t\\t\\t{isConnecting ? '\u{1F504}' : isConnected ? '\u{1F3A4}' : '\u23F8\uFE0F'}\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div class=\\"call-info\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"call-title\\">AI Voice Assistant</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"call-status\\">\\r\\n\\t\\t\\t\\t\\t\\t{#if isConnecting}\\r\\n\\t\\t\\t\\t\\t\\t\\tConnecting...\\r\\n\\t\\t\\t\\t\\t\\t{:else if isConnected}\\r\\n\\t\\t\\t\\t\\t\\t\\t{formatTime(elapsedTime)}\\r\\n\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\tDisconnected\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t<div class=\\"voice-chat-body\\">\\r\\n\\t\\t\\t\\t<div class=\\"avatar\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"avatar-pulse\\" class:active={isConnected && !isMuted}></div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"avatar-icon\\">\u{1F916}</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t\\t<div class=\\"connection-status\\">\\r\\n\\t\\t\\t\\t\\t{#if isConnecting}\\r\\n\\t\\t\\t\\t\\t\\t<p>Establishing connection...</p>\\r\\n\\t\\t\\t\\t\\t{:else if isConnected}\\r\\n\\t\\t\\t\\t\\t\\t<p class:processing={isProcessing}>\\r\\n\\t\\t\\t\\t\\t\\t\\t{isProcessing ? 'AI is thinking...' : isSpeaking ? 'Listening...' : 'Ready to listen'}\\r\\n\\t\\t\\t\\t\\t\\t</p>\\r\\n\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t<p>Not connected</p>\\r\\n\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t\\t{#if conversationMessages.length > 0}\\r\\n\\t\\t\\t\\t\\t<div class=\\"conversation-display\\">\\r\\n\\t\\t\\t\\t\\t\\t{#each conversationMessages as message}\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"message {message.role}\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<span class=\\"role-badge\\">{message.role === 'user' ? 'You' : 'AI'}</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<span class=\\"message-text\\">{message.text}</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t<div class=\\"voice-chat-controls\\">\\r\\n\\t\\t\\t\\t<button \\r\\n\\t\\t\\t\\t\\tclass=\\"control-button mute-button\\" \\r\\n\\t\\t\\t\\t\\tclass:active={isMuted}\\r\\n\\t\\t\\t\\t\\ton:click={toggleMute}\\r\\n\\t\\t\\t\\t\\tdisabled={!isConnected}\\r\\n\\t\\t\\t\\t\\ttitle={isMuted ? 'Unmute' : 'Mute'}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t{isMuted ? '\u{1F507}' : '\u{1F50A}'}\\r\\n\\t\\t\\t\\t</button>\\r\\n\\r\\n\\t\\t\\t\\t<button \\r\\n\\t\\t\\t\\t\\tclass=\\"control-button hangup-button\\"\\r\\n\\t\\t\\t\\t\\ton:click={hangup}\\r\\n\\t\\t\\t\\t\\ttitle=\\"Hang up\\"\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\u{1F4DE}\\r\\n\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\r\\n\\t<!-- Desktop: Bottom right floating window -->\\r\\n\\t<div \\r\\n\\t\\tclass=\\"voice-chat-container desktop\\"\\r\\n\\t\\ttransition:fly={{ y: 100, duration: 300 }}\\r\\n\\t\\trole=\\"dialog\\"\\r\\n\\t\\taria-label=\\"Voice chat session\\"\\r\\n\\t>\\r\\n\\t\\t<div class=\\"voice-chat-window desktop-window\\">\\r\\n\\t\\t\\t<div class=\\"voice-chat-header\\">\\r\\n\\t\\t\\t\\t<div class=\\"status-indicator\\" class:connected={isConnected} class:connecting={isConnecting}>\\r\\n\\t\\t\\t\\t\\t{isConnecting ? '\u{1F504}' : isConnected ? '\u{1F3A4}' : '\u23F8\uFE0F'}\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t<div class=\\"call-info\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"call-title\\">AI Voice Assistant</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"call-status\\">\\r\\n\\t\\t\\t\\t\\t\\t{#if isConnecting}\\r\\n\\t\\t\\t\\t\\t\\t\\tConnecting...\\r\\n\\t\\t\\t\\t\\t\\t{:else if isConnected}\\r\\n\\t\\t\\t\\t\\t\\t\\t{formatTime(elapsedTime)}\\r\\n\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\tDisconnected\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t<div class=\\"voice-chat-body\\">\\r\\n\\t\\t\\t\\t<div class=\\"avatar\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"avatar-pulse\\" class:active={isConnected && !isMuted}></div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"avatar-icon\\">\u{1F916}</div>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\r\\n\\t\\t\\t<div class=\\"voice-chat-controls\\">\\r\\n\\t\\t\\t\\t<button \\r\\n\\t\\t\\t\\t\\tclass=\\"control-button mute-button\\" \\r\\n\\t\\t\\t\\t\\tclass:active={isMuted}\\r\\n\\t\\t\\t\\t\\ton:click={toggleMute}\\r\\n\\t\\t\\t\\t\\tdisabled={!isConnected}\\r\\n\\t\\t\\t\\t\\ttitle={isMuted ? 'Unmute' : 'Mute'}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t{isMuted ? '\u{1F507}' : '\u{1F50A}'}\\r\\n\\t\\t\\t\\t</button>\\r\\n\\r\\n\\t\\t\\t\\t<button \\r\\n\\t\\t\\t\\t\\tclass=\\"control-button hangup-button\\"\\r\\n\\t\\t\\t\\t\\ton:click={hangup}\\r\\n\\t\\t\\t\\t\\ttitle=\\"Hang up\\"\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\u{1F4DE}\\r\\n\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n{/if}\\r\\n\\r\\n<style>\\r\\n\\t/* Mobile styles */\\r\\n\\t.voice-chat-container.mobile {\\r\\n\\t\\tposition: fixed;\\r\\n\\t\\ttop: 0;\\r\\n\\t\\tleft: 0;\\r\\n\\t\\tright: 0;\\r\\n\\t\\tbottom: 0;\\r\\n\\t\\tbackground-color: rgba(0, 0, 0, 0.95);\\r\\n\\t\\tz-index: 10000;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t}\\r\\n\\r\\n\\t.voice-chat-container.mobile .mobile-window {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tborder-radius: 0;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tbackground: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\\r\\n\\t}\\r\\n\\r\\n\\t/* Desktop styles */\\r\\n\\t.voice-chat-container.desktop {\\r\\n\\t\\tposition: fixed;\\r\\n\\t\\tbottom: 2rem;\\r\\n\\t\\tright: 2rem;\\r\\n\\t\\tz-index: 10000;\\r\\n\\t\\tdisplay: none;\\r\\n\\t}\\r\\n\\r\\n\\t.voice-chat-window.desktop-window {\\r\\n\\t\\twidth: 320px;\\r\\n\\t\\tbackground: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\\r\\n\\t\\tborder-radius: 16px;\\r\\n\\t\\tbox-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);\\r\\n\\t\\toverflow: hidden;\\r\\n\\t\\tborder: 2px solid rgba(255, 255, 255, 0.1);\\r\\n\\t}\\r\\n\\r\\n\\t@media (min-width: 768px) {\\r\\n\\t\\t.voice-chat-container.mobile {\\r\\n\\t\\t\\tdisplay: none;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.voice-chat-container.desktop {\\r\\n\\t\\t\\tdisplay: block;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n\\r\\n\\t.voice-chat-header {\\r\\n\\t\\tpadding: 1.25rem;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tgap: 1rem;\\r\\n\\t\\tbackground: rgba(0, 0, 0, 0.2);\\r\\n\\t\\tbackdrop-filter: blur(10px);\\r\\n\\t}\\r\\n\\r\\n\\t.status-indicator {\\r\\n\\t\\twidth: 2.5rem;\\r\\n\\t\\theight: 2.5rem;\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tbackground: rgba(255, 255, 255, 0.2);\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tfont-size: 1.25rem;\\r\\n\\t}\\r\\n\\r\\n\\t.status-indicator.connecting {\\r\\n\\t\\tanimation: pulse 1.5s ease-in-out infinite;\\r\\n\\t}\\r\\n\\r\\n\\t.status-indicator.connected {\\r\\n\\t\\tbackground: rgba(76, 175, 80, 0.3);\\r\\n\\t}\\r\\n\\r\\n\\t@keyframes pulse {\\r\\n\\t\\t0%, 100% { transform: scale(1); opacity: 1; }\\r\\n\\t\\t50% { transform: scale(1.1); opacity: 0.8; }\\r\\n\\t}\\r\\n\\r\\n\\t.call-info {\\r\\n\\t\\tflex: 1;\\r\\n\\t\\tcolor: white;\\r\\n\\t}\\r\\n\\r\\n\\t.call-title {\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tfont-size: 1rem;\\r\\n\\t\\tmargin-bottom: 0.25rem;\\r\\n\\t}\\r\\n\\r\\n\\t.call-status {\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\topacity: 0.8;\\r\\n\\t}\\r\\n\\r\\n\\t.voice-chat-body {\\r\\n\\t\\tflex: 1;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tpadding: 2rem;\\r\\n\\t\\tmin-height: 200px;\\r\\n\\t}\\r\\n\\r\\n\\t.avatar {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\twidth: 120px;\\r\\n\\t\\theight: 120px;\\r\\n\\t\\tmargin-bottom: 1.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.avatar-pulse {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\tinset: -10px;\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tbackground: rgba(255, 255, 255, 0.3);\\r\\n\\t\\topacity: 0;\\r\\n\\t\\ttransition: opacity 0.3s;\\r\\n\\t}\\r\\n\\r\\n\\t.avatar-pulse.active {\\r\\n\\t\\topacity: 1;\\r\\n\\t\\tanimation: ripple 2s ease-out infinite;\\r\\n\\t}\\r\\n\\r\\n\\t@keyframes ripple {\\r\\n\\t\\t0% {\\r\\n\\t\\t\\ttransform: scale(0.8);\\r\\n\\t\\t\\topacity: 1;\\r\\n\\t\\t}\\r\\n\\t\\t100% {\\r\\n\\t\\t\\ttransform: scale(1.4);\\r\\n\\t\\t\\topacity: 0;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n\\r\\n\\t.avatar-icon {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tbackground: rgba(255, 255, 255, 0.2);\\r\\n\\t\\tbackdrop-filter: blur(10px);\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tfont-size: 4rem;\\r\\n\\t\\tborder: 3px solid rgba(255, 255, 255, 0.3);\\r\\n\\t}\\r\\n\\r\\n\\t.connection-status {\\r\\n\\t\\ttext-align: center;\\r\\n\\t\\tcolor: white;\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\topacity: 0.9;\\r\\n\\t\\tmargin-bottom: 1rem;\\r\\n\\t}\\r\\n\\r\\n\\t.connection-status p.processing {\\r\\n\\t\\tanimation: pulse 1.5s ease-in-out infinite;\\r\\n\\t}\\r\\n\\r\\n\\t.conversation-display {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tmax-height: 200px;\\r\\n\\t\\toverflow-y: auto;\\r\\n\\t\\tpadding: 0.5rem;\\r\\n\\t\\tborder-radius: 8px;\\r\\n\\t\\tbackground: rgba(0, 0, 0, 0.2);\\r\\n\\t\\tbackdrop-filter: blur(10px);\\r\\n\\t}\\r\\n\\r\\n\\t.message {\\r\\n\\t\\tmargin-bottom: 0.75rem;\\r\\n\\t\\tpadding: 0.5rem;\\r\\n\\t\\tborder-radius: 6px;\\r\\n\\t\\tbackground: rgba(255, 255, 255, 0.1);\\r\\n\\t\\tcolor: white;\\r\\n\\t\\tfont-size: 0.8rem;\\r\\n\\t}\\r\\n\\r\\n\\t.message.user {\\r\\n\\t\\tbackground: rgba(103, 126, 234, 0.3);\\r\\n\\t\\tborder-left: 3px solid rgba(103, 126, 234, 0.8);\\r\\n\\t}\\r\\n\\r\\n\\t.message.assistant {\\r\\n\\t\\tbackground: rgba(118, 75, 162, 0.3);\\r\\n\\t\\tborder-left: 3px solid rgba(118, 75, 162, 0.8);\\r\\n\\t}\\r\\n\\r\\n\\t.role-badge {\\r\\n\\t\\tdisplay: inline-block;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tfont-size: 0.7rem;\\r\\n\\t\\topacity: 0.8;\\r\\n\\t\\tmargin-right: 0.5rem;\\r\\n\\t\\ttext-transform: uppercase;\\r\\n\\t}\\r\\n\\r\\n\\t.message-text {\\r\\n\\t\\tdisplay: block;\\r\\n\\t\\tmargin-top: 0.25rem;\\r\\n\\t\\tline-height: 1.4;\\r\\n\\t}\\r\\n\\r\\n\\t.voice-chat-controls {\\r\\n\\t\\tpadding: 1.5rem;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tgap: 1rem;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tbackground: rgba(0, 0, 0, 0.2);\\r\\n\\t\\tbackdrop-filter: blur(10px);\\r\\n\\t}\\r\\n\\r\\n\\t.control-button {\\r\\n\\t\\twidth: 60px;\\r\\n\\t\\theight: 60px;\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tborder: none;\\r\\n\\t\\tfont-size: 1.75rem;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tbackground: rgba(255, 255, 255, 0.2);\\r\\n\\t\\tbackdrop-filter: blur(10px);\\r\\n\\t\\tborder: 2px solid rgba(255, 255, 255, 0.3);\\r\\n\\t}\\r\\n\\r\\n\\t.control-button:hover:not(:disabled) {\\r\\n\\t\\ttransform: scale(1.1);\\r\\n\\t\\tbackground: rgba(255, 255, 255, 0.3);\\r\\n\\t}\\r\\n\\r\\n\\t.control-button:active:not(:disabled) {\\r\\n\\t\\ttransform: scale(0.95);\\r\\n\\t}\\r\\n\\r\\n\\t.control-button:disabled {\\r\\n\\t\\topacity: 0.5;\\r\\n\\t\\tcursor: not-allowed;\\r\\n\\t}\\r\\n\\r\\n\\t.mute-button.active {\\r\\n\\t\\tbackground: rgba(244, 67, 54, 0.3);\\r\\n\\t\\tborder-color: rgba(244, 67, 54, 0.5);\\r\\n\\t}\\r\\n\\r\\n\\t.hangup-button {\\r\\n\\t\\tbackground: rgba(244, 67, 54, 0.3);\\r\\n\\t\\tborder-color: rgba(244, 67, 54, 0.5);\\r\\n\\t\\ttransform: rotate(135deg);\\r\\n\\t}\\r\\n\\r\\n\\t.hangup-button:hover {\\r\\n\\t\\tbackground: rgba(244, 67, 54, 0.5);\\r\\n\\t\\ttransform: rotate(135deg) scale(1.1);\\r\\n\\t}\\r\\n\\r\\n\\t.hangup-button:active {\\r\\n\\t\\ttransform: rotate(135deg) scale(0.95);\\r\\n\\t}\\r\\n\\r\\n\\t@media (min-width: 768px) {\\r\\n\\t\\t.voice-chat-body {\\r\\n\\t\\t\\tmin-height: auto;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.avatar {\\r\\n\\t\\t\\twidth: 100px;\\r\\n\\t\\t\\theight: 100px;\\r\\n\\t\\t\\tmargin-bottom: 1rem;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.avatar-icon {\\r\\n\\t\\t\\tfont-size: 3rem;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.connection-status {\\r\\n\\t\\t\\tdisplay: none;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"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"}`
    };
    SILENCE_THRESHOLD = 0.01;
    SILENCE_DURATION = 1e3;
    VoiceChat = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { isOpen = false } = $$props;
      let { onClose } = $$props;
      let isConnected = false;
      let isConnecting = false;
      let isMuted = false;
      let isProcessing = false;
      let audioContext = null;
      let mediaStream = null;
      let webSocket = null;
      let elapsedTime = 0;
      let timerInterval = null;
      let audioProcessor = null;
      let isSpeaking = false;
      let silenceStart = null;
      let conversationMessages = [];
      const CLOUDFLARE_REALTIME_URL = typeof window !== "undefined" ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/realtime` : "ws://localhost:5173/api/realtime";
      onDestroy(() => {
        cleanup();
      });
      async function startVoiceChat() {
        try {
          isConnecting = true;
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          audioContext = new AudioContext({ sampleRate: 16e3 });
          const source = audioContext.createMediaStreamSource(mediaStream);
          webSocket = new WebSocket(CLOUDFLARE_REALTIME_URL);
          console.log("Attempting WebSocket connection to:", CLOUDFLARE_REALTIME_URL);
          webSocket.onopen = () => {
            console.log("Connected to Cloudflare Realtime");
            isConnected = true;
            isConnecting = false;
            startTimer();
            if (webSocket) {
              webSocket.send(JSON.stringify({
                type: "session.update",
                session: {
                  modalities: ["text", "audio"],
                  instructions: "You are a helpful AI assistant in a voice conversation.",
                  voice: "alloy",
                  input_audio_format: "pcm16",
                  output_audio_format: "pcm16",
                  turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500
                  }
                }
              }));
            }
          };
          webSocket.onmessage = async (event) => {
            try {
              const message2 = JSON.parse(event.data);
              console.log("Received message:", message2.type);
              if (message2.type === "session.created") {
                console.log("Session created successfully");
              }
              if (message2.type === "input_audio_buffer.committed") {
                console.log("Audio buffer committed, AI processing...");
                isProcessing = true;
              }
              if (message2.type === "conversation.item.created" && message2.item?.role === "user") {
                const text2 = message2.item.content?.[0]?.text || "";
                if (text2) {
                  conversationMessages = [...conversationMessages, { role: "user", text: text2 }];
                }
              }
              if (message2.type === "response.text.delta" && message2.delta) {
                conversationMessages = [...conversationMessages, { role: "assistant", text: message2.delta }];
              }
              if (message2.type === "response.audio.delta" && message2.delta) {
                await playAudioChunk(message2.delta);
              }
              if (message2.type === "response.audio.done") {
                console.log("AI response complete");
                isProcessing = false;
              }
              if (message2.type === "error") {
                console.error("Cloudflare Realtime error:", message2.error);
                isProcessing = false;
              }
            } catch (error2) {
              console.error("Error processing message:", error2);
            }
          };
          webSocket.onerror = (error2) => {
            console.error("WebSocket error:", error2);
            console.error("WebSocket URL was:", CLOUDFLARE_REALTIME_URL);
            isConnecting = false;
            isConnected = false;
          };
          webSocket.onclose = (event) => {
            console.log("Disconnected from Cloudflare Realtime");
            console.log("Close code:", event.code, "Reason:", event.reason);
            isConnected = false;
            isConnecting = false;
            stopTimer();
            if (event.code === 1006) {
              alert("WebSocket connection failed. This feature requires deployment to Cloudflare Pages to work. WebSockets are not supported in local development.");
            }
          };
          audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);
          source.connect(audioProcessor);
          audioProcessor.connect(audioContext.destination);
          audioProcessor.onaudioprocess = (e3) => {
            if (!isMuted && webSocket && webSocket.readyState === WebSocket.OPEN) {
              const inputData = e3.inputBuffer.getChannelData(0);
              const rms = Math.sqrt(inputData.reduce((sum, val) => sum + val * val, 0) / inputData.length);
              const currentTime = Date.now();
              if (rms > SILENCE_THRESHOLD) {
                if (!isSpeaking) {
                  console.log("Speech detected, starting audio buffer");
                  isSpeaking = true;
                }
                silenceStart = null;
                const pcm16 = convertFloat32ToPCM16(inputData);
                const base64Audio = arrayBufferToBase64(pcm16);
                webSocket.send(JSON.stringify({
                  type: "input_audio_buffer.append",
                  audio: base64Audio
                }));
              } else if (isSpeaking) {
                if (!silenceStart) {
                  silenceStart = currentTime;
                } else if (currentTime - silenceStart > SILENCE_DURATION) {
                  console.log("Silence detected, committing audio buffer");
                  webSocket.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
                  isSpeaking = false;
                  silenceStart = null;
                }
              }
            }
          };
        } catch (error2) {
          console.error("Error starting voice chat:", error2);
          isConnecting = false;
          alert("Failed to access microphone or connect to voice service. Please check your permissions.");
        }
      }
      __name(startVoiceChat, "startVoiceChat");
      async function playAudioChunk(base64Audio) {
        if (!audioContext) return;
        try {
          const binaryString = atob(base64Audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i4 = 0; i4 < binaryString.length; i4++) {
            bytes[i4] = binaryString.charCodeAt(i4);
          }
          const pcm16 = new Int16Array(bytes.buffer);
          const float32 = new Float32Array(pcm16.length);
          for (let i4 = 0; i4 < pcm16.length; i4++) {
            float32[i4] = pcm16[i4] / (pcm16[i4] < 0 ? 32768 : 32767);
          }
          const audioBuffer = audioContext.createBuffer(1, float32.length, audioContext.sampleRate);
          audioBuffer.getChannelData(0).set(float32);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start();
        } catch (error2) {
          console.error("Error playing audio chunk:", error2);
        }
      }
      __name(playAudioChunk, "playAudioChunk");
      function startTimer() {
        elapsedTime = 0;
        timerInterval = window.setInterval(
          () => {
            elapsedTime++;
          },
          1e3
        );
      }
      __name(startTimer, "startTimer");
      function stopTimer() {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        elapsedTime = 0;
      }
      __name(stopTimer, "stopTimer");
      function cleanup() {
        stopTimer();
        if (webSocket) {
          webSocket.close();
          webSocket = null;
        }
        if (audioProcessor) {
          audioProcessor.disconnect();
          audioProcessor = null;
        }
        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
          mediaStream = null;
        }
        if (audioContext) {
          audioContext.close();
          audioContext = null;
        }
        isConnected = false;
        isConnecting = false;
        isMuted = false;
        isProcessing = false;
        isSpeaking = false;
        silenceStart = null;
        conversationMessages = [];
      }
      __name(cleanup, "cleanup");
      if ($$props.isOpen === void 0 && $$bindings.isOpen && isOpen !== void 0) $$bindings.isOpen(isOpen);
      if ($$props.onClose === void 0 && $$bindings.onClose && onClose !== void 0) $$bindings.onClose(onClose);
      $$result.css.add(css$1);
      {
        if (isOpen && !isConnected && !isConnecting) {
          startVoiceChat();
        }
      }
      {
        if (!isOpen) {
          cleanup();
        }
      }
      return `${isOpen ? ` <div class="voice-chat-container mobile svelte-4xvwue" role="dialog" aria-label="Voice chat session"><div class="voice-chat-window mobile-window svelte-4xvwue"><div class="voice-chat-header svelte-4xvwue"><div class="${[
        "status-indicator svelte-4xvwue",
        (isConnected ? "connected" : "") + " " + (isConnecting ? "connecting" : "")
      ].join(" ").trim()}">${escape(isConnecting ? "\u{1F504}" : isConnected ? "\u{1F3A4}" : "\u23F8\uFE0F")}</div> <div class="call-info svelte-4xvwue"><div class="call-title svelte-4xvwue" data-svelte-h="svelte-1jo4iak">AI Voice Assistant</div> <div class="call-status svelte-4xvwue">${isConnecting ? `Connecting...` : `${isConnected ? `${escape(formatTime(elapsedTime))}` : `Disconnected`}`}</div></div></div> <div class="voice-chat-body svelte-4xvwue"><div class="avatar svelte-4xvwue"><div class="${["avatar-pulse svelte-4xvwue", isConnected && !isMuted ? "active" : ""].join(" ").trim()}"></div> <div class="avatar-icon svelte-4xvwue" data-svelte-h="svelte-189i2yi">\u{1F916}</div></div> <div class="connection-status svelte-4xvwue">${isConnecting ? `<p data-svelte-h="svelte-1thjg7l">Establishing connection...</p>` : `${isConnected ? `<p class="${["svelte-4xvwue", isProcessing ? "processing" : ""].join(" ").trim()}">${escape(isProcessing ? "AI is thinking..." : isSpeaking ? "Listening..." : "Ready to listen")}</p>` : `<p data-svelte-h="svelte-1cfn932">Not connected</p>`}`}</div> ${conversationMessages.length > 0 ? `<div class="conversation-display svelte-4xvwue">${each(conversationMessages, (message2) => {
        return `<div class="${"message " + escape(message2.role, true) + " svelte-4xvwue"}"><span class="role-badge svelte-4xvwue">${escape(message2.role === "user" ? "You" : "AI")}</span> <span class="message-text svelte-4xvwue">${escape(message2.text)}</span> </div>`;
      })}</div>` : ``}</div> <div class="voice-chat-controls svelte-4xvwue"><button class="${["control-button mute-button svelte-4xvwue", isMuted ? "active" : ""].join(" ").trim()}" ${!isConnected ? "disabled" : ""}${add_attribute("title", isMuted ? "Unmute" : "Mute", 0)}>${escape(isMuted ? "\u{1F507}" : "\u{1F50A}")}</button> <button class="control-button hangup-button svelte-4xvwue" title="Hang up" data-svelte-h="svelte-177xim3">\u{1F4DE}</button></div></div></div>  <div class="voice-chat-container desktop svelte-4xvwue" role="dialog" aria-label="Voice chat session"><div class="voice-chat-window desktop-window svelte-4xvwue"><div class="voice-chat-header svelte-4xvwue"><div class="${[
        "status-indicator svelte-4xvwue",
        (isConnected ? "connected" : "") + " " + (isConnecting ? "connecting" : "")
      ].join(" ").trim()}">${escape(isConnecting ? "\u{1F504}" : isConnected ? "\u{1F3A4}" : "\u23F8\uFE0F")}</div> <div class="call-info svelte-4xvwue"><div class="call-title svelte-4xvwue" data-svelte-h="svelte-1jo4iak">AI Voice Assistant</div> <div class="call-status svelte-4xvwue">${isConnecting ? `Connecting...` : `${isConnected ? `${escape(formatTime(elapsedTime))}` : `Disconnected`}`}</div></div></div> <div class="voice-chat-body svelte-4xvwue"><div class="avatar svelte-4xvwue"><div class="${["avatar-pulse svelte-4xvwue", isConnected && !isMuted ? "active" : ""].join(" ").trim()}"></div> <div class="avatar-icon svelte-4xvwue" data-svelte-h="svelte-189i2yi">\u{1F916}</div></div></div> <div class="voice-chat-controls svelte-4xvwue"><button class="${["control-button mute-button svelte-4xvwue", isMuted ? "active" : ""].join(" ").trim()}" ${!isConnected ? "disabled" : ""}${add_attribute("title", isMuted ? "Unmute" : "Mute", 0)}>${escape(isMuted ? "\u{1F507}" : "\u{1F50A}")}</button> <button class="control-button hangup-button svelte-4xvwue" title="Hang up" data-svelte-h="svelte-177xim3">\u{1F4DE}</button></div></div></div>` : ``}`;
    });
    css = {
      code: ".app.svelte-3whlfw.svelte-3whlfw{display:flex;flex-direction:column;min-height:100vh}header.svelte-3whlfw.svelte-3whlfw{background-color:var(--surface);padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)}h1.svelte-3whlfw.svelte-3whlfw{font-size:1.5rem;font-weight:600}nav.svelte-3whlfw.svelte-3whlfw{display:flex;gap:1rem;align-items:center}nav.svelte-3whlfw span.svelte-3whlfw{color:var(--text-secondary)}button.svelte-3whlfw.svelte-3whlfw{background-color:var(--primary-color);color:white;border:none;padding:0.5rem 1rem;border-radius:0.25rem;cursor:pointer;font-size:0.875rem;transition:background-color 0.2s, opacity 0.2s}button.svelte-3whlfw.svelte-3whlfw:hover{background-color:var(--primary-color-hover)}.command-palette-button.svelte-3whlfw.svelte-3whlfw{background-color:var(--primary-color);color:white;border:none;padding:0.5rem 0.75rem;font-size:1.25rem;line-height:1;transition:background-color 0.2s, transform 0.2s}.command-palette-button.svelte-3whlfw.svelte-3whlfw:hover{background-color:var(--primary-color-hover);transform:scale(1.05)}.theme-toggle.svelte-3whlfw.svelte-3whlfw{background-color:transparent;border:1px solid var(--border);padding:0.5rem 0.75rem;font-size:1.25rem;line-height:1;transition:background-color 0.2s, border-color 0.2s}.theme-toggle.svelte-3whlfw.svelte-3whlfw:hover{background-color:var(--surface-variant);border-color:var(--primary-color)}main.svelte-3whlfw.svelte-3whlfw{flex:1;padding:2rem;width:100%;max-width:1400px;margin:0 auto}",
      map: `{"version":3,"file":"+layout.svelte","sources":["+layout.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../app.css\\";\\nimport { theme } from \\"$lib/stores/theme\\";\\nimport { voiceChat } from \\"$lib/stores/voiceChat\\";\\nimport CommandPalette from \\"$lib/components/CommandPalette.svelte\\";\\nimport VoiceChat from \\"$lib/components/VoiceChat.svelte\\";\\nimport { onMount } from \\"svelte\\";\\nexport let data;\\nlet currentTheme = \\"auto\\";\\nlet commandPaletteOpen = false;\\nlet voiceChatOpen = false;\\nonMount(() => {\\n  theme.initialize();\\n  const unsubscribeTheme = theme.subscribe((t) => {\\n    currentTheme = t;\\n  });\\n  const unsubscribeVoiceChat = voiceChat.subscribe((isOpen) => {\\n    voiceChatOpen = isOpen;\\n  });\\n  function handleGlobalKeyDown(event) {\\n    if (event.key === \\"Escape\\") {\\n      if (!commandPaletteOpen) {\\n        event.preventDefault();\\n        commandPaletteOpen = true;\\n      }\\n    }\\n  }\\n  window.addEventListener(\\"keydown\\", handleGlobalKeyDown);\\n  return () => {\\n    unsubscribeTheme();\\n    unsubscribeVoiceChat();\\n    window.removeEventListener(\\"keydown\\", handleGlobalKeyDown);\\n  };\\n});\\nfunction toggleTheme() {\\n  if (currentTheme === \\"light\\") {\\n    theme.setTheme(\\"dark\\");\\n  } else if (currentTheme === \\"dark\\") {\\n    theme.setTheme(\\"auto\\");\\n  } else {\\n    theme.setTheme(\\"light\\");\\n  }\\n}\\nfunction getThemeIcon() {\\n  if (currentTheme === \\"light\\") return \\"\\\\u2600\\\\uFE0F\\";\\n  if (currentTheme === \\"dark\\") return \\"\\\\u{1F319}\\";\\n  return \\"\\\\u{1F313}\\";\\n}\\nfunction handleCommandPaletteClose() {\\n  commandPaletteOpen = false;\\n}\\nfunction openCommandPalette() {\\n  commandPaletteOpen = true;\\n}\\nfunction handleVoiceChatClose() {\\n  voiceChat.close();\\n}\\n<\/script>\\r\\n\\r\\n<CommandPalette isOpen={commandPaletteOpen} onClose={handleCommandPaletteClose} />\\r\\n<VoiceChat isOpen={voiceChatOpen} onClose={handleVoiceChatClose} />\\r\\n\\r\\n<div class=\\"app\\">\\r\\n\\t<header>\\r\\n\\t\\t<h1>Dashboard</h1>\\r\\n\\t\\t<nav>\\r\\n\\t\\t\\t<button class=\\"command-palette-button\\" on:click={openCommandPalette} title=\\"Command Palette (ESC)\\">\\r\\n\\t\\t\\t\\t\u2318\\r\\n\\t\\t\\t</button>\\r\\n\\t\\t\\t<button class=\\"theme-toggle\\" on:click={toggleTheme} title=\\"Toggle theme\\">\\r\\n\\t\\t\\t\\t{getThemeIcon()}\\r\\n\\t\\t\\t</button>\\r\\n\\t\\t\\t{#if data.user}\\r\\n\\t\\t\\t\\t<span>Welcome, {data.user.login || data.user.name || 'User'}!</span>\\r\\n\\t\\t\\t\\t<form method=\\"POST\\" action=\\"/auth/signout\\">\\r\\n\\t\\t\\t\\t\\t<button type=\\"submit\\">Sign Out</button>\\r\\n\\t\\t\\t\\t</form>\\r\\n\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t<form method=\\"POST\\" action=\\"/auth/signin/github\\">\\r\\n\\t\\t\\t\\t\\t<button type=\\"submit\\">Sign in with GitHub</button>\\r\\n\\t\\t\\t\\t</form>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t</nav>\\r\\n\\t</header>\\r\\n\\r\\n\\t<main>\\r\\n\\t\\t<slot />\\r\\n\\t</main>\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.app {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tmin-height: 100vh;\\r\\n\\t}\\r\\n\\r\\n\\theader {\\r\\n\\t\\tbackground-color: var(--surface);\\r\\n\\t\\tpadding: 1rem 2rem;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tborder-bottom: 1px solid var(--border);\\r\\n\\t}\\r\\n\\r\\n\\th1 {\\r\\n\\t\\tfont-size: 1.5rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t}\\r\\n\\r\\n\\tnav {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tgap: 1rem;\\r\\n\\t\\talign-items: center;\\r\\n\\t}\\r\\n\\r\\n\\tnav span {\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t}\\r\\n\\r\\n\\tbutton {\\r\\n\\t\\tbackground-color: var(--primary-color);\\r\\n\\t\\tcolor: white;\\r\\n\\t\\tborder: none;\\r\\n\\t\\tpadding: 0.5rem 1rem;\\r\\n\\t\\tborder-radius: 0.25rem;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\ttransition: background-color 0.2s, opacity 0.2s;\\r\\n\\t}\\r\\n\\r\\n\\tbutton:hover {\\r\\n\\t\\tbackground-color: var(--primary-color-hover);\\r\\n\\t}\\r\\n\\r\\n\\t.command-palette-button {\\r\\n\\t\\tbackground-color: var(--primary-color);\\r\\n\\t\\tcolor: white;\\r\\n\\t\\tborder: none;\\r\\n\\t\\tpadding: 0.5rem 0.75rem;\\r\\n\\t\\tfont-size: 1.25rem;\\r\\n\\t\\tline-height: 1;\\r\\n\\t\\ttransition: background-color 0.2s, transform 0.2s;\\r\\n\\t}\\r\\n\\r\\n\\t.command-palette-button:hover {\\r\\n\\t\\tbackground-color: var(--primary-color-hover);\\r\\n\\t\\ttransform: scale(1.05);\\r\\n\\t}\\r\\n\\r\\n\\t.theme-toggle {\\r\\n\\t\\tbackground-color: transparent;\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tpadding: 0.5rem 0.75rem;\\r\\n\\t\\tfont-size: 1.25rem;\\r\\n\\t\\tline-height: 1;\\r\\n\\t\\ttransition: background-color 0.2s, border-color 0.2s;\\r\\n\\t}\\r\\n\\r\\n\\t.theme-toggle:hover {\\r\\n\\t\\tbackground-color: var(--surface-variant);\\r\\n\\t\\tborder-color: var(--primary-color);\\r\\n\\t}\\r\\n\\r\\n\\tmain {\\r\\n\\t\\tflex: 1;\\r\\n\\t\\tpadding: 2rem;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tmax-width: 1400px;\\r\\n\\t\\tmargin: 0 auto;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AA0FC,gCAAK,CACJ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,UAAU,CAAE,KACb,CAEA,kCAAO,CACN,gBAAgB,CAAE,IAAI,SAAS,CAAC,CAChC,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,QAAQ,CACtC,CAEA,8BAAG,CACF,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,GACd,CAEA,+BAAI,CACH,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,IAAI,CACT,WAAW,CAAE,MACd,CAEA,iBAAG,CAAC,kBAAK,CACR,KAAK,CAAE,IAAI,gBAAgB,CAC5B,CAEA,kCAAO,CACN,gBAAgB,CAAE,IAAI,eAAe,CAAC,CACtC,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,MAAM,CAAC,IAAI,CACpB,aAAa,CAAE,OAAO,CACtB,MAAM,CAAE,OAAO,CACf,SAAS,CAAE,QAAQ,CACnB,UAAU,CAAE,gBAAgB,CAAC,IAAI,CAAC,CAAC,OAAO,CAAC,IAC5C,CAEA,kCAAM,MAAO,CACZ,gBAAgB,CAAE,IAAI,qBAAqB,CAC5C,CAEA,mDAAwB,CACvB,gBAAgB,CAAE,IAAI,eAAe,CAAC,CACtC,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,MAAM,CAAC,OAAO,CACvB,SAAS,CAAE,OAAO,CAClB,WAAW,CAAE,CAAC,CACd,UAAU,CAAE,gBAAgB,CAAC,IAAI,CAAC,CAAC,SAAS,CAAC,IAC9C,CAEA,mDAAuB,MAAO,CAC7B,gBAAgB,CAAE,IAAI,qBAAqB,CAAC,CAC5C,SAAS,CAAE,MAAM,IAAI,CACtB,CAEA,yCAAc,CACb,gBAAgB,CAAE,WAAW,CAC7B,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,QAAQ,CAAC,CAC/B,OAAO,CAAE,MAAM,CAAC,OAAO,CACvB,SAAS,CAAE,OAAO,CAClB,WAAW,CAAE,CAAC,CACd,UAAU,CAAE,gBAAgB,CAAC,IAAI,CAAC,CAAC,YAAY,CAAC,IACjD,CAEA,yCAAa,MAAO,CACnB,gBAAgB,CAAE,IAAI,iBAAiB,CAAC,CACxC,YAAY,CAAE,IAAI,eAAe,CAClC,CAEA,gCAAK,CACJ,IAAI,CAAE,CAAC,CACP,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IACX"}`
    };
    Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { data } = $$props;
      let commandPaletteOpen = false;
      let voiceChatOpen = false;
      function getThemeIcon() {
        return "\u{1F313}";
      }
      __name(getThemeIcon, "getThemeIcon");
      function handleCommandPaletteClose() {
        commandPaletteOpen = false;
      }
      __name(handleCommandPaletteClose, "handleCommandPaletteClose");
      function handleVoiceChatClose() {
        voiceChat.close();
      }
      __name(handleVoiceChatClose, "handleVoiceChatClose");
      if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
      $$result.css.add(css);
      return `${validate_component(CommandPalette, "CommandPalette").$$render(
        $$result,
        {
          isOpen: commandPaletteOpen,
          onClose: handleCommandPaletteClose
        },
        {},
        {}
      )} ${validate_component(VoiceChat, "VoiceChat").$$render(
        $$result,
        {
          isOpen: voiceChatOpen,
          onClose: handleVoiceChatClose
        },
        {},
        {}
      )} <div class="app svelte-3whlfw"><header class="svelte-3whlfw"><h1 class="svelte-3whlfw" data-svelte-h="svelte-101alym">Dashboard</h1> <nav class="svelte-3whlfw"><button class="command-palette-button svelte-3whlfw" title="Command Palette (ESC)" data-svelte-h="svelte-1uqgegf">\u2318</button> <button class="theme-toggle svelte-3whlfw" title="Toggle theme">${escape(getThemeIcon())}</button> ${data.user ? `<span class="svelte-3whlfw">Welcome, ${escape(data.user.login || data.user.name || "User")}!</span> <form method="POST" action="/auth/signout" data-svelte-h="svelte-1gvcur4"><button type="submit" class="svelte-3whlfw">Sign Out</button></form>` : `<form method="POST" action="/auth/signin/github" data-svelte-h="svelte-1uicra7"><button type="submit" class="svelte-3whlfw">Sign in with GitHub</button></form>`}</nav></header> <main class="svelte-3whlfw">${slots.default ? slots.default({}) : ``}</main> </div>`;
    });
  }
});
var __exports = {};
__export(__exports, {
  component: /* @__PURE__ */ __name(() => component, "component"),
  fonts: /* @__PURE__ */ __name(() => fonts, "fonts"),
  imports: /* @__PURE__ */ __name(() => imports, "imports"),
  index: /* @__PURE__ */ __name(() => index, "index"),
  server: /* @__PURE__ */ __name(() => layout_server_ts_exports, "server"),
  server_id: /* @__PURE__ */ __name(() => server_id, "server_id"),
  stylesheets: /* @__PURE__ */ __name(() => stylesheets, "stylesheets")
});
var index;
var component_cache;
var component;
var server_id;
var imports;
var stylesheets;
var fonts;
var init__ = __esm({
  ".svelte-kit/output/server/nodes/0.js"() {
    init_layout_server_ts();
    index = 0;
    component = /* @__PURE__ */ __name(async () => component_cache ??= (await Promise.resolve().then(() => (init_layout_svelte(), layout_svelte_exports))).default, "component");
    server_id = "src/routes/+layout.server.ts";
    imports = ["_app/immutable/nodes/0.CNwZ5BR6.js", "_app/immutable/chunks/qwSh76ll.js", "_app/immutable/chunks/IHki7fMi.js", "_app/immutable/chunks/Cy1WYuK-.js", "_app/immutable/chunks/DLCh3GBu.js"];
    stylesheets = ["_app/immutable/assets/0.BGpeHqre.css"];
    fonts = [];
  }
});
var is_legacy;
var init_state_svelte = __esm({
  ".svelte-kit/output/server/chunks/state.svelte.js"() {
    init_ssr2();
    init_server();
    is_legacy = onMount.toString().includes("$$") || /function \w+\(\) \{\}/.test(onMount.toString());
    if (is_legacy) {
      ({
        data: {},
        form: null,
        error: null,
        params: {},
        route: { id: null },
        state: {},
        status: -1,
        url: new URL("https://example.com")
      });
    }
  }
});
var error_svelte_exports = {};
__export(error_svelte_exports, {
  default: /* @__PURE__ */ __name(() => Error$1, "default")
});
var getStores;
var page;
var Error$1;
var init_error_svelte = __esm({
  ".svelte-kit/output/server/entries/fallbacks/error.svelte.js"() {
    init_ssr();
    init_internal();
    init_exports2();
    init_utils2();
    init_server();
    init_state_svelte();
    getStores = /* @__PURE__ */ __name(() => {
      const stores = getContext("__svelte__");
      return {
        /** @type {typeof page} */
        page: {
          subscribe: stores.page.subscribe
        },
        /** @type {typeof navigating} */
        navigating: {
          subscribe: stores.navigating.subscribe
        },
        /** @type {typeof updated} */
        updated: stores.updated
      };
    }, "getStores");
    page = {
      subscribe(fn) {
        const store = getStores().page;
        return store.subscribe(fn);
      }
    };
    Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $page, $$unsubscribe_page;
      $$unsubscribe_page = subscribe(page, (value) => $page = value);
      $$unsubscribe_page();
      return `<h1>${escape($page.status)}</h1> <p>${escape($page.error?.message)}</p>`;
    });
  }
});
var __exports2 = {};
__export(__exports2, {
  component: /* @__PURE__ */ __name(() => component2, "component"),
  fonts: /* @__PURE__ */ __name(() => fonts2, "fonts"),
  imports: /* @__PURE__ */ __name(() => imports2, "imports"),
  index: /* @__PURE__ */ __name(() => index2, "index"),
  stylesheets: /* @__PURE__ */ __name(() => stylesheets2, "stylesheets")
});
var index2;
var component_cache2;
var component2;
var imports2;
var stylesheets2;
var fonts2;
var init__2 = __esm({
  ".svelte-kit/output/server/nodes/1.js"() {
    index2 = 1;
    component2 = /* @__PURE__ */ __name(async () => component_cache2 ??= (await Promise.resolve().then(() => (init_error_svelte(), error_svelte_exports))).default, "component2");
    imports2 = ["_app/immutable/nodes/1.BMlnRFKL.js", "_app/immutable/chunks/qwSh76ll.js", "_app/immutable/chunks/IHki7fMi.js", "_app/immutable/chunks/DvXU5mgi.js", "_app/immutable/chunks/Q07G5V9A.js", "_app/immutable/chunks/DLCh3GBu.js"];
    stylesheets2 = [];
    fonts2 = [];
  }
});
var page_server_ts_exports = {};
__export(page_server_ts_exports, {
  load: /* @__PURE__ */ __name(() => load2, "load")
});
var load2;
var init_page_server_ts = __esm({
  ".svelte-kit/output/server/entries/pages/_page.server.ts.js"() {
    load2 = /* @__PURE__ */ __name(async ({ locals, fetch: fetch2 }) => {
      const session2 = await locals.getSession();
      console.log("[DEBUG] Session exists:", !!session2);
      console.log("[DEBUG] User exists:", !!session2?.user);
      console.log("[DEBUG] User login:", session2?.user?.login);
      if (!session2?.user) {
        console.log("[DEBUG] No user in session, returning empty");
        return {
          user: null,
          githubProjects: [],
          organizationProjects: [],
          allGithubProjects: []
        };
      }
      try {
        const accessToken = session2.accessToken;
        console.log("[DEBUG] Access token exists:", !!accessToken);
        console.log("[DEBUG] Access token length:", accessToken?.length);
        if (!accessToken) {
          console.error("[ERROR] No access token in session!");
          return {
            user: session2.user,
            githubProjects: [],
            organizationProjects: [],
            allGithubProjects: []
          };
        }
        const headers2 = {
          Accept: "application/vnd.github.v3+json",
          Authorization: `token ${accessToken}`,
          "User-Agent": "Dashboard-App"
        };
        const orgsResponse = await fetch2("https://api.github.com/user/orgs", { headers: headers2 });
        let organizationProjects = [];
        if (orgsResponse.ok) {
          const organizations = await orgsResponse.json();
          const orgProjectsPromises = organizations.map(async (org) => {
            try {
              const reposResponse = await fetch2(
                `https://api.github.com/orgs/${org.login}/repos?sort=updated&per_page=20`,
                { headers: headers2 }
              );
              if (reposResponse.ok) {
                const repositories = await reposResponse.json();
                return {
                  organization: org,
                  repositories
                };
              }
            } catch (error2) {
              console.error(`Failed to fetch repos for org ${org.login}:`, error2);
            }
            return {
              organization: org,
              repositories: []
            };
          });
          organizationProjects = await Promise.all(orgProjectsPromises);
        }
        const userReposResponse = await fetch2("https://api.github.com/user/repos?sort=updated&per_page=10", {
          headers: headers2
        });
        let githubProjects = [];
        if (userReposResponse.ok) {
          githubProjects = await userReposResponse.json();
        }
        const allGithubProjects = [];
        const projectsQuery = `
			query {
				viewer {
					projectsV2(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
						nodes {
							id
							number
							title
							url
							shortDescription
							public
							closed
							updatedAt
							owner {
								... on User {
									login
									avatarUrl
								}
								... on Organization {
									login
									avatarUrl
								}
							}
						}
					}
					organizations(first: 50) {
						nodes {
							login
							projectsV2(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
								nodes {
									id
									number
									title
									url
									shortDescription
									public
									closed
									updatedAt
									owner {
										... on Organization {
											login
											avatarUrl
										}
									}
								}
							}
						}
					}
				}
			}
		`;
        try {
          console.log("[DEBUG] Fetching GitHub Projects via GraphQL...");
          const graphqlResponse = await fetch2("https://api.github.com/graphql", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "User-Agent": "Dashboard-App"
            },
            body: JSON.stringify({ query: projectsQuery })
          });
          console.log("[DEBUG] GraphQL Response Status:", graphqlResponse.status);
          console.log("[DEBUG] GraphQL Response OK:", graphqlResponse.ok);
          if (graphqlResponse.ok) {
            const result = await graphqlResponse.json();
            console.log("[DEBUG] GraphQL Response:", JSON.stringify(result, null, 2));
            if (result.errors) {
              console.error("GraphQL Errors:", result.errors);
            }
            if (result.data?.viewer?.projectsV2?.nodes) {
              const userProjects = result.data.viewer.projectsV2.nodes.map((project) => ({
                id: project.id,
                number: project.number,
                title: project.title,
                url: project.url,
                shortDescription: project.shortDescription,
                public: project.public,
                closed: project.closed,
                ownerType: "User",
                ownerLogin: project.owner?.login || "Unknown",
                ownerAvatarUrl: project.owner?.avatarUrl,
                updatedAt: project.updatedAt
              }));
              console.log("User Projects:", userProjects);
              allGithubProjects.push(...userProjects);
            }
            if (result.data?.viewer?.organizations?.nodes) {
              for (const org of result.data.viewer.organizations.nodes) {
                if (org.projectsV2?.nodes) {
                  const orgProjects = org.projectsV2.nodes.map((project) => ({
                    id: project.id,
                    number: project.number,
                    title: project.title,
                    url: project.url,
                    shortDescription: project.shortDescription,
                    public: project.public,
                    closed: project.closed,
                    ownerType: "Organization",
                    ownerLogin: project.owner?.login || org.login,
                    ownerAvatarUrl: project.owner?.avatarUrl,
                    updatedAt: project.updatedAt
                  }));
                  console.log(`Org (${org.login}) Projects:`, orgProjects);
                  allGithubProjects.push(...orgProjects);
                }
              }
            }
            console.log("[DEBUG] Total GitHub Projects found:", allGithubProjects.length);
          } else {
            const errorText = await graphqlResponse.text();
            console.error("[ERROR] GraphQL Response not OK:", graphqlResponse.status, errorText);
          }
        } catch (error2) {
          console.error("[ERROR] Failed to fetch GitHub Projects:", error2);
          if (error2 instanceof Error) {
            console.error("[ERROR] Error message:", error2.message);
            console.error("[ERROR] Error stack:", error2.stack);
          }
        }
        return {
          user: session2.user,
          githubProjects,
          organizationProjects,
          allGithubProjects
        };
      } catch (error2) {
        console.error("Failed to fetch GitHub data:", error2);
      }
      return {
        user: session2?.user || null,
        githubProjects: [],
        organizationProjects: [],
        allGithubProjects: []
      };
    }, "load2");
  }
});
var page_svelte_exports = {};
__export(page_svelte_exports, {
  default: /* @__PURE__ */ __name(() => Page, "default")
});
function generateTemperaturePath(hourly) {
  if (hourly.length === 0) return "";
  const width = 320;
  const height = 80;
  const padding2 = 0;
  const temps = hourly.map((h3) => h3.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp - minTemp || 10;
  const points = hourly.map((hour2, index4) => {
    const x3 = padding2 + index4 / (hourly.length - 1) * (width - 2 * padding2);
    const normalizedTemp = (hour2.temperature - minTemp) / tempRange;
    const y2 = height - padding2 - normalizedTemp * (height - 2 * padding2);
    return `${x3},${y2}`;
  });
  return `M ${points.join(" L ")}`;
}
__name(generateTemperaturePath, "generateTemperaturePath");
function calculateEarthColor(hour2, weatherCondition) {
  const hoursFromNoon = Math.abs(12 - hour2);
  const dayBrightness = 1 - hoursFromNoon / 12;
  let baseColor1, baseColor2, baseColor3, baseColor4;
  if (dayBrightness > 0.8) {
    baseColor1 = { r: 245, g: 240, b: 235 };
    baseColor2 = { r: 230, g: 220, b: 210 };
    baseColor3 = { r: 215, g: 205, b: 195 };
    baseColor4 = { r: 200, g: 190, b: 180 };
  } else if (dayBrightness > 0.6) {
    baseColor1 = { r: 212, g: 180, b: 140 };
    baseColor2 = { r: 195, g: 165, b: 125 };
    baseColor3 = { r: 180, g: 150, b: 115 };
    baseColor4 = { r: 165, g: 140, b: 105 };
  } else if (dayBrightness > 0.4) {
    baseColor1 = { r: 150, g: 120, b: 100 };
    baseColor2 = { r: 130, g: 105, b: 90 };
    baseColor3 = { r: 115, g: 95, b: 80 };
    baseColor4 = { r: 100, g: 85, b: 70 };
  } else if (dayBrightness > 0.2) {
    baseColor1 = { r: 90, g: 75, b: 85 };
    baseColor2 = { r: 75, g: 65, b: 75 };
    baseColor3 = { r: 65, g: 55, b: 65 };
    baseColor4 = { r: 55, g: 48, b: 58 };
  } else {
    baseColor1 = { r: 45, g: 40, b: 55 };
    baseColor2 = { r: 38, g: 35, b: 48 };
    baseColor3 = { r: 32, g: 30, b: 42 };
    baseColor4 = { r: 25, g: 23, b: 35 };
  }
  if (weatherCondition.includes("cloud") || weatherCondition === "partly-cloudy") {
    const grayFactor = 0.7;
    baseColor1 = mixWithGray(baseColor1, grayFactor);
    baseColor2 = mixWithGray(baseColor2, grayFactor);
    baseColor3 = mixWithGray(baseColor3, grayFactor);
    baseColor4 = mixWithGray(baseColor4, grayFactor);
  } else if (weatherCondition.includes("rain")) {
    const blueTint = { r: 0, g: 20, b: 40 };
    baseColor1 = mixColors(baseColor1, blueTint, 0.3);
    baseColor2 = mixColors(baseColor2, blueTint, 0.35);
    baseColor3 = mixColors(baseColor3, blueTint, 0.4);
    baseColor4 = mixColors(baseColor4, blueTint, 0.45);
    const grayFactor = 0.6;
    baseColor1 = mixWithGray(baseColor1, grayFactor);
    baseColor2 = mixWithGray(baseColor2, grayFactor);
    baseColor3 = mixWithGray(baseColor3, grayFactor);
    baseColor4 = mixWithGray(baseColor4, grayFactor);
  }
  const gradient = `linear-gradient(135deg, 
			rgba(${baseColor1.r}, ${baseColor1.g}, ${baseColor1.b}, 0.95) 0%,
			rgba(${baseColor2.r}, ${baseColor2.g}, ${baseColor2.b}, 0.95) 30%,
			rgba(${baseColor3.r}, ${baseColor3.g}, ${baseColor3.b}, 0.95) 60%,
			rgba(${baseColor4.r}, ${baseColor4.g}, ${baseColor4.b}, 0.95) 100%
		)`;
  const avgBrightness = (baseColor1.r + baseColor1.g + baseColor1.b + baseColor2.r + baseColor2.g + baseColor2.b) / 6;
  const textColor2 = avgBrightness > 160 ? "rgba(40, 40, 40, 0.95)" : "rgba(255, 255, 255, 0.95)";
  return { gradient, textColor: textColor2 };
}
__name(calculateEarthColor, "calculateEarthColor");
function mixWithGray(color, factor) {
  const avg = (color.r + color.g + color.b) / 3;
  return {
    r: Math.round(color.r * (1 - factor) + avg * factor),
    g: Math.round(color.g * (1 - factor) + avg * factor),
    b: Math.round(color.b * (1 - factor) + avg * factor)
  };
}
__name(mixWithGray, "mixWithGray");
function mixColors(color1, color2, ratio) {
  return {
    r: Math.round(color1.r * (1 - ratio) + color2.r * ratio),
    g: Math.round(color1.g * (1 - ratio) + color2.g * ratio),
    b: Math.round(color1.b * (1 - ratio) + color2.b * ratio)
  };
}
__name(mixColors, "mixColors");
function calculateMoonPhase(date) {
  const knownNewMoon = /* @__PURE__ */ (/* @__PURE__ */ new Date("2000-01-06T18:14:00Z")).getTime();
  const lunarCycle = 29.53058770576;
  const currentTime2 = date.getTime();
  const daysSinceNewMoon = (currentTime2 - knownNewMoon) / (1e3 * 60 * 60 * 24);
  const phase = daysSinceNewMoon % lunarCycle / lunarCycle;
  return phase;
}
__name(calculateMoonPhase, "calculateMoonPhase");
function loadWidgets() {
  if (typeof window === "undefined") {
    return defaultWidgets;
  }
  try {
    const stored = localStorage.getItem(WIDGETS_STORAGE_KEY);
    if (stored) {
      const parsedWidgets = JSON.parse(stored);
      if (Array.isArray(parsedWidgets) && parsedWidgets.every((w3) => w3.id && w3.type && typeof w3.section === "number" && typeof w3.order === "number" && w3.size)) {
        return parsedWidgets;
      }
    }
  } catch (error2) {
    console.warn("Failed to load widgets from localStorage:", error2);
  }
  return defaultWidgets;
}
__name(loadWidgets, "loadWidgets");
function loadSections() {
  if (typeof window === "undefined") {
    return defaultSections;
  }
  try {
    const stored = localStorage.getItem(SECTIONS_STORAGE_KEY);
    if (stored) {
      const parsedSections = JSON.parse(stored);
      if (Array.isArray(parsedSections)) {
        return parsedSections.map((s5) => ({
          id: s5.id,
          gridColumn: s5.gridColumn ?? 1,
          gridColumnSpan: s5.gridColumnSpan ?? 1,
          // Default to 1 if undefined
          gridRow: s5.gridRow ?? 1,
          title: s5.title
        }));
      }
    }
  } catch (error2) {
    console.warn("Failed to load sections from localStorage:", error2);
  }
  return defaultSections;
}
__name(loadSections, "loadSections");
function saveWidgets(widgets2) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets2));
  } catch (error2) {
    console.warn("Failed to save widgets to localStorage:", error2);
  }
}
__name(saveWidgets, "saveWidgets");
function saveSections(sections2) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(sections2));
  } catch (error2) {
    console.warn("Failed to save sections to localStorage:", error2);
  }
}
__name(saveSections, "saveSections");
function calculateSectionRows(sections2) {
  const sorted = [...sections2].sort((a3, b2) => {
    if (a3.gridColumn !== b2.gridColumn) return a3.gridColumn - b2.gridColumn;
    return a3.gridRow - b2.gridRow;
  });
  const grid = Array(20).fill(null).map(() => Array(3).fill(false));
  return sorted.map((section) => {
    let row = 1;
    let found = false;
    while (!found && row < 20) {
      const canPlace = Array(section.gridColumnSpan).fill(0).every((_3, i4) => {
        const col = section.gridColumn - 1 + i4;
        return col < 3 && !grid[row - 1][col];
      });
      if (canPlace) {
        for (let i4 = 0; i4 < section.gridColumnSpan; i4++) {
          grid[row - 1][section.gridColumn - 1 + i4] = true;
        }
        found = true;
      } else {
        row++;
      }
    }
    return { ...section, gridRow: row };
  });
}
__name(calculateSectionRows, "calculateSectionRows");
function reorderWidgets(widgets2, fromSection, fromOrder, toSection, toOrder) {
  const movedWidget = widgets2.find((w3) => w3.section === fromSection && w3.order === fromOrder);
  if (!movedWidget) return widgets2;
  return widgets2.map((widget) => {
    if (widget.id === movedWidget.id) {
      return { ...widget, section: toSection, order: toOrder };
    }
    if (widget.section === fromSection && widget.order > fromOrder) {
      return { ...widget, order: widget.order - 1 };
    }
    if (widget.section === toSection && widget.order >= toOrder && widget.id !== movedWidget.id) {
      return { ...widget, order: widget.order + 1 };
    }
    return widget;
  });
}
__name(reorderWidgets, "reorderWidgets");
function createWidgetStore() {
  const initialWidgets = loadWidgets();
  const { subscribe: subscribe2, set, update } = writable(initialWidgets);
  return {
    subscribe: subscribe2,
    moveWidget: /* @__PURE__ */ __name((widgetId, toSection, toOrder) => {
      update((widgets2) => {
        const widget = widgets2.find((w3) => w3.id === widgetId);
        if (!widget) return widgets2;
        const updatedWidgets = reorderWidgets(widgets2, widget.section, widget.order, toSection, toOrder);
        saveWidgets(updatedWidgets);
        return updatedWidgets;
      });
    }, "moveWidget"),
    addWidget: /* @__PURE__ */ __name((widget) => {
      update((widgets2) => {
        const sectionWidgets = widgets2.filter((w3) => w3.section === widget.section);
        const maxOrder = sectionWidgets.length > 0 ? Math.max(...sectionWidgets.map((w3) => w3.order)) : -1;
        const newWidget = {
          ...widget,
          order: maxOrder + 1
        };
        const updatedWidgets = [...widgets2, newWidget];
        saveWidgets(updatedWidgets);
        return updatedWidgets;
      });
    }, "addWidget"),
    removeWidget: /* @__PURE__ */ __name((id) => {
      update((widgets2) => {
        const widgetToRemove = widgets2.find((w3) => w3.id === id);
        if (!widgetToRemove) return widgets2;
        const updatedWidgets = widgets2.filter((widget) => widget.id !== id).map((widget) => {
          if (widget.section === widgetToRemove.section && widget.order > widgetToRemove.order) {
            return { ...widget, order: widget.order - 1 };
          }
          return widget;
        });
        saveWidgets(updatedWidgets);
        return updatedWidgets;
      });
    }, "removeWidget"),
    toggleCollapse: /* @__PURE__ */ __name((id) => {
      update((widgets2) => {
        const updatedWidgets = widgets2.map(
          (widget) => widget.id === id ? { ...widget, collapsed: !widget.collapsed } : widget
        );
        saveWidgets(updatedWidgets);
        return updatedWidgets;
      });
    }, "toggleCollapse"),
    updateTitle: /* @__PURE__ */ __name((id, title) => {
      update((widgets2) => {
        const updatedWidgets = widgets2.map(
          (widget) => widget.id === id ? { ...widget, title } : widget
        );
        saveWidgets(updatedWidgets);
        return updatedWidgets;
      });
    }, "updateTitle"),
    reset: /* @__PURE__ */ __name(() => {
      set(defaultWidgets);
      saveWidgets(defaultWidgets);
    }, "reset"),
    load: /* @__PURE__ */ __name(() => {
      const loadedWidgets = loadWidgets();
      set(loadedWidgets);
    }, "load")
  };
}
__name(createWidgetStore, "createWidgetStore");
function createSectionStore() {
  const initialSections = loadSections();
  const { subscribe: subscribe2, set, update } = writable(initialSections);
  return {
    subscribe: subscribe2,
    updateSectionGrid: /* @__PURE__ */ __name((sectionId, gridColumn, gridColumnSpan) => {
      update((sections2) => {
        const updatedSections = sections2.map(
          (section) => section.id === sectionId ? { ...section, gridColumn, gridColumnSpan } : section
        );
        const recalculatedSections = calculateSectionRows(updatedSections);
        saveSections(recalculatedSections);
        return recalculatedSections;
      });
    }, "updateSectionGrid"),
    moveSection: /* @__PURE__ */ __name((sectionId, newColumn) => {
      update((sections2) => {
        const updatedSections = sections2.map(
          (section) => section.id === sectionId ? { ...section, gridColumn: newColumn } : section
        );
        const recalculatedSections = calculateSectionRows(updatedSections);
        saveSections(recalculatedSections);
        return recalculatedSections;
      });
    }, "moveSection"),
    resizeSection: /* @__PURE__ */ __name((sectionId, newSpan) => {
      update((sections2) => {
        const section = sections2.find((s5) => s5.id === sectionId);
        if (!section) return sections2;
        const maxSpan = 3 - section.gridColumn + 1;
        const clampedSpan = Math.max(1, Math.min(newSpan, maxSpan));
        const updatedSections = sections2.map(
          (s5) => s5.id === sectionId ? { ...s5, gridColumnSpan: clampedSpan } : s5
        );
        const recalculatedSections = calculateSectionRows(updatedSections);
        saveSections(recalculatedSections);
        return recalculatedSections;
      });
    }, "resizeSection"),
    addSection: /* @__PURE__ */ __name(() => {
      update((sections2) => {
        const newSectionId = Math.max(...sections2.map((s5) => s5.id), -1) + 1;
        const updatedSections = [
          ...sections2,
          { id: newSectionId, gridColumn: 1, gridColumnSpan: 1, gridRow: 1 }
        ];
        const recalculatedSections = calculateSectionRows(updatedSections);
        saveSections(recalculatedSections);
        return recalculatedSections;
      });
    }, "addSection"),
    removeSection: /* @__PURE__ */ __name((sectionId) => {
      update((sections2) => {
        if (sections2.length <= 1) return sections2;
        const updatedSections = sections2.filter((section) => section.id !== sectionId);
        const recalculatedSections = calculateSectionRows(updatedSections);
        saveSections(recalculatedSections);
        return recalculatedSections;
      });
    }, "removeSection"),
    reset: /* @__PURE__ */ __name(() => {
      set(defaultSections);
      saveSections(defaultSections);
    }, "reset"),
    load: /* @__PURE__ */ __name(() => {
      const loadedSections = loadSections();
      set(loadedSections);
    }, "load")
  };
}
__name(createSectionStore, "createSectionStore");
function getDaysInMonth(year2, month) {
  return new Date(year2, month + 1, 0).getDate();
}
__name(getDaysInMonth, "getDaysInMonth");
function getFirstDayOfMonth(year2, month) {
  return new Date(year2, month, 1).getDay();
}
__name(getFirstDayOfMonth, "getFirstDayOfMonth");
function formatDate(dateString) {
  const date = new Date(dateString);
  const now2 = /* @__PURE__ */ new Date();
  const diffMs = now2.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
}
__name(formatDate, "formatDate");
var css$8;
var WeatherWidget;
var css$7;
var TrafficWidget;
var WIDGETS_STORAGE_KEY;
var SECTIONS_STORAGE_KEY;
var defaultSections;
var defaultWidgets;
var widgets;
var sections;
var css$6;
var CalendarWidget;
var css$5;
var GithubWidget;
var css$4;
var OrganizationProjectsWidget;
var css$3;
var GithubProjectsWidget;
var css$22;
var Widget;
var css$12;
var ColumnLayout;
var css2;
var Page;
var init_page_svelte = __esm({
  ".svelte-kit/output/server/entries/pages/_page.svelte.js"() {
    init_ssr();
    init_internal();
    init_exports2();
    init_utils2();
    init_server();
    init_state_svelte();
    init_theme();
    init_chunks();
    css$8 = {
      code: `.weather-widget.svelte-dc2hjj.svelte-dc2hjj{display:flex;flex-direction:column;align-items:center;gap:1.5rem;padding:2rem;min-height:400px;position:relative}.celestial-container.svelte-dc2hjj.svelte-dc2hjj{position:relative;width:var(--earth-size, 320px);height:var(--earth-size, 320px);flex-shrink:0;padding:40px;box-sizing:content-box;opacity:0;transition:opacity 0.8s ease-in-out}.celestial-container.loaded.svelte-dc2hjj.svelte-dc2hjj{opacity:1}.earth.svelte-dc2hjj.svelte-dc2hjj{position:relative;width:var(--earth-size, 320px);height:var(--earth-size, 320px);border-radius:50%;box-shadow:0 8px 32px var(--shadow);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:background 1s ease, color 1s ease;overflow:hidden;flex-shrink:0;aspect-ratio:1 / 1}.sun.svelte-dc2hjj.svelte-dc2hjj,.moon.svelte-dc2hjj.svelte-dc2hjj{position:absolute;width:calc(var(--earth-size, 320px) * 0.1875);height:calc(var(--earth-size, 320px) * 0.1875);border-radius:50%;transition:all 0.3s ease;z-index:0}.sun.svelte-dc2hjj.svelte-dc2hjj{transform:translate(-50%, -50%);background:radial-gradient(circle, #ff9d5c 0%, #e8754a 100%);box-shadow:0 0 30px rgba(255, 157, 92, 0.6)}.moon.svelte-dc2hjj.svelte-dc2hjj{background:radial-gradient(circle, #f5e6d3 0%, #d4c5b0 100%);box-shadow:0 0 20px rgba(245, 230, 211, 0.4);overflow:hidden}.moon-surface.svelte-dc2hjj.svelte-dc2hjj{position:absolute;top:0;left:0;width:100%;height:100%;border-radius:50%;background:radial-gradient(circle, #f5e6d3 0%, #d4c5b0 100%);z-index:1}.moon-shadow.svelte-dc2hjj.svelte-dc2hjj{position:absolute;top:0;left:0;width:100%;height:100%;border-radius:50%;background:radial-gradient(circle, rgba(20, 15, 25, 0.95) 0%, rgba(40, 35, 45, 0.9) 100%);z-index:2;transition:transform 0.3s ease, opacity 0.3s ease}.moon-crescent.svelte-dc2hjj.svelte-dc2hjj{position:absolute;top:5px;right:8px;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle, rgba(180, 150, 130, 0.3) 0%, rgba(140, 120, 100, 0.5) 100%);box-shadow:inset -4px -2px 8px rgba(0, 0, 0, 0.2);z-index:3}.unit-switch-container.svelte-dc2hjj.svelte-dc2hjj{position:absolute;top:0;right:0;display:flex;background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;box-shadow:0 2px 8px var(--shadow)}.unit-option.svelte-dc2hjj.svelte-dc2hjj{padding:0.4rem 0.8rem;font-size:0.875rem;font-weight:600;color:var(--text-secondary);background:transparent;border:none;cursor:pointer;transition:all 0.2s ease;min-width:40px}.unit-option.svelte-dc2hjj.svelte-dc2hjj:hover{background:var(--surface-variant)}.unit-option.active.svelte-dc2hjj.svelte-dc2hjj{background:var(--primary-color);color:white}.time.svelte-dc2hjj.svelte-dc2hjj{position:relative;z-index:3;font-size:1.75rem;font-weight:300;color:var(--text-color, var(--text-primary));letter-spacing:0.5px;text-shadow:0 2px 4px var(--shadow);font-variant-numeric:tabular-nums}.date.svelte-dc2hjj.svelte-dc2hjj{position:relative;z-index:3;font-size:0.75rem;color:var(--text-color, var(--text-secondary));opacity:0.7;margin-top:0.25rem;text-shadow:0 1px 2px var(--shadow)}.location.svelte-dc2hjj.svelte-dc2hjj{position:relative;z-index:3;font-size:1rem;color:var(--text-color, var(--text-primary));opacity:0.8;margin-top:0.5rem;text-shadow:0 1px 2px var(--shadow)}.time-date-section.svelte-dc2hjj.svelte-dc2hjj{position:absolute;top:0.9rem;left:50%;transform:translateX(-50%);z-index:3;text-align:center;width:100%}.temperature.svelte-dc2hjj.svelte-dc2hjj{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);z-index:2;font-size:5rem;font-weight:600;color:var(--text-color, var(--text-primary));line-height:1;text-shadow:0 2px 4px var(--shadow),\r
			0 4px 8px var(--shadow),\r
			0 0 20px var(--shadow);display:flex;align-items:flex-start;justify-content:center}.degree-symbol.svelte-dc2hjj.svelte-dc2hjj{font-size:2.5rem;margin-left:0.25rem;margin-top:0.5rem}.humidity-center.svelte-dc2hjj.svelte-dc2hjj{position:absolute;top:50%;left:50%;transform:translateX(-50%);margin-top:3rem;z-index:2;font-size:1.5rem;font-weight:300;color:var(--text-color, var(--text-primary));text-shadow:0 2px 4px var(--shadow);display:flex;align-items:center;gap:0.3rem}.humidity-value.svelte-dc2hjj.svelte-dc2hjj{font-weight:600;font-size:1.5rem}.humidity-symbols.svelte-dc2hjj.svelte-dc2hjj{display:grid;grid-template-columns:auto auto;grid-template-rows:auto auto;gap:0.1rem;font-size:0.7rem;opacity:0.8;align-items:center;justify-items:center}.symbol-phi.svelte-dc2hjj.svelte-dc2hjj{grid-column:1 / 3;grid-row:1;font-size:0.7rem}.symbol-percent.svelte-dc2hjj.svelte-dc2hjj{grid-column:1;grid-row:2;font-size:0.7rem}.symbol-drop.svelte-dc2hjj.svelte-dc2hjj{grid-column:2;grid-row:2;font-size:0.7rem}.temp-graph-svg.svelte-dc2hjj.svelte-dc2hjj{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);z-index:1;opacity:0.7}.humidity.svelte-dc2hjj.svelte-dc2hjj{position:absolute;bottom:0;left:0;width:100%;height:60px;z-index:0}.humidity-wave.svelte-dc2hjj.svelte-dc2hjj{position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(180deg, \r
			rgba(100, 150, 200, 0.3) 0%,\r
			rgba(80, 130, 180, 0.4) 50%,\r
			rgba(60, 110, 160, 0.5) 100%\r
		);border-radius:0 0 160px 160px;clip-path:ellipse(160px 40px at 50% 100%)}.time-test-slider.svelte-dc2hjj.svelte-dc2hjj{width:100%;max-width:320px;padding:1rem;background:var(--surface-variant);border-radius:12px;border:1px solid var(--border);display:flex;flex-direction:column;gap:0.5rem;position:relative}.close-time-test.svelte-dc2hjj.svelte-dc2hjj{position:absolute;top:0.5rem;right:0.5rem;color:var(--text-secondary);cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:4px;text-decoration:none}.close-time-test.svelte-dc2hjj.svelte-dc2hjj:hover{color:var(--text-primary);background:var(--surface-container-high)}.time-test-info.svelte-dc2hjj.svelte-dc2hjj{padding:0.625rem 0.75rem;background:color-mix(in srgb, var(--primary-color) 10%, transparent);border:1px solid color-mix(in srgb, var(--primary-color) 20%, transparent);border-radius:6px;color:var(--primary-color);font-size:0.75rem;text-align:center;margin-top:0.25rem}.time-test-slider.svelte-dc2hjj label.svelte-dc2hjj{color:var(--text-primary);font-size:0.875rem;font-weight:500;text-align:center}.time-test-slider.svelte-dc2hjj input[type="range"].svelte-dc2hjj{width:100%;height:6px;background:var(--surface-container-high);border-radius:3px;outline:none;appearance:none;-webkit-appearance:none}.time-test-slider.svelte-dc2hjj input[type="range"].svelte-dc2hjj::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;background:var(--text-primary);border-radius:50%;cursor:pointer;box-shadow:0 2px 4px var(--shadow)}.time-test-slider.svelte-dc2hjj input[type="range"].svelte-dc2hjj::-moz-range-thumb{width:18px;height:18px;background:var(--text-primary);border-radius:50%;cursor:pointer;border:none;box-shadow:0 2px 4px var(--shadow)}.slider-labels.svelte-dc2hjj.svelte-dc2hjj{display:flex;justify-content:space-between;color:var(--text-secondary);font-size:0.75rem}.time-test-link-container.svelte-dc2hjj.svelte-dc2hjj{width:100%;max-width:320px;display:flex;justify-content:center;margin-top:0.5rem}.time-test-link.svelte-dc2hjj.svelte-dc2hjj{font-size:0.8125rem;color:var(--text-secondary);text-decoration:none;padding:0.5rem 1rem;border-radius:6px;transition:all 0.2s ease}.time-test-link.svelte-dc2hjj.svelte-dc2hjj:hover{color:var(--text-primary);background:var(--surface-variant)}.no-location-message.svelte-dc2hjj.svelte-dc2hjj{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;min-height:400px;width:100%}.no-location-message.svelte-dc2hjj p.svelte-dc2hjj{font-size:1.125rem;color:var(--text-secondary);text-align:center;margin:0}.share-location-button.svelte-dc2hjj.svelte-dc2hjj{padding:0.75rem 1.5rem;font-size:0.9375rem;font-weight:600;background:color-mix(in srgb, var(--primary-color) 20%, transparent);border:1px solid color-mix(in srgb, var(--primary-color) 40%, transparent);border-radius:8px;color:var(--primary-color);cursor:pointer;transition:all 0.2s ease}.share-location-button.svelte-dc2hjj.svelte-dc2hjj:hover{background:color-mix(in srgb, var(--primary-color) 30%, transparent);border-color:color-mix(in srgb, var(--primary-color) 60%, transparent);transform:translateY(-1px)}.share-location-button.svelte-dc2hjj.svelte-dc2hjj:active{transform:translateY(0)}.location-controls.svelte-dc2hjj.svelte-dc2hjj{width:100%;max-width:320px;display:flex;flex-direction:column;gap:0.75rem;margin-top:0.5rem}.zip-form.svelte-dc2hjj.svelte-dc2hjj{display:flex;gap:0.5rem;width:100%}.zip-input.svelte-dc2hjj.svelte-dc2hjj{flex:1;padding:0.6rem 0.875rem;font-size:0.875rem;background:var(--surface-variant);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);outline:none;transition:all 0.2s ease;font-family:inherit}.zip-input.svelte-dc2hjj.svelte-dc2hjj::placeholder{color:var(--text-secondary)}.zip-input.svelte-dc2hjj.svelte-dc2hjj:focus{background:var(--surface-container-high);border-color:var(--outline-variant);box-shadow:0 0 0 3px color-mix(in srgb, var(--primary-color) 10%, transparent)}.zip-submit.svelte-dc2hjj.svelte-dc2hjj{padding:0.6rem 1.25rem;font-size:0.875rem;font-weight:600;background:var(--surface-container-high);border:1px solid var(--outline-variant);border-radius:8px;color:var(--text-primary);cursor:pointer;transition:all 0.2s ease;white-space:nowrap}.zip-submit.svelte-dc2hjj.svelte-dc2hjj:hover{background:var(--surface-container-highest);border-color:var(--outline-variant)}.zip-submit.svelte-dc2hjj.svelte-dc2hjj:active{transform:scale(0.98)}.reset-button.svelte-dc2hjj.svelte-dc2hjj{width:100%;padding:0.6rem;background:color-mix(in srgb, var(--primary-color) 15%, transparent);border:1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);border-radius:8px;color:var(--primary-color);cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;justify-content:center}.reset-button.svelte-dc2hjj.svelte-dc2hjj:hover{background:color-mix(in srgb, var(--primary-color) 25%, transparent);border-color:color-mix(in srgb, var(--primary-color) 40%, transparent)}.reset-button.svelte-dc2hjj.svelte-dc2hjj:active{transform:scale(0.98)}.data-table.svelte-dc2hjj.svelte-dc2hjj{width:100%;max-width:500px;margin-top:1.5rem;background:var(--surface-variant);border:1px solid var(--border);border-radius:12px;backdrop-filter:blur(10px);overflow:hidden}.data-table-header.svelte-dc2hjj.svelte-dc2hjj{width:100%;display:flex;align-items:center;justify-content:space-between;padding:1rem;background:transparent;border:none;cursor:pointer;transition:background 0.2s ease}.data-table-header.svelte-dc2hjj.svelte-dc2hjj:hover{background:var(--surface-container-high)}.data-table-header.svelte-dc2hjj h3.svelte-dc2hjj{margin:0;font-size:1rem;font-weight:600;color:var(--text-primary);text-align:left}.collapse-icon.svelte-dc2hjj.svelte-dc2hjj{color:var(--text-secondary);transition:transform 0.3s ease;flex-shrink:0}.collapse-icon.collapsed.svelte-dc2hjj.svelte-dc2hjj{transform:rotate(-90deg)}.data-table.svelte-dc2hjj table.svelte-dc2hjj{width:100%;border-collapse:collapse;font-size:0.8125rem;padding:0 1rem 1rem}.data-table.svelte-dc2hjj tbody tr.svelte-dc2hjj{border-bottom:1px solid color-mix(in srgb, var(--border) 50%, transparent)}.data-table.svelte-dc2hjj tbody tr.svelte-dc2hjj:last-child{border-bottom:none}.data-table.svelte-dc2hjj tbody tr.section-header.svelte-dc2hjj{border-bottom:1px solid var(--border)}.data-table.svelte-dc2hjj tbody tr.section-header td.svelte-dc2hjj{padding:0.75rem 0.5rem 0.5rem;font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);text-align:left}.data-table.svelte-dc2hjj tbody tr.section-header:first-child td.svelte-dc2hjj{padding-top:0}.data-table.svelte-dc2hjj td.svelte-dc2hjj{padding:0.5rem;color:var(--on-surface)}.data-table.svelte-dc2hjj td.svelte-dc2hjj:first-child{font-weight:500;color:var(--text-secondary);width:45%}.data-table.svelte-dc2hjj td.svelte-dc2hjj:last-child{text-align:right;color:var(--text-primary);font-family:'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace}@media(max-width: 768px){.time.svelte-dc2hjj.svelte-dc2hjj{font-size:1.5rem}.temperature.svelte-dc2hjj.svelte-dc2hjj{font-size:4rem}.data-table.svelte-dc2hjj.svelte-dc2hjj{max-width:100%;font-size:0.75rem}.data-table.svelte-dc2hjj td.svelte-dc2hjj{padding:0.4rem}}`,
      map: `{"version":3,"file":"WeatherWidget.svelte","sources":["WeatherWidget.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount } from \\"svelte\\";\\nimport { browser } from \\"$app/environment\\";\\nimport { page } from \\"$app/stores\\";\\nconst WEATHER_CACHE_KEY = \\"dashboard-weather-data\\";\\nconst CACHE_DURATION = 5 * 60 * 1e3;\\nconst UNIT_PREFERENCE_KEY = \\"dashboard-temp-unit\\";\\nconst ZIP_CODE_KEY = \\"dashboard-zip-code\\";\\nconst DATA_TABLE_COLLAPSED_KEY = \\"dashboard-data-table-collapsed\\";\\nlet currentTime = \\"\\";\\nlet currentDate = \\"\\";\\nlet temperature = 72;\\nlet humidity = 65;\\nlet location = \\"Lewiston, ME\\";\\nlet condition = \\"partly-cloudy\\";\\nlet hourlyData = [];\\nlet isLoading = true;\\nlet hasLocationData = false;\\nlet sunrise = 0;\\nlet sunset = 0;\\nlet moonrise = 0;\\nlet moonset = 0;\\nlet timezone = \\"\\";\\nlet timezoneOffset = 0;\\nlet isCelsius = true;\\nlet isNight = false;\\nlet sunPosition = { x: -100, y: -100 };\\nlet moonPosition = { x: -100, y: -100 };\\nlet earthGradient = \\"\\";\\nlet textColor = \\"rgba(255, 255, 255, 0.95)\\";\\nlet moonPhase = 0;\\nlet moonScale = 1;\\nlet currentTimestamp = Date.now();\\nlet earthSize = 320;\\nlet padding = 40;\\nlet latitude = null;\\nlet longitude = null;\\nlet lastUpdate = 0;\\nlet description = \\"\\";\\nlet savedZipCode = \\"\\";\\nlet zipCodeInput = \\"\\";\\nlet timeTestMode = false;\\nlet testDateOffset = 0;\\nlet isDataTableCollapsed = true;\\nif (browser) {\\n  const urlParams = new URLSearchParams(window.location.search);\\n  timeTestMode = urlParams.get(\\"timeTest\\") === \\"true\\";\\n  const savedCollapsed = localStorage.getItem(DATA_TABLE_COLLAPSED_KEY);\\n  if (savedCollapsed !== null) {\\n    isDataTableCollapsed = savedCollapsed === \\"true\\";\\n  }\\n}\\nif (browser) {\\n  const savedUnit = localStorage.getItem(UNIT_PREFERENCE_KEY);\\n  if (savedUnit !== null) {\\n    isCelsius = savedUnit === \\"celsius\\";\\n  }\\n  const savedZip = localStorage.getItem(ZIP_CODE_KEY);\\n  if (savedZip) {\\n    savedZipCode = savedZip;\\n    zipCodeInput = savedZip;\\n  }\\n}\\nfunction convertTemp(temp) {\\n  if (isCelsius) {\\n    return Math.round((temp - 32) * 5 / 9);\\n  }\\n  return temp;\\n}\\n$: displayTemp = isCelsius ? Math.round((temperature - 32) * 5 / 9) : temperature;\\nfunction setUnit(useCelsius) {\\n  isCelsius = useCelsius;\\n  if (browser) {\\n    localStorage.setItem(UNIT_PREFERENCE_KEY, useCelsius ? \\"celsius\\" : \\"fahrenheit\\");\\n  }\\n}\\nasync function loadWeatherData() {\\n  if (!browser) return;\\n  if (savedZipCode) {\\n    await fetchWeatherByZipCode(savedZipCode);\\n    return;\\n  }\\n  await fetchWeatherData();\\n}\\nasync function fetchWeatherData() {\\n  try {\\n    if (navigator.geolocation) {\\n      navigator.geolocation.getCurrentPosition(\\n        async (position) => {\\n          const { latitude: latitude2, longitude: longitude2 } = position.coords;\\n          await fetchWeatherFromAPI(latitude2, longitude2);\\n        },\\n        async (error) => {\\n          console.log(\\"Geolocation denied or failed:\\", error.message);\\n          isLoading = false;\\n        }\\n      );\\n    } else {\\n      console.log(\\"Geolocation not supported\\");\\n      isLoading = false;\\n    }\\n  } catch (error) {\\n    console.error(\\"Error fetching weather:\\", error);\\n    isLoading = false;\\n  }\\n}\\nasync function fetchWeatherFromAPI(lat, lon) {\\n  try {\\n    const url = lat && lon ? \`/api/weather?lat=\${lat}&lon=\${lon}\` : \\"/api/weather\\";\\n    console.log(\\"Fetching weather from:\\", url);\\n    const response = await fetch(url);\\n    console.log(\\"Weather API response status:\\", response.status);\\n    if (!response.ok) {\\n      const errorText = await response.text();\\n      console.error(\\"Weather API error:\\", errorText);\\n      throw new Error(\`Failed to fetch weather: \${response.status}\`);\\n    }\\n    const data = await response.json();\\n    console.log(\\"Weather data received:\\", data);\\n    if (lat && lon) {\\n      latitude = lat;\\n      longitude = lon;\\n    }\\n    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));\\n    applyWeatherData(data);\\n    isLoading = false;\\n  } catch (error) {\\n    console.error(\\"Error fetching weather from API:\\", error);\\n    isLoading = false;\\n  }\\n}\\nasync function fetchWeatherByZipCode(zipCode) {\\n  try {\\n    const url = \`/api/weather?zip=\${zipCode}\`;\\n    console.log(\\"Fetching weather by zip code:\\", url);\\n    const response = await fetch(url);\\n    console.log(\\"Weather API response status:\\", response.status);\\n    if (!response.ok) {\\n      const errorText = await response.text();\\n      console.error(\\"Weather API error:\\", errorText);\\n      throw new Error(\`Failed to fetch weather: \${response.status}\`);\\n    }\\n    const data = await response.json();\\n    console.log(\\"Weather data received:\\", data);\\n    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));\\n    applyWeatherData(data);\\n    isLoading = false;\\n  } catch (error) {\\n    console.error(\\"Error fetching weather by zip code:\\", error);\\n    isLoading = false;\\n  }\\n}\\nfunction handleZipCodeSubmit() {\\n  const trimmedZip = zipCodeInput.trim();\\n  if (!trimmedZip || !/^\\\\d{5}$/.test(trimmedZip)) {\\n    alert(\\"Please enter a valid 5-digit ZIP code\\");\\n    return;\\n  }\\n  savedZipCode = trimmedZip;\\n  localStorage.setItem(ZIP_CODE_KEY, savedZipCode);\\n  localStorage.removeItem(WEATHER_CACHE_KEY);\\n  hasLocationData = false;\\n  fetchWeatherByZipCode(savedZipCode);\\n}\\nfunction handleResetLocation() {\\n  savedZipCode = \\"\\";\\n  zipCodeInput = \\"\\";\\n  localStorage.removeItem(ZIP_CODE_KEY);\\n  localStorage.removeItem(WEATHER_CACHE_KEY);\\n  hasLocationData = false;\\n  fetchWeatherData();\\n}\\nfunction requestBrowserLocation() {\\n  fetchWeatherData();\\n}\\nfunction applyWeatherData(data) {\\n  temperature = data.temperature;\\n  humidity = data.humidity;\\n  location = data.location;\\n  description = data.description || \\"\\";\\n  hourlyData = data.hourly || [];\\n  sunrise = data.sunrise || 0;\\n  sunset = data.sunset || 0;\\n  moonrise = data.moonrise || 0;\\n  moonset = data.moonset || 0;\\n  timezone = data.timezone || \\"\\";\\n  timezoneOffset = data.timezoneOffset || 0;\\n  lastUpdate = data.timestamp || Date.now();\\n  hasLocationData = true;\\n  const weatherCondition = data.condition.toLowerCase();\\n  if (weatherCondition.includes(\\"clear\\")) {\\n    condition = \\"sunny\\";\\n  } else if (weatherCondition.includes(\\"cloud\\")) {\\n    condition = \\"partly-cloudy\\";\\n  } else if (weatherCondition.includes(\\"rain\\")) {\\n    condition = \\"rainy\\";\\n  } else {\\n    condition = \\"partly-cloudy\\";\\n  }\\n}\\n$: temperaturePath = generateTemperaturePath(hourlyData);\\nfunction generateTemperaturePath(hourly) {\\n  if (hourly.length === 0) return \\"\\";\\n  const width = 320;\\n  const height = 80;\\n  const padding2 = 0;\\n  const temps = hourly.map((h) => h.temperature);\\n  const minTemp = Math.min(...temps);\\n  const maxTemp = Math.max(...temps);\\n  const tempRange = maxTemp - minTemp || 10;\\n  const points = hourly.map((hour, index) => {\\n    const x = padding2 + index / (hourly.length - 1) * (width - 2 * padding2);\\n    const normalizedTemp = (hour.temperature - minTemp) / tempRange;\\n    const y = height - padding2 - normalizedTemp * (height - 2 * padding2);\\n    return \`\${x},\${y}\`;\\n  });\\n  return \`M \${points.join(\\" L \\")}\`;\\n}\\nfunction formatHour(timestamp) {\\n  const date = new Date(timestamp * 1e3);\\n  return date.toLocaleTimeString(\\"en-US\\", { hour: \\"numeric\\", hour12: true });\\n}\\nfunction getTemperatureColor(temp) {\\n  if (temp <= 32) return \\"#ffffff\\";\\n  if (temp < 77) {\\n    const ratio = (temp - 32) / (77 - 32);\\n    return interpolateColor(\\"#ffffff\\", \\"#3b82f6\\", ratio);\\n  }\\n  if (temp < 80) {\\n    const ratio = (temp - 77) / (80 - 77);\\n    return interpolateColor(\\"#3b82f6\\", \\"#f97316\\", ratio);\\n  }\\n  if (temp < 100) {\\n    const ratio = (temp - 80) / (100 - 80);\\n    return interpolateColor(\\"#f97316\\", \\"#ef4444\\", ratio);\\n  }\\n  return \\"#ef4444\\";\\n}\\nfunction interpolateColor(color1, color2, ratio) {\\n  const hex = (c) => parseInt(c.slice(1), 16);\\n  const r1 = hex(color1) >> 16 & 255;\\n  const g1 = hex(color1) >> 8 & 255;\\n  const b1 = hex(color1) & 255;\\n  const r2 = hex(color2) >> 16 & 255;\\n  const g2 = hex(color2) >> 8 & 255;\\n  const b2 = hex(color2) & 255;\\n  const r = Math.round(r1 + (r2 - r1) * ratio);\\n  const g = Math.round(g1 + (g2 - g1) * ratio);\\n  const b = Math.round(b1 + (b2 - b1) * ratio);\\n  return \`#\${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}\`;\\n}\\nfunction updateEarthSize() {\\n  if (browser && window.innerWidth <= 768) {\\n    earthSize = 280;\\n    padding = 40;\\n  } else {\\n    earthSize = 320;\\n    padding = 40;\\n  }\\n}\\nonMount(() => {\\n  updateEarthSize();\\n  const handleResize = () => {\\n    updateEarthSize();\\n  };\\n  window.addEventListener(\\"resize\\", handleResize);\\n  const updateTime = () => {\\n    const now = /* @__PURE__ */ new Date();\\n    currentTimestamp = now.getTime();\\n    let displayDate;\\n    if (timeTestMode) {\\n      if (timezoneOffset !== 0) {\\n        const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1e3;\\n        const locationTime = utcTime + timezoneOffset * 1e3;\\n        displayDate = new Date(locationTime + testDateOffset * 60 * 1e3);\\n      } else {\\n        displayDate = new Date(now.getTime() + testDateOffset * 60 * 1e3);\\n      }\\n    } else if (timezoneOffset !== 0) {\\n      const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1e3;\\n      displayDate = new Date(utcTime + timezoneOffset * 1e3);\\n    } else {\\n      displayDate = now;\\n    }\\n    currentTime = displayDate.toLocaleTimeString(\\"en-US\\", {\\n      hour: \\"2-digit\\",\\n      minute: \\"2-digit\\",\\n      second: \\"2-digit\\",\\n      hour12: true\\n    });\\n    const year = displayDate.getFullYear();\\n    const month = displayDate.toLocaleString(\\"en-US\\", { month: \\"long\\" });\\n    const day = displayDate.getDate();\\n    const weekday = displayDate.toLocaleString(\\"en-US\\", { weekday: \\"long\\" });\\n    currentDate = \`\${year} \${month} \${day} (\${weekday})\`;\\n  };\\n  updateTime();\\n  const interval = setInterval(updateTime, 1e3);\\n  loadWeatherData();\\n  const weatherInterval = setInterval(() => {\\n    fetchWeatherData();\\n  }, CACHE_DURATION);\\n  return () => {\\n    clearInterval(interval);\\n    clearInterval(weatherInterval);\\n    window.removeEventListener(\\"resize\\", handleResize);\\n  };\\n});\\n$: {\\n  const now = /* @__PURE__ */ new Date();\\n  const hours = now.getHours() + now.getMinutes() / 60;\\n  const timeRatio = hours / 24;\\n  if (hours >= 6 && hours < 18) {\\n    condition = temperature > 80 ? \\"sunny\\" : \\"partly-cloudy\\";\\n  } else {\\n    condition = \\"night\\";\\n  }\\n}\\nfunction getSunPosition(testDate) {\\n  let sunriseTime = 6 * 3600;\\n  let sunsetTime = 18 * 3600;\\n  if (sunrise) {\\n    const sunriseDate = new Date(sunrise * 1e3);\\n    sunriseTime = sunriseDate.getHours() * 3600 + sunriseDate.getMinutes() * 60 + sunriseDate.getSeconds();\\n  }\\n  if (sunset) {\\n    const sunsetDate = new Date(sunset * 1e3);\\n    sunsetTime = sunsetDate.getHours() * 3600 + sunsetDate.getMinutes() * 60 + sunsetDate.getSeconds();\\n  }\\n  const secondsSinceMidnight = testDate.getHours() * 3600 + testDate.getMinutes() * 60 + testDate.getSeconds();\\n  const earthRadius = earthSize / 2;\\n  const sunRadius = earthSize * 0.09375;\\n  let angle;\\n  let orbitRadius;\\n  if (secondsSinceMidnight >= sunriseTime && secondsSinceMidnight <= sunsetTime) {\\n    const solarNoonTime = (sunriseTime + sunsetTime) / 2;\\n    if (secondsSinceMidnight <= solarNoonTime) {\\n      const morningDuration = solarNoonTime - sunriseTime;\\n      const morningProgress = (secondsSinceMidnight - sunriseTime) / morningDuration;\\n      angle = -Math.PI / 2 + morningProgress * Math.PI / 2;\\n      const expansionProgress = Math.sin(morningProgress * Math.PI / 2);\\n      const minOrbitRadius = earthRadius + sunRadius * 0.1;\\n      const maxOrbitRadius = earthRadius + sunRadius;\\n      orbitRadius = minOrbitRadius + expansionProgress * (maxOrbitRadius - minOrbitRadius);\\n    } else {\\n      const afternoonDuration = sunsetTime - solarNoonTime;\\n      const afternoonProgress = (secondsSinceMidnight - solarNoonTime) / afternoonDuration;\\n      angle = 0 + afternoonProgress * Math.PI / 2;\\n      const contractionProgress = Math.cos(afternoonProgress * Math.PI / 2);\\n      const minOrbitRadius = earthRadius + sunRadius * 0.1;\\n      const maxOrbitRadius = earthRadius + sunRadius;\\n      orbitRadius = minOrbitRadius + contractionProgress * (maxOrbitRadius - minOrbitRadius);\\n    }\\n  } else {\\n    const solarMidnightTime = (sunsetTime + sunriseTime + 86400) / 2;\\n    const nightOrbitRadius = earthRadius - sunRadius * 1.5;\\n    if (secondsSinceMidnight <= sunriseTime) {\\n      const nightDuration = 86400 - sunsetTime + sunriseTime;\\n      const effectiveMidnight = solarMidnightTime > 86400 ? solarMidnightTime - 86400 : solarMidnightTime;\\n      const preSunriseDuration = sunriseTime - effectiveMidnight;\\n      const preSunriseProgress = (secondsSinceMidnight - effectiveMidnight) / preSunriseDuration;\\n      angle = Math.PI + preSunriseProgress * Math.PI / 2;\\n      orbitRadius = nightOrbitRadius;\\n    } else {\\n      const nightDuration = 86400 - sunsetTime + sunriseTime;\\n      const effectiveMidnight = solarMidnightTime > 86400 ? solarMidnightTime - 86400 : solarMidnightTime;\\n      const postSunsetDuration = effectiveMidnight + (solarMidnightTime > 86400 ? 86400 : 0) - sunsetTime;\\n      const postSunsetProgress = (secondsSinceMidnight - sunsetTime) / postSunsetDuration;\\n      angle = Math.PI / 2 + postSunsetProgress * Math.PI / 2;\\n      orbitRadius = nightOrbitRadius;\\n    }\\n  }\\n  angle = angle - Math.PI / 2;\\n  const x = padding + earthSize / 2 + Math.cos(angle) * orbitRadius;\\n  const y = padding + earthSize / 2 + Math.sin(angle) * orbitRadius;\\n  return { x, y };\\n}\\nfunction getMoonPosition(testDate) {\\n  const secondsSinceMidnight = testDate.getHours() * 3600 + testDate.getMinutes() * 60 + testDate.getSeconds();\\n  let moonriseTime = 18 * 3600;\\n  let moonsetTime = 6 * 3600;\\n  if (moonrise) {\\n    const moonriseDate = new Date(moonrise * 1e3);\\n    moonriseTime = moonriseDate.getHours() * 3600 + moonriseDate.getMinutes() * 60 + moonriseDate.getSeconds();\\n  }\\n  if (moonset) {\\n    const moonsetDate = new Date(moonset * 1e3);\\n    moonsetTime = moonsetDate.getHours() * 3600 + moonsetDate.getMinutes() * 60 + moonsetDate.getSeconds();\\n  }\\n  const earthRadius = earthSize / 2;\\n  const moonRadius = earthSize * 0.09375;\\n  const visibleOrbitRadius = earthRadius + moonRadius;\\n  const hiddenOrbitRadius = earthRadius + moonRadius * 0.5;\\n  const horizonScaleDuration = 30 * 60;\\n  const maxScale = 1.9;\\n  const normalScale = 1;\\n  const hiddenScale = 0.7;\\n  let scale = normalScale;\\n  let angle;\\n  let orbitRadius;\\n  if (moonriseTime < moonsetTime) {\\n    if (secondsSinceMidnight >= moonriseTime && secondsSinceMidnight <= moonsetTime) {\\n      const visibleDuration = moonsetTime - moonriseTime;\\n      const visibleProgress = (secondsSinceMidnight - moonriseTime) / visibleDuration;\\n      angle = -Math.PI / 2 + visibleProgress * Math.PI;\\n      orbitRadius = visibleOrbitRadius;\\n      const timeSinceRise = secondsSinceMidnight - moonriseTime;\\n      const timeBeforeSet = moonsetTime - secondsSinceMidnight;\\n      if (timeSinceRise <= horizonScaleDuration) {\\n        const scaleProgress = timeSinceRise / horizonScaleDuration;\\n        scale = maxScale - scaleProgress * (maxScale - normalScale);\\n      } else if (timeBeforeSet <= horizonScaleDuration) {\\n        const scaleProgress = timeBeforeSet / horizonScaleDuration;\\n        scale = maxScale - scaleProgress * (maxScale - normalScale);\\n      }\\n    } else {\\n      const hiddenDuration = 86400 - moonsetTime + moonriseTime;\\n      let hiddenProgress;\\n      if (secondsSinceMidnight > moonsetTime) {\\n        hiddenProgress = (secondsSinceMidnight - moonsetTime) / hiddenDuration;\\n      } else {\\n        hiddenProgress = (86400 - moonsetTime + secondsSinceMidnight) / hiddenDuration;\\n      }\\n      angle = Math.PI / 2 + hiddenProgress * Math.PI;\\n      orbitRadius = hiddenOrbitRadius;\\n      scale = hiddenScale;\\n    }\\n  } else {\\n    if (secondsSinceMidnight >= moonriseTime || secondsSinceMidnight <= moonsetTime) {\\n      const visibleDuration = 86400 - moonriseTime + moonsetTime;\\n      let visibleProgress;\\n      let timeSinceRise, timeBeforeSet;\\n      if (secondsSinceMidnight >= moonriseTime) {\\n        visibleProgress = (secondsSinceMidnight - moonriseTime) / visibleDuration;\\n        timeSinceRise = secondsSinceMidnight - moonriseTime;\\n        timeBeforeSet = 86400 - secondsSinceMidnight + moonsetTime;\\n      } else {\\n        visibleProgress = (86400 - moonriseTime + secondsSinceMidnight) / visibleDuration;\\n        timeSinceRise = 86400 - moonriseTime + secondsSinceMidnight;\\n        timeBeforeSet = moonsetTime - secondsSinceMidnight;\\n      }\\n      angle = -Math.PI / 2 + visibleProgress * Math.PI;\\n      orbitRadius = visibleOrbitRadius;\\n      if (timeSinceRise <= horizonScaleDuration) {\\n        const scaleProgress = timeSinceRise / horizonScaleDuration;\\n        scale = maxScale - scaleProgress * (maxScale - normalScale);\\n      } else if (timeBeforeSet <= horizonScaleDuration) {\\n        const scaleProgress = timeBeforeSet / horizonScaleDuration;\\n        scale = maxScale - scaleProgress * (maxScale - normalScale);\\n      }\\n    } else {\\n      const hiddenDuration = moonriseTime - moonsetTime;\\n      const hiddenProgress = (secondsSinceMidnight - moonsetTime) / hiddenDuration;\\n      angle = Math.PI / 2 + hiddenProgress * Math.PI;\\n      orbitRadius = hiddenOrbitRadius;\\n      scale = hiddenScale;\\n    }\\n  }\\n  angle = angle - Math.PI / 2;\\n  const x = padding + earthSize / 2 + Math.cos(angle) * orbitRadius;\\n  const y = padding + earthSize / 2 + Math.sin(angle) * orbitRadius;\\n  return { x, y, scale };\\n}\\nfunction calculateEarthColor(hour, weatherCondition) {\\n  const hoursFromNoon = Math.abs(12 - hour);\\n  const dayBrightness = 1 - hoursFromNoon / 12;\\n  let baseColor1, baseColor2, baseColor3, baseColor4;\\n  if (dayBrightness > 0.8) {\\n    baseColor1 = { r: 245, g: 240, b: 235 };\\n    baseColor2 = { r: 230, g: 220, b: 210 };\\n    baseColor3 = { r: 215, g: 205, b: 195 };\\n    baseColor4 = { r: 200, g: 190, b: 180 };\\n  } else if (dayBrightness > 0.6) {\\n    baseColor1 = { r: 212, g: 180, b: 140 };\\n    baseColor2 = { r: 195, g: 165, b: 125 };\\n    baseColor3 = { r: 180, g: 150, b: 115 };\\n    baseColor4 = { r: 165, g: 140, b: 105 };\\n  } else if (dayBrightness > 0.4) {\\n    baseColor1 = { r: 150, g: 120, b: 100 };\\n    baseColor2 = { r: 130, g: 105, b: 90 };\\n    baseColor3 = { r: 115, g: 95, b: 80 };\\n    baseColor4 = { r: 100, g: 85, b: 70 };\\n  } else if (dayBrightness > 0.2) {\\n    baseColor1 = { r: 90, g: 75, b: 85 };\\n    baseColor2 = { r: 75, g: 65, b: 75 };\\n    baseColor3 = { r: 65, g: 55, b: 65 };\\n    baseColor4 = { r: 55, g: 48, b: 58 };\\n  } else {\\n    baseColor1 = { r: 45, g: 40, b: 55 };\\n    baseColor2 = { r: 38, g: 35, b: 48 };\\n    baseColor3 = { r: 32, g: 30, b: 42 };\\n    baseColor4 = { r: 25, g: 23, b: 35 };\\n  }\\n  if (weatherCondition.includes(\\"cloud\\") || weatherCondition === \\"partly-cloudy\\") {\\n    const grayFactor = 0.7;\\n    baseColor1 = mixWithGray(baseColor1, grayFactor);\\n    baseColor2 = mixWithGray(baseColor2, grayFactor);\\n    baseColor3 = mixWithGray(baseColor3, grayFactor);\\n    baseColor4 = mixWithGray(baseColor4, grayFactor);\\n  } else if (weatherCondition.includes(\\"rain\\")) {\\n    const blueTint = { r: 0, g: 20, b: 40 };\\n    baseColor1 = mixColors(baseColor1, blueTint, 0.3);\\n    baseColor2 = mixColors(baseColor2, blueTint, 0.35);\\n    baseColor3 = mixColors(baseColor3, blueTint, 0.4);\\n    baseColor4 = mixColors(baseColor4, blueTint, 0.45);\\n    const grayFactor = 0.6;\\n    baseColor1 = mixWithGray(baseColor1, grayFactor);\\n    baseColor2 = mixWithGray(baseColor2, grayFactor);\\n    baseColor3 = mixWithGray(baseColor3, grayFactor);\\n    baseColor4 = mixWithGray(baseColor4, grayFactor);\\n  }\\n  const gradient = \`linear-gradient(135deg, \\n\\t\\t\\trgba(\${baseColor1.r}, \${baseColor1.g}, \${baseColor1.b}, 0.95) 0%,\\n\\t\\t\\trgba(\${baseColor2.r}, \${baseColor2.g}, \${baseColor2.b}, 0.95) 30%,\\n\\t\\t\\trgba(\${baseColor3.r}, \${baseColor3.g}, \${baseColor3.b}, 0.95) 60%,\\n\\t\\t\\trgba(\${baseColor4.r}, \${baseColor4.g}, \${baseColor4.b}, 0.95) 100%\\n\\t\\t)\`;\\n  const avgBrightness = (baseColor1.r + baseColor1.g + baseColor1.b + baseColor2.r + baseColor2.g + baseColor2.b) / 6;\\n  const textColor2 = avgBrightness > 160 ? \\"rgba(40, 40, 40, 0.95)\\" : \\"rgba(255, 255, 255, 0.95)\\";\\n  return { gradient, textColor: textColor2 };\\n}\\nfunction mixWithGray(color, factor) {\\n  const avg = (color.r + color.g + color.b) / 3;\\n  return {\\n    r: Math.round(color.r * (1 - factor) + avg * factor),\\n    g: Math.round(color.g * (1 - factor) + avg * factor),\\n    b: Math.round(color.b * (1 - factor) + avg * factor)\\n  };\\n}\\nfunction mixColors(color1, color2, ratio) {\\n  return {\\n    r: Math.round(color1.r * (1 - ratio) + color2.r * ratio),\\n    g: Math.round(color1.g * (1 - ratio) + color2.g * ratio),\\n    b: Math.round(color1.b * (1 - ratio) + color2.b * ratio)\\n  };\\n}\\nfunction calculateMoonPhase(date) {\\n  const knownNewMoon = (/* @__PURE__ */ new Date(\\"2000-01-06T18:14:00Z\\")).getTime();\\n  const lunarCycle = 29.53058770576;\\n  const currentTime2 = date.getTime();\\n  const daysSinceNewMoon = (currentTime2 - knownNewMoon) / (1e3 * 60 * 60 * 24);\\n  const phase = daysSinceNewMoon % lunarCycle / lunarCycle;\\n  return phase;\\n}\\nfunction getMoonPhaseName(phase) {\\n  if (phase < 0.0625) return \\"New Moon\\";\\n  if (phase < 0.1875) return \\"Waxing Crescent\\";\\n  if (phase < 0.3125) return \\"First Quarter\\";\\n  if (phase < 0.4375) return \\"Waxing Gibbous\\";\\n  if (phase < 0.5625) return \\"Full Moon\\";\\n  if (phase < 0.6875) return \\"Waning Gibbous\\";\\n  if (phase < 0.8125) return \\"Last Quarter\\";\\n  if (phase < 0.9375) return \\"Waning Crescent\\";\\n  return \\"New Moon\\";\\n}\\nfunction toggleDataTable() {\\n  isDataTableCollapsed = !isDataTableCollapsed;\\n  if (browser) {\\n    localStorage.setItem(DATA_TABLE_COLLAPSED_KEY, isDataTableCollapsed.toString());\\n  }\\n}\\n$: if (currentTimestamp && testDateOffset !== void 0) {\\n  const now = new Date(currentTimestamp);\\n  let testDate;\\n  if (timeTestMode) {\\n    testDate = new Date(now.getTime() + testDateOffset * 60 * 1e3);\\n  } else {\\n    testDate = now;\\n  }\\n  sunPosition = getSunPosition(testDate);\\n  const moonData = getMoonPosition(testDate);\\n  moonPosition = { x: moonData.x, y: moonData.y };\\n  moonScale = moonData.scale;\\n  moonPhase = calculateMoonPhase(testDate);\\n  let displayHour;\\n  if (timezoneOffset !== 0) {\\n    const utcTime = testDate.getTime() + testDate.getTimezoneOffset() * 60 * 1e3;\\n    const locationTime = new Date(utcTime + timezoneOffset * 1e3);\\n    displayHour = locationTime.getHours();\\n  } else {\\n    displayHour = testDate.getHours();\\n  }\\n  isNight = displayHour < 6 || displayHour >= 18;\\n  const colorData = calculateEarthColor(displayHour, condition);\\n  earthGradient = colorData.gradient;\\n  textColor = colorData.textColor;\\n}\\n<\/script>\\r\\n\\r\\n<div class=\\"weather-widget\\" class:loaded={hasLocationData}>\\r\\n\\t{#if hasLocationData}\\r\\n\\t<!-- Temperature Unit Toggle Switch -->\\r\\n\\t<div class=\\"unit-switch-container\\">\\r\\n\\t\\t<button \\r\\n\\t\\t\\tclass=\\"unit-option\\" \\r\\n\\t\\t\\tclass:active={!isCelsius}\\r\\n\\t\\t\\ton:click={() => setUnit(false)}\\r\\n\\t\\t>\\r\\n\\t\\t\\t\xB0F\\r\\n\\t\\t</button>\\r\\n\\t\\t<button \\r\\n\\t\\t\\tclass=\\"unit-option\\" \\r\\n\\t\\t\\tclass:active={isCelsius}\\r\\n\\t\\t\\ton:click={() => setUnit(true)}\\r\\n\\t\\t>\\r\\n\\t\\t\\t\xB0C\\r\\n\\t\\t</button>\\r\\n\\t</div>\\r\\n\\r\\n\\t<!-- Celestial System Container (centers everything together) -->\\r\\n\\t<div class=\\"celestial-container\\" class:loaded={hasLocationData} style=\\"--earth-size: {earthSize}px;\\">\\r\\n\\t\\t<!-- Sun (Behind Earth) -->\\r\\n\\t\\t<div \\r\\n\\t\\t\\tclass=\\"sun\\" \\r\\n\\t\\t\\tstyle=\\"left: {sunPosition.x}px; top: {sunPosition.y}px\\"\\r\\n\\t\\t></div>\\r\\n\\t\\t\\r\\n\\t\\t<!-- Moon (Behind Earth) -->\\r\\n\\t\\t<div \\r\\n\\t\\t\\tclass=\\"moon\\" \\r\\n\\t\\t\\tstyle=\\"\\r\\n\\t\\t\\t\\tleft: {moonPosition.x}px; \\r\\n\\t\\t\\t\\ttop: {moonPosition.y}px;\\r\\n\\t\\t\\t\\ttransform: translate(-50%, -50%) scale({moonScale});\\r\\n\\t\\t\\t\\"\\r\\n\\t\\t>\\r\\n\\t\\t\\t<div class=\\"moon-surface\\"></div>\\r\\n\\t\\t\\t<div \\r\\n\\t\\t\\t\\tclass=\\"moon-shadow\\" \\r\\n\\t\\t\\t\\tstyle=\\"\\r\\n\\t\\t\\t\\t\\ttransform: translateX({moonPhase < 0.5 ? (1 - moonPhase * 2) * 30 : (moonPhase - 0.5) * 2 * -30}px) scaleX({moonPhase < 0.5 ? 1 : -1});\\r\\n\\t\\t\\t\\t\\topacity: {Math.abs(moonPhase - 0.5) * 2};\\r\\n\\t\\t\\t\\t\\"\\r\\n\\t\\t\\t></div>\\r\\n\\t\\t\\t<div class=\\"moon-crescent\\"></div>\\r\\n\\t\\t</div>\\r\\n\\t\\t\\r\\n\\t\\t<div class=\\"earth\\" style=\\"background: {earthGradient}; --text-color: {textColor}\\">\\r\\n\\r\\n\\t\\t<!-- Time and Date Section -->\\r\\n\\t\\t<div class=\\"time-date-section\\">\\r\\n\\t\\t\\t<div class=\\"time\\">{currentTime}</div>\\r\\n\\t\\t\\t<div class=\\"date\\">{currentDate}</div>\\r\\n\\t\\t\\t<div class=\\"location\\">{location}</div>\\r\\n\\t\\t</div>\\r\\n\\t\\t\\r\\n\\t\\t<!-- 24-Hour Temperature Graph (layered behind temperature) -->\\r\\n\\t\\t{#if hourlyData.length > 0}\\r\\n\\t\\t\\t<svg class=\\"temp-graph-svg\\" width=\\"320\\" height=\\"80\\" viewBox=\\"0 0 320 80\\">\\r\\n\\t\\t\\t\\t<!-- Define gradient for temperature colors -->\\r\\n\\t\\t\\t\\t<defs>\\r\\n\\t\\t\\t\\t\\t<linearGradient id=\\"tempGradient\\" x1=\\"0%\\" y1=\\"0%\\" x2=\\"100%\\" y2=\\"0%\\">\\r\\n\\t\\t\\t\\t\\t\\t{#each hourlyData.slice(0, 24) as hour, index}\\r\\n\\t\\t\\t\\t\\t\\t\\t{@const offset = (index / 23) * 100}\\r\\n\\t\\t\\t\\t\\t\\t\\t{@const color = getTemperatureColor(hour.temperature)}\\r\\n\\t\\t\\t\\t\\t\\t\\t<stop offset=\\"{offset}%\\" stop-color={color} />\\r\\n\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t</linearGradient>\\r\\n\\t\\t\\t\\t</defs>\\r\\n\\t\\t\\t\\t\\r\\n\\t\\t\\t\\t<!-- Temperature line with gradient -->\\r\\n\\t\\t\\t\\t<path\\r\\n\\t\\t\\t\\t\\td={temperaturePath}\\r\\n\\t\\t\\t\\t\\tfill=\\"none\\"\\r\\n\\t\\t\\t\\t\\tstroke=\\"url(#tempGradient)\\"\\r\\n\\t\\t\\t\\t\\tstroke-width=\\"8\\"\\r\\n\\t\\t\\t\\t\\tstroke-linecap=\\"round\\"\\r\\n\\t\\t\\t\\t\\tstroke-linejoin=\\"round\\"\\r\\n\\t\\t\\t\\t/>\\r\\n\\t\\t\\t</svg>\\r\\n\\t\\t{/if}\\r\\n\\t\\t\\r\\n\\t\\t<!-- Temperature - Dead Center -->\\r\\n\\t\\t<div class=\\"temperature\\">\\r\\n\\t\\t\\t<span class=\\"temp-number\\">{displayTemp}</span><span class=\\"degree-symbol\\">\xB0{isCelsius ? 'C' : 'F'}</span>\\r\\n\\t\\t</div>\\r\\n\\t\\t\\r\\n\\t\\t<!-- Humidity - Below Temperature -->\\r\\n\\t\\t<div class=\\"humidity-center\\">\\r\\n\\t\\t\\t<span class=\\"humidity-value\\">{humidity}</span>\\r\\n\\t\\t\\t<span class=\\"humidity-symbols\\">\\r\\n\\t\\t\\t\\t<span class=\\"symbol-phi\\">\u03C6</span>\\r\\n\\t\\t\\t\\t<span class=\\"symbol-percent\\">%</span>\\r\\n\\t\\t\\t\\t<span class=\\"symbol-drop\\">\u{1F4A7}</span>\\r\\n\\t\\t\\t</span>\\r\\n\\t\\t</div>\\r\\n\\t\\t\\r\\n\\t\\t\\t<!-- Humidity Wave (at bottom) -->\\r\\n\\t\\t\\t<div class=\\"humidity\\">\\r\\n\\t\\t\\t\\t<div class=\\"humidity-wave\\"></div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\t\\r\\n\\t<!-- Time Test Slider (only shown when ?timeTest=true) -->\\r\\n\\t{#if timeTestMode}\\r\\n\\t\\t<div class=\\"time-test-slider\\">\\r\\n\\t\\t\\t<a href=\\"/\\" class=\\"close-time-test\\" data-sveltekit-reload title=\\"Disable Time Travel Mode\\">\\r\\n\\t\\t\\t\\t<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\">\\r\\n\\t\\t\\t\\t\\t<line x1=\\"18\\" y1=\\"6\\" x2=\\"6\\" y2=\\"18\\"/>\\r\\n\\t\\t\\t\\t\\t<line x1=\\"6\\" y1=\\"6\\" x2=\\"18\\" y2=\\"18\\"/>\\r\\n\\t\\t\\t\\t</svg>\\r\\n\\t\\t\\t</a>\\r\\n\\t\\t\\t<label for=\\"time-offset\\">\\r\\n\\t\\t\\t\\tTime: {testDateOffset === 0 ? 'Now' : \`\${Math.abs(testDateOffset)} mins ago\`}\\r\\n\\t\\t\\t</label>\\r\\n\\t\\t\\t<input \\r\\n\\t\\t\\t\\tid=\\"time-offset\\"\\r\\n\\t\\t\\t\\ttype=\\"range\\" \\r\\n\\t\\t\\t\\tmin=\\"-1440\\" \\r\\n\\t\\t\\t\\tmax=\\"0\\" \\r\\n\\t\\t\\t\\tstep=\\"10\\"\\r\\n\\t\\t\\t\\tbind:value={testDateOffset}\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<div class=\\"slider-labels\\">\\r\\n\\t\\t\\t\\t<span>24h ago</span>\\r\\n\\t\\t\\t\\t<span>12h ago</span>\\r\\n\\t\\t\\t\\t<span>Now</span>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t<div class=\\"time-test-info\\">\\r\\n\\t\\t\\t\\t\u2139\uFE0F Time travel currently changes the time but not  the weather data (YET!)\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t{:else}\\r\\n\\t\\t<div class=\\"time-test-link-container\\">\\r\\n\\t\\t\\t<a href=\\"/?timeTest=true\\" class=\\"time-test-link\\" data-sveltekit-reload>Enable Time Travel Mode</a>\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n\\t\\r\\n\\t<!-- Data Table -->\\r\\n\\t<div class=\\"data-table\\">\\r\\n\\t\\t<button class=\\"data-table-header\\" on:click={toggleDataTable}>\\r\\n\\t\\t\\t<h3>Lotsa Data</h3>\\r\\n\\t\\t\\t<svg \\r\\n\\t\\t\\t\\tclass=\\"collapse-icon\\" \\r\\n\\t\\t\\t\\tclass:collapsed={isDataTableCollapsed}\\r\\n\\t\\t\\t\\txmlns=\\"http://www.w3.org/2000/svg\\" \\r\\n\\t\\t\\t\\twidth=\\"20\\" \\r\\n\\t\\t\\t\\theight=\\"20\\" \\r\\n\\t\\t\\t\\tviewBox=\\"0 0 24 24\\" \\r\\n\\t\\t\\t\\tfill=\\"none\\" \\r\\n\\t\\t\\t\\tstroke=\\"currentColor\\" \\r\\n\\t\\t\\t\\tstroke-width=\\"2\\" \\r\\n\\t\\t\\t\\tstroke-linecap=\\"round\\" \\r\\n\\t\\t\\t\\tstroke-linejoin=\\"round\\"\\r\\n\\t\\t\\t>\\r\\n\\t\\t\\t\\t<polyline points=\\"6 9 12 15 18 9\\"></polyline>\\r\\n\\t\\t\\t</svg>\\r\\n\\t\\t</button>\\r\\n\\t\\t{#if !isDataTableCollapsed}\\r\\n\\t\\t<table>\\r\\n\\t\\t\\t<tbody>\\r\\n\\t\\t\\t\\t<!-- Time Data -->\\r\\n\\t\\t\\t\\t<tr class=\\"section-header\\">\\r\\n\\t\\t\\t\\t\\t<td colspan=\\"2\\">Time Information</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Current Time</td>\\r\\n\\t\\t\\t\\t\\t<td>{currentTime}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Current Date</td>\\r\\n\\t\\t\\t\\t\\t<td>{currentDate}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Timezone</td>\\r\\n\\t\\t\\t\\t\\t<td>{timezone || 'N/A'}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>UTC Offset</td>\\r\\n\\t\\t\\t\\t\\t<td>{timezoneOffset ? \`\${timezoneOffset > 0 ? '+' : ''}\${Math.round(timezoneOffset / 3600)} hours\` : 'N/A'}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t{#if timeTestMode}\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Time Travel Offset</td>\\r\\n\\t\\t\\t\\t\\t<td>{testDateOffset === 0 ? 'None (Now)' : \`\${Math.abs(testDateOffset)} minutes ago\`}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\r\\n\\t\\t\\t\\t<!-- Location Data -->\\r\\n\\t\\t\\t\\t<tr class=\\"section-header\\">\\r\\n\\t\\t\\t\\t\\t<td colspan=\\"2\\">Location Information</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Location</td>\\r\\n\\t\\t\\t\\t\\t<td>{location}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t{#if latitude !== null && longitude !== null}\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Coordinates</td>\\r\\n\\t\\t\\t\\t\\t<td>{latitude.toFixed(4)}\xB0, {longitude.toFixed(4)}\xB0</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Data Source</td>\\r\\n\\t\\t\\t\\t\\t<td>{savedZipCode ? \`ZIP Code (\${savedZipCode})\` : 'Browser Location'}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t\\r\\n\\t\\t\\t\\t<!-- Weather Data -->\\r\\n\\t\\t\\t\\t<tr class=\\"section-header\\">\\r\\n\\t\\t\\t\\t\\t<td colspan=\\"2\\">Weather Information</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Temperature</td>\\r\\n\\t\\t\\t\\t\\t<td>{displayTemp}\xB0{isCelsius ? 'C' : 'F'} ({temperature}\xB0F)</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Humidity</td>\\r\\n\\t\\t\\t\\t\\t<td>{humidity}%</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Condition</td>\\r\\n\\t\\t\\t\\t\\t<td>{condition.replace('-', ' ').replace(/\\\\b\\\\w/g, l => l.toUpperCase())}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t{#if description}\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Description</td>\\r\\n\\t\\t\\t\\t\\t<td>{description}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\r\\n\\t\\t\\t\\t<!-- Celestial Data -->\\r\\n\\t\\t\\t\\t<tr class=\\"section-header\\">\\r\\n\\t\\t\\t\\t\\t<td colspan=\\"2\\">Celestial Information</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t{#if sunrise}\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Sunrise</td>\\r\\n\\t\\t\\t\\t\\t<td>{new Date(sunrise * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t{#if sunset}\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Sunset</td>\\r\\n\\t\\t\\t\\t\\t<td>{new Date(sunset * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t{#if moonrise}\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Moonrise</td>\\r\\n\\t\\t\\t\\t\\t<td>{new Date(moonrise * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t{#if moonset}\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Moonset</td>\\r\\n\\t\\t\\t\\t\\t<td>{new Date(moonset * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Moon Phase</td>\\r\\n\\t\\t\\t\\t\\t<td>{(moonPhase * 100).toFixed(1)}% ({getMoonPhaseName(moonPhase)})</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Moon Scale</td>\\r\\n\\t\\t\\t\\t\\t<td>{moonScale.toFixed(2)}x</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Sun Position</td>\\r\\n\\t\\t\\t\\t\\t<td>X: {sunPosition.x.toFixed(1)}px, Y: {sunPosition.y.toFixed(1)}px</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Moon Position</td>\\r\\n\\t\\t\\t\\t\\t<td>X: {moonPosition.x.toFixed(1)}px, Y: {moonPosition.y.toFixed(1)}px</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t\\r\\n\\t\\t\\t\\t<!-- System Data -->\\r\\n\\t\\t\\t\\t<tr class=\\"section-header\\">\\r\\n\\t\\t\\t\\t\\t<td colspan=\\"2\\">System Information</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Last Update</td>\\r\\n\\t\\t\\t\\t\\t<td>{new Date(lastUpdate).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Current Timestamp</td>\\r\\n\\t\\t\\t\\t\\t<td>{currentTimestamp}</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t\\t<tr>\\r\\n\\t\\t\\t\\t\\t<td>Hourly Data Points</td>\\r\\n\\t\\t\\t\\t\\t<td>{hourlyData.length} hours</td>\\r\\n\\t\\t\\t\\t</tr>\\r\\n\\t\\t\\t</tbody>\\r\\n\\t\\t</table>\\r\\n\\t\\t{/if}\\r\\n\\t</div>\\r\\n\\t{:else}\\r\\n\\t\\t<!-- No Location Message -->\\r\\n\\t\\t<div class=\\"no-location-message\\">\\r\\n\\t\\t\\t<p>Set location for weather widget</p>\\r\\n\\t\\t\\t<button on:click={requestBrowserLocation} class=\\"share-location-button\\">\\r\\n\\t\\t\\t\\tShare location from device\\r\\n\\t\\t\\t</button>\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n\\t\\r\\n\\t<!-- Zip Code Entry Form (always visible) -->\\r\\n\\t<div class=\\"location-controls\\">\\r\\n\\t\\t<form on:submit|preventDefault={handleZipCodeSubmit} class=\\"zip-form\\">\\r\\n\\t\\t\\t<input \\r\\n\\t\\t\\t\\ttype=\\"text\\" \\r\\n\\t\\t\\t\\tbind:value={zipCodeInput}\\r\\n\\t\\t\\t\\tplaceholder=\\"Enter ZIP code\\"\\r\\n\\t\\t\\t\\tinputmode=\\"numeric\\"\\r\\n\\t\\t\\t\\tmaxlength=\\"5\\"\\r\\n\\t\\t\\t\\tclass=\\"zip-input\\"\\r\\n\\t\\t\\t/>\\r\\n\\t\\t\\t<button type=\\"submit\\" class=\\"zip-submit\\">\\r\\n\\t\\t\\t\\tSet Location\\r\\n\\t\\t\\t</button>\\r\\n\\t\\t</form>\\r\\n\\t\\t{#if savedZipCode}\\r\\n\\t\\t\\t<button on:click={handleResetLocation} class=\\"reset-button\\" title=\\"Reset to Browser Location\\">\\r\\n\\t\\t\\t\\t<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"18\\" height=\\"18\\" viewBox=\\"0 0 24 24\\" fill=\\"currentColor\\">\\r\\n\\t\\t\\t\\t\\t<path d=\\"M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z\\"/>\\r\\n\\t\\t\\t\\t</svg>\\r\\n\\t\\t\\t</button>\\r\\n\\t\\t{/if}\\r\\n\\t</div>\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.weather-widget {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tgap: 1.5rem;\\r\\n\\t\\tpadding: 2rem;\\r\\n\\t\\tmin-height: 400px;\\r\\n\\t\\tposition: relative;\\r\\n\\t}\\r\\n\\r\\n\\t.celestial-container {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\twidth: var(--earth-size, 320px);\\r\\n\\t\\theight: var(--earth-size, 320px);\\r\\n\\t\\tflex-shrink: 0;\\r\\n\\t\\tpadding: 40px;\\r\\n\\t\\tbox-sizing: content-box;\\r\\n\\t\\topacity: 0;\\r\\n\\t\\ttransition: opacity 0.8s ease-in-out;\\r\\n\\t}\\r\\n\\r\\n\\t.celestial-container.loaded {\\r\\n\\t\\topacity: 1;\\r\\n\\t}\\r\\n\\r\\n\\t.earth {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\twidth: var(--earth-size, 320px);\\r\\n\\t\\theight: var(--earth-size, 320px);\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tbox-shadow: 0 8px 32px var(--shadow);\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\ttransition: background 1s ease, color 1s ease;\\r\\n\\t\\toverflow: hidden;\\r\\n\\t\\tflex-shrink: 0;\\r\\n\\t\\taspect-ratio: 1 / 1;\\r\\n\\t}\\r\\n\\r\\n\\t.sun,\\r\\n\\t.moon {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\twidth: calc(var(--earth-size, 320px) * 0.1875); /* 60px / 320px = 0.1875 */\\r\\n\\t\\theight: calc(var(--earth-size, 320px) * 0.1875);\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\ttransition: all 0.3s ease;\\r\\n\\t\\tz-index: 0;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.sun {\\r\\n\\t\\ttransform: translate(-50%, -50%); /* Center the celestial body on its position */\\r\\n\\t\\tbackground: radial-gradient(circle, #ff9d5c 0%, #e8754a 100%);\\r\\n\\t\\tbox-shadow: 0 0 30px rgba(255, 157, 92, 0.6);\\r\\n\\t}\\r\\n\\r\\n\\t.moon {\\r\\n\\t\\tbackground: radial-gradient(circle, #f5e6d3 0%, #d4c5b0 100%);\\r\\n\\t\\tbox-shadow: 0 0 20px rgba(245, 230, 211, 0.4);\\r\\n\\t\\toverflow: hidden;\\r\\n\\t}\\r\\n\\r\\n\\t.moon-surface {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 0;\\r\\n\\t\\tleft: 0;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tbackground: radial-gradient(circle, #f5e6d3 0%, #d4c5b0 100%);\\r\\n\\t\\tz-index: 1;\\r\\n\\t}\\r\\n\\r\\n\\t.moon-shadow {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 0;\\r\\n\\t\\tleft: 0;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tbackground: radial-gradient(circle, rgba(20, 15, 25, 0.95) 0%, rgba(40, 35, 45, 0.9) 100%);\\r\\n\\t\\tz-index: 2;\\r\\n\\t\\ttransition: transform 0.3s ease, opacity 0.3s ease;\\r\\n\\t}\\r\\n\\r\\n\\t.moon-crescent {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 5px;\\r\\n\\t\\tright: 8px;\\r\\n\\t\\twidth: 30px;\\r\\n\\t\\theight: 30px;\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tbackground: radial-gradient(circle, rgba(180, 150, 130, 0.3) 0%, rgba(140, 120, 100, 0.5) 100%);\\r\\n\\t\\tbox-shadow: inset -4px -2px 8px rgba(0, 0, 0, 0.2);\\r\\n\\t\\tz-index: 3;\\r\\n\\t}\\r\\n\\r\\n\\t.unit-switch-container {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 0;\\r\\n\\t\\tright: 0;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tbackground: var(--surface);\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 8px;\\r\\n\\t\\toverflow: hidden;\\r\\n\\t\\tbox-shadow: 0 2px 8px var(--shadow);\\r\\n\\t}\\r\\n\\r\\n\\t.unit-option {\\r\\n\\t\\tpadding: 0.4rem 0.8rem;\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tbackground: transparent;\\r\\n\\t\\tborder: none;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t\\tmin-width: 40px;\\r\\n\\t}\\r\\n\\r\\n\\t.unit-option:hover {\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t}\\r\\n\\r\\n\\t.unit-option.active {\\r\\n\\t\\tbackground: var(--primary-color);\\r\\n\\t\\tcolor: white;\\r\\n\\t}\\r\\n\\r\\n\\t.time {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tz-index: 3;\\r\\n\\t\\tfont-size: 1.75rem;\\r\\n\\t\\tfont-weight: 300;\\r\\n\\t\\tcolor: var(--text-color, var(--text-primary));\\r\\n\\t\\tletter-spacing: 0.5px;\\r\\n\\t\\ttext-shadow: 0 2px 4px var(--shadow);\\r\\n\\t\\tfont-variant-numeric: tabular-nums;\\r\\n\\t}\\r\\n\\r\\n\\t.date {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tz-index: 3;\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\tcolor: var(--text-color, var(--text-secondary));\\r\\n\\t\\topacity: 0.7;\\r\\n\\t\\tmargin-top: 0.25rem;\\r\\n\\t\\ttext-shadow: 0 1px 2px var(--shadow);\\r\\n\\t}\\r\\n\\r\\n\\t.location {\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tz-index: 3;\\r\\n\\t\\tfont-size: 1rem;\\r\\n\\t\\tcolor: var(--text-color, var(--text-primary));\\r\\n\\t\\topacity: 0.8;\\r\\n\\t\\tmargin-top: 0.5rem;\\r\\n\\t\\ttext-shadow: 0 1px 2px var(--shadow);\\r\\n\\t}\\r\\n\\r\\n\\t.time-date-section {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 0.9rem;\\r\\n\\t\\tleft: 50%;\\r\\n\\t\\ttransform: translateX(-50%);\\r\\n\\t\\tz-index: 3;\\r\\n\\t\\ttext-align: center;\\r\\n\\t\\twidth: 100%;\\r\\n\\t}\\r\\n\\r\\n\\t.temperature {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 50%;\\r\\n\\t\\tleft: 50%;\\r\\n\\t\\ttransform: translate(-50%, -50%);\\r\\n\\t\\tz-index: 2;\\r\\n\\t\\tfont-size: 5rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tcolor: var(--text-color, var(--text-primary));\\r\\n\\t\\tline-height: 1;\\r\\n\\t\\ttext-shadow: \\r\\n\\t\\t\\t0 2px 4px var(--shadow),\\r\\n\\t\\t\\t0 4px 8px var(--shadow),\\r\\n\\t\\t\\t0 0 20px var(--shadow);\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: flex-start;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t}\\r\\n\\r\\n\\t.degree-symbol {\\r\\n\\t\\tfont-size: 2.5rem;\\r\\n\\t\\tmargin-left: 0.25rem;\\r\\n\\t\\tmargin-top: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.humidity-center {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 50%;\\r\\n\\t\\tleft: 50%;\\r\\n\\t\\ttransform: translateX(-50%);\\r\\n\\t\\tmargin-top: 3rem;\\r\\n\\t\\tz-index: 2;\\r\\n\\t\\tfont-size: 1.5rem;\\r\\n\\t\\tfont-weight: 300;\\r\\n\\t\\tcolor: var(--text-color, var(--text-primary));\\r\\n\\t\\ttext-shadow: 0 2px 4px var(--shadow);\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tgap: 0.3rem;\\r\\n\\t}\\r\\n\\r\\n\\t.humidity-value {\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tfont-size: 1.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.humidity-symbols {\\r\\n\\t\\tdisplay: grid;\\r\\n\\t\\tgrid-template-columns: auto auto;\\r\\n\\t\\tgrid-template-rows: auto auto;\\r\\n\\t\\tgap: 0.1rem;\\r\\n\\t\\tfont-size: 0.7rem;\\r\\n\\t\\topacity: 0.8;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-items: center;\\r\\n\\t}\\r\\n\\r\\n\\t.symbol-phi {\\r\\n\\t\\tgrid-column: 1 / 3;\\r\\n\\t\\tgrid-row: 1;\\r\\n\\t\\tfont-size: 0.7rem;\\r\\n\\t}\\r\\n\\r\\n\\t.symbol-percent {\\r\\n\\t\\tgrid-column: 1;\\r\\n\\t\\tgrid-row: 2;\\r\\n\\t\\tfont-size: 0.7rem;\\r\\n\\t}\\r\\n\\r\\n\\t.symbol-drop {\\r\\n\\t\\tgrid-column: 2;\\r\\n\\t\\tgrid-row: 2;\\r\\n\\t\\tfont-size: 0.7rem;\\r\\n\\t}\\r\\n\\r\\n\\t.temp-graph-svg {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 50%;\\r\\n\\t\\tleft: 50%;\\r\\n\\t\\ttransform: translate(-50%, -50%);\\r\\n\\t\\tz-index: 1;\\r\\n\\t\\topacity: 0.7;\\r\\n\\t}\\r\\n\\r\\n\\t.humidity {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\tbottom: 0;\\r\\n\\t\\tleft: 0;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 60px;\\r\\n\\t\\tz-index: 0;\\r\\n\\t}\\r\\n\\r\\n\\t.humidity-wave {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\tbottom: 0;\\r\\n\\t\\tleft: 0;\\r\\n\\t\\tright: 0;\\r\\n\\t\\theight: 40px;\\r\\n\\t\\tbackground: linear-gradient(180deg, \\r\\n\\t\\t\\trgba(100, 150, 200, 0.3) 0%,\\r\\n\\t\\t\\trgba(80, 130, 180, 0.4) 50%,\\r\\n\\t\\t\\trgba(60, 110, 160, 0.5) 100%\\r\\n\\t\\t);\\r\\n\\t\\tborder-radius: 0 0 160px 160px;\\r\\n\\t\\tclip-path: ellipse(160px 40px at 50% 100%);\\r\\n\\t}\\r\\n\\r\\n\\t/* Time Test Slider */\\r\\n\\t.time-test-slider {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tmax-width: 320px;\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t\\tborder-radius: 12px;\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t\\tposition: relative;\\r\\n\\t}\\r\\n\\r\\n\\t.close-time-test {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 0.5rem;\\r\\n\\t\\tright: 0.5rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\twidth: 24px;\\r\\n\\t\\theight: 24px;\\r\\n\\t\\tborder-radius: 4px;\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t}\\r\\n\\r\\n\\t.close-time-test:hover {\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tbackground: var(--surface-container-high);\\r\\n\\t}\\r\\n\\r\\n\\t.time-test-info {\\r\\n\\t\\tpadding: 0.625rem 0.75rem;\\r\\n\\t\\tbackground: color-mix(in srgb, var(--primary-color) 10%, transparent);\\r\\n\\t\\tborder: 1px solid color-mix(in srgb, var(--primary-color) 20%, transparent);\\r\\n\\t\\tborder-radius: 6px;\\r\\n\\t\\tcolor: var(--primary-color);\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\ttext-align: center;\\r\\n\\t\\tmargin-top: 0.25rem;\\r\\n\\t}\\r\\n\\r\\n\\t.time-test-slider label {\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tfont-weight: 500;\\r\\n\\t\\ttext-align: center;\\r\\n\\t}\\r\\n\\r\\n\\t.time-test-slider input[type=\\"range\\"] {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 6px;\\r\\n\\t\\tbackground: var(--surface-container-high);\\r\\n\\t\\tborder-radius: 3px;\\r\\n\\t\\toutline: none;\\r\\n\\t\\tappearance: none;\\r\\n\\t\\t-webkit-appearance: none;\\r\\n\\t}\\r\\n\\r\\n\\t.time-test-slider input[type=\\"range\\"]::-webkit-slider-thumb {\\r\\n\\t\\t-webkit-appearance: none;\\r\\n\\t\\tappearance: none;\\r\\n\\t\\twidth: 18px;\\r\\n\\t\\theight: 18px;\\r\\n\\t\\tbackground: var(--text-primary);\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\tbox-shadow: 0 2px 4px var(--shadow);\\r\\n\\t}\\r\\n\\r\\n\\t.time-test-slider input[type=\\"range\\"]::-moz-range-thumb {\\r\\n\\t\\twidth: 18px;\\r\\n\\t\\theight: 18px;\\r\\n\\t\\tbackground: var(--text-primary);\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\tborder: none;\\r\\n\\t\\tbox-shadow: 0 2px 4px var(--shadow);\\r\\n\\t}\\r\\n\\r\\n\\t.slider-labels {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t}\\r\\n\\r\\n\\t/* Time Test Link */\\r\\n\\t.time-test-link-container {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tmax-width: 320px;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tmargin-top: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.time-test-link {\\r\\n\\t\\tfont-size: 0.8125rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t\\tpadding: 0.5rem 1rem;\\r\\n\\t\\tborder-radius: 6px;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t}\\r\\n\\r\\n\\t.time-test-link:hover {\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t}\\r\\n\\r\\n\\t/* No Location Message */\\r\\n\\t.no-location-message {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tgap: 1rem;\\r\\n\\t\\tmin-height: 400px;\\r\\n\\t\\twidth: 100%;\\r\\n\\t}\\r\\n\\r\\n\\t.no-location-message p {\\r\\n\\t\\tfont-size: 1.125rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\ttext-align: center;\\r\\n\\t\\tmargin: 0;\\r\\n\\t}\\r\\n\\r\\n\\t.share-location-button {\\r\\n\\t\\tpadding: 0.75rem 1.5rem;\\r\\n\\t\\tfont-size: 0.9375rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tbackground: color-mix(in srgb, var(--primary-color) 20%, transparent);\\r\\n\\t\\tborder: 1px solid color-mix(in srgb, var(--primary-color) 40%, transparent);\\r\\n\\t\\tborder-radius: 8px;\\r\\n\\t\\tcolor: var(--primary-color);\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t}\\r\\n\\r\\n\\t.share-location-button:hover {\\r\\n\\t\\tbackground: color-mix(in srgb, var(--primary-color) 30%, transparent);\\r\\n\\t\\tborder-color: color-mix(in srgb, var(--primary-color) 60%, transparent);\\r\\n\\t\\ttransform: translateY(-1px);\\r\\n\\t}\\r\\n\\r\\n\\t.share-location-button:active {\\r\\n\\t\\ttransform: translateY(0);\\r\\n\\t}\\r\\n\\r\\n\\t/* Location Controls */\\r\\n\\t.location-controls {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tmax-width: 320px;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tgap: 0.75rem;\\r\\n\\t\\tmargin-top: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.zip-form {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t\\twidth: 100%;\\r\\n\\t}\\r\\n\\r\\n\\t.zip-input {\\r\\n\\t\\tflex: 1;\\r\\n\\t\\tpadding: 0.6rem 0.875rem;\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 8px;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\toutline: none;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t\\tfont-family: inherit;\\r\\n\\t}\\r\\n\\r\\n\\t.zip-input::placeholder {\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t}\\r\\n\\r\\n\\t.zip-input:focus {\\r\\n\\t\\tbackground: var(--surface-container-high);\\r\\n\\t\\tborder-color: var(--outline-variant);\\r\\n\\t\\tbox-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 10%, transparent);\\r\\n\\t}\\r\\n\\r\\n\\t.zip-submit {\\r\\n\\t\\tpadding: 0.6rem 1.25rem;\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tbackground: var(--surface-container-high);\\r\\n\\t\\tborder: 1px solid var(--outline-variant);\\r\\n\\t\\tborder-radius: 8px;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t\\twhite-space: nowrap;\\r\\n\\t}\\r\\n\\r\\n\\t.zip-submit:hover {\\r\\n\\t\\tbackground: var(--surface-container-highest);\\r\\n\\t\\tborder-color: var(--outline-variant);\\r\\n\\t}\\r\\n\\r\\n\\t.zip-submit:active {\\r\\n\\t\\ttransform: scale(0.98);\\r\\n\\t}\\r\\n\\r\\n\\t.reset-button {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tpadding: 0.6rem;\\r\\n\\t\\tbackground: color-mix(in srgb, var(--primary-color) 15%, transparent);\\r\\n\\t\\tborder: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);\\r\\n\\t\\tborder-radius: 8px;\\r\\n\\t\\tcolor: var(--primary-color);\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t}\\r\\n\\r\\n\\t.reset-button:hover {\\r\\n\\t\\tbackground: color-mix(in srgb, var(--primary-color) 25%, transparent);\\r\\n\\t\\tborder-color: color-mix(in srgb, var(--primary-color) 40%, transparent);\\r\\n\\t}\\r\\n\\r\\n\\t.reset-button:active {\\r\\n\\t\\ttransform: scale(0.98);\\r\\n\\t}\\r\\n\\r\\n\\t/* Data Table */\\r\\n\\t.data-table {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tmax-width: 500px;\\r\\n\\t\\tmargin-top: 1.5rem;\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 12px;\\r\\n\\t\\tbackdrop-filter: blur(10px);\\r\\n\\t\\toverflow: hidden;\\r\\n\\t}\\r\\n\\r\\n\\t.data-table-header {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tbackground: transparent;\\r\\n\\t\\tborder: none;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: background 0.2s ease;\\r\\n\\t}\\r\\n\\r\\n\\t.data-table-header:hover {\\r\\n\\t\\tbackground: var(--surface-container-high);\\r\\n\\t}\\r\\n\\r\\n\\t.data-table-header h3 {\\r\\n\\t\\tmargin: 0;\\r\\n\\t\\tfont-size: 1rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\ttext-align: left;\\r\\n\\t}\\r\\n\\r\\n\\t.collapse-icon {\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\ttransition: transform 0.3s ease;\\r\\n\\t\\tflex-shrink: 0;\\r\\n\\t}\\r\\n\\r\\n\\t.collapse-icon.collapsed {\\r\\n\\t\\ttransform: rotate(-90deg);\\r\\n\\t}\\r\\n\\r\\n\\t.data-table table {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tborder-collapse: collapse;\\r\\n\\t\\tfont-size: 0.8125rem;\\r\\n\\t\\tpadding: 0 1rem 1rem;\\r\\n\\t}\\r\\n\\r\\n\\t.data-table tbody tr {\\r\\n\\t\\tborder-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);\\r\\n\\t}\\r\\n\\r\\n\\t.data-table tbody tr:last-child {\\r\\n\\t\\tborder-bottom: none;\\r\\n\\t}\\r\\n\\r\\n\\t.data-table tbody tr.section-header {\\r\\n\\t\\tborder-bottom: 1px solid var(--border);\\r\\n\\t}\\r\\n\\r\\n\\t.data-table tbody tr.section-header td {\\r\\n\\t\\tpadding: 0.75rem 0.5rem 0.5rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\ttext-transform: uppercase;\\r\\n\\t\\tletter-spacing: 0.05em;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\ttext-align: left;\\r\\n\\t}\\r\\n\\r\\n\\t.data-table tbody tr.section-header:first-child td {\\r\\n\\t\\tpadding-top: 0;\\r\\n\\t}\\r\\n\\r\\n\\t.data-table td {\\r\\n\\t\\tpadding: 0.5rem;\\r\\n\\t\\tcolor: var(--on-surface);\\r\\n\\t}\\r\\n\\r\\n\\t.data-table td:first-child {\\r\\n\\t\\tfont-weight: 500;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\twidth: 45%;\\r\\n\\t}\\r\\n\\r\\n\\t.data-table td:last-child {\\r\\n\\t\\ttext-align: right;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tfont-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;\\r\\n\\t}\\r\\n\\r\\n\\t/* Responsive adjustments */\\r\\n\\t@media (max-width: 768px) {\\r\\n\\t\\t.time {\\r\\n\\t\\t\\tfont-size: 1.5rem;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.temperature {\\r\\n\\t\\t\\tfont-size: 4rem;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.data-table {\\r\\n\\t\\t\\tmax-width: 100%;\\r\\n\\t\\t\\tfont-size: 0.75rem;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.data-table td {\\r\\n\\t\\t\\tpadding: 0.4rem;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"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"}`
    };
    WeatherWidget = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let condition = "partly-cloudy";
      let hourlyData = [];
      let currentTimestamp = Date.now();
      let earthSize = 320;
      let padding = 40;
      let zipCodeInput = "";
      let testDateOffset = 0;
      function getSunPosition(testDate) {
        let sunriseTime = 6 * 3600;
        let sunsetTime = 18 * 3600;
        const secondsSinceMidnight = testDate.getHours() * 3600 + testDate.getMinutes() * 60 + testDate.getSeconds();
        const earthRadius = earthSize / 2;
        const sunRadius = earthSize * 0.09375;
        let angle;
        let orbitRadius;
        if (secondsSinceMidnight >= sunriseTime && secondsSinceMidnight <= sunsetTime) {
          const solarNoonTime = (sunriseTime + sunsetTime) / 2;
          if (secondsSinceMidnight <= solarNoonTime) {
            const morningDuration = solarNoonTime - sunriseTime;
            const morningProgress = (secondsSinceMidnight - sunriseTime) / morningDuration;
            angle = -Math.PI / 2 + morningProgress * Math.PI / 2;
            const expansionProgress = Math.sin(morningProgress * Math.PI / 2);
            const minOrbitRadius = earthRadius + sunRadius * 0.1;
            const maxOrbitRadius = earthRadius + sunRadius;
            orbitRadius = minOrbitRadius + expansionProgress * (maxOrbitRadius - minOrbitRadius);
          } else {
            const afternoonDuration = sunsetTime - solarNoonTime;
            const afternoonProgress = (secondsSinceMidnight - solarNoonTime) / afternoonDuration;
            angle = 0 + afternoonProgress * Math.PI / 2;
            const contractionProgress = Math.cos(afternoonProgress * Math.PI / 2);
            const minOrbitRadius = earthRadius + sunRadius * 0.1;
            const maxOrbitRadius = earthRadius + sunRadius;
            orbitRadius = minOrbitRadius + contractionProgress * (maxOrbitRadius - minOrbitRadius);
          }
        } else {
          const solarMidnightTime = (sunsetTime + sunriseTime + 86400) / 2;
          const nightOrbitRadius = earthRadius - sunRadius * 1.5;
          if (secondsSinceMidnight <= sunriseTime) {
            const effectiveMidnight = solarMidnightTime;
            const preSunriseDuration = sunriseTime - effectiveMidnight;
            const preSunriseProgress = (secondsSinceMidnight - effectiveMidnight) / preSunriseDuration;
            angle = Math.PI + preSunriseProgress * Math.PI / 2;
            orbitRadius = nightOrbitRadius;
          } else {
            const effectiveMidnight = solarMidnightTime;
            const postSunsetDuration = effectiveMidnight + 0 - sunsetTime;
            const postSunsetProgress = (secondsSinceMidnight - sunsetTime) / postSunsetDuration;
            angle = Math.PI / 2 + postSunsetProgress * Math.PI / 2;
            orbitRadius = nightOrbitRadius;
          }
        }
        angle = angle - Math.PI / 2;
        const x3 = padding + earthSize / 2 + Math.cos(angle) * orbitRadius;
        const y2 = padding + earthSize / 2 + Math.sin(angle) * orbitRadius;
        return { x: x3, y: y2 };
      }
      __name(getSunPosition, "getSunPosition");
      function getMoonPosition(testDate) {
        const secondsSinceMidnight = testDate.getHours() * 3600 + testDate.getMinutes() * 60 + testDate.getSeconds();
        let moonriseTime = 18 * 3600;
        let moonsetTime = 6 * 3600;
        const earthRadius = earthSize / 2;
        const moonRadius = earthSize * 0.09375;
        const visibleOrbitRadius = earthRadius + moonRadius;
        const hiddenOrbitRadius = earthRadius + moonRadius * 0.5;
        const horizonScaleDuration = 30 * 60;
        const maxScale = 1.9;
        const normalScale = 1;
        const hiddenScale = 0.7;
        let scale = normalScale;
        let angle;
        let orbitRadius;
        {
          if (secondsSinceMidnight >= moonriseTime || secondsSinceMidnight <= moonsetTime) {
            const visibleDuration = 86400 - moonriseTime + moonsetTime;
            let visibleProgress;
            let timeSinceRise, timeBeforeSet;
            if (secondsSinceMidnight >= moonriseTime) {
              visibleProgress = (secondsSinceMidnight - moonriseTime) / visibleDuration;
              timeSinceRise = secondsSinceMidnight - moonriseTime;
              timeBeforeSet = 86400 - secondsSinceMidnight + moonsetTime;
            } else {
              visibleProgress = (86400 - moonriseTime + secondsSinceMidnight) / visibleDuration;
              timeSinceRise = 86400 - moonriseTime + secondsSinceMidnight;
              timeBeforeSet = moonsetTime - secondsSinceMidnight;
            }
            angle = -Math.PI / 2 + visibleProgress * Math.PI;
            orbitRadius = visibleOrbitRadius;
            if (timeSinceRise <= horizonScaleDuration) {
              const scaleProgress = timeSinceRise / horizonScaleDuration;
              scale = maxScale - scaleProgress * (maxScale - normalScale);
            } else if (timeBeforeSet <= horizonScaleDuration) {
              const scaleProgress = timeBeforeSet / horizonScaleDuration;
              scale = maxScale - scaleProgress * (maxScale - normalScale);
            }
          } else {
            const hiddenDuration = moonriseTime - moonsetTime;
            const hiddenProgress = (secondsSinceMidnight - moonsetTime) / hiddenDuration;
            angle = Math.PI / 2 + hiddenProgress * Math.PI;
            orbitRadius = hiddenOrbitRadius;
            scale = hiddenScale;
          }
        }
        angle = angle - Math.PI / 2;
        const x3 = padding + earthSize / 2 + Math.cos(angle) * orbitRadius;
        const y2 = padding + earthSize / 2 + Math.sin(angle) * orbitRadius;
        return { x: x3, y: y2, scale };
      }
      __name(getMoonPosition, "getMoonPosition");
      $$result.css.add(css$8);
      generateTemperaturePath(hourlyData);
      {
        {
          const now2 = /* @__PURE__ */ new Date();
          const hours = now2.getHours() + now2.getMinutes() / 60;
          if (hours >= 6 && hours < 18) {
            condition = "partly-cloudy";
          } else {
            condition = "night";
          }
        }
      }
      {
        if (currentTimestamp && testDateOffset !== void 0) {
          const now2 = new Date(currentTimestamp);
          let testDate;
          {
            testDate = now2;
          }
          getSunPosition(testDate);
          getMoonPosition(testDate);
          calculateMoonPhase(testDate);
          let displayHour;
          {
            displayHour = testDate.getHours();
          }
          calculateEarthColor(displayHour, condition);
        }
      }
      return `<div class="${["weather-widget svelte-dc2hjj", ""].join(" ").trim()}">${` <div class="no-location-message svelte-dc2hjj"><p class="svelte-dc2hjj" data-svelte-h="svelte-5dijxk">Set location for weather widget</p> <button class="share-location-button svelte-dc2hjj" data-svelte-h="svelte-1szv6w0">Share location from device</button></div>`}  <div class="location-controls svelte-dc2hjj"><form class="zip-form svelte-dc2hjj"><input type="text" placeholder="Enter ZIP code" inputmode="numeric" maxlength="5" class="zip-input svelte-dc2hjj"${add_attribute("value", zipCodeInput, 0)}> <button type="submit" class="zip-submit svelte-dc2hjj" data-svelte-h="svelte-l7q2lc">Set Location</button></form> ${``}</div> </div>`;
    });
    css$7 = {
      code: ".traffic-widget.svelte-4ec5kw{display:flex;flex-direction:column;height:100%;min-height:300px}.map-container.svelte-4ec5kw{width:100%;height:100%;min-height:300px;border-radius:0.5rem;overflow:hidden;background-color:rgba(0, 0, 0, 0.2)}.placeholder.svelte-4ec5kw{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;min-height:300px;background-color:rgba(0, 0, 0, 0.2);border-radius:0.5rem;border:2px dashed rgba(255, 255, 255, 0.2)}.placeholder-text.svelte-4ec5kw{font-size:1.125rem;font-weight:500;color:var(--text-primary);margin-bottom:0.5rem}.placeholder-hint.svelte-4ec5kw{font-size:0.875rem;color:var(--text-secondary)}.loading-text.svelte-4ec5kw{font-size:1rem;color:var(--text-secondary)}",
      map: '{"version":3,"file":"TrafficWidget.svelte","sources":["TrafficWidget.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount, onDestroy } from \\"svelte\\";\\nimport { browser } from \\"$app/environment\\";\\nimport { theme } from \\"$lib/stores/theme\\";\\nconst ZIP_CODE_KEY = \\"dashboard-zip-code\\";\\nconst WEATHER_CACHE_KEY = \\"dashboard-weather-data\\";\\nlet hasLocation = false;\\nlet mapCenter = { lat: 0, lng: 0 };\\nlet isLoading = true;\\nlet mapContainer;\\nlet map = null;\\nlet trafficLayer = null;\\nlet googleMapsApiKey = \\"\\";\\nlet apiKeyError = false;\\nlet currentTheme = \\"dark\\";\\nconst darkMapStyles = [\\n  { elementType: \\"geometry\\", stylers: [{ color: \\"#242f3e\\" }] },\\n  { elementType: \\"labels.text.stroke\\", stylers: [{ color: \\"#242f3e\\" }] },\\n  { elementType: \\"labels.text.fill\\", stylers: [{ color: \\"#746855\\" }] },\\n  {\\n    featureType: \\"administrative.locality\\",\\n    elementType: \\"labels.text.fill\\",\\n    stylers: [{ color: \\"#d59563\\" }]\\n  },\\n  {\\n    featureType: \\"poi\\",\\n    elementType: \\"labels.text.fill\\",\\n    stylers: [{ color: \\"#d59563\\" }]\\n  },\\n  {\\n    featureType: \\"poi.park\\",\\n    elementType: \\"geometry\\",\\n    stylers: [{ color: \\"#263c3f\\" }]\\n  },\\n  {\\n    featureType: \\"poi.park\\",\\n    elementType: \\"labels.text.fill\\",\\n    stylers: [{ color: \\"#6b9a76\\" }]\\n  },\\n  {\\n    featureType: \\"road\\",\\n    elementType: \\"geometry\\",\\n    stylers: [{ color: \\"#38414e\\" }]\\n  },\\n  {\\n    featureType: \\"road\\",\\n    elementType: \\"geometry.stroke\\",\\n    stylers: [{ color: \\"#212a37\\" }]\\n  },\\n  {\\n    featureType: \\"road\\",\\n    elementType: \\"labels.text.fill\\",\\n    stylers: [{ color: \\"#9ca5b3\\" }]\\n  },\\n  {\\n    featureType: \\"road.highway\\",\\n    elementType: \\"geometry\\",\\n    stylers: [{ color: \\"#746855\\" }]\\n  },\\n  {\\n    featureType: \\"road.highway\\",\\n    elementType: \\"geometry.stroke\\",\\n    stylers: [{ color: \\"#1f2835\\" }]\\n  },\\n  {\\n    featureType: \\"road.highway\\",\\n    elementType: \\"labels.text.fill\\",\\n    stylers: [{ color: \\"#f3d19c\\" }]\\n  },\\n  {\\n    featureType: \\"transit\\",\\n    elementType: \\"geometry\\",\\n    stylers: [{ color: \\"#2f3948\\" }]\\n  },\\n  {\\n    featureType: \\"transit.station\\",\\n    elementType: \\"labels.text.fill\\",\\n    stylers: [{ color: \\"#d59563\\" }]\\n  },\\n  {\\n    featureType: \\"water\\",\\n    elementType: \\"geometry\\",\\n    stylers: [{ color: \\"#17263c\\" }]\\n  },\\n  {\\n    featureType: \\"water\\",\\n    elementType: \\"labels.text.fill\\",\\n    stylers: [{ color: \\"#515c6d\\" }]\\n  },\\n  {\\n    featureType: \\"water\\",\\n    elementType: \\"labels.text.stroke\\",\\n    stylers: [{ color: \\"#17263c\\" }]\\n  }\\n];\\nconst lightMapStyles = [];\\nfunction getCurrentTheme() {\\n  if (!browser) return \\"dark\\";\\n  const isDark = document.documentElement.classList.contains(\\"dark\\");\\n  return isDark ? \\"dark\\" : \\"light\\";\\n}\\n$: if (browser) {\\n  currentTheme = getCurrentTheme();\\n}\\nasync function loadGoogleMapsApiKey() {\\n  try {\\n    const response = await fetch(\\"/api/maps-config\\");\\n    const data = await response.json();\\n    if (data.error) {\\n      console.error(\\"Google Maps API key error:\\", data.error);\\n      apiKeyError = true;\\n      return false;\\n    }\\n    googleMapsApiKey = data.apiKey;\\n    return true;\\n  } catch (error) {\\n    console.error(\\"Error loading Google Maps API key:\\", error);\\n    apiKeyError = true;\\n    return false;\\n  }\\n}\\nfunction loadGoogleMapsScript() {\\n  return new Promise((resolve, reject) => {\\n    if (typeof google !== \\"undefined\\" && google.maps) {\\n      resolve();\\n      return;\\n    }\\n    const script = document.createElement(\\"script\\");\\n    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&v=weekly`;\\n    script.async = true;\\n    script.defer = true;\\n    script.onload = () => resolve();\\n    script.onerror = () => reject(new Error(\\"Failed to load Google Maps API\\"));\\n    document.head.appendChild(script);\\n  });\\n}\\nfunction initMap() {\\n  if (!mapContainer || !hasLocation) return;\\n  const mapStyles = currentTheme === \\"dark\\" ? darkMapStyles : lightMapStyles;\\n  map = new google.maps.Map(mapContainer, {\\n    zoom: 13,\\n    center: mapCenter,\\n    mapTypeControl: true,\\n    streetViewControl: false,\\n    fullscreenControl: true,\\n    styles: mapStyles\\n  });\\n  trafficLayer = new google.maps.TrafficLayer();\\n  trafficLayer.setMap(map);\\n}\\nfunction updateMapTheme() {\\n  if (!map) return;\\n  const mapStyles = currentTheme === \\"dark\\" ? darkMapStyles : lightMapStyles;\\n  map.setOptions({ styles: mapStyles });\\n}\\nasync function loadLocationData() {\\n  if (!browser) return;\\n  const savedZip = localStorage.getItem(ZIP_CODE_KEY);\\n  if (savedZip) {\\n    await getCoordinatesFromZipCode(savedZip);\\n    return;\\n  }\\n  const cachedWeather = localStorage.getItem(WEATHER_CACHE_KEY);\\n  if (cachedWeather) {\\n    try {\\n      const data = JSON.parse(cachedWeather);\\n      if (data.location) {\\n        if (navigator.geolocation) {\\n          navigator.geolocation.getCurrentPosition(\\n            (position) => {\\n              mapCenter = {\\n                lat: position.coords.latitude,\\n                lng: position.coords.longitude\\n              };\\n              hasLocation = true;\\n              isLoading = false;\\n            },\\n            () => {\\n              isLoading = false;\\n            }\\n          );\\n        } else {\\n          isLoading = false;\\n        }\\n        return;\\n      }\\n    } catch (e) {\\n      console.log(\\"Could not parse cached weather data\\");\\n    }\\n  }\\n  if (navigator.geolocation) {\\n    navigator.geolocation.getCurrentPosition(\\n      (position) => {\\n        mapCenter = {\\n          lat: position.coords.latitude,\\n          lng: position.coords.longitude\\n        };\\n        hasLocation = true;\\n        isLoading = false;\\n      },\\n      () => {\\n        isLoading = false;\\n      }\\n    );\\n  } else {\\n    isLoading = false;\\n  }\\n}\\nasync function getCoordinatesFromZipCode(zipCode) {\\n  try {\\n    const response = await fetch(\\n      `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=us&format=json&limit=1`\\n    );\\n    const data = await response.json();\\n    if (data && data.length > 0) {\\n      mapCenter = {\\n        lat: parseFloat(data[0].lat),\\n        lng: parseFloat(data[0].lon)\\n      };\\n      hasLocation = true;\\n    }\\n  } catch (error) {\\n    console.error(\\"Error geocoding zip code:\\", error);\\n  } finally {\\n    isLoading = false;\\n  }\\n}\\nlet themeObserver = null;\\nonMount(() => {\\n  if (!browser) return;\\n  currentTheme = getCurrentTheme();\\n  (async () => {\\n    const hasApiKey = await loadGoogleMapsApiKey();\\n    if (!hasApiKey) {\\n      isLoading = false;\\n      return;\\n    }\\n    await loadLocationData();\\n    if (hasLocation) {\\n      try {\\n        await loadGoogleMapsScript();\\n        initMap();\\n      } catch (error) {\\n        console.error(\\"Error initializing Google Maps:\\", error);\\n        apiKeyError = true;\\n      }\\n    }\\n  })();\\n  themeObserver = new MutationObserver(() => {\\n    const newTheme = getCurrentTheme();\\n    if (newTheme !== currentTheme) {\\n      currentTheme = newTheme;\\n      updateMapTheme();\\n    }\\n  });\\n  themeObserver.observe(document.documentElement, {\\n    attributes: true,\\n    attributeFilter: [\\"class\\"]\\n  });\\n  return () => {\\n    if (themeObserver) {\\n      themeObserver.disconnect();\\n    }\\n  };\\n});\\nonDestroy(() => {\\n  if (trafficLayer) {\\n    trafficLayer.setMap(null);\\n  }\\n  if (themeObserver) {\\n    themeObserver.disconnect();\\n  }\\n});\\n$: if (hasLocation && googleMapsApiKey && mapContainer && !map) {\\n  loadGoogleMapsScript().then(() => {\\n    initMap();\\n  }).catch((error) => {\\n    console.error(\\"Error loading Google Maps:\\", error);\\n    apiKeyError = true;\\n  });\\n}\\n$: if (map && currentTheme) {\\n  updateMapTheme();\\n}\\n<\/script>\\r\\n\\r\\n<div class=\\"traffic-widget\\">\\r\\n\\t{#if isLoading}\\r\\n\\t\\t<div class=\\"placeholder\\">\\r\\n\\t\\t\\t<div class=\\"loading-text\\">Loading...</div>\\r\\n\\t\\t</div>\\r\\n\\t{:else if apiKeyError}\\r\\n\\t\\t<div class=\\"placeholder\\">\\r\\n\\t\\t\\t<div class=\\"placeholder-text\\">Google Maps API key not configured</div>\\r\\n\\t\\t\\t<div class=\\"placeholder-hint\\">Add GOOGLE_MAPS_API_KEY to your .env file</div>\\r\\n\\t\\t</div>\\r\\n\\t{:else if hasLocation}\\r\\n\\t\\t<div class=\\"map-container\\" bind:this={mapContainer}></div>\\r\\n\\t{:else}\\r\\n\\t\\t<div class=\\"placeholder\\">\\r\\n\\t\\t\\t<div class=\\"placeholder-text\\">Set location to see traffic map</div>\\r\\n\\t\\t\\t<div class=\\"placeholder-hint\\">Configure location in Weather widget</div>\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.traffic-widget {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tmin-height: 300px;\\r\\n\\t}\\r\\n\\r\\n\\t.map-container {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tmin-height: 300px;\\r\\n\\t\\tborder-radius: 0.5rem;\\r\\n\\t\\toverflow: hidden;\\r\\n\\t\\tbackground-color: rgba(0, 0, 0, 0.2);\\r\\n\\t}\\r\\n\\r\\n\\t.placeholder {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tmin-height: 300px;\\r\\n\\t\\tbackground-color: rgba(0, 0, 0, 0.2);\\r\\n\\t\\tborder-radius: 0.5rem;\\r\\n\\t\\tborder: 2px dashed rgba(255, 255, 255, 0.2);\\r\\n\\t}\\r\\n\\r\\n\\t.placeholder-text {\\r\\n\\t\\tfont-size: 1.125rem;\\r\\n\\t\\tfont-weight: 500;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tmargin-bottom: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.placeholder-hint {\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t}\\r\\n\\r\\n\\t.loading-text {\\r\\n\\t\\tfont-size: 1rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAkTC,6BAAgB,CACf,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,KACb,CAEA,4BAAe,CACd,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,KAAK,CACjB,aAAa,CAAE,MAAM,CACrB,QAAQ,CAAE,MAAM,CAChB,gBAAgB,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CACpC,CAEA,0BAAa,CACZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,KAAK,CACjB,gBAAgB,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACpC,aAAa,CAAE,MAAM,CACrB,MAAM,CAAE,GAAG,CAAC,MAAM,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAC3C,CAEA,+BAAkB,CACjB,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,cAAc,CAAC,CAC1B,aAAa,CAAE,MAChB,CAEA,+BAAkB,CACjB,SAAS,CAAE,QAAQ,CACnB,KAAK,CAAE,IAAI,gBAAgB,CAC5B,CAEA,2BAAc,CACb,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,IAAI,gBAAgB,CAC5B"}'
    };
    TrafficWidget = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      onDestroy(() => {
      });
      $$result.css.add(css$7);
      return `<div class="traffic-widget svelte-4ec5kw">${`<div class="placeholder svelte-4ec5kw" data-svelte-h="svelte-pm6cd9"><div class="loading-text svelte-4ec5kw">Loading...</div></div>`} </div>`;
    });
    WIDGETS_STORAGE_KEY = "dashboard-widgets";
    SECTIONS_STORAGE_KEY = "dashboard-sections";
    defaultSections = [
      { id: 0, gridColumn: 1, gridColumnSpan: 1, gridRow: 1 },
      { id: 1, gridColumn: 2, gridColumnSpan: 1, gridRow: 1 },
      { id: 2, gridColumn: 3, gridColumnSpan: 1, gridRow: 1 }
    ];
    defaultWidgets = [
      {
        id: "weather-1",
        type: "weather",
        title: "Weather",
        section: 0,
        order: 0,
        size: { width: 300, height: 200 }
      },
      {
        id: "traffic-1",
        type: "traffic",
        title: "Traffic",
        section: 1,
        order: 0,
        size: { width: 300, height: 200 }
      },
      {
        id: "calendar-1",
        type: "calendar",
        title: "Calendar",
        section: 1,
        order: 1,
        size: { width: 300, height: 200 }
      },
      {
        id: "github-projects-1",
        type: "github-projects",
        title: "GitHub Projects",
        section: 2,
        order: 0,
        size: { width: 0, height: 500 }
      }
    ];
    widgets = createWidgetStore();
    sections = createSectionStore();
    css$6 = {
      code: ".calendar-widget.svelte-1283sn3{display:flex;flex-direction:column;gap:1rem;width:100%}.calendar-header.svelte-1283sn3{display:flex;align-items:center;justify-content:space-between;gap:0.5rem}.nav-button.svelte-1283sn3{display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:var(--surface-variant);border:1px solid var(--border);border-radius:6px;color:var(--text-secondary);cursor:pointer;transition:all 0.2s ease}.nav-button.svelte-1283sn3:hover{background:var(--surface-container-high);border-color:var(--outline-variant);color:var(--text-primary)}.header-title.svelte-1283sn3{flex:1;padding:0.5rem 1rem;background:var(--surface-variant);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:0.9375rem;font-weight:600;cursor:pointer;transition:all 0.2s ease;text-align:center}.header-title.svelte-1283sn3:hover{background:var(--surface-container-high);border-color:var(--outline-variant)}.today-button.svelte-1283sn3{width:100%;padding:0.5rem;background:color-mix(in srgb, var(--primary-color) 15%, transparent);border:1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);border-radius:6px;color:var(--primary-color);font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 0.2s ease}.today-button.svelte-1283sn3:hover{background:color-mix(in srgb, var(--primary-color) 25%, transparent);border-color:color-mix(in srgb, var(--primary-color) 40%, transparent)}.calendar-grid.svelte-1283sn3{display:grid;grid-template-columns:repeat(7, 1fr);gap:2px}.day-header.svelte-1283sn3{padding:0.5rem;text-align:center;font-size:0.75rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em}.calendar-day.svelte-1283sn3{aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:0.5rem;background:var(--surface-variant);border-radius:4px;font-size:0.875rem;color:var(--text-primary);transition:all 0.2s ease;cursor:pointer}.calendar-day.svelte-1283sn3:hover{background:var(--surface-container-high)}.calendar-day.other-month.svelte-1283sn3{color:color-mix(in srgb, var(--text-secondary) 50%, transparent);background:color-mix(in srgb, var(--surface-variant) 30%, transparent)}.calendar-day.today.svelte-1283sn3{background:color-mix(in srgb, var(--primary-color) 30%, transparent);border:2px solid color-mix(in srgb, var(--primary-color) 60%, transparent);color:var(--text-primary);font-weight:700}.months-grid.svelte-1283sn3{display:grid;grid-template-columns:repeat(3, 1fr);gap:0.5rem}.month-item.svelte-1283sn3{padding:1rem;background:var(--surface-variant);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 0.2s ease}.month-item.svelte-1283sn3:hover{background:var(--surface-container-high);border-color:var(--outline-variant)}.month-item.current.svelte-1283sn3{border-color:color-mix(in srgb, var(--primary-color) 40%, transparent)}.month-item.selected.svelte-1283sn3{background:color-mix(in srgb, var(--primary-color) 20%, transparent);border-color:color-mix(in srgb, var(--primary-color) 50%, transparent)}.years-grid.svelte-1283sn3{display:grid;grid-template-columns:repeat(2, 1fr);gap:0.5rem}.year-item.svelte-1283sn3{padding:1rem;background:var(--surface-variant);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 0.2s ease}.year-item.svelte-1283sn3:hover{background:var(--surface-container-high);border-color:var(--outline-variant)}.year-item.current.svelte-1283sn3{border-color:color-mix(in srgb, var(--primary-color) 40%, transparent)}.year-item.selected.svelte-1283sn3{background:color-mix(in srgb, var(--primary-color) 20%, transparent);border-color:color-mix(in srgb, var(--primary-color) 50%, transparent)}.decades-grid.svelte-1283sn3{display:grid;grid-template-columns:repeat(2, 1fr);gap:0.5rem}.decade-item.svelte-1283sn3{padding:1rem;background:var(--surface-variant);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 0.2s ease}.decade-item.svelte-1283sn3:hover{background:var(--surface-container-high);border-color:var(--outline-variant)}.decade-item.current.svelte-1283sn3{border-color:color-mix(in srgb, var(--primary-color) 40%, transparent)}.decade-item.selected.svelte-1283sn3{background:color-mix(in srgb, var(--primary-color) 20%, transparent);border-color:color-mix(in srgb, var(--primary-color) 50%, transparent)}@media(max-width: 768px){.calendar-day.svelte-1283sn3{font-size:0.75rem;padding:0.25rem}.day-header.svelte-1283sn3{font-size:0.625rem;padding:0.375rem}.month-item.svelte-1283sn3,.year-item.svelte-1283sn3,.decade-item.svelte-1283sn3{padding:0.75rem;font-size:0.8125rem}}",
      map: `{"version":3,"file":"CalendarWidget.svelte","sources":["CalendarWidget.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount } from \\"svelte\\";\\nimport { widgets } from \\"$lib/stores/widgets\\";\\nconst today = /* @__PURE__ */ new Date();\\nconst currentYear = today.getFullYear();\\nconst currentMonth = today.getMonth();\\nconst currentDay = today.getDate();\\nlet viewMode = \\"days\\";\\nlet selectedYear = currentYear;\\nlet selectedMonth = currentMonth;\\nlet selectedDecade = Math.floor(currentYear / 10) * 10;\\nconst monthNames = [\\n  \\"January\\",\\n  \\"February\\",\\n  \\"March\\",\\n  \\"April\\",\\n  \\"May\\",\\n  \\"June\\",\\n  \\"July\\",\\n  \\"August\\",\\n  \\"September\\",\\n  \\"October\\",\\n  \\"November\\",\\n  \\"December\\"\\n];\\nconst dayNames = [\\"Sun\\", \\"Mon\\", \\"Tue\\", \\"Wed\\", \\"Thu\\", \\"Fri\\", \\"Sat\\"];\\nfunction getOrdinalSuffix(day) {\\n  if (day > 3 && day < 21) return \\"th\\";\\n  switch (day % 10) {\\n    case 1:\\n      return \\"st\\";\\n    case 2:\\n      return \\"nd\\";\\n    case 3:\\n      return \\"rd\\";\\n    default:\\n      return \\"th\\";\\n  }\\n}\\nconst todayFormatted = \`(Today: \${currentYear} \${monthNames[currentMonth]} \${currentDay}\${getOrdinalSuffix(currentDay)})\`;\\nonMount(() => {\\n  widgets.updateTitle(\\"calendar-1\\", \`Calendar \${todayFormatted}\`);\\n});\\nfunction getDaysInMonth(year, month) {\\n  return new Date(year, month + 1, 0).getDate();\\n}\\nfunction getFirstDayOfMonth(year, month) {\\n  return new Date(year, month, 1).getDay();\\n}\\nfunction generateCalendarDays(year, month) {\\n  const daysInMonth = getDaysInMonth(year, month);\\n  const firstDay = getFirstDayOfMonth(year, month);\\n  const daysInPrevMonth = month === 0 ? getDaysInMonth(year - 1, 11) : getDaysInMonth(year, month - 1);\\n  const days = [];\\n  for (let i = firstDay - 1; i >= 0; i--) {\\n    days.push({\\n      day: daysInPrevMonth - i,\\n      isCurrentMonth: false,\\n      isToday: false\\n    });\\n  }\\n  for (let day = 1; day <= daysInMonth; day++) {\\n    const isToday = year === currentYear && month === currentMonth && day === currentDay;\\n    days.push({\\n      day,\\n      isCurrentMonth: true,\\n      isToday\\n    });\\n  }\\n  const remainingDays = 42 - days.length;\\n  for (let day = 1; day <= remainingDays; day++) {\\n    days.push({\\n      day,\\n      isCurrentMonth: false,\\n      isToday: false\\n    });\\n  }\\n  return days;\\n}\\nfunction previousMonth() {\\n  if (selectedMonth === 0) {\\n    selectedMonth = 11;\\n    selectedYear--;\\n  } else {\\n    selectedMonth--;\\n  }\\n}\\nfunction nextMonth() {\\n  if (selectedMonth === 11) {\\n    selectedMonth = 0;\\n    selectedYear++;\\n  } else {\\n    selectedMonth++;\\n  }\\n}\\nfunction previousYear() {\\n  selectedYear--;\\n}\\nfunction nextYear() {\\n  selectedYear++;\\n}\\nfunction previousDecade() {\\n  selectedDecade -= 10;\\n}\\nfunction nextDecade() {\\n  selectedDecade += 10;\\n}\\nfunction previousCentury() {\\n  selectedDecade -= 100;\\n}\\nfunction nextCentury() {\\n  selectedDecade += 100;\\n}\\nfunction goToToday() {\\n  selectedYear = currentYear;\\n  selectedMonth = currentMonth;\\n  selectedDecade = Math.floor(currentYear / 10) * 10;\\n  viewMode = \\"days\\";\\n}\\nfunction selectMonth(month) {\\n  selectedMonth = month;\\n  viewMode = \\"days\\";\\n}\\nfunction selectYear(year) {\\n  selectedYear = year;\\n  viewMode = \\"months\\";\\n}\\nfunction selectDecade(startYear) {\\n  selectedDecade = startYear;\\n  viewMode = \\"years\\";\\n}\\nfunction toggleViewMode() {\\n  if (viewMode === \\"days\\") viewMode = \\"months\\";\\n  else if (viewMode === \\"months\\") viewMode = \\"years\\";\\n  else if (viewMode === \\"years\\") viewMode = \\"decades\\";\\n  else viewMode = \\"days\\";\\n}\\n$: calendarDays = generateCalendarDays(selectedYear, selectedMonth);\\n$: yearRange = Array.from({ length: 10 }, (_, i) => selectedDecade + i);\\n$: decadeRanges = Array.from({ length: 10 }, (_, i) => {\\n  const start = selectedDecade + i * 10;\\n  return { start, end: start + 9 };\\n});\\n<\/script>\\r\\n\\r\\n<div class=\\"calendar-widget\\">\\r\\n\\t<!-- Calendar Header -->\\r\\n\\t<div class=\\"calendar-header\\">\\r\\n\\t\\t<button class=\\"nav-button\\" on:click={viewMode === 'days' ? previousMonth : viewMode === 'months' ? previousYear : viewMode === 'years' ? previousDecade : previousCentury}>\\r\\n\\t\\t\\t<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"20\\" height=\\"20\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\">\\r\\n\\t\\t\\t\\t<polyline points=\\"15 18 9 12 15 6\\"></polyline>\\r\\n\\t\\t\\t</svg>\\r\\n\\t\\t</button>\\r\\n\\t\\t\\r\\n\\t\\t<button class=\\"header-title\\" on:click={toggleViewMode}>\\r\\n\\t\\t\\t{#if viewMode === 'days'}\\r\\n\\t\\t\\t\\t{monthNames[selectedMonth]} {selectedYear}\\r\\n\\t\\t\\t{:else if viewMode === 'months'}\\r\\n\\t\\t\\t\\t{selectedYear}\\r\\n\\t\\t\\t{:else if viewMode === 'years'}\\r\\n\\t\\t\\t\\t{selectedDecade} - {selectedDecade + 9}\\r\\n\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t{selectedDecade} - {selectedDecade + 99}\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t</button>\\r\\n\\t\\t\\r\\n\\t\\t<button class=\\"nav-button\\" on:click={viewMode === 'days' ? nextMonth : viewMode === 'months' ? nextYear : viewMode === 'years' ? nextDecade : nextCentury}>\\r\\n\\t\\t\\t<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"20\\" height=\\"20\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\">\\r\\n\\t\\t\\t\\t<polyline points=\\"9 18 15 12 9 6\\"></polyline>\\r\\n\\t\\t\\t</svg>\\r\\n\\t\\t</button>\\r\\n\\t</div>\\r\\n\\r\\n\\t<!-- Today Button -->\\r\\n\\t<button class=\\"today-button\\" on:click={goToToday}>Today</button>\\r\\n\\r\\n\\t<!-- Days View -->\\r\\n\\t{#if viewMode === 'days'}\\r\\n\\t\\t<div class=\\"calendar-grid\\">\\r\\n\\t\\t\\t<!-- Day Headers -->\\r\\n\\t\\t\\t{#each dayNames as dayName}\\r\\n\\t\\t\\t\\t<div class=\\"day-header\\">{dayName}</div>\\r\\n\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\r\\n\\t\\t\\t<!-- Calendar Days -->\\r\\n\\t\\t\\t{#each calendarDays as { day, isCurrentMonth, isToday }}\\r\\n\\t\\t\\t\\t<div \\r\\n\\t\\t\\t\\t\\tclass=\\"calendar-day\\" \\r\\n\\t\\t\\t\\t\\tclass:other-month={!isCurrentMonth}\\r\\n\\t\\t\\t\\t\\tclass:today={isToday}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t{day}\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{/each}\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n\\r\\n\\t<!-- Months View -->\\r\\n\\t{#if viewMode === 'months'}\\r\\n\\t\\t<div class=\\"months-grid\\">\\r\\n\\t\\t\\t{#each monthNames as monthName, index}\\r\\n\\t\\t\\t\\t<button \\r\\n\\t\\t\\t\\t\\tclass=\\"month-item\\"\\r\\n\\t\\t\\t\\t\\tclass:current={index === currentMonth && selectedYear === currentYear}\\r\\n\\t\\t\\t\\t\\tclass:selected={index === selectedMonth}\\r\\n\\t\\t\\t\\t\\ton:click={() => selectMonth(index)}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t{monthName.substring(0, 3)}\\r\\n\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t{/each}\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n\\r\\n\\t<!-- Years View -->\\r\\n\\t{#if viewMode === 'years'}\\r\\n\\t\\t<div class=\\"years-grid\\">\\r\\n\\t\\t\\t{#each yearRange as year}\\r\\n\\t\\t\\t\\t<button \\r\\n\\t\\t\\t\\t\\tclass=\\"year-item\\"\\r\\n\\t\\t\\t\\t\\tclass:current={year === currentYear}\\r\\n\\t\\t\\t\\t\\tclass:selected={year === selectedYear}\\r\\n\\t\\t\\t\\t\\ton:click={() => selectYear(year)}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t{year}\\r\\n\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t{/each}\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n\\r\\n\\t<!-- Decades View -->\\r\\n\\t{#if viewMode === 'decades'}\\r\\n\\t\\t<div class=\\"decades-grid\\">\\r\\n\\t\\t\\t{#each decadeRanges as { start, end }}\\r\\n\\t\\t\\t\\t<button \\r\\n\\t\\t\\t\\t\\tclass=\\"decade-item\\"\\r\\n\\t\\t\\t\\t\\tclass:current={currentYear >= start && currentYear <= end}\\r\\n\\t\\t\\t\\t\\tclass:selected={selectedYear >= start && selectedYear <= end}\\r\\n\\t\\t\\t\\t\\ton:click={() => selectDecade(start)}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t{start} - {end}\\r\\n\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t{/each}\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.calendar-widget {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tgap: 1rem;\\r\\n\\t\\twidth: 100%;\\r\\n\\t}\\r\\n\\r\\n\\t/* Calendar Header */\\r\\n\\t.calendar-header {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.nav-button {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\twidth: 32px;\\r\\n\\t\\theight: 32px;\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 6px;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t}\\r\\n\\r\\n\\t.nav-button:hover {\\r\\n\\t\\tbackground: var(--surface-container-high);\\r\\n\\t\\tborder-color: var(--outline-variant);\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t}\\r\\n\\r\\n\\t.header-title {\\r\\n\\t\\tflex: 1;\\r\\n\\t\\tpadding: 0.5rem 1rem;\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 6px;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tfont-size: 0.9375rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t\\ttext-align: center;\\r\\n\\t}\\r\\n\\r\\n\\t.header-title:hover {\\r\\n\\t\\tbackground: var(--surface-container-high);\\r\\n\\t\\tborder-color: var(--outline-variant);\\r\\n\\t}\\r\\n\\r\\n\\t/* Today Button */\\r\\n\\t.today-button {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tpadding: 0.5rem;\\r\\n\\t\\tbackground: color-mix(in srgb, var(--primary-color) 15%, transparent);\\r\\n\\t\\tborder: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);\\r\\n\\t\\tborder-radius: 6px;\\r\\n\\t\\tcolor: var(--primary-color);\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tfont-weight: 500;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t}\\r\\n\\r\\n\\t.today-button:hover {\\r\\n\\t\\tbackground: color-mix(in srgb, var(--primary-color) 25%, transparent);\\r\\n\\t\\tborder-color: color-mix(in srgb, var(--primary-color) 40%, transparent);\\r\\n\\t}\\r\\n\\r\\n\\t/* Calendar Grid - Days View */\\r\\n\\t.calendar-grid {\\r\\n\\t\\tdisplay: grid;\\r\\n\\t\\tgrid-template-columns: repeat(7, 1fr);\\r\\n\\t\\tgap: 2px;\\r\\n\\t}\\r\\n\\r\\n\\t.day-header {\\r\\n\\t\\tpadding: 0.5rem;\\r\\n\\t\\ttext-align: center;\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\ttext-transform: uppercase;\\r\\n\\t\\tletter-spacing: 0.05em;\\r\\n\\t}\\r\\n\\r\\n\\t.calendar-day {\\r\\n\\t\\taspect-ratio: 1;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tpadding: 0.5rem;\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t\\tborder-radius: 4px;\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t}\\r\\n\\r\\n\\t.calendar-day:hover {\\r\\n\\t\\tbackground: var(--surface-container-high);\\r\\n\\t}\\r\\n\\r\\n\\t.calendar-day.other-month {\\r\\n\\t\\tcolor: color-mix(in srgb, var(--text-secondary) 50%, transparent);\\r\\n\\t\\tbackground: color-mix(in srgb, var(--surface-variant) 30%, transparent);\\r\\n\\t}\\r\\n\\r\\n\\t.calendar-day.today {\\r\\n\\t\\tbackground: color-mix(in srgb, var(--primary-color) 30%, transparent);\\r\\n\\t\\tborder: 2px solid color-mix(in srgb, var(--primary-color) 60%, transparent);\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tfont-weight: 700;\\r\\n\\t}\\r\\n\\r\\n\\t/* Months Grid */\\r\\n\\t.months-grid {\\r\\n\\t\\tdisplay: grid;\\r\\n\\t\\tgrid-template-columns: repeat(3, 1fr);\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.month-item {\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 6px;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tfont-weight: 500;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t}\\r\\n\\r\\n\\t.month-item:hover {\\r\\n\\t\\tbackground: var(--surface-container-high);\\r\\n\\t\\tborder-color: var(--outline-variant);\\r\\n\\t}\\r\\n\\r\\n\\t.month-item.current {\\r\\n\\t\\tborder-color: color-mix(in srgb, var(--primary-color) 40%, transparent);\\r\\n\\t}\\r\\n\\r\\n\\t.month-item.selected {\\r\\n\\t\\tbackground: color-mix(in srgb, var(--primary-color) 20%, transparent);\\r\\n\\t\\tborder-color: color-mix(in srgb, var(--primary-color) 50%, transparent);\\r\\n\\t}\\r\\n\\r\\n\\t/* Years Grid */\\r\\n\\t.years-grid {\\r\\n\\t\\tdisplay: grid;\\r\\n\\t\\tgrid-template-columns: repeat(2, 1fr);\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.year-item {\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 6px;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tfont-weight: 500;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t}\\r\\n\\r\\n\\t.year-item:hover {\\r\\n\\t\\tbackground: var(--surface-container-high);\\r\\n\\t\\tborder-color: var(--outline-variant);\\r\\n\\t}\\r\\n\\r\\n\\t.year-item.current {\\r\\n\\t\\tborder-color: color-mix(in srgb, var(--primary-color) 40%, transparent);\\r\\n\\t}\\r\\n\\r\\n\\t.year-item.selected {\\r\\n\\t\\tbackground: color-mix(in srgb, var(--primary-color) 20%, transparent);\\r\\n\\t\\tborder-color: color-mix(in srgb, var(--primary-color) 50%, transparent);\\r\\n\\t}\\r\\n\\r\\n\\t/* Decades Grid */\\r\\n\\t.decades-grid {\\r\\n\\t\\tdisplay: grid;\\r\\n\\t\\tgrid-template-columns: repeat(2, 1fr);\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.decade-item {\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tbackground: var(--surface-variant);\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 6px;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tfont-weight: 500;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t}\\r\\n\\r\\n\\t.decade-item:hover {\\r\\n\\t\\tbackground: var(--surface-container-high);\\r\\n\\t\\tborder-color: var(--outline-variant);\\r\\n\\t}\\r\\n\\r\\n\\t.decade-item.current {\\r\\n\\t\\tborder-color: color-mix(in srgb, var(--primary-color) 40%, transparent);\\r\\n\\t}\\r\\n\\r\\n\\t.decade-item.selected {\\r\\n\\t\\tbackground: color-mix(in srgb, var(--primary-color) 20%, transparent);\\r\\n\\t\\tborder-color: color-mix(in srgb, var(--primary-color) 50%, transparent);\\r\\n\\t}\\r\\n\\r\\n\\t/* Responsive Design */\\r\\n\\t@media (max-width: 768px) {\\r\\n\\t\\t.calendar-day {\\r\\n\\t\\t\\tfont-size: 0.75rem;\\r\\n\\t\\t\\tpadding: 0.25rem;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.day-header {\\r\\n\\t\\t\\tfont-size: 0.625rem;\\r\\n\\t\\t\\tpadding: 0.375rem;\\r\\n\\t\\t}\\r\\n\\r\\n\\t\\t.month-item,\\r\\n\\t\\t.year-item,\\r\\n\\t\\t.decade-item {\\r\\n\\t\\t\\tpadding: 0.75rem;\\r\\n\\t\\t\\tfont-size: 0.8125rem;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"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"}`
    };
    CalendarWidget = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let calendarDays;
      const today = /* @__PURE__ */ new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const currentDay = today.getDate();
      let selectedYear = currentYear;
      let selectedMonth = currentMonth;
      let selectedDecade = Math.floor(currentYear / 10) * 10;
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      function generateCalendarDays(year2, month) {
        const daysInMonth = getDaysInMonth(year2, month);
        const firstDay = getFirstDayOfMonth(year2, month);
        const daysInPrevMonth = month === 0 ? getDaysInMonth(year2 - 1, 11) : getDaysInMonth(year2, month - 1);
        const days = [];
        for (let i4 = firstDay - 1; i4 >= 0; i4--) {
          days.push({
            day: daysInPrevMonth - i4,
            isCurrentMonth: false,
            isToday: false
          });
        }
        for (let day2 = 1; day2 <= daysInMonth; day2++) {
          const isToday = year2 === currentYear && month === currentMonth && day2 === currentDay;
          days.push({ day: day2, isCurrentMonth: true, isToday });
        }
        const remainingDays = 42 - days.length;
        for (let day2 = 1; day2 <= remainingDays; day2++) {
          days.push({
            day: day2,
            isCurrentMonth: false,
            isToday: false
          });
        }
        return days;
      }
      __name(generateCalendarDays, "generateCalendarDays");
      $$result.css.add(css$6);
      calendarDays = generateCalendarDays(selectedYear, selectedMonth);
      Array.from({ length: 10 }, (_3, i4) => selectedDecade + i4);
      Array.from({ length: 10 }, (_3, i4) => {
        const start = selectedDecade + i4 * 10;
        return { start, end: start + 9 };
      });
      return `<div class="calendar-widget svelte-1283sn3"> <div class="calendar-header svelte-1283sn3"><button class="nav-button svelte-1283sn3" data-svelte-h="svelte-11d59dy"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button> <button class="header-title svelte-1283sn3">${`${escape(monthNames[selectedMonth])} ${escape(selectedYear)}`}</button> <button class="nav-button svelte-1283sn3" data-svelte-h="svelte-8p5fwd"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button></div>  <button class="today-button svelte-1283sn3" data-svelte-h="svelte-ofi5ui">Today</button>  ${`<div class="calendar-grid svelte-1283sn3"> ${each(dayNames, (dayName) => {
        return `<div class="day-header svelte-1283sn3">${escape(dayName)}</div>`;
      })}  ${each(calendarDays, ({ day: day2, isCurrentMonth, isToday }) => {
        return `<div class="${[
          "calendar-day svelte-1283sn3",
          (!isCurrentMonth ? "other-month" : "") + " " + (isToday ? "today" : "")
        ].join(" ").trim()}">${escape(day2)} </div>`;
      })}</div>`}  ${``}  ${``}  ${``} </div>`;
    });
    css$5 = {
      code: ".github-widget.svelte-1bi7m2v.svelte-1bi7m2v{max-height:400px;overflow-y:auto}.empty-state.svelte-1bi7m2v.svelte-1bi7m2v{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center}.empty-icon.svelte-1bi7m2v.svelte-1bi7m2v{font-size:3rem;margin-bottom:1rem;opacity:0.5}.empty-state.svelte-1bi7m2v p.svelte-1bi7m2v{margin:0.25rem 0}.empty-hint.svelte-1bi7m2v.svelte-1bi7m2v{font-size:0.875rem;color:var(--text-secondary)}.projects-grid.svelte-1bi7m2v.svelte-1bi7m2v{display:flex;flex-direction:column;gap:0.75rem}.project-card.svelte-1bi7m2v.svelte-1bi7m2v{display:block;padding:1rem;background-color:rgba(0, 0, 0, 0.2);border-radius:0.375rem;border:1px solid var(--border);text-decoration:none;color:inherit;transition:all 0.2s}.project-card.svelte-1bi7m2v.svelte-1bi7m2v:hover{background-color:rgba(0, 0, 0, 0.3);border-color:var(--primary-color);transform:translateY(-2px)}.project-header.svelte-1bi7m2v.svelte-1bi7m2v{display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem}.project-name.svelte-1bi7m2v.svelte-1bi7m2v{font-weight:600;font-size:1rem}.project-language.svelte-1bi7m2v.svelte-1bi7m2v{font-size:0.75rem;padding:0.125rem 0.5rem;background-color:var(--primary-color);border-radius:0.25rem}.project-description.svelte-1bi7m2v.svelte-1bi7m2v{font-size:0.875rem;color:var(--text-secondary);margin-bottom:0.75rem;line-height:1.4}.project-stats.svelte-1bi7m2v.svelte-1bi7m2v{display:flex;gap:1rem;font-size:0.75rem;color:var(--text-secondary)}",
      map: '{"version":3,"file":"GithubWidget.svelte","sources":["GithubWidget.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let projects = [];\\n<\/script>\\r\\n\\r\\n<div class=\\"github-widget\\">\\r\\n\\t{#if projects.length === 0}\\r\\n\\t\\t<div class=\\"empty-state\\">\\r\\n\\t\\t\\t<div class=\\"empty-icon\\">\u{1F4E6}</div>\\r\\n\\t\\t\\t<p>No personal repositories found</p>\\r\\n\\t\\t\\t<p class=\\"empty-hint\\">Create repositories on GitHub to see them here</p>\\r\\n\\t\\t</div>\\r\\n\\t{:else}\\r\\n\\t\\t<div class=\\"projects-grid\\">\\r\\n\\t\\t\\t{#each projects as project}\\r\\n\\t\\t\\t\\t<a href={project.html_url} target=\\"_blank\\" rel=\\"noopener noreferrer\\" class=\\"project-card\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"project-header\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"project-name\\">{project.name}</div>\\r\\n\\t\\t\\t\\t\\t\\t{#if project.language}\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"project-language\\">{project.language}</div>\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t{#if project.description}\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"project-description\\">{project.description}</div>\\r\\n\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t<div class=\\"project-stats\\">\\r\\n\\t\\t\\t\\t\\t\\t<span>\u2B50 {project.stargazers_count}</span>\\r\\n\\t\\t\\t\\t\\t\\t<span>\u{1F374} {project.forks_count}</span>\\r\\n\\t\\t\\t\\t\\t\\t{#if project.open_issues_count > 0}\\r\\n\\t\\t\\t\\t\\t\\t\\t<span>\u{1F4CB} {project.open_issues_count}</span>\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</a>\\r\\n\\t\\t\\t{/each}\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.github-widget {\\r\\n\\t\\tmax-height: 400px;\\r\\n\\t\\toverflow-y: auto;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-state {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tpadding: 2rem;\\r\\n\\t\\ttext-align: center;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-icon {\\r\\n\\t\\tfont-size: 3rem;\\r\\n\\t\\tmargin-bottom: 1rem;\\r\\n\\t\\topacity: 0.5;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-state p {\\r\\n\\t\\tmargin: 0.25rem 0;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-hint {\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t}\\r\\n\\r\\n\\t.projects-grid {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tgap: 0.75rem;\\r\\n\\t}\\r\\n\\r\\n\\t.project-card {\\r\\n\\t\\tdisplay: block;\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tbackground-color: rgba(0, 0, 0, 0.2);\\r\\n\\t\\tborder-radius: 0.375rem;\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t\\tcolor: inherit;\\r\\n\\t\\ttransition: all 0.2s;\\r\\n\\t}\\r\\n\\r\\n\\t.project-card:hover {\\r\\n\\t\\tbackground-color: rgba(0, 0, 0, 0.3);\\r\\n\\t\\tborder-color: var(--primary-color);\\r\\n\\t\\ttransform: translateY(-2px);\\r\\n\\t}\\r\\n\\r\\n\\t.project-header {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tmargin-bottom: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.project-name {\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tfont-size: 1rem;\\r\\n\\t}\\r\\n\\r\\n\\t.project-language {\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\tpadding: 0.125rem 0.5rem;\\r\\n\\t\\tbackground-color: var(--primary-color);\\r\\n\\t\\tborder-radius: 0.25rem;\\r\\n\\t}\\r\\n\\r\\n\\t.project-description {\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tmargin-bottom: 0.75rem;\\r\\n\\t\\tline-height: 1.4;\\r\\n\\t}\\r\\n\\r\\n\\t.project-stats {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tgap: 1rem;\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAqCC,4CAAe,CACd,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,IACb,CAEA,0CAAa,CACZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,MACb,CAEA,yCAAY,CACX,SAAS,CAAE,IAAI,CACf,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,GACV,CAEA,2BAAY,CAAC,gBAAE,CACd,MAAM,CAAE,OAAO,CAAC,CACjB,CAEA,yCAAY,CACX,SAAS,CAAE,QAAQ,CACnB,KAAK,CAAE,IAAI,gBAAgB,CAC5B,CAEA,4CAAe,CACd,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,GAAG,CAAE,OACN,CAEA,2CAAc,CACb,OAAO,CAAE,KAAK,CACd,OAAO,CAAE,IAAI,CACb,gBAAgB,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACpC,aAAa,CAAE,QAAQ,CACvB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,QAAQ,CAAC,CAC/B,eAAe,CAAE,IAAI,CACrB,KAAK,CAAE,OAAO,CACd,UAAU,CAAE,GAAG,CAAC,IACjB,CAEA,2CAAa,MAAO,CACnB,gBAAgB,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CACpC,YAAY,CAAE,IAAI,eAAe,CAAC,CAClC,SAAS,CAAE,WAAW,IAAI,CAC3B,CAEA,6CAAgB,CACf,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,MAChB,CAEA,2CAAc,CACb,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,IACZ,CAEA,+CAAkB,CACjB,SAAS,CAAE,OAAO,CAClB,OAAO,CAAE,QAAQ,CAAC,MAAM,CACxB,gBAAgB,CAAE,IAAI,eAAe,CAAC,CACtC,aAAa,CAAE,OAChB,CAEA,kDAAqB,CACpB,SAAS,CAAE,QAAQ,CACnB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,aAAa,CAAE,OAAO,CACtB,WAAW,CAAE,GACd,CAEA,4CAAe,CACd,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,IAAI,CACT,SAAS,CAAE,OAAO,CAClB,KAAK,CAAE,IAAI,gBAAgB,CAC5B"}'
    };
    GithubWidget = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { projects = [] } = $$props;
      if ($$props.projects === void 0 && $$bindings.projects && projects !== void 0) $$bindings.projects(projects);
      $$result.css.add(css$5);
      return `<div class="github-widget svelte-1bi7m2v">${projects.length === 0 ? `<div class="empty-state svelte-1bi7m2v" data-svelte-h="svelte-1wvpd00"><div class="empty-icon svelte-1bi7m2v">\u{1F4E6}</div> <p class="svelte-1bi7m2v">No personal repositories found</p> <p class="empty-hint svelte-1bi7m2v">Create repositories on GitHub to see them here</p></div>` : `<div class="projects-grid svelte-1bi7m2v">${each(projects, (project) => {
        return `<a${add_attribute("href", project.html_url, 0)} target="_blank" rel="noopener noreferrer" class="project-card svelte-1bi7m2v"><div class="project-header svelte-1bi7m2v"><div class="project-name svelte-1bi7m2v">${escape(project.name)}</div> ${project.language ? `<div class="project-language svelte-1bi7m2v">${escape(project.language)}</div>` : ``}</div> ${project.description ? `<div class="project-description svelte-1bi7m2v">${escape(project.description)}</div>` : ``} <div class="project-stats svelte-1bi7m2v"><span>\u2B50 ${escape(project.stargazers_count)}</span> <span>\u{1F374} ${escape(project.forks_count)}</span> ${project.open_issues_count > 0 ? `<span>\u{1F4CB} ${escape(project.open_issues_count)}</span>` : ``}</div> </a>`;
      })}</div>`} </div>`;
    });
    css$4 = {
      code: ".organization-projects-widget.svelte-8sqfxh.svelte-8sqfxh{max-height:500px;overflow-y:auto}.empty-state.svelte-8sqfxh.svelte-8sqfxh{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center}.empty-icon.svelte-8sqfxh.svelte-8sqfxh{font-size:3rem;margin-bottom:1rem;opacity:0.5}.empty-state.svelte-8sqfxh p.svelte-8sqfxh{margin:0.25rem 0}.empty-hint.svelte-8sqfxh.svelte-8sqfxh{font-size:0.875rem;color:var(--text-secondary)}.organizations-container.svelte-8sqfxh.svelte-8sqfxh{display:flex;flex-direction:column;gap:1.5rem}.organization-section.svelte-8sqfxh.svelte-8sqfxh{border:1px solid var(--border);border-radius:0.5rem;padding:1rem;background-color:rgba(0, 0, 0, 0.1)}.organization-header.svelte-8sqfxh.svelte-8sqfxh{display:flex;align-items:center;gap:1rem;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)}.org-avatar.svelte-8sqfxh.svelte-8sqfxh{width:40px;height:40px;border-radius:50%;object-fit:cover}.org-info.svelte-8sqfxh.svelte-8sqfxh{flex:1}.org-name.svelte-8sqfxh.svelte-8sqfxh{margin:0;font-size:1.125rem;font-weight:600;color:var(--text-primary)}.org-description.svelte-8sqfxh.svelte-8sqfxh{margin:0.25rem 0 0 0;font-size:0.875rem;color:var(--text-secondary);line-height:1.4}.projects-grid.svelte-8sqfxh.svelte-8sqfxh{display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:0.75rem}.project-tile.svelte-8sqfxh.svelte-8sqfxh{display:block;padding:0.875rem;background-color:rgba(255, 255, 255, 0.05);border-radius:0.375rem;border:1px solid rgba(255, 255, 255, 0.1);text-decoration:none;color:inherit;transition:all 0.2s}.project-tile.svelte-8sqfxh.svelte-8sqfxh:hover{background-color:rgba(255, 255, 255, 0.1);border-color:var(--primary-color);transform:translateY(-1px);box-shadow:0 4px 8px rgba(0, 0, 0, 0.1)}.project-header.svelte-8sqfxh.svelte-8sqfxh{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;gap:0.5rem}.project-name.svelte-8sqfxh.svelte-8sqfxh{font-weight:600;font-size:0.9rem;line-height:1.3;flex:1}.project-language.svelte-8sqfxh.svelte-8sqfxh{font-size:0.7rem;padding:0.125rem 0.4rem;background-color:var(--primary-color);border-radius:0.25rem;white-space:nowrap;flex-shrink:0}.project-description.svelte-8sqfxh.svelte-8sqfxh{font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.75rem;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.project-stats.svelte-8sqfxh.svelte-8sqfxh{display:flex;gap:0.75rem;font-size:0.7rem;color:var(--text-secondary)}.no-projects.svelte-8sqfxh.svelte-8sqfxh{text-align:center;padding:1rem;color:var(--text-secondary);font-style:italic}.more-projects.svelte-8sqfxh.svelte-8sqfxh{text-align:center;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid rgba(255, 255, 255, 0.1);color:var(--text-secondary);font-size:0.875rem}.more-projects.svelte-8sqfxh p.svelte-8sqfxh{margin:0}",
      map: '{"version":3,"file":"OrganizationProjectsWidget.svelte","sources":["OrganizationProjectsWidget.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let organizationProjects = [];\\n<\/script>\\r\\n\\r\\n<div class=\\"organization-projects-widget\\">\\r\\n\\t{#if organizationProjects.length === 0}\\r\\n\\t\\t<div class=\\"empty-state\\">\\r\\n\\t\\t\\t<div class=\\"empty-icon\\">\u{1F3E2}</div>\\r\\n\\t\\t\\t<p>No organization projects found</p>\\r\\n\\t\\t\\t<p class=\\"empty-hint\\">Join organizations on GitHub to see their projects</p>\\r\\n\\t\\t</div>\\r\\n\\t{:else}\\r\\n\\t\\t<div class=\\"organizations-container\\">\\r\\n\\t\\t\\t{#each organizationProjects as orgData}\\r\\n\\t\\t\\t\\t<div class=\\"organization-section\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"organization-header\\">\\r\\n\\t\\t\\t\\t\\t\\t<img src={orgData.organization.avatar_url} alt=\\"{orgData.organization.login} avatar\\" class=\\"org-avatar\\" />\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"org-info\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<h3 class=\\"org-name\\">{orgData.organization.login}</h3>\\r\\n\\t\\t\\t\\t\\t\\t\\t{#if orgData.organization.description}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<p class=\\"org-description\\">{orgData.organization.description}</p>\\r\\n\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\r\\n\\t\\t\\t\\t\\t{#if orgData.repositories.length > 0}\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"projects-grid\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t{#each orgData.repositories.slice(0, 6) as project}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<a href={project.html_url} target=\\"_blank\\" rel=\\"noopener noreferrer\\" class=\\"project-tile\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"project-header\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"project-name\\">{project.name}</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t{#if project.language}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"project-language\\">{project.language}</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t{#if project.description}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"project-description\\">{project.description}</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<div class=\\"project-stats\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<span>\u2B50 {project.stargazers_count}</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<span>\u{1F374} {project.forks_count}</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t{#if project.open_issues_count > 0}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t<span>\u{1F4CB} {project.open_issues_count}</span>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t</a>\\r\\n\\t\\t\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{#if orgData.repositories.length > 6}\\r\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"more-projects\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<p>+ {orgData.repositories.length - 6} more projects</p>\\r\\n\\t\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"no-projects\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<p>No repositories found in this organization</p>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t{/each}\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.organization-projects-widget {\\r\\n\\t\\tmax-height: 500px;\\r\\n\\t\\toverflow-y: auto;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-state {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tpadding: 2rem;\\r\\n\\t\\ttext-align: center;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-icon {\\r\\n\\t\\tfont-size: 3rem;\\r\\n\\t\\tmargin-bottom: 1rem;\\r\\n\\t\\topacity: 0.5;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-state p {\\r\\n\\t\\tmargin: 0.25rem 0;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-hint {\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t}\\r\\n\\r\\n\\t.organizations-container {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tgap: 1.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.organization-section {\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 0.5rem;\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tbackground-color: rgba(0, 0, 0, 0.1);\\r\\n\\t}\\r\\n\\r\\n\\t.organization-header {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tgap: 1rem;\\r\\n\\t\\tmargin-bottom: 1rem;\\r\\n\\t\\tpadding-bottom: 0.75rem;\\r\\n\\t\\tborder-bottom: 1px solid var(--border);\\r\\n\\t}\\r\\n\\r\\n\\t.org-avatar {\\r\\n\\t\\twidth: 40px;\\r\\n\\t\\theight: 40px;\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tobject-fit: cover;\\r\\n\\t}\\r\\n\\r\\n\\t.org-info {\\r\\n\\t\\tflex: 1;\\r\\n\\t}\\r\\n\\r\\n\\t.org-name {\\r\\n\\t\\tmargin: 0;\\r\\n\\t\\tfont-size: 1.125rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t}\\r\\n\\r\\n\\t.org-description {\\r\\n\\t\\tmargin: 0.25rem 0 0 0;\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tline-height: 1.4;\\r\\n\\t}\\r\\n\\r\\n\\t.projects-grid {\\r\\n\\t\\tdisplay: grid;\\r\\n\\t\\tgrid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\\r\\n\\t\\tgap: 0.75rem;\\r\\n\\t}\\r\\n\\r\\n\\t.project-tile {\\r\\n\\t\\tdisplay: block;\\r\\n\\t\\tpadding: 0.875rem;\\r\\n\\t\\tbackground-color: rgba(255, 255, 255, 0.05);\\r\\n\\t\\tborder-radius: 0.375rem;\\r\\n\\t\\tborder: 1px solid rgba(255, 255, 255, 0.1);\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t\\tcolor: inherit;\\r\\n\\t\\ttransition: all 0.2s;\\r\\n\\t}\\r\\n\\r\\n\\t.project-tile:hover {\\r\\n\\t\\tbackground-color: rgba(255, 255, 255, 0.1);\\r\\n\\t\\tborder-color: var(--primary-color);\\r\\n\\t\\ttransform: translateY(-1px);\\r\\n\\t\\tbox-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);\\r\\n\\t}\\r\\n\\r\\n\\t.project-header {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\talign-items: flex-start;\\r\\n\\t\\tmargin-bottom: 0.5rem;\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.project-name {\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tfont-size: 0.9rem;\\r\\n\\t\\tline-height: 1.3;\\r\\n\\t\\tflex: 1;\\r\\n\\t}\\r\\n\\r\\n\\t.project-language {\\r\\n\\t\\tfont-size: 0.7rem;\\r\\n\\t\\tpadding: 0.125rem 0.4rem;\\r\\n\\t\\tbackground-color: var(--primary-color);\\r\\n\\t\\tborder-radius: 0.25rem;\\r\\n\\t\\twhite-space: nowrap;\\r\\n\\t\\tflex-shrink: 0;\\r\\n\\t}\\r\\n\\r\\n\\t.project-description {\\r\\n\\t\\tfont-size: 0.8rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tmargin-bottom: 0.75rem;\\r\\n\\t\\tline-height: 1.4;\\r\\n\\t\\tdisplay: -webkit-box;\\r\\n\\t\\t-webkit-line-clamp: 2;\\r\\n\\t\\tline-clamp: 2;\\r\\n\\t\\t-webkit-box-orient: vertical;\\r\\n\\t\\toverflow: hidden;\\r\\n\\t}\\r\\n\\r\\n\\t.project-stats {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tgap: 0.75rem;\\r\\n\\t\\tfont-size: 0.7rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t}\\r\\n\\r\\n\\t.no-projects {\\r\\n\\t\\ttext-align: center;\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tfont-style: italic;\\r\\n\\t}\\r\\n\\r\\n\\t.more-projects {\\r\\n\\t\\ttext-align: center;\\r\\n\\t\\tmargin-top: 0.75rem;\\r\\n\\t\\tpadding-top: 0.75rem;\\r\\n\\t\\tborder-top: 1px solid rgba(255, 255, 255, 0.1);\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t}\\r\\n\\r\\n\\t.more-projects p {\\r\\n\\t\\tmargin: 0;\\r\\n\\t}\\r\\n</style>"],"names":[],"mappings":"AAgEC,yDAA8B,CAC7B,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,IACb,CAEA,wCAAa,CACZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,MACb,CAEA,uCAAY,CACX,SAAS,CAAE,IAAI,CACf,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,GACV,CAEA,0BAAY,CAAC,eAAE,CACd,MAAM,CAAE,OAAO,CAAC,CACjB,CAEA,uCAAY,CACX,SAAS,CAAE,QAAQ,CACnB,KAAK,CAAE,IAAI,gBAAgB,CAC5B,CAEA,oDAAyB,CACxB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,GAAG,CAAE,MACN,CAEA,iDAAsB,CACrB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,QAAQ,CAAC,CAC/B,aAAa,CAAE,MAAM,CACrB,OAAO,CAAE,IAAI,CACb,gBAAgB,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CACpC,CAEA,gDAAqB,CACpB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,GAAG,CAAE,IAAI,CACT,aAAa,CAAE,IAAI,CACnB,cAAc,CAAE,OAAO,CACvB,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,QAAQ,CACtC,CAEA,uCAAY,CACX,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,GAAG,CAClB,UAAU,CAAE,KACb,CAEA,qCAAU,CACT,IAAI,CAAE,CACP,CAEA,qCAAU,CACT,MAAM,CAAE,CAAC,CACT,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,cAAc,CAC1B,CAEA,4CAAiB,CAChB,MAAM,CAAE,OAAO,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACrB,SAAS,CAAE,QAAQ,CACnB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,WAAW,CAAE,GACd,CAEA,0CAAe,CACd,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,OAAO,QAAQ,CAAC,CAAC,OAAO,KAAK,CAAC,CAAC,GAAG,CAAC,CAAC,CAC3D,GAAG,CAAE,OACN,CAEA,yCAAc,CACb,OAAO,CAAE,KAAK,CACd,OAAO,CAAE,QAAQ,CACjB,gBAAgB,CAAE,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,IAAI,CAAC,CAC3C,aAAa,CAAE,QAAQ,CACvB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAC1C,eAAe,CAAE,IAAI,CACrB,KAAK,CAAE,OAAO,CACd,UAAU,CAAE,GAAG,CAAC,IACjB,CAEA,yCAAa,MAAO,CACnB,gBAAgB,CAAE,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAC1C,YAAY,CAAE,IAAI,eAAe,CAAC,CAClC,SAAS,CAAE,WAAW,IAAI,CAAC,CAC3B,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CACxC,CAEA,2CAAgB,CACf,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,WAAW,CAAE,UAAU,CACvB,aAAa,CAAE,MAAM,CACrB,GAAG,CAAE,MACN,CAEA,yCAAc,CACb,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,GAAG,CAChB,IAAI,CAAE,CACP,CAEA,6CAAkB,CACjB,SAAS,CAAE,MAAM,CACjB,OAAO,CAAE,QAAQ,CAAC,MAAM,CACxB,gBAAgB,CAAE,IAAI,eAAe,CAAC,CACtC,aAAa,CAAE,OAAO,CACtB,WAAW,CAAE,MAAM,CACnB,WAAW,CAAE,CACd,CAEA,gDAAqB,CACpB,SAAS,CAAE,MAAM,CACjB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,aAAa,CAAE,OAAO,CACtB,WAAW,CAAE,GAAG,CAChB,OAAO,CAAE,WAAW,CACpB,kBAAkB,CAAE,CAAC,CACrB,UAAU,CAAE,CAAC,CACb,kBAAkB,CAAE,QAAQ,CAC5B,QAAQ,CAAE,MACX,CAEA,0CAAe,CACd,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,OAAO,CACZ,SAAS,CAAE,MAAM,CACjB,KAAK,CAAE,IAAI,gBAAgB,CAC5B,CAEA,wCAAa,CACZ,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,UAAU,CAAE,MACb,CAEA,0CAAe,CACd,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,OAAO,CACpB,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAC9C,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,SAAS,CAAE,QACZ,CAEA,4BAAc,CAAC,eAAE,CAChB,MAAM,CAAE,CACT"}'
    };
    OrganizationProjectsWidget = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { organizationProjects = [] } = $$props;
      if ($$props.organizationProjects === void 0 && $$bindings.organizationProjects && organizationProjects !== void 0) $$bindings.organizationProjects(organizationProjects);
      $$result.css.add(css$4);
      return `<div class="organization-projects-widget svelte-8sqfxh">${organizationProjects.length === 0 ? `<div class="empty-state svelte-8sqfxh" data-svelte-h="svelte-acrlz2"><div class="empty-icon svelte-8sqfxh">\u{1F3E2}</div> <p class="svelte-8sqfxh">No organization projects found</p> <p class="empty-hint svelte-8sqfxh">Join organizations on GitHub to see their projects</p></div>` : `<div class="organizations-container svelte-8sqfxh">${each(organizationProjects, (orgData) => {
        return `<div class="organization-section svelte-8sqfxh"><div class="organization-header svelte-8sqfxh"><img${add_attribute("src", orgData.organization.avatar_url, 0)} alt="${escape(orgData.organization.login, true) + " avatar"}" class="org-avatar svelte-8sqfxh"> <div class="org-info svelte-8sqfxh"><h3 class="org-name svelte-8sqfxh">${escape(orgData.organization.login)}</h3> ${orgData.organization.description ? `<p class="org-description svelte-8sqfxh">${escape(orgData.organization.description)}</p>` : ``} </div></div> ${orgData.repositories.length > 0 ? `<div class="projects-grid svelte-8sqfxh">${each(orgData.repositories.slice(0, 6), (project) => {
          return `<a${add_attribute("href", project.html_url, 0)} target="_blank" rel="noopener noreferrer" class="project-tile svelte-8sqfxh"><div class="project-header svelte-8sqfxh"><div class="project-name svelte-8sqfxh">${escape(project.name)}</div> ${project.language ? `<div class="project-language svelte-8sqfxh">${escape(project.language)}</div>` : ``}</div> ${project.description ? `<div class="project-description svelte-8sqfxh">${escape(project.description)}</div>` : ``} <div class="project-stats svelte-8sqfxh"><span>\u2B50 ${escape(project.stargazers_count)}</span> <span>\u{1F374} ${escape(project.forks_count)}</span> ${project.open_issues_count > 0 ? `<span>\u{1F4CB} ${escape(project.open_issues_count)}</span>` : ``}</div> </a>`;
        })}</div> ${orgData.repositories.length > 6 ? `<div class="more-projects svelte-8sqfxh"><p class="svelte-8sqfxh">+ ${escape(orgData.repositories.length - 6)} more projects</p> </div>` : ``}` : `<div class="no-projects svelte-8sqfxh" data-svelte-h="svelte-depaka"><p>No repositories found in this organization</p> </div>`} </div>`;
      })}</div>`} </div>`;
    });
    css$3 = {
      code: ".github-projects-widget.svelte-1h822u5.svelte-1h822u5{max-height:500px;overflow-y:auto}.empty-state.svelte-1h822u5.svelte-1h822u5{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 1rem;color:var(--text-secondary);text-align:center}.empty-icon.svelte-1h822u5.svelte-1h822u5{font-size:3rem;margin-bottom:1rem;opacity:0.5}.empty-state.svelte-1h822u5 p.svelte-1h822u5{margin:0.25rem 0}.empty-hint.svelte-1h822u5.svelte-1h822u5{font-size:0.875rem;opacity:0.7}.login-button.svelte-1h822u5.svelte-1h822u5{margin-top:1rem;padding:0.75rem 1.5rem;background-color:var(--primary);color:white;text-decoration:none;border-radius:6px;font-weight:500;transition:all 0.2s ease;display:inline-block}.login-button.svelte-1h822u5.svelte-1h822u5:hover{background-color:var(--primary-hover);transform:translateY(-1px);box-shadow:0 4px 12px var(--shadow-hover)}.projects-grid.svelte-1h822u5.svelte-1h822u5{display:grid;gap:0.75rem;padding:0.5rem}.project-card.svelte-1h822u5.svelte-1h822u5{display:flex;flex-direction:column;gap:0.5rem;padding:1rem;background-color:var(--surface);border:1px solid var(--border);border-radius:8px;text-decoration:none;color:inherit;transition:all 0.2s ease}.project-card.svelte-1h822u5.svelte-1h822u5:hover{border-color:var(--primary);box-shadow:0 2px 8px var(--shadow);transform:translateY(-2px)}.project-header.svelte-1h822u5.svelte-1h822u5{display:flex;justify-content:space-between;align-items:center;gap:0.5rem}.owner-info.svelte-1h822u5.svelte-1h822u5{display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;color:var(--text-secondary)}.owner-avatar.svelte-1h822u5.svelte-1h822u5{width:20px;height:20px;border-radius:50%;object-fit:cover}.owner-login.svelte-1h822u5.svelte-1h822u5{font-weight:500}.status-badge.svelte-1h822u5.svelte-1h822u5{padding:0.25rem 0.5rem;border-radius:4px;font-size:0.75rem;font-weight:600;text-transform:uppercase}.status-badge.open.svelte-1h822u5.svelte-1h822u5{background-color:rgba(34, 197, 94, 0.2);color:#22c55e}.status-badge.closed.svelte-1h822u5.svelte-1h822u5{background-color:rgba(156, 163, 175, 0.2);color:#9ca3af}.project-title.svelte-1h822u5.svelte-1h822u5{font-size:1.125rem;font-weight:600;color:var(--text-primary);line-height:1.3}.project-description.svelte-1h822u5.svelte-1h822u5{font-size:0.875rem;color:var(--text-secondary);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.project-footer.svelte-1h822u5.svelte-1h822u5{display:flex;align-items:center;gap:0.75rem;font-size:0.75rem;color:var(--text-secondary);padding-top:0.25rem;border-top:1px solid var(--border)}.project-number.svelte-1h822u5.svelte-1h822u5{font-weight:600;color:var(--primary)}.project-visibility.svelte-1h822u5.svelte-1h822u5{display:flex;align-items:center;gap:0.25rem}.project-updated.svelte-1h822u5.svelte-1h822u5{margin-left:auto}.github-projects-widget.svelte-1h822u5.svelte-1h822u5::-webkit-scrollbar{width:8px}.github-projects-widget.svelte-1h822u5.svelte-1h822u5::-webkit-scrollbar-track{background:transparent}.github-projects-widget.svelte-1h822u5.svelte-1h822u5::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}.github-projects-widget.svelte-1h822u5.svelte-1h822u5::-webkit-scrollbar-thumb:hover{background:var(--text-secondary)}",
      map: '{"version":3,"file":"GithubProjectsWidget.svelte","sources":["GithubProjectsWidget.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let projects = [];\\nexport let isLoggedIn = false;\\nfunction formatDate(dateString) {\\n  const date = new Date(dateString);\\n  const now = /* @__PURE__ */ new Date();\\n  const diffMs = now.getTime() - date.getTime();\\n  const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));\\n  if (diffDays === 0) return \\"Today\\";\\n  if (diffDays === 1) return \\"Yesterday\\";\\n  if (diffDays < 7) return `${diffDays} days ago`;\\n  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;\\n  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;\\n  return date.toLocaleDateString();\\n}\\n<\/script>\\r\\n\\r\\n<div class=\\"github-projects-widget\\">\\r\\n\\t{#if !isLoggedIn}\\r\\n\\t\\t<div class=\\"empty-state\\">\\r\\n\\t\\t\\t<div class=\\"empty-icon\\">\u{1F512}</div>\\r\\n\\t\\t\\t<p>Log in to GitHub to see your Projects</p>\\r\\n\\t\\t\\t<a href=\\"/auth/signin\\" class=\\"login-button\\">Sign in with GitHub</a>\\r\\n\\t\\t</div>\\r\\n\\t{:else if projects.length === 0}\\r\\n\\t\\t<div class=\\"empty-state\\">\\r\\n\\t\\t\\t<div class=\\"empty-icon\\">\u{1F4CA}</div>\\r\\n\\t\\t\\t<p>No GitHub Projects found</p>\\r\\n\\t\\t\\t<p class=\\"empty-hint\\">Create projects on GitHub to see them here</p>\\r\\n\\t\\t</div>\\r\\n\\t{:else}\\r\\n\\t\\t<div class=\\"projects-grid\\">\\r\\n\\t\\t\\t{#each projects as project}\\r\\n\\t\\t\\t\\t<a href={project.url} target=\\"_blank\\" rel=\\"noopener noreferrer\\" class=\\"project-card\\">\\r\\n\\t\\t\\t\\t\\t<div class=\\"project-header\\">\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"owner-info\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t{#if project.ownerAvatarUrl}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t<img src={project.ownerAvatarUrl} alt={project.ownerLogin} class=\\"owner-avatar\\" />\\r\\n\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t\\t<span class=\\"owner-login\\">{project.ownerLogin}</span>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t\\t{#if project.closed}\\r\\n\\t\\t\\t\\t\\t\\t\\t<span class=\\"status-badge closed\\">Closed</span>\\r\\n\\t\\t\\t\\t\\t\\t{:else}\\r\\n\\t\\t\\t\\t\\t\\t\\t<span class=\\"status-badge open\\">Open</span>\\r\\n\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t<div class=\\"project-title\\">{project.title}</div>\\r\\n\\t\\t\\t\\t\\t{#if project.shortDescription}\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"project-description\\">{project.shortDescription}</div>\\r\\n\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t<div class=\\"project-footer\\">\\r\\n\\t\\t\\t\\t\\t\\t<span class=\\"project-number\\">#{project.number}</span>\\r\\n\\t\\t\\t\\t\\t\\t<span class=\\"project-visibility\\">{project.public ? \'\u{1F310} Public\' : \'\u{1F512} Private\'}</span>\\r\\n\\t\\t\\t\\t\\t\\t<span class=\\"project-updated\\">Updated {formatDate(project.updatedAt)}</span>\\r\\n\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t</a>\\r\\n\\t\\t\\t{/each}\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.github-projects-widget {\\r\\n\\t\\tmax-height: 500px;\\r\\n\\t\\toverflow-y: auto;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-state {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tpadding: 3rem 1rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\ttext-align: center;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-icon {\\r\\n\\t\\tfont-size: 3rem;\\r\\n\\t\\tmargin-bottom: 1rem;\\r\\n\\t\\topacity: 0.5;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-state p {\\r\\n\\t\\tmargin: 0.25rem 0;\\r\\n\\t}\\r\\n\\r\\n\\t.empty-hint {\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\topacity: 0.7;\\r\\n\\t}\\r\\n\\r\\n\\t.login-button {\\r\\n\\t\\tmargin-top: 1rem;\\r\\n\\t\\tpadding: 0.75rem 1.5rem;\\r\\n\\t\\tbackground-color: var(--primary);\\r\\n\\t\\tcolor: white;\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t\\tborder-radius: 6px;\\r\\n\\t\\tfont-weight: 500;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t\\tdisplay: inline-block;\\r\\n\\t}\\r\\n\\r\\n\\t.login-button:hover {\\r\\n\\t\\tbackground-color: var(--primary-hover);\\r\\n\\t\\ttransform: translateY(-1px);\\r\\n\\t\\tbox-shadow: 0 4px 12px var(--shadow-hover);\\r\\n\\t}\\r\\n\\r\\n\\t.projects-grid {\\r\\n\\t\\tdisplay: grid;\\r\\n\\t\\tgap: 0.75rem;\\r\\n\\t\\tpadding: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.project-card {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tbackground-color: var(--surface);\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 8px;\\r\\n\\t\\ttext-decoration: none;\\r\\n\\t\\tcolor: inherit;\\r\\n\\t\\ttransition: all 0.2s ease;\\r\\n\\t}\\r\\n\\r\\n\\t.project-card:hover {\\r\\n\\t\\tborder-color: var(--primary);\\r\\n\\t\\tbox-shadow: 0 2px 8px var(--shadow);\\r\\n\\t\\ttransform: translateY(-2px);\\r\\n\\t}\\r\\n\\r\\n\\t.project-header {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.owner-info {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t}\\r\\n\\r\\n\\t.owner-avatar {\\r\\n\\t\\twidth: 20px;\\r\\n\\t\\theight: 20px;\\r\\n\\t\\tborder-radius: 50%;\\r\\n\\t\\tobject-fit: cover;\\r\\n\\t}\\r\\n\\r\\n\\t.owner-login {\\r\\n\\t\\tfont-weight: 500;\\r\\n\\t}\\r\\n\\r\\n\\t.status-badge {\\r\\n\\t\\tpadding: 0.25rem 0.5rem;\\r\\n\\t\\tborder-radius: 4px;\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\ttext-transform: uppercase;\\r\\n\\t}\\r\\n\\r\\n\\t.status-badge.open {\\r\\n\\t\\tbackground-color: rgba(34, 197, 94, 0.2);\\r\\n\\t\\tcolor: #22c55e;\\r\\n\\t}\\r\\n\\r\\n\\t.status-badge.closed {\\r\\n\\t\\tbackground-color: rgba(156, 163, 175, 0.2);\\r\\n\\t\\tcolor: #9ca3af;\\r\\n\\t}\\r\\n\\r\\n\\t.project-title {\\r\\n\\t\\tfont-size: 1.125rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tline-height: 1.3;\\r\\n\\t}\\r\\n\\r\\n\\t.project-description {\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tline-height: 1.4;\\r\\n\\t\\tdisplay: -webkit-box;\\r\\n\\t\\t-webkit-line-clamp: 2;\\r\\n\\t\\tline-clamp: 2;\\r\\n\\t\\t-webkit-box-orient: vertical;\\r\\n\\t\\toverflow: hidden;\\r\\n\\t}\\r\\n\\r\\n\\t.project-footer {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tgap: 0.75rem;\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tpadding-top: 0.25rem;\\r\\n\\t\\tborder-top: 1px solid var(--border);\\r\\n\\t}\\r\\n\\r\\n\\t.project-number {\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tcolor: var(--primary);\\r\\n\\t}\\r\\n\\r\\n\\t.project-visibility {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tgap: 0.25rem;\\r\\n\\t}\\r\\n\\r\\n\\t.project-updated {\\r\\n\\t\\tmargin-left: auto;\\r\\n\\t}\\r\\n\\r\\n\\t/* Scrollbar styling */\\r\\n\\t.github-projects-widget::-webkit-scrollbar {\\r\\n\\t\\twidth: 8px;\\r\\n\\t}\\r\\n\\r\\n\\t.github-projects-widget::-webkit-scrollbar-track {\\r\\n\\t\\tbackground: transparent;\\r\\n\\t}\\r\\n\\r\\n\\t.github-projects-widget::-webkit-scrollbar-thumb {\\r\\n\\t\\tbackground: var(--border);\\r\\n\\t\\tborder-radius: 4px;\\r\\n\\t}\\r\\n\\r\\n\\t.github-projects-widget::-webkit-scrollbar-thumb:hover {\\r\\n\\t\\tbackground: var(--text-secondary);\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"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"}'
    };
    GithubProjectsWidget = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { projects = [] } = $$props;
      let { isLoggedIn = false } = $$props;
      if ($$props.projects === void 0 && $$bindings.projects && projects !== void 0) $$bindings.projects(projects);
      if ($$props.isLoggedIn === void 0 && $$bindings.isLoggedIn && isLoggedIn !== void 0) $$bindings.isLoggedIn(isLoggedIn);
      $$result.css.add(css$3);
      return `<div class="github-projects-widget svelte-1h822u5">${!isLoggedIn ? `<div class="empty-state svelte-1h822u5" data-svelte-h="svelte-bndtqd"><div class="empty-icon svelte-1h822u5">\u{1F512}</div> <p class="svelte-1h822u5">Log in to GitHub to see your Projects</p> <a href="/auth/signin" class="login-button svelte-1h822u5">Sign in with GitHub</a></div>` : `${projects.length === 0 ? `<div class="empty-state svelte-1h822u5" data-svelte-h="svelte-7goofp"><div class="empty-icon svelte-1h822u5">\u{1F4CA}</div> <p class="svelte-1h822u5">No GitHub Projects found</p> <p class="empty-hint svelte-1h822u5">Create projects on GitHub to see them here</p></div>` : `<div class="projects-grid svelte-1h822u5">${each(projects, (project) => {
        return `<a${add_attribute("href", project.url, 0)} target="_blank" rel="noopener noreferrer" class="project-card svelte-1h822u5"><div class="project-header svelte-1h822u5"><div class="owner-info svelte-1h822u5">${project.ownerAvatarUrl ? `<img${add_attribute("src", project.ownerAvatarUrl, 0)}${add_attribute("alt", project.ownerLogin, 0)} class="owner-avatar svelte-1h822u5">` : ``} <span class="owner-login svelte-1h822u5">${escape(project.ownerLogin)}</span></div> ${project.closed ? `<span class="status-badge closed svelte-1h822u5" data-svelte-h="svelte-yz1hjx">Closed</span>` : `<span class="status-badge open svelte-1h822u5" data-svelte-h="svelte-e541f1">Open</span>`}</div> <div class="project-title svelte-1h822u5">${escape(project.title)}</div> ${project.shortDescription ? `<div class="project-description svelte-1h822u5">${escape(project.shortDescription)}</div>` : ``} <div class="project-footer svelte-1h822u5"><span class="project-number svelte-1h822u5">#${escape(project.number)}</span> <span class="project-visibility svelte-1h822u5">${escape(project.public ? "\u{1F310} Public" : "\u{1F512} Private")}</span> <span class="project-updated svelte-1h822u5">Updated ${escape(formatDate(project.updatedAt))}</span></div> </a>`;
      })}</div>`}`} </div>`;
    });
    css$22 = {
      code: ".widget.svelte-stst01.svelte-stst01{width:100%;background-color:var(--surface);border:1px solid var(--border);border-radius:0.5rem;box-shadow:0 4px 6px var(--shadow);overflow:hidden;transition:box-shadow 0.2s, transform 0.1s ease, background-color 0.3s ease;margin-bottom:1rem;position:relative}.widget.collapsed.svelte-stst01.svelte-stst01{margin-bottom:0.5rem}.widget.svelte-stst01.svelte-stst01:hover{box-shadow:0 6px 12px var(--shadow-hover)}.widget.dragging.svelte-stst01.svelte-stst01{opacity:0.6;cursor:grabbing;box-shadow:0 12px 24px var(--shadow-hover);z-index:1000;transform:translateY(-4px) scale(1.02);transition:none;pointer-events:none}.widget-header.svelte-stst01.svelte-stst01{background-color:var(--surface-variant);padding:0.75rem 1rem;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none}.widget-header.svelte-stst01 h3.svelte-stst01{font-size:1rem;font-weight:600;margin:0;flex:1}.header-buttons.svelte-stst01.svelte-stst01{display:flex;align-items:center;gap:0.5rem}.collapse-button.svelte-stst01.svelte-stst01{background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:0.875rem;padding:0.25rem;line-height:1;border-radius:0.25rem;transition:color 0.2s, background-color 0.2s}.collapse-button.svelte-stst01.svelte-stst01:hover{color:var(--text-primary);background-color:var(--surface-hover)}.drag-handle.svelte-stst01.svelte-stst01{background:none;border:none;color:var(--text-secondary);cursor:move;font-size:1.25rem;padding:0;line-height:1}.widget-content.svelte-stst01.svelte-stst01{padding:1rem}",
      map: `{"version":3,"file":"Widget.svelte","sources":["Widget.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { widgets, isDraggingAny } from \\"$lib/stores/widgets\\";\\nimport { createEventDispatcher } from \\"svelte\\";\\nexport let widget;\\nconst dispatch = createEventDispatcher();\\nlet isDragging = false;\\nlet dragOffset = { x: 0, y: 0 };\\nlet dragElement;\\nfunction handleMouseDown(e) {\\n  if (e.target.closest(\\".widget-header\\")) {\\n    if (e.target.closest(\\".collapse-button\\")) {\\n      return;\\n    }\\n    isDragging = true;\\n    isDraggingAny.set(true);\\n    const rect = dragElement.getBoundingClientRect();\\n    dragOffset = {\\n      x: e.clientX - rect.left,\\n      y: e.clientY - rect.top\\n    };\\n    e.preventDefault();\\n  }\\n}\\nfunction handleMouseMove(e) {\\n  if (isDragging) {\\n    const columns = document.querySelectorAll(\\".column-content\\");\\n    let targetColumn = -1;\\n    let targetOrder = 0;\\n    columns.forEach((column, columnIndex) => {\\n      const rect = column.getBoundingClientRect();\\n      if (e.clientX >= rect.left && e.clientX <= rect.right) {\\n        targetColumn = columnIndex;\\n        const widgets2 = column.querySelectorAll(\\".widget-container\\");\\n        let insertIndex = widgets2.length;\\n        widgets2.forEach((w, index) => {\\n          const wRect = w.getBoundingClientRect();\\n          if (e.clientY < wRect.top + wRect.height / 2) {\\n            insertIndex = Math.min(insertIndex, index);\\n          }\\n        });\\n        targetOrder = insertIndex;\\n      }\\n    });\\n  }\\n}\\nfunction handleMouseUp(e) {\\n  if (isDragging) {\\n    const sections = document.querySelectorAll(\\".section\\");\\n    let targetSection = widget.section;\\n    let targetOrder = widget.order;\\n    let closestSectionElement = null;\\n    let closestSectionIndex = widget.section;\\n    let closestDistance = Infinity;\\n    sections.forEach((sectionEl, sectionIndex) => {\\n      const rect = sectionEl.getBoundingClientRect();\\n      const centerX = rect.left + rect.width / 2;\\n      const centerY = rect.top + rect.height / 2;\\n      const distance = Math.sqrt(\\n        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)\\n      );\\n      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom || distance < closestDistance) {\\n        closestDistance = distance;\\n        closestSectionElement = sectionEl;\\n        closestSectionIndex = sectionIndex;\\n      }\\n    });\\n    if (closestSectionElement) {\\n      targetSection = closestSectionIndex;\\n      const widgetElements = closestSectionElement.querySelectorAll(\\".widget-container\\");\\n      let insertIndex = widgetElements.length;\\n      widgetElements.forEach((w, index) => {\\n        const wRect = w.getBoundingClientRect();\\n        if (e.clientY < wRect.top + wRect.height / 2) {\\n          insertIndex = Math.min(insertIndex, index);\\n        }\\n      });\\n      targetOrder = insertIndex;\\n    }\\n    if (targetSection !== widget.section || targetOrder !== widget.order) {\\n      dispatch(\\"widgetDrop\\", {\\n        widgetId: widget.id,\\n        targetSection,\\n        targetOrder\\n      });\\n    }\\n    isDragging = false;\\n    isDraggingAny.set(false);\\n  }\\n}\\nfunction toggleCollapse() {\\n  widgets.toggleCollapse(widget.id);\\n}\\n$: if (typeof window !== \\"undefined\\") {\\n  if (isDragging) {\\n    document.addEventListener(\\"mousemove\\", handleMouseMove);\\n    document.addEventListener(\\"mouseup\\", handleMouseUp);\\n  } else {\\n    document.removeEventListener(\\"mousemove\\", handleMouseMove);\\n    document.removeEventListener(\\"mouseup\\", handleMouseUp);\\n  }\\n}\\n<\/script>\\r\\n\\r\\n<div\\r\\n\\tbind:this={dragElement}\\r\\n\\tclass=\\"widget\\"\\r\\n\\tclass:dragging={isDragging}\\r\\n\\tclass:collapsed={widget.collapsed}\\r\\n>\\r\\n\\t<div class=\\"widget-header\\" on:mousedown={handleMouseDown} role=\\"button\\" tabindex=\\"0\\">\\r\\n\\t\\t<h3>{widget.title}</h3>\\r\\n\\t\\t<div class=\\"header-buttons\\">\\r\\n\\t\\t\\t<button \\r\\n\\t\\t\\t\\tclass=\\"collapse-button\\" \\r\\n\\t\\t\\t\\ton:click={toggleCollapse}\\r\\n\\t\\t\\t\\taria-label={widget.collapsed ? 'Expand widget' : 'Collapse widget'}\\r\\n\\t\\t\\t\\ttype=\\"button\\"\\r\\n\\t\\t\\t>\\r\\n\\t\\t\\t\\t{widget.collapsed ? '\u25BC' : '\u25B2'}\\r\\n\\t\\t\\t</button>\\r\\n\\t\\t\\t<button class=\\"drag-handle\\" aria-label=\\"Drag widget\\" type=\\"button\\">\u22EE\u22EE</button>\\r\\n\\t\\t</div>\\r\\n\\t</div>\\r\\n\\t{#if !widget.collapsed}\\r\\n\\t\\t<div class=\\"widget-content\\">\\r\\n\\t\\t\\t<slot />\\r\\n\\t\\t</div>\\r\\n\\t{/if}\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.widget {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tbackground-color: var(--surface);\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 0.5rem;\\r\\n\\t\\tbox-shadow: 0 4px 6px var(--shadow);\\r\\n\\t\\toverflow: hidden;\\r\\n\\t\\ttransition: box-shadow 0.2s, transform 0.1s ease, background-color 0.3s ease;\\r\\n\\t\\tmargin-bottom: 1rem;\\r\\n\\t\\tposition: relative;\\r\\n\\t}\\r\\n\\r\\n\\t.widget.collapsed {\\r\\n\\t\\tmargin-bottom: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.widget:hover {\\r\\n\\t\\tbox-shadow: 0 6px 12px var(--shadow-hover);\\r\\n\\t}\\r\\n\\r\\n\\t.widget.dragging {\\r\\n\\t\\topacity: 0.6;\\r\\n\\t\\tcursor: grabbing;\\r\\n\\t\\tbox-shadow: 0 12px 24px var(--shadow-hover);\\r\\n\\t\\tz-index: 1000;\\r\\n\\t\\ttransform: translateY(-4px) scale(1.02);\\r\\n\\t\\ttransition: none;\\r\\n\\t\\tpointer-events: none;\\r\\n\\t}\\r\\n\\r\\n\\t.widget-header {\\r\\n\\t\\tbackground-color: var(--surface-variant);\\r\\n\\t\\tpadding: 0.75rem 1rem;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tcursor: move;\\r\\n\\t\\tuser-select: none;\\r\\n\\t}\\r\\n\\r\\n\\t.widget-header h3 {\\r\\n\\t\\tfont-size: 1rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tmargin: 0;\\r\\n\\t\\tflex: 1;\\r\\n\\t}\\r\\n\\r\\n\\t.header-buttons {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t}\\r\\n\\r\\n\\t.collapse-button {\\r\\n\\t\\tbackground: none;\\r\\n\\t\\tborder: none;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tpadding: 0.25rem;\\r\\n\\t\\tline-height: 1;\\r\\n\\t\\tborder-radius: 0.25rem;\\r\\n\\t\\ttransition: color 0.2s, background-color 0.2s;\\r\\n\\t}\\r\\n\\r\\n\\t.collapse-button:hover {\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\tbackground-color: var(--surface-hover);\\r\\n\\t}\\r\\n\\r\\n\\t.drag-handle {\\r\\n\\t\\tbackground: none;\\r\\n\\t\\tborder: none;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tcursor: move;\\r\\n\\t\\tfont-size: 1.25rem;\\r\\n\\t\\tpadding: 0;\\r\\n\\t\\tline-height: 1;\\r\\n\\t}\\r\\n\\r\\n\\t.widget-content {\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAkIC,mCAAQ,CACP,KAAK,CAAE,IAAI,CACX,gBAAgB,CAAE,IAAI,SAAS,CAAC,CAChC,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,IAAI,QAAQ,CAAC,CAC/B,aAAa,CAAE,MAAM,CACrB,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,GAAG,CAAC,IAAI,QAAQ,CAAC,CACnC,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,UAAU,CAAC,IAAI,CAAC,CAAC,SAAS,CAAC,IAAI,CAAC,IAAI,CAAC,CAAC,gBAAgB,CAAC,IAAI,CAAC,IAAI,CAC5E,aAAa,CAAE,IAAI,CACnB,QAAQ,CAAE,QACX,CAEA,OAAO,sCAAW,CACjB,aAAa,CAAE,MAChB,CAEA,mCAAO,MAAO,CACb,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,IAAI,CAAC,IAAI,cAAc,CAC1C,CAEA,OAAO,qCAAU,CAChB,OAAO,CAAE,GAAG,CACZ,MAAM,CAAE,QAAQ,CAChB,UAAU,CAAE,CAAC,CAAC,IAAI,CAAC,IAAI,CAAC,IAAI,cAAc,CAAC,CAC3C,OAAO,CAAE,IAAI,CACb,SAAS,CAAE,WAAW,IAAI,CAAC,CAAC,MAAM,IAAI,CAAC,CACvC,UAAU,CAAE,IAAI,CAChB,cAAc,CAAE,IACjB,CAEA,0CAAe,CACd,gBAAgB,CAAE,IAAI,iBAAiB,CAAC,CACxC,OAAO,CAAE,OAAO,CAAC,IAAI,CACrB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,CAC9B,WAAW,CAAE,MAAM,CACnB,MAAM,CAAE,IAAI,CACZ,WAAW,CAAE,IACd,CAEA,4BAAc,CAAC,gBAAG,CACjB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,GAAG,CAChB,MAAM,CAAE,CAAC,CACT,IAAI,CAAE,CACP,CAEA,2CAAgB,CACf,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,GAAG,CAAE,MACN,CAEA,4CAAiB,CAChB,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,MAAM,CAAE,OAAO,CACf,SAAS,CAAE,QAAQ,CACnB,OAAO,CAAE,OAAO,CAChB,WAAW,CAAE,CAAC,CACd,aAAa,CAAE,OAAO,CACtB,UAAU,CAAE,KAAK,CAAC,IAAI,CAAC,CAAC,gBAAgB,CAAC,IAC1C,CAEA,4CAAgB,MAAO,CACtB,KAAK,CAAE,IAAI,cAAc,CAAC,CAC1B,gBAAgB,CAAE,IAAI,eAAe,CACtC,CAEA,wCAAa,CACZ,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,MAAM,CAAE,IAAI,CACZ,SAAS,CAAE,OAAO,CAClB,OAAO,CAAE,CAAC,CACV,WAAW,CAAE,CACd,CAEA,2CAAgB,CACf,OAAO,CAAE,IACV"}`
    };
    Widget = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { widget } = $$props;
      createEventDispatcher();
      let dragElement;
      function handleMouseMove(e3) {
      }
      __name(handleMouseMove, "handleMouseMove");
      function handleMouseUp(e3) {
      }
      __name(handleMouseUp, "handleMouseUp");
      if ($$props.widget === void 0 && $$bindings.widget && widget !== void 0) $$bindings.widget(widget);
      $$result.css.add(css$22);
      {
        if (typeof window !== "undefined") {
          {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          }
        }
      }
      return `<div class="${[
        "widget svelte-stst01",
        " " + (widget.collapsed ? "collapsed" : "")
      ].join(" ").trim()}"${add_attribute("this", dragElement, 0)}><div class="widget-header svelte-stst01" role="button" tabindex="0"><h3 class="svelte-stst01">${escape(widget.title)}</h3> <div class="header-buttons svelte-stst01"><button class="collapse-button svelte-stst01"${add_attribute("aria-label", widget.collapsed ? "Expand widget" : "Collapse widget", 0)} type="button">${escape(widget.collapsed ? "\u25BC" : "\u25B2")}</button> <button class="drag-handle svelte-stst01" aria-label="Drag widget" type="button" data-svelte-h="svelte-1d4b2ek">\u22EE\u22EE</button></div></div> ${!widget.collapsed ? `<div class="widget-content svelte-stst01">${slots.default ? slots.default({}) : ``}</div>` : ``} </div>`;
    });
    css$12 = {
      code: ".dashboard-layout.svelte-12g5v36{display:grid;grid-template-columns:repeat(3, 1fr);gap:1rem;width:100%;height:100%;padding:1rem;overflow-y:auto;position:relative;grid-auto-rows:minmax(min-content, max-content)}.drop-zone.svelte-12g5v36{position:absolute;top:0;bottom:0;pointer-events:none;opacity:0;transition:opacity 0.2s;display:flex;align-items:center;justify-content:center;background-color:var(--primary-container);border:2px dashed var(--primary);border-radius:8px;z-index:1}.drop-zone.active.svelte-12g5v36{pointer-events:all;opacity:1}.drop-zone-label.svelte-12g5v36{font-size:0.875rem;font-weight:600;color:var(--primary);text-transform:uppercase;letter-spacing:1px}.section.svelte-12g5v36{display:flex;flex-direction:column;background-color:var(--surface);border-radius:8px;border:2px solid var(--border);overflow:hidden;min-height:fit-content;height:fit-content;position:relative;z-index:2;transition:transform 0.2s, box-shadow 0.2s, border-color 0.2s;cursor:move}.section.svelte-12g5v36:hover{border-color:var(--primary);box-shadow:0 2px 8px var(--shadow)}.section.dragging.svelte-12g5v36{opacity:0.5;transform:scale(0.98)}.section-controls.svelte-12g5v36{display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0.75rem;background-color:var(--surface-variant);border-bottom:1px solid var(--border);gap:0.5rem}.drag-handle.svelte-12g5v36{cursor:grab;color:var(--text-secondary)}.drag-handle.svelte-12g5v36:active{cursor:grabbing}.resize-controls.svelte-12g5v36{display:flex;align-items:center;gap:0.25rem}.control-btn.svelte-12g5v36{display:flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;background-color:transparent;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--text-primary);transition:background-color 0.2s, border-color 0.2s}.control-btn.svelte-12g5v36:hover:not(:disabled){background-color:var(--surface-hover);border-color:var(--primary)}.control-btn.svelte-12g5v36:active:not(:disabled){background-color:var(--surface-variant)}.control-btn.svelte-12g5v36:disabled{opacity:0.4;cursor:not-allowed}.span-indicator.svelte-12g5v36{font-size:0.75rem;font-weight:600;color:var(--text-secondary);padding:0 0.25rem;min-width:35px;text-align:center}.section-content.svelte-12g5v36{padding:1rem;display:flex;flex-direction:column;gap:1rem;cursor:default}.widget-container.svelte-12g5v36{width:100%}@media(max-width: 1024px){.dashboard-layout.svelte-12g5v36{grid-template-columns:repeat(2, 1fr);grid-auto-flow:row}.section.svelte-12g5v36{grid-column:auto / span 1 !important;grid-row:auto !important}}@media(max-width: 768px){.dashboard-layout.svelte-12g5v36{grid-template-columns:1fr;padding:0.5rem;gap:0.75rem;grid-auto-flow:row}.section.svelte-12g5v36{grid-column:1 / span 1 !important;grid-row:auto !important}.section-content.svelte-12g5v36{padding:0.75rem}.drop-zone.svelte-12g5v36{display:none}}",
      map: `{"version":3,"file":"ColumnLayout.svelte","sources":["ColumnLayout.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { widgets, sections, isDraggingAny } from \\"$lib/stores/widgets\\";\\nimport Widget from \\"$lib/components/Widget.svelte\\";\\nexport let widgetComponents;\\nexport let data;\\nlet containerRef;\\nlet draggedSectionId = null;\\nlet isDraggingFromHandle = false;\\n$: widgetsBySection = $widgets.reduce((acc, widget) => {\\n  if (!acc[widget.section]) {\\n    acc[widget.section] = [];\\n  }\\n  acc[widget.section].push(widget);\\n  return acc;\\n}, {});\\n$: {\\n  Object.keys(widgetsBySection).forEach((sectionId) => {\\n    const widgets2 = widgetsBySection[parseInt(sectionId)];\\n    if (widgets2 && Array.isArray(widgets2)) {\\n      widgets2.sort((a, b) => a.order - b.order);\\n    }\\n  });\\n}\\n$: sortedSections = [...$sections].map((s) => ({\\n  ...s,\\n  gridColumnSpan: s.gridColumnSpan ?? 1\\n})).sort((a, b) => {\\n  if (a.gridRow !== b.gridRow) return a.gridRow - b.gridRow;\\n  return a.gridColumn - b.gridColumn;\\n});\\nfunction handleSectionDragStart(sectionId, event) {\\n  if (!isDraggingFromHandle) {\\n    event.preventDefault();\\n    return;\\n  }\\n  draggedSectionId = sectionId;\\n  isDraggingAny.set(true);\\n  if (event.dataTransfer) {\\n    event.dataTransfer.effectAllowed = \\"move\\";\\n    event.dataTransfer.setData(\\"text/plain\\", sectionId.toString());\\n  }\\n}\\nfunction handleDragHandleMouseDown() {\\n  isDraggingFromHandle = true;\\n}\\nfunction handleDragHandleMouseUp() {\\n  isDraggingFromHandle = false;\\n}\\nfunction handleSectionDragOver(event) {\\n  event.preventDefault();\\n  if (event.dataTransfer) {\\n    event.dataTransfer.dropEffect = \\"move\\";\\n  }\\n}\\nfunction handleSectionDrop(targetColumn, event) {\\n  event.preventDefault();\\n  if (draggedSectionId !== null) {\\n    const validColumn = Math.max(1, Math.min(3, targetColumn));\\n    sections.moveSection(draggedSectionId, validColumn);\\n  }\\n  draggedSectionId = null;\\n  isDraggingAny.set(false);\\n}\\nfunction handleSectionDragEnd() {\\n  draggedSectionId = null;\\n  isDraggingAny.set(false);\\n  isDraggingFromHandle = false;\\n}\\nfunction increaseSpan(sectionId) {\\n  const section = $sections.find((s) => s.id === sectionId);\\n  if (section) {\\n    sections.resizeSection(sectionId, section.gridColumnSpan + 1);\\n  }\\n}\\nfunction decreaseSpan(sectionId) {\\n  const section = $sections.find((s) => s.id === sectionId);\\n  if (section) {\\n    sections.resizeSection(sectionId, section.gridColumnSpan - 1);\\n  }\\n}\\nfunction handleWidgetDrop(event) {\\n  const { targetSection, targetOrder, widgetId } = event.detail;\\n  if (widgetId) {\\n    widgets.moveWidget(widgetId, targetSection, targetOrder);\\n  }\\n}\\n<\/script>\\r\\n\\r\\n<div class=\\"dashboard-layout\\" bind:this={containerRef}>\\r\\n\\t<!-- Drop zones for each column -->\\r\\n\\t{#each [1, 2, 3] as columnNum}\\r\\n\\t\\t<div \\r\\n\\t\\t\\tclass=\\"drop-zone\\" \\r\\n\\t\\t\\tclass:active={draggedSectionId !== null}\\r\\n\\t\\t\\tstyle=\\"grid-column: {columnNum}; grid-row: 1 / -1;\\"\\r\\n\\t\\t\\ton:dragover={handleSectionDragOver}\\r\\n\\t\\t\\ton:drop={(e) => handleSectionDrop(columnNum, e)}\\r\\n\\t\\t\\trole=\\"region\\"\\r\\n\\t\\t\\taria-label=\\"Drop zone for column {columnNum}\\"\\r\\n\\t\\t>\\r\\n\\t\\t\\t{#if draggedSectionId !== null}\\r\\n\\t\\t\\t\\t<span class=\\"drop-zone-label\\">Drop here</span>\\r\\n\\t\\t\\t{/if}\\r\\n\\t\\t</div>\\r\\n\\t{/each}\\r\\n\\t\\r\\n\\t{#each sortedSections as section (section.id)}\\r\\n\\t\\t<div \\r\\n\\t\\t\\tclass=\\"section\\"\\r\\n\\t\\t\\tclass:dragging={draggedSectionId === section.id}\\r\\n\\t\\t\\tstyle=\\"grid-column: {section.gridColumn} / span {section.gridColumnSpan}; grid-row: {section.gridRow};\\"\\r\\n\\t\\t\\tdraggable=\\"true\\"\\r\\n\\t\\t\\ton:dragstart={(e) => handleSectionDragStart(section.id, e)}\\r\\n\\t\\t\\ton:dragend={handleSectionDragEnd}\\r\\n\\t\\t\\trole=\\"region\\"\\r\\n\\t\\t\\taria-label=\\"Section {section.id}\\"\\r\\n\\t\\t>\\r\\n\\t\\t\\t<!-- Section Controls -->\\r\\n\\t\\t\\t<div class=\\"section-controls\\">\\r\\n\\t\\t\\t\\t<button \\r\\n\\t\\t\\t\\t\\tclass=\\"control-btn drag-handle\\"\\r\\n\\t\\t\\t\\t\\ttitle=\\"Drag to move section\\"\\r\\n\\t\\t\\t\\t\\taria-label=\\"Drag to move section\\"\\r\\n\\t\\t\\t\\t\\ton:mousedown={handleDragHandleMouseDown}\\r\\n\\t\\t\\t\\t\\ton:mouseup={handleDragHandleMouseUp}\\r\\n\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t<svg width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 16 16\\" fill=\\"currentColor\\">\\r\\n\\t\\t\\t\\t\\t\\t<path d=\\"M10 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z\\"/>\\r\\n\\t\\t\\t\\t\\t</svg>\\r\\n\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t<div class=\\"resize-controls\\">\\r\\n\\t\\t\\t\\t\\t<button \\r\\n\\t\\t\\t\\t\\t\\tclass=\\"control-btn\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => decreaseSpan(section.id)}\\r\\n\\t\\t\\t\\t\\t\\tdisabled={section.gridColumnSpan <= 1}\\r\\n\\t\\t\\t\\t\\t\\ttitle=\\"Decrease width\\"\\r\\n\\t\\t\\t\\t\\t\\taria-label=\\"Decrease section width\\"\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t<svg width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 16 16\\" fill=\\"currentColor\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<path d=\\"M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z\\"/>\\r\\n\\t\\t\\t\\t\\t\\t</svg>\\r\\n\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t\\t<span class=\\"span-indicator\\">{section.gridColumnSpan}col</span>\\r\\n\\t\\t\\t\\t\\t<button \\r\\n\\t\\t\\t\\t\\t\\tclass=\\"control-btn\\"\\r\\n\\t\\t\\t\\t\\t\\ton:click={() => increaseSpan(section.id)}\\r\\n\\t\\t\\t\\t\\t\\tdisabled={section.gridColumn + section.gridColumnSpan > 3}\\r\\n\\t\\t\\t\\t\\t\\ttitle=\\"Increase width\\"\\r\\n\\t\\t\\t\\t\\t\\taria-label=\\"Increase section width\\"\\r\\n\\t\\t\\t\\t\\t>\\r\\n\\t\\t\\t\\t\\t\\t<svg width=\\"16\\" height=\\"16\\" viewBox=\\"0 0 16 16\\" fill=\\"currentColor\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<path d=\\"M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z\\"/>\\r\\n\\t\\t\\t\\t\\t\\t</svg>\\r\\n\\t\\t\\t\\t\\t</button>\\r\\n\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t\\t\\r\\n\\t\\t\\t<div class=\\"section-content\\">\\r\\n\\t\\t\\t\\t{#if widgetsBySection[section.id]}\\r\\n\\t\\t\\t\\t\\t{#each widgetsBySection[section.id] as widget (widget.id)}\\r\\n\\t\\t\\t\\t\\t\\t<div class=\\"widget-container\\">\\r\\n\\t\\t\\t\\t\\t\\t\\t<Widget {widget} on:widgetDrop={handleWidgetDrop}>\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{#if widget.type === 'weather'}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<svelte:component this={widgetComponents.WeatherWidget} />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else if widget.type === 'traffic'}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<svelte:component this={widgetComponents.TrafficWidget} />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else if widget.type === 'calendar'}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<svelte:component this={widgetComponents.CalendarWidget} />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else if widget.type === 'github'}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<svelte:component this={widgetComponents.GithubWidget} projects={data.githubProjects || []} />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else if widget.type === 'organization-projects'}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<svelte:component this={widgetComponents.OrganizationProjectsWidget} organizationProjects={data.organizationProjects || []} />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{:else if widget.type === 'github-projects'}\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<svelte:component this={widgetComponents.GithubProjectsWidget} projects={data.allGithubProjects || []} isLoggedIn={!!data.user} />\\r\\n\\t\\t\\t\\t\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t\\t\\t\\t\\t</Widget>\\r\\n\\t\\t\\t\\t\\t\\t</div>\\r\\n\\t\\t\\t\\t\\t{/each}\\r\\n\\t\\t\\t\\t{/if}\\r\\n\\t\\t\\t</div>\\r\\n\\t\\t</div>\\r\\n\\t{/each}\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.dashboard-layout {\\r\\n\\t\\tdisplay: grid;\\r\\n\\t\\tgrid-template-columns: repeat(3, 1fr);\\r\\n\\t\\tgap: 1rem;\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\theight: 100%;\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\toverflow-y: auto;\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tgrid-auto-rows: minmax(min-content, max-content);\\r\\n\\t}\\r\\n\\t\\r\\n\\t.drop-zone {\\r\\n\\t\\tposition: absolute;\\r\\n\\t\\ttop: 0;\\r\\n\\t\\tbottom: 0;\\r\\n\\t\\tpointer-events: none;\\r\\n\\t\\topacity: 0;\\r\\n\\t\\ttransition: opacity 0.2s;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\tbackground-color: var(--primary-container);\\r\\n\\t\\tborder: 2px dashed var(--primary);\\r\\n\\t\\tborder-radius: 8px;\\r\\n\\t\\tz-index: 1;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.drop-zone.active {\\r\\n\\t\\tpointer-events: all;\\r\\n\\t\\topacity: 1;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.drop-zone-label {\\r\\n\\t\\tfont-size: 0.875rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tcolor: var(--primary);\\r\\n\\t\\ttext-transform: uppercase;\\r\\n\\t\\tletter-spacing: 1px;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.section {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tbackground-color: var(--surface);\\r\\n\\t\\tborder-radius: 8px;\\r\\n\\t\\tborder: 2px solid var(--border);\\r\\n\\t\\toverflow: hidden;\\r\\n\\t\\tmin-height: fit-content;\\r\\n\\t\\theight: fit-content;\\r\\n\\t\\tposition: relative;\\r\\n\\t\\tz-index: 2;\\r\\n\\t\\ttransition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;\\r\\n\\t\\tcursor: move;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.section:hover {\\r\\n\\t\\tborder-color: var(--primary);\\r\\n\\t\\tbox-shadow: 0 2px 8px var(--shadow);\\r\\n\\t}\\r\\n\\t\\r\\n\\t.section.dragging {\\r\\n\\t\\topacity: 0.5;\\r\\n\\t\\ttransform: scale(0.98);\\r\\n\\t}\\r\\n\\t\\r\\n\\t.section-controls {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: space-between;\\r\\n\\t\\tpadding: 0.5rem 0.75rem;\\r\\n\\t\\tbackground-color: var(--surface-variant);\\r\\n\\t\\tborder-bottom: 1px solid var(--border);\\r\\n\\t\\tgap: 0.5rem;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.drag-handle {\\r\\n\\t\\tcursor: grab;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t}\\r\\n\\t\\r\\n\\t.drag-handle:active {\\r\\n\\t\\tcursor: grabbing;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.resize-controls {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tgap: 0.25rem;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.control-btn {\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\talign-items: center;\\r\\n\\t\\tjustify-content: center;\\r\\n\\t\\twidth: 28px;\\r\\n\\t\\theight: 28px;\\r\\n\\t\\tpadding: 0;\\r\\n\\t\\tbackground-color: transparent;\\r\\n\\t\\tborder: 1px solid var(--border);\\r\\n\\t\\tborder-radius: 4px;\\r\\n\\t\\tcursor: pointer;\\r\\n\\t\\tcolor: var(--text-primary);\\r\\n\\t\\ttransition: background-color 0.2s, border-color 0.2s;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.control-btn:hover:not(:disabled) {\\r\\n\\t\\tbackground-color: var(--surface-hover);\\r\\n\\t\\tborder-color: var(--primary);\\r\\n\\t}\\r\\n\\t\\r\\n\\t.control-btn:active:not(:disabled) {\\r\\n\\t\\tbackground-color: var(--surface-variant);\\r\\n\\t}\\r\\n\\t\\r\\n\\t.control-btn:disabled {\\r\\n\\t\\topacity: 0.4;\\r\\n\\t\\tcursor: not-allowed;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.span-indicator {\\r\\n\\t\\tfont-size: 0.75rem;\\r\\n\\t\\tfont-weight: 600;\\r\\n\\t\\tcolor: var(--text-secondary);\\r\\n\\t\\tpadding: 0 0.25rem;\\r\\n\\t\\tmin-width: 35px;\\r\\n\\t\\ttext-align: center;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.section-content {\\r\\n\\t\\tpadding: 1rem;\\r\\n\\t\\tdisplay: flex;\\r\\n\\t\\tflex-direction: column;\\r\\n\\t\\tgap: 1rem;\\r\\n\\t\\tcursor: default;\\r\\n\\t}\\r\\n\\t\\r\\n\\t.widget-container {\\r\\n\\t\\twidth: 100%;\\r\\n\\t}\\r\\n\\t\\r\\n\\t/* Tablet responsive - 2 columns */\\r\\n\\t@media (max-width: 1024px) {\\r\\n\\t\\t.dashboard-layout {\\r\\n\\t\\t\\tgrid-template-columns: repeat(2, 1fr);\\r\\n\\t\\t\\tgrid-auto-flow: row; /* Ensure sections flow in rows */\\r\\n\\t\\t}\\r\\n\\t\\t\\r\\n\\t\\t.section {\\r\\n\\t\\t\\tgrid-column: auto / span 1 !important;\\r\\n\\t\\t\\tgrid-row: auto !important; /* Let grid auto-place sections to prevent overlap */\\r\\n\\t\\t}\\r\\n\\t}\\r\\n\\t\\r\\n\\t/* Mobile responsive - 1 column */\\r\\n\\t@media (max-width: 768px) {\\r\\n\\t\\t.dashboard-layout {\\r\\n\\t\\t\\tgrid-template-columns: 1fr;\\r\\n\\t\\t\\tpadding: 0.5rem;\\r\\n\\t\\t\\tgap: 0.75rem;\\r\\n\\t\\t\\tgrid-auto-flow: row; /* Ensure sections flow in rows */\\r\\n\\t\\t}\\r\\n\\t\\t\\r\\n\\t\\t.section {\\r\\n\\t\\t\\tgrid-column: 1 / span 1 !important;\\r\\n\\t\\t\\tgrid-row: auto !important; /* Let grid auto-place sections to prevent overlap */\\r\\n\\t\\t}\\r\\n\\t\\t\\r\\n\\t\\t.section-content {\\r\\n\\t\\t\\tpadding: 0.75rem;\\r\\n\\t\\t}\\r\\n\\t\\t\\r\\n\\t\\t.drop-zone {\\r\\n\\t\\t\\tdisplay: none;\\r\\n\\t\\t}\\r\\n\\t}\\r\\n</style>"],"names":[],"mappings":"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"}`
    };
    ColumnLayout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let widgetsBySection;
      let sortedSections;
      let $sections, $$unsubscribe_sections;
      let $widgets, $$unsubscribe_widgets;
      $$unsubscribe_sections = subscribe(sections, (value) => $sections = value);
      $$unsubscribe_widgets = subscribe(widgets, (value) => $widgets = value);
      let { widgetComponents } = $$props;
      let { data } = $$props;
      let containerRef;
      let draggedSectionId = null;
      if ($$props.widgetComponents === void 0 && $$bindings.widgetComponents && widgetComponents !== void 0) $$bindings.widgetComponents(widgetComponents);
      if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
      $$result.css.add(css$12);
      widgetsBySection = $widgets.reduce(
        (acc, widget) => {
          if (!acc[widget.section]) {
            acc[widget.section] = [];
          }
          acc[widget.section].push(widget);
          return acc;
        },
        {}
      );
      {
        {
          Object.keys(widgetsBySection).forEach((sectionId) => {
            const widgets2 = widgetsBySection[parseInt(sectionId)];
            if (widgets2 && Array.isArray(widgets2)) {
              widgets2.sort((a3, b2) => a3.order - b2.order);
            }
          });
        }
      }
      sortedSections = [...$sections].map((s5) => ({
        ...s5,
        gridColumnSpan: s5.gridColumnSpan ?? 1
      })).sort((a3, b2) => {
        if (a3.gridRow !== b2.gridRow) return a3.gridRow - b2.gridRow;
        return a3.gridColumn - b2.gridColumn;
      });
      $$unsubscribe_sections();
      $$unsubscribe_widgets();
      return `<div class="dashboard-layout svelte-12g5v36"${add_attribute("this", containerRef, 0)}> ${each([1, 2, 3], (columnNum) => {
        return `<div class="${["drop-zone svelte-12g5v36", ""].join(" ").trim()}" style="${"grid-column: " + escape(columnNum, true) + "; grid-row: 1 / -1;"}" role="region" aria-label="${"Drop zone for column " + escape(columnNum, true)}">${``} </div>`;
      })} ${each(sortedSections, (section) => {
        return `<div class="${["section svelte-12g5v36", draggedSectionId === section.id ? "dragging" : ""].join(" ").trim()}" style="${"grid-column: " + escape(section.gridColumn, true) + " / span " + escape(section.gridColumnSpan, true) + "; grid-row: " + escape(section.gridRow, true) + ";"}" draggable="true" role="region" aria-label="${"Section " + escape(section.id, true)}"> <div class="section-controls svelte-12g5v36"><button class="control-btn drag-handle svelte-12g5v36" title="Drag to move section" aria-label="Drag to move section" data-svelte-h="svelte-18ruqvt"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path></svg></button> <div class="resize-controls svelte-12g5v36"><button class="control-btn svelte-12g5v36" ${section.gridColumnSpan <= 1 ? "disabled" : ""} title="Decrease width" aria-label="Decrease section width"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"></path></svg></button> <span class="span-indicator svelte-12g5v36">${escape(section.gridColumnSpan)}col</span> <button class="control-btn svelte-12g5v36" ${section.gridColumn + section.gridColumnSpan > 3 ? "disabled" : ""} title="Increase width" aria-label="Increase section width"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"></path></svg></button> </div></div> <div class="section-content svelte-12g5v36">${widgetsBySection[section.id] ? `${each(widgetsBySection[section.id], (widget) => {
          return `<div class="widget-container svelte-12g5v36">${validate_component(Widget, "Widget").$$render($$result, { widget }, {}, {
            default: /* @__PURE__ */ __name(() => {
              return `${widget.type === "weather" ? `${validate_component(widgetComponents.WeatherWidget || missing_component, "svelte:component").$$render($$result, {}, {}, {})}` : `${widget.type === "traffic" ? `${validate_component(widgetComponents.TrafficWidget || missing_component, "svelte:component").$$render($$result, {}, {}, {})}` : `${widget.type === "calendar" ? `${validate_component(widgetComponents.CalendarWidget || missing_component, "svelte:component").$$render($$result, {}, {}, {})}` : `${widget.type === "github" ? `${validate_component(widgetComponents.GithubWidget || missing_component, "svelte:component").$$render($$result, { projects: data.githubProjects || [] }, {}, {})}` : `${widget.type === "organization-projects" ? `${validate_component(widgetComponents.OrganizationProjectsWidget || missing_component, "svelte:component").$$render(
                $$result,
                {
                  organizationProjects: data.organizationProjects || []
                },
                {},
                {}
              )}` : `${widget.type === "github-projects" ? `${validate_component(widgetComponents.GithubProjectsWidget || missing_component, "svelte:component").$$render(
                $$result,
                {
                  projects: data.allGithubProjects || [],
                  isLoggedIn: !!data.user
                },
                {},
                {}
              )}` : ``}`}`}`}`}`} `;
            }, "default")
          })} </div>`;
        })}` : ``}</div> </div>`;
      })} </div>`;
    });
    css2 = {
      code: ".dashboard.svelte-14zdhua{width:100%;min-height:calc(100vh - 100px);position:relative;overflow-y:auto;overflow-x:hidden}",
      map: '{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import WeatherWidget from \\"$lib/components/WeatherWidget.svelte\\";\\nimport TrafficWidget from \\"$lib/components/TrafficWidget.svelte\\";\\nimport CalendarWidget from \\"$lib/components/CalendarWidget.svelte\\";\\nimport GithubWidget from \\"$lib/components/GithubWidget.svelte\\";\\nimport OrganizationProjectsWidget from \\"$lib/components/OrganizationProjectsWidget.svelte\\";\\nimport GithubProjectsWidget from \\"$lib/components/GithubProjectsWidget.svelte\\";\\nimport ColumnLayout from \\"$lib/components/ColumnLayout.svelte\\";\\nimport { widgets, sections } from \\"$lib/stores/widgets\\";\\nimport { onMount } from \\"svelte\\";\\nexport let data;\\nconst widgetComponents = {\\n  WeatherWidget,\\n  TrafficWidget,\\n  CalendarWidget,\\n  GithubWidget,\\n  OrganizationProjectsWidget,\\n  GithubProjectsWidget\\n};\\nonMount(() => {\\n  widgets.load();\\n  sections.load();\\n  console.log(\\"GitHub Projects Data:\\", {\\n    allGithubProjects: data.allGithubProjects,\\n    count: data.allGithubProjects?.length\\n  });\\n});\\n<\/script>\\r\\n\\r\\n<svelte:head>\\r\\n\\t<title>Dashboard</title>\\r\\n\\t<meta name=\\"description\\" content=\\"Personal dashboard with widgets\\" />\\r\\n</svelte:head>\\r\\n\\r\\n<div class=\\"dashboard\\">\\r\\n\\t<ColumnLayout {widgetComponents} {data} />\\r\\n</div>\\r\\n\\r\\n<style>\\r\\n\\t.dashboard {\\r\\n\\t\\twidth: 100%;\\r\\n\\t\\tmin-height: calc(100vh - 100px);\\r\\n\\t\\tposition: relative;\\r\\n\\t\\toverflow-y: auto;\\r\\n\\t\\toverflow-x: hidden;\\r\\n\\t}\\r\\n</style>\\r\\n"],"names":[],"mappings":"AAsCC,yBAAW,CACV,KAAK,CAAE,IAAI,CACX,UAAU,CAAE,KAAK,KAAK,CAAC,CAAC,CAAC,KAAK,CAAC,CAC/B,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,MACb"}'
    };
    Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { data } = $$props;
      const widgetComponents = {
        WeatherWidget,
        TrafficWidget,
        CalendarWidget,
        GithubWidget,
        OrganizationProjectsWidget,
        GithubProjectsWidget
      };
      if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
      $$result.css.add(css2);
      return `${$$result.head += `<!-- HEAD_svelte-5cyd0_START -->${$$result.title = `<title>Dashboard</title>`, ""}<meta name="description" content="Personal dashboard with widgets"><!-- HEAD_svelte-5cyd0_END -->`, ""} <div class="dashboard svelte-14zdhua">${validate_component(ColumnLayout, "ColumnLayout").$$render($$result, { widgetComponents, data }, {}, {})} </div>`;
    });
  }
});
var __exports3 = {};
__export(__exports3, {
  component: /* @__PURE__ */ __name(() => component3, "component"),
  fonts: /* @__PURE__ */ __name(() => fonts3, "fonts"),
  imports: /* @__PURE__ */ __name(() => imports3, "imports"),
  index: /* @__PURE__ */ __name(() => index3, "index"),
  server: /* @__PURE__ */ __name(() => page_server_ts_exports, "server"),
  server_id: /* @__PURE__ */ __name(() => server_id2, "server_id"),
  stylesheets: /* @__PURE__ */ __name(() => stylesheets3, "stylesheets")
});
var index3;
var component_cache3;
var component3;
var server_id2;
var imports3;
var stylesheets3;
var fonts3;
var init__3 = __esm({
  ".svelte-kit/output/server/nodes/2.js"() {
    init_page_server_ts();
    index3 = 2;
    component3 = /* @__PURE__ */ __name(async () => component_cache3 ??= (await Promise.resolve().then(() => (init_page_svelte(), page_svelte_exports))).default, "component3");
    server_id2 = "src/routes/+page.server.ts";
    imports3 = ["_app/immutable/nodes/2.B4kgU9z-.js", "_app/immutable/chunks/qwSh76ll.js", "_app/immutable/chunks/IHki7fMi.js", "_app/immutable/chunks/Cy1WYuK-.js", "_app/immutable/chunks/DLCh3GBu.js", "_app/immutable/chunks/Q07G5V9A.js"];
    stylesheets3 = ["_app/immutable/assets/2.BGc-Ouwx.css"];
    fonts3 = [];
  }
});
var server_ts_exports = {};
__export(server_ts_exports, {
  GET: /* @__PURE__ */ __name(() => GET, "GET")
});
var GOOGLE_MAPS_API_KEY;
var GET;
var init_server_ts = __esm({
  ".svelte-kit/output/server/entries/endpoints/api/maps-config/_server.ts.js"() {
    init_exports();
    init_shared_server();
    ({ GOOGLE_MAPS_API_KEY = "" } = private_env);
    GET = /* @__PURE__ */ __name(async () => {
      if (!GOOGLE_MAPS_API_KEY.trim()) {
        return json({ error: "Google Maps API key not configured" }, { status: 500 });
      }
      return json({ apiKey: GOOGLE_MAPS_API_KEY.trim() });
    }, "GET");
  }
});
var server_ts_exports2 = {};
__export(server_ts_exports2, {
  GET: /* @__PURE__ */ __name(() => GET2, "GET")
});
async function handleWebSocketSession(webSocket, platform) {
  webSocket.accept();
  let sessionConfig = null;
  let conversationHistory = [];
  let audioBuffer = [];
  let processingAudio = false;
  webSocket.addEventListener("message", async (event) => {
    try {
      const message2 = JSON.parse(event.data);
      if (message2.type === "session.update") {
        sessionConfig = message2.session;
        conversationHistory.push({
          role: "system",
          content: message2.session.instructions || "You are a helpful AI assistant in a voice conversation. Be concise and conversational."
        });
        webSocket.send(JSON.stringify({
          type: "session.created",
          session: sessionConfig
        }));
      }
      if (message2.type === "input_audio_buffer.append") {
        audioBuffer.push(message2.audio);
        webSocket.send(JSON.stringify({
          type: "input_audio_buffer.appended"
        }));
      }
      if (message2.type === "input_audio_buffer.commit") {
        webSocket.send(JSON.stringify({
          type: "input_audio_buffer.committed"
        }));
        if (audioBuffer.length > 0 && !processingAudio) {
          processingAudio = true;
          console.log("Processing audio buffer with", audioBuffer.length, "chunks");
          const combinedAudio = audioBuffer.join("");
          audioBuffer = [];
          console.log("Transcribing audio...");
          const transcription = await transcribeAudio(combinedAudio);
          if (transcription) {
            console.log("Transcription:", transcription);
            conversationHistory.push({
              role: "user",
              content: transcription
            });
            webSocket.send(JSON.stringify({
              type: "conversation.item.created",
              item: {
                type: "message",
                role: "user",
                content: [{ type: "text", text: transcription }]
              }
            }));
            console.log("Generating AI response...");
            const aiResponse = await generateAIResponse(conversationHistory);
            if (aiResponse) {
              console.log("AI Response:", aiResponse);
              conversationHistory.push({
                role: "assistant",
                content: aiResponse
              });
              webSocket.send(JSON.stringify({
                type: "response.text.delta",
                delta: aiResponse
              }));
              const audioResponse = await textToSpeech(aiResponse);
              if (audioResponse) {
                webSocket.send(JSON.stringify({
                  type: "response.audio.delta",
                  delta: audioResponse
                }));
              }
              webSocket.send(JSON.stringify({
                type: "response.audio.done"
              }));
            }
          } else {
            console.log("No transcription received");
            webSocket.send(JSON.stringify({
              type: "response.audio.done"
            }));
          }
          processingAudio = false;
        }
      }
      if (message2.type === "conversation.item.create") {
        webSocket.send(JSON.stringify({
          type: "conversation.item.created",
          item: message2.item
        }));
      }
      if (message2.type === "response.create") {
        webSocket.send(JSON.stringify({
          type: "response.created"
        }));
      }
    } catch (error2) {
      console.error("WebSocket message error:", error2);
      webSocket.send(JSON.stringify({
        type: "error",
        error: {
          message: error2 instanceof Error ? error2.message : "Unknown error",
          code: "internal_error"
        }
      }));
    }
  });
  webSocket.addEventListener("close", () => {
    conversationHistory = [];
    audioBuffer = [];
  });
  webSocket.addEventListener("error", (event) => {
    console.error("WebSocket error:", event);
  });
}
__name(handleWebSocketSession, "handleWebSocketSession");
async function transcribeAudio(base64Audio) {
  try {
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i4 = 0; i4 < binaryString.length; i4++) {
      bytes[i4] = binaryString.charCodeAt(i4);
    }
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/openai/whisper`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`
        },
        body: bytes.buffer
      }
    );
    const result = await response.json();
    return result.result?.text || null;
  } catch (error2) {
    console.error("Error transcribing audio:", error2);
    return null;
  }
}
__name(transcribeAudio, "transcribeAudio");
async function generateAIResponse(messages) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages,
          max_tokens: 150
        })
      }
    );
    const result = await response.json();
    return result.result?.response || null;
  } catch (error2) {
    console.error("Error generating AI response:", error2);
    return null;
  }
}
__name(generateAIResponse, "generateAIResponse");
async function textToSpeech(text2) {
  try {
    console.log("AI Response (text):", text2);
    return null;
  } catch (error2) {
    console.error("Error converting text to speech:", error2);
    return null;
  }
}
__name(textToSpeech, "textToSpeech");
var CLOUDFLARE_ACCOUNT_ID;
var CLOUDFLARE_API_TOKEN;
var GET2;
var init_server_ts2 = __esm({
  ".svelte-kit/output/server/entries/endpoints/api/realtime/_server.ts.js"() {
    init_shared_server();
    ({ CLOUDFLARE_ACCOUNT_ID = "", CLOUDFLARE_API_TOKEN = "" } = private_env);
    GET2 = /* @__PURE__ */ __name(async ({ request, platform }) => {
      console.log("Realtime API called");
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        console.log("Not a WebSocket request");
        return new Response("Expected WebSocket", { status: 426 });
      }
      if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
        console.error("Cloudflare credentials not configured");
        console.log("CLOUDFLARE_ACCOUNT_ID:", !!CLOUDFLARE_ACCOUNT_ID);
        console.log("CLOUDFLARE_API_TOKEN:", !!CLOUDFLARE_API_TOKEN);
        return new Response("Cloudflare credentials not configured", { status: 500 });
      }
      console.log("Credentials OK, checking runtime...");
      if (typeof WebSocketPair !== "undefined") {
        console.log("Using Cloudflare Workers WebSocket");
        const pair = new WebSocketPair();
        const [client, server2] = Object.values(pair);
        handleWebSocketSession(server2);
        return new Response(null, {
          status: 101,
          webSocket: client
        });
      } else {
        console.error("WebSocket not supported in dev mode");
        return new Response(
          JSON.stringify({
            error: "WebSocket not supported in development mode. Deploy to Cloudflare Pages to test."
          }),
          {
            status: 501,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }, "GET2");
  }
});
var server_ts_exports3 = {};
__export(server_ts_exports3, {
  GET: /* @__PURE__ */ __name(() => GET3, "GET")
});
async function fallbackToCurrentWeather(lat, lon) {
  try {
    console.log("Using Current Weather API 2.5 fallback...");
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${OPENWEATHER_API_KEY.trim()}`;
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Current Weather API error:", errorData);
      throw new Error("Current Weather API also failed");
    }
    const data = await response.json();
    console.log("Current Weather API 2.5 response received successfully");
    const weatherData = {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      condition: data.weather[0].main.toLowerCase(),
      description: data.weather[0].description,
      location: `${data.name}, ${data.sys.country}`,
      icon: data.weather[0].icon,
      hourly: [],
      // Fallback API doesn't have hourly data
      timestamp: Date.now()
    };
    console.log("Returning fallback weather data:", weatherData);
    return json(weatherData);
  } catch (error2) {
    console.error("Fallback API error:", error2);
    return json(
      { error: "All weather APIs failed" },
      { status: 500 }
    );
  }
}
__name(fallbackToCurrentWeather, "fallbackToCurrentWeather");
async function getCoordinatesFromZip(zip) {
  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${OPENWEATHER_API_KEY.trim()}`;
    console.log("Geocoding zip code...");
    const response = await fetch(geoUrl);
    if (response.ok) {
      const data = await response.json();
      console.log("Geocoding successful:", data);
      return {
        lat: data.lat.toString(),
        lon: data.lon.toString()
      };
    } else {
      console.error("Geocoding failed:", await response.text());
    }
  } catch (error2) {
    console.error("Error geocoding zip code:", error2);
  }
  return null;
}
__name(getCoordinatesFromZip, "getCoordinatesFromZip");
async function getLocationName(lat, lon) {
  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY.trim()}`;
    const response = await fetch(geoUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        const place = data[0];
        return `${place.name}, ${place.state || place.country}`;
      }
    }
  } catch (error2) {
    console.error("Error getting location name:", error2);
  }
  return "Unknown Location";
}
__name(getLocationName, "getLocationName");
var OPENWEATHER_API_KEY;
var GET3;
var init_server_ts3 = __esm({
  ".svelte-kit/output/server/entries/endpoints/api/weather/_server.ts.js"() {
    init_exports();
    init_shared_server();
    ({ OPENWEATHER_API_KEY = "" } = private_env);
    GET3 = /* @__PURE__ */ __name(async ({ url }) => {
      const lat = url.searchParams.get("lat");
      const lon = url.searchParams.get("lon");
      const zip = url.searchParams.get("zip");
      console.log("Weather API called with:", { lat, lon, zip });
      console.log("API Key configured:", !!OPENWEATHER_API_KEY.trim());
      if (!OPENWEATHER_API_KEY.trim()) {
        console.error("OPENWEATHER_API_KEY is not set!");
        return json(
          { error: "OpenWeather API key not configured" },
          { status: 500 }
        );
      }
      try {
        let latitude;
        let longitude;
        if (zip) {
          console.log("Converting zip code to coordinates:", zip);
          const coords = await getCoordinatesFromZip(zip);
          if (!coords) {
            return json(
              { error: "Invalid zip code or unable to geocode" },
              { status: 400 }
            );
          }
          latitude = coords.lat;
          longitude = coords.lon;
        } else if (lat && lon) {
          latitude = lat;
          longitude = lon;
        } else {
          latitude = "44.1004";
          longitude = "-70.2148";
        }
        console.log("Using coordinates:", { latitude, longitude });
        const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&units=imperial&exclude=minutely,alerts&appid=${OPENWEATHER_API_KEY.trim()}`;
        console.log("Fetching from One Call API 3.0...");
        const response = await fetch(weatherUrl);
        if (!response.ok) {
          const errorData = await response.json();
          console.error("OpenWeather API error:", errorData);
          console.log("Falling back to Current Weather API...");
          return await fallbackToCurrentWeather(latitude, longitude);
        }
        const data = await response.json();
        console.log("One Call API 3.0 response received successfully");
        const hourlyForecast = data.hourly.slice(0, 24).map((hour2) => ({
          time: hour2.dt,
          temperature: Math.round(hour2.temp),
          feelsLike: Math.round(hour2.feels_like),
          humidity: hour2.humidity,
          condition: hour2.weather[0].main.toLowerCase(),
          icon: hour2.weather[0].icon
        }));
        const weatherData = {
          temperature: Math.round(data.current.temp),
          humidity: data.current.humidity,
          condition: data.current.weather[0].main.toLowerCase(),
          description: data.current.weather[0].description,
          location: await getLocationName(latitude, longitude),
          icon: data.current.weather[0].icon,
          hourly: hourlyForecast,
          sunrise: data.current.sunrise,
          sunset: data.current.sunset,
          moonrise: data.daily?.[0]?.moonrise || 0,
          moonset: data.daily?.[0]?.moonset || 0,
          timezone: data.timezone,
          timezoneOffset: data.timezone_offset,
          timestamp: Date.now()
        };
        console.log("Returning weather data:", weatherData);
        return json(weatherData);
      } catch (error2) {
        console.error("Error fetching weather:", error2);
        return json(
          { error: "Failed to fetch weather data" },
          { status: 500 }
        );
      }
    }, "GET3");
  }
});
init_false();
init_exports();
init_internal();
init_server();
init_environment();
var escaped = {
  "<": "\\u003C",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var DevalueError = class extends Error {
  static {
    __name(this, "DevalueError");
  }
  /**
   * @param {string} message
   * @param {string[]} keys
   */
  constructor(message2, keys) {
    super(message2);
    this.name = "DevalueError";
    this.path = keys.join("");
  }
};
function is_primitive(thing) {
  return Object(thing) !== thing;
}
__name(is_primitive, "is_primitive");
var object_proto_names = /* @__PURE__ */ Object.getOwnPropertyNames(
  Object.prototype
).sort().join("\0");
function is_plain_object(thing) {
  const proto = Object.getPrototypeOf(thing);
  return proto === Object.prototype || proto === null || Object.getPrototypeOf(proto) === null || Object.getOwnPropertyNames(proto).sort().join("\0") === object_proto_names;
}
__name(is_plain_object, "is_plain_object");
function get_type(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
__name(get_type, "get_type");
function get_escaped_char(char) {
  switch (char) {
    case '"':
      return '\\"';
    case "<":
      return "\\u003C";
    case "\\":
      return "\\\\";
    case "\n":
      return "\\n";
    case "\r":
      return "\\r";
    case "	":
      return "\\t";
    case "\b":
      return "\\b";
    case "\f":
      return "\\f";
    case "\u2028":
      return "\\u2028";
    case "\u2029":
      return "\\u2029";
    default:
      return char < " " ? `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}` : "";
  }
}
__name(get_escaped_char, "get_escaped_char");
function stringify_string(str) {
  let result = "";
  let last_pos = 0;
  const len = str.length;
  for (let i4 = 0; i4 < len; i4 += 1) {
    const char = str[i4];
    const replacement = get_escaped_char(char);
    if (replacement) {
      result += str.slice(last_pos, i4) + replacement;
      last_pos = i4 + 1;
    }
  }
  return `"${last_pos === 0 ? str : result + str.slice(last_pos)}"`;
}
__name(stringify_string, "stringify_string");
function enumerable_symbols(object) {
  return Object.getOwnPropertySymbols(object).filter(
    (symbol) => Object.getOwnPropertyDescriptor(object, symbol).enumerable
  );
}
__name(enumerable_symbols, "enumerable_symbols");
var is_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
function stringify_key(key2) {
  return is_identifier.test(key2) ? "." + key2 : "[" + JSON.stringify(key2) + "]";
}
__name(stringify_key, "stringify_key");
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafe_chars = /[<\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
function uneval(value, replacer) {
  const counts = /* @__PURE__ */ new Map();
  const keys = [];
  const custom = /* @__PURE__ */ new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new DevalueError(`Cannot stringify a function`, keys);
    }
    if (!is_primitive(thing)) {
      if (counts.has(thing)) {
        counts.set(thing, counts.get(thing) + 1);
        return;
      }
      counts.set(thing, 1);
      if (replacer) {
        const str2 = replacer(thing, (value2) => uneval(value2, replacer));
        if (typeof str2 === "string") {
          custom.set(thing, str2);
          return;
        }
      }
      const type = get_type(thing);
      switch (type) {
        case "Number":
        case "BigInt":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
        case "URL":
        case "URLSearchParams":
          return;
        case "Array":
          thing.forEach((value2, i4) => {
            keys.push(`[${i4}]`);
            walk(value2);
            keys.pop();
          });
          break;
        case "Set":
          Array.from(thing).forEach(walk);
          break;
        case "Map":
          for (const [key2, value2] of thing) {
            keys.push(
              `.get(${is_primitive(key2) ? stringify_primitive(key2) : "..."})`
            );
            walk(value2);
            keys.pop();
          }
          break;
        case "Int8Array":
        case "Uint8Array":
        case "Uint8ClampedArray":
        case "Int16Array":
        case "Uint16Array":
        case "Int32Array":
        case "Uint32Array":
        case "Float32Array":
        case "Float64Array":
        case "BigInt64Array":
        case "BigUint64Array":
          walk(thing.buffer);
          return;
        case "ArrayBuffer":
          return;
        case "Temporal.Duration":
        case "Temporal.Instant":
        case "Temporal.PlainDate":
        case "Temporal.PlainTime":
        case "Temporal.PlainDateTime":
        case "Temporal.PlainMonthDay":
        case "Temporal.PlainYearMonth":
        case "Temporal.ZonedDateTime":
          return;
        default:
          if (!is_plain_object(thing)) {
            throw new DevalueError(
              `Cannot stringify arbitrary non-POJOs`,
              keys
            );
          }
          if (enumerable_symbols(thing).length > 0) {
            throw new DevalueError(
              `Cannot stringify POJOs with symbolic keys`,
              keys
            );
          }
          for (const key2 in thing) {
            keys.push(stringify_key(key2));
            walk(thing[key2]);
            keys.pop();
          }
      }
    }
  }
  __name(walk, "walk");
  walk(value);
  const names = /* @__PURE__ */ new Map();
  Array.from(counts).filter((entry) => entry[1] > 1).sort((a3, b2) => b2[1] - a3[1]).forEach((entry, i4) => {
    names.set(entry[0], get_name(i4));
  });
  function stringify3(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (is_primitive(thing)) {
      return stringify_primitive(thing);
    }
    if (custom.has(thing)) {
      return custom.get(thing);
    }
    const type = get_type(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return `Object(${stringify3(thing.valueOf())})`;
      case "RegExp":
        return `new RegExp(${stringify_string(thing.source)}, "${thing.flags}")`;
      case "Date":
        return `new Date(${thing.getTime()})`;
      case "URL":
        return `new URL(${stringify_string(thing.toString())})`;
      case "URLSearchParams":
        return `new URLSearchParams(${stringify_string(thing.toString())})`;
      case "Array":
        const members = (
          /** @type {any[]} */
          thing.map(
            (v2, i4) => i4 in thing ? stringify3(v2) : ""
          )
        );
        const tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return `[${members.join(",")}${tail}]`;
      case "Set":
      case "Map":
        return `new ${type}([${Array.from(thing).map(stringify3).join(",")}])`;
      case "Int8Array":
      case "Uint8Array":
      case "Uint8ClampedArray":
      case "Int16Array":
      case "Uint16Array":
      case "Int32Array":
      case "Uint32Array":
      case "Float32Array":
      case "Float64Array":
      case "BigInt64Array":
      case "BigUint64Array": {
        let str2 = `new ${type}`;
        if (counts.get(thing.buffer) === 1) {
          const array2 = new thing.constructor(thing.buffer);
          str2 += `([${array2}])`;
        } else {
          str2 += `([${stringify3(thing.buffer)}])`;
        }
        const a3 = thing.byteOffset;
        const b2 = a3 + thing.byteLength;
        if (a3 > 0 || b2 !== thing.buffer.byteLength) {
          const m = +/(\d+)/.exec(type)[1] / 8;
          str2 += `.subarray(${a3 / m},${b2 / m})`;
        }
        return str2;
      }
      case "ArrayBuffer": {
        const ui8 = new Uint8Array(thing);
        return `new Uint8Array([${ui8.toString()}]).buffer`;
      }
      case "Temporal.Duration":
      case "Temporal.Instant":
      case "Temporal.PlainDate":
      case "Temporal.PlainTime":
      case "Temporal.PlainDateTime":
      case "Temporal.PlainMonthDay":
      case "Temporal.PlainYearMonth":
      case "Temporal.ZonedDateTime":
        return `${type}.from(${stringify_string(thing.toString())})`;
      default:
        const keys2 = Object.keys(thing);
        const obj = keys2.map((key2) => `${safe_key(key2)}:${stringify3(thing[key2])}`).join(",");
        const proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return keys2.length > 0 ? `{${obj},__proto__:null}` : `{__proto__:null}`;
        }
        return `{${obj}}`;
    }
  }
  __name(stringify3, "stringify3");
  const str = stringify3(value);
  if (names.size) {
    const params = [];
    const statements = [];
    const values = [];
    names.forEach((name, thing) => {
      params.push(name);
      if (custom.has(thing)) {
        values.push(
          /** @type {string} */
          custom.get(thing)
        );
        return;
      }
      if (is_primitive(thing)) {
        values.push(stringify_primitive(thing));
        return;
      }
      const type = get_type(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values.push(`Object(${stringify3(thing.valueOf())})`);
          break;
        case "RegExp":
          values.push(thing.toString());
          break;
        case "Date":
          values.push(`new Date(${thing.getTime()})`);
          break;
        case "Array":
          values.push(`Array(${thing.length})`);
          thing.forEach((v2, i4) => {
            statements.push(`${name}[${i4}]=${stringify3(v2)}`);
          });
          break;
        case "Set":
          values.push(`new Set`);
          statements.push(
            `${name}.${Array.from(thing).map((v2) => `add(${stringify3(v2)})`).join(".")}`
          );
          break;
        case "Map":
          values.push(`new Map`);
          statements.push(
            `${name}.${Array.from(thing).map(([k3, v2]) => `set(${stringify3(k3)}, ${stringify3(v2)})`).join(".")}`
          );
          break;
        case "ArrayBuffer":
          values.push(
            `new Uint8Array([${new Uint8Array(thing).join(",")}]).buffer`
          );
          break;
        default:
          values.push(
            Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}"
          );
          Object.keys(thing).forEach((key2) => {
            statements.push(
              `${name}${safe_prop(key2)}=${stringify3(thing[key2])}`
            );
          });
      }
    });
    statements.push(`return ${str}`);
    return `(function(${params.join(",")}){${statements.join(
      ";"
    )}}(${values.join(",")}))`;
  } else {
    return str;
  }
}
__name(uneval, "uneval");
function get_name(num) {
  let name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? `${name}0` : name;
}
__name(get_name, "get_name");
function escape_unsafe_char(c4) {
  return escaped[c4] || c4;
}
__name(escape_unsafe_char, "escape_unsafe_char");
function escape_unsafe_chars(str) {
  return str.replace(unsafe_chars, escape_unsafe_char);
}
__name(escape_unsafe_chars, "escape_unsafe_chars");
function safe_key(key2) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key2) ? key2 : escape_unsafe_chars(JSON.stringify(key2));
}
__name(safe_key, "safe_key");
function safe_prop(key2) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key2) ? `.${key2}` : `[${escape_unsafe_chars(JSON.stringify(key2))}]`;
}
__name(safe_prop, "safe_prop");
function stringify_primitive(thing) {
  if (typeof thing === "string") return stringify_string(thing);
  if (thing === void 0) return "void 0";
  if (thing === 0 && 1 / thing < 0) return "-0";
  const str = String(thing);
  if (typeof thing === "number") return str.replace(/^(-)?0\./, "$1.");
  if (typeof thing === "bigint") return thing + "n";
  return str;
}
__name(stringify_primitive, "stringify_primitive");
function encode64(arraybuffer) {
  const dv = new DataView(arraybuffer);
  let binaryString = "";
  for (let i4 = 0; i4 < arraybuffer.byteLength; i4++) {
    binaryString += String.fromCharCode(dv.getUint8(i4));
  }
  return binaryToAscii(binaryString);
}
__name(encode64, "encode64");
function decode64(string) {
  const binaryString = asciiToBinary(string);
  const arraybuffer = new ArrayBuffer(binaryString.length);
  const dv = new DataView(arraybuffer);
  for (let i4 = 0; i4 < arraybuffer.byteLength; i4++) {
    dv.setUint8(i4, binaryString.charCodeAt(i4));
  }
  return arraybuffer;
}
__name(decode64, "decode64");
var KEY_STRING = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function asciiToBinary(data) {
  if (data.length % 4 === 0) {
    data = data.replace(/==?$/, "");
  }
  let output = "";
  let buffer = 0;
  let accumulatedBits = 0;
  for (let i4 = 0; i4 < data.length; i4++) {
    buffer <<= 6;
    buffer |= KEY_STRING.indexOf(data[i4]);
    accumulatedBits += 6;
    if (accumulatedBits === 24) {
      output += String.fromCharCode((buffer & 16711680) >> 16);
      output += String.fromCharCode((buffer & 65280) >> 8);
      output += String.fromCharCode(buffer & 255);
      buffer = accumulatedBits = 0;
    }
  }
  if (accumulatedBits === 12) {
    buffer >>= 4;
    output += String.fromCharCode(buffer);
  } else if (accumulatedBits === 18) {
    buffer >>= 2;
    output += String.fromCharCode((buffer & 65280) >> 8);
    output += String.fromCharCode(buffer & 255);
  }
  return output;
}
__name(asciiToBinary, "asciiToBinary");
function binaryToAscii(str) {
  let out = "";
  for (let i4 = 0; i4 < str.length; i4 += 3) {
    const groupsOfSix = [void 0, void 0, void 0, void 0];
    groupsOfSix[0] = str.charCodeAt(i4) >> 2;
    groupsOfSix[1] = (str.charCodeAt(i4) & 3) << 4;
    if (str.length > i4 + 1) {
      groupsOfSix[1] |= str.charCodeAt(i4 + 1) >> 4;
      groupsOfSix[2] = (str.charCodeAt(i4 + 1) & 15) << 2;
    }
    if (str.length > i4 + 2) {
      groupsOfSix[2] |= str.charCodeAt(i4 + 2) >> 6;
      groupsOfSix[3] = str.charCodeAt(i4 + 2) & 63;
    }
    for (let j3 = 0; j3 < groupsOfSix.length; j3++) {
      if (typeof groupsOfSix[j3] === "undefined") {
        out += "=";
      } else {
        out += KEY_STRING[groupsOfSix[j3]];
      }
    }
  }
  return out;
}
__name(binaryToAscii, "binaryToAscii");
var UNDEFINED = -1;
var HOLE = -2;
var NAN = -3;
var POSITIVE_INFINITY = -4;
var NEGATIVE_INFINITY = -5;
var NEGATIVE_ZERO = -6;
function parse(serialized, revivers) {
  return unflatten(JSON.parse(serialized), revivers);
}
__name(parse, "parse");
function unflatten(parsed, revivers) {
  if (typeof parsed === "number") return hydrate(parsed, true);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Invalid input");
  }
  const values = (
    /** @type {any[]} */
    parsed
  );
  const hydrated = Array(values.length);
  function hydrate(index4, standalone = false) {
    if (index4 === UNDEFINED) return void 0;
    if (index4 === NAN) return NaN;
    if (index4 === POSITIVE_INFINITY) return Infinity;
    if (index4 === NEGATIVE_INFINITY) return -Infinity;
    if (index4 === NEGATIVE_ZERO) return -0;
    if (standalone || typeof index4 !== "number") {
      throw new Error(`Invalid input`);
    }
    if (index4 in hydrated) return hydrated[index4];
    const value = values[index4];
    if (!value || typeof value !== "object") {
      hydrated[index4] = value;
    } else if (Array.isArray(value)) {
      if (typeof value[0] === "string") {
        const type = value[0];
        const reviver = revivers?.[type];
        if (reviver) {
          let i4 = value[1];
          if (typeof i4 !== "number") {
            i4 = values.push(value[1]) - 1;
          }
          return hydrated[index4] = reviver(hydrate(i4));
        }
        switch (type) {
          case "Date":
            hydrated[index4] = new Date(value[1]);
            break;
          case "Set":
            const set = /* @__PURE__ */ new Set();
            hydrated[index4] = set;
            for (let i4 = 1; i4 < value.length; i4 += 1) {
              set.add(hydrate(value[i4]));
            }
            break;
          case "Map":
            const map = /* @__PURE__ */ new Map();
            hydrated[index4] = map;
            for (let i4 = 1; i4 < value.length; i4 += 2) {
              map.set(hydrate(value[i4]), hydrate(value[i4 + 1]));
            }
            break;
          case "RegExp":
            hydrated[index4] = new RegExp(value[1], value[2]);
            break;
          case "Object":
            hydrated[index4] = Object(value[1]);
            break;
          case "BigInt":
            hydrated[index4] = BigInt(value[1]);
            break;
          case "null":
            const obj = /* @__PURE__ */ Object.create(null);
            hydrated[index4] = obj;
            for (let i4 = 1; i4 < value.length; i4 += 2) {
              obj[value[i4]] = hydrate(value[i4 + 1]);
            }
            break;
          case "Int8Array":
          case "Uint8Array":
          case "Uint8ClampedArray":
          case "Int16Array":
          case "Uint16Array":
          case "Int32Array":
          case "Uint32Array":
          case "Float32Array":
          case "Float64Array":
          case "BigInt64Array":
          case "BigUint64Array": {
            const TypedArrayConstructor = globalThis[type];
            const typedArray = new TypedArrayConstructor(hydrate(value[1]));
            hydrated[index4] = value[2] !== void 0 ? typedArray.subarray(value[2], value[3]) : typedArray;
            break;
          }
          case "ArrayBuffer": {
            const base64 = value[1];
            const arraybuffer = decode64(base64);
            hydrated[index4] = arraybuffer;
            break;
          }
          case "Temporal.Duration":
          case "Temporal.Instant":
          case "Temporal.PlainDate":
          case "Temporal.PlainTime":
          case "Temporal.PlainDateTime":
          case "Temporal.PlainMonthDay":
          case "Temporal.PlainYearMonth":
          case "Temporal.ZonedDateTime": {
            const temporalName = type.slice(9);
            hydrated[index4] = Temporal[temporalName].from(value[1]);
            break;
          }
          case "URL": {
            const url = new URL(value[1]);
            hydrated[index4] = url;
            break;
          }
          case "URLSearchParams": {
            const url = new URLSearchParams(value[1]);
            hydrated[index4] = url;
            break;
          }
          default:
            throw new Error(`Unknown type ${type}`);
        }
      } else {
        const array2 = new Array(value.length);
        hydrated[index4] = array2;
        for (let i4 = 0; i4 < value.length; i4 += 1) {
          const n3 = value[i4];
          if (n3 === HOLE) continue;
          array2[i4] = hydrate(n3);
        }
      }
    } else {
      const object = {};
      hydrated[index4] = object;
      for (const key2 in value) {
        if (key2 === "__proto__") {
          throw new Error("Cannot parse an object with a `__proto__` property");
        }
        const n3 = value[key2];
        object[key2] = hydrate(n3);
      }
    }
    return hydrated[index4];
  }
  __name(hydrate, "hydrate");
  return hydrate(0);
}
__name(unflatten, "unflatten");
function stringify(value, reducers) {
  const stringified = [];
  const indexes = /* @__PURE__ */ new Map();
  const custom = [];
  if (reducers) {
    for (const key2 of Object.getOwnPropertyNames(reducers)) {
      custom.push({ key: key2, fn: reducers[key2] });
    }
  }
  const keys = [];
  let p3 = 0;
  function flatten(thing) {
    if (typeof thing === "function") {
      throw new DevalueError(`Cannot stringify a function`, keys);
    }
    if (thing === void 0) return UNDEFINED;
    if (Number.isNaN(thing)) return NAN;
    if (thing === Infinity) return POSITIVE_INFINITY;
    if (thing === -Infinity) return NEGATIVE_INFINITY;
    if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO;
    if (indexes.has(thing)) return indexes.get(thing);
    const index5 = p3++;
    indexes.set(thing, index5);
    for (const { key: key2, fn } of custom) {
      const value2 = fn(thing);
      if (value2) {
        stringified[index5] = `["${key2}",${flatten(value2)}]`;
        return index5;
      }
    }
    let str = "";
    if (is_primitive(thing)) {
      str = stringify_primitive2(thing);
    } else {
      const type = get_type(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          str = `["Object",${stringify_primitive2(thing)}]`;
          break;
        case "BigInt":
          str = `["BigInt",${thing}]`;
          break;
        case "Date":
          const valid = !isNaN(thing.getDate());
          str = `["Date","${valid ? thing.toISOString() : ""}"]`;
          break;
        case "URL":
          str = `["URL",${stringify_string(thing.toString())}]`;
          break;
        case "URLSearchParams":
          str = `["URLSearchParams",${stringify_string(thing.toString())}]`;
          break;
        case "RegExp":
          const { source, flags } = thing;
          str = flags ? `["RegExp",${stringify_string(source)},"${flags}"]` : `["RegExp",${stringify_string(source)}]`;
          break;
        case "Array":
          str = "[";
          for (let i4 = 0; i4 < thing.length; i4 += 1) {
            if (i4 > 0) str += ",";
            if (i4 in thing) {
              keys.push(`[${i4}]`);
              str += flatten(thing[i4]);
              keys.pop();
            } else {
              str += HOLE;
            }
          }
          str += "]";
          break;
        case "Set":
          str = '["Set"';
          for (const value2 of thing) {
            str += `,${flatten(value2)}`;
          }
          str += "]";
          break;
        case "Map":
          str = '["Map"';
          for (const [key2, value2] of thing) {
            keys.push(
              `.get(${is_primitive(key2) ? stringify_primitive2(key2) : "..."})`
            );
            str += `,${flatten(key2)},${flatten(value2)}`;
            keys.pop();
          }
          str += "]";
          break;
        case "Int8Array":
        case "Uint8Array":
        case "Uint8ClampedArray":
        case "Int16Array":
        case "Uint16Array":
        case "Int32Array":
        case "Uint32Array":
        case "Float32Array":
        case "Float64Array":
        case "BigInt64Array":
        case "BigUint64Array": {
          const typedArray = thing;
          str = '["' + type + '",' + flatten(typedArray.buffer);
          const a3 = thing.byteOffset;
          const b2 = a3 + thing.byteLength;
          if (a3 > 0 || b2 !== typedArray.buffer.byteLength) {
            const m = +/(\d+)/.exec(type)[1] / 8;
            str += `,${a3 / m},${b2 / m}`;
          }
          str += "]";
          break;
        }
        case "ArrayBuffer": {
          const arraybuffer = thing;
          const base64 = encode64(arraybuffer);
          str = `["ArrayBuffer","${base64}"]`;
          break;
        }
        case "Temporal.Duration":
        case "Temporal.Instant":
        case "Temporal.PlainDate":
        case "Temporal.PlainTime":
        case "Temporal.PlainDateTime":
        case "Temporal.PlainMonthDay":
        case "Temporal.PlainYearMonth":
        case "Temporal.ZonedDateTime":
          str = `["${type}",${stringify_string(thing.toString())}]`;
          break;
        default:
          if (!is_plain_object(thing)) {
            throw new DevalueError(
              `Cannot stringify arbitrary non-POJOs`,
              keys
            );
          }
          if (enumerable_symbols(thing).length > 0) {
            throw new DevalueError(
              `Cannot stringify POJOs with symbolic keys`,
              keys
            );
          }
          if (Object.getPrototypeOf(thing) === null) {
            str = '["null"';
            for (const key2 in thing) {
              keys.push(stringify_key(key2));
              str += `,${stringify_string(key2)},${flatten(thing[key2])}`;
              keys.pop();
            }
            str += "]";
          } else {
            str = "{";
            let started = false;
            for (const key2 in thing) {
              if (started) str += ",";
              started = true;
              keys.push(stringify_key(key2));
              str += `${stringify_string(key2)}:${flatten(thing[key2])}`;
              keys.pop();
            }
            str += "}";
          }
      }
    }
    stringified[index5] = str;
    return index5;
  }
  __name(flatten, "flatten");
  const index4 = flatten(value);
  if (index4 < 0) return `${index4}`;
  return `[${stringified.join(",")}]`;
}
__name(stringify, "stringify");
function stringify_primitive2(thing) {
  const type = typeof thing;
  if (type === "string") return stringify_string(thing);
  if (thing instanceof String) return stringify_string(thing.toString());
  if (thing === void 0) return UNDEFINED.toString();
  if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO.toString();
  if (type === "bigint") return `["BigInt","${thing}"]`;
  return String(thing);
}
__name(stringify_primitive2, "stringify_primitive2");
init_exports2();
init_utils2();
init_chunks();
init_shared_server();
init_utils2();
var INVALIDATED_PARAM = "x-sveltekit-invalidated";
var TRAILING_SLASH_PARAM = "x-sveltekit-trailing-slash";
function stringify2(data, transport) {
  const encoders = Object.fromEntries(Object.entries(transport).map(([k3, v2]) => [k3, v2.encode]));
  return stringify(data, encoders);
}
__name(stringify2, "stringify2");
function parse_remote_arg(string, transport) {
  if (!string) return void 0;
  const json_string = text_decoder2.decode(
    // no need to add back `=` characters, atob can handle it
    base64_decode(string.replaceAll("-", "+").replaceAll("_", "/"))
  );
  const decoders = Object.fromEntries(Object.entries(transport).map(([k3, v2]) => [k3, v2.decode]));
  return parse(json_string, decoders);
}
__name(parse_remote_arg, "parse_remote_arg");
function create_remote_cache_key(id, payload) {
  return id + "/" + payload;
}
__name(create_remote_cache_key, "create_remote_cache_key");
var import_cookie4 = __toESM(require_cookie(), 1);
var set_cookie_parser = __toESM(require_set_cookie(), 1);
init_ssr();
init_ssr2();
init_environment();
init_shared_server();
var read_implementation = null;
function set_read_implementation(fn) {
  read_implementation = fn;
}
__name(set_read_implementation, "set_read_implementation");
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page: page2 } = $$props;
  let { constructors } = $$props;
  let { components = [] } = $$props;
  let { form } = $$props;
  let { data_0 = null } = $$props;
  let { data_1 = null } = $$props;
  {
    setContext("__svelte__", stores);
  }
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0) $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page2 !== void 0) $$bindings.page(page2);
  if ($$props.constructors === void 0 && $$bindings.constructors && constructors !== void 0) $$bindings.constructors(constructors);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0) $$bindings.components(components);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0) $$bindings.form(form);
  if ($$props.data_0 === void 0 && $$bindings.data_0 && data_0 !== void 0) $$bindings.data_0(data_0);
  if ($$props.data_1 === void 0 && $$bindings.data_1 && data_1 !== void 0) $$bindings.data_1(data_1);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    {
      stores.page.set(page2);
    }
    $$rendered = `  ${constructors[1] ? `${validate_component(constructors[0] || missing_component, "svelte:component").$$render(
      $$result,
      {
        data: data_0,
        params: page2.params,
        this: components[0]
      },
      {
        this: /* @__PURE__ */ __name(($$value) => {
          components[0] = $$value;
          $$settled = false;
        }, "this")
      },
      {
        default: /* @__PURE__ */ __name(() => {
          return `${validate_component(constructors[1] || missing_component, "svelte:component").$$render(
            $$result,
            {
              data: data_1,
              form,
              params: page2.params,
              this: components[1]
            },
            {
              this: /* @__PURE__ */ __name(($$value) => {
                components[1] = $$value;
                $$settled = false;
              }, "this")
            },
            {}
          )}`;
        }, "default")
      }
    )}` : `${validate_component(constructors[0] || missing_component, "svelte:component").$$render(
      $$result,
      {
        data: data_0,
        form,
        params: page2.params,
        this: components[0]
      },
      {
        this: /* @__PURE__ */ __name(($$value) => {
          components[0] = $$value;
          $$settled = false;
        }, "this")
      },
      {}
    )}`} ${``}`;
  } while (!$$settled);
  return $$rendered;
});
var options = {
  app_template_contains_nonce: false,
  async: false,
  csp: { "mode": "auto", "directives": { "upgrade-insecure-requests": false, "block-all-mixed-content": false }, "reportOnly": { "upgrade-insecure-requests": false, "block-all-mixed-content": false } },
  csrf_check_origin: true,
  csrf_trusted_origins: [],
  embedded: false,
  env_public_prefix: "PUBLIC_",
  env_private_prefix: "",
  hash_routing: false,
  hooks: null,
  // added lazily, via `get_hooks`
  preload_strategy: "modulepreload",
  root: Root,
  service_worker: false,
  service_worker_options: void 0,
  templates: {
    app: /* @__PURE__ */ __name(({ head, body: body2, assets: assets2, nonce: nonce2, env }) => '<!doctype html>\r\n<html lang="en">\r\n	<head>\r\n		<meta charset="utf-8" />\r\n		<link rel="icon" href="' + assets2 + '/favicon.png" />\r\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\r\n		' + head + '\r\n	</head>\r\n	<body data-sveltekit-preload-data="hover">\r\n		<div style="display: contents">' + body2 + "</div>\r\n	</body>\r\n</html>\r\n", "app"),
    error: /* @__PURE__ */ __name(({ status, message: message2 }) => '<!doctype html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<title>' + message2 + `</title>

		<style>
			body {
				--bg: white;
				--fg: #222;
				--divider: #ccc;
				background: var(--bg);
				color: var(--fg);
				font-family:
					system-ui,
					-apple-system,
					BlinkMacSystemFont,
					'Segoe UI',
					Roboto,
					Oxygen,
					Ubuntu,
					Cantarell,
					'Open Sans',
					'Helvetica Neue',
					sans-serif;
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100vh;
				margin: 0;
			}

			.error {
				display: flex;
				align-items: center;
				max-width: 32rem;
				margin: 0 1rem;
			}

			.status {
				font-weight: 200;
				font-size: 3rem;
				line-height: 1;
				position: relative;
				top: -0.05rem;
			}

			.message {
				border-left: 1px solid var(--divider);
				padding: 0 0 0 1rem;
				margin: 0 0 0 1rem;
				min-height: 2.5rem;
				display: flex;
				align-items: center;
			}

			.message h1 {
				font-weight: 400;
				font-size: 1em;
				margin: 0;
			}

			@media (prefers-color-scheme: dark) {
				body {
					--bg: #222;
					--fg: #ddd;
					--divider: #666;
				}
			}
		</style>
	</head>
	<body>
		<div class="error">
			<span class="status">` + status + '</span>\n			<div class="message">\n				<h1>' + message2 + "</h1>\n			</div>\n		</div>\n	</body>\n</html>\n", "error")
  },
  version_hash: "1ox7yjc"
};
async function get_hooks() {
  let handle2;
  let handleFetch;
  let handleError;
  let handleValidationError;
  let init3;
  ({ handle: handle2, handleFetch, handleError, handleValidationError, init: init3 } = await Promise.resolve().then(() => (init_hooks_server(), hooks_server_exports)));
  let reroute;
  let transport;
  return {
    handle: handle2,
    handleFetch,
    handleError,
    handleValidationError,
    init: init3,
    reroute,
    transport
  };
}
__name(get_hooks, "get_hooks");
function with_resolvers() {
  let resolve2;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve2 = res;
    reject = rej;
  });
  return { promise, resolve: resolve2, reject };
}
__name(with_resolvers, "with_resolvers");
var NULL_BODY_STATUS = [101, 103, 204, 205, 304];
var IN_WEBCONTAINER2 = !!globalThis.process?.versions?.webcontainer;
var SVELTE_KIT_ASSETS = "/_svelte_kit_assets";
var ENDPOINT_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
var PAGE_METHODS = ["GET", "POST", "HEAD"];
function negotiate(accept, types2) {
  const parts = [];
  accept.split(",").forEach((str, i4) => {
    const match = /([^/ \t]+)\/([^; \t]+)[ \t]*(?:;[ \t]*q=([0-9.]+))?/.exec(str);
    if (match) {
      const [, type, subtype, q2 = "1"] = match;
      parts.push({ type, subtype, q: +q2, i: i4 });
    }
  });
  parts.sort((a3, b2) => {
    if (a3.q !== b2.q) {
      return b2.q - a3.q;
    }
    if (a3.subtype === "*" !== (b2.subtype === "*")) {
      return a3.subtype === "*" ? 1 : -1;
    }
    if (a3.type === "*" !== (b2.type === "*")) {
      return a3.type === "*" ? 1 : -1;
    }
    return a3.i - b2.i;
  });
  let accepted;
  let min_priority = Infinity;
  for (const mimetype of types2) {
    const [type, subtype] = mimetype.split("/");
    const priority = parts.findIndex(
      (part) => (part.type === type || part.type === "*") && (part.subtype === subtype || part.subtype === "*")
    );
    if (priority !== -1 && priority < min_priority) {
      accepted = mimetype;
      min_priority = priority;
    }
  }
  return accepted;
}
__name(negotiate, "negotiate");
function is_content_type(request, ...types2) {
  const type = request.headers.get("content-type")?.split(";", 1)[0].trim() ?? "";
  return types2.includes(type.toLowerCase());
}
__name(is_content_type, "is_content_type");
function is_form_content_type(request) {
  return is_content_type(
    request,
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain"
  );
}
__name(is_form_content_type, "is_form_content_type");
function coalesce_to_error(err) {
  return err instanceof Error || err && /** @type {any} */
  err.name && /** @type {any} */
  err.message ? (
    /** @type {Error} */
    err
  ) : new Error(JSON.stringify(err));
}
__name(coalesce_to_error, "coalesce_to_error");
function normalize_error(error2) {
  return (
    /** @type {import('../exports/internal/index.js').Redirect | HttpError | SvelteKitError | Error} */
    error2
  );
}
__name(normalize_error, "normalize_error");
function get_status(error2) {
  return error2 instanceof HttpError || error2 instanceof SvelteKitError ? error2.status : 500;
}
__name(get_status, "get_status");
function get_message(error2) {
  return error2 instanceof SvelteKitError ? error2.text : "Internal Error";
}
__name(get_message, "get_message");
var escape_html_attr_dict = {
  "&": "&amp;",
  '"': "&quot;"
  // Svelte also escapes < because the escape function could be called inside a `noscript` there
  // https://github.com/sveltejs/svelte/security/advisories/GHSA-8266-84wp-wv5c
  // However, that doesn't apply in SvelteKit
};
var escape_html_dict = {
  "&": "&amp;",
  "<": "&lt;"
};
var surrogates = (
  // high surrogate without paired low surrogate
  "[\\ud800-\\udbff](?![\\udc00-\\udfff])|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\udc00-\\udfff]"
);
var escape_html_attr_regex = new RegExp(
  `[${Object.keys(escape_html_attr_dict).join("")}]|` + surrogates,
  "g"
);
var escape_html_regex = new RegExp(
  `[${Object.keys(escape_html_dict).join("")}]|` + surrogates,
  "g"
);
function escape_html(str, is_attr) {
  const dict = is_attr ? escape_html_attr_dict : escape_html_dict;
  const escaped_str = str.replace(is_attr ? escape_html_attr_regex : escape_html_regex, (match) => {
    if (match.length === 2) {
      return match;
    }
    return dict[match] ?? `&#${match.charCodeAt(0)};`;
  });
  return escaped_str;
}
__name(escape_html, "escape_html");
function method_not_allowed(mod, method) {
  return text(`${method} method not allowed`, {
    status: 405,
    headers: {
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
      // "The server must generate an Allow header field in a 405 status code response"
      allow: allowed_methods(mod).join(", ")
    }
  });
}
__name(method_not_allowed, "method_not_allowed");
function allowed_methods(mod) {
  const allowed = ENDPOINT_METHODS.filter((method) => method in mod);
  if ("GET" in mod && !("HEAD" in mod)) {
    allowed.push("HEAD");
  }
  return allowed;
}
__name(allowed_methods, "allowed_methods");
function get_global_name(options2) {
  return `__sveltekit_${options2.version_hash}`;
}
__name(get_global_name, "get_global_name");
function static_error_page(options2, status, message2) {
  let page2 = options2.templates.error({ status, message: escape_html(message2) });
  return text(page2, {
    headers: { "content-type": "text/html; charset=utf-8" },
    status
  });
}
__name(static_error_page, "static_error_page");
async function handle_fatal_error(event, state2, options2, error2) {
  error2 = error2 instanceof HttpError ? error2 : coalesce_to_error(error2);
  const status = get_status(error2);
  const body2 = await handle_error_and_jsonify(event, state2, options2, error2);
  const type = negotiate(event.request.headers.get("accept") || "text/html", [
    "application/json",
    "text/html"
  ]);
  if (event.isDataRequest || type === "application/json") {
    return json(body2, {
      status
    });
  }
  return static_error_page(options2, status, body2.message);
}
__name(handle_fatal_error, "handle_fatal_error");
async function handle_error_and_jsonify(event, state2, options2, error2) {
  if (error2 instanceof HttpError) {
    return { message: "Unknown Error", ...error2.body };
  }
  const status = get_status(error2);
  const message2 = get_message(error2);
  return await with_request_store(
    { event, state: state2 },
    () => options2.hooks.handleError({ error: error2, event, status, message: message2 })
  ) ?? { message: message2 };
}
__name(handle_error_and_jsonify, "handle_error_and_jsonify");
function redirect_response(status, location) {
  const response = new Response(void 0, {
    status,
    headers: { location }
  });
  return response;
}
__name(redirect_response, "redirect_response");
function clarify_devalue_error(event, error2) {
  if (error2.path) {
    return `Data returned from \`load\` while rendering ${event.route.id} is not serializable: ${error2.message} (${error2.path}). If you need to serialize/deserialize custom types, use transport hooks: https://svelte.dev/docs/kit/hooks#Universal-hooks-transport.`;
  }
  if (error2.path === "") {
    return `Data returned from \`load\` while rendering ${event.route.id} is not a plain object`;
  }
  return error2.message;
}
__name(clarify_devalue_error, "clarify_devalue_error");
function serialize_uses(node) {
  const uses = {};
  if (node.uses && node.uses.dependencies.size > 0) {
    uses.dependencies = Array.from(node.uses.dependencies);
  }
  if (node.uses && node.uses.search_params.size > 0) {
    uses.search_params = Array.from(node.uses.search_params);
  }
  if (node.uses && node.uses.params.size > 0) {
    uses.params = Array.from(node.uses.params);
  }
  if (node.uses?.parent) uses.parent = 1;
  if (node.uses?.route) uses.route = 1;
  if (node.uses?.url) uses.url = 1;
  return uses;
}
__name(serialize_uses, "serialize_uses");
function has_prerendered_path(manifest2, pathname) {
  return manifest2._.prerendered_routes.has(pathname) || pathname.at(-1) === "/" && manifest2._.prerendered_routes.has(pathname.slice(0, -1));
}
__name(has_prerendered_path, "has_prerendered_path");
function format_server_error(status, error2, event) {
  const formatted_text = `
\x1B[1;31m[${status}] ${event.request.method} ${event.url.pathname}\x1B[0m`;
  if (status === 404) {
    return formatted_text;
  }
  return `${formatted_text}
${error2.stack}`;
}
__name(format_server_error, "format_server_error");
function get_node_type(node_id) {
  const parts = node_id?.split("/");
  const filename = parts?.at(-1);
  if (!filename) return "unknown";
  const dot_parts = filename.split(".");
  return dot_parts.slice(0, -1).join(".");
}
__name(get_node_type, "get_node_type");
async function render_endpoint(event, event_state, mod, state2) {
  const method = (
    /** @type {import('types').HttpMethod} */
    event.request.method
  );
  let handler = mod[method] || mod.fallback;
  if (method === "HEAD" && !mod.HEAD && mod.GET) {
    handler = mod.GET;
  }
  if (!handler) {
    return method_not_allowed(mod, method);
  }
  const prerender = mod.prerender ?? state2.prerender_default;
  if (prerender && (mod.POST || mod.PATCH || mod.PUT || mod.DELETE)) {
    throw new Error("Cannot prerender endpoints that have mutative methods");
  }
  if (state2.prerendering && !state2.prerendering.inside_reroute && !prerender) {
    if (state2.depth > 0) {
      throw new Error(`${event.route.id} is not prerenderable`);
    } else {
      return new Response(void 0, { status: 204 });
    }
  }
  event_state.is_endpoint_request = true;
  try {
    const response = await with_request_store(
      { event, state: event_state },
      () => handler(
        /** @type {import('@sveltejs/kit').RequestEvent<Record<string, any>>} */
        event
      )
    );
    if (!(response instanceof Response)) {
      throw new Error(
        `Invalid response from route ${event.url.pathname}: handler should return a Response object`
      );
    }
    if (state2.prerendering && (!state2.prerendering.inside_reroute || prerender)) {
      const cloned = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
      cloned.headers.set("x-sveltekit-prerender", String(prerender));
      if (state2.prerendering.inside_reroute && prerender) {
        cloned.headers.set(
          "x-sveltekit-routeid",
          encodeURI(
            /** @type {string} */
            event.route.id
          )
        );
        state2.prerendering.dependencies.set(event.url.pathname, { response: cloned, body: null });
      } else {
        return cloned;
      }
    }
    return response;
  } catch (e3) {
    if (e3 instanceof Redirect) {
      return new Response(void 0, {
        status: e3.status,
        headers: { location: e3.location }
      });
    }
    throw e3;
  }
}
__name(render_endpoint, "render_endpoint");
function is_endpoint_request(event) {
  const { method, headers: headers2 } = event.request;
  if (ENDPOINT_METHODS.includes(method) && !PAGE_METHODS.includes(method)) {
    return true;
  }
  if (method === "POST" && headers2.get("x-sveltekit-action") === "true") return false;
  const accept = event.request.headers.get("accept") ?? "*/*";
  return negotiate(accept, ["*", "text/html"]) !== "text/html";
}
__name(is_endpoint_request, "is_endpoint_request");
function compact(arr) {
  return arr.filter(
    /** @returns {val is NonNullable<T>} */
    (val) => val != null
  );
}
__name(compact, "compact");
var DATA_SUFFIX = "/__data.json";
var HTML_DATA_SUFFIX = ".html__data.json";
function has_data_suffix2(pathname) {
  return pathname.endsWith(DATA_SUFFIX) || pathname.endsWith(HTML_DATA_SUFFIX);
}
__name(has_data_suffix2, "has_data_suffix2");
function add_data_suffix2(pathname) {
  if (pathname.endsWith(".html")) return pathname.replace(/\.html$/, HTML_DATA_SUFFIX);
  return pathname.replace(/\/$/, "") + DATA_SUFFIX;
}
__name(add_data_suffix2, "add_data_suffix2");
function strip_data_suffix2(pathname) {
  if (pathname.endsWith(HTML_DATA_SUFFIX)) {
    return pathname.slice(0, -HTML_DATA_SUFFIX.length) + ".html";
  }
  return pathname.slice(0, -DATA_SUFFIX.length);
}
__name(strip_data_suffix2, "strip_data_suffix2");
var ROUTE_SUFFIX = "/__route.js";
function has_resolution_suffix2(pathname) {
  return pathname.endsWith(ROUTE_SUFFIX);
}
__name(has_resolution_suffix2, "has_resolution_suffix2");
function add_resolution_suffix2(pathname) {
  return pathname.replace(/\/$/, "") + ROUTE_SUFFIX;
}
__name(add_resolution_suffix2, "add_resolution_suffix2");
function strip_resolution_suffix2(pathname) {
  return pathname.slice(0, -ROUTE_SUFFIX.length);
}
__name(strip_resolution_suffix2, "strip_resolution_suffix2");
var noop_span = {
  spanContext() {
    return noop_span_context;
  },
  setAttribute() {
    return this;
  },
  setAttributes() {
    return this;
  },
  addEvent() {
    return this;
  },
  setStatus() {
    return this;
  },
  updateName() {
    return this;
  },
  end() {
    return this;
  },
  isRecording() {
    return false;
  },
  recordException() {
    return this;
  },
  addLink() {
    return this;
  },
  addLinks() {
    return this;
  }
};
var noop_span_context = {
  traceId: "",
  spanId: "",
  traceFlags: 0
};
async function record_span({ name, attributes, fn }) {
  {
    return fn(noop_span);
  }
}
__name(record_span, "record_span");
function is_action_json_request(event) {
  const accept = negotiate(event.request.headers.get("accept") ?? "*/*", [
    "application/json",
    "text/html"
  ]);
  return accept === "application/json" && event.request.method === "POST";
}
__name(is_action_json_request, "is_action_json_request");
async function handle_action_json_request(event, event_state, options2, server2) {
  const actions2 = server2?.actions;
  if (!actions2) {
    const no_actions_error = new SvelteKitError(
      405,
      "Method Not Allowed",
      `POST method not allowed. No form actions exist for ${"this page"}`
    );
    return action_json(
      {
        type: "error",
        error: await handle_error_and_jsonify(event, event_state, options2, no_actions_error)
      },
      {
        status: no_actions_error.status,
        headers: {
          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
          // "The server must generate an Allow header field in a 405 status code response"
          allow: "GET"
        }
      }
    );
  }
  check_named_default_separate(actions2);
  try {
    const data = await call_action(event, event_state, actions2);
    if (BROWSER) ;
    if (data instanceof ActionFailure) {
      return action_json({
        type: "failure",
        status: data.status,
        // @ts-expect-error we assign a string to what is supposed to be an object. That's ok
        // because we don't use the object outside, and this way we have better code navigation
        // through knowing where the related interface is used.
        data: stringify_action_response(
          data.data,
          /** @type {string} */
          event.route.id,
          options2.hooks.transport
        )
      });
    } else {
      return action_json({
        type: "success",
        status: data ? 200 : 204,
        // @ts-expect-error see comment above
        data: stringify_action_response(
          data,
          /** @type {string} */
          event.route.id,
          options2.hooks.transport
        )
      });
    }
  } catch (e3) {
    const err = normalize_error(e3);
    if (err instanceof Redirect) {
      return action_json_redirect(err);
    }
    return action_json(
      {
        type: "error",
        error: await handle_error_and_jsonify(
          event,
          event_state,
          options2,
          check_incorrect_fail_use(err)
        )
      },
      {
        status: get_status(err)
      }
    );
  }
}
__name(handle_action_json_request, "handle_action_json_request");
function check_incorrect_fail_use(error2) {
  return error2 instanceof ActionFailure ? new Error('Cannot "throw fail()". Use "return fail()"') : error2;
}
__name(check_incorrect_fail_use, "check_incorrect_fail_use");
function action_json_redirect(redirect2) {
  return action_json({
    type: "redirect",
    status: redirect2.status,
    location: redirect2.location
  });
}
__name(action_json_redirect, "action_json_redirect");
function action_json(data, init22) {
  return json(data, init22);
}
__name(action_json, "action_json");
function is_action_request(event) {
  return event.request.method === "POST";
}
__name(is_action_request, "is_action_request");
async function handle_action_request(event, event_state, server2) {
  const actions2 = server2?.actions;
  if (!actions2) {
    event.setHeaders({
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
      // "The server must generate an Allow header field in a 405 status code response"
      allow: "GET"
    });
    return {
      type: "error",
      error: new SvelteKitError(
        405,
        "Method Not Allowed",
        `POST method not allowed. No form actions exist for ${"this page"}`
      )
    };
  }
  check_named_default_separate(actions2);
  try {
    const data = await call_action(event, event_state, actions2);
    if (BROWSER) ;
    if (data instanceof ActionFailure) {
      return {
        type: "failure",
        status: data.status,
        data: data.data
      };
    } else {
      return {
        type: "success",
        status: 200,
        // @ts-expect-error this will be removed upon serialization, so `undefined` is the same as omission
        data
      };
    }
  } catch (e3) {
    const err = normalize_error(e3);
    if (err instanceof Redirect) {
      return {
        type: "redirect",
        status: err.status,
        location: err.location
      };
    }
    return {
      type: "error",
      error: check_incorrect_fail_use(err)
    };
  }
}
__name(handle_action_request, "handle_action_request");
function check_named_default_separate(actions2) {
  if (actions2.default && Object.keys(actions2).length > 1) {
    throw new Error(
      "When using named actions, the default action cannot be used. See the docs for more info: https://svelte.dev/docs/kit/form-actions#named-actions"
    );
  }
}
__name(check_named_default_separate, "check_named_default_separate");
async function call_action(event, event_state, actions2) {
  const url = new URL(event.request.url);
  let name = "default";
  for (const param of url.searchParams) {
    if (param[0].startsWith("/")) {
      name = param[0].slice(1);
      if (name === "default") {
        throw new Error('Cannot use reserved action name "default"');
      }
      break;
    }
  }
  const action = actions2[name];
  if (!action) {
    throw new SvelteKitError(404, "Not Found", `No action with name '${name}' found`);
  }
  if (!is_form_content_type(event.request)) {
    throw new SvelteKitError(
      415,
      "Unsupported Media Type",
      `Form actions expect form-encoded data \u2014 received ${event.request.headers.get(
        "content-type"
      )}`
    );
  }
  return record_span({
    name: "sveltekit.form_action",
    attributes: {
      "http.route": event.route.id || "unknown"
    },
    fn: /* @__PURE__ */ __name(async (current2) => {
      const traced_event = merge_tracing(event, current2);
      const result = await with_request_store(
        { event: traced_event, state: event_state },
        () => action(traced_event)
      );
      if (result instanceof ActionFailure) {
        current2.setAttributes({
          "sveltekit.form_action.result.type": "failure",
          "sveltekit.form_action.result.status": result.status
        });
      }
      return result;
    }, "fn")
  });
}
__name(call_action, "call_action");
function uneval_action_response(data, route_id, transport) {
  const replacer = /* @__PURE__ */ __name((thing) => {
    for (const key2 in transport) {
      const encoded = transport[key2].encode(thing);
      if (encoded) {
        return `app.decode('${key2}', ${uneval(encoded, replacer)})`;
      }
    }
  }, "replacer");
  return try_serialize(data, (value) => uneval(value, replacer), route_id);
}
__name(uneval_action_response, "uneval_action_response");
function stringify_action_response(data, route_id, transport) {
  const encoders = Object.fromEntries(
    Object.entries(transport).map(([key2, value]) => [key2, value.encode])
  );
  return try_serialize(data, (value) => stringify(value, encoders), route_id);
}
__name(stringify_action_response, "stringify_action_response");
function try_serialize(data, fn, route_id) {
  try {
    return fn(data);
  } catch (e3) {
    const error2 = (
      /** @type {any} */
      e3
    );
    if (data instanceof Response) {
      throw new Error(
        `Data returned from action inside ${route_id} is not serializable. Form actions need to return plain objects or fail(). E.g. return { success: true } or return fail(400, { message: "invalid" });`
      );
    }
    if ("path" in error2) {
      let message2 = `Data returned from action inside ${route_id} is not serializable: ${error2.message}`;
      if (error2.path !== "") message2 += ` (data.${error2.path})`;
      throw new Error(message2);
    }
    throw error2;
  }
}
__name(try_serialize, "try_serialize");
function create_async_iterator() {
  let resolved = -1;
  let returned = -1;
  const deferred = [];
  return {
    iterate: /* @__PURE__ */ __name((transform = (x3) => x3) => {
      return {
        [Symbol.asyncIterator]() {
          return {
            next: /* @__PURE__ */ __name(async () => {
              const next = deferred[++returned];
              if (!next) return { value: null, done: true };
              const value = await next.promise;
              return { value: transform(value), done: false };
            }, "next")
          };
        }
      };
    }, "iterate"),
    add: /* @__PURE__ */ __name((promise) => {
      deferred.push(with_resolvers());
      void promise.then((value) => {
        deferred[++resolved].resolve(value);
      });
    }, "add")
  };
}
__name(create_async_iterator, "create_async_iterator");
function server_data_serializer(event, event_state, options2) {
  let promise_id = 1;
  let max_nodes = -1;
  const iterator = create_async_iterator();
  const global = get_global_name(options2);
  function get_replacer(index4) {
    return /* @__PURE__ */ __name(function replacer(thing) {
      if (typeof thing?.then === "function") {
        const id = promise_id++;
        const promise = thing.then(
          /** @param {any} data */
          (data) => ({ data })
        ).catch(
          /** @param {any} error */
          async (error2) => ({
            error: await handle_error_and_jsonify(event, event_state, options2, error2)
          })
        ).then(
          /**
           * @param {{data: any; error: any}} result
           */
          async ({ data, error: error2 }) => {
            let str;
            try {
              str = uneval(error2 ? [, error2] : [data], replacer);
            } catch {
              error2 = await handle_error_and_jsonify(
                event,
                event_state,
                options2,
                new Error(`Failed to serialize promise while rendering ${event.route.id}`)
              );
              data = void 0;
              str = uneval([, error2], replacer);
            }
            return {
              index: index4,
              str: `${global}.resolve(${id}, ${str.includes("app.decode") ? `(app) => ${str}` : `() => ${str}`})`
            };
          }
        );
        iterator.add(promise);
        return `${global}.defer(${id})`;
      } else {
        for (const key2 in options2.hooks.transport) {
          const encoded = options2.hooks.transport[key2].encode(thing);
          if (encoded) {
            return `app.decode('${key2}', ${uneval(encoded, replacer)})`;
          }
        }
      }
    }, "replacer");
  }
  __name(get_replacer, "get_replacer");
  const strings = (
    /** @type {string[]} */
    []
  );
  return {
    set_max_nodes(i4) {
      max_nodes = i4;
    },
    add_node(i4, node) {
      try {
        if (!node) {
          strings[i4] = "null";
          return;
        }
        const payload = { type: "data", data: node.data, uses: serialize_uses(node) };
        if (node.slash) payload.slash = node.slash;
        strings[i4] = uneval(payload, get_replacer(i4));
      } catch (e3) {
        e3.path = e3.path.slice(1);
        throw new Error(clarify_devalue_error(
          event,
          /** @type {any} */
          e3
        ));
      }
    },
    get_data(csp) {
      const open = `<script${csp.script_needs_nonce ? ` nonce="${csp.nonce}"` : ""}>`;
      const close = `<\/script>
`;
      return {
        data: `[${compact(max_nodes > -1 ? strings.slice(0, max_nodes) : strings).join(",")}]`,
        chunks: promise_id > 1 ? iterator.iterate(({ index: index4, str }) => {
          if (max_nodes > -1 && index4 >= max_nodes) {
            return "";
          }
          return open + str + close;
        }) : null
      };
    }
  };
}
__name(server_data_serializer, "server_data_serializer");
function server_data_serializer_json(event, event_state, options2) {
  let promise_id = 1;
  const iterator = create_async_iterator();
  const reducers = {
    ...Object.fromEntries(
      Object.entries(options2.hooks.transport).map(([key2, value]) => [key2, value.encode])
    ),
    /** @param {any} thing */
    Promise: /* @__PURE__ */ __name((thing) => {
      if (typeof thing?.then !== "function") {
        return;
      }
      const id = promise_id++;
      let key2 = "data";
      const promise = thing.catch(
        /** @param {any} e */
        async (e3) => {
          key2 = "error";
          return handle_error_and_jsonify(
            event,
            event_state,
            options2,
            /** @type {any} */
            e3
          );
        }
      ).then(
        /** @param {any} value */
        async (value) => {
          let str;
          try {
            str = stringify(value, reducers);
          } catch {
            const error2 = await handle_error_and_jsonify(
              event,
              event_state,
              options2,
              new Error(`Failed to serialize promise while rendering ${event.route.id}`)
            );
            key2 = "error";
            str = stringify(error2, reducers);
          }
          return `{"type":"chunk","id":${id},"${key2}":${str}}
`;
        }
      );
      iterator.add(promise);
      return id;
    }, "Promise")
  };
  const strings = (
    /** @type {string[]} */
    []
  );
  return {
    add_node(i4, node) {
      try {
        if (!node) {
          strings[i4] = "null";
          return;
        }
        if (node.type === "error" || node.type === "skip") {
          strings[i4] = JSON.stringify(node);
          return;
        }
        strings[i4] = `{"type":"data","data":${stringify(node.data, reducers)},"uses":${JSON.stringify(
          serialize_uses(node)
        )}${node.slash ? `,"slash":${JSON.stringify(node.slash)}` : ""}}`;
      } catch (e3) {
        e3.path = "data" + e3.path;
        throw new Error(clarify_devalue_error(
          event,
          /** @type {any} */
          e3
        ));
      }
    },
    get_data() {
      return {
        data: `{"type":"data","nodes":[${strings.join(",")}]}
`,
        chunks: promise_id > 1 ? iterator.iterate() : null
      };
    }
  };
}
__name(server_data_serializer_json, "server_data_serializer_json");
async function load_server_data({ event, event_state, state: state2, node, parent }) {
  if (!node?.server) return null;
  let is_tracking = true;
  const uses = {
    dependencies: /* @__PURE__ */ new Set(),
    params: /* @__PURE__ */ new Set(),
    parent: false,
    route: false,
    url: false,
    search_params: /* @__PURE__ */ new Set()
  };
  const load3 = node.server.load;
  const slash = node.server.trailingSlash;
  if (!load3) {
    return { type: "data", data: null, uses, slash };
  }
  const url = make_trackable(
    event.url,
    () => {
      if (is_tracking) {
        uses.url = true;
      }
    },
    (param) => {
      if (is_tracking) {
        uses.search_params.add(param);
      }
    }
  );
  if (state2.prerendering) {
    disable_search(url);
  }
  const result = await record_span({
    name: "sveltekit.load",
    attributes: {
      "sveltekit.load.node_id": node.server_id || "unknown",
      "sveltekit.load.node_type": get_node_type(node.server_id),
      "http.route": event.route.id || "unknown"
    },
    fn: /* @__PURE__ */ __name(async (current2) => {
      const traced_event = merge_tracing(event, current2);
      const result2 = await with_request_store(
        { event: traced_event, state: event_state },
        () => load3.call(null, {
          ...traced_event,
          fetch: /* @__PURE__ */ __name((info, init22) => {
            new URL(info instanceof Request ? info.url : info, event.url);
            return event.fetch(info, init22);
          }, "fetch"),
          /** @param {string[]} deps */
          depends: /* @__PURE__ */ __name((...deps) => {
            for (const dep of deps) {
              const { href } = new URL(dep, event.url);
              uses.dependencies.add(href);
            }
          }, "depends"),
          params: new Proxy(event.params, {
            get: /* @__PURE__ */ __name((target, key2) => {
              if (is_tracking) {
                uses.params.add(key2);
              }
              return target[
                /** @type {string} */
                key2
              ];
            }, "get")
          }),
          parent: /* @__PURE__ */ __name(async () => {
            if (is_tracking) {
              uses.parent = true;
            }
            return parent();
          }, "parent"),
          route: new Proxy(event.route, {
            get: /* @__PURE__ */ __name((target, key2) => {
              if (is_tracking) {
                uses.route = true;
              }
              return target[
                /** @type {'id'} */
                key2
              ];
            }, "get")
          }),
          url,
          untrack(fn) {
            is_tracking = false;
            try {
              return fn();
            } finally {
              is_tracking = true;
            }
          }
        })
      );
      return result2;
    }, "fn")
  });
  return {
    type: "data",
    data: result ?? null,
    uses,
    slash
  };
}
__name(load_server_data, "load_server_data");
async function load_data({
  event,
  event_state,
  fetched,
  node,
  parent,
  server_data_promise,
  state: state2,
  resolve_opts,
  csr
}) {
  const server_data_node = await server_data_promise;
  const load3 = node?.universal?.load;
  if (!load3) {
    return server_data_node?.data ?? null;
  }
  const result = await record_span({
    name: "sveltekit.load",
    attributes: {
      "sveltekit.load.node_id": node.universal_id || "unknown",
      "sveltekit.load.node_type": get_node_type(node.universal_id),
      "http.route": event.route.id || "unknown"
    },
    fn: /* @__PURE__ */ __name(async (current2) => {
      const traced_event = merge_tracing(event, current2);
      return await with_request_store(
        { event: traced_event, state: event_state },
        () => load3.call(null, {
          url: event.url,
          params: event.params,
          data: server_data_node?.data ?? null,
          route: event.route,
          fetch: create_universal_fetch(event, state2, fetched, csr, resolve_opts),
          setHeaders: event.setHeaders,
          depends: /* @__PURE__ */ __name(() => {
          }, "depends"),
          parent,
          untrack: /* @__PURE__ */ __name((fn) => fn(), "untrack"),
          tracing: traced_event.tracing
        })
      );
    }, "fn")
  });
  return result ?? null;
}
__name(load_data, "load_data");
function create_universal_fetch(event, state2, fetched, csr, resolve_opts) {
  const universal_fetch = /* @__PURE__ */ __name(async (input, init22) => {
    const cloned_body = input instanceof Request && input.body ? input.clone().body : null;
    const cloned_headers = input instanceof Request && [...input.headers].length ? new Headers(input.headers) : init22?.headers;
    let response = await event.fetch(input, init22);
    const url = new URL(input instanceof Request ? input.url : input, event.url);
    const same_origin = url.origin === event.url.origin;
    let dependency;
    if (same_origin) {
      if (state2.prerendering) {
        dependency = { response, body: null };
        state2.prerendering.dependencies.set(url.pathname, dependency);
      }
    } else if (url.protocol === "https:" || url.protocol === "http:") {
      const mode = input instanceof Request ? input.mode : init22?.mode ?? "cors";
      if (mode === "no-cors") {
        response = new Response("", {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } else {
        const acao = response.headers.get("access-control-allow-origin");
        if (!acao || acao !== event.url.origin && acao !== "*") {
          throw new Error(
            `CORS error: ${acao ? "Incorrect" : "No"} 'Access-Control-Allow-Origin' header is present on the requested resource`
          );
        }
      }
    }
    let teed_body;
    const proxy = new Proxy(response, {
      get(response2, key2, _receiver) {
        async function push_fetched(body2, is_b64) {
          const status_number = Number(response2.status);
          if (isNaN(status_number)) {
            throw new Error(
              `response.status is not a number. value: "${response2.status}" type: ${typeof response2.status}`
            );
          }
          fetched.push({
            url: same_origin ? url.href.slice(event.url.origin.length) : url.href,
            method: event.request.method,
            request_body: (
              /** @type {string | ArrayBufferView | undefined} */
              input instanceof Request && cloned_body ? await stream_to_string(cloned_body) : init22?.body
            ),
            request_headers: cloned_headers,
            response_body: body2,
            response: response2,
            is_b64
          });
        }
        __name(push_fetched, "push_fetched");
        if (key2 === "body") {
          if (response2.body === null) {
            return null;
          }
          if (teed_body) {
            return teed_body;
          }
          const [a3, b2] = response2.body.tee();
          void (async () => {
            let result = new Uint8Array();
            for await (const chunk of a3) {
              const combined = new Uint8Array(result.length + chunk.length);
              combined.set(result, 0);
              combined.set(chunk, result.length);
              result = combined;
            }
            if (dependency) {
              dependency.body = new Uint8Array(result);
            }
            void push_fetched(base64_encode(result), true);
          })();
          return teed_body = b2;
        }
        if (key2 === "arrayBuffer") {
          return async () => {
            const buffer = await response2.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            if (dependency) {
              dependency.body = bytes;
            }
            if (buffer instanceof ArrayBuffer) {
              await push_fetched(base64_encode(bytes), true);
            }
            return buffer;
          };
        }
        async function text2() {
          const body2 = await response2.text();
          if (body2 === "" && NULL_BODY_STATUS.includes(response2.status)) {
            await push_fetched(void 0, false);
            return void 0;
          }
          if (!body2 || typeof body2 === "string") {
            await push_fetched(body2, false);
          }
          if (dependency) {
            dependency.body = body2;
          }
          return body2;
        }
        __name(text2, "text2");
        if (key2 === "text") {
          return text2;
        }
        if (key2 === "json") {
          return async () => {
            const body2 = await text2();
            return body2 ? JSON.parse(body2) : void 0;
          };
        }
        return Reflect.get(response2, key2, response2);
      }
    });
    if (csr) {
      const get = response.headers.get;
      response.headers.get = (key2) => {
        const lower = key2.toLowerCase();
        const value = get.call(response.headers, lower);
        if (value && !lower.startsWith("x-sveltekit-")) {
          const included = resolve_opts.filterSerializedResponseHeaders(lower, value);
          if (!included) {
            throw new Error(
              `Failed to get response header "${lower}" \u2014 it must be included by the \`filterSerializedResponseHeaders\` option: https://svelte.dev/docs/kit/hooks#Server-hooks-handle (at ${event.route.id})`
            );
          }
        }
        return value;
      };
    }
    return proxy;
  }, "universal_fetch");
  return (input, init22) => {
    const response = universal_fetch(input, init22);
    response.catch(() => {
    });
    return response;
  };
}
__name(create_universal_fetch, "create_universal_fetch");
async function stream_to_string(stream) {
  let result = "";
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result += text_decoder2.decode(value);
  }
  return result;
}
__name(stream_to_string, "stream_to_string");
function hash(...values) {
  let hash2 = 5381;
  for (const value of values) {
    if (typeof value === "string") {
      let i4 = value.length;
      while (i4) hash2 = hash2 * 33 ^ value.charCodeAt(--i4);
    } else if (ArrayBuffer.isView(value)) {
      const buffer = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      let i4 = buffer.length;
      while (i4) hash2 = hash2 * 33 ^ buffer[--i4];
    } else {
      throw new TypeError("value must be a string or TypedArray");
    }
  }
  return (hash2 >>> 0).toString(36);
}
__name(hash, "hash");
var replacements = {
  "<": "\\u003C",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var pattern = new RegExp(`[${Object.keys(replacements).join("")}]`, "g");
function serialize_data(fetched, filter, prerendering = false) {
  const headers2 = {};
  let cache_control = null;
  let age = null;
  let varyAny = false;
  for (const [key2, value] of fetched.response.headers) {
    if (filter(key2, value)) {
      headers2[key2] = value;
    }
    if (key2 === "cache-control") cache_control = value;
    else if (key2 === "age") age = value;
    else if (key2 === "vary" && value.trim() === "*") varyAny = true;
  }
  const payload = {
    status: fetched.response.status,
    statusText: fetched.response.statusText,
    headers: headers2,
    body: fetched.response_body
  };
  const safe_payload = JSON.stringify(payload).replace(pattern, (match) => replacements[match]);
  const attrs = [
    'type="application/json"',
    "data-sveltekit-fetched",
    `data-url="${escape_html(fetched.url, true)}"`
  ];
  if (fetched.is_b64) {
    attrs.push("data-b64");
  }
  if (fetched.request_headers || fetched.request_body) {
    const values = [];
    if (fetched.request_headers) {
      values.push([...new Headers(fetched.request_headers)].join(","));
    }
    if (fetched.request_body) {
      values.push(fetched.request_body);
    }
    attrs.push(`data-hash="${hash(...values)}"`);
  }
  if (!prerendering && fetched.method === "GET" && cache_control && !varyAny) {
    const match = /s-maxage=(\d+)/g.exec(cache_control) ?? /max-age=(\d+)/g.exec(cache_control);
    if (match) {
      const ttl = +match[1] - +(age ?? "0");
      attrs.push(`data-ttl="${ttl}"`);
    }
  }
  return `<script ${attrs.join(" ")}>${safe_payload}<\/script>`;
}
__name(serialize_data, "serialize_data");
var s3 = JSON.stringify;
function sha256(data) {
  if (!key[0]) precompute();
  const out = init2.slice(0);
  const array2 = encode4(data);
  for (let i4 = 0; i4 < array2.length; i4 += 16) {
    const w3 = array2.subarray(i4, i4 + 16);
    let tmp;
    let a3;
    let b2;
    let out0 = out[0];
    let out1 = out[1];
    let out2 = out[2];
    let out3 = out[3];
    let out4 = out[4];
    let out5 = out[5];
    let out6 = out[6];
    let out7 = out[7];
    for (let i22 = 0; i22 < 64; i22++) {
      if (i22 < 16) {
        tmp = w3[i22];
      } else {
        a3 = w3[i22 + 1 & 15];
        b2 = w3[i22 + 14 & 15];
        tmp = w3[i22 & 15] = (a3 >>> 7 ^ a3 >>> 18 ^ a3 >>> 3 ^ a3 << 25 ^ a3 << 14) + (b2 >>> 17 ^ b2 >>> 19 ^ b2 >>> 10 ^ b2 << 15 ^ b2 << 13) + w3[i22 & 15] + w3[i22 + 9 & 15] | 0;
      }
      tmp = tmp + out7 + (out4 >>> 6 ^ out4 >>> 11 ^ out4 >>> 25 ^ out4 << 26 ^ out4 << 21 ^ out4 << 7) + (out6 ^ out4 & (out5 ^ out6)) + key[i22];
      out7 = out6;
      out6 = out5;
      out5 = out4;
      out4 = out3 + tmp | 0;
      out3 = out2;
      out2 = out1;
      out1 = out0;
      out0 = tmp + (out1 & out2 ^ out3 & (out1 ^ out2)) + (out1 >>> 2 ^ out1 >>> 13 ^ out1 >>> 22 ^ out1 << 30 ^ out1 << 19 ^ out1 << 10) | 0;
    }
    out[0] = out[0] + out0 | 0;
    out[1] = out[1] + out1 | 0;
    out[2] = out[2] + out2 | 0;
    out[3] = out[3] + out3 | 0;
    out[4] = out[4] + out4 | 0;
    out[5] = out[5] + out5 | 0;
    out[6] = out[6] + out6 | 0;
    out[7] = out[7] + out7 | 0;
  }
  const bytes = new Uint8Array(out.buffer);
  reverse_endianness(bytes);
  return btoa(String.fromCharCode(...bytes));
}
__name(sha256, "sha256");
var init2 = new Uint32Array(8);
var key = new Uint32Array(64);
function precompute() {
  function frac(x3) {
    return (x3 - Math.floor(x3)) * 4294967296;
  }
  __name(frac, "frac");
  let prime = 2;
  for (let i4 = 0; i4 < 64; prime++) {
    let is_prime = true;
    for (let factor = 2; factor * factor <= prime; factor++) {
      if (prime % factor === 0) {
        is_prime = false;
        break;
      }
    }
    if (is_prime) {
      if (i4 < 8) {
        init2[i4] = frac(prime ** (1 / 2));
      }
      key[i4] = frac(prime ** (1 / 3));
      i4++;
    }
  }
}
__name(precompute, "precompute");
function reverse_endianness(bytes) {
  for (let i4 = 0; i4 < bytes.length; i4 += 4) {
    const a3 = bytes[i4 + 0];
    const b2 = bytes[i4 + 1];
    const c4 = bytes[i4 + 2];
    const d3 = bytes[i4 + 3];
    bytes[i4 + 0] = d3;
    bytes[i4 + 1] = c4;
    bytes[i4 + 2] = b2;
    bytes[i4 + 3] = a3;
  }
}
__name(reverse_endianness, "reverse_endianness");
function encode4(str) {
  const encoded = text_encoder2.encode(str);
  const length = encoded.length * 8;
  const size = 512 * Math.ceil((length + 65) / 512);
  const bytes = new Uint8Array(size / 8);
  bytes.set(encoded);
  bytes[encoded.length] = 128;
  reverse_endianness(bytes);
  const words = new Uint32Array(bytes.buffer);
  words[words.length - 2] = Math.floor(length / 4294967296);
  words[words.length - 1] = length;
  return words;
}
__name(encode4, "encode4");
var array = new Uint8Array(16);
function generate_nonce() {
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}
__name(generate_nonce, "generate_nonce");
var quoted = /* @__PURE__ */ new Set([
  "self",
  "unsafe-eval",
  "unsafe-hashes",
  "unsafe-inline",
  "none",
  "strict-dynamic",
  "report-sample",
  "wasm-unsafe-eval",
  "script"
]);
var crypto_pattern = /^(nonce|sha\d\d\d)-/;
var BaseProvider = class {
  static {
    __name(this, "BaseProvider");
  }
  /** @type {boolean} */
  #use_hashes;
  /** @type {boolean} */
  #script_needs_csp;
  /** @type {boolean} */
  #script_src_needs_csp;
  /** @type {boolean} */
  #script_src_elem_needs_csp;
  /** @type {boolean} */
  #style_needs_csp;
  /** @type {boolean} */
  #style_src_needs_csp;
  /** @type {boolean} */
  #style_src_attr_needs_csp;
  /** @type {boolean} */
  #style_src_elem_needs_csp;
  /** @type {import('types').CspDirectives} */
  #directives;
  /** @type {import('types').Csp.Source[]} */
  #script_src;
  /** @type {import('types').Csp.Source[]} */
  #script_src_elem;
  /** @type {import('types').Csp.Source[]} */
  #style_src;
  /** @type {import('types').Csp.Source[]} */
  #style_src_attr;
  /** @type {import('types').Csp.Source[]} */
  #style_src_elem;
  /** @type {string} */
  #nonce;
  /**
   * @param {boolean} use_hashes
   * @param {import('types').CspDirectives} directives
   * @param {string} nonce
   */
  constructor(use_hashes, directives, nonce2) {
    this.#use_hashes = use_hashes;
    this.#directives = directives;
    const d3 = this.#directives;
    this.#script_src = [];
    this.#script_src_elem = [];
    this.#style_src = [];
    this.#style_src_attr = [];
    this.#style_src_elem = [];
    const effective_script_src = d3["script-src"] || d3["default-src"];
    const script_src_elem = d3["script-src-elem"];
    const effective_style_src = d3["style-src"] || d3["default-src"];
    const style_src_attr = d3["style-src-attr"];
    const style_src_elem = d3["style-src-elem"];
    const needs_csp = /* @__PURE__ */ __name((directive) => !!directive && !directive.some((value) => value === "unsafe-inline"), "needs_csp");
    this.#script_src_needs_csp = needs_csp(effective_script_src);
    this.#script_src_elem_needs_csp = needs_csp(script_src_elem);
    this.#style_src_needs_csp = needs_csp(effective_style_src);
    this.#style_src_attr_needs_csp = needs_csp(style_src_attr);
    this.#style_src_elem_needs_csp = needs_csp(style_src_elem);
    this.#script_needs_csp = this.#script_src_needs_csp || this.#script_src_elem_needs_csp;
    this.#style_needs_csp = this.#style_src_needs_csp || this.#style_src_attr_needs_csp || this.#style_src_elem_needs_csp;
    this.script_needs_nonce = this.#script_needs_csp && !this.#use_hashes;
    this.style_needs_nonce = this.#style_needs_csp && !this.#use_hashes;
    this.#nonce = nonce2;
  }
  /** @param {string} content */
  add_script(content) {
    if (!this.#script_needs_csp) return;
    const source = this.#use_hashes ? `sha256-${sha256(content)}` : `nonce-${this.#nonce}`;
    if (this.#script_src_needs_csp) {
      this.#script_src.push(source);
    }
    if (this.#script_src_elem_needs_csp) {
      this.#script_src_elem.push(source);
    }
  }
  /** @param {string} content */
  add_style(content) {
    if (!this.#style_needs_csp) return;
    const source = this.#use_hashes ? `sha256-${sha256(content)}` : `nonce-${this.#nonce}`;
    if (this.#style_src_needs_csp) {
      this.#style_src.push(source);
    }
    if (this.#style_src_attr_needs_csp) {
      this.#style_src_attr.push(source);
    }
    if (this.#style_src_elem_needs_csp) {
      const sha256_empty_comment_hash = "sha256-9OlNO0DNEeaVzHL4RZwCLsBHA8WBQ8toBp/4F5XV2nc=";
      const d3 = this.#directives;
      if (d3["style-src-elem"] && !d3["style-src-elem"].includes(sha256_empty_comment_hash) && !this.#style_src_elem.includes(sha256_empty_comment_hash)) {
        this.#style_src_elem.push(sha256_empty_comment_hash);
      }
      if (source !== sha256_empty_comment_hash) {
        this.#style_src_elem.push(source);
      }
    }
  }
  /**
   * @param {boolean} [is_meta]
   */
  get_header(is_meta = false) {
    const header = [];
    const directives = { ...this.#directives };
    if (this.#style_src.length > 0) {
      directives["style-src"] = [
        ...directives["style-src"] || directives["default-src"] || [],
        ...this.#style_src
      ];
    }
    if (this.#style_src_attr.length > 0) {
      directives["style-src-attr"] = [
        ...directives["style-src-attr"] || [],
        ...this.#style_src_attr
      ];
    }
    if (this.#style_src_elem.length > 0) {
      directives["style-src-elem"] = [
        ...directives["style-src-elem"] || [],
        ...this.#style_src_elem
      ];
    }
    if (this.#script_src.length > 0) {
      directives["script-src"] = [
        ...directives["script-src"] || directives["default-src"] || [],
        ...this.#script_src
      ];
    }
    if (this.#script_src_elem.length > 0) {
      directives["script-src-elem"] = [
        ...directives["script-src-elem"] || [],
        ...this.#script_src_elem
      ];
    }
    for (const key2 in directives) {
      if (is_meta && (key2 === "frame-ancestors" || key2 === "report-uri" || key2 === "sandbox")) {
        continue;
      }
      const value = (
        /** @type {string[] | true} */
        directives[key2]
      );
      if (!value) continue;
      const directive = [key2];
      if (Array.isArray(value)) {
        value.forEach((value2) => {
          if (quoted.has(value2) || crypto_pattern.test(value2)) {
            directive.push(`'${value2}'`);
          } else {
            directive.push(value2);
          }
        });
      }
      header.push(directive.join(" "));
    }
    return header.join("; ");
  }
};
var CspProvider = class extends BaseProvider {
  static {
    __name(this, "CspProvider");
  }
  get_meta() {
    const content = this.get_header(true);
    if (!content) {
      return;
    }
    return `<meta http-equiv="content-security-policy" content="${escape_html(content, true)}">`;
  }
};
var CspReportOnlyProvider = class extends BaseProvider {
  static {
    __name(this, "CspReportOnlyProvider");
  }
  /**
   * @param {boolean} use_hashes
   * @param {import('types').CspDirectives} directives
   * @param {string} nonce
   */
  constructor(use_hashes, directives, nonce2) {
    super(use_hashes, directives, nonce2);
    if (Object.values(directives).filter((v2) => !!v2).length > 0) {
      const has_report_to = directives["report-to"]?.length ?? 0 > 0;
      const has_report_uri = directives["report-uri"]?.length ?? 0 > 0;
      if (!has_report_to && !has_report_uri) {
        throw Error(
          "`content-security-policy-report-only` must be specified with either the `report-to` or `report-uri` directives, or both"
        );
      }
    }
  }
};
var Csp = class {
  static {
    __name(this, "Csp");
  }
  /** @readonly */
  nonce = generate_nonce();
  /** @type {CspProvider} */
  csp_provider;
  /** @type {CspReportOnlyProvider} */
  report_only_provider;
  /**
   * @param {import('./types.js').CspConfig} config
   * @param {import('./types.js').CspOpts} opts
   */
  constructor({ mode, directives, reportOnly }, { prerender }) {
    const use_hashes = mode === "hash" || mode === "auto" && prerender;
    this.csp_provider = new CspProvider(use_hashes, directives, this.nonce);
    this.report_only_provider = new CspReportOnlyProvider(use_hashes, reportOnly, this.nonce);
  }
  get script_needs_nonce() {
    return this.csp_provider.script_needs_nonce || this.report_only_provider.script_needs_nonce;
  }
  get style_needs_nonce() {
    return this.csp_provider.style_needs_nonce || this.report_only_provider.style_needs_nonce;
  }
  /** @param {string} content */
  add_script(content) {
    this.csp_provider.add_script(content);
    this.report_only_provider.add_script(content);
  }
  /** @param {string} content */
  add_style(content) {
    this.csp_provider.add_style(content);
    this.report_only_provider.add_style(content);
  }
};
function exec(match, params, matchers) {
  const result = {};
  const values = match.slice(1);
  const values_needing_match = values.filter((value) => value !== void 0);
  let buffered = 0;
  for (let i4 = 0; i4 < params.length; i4 += 1) {
    const param = params[i4];
    let value = values[i4 - buffered];
    if (param.chained && param.rest && buffered) {
      value = values.slice(i4 - buffered, i4 + 1).filter((s22) => s22).join("/");
      buffered = 0;
    }
    if (value === void 0) {
      if (param.rest) result[param.name] = "";
      continue;
    }
    if (!param.matcher || matchers[param.matcher](value)) {
      result[param.name] = value;
      const next_param = params[i4 + 1];
      const next_value = values[i4 + 1];
      if (next_param && !next_param.rest && next_param.optional && next_value && param.chained) {
        buffered = 0;
      }
      if (!next_param && !next_value && Object.keys(result).length === values_needing_match.length) {
        buffered = 0;
      }
      continue;
    }
    if (param.optional && param.chained) {
      buffered++;
      continue;
    }
    return;
  }
  if (buffered) return;
  return result;
}
__name(exec, "exec");
function generate_route_object(route, url, manifest2) {
  const { errors, layouts, leaf } = route;
  const nodes = [...errors, ...layouts.map((l3) => l3?.[1]), leaf[1]].filter((n3) => typeof n3 === "number").map((n3) => `'${n3}': () => ${create_client_import(manifest2._.client.nodes?.[n3], url)}`).join(",\n		");
  return [
    `{
	id: ${s3(route.id)}`,
    `errors: ${s3(route.errors)}`,
    `layouts: ${s3(route.layouts)}`,
    `leaf: ${s3(route.leaf)}`,
    `nodes: {
		${nodes}
	}
}`
  ].join(",\n	");
}
__name(generate_route_object, "generate_route_object");
function create_client_import(import_path, url) {
  if (!import_path) return "Promise.resolve({})";
  if (import_path[0] === "/") {
    return `import('${import_path}')`;
  }
  if (assets !== "") {
    return `import('${assets}/${import_path}')`;
  }
  let path = get_relative_path(url.pathname, `${base}/${import_path}`);
  if (path[0] !== ".") path = `./${path}`;
  return `import('${path}')`;
}
__name(create_client_import, "create_client_import");
async function resolve_route(resolved_path, url, manifest2) {
  if (!manifest2._.client.routes) {
    return text("Server-side route resolution disabled", { status: 400 });
  }
  let route = null;
  let params = {};
  const matchers = await manifest2._.matchers();
  for (const candidate of manifest2._.client.routes) {
    const match = candidate.pattern.exec(resolved_path);
    if (!match) continue;
    const matched = exec(match, candidate.params, matchers);
    if (matched) {
      route = candidate;
      params = decode_params(matched);
      break;
    }
  }
  return create_server_routing_response(route, params, url, manifest2).response;
}
__name(resolve_route, "resolve_route");
function create_server_routing_response(route, params, url, manifest2) {
  const headers2 = new Headers({
    "content-type": "application/javascript; charset=utf-8"
  });
  if (route) {
    const csr_route = generate_route_object(route, url, manifest2);
    const body2 = `${create_css_import(route, url, manifest2)}
export const route = ${csr_route}; export const params = ${JSON.stringify(params)};`;
    return { response: text(body2, { headers: headers2 }), body: body2 };
  } else {
    return { response: text("", { headers: headers2 }), body: "" };
  }
}
__name(create_server_routing_response, "create_server_routing_response");
function create_css_import(route, url, manifest2) {
  const { errors, layouts, leaf } = route;
  let css3 = "";
  for (const node of [...errors, ...layouts.map((l3) => l3?.[1]), leaf[1]]) {
    if (typeof node !== "number") continue;
    const node_css = manifest2._.client.css?.[node];
    for (const css_path of node_css ?? []) {
      css3 += `'${assets || base}/${css_path}',`;
    }
  }
  if (!css3) return "";
  return `${create_client_import(
    /** @type {string} */
    manifest2._.client.start,
    url
  )}.then(x => x.load_css([${css3}]));`;
}
__name(create_css_import, "create_css_import");
var updated = {
  ...readable(false),
  check: /* @__PURE__ */ __name(() => false, "check")
};
async function render_response({
  branch,
  fetched,
  options: options2,
  manifest: manifest2,
  state: state2,
  page_config,
  status,
  error: error2 = null,
  event,
  event_state,
  resolve_opts,
  action_result,
  data_serializer
}) {
  if (state2.prerendering) {
    if (options2.csp.mode === "nonce") {
      throw new Error('Cannot use prerendering if config.kit.csp.mode === "nonce"');
    }
    if (options2.app_template_contains_nonce) {
      throw new Error("Cannot use prerendering if page template contains %sveltekit.nonce%");
    }
  }
  const { client } = manifest2._;
  const modulepreloads = new Set(client.imports);
  const stylesheets4 = new Set(client.stylesheets);
  const fonts4 = new Set(client.fonts);
  const link_headers = /* @__PURE__ */ new Set();
  const link_tags = /* @__PURE__ */ new Set();
  const inline_styles = /* @__PURE__ */ new Map();
  let rendered;
  const form_value = action_result?.type === "success" || action_result?.type === "failure" ? action_result.data ?? null : null;
  let base$1 = base;
  let assets$1 = assets;
  let base_expression = s3(base);
  {
    if (!state2.prerendering?.fallback) {
      const segments = event.url.pathname.slice(base.length).split("/").slice(2);
      base$1 = segments.map(() => "..").join("/") || ".";
      base_expression = `new URL(${s3(base$1)}, location).pathname.slice(0, -1)`;
      if (!assets || assets[0] === "/" && assets !== SVELTE_KIT_ASSETS) {
        assets$1 = base$1;
      }
    } else if (options2.hash_routing) {
      base_expression = "new URL('.', location).pathname.slice(0, -1)";
    }
  }
  if (page_config.ssr) {
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        updated
      },
      constructors: await Promise.all(
        branch.map(({ node }) => {
          if (!node.component) {
            throw new Error(`Missing +page.svelte component for route ${event.route.id}`);
          }
          return node.component();
        })
      ),
      form: form_value
    };
    let data2 = {};
    for (let i4 = 0; i4 < branch.length; i4 += 1) {
      data2 = { ...data2, ...branch[i4].data };
      props[`data_${i4}`] = data2;
    }
    props.page = {
      error: error2,
      params: (
        /** @type {Record<string, any>} */
        event.params
      ),
      route: event.route,
      status,
      url: event.url,
      data: data2,
      form: form_value,
      state: {}
    };
    const render_opts = {
      context: /* @__PURE__ */ new Map([
        [
          "__request__",
          {
            page: props.page
          }
        ]
      ])
    };
    const fetch2 = globalThis.fetch;
    try {
      if (BROWSER) ;
      rendered = await with_request_store({ event, state: event_state }, async () => {
        if (relative) override({ base: base$1, assets: assets$1 });
        const maybe_promise = options2.root.render(props, render_opts);
        const rendered2 = options2.async && "then" in maybe_promise ? (
          /** @type {ReturnType<typeof options.root.render> & Promise<any>} */
          maybe_promise.then((r4) => r4)
        ) : maybe_promise;
        if (options2.async) {
          reset();
        }
        const { head: head2, html: html2, css: css3 } = options2.async ? await rendered2 : rendered2;
        return { head: head2, html: html2, css: css3 };
      });
    } finally {
      reset();
    }
    for (const { node } of branch) {
      for (const url of node.imports) modulepreloads.add(url);
      for (const url of node.stylesheets) stylesheets4.add(url);
      for (const url of node.fonts) fonts4.add(url);
      if (node.inline_styles && !client.inline) {
        Object.entries(await node.inline_styles()).forEach(([k3, v2]) => inline_styles.set(k3, v2));
      }
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  let head = "";
  let body2 = rendered.html;
  const csp = new Csp(options2.csp, {
    prerender: !!state2.prerendering
  });
  const prefixed = /* @__PURE__ */ __name((path) => {
    if (path.startsWith("/")) {
      return base + path;
    }
    return `${assets$1}/${path}`;
  }, "prefixed");
  const style = client.inline ? client.inline?.style : Array.from(inline_styles.values()).join("\n");
  if (style) {
    const attributes = [];
    if (csp.style_needs_nonce) attributes.push(` nonce="${csp.nonce}"`);
    csp.add_style(style);
    head += `
	<style${attributes.join("")}>${style}</style>`;
  }
  for (const dep of stylesheets4) {
    const path = prefixed(dep);
    const attributes = ['rel="stylesheet"'];
    if (inline_styles.has(dep)) {
      attributes.push("disabled", 'media="(max-width: 0)"');
    } else {
      if (resolve_opts.preload({ type: "css", path })) {
        link_headers.add(`<${encodeURI(path)}>; rel="preload"; as="style"; nopush`);
      }
    }
    head += `
		<link href="${path}" ${attributes.join(" ")}>`;
  }
  for (const dep of fonts4) {
    const path = prefixed(dep);
    if (resolve_opts.preload({ type: "font", path })) {
      const ext = dep.slice(dep.lastIndexOf(".") + 1);
      link_tags.add(`<link rel="preload" as="font" type="font/${ext}" href="${path}" crossorigin>`);
      link_headers.add(
        `<${encodeURI(path)}>; rel="preload"; as="font"; type="font/${ext}"; crossorigin; nopush`
      );
    }
  }
  const global = get_global_name(options2);
  const { data, chunks } = data_serializer.get_data(csp);
  if (page_config.ssr && page_config.csr) {
    body2 += `
			${fetched.map(
      (item) => serialize_data(item, resolve_opts.filterSerializedResponseHeaders, !!state2.prerendering)
    ).join("\n			")}`;
  }
  if (page_config.csr) {
    const route = manifest2._.client.routes?.find((r4) => r4.id === event.route.id) ?? null;
    if (client.uses_env_dynamic_public && state2.prerendering) {
      modulepreloads.add(`${app_dir}/env.js`);
    }
    if (!client.inline) {
      const included_modulepreloads = Array.from(modulepreloads, (dep) => prefixed(dep)).filter(
        (path) => resolve_opts.preload({ type: "js", path })
      );
      for (const path of included_modulepreloads) {
        link_headers.add(`<${encodeURI(path)}>; rel="modulepreload"; nopush`);
        if (options2.preload_strategy !== "modulepreload") {
          head += `
		<link rel="preload" as="script" crossorigin="anonymous" href="${path}">`;
        } else {
          link_tags.add(`<link rel="modulepreload" href="${path}">`);
        }
      }
    }
    if (state2.prerendering && link_tags.size > 0) {
      head += Array.from(link_tags).map((tag2) => `
		${tag2}`).join("");
    }
    if (manifest2._.client.routes && state2.prerendering && !state2.prerendering.fallback) {
      const pathname = add_resolution_suffix2(event.url.pathname);
      state2.prerendering.dependencies.set(
        pathname,
        create_server_routing_response(route, event.params, new URL(pathname, event.url), manifest2)
      );
    }
    const blocks = [];
    const load_env_eagerly = client.uses_env_dynamic_public && state2.prerendering;
    const properties = [`base: ${base_expression}`];
    if (assets) {
      properties.push(`assets: ${s3(assets)}`);
    }
    if (client.uses_env_dynamic_public) {
      properties.push(`env: ${load_env_eagerly ? "null" : s3(public_env)}`);
    }
    if (chunks) {
      blocks.push("const deferred = new Map();");
      properties.push(`defer: (id) => new Promise((fulfil, reject) => {
							deferred.set(id, { fulfil, reject });
						})`);
      let app_declaration = "";
      if (Object.keys(options2.hooks.transport).length > 0) {
        if (client.inline) {
          app_declaration = `const app = __sveltekit_${options2.version_hash}.app.app;`;
        } else if (client.app) {
          app_declaration = `const app = await import(${s3(prefixed(client.app))});`;
        } else {
          app_declaration = `const { app } = await import(${s3(prefixed(client.start))});`;
        }
      }
      const prelude = app_declaration ? `${app_declaration}
							const [data, error] = fn(app);` : `const [data, error] = fn();`;
      properties.push(`resolve: async (id, fn) => {
							${prelude}

							const try_to_resolve = () => {
								if (!deferred.has(id)) {
									setTimeout(try_to_resolve, 0);
									return;
								}
								const { fulfil, reject } = deferred.get(id);
								deferred.delete(id);
								if (error) reject(error);
								else fulfil(data);
							}
							try_to_resolve();
						}`);
    }
    blocks.push(`${global} = {
						${properties.join(",\n						")}
					};`);
    const args = ["element"];
    blocks.push("const element = document.currentScript.parentElement;");
    if (page_config.ssr) {
      const serialized = { form: "null", error: "null" };
      if (form_value) {
        serialized.form = uneval_action_response(
          form_value,
          /** @type {string} */
          event.route.id,
          options2.hooks.transport
        );
      }
      if (error2) {
        serialized.error = uneval(error2);
      }
      const hydrate = [
        `node_ids: [${branch.map(({ node }) => node.index).join(", ")}]`,
        `data: ${data}`,
        `form: ${serialized.form}`,
        `error: ${serialized.error}`
      ];
      if (status !== 200) {
        hydrate.push(`status: ${status}`);
      }
      if (manifest2._.client.routes) {
        if (route) {
          const stringified = generate_route_object(route, event.url, manifest2).replaceAll(
            "\n",
            "\n							"
          );
          hydrate.push(`params: ${uneval(event.params)}`, `server_route: ${stringified}`);
        }
      } else if (options2.embedded) {
        hydrate.push(`params: ${uneval(event.params)}`, `route: ${s3(event.route)}`);
      }
      const indent = "	".repeat(load_env_eagerly ? 7 : 6);
      args.push(`{
${indent}	${hydrate.join(`,
${indent}	`)}
${indent}}`);
    }
    const { remote_data: remote_cache } = event_state;
    let serialized_remote_data = "";
    if (remote_cache) {
      const remote = {};
      for (const [info, cache] of remote_cache) {
        if (!info.id) continue;
        for (const key2 in cache) {
          remote[create_remote_cache_key(info.id, key2)] = await cache[key2];
        }
      }
      const replacer = /* @__PURE__ */ __name((thing) => {
        for (const key2 in options2.hooks.transport) {
          const encoded = options2.hooks.transport[key2].encode(thing);
          if (encoded) {
            return `app.decode('${key2}', ${uneval(encoded, replacer)})`;
          }
        }
      }, "replacer");
      serialized_remote_data = `${global}.data = ${uneval(remote, replacer)};

						`;
    }
    const boot = client.inline ? `${client.inline.script}

					${serialized_remote_data}${global}.app.start(${args.join(", ")});` : client.app ? `Promise.all([
						import(${s3(prefixed(client.start))}),
						import(${s3(prefixed(client.app))})
					]).then(([kit, app]) => {
						${serialized_remote_data}kit.start(app, ${args.join(", ")});
					});` : `import(${s3(prefixed(client.start))}).then((app) => {
						${serialized_remote_data}app.start(${args.join(", ")})
					});`;
    if (load_env_eagerly) {
      blocks.push(`import(${s3(`${base$1}/${app_dir}/env.js`)}).then(({ env }) => {
						${global}.env = env;

						${boot.replace(/\n/g, "\n	")}
					});`);
    } else {
      blocks.push(boot);
    }
    if (options2.service_worker) {
      let opts = "";
      if (options2.service_worker_options != null) {
        const service_worker_options = { ...options2.service_worker_options };
        opts = `, ${s3(service_worker_options)}`;
      }
      blocks.push(`if ('serviceWorker' in navigator) {
						addEventListener('load', function () {
							navigator.serviceWorker.register('${prefixed("service-worker.js")}'${opts});
						});
					}`);
    }
    const init_app = `
				{
					${blocks.join("\n\n					")}
				}
			`;
    csp.add_script(init_app);
    body2 += `
			<script${csp.script_needs_nonce ? ` nonce="${csp.nonce}"` : ""}>${init_app}<\/script>
		`;
  }
  const headers2 = new Headers({
    "x-sveltekit-page": "true",
    "content-type": "text/html"
  });
  if (state2.prerendering) {
    const http_equiv = [];
    const csp_headers = csp.csp_provider.get_meta();
    if (csp_headers) {
      http_equiv.push(csp_headers);
    }
    if (state2.prerendering.cache) {
      http_equiv.push(`<meta http-equiv="cache-control" content="${state2.prerendering.cache}">`);
    }
    if (http_equiv.length > 0) {
      head = http_equiv.join("\n") + head;
    }
  } else {
    const csp_header = csp.csp_provider.get_header();
    if (csp_header) {
      headers2.set("content-security-policy", csp_header);
    }
    const report_only_header = csp.report_only_provider.get_header();
    if (report_only_header) {
      headers2.set("content-security-policy-report-only", report_only_header);
    }
    if (link_headers.size) {
      headers2.set("link", Array.from(link_headers).join(", "));
    }
  }
  head += rendered.head;
  const html = options2.templates.app({
    head,
    body: body2,
    assets: assets$1,
    nonce: (
      /** @type {string} */
      csp.nonce
    ),
    env: public_env
  });
  const transformed = await resolve_opts.transformPageChunk({
    html,
    done: true
  }) || "";
  if (!chunks) {
    headers2.set("etag", `"${hash(transformed)}"`);
  }
  return !chunks ? text(transformed, {
    status,
    headers: headers2
  }) : new Response(
    new ReadableStream({
      async start(controller) {
        controller.enqueue(text_encoder2.encode(transformed + "\n"));
        for await (const chunk of chunks) {
          if (chunk.length) controller.enqueue(text_encoder2.encode(chunk));
        }
        controller.close();
      },
      type: "bytes"
    }),
    {
      headers: headers2
    }
  );
}
__name(render_response, "render_response");
var PageNodes = class {
  static {
    __name(this, "PageNodes");
  }
  data;
  /**
   * @param {Array<import('types').SSRNode | undefined>} nodes
   */
  constructor(nodes) {
    this.data = nodes;
  }
  layouts() {
    return this.data.slice(0, -1);
  }
  page() {
    return this.data.at(-1);
  }
  validate() {
    for (const layout of this.layouts()) {
      if (layout) {
        validate_layout_server_exports(
          layout.server,
          /** @type {string} */
          layout.server_id
        );
        validate_layout_exports(
          layout.universal,
          /** @type {string} */
          layout.universal_id
        );
      }
    }
    const page2 = this.page();
    if (page2) {
      validate_page_server_exports(
        page2.server,
        /** @type {string} */
        page2.server_id
      );
      validate_page_exports(
        page2.universal,
        /** @type {string} */
        page2.universal_id
      );
    }
  }
  /**
   * @template {'prerender' | 'ssr' | 'csr' | 'trailingSlash'} Option
   * @param {Option} option
   * @returns {Value | undefined}
   */
  #get_option(option) {
    return this.data.reduce(
      (value, node) => {
        return node?.universal?.[option] ?? node?.server?.[option] ?? value;
      },
      /** @type {Value | undefined} */
      void 0
    );
  }
  csr() {
    return this.#get_option("csr") ?? true;
  }
  ssr() {
    return this.#get_option("ssr") ?? true;
  }
  prerender() {
    return this.#get_option("prerender") ?? false;
  }
  trailing_slash() {
    return this.#get_option("trailingSlash") ?? "never";
  }
  get_config() {
    let current2 = {};
    for (const node of this.data) {
      if (!node?.universal?.config && !node?.server?.config) continue;
      current2 = {
        ...current2,
        // TODO: should we override the server config value with the universal value similar to other page options?
        ...node?.universal?.config,
        ...node?.server?.config
      };
    }
    return Object.keys(current2).length ? current2 : void 0;
  }
  should_prerender_data() {
    return this.data.some(
      // prerender in case of trailingSlash because the client retrieves that value from the server
      (node) => node?.server?.load || node?.server?.trailingSlash !== void 0
    );
  }
};
async function respond_with_error({
  event,
  event_state,
  options: options2,
  manifest: manifest2,
  state: state2,
  status,
  error: error2,
  resolve_opts
}) {
  if (event.request.headers.get("x-sveltekit-error")) {
    return static_error_page(
      options2,
      status,
      /** @type {Error} */
      error2.message
    );
  }
  const fetched = [];
  try {
    const branch = [];
    const default_layout = await manifest2._.nodes[0]();
    const nodes = new PageNodes([default_layout]);
    const ssr = nodes.ssr();
    const csr = nodes.csr();
    const data_serializer = server_data_serializer(event, event_state, options2);
    if (ssr) {
      state2.error = true;
      const server_data_promise = load_server_data({
        event,
        event_state,
        state: state2,
        node: default_layout,
        // eslint-disable-next-line @typescript-eslint/require-await
        parent: /* @__PURE__ */ __name(async () => ({}), "parent")
      });
      const server_data = await server_data_promise;
      data_serializer.add_node(0, server_data);
      const data = await load_data({
        event,
        event_state,
        fetched,
        node: default_layout,
        // eslint-disable-next-line @typescript-eslint/require-await
        parent: /* @__PURE__ */ __name(async () => ({}), "parent"),
        resolve_opts,
        server_data_promise,
        state: state2,
        csr
      });
      branch.push(
        {
          node: default_layout,
          server_data,
          data
        },
        {
          node: await manifest2._.nodes[1](),
          // 1 is always the root error
          data: null,
          server_data: null
        }
      );
    }
    return await render_response({
      options: options2,
      manifest: manifest2,
      state: state2,
      page_config: {
        ssr,
        csr
      },
      status,
      error: await handle_error_and_jsonify(event, event_state, options2, error2),
      branch,
      fetched,
      event,
      event_state,
      resolve_opts,
      data_serializer
    });
  } catch (e3) {
    if (e3 instanceof Redirect) {
      return redirect_response(e3.status, e3.location);
    }
    return static_error_page(
      options2,
      get_status(e3),
      (await handle_error_and_jsonify(event, event_state, options2, e3)).message
    );
  }
}
__name(respond_with_error, "respond_with_error");
async function handle_remote_call(event, state2, options2, manifest2, id) {
  return record_span({
    name: "sveltekit.remote.call",
    attributes: {},
    fn: /* @__PURE__ */ __name((current2) => {
      const traced_event = merge_tracing(event, current2);
      return with_request_store(
        { event: traced_event, state: state2 },
        () => handle_remote_call_internal(traced_event, state2, options2, manifest2, id)
      );
    }, "fn")
  });
}
__name(handle_remote_call, "handle_remote_call");
async function handle_remote_call_internal(event, state2, options2, manifest2, id) {
  const [hash2, name, additional_args] = id.split("/");
  const remotes = manifest2._.remotes;
  if (!remotes[hash2]) error(404);
  const module = await remotes[hash2]();
  const fn = module.default[name];
  if (!fn) error(404);
  const info = fn.__;
  const transport = options2.hooks.transport;
  event.tracing.current.setAttributes({
    "sveltekit.remote.call.type": info.type,
    "sveltekit.remote.call.name": info.name
  });
  let form_client_refreshes;
  try {
    if (info.type === "query_batch") {
      if (event.request.method !== "POST") {
        throw new SvelteKitError(
          405,
          "Method Not Allowed",
          `\`query.batch\` functions must be invoked via POST request, not ${event.request.method}`
        );
      }
      const { payloads } = await event.request.json();
      const args = payloads.map((payload2) => parse_remote_arg(payload2, transport));
      const get_result = await with_request_store({ event, state: state2 }, () => info.run(args));
      const results = await Promise.all(
        args.map(async (arg, i4) => {
          try {
            return { type: "result", data: get_result(arg, i4) };
          } catch (error2) {
            return {
              type: "error",
              error: await handle_error_and_jsonify(event, state2, options2, error2),
              status: error2 instanceof HttpError || error2 instanceof SvelteKitError ? error2.status : 500
            };
          }
        })
      );
      return json(
        /** @type {RemoteFunctionResponse} */
        {
          type: "result",
          result: stringify2(results, transport)
        }
      );
    }
    if (info.type === "form") {
      if (event.request.method !== "POST") {
        throw new SvelteKitError(
          405,
          "Method Not Allowed",
          `\`form\` functions must be invoked via POST request, not ${event.request.method}`
        );
      }
      if (!is_form_content_type(event.request)) {
        throw new SvelteKitError(
          415,
          "Unsupported Media Type",
          `\`form\` functions expect form-encoded data \u2014 received ${event.request.headers.get(
            "content-type"
          )}`
        );
      }
      const form_data = await event.request.formData();
      form_client_refreshes = /** @type {string[]} */
      JSON.parse(
        /** @type {string} */
        form_data.get("sveltekit:remote_refreshes") ?? "[]"
      );
      form_data.delete("sveltekit:remote_refreshes");
      if (additional_args) {
        form_data.set("sveltekit:id", decodeURIComponent(additional_args));
      }
      const fn2 = info.fn;
      const data2 = await with_request_store({ event, state: state2 }, () => fn2(form_data));
      return json(
        /** @type {RemoteFunctionResponse} */
        {
          type: "result",
          result: stringify2(data2, transport),
          refreshes: data2.issues ? {} : await serialize_refreshes(form_client_refreshes)
        }
      );
    }
    if (info.type === "command") {
      const { payload: payload2, refreshes } = await event.request.json();
      const arg = parse_remote_arg(payload2, transport);
      const data2 = await with_request_store({ event, state: state2 }, () => fn(arg));
      return json(
        /** @type {RemoteFunctionResponse} */
        {
          type: "result",
          result: stringify2(data2, transport),
          refreshes: await serialize_refreshes(refreshes)
        }
      );
    }
    const payload = info.type === "prerender" ? additional_args : (
      /** @type {string} */
      // new URL(...) necessary because we're hiding the URL from the user in the event object
      new URL(event.request.url).searchParams.get("payload")
    );
    const data = await with_request_store(
      { event, state: state2 },
      () => fn(parse_remote_arg(payload, transport))
    );
    return json(
      /** @type {RemoteFunctionResponse} */
      {
        type: "result",
        result: stringify2(data, transport)
      }
    );
  } catch (error2) {
    if (error2 instanceof Redirect) {
      return json(
        /** @type {RemoteFunctionResponse} */
        {
          type: "redirect",
          location: error2.location,
          refreshes: await serialize_refreshes(form_client_refreshes ?? [])
        }
      );
    }
    const status = error2 instanceof HttpError || error2 instanceof SvelteKitError ? error2.status : 500;
    return json(
      /** @type {RemoteFunctionResponse} */
      {
        type: "error",
        error: await handle_error_and_jsonify(event, state2, options2, error2),
        status
      },
      {
        // By setting a non-200 during prerendering we fail the prerender process (unless handleHttpError handles it).
        // Errors at runtime will be passed to the client and are handled there
        status: state2.prerendering ? status : void 0,
        headers: {
          "cache-control": "private, no-store"
        }
      }
    );
  }
  async function serialize_refreshes(client_refreshes) {
    const refreshes = state2.refreshes ?? {};
    for (const key2 of client_refreshes) {
      if (refreshes[key2] !== void 0) continue;
      const [hash3, name2, payload] = key2.split("/");
      const loader = manifest2._.remotes[hash3];
      const fn2 = (await loader?.())?.default?.[name2];
      if (!fn2) error(400, "Bad Request");
      refreshes[key2] = with_request_store(
        { event, state: state2 },
        () => fn2(parse_remote_arg(payload, transport))
      );
    }
    if (Object.keys(refreshes).length === 0) {
      return void 0;
    }
    return stringify2(
      Object.fromEntries(
        await Promise.all(
          Object.entries(refreshes).map(async ([key2, promise]) => [key2, await promise])
        )
      ),
      transport
    );
  }
  __name(serialize_refreshes, "serialize_refreshes");
}
__name(handle_remote_call_internal, "handle_remote_call_internal");
async function handle_remote_form_post(event, state2, manifest2, id) {
  return record_span({
    name: "sveltekit.remote.form.post",
    attributes: {},
    fn: /* @__PURE__ */ __name((current2) => {
      const traced_event = merge_tracing(event, current2);
      return with_request_store(
        { event: traced_event, state: state2 },
        () => handle_remote_form_post_internal(traced_event, state2, manifest2, id)
      );
    }, "fn")
  });
}
__name(handle_remote_form_post, "handle_remote_form_post");
async function handle_remote_form_post_internal(event, state2, manifest2, id) {
  const [hash2, name, action_id] = id.split("/");
  const remotes = manifest2._.remotes;
  const module = await remotes[hash2]?.();
  let form = (
    /** @type {RemoteForm<any, any>} */
    module?.default[name]
  );
  if (!form) {
    event.setHeaders({
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
      // "The server must generate an Allow header field in a 405 status code response"
      allow: "GET"
    });
    return {
      type: "error",
      error: new SvelteKitError(
        405,
        "Method Not Allowed",
        `POST method not allowed. No form actions exist for ${"this page"}`
      )
    };
  }
  if (action_id) {
    form = with_request_store({ event, state: state2 }, () => form.for(JSON.parse(action_id)));
  }
  try {
    const form_data = await event.request.formData();
    const fn = (
      /** @type {RemoteInfo & { type: 'form' }} */
      /** @type {any} */
      form.__.fn
    );
    if (action_id && !form_data.has("id")) {
      form_data.set("sveltekit:id", decodeURIComponent(action_id));
    }
    await with_request_store({ event, state: state2 }, () => fn(form_data));
    return {
      type: "success",
      status: 200
    };
  } catch (e3) {
    const err = normalize_error(e3);
    if (err instanceof Redirect) {
      return {
        type: "redirect",
        status: err.status,
        location: err.location
      };
    }
    return {
      type: "error",
      error: check_incorrect_fail_use(err)
    };
  }
}
__name(handle_remote_form_post_internal, "handle_remote_form_post_internal");
function get_remote_id(url) {
  return url.pathname.startsWith(`${base}/${app_dir}/remote/`) && url.pathname.replace(`${base}/${app_dir}/remote/`, "");
}
__name(get_remote_id, "get_remote_id");
function get_remote_action(url) {
  return url.searchParams.get("/remote");
}
__name(get_remote_action, "get_remote_action");
var MAX_DEPTH = 10;
async function render_page(event, event_state, page2, options2, manifest2, state2, nodes, resolve_opts) {
  if (state2.depth > MAX_DEPTH) {
    return text(`Not found: ${event.url.pathname}`, {
      status: 404
      // TODO in some cases this should be 500. not sure how to differentiate
    });
  }
  if (is_action_json_request(event)) {
    const node = await manifest2._.nodes[page2.leaf]();
    return handle_action_json_request(event, event_state, options2, node?.server);
  }
  try {
    const leaf_node = (
      /** @type {import('types').SSRNode} */
      nodes.page()
    );
    let status = 200;
    let action_result = void 0;
    if (is_action_request(event)) {
      const remote_id = get_remote_action(event.url);
      if (remote_id) {
        action_result = await handle_remote_form_post(event, event_state, manifest2, remote_id);
      } else {
        action_result = await handle_action_request(event, event_state, leaf_node.server);
      }
      if (action_result?.type === "redirect") {
        return redirect_response(action_result.status, action_result.location);
      }
      if (action_result?.type === "error") {
        status = get_status(action_result.error);
      }
      if (action_result?.type === "failure") {
        status = action_result.status;
      }
    }
    const should_prerender = nodes.prerender();
    if (should_prerender) {
      const mod = leaf_node.server;
      if (mod?.actions) {
        throw new Error("Cannot prerender pages with actions");
      }
    } else if (state2.prerendering) {
      return new Response(void 0, {
        status: 204
      });
    }
    state2.prerender_default = should_prerender;
    const should_prerender_data = nodes.should_prerender_data();
    const data_pathname = add_data_suffix2(event.url.pathname);
    const fetched = [];
    const ssr = nodes.ssr();
    const csr = nodes.csr();
    if (ssr === false && !(state2.prerendering && should_prerender_data)) {
      if (BROWSER && action_result && !event.request.headers.has("x-sveltekit-action")) ;
      return await render_response({
        branch: [],
        fetched,
        page_config: {
          ssr: false,
          csr
        },
        status,
        error: null,
        event,
        event_state,
        options: options2,
        manifest: manifest2,
        state: state2,
        resolve_opts,
        data_serializer: server_data_serializer(event, event_state, options2)
      });
    }
    const branch = [];
    let load_error = null;
    const data_serializer = server_data_serializer(event, event_state, options2);
    const data_serializer_json = state2.prerendering && should_prerender_data ? server_data_serializer_json(event, event_state, options2) : null;
    const server_promises = nodes.data.map((node, i4) => {
      if (load_error) {
        throw load_error;
      }
      return Promise.resolve().then(async () => {
        try {
          if (node === leaf_node && action_result?.type === "error") {
            throw action_result.error;
          }
          const server_data = await load_server_data({
            event,
            event_state,
            state: state2,
            node,
            parent: /* @__PURE__ */ __name(async () => {
              const data = {};
              for (let j3 = 0; j3 < i4; j3 += 1) {
                const parent = await server_promises[j3];
                if (parent) Object.assign(data, parent.data);
              }
              return data;
            }, "parent")
          });
          if (node) {
            data_serializer.add_node(i4, server_data);
          }
          data_serializer_json?.add_node(i4, server_data);
          return server_data;
        } catch (e3) {
          load_error = /** @type {Error} */
          e3;
          throw load_error;
        }
      });
    });
    const load_promises = nodes.data.map((node, i4) => {
      if (load_error) throw load_error;
      return Promise.resolve().then(async () => {
        try {
          return await load_data({
            event,
            event_state,
            fetched,
            node,
            parent: /* @__PURE__ */ __name(async () => {
              const data = {};
              for (let j3 = 0; j3 < i4; j3 += 1) {
                Object.assign(data, await load_promises[j3]);
              }
              return data;
            }, "parent"),
            resolve_opts,
            server_data_promise: server_promises[i4],
            state: state2,
            csr
          });
        } catch (e3) {
          load_error = /** @type {Error} */
          e3;
          throw load_error;
        }
      });
    });
    for (const p3 of server_promises) p3.catch(() => {
    });
    for (const p3 of load_promises) p3.catch(() => {
    });
    for (let i4 = 0; i4 < nodes.data.length; i4 += 1) {
      const node = nodes.data[i4];
      if (node) {
        try {
          const server_data = await server_promises[i4];
          const data = await load_promises[i4];
          branch.push({ node, server_data, data });
        } catch (e3) {
          const err = normalize_error(e3);
          if (err instanceof Redirect) {
            if (state2.prerendering && should_prerender_data) {
              const body2 = JSON.stringify({
                type: "redirect",
                location: err.location
              });
              state2.prerendering.dependencies.set(data_pathname, {
                response: text(body2),
                body: body2
              });
            }
            return redirect_response(err.status, err.location);
          }
          const status2 = get_status(err);
          const error2 = await handle_error_and_jsonify(event, event_state, options2, err);
          while (i4--) {
            if (page2.errors[i4]) {
              const index4 = (
                /** @type {number} */
                page2.errors[i4]
              );
              const node2 = await manifest2._.nodes[index4]();
              let j3 = i4;
              while (!branch[j3]) j3 -= 1;
              data_serializer.set_max_nodes(j3 + 1);
              const layouts = compact(branch.slice(0, j3 + 1));
              const nodes2 = new PageNodes(layouts.map((layout) => layout.node));
              return await render_response({
                event,
                event_state,
                options: options2,
                manifest: manifest2,
                state: state2,
                resolve_opts,
                page_config: {
                  ssr: nodes2.ssr(),
                  csr: nodes2.csr()
                },
                status: status2,
                error: error2,
                branch: layouts.concat({
                  node: node2,
                  data: null,
                  server_data: null
                }),
                fetched,
                data_serializer
              });
            }
          }
          return static_error_page(options2, status2, error2.message);
        }
      } else {
        branch.push(null);
      }
    }
    if (state2.prerendering && data_serializer_json) {
      let { data, chunks } = data_serializer_json.get_data();
      if (chunks) {
        for await (const chunk of chunks) {
          data += chunk;
        }
      }
      state2.prerendering.dependencies.set(data_pathname, {
        response: text(data),
        body: data
      });
    }
    return await render_response({
      event,
      event_state,
      options: options2,
      manifest: manifest2,
      state: state2,
      resolve_opts,
      page_config: {
        csr,
        ssr
      },
      status,
      error: null,
      branch: ssr === false ? [] : compact(branch),
      action_result,
      fetched,
      data_serializer: ssr === false ? server_data_serializer(event, event_state, options2) : data_serializer
    });
  } catch (e3) {
    return await respond_with_error({
      event,
      event_state,
      options: options2,
      manifest: manifest2,
      state: state2,
      status: 500,
      error: e3,
      resolve_opts
    });
  }
}
__name(render_page, "render_page");
function once(fn) {
  let done = false;
  let result;
  return () => {
    if (done) return result;
    done = true;
    return result = fn();
  };
}
__name(once, "once");
async function render_data(event, event_state, route, options2, manifest2, state2, invalidated_data_nodes, trailing_slash) {
  if (!route.page) {
    return new Response(void 0, {
      status: 404
    });
  }
  try {
    const node_ids = [...route.page.layouts, route.page.leaf];
    const invalidated = invalidated_data_nodes ?? node_ids.map(() => true);
    let aborted = false;
    const url = new URL(event.url);
    url.pathname = normalize_path(url.pathname, trailing_slash);
    const new_event = { ...event, url };
    const functions = node_ids.map((n3, i4) => {
      return once(async () => {
        try {
          if (aborted) {
            return (
              /** @type {import('types').ServerDataSkippedNode} */
              {
                type: "skip"
              }
            );
          }
          const node = n3 == void 0 ? n3 : await manifest2._.nodes[n3]();
          return load_server_data({
            event: new_event,
            event_state,
            state: state2,
            node,
            parent: /* @__PURE__ */ __name(async () => {
              const data2 = {};
              for (let j3 = 0; j3 < i4; j3 += 1) {
                const parent = (
                  /** @type {import('types').ServerDataNode | null} */
                  await functions[j3]()
                );
                if (parent) {
                  Object.assign(data2, parent.data);
                }
              }
              return data2;
            }, "parent")
          });
        } catch (e3) {
          aborted = true;
          throw e3;
        }
      });
    });
    const promises = functions.map(async (fn, i4) => {
      if (!invalidated[i4]) {
        return (
          /** @type {import('types').ServerDataSkippedNode} */
          {
            type: "skip"
          }
        );
      }
      return fn();
    });
    let length = promises.length;
    const nodes = await Promise.all(
      promises.map(
        (p3, i4) => p3.catch(async (error2) => {
          if (error2 instanceof Redirect) {
            throw error2;
          }
          length = Math.min(length, i4 + 1);
          return (
            /** @type {import('types').ServerErrorNode} */
            {
              type: "error",
              error: await handle_error_and_jsonify(event, event_state, options2, error2),
              status: error2 instanceof HttpError || error2 instanceof SvelteKitError ? error2.status : void 0
            }
          );
        })
      )
    );
    const data_serializer = server_data_serializer_json(event, event_state, options2);
    for (let i4 = 0; i4 < nodes.length; i4++) data_serializer.add_node(i4, nodes[i4]);
    const { data, chunks } = data_serializer.get_data();
    if (!chunks) {
      return json_response(data);
    }
    return new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(text_encoder2.encode(data));
          for await (const chunk of chunks) {
            controller.enqueue(text_encoder2.encode(chunk));
          }
          controller.close();
        },
        type: "bytes"
      }),
      {
        headers: {
          // we use a proprietary content type to prevent buffering.
          // the `text` prefix makes it inspectable
          "content-type": "text/sveltekit-data",
          "cache-control": "private, no-store"
        }
      }
    );
  } catch (e3) {
    const error2 = normalize_error(e3);
    if (error2 instanceof Redirect) {
      return redirect_json_response(error2);
    } else {
      return json_response(await handle_error_and_jsonify(event, event_state, options2, error2), 500);
    }
  }
}
__name(render_data, "render_data");
function json_response(json2, status = 200) {
  return text(typeof json2 === "string" ? json2 : JSON.stringify(json2), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "private, no-store"
    }
  });
}
__name(json_response, "json_response");
function redirect_json_response(redirect2) {
  return json_response(
    /** @type {import('types').ServerRedirectNode} */
    {
      type: "redirect",
      location: redirect2.location
    }
  );
}
__name(redirect_json_response, "redirect_json_response");
var INVALID_COOKIE_CHARACTER_REGEX = /[\x00-\x1F\x7F()<>@,;:"/[\]?={} \t]/;
function validate_options(options2) {
  if (options2?.path === void 0) {
    throw new Error("You must specify a `path` when setting, deleting or serializing cookies");
  }
}
__name(validate_options, "validate_options");
function generate_cookie_key(domain, path, name) {
  return `${domain || ""}${path}?${encodeURIComponent(name)}`;
}
__name(generate_cookie_key, "generate_cookie_key");
function get_cookies(request, url) {
  const header = request.headers.get("cookie") ?? "";
  const initial_cookies = (0, import_cookie4.parse)(header, { decode: /* @__PURE__ */ __name((value) => value, "decode") });
  let normalized_url;
  const new_cookies = /* @__PURE__ */ new Map();
  const defaults = {
    httpOnly: true,
    sameSite: "lax",
    secure: url.hostname === "localhost" && url.protocol === "http:" ? false : true
  };
  const cookies = {
    // The JSDoc param annotations appearing below for get, set and delete
    // are necessary to expose the `cookie` library types to
    // typescript users. `@type {import('@sveltejs/kit').Cookies}` above is not
    // sufficient to do so.
    /**
     * @param {string} name
     * @param {import('cookie').CookieParseOptions} [opts]
     */
    get(name, opts) {
      const best_match = Array.from(new_cookies.values()).filter((c4) => {
        return c4.name === name && domain_matches(url.hostname, c4.options.domain) && path_matches(url.pathname, c4.options.path);
      }).sort((a3, b2) => b2.options.path.length - a3.options.path.length)[0];
      if (best_match) {
        return best_match.options.maxAge === 0 ? void 0 : best_match.value;
      }
      const req_cookies = (0, import_cookie4.parse)(header, { decode: opts?.decode });
      const cookie = req_cookies[name];
      return cookie;
    },
    /**
     * @param {import('cookie').CookieParseOptions} [opts]
     */
    getAll(opts) {
      const cookies2 = (0, import_cookie4.parse)(header, { decode: opts?.decode });
      const lookup = /* @__PURE__ */ new Map();
      for (const c4 of new_cookies.values()) {
        if (domain_matches(url.hostname, c4.options.domain) && path_matches(url.pathname, c4.options.path)) {
          const existing = lookup.get(c4.name);
          if (!existing || c4.options.path.length > existing.options.path.length) {
            lookup.set(c4.name, c4);
          }
        }
      }
      for (const c4 of lookup.values()) {
        cookies2[c4.name] = c4.value;
      }
      return Object.entries(cookies2).map(([name, value]) => ({ name, value }));
    },
    /**
     * @param {string} name
     * @param {string} value
     * @param {import('./page/types.js').Cookie['options']} options
     */
    set(name, value, options2) {
      const illegal_characters = name.match(INVALID_COOKIE_CHARACTER_REGEX);
      if (illegal_characters) {
        console.warn(
          `The cookie name "${name}" will be invalid in SvelteKit 3.0 as it contains ${illegal_characters.join(
            " and "
          )}. See RFC 2616 for more details https://datatracker.ietf.org/doc/html/rfc2616#section-2.2`
        );
      }
      validate_options(options2);
      set_internal(name, value, { ...defaults, ...options2 });
    },
    /**
     * @param {string} name
     *  @param {import('./page/types.js').Cookie['options']} options
     */
    delete(name, options2) {
      validate_options(options2);
      cookies.set(name, "", { ...options2, maxAge: 0 });
    },
    /**
     * @param {string} name
     * @param {string} value
     *  @param {import('./page/types.js').Cookie['options']} options
     */
    serialize(name, value, options2) {
      validate_options(options2);
      let path = options2.path;
      if (!options2.domain || options2.domain === url.hostname) {
        if (!normalized_url) {
          throw new Error("Cannot serialize cookies until after the route is determined");
        }
        path = resolve(normalized_url, path);
      }
      return (0, import_cookie4.serialize)(name, value, { ...defaults, ...options2, path });
    }
  };
  function get_cookie_header(destination, header2) {
    const combined_cookies = {
      // cookies sent by the user agent have lowest precedence
      ...initial_cookies
    };
    for (const cookie of new_cookies.values()) {
      if (!domain_matches(destination.hostname, cookie.options.domain)) continue;
      if (!path_matches(destination.pathname, cookie.options.path)) continue;
      const encoder3 = cookie.options.encode || encodeURIComponent;
      combined_cookies[cookie.name] = encoder3(cookie.value);
    }
    if (header2) {
      const parsed = (0, import_cookie4.parse)(header2, { decode: /* @__PURE__ */ __name((value) => value, "decode") });
      for (const name in parsed) {
        combined_cookies[name] = parsed[name];
      }
    }
    return Object.entries(combined_cookies).map(([name, value]) => `${name}=${value}`).join("; ");
  }
  __name(get_cookie_header, "get_cookie_header");
  const internal_queue = [];
  function set_internal(name, value, options2) {
    if (!normalized_url) {
      internal_queue.push(() => set_internal(name, value, options2));
      return;
    }
    let path = options2.path;
    if (!options2.domain || options2.domain === url.hostname) {
      path = resolve(normalized_url, path);
    }
    const cookie_key = generate_cookie_key(options2.domain, path, name);
    const cookie = { name, value, options: { ...options2, path } };
    new_cookies.set(cookie_key, cookie);
  }
  __name(set_internal, "set_internal");
  function set_trailing_slash(trailing_slash) {
    normalized_url = normalize_path(url.pathname, trailing_slash);
    internal_queue.forEach((fn) => fn());
  }
  __name(set_trailing_slash, "set_trailing_slash");
  return { cookies, new_cookies, get_cookie_header, set_internal, set_trailing_slash };
}
__name(get_cookies, "get_cookies");
function domain_matches(hostname, constraint) {
  if (!constraint) return true;
  const normalized = constraint[0] === "." ? constraint.slice(1) : constraint;
  if (hostname === normalized) return true;
  return hostname.endsWith("." + normalized);
}
__name(domain_matches, "domain_matches");
function path_matches(path, constraint) {
  if (!constraint) return true;
  const normalized = constraint.endsWith("/") ? constraint.slice(0, -1) : constraint;
  if (path === normalized) return true;
  return path.startsWith(normalized + "/");
}
__name(path_matches, "path_matches");
function add_cookies_to_headers(headers2, cookies) {
  for (const new_cookie of cookies) {
    const { name, value, options: options2 } = new_cookie;
    headers2.append("set-cookie", (0, import_cookie4.serialize)(name, value, options2));
    if (options2.path.endsWith(".html")) {
      const path = add_data_suffix2(options2.path);
      headers2.append("set-cookie", (0, import_cookie4.serialize)(name, value, { ...options2, path }));
    }
  }
}
__name(add_cookies_to_headers, "add_cookies_to_headers");
function create_fetch({ event, options: options2, manifest: manifest2, state: state2, get_cookie_header, set_internal }) {
  const server_fetch = /* @__PURE__ */ __name(async (info, init22) => {
    const original_request = normalize_fetch_input(info, init22, event.url);
    let mode = (info instanceof Request ? info.mode : init22?.mode) ?? "cors";
    let credentials = (info instanceof Request ? info.credentials : init22?.credentials) ?? "same-origin";
    return options2.hooks.handleFetch({
      event,
      request: original_request,
      fetch: /* @__PURE__ */ __name(async (info2, init3) => {
        const request = normalize_fetch_input(info2, init3, event.url);
        const url = new URL(request.url);
        if (!request.headers.has("origin")) {
          request.headers.set("origin", event.url.origin);
        }
        if (info2 !== original_request) {
          mode = (info2 instanceof Request ? info2.mode : init3?.mode) ?? "cors";
          credentials = (info2 instanceof Request ? info2.credentials : init3?.credentials) ?? "same-origin";
        }
        if ((request.method === "GET" || request.method === "HEAD") && (mode === "no-cors" && url.origin !== event.url.origin || url.origin === event.url.origin)) {
          request.headers.delete("origin");
        }
        if (url.origin !== event.url.origin) {
          if (`.${url.hostname}`.endsWith(`.${event.url.hostname}`) && credentials !== "omit") {
            const cookie = get_cookie_header(url, request.headers.get("cookie"));
            if (cookie) request.headers.set("cookie", cookie);
          }
          return fetch(request);
        }
        const prefix = assets || base;
        const decoded = decodeURIComponent(url.pathname);
        const filename = (decoded.startsWith(prefix) ? decoded.slice(prefix.length) : decoded).slice(1);
        const filename_html = `${filename}/index.html`;
        const is_asset = manifest2.assets.has(filename) || filename in manifest2._.server_assets;
        const is_asset_html = manifest2.assets.has(filename_html) || filename_html in manifest2._.server_assets;
        if (is_asset || is_asset_html) {
          const file = is_asset ? filename : filename_html;
          if (state2.read) {
            const type = is_asset ? manifest2.mimeTypes[filename.slice(filename.lastIndexOf("."))] : "text/html";
            return new Response(state2.read(file), {
              headers: type ? { "content-type": type } : {}
            });
          } else if (read_implementation && file in manifest2._.server_assets) {
            const length = manifest2._.server_assets[file];
            const type = manifest2.mimeTypes[file.slice(file.lastIndexOf("."))];
            return new Response(read_implementation(file), {
              headers: {
                "Content-Length": "" + length,
                "Content-Type": type
              }
            });
          }
          return await fetch(request);
        }
        if (has_prerendered_path(manifest2, base + decoded)) {
          return await fetch(request);
        }
        if (credentials !== "omit") {
          const cookie = get_cookie_header(url, request.headers.get("cookie"));
          if (cookie) {
            request.headers.set("cookie", cookie);
          }
          const authorization = event.request.headers.get("authorization");
          if (authorization && !request.headers.has("authorization")) {
            request.headers.set("authorization", authorization);
          }
        }
        if (!request.headers.has("accept")) {
          request.headers.set("accept", "*/*");
        }
        if (!request.headers.has("accept-language")) {
          request.headers.set(
            "accept-language",
            /** @type {string} */
            event.request.headers.get("accept-language")
          );
        }
        const response = await internal_fetch(request, options2, manifest2, state2);
        const set_cookie = response.headers.get("set-cookie");
        if (set_cookie) {
          for (const str of set_cookie_parser.splitCookiesString(set_cookie)) {
            const { name, value, ...options3 } = set_cookie_parser.parseString(str, {
              decodeValues: false
            });
            const path = options3.path ?? (url.pathname.split("/").slice(0, -1).join("/") || "/");
            set_internal(name, value, {
              path,
              encode: /* @__PURE__ */ __name((value2) => value2, "encode"),
              .../** @type {import('cookie').CookieSerializeOptions} */
              options3
            });
          }
        }
        return response;
      }, "fetch")
    });
  }, "server_fetch");
  return (input, init22) => {
    const response = server_fetch(input, init22);
    response.catch(() => {
    });
    return response;
  };
}
__name(create_fetch, "create_fetch");
function normalize_fetch_input(info, init22, url) {
  if (info instanceof Request) {
    return info;
  }
  return new Request(typeof info === "string" ? new URL(info, url) : info, init22);
}
__name(normalize_fetch_input, "normalize_fetch_input");
async function internal_fetch(request, options2, manifest2, state2) {
  if (request.signal) {
    if (request.signal.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }
    let remove_abort_listener = /* @__PURE__ */ __name(() => {
    }, "remove_abort_listener");
    const abort_promise = new Promise((_3, reject) => {
      const on_abort = /* @__PURE__ */ __name(() => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      }, "on_abort");
      request.signal.addEventListener("abort", on_abort, { once: true });
      remove_abort_listener = /* @__PURE__ */ __name(() => request.signal.removeEventListener("abort", on_abort), "remove_abort_listener");
    });
    const result = await Promise.race([
      respond(request, options2, manifest2, {
        ...state2,
        depth: state2.depth + 1
      }),
      abort_promise
    ]);
    remove_abort_listener();
    return result;
  } else {
    return await respond(request, options2, manifest2, {
      ...state2,
      depth: state2.depth + 1
    });
  }
}
__name(internal_fetch, "internal_fetch");
var body;
var etag;
var headers;
function get_public_env(request) {
  body ??= `export const env=${JSON.stringify(public_env)}`;
  etag ??= `W/${Date.now()}`;
  headers ??= new Headers({
    "content-type": "application/javascript; charset=utf-8",
    etag
  });
  if (request.headers.get("if-none-match") === etag) {
    return new Response(void 0, { status: 304, headers });
  }
  return new Response(body, { headers });
}
__name(get_public_env, "get_public_env");
var default_transform = /* @__PURE__ */ __name(({ html }) => html, "default_transform");
var default_filter = /* @__PURE__ */ __name(() => false, "default_filter");
var default_preload = /* @__PURE__ */ __name(({ type }) => type === "js" || type === "css", "default_preload");
var page_methods = /* @__PURE__ */ new Set(["GET", "HEAD", "POST"]);
var allowed_page_methods = /* @__PURE__ */ new Set(["GET", "HEAD", "OPTIONS"]);
var respond = propagate_context(internal_respond);
async function internal_respond(request, options2, manifest2, state2) {
  const url = new URL(request.url);
  const is_route_resolution_request = has_resolution_suffix2(url.pathname);
  const is_data_request = has_data_suffix2(url.pathname);
  const remote_id = get_remote_id(url);
  {
    const request_origin = request.headers.get("origin");
    if (remote_id) {
      if (request.method !== "GET" && request_origin !== url.origin) {
        const message2 = "Cross-site remote requests are forbidden";
        return json({ message: message2 }, { status: 403 });
      }
    } else if (options2.csrf_check_origin) {
      const forbidden = is_form_content_type(request) && (request.method === "POST" || request.method === "PUT" || request.method === "PATCH" || request.method === "DELETE") && request_origin !== url.origin && (!request_origin || !options2.csrf_trusted_origins.includes(request_origin));
      if (forbidden) {
        const message2 = `Cross-site ${request.method} form submissions are forbidden`;
        const opts = { status: 403 };
        if (request.headers.get("accept") === "application/json") {
          return json({ message: message2 }, opts);
        }
        return text(message2, opts);
      }
    }
  }
  if (options2.hash_routing && url.pathname !== base + "/" && url.pathname !== "/[fallback]") {
    return text("Not found", { status: 404 });
  }
  let invalidated_data_nodes;
  if (is_route_resolution_request) {
    url.pathname = strip_resolution_suffix2(url.pathname);
  } else if (is_data_request) {
    url.pathname = strip_data_suffix2(url.pathname) + (url.searchParams.get(TRAILING_SLASH_PARAM) === "1" ? "/" : "") || "/";
    url.searchParams.delete(TRAILING_SLASH_PARAM);
    invalidated_data_nodes = url.searchParams.get(INVALIDATED_PARAM)?.split("").map((node) => node === "1");
    url.searchParams.delete(INVALIDATED_PARAM);
  } else if (remote_id) {
    url.pathname = request.headers.get("x-sveltekit-pathname") ?? base;
    url.search = request.headers.get("x-sveltekit-search") ?? "";
  }
  const headers2 = {};
  const { cookies, new_cookies, get_cookie_header, set_internal, set_trailing_slash } = get_cookies(
    request,
    url
  );
  const event_state = {
    prerendering: state2.prerendering,
    transport: options2.hooks.transport,
    handleValidationError: options2.hooks.handleValidationError,
    tracing: {
      record_span
    },
    is_in_remote_function: false
  };
  const event = {
    cookies,
    // @ts-expect-error `fetch` needs to be created after the `event` itself
    fetch: null,
    getClientAddress: state2.getClientAddress || (() => {
      throw new Error(
        `${"@sveltejs/adapter-cloudflare"} does not specify getClientAddress. Please raise an issue`
      );
    }),
    locals: {},
    params: {},
    platform: state2.platform,
    request,
    route: { id: null },
    setHeaders: /* @__PURE__ */ __name((new_headers) => {
      for (const key2 in new_headers) {
        const lower = key2.toLowerCase();
        const value = new_headers[key2];
        if (lower === "set-cookie") {
          throw new Error(
            "Use `event.cookies.set(name, value, options)` instead of `event.setHeaders` to set cookies"
          );
        } else if (lower in headers2) {
          throw new Error(`"${key2}" header is already set`);
        } else {
          headers2[lower] = value;
          if (state2.prerendering && lower === "cache-control") {
            state2.prerendering.cache = /** @type {string} */
            value;
          }
        }
      }
    }, "setHeaders"),
    url,
    isDataRequest: is_data_request,
    isSubRequest: state2.depth > 0,
    isRemoteRequest: !!remote_id
  };
  event.fetch = create_fetch({
    event,
    options: options2,
    manifest: manifest2,
    state: state2,
    get_cookie_header,
    set_internal
  });
  if (state2.emulator?.platform) {
    event.platform = await state2.emulator.platform({
      config: {},
      prerender: !!state2.prerendering?.fallback
    });
  }
  let resolved_path = url.pathname;
  if (!remote_id) {
    const prerendering_reroute_state = state2.prerendering?.inside_reroute;
    try {
      if (state2.prerendering) state2.prerendering.inside_reroute = true;
      resolved_path = await options2.hooks.reroute({ url: new URL(url), fetch: event.fetch }) ?? url.pathname;
    } catch {
      return text("Internal Server Error", {
        status: 500
      });
    } finally {
      if (state2.prerendering) state2.prerendering.inside_reroute = prerendering_reroute_state;
    }
  }
  try {
    resolved_path = decode_pathname(resolved_path);
  } catch {
    return text("Malformed URI", { status: 400 });
  }
  if (resolved_path !== url.pathname && !state2.prerendering?.fallback && has_prerendered_path(manifest2, resolved_path)) {
    const url2 = new URL(request.url);
    url2.pathname = is_data_request ? add_data_suffix2(resolved_path) : is_route_resolution_request ? add_resolution_suffix2(resolved_path) : resolved_path;
    const response = await fetch(url2, request);
    const headers22 = new Headers(response.headers);
    if (headers22.has("content-encoding")) {
      headers22.delete("content-encoding");
      headers22.delete("content-length");
    }
    return new Response(response.body, {
      headers: headers22,
      status: response.status,
      statusText: response.statusText
    });
  }
  let route = null;
  if (base && !state2.prerendering?.fallback) {
    if (!resolved_path.startsWith(base)) {
      return text("Not found", { status: 404 });
    }
    resolved_path = resolved_path.slice(base.length) || "/";
  }
  if (is_route_resolution_request) {
    return resolve_route(resolved_path, new URL(request.url), manifest2);
  }
  if (resolved_path === `/${app_dir}/env.js`) {
    return get_public_env(request);
  }
  if (!remote_id && resolved_path.startsWith(`/${app_dir}`)) {
    const headers22 = new Headers();
    headers22.set("cache-control", "public, max-age=0, must-revalidate");
    return text("Not found", { status: 404, headers: headers22 });
  }
  if (!state2.prerendering?.fallback) {
    const matchers = await manifest2._.matchers();
    for (const candidate of manifest2._.routes) {
      const match = candidate.pattern.exec(resolved_path);
      if (!match) continue;
      const matched = exec(match, candidate.params, matchers);
      if (matched) {
        route = candidate;
        event.route = { id: route.id };
        event.params = decode_params(matched);
        break;
      }
    }
  }
  let resolve_opts = {
    transformPageChunk: default_transform,
    filterSerializedResponseHeaders: default_filter,
    preload: default_preload
  };
  let trailing_slash = "never";
  try {
    const page_nodes = route?.page ? new PageNodes(await load_page_nodes(route.page, manifest2)) : void 0;
    if (route && !remote_id) {
      if (url.pathname === base || url.pathname === base + "/") {
        trailing_slash = "always";
      } else if (page_nodes) {
        if (BROWSER) ;
        trailing_slash = page_nodes.trailing_slash();
      } else if (route.endpoint) {
        const node = await route.endpoint();
        trailing_slash = node.trailingSlash ?? "never";
        if (BROWSER) ;
      }
      if (!is_data_request) {
        const normalized = normalize_path(url.pathname, trailing_slash);
        if (normalized !== url.pathname && !state2.prerendering?.fallback) {
          return new Response(void 0, {
            status: 308,
            headers: {
              "x-sveltekit-normalize": "1",
              location: (
                // ensure paths starting with '//' are not treated as protocol-relative
                (normalized.startsWith("//") ? url.origin + normalized : normalized) + (url.search === "?" ? "" : url.search)
              )
            }
          });
        }
      }
      if (state2.before_handle || state2.emulator?.platform) {
        let config = {};
        let prerender = false;
        if (route.endpoint) {
          const node = await route.endpoint();
          config = node.config ?? config;
          prerender = node.prerender ?? prerender;
        } else if (page_nodes) {
          config = page_nodes.get_config() ?? config;
          prerender = page_nodes.prerender();
        }
        if (state2.before_handle) {
          state2.before_handle(event, config, prerender);
        }
        if (state2.emulator?.platform) {
          event.platform = await state2.emulator.platform({ config, prerender });
        }
      }
    }
    set_trailing_slash(trailing_slash);
    if (state2.prerendering && !state2.prerendering.fallback && !state2.prerendering.inside_reroute) {
      disable_search(url);
    }
    const response = await record_span({
      name: "sveltekit.handle.root",
      attributes: {
        "http.route": event.route.id || "unknown",
        "http.method": event.request.method,
        "http.url": event.url.href,
        "sveltekit.is_data_request": is_data_request,
        "sveltekit.is_sub_request": event.isSubRequest
      },
      fn: /* @__PURE__ */ __name(async (root_span) => {
        const traced_event = {
          ...event,
          tracing: {
            enabled: false,
            root: root_span,
            current: root_span
          }
        };
        return await with_request_store(
          { event: traced_event, state: event_state },
          () => options2.hooks.handle({
            event: traced_event,
            resolve: /* @__PURE__ */ __name((event2, opts) => {
              return record_span({
                name: "sveltekit.resolve",
                attributes: {
                  "http.route": event2.route.id || "unknown"
                },
                fn: /* @__PURE__ */ __name((resolve_span) => {
                  return with_request_store(
                    null,
                    () => resolve2(merge_tracing(event2, resolve_span), page_nodes, opts).then(
                      (response2) => {
                        for (const key2 in headers2) {
                          const value = headers2[key2];
                          response2.headers.set(
                            key2,
                            /** @type {string} */
                            value
                          );
                        }
                        add_cookies_to_headers(response2.headers, new_cookies.values());
                        if (state2.prerendering && event2.route.id !== null) {
                          response2.headers.set("x-sveltekit-routeid", encodeURI(event2.route.id));
                        }
                        resolve_span.setAttributes({
                          "http.response.status_code": response2.status,
                          "http.response.body.size": response2.headers.get("content-length") || "unknown"
                        });
                        return response2;
                      }
                    )
                  );
                }, "fn")
              });
            }, "resolve")
          })
        );
      }, "fn")
    });
    if (response.status === 200 && response.headers.has("etag")) {
      let if_none_match_value = request.headers.get("if-none-match");
      if (if_none_match_value?.startsWith('W/"')) {
        if_none_match_value = if_none_match_value.substring(2);
      }
      const etag2 = (
        /** @type {string} */
        response.headers.get("etag")
      );
      if (if_none_match_value === etag2) {
        const headers22 = new Headers({ etag: etag2 });
        for (const key2 of [
          "cache-control",
          "content-location",
          "date",
          "expires",
          "vary",
          "set-cookie"
        ]) {
          const value = response.headers.get(key2);
          if (value) headers22.set(key2, value);
        }
        return new Response(void 0, {
          status: 304,
          headers: headers22
        });
      }
    }
    if (is_data_request && response.status >= 300 && response.status <= 308) {
      const location = response.headers.get("location");
      if (location) {
        return redirect_json_response(new Redirect(
          /** @type {any} */
          response.status,
          location
        ));
      }
    }
    return response;
  } catch (e3) {
    if (e3 instanceof Redirect) {
      const response = is_data_request || remote_id ? redirect_json_response(e3) : route?.page && is_action_json_request(event) ? action_json_redirect(e3) : redirect_response(e3.status, e3.location);
      add_cookies_to_headers(response.headers, new_cookies.values());
      return response;
    }
    return await handle_fatal_error(event, event_state, options2, e3);
  }
  async function resolve2(event2, page_nodes, opts) {
    try {
      if (opts) {
        resolve_opts = {
          transformPageChunk: opts.transformPageChunk || default_transform,
          filterSerializedResponseHeaders: opts.filterSerializedResponseHeaders || default_filter,
          preload: opts.preload || default_preload
        };
      }
      if (options2.hash_routing || state2.prerendering?.fallback) {
        return await render_response({
          event: event2,
          event_state,
          options: options2,
          manifest: manifest2,
          state: state2,
          page_config: { ssr: false, csr: true },
          status: 200,
          error: null,
          branch: [],
          fetched: [],
          resolve_opts,
          data_serializer: server_data_serializer(event2, event_state, options2)
        });
      }
      if (remote_id) {
        return await handle_remote_call(event2, event_state, options2, manifest2, remote_id);
      }
      if (route) {
        const method = (
          /** @type {import('types').HttpMethod} */
          event2.request.method
        );
        let response2;
        if (is_data_request) {
          response2 = await render_data(
            event2,
            event_state,
            route,
            options2,
            manifest2,
            state2,
            invalidated_data_nodes,
            trailing_slash
          );
        } else if (route.endpoint && (!route.page || is_endpoint_request(event2))) {
          response2 = await render_endpoint(event2, event_state, await route.endpoint(), state2);
        } else if (route.page) {
          if (!page_nodes) {
            throw new Error("page_nodes not found. This should never happen");
          } else if (page_methods.has(method)) {
            response2 = await render_page(
              event2,
              event_state,
              route.page,
              options2,
              manifest2,
              state2,
              page_nodes,
              resolve_opts
            );
          } else {
            const allowed_methods2 = new Set(allowed_page_methods);
            const node = await manifest2._.nodes[route.page.leaf]();
            if (node?.server?.actions) {
              allowed_methods2.add("POST");
            }
            if (method === "OPTIONS") {
              response2 = new Response(null, {
                status: 204,
                headers: {
                  allow: Array.from(allowed_methods2.values()).join(", ")
                }
              });
            } else {
              const mod = [...allowed_methods2].reduce(
                (acc, curr) => {
                  acc[curr] = true;
                  return acc;
                },
                /** @type {Record<string, any>} */
                {}
              );
              response2 = method_not_allowed(mod, method);
            }
          }
        } else {
          throw new Error("Route is neither page nor endpoint. This should never happen");
        }
        if (request.method === "GET" && route.page && route.endpoint) {
          const vary = response2.headers.get("vary")?.split(",")?.map((v2) => v2.trim().toLowerCase());
          if (!(vary?.includes("accept") || vary?.includes("*"))) {
            response2 = new Response(response2.body, {
              status: response2.status,
              statusText: response2.statusText,
              headers: new Headers(response2.headers)
            });
            response2.headers.append("Vary", "Accept");
          }
        }
        return response2;
      }
      if (state2.error && event2.isSubRequest) {
        const headers22 = new Headers(request.headers);
        headers22.set("x-sveltekit-error", "true");
        return await fetch(request, { headers: headers22 });
      }
      if (state2.error) {
        return text("Internal Server Error", {
          status: 500
        });
      }
      if (state2.depth === 0) {
        if (BROWSER && event2.url.pathname === "/.well-known/appspecific/com.chrome.devtools.json") ;
        return await respond_with_error({
          event: event2,
          event_state,
          options: options2,
          manifest: manifest2,
          state: state2,
          status: 404,
          error: new SvelteKitError(404, "Not Found", `Not found: ${event2.url.pathname}`),
          resolve_opts
        });
      }
      if (state2.prerendering) {
        return text("not found", { status: 404 });
      }
      const response = await fetch(request);
      return new Response(response.body, response);
    } catch (e3) {
      return await handle_fatal_error(event2, event_state, options2, e3);
    } finally {
      event2.cookies.set = () => {
        throw new Error("Cannot use `cookies.set(...)` after the response has been generated");
      };
      event2.setHeaders = () => {
        throw new Error("Cannot use `setHeaders(...)` after the response has been generated");
      };
    }
  }
  __name(resolve2, "resolve2");
}
__name(internal_respond, "internal_respond");
function load_page_nodes(page2, manifest2) {
  return Promise.all([
    // we use == here rather than === because [undefined] serializes as "[null]"
    ...page2.layouts.map((n3) => n3 == void 0 ? n3 : manifest2._.nodes[n3]()),
    manifest2._.nodes[page2.leaf]()
  ]);
}
__name(load_page_nodes, "load_page_nodes");
function propagate_context(fn) {
  return async (req, ...rest) => {
    {
      return fn(req, ...rest);
    }
  };
}
__name(propagate_context, "propagate_context");
function filter_env(env, allowed, disallowed) {
  return Object.fromEntries(
    Object.entries(env).filter(
      ([k3]) => k3.startsWith(allowed) && (disallowed === "" || !k3.startsWith(disallowed))
    )
  );
}
__name(filter_env, "filter_env");
function set_app(value) {
}
__name(set_app, "set_app");
var init_promise;
var current = null;
var Server = class {
  static {
    __name(this, "Server");
  }
  /** @type {import('types').SSROptions} */
  #options;
  /** @type {import('@sveltejs/kit').SSRManifest} */
  #manifest;
  /** @param {import('@sveltejs/kit').SSRManifest} manifest */
  constructor(manifest2) {
    this.#options = options;
    this.#manifest = manifest2;
    if (IN_WEBCONTAINER2) {
      const respond2 = this.respond.bind(this);
      this.respond = async (...args) => {
        const { promise, resolve: resolve2 } = (
          /** @type {PromiseWithResolvers<void>} */
          with_resolvers()
        );
        const previous = current;
        current = promise;
        await previous;
        return respond2(...args).finally(resolve2);
      };
    }
  }
  /**
   * @param {import('@sveltejs/kit').ServerInitOptions} opts
   */
  async init({ env, read }) {
    const { env_public_prefix, env_private_prefix } = this.#options;
    set_private_env(filter_env(env, env_private_prefix, env_public_prefix));
    set_public_env(filter_env(env, env_public_prefix, env_private_prefix));
    if (read) {
      const wrapped_read = /* @__PURE__ */ __name((file) => {
        const result = read(file);
        if (result instanceof ReadableStream) {
          return result;
        } else {
          return new ReadableStream({
            async start(controller) {
              try {
                const stream = await Promise.resolve(result);
                if (!stream) {
                  controller.close();
                  return;
                }
                const reader = stream.getReader();
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  controller.enqueue(value);
                }
                controller.close();
              } catch (error2) {
                controller.error(error2);
              }
            }
          });
        }
      }, "wrapped_read");
      set_read_implementation(wrapped_read);
    }
    await (init_promise ??= (async () => {
      try {
        const module = await get_hooks();
        this.#options.hooks = {
          handle: module.handle || (({ event, resolve: resolve2 }) => resolve2(event)),
          handleError: module.handleError || (({ status, error: error2, event }) => {
            const error_message = format_server_error(
              status,
              /** @type {Error} */
              error2,
              event
            );
            console.error(error_message);
          }),
          handleFetch: module.handleFetch || (({ request, fetch: fetch2 }) => fetch2(request)),
          handleValidationError: module.handleValidationError || (({ issues }) => {
            console.error("Remote function schema validation failed:", issues);
            return { message: "Bad Request" };
          }),
          reroute: module.reroute || (() => {
          }),
          transport: module.transport || {}
        };
        set_app({
          decoders: module.transport ? Object.fromEntries(Object.entries(module.transport).map(([k3, v2]) => [k3, v2.decode])) : {}
        });
        if (module.init) {
          await module.init();
        }
      } catch (e3) {
        {
          throw e3;
        }
      }
    })());
  }
  /**
   * @param {Request} request
   * @param {import('types').RequestOptions} options
   */
  async respond(request, options2) {
    return respond(request, this.#options, this.#manifest, {
      ...options2,
      error: false,
      depth: 0
    });
  }
};
var manifest = (() => {
  function __memo(fn) {
    let value;
    return () => value ??= value = fn();
  }
  __name(__memo, "__memo");
  return {
    appDir: "_app",
    appPath: "_app",
    assets: /* @__PURE__ */ new Set(["favicon.png"]),
    mimeTypes: { ".png": "image/png" },
    _: {
      client: { start: "_app/immutable/entry/start.CdUWFOZj.js", app: "_app/immutable/entry/app.VK-iCvkz.js", imports: ["_app/immutable/entry/start.CdUWFOZj.js", "_app/immutable/chunks/DvXU5mgi.js", "_app/immutable/chunks/qwSh76ll.js", "_app/immutable/chunks/Q07G5V9A.js", "_app/immutable/chunks/DLCh3GBu.js", "_app/immutable/entry/app.VK-iCvkz.js", "_app/immutable/chunks/qwSh76ll.js", "_app/immutable/chunks/IHki7fMi.js"], stylesheets: [], fonts: [], uses_env_dynamic_public: false },
      nodes: [
        __memo(() => Promise.resolve().then(() => (init__(), __exports))),
        __memo(() => Promise.resolve().then(() => (init__2(), __exports2))),
        __memo(() => Promise.resolve().then(() => (init__3(), __exports3)))
      ],
      remotes: {},
      routes: [
        {
          id: "/",
          pattern: /^\/$/,
          params: [],
          page: { layouts: [0], errors: [1], leaf: 2 },
          endpoint: null
        },
        {
          id: "/api/maps-config",
          pattern: /^\/api\/maps-config\/?$/,
          params: [],
          page: null,
          endpoint: __memo(() => Promise.resolve().then(() => (init_server_ts(), server_ts_exports)))
        },
        {
          id: "/api/realtime",
          pattern: /^\/api\/realtime\/?$/,
          params: [],
          page: null,
          endpoint: __memo(() => Promise.resolve().then(() => (init_server_ts2(), server_ts_exports2)))
        },
        {
          id: "/api/weather",
          pattern: /^\/api\/weather\/?$/,
          params: [],
          page: null,
          endpoint: __memo(() => Promise.resolve().then(() => (init_server_ts3(), server_ts_exports3)))
        }
      ],
      prerendered_routes: /* @__PURE__ */ new Set([]),
      matchers: /* @__PURE__ */ __name(async () => {
        return {};
      }, "matchers"),
      server_assets: {}
    }
  };
})();
var prerendered = /* @__PURE__ */ new Set([]);
var base_path = "";
async function e2(e3, t22) {
  let n22 = "string" != typeof t22 && "HEAD" === t22.method;
  n22 && (t22 = new Request(t22, { method: "GET" }));
  let r32 = await e3.match(t22);
  return n22 && r32 && (r32 = new Response(null, r32)), r32;
}
__name(e2, "e2");
function t2(e3, t22, n22, o22) {
  return ("string" == typeof t22 || "GET" === t22.method) && r3(n22) && (n22.headers.has("Set-Cookie") && (n22 = new Response(n22.body, n22)).headers.append("Cache-Control", "private=Set-Cookie"), o22.waitUntil(e3.put(t22, n22.clone()))), n22;
}
__name(t2, "t2");
var n2 = /* @__PURE__ */ new Set([200, 203, 204, 300, 301, 404, 405, 410, 414, 501]);
function r3(e3) {
  if (!n2.has(e3.status)) return false;
  if (~(e3.headers.get("Vary") || "").indexOf("*")) return false;
  let t22 = e3.headers.get("Cache-Control") || "";
  return !/(private|no-cache|no-store)/i.test(t22);
}
__name(r3, "r3");
function o3(n22) {
  return async function(r32, o22) {
    let a3 = await e2(n22, r32);
    if (a3) return a3;
    o22.defer((e3) => {
      t2(n22, r32, e3, o22);
    });
  };
}
__name(o3, "o3");
var s4 = caches.default;
var c3 = t2.bind(0, s4);
var r22 = e2.bind(0, s4);
var e22 = o3.bind(0, s4);
var server = new Server(manifest);
var app_path = `/${manifest.appPath}`;
var immutable = `${app_path}/immutable/`;
var version_file = `${app_path}/version.json`;
var worker = {
  async fetch(req, env, context) {
    await server.init({ env });
    let pragma = req.headers.get("cache-control") || "";
    let res = !pragma.includes("no-cache") && await r22(req);
    if (res) return res;
    let { pathname, search } = new URL(req.url);
    try {
      pathname = decodeURIComponent(pathname);
    } catch {
    }
    const stripped_pathname = pathname.replace(/\/$/, "");
    let is_static_asset = false;
    const filename = stripped_pathname.slice(base_path.length + 1);
    if (filename) {
      is_static_asset = manifest.assets.has(filename) || manifest.assets.has(filename + "/index.html") || filename in manifest._.server_assets || filename + "/index.html" in manifest._.server_assets;
    }
    let location = pathname.at(-1) === "/" ? stripped_pathname : pathname + "/";
    if (is_static_asset || prerendered.has(pathname) || pathname === version_file || pathname.startsWith(immutable)) {
      res = await env.ASSETS.fetch(req);
    } else if (location && prerendered.has(location)) {
      if (search) location += search;
      res = new Response("", {
        status: 308,
        headers: {
          location
        }
      });
    } else {
      res = await server.respond(req, {
        // @ts-ignore
        platform: { env, context, caches, cf: req.cf },
        getClientAddress() {
          return req.headers.get("cf-connecting-ip");
        }
      });
    }
    pragma = res.headers.get("cache-control") || "";
    return pragma && res.status < 400 ? c3(req, res, context) : res;
  }
};
var worker_default = worker;

// ../../../../../../AppData/Local/nvm/v22.20.0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e3) {
      console.error("Failed to drain the unused request body.", e3);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../../AppData/Local/nvm/v22.20.0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e3) {
  return {
    name: e3?.name,
    message: e3?.message ?? String(e3),
    stack: e3?.stack,
    cause: e3?.cause === void 0 ? void 0 : reduceError(e3.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e3) {
    const error2 = reduceError(e3);
    return Response.json(error2, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../../.wrangler/tmp/bundle-QHeiZH/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../../../../AppData/Local/nvm/v22.20.0/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../../.wrangler/tmp/bundle-QHeiZH/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker2) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker2;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker2.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker2.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker2,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init3) {
        if (type === "scheduled" && worker2.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init3.cron ?? "",
            () => {
            }
          );
          return worker2.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init3) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init3.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

cookie/index.js:
  (*!
   * cookie
   * Copyright(c) 2012-2014 Roman Shtylman
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)

@auth/core/lib/vendored/cookie.js:
  (**
   * @source https://github.com/jshttp/cookie
   * @author blakeembrey
   * @license MIT
   *)
*/
//# sourceMappingURL=bundledWorker-0.5899413989274955.mjs.map
