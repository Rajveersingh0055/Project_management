import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api_response.js";
import ApiError from "../utils/api_error.js"; // {ApiError}
import { asyncHandler } from "../utils/async_handler.js";
import { emailVerificationMailgen, sendEmail } from "../utils/mail.js";
const generateAccessAndRefreshToken =async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken    ;
        await user.save({validateBeforeSave:false});
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens", error);
    }
}

const registerUser = asyncHandler(async (req, res) => {

     const {username , email, password, role} = req.body;
    console.log(req.body);
        if(!username || !email || !password){
            throw new ApiError(400, "All fields are required");
        }
     const UserExists = await User.findOne({
       $or: [{ username }, { email }],
     });
       if(UserExists){
           throw new ApiError(409, "Username or Email already exists");
       }

       const user = await User.create({
        username,
        email,
        password,
        isEmailVerified: false,
       })

       const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

       user.emailVerificationToken = hashedToken;
        user.emailVerificationExpiry = tokenExpiry;

        await user.save({validateBeforeSave:false});


        await sendEmail({
            email:user?.email,
            subject : "Email Verification",
            mailgenContent: emailVerificationMailgen(
                user.username,
                `${req.protocol}://${res.get("host")}/api/v1/users/verify-email/${unHashedToken}`
            ),

        })

      const createdUser =   await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
      )

      if(!createdUser){
        throw new ApiError(500, "Something went wrong while creating user");
      }

      return res
      .status(201)
      .json(new ApiResponse(201, { user:createdUser}, "User registered successfully"));
});

export { registerUser };
