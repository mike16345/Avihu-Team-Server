const { User } = require("../models/userModel");

class UserService {
  static async createUser(data) {
    try {
      const newUser = await User.create(data);
      return newUser;
    } catch (error) {
      throw error;
    }
  }

  static async getUsers() {
    try {
      const users = await User.find();
      
      return users;
    } catch (error) {
      throw error;
    }
  }

  static async getUser(id) {
    try {
      const user = await User.findById(id).lean();
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email }).lean();
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async updateUser(data, id) {
    try {
      const user = await User.findByIdAndUpdate(id, data, { new: true });
      if (!user) {
        return "User not available";
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async updateManyUsers(data) {
    try {
      const updatedUsers = await Promise.all(
        data.map(async (user) => {
          return await UserService.updateUser(user, user._id);
        })
      );
      return updatedUsers;
    } catch (error) {
      throw error;
    }
  }

  static async deleteUser(id) {
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return "User not available!";
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserService;
