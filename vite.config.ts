import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function stubApiPlugin() {
  return {
    name: "dev-stub-api",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (process.env.VITE_STUB_API === "1" && req.url?.startsWith("/api/")) {
          res.statusCode = 204; // No Content
          return res.end();
        }
        next();
      });
    }
  };
}

export default defineConfig({
  root: "src/web",
  plugins: [react(), stubApiPlugin()],
  server: { port: 3000 },
  preview: { port: 3000 },
  build: {
    outDir: "../../dist-web",
    emptyOutDir: true,
    target: "es2020"
  }
});