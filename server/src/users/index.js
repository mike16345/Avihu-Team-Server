const db = require("./db/connect"); // Assuming you have a separate module for the DB connection
const { UserController } = require("./controllers/usersController");
const { StatusCode } = require("./enums/StatusCode");

const BASE_PATH = "/users";
const userApiHandlers = {
  [`GET ${BASE_PATH}`]: UserController.getUsers, // Get all users
  [`GET ${BASE_PATH}/one`]: UserController.getUser, // Get user by ID
  [`GET ${BASE_PATH}/email`]: UserController.getUserByEmail, // Get user by email
  [`PUT ${BASE_PATH}/one`]: UserController.updateUser, // Update user by ID
  [`PUT ${BASE_PATH}/bulk`]: UserController.updateManyUsers, // Update users (bulk)
  [`POST ${BASE_PATH}`]: UserController.addUser, // Add new user
  [`DELETE ${BASE_PATH}/one`]: UserController.deleteUser, // Delete user by ID
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await db.connect(); // Ensure the database is connected
    console.log("Connected to database!");
    console.log("event", JSON.stringify(event));

    const { httpMethod, path } = event;

    // Build the route key for userApiHandlers
    const routeKey = `${httpMethod} ${path}`;

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
