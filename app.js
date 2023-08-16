const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initiliaseDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`Db Error: ${error.message}`);
    process.exit(1);
  }
};

initiliaseDbAndServer();

const hasPriorityAndStatusPropertis = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = () => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", status, priority } = request.query;
  switch (true) {
    case hasPriorityAndStatusPropertis(request.query):
      getTodosQuery = `
            SELECT * FROM
            todo 
            WHERE 
            todo like '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT * FROM
            todo 
            WHERE 
            todo like '%${search_q}%'
            AND priority = '${priority}'`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT * FROM
            todo 
            WHERE 
            todo like '%${search_q}%'
            AND status = '${status}';`;

      break;
    default:
      getTodosQuery = `
            SELECT * FROM
            todo 
            WHERE 
            todo like '%${search_q}%'`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    select * from todo
    where id = ${todoId};`;
  const data = await db.get(getTodoQuery);
  response.send(data);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
INSERT INTO todo (id,todo,priority,status)
values
(${id},'${todo}','${priority}','${status}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "todo";
      break;
  }
  const previousTodoQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  response.send(`${updateColumn} Updated`);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoQuery = `UPDATE todo
  SET 
  todo = '${todo}',
  status = '${status}',
  priority = '${priority}'
  WHERE ID = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send("Todo Updated");
});

//delete
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
