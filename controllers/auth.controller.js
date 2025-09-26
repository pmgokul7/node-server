import Joi from "joi";
import { sendError, sendSuccess } from "../helper/requestHandler.js";
import { throwCustomError } from "../helper/error.js";
import * as jwt_decode from "jwt-decode";
import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken';
import { isValidEmail } from "../helper/utilities.js";


export const loginUser = async (req, res) => {
    try {
        const body = req.body;
        console.log(body)
        const schema = Joi.object({
            token: Joi.string().optional(),
            origin: Joi.string().valid("google", "normal").required(),
            email: Joi.string().email().optional()
        })
        const { error } = schema.validate(body)
        if (error) {
            throwCustomError(1006)
        }
        let response = {};
        if (body.origin === "google") {
            const user = jwt_decode.jwtDecode(body.token);

            let userExists = await User.findOne({
                email: user?.email
            })
            if (!userExists) {
                userExists = await User.create({
                    username: user?.name.replaceAll(" ", "_"),
                    email: user?.email,
                    image_url: user?.picture,
                    origin: "google"
                })
                userExists.new = true
            }

            response = {
                username: userExists.username,
                email: userExists.email,
                createdAt: userExists.createdAt,
                new: userExists?.new
            }

            const token = jwt.sign(response, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES })
            const refreshToken = jwt.sign(response, process.env.JWT_SECRET, { expiresIn: '7d' })

            response.token = token;
            response.refreshToken = refreshToken;
        } else if (body.origin == "normal") {
            if (!body.email || !isValidEmail(body.email)) {
                throwCustomError(1006)
            }

            let userExists = await User.findOne({
                email: body?.email
            })

            if (!userExists) {
                userExists = await User.create({
                    username: body?.email.split("@")[0],
                    email: body?.email,
                    image_url: "",
                    origin: body.origin,

                })
                userExists.new = true
            } else {
                throwCustomError(1007)
            }

            
            response = {
                username: userExists.username,
                email: userExists.email,
                createdAt: userExists.createdAt,
                new: userExists?.new
            }

            const token = jwt.sign(response, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES })
            const refreshToken = jwt.sign(response, process.env.JWT_SECRET, { expiresIn: '7d' })

            response.token = token;
            response.refreshToken = refreshToken;
        }



        await sendSuccess(req, res, "user created", 201, response)

    } catch (error) {
        sendError(req, res, error)
    }
}


export const registerUser = async (req, res) => {
    try {
        const body = req.body;
        // const schema = Joi.object({
        //     email: Joi.string.
        // })
    } catch (error) {

    }
}