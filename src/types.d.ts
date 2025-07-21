import { ISiyuan } from "siyuan/types";

declare global {
    interface Window {
        siyuan: ISiyuan & {
            sjosd?: {
                topBarMenuInputType?: string;
            };
        };
    }
}

export {}; 