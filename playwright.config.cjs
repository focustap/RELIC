const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests/browser',timeout:60000,fullyParallel:true,
 use:{baseURL:'http://127.0.0.1:4173/RELIC/',trace:'retain-on-failure'},
 projects:[{name:'desktop',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},{name:'phone',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1}}],
 webServer:{command:'node scripts/serve.cjs',url:'http://127.0.0.1:4173/RELIC/',reuseExistingServer:!process.env.CI},
 reporter:'list'
});
