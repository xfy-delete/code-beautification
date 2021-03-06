function start() {
  document.body.classList.add("match-braces");
  var listLanguages = ["html", "xml", "bash", "shell", "cpp", "css", "diff", "django", "dockerfile", "ruby", "go", "java", "javascript", "json", "less",
    "lisp", "lua", "makefile", "matlab", "nginx", "php", "powershell", "python", "r", "rust", "scss", "sql", "swift", "typescript", "vim", "xl"];

  var renderer = new marked.Renderer();

  function HTMLEncode(html) {
    var temp = document.createElement("div");
    (temp.textContent != null) ? (temp.textContent = html) : (temp.innerText = html);
    var output = temp.innerHTML;
    temp = null;
    return output;
  }

  renderer.code = function (code, language) {
    if (window.location.host == "blog.csdn.net") {
      return `<code class='language-${language}' style='overflow-x: visible !important;'>${HTMLEncode(code)}</code>`;
    } if (window.location.host == "gitee.com") {
      return `<code class='language-${language}' style='border: 0px !important;'>${HTMLEncode(code)}</code>`;
    }
    return `<code class='language-${language}'>${HTMLEncode(code)}</code>`;
  };

  init();

  initPre();

  initFile();

  function initFile() {
    switch (window.location.host) {
      case "github.com":
        var table = document.querySelector("table[class='highlight tab-size js-file-line-container']");
        githubTable(table);
        break;
      default:
        break;
    }
  }

  function githubTable(table) {
    if (!table) {
      return;
    }
    var language = [...table.parentNode.classList.values()].filter(function (val) { return val.indexOf("type-") > -1 });
    var text = table.innerText;
    if (language.length <= 0) {
      language = [hljs.highlightAuto(text, listLanguages).language];
      language = [(language == undefined ? "javascript" : language)];
    } else {
      language = [language[0].substring(5)];
    }
    var preElm = document.createElement("pre");
    preElm.setAttribute("data-download-link-label", "下载代码");
    addClass(preElm, ["pre", "line-numbers", "rainbow-braces", "no-brace-hover"]);
    console.log(marked("```" + language[0] + "\n" + text + "\n```", { renderer: renderer }))
    preElm.innerHTML = marked("```" + language[0] + "\n" + text + "\n```", { renderer: renderer });
    table.parentNode.replaceChild(preElm, table);
  }

  function initPre() {
    var pres = document.querySelectorAll("pre");
    switch (window.location.host) {
      case "gitee.com":
        giteePre(pres);
        break;
      case "git.beanjs.com":
        myPre(pres);
        break;
      case "blog.csdn.net":
        csdnPre(pres);
        break;
      case "github.com":
        githubPre(pres);
        break;
      case "www.npmjs.com":
        npmjsPre(pres);
        break;
      case "segmentfault.com":
        segmentfaultPre(pres);;
        break;
      default:
        break;
    }
  }


  function segmentfaultPre(pres){
    var links = document.querySelectorAll("link[rel='stylesheet']");
    for(var i = 0; i < links.length; i++){
      if(links[i].href.indexOf("css/vendors.css") != -1){
        links[i].remove();
      }
    }
    for (var i = 0; i < pres.length; i++) {
      pres[i].setAttribute("data-download-link-label", "下载代码");
      var codes = pres[i].querySelectorAll("code");
      var language = listLanguages.filter(function (val) { return getLan([...pres[i].classList.values()], val); });
      addClass(pres[i], ["pre", "line-numbers", "rainbow-braces", "no-brace-hover"]);
      if (codes.length <= 0) {
        var text = pres[i].innerText;
        if (language.length <= 0) {
          language = [hljs.highlightAuto(text, listLanguages).language];
          language = [(language == undefined ? "javascript" : language)];
        }
        pres[i].innerHTML = marked("```" + language[0] + "\n" + text + "\n```", { renderer: renderer });
      }else{
        for (var j = 0; j < codes.length; j++) {
          language = listLanguages.filter(function (val) { return getLan([...codes[j].classList.values()], val); });
          var text = codes[j].innerText;
          if (language.length <= 0) {
            language = [hljs.highlightAuto(text, listLanguages).language];
            language = [(language == undefined ? "javascript" : language)];
          }
          pres[i].innerHTML = marked("```" + language[0] + "\n" + text + "\n```", { renderer: renderer });
        }
      }
    }
  }


  function npmjsPre(pres){
    for (var i = 0; i < pres.length; i++) {
      pres[i].setAttribute("data-download-link-label", "下载代码");
      addClass(pres[i], ["pre", "line-numbers", "rainbow-braces", "no-brace-hover"]);
      var codes = pres[i].querySelectorAll("code");
      var preclassList = pres[i].classList;
      var language = listLanguages.filter(function (val) {
          return getLan([...preclassList.values()], val);
        });
      if (language.length <= 0) {
        language = listLanguages.filter(function (val) {
          return getLan([...pres[i].parentNode.classList.values()], val);
        });
      }
      if (codes.length <= 0) {
        var text = pres[i].innerText;
        if (language.length <= 0) {
          language = [hljs.highlightAuto(text, listLanguages).language];
          language = [(language == undefined ? "javascript" : language)];
        }
        pres[i].innerHTML = marked("```" + language[0] + "\n" + text + "\n```", { renderer: renderer });
      }
    }
  }

  function githubPre(pres) {
    for (var i = 0; i < pres.length; i++) {
      pres[i].setAttribute("data-download-link-label", "下载代码");
      addClass(pres[i], ["pre", "line-numbers", "rainbow-braces", "no-brace-hover"]);
      var codes = pres[i].querySelectorAll("code");
      var preclassList = pres[i].classList;
      var listClassName = preclassList.values();
      var language = [...listClassName].filter(function (val) { return listLanguages.indexOf(val) > -1 });
      if (language.length <= 0) {
        language = [...pres[i].parentNode.classList.values()].filter(function (val) { return val.indexOf("highlight-source") > -1 });
      }
      if (codes.length <= 0) {
        var text = pres[i].innerText;
        if (language.length <= 0) {
          language = [hljs.highlightAuto(text, listLanguages).language];
          language = [(language == undefined ? "javascript" : language)];
        } else {
          language = [language[0].substring(17)];
        }
        pres[i].innerHTML = marked("```" + language[0] + "\n" + text + "\n```", { renderer: renderer });
      }else{
        for (var j = 0; j < codes.length; j++) {
          var text = codes[j].innerText;
          if (language.length <= 0) {
              language = [hljs.highlightAuto(text, listLanguages).language];
              language = [(language == undefined ? "javascript" : language)];
            }
          pres[i].innerHTML = marked("```" + language[0] + "\n" + text + "\n```", { renderer: renderer });
        }
      }
    }
  }


  function giteePre(pres) {
    for (var i = 0; i < pres.length; i++) {
      pres[i].setAttribute("data-download-link-label", "下载代码");
      addClass(pres[i], ["pre", "line-numbers", "rainbow-braces", "no-brace-hover"])
      var codes = pres[i].querySelectorAll("code");
      var preclassList = pres[i].classList;
      var listClassName = preclassList.values();
      var language = [...listClassName].filter(function (val) { return listLanguages.indexOf(val) > -1 });
      if (codes.length <= 0) {
        var text = pres[i].innerText;
        if (language.length <= 0) {
          language = [hljs.highlightAuto(text, listLanguages).language];
          language = [(language == undefined ? "javascript" : language)];
        }
        pres[i].innerHTML = marked("```" + language[0] + "\n" + text + "\n```", { renderer: renderer });
      }
    }
  }

  function csdnPre(pres) {
    removeElm(document.querySelectorAll("div[data-title='复制']"));
    removeElm(document.querySelectorAll("pre ul[class='pre-numbering']"));
    for (var i = 0; i < pres.length; i++) {
      pres[i].setAttribute("data-download-link-label", "下载代码");
      addClass(pres[i], ["pre", "line-numbers", "rainbow-braces", "no-brace-hover"]);
      var codes = pres[i].querySelectorAll("code");
      var preclassList = pres[i].classList;
      if (codes.length <= 0) {
        var text = pres[i].innerText;
        var listClassName = preclassList.values();
        var language = [...listClassName].filter(function (val) { return listLanguages.indexOf(val) > -1 });
        if (language.length <= 0) {
          language = [hljs.highlightAuto(text, listLanguages).language];
          language = [(language == undefined ? "javascript" : language)];
        }
        pres[i].innerHTML = marked("```" + language[0] + "\n" + text + "\n```", { renderer: renderer });
      } else {
        var listClassName = preclassList.values();
        var language = [...listClassName].filter(function (val) { return listLanguages.indexOf(val) > -1 });
        for (var j = 0; j < codes.length; j++) {
          var text = codes[j].innerText;
          if (language.length <= 0) {
            var languageName = [...codes[j].classList.values()].filter(function (val) { return val.indexOf("language-") > -1 });
            if (languageName.length > 0) {
              language = [languageName[0].substring(9)];
            } else {
              language = [hljs.highlightAuto(text, listLanguages).language];
              language = [(language == undefined ? "javascript" : language)];
            }
          }
          pres[i].innerHTML = marked("```" + language[0] + "\n" + text + "\n```", { renderer: renderer });
        }
      }
      removeClass([pres[i]], ["pre", "line-numbers", "rainbow-braces", "no-brace-hover"]);
      removeAttr([pres[i]], "name");
    }
  }

  function myPre(pres) {
    for (var i = 0; i < pres.length; i++) {
      var codes = pres[i].querySelectorAll("code");
      for (var j = 0; j < codes.length; j++) {
        if (codes[j].className.indexOf("language-mermaid") != -1) {
          var htm = codes[j].innerHTML;
          var oldNode = codes[j].parentNode;
          var parentNode = oldNode.parentNode;
          var div = document.createElement('div');
          div.innerHTML = htm;
          div.classList.add("mermaid");
          parentNode.replaceChild(div, oldNode);
        } else {
          pres[i].setAttribute("data-download-link-label", "下载代码");
          addClass(pres[i], ["pre", "line-numbers", "rainbow-braces", "no-brace-hover"]);
        }
        initDiff(codes[j]);
        codes[j].classList.remove("hljs");
      }
    }
  }

  function removeClass(nodes, classs) {
    for (var i = 0; i < nodes.length; i++) {
      var listClassName = [...nodes[i].classList.values()];
      for (var j = 0; j < listClassName.length; j++) {
        if (classs.indexOf(listClassName[j]) == -1) {
          nodes[i].classList.remove(listClassName[j]);
        }
      }
    }
  }

  function initDiff(code) {
    if (code.className.indexOf("language-diff") != -1) {
      code.classList.add("diff-highlight");
    }
  }

  function addClass(node, listClass) {
    for (var i = 0; i < listClass.length; i++) {
      node.classList.add(listClass[i]);
    }
  }

  function removeElm(nodes) {
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].remove();
    }
  }

  function removeAttr(nodes, attr) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.nodeType === 1) {
        nodes[i].removeAttribute(attr);
      }
      if (nodes[i].childNodes) {
        removeAttr(nodes[i].childNodes, attr);
      }
    }
  }


  function init() {
    var styles = document.querySelectorAll("link[rel='stylesheet']");
    for (var i = 0; i < styles.length; i++) {
      var href = styles[i].attributes["href"].nodeValue;
      if (href.indexOf("github.css") != -1) {
        styles[i].remove();
        break;
      }
    }
  }

  function getLan(listClass, val){
    if(val == "javascript"){
      return listClass.indexOf("js") > -1 || listClass.indexOf("javascript") > -1;
    }
    if(val == "shell"){
      return listClass.indexOf("sh") > -1 || listClass.indexOf("shell") > -1;
    }
    if(val == "go"){
      return listClass.indexOf("golang") > -1 || listClass.indexOf("go") > -1;
    }
    return listClass.indexOf(val) > -1;
  }
}