import "@vue/runtime-dom";

declare module "@vue/runtime-dom" {
  interface HTMLAttributes {
    children?: any;
  }
  interface ReservedProps {
    children?: any;
  }
}
