import { Constants, hideMessage as hideMessageNative } from "siyuan";
import { compare } from "compare-versions";

/**
 * 是否达到特定版本
 */
export const isVersionReach = (version: string) => {
    return compare(Constants.SIYUAN_VERSION, version, ">=");
};

/**
 * 隐藏消息
 */
export const hideMessage = (id?: string) => {
    if (isVersionReach("3.3.0")) {
        // 思源 v3.3.0 后使用原生实现 https://github.com/siyuan-note/siyuan/issues/15485
        hideMessageNative(id);
        return;
    }

    const messagesElement = document.getElementById("message").firstElementChild;
    if (!messagesElement) {
        return;
    }
    if (id) {
        const messageElement = messagesElement.querySelector(`[data-id="${id}"]`);
        if (messageElement) {
            messageElement.classList.add("b3-snackbar--hide");
            window.clearTimeout(parseInt(messageElement.getAttribute("data-timeoutid")));
            setTimeout(() => {
                messageElement.remove();
                if (messagesElement.childElementCount === 0) {
                    messagesElement.parentElement.classList.remove("b3-snackbars--show");
                    messagesElement.innerHTML = "";
                }
            }, Constants.TIMEOUT_INPUT);
        }
        let hasShowItem = false;
        Array.from(messagesElement.children).find(item => {
            if (!item.classList.contains("b3-snackbar--hide")) {
                hasShowItem = true;
                return true;
            }
        });
        if (hasShowItem) {
            messagesElement.parentElement.classList.add("b3-snackbars--show");
        } else {
            messagesElement.parentElement.classList.remove("b3-snackbars--show");
        }
    } else {
        messagesElement.parentElement.classList.remove("b3-snackbars--show");
        setTimeout(() => {
            messagesElement.innerHTML = "";
        }, Constants.TIMEOUT_INPUT);
    }
};

/**
 * 判断 Promise 是否已成功完成
 * @param promise Promise<any> 要判断的 Promise 对象
 * @returns Promise<boolean> 返回一个 Promise，resolve 的值为 true 表示已 fulfilled，false 表示未 fulfilled 或被 reject。
 */
export const isPromiseFulfilled = async (promise: Promise<any>): Promise<boolean> => {
    // 检查是否是 Promise 对象
    if (!(promise instanceof Promise)) {
        return false;
    }
    try {
        await promise;
        // fulfilled 状态
        return true;
    } catch (e) {
        // rejected 状态
        return false;
    }
};