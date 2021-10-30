require("dotenv").config();
const express = require("express");
const { fetch } = require('cross-fetch');


const port = process.env.PORT || 3000;
const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

const PREDICT_HQ_TOKEN = process.env.PREDICT_HQ_TOKEN;

const options = {
    method: "GET",
    headers: {
        Authorization: `Bearer ${ PREDICT_HQ_TOKEN }`,
        Accept: "application/json"
    }
}

function fetchData(url){
    return fetch(url, options)
    .then(response => { 
        if (!response.ok) {
            throw Error("Error");
        }
        return response.json();
    });
}

const impact_cond = { 
    Minor: "local_rank.gte=0&local_rank.lte=20",
    Moderate: "local_rank.gte=21&local_rank.lte=40",
    Important: "local_rank.gte=41&local_rank.lte=60",
    Significant: "local_rank.gte=61&local_rank.lte=80",
    Major: "local_rank.gte=81&local_rank.lte=100",
};

app.get("/", function(req, res){
    const today  = new Date().toISOString().slice(0,10);
    fetchData(`https://api.predicthq.com/v1/events/?limit=100&country=AE&start.gte=${today}`)
    .then(data => {
        // console.log(data.results);
        res.render("index", { eventsJSON: JSON.stringify({ events: data.results }).replace(/\\/g, '\\\\').replace(/"/g, '\\\"') });
    })
    .catch(error => {
        console.error(error);
        res.sendFile(__dirname + "/failure.html");
    });
});

app.post("/", function(req, res){
    const keyword = req.body.q;
    if (keyword) {
        res.redirect(`/search?q=${keyword}`);
    } else {
        res.redirect("/");
    }
});

app.get(["/search", "/filter"], function(req, res){
    console.log(req.url);
    const today  = new Date().toISOString().slice(0,10);
    let filter_today = (req.query['start.gte']) ? "" : `&start.gte=${today}`;
    const params = new URLSearchParams(req.query);
    const searchParams = params.toString();
    
    fetchData(`https://api.predicthq.com/v1/events/?limit=100&country=AE&${searchParams}${filter_today}`)
    .then(data => {
        // console.log(data.results);
        res.render("index", { eventsJSON: JSON.stringify({ events: data.results }).replace(/\\/g, '\\\\').replace(/"/g, '\\\"') });
    })
    .catch(error => {
        console.error(error);
        res.sendFile(__dirname + "/failure.html");
    });
});

app.post("/filter", function(req, res){
    // console.log(req.body);
    let searchParams = [];
    Object.keys(req.body).forEach(key => {
        if (req.body[key]) {
            if (key == "impact") {
                searchParams.push(impact_cond[req.body[key]]);
            } 
            else if (key == "date") {
                const startTime = new Date(req.body[key]).toISOString().slice(0,10);
                const endTime = new Date(req.body[key] + "T24:00:00.000Z").toISOString().slice(0,10);
                searchParams.push(`start.gte=${startTime}`);
                searchParams.push(`start.lt=${endTime}`);
            } else {
                searchParams.push(`${key}=${req.body[key]}`);
            }
        }
    });
    searchParams = searchParams.join("&");
    if (searchParams) {
        res.redirect(`/filter?${searchParams}`);
    } else {
        res.redirect("/");
    }
});

app.listen(port, function(){
    console.log(`App listening at http://localhost:${port}`);
});