import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import {readState,mutate,publicState} from '@/lib/store';
import {calculate,validateEmployees} from '@/lib/domain';
import {parseImport} from '@/lib/import';
import {calibrate,checkRevision,updateModel,importEmployees} from '@/lib/service';
import {mockAnalysis} from '@/lib/mock-ai';
import demoEmployees from '../../../outputs/mock-2025/employees.json';
export const runtime='nodejs';export const dynamic='force-dynamic';
function authorize(req:NextRequest){const host=req.headers.get('host')||req.nextUrl.host;const token=process.env.APP_ACCESS_TOKEN;
  // 演示部署默认开放并授予管理员/HR负责人能力；正式环境配置 APP_ACCESS_TOKEN 后自动启用鉴权。
  if(token&&req.headers.get('authorization')!==`Bearer ${token}`)throw Error('需要访问令牌');
  if(req.method!=='GET'){const origin=req.headers.get('origin');if(origin&&new URL(origin).host!==host)throw Error('不允许跨站请求');}}
const error=(e:unknown)=>NextResponse.json({error:e instanceof Error?e.message:'操作失败'},{status:e instanceof Error&&e.message==='需要访问令牌'?401:400});
export async function GET(req:NextRequest,{params}:{params:Promise<{action:string}>}){try{authorize(req);const {action}=await params;if(action==='template'){const b=await fs.readFile(path.join(process.cwd(),'outputs/mock-2025/员工导入.xlsx'));return new NextResponse(b,{headers:{'content-type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','content-disposition':"attachment; filename*=UTF-8''"+encodeURIComponent('员工导入模板.xlsx')}});}const s=await readState();if(action==='state')return NextResponse.json({...publicState(s),results:calculate(s.employees,s.model,s.audits,s.cycle)},{headers:{'Cache-Control':'no-store'}});if(action==='employees')return NextResponse.json({cycle:s.cycle,employees:s.employees});throw Error('接口不存在');}catch(e){return error(e);}}
export async function POST(req:NextRequest,{params}:{params:Promise<{action:string}>}){try{authorize(req);const {action}=await params;
 if(Number(req.headers.get('content-length'))>12*1024*1024)throw Error('请求不可超过12MB');
 if(action==='import'){const form=await req.formData(),file=form.get('file');if(!(file instanceof File)||file.size>10*1024*1024)throw Error('请选择10MB以内的文件');const employees=await parseImport(await file.arrayBuffer(),file.name);const s=await readState();importEmployees(structuredClone(s),employees,s.cycle);if(form.get('preview')==='true')return NextResponse.json({count:employees.length,departments:new Set(employees.map(e=>e.department_id)).size,sample:employees.slice(0,5)});await mutate(s=>{checkRevision(s,Number(form.get('revision')));importEmployees(s,employees,String(form.get('cycle')));});return NextResponse.json({ok:true,count:employees.length});}
 const body=await req.json();
 if(action==='calibrate'){const p=z.object({revision:z.number(),employeeId:z.string(),to:z.string(),reason:z.string(),confirmed:z.boolean()}).parse(body);await mutate(s=>calibrate(s,p));}
 else if(action==='model'){const model=z.object({performance:z.record(z.number()),ability:z.record(z.number()),ratios:z.object({high:z.number(),medium:z.number(),low:z.number()}),targets:z.record(z.number()),version:z.number()}).parse(body.model);await mutate(s=>{checkRevision(s,body.revision);updateModel(s,model);});}
 else if(action==='ai-config'){const config=z.object({mode:z.enum(['mock','api']),baseUrl:z.string().max(500),model:z.string().max(100),prompt:z.string().max(5000)}).parse(body.config);if(config.baseUrl&&!/^https?:\/\//.test(config.baseUrl))throw Error('接口地址须以http或https开头');await mutate(s=>{checkRevision(s,body.revision);s.ai={...s.ai,...config};s.analyses={};});}
 else if(action==='analyze'){const target=z.string().max(100).parse(body.target);await mutate(s=>{checkRevision(s,body.revision);const isApiPreview=s.ai.mode==='api';s.analyses[target]={text:(isApiPreview?'【API 接入预览 · 当前使用本地演示模板】\n\n':'')+mockAnalysis(s,target),at:new Date().toISOString(),model:isApiPreview?'API 接入预览 · Mock fallback':'Mock · 规则模板 v1',revision:s.revision};});}
 else if(action==='employees'){if(!Array.isArray(body.employees))throw Error('employees必须为数组');await mutate(s=>{checkRevision(s,body.revision);importEmployees(s,body.employees,body.cycle);});}
 else if(action==='cycle'){const year=z.number().int().min(2020).max(2100).parse(body.year);await mutate(s=>{checkRevision(s,body.revision);const cycle=`REVIEW-${year}`;if(cycle===s.cycle||s.archives.some(a=>a.cycle===cycle))throw Error('该年度已存在');s.archives.push({cycle:s.cycle,employees:structuredClone(s.employees),model:structuredClone(s.model),audits:structuredClone(s.audits),archivedAt:new Date().toISOString()});s.cycle=cycle;s.employees=[];s.audits=[];s.analyses={};s.model.version++;});}
 else if(action==='reset-demo'){await mutate(async s=>{s.cycle='REVIEW-2025';s.employees=demoEmployees.employees as typeof s.employees;s.audits=[];s.analyses={};s.model={...s.model,version:1};s.archives=[];s.ai={...s.ai,mode:'mock'};});}
 else throw Error('接口不存在');return NextResponse.json({ok:true});
 }catch(e){return error(e);}}
