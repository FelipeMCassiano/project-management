import { IProject, ITask } from "../models/models";
import pg from "pg";

export async function createNewProject(project: IProject, pool: pg.Pool): Promise<IProject> {
    const newProject = await pool.query<IProject>(
        "INSERT INTO project (name, description, created_at) VALUES($1,$2,$3) RETURNING id, name, description, tasks, completion,",
        [project.name, project.description, new Date().toISOString()],
    );

    return newProject.rows[0];
}
export async function createNewTask(task: ITask, pool: pg.Pool): Promise<ITask> {
    const newTask = await pool.query<ITask>(
        "INSERT INTO task (name, description, created_at, project_id) RETURNING name, description, completed",
        [task.name, task.description, new Date().toISOString(), task.project_id],
    );

    await pool.query("UPDATE project SET tasks=tasks+1");

    return newTask.rows[0];
}

export async function completeTask(id: number, pool: pg.Pool) {
    await pool.query("UPDATE task SET completed=true WHERE id =$1", [id]);
}
