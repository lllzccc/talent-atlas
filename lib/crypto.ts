import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
async function key(){if(process.env.AI_ENCRYPTION_KEY){if(!/^[a-f\d]{64}$/i.test(process.env.AI_ENCRYPTION_KEY))throw Error('AI_ENCRYPTION_KEY必须为64位十六进制');return Buffer.from(process.env.AI_ENCRYPTION_KEY,'hex');}const p=path.join(process.cwd(),'data','ai.key');await fs.mkdir(path.dirname(p),{recursive:true});try{return await fs.readFile(p);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;const k=randomBytes(32);await fs.writeFile(p,k,{flag:'wx',mode:0o600});return k;}}
export async function encrypt(text:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',await key(),iv);const content=Buffer.concat([cipher.update(text,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),content]).toString('base64');}
export async function decrypt(text:string){const b=Buffer.from(text,'base64'),cipher=createDecipheriv('aes-256-gcm',await key(),b.subarray(0,12));cipher.setAuthTag(b.subarray(12,28));return Buffer.concat([cipher.update(b.subarray(28)),cipher.final()]).toString('utf8');}
