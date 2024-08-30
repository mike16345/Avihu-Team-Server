const { connectToDatabase } = require("./db/connect"); // Assuming you have a separate module for the DB connection
const { UserController } = require("./controllers/usersController");
const { StatusCode } = require("./enums/StatusCode");

const BASE_PATH = "/Users";
const userApiHandlers = {
  "GET /": UserController.getUsers, // Get all users
  "PUT /:id": UserController.updateUser, // Update user by ID
  "PUT /bulk": UserController.updateManyUsers, // Update users (bulk)
  "POST /": UserController.addUser, // Add new user
  "GET /:id": UserController.getUser, // Get user by ID
  "DELETE /:id": UserController.deleteUser, // Delete user by ID
  "GET /email/:email": UserController.getUserByEmail, // Get user by email
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectToDatabase.connect(); // Ensure the database is connected
    console.log("Connected to database!");
    console.log("event", JSON.stringify(event));

    const { httpMethod, path } = event;

    // Build the route key for userApiHandlers
    const routeKey = `${httpMethod} ${path.replace(BASE_PATH, "")}`;

    // Identify the matching route from userApiHandlers
    const handlerFunction = userApiHandlers[routeKey];

    if (!handlerFunction) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({ message: "Route not found" }),
      };
    }

    // Run the matched handler function
    return await handlerFunction(event, context);
  } catch (error) {
    console.error("Error in Lambda handler", error);
    return {
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
