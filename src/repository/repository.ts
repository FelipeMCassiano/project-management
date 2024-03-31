import { IProject, IProjectSearch, ITask, ITaskSearch } from "../models/models";
import pg from "pg";

export async function createNewProject(
    project: IProject,
    pgPool: pg.Pool,
): Promise<IProject | Error> {
    const pool = await pgPool.connect();
    try {
        await pool.query("BEGIN");
        const newProject = await pool.query<IProject>(
            "INSERT INTO project (name, description, created_at) VALUES($1,$2,$3) RETURNING id, name, description, tasks, completion",
            [project.name, project.description, new Date().toISOString()],
        );

        await pool.query("COMMIT");

        return newProject.rows[0];
    } catch (err: any) {
        await pool.query("ROLLBACK");
        return new Error(`Failed to create project: ${err.message}`);
    }
}

export async function createNewTask(task: ITask, pgPool: pg.Pool): Promise<ITask | Error> {
    const pool = await pgPool.connect();
    try {
        await pool.query("BEGIN");
        const newTask = await pool.query<ITask>(
            "INSERT INTO task (name, description, created_at, project_id) VALUES ($1,$2,$3,$4) RETURNING name, description , completed",
            [task.name, task.description, new Date().toISOString(), task.project_id],
        );

        await pool.query("UPDATE project SET tasks=tasks+1 WHERE id=$1", [task.project_id]);
        await pool.query("UPDATE project SET incompleted_tasks= incompleted_tasks+1 WHERE id=$1", [
            task.project_id,
        ]);

        const completion = await getProjectCompletion(task.project_id, pool);

        await pool.query("UPDATE project SET completion=$1 WHERE id=$2", [
            completion,
            task.project_id,
        ]);

        await pool.query("COMMIT");

        return newTask.rows[0];
    } catch (err: any) {
        await pool.query("ROLLBACK");
        return new Error(`Failed to create task: ${err.message}`);
    } finally {
        pool.release();
    }
}

interface ICompletion {
    name: string;
    completed: boolean;
}

async function getProjectCompletion(id: number, pool: pg.PoolClient): Promise<number> {
    const rows = await pool.query<ICompletion>(
        "SELECT name,completed  FROM task WHERE project_id=$1",
        [id],
    );

    if (!rows.rowCount) {
        return 0;
    }

    let allTasks = rows.rows.length;
    let completedTasks = 0;

    for (const row of rows.rows) {
        if (row.completed) {
            completedTasks++;
        }
    }
    console.log("completedTasks", completedTasks);
    console.log("all task", allTasks);
    const completion = Math.floor((completedTasks / allTasks) * 100);
    console.log(completion);

    return completion;
}
export async function completeTask(
    id: number,
    project_id: number,
    pgPool: pg.Pool,
): Promise<undefined | Error> {
    const pool = await pgPool.connect();
    try {
        await pool.query("BEGIN");
        await pool.query("UPDATE task SET completed=true WHERE id =$1", [id]);

        await pool.query("UPDATE project SET incompleted_tasks=incompleted_tasks-1 WHERE id=$1", [
            project_id,
        ]);

        await pool.query("UPDATE project SET completed_tasks=completed_tasks+1 WHERE id=$1", [
            project_id,
        ]);

        const completion = await getProjectCompletion(project_id, pool);

        await pool.query("UPDATE project SET completion=$1 WHERE id=$2", [completion, project_id]);

        await pool.query("COMMIT");
        return;
    } catch (err: any) {
        await pool.query("ROLLBACK");
        return new Error(`Failed complete: ${err.message}`);
    } finally {
        pool.release();
    }
}

export async function deleteProject(name: string, pgPool: pg.Pool): Promise<undefined | Error> {
    const pool = await pgPool.connect();
    try {
        if (name) {
            await pool.query("DELETE FROM project WHERE name=$1", [name]);
            return;
        }
        return Error("name not provided");
    } catch (err: any) {
        return new Error(`Failed to delete project: ${err.message}`);
    } finally {
        pool.release();
    }
}
interface IdeleteTask {
    project_id: number;
    name: string;
}

export async function deleteTask(
    project_id: number,
    name: string,
    pgPool: pg.Pool,
): Promise<void | Error> {
    const pool = await pgPool.connect();
    try {
        if (!name || !project_id) {
            return new Error("id and name not provided");
        }

        const rows = await pool.query<IdeleteTask>(
            "DELETE FROM task WHERE project_id=$1 AND name=$2",
            [project_id, name],
        );

        if (!rows.rowCount) return new Error("task already deleted");
        return;
    } catch (err: any) {
        return new Error(`Failed to delete task: ${err.message}`);
    } finally {
        pool.release(); // Release the connection back to the pool
    }
}

export async function searchProjects(
    name: string,
    pgPool: pg.Pool,
): Promise<IProjectSearch[] | Error> {
    const pool = await pgPool.connect();
    try {
        const rows = await pool.query<IProjectSearch>(
            "SELECT name, description, created_at, completion, completed_tasks, incompleted_tasks FROM project WHERE name ILIKE '%' || $1 || '%'",
            [name],
        );

        if (!rows.rowCount) {
            return Error(`Not found project with name ${name}`);
        }

        return rows.rows;
    } catch (err: any) {
        return new Error(`Failed to search project: ${err.message}`);
    } finally {
        pool.release();
    }
}

export async function searchTasks(
    project_id: number,
    name: string,
    pgPool: pg.Pool,
): Promise<ITaskSearch[] | Error> {
    const pool = await pgPool.connect();
    try {
        const rows = await pool.query<ITaskSearch>(
            "SELECT name, description, created_at, completed_at completed FROM task WHERE project_id=$1 AND name ILIKE '%' || $2 || '%'",
            [project_id, name],
        );
        console.log(rows.rows[0].completed);

        if (!rows.rowCount) {
            return new Error(`Not found tasks with name ${name}`);
        }

        return rows.rows;
    } catch (err: any) {
        return new Error(`Failed to search task: ${err.message}`);
    } finally {
        pool.release();
    }
}
