var opt = {};
var CodeMirrorConfig = {};

var extraKeys = {
  "Ctrl-J": "toMatchingTag",
  "Ctrl-B": "closeTag",
  "Ctrl-S": function (cm) {
    document.getElementById("download").click();
  }
} // 自定义快捷键

chrome.runtime.sendMessage({
  action: "get_options"
}, function (options) {
  if (!options) throw new Error("Failed to load options.");
  opt = options;
  configMermaid(options.theme1);
  CodeMirrorConfig = {
    theme: opt.theme,
    lineNumbers: true,  // 行号
    smartIndent: true,  // 
    autoRefresh: true,  // 自动刷新
    indentUnit: parseInt(opt.indent_size),  // 制表符空格数
    indentWithTabs: true,  // 启用tab
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    foldGutter: true,  // 代码折叠
    keyMap: 'sublime',  // 按键风格
    autofocus: false,  // 自动聚焦
    matchBrackets: true,  // 括号匹配
    autoCloseBrackets: true,  // 自动补齐括号
    styleActiveLine: true,  // 选择行样式
    matchTags: { bothTags: true },  // 突出显示光标周围标签
    showTrailingSpace: true,  // 空格补充下划线
    autoCloseTags: true,  // 该选项将在键入“ >”或“ /” 时自动关闭XML标签
    continueComments: true,  // 注释中回车继续注释
    highlightSelectionMatches: true,  // 高亮选中关键字
    scrollbarStyle: "simple",  // 下拉框样式
    annotateScrollbar: true,  // 提供在滚动条上显示标记以调出文档某些部分的功能
  }
  chrome.runtime.sendMessage({
    action: "insert_theme",
    theme: options.theme.split(" ")[0]
  }, function () {
  });
});

function initCode(elm, textarea) {
  var reg = new RegExp("\n\n", "g");
  var text = !elm.innerText ? elm.value : elm.innerText.replace(reg, "\n");;
  var mode = getMode_(elm.lang);
  if (!mode) {
    mode = getLanguage(text);
  }
  var editor = textarea ? textarea : document.createElement("textarea");
  if (!textarea) {
    editor.className = "editor";
    var h = elm.offsetHeight;
    elm.parentNode.replaceChild(editor, elm);
  }

  var myCodeMirror = CodeMirror.fromTextArea(editor, Object.assign({
    mode: mode["mime"],
    placeholder: "请输入内容......",  // 空白时添加指定内容
    extraKeys: extraKeys,
    readOnly: false  // 是否可写
  }, CodeMirrorConfig));
  myCodeMirror.setSize('auot', `${h + 49}px`);
  myCodeMirror.setOption("value", text);
  if (opt.font !== undefined) myCodeMirror.getWrapperElement().style.fontFamily = "'" + opt.font + "', monospace";
  if (opt.size !== undefined) myCodeMirror.getWrapperElement().style.fontSize = opt.size;
  toolBar(myCodeMirror, mode)
  if (textarea) {
    editCode(myCodeMirror, elm, text, mode);
    HotKeyHandler.Init(document, 0, "S", function () {
      document.getElementById("submit-file").click();
    })
  }
}

function editCode(myCodeMirror, elm, oldData, mode) {
  var previewElm = document.querySelector("#new_blob .js-commit-preview");
  var div = document.createElement("div");
  div.classList.className = "prose-diff js-preview-msg";
  div.id = "show-preview";
  previewElm.innerHTML = "";
  div.innerHTML = "<p class=\"js-warn-no-visible-changes preview-msg text-gray\"> There are no changes to show.</p>";
  previewElm.appendChild(div);
  myCodeMirror.on("change", function () {
    preview(oldData, myCodeMirror.getValue(), mode);
    elm.value = myCodeMirror.getValue();
  });
  var buttons = document.querySelectorAll("#new_blob .file-header button");
  buttons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      buttons.forEach(btn => {
        btn.classList.remove("selected");
        btn.removeAttribute("aria-current");
      });
      btn.classList.add("selected");
      btn.setAttribute("aria-current", true);
      var editFile = document.querySelector("#new_blob .js-code-editor");
      var className = btn.getAttribute("data-tab").indexOf("show-") != -1 ? "show-code" : "show-preview";
      editFile.classList.remove(className != "show-code" ? "show-code" : "show-preview");
      editFile.classList.add(className);
    })
  });
}

function preview(oldData, newData, mode) {
  var orig1 = "", panes = 2, highlight = true, connect = null, collapse = false;
  if (oldData == null) return;
  var target = document.getElementById("show-preview");
  target.innerHTML = "";
  var merge = CodeMirror.MergeView(target, Object.assign({
    value: oldData,
    origLeft: panes == 3 && !collapse && !connect ? orig1 : null,
    orig: newData,
    mode: mode.mime,
    highlightDifferences: highlight,
    readOnly: true,  // 是否可写
    connect: connect,
    collapseIdentical: collapse,
    revertButtons: true,//事件比较替换
  }, CodeMirrorConfig));
  if (merge.right.chunks.length === 0) {
    document.getElementById("submit-file").setAttribute("disabled", true);
    target.innerHTML = "<p class=\"js-warn-no-visible-changes preview-msg text-gray\"> There are no changes to show.</p>";
  } else {
    document.getElementById("submit-file").removeAttribute("disabled");
  }
}

async function toolBar(myCodeMirror, mode) {
  var elm = myCodeMirror.getWrapperElement();
  var div = document.createElement("div");

  setLang(div, myCodeMirror, mode);
  await setTheme(div, myCodeMirror);

  var aCopy = createElm("a", "复制");
  var divCopy = createElm("div", aCopy, "myToolbar-item");
  copy(aCopy, myCodeMirror);

  var aDownload = createElm("a", "下载代码");
  aDownload.addEventListener("click", function (e) {
    var ext = mode["ext"];
    download(ext ? ext[0] : "", myCodeMirror);
  });
  var divDownload = createElm("div", aDownload, "myToolbar-item");
  aDownload.id = "download";

  appendChilds(div, [divCopy, divDownload]);
  div.className = "myToolbar";
  elm.appendChild(div);
}

function setLang(elm, myCodeMirror, mode) {
  var uls = document.createElement("ul");
  CodeMirror.modeInfo.forEach(obj => {
    var li = document.createElement("li");
    li.innerText = obj.name;
    li.title = obj.name;
    mode.name === obj.name ? li.classList.add("is-selected") : null
    li.onmousedown = function () {
      this.parentNode.querySelector("li.is-selected").classList.remove("is-selected");
      myCodeMirror.setOption("mode", obj.mime);
      myCodeMirror.refresh();
      li.classList.add("is-selected");
      this.parentNode.parentNode.querySelector("a.langName").innerText = obj.name;
    }
    uls.appendChild(li);
  })
  var aLang = createElm("a", mode.name, "langName");
  aLang.href = "javascript:void(0)";
  aLang.onblur = function () {
    uls.style.display = "none";
  }
  aLang.onfocus = function () {
    uls.style.display = "inline";
  }
  var divLang = createElm("div", aLang, "myToolbar-item DivUl");
  divLang.appendChild(uls);
  elm.appendChild(divLang);
}

function setTheme(elm, myCodeMirror) {
  var promise = new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage({
      action: "get_themes"
    }, function (themes) {
      var uls = document.createElement("ul");
      themes.forEach(theme => {
        var li = document.createElement("li");
        li.innerText = theme;
        li.title = theme;
        opt.theme === theme ? li.classList.add("is-selected") : null
        li.onmousedown = function () {
          this.parentNode.querySelector("li.is-selected").classList.remove("is-selected");
          this.parentNode.parentNode.querySelector("a.themeName").innerText = theme;
          li.classList.add("is-selected");
          chrome.runtime.sendMessage({
            action: "insert_theme",
            theme: theme.split(" ")[0]
          }, function () {
            myCodeMirror.setOption("theme", theme);
            myCodeMirror.refresh();
          });
        }
        uls.appendChild(li);
      });
      var aTheme = createElm("a", opt.theme, "themeName");
      aTheme.href = "javascript:void(0)";
      aTheme.onblur = function () {
        uls.style.display = "none";
      }
      aTheme.onfocus = function () {
        uls.style.display = "inline";
      }
      var divTheme = createElm("div", aTheme, "myToolbar-item DivUl");
      divTheme.appendChild(uls);
      elm.appendChild(divTheme);
      resolve();
    })
  });
  return promise;
}

function copy(aCopy, myCodeMirror) {
  var clip = new ClipboardJS(aCopy, {
    'text': function () {
      var code = myCodeMirror.getSelection();
      return code ? code : myCodeMirror.getValue()
    }
  });

  clip.on('success', function (e) {
    aCopy.textContent = '复制成功!';
    resetText();
  });
  clip.on('error', function (e) {
    aCopy.textContent = 'Press Ctrl+C to copy';
    e.clearSelection();
    resetText();
  });

  function resetText() {
    setTimeout(function () {
      aCopy.textContent = '复制';
    }, 1500);
  }
}


function download(lang, myCodeMirror) {
  var code = myCodeMirror.getSelection();
  var ele = document.createElement('a');
  ele.download = "index." + lang;
  var blob = new Blob([code ? code : myCodeMirror.getValue()]);
  ele.href = URL.createObjectURL(blob);
  document.body.appendChild(ele);
  ele.click();
  document.body.removeChild(ele);
}

function appendChilds(elm, nodes) {
  nodes.forEach(node => {
    elm.appendChild(node);
  });
}

function createElm(name, obj, className) {
  var elm = document.createElement(name);
  className ? elm.className = className : null;
  typeof obj == "object" ? elm.appendChild(obj) : elm.innerText = obj;
  return elm;
}

function getMode_(lang) {
  if (!lang) {
    return undefined;
  }
  var mode = CodeMirror.findModeByName(lang);
  if (!mode) {
    mode = CodeMirror.findModeByFileName(lang);
  }
  if (!mode) {
    mode = CodeMirror.findModeByExtension(lang);
  }
  if (!mode) {
    mode = CodeMirror.findModeByMIME(lang);
  }
  return mode;
}

function getLanguage(text) {
  var listLanguages = ["html", "xml", "bash", "shell", "cpp", "css", "diff", "django", "dockerfile", "ruby", "go", "java", "javascript", "json", "less",
    "lisp", "lua", "makefile", "matlab", "nginx", "php", "powershell", "python", "r", "rust", "scss", "sql", "swift", "typescript", "vim", "xl"];
  var lang = hljs.highlightAuto(text, listLanguages).language;
  var mode = getMode_(lang);
  return !mode ? CodeMirror.modeInfo[0] : mode;
}

function configMermaid(theme) {
  var config = {
    theme: theme,
    logLevel: 'fatal',
    securityLevel: 'strict',
    startOnLoad: true,
    arrowMarkerAbsolute: false,
    flowchart: {
      htmlLabels: true,
      curve: 'linear',
    },
    sequence: {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
      mirrorActors: true,
      bottomMarginAdj: 1,
      useMaxWidth: true,
      rightAngles: false,
      showSequenceNumbers: false,
    },
    gantt: {
      titleTopMargin: 25,
      barHeight: 20,
      barGap: 4,
      topPadding: 50,
      leftPadding: 75,
      gridLineStartPadding: 35,
      fontSize: 11,
      fontFamily: '"Open-Sans", "sans-serif"',
      numberSectionStyles: 4,
      axisFormat: '%Y-%m-%d',
    }
  };
  mermaid.initialize(config);
}

var HotKeyHandler = {
  currentMainKey: null,
  currentValueKey: null,
  Init: function (elm, tag, value, func) {
    HotKeyHandler.Register(elm, tag, value, func);
  },
  Register: function (elm, tag, value, func) {
    var MainKey = "";
    switch (tag) {
      case 0:
        MainKey = 17;
        break;
    }
    elm.onkeyup = function (e) {
      HotKeyHandler.currentMainKey = null;
    }

    elm.onkeydown = function (event) {
      //获取键值 
      var keyCode = event.keyCode;
      var keyValue = String.fromCharCode(event.keyCode);
      if (HotKeyHandler.currentMainKey != null) {
        if (keyValue == value) {
          HotKeyHandler.currentMainKey = null;
          if (func != null) func();
          return false;
        }
      }
      if (keyCode == MainKey)
        HotKeyHandler.currentMainKey = keyCode;
    }
  }
} 