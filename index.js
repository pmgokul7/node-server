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
import dns from 'dns';
import { ensurePricingPlansSeeded } from './services/pricingPlan.service.js';

dotenv.config()

// mongodb+srv requires SRV DNS; local resolvers on 127.0.0.1 often refuse querySrv
if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()));
} else if (dns.getServers().every((s) => s === '127.0.0.1' || s === '::1')) {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
}
const app = express()
const PORT = process.env.PORT || 3001;

app.set("trust proxy", true);

app.use(helmet());




app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

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

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});
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
    // await sendAlert(`${process.env.APP_NAME}-${process.env.ENV} going down..`)
    // process.exit(0);
})




mongoose.connect(process.env.DB_URL).then(async () => {
    console.log("connected to database")
    try {
        await ensurePricingPlansSeeded();
    } catch (seedError) {
        console.error("pricing plan seed failed:", seedError);
    }
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
    console.log('error in connecting database: ',err)
})
