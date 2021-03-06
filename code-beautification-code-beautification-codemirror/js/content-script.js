
document.addEventListener('DOMContentLoaded', function () {

  init();

  function init() {
    var new_blob = document.getElementById("new_blob");
    if(!new_blob){
      initPres();
      initTable();
    }else{
      var textarea = new_blob.querySelector("textarea");
      new_blob.querySelector("div.file-actions").remove();
      textarea.classList.remove("js-code-textarea");
      var url = window.location.href;
      var language = undefined;
      language = url.substr(url.lastIndexOf('.') + 1);
      textarea.lang = language;
      initCode(textarea, textarea);
    }
  }

  function initTable() {
    var tables = document.querySelectorAll("table.tab-size");
    tables.forEach(table => {
      setLanguage(table, true);
      initCode(table);
    });
  }

  function initPres() {
    var pres = document.querySelectorAll("pre");
    pres.forEach(pre => {
      if (pre.lang == "mermaid" || pre.firstElementChild.className.indexOf("-mermaid") != -1) {
        initMermaid(pre.firstElementChild);
        return;
      }
      setLanguage(pre);
      initCode(pre);
    })
  }

  function initMermaid(code) {
    var div = document.createElement('div');
    div.innerHTML = code.innerHTML;
    div.classList.add("mermaid");
    code.parentNode.parentNode.replaceChild(div, code.parentNode);
    code.classList.remove("hljs");
  }

  function setLanguage(elm, table) {
    var language = undefined;
    switch (window.location.host) {
      case "github.com":
        if (table) {
          var url = window.location.href;
          language = url.substr(url.lastIndexOf('.') + 1);
          language = language ? language : [...elm.parentNode.classList.values()].filter(function (val) { return val.indexOf("type-") > -1 })[0].substring(5);
        } else {
          language = elm.parentNode.className.substring(27);
          elm.parentNode.nodeType == 1 ? elm.parentNode.removeAttribute("class") : null;
        }
        break
      case "git.beanjs.com":
        elm.firstElementChild.classList.remove("hljs");
        var listClass = [...elm.firstElementChild.classList.values()];
        if (listClass.indexOf("language-") != -1) {
          language = listClass[0].substring(9);
        } else {
          language = listClass[0];
        }
        break
      default:
        break
    }
    elm.lang = language;
  }
})