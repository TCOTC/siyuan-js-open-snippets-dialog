import { ISiyuan } from "siyuan/types";

declare global {
    interface Window {
        siyuan: ISiyuan & {
            isPublish?: boolean;
            jcsm?: {
                snippetsType?: string;
                snippetsList?: Snippet[];
            };
        };
    }
}

/**
 * 设置项类型
 */
interface SettingItem {
    title?: string;
    description?: string;
    direction?: "row" | "column";
    actionElement?: HTMLElement;
    createActionElement?: () => HTMLElement;
}

/**
 * 代码片段类型
 * 参考 app/src/types/index.d.ts 的 ISnippet
 */
interface Snippet {
    id?: string;
    name: string;
    content: string;
    type: "css" | "js";
    enabled: boolean;
}

// 扩展 Setting 类
declare module "siyuan" {
    interface Setting {
        items: SettingItem[];

        addItem(options: {
            title?: string,
            direction?: "column" | "row"
            description?: string,
            actionElement?: HTMLElement,
            createActionElement?(): HTMLElement,
        }): void;
    }
}

export { Snippet, SettingItem };