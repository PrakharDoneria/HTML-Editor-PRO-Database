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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (path === "/save" && req.method === "POST") {
    try {
      const data = await req.json();
      const { uid } = data;

      const isBanned = await kv.get(["bannedUsers", uid]);
      if (isBanned?.value) {
        return new Response(JSON.stringify({ status: "error", message: "User is banned." }), {
          status: 403,
          headers: CORS_HEADERS,
        });
      }

      const projectId = await getNextProjectId();
      const projectData = {
        File: data.url,
        FileName: data.projectName,
        Username: data.username,
        UID: uid,
        Verified: data.verified,
        Email: data.email || "",
        Download: "0",
      };

      await kv.set(["projects", projectId.toString()], projectData);
      return new Response(JSON.stringify({ status: "success", projectId: projectId.toString() }), {
        status: 201,
        headers: CORS_HEADERS,
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", message: "Failed to save project." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
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

  if (path === "/ban" && req.method === "GET") {
    try {
      const uid = url.searchParams.get("uid");

      if (!uid) {
        return new Response(JSON.stringify({ status: "error", message: "Missing UID." }), {
          status: 400,
          headers: CORS_HEADERS,
        });
      }

      await kv.set(["bannedUsers", uid], true);
      return new Response(JSON.stringify({ status: "success", message: `User ${uid} banned.` }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", message: "Failed to ban user." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  if (path === "/unban" && req.method === "GET") {
    try {
      const uid = url.searchParams.get("uid");

      if (!uid) {
        return new Response(JSON.stringify({ status: "error", message: "Missing UID." }), {
          status: 400,
          headers: CORS_HEADERS,
        });
      }

      await kv.delete(["bannedUsers", uid]);
      return new Response(JSON.stringify({ status: "success", message: `User ${uid} unbanned.` }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", message: "Failed to unban user." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  if (path === "/rename" && req.method === "PUT") {
    try {
      const { projectId, name } = await req.json();
      const key = ["projects", projectId];
      const result = await kv.get(key);

      if (result?.value) {
        await kv.set(key, { ...result.value, FileName: name });
        return new Response(JSON.stringify({ status: "success", message: "Project renamed successfully." }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      } else {
        return new Response(JSON.stringify({ status: "error", message: "Project not found." }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", message: "Failed to rename project." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  if (path === "/projects" && req.method === "GET") {
    try {
      const projects = [];
      const limit = 20;
      const offset = parseInt(url.searchParams.get("offset") || "0", 10);

      for await (const entry of kv.list({ prefix: ["projects"] })) {
        projects.push({ projectId: entry.key[1], ...entry.value });
      }

      projects.sort((a, b) => parseInt(b.projectId) - parseInt(a.projectId));
      const paginatedProjects = projects.slice(offset, offset + limit);

      return new Response(JSON.stringify({ status: "success", projects: paginatedProjects, total: projects.length }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", message: "Failed to fetch projects." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  if (path === "/profile" && req.method === "GET") {
    try {
      const uid = url.searchParams.get("uid");
      const projects = [];

      for await (const entry of kv.list({ prefix: ["projects"] })) {
        if (entry.value.UID === uid) {
          projects.push({ projectId: entry.key[1], ...entry.value });
        }
      }

      if (projects.length === 0) {
        return new Response(JSON.stringify({ status: "error", message: "No projects found for this user." }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }

      return new Response(JSON.stringify({ status: "success", projects }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", message: "Failed to fetch user's projects." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  if (path === "/verify" && req.method === "GET") {
    try {
      const projectId = url.searchParams.get("projectId");
      const key = ["projects", projectId];
      const result = await kv.get(key);

      if (result?.value) {
        await kv.set(key, { ...result.value, Verified: true });
        return new Response(JSON.stringify({ status: "success", message: "Project verified." }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      } else {
        return new Response(JSON.stringify({ status: "error", message: "Project not found." }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", message: "Failed to verify project." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  if (path === "/info" && req.method === "GET") {
    try {
      const projectId = url.searchParams.get("projectId");
      const key = ["projects", projectId];
      const result = await kv.get(key);

      if (result?.value) {
        const { File, Email, ...projectDetails } = result.value;
        return new Response(JSON.stringify({ status: "success", projectId, ...projectDetails }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      } else {
        return new Response(JSON.stringify({ status: "error", message: "Project not found." }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", message: "Failed to fetch project details." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  if (path === "/leaderboard" && req.method === "GET") {
    try {
      const projects = [];
      for await (const entry of kv.list({ prefix: ["projects"] })) {
        projects.push({ projectId: entry.key[1], ...entry.value });
      }

      projects.sort((a, b) => parseInt(b.Download) - parseInt(a.Download));
      const topProjects = projects.slice(0, 10);

      return new Response(JSON.stringify({ status: "success", projects: topProjects }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", message: "Failed to fetch leaderboard." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  if (path.startsWith("/del/") && req.method === "GET") {
  const projectId = path.split("/")[2];

  if (!projectId) {
    return new Response(JSON.stringify({ status: "error", message: "Missing projectId." }), { 
      status: 400,
      headers: CORS_HEADERS 
    });
  }

  const key = ["projects", projectId];
  const result = await kv.get(key);

  if (result?.value) {
    await kv.delete(key);
    return new Response(JSON.stringify({ status: "success", message: "Project deleted successfully." }), { 
      status: 200,
      headers: CORS_HEADERS 
    });
  } else {
    return new Response(JSON.stringify({ status: "error", message: "Project not found." }), { 
      status: 404,
      headers: CORS_HEADERS 
    });
  }
  }

  if (path === "/search" && req.method === "GET") {
    try {
      const query = url.searchParams.get("q");
      const projects = [];

      for await (const entry of kv.list({ prefix: ["projects"] })) {
        if (entry.value.FileName.toLowerCase().includes(query.toLowerCase())) {
          projects.push({ projectId: entry.key[1], ...entry.value });
        }
      }

      return new Response(JSON.stringify({ status: "success", projects }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: "error", message: "Failed to search projects." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  return new Response("Not Found", { status: 404 });

  Deno.cron("Reset download counts on the 1st day of every month", "0 0 1 * *", async () => {
  console.log("Resetting download counts...");
  for await (const entry of kv.list({ prefix: ["projects"] })) {
    const key = entry.key;
    const value = entry.value;
    await kv.set(key, { ...value, Download: "0" });
  }
});
