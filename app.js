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

app.get("/", function(req, res){
    const today  = new Date().toISOString().slice(0,10);
    client.events.search({ country: "AE", limit: 500, "start.gte": today })
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

app.get("/category/:category", function(req, res){
    console.log(req.params);
    res.redirect("/");
});

app.get("/search/:q", function(req, res){
    const today  = new Date().toISOString().slice(0,10);
    client.events.search({ country: "AE", limit: 500, "start.gte": today, ...req.params })
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

app.listen(port, function(){
    console.log(`App listening at http://localhost:${port}`);
});