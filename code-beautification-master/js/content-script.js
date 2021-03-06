var mermaidFlag = false;
var themeName = "Default";

chrome.storage.sync.get({ mermaid: false }, function (items) {
	mermaidFlag = items.mermaid
});

chrome.storage.sync.get({ theme: "Default" }, function (items) {
	themeName = items.theme;
});

document.addEventListener('DOMContentLoaded', function () {
	var flag = false;
	chrome.storage.sync.get({ url: {} }, function (items) {
		flag = items.url[window.location.host];
		if (mermaidFlag && flag) {
			injectCustomJs("js/clipboard.min.js");
			injectCustomJs("js/elm.js");
			injectCustomJs("js/toolbar.js");
			start();
			injectCustomJs("js/prism/" + themeName + ".js");
			injectCustomCss("css/prism/" + themeName + ".css");
		}
	});
});

// 向页面注入JS
function injectCustomJs(jsPath) {
	jsPath = jsPath || 'js/prism.js';
	var temp = document.createElement('script');
	temp.setAttribute('type', 'text/javascript');
	// 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
	temp.src = chrome.extension.getURL(jsPath);
	temp.onload = function () {
		// 放在页面不好看，执行完后移除掉
		this.parentNode.removeChild(this);
	};
	document.body.appendChild(temp);
}

// 向页面注入CSS
function injectCustomCss(cssPath) {
	cssPath = cssPath || 'css/prism.css';
	var style = document.createElement('link');
	style.rel = 'stylesheet';
	style.type = 'text/css';
	style.href = chrome.extension.getURL(cssPath);
	document.getElementsByTagName('head').item(0).appendChild(style);
}
