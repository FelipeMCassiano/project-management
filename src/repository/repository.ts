import { IProject, IProjectSearch, ITask, ITaskSearch } from "../models/models";
import pg from "pg";

export async function createNewProject(
    project: IProject,
    pool: pg.PoolClient,
): Promise<IProject | Error> {
    await pool.connect();
    try {
        await pool.query("BEGIN");
        const newProject = await pool.query<IProject>(
            "INSERT INTO project (name, description, created_at) VALUES($1,$2,$3) RETURNING id, name, description, tasks, completion,",
            [project.name, project.description, new Date().toISOString()],
        );

        await pool.query("COMMIT");

        return newProject.rows[0];
    } catch (err: any) {
        await pool.query("ROLLBACK");
        return new Error(`Failed to create project: ${err.message}`);
    } finally {
        pool.release();
    }
}

export async function createNewTask(
    id: number,
    task: ITask,
    pool: pg.PoolClient,
): Promise<ITask | Error> {
    await pool.connect();
    try {
        await pool.query("BEGIN");
        const newTask = await pool.query<ITask>(
            "INSERT INTO task (name, description, created_at, project_id) RETURNING name, description, completed",
            [task.name, task.description, new Date().toISOString(), task.project_id],
        );

        await pool.query("UPDATE project SET tasks=tasks+1 WHERE id=$1", [id]);
        await pool.query("UPDATE project SET incompleted_tasks= incompleted_tasks+1 WHERE id=1", [
            id,
        ]);

        const completion = await getProjectCompletion(id, pool);

        await pool.query("UPDATE project SET completion= $1 WHERE id=$2", [completion, id]);

        await pool.query("COMMIT");

        return newTask.rows[0];
    } catch (err: any) {
        await pool.query("ROLLBACK");
        return new Error(`Failed to create task: ${err.message}`);
    } finally {
        pool.release();
    }
}

async function getProjectCompletion(id: number, pool: pg.PoolClient): Promise<number> {
    const rows = await pool.query<Boolean>("SELECT completed  WHERE project_id=$1", [id]);

    if (!rows.rowCount) {
        return 0;
    }

    let allTasks = rows.rows.length;
    let completedTasks = 0;

    for (const row of rows.rows) {
        if (row) {
            completedTasks++;
        }
    }
    const completion = Math.floor((100 * completedTasks) / allTasks);

    return completion;
}
export async function completeTask(
    id: number,
    project_id: number,
    pool: pg.PoolClient,
): Promise<undefined | Error> {
    await pool.connect();
    try {
        await pool.query("UPDATE task SET completed=true WHERE id =$1", [id]);

        await pool.query("UPDATE project SET incompleted_tasks=incompleted_tasks-1 WHERE id=$1", [
            project_id,
        ]);

        await pool.query("UPDATE project SET completed_tasks=completed_tasks+1 WHERE id=$1", [
            project_id,
        ]);
        return;
    } catch (err: any) {
        return new Error(`Failed complete: ${err.message}`);
    } finally {
        pool.release();
    }
}

export async function deleteProject(name: string, pool: pg.PoolClient): Promise<undefined | Error> {
    await pool.connect();
    try {
        if (name) {
            await pool.query("DELETE project WHERE name=$1", [name]);
            pool.release();
            return;
        }
        return Error("name not provided");
    } catch (err: any) {
        return new Error(`Failed to delete project: ${err.message}`);
    } finally {
        pool.release();
    }
}

export async function deleteTask(
    project_id: number,
    name: string,
    pool: pg.PoolClient,
): Promise<undefined | Error> {
    await pool.connect();
    try {
        const rows = await pool.query("SELECT name FROM projects WHERE id=$1", [project_id]);

        if (!rows.rowCount) {
            throw new Error("cannot find project");
        }

        if (name) {
            await pool.query("DELETE task WHERE name=$1", [name]);
            return;
        }

        return Error("id and name not provided");
    } catch (err: any) {
        return new Error(`Failed to delete task: ${err.message}`);
    } finally {
        pool.release();
    }
}

export async function searchProjects(
    name: string,
    pool: pg.PoolClient,
): Promise<IProjectSearch[] | Error> {
    await pool.connect();
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
    pool: pg.PoolClient,
): Promise<ITaskSearch[] | Error> {
    await pool.connect();
    try {
        const rows = await pool.query<ITaskSearch>(
            "SELECT name, description, created_at, completed_at completed FROM task WHERE project_id=$1 AND name ILIKE '%' || $1 || '%'",
            [project_id, name],
        );

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
