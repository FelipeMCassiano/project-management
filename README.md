<div align='center'>
  <h1>project-management</h1>
  <p> 
The Project Management API is a RESTful web service designed to facilitate the management of projects and tasks. It provides a set of endpoints for creating, deleting, searching, and completing tasks within the context of projects. </p>
  <img src='https://img.shields.io/github/languages/top/FelipeMCassiano/project-management' />
  <img src='https://img.shields.io/github/last-commit/FelipeMCassiano/project-management' />
</div>

### Features
1. [x] Path `POST /projects/create` This path create a new project. Requires a JSON body with these specific fields
```
{
  "name": "example-name",
  "description": "example-description"
}
```
  - `name`: Name of the project
  - `description`: Description of the project

2. [x] Path `Post /projects/tasks/create` This path create a new project. Requires a JSON body with these specifics fields.
```
{
  "name": "example-name",
  "description": "example description",
  "project_id": 1
}
```
  - `name`: Name of the task,
  - `description`: Description of the tasks,
  - `project_id`: Respective project that task gonna be related

3. [x] Path `DELETE /projects/[name]/delete`. This path delete a project. The `[name]` parameter in the path indicates which project to delete.

4. [x] Path `DELETE /projects/[project_id]/tasks/[name]/delete`. This path delete a task. The `[project_id]` parameter in the path indicates which project the task is related and `[name]` indicates which task to delete.
5. [x] Path `GET /projects/[project_id]/tasks/[name]/search`. This path search a task. The `[project_id]` parameter in the path indicates which project the task is related `[name]` indicates which task to search.
6. [x] Path `GET /projects/[name]/search`. This path search a task. The `[name]` parameter in the path indicates which project to search.
7. [x] Path `GET /projects/[project_id]/tasks/[id]/complete. This path complete a task. `[project_id] parameter in the path indicates which project the task is related and [id] indicates which task to complete

## How to install and run
1. Clone the repository
2. Execute docker-compose up

```
git clone git@github.com:FelipeMCassiano/project-management.git (SSH)

docker-compose up
```
## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


