import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import Councillors from "./Councillors.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Councillors />
  </React.StrictMode>
);
