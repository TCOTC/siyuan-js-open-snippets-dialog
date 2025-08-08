import { Constants } from "siyuan";

// TODO: 等实现 https://github.com/siyuan-note/siyuan/issues/15485 之后，通过 API 获取思源版本来判断是否支持 hideMessage ，不支持才使用下面这个方法：

export const hideMessage = (id?: string) => {
  console.log("hideMessage:", id);
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