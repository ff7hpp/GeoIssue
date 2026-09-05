import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./locales/i18n";
import "./styles/globals.css";
import "./styles/map.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
