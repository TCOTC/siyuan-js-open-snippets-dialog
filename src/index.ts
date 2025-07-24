import {
    Plugin,
    showMessage,
    Dialog,
    Menu,
    getFrontend,
    Setting,
    fetchPost,
    Custom,
    fetchSyncPost,
    Constants
} from "siyuan";

// 注释掉未使用的导入
// import {
//     confirm,
//     openTab,
//     adaptHotkey,
//     getBackend,
//     Protyle,
//     openWindow,
//     IOperation,
//     Constants,
//     openMobileFileById,
//     lockScreen,
//     ICard,
//     ICardData,
//     exitSiYuan,
//     getModelByDockType,
//     getAllEditor,
//     Files,
//     platformUtils,
//     openSetting,
//     openAttributePanel
// } from "siyuan";

// 注释掉有警告的导入
// import { saveLayout } from "siyuan";
import "./index.scss";
import { Snippet } from "./types";

const PLUGIN_NAME = "snippets"; // 插件名
const STORAGE_NAME = "config.json"; // 配置文件名
const TAB_TYPE = "custom-tab";

export default class PluginSnippets extends Plugin {

    private custom: () => Custom;
    private isMobile: boolean;
    private snippetsList: Snippet[];
    private _snippetType: string = window.siyuan.jcsm?.topBarMenuInputType || "css"; // 顶栏菜单默认显示 CSS 代码片段
    private menu: Menu;
    private menuItems: HTMLElement;

    // CSS 实时应用（默认开启）
    // TODO: 需要添加配置项，优先从配置中获取
    private cssRealTimeApply: boolean = true;
    // private cssRealTimeApply: boolean = false;
    // TODO: 所有使用了 this.cssRealTimeApply 来判断的地方，都要同时判断代码片段的类型：(this.cssRealTimeApply && snippet.type === "css")


    // ================================ 生命周期方法 ================================

    /**
     * 启用插件（进行各种初始化）
     */
    onload() {
        // 发布服务不启用插件
        if (window.siyuan && (window.siyuan as any).isPublish) return;

        this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        // 添加顶栏按钮
        this.addIcons(`
                <symbol id="iconJcsm" viewBox="0 0 32 32">
                    <path d="M23.498 9.332c-0.256 0.256-0.415 0.611-0.415 1.002s0.159 0.745 0.415 1.002l4.665 4.665-4.665 4.665c-0.256 0.256-0.415 0.61-0.415 1.002s0.159 0.745 0.415 1.002v0c0.256 0.256 0.61 0.415 1.002 0.415s0.745-0.159 1.002-0.415l5.667-5.667c0.256-0.256 0.415-0.611 0.415-1.002s-0.158-0.745-0.415-1.002l-5.667-5.667c-0.256-0.256-0.61-0.415-1.002-0.415s-0.745 0.159-1.002 0.415v0z"></path>
                    <path d="M7.5 8.917c-0.391 0-0.745 0.159-1.002 0.415l-5.667 5.667c-0.256 0.256-0.415 0.611-0.415 1.002s0.158 0.745 0.415 1.002l5.667 5.667c0.256 0.256 0.611 0.415 1.002 0.415s0.745-0.159 1.002-0.415v0c0.256-0.256 0.415-0.61 0.415-1.002s-0.159-0.745-0.415-1.002l-4.665-4.665 4.665-4.665c0.256-0.256 0.415-0.611 0.415-1.002s-0.159-0.745-0.415-1.002v0c-0.256-0.256-0.61-0.415-1.002-0.415v0z"></path>
                    <path d="M19.965 3.314c-0.127-0.041-0.273-0.065-0.424-0.065-0.632 0-1.167 0.413-1.35 0.985l-0.003 0.010-7.083 22.667c-0.041 0.127-0.065 0.273-0.065 0.424 0 0.632 0.413 1.167 0.985 1.35l0.010 0.003c0.127 0.041 0.273 0.065 0.424 0.065 0.632 0 1.167-0.413 1.35-0.985l0.003-0.010 7.083-22.667c0.041-0.127 0.065-0.273 0.065-0.424 0-0.632-0.413-1.167-0.985-1.35l-0.010-0.003z"></path>
                </symbol>
            `);
        const topBarCommand = this.getCustomCommand("openSnippetsManager");
        const title = !this.isMobile && topBarCommand ? this.i18n.pluginDisplayName + " " + this.updateHotkeyTip(topBarCommand) : this.i18n.pluginDisplayName;
        const topBarElement = this.addTopBar({
            icon: "iconJcsm",
            title: title,
            position: "right",
            callback: () => {
                openSnippetsManager();
            }
        });

        // 顶栏按钮点击回调：打开代码片段管理器
        const openSnippetsManager = () => {
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
                this.addMenu(topBarElement, rect);
            }
        };

        // TODO: 添加自定义标签页
        this.custom = this.addTab({
            type: TAB_TYPE,
            init() {
                this.element.innerHTML = `<div class="jcsm__custom-tab">${this.data.text}</div>`;
            },
            beforeDestroy() {
                console.log("在销毁标签页之前:", TAB_TYPE);
                // TODO: 销毁标签页时，需要获取当前页签的数据然后处理（比如保存）
            },
            destroy() {
                console.log("销毁标签页:", TAB_TYPE);
            }
        });
        // 获取已打开的所有自定义页签
        // this.getOpenedTab();

        // 注册快捷键（都默认置空）
        // 打开代码片段管理器
        this.addCommand({
            langKey: "openSnippetsManager",
            hotkey: "",
            callback: () => {
                openSnippetsManager();
            },
        });
        // 重新加载界面
        this.addCommand({
            langKey: "reloadUI",
            hotkey: "",
            callback: () => {
                this.reloadUI();
            },
        });


        // TODO: 插件设置中的各个配置项
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
            window.open("https://github.com/TCOTC/snippets");
        });
        this.setting.addItem({
            title: "Open plugin url",
            description: "Open plugin url in browser",
            actionElement: btnaElement,
        });


        console.log(this.i18n.pluginDisplayName + this.i18n.pluginOnload);
    }

    /**
     * 打开插件设置窗口（参考原生代码 app/src/plugin/Setting.ts Setting.open 方法）
     * 支持通过菜单按钮打开、被思源调用打开
     * 使用 public 才能过 lint 检查
     */
    public openSetting() {
        const dialog = new Dialog({
            title: this.i18n.pluginDisplayName,
            content: `
                <div class="b3-dialog__content"></div>
                <div class="b3-dialog__action">
                    <button class="b3-button b3-button--cancel" data-type="cancel">${window.siyuan.languages.cancel}</button>
                    <div class="fn__space"></div>
                    <button class="b3-button b3-button--text" data-type="confirm">${window.siyuan.languages.save}</button>
                </div>
            `,
            width: this.isMobile ? "92vw" : "768px",
            height: "80vh",
        });
        const contentElement = dialog.element.querySelector(".b3-dialog__content");
        this.setting.items.forEach((item) => {
            let html = "";
            let actionElement = item.actionElement;
            if (!item.actionElement && item.createActionElement) {
                actionElement = item.createActionElement();
            }
            const tagName = actionElement?.classList.contains("b3-switch") ? "label" : "div";
            if (typeof item.direction === "undefined") {
                item.direction = (!actionElement || "TEXTAREA" === actionElement.tagName) ? "row" : "column";
            }
            if (item.direction === "row") {
                html = `
                    <${tagName} class="b3-label">
                        <div class="fn__block">
                            ${item.title}
                            ${item.description ? `<div class="b3-label__text">${item.description}</div>` : ""}
                            <div class="fn__hr"></div>
                        </div>
                    </${tagName}>`;
            } else {
                html = `
                    <${tagName} class="fn__flex b3-label config__item">
                        <div class="fn__flex-1">
                            ${item.title}
                            ${item.description ? `<div class="b3-label__text">${item.description}</div>` : ""}
                        </div>
                        <span class="fn__space${actionElement ? "" : " fn__none"}"></span>
                    </${tagName}>
                `;
            }
            contentElement.insertAdjacentHTML("beforeend", html);
            if (actionElement) {
                // // 原生的代码，确认没用的话可以删除
                // if (["INPUT", "TEXTAREA"].includes(actionElement.tagName)) {
                //     dialog.bindInput(actionElement as HTMLInputElement, () => {
                //         btnsElement[1].dispatchEvent(new CustomEvent("click"));
                //     });
                // }
                if (item.direction === "row") {
                    contentElement.lastElementChild.lastElementChild.insertAdjacentElement("beforeend", actionElement);
                    actionElement.classList.add("fn__block");
                } else {
                    actionElement.classList.remove("fn__block");
                    actionElement.classList.add("fn__flex-center", "fn__size200");
                    contentElement.lastElementChild.insertAdjacentElement("beforeend", actionElement);
                }
            }
        });
        // (contentElement.querySelector("input, textarea") as HTMLElement)?.focus();
        // const btnsElement = dialog.element.querySelectorAll(".b3-dialog__action .b3-button");

        dialog.element.addEventListener("click", (event: Event) => {
            console.log("event:", event);
            // 阻止冒泡，否则点击 Dialog 时会导致 menu 关闭
            event.stopPropagation();

            const target = event.target as HTMLElement;
            if (target.tagName.toLowerCase() === "button") {
                const type = target.dataset.type;                
                // 根据按钮类型执行相应操作
                if (type === "cancel") {
                    cancelHandler();
                } else if (type === "confirm") {
                    confirmHandler();
                }
            }
        });

        const keydownHandler = (event: KeyboardEvent) => {
            console.log("keydownHandler:", event);
            if (event.key === "Escape") {
                destroyKeydownHandler(event);
                cancelHandler();
            } else if (event.key === "Enter") {
                destroyKeydownHandler(event);
                confirmHandler();
            }
        };

        const destroyKeydownHandler = (event: KeyboardEvent) => {
            // 阻止冒泡
            event.stopPropagation();
            // 移除事件监听
            document.removeEventListener("keydown", keydownHandler, true);
        };

        document.addEventListener("keydown", keydownHandler, true);

        const cancelHandler = () => {
            console.log("cancelHandler");
            this.removeDialog(dialog);
        };
        const confirmHandler = () => {
            // TODO: 保存设置
            console.log("confirmHandler");
            this.removeDialog(dialog);
        };
        
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
        delete window.siyuan.jcsm;

        console.log(this.i18n.pluginDisplayName + this.i18n.pluginUninstall);
    }

    
    // ================================ 菜单相关 ================================

    /**
     * 添加顶栏菜单
     * @param topBarElement 顶栏按钮元素
     * @param rect 菜单位置
     */
    private async addMenu(topBarElement?: HTMLElement, rect?: DOMRect) {
        this.menu = new Menu("PluginSnippets", () => {
            // 此处在关闭菜单时执行
            if (topBarElement) {
                // topBarElement 不存在时说明 this.isMobile 为 true，此时不需要修改顶栏按钮样式
                topBarElement.classList.remove("toolbar__item--active");
                // topBarCommand 有可能变，所以每次都要重新获取
                const topBarCommand = this.getCustomCommand("openSnippetsManager");
                const title = topBarCommand ? this.i18n.pluginDisplayName + " " + this.updateHotkeyTip(topBarCommand) : this.i18n.pluginDisplayName;
                topBarElement.setAttribute("aria-label", title);
            }

            // 移除事件监听
            this.menu.element.removeEventListener("click", this.menuClickHandler);
            this.menu.element.removeEventListener("mousedown", this.menuMousedownHandler);
            this.menu = undefined;
            document.removeEventListener("keydown", this.menuKeyDownHandler);

            console.log("menu closed");
        });
        // 如果菜单已存在，再次点击按钮就会移除菜单，此时直接返回
        if (this.menu.isOpen) {
            this.menu = undefined;
            if (topBarElement) {
                this.showElementTooltip(topBarElement);
            }
            return;
        }

        // 顶栏按钮样式
        if (!this.isMobile && topBarElement) {
            topBarElement.classList.add("toolbar__item--active");
            topBarElement.removeAttribute("aria-label");
            this.hideTooltip();
        }


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
        menuTop.className = "jcsm-top-container fn__flex";
        // 选项卡的实现参考：https://codepen.io/havardob/pen/ExVaELV
        menuTop.innerHTML = `
            <div class="jcsm-tabs">
                <input type="radio" id="jcsm-radio-css" data-snippet-type="css" name="jcsm-tabs"/>
                <label class="jcsm-tab" for="jcsm-radio-css">
                    <span class="jcsm-tab-text">CSS</span>
                    <span class="jcsm-tab-count jcsm-tab-count-css">0</span>
                </label>
                <input type="radio" id="jcsm-radio-js" data-snippet-type="js" name="jcsm-tabs"/>
                <label class="jcsm-tab" for="jcsm-radio-js">
                    <span class="jcsm-tab-text" style="padding-left: .2em;">JS</span>
                    <span class="jcsm-tab-count jcsm-tab-count-js">0</span>
                </label>
                <span class="jcsm-glider"></span>
            </div>
            <span class="fn__flex-1"></span>
            <button class="block__icon block__icon--show fn__flex-center ariaLabel" data-type="config" data-position="north"><svg><use xlink:href="#iconSettings"></use></svg></button>
            <button class="block__icon block__icon--show fn__flex-center ariaLabel" data-type="reload" data-position="north"><svg><use xlink:href="#iconRefresh"></use></svg></button>
            <button class="block__icon block__icon--show fn__flex-center ariaLabel" data-type="new" data-position="north"><svg><use xlink:href="#iconAdd"></use></svg></button>
            <span class="fn__space"></span>
            <input class="jcsm-all-snippets-switch b3-switch fn__flex-center" type="checkbox">
        `;
        const radio = menuTop.querySelector(`[data-snippet-type="${this.snippetType}"]`) as HTMLInputElement;
        radio.checked = true;
        const settingsButton = menuTop.querySelector("button[data-type='config']") as HTMLButtonElement;
        settingsButton.setAttribute("aria-label", window.siyuan.languages.config);
        const newSnippetButton = menuTop.querySelector("button[data-type='new']") as HTMLButtonElement;
        newSnippetButton.setAttribute("aria-label", window.siyuan.languages.addAttr + " " + this.snippetType.toUpperCase());
        const reloadUIButton = menuTop.querySelector("button[data-type='reload']") as HTMLButtonElement;
        const reloadUICommand = this.getCustomCommand("reloadUI");
        reloadUIButton.setAttribute("aria-label", (!this.isMobile && reloadUICommand) ? this.i18n.reloadUI + " " + this.updateHotkeyTip(reloadUICommand) : this.i18n.reloadUI);
        
        this.menuItems.append(menuTop);


        // TODO: this.snippetsList 没有代码片段的情况需要测试一下看看
        const snippetsHtml = this.genSnippetsHtml(this.snippetsList);
        this.menuItems.insertAdjacentHTML("beforeend", snippetsHtml);
        const firstMenuItem = this.menuItems.querySelector(".b3-menu__item:not(.fn__none)") as HTMLElement;
        if (firstMenuItem && !this.isMobile) {
            firstMenuItem.classList.add("b3-menu__item--current");
        }

        this.updateSnippetCount();
        this.switchSnippet(this.snippetType);

        // 监听点击事件
        this.menu.element.addEventListener("click", this.menuClickHandler);
        // 监听鼠标按下事件
        this.menu.element.addEventListener("mousedown", this.menuMousedownHandler);
        // 监听键盘事件
        // TODO: 有可能是在 Dialog 中按下键盘，这种情况需要考虑到
        //  因为是在 document 上监听，所以只要其他地方阻止按键冒泡就行了
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
                this.toggleSnippetEnabled(snippetElement.dataset.id, snippetElement.querySelector("input").checked, "menu");
            }
        } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            // 按上下方向键切换选项
            const menuItems = this.menuItems.querySelectorAll(".b3-menu__item:not(.fn__none)");
            const currentMenuItem = this.menuItems.querySelector(".b3-menu__item--current") as HTMLElement;
            if (menuItems.length > 0) {
                const firstMenuItem = menuItems[0] as HTMLElement;
                const lastMenuItem = menuItems[menuItems.length - 1] as HTMLElement;
                if (event.key === "ArrowUp") {
                    if (!currentMenuItem) {
                        // 如果当前没有选中任何选项，则选中最后一个选项
                        event.stopPropagation();
                        lastMenuItem.classList.add("b3-menu__item--current");
                    } else if (currentMenuItem === firstMenuItem) {
                        // 如果当前选中的是第一个，则按方向键上时切换到最后一个
                        event.stopPropagation();
                        currentMenuItem.classList.remove("b3-menu__item--current");
                        lastMenuItem.classList.add("b3-menu__item--current");
                    }
                } else if (event.key === "ArrowDown") {
                    if (!currentMenuItem) {
                        // 如果当前没有选中任何选项，则选中第一个选项
                        event.stopPropagation();
                        firstMenuItem.classList.add("b3-menu__item--current");
                    } else if (currentMenuItem === lastMenuItem) {
                        // 如果当前选中的是最后一个，则按方向键下时切换到第一个
                        event.stopPropagation();
                        currentMenuItem.classList.remove("b3-menu__item--current");
                        firstMenuItem.classList.add("b3-menu__item--current");
                    }
                }
            }
        }
        
    };

    /**
     * 菜单鼠标按下事件处理
     */
    private menuMousedownHandler = () => {
        // 点击菜单时要显示在最上层
        this.bringElementToFront(this.menu.element);
    };

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

        if (document.activeElement === target) {
            // 移除焦点，避免后续回车还会触发按钮
            (document.activeElement as HTMLElement).blur();
        }

        // 点击顶部
        if (target.closest(".jcsm-top-container")) {
            this.unselectSnippet();
            
            // 切换代码片段类型
            if (target.tagName.toLowerCase() === "input" && target.getAttribute("name") === "jcsm-tabs") {
                const type = target.dataset.snippetType;
                this.snippetType = type;
                this.switchSnippet(type);
            }

            // 切换全局开关
            if (target.classList.contains("jcsm-all-snippets-switch")) {
                this.toggleAllSnippetsEnabled(this.snippetType, (target as HTMLInputElement).checked);
            }
        }
            
        // 点击按钮
        if (target.tagName.toLowerCase() === "button") {
            const button = target as HTMLButtonElement;
            const type = button.dataset.type;
            const menuItem = target.closest(".b3-menu__item") as HTMLElement;
            const snippetId = menuItem?.dataset.id;
            const snippetType = menuItem?.dataset.type;
            const snippetName = menuItem?.querySelector(".jcsm-snippet-name")?.textContent;
            
            // 取消选中代码片段，否则打开 Dialog 之后按回车会触发 menuItem 导致 menu 被移除
            this.unselectSnippet();
            if (type === "config") {
                // 打开设置对话框
                this.openSetting();
            } else if (type === "reload") {
                // 重新加载界面
                this.reloadUI();
            } else if (type === "new") {
                // 新建代码片段
                const snippet: Snippet = {
                    id: window.Lute.NewNodeID(),
                    name: "",
                    content: "",
                    type: this.snippetType as "css" | "js",
                    enabled: true,
                };
                let confirmText;
                // TODO: 如果开启了 CSS 实时应用，则这个时候就添加代码片段
                if (snippet.type === "css" && this.cssRealTimeApply) {
                    this.addSnippet(snippet);
                    confirmText = window.siyuan.languages.save;
                } else {
                    confirmText = window.siyuan.languages.new;
                }
                this.snippetDialog(snippet, confirmText);
            } else if (type === "edit" && snippetId) {
                // 编辑代码片段，打开编辑对话框
                const snippet = this.snippetsList.find((snippet: Snippet) => snippet.id === snippetId);
                if (snippet) {
                    this.snippetDialog(snippet);
                } else {
                    this.showErrorMessage(this.i18n.getSnippetFailed);
                }
                // TODO: 编辑页签，等其他功能稳定之后再做
            } else if (type === "delete" && menuItem) {
                // 删除代码片段
                this.snippetDeleteDialog(snippetName, () => {
                    // 弹窗确定后删除代码片段
                    this.deleteSnippet(snippetId, snippetType);
                    menuItem.remove();
                    // 查找对应的打开着的 Dialog，将“保存”按钮的文案改为“新建”
                    const dialog = document.querySelector(`.b3-dialog--open[data-key="jcsm-snippet-dialog"][data-snippet-id="${snippetId}"]`) as HTMLDivElement;
                    const confirmButton = dialog?.querySelector(`.jcsm-dialog .b3-dialog__action button[data-action="confirm"]`) as HTMLButtonElement;
                    if (confirmButton) {
                        confirmButton.textContent = window.siyuan.languages.new;
                    }
                }); // 取消后无操作
            } else {
                // 点击到不知道哪里的按钮，或者代码片段没有 ID，显示错误信息
                this.showErrorMessage(this.i18n.getSnippetFailed);
            }
            return; // 不执行后面的判断
        }

        // 点击代码片段
        const snippetElement = target.closest(".b3-menu__item") as HTMLElement;
        if (snippetElement) {
            const checkBox = snippetElement.querySelector("input") as HTMLInputElement;
            if (target !== checkBox) {
                // 如果点击的不是 checkBox 就手工切换开关状态
                checkBox.checked = !checkBox.checked;
            }
            const enabled = checkBox.checked;
            this.toggleSnippetEnabled(snippetElement.dataset.id, enabled, "menu");
            if (this.isMobile) {
                this.unselectSnippet()
            }
        }
    };

    /**
     * 生成代码片段列表
     * @param snippetsList 代码片段列表
     * @returns 代码片段列表 HTML
     */
    private genSnippetsHtml(snippetsList: Snippet[]) {
        let snippetsHtml = "";
        snippetsList.forEach((snippet: Snippet) => {
            snippetsHtml += `
                <div class="jcsm-snippet-item b3-menu__item" data-type="${snippet.type}" data-id="${snippet.id}">
                    <span class="jcsm-snippet-name fn__flex-1" placeholder="${this.i18n.unNamed}">${snippet.name}</span>
                    <span class="fn__space"></span>
                    <button class="block__icon block__icon--show fn__flex-center" data-type="edit"><svg><use xlink:href="#iconEdit"></use></svg></button>
                    <button class="block__icon block__icon--show fn__flex-center" data-type="delete"><svg><use xlink:href="#iconTrashcan"></use></svg></button>
                    <span class="fn__space"></span>
                    <input class="b3-switch fn__flex-center" type="checkbox"${snippet.enabled ? " checked" : ""}>
                </div>
            `;
        });
        return snippetsHtml;
    };

    /**
     * 切换代码片段类型
     * @param snippetType 代码片段类型
     */
    private switchSnippet(snippetType: string) {
        this.updateAllSnippetSwitch(snippetType);

        // 更新按钮提示
        this.menuItems.querySelector("button[data-type='new']").setAttribute("aria-label", window.siyuan.languages.addAttr + " " + snippetType.toUpperCase());

        // 过滤列表
        const isCSS = snippetType === "css";
        this.menuItems.querySelectorAll(isCSS ? "[data-type='css']" : "[data-type='js']").forEach((item: HTMLElement) => {
            item.classList.remove("fn__none");
        });
        this.menuItems.querySelectorAll(isCSS ? "[data-type='js']" : "[data-type='css']").forEach((item: HTMLElement) => {
            item.classList.add("fn__none");
        });
    };

    /**
     * 更新全局开关状态
     * @param snippetType 代码片段类型
     */
    private updateAllSnippetSwitch(snippetType: string) {
        const enabled = this.isAllSnippetsEnabled(snippetType);
        const allSnippetSwitch = this.menuItems.querySelector(".jcsm-all-snippets-switch") as HTMLInputElement;
        allSnippetSwitch.checked = enabled;
    };

    /**
     * 更新代码片段计数
     */
    private updateSnippetCount() {
        const cssCountElement = this.menuItems.querySelector(".jcsm-tab-count-css") as HTMLElement;
        const jsCountElement = this.menuItems.querySelector(".jcsm-tab-count-js") as HTMLElement;
        if (!cssCountElement || !jsCountElement) return;

        const cssCount = this.snippetsList.filter((item: Snippet) => item.type === "css").length;
        const jsCount = this.snippetsList.filter((item: Snippet) => item.type === "js").length;
        cssCountElement.textContent = cssCount > 99 ? "99+" : cssCount.toString();
        jsCountElement.textContent = jsCount > 99 ? "99+" : jsCount.toString();
    };


    // ================================ 代码片段管理 ================================

    /**
     * 添加代码片段
     * @param snippet 代码片段
     * @param addToMenu 是否将代码片段添加到菜单顶部
     */
    private addSnippet(snippet: Snippet, addToMenu: boolean = this.cssRealTimeApply) {
        // 将 snippet 添加到 snippetsList 开头
        this.snippetsList.unshift(snippet);
        this.setSnippetPost(this.snippetsList);
        this.updateSnippetElement(snippet.id, snippet.type, snippet.content);
        this.updateSnippetCount();

        // 将代码片段添加到菜单顶部
        if (addToMenu) {
            const snippetsHtml = this.genSnippetsHtml([snippet]);
            this.menuItems.querySelector(".jcsm-top-container")?.insertAdjacentHTML("afterend", snippetsHtml);
        }
    };

    /**
     * 删除代码片段
     * @param id 代码片段 ID
     * @param snippetType 代码片段类型
     */
    private deleteSnippet(id: string, snippetType: string) {
        if (!id || !snippetType) {
            this.showErrorMessage(this.i18n.deleteSnippetFailed);
            return;
        }
        this.snippetsList = this.snippetsList.filter((snippet: Snippet) => snippet.id !== id);
        this.setSnippetPost(this.snippetsList);
        this.removeSnippetElement(id, snippetType);
        this.updateSnippetCount();
    };

    /**
     * 切换代码片段启用状态
     * @param snippetId 代码片段 ID
     * @param enabled 是否启用
     * @param type 不需要同步开关状态的类型
     */
    private toggleSnippetEnabled(snippetId: string, enabled: boolean, type: string) {
        if (!snippetId) {
            this.showErrorMessage(this.i18n.toggleSnippetFailed);
            return;
        }
        const snippet: Snippet | undefined = this.snippetsList.find((snippet: Snippet) => snippet.id === snippetId);
        if (snippet) {
            // 更新代码片段列表
            snippet.enabled = enabled;
            this.setSnippetPost(this.snippetsList);

            // 更新代码片段元素
            if (enabled) {
                this.updateSnippetElement(snippetId, snippet.type, snippet.content);
            } else {
                this.removeSnippetElement(snippetId, snippet.type);
            }
        }

        // 同步开关状态到其他地方（目前只有 menu 和 dialog，未来可能增加自定义页签）
        if (type !== "menu" && !this.cssRealTimeApply) {
            // 如果没有开启 CSS 实时应用，则不更新
            return
        }
        if (type !== "menu") {
            // TODO: 切换菜单上对应的代码片段的开关状态
            // 切换菜单上对应的代码片段的开关状态
            const snippetElement = this.menuItems.querySelector(`div[data-id="${snippetId}"]`) as HTMLElement;
            if (snippetElement) {
                snippetElement.querySelector("input").checked = enabled;
            }
        }
        if (type !== "dialog") {
            // TODO: 切换对应的 Dialog 的开关状态
            const dialog = document.querySelector(`div[data-key="jcsm-snippet-dialog"][data-snippet-id="${snippetId}"]`) as HTMLDivElement;
            if (dialog) {
                const switchInput = dialog.querySelector("input[data-type='snippetSwitch']") as HTMLInputElement;
                if (switchInput) {
                    switchInput.checked = enabled;
                }
            }
        }
    };

    /**
     * 切换全局开关
     * @param snippetType 代码片段类型
     * @param enabled 是否启用
     */
    private toggleAllSnippetsEnabled(snippetType: string, enabled: boolean) {
        // 更新全局变量和配置
        if (snippetType === "css") {
            window.siyuan.config.snippet.enabledCSS = enabled;
        } else if (snippetType === "js") {
            window.siyuan.config.snippet.enabledJS = enabled;
        }
        fetchPost("/api/setting/setSnippet", window.siyuan.config.snippet);

        // 更新全局开关状态
        this.updateAllSnippetSwitch(snippetType);

        // 更新代码片段元素
        const filteredSnippets = this.snippetsList.filter((snippet: Snippet) => snippet.type === snippetType && snippet.enabled === true);
        if (enabled) {
            filteredSnippets.forEach((snippet: Snippet) => {
                this.updateSnippetElement(snippet.id, snippet.type, snippet.content);
            });
        } else {
            filteredSnippets.forEach((snippet: Snippet) => {
                this.removeSnippetElement(snippet.id, snippet.type);
            });
        }
    };

    /**
     * 设置代码片段（参考思源本体 app/src/config/util/snippets.ts ）
     * @param snippets 所有代码片段列表
     */
    private setSnippetPost(snippets: Snippet[]) {
        console.log("setSnippetPost", snippets);
        fetchPost("/api/snippet/setSnippet", {snippets}, (response) => {
            // 增加错误处理
            if (response.code !== 0) {
                this.showErrorMessage(this.i18n.setSnippetFailed + " [" + response.msg + "]");
                return;
            }
        });
    };

    // TODO: 这部分代码确认没用之后删除
    // /**
    //  * 渲染代码片段（代码目前来自思源本体 app/src/config/util/snippets.ts ）
    //  * 看起来像是对所有代码片段进行处理，看看能不能改成只处理变更的代码片段（包括切换全局开关时会产生多余一个代码片段状态变更）
    //  */
    // private renderSnippet() {
    //     fetchPost("/api/snippet/getSnippet", {type: "all", enabled: 2}, (response) => {
    //         // TODO: 对比看看 snippetsList 有没有变化，有变化的话已经打开的菜单要重新渲染
    //         response.data.snippets.forEach((item: any) => {
    //             const id = `snippet${item.type === "css" ? "CSS" : "JS"}${item.id}`;
    //             let exitElement = document.getElementById(id) as HTMLScriptElement;
    //             if ((!window.siyuan.config.snippet.enabledCSS && item.type === "css") ||
    //                 (!window.siyuan.config.snippet.enabledJS && item.type === "js")) {
    //                 // 如果对应类型的代码片段未启用，则移除已存在的元素并返回
    //                 if (exitElement) {
    //                     exitElement.remove();
    //                 }
    //                 return;
    //             }
    //             if (!item.enabled) {
    //                 // 如果当前代码片段未启用，则移除已存在的元素并返回
    //                 if (exitElement) {
    //                     exitElement.remove();
    //                 }
    //                 return;
    //             }
    //             if (exitElement) {
    //                 // 如果已存在且内容未变，则不做处理；否则移除旧元素
    //                 if (exitElement.innerHTML === item.content) {
    //                     return;
    //                 }
    //                 exitElement.remove();
    //             }
    //             if (item.type === "css") {
    //                 // 如果是 CSS 片段，则插入 style 元素
    //                 document.head.insertAdjacentHTML("beforeend", `<style id="${id}">${item.content}</style>`);
    //             } else if (item.type === "js") {
    //                 // 如果是 JS 片段，则插入 script 元素
    //                 exitElement = document.createElement("script");
    //                 exitElement.type = "text/javascript";
    //                 exitElement.text = item.content;
    //                 exitElement.id = id;
    //                 document.head.appendChild(exitElement);
    //             }
    //         });
    //     });
    // };


    // ================================ 代码片段元素操作 ================================

    /**
     * 更新代码片段元素
     * @param id 代码片段 ID
     * @param snippetType 代码片段类型
     * @param content 代码片段内容
     */
    private updateSnippetElement(id: string, snippetType: string, content: string) {
        const elementId = this.getSnippetElementId(id, snippetType);
        const element = document.getElementById(elementId);
        if (element) {
            if (element.innerHTML === content) return;
            this.removeSnippetElement(id, snippetType);
        }
        this.addSnippetElement(id, snippetType, content);
    };

    /**
     * 移除代码片段元素
     * @param id 代码片段 ID
     * @param snippetType 代码片段类型
     */
    private removeSnippetElement(id: string, snippetType: string) {
        const elementId = this.getSnippetElementId(id, snippetType);
        document.getElementById(elementId)?.remove();
    };

    /**
     * 添加代码片段元素（为了避免重复添加，其他地方应当调用 updateSnippetElement ，本方法仅提供给 updateSnippetElement 使用）
     * @param id 代码片段 ID
     * @param snippetType 代码片段类型
     * @param content 代码片段内容
     */
    private addSnippetElement(id: string, snippetType: string, content: string) {
        if (!this.isAllSnippetsEnabled(snippetType)) {
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
     * 获取代码片段元素 ID
     * @param id 代码片段 ID
     * @param snippetType 代码片段类型
     * @returns 代码片段元素 ID
     */
    private getSnippetElementId(id: string, snippetType: string) {
        return `snippet${snippetType === "css" ? "CSS" : "JS"}${id}`;
    };


    // ================================ 对话框相关 ================================

    // dialog.destroy 还能传递参数，看看这个写法能不能用上
    // dialog.destroy({cancel: "true"});

    /**
     * 生成代码片段对话框
     * @param snippet 代码片段
     * @param confirmText 确认按钮的文案
     */
    private genSnippetDialog(snippet: Snippet, confirmText: string = window.siyuan.languages.save) {
        return `
            <div class="jcsm-dialog">
                <div class="jcsm-dialog-header resize__move"></div>
                <div class="jcsm-dialog-container fn__flex-1" data-id="${snippet.id || ""}" data-type="${snippet.type}">
                    <div class="fn__flex">
                        <textarea class="jcsm-dialog-name fn__flex-1 b3-text-field" spellcheck="false" rows="1" placeholder="${window.siyuan.languages.title}" style="resize:none; width:${this.isMobile ? "50%" : "300px"}"></textarea>
                        <div class="fn__space"></div>
                        <button data-action="delete" class="block__icon block__icon--show ariaLabel" aria-label="${window.siyuan.languages.remove}" data-position="north">
                            <svg><use xlink:href="#iconTrashcan"></use></svg>
                        </button>
                        <div class="fn__space"></div>
                        <input data-type="snippetSwitch" class="b3-switch fn__flex-center" type="checkbox"${snippet.enabled ? " checked" : ""}>
                    </div>
                    <div class="fn__hr"></div>
                    <textarea class="jcsm-dialog-content fn__flex-1 b3-text-field" spellcheck="false" placeholder="${window.siyuan.languages.codeSnippet}" style="resize:none; font-family:var(--b3-font-family-code)"></textarea>
                    <div class="fn__hr--b"></div>
                </div>
                <div class="b3-dialog__action">
                    <button data-action="cancel" class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
                    <button data-action="confirm" class="b3-button b3-button--text">${confirmText}</button>
                </div>
            </div>
        `;
    };

    /**
     * 代码片段编辑对话框
     * @param snippetId 代码片段 ID
     * @param confirmText 确认按钮的文案
     */
    private snippetDialog(snippet: Snippet, confirmText?: string) {
        // 检查参数
        const paramError: string[] = [];
        if (!snippet) {
            paramError.push("snippet");
        } else {
            if (!snippet.id) {
                paramError.push("snippet.id");
            }
            if (!snippet.type) {
                paramError.push("snippet.type");
            }
        }
        if (paramError.length > 0) {
            this.showErrorMessage(this.i18n.snippetDialogParamError + "[" + paramError.join(", ") + "]");
            return false;
        }

        // 重置 Dialog 样式
        const resetDialogRootStyle = (dialogRootElement: HTMLElement) => {
            dialogRootElement.style.zIndex = (++window.siyuan.zIndex).toString();
            dialogRootElement.querySelector(".b3-dialog__scrim")?.remove();
            const dialogElement = dialogRootElement.querySelector(".b3-dialog") as HTMLElement;
            dialogElement.style.width = "0";
            dialogElement.style.height = "0";
            dialogElement.style.left = "50vw";
            dialogElement.style.top = "50vh";
            const dialogContainer = dialogElement.querySelector(".b3-dialog__container") as HTMLElement;
            dialogContainer.style.position = "fixed";
        }
        
        // TODO: 如果已经有打开的对应 snippetId 的 Dialog，则激活它（zIndex）、重置位置 resetDialogRootStyle()
        const existedDialog = document.querySelector(`.b3-dialog--open[data-key="jcsm-snippet-dialog"][data-snippet-id="${snippet.id}"]`) as HTMLDivElement;
        if (existedDialog) {
            // 激活它
            this.bringElementToFront(existedDialog);
            // 重置位置
            resetDialogRootStyle(existedDialog);
            return;
        }

        // 创建 Dialog
        const dialog = new Dialog({
            content: this.genSnippetDialog(snippet, confirmText),
            width: this.isMobile ? "92vw" : "70vw",
            height: "80vh",
            hideCloseIcon: this.isMobile,
        });
        // 备注：dialog.destroy() 方法会导致菜单被关闭，需要时使用重新实现的 removeDialog()

        if (!this.isMobile) {
            // TODO: 桌面端鼠标点击 Dialog 之后就会被关闭菜单，所以这里提前关闭
            // this.menu.close();
            // 桌面端支持同时打开多个 Dialog，需要修改样式
            resetDialogRootStyle(dialog.element);
        }

        // 设置 Dialog 属性
        dialog.element.setAttribute("data-key", "jcsm-snippet-dialog");
        dialog.element.setAttribute("data-snippet-id", snippet.id);
        // dialog.element.setAttribute("data-snippet-new", isNew ? "true" : "false");

        // 设置代码片段标题和内容
        const nameElement = dialog.element.querySelector(".jcsm-dialog-name") as HTMLTextAreaElement; // 标题使用 textarea 是为了能够在文本被截断时上下滚动，使用 input 的话只能左右滚动
        nameElement.value = snippet.name;
        nameElement.focus();
        const contentElement = dialog.element.querySelector(".jcsm-dialog-content") as HTMLTextAreaElement;
        contentElement.value = snippet.content;
        const switchInput = dialog.element.querySelector("input[data-type='snippetSwitch']") as HTMLInputElement;
        // switchInput.checked = snippet.enabled; // genSnippetDialog 的时候已经添加了 enabled 属性，这里不需要重复设置

        // TODO: 保存（保存时如果 List 中没有这个代码片段，则新建，否则更新）
        // TODO: 标题不允许输入换行、保存的时候标题的换行要转换为空格
        nameElement.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                contentElement.focus();
            }
            // TODO: 按 Tab 键切换焦点
        });

        // TODO: 监听粘贴，在标题粘贴的内容的换行要转换为空格

        dialog.element.addEventListener("mousedown", () => {
            // 点击 Dialog 时要显示在最上层
            this.bringElementToFront(dialog.element);
        });

        dialog.element.addEventListener("click", (event: Event) => {
            // 阻止冒泡，否则点击 Dialog 时会导致 menu 关闭
            event.stopPropagation();

            const target = event.target as HTMLElement;
            if (target.tagName.toLowerCase() === "input" && target.getAttribute("data-type") === "snippetSwitch") {
                // TODO: 切换代码片段的开关状态
                if (target === switchInput) {
                    if (this.cssRealTimeApply) {
                        const enabled = switchInput.checked;
                        this.toggleSnippetEnabled(dialog.element.dataset.snippetId, enabled, "dialog");
                    }
                }

                // TODO: 分别处理 实时应用开关状态 和 点击保存后更新代码片段的开关状态 两种情况


            } else if (target.tagName.toLowerCase() === "button") {
                // TODO: isNewSnippet 为 true 时表示这个代码片段没有添加到 snippetsList 中（也没有添加到 DOM 中？）
                const isNewSnippet = !this.snippetsList.find((s: Snippet) => s.id === snippet.id);
                switch (target.dataset.action) {
                    // 桌面端在前面执行了 this.menu.close(); 所以不用管菜单，但移动端需要根据情况修改菜单列表
                    // TODO: 还是不执行 this.menu.close() 了，让菜单和 Dialog 能一起显示

                    case "delete":
                        // 弹窗确定后删除代码片段/不新建代码片段、关闭 Dialog
                        this.snippetDeleteDialog(snippet.name, () => {
                            if (!isNewSnippet) {
                                this.deleteSnippet(snippet.id, snippet.type);
                            }
                            this.removeDialog(dialog);
                        }); // 取消后无操作
                        break;
                    case "cancel":
                        // TODO: 如果有变更没保存（inNew || ((没有开启 CSS 实时应用 || 或者编辑的是 JS) && 存在变更)），需要弹窗提示确认
                        //  确认回调 → 不保存，直接 removeDialog()
                        //  取消回调 → 无操作

                        // 如果不存在变更，直接移除 Dialog
                        this.removeDialog(dialog);
                        break;
                    case "confirm":
                        // 新建/更新代码片段
                        snippet.name = nameElement.value.replace(/\n/g, " "); // 标题的换行要转换为空格
                        snippet.content = contentElement.value;
                        snippet.enabled = switchInput.checked;
                        console.log("confirm", snippet);
                        if (isNewSnippet) {
                            // 如果已经删除了对应 ID 的代码片段而 Dialog 还在，此时点击“新建”按钮需要新建代码片段
                            // 无视 this.cssRealTimeApply，在 Dialog 新建的代码片段都要添加到菜单顶部
                            this.addSnippet(snippet, true);
                        } else {
                            // 更新现有 snippet
                            this.snippetsList = this.snippetsList.map((s: Snippet) => s.id === snippet.id ? snippet : s);
                            this.setSnippetPost(this.snippetsList);
                            this.updateSnippetElement(snippet.id, snippet.type, snippet.content);
                        }
                        this.removeDialog(dialog);
                        break;
                }
            } else if (target.closest(".b3-dialog__close")) {
                this.removeDialog(dialog);
            }
            return;
            // TODO: 研究一下怎样才能不用捕获阶段
        }, true); // 点击 .b3-dialog__close 时阻止冒泡还不够，需要在捕获阶段阻止冒泡才行
        return true;

        // 还能插入 Protyle 编辑器，以后说不定能用上
        // new Protyle(this.app, dialog.element.querySelector("#protyle"), {
        //     blockId: this.getEditor().protyle.block.rootID,
        // });
    }

    /**
     * 代码片段删除确认对话框
     * @param snippetName 代码片段名称
     * @param confirm 确认回调
     * @param cancel 取消回调
     */
    private snippetDeleteDialog(snippetName: string, confirm?: () => void, cancel?: () => void) {
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
        );
    };

    /**
     * 确认对话框（参考原生代码 app/src/dialog/confirmDialog.ts ）
     * @param title 对话框标题
     * @param text 对话框内容
     * @param confirm 确认回调
     * @param cancel 取消回调
     */
    private confirmDialog(title: string, text: string, isDelete = false, confirm?: () => void, cancel?: () => void) {
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
                    <button class="b3-button b3-button--cancel" data-type="cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
                    <button class="b3-button ${isDelete ? "b3-button--remove" : "b3-button--text"}" data-type="confirm">${window.siyuan.languages[isDelete ? "delete" : "confirm"]}</button>
                </div>
            `,
            width: this.isMobile ? "92vw" : "520px",
        });

        dialog.element.addEventListener("click", (event) => {
            console.log("event:", event);
            // 阻止冒泡，否则点击 Dialog 时会导致 menu 关闭
            event.stopPropagation();
            let target = event.target as HTMLElement;
            const isDispatch = typeof event.detail === "string";
            while (target && (target !== dialog.element) || isDispatch) {
                if (target.dataset.type === "cancel" || (isDispatch && event.detail=== "Escape")) {
                        cancel?.();
                        this.removeDialog(dialog);
                    break;
                } else if (target.dataset.type === "confirm" || (isDispatch && event.detail=== "Enter")) {
                        confirm?.();
                        this.removeDialog(dialog);
                    break;
                }
                target = target.parentElement;
            }
        });
        dialog.element.setAttribute("data-key", "dialog-confirm"); // Constants.DIALOG_CONFIRM
    };

    /**
     * 移除 Dialog
     * @param dialog 对话框
     */
    private removeDialog(dialog: Dialog) {
        const dialogElement = dialog.element;
        if (dialogElement) {
            dialogElement.classList.remove("b3-dialog--open"); // 有个关闭动画
            setTimeout(() => {
                dialogElement.remove();
            }, Constants.TIMEOUT_DBLCLICK);
        }
    }


    // ================================ 工具方法 ================================

    /**
     * 弹出错误消息
     * @param message 错误消息
     */
    private showErrorMessage(message: string) {
        showMessage(this.i18n.pluginDisplayName + ": " + message, undefined, "error");
        // TODO: 在 temp 目录记录错误日志（格式参考 siyuan.log）
    };

    /**
     * 判断代码片段类型是否启用
     * @param snippetType 代码片段类型
     * @returns 是否启用
     */
    private isAllSnippetsEnabled(snippetType: string) {
        return (window.siyuan.config.snippet.enabledCSS && snippetType === "css") ||
               (window.siyuan.config.snippet.enabledJS  && snippetType === "js" );
    };

    /**
     * 取消选中代码片段
     */
    private unselectSnippet() {
        this.menuItems.querySelectorAll(".b3-menu__item--current").forEach((item: HTMLElement) => {
            item.classList.remove("b3-menu__item--current");
        });
    };

    /**
     * 重新加载界面
     */
    private reloadUI() {
        fetchPost("/api/ui/reloadUI", {}, (response: any) => {
            if (response.status !== 200) {
                this.showErrorMessage(this.i18n.reloadUIFailed);
            }
        });
    };

    /**
     * 判断是否是 Mac（原生代码 app/src/protyle/util/compatibility.ts ）
     * @returns 是否是 Mac
     */
    private isMac() {
        return navigator.platform.toUpperCase().indexOf("MAC") > -1;
    };

    /**
     * 获取用户自定义快捷键
     * @param command 命令名称
     * @returns 用户自定义快捷键
     */
    private getCustomCommand(command: string) {
        return window.siyuan.config.keymap.plugin[PLUGIN_NAME][command]?.custom || "";
    }

    /**
     * Mac，Windows 快捷键展示（原生代码 app/src/protyle/util/compatibility.ts ）
     * @param hotkey 快捷键
     * @returns 快捷键展示
     */
    private updateHotkeyTip(hotkey: string) {
        if (this.isMac()) {
            return hotkey;
        }

        const KEY_MAP = new Map(Object.entries({
            "⌘": "Ctrl",
            "⌃": "Ctrl",
            "⇧": "Shift",
            "⌥": "Alt",
            "⇥": "Tab",
            "⌫": "Backspace",
            "⌦": "Delete",
            "↩": "Enter",
        }));

        const keys = [];

        if ((hotkey.indexOf("⌘") > -1 || hotkey.indexOf("⌃") > -1)) keys.push(KEY_MAP.get("⌘"));
        if (hotkey.indexOf("⇧") > -1) keys.push(KEY_MAP.get("⇧"));
        if (hotkey.indexOf("⌥") > -1) keys.push(KEY_MAP.get("⌥"));

        // 不能去最后一个，需匹配 F2
        const lastKey = hotkey.replace(/⌘|⇧|⌥|⌃/g, "");
        if (lastKey) {
            keys.push(KEY_MAP.get(lastKey) || lastKey);
        }

        return keys.join("+");
    };

    /**
     * 隐藏 tooltip（原生代码 app/src/dialog/tooltip.ts ）
     */
    private hideTooltip() {
        document.getElementById("tooltip").classList.add("fn__none");
    };

    /**
     * 显示 tooltip
     * @param element 元素
     */
    private showElementTooltip(element: HTMLElement) {
        // 让元素触发 mouseover 事件，bubbles: true 启用冒泡，以激活原生的监听器，然后执行原生的 showTooltip()（原生代码 app/src/dialog/tooltip.ts ）
        element.dispatchEvent(new Event("mouseover", { bubbles: true }));
    }

    /**
     * 使对话框或菜单元素显示在最上层（设置 zIndex）
     * @param element 元素
     */
    private bringElementToFront(element: HTMLElement) {
        let maxZIndex = 0;
        // 查找所有 Dialog 和菜单，如果 zIndex 不是最大的才增加
        const allElements = document.querySelectorAll("div[data-key='jcsm-snippet-dialog'], #commonMenu[data-name='PluginSnippets']");
        allElements.forEach((element: HTMLElement) => {
            const zIndex = Number(element.style.zIndex);
            if (zIndex > maxZIndex) {
                maxZIndex = zIndex;
            }
        })
        const dialogZIndex = Number(element.style.zIndex);
        if (dialogZIndex < maxZIndex) {
            element.style.zIndex = (++window.siyuan.zIndex).toString();
        }
    }


    // ================================ 属性访问器 ================================

    /**
     * snippetType 属性的 getter
     */
    get snippetType() {
        return this._snippetType;
    }

    /**
     * snippetType 属性的 setter，改变时执行 onSnippetTypeChange
     * @param value 新的 snippetType
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
        if (!window.siyuan.jcsm) window.siyuan.jcsm = {};
        window.siyuan.jcsm.topBarMenuInputType = value;
    }


    // TODO: 桌面端修改代码片段之后同步到打开的新窗口（所有变更都是弹窗确认，避免以后原生改进了 https://github.com/siyuan-note/siyuan/issues/12303 造成冲突）
    // 问：桌面端使用新窗口的情况下插件能实现跨窗口通信吗？A 窗口的插件将状态同步到 B 窗口的插件，然后执行一些操作
    // 答：简单的用 localStorage、复杂的用 broadCast
    //  localStraoge.setItem 设置，window.addEventListener('storage' 监听
    //  我这边用的 broadCast 的ws方案，代码小多


    // 这里的代码可能用得上，先留着
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
