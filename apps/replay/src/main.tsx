import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { demoFiles } from "./data/demo";
import { loadSession } from "./data/timeline";
import { App } from "./ui/App";
import "./ui/tokens.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App session={loadSession(demoFiles)} />
  </StrictMode>,
);
