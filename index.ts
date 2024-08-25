import { serve } from "https://deno.land/std@0.195.0/http/server.ts";

const kv = await Deno.openKv();

interface Project {
  url: string;
  projectName: string;
  username: string;
  uid: string;
  verified: boolean;
  email: string;
}

const PAGE_SIZE = 20;

serve(async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (req.method === "POST" && pathname === "/save") {
    const { url, projectName, username, uid, verified, email } = await req.json();

    const project: Project = {
      url,
      projectName,
      username,
      uid,
      verified,
      email,
    };

    const key = generateKey(uid);
    await kv.set(key, project);

    return new Response("Project saved successfully", { status: 201 });
  }

  if (req.method === "POST" && pathname === "/bulk-save") {
    const projects: Project[] = await req.json();

    for (const project of projects) {
      const key = generateKey(project.uid);
      await kv.set(key, project);
    }

    return new Response("Projects saved successfully", { status: 201 });
  }

  if (req.method === "GET" && pathname === "/projects") {
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const startIndex = (page - 1) * PAGE_SIZE;

    const iter = kv.list<Project>({ prefix: [] }); // Use a proper prefix if needed

    const projects: Project[] = [];
    let currentIndex = 0;

    for await (const entry of iter) {
      if (currentIndex >= startIndex) {
        projects.push(entry.value);
        if (projects.length >= PAGE_SIZE) break;
      }
      currentIndex++;
    }

    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE" && pathname === "/delete") {
    const { projectID, uid } = await req.json();
    const key = generateKey(projectID);
    const result = await kv.get<Project>(key);

    if (result.value && result.value.uid === uid) {
      await kv.delete(key);
      return new Response("Project deleted successfully", { status: 200 });
    } else {
      return new Response("Project not found or unauthorized", { status: 404 });
    }
  }

  return new Response("Not Found", { status: 404 });
});

const generateKey = (projectID: string) => ["projects", projectID];
