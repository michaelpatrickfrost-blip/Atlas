// Vitest setup for DOM component tests.
// React 19 requires this flag for act(...) support outside of React Testing Library's own setup.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom does not implement HTMLDialogElement: `showModal`, `close` and the
// reflected `open` property are all missing, so a component effect that calls
// `dialog.showModal()` throws and unmounts the whole React tree. Polyfill the
// bits the design system relies on. Real browsers provide these natively.
if (typeof HTMLDialogElement !== "undefined") {
  const proto = HTMLDialogElement.prototype as unknown as {
    showModal?: () => void;
    close?: () => void;
    open?: boolean;
  };

  if (typeof proto.showModal !== "function") {
    proto.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  }

  if (typeof proto.close !== "function") {
    proto.close = function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
}
