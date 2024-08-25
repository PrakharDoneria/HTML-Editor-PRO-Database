import { serve } from "https://deno.land/std@0.167.0/http/server.ts";
import { v4 } from "https://deno.land/std@0.167.0/uuid/mod.ts";

const kv = await Deno.openKv();

async function getNextProjectId(): Promise<number> {
  const idKey = ["meta", "nextProjectId"];
  const result = await kv.get(idKey);
  const nextId = result?.value || 0;
  await kv.set(idKey, nextId + 1); // Increment for next use
  return nextId;
}

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/save" && req.method === "POST") {
    try {
      const data = await req.json();
      const { url: fileUrl, projectName, username, uid, verified, email } = data;

      const projectId = await getNextProjectId();
      const projectData = {
        File: fileUrl,
        FileName: projectName,
        Username: username,
        UID: uid,  // Client-side UID
        Verified: verified,
        Email: email || "",
        Download: "0"
      };

      await kv.set(["projects", projectId.toString()], projectData);
      return new Response(JSON.stringify({ status: "success", projectId: projectId.toString() }), { status: 201 });

    } catch (error) {
      console.error("Error saving project:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to save project." }), { status: 500 });
    }
  }

  if (path === "/projects" && req.method === "GET") {
    try {
      const projects: any[] = [];

      // Fetch all projects from the database
      for await (const entry of kv.list({ prefix: ["projects"] })) {
        const key = entry.key;
        const value = entry.value;
        projects.push({ projectId: key[1], ...value });
      }

      // Sort projects by projectId in descending order and limit to the latest 20
      projects.sort((a, b) => parseInt(b.projectId) - parseInt(a.projectId));
      const latestProjects = projects.slice(0, 20);

      return new Response(JSON.stringify({ status: "success", projects: latestProjects }), { status: 200 });

    } catch (error) {
      console.error("Error fetching projects:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to fetch projects." }), { status: 500 });
    }
  }

  if (path === "/delete" && req.method === "DELETE") {
    try {
      const data = await req.json();
      const { projectId, uid } = data;

      const key = ["projects", projectId];
      const result = await kv.get(key);

      if (result?.value) {
        if (result.value.UID === uid) { // Check UID from the data
          await kv.delete(key);
          return new Response(JSON.stringify({ status: "success", message: "Project deleted." }), { status: 200 });
        } else {
          return new Response(JSON.stringify({ status: "error", message: "Unauthorized." }), { status: 403 });
        }
      } else {
        return new Response(JSON.stringify({ status: "error", message: "Project not found." }), { status: 404 });
      }

    } catch (error) {
      console.error("Error deleting project:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to delete project." }), { status: 500 });
    }
  }

  if (path === "/increase" && req.method === "GET") {
    try {
      const projectId = url.searchParams.get("projectId");

      if (!projectId) {
        return new Response(JSON.stringify({ status: "error", message: "Missing projectId." }), { status: 400 });
      }

      const key = ["projects", projectId];
      const result = await kv.get(key);

      if (result?.value) {
        const downloadCount = parseInt(result.value.Download || "0", 10);
        await kv.set(key, { ...result.value, Download: (downloadCount + 1).toString() });
        return new Response(JSON.stringify({ status: "success", download: (downloadCount + 1).toString() }), { status: 200 });
      } else {
        await kv.set(key, { ...result.value, Download: "1" });
        return new Response(JSON.stringify({ status: "success", download: "1" }), { status: 200 });
      }

    } catch (error) {
      console.error("Error increasing download count:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to increase download count." }), { status: 500 });
    }
  }

  if (path === "/clean" && req.method === "GET") {
    try {
      for await (const entry of kv.list({ prefix: ["projects"] })) {
        await kv.delete(entry.key);
      }
      await kv.delete(["meta", "nextProjectId"]); // Reset the ID counter
      return new Response(JSON.stringify({ status: "success", message: "Database cleaned." }), { status: 200 });
      
    } catch (error) {
      console.error("Error cleaning database:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to clean database." }), { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});

console.log("Server running on http://localhost:8000/");
