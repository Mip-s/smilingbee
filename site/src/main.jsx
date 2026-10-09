import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";
import Admin from "./admin/Admin.jsx";
import { ContentProvider } from "./ContentContext.jsx";

// /admin is not linked from anywhere on the public site. It has its own login and editor.
const isAdmin = /^\/admin\/?$/.test(window.location.pathname);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdmin ? (
      <Admin />
    ) : (
      <ContentProvider>
        <App />
      </ContentProvider>
    )}
  </React.StrictMode>
);
