#!/usr/bin/env node

const { serveHTTP, publishToCentral } = require("stremio-addon-sdk")
const addonInterface = require("./src/addon")
serveHTTP(addonInterface, { port: process.env.PORT || 55321 })

//publishToCentral("URL/manifest.json")
