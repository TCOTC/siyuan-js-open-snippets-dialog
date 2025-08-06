import "./index.scss";
import { Snippet, ListenersArray, FileState } from "./types";
import { parse as acornParse } from "acorn";

// 思源插件 API
import { Plugin, showMessage, Dialog, Menu, getFrontend, Setting, fetchPost, fetchSyncPost, Constants, openSetting } from "siyuan";
// 未使用的：Custom、confirm、openTab、adaptHotkey、getBackend、Protyle、openWindow、IOperation、openMobileFileById、lockScreen、ICard、ICardData、exitSiYuan、getModelByDockType、getAllEditor、Files、platformUtils、openAttributePanel、saveLayout

// CodeMirror 6
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete' // import { autocompletion, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { css } from '@codemirror/lang-css'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, foldKeymap, indentOnInput, indentUnit } from '@codemirror/language'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { EditorState } from '@codemirror/state'
import { crosshairCursor, drawSelection, dropCursor, EditorView, highlightActiveLine, highlightSpecialChars, keymap, lineNumbers, placeholder, rectangularSelection } from '@codemirror/view'
import { vscodeLight, vscodeDark } from '@uiw/codemirror-theme-vscode'


const PLUGIN_NAME = "snippets";            // 插件名
const STORAGE_NAME = "plugin-config.json"; // 配置文件名
const LOG_NAME = "plugin-snippets.log";    // 日志文件名
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
            console.log(this.i18n.pluginDisplayName + this.i18n.pluginNotSupportedInPublish);
            return;
        }

        // 初始化 window.siyuan.jcsm
        if (!window.siyuan.jcsm) window.siyuan.jcsm = {};

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

        // 初始化插件设置
        await this.initSetting();

        // 添加顶栏按钮
        this.addIcons(`
                <symbol id="iconJcsm" viewBox="0 0 32 32">
                    <path d="M23.498 9.332c-0.256 0.256-0.415 0.611-0.415 1.002s0.159 0.745 0.415 1.002l4.665 4.665-4.665 4.665c-0.256 0.256-0.415 0.61-0.415 1.002s0.159 0.745 0.415 1.002v0c0.256 0.256 0.61 0.415 1.002 0.415s0.745-0.159 1.002-0.415l5.667-5.667c0.256-0.256 0.415-0.611 0.415-1.002s-0.158-0.745-0.415-1.002l-5.667-5.667c-0.256-0.256-0.61-0.415-1.002-0.415s-0.745 0.159-1.002 0.415v0z"></path>
                    <path d="M7.5 8.917c-0.391 0-0.745 0.159-1.002 0.415l-5.667 5.667c-0.256 0.256-0.415 0.611-0.415 1.002s0.158 0.745 0.415 1.002l5.667 5.667c0.256 0.256 0.611 0.415 1.002 0.415s0.745-0.159 1.002-0.415v0c0.256-0.256 0.415-0.61 0.415-1.002s-0.159-0.745-0.415-1.002l-4.665-4.665 4.665-4.665c0.256-0.256 0.415-0.611 0.415-1.002s-0.159-0.745-0.415-1.002v0c-0.256-0.256-0.61-0.415-1.002-0.415v0z"></path>
                    <path d="M19.965 3.314c-0.127-0.041-0.273-0.065-0.424-0.065-0.632 0-1.167 0.413-1.35 0.985l-0.003 0.010-7.083 22.667c-0.041 0.127-0.065 0.273-0.065 0.424 0 0.632 0.413 1.167 0.985 1.35l0.010 0.003c0.127 0.041 0.273 0.065 0.424 0.065 0.632 0 1.167-0.413 1.35-0.985l0.003-0.010 7.083-22.667c0.041-0.127 0.065-0.273 0.065-0.424 0-0.632-0.413-1.167-0.985-1.35l-0.010-0.003z"></path>
                </symbol>
            `);
        // 顶栏按钮点击回调：打开代码片段管理器
        const openSnippetsManager = () => {
            if (this.getAllModalDialogElements().length > 0) return;

            if (this.isMobile) {
                this.openMenu();
            } else {
                let rect = topBarElement.getBoundingClientRect();
                // 如果被隐藏，则使用更多按钮
                if (rect.width === 0) {
                    rect = document.querySelector("#barMore").getBoundingClientRect();
                }
                if (rect.width === 0) {
                    rect = document.querySelector("#barPlugins").getBoundingClientRect();
                }
                this.openMenu(topBarElement, rect);
            }
        };
        const topBarKeymap = this.getCustomKeymapByCommand("openSnippetsManager");
        const title = !this.isMobile && topBarKeymap ? this.i18n.pluginDisplayName + " " + this.getHotkeyDisplayText(topBarKeymap) : this.i18n.pluginDisplayName;
        const topBarElement = this.addTopBar({
            icon: "iconJcsm",
            title: title,
            position: "right",
            callback: () => {
                openSnippetsManager();
            }
        });

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

        // 启动文件监听
        if (this.fileWatchEnabled !== "disabled") {
            this.startFileWatch();
        }

        console.log(this.i18n.pluginDisplayName + this.i18n.pluginOnload);

        // 调试
        // await new Promise(resolve => setTimeout(resolve, 10000));
    }

    /**
     * 布局加载完成
     */
    public onLayoutReady() {
        // 发布服务不启用插件
        if (window.siyuan.isPublish) return;
    }

    /**
     * 禁用插件
     * 插件更新会先执行 onunload 再执行 onload，不会执行 uninstall
     */
    public onunload() {
        // 发布服务不启用插件
        if (window.siyuan.isPublish) return;

        // 清理主题监听器
        if (window.siyuan.jcsm?.themeObserver) {
            window.siyuan.jcsm.themeObserver.disconnect();
            delete window.siyuan.jcsm.themeObserver;
        }

        // 移除菜单
        this.menu?.close();

        // 停止文件监听
        this.stopFileWatch();

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
        document.querySelectorAll(".b3-dialog--open[data-key^='jcsm-']").forEach((dialogElement: HTMLElement) => {
            this.closeDialogByElement(dialogElement);
        });

        // 移除菜单
        this.menu?.close();

        // 停止文件监听
        this.stopFileWatch();

        // TODO自定义页签: 移除所有自定义页签

        // 清理主题监听器
        if (window.siyuan.jcsm?.themeObserver) {
            window.siyuan.jcsm.themeObserver.disconnect();
            delete window.siyuan.jcsm.themeObserver;
        }

        // 移除所有监听器
        this.destroyListeners();
        
        // 最后移除全局变量
        delete window.siyuan.jcsm;

        console.log(this.i18n.pluginDisplayName + this.i18n.pluginUninstall);
    }


    // ================================ 插件设置 ================================

    /**
     * 插件设置
     */
    public setting: Setting;

    /**
     * 配置文件版本（配置结构有变化时升级）
     */
    private version: number = 1;
    
    /**
     * CSS 代码片段实时预览
     */
    private realTimePreview: boolean;

    /**
     * 新建代码片段时默认启用
     */
    private newSnippetEnabled: boolean;

    /**
     * 在开发者工具中输出插件日志
     */
    private consoleDebug: boolean;

    /**
     * 配置项定义
     */
    private get configItems(): Array<{
        key: string;
        description?: string;
        type?: 'boolean' | 'string' | 'number' | 'select' | 'createActionElement';
        defaultValue?: any;
        direction?: 'row' | 'column';
        createActionElement?: () => HTMLElement;
        options?: Array<{ value: string; text: string }>;
    }> {
        const configItems: Array<{
            key: string;
            description?: string;
            type?: 'boolean' | 'string' | 'number' | 'select' | 'createActionElement';
            defaultValue?: any;
            direction?: 'row' | 'column';
            createActionElement?: () => HTMLElement;
            options?: Array<{ value: string; text: string }>;
        }> = [
            {
                key: 'realTimePreview',
                description: 'realTimePreviewDescription',
                type: 'boolean',
                defaultValue: true,
            },
            {
                key: 'newSnippetEnabled',
                type: 'boolean',
                defaultValue: true,
            },
            {
                key: "showDuplicateButton",
                description: "showDuplicateButtonDescription",
                type: "boolean",
                defaultValue: false,
            },
            {
                key: "showDeleteButton",
                description: "showDeleteButtonDescription",
                type: "boolean",
                defaultValue: true,
            },
            {
                key: "snippetSearchType",
                description: "snippetSearchTypeDescription",
                type: "select",
                defaultValue: 1,
                options: [
                    { value: "0", text: "snippetSearchTypeDisabled" },
                    { value: "1", text: "snippetSearchTypeName" },
                    { value: "2", text: "snippetSearchTypeContent" },
                    { value: "3", text: "snippetSearchTypeNameAndContent" }
                ],
            },
            {
                key: "editorIndentUnit",
                description: "editorIndentUnitDescription",
                type: "select",
                defaultValue: "followSiyuan",
                options: [
                    { value: "followSiyuan", text: "editorIndentUnitFollowSiyuan" },
                    { value: "tab1", text: "editorIndentUnitTab1" },
                    { value: "tab2", text: "editorIndentUnitTab2" },
                    { value: "space1", text: "editorIndentUnitSpace1" },
                    { value: "space2", text: "editorIndentUnitSpace2" },
                    { value: "space3", text: "editorIndentUnitSpace3" },
                    { value: "space4", text: "editorIndentUnitSpace4" },
                    { value: "space5", text: "editorIndentUnitSpace5" },
                    { value: "space6", text: "editorIndentUnitSpace6" },
                    { value: "space7", text: "editorIndentUnitSpace7" },
                    { value: "space8", text: "editorIndentUnitSpace8" }
                ],
            },
            {
                key: "fileWatchEnabled",
                description: "fileWatchEnabledDescription",
                type: "select",
                defaultValue: "disabled",
                options: [
                    { value: "disabled", text: "fileWatchModeDisabled" },
                    { value: "enabled", text: "fileWatchModeEnabled" },
                    { value: "loadOnly", text: "fileWatchModeLoadOnly" }
                ],
            },
            {
                key: "fileWatchPath",
                description: "fileWatchPathDescription",
                type: "string",
                defaultValue: "data/snippets",
            },
            {
                key: "fileWatchInterval",
                description: "fileWatchIntervalDescription",
                type: "number",
                defaultValue: 5,
            }
        ];

        if (!this.isMobile) {
            configItems.push({
                key: "openNativeSnippets",
                description: "openNativeSnippetsDescription",
                type: "createActionElement",
                createActionElement: () => {
                    return this.htmlToElement(
                        `<span class="b3-button b3-button--outline fn__flex-center fn__size200" data-action="settingsSnippets"><svg><use xlink:href="#iconJcsm"></use></svg>${this.i18n.openNativeSnippetsWindow}</span>`
                    );
                },
            });
        }

        configItems.push(
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
                key: 'consoleDebug',
                description: 'consoleDebugDescription',
                type: 'boolean',
                defaultValue: false,
            },
            // {
            //     key: "notificationSwitch", // 通知总开关，通知数量多了再添加
            //     type: "boolean",
            //     defaultValue: true,
            // },
            {
                key: "reloadUIAfterModifyJSNotice",
                description: !this.isMobile ? "reloadUIAfterModifyJSNoticeDescription" : "reloadUIAfterModifyJSNoticeDescriptionMobile",
                type: "boolean",
                defaultValue: true,
            }
        );

        return configItems;
    }

    /**
     * 创建配置 getter
     * @param key 配置项 key
     * @returns 配置 getter
     */
    private createConfigGetter(key: string) {
        const configItem = this.configItems.find(item => item.key === key);
        const defaultValue = configItem?.defaultValue;
        return () => (window.siyuan.jcsm as any)?.[key] ?? defaultValue;
    }

    /**
     * 创建配置 setter
     * @param key 配置项 key
     * @returns 配置 setter
     */
    private createConfigSetter(key: string) {
        return (value: any) => { (window.siyuan.jcsm as any)[key] = value; };
    }

    /**
     * 加载配置或者设置默认值
     * @param config 配置
     */
    private loadConfig(config: any) {
        this.configItems.forEach(item => {
            const value = config[item.key] ?? item.defaultValue;
            // 使用全局变量存储配置
            (window.siyuan.jcsm as any)[item.key] = value;
        });
    }

    /**
     * 创建设置项
     * @param item 配置项
     * @returns 设置项
     */
    private createSettingItem(item: typeof this.configItems[0]) {
        if (!item.direction) {
            item.direction = "column";
            // 或者也可以根据类型设置默认方向，但是目前不需要
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
                } else if (item.type === 'select' && item.options) {
                    // 创建下拉框
                    const currentValue = (window.siyuan.jcsm as any)[item.key] ?? item.defaultValue;
                    const optionsHtml = item.options.map(option => {
                        // 支持数字和字符串类型的值比较
                        const isSelected = typeof currentValue === 'number' && typeof option.value === 'string' 
                            ? currentValue === parseInt(option.value)
                            : currentValue === option.value;
                        return `<option value="${option.value}"${isSelected ? " selected" : ""}>${(this.i18n as any)[option.text]}</option>`;
                    }).join("");
                    
                    return this.htmlToElement(
                        `<select class="b3-select fn__flex-center" data-type="${item.key}">${optionsHtml}</select>`
                    );
                } else if (item.type === 'string') {
                    // 创建文本输入框
                    const currentValue = (window.siyuan.jcsm as any)[item.key] ?? item.defaultValue ?? "";
                    return this.htmlToElement(
                        `<input class="b3-text-field fn__flex-center" type="text" data-type="${item.key}" value="${currentValue}"${item.defaultValue ? ` placeholder="${item.defaultValue}"` : ""}>`
                    );
                } else if (item.type === 'number') {
                    // 创建数字输入框
                    const currentValue = (window.siyuan.jcsm as any)[item.key] ?? item.defaultValue ?? 0;
                    return this.htmlToElement(
                        `<input class="b3-text-field fn__flex-center" type="number" data-type="${item.key}" value="${currentValue}" min="1" max="300" step="1"${item.defaultValue ? ` placeholder="${item.defaultValue}"` : ""}>`
                    );
                } else if (item.type === 'createActionElement' || item.createActionElement) {
                    return item.createActionElement?.();
                }
                // 还可以扩展其他类型的控件
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
    }

    /**
     * 应用设置
     * @param dialogElement 对话框元素
     */
    private applySetting(dialogElement: HTMLElement) {
        // 应用设置
        this.configItems.forEach(item => {
            if (item.type === 'boolean') {
                const element = dialogElement.querySelector(`input[data-type='${item.key}']`) as HTMLInputElement;
                if (!element) return;

                const newValue = element.checked;
                if ((window.siyuan.jcsm as any)[item.key] !== newValue) {
                    (window.siyuan.jcsm as any)[item.key] = newValue;

                    if (item.key === "realTimePreview") {
                        const cssDialogs = document.querySelectorAll(`.b3-dialog--open[data-key="jcsm-snippet-dialog"][data-snippet-type="css"]`);
                        // 修改 realTimePreview 设置之后查询所有对话框按钮修改预览按钮的 fn__none
                        if (newValue === true) {
                            cssDialogs.forEach(cssDialog => {
                                    const previewButton = cssDialog.querySelector("button[data-action='preview']") as HTMLButtonElement;
                                    if (previewButton) {
                                        previewButton.classList.add("fn__none");
                                    }
                                    // 启用 realTimePreview 设置之后，查询所有 CSS 代码片段编辑对话框触发一次 input 事件（不需要冒泡），由 input 事件监听器触发一次预览
                                    // cssDialog.dispatchEvent(new CustomEvent("input", {detail: "realTimePreview"}));
                                    cssDialog.dispatchEvent(new CustomEvent("keydown", {detail: "realTimePreview"}));
                            });
                        } else {
                            cssDialogs.forEach(cssDialog => {
                                const previewButton = cssDialog.querySelector("button[data-action='preview']") as HTMLButtonElement;
                                if (previewButton) {
                                    previewButton.classList.remove("fn__none");
                                }
                            });
                        }
                    } else if (item.key === "showDuplicateButton") {
                        // 修改 showDuplicateButton 之后，查询所有菜单项修改创建副本按钮的 fn__none
                        const duplicateButtons = this.menuItems?.querySelectorAll(".jcsm-snippet-item button[data-type='duplicate']") as NodeListOf<HTMLButtonElement>;
                        duplicateButtons.forEach(duplicateButton => {
                            if (newValue) {
                                duplicateButton.classList.remove("fn__none");
                            } else {
                                duplicateButton.classList.add("fn__none");
                            }   
                        });
                    } else if (item.key === "showDeleteButton") {
                        // 修改 showDeleteButton 之后，查询所有菜单项修改删除按钮的 fn__none
                        const deleteButtons = this.menuItems?.querySelectorAll(".jcsm-snippet-item button[data-type='delete']") as NodeListOf<HTMLButtonElement>;
                        deleteButtons.forEach(deleteButton => {
                            if (newValue) {
                                deleteButton.classList.remove("fn__none");
                            } else {
                                deleteButton.classList.add("fn__none");
                            }
                        });
                    }
                }
            } else if (item.type === 'select') {
                const element = dialogElement.querySelector(`select[data-type='${item.key}']`) as HTMLSelectElement;
                if (!element) return;

                let newValue: any = element.value;
                // 根据配置项的类型转换值
                if (item.key === "snippetSearchType") {
                    newValue = parseInt(element.value);
                }
                
                if ((window.siyuan.jcsm as any)[item.key] !== newValue) {
                    (window.siyuan.jcsm as any)[item.key] = newValue;

                    if (item.key === "snippetSearchType") {
                        // 修改代码片段搜索类型时，隐藏或显示搜索按钮（和搜索输入框）
                        if (newValue === 0) {
                            const searchButton = this.menuItems?.querySelector(".jcsm-top-container button[data-type='search']") as HTMLButtonElement;
                            if (searchButton) {
                                searchButton.classList.add("fn__none");
                                searchButton.classList.remove("jcsm-active");
                            }
                            const searchInput = this.menuItems?.querySelector("input[data-action='search']") as HTMLInputElement;
                            if (searchInput) {
                                searchInput.classList.add("fn__none");
                                searchInput.value = "";
                                searchInput.dispatchEvent(new Event("input", { bubbles: true }));
                            }
                        } else {
                            this.menuItems?.querySelector(".jcsm-top-container button[data-type='search']")?.classList.remove("fn__none");
                        }
                    } else if (item.key === "editorIndentUnit") {
                        // 修改编辑器缩进单位时，更新所有打开的编辑器
                        this.updateAllEditorConfigs("indent unit");
                    }
                }
            } else if (item.type === 'string') {
                const element = dialogElement.querySelector(`input[data-type='${item.key}']`) as HTMLInputElement;
                if (!element) return;
            
                let newValue = element.value;
                // 对 fileWatchPath 进行特殊验证，不允许为空或只有空字符
                if (item.key === "fileWatchPath") {
                    if (!newValue || newValue.trim() === "") {
                        newValue = "data/snippets";
                        // 重置输入框的值（目前没什么用，因为保存设置之后对话框就关闭了。不过以后有可能有用）
                        // element.value = newValue;
                    }
                }
                
                if ((window.siyuan.jcsm as any)[item.key] !== newValue) {
                    (window.siyuan.jcsm as any)[item.key] = newValue;
                }
            } else if (item.type === 'number') {
                const element = dialogElement.querySelector(`input[data-type='${item.key}']`) as HTMLInputElement;
                if (!element) return;
                
                const newValue = parseInt(element.value) || item.defaultValue || 0;
                if ((window.siyuan.jcsm as any)[item.key] !== newValue) {
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

        // 在应用设置之后处理文件监听设置变化
        this.handleFileWatchSettingChange();

        // 移除设置对话框
        this.closeDialogByElement(dialogElement);
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
        dialog.element.setAttribute("data-mobile", this.isMobile ? "true" : "false");
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

        const closeElement = dialog.element.querySelector(".b3-dialog__close") as HTMLElement;
        const scrimElement = dialog.element.querySelector(".b3-dialog__scrim") as HTMLElement;

        // 设置对话框点击事件
        const dialogClickHandler = (event: MouseEvent) => {
            // 阻止冒泡，否则点击 Dialog 时会导致 menu 关闭
            event.stopPropagation();

            const target = event.target as HTMLElement;
            const tagName = target.tagName.toLowerCase();
            const isScrim = target.classList.contains("b3-dialog__scrim");
            const isDispatch = typeof event.detail === "string";
            if (tagName === "button" || isScrim || isDispatch) {
                const type = target.dataset.type;
                if (type === "cancel" || isScrim || (isDispatch && event.detail=== "Escape")) {
                    event.stopPropagation();
                    this.closeDialogByElement(dialog.element);
                } else if (type === "confirm" || (isDispatch && event.detail=== "Enter")) {
                    event.stopPropagation();
                    this.applySetting(dialog.element);
                }
            } else if (target === closeElement || target === scrimElement) {
                this.closeDialogByElement(dialog.element);
            }

            // 执行特殊操作
            const action = target.getAttribute("data-action");
            if (action === "settingsSnippets") {
                event.preventDefault();
                event.stopPropagation();
                this.menu?.close(); // 不关闭菜单的话对话框中的容器无法滚动

                // 过程中隐藏设置对话框，避免闪烁
                const styleSheet = document.createElement("style");
                styleSheet.textContent = "body > div[data-key='dialog-setting'] { display: none; }";
                document.head.appendChild(styleSheet);
                
                const settingDialog = openSetting(window.siyuan.ws.app); // https://github.com/siyuan-note/siyuan/blob/22923d3eac57b59061b65e04f37913e4ba48240a/app/src/window/index.ts#L49
                const settingDialogElement = settingDialog.element;
                // 点击外观选项卡
                settingDialogElement.querySelector('.b3-tab-bar [data-name="appearance"]').dispatchEvent(new CustomEvent("click"));
                requestAnimationFrame(() => {
                    // 点击代码片段设置按钮，打开窗口
                    settingDialogElement.querySelector('button#codeSnippet').dispatchEvent(new CustomEvent("click"));
                    settingDialog.destroy();
                    setTimeout(() => {
                        // destroy 有个关闭动画，需要等待动画结束才能移除样式（参考原生代码 app/src/dialog/index.ts Dialog.destroy 方法）
                        document.head.removeChild(styleSheet);
                    }, Constants.TIMEOUT_DBLCLICK ?? 190);
                });

            } else if (action === "settingsKeymap") {
                event.preventDefault();
                event.stopPropagation();
                this.menu?.close(); // 不关闭菜单的话对话框中的容器无法滚动

                const settingDialogElement = openSetting(window.siyuan.ws.app).element;
                // 点击快捷键选项卡
                settingDialogElement.querySelector('.b3-tab-bar [data-name="keymap"]').dispatchEvent(new CustomEvent("click"));

                // 查找并点击指定文本
                const clickListItemByText = (container: Element, text: string) => {
                    const items = container.querySelectorAll('.b3-list-item__text');
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i] as HTMLElement;
                        if (item.textContent === text) {
                            item.dispatchEvent(new CustomEvent("click", { bubbles: true }));
                            return item;
                        }
                    }
                    return null;
                };

                // 先点击插件名，再点击 reloadUI 快捷键选项
                const pluginItem = clickListItemByText(settingDialogElement, this.i18n.pluginDisplayName);
                if (pluginItem?.parentElement?.nextElementSibling) {
                    clickListItemByText(pluginItem.parentElement.nextElementSibling, this.i18n.reloadUI);
                }
            }
        }

        // 添加事件监听
        this.addListener(dialog.element, "click", dialogClickHandler, {capture: true});
        this.addListener(document.documentElement, "keydown", this.globalKeyDownHandler);
        this.addListener(dialog.element, "wheel", (event: WheelEvent) => {
            // 在菜单打开的情况下，桌面端无法滚轮滚动设置对话框的 .b3-dialog__content，需要阻止事件冒泡
            event.stopPropagation();
        }, {passive: true});
        this.addListener(dialog.element, "touchmove", (event: TouchEvent) => {
            // 在菜单打开的情况下，移动端无法上下划动设置对话框的 .b3-dialog__content，需要阻止事件冒泡
            event.stopPropagation();
        }, {passive: true});
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

    // TODO功能: 菜单项支持拖拽排序（参考原生大纲拖拽实现 app/src/layout/dock/Outline.ts Outline.bindSort 方法）
    // 支持设置排序方式：固定排序（拖拽排序）、已开启优先、未开启优先
    // - [ ] 固定排序方式下再支持拖拽菜单选项调整排序（需要先验证一下 API 会不会按自己的逻辑重置顺序、验证一下用内置的代码片段窗口修改代码片段再保存之后会不会把排序重置）
    // - [ ] 优先排序方式下仅在生成菜单的时候排序，使用菜单的过程中不会再次排序

    /**
     * 打开顶栏菜单
     * @param topBarElement 顶栏按钮元素
     * @param rect 菜单位置
     */
    private async openMenu(topBarElement?: HTMLElement, rect?: DOMRect) {
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
        if (snippetsList) {
            this.snippetsList = snippetsList;
        } else {
            // 获取代码片段列表失败时，关闭菜单
            this.menu.close();
            return;
        }

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
            <button class="block__icon block__icon--show fn__flex-center ariaLabel${this.snippetSearchType === 0 ? " fn__none" : ""}" data-type="search" data-position="north" aria-label="${this.i18n.search}"><svg><use xlink:href="#iconSearch"></use></svg></button>
            <button class="block__icon block__icon--show fn__flex-center ariaLabel" data-type="config" data-position="north"><svg><use xlink:href="#iconSettings"></use></svg></button>
            <button class="block__icon block__icon--show fn__flex-center ariaLabel${this.isReloadUIButtonBreathing ? " jcsm-breathing" : ""}" data-type="reload" data-position="north"><svg><use xlink:href="#iconRefresh"></use></svg></button>
            <button class="block__icon block__icon--show fn__flex-center ariaLabel" data-type="new" data-position="north"><svg><use xlink:href="#iconAdd"></use></svg></button>
            <span class="fn__space"></span>
            <input class="jcsm-switch jcsm-all-snippets-switch b3-switch fn__flex-center" type="checkbox">
        `;

        const radio = menuTop.querySelector(`[data-snippet-type="${this.snippetsType}"]`) as HTMLInputElement;
        radio.checked = true;
        const settingsButton = menuTop.querySelector("button[data-type='config']") as HTMLButtonElement;
        settingsButton.setAttribute("aria-label", this.i18n.pluginConfig);
        const newSnippetButton = menuTop.querySelector("button[data-type='new']") as HTMLButtonElement;
        newSnippetButton.setAttribute("aria-label", this.i18n.add + " " + this.snippetsType.toUpperCase());
        const reloadUIButton = menuTop.querySelector("button[data-type='reload']") as HTMLButtonElement;
        const reloadUIKeymap = this.getCustomKeymapByCommand("reloadUI");
        reloadUIButton.setAttribute("aria-label", (!this.isMobile && reloadUIKeymap) ? this.i18n.reloadUI + " " + this.getHotkeyDisplayText(reloadUIKeymap) : this.i18n.reloadUI);
        
        this.menuItems.append(menuTop);
        
        // 插入搜索输入框
        const searchInput = '<input class="jcsm-snippets-search b3-text-field fn__none" data-action="search" type="text">';
        this.menuItems.insertAdjacentHTML("beforeend", searchInput);

        // 插入代码片段列表容器
        const snippetsContainer = document.createElement("div");
        snippetsContainer.className = "jcsm-snippets-container";
        snippetsContainer.insertAdjacentHTML("beforeend", this.genMenuSnippetsItems(this.snippetsList));
        this.menuItems.append(snippetsContainer);
        
        // “添加第一个 CSS 代码片段”的菜单项
        const newCssSnippetButton = this.htmlToElement(`<div class="jcsm-snippet-item b3-menu__item" data-type="new" data-snippet-type="css">${this.i18n.addFirstCSSSnippet}</div>`);
        snippetsContainer.appendChild(newCssSnippetButton);
        // “添加第一个 JS 代码片段”的菜单项
        const newJsSnippetButton = this.htmlToElement(`<div class="jcsm-snippet-item b3-menu__item" data-type="new" data-snippet-type="js">${this.i18n.addFirstJSSnippet}</div>`);
        snippetsContainer.appendChild(newJsSnippetButton);

        this.setMenuSnippetCount();
        this.setMenuSnippetsType(this.snippetsType);
        this.setAllSnippetsEditButtonActive();

        // 事件监听
        this.addListener(this.menu.element, "click", this.menuClickHandler);
        this.addListener(this.menu.element, "mousedown", (event: MouseEvent) => {
            // 点击菜单时要显示在最上层
            this.moveElementToTop(this.menu.element);
        });
        this.addListener(this.menu.element, "input", (event: InputEvent) => {
            const target = event.target as HTMLInputElement;
            const tagName = target.tagName.toLowerCase();
            if (tagName === "input" && target.dataset.action === "search") {
                // 筛选代码片段
                const filterSnippetsIds = this.filterSnippetsIds(target.value);
                if (filterSnippetsIds) {
                    this.menuItems.querySelectorAll(".jcsm-snippet-item").forEach((item: HTMLElement) => {
                        if (filterSnippetsIds.includes(item.dataset.id)) {
                            item.classList.remove("fn__none");
                        } else {
                            item.classList.add("fn__none");
                        }
                    });
                } else {
                    this.menuItems.querySelectorAll(".jcsm-snippet-item").forEach((item: HTMLElement) => {
                        item.classList.remove("fn__none");
                    });
                }

                if (!this.isMobile) {
                    // 设置当前选中项
                    this.setMenuSelection(this.snippetsType);
                }
            }
        });
        this.addListener(document.documentElement, "keydown", this.globalKeyDownHandler);
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
     * 关闭顶栏菜单回调
     * @param topBarElement 顶栏按钮元素
     */
    private closeMenuCallback(topBarElement?: HTMLElement) {
        if (topBarElement) {
            // topBarElement 不存在时说明 this.isMobile 为 true，此时不需要修改顶栏按钮样式
            topBarElement.classList.remove("toolbar__item--active");
            // topBarCommand 有可能变，所以每次都重新获取
            const topBarKeymap = this.getCustomKeymapByCommand("openSnippetsManager");
            const title = topBarKeymap ? this.i18n.pluginDisplayName + " " + this.getHotkeyDisplayText(topBarKeymap) : this.i18n.pluginDisplayName;
            topBarElement.setAttribute("aria-label", title);
        }

        // 移除事件监听
        this.removeListener(this.menu.element);
        this.menu = undefined;
        this.destroyGlobalKeyDownHandler();
    }

    /**
     * 滚动到指定的菜单项，确保其在滚动容器中可见
     * @param menuItem 要滚动到的菜单项
     */
    private scrollToMenuItem(menuItem: HTMLElement) {
        // 获取滚动容器
        const scrollContainer = this.menuItems.querySelector(".jcsm-snippets-container") as HTMLElement;
        if (!scrollContainer) return;

        // 使用 requestAnimationFrame 确保元素完全渲染后再获取位置信息
        requestAnimationFrame(() => {
            // 获取菜单项相对于滚动容器的位置信息
            const containerRect = scrollContainer.getBoundingClientRect();
            const itemRect = menuItem.getBoundingClientRect();

            // 检查位置信息是否有效（高度不为0）
            if (containerRect.height === 0 || itemRect.height === 0) {
                // 如果位置信息无效，再次尝试
                requestAnimationFrame(() => this.scrollToMenuItem(menuItem));
                return;
            }

            // 计算菜单项是否在可视区域内
            const isAbove = itemRect.top < containerRect.top;
            const isBelow = itemRect.bottom > containerRect.bottom;

            if (isAbove) {
                // 菜单项在可视区域上方，滚动到菜单项顶部
                scrollContainer.scrollTop -= (containerRect.top - itemRect.top);
            } else if (isBelow) {
                // 菜单项在可视区域下方，滚动到菜单项底部
                scrollContainer.scrollTop += (itemRect.bottom - containerRect.bottom);
            }
        });
    }

    /**
     * 菜单点击事件处理
     * @param event 鼠标事件
     */
    private menuClickHandler = async (event: MouseEvent) => {
        // 点击按钮之后默认会关闭整个菜单，这里需要阻止事件冒泡
        event.stopPropagation();
        // 不能阻止事件默认行为，否则点击 label 时无法切换 input 的选中状态
        // event.preventDefault();
        const target = event.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();

        // 移除按钮上的焦点，避免后续回车还会触发按钮。但不移除搜索输入框的焦点，让用户可以正常输入
        if (tagName === "button") target.blur();

        // 键盘操作
        if (typeof event.detail === "string") {
            this.console.log("menuClickHandler event:", event);
            if (event.detail=== "Escape") {
                // 按 Esc 关闭菜单
                this.menu.close();
            } else if (event.detail === "Enter") {
                const snippetElement = this.menuItems.querySelector(".b3-menu__item--current") as HTMLElement;
                const type = snippetElement?.dataset.type;
                if (snippetElement) {
                    if (type === "new") {
                        // 按回车新建代码片段
                        this.createSnippet();
                    } else {
                        // 按回车切换代码片段的开关状态
                        const input = snippetElement.querySelector("input[type='checkbox']") as HTMLInputElement;
                        const snippet = await this.getSnippetById(snippetElement.dataset.id);
                        if (input && snippet) {
                            input.checked = !input.checked;
                            // 在菜单上切换代码片段的开关状态要实时保存
                            snippet.enabled = input.checked;
                            this.saveSnippetsList(this.snippetsList);
                            this.updateSnippetElement(snippet);
                        }
                    }
                }
            } else if (event.detail === "ArrowUp" || event.detail === "ArrowDown") {
                // 按上下方向键切换代码片段选项
                // 获取当前代码片段类型的所有可见菜单项（排除带有 .fn__none 类的元素）
                const visibleMenuItems = Array.from(this.menuItems.querySelectorAll(`.jcsm-snippet-item[data-type="${this.snippetsType}"]:not(.fn__none)`)) as HTMLElement[];
                const currentMenuItem = this.menuItems.querySelector(".b3-menu__item--current") as HTMLElement;
                
                // 如果当前代码片段类型没有可见的 .jcsm-snippet-item 元素，则选中新建按钮
                if (visibleMenuItems.length === 0) {
                    const newSnippetButton = this.menuItems.querySelector(`.jcsm-snippet-item[data-type="new"][data-snippet-type="${this.snippetsType}"]`) as HTMLElement;
                    if (newSnippetButton) {
                        currentMenuItem?.classList.remove("b3-menu__item--current");
                        newSnippetButton.classList.add("b3-menu__item--current");
                        this.scrollToMenuItem(newSnippetButton);
                    }
                } else if (visibleMenuItems.length === 1) {
                    // 只有一个可见代码片段时，切换到该代码片段
                    currentMenuItem?.classList.remove("b3-menu__item--current");
                    visibleMenuItems[0].classList.add("b3-menu__item--current");
                    this.scrollToMenuItem(visibleMenuItems[0]);
                } else if (visibleMenuItems.length > 1) {
                    // 获取当前选中项在可见菜单项中的索引，如果没有选中项则设为 -1
                    const currentIndex = currentMenuItem ? visibleMenuItems.indexOf(currentMenuItem) : -1;
                    
                    // 根据按键方向计算新的索引
                    let newIndex: number;
                    if (event.detail === "ArrowUp") {
                        // 向上键：切换到前一个元素，如果是第一个则切换到最后一个
                        newIndex = currentIndex <= 0 ? visibleMenuItems.length - 1 : currentIndex - 1;
                    } else {
                        // 向下键：切换到后一个元素，如果是最后一个则切换到第一个
                        newIndex = currentIndex >= visibleMenuItems.length - 1 ? 0 : currentIndex + 1;
                    }
                    
                    // 移除当前选中状态
                    currentMenuItem?.classList.remove("b3-menu__item--current");
                    // 添加新的选中状态
                    visibleMenuItems[newIndex].classList.add("b3-menu__item--current");
                    
                    // 确保选中的代码片段在滚动容器中可见
                    this.scrollToMenuItem(visibleMenuItems[newIndex]);
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
                this.setMenuSnippetsType(newType);
            }
        }

        // 点击顶部
        if (target.closest(".jcsm-top-container")) {
            this.clearMenuSelection();
            
            // 切换代码片段类型
            if (tagName === "input" && target.getAttribute("name") === "jcsm-tabs") {
                const type = target.dataset.snippetType;
                this.snippetsType = type;
                this.setMenuSnippetsType(type);
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
                filteredSnippets.forEach((snippet: Snippet) => {
                    // enabled 为 true 时，snippet.enabled 也一定为 true
                    this.updateSnippetElement(snippet, enabled);
                });
            }

            // 点击顶部的按钮
            if (tagName === "button") {
                const button = target as HTMLButtonElement;
                const type = button.dataset.type;
    
                if (type === "search") {
                    // 显示或隐藏搜索输入框
                    const searchInput = this.menuItems.querySelector("input[data-action='search']") as HTMLInputElement;
                    if (this.snippetSearchType !== 0 && searchInput) {
                        const isOpen = !searchInput.classList.contains("fn__none");
                        if (isOpen) {
                            // 隐藏搜索输入框
                            target.classList.remove("jcsm-active");
                            searchInput.classList.add("fn__none");
                            searchInput.value = "";
                            // 触发冒泡的 input 事件，清空搜索结果
                            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
                        } else {
                            // 显示搜索输入框
                            target.classList.add("jcsm-active");
                            const placeholderText = this.snippetSearchType === 0 ? this.i18n.search : 
                                this.i18n[["snippetSearchTypeName", "snippetSearchTypeContent", "snippetSearchTypeNameAndContent"][this.snippetSearchType - 1]];
                            searchInput.setAttribute("placeholder", placeholderText);
                            searchInput.classList.remove("fn__none");
                            searchInput.focus();
                        }
                    }
                } else if (type === "config") {
                    // 打开设置对话框
                    this.openSetting();
                } else if (type === "reload") {
                    // 重新加载界面
                    this.reloadUI();
                } else if (type === "new") {
                    // 新建代码片段
                    this.createSnippet();
                }
            }
        }

        // 点击代码片段
        const snippetMenuItem = target.closest(".b3-menu__item") as HTMLElement;
        if (snippetMenuItem) {
            if (tagName === "button") {
                // 点击按钮
                
                // 点击按钮不会改变代码片段的开关状态，所以直接从 this.snippetsList 中获取当前代码片段
                const snippet = await this.getSnippetById(snippetMenuItem.dataset.id);
                if (snippet === undefined) {
                    // undefined 是数组中没有
                    this.showErrorMessage(this.i18n.getSnippetFailed);
                    return;
                } else if (snippet === false) {
                    // false 是调用 API 返回错误
                    return;
                }
                
                const buttonType = target.dataset.type;
                if (buttonType === "duplicate") {
                    // 创建代码片段副本
                    this.saveSnippet(snippet, true);
                } else if (buttonType === "edit") {
                    // 编辑代码片段，打开编辑对话框
                    this.openSnippetEditDialog(snippet);
                    // TODO自定义页签: 编辑页签，等其他功能稳定之后再做
                } else if (buttonType === "delete") {
                    // 删除代码片段
                    this.openSnippetDeleteDialog(snippet.name, () => {
                        // 弹窗确定后删除代码片段
                        this.deleteSnippet(snippet.id, snippet.type);
                    }); // 取消后无操作
                } else {
                    // 点击到不知道哪里的按钮，显示错误信息
                    this.showErrorMessage(this.i18n.unknownButtonType);
                }
            } else {
                // 点击非按钮的部分
                const type = snippetMenuItem.dataset.type;
                if (type === "new") {
                    // 新建代码片段
                    this.createSnippet();
                } else {
                    // 点击代码片段的菜单项
                    const checkBox = snippetMenuItem.querySelector("input") as HTMLInputElement;
                    if (target !== checkBox) {
                        // 如果点击的不是 checkBox 就手工切换开关状态
                        checkBox.checked = !checkBox.checked;
                    }
                    const snippet = await this.getSnippetById(snippetMenuItem.dataset.id);
                    if (snippet) {
                        // 在菜单上切换代码片段的开关状态要实时保存
                        snippet.enabled = checkBox.checked;
                        this.saveSnippetsList(this.snippetsList);
                        this.updateSnippetElement(snippet);
                    }
                    if (this.isMobile) {
                        // 移动端点击之后一直高亮着选项不好看，所以清除选中状态
                        this.clearMenuSelection()
                    }
                }
            }
        }
    };

    /**
     * 代码片段搜索类型
     * 0: 不搜索
     * 1: 按标题搜索
     * 2: 按代码内容搜索
     * 3: 按标题和代码内容搜索
     */
    declare snippetSearchType: number;

    /**
     * 筛选代码片段（不区分大小写）
     * @param searchText 搜索文本
     * @returns 筛选后的代码片段 ID 数组，如果禁用搜索或搜索文本为空则返回 false
     */
    private filterSnippetsIds(searchText: string): string[] | false {
        // 如果禁用搜索或搜索文本为空，返回 false，表示不搜索
        if (this.snippetSearchType === 0 || !searchText || searchText.trim() === "") {
            return false;
        }

        const normalizedText = searchText.toLowerCase().trim();

        return this.snippetsList
            .filter((snippet: Snippet) => {
                switch (this.snippetSearchType) {
                    case 1:
                        // 按标题筛选
                        return snippet.name.toLowerCase().includes(normalizedText);
                    case 2:
                        // 按代码内容筛选
                        return snippet.content.toLowerCase().includes(normalizedText);
                    case 3:
                        // 按标题和代码内容筛选
                        return (
                            snippet.name.toLowerCase().includes(normalizedText) ||
                            snippet.content.toLowerCase().includes(normalizedText)
                        );
                    default:
                        // 不支持的搜索类型，直接跳过
                        return false;
                }
            })
            .map((snippet: Snippet) => snippet.id); // 只返回 id 字符串数组
    }

    /**
     * 是否显示创建副本按钮
     */
    declare showDuplicateButton: boolean;

    /**
     * 是否显示删除按钮
     */
    declare showDeleteButton: boolean;

    /**
     * 生成代码片段列表
     * @param snippetsList 代码片段列表
     * @returns 代码片段列表 HTML 字符串
     */
    private genMenuSnippetsItems(snippetsList: Snippet[]): string {
        let snippetsHtml = "";
        snippetsList.forEach((snippet: Snippet) => {
            snippetsHtml += `
                <div class="jcsm-snippet-item b3-menu__item" data-type="${snippet.type}" data-id="${snippet.id}">
                    <span class="jcsm-snippet-name fn__flex-1" placeholder="${this.i18n.unNamed}">${snippet.name}</span>
                    <span class="fn__space"></span>
                    <button class="block__icon block__icon--show fn__flex-center${this.showDeleteButton ? "" : " fn__none"}" data-type="delete"><svg><use xlink:href="#iconTrashcan"></use></svg></button>
                    <button class="block__icon block__icon--show fn__flex-center${this.showDuplicateButton ? "" : " fn__none"}" data-type="duplicate"><svg><use xlink:href="#iconCopy"></use></svg></button>
                    <button class="block__icon block__icon--show fn__flex-center" data-type="edit"><svg><use xlink:href="#iconEdit"></use></svg></button>
                    <span class="fn__space"></span>
                    <input class="jcsm-switch b3-switch fn__flex-center" type="checkbox"${snippet.enabled ? " checked" : ""}>
                </div>
            `;
        });
        return snippetsHtml;
    };

    /**
     * 设置菜单代码片段类型
     * @param snippetType 代码片段类型
     */
    private setMenuSnippetsType(snippetType: string) {
        if (!this.isMobile) {
            this.setMenuSelection(snippetType);
        }

        // 设置该代码片段类型的全局开关状态
        const enabled = this.isSnippetsTypeEnabled(snippetType);
        const snippetsTypeSwitch = this.menuItems.querySelector(".jcsm-all-snippets-switch") as HTMLInputElement;
        snippetsTypeSwitch.checked = enabled;

        // 更新按钮提示
        this.menuItems.querySelector("button[data-type='new']")?.setAttribute("aria-label", this.i18n.add + " " + snippetType.toUpperCase());

        // 设置元素属性，通过 CSS 过滤列表
        const topContainer = this.menuItems.querySelector(".jcsm-top-container") as HTMLElement;
        topContainer?.setAttribute("data-type", snippetType);
    };

    /**
     * 设置菜单代码片段计数
     */
    private setMenuSnippetCount() {
        if (!this.menu) return;
        
        const cssCountElement = this.menuItems.querySelector(".jcsm-tab-count-css") as HTMLElement;
        const jsCountElement = this.menuItems.querySelector(".jcsm-tab-count-js") as HTMLElement;
        if (!cssCountElement || !jsCountElement) return;

        const cssCount = this.snippetsList.filter((item: Snippet) => item.type === "css").length;
        const jsCount = this.snippetsList.filter((item: Snippet) => item.type === "js").length;
        cssCountElement.textContent = cssCount > 99 ? "99+" : cssCount.toString();
        jsCountElement.textContent = jsCount > 99 ? "99+" : jsCount.toString();
    };

    /**
     * 设置菜单代码片段类型当前选中项
     * @param snippetType 代码片段类型
     */
    private setMenuSelection(snippetType: string) {
        // 移除其他选项上的 .b3-menu__item--current 类名
        this.clearMenuSelection();
        // 给首个该类型的选项添加 .b3-menu__item--current 类名；搜索时排除的选项会添加 .fn__none 类名
        const firstMenuItem = this.menuItems?.querySelector(`.b3-menu__item[data-type="${snippetType}"]:not(.fn__none)`) as HTMLElement ||
                              this.menuItems?.querySelector(`.b3-menu__item[data-type="new"][data-snippet-type="${snippetType}"]`) as HTMLElement;
        if (firstMenuItem) {
            firstMenuItem.classList.add("b3-menu__item--current");
            // 确保选中的代码片段在滚动容器中可见
            this.scrollToMenuItem(firstMenuItem);
        }
    }

    /**
     * 清除菜单选中
     */
    private clearMenuSelection() {
        this.menuItems?.querySelectorAll(".b3-menu__item--current").forEach((item: HTMLElement) => {
            item.classList.remove("b3-menu__item--current");
        });
    };

    /**
     * 重新加载界面按钮呼吸动画状态
     */
    get isReloadUIButtonBreathing() { return window.siyuan.jcsm?.isReloadUIButtonBreathing ?? false; }
    set isReloadUIButtonBreathing(value: boolean) { window.siyuan.jcsm.isReloadUIButtonBreathing = value; }
    
    /**
     * 设置重新加载界面按钮呼吸动画
     */
    private setReloadUIButtonBreathing() {
        if (this.isReloadUIButtonBreathing) return; // 如果已经设置了呼吸动画，则不重复设置
        this.isReloadUIButtonBreathing = true;

        // 如果加载插件时就开启文件监听，this.menuItems 有可能未初始化
        const reloadUIButton = this.menuItems?.querySelector(".jcsm-top-container button[data-type='reload']") as HTMLButtonElement;
        reloadUIButton?.classList.add("jcsm-breathing");
    }

    /**
     * 是否正在设置代码片段类型开关呼吸动画
     */
    private isSettingSnippetsTypeSwitchBreathing: boolean = false;

    /**
     * 设置代码片段类型开关呼吸动画
     */
    private setSnippetsTypeSwitchBreathing() {
        if (this.isSettingSnippetsTypeSwitchBreathing) return;

        const snippetsTypeSwitch = this.menuItems?.querySelector(".jcsm-all-snippets-switch") as HTMLInputElement;
        if (snippetsTypeSwitch) {
            this.isSettingSnippetsTypeSwitchBreathing = true;
            snippetsTypeSwitch.classList.add("jcsm-input-breathing--once");
            setTimeout(() => {
                snippetsTypeSwitch.classList.remove("jcsm-input-breathing--once");
                this.isSettingSnippetsTypeSwitchBreathing = false;
            }, 700); // 动画的时间是 0.7s
        }
    }

    /**
     * 设置所有打开了代码片段编辑对话框的菜单项编辑按钮高亮
     */
    private setAllSnippetsEditButtonActive() {
        const dialogs = document.querySelectorAll(`.b3-dialog--open[data-key="jcsm-snippet-dialog"]`);
        dialogs.forEach((dialog: HTMLElement) => {
            this.setSnippetEditButtonActive(dialog.dataset.snippetId);
        });
    }

    /**
     * 设置代码片段菜单项编辑按钮高亮
     * @param snippetId 代码片段 ID
     */
    private setSnippetEditButtonActive(snippetId: string) {
        if (!snippetId) return;

        const editButton = this.menuItems?.querySelector(`.jcsm-snippet-item[data-id='${snippetId}'] button[data-type='edit']`) as HTMLButtonElement;
        editButton?.classList.add("jcsm-active");
    }

    /**
     * 移除代码片段菜单项编辑按钮高亮
     * @param snippetId 代码片段 ID
     */
    private removeSnippetEditButtonActive(snippetId: string) {
        if (!snippetId) return;

        const editButton = this.menuItems?.querySelector(`.jcsm-snippet-item[data-id='${snippetId}'] button.jcsm-active[data-type='edit']`) as HTMLButtonElement;
        editButton?.classList.remove("jcsm-active");
    }


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
     * 创建代码片段
     */
    private createSnippet() {
        const snippet: Snippet = {
            id: this.genNewSnippetId(),
            name: "",
            type: this.snippetsType as "css" | "js",
            enabled: this.newSnippetEnabled,
            content: "",
        };
        // 不直接添加代码片段
        // this.saveSnippet(snippet);
        this.openSnippetEditDialog(snippet, true);
    }

    /**
     * 保存代码片段（添加或更新）
     * @param snippet 代码片段
     * @param isCopy 是否为复制操作
     */
    private async saveSnippet(snippet: Snippet, isCopy: boolean = false) {
        this.console.log("saveSnippet: snippet", snippet);

        let hasChanges = false, copySnippet: Snippet;
        if (isCopy) {
            // 使用结构化克隆深拷贝 snippet 对象，避免副本和原对象引用同一内存
            if (typeof structuredClone === "function") {
                copySnippet = structuredClone(snippet);
            } else {
                // 不支持 structuredClone 则回退到 JSON 方法
                copySnippet = JSON.parse(JSON.stringify(snippet));
            }
            // 生成新的代码片段
            copySnippet.id = this.genNewSnippetId();
            copySnippet.name = snippet.name + ` (${this.i18n.duplicate} ${new Date().toLocaleString()})`;

            // 把副本创建在当前代码片段的上面
            this.snippetsList.splice(this.snippetsList.indexOf(snippet), 0, copySnippet);
            hasChanges = true;

            this.console.log("saveSnippet: copySnippet", copySnippet);
        } else {
            // 在 snippetsList 中查找是否存在该代码片段
            const oldSnippet = await this.getSnippetById(snippet.id);
            if (oldSnippet && !isCopy) {
                // 如果存在，则更新该代码片段
                // 比较对象属性值而不是对象引用
                hasChanges = oldSnippet.name    !== snippet.name    ||
                            oldSnippet.content !== snippet.content ||
                            oldSnippet.enabled !== snippet.enabled;
                if (hasChanges) {
                    this.snippetsList = this.snippetsList.map((s: Snippet) => s.id === snippet.id ? snippet : s);
                }
            } else {
                if (snippet.type === "css") {
                    // CSS 插入到开头
                    this.snippetsList.unshift(snippet);
                } else {
                    // 如果不存在或者 API 调用出错，则找到第一个相同类型的代码片段，插入到它的前面。要保证 CSS 在前，JS 在后
                    const firstSameTypeSnippet = this.snippetsList.find((s: Snippet) => s.type === snippet.type);
                    if (firstSameTypeSnippet) {
                        this.snippetsList.splice(this.snippetsList.indexOf(firstSameTypeSnippet), 0, snippet);
                    } else {
                        // 如果不存在 JS 代码片段，则直接插入到末尾
                        this.snippetsList.push(snippet);
                    }
                }
                hasChanges = true;
            }
        }

        if (hasChanges) {
            // 代码片段发生变更才推送更新
            this.saveSnippetsList(this.snippetsList);
        }
        this.setMenuSnippetCount();
        // 添加的代码片段有可能未启用，所以 updateSnippetElement() 不传入 enabled === true 的参数
        // 问题案例: 先禁用整体状态，再在对话框中启用，然后预览，然后保存。会在整体禁用的情况下启用代码片段，或者说没有移除预览时添加的元素
        //  应该始终执行 updateSnippetElement
        this.updateSnippetElement(copySnippet ?? snippet);
        this.applySnippetUIChange(snippet, true, copySnippet);
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
        if (snippet === undefined) {
            this.showErrorMessage(this.i18n.getSnippetFailed);
            return;
        } else if (snippet === false) {
            return;
        }
        this.snippetsList = this.snippetsList.filter((snippet: Snippet) => snippet.id !== id);
        this.saveSnippetsList(this.snippetsList);
        this.setMenuSnippetCount();
        // 删除的代码片段一定需要移除元素，所以 updateSnippetElement() 传入 enabled === false 的参数
        this.updateSnippetElement(snippet, false);
        this.applySnippetUIChange(snippet, false);
    };

    /**
     * 应用代码片段 UI 变更
     * @param snippet 代码片段
     * @param isAddOrUpdate 是否为添加或更新
     * @param copySnippet 副本代码片段
     */
    private applySnippetUIChange(snippet: Snippet, isAddOrUpdate: boolean, copySnippet?: Snippet) {
        const snippetMenuItem = this.menuItems?.querySelector(`.jcsm-snippet-item[data-id="${snippet.id}"]`) as HTMLElement;
        const dialog = document.querySelector(`.b3-dialog--open[data-key="jcsm-snippet-dialog"][data-snippet-id="${snippet.id}"]`) as HTMLDivElement;
        let deleteButton, previewButton, confirmButton;
        if (dialog && !copySnippet) {
            // 创建代码片段副本时不需要更新原始代码片段的 Dialog 的按钮
            deleteButton = dialog.querySelector(`.jcsm-dialog .jcsm-dialog-container button[data-action="delete"]`) as HTMLButtonElement;
            previewButton = dialog.querySelector(`.jcsm-dialog .b3-dialog__action button[data-action="preview"]`) as HTMLButtonElement;
            confirmButton = dialog.querySelector(`.jcsm-dialog .b3-dialog__action button[data-action="confirm"]`) as HTMLButtonElement;
        }
        // 应用代码片段变更，修改相关的元素
        if (isAddOrUpdate) {
            // 打开菜单时才需要修改菜单项
            if (this.menu) {
                if (snippetMenuItem) {
                    // 有菜单项
                    if (copySnippet) {
                        // 在指定菜单项的上方插入新的副本菜单项
                        const snippetsHtml = this.genMenuSnippetsItems([copySnippet]);
                        snippetMenuItem.insertAdjacentHTML("beforebegin", snippetsHtml);
                    } else {
                        // 更新菜单项
                        const nameElement = snippetMenuItem.querySelector(".jcsm-snippet-name") as HTMLElement;
                        if (nameElement) nameElement.textContent = snippet.name;
                        const switchElement = snippetMenuItem.querySelector("input") as HTMLInputElement;
                        if (switchElement) switchElement.checked = snippet.enabled;
                    }
                } else {
                    // 没有菜单项，在菜单项列表的顶部插入新的菜单项
                    const snippetsHtml = this.genMenuSnippetsItems([snippet]);
                    this.menuItems.querySelector(".jcsm-snippets-container")?.insertAdjacentHTML("afterbegin", snippetsHtml);
                }
            }

            // 修改对应的 Dialog
            deleteButton?.classList.remove("fn__none"); // 显示删除按钮
            if (confirmButton) confirmButton.textContent = this.i18n.save; // 将“新建”按钮的文案改为“保存”
        } else {
            // 移除菜单项
            snippetMenuItem?.remove();

            // 修改对应的 Dialog
            deleteButton?.classList.add("fn__none"); // 隐藏删除按钮
            if (confirmButton) confirmButton.textContent = this.i18n.new; // 将“保存”按钮的文案改为“新建”
        }
    }

    /**
     * 根据 ID 获取代码片段（副作用是更新 this.snippetsList ）
     * @param id 代码片段 ID
     * @returns 代码片段 | false
     */
    private async getSnippetById(id: string): Promise<Snippet | false> {
        const snippetsList = await this.getSnippetsList();
        if (snippetsList) {
            this.snippetsList = snippetsList;
            return this.snippetsList.find((snippet: Snippet) => snippet.id === id);
        } else {
            return false;
        }
    }

    /**
     * 获取代码片段列表
     * @returns 代码片段列表 | false
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
     * 保存代码片段列表（参考思源本体 app/src/config/util/snippets.ts ）
     * @param snippetsList 代码片段列表
     */
    private saveSnippetsList(snippetsList: Snippet[]) {
        this.console.log("saveSnippetsList", snippetsList);
        fetchPost("/api/snippet/setSnippet", {snippets: snippetsList}, (response) => {
            // 增加错误处理
            if (response.code !== 0) {
                this.showErrorMessage(this.i18n.saveSnippetsListFailed + " [" + response.msg + "]");
                return;
            }
        });
    };

    /**
     * 更新代码片段元素（添加、更新、删除、启用、禁用、全局启用、全局禁用）
     * @param snippet 代码片段
     * @param enabled 是否启用
     * @param previewState 为 true 时是预览操作；为 false 时是退出预览操作，需要恢复原始元素
     */
    private updateSnippetElement(snippet: Snippet, enabled?: boolean, previewState?: boolean) {
        if (!snippet) {
            this.showErrorMessage(this.i18n.updateSnippetElementParamError);
            return;
        }
        if (previewState === undefined && this.realTimePreview && document.querySelector(`.b3-dialog--open[data-key="jcsm-snippet-dialog"][data-snippet-id="${snippet.id}"]`)) {
            // 如果开启了实时预览，并且打开了对应的代码片段对话框，则在菜单项上开关代码片段的操作需要忽略
            // 问题案例：全局禁用 CSS，预览一个 CSS 片段，启用片段，在菜单禁用片段会导致预览元素被移除
            //  这是因为从菜单关闭时没有 previewState 参数，此时需要通过是否有实时预览中的代码片段对话框来判断
            return;
        }

        const elementId = `snippet${snippet.type === "css" ? "CSS" : "JS"}${snippet.id}`;
        const element = document.getElementById(elementId);

        // ?? 空值合并运算符，当左侧值为 null 或 undefined 时返回右侧值，此处优先使用 enabled 的值
        const isEnabled = enabled ?? snippet.enabled;
        const isSnippetsTypeEnabled = this.isSnippetsTypeEnabled(snippet.type);

        if (isEnabled && (isSnippetsTypeEnabled || previewState)) {
            // 代码片段需要启用 && （该代码片段对应的类型是启用状态 || 正在预览该代码片段）→ 则添加新元素
            if (element && element.innerHTML === snippet.content) {
                // 如果要添加的代码片段与原来的一样，就忽略
            } else {
                this.console.log("updateSnippetElement: remove old element:", element);
                element?.remove();
                let newElement;
                if (snippet.type === "css") {
                    newElement = document.createElement("style");
                    newElement.id = elementId;
                    newElement.textContent = snippet.content;
                    document.head.appendChild(newElement);
                } else if (snippet.type === "js") {
                    newElement = document.createElement("script");
                    newElement.id = elementId;
                    newElement.type = "text/javascript";
                    // 思源的代码使用 .text ，这与 .textContent 是等效的，参考：https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement/text https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
                    newElement.textContent = snippet.content;
                    document.head.appendChild(newElement);
                }
                this.console.log("updateSnippetElement: add new element:", newElement);
            }
        } else {
            // else 分支等效于 !isEnabled || (!isSnippetsTypeEnabled && !previewState)
            // 禁用 || (全局禁用 && 不是正在预览) → 则移除旧元素
            this.console.log("updateSnippetElement: remove disabled element:", element);
            element?.remove();
        }

        if (previewState === undefined && isEnabled && this.menu && snippet.type === this.snippetsType && !this.isSnippetsTypeEnabled(snippet.type)) {
            // 如果当前的操作是在非预览状态下、开启代码片段、开启了菜单、菜单上显示的是这个类型的代码片段、这个类型的代码片段是关闭状态 → 全局开关闪烁一下
            this.setSnippetsTypeSwitchBreathing();
        }

        // 需要弹出消息提示的情况：
        // 1. 修改：有旧代码 && 旧代码有效 && （新代码有效 || 新代码无效）等效于有新代码
        // 2. 删除：有旧代码 && 旧代码有效 && 没有新代码
        // 3. 禁用：有旧代码 && 旧代码有效 && 没有新代码
        // 以上合并为：有旧代码 && 旧代码有效 → 本质上是旧 JS 被修改/删除/禁用时无法立即生效
        if (snippet.type === "js" && element && element.innerHTML && this.isValidJavaScriptCode(element.innerHTML)) {
            // JS 代码片段元素更新需要弹出消息提示
            this.showNotification("reloadUIAfterModifyJS", 2000);
            // 高亮菜单上的重新加载界面按钮
            this.setReloadUIButtonBreathing();
        }
    };

    /**
     * 简单判断内容是否为有效的 JavaScript 代码
     * @param code 代码
     * @returns 是否为有效的 JavaScript 代码
     */
    private isValidJavaScriptCode(code: string): boolean {
        code = code.trim();
        if (code === "") return false;
        // 使用 acorn 解析代码，判断是否为有效的 JavaScript 代码
        try {
            // https://github.com/acornjs/acorn/tree/master/acorn/
            const ast = acornParse(code, { ecmaVersion: 'latest' }) as any;
            const length = ast.body.length;
            if (length === 0) {
                return false;
            } else if (
                length === 1 &&                            // 代码只包含一个顶级语句或表达式
                ast.body[0].type === 'ExpressionStatement' // 代码是一行表达式
            ) {
                const type = ast.body[0].expression.type;
                if (
                    type === 'Literal' ||          // 字面量（Literal）是值本身，比如数字、字符串、布尔值等。只有一个值，没有其他语法结构
                    type === 'Identifier' ||       // 标识符（Identifier）是变量名、函数名等标识。只是引用一个变量，没有做赋值、调用、声明等操作
                    type === 'MemberExpression' || // 成员表达式（MemberExpression）是访问对象属性的表达式，比如 obj.prop 或 arr[index]
                    type === 'ThisExpression' ||   // 懒得写注释了
                    type === 'Super' ||
                    type === 'ArrayExpression' ||
                    type === 'ObjectExpression' ||
                    type === 'TemplateLiteral' ||
                    type === 'FunctionExpression' ||
                    type === 'ArrowFunctionExpression' ||
                    type === 'UpdateExpression' ||
                    type === 'UnaryExpression' ||
                    type === 'BinaryExpression' ||
                    type === 'LogicalExpression' ||
                    type === 'ConditionalExpression' ||
                    // 立即执行函数是这个类型，需要排除 type === 'CallExpression' ||
                    type === 'NewExpression' ||
                    type === 'SequenceExpression'
                ) {
                    return false;
                }
            }
            return true;
        } catch {
            return false;
        }
    }


    // ================================ 对话框相关 ================================

    // dialog.destroy 还能传递参数，看看这个写法能不能用上
    // dialog.destroy({cancel: "true"});

    /**
     * 生成代码片段编辑对话框
     * @param snippet 代码片段
     * @param confirmText 确认按钮的文案
     * @returns 代码片段编辑对话框 HTML 字符串
     */
    private genSnippetEditDialog(snippet: Snippet, confirmText: string = this.i18n.save): string {
        // TODO功能: 在删除按钮左边加一个创建副本按钮（始终显示），点击之后创建副本（不直接保存，是新建的代码片段，需要手动点击保存按钮）并且打开编辑对话框
        return `
            <div class="jcsm-dialog">
                <div class="jcsm-dialog-header resize__move"></div>
                <div class="jcsm-dialog-container">
                    <div class="fn__flex">
                        <input class="jcsm-dialog-name fn__flex-1 b3-text-field" spellcheck="false" placeholder="${this.i18n.title}"}">
                        <div class="fn__space"></div>
                        <button data-action="delete" class="block__icon block__icon--show ariaLabel fn__none" aria-label="${this.i18n.deleteSnippet}" data-position="north">
                            <svg><use xlink:href="#iconTrashcan"></use></svg>
                        </button>
                        <div class="fn__space"></div>
                        <input data-type="snippetSwitch" class="b3-switch fn__flex-center" type="checkbox"${snippet.enabled ? " checked" : ""}>
                    </div>
                    <div class="fn__hr"></div>
                    <div class="jcsm-dialog-content"></div>
                    <div class="fn__hr--b"></div>
                </div>
                <div class="b3-dialog__action">
                    <button data-action="cancel" class="b3-button b3-button--cancel">${this.i18n.cancel}</button>
                    <div class="fn__space"></div>
                    <button data-action="preview" class="b3-button b3-button--text${snippet.type === "js" || this.realTimePreview ? " fn__none" : ""}">${this.i18n.preview}</button>
                    <div class="fn__space"></div>
                    <button data-action="confirm" class="b3-button b3-button--text">${confirmText}</button>
                </div>
            </div>
        `;
    };

    /**
     * 编辑器缩进单位
     */
    declare editorIndentUnit: string;

    /**
     * 获取编辑器缩进单位
     * @returns 缩进单位字符串
     */
    private getEditorIndentUnit(): string {
        const indentUnitConfig = this.editorIndentUnit;
        
        if (indentUnitConfig.startsWith("tab")) {
            // 制表符配置
            const tabCount = parseInt(indentUnitConfig.replace("tab", ""));
            return "\t".repeat(tabCount);
        } else if (indentUnitConfig.startsWith("space")) {
            // 空格配置
            const spaceCount = parseInt(indentUnitConfig.replace("space", ""));
            return " ".repeat(spaceCount);
        } else {
            // indentUnitConfig === "followSiyuan" 或者 indentUnitConfig 是其他值
            const SiyuanCodeTabSpaces = window.siyuan.config.editor.codeTabSpaces;
            if (SiyuanCodeTabSpaces && typeof SiyuanCodeTabSpaces === "number" && SiyuanCodeTabSpaces >= 0) {
                // 跟随思源设置
                return SiyuanCodeTabSpaces === 0 ? "\t" : " ".repeat(SiyuanCodeTabSpaces);
            } else {
                // 默认缩进单位为两个空格
                return " ".repeat(2);
            }
        }
    }

    /**
     * 创建编辑器扩展配置
     * @param theme 主题配置
     * @param language 语言类型
     * @returns 编辑器扩展数组
     */
    private createEditorExtensions(theme: any, language: string) {
        // 根据语言类型设置占位符
        const placeholderText = language === "js" ? this.i18n.codeSnippetJS : this.i18n.codeSnippetCSS;
        // 根据语言类型选择相应的语言支持
        const languageSupport = language === "js" ? javascript() : css();
        // 根据插件设置获取缩进单位
        const indentUnitText = this.getEditorIndentUnit();
        
        return [
            // 显示行号
            lineNumbers(),
            // 标记特殊字符（不可打印或其他令人困惑的字符）
            highlightSpecialChars(),
            // 占位符
            placeholder(placeholderText),
            // 启用撤销/重做历史记录
            history(),
            // 显示代码折叠图标
            foldGutter(),
            // 绘制文本选择区域
            drawSelection(),
            // 显示拖拽光标（从其他地方拖入编辑器）
            dropCursor(),
            // 允许多重选择
            EditorState.allowMultipleSelections.of(true),
            // 输入时自动缩进
            indentOnInput(),
            // 启用语法高亮，使用默认高亮样式
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            // 高亮匹配的括号
            bracketMatching(),
            // 自动闭合括号
            closeBrackets(),
            // 启用自动完成功能
            // TODO考虑: 默认的补全关键词太少了，还不如没有。等之后再手工添加补全关键词
            // autocompletion(),
            // 启用矩形选择模式
            rectangularSelection(),
            // 显示十字光标
            crosshairCursor(),
            // 高亮当前活动行
            highlightActiveLine(),
            // 高亮所有匹配的选中文本
            highlightSelectionMatches(),
            // 设置缩进单位为两个空格
            indentUnit.of(indentUnitText),
            // 配置快捷键映射
            keymap.of([
                // 括号闭合快捷键
                ...closeBracketsKeymap,
                // 默认快捷键（复制、粘贴、删除等）
                ...defaultKeymap,
                // 搜索快捷键
                ...searchKeymap,
                // 历史记录快捷键（撤销、重做）
                ...historyKeymap,
                // 代码折叠快捷键
                ...foldKeymap,
                // 自动完成快捷键
                // ...completionKeymap,
                // Tab 键缩进快捷键
                indentWithTab,
            ]),
            // 启用语言支持
            languageSupport,
            // 应用主题
            theme,
        ];
    }

    /**
     * 创建代码片段编辑器
     * @param container 容器元素
     * @param content 初始内容
     * @param language 语言类型
     * @returns 编辑器视图
     */
    private createCodeMirrorEditor(container: HTMLElement, content: string, language: string): EditorView {
        const theme = window.siyuan.config.appearance.mode === 0 ? vscodeLight : vscodeDark;
        
        // 创建编辑器状态
        const state = EditorState.create({
            doc: content,
            extensions: this.createEditorExtensions(theme, language),
        });

        // 创建编辑器视图
        const view = new EditorView({
            state,
            parent: container
        });

        // 将编辑器实例存储到 DOM 元素上，以便后续主题切换时能够找到
        (view.dom as any).cmView = view;

        return view;
    }

    /**
     * 启动主题模式监听
     */
    private startThemeModeWatch() {
        // 如果已经启动了监听，则不重复启动
        if (window.siyuan.jcsm?.themeObserver) return;

        // 存储上一次的主题模式，用于比较是否有变化
        let lastThemeMode = window.siyuan.config.appearance.mode;
        
        // 使用 MutationObserver 监听 :root 元素的 data-theme-mode 属性变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme-mode') {
                    this.console.log("themeModeChangeHandler: mutation", mutation);
                    
                    // 检查主题模式是否有变化
                    const currentThemeMode = window.siyuan.config.appearance.mode;
                    if (currentThemeMode !== lastThemeMode) {
                        this.console.log(`Theme mode changed: ${lastThemeMode} -> ${currentThemeMode}`);
                        lastThemeMode = currentThemeMode;
                        
                        // 更新所有打开的代码片段编辑对话框中的编辑器主题
                        this.updateAllEditorConfigs("theme");
                    }
                }
            });
        });
        
        // 开始监听 :root 元素的属性变化
        const rootElement = document.querySelector(":root");
        if (rootElement) {
            observer.observe(rootElement, {
                attributes: true,
                attributeFilter: ['data-theme-mode']
            });
            
            // 将 observer 存储到全局变量中
            if (!window.siyuan.jcsm) window.siyuan.jcsm = {};
            window.siyuan.jcsm.themeObserver = observer;
            
            this.console.log("startThemeModeWatch: theme mode watch started");
        }
    }

    /**
     * 停止主题模式监听
     */
    private stopThemeModeWatch() {
        if (window.siyuan.jcsm?.themeObserver) {
            window.siyuan.jcsm.themeObserver.disconnect();
            delete window.siyuan.jcsm.themeObserver;
            this.console.log("stopThemeModeWatch: theme mode watch stopped");
        }
    }

    /**
     * 检查是否有编辑器对话框打开
     * @returns 是否存在打开的编辑器对话框
     */
    private hasEditorDialogsOpen(): boolean {
        return document.querySelectorAll('.b3-dialog--open[data-key="jcsm-snippet-dialog"]').length > 0;
    }

    /**
     * 检查并管理主题模式监听状态
     * @param isOpen 是否正在打开编辑器对话框
     */
    private checkAndManageThemeWatch(isOpen: boolean = false) {
        const hasDialog = isOpen || this.hasEditorDialogsOpen();
        const hasObserver = !!window.siyuan.jcsm?.themeObserver;
        this.console.log("checkAndManageThemeWatch: hasDialog", hasDialog, ", hasObserver", hasObserver);

        if (hasDialog && !hasObserver) {
            // 有对话框但没有监听器，启动监听
            this.startThemeModeWatch();
        } else if (!hasDialog && hasObserver) {
            // 没有对话框但有监听器，停止监听
            this.stopThemeModeWatch();
        }
        // 不关心其他情况
    }

    /**
     * 更新所有打开的代码片段编辑对话框中的编辑器配置
     * @param reason 更新原因，用于日志记录
     */
    private updateAllEditorConfigs(reason: string = "config") {
        // 获取所有打开的代码片段编辑对话框
        const snippetDialogs = document.querySelectorAll('.b3-dialog--open[data-key="jcsm-snippet-dialog"]');
        snippetDialogs.forEach((dialogElement) => {
            const contentContainer = dialogElement.querySelector('.jcsm-dialog-content') as HTMLElement;
            if (!contentContainer) return;
            
            // 查找现有的 CodeMirror 编辑器 DOM 元素
            const existingEditorElement = contentContainer.querySelector('.cm-editor');
            if (!existingEditorElement) return;
            
            // 获取当前编辑器实例 - 通过 DOM 元素查找对应的 EditorView
            const editorView = (existingEditorElement as any).cmView as EditorView;
            if (!editorView) {
                this.console.warn("updateAllEditorConfigs: editorView not found, recreating editor:", reason);
                this.recreateEditor(dialogElement, contentContainer);
                return;
            }
            
            // 获取当前主题模式
            const currentThemeMode = window.siyuan.config.appearance.mode;
            const newTheme = currentThemeMode === 0 ? vscodeLight : vscodeDark;
            
            // 获取当前编辑器状态
            const currentState = editorView.state;
            
            // 创建新的编辑器状态，保留文档内容和选择状态
            const snippetType = dialogElement.getAttribute('data-snippet-type') || 'css';
            const newState = EditorState.create({
                doc: currentState.doc,
                extensions: this.createEditorExtensions(newTheme, snippetType),
            });
            
            // 更新编辑器状态，保留滚动位置和光标位置
            editorView.setState(newState);
            
            this.console.log("updateAllEditorConfigs: editor:", reason, "updated:", dialogElement);
        });
    }
    
    /**
     * 重新创建编辑器（当无法找到 EditorView 实例时使用）
     * @param dialogElement 对话框元素
     * @param contentContainer 内容容器
     */
    private recreateEditor(dialogElement: Element, contentContainer: HTMLElement) {
        this.console.log("recreateEditor: dialogElement", dialogElement, ", contentContainer", contentContainer);
        // 获取当前编辑器内容
        const existingEditorElement = contentContainer.querySelector('.cm-editor');
        if (!existingEditorElement) return;
        
        const codeLines = existingEditorElement.querySelectorAll('.cm-line');
        let currentContent = '';
        if (codeLines.length > 0) {
            // 从 CodeMirror 的 DOM 结构中提取文本内容
            currentContent = Array.from(codeLines)
                .map(line => line.textContent || '')
                .join('\n');
        } else {
            this.console.error("recreateEditor: no code lines found, return");
            return;
        }
        
        const snippetType = dialogElement.getAttribute('data-snippet-type') || 'css';
        
        // 清空容器
        contentContainer.innerHTML = '';
        
        // 重新创建编辑器
        this.createCodeMirrorEditor(contentContainer, currentContent, snippetType);
        
        this.console.log(`recreateEditor: editor recreated: ${dialogElement}`);
    }

    /**
     * 打开代码片段编辑对话框
     * @param snippet 代码片段
     * @param isNew 是否为新建代码片段
     * @returns 是否成功打开对话框
     */
    private async openSnippetEditDialog(snippet: Snippet, isNew?: boolean): Promise<boolean> {
        if (this.getAllModalDialogElements().length > 0) return false;

        // 检查参数
        const paramError: string[] = [];
        if (!snippet) {
            paramError.push(this.i18n.snippet);
        } else {
            if (!snippet.id) {
                paramError.push(this.i18n.snippetId);
            }
            if (!snippet.type) {
                paramError.push(this.i18n.snippetType);
            }
        }
        if (paramError.length > 0) {
            this.showErrorMessage(this.i18n.snippetDialogParamError + "[" + paramError.join(", ") + "]");
            return false;
        }

        // 给对应的菜单项的编辑按钮添加背景色
        this.setSnippetEditButtonActive(snippet.id);
        
        // 如果已经有打开的对应 snippetId 的 Dialog，则仅激活它，不重复创建
        const existedDialog = document.querySelector(`.b3-dialog--open[data-key="jcsm-snippet-dialog"][data-snippet-id="${snippet.id}"]`) as HTMLDivElement;
        if (existedDialog) {
            this.moveElementToTop(existedDialog);
            return true;
        }

        // 创建 Dialog
        const dialog = new Dialog({
            content: this.genSnippetEditDialog(snippet, isNew ? this.i18n.new : undefined),
            width: this.isMobile ? "92vw" : "70vw",
            height: "80vh",
            hideCloseIcon: this.isMobile,
        });
        // 备注：dialog.destroy() 方法会导致菜单被关闭，需要时使用重新实现的 removeDialog()

        // 设置 Dialog 属性
        dialog.element.setAttribute("data-key", "jcsm-snippet-dialog");
        dialog.element.setAttribute("data-snippet-id", snippet.id);
        dialog.element.setAttribute("data-snippet-type", snippet.type);
        dialog.element.setAttribute("data-modal", "false"); // 标记为非模态对话框

        if (!isNew) {
            // 非新建代码片段时，显示删除按钮
            const deleteButton = dialog.element.querySelector("button[data-action='delete']") as HTMLButtonElement;
            deleteButton?.classList.remove("fn__none");
        }

        if (!this.isMobile) {
            // 桌面端支持同时打开多个 Dialog，需要设置 Dialog 样式
            dialog.element.style.zIndex = (++window.siyuan.zIndex).toString();
            dialog.element.querySelector(".b3-dialog__scrim")?.remove();
            const dialogElement = dialog.element.querySelector(".b3-dialog") as HTMLElement;
            dialogElement.style.width = "0";
            dialogElement.style.height = "0";
            dialogElement.style.left = "50vw";
            dialogElement.style.top = "50vh";
            const dialogContainer = dialogElement.querySelector(".b3-dialog__container") as HTMLElement;
            dialogContainer.style.position = "fixed";
        }

        // 检查并启动主题模式监听（在第一个编辑器对话框打开时）
        this.checkAndManageThemeWatch(true);

        // 设置代码片段标题和内容
        const nameElement = dialog.element.querySelector(".jcsm-dialog-name") as HTMLInputElement; // 标题不允许输入换行，所以得用 input 元素，textarea 元素没法在操作能 Ctrl+Z 撤回的前提下阻止用户换行
        nameElement.value = snippet.name;
        nameElement.focus();
        
        // 创建 CodeMirror 编辑器
        const contentContainer = dialog.element.querySelector(".jcsm-dialog-content") as HTMLElement;
        const codeMirrorView = this.createCodeMirrorEditor(contentContainer, snippet.content, snippet.type);
        // codeMirrorView.contentDOM.focus();
        
        const switchInput = dialog.element.querySelector("input[data-type='snippetSwitch']") as HTMLInputElement;
        // switchInput.checked = snippet.enabled; // genSnippetDialog 的时候已经添加了 enabled 属性，这里不需要重复设置
        
        // 取消编辑代码片段
        const cancelHandler = async () => {
            const cancel = () => {
                if (snippet.type === "css") {
                    // 更新 CSS 代码片段元素，恢复预览 CSS 代码片段时的变更
                    this.updateSnippetElement(snippet, undefined, false);
                }
                // 关闭 Dialog
                this.closeDialogByElement(dialog.element);
            }

            const currentSnippet = await this.getSnippetById(snippet.id);
            if (currentSnippet === undefined) {
                // 如果当前代码片段不存在，说明是在“取消新建代码片段”
                // 如果没有填任何内容，则直接关闭 Dialog
                if (nameElement.value.trim() === "" && codeMirrorView.state.doc.toString().trim() === "") {
                    cancel();
                    return;
                } else {
                    // 如果填了内容，则弹窗提示确认
                    this.openSnippetCancelDialog(snippet, true, undefined, () => {
                        cancel();
                    });
                    return;
                }
            } else if (currentSnippet === false) {
                // API 调用失败，无法确认是否存在更改，直接关闭 Dialog
                cancel();
                return;
            }

            let changes = [];
            // 用当前实际的状态来跟对话框中的内容来对比，而不是用对话框的初始 snippet 对象（比如在菜单修改了开关，但对话框的初始 snippet 对象不会同步更新）
            if (currentSnippet.name !== nameElement.value) {
                changes.push(this.i18n.snippetName);
            }
            if (currentSnippet.content !== codeMirrorView.state.doc.toString()) {
                changes.push(this.i18n.snippetContent);
            }
            if (currentSnippet.enabled !== switchInput.checked) {
                changes.push(this.i18n.snippetEnabled);
            }

            if (changes.length > 0) {
                // 有变更，弹窗提示确认
                this.openSnippetCancelDialog(snippet, false, changes, () => {
                    cancel();
                }); // 取消后无操作
                return;
            } else {
                // 没有变更
                cancel();
            }
        }
        // CSS 代码片段预览
        const previewHandler = () => {
            this.console.log("Handle CSS preview");
            if (snippet.type !== "css") {
                this.showErrorMessage(this.i18n.realTimePreviewHandlerFunctionError);
                return;
            }
            this.console.log("previewHandler: codeMirrorView.state.doc.toString()", codeMirrorView.state.doc.toString());
            const previewSnippet: Snippet = {
                id: snippet.id,
                name: "",
                type: "css",
                enabled: switchInput.checked,
                content: codeMirrorView.state.doc.toString(),
            };
            // 只更新代码片段元素，不保存代码片段 this.saveSnippet(snippet);
            this.updateSnippetElement(previewSnippet, undefined, true);
        }
        // 新建或更新代码片段
        const saveHandler = () => {
            snippet.name = nameElement.value;
            snippet.content = codeMirrorView.state.doc.toString();
            snippet.enabled = switchInput.checked;
            this.saveSnippet(snippet);
            this.closeDialogByElement(dialog.element);
        }

        const isOnlyCtrl = (event: KeyboardEvent) => event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;

        // 处理标题区跳转和 Ctrl+Enter 保存
        this.addListener(dialog.element, "keydown", (event: KeyboardEvent) => {
            this.console.log("snippetEditDialog keydown", event);
            const target = event.target as HTMLElement;
            if (target === nameElement) {
                // 在标题中按键
                if (event.key === "Enter" || event.key === "Tab") {
                    event.preventDefault();
                    codeMirrorView.contentDOM.focus();
                }
            } else if (target === codeMirrorView.contentDOM) {
                // 在代码编辑器中按键
                if (isOnlyCtrl(event) && event.key === "Enter") {
                    // 按 Ctrl+Enter 键执行“保存”操作
                    event.preventDefault();
                    saveHandler();
                }
            }
        }, {capture: true}); // 需要在捕获阶段阻止冒泡，否则按 Ctrl+Enter 会先输入一个换行

        this.addListener(dialog.element, "keydown", (event: KeyboardEvent | CustomEvent) => {
            const target = event.target as HTMLElement;
            if (target === codeMirrorView.contentDOM) {
                // 在代码编辑器中按键
                if (isOnlyCtrl((event as KeyboardEvent)) && (event as KeyboardEvent).key === "f") {
                    // 按 Ctrl+F 搜索时阻止冒泡，否则会呼出思源的搜索
                    event.stopPropagation();
                }
            }
            // 监听输入框内容变化，实时预览
            // 用了代码编辑器之后，按 Backspace、Ctrl+X 等操作都监听不到 input 事件，所以改成监听 keydown 事件
            if (snippet.type === "css" && this.realTimePreview) {
                const isDispatch = typeof (event as CustomEvent).detail === "string";
                // 仅在代码编辑器区域内按键或自定义事件触发时处理实时预览
                if (target === codeMirrorView.contentDOM || (isDispatch && (event as CustomEvent).detail === "realTimePreview")) {
                    setTimeout(() => {
                        previewHandler();
                    }, 0); // 等待符号键入完成
                }
            }
        }); // 不能在捕获阶段处理，否则 Ctrl+F 不会被编辑器处理、codeMirrorView.state.doc.toString() 会获取到编辑之前的内容

        this.addListener(dialog.element, "wheel", (event) => {
            // 阻止冒泡，否则当菜单打开时，输入框无法使用鼠标滚轮滚动
            event.stopPropagation();
        }, {passive: true});

        this.addListener(dialog.element, "mousedown", () => {
            // 点击 Dialog 时要显示在最上层
            this.moveElementToTop(dialog.element);
            // 移除菜单上的 b3-menu__item--current，否则 this.globalKeyDownHandler() 会操作菜单
            this.clearMenuSelection();
        });
        
        // 在菜单打开的情况下，移动端无法上下划动对话框中的编辑器，需要阻止事件冒泡
        this.addListener(dialog.element, "touchmove", (event: TouchEvent) => {
            event.stopPropagation();
        }, {passive: true});

        const closeElement = dialog.element.querySelector(".b3-dialog__close") as HTMLElement;
        const scrimElement = dialog.element.querySelector(".b3-dialog__scrim") as HTMLElement;
        // 代码片段编辑对话框的 .b3-dialog__scrim 元素只在桌面端被移除，移动端还是有的，所以要处理点击
        
        this.addListener(dialog.element, "click", async (event: Event) => {
            // 阻止冒泡，否则点击 Dialog 时会导致 menu 关闭
            event.stopPropagation();
            const target = event.target as HTMLElement;
            const tagName = target.tagName.toLowerCase();
            if (tagName === "input" && target === switchInput) {
                // 切换代码片段的开关状态
                if (this.realTimePreview && snippet.type === "css") {
                    previewHandler();
                }
            } else if (tagName === "button") {
                // 移除焦点，否则点击按钮后如果不关闭 Dialog 的话会一直显示 :focus 样式
                target.blur();
                switch (target.dataset.action) {
                    case "delete":
                        // 弹窗确定后删除代码片段/不新建代码片段、关闭 Dialog
                        this.openSnippetDeleteDialog(snippet.name, () => {
                            this.deleteSnippet(snippet.id, snippet.type);
                            this.closeDialogByElement(dialog.element);
                        }); // 取消后无操作
                        break;
                    case "cancel":
                        // 取消
                        cancelHandler();
                        break;
                    case "preview":
                        // 预览 CSS 代码片段
                        if (snippet.type === "css") {
                            previewHandler();
                        }
                        break;
                    case "confirm":
                        // 新建/更新代码片段
                        saveHandler();
                        break;
                }
            } else if (target === closeElement || target === scrimElement) {
                cancelHandler();
            }
            return;
        }, {capture: true}); // 点击 .b3-dialog__close 和 .b3-dialog__scrim 时需要在捕获阶段阻止冒泡才行，因为原生在这两个元素上有监听器

        // 打开对话框时先执行一次预览
        if (snippet.type === "css" && this.realTimePreview) {
            previewHandler();
        }

        return true;

        // 还能插入 Protyle 编辑器，以后说不定能用上
        // new Protyle(this.app, dialog.element.querySelector("#protyle"), {
        //     blockId: this.getEditor().protyle.block.rootID,
        // });
    }

    /**
     * 打开代码片段删除对话框
     * @param snippetName 代码片段名称
     * @param confirm 确认回调
     */
    private openSnippetDeleteDialog(snippetName: string, confirm?: () => void) {
        // TODO功能: 实现了代码片段回收站之后，增加一个“不再提示”按钮，点击之后修改配置项、弹出消息说明可以在插件设置中开关
        this.openConfirmDialog(
            this.i18n.deleteConfirm,
            this.i18n.deleteConfirmDescription.replace("${x}", snippetName ? " <b>" + snippetName + "</b> " : ""),
            "jcsm-snippet-delete",
            undefined,
            this.i18n.delete,
            () => {
                // 删除代码片段
                confirm?.();
            }
        );

        // 不需要移除菜单上的 b3-menu__item--current，方便判断点击的是哪个代码片段
        // this.unselectSnippet();
    };

    /**
     * 打开代码片段取消对话框
     * @param snippet 代码片段
     * @param isNew 是否是新建代码片段
     * @param changes 变更内容
     * @param confirm 确认回调
     */
    private openSnippetCancelDialog(snippet: Snippet, isNew?: boolean, changes?: string[], confirm?: () => void) {
        const snippetName = snippet.name.trim();
        let text: string;
        if (isNew) {
            text = this.i18n.cancelConfirmNewSnippet
                .replace("${y}", snippetName ? " <b>" + snippetName + "</b> " : "");
        } else {
            // 将每个 change 用 <b> 标签包裹
            const changesText = changes?.map(change => `<b>${change}</b>`).join(", ") ?? "";
            text = this.i18n.cancelConfirmEditSnippet
                .replace("${x}", changesText)
                .replace("${y}", snippetName ? " <b>" + snippetName + "</b> " : "");
        }

        this.openConfirmDialog(
            this.i18n.cancelConfirm,
            text,
            "jcsm-snippet-cancel",
            this.i18n.continueEdit,
            this.i18n.giveUpEdit,
            () => {
                // 取消编辑代码片段
                confirm?.();
            }
        );
    };

    /**
     * 打开确认对话框（参考原生代码 app/src/dialog/confirmDialog.ts ）
     * @param title 对话框标题
     * @param text 对话框内容
     * @param dataKey 对话框元素的 data-key 属性值
     * @param cancelText 取消按钮文本
     * @param confirmText 确认按钮文本
     * @param confirm 确认回调
     * @param cancel 取消回调
     */
    private openConfirmDialog(title: string, text: string, dataKey?: string, cancelText?: string, confirmText?: string, confirm?: () => void, cancel?: () => void) {
        if (!text && !title) {
            confirm();
            return;
        }

        const redButton = dataKey === "jcsm-snippet-delete" || dataKey === "jcsm-snippet-cancel"; // 删除和放弃修改按钮是红色

        const dialog = new Dialog({
            title,
            content: `
                <div class="b3-dialog__content">
                    <div class="ft__breakword">${text}</div>
                </div>
                <div class="b3-dialog__action">
                    <button class="b3-button b3-button--cancel" data-type="cancel">${ cancelText ?? this.i18n.cancel }</button>
                    <div class="fn__space"></div>
                    <button class="b3-button ${ redButton ? "b3-button--remove" : "b3-button--text"}" data-type="confirm">${ confirmText ?? this.i18n.confirm}</button>
                </div>
            `,
            width: this.isMobile ? "92vw" : "520px",
        });
        dialog.element.setAttribute("data-key", dataKey ?? "dialog-confirm"); // Constants.DIALOG_CONFIRM
        const container = dialog.element.querySelector(".b3-dialog__container") as HTMLElement;
        if (container) container.style.maxHeight = "90vh";

        const closeElement = dialog.element.querySelector(".b3-dialog__close") as HTMLElement;
        const scrimElement = dialog.element.querySelector(".b3-dialog__scrim") as HTMLElement;

        // 在菜单打开的情况下，移动端无法上下划动对话框中的滚动容器，需要阻止事件冒泡
        this.addListener(dialog.element, "touchmove", (event: TouchEvent) => {
            event.stopPropagation();
        }, {passive: true});

        this.addListener(dialog.element, "click", (event: KeyboardEvent) => {
            this.console.log("confirmDialog click", event);
            // 阻止冒泡，否则点击 Dialog 时会导致 menu 关闭
            event.stopPropagation();
            let target = event.target as HTMLElement;
            const isDispatch = typeof event.detail === "string";
            while (target && target !== dialog.element || isDispatch) {
                if (target.dataset.type === "cancel" || (isDispatch && event.detail=== "Escape")) {
                        cancel?.();
                        this.closeDialogByElement(dialog.element);
                    break;
                } else if (target.dataset.type === "confirm" || (isDispatch && event.detail=== "Enter")) {
                        confirm?.();
                        this.closeDialogByElement(dialog.element);
                    break;
                } else if (target === closeElement || target === scrimElement) {
                    cancel?.();
                    this.closeDialogByElement(dialog.element);
                    break;
                }
                target = target.parentElement;
            }
        }, {capture: true});
    };

    /**
     * 通过元素关闭对话框
     * @param dialogElement 对话框元素
     */
    private closeDialogByElement(dialogElement: HTMLElement) {
        if (!dialogElement) {
            this.console.error("closeDialogByElement: dialogElement is undefined, return");
            return;
        }
        this.console.log("closeDialogByElement: dialogElement:", dialogElement);
        // 移除事件监听器
        this.removeListener(dialogElement);

        // 移除菜单项编辑按钮的背景色
        if (dialogElement.dataset.key === "jcsm-snippet-dialog") {
            this.removeSnippetEditButtonActive(dialogElement.dataset.snippetId);
        }

        // 关闭动画
        dialogElement.classList.remove("b3-dialog--open");
        setTimeout(() => {
            dialogElement?.remove();
            // Dialog 移除之后再移除全局键盘事件监听，因为需要判断窗口中是否还存在菜单和 Dialog
            this.destroyGlobalKeyDownHandler();
            // 检查并停止主题模式监听（在最后一个编辑器对话框关闭时）
            this.checkAndManageThemeWatch();
        }, Constants.TIMEOUT_DBLCLICK ?? 190); // 延时与思源代码保持一致
    }

    /**
     * 获取所有模态对话框元素
     * @returns 对话框元素数组
     */
    private getAllModalDialogElements(): HTMLElement[] {
        // 模态对话框打开时，不允许打开或操作菜单和代码片段编辑对话框，否则 this.globalKeyDownHandler() 判断不了 Escape 和 Enter 按键是对哪个元素的操作
        return Array.from(document.querySelectorAll("body > .b3-dialog--open[data-key^='jcsm-']:not([data-modal='false'])")) as HTMLElement[];
    }

    // ================================ 消息处理 ================================

    /**
     * 是否开启通知
     */
    private notificationSwitch: boolean = true; // 暂时默认开启

    /**
     * 弹出通知（仅限在插件设置中存在选项的通知可以使用该方法）
     * @param messageI18nKey 消息的 i18n 键
     * @param timeout 消息显示时间（毫秒）；-1 永不关闭；0 永不关闭，添加一个关闭按钮；undefined 默认 6000 毫秒
     */
    private showNotification(messageI18nKey: string, timeout: number | undefined = undefined) {
        if (this.notificationSwitch && (this as any)[messageI18nKey + "Notice"] && this.i18n[messageI18nKey]) {
            // 全局通知开关开启、该通知选项开启、i18n 键存在 → 弹出通知
            const message = this.i18n.couldCloseNoticeInPluginSettings.replace("${x}", this.i18n[messageI18nKey]);
            // 传入 messageId 参数之后，反复弹出相同的消息时，不会关闭上一个消息再弹出新消息
            showMessage(message, timeout, "info", PLUGIN_NAME + "-" + messageI18nKey);
        }
    }

    /**
     * 弹出错误消息
     * @param message 错误消息
     * @param timeout 消息显示时间（毫秒）；-1 永不关闭；0 永不关闭，添加一个关闭按钮；undefined 默认 6000 毫秒
     */
    private showErrorMessage(message: string, timeout: number | undefined = undefined, id?: string) {
        showMessage(this.i18n.pluginDisplayName + ": " + message, timeout, "error", id);
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
    private putFile(path: string, content: string): Promise<any> {
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
     * 生成新的代码片段 ID
     * @returns 新的代码片段 ID
     */
    private genNewSnippetId(): string {
        let newId = window.Lute.NewNodeID();
        while (this.snippetsList.find((s: Snippet) => s.id === newId)) {
            newId = window.Lute.NewNodeID();
        }
        return newId;
    }

    /**
     * 判断代码片段类型是否启用
     * @param snippetType 代码片段类型
     * @returns 是否启用
     */
    private isSnippetsTypeEnabled(snippetType: string): boolean {
        return (window.siyuan.config.snippet.enabledCSS && snippetType === "css") ||
               (window.siyuan.config.snippet.enabledJS  && snippetType === "js" );
    };

    /**
     * 重新加载界面
     */
    private reloadUI() {
        // 方案1：获取界面上所有打开的代码片段编辑对话框，判断是否存在未保存的变更，如果有的话需要弹窗确认再重载界面
        // 先用方案 1 顶顶，之后看看能不能实现方案 2
        // TODO: 方案2：获取界面上所有打开的代码片段编辑对话框（包括相关内联样式），重载界面之后恢复对话框的位置、大小、内容...

        // 获取所有打开的代码片段编辑对话框
        const dialogs = document.querySelectorAll(".b3-dialog--open[data-key='jcsm-snippet-dialog']");
        // 判断是否存在未保存的变更
        let needConfirm = false;
        for (let i = 0; i < dialogs.length; i++) {
            const dialog = dialogs[i] as HTMLElement;
            const snippetId = dialog.getAttribute("data-snippet-id");
            const snippet = this.snippetsList.find((s: Snippet) => s.id === snippetId);
            // 获取代码片段的标题
            const titleElement = dialog.querySelector(".jcsm-dialog-name") as HTMLInputElement;
            const title = titleElement?.value || "";
            // 从编辑器获取代码
            const editorElement = dialog.querySelector(".cm-editor") as HTMLElement;
            const editorView = (editorElement as any).cmView as EditorView;
            const code = editorView.state.doc.toString() || "";
            if (
                (snippet && (title !== snippet.name || code !== snippet.content)) // 已存在的代码片段，判断标题或内容是否有变更
                || (!snippet && (title !== "" || code !== ""))                    // 新建代码片段，判断是否有内容
            ) {
                // 只要有一个未保存变更就停止循环
                needConfirm = true;
                break;
            }
        }

        const reloadUI = () => {
            fetchPost("/api/ui/reloadUI", (response: any) => {
                if (response.status !== 200) {
                    this.showErrorMessage(this.i18n.reloadUIFailed);
                }
            });
        }

        if (needConfirm) {
            this.openConfirmDialog(this.i18n.reloadUIConfirm, this.i18n.reloadUIConfirmDescription, "jcsm-reload-ui-confirm", undefined, undefined,  () => {
                reloadUI();
            });
        } else {
            reloadUI();
        }
    };

    /**
     * 判断是否是 Mac（原生代码 app/src/protyle/util/compatibility.ts ）
     * @returns 是否是 Mac
     */
    private isMac(): boolean {
        return navigator.platform.toUpperCase().indexOf("MAC") > -1;
    };

    /**
     * 通过命令名称获取用户自定义快捷键
     * @param command 命令名称
     * @returns 用户自定义快捷键
     */
    private getCustomKeymapByCommand(command: string): string {
        return window.siyuan.config.keymap.plugin?.[PLUGIN_NAME]?.[command]?.custom || "";
    }

    /**
     * 获取快捷键显示文本（原生代码 app/src/protyle/util/compatibility.ts updateHotkeyTip() ）
     * @param hotkey 快捷键
     * @returns 快捷键显示文本
     */
    private getHotkeyDisplayText(hotkey: string): string {
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
     * 显示元素 tooltip
     * @param element 元素
     */
    private showElementTooltip(element: HTMLElement) {
        // 让元素触发 mouseover 事件，bubbles: true 启用冒泡，以激活原生的监听器，然后执行原生的 showTooltip()（原生代码 app/src/dialog/tooltip.ts ）
        element.dispatchEvent(new Event("mouseover", { bubbles: true }));
    }

    /**
     * 控制台调试输出
     */
    private console = (() => {
        // 是否启用日志编号功能
        const enableLogNumbering = true;
        // 日志编号计数器，从 1 开始
        let logCounter = 1;

        /**
         * 获取当前编号字符串，格式为 3 位数字（如 001、002）
         */
        const getLogNumber = () => {
            const num = logCounter.toString().padStart(3, "0");
            logCounter++;
            return num;
        };

        return {
            /**
             * 输出调试日志
             * @param args 日志内容
             */
            log: (...args: any[]) => {
                if (this.consoleDebug) {
                    if (enableLogNumbering) {
                        // 在日志前加上编号
                        console.log(`[${getLogNumber()}]`, ...args);
                    } else {
                        console.log(...args);
                    }
                }
            },
            /**
             * 输出警告日志
             * @param args 日志内容
             */
            warn: (...args: any[]) => {
                // 目前始终输出警告日志
                if (enableLogNumbering) {
                    // 在警告日志前加上编号
                    console.warn(`[${getLogNumber()}]`, ...args);
                } else {
                    console.warn(...args);
                }
            },
            /**
             * 输出错误日志
             * @param args 日志内容
             */
            error: (...args: any[]) => {
                // 目前始终输出错误日志
                if (enableLogNumbering) {
                    // 在错误日志前加上编号
                    console.error(`[${getLogNumber()}]`, ...args);
                } else {
                    console.error(...args);
                }
            }
        };
    })();

    /**
     * 使对话框或菜单元素显示在最上层（设置 zIndex）
     * @param element 元素
     */
    private moveElementToTop(element: HTMLElement) {
        if (!element) return;
        
        let maxZIndex = 0;
        // 查找所有打开的代码片段编辑对话框和菜单，如果 zIndex 不是最大的才增加
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
    private isInputElementActive(): boolean {
        const activeElement = document.activeElement;
        const tagName = activeElement.tagName.toLowerCase();
        const type = activeElement.getAttribute("type");
        // 忽略按钮元素
        return (tagName === "input" && type !== "checkbox") || tagName === "textarea";
    }

    /**
     * 全局键盘按下事件处理
     * @param event 键盘事件
     */
    private globalKeyDownHandler = (event: KeyboardEvent) => {
        // 获取所有打开的插件模态对话框，把按键操作发送给 DOM 最下方，也就是最顶层的对话框
        // 无法判断是在操作哪个代码片段编辑对话框（非模态），所以此处忽略代码片段编辑对话框 jcsm-snippet-dialog 的操作
        const dialogElements = this.getAllModalDialogElements();
        const dialogElement = dialogElements[dialogElements.length - 1];
        if (dialogElement) {
            // // 如果按 Esc 时焦点在输入框里，移除焦点
            // if (event.key === "Escape" && this.isInputElementActive()) {
            //     (document.activeElement as HTMLElement).blur();
            //     return;
            // }
            // 阻止冒泡，避免触发原生监听器导致菜单关闭
            event.stopPropagation();
            // 触发 Dialog 的 click 事件，传递按键（参考原生方法：https://github.com/siyuan-note/siyuan/blob/c88f99646c4c1139bcfc551b4f24b7cbea151751/app/src/boot/globalEvent/keydown.ts#L1394-L1406 ）
            dialogElement.dispatchEvent(new CustomEvent("click", {detail: event.key}));
            return;
        }

        // 菜单操作
        if (this.menu && document.activeElement === document.body) {
            // 阻止冒泡，避免：
            // 1. 触发原生监听器导致实际上会操作菜单选项，因此无法在输入框中使用方向键移动光标
            // 2. 按 Enter 之后默认会关闭整个菜单
            // 打开插件设置时无法按 Alt+P 打开思源设置菜单，只要不是按 Enter 或方向键就放过事件冒泡
            if (["Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
                event.stopPropagation();
            }
            // 如果当前在输入框中使用键盘，则不处理菜单按键事件
            if (this.isInputElementActive()) return;
            this.menu.element.dispatchEvent(new CustomEvent("click", {detail: event.key}));
            return;
        }
    }

    /**
     * 移除全局键盘按下事件监听
     */
    private destroyGlobalKeyDownHandler = () => {
        if (!this.isDialogAndMenuOpen()) {
            // 窗口内没有打开的 Dialog 和菜单之后才移除事件监听
            this.removeListener(document.documentElement, "keydown", this.globalKeyDownHandler);
        }
    }

    /**
     * 是否存在打开的插件对话框和菜单
     * @returns 是否存在
     */
    private isDialogAndMenuOpen(): boolean {
        return document.querySelectorAll(".b3-dialog--open[data-key^='jcsm-']").length > 0 || !!this.menu;
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
    set listeners(value: ListenersArray | undefined) { window.siyuan.jcsm.listeners = value; }

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

        // 设置检查标志
        this.isCheckingListeners = true;

        // 检查主题监听状态
        this.checkAndManageThemeWatch();

        // 如果没有监听器，停止定时器并返回
        if (!this.listeners || this.listeners.length === 0) {
            this.isCheckingListeners = false;
            this.stopListenerCheckInterval();
            return;
        }

        this.console.log("check Listener:", this.listeners);

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

        // 每隔 30 秒检查一次（调试时每隔 20 秒检查一次）
        this.listenerCheckIntervalId = window.setInterval(() => {
            this.isCheckingListeners = false; // 重置检查标志
            this.checkListenerElement();
        }, this.consoleDebug ? 20000 : 30000);
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
        this.console.log("removeListener:", element);
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

    /**
     * 销毁监听器
     */
    private destroyListeners() {
        // 移除所有监听器
        for (const elementListeners of this.listeners) {
            const { element, listeners } = elementListeners;
            // 移除该元素上的所有监听器
            listeners.forEach(({ event, fn, options }) => {
                element.removeEventListener(event, fn, options);
            });
        }
        // 清空 listeners 数组
        this.listeners = undefined;
        // 重置检查标志
        this.isCheckingListeners = false;
        // 停止监听器检查定时器
        this.stopListenerCheckInterval();
    }


    // ================================ 其他 ================================


    // TODO功能: 桌面端修改代码片段之后同步到打开的新窗口（所有变更都是弹窗确认，避免以后原生改进了 https://github.com/siyuan-note/siyuan/issues/12303 造成冲突）
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

    // ================================ 文件监听功能 ================================
    // AI 写的，没有严格考虑，代码能跑就行

    // TODO功能: 增加一个功能“监听到 JS 文件有更新时，自动重新加载界面”
    // TODO考虑: 支持管理（开启关闭）监听的文件夹中的代码片段 → 在 JS 右边增加一个“文件”选项卡（仅在开启该功能时显示），开关状态存在同目录中的 plugin-snippets-files-config.json 文件中

    /**
     * 文件监听模式
     */
    declare fileWatchEnabled: string;

    /**
     * 文件监听路径
     */
    declare fileWatchPath: string;

    /**
     * 文件监听间隔（秒）
     */
    declare fileWatchInterval: number;

    /**
     * 文件监听状态（文件路径 -> 文件状态）
     */
    private fileWatchFileStates: Map<string, FileState>;

    /**
     * 文件监听定时器 ID
     */
    private fileWatchIntervalId: number | null;

    /**
     * 启动文件监听
     */
    private startFileWatch() {
        if (this.fileWatchEnabled === "disabled") {
            return;
        }

        // 停止现有的监听
        this.stopFileWatch();
        
        // 清理所有旧的文件监听元素
        this.removeAllFileWatchElements();
        
        // 初始化文件状态
        this.fileWatchFileStates = new Map();
        
        // 初始加载现有文件
        this.loadExistingFiles();
        
        // 只有在启用模式下才设置定时器进行持续监听
        if (this.fileWatchEnabled === "enabled") {
            this.fileWatchIntervalId = window.setInterval(() => {
                this.checkFileChanges();
            }, this.fileWatchInterval * 1000);
        }
    }

    /**
     * 初始加载现有文件
     */
    private async loadExistingFiles() {
        try {
            const folderPath = this.fileWatchPath;
            if (!folderPath) {
                this.console.warn("loadExistingFiles: Folder path is empty");
                return;
            }

            // 获取文件夹中的文件列表
            const files = await this.getFolderFiles(folderPath);
            if (!files || files.length === 0) {
                this.console.log("loadExistingFiles: No watchable files found in folder");
                return;
            }

            this.console.log("loadExistingFiles: Start loading existing files", files.length, "files");

            // 加载每个文件
            for (const file of files) {
                await this.loadSingleFile(file);
            }

            this.console.log("loadExistingFiles: Existing files loading completed");

        } catch (error) {
            if (error.message && error.message.includes("system cannot find the file specified")) {
                // 检查是否是路径无效的错误
                this.console.warn("loadExistingFiles: Invalid folder path, stopping file watch");
                this.showErrorMessage(this.i18n.fileWatchInvalidPath + ": " + this.fileWatchPath, 0);
                this.stopFileWatch();
                return;
            } else if (error.message && error.message.includes("filename, directory name, or volume label syntax is incorrect")) {
                // 检查是否是绝对路径无效的错误
                this.console.warn("loadExistingFiles: Invalid folder path, stopping file watch");
                this.showErrorMessage(this.i18n.fileWatchNoSupportAbsPath + ": " + this.fileWatchPath, 0);
                this.stopFileWatch();
                return;
            }
            
            this.console.error("loadExistingFiles: Failed to load existing files", error);
            this.showErrorMessage(this.i18n.fileWatchError + ": " + error.message);
        }
    }

    /**
     * 加载单个文件
     * @param filePath 文件路径
     */
    private async loadSingleFile(filePath: string) {
        try {
            // 检查文件路径是否有效
            if (!filePath || filePath === 'undefined') {
                return;
            }
            
            // 获取文件信息
            const response = await this.getFile(filePath);

            // 检查响应格式
            let currentModified = 0;
            let currentContent = "";

            if (typeof response === 'string') {
                // 如果响应是字符串，说明直接返回了文件内容
                currentContent = response;
            } else if (response && typeof response === 'object') {
                // 如果响应是对象，检查是否有 code 字段
                if (response.code !== undefined) {
                    if (response.code !== 0) {
                        return;
                    }
                    
                    if (!response.data) {
                        return;
                    }
                    
                    currentModified = response.data.modified || 0;
                    currentContent = response.data.content || "";
                } else {
                    // 如果响应对象没有 code 字段，可能直接是文件数据
                    currentModified = response.modified || 0;
                    currentContent = response.content || "";
                }
            } else {
                return;
            }

            // 记录文件状态
            this.fileWatchFileStates.set(filePath, {
                path: filePath,
                lastModified: currentModified,
                content: currentContent
            });

            // 应用文件内容
            await this.applyFileChange(filePath, currentContent);
            
            this.console.log("loadSingleFile: File loaded successfully", filePath);

        } catch (error) {
            if (error.message && error.message.includes("The system cannot find the file specified")) {
                // 检查是否是路径无效的错误
                this.console.warn("loadSingleFile: Invalid file path", filePath);
                return;
            } else if (error.message && error.message.includes("filename, directory name, or volume label syntax is incorrect")) {
                // 检查是否是绝对路径无效的错误
                this.console.warn("loadSingleFile: Invalid absolute file path", filePath);
                return;
            }
            
            this.console.error("loadSingleFile: Failed to load file", filePath, error);
        }
    }

    /**
     * 停止文件监听
     */
    private stopFileWatch() {
        if (this.fileWatchIntervalId) {
            window.clearInterval(this.fileWatchIntervalId);
            this.fileWatchIntervalId = null;
            this.console.log("stopFileWatch: File watch stopped");
        }
        
        // 只有在禁用模式下才移除所有文件监听元素
        if (this.fileWatchEnabled === "disabled") {
            this.removeAllFileWatchElements();
        }
    }

    /**
     * 移除所有文件监听元素
     */
    private removeAllFileWatchElements() {
        const watchElements = document.querySelectorAll('[id^="snippetCssJcsmWatch"], [id^="snippetJsJcsmWatch"]');
        let hasJSRemoved = false;
        
        watchElements.forEach(element => {
            // 检查是否是 JS 文件被移除
            if (element.id.startsWith('snippetJsJcsmWatch') && 
                element.textContent && 
                this.isValidJavaScriptCode(element.textContent)) {
                hasJSRemoved = true;
            }
            element.remove();
        });
        
        // 如果有 JS 文件被移除，弹出提示
        if (hasJSRemoved) {
            this.showNotification("reloadUIAfterModifyJS", 2000);
            this.setReloadUIButtonBreathing();
        }
        
        this.console.log("removeAllFileWatchElements: Removed file watch elements:", watchElements.length);
    }

    /**
     * 检查文件变化
     */
    private async checkFileChanges() {
        try {
            const folderPath = this.fileWatchPath;
            
            if (!folderPath) {
                this.console.warn("checkFileChanges: folder path is empty");
                return;
            }

            // 获取文件夹中的文件列表
            const files = await this.getFolderFiles(folderPath);
            // 检查已删除的文件
            const currentFilePaths = new Set(files || []);
            const watchedFilePaths = Array.from(this.fileWatchFileStates.keys());
            for (const watchedFilePath of watchedFilePaths) {
                if (!currentFilePaths.has(watchedFilePath)) {
                    // 文件已被删除，移除对应的元素和状态
                    this.removeFileWatchElement(watchedFilePath);
                    this.fileWatchFileStates.delete(watchedFilePath);
                    this.console.log("checkFileChanges: File deleted", watchedFilePath);
                }
            }
            
            if (!files || files.length === 0) {
                return;
            }

            // 检查每个文件的变化
            for (const file of files) {
                await this.checkSingleFileChange(file);
            }

        } catch (error) {
            if (error.message && error.message.includes("The system cannot find the file specified")) {
                // 检查是否是路径无效的错误
                this.console.warn("checkFileChanges: Invalid folder path, stopping file watch");
                this.showErrorMessage(this.i18n.fileWatchInvalidPath + ": " + this.fileWatchPath, 0);
                this.stopFileWatch();
                return;
            } else if (error.message && error.message.includes("filename, directory name, or volume label syntax is incorrect")) {
                // 检查是否是绝对路径无效的错误
                this.console.warn("checkFileChanges: Invalid absolute path, stopping file watch");
                this.showErrorMessage(this.i18n.fileWatchNoSupportAbsPath + ": " + this.fileWatchPath, 0);
                this.stopFileWatch();
                return;
            }
            
            this.console.error("checkFileChanges: Failed to check file changes", error);
            this.showErrorMessage(this.i18n.fileWatchError + ": " + error.message);
        }
    }

    /**
     * 获取文件夹中的文件列表
     * @param folderPath 文件夹路径
     * @returns 文件列表
     */
    private async getFolderFiles(folderPath: string): Promise<string[]> {
        try {
            const response = await new Promise<any>((resolve) => {
                fetchPost("/api/file/readDir", { path: folderPath }, (response: any) => {
                    resolve(response);
                });
            });

            if (response.code !== 0) {
                throw new Error(response.msg || "读取文件夹失败");
            }

            const files: string[] = [];
            if (response.data && Array.isArray(response.data)) {
                for (const item of response.data) {
                    // 检查文件路径是否存在且有效
                    if (item.isDir === false && 
                        item.name && 
                        (item.name.endsWith('.css') || item.name.endsWith('.js'))) {
                        
                        // 构建文件路径：如果 item.path 不存在，则使用文件夹路径 + 文件名
                        let filePath = item.path;
                        if (!filePath && item.name) {
                            filePath = `${folderPath}/${item.name}`;
                        }
                        
                        if (filePath) {
                            files.push(filePath);
                        }
                    }
                }
            }

            return files;
        } catch (error) {
            if (error.message && error.message.includes("The system cannot find the file specified")) {
                // 检查是否是路径无效的错误
                this.console.warn("getFolderFiles: Invalid folder path", folderPath);
                throw error; // 重新抛出错误，让上层方法处理
            } else if (error.message && error.message.includes("filename, directory name, or volume label syntax is incorrect")) {
                // 检查是否是绝对路径无效的错误
                this.console.warn("getFolderFiles: Invalid absolute path", folderPath);
                throw error; // 重新抛出错误，让上层方法处理
            }
            
            this.console.error("getFolderFiles: Failed to get folder file list", error);
            throw error;
        }
    }

    /**
     * 检查单个文件的变化
     * @param filePath 文件路径
     */
    private async checkSingleFileChange(filePath: string) {
        try {
            // 检查文件路径是否有效
            if (!filePath || filePath === 'undefined') {
                return;
            }
            
            // 获取文件信息
            const response = await this.getFile(filePath);

            // 检查响应格式
            let currentModified = 0;
            let currentContent = "";

            if (typeof response === 'string') {
                // 如果响应是字符串，说明直接返回了文件内容
                currentContent = response;
            } else if (response && typeof response === 'object') {
                // 如果响应是对象，检查是否有 code 字段
                if (response.code !== undefined) {
                    if (response.code !== 0) {
                        return;
                    }
                    
                    if (!response.data) {
                        return;
                    }
                    
                    currentModified = response.data.modified || 0;
                    currentContent = response.data.content || "";
                } else {
                    // 如果响应对象没有 code 字段，可能直接是文件数据
                    currentModified = response.modified || 0;
                    currentContent = response.content || "";
                }
            } else {
                return;
            }

            // 获取之前的文件状态
            const previousState = this.fileWatchFileStates.get(filePath);

            if (!previousState) {
                // 新文件，记录状态并应用文件内容
                this.fileWatchFileStates.set(filePath, {
                    path: filePath,
                    lastModified: currentModified,
                    content: currentContent
                });
                
                // 应用新文件内容
                await this.applyFileChange(filePath, currentContent);
                this.console.log("checkSingleFileChange: New file added", filePath);
                return;
            }

            // 检查文件是否有变化
            if (previousState.lastModified !== currentModified || previousState.content !== currentContent) {
                // 获取文件扩展名
                const fileName = filePath.split('/').pop() || "";
                const fileExtension = fileName.split('.').pop()?.toLowerCase();
                
                if (fileExtension === 'js') {
                    // 对于 JS 文件，只处理首次添加和移除，不处理中途变更
                    // 检查是否是文件被删除后重新添加的情况
                    const encodedFilePath = encodeURIComponent(filePath);
                    const existingElement = document.querySelector(`[data-file-path="${encodedFilePath}"]`);
                    if (!existingElement) {
                        // 元素不存在，说明是重新添加的情况，需要重新应用
                        this.fileWatchFileStates.set(filePath, {
                            path: filePath,
                            lastModified: currentModified,
                            content: currentContent
                        });
                        
                        await this.applyFileChange(filePath, currentContent);
                        this.console.log("checkSingleFileChange: JS file re-added", filePath);
                    } else {
                        // 元素存在，说明是中途变更，不处理
                        this.console.log("checkSingleFileChange: JS file modified during runtime, ignoring", filePath);
                        // 更新文件状态但不重新应用
                        this.fileWatchFileStates.set(filePath, {
                            path: filePath,
                            lastModified: currentModified,
                            content: currentContent
                        });
                    }
                } else {
                    // 对于非 JS 文件，保持原有逻辑
                    this.fileWatchFileStates.set(filePath, {
                        path: filePath,
                        lastModified: currentModified,
                        content: currentContent
                    });

                    // 应用文件变化
                    await this.applyFileChange(filePath, currentContent);
                }
            }
        } catch (error) {
            if (error.message && error.message.includes("The system cannot find the file specified")) {
                // 检查是否是路径无效的错误
                this.console.warn("checkSingleFileChange: Invalid file path", filePath);
                // 移除无效文件的状态
                this.fileWatchFileStates.delete(filePath);
                return;
            } else if (error.message && error.message.includes("filename, directory name, or volume label syntax is incorrect")) {
                // 检查是否是绝对路径无效的错误
                this.console.warn("checkSingleFileChange: Invalid absolute file path", filePath);
                // 移除无效文件的状态
                this.fileWatchFileStates.delete(filePath);
                return;
            }
            
            this.console.error("checkSingleFileChange: Failed to check file change", filePath, error);
        }
    }

    /**
     * 应用文件变化
     * @param filePath 文件路径
     * @param content 文件内容
     */
    private async applyFileChange(filePath: string, content: string) {
        try {
            const fileName = filePath.split('/').pop() || "";
            const fileExtension = fileName.split('.').pop()?.toLowerCase();

            if (fileExtension === 'css') {
                // 应用 CSS 文件
                await this.applyCSSFile(filePath, content);
            } else if (fileExtension === 'js') {
                // 应用 JS 文件
                await this.applyJSFile(filePath, content);
            }

        } catch (error) {
            this.console.error("applyFileChange: Failed to apply file change", filePath, error);
        }
    }

    /**
     * 应用 CSS 文件 - 直接添加样式元素
     * @param filePath 文件路径
     * @param content 文件内容
     */
    private async applyCSSFile(filePath: string, content: string) {
        try {
            // 移除已存在的同名文件监听元素
            this.removeFileWatchElement(filePath);
            
            // 创建新的样式元素
            const styleElement = document.createElement('style');
            styleElement.id = `snippetCssJcsmWatch${this.genNewSnippetId()}`;
            styleElement.setAttribute('data-file-path', encodeURIComponent(filePath));
            styleElement.textContent = content;
            
            // 添加到 head 中
            document.head.appendChild(styleElement);
            
            this.console.log("applyCSSFile: Added file watch style element", filePath);

        } catch (error) {
            this.console.error("applyCSSFile: Failed to apply CSS file", filePath, error);
        }
    }

    /**
     * 应用 JS 文件 - 直接添加脚本元素
     * @param filePath 文件路径
     * @param content 文件内容
     */
    private async applyJSFile(filePath: string, content: string) {
        try {
            // 验证 JS 代码是否有效
            if (!this.isValidJavaScriptCode(content)) {
                this.console.warn("applyJSFile: Invalid JS code", filePath);
                return;
            }

            // 移除已存在的同名文件监听元素
            this.removeFileWatchElement(filePath);
            
            // 创建新的脚本元素
            const scriptElement = document.createElement('script');
            scriptElement.type = 'text/javascript';
            scriptElement.id = `snippetJsJcsmWatch${this.genNewSnippetId()}`;
            scriptElement.setAttribute('data-file-path', encodeURIComponent(filePath));
            scriptElement.textContent = content;
            
            // 添加到 head 中
            document.head.appendChild(scriptElement);
            
            this.console.log("applyJSFile: Added file watch script element", filePath);

        } catch (error) {
            this.console.error("applyJSFile: Failed to apply JS file", filePath, error);
        }
    }

    /**
     * 移除文件监听元素
     * @param filePath 文件路径
     */
    private removeFileWatchElement(filePath: string) {
        const existingElement = document.querySelector(`[data-file-path="${encodeURIComponent(filePath)}"]`);
        if (existingElement) {
            // 检查是否是有效的 JS 文件被移除
            const fileName = filePath.split('/').pop() || "";
            const fileExtension = fileName.split('.').pop()?.toLowerCase();
            
            if (fileExtension === 'js' && existingElement.textContent && this.isValidJavaScriptCode(existingElement.textContent)) {
                // JS 代码片段元素被移除需要弹出消息提示
                this.showNotification("reloadUIAfterModifyJS", 2000);
                // 高亮菜单上的重新加载界面按钮
                this.setReloadUIButtonBreathing();
                this.console.log("removeFileWatchElement: JS file removed, UI reload required", filePath);
            } else {
                this.console.log("removeFileWatchElement: Removed file watch element", filePath);
            }
            
            existingElement.remove();
        }
    }

    /**
     * 在设置应用时启动或停止文件监听
     */
    private handleFileWatchSettingChange() {
        if (this.fileWatchEnabled === "disabled") {
            this.stopFileWatch();
        } else {
            this.startFileWatch();
        }
    }
}
