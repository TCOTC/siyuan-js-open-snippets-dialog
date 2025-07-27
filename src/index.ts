import * as acorn from "acorn";
import {
    Plugin,
    showMessage,
    Dialog,
    Menu,
    getFrontend,
    Setting,
    fetchPost,
    fetchSyncPost,
    Constants
} from "siyuan";

// 注释掉未使用的导入
// import {
//     Custom,
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
//     openAttributePanel,
//     saveLayout
// } from "siyuan";

import "./index.scss";
import { Snippet, ListenersArray } from "./types";

const PLUGIN_NAME = "snippets"; // 插件名
const STORAGE_NAME = "plugin-config.json"; // 配置文件名
const LOG_NAME = "plugin-snippets.log"; // 日志文件名
// const TAB_TYPE = "custom-tab"; // 自定义标签页

export default class PluginSnippets extends Plugin {
    // private custom: () => Custom; // 自定义标签页
    
    // ================================ 生命周期方法 ================================

    // 使用 window.siyuan.jcsm 存储变量
    // 这样重载插件（比如插件配置同步）之后，旧实例（包含未关闭的 Dialog）与新实例使用的变量始终是一致的

    /**
     * 是否为移动端
     */
    get isMobile() { return window.siyuan.jcsm?.isMobile; }
    set isMobile(value: boolean) { window.siyuan.jcsm.isMobile = value; }

    /**
     * 启用插件（进行各种初始化）
     */
    public async onload() {
        // 发布服务不启用插件
        if (window.siyuan.isPublish) {
            this.console.log(this.i18n.pluginDisplayName + this.i18n.pluginNotSupportedInPublish);
            return;
        }

        // 初始化 window.siyuan.jcsm
        if (!window.siyuan.jcsm) window.siyuan.jcsm = {};

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        // 初始化插件设置
        this.initSetting();

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
            if (this.getDialogByDataKey("jcsm-setting-dialog")) {
                // 如果设置对话框打开，则不打开菜单
                return;
            }

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

        // TODO自定义页签: 添加自定义标签页
        // this.custom = this.addTab({
        //     type: TAB_TYPE,
        //     init() {
        //         this.element.innerHTML = `<div class="jcsm__custom-tab">${this.data.text}</div>`;
        //     },
        //     beforeDestroy() {
        //         this.console.log("在销毁标签页之前:", TAB_TYPE);
        //         // TODO自定义页签: 销毁标签页时，需要获取当前页签的数据然后处理（比如保存）
        //     },
        //     destroy() {
        //         this.console.log("销毁标签页:", TAB_TYPE);
        //     }
        // });
        // 获取已打开的所有自定义页签
        // this.getOpenedTab();

        // 注册快捷键（都默认置空）
        this.addCommand({
            langKey: "openSnippetsManager", // 打开代码片段管理器
            hotkey: "",
            callback: () => {
                // 快捷键唤起菜单时，如果菜单已经打开，要先关闭再重新打开，所以这里直接执行就好，会自动关闭菜单再重开
                openSnippetsManager();
            },
        });
        this.addCommand({
            langKey: "reloadUI", // 重新加载界面
            hotkey: "",
            callback: () => {
                this.reloadUI();
            },
        });

        console.log(this.i18n.pluginDisplayName + this.i18n.pluginOnload);

        // 调试
        // await new Promise(resolve => setTimeout(resolve, 10000));
    }

    /**
     * 布局加载完成
     */
    public onLayoutReady() {
        // // 发布服务不启用插件
        // if (window.siyuan.isPublish) return;
    }

    /**
     * 禁用插件
     * 插件更新会先执行 onunload 再执行 onload，不会执行 uninstall
     */
    public onunload() {
        // 发布服务不启用插件
        if (window.siyuan.isPublish) return;

        // 移除菜单
        this.menu?.close();

        console.log(this.i18n.pluginDisplayName + this.i18n.pluginOnunload);
    }

    /**
     * 卸载插件
     */
    public uninstall() {
        // 发布服务不启用插件
        if (window.siyuan.isPublish) return;
        // 移除配置文件
        this.removeData(STORAGE_NAME);

        // 移除所有 Dialog
        document.querySelectorAll(".b3-dialog--open[data-key*='jcsm-']").forEach((dialogElement: HTMLElement) => {
            this.removeDialog(dialogElement);
        });

        // 移除菜单
        this.menu?.close();

        // TODO自定义页签: 移除所有自定义页签

        // 移除所有监听器
        for (const elementListeners of this.listeners) {
            const { element, listeners } = elementListeners;
            // 移除该元素上的所有监听器
            listeners.forEach(({ event, fn, options }) => {
                element.removeEventListener(event, fn, options);
            });
        }
        // 清空 listeners 数组
        this.listeners = null;
        // 重置检查标志
        this.isCheckingListeners = false;
        // 停止监听器检查定时器
        this.stopListenerCheckInterval();
        
        // 最后移除全局变量
        delete window.siyuan.jcsm;

        console.log(this.i18n.pluginDisplayName + this.i18n.pluginUninstall);
    }


    // ================================ 插件设置 ================================
    public setting: Setting;

    /**
     * 配置文件版本（配置结构有变化时升级）
     */
    private version: number = 1;
    
    /**
     * 实时应用 CSS 代码片段的更改
     */
    private realTimeApply: boolean;

    /**
     * 新建代码片段时默认启用
     */
    private newSnippetEnabled: boolean;

    /**
     * 在开发者工具中输出插件日志
     */
    private consoleDebug: boolean;

    // 配置项定义
    private readonly configItems: Array<{
        key?: string;
        description?: string;
        type?: 'boolean' | 'string' | 'number' | 'createActionElement';
        defaultValue?: any;
        direction?: 'row' | 'column';
        createActionElement?: () => HTMLElement;
    }> = [
        {
            key: 'realTimeApply',
            description: 'realTimeApplyDescription',
            type: 'boolean',
            defaultValue: true,
        },
        {
            key: 'newSnippetEnabled',
            type: 'boolean',
            defaultValue: true,
        },
        {
            key: 'consoleDebug',
            description: 'consoleDebugDescription',
            type: 'boolean',
            defaultValue: false,
        },
        {
            key: "feedbackIssue",
            description: "feedbackIssueDescription",
            type: "createActionElement",
            createActionElement: () => {
                const repoLink = "https://github.com/TCOTC/snippets";
                return this.htmlToElement(
                    `<a href="${repoLink}" target="_blank" rel="noopener noreferrer" class="b3-button b3-button--outline fn__flex-center fn__size200 ariaLabel" aria-label="${repoLink}" data-position="north"><svg><use xlink:href="#iconGithub"></use></svg>${this.i18n.feedbackIssueButton}</a>`
                );
            },
        },
        {
            key: "notificationSwitch",
            type: "boolean",
            defaultValue: true,
        },
        {
            key: "reloadUIAfterModifyJSNotice",
            description: "reloadUIAfterModifyJSNoticeDescription",
            type: "boolean",
            defaultValue: true,
        }
    ];

    // 通用配置 getter 创建方法
    private createConfigGetter(key: string) {
        const configItem = this.configItems.find(item => item.key === key);
        const defaultValue = configItem?.defaultValue;
        return () => (window.siyuan.jcsm as any)?.[key] ?? defaultValue;
    }

    // 通用配置 setter 创建方法
    private createConfigSetter(key: string) {
        return (value: any) => { (window.siyuan.jcsm as any)[key] = value; };
    }

    // 通用配置读取方法
    private loadConfig(config: any) {
        this.configItems.forEach(item => {
            const value = config[item.key] ?? item.defaultValue;
            // 使用全局变量存储配置
            (window.siyuan.jcsm as any)[item.key] = value;
        });
    }

    // 通用设置项创建方法
    private createSettingItem(item: typeof this.configItems[0]) {
        if (!item.direction) {
            // 根据类型设置默认方向
            // if (item.type === 'boolean') {
            //     item.direction = "column";
            // } else {
                item.direction = "column";
            // }
        }

        return {
            title: (this.i18n as any)[item.key],
            description: item.description ? (this.i18n as any)[item.description] : undefined,
            direction: item.direction,
            createActionElement: () => {
                if (item.type === 'boolean') {
                    return this.htmlToElement(
                        `<input class="b3-switch fn__flex-center" type="checkbox" data-type="${item.key}"${(window.siyuan.jcsm as any)[item.key] ? " checked" : ""}>`
                    );
                } else if (item.type === 'createActionElement') {
                    return item.createActionElement?.();
                }
                // 可以扩展其他类型的控件
            },
        };
    }

    /**
     * 初始化插件设置
     */
    private async initSetting() {

        // 为每个配置项动态生成 getter/setter
        this.configItems.forEach(item => {
            Object.defineProperty(this, item.key, {
                get: () => this.createConfigGetter(item.key)(),
                set: (value: any) => this.createConfigSetter(item.key)(value),
                enumerable: true,
                configurable: true
            });
        });

        // 加载配置文件数据
        // TODO测试: 需要测试会不会在同步完成之前加载数据，然后同步修改数据之后插件没有重载。如果有这种情况的话提 issue、试试把 loadData() 和 this.setting 相关的逻辑放在 onLayoutReady 中有没有问题
        await this.loadData(STORAGE_NAME);
        const config = this.data[STORAGE_NAME];
        // 配置不存在时 config === ""
        if (config !== "") {
            // 版本处理
            if (!config.version || typeof config.version !== "number" || isNaN(config.version)) {
                // 判断 config.version 是否不存在或不是数字
                // 配置文件异常，移除配置文件、弹出错误消息
                this.removeData(STORAGE_NAME);
                this.showErrorMessage(this.i18n.loadConfigError);
            } else if (config.version > this.version) {
                // 当前配置文件是更高版本的，与当前版本不兼容，弹出消息提示用户升级插件（可以不升级）
                // 如果用户不升级插件，还保存了设置，则直接覆盖掉高版本配置，这样也没有问题，因为高版本加载的时候又会自动调整配置结构
                this.showErrorMessage(this.i18n.loadConfigIncompatible, 15000);
                return
            }
            // else if (config.version < this.version) {
            //     // 预留逻辑
            //     // 当前配置文件是更低版本的，需要调整结构
            //     this.updateConfig(config);
            //     return
            // }
        }

        // 读取配置或者设置默认值
        this.loadConfig(config);

        this.setting = new Setting({});

        // 插件设置窗口中的各个配置项
        this.configItems.forEach(item => {
            this.setting.addItem(this.createSettingItem(item));
        });

        // 插件设置窗口中的非配置项
        // // 反馈问题
        // this.setting.addItem({
        //     title: this.i18n.feedbackIssue,
        //     description: this.i18n.feedbackIssueDescription,
        //     direction: "column",
        //     createActionElement: () => {
        //         const repoLink = "https://github.com/TCOTC/snippets";
        //         return this.htmlToElement(
        //             `<a href="${repoLink}" target="_blank" rel="noopener noreferrer" class="b3-button b3-button--outline fn__flex-center fn__size200 ariaLabel" aria-label="${repoLink}" data-position="north"><svg><use xlink:href="#iconGithub"></use></svg>${this.i18n.feedbackIssueButton}</a>`
        //         );
        //     },
        // });

        // // 注意事项
        // this.setting.addItem({
        //     description: this.i18n.reloadUIAfterModifyJSNotice,
        //     // TODO: attentionDescription 中的 [设置 - 快捷键] 支持点击，点击后跳转到 [设置 - 快捷键] 页面，并滚动到插件的快捷键设置、展开插件的快捷键设置
        // });
    }

    /**
     * 应用设置
     * @param dialogElement 对话框元素
     */
    private applySetting(dialogElement: HTMLElement) {
        // 应用设置
        this.configItems.forEach(item => {
            const element = dialogElement.querySelector(`input[data-type='${item.key}']`) as HTMLInputElement;
            if (element && item.type === 'boolean') {
                const newValue = element.checked;
                if ((window.siyuan.jcsm as any)[item.key] !== newValue) {
                    // TODO: 修改 realTimeApply 设置之后查询所有对话框按钮修改文案与 fn__none
                    (window.siyuan.jcsm as any)[item.key] = newValue;
                }
            }
        });

        // 保存设置
        const config: any = { version: this.version };
        this.configItems.forEach(item => {
            config[item.key] = (window.siyuan.jcsm as any)[item.key];
        });
        this.saveData(STORAGE_NAME, config);

        // 移除设置对话框
        this.removeDialog(dialogElement);
    }

    /**
     * 打开插件设置窗口（参考原生代码 app/src/plugin/Setting.ts Setting.open 方法）
     * 方法名固定为 openSetting，支持通过菜单按钮打开、被思源调用打开
     */
    public openSetting() {
        // 生成设置对话框元素
        const dialog = new Dialog({
            title: this.i18n.pluginDisplayName,
            content: `
                <div class="b3-dialog__content"></div>
                <div class="b3-dialog__action">
                    <button class="b3-button b3-button--cancel" data-type="cancel">${this.i18n.cancel}</button>
                    <div class="fn__space"></div>
                    <button class="b3-button b3-button--text" data-type="confirm">${this.i18n.save}</button>
                </div>
            `,
            width: this.isMobile ? "92vw" : "768px",
            height: "80vh",
        });
        dialog.element.setAttribute("data-key", "jcsm-setting-dialog");
        const contentElement = dialog.element.querySelector(".b3-dialog__content");
        this.setting.items.forEach((item) => {
            let html = "";
            let actionElement = item.actionElement ?? item.createActionElement?.();
            const tagName = actionElement?.classList.contains("b3-switch") ? "label" : "div";
            if (typeof item.direction === "undefined") {
                item.direction = (!actionElement || "TEXTAREA" === actionElement.tagName) ? "row" : "column";
            }
            if (item.direction === "row") {
                html = `
                    <${tagName} class="b3-label">
                        <div class="fn__block">
                            ${item.title ?? ""}
                            ${item.description ? `<div class="b3-label__text">${item.description}</div>` : ""}
                            <div class="fn__hr"></div>
                        </div>
                    </${tagName}>
                `;
            } else {
                html = `
                    <${tagName} class="fn__flex b3-label config__item">
                        <div class="fn__flex-1">
                            ${item.title ?? ""}
                            ${item.description ? `<div class="b3-label__text">${item.description}</div>` : ""}
                        </div>
                        ${actionElement ? "<span class='fn__space'></span>" : ""}
                    </${tagName}>
                `;
            }
            contentElement.insertAdjacentHTML("beforeend", html);
            if (actionElement) {
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

        // 设置对话框点击事件
        const dialogClickHandler = (event: MouseEvent) => {
            // TODO: 阻止冒泡，否则点击 Dialog 时会导致 menu 关闭？打开插件设置时无法按 Alt+P 打开思源设置菜单，需要看看是不是阻止冒泡影响的
            event.stopPropagation();

            const target = event.target as HTMLElement;
            const tagName = target.tagName.toLowerCase();
            const isScrim = target.classList.contains("b3-dialog__scrim");
            const isDispatch = typeof event.detail === "string";
            if (tagName === "button" || isScrim || isDispatch) {
                const type = target.dataset.type;
                if (type === "cancel" || isScrim || (isDispatch && event.detail=== "Escape")) {
                    this.console.log("dialogClickHandler: cancel");
                    event.stopPropagation();
                    this.removeDialog(dialog.element);
                } else if (type === "confirm" || (isDispatch && event.detail=== "Enter")) {
                    event.stopPropagation();
                    this.applySetting(dialog.element);
                }
            }
        }

        // 添加事件监听
        this.addListener(dialog.element, "click", dialogClickHandler, {capture: true});
        this.addListener(document.documentElement, "keydown", this.keyDownHandler);
        // TODO: 在菜单打开的情况下，桌面端无法滚轮滚动/移动端无法上下划动设置对话框的 .b3-dialog__content，看看能否通过阻止对应事件冒泡来解决
    }

    
    // ================================ 顶栏菜单 ================================

    /**
     * 顶栏菜单对象 this.menu.element === #commonMenu，菜单关闭时 === undefined
     */
    private menu: Menu;

    /**
     * 菜单列表容器 #commonMenu > .b3-menu__items
     */
    private menuItems: HTMLElement;

    /**
     * 添加顶栏菜单
     * @param topBarElement 顶栏按钮元素
     * @param rect 菜单位置
     */
    private async addMenu(topBarElement?: HTMLElement, rect?: DOMRect) {
        this.menu = new Menu("PluginSnippets", () => {
            // 此处会在菜单被关闭（this.menu.close();）时执行
            this.closeMenuCallback(topBarElement);
        });

        // 如果菜单已存在，再次点击按钮就会移除菜单，此时直接返回
        if (this.menu.isOpen) {
            this.menu = undefined;
            if (topBarElement && topBarElement.matches(':hover')) {
                // 只有当鼠标悬停在顶栏按钮上时才显示 tooltip
                this.showElementTooltip(topBarElement);
            }
            return;
        }

        // 顶栏按钮样式
        if (!this.isMobile && topBarElement) {
            topBarElement.classList.add("toolbar__item--active");
            // 移除 aria-label 属性，在菜单打开时不显示 tooltip
            topBarElement.removeAttribute("aria-label");
            this.hideTooltip();
        }

        // 获取代码片段列表
        const snippetsList = await this.getSnippetsList();
        if (!snippetsList) {
            // 获取代码片段列表失败时，关闭菜单
            this.menu.close();
            return;
        }
        this.snippetsList = snippetsList;
        this.console.log("getSnippet:", this.snippetsList);

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
        const radio = menuTop.querySelector(`[data-snippet-type="${this.snippetsType}"]`) as HTMLInputElement;
        radio.checked = true;
        const settingsButton = menuTop.querySelector("button[data-type='config']") as HTMLButtonElement;
        settingsButton.setAttribute("aria-label", this.i18n.pluginConfig);
        const newSnippetButton = menuTop.querySelector("button[data-type='new']") as HTMLButtonElement;
        newSnippetButton.setAttribute("aria-label", this.i18n.add + " " + this.snippetsType.toUpperCase());
        const reloadUIButton = menuTop.querySelector("button[data-type='reload']") as HTMLButtonElement;
        const reloadUICommand = this.getCustomCommand("reloadUI");
        reloadUIButton.setAttribute("aria-label", (!this.isMobile && reloadUICommand) ? this.i18n.reloadUI + " " + this.updateHotkeyTip(reloadUICommand) : this.i18n.reloadUI);
        
        this.menuItems.append(menuTop);


        // TODO: this.snippetsList 没有代码片段的情况需要测试一下看看
        const snippetsHtml = this.genSnippetsHtml(this.snippetsList);
        this.menuItems.insertAdjacentHTML("beforeend", snippetsHtml);

        this.updateSnippetCount();
        this.switchMenuSnippetsType(this.snippetsType);

        // 事件监听
        this.addListener(this.menu.element, "click", this.menuClickHandler);
        this.addListener(this.menu.element, "mousedown", this.menuMousedownHandler);
        
        //  因为是在 document 上监听，所以只要其他地方阻止按键冒泡就行了
        this.addListener(document.documentElement, "keydown", this.keyDownHandler);

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
     * 销毁顶栏菜单
     * @param topBarElement 顶栏按钮元素
     */
    private closeMenuCallback(topBarElement?: HTMLElement) {
        if (topBarElement) {
            // topBarElement 不存在时说明 this.isMobile 为 true，此时不需要修改顶栏按钮样式
            topBarElement.classList.remove("toolbar__item--active");
            // topBarCommand 有可能变，所以每次都重新获取
            const topBarCommand = this.getCustomCommand("openSnippetsManager");
            const title = topBarCommand ? this.i18n.pluginDisplayName + " " + this.updateHotkeyTip(topBarCommand) : this.i18n.pluginDisplayName;
            topBarElement.setAttribute("aria-label", title);
        }

        // 移除事件监听
        this.removeListener(this.menu.element);
        this.menu = undefined;
        this.destroyKeyDownHandler();
    }

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
    private menuClickHandler = async (event: MouseEvent) => {
        // 点击按钮之后默认会关闭整个菜单，这里需要阻止事件冒泡
        event.stopPropagation();
        // 不能阻止事件默认行为，否则点击 label 时无法切换 input 的选中状态
        // event.preventDefault();
        const target = event.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();

        // if ((tagName === "button" || tagName === "input") && document.activeElement === target) {
        //     (document.activeElement as HTMLElement).blur();
        // }
        // 移除按钮上的焦点，避免后续回车还会触发按钮（不知道开关会不会有影响，顺便加上了）
        target.blur();

        // 键盘操作
        if (typeof event.detail === "string") {
            this.console.log("menuClickHandler event:", event);
            if (event.detail=== "Escape") {
                // 按 Esc 关闭菜单
                this.menu.close();
            } else if (event.detail === "Enter") {
                // 按回车切换代码片段的开关状态
                const snippetElement = this.menuItems.querySelector(".b3-menu__item--current") as HTMLElement;
                if (snippetElement) {
                    const input = snippetElement.querySelector("input[type='checkbox']") as HTMLInputElement;
                    input.checked = !input.checked;
                    this.toggleSnippetEnabled(snippetElement.dataset.id, input.checked, "menu");
                }
            } else if (event.detail === "ArrowUp" || event.detail === "ArrowDown") {
                // 按上下方向键切换代码片段选项
                const menuItems = Array.from(this.menuItems.querySelectorAll(`.b3-menu__item[data-type="${this.snippetsType}"]`)) as HTMLElement[];
                const currentMenuItem = this.menuItems.querySelector(".b3-menu__item--current") as HTMLElement;
                
                if (menuItems.length === 1) {
                    // 只有一个代码片段时，切换到该代码片段
                    menuItems[0].classList.add("b3-menu__item--current");
                } else if (menuItems.length > 1) {
                    // 获取当前选中项的索引，如果没有选中项则设为 -1
                    const currentIndex = currentMenuItem ? menuItems.indexOf(currentMenuItem) : -1;
                    
                    // 根据按键方向计算新的索引
                    let newIndex: number;
                    if (event.detail === "ArrowUp") {
                        // 向上键：切换到前一个元素，如果是第一个则切换到最后一个
                        newIndex = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
                    } else {
                        // 向下键：切换到后一个元素，如果是最后一个则切换到第一个
                        newIndex = currentIndex >= menuItems.length - 1 ? 0 : currentIndex + 1;
                    }
                    
                    // 移除当前选中状态
                    currentMenuItem?.classList.remove("b3-menu__item--current");
                    // 添加新的选中状态
                    menuItems[newIndex].classList.add("b3-menu__item--current");
                }
            } else if (event.detail === "ArrowLeft" || event.detail === "ArrowRight") {
                // 按左右方向键切换代码片段类型
                const newType = this.snippetsType === "css" ? "js" : "css";

                // 切换选项卡元素
                const newTypeRadio = this.menuItems.querySelector(`[data-snippet-type="${newType}"]`) as HTMLInputElement;
                if (newTypeRadio) {
                    newTypeRadio.checked = true;
                }

                // 切换代码片段类型
                this.snippetsType = newType;
                this.switchMenuSnippetsType(newType);
            }
        }

        // 点击顶部
        if (target.closest(".jcsm-top-container")) {
            this.unselectSnippet();
            
            // 切换代码片段类型
            if (tagName === "input" && target.getAttribute("name") === "jcsm-tabs") {
                const type = target.dataset.snippetType;
                this.snippetsType = type;
                this.switchMenuSnippetsType(type);
            }

            // 切换全局开关
            if (target.classList.contains("jcsm-all-snippets-switch")) {
                // 更新全局变量和配置
                const enabled = (target as HTMLInputElement).checked;
                if (this.snippetsType === "css") {
                    window.siyuan.config.snippet.enabledCSS = enabled;
                } else if (this.snippetsType === "js") {
                    window.siyuan.config.snippet.enabledJS = enabled;
                }
                fetchPost("/api/setting/setSnippet", window.siyuan.config.snippet);
        
                // 更新代码片段元素
                // 切换全局开关只会影响已启用的代码片段，所以过滤出来
                const filteredSnippets = this.snippetsList.filter((snippet: Snippet) => snippet.type === this.snippetsType && snippet.enabled === true);
                this.console.log("filteredSnippets", filteredSnippets);
                // TODO: 如果切换的包含内容不为空且不为空字符的 JS 片段，需要弹出消息提示
                filteredSnippets.forEach((snippet: Snippet) => {
                    // enabled 为 true 时，snippet.enabled 也一定为 true
                    this.updateSnippetElement(snippet, enabled);
                });
            }

            // 点击顶部的按钮
            if (tagName === "button") {
                const button = target as HTMLButtonElement;
                const type = button.dataset.type;
    
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
                        type: this.snippetsType as "css" | "js",
                        enabled: this.newSnippetEnabled,
                    };
                    if (snippet.type === "css" && this.realTimeApply) {
                        // 如果开启了 CSS 实时应用，则这个时候就添加代码片段
                        this.addOrUpdateSnippet(snippet);
                        this.snippetDialog(snippet, this.i18n.save);
                    } else {
                        this.snippetDialog(snippet, this.i18n.new);
                    }
                }
            }
        }

        // 点击代码片段
        const snippetMenuItem = target.closest(".b3-menu__item") as HTMLElement;
        if (snippetMenuItem) {
            if (tagName === "button") {
                // 点击按钮
                
                const buttonType = target.dataset.type;
                // 点击按钮不会改变代码片段的开关状态，所以直接从 this.snippetsList 中获取当前代码片段
                const snippet = await this.getSnippetById(snippetMenuItem.dataset.id);
                if (!snippet) {
                    this.showErrorMessage(this.i18n.getSnippetFailed);
                    return;
                }
                if (buttonType === "edit") {
                    // 编辑代码片段，打开编辑对话框
                    this.snippetDialog(snippet);
                    // TODO自定义页签: 编辑页签，等其他功能稳定之后再做
                } else if (buttonType === "delete") {
                    // 删除代码片段
                    // // TODO: 取消选中代码片段选项，否则打开 Dialog 之后按回车会触发 menuItem 导致 menu 被移除。这个方法好像还是有问题？需要单独用一个方法来监听按键操作，统一处理
                    // this.unselectSnippet();
                    this.snippetDeleteDialog(snippet.name, () => {
                        // 弹窗确定后删除代码片段
                        this.deleteSnippet(snippet.id, snippet.type);
                    }); // 取消后无操作
                } else {
                    // 点击到不知道哪里的按钮，显示错误信息
                    this.showErrorMessage(this.i18n.unknownButtonType);
                }
            } else {
                // 点击非按钮的部分
                const checkBox = snippetMenuItem.querySelector("input") as HTMLInputElement;
                if (target !== checkBox) {
                    // 如果点击的不是 checkBox 就手工切换开关状态
                    checkBox.checked = !checkBox.checked;
                }
                const enabled = checkBox.checked;
                this.toggleSnippetEnabled(snippetMenuItem.dataset.id, enabled, "menu");
                if (this.isMobile) {
                    // 移动端点击之后一直高亮不好看
                    this.unselectSnippet()
                }
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
    private switchMenuSnippetsType(snippetType: string) {
        if (!this.isMobile) {
            // 移除其他选项上的 .b3-menu__item--current 类名
            const currentMenuItem = this.menuItems.querySelector(".b3-menu__item--current") as HTMLElement;
            currentMenuItem?.classList.remove("b3-menu__item--current");
            // 给首个该类型的选项添加 .b3-menu__item--current 类名
            const firstMenuItem = this.menuItems.querySelector(`.b3-menu__item[data-type="${snippetType}"]`) as HTMLElement;
            firstMenuItem?.classList.add("b3-menu__item--current");
        }

        // 切换全局开关状态为 snippetType 类型的代码片段对应的开关状态
        const enabled = this.isSnippetsTypeEnabled(snippetType);
        const snippetsTypeSwitch = this.menuItems.querySelector(".jcsm-all-snippets-switch") as HTMLInputElement;
        snippetsTypeSwitch.checked = enabled;

        // 更新按钮提示
        this.menuItems.querySelector("button[data-type='new']").setAttribute("aria-label", this.i18n.add + " " + snippetType.toUpperCase());

        // 设置元素属性，通过 CSS 过滤列表
        const topContainer = this.menuItems.querySelector(".jcsm-top-container") as HTMLElement;
        topContainer?.setAttribute("data-type", snippetType);
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
     * 代码片段列表
     */
    get snippetsList() { return window.siyuan.jcsm?.snippetsList ?? []; }
    set snippetsList(value: Snippet[]) { window.siyuan.jcsm.snippetsList = value; }

    /**
     * 代码片段类型
     */
    get snippetsType() { return window.siyuan.jcsm?.snippetsType ?? "css"; } // 顶栏菜单默认显示 CSS 代码片段
    set snippetsType(value: string) { window.siyuan.jcsm.snippetsType = value; }

    /**
     * 添加或更新代码片段
     * @param snippet 代码片段
     */
    private async addOrUpdateSnippet(snippet: Snippet) {
        // 添加的代码片段有可能未启用，所以 updateSnippetElement() 不传入 enabled === true 的参数
        // TODO: 如果更新的是内容不为空且不为空字符的 JS 片段，需要弹出消息提示
        this.updateSnippetElement(snippet);
        await this.updateSnippetsList();
        // 在 snippetsList 中查找是否存在该代码片段
        const existedSnippet = this.snippetsList.find((s: Snippet) => s.id === snippet.id);
        if (existedSnippet) {
            // 如果存在，则更新该代码片段
            this.snippetsList = this.snippetsList.map((s: Snippet) => s.id === snippet.id ? snippet : s);
            this.putSnippetsList(this.snippetsList);
        } else {
            // 如果不存在，则将 snippet 添加到 snippetsList 开头
            this.snippetsList.unshift(snippet);
            this.putSnippetsList(this.snippetsList);
        }
        this.updateSnippetCount();

        // 修改相关的元素
        // TODO: 重复的代码比较多，单独提取为一个方法，然后 addOrUpdateSnippet 和 deleteSnippet 调用时传递一个参数
        // 更新菜单
        const snippetMenuItem = this.menuItems.querySelector(`.jcsm-snippet-item[data-id="${snippet.id}"]`) as HTMLElement;
        if (snippetMenuItem) {
            // 如果菜单中存在该代码片段，则更新该代码片段
            const nameElement = snippetMenuItem.querySelector(".jcsm-snippet-name") as HTMLElement;
            if (nameElement) {
                nameElement.textContent = snippet.name;
            }
            const switchElement = snippetMenuItem.querySelector("input") as HTMLInputElement;
            if (switchElement) {
                switchElement.checked = snippet.enabled;
            }
        } else {
            // 如果菜单中没有该代码片段，则将代码片段添加到菜单顶部
            const snippetsHtml = this.genSnippetsHtml([snippet]);
            this.menuItems.querySelector(".jcsm-top-container")?.insertAdjacentHTML("afterend", snippetsHtml);
        }
        // 修改对应的 Dialog
        // TODO: getDialogByDataId 方法
        const dialog = document.querySelector(`.b3-dialog--open[data-key="jcsm-snippet-dialog"][data-snippet-id="${snippet.id}"]`) as HTMLDivElement;
        if (dialog) {
            // 显示删除按钮
            const deleteButton = dialog.querySelector(`.jcsm-dialog .jcsm-dialog-container button[data-action="delete"]`) as HTMLButtonElement;
            if (deleteButton) {
                deleteButton.classList.remove("fn__none");
            }
            // 显示“应用”按钮
            const applyButton = dialog.querySelector(`.jcsm-dialog .b3-dialog__action button[data-action="apply"]`) as HTMLButtonElement;
            if (applyButton) {
                applyButton.classList.remove("fn__none");
            }
            // 将“新建”按钮的文案改为“保存”
            const confirmButton = dialog.querySelector(`.jcsm-dialog .b3-dialog__action button[data-action="confirm"]`) as HTMLButtonElement;
            if (confirmButton) {
                confirmButton.textContent = this.i18n.save;
            }
        }
    };

    /**
     * 删除代码片段
     * @param id 代码片段 ID
     * @param snippetType 代码片段类型
     */
    private async deleteSnippet(id: string, snippetType: string) {
        this.console.log("deleteSnippet", id, snippetType);
        if (!id || !snippetType) {
            this.showErrorMessage(this.i18n.deleteSnippetFailed);
            return;
        }
        const snippet = await this.getSnippetById(id);
        if (!snippet) {
            this.showErrorMessage(this.i18n.getSnippetFailed);
            return;
        }
        // 删除的代码片段一定需要移除元素，所以 updateSnippetElement() 传入 enabled === false 的参数
        // TODO: 如果切换的是内容不为空且不为空字符的 JS 片段，需要弹出消息提示
        this.updateSnippetElement(snippet, false);
        // getSnippetById() 方法刚刚执行过了，所以这里不需要再执行 updateSnippetsList()
        // await this.updateSnippetsList();
        // TODO: getSnippetById 需要使用旧的 this.snippetsList，所以下面才修改 this.snippetsList ？
        this.snippetsList = this.snippetsList.filter((snippet: Snippet) => snippet.id !== id);
        this.putSnippetsList(this.snippetsList);
        this.updateSnippetCount();

        // 修改相关的元素
        // 移除菜单项
        const snippetMenuItem = this.menuItems.querySelector(`.jcsm-snippet-item[data-id="${id}"]`) as HTMLElement;
        snippetMenuItem?.remove();
        // 修改对应的 Dialog
        const dialog = document.querySelector(`.b3-dialog--open[data-key="jcsm-snippet-dialog"][data-snippet-id="${snippet.id}"]`) as HTMLDivElement;
        if (dialog) {
            // 隐藏删除按钮
            const deleteButton = dialog.querySelector(`.jcsm-dialog .jcsm-dialog-container button[data-action="delete"]`) as HTMLButtonElement;
            if (deleteButton) {
                deleteButton.classList.add("fn__none");
            }
            // 隐藏“应用”按钮
            const applyButton = dialog.querySelector(`.jcsm-dialog .b3-dialog__action button[data-action="apply"]`) as HTMLButtonElement;
            if (applyButton) {
                applyButton.classList.add("fn__none");
            }
            // 将“保存”按钮的文案改为“新建”
            const confirmButton = dialog.querySelector(`.jcsm-dialog .b3-dialog__action button[data-action="confirm"]`) as HTMLButtonElement;
            if (confirmButton) {
                confirmButton.textContent = this.i18n.new;
            }
        }
    };

    /**
     * 根据 ID 获取代码片段
     * @param id 代码片段 ID
     * @returns 代码片段
     */
    private async getSnippetById(id: string) {
        await this.updateSnippetsList();
        return this.snippetsList.find((snippet: Snippet) => snippet.id === id);
    }

    /**
     * 切换代码片段启用状态
     * @param snippetId 代码片段 ID
     * @param enabled 是否启用
     * @param type 不需要同步开关状态的类型
     */
    private async toggleSnippetEnabled(snippetId: string, enabled: boolean, type: string) {
        if (!snippetId) {
            this.showErrorMessage(this.i18n.toggleSnippetFailed);
            return;
        }
        const snippet: Snippet | undefined = await this.getSnippetById(snippetId);
        if (snippet) {
            // 更新代码片段列表
            snippet.enabled = enabled;
            this.putSnippetsList(this.snippetsList);
            // 更新代码片段元素
            // TODO: 任何代码片段都切换，但如果切换的是内容不为空且不为空字符的 JS 片段，需要弹出消息提示。
            // 直接在 updateSnippetElement() 中处理提示
            this.updateSnippetElement(snippet);
        }

        // 同步开关状态到其他地方（目前只有 menu 和 dialog，未来可能增加自定义页签）
        // TODO: 真的需要在这里处理吗？感觉应该只有符合这个条件的才能调用 toggleSnippetEnabled 函数
        if (type !== "menu" && !this.realTimeApply && snippet.type === "js") {
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
     * 更新代码片段列表
     */
    private async updateSnippetsList() {
        const snippetsList = await this.getSnippetsList();
        if (snippetsList && this.snippetsList !== snippetsList) {
            // 有可能会不同，比如其他插件修改了代码片段，所以需要处理更新
            // TODO: 通过对比相同 ID 的代码片段，查询出现差异的代码片段，然后处理对应的差异
            // 1. 类型：不应该出现的变更，是异常情况，需要处理错误
            // 2. 内容：如果 CSS 实时应用，则需要查找对应的代码片段编辑对话框更新内容；其他情况下无操作
            // 3. 开关状态：切换代码片段的开关状态，如果是关闭的 JS 片段但是在 DOM 中找到了对应的元素，要移除元素然后弹出消息提示用户重载界面（如果这个消息的开关打开的话）
            // 4. 标题：查找对应的代码片段编辑对话框更新标题
            this.snippetsList = snippetsList;
        }
    }

    /**
     * 获取代码片段列表
     */
    private async getSnippetsList(): Promise<Snippet[] | false> {
        const response = await fetchSyncPost("/api/snippet/getSnippet", { type: "all", enabled: 2 });
        if (response.code !== 0) {
            this.showErrorMessage(this.i18n.getSnippetsListFailed + " [" + response.msg + "]");
            return false;
        }
        this.console.log("getSnippetsList", response.data.snippets);
        return response.data.snippets as Snippet[];
    };

    /**
     * 设置代码片段列表（参考思源本体 app/src/config/util/snippets.ts ）
     * @param snippets 所有代码片段列表
     */
    private putSnippetsList(snippetsList: Snippet[]) {
        this.console.log("putSnippetsList", snippetsList);
        fetchPost("/api/snippet/setSnippet", {snippets: snippetsList}, (response) => {
            // 增加错误处理
            if (response.code !== 0) {
                this.showErrorMessage(this.i18n.setSnippetFailed + " [" + response.msg + "]");
                return;
            }
        });
    };

    /**
     * 更新代码片段元素（添加、更新、删除、启用、禁用、全局启用、全局禁用）
     * @param snippet 代码片段
     * @param enabled 是否启用
     */
    private updateSnippetElement(snippet: Snippet, enabled?: boolean) {
        if (!snippet) {
            this.showErrorMessage(this.i18n.updateSnippetElementParamError);
            return;
        }
        if (enabled === undefined) {
            enabled = snippet.enabled;
        }

        const elementId = `snippet${snippet.type === "css" ? "CSS" : "JS"}${snippet.id}`;
        const element = document.getElementById(elementId);

        if (snippet.type === "js" && this.isValidJavaScript(snippet.content)) {
            // TODO: 如果切换的是内容是有效的 JavaScript 代码片段，需要弹出消息提示
            showMessage(this.i18n.reloadUIAfterModifyJS, undefined, "info");
            // TODO: 高亮重新加载界面按钮
        }

        if (!enabled) {
            // 禁用
            element?.remove();
        } else {
            // 启用
            // 移除旧元素
            if (element && element.innerHTML !== snippet.content) {
                element.remove();
            }
            // 添加新元素
            if (!this.isSnippetsTypeEnabled(snippet.type)) {
                // 如果对应类型的代码片段未启用，则不添加元素
                return;
            }
            // 插入代码片段元素的方式与原生保持一致
            if (snippet.type === "css") {
                document.head.insertAdjacentHTML("beforeend", `<style id="${elementId}">${snippet.content}</style>`);
            } else if (snippet.type === "js") {
                const jsElement = document.createElement("script");
                jsElement.type = "text/javascript";
                jsElement.text = snippet.content;
                jsElement.id = elementId;
                document.head.appendChild(jsElement);
            }
        }
    };

    /**
     * 检查内容是否为有效的 JavaScript 代码
     * @param content 内容
     * @returns 是否为有效的 JavaScript 代码
     */
    private isValidJavaScript(content: string) {
        try {
            // 检查是否全是空白字符
            if (/^\s*$/.test(content)) {
                return false;
            }
            // 使用 acorn 解析代码
            acorn.parse(content, { ecmaVersion: "latest" });
            return true;
        } catch (e) {
            return false;
        }
    }


    // ================================ 对话框相关 ================================

    // dialog.destroy 还能传递参数，看看这个写法能不能用上
    // dialog.destroy({cancel: "true"});

    /**
     * 生成代码片段对话框
     * @param snippet 代码片段
     * @param confirmText 确认按钮的文案
     */
    private genSnippetDialog(snippet: Snippet, confirmText: string = this.i18n.save) {
        return `
            <div class="jcsm-dialog">
                <div class="jcsm-dialog-header resize__move"></div>
                <div class="jcsm-dialog-container fn__flex-1" data-id="${snippet.id || ""}" data-type="${snippet.type}">
                    <div class="fn__flex">
                        <input class="jcsm-dialog-name fn__flex-1 b3-text-field" spellcheck="false" placeholder="${this.i18n.title}"}">
                        <div class="fn__space"></div>
                        <button data-action="delete" class="block__icon block__icon--show ariaLabel" aria-label="${this.i18n.deleteSnippet}" data-position="north">
                            <svg><use xlink:href="#iconTrashcan"></use></svg>
                        </button>
                        <div class="fn__space"></div>
                        <input data-type="snippetSwitch" class="b3-switch fn__flex-center" type="checkbox"${snippet.enabled ? " checked" : ""}>
                    </div>
                    <div class="fn__hr"></div>
                    <textarea class="jcsm-dialog-content fn__flex-1 b3-text-field" spellcheck="false" placeholder="${this.i18n.codeSnippet}" style="resize:none; font-family:var(--b3-font-family-code)"></textarea>
                    <div class="fn__hr--b"></div>
                </div>
                <div class="b3-dialog__action">
                    <button data-action="cancel" class="b3-button b3-button--cancel">${this.i18n.cancel}</button>
                    <div class="fn__space"></div>
                    <button data-action="apply" class="b3-button b3-button--text">${this.i18n.apply}</button>
                    <div class="fn__space"></div>
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
        if (this.getDialogByDataKey("jcsm-setting-dialog")) {
            // 如果设置对话框打开，则不打开代码片段编辑对话框
            return;
        }

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
            // 桌面端支持同时打开多个 Dialog，需要修改样式
            resetDialogRootStyle(dialog.element);
        }

        // 设置 Dialog 属性
        dialog.element.setAttribute("data-key", "jcsm-snippet-dialog");
        dialog.element.setAttribute("data-snippet-id", snippet.id);
        // dialog.element.setAttribute("data-snippet-new", isNew ? "true" : "false");

        // 设置代码片段标题和内容
        const nameElement = dialog.element.querySelector(".jcsm-dialog-name") as HTMLInputElement; // 标题不允许输入换行，所以得用 input 元素，textarea 元素没法在操作能 Ctrl+Z 撤回的前提下阻止用户换行
        nameElement.value = snippet.name;
        nameElement.focus();
        const contentElement = dialog.element.querySelector(".jcsm-dialog-content") as HTMLTextAreaElement;
        contentElement.value = snippet.content;
        const switchInput = dialog.element.querySelector("input[data-type='snippetSwitch']") as HTMLInputElement;
        // switchInput.checked = snippet.enabled; // genSnippetDialog 的时候已经添加了 enabled 属性，这里不需要重复设置

        this.addListener(dialog.element, "keydown", (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (target === nameElement) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    contentElement.focus();
                }
                // TODO: 按 Tab 键输入制表符或空格（根据思源的设置 window.siyuan.config.editor.codeTabSpaces ，也可以在插件设置中设置）
            } else if (target === contentElement) {
                // TODO: 按 Tab 键输入制表符或空格（根据思源的设置 window.siyuan.config.editor.codeTabSpaces ，也可以在插件设置中设置）
                // TODO: 选中代码按 (Shift +) Tab 键，对选中的代码行，执行（反）缩进
                // TODO: 按 Ctrl + Enter 键执行 “保存” 操作
            }
        }, {capture: true});

        this.addListener(dialog.element, "wheel", (event) => {
            // 阻止冒泡，否则当菜单打开时，输入框无法使用鼠标滚轮滚动
            event.stopPropagation();
        }, {passive: true});

        this.addListener(dialog.element, "mousedown", () => {
            // 点击 Dialog 时要显示在最上层
            this.bringElementToFront(dialog.element);
            // 移除菜单上的 b3-menu__item--current，否则 this.keyDownHandler() 会操作菜单
            this.unselectSnippet();
        });

        let oldSnippetValues = {
            name: snippet.name,
            content: snippet.content,
            enabled: snippet.enabled,
        };
        const closeElement = dialog.element.querySelector(".b3-dialog__close") as HTMLElement;
        const scrimElement = dialog.element.querySelector(".b3-dialog__scrim") as HTMLElement;
        // 代码片段编辑对话框的 .b3-dialog__scrim 元素只在桌面端被移除，移动端还是有的，所以要处理点击

        this.addListener(dialog.element, "click", async (event: Event) => {
            this.console.log("dialogClickHandler: event", event);
            // 阻止冒泡，否则点击 Dialog 时会导致 menu 关闭
            event.stopPropagation();

            const target = event.target as HTMLElement;
            const tagName = target.tagName.toLowerCase();
            if (tagName === "input" && target.getAttribute("data-type") === "snippetSwitch") {
                // TODO: 切换代码片段的开关状态
                if (target === switchInput) {
                    if (this.realTimeApply && snippet.type === "css") {
                        const enabled = switchInput.checked;
                        this.toggleSnippetEnabled(dialog.element.dataset.snippetId, enabled, "dialog");
                    }
                }

                // TODO: 分别处理 实时应用开关状态 和 点击保存后更新代码片段的开关状态 两种情况


            } else if (tagName === "button") {
                // 移除焦点，否则点击按钮后如果不关闭 Dialog 的话会一直显示 :focus 样式
                target.blur();
                switch (target.dataset.action) {
                    case "delete":
                        // TODO: 新建的代码片段直接不显示删除按钮，addSinppet() 之后再显示
                        // 弹窗确定后删除代码片段/不新建代码片段、关闭 Dialog
                        this.snippetDeleteDialog(snippet.name, () => {
                            this.deleteSnippet(snippet.id, snippet.type);
                            this.removeDialog(dialog.element);
                        }); // 取消后无操作
                        break;
                    case "cancel":
                        // TODO: 如果有变更没保存（inNew || ((没有开启 CSS 实时应用 || 或者编辑的是 JS) && 存在变更)），需要弹窗提示确认
                        //  确认回调 → 不保存，直接 removeDialog()
                        //  取消回调 → 无操作

                        // 如果不存在变更，直接移除 Dialog
                        this.removeDialog(dialog.element);
                        break;
                    case "apply":
                        // 应用代码片段
                        const newSnippetValues = {
                            name: nameElement.value,
                            content: contentElement.value,
                            enabled: switchInput.checked,
                        };
                        // 比较对象属性值而不是对象引用
                        const hasChanges = oldSnippetValues.name    !== newSnippetValues.name    ||
                                           oldSnippetValues.content !== newSnippetValues.content ||
                                           oldSnippetValues.enabled !== newSnippetValues.enabled;
                        if (hasChanges) {
                            // 代码片段发生变更才推送更新，否则无操作
                            oldSnippetValues = newSnippetValues;
                            snippet.name = newSnippetValues.name;
                            snippet.content = newSnippetValues.content;
                            snippet.enabled = newSnippetValues.enabled;
                            this.addOrUpdateSnippet(snippet);
                        }
                        break;
                    case "confirm":
                        // 新建/更新代码片段
                        snippet.name = nameElement.value;
                        snippet.content = contentElement.value;
                        snippet.enabled = switchInput.checked;
                        // 如果已经删除了对应 ID 的代码片段而 Dialog 还在，此时点击“新建”按钮会自动新建代码片段
                        this.addOrUpdateSnippet(snippet);
                        this.removeDialog(dialog.element);
                        break;
                }
            } else if (target === closeElement || target === scrimElement) {
                this.removeDialog(dialog.element);
            }
            return;
        }, {capture: true}); // 点击 .b3-dialog__close 和 .b3-dialog__scrim 时需要在捕获阶段阻止冒泡才行，因为原生在这两个元素上有监听器
        
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
            "jcsm-snippet-delete",
            () => {
                // 删除代码片段
                confirm?.();
            },
            () => {
                // 不删除代码片段
                cancel?.();
            }
        );

        // 不需要移除菜单上的 b3-menu__item--current，方便判断点击的是哪个代码片段
        // this.unselectSnippet();
    };

    /**
     * 确认对话框（参考原生代码 app/src/dialog/confirmDialog.ts ）
     * @param title 对话框标题
     * @param text 对话框内容
     * @param isDelete 是否是删除对话框
     * @param confirm 确认回调
     * @param cancel 取消回调
     */
    private confirmDialog(title: string, text: string, dataKey?: string, confirm?: () => void, cancel?: () => void) {
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
                    <button class="b3-button b3-button--cancel" data-type="cancel">${this.i18n.cancel}</button>
                    <div class="fn__space"></div>
                    ${(() => {
                        if (dataKey === "jcsm-snippet-delete") {
                            return `<button class="b3-button b3-button--remove" data-type="confirm">${this.i18n.delete}</button>`;
                        } else {
                            return `<button class="b3-button b3-button--text" data-type="confirm">${this.i18n.confirm}</button>`;
                        }
                    })()}
                </div>
            `,
            width: this.isMobile ? "92vw" : "520px",
        });
        dialog.element.setAttribute("data-key", dataKey ?? "dialog-confirm"); // Constants.DIALOG_CONFIRM

        const closeElement = dialog.element.querySelector(".b3-dialog__close") as HTMLElement;
        const scrimElement = dialog.element.querySelector(".b3-dialog__scrim") as HTMLElement;

        this.addListener(dialog.element, "click", (event: KeyboardEvent) => {
            this.console.log("confirmDialog click", event);
            // 阻止冒泡，否则点击 Dialog 时会导致 menu 关闭
            event.stopPropagation();
            let target = event.target as HTMLElement;
            const isDispatch = typeof event.detail === "string";
            while (target && target !== dialog.element || isDispatch) {
                this.console.log("target", target);
                this.console.log("target.dataset.type", target.dataset.type);
                this.console.log("isDispatch", isDispatch);
                this.console.log("event.detail", event.detail);
                if (target.dataset.type === "cancel" || (isDispatch && event.detail=== "Escape")) {
                        cancel?.();
                        this.removeDialog(dialog.element);
                    break;
                } else if (target.dataset.type === "confirm" || (isDispatch && event.detail=== "Enter")) {
                        confirm?.();
                        this.removeDialog(dialog.element);
                    break;
                } else if (target === closeElement || target === scrimElement) {
                    cancel?.();
                    this.removeDialog(dialog.element);
                    break;
                }
                target = target.parentElement;
            }
        }, {capture: true});
    };

    /**
     * 移除 Dialog
     * @param dialog 对话框
     */
    private removeDialog(dialogElement: HTMLElement) {
        this.console.log("removeDialog: dialogElement", dialogElement);
        if (dialogElement) {
            // 移除事件监听器
            this.removeListener(dialogElement);
            // 关闭动画
            dialogElement.classList.remove("b3-dialog--open");
            setTimeout(() => {
                dialogElement?.remove();
                // Dialog 移除之后再移除全局键盘事件监听，因为需要判断窗口中是否还存在菜单和 Dialog
                this.destroyKeyDownHandler();
            }, Constants.TIMEOUT_DBLCLICK ?? 190);
        }
    }


    // ================================ 错误消息处理 ================================

    /**
     * 弹出错误消息
     * @param message 错误消息
     * @param timeout 消息显示时间（毫秒）；-1 永不关闭；0 永不关闭，添加一个关闭按钮；undefined 默认 6000 毫秒
     */
    private showErrorMessage(message: string, timeout: number | undefined = undefined) {
        showMessage(this.i18n.pluginDisplayName + ": " + message, timeout, "error");

        // 将日志写入任务添加到队列
        this.addLogWriteTask(message);
    };

    /**
     * 日志写入队列
     */
    private logWriteQueue: Array<() => Promise<void>> = [];

    /**
     * 是否正在写入日志
     */
    private isLogWriting: boolean = false;

    /**
     * 添加日志写入任务到队列
     * @param message 错误消息
     */
    private addLogWriteTask(message: string) {
        const writeTask = async () => {
            try {
                // 在 temp 目录记录错误日志（格式参考 siyuan.log）
                const writeLog = async (oldLog: string = "") => {
                    // 如果 oldLog 的行数超过 200 行，则删除开头 1 行
                    const lines = oldLog.split("\n");
                    if (lines.length > 200) {
                        oldLog = lines.slice(1).join("\n");
                    }
                    // E 2025/07/24 21:13:19 错误消息
                    const newLog = oldLog + "E " + new Date().toLocaleString() + " " + message + "\n";
                    const response = await this.putFile("/temp/" + LOG_NAME, newLog);
                    if (!response || (response as any).code !== 0) {
                        // 写入失败
                        const errorResponse = response as any;
                        showMessage(this.i18n.pluginDisplayName + ": " + this.i18n.writePluginLogFailed + " [" + errorResponse.code + ": " + errorResponse.msg + "]", 20000, "error");
                    }
                };

                const response = await this.getFile("/temp/" + LOG_NAME) as any;
                if (response && response.code === 404) {
                    // 没有文件，直接创建文件
                    await writeLog();
                } else if ((response || response === "") && !response.code) {
                    // 如果有文件，response 就是文件内容、没有 response.code
                    await writeLog(response as string);
                } else {
                    // 其他错误（具体错误详情见原生 API 文档）
                    const errorResponse = response as any;
                    showMessage(this.i18n.pluginDisplayName + ": " + this.i18n.getPluginLogFailed + " [" + errorResponse.code + ": " + errorResponse.msg + "]", 20000, "error");
                }
            } catch (error) {
                this.console.error("Failed to write log:", error);
            }
        };

        // 将任务添加到队列
        this.logWriteQueue.push(writeTask);

        // 如果当前没有在写入，则开始处理队列
        if (!this.isLogWriting) {
            this.processLogQueue();
        }
    }

    /**
     * 处理日志写入队列
     */
    private async processLogQueue() {
        if (this.isLogWriting || this.logWriteQueue.length === 0) {
            return;
        }

        this.isLogWriting = true;

        try {
            // 依次处理队列中的任务
            while (this.logWriteQueue.length > 0) {
                const task = this.logWriteQueue.shift();
                if (task) {
                    await task();
                }
            }
        } catch (error) {
            this.console.error("Error occurred while processing the log queue:", error);
        } finally {
            this.isLogWriting = false;
        }
    }

    /**
     * 获取文件内容，返回 Promise
     * @param path 文件路径
     * @returns Promise<any>
     */
    private getFile(path: string): Promise<any> {
        // 解决 400 parses request failed 问题，fetchPost 需要传递对象而不是 JSON 字符串
        return new Promise((resolve) => {
            fetchPost("/api/file/getFile", { path }, (response: any) => {
                resolve(response);
            });
        });
    }

    /**
     * 写入文件，返回 Promise
     * @param path 文件路径
     * @param content 文件内容
     * @returns Promise<any>
     */
    private putFile(path: string, content: string) {
        if (!path || !content) {
            return Promise.reject({ code: 400, msg: "path or content is empty" });
        }

        const formData = new FormData();
        formData.append("path", path);
        formData.append("isDir", "false");
        formData.append("file", new File([content], path.split('/').pop(), { type: "text/plain" }));

        return new Promise((resolve) => {
            fetchPost("/api/file/putFile", formData, (response: any) => {
                resolve(response);
            });
        });
    }


    // ================================ 工具方法 ================================

    /**
     * 根据 data-key 获取对话框元素
     * @param dataKey 对话框元素的 data-key 属性值
     * @returns 对话框元素
     */
    private getDialogByDataKey(dataKey: string) {
        // 设置和删除对话框打开时，不允许操作菜单和代码片段编辑对话框，否则 this.keyDownHandler() 判断不了 Escape 和 Enter 按键是对哪个元素的操作
        const dialogElement = document.querySelector(`.b3-dialog--open[data-key="${dataKey}"]`) as HTMLElement;
        return dialogElement;
    }

    /**
     * 判断代码片段类型是否启用
     * @param snippetType 代码片段类型
     * @returns 是否启用
     */
    private isSnippetsTypeEnabled(snippetType: string) {
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
        fetchPost("/api/ui/reloadUI", (response: any) => {
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
     * 控制台调试输出
     */
    private console = {
        /**
         * 输出调试日志
         * @param args 日志内容
         */
        log: (...args: any[]) => {
            if (this.consoleDebug) {
                console.log(...args);
            }
        },
        /**
         * 输出警告日志
         * @param args 日志内容
         */
        warn: (...args: any[]) => {
            // 目前始终输出警告日志
            // if (this.consoleDebug) {
                console.warn(...args);
            // }
        },
        /**
         * 输出错误日志
         * @param args 日志内容
         */
        error: (...args: any[]) => {
            // 目前始终输出错误日志
            // if (this.consoleDebug) {
                console.error(...args);
            // }
        }
    }

    /**
     * 使对话框或菜单元素显示在最上层（设置 zIndex）
     * @param element 元素
     */
    private bringElementToFront(element: HTMLElement) {
        let maxZIndex = 0;
        // 查找所有打开的 Dialog 和菜单，如果 zIndex 不是最大的才增加
        const allElements = document.querySelectorAll(".b3-dialog--open[data-key='jcsm-snippet-dialog'], #commonMenu[data-name='PluginSnippets']");
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

    /**
     * 判断当前激活元素是否为输入框（input 或 textarea）
     * @returns 是否为输入框
     */
    private isInputElementActive() {
        const activeElement = document.activeElement;
        const tagName = activeElement.tagName.toLowerCase();
        const type = activeElement.getAttribute("type");
        // 忽略按钮元素
        return (tagName === "input" && type !== "checkbox") || tagName === "textarea";
    }

    /**
     * 全局键盘事件处理
     * @param event 键盘事件
     */
    private keyDownHandler = (event: KeyboardEvent) => {
        // 设置对话框操作（优先查找设置对话框，因为设置对话框的元素一定在最顶上）
        const settingDialogElement = this.getDialogByDataKey("jcsm-setting-dialog");
        if (settingDialogElement) {
            // 阻止冒泡，避免触发原生监听器导致菜单关闭？
            // event.stopPropagation();
            // 如果按 Esc 时焦点在输入框里，移除焦点
            if (event.key === "Escape" && this.isInputElementActive()) {
                (document.activeElement as HTMLElement).blur();
                return;
            }
            // 触发 Dialog 的 click 事件，传递按键（参考原生方法：https://github.com/siyuan-note/siyuan/blob/c88f99646c4c1139bcfc551b4f24b7cbea151751/app/src/boot/globalEvent/keydown.ts#L1394-L1406 ）
            settingDialogElement.dispatchEvent(new CustomEvent("click", {detail: event.key}));
            return;
        }

        // 删除对话框操作
        const snippetDeleteDialogElement = this.getDialogByDataKey("jcsm-snippet-delete");
        if (snippetDeleteDialogElement) {
            // 阻止冒泡，避免触发原生监听器导致菜单关闭
            event.stopPropagation();
            snippetDeleteDialogElement.dispatchEvent(new CustomEvent("click", {detail: event.key}));
            return;
        }

        // 无法判断是在操作哪个代码片段编辑对话框，此处忽略代码片段编辑对话框操作

        // 菜单操作
        if (this.menu) {
            // 阻止冒泡，避免：
            // 1. 触发原生监听器导致实际上会操作菜单选项，因此无法在输入框中使用方向键移动光标
            // 2. 按 Enter 之后默认会关闭整个菜单
            event.stopPropagation();
            // 如果当前在输入框中使用键盘，则不处理菜单按键事件
            if (this.isInputElementActive()) return;
            this.menu.element.dispatchEvent(new CustomEvent("click", {detail: event.key}));
            return;
        }
    }

    /**
     * 移除全局键盘事件监听
     */
    private destroyKeyDownHandler = () => {
        if (!this.isDialogAndMenuOpen()) {
            // 窗口内没有打开的 Dialog 和菜单之后才移除事件监听
            this.removeListener(document.documentElement, "keydown", this.keyDownHandler);
        }
    }

    /**
     * 是否存在打开的 Dialog 和菜单
     * @returns 是否存在
     */
    private isDialogAndMenuOpen() {
        return document.querySelectorAll(".b3-dialog--open[data-key*='jcsm-']").length > 0 || this.menu;
    }

    /**
     * 将 HTML 字符串转换为元素
     * @param html HTML 字符串
     * @returns 元素
     */
    private htmlToElement(html: string): HTMLElement {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.firstChild as HTMLElement;
    }


    // ================================ 事件监听管理 ================================

    /**
     * 事件监听器的映射
     * 卸载插件的时候会移除所有插件添加的元素及其监听器，但元素有可能是上一个实例添加的，所以各个实例要共用一个 listeners 对象
     */
    get listeners(): ListenersArray {
        if (!window.siyuan.jcsm?.listeners) {
            window.siyuan.jcsm.listeners = [] as ListenersArray;
        }
        return window.siyuan.jcsm.listeners as ListenersArray;
    }
    set listeners(value: ListenersArray | null) { 
        window.siyuan.jcsm.listeners = value; 
    }

    /**
     * 监听器检查定时器 ID
     */
    get listenerCheckIntervalId() { return window.siyuan.jcsm?.listenerCheckIntervalId ?? null; }
    set listenerCheckIntervalId(value: number | null) { window.siyuan.jcsm.listenerCheckIntervalId = value; }

    /**
     * 是否正在检查监听器元素
     */
    get isCheckingListeners() { return window.siyuan.jcsm?.isCheckingListeners ?? false; }
    set isCheckingListeners(value: boolean) { window.siyuan.jcsm.isCheckingListeners = value; }
    // 执行 addListener 和 removeListener 之后，如果 listeners 里还有监听器，每隔一段时间检查一次元素是否在 DOM 中，如果不在则移除监听器。直到 listeners 里没有监听器为止才不需要间隔时间检查
    // 感觉有可能存在本插件外部移除 Dialog 的情况

    /**
     * 检查监听器元素是否还在 DOM 中
     * 如果元素不在 DOM 中，则移除对应的监听器
     * 如果 listeners 中还有监听器，则每隔一段时间检查一次
     * 直到 listeners 中没有监听器为止才停止检查
     */
    private checkListenerElement() {
        // 如果已经在检查中，则不重复执行
        if (this.isCheckingListeners) {
            return;
        }

        // 如果没有监听器，不需要检查
        if (!this.listeners || this.listeners.length === 0) {
            return;
        }

        // 设置检查标志
        this.isCheckingListeners = true;

        this.console.log("checkListenerElement: 检查监听器元素", this.listeners);

        // 如果窗口内没有打开的 Dialog 和菜单，则移除 Document 的监听器
        if (!this.isDialogAndMenuOpen()) {
            this.removeListener(document.documentElement);
        }

        // 检查每个元素的监听器
        for (let i = this.listeners.length - 1; i >= 0; i--) {
            const elementListeners = this.listeners[i];
            const { element, listeners } = elementListeners;

            // 检查元素是否还在 DOM 中
            if (!document.contains(element)) {
                // 元素不在 DOM 中，移除该元素的所有监听器
                listeners.forEach(({ event, fn, options }) => {
                    element.removeEventListener(event, fn, options);
                });
                // 从数组中移除该元素的记录
                this.listeners.splice(i, 1);
                this.console.warn("checkListenerElement: remove listener of element which is not in DOM", element);
            }
        }

        // 如果还有监听器，则启动定期检查
        if (this.listeners && this.listeners.length > 0) {
            this.startListenerCheckInterval();
        } else {
            // 没有监听器了，重置检查标志并停止定时器
            this.isCheckingListeners = false;
            this.stopListenerCheckInterval();
        }
    }

    /**
     * 启动监听器检查定时器
     */
    private startListenerCheckInterval() {
        // 如果已经有定时器在运行，则不重复启动
        if (this.listenerCheckIntervalId) {
            return;
        }

        // 每隔 30 秒检查一次（调试时每隔 2 秒检查一次）
        this.listenerCheckIntervalId = window.setInterval(() => {
            this.isCheckingListeners = false; // 重置检查标志
            this.checkListenerElement();
        }, this.consoleDebug ? 2000 : 30000);
    }

    /**
     * 停止监听器检查定时器
     */
    private stopListenerCheckInterval() {
        if (this.listenerCheckIntervalId) {
            window.clearInterval(this.listenerCheckIntervalId);
            this.listenerCheckIntervalId = null;
        }
    }

    /**
     * 添加事件监听器
     * @param element 元素
     * @param event 事件
     * @param fn 回调函数
     * @param options 监听器选项
     */
    private addListener(element: HTMLElement, event: string, fn: (event?: Event) => void, options?: AddEventListenerOptions) {
        // 查找元素是否已存在监听器记录
        let elementListeners = this.listeners.find(item => item.element === element);
        if (!elementListeners) {
            // 创建该元素的监听器列表
            elementListeners = { element, listeners: [] };
            this.listeners.push(elementListeners);
        }

        // 检查是否已存在相同的监听器
        if (elementListeners.listeners.some(item => item.event === event && item.fn === fn && item.options === options)) {
            // 如果元素上已经存在相同的监听器，则不重复添加
            return;
        }

        // 将监听器添加到列表中、注册监听器
        elementListeners.listeners.push({ event, fn, options });
        element.addEventListener(event, fn, options);
        
        // 启动监听器元素检查机制
        this.checkListenerElement();
    }

    /**
     * 移除事件监听器
     * @param element 元素
     * @param event 事件
     * @param fn 回调函数
     * @param options 监听器选项
     */
    private removeListener(element: HTMLElement, event?: string, fn?: (event?: Event) => void, options?: AddEventListenerOptions) {
        this.console.log("removeListener: element", element);
        if (!element) {
            this.console.warn("removeListener: element is not found");
            return;
        }

        // 查找元素的监听器记录
        const elementIndex = this.listeners.findIndex(item => item.element === element);
        if (elementIndex === -1) return;

        const elementListeners = this.listeners[elementIndex];
        if (!elementListeners) {
            // 未获取到 elementListeners，有可能是重复调用了 removeListener，直接返回
            this.console.warn("removeListener: elementListeners is not found");
            return;
        }

        if (event) {
            if (fn) {
                // 移除特定的监听器
                element.removeEventListener(event, fn, options);
                const index = elementListeners.listeners.findIndex(item =>
                    item.event === event && item.fn === fn && item.options === options
                );
                if (index > -1) {
                    elementListeners.listeners.splice(index, 1);
                    // 如果移除后该元素没有任何监听器了，从数组中移除该元素的记录
                    if (elementListeners.listeners.length === 0) {
                        this.listeners.splice(elementIndex, 1);
                    }
                }
            } else {
                // 只移除该事件类型的所有监听器
                // 先筛选出所有该事件类型的监听器
                const toRemove = elementListeners.listeners.filter(item => item.event === event);
                toRemove.forEach(({ event, fn, options }) => {
                    element.removeEventListener(event, fn, options);
                });
                // 从监听器列表中移除所有该事件类型的监听器
                elementListeners.listeners = elementListeners.listeners.filter(item => item.event !== event);
                // 如果移除后该元素没有任何监听器了，从数组中移除该元素的记录
                if (elementListeners.listeners.length === 0) {
                    this.listeners.splice(elementIndex, 1);
                }
            }
        } else {
            // 移除该元素的所有监听器
            elementListeners.listeners.forEach(({ event, fn, options }) => {
                element.removeEventListener(event, fn, options);
            });
            // 从数组中移除该元素的记录
            this.listeners.splice(elementIndex, 1);
        }
            
        // 启动监听器元素检查机制
        this.checkListenerElement();
    }


    // ================================ 其他 ================================


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
    //             this.console.log(tab);
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
