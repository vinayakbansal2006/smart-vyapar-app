/**
 * =========================================================================
 * Application Entry Point (index.tsx)
 * -------------------------------------------------------------------------
 * This file is the primary entry point for the React application. 
 * It mounts the root `App` component onto the DOM. 
 * Ensure the `index.html` has a <div id="root"> element available.
 * =========================================================================
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);