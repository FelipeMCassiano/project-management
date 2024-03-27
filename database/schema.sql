CREATE TABLE project (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPZ NOT NULL DEFAULT NOW(),
    tasks INTEGER DEFAULT 0,
    completion INTEGER DEFAULT 0
);

CREATE TABLE task (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    project_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at  TIMESTAMPZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPZ,
    completd BOOLEAN,
    CONSTRAINT fk_projects_tasks_id FOREIGN KEY(project_id) REFERENCES project(id)
);
