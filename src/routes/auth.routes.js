import { Router } from "express";
import { loginUser, registerUser , logoutUser } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
//import { login } from "../controllers/auth.controllers.js";
import {userLoginValidator, userRegisterValidator} from "../validators/index.validator.js";

const router = Router();

router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/logout").post(verifyJWT, logoutUser);



export default router;
