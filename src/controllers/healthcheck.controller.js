import {ApiResponse} from '../utils/api_response.js';
import { asyncHandler } from '../utils/async_handler.js';

/*
const healthCheck = async (req,res, next)=>{
    try {
        const user = await getUserFromDb()
     res
     .status(200)
     .json(new ApiResponse(200, {message : "Server is healthy"}));   
    } catch (error) {
        next(error);
    }
}
*/

const  healthCheck = asyncHandler(async(req,res) => {
    res.status(200)
    .json(new ApiResponse(200, {message : "Server is healthy"}));
})

export {healthCheck};