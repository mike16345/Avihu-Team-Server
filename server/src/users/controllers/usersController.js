const { StatusCode } = require("../enums/StatusCode");
const UserService = require("../services/usersService");

class UserController {
  static async addUser(event, context) {
    try {
      const user = await UserService.createUser(JSON.parse(event.body));

      return {
        statusCode: StatusCode.CREATED,
        body: JSON.stringify({
          message: "User created successfully!",
          data: user,
        }),
      };
    } catch (err) {
      return {
        statusCode: StatusCode.BAD_REQUEST,
        body: JSON.stringify({
          message: "Error creating user",
          error: err.message,
        }),
      };
    }
  }

  static async getUsers(event, context) {
    try {
      const users = await UserService.getUsers();
      
      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "Users retrieved successfully!",
          data: users,
        }),
      };
    } catch (err) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({
          message: "Error retrieving users",
          error: err.message,
        }),
      };
    }
  }

  static async getUser(event, context) {
    try {
      const id = event.queryStringParameters.userId;
      const user = await UserService.getUser(id);

      if (!user) {
        return {
          statusCode: StatusCode.NOT_FOUND,
          body: JSON.stringify({ message: "User not found" }),
        };
      }

      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "User retrieved successfully!",
          data: user,
        }),
      };
    } catch (err) {
      return {
        statusCode: StatusCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: "Error retrieving user",
          error: err.message,
        }),
      };
    }
  }

  static async getUserByEmail(event, context) {
    try {
      const email = event.queryStringParameters.email;
      const user = await UserService.getUserByEmail(email);

      if (!user) {
        return {
          statusCode: StatusCode.NOT_FOUND,
          body: JSON.stringify({ message: "User not found" }),
        };
      }

      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "User retrieved successfully!",
          data: user,
        }),
      };
    } catch (err) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({
          message: "Error retrieving user",
          error: err.message,
        }),
      };
    }
  }

  static async updateUser(event, context) {
    try {
      const id = event.queryStringParameters.id;
      const user = await UserService.updateUser(JSON.parse(event.body), id);

      if (!user) {
        return {
          statusCode: StatusCode.NOT_FOUND,
          body: JSON.stringify({ message: "User not found" }),
        };
      }

      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "User updated successfully!",
          data: user,
        }),
      };
    } catch (err) {
      return {
        statusCode: StatusCode.BAD_REQUEST,
        body: JSON.stringify({
          message: "Error updating user",
          error: err.message,
        }),
      };
    }
  }

  static async updateManyUsers(event, context) {
    try {
      const users = await UserService.updateManyUsers(JSON.parse(event.body));

      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "Users updated successfully!",
          data: users,
        }),
      };
    } catch (err) {
      return {
        statusCode: StatusCode.BAD_REQUEST,
        body: JSON.stringify({
          message: "Error updating users",
          error: err.message,
        }),
      };
    }
  }

  static async deleteUser(event, context) {
    try {
      const id = event.queryStringParameters.id;
      const user = await UserService.deleteUser(id);

      if (!user) {
        return {
          statusCode: StatusCode.NOT_FOUND,
          body: JSON.stringify({ message: "User not found" }),
        };
      }

      return {
        statusCode: StatusCode.OK,
        body: JSON.stringify({
          message: "User deleted successfully!",
          data: user,
        }),
      };
    } catch (err) {
      return {
        statusCode: StatusCode.NOT_FOUND,
        body: JSON.stringify({
          message: "Error deleting user",
          error: err.message,
        }),
      };
    }
  }
}

exports.UserController = UserController;
