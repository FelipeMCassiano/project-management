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
} from "./repository/repository";

async function connectDb(): Promise<pg.Pool> {
    dotenv.config();
    const url = process.env.DATABASEURL;

    const pool = new pg.Pool({ connectionString: url });
    return pool;
}

async function main() {
    const db = await connectDb();
    const pool = await db.connect();

    const app = express();
    app.use(express.json());

    app.post("/projects/create", async (req: Request, res: Response) => {
        const request: IProject = req.body;

        const createdProject = await createNewProject(request, pool);

        if (createdProject instanceof Error) {
            return res.status(500).json({ error: createdProject.message }).end();
        }

        return res.status(201).send(createNewTask);
    });

    app.post("/projects/:id/tasks/create", async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);

        const request: ITask = req.body;

        const createdTask = await createNewTask(id, request, pool);

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
}

main();
