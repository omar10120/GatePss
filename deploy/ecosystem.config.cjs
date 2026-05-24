/**
 * PM2 example for production — copy to server and run: pm2 start ecosystem.config.cjs
 * Or keep using `npm start` after dotenv preload in package.json (recommended).
 */
module.exports = {
  apps: [
    {
      name: 'gatepass',
      cwd: '/home/majis/public_html/gatepass.majis.om',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
