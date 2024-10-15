const express = require('express');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db.js');
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { errorMiddleware } = require('./middleware/error.js')
dotenv.config();


const userRouter = require('./routes/user.js');
const notesRouter = require('./routes/notes.js');


const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}))
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


// app.get("/" , (req, res)=>{
//     res.send("<h1>Hello World</h1>")
// }
// )

app.use('/api/user', userRouter);
app.use('/api/note', notesRouter);

app.use(errorMiddleware)
connectDB();

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../client/build'))); // Adjust path based on your project structure

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html')); // Adjust path to match your React build location
    });
}


const port = process.env.port || 3500;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
