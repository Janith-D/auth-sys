import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import store from "./app/store";
import App from "./App";
import { SocketProvider } from "./context/SocketContext";
import "./index.css";

const root = document.getElementById("root")!;
createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <SocketProvider>
          <App />
        </SocketProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
