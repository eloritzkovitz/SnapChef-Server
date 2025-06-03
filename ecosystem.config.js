module.exports = {
  apps : [{
    name   : "SnapChef_Server",
    script : "./dist/app.js",
    env_producation: {
      NODE_ENV: "production"
    }
  }]
}
