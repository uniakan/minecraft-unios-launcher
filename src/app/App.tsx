import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./providers/router";
import { TitleBar } from "@widgets/title-bar";

export function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-screen flex flex-col bg-dark-950 overflow-hidden">
        <TitleBar />
        <main className="flex-1 overflow-hidden">
          <AppRouter />
        </main>
      </div>
    </BrowserRouter>
  );
}
