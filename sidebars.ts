import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  specSidebar: [
    {
      type: "doc",
      id: "introduction",
      label: "Introduction",
    },
    {
      type: "doc",
      id: "why-webassembly",
      label: "Why WebAssembly?",
    },
    {
      type: "doc",
      id: "spec",
      label: "Specification",
    },
    {
      type: "doc",
      id: "vci",
      label: "VCI",
    },
  ],
};

export default sidebars;
