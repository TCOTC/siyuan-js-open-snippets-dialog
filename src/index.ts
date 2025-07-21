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
    private snippetType: string = "sjosd-radio-css"; // 顶栏菜单默认显示 CSS 代码片段

    // 启用插件
    onload() {
        this.data[STORAGE_NAME] = {readonlyText: "Readonly"};

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
            }
        });



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



        // 注册快捷键
        // TODO: “重新加载界面”快捷键、“打开顶栏菜单”的快捷键（这些快捷键都默认置空）
        this.addCommand({
            langKey: "showDialog",
            hotkey: "⇧⌘O",
            callback: () => {
                this.showDialog();
            },
        });



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

    // 布局加载完成
    onLayoutReady() {
        // 加载插件配置
        this.loadData(STORAGE_NAME);
    }

    // 禁用插件
    onunload() {
        console.log(this.i18n.pluginDisplayName + this.i18n.pluginOnunload);
    }

    // 卸载插件
    uninstall() {
        console.log(this.i18n.pluginDisplayName + this.i18n.pluginUninstall);
    }


    private showDialog() {
        const dialog = new Dialog({
            title: `SiYuan ${Constants.SIYUAN_VERSION}`,
            content: `<div class="b3-dialog__content">
    <div>appId:</div>
    <div class="fn__hr"></div>
    <div class="plugin-sample__time">${this.app.appId}</div>
    <div class="fn__hr"></div>
    <div class="fn__hr"></div>
    <div>API demo:</div>
    <div class="fn__hr"></div>
    <div class="plugin-sample__time">System current time: <span id="time"></span></div>
    <div class="fn__hr"></div>
    <div class="fn__hr"></div>
    <div>Protyle demo:</div>
    <div class="fn__hr"></div>
    <div id="protyle" style="height: 360px;"></div>
</div>`,
            width: this.isMobile ? "92vw" : "560px",
            height: "540px",
        });
        // new Protyle(this.app, dialog.element.querySelector("#protyle"), {
        //     blockId: this.getEditor().protyle.block.rootID,
        // });
        fetchPost("/api/system/currentTime", {}, (response) => {
            dialog.element.querySelector("#time").innerHTML = new Date(response.data).toString();
        });
    }


    private async addMenu(rect?: DOMRect) {
        const menu = new Menu("siyuanJsOpenSnippetsDialog", () => {
            // 此处在关闭菜单时执行
        });
        // 如果菜单已存在，再次点击按钮就会移除菜单，此时直接返回
        if (menu.isOpen) return;


        // 获取代码片段列表
        const response = await fetchSyncPost("/api/snippet/getSnippet", { type: "all", enabled: 2 });
        if (response.code !== 0) {
            // 异常处理
            menu.close();
            showMessage(this.i18n.pluginDisplayName + ": " + this.i18n.getSnippetsListFailed + " [" + response.msg + "]", 6000, "error");
            return;
        }

        const snippetsList = response.data.snippets;
        console.log(snippetsList);

        // 插入菜单顶部
        const menuItems: HTMLElement = menu.element.querySelector(".b3-menu__items");
        const menuTop = document.createElement("div");
        menuTop.className = "sjosd-top-bar-menu fn__flex";
        // 选项卡的实现参考：https://codepen.io/havardob/pen/ExVaELV
        menuTop.innerHTML =
        `<div class="sjosd-top-bar-menu__top-container">
            <div class="sjosd-tabs">
                <input type="radio" id="sjosd-radio-css" name="sjosd-tabs"/>
                <label class="sjosd-tab" for="sjosd-radio-css">
                    <span class="sjosd-tab-text">CSS</span>
                    <span class="sjosd-tab-count"></span>
                </label>
                <input type="radio" id="sjosd-radio-js" name="sjosd-tabs"/>
                <label class="sjosd-tab" for="sjosd-radio-js">
                    <span class="sjosd-tab-text" style="padding-left: .2em;">JS</span>
                    <span class="sjosd-tab-count"></span>
                </label>
                <span class="sjosd-glider"></span>
            </div>
        </div>`;
        menuTop.querySelector("#" + this.snippetType).setAttribute("checked", "");
        menuItems.append(menuTop);
        menuTop.addEventListener("click", (e) => {
            const target = e.target as Element;
            // console.log(target);
            if (target.tagName.toLowerCase() === "input") {
                // TODO: 切换代码片段类型
                const inputTarget = target as HTMLInputElement;
                // console.log(inputTarget.id);
                // console.log(inputTarget.checked);
                this.snippetType = inputTarget.id;
                // if (!window.siyuan.sjosd) window.siyuan.sjosd = {};
                // window.siyuan.sjosd.topBarMenuInputType = inputTarget.id;
                switchSnippet(menuItems);
            }

            // 点击顶部可以取消选中代码片段
            if (target.closest(".sjosd-top-bar-menu")) {
                menuItems.querySelectorAll(".b3-menu__item--current").forEach((item: any) => {
                    item.classList.remove("b3-menu__item--current");
                });
            }
        });
        // TODO: 监听按键操作，在选项上按回车时切换开关/特定交互、按 Delete 时删除代码片段、按 Tab 可以在各个可交互的元素上轮流切换

        const switchSnippet = (menuItems: HTMLElement) => {
            if (this.snippetType === "sjosd-radio-css") {
                menuItems.querySelectorAll("[data-type='css']").forEach((item: any) => {
                    item.classList.remove("fn__none");
                });
                menuItems.querySelectorAll("[data-type='js']").forEach((item: any) => {
                    item.classList.add("fn__none");
                });
            } else if (this.snippetType === "sjosd-radio-js") {
                menuItems.querySelectorAll("[data-type='js']").forEach((item: any) => {
                    item.classList.remove("fn__none");
                });
                menuItems.querySelectorAll("[data-type='css']").forEach((item: any) => {
                    item.classList.add("fn__none");
                });
            }
            
        };


        // 生成代码片段列表
        snippetsList.forEach((snippet: any) => {
            const snippetElement = document.createElement("button");
            snippetElement.className = "b3-menu__item";
            // if (this.snippetType === "sjosd-radio-css" && snippet.type !== "css") {
            //     snippetElement.classList.add("fn__none");
            // } else if (this.snippetType === "sjosd-radio-js" && snippet.type !== "js") {
            //     snippetElement.classList.add("fn__none");
            // }
            snippetElement.setAttribute("data-type", snippet.type);
            snippetElement.setAttribute("data-id", snippet.id);
            snippetElement.innerHTML =
                `<div class="fn__flex-1">${snippet.name}</div>
                <span class="fn__space"></span>
                <button class="block__icon block__icon--show fn__flex-center" data-type="edit"><svg><use xlink:href="#iconEdit"></use></svg></button>
                <button class="block__icon block__icon--show fn__flex-center" data-type="remove"><svg><use xlink:href="#iconTrashcan"></use></svg></button>
                <span class="fn__space"></span>
                <input style="box-sizing: border-box" class="b3-switch fn__flex-center" type="checkbox">`;
            
            menuItems.append(snippetElement);
            switchSnippet(menuItems);
        });


        const updateSnippetCount = (menuItems: HTMLElement) => {
            const cssCount = menuItems.querySelectorAll("[data-type='css']").length;
            const jsCount = menuItems.querySelectorAll("[data-type='js']").length;
            menuItems.querySelector("#sjosd-radio-css + label .sjosd-tab-count").textContent = cssCount > 99 ? "99+" : cssCount.toString();
            menuItems.querySelector("#sjosd-radio-js + label .sjosd-tab-count").textContent = jsCount > 99 ? "99+" : jsCount.toString();
        };
        updateSnippetCount(menuItems);


        // const snippetsListElement = document.createElement("div");
        // snippetsListElement.className = "sjosd-snippets-list";
        // snippetsListElement.innerHTML = snippetsList.map(snippet => `<div class="sjosd-snippet">${snippet.name}</div>`).join("");
        // menuItems.append(snippetsListElement);

        // TODO: 插入代码片段列表

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

        // 弹出菜单
        if (this.isMobile) {
            menu.fullscreen();
        } else {
            // TODO: 这里不要用鼠标位置（考虑用 top 和 vw），并且菜单要固定宽度，否则切换 CSS 和 JS 时，菜单会抖动或者超出窗口右边界
            //  还要调整菜单的最大高度、添加 scrollbar-gutter: stable; 样式
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
            });
        }
    }



    // 自定义插件设置窗口
//     openSetting() {
//         const dialog = new Dialog({
//             title: this.name,
//             content: `<div class="b3-dialog__content"><textarea class="b3-text-field fn__block" placeholder="readonly text in the menu"></textarea></div>
// <div class="b3-dialog__action">
//     <button class="b3-button b3-button--cancel">${this.i18n.cancel}</button><div class="fn__space"></div>
//     <button class="b3-button b3-button--text">${this.i18n.save}</button>
// </div>`,
//             width: this.isMobile ? "92vw" : "520px",
//         });
//         const inputElement = dialog.element.querySelector("textarea");
//         inputElement.value = this.data[STORAGE_NAME].readonlyText;
//         const btnsElement = dialog.element.querySelectorAll(".b3-button");
//         dialog.bindInput(inputElement, () => {
//             (btnsElement[1] as HTMLButtonElement).click();
//         });
//         inputElement.focus();
//         btnsElement[0].addEventListener("click", () => {
//             dialog.destroy();
//         });
//         btnsElement[1].addEventListener("click", () => {
//             this.saveData(STORAGE_NAME, {readonlyText: inputElement.value});
//             dialog.destroy();
//         });
//     }
}
