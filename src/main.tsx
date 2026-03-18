
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { ThemeProvider } from "next-themes";
  import { ErrorBoundary } from "./components/ErrorBoundary.tsx";

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      {/* @ts-ignore - React 18 children type mismatch with next-themes */}
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
  