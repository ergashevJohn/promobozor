import "@testing-library/jest-dom";

if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
    this.setAttribute("open", "");
  };

  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    document.querySelectorAll("dialog[open]").forEach((dialog) => {
      (dialog as HTMLDialogElement).close();
    });
  });
}
