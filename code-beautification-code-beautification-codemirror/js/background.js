/* globals chrome */

var _gaq = _gaq || [];

var defaults = {
    "theme": "3024-day",
    "theme1": "default",
    "font": "Andale Mono",
    "indent_size": 4,
    "indent_char": " ",
    "size": "8px"
};

var themeList = ["3024-day", "3024-night", "abcdef", "ambiance", "ayu-dark", "ayu-mirage", "base16-dark", "bespin",
    "blackboard", "cobalt", "colorforth", "darcula", "dracula", "duotone-dark", "duotone-light", "erlang-dark",
    "gruvbox-dark", "hopscotch", "icecoder", "idea", "isotope", "lesser-dark", "liquibyte", "lucario", "material",
    "material-darker", "material-ocean", "material-palenight", "mbo", "mdn-like", "midnight", "monokai", "moxer",
    "neo", "night", "nord", "oceanic-next", "panda-syntax", "paraiso-dark", "paraiso-light", "pastel-on-dark",
    "railscasts", "rubyblue", "seti", "shadowfox", "solarized", "the-matrix", "tomorrow-night-bright", "tomorrow-night-eighties",
    "ttcn", "twilight", "vibrant-ink", "xq-dark", "xq-light", "yeti", "yonce", "zenburn",
]

var options = {};

function extend(destination, source) {
    for (var property in source) {
        destination[property] = source[property];
    }
    return destination;
}

function getOptions(firstTime) {
    chrome.storage.sync.get("options", function (data) {
        options = extend(defaults, data.options);

        if (firstTime && _gaq) {
            _gaq.push(["_setCustomVar", 4, "theme1", options.theme1.toString(), 2]);
            _gaq.push(["_setCustomVar", 4, "theme", options.theme.toString(), 2]);
            _gaq.push(["_setCustomVar", 4, "font", options.font.toString(), 2]);
            _gaq.push(["_setCustomVar", 4, "size", options.size.toString(), 2]);
            _gaq.push(["_setCustomVar", 5, "indent", options.indent_size + " " + (options.indent_size == 1 ? "tab" : "spaces"), 2]);
        }
    });
}

chrome.storage.onChanged.addListener(function (changes, areaName) {
    console.info("chrome.storage.onChanged", changes, areaName);
    getOptions();
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    var tabId = sender.tab ? sender.tab.id : null;

    switch (message.action) {
        case "get_options":
            sendResponse(options);
            break;
        case "get_themes":
            sendResponse(themeList);
            break;
        case "insert_css":
            chrome.tabs.insertCSS(tabId, {
                code: message.code
            }, sendResponse);
            return true;
        case "insert_theme":
            chrome.tabs.insertCSS(tabId, {
                file: "codemirror/theme/" + message.theme + ".css"
            }, sendResponse);
            return true;
    }
});

getOptions(true);

chrome.webRequest.onBeforeRequest.addListener(details => {
    return { cancel: true };
}, { urls: ["https://*/assets/editor*.js"], types: ["script"] }, ["blocking"]);


/* Google Analytics */
_gaq.push(['_setAccount', 'UA-37085142-2']);
_gaq.push(['_trackPageview']);

(function () {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();
