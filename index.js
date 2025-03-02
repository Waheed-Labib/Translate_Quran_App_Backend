import express from "express";

const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
})

const port = process.env.PORT || 3000;

const fakeData = [
    {
        id: 1,
        content: 'fake data 1'
    },
    {
        id: 2,
        content: 'fake data 2'
    },
    {
        id: 3,
        content: 'fake data 3'
    },
]

app.get('/', (req, res) => {
    res.send('Translate Quran Server running ...')
})

app.get('/data', (req, res) => {
    res.send(fakeData)
})

app.listen(port, () => {
    console.log(`Server running on Port: `, port)
})
