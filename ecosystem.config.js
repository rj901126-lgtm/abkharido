module.exports = {
  apps: [
    {
      name: "abkharido-backend",
      script: "server.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
};
