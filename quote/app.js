/* 입력한 내용을 이 브라우저에만 저장해요. */
'use strict';
const 저장이름 = 'lpk-morgans-quote-v1';
const 찾기 = id => document.getElementById(id);
const 돈표시 = 값 => Math.round(값).toLocaleString('ko-KR') + '원';
const 오늘 = new Date();
const 날짜 = `${오늘.getFullYear()}-${String(오늘.getMonth()+1).padStart(2,'0')}-${String(오늘.getDate()).padStart(2,'0')}`;
const 새내용 = () => ({number:`견적-${날짜.replaceAll('-','')}-${String(Math.floor(Math.random()*9000)+1000)}`,date:날짜,recipient:'김○○',recipientPhone:'010-0000-0001',recipientAddress:'',sender:'LPK모건스',senderPhone:'010-0000-0002',senderAddress:'',notes:'본 견적은 안내용 예시입니다. 자세한 내용은 편하게 문의해 주세요.',items:[{name:'투자자문 서비스 (가상 예시)',quantity:1,price:100000}]});
let 내용 = 새내용();
let 저장가능 = true;
let 저장알림;
let 이전초점;
const 칸목록 = ['number','date','recipient','recipientPhone','recipientAddress','sender','senderPhone','senderAddress','notes'];

/* 잘못된 저장 내용이 있더라도 화면을 열 수 있게 확인해요. */
try {
  const 기존 = JSON.parse(localStorage.getItem(저장이름) || 'null');
  if (기존 && typeof 기존 === 'object') {
    for (const 칸 of 칸목록) if (typeof 기존[칸] === 'string') 내용[칸] = 기존[칸].slice(0,칸 === 'notes' ? 1500 : 200);
    if(Array.isArray(기존.items)) 내용.items = 기존.items.slice(0,200).map(줄 => ({name:typeof 줄.name==='string'?줄.name.slice(0,200):'',quantity:숫자확인(줄.quantity,1,9999),price:숫자확인(줄.price,0,999999999)}));
  }
} catch { 저장가능 = false; }

function 숫자확인(값,최소,최대) { const 수 = Number(String(값 ?? '').replaceAll(',','').replaceAll('원','')); return Number.isFinite(수) ? Math.min(최대,Math.max(최소,Math.round(수))) : 최소; }

function 저장() {
  try { localStorage.setItem(저장이름,JSON.stringify(내용));저장가능=true;찾기('save-status').textContent='지금 내용이 자동 저장되었어요.'; }
  catch {저장가능=false;찾기('save-status').textContent='자동 저장이 안 되고 있어요. 엑셀용 파일로 저장해 주세요.';}
}

function 인쇄글자() {
  for(const 칸 of 칸목록) document.querySelector(`[data-print="${칸}"]`).textContent=내용[칸] || '—';
}

function 합계계산() {
  const 공급가액=내용.items.reduce((합,줄)=>합+줄.quantity*줄.price,0);
  const 부가세=Math.round(공급가액*0.1);
  찾기('subtotal').textContent=돈표시(공급가액);찾기('vat').textContent=돈표시(부가세);찾기('total').textContent=돈표시(공급가액+부가세);
  return {공급가액,부가세,합계:공급가액+부가세};
}

/* 줄은 따로 만들어요. 입력한 글자는 글자로만 넣어서 안전하게 보여요. */
function 품목그리기(초점번호) {
  const 몸통=찾기('rows');몸통.replaceChildren();
  내용.items.forEach((줄,번호)=>{
    const 행=document.createElement('tr');
    for(const [이름,제목,종류] of [['name','품목','text'],['quantity','수량','text'],['price','단가','text']]) {
      const 셀=document.createElement('td');셀.dataset.label=제목;
      const 입력=document.createElement('input');입력.type=종류;입력.setAttribute('aria-label',`${번호+1}번째 ${제목}`);입력.dataset.row=번호;입력.dataset.key=이름;
      if(이름==='name'){입력.maxLength=200;입력.value=줄.name;입력.placeholder='품목을 입력해 주세요';}
      else {입력.inputMode='numeric';입력.className='numeric';입력.value=이름==='price'?돈표시(줄.price):줄.quantity;입력.maxLength=18;}
      const 인쇄=document.createElement('span');인쇄.className='print-value';인쇄.textContent=입력.value;
      입력.addEventListener('focus',()=>{if(이름!=='name'){입력.value=String(줄[이름]);입력.select();}});
      입력.addEventListener('input',()=>{
        if(이름==='name')줄.name=입력.value;
        else 줄[이름]=숫자확인(입력.value,이름==='quantity'?1:0,이름==='quantity'?9999:999999999);
        인쇄.textContent=이름==='price'?돈표시(줄.price):String(줄[이름]);
        행.querySelector('.amount').textContent=돈표시(줄.quantity*줄.price);합계계산();저장();
      });
      입력.addEventListener('blur',()=>{if(이름!=='name')입력.value=이름==='price'?돈표시(줄.price):줄.quantity;});
      셀.append(입력,인쇄);행.append(셀);
    }
    const 금액=document.createElement('td');금액.className='amount';금액.dataset.label='금액';금액.textContent=돈표시(줄.quantity*줄.price);행.append(금액);
    const 삭제칸=document.createElement('td');삭제칸.className='no-print';const 삭제=document.createElement('button');삭제.type='button';삭제.className='delete';삭제.textContent='삭제';삭제.setAttribute('aria-label',`${번호+1}번째 품목 삭제`);
    삭제.onclick=()=>{내용.items.splice(번호,1);품목그리기();합계계산();저장();const 다음=찾기('rows').querySelector(`[data-row="${Math.min(번호,내용.items.length-1)}"]`);(다음||찾기('add')).focus();};삭제칸.append(삭제);행.append(삭제칸);몸통.append(행);
  });
  찾기('add').disabled=내용.items.length>=200;
  찾기('add').textContent=내용.items.length>=200?'품목은 200개까지 넣을 수 있어요':'＋ 품목 추가';
  if(초점번호!==undefined) 몸통.querySelector(`[data-row="${초점번호}"]`).focus();
}

for(const 칸 of 칸목록){찾기(칸).value=내용[칸];찾기(칸).addEventListener('input',()=>{내용[칸]=찾기(칸).value;인쇄글자();저장();});}
찾기('add').onclick=()=>{내용.items.push({name:'',quantity:1,price:0});품목그리기(내용.items.length-1);합계계산();저장();};

/* 엑셀에서 한국어가 보이도록 표시를 붙이고, 각 칸을 따옴표로 감싸요. */
function 파일용글자(값){let 글자=String(값);if(/^[\s]*[=+@-]/.test(글자))글자="'"+글자;return '"'+글자.replaceAll('"','""')+'"';}
찾기('csv').onclick=()=>{
  const 합=합계계산();const 줄들=[['견적서','LPK모건스'],['견적 번호',내용.number],['날짜',내용.date],['받는 곳',내용.recipient],['받는 곳 연락처',내용.recipientPhone],['받는 곳 주소',내용.recipientAddress],['보내는 곳',내용.sender],['보내는 곳 연락처',내용.senderPhone],['보내는 곳 주소',내용.senderAddress],[],['품목','수량','단가(원)','금액(원)'],...내용.items.map(줄=>[줄.name,줄.quantity,줄.price,줄.quantity*줄.price]),[],['공급가액',합.공급가액],['부가세 10%',합.부가세],['합계',합.합계],['안내 말씀',내용.notes]];
  const 파일=new Blob(['\uFEFF'+줄들.map(줄=>줄.map(파일용글자).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'});
  const 주소=URL.createObjectURL(파일);const 링크=document.createElement('a');링크.href=주소;링크.download=`견적서_${내용.number.replace(/[\\/:*?"<>|]/g,'_')||날짜}.csv`;document.body.append(링크);링크.click();링크.remove();setTimeout(()=>URL.revokeObjectURL(주소),1000);
};

/* 품목이 많아도 인쇄할 때는 A4 한 장 안으로 크기를 맞춰요. */
let 인쇄전용모양;
function 인쇄맞춤(){
  document.documentElement.style.setProperty('--print-scale','1');
  if(인쇄전용모양)인쇄전용모양.remove();
  // 먼저 실제 인쇄 모양을 적용한 다음, 서류 높이를 재요.
  const 인쇄규칙=[];
  for(const 모양 of document.styleSheets)for(const 규칙 of 모양.cssRules){
    if(규칙.media && 규칙.media.mediaText==='print')for(const 내용규칙 of 규칙.cssRules)인쇄규칙.push(내용규칙.cssText);
  }
  인쇄전용모양=document.createElement('style');
  인쇄전용모양.textContent=인쇄규칙.join('\n');document.head.append(인쇄전용모양);
  const 높이=찾기('paper').getBoundingClientRect().height;
  const 최대높이=1030;
  document.documentElement.style.setProperty('--print-scale',String(Math.min(1,최대높이/높이)));
}
window.addEventListener('beforeprint',()=>{document.activeElement?.blur();인쇄글자();인쇄맞춤();});
window.addEventListener('afterprint',()=>{document.documentElement.style.setProperty('--print-scale','1');인쇄전용모양?.remove();인쇄전용모양=null;});
찾기('print').onclick=()=>{인쇄글자();window.print();};
품목그리기();인쇄글자();합계계산();
if(저장가능)저장();else 찾기('save-status').textContent='저장 내용을 읽지 못했어요. 입력을 시작하면 다시 저장해요.';
