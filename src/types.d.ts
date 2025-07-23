import { ISiyuan } from "siyuan/types";

declare global {
    interface Window {
        siyuan: ISiyuan & {
            jcsm?: {
                topBarMenuInputType?: string;
            };
        };
    }
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

export { Snippet };