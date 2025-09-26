import mongoose, {Schema} from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema({
    avatar :{
        type:{
            url: String,
            localPath: String
        },
        default: {
            url: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
            localPath: ""
        }
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
        minlength: 3,
        maxlength: 30
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    fullName:{
        type: String,
        //required: false,
        trim: true,
    },
    password:{
        type:String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
    },
    isEmailVerified:{
        type: Boolean,
        default: false
    },
    refreshTokens: {
        type: [String],
        default: []
    },
    forgotPasswordToken: {
        type: String,
    },
    forgotPasswordTokenExpiry: {
        type: Date,
    },
    emailVerificationToken: {
        type: String,
    },
    emailVerificationTokenExpiry: {
        type: Date,
    }
}, {timestamps: true});

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    next();
})

/**
 * Compares a given password with the user's stored password.
 * @param {string} password - The password to compare.
 * @returns {Promise<boolean>} - A promise that resolves to true if the password matches, false otherwise.
 */
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

/**
 * Generates a JSON Web Token that can be used to authenticate
 * requests to protected endpoints.
 * @returns {string} - A JSON Web Token that can be used to authenticate requests.
 * @example
 * const accessToken = user.generateAccessToken();
 * axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
 */
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN}
    )
}

/**
 * Generates a JSON Web Token that can be used to obtain a new access token
 * when the existing one has expired.
 * @returns {string} - A JSON Web Token that can be used to obtain a new access token.
 * @example
 * const refreshToken = user.generateRefreshToken();
 * axios.post("/api/v1/auth/refresh", { refreshToken })
 *     .then((res) => {
 *         const accessToken = res.data.accessToken;
 *         axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
 *     })
 *     .catch((err) => console.error(err));
 */
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"
        }
    )
}

/**
 * Generates a temporary token that can be used to reset a user's password.
 * The returned object contains the unhashed token, the hashed token, and the token expiry date.
 * The token will expire after 20 minutes.
 * @returns {Object} - An object containing the unhashed token, the hashed token, and the token expiry date.
 * @example
 * const tempToken = user.generateTemporaryToken();
 *  Use the unhashed token to send a password reset email
 *  Use the hashed token to verify the token in the password reset route
 */
userSchema.methods.generateTemporaryToken = function (){
    const unHashedToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex");

   const tokenExpiry = Date.now() + (20*60*1000); // 20 minutes

        return {
            unHashedToken,
            hashedToken,
            tokenExpiry
        }
}

export const User = mongoose.model("User", userSchema);