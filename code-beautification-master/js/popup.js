// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    if(request.type == "editClass"){
			editClass(request.info);
		}
});

function editClass(css){
	getCurrentTabId(function (id) {
		chrome.tabs.insertCSS(id, {code: css});
	})
}

chrome.storage.sync.get({ mermaid: false }, function (items) {
	document.getElementById("toggle-button").checked = items.mermaid
});

chrome.storage.sync.get({ theme: "Default" }, function (items) {
	var select = document.getElementById("theme");
	for (var i = 0; i < select.options.length; i++) {
		if (select.options[i].value == items.theme) {
			select.options[i].selected = true;
			break;
		}
	}
});


function getCurrentTabId(callback) {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		var host = tabs.length ? tabs[0].url.split('/') : null;
		if (callback) callback(tabs.length ? tabs[0].id : null, host[2] ? host[2] : null);
	});
}


document.getElementById("theme").addEventListener("change", function (e) {
	var obj = document.getElementById("theme");
	var index = obj.selectedIndex;
	var value = obj.options[index].value;
	chrome.storage.sync.set({ theme: value }, function () {
		getCurrentTabId(function (id) {
			chrome.tabs.executeScript(id, { code: 'location.reload();' });
		})
	});
}, false);

document.getElementById("toggle-button").addEventListener("click", function (e) {
	getCurrentTabId(function (id) {
		chrome.tabs.executeScript(id, { code: 'location.reload();' });
	})
	chrome.storage.sync.set({ mermaid: document.getElementById("toggle-button").checked }, function () {
	});
}, false);

document.getElementById("btn").addEventListener("click", function (e) {
	chrome.storage.sync.get({ url: {} }, function (items) {
		var url = items.url;
		getCurrentTabId(function (id, host) {
			url[host] = true;
			chrome.storage.sync.set({ url: url }, function () {
				chrome.tabs.executeScript(id, { code: 'location.reload();' });
			});
		})
	});
}, false);

document.getElementById("clear").addEventListener("click", function (e) {
	chrome.storage.sync.get({ url: {} }, function (items) {
		var url = items.url;
		getCurrentTabId(function (id, host) {
			delete url[host];
			chrome.storage.sync.set({ url: url }, function () {
				chrome.tabs.executeScript(id, { code: 'location.reload();' });
			});
		})
	});
}, false);


