import { serve } from "https://deno.land/std/http/server.ts";

const kv = await Deno.openKv();

// Initialize projects to ensure each has a 'download' key
async function initializeProjects() {
  const iterator = kv.list({ prefix: ["projects"] });
  for await (const { key, value } of iterator) {
    if (!value.download) {
      await kv.set(key, { ...value, download: "0" });
    }
  }
}

// Call the initialization function when the server starts
await initializeProjects();

async function handleRequest(req: Request) {
  const url = new URL(req.url);
  const { pathname, searchParams } = url;

  if (pathname === "/save" && req.method === "POST") {
    const body = await req.json();
    const {
      url,
      projectName,
      username,
      uid,
      verified,
      email,
      projectId
    } = body;

    const key = ["projects", projectId];
    const value = {
      url,
      projectName,
      username,
      verified,
      email,
      download: "0", // Initialize download count
      projectId
    };
    await kv.set(key, value);

    return new Response("Project saved successfully", { status: 200 });
  }

  if (pathname === "/projects" && req.method === "GET") {
    const startAfter = parseInt(searchParams.get("startAfter") || "0", 10);
    const limit = 20;

    const iterator = kv.list({ prefix: ["projects"], start: startAfter.toString(), end: (startAfter + limit).toString() });
    const projects = [];

    for await (const { key, value } of iterator) {
      projects.push(value);
    }

    return new Response(JSON.stringify(projects), { status: 200 });
  }

  if (pathname === "/delete" && req.method === "DELETE") {
    const { projectId, uid } = await req.json();
    const key = ["projects", projectId];
    const project = await kv.get(key);

    if (project.value && project.value.uid === uid) {
      await kv.delete(key);
      return new Response("Project deleted successfully", { status: 200 });
    } else {
      return new Response("Unauthorized or project not found", { status: 404 });
    }
  }

  if (pathname === "/increase" && req.method === "GET") {
    const projectId = searchParams.get("projectId");
    const key = ["projects", projectId];

    const project = await kv.get(key);
    if (project.value) {
      const downloadCount = parseInt(project.value.download || "0", 10);
      await kv.set(key, { ...project.value, download: (downloadCount + 1).toString() });
      return new Response("Download count increased", { status: 200 });
    } else {
      // If the download key does not exist, initialize it
      const value = {
        ...project.value,
        download: "1"
      };
      await kv.set(key, value);
      return new Response("Download count initialized and increased", { status: 200 });
    }
  }

  return new Response("Not Found", { status: 404 });
}

serve(handleRequest);
