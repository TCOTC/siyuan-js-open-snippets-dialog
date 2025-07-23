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

export {}; 