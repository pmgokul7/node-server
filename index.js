import express, { Router } from 'express';
import * as dotenv from 'dotenv'
import bodyParser from "body-parser";
import helmet from "helmet";
import cors from 'cors'
import route from './routes/index.js';
import { throwCustomError } from './helper/error.js';
import { sendError } from './helper/requestHandler.js';
import { sendAlert } from './helper/telegram.js';
import { logger } from './helper/logger.js';
import mongoose from 'mongoose';

dotenv.config()
const app = express()
const PORT = process.env.PORT;

app.use(helmet());
app.use(cors());


app.use(
    express.json({
        limit: "50mb",
        verify: (req, res, buf) => {
            req.rawBody = buf;
        },
    })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


// app.get('/',async (req,res)=>{
//     try {
//         logger.log('hai')
//         logger.error('hio');
//         console.log('calledS')
//         sendAlert('nothing just testing')
//         throwCustomError(1001)
//     } catch (error) {
//        await sendError(req,res,error)
//         console.log(error)
//     }
// })


app.use('/api/v1', route)

process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // sendAlert(reason)
})

process.on("uncaughtException", async (err) => {
    console.error('Uncaught Exception:', err);
    // await sendAlert(err.toString())
});

process.on('SIGINT', async () => {
    await sendAlert(`${process.env.APP_NAME}-${process.env.ENV} going down..`)
    // process.exit(0);
})




mongoose.connect(process.env.DB_URL).then(() => {
    console.log("connected to database")
    const server = app.listen(PORT, () => {
        console.log(`server started on port: ${PORT}`)
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log('Port in use, retrying...');
                setTimeout(() => {
                    server.close();
                    server.listen(3001);
                }, 1000);
            }
        });
    })
}).catch(err => {
    console.log('error in connecting database')
})
