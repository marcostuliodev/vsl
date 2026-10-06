(function () {
  "use strict";

  var config = window.METRICS_CONFIG || {};
  var endpoint = config.endpoint || "/api/collect";
  var siteKey = config.siteKey || "";
  var projectId = config.projectId || "";
  var metaPixelId = String(config.metaPixelId || "");
  var initialUrl = new URL(window.location.href);
  var queryKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "gclid", "fbclid", "ttclid", "msclkid"];
  var sessionId = (function () {
    try {
      var existing = sessionStorage.getItem("metrics_session_id");
      if (existing) return existing;
      var created = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
      sessionStorage.setItem("metrics_session_id", created);
      return created;
    } catch {
      return String(Date.now()) + Math.random().toString(16).slice(2);
    }
  })();
  var lastPath = null;
  var initialAttribution = collectAttribution(initialUrl);

  function text(value, max) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max || 120);
  }

  function eventId() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  }

  function cookie(name) {
    try {
      var prefix = name + "=";
      var item = document.cookie.split(";").map(function (part) { return part.trim(); }).find(function (part) { return part.indexOf(prefix) === 0; });
      return item ? decodeURIComponent(item.slice(prefix.length)).slice(0, 256) : "";
    } catch {
      return "";
    }
  }

  function safeUrl(value) {
    if (!value) return "";
    try {
      var url = new URL(value, window.location.href);
      return url.origin + url.pathname;
    } catch {
      return "";
    }
  }

  function objectValue(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function assignParam(target, key, value) {
    if (value !== undefined && value !== null && value !== "") target[key] = value;
  }

  function safePageUrl(attribution) {
    var query = attribution && attribution.landingQuery ? "?" + attribution.landingQuery : "";
    return window.location.origin + window.location.pathname + query;
  }

  function collectMetaParams(input) {
    var source = objectValue(input);
    var data = objectValue(source.data || source.payload);
    var options = objectValue(source.options);
    var params = {};
    ["pixelId", "eventName", "eventId", "eventID", "eventSource", "actionSource", "eventTime", "command", "source", "value", "currency", "testEventCode", "test_event_code"].forEach(function (key) {
      if (source[key] !== undefined) assignParam(params, key, source[key]);
    });
    ["value", "currency", "content_ids", "content_type", "content_name", "content_category", "num_items", "order_id", "tax", "shipping", "coupon"].forEach(function (key) {
      if (data[key] !== undefined) assignParam(params, key, data[key]);
    });
    ["eventID", "event_id", "action_source", "event_source", "event_time", "custom_data", "test_event_code"].forEach(function (key) {
      if (options[key] !== undefined) assignParam(params, key, options[key]);
    });
    if (source.customData !== undefined) params.customData = source.customData;
    if (source.data !== undefined) params.data = data;
    if (source.options !== undefined) params.options = options;
    if (source.payload !== undefined && !source.data) params.data = data;
    var userData = objectValue(data.user_data || options.user_data);
    if (Object.keys(userData).length) params.userDataKeys = Object.keys(userData);
    var attribution = collectAttribution(new URL(window.location.href));
    assignParam(params, "pageUrl", safePageUrl(attribution));
    assignParam(params, "referrerUrl", attribution.referrerUrl);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "gclid", "fbclid", "ttclid", "msclkid", "fbc", "fbp", "consentState"].forEach(function (key) {
      var value = attribution[key] || attribution[key === "fbc" ? "metaFbc" : key === "fbp" ? "metaFbp" : key];
      assignParam(params, key, value);
    });
    assignParam(params, "deviceType", attribution.deviceType);
    assignParam(params, "browserName", attribution.browserName);
    assignParam(params, "osName", attribution.osName);
    return params;
  }

  function collectAttribution(url) {
    var result = {};
    queryKeys.forEach(function (key) {
      var value = url.searchParams.get(key);
      if (value) result[key] = text(value, 256);
    });
    var fbclid = result.fbclid || "";
    var fbc = cookie("_fbc");
    if (!fbc && fbclid) fbc = "fb.1." + Math.floor(Date.now() / 1000) + "." + fbclid;
    var referrerUrl = safeUrl(document.referrer);
    var paid = Boolean(result.fbclid || result.gclid || result.ttclid || result.msclkid || /^(paid|paid_social|cpc|cpm|ppc|ad|ads)$/i.test(result.utm_medium || ""));
    return {
      utmSource: result.utm_source || null,
      utmMedium: result.utm_medium || null,
      utmCampaign: result.utm_campaign || null,
      utmTerm: result.utm_term || null,
      utmContent: result.utm_content || null,
      utmId: result.utm_id || null,
      gclid: result.gclid || null,
      fbclid: fbclid || null,
      ttclid: result.ttclid || null,
      msclkid: result.msclkid || null,
      landingQuery: queryKeys.filter(function (key) { return Boolean(result[key]); }).map(function (key) { return encodeURIComponent(key) + "=" + encodeURIComponent(result[key]); }).join("&") || null,
      referrerUrl: referrerUrl || null,
      isPaid: paid,
      consentState: config.consentState || "unknown",
      metaPixelId: metaPixelId || null,
      metaFbc: fbc || null,
      metaFbp: cookie("_fbp") || null,
      metaSource: typeof window.fbq === "function" ? "browser" : "unknown"
    };
  }

  function currentAttribution() {
    var current = collectAttribution(new URL(window.location.href));
    var merged = Object.assign({}, current);
    Object.keys(initialAttribution).forEach(function (key) {
      if (key === "isPaid" ? Boolean(initialAttribution[key]) : merged[key] == null || merged[key] === "") merged[key] = initialAttribution[key];
    });
    return merged;
  }

  function postWithRetry(body, attempt) {
    try {
      fetch(endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        keepalive: true,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
          "Bypass-Tunnel-Reminder": "metrics"
        },
        body: body
      }).then(function (response) {
        if (!response.ok) throw new Error("metrics_http_" + response.status);
      }).catch(function () {
        if (attempt < 2) window.setTimeout(function () { postWithRetry(body, attempt + 1); }, 1000 * (attempt + 1));
      });
    } catch {
      if (attempt < 2) window.setTimeout(function () { postWithRetry(body, attempt + 1); }, 1000 * (attempt + 1));
    }
  }

  function send(eventName, data, useBeacon) {
    data = data || {};
    var currentEventId = data.meta && data.meta.eventId ? data.meta.eventId : eventId();
    var attribution = currentAttribution();
    var meta = data.meta || {};
    var metaParams = Object.assign({}, collectMetaParams(meta), data.metaParams || {});
    if (metaPixelId) metaParams.pixelId = metaPixelId;
    if (meta.source) metaParams.eventSource = meta.source;
    if (meta.pixelId) attribution.metaPixelId = String(meta.pixelId);
    if (meta.eventName) attribution.metaEventName = String(meta.eventName);
    if (meta.eventId) attribution.metaEventId = String(meta.eventId);
    if (meta.value !== undefined) attribution.metaEventValue = Number(meta.value);
    if (meta.currency) attribution.metaEventCurrency = String(meta.currency);
    if (meta.source) attribution.metaSource = String(meta.source);
    var payload = {
      path: window.location.pathname,
      eventName: eventName,
      eventId: currentEventId,
      projectId: projectId || undefined,
      siteKey: siteKey || undefined,
      attribution: attribution,
      metaParams: metaParams,
      eventData: Object.assign({
        sessionId: sessionId,
        collector: "metrics-script",
        viewport: window.innerWidth + "x" + window.innerHeight,
        language: navigator.language || "",
        connection: navigator.connection && navigator.connection.effectiveType || "",
        screen: window.screen ? window.screen.width + "x" + window.screen.height : ""
      }, data.eventData || {})
    };
    var body = JSON.stringify(payload);
    if (useBeacon && navigator.sendBeacon) {
      try {
        if (navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain;charset=UTF-8" }))) return;
      } catch {
        // Fall through to fetch when Beacon is unavailable or blocked.
      }
    }
    postWithRetry(body, 0);
  }

  function recordMetaEvent(name, value, currency, source, id, extraParams) {
    var meta = { eventName: name, value: value, currency: currency, source: source || "browser", eventId: id || eventId() };
    Object.assign(meta, extraParams || {});
    send("meta_event", { meta: meta }, false);
  }

  function recordObservedMetaArgs(args, source) {
    if (!Array.isArray(args) || (args[0] !== "track" && args[0] !== "trackCustom")) return;
    var options = args[3] && typeof args[3] === "object" ? args[3] : {};
    var data = args[2] && typeof args[2] === "object" ? args[2] : {};
    var params = collectMetaParams({ command: args[0], eventName: args[1], data: data, options: options, pixelId: metaPixelId, source: source || "browser" });
    recordMetaEvent(String(args[1] || "Unknown"), data.value, data.currency, source || "browser", options.eventID || options.event_id, params);
  }

  function flushInitialMetaQueue() {
    if (!window.__metricsInitialMetaQueueOwner || !Array.isArray(window.__metricsInitialMetaQueueOwner.queue)) return;
    window.__metricsInitialMetaQueueOwner.queue.splice(0).forEach(function (args) { recordObservedMetaArgs(args, "browser_queued"); });
  }

  function installMetaObserver() {
    var original = window.fbq;
    if (typeof original !== "function") return false;
    if (original.__metricsWrapped) return true;
    var wrapped = function () {
      var args = Array.prototype.slice.call(arguments);
      var result = original.apply(this, args);
       if (args[0] === "track" || args[0] === "trackCustom") recordObservedMetaArgs(args, "browser");
      return result;
    };
    wrapped.__metricsWrapped = true;
    window.fbq = wrapped;
    return true;
  }

  function pageView(reason) {
    lastPath = window.location.pathname;
    send("page_view", { navigationReason: reason || "load" }, false);
  }

  function routeChanged(reason) {
    if (window.location.pathname === lastPath) return;
    pageView(reason);
  }

  window.MetricsCollector = {
    track: function (name, data) { send(name, data, false); },
    meta: function (name, data) { recordMetaEvent(name, data && data.value, data && data.currency, "browser", data && data.eventId, data && data.params); },
    pageView: pageView,
    sessionId: sessionId
  };

  window.__metricsInitialMetaQueueOwner = typeof window.fbq === "function" ? window.fbq : null;
  installMetaObserver();
  flushInitialMetaQueue();
  var observerAttempts = 0;
  var observerTimer = window.setInterval(function () {
    observerAttempts += 1;
    if (installMetaObserver() || observerAttempts >= 20) window.clearInterval(observerTimer);
  }, 250);
  pageView("load");
  if (Array.isArray(window.METRICS_META_QUEUE)) {
    window.METRICS_META_QUEUE.splice(0).forEach(function (item) {
      if (item && item.eventName) recordMetaEvent(String(item.eventName), item.value, item.currency, "browser_queued", item.eventId, item.params || item);
    });
  }

  var pushState = history.pushState;
  var replaceState = history.replaceState;
  history.pushState = function () {
    var result = pushState.apply(this, arguments);
    routeChanged("pushState");
    return result;
  };
  history.replaceState = function () {
    var result = replaceState.apply(this, arguments);
    routeChanged("replaceState");
    return result;
  };
  window.addEventListener("popstate", function () { routeChanged("popstate"); });

  document.addEventListener("visibilitychange", function () {
    send("visibility_change", { visibility: document.visibilityState }, false);
  });

  document.addEventListener("click", function (event) {
    var target = event.target && event.target.closest ? event.target.closest("a,button,[role=button]") : null;
    if (!target) return;
    send("interaction", { tag: target.tagName.toLowerCase(), role: target.getAttribute("role") || "", pathOnly: target instanceof HTMLAnchorElement ? target.pathname : "" }, false);
  }, { passive: true });

  window.addEventListener("error", function (event) {
    send("client_error", { message: text(event.message, 180), source: text(event.filename, 120) }, false);
  });
  window.addEventListener("unhandledrejection", function (event) {
    send("client_error", { message: text(event.reason && (event.reason.message || event.reason), 180), source: "unhandledrejection" }, false);
  });

  window.addEventListener("load", function () {
    try {
      var navigation = performance.getEntriesByType("navigation")[0];
      if (!navigation) return;
      send("performance", { responseStart: Math.round(navigation.responseStart || 0), responseEnd: Math.round(navigation.responseEnd || 0), domContentLoaded: Math.round(navigation.domContentLoadedEventEnd || 0), loadEvent: Math.round(navigation.loadEventEnd || 0), transferSize: Math.round(navigation.transferSize || 0) }, false);
    } catch {
      // Performance API is optional.
    }
  });

  window.setInterval(function () { send("heartbeat", {}, false); }, 30000);
}());
