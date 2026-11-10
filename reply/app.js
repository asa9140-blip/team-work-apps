/* 팀 코드는 파일에 적지 않고, 설정 화면에서 입력받아요. */
'use strict';
const 주소='https://gy-ai.tkvkaosh.workers.dev';
const 팀저장이름='maesil-reply-team-v1';
const 내용저장이름='maesil-reply-content-v1';
const 기본안내='너는 매실한입의 고객 담당 직원. 한국어 존댓말. 원문에 없는 가격 · 날짜 · 약속은 지어내지 않고, 확인이 필요하면 확인 후 다시 안내드리겠다고 쓴다.';
const 찾기=id=>document.getElementById(id);
let 팀코드='';
let 내용={inquiry:'',tone:'정중하게',text:'',cost:null,ms:null,history:[]};
let 작업중=false;
let 복사중=false;
let 화면저장가능=true;

/* 저장된 내용이 없으면 빈 화면으로 시작해요. */
try{
  팀코드=localStorage.getItem(팀저장이름)||'';
  const 이전=JSON.parse(localStorage.getItem(내용저장이름)||'null');
  if(이전&&typeof 이전==='object'){
    내용.inquiry=typeof 이전.inquiry==='string'?이전.inquiry.slice(0,12000):'';
    내용.tone=이전.tone==='사과 먼저'?'사과 먼저':'정중하게';
    내용.text=typeof 이전.text==='string'?이전.text.slice(0,50000):'';
    내용.cost=숫자읽기(이전.cost);내용.ms=숫자읽기(이전.ms);
    if(Array.isArray(이전.history))내용.history=이전.history.filter(줄=>줄&&typeof 줄.text==='string').slice(0,5).map(줄=>({text:줄.text.slice(0,50000),inquiry:typeof 줄.inquiry==='string'?줄.inquiry.slice(0,12000):'',tone:줄.tone==='사과 먼저'?'사과 먼저':'정중하게',cost:숫자읽기(줄.cost),ms:숫자읽기(줄.ms),createdAt:typeof 줄.createdAt==='string'?줄.createdAt:''}));
  }
}catch{화면저장가능=false;}

function 숫자읽기(값){return typeof 값==='number'&&Number.isFinite(값)&&값>=0?값:null;}
function 저장(){try{localStorage.setItem(내용저장이름,JSON.stringify(내용));찾기('storage-warning').hidden=true;화면저장가능=true;}catch{찾기('storage-warning').textContent='이 브라우저에서는 자동 저장이 안 되고 있어요. 필요한 답장은 복사해서 따로 보관해 주세요.';찾기('storage-warning').hidden=false;}}
function 오류보이기(문구){찾기('error').textContent=문구;찾기('error').hidden=!문구;}
function 연결표시(문구,종류=''){찾기('connection').textContent=문구;찾기('connection').className='connection '+종류;}
function 말투표시(){for(const 버튼 of document.querySelectorAll('[data-tone]')){const 선택=버튼.dataset.tone===내용.tone;버튼.classList.toggle('selected',선택);버튼.setAttribute('aria-pressed',String(선택));}}
function 비용시간표시(){찾기('cost').textContent=내용.cost===null?'아직 없어요':내용.cost.toLocaleString('ko-KR',{maximumFractionDigits:6})+'원';찾기('duration').textContent=내용.ms===null?'아직 없어요':(내용.ms/1000).toLocaleString('ko-KR',{maximumFractionDigits:2})+'초';}
function 잠금(상태){작업중=상태;for(const 버튼 of document.querySelectorAll('button'))버튼.disabled=상태;찾기('team').disabled=상태;찾기('inquiry').disabled=상태;찾기('result').disabled=상태;찾기('copy').disabled=상태||복사중||!내용.text.trim();document.querySelector('.result-card').setAttribute('aria-busy',String(상태));}
function 결과표시(){찾기('result').value=내용.text;비용시간표시();찾기('copy').disabled=작업중||복사중||!내용.text.trim();}

/* 기록의 글자도 그대로 보여줄 뿐, 실행하지 않아요. */
function 기록표시(){
  const 목록=찾기('history');목록.replaceChildren();찾기('history-empty').hidden=내용.history.length>0;
  내용.history.forEach((줄,번호)=>{
    const 항목=document.createElement('li'),버튼=document.createElement('button'),날짜=document.createElement('span'),미리보기=document.createElement('span');
    버튼.type='button';버튼.className='history-entry';버튼.disabled=작업중;
    날짜.className='when';const 시간=new Date(줄.createdAt);날짜.textContent=`${번호+1}번째 기록 · ${Number.isNaN(시간.getTime())?'저장된 답장':시간.toLocaleString('ko-KR',{month:'long',day:'numeric',hour:'numeric',minute:'2-digit'})} · ${줄.tone}`;
    미리보기.className='preview';미리보기.textContent=줄.text;
    버튼.append(날짜,미리보기);버튼.onclick=()=>{if(작업중)return;내용.inquiry=줄.inquiry;내용.tone=줄.tone;내용.text=줄.text;내용.cost=줄.cost;내용.ms=줄.ms;찾기('inquiry').value=내용.inquiry;말투표시();결과표시();저장();찾기('copy-status').textContent='저장한 답장을 불러왔어요.';찾기('result').focus();};항목.append(버튼);목록.append(항목);
  });
}

/* 오래 기다리지 않도록 요청 시간을 제한해요. */
async function 응답읽기(url,설정={}){
  const 제한=new AbortController();const 시계=setTimeout(()=>제한.abort(),60000);
  try{
    const 응답=await fetch(url,{...설정,signal:제한.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
    let 값;try{값=await 응답.json();}catch{throw new Error('답장 서비스의 응답을 읽지 못했어요. 잠시 후 다시 시도해 주세요.');}
    if(!값||typeof 값!=='object')throw new Error('답장 서비스의 응답을 확인하지 못했어요.');
    // 서비스가 보낸 한국어 오류는 바꾸지 않고 그대로 보여드려요.
    if(typeof 값.error==='string'&&값.error)throw new Error(값.error);
    if(!응답.ok)throw new Error('요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.');
    return 값;
  }catch(오류){if(오류.name==='AbortError')throw new Error('기다리는 시간이 길어졌어요. 잠시 후 다시 시도해 주세요.');if(오류 instanceof TypeError)throw new Error('연결하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.');throw 오류;}
  finally{clearTimeout(시계);}
}

async function 팀확인(저장할까요){
  if(작업중)return;
  const 입력=찾기('team').value.trim();
  if(!입력){연결표시('팀 코드를 입력해 주세요.','error');찾기('team').focus();return;}
  if(저장할까요){
    try{localStorage.setItem(팀저장이름,입력);팀코드=입력;}
    catch{연결표시('팀 코드를 저장하지 못했어요. 브라우저의 저장 허용 여부를 확인해 주세요.','error');return;}
  }
  잠금(true);연결표시('연결 확인 중…');
  try{const 값=await 응답읽기(주소+'/whoami?team='+encodeURIComponent(입력));if(값.ok===true&&typeof 값.team==='string'){연결표시('✓ '+값.team+' 연결됨','connected');}else{연결표시(typeof 값.error==='string'?값.error:'팀 코드를 확인해 주세요.','error');}}
  catch(오류){연결표시(오류.message,'error');}
  finally{잠금(false);}
}

찾기('settings-form').addEventListener('submit',이벤트=>{이벤트.preventDefault();팀확인(true);});
찾기('team').addEventListener('input',()=>연결표시('변경한 팀 코드를 저장 · 확인해 주세요.'));
찾기('inquiry').addEventListener('input',()=>{내용.inquiry=찾기('inquiry').value;저장();});
찾기('result').addEventListener('input',()=>{내용.text=찾기('result').value;찾기('copy').disabled=!내용.text.trim();저장();});
for(const 버튼 of document.querySelectorAll('[data-tone]'))버튼.onclick=()=>{if(작업중)return;내용.tone=버튼.dataset.tone;말투표시();저장();};
찾기('example').onclick=()=>{if(작업중)return;내용.inquiry='안녕하세요. 김○○입니다. 매실청 2병과 매실 장아찌 1개를 주문하고 싶어요. 가격과 배송비, 주문 방법을 알려 주세요. 연락처는 010-0000-0001입니다.';찾기('inquiry').value=내용.inquiry;저장();오류보이기('');찾기('inquiry').focus();};

찾기('generate').onclick=async()=>{
  if(작업중)return;오류보이기('');찾기('copy-status').textContent='';
  if(!팀코드){오류보이기('먼저 팀 코드를 저장하세요');찾기('team').focus();return;}
  if(찾기('team').value.trim()!==팀코드){오류보이기('변경한 팀 코드를 먼저 저장 · 확인해 주세요.');찾기('save-team').focus();return;}
  if(!내용.inquiry.trim()){오류보이기('고객 문의 내용을 먼저 넣어 주세요.');찾기('inquiry').focus();return;}
  잠금(true);찾기('generate').textContent='작성 중…';찾기('progress').textContent='작성 중… 잠시만 기다려 주세요.';
  try{
    const 값=await 응답읽기(주소+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({team:팀코드,system:기본안내,prompt:내용.tone+'\n\n'+내용.inquiry})});
    if(typeof 값.text!=='string'||!값.text.trim())throw new Error('답장 내용이 비어 있어요. 다시 시도해 주세요.');
    내용.text=값.text;내용.cost=숫자읽기(값.cost_krw);내용.ms=숫자읽기(값.ms);
    내용.history.unshift({inquiry:내용.inquiry,tone:내용.tone,text:내용.text,cost:내용.cost,ms:내용.ms,createdAt:new Date().toISOString()});내용.history=내용.history.slice(0,5);
    결과표시();기록표시();저장();찾기('progress').textContent='답장 초안을 만들었어요. 보내기 전에 확인해 주세요.';
  }catch(오류){오류보이기(오류.message);찾기('progress').textContent='';}
  finally{찾기('generate').textContent='만들기';잠금(false);}
};

찾기('copy').onclick=async()=>{
  if(작업중||복사중||!내용.text.trim())return;복사중=true;찾기('copy').disabled=true;
  try{await navigator.clipboard.writeText(내용.text);찾기('copy-status').textContent='복사했어요. 답장할 곳에 붙여 넣어 주세요.';}
  catch{찾기('copy-status').textContent='자동으로 복사하지 못했어요. 답장 글을 선택해 직접 복사해 주세요.';찾기('result').focus();찾기('result').select();}
  finally{복사중=false;찾기('copy').disabled=작업중||!내용.text.trim();}
};

찾기('team').value=팀코드;찾기('inquiry').value=내용.inquiry;말투표시();결과표시();기록표시();
if(!화면저장가능){찾기('storage-warning').textContent='저장된 내용을 읽지 못했어요. 필요한 답장은 따로 보관해 주세요.';찾기('storage-warning').hidden=false;}
if(팀코드)팀확인(false);
