import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api_response.js";
import { ApiError } from "../utils/api_error.js"; // {ApiError}
import { asyncHandler } from "../utils/async_handler.js";

const generateAccessAndRefreshToken =

const registerUser = asyncHandler(async (req, res) => {
     const {username , email, password, role} = req.body;

     const UserExists = await User.findOne({
        $or:[{username},{email}] })
       if(UserExists){
           throw new ApiError(409, "Username or Email already exists");
       }

       const newUser = await User.create({
        username,
        email,
        password,
        isEmailVerified: false,
       })
       
      const { unHashedToken, hashedToken, tokenExpiry } = newUser.generateTemporaryToken();
})