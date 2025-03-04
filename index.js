import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error: ", error)
            throw error
        })
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port:`, process.env.PORT)
        })
    })
    .catch((error) => {
        console.log('MongoDB Connection Failed !', error)
    })

// app.get('/data', (req, res) => {
//     res.send([
//         {
//             id: 1,
//             content: 'data 1'
//         },
//         {
//             id: 2,
//             content: 'data 2'
//         },
//         {
//             id: 3,
//             content: 'data 3'
//         },
//     ])
// })



















