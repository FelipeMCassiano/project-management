export interface IProject {
    name?: string;
    description?: string;
}

export interface IProjectSearch {
    name: string;
    description: string;
    created_at: Date;
    completion: number;
    completed_tasks: number;
    incompleted_tasks: number;
}

export interface ITask {
    name?: string;
    project_id: number;
    description?: string;
}

export interface ITaskSearch {
    name: string;
    description: string;
    created_at: Date;
    completed_at: Date;
    completed: Boolean;
}
