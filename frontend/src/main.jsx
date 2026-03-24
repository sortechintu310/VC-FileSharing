import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store.js";
import AuthBootstrap from "./components/AuthBootstrap.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <AuthBootstrap>
                    <App />
                </AuthBootstrap>
            </BrowserRouter>
        </Provider>
    </StrictMode>
);
