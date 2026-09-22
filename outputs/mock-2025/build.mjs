import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const out=new URL('./',import.meta.url);
const save=(name,data)=>fs.writeFile(new URL(name,out),typeof data==='string'||data instanceof Uint8Array?data:JSON.stringify(data,null,2));
let seed=20250922; const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const score=()=>Math.round((45+random()*54)*10)/10;
const surnames='陈 林 王 李 张 刘 杨 黄 赵 吴 周 徐 孙 马 朱 胡 郭 何 高 罗 郑 梁 谢 宋 唐 许 韩 冯 邓 曹 彭 曾 肖 田 董 袁 潘 于 蒋 叶'.split(' ');
const givenNames='静 浩 敏 磊 婷 俊杰 晓彤 思远 文博 雨桐 佳宁 志成 晨曦 丹 斌 雪 峰 欣怡 海燕 子涵 明轩 婉清 建华 若楠 佳琪 瑞 扬 丽 洋 晓 维安 书雅 宇航 诗涵 致远 思源 慧 强 琳 凯'.split(' ');
const employeeName=i=>i===2||i===35?'林晨':surnames[(i-1)*13%40]+givenNames[((i-1)*17+Math.floor((i-1)/40)*7)%40];
const defs=[
['employee_id','员工编号','文本；唯一主键，姓名不能作主键'],['name','姓名','虚构姓名；包含同名员工'],['cycle_id','盘点批次','年度批次标识'],['review_year','盘点年度','整数'],['snapshot_date','数据快照日期','YYYY-MM-DD'],
['company_id','公司编号','一级组织'],['company_name','公司名称','虚构公司'],['department_id','二级组织编号','强制分布分组键'],['department_name','二级组织名称','部门'],['team_id','三级组织编号','组织下钻'],['team_name','三级组织名称','小组'],['manager_id','直属上级编号','引用员工编号；部门负责人为空'],
['job_family','岗位序列','用于筛选'],['job_title','岗位名称','任职岗位'],['job_level','职级','P3/P4/P5/M1'],['location','工作地点','用于筛选'],['employment_status','在职状态','在职/试用期'],['hire_date','入职日期','YYYY-MM-DD'],['years_in_role','现岗位年限','年'],['is_manager','是否管理者','布尔'],['is_key_position','是否关键岗位','布尔'],
['kpi_score','KPI得分','0—100；越高越好'],['delivery_score','交付质量得分','0—100；越高越好'],['assessment_score','测评得分','0—100；越高越好'],['manager_score','上级能力评分','0—100；越高越好'],['values_score','价值观得分','0—100；越高越好'],['collaboration_score','协作得分','0—100；可选评价指标'],['leadership_score','领导力得分','0—100；可选评价指标'],['learning_score','学习敏捷度得分','0—100；可选评价指标'],
['skills','技能标签','分号分隔'],['achievement_evidence','业绩事实','模拟工作事实；供AI引用'],['manager_feedback','上级反馈','模拟观察；不是AI结论'],['development_needs','发展需求','员工/上级输入'],['career_aspiration','职业意向','员工输入'],['mobility_preference','流动意愿','本组织/跨组织/待沟通'],['successor_for_employee_id','拟接任岗位任职者编号','员工引用；无则为空'],['successor_readiness','接任准备度','即刻/1—2年/3年以上/不适用；人工输入'],['data_source','数据来源','synthetic；完全虚构']];
const departments=[['研发部',32,'研发','工程师'],['产品部',24,'产品','产品经理'],['销售部',20,'销售','客户经理'],['客户成功部',17,'服务','客户成功经理'],['运营部',15,'运营','运营专员'],['战略部',12,'战略','战略分析师']];
const employees=[],orgs=[{id:'C001',name:'星澜科技（虚构）',parent_id:null,level:1}];
for(let d=0;d<departments.length;d++){
 const [name,n,family,title]=departments[d],did=`D${d+1}`,start=employees.length+1,manager=`E${String(start).padStart(4,'0')}`;
 orgs.push({id:did,name,parent_id:'C001',level:2});
 for(let t=1;t<=2;t++)orgs.push({id:`${did}-T${t}`,name:`${name}${t}组`,parent_id:did,level:3});
 for(let j=0;j<n;j++){
 const i=employees.length+1,id=`E${String(i).padStart(4,'0')}`,t=j%2+1;
 employees.push({employee_id:id,name:employeeName(i),cycle_id:'REVIEW-2025',review_year:2025,snapshot_date:'2025-12-31',company_id:'C001',company_name:'星澜科技（虚构）',department_id:did,department_name:name,team_id:`${did}-T${t}`,team_name:`${name}${t}组`,manager_id:j===0?'':manager,job_family:family,job_title:j===0?`${name}负责人`:title,job_level:j===0?'M1':`P${3+j%3}`,location:['上海','北京','深圳'][i%3],employment_status:j===n-1?'试用期':'在职',hire_date:j===n-1?'2025-11-01':`${2017+i%8}-03-15`,years_in_role:0});
 const e=employees.at(-1);e.years_in_role=j===n-1?0.2:Math.round((0.5+random()*4)*10)/10;
 Object.assign(e,{is_manager:j===0,is_key_position:j===0||j%7===0,kpi_score:score(),delivery_score:score(),assessment_score:score(),manager_score:score(),values_score:score(),collaboration_score:score(),leadership_score:score(),learning_score:score(),skills:[family,'项目管理','数据分析'].join(';'),achievement_evidence:`2025年完成${2+i%6}项${family}专项任务，其中${i%3}项出现延期；复盘记录编号 SYN-${id}。`,manager_feedback:['能独立推进任务，跨团队沟通仍需及时同步。','复杂问题处理较好，需要加强经验沉淀。','任务拆解需要辅导，学习反馈较积极。'][i%3],development_needs:['加强跨部门项目协调','提升专业深度与方法沉淀','加强目标拆解和交付管理'][i%3],career_aspiration:j%4===0?'管理发展':'专业发展',mobility_preference:['本组织','跨组织','待沟通'][i%3],successor_for_employee_id:j===1?manager:'',successor_readiness:j===1?(d%2===0?'1—2年':'3年以上'):'不适用',data_source:'synthetic'});
 }
}
// 同分样本：五个参与计算的指标一致，检验稳定排序。
for(const k of ['kpi_score','delivery_score','assessment_score','manager_score','values_score'])employees[8][k]=employees[7][k];
const config={schema_version:'1.0',synthetic:true,cycle_id:'REVIEW-2025',snapshot_date:'2025-12-31',scope:'department_id',eligibility:'全部120名员工含试用期；仅测试假设',performance:{kpi_score:0.7,delivery_score:0.3},ability:{assessment_score:0.5,manager_score:0.3,values_score:0.2},axis_ratios:{high:0.25,medium:0.5,low:0.25},rounding:'最大余数法；余数相同时按medium、high、low优先',tie_break:'加权分保留2位后降序；同分按employee_id升序',missing_score:'拒绝计算，先修复；不按0分处理',suggested_grid_ratios:null,notes:'绩效权重、取整、同分及纳入规则均为可替换测试假设；九格建议比例待业务配置，不用两个轴比例相乘代替。'};
const weighted=(e,w)=>Math.round(Object.entries(w).reduce((a,[k,v])=>a+e[k]*v,0)*100)/100;
const expected=employees.map(e=>({employee_id:e.employee_id,department_id:e.department_id,performance_score:weighted(e,config.performance),ability_score:weighted(e,config.ability)}));
const quotas=[];
for(let d=0;d<6;d++){
 const group=expected.filter(e=>e.department_id===`D${d+1}`),n=group.length;
 const q=Object.entries(config.axis_ratios).map(([level,ratio])=>({level,count:Math.floor(n*ratio),remainder:n*ratio%1}));
 const ordered=[...q].sort((a,b)=>b.remainder-a.remainder||['medium','high','low'].indexOf(a.level)-['medium','high','low'].indexOf(b.level));
 const remaining=n-q.reduce((s,x)=>s+x.count,0); for(let i=0;i<remaining;i++)ordered[i].count++;
 const counts=Object.fromEntries(q.map(x=>[x.level,x.count]));quotas.push({department_id:`D${d+1}`,n,...counts});
 for(const axis of ['performance','ability'])group.sort((a,b)=>b[`${axis}_score`]-a[`${axis}_score`]||a.employee_id.localeCompare(b.employee_id)).forEach((e,i)=>e[`${axis}_level`]=i<counts.high?'high':i<counts.high+counts.medium?'medium':'low');
}
for(const e of expected)e.grid_id=`P_${e.performance_level}__A_${e.ability_level}`;
const first=expected[0],newLevel=first.ability_level==='high'?'medium':'high';
const calibration=[{event_id:'CAL-001',cycle_id:'REVIEW-2025',employee_id:first.employee_id,from_grid:first.grid_id,to_grid:`P_${first.performance_level}__A_${newLevel}`,reason:'模拟校准：盘点会议补充了跨团队项目评审材料，调整能力档位。',actor_id:'TEST-HR-001',actor_name:'测试HR',confirmed:true,confirmed_at:'2026-01-15T10:30:00+08:00',model_version:'1.0',synthetic:true}];
const anomalies=[['missing_score',{...employees[0],assessment_score:null},'阻止计算并提示测评缺失'],['out_of_range',{...employees[1],kpi_score:110},'拒绝越界评分'],['unknown_org',{...employees[2],department_id:'D999'},'拒绝不存在组织'],['unknown_manager',{...employees[3],manager_id:'E9999'},'提示上级不存在'],['duplicate_id',{...employees[0]},'与标准集一起导入时提示重复主键'],['invalid_date',{...employees[4],hire_date:'2025-02-30'},'拒绝无效日期']].map(([case_id,record,expected_behavior])=>({case_id,record,expected_behavior}));
assert.equal(employees.length,120);assert.equal(new Set(employees.map(e=>e.employee_id)).size,120);
for(const e of employees){assert.deepEqual(Object.keys(e).sort(),defs.map(d=>d[0]).sort());for(const k of Object.keys(config.performance).concat(Object.keys(config.ability)))assert(e[k]>=0&&e[k]<=100);assert(!e.manager_id||employees.some(x=>x.employee_id===e.manager_id));}
for(const q of quotas){assert.equal(q.high+q.medium+q.low,q.n);for(const axis of ['performance','ability'])for(const l of ['high','medium','low'])assert.equal(expected.filter(e=>e.department_id===q.department_id&&e[`${axis}_level`]===l).length,q[l]);}
await save('employees.json',{schema_version:'1.0',synthetic:true,employees});await save('organizations.json',orgs);await save('review-config.json',config);await save('expected-results.json',{quotas,employees:expected});await save('calibration-events.json',calibration);await save('invalid-cases.json',anomalies);
const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
await save('员工导入.csv','\uFEFF'+[defs.map(d=>d[1]),...employees.map(e=>defs.map(([k])=>e[k]))].map(r=>r.map(quote).join(',')).join('\r\n'));
await save('字段说明.md','# AI人才盘点虚拟数据 v1\n\n所有人员、组织、反馈与事件完全虚构。2025年度完整快照，120人，6个二级部门、12个三级组织。标准集含试用期员工和同名/同分案例，无缺失评分。\n\n## 文件用途\n- 员工导入.xlsx / 员工导入.csv：相同120人原始数据，中文表头。\n- employees.json：API/MCP适配的英文键模拟响应，不代表已实现接口。\n- organizations.json：完整组织树。\n- review-config.json：可替换的测试评分模型及分布口径。\n- expected-results.json：该配置的静态预期结果，用于核对；修改数据或配置须重新生成。\n- calibration-events.json：独立的已确认校准事件示例，不覆盖初始结果。\n- invalid-cases.json：6个独立异常用例，不混入标准导入。\n\n## 口径\n绩效=KPI×70%+交付质量×30%（暂定测试配置）；能力=测评×50%+上级能力评分×30%+价值观×20%。各部门各轴按25%/50%/25%分档。取整用最大余数法，余数同分按中、高、低优先；评分同分按员工编号稳定排序。上述技术口径均非已确认业务规则。筛选仅改变展示，测试预期不会按筛选子集重新分布。\n\nAI评价与发展建议应由后续AI层读取事实生成，当前不伪造AI服务输出。组织健康度可测试管理者分布、关键岗位、接任准备度和人才格子结构；现有单年度数据不支持真实年度趋势。未配置九格建议比例，等待业务确定。没有真实API地址或密钥。\n\n## 推荐验收顺序\n1. 分别导入Excel/CSV，核对120人和组织树，验证同名不覆盖。\n2. 加载评分配置，核对expected-results中的分数、配额与格子。\n3. 筛选及组织下钻，确认原始排名口径不变。\n4. 拖动员工：空原因或未确认不得提交；确认后记录操作者、时间和前后位置，原始分数不变。\n5. 搜索画像，接入AI生成评价/建议并导出；按组织生成梯队分析。\n6. 单独运行异常用例，核对提示并确认不污染标准集。\n\n## 字段字典\n|API键|中文表头|定义|\n|---|---|---|\n'+defs.map(d=>'|'+d.join('|')+'|').join('\n'));
const wb=Workbook.create(),sheet=wb.worksheets.add('员工导入');sheet.showGridLines=false;
const matrix=[defs.map(d=>d[1]),...employees.map(e=>defs.map(([k])=>k.endsWith('_date')?(Date.parse(e[k]+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000:e[k]))];
const range=sheet.getRangeByIndexes(0,0,matrix.length,defs.length);range.values=matrix;range.format.font={name:'Arial',size:10};range.format.columnWidth=20;range.format.rowHeight=24;
sheet.getRangeByIndexes(0,0,1,defs.length).format={fill:'#24364B',font:{bold:true,color:'#FFFFFF'},rowHeight:30};
for(let c=0;c<defs.length;c++){const k=defs[c][0],r=sheet.getRangeByIndexes(1,c,120,1);if(k.endsWith('_date'))r.setNumberFormat('yyyy-mm-dd');if(k.endsWith('_score'))r.setNumberFormat('0.0');if(['achievement_evidence','manager_feedback','development_needs'].includes(k))r.format.columnWidth=85;}
sheet.freezePanes.freezeRows(1);sheet.freezePanes.freezeColumns(2);wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'员工导入!A1:F4',include:'values',tableMaxRows:4,tableMaxCols:6})).ndjson);
await (await SpreadsheetFile.exportXlsx(wb)).save(decodeURIComponent(new URL('员工导入.xlsx',out).pathname).replace(/^\/(\w:)/,'$1'));
const preview=await wb.render({sheetName:'员工导入',range:'A1:F8',scale:1.5,format:'png'});await save('preview.png',new Uint8Array(await preview.arrayBuffer()));
console.log(JSON.stringify({employees:employees.length,fields:defs.length,quotas,gridCoverage:new Set(expected.map(e=>e.grid_id)).size,validation:'passed'}));


