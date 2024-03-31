import dotenv from "dotenv";
import pg from "pg";
import express, { Request, Response } from "express";
import { IProject, ITask } from "./models/models";
import {
    completeTask,
    createNewProject,
    createNewTask,
    deleteProject,
    deleteTask,
    searchProjects,
    searchTasks,
} from "./repository/repository";

function validateProject(project: IProject): null | IProject {
    if (!project.name || !project.description) {
        return null;
    }

    if (
        project.name.length <= 1 ||
        project.description.length <= 1 ||
        project.description.length > 200 ||
        project.name.length > 50
    ) {
        return null;
    }

    return project;
}

function validateTask(task: ITask): null | ITask {
    if (!task.name || !task.description) {
        return null;
    }
    if (
        task.name.length > 50 ||
        task.name.length <= 1 ||
        task.description.length <= 1 ||
        task.project_id < 1
    ) {
        return null;
    }

    return task;
}

async function connectDb(): Promise<pg.Pool> {
    dotenv.config();
    const url =
        process.env.DATABASEURL ||
        "postgres://projectmanager:projectmanager@localhost:5432?sslmode=disable";

    const pool = new pg.Pool({ connectionString: url });
    return pool;
}

async function main() {
    const db = await connectDb();
    const pool = await db.connect();
    const port = 3000;

    const app = express();
    app.use(express.json());

    app.post("/projects/create", async (req: Request, res: Response) => {
        const request: IProject = req.body;
        const validated = validateProject(request);
        if (!validated) {
            return res.status(400).end();
        }

        const createdProject = await createNewProject(validated, pool);

        if (createdProject instanceof Error) {
            return res.status(500).json({ error: createdProject.message }).end();
        }

        return res.status(201).send(createdProject);
    });

    app.post("/projects/tasks/create", async (req: Request, res: Response) => {
        const request: ITask = req.body;
        console.log(request.project_id);

        const validated = validateTask(request);

        if (!validated) {
            return res.status(400).end();
        }

        const createdTask = await createNewTask(request, pool);

        if (createdTask instanceof Error) {
            return res.status(500).json({ error: createdTask.message }).end();
        }
        return res.status(201).send(createdTask);
    });

    app.delete("/projects/:name/delete", async (req: Request, res: Response) => {
        const name = req.params.name;

        const result = await deleteProject(name, pool);
        if (result instanceof Error) {
            return res.status(500).json({ error: result.message }).end();
        }

        return res.status(200);
    });

    app.delete("/project/:project_id/tasks/:name/delete", async (req: Request, res: Response) => {
        const name = req.params.name;
        const project_id = parseInt(req.params.project_id);

        const result = await deleteTask(project_id, name, pool);

        if (result instanceof Error) {
            return res.status(500).json({ error: result.message }).end();
        }

        return res.status(200);
    });

    app.get("projects/:project_id/tasks/:id/complete", async (req: Request, res: Response) => {
        const project_id = parseInt(req.params.project_id);

        const id = parseInt(req.params.id);

        const result = await completeTask(id, project_id, pool);

        if (result instanceof Error) {
            return res.status(500).json({ error: result.message });
        }

        return res.status(200);
    });

    app.get("projects/:project_id/tasks/:name/search", async (req: Request, res: Response) => {
        const project_id = parseInt(req.params.project_id);

        const name = req.params.name;
        const result = await searchTasks(project_id, name, pool);
        if (result instanceof Error) {
            return res.status(500).json({ error: result.message });
        }

        return res.status(200).send(result);
    });
    app.get("projects/:name/search", async (req: Request, res: Response) => {
        const name = req.params.name;

        const result = await searchProjects(name, pool);
        if (result instanceof Error) {
            return res.status(500).json({ error: result.message });
        }

        return res.status(200).send(result);
    });

    app.listen(port, () => console.log("listenin..."));
}

main();
