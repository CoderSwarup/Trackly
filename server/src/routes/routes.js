import { Router } from "express";
import httpError from "../utils/httpError.js";
import responseMessage from "../constant/responseMessage.js";
import httpResponse from "../utils/httpResponse.js";
import apiController from "../controllers/api.controller.js";


const routes = Router()

routes.get("/test", apiController.self)

export default routes