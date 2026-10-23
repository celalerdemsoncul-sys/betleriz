// Snapshot preview for environments where filesystem watching is unavailable.
// Restart this command after source edits. Backend content updates need no restart.
const metro=require('metro');
const config=require('../metro.config');config.server.port=Number(process.env.BETLERIZ_METRO_PORT||8082);
metro.runServer(config,{host:'127.0.0.1',watch:false,unstable_extraMiddleware:[(req,res,next)=>{if(req.url==='/status'){res.setHeader('Content-Type','text/plain');res.end('packager-status:running');}else next();}]}).then(()=>console.log(`Betleriz preview: http://127.0.0.1:${config.server.port} · kaynak değişikliklerinde yeniden başlatın`)).catch(e=>{console.error(e);process.exit(1)});
