/* globals chrome, CodeMirror, js_beautify, css_beautify, unpacker_filter */

var main = document.getElementById("main");
var preview = document.getElementById("preview");
var sampleJS = document.getElementById("sample-js").value;
var themeCSS = document.getElementById("theme");
var form = document.getElementById("options");
var lang = "javascript";
var options = {};
var cm;

function beautify() {

    var code = js_beautify(sampleJS, options);

    if (cm) preview.removeChild(cm.getWrapperElement());
    cm = CodeMirror(preview, {
        value: code,
        mode: lang,
        theme: options.theme,
        lineNumbers: true,
        readOnly: true
    });
    themeCSS.href = "codemirror/theme/" + options.theme.split(" ")[0] + ".css";
    if (options.font !== undefined) cm.getWrapperElement().style.fontFamily = "'" + options.font + "', monospace";
    if (options.size !== undefined) cm.getWrapperElement().style.fontSize =  options.size;
    setTimeout(function() {
        main.style.marginBottom = preview.getBoundingClientRect().height + 10 + "px";
    }, 50);
}

function saveOptions() {
    options.theme1 = form.theme1.value;
    options.theme = form.theme.value;
    options.font = form.font.value;
    options.size = form.size.value;
    options.indent_size = form.indent_size.value;
    options.indent_char = options.indent_size == 1 ? "\t" : " ";

    beautify();

    chrome.storage.sync.set({ options: options }, function() {
        console.log("Options saved.");
    });
}

chrome.runtime.sendMessage({ action: "get_options" }, function (_options) {
    options = _options;

    form.theme1.value = options.theme1;
    form.theme.value = options.theme;
    form.font.value = options.font;
    form.size.value = options.size;
    form.indent_size.value = options.indent_size;

    Array.prototype.slice.call(form.querySelectorAll("input, select")).forEach(function(field) {
        field.onchange = function() {
            preview.dataset[field.name] = field.type === "checkbox" ? field.checked : field.value;
            saveOptions();
        };
        preview.dataset[field.name] = field.type === "checkbox" ? field.checked : field.value;
    });
    beautify();
});

/* Google Analytics */
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-37085142-2']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();