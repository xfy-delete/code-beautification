function fileHighlight() {
  /**
     * @param {Element} [container=document]
     */
  self.Prism.fileHighlight = function (container) {
    container = container || document;

    var Extensions = {
      'js': 'javascript',
      'py': 'python',
      'rb': 'ruby',
      'ps1': 'powershell',
      'psm1': 'powershell',
      'sh': 'bash',
      'bat': 'batch',
      'h': 'c',
      'tex': 'latex'
    };

    Array.prototype.slice.call(container.querySelectorAll('pre[data-src]')).forEach(function (pre) {
      // ignore if already loaded
      if (pre.hasAttribute('data-src-loaded')) {
        return;
      }

      // load current
      var src = pre.getAttribute('data-src');

      var language, parent = pre;
      var lang = /\blang(?:uage)?-([\w-]+)\b/i;
      while (parent && !lang.test(parent.className)) {
        parent = parent.parentNode;
      }

      if (parent) {
        language = (pre.className.match(lang) || [, ''])[1];
      }

      if (!language) {
        var extension = (src.match(/\.(\w+)$/) || [, ''])[1];
        language = Extensions[extension] || extension;
      }

      var code = document.createElement('code');
      code.className = 'language-' + language;

      pre.textContent = '';

      code.textContent = 'Loading…';

      pre.appendChild(code);

      var xhr = new XMLHttpRequest();

      xhr.open('GET', src, true);

      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {

          if (xhr.status < 400 && xhr.responseText) {
            code.textContent = xhr.responseText;

            Prism.highlightElement(code);
            // mark as loaded
            pre.setAttribute('data-src-loaded', '');
          }
          else if (xhr.status >= 400) {
            code.textContent = '✖ Error ' + xhr.status + ' while fetching file: ' + xhr.statusText;
          }
          else {
            code.textContent = '✖ Error: File does not exist or is empty';
          }
        }
      };

      xhr.send(null);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    // execute inside handler, for dropping Event as argument
    self.Prism.fileHighlight();
  });

}

function customClass() {

}

function showInvisibles() {
  var invisibles = {
    'tab': /\t/,
    'crlf': /\r\n/,
    'lf': /\n/,
    'cr': /\r/,
    'space': / /
  };


	/**
	 * Handles the recursive calling of `addInvisibles` for one token.
	 *
	 * @param {Object|Array} tokens The grammar or array which contains the token.
	 * @param {string|number} name The name or index of the token in `tokens`.
	 */
  function handleToken(tokens, name) {
    var value = tokens[name];

    var type = Prism.util.type(value);
    switch (type) {
      case 'RegExp':
        var inside = {};
        tokens[name] = {
          pattern: value,
          inside: inside
        };
        addInvisibles(inside);
        break;

      case 'Array':
        for (var i = 0, l = value.length; i < l; i++) {
          handleToken(value, i);
        }
        break;

      default: // 'Object'
        if (value != undefined) {
          var inside = value.inside || (value.inside = {});
          addInvisibles(inside);
        }
        break;
    }
  }

	/**
	 * Recursively adds patterns to match invisible characters to the given grammar (if not added already).
	 *
	 * @param {Object} grammar
	 */
  function addInvisibles(grammar) {
    if (!grammar || grammar['tab']) {
      return;
    }

    // assign invisibles here to "mark" the grammar in case of self references
    for (var name in invisibles) {
      if (invisibles.hasOwnProperty(name)) {
        grammar[name] = invisibles[name];
      }
    }

    for (var name in grammar) {
      if (grammar.hasOwnProperty(name) && !invisibles[name]) {
        if (name === 'rest') {
          addInvisibles(grammar['rest']);
        } else {
          handleToken(grammar, name);
        }
      }
    }
  }

  Prism.hooks.add('before-highlight', function (env) {
    addInvisibles(env.grammar);
  });
}

function lineNumbers() {
  /**
     * Plugin name which is used as a class name for <pre> which is activating the plugin
     * @type {String}
     */
  var PLUGIN_NAME = 'line-numbers';

	/**
	 * Regular expression used for determining line breaks
	 * @type {RegExp}
	 */
  var NEW_LINE_EXP = /\n(?!$)/g;

	/**
	 * Resizes line numbers spans according to height of line of code
	 * @param {Element} element <pre> element
	 */
  var _resizeElement = function (element) {
    var codeStyles = getStyles(element);
    var whiteSpace = codeStyles['white-space'];

    if (whiteSpace === 'pre-wrap' || whiteSpace === 'pre-line') {
      var codeElement = element.querySelector('code');
      var lineNumbersWrapper = element.querySelector('.line-numbers-rows');
      var lineNumberSizer = element.querySelector('.line-numbers-sizer');
      var codeLines = codeElement.textContent.split(NEW_LINE_EXP);

      if (!lineNumberSizer) {
        lineNumberSizer = document.createElement('span');
        lineNumberSizer.className = 'line-numbers-sizer';

        codeElement.appendChild(lineNumberSizer);
      }

      lineNumberSizer.style.display = 'block';

      codeLines.forEach(function (line, lineNumber) {
        lineNumberSizer.textContent = line || '\n';
        var lineSize = lineNumberSizer.getBoundingClientRect().height;
        lineNumbersWrapper.children[lineNumber].style.height = lineSize + 'px';
      });

      lineNumberSizer.textContent = '';
      lineNumberSizer.style.display = 'none';
    }
  };

	/**
	 * Returns style declarations for the element
	 * @param {Element} element
	 */
  var getStyles = function (element) {
    if (!element) {
      return null;
    }

    return window.getComputedStyle ? getComputedStyle(element) : (element.currentStyle || null);
  };

  window.addEventListener('resize', function () {
    Array.prototype.forEach.call(document.querySelectorAll('pre.' + PLUGIN_NAME), _resizeElement);
  });

  Prism.hooks.add('complete', function (env) {
    if (!env.code) {
      return;
    }

    var code = env.element;
    var pre = code.parentNode;

    // works only for <code> wrapped inside <pre> (not inline)
    if (!pre || !/pre/i.test(pre.nodeName)) {
      return;
    }

    // Abort if line numbers already exists
    if (code.querySelector('.line-numbers-rows')) {
      return;
    }

    var addLineNumbers = false;
    var lineNumbersRegex = /(?:^|\s)line-numbers(?:\s|$)/;

    for (var element = code; element; element = element.parentNode) {
      if (lineNumbersRegex.test(element.className)) {
        addLineNumbers = true;
        break;
      }
    }

    // only add line numbers if <code> or one of its ancestors has the `line-numbers` class
    if (!addLineNumbers) {
      return;
    }

    // Remove the class 'line-numbers' from the <code>
    code.className = code.className.replace(lineNumbersRegex, ' ');
    // Add the class 'line-numbers' to the <pre>
    if (!lineNumbersRegex.test(pre.className)) {
      pre.className += ' line-numbers';
    }

    var match = env.code.match(NEW_LINE_EXP);
    var linesNum = match ? match.length + 1 : 1;
    var lineNumbersWrapper;

    var lines = new Array(linesNum + 1).join('<span></span>');

    lineNumbersWrapper = document.createElement('span');
    lineNumbersWrapper.setAttribute('aria-hidden', 'true');
    lineNumbersWrapper.className = 'line-numbers-rows';
    lineNumbersWrapper.innerHTML = lines;

    if (pre.hasAttribute('data-start')) {
      pre.style.counterReset = 'linenumber ' + (parseInt(pre.getAttribute('data-start'), 10) - 1);
    }

    env.element.appendChild(lineNumbersWrapper);

    _resizeElement(pre);

    Prism.hooks.run('line-numbers', env);
  });

  Prism.hooks.add('line-numbers', function (env) {
    env.plugins = env.plugins || {};
    env.plugins.lineNumbers = true;
  });

	/**
	 * Global exports
	 */
  Prism.plugins.lineNumbers = {
		/**
		 * Get node for provided line number
		 * @param {Element} element pre element
		 * @param {Number} number line number
		 * @return {Element|undefined}
		 */
    getLine: function (element, number) {
      if (element.tagName !== 'PRE' || !element.classList.contains(PLUGIN_NAME)) {
        return;
      }

      var lineNumberRows = element.querySelector('.line-numbers-rows');
      var lineNumberStart = parseInt(element.getAttribute('data-start'), 10) || 1;
      var lineNumberEnd = lineNumberStart + (lineNumberRows.children.length - 1);

      if (number < lineNumberStart) {
        number = lineNumberStart;
      }
      if (number > lineNumberEnd) {
        number = lineNumberEnd;
      }

      var lineIndex = number - lineNumberStart;

      return lineNumberRows.children[lineIndex];
    }
  };
}

function lineHighlight() {
  function $$(expr, con) {
    return Array.prototype.slice.call((con || document).querySelectorAll(expr));
  }

  function hasClass(element, className) {
    className = " " + className + " ";
    return (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf(className) > -1
  }

  function callFunction(func) {
    func();
  }

  // Some browsers round the line-height, others don't.
  // We need to test for it to position the elements properly.
  var isLineHeightRounded = (function () {
    var res;
    return function () {
      if (typeof res === 'undefined') {
        var d = document.createElement('div');
        d.style.fontSize = '13px';
        d.style.lineHeight = '1.5';
        d.style.padding = 0;
        d.style.border = 0;
        d.innerHTML = '&nbsp;<br />&nbsp;';
        document.body.appendChild(d);
        // Browsers that round the line-height should have offsetHeight === 38
        // The others should have 39.
        res = d.offsetHeight === 38;
        document.body.removeChild(d);
      }
      return res;
    }
  }());

	/**
	 * Highlights the lines of the given pre.
	 *
	 * This function is split into a DOM measuring and mutate phase to improve performance.
	 * The returned function mutates the DOM when called.
	 *
	 * @param {HTMLElement} pre
	 * @param {string} [lines]
	 * @param {string} [classes='']
	 * @returns {() => void}
	 */
  function highlightLines(pre, lines, classes) {
    lines = typeof lines === 'string' ? lines : pre.getAttribute('data-line');

    var ranges = lines.replace(/\s+/g, '').split(',');
    var offset = +pre.getAttribute('data-line-offset') || 0;

    var parseMethod = isLineHeightRounded() ? parseInt : parseFloat;
    var lineHeight = parseMethod(getComputedStyle(pre).lineHeight);
    var hasLineNumbers = hasClass(pre, 'line-numbers');
    var parentElement = hasLineNumbers ? pre : pre.querySelector('code') || pre;
    var mutateActions = /** @type {(() => void)[]} */ ([]);

    ranges.forEach(function (currentRange) {
      var range = currentRange.split('-');

      var start = +range[0];
      var end = +range[1] || start;

      var line = pre.querySelector('.line-highlight[data-range="' + currentRange + '"]') || document.createElement('div');

      mutateActions.push(function () {
        line.setAttribute('aria-hidden', 'true');
        line.setAttribute('data-range', currentRange);
        line.className = (classes || '') + ' line-highlight';
      });

      // if the line-numbers plugin is enabled, then there is no reason for this plugin to display the line numbers
      if (hasLineNumbers && Prism.plugins.lineNumbers) {
        var startNode = Prism.plugins.lineNumbers.getLine(pre, start);
        var endNode = Prism.plugins.lineNumbers.getLine(pre, end);

        if (startNode) {
          var top = startNode.offsetTop + 'px';
          mutateActions.push(function () {
            line.style.top = top;
          });
        }

        if (endNode) {
          var height = (endNode.offsetTop - startNode.offsetTop) + endNode.offsetHeight + 'px';
          mutateActions.push(function () {
            line.style.height = height;
          });
        }
      } else {
        mutateActions.push(function () {
          line.setAttribute('data-start', start);

          if (end > start) {
            line.setAttribute('data-end', end);
          }

          line.style.top = (start - offset - 1) * lineHeight + 'px';

          line.textContent = new Array(end - start + 2).join(' \n');
        });
      }

      mutateActions.push(function () {
        // allow this to play nicely with the line-numbers plugin
        // need to attack to pre as when line-numbers is enabled, the code tag is relatively which screws up the positioning
        parentElement.appendChild(line);
      });
    });

    return function () {
      mutateActions.forEach(callFunction);
    };
  }

  function applyHash() {
    var hash = location.hash.slice(1);

    // Remove pre-existing temporary lines
    $$('.temporary.line-highlight').forEach(function (line) {
      line.parentNode.removeChild(line);
    });

    var range = (hash.match(/\.([\d,-]+)$/) || [, ''])[1];

    if (!range || document.getElementById(hash)) {
      return;
    }

    var id = hash.slice(0, hash.lastIndexOf('.')),
      pre = document.getElementById(id);

    if (!pre) {
      return;
    }

    if (!pre.hasAttribute('data-line')) {
      pre.setAttribute('data-line', '');
    }

    var mutateDom = highlightLines(pre, range, 'temporary ');
    mutateDom();

    document.querySelector('.temporary.line-highlight').scrollIntoView();
  }

  var fakeTimer = 0; // Hack to limit the number of times applyHash() runs

  Prism.hooks.add('before-sanity-check', function (env) {
    var pre = env.element.parentNode;
    var lines = pre && pre.getAttribute('data-line');

    if (!pre || !lines || !/pre/i.test(pre.nodeName)) {
      return;
    }

		/*
		 * Cleanup for other plugins (e.g. autoloader).
		 *
		 * Sometimes <code> blocks are highlighted multiple times. It is necessary
		 * to cleanup any left-over tags, because the whitespace inside of the <div>
		 * tags change the content of the <code> tag.
		 */
    var num = 0;
    $$('.line-highlight', pre).forEach(function (line) {
      num += line.textContent.length;
      line.parentNode.removeChild(line);
    });
    // Remove extra whitespace
    if (num && /^( \n)+$/.test(env.code.slice(-num))) {
      env.code = env.code.slice(0, -num);
    }
  });

  Prism.hooks.add('complete', function completeHook(env) {
    var pre = env.element.parentNode;
    var lines = pre && pre.getAttribute('data-line');

    if (!pre || !lines || !/pre/i.test(pre.nodeName)) {
      return;
    }

    clearTimeout(fakeTimer);

    var hasLineNumbers = Prism.plugins.lineNumbers;
    var isLineNumbersLoaded = env.plugins && env.plugins.lineNumbers;

    if (hasClass(pre, 'line-numbers') && hasLineNumbers && !isLineNumbersLoaded) {
      Prism.hooks.add('line-numbers', completeHook);
    } else {
      var mutateDom = highlightLines(pre, lines);
      mutateDom();
      fakeTimer = setTimeout(applyHash, 1);
    }
  });

  window.addEventListener('hashchange', applyHash);
  window.addEventListener('resize', function () {
    var actions = [];
    $$('pre[data-line]').forEach(function (pre) {
      actions.push(highlightLines(pre));
    });
    actions.forEach(callFunction);
  });

}

function copy() {

  Prism.plugins.toolbar.registerButton('copy-to-clipboard', function (env) {
    var linkCopy = document.createElement('button');
    linkCopy.textContent = '复制';

    registerClipboard();

    return linkCopy;

    function registerClipboard() {
      var clip = new ClipboardJS(linkCopy, {
        'text': function () {
          return env.code;
        }
      });

      clip.on('success', function () {
        linkCopy.textContent = '复制成功!';

        resetText();
      });
      clip.on('error', function () {
        linkCopy.textContent = 'Press Ctrl+C to copy';

        resetText();
      });
    }

    function resetText() {
      setTimeout(function () {
        linkCopy.textContent = '复制';
      }, 1500);
    }
  });
}

/**
 * 下载按钮
 */
function download() {
  Prism.plugins.toolbar.registerButton('download-file', function (env) {
    var file_type = {};
    file_type["python"] = "py";
    file_type["C"] = "c";
    file_type["C++"] = "cpp";
    var pre = env.element.parentNode;
    var download = document.createElement('a');
    download.textContent = pre.getAttribute('data-download-link-label') || 'Download';
    download.onclick = function () {
      var ele = document.createElement('a');
      if (!file_type[env.language]) {
        ele.download = "index." + env.language;
      } else {
        ele.download = "index." + file_type[env.language];
      }
      var blob = new Blob([env.code]);
      ele.href = URL.createObjectURL(blob);
      document.body.appendChild(ele);
      ele.click();
      document.body.removeChild(ele);
    };
    return download;
  });
}

/**
 * 括号突出
 */
function matchBraces() {
  var MATCH_ALL_CLASS = /(?:^|\s)match-braces(?:\s|$)/;

  var BRACE_HOVER_CLASS = /(?:^|\s)brace-hover(?:\s|$)/;
  var BRACE_SELECTED_CLASS = /(?:^|\s)brace-selected(?:\s|$)/;

  var NO_BRACE_HOVER_CLASS = /(?:^|\s)no-brace-hover(?:\s|$)/;
  var NO_BRACE_SELECT_CLASS = /(?:^|\s)no-brace-select(?:\s|$)/;

  var PARTNER = {
    '(': ')',
    '[': ']',
    '{': '}',
  };

  var NAMES = {
    '(': 'brace-round',
    '[': 'brace-square',
    '{': 'brace-curly',
  };

  var LEVEL_WARP = 12;

  var pairIdCounter = 0;

  var BRACE_ID_PATTERN = /^(pair-\d+-)(open|close)$/;

  /**
   * Returns the brace partner given one brace of a brace pair.
   *
   * @param {HTMLElement} brace
   * @returns {HTMLElement}
   */
  function getPartnerBrace(brace) {
    var match = BRACE_ID_PATTERN.exec(brace.id);
    return document.querySelector('#' + match[1] + (match[2] == 'open' ? 'close' : 'open'));
  }

  /**
   * @this {HTMLElement}
   */
  function hoverBrace() {
    for (var parent = this.parentElement; parent; parent = parent.parentElement) {
      if (NO_BRACE_HOVER_CLASS.test(parent.className)) {
        return;
      }
    }

    [this, getPartnerBrace(this)].forEach(function (ele) {
      ele.className = (ele.className.replace(BRACE_HOVER_CLASS, ' ') + ' brace-hover').replace(/\s+/g, ' ');
    });
  }
  /**
   * @this {HTMLElement}
   */
  function leaveBrace() {
    [this, getPartnerBrace(this)].forEach(function (ele) {
      ele.className = ele.className.replace(BRACE_HOVER_CLASS, ' ');
    });
  }
  /**
   * @this {HTMLElement}
   */
  function clickBrace() {
    for (var parent = this.parentElement; parent; parent = parent.parentElement) {
      if (NO_BRACE_SELECT_CLASS.test(parent.className)) {
        return;
      }
    }

    [this, getPartnerBrace(this)].forEach(function (ele) {
      ele.className = (ele.className.replace(BRACE_SELECTED_CLASS, ' ') + ' brace-selected').replace(/\s+/g, ' ');
    });
  }

  Prism.hooks.add('complete', function (env) {

    /** @type {HTMLElement} */
    var code = env.element;
    var pre = code.parentElement;

    if (!pre || pre.tagName != 'PRE') {
      return;
    }

    // find the braces to match
    /** @type {string[]} */
    var toMatch = [];
    for (var ele = code; ele; ele = ele.parentElement) {
      if (MATCH_ALL_CLASS.test(ele.className)) {
        toMatch.push('(', '[', '{');
        break;
      }
    }

    if (toMatch.length == 0) {
      // nothing to match
      return;
    }

    if (!pre.__listenerAdded) {
      // code blocks might be highlighted more than once
      pre.addEventListener('mousedown', function removeBraceSelected() {
        // the code element might have been replaced
        var code = pre.querySelector('code');
        Array.prototype.slice.call(code.querySelectorAll('.brace-selected')).forEach(function (element) {
          element.className = element.className.replace(BRACE_SELECTED_CLASS, ' ');
        });
      });
      Object.defineProperty(pre, '__listenerAdded', { value: true });
    }

    /** @type {HTMLSpanElement[]} */
    var punctuation = Array.prototype.slice.call(code.querySelectorAll('span.token.punctuation'));

    /** @type {{ index: number, open: boolean, element: HTMLElement }[]} */
    var allBraces = [];

    toMatch.forEach(function (open) {
      var close = PARTNER[open];
      var name = NAMES[open];

      /** @type {[number, number][]} */
      var pairs = [];
      /** @type {number[]} */
      var openStack = [];

      for (var i = 0; i < punctuation.length; i++) {
        var element = punctuation[i];
        if (element.childElementCount == 0) {
          var text = element.textContent;
          if (text === open) {
            allBraces.push({ index: i, open: true, element: element });
            element.className += ' ' + name;
            element.className += ' brace-open';
            openStack.push(i);
          } else if (text === close) {
            allBraces.push({ index: i, open: false, element: element });
            element.className += ' ' + name;
            element.className += ' brace-close';
            if (openStack.length) {
              pairs.push([i, openStack.pop()]);
            }
          }
        }
      }

      pairs.forEach(function (pair) {
        var pairId = 'pair-' + (pairIdCounter++) + '-';

        var openEle = punctuation[pair[0]];
        var closeEle = punctuation[pair[1]];

        openEle.id = pairId + 'open';
        closeEle.id = pairId + 'close';

        [openEle, closeEle].forEach(function (ele) {
          ele.addEventListener('mouseenter', hoverBrace);
          ele.addEventListener('mouseleave', leaveBrace);
          ele.addEventListener('click', clickBrace);
        });
      });
    });

    var level = 0;
    allBraces.sort(function (a, b) { return a.index - b.index; });
    allBraces.forEach(function (brace) {
      if (brace.open) {
        brace.element.className += ' brace-level-' + (level % LEVEL_WARP + 1);
        level++;
      } else {
        level = Math.max(0, level - 1);
        brace.element.className += ' brace-level-' + (level % LEVEL_WARP + 1);
      }
    });

  });
}

function showLanguage() {
  // The languages map is built automatically with gulp
  var Languages = /*languages_placeholder[*/{
    "html": "HTML",
    "xml": "XML",
    "svg": "SVG",
    "mathml": "MathML",
    "css": "CSS",
    "clike": "C-like",
    "js": "JavaScript",
    "abap": "ABAP",
    "abnf": "Augmented Backus–Naur form",
    "antlr4": "ANTLR4",
    "g4": "ANTLR4",
    "apacheconf": "Apache Configuration",
    "apl": "APL",
    "aql": "AQL",
    "arff": "ARFF",
    "asciidoc": "AsciiDoc",
    "adoc": "AsciiDoc",
    "asm6502": "6502 Assembly",
    "aspnet": "ASP.NET (C#)",
    "autohotkey": "AutoHotkey",
    "autoit": "AutoIt",
    "shell": "Bash",
    "basic": "BASIC",
    "bbcode": "BBcode",
    "bnf": "Backus–Naur form",
    "rbnf": "Routing Backus–Naur form",
    "conc": "Concurnas",
    "csharp": "C#",
    "cs": "C#",
    "dotnet": "C#",
    "cpp": "C++",
    "cil": "CIL",
    "coffee": "CoffeeScript",
    "cmake": "CMake",
    "csp": "Content-Security-Policy",
    "css-extras": "CSS Extras",
    "dax": "DAX",
    "django": "Django/Jinja2",
    "jinja2": "Django/Jinja2",
    "dns-zone-file": "DNS zone file",
    "dns-zone": "DNS zone file",
    "dockerfile": "Docker",
    "ebnf": "Extended Backus–Naur form",
    "ejs": "EJS",
    "etlua": "Embedded Lua templating",
    "erb": "ERB",
    "excel-formula": "Excel Formula",
    "xlsx": "Excel Formula",
    "xls": "Excel Formula",
    "fsharp": "F#",
    "firestore-security-rules": "Firestore security rules",
    "ftl": "FreeMarker Template Language",
    "gcode": "G-code",
    "gdscript": "GDScript",
    "gedcom": "GEDCOM",
    "glsl": "GLSL",
    "gml": "GameMaker Language",
    "gamemakerlanguage": "GameMaker Language",
    "graphql": "GraphQL",
    "hs": "Haskell",
    "hcl": "HCL",
    "http": "HTTP",
    "hpkp": "HTTP Public-Key-Pins",
    "hsts": "HTTP Strict-Transport-Security",
    "ichigojam": "IchigoJam",
    "inform7": "Inform 7",
    "javadoc": "JavaDoc",
    "javadoclike": "JavaDoc-like",
    "javastacktrace": "Java stack trace",
    "jq": "JQ",
    "jsdoc": "JSDoc",
    "js-extras": "JS Extras",
    "js-templates": "JS Templates",
    "json": "JSON",
    "jsonp": "JSONP",
    "json5": "JSON5",
    "latex": "LaTeX",
    "tex": "TeX",
    "context": "ConTeXt",
    "lilypond": "LilyPond",
    "ly": "LilyPond",
    "emacs": "Lisp",
    "elisp": "Lisp",
    "emacs-lisp": "Lisp",
    "lolcode": "LOLCODE",
    "md": "Markdown",
    "markup-templating": "Markup templating",
    "matlab": "MATLAB",
    "mel": "MEL",
    "moon": "MoonScript",
    "n1ql": "N1QL",
    "n4js": "N4JS",
    "n4jsd": "N4JS",
    "nand2tetris-hdl": "Nand To Tetris HDL",
    "nasm": "NASM",
    "neon": "NEON",
    "nginx": "nginx",
    "nsis": "NSIS",
    "objectivec": "Objective-C",
    "ocaml": "OCaml",
    "opencl": "OpenCL",
    "parigp": "PARI/GP",
    "objectpascal": "Object Pascal",
    "pcaxis": "PC-Axis",
    "px": "PC-Axis",
    "php": "PHP",
    "phpdoc": "PHPDoc",
    "php-extras": "PHP Extras",
    "plsql": "PL/SQL",
    "powerquery": "PowerQuery",
    "pq": "PowerQuery",
    "mscript": "PowerQuery",
    "powershell": "PowerShell",
    "properties": ".properties",
    "protobuf": "Protocol Buffers",
    "py": "Python",
    "q": "Q (kdb+ database)",
    "qml": "QML",
    "jsx": "React JSX",
    "tsx": "React TSX",
    "renpy": "Ren'py",
    "rest": "reST (reStructuredText)",
    "robotframework": "Robot Framework",
    "robot": "Robot Framework",
    "rb": "Ruby",
    "sas": "SAS",
    "sass": "Sass (Sass)",
    "scss": "Sass (Scss)",
    "shell-session": "Shell session",
    "solidity": "Solidity (Ethereum)",
    "solution-file": "Solution file",
    "sln": "Solution file",
    "soy": "Soy (Closure Template)",
    "sparql": "SPARQL",
    "rq": "SPARQL",
    "splunk-spl": "Splunk SPL",
    "sqf": "SQF: Status Quo Function (Arma 3)",
    "sql": "SQL",
    "tap": "TAP",
    "toml": "TOML",
    "tt2": "Template Toolkit 2",
    "trig": "TriG",
    "ts": "TypeScript",
    "t4-cs": "T4 Text Templates (C#)",
    "t4": "T4 Text Templates (C#)",
    "t4-vb": "T4 Text Templates (VB)",
    "t4-templating": "T4 templating",
    "vbnet": "VB.Net",
    "vhdl": "VHDL",
    "vim": "vim",
    "visual-basic": "Visual Basic",
    "vb": "Visual Basic",
    "wasm": "WebAssembly",
    "wiki": "Wiki markup",
    "xeoracube": "XeoraCube",
    "xojo": "Xojo (REALbasic)",
    "xquery": "XQuery",
    "yaml": "YAML",
    "yml": "YAML"
  }/*]*/;

  Prism.plugins.toolbar.registerButton('show-language', function (env) {
    var pre = env.element.parentNode;
    if (!pre || !/pre/i.test(pre.nodeName)) {
      return;
    }

    /**
     * Tries to guess the name of a language given its id.
     *
     * @param {string} id The language id.
     * @returns {string}
     */
    function guessTitle(id) {
      if (!id) {
        return id;
      }
      return (id.substring(0, 1).toUpperCase() + id.substring(1)).replace(/s(?=cript)/, 'S');
    }

    var language = pre.getAttribute('data-language') || Languages[env.language] || guessTitle(env.language);

    if (!language) {
      return;
    }
    var element = document.createElement('span');
    element.textContent = language;

    return element;
  });
}

function jSONPHighlight() {
  /**
     * @callback Adapter
     * @param {any} response
     * @param {HTMLPreElement} [pre]
     * @returns {string}
     */

	/**
	 * The list of adapter which will be used if `data-adapter` is not specified.
	 *
	 * @type {Array.<{adapter: Adapter, name: string}>}
	 */
  var adapters = [];

	/**
	 * Adds a new function to the list of adapters.
	 *
	 * If the given adapter is already registered or not a function or there is an adapter with the given name already,
	 * nothing will happen.
	 *
	 * @param {Adapter} adapter The adapter to be registered.
	 * @param {string} [name] The name of the adapter. Defaults to the function name of `adapter`.
	 */
  function registerAdapter(adapter, name) {
    name = name || adapter.name;
    if (typeof adapter === "function" && !getAdapter(adapter) && !getAdapter(name)) {
      adapters.push({ adapter: adapter, name: name });
    }
  }
	/**
	 * Returns the given adapter itself, if registered, or a registered adapter with the given name.
	 *
	 * If no fitting adapter is registered, `null` will be returned.
	 *
	 * @param {string|Function} adapter The adapter itself or the name of an adapter.
	 * @returns {Adapter} A registered adapter or `null`.
	 */
  function getAdapter(adapter) {
    if (typeof adapter === "function") {
      for (var i = 0, item; item = adapters[i++];) {
        if (item.adapter.valueOf() === adapter.valueOf()) {
          return item.adapter;
        }
      }
    }
    else if (typeof adapter === "string") {
      for (var i = 0, item; item = adapters[i++];) {
        if (item.name === adapter) {
          return item.adapter;
        }
      }
    }
    return null;
  }
	/**
	 * Remove the given adapter or the first registered adapter with the given name from the list of
	 * registered adapters.
	 *
	 * @param {string|Function} adapter The adapter itself or the name of an adapter.
	 */
  function removeAdapter(adapter) {
    if (typeof adapter === "string") {
      adapter = getAdapter(adapter);
    }
    if (typeof adapter === "function") {
      var index = adapters.map(function (item) { return item.adapter; }).indexOf(adapter);
      if (index >= 0) {
        adapters.splice(index, 1);
      }
    }
  }

  registerAdapter(function github(rsp, el) {
    if (rsp && rsp.meta && rsp.data) {
      if (rsp.meta.status && rsp.meta.status >= 400) {
        return "Error: " + (rsp.data.message || rsp.meta.status);
      }
      else if (typeof (rsp.data.content) === "string") {
        return typeof (atob) === "function"
          ? atob(rsp.data.content.replace(/\s/g, ""))
          : "Your browser cannot decode base64";
      }
    }
    return null;
  }, 'github');
  registerAdapter(function gist(rsp, el) {
    if (rsp && rsp.meta && rsp.data && rsp.data.files) {
      if (rsp.meta.status && rsp.meta.status >= 400) {
        return "Error: " + (rsp.data.message || rsp.meta.status);
      }

      var files = rsp.data.files;
      var filename = el.getAttribute("data-filename");
      if (filename == null) {
        // Maybe in the future we can somehow render all files
        // But the standard <script> include for gists does that nicely already,
        // so that might be getting beyond the scope of this plugin
        for (var key in files) {
          if (files.hasOwnProperty(key)) {
            filename = key;
            break;
          }
        }
      }

      if (files[filename] !== undefined) {
        return files[filename].content;
      }
      return "Error: unknown or missing gist file " + filename;
    }
    return null;
  }, 'gist');
  registerAdapter(function bitbucket(rsp, el) {
    if (rsp && rsp.node && typeof (rsp.data) === "string") {
      return rsp.data;
    }
    return null;
  }, 'bitbucket');

  var jsonpcb = 0,
    loadMsg = "Loading\u2026";

	/**
	 * Highlights all `pre` elements with an `data-jsonp` by requesting the specified JSON and using the specified adapter
	 * or a registered adapter to extract the code to highlight from the response. The highlighted code will be inserted
	 * into the `pre` element.
	 */
  function highlight() {
    Array.prototype.slice.call(document.querySelectorAll("pre[data-jsonp]")).forEach(function (pre) {
      pre.textContent = "";

      var code = document.createElement("code");
      code.textContent = loadMsg;
      pre.appendChild(code);

      var adapterName = pre.getAttribute("data-adapter");
      var adapter = null;
      if (adapterName) {
        if (typeof window[adapterName] === "function") {
          adapter = window[adapterName];
        }
        else {
          code.textContent = "JSONP adapter function '" + adapterName + "' doesn't exist";
          return;
        }
      }

      var cb = "prismjsonp" + jsonpcb++;

      var uri = document.createElement("a");
      var src = uri.href = pre.getAttribute("data-jsonp");
      uri.href += (uri.search ? "&" : "?") + (pre.getAttribute("data-callback") || "callback") + "=" + cb;

      var timeout = setTimeout(function () {
        // we could clean up window[cb], but if the request finally succeeds, keeping it around is a good thing
        if (code.textContent === loadMsg) {
          code.textContent = "Timeout loading '" + src + "'";
        }
      }, 5000);

      var script = document.createElement("script");
      script.src = uri.href;

      window[cb] = function (rsp) {
        document.head.removeChild(script);
        clearTimeout(timeout);
        delete window[cb];

        var data = "";

        if (adapter) {
          data = adapter(rsp, pre);
        }
        else {
          for (var p in adapters) {
            data = adapters[p].adapter(rsp, pre);
            if (data !== null) {
              break;
            }
          }
        }

        if (data === null) {
          code.textContent = "Cannot parse response (perhaps you need an adapter function?)";
        }
        else {
          code.textContent = data;
          Prism.highlightElement(code);
        }
      };

      document.head.appendChild(script);
    });
  }

  Prism.plugins.jsonphighlight = {
    registerAdapter: registerAdapter,
    removeAdapter: removeAdapter,
    highlight: highlight
  };

  highlight();
}

function highlightKeywords() {
  Prism.hooks.add('wrap', function (env) {
    if (env.type !== "keyword") {
      return;
    }
    env.classes.push('keyword-' + env.content);
  });

}

function toolbar() {
  (function () {
    if (typeof self === 'undefined' || !self.Prism || !self.document) {
      return;
    }
    if (!Prism.plugins.toolbar) {
      console.warn('Copy to Clipboard plugin loaded before Toolbar plugin.');
      return;
    }

    highlightKeywords();
    jSONPHighlight();
    showLanguage();
    fileHighlight();
    customClass();
    showInvisibles();
    lineNumbers();
    lineHighlight();
    copy();
    download();
    matchBraces();

  })();

}