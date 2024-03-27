export interface IProject {
    id?: number;
    name: string;
    description: string;
    created_at?: Date;
    tasks?: number;
    completion: number;
}
export interface ITask {
    id?: number;
    name: string;
    project_id: number;
    description: string;
    created_at?: Date;
    completed_at?: Date;
    completed: Boolean;
}
