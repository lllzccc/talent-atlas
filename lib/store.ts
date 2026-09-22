import fs from 'node:fs/promises';
import path from 'node:path';
import {Pool} from 'pg';
import {State,defaultModel} from './domain';
import demoEmployees from '../outputs/mock-2025/employees.json';
const dir=process.env.TALENT_DATA_DIR||path.join(process.cwd(),'data'),file=path.join(dir,'store.json');
const globalStore=globalThis as unknown as {talentPool?:Pool;talentQueue?:Promise<unknown>};
async function initial():Promise<State>{return {revision:1,cycle:'REVIEW-2025',employees:demoEmployees.employees as State['employees'],model:defaultModel,audits:[],ai:{mode:'mock',baseUrl:'',model:'',prompt:'基于提供的事实分析人才发展，引用具体指标。区分事实与推测，不推断敏感个人属性，给出可执行的发展建议。'},analyses:{},archives:[]};}
async function pool(){if(!globalStore.talentPool)globalStore.talentPool=new Pool({connectionString:process.env.DATABASE_URL});await globalStore.talentPool.query('CREATE TABLE IF NOT EXISTS talent_state (id integer PRIMARY KEY, payload jsonb NOT NULL)');return globalStore.talentPool;}
export async function readState():Promise<State>{if(process.env.DATABASE_URL){const p=await pool();await p.query('INSERT INTO talent_state(id,payload) VALUES(1,$1) ON CONFLICT DO NOTHING',[JSON.stringify(await initial())]);return (await p.query('SELECT payload FROM talent_state WHERE id=1')).rows[0].payload;}try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;return initial();}}
export async function mutate<T>(fn:(state:State)=>T|Promise<T>):Promise<T>{
 const operation=async()=>{if(process.env.DATABASE_URL){await readState();const client=await (await pool()).connect();try{await client.query('BEGIN');const s=(await client.query('SELECT payload FROM talent_state WHERE id=1 FOR UPDATE')).rows[0].payload as State;const result=await fn(s);s.revision++;await client.query('UPDATE talent_state SET payload=$1 WHERE id=1',[JSON.stringify(s)]);await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}
 const s=await readState();const result=await fn(s);s.revision++;await fs.mkdir(dir,{recursive:true});const tmp=file+'.tmp';await fs.writeFile(tmp,JSON.stringify(s,null,2));await fs.rename(tmp,file);return result;};
 const task=(globalStore.talentQueue||Promise.resolve()).then(operation);globalStore.talentQueue=task.catch(()=>{});return task;
}
export function publicState(s:State){return {...s,storage:process.env.DATABASE_URL?'PostgreSQL':'本地文件',ai:{mode:s.ai.mode,baseUrl:s.ai.baseUrl,model:s.ai.model,prompt:s.ai.prompt,hasKey:!!s.ai.encryptedKey}};}
