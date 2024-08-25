import { serve } from "https://deno.land/std@0.167.0/http/server.ts";
import { v4 } from "https://deno.land/std@0.167.0/uuid/mod.ts";

const kv = await Deno.openKv();

async function getNextProjectId(): Promise<number> {
  const idKey = ["meta", "nextProjectId"];
  const result = await kv.get(idKey);
  const nextId = result?.value || 0;
  await kv.set(idKey, nextId + 1);
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
        UID: uid,
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

  if (path === "/projects" && req.method === "GET") {
    try {
      const projects: any[] = [];

      // Fetch all projects and sort them by projectId in descending order
      for await (const [key, value] of kv.list({ prefix: ["projects"] })) {
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
    
  if (path === "/leaderboard" && req.method === "GET") {
    try {
      const projects: any[] = [];
      for await (const entry of kv.list({ prefix: ["projects"] })) {
        const key = entry.key;
        const value = entry.value;
        projects.push({ projectId: key[1], ...value });
      }

      projects.sort((a, b) => parseInt(a.Download) - parseInt(b.Download));
      const topProjects = projects.slice(0, 10);

      return new Response(JSON.stringify({ status: "success", projects: topProjects }), { status: 200 });

    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to fetch leaderboard." }), { status: 500 });
    }
  }

  if (path === "/search" && req.method === "GET") {
    try {
      const query = (url.searchParams.get("q") || "").toLowerCase();
      const projects: any[] = [];
      
      for await (const entry of kv.list({ prefix: ["projects"] })) {
        const key = entry.key;
        const value = entry.value;
        const fileName = value.FileName.toLowerCase();
        const username = value.Username.toLowerCase();
        const email = value.Email.toLowerCase();

        if (fileName.includes(query) || username.includes(query) || email.includes(query)) {
          projects.push({ projectId: key[1], ...value });
        }
      }

      const matchingProjects = projects.slice(0, 25);

      return new Response(JSON.stringify({ status: "success", projects: matchingProjects }), { status: 200 });

    } catch (error) {
      console.error("Error searching projects:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to search projects." }), { status: 500 });
    }
  }

  if (path === "/delete" && req.method === "DELETE") {
    try {
      const data = await req.json();
      const { projectId, uid } = data;

      const key = ["projects", projectId];
      const result = await kv.get(key);

      if (result?.value) {
        if (result.value.UID === uid) {
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
      await kv.delete(["meta", "nextProjectId"]);
      return new Response(JSON.stringify({ status: "success", message: "Database cleaned." }), { status: 200 });
      
    } catch (error) {
      console.error("Error cleaning database:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to clean database." }), { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});

console.log("Server running on http://localhost:8000/");
