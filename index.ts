import express from "npm:express@4";

const app = express();
app.use(express.json());

const PORT = 8000;

// Initialize the KV store
const kv = await openKv();

// Function to get the next available project ID
async function getNextProjectId(): Promise<number> {
  const idKey = ["meta", "nextProjectId"];
  const result = await kv.get(idKey);
  const nextId = result.value || 0;
  await kv.set(idKey, nextId + 1);  // Increment for next use
  return nextId;
}

app.post("/save", async (req, res) => {
  try {
    const data = req.body;
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

    res.status(201).json({ status: "success", projectId: projectId.toString() });
  } catch (error) {
    console.error("Error saving project:", error);
    res.status(500).json({ status: "error", message: "Failed to save project." });
  }
});

app.get("/projects", async (req, res) => {
  try {
    const startAfter = req.query.startAfter || "0";
    const startKey = ["projects", startAfter];
    const projects: any[] = [];
    
    for await (const [key, value] of kv.list({ prefix: ["projects"], startAfter: startKey, limit: 20 })) {
      projects.push({ projectId: key[1], ...value });
    }

    res.status(200).json({ status: "success", projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch projects." });
  }
});

app.delete("/delete", async (req, res) => {
  try {
    const { projectId, uid } = req.body;

    const key = ["projects", projectId];
    const result = await kv.get(key);

    if (result.value) {
      if (result.value.UID === uid) {  // Check UID from the data
        await kv.delete(key);
        res.status(200).json({ status: "success", message: "Project deleted." });
      } else {
        res.status(403).json({ status: "error", message: "Unauthorized." });
      }
    } else {
      res.status(404).json({ status: "error", message: "Project not found." });
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ status: "error", message: "Failed to delete project." });
  }
});

app.get("/increase", async (req, res) => {
  try {
    const projectId = req.query.projectId;

    if (!projectId) {
      res.status(400).json({ status: "error", message: "Missing projectId." });
      return;
    }

    const key = ["projects", projectId];
    const result = await kv.get(key);

    if (result.value) {
      const downloadCount = parseInt(result.value.Download || "0", 10);
      await kv.set(key, { ...result.value, Download: (downloadCount + 1).toString() });

      res.status(200).json({ status: "success", download: (downloadCount + 1).toString() });
    } else {
      await kv.set(key, { ...result.value, Download: "1" });
      res.status(200).json({ status: "success", download: "1" });
    }
  } catch (error) {
    console.error("Error increasing download count:", error);
    res.status(500).json({ status: "error", message: "Failed to increase download count." });
  }
});

app.get("/clean", async (req, res) => {
  try {
    for await (const [key] of kv.list({ prefix: ["projects"] })) {
      await kv.delete(key);
    }
    await kv.delete(["meta", "nextProjectId"]);  // Reset the ID counter
    res.status(200).json({ status: "success", message: "Database cleaned." });
  } catch (error) {
    console.error("Error cleaning database:", error);
    res.status(500).json({ status: "error", message: "Failed to clean database." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/`);
});
