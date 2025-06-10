module.exports = {
  apps : [{
    name   : "app1",
    script : "./dist/app.js",
    env_production: {
      NODE_ENV: "production"
    }
  }]
}
