(()=>{"use strict";var __webpack_modules__={"./src/index.ts":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval(`__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ PluginSiyuanJsOpenSnippetsDialog)
/* harmony export */ });
/* harmony import */ var siyuan__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! siyuan */ "siyuan");
/* harmony import */ var siyuan__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(siyuan__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _index_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./index.scss */ "./src/index.scss");
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var _a;


const STORAGE_NAME = "config.json";
const TAB_TYPE = "custom-tab";
class PluginSiyuanJsOpenSnippetsDialog extends siyuan__WEBPACK_IMPORTED_MODULE_0__.Plugin {
  constructor() {
    super(...arguments);
    this._snippetType = ((_a = window.siyuan.sjosd) == null ? void 0 : _a.topBarMenuInputType) || "css";
    this.genSnippet = (snippet) => {
      return \`
            <div class="sjosd-dialog">
                <div class="sjosd-dialog-header resize__move"></div>
                <div class="sjosd-dialog-container fn__flex-1" data-id="\${snippet.id || ""}" data-type="\${snippet.type}">
                    <div class="fn__flex">
                        <textarea class="sjosd-dialog-name fn__flex-1 b3-text-field" spellcheck="false" rows="1" placeholder="\${window.siyuan.languages.title}" style="resize:none; width:\${this.isMobile ? "50%" : "300px"}"></textarea>
                        <div class="fn__space"></div>
                        <button data-action="delete" class="block__icon block__icon--show ariaLabel" aria-label="\${window.siyuan.languages.remove}" data-position="north">
                            <svg><use xlink:href="#iconTrashcan"></use></svg>
                        </button>
                        <div class="fn__space"></div>
                        <input data-type="snippet" class="b3-switch fn__flex-center" type="checkbox"\${snippet.enabled ? " checked" : ""}>
                    </div>
                    <div class="fn__hr"></div>
                    <textarea class="sjosd-dialog-content fn__flex-1 b3-text-field" spellcheck="false" placeholder="\${window.siyuan.languages.codeSnippet}" style="resize:none; font-family:var(--b3-font-family-code)"></textarea>
                    <div class="fn__hr--b"></div>
                </div>
                <div class="b3-dialog__action">
                    <button data-action="cancel" class="b3-button b3-button--cancel">\${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
                    <button data-action="confirm" class="b3-button b3-button--text">\${window.siyuan.languages.confirm}</button>
                </div>
            </div>
        \`;
    };
    /**
     * \u786E\u8BA4\u5BF9\u8BDD\u6846\uFF08\u53C2\u8003\u539F\u751F\u4EE3\u7801 app/src/dialog/confirmDialog.ts \uFF09
     * @param title \u6807\u9898
     * @param text \u5185\u5BB9
     * @param confirm \u786E\u8BA4\u56DE\u8C03
     * @param cancel \u53D6\u6D88\u56DE\u8C03
     */
    this.confirmDialog = (title, text, isDelete = false, confirm2, cancel) => {
      if (!text && !title) {
        confirm2();
        return;
      }
      const dialog = new siyuan__WEBPACK_IMPORTED_MODULE_0__.Dialog({
        title,
        content: \`
                <div class="b3-dialog__content">
                    <div class="ft__breakword">\${text}</div>
                </div>
                <div class="b3-dialog__action">
                    <button class="b3-button b3-button--cancel" id="cancelDialogConfirmBtn">\${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
                    <button class="b3-button \${isDelete ? "b3-button--remove" : "b3-button--text"}" id="confirmDialogConfirmBtn">\${window.siyuan.languages[isDelete ? "delete" : "confirm"]}</button>
                </div>
            \`,
        width: this.isMobile ? "92vw" : "520px"
      });
      dialog.element.addEventListener("click", (event) => {
        event.stopPropagation();
        let target = event.target;
        const isDispatch = typeof event.detail === "string";
        while (target && target !== dialog.element || isDispatch) {
          if (target.id === "cancelDialogConfirmBtn" || isDispatch && event.detail === "Escape") {
            cancel == null ? void 0 : cancel();
            dialog.destroy();
            break;
          } else if (target.id === "confirmDialogConfirmBtn" || isDispatch && event.detail === "Enter") {
            confirm2 == null ? void 0 : confirm2();
            dialog.destroy();
            break;
          }
          target = target.parentElement;
        }
      });
      dialog.element.setAttribute("data-key", "dialog-confirm");
    };
    // \u751F\u6210\u4EE3\u7801\u7247\u6BB5\u5217\u8868
    this.genSnippetsHtml = (snippetsList) => {
      let snippetsHtml = "";
      snippetsList.forEach((snippet) => {
        snippetsHtml += \`
                <div class="sjosd-snippet-item b3-menu__item" data-type="\${snippet.type}" data-id="\${snippet.id}">
                    <span class="sjosd-snippet-name fn__flex-1" placeholder="\${this.i18n.unNamed}">\${snippet.name}</span>
                    <span class="fn__space"></span>
                    <button class="block__icon block__icon--show fn__flex-center" data-type="edit"><svg><use xlink:href="#iconEdit"></use></svg></button>
                    <button class="block__icon block__icon--show fn__flex-center" data-type="delete"><svg><use xlink:href="#iconTrashcan"></use></svg></button>
                    <span class="fn__space"></span>
                    <input class="b3-switch fn__flex-center" type="checkbox"\${snippet.enabled ? " checked" : ""}>
                </div>
            \`;
      });
      return snippetsHtml;
    };
    /**
     * \u83DC\u5355\u6309\u952E\u4E8B\u4EF6\u5904\u7406
     * @param event \u952E\u76D8\u4E8B\u4EF6
     */
    this.menuKeyDownHandler = (event) => {
      if (event.key === "Enter") {
        const snippetElement = this.menuItems.querySelector(".b3-menu__item--current");
        if (snippetElement) {
          event.stopPropagation();
          this.toggleSnippetSwitch(snippetElement);
        }
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        const currentMenuItem = this.menuItems.querySelector(".b3-menu__item--current");
        if (!currentMenuItem)
          return;
        const menuItems = this.menuItems.querySelectorAll(".b3-menu__item:not(.fn__none)");
        if (menuItems.length > 0) {
          const firstMenuItem = menuItems[0];
          const lastMenuItem = menuItems[menuItems.length - 1];
          if (event.key === "ArrowUp" && currentMenuItem === firstMenuItem) {
            event.stopPropagation();
            currentMenuItem.classList.remove("b3-menu__item--current");
            lastMenuItem.classList.add("b3-menu__item--current");
          } else if (event.key === "ArrowDown" && currentMenuItem === lastMenuItem) {
            event.stopPropagation();
            currentMenuItem.classList.remove("b3-menu__item--current");
            firstMenuItem.classList.add("b3-menu__item--current");
          }
        }
      }
    };
    /**
     * \u53D6\u6D88\u9009\u4E2D\u4EE3\u7801\u7247\u6BB5
     */
    this.unselectSnippet = () => {
      this.menuItems.querySelectorAll(".b3-menu__item--current").forEach((item) => {
        item.classList.remove("b3-menu__item--current");
      });
    };
    /**
     * \u83DC\u5355\u9876\u90E8\u70B9\u51FB\u4E8B\u4EF6\u5904\u7406
     * @param event \u9F20\u6807\u4E8B\u4EF6
     */
    this.menuClickHandler = (event) => {
      event.stopPropagation();
      const target = event.target;
      if (target.closest(".sjosd-top-container")) {
        this.unselectSnippet();
        if (target.tagName.toLowerCase() === "input" && target.getAttribute("name") === "sjosd-tabs") {
          const input = target;
          this.snippetType = input.id.replace("sjosd-radio-", "");
          this.switchSnippet();
        }
        if (target.classList.contains("sjosd-all-snippet-switch")) {
          const input = target;
          this.toggleAllSnippetsEnabled(this.snippetType, input.checked);
        }
      }
      if (target.tagName.toLowerCase() === "button") {
        const button = target;
        const type = button.dataset.type;
        const menuItem = target.closest(".b3-menu__item");
        const snippetId = menuItem == null ? void 0 : menuItem.dataset.id;
        this.unselectSnippet();
        if (!menuItem || !snippetId) {
          if (type === "new") {
            const snippet = {
              id: window.Lute.NewNodeID(),
              name: "",
              content: "",
              type: this.snippetType,
              enabled: true
            };
            this.addSnippet(snippet);
            const success = false;
            if (!success) {
              const snippetsHtml = this.genSnippetsHtml([snippet]);
              this.menuItems.querySelector(".sjosd-top-container").insertAdjacentHTML("afterend", snippetsHtml);
              return;
            }
          } else {
            this.showErrorMessage(this.i18n.getSnippetFailed);
          }
        } else if (type === "edit") {
          this.openSnippetDialog(snippetId);
        } else if (type === "delete") {
          this.deleteSnippet(snippetId);
          menuItem.remove();
          const confirmButton = document.querySelector(\`.sjosd-dialog-container[data-id="\${snippetId}"] + .b3-dialog__action button[data-action="confirm"]\`);
          if (confirmButton) {
            confirmButton.textContent = window.siyuan.languages.new;
          }
        }
        return;
      }
      const snippetElement = target.closest(".b3-menu__item");
      this.toggleSnippetSwitch(snippetElement, target);
    };
    // \u5207\u6362\u5F00\u5173
    this.toggleSnippetSwitch = (snippetElement, target) => {
      if (snippetElement && snippetElement.dataset.id) {
        const checkBox = snippetElement.querySelector("input");
        if (!target || target !== checkBox) {
          checkBox.checked = !checkBox.checked;
        }
        this.toggleSnippetEnabled(snippetElement.dataset.id, checkBox.checked);
      }
    };
    // /**
    //  * \u83B7\u53D6\u4EE3\u7801\u7247\u6BB5\u7C7B\u578B
    //  * @param id \u4EE3\u7801\u7247\u6BB5 ID
    //  * @returns \u4EE3\u7801\u7247\u6BB5\u7C7B\u578B
    //  */
    // private getSnippetType = (id: string) => {
    //     const type: string | false = this.snippetsList.find((snippet: any) => snippet.id === id)?.type || false;
    //     if (!type) {
    //         console.log("getSnippetType \u5931\u8D25\uFF0C\u663E\u793A\u9519\u8BEF\u4FE1\u606F");
    //         this.showErrorMessage(this.i18n.getSnippetFailed);
    //     }
    //     return type;
    // };
    /**
     * \u6DFB\u52A0\u4EE3\u7801\u7247\u6BB5
     * @param snippet \u4EE3\u7801\u7247\u6BB5
     */
    this.addSnippet = (snippet) => {
      this.snippetsList.unshift(snippet);
      this.setSnippetPost(this.snippetsList);
      this.addSnippetElement(snippet.id, snippet.type, snippet.content);
      this.updateSnippetCount();
    };
    /**
     * \u5220\u9664\u4EE3\u7801\u7247\u6BB5
     * @param id \u4EE3\u7801\u7247\u6BB5 ID
     */
    this.deleteSnippet = (id) => {
      this.snippetsList = this.snippetsList.filter((snippet) => snippet.id !== id);
      this.setSnippetPost(this.snippetsList);
      this.removeSnippetElement(id, this.snippetType);
      this.updateSnippetCount();
    };
    /**
     * \u5207\u6362\u4EE3\u7801\u7247\u6BB5\u542F\u7528\u72B6\u6001
     * @param id \u4EE3\u7801\u7247\u6BB5 ID
     * @param enabled \u662F\u5426\u542F\u7528
     */
    this.toggleSnippetEnabled = (id, enabled) => {
      const snippet = this.snippetsList.find((snippet2) => snippet2.id === id);
      if (snippet) {
        snippet.enabled = enabled;
        this.setSnippetPost(this.snippetsList);
        if (enabled) {
          this.addSnippetElement(id, this.snippetType, snippet.content);
        } else {
          this.removeSnippetElement(id, this.snippetType);
        }
      }
    };
    /**
     * \u5207\u6362\u6574\u4F53\u542F\u7528\u72B6\u6001
     * @param snippetType \u4EE3\u7801\u7247\u6BB5\u7C7B\u578B
     * @param enabled \u662F\u5426\u542F\u7528
     */
    this.toggleAllSnippetsEnabled = (snippetType, enabled) => {
      if (snippetType === "css") {
        window.siyuan.config.snippet.enabledCSS = enabled;
      } else if (snippetType === "js") {
        window.siyuan.config.snippet.enabledJS = enabled;
      }
      (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.fetchPost)("/api/setting/setSnippet", window.siyuan.config.snippet);
      this.updateAllSnippetSwitch();
      const filteredSnippets = this.snippetsList.filter((snippet) => snippet.type === snippetType && snippet.enabled === true);
      if (enabled) {
        filteredSnippets.forEach((snippet) => {
          this.addSnippetElement(snippet.id, snippet.type, snippet.content);
        });
      } else {
        filteredSnippets.forEach((snippet) => {
          this.removeSnippetElement(snippet.id, snippet.type);
        });
      }
    };
    // \u63D2\u4EF6\u4E0D\u4F7F\u7528\u8BE5\u51FD\u6570\uFF0C\u4EC5\u7528\u6765\u53C2\u8003\u539F\u751F\u5199\u6CD5
    this.setSnippet = (dialog, oldSnippets) => {
      const snippets = [];
      dialog.element.querySelectorAll("[data-id]").forEach((item) => {
        snippets.push({
          id: item.getAttribute("data-id"),
          name: item.querySelector("input").value,
          type: item.getAttribute("data-type"),
          content: item.querySelector("textarea").value,
          enabled: item.querySelector(".b3-switch").checked
        });
      });
      if (oldSnippets === snippets && window.siyuan.config.snippet.enabledCSS === dialog.element.querySelector('.b3-switch[data-action="toggleCSS"]').checked && window.siyuan.config.snippet.enabledJS === dialog.element.querySelector('.b3-switch[data-action="toggleJS"]').checked) {
        dialog.destroy({ cancel: "true" });
      } else {
        this.setSnippetPost(snippets);
      }
    };
    /**
     * \u8BBE\u7F6E\u4EE3\u7801\u7247\u6BB5\uFF08\u53C2\u8003\u601D\u6E90\u672C\u4F53 app/src/config/util/snippets.ts \uFF09
     * @param snippets \u4EE3\u7801\u7247\u6BB5
     */
    this.setSnippetPost = (snippets) => {
      (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.fetchPost)("/api/snippet/setSnippet", { snippets }, (response) => {
        if (response.code !== 0) {
          this.showErrorMessage(this.i18n.setSnippetFailed + " [" + response.msg + "]");
          return;
        }
      });
    };
    /**
     * \u83B7\u53D6\u4EE3\u7801\u7247\u6BB5\u5143\u7D20 ID
     * @param id \u4EE3\u7801\u7247\u6BB5 ID
     * @param snippetType \u4EE3\u7801\u7247\u6BB5\u7C7B\u578B
     * @returns \u4EE3\u7801\u7247\u6BB5\u5143\u7D20 ID
     */
    this.getSnippetElementId = (id, snippetType) => {
      return \`snippet\${snippetType === "css" ? "CSS" : "JS"}\${id}\`;
    };
    /**
     * \u5224\u65AD\u4EE3\u7801\u7247\u6BB5\u662F\u5426\u542F\u7528
     * @param snippetType \u4EE3\u7801\u7247\u6BB5\u7C7B\u578B
     * @returns \u662F\u5426\u542F\u7528
     */
    this.isSnippetEnabled = (snippetType) => {
      return window.siyuan.config.snippet.enabledCSS && snippetType === "css" || window.siyuan.config.snippet.enabledJS && snippetType === "js";
    };
    /**
     * \u6DFB\u52A0\u4EE3\u7801\u7247\u6BB5\u5143\u7D20
     * @param elementIds \u4EE3\u7801\u7247\u6BB5\u5143\u7D20 ID
     */
    this.addSnippetElement = (id, snippetType, content) => {
      if (!this.isSnippetEnabled(snippetType)) {
        return;
      }
      const elementId = this.getSnippetElementId(id, snippetType);
      if (snippetType === "css") {
        document.head.insertAdjacentHTML("beforeend", \`<style id="\${elementId}">\${content}</style>\`);
      } else if (snippetType === "js") {
        const jsElement = document.createElement("script");
        jsElement.type = "text/javascript";
        jsElement.text = content;
        jsElement.id = elementId;
        document.head.appendChild(jsElement);
      }
    };
    /**
     * \u79FB\u9664\u4EE3\u7801\u7247\u6BB5\u5143\u7D20
     * @param elementIds \u4EE3\u7801\u7247\u6BB5\u5143\u7D20 ID
     */
    this.removeSnippetElement = (id, snippetType) => {
      var _a2;
      const elementId = this.getSnippetElementId(id, snippetType);
      (_a2 = document.getElementById(elementId)) == null ? void 0 : _a2.remove();
    };
    /**
     * \u66F4\u65B0\u4EE3\u7801\u7247\u6BB5\u5143\u7D20
     * @param id \u4EE3\u7801\u7247\u6BB5 ID
     * @param snippetType \u4EE3\u7801\u7247\u6BB5\u7C7B\u578B
     * @param content \u4EE3\u7801\u7247\u6BB5\u5185\u5BB9
     */
    this.updateSnippetElement = (id, snippetType, content) => {
      const elementId = this.getSnippetElementId(id, snippetType);
      const element = document.getElementById(elementId);
      if (element) {
        if (element.innerHTML === content)
          return;
        this.removeSnippetElement(id, snippetType);
      }
      this.addSnippetElement(id, snippetType, content);
    };
    /**
     * \u8BBE\u7F6E\u4EE3\u7801\u7247\u6BB5\u6574\u4F53\u542F\u7528\u72B6\u6001
     * @param type \u4EE3\u7801\u7247\u6BB5\u7C7B\u578B
     */
    this.setSnippetsEnabled = (type) => {
      const enabled = this.menuItems.querySelector(".b3-switch").checked;
      if (type === "css") {
        window.siyuan.config.snippet.enabledCSS = enabled;
      } else if (type === "js") {
        window.siyuan.config.snippet.enabledJS = enabled;
      }
      (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.fetchPost)("/api/setting/setSnippet", window.siyuan.config.snippet);
    };
    /**
     * \u6E32\u67D3\u4EE3\u7801\u7247\u6BB5\uFF08\u4EE3\u7801\u76EE\u524D\u6765\u81EA\u601D\u6E90\u672C\u4F53 app/src/config/util/snippets.ts \uFF09
     * \u770B\u8D77\u6765\u50CF\u662F\u5BF9\u6240\u6709\u4EE3\u7801\u7247\u6BB5\u8FDB\u884C\u5904\u7406\uFF0C\u770B\u770B\u80FD\u4E0D\u80FD\u6539\u6210\u53EA\u5904\u7406\u53D8\u66F4\u7684\u4EE3\u7801\u7247\u6BB5\uFF08\u5305\u62EC\u5207\u6362\u6574\u4F53\u542F\u7528\u72B6\u6001\u65F6\u4F1A\u4EA7\u751F\u591A\u4F59\u4E00\u4E2A\u4EE3\u7801\u7247\u6BB5\u72B6\u6001\u53D8\u66F4\uFF09
     */
    this.renderSnippet = () => {
      (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.fetchPost)("/api/snippet/getSnippet", { type: "all", enabled: 2 }, (response) => {
        response.data.snippets.forEach((item) => {
          const id = \`snippet\${item.type === "css" ? "CSS" : "JS"}\${item.id}\`;
          let exitElement = document.getElementById(id);
          if (!window.siyuan.config.snippet.enabledCSS && item.type === "css" || !window.siyuan.config.snippet.enabledJS && item.type === "js") {
            if (exitElement) {
              exitElement.remove();
            }
            return;
          }
          if (!item.enabled) {
            if (exitElement) {
              exitElement.remove();
            }
            return;
          }
          if (exitElement) {
            if (exitElement.innerHTML === item.content) {
              return;
            }
            exitElement.remove();
          }
          if (item.type === "css") {
            document.head.insertAdjacentHTML("beforeend", \`<style id="\${id}">\${item.content}</style>\`);
          } else if (item.type === "js") {
            exitElement = document.createElement("script");
            exitElement.type = "text/javascript";
            exitElement.text = item.content;
            exitElement.id = id;
            document.head.appendChild(exitElement);
          }
        });
      });
    };
    /**
     * \u66F4\u65B0\u6574\u4F53\u542F\u7528\u72B6\u6001\u5F00\u5173\u72B6\u6001
     */
    this.updateAllSnippetSwitch = () => {
      const enabled = this.isSnippetEnabled(this.snippetType);
      const allSnippetSwitch = this.menuItems.querySelector(".sjosd-all-snippet-switch");
      allSnippetSwitch.checked = enabled;
    };
    /**
     * \u5207\u6362\u4EE3\u7801\u7247\u6BB5\u7C7B\u578B
     */
    this.switchSnippet = () => {
      this.updateAllSnippetSwitch();
      this.menuItems.querySelector("button[data-type='new']").setAttribute("aria-label", window.siyuan.languages.addAttr + " " + this.snippetType.toUpperCase());
      const isCSS = this.snippetType === "css";
      this.menuItems.querySelectorAll(isCSS ? "[data-type='css']" : "[data-type='js']").forEach((item) => {
        item.classList.remove("fn__none");
      });
      this.menuItems.querySelectorAll(isCSS ? "[data-type='js']" : "[data-type='css']").forEach((item) => {
        item.classList.add("fn__none");
      });
    };
    /**
     * \u66F4\u65B0\u4EE3\u7801\u7247\u6BB5\u8BA1\u6570
     */
    this.updateSnippetCount = () => {
      const cssCountElement = this.menuItems.querySelector(".sjosd-tab-count-css");
      const jsCountElement = this.menuItems.querySelector(".sjosd-tab-count-js");
      if (!cssCountElement || !jsCountElement)
        return;
      const cssCount = this.snippetsList.filter((item) => item.type === "css").length;
      const jsCount = this.snippetsList.filter((item) => item.type === "js").length;
      cssCountElement.textContent = cssCount > 99 ? "99+" : cssCount.toString();
      jsCountElement.textContent = jsCount > 99 ? "99+" : jsCount.toString();
    };
    /**
     * \u663E\u793A\u9519\u8BEF\u4FE1\u606F
     * @param message \u9519\u8BEF\u4FE1\u606F
     */
    this.showErrorMessage = (message) => {
      (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.showMessage)(this.i18n.pluginDisplayName + ": " + message, void 0, "error");
    };
  }
  /**
   * snippetType \u5C5E\u6027\u7684 getter
   */
  get snippetType() {
    return this._snippetType;
  }
  /**
   * snippetType \u5C5E\u6027\u7684 setter\uFF0C\u6539\u53D8\u65F6\u6267\u884C onSnippetTypeChange
   */
  set snippetType(value) {
    if (this._snippetType !== value) {
      this._snippetType = value;
      this.syncSnippetType(value);
    }
  }
  /**
   * \u5C06 snippetType \u540C\u6B65\u5230\u5168\u5C40\u53D8\u91CF
   * @param value \u65B0\u7684 snippetType
   */
  syncSnippetType(value) {
    if (!window.siyuan.sjosd)
      window.siyuan.sjosd = {};
    window.siyuan.sjosd.topBarMenuInputType = value;
  }
  /**
   * \u542F\u7528\u63D2\u4EF6
   */
  onload() {
    if (window.siyuan && window.siyuan.isPublish)
      return;
    this.data[STORAGE_NAME] = { readonlyText: "Readonly" };
    const frontEnd = (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.getFrontend)();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
    this.addIcons(
      \`<symbol id="iconSiyuanJsOpenSnippetsDialogTopBarIcon" viewBox="0 0 32 32">
            <path d="M23.498 9.332c-0.256 0.256-0.415 0.611-0.415 1.002s0.159 0.745 0.415 1.002l4.665 4.665-4.665 4.665c-0.256 0.256-0.415 0.61-0.415 1.002s0.159 0.745 0.415 1.002v0c0.256 0.256 0.61 0.415 1.002 0.415s0.745-0.159 1.002-0.415l5.667-5.667c0.256-0.256 0.415-0.611 0.415-1.002s-0.158-0.745-0.415-1.002l-5.667-5.667c-0.256-0.256-0.61-0.415-1.002-0.415s-0.745 0.159-1.002 0.415v0z"></path>
            <path d="M7.5 8.917c-0.391 0-0.745 0.159-1.002 0.415l-5.667 5.667c-0.256 0.256-0.415 0.611-0.415 1.002s0.158 0.745 0.415 1.002l5.667 5.667c0.256 0.256 0.611 0.415 1.002 0.415s0.745-0.159 1.002-0.415v0c0.256-0.256 0.415-0.61 0.415-1.002s-0.159-0.745-0.415-1.002l-4.665-4.665 4.665-4.665c0.256-0.256 0.415-0.611 0.415-1.002s-0.159-0.745-0.415-1.002v0c-0.256-0.256-0.61-0.415-1.002-0.415v0z"></path>
            <path d="M19.965 3.314c-0.127-0.041-0.273-0.065-0.424-0.065-0.632 0-1.167 0.413-1.35 0.985l-0.003 0.010-7.083 22.667c-0.041 0.127-0.065 0.273-0.065 0.424 0 0.632 0.413 1.167 0.985 1.35l0.010 0.003c0.127 0.041 0.273 0.065 0.424 0.065 0.632 0 1.167-0.413 1.35-0.985l0.003-0.010 7.083-22.667c0.041-0.127 0.065-0.273 0.065-0.424 0-0.632-0.413-1.167-0.985-1.35l-0.010-0.003z"></path>
            </symbol>\`
    );
    const topBarElement = this.addTopBar({
      icon: "iconSiyuanJsOpenSnippetsDialogTopBarIcon",
      title: this.i18n.pluginDisplayName,
      position: "right",
      callback: () => {
        openSnippetsPanel();
      }
    });
    const openSnippetsPanel = () => {
      if (this.isMobile) {
        this.addMenu();
      } else {
        let rect = topBarElement.getBoundingClientRect();
        if (rect.width === 0) {
          rect = document.querySelector("#barMore").getBoundingClientRect();
        }
        if (rect.width === 0) {
          rect = document.querySelector("#barPlugins").getBoundingClientRect();
        }
        this.addMenu(rect);
      }
    };
    this.custom = this.addTab({
      type: TAB_TYPE,
      init() {
        this.element.innerHTML = \`<div class="sjosd__custom-tab">\${this.data.text}</div>\`;
      },
      beforeDestroy() {
        console.log("\\u5728\\u9500\\u6BC1\\u6807\\u7B7E\\u9875\\u4E4B\\u524D:", TAB_TYPE);
      },
      destroy() {
        console.log("\\u9500\\u6BC1\\u6807\\u7B7E\\u9875:", TAB_TYPE);
      }
    });
    this.addCommand({
      langKey: "openSnippetsPanel",
      hotkey: "",
      callback: () => {
        openSnippetsPanel();
      }
    });
    this.setting = new siyuan__WEBPACK_IMPORTED_MODULE_0__.Setting({
      confirmCallback: () => {
        this.saveData(STORAGE_NAME, { readonlyText: textareaElement.value });
      }
    });
    const textareaElement = document.createElement("textarea");
    this.setting.addItem({
      title: "Readonly text",
      direction: "row",
      description: "Open plugin url in browser",
      createActionElement: () => {
        textareaElement.className = "b3-text-field fn__block";
        textareaElement.placeholder = "Readonly text in the menu";
        textareaElement.value = this.data[STORAGE_NAME].readonlyText;
        return textareaElement;
      }
    });
    const btnaElement = document.createElement("button");
    btnaElement.className = "b3-button b3-button--outline fn__flex-center fn__size200";
    btnaElement.textContent = "Open";
    btnaElement.addEventListener("click", () => {
      window.open("https://github.com/TCOTC/siyuan-js-open-snippets-dialog");
    });
    this.setting.addItem({
      title: "Open plugin url",
      description: "Open plugin url in browser",
      actionElement: btnaElement
    });
    console.log(this.i18n.pluginDisplayName + this.i18n.pluginOnload);
  }
  /**
   * \u5E03\u5C40\u52A0\u8F7D\u5B8C\u6210
   */
  onLayoutReady() {
    if (window.siyuan && window.siyuan.isPublish)
      return;
    this.loadData(STORAGE_NAME);
  }
  /**
   * \u7981\u7528\u63D2\u4EF6
   */
  onunload() {
    if (window.siyuan && window.siyuan.isPublish)
      return;
    console.log(this.i18n.pluginDisplayName + this.i18n.pluginOnunload);
  }
  /**
   * \u5378\u8F7D\u63D2\u4EF6
   */
  uninstall() {
    if (window.siyuan && window.siyuan.isPublish)
      return;
    delete window.siyuan.sjosd;
    console.log(this.i18n.pluginDisplayName + this.i18n.pluginUninstall);
  }
  /**
   * \u6253\u5F00\u4EE3\u7801\u7247\u6BB5\u7F16\u8F91\u5BF9\u8BDD\u6846
   */
  openSnippetDialog(snippetId) {
    var _a2;
    const snippet = this.snippetsList.find((snippet2) => snippet2.id === snippetId);
    let isNew = false;
    if (snippet) {
      this.menu.close();
    } else {
      this.showErrorMessage(this.i18n.getSnippetFailed);
      return false;
    }
    const dialog = new siyuan__WEBPACK_IMPORTED_MODULE_0__.Dialog({
      content: this.genSnippet(snippet),
      width: this.isMobile ? "92vw" : "70vw",
      height: "80vh",
      hideCloseIcon: this.isMobile
    });
    if (!this.isMobile) {
      (_a2 = dialog.element.querySelector(".b3-dialog__scrim")) == null ? void 0 : _a2.remove();
      const dialogElement = dialog.element.querySelector(".b3-dialog");
      dialogElement.style.width = "0";
      dialogElement.style.height = "0";
      dialogElement.style.left = "50vw";
      dialogElement.style.top = "50vh";
      const dialogContainer = dialogElement.querySelector(".b3-dialog__container");
      dialogContainer.style.position = "fixed";
    }
    const nameElement = dialog.element.querySelector(\`.sjosd-dialog-name\`);
    nameElement.textContent = snippet.name;
    nameElement.focus();
    const contentElement = dialog.element.querySelector(\`.sjosd-dialog-content\`);
    contentElement.textContent = snippet.content;
    nameElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        contentElement.focus();
      }
    });
    dialog.element.setAttribute("data-key", "sjosd-snippet-dialog");
    const snippetDialogClickHandler = (event) => {
      const target = event.target;
      if (target.tagName.toLowerCase() === "button") {
        switch (target.dataset.action) {
          case "delete":
            this.openSnippetDeleteDialog(snippet.name, () => {
              if (!isNew) {
                this.deleteSnippet(snippet.id);
              }
              dialog.destroy();
            });
            break;
          case "cancel":
            dialog.destroy();
            break;
          case "confirm":
            if (target.dataset.type === "new") {
              this.addSnippet(snippet);
            } else {
              snippet.name = nameElement.value;
              snippet.content = contentElement.value;
              this.snippetsList = this.snippetsList.map((s) => s.id === snippet.id ? snippet : s);
              this.setSnippetPost(this.snippetsList);
              this.updateSnippetElement(snippet.id, snippet.type, snippet.content);
            }
            dialog.destroy();
            break;
        }
      }
      return;
    };
    dialog.element.addEventListener("click", snippetDialogClickHandler);
    return true;
  }
  /**
   * \u6253\u5F00\u4EE3\u7801\u7247\u6BB5\u5220\u9664\u786E\u8BA4\u5BF9\u8BDD\u6846
   * @param snippetName \u4EE3\u7801\u7247\u6BB5\u540D\u79F0
   * @param confirm \u786E\u8BA4\u56DE\u8C03
   * @param cancel \u53D6\u6D88\u56DE\u8C03
   */
  openSnippetDeleteDialog(snippetName, confirm2, cancel) {
    this.confirmDialog(
      this.i18n.deleteSnippet,
      this.i18n.deleteSnippetConfirm.replace("\${x}", snippetName ? " <b>" + snippetName + "</b> " : ""),
      true,
      () => {
        confirm2 == null ? void 0 : confirm2();
      },
      () => {
        cancel == null ? void 0 : cancel();
      }
    );
  }
  /**
   * \u6DFB\u52A0\u9876\u680F\u83DC\u5355
   * @param rect \u83DC\u5355\u4F4D\u7F6E
   */
  addMenu(rect) {
    return __async(this, null, function* () {
      this.menu = new siyuan__WEBPACK_IMPORTED_MODULE_0__.Menu("siyuanJsOpenSnippetsDialog", () => {
        this.menu.element.removeEventListener("click", this.menuClickHandler);
        this.menu = void 0;
        document.removeEventListener("keydown", this.menuKeyDownHandler);
        console.log("menu closed");
      });
      if (this.menu.isOpen)
        return;
      const response = yield (0,siyuan__WEBPACK_IMPORTED_MODULE_0__.fetchSyncPost)("/api/snippet/getSnippet", { type: "all", enabled: 2 });
      if (response.code !== 0) {
        this.menu.close();
        this.showErrorMessage(this.i18n.getSnippetsListFailed + " [" + response.msg + "]");
        return;
      }
      this.snippetsList = response.data.snippets;
      console.log("this.snippetsList:", this.snippetsList);
      this.menuItems = this.menu.element.querySelector(".b3-menu__items");
      const menuTop = document.createElement("div");
      menuTop.className = "sjosd-top-container fn__flex";
      menuTop.innerHTML = \`
            <div class="sjosd-tabs">
                <input type="radio" id="sjosd-radio-css" name="sjosd-tabs"/>
                <label class="sjosd-tab" for="sjosd-radio-css">
                    <span class="sjosd-tab-text">CSS</span>
                    <span class="sjosd-tab-count sjosd-tab-count-css">0</span>
                </label>
                <input type="radio" id="sjosd-radio-js" name="sjosd-tabs"/>
                <label class="sjosd-tab" for="sjosd-radio-js">
                    <span class="sjosd-tab-text" style="padding-left: .2em;">JS</span>
                    <span class="sjosd-tab-count sjosd-tab-count-js">0</span>
                </label>
                <span class="sjosd-glider"></span>
            </div>
            <span class="fn__flex-1"></span>
            <button class="block__icon block__icon--show fn__flex-center ariaLabel" data-type="new" data-position="north"><svg><use xlink:href="#iconAdd"></use></svg></button>
            <span class="fn__space"></span>
            <input class="sjosd-all-snippet-switch b3-switch fn__flex-center" type="checkbox">
        \`;
      const radio = menuTop.querySelector("#sjosd-radio-" + this.snippetType);
      radio.checked = true;
      const newSnippetButton = menuTop.querySelector("button[data-type='new']");
      newSnippetButton.setAttribute("aria-label", window.siyuan.languages.addAttr + " " + this.snippetType.toUpperCase());
      this.menuItems.append(menuTop);
      const snippetsHtml = this.genSnippetsHtml(this.snippetsList);
      this.menuItems.insertAdjacentHTML("beforeend", snippetsHtml);
      const firstMenuItem = this.menuItems.querySelector(".b3-menu__item:not(.fn__none)");
      if (firstMenuItem) {
        firstMenuItem.classList.add("b3-menu__item--current");
      }
      this.updateSnippetCount();
      this.switchSnippet();
      this.menu.element.addEventListener("click", this.menuClickHandler);
      document.addEventListener("keydown", this.menuKeyDownHandler);
      if (this.isMobile) {
        this.menu.fullscreen();
      } else {
        const dockRight = document.querySelector("#dockRight").getBoundingClientRect();
        this.menu.open({
          x: rect.right,
          y: rect.bottom + 1,
          isLeft: false
        });
        this.menu.element.style.width = "min(400px, 90vw)";
        this.menu.element.style.right = (((dockRight == null ? void 0 : dockRight.width) || 0) + 1).toString() + "px";
        this.menu.element.style.left = "";
      }
    });
  }
  // TODO: \u684C\u9762\u7AEF\u4FEE\u6539\u4EE3\u7801\u7247\u6BB5\u4E4B\u540E\u540C\u6B65\u5230\u6253\u5F00\u7684\u65B0\u7A97\u53E3\uFF08\u6240\u6709\u53D8\u66F4\u90FD\u662F\u5F39\u7A97\u786E\u8BA4\uFF0C\u907F\u514D\u4EE5\u540E\u539F\u751F\u6539\u8FDB\u4E86 https://github.com/siyuan-note/siyuan/issues/12303 \u9020\u6210\u51B2\u7A81\uFF09
  // \u95EE\uFF1A\u684C\u9762\u7AEF\u4F7F\u7528\u65B0\u7A97\u53E3\u7684\u60C5\u51B5\u4E0B\u63D2\u4EF6\u80FD\u5B9E\u73B0\u8DE8\u7A97\u53E3\u901A\u4FE1\u5417\uFF1FA \u7A97\u53E3\u7684\u63D2\u4EF6\u5C06\u72B6\u6001\u540C\u6B65\u5230 B \u7A97\u53E3\u7684\u63D2\u4EF6\uFF0C\u7136\u540E\u6267\u884C\u4E00\u4E9B\u64CD\u4F5C
  // \u7B54\uFF1A\u7B80\u5355\u7684\u7528 localStorage\u3001\u590D\u6742\u7684\u7528 broadCast
  //  localStraoge.setItem \u8BBE\u7F6E\uFF0Cwindow.addEventListener('storage' \u76D1\u542C
  //  \u6211\u8FD9\u8FB9\u7528\u7684 broadCast \u7684ws\u65B9\u6848\uFF0C\u4EE3\u7801\u5C0F\u591A
  // // \u81EA\u5B9A\u4E49\u63D2\u4EF6\u8BBE\u7F6E\u7A97\u53E3
  // openSetting() {
  //     const dialog = new Dialog({
  //         title: this.name,
  //         content:
  //             \`<div class="b3-dialog__content"><textarea class="b3-text-field fn__block" placeholder="readonly text in the menu"></textarea></div>
  //             <div class="b3-dialog__action">
  //                 <button class="b3-button b3-button--cancel">\${this.i18n.cancel}</button><div class="fn__space"></div>
  //                 <button class="b3-button b3-button--text">\${this.i18n.save}</button>
  //             </div>\`,
  //         width: this.isMobile ? "92vw" : "520px",
  //     });
  //     const inputElement = dialog.element.querySelector("textarea");
  //     inputElement.value = this.data[STORAGE_NAME].readonlyText;
  //     const btnsElement = dialog.element.querySelectorAll(".b3-button");
  //     dialog.bindInput(inputElement, () => {
  //         (btnsElement[1] as HTMLButtonElement).click();
  //     });
  //     inputElement.focus();
  //     btnsElement[0].addEventListener("click", () => {
  //         dialog.destroy();
  //     });
  //     btnsElement[1].addEventListener("click", () => {
  //         this.saveData(STORAGE_NAME, {readonlyText: inputElement.value});
  //         dialog.destroy();
  //     });
  // }
  // \u6DFB\u52A0\u83DC\u5355\u9009\u9879
  // menu.addItem({
  //     icon: "iconSettings",
  //     label: "Open Setting",
  //     click: () => {
  //         openSetting(this.app);
  //     }
  // });
  // menu.addItem({
  //     icon: "iconInfo",
  //     label: "Dialog(open doc first)",
  //     accelerator: this.commands[0].customHotkey,
  //     click: () => {
  //         this.showDialog();
  //     }
  // });
  // if (!this.isMobile) {
  //     menu.addItem({
  //         icon: "iconFace",
  //         label: "Open Custom Tab",
  //         click: () => {
  //             const tab = openTab({
  //                 app: this.app,
  //                 custom: {
  //                     icon: "iconFace",
  //                     title: "Custom Tab",
  //                     data: {
  //                         text: platformUtils.isHuawei() ? "Hello, Huawei!" : "This is my custom tab",
  //                     },
  //                     id: this.name + TAB_TYPE
  //                 },
  //             });
  //             console.log(tab);
  //         }
  //     });
  // }
  // menu.addItem({
  //     icon: "iconDownload",
  //     label: "Save Layout",
  //     click: () => {
  //         saveLayout(() => {
  //             showMessage("Layout saved");
  //         });
  //     }
  // });
  // menu.addSeparator();
  // menu.addItem({
  //     icon: "iconSparkles",
  //     label: this.data[STORAGE_NAME].readonlyText || "Readonly",
  //     type: "readonly",
  // });
}


//# sourceURL=webpack://siyuan-js-open-snippets-dialog/./src/index.ts?`)},"./src/index.scss":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval(`__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


//# sourceURL=webpack://siyuan-js-open-snippets-dialog/./src/index.scss?`)},siyuan:n=>{n.exports=require("siyuan")}},__webpack_module_cache__={};function __webpack_require__(n){var e=__webpack_module_cache__[n];if(e!==void 0)return e.exports;var t=__webpack_module_cache__[n]={exports:{}};return __webpack_modules__[n](t,t.exports,__webpack_require__),t.exports}__webpack_require__.n=n=>{var e=n&&n.__esModule?()=>n.default:()=>n;return __webpack_require__.d(e,{a:e}),e},__webpack_require__.d=(n,e)=>{for(var t in e)__webpack_require__.o(e,t)&&!__webpack_require__.o(n,t)&&Object.defineProperty(n,t,{enumerable:!0,get:e[t]})},__webpack_require__.o=(n,e)=>Object.prototype.hasOwnProperty.call(n,e),__webpack_require__.r=n=>{typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(n,"__esModule",{value:!0})};var __webpack_exports__=__webpack_require__("./src/index.ts");module.exports=__webpack_exports__})();
