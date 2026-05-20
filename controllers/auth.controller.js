import Joi from "joi";
import { sendError, sendSuccess } from "../helper/requestHandler.js";
import { throwCustomError } from "../helper/error.js";
import * as jwt_decode from "jwt-decode";
import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken';
import { isValidEmail } from "../helper/utilities.js";
import bcrypt from "bcrypt";
import { helper_getMyWorkSpaces } from "../services/workspace.service.js";

export const loginUser = async (req, res) => {
    try {
        const body = req.body;
        console.log(body)
        const schema = Joi.object({
            email: Joi.string().email().optional(),
            password: Joi.string().min(6).optional(),
        })
        const { error } = schema.validate(body)
        if (error) {
            throwCustomError(1006)
        }
        let userExists = await User.findOne({
            email: body?.email
        })

        if (!userExists) {
            throwCustomError(1008)
        }

        const resopnse = {
            email: userExists?.email,
            id: userExists?._id
        }

        const isPasswordValid = await bcrypt.compare(body.password, userExists.password);

        if (!isPasswordValid) {
            throwCustomError(1008)
        }
        
        const token = jwt.sign(resopnse, process.env.JWT_SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES_IN
        })
        const refreshToken = jwt.sign(resopnse, process.env.JWT_SECRET_KEY, {
            expiresIn: "30d"
        })

        // const myWorkSpaces = await helper_getMyWorkSpaces(userExists?._id)    
        const response = {
            token,
            refreshToken,
            email: userExists?.email,
            id: userExists?._id,
            // myWorkSpaces
        }

        await sendSuccess(req, res, "user created", 201, response)

    } catch (error) {
        sendError(req, res, error)
    }
}


export const registerUser = async (req, res) => {
    try {
        const body = req.body;
        console.log(body)
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
            confirmPassword: Joi.string().valid(Joi.ref('password')).required()
        })
        const { error } = schema.validate(body)
        if (error) {
            throwCustomError(1006)
        }

        let userExists = await User.findOne({
            email: body?.email
        })

        if (userExists) {
            throwCustomError(1007)
        }
        
        userExists = await User.create({
            username: body?.email.split("@")[0],
            email: body?.email,
            password: await bcrypt.hash(body.password, 10),
            origin: "normal"
        })
        await sendSuccess(req, res, "user created", 201, userExists)
    } catch (error) {
        console.log(error)
        sendError(req, res, error)
    }
}


