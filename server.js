// Entry point recognized by Vercel's Node server runtime.
import { createPollinizaServer } from './web/server.js';
createPollinizaServer().listen(Number(process.env.PORT || 3000));
