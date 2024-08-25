import { serve } from "https://deno.land/std/http/server.ts";
import { v4 as uuidv4 } from "https://deno.land/std/uuid/mod.ts";

const kv = await Deno.openKv();

const PORT = 8000;

const handleRequest = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === "/save") {
    try {
      const data = await req.json();
      const { url: fileUrl, projectName, username, uid, verified, email } = data;

      const projectId = uuidv4.generate();
      const projectData = {
        File: fileUrl,
        FileName: projectName,
        Username: username,
        Verified: verified,
        Email: email || "",
        Download: "0"
      };

      await kv.set(["projects", projectId], projectData);

      return new Response(JSON.stringify({ status: "success", projectId }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error saving project:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to save project." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  if (req.method === "GET" && url.pathname === "/projects") {
    try {
      const startAfter = url.searchParams.get("startAfter") || "0";
      const startKey = ["projects", startAfter];
      const projects: any[] = [];

      for await (const [key, value] of kv.list({ prefix: ["projects"], startAfter: startKey, limit: 20 })) {
        projects.push({ projectId: key[1], ...value });
      }

      return new Response(JSON.stringify({ status: "success", projects }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to fetch projects." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  if (req.method === "DELETE" && url.pathname === "/delete") {
    try {
      const { projectId, uid } = await req.json();

      const key = ["projects", projectId];
      const result = await kv.get(key);

      if (result.value) {
        if (result.value.Username === uid) {
          await kv.delete(key);
          return new Response(JSON.stringify({ status: "success", message: "Project deleted." }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } else {
          return new Response(JSON.stringify({ status: "error", message: "Unauthorized." }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
          });
        }
      } else {
        return new Response(JSON.stringify({ status: "error", message: "Project not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to delete project." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  if (req.method === "GET" && url.pathname === "/increase") {
    try {
      const projectId = url.searchParams.get("projectId");

      if (!projectId) {
        return new Response(JSON.stringify({ status: "error", message: "Missing projectId." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const key = ["projects", projectId];
      const result = await kv.get(key);

      if (result.value) {
        const downloadCount = parseInt(result.value.Download || "0", 10);
        await kv.set(key, { ...result.value, Download: (downloadCount + 1).toString() });

        return new Response(JSON.stringify({ status: "success", download: (downloadCount + 1).toString() }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } else {
        await kv.set(key, { ...result.value, Download: "1" });
        return new Response(JSON.stringify({ status: "success", download: "1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      console.error("Error increasing download count:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to increase download count." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  if (req.method === "GET" && url.pathname === "/clean") {
    try {
      for await (const [key] of kv.list({ prefix: ["projects"] })) {
        await kv.delete(key);
      }
      return new Response(JSON.stringify({ status: "success", message: "Database cleaned." }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error cleaning database:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to clean database." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ status: "error", message: "Not found." }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
};

console.log(`Server running on http://localhost:${PORT}/`);
serve(handleRequest, { port: PORT });
