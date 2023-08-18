var Trackingplan = {};

Trackingplan.options = {
    tpId: "TP269762",
    validateEndpoint: "https://tracks.trackingplan.com/v1/?skip_ingest=true&validate=true&debug=true"
};

Trackingplan.validateRequest = async (extensionRequest, callback) => {
    var request = Trackingplan.getRequestFromExtensionRequest(extensionRequest);
    var provider = Trackingplan.getAnalyticsProvider(request);
    if(!provider){
        return false;
    }
    var raw_track = Trackingplan.createRawTrack(request, provider, Trackingplan.options.tpId);
    var payload = { "requests": [raw_track], "common": Trackingplan.getCommonPayload() };

    
    var response = await fetch(Trackingplan.options.validateEndpoint, {
        method: "POST", 
        mode: "cors", 
        cache: "no-cache", 
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload) // body data type must match "Content-Type" header
    });

    return response.json();
};

Trackingplan.isTrackingplanRequest = (extensionRequest) => {

    var request = Trackingplan.getRequestFromExtensionRequest(extensionRequest);
    

    var provider = Trackingplan.getAnalyticsProvider(request);
    if (provider) {
        return true;
    }
    return false;
};

Trackingplan.getRequestFromExtensionRequest = (extensionRequest) => {
    return {
        "endpoint": extensionRequest.url,
        "payload": extensionRequest.postBody,
        "method": extensionRequest.method,
        "protocol": "extension"
    };
};


Trackingplan.createRawTrack = (request, provider, tpId) => {
    return {
        "tp_id": tpId,
        // Normalized provider name (extracted from domain/regex => provider hash table).
        "provider": provider,
        "request": {
            // The original provider endpoint URL
            "endpoint": request.endpoint,
            // The request method. It’s not just POST & GET, but the info needed to inform the parsers how to decode the payload within that provider, e.g. Beacon.
            "method": request.method,
            // The post payload, in its original form.
            "post_payload": request.payload || null,
            "protocol": request.protocol,
            // The url the event has been triggered at
            "href": null,
        },
        // timestamp in milis since UTC
        "ts": new Date().getTime(),
        "sampling_rate": 1,
    };
};

Trackingplan.getCommonPayload = () => {
    return {
        "context": {},
        // A key that identifies the customer. It’s written by the developer on the SDK initialization.
        "tp_id": Trackingplan.options.tpId,
        // An optional alias that identifies the source. It’s written by the developer on the SDK initialization.
        "source_alias": null,
        // An optional environment. It’s written by the developer on the SDK initialization. Useful for the developer testing. Can be "PRODUCTION" or "TESTING".
        "environment": "PRODUCTION",
        // The used sdk. It’s known by the sdk itself.
        "sdk": "extension",
        // The SDK version, useful for implementing different parsing strategies. It’s known by the sdk itself.
        "sdk_version": "1.0",
        // The rate at which this specific track has been sampled.
        "sampling_rate": 1,
        // Debug mode. Makes every request return and console.log the parsed track.
        "debug": true,
        // Tags.
        "tags": {}
    };
};


Trackingplan.getAnalyticsProvider = (request) => {
    function isString(value) {
        return typeof value === "string" || value instanceof String;
    }
    function _testPattern(pattern, content) {
        if (pattern === null || content === null) return true;
        if (pattern[0] === "/") {
            var regex = new RegExp(pattern.slice(1, -1));
            return (regex.test(content));
        } else {
            return (content.indexOf(pattern) !== -1);
        }
    }

    var endpoint = request.endpoint;
    var payload = request.payload;
    if (isString(endpoint)) {
        for (var pattern in _providerDomains) {
            var parts = pattern.split("%");
            var endpointPattern = parts[0];
            var payloadPattern = parts.length === 2 ? parts[1] : null;
            if (_testPattern(endpointPattern, endpoint) && _testPattern(payloadPattern, payload)) {
                return _providerDomains[pattern];
            }
        }
        return false;
    }
};



// VARIABLES
var _providerDomains = {
    "google-analytics.com": "googleanalytics",
    "analytics.google.com": "googleanalytics",
    "api.segment.io": "segment",
    "segmentapi": "segment",
    "seg-api": "segment",
    "segment-api": "segment",
    "/.*api-iam.intercom.io/messenger/web/(ping|events|metrics|open).*/": "intercom",
    "api.amplitude.com": "amplitude",
    "ping.chartbeat.net": "chartbeat",
    "/.*api(-eu)?(-js)?.mixpanel.com.*/": "mixpanel",
    "trk.kissmetrics.io": "kissmetrics",
    "ct.pinterest.com": "pinterest",
    "facebook.com/tr/": "facebook",
    "track.hubspot.com/__": "hubspot",
    "/.*.heapanalytics.com/(h|api).*/": "heap",
    "/.*snowplow.*/": "snowplow",
    "/.*ws.*.hotjar.com/api/v2/client/ws/%identify_user": "hotjar",
    "/.*ws.*.hotjar.com/api/v2/client/ws/%tag_recording": "hotjar",
    "klaviyo.com/api/track": "klaviyo",
    "app.pendo.io/data": "pendo",
    "matomo.php": "matomo",
    "rs.fullstory.com/rec%8137": "fullstory",
    "rs.fullstory.com/rec%8193": "fullstory",
    "logx.optimizely.com/v1/events": "optimizely",
    "track.customer.io/events/": "customerio",
    "alb.reddit.com/rp.gif": "reddit",
    "px.ads.linkedin.com": "linkedin",
    "/i/adsct": "twitter",
    "bat.bing.com": "bing",
    "pdst.fm": "podsights",
    "analytics.tiktok.com/api/v2": "tiktok"
};

