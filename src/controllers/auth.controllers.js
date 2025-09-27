import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api_response.js";
import ApiError from "../utils/api_error.js"; // {ApiError}
import { asyncHandler } from "../utils/async_handler.js";
import jwt from "jsonwebtoken"
import crypto from "crypto";
import { emailVerificationMailgen, forgotPasswordMailgen, sendEmail } from "../utils/mail.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating tokens",
      error,
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {

  const { username, email, password, role } = req.body;
  console.log(req.body);

  if (!username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const userExists = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (userExists) {
    throw new ApiError(409, "Username or Email already exists");
  }

  const user = await User.create({
    username,
    email,
    password,
    isEmailVerified: false,
  });

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Email Verification",
    mailgenContent: emailVerificationMailgen(
      user.username,
      `${req.protocol}://${res.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: createdUser },
        "User registered successfully",
      ),
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  // Add response code to complete the function
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { 
          user: loggedInUser, 
          accessToken, 
          refreshToken 
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    {
      new: true,
    },
  );

  const options ={
    httpOnly: true,
    secure: true,
  }
  return res
    .status(200)
    .cookie("refreshToken", null, options)
    .cookie("accessToken", null, options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

// const getCurrrentUser = asyncHandler(async (req,res) => {
// })
const getCurrentUser = asyncHandler(async (req,res) => {
 return res.status(200).json(new ApiResponse(200,"Current user fetched successfully",req.user))
})

 const verifyEmail = asyncHandler(async (req,res) => {
  const {verificationToken} = req.params;

  if(!verificationToken){
    throw new ApiError(400 ,"Email verification token is required")
  }

  let hashedToken= crypto
  .createHash("sha256")
  .update(verificationToken)
  .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: {$gt: Date.now()}
  })

  if(!user){ 
    throw new ApiError(400,"Invalid or expired email verification token")
  }

  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;

  user.isEmailVerified = true;
  await user.save({validateBeforeSave: false})
  return res
  .status(200)
  .json(new ApiResponse(200,{
    isEmailVerified :true
  },"Email verified successfully"));
})

const resendEmailVerification = asyncHandler(async (req,res) => {
  const user = await User.findById(req.user._id);

  if(!user){
    throw new ApiError(404,"User not found")
  }
  if(!user.isEmailVerified){
    throw new ApiError(400,"Email is already verified")
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Email Verification",
    mailgenContent: emailVerificationMailgen(
      user.username,
      `${req.protocol}://${res.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });
     return res.status(200).json(new ApiResponse(200,{},"Mail sent successfully"))

})

const refreshAccessToken  = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if(!incomingRefreshToken){
   throw new ApiError(401,"Unauthorized access - No refresh token provided")
  }

  try {
    const decodedtoken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET,);

    const user = await User.findById(decodedtoken?._id);

    if(!user){
      throw new ApiError(404,"User not found")
    }

    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Unauthorized access - Invalid refresh token")
    }

    const option ={
      httpOnly :true,
      secure: true,
    }
    const {accessToken, refreshToken:newRefreshToken} = await generateAccessAndRefreshToken(user._id);

    return res
    .status(200)
    .cookie("refreshToken",newRefreshToken,option)
    .cookie("accessToken",accessToken,option)
    .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access token refreshed successfully"))


  } catch (error) {
    throw new ApiError(401,"Unauthorized access - Invalid refresh token")
  }
})


const forgotPassword = asyncHandler(async (req,res) => {
 const {email} = req.body;

 const user  = await User.findOne({email});

 if(!user){
  throw new ApiError(400,"Email is required")
 }

 const { unHashedToken, hashedToken, tokenExpiry } =
 user.generateTemporaryToken();

 user.forgotPasswordToken = hashedToken;
 user.forgotPasswordTokenExpiry = tokenExpiry;


 await user.save({validateBeforeSave:false})
 
 await sendEmail({
  email: user?.email,
  subject: "Password Reset",
  mailgenContent: forgotPasswordMailgen(
    user.username,      
    `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
  ),
});

return res
.status(200)
.json( new ApiResponse(200 , {}, "password reset mail has been sent on email id"))

})




export { registerUser, loginUser, logoutUser  , getCurrentUser, verifyEmail , resendEmailVerification , refreshAccessToken , forgotPassword  };
