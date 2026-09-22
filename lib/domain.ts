export type Employee = { employee_id:string; name:string; department_id:string; department_name:string; team_id:string; team_name:string; job_title:string; job_level:string; [key:string]:string|number|boolean|null };
export type Level='high'|'medium'|'low';
export type Model={performance:Record<string,number>;ability:Record<string,number>;ratios:Record<Level,number>;targets:Record<string,number>;version:number};
export type Result={employee_id:string;performance:number;ability:number;performanceLevel:Level;abilityLevel:Level;grid:string;initialGrid:string;calibrated:boolean};
export type Audit={id:string;employeeId:string;name:string;from:string;to:string;reason:string;actor:string;at:string;modelVersion:number;cycle:string};
export type AIConfig={mode:'mock'|'api';baseUrl:string;model:string;encryptedKey?:string;prompt:string};
export type Analysis={text:string;at:string;model:string;revision:number};
export type Snapshot={cycle:string;employees:Employee[];model:Model;audits:Audit[];archivedAt:string};
export type State={revision:number;cycle:string;employees:Employee[];model:Model;audits:Audit[];ai:AIConfig;analyses:Record<string,Analysis>;archives:Snapshot[]};
export const levels:Level[]=['high','medium','low'];
export const levelName={high:'高',medium:'中',low:'低'};
export const gridNames:Record<string,string>={high_high:'明星人才',medium_high:'高潜人才',low_high:'潜力待释放',high_medium:'骨干人才',medium_medium:'稳健贡献者',low_medium:'待提升人才',high_low:'经验型贡献者',medium_low:'发展受限',low_low:'重点关注'};
export const metrics:Record<string,string>={kpi_score:'KPI得分',delivery_score:'交付质量',assessment_score:'测评得分',manager_score:'上级能力评分',values_score:'价值观得分',collaboration_score:'协作得分',leadership_score:'领导力得分',learning_score:'学习敏捷度'};
export const defaultModel:Model={performance:{kpi_score:.7,delivery_score:.3},ability:{assessment_score:.5,manager_score:.3,values_score:.2},ratios:{high:.25,medium:.5,low:.25},targets:{},version:1};
export function validateModel(model:Model){
 for(const weights of [model.performance,model.ability]){if(!Object.keys(weights).length||Object.keys(weights).some(k=>!k.endsWith('_score'))||Object.values(weights).some(w=>!Number.isFinite(w)||w<0)||Math.abs(Object.values(weights).reduce((a,b)=>a+b,0)-1)>1e-6)throw Error('请选择评分字段，且每个轴的权重之和必须等于100%');}
 if(levels.some(l=>!Number.isFinite(model.ratios[l])||model.ratios[l]<0)||Math.abs(levels.reduce((s,l)=>s+model.ratios[l],0)-1)>1e-6)throw Error('高中低比例之和必须等于100%');
 const t=Object.entries(model.targets);if(t.length&&(t.length!==9||t.some(([k,v])=>!Object.hasOwn(gridNames,k)||!Number.isFinite(v)||v<0)||Math.abs(t.reduce((s,[,v])=>s+v,0)-1)>1e-6))throw Error('九格建议比例须完整填写且合计100%');
}
export function quotas(n:number,ratios:Model['ratios']){const counts={high:Math.floor(n*ratios.high),medium:Math.floor(n*ratios.medium),low:Math.floor(n*ratios.low)};const priority:Level[]=['medium','high','low'];const order=[...priority].sort((a,b)=>(n*ratios[b]%1)-(n*ratios[a]%1)||priority.indexOf(a)-priority.indexOf(b));const remain=n-Object.values(counts).reduce((a,b)=>a+b,0);for(let i=0;i<remain;i++)counts[order[i]]++;return counts;}
export function calculate(employees:Employee[],model:Model,audits:Audit[]=[],cycle='REVIEW-2025'):Result[]{
 validateModel(model);
 const weighted=(e:Employee,weights:Record<string,number>)=>Math.round(Object.entries(weights).reduce((sum,[key,w])=>{const v=e[key];if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100)throw Error(`${e.name}的${metrics[key]||key}缺失或不在0—100范围`);return sum+v*w;},0)*100)/100;
 const results=employees.map(e=>({employee_id:e.employee_id,performance:weighted(e,model.performance),ability:weighted(e,model.ability),performanceLevel:'low' as Level,abilityLevel:'low' as Level,grid:'',initialGrid:'',calibrated:false}));
 const lookup=new Map(employees.map(e=>[e.employee_id,e]));
 for(const dep of new Set(employees.map(e=>e.department_id))){const group=results.filter(r=>lookup.get(r.employee_id)!.department_id===dep);const q=quotas(group.length,model.ratios);for(const axis of ['performance','ability'] as const){group.sort((a,b)=>b[axis]-a[axis]||a.employee_id.localeCompare(b.employee_id)).forEach((r,i)=>{r[`${axis}Level`]=i<q.high?'high':i<q.high+q.medium?'medium':'low';});}}
 for(const r of results){r.initialGrid=`${r.performanceLevel}_${r.abilityLevel}`;const last=audits.filter(a=>a.employeeId===r.employee_id&&a.modelVersion===model.version&&a.cycle===cycle).at(-1);r.grid=last?.to||r.initialGrid;r.calibrated=!!last;}
 return results;
}
export function validateEmployees(employees:Employee[],model:Model){
 if(!employees.length||employees.length>20000)throw Error('导入人数须为1—20000');const ids=new Set<string>();const deps=new Map<string,string>();const teams=new Map<string,string>();
 for(const e of employees){for(const k of ['employee_id','name','department_id','department_name','team_id','team_name','job_title','job_level'])if(typeof e[k]!=='string'||!String(e[k]).trim())throw Error(`员工${e.employee_id||'未知'}缺少${k}`);if(ids.has(e.employee_id))throw Error(`重复员工编号：${e.employee_id}`);ids.add(e.employee_id);if(deps.has(e.department_id)&&deps.get(e.department_id)!==e.department_name)throw Error('同一部门编号对应多个名称');deps.set(e.department_id,e.department_name);if(teams.has(e.team_id)&&teams.get(e.team_id)!==e.department_id)throw Error('同一小组编号归属多个部门');teams.set(e.team_id,e.department_id);
 for(const [k,v] of Object.entries(e)){if(v!==null&&!['string','number','boolean'].includes(typeof v))throw Error(`${e.employee_id}的${k}须为单一值`);if(['is_manager','is_key_position'].includes(k)&&typeof v!=='boolean')throw Error(`${e.employee_id}的${k}须为布尔值`);if(k.endsWith('_score')&&v!==null&&v!==''&&(typeof v!=='number'||v<0||v>100||!Number.isFinite(v)))throw Error(`${e.employee_id}的${k}须为0—100数字`);if(k.endsWith('_date')&&v){const s=String(v);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error(`${e.employee_id}日期无效：${k}`);}}
 }
 for(const e of employees)for(const key of ['manager_id','successor_for_employee_id'])if(e[key]&&(!ids.has(String(e[key]))||e[key]===e.employee_id))throw Error(`${e.employee_id}的${key}引用无效`);
 calculate(employees,model);
}
