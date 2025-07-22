import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,
    openTab,
    adaptHotkey,
    getFrontend,
    getBackend,
    Setting,
    fetchPost,
    Protyle,
    openWindow,
    IOperation,
    Constants,
    openMobileFileById,
    lockScreen,
    ICard,
    ICardData,
    Custom,
    exitSiYuan,
    getModelByDockType,
    getAllEditor,
    Files,
    platformUtils,
    openSetting,
    openAttributePanel,
    saveLayout,
    fetchSyncPost
} from "siyuan";
import "./index.scss";
import {IMenuItem} from "siyuan/types";

const STORAGE_NAME = "config.json"; // 配置文件名
const TAB_TYPE = "custom-tab";

export default class PluginSiyuanJsOpenSnippetsDialog extends Plugin {

    private custom: () => Custom;
    private isMobile: boolean;
    private snippetsList: any[];
    private _snippetType: string = window.siyuan.sjosd?.topBarMenuInputType || "css"; // 顶栏菜单默认显示 CSS 代码片段
    private menu: Menu;
    private menuItems: HTMLElement;

    /**
     * snippetType 属性的 getter
     */
    get snippetType(): string {
        return this._snippetType;
    }

    /**
     * snippetType 属性的 setter，改变时执行 onSnippetTypeChange
     */
    set snippetType(value: string) {
        if (this._snippetType !== value) {
            this._snippetType = value;
            this.syncSnippetType(value);
        }
    }

    /**
     * 将 snippetType 同步到全局变量
     * @param value 新的 snippetType
     */
    private syncSnippetType(value: string) {
        if (!window.siyuan.sjosd) window.siyuan.sjosd = {};
        window.siyuan.sjosd.topBarMenuInputType = value;
    }

    /**
     * 启用插件
     */
    onload() {
        // 发布服务不启用插件
        if (window.siyuan && (window.siyuan as any).isPublish) return;

        this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";


        // 顶栏按钮
        this.addIcons(
            `<symbol id="iconSiyuanJsOpenSnippetsDialogTopBarIcon" viewBox="0 0 32 32">
            <path d="M23.498 9.332c-0.256 0.256-0.415 0.611-0.415 1.002s0.159 0.745 0.415 1.002l4.665 4.665-4.665 4.665c-0.256 0.256-0.415 0.61-0.415 1.002s0.159 0.745 0.415 1.002v0c0.256 0.256 0.61 0.415 1.002 0.415s0.745-0.159 1.002-0.415l5.667-5.667c0.256-0.256 0.415-0.611 0.415-1.002s-0.158-0.745-0.415-1.002l-5.667-5.667c-0.256-0.256-0.61-0.415-1.002-0.415s-0.745 0.159-1.002 0.415v0z"></path>
            <path d="M7.5 8.917c-0.391 0-0.745 0.159-1.002 0.415l-5.667 5.667c-0.256 0.256-0.415 0.611-0.415 1.002s0.158 0.745 0.415 1.002l5.667 5.667c0.256 0.256 0.611 0.415 1.002 0.415s0.745-0.159 1.002-0.415v0c0.256-0.256 0.415-0.61 0.415-1.002s-0.159-0.745-0.415-1.002l-4.665-4.665 4.665-4.665c0.256-0.256 0.415-0.611 0.415-1.002s-0.159-0.745-0.415-1.002v0c-0.256-0.256-0.61-0.415-1.002-0.415v0z"></path>
            <path d="M19.965 3.314c-0.127-0.041-0.273-0.065-0.424-0.065-0.632 0-1.167 0.413-1.35 0.985l-0.003 0.010-7.083 22.667c-0.041 0.127-0.065 0.273-0.065 0.424 0 0.632 0.413 1.167 0.985 1.35l0.010 0.003c0.127 0.041 0.273 0.065 0.424 0.065 0.632 0 1.167-0.413 1.35-0.985l0.003-0.010 7.083-22.667c0.041-0.127 0.065-0.273 0.065-0.424 0-0.632-0.413-1.167-0.985-1.35l-0.010-0.003z"></path>
            </symbol>`);
        const topBarElement = this.addTopBar({
            icon: "iconSiyuanJsOpenSnippetsDialogTopBarIcon",
            title: this.i18n.pluginDisplayName,
            position: "right",
            callback: () => {
                openSnippetsPanel();
            }
        });


        // 打开代码片段快捷面板
        const openSnippetsPanel = () => {
            if (this.isMobile) {
                this.addMenu();
            } else {
                let rect = topBarElement.getBoundingClientRect();
                // 如果被隐藏，则使用更多按钮
                if (rect.width === 0) {
                    rect = document.querySelector("#barMore").getBoundingClientRect();
                }
                if (rect.width === 0) {
                    rect = document.querySelector("#barPlugins").getBoundingClientRect();
                }
                this.addMenu(rect);
            }
        };


        // 自定义标签页
        this.custom = this.addTab({
            type: TAB_TYPE,
            init() {
                this.element.innerHTML = `<div class="sjosd__custom-tab">${this.data.text}</div>`;
            },
            beforeDestroy() {
                console.log("在销毁标签页之前:", TAB_TYPE);
                // TODO: 销毁标签页时，需要获取当前页签的数据然后处理（比如保存）
            },
            destroy() {
                console.log("销毁标签页:", TAB_TYPE);
            }
        });


        // 注册快捷键（都默认置空）
        // 打开代码片段快捷面板
        this.addCommand({
            langKey: "openSnippetsPanel",
            hotkey: "",
            callback: () => {
                openSnippetsPanel();
            },
        });
        // TODO: “重新加载界面”快捷键


        // 获取已打开的所有自定义页签
        // this.getOpenedTab();


        // 插件设置中的各个配置项
        this.setting = new Setting({
            confirmCallback: () => {
                this.saveData(STORAGE_NAME, {readonlyText: textareaElement.value});
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
            },
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
            actionElement: btnaElement,
        });



        console.log(this.i18n.pluginDisplayName + this.i18n.pluginOnload);
    }

    /**
     * 布局加载完成
     */
    onLayoutReady() {
        // 发布服务不启用插件
        if (window.siyuan && (window.siyuan as any).isPublish) return;
        // 加载插件配置
        this.loadData(STORAGE_NAME);
    }

    /**
     * 禁用插件
     */
    onunload() {
        // 发布服务不启用插件
        if (window.siyuan && (window.siyuan as any).isPublish) return;
        console.log(this.i18n.pluginDisplayName + this.i18n.pluginOnunload);
    }

    /**
     * 卸载插件
     */
    uninstall() {
        // 发布服务不启用插件
        if (window.siyuan && (window.siyuan as any).isPublish) return;
        // 移除全局变量
        delete window.siyuan.sjosd;

        console.log(this.i18n.pluginDisplayName + this.i18n.pluginUninstall);
    }


    private genSnippet = (snippet: any) => {
        return `
            <div class="sjosd-dialog">
                <div class="sjosd-dialog-header resize__move"></div>
                <div class="sjosd-dialog-container fn__flex-1" data-id="${snippet.id || ""}" data-type="${snippet.type}">
                    <div class="fn__flex">
                        <textarea class="sjosd-dialog-name fn__flex-1 b3-text-field" spellcheck="false" rows="1" placeholder="${window.siyuan.languages.title}" style="resize:none; width:${this.isMobile ? "50%" : "300px"}"></textarea>
                        <div class="fn__space"></div>
                        <button data-action="delete" class="block__icon block__icon--show ariaLabel" aria-label="${window.siyuan.languages.remove}" data-position="north">
                            <svg><use xlink:href="#iconTrashcan"></use></svg>
                        </button>
                        <div class="fn__space"></div>
                        <input data-type="snippet" class="b3-switch fn__flex-center" type="checkbox"${snippet.enabled ? " checked" : ""}>
                    </div>
                    <div class="fn__hr"></div>
                    <textarea class="sjosd-dialog-content fn__flex-1 b3-text-field" spellcheck="false" placeholder="${window.siyuan.languages.codeSnippet}" style="resize:none; font-family:var(--b3-font-family-code)"></textarea>
                    <div class="fn__hr--b"></div>
                </div>
                <div class="b3-dialog__action">
                    <button data-action="cancel" class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
                    <button data-action="confirm" class="b3-button b3-button--text">${window.siyuan.languages.confirm}</button>
                </div>
            </div>
        `;
    };


    /**
     * 打开代码片段编辑对话框
     */
    private openSnippetDialog(snippetId: string) {
        const snippet = this.snippetsList.find((snippet: any) => snippet.id === snippetId);
        let isNew = false; // 不作为参数，因为有可能已经删除了对应 ID 的代码片段而 Dialog 还在，此时需要支持点击“新建”按钮来新建代码片段
        if (snippet) {
            this.menu.close();
        } else {
            this.showErrorMessage(this.i18n.getSnippetFailed);
            return false;
        }

        const dialog = new Dialog({
            content: this.genSnippet(snippet),
            width: this.isMobile ? "92vw" : "70vw",
            height: "80vh",
            hideCloseIcon: this.isMobile,
        });

        if (!this.isMobile) {
            // 桌面端需要修改样式以支持同时打开多个 Dialog
            dialog.element.querySelector(".b3-dialog__scrim")?.remove();
            const dialogElement = dialog.element.querySelector(".b3-dialog") as HTMLElement;
            dialogElement.style.width = "0";
            dialogElement.style.height = "0";
            dialogElement.style.left = "50vw";
            dialogElement.style.top = "50vh";
            const dialogContainer = dialogElement.querySelector(".b3-dialog__container") as HTMLElement;
            dialogContainer.style.position = "fixed";
        }

        const nameElement = dialog.element.querySelector(`.sjosd-dialog-name`) as HTMLTextAreaElement; // 标题使用 textarea 是为了能够在文本被截断时上下滚动，使用 input 的话只能左右滚动
        nameElement.textContent = snippet.name;
        nameElement.focus();
        const contentElement = dialog.element.querySelector(`.sjosd-dialog-content`) as HTMLTextAreaElement;
        contentElement.textContent = snippet.content;

        // TODO: 保存（保存时如果 List 中没有这个代码片段，则新建，否则更新）
        // TODO: 标题不允许输入换行、保存的时候标题的换行要转换为空格
        nameElement.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                contentElement.focus();
            }
        });

        dialog.element.setAttribute("data-key", "sjosd-snippet-dialog");
        const snippetDialogClickHandler = (event: Event) => {
            const target = event.target as HTMLElement;
            if (target.tagName.toLowerCase() === "button") {
                // isNew 要在点击按钮之后判断

                switch (target.dataset.action) {
                    case "delete":
                        // 确定后删除代码片段/不新建代码片段、关闭 Dialog
                        this.openSnippetDeleteDialog(snippet.name, () => {
                            if (!isNew) {
                                this.deleteSnippet(snippet.id);
                            }
                            dialog.destroy();
                        }); // 取消后无操作
                        break;
                    case "cancel":
                        // 不保存（如果没有开启 CSS 实时应用，或者编辑的是 JS），直接关闭 Dialog
                        dialog.destroy();
                        break;
                    case "confirm":
                        // 新建/更新代码片段
                        if (target.dataset.type === "new") {
                            this.addSnippet(snippet);
                        } else {
                            // 更新 snippet
                            snippet.name = nameElement.value;
                            snippet.content = contentElement.value;
                            this.snippetsList = this.snippetsList.map((s: any) => s.id === snippet.id ? snippet : s);
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

        // new Protyle(this.app, dialog.element.querySelector("#protyle"), {
        //     blockId: this.getEditor().protyle.block.rootID,
        // });
    }


    /**
     * 打开代码片段删除确认对话框
     * @param snippetName 代码片段名称
     * @param confirm 确认回调
     * @param cancel 取消回调
     */
    private openSnippetDeleteDialog(snippetName: any, confirm?: () => void, cancel?: () => void) {
        this.confirmDialog(
            this.i18n.deleteSnippet,
            this.i18n.deleteSnippetConfirm.replace("${x}", snippetName ? " <b>" + snippetName + "</b> " : ""),
            true,
            () => {
                // 删除代码片段
                confirm?.();
            },
            () => {
                // 不删除代码片段
                cancel?.();
            }
        )
    }


    /**
     * 确认对话框（参考原生代码 app/src/dialog/confirmDialog.ts ）
     * @param title 标题
     * @param text 内容
     * @param confirm 确认回调
     * @param cancel 取消回调
     */
    private confirmDialog = (title: string, text: string, isDelete: boolean = false, confirm?: () => void, cancel?: () => void) => {
        if (!text && !title) {
            confirm();
            return;
        }
        const dialog = new Dialog({
            title,
            content: `
                <div class="b3-dialog__content">
                    <div class="ft__breakword">${text}</div>
                </div>
                <div class="b3-dialog__action">
                    <button class="b3-button b3-button--cancel" id="cancelDialogConfirmBtn">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
                    <button class="b3-button ${isDelete ? "b3-button--remove" : "b3-button--text"}" id="confirmDialogConfirmBtn">${window.siyuan.languages[isDelete ? "delete" : "confirm"]}</button>
                </div>
            `,
            width: this.isMobile ? "92vw" : "520px",
        });

        dialog.element.addEventListener("click", (event) => {
            // 阻止冒泡，否则点击 Dialog 时会导致 menu 关闭
            event.stopPropagation();
            let target = event.target as HTMLElement;
            const isDispatch = typeof event.detail === "string";
            while (target && (target !== dialog.element) || isDispatch) {
                if (target.id === "cancelDialogConfirmBtn" || (isDispatch && event.detail=== "Escape")) {
                        cancel?.();
                    dialog.destroy();
                    break;
                } else if (target.id === "confirmDialogConfirmBtn" || (isDispatch && event.detail=== "Enter")) {
                        confirm?.();
                    dialog.destroy();
                    break;
                }
                target = target.parentElement;
            }
        });
        dialog.element.setAttribute("data-key", "dialog-confirm"); // Constants.DIALOG_CONFIRM
    };

    // 生成代码片段列表
    private genSnippetsHtml = (snippetsList: any[]) => {
        let snippetsHtml = "";
        snippetsList.forEach((snippet: any) => {
            snippetsHtml += `
                <div class="sjosd-snippet-item b3-menu__item" data-type="${snippet.type}" data-id="${snippet.id}">
                    <span class="sjosd-snippet-name fn__flex-1" placeholder="${this.i18n.unNamed}">${snippet.name}</span>
                    <span class="fn__space"></span>
                    <button class="block__icon block__icon--show fn__flex-center" data-type="edit"><svg><use xlink:href="#iconEdit"></use></svg></button>
                    <button class="block__icon block__icon--show fn__flex-center" data-type="delete"><svg><use xlink:href="#iconTrashcan"></use></svg></button>
                    <span class="fn__space"></span>
                    <input class="b3-switch fn__flex-center" type="checkbox"${snippet.enabled ? " checked" : ""}>
                </div>
            `;
        });
        return snippetsHtml;
    }


    /**
     * 添加顶栏菜单
     * @param rect 菜单位置
     */
    private async addMenu(rect?: DOMRect) {
        this.menu = new Menu("siyuanJsOpenSnippetsDialog", () => {
            // 此处在关闭菜单时执行
            this.menu.element.removeEventListener("click", this.menuClickHandler);
            this.menu = undefined;
            document.removeEventListener("keydown", this.menuKeyDownHandler);
            console.log("menu closed");
        });
        // 如果菜单已存在，再次点击按钮就会移除菜单，此时直接返回
        if (this.menu.isOpen) return;


        // 获取代码片段列表
        const response = await fetchSyncPost("/api/snippet/getSnippet", { type: "all", enabled: 2 });
        if (response.code !== 0) {
            // 异常处理
            this.menu.close();
            this.showErrorMessage(this.i18n.getSnippetsListFailed + " [" + response.msg + "]");
            return;
        }
        this.snippetsList = response.data.snippets;
        console.log("this.snippetsList:", this.snippetsList);

        // 插入菜单顶部
        this.menuItems = this.menu.element.querySelector(".b3-menu__items");
        const menuTop = document.createElement("div");
        menuTop.className = "sjosd-top-container fn__flex";
        // 选项卡的实现参考：https://codepen.io/havardob/pen/ExVaELV
        menuTop.innerHTML = `
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
        `;
        const radio = menuTop.querySelector("#sjosd-radio-" + this.snippetType) as HTMLInputElement;
        radio.checked = true;
        const newSnippetButton = menuTop.querySelector("button[data-type='new']") as HTMLButtonElement;
        newSnippetButton.setAttribute("aria-label", window.siyuan.languages.addAttr + " " + this.snippetType.toUpperCase());
        
        this.menuItems.append(menuTop);


        // TODO: this.snippetsList 没有代码片段的情况需要测试一下看看
        const snippetsHtml = this.genSnippetsHtml(this.snippetsList);
        this.menuItems.insertAdjacentHTML("beforeend", snippetsHtml);
        const firstMenuItem = this.menuItems.querySelector(".b3-menu__item:not(.fn__none)") as HTMLElement;
        if (firstMenuItem) {
            firstMenuItem.classList.add("b3-menu__item--current");
        }

        this.updateSnippetCount();
        this.switchSnippet();

        // 监听点击事件
        this.menu.element.addEventListener("click", this.menuClickHandler);
        // 监听键盘事件
        document.addEventListener("keydown", this.menuKeyDownHandler);
        // 监听按键操作，在选项上按回车时切换开关/特定交互、按 Delete 时删除代码片段、按 Tab 可以在各个可交互的元素上轮流切换
        // 处理太麻烦，先不做了，有其他人需要再说


        // 弹出菜单
        if (this.isMobile) {
            this.menu.fullscreen();
        } else {
            const dockRight = document.querySelector("#dockRight").getBoundingClientRect();
            this.menu.open({
                x: rect.right,
                y: rect.bottom + 1,
                isLeft: false,
            });
            // 不要用鼠标位置、菜单要固定宽度，否则切换 CSS 和 JS 时，菜单可能会大幅抖动或者超出窗口边界
            this.menu.element.style.width = "min(400px, 90vw)";
            this.menu.element.style.right = ((dockRight?.width || 0) + 1).toString() + "px";
            this.menu.element.style.left = "";
        }
    }
    

    /**
     * 菜单按键事件处理
     * @param event 键盘事件
     */
    private menuKeyDownHandler = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            const snippetElement = this.menuItems.querySelector(".b3-menu__item--current") as HTMLElement;
            if (snippetElement) {
                // 阻止冒泡，避免 menu 关闭
                event.stopPropagation();
                this.toggleSnippetSwitch(snippetElement);
            }
        } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            // 按上下方向键切换选项
            const currentMenuItem = this.menuItems.querySelector(".b3-menu__item--current") as HTMLElement;
            if (!currentMenuItem) return;

            // 获取当前显示的所有选项
            const menuItems = this.menuItems.querySelectorAll(".b3-menu__item:not(.fn__none)");
            if (menuItems.length > 0) {
                const firstMenuItem = menuItems[0] as HTMLElement;
                const lastMenuItem = menuItems[menuItems.length - 1] as HTMLElement;
                if (event.key === "ArrowUp" && currentMenuItem === firstMenuItem) {
                    // 如果当前选中的是第一个，则按下方向键上时切换到最后一个
                    event.stopPropagation();
                    currentMenuItem.classList.remove("b3-menu__item--current");
                    lastMenuItem.classList.add("b3-menu__item--current");
                } else if (event.key === "ArrowDown" && currentMenuItem === lastMenuItem) {
                    // 如果当前选中的是最后一个，则按下方向键下时切换到第一个
                    event.stopPropagation();
                    currentMenuItem.classList.remove("b3-menu__item--current");
                    firstMenuItem.classList.add("b3-menu__item--current");
                }
            }
        }
        
    };


    /**
     * 取消选中代码片段
     */
    private unselectSnippet = () => {
        this.menuItems.querySelectorAll(".b3-menu__item--current").forEach((item: any) => {
            item.classList.remove("b3-menu__item--current");
        });
    }


    /**
     * 菜单顶部点击事件处理
     * @param event 鼠标事件
     */
    private menuClickHandler = (event: MouseEvent) => {
        // 点击代码片段的删除按钮之后默认会关闭整个菜单（点击 button 后关闭菜单），这里需要阻止事件冒泡
        event.stopPropagation();
        // 阻止事件默认行为会使得点击 label 时无法切换 input 的选中状态
        // event.preventDefault();
        const target = event.target as HTMLElement;

        // 点击顶部
        if (target.closest(".sjosd-top-container")) {
            this.unselectSnippet();
            
            // 切换代码片段类型
            if (target.tagName.toLowerCase() === "input" && target.getAttribute("name") === "sjosd-tabs") {
                const input = target as HTMLInputElement;
                this.snippetType = input.id.replace("sjosd-radio-", "");
                this.switchSnippet();
            }

            // 切换整体启用状态
            if (target.classList.contains("sjosd-all-snippet-switch")) {
                const input = target as HTMLInputElement;
                this.toggleAllSnippetsEnabled(this.snippetType, input.checked);
            }
        }
            
        // 点击按钮
        if (target.tagName.toLowerCase() === "button") {
            const button = target as HTMLButtonElement;
            const type = button.dataset.type;
            const menuItem = target.closest(".b3-menu__item") as HTMLElement;
            const snippetId = menuItem?.dataset.id;

            // 取消选中代码片段，否则打开 Dialog 之后按回车会触发 menuItem 导致 menu 被移除
            this.unselectSnippet();
            if (!menuItem || !snippetId) {
                // 点击的不是代码片段，或者代码片段没有 ID
                if (type === "new") {
                    // 新建代码片段
                    const snippet = {
                        id: window.Lute.NewNodeID(),
                        name: "",
                        content: "",
                        type: this.snippetType,
                        enabled: true,
                    };
                    this.addSnippet(snippet);
                    // TODO: 测试一下添加大量代码片段，暂时取消弹窗
                    const success = false;
                    // const success = this.openSnippetDialog(snippet.id);
                    if (!success) {
                        // 如果打开对话框失败，则将代码片段添加到菜单顶部。如果打开对话框成功，则 menu 会直接关闭，不需要添加代码片段
                        const snippetsHtml = this.genSnippetsHtml([snippet]);
                        this.menuItems.querySelector(".sjosd-top-container").insertAdjacentHTML("afterend", snippetsHtml);
                        return;
                    }
                } else {
                    // 点击到不知道哪里的按钮，显示错误信息
                    this.showErrorMessage(this.i18n.getSnippetFailed);
                }
            } else if (type === "edit") {
                // 编辑代码片段
                // TODO: 对话框、页签
                this.openSnippetDialog(snippetId);
            } else if (type === "delete") {
                // 删除代码片段
                // TODO: 测试一下删除大量代码片段，暂时取消弹窗
                // this.openSnippetDeleteDialog(menuItem.querySelector(".sjosd-snippet-name").textContent, () => {
                    // 确定后删除代码片段
                    this.deleteSnippet(snippetId);
                    menuItem.remove();
                    // 查找对应的 Dialog，将“确定”按钮的文案改为“新增”
                    const confirmButton = document.querySelector(`.sjosd-dialog-container[data-id="${snippetId}"] + .b3-dialog__action button[data-action="confirm"]`) as HTMLButtonElement;
                    if (confirmButton) {
                        confirmButton.textContent = window.siyuan.languages.new;
                    }
                // }); // 取消后无操作
            }
            return;
        }

        // 点击代码片段
        const snippetElement = target.closest(".b3-menu__item") as HTMLElement;
        this.toggleSnippetSwitch(snippetElement, target);
    };


    // 切换开关
    private toggleSnippetSwitch = (snippetElement: HTMLElement, target?: HTMLElement) => {
        if (snippetElement && snippetElement.dataset.id) {
            const checkBox = snippetElement.querySelector("input") as HTMLInputElement;
            if (!target || target !== checkBox) {
                // 如果点击的不是 checkBox 就手工切换开关状态
                checkBox.checked = !checkBox.checked;
            }
            // 切换代码片段启用状态
            this.toggleSnippetEnabled(snippetElement.dataset.id, checkBox.checked);
        }
    };


    // /**
    //  * 获取代码片段类型
    //  * @param id 代码片段 ID
    //  * @returns 代码片段类型
    //  */
    // private getSnippetType = (id: string) => {
    //     const type: string | false = this.snippetsList.find((snippet: any) => snippet.id === id)?.type || false;
    //     if (!type) {
    //         console.log("getSnippetType 失败，显示错误信息");
    //         this.showErrorMessage(this.i18n.getSnippetFailed);
    //     }
    //     return type;
    // };


    /**
     * 添加代码片段
     * @param snippet 代码片段
     */
    private addSnippet = (snippet: any) => {
        // 将 snippet 添加到 snippetsList 开头
        this.snippetsList.unshift(snippet);
        this.setSnippetPost(this.snippetsList);
        this.addSnippetElement(snippet.id, snippet.type, snippet.content);
        this.updateSnippetCount();
    };


    /**
     * 删除代码片段
     * @param id 代码片段 ID
     */
    private deleteSnippet = (id: string) => {
        // 先从 snippetsList 获取到移除的代码片段的类型，然后才在 snippetsList 中删除代码片段
        this.snippetsList = this.snippetsList.filter((snippet: any) => snippet.id !== id);
        this.setSnippetPost(this.snippetsList);
        this.removeSnippetElement(id, this.snippetType);
        this.updateSnippetCount();
    };

    /**
     * 切换代码片段启用状态
     * @param id 代码片段 ID
     * @param enabled 是否启用
     */
    private toggleSnippetEnabled = (id: string, enabled: boolean) => {
        const snippet = this.snippetsList.find((snippet: any) => snippet.id === id);
        if (snippet) {
            // 更新代码片段列表
            snippet.enabled = enabled;
            this.setSnippetPost(this.snippetsList);

            // 更新代码片段元素
            if (enabled) {
                this.addSnippetElement(id, this.snippetType, snippet.content);
            } else {
                this.removeSnippetElement(id, this.snippetType);
            }
        }
    };


    /**
     * 切换整体启用状态
     * @param snippetType 代码片段类型
     * @param enabled 是否启用
     */
    private toggleAllSnippetsEnabled = (snippetType: string, enabled: boolean) => {
        // 更新全局变量和配置
        if (snippetType === "css") {
            window.siyuan.config.snippet.enabledCSS = enabled;
        } else if (snippetType === "js") {
            window.siyuan.config.snippet.enabledJS = enabled;
        }
        fetchPost("/api/setting/setSnippet", window.siyuan.config.snippet);

        // 更新整体启用状态开关状态（依赖全局变量，所以要在更新全局变量之后执行）
        this.updateAllSnippetSwitch();

        // 更新代码片段元素
        const filteredSnippets = this.snippetsList.filter((snippet: any) => snippet.type === snippetType && snippet.enabled === true);
        if (enabled) {
            filteredSnippets.forEach((snippet: any) => {
                this.addSnippetElement(snippet.id, snippet.type, snippet.content);
            });
        } else {
            filteredSnippets.forEach((snippet: any) => {
                this.removeSnippetElement(snippet.id, snippet.type);
            });
        }
    };

    // 插件不使用该函数，仅用来参考原生写法
    private setSnippet = (dialog: Dialog, oldSnippets: any[]) => {
        const snippets: any[] = [];
        dialog.element.querySelectorAll("[data-id]").forEach((item) => {
            snippets.push({
                id: item.getAttribute("data-id"),
                name: item.querySelector("input").value,
                type: item.getAttribute("data-type"),
                content: item.querySelector("textarea").value,
                enabled: (item.querySelector(".b3-switch") as HTMLInputElement).checked
            });
        });
        if ((oldSnippets === snippets) &&
            window.siyuan.config.snippet.enabledCSS === (dialog.element.querySelector('.b3-switch[data-action="toggleCSS"]') as HTMLInputElement).checked &&
            window.siyuan.config.snippet.enabledJS === (dialog.element.querySelector('.b3-switch[data-action="toggleJS"]') as HTMLInputElement).checked) {
            dialog.destroy({cancel: "true"});
        } else {
            this.setSnippetPost(snippets);
        }
    };


    /**
     * 设置代码片段（参考思源本体 app/src/config/util/snippets.ts ）
     * @param snippets 代码片段
     */
    private setSnippetPost = (snippets: any[]) => {
        fetchPost("/api/snippet/setSnippet", {snippets}, (response) => {
            // 增加错误处理
            if (response.code !== 0) {
                this.showErrorMessage(this.i18n.setSnippetFailed + " [" + response.msg + "]");
                return;
            }
        });
    };


    /**
     * 获取代码片段元素 ID
     * @param id 代码片段 ID
     * @param snippetType 代码片段类型
     * @returns 代码片段元素 ID
     */
    private getSnippetElementId = (id: string, snippetType: string) => {
        return `snippet${snippetType === "css" ? "CSS" : "JS"}${id}`;
    };


    /**
     * 判断代码片段是否启用
     * @param snippetType 代码片段类型
     * @returns 是否启用
     */
    private isSnippetEnabled = (snippetType: string) => {
        return (window.siyuan.config.snippet.enabledCSS && snippetType === "css") ||
               (window.siyuan.config.snippet.enabledJS  && snippetType === "js" );
    };


    /**
     * 添加代码片段元素
     * @param elementIds 代码片段元素 ID
     */
    private addSnippetElement = (id: string, snippetType: string, content: string) => {
        if (!this.isSnippetEnabled(snippetType)) {
            // 如果对应类型的代码片段未启用，则不添加元素
            return;
        }
        const elementId = this.getSnippetElementId(id, snippetType);
        // 插入代码片段元素的方式与原生保持一致
        if (snippetType === "css") {
            document.head.insertAdjacentHTML("beforeend", `<style id="${elementId}">${content}</style>`);
        } else if (snippetType === "js") {
            const jsElement = document.createElement("script");
            jsElement.type = "text/javascript";
            jsElement.text = content;
            jsElement.id = elementId;
            document.head.appendChild(jsElement);
        }
    };


    /**
     * 移除代码片段元素
     * @param elementIds 代码片段元素 ID
     */
    private removeSnippetElement = (id: string, snippetType: string) => {
        const elementId = this.getSnippetElementId(id, snippetType);
        document.getElementById(elementId)?.remove();
    };


    /**
     * 更新代码片段元素
     * @param id 代码片段 ID
     * @param snippetType 代码片段类型
     * @param content 代码片段内容
     */
    private updateSnippetElement = (id: string, snippetType: string, content: string) => {
        const elementId = this.getSnippetElementId(id, snippetType);
        const element = document.getElementById(elementId);
        if (element) {
            if (element.innerHTML === content) return;
            this.removeSnippetElement(id, snippetType);
        }
        this.addSnippetElement(id, snippetType, content);
    };


    /**
     * 设置代码片段整体启用状态
     * @param type 代码片段类型
     */
    private setSnippetsEnabled = (type: string) => {
        const enabled = (this.menuItems.querySelector(".b3-switch") as HTMLInputElement).checked;
        if (type === "css") {
            window.siyuan.config.snippet.enabledCSS = enabled;
        } else if (type === "js") {
            window.siyuan.config.snippet.enabledJS = enabled;
        }
        fetchPost("/api/setting/setSnippet", window.siyuan.config.snippet);
    };


    /**
     * 渲染代码片段（代码目前来自思源本体 app/src/config/util/snippets.ts ）
     * 看起来像是对所有代码片段进行处理，看看能不能改成只处理变更的代码片段（包括切换整体启用状态时会产生多余一个代码片段状态变更）
     */
    private renderSnippet = () => {
        fetchPost("/api/snippet/getSnippet", {type: "all", enabled: 2}, (response) => {
            // TODO: 对比看看 snippetsList 有没有变化，有变化的话已经打开的菜单要重新渲染
            response.data.snippets.forEach((item: any) => {
                const id = `snippet${item.type === "css" ? "CSS" : "JS"}${item.id}`;
                let exitElement = document.getElementById(id) as HTMLScriptElement;
                if ((!window.siyuan.config.snippet.enabledCSS && item.type === "css") ||
                    (!window.siyuan.config.snippet.enabledJS && item.type === "js")) {
                    // 如果对应类型的代码片段未启用，则移除已存在的元素并返回
                    if (exitElement) {
                        exitElement.remove();
                    }
                    return;
                }
                if (!item.enabled) {
                    // 如果当前代码片段未启用，则移除已存在的元素并返回
                    if (exitElement) {
                        exitElement.remove();
                    }
                    return;
                }
                if (exitElement) {
                    // 如果已存在且内容未变，则不做处理；否则移除旧元素
                    if (exitElement.innerHTML === item.content) {
                        return;
                    }
                    exitElement.remove();
                }
                if (item.type === "css") {
                    // 如果是 CSS 片段，则插入 style 元素
                    document.head.insertAdjacentHTML("beforeend", `<style id="${id}">${item.content}</style>`);
                } else if (item.type === "js") {
                    // 如果是 JS 片段，则插入 script 元素
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
     * 更新整体启用状态开关状态
     */
    private updateAllSnippetSwitch = () => {
        const enabled = this.isSnippetEnabled(this.snippetType);
        const allSnippetSwitch = this.menuItems.querySelector(".sjosd-all-snippet-switch") as HTMLInputElement;
        allSnippetSwitch.checked = enabled;
    };


    /**
     * 切换代码片段类型
     */
    private switchSnippet = () => {
        this.updateAllSnippetSwitch();

        // 更新按钮提示
        this.menuItems.querySelector("button[data-type='new']").setAttribute("aria-label", window.siyuan.languages.addAttr + " " + this.snippetType.toUpperCase());

        // 过滤列表
        const isCSS = this.snippetType === "css";
        this.menuItems.querySelectorAll(isCSS ? "[data-type='css']" : "[data-type='js']").forEach((item: HTMLElement) => {
            item.classList.remove("fn__none");
        });
        this.menuItems.querySelectorAll(isCSS ? "[data-type='js']" : "[data-type='css']").forEach((item: HTMLElement) => {
            item.classList.add("fn__none");
        });
    };


    /**
     * 更新代码片段计数
     */
    private updateSnippetCount = () => {
        const cssCountElement = this.menuItems.querySelector(".sjosd-tab-count-css") as HTMLElement;
        const jsCountElement = this.menuItems.querySelector(".sjosd-tab-count-js") as HTMLElement;
        if (!cssCountElement || !jsCountElement) return;

        const cssCount = this.snippetsList.filter((item: any) => item.type === "css").length;
        const jsCount = this.snippetsList.filter((item: any) => item.type === "js").length;
        cssCountElement.textContent = cssCount > 99 ? "99+" : cssCount.toString();
        jsCountElement.textContent = jsCount > 99 ? "99+" : jsCount.toString();
    };


    /**
     * 显示错误信息
     * @param message 错误信息
     */
    private showErrorMessage = (message: string) => {
        showMessage(this.i18n.pluginDisplayName + ": " + message, undefined, "error");
    };

    // TODO: 桌面端修改代码片段之后同步到打开的新窗口（所有变更都是弹窗确认，避免以后原生改进了 https://github.com/siyuan-note/siyuan/issues/12303 造成冲突）
    // 问：桌面端使用新窗口的情况下插件能实现跨窗口通信吗？A 窗口的插件将状态同步到 B 窗口的插件，然后执行一些操作
    // 答：简单的用 localStorage、复杂的用 broadCast
    //  localStraoge.setItem 设置，window.addEventListener('storage' 监听
    //  我这边用的 broadCast 的ws方案，代码小多

    // // 自定义插件设置窗口
    // openSetting() {
    //     const dialog = new Dialog({
    //         title: this.name,
    //         content:
    //             `<div class="b3-dialog__content"><textarea class="b3-text-field fn__block" placeholder="readonly text in the menu"></textarea></div>
    //             <div class="b3-dialog__action">
    //                 <button class="b3-button b3-button--cancel">${this.i18n.cancel}</button><div class="fn__space"></div>
    //                 <button class="b3-button b3-button--text">${this.i18n.save}</button>
    //             </div>`,
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


    // 添加菜单选项
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
