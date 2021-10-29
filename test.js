require("dotenv").config();
const express = require("express");
const crossFetch = require('cross-fetch');
const phq = require('predicthq');


const port = process.env.PORT || 3000;
const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

const PREDICT_HQ_TOKEN = process.env.PREDICT_HQ_TOKEN;
const client = new phq.Client({access_token: PREDICT_HQ_TOKEN, fetch: crossFetch});

const options = {
    method: "GET",
    headers: {
        Authorization: `Bearer ${ PREDICT_HQ_TOKEN }`,
        Accept: "application/json"
    }
}

function fetchData(url){
    return crossFetch.fetch(url, options)
    .then(response => { 
        if (!response.ok) {
            throw Error("Error");
        }
        return response.json();
    });
}

const impact_cond = { 
    Minor: "&local_rank.gte=0&local_rank.lte=20",
    Moderate: "&local_rank.gte=21&local_rank.lte=40",
    Important: "&local_rank.gte=41&local_rank.lte=60",
    Significant: "&local_rank.gte=61&local_rank.lte=80",
    Major: "&local_rank.gte=81&local_rank.lte=100",
};

app.get("/", function(req, res){
    const today  = new Date().toISOString().slice(0,10);
    client.events.search({ country: "AE", limit: 100, "start.gte": today })
    .then(
        (results) => {
            // console.log(results.result.results);
            res.render("index", { eventsJSON: JSON.stringify({ events: results.result.results }).replace(/\\/g, '\\\\').replace(/"/g, '\\\"') });
        }
    ).catch(
        (err) => {
            console.error(err);
            res.sendFile(__dirname + "/failure.html");
        }    
    );
});

app.post("/", function(req, res){
    const keyword = req.body.q;
    if (keyword) {
        res.redirect(`/search/${keyword}`);
    } else {
        res.redirect("/");
    }
});

app.get("/impact/:impact", function(req, res){
    const today  = new Date().toISOString().slice(0,10);
    // console.log(req.params);
    // console.log(impact_cond[req.params.impact]);
    fetchData(`https://api.predicthq.com/v1/events/?limit=100&country=AE${impact_cond[req.params.impact]}&start.gte=${today}`)
    .then(data => {
        // console.log(data.results);
        res.render("index", { eventsJSON: JSON.stringify({ events: data.results }).replace(/\\/g, '\\\\').replace(/"/g, '\\\"') });
    })
    .catch(error => {
        console.error(error);
        res.sendFile(__dirname + "/failure.html");
    });
});

app.get("/category/:category/impact/:impact", function(req, res){
    const today  = new Date().toISOString().slice(0,10);
    // console.log(req.params);
    // console.log(impact_cond[req.params.impact]);
    fetchData(`https://api.predicthq.com/v1/events/?limit=100&country=AE&category=${req.params.category}${impact_cond[req.params.impact]}&start.gte=${today}`)
    .then(data => {
        // console.log(data.results);
        res.render("index", { eventsJSON: JSON.stringify({ events: data.results }).replace(/\\/g, '\\\\').replace(/"/g, '\\\"') });
    })
    .catch(error => {
        console.error(error);
        res.sendFile(__dirname + "/failure.html");
    });
});

app.get(["/search/:q", "/category/:category"], function(req, res){
    const today  = new Date().toISOString().slice(0,10);
    client.events.search({ country: "AE", limit: 100, "start.gte": today, ...req.params })
    .then(
        (results) => {
            // console.log(results.result.results);
            res.render("index", { eventsJSON: JSON.stringify({ events: results.result.results }).replace(/\\/g, '\\\\').replace(/"/g, '\\\"') });
        }
    ).catch(
        (err) => {
            console.error(err);
            res.sendFile(__dirname + "/failure.html");
        }    
    );
});

app.post("/filter", function(req, res){
    // console.log(req.body);
    if (req.body.impact && req.body.category) {
        res.redirect(`/category/${req.body.category}/impact/${req.body.impact}`);
    } else if (req.body.category) {
        res.redirect(`/category/${req.body.category}`);
    } else if (req.body.impact) {
        res.redirect(`/impact/${req.body.impact}`);
    } else {
        res.redirect("/");
    }
});

app.listen(port, function(){
    console.log(`App listening at http://localhost:${port}`);
});