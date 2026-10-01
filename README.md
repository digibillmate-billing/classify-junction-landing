# Classify Junction landing page

Public site for [Classify Junction](https://classify-junction.digibillmate-billing.workers.dev), the classifieds marketplace built by DigiBillMate.

This repository is only the landing page. It does not contain the marketplace application, and deploying it must not touch the `classify-junction` Worker.

```bash
npm install
npm run deploy
```

`npm run deploy` publishes the `site` folder to the Cloudflare Pages project `classify-junction-landing`.
