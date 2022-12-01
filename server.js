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


// Route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

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
// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

app.use(errorHandler);



const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log("server is running fine")
})