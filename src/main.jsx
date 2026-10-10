import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { StoreInfoProvider } from "./context/StoreInfoContext";


ReactDOM.createRoot(document.getElementById("root")).render(
    <StrictMode>
    <StoreInfoProvider>
      <App />
    </StoreInfoProvider>
  </StrictMode>
);
