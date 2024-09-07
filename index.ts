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
      return new Response(JSON.stringify({ status: "success", projectId: projectId.toString() }), { 
        status: 201,
        headers: CORS_HEADERS 
      });

    } catch (error) {
      console.error("Error saving project:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to save project." }), { 
        status: 500,
        headers: CORS_HEADERS 
      });
    }
  }

  if (path === "/rename" && req.method === "PUT") {
    try {
      const { projectId, name } = await req.json();

      if (!projectId || !name) {
        return new Response(JSON.stringify({ status: "error", message: "Missing projectId or name." }), { 
          status: 400,
          headers: CORS_HEADERS 
        });
      }

      const key = ["projects", projectId];
      const result = await kv.get(key);

      if (result?.value) {
        await kv.set(key, { ...result.value, FileName: name });
        return new Response(JSON.stringify({ status: "success", message: "Project renamed successfully." }), { 
          status: 200,
          headers: CORS_HEADERS 
        });
      } else {
        return new Response(JSON.stringify({ status: "error", message: "Project not found." }), { 
          status: 404,
          headers: CORS_HEADERS 
        });
      }

    } catch (error) {
      console.error("Error renaming project:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to rename project." }), { 
        status: 500,
        headers: CORS_HEADERS 
      });
    }
  }


  if (path === "/projects" && req.method === "GET") {
    try {
      const projects: any[] = [];
      const limit = 20;
      const offset = parseInt(url.searchParams.get("offset") || "0", 10);

      for await (const entry of kv.list({ prefix: ["projects"] })) {
        const key = entry.key;
        const value = entry.value;
        projects.push({ projectId: key[1], ...value });
      }

      projects.sort((a, b) => parseInt(b.projectId) - parseInt(a.projectId));
      const paginatedProjects = projects.slice(offset, offset + limit);

      return new Response(JSON.stringify({ status: "success", projects: paginatedProjects }), { 
        status: 200,
        headers: CORS_HEADERS 
      });

    } catch (error) {
      console.error("Error fetching projects:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to fetch projects." }), { 
        status: 500,
        headers: CORS_HEADERS 
      });
    }
  }

    if (path === "/profile" && req.method === "GET") {
    try {
      const uid = url.searchParams.get("uid");

      if (!uid) {
        return new Response(JSON.stringify({ status: "error", message: "Missing UID." }), { 
          status: 400,
          headers: CORS_HEADERS 
        });
      }

      const projects: any[] = [];
      for await (const entry of kv.list({ prefix: ["projects"] })) {
        const key = entry.key;
        const value = entry.value;

        if (value.UID === uid) {
          projects.push({ projectId: key[1], ...value });
        }
      }

      if (projects.length === 0) {
        return new Response(JSON.stringify({ status: "error", message: "No projects found for this user." }), { 
          status: 404,
          headers: CORS_HEADERS 
        });
      }

      return new Response(JSON.stringify({ status: "success", projects }), { 
        status: 200,
        headers: CORS_HEADERS 
      });

    } catch (error) {
      console.error("Error fetching user's projects:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to fetch user's projects." }), { 
        status: 500,
        headers: CORS_HEADERS 
      });
    }
    }
  

  if (path === "/verify" && req.method === "GET") {
    try {
        const projectId = url.searchParams.get("projectId");

        if (!projectId) {
            return new Response(JSON.stringify({ status: "error", message: "Missing projectId." }), { 
                status: 400,
                headers: CORS_HEADERS 
            });
        }

        const key = ["projects", projectId];
        const result = await kv.get(key);

        if (result?.value) {
            await kv.set(key, { ...result.value, Verified: true });
            return new Response(JSON.stringify({ status: "success", message: "Project verified." }), { 
                status: 200,
                headers: CORS_HEADERS 
            });
        } else {
            return new Response(JSON.stringify({ status: "error", message: "Project not found." }), { 
                status: 404,
                headers: CORS_HEADERS 
            });
        }

    } catch (error) {
        console.error("Error verifying project:", error);
        return new Response(JSON.stringify({ status: "error", message: "Failed to verify project." }), { 
            status: 500,
            headers: CORS_HEADERS 
        });
    }
  }

  if (path === "/info" && req.method === "GET") {
    try {
      const projectId = url.searchParams.get("projectId");

      if (!projectId) {
        return new Response(JSON.stringify({ status: "error", message: "Missing projectId." }), { 
          status: 400,
          headers: CORS_HEADERS 
        });
      }

      const key = ["projects", projectId];
      const result = await kv.get(key);

      if (result?.value) {
        const { File, Email, ...projectDetails } = result.value;
        const response = {
          status: "success",
          projectId: projectId,
          ...projectDetails
        };
        return new Response(JSON.stringify(response), { 
          status: 200,
          headers: CORS_HEADERS 
        });
      } else {
        return new Response(JSON.stringify({ status: "error", message: "Project not found." }), { 
          status: 404,
          headers: CORS_HEADERS 
        });
      }

    } catch (error) {
      console.error("Error fetching project details:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to fetch project details." }), { 
        status: 500,
        headers: CORS_HEADERS 
      });
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

      projects.sort((a, b) => parseInt(b.Download) - parseInt(a.Download));
      const topProjects = projects.slice(0, 10);

      return new Response(JSON.stringify({ status: "success", projects: topProjects }), { 
        status: 200,
        headers: CORS_HEADERS 
      });

    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to fetch leaderboard." }), { 
        status: 500,
        headers: CORS_HEADERS 
      });
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

      return new Response(JSON.stringify({ status: "success", projects: matchingProjects }), { 
        status: 200,
        headers: CORS_HEADERS 
      });

    } catch (error) {
      console.error("Error searching projects:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to search projects." }), { 
        status: 500,
        headers: CORS_HEADERS 
      });
    }
  }

  if (path === "/delete" && req.method === "DELETE") {
    try {
        const bodyText = await req.text();  // Read the body as text
        if (!bodyText) {
            return new Response(JSON.stringify({ status: "error", message: "Missing request body." }), { 
                status: 400,
                headers: CORS_HEADERS 
            });
        }

        const data = JSON.parse(bodyText);  // Parse the JSON
        const { projectId, uid } = data;

        const key = ["projects", projectId];
        const result = await kv.get(key);

        if (result?.value) {
            if (result.value.UID === uid) {
                await kv.delete(key);
                return new Response(JSON.stringify({ status: "success", message: "Project deleted." }), { 
                    status: 200,
                    headers: CORS_HEADERS 
                });
            } else {
                return new Response(JSON.stringify({ status: "error", message: "Unauthorized." }), { 
                    status: 403,
                    headers: CORS_HEADERS 
                });
            }
        } else {
            return new Response(JSON.stringify({ status: "error", message: "Project not found." }), { 
                status: 404,
                headers: CORS_HEADERS 
            });
        }

    } catch (error) {
        console.error("Error deleting project:", error);
        return new Response(JSON.stringify({ status: "error", message: "Failed to delete project." }), { 
            status: 500,
            headers: CORS_HEADERS 
        });
    }
  }
  

  if (path === "/increase" && req.method === "GET") {
    try {
      const projectId = url.searchParams.get("projectId");

      if (!projectId) {
        return new Response(JSON.stringify({ status: "error", message: "Missing projectId." }), { 
          status: 400,
          headers: CORS_HEADERS 
        });
      }

      const key = ["projects", projectId];
      const result = await kv.get(key);

      if (result?.value) {
        const downloadCount = parseInt(result.value.Download || "0", 10);
        await kv.set(key, { ...result.value, Download: (downloadCount + 1).toString() });
        return new Response(JSON.stringify({ status: "success", download: (downloadCount + 1).toString() }), { 
          status: 200,
          headers: CORS_HEADERS 
        });
      } else {
        await kv.set(key, { ...result.value, Download: "1" });
        return new Response(JSON.stringify({ status: "success", download: "1" }), { 
          status: 200,
          headers: CORS_HEADERS 
        });
      }

    } catch (error) {
      console.error("Error increasing download count:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to increase download count." }), { 
        status: 500,
        headers: CORS_HEADERS 
      });
    }
  }

  if (path === "/clean" && req.method === "GET") {
    try {
      for await (const entry of kv.list({ prefix: ["projects"] })) {
        await kv.delete(entry.key);
      }
      await kv.delete(["meta", "nextProjectId"]);
      return new Response(JSON.stringify({ status: "success", message: "Database cleaned." }), { 
        status: 200,
        headers: CORS_HEADERS 
      });
      
    } catch (error) {
      console.error("Error cleaning database:", error);
      return new Response(JSON.stringify({ status: "error", message: "Failed to clean database." }), { 
        status: 500,
        headers: CORS_HEADERS 
      });
    }
  }

  return new Response("Not Found", { 
    status: 404,
    headers: CORS_HEADERS 
  });
});

Deno.cron("Reset download counts", "0 0 1 * *", async () => {
  console.log("Resetting download counts...");
  for await (const entry of kv.list({ prefix: ["projects"] })) {
    const key = entry.key;
    const value = entry.value;
    await kv.set(key, { ...value, Download: "0" });
  }
});

console.log("Server running on http://localhost:8000/");

});
