module.exports = {
  apps: [
    {
      name: "riya-mobile-shop",
      script: "server.js",
      env: {
        PORT: "4000",
        ADMIN_USER: "admin",
        ADMIN_PASS: "riya@123"
      }
    }
  ]
};
