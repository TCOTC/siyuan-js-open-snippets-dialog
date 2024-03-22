[中文](https://github.com/TCOTC/siyuan-js-open-snippets-dialog/blob/main/README_zh_CN.md)

# SiYuan Open Snippets Dialog plugin

### JS

Tip: I don't know how to make a plugin to make the added top bar buttons display continuously, so every time you open the plugin a button will be added and the added buttons will disappear after restarting the SiYuan Notes software. So this plugin works only as a demo code, if you need it please copy the JS code below and add it to the JS code snippet.

If you are able and willing to help me improve the plugin, please submit [Pull Requests](https://github.com/TCOTC/siyuan-js-open-snippets-dialog/pulls) or [Issue](https://github.com/TCOTC/siyuan-js-open-snippets-dialog/issues) to the [code repository](https://github.com/TCOTC/siyuan-js-open-snippets-dialog) after modifying the code.

```js
/**
 * Add a button to the top bar to quickly open the snippet dialog JS https://github.com/TCOTC/siyuan-js-open-snippets-dialog
 */
let g_addSnippets = true;

function addSnippets() {
  let barMode = document.getElementById("barMode");
  barMode.insertAdjacentHTML(
    "afterend",
    '<div id="barSnippets_simulate" class="toolbar__item ariaLabel" aria-label="代码片段/Snippets"></div>'
  );
  let settingBtn = document.getElementById("barSnippets_simulate");
  settingBtn.innerHTML = `<svg><use xlink:href="#iconCode"></use></svg>`;

  settingBtn.addEventListener(
    "click",
    function (e) {
        dispatchKeyEvent("config");

        setTimeout(function() {
            var element = document.querySelector('li[data-name="appearance"]');
        
            var event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
            });
        
            element.dispatchEvent(event);
        }, 500);

        setTimeout(function() {
            var button = document.getElementById('codeSnippet');
        
            var clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
            });
        
            button.dispatchEvent(clickEvent);
        
        }, 600);
    }
  );
}


/**
 * 
 */
function dispatchKeyEvent(functionName) {
  let keyInit = parseHotKeyStr(window.top.siyuan.config.keymap.general[functionName].custom);
  keyInit["bubbles"] = true;
  let keydownEvent = new KeyboardEvent('keydown', keyInit);
  document.getElementsByTagName("body")[0].dispatchEvent(keydownEvent);
  let keyUpEvent = new KeyboardEvent('keyup', keyInit);
  document.getElementsByTagName("body")[0].dispatchEvent(keyUpEvent);
}

/**
 * 
 * @param {*} hotkeyStr 思源hotkey格式 Refer: https://github.com/siyuan-note/siyuan/blob/d0f011b1a5b12e5546421f8bd442606bf0b5ad86/app/src/protyle/util/hotKey.ts#L4
 * @returns KeyboardEventInit Refer: https://developer.mozilla.org/zh-CN/docs/Web/API/KeyboardEvent/KeyboardEvent
 */
function parseHotKeyStr(hotkeyStr) {
  let result = {
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    key: 'A',
    keyCode: 0
  }
  if (hotkeyStr == "" || hotkeyStr == undefined || hotkeyStr == null) {
    console.error("解析快捷键设置失败", hotkeyStr);
    throw new Error("解析快捷键设置失败");
  }
  let onlyKey = hotkeyStr;
  if (hotkeyStr.indexOf("⌘") != -1) {
    result.ctrlKey = true;
    onlyKey = onlyKey.replace("⌘", "");
  }
  if (hotkeyStr.indexOf("⌥") != -1) {
    result.altKey = true;
    onlyKey = onlyKey.replace("⌥", "");
  }
  if (hotkeyStr.indexOf("⇧") != -1) {
    result.shiftKey = true;
    onlyKey = onlyKey.replace("⇧", "");
  }
  // 未处理 windows btn （MetaKey） 
  result.key = onlyKey;
  // 在https://github.com/siyuan-note/siyuan/commit/70acd57c4b4701b973a8ca93fadf6c003b24c789#diff-558f9f531a326d2fd53151e3fc250ac4bd545452ba782b0c7c18765a37a4e2cc
  // 更改中，思源改为使用keyCode判断快捷键按下事件，这里进行了对应的转换
  // 另请参考该提交中涉及的文件
  result.keyCode = keyCodeList[result.key];
  console.assert(result.keyCode != undefined, `keyCode转换错误,key为${result.key}`);
  switch (result.key) {
    case "→": {
      result.key = "ArrowRight";
      break;
    }
    case "←": {
      result.key = "ArrowLeft";
      break;
    }
    case "↑": {
      result.key = "ArrowUp";
      break;
    }
    case "↓": {
      result.key = "ArrowDown";
      break;
    }
    case "⌦": {
      result.key = "Delete";
      break;
    }
    case "⌫": {
      result.key = "Backspace";
      break;
    }
    case "↩": {
      result.key = "Enter";
      break;
    }
  }
  return result;
}

if (g_addSnippets) addSnippets();

const keyCodeList = {
  "⌫": 8,
  "⇥": 9,
  "↩": 13,
  "⇧": 16,
  "⌘": 91,
  "⌥": 18,
  "Pause": 19,
  "CapsLock": 20,
  "Escape": 27,
  " ": 32,
  "PageUp": 33,
  "PageDown": 34,
  "End": 35,
  "Home": 36,
  "←": 37,
  "↑": 38,
  "→": 39,
  "↓": 40,
  "PrintScreen": 44,
  "Insert": 45,
  "⌦": 46,
  "0": 48,
  "1": 49,
  "2": 50,
  "3": 51,
  "4": 52,
  "5": 53,
  "6": 54,
  "7": 55,
  "8": 56,
  "9": 57,
  "A": 65,
  "B": 66,
  "C": 67,
  "D": 68,
  "E": 69,
  "F": 70,
  "G": 71,
  "H": 72,
  "I": 73,
  "J": 74,
  "K": 75,
  "L": 76,
  "M": 77,
  "N": 78,
  "O": 79,
  "P": 80,
  "Q": 81,
  "R": 82,
  "S": 83,
  "T": 84,
  "U": 85,
  "V": 86,
  "W": 87,
  "X": 88,
  "Y": 89,
  "Z": 90,
  "ContextMenu": 93,
  "MyComputer": 182,
  "MyCalculator": 183,
  ";": 186,
  "=": 187,
  ",": 188,
  "-": 189,
  ".": 190,
  "/": 191,
  "`": 192,
  "[": 219,
  "\\": 220,
  "]": 221,
  "'": 222,
  "*": 106,
  "+": 107,
  "-": 109,
  ".": 110,
  "/": 111,
  "F1": 112,
  "F2": 113,
  "F3": 114,
  "F4": 115,
  "F5": 116,
  "F6": 117,
  "F7": 118,
  "F8": 119,
  "F9": 120,
  "F10": 121,
  "F11": 122,
  "F12": 123,
  "NumLock": 144,
  "ScrollLock": 145
};
```
