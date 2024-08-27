const connectToDatabase = require("../db/connect");
const User = require("../models/userModel");

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let users;

  try {
    await connectToDatabase.connect(); // Ensure the database is connected
    console.log("connected to database!");
    console.log("event", JSON.stringify(event));
    users = await User.find();

    // Your logic here, e.g., interacting with MongoDB models
  } catch (error) {
    console.error("Error in Lambda handler", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Function executed successfully!", data: users }),
  };
};
