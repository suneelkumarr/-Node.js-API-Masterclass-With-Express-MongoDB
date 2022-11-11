const express = require("express")
const app = express();
const path = require("path")
require("dotenv").config()
const morgon = require("morgan")
const colors = require("colors")
const fileupload = require("express-fileupload")
const cookieParser = require("cookie-parser")
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const hpp = require("hpp");
const cors = require("cors")
const errorHandler = require("./middleware/error")
const connectDB = require("./config/db")

connectDB()
// Body parser
app.use(express.json());
// Cookie parser
app.use(cookieParser());
app.use(morgon('dev'));
// File uploading
app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());
// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
    windowsMs: 10 * 60 * 1000, // 10 mins
    max: 1000,
});

app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(3000, () => {
    console.log("server is running fine")
})