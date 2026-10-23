import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App, { API_BASE, API_ORIGIN } from "./App";
import "./index.css";
import { StoreInfoProvider } from "./context/StoreInfoContext";
import { ApiContext } from "./context/ApiContext";


ReactDOM.createRoot(document.getElementById("root")).render(
    <StrictMode>
    <ApiContext.Provider value={{ API_BASE, API_ORIGIN }}>
      <StoreInfoProvider>
        <App />
      </StoreInfoProvider>
    </ApiContext.Provider>
  </StrictMode>
);
