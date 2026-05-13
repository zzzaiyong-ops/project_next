console.log('[SSGLIVE] 메인 스크립트 시작');

// ── 고정 기본 텍스트 ──
var DEFAULT_PRODUCT_BASIC_INFO = "① 상품명/상품구성 :\n②가격/프로모션 조건 : MD할인가,카드즉시할인5%(5만원이상),신규가입3천원 적립, 최종공구가\n③이벤트 : 사전알림댓글 이벤트, 구매인증 이벤트, 모바일라이브 유무 등\n④참고용상품링크 : ";
var DEFAULT_CS_INFO = "1)과세/면세 :\n2)제조사/원산지 :\n3)반품.교환정책 :\n4)반품교환문의 : 1800-0850\n5)출고지/교환반품주소\n6)CS고객센터 협의사항:";

// ── 커스텀 confirm (sandbox iframe에서 native confirm 차단 대비) ──
function showConfirm(msg, onOk, onCancel){
  // 기존 overlay 제거
  var old = document.getElementById('custom-confirm-overlay');
  if(old) old.remove();

  var ov = document.createElement('div');
  ov.id = 'custom-confirm-overlay';
  ov.innerHTML = '<div id="custom-confirm-box">'
    + '<div id="custom-confirm-msg">'+msg+'</div>'
    + '<div id="custom-confirm-btns">'
    + '<button class="btn btn-ghost" id="custom-confirm-cancel">취소</button>'
    + '<button class="btn btn-danger" id="custom-confirm-ok">확인</button>'
    + '</div></div>';
  document.body.appendChild(ov);

  function close(){ ov.remove(); }
  document.getElementById('custom-confirm-ok').onclick = function(){ close(); if(onOk) onOk(); };
  document.getElementById('custom-confirm-cancel').onclick = function(){ close(); if(onCancel) onCancel(); };
  ov.onclick = function(e){ if(e.target===ov){ close(); if(onCancel) onCancel(); } };
}
// ═══════════════════════════════════════
// DATA
// ═══════════════════════════════════════
// ── 7단계 단계 정의 ──
const STAGES = [
  {id:1, name:'1.캠페인요청',    short:'캠페인요청',  color:'#6c5ce7', bg:'rgba(108,92,231,0.15)'},
  {id:2, name:'2.캠페인확정',    short:'캠페인확정',  color:'#0984e3', bg:'rgba(9,132,227,0.15)'},
  {id:3, name:'3.상품정보등록',  short:'상품정보등록', color:'#00cec9', bg:'rgba(0,206,201,0.15)'},
  {id:4, name:'4.MCN요청',      short:'MCN요청',    color:'#fd79a8', bg:'rgba(253,121,168,0.15)'},
  {id:5, name:'5.인플루언서확정', short:'인플확정',   color:'#e17055', bg:'rgba(225,112,85,0.15)'},
  {id:6, name:'6.APP마케팅확정', short:'APP마케팅',  color:'#fdcb6e', bg:'rgba(253,203,110,0.15)'},
  {id:7, name:'7.정산',          short:'정산',       color:'#00b894', bg:'rgba(0,184,148,0.15)'},
  {id:8, name:'8.성과분석',      short:'성과분석',   color:'#a29bfe', bg:'rgba(162,155,254,0.15)'},
];
const stageColor = (name) => STAGES.find(s=>s.name===name||s.short===name)?.color || '#888';
const stageBg    = (name) => STAGES.find(s=>s.name===name||s.short===name)?.bg    || 'var(--bg4)';

let DB = {
  products:[
    {id:1,name:'비타민C 세럼 30ml',company:'(주)스킨랩',brand:'스킨랩',cat:'뷰티',code:'SKU-001',price:28000,ship:'직접 발송',owner:'이소연',stock:120,revenue:50000000,infSize:'미들',period:'4주',desc:'피부 톤업 미백 기능성 세럼'},
    {id:2,name:'그린스무디 파우더',company:'헬씨팜',brand:'헬씨팜',cat:'식품',code:'SKU-002',price:32000,ship:'택배',owner:'박민준',stock:80,revenue:30000000,infSize:'매크로',period:'3주',desc:'유기농 채소 혼합 분말'},
    {id:3,name:'린넨 오버핏 셔츠',company:'모던핏',brand:'모던핏',cat:'패션',code:'SKU-003',price:45000,ship:'택배',owner:'이소연',stock:60,revenue:20000000,infSize:'미들',period:'2주',desc:'여름용 린넨 루즈핏'},
    {id:4,name:'무선 이어폰 Pro',company:'사운드웍스',brand:'사운드웍스',cat:'IT/가전',code:'SKU-004',price:89000,ship:'택배',owner:'최현우',stock:30,revenue:80000000,infSize:'메가',period:'6주',desc:'노이즈캔슬링 무선 이어폰'},
    {id:5,name:'콜라겐 드링크 10입',company:'뷰티푸드',brand:'뷰티푸드',cat:'식품',code:'SKU-005',price:18000,ship:'직접 발송',owner:'김담당',stock:200,revenue:15000000,infSize:'마이크로',period:'2주',desc:'저분자 콜라겐 농축액'},
    {id:7,name:'UV 선크림 SPF50+',company:'선케어랩',brand:'선케어랩',cat:'뷰티',code:'SKU-007',price:22000,ship:'직접 발송',owner:'이소연',stock:150,revenue:40000000,infSize:'혼합',period:'6주',desc:'워터프루프 논코메도제닉'},
    {id:8,name:'요가매트 6mm',company:'피트니아',brand:'피트니아',cat:'생활용품',code:'SKU-008',price:38000,ship:'택배',owner:'최현우',stock:70,revenue:25000000,infSize:'미들',period:'3주',desc:'천연고무 논슬립 요가매트'},
  ],
  campaigns:[], // Firebase에서 로드
  influencers:[],
  matches:[],
  mcnRequests:[],
  appMarketing:[],
  settlements:[],
  progress:[],
  activities:[],
  comments:{}, files:{}, history:{},
  notifications:[],
  showhosts:[
    {id:1,name:'김쇼호',company:'프리랜서',category:'뷰티,식품',createdAt:Date.now()},
    {id:2,name:'박라이브',company:'SSG MCN',category:'식품,가전',createdAt:Date.now()},
    {id:3,name:'이호스트',company:'프리랜서',category:'패션,가전',createdAt:Date.now()},
    {id:4,name:'최호스트',company:'SSG MCN',category:'패션,뷰티',createdAt:Date.now()},
  ],
};
let nid={products:1,campaigns:1,influencers:1,matches:1,progress:1,mcn:1,app:1,settle:1};

// ── 캠페인코드 자동생성: YYMMNNN ──
function generateCampCode(startDate){
  var d = startDate ? new Date(startDate) : new Date();
  if(isNaN(d.getTime())) d = new Date();
  var yy = String(d.getFullYear()).slice(2);
  var mm = String(d.getMonth()+1).padStart(2,'0');
  var prefix = yy+mm;
  var existing = DB.campaigns.filter(function(c){
    return c.campCode && c.campCode.startsWith(prefix) && /^\d+$/.test(c.campCode);
  });
  var maxSeq = 0;
  existing.forEach(function(c){
    var seq = parseInt(c.campCode.slice(prefix.length));
    if(!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  });
  return prefix + String(maxSeq+1).padStart(3,'0');
}

let activeCampId=null;
let infFilter={text:'',cat:''};

// ═══════════════════════════════════════
// ★ FIREBASE 설정
// ─────────────────────────────────────
// 아래 firebaseConfig 값을 Firebase 콘솔에서
// 복사한 실제 값으로 교체하세요.
// (콘솔 → 프로젝트 설정 → 내 앱 → SDK 설정)
// ═══════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBEdJ9b8h-jMRr76xHWCAMwX1tWOYueKAk",
  authDomain:        "project-next-786d3.firebaseapp.com",
  databaseURL:       "https://project-next-786d3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "project-next-786d3",
  storageBucket:     "project-next-786d3.firebasestorage.app",
  messagingSenderId: "161811449141",
  appId:             "1:161811449141:web:214f31e1e477e5e31bb87c",
  measurementId:     "G-RKPK630L8H"
};

// ─── 현재 로그인 사용자 (Firebase Auth 로그인 후 채워짐) ───
let ME = ''; // 사용자 이름
let ME_EMAIL = ''; // 사용자 이메일
let ME_ROLE = ''; // admin | manager | md | viewer | external_mcn
let ME_UID = '';  // Firebase Auth UID
let ME_MCN_COMPANY = ''; // external_mcn인 경우 MCN 업체명

// ─── 역할 설명 ───
const ROLE_LABELS = {
  admin: '전체 관리자',
  manager: '내부 담당자',
  md: '내부 MD',
  viewer: '내부 조회자',
  external_mcn: '외부 MCN',
};

// ─── 권한 체크 헬퍼 ───
function canEdit(){ return ['admin','manager','md','external_mcn'].includes(ME_ROLE); }
function isViewer(){ return ME_ROLE === 'viewer'; }
function isExtMcn(){ return ME_ROLE === 'external_mcn'; }
// 캠페인이 특정 MCN 업체에 해당하는지 확인 (mcnList 복수 지원 + 기존 mcn 하위 호환)
function campHasMcn(c, mcnCompany){
  if(!mcnCompany) return false;
  if(c.mcnList && c.mcnList.length) return c.mcnList.some(function(m){ return m.agency === mcnCompany; });
  return (c.mcn||'') === mcnCompany;
}
function isAdmin(){ return ME_ROLE === 'admin'; }

// external_mcn이 접근할 수 있는 페이지
const MCN_ALLOWED_PAGES = ['dashboard','s5','s7'];

// ─── Firebase 초기화 ───
let fbApp, fbDB, fbRef, fbAuth;
let fbReady = false;
let onlineUsers = new Set([ME]);
let _suppressListener = false;
let _myLastSaveTime = 0;
let _myLastSaveCamps = null;
// 최근 삭제된 캠페인 ID 맵 — listener가 stale remote에서 좀비로 복원하는 것 방지
var _recentlyDeletedCamps = {};
window.addEventListener('load', function(){ _suppressListener = false; _myLastSaveTime = 0; _myLastSaveCamps = null; _recentlyDeletedCamps = {}; });

function initFirebase(){
  try {
    fbApp = firebase.initializeApp(FIREBASE_CONFIG);
    fbDB  = firebase.database();
    fbAuth = firebase.auth();
    fbRef = fbDB.ref('influencer-hub');
    fbReady = true;

    // ── Firebase Auth 상태 감지 ──
    // 오버레이 즉시 제거 → 로그인 화면 노출 (로그인돼 있으면 콜백에서 앱 진입)
    if(window._removeAuthOverlay) window._removeAuthOverlay();
    // 로그인 버튼: SDK 로드 완료 표시
    var _lb = document.getElementById('login-btn');
    if(_lb){ _lb.disabled = false; _lb.textContent = '로그인'; }
    fbAuth.onAuthStateChanged(function(user){
      console.log('[Auth] onAuthStateChanged:', user ? 'user='+user.email : 'null');
      // 데모 모드에서는 Firebase 접근 완전 차단
      if(_isDemoMode) return;
      if(user){
        ME_UID = user.uid;
        ME_EMAIL = user.email;
        // users 노드에서 역할 정보 로드
        fbDB.ref('users/' + user.uid).once('value').then(function(snap){
          var userData = snap.val();
          console.log('[Auth] userData:', userData ? userData.role : 'not found');
          if(!userData){
            // users 노드에 없으면 admin으로 부트스트랩 (최초 1명)
            fbDB.ref('users').once('value').then(function(allSnap){
              var allUsers = allSnap.val();
              if(!allUsers || Object.keys(allUsers).length === 0){
                // 첫 번째 사용자 → admin으로 등록
                var defaultName = user.email.split('@')[0];
                var newUser = {
                  uid: user.uid, email: user.email,
                  name: defaultName, role: 'admin',
                  mcnCompany: '', status: 'active',
                  createdAt: new Date().toISOString()
                };
                fbDB.ref('users/' + user.uid).set(newUser).then(function(){
                  applyUserData(newUser);
                  hideLoginScreen();
                  initAfterLogin();
                });
              } else {
                // 등록된 사용자 아님 → 버튼 복원 후 로그아웃
                fbAuth.signOut();
                showLoginError('등록되지 않은 사용자입니다. 관리자에게 문의하세요.');
              }
            });
          } else {
            if(userData.status === 'inactive'){
              fbAuth.signOut();
              showLoginError('비활성화된 계정입니다. 관리자에게 문의하세요.');
              return;
            }
            applyUserData(userData);
            hideLoginScreen();
            initAfterLogin();
          }
        }).catch(function(e){
          // DB 읽기 실패 → 로그인 화면 복원
          console.warn('[Auth] users 노드 읽기 실패:', e.message);
          showLoginScreen();
          showLoginError('사용자 정보를 불러오지 못했습니다. 다시 시도해 주세요.');
        });
      } else {
        // 로그아웃 상태 → 데모 모드면 무시, 아니면 로그인 화면 표시
        if(!_isDemoMode) showLoginScreen();
      }
    });

    console.log('%c[APP] 버전: v2026-0320F', 'background:#217346;color:white;padding:4px 8px;border-radius:4px;font-weight:bold');
    console.log('[Firebase] 초기화됨');
  } catch(e){
    console.warn('[Firebase] 초기화 실패:', e.message);
    setFbStatus('demo');
  }
}

function applyUserData(userData){
  ME = userData.name || userData.email.split('@')[0];
  ME_EMAIL = userData.email || '';
  ME_ROLE = userData.role || 'viewer';
  ME_MCN_COMPANY = userData.mcnCompany || '';

  // 사이드바 업데이트
  var av = document.getElementById('sidebar-av');
  if(av) av.textContent = ME[0] || '?';
  var nm = document.getElementById('sidebar-name');
  if(nm) nm.textContent = ME;
  var rl = document.getElementById('sidebar-role-label');
  if(rl) rl.textContent = ROLE_LABELS[ME_ROLE] || ME_ROLE;
  var meAv = document.getElementById('me-av');
  if(meAv) meAv.textContent = ME[0] || '?';

  applyRolePermissions();
  // 역할에 따른 필터 기본값 적용
  applyRoleFilterDefaults();
}

// MD 대시보드: 상품/가격 입력 필요 캠페인 카드 클릭
function dashMdGoS3(){
  // MD 역할은 isMycamp 강제 필터로 처리 — 별도 필터 설정 불필요
  // 확정 대상 모드로 전환 (2단계+3단계 = 상품정보 입력 대상)
  pageFilter.s3 = 'target';
  var targetBtn = document.getElementById('fb-target-s3');
  var allBtn    = document.getElementById('fb-all-s3');
  if(targetBtn) targetBtn.classList.add('active');
  if(allBtn)    allBtn.classList.remove('active');
  var targetInput = targetBtn ? targetBtn.querySelector('input') : null;
  var allInput    = allBtn    ? allBtn.querySelector('input')    : null;
  if(targetInput) targetInput.checked = true;
  if(allInput)    allInput.checked    = false;

  goPage('s3', document.getElementById('nav-s3'));
}

// 로그인 역할에 따라 필터 기본값 설정
function applyRoleFilterDefaults(){
  var ownerIds = ['sf-camp-owner','sf-s1-owner','sf-s2-owner','sf-s3-owner',
                   'sf-s4-owner','sf-s5-owner','sf-s6-owner','sf-s7-owner'];
  var mdIds    = ['sf-camp-md','sf-s1-md','sf-s2-md','sf-s3-md',
                   'sf-s4-md','sf-s5-md','sf-s6-md','sf-s7-md'];
  var ownerKeys = ['camp-owner','s1-owner','s2-owner','s3-owner',
                    's4-owner','s5-owner','s6-owner','s7-owner'];
  var mdKeys   = ['camp-md','s1-md','s2-md','s3-md',
                   's4-md','s5-md','s6-md','s7-md'];

  if(ME_ROLE === 'manager' || ME_ROLE === 'admin'){
    // manager/admin: 캠페인담당에 본인 이름 기본값
    var myName = (ME_ROLE === 'manager') ? ME : '';
    ownerIds.forEach(function(id, i){
      var el = document.getElementById(id);
      if(el) el.value = myName;
      _fddVal[ownerKeys[i]] = myName;
    });
    // 담당MD는 전체
    mdIds.forEach(function(id, i){
      var el = document.getElementById(id);
      if(el) el.value = '';
      _fddVal[mdKeys[i]] = '';
    });
  } else if(ME_ROLE === 'md'){
    // md: 필터 UI는 전체로 비워둠 — renderCamps/renderS* 에서 isMycamp 강제 필터 적용
    ownerIds.concat(mdIds).forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    ownerKeys.concat(mdKeys).forEach(function(k){ _fddVal[k]=''; });
  } else {
    // viewer, external_mcn 등: 전체
    ownerIds.concat(mdIds).forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    ownerKeys.concat(mdKeys).forEach(function(k){ _fddVal[k]=''; });
  }
}

function applyRolePermissions(){
  // 사이드바 메뉴 제어
  var navIds = ['nav-s1','nav-s2','nav-s3','nav-s4','nav-s5','nav-s6','nav-s7','nav-s8','nav-influencers','nav-campaigns','nav-usermgmt'];
  navIds.forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    var page = el.getAttribute('data-page');
    if(isExtMcn()){
      // external_mcn: dashboard, s4, s6만
      el.style.display = MCN_ALLOWED_PAGES.includes(page) ? '' : 'none';
    } else {
      el.style.display = '';
    }
  });
  // admin만 기본정보 관리 보임
  var bmNav = document.getElementById('nav-basemgmt');
  if(bmNav) bmNav.style.display = isAdmin() ? '' : 'none';

  // 상단 '+ 캠페인 등록' 버튼
  var addCampBtn = document.querySelector('.topbar-r .btn-primary');
  if(addCampBtn) addCampBtn.style.display = canEdit() && !isExtMcn() ? '' : 'none';

  // 인플루언서 등록 버튼
  var addInfBtn = document.getElementById('btn-add-inf');
  if(addInfBtn) addInfBtn.style.display = canEdit() && !isExtMcn() ? '' : 'none';
}

function loadUserNotifs(){
  // Firebase에서 본인 알림 실시간 수신 (담당 캠페인 타인 수정 알림)
  if(!fbReady || !ME) return;
  var key = ME.replace(/[.#$\/\[\]]/g,'_');
  fbDB.ref('influencer-hub/user-notifs/'+key).orderByChild('createdAt').limitToLast(30)
    .on('child_added', function(snap){
      var n = snap.val();
      if(!n) return;
      // 중복 방지
      var already = DB.notifications.some(function(x){ return x.txt===n.txt && x.time===n.time; });
      if(already) return;
      DB.notifications.unshift({
        ico: n.ico||'✏️',
        txt: n.txt||'',
        time: n.time||'',
        campId: n.campId||null,
        unread: n.unread !== false
      });
      if(DB.notifications.length > 50) DB.notifications.length = 50;
      var hasUnread = DB.notifications.some(function(x){ return x.unread; });
      document.getElementById('notif-pip').style.display = hasUnread ? '' : 'none';
    });
}

function initAfterLogin(){
  setFbStatus('connected');
  // MCN 업체 목록 실시간 로드
  initMcnCompanies();
  // manager 담당자 목록 실시간 로드
  initManagerUsers();
  // 커스텀 역할 실시간 로드
  initCustomRoles();
  // 본인 담당 캠페인 알림 로드
  setTimeout(loadUserNotifs, 1000);
  // Presence
  var presRef = fbDB.ref('presence/' + ME_UID);
  presRef.set({name: ME, online: true, ts: Date.now()});
  presRef.onDisconnect().remove();

  fbDB.ref('presence').on('value', function(snap){
    onlineUsers.clear();
    snap.forEach(function(c){ if(c.val()?.online) onlineUsers.add(c.val().name); });
    updateOnline();
  });

  // 메인 데이터 리스너
  fbRef.on('value', function(snap){
    if(_isDemoMode){ return; } // 데모 모드에서는 Firebase 데이터로 덮어쓰지 않음
    if(_suppressListener){ return; }
    var remote = snap.val();
    if(!remote){ renderDash(); renderPage(document.querySelector('.page.active')?.id?.replace('page-','')||'dashboard'); return; }
    DB = mergeRemote(remote);
    if(_myLastSaveCamps && (Date.now() - _myLastSaveTime) < 15000){
      _myLastSaveCamps.forEach(function(localCamp){
        var idx = DB.campaigns.findIndex(function(rc){ return rc.id === localCamp.id; });
        if(idx >= 0) DB.campaigns[idx] = JSON.parse(JSON.stringify(localCamp));
      });
    }
    var needsRoleUpdate = DB.campaigns.some(function(c){ return !c.role; });
    if(needsRoleUpdate){
      DB.campaigns = DB.campaigns.map(function(c){
        return c.role ? c : Object.assign({}, c, {role:'(미정)', reasons:c.reasons||[]});
      });
      _suppressListener = true;
      pushToFirebase();
    }
    DB.campaigns = DB.campaigns.map(function(c){
      if(c.infName===undefined||c.mcn===undefined){
        return Object.assign({infName:'',mcn:''}, c);
      }
      return c;
    });
    // campCode 마이그레이션: 기존 캠페인에 코드 부여 + 구형식(CP-YYMM-NNN) → 신형식(YYMMNNN) 변환
    DB.campaigns.forEach(function(c){
      if(c.campCode && /^CP-/.test(c.campCode)){
        c.campCode = c.campCode.replace(/[^0-9]/g,'');
      }
      if(!c.campCode) c.campCode = generateCampCode(c.start || c.startDate);
      // 역할명 마이그레이션: 신규 → 미들
      if(c.role === '신규') c.role = '미들';
    });
    var now2 = new Date();
    var campWithDate = DB.campaigns.filter(function(c){ return c.start && c.start.length>=4; });
    var needsMigration = campWithDate.some(function(c){
      var campYear = parseInt(c.start.substring(0,4));
      return !isNaN(campYear) && (now2.getFullYear() - campYear) >= 1;
    });
    if(needsMigration && campWithDate.length > 0){
      var refYear = parseInt(campWithDate[0].start.substring(0,4));
      var yearDiff = now2.getFullYear() - refYear;
      if(yearDiff > 0){
        DB.campaigns = DB.campaigns.map(function(c){
          if(!c.start) return c;
          var startParts = c.start.split('-');
          var endParts   = c.end ? c.end.split('-') : null;
          var newC = Object.assign({}, c);
          newC.start = (parseInt(startParts[0])+yearDiff)+'-'+(startParts[1]||'01')+'-'+(startParts[2]||'01');
          if(endParts) newC.end = (parseInt(endParts[0])+yearDiff)+'-'+(endParts[1]||'01')+'-'+(endParts[2]||'01');
          return newC;
        });
        _suppressListener = true;
        pushToFirebase();
      }
    }
    // 빈 캠페인(name 없음) 자동 정리
    var emptyCamps = DB.campaigns.filter(function(c){ return !c.name || !String(c.name).trim(); });
    if(emptyCamps.length && fbReady){
      console.log('[AUTO] 빈 캠페인 자동 삭제:', emptyCamps.map(function(c){return c.id;}));
      emptyCamps.forEach(function(ec){
        fbDB.ref('influencer-hub/campaigns/' + ec.id).remove();
      });
      DB.campaigns = DB.campaigns.filter(function(c){ return c.name && String(c.name).trim(); });
    }
    // stage 마이그레이션: 구버전 stage값 → 현재 stage값으로 Firebase 자동 업데이트
    var _stageMap = {'3.MCN요청':'4.MCN요청','5.APP마케팅':'6.APP마케팅확정','6.정산':'7.정산'};
    var _needMigrate = DB.campaigns.filter(function(c){ return _stageMap[c.stage]; });
    if(_needMigrate.length && fbReady){
      console.log('[AUTO] stage 마이그레이션:', _needMigrate.map(function(c){return c.id+':'+c.stage;}));
      _needMigrate.forEach(function(c){
        var newStage = _stageMap[c.stage];
        fbDB.ref('influencer-hub/campaigns/'+c.id+'/stage').set(newStage);
        c.stage = newStage;
      });
    }
    updateBadges();
    var cur = document.querySelector('.page.active')?.id?.replace('page-','');
    if(cur && cur !== 'login-screen') renderPage(cur);
    else renderDash();
    updateOnline();
    // 추가 데이터 로드 (AI분석, M라이브, 월목표)
    loadInfAiFromDb(); loadMliveFromDb(); loadTargetsFromDb();
  });

  // 초기 렌더 (DOM 표시 후 렌더링 보장)
  setTimeout(function(){
    var _mi = document.getElementById('ds-month-input');
    if(_mi) _mi.value = dashBaseMonth.getFullYear()+'-'+String(dashBaseMonth.getMonth()+1).padStart(2,'0');
    // 모든 날짜 필터 기본값 세팅 (현재월 ~ 다음달)
    var _dr2 = _defaultDateRange();
    ['s1','s2','s3','s4','s5','s6','s7','camp'].forEach(function(pg){
      var fEl = document.getElementById('df-'+pg+'-from');
      var tEl = document.getElementById('df-'+pg+'-to');
      if(fEl) fEl.value = _dr2.from;
      if(tEl) tEl.value = _dr2.to;
    });
    renderDash();
    renderCalendar();
    initMoneyInputs();
  }, 0);

  // external_mcn이면 필터 바 숨김 (자기 캠페인만 보임), 대시보드 유지
  if(isExtMcn()){
    ['s4','s6'].forEach(function(pg){
      var fb = document.querySelector('#page-'+pg+' .filter-bar');
      if(fb) fb.style.display = 'none';
    });
    // 대시보드가 이미 표시중이므로 별도 goPage 불필요
  }
}

// ── 로그인 / 로그아웃 ──
function showLoginScreen(){
  if(window._removeAuthOverlay) window._removeAuthOverlay();
  document.getElementById('login-screen').classList.remove('hidden');
  document.querySelector('.sidebar').style.display = 'none';
  document.querySelector('.main').style.display = 'none';
  // 저장된 이메일 복원
  restoreSavedEmail();
  // 로그인 버튼 초기화
  var btn = document.getElementById('login-btn');
  if(btn){ btn.disabled=false; btn.textContent='로그인'; }
}
function hideLoginScreen(){
  if(window._removeAuthOverlay) window._removeAuthOverlay();
  document.getElementById('login-screen').classList.add('hidden');
  document.querySelector('.sidebar').style.display = '';
  document.querySelector('.main').style.display = 'flex';
  if(_isMobile()){
    // 모바일: 사이드바(메뉴)를 먼저 보여줌, 콘텐츠는 숨김
    var main = document.querySelector('.main');
    if(main) main.classList.remove('mob-content-open');
    var back = document.getElementById('mob-back-btn');
    if(back) back.style.display = 'none';
    // 대시보드를 준비만 해두고 표시는 메뉴 클릭 시
    var dashNav = document.querySelector('[data-page="dashboard"]');
    goPage('dashboard', dashNav);
    // 콘텐츠 화면은 열지 않음
  } else {
    // PC: 바로 대시보드 표시
    var dashNav = document.querySelector('[data-page="dashboard"]');
    goPage('dashboard', dashNav);
  }
}
function showLoginError(msg){
  var el = document.getElementById('login-err');
  el.textContent = msg;
  el.classList.add('show');
}
// ═══════════════════════════════════════
// 로그인 패널 전환
// ═══════════════════════════════════════
function showLoginPanel(panel){
  ['login','reset','profile'].forEach(function(p){
    var el = document.getElementById('login-panel-'+p);
    if(el) el.style.display = p===panel ? '' : 'none';
  });
  // 패널 초기화
  if(panel==='reset'){
    var re = document.getElementById('reset-email');
    if(re) re.value = document.getElementById('login-email')?.value||'';
    var rm = document.getElementById('reset-msg'); if(rm){ rm.style.display='none'; rm.textContent=''; }
    var rb = document.getElementById('reset-btn'); if(rb){ rb.disabled=false; rb.textContent='재설정 메일 발송'; }
  }
}

// ═══════════════════════════════════════
// 비밀번호 재설정 메일 발송
// ═══════════════════════════════════════
function doSendReset(){
  var email = (document.getElementById('reset-email')?.value||'').trim();
  var msgEl = document.getElementById('reset-msg');
  var btn   = document.getElementById('reset-btn');
  if(!email){ showResetMsg('이메일을 입력하세요.', false); return; }
  btn.disabled = true; btn.textContent = '발송 중...';
  firebase.auth().sendPasswordResetEmail(email)
    .then(function(){
      showResetMsg('✅ '+email+'로 재설정 링크를 발송했습니다. 이메일을 확인해 주세요.', true);
      btn.textContent = '발송 완료';
    })
    .catch(function(e){
      btn.disabled = false; btn.textContent = '재설정 메일 발송';
      var msg = '발송 실패: '+e.message;
      if(e.code==='auth/user-not-found')  msg = '등록되지 않은 이메일입니다.';
      if(e.code==='auth/invalid-email')   msg = '이메일 형식이 올바르지 않습니다.';
      showResetMsg(msg, false);
    });
}
function showResetMsg(msg, ok){
  var el = document.getElementById('reset-msg');
  if(!el) return;
  el.style.display = '';
  el.style.background  = ok ? 'rgba(0,184,148,0.15)' : 'rgba(255,118,117,0.15)';
  el.style.border      = ok ? '1px solid rgba(0,184,148,0.3)' : '1px solid rgba(255,118,117,0.3)';
  el.style.color       = ok ? '#00b894' : '#ff7675';
  el.style.whiteSpace  = 'pre-line';
  el.textContent = msg;
}

// ═══════════════════════════════════════
// 내 정보 수정 패널
// ═══════════════════════════════════════
function openProfilePanel(){
  // login-screen을 다시 표시하고 profile 패널 열기
  var ls = document.getElementById('login-screen');
  if(ls) ls.classList.remove('hidden');
  showLoginPanel('profile');
  // 현재 정보 채우기
  var nm = document.getElementById('profile-name');  if(nm) nm.value = ME||'';
  var em = document.getElementById('profile-email'); if(em) em.value = ME_EMAIL||'';
  var pm = document.getElementById('profile-msg');   if(pm){ pm.style.display='none'; pm.textContent=''; }
  // 비밀번호 영역 접기
  var pb = document.getElementById('profile-pw-body'); if(pb) pb.style.display='none';
  var pa = document.getElementById('profile-pw-arr');  if(pa) pa.textContent='▶ 펼치기';
  var pn = document.getElementById('profile-pw-new');     if(pn) pn.value='';
  var pc = document.getElementById('profile-pw-confirm'); if(pc) pc.value='';
}
function closeProfilePanel(){
  var ls = document.getElementById('login-screen');
  if(ls) ls.classList.add('hidden');
}
function toggleProfilePw(){
  var body = document.getElementById('profile-pw-body');
  var arr  = document.getElementById('profile-pw-arr');
  if(!body) return;
  var open = body.style.display==='none';
  body.style.display = open ? '' : 'none';
  arr.textContent = open ? '▼ 접기' : '▶ 펼치기';
}
function showProfileMsg(msg, ok){
  var el = document.getElementById('profile-msg');
  if(!el) return;
  el.style.display    = '';
  el.style.background = ok ? 'rgba(0,184,148,0.15)' : 'rgba(255,118,117,0.15)';
  el.style.border     = ok ? '1px solid rgba(0,184,148,0.3)' : '1px solid rgba(255,118,117,0.3)';
  el.style.color      = ok ? '#00b894' : '#ff7675';
  el.textContent = msg;
}
function saveMyProfile(){
  var name     = (document.getElementById('profile-name')?.value||'').trim();
  var pwNew    = document.getElementById('profile-pw-new')?.value||'';
  var pwConf   = document.getElementById('profile-pw-confirm')?.value||'';
  var btn      = document.getElementById('profile-save-btn');
  var pwOpen   = document.getElementById('profile-pw-body')?.style.display !== 'none';

  if(!name){ showProfileMsg('이름을 입력하세요.', false); return; }
  if(pwOpen && pwNew){
    if(pwNew.length < 8){ showProfileMsg('비밀번호는 8자 이상이어야 합니다.', false); return; }
    if(pwNew !== pwConf){ showProfileMsg('비밀번호가 일치하지 않습니다.', false); return; }
  }

  btn.disabled = true; btn.textContent = '저장 중...';

  var user = firebase.auth().currentUser;
  if(!user){ showProfileMsg('로그인 상태가 아닙니다.', false); btn.disabled=false; btn.textContent='저장'; return; }

  // 이름 → Firebase DB 업데이트
  var dbUpdate = fbDB.ref('users/'+ME_UID).update({ name: name });

  // 비밀번호 변경 (입력된 경우)
  var pwUpdate = (pwOpen && pwNew)
    ? user.updatePassword(pwNew)
    : Promise.resolve();

  Promise.all([dbUpdate, pwUpdate])
    .then(function(){
      ME = name;
      // 사이드바 이름 즉시 갱신
      var nm = document.getElementById('sidebar-name'); if(nm) nm.textContent = ME;
      var av = document.getElementById('sidebar-av');   if(av) av.textContent = ME[0]||'?';
      btn.disabled = false; btn.textContent = '저장';
      showProfileMsg('✅ 정보가 저장되었습니다.', true);
      // 2초 후 패널 닫기
      setTimeout(function(){ closeProfilePanel(); }, 1800);
    })
    .catch(function(e){
      btn.disabled = false; btn.textContent = '저장';
      var msg = '저장 실패: '+e.message;
      if(e.code==='auth/requires-recent-login')
        msg = '보안을 위해 재로그인 후 비밀번호를 변경해 주세요.';
      showProfileMsg(msg, false);
    });
}


// ═══════════════════════════════════════
// 카카오톡 공유 (SDK 방식)
// ═══════════════════════════════════════
// 카카오 SDK 미사용 (텍스트 복사 방식 사용)
// ── 카카오 SDK 초기화 ──
var _kakaoReady = false;
function _initKakao(){
  if(_kakaoReady) return;
  try {
    if(typeof Kakao !== 'undefined'){
      if(!Kakao.isInitialized()) Kakao.init('a37d386e6f91f48edd1e24130d573c90');
      _kakaoReady = Kakao.isInitialized();
    }
  } catch(e){ console.warn('Kakao init error:', e); }
}
window.addEventListener('DOMContentLoaded', function(){ setTimeout(_initKakao, 500); });

function showKakaoShareBtn(campaignId){
  var btn = document.getElementById('kakao-share-btn');
  if(btn){ btn.style.display = campaignId ? 'flex' : 'none'; btn.dataset.cid = campaignId || ''; }
}


// ═══════════════════════════════════════
// 섹션별 텍스트 붙여넣기 자동입력
// ═══════════════════════════════════════
var _pfCurrentSec = 'basic';
var _pfParsed = {};

var PF_SECTIONS = {
  basic: {
    title: '📋 캠페인 기본정보 붙여넣기',
    hint: ['캠페인명: 2026 여름 선케어','시작일: 2026-06-01','종료일: 2026-07-15','예상매출: 150,000,000','예산: 5,000,000','역할: 미들','캠페인담당: 홍길동','소구포인트: 워터프루프 SPF50+'],
    fields: [
      { keys:['캠페인명','캠페인이름','캠페인 이름'], id:'p-name', label:'캠페인명', type:'text' },
      { keys:['시작일','시작','start','진행시작'], id:'p-start', label:'시작일', type:'datetime' },
      { keys:['종료일','종료','end','마감일','진행종료'], id:'p-end', label:'종료일', type:'datetime' },
      { keys:['예상매출','매출','목표매출','revenue'], id:'p-revenue', label:'예상매출', type:'money' },
      { keys:['예산','budget'], id:'p-budget', label:'예산', type:'money' },
      { keys:['역할','role','유형'], id:'p-role', label:'역할', type:'role' },
      { keys:['캠페인담당','담당자','pd'], id:'p-pd-single', label:'캠페인담당', type:'search-sel' },
      { keys:['소구포인트','소구 포인트','appeal','핵심소구'], id:'p-appeal', label:'소구포인트', type:'text' },
    ]
  },
  product: {
    title: '🏷️ 상품정보 붙여넣기',
    hint: ['브랜드: 선케어랩','협력업체: (주)선케어랩','카테고리: 뷰티','MDCAT: BEAUTY-01','담당MD: 김민지','CS정보: 02-1234-5678','배송정보: 영업일 3일 이내'],
    fields: [
      { keys:['브랜드','brand'], id:'p-brand', label:'브랜드', type:'text' },
      { keys:['협력업체','업체','업체명','company'], id:'p-company', label:'협력업체', type:'text' },
      { keys:['카테고리','cat','category'], id:'p-cat', label:'카테고리', type:'text' },
      { keys:['mdcat','md cat'], id:'p-mdcat', label:'MDCAT', type:'text' },
      { keys:['담당md','md담당','md'], id:'p-owner', label:'담당MD', type:'search-sel' },
      { keys:['상품기본정보','상품정보','상품기본'], id:'p-product-basic-info', label:'상품기본정보', type:'text' },
      { keys:['cs정보','cs','고객센터'], id:'p-cs-info', label:'CS정보', type:'text' },
      { keys:['배송정보','배송'], id:'p-delivery-info', label:'배송정보 및 기타사항', type:'text' },
    ]
  },
  inf: {
    title: '👤 인플루언서정보 붙여넣기',
    hint: ['MCN: (주)크리에이터스','인플루언서: 뷰티스타그램_홍지수','유튜브: @beautystar','인스타: @beautystar_official','수수료율: 15','원고료: 500,000','샘플주소: 홍길동 / 010-1234-5678 / 서울...'],
    fields: [
      { keys:['mcn','mcn업체'], id:'_inf_mcn', label:'MCN업체', type:'inf' },
      { keys:['인플루언서','인플'], id:'_inf_name', label:'인플루언서명', type:'inf' },
      { keys:['규모','인플규모'], id:'_inf_size', label:'규모', type:'inf' },
      { keys:['유튜브','youtube','yt'], id:'_inf_yt', label:'유튜브', type:'inf' },
      { keys:['인스타','instagram','ig'], id:'_inf_ig', label:'인스타', type:'inf' },
      { keys:['트위터','twitter','tw','x(트위터)'], id:'_inf_tw', label:'X/트위터', type:'inf' },
      { keys:['수수료율','수수료'], id:'_inf_frate', label:'수수료율(%)', type:'inf' },
      { keys:['원고료','원고'], id:'_inf_famt', label:'원고료', type:'inf' },
      { keys:['샘플주소','수신주소','주소'], id:'_inf_addr', label:'샘플주소', type:'inf' },
      { keys:['인플루언서요청사항','요청사항','기타'], id:'p-inf-request', label:'인플루언서 요청사항 및 기타', type:'text' },
    ]
  },
  appmkt: {
    title: '📱 모바일마케팅 붙여넣기',
    hint: ['채널: 슈퍼브랜드데이','슈퍼브랜드시작: 2026-06-10','슈퍼브랜드종료: 2026-06-12','모바일라이브: 2026-06-15','랜딩페이지: https://...','기획전: https://...'],
    fields: [
      { keys:['채널','channel','app채널'], id:'_app_ch', label:'채널', type:'app' },
      { keys:['슈퍼브랜드시작','슈퍼시작'], id:'appmkt-super-start', label:'슈퍼브랜드 시작', type:'date' },
      { keys:['슈퍼브랜드종료','슈퍼종료'], id:'appmkt-super-end', label:'슈퍼브랜드 종료', type:'date' },
      { keys:['모바일라이브','라이브'], id:'appmkt-live-dt', label:'모바일라이브', type:'date' },
      { keys:['랜딩페이지','landing','랜딩'], id:'appmkt-landing-url', label:'랜딩페이지', type:'text' },
      { keys:['기획전','deal'], id:'appmkt-deal-url', label:'기획전', type:'text' },
    ]
  },
  settle: {
    title: '💰 정산정보 붙여넣기',
    hint: ['정산매출: 120,000,000','광고수익: 3,000,000','주문건수: 850','정산처리일: 2026-07-29','비용지불일: 2026-08-15'],
    fields: [
      { keys:['정산매출','매출'], id:'p-settle-revenue', label:'정산매출', type:'money' },
      { keys:['da광고료','da','광고료'], id:'p-settle-da', label:'광고수익', type:'money' },
      { keys:['주문건수','주문'], id:'p-settle-orders', label:'주문건수', type:'text' },
      { keys:['정산처리일','정산일'], id:'p-settle-process-date', label:'정산처리일', type:'date' },
      { keys:['비용지불일','지불일','결제일'], id:'p-settle-payment-date', label:'비용지불일', type:'date' },
    ]
  }
};


// ═══════════════════════════════════════
// 섹션별 포맷 복사 (현재 입력값 → 키:값 텍스트)
// ═══════════════════════════════════════
function copySectionFormat(sec){
  var lines = [];

  if(sec === 'basic'){
    lines.push('=== 캠페인 기본정보 ===');
    lines.push('캠페인명: ');
    lines.push('시작일: ');
    lines.push('종료일: ');
    lines.push('예상매출: ');
    lines.push('예산: ');
    lines.push('역할: ');
    lines.push('캠페인담당: ');
    lines.push('담당MD: ');
    lines.push('소구포인트: ');
    lines.push('선정사유: ');

  } else if(sec === 'product'){
    lines.push('=== 상품 정보 ===');
    lines.push('브랜드: ');
    lines.push('협력업체: ');
    lines.push('카테고리: ');
    lines.push('MDCAT: ');
    lines.push('상품코드: ');
    lines.push('상품명: ');
    lines.push('MD할인가: ');
    lines.push('최종공구가: ');
    lines.push('CS정보: ');
    lines.push('');
    lines.push('=== 배송 정보 ===');
    lines.push('택배사: ');
    lines.push('배송비: ');
    lines.push('제주·도서산간: ');
    lines.push('교환 배송비: ');
    lines.push('반품비: ');
    lines.push('당일출고 마감: ');
    lines.push('기타사항: ');

  } else if(sec === 'inf'){
    lines.push('=== 인플루언서 정보 ===');
    lines.push('MCN: ');
    lines.push('인플루언서: ');
    lines.push('규모: ');
    lines.push('유튜브: ');
    lines.push('인스타: ');
    lines.push('트위터: ');
    lines.push('수수료율: ');
    lines.push('원고료: ');
    lines.push('샘플주소: ');

  } else if(sec === 'appmkt'){
    lines.push('=== 모바일마케팅 ===');
    lines.push('채널: ');
    lines.push('슈퍼브랜드시작: ');
    lines.push('슈퍼브랜드종료: ');
    lines.push('모바일라이브: ');
    lines.push('랜딩페이지: ');
    lines.push('기획전: ');

  } else if(sec === 'settle'){
    lines.push('=== 정산 정보 ===');
    lines.push('정산매출: ');
    lines.push('광고수익: ');
    lines.push('주문건수: ');
  }

  var text = lines.join('\n');
  _doCopy(text, function(ok){
    if(ok) showToast('✅ 빈 양식이 복사됐습니다! 카카오톡에 붙여넣고 항목을 채워서 다시 전달하세요.');
    else   showToast('복사 실패');
  });
}

// 현재 팝업 입력값 스냅샷
function _getCurrentCampData(){
  var v = function(id){ return (document.getElementById(id)?.value||'').trim(); };
  var iv = function(id){ return parseInt((v(id)||'0').replace(/,/g,''))||0; };
  var reasons = [];
  document.querySelectorAll('.bas-reason-cb:checked, .reason-cb:checked').forEach(function(cb){ reasons.push(cb.value); });
  // SKU 데이터
  var skus = [];
  document.querySelectorAll('#sku-list .sku-row').forEach(function(row){
    var code = (row.querySelector('.sku-code')?.value||'').trim();
    if(!code) return;
    var parse = function(cls){ return parseInt((row.querySelector(cls)?.value||'').replace(/,/g,''))||0; };
    skus.push({
      code: code,
      productName: (row.querySelector('.sku-pname')?.value||'').trim(),
      mdcat: (row.querySelector('.sku-mdcat')?.value||'').trim(),
      mdPrice: parse('.pg-md'),
      finalPrice: (function(){
        var md=parse('.pg-md'), card=parse('.pg-card'), mile=parse('.pg-mileage'), cpn=parse('.pg-coupon');
        return md>0 ? Math.max(0, md-card-mile-cpn) : 0;
      })(),
    });
  });
  return {
    name: v('p-name'), brand: v('p-brand'), company: v('p-company'),
    cat: v('p-cat'), mdcat: v('p-mdcat'), appeal: v('p-appeal'),
    start: v('p-start').slice(0,10), end: v('p-end').slice(0,10),
    revenue: iv('p-revenue'), budget: iv('p-budget'),
    role: document.querySelector('input[name="p-role"]:checked')?.value||'',
    pdSingle: v('p-pd-single'), owner: v('p-owner'),
    csInfo: v('p-cs-info'), deliveryInfo: v('p-delivery-info'),
    courier: v('p-courier'), shipCutoff: v('p-ship-cutoff'),
    shipFree: !!(document.getElementById('p-ship-free')?.checked),
    shipFee: parseInt((document.getElementById('p-ship-fee')?.value||'').replace(/,/g,''))||0,
    islandFree: !!(document.getElementById('p-island-free')?.checked),
    islandFee: parseInt((document.getElementById('p-island-fee')?.value||'').replace(/,/g,''))||0,
    exchangeFee: parseInt((document.getElementById('p-exchange-fee')?.value||'').replace(/,/g,''))||0,
    returnFee: parseInt((document.getElementById('p-return-fee')?.value||'').replace(/,/g,''))||0,
    mcn: v('p-mcn'), reasons: reasons, skus: skus,
  };
}

function openSectionPaste(sec){
  _pfCurrentSec = sec;
  _pfParsed = {};
  var cfg = PF_SECTIONS[sec]; if(!cfg) return;
  var el = function(id){ return document.getElementById(id); };
  var t = el('pf-sec-title');   if(t) t.textContent = cfg.title;
  var h = el('pf-hint');
  if(h) h.innerHTML = '<b style="color:var(--text)">예시</b> &nbsp;'
    + cfg.hint.map(function(s){ return '<span style="background:var(--bg2);border-radius:4px;padding:1px 6px;font-size:11.5px;color:var(--accent2)">'+escHtml(s)+'</span>'; }).join(' ');
  var inp = el('pf-input'); if(inp) inp.value = '';
  el('pf-preview').style.display = 'none';
  el('pf-empty').style.display   = 'none';
  el('pf-apply-btn').style.display = 'none';
  openMo('pastefill');
}
function openPasteFillModal(){
  // 전체 섹션 모드: 모든 PF_SECTIONS의 fields를 합쳐서 파싱
  _pfCurrentSec = 'all';
  _pfParsed = {};
  var el = function(id){ return document.getElementById(id); };
  var t = el('pf-sec-title'); if(t) t.textContent = '📋 전체 붙여넣기';
  var h = el('pf-hint');
  if(h) h.innerHTML = '<b style="color:var(--text)">모든 섹션 항목을 한번에 입력</b> &nbsp;'
    + ['캠페인명: ', '브랜드: ', '시작일: ', '종료일: ', '예상매출: ', 'MCN: ', '인플루언서: ', '채널: ']
      .map(function(s){ return '<span style="background:var(--bg2);border-radius:4px;padding:1px 6px;font-size:11.5px;color:var(--accent2)">'+s+'</span>'; }).join(' ');
  var inp = el('pf-input'); if(inp) inp.value = '';
  el('pf-preview').style.display = 'none';
  el('pf-empty').style.display   = 'none';
  el('pf-apply-btn').style.display = 'none';
  openMo('pastefill');
}

function parseSectionPaste(){
  var raw = (document.getElementById('pf-input').value||'').trim();
  _pfParsed = {};
  if(!raw){ document.getElementById('pf-preview').style.display='none'; document.getElementById('pf-empty').style.display='none'; document.getElementById('pf-apply-btn').style.display='none'; return; }

  // 전체 모드: 모든 섹션 fields 합치기
  var allFields = [];
  if(_pfCurrentSec === 'all'){
    Object.keys(PF_SECTIONS).forEach(function(sec){
      PF_SECTIONS[sec].fields.forEach(function(f){ allFields.push(f); });
    });
  } else {
    var cfg = PF_SECTIONS[_pfCurrentSec]; if(!cfg) return;
    allFields = cfg.fields;
  }

  raw.split(/\n/).forEach(function(line){
    line = line.trim(); if(!line) return;
    var m = line.match(/^([^:：\-=|·•]{1,20})[:\：\-=|·•]\s*(.+)$/);
    if(!m) return;
    var rk = m[1].trim().toLowerCase().replace(/\s+/g,' '), val = m[2].trim();
    if(!val) return;
    allFields.forEach(function(f){
      if(_pfParsed[f.id]) return;
      if(f.keys.some(function(k){ return rk===k.toLowerCase()||rk.includes(k.toLowerCase()); }))
        _pfParsed[f.id] = {label:f.label, val:val, type:f.type};
    });
  });
  var keys = Object.keys(_pfParsed);
  var preEl = document.getElementById('pf-preview'), listEl = document.getElementById('pf-preview-list');
  var empEl = document.getElementById('pf-empty'), applyBtn = document.getElementById('pf-apply-btn');
  if(!keys.length){ preEl.style.display='none'; empEl.style.display=''; applyBtn.style.display='none'; return; }
  empEl.style.display='none';

  var overwriteCount = 0;
  document.getElementById('pf-match-count').textContent = keys.length+'개 인식';
  listEl.innerHTML = keys.map(function(fid, i){
    var f = _pfParsed[fid];
    var dv = f.val.length > 45 ? f.val.slice(0,45)+'…' : f.val;
    // 기존값 읽기
    var curVal = '';
    var el = document.getElementById(fid);
    if(el) curVal = (el.value||'').trim();
    else if(f.type==='role'){
      var checked = document.querySelector('input[name="p-role"]:checked');
      curVal = checked ? checked.value : '';
    } else if(f.type==='search-sel'){
      var inp = document.getElementById(fid); curVal = inp ? (inp.value||'').trim() : '';
    }
    var hasExisting = curVal && curVal !== '';
    if(hasExisting) overwriteCount++;
    var icon = hasExisting ? '🔄' : '✨';
    var existingHtml = hasExisting
      ? '<div style="font-size:11px;color:var(--text3);margin-top:1px">기존: <span style="text-decoration:line-through;color:var(--orange)">'+escHtml(curVal.length>35?curVal.slice(0,35)+'…':curVal)+'</span></div>'
      : '<div style="font-size:11px;color:var(--text3);margin-top:1px">신규 입력</div>';
    return '<label style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);cursor:pointer">'
      +'<input type="checkbox" class="pf-item-cb" data-fid="'+escHtml(fid)+'" checked style="margin-top:3px;accent-color:var(--accent);cursor:pointer;flex-shrink:0">'
      +'<div style="flex:1;min-width:0">'
      +'<div style="display:flex;align-items:center;gap:6px">'
      +'<span style="font-size:11px;color:var(--text3);min-width:75px;flex-shrink:0">'+icon+' '+escHtml(f.label)+'</span>'
      +'<span style="color:var(--accent2);font-weight:700;font-size:12.5px">'+escHtml(dv)+'</span>'
      +'</div>'
      +existingHtml
      +'</div>'
      +'</label>';
  }).join('');
  preEl.style.display=''; applyBtn.style.display='';
  // 덮어쓰기 항목 있으면 버튼 색상 변경
  var btn = document.getElementById('pf-apply-btn');
  if(btn){
    btn.textContent = overwriteCount > 0 ? '📥 적용 ('+overwriteCount+'개 덮어쓰기)' : '📥 적용';
    btn.style.background = overwriteCount > 0 ? 'var(--orange)' : '';
  }
}
// parsePasteFill 호환
function parsePasteFill(){ parseSectionPaste(); }

function pfDate(v){ var s=v.replace(/[\.\s/]/g,'-').replace(/[^0-9\-]/g,''); var m=s.match(/(20\d{2})-(\d{1,2})-(\d{1,2})/); return m?m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'):s; }
function pfMoney(v){ var s=v.replace(/,/g,''); var a=s.match(/([\d.]+)\s*억/); if(a) return String(Math.round(parseFloat(a[1])*1e8)); var w=s.match(/([\d.]+)\s*만/); if(w) return String(Math.round(parseFloat(w[1])*1e4)); return s.replace(/[^0-9]/g,''); }

function applyPasteFill(){
  // 체크된 항목만 수집
  var checkedFids = {};
  document.querySelectorAll('.pf-item-cb:checked').forEach(function(cb){ checkedFids[cb.dataset.fid] = true; });

  var applied = 0;
  Object.keys(_pfParsed).forEach(function(fid){
    if(!checkedFids[fid]) return; // 체크 안 된 항목 스킵
    var f = _pfParsed[fid];
    if(f.type==='date'){
      var el=document.getElementById(fid); if(el){el.value=pfDate(f.val);applied++;}
    } else if(f.type==='money'){
      var el=document.getElementById(fid); if(el){var m=pfMoney(f.val);if(m){el.value=parseInt(m).toLocaleString('ko-KR');applied++;}}
    } else if(f.type==='role'){
      var rv=f.val.trim();
      document.querySelectorAll('input[name="p-role"]').forEach(function(r){if(r.value===rv||rv.includes(r.value)){r.checked=true;applied++;}});
      updateProdRoleLabels();
    } else if(f.type==='search-sel'){
      searchSelSetValue(fid,f.val.trim()); applied++;
    } else if(f.type==='text'){
      var el=document.getElementById(fid); if(el){el.value=f.val;var nx=el.nextElementSibling;if(nx&&nx.textContent.includes('/'))nx.textContent=el.value.length+nx.textContent.slice(nx.textContent.indexOf('/'));applied++;}
    } else if(f.type==='inf'){
      var blk=document.getElementById('inf-block-1'); if(!blk) return;
      var map={'_inf_mcn':'.inf-mcn-1','_inf_name':'.inf-name-1','_inf_size':'.inf-size-1','_inf_yt':'.inf-yt-1','_inf_ig':'.inf-ig-1','_inf_tw':'.inf-tw-1','_inf_frate':'.inf-frate-1','_inf_famt':'.inf-famt-1','_inf_addr':'.inf-saddr-1'};
      var cls=map[fid]; if(!cls) return;
      var el=blk.querySelector(cls); if(!el) return;
      if(el.tagName==='SELECT'){Array.from(el.options).forEach(function(o){if(o.text.includes(f.val)||f.val.includes(o.text))el.value=o.value;});}
      else{el.value=(fid==='_inf_famt')?(function(){var m=pfMoney(f.val);return m?parseInt(m).toLocaleString('ko-KR'):f.val;})():f.val;}
      if(fid==='_inf_yt')  updateChannelLink(el,'youtube',1);
      if(fid==='_inf_ig')  updateChannelLink(el,'insta',1);
      if(fid==='_inf_tw')  updateChannelLink(el,'twitter',1);
      applied++;
    } else if(f.type==='app'){
      document.querySelectorAll('.appmkt-cb').forEach(function(cb){if(f.val.includes(cb.value))cb.checked=true;});
      applied++;
    }
  });
  closeMo('pastefill');
  // 섹션 펼치기 — 실제 항목이 적용된 섹션만
  var sm={product:'sec-product',inf:'sec-inf',appmkt:'sec-appmkt',settle:'sec-settle'};
  var settleFields = ['p-settle-revenue','p-settle-da','p-settle-orders'];
  if(_pfCurrentSec === 'all'){
    Object.keys(sm).forEach(function(sec){
      if(sec === 'settle'){
        // 정산 섹션은 실제 값이 적용된 경우만 열기
        var hasSettleVal = settleFields.some(function(fid){
          return _pfParsed[fid] && checkedFids && checkedFids[fid];
        });
        if(!hasSettleVal) return;
      }
      var sid = sm[sec];
      var sb = document.getElementById(sid);
      if(sb && !sb.classList.contains('open')) toggleSection(sid);
    });
  } else {
    var sid=sm[_pfCurrentSec]; if(sid){var sb=document.getElementById(sid);if(sb&&!sb.classList.contains('open'))toggleSection(sid);}
  }
  showToast('✅ '+applied+'개 항목 자동 입력!');
}


function _getShareCampaign(){
  var cid = parseInt((document.getElementById('kakao-share-btn') || {}).dataset.cid);
  return DB.campaigns.find(function(x){ return x.id === cid; });
}

function _buildShareText(c){
  var checked = {};
  document.querySelectorAll('.share-sec-cb').forEach(function(cb){ checked[cb.dataset.sec] = cb.checked; });
  var lines = ['【SSGLIVE 캠페인 공유】', ''];
  if(checked['basic']){
    lines.push('─ 캠페인 기본정보');
    if(c.name)    lines.push('캠페인명: ' + c.name);
    if(c.start||c.end) lines.push('기간: '+(c.start||'')+' ~ '+(c.end||''));
    if(c.revenue) lines.push('예상매출: '+(c.revenue/100000000).toFixed(1)+'억원');
    var pd=c.pdSingle||(c.pds&&c.pds[0])||''; if(pd) lines.push('캠페인담당: '+pd);
    if(c.reasons&&c.reasons.length) lines.push('선정사유: '+c.reasons.join(', '));
    lines.push('');
  }
  if(checked['product']&&(c.brand||c.cat||c.appeal||c.productBasicInfo)){
    lines.push('─ 상품 정보');
    if(c.productBasicInfo){
      lines.push('상품기본정보:');
      lines.push(c.productBasicInfo);
      lines.push('');
    }
    if(c.brand)    lines.push('브랜드: '+c.brand);
    if(c.company)  lines.push('협력업체: '+c.company);
    if(c.cat)      lines.push('카테고리: '+c.cat);
    if(c.mdcat)    lines.push('MDCAT: '+c.mdcat);
    if(c.appeal){
      lines.push('소구포인트: ');
      lines.push(c.appeal);
      lines.push('');
    }
    if(c.csInfo){
      lines.push('CS정보:');
      lines.push(c.csInfo);
      lines.push('');
    }
    // 배송 구조화 항목
    var _hasDelivery = c.courier||c.shipCutoff||c.shipFree||c.shipFee||c.islandFree||c.islandFee!=null||c.exchangeFee||c.returnFee;
    if(_hasDelivery){
      lines.push('─ 배송 정보');
      if(c.courier)    lines.push('택배사: '+c.courier);
      if(c.shipFree)   lines.push('배송비: 무료배송');
      else if(c.shipFee>0) lines.push('배송비: '+c.shipFee.toLocaleString()+'원');
      if(c.islandFree) lines.push('제주·도서산간: 배송불가');
      else if(c.islandFee>0) lines.push('제주·도서산간: '+c.islandFee.toLocaleString()+'원');
      if(c.exchangeFee>0) lines.push('교환 배송비: '+c.exchangeFee.toLocaleString()+'원');
      if(c.returnFee>0)   lines.push('반품비: '+c.returnFee.toLocaleString()+'원');
      if(c.shipCutoff)    lines.push('당일출고 마감: '+c.shipCutoff);
    }
    if(c.deliveryInfo) lines.push('배송정보 및 기타사항: '+c.deliveryInfo);
    lines.push('');
  }
  // 가격 정보: skus 우선, fallback priceGrid
  var _priceItems = (c.skus&&c.skus.length ? c.skus : (c.priceGrid||[])).filter(function(p){ return (p.mdPrice||0)>0||(p.price||0)>0; });
  if(checked['price'] && _priceItems.length){
    lines.push('─ 가격 정보  ※공구가=신규적립금 3천원 적용가격 (신규회원1인1회, 모든상품 사용가능)');
    _priceItems.forEach(function(p){
      var nm = p.productName||p.name||p.code||'';
      if(nm) lines.push('[ '+nm+' ]');
      var price   = p.price>0             ? p.price             : 0;
      var mdPrice = p.mdPrice>0           ? p.mdPrice           : 0;
      var final_  = p.finalPrice>0        ? p.finalPrice        : 0;
      var lowest  = p.onlineLowestPrice>0 ? p.onlineLowestPrice : 0;
      function _pct(orig,disc){ return orig>0&&disc>0&&disc<orig?' ('+Math.round((orig-disc)/orig*100)+'%↓)':''; }
      function _fk(v){ return v>0 ? v.toLocaleString() : '-'; }
      function _f(v){ return v>0 ? v.toLocaleString()+'원' : '-'; }
      // 1행: 정가 | MD | 최저 요약
      var summary = [];
      if(price>0)   summary.push('정가 '+_fk(price));
      if(mdPrice>0) summary.push('MD '+_fk(mdPrice)+_pct(price,mdPrice));
      if(lowest>0)  summary.push('최저 '+_fk(lowest));
      if(summary.length) lines.push('┃ '+summary.join(' │ '));
      // 2행: 공구가 강조
      if(final_>0)  lines.push('┗▶ ★최종공구가 '+_f(final_)+_pct(price,final_));
      if(p.promoText) lines.push('  \uae30\ud0c0: '+p.promoText);
    });
    lines.push('');
  }
  if(checked['inf']&&(c.mcn||c.infName||c.infSize||c.feeRate||c.feeAmount||(c.infData&&c.infData[0]&&(c.infData[0].feeRate||c.infData[0].feeAmount||c.infData[0].proposeFeeRate||c.infData[0].infSize)))){  // 규모·수수료만 있어도 표기
    lines.push('─ 인플루언서 정보');
    if(c.mcn)     lines.push('MCN: '+c.mcn);
    if(c.infName) lines.push('인플루언서: '+c.infName);
    var inf0 = (c.infData&&c.infData[0])||{};
    var infSizeVal = c.infSize || inf0.infSize || '';
    if(infSizeVal) lines.push('규모: '+infSizeVal);
    // 제안수수료율·원고료는 인플루언서명 유무와 무관하게 항상 표기
    var feeRate = inf0.proposeFeeRate || inf0.feeRate || c.feeRate || '';
    var feeAmt  = inf0.proposeFeeAmount || inf0.feeAmount || c.feeAmount || 0;
    if(feeRate)  lines.push('제안수수료율: '+feeRate+'%');
    if(feeAmt>0) lines.push('제안원고료: '+feeAmt.toLocaleString()+'원');
    if(inf0.feeRate && inf0.feeRate !== feeRate)   lines.push('확정수수료율: '+inf0.feeRate+'%');
    if(inf0.feeAmount && inf0.feeAmount !== feeAmt) lines.push('확정원고료: '+inf0.feeAmount.toLocaleString()+'원');
    if(c.infRequest) lines.push('인플루언서 요청사항: '+c.infRequest);
    lines.push('');
  }
  if(checked['appmkt']&&c.appMkt&&(c.appMkt.channels&&c.appMkt.channels.length||c.appMkt.landingUrl)){
    lines.push('─ 모바일마케팅');
    if(c.appMkt.na) lines.push('채널: 해당없음');
    else if(c.appMkt.channels&&c.appMkt.channels.length) lines.push('채널: '+c.appMkt.channels.join(', '));
    if(c.appMkt.landingUrl) lines.push('랜딩: '+c.appMkt.landingUrl);
    lines.push('');
  }
  if(checked['settle']&&(c.settleRevenue||c.settleDa||c.settleProcessDate||c.settlePaymentDate)){
    lines.push('─ 정산 정보');
    if(c.settleRevenue) lines.push('정산매출: '+(c.settleRevenue/100000000).toFixed(1)+'억원');
    if(c.settleDa)      lines.push('광고수익: '+c.settleDa.toLocaleString()+'원');
    if(c.settleProcessDate) lines.push('정산처리일: '+c.settleProcessDate);
    if(c.settlePaymentDate) lines.push('비용지불일: '+c.settlePaymentDate);
    lines.push('');
  }
  lines.push('🔗 SSGLIVE 인플루언서 마케팅 허브');
  return lines.join('\n');
}

// 📋 텍스트 복사 버튼
function copyShareText(){
  var c = _getShareCampaign();
  if(!c){ showToast('캠페인 정보를 찾을 수 없습니다.'); return; }
  var text = _buildShareText(c);
  _doCopy(text, function(ok){
    if(ok) showToast('✅ 복사됐습니다! 카카오톡 채팅창에 붙여넣기 하세요.');
    else   showToast('복사 실패 — 직접 선택하여 복사해 주세요.');
  });
}

// 💬 카카오톡 공유 버튼 — 텍스트 복사 후 카카오톡 전송 화면 열기
function shareToKakao(){
  var c = _getShareCampaign();
  if(!c){ showToast('캠페인 정보를 찾을 수 없습니다.'); return; }
  var shareText = _buildShareText(c);

  _doCopy(shareText, function(ok){
    if(!ok){ _copyAndShowModal(shareText); return; }

    var ua = navigator.userAgent.toLowerCase();
    var isIOS     = /iphone|ipad|ipod/.test(ua);
    var isAndroid = /android/.test(ua);

    if(isIOS){
      // iOS: kakaotalk://send?text=... 스킴으로 텍스트 전달
      var encoded = encodeURIComponent(shareText);
      // iOS Safari에서 window.location 사용
      window.location.href = 'kakaotalk://send?text=' + encoded;
      // 앱이 없으면 App Store로 폴백
      setTimeout(function(){
        window.location.href = 'https://itunes.apple.com/app/id362057947';
      }, 1500);

    } else if(isAndroid){
      // Android: Intent URL로 텍스트 전달
      var encoded2 = encodeURIComponent(shareText);
      var intentUrl = 'intent://send?text=' + encoded2
        + '#Intent;scheme=kakaotalk;package=com.kakao.talk;end';
      window.location.href = intentUrl;

    } else {
      // PC: 복사 모달 표시
      showToast('✅ 복사됐습니다! 카카오톡에 붙여넣기 하세요.');
      _copyAndShowModal(shareText);
    }
  });
}

function _copyAndShowModal(text){
  function showModal(copied){
    var ex = document.getElementById('kakao-share-modal');
    if(ex) ex.remove();
    var m = document.createElement('div');
    m.id = 'kakao-share-modal';
    m.dataset.shareText = text;
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:20000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
    var statusHtml = copied
      ? '<div style="background:#e8f8f0;color:#00875a;border-radius:8px;padding:11px 14px;font-size:13.5px;font-weight:600;margin-bottom:12px">✅ 클립보드에 복사됐습니다!</div>'
      : '<div style="background:#fff3cd;color:#856404;border-radius:8px;padding:11px 14px;font-size:13px;margin-bottom:12px">⚠️ 아래 내용을 길게 눌러 복사해 주세요.</div>';
    m.innerHTML = '<div style="background:var(--bg);border-radius:16px;padding:22px;width:100%;max-width:460px;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'
      + '<div style="font-size:16px;font-weight:800">💬 카카오톡 공유</div>'
      + '<button id="ksm-close" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text3);line-height:1">✕</button>'
      + '</div>' + statusHtml
      + '<div style="background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:14px;max-height:220px;overflow-y:auto">'
      + '<pre id="kakao-share-text" style="font-size:12px;line-height:1.7;white-space:pre-wrap;word-break:break-all;color:var(--text);font-family:inherit;margin:0">'
      + escHtml(text) + '</pre></div>'
      + '<div style="display:flex;flex-direction:column;gap:8px">'
      + '<button id="ksm-open-kakao" style="background:#FEE500;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:800;color:#3A1D1D;cursor:pointer">💬 카카오톡 앱 열기</button>'
      + '<button id="ksm-copy" style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:11px;font-size:13px;font-weight:600;color:var(--text);cursor:pointer">📋 다시 복사하기</button>'
      + '<div style="font-size:11.5px;color:var(--text3);text-align:center;line-height:1.7;background:var(--bg3);border-radius:8px;padding:10px">'
      + '채팅창 입력칸 <b>길게 누르기 → 붙여넣기</b></div>'
      + '</div></div>';
    document.body.appendChild(m);
    m.querySelector('#ksm-close').addEventListener('click', function(){ m.remove(); });
    m.querySelector('#ksm-open-kakao').addEventListener('click', function(){
      _doCopy(text, function(){ window.location.href = 'kakaotalk://'; });
    });
    m.querySelector('#ksm-copy').addEventListener('click', function(){
      _doCopy(text, function(ok){ if(ok) showToast('✅ 복사됐습니다!'); });
    });
    // 외부클릭 닫힘 비활성화
  }
  _doCopy(text, showModal);
}

function _doCopy(text, cb){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){ cb(true); }).catch(function(){ _execCmdCopy(text, cb); });
  } else { _execCmdCopy(text, cb); }
}
function _execCmdCopy(text, cb){
  try {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;width:1px;height:1px';
    document.body.appendChild(ta); ta.focus(); ta.select();
    var ok = document.execCommand('copy');
    document.body.removeChild(ta); cb(ok);
  } catch(e){ cb(false); }
}
function copyKakaoText(){
  var el = document.getElementById('kakao-share-text');
  var text = el ? el.textContent : '';
  _doCopy(text, function(ok){ if(ok) showToast('✅ 복사됐습니다! 카카오톡에 붙여넣기 하세요'); });
}

// ═══════════════════════════════════════
// 모바일: 사이드바 홈 ↔ 콘텐츠 슬라이드
// ═══════════════════════════════════════
var _isMobile = function(){ return window.innerWidth <= 768; };

function openMobContent(){
  if(!_isMobile()) return;
  var main = document.querySelector('.main');
  var back = document.getElementById('mob-back-btn');
  var ham  = document.getElementById('mob-menu-btn');
  if(main) main.classList.add('mob-content-open');
  if(back) back.style.display = 'flex';
  if(ham)  ham.style.display  = 'none';
  document.body.style.overflow = 'hidden';
}
function closeMobContent(){
  var main = document.querySelector('.main');
  var back = document.getElementById('mob-back-btn');
  if(main) main.classList.remove('mob-content-open');
  if(back) back.style.display = 'none';
  document.body.style.overflow = '';
}
// 레거시 호환 (기존 코드가 toggleMobMenu 호출 시)
function toggleMobMenu(){ closeMobContent(); }
function closeMobMenu(){ closeMobContent(); }

// nav 클릭 시 모바일에서 콘텐츠 화면으로 전환
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.nav-item').forEach(function(item){
    item.addEventListener('click', function(){
      if(_isMobile()) openMobContent();
    });
  });

  // Alt+← 키보드 뒤로가기
  document.addEventListener('keydown', function(e){
    if(e.altKey && e.key === 'ArrowLeft'){
      e.preventDefault();
      goBack();
    }
  });

  // 초기 뒤로가기 버튼 상태
  _updateBackBtn();
});

window.addEventListener('resize', function(){
  if(!_isMobile()){
    // 데스크톱으로 전환 시 초기화
    var main = document.querySelector('.main');
    if(main) main.classList.remove('mob-content-open');
    document.body.style.overflow = '';
    var back = document.getElementById('mob-back-btn');
    if(back) back.style.display = 'none';
  }
});



function doLogin(){
  var email = document.getElementById('login-email').value.trim();
  var pw = document.getElementById('login-pw').value;
  var btn = document.getElementById('login-btn');
  var errEl = document.getElementById('login-err');
  var rememberCk = document.getElementById('remember-email');
  errEl.classList.remove('show');
  if(!email || !pw){ showLoginError('이메일과 비밀번호를 입력하세요.'); return; }
  if(!fbAuth){
    // Firebase SDK 아직 로드 중 - 2초 후 자동 재시도
    showLoginError('연결 초기화 중입니다. 잠시 후 자동으로 재시도합니다...');
    btn.disabled = true;
    setTimeout(function(){
      btn.disabled = false;
      errEl.classList.remove('show');
      if(fbAuth){
        doLogin(); // 재시도
      } else {
        showLoginError('Firebase 연결에 실패했습니다. 페이지를 새로고침 해주세요.');
      }
    }, 2000);
    return;
  }
  btn.disabled = true;
  btn.textContent = '로그인 중...';
  fbAuth.signInWithEmailAndPassword(email, pw)
    .then(function(){
      // 로그인 성공: 이메일 저장 처리
      if(rememberCk && rememberCk.checked){
        localStorage.setItem('ihub-saved-email', email);
        localStorage.setItem('ihub-remember-email', '1');
      } else {
        localStorage.removeItem('ihub-saved-email');
        localStorage.removeItem('ihub-remember-email');
      }
      // 버튼 상태 유지 (로딩 중) → onAuthStateChanged에서 hideLoginScreen 호출
      btn.textContent = '진입 중...';
    })
    .catch(function(e){
      btn.disabled = false;
      btn.textContent = '로그인';
      var msg = '로그인에 실패했습니다.';
      if(e.code==='auth/user-not-found'||e.code==='auth/wrong-password'||e.code==='auth/invalid-credential') msg='이메일 또는 비밀번호가 올바르지 않습니다.';
      if(e.code==='auth/too-many-requests') msg='로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
      if(e.code==='auth/invalid-email') msg='올바른 이메일 형식을 입력하세요.';
      if(e.code==='auth/network-request-failed') msg='네트워크 연결을 확인해 주세요.';
      showLoginError(msg);
    });
}

// 저장된 이메일 복원
function restoreSavedEmail(){
  var saved = localStorage.getItem('ihub-saved-email');
  var remember = localStorage.getItem('ihub-remember-email');
  if(saved && remember === '1'){
    var emailEl = document.getElementById('login-email');
    var ckEl = document.getElementById('remember-email');
    if(emailEl) emailEl.value = saved;
    if(ckEl) ckEl.checked = true;
    // 이메일이 채워진 경우 비밀번호 필드로 포커스
    setTimeout(function(){
      var pwEl = document.getElementById('login-pw');
      if(pwEl) pwEl.focus();
    }, 100);
  }
}
function doLogout(){
  showConfirm('로그아웃 하시겠습니까?', function(){
    if(fbReady && ME_UID) fbDB.ref('presence/' + ME_UID).remove();
    if(fbAuth) fbAuth.signOut();
    else { location.reload(); }
  });
}

// ── 원격 데이터를 로컬 DB 구조로 병합 ──
function mergeRemote(remote){
  var merged = {
    products:     remote.products     ? Object.values(remote.products)     : DB.products,
    campaigns:    remote.campaigns    ? Object.values(remote.campaigns).filter(function(camp){
      // 최근 삭제된 캠페인은 listener가 복원하지 못하게 차단
      return !_recentlyDeletedCamps[String(camp.id)];
    }).map(function(camp){
      // appMkt.channels 정규화: Firebase에서 object 또는 undefined로 올 수 있음
      if(camp.appMkt){
        if(!camp.appMkt.channels){
          camp.appMkt.channels = [];
        } else if(!Array.isArray(camp.appMkt.channels)){
          camp.appMkt.channels = Object.values(camp.appMkt.channels);
        }
      } else {
        camp.appMkt = {channels:[]};
      }
      // mcnList 정규화: Firebase가 배열을 object로 반환하는 경우 처리
      if(camp.mcnList && !Array.isArray(camp.mcnList)){
        camp.mcnList = Object.values(camp.mcnList);
      }
      // infData 정규화
      if(camp.infData && !Array.isArray(camp.infData)){
        camp.infData = Object.values(camp.infData);
      }
      // settleData 정규화
      if(camp.settleData && !Array.isArray(camp.settleData)){
        camp.settleData = Object.values(camp.settleData);
      }
      // skus 정규화
      if(camp.skus && !Array.isArray(camp.skus)){
        camp.skus = Object.values(camp.skus);
      }
      // reasons 정규화
      if(camp.reasons && !Array.isArray(camp.reasons)){
        camp.reasons = Object.values(camp.reasons);
      }
      // promos 정규화
      if(camp.promos && !Array.isArray(camp.promos)){
        camp.promos = Object.values(camp.promos);
      }
      // stage 값 마이그레이션 (구버전 데이터 정규화)
      var stageMap = {
        '3.MCN요청':     '4.MCN요청',
        '5.APP마케팅':   '6.APP마케팅확정',
        '6.정산':        '7.정산',
        '7.정산완료':    '7.정산완료',
      };
      if(stageMap[camp.stage]) camp.stage = stageMap[camp.stage];
      return camp;
    }) : DB.campaigns,
    influencers:  remote.influencers  ? Object.values(remote.influencers)  : DB.influencers,
    matches:      remote.matches      ? Object.values(remote.matches)      : DB.matches,
    progress:     remote.progress     ? Object.values(remote.progress)     : DB.progress,
    mcnRequests:  remote.mcnRequests  ? Object.values(remote.mcnRequests)  : DB.mcnRequests,
    appMarketing: remote.appMarketing ? Object.values(remote.appMarketing) : DB.appMarketing,
    settlements:  remote.settlements  ? Object.values(remote.settlements)  : DB.settlements,
    activities:   remote.activities   ? Object.values(remote.activities)   : DB.activities,
    comments:     remote.comments     || DB.comments,
    files:        DB.files,
    history:      remote.history      || DB.history,
    notifications: DB.notifications,
    showhosts:    remote.showhosts    ? Object.values(remote.showhosts)    : (DB.showhosts||[]),
  };
  // nid를 Firebase 데이터의 최대 id+1 로 갱신 (중복 방지)
  var maxId = function(arr){ return arr.length ? Math.max.apply(null, arr.map(function(x){return parseInt(x.id)||0;})) + 1 : 1; };
  nid.products    = Math.max(nid.products,    maxId(merged.products));
  nid.campaigns   = Math.max(nid.campaigns,   maxId(merged.campaigns));
  nid.influencers = Math.max(nid.influencers, maxId(merged.influencers));
  nid.matches     = Math.max(nid.matches,     maxId(merged.matches));
  nid.progress    = Math.max(nid.progress,    maxId(merged.progress));
  nid.mcn         = Math.max(nid.mcn,         maxId(merged.mcnRequests));
  nid.app         = Math.max(nid.app,         maxId(merged.appMarketing));
  nid.settle      = Math.max(nid.settle,      maxId(merged.settlements));
  return merged;
}

// ── Firebase에 전체 DB 저장 ──
function pushToFirebase(){
  if(!fbReady) return;
  // fbRef.set 대신 fbRef.update로 mdcat-codes/roles/permissions/mcn-companies 보존
  var updatePayload = {
    'products':    arrToObj(DB.products),
    'campaigns':   arrToObj(DB.campaigns),
    'influencers': arrToObj(DB.influencers),
    'matches':     arrToObj(DB.matches),
    'progress':    arrToObj(DB.progress),
    'mcnRequests': arrToObj(DB.mcnRequests||[]),
    'appMarketing':arrToObj(DB.appMarketing||[]),
    'settlements': arrToObj(DB.settlements||[]),
    'activities':  arrToObj(DB.activities.slice(0,30)),
    'comments':    DB.comments,
    'history':     DB.history,
    'showhosts':   arrToObj(DB.showhosts||[]),
    '_lastWriter': ME||ME_EMAIL,
    '_lastWrite':  Date.now(),
  };
  // undefined 제거
  var cleanPayload;
  try { cleanPayload = JSON.parse(JSON.stringify(updatePayload)); } catch(e){ cleanPayload = updatePayload; }
  _suppressListener = true;
  fbRef.update(cleanPayload)
    .then(function(){
      setTimeout(function(){ _suppressListener = false; }, 1000);
    })
    .catch(function(e){
      console.warn('[pushToFirebase] 실패:', e);
      _suppressListener = false;
    });
}

// ── 특정 경로만 업데이트 (빠름) ──
function pushPath(path, val){
  if(!fbReady){ console.warn('[pushPath] fbReady=false, 저장 스킵:', path); return; }
  var ref = fbDB.ref('influencer-hub/' + path);
  if(val === null || val === undefined){
    // null이면 해당 경로 삭제
    ref.remove()
      .then(function(){ console.log('[pushPath] 삭제 성공:', path); })
      .catch(e=>{ console.error('[pushPath] 삭제 실패:', path, e); });
  } else {
    // undefined 값 제거 (Firebase는 undefined 허용 안함)
    var cleanVal;
    try { cleanVal = JSON.parse(JSON.stringify(val)); } catch(e) { cleanVal = val; }
    ref.set(cleanVal)
      .then(function(){ console.log('[pushPath] 저장 성공:', path); })
      .catch(e=>{ console.error('[pushPath] 저장 실패:', path, e); });
  }
}

// ── 배열 → Firebase 객체 변환 ──
function arrToObj(arr){ const o={}; arr.forEach(x=>{ o[x.id]=x; }); return o; }

// ── broadcastData: 이제 Firebase에 저장 ──
// Firebase 데이터 강제 초기화 (샘플 데이터로 리셋)
function resetFirebaseData(){
  if(!confirm('Firebase 데이터를 현재 샘플 데이터로 초기화하시겠습니까?\n(기존 저장된 데이터가 덮어씌워집니다)')) return;
  _suppressListener = true;
  pushToFirebase();
  showToast('데이터 초기화 완료 — 새로고침하세요');
  setTimeout(function(){ location.reload(); }, 1500);
}

function broadcastData(){
  _suppressListener = true; // 내가 쓴 데이터가 리스너로 돌아와 덮어쓰는 것 방지
  pushToFirebase();
}

// ── UI 상태 표시 ──
function setFbStatus(state){
  var dot = document.querySelector('.sync-dot');
  if(state==='connected'){ if(dot){ dot.style.background='var(--green)'; dot.title='Firebase 실시간 연결됨'; } }
  if(state==='demo'){      if(dot) dot.style.background='var(--orange)'; if(txt) txt.textContent='데모 모드 (설정 필요)'; }
}

// ── 데모용 전역 데이터 ──
var MDCAT_CODES    = [];
var MCN_COMPANIES  = [];
var _umAllUsers    = [];

function downloadFile(){
  var blob = new Blob([document.documentElement.outerHTML], {type:'text/html;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ssglive_index.html';
  a.click();
  URL.revokeObjectURL(a.href);
}

function enterDemoMode(role){
  role = role || 'admin';
  console.log('[SSGLIVE] enterDemoMode 호출됨, role:', role);
  _isDemoMode = true;
  fbReady = false;

  // 역할별 사용자 정보
  var demoUsers = {
    admin:   { name:'데모 관리자', email:'admin@ssglive.com',   role:'admin' },
    manager: { name:'박민준',      email:'minjun@ssglive.com',  role:'manager' },
    md:      { name:'이소연',      email:'soyeon@ssglive.com',  role:'md' },
  };
  var du = demoUsers[role] || demoUsers.admin;
  ME = du.name; ME_EMAIL = du.email; ME_ROLE = du.role; ME_UID = 'demo-uid-'+role;

  // 오버레이·로그인 화면 처리
  if(window._removeAuthOverlay) window._removeAuthOverlay();
  var ls = document.getElementById('login-screen');
  if(ls) ls.style.display = 'none';
  var sidebar = document.querySelector('.sidebar');
  var mainEl  = document.querySelector('.main');
  if(sidebar) sidebar.style.display = '';
  if(mainEl)  mainEl.style.display  = 'flex';  // .main은 flex container

  // ── 샘플 데이터 ──
  DB.campaigns = _demoSampleCampaigns();
  DB.campaigns.forEach(function(c){ if(!c.campCode) c.campCode = generateCampCode(c.start||c.startDate); });

  MDCAT_CODES = [
    {id:'mc1',label:'뷰티',desc:'스킨케어·메이크업',status:'active',createdAt:'2025-01-01'},
    {id:'mc2',label:'식품',desc:'건강식품·가공식품',status:'active',createdAt:'2025-01-01'},
    {id:'mc3',label:'패션',desc:'의류·잡화',status:'active',createdAt:'2025-01-01'},
    {id:'mc4',label:'IT/가전',desc:'전자기기',status:'active',createdAt:'2025-01-01'},
    {id:'mc5',label:'생활/인테리어',desc:'가구·생활용품',status:'active',createdAt:'2025-01-01'},
    {id:'mc6',label:'여행',desc:'여행·레저',status:'active',createdAt:'2025-01-01'},
  ];

  MCN_COMPANIES = [
    {id:1,name:'뷰티MCN',contact:'김미영',phone:'010-1234-5678',email:'beauty@mcn.com',memo:'뷰티 전문',createdAt:'2025-01-15'},
    {id:2,name:'스타MCN',contact:'이준호',phone:'010-2345-6789',email:'star@mcn.com',memo:'연예인 크리에이터',createdAt:'2025-02-01'},
    {id:3,name:'패션MCN',contact:'박소연',phone:'010-3456-7890',email:'fashion@mcn.com',memo:'패션·라이프',createdAt:'2025-02-10'},
    {id:4,name:'푸드MCN',contact:'정혜원',phone:'010-5678-9012',email:'food@mcn.com',memo:'음식·쿠킹',createdAt:'2025-03-05'},
    {id:5,name:'트래블MCN',contact:'한지수',phone:'010-6789-0123',email:'travel@mcn.com',memo:'여행 전문',createdAt:'2025-03-10'},
    {id:6,name:'테크MCN',contact:'오대현',phone:'010-7890-1234',email:'tech@mcn.com',memo:'IT 리뷰',createdAt:'2025-03-15'},
  ];

  _umAllUsers = [
    {uid:'u1',name:'데모 관리자',email:'admin@ssglive.com',role:'admin',status:'active',createdAt:'2025-01-01'},
    {uid:'u2',name:'박민준',email:'minjun@ssglive.com',role:'manager',status:'active',createdAt:'2025-01-10'},
    {uid:'u3',name:'이소연',email:'soyeon@ssglive.com',role:'md',status:'active',createdAt:'2025-01-15'},
    {uid:'u4',name:'김담당',email:'kim@ssglive.com',role:'md',status:'active',createdAt:'2025-02-01'},
    {uid:'u5',name:'최현우',email:'choi@ssglive.com',role:'md',status:'active',createdAt:'2025-02-10'},
    {uid:'u6',name:'뷰어계정',email:'viewer@ssglive.com',role:'viewer',status:'active',createdAt:'2025-03-01'},
  ];

  // 캠페인 담당 드롭다운용 사용자 목록
  MANAGER_USERS = [
    {uid:'u1',name:'데모 관리자',role:'admin',status:'active'},
    {uid:'u2',name:'박민준',role:'manager',status:'active'},
  ];
  MD_USERS = [
    {uid:'u3',name:'이소연',role:'md',status:'active'},
    {uid:'u4',name:'김담당',role:'md',status:'active'},
    {uid:'u5',name:'최현우',role:'md',status:'active'},
  ];

  // 사용자 정보 적용
  if(typeof applyUserData === 'function')
    applyUserData({name:ME, role:ME_ROLE, email:ME_EMAIL, mcnCompany:''});

  // 상태 표시
  var roleLabel = {admin:'관리자', manager:'매니저', md:'MD'}[ME_ROLE] || ME_ROLE;
  var txt = document.getElementById('online-text');
  if(txt) txt.textContent = '데모 ['+roleLabel+'] (샘플 데이터)';

  // ds-month-input
  var mi = document.getElementById('ds-month-input');
  if(mi){ var d=new Date(); mi.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }

  initMoneyInputs();

  // 렌더링
  setTimeout(function(){
    goPage('dashboard');
    renderCalendar();
    updateBadges();
    renderS1(); renderS2(); renderS3(); renderS4();
    renderS5(); renderS6(); renderS7();
    renderCamps(); renderInfs(); loadInfAiFromDb(); loadMliveFromDb(); loadTargetsFromDb();
    // 기본정보 관리
    if(typeof renderMdcatTable==='function') renderMdcatTable();
    if(typeof renderMcnTable==='function')   renderMcnTable();
  }, 50);

  showToast('🔍 데모 모드 (저장 안됨)');
}

function _demoSampleCampaigns(){
  var today = new Date();
  var fmt = function(d){ return d.toISOString().slice(0,10); };
  var add = function(days){ var d=new Date(today); d.setDate(d.getDate()+days); return fmt(d); };
  var _demoCamps = [
    {id:1001,name:'봄 신상 뷰티 캠페인',stage:'1.캠페인요청',cat:'뷰티',role:'메가',infSize:'메가',revenue:50000000,start:add(5),end:add(12),owner:'이소연',pdSingle:'박민준',mcn:'뷰티MCN',infName:'뷰티크리에이터A',campType:'온라인',mdcat:'온라인',infData:[{infName:'뷰티크리에이터A',infSize:'메가',feeRate:15}]},
    {id:1002,name:'여름 패션 앵콜',stage:'1.캠페인요청',cat:'패션',role:'앵콜',infSize:'미들',revenue:30000000,start:add(3),end:add(10),owner:'김담당',pdSingle:'이소연',mcn:'패션MCN',infName:'패션스타B',campType:'방송',mdcat:'패션',infData:[{infName:'패션스타B',infSize:'미들',feeRate:12}]},
    {id:1003,name:'신세계 맨즈컬렉션',stage:'2.캠페인확정',cat:'패션',role:'미들',infSize:'메가',revenue:80000000,start:add(7),end:add(14),owner:'박민준',pdSingle:'박민준',mcn:'패션MCN',infName:'멘즈패션C',campType:'방송',mdcat:'패션',infData:[{infName:'멘즈패션C',infSize:'메가',feeRate:18}]},
    {id:1004,name:'까사미아 소파 1차',stage:'3.상품정보등록',cat:'생활/인테리어',role:'메가',infSize:'메가',revenue:120000000,start:add(10),end:add(17),owner:'최현우',pdSingle:'최현우',mcn:'뷰티MCN',infName:'인테리어D',campType:'온라인',mdcat:'온라인',infData:[{infName:'인테리어D',infSize:'메가',feeRate:20}]},
    {id:1005,name:'태국망고 라이브',stage:'5.인플루언서확정',cat:'식품',role:'메가',infSize:'메가',revenue:50000000,start:add(-5),end:add(2),owner:'이소연',pdSingle:'이소연',mcn:'푸드MCN',infName:'암암해혜야',infData:[{infName:'암암해혜야',infSize:'메가',feeRate:15}]},
    {id:1006,name:'제스프리 루비 키위',stage:'5.인플루언서확정',cat:'식품',role:'앵콜',infSize:'미들',revenue:10000000,start:add(2),end:add(9),owner:'김담당',pdSingle:'김담당',mcn:'스타MCN',infName:'위드허니',infData:[{infName:'위드허니',infSize:'미들',feeRate:10}]},
    {id:1007,name:'크리스프파워 프레첼',stage:'6.APP마케팅확정',cat:'식품',role:'메가',infSize:'메가',revenue:150000000,start:add(1),end:add(8),owner:'박민준',pdSingle:'박민준',mcn:'푸드MCN',infName:'건강푸드E',campType:'방송',mdcat:'식품',infData:[{infName:'건강푸드E',infSize:'메가',feeRate:17}]},
    {id:1008,name:'모두투어 방콕 패키지',stage:'7.정산',cat:'여행',role:'미들',infSize:'미들',revenue:20000000,start:add(-10),end:add(-3),owner:'최현우',pdSingle:'최현우',mcn:'트래블MCN',infName:'여행유튜버F',settleRevenue:18500000,settleOrders:120,infData:[{infName:'여행유튜버F',infSize:'미들',feeRate:13}]},
    {id:1009,name:'SSG 뷰티페스타',stage:'2.캠페인확정',cat:'뷰티',role:'메가',infSize:'메가',revenue:200000000,start:add(14),end:add(21),owner:'이소연',pdSingle:'이소연',mcn:'뷰티MCN',infName:'뷰티퀸G',campType:'온라인',mdcat:'온라인',infData:[{infName:'뷰티퀸G',infSize:'메가',feeRate:20}]},
    {id:1010,name:'나이키 러닝화 신상',stage:'4.MCN요청',cat:'패션',role:'미들',infSize:'미들',revenue:45000000,start:add(8),end:add(15),owner:'박민준',pdSingle:'박민준',mcn:'스타MCN',infName:'스포츠H',infData:[{infName:'스포츠H',infSize:'미들',feeRate:14}]},
    {id:1011,name:'다이슨 헤어드라이어',stage:'3.상품정보등록',cat:'IT/가전',role:'메가',infSize:'메가',revenue:90000000,start:add(6),end:add(13),owner:'김담당',pdSingle:'김담당',mcn:'테크MCN',infName:'테크리뷰어I',infData:[{infName:'테크리뷰어I',infSize:'메가',feeRate:16}]},
    {id:1012,name:'제주삼다수 정기배송',stage:'1.캠페인요청',cat:'식품',role:'앵콜',infSize:'시딩',revenue:8000000,start:add(4),end:add(11),owner:'최현우',pdSingle:'최현우',mcn:'푸드MCN',infName:'일상유튜버J',infData:[{infName:'일상유튜버J',infSize:'시딩',feeRate:8}]},
    // ── 모바일라이브 데모 ──
    {id:2001,name:'스킨랩 비타민C 세럼 라이브',stage:'6.APP마케팅확정',cat:'뷰티',campType:'모바일라이브',revenue:80000000,start:add(0)+'T10:00',end:add(0)+'T11:00',confirmStart:add(0)+'T10:00',confirmEnd:add(0)+'T11:00',owner:'이소연',mdcat:'뷰티',appMkt:{channels:['모바일라이브'],liveCode:'202604130101',liveDt:add(0)+'T10:00'},totalRevenue:42000000,onairRevenue:28000000,offairRevenue:14000000,showhosts:{req1:'김쇼호',conf1:'김쇼호'}},
    {id:2002,name:'헬씨팜 그린스무디 라이브',stage:'7.정산',cat:'식품',campType:'모바일라이브',revenue:50000000,start:add(1)+'T18:00',end:add(1)+'T19:00',confirmStart:add(1)+'T18:00',confirmEnd:add(1)+'T19:00',owner:'박민준',mdcat:'식품',appMkt:{channels:['모바일라이브'],liveCode:'202604140201',liveDt:add(1)+'T18:00'},totalRevenue:35000000,onairRevenue:22000000,offairRevenue:13000000,settleDone:false,showhosts:{req1:'박라이브',conf1:'박라이브'}},
    {id:2003,name:'모던핏 린넨셔츠 라이브',stage:'2.캠페인확정',cat:'패션',campType:'모바일라이브',revenue:30000000,start:add(3)+'T20:00',end:add(3)+'T21:00',confirmStart:add(3)+'T20:00',confirmEnd:add(3)+'T21:00',owner:'최현우',mdcat:'패션',appMkt:{channels:['모바일라이브'],liveCode:'202604160301',liveDt:add(3)+'T20:00'},showhosts:{req1:'이호스트',req2:'최호스트'}},
    {id:2004,name:'다시보는 스킨랩 비타민C 세럼',stage:'6.APP마케팅확정',cat:'뷰티',campType:'모바일라이브',revenue:15000000,start:add(2)+'T10:00',end:add(2)+'T11:00',confirmStart:add(2)+'T10:00',confirmEnd:add(2)+'T11:00',owner:'이소연',mdcat:'뷰티',appMkt:{channels:['모바일라이브'],liveCode:'202604150102',liveDt:add(2)+'T10:00'},showhosts:{conf1:'김쇼호'}},
    {id:2005,name:'나이키 러닝화 라이브',stage:'1.캠페인요청',cat:'패션',campType:'모바일라이브',revenue:60000000,start:add(5)+'T18:00',end:add(5)+'T19:00',owner:'박민준',mdcat:'패션',appMkt:{channels:['모바일라이브'],liveDt:add(5)+'T18:00'},showhosts:{req1:'박라이브'}},
    {id:2006,name:'다이슨 에어랩 라이브',stage:'3.상품정보등록',cat:'IT/가전',campType:'모바일라이브',revenue:120000000,start:add(7)+'T20:00',end:add(7)+'T21:00',confirmStart:add(7)+'T20:00',confirmEnd:add(7)+'T21:00',owner:'김담당',mdcat:'가전',appMkt:{channels:['모바일라이브'],liveCode:'202604200401',liveDt:add(7)+'T20:00'},showhosts:{req1:'이호스트',conf1:'이호스트'}},
    // ── 성과분석용 과거 완료 데모 (인플루언서) ──
    {id:3001,name:'유러피안샐러드',stage:'7.정산',cat:'식품',role:'미들',infSize:'미들',revenue:152000000,start:add(-42),end:add(-35),owner:'이소연',pdSingle:'이소연',mcn:'푸드MCN',infName:'유러피안셀러드',mdcat:'온라인',settleRevenue:152000000,settleOrders:2,settleDa:500000,infData:[{infName:'유러피안셀러드',infSize:'미들',feeRate:12}],settleData:[{revenue:152000000,orders:2}],appMkt:{channels:['모바일라이브'],liveCode:'202603020101',liveDt:add(-42)+'T10:00'}},
    {id:3002,name:'모두투어-나트랑',stage:'7.정산',cat:'여행',role:'미들',infSize:'미들',revenue:275000000,start:add(-25),end:add(-18),owner:'박민준',pdSingle:'박민준',mcn:'트래블MCN',infName:'여행유튜버F',mdcat:'온라인',settleRevenue:275000000,settleOrders:40,settleDa:600000,infData:[{infName:'여행유튜버F',infSize:'미들',feeRate:10}],settleData:[{revenue:275000000,orders:40}],appMkt:{channels:['모바일라이브'],liveCode:'202603200201',liveDt:add(-25)+'T18:00'}},
    {id:3003,name:'태국망고',stage:'7.정산',cat:'식품',role:'메가',infSize:'메가',revenue:950000000,start:add(-22),end:add(-15),owner:'이소연',pdSingle:'이소연',mcn:'푸드MCN',infName:'암암해혜야',mdcat:'온라인',settleRevenue:950000000,settleOrders:35,settleDa:1300000,infData:[{infName:'암암해혜야',infSize:'메가',feeRate:15}],settleData:[{revenue:950000000,orders:35}],appMkt:{channels:['모바일라이브'],liveCode:'202603220301',liveDt:add(-22)+'T20:00'}},
    {id:3004,name:'모두투어-방콕',stage:'7.정산',cat:'여행',role:'미들',infSize:'미들',revenue:12000000,start:add(-8),end:add(-1),owner:'최현우',pdSingle:'최현우',mcn:'트래블MCN',infName:'여행유튜버F',mdcat:'온라인',settleRevenue:12000000,settleOrders:3,settleDa:500000,infData:[{infName:'여행유튜버F',infSize:'미들',feeRate:10}],settleData:[{revenue:12000000,orders:3}]},
    {id:3005,name:'제스프리 키위',stage:'7.정산',cat:'식품',role:'앵콜',infSize:'미들',revenue:320000000,start:add(-15),end:add(-8),owner:'김담당',pdSingle:'김담당',mcn:'푸드MCN',infName:'위드허니',mdcat:'온라인',settleRevenue:320000000,settleOrders:50,settleDa:800000,infData:[{infName:'위드허니',infSize:'미들',feeRate:10}],settleData:[{revenue:320000000,orders:50}]},
  ];
  // ── 성과분석용 M라이브 데모 데이터 ──
  var yy=String(new Date().getFullYear()).slice(2), mm=String(new Date().getMonth()+1).padStart(2,'0');
  var pm=new Date().getMonth()===0?12:new Date().getMonth(), pmm=String(pm).padStart(2,'0');
  var pyy=pm===12?String(new Date().getFullYear()-1).slice(2):yy;
  var mkCode=function(mon,seq){ return (mon===mm?yy:pyy)+mon+String(seq).padStart(4,'0'); };
  _mliveData = [
    // ── 전월 데이터 ──
    {code:mkCode(pmm,1001),date:add(-38),broadcastType:'본방',programName:'유러피안샐러드',startTime:'10:00',endTime:'11:00',orderQty:3,orderAmt:15200000,mobOrderAmt:10200000,mobOrderQty:2,profitRate:5,profitAmt:760000,viewers:49,marketingFee:230000,adRevenue:217000,dealCode:'D'+pmm+'01',mdName:'이소연'},
    {code:mkCode(pmm,2001),date:add(-31),broadcastType:'본방',programName:'모두투어-나트랑',startTime:'18:00',endTime:'19:00',orderQty:40,orderAmt:27500000,mobOrderAmt:18900000,mobOrderQty:28,profitRate:6,profitAmt:1650000,viewers:26,marketingFee:200000,adRevenue:118000,dealCode:'D'+pmm+'02',mdName:'박민준'},
    {code:mkCode(pmm,3001),date:add(-25),broadcastType:'본방',programName:'태국망고 1차',startTime:'20:00',endTime:'21:00',orderQty:50,orderAmt:95000000,mobOrderAmt:48800000,mobOrderQty:35,profitRate:9.5,profitAmt:9025000,viewers:45,marketingFee:1300000,adRevenue:414000,dealCode:'D'+pmm+'03',mdName:'이소연'},
    {code:mkCode(pmm,1002),date:add(-24),broadcastType:'다시보기',programName:'유러피안샐러드 재방',startTime:'10:00',endTime:'11:00',orderQty:1,orderAmt:4800000,mobOrderAmt:3100000,mobOrderQty:1,profitRate:5,profitAmt:240000,viewers:18,marketingFee:80000,adRevenue:67000,dealCode:'D'+pmm+'01',mdName:'이소연'},
    {code:mkCode(pmm,4001),date:add(-22),broadcastType:'본방',programName:'제스프리 키위',startTime:'14:00',endTime:'15:00',orderQty:62,orderAmt:38500000,mobOrderAmt:24200000,mobOrderQty:41,profitRate:7,profitAmt:2695000,viewers:38,marketingFee:420000,adRevenue:182000,dealCode:'D'+pmm+'04',mdName:'김담당'},
    {code:mkCode(pmm,5001),date:add(-17),broadcastType:'본방',programName:'다이슨 에어랩',startTime:'20:00',endTime:'21:00',orderQty:18,orderAmt:112000000,mobOrderAmt:74000000,mobOrderQty:12,profitRate:8,profitAmt:8960000,viewers:92,marketingFee:1500000,adRevenue:621000,dealCode:'D'+pmm+'05',mdName:'김담당'},
    {code:mkCode(pmm,6001),date:add(-14),broadcastType:'본방',programName:'SSG 뷰티페스타',startTime:'18:00',endTime:'19:30',orderQty:35,orderAmt:68000000,mobOrderAmt:44200000,mobOrderQty:23,profitRate:6.5,profitAmt:4420000,viewers:71,marketingFee:800000,adRevenue:298000,dealCode:'D'+pmm+'06',mdName:'이소연'},
    // ── 당월 데이터 ──
    {code:mkCode(mm,1001),date:add(-10),broadcastType:'본방',programName:'스킨랩 비타민C 세럼',startTime:'10:00',endTime:'11:00',orderQty:15,orderAmt:42000000,mobOrderAmt:28000000,mobOrderQty:10,profitRate:7,profitAmt:2940000,viewers:85,marketingFee:500000,adRevenue:364900,dealCode:'D'+mm+'01',mdName:'이소연'},
    {code:mkCode(mm,2001),date:add(-7),broadcastType:'본방',programName:'헬씨팜 그린스무디',startTime:'18:00',endTime:'19:00',orderQty:22,orderAmt:35000000,mobOrderAmt:22000000,mobOrderQty:14,profitRate:6.5,profitAmt:2275000,viewers:54,marketingFee:350000,adRevenue:138300,dealCode:'D'+mm+'02',mdName:'박민준'},
    {code:mkCode(mm,3001),date:add(-5),broadcastType:'본방',programName:'모던핏 린넨셔츠',startTime:'20:00',endTime:'21:00',orderQty:45,orderAmt:28500000,mobOrderAmt:18900000,mobOrderQty:30,profitRate:5.5,profitAmt:1567500,viewers:62,marketingFee:380000,adRevenue:162000,dealCode:'D'+mm+'03',mdName:'최현우'},
    {code:mkCode(mm,1002),date:add(-4),broadcastType:'다시보기',programName:'스킨랩 비타민C 재방',startTime:'10:00',endTime:'11:00',orderQty:5,orderAmt:12500000,mobOrderAmt:8200000,mobOrderQty:3,profitRate:7,profitAmt:875000,viewers:29,marketingFee:150000,adRevenue:94000,dealCode:'D'+mm+'01',mdName:'이소연'},
    {code:mkCode(mm,4001),date:add(-2),broadcastType:'본방',programName:'나이키 러닝화',startTime:'20:00',endTime:'21:00',orderQty:28,orderAmt:52000000,mobOrderAmt:34000000,mobOrderQty:18,profitRate:7.5,profitAmt:3900000,viewers:77,marketingFee:650000,adRevenue:276000,dealCode:'D'+mm+'04',mdName:'박민준'},
    {code:mkCode(mm,5001),date:add(0),broadcastType:'본방',programName:'까사미아 소파',startTime:'14:00',endTime:'15:30',orderQty:8,orderAmt:88000000,mobOrderAmt:58000000,mobOrderQty:5,profitRate:8.5,profitAmt:7480000,viewers:95,marketingFee:1200000,adRevenue:539000,dealCode:'D'+mm+'05',mdName:'최현우'},
    {code:mkCode(mm,6001),date:add(2),broadcastType:'본방',programName:'SSG 여름 뷰티',startTime:'18:00',endTime:'19:00',orderQty:31,orderAmt:47000000,mobOrderAmt:31000000,mobOrderQty:21,profitRate:6,profitAmt:2820000,viewers:68,marketingFee:580000,adRevenue:201000,dealCode:'D'+mm+'06',mdName:'이소연'},
    {code:mkCode(mm,7001),date:add(5),broadcastType:'본방',programName:'제주삼다수 정기배송',startTime:'20:00',endTime:'21:00',orderQty:55,orderAmt:18500000,mobOrderAmt:12000000,mobOrderQty:36,profitRate:4.5,profitAmt:832500,viewers:41,marketingFee:200000,adRevenue:89000,dealCode:'D'+mm+'07',mdName:'김담당'},
  ];
  // 데모 월별 목표
  var _now=new Date(), _cy=_now.getFullYear(), _cm=_now.getMonth();
  var _mk=function(y,m){ var rm=((m%12)+12)%12; var ry=y+Math.floor(m/12); return ry+'-'+String(rm+1).padStart(2,'0'); };
  _monthlyTargets[_mk(_cy,_cm)]   = {mlive:450000000, inf:200000000};
  _monthlyTargets[_mk(_cy,_cm-1)] = {mlive:500000000, inf:220000000};
  _monthlyTargets[_mk(_cy,_cm-2)] = {mlive:420000000, inf:180000000};
  _monthlyTargets[_mk(_cy,_cm-3)] = {mlive:380000000, inf:160000000};
  return _demoCamps;
}
function updateOnline(){
  var n = onlineUsers.size;
  var names = [...onlineUsers].slice(0,3).join(', ');
  document.getElementById('online-text').textContent =
    n<=1 ? `${ME} (나만 접속 중)` : `${n}명 동시 접속: ${names}`;
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
const getProd=(id)=> DB.products.find(p=>p.id===id)||{name:'-'};
const getCamp=(id)=> DB.campaigns.find(c=>c.id===id)||{name:'-'};
const getInf=(id)=> DB.influencers.find(i=>i.id===id)||{name:'-',handle:''};
const fmtN=(n)=>{ if(!n) return '-'; return n>=10000?(n/10000).toFixed(1)+'만':n.toLocaleString(); };
const today=()=>new Date().toISOString().slice(0,10);
const nowStr=()=>{ const d=new Date(); return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`; };

const BADGE_MAP={
  '준비':'bb','진행':'bg','검수':'bo','완료':'bk','활성':'bg','비활성':'bk',
  '승인대기':'bo','승인':'bg','거절':'br',
  '발송완료':'bg','미발송':'bk','제출완료':'bb','미제출':'bk',
  '검수중':'bo','반려':'br','대기':'bk',
  '업로드완료':'bg','미업로드':'bk',
  '정산완료':'bg','미확정':'bo','정산예정':'bk','정산중':'bo',
};
const badge=(s)=>`<span class="badge ${BADGE_MAP[s]||'bk'}">${s}</span>`;

const AV_COLORS=['#6c5ce7','#00b894','#e17055','#0984e3','#fd79a8','#fdcb6e'];
const avColor=(name)=> AV_COLORS[(name?.charCodeAt(0)||0)%AV_COLORS.length];

// ═══════════════════════════════════════
// NAV
// ═══════════════════════════════════════
const PAGE_TITLES={dashboard:'대시보드',s1:'1단계 · 캠페인요청',s2:'2단계 · 캠페인확정',s3:'3단계 · 상품정보등록',s4:'4단계 · MCN요청',s5:'5단계 · 인플루언서확정',s6:'6단계 · 모바일마케팅',s7:'7단계 · 정산',s8:'8단계 · 성과분석',influencers:'인플루언서 DB',campaigns:'전체 캠페인',usermgmt:'사용자 관리',mcnmgmt:'MCN 업체 관리',basemgmt:'기본정보 관리'};

// ── 페이지 히스토리 스택 ──────────────────────────────────────
var _pageStack = [];
var _currentPage = 'dashboard';
var _isDemoMode = false;

function _updateBackBtn(){
  var btn = document.getElementById('page-back-btn');
  if(!btn) return;
  var show = _pageStack.length > 0 && _currentPage !== 'dashboard';
  btn.style.display = show ? 'inline-flex' : 'none';
}

function goBack(){
  if(_pageStack.length === 0){ _goPageInternal('dashboard', null, false); return; }
  var prev = _pageStack.pop();
  _goPageInternal(prev.page, null, false);
  setTimeout(function(){
    var main = document.querySelector('.main');
    if(main && prev.scrollY) main.scrollTop = prev.scrollY;
  }, 80);
}

// 모바일 사이드바 토글
// PC 사이드바 접기/펼치기
function toggleSidebarCollapse(){
  var sb = document.querySelector('.sidebar');
  sb.classList.toggle('collapsed');
}

function toggleMobSidebar(){
  var sb = document.querySelector('.sidebar');
  var ov = document.getElementById('mob-overlay');
  if(sb.classList.contains('mob-open')){
    sb.classList.remove('mob-open');
    if(ov) ov.classList.remove('show');
  } else {
    sb.classList.add('mob-open');
    if(ov) ov.classList.add('show');
  }
}
function closeMobSidebar(){
  var sb = document.querySelector('.sidebar');
  var ov = document.getElementById('mob-overlay');
  if(sb) sb.classList.remove('mob-open');
  if(ov) ov.classList.remove('show');
}

function goPage(page, el){
  // 모바일 사이드바 닫기
  if(window.innerWidth <= 768) closeMobSidebar();
  // 권한 체크
  if(isExtMcn() && !MCN_ALLOWED_PAGES.includes(page)){
    showToast('접근 권한이 없습니다.'); return;
  }
  if((page==='usermgmt'||page==='mcnmgmt') && !isAdmin()){
    showToast('관리자만 접근할 수 있습니다.'); return;
  }
  // 같은 페이지 재클릭은 스택 미적립
  if(page !== _currentPage){
    var main = document.querySelector('.main');
    _pageStack.push({ page: _currentPage, scrollY: main ? main.scrollTop : 0 });
    if(_pageStack.length > 30) _pageStack.shift();
  }
  _goPageInternal(page, el, true);
  // 확정대상 모드면 날짜 필터 dim 재적용
  setTimeout(function(){
    ['s2','s3','s4','s5','s6','s7'].forEach(function(sn){
      if(pageFilter[sn]==='target'){
        var fromEl = document.getElementById('df-'+sn+'-from');
        var dw = fromEl ? fromEl.closest('.date-filter') : null;
        if(dw){
          dw.style.opacity='0.35'; dw.style.pointerEvents='none';
          var fe=document.getElementById('df-'+sn+'-from'), te=document.getElementById('df-'+sn+'-to');
          if(fe){ fe.value=''; fe.style.color='transparent'; }
          if(te){ te.value=''; te.style.color='transparent'; }
        }
      }
    });
  }, 50);
}

function _goPageInternal(page, el, scrollTop){
  // 권한 체크 (goBack()에서 호출 시에도 동일하게 적용)
  if(isExtMcn() && !MCN_ALLOWED_PAGES.includes(page)){
    // 접근 불가 페이지면 대시보드로 대체
    page = 'dashboard';
  }
  if((page==='usermgmt'||page==='mcnmgmt') && !isAdmin()){
    page = 'dashboard';
  }
  // nav active 처리
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
  var navEl = el || document.querySelector('[data-page="'+page+'"]');
  if(navEl) navEl.classList.add('active');
  var _pageTtl = PAGE_TITLES[page]||page;
  // M라이브 모드일 때 단계 화면 제목을 M라이브 워크플로 명칭으로 치환
  var MLIVE_TITLES = {s1:'1단계 · 편성요청', s2:'2단계 · 편성확정', s3:'3단계 · 상품정보등록', s6:'4단계 · 모바일마케팅', s7:'5단계 · 정산', s8:'6단계 · 성과분석'};
  if(/^s\d$/.test(page)){
    if(_dashMode==='mlive' && MLIVE_TITLES[page]) _pageTtl = MLIVE_TITLES[page];
    var _modeLabel = _dashMode==='mlive' ? '📺 모바일라이브' : '👤 인플루언서 마케팅';
    _pageTtl = _modeLabel + ' · ' + _pageTtl;
  }
  document.getElementById('page-ttl').textContent = _pageTtl;

  // 모든 페이지 숨김, 대상 페이지만 표시
  document.querySelectorAll('.page').forEach(function(p){
    p.classList.remove('active');
    p.style.display = '';  // CSS .page{display:none}에 위임
  });
  var pageEl = document.getElementById('page-'+page);
  if(pageEl){
    pageEl.classList.add('active');
    pageEl.style.display = '';  // CSS .page.active{display:block!important}에 위임
  }

  _currentPage = page;
  _updateBackBtn();

  // 새 페이지 이동 시 최상단 스크롤
  if(scrollTop){
    var mainEl = document.querySelector('.main');
    if(mainEl) mainEl.scrollTop = 0;
  }

  // 페이지별 렌더
  // 전체캠페인 진입 시 사이드바 모드와 탭 동기화
  if(page==='campaigns'){
    _campTypeFilter = _dashMode==='mlive' ? '모바일라이브' : '인플루언서';
    var tInf=document.getElementById('camp-type-tab-inf');
    var tMl=document.getElementById('camp-type-tab-mlive');
    if(tInf){ tInf.classList.toggle('active', _dashMode!=='mlive'); }
    if(tMl){ tMl.classList.toggle('active', _dashMode==='mlive'); }
  }
  if(page==='usermgmt') renderUserTable();
  else if(page==='mcnmgmt') renderMcnTable();
  else renderPage(page);
}

function renderPage(p){
  if(p==='dashboard')   renderDash();
  if(p==='s1')          renderS1();
  if(p==='s2')          renderS2();
  if(p==='s3')          renderS3();
  if(p==='s4')          renderS4();
  if(p==='s5')          renderS5();
  if(p==='s6')          renderS6();
  if(p==='s7')          renderS7();
  if(p==='s8')          { if(!document.getElementById('s7-date-from')?.value) initS7DateFilter(); renderReports(); }
  if(p==='influencers') renderInfs();
  if(p==='campaigns')   renderCamps();
  if(p==='usermgmt')    renderUserTable();
  if(p==='mcnmgmt')     renderMcnTable();
  if(p==='basemgmt')    renderBasemgmt();
  // 카드 제목을 M라이브/인플 모드에 맞게 갱신
  var MLIVE_CARD = {s1:'1단계 · 편성요청',s2:'2단계 · 편성확정',s3:'3단계 · 상품정보등록',s6:'4단계 · 모바일마케팅',s7:'5단계 · 정산'};
  var INF_CARD = {s1:'1단계 · 캠페인 요청',s2:'2단계 · 캠페인 확정',s3:'3단계 · 상품정보등록',s6:'6단계 · 모바일마케팅',s7:'7단계 · 정산 관리'};
  var _ct = _dashMode==='mlive' ? MLIVE_CARD : INF_CARD;
  if(_ct[p]){ var _ce=document.getElementById(p+'-card-title'); if(_ce) _ce.textContent=_ct[p]; }
}

// ═══════════════════════════════════════
// ═══════════════════════════════════════
// DASHBOARD MODE (인플루언서 / 모바일라이브)
// ═══════════════════════════════════════
var _dashMode = 'inf'; // 'inf' | 'mlive'
var _mlDashCalDate = (function(){ var d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();

function switchDashMode(mode){
  _dashMode = mode;
  // 탭 스타일
  var tabInf  = document.getElementById('dash-tab-inf');
  var tabMl   = document.getElementById('dash-tab-mlive');
  if(tabInf){
    tabInf.style.borderBottomColor = mode==='inf'?'var(--accent)':'transparent';
    tabInf.style.color = mode==='inf'?'':'var(--text3)';
    tabInf.classList.toggle('active', mode==='inf');
  }
  if(tabMl){
    tabMl.style.borderBottomColor = mode==='mlive'?'var(--accent)':'transparent';
    tabMl.style.color = mode==='mlive'?'':'var(--text3)';
    tabMl.classList.toggle('active', mode==='mlive');
  }
  // 영역 표시/숨김
  var infArea  = document.getElementById('dash-inf-area');
  var mlArea   = document.getElementById('dash-mlive-area');
  if(infArea) infArea.style.display = mode==='inf'?'':'none';
  if(mlArea)  mlArea.style.display  = mode==='mlive'?'':'none';
  // 사이드바 전환
  switchSidebarMode(mode);
  // 사이드바 라디오 동기화
  var sbInf = document.getElementById('sidebar-mode-inf');
  var sbMl  = document.getElementById('sidebar-mode-mlive');
  if(sbInf){
    sbInf.style.borderColor = mode==='inf'?'var(--accent)':'var(--border)';
    sbInf.style.background  = mode==='inf'?'var(--accent-bg)':'var(--bg)';
    var ri = sbInf.querySelector('input'); if(ri) ri.checked = mode==='inf';
  }
  if(sbMl){
    sbMl.style.borderColor = mode==='mlive'?'var(--accent)':'var(--border)';
    sbMl.style.background  = mode==='mlive'?'var(--accent-bg)':'var(--bg)';
    var rm = sbMl.querySelector('input'); if(rm) rm.checked = mode==='mlive';
  }
  // M-live 대시보드 렌더
  if(mode==='mlive'){
    renderMliveDash();
  } else {
    renderDash();
  }
  // 모드 전환 시 전체캠페인 뱃지 수량도 갱신
  if(typeof updateBadges==='function') updateBadges();
}

function switchSidebarMode(mode){
  var infNav  = document.getElementById('sidebar-inf-nav');
  var mlNav   = document.getElementById('sidebar-mlive-nav');
  if(infNav) infNav.style.display = mode==='inf'?'':'none';
  if(mlNav)  mlNav.style.display  = mode==='mlive'?'':'none';
}

// M-live 대시보드 렌더
function renderMliveDash(){
  // MD 블록
  var mdBlock = document.getElementById('dash-mlive-md-block');
  if(ME_ROLE==='md' && mdBlock){
    mdBlock.style.display = '';
    var greet = document.getElementById('dash-mlive-md-greeting');
    if(greet) greet.textContent = ME+'님, 안녕하세요!';
    // 본인 MD 담당 M-live 중 상품정보 미입력
    var myMlive = DB.campaigns.filter(function(c){
      if((c.campType||'')!=='모바일라이브') return false;
      return (c.owner||'').trim()===ME;
    });
    var noInfoCnt = myMlive.filter(function(c){
      return c.stage==='2.캠페인확정'||c.stage==='3.상품정보등록';
    }).length;
    var cntEl = document.getElementById('dash-mlive-md-req-count');
    if(cntEl) cntEl.textContent = noInfoCnt;
    // 이번 달 매출
    var now=new Date(), curY=now.getFullYear(), curM=now.getMonth();
    var msStart=curY+'-'+String(curM+1).padStart(2,'0')+'-01';
    var msEnd=curY+'-'+String(curM+1).padStart(2,'0')+'-'+String(new Date(curY,curM+1,0).getDate()).padStart(2,'0');
    var allMlive = DB.campaigns.filter(function(c){ return (c.campType||'')==='모바일라이브'; });
    var monthRev = allMlive.filter(function(c){
      var cs=(c.start||'').slice(0,10), ce=(c.end||'').slice(0,10);
      return cs&&ce&&cs<=msEnd&&ce>=msStart;
    }).reduce(function(s,c){return s+(c.revenue||0);},0);
    var revEl = document.getElementById('dash-mlive-md-revenue');
    if(revEl) revEl.textContent = (monthRev/100000000).toFixed(1);
    var rmEl = document.getElementById('dash-mlive-md-rev-month');
    if(rmEl) rmEl.textContent = (curM+1)+'월';
  } else if(mdBlock){
    mdBlock.style.display = 'none';
  }
  renderMliveDashCal();
}

// M-live 대시보드 캘린더
function mlDashCalPrev(){ _mlDashCalDate.setMonth(_mlDashCalDate.getMonth()-1); renderMliveDashCal(); }
function mlDashCalNext(){ _mlDashCalDate.setMonth(_mlDashCalDate.getMonth()+1); renderMliveDashCal(); }

function _mliveTimeColor(camp){
  var nm = (camp.name||'').trim();
  if(nm.startsWith('다시보는')||nm.includes('(재방)')) return {color:'#b2bec3',label:'재방'};
  var dt = (camp.appMkt&&camp.appMkt.liveDt)||camp.start||'';
  var hh = 0;
  if(dt.length>=16){ hh = parseInt(dt.slice(11,13))||0; }
  if(hh>=9&&hh<12) return {color:'#e17055',label:'10시'};
  if(hh>=17&&hh<19) return {color:'#0984e3',label:'18시'};
  if(hh>=19&&hh<21) return {color:'#6c5ce7',label:'20시'};
  return {color:'#a29bfe',label:hh+'시'};
}

function renderMliveDashCal(){
  var y=_mlDashCalDate.getFullYear(), m=_mlDashCalDate.getMonth();
  var titleEl=document.getElementById('ml-dash-cal-title');
  if(titleEl) titleEl.textContent=y+'년 '+(m+1)+'월';
  var firstDay=new Date(y,m,1).getDay();
  var daysInMonth=new Date(y,m+1,0).getDate();
  var monthStart=y+'-'+String(m+1).padStart(2,'0')+'-01';
  var monthEnd=y+'-'+String(m+1).padStart(2,'0')+'-'+String(daysInMonth).padStart(2,'0');
  // 전체 사용자 M-live (MD도 모든 캠페인 표시)
  var camps=DB.campaigns.filter(function(c){
    if((c.campType||'')!=='모바일라이브') return false;
    var cs=(c.start||c.startDate||'').slice(0,10);
    if(!cs) return false;
    return cs>=monthStart&&cs<=monthEnd;
  });
  var byDay={};
  camps.forEach(function(c){
    var d=(c.start||c.startDate||'').slice(0,10);
    if(!byDay[d]) byDay[d]=[];
    byDay[d].push(c);
  });
  var today=new Date(); today.setHours(0,0,0,0);
  var grid=document.getElementById('ml-dash-cal-grid');
  if(!grid) return;
  var html='';
  for(var i=0;i<firstDay;i++) html+='<div style="min-height:90px;background:var(--bg);border-radius:4px"></div>';
  for(var d=1;d<=daysInMonth;d++){
    var dStr=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var dayDate=new Date(y,m,d); dayDate.setHours(0,0,0,0);
    var isToday=dayDate.getTime()===today.getTime();
    var dow=dayDate.getDay();
    var dayColor=dow===0?'var(--red)':(dow===6?'var(--blue)':'var(--text2)');
    var dayCamps=byDay[dStr]||[];
    // 시간순 정렬 (확정시작일 우선)
    dayCamps.sort(function(a,b){
      var at=a.confirmStart||(a.appMkt&&a.appMkt.liveDt)||a.start||'';
      var bt=b.confirmStart||(b.appMkt&&b.appMkt.liveDt)||b.start||'';
      return at>bt?1:-1;
    });
    var itemsHtml=dayCamps.map(function(c){
      // 본방/재방 구분
      var isReplay = (c.name||'').indexOf('다시보는')>=0 || (c.name||'').indexOf('(재방)')>=0;
      var color = isReplay ? '#ff9f43' : '#0984e3';
      // 시간 추출 (확정시작일 우선)
      var dt=c.confirmStart||(c.appMkt&&c.appMkt.liveDt)||c.start||'';
      var hh='';
      if(dt.length>=13){ var h=parseInt(dt.slice(11,13))||0; hh=h+'시'; }
      var nm=(c.name||'-');
      if(nm.length>7) nm=nm.slice(0,7)+'…';
      var label = (hh?'['+hh+'] ':'')+nm;
      var isMyMd = (c.owner||'').trim()===ME;
      var cursor = isMyMd||isAdmin()||ME_ROLE==='manager' ? 'cursor:pointer' : 'cursor:default;opacity:.85';
      var onclick = isMyMd||isAdmin()||ME_ROLE==='manager' ? 'onclick="editProd('+c.id+')"' : '';
      return '<div '+onclick+' title="'+escHtml(c.name||'')+' · '+(dt.slice(11,16)||'')+'" style="font-size:9.5px;padding:2px 4px;background:'+color+'22;border-left:3px solid '+color+';color:var(--text);border-radius:2px;margin-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;'+cursor+'">'
        +escHtml(label)+'</div>';
    }).join('');
    html+='<div style="min-height:90px;background:'+(isToday?'var(--accent-bg)':'var(--bg2)')+';border:1px solid '+(isToday?'var(--accent)':'var(--border)')+';border-radius:4px;padding:3px"><div style="font-size:11px;font-weight:700;color:'+dayColor+';margin-bottom:2px">'+d+'</div>'+itemsHtml+'</div>';
  }
  grid.innerHTML=html;
}

// CALENDAR
// ═══════════════════════════════════════
let calDate = (function(){ var d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
function prevMonth(){ calDate.setMonth(calDate.getMonth()-1); renderCalendar(); }
function nextMonth(){ calDate.setMonth(calDate.getMonth()+1); renderCalendar(); }


// 인플루언서 규모 → 색상
function infSizeColor(size){
  if(!size) return {color:'#888', bg:'rgba(136,136,136,0.15)', label:'미지정'};
  var s = String(size);
  if(s.includes('메가')) return {color:'#6c5ce7', bg:'rgba(108,92,231,0.25)', label:'메가'};
  if(s.includes('앵콜')) return {color:'#e17055', bg:'rgba(225,112,85,0.25)', label:'앵콜'};
  if(s.includes('미들')) return {color:'#00b894', bg:'rgba(0,184,148,0.25)',  label:'미들'};
  if(s.includes('시딩')) return {color:'#e17055', bg:'rgba(225,112,85,0.25)', label:'시딩'};
  // 구버전 호환
  if(s.includes('매크로'))  return {color:'#0984e3', bg:'rgba(9,132,227,0.25)',  label:'매크로'};
  if(s.includes('마이크로')||s.includes('나노')) return {color:'#e17055', bg:'rgba(225,112,85,0.25)', label:'시딩'};
  return {color:'#888', bg:'rgba(136,136,136,0.15)', label:s};
}
function renderCalendar(){
  var y=calDate.getFullYear(), m=calDate.getMonth();
  document.getElementById('cal-title').textContent=`${y}년 ${m+1}월`;

  // legend
  var leg=document.getElementById('cal-legend');
  if(leg){
    var legendItems=[
      {color:'#6c5ce7',label:'메가'},
      {color:'#e17055',label:'앵콜'},
      {color:'#00b894',label:'미들'},
      {color:'#e17055',label:'시딩'},
      {color:'#888',   label:'미지정'},
    ];
    leg.innerHTML=legendItems.map(function(x){
      return '<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text2)"><span style="width:10px;height:10px;border-radius:2px;background:'+x.color+';display:inline-block;opacity:.85"></span>'+x.label+'</span>';
    }).join('');
  }

  var firstDay=new Date(y,m,1).getDay();
  var daysInMonth=new Date(y,m+1,0).getDate();
  var today2=new Date();

  var monthStart = y+'-'+String(m+1).padStart(2,'0')+'-01';
  var monthEnd   = y+'-'+String(m+1).padStart(2,'0')+'-'+String(daysInMonth).padStart(2,'0');
  var monthCamps = DB.campaigns.filter(function(c){
    if((c.campType||'')==='모바일라이브') return false;
    var cs=(c.start||c.startDate||'').slice(0,10), ce=(c.end||c.endDate||'').slice(0,10);
    if(!cs||!ce) return false;
    if(isExtMcn() && !campHasMcn(c, ME_MCN_COMPANY)) return false;
    if(ME_ROLE==='md'){
      var pd=(c.pdSingle||(c.pds&&c.pds[0])||'').trim();
      var ow=(c.owner||'').trim();
      if(pd!==ME && ow!==ME) return false;
    }
    return cs<=monthEnd && ce>=monthStart;
  });
  monthCamps.sort(function(a,b){
    return (a.start||a.startDate||'').slice(0,10) > (b.start||b.startDate||'').slice(0,10) ? 1 : -1;
  });

  // ── 모바일: 리스트형 캘린더 ──
  if(window.innerWidth <= 768){
    var listHtml = '';
    if(!monthCamps.length){
      listHtml = '<div style="text-align:center;color:var(--text3);padding:24px;font-size:13px">이번 달 캠페인이 없습니다</div>';
    } else {
      listHtml = monthCamps.map(function(c){
        var cs = (c.start||c.startDate||'').slice(0,10);
        var ce = (c.end||c.endDate||'').slice(0,10);
        var ic = infSizeColor(c.role||c.infSize||'');
        var stageColor = '#888';
        var stages = [{id:'1.캠페인요청',color:'#a29bfe'},{id:'2.캠페인확정',color:'#74b9ff'},{id:'3.상품정보등록',color:'#55efc4'},{id:'4.MCN요청',color:'#ffeaa7'},{id:'5.인플루언서확정',color:'#fd79a8'},{id:'6.APP마케팅확정',color:'#fdcb6e'},{id:'7.정산',color:'#e17055'}];
        stages.forEach(function(s){ if(c.stage===s.id) stageColor=s.color; });
        var startMd = cs.slice(5).replace('-','/');
        var endMd   = ce.slice(5).replace('-','/');
        var today3 = new Date(); today3.setHours(0,0,0,0);
        var endDate = ce ? new Date(ce) : null;
        var isDone  = endDate && endDate < today3;
        return '<div onclick="editProd('+c.id+')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;margin-bottom:6px;background:var(--bg3);cursor:pointer;border-left:4px solid '+ic.color+';opacity:'+(isDone?'.5':'1')+'">'
          +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escHtml(c.name||'-')+'</div>'
          +'<div style="font-size:11.5px;color:var(--text3);margin-top:2px">'+startMd+' ~ '+endMd+'</div>'
          +'</div>'
          +'<span style="background:'+stageColor+';color:#333;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap;flex-shrink:0">'+escHtml((c.stage||'').replace(/^\d+\./,''))+'</span>'
          +'</div>';
      }).join('');
    }
    document.getElementById('cal-grid').innerHTML = '<div style="max-height:400px;overflow-y:auto">'+listHtml+'</div>';

    // summary (모바일 동일)
    var today3b = new Date(); today3b.setHours(0,0,0,0);
    var activeCnt = monthCamps.filter(function(c){ var cs=new Date((c.start||c.startDate||'9999').slice(0,10)), ce=new Date((c.end||c.endDate||'0000').slice(0,10)); return cs<=today3b && ce>=today3b; }).length;
    var sumEl = document.getElementById('cal-summary');
    if(sumEl) sumEl.innerHTML = '<span style="color:var(--accent2);font-weight:700">'+monthCamps.length+'개</span> 캠페인 중 <span style="color:var(--green);font-weight:700">'+activeCnt+'개</span> 진행중';
    return;
  }

  // ── PC: 기존 그리드 캘린더 ──
  var campSlot = {};
  var slotUsed = [];
  var maxSlotUsed = 0;
  monthCamps.forEach(function(c){
    var cs = (c.start||c.startDate||'').slice(0,10);
    var ce = (c.end||c.endDate||'').slice(0,10);
    for(var row=0; ; row++){
      var ok = true;
      var cur = new Date(cs);
      var end = new Date(ce);
      while(cur<=end){
        var ds = cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
        if(slotUsed[ds] && slotUsed[ds].has(row)){ ok=false; break; }
        cur.setDate(cur.getDate()+1);
      }
      if(ok){
        campSlot[c.id] = row;
        if(row > maxSlotUsed) maxSlotUsed = row;
        var cur2 = new Date(cs);
        var end2 = new Date(ce);
        while(cur2<=end2){
          var ds2 = cur2.getFullYear()+'-'+String(cur2.getMonth()+1).padStart(2,'0')+'-'+String(cur2.getDate()).padStart(2,'0');
          if(!slotUsed[ds2]) slotUsed[ds2] = new Set();
          slotUsed[ds2].add(row);
          cur2.setDate(cur2.getDate()+1);
        }
        break;
      }
    }
  });

  var html='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px">'
    +['일','월','화','수','목','금','토'].map(function(day){ return '<div style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);padding:4px 0">'+day+'</div>'; }).join('')
    +'</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">';

  for(var i=0;i<firstDay;i++) html+='<div style="min-height:80px;background:var(--bg3);border-radius:4px;opacity:.3"></div>';

  for(var d=1;d<=daysInMonth;d++){
    var dateStr=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var dow = new Date(y,m,d).getDay();
    var isToday = today2.getFullYear()===y && today2.getMonth()===m && today2.getDate()===d;

    var slotBars = {};
    monthCamps.forEach(function(c){
      var cs=(c.start||c.startDate||'').slice(0,10), ce=(c.end||c.endDate||'').slice(0,10);
      if(cs>dateStr||ce<dateStr) return;
      var row = campSlot[c.id];
      if(row===undefined) return;
      var prod = DB.products.find(function(p){return p.id===c.product;});
      var infSize = c.role || (prod ? prod.infSize : (c.infSize||''));
      var ic = infSizeColor(infSize);
      var isStart = cs===dateStr;
      var isEnd   = ce===dateStr;
      var br = (isStart?'4px':'0')+(isEnd?' 4px 4px':' 0 0')+(isStart?' 4px':' 0');
      var showName = isStart || d===1 || dow===0;
      var label = showName ? c.name : '';
      var marginL = isStart ? '0' : '-2px';
      var marginR = isEnd   ? '0' : '-2px';
      var paddingL = isStart ? '4px' : '1px';
      slotBars[row] = '<div title="'+c.name+' ('+cs+' ~ '+ce+')" '
        +'onclick="event.stopPropagation();editProd('+c.id+')" '
        +'style="background:'+ic.color+';opacity:.88;border-radius:'+br+';'
        +'height:16px;line-height:16px;font-size:9px;color:#fff;'
        +'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'
        +'cursor:pointer;padding:0 '+paddingL+';'
        +'margin-left:'+marginL+';margin-right:'+marginR+'">'
        +label+'</div>';
    });

    var barsHtml = '';
    for(var row2=0;row2<=maxSlotUsed;row2++){
      if(slotBars[row2]) barsHtml += slotBars[row2];
      else barsHtml += '<div style="height:16px;margin-bottom:0"></div>';
    }

    html+='<div style="min-height:80px;background:'+(isToday?'rgba(108,92,231,0.12)':'var(--bg3)')+';border-radius:4px;padding:3px 2px 3px;border:1px solid '+(isToday?'var(--accent)':'transparent')+'">'
      +'<div style="font-size:10.5px;font-weight:'+(isToday?'800':'500')+';color:'+(isToday?'var(--accent2)':'var(--text2)')+';margin-bottom:2px;padding:0 2px">'+(isToday?'<span style="background:var(--accent);color:#fff;border-radius:50%;width:17px;height:17px;display:inline-flex;align-items:center;justify-content:center;font-size:10px">'+d+'</span>':d)+'</div>'
      +barsHtml
      +'</div>';
  }
  html+='</div>';
  document.getElementById('cal-grid').innerHTML=html;

  // 진행완료 캠페인 summary
  var today3 = new Date(); today3.setHours(0,0,0,0);
  var calCamps = isExtMcn()
    ? DB.campaigns.filter(function(c){ return campHasMcn(c, ME_MCN_COMPANY); })
    : DB.campaigns;
  var doneCamps = monthCamps.filter(function(c){
    var endD = c.end||c.endDate ? new Date((c.end||c.endDate).slice(0,10)) : null;
    return endD && endD < today3;
  });
  var doneAll = doneCamps;
  var doneRev = doneCamps.reduce(function(s,c){return s+(c.settleRevenue||0);},0);
  var doneRevStr = doneRev > 0 ? (doneRev/100000000).toFixed(1)+'억원' : '0.0억원';
  var sumEl = document.getElementById('cal-summary');
  if(sumEl){
    sumEl.innerHTML = '<span style="font-size:12px;font-weight:700;color:var(--text2)">진행완료 캠페인</span>'
      + '<span style="font-size:12px;color:var(--text3);margin-left:4px">('+doneAll.length+')</span>'
      + '<span style="font-size:13px;font-weight:800;color:var(--green);margin-left:12px">'+doneRevStr+'</span>'
      + '<span style="font-size:11px;color:var(--text3);margin-left:6px">※ 매출 입력된 캠페인 기준</span>';
  }
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════
var dashBaseMonth = (function(){ var d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();

function shiftDashMonth(delta){
  dashBaseMonth = new Date(dashBaseMonth.getFullYear(), dashBaseMonth.getMonth()+delta, 1);
  renderDash();
}
function jumpDashMonth(val){
  if(!val) return;
  var parts = val.split('-');
  dashBaseMonth = new Date(parseInt(parts[0]), parseInt(parts[1])-1, 1);
  renderDash();
}

function renderDash(){
  // main이 숨겨져 있으면 렌더 스킵 (로그인 전 호출 방지)
  var mainEl = document.querySelector('.main');
  if(mainEl && mainEl.style.display === 'none') return;
  // external_mcn: 캠페인 현황 테이블 숨기고 MCN 헤더만 표시
  var tableSection = document.getElementById('dash-table-section');
  var mcnHeader    = document.getElementById('dash-mcn-header');
  if(isExtMcn()){
    if(tableSection) tableSection.style.display = 'none';
    if(mcnHeader){
      mcnHeader.style.display = '';

      // 업체명
      var nameEl = document.getElementById('dash-mcn-name');
      if(nameEl) nameEl.textContent = ME_MCN_COMPANY || ME;

      // 본인 업체 캠페인
      var myCamps = DB.campaigns.filter(function(c){ return campHasMcn(c, ME_MCN_COMPANY); });

      // 좌측: 인플루언서 정보 확정 요청건 (4단계)
      var infReqCnt = myCamps.filter(function(c){
        return c.stage === '5.인플루언서확정';
      }).length;
      var infCountEl = document.getElementById('dash-mcn-inf-count');
      if(infCountEl) infCountEl.textContent = infReqCnt;

      // 우측: 현재 월 캠페인 예상 매출 합계
      var now = new Date();
      var curY = now.getFullYear(), curM = now.getMonth();
      var msStart = curY+'-'+String(curM+1).padStart(2,'0')+'-01';
      var msEnd   = curY+'-'+String(curM+1).padStart(2,'0')+'-'+String(new Date(curY,curM+1,0).getDate()).padStart(2,'0');
      var monthRevCamps = myCamps.filter(function(c){
        var cs=(c.start||c.startDate||'').slice(0,10), ce=(c.end||c.endDate||'').slice(0,10);
        return cs && ce && cs<=msEnd && ce>=msStart;
      });
      var totalRev = monthRevCamps.reduce(function(sum,c){ return sum+(c.revenue||0); }, 0);
      var revEl = document.getElementById('dash-mcn-revenue');
      if(revEl) revEl.textContent = (totalRev/100000000).toFixed(1);
      var revMonthEl = document.getElementById('dash-mcn-rev-month');
      if(revMonthEl) revMonthEl.textContent = (curM+1)+'월';
    }
    renderCalendar();
    return; // MCN은 나머지 대시보드 렌더 생략
  } else {
    if(tableSection) tableSection.style.display = '';
    if(mcnHeader)    mcnHeader.style.display = 'none';
    // MD 역할: 캠페인 현황 테이블 숨기고 KPI 블록 표시
    var mdBlock = document.getElementById('dash-md-block');
    if(ME_ROLE === 'md' && mdBlock){
      // 캠페인 현황 테이블 숨기기
      if(tableSection) tableSection.style.display = 'none';
      mdBlock.style.display = '';

      // 인사말
      var greetEl = document.getElementById('dash-md-greeting');
      if(greetEl) greetEl.textContent = ME + '님, 안녕하세요!';

      // 본인 담당 캠페인 (owner 또는 pdSingle)
      var myAllCamps = DB.campaigns.filter(function(c){
        var pd = (c.pdSingle||(c.pds&&c.pds[0])||'').trim();
        var ow = (c.owner||'').trim();
        return pd===ME || ow===ME;
      });

      // 좌측: 상품/가격 정보 미입력 캠페인 수
      // 조건: 2단계(캠페인확정) 이상이고 상품코드(skus) 또는 가격 미입력
      // 상품정보 입력 대상 = 2단계(캠페인확정) + 3단계(상품정보등록) 본인 담당
      // → 뱃지(b-s3) 및 3단계 확정대상 기준과 동일
      var noInfoCamps = myAllCamps.filter(function(c){
        return c.stage === '2.캠페인확정' || c.stage === '3.상품정보등록';
      });
      var mdCountEl = document.getElementById('dash-md-req-count');
      if(mdCountEl) mdCountEl.textContent = noInfoCamps.length;

      // 우측: 현재 월 캠페인 예상 매출 합계
      var now = new Date();
      var curY = now.getFullYear();
      var curM = now.getMonth(); // 0-based
      var monthRevCamps = myAllCamps.filter(function(c){
        var cs = (c.start||c.startDate||'').slice(0,10);
        var ce = (c.end  ||c.endDate  ||'').slice(0,10);
        if(!cs||!ce) return false;
        // 캠페인 기간이 현재 월에 걸쳐 있으면 포함
        var msStart = curY+'-'+String(curM+1).padStart(2,'0')+'-01';
        var msEnd   = curY+'-'+String(curM+1).padStart(2,'0')+'-'+String(new Date(curY,curM+1,0).getDate()).padStart(2,'0');
        return cs<=msEnd && ce>=msStart;
      });
      var monthRev = monthRevCamps.reduce(function(sum,c){ return sum+(c.revenue||0); }, 0);
      var revStr = (monthRev/100000000).toFixed(1);

      // 월 레이블
      var revMonthEl = document.getElementById('dash-md-rev-month');
      if(revMonthEl) revMonthEl.textContent = (curM+1)+'월';
      var revEl = document.getElementById('dash-md-revenue');
      if(revEl) revEl.textContent = revStr;

      // 캘린더 렌더 후 return
      renderCalendar();
      return;
    } else if(mdBlock){
      mdBlock.style.display = 'none';
    }
  }
  // 사이드바 뱃지 카운트 (각 단계 "처리 대상" 기준)
  function setEl(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  // 뱃지는 updateBadges()에서 통합 관리

  // dashBaseMonth 방어: 유효하지 않으면 현재 월로 리셋
  if(!dashBaseMonth || isNaN(dashBaseMonth.getTime())){
    dashBaseMonth = new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1);
  }
  var months = [0,1,2].map(function(offset){
    var d = new Date(dashBaseMonth.getFullYear(), dashBaseMonth.getMonth()+offset, 1);
    return { year:d.getFullYear(), month:d.getMonth(), label:(d.getMonth()+1)+'월' };
  });

  var mi = document.getElementById('ds-month-input');
  if(mi) mi.value = dashBaseMonth.getFullYear()+'-'+String(dashBaseMonth.getMonth()+1).padStart(2,'0');

  var now = new Date();
  ['ds-th-m0','ds-th-m1','ds-th-m2'].forEach(function(id,i){
    var el=document.getElementById(id); if(!el) return;
    var isNow = months[i].year===now.getFullYear()&&months[i].month===now.getMonth();
    el.innerHTML = '<div style="font-weight:800;text-align:center;padding:6px 0">'
      +months[i].year+'년 '+months[i].label
      +(isNow?' <span style="font-size:10px;color:var(--accent2)">이번달</span>':'')
      +'</div>';
  });
  var rangeEl=document.getElementById('ds-month-range');
  if(rangeEl) rangeEl.textContent=months[0].year+'년 '+months[0].label+' ~ '+months[2].label;

  function campInMonth(c, yr, mo){
    // 시작일 기준으로만 해당 월 귀속 (월 걸침 시 중복 카운팅 방지)
    var cStart = c.start || c.startDate || null;
    if(!cStart){
      var now3=new Date(); return now3.getFullYear()===yr&&now3.getMonth()===mo;
    }
    var s=new Date(cStart);
    if(isNaN(s.getTime())){
      var now4=new Date(); return now4.getFullYear()===yr&&now4.getMonth()===mo;
    }
    return s.getFullYear()===yr&&s.getMonth()===mo;
  }

  function revenueInMonth(c, yr, mo){
    if(!campInMonth(c,yr,mo)) return 0;
    return (DB.settlements||[]).filter(function(s){return s.campaign===c.id;})
      .reduce(function(sum,s){return sum+(s.revenue||0);},0);
  }

  var ROLES = [
    {key:'메가',  color:'var(--pink)',   bg:'var(--pink-bg)'},
    {key:'앵콜',  color:'var(--orange)', bg:'var(--orange-bg)'},
    {key:'미들',  color:'var(--blue)',   bg:'var(--blue-bg)'},
    {key:'시딩',  color:'var(--green)',  bg:'var(--green-bg)'},
  ];

  var totalCounts   = months.map(function(m){return DB.campaigns.filter(function(c){return campInMonth(c,m.year,m.month);}).length;});
  var totalRevenues = months.map(function(m){return DB.campaigns.reduce(function(sum,c){return sum+(c.revenue||0)*(campInMonth(c,m.year,m.month)?1:0);},0);});

  // 온라인/방송 분류 함수
  // campType 미지정은 온라인으로 집계 (SSG LIVE 기본값)
  // MDCAT 기반 온라인/방송 분류: mdcat='온라인'이면 온라인, 그 외 모두 방송
  function getMdcat(camp){
    return (camp.mdcat || (camp.skus && camp.skus[0] && camp.skus[0].mdcat) || '').trim();
  }
  function isOnline(camp){ var m=getMdcat(camp); return m==='온라인'; }
  function isBroadcast(camp){ var m=getMdcat(camp); return m!=='온라인'; }
  function isUntyped(camp){ return !getMdcat(camp); }

  var fmtRevT = function(v){ return v>0?(v/100000000).toFixed(1)+'억':''; };

  // ── 월 합계: thead ds-sum-m0/m1/m2 에 직접 렌더 ──
  var sumRow = ''; // tbody 불필요
  months.forEach(function(mo, idx){
    var allMo = DB.campaigns.filter(function(c){return campInMonth(c,mo.year,mo.month);});
    var totCnt = allMo.length;
    var totRev = allMo.reduce(function(s,c){return s+(c.revenue||0);},0);
    var el = document.getElementById('ds-sum-m'+idx);
    if(el){
      el.innerHTML = '<div style="font-size:16px;font-weight:900;color:var(--text)">'+(totCnt||0)+'</div>'
        +'<div style="font-size:12px;font-weight:700;color:var(--accent2);margin-top:1px">'+(totRev>0?(totRev/100000000).toFixed(1)+'억':'0억')+'</div>';
    }
  });


  var roleRows = '<tr style="background:var(--accent-bg)">'
    + '<td><span style="color:var(--accent2);font-weight:800;font-size:13px;white-space:nowrap">계 (예상매출)</span></td>'
    + months.map(function(mo){
        var onl = DB.campaigns.filter(function(c){return campInMonth(c,mo.year,mo.month)&&isOnline(c);});
        var brd = DB.campaigns.filter(function(c){return campInMonth(c,mo.year,mo.month)&&isBroadcast(c);});
        var onRev = fmtRevT(onl.reduce(function(s,c){return s+(c.revenue||0);},0));
        var brRev = fmtRevT(brd.reduce(function(s,c){return s+(c.revenue||0);},0));
        return '<td style="text-align:center;padding:7px 6px;background:var(--blue-bg)">'
          +'<div style="font-size:13px;font-weight:800;color:var(--blue)">'+(onl.length>0?onl.length+(onRev?'('+onRev+')':''):'0')+'</div>'
          +'</td>'
          +'<td style="text-align:center;padding:7px 6px;background:var(--orange-bg)">'
          +'<div style="font-size:13px;font-weight:800;color:var(--orange)">'+(brd.length>0?brd.length+(brRev?'('+brRev+')':''):'0')+'</div>'
          +'</td>';
      }).join('')
    + '</tr>';

  var fmtRev2 = function(v){ return v>0?(v/100000000).toFixed(1):''; };
  ROLES.forEach(function(r){
    var campsByMonth = months.map(function(m){
      return DB.campaigns.filter(function(c){
        var rm = r.key==='(미정)'?(!c.role||c.role===''):c.role===r.key;
        var confirmed = c.stage && ['5.인플루언서확정','6.APP마케팅확정','7.정산','7.정산완료'].indexOf(c.stage) >= 0;
        return rm&&confirmed&&campInMonth(c,m.year,m.month);
      });
    });
    var roleId = 'role-expand-'+r.key;
    var totalCampsAll = 0;
    campsByMonth.forEach(function(arr){ totalCampsAll += arr.length; });

    // ── 요약 행 (클릭으로 토글) ──
    roleRows += '<tr style="cursor:pointer" onclick="toggleRoleExpand(\''+roleId+'\')">'
      +'<td style="padding:8px 10px;white-space:nowrap">'
      +'<span style="background:'+r.bg+';color:'+r.color+';padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700">'+r.key+'</span>'
      +' <span id="'+roleId+'-arrow" style="font-size:10px;color:var(--text3)">▶</span>'
      +'</td>'
      +campsByMonth.map(function(arr){
        var onl = arr.filter(function(c){return isOnline(c);});
        var brd = arr.filter(function(c){return isBroadcast(c);});
        var onlRev = fmtRev2(onl.reduce(function(s,c){return s+(c.revenue||0);},0));
        var brdRev = fmtRev2(brd.reduce(function(s,c){return s+(c.revenue||0);},0));
        var onlC = onl.length>0?'var(--blue)':'var(--text3)';
        var brdC = brd.length>0?'var(--orange)':'var(--text3)';
        var onlHtml = onl.length>0 ? '<span style="font-size:14px;font-weight:800;color:'+onlC+'">'+onl.length+'</span>'+(onlRev?'<span style="font-size:13px;font-weight:600;color:'+onlC+'">('+onlRev+'억)</span>':'') : '<span style="font-size:13px;color:var(--text3)">0</span>';
        var brdHtml = brd.length>0 ? '<span style="font-size:14px;font-weight:800;color:'+brdC+'">'+brd.length+'</span>'+(brdRev?'<span style="font-size:13px;font-weight:600;color:'+brdC+'">('+brdRev+'억)</span>':'') : '<span style="font-size:13px;color:var(--text3)">0</span>';
        return '<td style="text-align:center;padding:7px 4px">'+onlHtml+'</td>'
          +'<td style="text-align:center;padding:7px 4px">'+brdHtml+'</td>';
      }).join('')
      +'</tr>';
    var allCamps = [];
    var seen = {};
    campsByMonth.forEach(function(arr){ arr.forEach(function(camp){
      if(!seen[camp.id]){ seen[camp.id]=true; allCamps.push(camp); }
    }); });
    allCamps.sort(function(a,b){ return (a.start||'')>(b.start||'')?1:-1; });

    if(allCamps.length===0){
      roleRows += '<tr id="'+roleId+'-r0" style="display:none;background:var(--bg3)">'
        +'<td colspan="'+(months.length*2)+'" style="padding:8px 10px;color:var(--text3);text-align:center;font-size:12px">캠페인 없음</td></tr>';
    } else {
      // 한 행으로 통합: 각 월별 온/방 셀에 해당 캠페인 목록을 최상단부터 순서대로 표시
      roleRows += '<tr class="'+roleId+'-detail" style="display:none;background:var(--bg3);border-top:1px solid var(--border)">';
      roleRows += '<td style="padding:5px 10px;vertical-align:top"></td>'; // 역할명 컬럼 자리
      months.forEach(function(mo, moIdx){
        var onlCamps = campsByMonth[moIdx].filter(function(c){ return isOnline(c); });
        var brdCamps = campsByMonth[moIdx].filter(function(c){ return !isOnline(c); });

        // 온라인 셀
        roleRows += '<td style="text-align:center;padding:5px 6px;vertical-align:top">';
        if(onlCamps.length){
          onlCamps.forEach(function(camp){
            var rev=(camp.revenue||0); var revStr=rev>0?'('+(rev/100000000).toFixed(1)+'억)':'';
            roleRows += '<div style="margin-bottom:5px;padding:4px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="editProd('+camp.id+')">';
            roleRows += '<div style="font-size:11.5px;font-weight:700;color:var(--blue)">'+escHtml(camp.name||'-')+' <span style="font-size:12px">'+revStr+'</span></div>';
            roleRows += '</div>';
          });
        } else {
          roleRows += '<span style="color:var(--border2);font-size:11px">-</span>';
        }
        roleRows += '</td>';

        // 방송 셀
        roleRows += '<td style="text-align:center;padding:5px 6px;vertical-align:top">';
        if(brdCamps.length){
          brdCamps.forEach(function(camp){
            var rev=(camp.revenue||0); var revStr=rev>0?'('+(rev/100000000).toFixed(1)+'억)':'';
            roleRows += '<div style="margin-bottom:5px;padding:4px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="editProd('+camp.id+')">';
            roleRows += '<div style="font-size:11.5px;font-weight:700;color:var(--orange)">'+escHtml(camp.name||'-')+' <span style="font-size:12px">'+revStr+'</span></div>';
            roleRows += '</div>';
          });
        } else {
          roleRows += '<span style="color:var(--border2);font-size:11px">-</span>';
        }
        roleRows += '</td>';
      });
      roleRows += '</tr>';
    }
  });

  // ── 미확정 구분 (인플루언서 확정 전 단계) ──
  var unconfirmed = {key:'미확정', color:'var(--text3)', bg:'var(--bg4)'};
  var ucByMonth = months.map(function(m){
    return DB.campaigns.filter(function(c){
      var isConfirmed = c.stage && ['5.인플루언서확정','6.APP마케팅확정','7.정산','7.정산완료'].indexOf(c.stage) >= 0;
      return !isConfirmed && campInMonth(c,m.year,m.month);
    });
  });
  var ucId = 'role-expand-unconfirmed';
  roleRows += '<tr style="border-top:2px solid var(--border);cursor:pointer" onclick="toggleRoleExpand(\''+ucId+'\')">'
    +'<td style="padding:8px 10px;white-space:nowrap">'
    +'<span style="background:'+unconfirmed.bg+';color:'+unconfirmed.color+';padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700">'+unconfirmed.key+'</span>'
    +' <span id="'+ucId+'-arrow" style="font-size:10px;color:var(--text3)">▶</span>'
    +'</td>'
    +ucByMonth.map(function(arr){
      var onl = arr.filter(function(c){return isOnline(c);});
      var brd = arr.filter(function(c){return isBroadcast(c);});
      var onlRev = fmtRev2(onl.reduce(function(s,c){return s+(c.revenue||0);},0));
      var brdRev = fmtRev2(brd.reduce(function(s,c){return s+(c.revenue||0);},0));
      var onlC = onl.length>0?'var(--blue)':'var(--text3)';
      var brdC = brd.length>0?'var(--orange)':'var(--text3)';
      var onlHtml = onl.length>0 ? '<span style="font-size:14px;font-weight:800;color:'+onlC+'">'+onl.length+'</span>'+(onlRev?'<span style="font-size:13px;font-weight:600;color:'+onlC+'">('+onlRev+'억)</span>':'') : '<span style="font-size:13px;color:var(--text3)">0</span>';
      var brdHtml = brd.length>0 ? '<span style="font-size:14px;font-weight:800;color:'+brdC+'">'+brd.length+'</span>'+(brdRev?'<span style="font-size:13px;font-weight:600;color:'+brdC+'">('+brdRev+'억)</span>':'') : '<span style="font-size:13px;color:var(--text3)">0</span>';
      return '<td style="text-align:center;padding:7px 4px">'+onlHtml+'</td>'
        +'<td style="text-align:center;padding:7px 4px">'+brdHtml+'</td>';
    }).join('')
    +'</tr>';
  // 미확정 상세 펼침
  var ucAllCamps = []; var ucSeen = {};
  ucByMonth.forEach(function(arr){ arr.forEach(function(camp){
    if(!ucSeen[camp.id]){ ucSeen[camp.id]=true; ucAllCamps.push(camp); }
  }); });
  if(ucAllCamps.length===0){
    roleRows += '<tr id="'+ucId+'-r0" style="display:none;background:var(--bg3)">'
      +'<td colspan="'+(months.length*2)+'" style="padding:8px 10px;color:var(--text3);text-align:center;font-size:12px">캠페인 없음</td></tr>';
  } else {
    roleRows += '<tr class="'+ucId+'-detail" style="display:none;background:var(--bg3);border-top:1px solid var(--border)">';
    roleRows += '<td style="padding:5px 10px;vertical-align:top"></td>';
    months.forEach(function(mo, moIdx){
      var onlCamps = ucByMonth[moIdx].filter(function(c){ return isOnline(c); });
      var brdCamps = ucByMonth[moIdx].filter(function(c){ return !isOnline(c); });
      roleRows += '<td style="text-align:center;padding:5px 6px;vertical-align:top">';
      if(onlCamps.length){
        onlCamps.forEach(function(camp){
          var rev=(camp.revenue||0); var revStr=rev>0?'('+(rev/100000000).toFixed(1)+'억)':'';
          roleRows += '<div style="margin-bottom:5px;padding:4px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="editProd('+camp.id+')">';
          roleRows += '<div style="font-size:11.5px;font-weight:700;color:var(--blue)">'+escHtml(camp.name||'-')+' <span style="font-size:12px">'+revStr+'</span></div>';
          roleRows += '</div>';
        });
      } else { roleRows += '<span style="color:var(--border2);font-size:11px">-</span>'; }
      roleRows += '</td>';
      roleRows += '<td style="text-align:center;padding:5px 6px;vertical-align:top">';
      if(brdCamps.length){
        brdCamps.forEach(function(camp){
          var rev=(camp.revenue||0); var revStr=rev>0?'('+(rev/100000000).toFixed(1)+'억)':'';
          roleRows += '<div style="margin-bottom:5px;padding:4px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="editProd('+camp.id+')">';
          roleRows += '<div style="font-size:11.5px;font-weight:700;color:var(--orange)">'+escHtml(camp.name||'-')+' <span style="font-size:12px">'+revStr+'</span></div>';
          roleRows += '</div>';
        });
      } else { roleRows += '<span style="color:var(--border2);font-size:11px">-</span>'; }
      roleRows += '</td>';
    });
    roleRows += '</tr>';
  }

  document.getElementById('ds-role-tbl').innerHTML=sumRow+roleRows;

  renderCalendar();
  updateBadges();
}

// ═══════════════════════════════════════
// S1: 캠페인 요청
// ═══════════════════════════════════════
var _s1SortOrder = 'desc'; // desc=최신순, asc=오래된순
function toggleS1Sort(){
  _s1SortOrder = _s1SortOrder==='desc'?'asc':'desc';
  var btn = document.getElementById('s1-sort-btn');
  if(btn) btn.textContent = '등록일 '+(_s1SortOrder==='desc'?'▼':'▲');
  renderS1();
}
function renderS1(filter=''){
  // M-live 동적 헤더
  var s1th=document.getElementById('s1-thead');
  if(s1th && _dashMode==='mlive') s1th.innerHTML=_mliveHeaders.s1;
  var rows='';
  var ownerFilter = (document.getElementById('sf-s1-owner')?.value||'').trim();
  var mdFilter_s1  = (document.getElementById('sf-s1-md')?.value||'').trim();
  var s1Camps = DB.campaigns.filter(function(c){
    if(!matchesDashMode(c)) return false;
    var matchFilter = !filter||c.name.includes(filter)||(c.company||'').includes(filter);
    if(ownerFilter && !(c.pdSingle||c.pds&&c.pds[0]||'').includes(ownerFilter)) return false;
    if(mdFilter_s1  && !(c.owner||'').includes(mdFilter_s1))  return false;
    if(!matchFilter) return false;
    if(pageFilter.s1 !== 'target' && !matchesDateFilter(c,'s1')) return false;
    var _nf=(document.getElementById('sf-s1-name')?.value||'').trim().toLowerCase();
    if(_nf && !(c.name||'').toLowerCase().includes(_nf)) return false;
    if(dateFilter.s1.stage && c.stage!==dateFilter.s1.stage) return false;
    if(isMyOnlyFilter('s1') && !isMycamp(c)) return false;
    if(pageFilter.s1==='target') return c.stage==='1.캠페인요청';
    return c.stage==='1.캠페인요청'; // 전체: 1단계
  });
  // 등록일 기준 정렬
  s1Camps.sort(function(a,b){
    var da = a.createdAt||a.start||'', db = b.createdAt||b.start||'';
    return _s1SortOrder==='desc' ? (db>da?1:db<da?-1:0) : (da>db?1:da<db?-1:0);
  });
  // 페이징 처리
  var _pg_s1 = _getPagedItems(s1Camps, 's1');
  _pg_s1.items.forEach(function(c, _pi){
    var rowNum = _pg_s1.startIdx + _pi + 1;
    if(_dashMode==='mlive'){ rows+=mliveStageRow('s1',c,rowNum); return; }
    var skuCount = (c.skus||[]).length;
    var pdNames = (c.pds||[]).join(', ') || '-';
    var roleColor = c.role==='메가'?'var(--pink)':c.role==='앵콜'?'var(--orange)':c.role==='미들'?'var(--blue)':c.role==='시딩'?'var(--green)':'var(--text3)';
    var roleBg   = c.role==='메가'?'var(--pink-bg)':c.role==='앵콜'?'var(--orange-bg)':c.role==='미들'?'var(--blue-bg)':c.role==='시딩'?'var(--green-bg)':'var(--bg4)';
    var revStr = '-';
    if(c.revenue){
      var uck = c.revenue / 100000000;
      if(uck >= 0.1){ revStr = uck.toFixed(1) + '억'; } else { revStr = (c.revenue / 10000).toFixed(0) + '만'; }
    }
    var mdcatVal = c.mdcat || (c.skus && c.skus[0] ? c.skus[0].mdcat : '') || '-';
    rows+=`<tr onclick="openCampReqDetail(${c.id})" style="cursor:pointer">
      <td style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);width:36px">${rowNum}</td>
      <td onclick="event.stopPropagation()"><input type="checkbox" class="row-chk" data-id="${c.id}" data-stage="s1" style="cursor:pointer"></td>
      <td class="mob-hide" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap">${displayCampCode(c)}</td>
      <td><strong>${c.name}</strong></td>
      <td style="color:var(--text3);font-size:12px;font-family:monospace">${mdcatVal}</td>
      <td>${c.role?`<span style="background:${roleBg};color:${roleColor};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">${c.role}</span>`:'-'}</td>
      <td style="color:var(--text2);font-size:12.5px">${c.infSize||'-'}</td>
      <td style="font-weight:700;color:var(--green)">${revStr}</td>
      <td style="color:var(--text3);font-size:12px">${_dashMode==='mlive'?fmtBroadcastDt(c):(c.start||c.startDate||'-').slice(5)}</td>
      <td style="color:var(--text3);font-size:12px">${_dashMode==='mlive'?'':((c.end||c.endDate||'-').slice(5))}</td>
      <td class="mob-hide" style="color:var(--text3);font-size:11px">${c.createdAt?c.createdAt.slice(0,10):'-'}</td>
      <td><div class="row-acts" style="opacity:1">
        ${canEdit() ? `<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd(${c.id})">✏️</button>` : ''}
        ${isAdmin() ? `<button class="btn btn-danger btn-xs" onclick="event.stopPropagation();delProd(${c.id})">삭제</button>` : ''}
        ${(!canEdit() && !isAdmin()) ? `<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd(${c.id})">👁 상세</button>` : ''}
      </div></td>
    </tr>`;
  });
  
  _renderPagination('prod-pagination', s1Camps.length, 's1', 'renderS1()');
  document.getElementById('prod-tbl').innerHTML=rows||'<tr><td colspan="12" class="empty" style="padding:32px;text-align:center;color:var(--text3)">등록된 캠페인 요청이 없습니다</td></tr>';
}
function filterProds(v2){ renderS1(v2); }
function delProd(id){
  if(!isAdmin()){ showToast('관리자만 삭제할 수 있습니다.'); return; }
  showConfirm('캠페인 요청을 삭제하시겠습니까?', function(){
    var numId = parseInt(id);
    DB.campaigns = DB.campaigns.filter(function(c){ return parseInt(c.id) !== numId; });
    broadcastData(); renderS1(); renderDash(); showToast('삭제됨');
  });
}

// 캠페인 수정 모달 열기
function editProd(id){
  var p = DB.campaigns.find(function(x){return x.id===id;}); if(!p) return;
  updateInfDbList();
  document.getElementById('p-edit-id').value = id;
  document.getElementById('prod-mo-title').textContent = '캠페인 수정';
  document.getElementById('prod-save-btn').textContent = '수정 저장';
  var delBtn=document.getElementById('prod-del-btn'); if(delBtn) delBtn.style.display=isAdmin()?'':'none';
  var expBtn=document.getElementById('prod-export-btn'); if(expBtn) expBtn.style.display='';
  initSections(false); // 모든 섹션 닫힌 상태로 초기화
  openMo('product');
  // 상태 배지 표시
  updateProdStageBadge(p.stage||'1.캠페인요청');
  // 캠페인코드 배지
  var campCodeEl = document.getElementById('p-campcode');
  if(campCodeEl){
    campCodeEl.textContent = p.campCode||'';
    campCodeEl.style.display = p.campCode ? '' : 'none';
  }
  // 편성코드 배지 (M-live)
  var liveCodeBadge = document.getElementById('p-livecode-badge');
  if(liveCodeBadge){
    var lc = (p.appMkt&&p.appMkt.liveCode)||'';
    liveCodeBadge.textContent = lc ? '편성 '+lc : '';
    liveCodeBadge.style.display = lc ? '' : 'none';
  }
  // 카카오 공유 버튼 표시
  showKakaoShareBtn(id);

    document.getElementById('p-name').value    = p.name||'';
    document.getElementById('p-company').value = p.company||'';
    document.getElementById('p-brand').value   = p.brand||'';
    document.getElementById('p-cat').value     = p.cat||'';
    var dcEl=document.getElementById('p-deal-code'); if(dcEl) dcEl.value=p.dealCode||'';
    var ssEl=document.getElementById('p-sale-start'); if(ssEl) ssEl.value=p.saleStart||'';
    var seEl=document.getElementById('p-sale-end'); if(seEl) seEl.value=p.saleEnd||'';
    var evEl=document.getElementById('p-event-text'); if(evEl) evEl.value=p.eventText||'';
    var lpEl=document.getElementById('p-lowest-price-link'); if(lpEl) lpEl.value=p.lowestPriceLink||'';
    var atEl=document.getElementById('p-appeal-total'); if(atEl) atEl.value=p.appealTotal||'';
    var apEl=document.getElementById('p-appeal-push');  if(apEl) apEl.value=p.appealPush||'';
    // p-owner(담당MD) - 검색형 드롭다운에 값 설정
  var ownerSel = document.getElementById('p-owner');
  if(ownerSel) ownerSel.value = p.owner||'';
  searchSelSetValue('p-owner', p.owner||'');
  // 모바일라이브 전용 담당MD 복원
  searchSelSetValue('p-mlive-md', p.owner||'');
    document.getElementById('p-revenue').value = p.revenue ? p.revenue.toLocaleString('ko-KR') : '';
    // datetime-local 호환: 기존 date-only 값(YYYY-MM-DD)은 T00:00 추가
    var _startVal = p.start||p.startDate||'';
    if(_startVal && _startVal.length === 10) _startVal += 'T00:00';
    document.getElementById('p-start').value = _startVal;
  var budgetEl=document.getElementById('p-budget'); if(budgetEl) budgetEl.value=p.budget ? p.budget.toLocaleString('ko-KR') : '';
  var targetEl=document.getElementById('p-target'); if(targetEl) targetEl.value=p.target||'';
  document.querySelectorAll('input[name="p-role"]').forEach(function(r){ r.checked=(r.value===p.role); });
  updateProdRoleLabels();
  // 캠페인 유형 로드
  var _campType = p.campType || '인플루언서';
  var _ctInf = document.getElementById('p-camptype-inf');
  var _ctMl  = document.getElementById('p-camptype-mlive');
  if(_ctInf) _ctInf.checked = (_campType !== '모바일라이브');
  if(_ctMl)  _ctMl.checked  = (_campType === '모바일라이브');
  // 데이터가 등록된 캠페인이면 유형 변경 불가
  var _hasData = !!(p.infName || (p.infData && p.infData.length && p.infData[0].infName) ||
    (p.skus && p.skus.length && p.skus.some(function(s){ return s.code||s.productName; })) ||
    (p.settleData && p.settleData.length && p.settleData.some(function(d){ return d.revenue||d.orders; })) ||
    p.settleRevenue || p.totalRevenue || p.adIncome ||
    (p.appMkt && p.appMkt.channels && p.appMkt.channels.length) ||
    (p.showhosts && (p.showhosts.req1||p.showhosts.conf1)) ||
    (p.stage && p.stage !== '1.캠페인요청'));
  if(_ctInf) _ctInf.disabled = _hasData;
  if(_ctMl)  _ctMl.disabled  = _hasData;
  var _ctLockMsg = document.getElementById('p-camptype-lock-msg');
  if(_ctLockMsg) _ctLockMsg.style.display = _hasData ? '' : 'none';
  updateCampTypeUI();
    var _endVal = p.end||p.endDate||'';
    if(_endVal && _endVal.length === 10) _endVal += 'T00:00';
    document.getElementById('p-end').value = _endVal;
    // p-inf-size는 멀티 인플루언서 블록으로 이동됨 (생략)
    // pd-list는 p-pd-single로 대체됨 (생략)
    var skuContainer = document.getElementById('sku-list');
    if(!skuContainer){ console.warn('sku-list not found'); } else {
      skuContainer.innerHTML='';
      if(p.skus && p.skus.length){
        p.skus.forEach(function(sku){ addSkuRow(sku); });
      } else { addSkuRow(); }
    } // end skuContainer null check
  // 수정 모드 추가 필드 복원
  var appealEl=document.getElementById('p-appeal'); if(appealEl) appealEl.value=p.appeal||'';
  document.querySelectorAll('.p-promo-cb').forEach(function(cb){
    cb.checked=(p.promos||[]).includes(cb.value);
  });
  var promoTextEl=document.getElementById('p-promo-text'); if(promoTextEl) promoTextEl.value=p.promoText||'';
  var mpEl=document.getElementById('p-market-price'); if(mpEl) mpEl.value=p.marketPrice ? p.marketPrice.toLocaleString('ko-KR') : '';
  var gpEl=document.getElementById('p-group-price');  if(gpEl) gpEl.value=p.groupPrice ? p.groupPrice.toLocaleString('ko-KR') : '';
  var mdcatEl=document.getElementById('p-mdcat');
  if(mdcatEl){
    // 삭제된 MDCAT이면 공란으로 (재입력 유도)
    var mdcatValid = !p.mdcat || MDCAT_CODES.some(function(m){ return (m.label||m.code||'')===p.mdcat; });
    mdcatEl.value = mdcatValid ? (p.mdcat||'') : '';
    if(!mdcatValid) showToast('⚠️ 기존 MDCAT ['+p.mdcat+']이 삭제됐습니다. 다시 선택해주세요.');
  }
  // 캠페인 유형 복원
  var ctOnline = document.getElementById('p-camptype-online');
  var ctBroadcast = document.getElementById('p-camptype-broadcast');
  if(ctOnline && ctBroadcast){
    ctOnline.checked    = (p.campType === '온라인');
    ctBroadcast.checked = (p.campType === '방송');
    updateCamptypeLabels();
  }
  var mcnEl=document.getElementById('p-mcn');     if(mcnEl)   mcnEl.value=p.mcn||'';
  // PD 단일 복원
  // p-pd-single - 검색형 드롭다운에 값 설정
  var pdVal = p.pdSingle||(p.pds&&p.pds[0])||'';
  searchSelSetValue('p-pd-single', pdVal);
  // 인플루언서 멀티 블록 복원
  infBlockCount = 0;
  renderInfBlocks(p.infData && p.infData.length ? p.infData : [{
    infSize: p.infSize||'', infName: p.infName||'',
    youtube: (p.channels&&p.channels.youtube)||'', insta: (p.channels&&p.channels.insta)||'', twitter: (p.channels&&p.channels.twitter)||(p.twitter)||'',
    mcn: p.mcn||'', feeRate: p.feeRate||0, feeAmount: p.feeAmount||0,
    agencyRate: p.agencyRate||0, sampleSent: p.sampleSent||false,
    sampleExempt: p.sampleExempt||false, sampleAddress: p.sampleAddress||''
  }]);
  renderSettleBlocks(p.settleData && p.settleData.length ? p.settleData : [{
    revenue: p.settleRevenue||0, orders: p.settleOrders||0
  }], p.skus||[]);
  // 쇼호스트 복원
  var hosts = p.showhosts||{};
  searchSelSetValue('p-host-req1',  hosts.req1||'');
  searchSelSetValue('p-host-req2',  hosts.req2||'');
  searchSelSetValue('p-host-conf1', hosts.conf1||'');
  searchSelSetValue('p-host-conf2', hosts.conf2||'');
  var sdEl=document.getElementById('p-settle-da'); if(sdEl) sdEl.value=p.settleDa ? p.settleDa.toLocaleString('ko-KR') : '';
  var miEl=document.getElementById('p-marketing-items'); if(miEl) miEl.value=p.marketingItems||'';
  var prEl=document.getElementById('p-profit-rate'); if(prEl) prEl.value=p.profitRateInput||'';
  // 광고수익: 캠페인 adIncome 또는 매칭 _mliveData adRevenue 중 유효한 값 표시
  var _adIncVal = p.adIncome||0;
  if(!_adIncVal && p.campType==='모바일라이브' && p.appMkt && p.appMkt.liveCode && _mliveData && _mliveData.length){
    var _lc = String(p.appMkt.liveCode).trim();
    var _mm = _mliveData.find(function(m){ return String(m.code).trim()===_lc; });
    if(_mm && (_mm.adRevenue||0)) _adIncVal = _mm.adRevenue;
  }
  var aiEl=document.getElementById('p-ad-income'); if(aiEl) aiEl.value=_adIncVal ? _adIncVal.toLocaleString('ko-KR') : '';
  var trEl=document.getElementById('p-total-revenue'); if(trEl) trEl.value=p.totalRevenue ? p.totalRevenue.toLocaleString('ko-KR') : '';
  var orEl=document.getElementById('p-onair-revenue'); if(orEl) orEl.value=p.onairRevenue ? p.onairRevenue.toLocaleString('ko-KR') : '';
  var ofEl=document.getElementById('p-offair-revenue'); if(ofEl) ofEl.value=p.offairRevenue ? p.offairRevenue.toLocaleString('ko-KR') : '';
  var lcEl=document.getElementById('p-live-code'); if(lcEl) lcEl.value=(p.appMkt&&p.appMkt.liveCode)||'';
  var sdoneEl=document.getElementById('p-settle-done'); if(sdoneEl) sdoneEl.checked=!!(p.settleDone);
  var infMLCk=document.getElementById('p-inf-rev-include-mlive'); if(infMLCk) infMLCk.checked=!!(p.infRevIncludeMlive);
  calcInfTotalWithMlive();
  var arEl3=document.getElementById('p-agency-rate'); if(arEl3) arEl3.value=p.agencyRate||'';
  var pbiEl=document.getElementById('p-product-basic-info'); if(pbiEl){ pbiEl.value=p.productBasicInfo||DEFAULT_PRODUCT_BASIC_INFO; pbiEl.nextElementSibling.textContent=(p.productBasicInfo||DEFAULT_PRODUCT_BASIC_INFO).length+'/2000'; }
  var csEl=document.getElementById('p-cs-info'); if(csEl){ csEl.value=p.csInfo||DEFAULT_CS_INFO; csEl.nextElementSibling.textContent=(p.csInfo||DEFAULT_CS_INFO).length+'/500'; }
  var diEl=document.getElementById('p-delivery-info'); if(diEl){ diEl.value=p.deliveryInfo||''; diEl.nextElementSibling.textContent=(p.deliveryInfo||'').length+'/300'; }
  var irEl=document.getElementById('p-inf-request'); if(irEl){ irEl.value=p.infRequest||''; irEl.nextElementSibling.textContent=(p.infRequest||'').length+'/300'; }
  var spdEl=document.getElementById('p-settle-process-date'); if(spdEl){ spdEl.value=p.settleProcessDate||''; }
  var spyEl=document.getElementById('p-settle-payment-date'); if(spyEl) spyEl.value=p.settlePaymentDate||'';
  // 기존 캠페인에 정산처리일 없으면 자동 계산
  if(!p.settleProcessDate) autoCalcSettleProcessDate();
  // 배송 구조화 필드 복원
  var courierEl=document.getElementById('p-courier'); if(courierEl) courierEl.value=p.courier||'';
  var cutoffEl=document.getElementById('p-ship-cutoff'); if(cutoffEl) cutoffEl.value=p.shipCutoff||'';
  var shipFreeEl=document.getElementById('p-ship-free'); if(shipFreeEl){ shipFreeEl.checked=!!(p.shipFree); var sfEl=document.getElementById('p-ship-fee'); if(sfEl){ sfEl.disabled=!!(p.shipFree); sfEl.value=p.shipFee&&!p.shipFree?p.shipFee.toLocaleString('ko-KR'):''; } }
  var islFreeEl=document.getElementById('p-island-free'); if(islFreeEl){ islFreeEl.checked=!!(p.islandFree); var ifEl=document.getElementById('p-island-fee'); if(ifEl){ ifEl.disabled=!!(p.islandFree); ifEl.value=p.islandFee&&!p.islandFree?p.islandFee.toLocaleString('ko-KR'):''; } }
  var exFeeEl=document.getElementById('p-exchange-fee'); if(exFeeEl) exFeeEl.value=p.exchangeFee?p.exchangeFee.toLocaleString('ko-KR'):'';
  var rtFeeEl=document.getElementById('p-return-fee'); if(rtFeeEl) rtFeeEl.value=p.returnFee?p.returnFee.toLocaleString('ko-KR'):'';
  // 확정 사유 복원
  // bas-reason만 복원 (mo-product 모달 전용)
  document.querySelectorAll('.bas-reason-cb').forEach(function(cb){ cb.checked=(p.reasons||[]).includes(cb.value); });
  // 모바일라이브 전용 필드 복원
  var pmEl=document.getElementById('p-product-margin'); if(pmEl) pmEl.value=p.productMargin||'';
  document.querySelectorAll('.mlive-reason-cb').forEach(function(cb){ cb.checked=(p.mliveReasons||[]).includes(cb.value); });
  document.querySelectorAll('.mlive-mktreq-cb').forEach(function(cb){ cb.checked=(p.mliveMktReq||[]).includes(cb.value); });
  document.querySelectorAll('.mlive-partner-cb').forEach(function(cb){ cb.checked=(p.mlivePartner||[]).includes(cb.value); });
  document.querySelectorAll('.mlive-extch-cb').forEach(function(cb){ cb.checked=(p.mliveExtChannel||[]).includes(cb.value); });
  // 모바일라이브 확정일자 복원
  var csEl2=document.getElementById('p-confirm-start'); if(csEl2) csEl2.value=p.confirmStart||'';
  var ceEl2=document.getElementById('p-confirm-end');   if(ceEl2) ceEl2.value=p.confirmEnd||'';
  // APP PUSH 복원
  var pushD = p.pushData||{};
  var prEl3=document.getElementById('p-push-reason'); if(prEl3) prEl3.value = Array.isArray(pushD.reasons) ? pushD.reasons.join(', ') : (pushD.reasons||'');
  var paEl=document.getElementById('p-push-appeal');  if(paEl) paEl.value=pushD.appeal||'';
  var pcEl=document.getElementById('p-push-content'); if(pcEl) pcEl.value=pushD.content||'';
  var plEl=document.getElementById('p-push-landing-base'); if(plEl) plEl.value=pushD.landingBase||'';
  updatePushLandingPreview();
  // AI챗봇 복원
  var aiChat = p.aiChat||{};
  var acUse=document.getElementById('p-aichat-use'); if(acUse) acUse.checked=!!(aiChat.use);
  var acLearn=document.getElementById('p-aichat-learn'); if(acLearn) acLearn.value=aiChat.learn||'';
  updateAiChatSection();
  // APP 마케팅 복원
  var appMkt = p.appMkt||{};
  document.querySelectorAll('.appmkt-cb').forEach(function(cb){ cb.checked=(appMkt.channels||[]).includes(cb.value); });
  var naCk = document.getElementById('appmkt-na');
  if(naCk){ naCk.checked = !!(appMkt.na); toggleAppMktNa(); }
  var suf=document.getElementById('appmkt-super-fields'); if(suf) suf.style.display=(appMkt.channels||[]).includes('슈퍼브랜드')?'block':'none';
  var luf=document.getElementById('appmkt-live-fields');  if(luf) luf.style.display=(appMkt.channels||[]).includes('모바일라이브')?'block':'none';
  var ss=document.getElementById('appmkt-super-start'); if(ss) ss.value=appMkt.superStart||'';
  var se=document.getElementById('appmkt-super-end');   if(se) se.value=appMkt.superEnd||'';
  var ld=document.getElementById('appmkt-live-dt');     if(ld) ld.value=appMkt.liveDt||'';
  var alc=document.getElementById('appmkt-live-code');  if(alc) alc.value='';
  // 복수 편성코드 복원
  _mliveCodes = (appMkt.liveCodes && appMkt.liveCodes.length) ? appMkt.liveCodes.slice() : (appMkt.liveCode ? [appMkt.liveCode] : []);
  renderMliveCodeTags();
  // 채널별 인라인 필드 복원
  var _fmt=function(v){return v?v.toLocaleString('ko-KR'):'';};
  var dmpS=document.getElementById('appmkt-dmp-send');  if(dmpS) dmpS.value=_fmt(appMkt.dmpSend);
  var pushS=document.getElementById('appmkt-push-send');if(pushS) pushS.value=_fmt(appMkt.pushSend);
  var kakaoS=document.getElementById('appmkt-kakao-send');if(kakaoS) kakaoS.value=_fmt(appMkt.kakaoSend);
  var ssgA=document.getElementById('appmkt-ssg-amount');if(ssgA) ssgA.value=_fmt(appMkt.ssgAmount);
  var ssgC=document.getElementById('appmkt-ssg-count'); if(ssgC) ssgC.value=_fmt(appMkt.ssgCount);
  var sbC=document.getElementById('appmkt-starbucks-count');if(sbC) sbC.value=_fmt(appMkt.starbucksCount);
  toggleAppMktFields();
  var lu=document.getElementById('appmkt-landing-url'); if(lu) lu.value=appMkt.landingUrl||'';
  var du=document.getElementById('appmkt-deal-url');    if(du) du.value=appMkt.dealUrl||'';
  var etcT=document.getElementById('appmkt-etc-text');  if(etcT) etcT.value=appMkt.etcText||'';
  initSections(false); // 수정 시에도 기본 닫힘
  applyModalPermissions();
  // 인플루언서 전체매출 라벨/연동 갱신
  updateTotalRevLabel();
  // 상태 배지 갱신
  setTimeout(function(){ if(p && p.stage) updateProdStageBadge(p.stage); }, 10);
}

// 캠페인 요청 상세 (상품코드 목록 보기)
function openCampReqDetail(id){
  var p = DB.campaigns.find(function(x){return x.id===id;}); if(!p) return;
  var skus = p.skus||[];
  var skuRows = skus.length
    ? skus.map(s=>`<tr>
        <td style="text-align:center;padding:6px 4px;font-size:11px;color:var(--text3)">${s.num||''}</td>
        <td style="text-align:center;padding:6px 4px">${s.isMain?'<span style="color:var(--accent2);font-size:13px" title="대표상품">★</span>':''}</td>
        <td style="font-family:monospace;font-size:12px">${s.code||'-'}</td>
        <td style="color:var(--text2)">${s.mdcat||'-'}</td>
        <td style="color:var(--text2)">${s.cat||'-'}</td>
        <td>${s.productName||'-'}</td>
        <td style="color:var(--text2)">${s.brand||'-'}</td>
        <td style="color:var(--text3);font-size:11px">${s.md||'-'}</td>
      </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:16px">등록된 상품코드 없음</td></tr>';
  var html = `<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r-lg);padding:20px;margin-top:16px" id="camp-req-detail">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="font-size:15px;font-weight:800">${p.name}</div>
      <div style="display:flex;gap:7px">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('camp-req-detail').remove();editProd(${p.id})">✏️ 수정</button>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('camp-req-detail').remove()">닫기</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;font-size:12.5px">
      <div><div style="color:var(--text3);margin-bottom:2px">캠페인코드</div><div style="font-family:monospace;font-weight:700;color:var(--accent2)">${p.campCode||'-'}</div></div>
      <div><div style="color:var(--text3);margin-bottom:2px">업체</div><div>${p.company||'-'}</div></div>
      <div><div style="color:var(--text3);margin-bottom:2px">담당MD</div><div>${p.owner||'-'}</div></div>
      <div><div style="color:var(--text3);margin-bottom:2px">캠페인담당</div><div>${(p.pds||[]).join(', ')||'-'}</div></div>
      <div><div style="color:var(--text3);margin-bottom:2px">예상매출</div><div style="font-weight:700;color:var(--green)">${p.revenue?fmtN(p.revenue)+'원':'-'}</div></div>
      <div><div style="color:var(--text3);margin-bottom:2px">시작일</div><div>${p.startDate||'-'}</div></div>
      <div><div style="color:var(--text3);margin-bottom:2px">종료일</div><div>${p.endDate||'-'}</div></div>
      <div><div style="color:var(--text3);margin-bottom:2px">인플루언서규모</div><div>${p.infSize||'-'}</div></div>
      <div><div style="color:var(--text3);margin-bottom:2px">시장가</div><div style="font-weight:600">${p.marketPrice?fmtN(p.marketPrice)+'원':'-'}</div></div>
      <div><div style="color:var(--text3);margin-bottom:2px">공구가격</div><div style="font-weight:600;color:var(--green)">${p.groupPrice?fmtN(p.groupPrice)+'원':'-'}</div></div>
    </div>
    ${p.appeal?`<div style="margin-bottom:12px"><div style="font-size:10.5px;font-weight:700;color:var(--text3);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">소구 포인트</div><div style="background:var(--bg3);border-radius:var(--r-sm);padding:10px 12px;font-size:12.5px;line-height:1.6;color:var(--text2);white-space:pre-wrap">${p.appeal}</div></div>`:''}
    ${(p.promos&&p.promos.length)?`<div style="margin-bottom:12px"><div style="font-size:10.5px;font-weight:700;color:var(--text3);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">프로모션</div><div style="display:flex;flex-wrap:wrap;gap:5px">${p.promos.map(pr=>'<span style="background:var(--accent-bg);color:var(--accent2);padding:3px 9px;border-radius:20px;font-size:11.5px;font-weight:700">'+pr+'</span>').join('')}${p.promoText?'<span style="background:var(--bg4);color:var(--text2);padding:3px 9px;border-radius:20px;font-size:11.5px">'+p.promoText+'</span>':''}</div></div>`:''}
    <div style="font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px">등록 상품코드 (${skus.length}개)</div>
    <table style="width:100%;border-collapse:collapse;font-size:12.5px">
      <thead><tr style="border-bottom:1px solid var(--border)">
        <th style="text-align:center;padding:6px 4px;font-size:10.5px;color:var(--text3)">#</th><th style="text-align:center;padding:6px 4px;font-size:10.5px;color:var(--text3)">대표</th><th style="text-align:left;padding:6px 8px;font-size:10.5px;color:var(--text3)">상품코드</th>
        <th style="text-align:left;padding:6px 8px;font-size:10.5px;color:var(--text3)">MDCAT</th>
        <th style="text-align:left;padding:6px 8px;font-size:10.5px;color:var(--text3)">카테고리</th>
        <th style="text-align:left;padding:6px 8px;font-size:10.5px;color:var(--text3)">상품명</th>
        <th style="text-align:left;padding:6px 8px;font-size:10.5px;color:var(--text3)">브랜드</th>
        <th style="text-align:left;padding:6px 8px;font-size:10.5px;color:var(--text3)">담당MD</th>
      </tr></thead>
      <tbody>${skuRows}</tbody>
    </table>
  </div>`;
  // remove old detail if exists
  var old = document.getElementById('camp-req-detail');
  if(old) old.remove();
  document.getElementById('page-s1').insertAdjacentHTML('beforeend', html);
}

// ═══════════════════════════════════════
// S2: 캠페인확정
// ═══════════════════════════════════════

// ── 정산 비용 자동 계산 ──
function calcSettleCost(){
  var revenue    = iv('p-settle-revenue');
  var feeRate    = parseFloat(document.getElementById('p-fee-rate')?.value)||0;
  var feeAmount  = iv('p-fee-amount');
  var agencyRate = parseFloat(document.getElementById('p-agency-rate')?.value)||0;
  var daFee      = iv('p-settle-da');

  var infFeeCost    = Math.round(revenue * feeRate / 100);
  var agencyFeeCost = Math.round(revenue * agencyRate / 100);
  var totalCost     = infFeeCost + feeAmount + agencyFeeCost + daFee;

  var fmt = function(n){ return n ? n.toLocaleString('ko-KR')+'원' : '-'; };

  var d1 = document.getElementById('p-disp-fee-rate');
  var d2 = document.getElementById('p-disp-fee-amount');
  var d3 = document.getElementById('p-disp-agency-rate');
  if(d1) d1.textContent = feeRate ? feeRate+'%' : '';
  if(d2) d2.textContent = feeAmount ? feeAmount.toLocaleString('ko-KR')+'원' : '';
  if(d3) d3.textContent = agencyRate ? agencyRate+'%' : '';

  var el1 = document.getElementById('p-calc-inf-fee');
  var el2 = document.getElementById('p-calc-fee-amount');
  var el3 = document.getElementById('p-calc-agency-fee');
  var el4 = document.getElementById('p-calc-total-cost');
  var el5 = document.getElementById('p-calc-da-fee');
  if(el1) el1.textContent = revenue ? fmt(infFeeCost) : '-';
  if(el2) el2.textContent = feeAmount ? fmt(feeAmount) : '-';
  if(el3) el3.textContent = revenue ? fmt(agencyFeeCost) : '-';
  if(el4) el4.textContent = totalCost ? fmt(totalCost) : '-';
  if(el5) el5.textContent = daFee ? fmt(daFee) : '-';
}

function renderS2(){
  var _s2th=document.querySelector('#page-s2 thead');
  if(_s2th&&_dashMode==='mlive') _s2th.innerHTML=_mliveHeaders.s2;
  var rows='';
  var s2OwnerFilter = (document.getElementById('sf-s2-owner')?.value||'').trim();
  var s2MdFilter    = (document.getElementById('sf-s2-md')?.value||'').trim();
  var s2Camps = DB.campaigns.filter(function(c){
    if(!matchesDashMode(c)) return false;
    if(pageFilter.s2 !== 'target' && !matchesDateFilter(c,'s2')) return false;
    var _nf=(document.getElementById('sf-s2-name')?.value||'').trim().toLowerCase();
    if(_nf && !(c.name||'').toLowerCase().includes(_nf)) return false;
    if(s2OwnerFilter && !(c.pdSingle||c.pds&&c.pds[0]||'').includes(s2OwnerFilter)) return false;
    if(s2MdFilter    && !(c.owner||'').includes(s2MdFilter))    return false;
    if(isMyOnlyFilter('s2') && !isMycamp(c)) return false;
    if(pageFilter.s2==='target') return c.stage==='1.캠페인요청';
    return c.stage==='1.캠페인요청'||c.stage==='2.캠페인확정';
  });
  // 페이징 처리
  var _pg_s2 = _getPagedItems(s2Camps, 's2');
  _pg_s2.items.forEach(function(c, _pi){
    var rowNum = _pg_s2.startIdx + _pi + 1;
    if(_dashMode==='mlive'){ rows+=mliveStageRow('s2',c,rowNum); return; }
    var reasons = c.reasons||[];
    var isConfirmed = reasons.length > 0;
    var mdcatVal = c.mdcat || (c.skus&&c.skus[0] ? c.skus[0].mdcat : '') || '-';

    // 확정 사유 배지
    var reasonCell = isConfirmed
      ? reasons.map(function(r){
          var rColor = ['브랜드력','가격경쟁력','시즈널리티','트렌드','레퍼런스','마진','물량'].includes(r)?'var(--blue)':'var(--accent2)';
          var rBg    = ['브랜드력','가격경쟁력','시즈널리티','트렌드','레퍼런스','마진','물량'].includes(r)?'var(--blue-bg)':'var(--accent-bg)';
          return '<span style="background:'+rBg+';color:'+rColor+';padding:2px 7px;border-radius:20px;font-size:11px;font-weight:700;margin-right:3px">'+r+'</span>';
        }).join('')
      : '<span style="background:var(--bg4);color:var(--text3);padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600">미확정</span>';

    // 역할 배지
    var roleColor = c.role==='메가'?'var(--pink)':c.role==='앵콜'?'var(--orange)':c.role==='미들'?'var(--blue)':c.role==='시딩'?'var(--green)':'var(--text3)';
    var roleBg    = c.role==='메가'?'var(--pink-bg)':c.role==='앵콜'?'var(--orange-bg)':c.role==='미들'?'var(--blue-bg)':c.role==='시딩'?'var(--green-bg)':'var(--bg4)';

    // 예상매출 억단위
    var revStr = '-';
    if(c.revenue){
      var uck = c.revenue/100000000;
      revStr = uck>=0.1 ? uck.toFixed(1)+'억' : (c.revenue/10000).toFixed(0)+'만';
    }

    var isAlreadyConfirmed = c.stage==='2.캠페인확정'||c.stage==='4.MCN요청'||c.stage==='5.인플루언서확정'||c.stage==='6.APP마케팅확정'||c.stage==='7.정산'||c.stage==='7.정산완료';
    rows+='<tr style="cursor:pointer" onclick="editProd('+c.id+')">'+'<td style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);width:36px">'+rowNum+'</td>'
      +'<td onclick="event.stopPropagation()"><input type="checkbox" class="row-chk" data-id="'+c.id+'" data-stage="s2" style="cursor:pointer"></td>'
      +'<td class="mob-hide" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap">'+displayCampCode(c)+'</td>'
      +'<td style="white-space:normal;min-width:80px;max-width:150px"><strong>'+c.name+'</strong>'+(isAlreadyConfirmed?'<br><span style="font-size:10px;color:var(--green)">✓ 확정</span>':'<br><span style="font-size:10px;color:var(--text3)">미확정</span>')+'</td>'
      +'<td style="color:var(--text3);font-size:12px;font-family:monospace">'+mdcatVal+'</td>'
      +'<td>'+(c.role?'<span style="background:'+roleBg+';color:'+roleColor+';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">'+c.role+'</span>':'-')+'</td>'
      +'<td>'+reasonCell+'</td>'
      +'<td style="color:var(--text2);font-size:12.5px">'+(c.infSize||'-')+'</td>'
      +'<td style="font-weight:700;color:var(--green)">'+revStr+'</td>'
      +'<td style="color:var(--text3);font-size:12px">'+(_dashMode==='mlive'?fmtBroadcastDt(c):((c.start||c.startDate||'-').slice(5)))+'</td>'
      +(_dashMode!=='mlive'?'<td style="color:var(--text3);font-size:12px">'+((c.end||c.endDate||'-').slice(5))+'</td>':'')
      +'<td><div class="row-acts" style="opacity:1">'
      +(isAlreadyConfirmed
        ? '<span style="font-size:11px;color:var(--green);font-weight:700">✓ 확정완료</span> <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();openConfirmModal('+c.id+')">수정</button>'
        : '<button class="btn btn-primary btn-xs" onclick="event.stopPropagation();openConfirmModal('+c.id+')">✅ 캠페인 확정</button>')
      +'<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd('+c.id+')">✏️ 상세</button>'
      +'</div></td>'
      +'</tr>';
  });
  
  _renderPagination('s2-pagination', s2Camps.length, 's2', 'renderS2()');
  document.getElementById('s2-tbl').innerHTML=rows||'<tr><td colspan="11" class="empty">캠페인 없음</td></tr>';
}

// ═══════════════════════════════════════
// S2: 캠페인 확정 팝업
// ═══════════════════════════════════════
function openConfirmModal(campId){
  var c = DB.campaigns.find(function(x){return x.id===campId;});
  if(!c) return;
  var existing = document.getElementById('s2-confirm-modal');
  if(existing) existing.remove();

  var el = document.createElement('div');
  el.id = 's2-confirm-modal';
  el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.4);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
  var reasons_c = c.reasons||[];
  var mkCb = function(val, color, borderColor){
    return '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 12px;border:1px solid '+borderColor+';border-radius:20px;font-size:12.5px;font-weight:600;background:'+borderColor.replace('rgba(','rgba(').replace(',.',',0.07)')+'"><input type="checkbox" class="cm-reason-cb" value="'+val+'" style="width:13px;height:13px;accent-color:'+color+';cursor:pointer"'+(reasons_c.includes(val)?' checked':'')+'>'+val+'</label>';
  };
  var blueItems = ['브랜드력','가격경쟁력','시즈널리티','트렌드','레퍼런스','마진','물량','신상','앵콜','타겟적합'];
  var snsItems  = ['차별성','시연성','이지픽'];
  el.innerHTML = '<div style="background:var(--bg);border:1px solid var(--border2);border-radius:var(--r-lg);padding:24px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto">'
    + '<div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:4px">✅ 캠페인 확정</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-bottom:16px">'+escHtml(c.name||'')+'</div>'
    + '<div style="font-size:11.5px;font-weight:700;color:var(--blue);margin-bottom:8px">📦 상품</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">'
    + blueItems.map(function(v){ return mkCb(v,'var(--blue)','rgba(8,116,212,.25)'); }).join('')
    + '</div>'
    + '<div style="font-size:11.5px;font-weight:700;color:var(--accent2);margin-bottom:8px">📱 SNS적합성</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px">'
    + snsItems.map(function(v){ return mkCb(v,'var(--accent)','rgba(108,92,231,.25)'); }).join('')
    + '</div>'
    + '<div style="display:flex;gap:8px;justify-content:flex-end">'
    + '<button class="btn btn-ghost" onclick="document.getElementById(\'s2-confirm-modal\').remove()">취소</button>'
    + '<button class="btn btn-primary" onclick="saveConfirmModal('+campId+')">확정 저장</button>'
    + '</div>'
    + '</div>';

  document.body.appendChild(el);
  // 외부클릭 닫힘 비활성화
}

function saveConfirmModal(campId){
  var reasons = [];
  document.querySelectorAll('#s2-confirm-modal .cm-reason-cb:checked').forEach(function(cb){ reasons.push(cb.value); });

  if(reasons.length===0){ alert('확정 사유를 하나 이상 선택해주세요.'); return; }

  var idx = DB.campaigns.findIndex(function(x){return x.id===campId;});
  if(idx===-1) return;

  DB.campaigns[idx] = Object.assign({}, DB.campaigns[idx], {
    stage: '2.캠페인확정',
    reasons: reasons
  });
  _myLastSaveTime = Date.now();
  _myLastSaveCamps = [DB.campaigns[idx]];

  addAct('✅', DB.campaigns[idx].name+' 캠페인 확정', nowStr(), ME);
  addNotif('✅', DB.campaigns[idx].name+' 캠페인 확정됨', '방금 전');

  document.getElementById('s2-confirm-modal').remove();
  setTimeout(function(){ renderAllPages(); }, 100);

  // Firebase 저장
  _suppressListener = true;
  var payload = {
    products:    arrToObj(DB.products),
    campaigns:   arrToObj(DB.campaigns),
    influencers: arrToObj(DB.influencers),
    matches:     arrToObj(DB.matches),
    progress:    arrToObj(DB.progress),
    mcnRequests: arrToObj(DB.mcnRequests||[]),
    appMarketing:arrToObj(DB.appMarketing||[]),
    settlements: arrToObj(DB.settlements||[]),
    activities:  arrToObj(DB.activities.slice(0,30)),
    comments:    DB.comments,
    history:     DB.history,
    _lastWriter: ME||ME_EMAIL,
    _lastWrite:  Date.now(),
  };
  (fbReady ? fbRef.update(JSON.parse(JSON.stringify(payload))) : Promise.resolve())
    .then(function(){ setTimeout(function(){ _suppressListener=false; _myLastSaveCamps=null; },8000); })
    .catch(function(){ _suppressListener=false; });

  renderS2(); renderS4(); renderDash(); updateBadges();
  showCompleteModal('확정');
}

// ═══════════════════════════════════════
// S3: MCN요청
// ═══════════════════════════════════════
function renderS3(){
  var _s3th=document.querySelector('#page-s3 thead');
  if(_s3th&&_dashMode==='mlive') _s3th.innerHTML=_mliveHeaders.s3;
  var nameF  = (document.getElementById('sf-s3-name')?.value||'').trim().toLowerCase();
  var ownerF = (document.getElementById('sf-s3-owner')?.value||'').trim();
  var mdF    = (document.getElementById('sf-s3-md')?.value||'').trim();
  var filtered = DB.campaigns.filter(function(c){
    if(!matchesDashMode(c)) return false;
    if(pageFilter.s3 !== 'target' && !matchesDateFilter(c,'s3')) return false;
    var _nf=(document.getElementById('sf-s3-name')?.value||'').trim().toLowerCase();
    if(_nf && !(c.name||'').toLowerCase().includes(_nf)) return false;
    if(ownerF && !(c.pdSingle||(c.pds&&c.pds[0])||'').toLowerCase().includes(ownerF.toLowerCase())) return false;
    if(mdF    && !(c.owner||'').toLowerCase().includes(mdF.toLowerCase())) return false;
    if(pageFilter.s3==='target') return c.stage==='2.캠페인확정' || c.stage==='3.상품정보등록';
    // 전체보기: 2단계+3단계
    return c.stage==='2.캠페인확정' || c.stage==='3.상품정보등록';
  });
  var rows = '';
  // 페이징 처리
  var _pg_s3 = _getPagedItems(filtered, 's3');
  _pg_s3.items.forEach(function(c, _pi){
    var rowNum = _pg_s3.startIdx + _pi + 1;
    if(_dashMode==='mlive'){ rows+=mliveStageRow('s3',c,rowNum); return; }
    var mdcat = c.mdcat||(c.skus&&c.skus[0]?c.skus[0].mdcat:'')||'-';
    var reasons = (c.reasons||[]).map(function(r){
      var col = ['브랜드력','가격경쟁력','시즈널리티','트렌드','레퍼런스','마진','물량'].includes(r)?'var(--blue)':'var(--accent2)';
      var bg  = ['브랜드력','가격경쟁력','시즈널리티','트렌드','레퍼런스','마진','물량'].includes(r)?'var(--blue-bg)':'var(--accent-bg)';
      return '<span style="background:'+bg+';color:'+col+';padding:2px 6px;border-radius:12px;font-size:10.5px;font-weight:700;margin-right:2px">'+r+'</span>';
    }).join('');
    // 상품코드 입력 여부
    var hasSkus = c.skus && c.skus.some(function(s){ return s.code; });
    // 가격정보 입력 여부
    var hasPrice = c.priceGrid && c.priceGrid.some(function(p){ return (p.mdPrice||0)>0||(p.price||0)>0; });
    var skuBadge  = hasSkus  ? '<span style="background:var(--green-bg);color:var(--green);padding:2px 7px;border-radius:12px;font-size:10.5px;font-weight:700">✓ 입력완료</span>'
                              : '<span style="background:var(--orange-bg);color:var(--orange);padding:2px 7px;border-radius:12px;font-size:10.5px;font-weight:700">미입력</span>';
    var priceBadge = hasPrice ? '<span style="background:var(--green-bg);color:var(--green);padding:2px 7px;border-radius:12px;font-size:10.5px;font-weight:700">✓ 입력완료</span>'
                               : '<span style="background:var(--orange-bg);color:var(--orange);padding:2px 7px;border-radius:12px;font-size:10.5px;font-weight:700">미입력</span>';
    rows += '<tr onclick="editProd('+c.id+')">'+'<td style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);width:36px">'+rowNum+'</td>'
      +'<td><input type="checkbox" class="row-chk" data-stage="s3" data-id="'+c.id+'" onclick="event.stopPropagation()"></td>'
      +'<td class="mob-hide" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap">'+displayCampCode(c)+'</td>'
      +'<td style="font-weight:600;white-space:normal;min-width:80px;max-width:160px">'+escHtml(c.name||'-')+'</td>'
      +'<td style="color:var(--text3);font-size:12px">'+escHtml(mdcat)+'</td>'
      +'<td><span style="font-size:12px;font-weight:600;color:var(--accent2)">'+escHtml(c.role||'-')+'</span></td>'
      +'<td>'+skuBadge+'</td>'
      +'<td>'+priceBadge+'</td>'
      +'<td style="font-size:12px;color:var(--text3)">'+(c.start||'').slice(5)+'</td>'
      +'<td style="font-size:12px;color:var(--text3)">'+(c.end||'').slice(5)+'</td>'
      +'<td><div class="row-acts">'
      +'<button class="btn btn-success btn-xs" onclick="event.stopPropagation();editProd('+c.id+')" style="background:var(--green);color:#fff;border-color:var(--green)">📦 상품정보등록</button>'
      +'<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd('+c.id+')">🔍 상세</button>'
      +'</div></td>'
      +'</tr>';
  });
  _renderPagination('s3-pagination', filtered.length, 's3', 'renderS3()');
  var tbl = document.getElementById('s3-tbl');
  if(tbl) tbl.innerHTML = rows || '<tr><td colspan="10" class="empty">2단계 확정된 캠페인이 없습니다</td></tr>';
}

function renderS4(){
  // 4단계 MCN요청: 상품정보등록(3단계) 완료 후 MCN 요청 단계
  var confirmedCamps = DB.campaigns.filter(function(c){
    if(!matchesDashMode(c)) return false;
    if(pageFilter.s4 !== 'target' && !matchesDateFilter(c,'s4')) return false;
    var _nf=(document.getElementById('sf-s4-name')?.value||'').trim().toLowerCase();
    if(_nf && !(c.name||'').toLowerCase().includes(_nf)) return false;
    // 캠페인담당 필터
    var nameF  = (document.getElementById('sf-s4-name')?.value||'').trim().toLowerCase();
  var ownerF = (document.getElementById('sf-s4-owner')?.value||'').trim();
    var mdF_s3 = (document.getElementById('sf-s4-md')?.value||'').trim();
    if(ownerF && !(c.pdSingle||c.pds&&c.pds[0]||'').includes(ownerF)) return false;
    if(mdF_s3  && !(c.owner||'').toLowerCase().includes(mdF_s3.toLowerCase()))  return false;
    if(isMyOnlyFilter('s4') && !isMycamp(c)) return false;
    if(pageFilter.s4==='target') return c.stage==='3.상품정보등록';
    return c.stage==='3.상품정보등록' || c.stage==='4.MCN요청'; // 전체: 3~4단계
  });

  var rows = '';
  // 페이징 처리
  var _pg_s4 = _getPagedItems(confirmedCamps, 's4');
  _pg_s4.items.forEach(function(c, _pi){
    var rowNum = _pg_s4.startIdx + _pi + 1;
    var mdcatVal = c.mdcat || (c.skus&&c.skus[0] ? c.skus[0].mdcat : '') || '-';
    var roleColor = c.role==='메가'?'var(--pink)':c.role==='앵콜'?'var(--orange)':c.role==='미들'?'var(--blue)':c.role==='시딩'?'var(--green)':'var(--text3)';
    var roleBg    = c.role==='메가'?'var(--pink-bg)':c.role==='앵콜'?'var(--orange-bg)':c.role==='미들'?'var(--blue-bg)':c.role==='시딩'?'var(--green-bg)':'var(--bg4)';
    var reasons   = c.reasons||[];
    var reasonCell = reasons.length
      ? reasons.map(function(r){
          var rc=['브랜드력','가격경쟁력','시즈널리티','트렌드','레퍼런스','마진','물량'].includes(r)?'var(--blue)':'var(--accent2)';
          var rb=['브랜드력','가격경쟁력','시즈널리티','트렌드','레퍼런스','마진','물량'].includes(r)?'var(--blue-bg)':'var(--accent-bg)';
          return '<span style="background:'+rb+';color:'+rc+';padding:2px 7px;border-radius:20px;font-size:11px;font-weight:700;margin-right:3px">'+r+'</span>';
        }).join('')
      : '<span style="color:var(--text3);font-size:12px">-</span>';
    var revStr = '-';
    if(c.revenue){ var u=c.revenue/100000000; revStr=u>=0.1?u.toFixed(1)+'억':(c.revenue/10000).toFixed(0)+'만'; }
    // 복수 MCN 표시
    var mcnList = _mcnListFromCamp(c);
    var hasMcn = mcnList.some(function(m){return m.agency;});
    var mcnCell = hasMcn
      ? mcnList.filter(function(m){return m.agency;}).map(function(m){
          return '<span style="display:inline-flex;align-items:center;gap:4px;background:var(--blue-bg);color:var(--blue);border:1px solid rgba(8,116,212,.2);padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;margin:1px 2px 1px 0">'
            +escHtml(m.agency)
            +(m.infName?'<span style="color:var(--text3);font-weight:400">·'+escHtml(m.infName)+'</span>':'')
            +'</span>';
        }).join('')
      : '<span style="color:var(--text3);font-size:12px">-</span>';

    rows += '<tr onclick="editProd('+c.id+')" style="cursor:pointer">'+'<td style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);width:36px">'+rowNum+'</td>'
      +'<td onclick="event.stopPropagation()"><input type="checkbox" class="row-chk" data-id="'+c.id+'" data-stage="s4" style="cursor:pointer"></td>'
      +'<td class="mob-hide" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap">'+displayCampCode(c)+'</td>'
      +'<td style="white-space:nowrap"><strong>'+c.name+'</strong>'
      +(c.stage==='4.MCN요청'?'&nbsp;<span style="font-size:10px;color:var(--blue)">▶ MCN완료</span>':'')+'</td>'
      +'<td style="color:var(--text3);font-size:12px;white-space:nowrap">'+mdcatVal+'</td>'
      +'<td style="white-space:nowrap">'+(c.role?'<span style="background:'+roleBg+';color:'+roleColor+';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">'+c.role+'</span>':'-')+'</td>'
      +'<td style="color:var(--text2);font-size:12.5px;white-space:nowrap">'+(c.infSize||'-')+'</td>'
      +'<td style="font-weight:700;color:var(--green);white-space:nowrap">'+revStr+'</td>'
      +'<td style="max-width:220px">'+mcnCell+'</td>'
      +'<td style="color:var(--text3);font-size:12px;white-space:nowrap">'+(_dashMode==='mlive'?fmtBroadcastDt(c):((c.start||c.startDate||'-').slice(5)))+'</td>'
      +(_dashMode!=='mlive'?'<td style="color:var(--text3);font-size:12px;white-space:nowrap">'+((c.end||c.endDate||'-').slice(5))+'</td>':'')
      +'<td><div class="row-acts" style="opacity:1">'
      +'<button class="btn btn-xs" onclick="event.stopPropagation();openMcnEdit('+c.id+')" style="background:var(--green);color:#fff;border:1px solid var(--green);border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:600">📨 MCN등록</button>'
      +'<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd('+c.id+')">📋 상세</button>'
      +'</div></td>'
      +'</tr>';
  });
  
  _renderPagination('mcn-pagination', confirmedCamps.length, 's4', 'renderS4()');
  document.getElementById('mcn-tbl').innerHTML = rows ||
    '<tr><td colspan="11" class="empty" style="padding:28px;text-align:center;color:var(--text3)">2단계 확정된 캠페인이 없습니다</td></tr>';
}

// ── MCN 복수 등록 팝업 ──────────────────────────────────────────
// mcnList: [{agency:'', infName:''}] 형태로 저장
// 기존 c.mcn(string) → mcnList[0].agency 로 하위 호환

function _mcnListFromCamp(c){
  // 기존 데이터 호환: mcnList 없으면 c.mcn으로 생성
  if(c.mcnList && c.mcnList.length) return JSON.parse(JSON.stringify(c.mcnList));
  if(c.mcn) return [{agency: c.mcn, infName: c.infName||''}];
  return [{agency:'', infName:''}];
}

function _buildMcnRowHtml(idx, agency, infName){
  var opts = MCN_COMPANIES.map(function(co){
    return '<option value="'+escHtml(co.name)+'"'+(co.name===agency?' selected':'')+'>'+escHtml(co.name)+'</option>';
  }).join('');
  return '<div class="mcn-row" data-idx="'+idx+'" style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
    +'<div style="flex:1.2">'
    +'<select class="sel mcn-row-agency" style="font-size:12.5px;height:34px;padding:0 8px"><option value="">-- 업체 선택 --</option>'+opts+'</select>'
    +'</div>'
    +'<div style="flex:1.4">'
    +'<input class="inp mcn-row-inf" value="'+escHtml(infName)+'" placeholder="인플루언서명" style="font-size:12.5px;height:34px">'
    +'</div>'
    +'<button type="button" onclick="mcnRowDel(this)" style="background:var(--red-bg);color:var(--red);border:1px solid rgba(204,34,34,.2);border-radius:6px;padding:0 9px;height:34px;font-size:14px;cursor:pointer;flex-shrink:0" title="삭제">✕</button>'
    +'</div>';
}

function mcnRowAdd(){
  var list = document.getElementById('mcn-row-list');
  if(!list) return;
  var idx = list.querySelectorAll('.mcn-row').length;
  var div = document.createElement('div');
  div.innerHTML = _buildMcnRowHtml(idx,'','');
  list.appendChild(div.firstChild);
}

function mcnRowDel(btn){
  var row = btn.closest('.mcn-row');
  var list = document.getElementById('mcn-row-list');
  if(!list) return;
  if(list.querySelectorAll('.mcn-row').length <= 1){
    // 마지막 행은 삭제 대신 초기화
    row.querySelector('.mcn-row-agency').value = '';
    row.querySelector('.mcn-row-inf').value = '';
    return;
  }
  row.remove();
}

function openMcnEdit(campId){
  var c = DB.campaigns.find(function(x){return x.id===campId;}); if(!c) return;
  var existing = document.getElementById('mcn-edit-modal');
  if(existing) existing.remove();

  var initList = _mcnListFromCamp(c);

  var el = document.createElement('div');
  el.id = 'mcn-edit-modal';
  el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.35);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';

  var inner = document.createElement('div');
  inner.style.cssText = 'background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r-lg);padding:26px 28px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto';

  // 헤더
  inner.innerHTML = '<div style="font-size:15px;font-weight:800;margin-bottom:3px">📨 MCN 요청 등록</div>'
    +'<div style="font-size:12px;color:var(--text3);margin-bottom:18px">'+escHtml(c.name)+'</div>'
    // 컬럼 라벨
    +'<div style="display:flex;gap:8px;margin-bottom:6px;padding-right:38px">'
    +'<div style="flex:1.2;font-size:11.5px;font-weight:700;color:var(--text2)">MCN 업체 <span style="color:var(--red)">*</span></div>'
    +'<div style="flex:1.4;font-size:11.5px;font-weight:700;color:var(--text2)">인플루언서</div>'
    +'</div>'
    // 행 목록
    +'<div id="mcn-row-list"></div>'
    // 행 추가 버튼
    +'<button type="button" onclick="mcnRowAdd()" style="display:flex;align-items:center;gap:5px;background:var(--accent-bg);color:var(--accent2);border:1.5px dashed var(--accent);border-radius:var(--r-sm);padding:6px 14px;font-size:12.5px;font-weight:700;cursor:pointer;width:100%;justify-content:center;margin-top:2px;margin-bottom:20px">＋ MCN 업체 추가</button>'
    // 하단 버튼
    +'<div style="display:flex;gap:8px;justify-content:flex-end">'
    +'<button class="btn btn-ghost" onclick="document.getElementById(\'mcn-edit-modal\').remove()">취소</button>'
    +'<button class="btn btn-primary" onclick="saveMcnEdit('+campId+')">저장 · MCN요청 완료</button>'
    +'</div>';

  el.appendChild(inner);
  document.body.appendChild(el);

  // 기존 데이터로 행 렌더
  var rowList = inner.querySelector('#mcn-row-list');
  initList.forEach(function(item, i){
    var div = document.createElement('div');
    div.innerHTML = _buildMcnRowHtml(i, item.agency||'', item.infName||'');
    rowList.appendChild(div.firstChild);
  });
}

function saveMcnEdit(campId){
  // 모든 행 수집
  var rows = document.querySelectorAll('#mcn-edit-modal #mcn-row-list .mcn-row');
  var mcnList = [];
  rows.forEach(function(row){
    var agency = (row.querySelector('.mcn-row-agency')?.value||'').trim();
    var infName = (row.querySelector('.mcn-row-inf')?.value||'').trim();
    if(agency) mcnList.push({agency: agency, infName: infName});
  });
  if(mcnList.length === 0){ alert('MCN 업체를 최소 1개 이상 선택해주세요'); return; }

  var idx = DB.campaigns.findIndex(function(c){return c.id===campId;});
  if(idx===-1) return;
  var oldStage = DB.campaigns[idx].stage || '1.캠페인요청';
  var higherThan4 = ['5.인플루언서확정','6.APP마케팅확정','7.정산','7.정산완료'];
  var newStage = higherThan4.includes(oldStage) ? oldStage : '4.MCN요청';

  // 하위 호환: mcn/infName은 첫 번째 항목으로 유지
  DB.campaigns[idx] = Object.assign({}, DB.campaigns[idx], {
    mcnList:  mcnList,
    mcn:      mcnList[0].agency,
    infName:  mcnList[0].infName || DB.campaigns[idx].infName || '',
    stage:    newStage
  });
  _myLastSaveTime = Date.now();
  _myLastSaveCamps = [DB.campaigns[idx]];
  document.getElementById('mcn-edit-modal').remove();
  _suppressListener = true;
  var payload={products:arrToObj(DB.products),campaigns:arrToObj(DB.campaigns),influencers:arrToObj(DB.influencers),matches:arrToObj(DB.matches),progress:arrToObj(DB.progress),mcnRequests:arrToObj(DB.mcnRequests||[]),appMarketing:arrToObj(DB.appMarketing||[]),settlements:arrToObj(DB.settlements||[]),activities:arrToObj(DB.activities.slice(0,30)),comments:DB.comments,history:DB.history,_lastWriter:ME||ME_EMAIL,_lastWrite:Date.now()};
  var agencyLabels = mcnList.map(function(m){return m.agency;}).join(', ');
  (fbReady?fbRef.update(JSON.parse(JSON.stringify(payload))):Promise.resolve())
    .then(function(){ setTimeout(function(){_suppressListener=false;_myLastSaveCamps=null;},8000); renderAllPages(); showToast(agencyLabels+' MCN 요청 완료'); })
    .catch(function(){ _suppressListener=false; renderS4(); renderDash(); });
}


// ═══════════════════════════════════════
// 체크박스 선택 및 엑셀 다운로드
// ═══════════════════════════════════════

function toggleAllCheck(stage, checked){
  document.querySelectorAll('.row-chk[data-stage="'+stage+'"]').forEach(function(cb){ cb.checked = checked; });
}

function getCheckedIds(stage){
  var ids = [];
  document.querySelectorAll('.row-chk[data-stage="'+stage+'"]:checked').forEach(function(cb){
    ids.push(parseInt(cb.dataset.id));
  });
  return ids;
}

function exportExcelByStage(stage){
  var ids = getCheckedIds(stage);

  // 현재 화면에 보이는 캠페인 id 수집 (stage별 필터 적용)
  var visibleIds = [];
  document.querySelectorAll('.row-chk[data-stage="'+stage+'"]').forEach(function(cb){
    visibleIds.push(parseInt(cb.dataset.id));
  });

  var camps;
  if(ids.length > 0){
    // 체크된 것만
    camps = DB.campaigns.filter(function(c){ return ids.includes(c.id); });
  } else if(visibleIds.length > 0){
    // 아무것도 안 체크했으면 현재 화면 전체
    camps = DB.campaigns.filter(function(c){ return visibleIds.includes(c.id); });
  } else {
    camps = [];
  }
  if(!camps.length){ showToast('다운로드할 캠페인이 없습니다'); return; }

  if(stage === 's3'){
    exportS3ExcelFiltered(camps);
    return;
  }

  if(stage === 's7'){
    exportS7ExcelFiltered(camps);
    return;
  }

  // 일반 그리드 엑셀
  var headers, rows;
  if(stage==='s1'){
    headers = ['캠페인코드','캠페인명','MDCAT','역할','인플루언서규모','예상매출','시작일','종료일'];
    rows = camps.map(function(c){
      var mdcat = c.mdcat||(c.skus&&c.skus[0]?c.skus[0].mdcat:'')||'';
      var rev = c.revenue ? (c.revenue/100000000).toFixed(1)+'억' : '-';
      return [c.campCode||'', c.name, mdcat, c.role||'', c.infSize||'', rev, c.start||'', c.end||''];
    });
  } else if(stage==='s2'){
    headers = ['캠페인코드','캠페인명','MDCAT','역할','확정사유','인플루언서규모','예상매출','시작일','종료일'];
    rows = camps.map(function(c){
      var mdcat = c.mdcat||(c.skus&&c.skus[0]?c.skus[0].mdcat:'')||'';
      var rev = c.revenue ? (c.revenue/100000000).toFixed(1)+'억' : '-';
      return [c.campCode||'', c.name, mdcat, c.role||'', (c.reasons||[]).join(', '), c.infSize||'', rev, c.start||'', c.end||''];
    });
  } else if(stage==='s4'){
    headers = ['캠페인코드','캠페인명','MDCAT','역할','인플루언서규모','예상매출','MCN업체','인플루언서','시작일','종료일'];
    rows = camps.map(function(c){
      var mdcat = c.mdcat||(c.skus&&c.skus[0]?c.skus[0].mdcat:'')||'';
      var rev = c.revenue ? (c.revenue/100000000).toFixed(1)+'억' : '-';
      var mcnList = _mcnListFromCamp(c).filter(function(m){return m.agency;});
      var mcnStr = mcnList.map(function(m){return m.agency;}).join(' / ') || '-';
      var infStr = mcnList.map(function(m){return m.infName;}).filter(Boolean).join(' / ') || c.infName || '-';
      return [c.campCode||'', c.name, mdcat, c.role||'', c.infSize||'', rev, mcnStr, infStr, c.start||'', c.end||''];
    });
  } else if(stage==='s5'){
    headers = ['캠페인코드','캠페인명','MDCAT','역할','MCN업체','인플루언서','수수료율(%)','원고료(원)','시작일','종료일'];
    rows = camps.map(function(c){
      var mdcat = c.mdcat||(c.skus&&c.skus[0]?c.skus[0].mdcat:'')||'';
      var mcnList = _mcnListFromCamp(c).filter(function(m){return m.agency;});
      var mcnStr = mcnList.map(function(m){return m.agency;}).join(' / ') || c.mcn || '-';
      var infStr = mcnList.map(function(m){return m.infName;}).filter(Boolean).join(' / ') || c.infName || '-';
      return [c.campCode||'', c.name, mdcat, c.role||'', mcnStr, infStr, c.feeRate||'', c.feeAmount||'', c.start||'', c.end||''];
    });
  } else if(stage==='s7'){
    headers = ['캠페인코드','캠페인명','시작~종료일','MDCAT','캠페인규모','MCN업체','인플루언서','전체매출','전체비용','정산상태'];
    rows = camps.map(function(camp){
      var mdcat = camp.mdcat||(camp.skus&&camp.skus[0]?camp.skus[0].mdcat:'')||'';
      var rev = camp.settleRevenue || 0;
      var fr=parseFloat(camp.feeRate)||0, fa=parseInt(camp.feeAmount)||0;
      var ar=parseFloat(camp.agencyRate)||0, da=parseInt(camp.settleDa)||0;
      var cost=Math.round(rev*fr/100)+fa+Math.round(rev*ar/100)+da;
      var revStr = rev ? (rev/100000000).toFixed(1)+'억' : '-';
      var costStr = cost ? (cost/10000).toFixed(0)+'만' : '-';
      var status = camp.settleDone ? '정산완료' : '미확정';
      var mcnList2 = _mcnListFromCamp(camp).filter(function(m){return m.agency;});
      var mcnStr2 = mcnList2.map(function(m){return m.agency;}).join(' / ') || camp.mcn || '-';
      var infStr2 = mcnList2.map(function(m){return m.infName;}).filter(Boolean).join(' / ') || camp.infName || '-';
      return [camp.campCode||'', camp.name, (camp.start||'').slice(5)+' ~ '+(camp.end||'').slice(5), mdcat, camp.infSize||camp.role||'', mcnStr2, infStr2, revStr, costStr, status];
    });
  } else {
    showToast('지원하지 않는 단계입니다'); return;
  }

  var wb = XLSX.utils.book_new();
  var wsData = [headers].concat(rows);
  var ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = headers.map(function(){ return {wch:18}; });
  XLSX.utils.book_append_sheet(wb, ws, '캠페인목록');
  var stageNames = {s1:'1단계캠페인요청',s2:'2단계캠페인확정',s4:'4단계MCN요청',s5:'5단계인플루언서확정',s7:'7단계정산'};
  XLSX.writeFile(wb, (stageNames[stage]||stage)+'_'+new Date().toISOString().slice(0,10)+'.xlsx');
  showToast('엑셀 다운로드 완료 ('+(ids.length||'전체')+')');
}

// MCN 선택 엑셀 (시트 분리)
function exportS3ExcelFiltered(camps){
  if(!camps.length){ showToast('다운로드할 캠페인 없음'); return; }
  // 기존 exportS3Excel 로직 재활용 - camps 배열 직접 전달
  var wb = XLSX.utils.book_new();
  var C = { GRAY:'FFD9D9D9', BLUE:'FFDDE8F0', ORANGE:'FFFCE4D6', GREEN:'FFE2EFDA', PURPLE:'FFF0E6FF', WHITE:'FFFFFFFF', LINK:'FF0563C1' };
  var BD = {};
  var BORDER = {
    top:    {style:'thin', color:{rgb:'FFFFFFFF'}},
    bottom: {style:'thin', color:{rgb:'FFFFFFFF'}},
    left:   {style:'thin', color:{rgb:'FFFFFFFF'}},
    right:  {style:'thin', color:{rgb:'FFFFFFFF'}}
  };
  function cell(v,bg,bold,align,wrap,link){ var isNum=typeof v==='number'; var base={v:(v===null||v===undefined)?'':v,t:isNum?'n':'s',s:{font:{name:'맑은 고딕',sz:10,bold:!!bold,color:{rgb:link?C.LINK:'FF222222'},underline:!!link},fill:{patternType:'solid',fgColor:{rgb:bg||C.WHITE}},alignment:{horizontal:align||(isNum?'right':'left'),vertical:'center',wrapText:!!wrap},border:BORDER}}; if(link) base.l={Target:link}; return base; }
  function grp(v,bg){ return cell(v,bg,true,'center'); }
  function hdr(v,bg){ return cell(v,bg,true,'left'); }
  function dat(v){ var isNum=typeof v==='number'; return {v:(v===null||v===undefined)?'':v,t:isNum?'n':'s',s:{font:{name:'맑은 고딕',sz:10,color:{rgb:'FF222222'}},fill:{patternType:'solid',fgColor:{rgb:C.WHITE}},alignment:{horizontal:isNum?'right':'left',vertical:'center',wrapText:false},border:BORDER}}; }
  function num(v){ return {v:parseFloat(v)||0,t:'n',s:{font:{name:'맑은 고딕',sz:10,color:{rgb:'FF222222'}},fill:{patternType:'solid',fgColor:{rgb:C.WHITE}},alignment:{horizontal:'right',vertical:'center'},border:BORDER,numFmt:'#,##0'}}; }
  function empty(){ return {v:'',t:'s',s:{font:{name:'맑은 고딕',sz:10},fill:{patternType:'solid',fgColor:{rgb:C.WHITE}},border:BORDER}}; }

  camps.forEach(function(c, idx){
    var mainSku=(c.skus||[]).find(function(s){return s.isMain;})|| (c.skus&&c.skus[0])||{};
    var skuCode=mainSku.code||'', skuName=mainSku.productName||'', skuBrand=mainSku.brand||'', skuMdcat=mainSku.mdcat||'', skuCat=mainSku.cat||'';
    var codeNum=skuCode.replace(/[^0-9]/g,'').slice(0,8);
    var productUrl=codeNum?'https://m.shinsegaetvshopping.com/display/detail/'+codeNum:'';
    var TOTAL_ROWS=21, TOTAL_COLS=7, ws={}, merges=[];
    for(var r=0;r<TOTAL_ROWS;r++) for(var ci=0;ci<TOTAL_COLS;ci++) ws[String.fromCharCode(65+ci)+(r+1)]=empty();
    function S(r,c2,cellObj){ ws[String.fromCharCode(65+c2)+(r+1)]=cellObj; }
    function M(r1,c1,r2,c2){ merges.push({s:{r:r1,c:c1},e:{r:r2,c:c2}}); }
    S(0,0,grp('캠페인 정보',C.GRAY));S(0,1,grp('',C.GRAY));S(0,2,grp('',C.GRAY));S(0,3,grp('',C.GRAY));M(0,0,0,3);
    S(0,4,grp('상품 정보',C.BLUE));S(0,5,grp('',C.BLUE));S(0,6,grp('',C.BLUE));M(0,4,0,6);
    S(1,0,hdr('캠페인명',C.GRAY));S(1,1,hdr('예상매출(원)',C.GRAY));S(1,2,hdr('시작일',C.GRAY));S(1,3,hdr('종료일',C.GRAY));
    S(1,4,hdr('브랜드',C.BLUE));S(1,5,hdr('카테고리',C.BLUE));S(1,6,hdr('소구포인트',C.BLUE));
    S(2,0,dat(c.name||''));S(2,1,num(c.revenue||0));S(2,2,dat(c.start||''));S(2,3,dat(c.end||''));
    S(2,4,dat(c.brand||''));S(2,5,dat(c.cat||''));S(2,6,cell(c.appeal||'',C.WHITE,false,'left',true));
    S(8,0,grp('가격 정보',C.ORANGE));S(8,1,grp('',C.ORANGE));S(8,2,grp('',C.ORANGE));S(8,3,grp('',C.ORANGE));M(8,0,8,3);
    S(8,4,grp('MCN 정보',C.GREEN));S(8,5,grp('',C.GREEN));S(8,6,grp('',C.GREEN));M(8,4,8,6);
    S(9,0,hdr('프로모션',C.ORANGE));S(9,1,hdr('직접입력',C.ORANGE));S(9,2,hdr('시장가(원)',C.ORANGE));S(9,3,hdr('공구가격(원)',C.ORANGE));
    S(9,4,hdr('MCN업체',C.GREEN));S(9,5,hdr('인플루언서',C.GREEN));S(9,6,hdr('확정사유',C.GREEN));
    S(10,0,dat((c.promos||[]).join(', ')));S(10,1,dat(c.promoText||''));S(10,2,num(c.marketPrice||0));S(10,3,num(c.groupPrice||0));
    var _xl_mcnList = _mcnListFromCamp(c).filter(function(m){return m.agency;});
    var _xl_mcnStr = _xl_mcnList.map(function(m){return m.agency;}).join(' / ') || c.mcn || '';
    var _xl_infStr = _xl_mcnList.map(function(m){return m.infName;}).filter(Boolean).join(' / ') || c.infName || '';
    S(10,4,dat(_xl_mcnStr));S(10,5,dat(_xl_infStr));S(10,6,dat((c.reasons||[]).join(', ')));
    for(var ci2=0;ci2<TOTAL_COLS;ci2++) S(14,ci2,grp(ci2===0?'상품 코드 정보':'',C.PURPLE)); M(14,0,14,6);
    S(15,0,hdr('대표상품코드',C.PURPLE));S(15,1,hdr('상품명',C.PURPLE));S(15,2,hdr('브랜드',C.PURPLE));
    S(15,3,hdr('MDCAT',C.PURPLE));S(15,4,hdr('카테고리',C.PURPLE));S(15,5,hdr('상품URL',C.PURPLE));S(15,6,hdr('상품이미지',C.PURPLE));
    S(16,0,dat(skuCode));S(16,1,dat(skuName));S(16,2,dat(skuBrand));S(16,3,dat(skuMdcat));S(16,4,dat(skuCat));
    S(16,5,productUrl?cell(productUrl,C.WHITE,false,'left',false,productUrl):dat(''));S(16,6,dat(''));

    // ── 18행(index 17): CS/배송 정보 그룹헤더 ──
    for(var ci3=0;ci3<TOTAL_COLS;ci3++) S(17,ci3,grp(ci3===0?'CS 정보 / 배송 정보':'',C.GRAY)); M(17,0,17,6);
    // ── 19행(index 18): 컬럼헤더 ──
    S(18,0,hdr('CS 정보',C.GRAY)); M(18,0,18,3);
    S(18,4,hdr('배송 정보',C.BLUE)); M(18,4,18,6);
    // ── 20행(index 19): 데이터 ──
    S(19,0,cell(c.csInfo||'',C.WHITE,false,'left',true)); M(19,0,19,3);
    S(19,4,cell(c.deliveryInfo||'',C.WHITE,false,'left',true)); M(19,4,19,6);
    ws['!ref']='A1:G21'; ws['!cols']=[{wch:22},{wch:22},{wch:11},{wch:12},{wch:14},{wch:50},{wch:14}]; ws['!merges']=merges;
    ws['!rows']=(function(){ var h=[]; for(var ri=0;ri<TOTAL_ROWS;ri++){ if(ri===0||ri===8||ri===14||ri===17) h.push({hpt:20}); else if(ri===1||ri===9||ri===15||ri===18) h.push({hpt:17}); else if(ri===2||ri===10||ri===16||ri===19||ri===20) h.push({hpt:50}); else h.push({hpt:8}); } return h; })();
    var sheetName=(c.name||'캠페인'+(idx+1)).replace(/[\/\[\]\*\?:]/g,'').slice(0,26);
    // 시트명 중복 방지
    var finalName = sheetName;
    var dupIdx = 1;
    while(wb.SheetNames.includes(finalName)){ finalName = sheetName.slice(0,24)+'_'+dupIdx++; }
    XLSX.utils.book_append_sheet(wb, ws, finalName);
  });
  XLSX.writeFile(wb, 'MCN요청현황_'+new Date().toISOString().slice(0,10)+'.xlsx');
  showToast('엑셀 다운로드 완료 ('+camps.length+'건)');
}

// S3 엑셀 다운로드 (전체)
function exportS3Excel(){
  var confirmedCamps = DB.campaigns.filter(function(c){
    return c.stage==='2.캠페인확정'||c.stage==='4.MCN요청'||(c.reasons&&c.reasons.length>0);
  });
  if(!confirmedCamps.length){ showToast('다운로드할 캠페인 없음'); return; }

  var wb = XLSX.utils.book_new();

  // 색상 정의
  var C = { GRAY:'FFD9D9D9', BLUE:'FFDDE8F0', ORANGE:'FFFCE4D6', GREEN:'FFE2EFDA', PURPLE:'FFF0E6FF', WHITE:'FFFFFFFF', LINK:'FF0563C1' };
  var BD = {};
  var BORDER = {
    top:    {style:'thin', color:{rgb:'FFFFFFFF'}},
    bottom: {style:'thin', color:{rgb:'FFFFFFFF'}},
    left:   {style:'thin', color:{rgb:'FFFFFFFF'}},
    right:  {style:'thin', color:{rgb:'FFFFFFFF'}}
  };

  function cell(v, bg, bold, align, wrap, link){
    var isNum = typeof v === 'number';
    var base = {
      v: (v===null||v===undefined)?'':v,
      t: isNum?'n':'s',
      s: {
        font: {name:'맑은 고딕', sz:10, bold:!!bold, color:{rgb: link?C.LINK:'FF222222'}, underline:!!link},
        fill: {patternType:'solid', fgColor:{rgb:bg||C.WHITE}},
        alignment: {horizontal:align||(isNum?'right':'left'), vertical:'center', wrapText:!!wrap},
        border: BORDER
      }
    };
    if(link) base.l = {Target:link, Tooltip:'클릭하여 상품 페이지 열기'};
    return base;
  }
  function grp(v,bg){ return cell(v,bg,true,'center'); }
  function hdr(v,bg){ return cell(v,bg,true,'left'); }
  function dat(v){
    var isNum = typeof v==='number';
    return {v:(v===null||v===undefined)?'':v, t:isNum?'n':'s',
      s:{font:{name:'맑은 고딕',sz:10,color:{rgb:'FF222222'}},
         fill:{patternType:'solid',fgColor:{rgb:C.WHITE}},
         alignment:{horizontal:isNum?'right':'left',vertical:'center',wrapText:false},border:BORDER}};
  }
  function num(v){
    var n = parseFloat(v)||0;
    return {
      v: n, t:'n',
      s:{
        font:{name:'맑은 고딕',sz:10,color:{rgb:'FF222222'}},
        fill:{patternType:'solid',fgColor:{rgb:C.WHITE}},
        alignment:{horizontal:'right',vertical:'center'},
        border:BORDER,
        numFmt:'#,##0'
      }
    };
  }
  function empty(){   return {v:'',t:'s',s:{font:{name:'맑은 고딕',sz:10},fill:{patternType:'solid',fgColor:{rgb:C.WHITE}}}}; }

  confirmedCamps.forEach(function(c, idx){
    // 대표 상품코드
    var mainSku = (c.skus||[]).find(function(s){return s.isMain;}) || (c.skus&&c.skus[0]) || {};
    var skuCode  = mainSku.code||'';
    var skuName  = mainSku.productName||'';
    var skuBrand = mainSku.brand||'';
    var skuMdcat = mainSku.mdcat||'';
    var skuCat   = mainSku.cat||'';
    var codeNum  = skuCode.replace(/[^0-9]/g,'').slice(0,8);
    var productUrl = codeNum ? 'https://m.shinsegaetvshopping.com/display/detail/'+codeNum : '';

    // 7컬럼 (A~G), 행 번호는 0-based
    // 레이아웃:
    //  Row 0  : 캠페인 정보(A~D 병합) | 상품 정보(E~G 병합)
    //  Row 1  : 컬럼헤더
    //  Row 2  : 데이터
    //  Row 3  : (빈줄)
    //  Row 4  : (빈줄)
    //  Row 5  : (빈줄)
    //  Row 6  : (빈줄)
    //  Row 7  : (빈줄)  ← 9행 = index 8
    //  Row 8  : 가격 정보(A~D 병합) | MCN 정보(E~G 병합)
    //  Row 9  : 컬럼헤더
    //  Row 10 : 데이터
    //  Row 11 : (빈줄)
    //  Row 12 : (빈줄)
    //  Row 13 : (빈줄)
    //  Row 14 : 상품 코드 정보(A~G 병합)  ← 15행 = index 14
    //  Row 15 : 컬럼헤더
    //  Row 16 : 데이터

    var TOTAL_ROWS = 21;
    var TOTAL_COLS = 7;
    var ws = {};
    var merges = [];

    // 빈 행 채우기
    for(var r=0;r<TOTAL_ROWS;r++){
      for(var ci=0;ci<TOTAL_COLS;ci++){
        var ref = String.fromCharCode(65+ci)+(r+1);
        ws[ref] = empty();
      }
    }

    function S(r,c2,cellObj){ ws[String.fromCharCode(65+c2)+(r+1)] = cellObj; }
    function M(r1,c1,r2,c2){ merges.push({s:{r:r1,c:c1},e:{r:r2,c:c2}}); }

    // ── 1행: 캠페인 정보 + 상품 정보 그룹헤더 ──
    S(0,0,grp('캠페인 정보',C.GRAY)); S(0,1,grp('',C.GRAY)); S(0,2,grp('',C.GRAY)); S(0,3,grp('',C.GRAY)); M(0,0,0,3);
    S(0,4,grp('상품 정보',C.BLUE));   S(0,5,grp('',C.BLUE)); S(0,6,grp('',C.BLUE)); M(0,4,0,6);

    // ── 2행: 컬럼헤더 ──
    S(1,0,hdr('캠페인명',C.GRAY)); S(1,1,hdr('예상매출(원)',C.GRAY)); S(1,2,hdr('시작일',C.GRAY)); S(1,3,hdr('종료일',C.GRAY));
    S(1,4,hdr('브랜드',C.BLUE));   S(1,5,hdr('카테고리',C.BLUE));    S(1,6,hdr('소구포인트',C.BLUE));

    // ── 3행: 데이터 ──
    S(2,0,dat(c.name||'')); S(2,1,num(c.revenue||0)); S(2,2,dat(c.start||c.startDate||'')); S(2,3,dat(c.end||c.endDate||''));
    S(2,4,dat(c.brand||'')); S(2,5,dat(c.cat||'')); S(2,6,cell(c.appeal||'',C.WHITE,false,'left',true));

    // ── 9행(index 8): 가격 정보 + MCN 정보 그룹헤더 ──
    S(8,0,grp('가격 정보',C.ORANGE)); S(8,1,grp('',C.ORANGE)); S(8,2,grp('',C.ORANGE)); S(8,3,grp('',C.ORANGE)); M(8,0,8,3);
    S(8,4,grp('MCN 정보',C.GREEN));   S(8,5,grp('',C.GREEN));  S(8,6,grp('',C.GREEN));  M(8,4,8,6);

    // ── 10행(index 9): 컬럼헤더 ──
    S(9,0,hdr('프로모션',C.ORANGE)); S(9,1,hdr('직접입력',C.ORANGE)); S(9,2,hdr('시장가(원)',C.ORANGE)); S(9,3,hdr('공구가격(원)',C.ORANGE));
    S(9,4,hdr('MCN업체',C.GREEN));   S(9,5,hdr('인플루언서',C.GREEN)); S(9,6,hdr('확정사유',C.GREEN));

    // ── 11행(index 10): 데이터 ──
    S(10,0,dat((c.promos||[]).join(', '))); S(10,1,dat(c.promoText||'')); S(10,2,num(c.marketPrice||0)); S(10,3,num(c.groupPrice||0));
    var _xl_mcnList2 = _mcnListFromCamp(c).filter(function(m){return m.agency;});
    S(10,4,dat(_xl_mcnList2.map(function(m){return m.agency;}).join(' / ')||c.mcn||'')); S(10,5,dat(_xl_mcnList2.map(function(m){return m.infName;}).filter(Boolean).join(' / ')||c.infName||'')); S(10,6,dat((c.reasons||[]).join(', ')));

    // ── 15행(index 14): 상품 코드 정보 그룹헤더 ──
    for(var ci2=0;ci2<TOTAL_COLS;ci2++) S(14,ci2,grp(ci2===0?'상품 코드 정보':'',C.PURPLE));
    M(14,0,14,6);

    // ── 16행(index 15): 컬럼헤더 ──
    S(15,0,hdr('대표상품코드',C.PURPLE)); S(15,1,hdr('상품명',C.PURPLE));   S(15,2,hdr('브랜드',C.PURPLE));
    S(15,3,hdr('MDCAT',C.PURPLE));        S(15,4,hdr('카테고리',C.PURPLE)); S(15,5,hdr('상품URL',C.PURPLE)); S(15,6,hdr('상품이미지',C.PURPLE));

    // ── 17행(index 16): 데이터 ──
    S(16,0,dat(skuCode)); S(16,1,dat(skuName)); S(16,2,dat(skuBrand));
    S(16,3,dat(skuMdcat)); S(16,4,dat(skuCat));
    S(16,5, productUrl ? cell(productUrl,C.WHITE,false,'left',false,productUrl) : dat(''));
    S(16,6,dat(''));

    // ref, 컬럼 너비, 병합, 행 높이
    ws['!ref']    = 'A1:G21';
    ws['!cols']   = [{wch:22},{wch:22},{wch:11},{wch:12},{wch:14},{wch:50},{wch:14}];
    ws['!merges'] = merges;
    ws['!rows']   = (function(){
      var h=[];
      for(var ri=0;ri<TOTAL_ROWS;ri++){
        if(ri===0||ri===8||ri===14)      h.push({hpt:20}); // 그룹헤더
        else if(ri===1||ri===9||ri===15) h.push({hpt:17}); // 컬럼헤더
        else if(ri===2||ri===10||ri===16)h.push({hpt:40}); // 데이터
        else                             h.push({hpt:8});  // 빈줄
      }
      return h;
    })();

    var sheetName = (c.name||'캠페인'+(idx+1)).replace(/[\/\[\]\*\?:]/g,'').slice(0,26);
    var finalName2 = sheetName;
    var dupIdx2 = 1;
    while(wb.SheetNames.includes(finalName2)){ finalName2 = sheetName.slice(0,24)+'_'+dupIdx2++; }
    XLSX.utils.book_append_sheet(wb, ws, finalName2);
  });

  XLSX.writeFile(wb, 'MCN요청현황_'+new Date().toISOString().slice(0,10)+'.xlsx');
  showToast('엑셀 다운로드 완료');
}

function saveMcnRequest(){} // legacy - 더 이상 사용 안 함
function delMcn(id){ var nid2=parseInt(id); DB.mcnRequests=DB.mcnRequests.filter(function(r){return parseInt(r.id)!==nid2;}); broadcastData(); renderS4(); showToast('삭제됨'); }

// ═══════════════════════════════════════
// S4: 인플루언서확정 + 매칭
// ═══════════════════════════════════════
function renderS5(){
  // 3단계 MCN요청 완료된 캠페인만 표시
  var s4OwnerFilter = (document.getElementById('sf-s5-owner')?.value||'').trim();
  var s4MdFilter    = (document.getElementById('sf-s5-md')?.value||'').trim();
  var mcnCamps = DB.campaigns.filter(function(c){
    if(!matchesDashMode(c)) return false;
    if(pageFilter.s5 !== 'target' && !matchesDateFilter(c,'s4')) return false;
    // external_mcn: 본인 MCN 업체 캠페인만 + 4단계만
    if(isExtMcn()){
      if(c.stage !== '5.인플루언서확정') return false;
      return campHasMcn(c, ME_MCN_COMPANY);
    }
    if(s4OwnerFilter && !(c.pdSingle||c.pds&&c.pds[0]||'').includes(s4OwnerFilter)) return false;
    if(s4MdFilter    && !(c.owner||'').includes(s4MdFilter))    return false;
    if(isMyOnlyFilter('s5') && !isMycamp(c)) return false;
    if(pageFilter.s5==='target') return c.stage==='5.인플루언서확정';
    return c.stage==='4.MCN요청' || c.stage==='5.인플루언서확정';
  });

  var rows = '';
  // 페이징 처리
  var _pg_s5 = _getPagedItems(mcnCamps, 's5');
  _pg_s5.items.forEach(function(c, _pi){
    var rowNum = _pg_s5.startIdx + _pi + 1;
    var mdcatVal  = c.mdcat||(c.skus&&c.skus[0]?c.skus[0].mdcat:'')||'-';
    var roleColor = c.role==='메가'?'var(--pink)':c.role==='앵콜'?'var(--orange)':c.role==='미들'?'var(--blue)':c.role==='시딩'?'var(--green)':'var(--text3)';
    var roleBg    = c.role==='메가'?'var(--pink-bg)':c.role==='앵콜'?'var(--orange-bg)':c.role==='미들'?'var(--blue-bg)':c.role==='시딩'?'var(--green-bg)':'var(--bg4)';
    var revStr = '-';
    if(c.revenue){ var u=c.revenue/100000000; revStr=u>=0.1?u.toFixed(1)+'억':(c.revenue/10000).toFixed(0)+'만'; }
    var infName = c.infName && c.infName.trim() ? c.infName : '미정';
    var infConfirmed = c.stage==='5.인플루언서확정';
    var isUnset = !c.infName || !c.infName.trim();
    var needsSample = c.stage==='5.인플루언서확정' && !c.sampleSent;

    rows += '<tr onclick="editProd('+c.id+')" style="cursor:pointer">'+'<td style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);width:36px">'+rowNum+'</td>'
      +'<td onclick="event.stopPropagation()"><input type="checkbox" class="row-chk" data-id="'+c.id+'" data-stage="s5" style="cursor:pointer"></td>'
      +'<td class="mob-hide" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap">'+displayCampCode(c)+'</td>'
      +'<td style="white-space:normal;min-width:80px;max-width:150px"><strong>'+c.name+'</strong>'
      +(c.stage==='5.인플루언서확정' && !c.sampleSent?'<br><span style="font-size:10px;color:var(--orange);font-weight:700">📦 샘플발송 필요</span>':c.stage==='5.인플루언서확정'?'<br><span style="font-size:10px;color:var(--green)">✓ 인플루언서 확정</span>':'')+'</td>'
      +'<td style="color:var(--text3);font-size:12px;font-family:monospace">'+mdcatVal+'</td>'
      +'<td>'+(c.role?'<span style="background:'+roleBg+';color:'+roleColor+';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">'+c.role+'</span>':'-')+'</td>'
      +'<td style="color:var(--text2);font-size:12.5px">'+(c.infSize||'-')+'</td>'
      +'<td style="font-weight:700;color:var(--green)">'+revStr+'</td>'
      +'<td style="color:var(--text2)">'+(c.mcn||'-')+'</td>'
      +'<td>'+(isUnset
        ?'<span style="color:var(--text3);font-size:12px">미정</span>'
        :'<span style="color:var(--text);font-size:12.5px">'+c.infName+'</span>')+'</td>'
      +'<td style="color:var(--text3);font-size:12px">'+(_dashMode==='mlive'?fmtBroadcastDt(c):((c.start||c.startDate||'-').slice(5)))+'</td>'
      +(_dashMode!=='mlive'?'<td style="color:var(--text3);font-size:12px">'+((c.end||c.endDate||'-').slice(5))+'</td>':'')
      +'<td><div class="row-acts" style="opacity:1">'
      +(isExtMcn()
        ? '<button class="btn btn-primary btn-xs" onclick="event.stopPropagation();editProdS4('+c.id+')">✏️ 인플루언서 확정</button>'
        : (canEdit()
          ? '<button class="btn btn-xs" onclick="event.stopPropagation();editProdS4('+c.id+')" style="background:var(--green);color:#fff;border:1px solid var(--green);border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:600">👤 인플루언서등록</button>'
          : '<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd('+c.id+')">👁 상세</button>'))
      +'</div></td>'
      +'</tr>';
  });
  
  _renderPagination('s4-pagination', mcnCamps.length, 's5', 'renderS5()');
  document.getElementById('s4-tbl').innerHTML = rows ||
    '<tr><td colspan="12" class="empty" style="padding:28px;text-align:center;color:var(--text3)">3단계 MCN요청 완료된 캠페인이 없습니다</td></tr>';
}

// 4단계 인플루언서 등록 팝업
function editProdS4(campId){
  var c = DB.campaigns.find(function(x){return x.id===campId;}); if(!c) return;
  var existing = document.getElementById('s4-edit-modal');
  if(existing) existing.remove();

  var el = document.createElement('div');
  el.id = 's4-edit-modal';
  el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.25);z-index:99999;display:flex;align-items:center;justify-content:center';

  var box = document.createElement('div');
  box.style.cssText = 'background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r-lg);padding:28px 32px;min-width:380px;max-width:480px;width:92%';

  // 타이틀
  var ttl = document.createElement('div');
  ttl.style.cssText = 'font-size:15px;font-weight:800;margin-bottom:4px';
  ttl.textContent = '인플루언서 확정';
  box.appendChild(ttl);
  var sub = document.createElement('div');
  sub.style.cssText = 'font-size:12px;color:var(--text3);margin-bottom:20px';
  sub.textContent = c.name;
  box.appendChild(sub);

  // 인플루언서 이름
  var fr1 = document.createElement('div');
  fr1.className = 'fr'; fr1.style.marginBottom = '12px';
  fr1.innerHTML = '<label>인플루언서 <span style="color:var(--red)">*</span></label>'
    + '<input class="inp" id="s4-inf-name" placeholder="인플루언서 이름 또는 채널명">';
  box.appendChild(fr1);

  // 수수료율 / 원고료
  var fr2 = document.createElement('div');
  fr2.className = 'fr2'; fr2.style.marginBottom = '8px';
  fr2.innerHTML = '<div><label>수수료율 (%)</label><input class="inp" id="s4-fee-rate" type="number" step="0.1" placeholder="예) 15"></div>'
    + '<div><label>원고료 (원)</label><input class="inp" id="s4-fee-amount" type="number" placeholder="예) 500000"></div>';
  box.appendChild(fr2);

  var hint = document.createElement('div');
  hint.style.cssText = 'font-size:11px;color:var(--text3);margin-bottom:20px';
  hint.textContent = '※ 수수료율 또는 원고료 중 하나는 반드시 입력해야 저장됩니다';
  box.appendChild(hint);

  // 버튼
  var btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:10px;justify-content:flex-end';
  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-ghost'; cancelBtn.textContent = '취소';
  cancelBtn.onclick = function(){ el.remove(); };
  var saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary'; saveBtn.textContent = '저장 · 인플루언서 확정';
  saveBtn.onclick = function(){ saveS4Inf(campId); };
  btns.appendChild(cancelBtn); btns.appendChild(saveBtn);
  box.appendChild(btns);

  el.appendChild(box);
  document.body.appendChild(el);
  // 외부 클릭으로 닫기 비활성화

  // 기존 값 세팅
  setTimeout(function(){
    var ni = document.getElementById('s4-inf-name');
    var fr = document.getElementById('s4-fee-rate');
    var fa = document.getElementById('s4-fee-amount');
    if(ni) ni.value = c.infName||'';
    if(fr) fr.value = c.feeRate||'';
    if(fa) fa.value = c.feeAmount||'';
    if(ni) ni.focus();
  }, 50);
}

function saveS4Inf(campId){
  var infName   = (document.getElementById('s4-inf-name')?.value||'').trim();
  var feeRate   = document.getElementById('s4-fee-rate')?.value;
  var feeAmount = document.getElementById('s4-fee-amount')?.value;

  var missing = [];
  if(!infName) missing.push('인플루언서 이름');
  if(!feeRate && !feeAmount) missing.push('수수료율 또는 원고료 (하나 이상 필수)');
  if(missing.length){ showValidationModal(missing); return; }

  var idx = DB.campaigns.findIndex(function(c){return c.id===campId;});
  if(idx===-1) return;
  // 이미 상위 단계(6.APP마케팅확정 이상)면 stage를 되돌리지 않음
  var oldStage2 = DB.campaigns[idx].stage || '1.캠페인요청';
  var higherThan5 = ['6.APP마케팅확정','7.정산','7.정산완료'];
  var newStage5 = higherThan5.includes(oldStage2) ? oldStage2 : '5.인플루언서확정';
  DB.campaigns[idx] = Object.assign({}, DB.campaigns[idx], {
    infName:    infName,
    feeRate:    feeRate||DB.campaigns[idx].feeRate,
    feeAmount:  feeAmount||DB.campaigns[idx].feeAmount,
    stage:      newStage5
  });
  _myLastSaveTime = Date.now();
  _myLastSaveCamps = [DB.campaigns[idx]];
  document.getElementById('s4-edit-modal').remove();

  _suppressListener = true;
  var payload={products:arrToObj(DB.products),campaigns:arrToObj(DB.campaigns),influencers:arrToObj(DB.influencers),matches:arrToObj(DB.matches),progress:arrToObj(DB.progress),mcnRequests:arrToObj(DB.mcnRequests||[]),appMarketing:arrToObj(DB.appMarketing||[]),settlements:arrToObj(DB.settlements||[]),activities:arrToObj(DB.activities.slice(0,30)),comments:DB.comments,history:DB.history,_lastWriter:ME||ME_EMAIL,_lastWrite:Date.now()};
  (fbReady?fbRef.update(JSON.parse(JSON.stringify(payload))):Promise.resolve())
    .then(function(){ setTimeout(function(){_suppressListener=false;_myLastSaveCamps=null;},8000); renderAllPages(); showToast(infName+' 인플루언서 확정 완료'); })
    .catch(function(){ _suppressListener=false; renderS5(); renderDash(); });
}

function approveMatch(id){
  var m=DB.matches.find(x=>x.id===id); if(!m) return;
  m.status='승인';
  var inf=getInf(m.inf),camp=getCamp(m.campaign);
  addAct('✅',`${inf.name} × ${camp.name} 매칭 승인`,nowStr(),ME);
  addNotif('✅',`${inf.name} × ${camp.name} 매칭 승인됨`,'방금 전');
  broadcastData(); renderAllPages(); showToast(`${inf.name} 매칭 승인됨`);
}
function rejectMatch(id){
  var m=DB.matches.find(x=>x.id===id); if(!m) return;
  m.status='거절';
  broadcastData(); renderS5(); updateBadges();
}
function addMatch(){
  var campId=parseInt(v('mc-camp')), infId=parseInt(v('mc-inf')), prodId=parseInt(v('mc-prod'));
  var owner=v('mc-owner'), memo=v('mc-memo');
  DB.matches.push({id:nid.matches++,inf:infId,campaign:campId,product:prodId,owner,status:'승인대기',date:today(),memo});
  document.getElementById('mc-memo').value='';
  addAct('🔗',`${getInf(infId).name} × ${getCamp(campId).name} 매칭 요청`,nowStr(),ME);
  addNotif('🔗',`${getInf(infId).name} — 승인 대기`,'방금 전');
  broadcastData(); closeMo('matching'); renderS5(); updateBadges(); showToast('매칭 요청 생성됨');
}

// ═══════════════════════════════════════
// S5: APP마케팅
// ═══════════════════════════════════════
function renderS6(){
  var _s6th=document.querySelector('#page-s6 thead');
  if(_s6th&&_dashMode==='mlive') _s6th.innerHTML=_mliveHeaders.s6;
  var infCamps = DB.campaigns.filter(function(c){
    if(!matchesDashMode(c)) return false;
    if(pageFilter.s6 !== 'target' && !matchesDateFilter(c,'s5')) return false;
    var _nf=(document.getElementById('sf-s5-name')?.value||'').trim().toLowerCase();
    if(_nf && !(c.name||'').toLowerCase().includes(_nf)) return false;
    var nameF  = (document.getElementById('sf-s6-name')?.value||'').trim().toLowerCase();
  var ownerF = (document.getElementById('sf-s6-owner')?.value||'').trim();
    var mdF_s5 = (document.getElementById('sf-s6-md')?.value||'').trim();
    if(ownerF && !(c.pdSingle||c.pds&&c.pds[0]||'').includes(ownerF)) return false;
    if(mdF_s5  && !(c.owner||'').includes(mdF_s5))  return false;
    if(isMyOnlyFilter('s6') && !isMycamp(c)) return false;
    // appMkt.channels: Firebase에서 object로 올 수 있으므로 정규화
    if(c.appMkt && c.appMkt.channels && !Array.isArray(c.appMkt.channels)){
      c.appMkt.channels = Object.values(c.appMkt.channels);
    }
    var hasAppCh = !!(c.appMkt && c.appMkt.channels && c.appMkt.channels.length > 0);
    // 확정대상: APP마케팅 채널 미등록인 5단계 캠페인
    if(pageFilter.s6==='target') return c.stage==='6.APP마케팅확정' && !hasAppCh;
    // 전체보기: 5단계(인플루언서확정) + 6단계(APP마케팅확정)
    return c.stage==='5.인플루언서확정' || c.stage==='6.APP마케팅확정';
  });
  var rows='';
  // 페이징 처리
  var _pg_s6 = _getPagedItems(infCamps, 's6');
  _pg_s6.items.forEach(function(c, _pi){
    var rowNum = _pg_s6.startIdx + _pi + 1;
    if(_dashMode==='mlive'){ rows+=mliveStageRow('s6',c,rowNum); return; }
    var mdcatVal = c.mdcat||(c.skus&&c.skus[0]?c.skus[0].mdcat:'')||'-';
    var revStr='-';
    if(c.revenue){ var u=c.revenue/100000000; revStr=u>=0.1?u.toFixed(1)+'억':(c.revenue/10000).toFixed(0)+'만'; }
    var appMkt = c.appMkt||{};
    // appMkt.channels가 Firebase object로 올 경우 배열로 변환
    if(appMkt.channels && !Array.isArray(appMkt.channels)){
      appMkt.channels = Object.values(appMkt.channels);
    }
    var hasApp = !!(appMkt.channels && appMkt.channels.length > 0);
    var appDisplay = hasApp
      ? appMkt.channels.map(function(ch){
          return '<span style="background:var(--blue-bg);color:var(--blue);padding:1px 6px;border-radius:10px;font-size:10.5px;margin-right:3px">'+ch+'</span>';
        }).join('')
      : '<span style="color:var(--text3);font-size:12px">미등록</span>';

    rows+='<tr onclick="editProd('+c.id+')" style="cursor:pointer">'+'<td style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);width:36px">'+rowNum+'</td>'
      +'<td class="mob-hide" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap">'+displayCampCode(c)+'</td>'
      +'<td style="white-space:normal;min-width:80px;max-width:150px"><strong>'+c.name+'</strong>'+(hasApp?'<br><span style="font-size:10px;color:var(--blue)">✓ APP MKT 확정</span>':'<br><span style="font-size:10px;color:var(--orange)">📱 APP MKT 미등록</span>')+'</td>'
      +'<td style="color:var(--text3);font-size:12px;font-family:monospace">'+mdcatVal+'</td>'
      +'<td style="color:var(--text2);font-size:12.5px">'+(c.infSize||'-')+'</td>'
      +'<td style="color:var(--text2)">'+(c.infName||'미정')+'</td>'
      +'<td style="font-weight:700;color:var(--green)">'+revStr+'</td>'
      +'<td style="text-align:center">'
      +(hasApp?'<span style="color:var(--green);font-size:16px">✓</span>':'<span style="color:var(--text3);font-size:16px">○</span>')
      +'</td>'
      +'<td><div class="row-acts" style="opacity:1">'
      +(c.stage!=='6.APP마케팅확정'?'<button class="btn btn-xs" onclick="event.stopPropagation();openAppMktEdit('+c.id+')" style="background:var(--green);color:#fff;border:1px solid var(--green);border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:600">📱 APP마케팅등록</button>':'<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();openAppMktEdit('+c.id+')">✏️ 수정</button>')
      +'</div></td>'
      +'</tr>';
  });
  
  _renderPagination('s5-pagination', infCamps.length, 's6', 'renderS6()');
  document.getElementById('s5-tbl').innerHTML=rows||'<tr><td colspan="8" class="empty" style="padding:28px;text-align:center;color:var(--text3)">4단계 인플루언서 확정된 캠페인이 없습니다</td></tr>';
}

// APP MKT 정보 등록 팝업 (3/4단계 스타일)
function openAppMktEdit(campId){
  var c = DB.campaigns.find(function(x){return x.id===campId;}); if(!c) return;
  var appMkt = c.appMkt||{};
  var existing = document.getElementById('appmkt-modal');
  if(existing) existing.remove();

  var el = document.createElement('div');
  el.id = 'appmkt-modal';
  el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.25);z-index:99999;display:flex;align-items:center;justify-content:center';

  var box = document.createElement('div');
  box.style.cssText = 'background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r-lg);padding:28px 32px;min-width:400px;max-width:520px;width:92%;max-height:85vh;overflow-y:auto';

  var ttl = document.createElement('div');
  ttl.style.cssText = 'font-size:15px;font-weight:800;margin-bottom:4px';
  ttl.textContent = 'APP 마케팅 정보 등록';
  box.appendChild(ttl);
  var sub = document.createElement('div');
  sub.style.cssText = 'font-size:12px;color:var(--text3);margin-bottom:20px';
  sub.textContent = c.name;
  box.appendChild(sub);

  var CHANNELS = ['슈퍼브랜드','모바일라이브','팝업','최상단배너','PUSH','카톡플친'];
  var checked = appMkt.channels||[];

  // 채널 체크박스
  var lbl = document.createElement('div');
  lbl.style.cssText = 'font-size:11px;font-weight:700;color:var(--text3);margin-bottom:8px';
  lbl.textContent = '마케팅 채널 선택';
  box.appendChild(lbl);

  var cbWrap = document.createElement('div');
  cbWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px';
  CHANNELS.forEach(function(ch){
    var lbEl = document.createElement('label');
    lbEl.className = 'promo-label';
    var cbEl = document.createElement('input');
    cbEl.type = 'checkbox'; cbEl.value = ch; cbEl.className = 'modal-appmkt-cb';
    cbEl.checked = checked.includes(ch);
    cbEl.style.cssText = 'accent-color:var(--accent);width:14px;height:14px;cursor:pointer';
    cbEl.onchange = function(){ toggleModalAppFields(); };
    lbEl.appendChild(cbEl);
    lbEl.appendChild(document.createTextNode(' '+ch));
    cbWrap.appendChild(lbEl);
  });
  box.appendChild(cbWrap);

  // 슈퍼브랜드 날짜
  var superDiv = document.createElement('div');
  superDiv.id = 'modal-super-fields';
  superDiv.style.cssText = 'display:'+(checked.includes('슈퍼브랜드')?'grid':'none')+';grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px';
  superDiv.innerHTML = '<div><label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">슈퍼브랜드 시작일 <span style="color:var(--red)">*</span></label>'
    + '<input class="inp" id="modal-super-start" type="date" value="'+(appMkt.superStart||'')+'"></div>'
    + '<div><label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">슈퍼브랜드 종료일 <span style="color:var(--red)">*</span></label>'
    + '<input class="inp" id="modal-super-end" type="date" value="'+(appMkt.superEnd||'')+'"></div>';
  box.appendChild(superDiv);

  // 모바일라이브 방송일시
  var liveDiv = document.createElement('div');
  liveDiv.id = 'modal-live-fields';
  liveDiv.style.cssText = 'display:'+(checked.includes('모바일라이브')?'block':'none')+';margin-bottom:12px';
  liveDiv.innerHTML = '<label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">모바일라이브 방송일시 <span style="color:var(--red)">*</span></label>'
    + '<input class="inp" id="modal-live-dt" type="datetime-local" value="'+(appMkt.liveDt||'')+'" style="margin-bottom:8px">'
    + '<label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">모바일라이브 편성코드</label>'
    + '<input class="inp" id="modal-live-code" placeholder="예: 202602022467" value="'+(appMkt.liveCode||'')+'">';
  box.appendChild(liveDiv);

  // 버튼
  var btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:8px';
  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-ghost'; cancelBtn.textContent = '취소';
  cancelBtn.onclick = function(){ el.remove(); };
  var saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary'; saveBtn.textContent = '저장 · APP MKT 확정';
  saveBtn.onclick = function(){ saveAppMktEdit(campId); };
  btns.appendChild(cancelBtn); btns.appendChild(saveBtn);
  box.appendChild(btns);

  el.appendChild(box);
  document.body.appendChild(el);
  // 외부 클릭으로 닫기 비활성화
}

function toggleModalAppFields(){
  var cbs = [...document.querySelectorAll('.modal-appmkt-cb:checked')].map(function(cb){return cb.value;});
  var sf = document.getElementById('modal-super-fields');
  var lf = document.getElementById('modal-live-fields');
  if(sf) sf.style.display = cbs.includes('슈퍼브랜드')?'grid':'none';
  if(lf) lf.style.display = cbs.includes('모바일라이브')?'block':'none';
}

function saveAppMktEdit(campId){
  var channels = [...document.querySelectorAll('.modal-appmkt-cb:checked')].map(function(cb){return cb.value;});
  var superStart = document.getElementById('modal-super-start')?.value||'';
  var superEnd   = document.getElementById('modal-super-end')?.value||'';
  var liveDt     = document.getElementById('modal-live-dt')?.value||'';
  var liveCode   = document.getElementById('modal-live-code')?.value.trim()||'';

  var missing = [];
  if(channels.includes('슈퍼브랜드')&&!superStart) missing.push('슈퍼브랜드 시작일');
  if(channels.includes('슈퍼브랜드')&&!superEnd)   missing.push('슈퍼브랜드 종료일');
  if(channels.includes('모바일라이브')&&!liveDt)    missing.push('모바일라이브 방송일시');
  if(missing.length){ showValidationModal(missing); return; }

  var idx = DB.campaigns.findIndex(function(c){return c.id===campId;});
  if(idx===-1) return;
  DB.campaigns[idx] = Object.assign({}, DB.campaigns[idx], {
    appMkt: {channels:channels, superStart:superStart, superEnd:superEnd, liveDt:liveDt, liveCode:liveCode},
    stage: channels.length>0 ? '6.APP마케팅확정' : DB.campaigns[idx].stage
  });
  document.getElementById('appmkt-modal').remove();
  _suppressListener=true;
  var payload={products:arrToObj(DB.products),campaigns:arrToObj(DB.campaigns),influencers:arrToObj(DB.influencers),matches:arrToObj(DB.matches),progress:arrToObj(DB.progress),mcnRequests:arrToObj(DB.mcnRequests||[]),appMarketing:arrToObj(DB.appMarketing||[]),settlements:arrToObj(DB.settlements||[]),activities:arrToObj(DB.activities.slice(0,30)),comments:DB.comments,history:DB.history,_lastWriter:ME||ME_EMAIL,_lastWrite:Date.now()};
  (fbReady?fbRef.update(JSON.parse(JSON.stringify(payload))):Promise.resolve())
    .then(function(){ _myLastSaveTime=Date.now(); setTimeout(function(){_suppressListener=false;_myLastSaveCamps=null;},8000); renderS6(); renderDash(); updateBadges(); showToast('APP MKT 확정 완료'); })
    .catch(function(){ renderS6(); renderDash(); });
}

// APP MKT 조건부 필드 토글

// 트위터 링크 실시간 업데이트
function updateTwitterLink(input, n){ updateChannelLink(input,'twitter',n); }

function updateChannelLink(input, type, n){
  var val = (input.value||'').trim().replace('@','');
  var linkEl = input.parentNode.querySelector('.inf-'+({'youtube':'yt','insta':'ig','twitter':'tw'}[type])+'-link-'+n);
  if(!linkEl) return;
  var baseUrl = {youtube:'https://youtube.com/@', insta:'https://instagram.com/', twitter:'https://x.com/'}[type];
  linkEl.style.display = val ? 'inline' : 'none';
  linkEl.href = val ? baseUrl + val : '#';
}

function toggleChannelFields(){
  var yt = document.getElementById('ch-youtube')?.checked;
  var ig = document.getElementById('ch-insta')?.checked;
  var ytf = document.getElementById('ch-youtube-field');
  var igf = document.getElementById('ch-insta-field');
  if(ytf) ytf.style.display = yt ? 'block' : 'none';
  if(igf) igf.style.display = ig ? 'block' : 'none';
  if(!yt){ var el=document.getElementById('p-youtube-ch'); if(el) el.value=''; var l=document.getElementById('p-youtube-link'); if(l) l.style.display='none'; }
  if(!ig){ var el2=document.getElementById('p-insta-ch');  if(el2) el2.value=''; var l2=document.getElementById('p-insta-link'); if(l2) l2.style.display='none'; }
}

function updateChannelPreview(type){
  if(type==='youtube'){
    var val = (document.getElementById('p-youtube-ch')?.value||'').trim().replace('@','');
    var lnk = document.getElementById('p-youtube-link');
    if(lnk){ lnk.style.display = val?'inline':'none'; lnk.href = val?('https://www.youtube.com/@'+val):'#'; lnk.textContent='🔗 채널 열기'; }
  } else {
    var val2 = (document.getElementById('p-insta-ch')?.value||'').trim().replace('@','');
    var lnk2 = document.getElementById('p-insta-link');
    if(lnk2){ lnk2.style.display = val2?'inline':'none'; lnk2.href = val2?('https://www.instagram.com/'+val2):'#'; lnk2.textContent='🔗 채널 열기'; }
  }
}

// 해당없음 체크 시 채널 영역 비활성화
function toggleAppMktNa(){
  var na = document.getElementById('appmkt-na')?.checked;
  var area = document.getElementById('appmkt-channels-area');
  if(na){
    document.querySelectorAll('.appmkt-cb').forEach(function(cb){ cb.checked=false; });
    // 모든 인라인 입력 비활성 + 초기화
    document.querySelectorAll('#appmkt-channels-area input:not([type="checkbox"])').forEach(function(inp){ inp.disabled=true; inp.value=''; });
    if(area) area.style.opacity='0.35';
    if(area) area.style.pointerEvents='none';
    var lsb=document.getElementById('appmkt-live-code-search-btn'); if(lsb) lsb.style.display='none';
  } else {
    if(area) area.style.opacity='';
    if(area) area.style.pointerEvents='';
  }
}

function toggleAppMktFields(){
  // 채널별 체크 상태 → 인라인 입력 활성/비활성
  var pairs = [
    ['appmkt-super',     ['appmkt-super-start','appmkt-super-end']],
    ['appmkt-live',      ['appmkt-live-code','appmkt-live-dt']],
    ['appmkt-dmp',       ['appmkt-dmp-send']],
    ['appmkt-push',      ['appmkt-push-send']],
    ['appmkt-kakao',     ['appmkt-kakao-send']],
    ['appmkt-ssg',       ['appmkt-ssg-amount','appmkt-ssg-count']],
    ['appmkt-starbucks', ['appmkt-starbucks-count']],
    ['appmkt-etc',       ['appmkt-etc-text']],
  ];
  pairs.forEach(function(p){
    var cb = document.getElementById(p[0]);
    var checked = cb && cb.checked;
    p[1].forEach(function(inpId){
      var inp = document.getElementById(inpId);
      if(inp){
        inp.disabled = !checked;
        if(!checked) inp.value = '';
      }
    });
  });
  // 모바일라이브 검색 + 추가 + 바로가기 버튼 표시
  var liveChecked = document.getElementById('appmkt-live')?.checked;
  var liveSearchBtn = document.getElementById('appmkt-live-code-search-btn');
  var liveAddBtn    = document.getElementById('appmkt-live-code-add-btn');
  var liveGotoBtn   = document.getElementById('appmkt-live-goto-inf-btn');
  if(liveSearchBtn) liveSearchBtn.style.display = liveChecked ? '' : 'none';
  if(liveAddBtn)    liveAddBtn.style.display    = liveChecked ? '' : 'none';
  if(liveGotoBtn)   liveGotoBtn.style.display   = liveChecked ? '' : 'none';
  if(!liveChecked){ _mliveCodes=[]; renderMliveCodeTags(); }
  // PUSH 체크 → APP PUSH 섹션 표시
  updatePushSectionVisibility();
  // 편성코드 변경 시 전체매출 라벨 갱신
  updateTotalRevLabel();
}
// APP PUSH 섹션 표시: M라이브 + PUSH 체크 둘 다일 때만
function updatePushSectionVisibility(){
  var isMlive = getCampType()==='모바일라이브';
  var pushChecked = document.getElementById('appmkt-push')?.checked;
  var pushWrap = document.getElementById('sec-push-wrap');
  if(pushWrap) pushWrap.style.display = (isMlive && pushChecked) ? '' : 'none';
}

function delApp(id){ var nid2=parseInt(id); DB.appMarketing=DB.appMarketing.filter(function(a){return parseInt(a.id)!==nid2;}); broadcastData(); renderS6(); showToast('삭제됨'); }

// ═══════════════════════════════════════
// S6: 정산
// ═══════════════════════════════════════
function renderS7(){
  console.log('[renderS7] pageFilter.s7:', pageFilter.s7, 'dateFilter.s7:', JSON.stringify(dateFilter.s7));
  var setts=DB.settlements||[];
  var s7OwnerFilter = (document.getElementById('sf-s7-owner')?.value||'').trim();
  var s7MdFilter    = (document.getElementById('sf-s7-md')?.value||'').trim();
  var s7SettleFrom  = (document.getElementById('sf-s7-settle-from')?.value||'').trim(); // YYYY-MM
  var s7SettleTo    = (document.getElementById('sf-s7-settle-to')?.value||'').trim();   // YYYY-MM
  function _matchesSettleDate(c){
    if(pageFilter.s7 === 'target') return true; // 확정대상 모드엔 적용 안 함
    if(!s7SettleFrom && !s7SettleTo) return true; // 입력 없으면 전체
    var sd0 = (c.settleData && c.settleData[0]) ? c.settleData[0] : {};
    var sdDate = (sd0.settleDate || '').slice(0, 7); // YYYY-MM
    if(s7SettleFrom && (!sdDate || sdDate < s7SettleFrom)) return false;
    if(s7SettleTo   && (!sdDate || sdDate > s7SettleTo))   return false;
    return true;
  }
  var validCampIds = DB.campaigns.filter(function(c){
    if(!matchesDashMode(c)) return false;
    if(pageFilter.s7 !== 'target' && !matchesDateFilter(c,'s7')) return false;
    if(!_matchesSettleDate(c)) return false;
    var _nf=(document.getElementById('sf-s7-name')?.value||'').trim().toLowerCase();
    if(_nf && !(c.name||'').toLowerCase().includes(_nf)) return false;
    if(isExtMcn()){
      return campHasMcn(c, ME_MCN_COMPANY) &&
        (c.stage==='6.APP마케팅확정'||c.stage==='7.정산'||c.stage==='7.정산완료');
    }
    if(s7OwnerFilter && !(c.pdSingle||c.pds&&c.pds[0]||'').toLowerCase().includes(s7OwnerFilter.toLowerCase())) return false;
    if(s7MdFilter    && !(c.owner||'').toLowerCase().includes(s7MdFilter.toLowerCase())) return false;
    if(isMyOnlyFilter('s7') && !isMycamp(c)) return false;
    if(pageFilter.s7==='target') return c.stage==='6.APP마케팅확정' || (c.stage==='7.정산' && !c.settleDone);
    return c.stage==='6.APP마케팅확정'||c.stage==='7.정산'||c.stage==='7.정산완료';
  }).map(function(c){return c.id;});
  var filteredSetts = setts.filter(function(s){ return validCampIds.includes(s.campaign); });
  var total=filteredSetts.reduce(function(s,x){return s+(x.revenue||0);},0);
  var infFee=filteredSetts.reduce(function(s,x){return s+(x.infFee||0);},0);
  var agFee=filteredSetts.reduce(function(s,x){return s+(x.agencyFee||0);},0);
  var daFee=filteredSetts.reduce(function(s,x){return s+(x.daFee||0);},0);
  var rows='';
  // 캠페인별 직접 표시 (정산 데이터 없어도 랜딩URL 있는 캠페인은 표시)
  // validCampIds 방식 대신 직접 필터 (id includes 비교 문제 회피)
  var campList = DB.campaigns.filter(function(c){
    if(!matchesDashMode(c)) return false;
    if(pageFilter.s7 !== 'target' && !matchesDateFilter(c,'s7')) return false;
    if(!_matchesSettleDate(c)) return false;
    var _nf2=(document.getElementById('sf-s7-name')?.value||'').trim().toLowerCase();
    if(_nf2 && !(c.name||'').toLowerCase().includes(_nf2)) return false;
    if(s7OwnerFilter && !(c.pdSingle||c.pds&&c.pds[0]||'').toLowerCase().includes(s7OwnerFilter.toLowerCase())) return false;
    if(s7MdFilter    && !(c.owner||'').toLowerCase().includes(s7MdFilter.toLowerCase())) return false;
    if(isMyOnlyFilter('s7') && !isMycamp(c)) return false;
    if(pageFilter.s7==='target') return c.stage==='6.APP마케팅확정' || (c.stage==='7.정산' && !c.settleDone);
    return c.stage==='6.APP마케팅확정'||c.stage==='7.정산'||c.stage==='7.정산완료';
  });
  console.log('[renderS7] campList:', campList.length);
  // 동적 헤더 (인플루언서 vs 모바일라이브)
  var _s7Mlive = _dashMode==='mlive';
  var s7thead = document.getElementById('s7-thead');
  if(s7thead){
    if(_s7Mlive){
      s7thead.innerHTML = '<tr><th style="width:36px;text-align:center">#</th><th style="width:32px"><input type="checkbox" id="chk-all-s7" onchange="toggleAllCheck(\'s7\',this.checked)" style="cursor:pointer"></th><th>주차</th><th>방송일시</th><th>편성코드</th><th>라이브명</th><th>담당MD</th><th>전체매출</th><th>주문건수</th><th>한계이익</th><th>시청자</th><th>광고비</th><th>광고수익</th><th>정산상태</th><th style="width:99vw;background:var(--bg)"></th></tr>';
    } else {
      s7thead.innerHTML = '<tr><th style="width:36px;text-align:center">#</th><th style="width:32px"><input type="checkbox" id="chk-all-s7" onchange="toggleAllCheck(\'s7\',this.checked)" style="cursor:pointer"></th><th>캠페인코드</th><th style="width:22%;min-width:130px">캠페인명</th><th>시작~종료일</th><th style="width:9%;min-width:70px">MDCAT</th><th>규모</th><th>MCN</th><th>인플루언서</th><th>전체매출</th><th>주문건수</th><th>전체비용</th><th>정산상태</th><th style="width:99vw;background:var(--bg)"></th></tr>';
    }
  }
  // 페이징 처리
  var _pg_s7 = _getPagedItems(campList, 's7');
  _pg_s7.items.forEach(function(camp, _pi7){
    var rowNum = _pg_s7.startIdx + _pi7 + 1;
    var campSetts = setts.filter(function(s){ return s.campaign===camp.id; });
    var mdcatVal = camp.mdcat||(camp.skus&&camp.skus[0]?camp.skus[0].mdcat:'')||'-';
    var dateStr = ((camp.start||'-').slice(5))+' ~ '+((camp.end||'-').slice(5));
    var settleStatus = camp.settleDone ? '정산완료' : '미확정';
    var statusBadge = badge(settleStatus);

    if(_s7Mlive){
      // ── M-live 정산 행
      var totalRev   = camp.totalRevenue||camp.revenue||0;
      var orderQty   = camp.mliveOrderQty||0;
      var profitAmt  = camp.mliveProfitAmt||0;
      var viewers    = camp.mliveViewers||0;
      var daFee      = camp.settleDa||0;
      var adIncome   = camp.adIncome||0;
      var fmtK = function(n){ return n ? (n>=100000000?(n/100000000).toFixed(1)+'억':n>=10000?Math.round(n/10000).toLocaleString()+'만':n.toLocaleString()) : '-'; };
      rows += '<tr style="cursor:pointer" onclick="editProd('+camp.id+')">'
        +'<td style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);width:36px">'+rowNum+'</td>'
        +'<td onclick="event.stopPropagation()"><input type="checkbox" class="row-chk" data-id="'+camp.id+'" data-stage="s7" style="cursor:pointer"></td>'
        +'<td style="font-size:11px;color:var(--accent2);font-weight:700;white-space:nowrap">'+getWeekLabel(camp)+'</td>'
        +'<td style="font-size:12px;color:var(--text3);white-space:nowrap">'+fmtBroadcastDt(camp)+'</td>'
        +'<td class="mob-hide" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap">'+displayCampCode(camp)+'</td>'
        +'<td style="font-weight:600">'+escHtml(camp.name)+'</td>'
        +'<td style="color:var(--text2)">'+escHtml(camp.owner||'-')+'</td>'
        +'<td style="font-weight:700;color:var(--green)">'+fmtK(totalRev)+'</td>'
        +'<td style="color:var(--text2)">'+(orderQty?orderQty.toLocaleString()+'건':'-')+'</td>'
        +'<td style="font-weight:600;color:'+(profitAmt>=0?'var(--blue)':'var(--red)')+'">'+fmtK(profitAmt)+'</td>'
        +'<td style="color:var(--text2)">'+(viewers?viewers.toLocaleString()+'명':'-')+'</td>'
        +'<td style="font-weight:600;color:var(--blue)">'+fmtK(daFee)+'</td>'
        +'<td style="font-weight:600;color:var(--orange)">'+fmtK(adIncome)+'</td>'
        +'<td>'+statusBadge+'</td>'
        +'<td><div class="row-acts">'
        +(canEdit()&&!isExtMcn()?'<button class="btn btn-primary btn-xs" onclick="editProd('+camp.id+')">수정</button>':'<span style="font-size:11px;color:var(--text3)">조회전용</span>')
        +'</div></td></tr>';
    } else {
      // ── 인플루언서 정산 행 (기존)
      var infList = camp.infData && camp.infData.length > 0 ? camp.infData : [{
        infName: camp.infName||'-', mcn: camp.mcn||'', infSize: camp.infSize||camp.role||'',
        feeRate: camp.feeRate||0, feeAmount: camp.feeAmount||0, agencyRate: camp.agencyRate||0
      }];
      var settleList = camp.settleData && camp.settleData.length > 0 ? camp.settleData : [{
        revenue: camp.settleRevenue||0, orders: camp.settleOrders||0
      }];
      var da = camp.settleDa || 0;
      var rowspan = infList.length;

      infList.forEach(function(inf, infIdx){
        var sd = settleList[infIdx] || {};
        var rev = sd.revenue || 0;
        // 전체 비용 = 세금계산서 공급가액(부가세별도) — commFeeVat 기준 재계산으로 단수 오차 방지
        var _gCF2    = Math.round((sd.commFeeVat||0) / 1.1);
        var totalCost = _gCF2 + (sd.fixedFee||0) + (sd.metaFee||0);
        var revStr  = rev  ? rev.toLocaleString()+'원'       : '-';
        var costStr = totalCost ? totalCost.toLocaleString()+'원' : '-';
        var ordStr  = sd.orders ? sd.orders+'건' : '-';
        var infSize = inf.infSize || '-';

        if(infIdx === 0){
          rows += '<tr style="cursor:pointer" onclick="editProd('+camp.id+')">'
        + '<td style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);width:36px" rowspan="'+rowspan+'">'+rowNum+'</td>'
            +'<td rowspan="'+rowspan+'" onclick="event.stopPropagation()"><input type="checkbox" class="row-chk" data-id="'+camp.id+'" data-stage="s7" style="cursor:pointer"></td>'
            +'<td class="mob-hide" rowspan="'+rowspan+'" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap;vertical-align:top;padding-top:10px">'+displayCampCode(camp)+'</td>'
            +'<td rowspan="'+rowspan+'" style="font-weight:600;vertical-align:top;padding-top:10px">'
              +'<div>'+camp.name+'</div>'
              +(rowspan>1?'<div style="font-size:10px;color:var(--accent);margin-top:3px;font-weight:700">👥 인플루언서 '+rowspan+'명</div>':'')
            +'</td>'
            +'<td rowspan="'+rowspan+'" style="font-size:12px;color:var(--text3);vertical-align:top;padding-top:10px">'+dateStr+'</td>'
            +'<td rowspan="'+rowspan+'" style="font-size:12px;font-family:monospace;color:var(--text3);vertical-align:top;padding-top:10px">'+mdcatVal+'</td>';
        } else {
          rows += '<tr style="border-top:1px dashed var(--border)">';
        }

        rows += '<td style="font-size:12px">'+(infSize!=='-'?'<span style="background:var(--bg3);padding:1px 6px;border-radius:10px;font-size:11px">'+infSize+'</span>':'-')+'</td>'
          +'<td style="font-size:12px;color:var(--text2)">'+(inf.mcn||'-')+'</td>'
          +'<td style="font-size:12px;font-weight:600">'+(inf.infName||'-')+'</td>'
          +'<td style="font-weight:700;color:var(--green)">'+revStr+'</td>'
          +'<td style="font-size:11px;color:var(--text3)">'+ordStr+'</td>'
          +'<td style="font-weight:700;color:var(--orange);text-align:left">'+costStr+'</td>';

        if(infIdx === 0){
          rows += '<td rowspan="'+rowspan+'">'+ statusBadge +'</td>'
            +'<td rowspan="'+rowspan+'"><div class="row-acts">'
            +(canEdit() && !isExtMcn() ? '<button class="btn btn-primary btn-xs" onclick="editProd('+camp.id+')">수정</button>' : '<span style="font-size:11px;color:var(--text3)">조회전용</span>')
            +'</div></td>';
        }
        rows += '</tr>';
      });
    }
  });
  _renderPagination('s6-pagination', campList.length, 's7', 'renderS7()');
  var s7ColSpan = _s7Mlive ? 11 : 14;
  document.getElementById('s6-tbl').innerHTML=rows||'<tr><td colspan="'+s7ColSpan+'" class="empty">정산 대상 캠페인 없음</td></tr>';
}

function openSettleByCamp(campId){
  openMo('settlement');
  setTimeout(function(){
    var sel = document.getElementById('st-camp');
    if(sel){ sel.value = campId; }
  }, 50);
}
function saveSettlement(){
  DB.settlements=DB.settlements||[];
  var id=DB.settlements.length?Math.max(...DB.settlements.map(s=>s.id))+1:1;
  DB.settlements.push({id,campaign:parseInt(v('st-camp')),inf:parseInt(v('st-inf')),revenue:iv('st-revenue'),infFee:iv('st-inf-fee'),agencyFee:iv('st-agency-fee'),daFee:iv('st-da-fee'),status:v('st-status'),memo:v('st-memo')});
  broadcastData(); closeMo('settlement'); renderS7(); showToast('정산 등록됨');
}
function delSettle(id){ var nid2=parseInt(id); DB.settlements=DB.settlements.filter(function(s){return parseInt(s.id)!==nid2;}); broadcastData(); renderS7(); showToast('삭제됨'); }

// ═══════════════════════════════════════
// CAMPAIGNS (전체 목록)
// ═══════════════════════════════════════
let campView='list';
function switchCampView(v2,el){
  campView=v2;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el?.classList.add('active');
  document.getElementById('camp-list').style.display=v2==='list'?'':'none';
  document.getElementById('camp-kanban').style.display=v2==='kanban'?'':'none';
  // 칸반 모드에서는 기간/단계/담당 필터 숨기기
  var filterBar = document.querySelector('#page-campaigns .filter-bar');
  if(filterBar){
    filterBar.querySelectorAll('.date-filter, .stage-filter').forEach(function(el){
      el.style.display = v2==='kanban' ? 'none' : '';
    });
    // 캠페인명 + 조회 + 탭은 유지
  }
  if(v2==='kanban') renderKanban();
}
// ── 공통 페이징 헬퍼 ──
var _pageSize = 30; // 모든 단계 공통 페이지당 건수
var _pageState = {s1:1, s2:1, s3:1, s4:1, s5:1, s6:1, s7:1, camp:1};

function _renderPagination(pgDivId, total, pageKey, renderFn){
  var pgEl = document.getElementById(pgDivId);
  if(!pgEl) return;
  var totalPg = Math.max(1, Math.ceil(total / _pageSize));
  window['_totalPg_'+pageKey] = totalPg;
  if(totalPg <= 1){ pgEl.innerHTML=''; return; }
  var bs = 'background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-sm);padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit;color:var(--text2)';
  var as = 'background:var(--accent);border:1px solid var(--accent);border-radius:var(--r-sm);padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit;color:#fff;font-weight:700';
  var cur = _pageState[pageKey]||1;
  var h = '<button style="'+bs+'"'+(cur===1?' disabled':'')+' onclick="_pageState.'+pageKey+'=Math.max(1,(_pageState.'+pageKey+'||1)-1);'+renderFn+'">← 이전</button>';
  var ps=Math.max(1,cur-3), pe=Math.min(totalPg,ps+6);
  if(pe-ps<6) ps=Math.max(1,pe-6);
  for(var pi=ps;pi<=pe;pi++) h+='<button style="'+(pi===cur?as:bs)+'" onclick="_pageState.'+pageKey+'='+pi+';'+renderFn+'">'+pi+'</button>';
  h+='<button style="'+bs+'"'+(cur===totalPg?' disabled':'')+' onclick="_pageState.'+pageKey+'=Math.min('+(window['_totalPg_'+pageKey]||totalPg)+',(_pageState.'+pageKey+'||1)+1);'+renderFn+'">다음 →</button>';
  h+='<span style="font-size:12px;color:var(--text3);margin-left:4px">'+cur+'/'+totalPg+'페이지</span>';
  pgEl.innerHTML=h;
}

function _getPagedItems(arr, pageKey){
  var cur = _pageState[pageKey]||1;
  var totalPg = Math.max(1,Math.ceil(arr.length/_pageSize));
  if(cur>totalPg){ _pageState[pageKey]=totalPg; cur=totalPg; }
  var start=(cur-1)*_pageSize;
  return {items: arr.slice(start,start+_pageSize), startIdx: start};
}

var _campPage = 1;
var _campPageSize = 30;
var _campTypeFilter = '인플루언서'; // 전체 캠페인 조회 유형 필터

function _renderCampPagination(total){
  var pgEl = document.getElementById('camp-pagination');
  if(!pgEl) return;
  var totalPg = Math.max(1, Math.ceil(total / _campPageSize));
  window._campTotalPg = totalPg;
  if(totalPg <= 1){ pgEl.innerHTML=''; return; }
  var bs = 'background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-sm);padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit;color:var(--text2)';
  var as = 'background:var(--accent);border:1px solid var(--accent);border-radius:var(--r-sm);padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit;color:#fff;font-weight:700';
  var h = '<button style="'+bs+'"'+(_campPage===1?' disabled':'')+' onclick="_campPage=Math.max(1,_campPage-1);renderCamps()">← 이전</button>';
  var ps=Math.max(1,_campPage-3), pe=Math.min(totalPg,ps+6);
  if(pe-ps<6) ps=Math.max(1,pe-6);
  for(var pi=ps;pi<=pe;pi++) h+='<button style="'+(pi===_campPage?as:bs)+'" onclick="_campPage='+pi+';renderCamps()">'+pi+'</button>';
  h+='<button style="'+bs+'"'+(_campPage===_campTotalPg?' disabled':'')+' onclick="_campPage=Math.min(_campTotalPg,_campPage+1);renderCamps()">다음 →</button>';
  h+='<span style="font-size:12px;color:var(--text3);margin-left:4px">'+_campPage+'/'+totalPg+'페이지</span>';
  pgEl.innerHTML=h;
}

function renderCamps(){
  console.log('[renderCamps] DB.campaigns:', DB.campaigns.length, 'filtered:', DB.campaigns.filter(function(c){return c.name&&c.name.trim();}).length);
  // MCN 드롭다운 동적 채우기
  var mcnSel = document.getElementById('sf-camp-mcn');
  if(mcnSel){
    var curMcn = mcnSel.value;
    var mcnSet = {};
    DB.campaigns.forEach(function(c){ if(c.mcn) mcnSet[c.mcn.trim()]=true; });
    var opts = '<option value="">전체</option>';
    Object.keys(mcnSet).sort().forEach(function(m){ opts+='<option value="'+escHtml(m)+'"'+(curMcn===m?' selected':'')+'>'+escHtml(m)+'</option>'; });
    mcnSel.innerHTML = opts;
  }
  // 주차 드롭다운 동적 채우기 (모바일라이브 탭일 때)
  var weekSel = document.getElementById('sf-camp-week');
  var weekWrap = document.getElementById('sf-camp-week-wrap');
  if(weekWrap) weekWrap.style.display = (_campTypeFilter==='모바일라이브') ? '' : 'none';
  if(weekSel && _campTypeFilter==='모바일라이브'){
    var curWeek = weekSel.value;
    var weekSet = {};
    DB.campaigns.forEach(function(c){
      if((c.campType||'')!=='모바일라이브') return;
      var wl = getWeekLabel(c);
      if(wl && wl!=='-') weekSet[wl]=true;
    });
    var wOpts = '<option value="">전체</option>';
    Object.keys(weekSet).sort().forEach(function(w){ wOpts+='<option value="'+escHtml(w)+'"'+(curWeek===w?' selected':'')+'>'+escHtml(w)+'</option>'; });
    weekSel.innerHTML = wOpts;
  }
  var stageFilter = (document.getElementById('sf-camp-stage')?.value||'').trim();
  var campNameF   = (document.getElementById('sf-camp-name')?.value||'').trim().toLowerCase();
  var ownerFilter = (document.getElementById('sf-camp-owner')?.value||'').trim().toLowerCase();
  var mdFilter    = (document.getElementById('sf-camp-md')?.value||'').trim().toLowerCase();
  var mcnFilter   = (document.getElementById('sf-camp-mcn')?.value||'').trim().toLowerCase();
  var weekFilter  = (document.getElementById('sf-camp-week')?.value||'').trim();
  var dateFrom    = document.getElementById('df-camp-from')?.value||'';
  var dateTo      = document.getElementById('df-camp-to')?.value||'';
  var myOnly      = document.getElementById('my-only-camp')?.checked;

  // 날짜필터 dateFilter 동기화
  if(dateFrom) dateFilter.camp = dateFilter.camp || {};
  dateFilter.camp = {from: dateFrom, to: dateTo};

  var filtered = DB.campaigns.filter(function(c){
    if(!c.name || !c.name.trim()) return false;
    // 캠페인 유형 필터 (인플루언서 / 모바일라이브)
    if(_campTypeFilter){
      var ct = c.campType || '인플루언서';
      if(ct !== _campTypeFilter) return false;
    }
    if(ME_ROLE === 'md' && !isMycamp(c)) return false;
    if(campNameF   && !(c.name||'').toLowerCase().includes(campNameF)) return false;
    if(stageFilter && c.stage !== stageFilter) return false;
    if(ownerFilter && !(c.pdSingle||c.pds&&c.pds[0]||'').toLowerCase().includes(ownerFilter)) return false;
    if(mdFilter    && !(c.owner||'').toLowerCase().includes(mdFilter)) return false;
    if(mcnFilter   && !(c.mcn||'').toLowerCase().includes(mcnFilter)) return false;
    if(weekFilter  && getWeekLabel(c)!==weekFilter) return false;
    if(myOnly && !isMycamp(c)) return false;
    if(dateFrom || dateTo){
      var cStart = (c.start||c.startDate||'').slice(0,7);
      var cEnd   = (c.end  ||c.endDate  ||'').slice(0,7);
      if(dateFrom && cEnd   && cEnd   < dateFrom) return false;
      if(dateTo   && cStart && cStart > dateTo)   return false;
    }
    return true;
  });

  var countEl = document.getElementById('camp-count');
  if(countEl) countEl.textContent = '총 '+filtered.length+'건'+(ME_ROLE==='md' ? ' (본인 담당)' : '');

  // 페이징
  var totalPg2 = Math.max(1, Math.ceil(filtered.length / _campPageSize));
  if(_campPage > totalPg2) _campPage = totalPg2;
  var startIdx = (_campPage-1)*_campPageSize;
  var paged = filtered.slice(startIdx, startIdx+_campPageSize);

  // 동적 헤더 (인플루언서 vs 모바일라이브)
  var isMliveTab = _campTypeFilter === '모바일라이브';
  var thead = document.getElementById('camp-thead');
  if(thead){
    if(isMliveTab){
      thead.innerHTML = '<tr><th style="width:36px;text-align:center">#</th><th>주차</th><th>방송일시</th><th style="width:100px" class="mob-hide">편성코드</th><th>방송구분</th><th style="width:22%;min-width:130px">캠페인명</th><th>담당MD</th><th style="width:9%;min-width:75px">예상매출</th><th>단계</th><th>인플마케팅</th><th style="background:var(--bg)"></th></tr>';
    } else {
      thead.innerHTML = '<tr><th style="width:36px;text-align:center">#</th><th style="width:100px" class="mob-hide">캠페인코드</th><th style="width:22%;min-width:130px">캠페인명</th><th>기간</th><th>캠페인담당</th><th style="width:9%;min-width:75px">예상매출</th><th>단계</th><th>인플루언서</th><th class="mob-hide">M라이브</th><th style="background:var(--bg)"></th></tr>';
    }
  }

  var rows='';
  paged.forEach(function(c, i){
    var rowNum = startIdx + i + 1;
    var col=stageColor(c.stage);
    var mdNm = c.owner||'';
    var revStr = c.revenue ? (c.revenue/100000000).toFixed(1)+'억' : '-';
    var pdName = c.pdSingle||(c.pds&&c.pds[0])||'-';
    var infCount = (c.infData&&c.infData.length>0) ? c.infData.filter(function(d){return d.infName;}).length : (c.infName?1:0);
    var hasMlive = c.appMkt && c.appMkt.channels && c.appMkt.channels.indexOf('모바일라이브')>=0;
    var hasInfMkt = c.appMkt && c.appMkt.channels && c.appMkt.channels.some(function(ch){return ch!=='모바일라이브';});

    if(isMliveTab){
      // M-live tab: 주차, 방송일시, 편성코드, 캠페인명, 담당MD, 매출, 단계, 인플마케팅
      var liveCode = (c.appMkt&&c.appMkt.liveCode)||'-';
      var infMktBadge = hasInfMkt ? '<span style="background:var(--green-bg);color:var(--green);padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">👤 진행</span>' : '-';
      var _weekLabel = getWeekLabel(c);
      var _isRebroadcast = (c.name||'').indexOf('다시보는')>=0;
      var _bcTypeBadge = _isRebroadcast
        ? '<span style="background:var(--orange-bg);color:var(--orange);padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">재방</span>'
        : '<span style="background:var(--blue-bg);color:var(--blue);padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">본방</span>';
      rows += '<tr onclick="editProd('+c.id+')">'
        + '<td style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);width:36px">'+rowNum+'</td>'
        + '<td style="font-size:11px;color:var(--accent2);font-weight:700;white-space:nowrap">'+_weekLabel+'</td>'
        + '<td style="font-size:12px;color:var(--text3);white-space:nowrap">'+fmtBroadcastDt(c)+'</td>'
        + '<td class="mob-hide" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap">'+escHtml(liveCode)+'</td>'
        + '<td style="text-align:center">'+_bcTypeBadge+'</td>'
        + '<td><strong>'+escHtml(c.name)+'</strong></td>'
        + '<td style="color:var(--text2)">'+escHtml(mdNm||'-')+'</td>'
        + '<td style="font-weight:700;color:var(--green)">'+revStr+'</td>'
        + '<td><span style="background:'+stageBg(c.stage)+';color:'+col+';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">'+c.stage+'</span></td>'
        + '<td style="text-align:center">'+infMktBadge+'</td>'
        + '<td><div class="row-acts">'
    } else {
      // 인플루언서 tab: 기존 구조
      rows += '<tr onclick="editProd('+c.id+')">'
        + '<td style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);width:36px">'+rowNum+'</td>'
        + '<td class="mob-hide" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap">'+escHtml(displayCampCode(c))+'</td>'
        + '<td><strong>'+escHtml(c.name)+'</strong><br><span style="font-size:11px;color:var(--text3)">'+(mdNm?'MD:'+mdNm:'')+'</span></td>'
        + '<td style="font-size:12px;color:var(--text3)">'+(c.start||'').slice(5)+'~'+(c.end||'').slice(5)+'</td>'
        + '<td style="color:var(--text2)">'+pdName+'</td>'
        + '<td style="font-weight:700;color:var(--green)">'+revStr+'</td>'
        + '<td><span style="background:'+stageBg(c.stage)+';color:'+col+';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">'+c.stage+'</span></td>'
        + '<td style="color:var(--text2)">'+infCount+'명</td>'
        + '<td class="mob-hide" style="text-align:center">'+(hasMlive ? '<span style="background:var(--accent-bg);color:var(--accent2);padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">📺</span>' : '-')+'</td>'
        + '<td><div class="row-acts">'
    }
    rows += '<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd('+c.id+')">✏️ 수정</button>'
      + (canEdit() && !isExtMcn() ? '<select class="sel inp-sm" style="width:150px" onchange="changeCampStage('+c.id+',this.value)" onclick="event.stopPropagation()">'
          + STAGES.map(function(s){ return '<option'+(c.stage===s.name?' selected':'')+'>'+s.name+'</option>'; }).join('')
          + '</select>' : '')
      + (isAdmin() ? '<button class="btn btn-danger btn-xs" onclick="event.stopPropagation();delCamp('+c.id+')">삭제</button>' : '')
      + '</div></td>'
      + '</tr>';
  });
  console.log('[renderCamps] rows length:', rows.length, 'paged:', paged.length);
  var campTbl = document.getElementById('camp-tbl');
  if(campTbl){
    campTbl.innerHTML=rows||'<tr><td colspan="'+(isMliveTab?11:10)+'" class="empty">캠페인 없음</td></tr>';
  }
  _renderCampPagination(filtered.length);
}
function filterCamps(v2){
  var sel = document.getElementById('sf-camp-stage');
  if(sel) sel.value = v2||'';
  renderCamps();
}
function clearCampFilter(){
  ['sf-camp-stage','sf-camp-owner','sf-camp-md','sf-camp-mcn','sf-camp-week','sf-camp-name','df-camp-from','df-camp-to'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  var ck=document.getElementById('my-only-camp'); if(ck) ck.checked=false;
  renderCamps();
}
function closeDetail(){ /* noop */ }

function initKanbanMonthPicker(){
  var picker = document.getElementById('kanban-month-picker');
  if(!picker || picker.children.length > 0) return;
  var now = new Date();
  var cy = now.getFullYear(), cm = now.getMonth();
  for(var i = -3; i <= 9; i++){
    var d = new Date(cy, cm + i, 1);
    var y = d.getFullYear(), m = d.getMonth()+1;
    var ym = y+'-'+String(m).padStart(2,'0');
    var label = y === cy ? m+'월' : y+'.'+ m;
    var sel = (i === 0);
    var btn = document.createElement('button');
    btn.dataset.ym = ym;
    btn.textContent = label;
    btn.dataset.sel = sel ? '1' : '0';
    btn.style.cssText = 'padding:4px 10px;font-size:12px;border-radius:20px;cursor:pointer;transition:all .15s;border:1px solid '+(sel?'var(--accent)':'var(--border)')+';background:'+(sel?'var(--accent)':'var(--bg3)')+';color:'+(sel?'#fff':'var(--text2)')+';';
    btn.onclick = function(){
      var on = this.dataset.sel === '1';
      this.dataset.sel = on ? '0' : '1';
      this.style.borderColor = on ? 'var(--border)' : 'var(--accent)';
      this.style.background  = on ? 'var(--bg3)'    : 'var(--accent)';
      this.style.color       = on ? 'var(--text2)'  : '#fff';
    };
    picker.appendChild(btn);
  }
}

function getSelectedKanbanMonths(){
  var months = [];
  document.querySelectorAll('#kanban-month-picker button').forEach(function(btn){
    if(btn.dataset.sel === '1') months.push(btn.dataset.ym);
  });
  if(!months.length){
    var now = new Date();
    months = [now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')];
  }
  return months;
}

function renderKanban(){
  initKanbanMonthPicker();
  var selectedMonths = getSelectedKanbanMonths();
  var label = document.getElementById('kanban-filter-label');
  if(label) label.textContent = selectedMonths.map(function(ym){
    var y=ym.slice(0,4), m=parseInt(ym.slice(5));
    return parseInt(y)===new Date().getFullYear() ? m+'월' : y+'.'+m;
  }).join(', ')+' 진행 캠페인';

  var html = '';
  STAGES.forEach(function(s){
    var items = DB.campaigns.filter(function(c){
      if(c.stage !== s.name) return false;
      // MD 권한: 본인 담당만
      if(ME_ROLE === 'md' && !isMycamp(c)) return false;
      var cStart = (c.start||c.startDate||'');
      var cEnd   = (c.end||c.endDate||cStart);
      if(!cStart) return false;
      var sM = cStart.slice(0,7), eM = cEnd.slice(0,7);
      return selectedMonths.some(function(ym){ return sM <= ym && eM >= ym; });
    });
    var cards = items.map(function(c){
      var revStr = c.revenue ? (c.revenue/1e8).toFixed(1)+'억' : '-';
      return '<div class="kcard" style="border-left:3px solid '+s.color+'" onclick="editProd('+c.id+')">'
        +'<div class="kcard-ttl" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px">'+escHtml(c.name)+'</div>'
        +'<div style="display:flex;justify-content:space-between;margin-top:5px;font-size:11px">'
        +'<span style="color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80px">'+(c.brand||c.owner||'-')+'</span>'
        +'<span style="color:var(--green);font-weight:700;flex-shrink:0">'+revStr+'</span>'
        +'</div>'
        +'<div style="font-size:10.5px;color:var(--text3);margin-top:3px;white-space:nowrap">'
        +((c.start||'').slice(5))+' ~ '+((c.end||'').slice(5))+'</div></div>';
    }).join('');
    html += '<div class="kcol">'
      +'<div class="kcol-hd"><span class="kcol-ttl" style="color:'+s.color+'">'+s.short+'</span>'
      +'<span class="kcount">'+items.length+'</span></div>'
      +'<div class="kcards">'+(cards||'<div style="font-size:11px;color:var(--text3);padding:6px">없음</div>')+'</div>'
      +'</div>';
  });
  document.getElementById('kanban-bd').innerHTML = html;
}
// ── 캠페인 팝업 상단 상태 배지 갱신 ──
function updateProdStageBadge(stage){
  var area   = document.getElementById('prod-stage-area');
  var badge  = document.getElementById('prod-stage-badge');
  var select = document.getElementById('prod-stage-select');
  if(!area) return;
  area.style.display = 'flex';

  // 단계별 색상
  var col = stageColor(stage);
  var bg  = stageBg(stage);
  if(badge){
    // M-live: 단계명을 M-live 워크플로에 맞게 표시
    var displayStage = stage;
    if(getCampType()==='모바일라이브'){
      var mliveMap = {'1.캠페인요청':'1.편성요청','2.캠페인확정':'2.편성확정','3.상품정보등록':'3.상품정보등록','6.APP마케팅확정':'4.모바일마케팅','7.정산':'5.정산','7.정산완료':'5.정산완료','8.성과분석':'6.성과분석'};
      displayStage = mliveMap[stage] || stage;
    }
    badge.textContent = displayStage;
    badge.style.background = bg;
    badge.style.color = col;
  }
  if(select) select.value = stage;
}

// ── 팝업 헤더의 단계 드롭다운으로 즉시 변경 ──
function changeProdStageInline(newStage){
  var id = parseInt(document.getElementById('p-edit-id').value);
  if(!id){ showToast('저장 후 단계를 변경할 수 있습니다.'); return; }
  var idx = DB.campaigns.findIndex(function(c){ return c.id===id; });
  if(idx===-1) return;

  var oldStage = DB.campaigns[idx].stage;
  if(oldStage === newStage) return;

  DB.campaigns[idx] = Object.assign({}, DB.campaigns[idx], { stage: newStage });
  _myLastSaveTime = Date.now();
  _myLastSaveCamps = [DB.campaigns[idx]];
  _suppressListener = true;

  // Firebase 해당 캠페인만 업데이트
  var update = {};
  update['campaigns/'+id+'/stage'] = newStage;
  update['_lastWriter'] = ME||ME_EMAIL;
  update['_lastWrite']  = Date.now();

  if(fbReady){
    fbRef.update(update)
      .then(function(){
        setTimeout(function(){ _suppressListener=false; _myLastSaveCamps=null; }, 5000);
      })
      .catch(function(){ _suppressListener=false; });
  }

  // 배지 갱신
  updateProdStageBadge(newStage);

  // 히스토리 기록
  var campName = DB.campaigns[idx].name||'';
  addAct('🔄', campName+' 단계 변경: '+oldStage+' → '+newStage, nowStr(), ME);

  // 모든 페이지 뱃지 갱신
  updateBadges();
  renderAllPages();

  showToast(campName+' → '+newStage);
}

function changeCampStage(id,stage){
  console.log('[changeCampStage] id:', id, 'stage:', stage, 'fbReady:', fbReady);
  var c=getCamp(id); if(!c) return;
  var prev=c.stage; c.stage=stage;
  if(!DB.history[id]) DB.history[id]=[];
  DB.history[id].push({time:nowStr()||'',who:ME||'',from:prev||'',to:stage||''});
  addAct('📋',`${c.name} 단계 변경: ${prev} → ${stage}`,nowStr(),ME);
  addNotif('📋',`${c.name} → ${stage}`,'방금 전');
  // undefined 제거 후 저장
  var cleanCamp = JSON.parse(JSON.stringify(c));
  var cleanHist = JSON.parse(JSON.stringify(DB.history[id]));
  var cleanActs = JSON.parse(JSON.stringify(DB.activities.slice(0,30)));
  pushPath('campaigns/'+id, cleanCamp);
  pushPath('history/'+id, cleanHist);
  // activities는 id가 없으므로 인덱스 기반으로 변환
  var actsObj = {};
  cleanActs.forEach(function(a, i){ actsObj[i] = a; });
  pushPath('activities', actsObj);
  renderCamps(); renderS2();
  if(activeCampId===id) renderHistory(id);
  showToast(`${stage}으로 이동됨`);
}
function delCamp(id){
  if(!isAdmin()){ showToast('관리자만 삭제할 수 있습니다.'); return; }
  showConfirm('캠페인을 삭제하시겠습니까?', function(){
    _delCampConfirmed(id);
  });
}
function delCampFromModal(){
  var id = parseInt(document.getElementById('p-edit-id')?.value);
  if(!id){ showToast('저장된 캠페인만 삭제할 수 있습니다.'); return; }
  if(!isAdmin()){ showToast('관리자만 삭제할 수 있습니다.'); return; }
  showConfirm('이 캠페인을 삭제하시겠습니까?', function(){
    closeMo('product');
    _delCampConfirmed(id);
  });
}

// ── 신세계라이브쇼핑 제안서 엑셀 다운로드 ──
function exportCampaignProposal(){
  if(typeof XLSX==='undefined'){ showToast('엑셀 라이브러리 로드 실패'); return; }
  // 현재 모달의 데이터를 우선 사용, 저장된 캠페인이면 DB 데이터 보완
  var editId = parseInt(document.getElementById('p-edit-id')?.value)||0;
  var c = editId ? (DB.campaigns.find(function(x){return x.id===editId;})||{}) : {};
  // 폼 값으로 덮어쓰기 (입력 중인 값 반영)
  var v=function(id){return (document.getElementById(id)?.value||'').trim();};
  var iv=function(id){return parseInt((document.getElementById(id)?.value||'').replace(/,/g,''))||0;};
  var name = v('p-name') || c.name || '캠페인명';
  var revenue = iv('p-revenue') || c.revenue || 0;
  var startD = (v('p-start')||c.start||c.startDate||'').replace('T',' ');
  var endD   = (v('p-end')||c.end||c.endDate||'').replace('T',' ');
  var owner  = v('p-owner') || c.owner || '';
  var infData = (typeof getInfBlocksData==='function' ? getInfBlocksData() : null) || c.infData || [];
  var inf0 = infData[0] || {};
  var infName = inf0.infName || c.infName || '';
  var mcn = inf0.mcn || c.mcn || '';
  var feeRate = inf0.feeRate || c.feeRate || 0;
  var feeAmount = inf0.feeAmount || c.feeAmount || 0;
  var channelLink = (function(){
    if(inf0.youtube) return 'https://www.youtube.com/@'+inf0.youtube;
    if(inf0.insta)   return 'https://www.instagram.com/'+inf0.insta+'/';
    if(inf0.twitter) return 'https://x.com/'+inf0.twitter;
    if(c.channels){
      if(c.channels.youtube) return 'https://www.youtube.com/@'+c.channels.youtube;
      if(c.channels.insta)   return 'https://www.instagram.com/'+c.channels.insta+'/';
      if(c.channels.twitter) return 'https://x.com/'+c.channels.twitter;
    }
    return '';
  })();
  var dealUrl = v('appmkt-deal-url') || (c.appMkt&&c.appMkt.dealUrl) || '';
  var etcText = v('appmkt-etc-text') || (c.appMkt&&c.appMkt.etcText) || '';
  var dealCode = v('p-deal-code') || c.dealCode || '';
  var skus = (function(){
    var rows = document.querySelectorAll('#sku-list .sku-row');
    if(rows.length){
      return Array.from(rows).map(function(r){
        var pInt=function(cls){ return parseInt((r.querySelector(cls)?.value||'').replace(/,/g,''))||0; };
        var pStr=function(cls){ return (r.querySelector(cls)?.value||'').trim(); };
        return {
          code: pStr('.sku-code'), productName: pStr('.sku-pname'),
          price: pInt('.pg-price'), mdPrice: pInt('.pg-md'),
          cardDiscount: pInt('.pg-card'), mileage: pInt('.pg-mileage'),
          coupon: pInt('.pg-coupon'), broadcastCoupon: pInt('.pg-broadcast-coupon'),
          postMileage: pInt('.pg-post-mileage'), stock: pInt('.pg-stock'),
          finalPrice: (function(){var md=pInt('.pg-md');return md>0?Math.max(0,md-pInt('.pg-card')-pInt('.pg-mileage')-pInt('.pg-coupon')-pInt('.pg-broadcast-coupon')-pInt('.pg-post-mileage')):0;})(),
          onlineLowestPrice: pInt('.pg-online-lowest'),
          promoText: pStr('.pg-promo')
        };
      }).filter(function(s){ return s.code||s.productName; });
    }
    return c.skus || [];
  })();
  var mainSkuCode = (skus[0] && skus[0].code) || '';
  var csInfo = v('p-cs-info') || c.csInfo || '';
  // CS 정보 파싱 (1)~6) 라인별)
  var csLines = csInfo.split(/\r?\n/);
  var getCsField = function(prefix){
    for(var i=0;i<csLines.length;i++){
      if(csLines[i].indexOf(prefix)>=0){
        var idx = csLines[i].indexOf(':');
        return idx>=0 ? csLines[i].slice(idx+1).trim() : '';
      }
    }
    return '';
  };
  var taxStatus = getCsField('과세') || '과세';
  var maker = getCsField('제조사') || '';
  var returnContact = getCsField('반품교환문의') || '';
  var pickupAddr = getCsField('출고지') || '';
  var returnAddr = '';
  // 배송정보
  var courier = v('p-courier') || c.courier || 'CJ대한통운';
  var shipFree = !!(document.getElementById('p-ship-free')?.checked) || c.shipFree;
  var shipFee  = iv('p-ship-fee') || c.shipFee || 0;
  var islandFree = !!(document.getElementById('p-island-free')?.checked) || c.islandFree;
  var islandFee  = iv('p-island-fee') || c.islandFee || 0;
  var exchangeFee = iv('p-exchange-fee') || c.exchangeFee || 0;
  var returnFee   = iv('p-return-fee') || c.returnFee || 0;
  var shipCutoff  = v('p-ship-cutoff') || c.shipCutoff || '';
  var deliveryEtc = v('p-delivery-info') || c.deliveryInfo || '';
  var appeal = v('p-appeal') || c.appeal || '';
  var eventText2 = v('p-event-text') || c.eventText || '';
  var lowestLink = v('p-lowest-price-link') || c.lowestPriceLink || '';

  // 헬퍼: 통화 포맷
  var fmtKRW = function(n){ return n ? n.toLocaleString('ko-KR')+'원' : ''; };
  var fmtNum = function(n){ return n ? n.toLocaleString('ko-KR') : ''; };

  // ─── 워크시트 데이터 (2D 배열, A1=row[0][0]) ───
  // 33행 × 14열(A~N) 구조
  var aoa = [];
  for(var i=0;i<35;i++){ aoa.push(new Array(14).fill('')); }

  // [신세계라이브쇼핑 제안서] 영역 (A2~G9)
  aoa[1][0]='[신세계라이브쇼핑 제안서]';
  // 컨텐츠 업로드일정 헤더 (G2~)
  aoa[1][6]='[인플루언서 공구 컨텐츠 업로드일정]';
  aoa[2][6]='내용'; aoa[2][7]='업로드 일시'; aoa[2][8]='결과';
  aoa[3][6]='사전 공유 일정';
  aoa[4][6]='사전 빌드업 릴스';
  aoa[5][6]='예고 피드';
  aoa[6][6]='스토리 컨텐츠';
  aoa[7][6]='오픈 메인 피드';
  aoa[8][6]='클로징 피드';
  // 캠페인 기본정보 매핑 (B,D 컬럼: idx 1, idx 3)
  aoa[2][0]='캠페인명';        aoa[2][1]=name;          aoa[2][2]='예상 매출';   aoa[2][3]=fmtKRW(revenue);
  aoa[3][0]='캠페인 시작일';   aoa[3][1]=startD;        aoa[3][2]='캠페인 종료일'; aoa[3][3]=endD;
  aoa[4][0]='캠페인 담당';     aoa[4][1]=owner;         aoa[4][2]='MCN업체';     aoa[4][3]=mcn;
  aoa[5][0]='인플루언서명';    aoa[5][1]=infName;       aoa[5][2]='채널 링크';   aoa[5][3]=channelLink;
  aoa[6][0]='정율 수수료';     aoa[6][1]=feeRate?(feeRate+'%(VAT포함)'):'';   aoa[6][2]='정액 원고료'; aoa[6][3]=feeAmount?(Math.round(feeAmount/10000)+'만원(VAT별도)'):'';
  aoa[7][0]='구매 랜딩 URL';   aoa[7][1]=dealUrl;
  aoa[8][0]='기타 사항';       aoa[8][1]=etcText;

  // [상품정보] (A11~)
  aoa[10][0]='[상품정보]';
  aoa[11][0]='상품 딜코드';    aoa[11][1]=dealCode;      aoa[11][6]='이슈 사항';   aoa[11][7]=appeal;
  aoa[12][3]='메인 상품코드';  aoa[12][4]=mainSkuCode;
  // 상품 테이블 헤더 (row 14, idx 13)
  var headerRow = ['상품코드','상품명','정상가','기본 혜택가','웰컴고객','카드 5%','사후 적립금','최종 공구 혜택가','[온라인최저가]','사은품 등 기타 혜택','[기타 혜택]','[이벤트]','재고수'];
  for(var hi=0; hi<headerRow.length; hi++) aoa[14][hi]=headerRow[hi];
  // 헤더 보조설명 (row 15, idx 14)
  aoa[15][4]='1. 쿠폰 5,000원\n2. 적립금 3,000원';
  aoa[15][5]='(5만원이상, 적용카드 결제시)';
  aoa[15][6]='원, 14000원 지급(조건)';
  aoa[15][7]='최종 공구 혜택가';
  aoa[15][8]='채널 온라인 비교(다나와)';
  aoa[15][9]='장기무이자, 기획전 행사 등';
  aoa[15][10]='장기무이자 행사기간 공동 혜택';
  aoa[15][11]='(당사 업체 비용 또는 인플루언서 비용)';
  // 상품 데이터 (row 16부터, idx 15)
  var prodStartIdx = 16; // 0-indexed → 17행
  skus.forEach(function(s, si){
    var rowIdx = prodStartIdx + si;
    if(!aoa[rowIdx]) aoa[rowIdx] = new Array(14).fill('');
    aoa[rowIdx][0] = s.code||'';
    aoa[rowIdx][1] = s.productName||'';
    aoa[rowIdx][2] = s.price ? fmtNum(s.price) : '';
    aoa[rowIdx][3] = s.mdPrice ? fmtNum(s.mdPrice) : '';
    aoa[rowIdx][4] = s.mileage ? fmtNum(s.mileage) : '';       // 웰컴고객 = 신규적립금
    aoa[rowIdx][5] = s.cardDiscount ? fmtNum(s.cardDiscount) : ''; // 카드5%
    aoa[rowIdx][6] = s.postMileage ? fmtNum(s.postMileage) : '';   // 사후적립금
    aoa[rowIdx][7] = s.finalPrice ? fmtNum(s.finalPrice) : '';  // 최종공구혜택가
    aoa[rowIdx][8] = lowestLink||'';                            // 온라인최저가 → 최저가 링크
    aoa[rowIdx][9] = s.promoText||'';                           // 사은품 등 기타혜택
    aoa[rowIdx][10] = s.promoText||'';                          // 기타혜택
    aoa[rowIdx][11] = eventText2||'';                           // 이벤트
    aoa[rowIdx][12] = s.stock ? fmtNum(s.stock) : '';           // 재고수
  });

  // [배송정책] (상품 행 다음 +2행 여백)
  var deliveryStartIdx = Math.max(20, prodStartIdx + skus.length + 2);
  aoa[deliveryStartIdx]   = ['배송정책','','','','','','상품 USP','','','','','','',''];
  aoa[deliveryStartIdx+1] = ['과세/면세', taxStatus,'','','','','상품 이미지','','','','','','',''];
  aoa[deliveryStartIdx+2] = ['제조사/원산지', maker,'','','','','','','','','','','',''];
  aoa[deliveryStartIdx+3] = ['택배사', courier,'','','','','','','','','','','',''];
  aoa[deliveryStartIdx+4] = ['무료배송 조건', shipFree?'무료배송':(shipFee?fmtKRW(shipFee)+' 이상':''),'','','','','MD 작성 소구포인트',appeal,'','','','','',''];
  aoa[deliveryStartIdx+5] = ['배송비', shipFree?'무료배송':fmtKRW(shipFee),'','','','','','','','','','','',''];
  aoa[deliveryStartIdx+6] = ['제주/도서산간 추가배송비', islandFree?'배송불가':fmtKRW(islandFee),'','','','','','','','','','','',''];
  aoa[deliveryStartIdx+7] = ['반품/교환비', exchangeFee && returnFee ? (fmtNum(exchangeFee)+' / '+fmtNum(returnFee)) : '','','','','','','','','','','','',''];
  aoa[deliveryStartIdx+8] = ['출고지 주소', pickupAddr,'','','','','','','','','','','',''];
  aoa[deliveryStartIdx+9] = ['교환·반품 주소', returnAddr,'','','','','','','','','','','',''];
  aoa[deliveryStartIdx+10] = ['당일출고 마감시간', shipCutoff,'','','','','','','','','','','',''];
  aoa[deliveryStartIdx+11] = ['당일 출고 가능 수량', '','','','','','','','','','','','',''];
  aoa[deliveryStartIdx+12] = ['본사 cs 가이드/안내멘트', returnContact || deliveryEtc,'','','','','','','','','','','',''];

  // ─── 워크북 생성 ───
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.aoa_to_sheet(aoa);

  // 컬럼 너비 설정 (원본 제안서 참고)
  ws['!cols'] = [
    {wch:16},{wch:35},{wch:12},{wch:16},{wch:14},{wch:16},{wch:16},
    {wch:16},{wch:16},{wch:20},{wch:16},{wch:22},{wch:12},{wch:8}
  ];

  // 셀 병합 (Merges)
  var merges = [];
  merges.push({s:{r:1,c:0},e:{r:1,c:5}});  // 제안서 타이틀
  merges.push({s:{r:1,c:6},e:{r:1,c:8}});  // 업로드일정 타이틀
  merges.push({s:{r:7,c:1},e:{r:7,c:5}});  // 구매랜딩 URL 값
  merges.push({s:{r:8,c:1},e:{r:8,c:5}});  // 기타사항 값
  merges.push({s:{r:10,c:0},e:{r:10,c:5}});  // 상품정보 타이틀
  merges.push({s:{r:11,c:1},e:{r:11,c:5}});  // 딜코드 값
  merges.push({s:{r:11,c:7},e:{r:11,c:12}}); // 이슈사항 값
  // 배송정책 라벨 값 병합 (B열 넓게)
  for(var di=1;di<=12;di++){
    merges.push({s:{r:deliveryStartIdx+di,c:1},e:{r:deliveryStartIdx+di,c:5}});
  }
  // 배송정책/상품USP 섹션 헤더
  merges.push({s:{r:deliveryStartIdx,c:0},e:{r:deliveryStartIdx,c:5}});
  merges.push({s:{r:deliveryStartIdx,c:6},e:{r:deliveryStartIdx,c:12}});
  // 상품이미지
  merges.push({s:{r:deliveryStartIdx+1,c:6},e:{r:deliveryStartIdx+3,c:8}});
  // MD 소구포인트 라벨+값
  merges.push({s:{r:deliveryStartIdx+4,c:6},e:{r:deliveryStartIdx+4,c:8}});
  merges.push({s:{r:deliveryStartIdx+5,c:6},e:{r:deliveryStartIdx+12,c:12}});
  ws['!merges'] = merges;

  // ─── 셀 스타일 (xlsx-js-style) ───
  var border = {top:{style:'thin',color:{rgb:'AAAAAA'}},bottom:{style:'thin',color:{rgb:'AAAAAA'}},left:{style:'thin',color:{rgb:'AAAAAA'}},right:{style:'thin',color:{rgb:'AAAAAA'}}};
  var titleStyle = {fill:{fgColor:{rgb:'C6E0B4'}},font:{bold:true,sz:13},alignment:{horizontal:'left',vertical:'center'},border:border};
  var headerStyle = {fill:{fgColor:{rgb:'D9E1F2'}},font:{bold:true,sz:11},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:border};
  var subHeaderStyle = {fill:{fgColor:{rgb:'FFE699'}},font:{bold:true,sz:9},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:border};
  var labelStyle = {fill:{fgColor:{rgb:'F2F2F2'}},font:{bold:true,sz:10},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:border};
  var dataStyle = {fill:{fgColor:{rgb:'FFFFFF'}},font:{sz:10},alignment:{horizontal:'left',vertical:'center',wrapText:true},border:border};
  var dataCenterStyle = {fill:{fgColor:{rgb:'FFFFFF'}},font:{sz:10},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:border};
  var dataRightStyle = {fill:{fgColor:{rgb:'FFFFFF'}},font:{sz:10},alignment:{horizontal:'right',vertical:'center',wrapText:true},border:border};
  var sectionHdrStyle = {fill:{fgColor:{rgb:'8EA9DB'}},font:{bold:true,sz:12,color:{rgb:'FFFFFF'}},alignment:{horizontal:'left',vertical:'center'},border:border};
  var noBorder = {};

  var setStyle = function(addr, st){ if(ws[addr]) ws[addr].s = st; else { ws[addr]={v:'',t:'s',s:st}; } };
  var colChar = ['A','B','C','D','E','F','G','H','I','J','K','L','M'];

  // ── 제안서 영역 스타일 (A2~I9) ──
  setStyle('A2', titleStyle); // 제안서 타이틀
  for(var ci2=1;ci2<=5;ci2++) setStyle(colChar[ci2]+'2', titleStyle);
  setStyle('G2', titleStyle); setStyle('H2', titleStyle); setStyle('I2', titleStyle);
  for(var r=2; r<=8; r++){
    setStyle('A'+(r+1), labelStyle);
    setStyle('B'+(r+1), dataStyle);
    if(r<=6){ setStyle('C'+(r+1), labelStyle); setStyle('D'+(r+1), dataStyle); setStyle('E'+(r+1), dataStyle); }
  }
  // 업로드일정 헤더+데이터
  setStyle('G3', headerStyle); setStyle('H3', headerStyle); setStyle('I3', headerStyle);
  for(var r2=3; r2<=8; r2++){
    setStyle('G'+(r2+1), labelStyle);
    setStyle('H'+(r2+1), dataStyle);
    setStyle('I'+(r2+1), dataStyle);
  }

  // ── 상품정보 영역 스타일 ──
  setStyle('A11', titleStyle);
  for(var ci3=1;ci3<=5;ci3++) setStyle(colChar[ci3]+'11', titleStyle);
  setStyle('A12', labelStyle); setStyle('B12', dataStyle);
  for(var ci4=2;ci4<=5;ci4++) setStyle(colChar[ci4]+'12', dataStyle);
  setStyle('D13', labelStyle); setStyle('E13', dataStyle);
  setStyle('G12', labelStyle);
  for(var ci5=7;ci5<=12;ci5++) setStyle(colChar[ci5]+'12', dataStyle);

  // 상품 테이블 헤더
  colChar.forEach(function(ch,i){ if(headerRow[i]) setStyle(ch+'15', headerStyle); });
  colChar.forEach(function(ch){ setStyle(ch+'16', subHeaderStyle); });

  // 상품 데이터
  skus.forEach(function(s,si){
    var rn = 17+si;
    setStyle('A'+rn, dataCenterStyle);
    setStyle('B'+rn, dataStyle);
    ['C','D','E','F','G','H','I'].forEach(function(ch){ setStyle(ch+rn, dataRightStyle); });
    ['J','K','L'].forEach(function(ch){ setStyle(ch+rn, dataStyle); });
    setStyle('M'+rn, dataCenterStyle);
  });

  // ── 배송정책 영역 스타일 ──
  var dHdrRow = deliveryStartIdx+1;
  // 섹션 헤더
  for(var ci6=0;ci6<=5;ci6++) setStyle(colChar[ci6]+dHdrRow, sectionHdrStyle);
  for(var ci7=6;ci7<=12;ci7++) setStyle(colChar[ci7]+dHdrRow, sectionHdrStyle);
  // 배송정책 데이터
  for(var dr=1; dr<=12; dr++){
    var rn2 = deliveryStartIdx+dr+1;
    setStyle('A'+rn2, labelStyle);
    for(var ci8=1;ci8<=5;ci8++) setStyle(colChar[ci8]+rn2, dataStyle);
  }
  // 상품이미지/소구포인트
  setStyle('G'+(deliveryStartIdx+2), labelStyle);
  setStyle('H'+(deliveryStartIdx+2), dataStyle); setStyle('I'+(deliveryStartIdx+2), dataStyle);
  setStyle('G'+(deliveryStartIdx+5), labelStyle);
  setStyle('H'+(deliveryStartIdx+5), dataStyle); setStyle('I'+(deliveryStartIdx+5), dataStyle);
  // MD 소구포인트 값 영역
  for(var dr2=5;dr2<=12;dr2++){
    for(var ci9=6;ci9<=12;ci9++) setStyle(colChar[ci9]+(deliveryStartIdx+dr2+1), dataStyle);
  }

  // 행 높이
  ws['!rows'] = [];
  ws['!rows'][1] = {hpt:26};
  ws['!rows'][7] = {hpt:30};
  ws['!rows'][8] = {hpt:30};
  ws['!rows'][14] = {hpt:26};
  ws['!rows'][15] = {hpt:40};

  XLSX.utils.book_append_sheet(wb, ws, '제안서');
  var fileName = '신세계라이브쇼핑_제안서_'+(name||'캠페인').replace(/[\\/:*?"<>|]/g,'_')+'.xlsx';
  XLSX.writeFile(wb, fileName);
  showToast('제안서 엑셀 다운로드 완료');
}
function _delCampConfirmed(id){
  var sid = String(id);
  // 30초간 listener에서 차단
  _recentlyDeletedCamps[sid] = Date.now();
  setTimeout(function(){ delete _recentlyDeletedCamps[sid]; }, 30000);
  // 로컬에서 즉시 제거
  DB.campaigns = DB.campaigns.filter(function(c){ return String(c.id) !== sid; });
  // _myLastSaveCamps에도 제거 (listener 복원 루프 방지)
  if(_myLastSaveCamps && Array.isArray(_myLastSaveCamps)){
    _myLastSaveCamps = _myLastSaveCamps.filter(function(c){ return String(c.id) !== sid; });
  }
  // 관련 데이터 정리 (정산/매칭/진행/MCN요청/APP마케팅)
  if(DB.settlements)  DB.settlements  = DB.settlements.filter(function(s){ return String(s.campaign||s.campId) !== sid; });
  if(DB.matches)      DB.matches      = DB.matches.filter(function(m){ return String(m.campaign||m.campId) !== sid; });
  if(DB.progress)     DB.progress     = DB.progress.filter(function(p){ return String(p.campaign||p.campId) !== sid; });
  if(DB.mcnRequests)  DB.mcnRequests  = DB.mcnRequests.filter(function(r){ return String(r.campaign||r.campId) !== sid; });
  if(DB.appMarketing) DB.appMarketing = DB.appMarketing.filter(function(a){ return String(a.campaign||a.campId) !== sid; });
  // 모든 페이지 재렌더링 (일부 뷰 누락 방지)
  try { renderAllPages(); } catch(e){ renderS1(); renderS2(); renderCamps(); renderDash(); }
  updateBadges(); closeDetail(); showToast('삭제됨');
  if(fbReady){
    _suppressListener = true;
    // 특정 경로만 삭제 (전체 DB를 재기록하지 않음 → race condition 방지)
    fbDB.ref('influencer-hub/campaigns/' + sid).remove()
      .then(function(){
        console.log('[delCamp] Firebase 삭제 성공:', sid);
        setTimeout(function(){ _suppressListener = false; }, 2000);
      })
      .catch(function(e){
        console.error('[delCamp] Firebase 삭제 실패:', e.code, e.message);
        showToast('Firebase 삭제 실패: ' + (e.code||e.message));
        _suppressListener = false;
      });
  }
}

// ═══════════════════════════════════════
// COMMENTS / FILES / HISTORY
// ═══════════════════════════════════════
function renderComments(campId){
  var list=DB.comments[campId]||[];
  var h='';
  if(!list.length) h='<div style="font-size:12px;color:var(--text3);padding:8px 0">아직 댓글 없음</div>';
  else list.forEach(c=>{
    h+=`<div class="comment-item"><div class="cav" style="background:${avColor(c.author)}22;color:${avColor(c.author)}">${c.author?.[0]||'?'}</div><div class="cbody"><div><span class="c-author">${c.author}</span><span class="c-time">${c.time}</span></div><div class="c-text">${c.text}</div></div></div>`;
  });
  var el=document.getElementById('comment-thread');
  el.innerHTML=h; el.scrollTop=el.scrollHeight;
}
function addComment(){
  var inp=document.getElementById('comment-inp');
  var text=inp.value.trim(); if(!text||!activeCampId) return;
  var comment={author:ME,time:nowStr(),text};
  if(!DB.comments[activeCampId]) DB.comments[activeCampId]=[];
  DB.comments[activeCampId].push(comment);
  inp.value=''; renderComments(activeCampId);
  pushPath('comments/'+activeCampId, DB.comments[activeCampId]);
}
function renderFiles(campId){
  var list=DB.files[campId]||[];
  var h='';
  list.forEach((f,i)=>{
    var ico=f.type?.startsWith('image')?'🖼️':f.type?.includes('pdf')?'📄':'📎';
    h+=`<div class="file-item"><span class="file-ico">${ico}</span><span class="file-name">${f.name}</span><span class="file-size">${(f.size/1024).toFixed(1)}KB</span>${f.type?.startsWith('image')?`<button class="btn btn-ghost btn-xs" onclick="previewImg(${campId},${i})">보기</button>`:''}<button class="btn btn-danger btn-xs" onclick="delFile(${campId},${i})">삭제</button></div>`;
  });
  document.getElementById('det-files').innerHTML=h;
}
function dragOver(e){ e.preventDefault(); document.getElementById('det-drop').classList.add('dragover'); }
function dragLeave(e){ document.getElementById('det-drop').classList.remove('dragover'); }
function dropFile(e){ e.preventDefault(); document.getElementById('det-drop').classList.remove('dragover'); handleFiles(e.dataTransfer.files); }
function pickFiles(inp){ handleFiles(inp.files); inp.value=''; }
function handleFiles(files){
  if(!activeCampId) return;
  if(!DB.files[activeCampId]) DB.files[activeCampId]=[];
  [...files].forEach(f=>{
    var reader=new FileReader();
    reader.onload=ev=>{ DB.files[activeCampId].push({name:f.name,size:f.size,type:f.type,dataUrl:ev.target.result}); renderFiles(activeCampId); showToast(`${f.name} 첨부됨`); };
    reader.readAsDataURL(f);
  });
}
function delFile(campId,i){ DB.files[campId].splice(i,1); renderFiles(campId); }
function previewImg(campId,i){ const f=DB.files[campId][i]; const w=window.open(); w.document.write(`<img src="${f.dataUrl}" style="max-width:100%">`); }
function renderHistory(campId){
  var list=DB.history[campId]||[];
  var el=document.getElementById('camp-history');
  if(!list.length){ el.innerHTML='<div style="font-size:12px;color:var(--text3)">이력 없음</div>'; return; }
  el.innerHTML=[...list].reverse().map(h=>`<div class="tl-item"><div class="tl-dot">🔄</div><div class="tl-body"><div class="tl-ttl">${h.from} → ${h.to}</div><div class="tl-meta">${h.time} · ${h.who}</div></div></div>`).join('');
}

// ═══════════════════════════════════════
// INFLUENCERS
// ═══════════════════════════════════════
const ALL_CATS=['뷰티','식품/맛집','패션','라이프스타일','IT/테크','여행','육아','기타'];
// 캠페인 데이터에서 인플루언서 목록 자동 생성
function buildInfList(){
  var map = {};
  // 캠페인 기반 인플루언서
  DB.campaigns.forEach(function(camp){
    if(!camp.infName || !camp.infName.trim()) return;
    var key = camp.infName.trim();
    if(!map[key]){
      map[key] = {
        name: key,
        campaigns: [],
        latestCamp: null,
      };
    }
    map[key].campaigns.push(camp);
    if(!map[key].latestCamp || (camp.start||'') > (map[key].latestCamp.start||'')){
      map[key].latestCamp = camp;
    }
  });
  // DB.influencers에서 직접 등록한 인플루언서 병합
  (DB.influencers||[]).forEach(function(inf){
    if(!inf.name || !inf.name.trim()) return;
    var key = inf.name.trim();
    // 플랫폼별 채널 매핑
    var ch = { insta: inf.insta||'', youtube: inf.youtube||'', twitter: inf.twitter||'' };
    // 구버전 호환: handle+platform 조합
    if(inf.handle && !ch.insta && !ch.youtube && !ch.twitter){
      var p = (inf.platform||'').toLowerCase();
      if(p.includes('유튜브')||p.includes('youtube')) ch.youtube = inf.handle;
      else if(p.includes('틱톡')||p.includes('tiktok')) ch.insta = ''; // 틱톡은 별도 처리 없음
      else if(p.includes('트위터')||p.includes('twitter')||p.includes('x(')) ch.twitter = inf.handle;
      else ch.insta = inf.handle;
    }
    if(!map[key]){
      map[key] = {
        name: key,
        campaigns: [],
        latestCamp: { cat: inf.cat||'', infSize: '', feeRate: 0, feeAmount: inf.fee||0, channels: ch },
        dbInf: inf,
      };
    } else {
      map[key].dbInf = inf;
      // DB에 등록된 채널 정보가 있으면 latestCamp.channels 보강
      var lc = map[key].latestCamp;
      if(lc && lc.channels){
        if(ch.insta && !lc.channels.insta) lc.channels.insta = ch.insta;
        if(ch.youtube && !lc.channels.youtube) lc.channels.youtube = ch.youtube;
        if(ch.twitter && !lc.channels.twitter) lc.channels.twitter = ch.twitter;
      }
    }
  });
  return Object.values(map);
}

function renderInfs(){
  console.log('[renderInfs] called, DB.campaigns:', DB.campaigns.length, 'inf-grid:', !!document.getElementById('inf-grid'));
  var infList = buildInfList();
  console.log('[renderInfs] infList:', infList.length);

  // 카테고리 칩
  var cats = [...new Set(infList.map(function(i){ return i.latestCamp?.cat||''; }).filter(Boolean))];
  var chips = '<div class="chip '+(infFilter.cat===''?'on':'')+'" onclick="setCat(\'\')">전체</div>';
  cats.forEach(function(cat){
    chips += '<div class="chip '+(infFilter.cat===cat?'on':'')+'" onclick="setCat(\''+cat+'\')">'+cat+'</div>';
  });
  document.getElementById('cat-chips').innerHTML=chips;

  // 필터
  var list = infList.filter(function(i){
    var lc = i.latestCamp||{};
    var t = !infFilter.text || i.name.includes(infFilter.text) || (lc.infName||'').includes(infFilter.text);
    var catMatch = !infFilter.cat || (lc.cat||'')=== infFilter.cat;
    return t && catMatch;
  });

  // ── 테이블 헤더 ──
  var canSeePrivate = isAdmin() || ME_ROLE==='manager';
  var tableHtml = '<div class="card"><table style="width:100%"><thead><tr>'    +'<th>인플루언서</th><th>최근 규모</th><th>최근 카테고리</th>'    +(canSeePrivate?'<th>연락처</th><th>주소</th><th style="text-align:right">수수료율</th>':'')    +'<th style="text-align:right">평균매출</th><th style="text-align:right">평균주문건수</th><th style="text-align:right">평균비용</th>'    +'</tr></thead><tbody>';

  var twoYearsAgo = new Date(); twoYearsAgo.setFullYear(twoYearsAgo.getFullYear()-2);

  list.forEach(function(inf){
    var lc = inf.latestCamp || {};
    var channels = lc.channels || {};
    var ytCh = channels.youtube || '';
    var igCh = channels.insta   || '';
    var twCh = channels.twitter || lc.twitter || '';

    // 규모
    var size = lc.infSize || lc.role || '-';
    var sizeColor = size.includes('메가')?'var(--pink)':size.includes('미들')?'var(--blue)':size.includes('시딩')?'var(--green)':'var(--text3)';
    var sizeBg    = size.includes('메가')?'var(--pink-bg)':size.includes('미들')?'var(--blue-bg)':size.includes('시딩')?'var(--green-bg)':'var(--bg4)';

    // 2년 이내 캠페인 통계
    var perfCamps = inf.campaigns.filter(function(camp){
      var s = camp.start ? new Date(camp.start) : null;
      return s && s >= twoYearsAgo;
    });
    var cnt = perfCamps.length || 1;
    var avgRev  = perfCamps.reduce(function(s,camp){ return s+(camp.settleRevenue||0); }, 0) / cnt;
    var avgOrd  = perfCamps.reduce(function(s,camp){ return s+(camp.settleOrders||0);  }, 0) / cnt;
    var avgCost = perfCamps.reduce(function(s,camp){
      var rev=camp.settleRevenue||0, fr=parseFloat(camp.feeRate)||0, fa=parseInt(camp.feeAmount)||0;
      var ar=parseFloat(camp.agencyRate)||0, da=parseInt(camp.settleDa)||0;
      return s + Math.round(rev*fr/100) + fa + Math.round(rev*ar/100) + da;
    }, 0) / cnt;

    var fmtRev  = avgRev  > 0 ? (avgRev/100000000).toFixed(1)+'억'  : '-';
    var fmtOrd  = avgOrd  > 0 ? Math.round(avgOrd)+'건'              : '-';
    var fmtCost = avgCost > 0 ? (avgCost>=10000?(avgCost/10000).toFixed(0)+'만':Math.round(avgCost).toLocaleString())+'원' : '-';

    // 채널 링크
    var platHtml = '';
    if(ytCh) platHtml += '<a href="https://www.youtube.com/@'+ytCh.replace('@','')+'" target="_blank" style="color:#ff0000;font-size:11px;text-decoration:none;margin-right:6px">▶'+ytCh+'</a>';
    if(igCh) platHtml += '<a href="https://www.instagram.com/'+igCh.replace('@','')+'" target="_blank" style="color:#e1306c;font-size:11px;text-decoration:none">📸'+igCh+'</a>';
    if(twCh) platHtml += '<a href="https://x.com/'+twCh.replace('@','')+'" target="_blank" style="color:#000;font-size:11px;font-weight:700;text-decoration:none;margin-right:4px">𝕏 '+twCh+'</a>';

    // 비공개 정보 (관리자/매니저 전용)
    var dbInf = inf.dbInf || {};
    var infContact = dbInf.contact || lc.contact || '';
    var infAddress = dbInf.address || lc.sampleAddress || '';
    var infFeeRate = lc.feeRate ? lc.feeRate+'%' : '-';

    tableHtml += '<tr class="copy-camp-item" data-infname="'+inf.name.replace(/"/g,'&quot;')+'" onclick="openInfDetail(this.dataset.infname)" style="cursor:pointer">'      +'<td><div style="display:flex;align-items:center;gap:8px">'      +'<div class="av" style="background:'+avColor(inf.name)+'22;color:'+avColor(inf.name)+'">'+( inf.name?.[0]||'?')+'</div>'      +'<div><div style="font-weight:700;font-size:13px">'+inf.name+'</div>'      +(platHtml?'<div style="margin-top:2px">'+platHtml+'</div>':'')+'</div></div></td>'      +'<td>'+(size!=='-'?'<span style="background:'+sizeBg+';color:'+sizeColor+';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">'+size+'</span>':'-')+'</td>'      +'<td style="color:var(--text2);font-size:12.5px">'+(lc.cat||'-')+'</td>'      +(canSeePrivate?'<td style="font-size:12px;color:var(--text2)">'+escHtml(infContact||'-')+'</td>'        +'<td style="font-size:12px;color:var(--text2);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+escHtml(infAddress)+'">'+escHtml(infAddress||'-')+'</td>'        +'<td style="text-align:right;font-size:12px;color:var(--accent2);font-weight:600">'+infFeeRate+'</td>':'')      +'<td style="text-align:right;font-weight:700;color:var(--green)">'+fmtRev+'</td>'      +'<td style="text-align:right;color:var(--text2)">'+fmtOrd+'</td>'      +'<td style="text-align:right;color:var(--orange)">'+fmtCost+'</td>'      +'</tr>';
  });

  tableHtml += '</tbody></table></div>';

  // inf-grid 부모 표시 보장
  var infPage = document.getElementById('page-influencers');
  if(infPage) infPage.style.display = '';
  document.getElementById('inf-grid').innerHTML = list.length ? tableHtml :
    '<div class="empty" style="padding:40px;text-align:center;color:var(--text3)">캠페인에 인플루언서 정보를 입력하면 자동으로 표시됩니다</div>';
}

// ── AI 분석 캐시 (인플루언서별) ──
var _infAiCache = {};

// API키 설정 팝업
function openApiKeySetting(){
  var cur = localStorage.getItem('ihub-claude-api-key')||'';
  var pw = prompt('Anthropic API Key 입력 (AI 분석용):', cur);
  if(pw !== null){ localStorage.setItem('ihub-claude-api-key', pw.trim()); showToast('API Key 저장됨'); }
}

// ── 인플루언서 상세 팝업 (8섹션 AI 분석) ──
function openInfDetail(infName){
  var inf = buildInfList().find(function(i){ return i.name===infName; });
  if(!inf) return;
  var lc = inf.latestCamp || {};
  var channels = lc.channels || {};
  var igCh = channels.insta||'', ytCh = channels.youtube||'', twCh = channels.twitter||'';
  var size = lc.infSize||lc.role||'-';
  var ic = infSizeColor(size);

  // 과거 캠페인 데이터
  var twoYearsAgo = new Date(); twoYearsAgo.setFullYear(twoYearsAgo.getFullYear()-2);
  var perfCamps = inf.campaigns.filter(function(c){ var s=c.start?new Date(c.start):null; return s&&s>=twoYearsAgo; })
    .sort(function(a,b){ return (b.start||'')>(a.start||'')?1:-1; });

  // 뱃지 HTML
  var badges = '<span style="background:'+ic.bg+';color:'+ic.color+';padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">'+size+'</span>';
  var cats = [...new Set(inf.campaigns.map(function(c){return c.cat||'';}).filter(Boolean))];
  if(perfCamps.some(function(c){return (c.settleRevenue||0)>0;})) badges += ' <span style="background:#fdcb6e33;color:#d68910;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">공구 경험</span>';
  if(cats.length) badges += ' <span style="background:#00b89422;color:#00b894;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">'+(cats[0])+' 전문</span>';

  var handleStr = igCh ? '@'+igCh.replace('@','') : (ytCh ? '@'+ytCh.replace('@','') : '');
  var catStr = cats.length ? cats.join(' / ')+' 카테고리' : '';

  // 모달 생성
  var existing = document.getElementById('inf-detail-modal');
  if(existing) existing.remove();
  var el = document.createElement('div');
  el.id = 'inf-detail-modal';
  el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.4);z-index:9999;display:flex;align-items:center;justify-content:center';

  el.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r-lg);padding:0;min-width:620px;max-width:1120px;width:95%;max-height:90vh;display:flex;flex-direction:column">'
    // 헤더
    +'<div style="padding:20px 24px 16px;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'
    +'<div style="display:flex;align-items:center;gap:14px">'
    +'<div style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;background:'+avColor(inf.name)+'22;color:'+avColor(inf.name)+'">'+inf.name[0]+'</div>'
    +'<div><div style="font-size:18px;font-weight:800">'+escHtml(inf.name)+'</div>'
    +'<div style="font-size:12px;color:var(--text3);margin-top:2px">'+(handleStr?escHtml(handleStr)+' · ':'')+(catStr?escHtml(catStr):'')+'</div>'
    +'<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">'+badges+'</div>'
    +'</div></div>'
    +'<div style="display:flex;gap:6px;align-items:center">'
    +(_infAiCache[infName]?'<button class="btn btn-ghost btn-xs" style="color:var(--orange);font-size:11px" onclick="resetInfAi(\''+escHtml(inf.name)+'\')">초기화</button>':'')
    +'<button class="btn btn-ghost btn-xs" onclick="pasteInfAi(\''+escHtml(inf.name)+'\')">AI 분석 붙여넣기</button>'
    +'<button class="btn btn-ghost btn-xs" onclick="downloadInfPdf(\''+escHtml(inf.name)+'\')">PDF 다운로드</button>'
    +'<button class="btn btn-ghost btn-xs" onclick="document.getElementById(\'inf-detail-modal\').remove()">✕</button>'
    +'</div></div>'
    // 스크롤 바디
    +'<div id="inf-detail-body" style="overflow-y:auto;padding:20px 24px 24px;flex:1"></div>'
    +'</div>';

  document.body.appendChild(el);

  // 캐시된 AI 분석이 있으면 렌더, 없으면 기본 뷰
  if(_infAiCache[infName]){
    renderInfAiReport(infName, _infAiCache[infName]);
  } else {
    renderInfDefaultView(inf, perfCamps);
  }
}

// ── 기본 뷰 (AI 분석 전) ──
function renderInfDefaultView(inf, perfCamps){
  var body = document.getElementById('inf-detail-body');
  if(!body) return;
  var lc = inf.latestCamp||{};

  // 기본 정보 카드
  var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">'
    +'<div style="background:var(--bg3);border-radius:8px;padding:12px;text-align:center"><div style="font-size:10.5px;color:var(--text3);margin-bottom:4px">수수료율</div><div style="font-weight:700;color:var(--accent2);font-size:15px">'+(lc.feeRate?lc.feeRate+'%':'-')+'</div></div>'
    +'<div style="background:var(--bg3);border-radius:8px;padding:12px;text-align:center"><div style="font-size:10.5px;color:var(--text3);margin-bottom:4px">원고료</div><div style="font-weight:700;color:var(--accent2);font-size:15px">'+(lc.feeAmount?(lc.feeAmount/10000).toFixed(0)+'만원':'-')+'</div></div>'
    +'<div style="background:var(--bg3);border-radius:8px;padding:12px;text-align:center"><div style="font-size:10.5px;color:var(--text3);margin-bottom:4px">카테고리</div><div style="font-weight:700;font-size:15px">'+(lc.cat||'-')+'</div></div>'
    +'</div>';

  // 캠페인 실적
  html += '<div style="font-size:13px;font-weight:700;color:var(--text2);margin-bottom:10px">캠페인 실적 (최근 2년)</div>';
  if(perfCamps.length){
    html += '<table style="width:100%"><thead><tr style="background:var(--bg3)"><th style="padding:6px 8px;text-align:left;font-size:11px">캠페인명</th><th style="padding:6px 8px;text-align:left;font-size:11px">카테고리</th><th style="padding:6px 8px;text-align:right;font-size:11px">매출</th><th style="padding:6px 8px;text-align:right;font-size:11px">주문건수</th><th style="padding:6px 8px;text-align:right;font-size:11px">비용</th></tr></thead><tbody>';
    perfCamps.forEach(function(c){
      var rev=c.settleRevenue||0; var revS=rev>=1e8?(rev/1e8).toFixed(1)+'억':rev>=1e4?(rev/1e4).toFixed(0)+'만':rev>0?rev.toLocaleString():'-';
      var fr=parseFloat(c.feeRate)||0,fa=parseInt(c.feeAmount)||0,ar=parseFloat(c.agencyRate)||0,da=parseInt(c.settleDa)||0;
      var cost=Math.round(rev*fr/100)+fa+Math.round(rev*ar/100)+da;
      var costS=cost>=1e4?(cost/1e4).toFixed(0)+'만':cost>0?cost.toLocaleString():'-';
      html+='<tr style="font-size:12px"><td style="font-weight:600;padding:6px 8px">'+escHtml(c.name)+'</td><td style="color:var(--text3);padding:6px 8px">'+(c.cat||'-')+'</td><td style="color:var(--green);font-weight:700;text-align:right;padding:6px 8px">'+revS+'</td><td style="text-align:right;padding:6px 8px">'+(c.settleOrders||'-')+'</td><td style="color:var(--orange);text-align:right;padding:6px 8px">'+costS+'</td></tr>';
    });
    html += '</tbody></table>';
  } else {
    html += '<div style="padding:24px;text-align:center;color:var(--text3)">진행 실적 없음</div>';
  }

  // AI 분석 안내
  html += '<div style="margin-top:24px;padding:24px;background:var(--bg3);border-radius:8px;text-align:center">'
    +'<div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text2)">AI 종합 분석 리포트</div>'
    +'<div style="font-size:12px;color:var(--text3);margin-bottom:14px;line-height:1.6">'
    +'Claude AI에서 분석한 내용을 붙여넣으면<br>채널 지표 · 오디언스 · 강점/리스크 · 소싱 제안 등 8개 섹션이 자동 구성됩니다.</div>'
    +'<button class="btn btn-primary btn-sm" onclick="pasteInfAi(\''+escHtml(inf.name)+'\')">AI 분석 붙여넣기</button>'
    +'</div>';

  body.innerHTML = html;
}

// ── AI 분석 붙여넣기 ──
function pasteInfAi(infName){
  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:center;justify-content:center';
  wrap.innerHTML = '<div style="background:var(--bg2);border-radius:12px;padding:24px;width:90%;max-width:750px;max-height:85vh;display:flex;flex-direction:column;gap:14px">'
    +'<div style="font-size:15px;font-weight:800">AI 분석 결과 입력</div>'
    +'<div style="font-size:12px;color:var(--text3);line-height:1.6">아래에 텍스트 또는 <b>HTML 소스코드</b>를 붙여넣거나, HTML 파일을 업로드하세요.</div>'
    +'<textarea id="ai-text-area" style="width:100%;min-height:250px;max-height:55vh;font-size:12px;padding:12px;border:1px solid var(--border);border-radius:8px;font-family:monospace;resize:vertical;line-height:1.5;background:var(--bg)" placeholder="텍스트, 마크다운, HTML 소스코드, JSON 모두 가능합니다.\n\nHTML 소스: <style>...</style><div class=&quot;wrap&quot;>...</div>\n텍스트: 채널 핵심 지표\n인스타 팔로워: 86.1만\n..."></textarea>'
    +'<div style="display:flex;gap:8px;justify-content:flex-end;align-items:center">'
    +'<label style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--accent2);font-weight:600;padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg3)"><input type="file" accept=".html,.htm" id="ai-file-upload" style="display:none"> HTML 파일 업로드</label>'
    +'<div style="flex:1"></div>'
    +'<button class="btn btn-ghost btn-sm" id="ai-paste-cancel">취소</button>'
    +'<button class="btn btn-primary btn-sm" id="ai-paste-save">저장 및 적용</button>'
    +'</div></div>';

  document.body.appendChild(wrap);
  var textArea = wrap.querySelector('#ai-text-area');

  // HTML 파일 업로드
  wrap.querySelector('#ai-file-upload').addEventListener('change', function(e){
    var file = e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      var content = ev.target.result;
      var bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      var styleMatch = content.match(/<style[\s\S]*?<\/style>/gi);
      var htmlContent = (styleMatch ? styleMatch.join('') : '') + (bodyMatch ? bodyMatch[1] : content);
      _applyInfAi(infName, { _fullHtml: htmlContent });
      wrap.remove();
    };
    reader.readAsText(file, 'UTF-8');
  });

  wrap.querySelector('#ai-paste-cancel').onclick = function(){ wrap.remove(); };
  wrap.querySelector('#ai-paste-save').onclick = function(){
    var raw = textArea.value.trim();
    if(!raw){ alert('내용을 붙여넣어 주세요.'); return; }
    // HTML 소스인지 판별 (<style 또는 <div 등 태그 포함)
    var isHtmlSource = /<(style|div|span|table|h[1-6])\b/i.test(raw);
    var parsed = isHtmlSource ? { _fullHtml: raw } : parseInfAiText(raw);
    _applyInfAi(infName, parsed);
    wrap.remove();
  };
  textArea.focus();
}

function _applyInfAi(infName, parsed){
  _infAiCache[infName] = parsed;
  saveInfAiToDb(infName, parsed);
  renderInfAiReport(infName, parsed);
  showToast('AI 분석 저장됨');
}

// ── HTML 파싱 (서식 유지) ──
function parseInfAiHtml(html, plainText){
  var result = {
    channelMetrics: '', audience: '', contentStyle: '',
    strengthRisk: '', pastCampaigns: '', mdSourcing: '',
    strategy: '', conclusion: '', _isHtml: true, _rawHtml: html
  };
  var sectionKeys = [
    {pattern: /채널\s*핵심\s*지표/i, key: 'channelMetrics'},
    {pattern: /플랫폼별\s*영향력/i, key: 'channelMetrics'},
    {pattern: /오디언스\s*분석/i, key: 'audience'},
    {pattern: /콘텐츠\s*스타일/i, key: 'contentStyle'},
    {pattern: /강점.*리스크|강점.*약점|강점.*주의/i, key: 'strengthRisk'},
    {pattern: /과거\s*캠페인|과거\s*레퍼런스|레퍼런스\s*분석/i, key: 'pastCampaigns'},
    {pattern: /소싱\s*제안|MD\s*상품|MD\s*소싱\s*제안/i, key: 'mdSourcing'},
    {pattern: /캠페인\s*전략|기대\s*효과/i, key: 'strategy'},
    {pattern: /종합\s*의견|결론|종합\s*평가|소싱\s*종합/i, key: 'conclusion'}
  ];

  // HTML을 임시 DOM에 파싱
  var tmp = document.createElement('div');
  tmp.innerHTML = html;

  // <style> 태그 추출 (나중에 렌더링 시 포함)
  var styleTag = '';
  tmp.querySelectorAll('style').forEach(function(s){ styleTag += s.outerHTML; s.remove(); });
  if(styleTag) result._styleHtml = styleTag;

  // 헤더 영역 추출 (첫 번째 section 전의 내용)
  var wrap = tmp.querySelector('.wrap') || tmp;
  var sections = wrap.querySelectorAll('.section');

  if(sections.length > 0){
    // .section 기반 파싱 (구조화된 HTML)
    sections.forEach(function(sec){
      var titleEl = sec.querySelector('.section-title');
      var titleText = titleEl ? titleEl.textContent.trim() : '';
      // section-title 제거 후 나머지가 내용
      var contentClone = sec.cloneNode(true);
      var titleClone = contentClone.querySelector('.section-title');
      if(titleClone) titleClone.remove();
      var contentHtml = contentClone.innerHTML.trim();

      sectionKeys.forEach(function(sk){
        if(sk.pattern.test(titleText)){
          // 같은 키에 이미 내용이 있으면 합침 (예: 채널지표 + 플랫폼 영향력)
          if(result[sk.key]) result[sk.key] += contentHtml;
          else result[sk.key] = contentHtml;
        }
      });
    });
  } else {
    // .section 없는 경우: 일반 노드 순회
    var currentKey = '';
    var currentBuf = [];
    function flushBuf(){ if(currentKey && currentBuf.length){ result[currentKey] = (result[currentKey]||'') + currentBuf.join(''); } currentBuf = []; }
    var children = Array.from(wrap.childNodes);
    children.forEach(function(node){
      var text = (node.textContent||'').trim();
      var matched = false;
      sectionKeys.forEach(function(sk){
        if(sk.pattern.test(text) && text.length < 80){
          flushBuf();
          currentKey = sk.key;
          matched = true;
        }
      });
      if(!matched && currentKey){
        currentBuf.push(node.nodeType===1 ? node.outerHTML : escHtml(node.textContent));
      }
    });
    flushBuf();
  }

  // 매칭 안 되면 텍스트 파싱 폴백
  var hasAny = Object.keys(result).some(function(k){ return k[0]!=='_' && result[k]; });
  if(!hasAny){
    var textParsed = parseInfAiText(plainText);
    Object.keys(textParsed).forEach(function(k){ result[k] = textParsed[k]; });
    result._isHtml = false;
  }

  return result;
}

// ── AI 텍스트 파싱 ──
function parseInfAiText(raw){
  // JSON 시도
  try {
    var j = JSON.parse(raw);
    if(j && typeof j === 'object') return j;
  } catch(e){}

  // 마크다운/텍스트 섹션 파싱
  var result = {
    channelMetrics: '', audience: '', contentStyle: '',
    strengthRisk: '', pastCampaigns: '', mdSourcing: '',
    strategy: '', conclusion: ''
  };
  var sectionKeys = [
    {pattern: /채널\s*핵심\s*지표/i, key: 'channelMetrics'},
    {pattern: /오디언스\s*분석/i, key: 'audience'},
    {pattern: /콘텐츠\s*스타일/i, key: 'contentStyle'},
    {pattern: /강점.*리스크|강점.*약점/i, key: 'strengthRisk'},
    {pattern: /과거\s*캠페인|레퍼런스/i, key: 'pastCampaigns'},
    {pattern: /소싱\s*제안|MD\s*상품/i, key: 'mdSourcing'},
    {pattern: /캠페인\s*전략|기대\s*효과/i, key: 'strategy'},
    {pattern: /종합\s*의견|결론/i, key: 'conclusion'}
  ];

  var lines = raw.split('\n');
  var currentKey = '';
  var currentBuf = [];

  lines.forEach(function(line){
    var matched = false;
    sectionKeys.forEach(function(sk){
      if(sk.pattern.test(line)){
        if(currentKey && currentBuf.length) result[currentKey] = currentBuf.join('\n').trim();
        currentKey = sk.key;
        currentBuf = [];
        matched = true;
      }
    });
    if(!matched && currentKey) currentBuf.push(line);
  });
  if(currentKey && currentBuf.length) result[currentKey] = currentBuf.join('\n').trim();

  // 섹션이 하나도 매칭 안되면 전체를 conclusion에
  var hasAny = Object.values(result).some(function(v){return v;});
  if(!hasAny) result.conclusion = raw;

  return result;
}

// ── Firebase 저장 ──
function saveInfAiToDb(infName, data){
  var key = infName.replace(/[.#$/[\]]/g,'_');
  // localStorage 백업
  try{ localStorage.setItem('infAi-'+key, JSON.stringify(data)); }catch(e){}
  // Firebase: 메인 DB 경로(fbRef) 하위에 저장 (권한 문제 회피)
  if(fbReady && fbRef){
    fbRef.child('infAiReports/'+key).set(data)
      .then(function(){ console.log('[saveInfAi] Firebase 저장 성공:', key); })
      .catch(function(e){ console.warn('[saveInfAi] Firebase 저장 실패:', e); });
  }
}
function loadInfAiFromDb(){
  // localStorage에서 먼저 로드
  try{
    for(var i=0; i<localStorage.length; i++){
      var k = localStorage.key(i);
      if(k && k.startsWith('infAi-')){
        var name = k.slice(6);
        var d = JSON.parse(localStorage.getItem(k));
        if(d) _infAiCache[name] = d;
      }
    }
  }catch(e){}
  // Firebase: 메인 DB 경로에서 로드
  if(fbReady && fbRef){
    fbRef.child('infAiReports').once('value',function(snap){
      var d=snap.val(); if(d){ Object.keys(d).forEach(function(k){ _infAiCache[k]=d[k]; }); }
    });
  }
}

// ── 8섹션 AI 리포트 렌더링 ──
function renderInfAiReport(infName, data){
  var body = document.getElementById('inf-detail-body');
  if(!body) return;

  // 기존 실적 데이터 HTML 생성
  function buildPerfHtml(){
    var inf = buildInfList().find(function(i){return i.name===infName;});
    if(!inf) return '';
    var lc = inf.latestCamp||{};
    var twoYearsAgo = new Date(); twoYearsAgo.setFullYear(twoYearsAgo.getFullYear()-2);
    var perfCamps = inf.campaigns.filter(function(c){ var s=c.start?new Date(c.start):null; return s&&s>=twoYearsAgo; }).sort(function(a,b){return (b.start||'')>(a.start||'')?1:-1;});
    var h = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">'
      +'<div style="background:var(--bg3);border-radius:8px;padding:12px;text-align:center"><div style="font-size:10.5px;color:var(--text3);margin-bottom:4px">수수료율</div><div style="font-weight:700;color:var(--accent2);font-size:15px">'+(lc.feeRate?lc.feeRate+'%':'-')+'</div></div>'
      +'<div style="background:var(--bg3);border-radius:8px;padding:12px;text-align:center"><div style="font-size:10.5px;color:var(--text3);margin-bottom:4px">원고료</div><div style="font-weight:700;color:var(--accent2);font-size:15px">'+(lc.feeAmount?(lc.feeAmount/10000).toFixed(0)+'만원':'-')+'</div></div>'
      +'<div style="background:var(--bg3);border-radius:8px;padding:12px;text-align:center"><div style="font-size:10.5px;color:var(--text3);margin-bottom:4px">카테고리</div><div style="font-weight:700;font-size:15px">'+(lc.cat||'-')+'</div></div></div>';
    if(perfCamps.length){
      h += '<div style="font-size:13px;font-weight:700;color:var(--text2);margin-bottom:8px">캠페인 실적 (최근 2년)</div>';
      h += '<table style="width:100%;margin-bottom:16px"><thead><tr style="background:var(--bg3)"><th style="padding:6px 8px;text-align:left;font-size:11px">캠페인명</th><th style="padding:6px 8px;text-align:left;font-size:11px">카테고리</th><th style="padding:6px 8px;text-align:right;font-size:11px">매출</th><th style="padding:6px 8px;text-align:right;font-size:11px">주문건수</th><th style="padding:6px 8px;text-align:right;font-size:11px">비용</th></tr></thead><tbody>';
      perfCamps.forEach(function(c){
        var rev=c.settleRevenue||0; var revS=rev>=1e8?(rev/1e8).toFixed(1)+'억':rev>=1e4?(rev/1e4).toFixed(0)+'만':rev>0?rev.toLocaleString():'-';
        var fr=parseFloat(c.feeRate)||0,fa=parseInt(c.feeAmount)||0,ar=parseFloat(c.agencyRate)||0,da=parseInt(c.settleDa)||0;
        var cost=Math.round(rev*fr/100)+fa+Math.round(rev*ar/100)+da;
        var costS=cost>=1e4?(cost/1e4).toFixed(0)+'만':cost>0?cost.toLocaleString():'-';
        h+='<tr style="font-size:12px"><td style="font-weight:600;padding:6px 8px">'+escHtml(c.name)+'</td><td style="color:var(--text3);padding:6px 8px">'+(c.cat||'-')+'</td><td style="color:var(--green);font-weight:700;text-align:right;padding:6px 8px">'+revS+'</td><td style="text-align:right;padding:6px 8px">'+(c.settleOrders||'-')+'</td><td style="color:var(--orange);text-align:right;padding:6px 8px">'+costS+'</td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '<div style="height:1px;background:var(--border);margin-bottom:16px"></div>';
    return h;
  }

  // 원본 HTML: iframe으로 격리 렌더링
  if(data._fullHtml){
    var iframeId = 'inf-ai-iframe-'+Date.now();
    body.innerHTML = buildPerfHtml()
      + '<iframe id="'+iframeId+'" style="width:100%;border:none;border-radius:8px;background:#fff" sandbox="allow-same-origin"></iframe>'
      + '<div style="display:flex;gap:8px;justify-content:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">'
      + '<button class="btn btn-ghost btn-xs" onclick="resetInfAi(\''+escHtml(infName)+'\')">분석 초기화</button>'
      + '<button class="btn btn-ghost btn-xs" onclick="pasteInfAi(\''+escHtml(infName)+'\')">다시 붙여넣기</button>'
      + '</div>';
    var iframe = document.getElementById(iframeId);
    var fullDoc = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      +':root{--color-text-primary:#1a1a1a;--color-text-secondary:#666;--color-text-tertiary:#999;--color-text-info:#185FA5;'
      +'--color-background-primary:#fff;--color-background-secondary:#f5f5f5;--color-background-info:#E6F1FB;'
      +'--color-border-tertiary:#e5e5e5;--border-radius-lg:12px;--border-radius-md:8px;'
      +'--font-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}'
      +'body{margin:0;padding:0;font-family:var(--font-sans);}'
      +'</style></head><body>'+data._fullHtml+'</body></html>';
    iframe.onload = function(){
      // iframe 높이를 내용에 맞게 조절
      try{
        var h = iframe.contentDocument.body.scrollHeight;
        iframe.style.height = (h+20)+'px';
      }catch(e){ iframe.style.height='600px'; }
    };
    iframe.srcdoc = fullDoc;
    return;
  }

  // 텍스트/JSON 파싱 데이터 렌더링 모드
  var isHtml = data._isHtml && Object.keys(data).some(function(k){ return k[0]!=='_' && data[k] && (typeof data[k]==='string') && data[k].match(/<[a-z]/i); });

  function sec(title, content){ return '<div style="margin-bottom:22px"><div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);letter-spacing:0.03em">'+title+'</div>'+content+'</div>'; }
  function card(inner){ return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:14px 16px">'+inner+'</div>'; }
  function htmlBlock(h){ return h ? '<div>'+h+'</div>' : '<div style="color:var(--text3);font-size:12px">데이터 없음</div>'; }
  function textBlock(txt){
    if(!txt) return '<div style="color:var(--text3);font-size:12px">데이터 없음</div>';
    if(typeof txt === 'string' && txt.match(/^<[a-z]/i)) return '<div style="font-size:12.5px;line-height:1.7">'+txt+'</div>';
    return '<div style="font-size:12.5px;line-height:1.7;color:var(--text2);white-space:pre-wrap">'+escHtml(txt).replace(/\*\*(.*?)\*\*/g,'<strong style="color:var(--text);font-weight:700">$1</strong>').replace(/^[•●]\s*/gm,'<span style="color:var(--accent)">● </span>').replace(/^[-–]\s*/gm,'<span style="color:var(--text3)">— </span>')+'</div>';
  }
  function renderBlock(val){ return isHtml ? htmlBlock(val) : card(textBlock(val)); }

  var html = '';
  // 원본 HTML 스타일 포함
  if(data._styleHtml) html += data._styleHtml;

  // 1. 채널 핵심 지표
  html += sec('채널 핵심 지표', renderBlock(data.channelMetrics));

  // 2. 오디언스 분석
  html += sec('오디언스 분석', renderBlock(data.audience));

  // 3. 콘텐츠 스타일 분석
  html += sec('콘텐츠 스타일 분석', renderBlock(data.contentStyle));

  // 4. 강점 & 리스크
  if(isHtml){
    html += sec('강점 & 리스크', htmlBlock(data.strengthRisk));
  } else {
    var srParts = (data.strengthRisk||'').split(/리스크|주의사항|약점/i);
    if(srParts.length >= 2){
      html += sec('강점 & 리스크', '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
        +card('<div style="font-size:12px;font-weight:700;color:var(--green);margin-bottom:8px">강점</div>'+textBlock(srParts[0]))
        +card('<div style="font-size:12px;font-weight:700;color:var(--orange);margin-bottom:8px">리스크 / 주의사항</div>'+textBlock(srParts[1]))
        +'</div>');
    } else {
      html += sec('강점 & 리스크', card(textBlock(data.strengthRisk)));
    }
  }

  // 5. 과거 캠페인 레퍼런스
  if(isHtml && data.pastCampaigns){
    html += sec('과거 레퍼런스 분석', htmlBlock(data.pastCampaigns));
  } else {
    var inf = buildInfList().find(function(i){return i.name===infName;});
    if(inf){
      var perfCamps = inf.campaigns.filter(function(c){ var s=c.start?new Date(c.start):null; var ty=new Date(); ty.setFullYear(ty.getFullYear()-2); return s&&s>=ty; }).sort(function(a,b){return (b.start||'')>(a.start||'')?1:-1;});
      if(perfCamps.length){
        var refHtml = '<table style="width:100%"><thead><tr style="background:var(--bg)"><th style="width:30px;padding:6px 8px;font-size:11px"></th><th style="padding:6px 8px;text-align:left;font-size:11px">제품 / 브랜드</th><th style="padding:6px 8px;font-size:11px">카테고리</th><th style="padding:6px 8px;font-size:11px">반응</th></tr></thead><tbody>';
        perfCamps.forEach(function(c, idx){
          var catColor = (c.cat||'').includes('식품')?'#d68910':(c.cat||'').includes('주방')?'#6c5ce7':(c.cat||'').includes('뷰티')?'#e1306c':'#00b894';
          var catBg = (c.cat||'').includes('식품')?'#fdcb6e33':(c.cat||'').includes('주방')?'#6c5ce722':(c.cat||'').includes('뷰티')?'#e1306c22':'#00b89422';
          var rev=c.settleRevenue||0; var reaction=rev>5e7?'완판':rev>1e7?'양호':rev>0?'보통':'데이터 미공개';
          var reactionColor=rev>5e7?'var(--green)':rev>1e7?'var(--blue)':rev>0?'var(--text2)':'var(--text3)';
          refHtml += '<tr><td style="padding:8px;text-align:center"><span style="background:var(--accent);color:#fff;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">'+(idx+1)+'</span></td>'
            +'<td style="padding:8px"><div style="font-weight:700;font-size:12.5px">'+escHtml(c.name)+'</div></td>'
            +'<td style="padding:8px;text-align:center"><span style="background:'+catBg+';color:'+catColor+';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">'+(c.cat||'-')+'</span></td>'
            +'<td style="padding:8px;text-align:center;font-weight:700;font-size:12px;color:'+reactionColor+'">'+reaction+'</td></tr>';
        });
        refHtml += '</tbody></table>';
        html += sec('과거 레퍼런스 분석', card(refHtml));
      }
    }
    if(data.pastCampaigns) html += sec('과거 캠페인 상세', card(textBlock(data.pastCampaigns)));
  }

  // 6. MD 소싱 제안
  html += sec('MD 소싱 제안 (우선순위 순)', renderBlock(data.mdSourcing));

  // 7. 캠페인 전략 및 기대 효과
  if(data.strategy) html += sec('캠페인 전략 및 기대 효과', renderBlock(data.strategy));

  // 8. 종합 의견 및 결론
  html += sec('MD 소싱 종합 의견', renderBlock(data.conclusion));

  // 하단 버튼
  html += '<div style="display:flex;gap:8px;justify-content:center;margin-top:10px">'
    +'<button class="btn btn-ghost btn-xs" onclick="resetInfAi(\''+escHtml(infName)+'\')">분석 초기화</button>'
    +'<button class="btn btn-ghost btn-xs" onclick="pasteInfAi(\''+escHtml(infName)+'\')">다시 붙여넣기</button>'
    +'</div>';

  body.innerHTML = html;
}
// PDF 다운로드 (새 창에서 인쇄)
function downloadInfPdf(infName){
  var body = document.getElementById('inf-detail-body');
  if(!body) return;

  // 캐시된 AI 분석 데이터에서 직접 HTML 추출
  var cached = _infAiCache[infName];
  var aiHtml = '';
  if(cached && cached._fullHtml){
    aiHtml = cached._fullHtml;
  } else if(cached){
    // 텍스트 모드: body 내용 복사
    var clone = body.cloneNode(true);
    clone.querySelectorAll('button').forEach(function(b){ b.remove(); });
    aiHtml = clone.innerHTML;
  }

  // 기존 실적 데이터 (buildPerfHtml 재사용 불가하므로 직접 생성)
  var inf = buildInfList().find(function(i){return i.name===infName;});
  var perfHtml = '';
  if(inf){
    var lc = inf.latestCamp||{};
    perfHtml += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">'
      +'<div style="background:#f5f5f5;border-radius:8px;padding:12px;text-align:center"><div style="font-size:10.5px;color:#999;margin-bottom:4px">수수료율</div><div style="font-weight:700;font-size:15px">'+(lc.feeRate?lc.feeRate+'%':'-')+'</div></div>'
      +'<div style="background:#f5f5f5;border-radius:8px;padding:12px;text-align:center"><div style="font-size:10.5px;color:#999;margin-bottom:4px">원고료</div><div style="font-weight:700;font-size:15px">'+(lc.feeAmount?(lc.feeAmount/10000).toFixed(0)+'만원':'-')+'</div></div>'
      +'<div style="background:#f5f5f5;border-radius:8px;padding:12px;text-align:center"><div style="font-size:10.5px;color:#999;margin-bottom:4px">카테고리</div><div style="font-weight:700;font-size:15px">'+(lc.cat||'-')+'</div></div></div>';
  }

  var printWin = window.open('','_blank');
  printWin.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+escHtml(infName)+' 인플루언서 분석</title>'
    +'<style>'
    +':root{--color-text-primary:#1a1a1a;--color-text-secondary:#666;--color-text-tertiary:#999;--color-text-info:#185FA5;'
    +'--color-background-primary:#fff;--color-background-secondary:#f5f5f5;--color-background-info:#E6F1FB;'
    +'--color-border-tertiary:#e5e5e5;--border-radius-lg:12px;--border-radius-md:8px;'
    +'--font-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}'
    +'*{box-sizing:border-box;margin:0;padding:0;}'
    +'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:24px;color:#1a1a1a;font-size:13px;line-height:1.6;}'
    +'table{width:100%;border-collapse:collapse;}th,td{padding:6px 8px;text-align:left;border-bottom:1px solid #eee;}'
    +'@media print{body{padding:12px;} @page{margin:15mm;}}'
    +'</style></head><body>'
    +'<h2 style="margin-bottom:4px">'+escHtml(infName)+'</h2>'
    +'<div style="height:1px;background:#ddd;margin:12px 0"></div>'
    +perfHtml+aiHtml
    +'</body></html>');
  printWin.document.close();
  setTimeout(function(){ printWin.print(); }, 500);
}

function resetInfAi(infName){
  delete _infAiCache[infName];
  var key = infName.replace(/[.#$/[\]]/g,'_');
  try{ localStorage.removeItem('infAi-'+key); }catch(e){}
  try{ if(fbReady&&fbRef) fbRef.child('infAiReports/'+key).remove(); }catch(e){}
  // 모달 다시 열기 (초기화 상태로)
  openInfDetail(infName);
  showToast('AI 분석 초기화됨');
}
function filterInfs(v2){ infFilter.text=v2; renderInfs(); }
function setCat(c){ infFilter.cat=c; renderInfs(); }


// ═══════════════════════════════════════
// 캠페인 복사하기 팝업
// ═══════════════════════════════════════
var _copyCampType = ''; // 현재 복사 모달에서 필터링하는 캠페인 유형
var _copyCampRebroadcast = false; // 재방등록 모드

function openCopyCampModal(campType){
  _copyCampType = campType || '';
  _copyCampRebroadcast = false;
  _showCopyCampModal();
}

function openRebroadcastModal(){
  _copyCampType = '모바일라이브';
  _copyCampRebroadcast = true;
  _showCopyCampModal();
}

function _showCopyCampModal(){
  var existing = document.getElementById('copy-camp-modal');
  if(existing) existing.remove();

  var title = _copyCampRebroadcast ? '🔄 재방등록 — 원본 M라이브 선택' :
              _copyCampType === '모바일라이브' ? '📋 M라이브 복사 — 원본 선택' : '📋 캠페인 불러오기';

  var el = document.createElement('div');
  el.id = 'copy-camp-modal';
  el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.30);z-index:99999;display:flex;align-items:center;justify-content:center';

  el.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r-lg);padding:0;min-width:560px;max-width:700px;width:100%;max-height:80vh;display:flex;flex-direction:column">'
    + '<div style="padding:20px 24px 16px;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between">'
    + '<div style="font-size:16px;font-weight:800">'+title+'</div>'
    + '<button class="btn btn-ghost btn-xs" onclick="document.getElementById(&quot;copy-camp-modal&quot;).remove()">✕</button>'
    + '</div>'
    + '<div style="padding:14px 24px;border-bottom:1px solid var(--border2)">'
    + '<input class="inp" id="copy-camp-search" placeholder="캠페인명 또는 편성코드 검색..." oninput="filterCopyCamps(this.value)" style="width:100%">'
    + '</div>'
    + '<div id="copy-camp-list" style="overflow-y:auto;max-height:50vh;padding:8px 0"></div>'
    + '</div>';

  document.body.appendChild(el);
  renderCopyCampList('');
}

function renderCopyCampList(keyword){
  var list = DB.campaigns.filter(function(camp){
    // 캠페인 유형 필터
    if(_copyCampType){
      var ct = camp.campType || '인플루언서';
      if(ct !== _copyCampType) return false;
    }
    return !keyword || (camp.name||'').includes(keyword) || (camp.appMkt&&String(camp.appMkt.liveCode||'')).includes(keyword);
  }).sort(function(a,b){ return (b.start||'') > (a.start||'') ? 1 : -1; });

  var el = document.getElementById('copy-camp-list');
  if(!el) return;

  if(!list.length){
    el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text3)">검색 결과 없음</div>';
    return;
  }

  var btnLabel = _copyCampRebroadcast ? '재방등록' : '복사';

  el.innerHTML = list.map(function(camp){
    var isMlive = (camp.campType||'') === '모바일라이브';
    var roleColor = camp.role==='메가'?'var(--pink)':camp.role==='앵콜'?'var(--orange)':camp.role==='미들'?'var(--blue)':'var(--green)';
    var roleBg    = camp.role==='메가'?'var(--pink-bg)':camp.role==='앵콜'?'var(--orange-bg)':camp.role==='미들'?'var(--blue-bg)':'var(--green-bg)';
    var revStr = camp.revenue ? (camp.revenue/100000000).toFixed(1)+'억' : '-';
    var dateStr = ((camp.start||'-').slice(5)) + ' ~ ' + ((camp.end||'-').slice(5));
    var codeStr = isMlive && camp.appMkt && camp.appMkt.liveCode ? '<span style="font-family:monospace;color:var(--accent2)">'+escHtml(camp.appMkt.liveCode)+'</span>' : '';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-bottom:1px solid var(--border2);cursor:pointer;transition:background .15s" '
      + 'class="copy-camp-item" '
      + 'onclick="copyCampData('+camp.id+','+_copyCampRebroadcast+')">'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-weight:700;font-size:13.5px;margin-bottom:4px">'+(isMlive?'📺 ':'')+escHtml(camp.name||'-')+'</div>'
      + '<div style="display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--text3)">'
      + (camp.role ? '<span style="background:'+roleBg+';color:'+roleColor+';padding:1px 7px;border-radius:20px;font-size:11px;font-weight:700">'+camp.role+'</span>' : '')
      + '<span>'+dateStr+'</span>'
      + '<span style="color:var(--green);font-weight:600">'+revStr+'</span>'
      + codeStr
      + (camp.mdcat ? '<span>MDCAT: '+camp.mdcat+'</span>' : '')
      + '</div>'
      + '</div>'
      + '<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();copyCampData('+camp.id+','+_copyCampRebroadcast+')" style="margin-left:16px;white-space:nowrap">'+btnLabel+'</button>'
      + '</div>';
  }).join('');
}

function filterCopyCamps(keyword){
  renderCopyCampList(keyword);
}

// ── M라이브 편성코드 검색 팝업 (인플루언서 캠페인에서 M-live 연결) ──
function openMliveCodePicker(){
  var existing = document.getElementById('mlive-code-picker');
  if(existing) existing.remove();
  var el = document.createElement('div');
  el.id = 'mlive-code-picker';
  el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.30);z-index:99999;display:flex;align-items:center;justify-content:center';
  el.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r-lg);padding:0;min-width:560px;max-width:700px;width:100%;max-height:80vh;display:flex;flex-direction:column">'
    +'<div style="padding:20px 24px 16px;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:16px;font-weight:800">📺 M라이브 편성코드 선택</div>'
    +'<button class="btn btn-ghost btn-xs" onclick="document.getElementById(\'mlive-code-picker\').remove()">✕</button>'
    +'</div>'
    +'<div style="padding:14px 24px;border-bottom:1px solid var(--border2)">'
    +'<input class="inp" id="mlive-code-picker-search" placeholder="캠페인명 또는 편성코드 검색..." oninput="renderMliveCodePickerList(this.value)" style="width:100%">'
    +'</div>'
    +'<div id="mlive-code-picker-list" style="overflow-y:auto;max-height:50vh;padding:8px 0"></div>'
    +'</div>';
  document.body.appendChild(el);
  renderMliveCodePickerList('');
}

function renderMliveCodePickerList(keyword){
  var kw = (keyword||'').toLowerCase();
  var list = DB.campaigns.filter(function(c){
    if((c.campType||'')!=='모바일라이브') return false;
    if(!c.appMkt || !c.appMkt.liveCode) return false;
    if(kw && !(c.name||'').toLowerCase().includes(kw) && !String(c.appMkt.liveCode).includes(kw)) return false;
    return true;
  }).sort(function(a,b){ return (b.start||'')>(a.start||'')?1:-1; });
  var el = document.getElementById('mlive-code-picker-list');
  if(!el) return;
  if(!list.length){
    el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text3)">등록된 M라이브 편성코드 없음</div>';
    return;
  }
  el.innerHTML = list.map(function(c){
    var code = c.appMkt.liveCode;
    var liveDt = c.appMkt.liveDt || c.start || '';
    var dtStr = liveDt ? liveDt.replace('T',' ').slice(0,16) : '-';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-bottom:1px solid var(--border2);cursor:pointer;transition:background .15s" '
      +'onclick="pickMliveCode(\''+escHtml(code)+'\',\''+escHtml(liveDt)+'\')" '
      +'onmouseover="this.style.background=\'var(--bg3)\'" onmouseout="this.style.background=\'\'">'
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-weight:700;font-size:13.5px;margin-bottom:4px">📺 '+escHtml(c.name||'-')+'</div>'
      +'<div style="display:flex;align-items:center;gap:10px;font-size:11.5px;color:var(--text3)">'
      +'<span style="font-family:monospace;font-weight:700;color:var(--accent2)">'+escHtml(code)+'</span>'
      +'<span>'+dtStr+'</span>'
      +'<span style="color:var(--green);font-weight:600">'+(c.revenue?(c.revenue/100000000).toFixed(1)+'억':'-')+'</span>'
      +'</div></div>'
      +'<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();pickMliveCode(\''+escHtml(code)+'\',\''+escHtml(liveDt)+'\')" style="margin-left:16px;white-space:nowrap">선택</button>'
      +'</div>';
  }).join('');
}

function pickMliveCode(code, liveDt){
  // 복수 편성코드: 태그로 추가
  addMliveCodeTagValue(code);
  var dtEl = document.getElementById('appmkt-live-dt');
  if(dtEl && liveDt && !dtEl.value) dtEl.value = liveDt;
  var modal = document.getElementById('mlive-code-picker');
  if(modal) modal.remove();
  updateTotalRevLabel();
  showToast('편성코드 '+code+' 추가');
}
// ── 복수 편성코드 태그 관리 ──
var _mliveCodes = []; // 현재 등록된 편성코드 배열
function addMliveCodeTag(){
  var inp = document.getElementById('appmkt-live-code');
  var code = (inp?.value||'').trim();
  if(!code) return;
  addMliveCodeTagValue(code);
  if(inp) inp.value = '';
}
function addMliveCodeTagValue(code){
  if(!code || _mliveCodes.indexOf(code)>=0) return;
  _mliveCodes.push(code);
  renderMliveCodeTags();
  updateTotalRevLabel();
}
function removeMliveCodeTag(code){
  _mliveCodes = _mliveCodes.filter(function(c){ return c!==code; });
  renderMliveCodeTags();
  updateTotalRevLabel();
}
function renderMliveCodeTags(){
  var wrap = document.getElementById('appmkt-live-codes-tags');
  if(!wrap) return;
  if(!_mliveCodes.length){ wrap.innerHTML=''; return; }
  wrap.innerHTML = _mliveCodes.map(function(code){
    return '<span style="display:inline-flex;align-items:center;gap:4px;background:var(--accent-bg);border:1px solid var(--accent);color:var(--accent2);padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;font-family:monospace">'
      +escHtml(code)
      +'<span onclick="removeMliveCodeTag(\''+escHtml(code)+'\')" style="cursor:pointer;font-size:13px;color:var(--red);margin-left:2px" title="삭제">&times;</span>'
      +'</span>';
  }).join('');
}

function copyCampData(campId, rebroadcast){
  var p = DB.campaigns.find(function(x){return x.id===campId;});
  if(!p) return;

  // 기존 등록 모달 초기화
  document.getElementById('p-edit-id').value = '';
  document.getElementById('prod-mo-title').textContent = rebroadcast ? '재방등록' : '캠페인 등록';
  document.getElementById('prod-save-btn').textContent = '캠페인 등록';

  // 캠페인 유형 복원
  var isMlive = (p.campType||'') === '모바일라이브';
  var ctInf = document.getElementById('p-camptype-inf');
  var ctMl  = document.getElementById('p-camptype-mlive');
  if(ctInf) ctInf.checked = !isMlive;
  if(ctMl)  ctMl.checked  = isMlive;
  updateCampTypeUI();

  // 캠페인명 복사 (재방등록 시 "다시보는" 접두어)
  var campName = p.name||'';
  if(rebroadcast && !campName.startsWith('다시보는')) campName = '다시보는 ' + campName;
  document.getElementById('p-name').value = campName;
  // 날짜도 비워둠
  var startEl = document.getElementById('p-start'); if(startEl) startEl.value='';
  var endEl   = document.getElementById('p-end');   if(endEl)   endEl.value='';

  // 나머지 정보 복사
  var flds = ['p-company','p-brand','p-cat','p-appeal','p-mdcat','p-mcn','p-inf-name','p-pd-single','p-youtube-ch','p-insta-ch','p-twitter-ch'];
  var vals = {
    'p-company': p.company||'', 'p-brand': p.brand||'', 'p-cat': p.cat||'',
    'p-appeal': p.appeal||'',   'p-mdcat': p.mdcat||'', 'p-mcn': p.mcn||'',
    'p-inf-name': p.infName||'', 'p-pd-single': (p.pds&&p.pds[0])||'',
    'p-youtube-ch': (p.channels&&p.channels.youtube)||'',
    'p-insta-ch':   (p.channels&&p.channels.insta)||'',
    'p-twitter-ch': (p.channels&&p.channels.twitter)||'',
  };
  flds.forEach(function(id){ var el=document.getElementById(id); if(el) el.value=vals[id]||''; });

  // 금액 복사
  var revEl = document.getElementById('p-revenue'); if(revEl) revEl.value = p.revenue ? p.revenue.toLocaleString('ko-KR') : '';
  var budEl = document.getElementById('p-budget');  if(budEl) budEl.value = p.budget  ? p.budget.toLocaleString('ko-KR')  : '';
  var mpEl  = document.getElementById('p-market-price'); if(mpEl) mpEl.value = p.marketPrice ? p.marketPrice.toLocaleString('ko-KR') : '';
  var gpEl  = document.getElementById('p-group-price');  if(gpEl) gpEl.value = p.groupPrice  ? p.groupPrice.toLocaleString('ko-KR')  : '';
  var faEl  = document.getElementById('p-fee-amount'); if(faEl) faEl.value = p.feeAmount ? p.feeAmount.toLocaleString('ko-KR') : '';
  var frEl  = document.getElementById('p-fee-rate');   if(frEl) frEl.value = p.feeRate||'';
  var arEl  = document.getElementById('p-agency-rate'); if(arEl) arEl.value = p.agencyRate||'';

  // 인플루언서 규모
  var infSel = document.getElementById('p-inf-size');
  if(infSel){ for(var i=0;i<infSel.options.length;i++){ if(infSel.options[i].value===p.infSize){ infSel.selectedIndex=i; break; } } }

  // 캠페인 역할
  document.querySelectorAll('input[name="p-role"]').forEach(function(r){ r.checked=(r.value===p.role); });
  updateProdRoleLabels();

  // 목표 인원
  var tgtEl = document.getElementById('p-target'); if(tgtEl) tgtEl.value = p.target||'';

  // 프로모션
  document.querySelectorAll('.p-promo-cb').forEach(function(cb){ cb.checked=(p.promos||[]).includes(cb.value); });
  var ptEl2 = document.getElementById('p-promo-text'); if(ptEl2) ptEl2.value = p.promoText||'';

  // 채널 필드 표시
  var chYt = document.getElementById('ch-youtube'); if(chYt) chYt.checked=!!(p.channels&&p.channels.youtube);
  var chIg = document.getElementById('ch-insta');   if(chIg) chIg.checked=!!(p.channels&&p.channels.insta);
  var cyf  = document.getElementById('ch-youtube-field'); if(cyf) cyf.style.display=(p.channels&&p.channels.youtube)?'block':'none';
  var cif2 = document.getElementById('ch-insta-field');   if(cif2) cif2.style.display=(p.channels&&p.channels.insta)?'block':'none';

  // 확정사유 / 샘플 초기화
  document.querySelectorAll('.bas-reason-cb,.c-reason-cb').forEach(function(cb){ cb.checked=false; });
  var ssEl = document.getElementById('p-sample-sent'); if(ssEl) ssEl.checked=false;
  var saElC = document.getElementById('p-sample-address'); if(saElC) saElC.value=p.sampleAddress||'';
  var csElC = document.getElementById('p-cs-info'); if(csElC){ csElC.value=p.csInfo||DEFAULT_CS_INFO; csElC.nextElementSibling.textContent=(p.csInfo||DEFAULT_CS_INFO).length+'/500'; }
  var diElC = document.getElementById('p-delivery-info'); if(diElC){ diElC.value=p.deliveryInfo||''; diElC.nextElementSibling.textContent=(p.deliveryInfo||'').length+'/300'; }

  // SKU 복사
  var skuContainer = document.getElementById('sku-list');
  if(skuContainer){
    skuContainer.innerHTML='';
    if(p.skus && p.skus.length){
      p.skus.forEach(function(sku){ addSkuRow(sku); });
    } else {
      addSkuRow();
    }
  }

  // 쇼호스트 복사 (M라이브)
  var hosts = p.showhosts||{};
  searchSelSetValue('p-host-req1',  hosts.req1||'');
  searchSelSetValue('p-host-req2',  hosts.req2||'');
  searchSelSetValue('p-host-conf1', hosts.conf1||'');
  searchSelSetValue('p-host-conf2', hosts.conf2||'');

  // APP 마케팅 복원 (재방은 복사하지 않음)
  if(!rebroadcast){
    var appMkt = p.appMkt||{};
    document.querySelectorAll('.appmkt-cb').forEach(function(cb){ cb.checked=(appMkt.channels||[]).includes(cb.value); });
    var naCk4=document.getElementById('appmkt-na'); if(naCk4) naCk4.checked=!!(appMkt.na);
    toggleAppMktNa();
  } else {
    // 재방: 모바일마케팅 초기화
    document.querySelectorAll('.appmkt-cb').forEach(function(cb){ cb.checked=false; });
    var naCk4=document.getElementById('appmkt-na'); if(naCk4) naCk4.checked=false;
    // 재방: 정산 항목 초기화
    var sdaEl=document.getElementById('p-settle-da'); if(sdaEl) sdaEl.value='';
    var miEl2=document.getElementById('p-marketing-items'); if(miEl2) miEl2.value='';
    var prEl2=document.getElementById('p-profit-rate'); if(prEl2) prEl2.value='';
    var aiEl2=document.getElementById('p-ad-income'); if(aiEl2) aiEl2.value='';
    var trEl2=document.getElementById('p-total-revenue'); if(trEl2) trEl2.value='';
    var orEl2=document.getElementById('p-onair-revenue'); if(orEl2) orEl2.value='';
    var ofEl2=document.getElementById('p-offair-revenue'); if(ofEl2) ofEl2.value='';
    var sdoneEl2=document.getElementById('p-settle-done'); if(sdoneEl2) sdoneEl2.checked=false;
    // 재방: APP PUSH 초기화
    var prReset=document.getElementById('p-push-reason'); if(prReset) prReset.value='';
    var paEl2=document.getElementById('p-push-appeal'); if(paEl2) paEl2.value='';
    var pcEl2=document.getElementById('p-push-content'); if(pcEl2) pcEl2.value='';
    var plEl2=document.getElementById('p-push-landing-base'); if(plEl2) plEl2.value='';
    updatePushLandingPreview();
  }
  toggleAppMktFields();
  var alc3=document.getElementById('appmkt-live-code'); if(alc3) alc3.value=''; // 편성코드는 비움 (새 방송이므로)
  var ld3=document.getElementById('appmkt-live-dt');    if(ld3)  ld3.value='';

  // priceGrid는 sku에 통합됐으므로 별도 렌더 불필요
  initSections(false);

  // 복사 팝업 닫기
  var modal = document.getElementById('copy-camp-modal');
  if(modal) modal.remove();

  var msg = rebroadcast ? '재방 정보를 불러왔습니다. 편성코드와 방송일시를 입력해주세요.' : '캠페인 정보를 불러왔습니다. 캠페인명과 날짜를 입력해주세요.';
  showToast(msg);
}

// ═══════════════════════════════════════
// S7: 성과분석
// ═══════════════════════════════════════
var s7Filter = 'done';
var s8Type = 'all'; // all | mlive | inf
var s8Period = 'month'; // month | week

function setS8Period(val){
  s8Period = val;
  document.querySelectorAll('[name="s8-period"]').forEach(function(r){ r.closest('.filter-radio').classList.toggle('active', r.value===val); });
  // 월/주 입력 전환
  var mFrom=document.getElementById('s7-date-from'), mTo=document.getElementById('s7-date-to');
  var wFrom=document.getElementById('s8-week-from'), wTo=document.getElementById('s8-week-to'), wSep=document.getElementById('s8-week-sep');
  var wkDrop=document.getElementById('s8-week-dropdown');
  if(val==='week'){
    if(mFrom) mFrom.style.display='none'; if(mTo) mTo.style.display='none';
    if(wFrom) wFrom.style.display=''; if(wTo) wTo.style.display=''; if(wSep) wSep.style.display='';
    if(wkDrop) wkDrop.style.display='none';
    // 기본값 세팅 (현재 주~다음 주)
    var now=new Date(), yr=now.getFullYear();
    var jan1=new Date(yr,0,1), wn=Math.ceil(((now-jan1)/86400000+jan1.getDay()+1)/7);
    if(wFrom&&!wFrom.value) wFrom.value=yr+'-W'+String(wn).padStart(2,'0');
    if(wTo&&!wTo.value) wTo.value=yr+'-W'+String(wn+1).padStart(2,'0');
  } else {
    if(mFrom) mFrom.style.display=''; if(mTo) mTo.style.display='';
    if(wFrom) wFrom.style.display='none'; if(wTo) wTo.style.display='none'; if(wSep) wSep.style.display='none';
    if(wkDrop) wkDrop.style.display='flex';
  }
  renderReports();
}

// 주 input → 날짜 범위 변환
function getWeekRange(weekStr){
  // '2026-W13' → {from:'2026-03-23', to:'2026-03-29'}
  if(!weekStr) return null;
  var parts=weekStr.split('-W');
  if(parts.length!==2) return null;
  var yr=parseInt(parts[0]), wn=parseInt(parts[1]);
  var jan1=new Date(yr,0,1);
  var dayOffset=(jan1.getDay()<=4?jan1.getDay()-1:jan1.getDay()-8);
  var monday=new Date(yr,0,1+(wn-1)*7-dayOffset);
  var sunday=new Date(monday); sunday.setDate(monday.getDate()+6);
  var fmt=function(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  return {from:fmt(monday), to:fmt(sunday)};
}
var _mliveData = []; // 모바일라이브 업로드 데이터
var _monthlyTargets = {}; // 월별 목표 {2026-03: {mlive:금액, inf:금액}, ...}

// 월별 목표 엑셀 업로드 (A:연월, B:M라이브목표, C:인플루언서목표)
function uploadMonthlyTarget(input){
  var file = input.files[0]; if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    var data = new Uint8Array(e.target.result);
    var wb = XLSX.read(data, {type:'array', cellDates:false});
    var ws = wb.Sheets[wb.SheetNames[0]];
    var rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:'', raw:true});
    var pInt = function(v){ return parseInt(String(v||'').replace(/[^0-9\-]/g,''))||0; };
    _monthlyTargets = {};
    rows.forEach(function(r){
      var ym = String(r[0]||'').trim();
      if(ym.match(/^\d{4}[-\/]?\d{2}$/)){
        var key = ym.replace(/\//g,'-');
        if(key.length===6) key = key.slice(0,4)+'-'+key.slice(4);
        _monthlyTargets[key] = { mlive: pInt(r[1]), inf: pInt(r[2]) };
      }
    });
    console.log('[목표] 월별 목표:', JSON.stringify(_monthlyTargets));
    console.log('[목표] 원시 첫행:', rows[0], '둘째행:', rows[1]);
    // Firebase에 저장
    if(fbReady && fbRef){
      fbRef.child('monthlyTargets').set(_monthlyTargets)
        .then(function(){ console.log('[목표] Firebase 저장 성공'); })
        .catch(function(e){ console.warn('[목표] Firebase 저장 실패:', e); });
    }
    showToast('월별 목표 '+Object.keys(_monthlyTargets).length+'개월 로드됨');
    renderReports();
  };
  reader.readAsArrayBuffer(file);
  input.value = '';
}

// 월별 목표 양식 다운로드
// 월 목표 Firebase 로드
function loadTargetsFromDb(){
  if(!fbReady || !fbRef) return;
  fbRef.child('monthlyTargets').once('value', function(snap){
    var d = snap.val();
    if(d){ _monthlyTargets = d; console.log('[목표] Firebase 로드:', JSON.stringify(d)); }
  });
}

function downloadTargetTemplate(){
  var ws_data = [
    ['연월','M라이브 목표(원)','인플루언서 목표(원)'],
    ['2026-03', 300000000, 200000000],
    ['2026-04', 400000000, 250000000],
  ];
  var ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!cols'] = [{wch:12},{wch:20},{wch:20}];
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '월별목표');
  XLSX.writeFile(wb, '월별목표_양식.xlsx');
}

function setS8Type(val){
  s8Type = val;
  document.querySelectorAll('[name="s8-type"]').forEach(function(r){ r.closest('.filter-radio').classList.toggle('active', r.value===val); });
  renderReports();
}

// 모바일라이브 엑셀(CSV) 업로드
function uploadMliveExcel(input){
  var file = input.files[0]; if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    var data = new Uint8Array(e.target.result);
    var wb = XLSX.read(data, {type:'array', cellDates:false});
    var ws = wb.Sheets[wb.SheetNames[0]];
    var rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:'', raw:true});
    console.log('[M라이브] 시트:', wb.SheetNames[0], '총행:', rows.length);

    _mliveData = [];
    var skipped = 0;

    // 헤더 행에서 컬럼 인덱스 자동 매핑
    var colMap = {};
    var headerKeywords = {
      '순주문수량':null, '순주문금액':null, '주문이익율':null, '주문이익액':null,
      '총시청자수':null, '프로그램명':null, '방송구분':null, '방송일자':null,
      '대표담당MD':null, '시작':null, '종료':null, '마케팅':null, '광고수익':null
    };
    for(var hi=0; hi<Math.min(10,rows.length); hi++){
      var hrow = rows[hi];
      for(var hj=0; hj<hrow.length; hj++){
        var hv = String(hrow[hj]||'').trim();
        if(hv in headerKeywords && headerKeywords[hv]===null) headerKeywords[hv]=hj;
        // 부분 매칭도 시도
        if(headerKeywords['마케팅']===null && hv.includes('마케팅')) headerKeywords['마케팅']=hj;
        if(headerKeywords['광고수익']===null && hv.includes('광고수익')) headerKeywords['광고수익']=hj;
      }
    }
    console.log('[M라이브] 헤더 매핑:', JSON.stringify(headerKeywords));

    // 헤더 기반 인덱스 (폴백: 고정 인덱스)
    var CI = {
      code:0, broadcastType:headerKeywords['방송구분']||2, date:headerKeywords['방송일자']||3,
      md:headerKeywords['대표담당MD']||7, program:headerKeywords['프로그램명']||9,
      start:headerKeywords['시작']||10, end:headerKeywords['종료']||11,
      orderQty:headerKeywords['순주문수량']||12, orderAmt:headerKeywords['순주문금액']||13,
      profitAmt:headerKeywords['주문이익액']!=null?headerKeywords['주문이익액']:19,
      profitRate:headerKeywords['주문이익율']!=null?headerKeywords['주문이익율']:20,
      viewers:headerKeywords['총시청자수']!=null?headerKeywords['총시청자수']:21,
      mktFee:headerKeywords['마케팅']!=null?headerKeywords['마케팅']:87,
      adRev:headerKeywords['광고수익']!=null?headerKeywords['광고수익']:88,
    };
    console.log('[M라이브] 컬럼 인덱스:', JSON.stringify(CI));
    // 첫 데이터행 원시값 디버그 (V열 위치 확인용)
    for(var di=0; di<rows.length; di++){
      var dr=rows[di]; var dc=String(dr[0]||'').trim();
      if(dc.match(/^\d{6,}/)){
        console.log('[M라이브] 첫 데이터행 idx '+di+' 컬럼 18~25:', JSON.stringify([dr[18],dr[19],dr[20],dr[21],dr[22],dr[23],dr[24],dr[25]]));
        console.log('[M라이브] 헤더 profitRate idx='+CI.profitRate+' 값='+dr[CI.profitRate]);
        break;
      }
    }
    var pInt = function(v){ return parseInt(String(v||'').replace(/[^0-9\-]/g,''))||0; };
    var pFlt = function(v){ return parseFloat(String(v||'').replace(/[^0-9.\-]/g,''))||0; };

    for(var i=0; i<rows.length; i++){
      var r = rows[i];
      var code = String(r[0]||'').trim();
      if(!code.match(/^\d{6,}/)) { skipped++; continue; }

      // 방송일자 파싱 (CI.date)
      var dateVal = r[CI.date]||'';
      var dateStr = '';
      if(dateVal instanceof Date){
        dateStr = dateVal.getFullYear()+'-'+String(dateVal.getMonth()+1).padStart(2,'0')+'-'+String(dateVal.getDate()).padStart(2,'0');
      } else if(typeof dateVal==='number'){
        var d = new Date((dateVal - 25569) * 86400000);
        dateStr = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      } else {
        dateStr = String(dateVal).trim().replace(/\//g,'-');
      }

      _mliveData.push({
        code: code,
        date: dateStr,
        day: String(r[CI.date+1]||'').trim(),
        broadcastType: String(r[CI.broadcastType]||'').trim(),
        programName: String(r[CI.program]||'').trim(),
        startTime: String(r[CI.start]||'').trim(),
        endTime: String(r[CI.end]||'').trim(),
        orderQty: pInt(r[CI.orderQty]),
        orderAmt: pInt(r[CI.orderAmt]),
        targetAmt: pInt(r[CI.orderAmt+1]),
        // 주문이익율 (V열 = 헤더 자동매핑)
        _profitRateRaw: pFlt(r[CI.profitRate]),
        profitRate: 0,
        profitAmt: 0,
        viewers: pInt(r[CI.viewers]),
        mobOrderQty: pInt(r[70]),       // 모바일 순주문수량 (71st)
        mobOrderAmt: pInt(r[71]),       // 모바일 순주문금액 (72nd)
        dealCode: String(r[66]||'').trim(),  // 딜코드 (BO열, 67th=idx66)
        mdName: String(r[84]||r[CI.md]||'').trim(),
        mdCat: String(r[85]||'').trim(),
        cat: String(r[86]||'').trim(),
        marketingFee: pInt(r[CI.mktFee]),
        adRevenue: pInt(r[CI.adRev]),
      });
    }
    // 광고수익 디버그
    if(_mliveData.length>0){
      var s0=_mliveData[0];
      console.log('[M라이브] 마케팅비 idx='+CI.mktFee+' 값:'+s0.marketingFee+' 광고수익 idx='+CI.adRev+' 값:'+s0.adRevenue);
    }
    // 수식 기반 한계이익 계산
    // M라이브율(AS) = (VLOOKUP 21st / (방송외+방송중)) - 2%  ※ 21st=주문이익율
    // M라이브이익(AR) = 전체매출(AA) × M라이브율(AS)
    _mliveData.forEach(function(m){
      var totalAmt = m.orderAmt||0;                        // AA: 전체매출
      var brdAmt = m.mobOrderAmt||0;                       // AJ: 방송중매출
      var outAmt = totalAmt - brdAmt;                      // AL: 방송외매출
      // AS: M라이브율 = (VLOOKUP(V열) / (AL+AJ)) - 2%
      // V열 값: "10%" → 10 (pFlt) → /100 = 0.1 (소수 비율로 변환)
      var vlookupVal = m._profitRateRaw||0;
      // "10%" 같은 퍼센트 정수이면 /100으로 소수 변환
      if(Math.abs(vlookupVal) >= 1) vlookupVal = vlookupVal / 100;
      // AS = 주문이익율(소수) - 2%
      var mlRate = vlookupVal - 0.02;
      // AR: M라이브이익 = 전체매출(AA) × M라이브율(AS)
      m.profitRate = Math.round(mlRate*10000)/100;       // % 표시용
      m.profitAmt = Math.round(totalAmt * mlRate);       // AR
    });
    var sample = _mliveData[0];
    showToast('M라이브 '+_mliveData.length+'건 로드 | '+(sample?sample.programName+' / 이익:'+sample.profitAmt:'0건'));
    // Firebase에 편성코드 키로 저장 (기존 데이터와 머지)
    saveMliveToDb();
    // 매칭되는 캠페인 정산 정보 자동 기입 (전체매출/방송중매출/방송외매출)
    syncMliveToCampaignSettle();
    renderReports();
  };
  reader.readAsArrayBuffer(file);
  input.value = '';
}

// M라이브 Excel 데이터를 캠페인 정산정보로 동기화
// 편성코드(code) ↔ 캠페인 appMkt.liveCode 매칭하여 전체매출/방송중매출/방송외매출 기입
function syncMliveToCampaignSettle(){
  if(!_mliveData || !_mliveData.length) return;
  var byCode = {};
  _mliveData.forEach(function(m){ if(m.code) byCode[String(m.code).trim()] = m; });
  var changed = 0;
  (DB.campaigns||[]).forEach(function(c){
    // 복수 편성코드 지원
    var codes = [];
    if(c.appMkt && c.appMkt.liveCodes && c.appMkt.liveCodes.length){
      codes = c.appMkt.liveCodes;
    } else if(c.appMkt && c.appMkt.liveCode){
      codes = [String(c.appMkt.liveCode).trim()];
    } else if(c._liveCodeInput){
      codes = [String(c._liveCodeInput).trim()];
    }
    if(!codes.length) return;
    var isMlive = (c.campType||'')==='모바일라이브';
    // 인플루언서: 복수 편성코드 합산
    if(!isMlive && codes.length > 0){
      var mlTotal=0, mlOnair=0;
      codes.forEach(function(lc){
        var lc2=String(lc).trim();
        var mm = byCode[lc2] || byCode[lc2.replace(/\D/g,'')];
        if(mm){ mlTotal+=mm.orderAmt||0; mlOnair+=mm.mobOrderAmt||0; }
      });
      if(mlTotal){
        var mlOffair = mlTotal - mlOnair;
        var updated2 = false;
        if(c.onairRevenue !== mlOnair){ c.onairRevenue = mlOnair; updated2=true; }
        if(c.offairRevenue !== mlOffair){ c.offairRevenue = mlOffair; updated2=true; }
        if(c.totalRevenue !== (c.settleRevenue||0)+mlTotal){ c.totalRevenue = (c.settleRevenue||0)+mlTotal; updated2=true; }
        if(updated2) changed++;
      }
      // 광고수익 양방향 동기화 (인플루언서)
      codes.forEach(function(lc){
        var lc2=String(lc).trim();
        var mm = byCode[lc2] || byCode[lc2.replace(/\D/g,'')];
        if(!mm) return;
        if((mm.adRevenue||0) && !(c.adIncome||0)){ c.adIncome = mm.adRevenue; changed++; }
        else if((c.adIncome||0) && !(mm.adRevenue||0)){ mm.adRevenue = c.adIncome; }
      });
      return;
    }
    // 모바일라이브: 첫 번째 매칭 코드 기준으로 동기화
    var m = null;
    for(var ci=0;ci<codes.length;ci++){
      var lc=String(codes[ci]).trim();
      m = byCode[lc] || byCode[lc.replace(/\D/g,'')];
      if(m) break;
    }
    if(!m) return;
    var total = m.orderAmt||0;
    var onair = m.mobOrderAmt||0;
    var offair = total - onair;
    var updated = false;
    // 매출 동기화
    if(c.totalRevenue !== total){ c.totalRevenue = total; updated=true; }
    if(c.onairRevenue !== onair){ c.onairRevenue = onair; updated=true; }
    if(c.offairRevenue !== offair){ c.offairRevenue = offair; updated=true; }
    // 주문건수
    if(m.orderQty && c.mliveOrderQty !== m.orderQty){ c.mliveOrderQty = m.orderQty; updated=true; }
    // 한계이익율/이익액
    if(m.profitRate && c.mliveProfitRate !== m.profitRate){ c.mliveProfitRate = m.profitRate; updated=true; }
    if(m.profitAmt && c.mliveProfitAmt !== m.profitAmt){ c.mliveProfitAmt = m.profitAmt; updated=true; }
    // 시청자수
    if(m.viewers && c.mliveViewers !== m.viewers){ c.mliveViewers = m.viewers; updated=true; }
    // 마케팅비 → 정산 DA광고료
    if(m.marketingFee && c.settleDa !== m.marketingFee){ c.settleDa = m.marketingFee; updated=true; }
    // 딜코드
    if(m.dealCode && !c.dealCode){ c.dealCode = m.dealCode; updated=true; }
    // 방송구분
    if(m.broadcastType && c.mliveBroadcastType !== m.broadcastType){ c.mliveBroadcastType = m.broadcastType; updated=true; }
    // 방송일시/MD
    if(m.date && m.startTime && !c.confirmStart){
      c.confirmStart = m.date+'T'+m.startTime;
      if(m.endTime) c.confirmEnd = m.date+'T'+m.endTime;
      updated=true;
    }
    if(m.mdName && !c.owner){ c.owner = m.mdName; updated=true; }
    if(updated) changed++;
    // 광고수익 양방향 동기화: 한쪽만 입력하면 다른쪽에 반영
    var campAdRev = c.adIncome||0;
    var excelAdRev = m.adRevenue||0;
    if(excelAdRev && !campAdRev){
      c.adIncome = excelAdRev;
      changed++;
    } else if(campAdRev && !excelAdRev){
      m.adRevenue = campAdRev;
    }
  });
  if(changed > 0){
    console.log('[syncMliveToCampaignSettle] '+changed+'개 캠페인 실적 자동 동기화');
    if(fbReady) pushToFirebase();
    showToast(changed+'개 캠페인에 엑셀 실적 자동 반영 (매출/이익/시청자/광고수익 등)');
  }
}

// M라이브 데이터 Firebase 저장 (편성코드 키)
function saveMliveToDb(){
  if(!fbReady || !fbRef) return;
  var obj = {};
  _mliveData.forEach(function(m){
    if(m.code) obj[m.code] = m;
  });
  fbRef.child('mliveData').set(obj)
    .then(function(){ console.log('[M라이브] Firebase 저장 성공:', Object.keys(obj).length, '건'); })
    .catch(function(e){ console.warn('[M라이브] Firebase 저장 실패:', e); });
}

// M라이브 데이터 Firebase에서 로드
function loadMliveFromDb(){
  if(!fbReady || !fbRef) return;
  fbRef.child('mliveData').once('value', function(snap){
    var d = snap.val();
    if(!d) return;
    var loaded = Object.values(d);
    if(!loaded.length) return;
    // 편성코드 키 기준 머지 (로드 데이터 우선)
    var codeMap = {};
    _mliveData.forEach(function(m){ if(m.code) codeMap[m.code] = m; });
    loaded.forEach(function(m){ if(m.code) codeMap[m.code] = m; });
    _mliveData = Object.values(codeMap);
    // 한계이익 재계산
    _mliveData.forEach(function(m){
      if(m.profitAmt!==undefined && m.profitAmt!==0) return; // 이미 계산됨
      var vlookupVal = m._profitRateRaw||0;
      if(Math.abs(vlookupVal)>=1) vlookupVal=vlookupVal/100;
      var mlRate = vlookupVal-0.02;
      m.profitRate = Math.round(mlRate*10000)/100;
      m.profitAmt = Math.round((m.orderAmt||0)*mlRate);
    });
    console.log('[M라이브] Firebase 로드:', _mliveData.length, '건');
    syncMliveToCampaignSettle();
    renderReports();
  });
}

// 주차 계산 (ISO week)
function getWeekInfo(dateStr){
  if(!dateStr) return {year:0,month:0,week:0,label:'',key:''};
  var d = new Date(dateStr);
  if(isNaN(d.getTime())) return {year:0,month:0,week:0,label:'',key:''};
  // 월요일~일요일 기준: 해당 날짜가 속한 주의 월요일을 구함
  var dayOfWeek = d.getDay(); // 0=일,1=월...6=토
  var mondayOffset = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
  var monday = new Date(d); monday.setDate(d.getDate() + mondayOffset);
  var sunday = new Date(monday); sunday.setDate(monday.getDate()+6);
  // 월 걸침: 월요일과 일요일의 월이 다르면 → 다음 달 1주
  var year, month, weekOfMonth;
  if(monday.getMonth() !== sunday.getMonth()){
    // 다음 달 1주
    year = sunday.getFullYear();
    month = sunday.getMonth()+1;
    weekOfMonth = 1;
  } else {
    year = monday.getFullYear();
    month = monday.getMonth()+1;
    var firstOfMonth = new Date(year, monday.getMonth(), 1);
    var firstDay = firstOfMonth.getDay();
    var offset = (firstDay === 0) ? 6 : firstDay - 1;
    weekOfMonth = Math.ceil((monday.getDate() + offset) / 7);
  }
  var key = year+'-'+String(month).padStart(2,'0')+'-W'+weekOfMonth;
  var label = month+'월'+weekOfMonth+'주';
  return {year:year, month:month, week:weekOfMonth, key:key, label:label};
}

// 주차별 성과 렌더링
function renderWeeklyView(){
  var container = document.getElementById('s8-weekly-view');
  var detailCard = document.getElementById('s8-inf-detail-card');
  if(!container) return;

  var today = new Date(); today.setHours(0,0,0,0);
  // 기간 결정: 월/주 모드
  var fromDate=null, toDate=null, fromVal='', toVal='';
  if(s8Period==='week'){
    var wf=document.getElementById('s8-week-from')?.value;
    var wt=document.getElementById('s8-week-to')?.value;
    var wfr=getWeekRange(wf), wtr=getWeekRange(wt);
    if(wfr) fromDate=new Date(wfr.from);
    if(wtr) toDate=new Date(wtr.to);
    fromVal=wf; toVal=wt;
  } else {
    fromVal = document.getElementById('s7-date-from')?.value||'';
    toVal   = document.getElementById('s7-date-to')?.value||'';
    if(fromVal) fromDate=new Date(fromVal+'-01');
    if(toVal){ var tp=toVal.split('-'); toDate=new Date(parseInt(tp[0]),parseInt(tp[1]),0); }
  }

  var tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  var camps = DB.campaigns.filter(function(c){
    var startStr = (c.start||c.startDate||'').slice(0,10);
    var endStr   = (c.end||c.endDate||'').slice(0,10);
    var endD = endStr ? new Date(endStr) : null;
    // 종료 판단: 종료일이 내일 이전이면 종료 (종료일 당일~다음날 오전 포함)
    if(s7Filter==='active'){ if(endD && endD<tomorrow) return false; }
    else { if(!endD || endD>=tomorrow) return false; }
    if(fromDate && new Date(startStr)<fromDate) return false;
    if(toDate && new Date(startStr)>toDate) return false;
    return true;
  });

  // M라이브 주차별 그룹핑
  var mlWeekMap = {};
  _mliveData.forEach(function(m){
    var mDate = (m.date||'').trim().replace(/\//g,'-');
    if(!mDate) return;
    if(fromDate && new Date(mDate)<fromDate) return;
    if(toDate && new Date(mDate)>toDate) return;
    var wi = getWeekInfo(mDate);
    if(!wi.key) return;
    if(!mlWeekMap[wi.key]) mlWeekMap[wi.key] = {label:wi.label, date:mDate, items:[], totAmt:0, totQty:0, totProfit:0, totBrdAmt:0, totBrdQty:0, totOutAmt:0, totOutQty:0, totMktFee:0, totAdRev:0};
    mlWeekMap[wi.key].items.push(m);
    mlWeekMap[wi.key].totAmt += m.orderAmt||0;
    mlWeekMap[wi.key].totQty += m.orderQty||0;
    mlWeekMap[wi.key].totProfit += m.profitAmt||0;
    mlWeekMap[wi.key].totBrdAmt += m.mobOrderAmt||0;
    mlWeekMap[wi.key].totBrdQty += m.mobOrderQty||0;
    mlWeekMap[wi.key].totOutAmt += (m.orderAmt||0)-(m.mobOrderAmt||0);
    mlWeekMap[wi.key].totOutQty += (m.orderQty||0)-(m.mobOrderQty||0);
    mlWeekMap[wi.key].totMktFee += m.marketingFee||0;
    mlWeekMap[wi.key].totAdRev += m.adRevenue||0;
  });

  // VLOOKUP 매칭 (복수 편성코드 지원)
  var mliveByCode = {};
  _mliveData.forEach(function(m){ if(m.code) mliveByCode[String(m.code).trim()]=m; });
  var matchedMliveCodes = {};
  console.log('[VLOOKUP] M라이브 코드맵:', Object.keys(mliveByCode).length, '건');
  camps.forEach(function(c){
    // 복수 편성코드 지원: liveCodes 배열 우선, 없으면 liveCode 단일값
    var codes = [];
    if(c.appMkt && c.appMkt.liveCodes && c.appMkt.liveCodes.length){
      codes = c.appMkt.liveCodes;
    } else if(c.appMkt && c.appMkt.liveCode){
      codes = [String(c.appMkt.liveCode).trim()];
    } else if(c._liveCodeInput){
      codes = [String(c._liveCodeInput).trim()];
    }
    if(!codes.length) return;
    // 모든 편성코드에 대해 매칭 → _matchedMliveAll 배열로 합산
    var matchedAll = [];
    codes.forEach(function(lc){
      var lc2 = String(lc).trim();
      if(!lc2) return;
      var m = mliveByCode[lc2] || mliveByCode[lc2.replace(/\D/g,'')];
      if(m){
        matchedAll.push(m);
        matchedMliveCodes[m.code] = true;
      }
    });
    console.log('[VLOOKUP] 캠페인:'+c.name+' 편성코드:'+codes.join(',')+' 매칭:'+matchedAll.length+'건');
    if(matchedAll.length){
      // _matchedMlive: 합산 객체 (기존 단일 객체 호환)
      if(matchedAll.length===1){
        c._matchedMlive = matchedAll[0];
      } else {
        // 복수 매칭 → 합산
        var merged = {code:codes.join(','), orderAmt:0, orderQty:0, mobOrderAmt:0, mobOrderQty:0, profitAmt:0, adRevenue:0, marketingFee:0, viewers:0};
        matchedAll.forEach(function(m){
          merged.orderAmt += m.orderAmt||0;
          merged.orderQty += m.orderQty||0;
          merged.mobOrderAmt += m.mobOrderAmt||0;
          merged.mobOrderQty += m.mobOrderQty||0;
          merged.profitAmt += m.profitAmt||0;
          merged.adRevenue += m.adRevenue||0;
          merged.marketingFee += m.marketingFee||0;
          merged.viewers += m.viewers||0;
        });
        merged.profitRate = merged.orderAmt>0 ? Math.round(merged.profitAmt/merged.orderAmt*10000)/100 : 0;
        c._matchedMlive = merged;
      }
      c._matchedMliveAll = matchedAll;
    }
  });

  // M라이브 주차합계에서 매칭된 편성코드 제외하여 재계산
  Object.keys(mlWeekMap).forEach(function(k){
    var wk = mlWeekMap[k];
    var filtered = wk.items.filter(function(m){ return !matchedMliveCodes[m.code]; });
    wk.items = filtered;
    wk.totAmt=0; wk.totQty=0; wk.totProfit=0; wk.totBrdAmt=0; wk.totBrdQty=0; wk.totOutAmt=0; wk.totOutQty=0; wk.totMktFee=0; wk.totAdRev=0;
    filtered.forEach(function(m){
      wk.totAmt+=m.orderAmt||0; wk.totQty+=m.orderQty||0; wk.totProfit+=m.profitAmt||0;
      wk.totBrdAmt+=m.mobOrderAmt||0; wk.totBrdQty+=m.mobOrderQty||0;
      wk.totOutAmt+=(m.orderAmt||0)-(m.mobOrderAmt||0); wk.totOutQty+=(m.orderQty||0)-(m.mobOrderQty||0);
      wk.totMktFee+=m.marketingFee||0;
      wk.totAdRev+=m.adRevenue||0;
    });
  });

  // 통합 행 목록 (시간순: 인플루언서=개별행, M라이브=주차 합계행)
  var rows = [];
  if(s8Type!=='mlive'){
    camps.forEach(function(c){
      rows.push({type:'inf', date:(c.start||c.startDate||'').slice(0,10), camp:c});
    });
  }
  if(s8Type!=='inf'){
    Object.keys(mlWeekMap).forEach(function(k){
      // 매칭된 편성코드 제외 후 항목이 없으면 스킵
      if(mlWeekMap[k].items.length > 0){
        rows.push({type:'mlive', date:mlWeekMap[k].date, weekKey:k, week:mlWeekMap[k]});
      }
    });
  }
  rows.sort(function(a,b){ return (a.date||'')>(b.date||'')?1:(a.date||'')<(b.date||'')?-1:0; });

  // 주차 필터 드롭다운 채우기
  var weekSel = document.getElementById('s8-week-filter');
  if(weekSel){
    var allWeeks = {};
    rows.forEach(function(r){
      var d = r.date||'';
      if(!d) return;
      var wi = getWeekInfo(d);
      if(wi.key) allWeeks[wi.key] = wi.label;
    });
    var curVal = weekSel.value;
    var opts = '<option value="">전체</option>';
    Object.keys(allWeeks).sort().forEach(function(k){ opts += '<option value="'+k+'"'+(curVal===k?' selected':'')+'>'+allWeeks[k]+'</option>'; });
    weekSel.innerHTML = opts;
  }

  // 주차 필터 적용
  var weekFilter = document.getElementById('s8-week-filter')?.value||'';
  if(weekFilter){
    rows = rows.filter(function(r){
      var d = r.date||'';
      if(!d) return false;
      var wi = getWeekInfo(d);
      return wi.key === weekFilter;
    });
  }

  // M라이브 재방송 정렬: "다시보는" 캠페인은 동일 딜코드 본방 아래로
  if(s8Type!=='inf'){
    rows.forEach(function(r){
      if(r.type==='mlive' && r.week && r.week.items){
        var items = r.week.items;
        // 딜코드(col BO=66) 기반 본방/재방 그룹핑
        var mainMap = {}; // 딜코드별 본방
        var replayByDeal = {}; // 딜코드별 재방 합산
        var others = []; // 딜코드 없는 일반 건
        items.forEach(function(m){
          var isReplay = (m.programName||'').indexOf('다시보는')===0;
          var dealCode = m.dealCode||'';
          if(isReplay && dealCode){
            if(!replayByDeal[dealCode]) replayByDeal[dealCode] = {orderAmt:0,orderQty:0,mobOrderAmt:0,mobOrderQty:0,profitAmt:0,adRevenue:0,marketingFee:0,count:0,programName:'',date:'',code:'',mdCat:'',cat:'',_origName:''};
            var rb = replayByDeal[dealCode];
            rb.orderAmt+=m.orderAmt||0; rb.orderQty+=m.orderQty||0;
            rb.mobOrderAmt+=m.mobOrderAmt||0; rb.mobOrderQty+=m.mobOrderQty||0;
            rb.profitAmt+=m.profitAmt||0; rb.adRevenue+=m.adRevenue||0;
            rb.marketingFee+=m.marketingFee||0; rb.count++;
            // 원본 캠페인명 저장 (첫 건 기준, "다시보는 " 제거)
            if(!rb._origName) rb._origName = (m.programName||'').replace(/^다시보는\s*/,'');
            rb.programName = '(재방) ('+rb.count+'건)'; // 임시, 나중에 본방 종속 여부로 결정
            if(!rb.date) rb.date=m.date; rb.code=m.code; rb.mdCat=m.mdCat||rb.mdCat; rb.cat=m.cat||rb.cat;
            rb._isReplaySum = true;
            rb.dealCode = dealCode;
          } else if(!isReplay){
            if(dealCode){
              if(!mainMap[dealCode]) mainMap[dealCode] = [];
              mainMap[dealCode].push(m);
            } else {
              others.push(m);
            }
          } else {
            // "다시보는"이지만 딜코드 없는 건 → 일반 건으로 처리
            others.push(m);
          }
        });
        // 정렬: 일반 → (본방 + 재방합산) 순서
        var sorted = [];
        others.forEach(function(m){ sorted.push(m); });
        Object.keys(mainMap).forEach(function(dc){
          mainMap[dc].forEach(function(m){ sorted.push(m); });
          if(replayByDeal[dc]){
            // 본방 종속: "(재방) (N건)"
            replayByDeal[dc].programName = '(재방) ('+replayByDeal[dc].count+'건)';
            sorted.push(replayByDeal[dc]);
            delete replayByDeal[dc];
          }
        });
        // 본방 없이 재방만 있는 케이스: "(재방) 캠페인명"
        Object.keys(replayByDeal).forEach(function(dc){
          var rb = replayByDeal[dc];
          rb._isOrphanReplay = true;
          rb.programName = '(재방) '+(rb._origName||'')+ ' ('+rb.count+'건)';
          sorted.push(rb);
        });
        // 본방+재방 합산 금액 계산 (색상 판단용)
        var dealTotalAmt = {};
        sorted.forEach(function(m){
          var dc = m.dealCode||'';
          if(!dc) return;
          if(!dealTotalAmt[dc]) dealTotalAmt[dc] = 0;
          dealTotalAmt[dc] += m.orderAmt||0;
        });
        sorted.forEach(function(m){ m._dealTotalAmt = dealTotalAmt[m.dealCode||'']||m.orderAmt||0; });
        r.week.items = sorted;
      }
    });
  }

  if(!rows.length){ container.innerHTML=''; if(detailCard) detailCard.style.display=''; return; }
  if(s8Type==='mlive' && detailCard) detailCard.style.display='none';
  else if(detailCard) detailCard.style.display='';

  var fmtMil = function(v){ return v?Math.round(v/1000000).toLocaleString('ko-KR'):'-'; };  // 백만 단위 (정수)
  var fmtMil1 = function(v){ return v?(v/1000000).toFixed(1):'-'; };  // 백만 단위 (소수점1자리)
  var fmtNum = function(v){ return v?v.toLocaleString('ko-KR'):'-'; };  // 정수 천단위 쉼표
  var fmt = fmtMil; // 매출 등 백만 정수
  var fmtEok = fmtMil; // 호환용
  var fmtCost = fmtMil1; // 비용/광고수익 백만 소수1자리
  var colExpanded = window._s8ColExpanded||false;
  var cx = colExpanded?'':'display:none';

  // 달성율 계산
  var _tgtMl=0, _tgtInf=0;
  var _totalDays=0, _passedDays=0;

  if(s8Period==='week' && fromDate && toDate){
    // 주 단위: 조회 기간 일수 계산 + 해당 월 목표의 일할
    var queryDays = Math.round((toDate-fromDate)/86400000)+1;
    // 해당 주가 속한 월의 목표 × (조회일수/월일수)
    var covMonths = {};
    var cur = new Date(fromDate);
    while(cur <= toDate){
      var mk = cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0');
      if(!covMonths[mk]) covMonths[mk] = 0;
      covMonths[mk]++;
      cur.setDate(cur.getDate()+1);
    }
    Object.keys(covMonths).forEach(function(mk){
      var pp=mk.split('-'); var dim=new Date(parseInt(pp[0]),parseInt(pp[1]),0).getDate();
      var mt=_monthlyTargets[mk]||{};
      var ratio = covMonths[mk]/dim;
      _tgtMl+=(mt.mlive||0)*ratio;
      _tgtInf+=(mt.inf||0)*ratio;
    });
    _totalDays = queryDays;
    _passedDays = queryDays; // 주 단위는 조회기간=경과기간
  } else {
    // 월 단위
    var _coveredMonths = {};
    if(fromDate && toDate){
      var cy=fromDate.getFullYear(), cm=fromDate.getMonth();
      var ey=toDate.getFullYear(), em=toDate.getMonth();
      while(cy<ey||(cy===ey&&cm<=em)){
        var mk=cy+'-'+String(cm+1).padStart(2,'0');
        _coveredMonths[mk]=true;
        var mt=_monthlyTargets[mk]||{};
        _tgtMl+=mt.mlive||0; _tgtInf+=mt.inf||0;
        cm++; if(cm>11){cm=0;cy++;}
      }
    } else {
      var _targetMonth = (new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0'));
      _coveredMonths[_targetMonth]=true;
      var _tgt2 = _monthlyTargets[_targetMonth]||{};
      _tgtMl = _tgt2.mlive||0; _tgtInf = _tgt2.inf||0;
    }
    Object.keys(_coveredMonths).forEach(function(mk){
      var pp=mk.split('-'); var yr=parseInt(pp[0]), mo=parseInt(pp[1]);
      var dim=new Date(yr,mo,0).getDate();
      _totalDays+=dim;
      var td=new Date();
      if(yr<td.getFullYear()||(yr===td.getFullYear()&&mo<td.getMonth()+1)){
        _passedDays+=dim;
      } else if(yr===td.getFullYear()&&mo===td.getMonth()+1){
        _passedDays+=td.getDate();
      }
    });
  }
  var _dailyRatio = _totalDays>0?_passedDays/_totalDays:1;
  var _tgtAll = Math.round(_tgtMl+_tgtInf);

  // 달성율 계산 함수
  function _cp(act,tgt){
    if(!tgt) return '';
    // 주 단위: 목표가 이미 일할 적용됨, 월 단위: 일할 적용
    var target = s8Period==='week' ? Math.round(tgt) : Math.round(tgt * _dailyRatio);
    var r2 = target>0?(act/target*100).toFixed(1):'0';
    var cl=r2>=100?'var(--green)':r2>=80?'var(--orange)':'var(--pink)';
    return '(<span style="font-size:16px;font-weight:800;color:'+cl+'">'+r2+'%</span>)';
  }

  // 3) 실적 합계 — gt에서 계산 (월 합계 계산 후에 표시)
  // (progressHtml는 gt 계산 후 아래에서 생성)
  var _today = new Date();
  var _dim = new Date(_today.getFullYear(), _today.getMonth()+1, 0).getDate();


  var _fmtAmt = function(v){ var t=v>0?(v/100000000).toFixed(1)+'억':'0'; return '<span style="font-size:20px;font-weight:900">'+t+'</span>'; };

  var html = '<div class="card" style="margin-bottom:18px"><div class="card-hd" style="flex-wrap:wrap;gap:8px"><span class="card-ttl">캠페인 성과지표</span>'
    +'<div id="s8-kpi-progress"></div>'
    +'<button class="btn btn-ghost btn-xs" style="font-size:11px;margin-left:auto" onclick="window._s8ColExpanded=!window._s8ColExpanded;renderWeeklyView()">'+(colExpanded?'◀ 열 접기':'▶ 열 펼치기')+'</button></div>';
  html += '<div style="overflow:auto;max-height:calc(100vh - 200px)"><table style="width:100%;font-size:12px;border-collapse:separate;border-spacing:0">';
  var ths='background:var(--bg);border-bottom:1px solid var(--border);font-size:13px;';
  var thd=ths+'border-left:2px dashed var(--border);'; // 구분선
  html += '<thead style="position:sticky;top:0;z-index:10"><tr>'
    +'<th style="'+ths+'padding:6px 8px;width:28px"></th>'
    +'<th style="'+ths+'padding:6px 8px;text-align:left">주차</th>'
    +'<th style="'+ths+'">MDCAT</th><th style="'+ths+'">패키지</th><th style="'+ths+'">캠페인명</th>'
    // 전체
    +'<th style="'+thd+'text-align:right;color:var(--green)">전체매출<div style="font-size:9px;color:var(--text3);font-weight:400">※백만</div></th>'
    +'<th style="'+ths+'text-align:right">건수</th>'
    // 인플
    +'<th style="'+thd+'text-align:right;color:var(--green)">인플매출<div style="font-size:9px;color:var(--text3);font-weight:400">※백만</div></th>'
    +'<th style="'+ths+'text-align:right">건수</th>'
    +'<th style="'+ths+'text-align:right">비용<div style="font-size:9px;color:var(--text3);font-weight:400">※백만</div></th>'
    +'<th style="'+ths+'text-align:right;'+cx+'">조회수<div style="font-size:9px;color:var(--text3);font-weight:400">※만</div></th>'
    +'<th style="'+ths+'text-align:right;'+cx+'">당사유입</th>'
    +'<th style="'+ths+'text-align:right;'+cx+'">CTR</th>'
    // M라이브방송중
    +'<th style="'+thd+'text-align:right"><b style="color:var(--blue)">M라이브</b>방송중<div style="font-size:9px;color:var(--text3);font-weight:400">※백만</div></th>'
    +'<th style="'+ths+'text-align:right">건수</th>'
    // 방송외
    +'<th style="'+thd+'text-align:right">방송외<div style="font-size:9px;color:var(--text3);font-weight:400">※백만</div></th>'
    +'<th style="'+ths+'text-align:right">건수</th>'
    +'<th style="'+ths+'text-align:right">마케팅비<div style="font-size:9px;color:var(--text3);font-weight:400">※백만</div></th>'
    // 한계이익
    +'<th style="'+thd+'text-align:right">한계이익<div style="font-size:9px;color:var(--text3);font-weight:400">※백만</div></th>'
    +'<th style="'+ths+'text-align:right">이익율</th>'
    +'<th style="'+ths+'text-align:right">광고수익<div style="font-size:9px;color:var(--text3);font-weight:400">※백만</div></th>'
    +'<th style="'+ths+'text-align:right">신규가입<div style="font-size:9px;color:var(--text3);font-weight:400">※명</div></th>'
    +'</tr></thead><tbody>';

  // ── 월 전체 합계 계산 ──
  var gt = {infCost:0, da:0, mktFee:0, rev:0, ord:0, infRev:0, infOrd:0, mlRev:0, mlOrd:0, views:0, inflow:0, newMem:0, mlProfit:0, infProfit:0, adRev:0, brdAmt:0, brdQty:0, outAmt:0, outQty:0};
  rows.forEach(function(row){
    if(row.type==='inf'){
      var c=row.camp, sr=c.settleRevenue||0;
      // 인플 실적만 (모바일라이브 포함 체크된 경우 방송중 실적 차감)
      var ml2=c._matchedMlive||{};
      if(c.infRevIncludeMlive && (ml2.mobOrderAmt||0)){
        sr = sr - (ml2.mobOrderAmt||0);
        if(sr<0) sr=0;
      }
      var infOrd = c.settleOrders||0;
      if(c.infRevIncludeMlive && (ml2.mobOrderQty||0)){
        infOrd = infOrd - (ml2.mobOrderQty||0);
        if(infOrd<0) infOrd=0;
      }
      var _i0=(c.infData&&c.infData[0])||{};
      var fr2=parseFloat(_i0.feeRate||c.feeRate)||0,fa2=parseInt(_i0.feeAmount||c.feeAmount)||0,ar2=parseFloat(_i0.agencyRate||c.agencyRate)||0,da2=parseInt(_i0.daFee||c.settleDa)||0;
      var cost2=Math.round(sr*fr2/100)+fa2+Math.round(sr*ar2/100)+da2; // 비용소계 (DA 포함)
      gt.infCost+=cost2;
      gt.infRev+=sr; gt.infOrd+=infOrd;
      (c.settleData||[]).forEach(function(s){ gt.views+=s.views||0; gt.inflow+=s.inflow||0; gt.newMem+=s.newMembers||0; });
      // AR: 인플이익
      var _pr2=c.profitRateInput||0, _ai2=c.adIncome||0;
      gt.infProfit += Math.round(sr*_pr2/100) + _ai2 - cost2;
      // 매칭된 M라이브
      var ml2=c._matchedMlive||{};
      gt.mlRev+=ml2.orderAmt||0; gt.mlOrd+=ml2.orderQty||0;
      gt.mktFee+=ml2.marketingFee||0;
      gt.brdAmt+=ml2.mobOrderAmt||0; gt.brdQty+=ml2.mobOrderQty||0;
      gt.outAmt+=(ml2.orderAmt||0)-(ml2.mobOrderAmt||0); gt.outQty+=(ml2.orderQty||0)-(ml2.mobOrderQty||0);
      gt.mlProfit+=ml2.profitAmt||0;
      gt.adRev+=(ml2.adRevenue||0)||_ai2; // 광고수익: 엑셀 또는 캠페인 입력값 중 유효한 값
      // 전체매출 = 인플 + 매칭M라이브
      gt.rev+=sr+(ml2.orderAmt||0); gt.ord+=infOrd+(ml2.orderQty||0);
    } else if(row.type==='mlive'){
      var wk2=row.week;
      gt.mktFee+=wk2.totMktFee||0;
      gt.rev+=wk2.totAmt; gt.ord+=wk2.totQty;
      gt.mlRev+=wk2.totAmt; gt.mlOrd+=wk2.totQty; gt.mlProfit+=wk2.totProfit||0;
      gt.brdAmt+=wk2.totBrdAmt||0; gt.brdQty+=wk2.totBrdQty||0;
      gt.outAmt+=wk2.totOutAmt||0; gt.outQty+=wk2.totOutQty||0;
      gt.adRev+=wk2.totAdRev||0;
    }
  });
  // AP: 전체한계이익 = AR(인플이익) + AT(M라이브이익) + AV(광고수익) (DA는 비용소계에 포함)
  var gtProfit = gt.infProfit + gt.mlProfit + gt.adRev;
  var gtProfitRate = gt.rev>0?(gtProfit/gt.rev*100).toFixed(0)+'%':'-';
  var gtCtr = gt.views>0?((gt.inflow/gt.views)*100).toFixed(1)+'%':'-';

  // 월별 목표 및 진도율 계산
  var targetMonth = fromVal || (new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0'));
  var tgt = _monthlyTargets[targetMonth]||{};
  // 월 합계 행 (새 컬럼순서)
  var dl='border-left:2px dashed var(--border);';
  html += '<tr style="background:var(--accent-bg);font-weight:800;border-bottom:2px solid var(--accent)">'
    +'<td style="padding:8px"></td>'
    +'<td style="padding:8px;font-size:13px">'+(s8Period==='week'?'주 합계':'월 합계')+'</td>'
    +'<td></td><td style="font-weight:800">실적</td><td></td>'
    +'<td style="text-align:right;'+dl+'font-size:13px">'+fmtEok(gt.rev)+'</td>'
    +'<td style="text-align:right;font-size:13px">'+fmtNum(gt.ord)+'</td>'
    +'<td style="text-align:right;'+dl+'">'+fmtEok(gt.infRev)+'</td>'
    +'<td style="text-align:right">'+fmtNum(gt.infOrd)+'</td>'
    +'<td style="text-align:right">'+fmtCost(gt.infCost)+'</td>'
    +'<td style="text-align:right;'+cx+'">'+fmtNum(gt.views)+'</td>'
    +'<td style="text-align:right;'+cx+'">'+fmtNum(gt.inflow)+'</td>'
    +'<td style="text-align:right;'+cx+'">'+gtCtr+'</td>'
    +'<td style="text-align:right;'+dl+'">'+fmtCost(gt.brdAmt)+'</td>'
    +'<td style="text-align:right">'+fmtNum(gt.brdQty)+'</td>'
    +'<td style="text-align:right;'+dl+'">'+fmtCost(gt.outAmt)+'</td>'
    +'<td style="text-align:right">'+fmtNum(gt.outQty)+'</td>'
    +'<td style="text-align:right">'+fmtCost(gt.mktFee)+'</td>'
    +'<td style="text-align:right;'+dl+'font-size:13px">'+fmtCost(gtProfit)+'</td>'
    +'<td style="text-align:right">'+gtProfitRate+'</td>'
    +'<td style="text-align:right">'+fmtCost(gt.adRev)+'</td>'
    +'<td style="text-align:right">'+fmtNum(gt.newMem)+'</td>'
    +'</tr>';

  rows.forEach(function(row){
    if(row.type==='inf'){
      var c = row.camp;
      var sd0 = (c.settleData||[])[0]||{};
      var sr = c.settleRevenue||0;
      var ml = c._matchedMlive||{};
      // 인플 실적만 (모바일라이브 포함 체크된 경우 방송중 실적 차감)
      if(c.infRevIncludeMlive && (ml.mobOrderAmt||0)){ sr = Math.max(0, sr - (ml.mobOrderAmt||0)); }
      var infOrd = c.settleOrders||0;
      if(c.infRevIncludeMlive && (ml.mobOrderQty||0)){ infOrd = Math.max(0, infOrd - (ml.mobOrderQty||0)); }
      // infData에서 비용 정보 가져오기 (캠페인 레벨 폴백)
      var inf0 = (c.infData&&c.infData[0])||{};
      var fr=parseFloat(inf0.feeRate||c.feeRate)||0;
      var fa=parseInt(inf0.feeAmount||c.feeAmount)||0;
      var ar=parseFloat(inf0.agencyRate||c.agencyRate)||0;
      var daFee=parseInt(inf0.daFee||c.settleDa)||0;
      // 비용소계 = 수수료 + 원고료 + 에이전시 + DA (정산 비용소계와 동일)
      var cost = Math.round(sr*fr/100)+fa+Math.round(sr*ar/100)+daFee;
      var startD=(c.start||c.startDate||'').slice(5,10), endD=(c.end||c.endDate||'').slice(5,10);

      // 인플루언서 한계이익 계산
      // 이익 = 전체매출 × 이익율(%) + 광고수익
      var campProfitRate = c.profitRateInput||0;
      var campAdIncome = c.adIncome||0;
      var infIncome = Math.round(sr * campProfitRate / 100) + campAdIncome;
      // 한계이익 = 이익 - 비용소계
      var infProfit = infIncome - cost;
      var infProfitRate = sr>0?((infProfit/sr)*100).toFixed(0)+'%':'-';
      // AT: M라이브이익 (매칭된 경우)
      var mlProfit = ml.profitAmt||0;
      // AV: 광고수익 (캠페인 adIncome 또는 매칭된 M라이브 adRevenue 중 유효한 값 사용)
      var adRev = (ml.adRevenue||0) || campAdIncome;
      // AP: 전체한계이익 = 인플한계이익 + M라이브이익 + 광고수익
      var totalProfit = infProfit + mlProfit + adRev;
      // 전체매출 = 인플매출 + M라이브매출
      var totalRev = sr + (ml.orderAmt||0);
      var totalProfitRate = totalRev>0?((totalProfit/totalRev)*100).toFixed(0)+'%':'-';

      html += '<tr>'
        +'<td style="padding:5px 8px">'+(ml.code?'<span title="편성코드:'+escHtml(ml.code)+'" style="color:var(--blue);font-size:10px">🔗</span>':'')+'</td>'
        +'<td style="padding:5px 8px;font-size:11px;color:var(--text3)">'+startD+'~'+endD+'</td>'
        +'<td>'+(c.mdcat||'-')+'</td>'
        +'<td>'+(c.infSize||'-')+'</td>'
        +'<td style="font-weight:600;cursor:pointer" onclick="editProd('+c.id+')">'+escHtml(c.name||'-')+'</td>'
        +'<td style="text-align:right;'+dl+'">'+(totalRev?fmtEok(totalRev):'-')+'</td>'
        +'<td style="text-align:right">'+fmtNum((c.settleOrders||0)+(ml.orderQty||0))+'</td>'
        +'<td style="text-align:right;'+dl+'">'+(sr?fmtEok(sr):'-')+'</td>'
        +'<td style="text-align:right">'+fmtNum(infOrd)+'</td>'
        +'<td style="text-align:right">'+(cost?fmtCost(cost):'-')+'</td>'
        +'<td style="text-align:right;'+cx+'">'+(sd0.views||'-')+'</td>'
        +'<td style="text-align:right;'+cx+'">'+(sd0.inflow||'-')+'</td>'
        +'<td style="text-align:right;'+cx+'">'+(sd0.ctr?sd0.ctr+'%':'-')+'</td>'
        +'<td style="text-align:right;'+dl+'">'+(ml.mobOrderAmt?fmtCost(ml.mobOrderAmt):'-')+'</td>'
        +'<td style="text-align:right">'+fmtNum(ml.mobOrderQty)+'</td>'
        +'<td style="text-align:right;'+dl+'">'+(totalRev?fmtCost(totalRev-sr-(ml.mobOrderAmt||0)):'-')+'</td>'
        +'<td style="text-align:right">'+fmtNum(Math.max(0,(ml.orderQty||0)-(ml.mobOrderQty||0)))+'</td>'
        +'<td style="text-align:right">'+(ml.marketingFee?fmtCost(ml.marketingFee):'-')+'</td>'
        +'<td style="text-align:right;'+dl+'">'+fmtCost(totalProfit)+'</td>'
        +'<td style="text-align:right">'+totalProfitRate+'</td>'
        +'<td style="text-align:right">'+(adRev?fmtCost(adRev):'-')+'</td>'
        +'<td style="text-align:right">'+(sd0.newMembers||'-')+'</td>'
        +'</tr>';

    } else if(row.type==='mlive'){
      var wk = row.week;
      var mlId = 'ml-'+row.weekKey.replace(/[^a-zA-Z0-9]/g,'');
      var pr = wk.totAmt>0?(wk.totProfit/wk.totAmt*100).toFixed(0)+'%':'-';

      html += '<tr style="background:var(--bg3);font-weight:600;cursor:pointer" onclick="document.querySelectorAll(\'.'+mlId+'\').forEach(function(r){r.style.display=r.style.display===\'none\'?\'table-row\':\'none\'})">'
        +'<td style="padding:5px 8px;text-align:center;font-size:13px">+</td>'
        +'<td style="padding:5px 8px;white-space:nowrap"><b>'+wk.label+' M라이브</b></td>'
        +'<td></td><td></td><td></td>'
        +'<td style="text-align:right;'+dl+'">'+fmtEok(wk.totAmt)+'</td>'
        +'<td style="text-align:right">'+fmtNum(wk.totQty)+'</td>'
        +'<td style="'+dl+'text-align:right">-</td><td style="text-align:right">-</td><td style="text-align:right">-</td>'
        +'<td style="'+cx+'"></td><td style="'+cx+'"></td><td style="'+cx+'"></td>'
        +'<td style="text-align:right;'+dl+'">'+fmtCost(wk.totBrdAmt)+'</td>'
        +'<td style="text-align:right">'+fmtNum(wk.totBrdQty)+'</td>'
        +'<td style="text-align:right;'+dl+'">'+fmtCost(wk.totOutAmt)+'</td>'
        +'<td style="text-align:right">'+fmtNum(wk.totOutQty)+'</td>'
        +'<td style="text-align:right">'+(wk.totMktFee?fmtCost(wk.totMktFee):'-')+'</td>'
        +'<td style="text-align:right;'+dl+'">'+fmtCost(wk.totProfit)+'</td>'
        +'<td style="text-align:right">'+pr+'</td>'
        +'<td style="text-align:right">'+(wk.totAdRev?fmtCost(wk.totAdRev):'-')+'</td>'
        +'<td></td>'
        +'</tr>';

      wk.items.forEach(function(m){
        var outAmt=(m.orderAmt||0)-(m.mobOrderAmt||0);
        var outQty=(m.orderQty||0)-(m.mobOrderQty||0);
        var isReplaySum = m._isReplaySum;
        var isOrphan = m._isOrphanReplay;
        var replayBg = isReplaySum ? 'background:rgba(0,0,0,.04);' : '';
        // 카테고리별 매출 색상: 본방+재방 합산 기준 (가구/인테리어·가전 5천만, 그 외 1천6백만)
        var _mCat = (m.cat||m.mdCat||'').trim();
        var _isHighCat = _mCat.indexOf('가구')>=0 || _mCat.indexOf('인테리어')>=0 || _mCat.indexOf('가전')>=0;
        var _threshold = _isHighCat ? 50000000 : 16000000;
        var _colorBase = m._dealTotalAmt||m.orderAmt||0;
        var _rowColor = _colorBase >= _threshold ? 'color:var(--blue);' : 'color:var(--red);';
        var nameHtml = escHtml(m.programName||'-');
        if(isReplaySum && !isOrphan){
          nameHtml = '<span style="padding-left:16px;color:inherit"><span style="margin-right:4px">ㄴ</span>'+escHtml(m.programName)+'</span>';
        }
        html += '<tr class="'+mlId+'" style="display:none;font-size:11px;'+replayBg+_rowColor+'">'
          +'<td></td>'
          +'<td style="padding:4px 8px;color:var(--text3)">'+escHtml(m.date||'')+'</td>'
          +'<td style="font-size:10px">'+(m.mdCat||'-')+'</td>'
          +'<td style="font-size:10px">'+(m.cat||'-')+'</td>'
          +'<td>'+nameHtml+'</td>'
          +'<td style="text-align:right;'+dl+'">'+fmtEok(m.orderAmt)+'</td>'
          +'<td style="text-align:right">'+fmtNum(m.orderQty)+'</td>'
          +'<td style="'+dl+'text-align:right">-</td><td style="text-align:right">-</td><td style="text-align:right">-</td>'
          +'<td style="'+cx+'"></td><td style="'+cx+'"></td><td style="'+cx+'"></td>'
          +'<td style="text-align:right;'+dl+'">'+fmtCost(m.mobOrderAmt)+'</td>'
          +'<td style="text-align:right">'+fmtNum(m.mobOrderQty)+'</td>'
          +'<td style="text-align:right;'+dl+'">'+fmtCost(outAmt)+'</td>'
          +'<td style="text-align:right">'+fmtNum(outQty)+'</td>'
          +'<td style="text-align:right;font-size:10px">'+(m.marketingFee?fmtCost(m.marketingFee):'-')+'</td>'
          +'<td style="text-align:right;'+dl+'">'+fmtCost(m.profitAmt)+'</td>'
          +'<td style="text-align:right">'+(m.orderAmt>0?(m.profitAmt/m.orderAmt*100).toFixed(0)+'%':'-')+'</td>'
          +'<td style="text-align:right">'+(m.adRevenue?fmtCost(m.adRevenue):'-')+'</td>'
          +'<td style="font-size:10px;color:var(--text3)">'+escHtml(m.code||'-')+'</td>'
          +'</tr>';
      });
    }
  });

  html += '</tbody></table></div></div>';
  container.innerHTML = html;
  // KPI 진행률 표시 (gt 계산 완료 후)
  var kpiEl = document.getElementById('s8-kpi-progress');
  if(kpiEl && _tgtAll > 0){
    kpiEl.innerHTML = '<div style="display:flex;gap:20px;align-items:baseline;font-size:13px;color:var(--text2);margin-left:16px">'
      +'<span>전체 '+_fmtAmt(gt.rev)+' <span style="font-size:12px;color:var(--text3)">'+_cp(gt.rev,_tgtAll)+'</span></span>'
      +'<span style="color:var(--blue)">M라이브 '+_fmtAmt(gt.mlRev)+' <span style="font-size:12px">'+_cp(gt.mlRev,_tgtMl)+'</span></span>'
      +'<span style="color:var(--green)">인플 '+_fmtAmt(gt.infRev)+' <span style="font-size:12px">'+_cp(gt.infRev,_tgtInf)+'</span></span>'
      +'<span style="font-size:11px;color:var(--text3)">('+_passedDays+'/'+_totalDays+'일 기준)</span>'
      +'</div>';
  }
}

function setS7Filter(val){
  s7Filter = val;
  var ta = document.getElementById('s7-filter-active');
  var td = document.getElementById('s7-filter-done');
  if(ta) ta.classList.toggle('active', val==='active');
  if(td) td.classList.toggle('active', val==='done');
  renderReports();
}

function initS7DateFilter(){
  var now = new Date();
  var y = now.getFullYear(), m = now.getMonth();
  var df = document.getElementById('s7-date-from');
  var dt = document.getElementById('s7-date-to');
  if(df) df.value = y+'-'+String(m+1).padStart(2,'0');
  var nm = m+1; var ny = y; if(nm>11){ nm=0; ny++; }
  if(dt) dt.value = ny+'-'+String(nm+1).padStart(2,'0');
}

function clearS7Filter(){
  initS7DateFilter();
  renderReports();
}

function renderReports(){
  var today = new Date(); today.setHours(0,0,0,0);
  var fromVal = document.getElementById('s7-date-from')?.value;
  var toVal   = document.getElementById('s7-date-to')?.value;
  // 월 필터: fromVal='2026-03' → 해당월 1일, toVal='2026-04' → 해당월 말일
  var fromD = null, toD = null;
  if(fromVal) fromD = new Date(fromVal+'-01');
  if(toVal){
    var tp = toVal.split('-'); var ty=parseInt(tp[0]), tm=parseInt(tp[1]);
    toD = new Date(ty, tm, 0); // 해당월 마지막 날
  }

  var camps = DB.campaigns.filter(function(camp){
    var startStr = (camp.start||camp.startDate||'').slice(0,10);
    var endStr   = (camp.end||camp.endDate||'').slice(0,10);
    var startD = startStr ? new Date(startStr) : null;
    var endD   = endStr   ? new Date(endStr)   : null;

    // 진행중/종료 필터 (종료일이 오늘~내일이면 종료로 분류)
    var tmr2 = new Date(today); tmr2.setDate(tmr2.getDate()+1);
    if(s7Filter === 'active'){
      if(endD && endD < tmr2) return false;
    } else {
      if(!endD || endD >= tmr2) return false;
    }

    // 월 범위 필터 — 캠페인 기간이 조회 범위와 겹치면 표시
    if(fromD && toD){
      if(!startD) return false;
      var campEnd = endD || startD;
      if(campEnd < fromD || startD > toD) return false;
    } else if(fromD){
      if(!startD) return false;
      var campEnd2 = endD || startD;
      if(campEnd2 < fromD) return false;
    } else if(toD){
      if(startD && startD > toD) return false;
    }
    return true;
  });

  var rows = '';
  _s7FilteredCamps = camps; // 엑셀 다운로드용 캐시
  camps.forEach(function(camp){
    var mdcatVal = camp.mdcat||(camp.skus&&camp.skus[0]?camp.skus[0].mdcat:'')||'-';
    var revenue  = camp.settleRevenue || 0;
    var orders   = camp.settleOrders  || 0;
    // ── settleData에서 정산 상세 정보 읽기 ──
    var sd0    = (camp.settleData && camp.settleData[0]) || {};
    var sdSkus = sd0.skuItems || [];
    var totalInflow  = sdSkus.reduce(function(s,si){return s+(si.inflow||0);},0);
    var totalNewMem  = sdSkus.reduce(function(s,si){return s+(si.newMembers||0);},0);
    var totalNetOrd  = sdSkus.reduce(function(s,si){return s+(si.netOrders||0);},0);
    var sdViews  = sd0.views || 0;
    var ctrStr   = totalInflow>0 ? (totalNetOrd/totalInflow*100).toFixed(1)+'%' : '-';
    // 비용 = 세금계산서 공급가액(부가세별도) 재계산
    var _s8CF2   = Math.round((sd0.commFeeVat||0) / 1.1);
    var totalCost= _s8CF2 + (sd0.fixedFee||0) + (sd0.metaFee||0);
    var startOnly = (camp.start||camp.startDate||'-').slice(0,10);
    var endOnly   = (camp.end||camp.endDate||'-').slice(0,10);
    var dateStr  = (startOnly!=='-' ? startOnly.slice(5) : '-')+' ~ '+(endOnly!=='-' ? endOnly.slice(5) : '-');
    var roleColor= camp.role==='메가'?'var(--pink)':camp.role==='앵콜'?'var(--orange)':camp.role==='미들'?'var(--blue)':'var(--green)';
    var roleBg   = camp.role==='메가'?'var(--pink-bg)':camp.role==='앵콜'?'var(--orange-bg)':camp.role==='미들'?'var(--blue-bg)':'var(--green-bg)';

    rows += '<tr style="cursor:pointer">'
      + '<td style="text-align:center" onclick="event.stopPropagation()"><input type="checkbox" class="s7-camp-cb" value="'+camp.id+'" checked onchange="updateS7CheckAll()"></td>'
      + '<td class="mob-hide" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap">'+(camp.campCode||'-')+'</td>'
      + '<td style="font-weight:700" onclick="editProd('+camp.id+')">'+camp.name+'</td>'
      + '<td>'+(camp.infSize||camp.role ? '<span style="background:'+roleBg+';color:'+roleColor+';padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">'+(camp.infSize||camp.role)+'</span>' : '-')+'</td>'
      + '<td style="font-size:12px;font-family:monospace;color:var(--text3)">'+mdcatVal+'</td>'
      + '<td style="font-size:12px;color:var(--text2)">'+(camp.cat||'-')+'</td>'
      + '<td style="font-size:12px;color:var(--text2)">'+(camp.mcn||'-')+'</td>'
      + '<td style="font-size:12px">'+(camp.infName||'-')+'</td>'
      + '<td style="font-weight:700;color:var(--green)">'+(revenue ? revenue.toLocaleString('ko-KR')+'원' : '-')+'</td>'
      + '<td style="color:var(--text2)">'+(orders||'-')+'</td>'
      + '<td style="font-size:12px;color:var(--text2)">'+(totalInflow ? totalInflow.toLocaleString() : '-')+'</td>'
      + '<td style="font-size:12px;color:var(--text2)">'+(totalNewMem ? totalNewMem.toLocaleString() : '-')+'</td>'
      + '<td style="font-size:12px;color:var(--accent2);font-weight:600">'+ctrStr+'</td>'
      + '<td style="font-size:12px;color:var(--text2)">'+(sdViews ? sdViews.toLocaleString() : '-')+'</td>'
      + '<td style="font-weight:600;color:var(--orange)">'+(totalCost ? totalCost.toLocaleString('ko-KR')+'원' : '-')+'</td>'
      + '<td style="font-size:12px;color:var(--text3)">'+dateStr+'</td>'
      + '<td><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd('+camp.id+')">상세</button></td>'
      + '</tr>';
  });

  document.getElementById('rep-tbl').innerHTML = rows ||
    '<tr><td colspan="17" class="empty" style="padding:32px;text-align:center;color:var(--text3)">해당 조건의 캠페인이 없습니다</td></tr>';
  // 전체선택 체크박스 동기화
  var allCb = document.getElementById('s7-check-all'); if(allCb) allCb.checked = true;
  // 주차별 뷰 렌더링
  renderWeeklyView();
}

var _s7FilteredCamps = [];

function toggleS7CheckAll(checked){
  document.querySelectorAll('.s7-camp-cb').forEach(function(cb){ cb.checked = checked; });
}

function updateS7CheckAll(){
  var cbs = document.querySelectorAll('.s7-camp-cb');
  var all = document.getElementById('s7-check-all');
  if(all) all.checked = [...cbs].every(function(cb){ return cb.checked; });
}

// 캠페인 성과 상세 팝업
function openS7Detail(campId){
  var camp = DB.campaigns.find(function(x){return x.id===campId;});
  if(!camp) return;
  var existing = document.getElementById('s7-detail-modal');
  if(existing) existing.remove();

  var revenue   = camp.settleRevenue || 0;
  var orders    = camp.settleOrders  || 0;
  var fmt = function(n){ return n ? n.toLocaleString('ko-KR')+'원' : '-'; };
  var pct = function(a,b){ return (b&&a) ? (a/b*100).toFixed(1)+'%' : '-'; };

  // settleData에서 정산 상세 정보 읽기
  var sd0      = (camp.settleData && camp.settleData[0]) || {};
  var sdSkus   = sd0.skuItems || [];
  var totalInflow  = sdSkus.reduce(function(s,si){return s+(si.inflow||0);},0);
  var totalNewMem  = sdSkus.reduce(function(s,si){return s+(si.newMembers||0);},0);
  var totalBuyers  = sdSkus.reduce(function(s,si){return s+(si.buyers||0);},0);
  var totalNetOrd  = sdSkus.reduce(function(s,si){return s+(si.netOrders||0);},0);
  var sdViews      = sd0.views    || 0;
  var sdComments   = sd0.comments || 0;
  var ctrVal = totalInflow>0 ? (totalNetOrd/totalInflow*100).toFixed(2) : '';
  var _d2CF2   = Math.round((sd0.commFeeVat||0) / 1.1);
  var taxSupply= _d2CF2 + (sd0.fixedFee||0) + (sd0.metaFee||0);
  var totalCost= taxSupply;
  // 반응도/도달 데이터 (s7Perf 또는 settleData 우선)
  var perf = camp.s7Perf || {};

  var el = document.createElement('div');
  el.id = 's7-detail-modal';
  el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.25);z-index:9999;display:flex;align-items:center;justify-content:center;overflow-y:auto';
  el.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r-lg);padding:28px 32px;min-width:480px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'
    + '<div style="font-size:16px;font-weight:800">📈 성과 상세 · '+camp.name+'</div>'
    + '<button class="btn btn-ghost btn-xs" onclick="document.getElementById(&quot;s7-detail-modal&quot;).remove()">✕</button>'
    + '</div>'

    // 매출 정보
    + '<div style="margin-bottom:16px;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--r);padding:14px">'
    + '<div style="font-weight:700;color:var(--text2);margin-bottom:10px">💰 매출 정보</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    + '<div style="background:var(--bg2);border-radius:var(--r-sm);padding:10px;text-align:center"><div style="font-size:11px;color:var(--text3);margin-bottom:4px">전체 매출</div><div style="font-size:18px;font-weight:800;color:var(--green)">'+fmt(revenue)+'</div></div>'
    + '<div style="background:var(--bg2);border-radius:var(--r-sm);padding:10px;text-align:center"><div style="font-size:11px;color:var(--text3);margin-bottom:4px">주문건수</div><div style="font-size:18px;font-weight:800;color:var(--blue)">'+(orders||'-')+'건</div></div>'
    + '</div></div>'

    // 비용 (세금계산서 공급가액 기준)
    + '<div style="margin-bottom:16px;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--r);padding:14px">'
    + '<div style="font-weight:700;color:var(--text2);margin-bottom:10px">📊 비용 (세금계산서 공급가액)</div>'
    + '<div style="display:flex;flex-direction:column;gap:7px;font-size:13px">'
    + '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">수수료 광고비2 (부가세별도)</span><span style="font-weight:600">'+fmt(_d2CF2)+'</span></div>'
    + '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">정액 광고비 (부가세별도)</span><span style="font-weight:600">'+fmt(sd0.fixedFee||0)+'</span></div>'
    + '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">별도 광고비 (메타광고)</span><span style="font-weight:600">'+fmt(sd0.metaFee||0)+'</span></div>'
    + (sd0.commFeeVat ? '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">수수료 광고비 (부가세포함)</span><span style="font-weight:600">'+fmt(sd0.commFeeVat)+'</span></div>' : '')
    + '<div style="border-top:1px solid var(--border2);padding-top:8px;margin-top:4px;display:flex;justify-content:space-between"><span style="font-weight:800">세금계산서 공급가액 합계</span><span style="font-weight:800;color:var(--orange);font-size:15px">'+fmt(taxSupply)+'</span></div>'
    + '</div></div>'

    // 인플루언서 매출 실적 (settleData 기반)
    + '<div style="margin-bottom:16px;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--r);padding:14px">'
    + '<div style="font-weight:700;color:var(--text2);margin-bottom:10px">🎯 인플루언서 매출 실적</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">'
    + '<div style="background:var(--bg2);border-radius:var(--r-sm);padding:10px;text-align:center"><div style="font-size:11px;color:var(--text3);margin-bottom:4px">당사유입</div><div style="font-size:16px;font-weight:800;color:var(--blue)">'+(totalInflow ? totalInflow.toLocaleString() : '-')+'</div></div>'
    + '<div style="background:var(--bg2);border-radius:var(--r-sm);padding:10px;text-align:center"><div style="font-size:11px;color:var(--text3);margin-bottom:4px">구매자수</div><div style="font-size:16px;font-weight:800;color:var(--blue)">'+(totalBuyers ? totalBuyers.toLocaleString() : '-')+'</div></div>'
    + '<div style="background:var(--bg2);border-radius:var(--r-sm);padding:10px;text-align:center"><div style="font-size:11px;color:var(--text3);margin-bottom:4px">신규가입</div><div style="font-size:16px;font-weight:800;color:var(--purple)">'+(totalNewMem ? totalNewMem.toLocaleString() : '-')+'</div></div>'
    + '<div style="background:var(--bg2);border-radius:var(--r-sm);padding:10px;text-align:center"><div style="font-size:11px;color:var(--text3);margin-bottom:4px">CTR (전환율)</div><div style="font-size:16px;font-weight:800;color:var(--accent2)">'+(ctrVal ? ctrVal+'%' : '-')+'</div></div>'
    + '<div style="background:var(--bg2);border-radius:var(--r-sm);padding:10px;text-align:center"><div style="font-size:11px;color:var(--text3);margin-bottom:4px">조회수</div><div style="font-size:16px;font-weight:800;color:var(--text2)">'+(sdViews ? sdViews.toLocaleString() : '-')+'</div></div>'
    + '<div style="background:var(--bg2);border-radius:var(--r-sm);padding:10px;text-align:center"><div style="font-size:11px;color:var(--text3);margin-bottom:4px">릴스댓글</div><div style="font-size:16px;font-weight:800;color:var(--text2)">'+(sdComments ? sdComments.toLocaleString() : '-')+'</div></div>'
    + '</div></div>'

    + '<div style="display:flex;justify-content:space-between;align-items:center">'
    + '<span style="font-size:11px;color:var(--text3)">※ 상세 정보는 정산 화면에서 수정 가능합니다.</span>'
    + '<button class="btn btn-ghost" onclick="document.getElementById(&quot;s7-detail-modal&quot;).remove()">닫기</button>'
    + '</div></div>';

  document.body.appendChild(el);
  // 외부 클릭으로 닫기 비활성화
  // 초기 계산
  setTimeout(function(){ calcS7Reach(campId); }, 50);
}

function calcS7Reach(campId){
  var camp = DB.campaigns.find(function(x){return x.id===campId;});
  var orders = camp ? (camp.settleOrders||0) : 0;
  var views  = parseFloat(document.getElementById('s7-views')?.value)||0;
  var inflow = parseFloat(document.getElementById('s7-inflow')?.value)||0;
  var viewsAbs = views * 10000; // 만 단위 → 실수

  var ir = document.getElementById('s7-inflow-rate');
  var cr = document.getElementById('s7-conv-rate');
  if(ir) ir.value = (viewsAbs && inflow) ? (inflow/viewsAbs*100).toFixed(2)+'%' : '-';
  if(cr) cr.value = (inflow && orders)   ? (orders/inflow*100).toFixed(2)+'%'   : '-';
}

function saveS7Detail(campId, orders, revenue){
  var idx = DB.campaigns.findIndex(function(x){return x.id===campId;});
  if(idx===-1) return;
  DB.campaigns[idx].s7Perf = {
    views:    parseFloat(document.getElementById('s7-views')?.value)||0,
    comments: parseInt(document.getElementById('s7-comments')?.value)||0,
    likes:    parseInt(document.getElementById('s7-likes')?.value)||0,
    inflow:   parseInt(document.getElementById('s7-inflow')?.value)||0,
  };
  document.getElementById('s7-detail-modal').remove();
  _suppressListener = true;
  var payload = {
    products:arrToObj(DB.products),campaigns:arrToObj(DB.campaigns),influencers:arrToObj(DB.influencers),
    matches:arrToObj(DB.matches),progress:arrToObj(DB.progress),mcnRequests:arrToObj(DB.mcnRequests||[]),
    appMarketing:arrToObj(DB.appMarketing||[]),settlements:arrToObj(DB.settlements||[]),
    activities:arrToObj(DB.activities.slice(0,30)),comments:DB.comments,history:DB.history,
    _lastWriter:ME||ME_EMAIL,_lastWrite:Date.now()
  };
  (fbReady?fbRef.update(JSON.parse(JSON.stringify(payload))):Promise.resolve())
    .then(function(){setTimeout(function(){_suppressListener=false;_myLastSaveCamps=null;},8000);})
    .catch(function(){_suppressListener=false;});
  renderReports();
  showToast('성과 정보 저장됨');
}

// ═══════════════════════════════════════
// EMAIL
// ═══════════════════════════════════════
function openEmailMo(){
  document.getElementById('em-inf').innerHTML=DB.influencers.map(i=>`<option value="${i.id}">${i.name} (${i.contact||i.handle})</option>`).join('');
  openMo('email'); genEmail();
}
function genEmail(){
  var infId=parseInt(document.getElementById('em-inf').value);
  var type=document.getElementById('em-type').value;
  var inf=getInf(infId), camp=DB.campaigns[0];
  var T={
    invite:{subj:`[협업 제안] ${camp?.name||'캠페인'} 인플루언서 협업 문의`,body:`안녕하세요, ${inf.name}님 🙏\n\n저희는 현재 "${camp?.name||'캠페인'}" 캠페인을 준비하고 있으며, ${inf.name}님과 협업을 제안드립니다.\n\n▶ 캠페인 개요\n- 상품: ${getProd(camp?.product).name||'-'}\n- 기간: ${camp?.start||'-'} ~ ${camp?.end||'-'}\n\n관심이 있으시면 연락 주세요. 브리핑 자료를 전달해드리겠습니다.\n\n감사합니다.`},
    confirm:{subj:`[확정 안내] ${camp?.name||'캠페인'} 협업 확정`,body:`안녕하세요, ${inf.name}님!\n\n${camp?.name||'캠페인'} 캠페인 협업이 확정됐습니다.\n\n기간: ${camp?.start||'-'} ~ ${camp?.end||'-'}\n해시태그: ${camp?.tags||'-'}\n\n상품 발송 및 상세 일정은 별도 안내 예정입니다.\n\n감사합니다.`},
    brief:{subj:`[브리핑] ${camp?.name||'캠페인'} 콘텐츠 가이드`,body:`안녕하세요, ${inf.name}님!\n\n${camp?.name||'캠페인'} 브리핑을 전달드립니다.\n\n▶ 방향: ${camp?.desc||'-'}\n▶ 해시태그: ${camp?.tags||'-'}\n▶ 프로모션: ${camp?.promo||'-'}\n\n궁금한 점은 언제든지 연락 주세요!\n\n감사합니다.`},
    review:{subj:`[검수 요청] ${camp?.name||'캠페인'} 콘텐츠 확인 요청`,body:`안녕하세요, ${inf.name}님!\n\n업로드 전 콘텐츠 검수를 요청드립니다.\n\n체크리스트:\n☐ 제품명 정확히 기재\n☐ 해시태그 포함: ${camp?.tags||'-'}\n☐ 광고 표기 (#광고)\n☐ 브랜드 계정 태그\n\n감사합니다.`}
  };
  var t=T[type]; if(!t) return;
  document.getElementById('em-subject').value=t.subj;
  document.getElementById('em-body').value=t.body;
}
function copyEmail(){ navigator.clipboard.writeText(document.getElementById('em-subject').value+'\n\n'+document.getElementById('em-body').value).then(()=>showToast('클립보드에 복사됨')); }
function sendEmail(){
  var infId=parseInt(document.getElementById('em-inf').value), inf=getInf(infId);
  var to=inf.contact?.includes('@')?inf.contact:'';
  window.location.href=`mailto:${to}?subject=${encodeURIComponent(document.getElementById('em-subject').value)}&body=${encodeURIComponent(document.getElementById('em-body').value)}`;
}

// ═══════════════════════════════════════
function exportExcel(type){
  var wb=XLSX.utils.book_new(), ws, name;
  if(type==='products'){
    ws=XLSX.utils.json_to_sheet(DB.products.map(p=>({상품명:p.name,업체:p.company,브랜드:p.brand,카테고리:p.cat,상품코드:p.code,단가:p.price,담당MD:p.owner,예상매출:p.revenue,인플루언서규모:p.infSize,진행기간:p.period})));
    name='캠페인요청';
  } else if(type==='campaigns'){
    ws=XLSX.utils.json_to_sheet(DB.campaigns.map(c=>({캠페인명:c.name,연결상품:getProd(c.product).name,예산:c.budget,시작일:c.start,종료일:c.end,목표인원:c.target,담당자:c.owner,단계:c.stage,프로모션:c.promo,해시태그:c.tags})));
    name='캠페인';
  } else if(type==='influencers'){
    ws=XLSX.utils.json_to_sheet(DB.influencers.map(i=>({이름:i.name,채널:i.handle,플랫폼:i.platform,팔로워:i.followers,참여율:i.engage+'%',카테고리:i.cat,연락처:i.contact,단가:i.fee})));
    name='인플루언서DB';
  } else if(type==='matches'){
    ws=XLSX.utils.json_to_sheet(DB.matches.map(m=>({인플루언서:getInf(m.inf).name,캠페인:getCamp(m.campaign).name,상품:getProd(m.product).name,담당자:m.owner,상태:m.status,요청일:m.date})));
    name='매칭내역';
  } else if(type==='mcn'){
    ws=XLSX.utils.json_to_sheet((DB.mcnRequests||[]).map(r=>({캠페인:getCamp(r.campaign).name,MCN업체:r.agency,인플루언서:getInf(r.inf).name,카테고리:r.category,수수료:r.fee+'%',상태:r.status})));
    name='MCN요청';
  } else if(type==='settlement'){
    ws=XLSX.utils.json_to_sheet((DB.settlements||[]).map(s=>({캠페인:getCamp(s.campaign).name,인플루언서:getInf(s.inf).name,전체매출:s.revenue,인플루언서수수료:s.infFee,에이전시수수료:s.agencyFee,광고수익:s.daFee,정산상태:s.status})));
    name='정산';
  } else if(type==='report'){
    var selectedIds = {};
    document.querySelectorAll('.s7-camp-cb:checked').forEach(function(cb){ selectedIds[cb.value]=true; });
    var selectedCamps = _s7FilteredCamps.filter(function(c){ return selectedIds[c.id]; });
    if(!selectedCamps.length){ showToast('선택된 캠페인이 없습니다'); return; }
    ws=XLSX.utils.json_to_sheet(selectedCamps.map(function(c){
      var revenue=c.settleRevenue||0, orders=c.settleOrders||0;
      var feeRate=parseFloat(c.feeRate)||0, feeAmt=parseInt(c.feeAmount)||0;
      var agRate=parseFloat(c.agencyRate)||0, daFee=parseInt(c.settleDa)||0;
      var infFee=Math.round(revenue*feeRate/100), agFee=Math.round(revenue*agRate/100);
      return {캠페인명:c.name,규모:c.infSize||c.role||'',MDCAT:c.mdcat||'',카테고리:c.cat||'',
        MCN업체:c.mcn||'',인플루언서:c.infName||'',매출:revenue,건수:orders,
        인플루언서수수료:infFee,원고료:feeAmt,에이전시수수료:agFee,광고수익:daFee,
        비용합계:infFee+feeAmt+agFee+daFee,
        시작일:(c.start||c.startDate||'').slice(0,10),종료일:(c.end||c.endDate||'').slice(0,10)};
    }));
    name='성과리포트';
  }
  if(!ws){ showToast('내보낼 데이터 없음'); return; }
  XLSX.utils.book_append_sheet(wb,ws,name);
  XLSX.writeFile(wb,`influencer-hub-${name}-${today()}.xlsx`);
  showToast(`${name}.xlsx 다운로드됨`);
}

// ═══════════════════════════════════════
// MODAL SAVE
// ═══════════════════════════════════════
// 신규 캠페인 요청 등록
function openNewProd(){
  updateInfDbList();
  document.getElementById('p-edit-id').value='';
  document.getElementById('prod-mo-title').textContent='캠페인 등록';
  document.getElementById('prod-save-btn').textContent='캠페인 등록';
  var delBtn2=document.getElementById('prod-del-btn'); if(delBtn2) delBtn2.style.display='none';
  var expBtn2=document.getElementById('prod-export-btn'); if(expBtn2) expBtn2.style.display='none';
  // 신규 등록 시 상태 배지 + 공유 버튼 숨김
  var sa=document.getElementById('prod-stage-area'); if(sa) sa.style.display='none';
  var ccEl=document.getElementById('p-campcode'); if(ccEl) ccEl.style.display='none';
  var lcBdg=document.getElementById('p-livecode-badge'); if(lcBdg) lcBdg.style.display='none';
  // 신규 등록 시 캠페인 유형 라디오 활성화
  var _ctInf2=document.getElementById('p-camptype-inf'); if(_ctInf2) _ctInf2.disabled=false;
  var _ctMl2=document.getElementById('p-camptype-mlive'); if(_ctMl2) _ctMl2.disabled=false;
  var _ctLock2=document.getElementById('p-camptype-lock-msg'); if(_ctLock2) _ctLock2.style.display='none';
  showKakaoShareBtn(null);
  // 담당자 드롭다운 갱신
  refreshManagerDropdowns();
  // 검색형 드롭다운 초기화
  searchSelSetValue('p-owner', '');
  searchSelSetValue('p-mlive-md', '');
  searchSelSetValue('p-pd-single', '');
  searchSelSetValue('p-host-req1',  '');
  searchSelSetValue('p-host-req2',  '');
  searchSelSetValue('p-host-conf1', '');
  searchSelSetValue('p-host-conf2', '');
  var atEl3=document.getElementById('p-appeal-total'); if(atEl3) atEl3.value='';
  var apEl3=document.getElementById('p-appeal-push');  if(apEl3) apEl3.value='';
  ['p-name','p-company','p-brand','p-cat','p-deal-code','p-owner','p-start','p-end','p-appeal','p-product-basic-info','p-cs-info','p-delivery-info','p-inf-request','p-revenue','p-budget','p-target','p-mdcat','p-mcn','p-fee-rate','p-fee-amount','p-inf-name','p-pd-single','p-sample-address','p-youtube-ch','p-insta-ch','p-twitter-ch','p-courier','p-ship-cutoff','p-ship-fee','p-island-fee','p-exchange-fee','p-return-fee','p-settle-process-date','p-settle-payment-date'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  // 고정 기본 텍스트 복원
  var pbiReset=document.getElementById('p-product-basic-info'); if(pbiReset){ pbiReset.value=DEFAULT_PRODUCT_BASIC_INFO; pbiReset.nextElementSibling.textContent=DEFAULT_PRODUCT_BASIC_INFO.length+'/2000'; }
  var csReset=document.getElementById('p-cs-info'); if(csReset){ csReset.value=DEFAULT_CS_INFO; csReset.nextElementSibling.textContent=DEFAULT_CS_INFO.length+'/500'; }
  // 인플루언서 블록 초기화
  infBlockCount = 0;
  renderInfBlocks([]);
  renderSettleBlocks([]);
  document.querySelectorAll('.p-promo-cb').forEach(function(cb){ cb.checked=false; });
  var ptEl=document.getElementById('p-promo-text'); if(ptEl) ptEl.value='';
  var mpEl=document.getElementById('p-market-price'); if(mpEl) mpEl.value='';
  var gpEl=document.getElementById('p-group-price');  if(gpEl) gpEl.value='';
  document.querySelectorAll('input[name="p-role"]').forEach(function(r){ r.checked=false; });
  updateProdRoleLabels();
  // 캠페인 유형 초기화: 기본 모바일라이브
  var ctInf = document.getElementById('p-camptype-inf');
  var ctMl  = document.getElementById('p-camptype-mlive');
  if(ctInf) ctInf.checked = false;
  if(ctMl)  ctMl.checked  = true;
  updateCampTypeUI();
  ['bas-reason-target','bas-reason-new','bas-reason-encore'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.checked=false;
  });
  document.querySelectorAll('.appmkt-cb').forEach(function(cb){ cb.checked=false; });
  // 모바일라이브 캠페인은 모바일라이브 채널 디폴트 체크
  var _isMliveType = document.getElementById('p-camptype-mlive')?.checked;
  if(_isMliveType){
    var liveCb = document.getElementById('appmkt-live');
    if(liveCb) liveCb.checked = true;
  }
  ['ch-youtube','ch-insta'].forEach(function(id){ var el=document.getElementById(id); if(el) el.checked=false; });
  var naCk2=document.getElementById('appmkt-na'); if(naCk2){ naCk2.checked=false; }
  _mliveCodes=[]; renderMliveCodeTags();
  var naArea=document.getElementById('appmkt-channels-area'); if(naArea){ naArea.style.opacity=''; naArea.style.pointerEvents=''; }
  var cyf=document.getElementById('ch-youtube-field'); if(cyf) cyf.style.display='none';
  var cif=document.getElementById('ch-insta-field');   if(cif) cif.style.display='none';
  var cyl=document.getElementById('p-youtube-link');   if(cyl){ cyl.style.display='none'; cyl.href='#'; }
  var cil=document.getElementById('p-insta-link');     if(cil){ cil.style.display='none'; cil.href='#'; }
  // 인라인 입력 상태는 toggleAppMktFields에서 일괄 처리
  toggleAppMktFields();
  ['appmkt-super-start','appmkt-super-end','appmkt-live-dt','appmkt-live-code','appmkt-dmp-send','appmkt-push-send','appmkt-kakao-send','appmkt-ssg-amount','appmkt-ssg-count','appmkt-starbucks-count','appmkt-landing-url','appmkt-deal-url'].forEach(function(id){ var el=document.getElementById(id); if(el){ el.value=''; el.disabled=true; } });
  // 모바일라이브 캠페인이면 모바일라이브 채널 활성화
  if(_isMliveType){
    var liveCode2=document.getElementById('appmkt-live-code'); if(liveCode2) liveCode2.disabled=false;
    var liveDt2=document.getElementById('appmkt-live-dt'); if(liveDt2) liveDt2.disabled=false;
    var lsb2=document.getElementById('appmkt-live-code-search-btn'); if(lsb2) lsb2.style.display='';
  }
  var ssEl2=document.getElementById('p-sample-sent'); if(ssEl2) ssEl2.checked=false;
  var sfCk=document.getElementById('p-ship-free'); if(sfCk) sfCk.checked=false;
  var ifCk=document.getElementById('p-island-free'); if(ifCk) ifCk.checked=false;
  var sfInp=document.getElementById('p-ship-fee'); if(sfInp){ sfInp.disabled=false; sfInp.value=''; }
  var ifInp=document.getElementById('p-island-fee'); if(ifInp){ ifInp.disabled=false; ifInp.value=''; }
  // 정산/수수료 필드 초기화 (이전 캠페인 데이터 잔류 방지)
  var sdCk2=document.getElementById('p-settle-done'); if(sdCk2) sdCk2.checked=false;
  // 캠페인 유형 초기화
  var ctOn = document.getElementById('p-camptype-online');
  var ctBr = document.getElementById('p-camptype-broadcast');
  if(ctOn) ctOn.checked = false;
  if(ctBr) ctBr.checked = false;
  updateCamptypeLabels();
  var sdInp2=document.getElementById('p-settle-da'); if(sdInp2) sdInp2.value='';
  var arInp2=document.getElementById('p-agency-rate'); if(arInp2) arInp2.value='';
  var seEl2=document.getElementById('p-sample-exempt'); if(seEl2) seEl2.checked=false;
  var saEl2=document.getElementById('p-sample-address'); if(saEl2) saEl2.value='';
  var pbiEl2=document.getElementById('p-product-basic-info'); if(pbiEl2){ pbiEl2.value=DEFAULT_PRODUCT_BASIC_INFO; pbiEl2.nextElementSibling.textContent=DEFAULT_PRODUCT_BASIC_INFO.length+'/2000'; }
  var csEl2=document.getElementById('p-cs-info'); if(csEl2){ csEl2.value=DEFAULT_CS_INFO; csEl2.nextElementSibling.textContent=DEFAULT_CS_INFO.length+'/500'; }
  var diEl2=document.getElementById('p-delivery-info'); if(diEl2){ diEl2.value=''; diEl2.nextElementSibling.textContent='0/300'; }
  var irEl2=document.getElementById('p-inf-request'); if(irEl2){ irEl2.value=''; irEl2.nextElementSibling.textContent='0/300'; }
  var arEl2=document.getElementById('p-agency-rate'); if(arEl2) arEl2.value='';
  var srEl2=document.getElementById('p-settle-revenue'); if(srEl2) srEl2.value='';
  var soEl2=document.getElementById('p-settle-orders'); if(soEl2) soEl2.value='';
  var sdEl2=document.getElementById('p-settle-da'); if(sdEl2) sdEl2.value='';
  var miEl2=document.getElementById('p-marketing-items'); if(miEl2) miEl2.value='';
  var prEl2=document.getElementById('p-profit-rate'); if(prEl2) prEl2.value='';
  var aiEl2=document.getElementById('p-ad-income'); if(aiEl2) aiEl2.value='';
  var trEl2=document.getElementById('p-total-revenue'); if(trEl2) trEl2.value='';
  var orEl2=document.getElementById('p-onair-revenue'); if(orEl2) orEl2.value='';
  var ofEl2=document.getElementById('p-offair-revenue'); if(ofEl2) ofEl2.value='';
  var lcEl2=document.getElementById('p-live-code'); if(lcEl2) lcEl2.value='';
  var sdonEl2=document.getElementById('p-settle-done'); if(sdonEl2) sdonEl2.checked=false;
  // SKU + 가격 행 초기화 (다른 캠페인 데이터 유출 방지)
  var skuListEl = document.getElementById('sku-list');
  if(skuListEl) skuListEl.innerHTML = '';
  addSkuRow(); // 빈 행 1개
  // (priceGrid는 sku에 통합됐으므로 별도 초기화 불필요)
  calcSettleCost();
  initSections(false);
  openMo('product');
  applyModalPermissions();
}

// external_mcn 전용: 인플루언서 정보만 저장
function saveProdMcnOnly(){
  var id = parseInt(document.getElementById('p-edit-id').value);
  if(!id){ showToast('캠페인 ID가 없습니다.'); return; }
  var idx = DB.campaigns.findIndex(function(c){ return c.id === id; });
  if(idx === -1){ showToast('캠페인을 찾을 수 없습니다.'); return; }
  // 본인 MCN 캠페인인지 재확인
  if(!campHasMcn(DB.campaigns[idx], ME_MCN_COMPANY)){
    showToast('본인 MCN 담당 캠페인만 수정할 수 있습니다.'); return;
  }
  // 인플루언서 블록 데이터만 읽어 저장
  var infData = getInfBlocksData();
  DB.campaigns[idx] = Object.assign({}, DB.campaigns[idx], {
    infData: infData,
    infName: infData[0] ? infData[0].infName : (DB.campaigns[idx].infName||''),
    stage: '5.인플루언서확정'
  });
  _myLastSaveTime = Date.now();
  _myLastSaveCamps = JSON.parse(JSON.stringify(DB.campaigns));
  _suppressListener = true;
  pushToFirebase();
  closeMo('product');
  renderS5();
  showToast('인플루언서 정보 저장 완료');
}

function saveProd(){
  // ── 권한 체크 ──
  if(isViewer()){ showToast('조회 전용 계정입니다.'); return; }
  // external_mcn은 인플루언서 정보만 저장 (별도 처리)
  if(isExtMcn()){ saveProdMcnOnly(); return; }
  // M라이브 편성 중복 체크 (팝업만, 저장 차단 안 함)
  if(getCampType()==='모바일라이브') checkMliveScheduleDupOnSave();
  // ── 필수값 검증 ──
  var name    = document.getElementById('p-name').value.trim();
  var pStart  = document.getElementById('p-start').value;
  var pEnd    = document.getElementById('p-end').value;
  var revenue = (document.getElementById('p-revenue').value||'').replace(/,/g,'');
  var budget  = (document.getElementById('p-budget').value||'').replace(/,/g,'');
  var role    = document.querySelector('input[name="p-role"]:checked');

  // 확정 사유 체크 여부 확인
  var hasReasons = document.querySelectorAll('.bas-reason-cb:checked').length > 0;

  var missing = [];
  if(!name)              missing.push('캠페인명');
  if(!pStart)            missing.push('시작일');
  if(!pEnd)              missing.push('종료일');
  if(!revenue.trim())    missing.push('예상 매출');
  if(!budget.trim() && getCampType()!=='모바일라이브') missing.push('예산');
  if(!role && getCampType()!=='모바일라이브') missing.push('캠페인 역할');
  var _noMdcat = !(v('p-mdcat')); // MDCAT 없으면 저장 후 경고 표시

  // 확정 사유 체크 여부만 확인 (상품정보 필수 검증 제거)

  // 모바일라이브: 확정일자 미입력 경고 (저장 차단은 하지 않고, 저장 후 안내)
  var _mliveNoConfirm = false;
  if(getCampType()==='모바일라이브'){
    var _cs = (document.getElementById('p-confirm-start')?.value||'').trim();
    var _ce = (document.getElementById('p-confirm-end')?.value||'').trim();
    if(!_cs || !_ce) _mliveNoConfirm = true;
  }
  // 모바일라이브 재방: 편성코드 미입력 경고
  var _rebroadcastNoCode = false;
  if(getCampType()==='모바일라이브'){
    var _rName = (document.getElementById('p-name')?.value||'');
    var _rCode = (document.getElementById('appmkt-live-code')?.value||'').trim();
    if(_rName.indexOf('다시보는')>=0 && !_rCode) _rebroadcastNoCode = true;
  }

  // APP 마케팅 날짜 검증
  var superChecked = document.getElementById('appmkt-super')?.checked;
  var liveChecked  = document.getElementById('appmkt-live')?.checked;
  if(superChecked){
    if(!document.getElementById('appmkt-super-start')?.value) missing.push('[모바일마케팅] 슈퍼브랜드 시작일');
    if(!document.getElementById('appmkt-super-end')?.value)   missing.push('[모바일마케팅] 슈퍼브랜드 종료일');
  }
  if(liveChecked && !document.getElementById('appmkt-live-dt')?.value) missing.push('[모바일마케팅] 모바일라이브 방송일시');

  console.log('[saveProd] missing:', missing, 'name:', name, 'role:', role?.value, 'budget:', budget, 'revenue:', revenue);
  if(missing.length > 0){
    // 누락 항목에 상품/가격 정보가 있으면 해당 섹션 자동 펼치기
    if(missing.some(function(m){ return m.includes('[상품정보]'); })){
      var sb=document.getElementById('sec-product'); if(sb) sb.classList.add('open');
      var ab=document.getElementById('arr-sec-product'); if(ab) ab.style.transform='rotate(180deg)';
    }
    if(missing.some(function(m){ return m.includes('[가격정보]'); })){

    }
    if(missing.some(function(m){ return m.includes('[상품코드]'); })){
      var sb3=document.getElementById('sec-product'); if(sb3) sb3.classList.add('open');
      var ab3=document.getElementById('arr-sec-product'); if(ab3) ab3.style.transform='rotate(180deg)';
    }
    showValidationModal(missing);
    return;
  }
  var pdSingle = document.getElementById('p-pd-single')?.value.trim()||'';
  var pds = pdSingle ? [pdSingle] : [];
  var promos = [...document.querySelectorAll('.p-promo-cb:checked')].map(function(cb){return cb.value;});
  var skuRows2 = document.querySelectorAll('#sku-list .sku-row');
  var skus = [...skuRows2].map(function(row, i){
    var parse = function(cls){ return parseInt((row.querySelector(cls)?.value||'').replace(/,/g,''))||0; };
    var md=parse('.pg-md'), card=parse('.pg-card'), mile=parse('.pg-mileage'), cpn=parse('.pg-coupon');
    var bcpn2=parse('.pg-broadcast-coupon'), postM2=parse('.pg-post-mileage');
    return {
      num: i+1,
      isMain: !!(row.querySelector('.sku-main') && row.querySelector('.sku-main').checked),
      code: (row.querySelector('.sku-code')?.value||'').trim(),
      mdcat: (row.querySelector('.sku-mdcat')?.value||'').trim(),
      cat: (row.querySelector('.sku-cat')?.value||'').trim(),
      productName: (row.querySelector('.sku-pname')?.value||'').trim(),
      brand: (row.querySelector('.sku-brand')?.value||'').trim(),
      price: parse('.pg-price'),
      mdPrice: md,
      cardDiscount: card,
      mileage: mile,
      coupon: cpn,
      broadcastCoupon: bcpn2,
      postMileage: postM2,
      promoText: (row.querySelector('.pg-promo')?.value||'').trim(),
      onlineLowestPrice: parseInt((row.querySelector('.pg-online-lowest')?.value||'').replace(/,/g,''))||0,
      stock: parseInt((row.querySelector('.pg-stock')?.value||'').replace(/,/g,''))||0,
      finalPrice: md>0 ? Math.max(0,md-card-mile-cpn-bcpn2-postM2) : 0,
    };
  }).filter(function(s){
    // 상품코드 없어도 저장 — 어떤 값이든 하나라도 입력됐으면 저장
    return s.code || s.productName || s.mdcat || s.cat || s.brand || s.price > 0 || s.mdPrice > 0;
  });
  var editId = document.getElementById('p-edit-id').value;
  var prodRole = document.querySelector('input[name="p-role"]:checked')?.value||'';
  var campType = document.querySelector('input[name="p-camptype"]:checked')?.value||'인플루언서';
  // getInfBlocksData 캐싱 (DOM 반복 읽기 방지)
  var _infData = getInfBlocksData();
  var _inf0 = _infData[0] || {};
  var newData = {
    name:name, company:v('p-company'), brand:v('p-brand'), cat:v('p-cat'),
    owner: campType==='모바일라이브' ? (v('p-mlive-md')||v('p-owner')) : v('p-owner'), revenue:iv('p-revenue'),
    budget:iv('p-budget'), target:iv('p-target'),
    skus: skus, // ← 상품코드+가격 통합 데이터
    infData: _infData,
    infSize:  _inf0.infSize||'',
    infName:  _inf0.infName||'',
    mcn:      _inf0.mcn||'',
    feeRate:  _inf0.feeRate||0,
    feeAmount:_inf0.feeAmount||0,
    agencyRate:_inf0.agencyRate||0,
    sampleSent:    !!_inf0.sampleSent,
    sampleExempt:  !!_inf0.sampleExempt,
    sampleAddress: _inf0.sampleAddress||'',
    role:prodRole,
    campType:campType,
    channels: {
      youtube: _inf0.youtube || (document.getElementById('ch-youtube')?.checked ? (document.getElementById('p-youtube-ch')?.value.trim()||'') : ''),
      insta:   _inf0.insta   || (document.getElementById('ch-insta')?.checked   ? (document.getElementById('p-insta-ch')?.value.trim()||'')   : ''),
      twitter: _inf0.twitter||''
    },
    mdcat:v('p-mdcat'),
    // mcn/feeRate/feeAmount/agencyRate/sampleSent은 위 infBlocks 값 사용 (중복 선언 제거)
    // settleRevenue/settleOrders는 settleData에서 합산
    showhosts: {
      req1:  (document.getElementById('p-host-req1')?.value||'').trim(),
      req2:  (document.getElementById('p-host-req2')?.value||'').trim(),
      conf1: (document.getElementById('p-host-conf1')?.value||'').trim(),
      conf2: (document.getElementById('p-host-conf2')?.value||'').trim(),
    },
    settleDa:      iv('p-settle-da'),
    marketingItems: (document.getElementById('p-marketing-items')?.value||'').trim(),
    profitRateInput: parseFloat(document.getElementById('p-profit-rate')?.value)||0,
    adIncome:      iv('p-ad-income'),
    totalRevenue:  iv('p-total-revenue'),
    onairRevenue:  iv('p-onair-revenue'),
    offairRevenue: iv('p-offair-revenue'),
    settleDone:    !!(document.getElementById('p-settle-done')?.checked),
    infRevIncludeMlive: !!(document.getElementById('p-inf-rev-include-mlive')?.checked),
    // 모바일라이브 편성코드 → appMkt에 병합
    _liveCodeInput: (document.getElementById('appmkt-live-code')?.value||'').trim(),
    settleData:    getSettleBlocksData(),
    settleRevenue: getSettleBlocksData().reduce(function(s,d){return s+(d.revenue||0);},0),
    settleOrders:  getSettleBlocksData().reduce(function(s,d){return s+(d.orders||0);},0),
    start:v('p-start').slice(0,10), end:v('p-end').slice(0,10),
    startDate:v('p-start').slice(0,10), endDate:v('p-end').slice(0,10),
    appeal:v('p-appeal'), productBasicInfo:v('p-product-basic-info'), csInfo:v('p-cs-info'), deliveryInfo:v('p-delivery-info'), infRequest:v('p-inf-request'),
    settleProcessDate:v('p-settle-process-date'), settlePaymentDate:v('p-settle-payment-date'),
    promos:promos,
    dealCode:v('p-deal-code'), saleStart:v('p-sale-start'), saleEnd:v('p-sale-end'), eventText:v('p-event-text'), lowestPriceLink:v('p-lowest-price-link'),
    // 모바일라이브 전용 필드
    productMargin: parseFloat(document.getElementById('p-product-margin')?.value)||0,
    mliveReasons: (function(){ var r=[]; document.querySelectorAll('.mlive-reason-cb:checked').forEach(function(cb){ r.push(cb.value); }); return r; })(),
    mliveMktReq: (function(){ var r=[]; document.querySelectorAll('.mlive-mktreq-cb:checked').forEach(function(cb){ r.push(cb.value); }); return r; })(),
    mlivePartner: (function(){ var r=[]; document.querySelectorAll('.mlive-partner-cb:checked').forEach(function(cb){ r.push(cb.value); }); return r; })(),
    mliveExtChannel: (function(){ var r=[]; document.querySelectorAll('.mlive-extch-cb:checked').forEach(function(cb){ r.push(cb.value); }); return r; })(),
    confirmStart: v('p-confirm-start'), confirmEnd: v('p-confirm-end'),
    pushData: {
      reasons: (document.getElementById('p-push-reason')?.value||'').trim(),
      appeal: (document.getElementById('p-push-appeal')?.value||'').trim(),
      content: (document.getElementById('p-push-content')?.value||'').trim(),
      landingBase: (document.getElementById('p-push-landing-base')?.value||'').trim(),
      landingUrl: (function(){ var b=(document.getElementById('p-push-landing-base')?.value||'').trim(); return b ? b+PUSH_LANDING_SUFFIX : ''; })()
    },
    aiChat: {
      use: !!(document.getElementById('p-aichat-use')?.checked),
      learn: (document.getElementById('p-aichat-learn')?.value||'').trim().slice(0,50)
    },
    appealTotal: (document.getElementById('p-appeal-total')?.value||'').trim(),
    appealPush:  (document.getElementById('p-appeal-push')?.value||'').trim(),
    courier:v('p-courier'), shipCutoff:v('p-ship-cutoff'),
    shipFree:!!(document.getElementById('p-ship-free')?.checked),
    shipFee:parseInt((document.getElementById('p-ship-fee')?.value||'').replace(/,/g,''))||0,
    islandFree:!!(document.getElementById('p-island-free')?.checked),
    islandFee:parseInt((document.getElementById('p-island-fee')?.value||'').replace(/,/g,''))||0,
    exchangeFee:parseInt((document.getElementById('p-exchange-fee')?.value||'').replace(/,/g,''))||0,
    returnFee:parseInt((document.getElementById('p-return-fee')?.value||'').replace(/,/g,''))||0,
    priceGrid: getPriceGridData(), promoText:v('p-promo-text'),
    marketPrice:iv('p-market-price'), groupPrice:iv('p-group-price'),
    _priceValidFail: (function(){
      // 인플루언서명 있고 상품/가격 미입력이면 경고 플래그
      var infName3 = _inf0.infName||'';
      var mcnName2 = _inf0.mcn||v('p-mcn')||'';
      if(infName3 && mcnName2){
        var skusOk = Array.from(document.querySelectorAll('#sku-list .sku-row')).some(function(r){
          return (r.querySelector('.sku-code')?.value||'').trim()
              || (r.querySelector('.sku-pname')?.value||'').trim()
              || (r.querySelector('.sku-brand')?.value||'').trim();
        });
        var priceOk = Array.from(document.querySelectorAll('#sku-list .sku-row')).some(function(r){
          return (parseInt((r.querySelector('.pg-md')?.value||'').replace(/,/g,''))||0) > 0
              || (parseInt((r.querySelector('.pg-price')?.value||'').replace(/,/g,''))||0) > 0;
        });
        return !skusOk || !priceOk;
      }
      return false;
    })(),
    stage: (function(){
      // ── 모바일라이브 전용 단계 로직 ──
      if(campType==='모바일라이브'){
        var _confirmS = (document.getElementById('p-confirm-start')?.value||'').trim();
        var _confirmE = (document.getElementById('p-confirm-end')?.value||'').trim();
        var _hasConfirm = !!(_confirmS && _confirmE);
        // 확정시작/종료일 미입력 시 편성요청 단계 유지
        if(!_hasConfirm) return '1.캠페인요청';
        var _mlAppChs = [...document.querySelectorAll('.appmkt-cb:checked')];
        var _mlAppNa  = document.getElementById('appmkt-na')?.checked;
        var _mlSettle = iv('p-total-revenue') || iv('p-ad-income');
        if(_mlAppNa || _mlSettle) return '7.정산';
        if(_mlAppChs.length>0) return '6.APP마케팅확정';
        var _mlSkuF = Array.from(document.querySelectorAll('#sku-list .sku-row')).some(function(r){
          return (r.querySelector('.sku-code')?.value||'').trim()
              || (r.querySelector('.sku-pname')?.value||'').trim()
              || (r.querySelector('.sku-brand')?.value||'').trim();
        });
        if(_mlSkuF) return '3.상품정보등록';
        return '2.캠페인확정';
      }
      // ── 인플루언서 단계 로직 ──
      var appChs = [...document.querySelectorAll('.appmkt-cb:checked')];
      var appNa = document.getElementById('appmkt-na')?.checked;
      var firstInf = _inf0;
      var infName2 = _inf0.infName || '';
      var mcnName  = _inf0.mcn || v('p-mcn') || '';
      var hasChannel = !!(_inf0.youtube || _inf0.insta);
      var hasFee = !!(_inf0.feeRate || _inf0.feeAmount);
      var sampleSent = _infData.some(function(d){ return d.sampleSent || d.sampleExempt; });
      // 해당없음 체크 → 6.정산 단계로 바로 이동
      if(appNa) return '7.정산';
      // APP 채널 선택 → 5.APP마케팅확정
      if(appChs.length>0) return '6.APP마케팅확정';
      // 샘플발송 체크 → 5.APP마케팅확정
      if(sampleSent) return '6.APP마케팅확정';
      // 인플루언서명 입력 → 4.인플루언서확정 (상품정보+가격정보 필수)
      if(infName2){
        // 상품 정보 입력 여부 확인 (코드 OR 상품명 OR 브랜드 등 어떤 값이든)
        var skusFilled = (function(){
          var rows = document.querySelectorAll('#sku-list .sku-row');
          if(!rows.length) return false;
          return Array.from(rows).some(function(r){
            return (r.querySelector('.sku-code')?.value||'').trim()
                || (r.querySelector('.sku-pname')?.value||'').trim()
                || (r.querySelector('.sku-brand')?.value||'').trim()
                || (r.querySelector('.sku-mdcat')?.value||'').trim();
          });
        })();
        // 가격 정보 입력 여부 확인
        var priceFilled = (function(){
          var rows = document.querySelectorAll('#sku-list .sku-row');
          if(!rows.length) return false;
          return Array.from(rows).some(function(r){
            var md  = parseInt((r.querySelector('.pg-md')?.value||'').replace(/,/g,''))||0;
            var pri = parseInt((r.querySelector('.pg-price')?.value||'').replace(/,/g,''))||0;
            return md > 0 || pri > 0;
          });
        })();
        if(!skusFilled || !priceFilled){
          if(mcnName) return '4.MCN요청';
          return hasReasons ? '3.상품정보등록' : '2.캠페인확정';
        }
        return '5.인플루언서확정';
      }
      // MCN업체명 입력 → 4.MCN요청
      if(mcnName) return '4.MCN요청';
      // 상품 정보 OR 가격 입력 → 3.상품정보등록
      var skuF = Array.from(document.querySelectorAll('#sku-list .sku-row')).some(function(r){
        return (r.querySelector('.sku-code')?.value||'').trim()
            || (r.querySelector('.sku-pname')?.value||'').trim()
            || (r.querySelector('.sku-brand')?.value||'').trim()
            || (r.querySelector('.sku-mdcat')?.value||'').trim();
      });
      var priceF = Array.from(document.querySelectorAll('#sku-list .sku-row')).some(function(r){
        return (parseInt((r.querySelector('.pg-md')?.value||'').replace(/,/g,''))||0) > 0
            || (parseInt((r.querySelector('.pg-price')?.value||'').replace(/,/g,''))||0) > 0;
      });
      if(skuF || priceF) return '3.상품정보등록';
      // 확정 사유 입력 → 2.캠페인확정
      if(hasReasons) return '2.캠페인확정';
      // 기본 → 1.캠페인요청
      return '1.캠페인요청';
    })(),
    reasons: (function(){
      var r=[];
      document.querySelectorAll('.bas-reason-cb:checked').forEach(function(cb){ r.push(cb.value); });
      return r;
    })(),
    pds:pds, pdSingle:pdSingle, skus:skus,
    appMkt: (function(){
      var cbs=[...document.querySelectorAll('.appmkt-cb:checked')].map(function(cb){return cb.value;});
      return {
        channels:  cbs,
        na:        !!(document.getElementById('appmkt-na')?.checked),
        superStart:document.getElementById('appmkt-super-start')?.value||'',
        superEnd:  document.getElementById('appmkt-super-end')?.value||'',
        liveDt:    document.getElementById('appmkt-live-dt')?.value||'',
        liveCode:  _mliveCodes.length ? _mliveCodes[0] : (document.getElementById('appmkt-live-code')?.value||'').trim(),
        liveCodes: _mliveCodes.length ? _mliveCodes.slice() : [],
        dmpSend:      parseInt((document.getElementById('appmkt-dmp-send')?.value||'').replace(/,/g,''))||0,
        pushSend:     parseInt((document.getElementById('appmkt-push-send')?.value||'').replace(/,/g,''))||0,
        kakaoSend:    parseInt((document.getElementById('appmkt-kakao-send')?.value||'').replace(/,/g,''))||0,
        ssgAmount:    parseInt((document.getElementById('appmkt-ssg-amount')?.value||'').replace(/,/g,''))||0,
        ssgCount:     parseInt((document.getElementById('appmkt-ssg-count')?.value||'').replace(/,/g,''))||0,
        starbucksCount:parseInt((document.getElementById('appmkt-starbucks-count')?.value||'').replace(/,/g,''))||0,
        landingUrl:document.getElementById('appmkt-landing-url')?.value||'',
        dealUrl:   document.getElementById('appmkt-deal-url')?.value||'',
        etcText:   (document.getElementById('appmkt-etc-text')?.value||'').trim().slice(0,50)
      };
    })()
  };
  // 모바일라이브 캠페인 확정 시: 마케팅 요청사항을 모바일마케팅 채널에 디폴트 반영
  if(newData.campType==='모바일라이브' && newData.mliveMktReq && newData.mliveMktReq.length && newData.appMkt){
    newData.mliveMktReq.forEach(function(ch){
      if(newData.appMkt.channels.indexOf(ch)===-1) newData.appMkt.channels.push(ch);
    });
  }
  if(editId){
    var idx = DB.campaigns.findIndex(function(p){return String(p.id)===String(editId) || p.id===parseInt(editId);});
    if(idx===-1){ alert('수정할 캠페인을 찾을 수 없습니다.'); return; }
    newData.id = DB.campaigns[idx].id;
    var oldData = DB.campaigns[idx];
    // mcnList 보존: saveProd에서 mcnList를 직접 편집하지 않으므로 기존 값 유지
    // (MCN 복수 등록은 openMcnEdit/saveMcnEdit 전용)
    if(!newData.mcnList && oldData.mcnList && oldData.mcnList.length){
      newData.mcnList = oldData.mcnList;
    }
    // reasons: 체크박스 값이 비어있으면 기존 값 유지 (수정 시 덮어쓰기 방지)
    if(!newData.reasons || newData.reasons.length === 0){
      newData.reasons = oldData.reasons || [];
    }
    // stage 순서 정의 (숫자가 클수록 상위 단계)
    var stageOrder = {'1.캠페인요청':1,'2.캠페인확정':2,'3.상품정보등록':3,'4.MCN요청':4,'5.인플루언서확정':5,'6.APP마케팅확정':6,'7.정산':7,'7.정산완료':8};
    var oldStageNum = stageOrder[oldData.stage] || 0;
    var newStageNum = stageOrder[newData.stage] || 0;
    // 해당없음 체크 시 7.정산으로 이동 허용
    var appNaChecked = !!(document.getElementById('appmkt-na')?.checked);
    // 모바일라이브: 확정일자 미입력 시 1단계로 강제 다운그레이드 허용
    var mliveForceDown = (newData.campType==='모바일라이브' && newData.stage==='1.캠페인요청' && !newData.confirmStart);
    if(appNaChecked && newData.stage === '7.정산'){
      // 그대로 유지
    } else if(mliveForceDown){
      // 확정일자 없으면 무조건 편성요청 유지
    } else if(newStageNum < oldStageNum){
      // 하위 단계로 다운그레이드 방지: 기존 단계 유지
      newData.stage = oldData.stage;
    }
    DB.campaigns[idx] = newData;
    _myLastSaveTime = Date.now();
    _myLastSaveCamps = [newData]; // 저장한 캠페인 스냅샷 보관
    syncRelatedData(oldData, newData);
    if(newData._priceValidFail){
      showToast('⚠️ 상품코드·가격 정보 미입력 → 2단계(캠페인확정) 상태로 유지됩니다.');
    }
    // settleDone=true 이면 stage를 '7.정산완료'로 자동 변경
    if(newData.settleDone && (newData.stage==='7.정산'||newData.stage==='6.APP마케팅확정')){
      newData.stage = '7.정산완료';
    }
    addAct('✏️', name+' 캠페인 요청 수정', nowStr(), v('p-owner'));
    // 수정한 본인에게는 알람 없음 — 타인이 수정 시에만 담당자에게 알람

    // ── 담당자 알림: 본인 외 다른 사람이 본인 담당 캠페인 수정 시 ──
    (function(){
      var campPd = (newData.pdSingle||(newData.pds&&newData.pds[0])||'').trim();
      var campOwner = (newData.owner||'').trim();
      // 수정한 사람(ME)이 캠페인 담당자/MD가 아닐 때 → 담당자에게 알림 생성
      // (알림은 다음 로그인 시 보임 — Firebase notifications 경로에 저장)
      var isDiffEditor = (ME !== campPd && ME !== campOwner);
      if(isDiffEditor && fbReady && (campPd || campOwner)){
        // 변경 영역 감지
        var changes = [];
        if(oldData){
          if(JSON.stringify(oldData.skus) !== JSON.stringify(newData.skus)) changes.push('상품정보');
          if(JSON.stringify(oldData.priceGrid) !== JSON.stringify(newData.priceGrid)) changes.push('가격정보');
          if(oldData.infName !== newData.infName || JSON.stringify(oldData.infData) !== JSON.stringify(newData.infData)) changes.push('인플루언서');
          if(oldData.stage !== newData.stage) changes.push('단계('+newData.stage+')');
          if(oldData.revenue !== newData.revenue) changes.push('예상매출');
          if(!changes.length) changes.push('캠페인정보');
        } else {
          changes.push('캠페인정보');
        }
        var changeStr = changes.join(', ');
        var notifTxt = '📝 ['+name+'] '+changeStr+' — '+ME+' 수정';
        var notifTime = nowStr();
        // Firebase에 담당자별 알림 저장
        var targets = [];
        if(campPd && campPd !== ME) targets.push(campPd);
        if(campOwner && campOwner !== ME && !targets.includes(campOwner)) targets.push(campOwner);
        targets.forEach(function(targetName){
          var notifRef = fbDB.ref('influencer-hub/user-notifs/'+targetName.replace(/[.#$/[\]]/g,'_'));
          notifRef.push({
            ico: '✏️',
            txt: notifTxt,
            time: notifTime,
            campId: newData.id,
            campName: name,
            editor: ME,
            changes: changeStr,
            unread: true,
            createdAt: Date.now()
          });
        });
      }
    })();
    syncInfDataToDb(_infData);
    // 모바일라이브 편성코드 → appMkt에 병합
    if(newData._liveCodeInput){
      if(!newData.appMkt) newData.appMkt = {};
      newData.appMkt.liveCode = newData._liveCodeInput;
    }
    delete newData._liveCodeInput;
    // 광고수익 양방향 동기화: 캠페인 adIncome ↔ _mliveData adRevenue
    if(newData.campType==='모바일라이브' && newData.appMkt && newData.appMkt.liveCode && _mliveData && _mliveData.length){
      var _syncCode = String(newData.appMkt.liveCode).trim();
      var _syncMl = _mliveData.find(function(m){ return String(m.code).trim()===_syncCode; });
      if(_syncMl){
        if(newData.adIncome && !((_syncMl.adRevenue||0))){
          _syncMl.adRevenue = newData.adIncome;
        } else if((_syncMl.adRevenue||0) && !newData.adIncome){
          newData.adIncome = _syncMl.adRevenue;
        }
      }
    }
    console.log('[saveProd] 수정 저장 실행, id:', newData.id);
    if(_noMdcat) showToast('⚠️ MDCAT을 선택해주세요 (기본정보 관리에서 추가 가능)');
    if(_mliveNoConfirm) setTimeout(function(){ showToast('⚠️ 확정시작일/종료일이 미입력되어 편성요청 단계로 유지됩니다. 편성 확정을 위해 확정일자를 입력해주세요.'); }, 500);
    if(_rebroadcastNoCode) setTimeout(function(){ alert('⚠️ 재방 캠페인에 편성코드가 입력되지 않았습니다.\n편성코드를 입력해주세요.'); }, 600);
    showCompleteModal('수정');  // Firebase 응답과 무관하게 즉시 표시
    closeMo('product');
    renderAllPages(); // 즉시 화면 반영
    if(fbReady){
      // pushPath와 동일한 방식으로 저장
      console.log('[saveProd] pushPath 호출 시작, id:', newData.id, 'fbReady:', fbReady);
      pushPath('campaigns/' + newData.id, newData);
      pushPath('_lastWriter', ME||ME_EMAIL);
      pushPath('_lastWrite', Date.now());
      console.log('[saveProd] 수정 pushPath 저장, id:', newData.id);
    }
  } else {
    newData.id = nid.campaigns++;
    newData.campCode = generateCampCode(newData.start || newData.startDate);
    newData.createdAt = new Date().toISOString();
    DB.campaigns.push(newData);
    addAct('📋', name+' 캠페인 요청 등록', nowStr(), v('p-owner'));
    addNotif('📋', name+' 캠페인 요청 등록됨', '방금 전');
    var dsProdEl=document.getElementById('ds-prod'); if(dsProdEl) dsProdEl.textContent=DB.campaigns.length;
    // 모달 먼저 닫고
    syncInfDataToDb(_infData);
    if(newData._liveCodeInput){
      if(!newData.appMkt) newData.appMkt = {};
      newData.appMkt.liveCode = newData._liveCodeInput;
    }
    delete newData._liveCodeInput;
    // 광고수익 양방향 동기화: 캠페인 adIncome ↔ _mliveData adRevenue
    if(newData.campType==='모바일라이브' && newData.appMkt && newData.appMkt.liveCode && _mliveData && _mliveData.length){
      var _syncCode2 = String(newData.appMkt.liveCode).trim();
      var _syncMl2 = _mliveData.find(function(m){ return String(m.code).trim()===_syncCode2; });
      if(_syncMl2){
        if(newData.adIncome && !((_syncMl2.adRevenue||0))){
          _syncMl2.adRevenue = newData.adIncome;
        } else if((_syncMl2.adRevenue||0) && !newData.adIncome){
          newData.adIncome = _syncMl2.adRevenue;
        }
      }
    }
    console.log('[saveProd] 신규 저장 실행, id:', newData.id);
    closeMo('product');
    // 저장 완료 팝업 즉시 표시
    if(_noMdcat) showToast('⚠️ MDCAT을 선택해주세요 (기본정보 관리에서 추가 가능)');
    if(_mliveNoConfirm) setTimeout(function(){ showToast('⚠️ 확정시작일/종료일이 미입력되어 편성요청 단계로 유지됩니다. 편성 확정을 위해 확정일자를 입력해주세요.'); }, 500);
    if(_rebroadcastNoCode) setTimeout(function(){ alert('⚠️ 재방 캠페인에 편성코드가 입력되지 않았습니다.\n편성코드를 입력해주세요.'); }, 600);
    showCompleteModal('등록');
    renderAllPages(); // 뱃지·화면 즉시 반영
    // Firebase 백그라운드 저장
    if(fbReady){
      console.log('[saveProd] 신규 pushPath 호출, id:', newData.id, 'fbReady:', fbReady);
      pushPath('campaigns/' + newData.id, newData);
      pushPath('_lastWriter', ME||ME_EMAIL);
      pushPath('_lastWrite', Date.now());
      console.log('[saveProd] 신규 pushPath 저장, id:', newData.id);
    }
    return;
  }
}

// 캠페인 인플루언서 정보 → DB.influencers 동기화
function syncInfDataToDb(infDataArr){
  if(!infDataArr || !infDataArr.length) return;
  infDataArr.forEach(function(inf){
    if(!inf.infName) return;
    var name = inf.infName.trim();
    var existing = (DB.influencers||[]).find(function(i){ return i.name && i.name.trim()===name; });
    if(existing){
      // 기존 인플루언서 업데이트 (빈 값은 덮어쓰지 않음)
      if(inf.insta) existing.insta = inf.insta;
      if(inf.youtube) existing.youtube = inf.youtube;
      if(inf.twitter) existing.twitter = inf.twitter;
      if(inf.contact) existing.contact = inf.contact;
      if(inf.sampleAddress) existing.address = inf.sampleAddress;
      if(inf.mcn) existing.mcn = inf.mcn;
    } else {
      // 신규 인플루언서 자동 등록
      DB.influencers = DB.influencers || [];
      DB.influencers.push({
        id: nid.influencers++,
        name: name,
        insta: inf.insta||'',
        youtube: inf.youtube||'',
        twitter: inf.twitter||'',
        contact: inf.contact||'',
        address: inf.sampleAddress||'',
        cat: '',
        fee: inf.feeAmount||0,
        memo: '캠페인 등록 시 자동 추가'
      });
    }
  });
  // Firebase에 influencers 개별 저장
  if(fbReady){
    fbRef.child('influencers').set(arrToObj(DB.influencers))
      .catch(function(e){ console.warn('[syncInfDataToDb] Firebase 저장 실패:', e); });
  }
}

// 캠페인 수정 시 연관 데이터 동기화
function syncRelatedData(oldData, newData){
  // 캠페인명/기간이 바뀐 경우 연결된 campaigns 테이블도 업데이트
  // (products.id = campaigns.product 로 연결된 항목)
  DB.campaigns.forEach(c=>{
    if(c.product === newData.id){
      // 기간 동기화
      if(newData.startDate) c.start = newData.startDate;
      if(newData.endDate)   c.end   = newData.endDate;
      // 연결 상품명이 바뀐 경우를 위해 product 참조는 ID이므로 자동 반영
    }
  });
  // MCN 요청에서 캠페인 참조 유지 (ID 기반이라 자동)
  // 매칭에서도 campaign ID 기반이라 자동 반영
  // 이력에 수정 내용 기록
  var changes = [];
  ['name','company','brand','cat','owner','startDate','endDate','infSize','revenue'].forEach(key=>{
    if(String(oldData[key]||'') !== String(newData[key]||'')){
      changes.push(`${key}: "${oldData[key]||'-'}" → "${newData[key]||'-'}"`);
    }
  });
  if(changes.length){
    addAct('🔄', `${newData.name} 변경: ${changes.slice(0,2).join(', ')}${changes.length>2?' 외 '+(changes.length-2)+'건':''}`, nowStr(), newData.owner||ME);
  }
}

// PD 행 추가
function updatePromoLabel(){} // CSS :has()로 처리

// 필수값 누락 팝업
function showValidationModal(missing){
  var existing = document.getElementById('validation-modal');
  if(existing) existing.remove();

  // 미입력 필드 하이라이트
  var fieldMap = {
    '캠페인명':'p-name','시작일':'p-start','종료일':'p-end',
    '예상 매출':'p-revenue','예산':'p-budget',
    '[상품정보] 브랜드':'p-brand','[상품정보] 협력업체':'p-company',
    '[상품정보] 담당 MD':'p-owner','[상품정보] 카테고리':'p-cat',
    '[가격정보] 시장가':'p-market-price','[가격정보] 공구가격':'p-group-price'
  };
  document.querySelectorAll('.inp-error').forEach(function(el){ el.classList.remove('inp-error'); });
  missing.forEach(function(m){
    var fid = fieldMap[m];
    if(fid){ var el2=document.getElementById(fid); if(el2) el2.classList.add('inp-error'); }
  });

  var el = document.createElement('div');
  el.id = 'validation-modal';
  el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.22);z-index:99999;display:flex;align-items:center;justify-content:center';
  el.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r-lg);padding:28px 32px;min-width:300px;max-width:400px;text-align:center">'
    + '<div style="font-size:28px;margin-bottom:10px">⚠️</div>'
    + '<div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:8px">필수 항목을 입력해주세요</div>'
    + '<div style="font-size:13px;color:var(--text2);margin-bottom:18px;line-height:1.8">'
    + missing.map(function(m){ return '· <strong style="color:var(--orange)">' + m + '</strong>'; }).join('<br>')
    + '</div>'
    + '<button class="btn btn-primary" onclick="document.getElementById(\'validation-modal\').remove()" style="min-width:100px">확인</button>'
    + '</div>';
  document.body.appendChild(el);
}
// 등록/수정 완료 팝업
function showCompleteModal(type){
  var existing = document.getElementById('complete-modal');
  if(existing) existing.remove();
  var el = document.createElement('div');
  el.id = 'complete-modal';
  el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.22);z-index:99999;display:flex;align-items:center;justify-content:center';
  var msg = type==='등록' ? '저장되었습니다.' : type==='수정' ? '수정이 완료되었습니다.' : type==='확정' ? '캠페인이 확정되었습니다.' : type+' 완료되었습니다.';
  el.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r-lg);padding:28px 32px;min-width:300px;max-width:400px;text-align:center">'
    + '<div style="font-size:40px;margin-bottom:12px;text-align:center">✅</div>'
    + '<div style="font-size:17px;font-weight:800;color:var(--text);margin-bottom:20px;text-align:center;line-height:1.5">'+msg+'</div>'
    + '<div style="text-align:center"><button class="btn btn-primary" onclick="document.getElementById(&quot;complete-modal&quot;).remove()" style="min-width:120px">확인</button></div>'
    + '</div>';
  document.body.appendChild(el);
  // 외부 클릭으로 닫기 비활성화
  setTimeout(function(){ if(document.getElementById('complete-modal')) document.getElementById('complete-modal').remove(); }, 3000);
}



// ═══════════════════════════════════════
// 가격 정보 그리드
// ═══════════════════════════════════════
function addPriceRow(data){
  var tbody = document.getElementById('price-grid-body');
  if(!tbody) return;
  var d = data || {};
  var row = document.createElement('tr');
  row.className = 'price-row';
  row.innerHTML =
    '<td style="padding:3px 4px;text-align:center"><input type="checkbox" class="pg-main" title="대표 상품" style="accent-color:var(--accent);width:14px;height:14px;cursor:pointer"'+(d.isMain?' checked':'')+' onchange="setMainPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm pg-code" placeholder="상품코드" value="'+(d.code||'')+'" style="width:90px"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm pg-name" placeholder="상품명" value="'+(d.name||'')+'" style="width:110px"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-price" placeholder="0" value="'+(d.price?(d.price.toLocaleString('ko-KR')):'')+'" style="width:80px;text-align:right" oninput="formatMoney(this);calcPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-md" placeholder="0" value="'+(d.mdPrice?(d.mdPrice.toLocaleString('ko-KR')):'')+'" style="width:80px;text-align:right" oninput="formatMoney(this);calcPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-card" placeholder="0" value="'+(d.cardDiscount?(d.cardDiscount.toLocaleString('ko-KR')):'')+'" style="width:70px;text-align:right" oninput="formatMoney(this);calcPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-point" placeholder="0" value="'+(d.pointDiscount?(d.pointDiscount.toLocaleString('ko-KR')):'')+'" style="width:70px;text-align:right" oninput="formatMoney(this);calcPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-coupon" placeholder="0" value="'+(d.couponDiscount?(d.couponDiscount.toLocaleString('ko-KR')):'')+'" style="width:70px;text-align:right" oninput="formatMoney(this);calcPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm pg-etc" placeholder="텍스트 입력" value="'+(d.etcPromo||'')+'" style="width:100px" oninput="calcPriceRow(this)"></td>'
    +'<td style="padding:3px 4px;text-align:right;font-weight:700;color:var(--accent);font-size:12px" class="pg-final">'+(d.finalPrice?d.finalPrice.toLocaleString('ko-KR')+' 원':'-')+'</td>'
    +'<td style="padding:3px 2px"><button class="btn btn-danger btn-xs pg-del-btn" type="button">✕</button></td>';
  var delBtn = row.querySelector('.pg-del-btn');
  if(delBtn) delBtn.addEventListener('click', function(){ this.closest('tr').remove(); });
  tbody.appendChild(row);
}

function calcPriceRow(input){
  var row = input.closest('tr');
  if(!row) return;
  var md    = parseInt((row.querySelector('.pg-md')?.value||'').replace(/,/g,''))||0;
  var card  = parseInt((row.querySelector('.pg-card')?.value||'').replace(/,/g,''))||0;
  var point = parseInt((row.querySelector('.pg-point')?.value||'').replace(/,/g,''))||0;
  var coupon= parseInt((row.querySelector('.pg-coupon')?.value||'').replace(/,/g,''))||0;
  var etc   = (row.querySelector('.pg-etc')?.value||'').trim();
  var finalEl = row.querySelector('.pg-final');
  if(!finalEl) return;
  if(md > 0){
    var final = md - card - point - coupon;
    // 기타프로모션 텍스트 있으면 계산 제외 표시
    if(etc){
      finalEl.textContent = final.toLocaleString('ko-KR') + ' 원 (+기타)';
    } else {
      finalEl.textContent = final.toLocaleString('ko-KR') + ' 원';
    }
  } else {
    finalEl.textContent = '-';
  }
}

// 대표 상품 라디오 동작 (가격 테이블)
function setMainPriceRow(cb){
  document.querySelectorAll('#price-grid-body .pg-main').forEach(function(c){ c.checked=false; });
  cb.checked = true;
}

function getPriceGridData(){
  // 가격 데이터는 통합 sku-list 테이블에서 읽기
  var rows = [];
  document.querySelectorAll('#sku-list .sku-row').forEach(function(row){
    var md    = parseInt((row.querySelector('.pg-md')?.value||'').replace(/,/g,''))||0;
    var card  = parseInt((row.querySelector('.pg-card')?.value||'').replace(/,/g,''))||0;
    var mile  = parseInt((row.querySelector('.pg-mileage')?.value||'').replace(/,/g,''))||0;
    var cpn   = parseInt((row.querySelector('.pg-coupon')?.value||'').replace(/,/g,''))||0;
    var final = md > 0 ? Math.max(0, md - card - mile - cpn) : 0;
    var code  = (row.querySelector('.sku-code')?.value||'').trim();
    if(!code && !md) return; // 빈 행 스킵
    rows.push({
      isMain: !!(row.querySelector('.sku-main')?.checked),
      code:   code,
      name:   (row.querySelector('.sku-pname')?.value||'').trim(),
      price:  parseInt((row.querySelector('.pg-price')?.value||'').replace(/,/g,''))||0,
      mdPrice: md, cardDiscount: card, mileage: mile, coupon: cpn,
      promoText: (row.querySelector('.pg-promo')?.value||'').trim(),
      finalPrice: final
    });
  });
  return rows;
}

function renderPriceGrid(priceRows){
  var tbody = document.getElementById('price-grid-body');
  if(!tbody) return;
  tbody.innerHTML = '';
  if(priceRows && priceRows.length){
    priceRows.forEach(function(d){ addPriceRow(d); });
  } else {
    addPriceRow();
  }
}


// ═══════════════════════════════════════
// 인플루언서 멀티 블록
// ═══════════════════════════════════════
var infBlockCount = 0;

// 인플루언서 DB datalist 갱신
function updateInfDbList(){
  var dl = document.getElementById('inf-db-list');
  if(!dl){ dl=document.createElement('datalist'); dl.id='inf-db-list'; document.body.appendChild(dl); }
  var names = {};
  (DB.influencers||[]).forEach(function(inf){ if(inf.name) names[inf.name.trim()]=1; });
  DB.campaigns.forEach(function(c){ if(c.infName) names[c.infName.trim()]=1; });
  dl.innerHTML = Object.keys(names).sort().map(function(n){ return '<option value="'+escHtml(n)+'">'; }).join('');
}

// 인플루언서명 입력 시 DB에서 자동 채움
function onInfNameInput(el, blockN){
  var name = el.value.trim();
  if(!name) return;
  // DB.influencers에서 찾기
  var dbInf = (DB.influencers||[]).find(function(i){ return i.name && i.name.trim()===name; });
  if(dbInf){
    var block = document.getElementById('inf-block-'+blockN);
    if(!block) return;
    var igEl = block.querySelector('.inf-ig-'+blockN);
    var ytEl = block.querySelector('.inf-yt-'+blockN);
    var twEl = block.querySelector('.inf-tw-'+blockN);
    if(igEl && !igEl.value && (dbInf.insta||'')) igEl.value = dbInf.insta;
    if(ytEl && !ytEl.value && (dbInf.youtube||'')) ytEl.value = dbInf.youtube;
    if(twEl && !twEl.value && (dbInf.twitter||'')) twEl.value = dbInf.twitter;
    // 연락처·주소 자동 채움
    var contactEl = block.querySelector('.inf-contact-'+blockN);
    var addrEl = block.querySelector('.inf-saddr-'+blockN);
    if(contactEl && !contactEl.value && (dbInf.contact||'')) contactEl.value = dbInf.contact;
    if(addrEl && !addrEl.value && (dbInf.address||'')) addrEl.value = dbInf.address;
    // 구버전 호환: handle+platform
    if(dbInf.handle && !dbInf.insta && !dbInf.youtube && !dbInf.twitter){
      var p = (dbInf.platform||'').toLowerCase();
      if(p.includes('유튜브') && ytEl && !ytEl.value) ytEl.value = dbInf.handle;
      else if(p.includes('트위터') && twEl && !twEl.value) twEl.value = dbInf.handle;
      else if(igEl && !igEl.value) igEl.value = dbInf.handle;
    }
  }
}

function addInfBlock(data){
  infBlockCount++;
  var n = infBlockCount;
  var d = data || {};
  var container = document.getElementById('inf-blocks-container');
  if(!container) return;

  var block = document.createElement('div');
  block.id = 'inf-block-' + n;
  block.className = 'inf-block';
  block.style.cssText = 'border:1px solid var(--border2);border-radius:var(--r);padding:14px;margin-bottom:12px;background:var(--bg2);position:relative';

  var sizeOpts = ['','메가','미들','시딩'].map(function(v){
    return '<option value="'+v+'"'+(d.infSize===v?' selected':'')+'>'+( v||'선택')+'</option>';
  }).join('');

  block.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    +'<div style="font-size:12.5px;font-weight:700;color:var(--accent)">👤 인플루언서 정보 '+n+'</div>'
    +(n>1?'<button class="btn btn-ghost btn-xs" onclick="removeInfBlock('+n+')" type="button">✕ 삭제</button>':'')
    +'</div>'
    // 기본 정보
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">인플루언서 규모</label>'
    +'<select class="sel inf-size-'+n+'" style="width:100%">'+sizeOpts+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">인플루언서명</label>'
    +'<input class="inp inf-name-'+n+'" placeholder="이름 또는 채널명 (DB 검색)" value="'+(d.infName||'')+'" list="inf-db-list" oninput="onInfNameInput(this,'+n+')" autocomplete="off"></div>'
    +'</div>'
    // 채널
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px">'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">유튜브 채널</label>'
    +'<div style="position:relative">'
    +'<input class="inp inf-yt-'+n+'" placeholder="채널명 또는 @계정" value="'+(d.youtube||'')+'" oninput="updateChannelLink(this,\'youtube\','+n+')">'
    +'<a class="inf-yt-link-'+n+'" href="'+(d.youtube?'https://youtube.com/@'+d.youtube.replace('@',''):'#')+'" target="_blank" style="display:'+(d.youtube?'inline':'none')+';position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:18px;text-decoration:none" title="유튜브 열기">🔗</a>'
    +'</div></div>'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">인스타그램 채널</label>'
    +'<div style="position:relative">'
    +'<input class="inp inf-ig-'+n+'" placeholder="@계정명" value="'+(d.insta||'')+'" oninput="updateChannelLink(this,\'insta\','+n+')">'
    +'<a class="inf-ig-link-'+n+'" href="'+(d.insta?'https://instagram.com/'+d.insta.replace('@',''):'#')+'" target="_blank" style="display:'+(d.insta?'inline':'none')+';position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:18px;text-decoration:none" title="인스타 열기">🔗</a>'
    +'</div></div>'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">𝕏 (트위터) 채널</label>'
    +'<div style="position:relative">'
    +'<input class="inp inf-tw-'+n+'" placeholder="@계정명" value="'+(d.twitter||'')+'" oninput="updateChannelLink(this,\'twitter\','+n+')">'
    +'<a class="inf-tw-link-'+n+'" href="'+(d.twitter?'https://x.com/'+d.twitter.replace('@',''):'#')+'" target="_blank" style="display:'+(d.twitter?'inline':'none')+';position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:18px;text-decoration:none">🔗</a>'
    +'</div></div>'
    +'</div>'
    // 수수료 - 신세계 제안 / 확정
    +'<div style="background:var(--bg3);border-radius:var(--r-sm);padding:10px 12px;margin-bottom:10px">'
    +'<div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:8px">💡 신세계 제안</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">MCN 업체</label>'
    +'<select class="sel inf-mcn-'+n+'">'+buildMcnOptions(d.mcn||'')+'</select></div>'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">제안수수료율 (%)</label>'
    +'<input class="inp inf-propose-frate-'+n+'" type="number" placeholder="15" step="0.1" value="'+(d.proposeFeeRate||'')+'"></div>'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">제안원고료 (원)</label>'
    +'<input class="inp inp-money inf-propose-famt-'+n+'" placeholder="500,000" value="'+(d.proposeFeeAmount?d.proposeFeeAmount.toLocaleString('ko-KR'):'')+'"></div>'
    +'</div></div>'
    +'<div style="background:var(--accent-bg);border:1px solid var(--accent);border-radius:var(--r-sm);padding:10px 12px;margin-bottom:10px">'
    +'<div style="font-size:11px;font-weight:700;color:var(--accent2);margin-bottom:8px">✅ 확정 (정산 반영)</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px">'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">확정수수료율 (%)</label>'
    +'<input class="inp inf-frate-'+n+'" type="number" placeholder="15" step="0.1" value="'+(d.feeRate||'')+'" oninput="syncInfFrateToSettle(this,'+n+')"></div>'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">확정원고료 (원)</label>'
    +'<input class="inp inp-money inf-famt-'+n+'" placeholder="500,000" value="'+(d.feeAmount?d.feeAmount.toLocaleString('ko-KR'):'')+'"></div>'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">에이전시수수료 cafe24 (%)</label>'
    +'<input class="inp inf-arate-'+n+'" type="number" placeholder="5" step="0.1" value="'+(d.agencyRate||'')+'"></div>'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">광고수익 (원)</label>'
    +'<input class="inp inp-money inf-da-'+n+'" placeholder="0" value="'+(d.daFee?d.daFee.toLocaleString('ko-KR'):'')+'"></div>'
    +'</div></div>'
    // 샘플발송
    +'<div style="background:var(--bg3);border:1px solid var(--border2);border-radius:var(--r-sm);padding:10px 14px">'
    +'<div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;flex-wrap:wrap">'
    +'<label style="display:flex;align-items:center;gap:6px;cursor:pointer">'
    +'<input type="checkbox" class="inf-ssent-'+n+'" style="width:15px;height:15px;accent-color:var(--accent);cursor:pointer"'+(d.sampleSent?' checked':'')+'>'
    +'<span style="font-size:12.5px;font-weight:600">📦 샘플 발송 완료</span></label>'
    +'<label style="display:flex;align-items:center;gap:6px;cursor:pointer">'
    +'<input type="checkbox" class="inf-sexempt-'+n+'" style="width:15px;height:15px;accent-color:var(--orange);cursor:pointer"'+(d.sampleExempt?' checked':'')+'>'
    +'<span style="font-size:12.5px;font-weight:600;color:var(--orange)">🚫 샘플발송 미대상</span></label>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">연락처</label>'
    +'<input class="inp inf-contact-'+n+'" placeholder="전화번호 또는 이메일" value="'+(d.contact||'')+'"></div>'
    +'<div><label style="font-size:11.5px;font-weight:600;margin-bottom:4px;display:block">수신 주소</label>'
    +'<input class="inp inf-saddr-'+n+'" placeholder="샘플 수신 주소" value="'+(d.sampleAddress||'')+'"></div>'
    +'</div>'
    +'</div>';

  container.appendChild(block);
  // 정산 블록도 동기화
  syncSettleBlocks();
  // money 포맷 초기화
  block.querySelectorAll('.inp-money').forEach(function(el){
    el.addEventListener('input', function(){ formatMoney(this); });
  });
}

function removeInfBlock(n){
  var block = document.getElementById('inf-block-'+n);
  if(block) block.remove();
  syncSettleBlocks();
}

function getInfBlocksData(){
  var result = [];
  document.querySelectorAll('.inf-block').forEach(function(block){
    var n = block.id.replace('inf-block-','');
    result.push({
      infSize:  block.querySelector('.inf-size-'+n)?.value||'',
      infName:  block.querySelector('.inf-name-'+n)?.value.trim()||'',
      youtube:  block.querySelector('.inf-yt-'+n)?.value.trim()||'',
      insta:    block.querySelector('.inf-ig-'+n)?.value.trim()||'',
      twitter:  block.querySelector('.inf-tw-'+n)?.value.trim()||'',
      mcn:      block.querySelector('.inf-mcn-'+n)?.value.trim()||'',
      feeRate:  parseFloat(block.querySelector('.inf-frate-'+n)?.value)||0,
      feeAmount:parseInt((block.querySelector('.inf-famt-'+n)?.value||'').replace(/,/g,''))||0,
      proposeFeeRate:  parseFloat(block.querySelector('.inf-propose-frate-'+n)?.value)||0,
      proposeFeeAmount:parseInt((block.querySelector('.inf-propose-famt-'+n)?.value||'').replace(/,/g,''))||0,
      agencyRate:parseFloat(block.querySelector('.inf-arate-'+n)?.value)||0,
      daFee:parseInt((block.querySelector('.inf-da-'+n)?.value||'').replace(/,/g,''))||0,
      contact:  block.querySelector('.inf-contact-'+n)?.value.trim()||'',
      sampleSent:!!(block.querySelector('.inf-ssent-'+n)?.checked),
      sampleExempt:!!(block.querySelector('.inf-sexempt-'+n)?.checked),
      sampleAddress:block.querySelector('.inf-saddr-'+n)?.value.trim()||'',
    });
  });
  return result;
}

function renderInfBlocks(infList){
  infBlockCount = 0;
  var container = document.getElementById('inf-blocks-container');
  if(!container) return;
  container.innerHTML = '';
  if(infList && infList.length > 0){
    infList.forEach(function(d){ addInfBlock(d); });
  } else {
    addInfBlock();
  }
}

// ═══════════════════════════════════════
// 정산 멀티 블록 (인플루언서 블록과 연동)
// ═══════════════════════════════════════
function syncSettleBlocks(){
  var container = document.getElementById('settle-blocks-container');
  if(!container) return;

  var infBlocks = document.querySelectorAll('.inf-block');
  var existingSettles = container.querySelectorAll('.settle-block');
  var currentCount = existingSettles.length;
  var needed = infBlocks.length;

  // 부족하면 추가
  for(var i = currentCount+1; i <= needed; i++){
    addSettleBlock(i);
  }
  // 초과하면 제거
  var all = container.querySelectorAll('.settle-block');
  for(var j = needed; j < all.length; j++){
    all[j].remove();
  }
  // 레이블 업데이트
  container.querySelectorAll('.settle-block').forEach(function(b,idx){
    var lbl = b.querySelector('.settle-inf-label');
    var infBlock = infBlocks[idx];
    var infN = infBlock ? infBlock.id.replace('inf-block-','') : (idx+1);
    var infName = infBlock ? (infBlock.querySelector('.inf-name-'+infN)?.value.trim()||'인플루언서 '+(idx+1)) : '인플루언서 '+(idx+1);
    if(lbl) lbl.textContent = '💰 정산 정보 - '+infName;
  });
}

function addSettleBlock(n, data, campaignSkus){
  var container = document.getElementById('settle-blocks-container');
  if(!container) return;
  var d = data || {};
  var fmtV = function(v){ return v ? parseInt(v).toLocaleString('ko-KR') : ''; };

  // ── SKU 행 목록: 저장된 skuItems + 캠페인 상품정보 병합
  var savedItems = d.skuItems || [];
  if(!savedItems.length && (d.skuCode || d.netOrders || d.netAmt)){
    savedItems = [{skuCode:d.skuCode||'', netOrders:d.netOrders||0, convRate:d.convRate||0,
                   dealPrice:d.dealPrice||0, netAmt:d.netAmt||d.revenue||0, adCommRate:d.adCommRate||0}];
  }
  var campSkus = campaignSkus || [];
  var rowCount = Math.max(campSkus.length, savedItems.length, 1);
  // 인플루언서 블록 N의 확정 수수료율을 기본값으로 읽기
  var infFrateEl = document.querySelector('.inf-frate-'+n);
  var infFeeRate = infFrateEl ? (parseFloat(infFrateEl.value)||0) : 0;
  var skuRows = [];
  for(var i=0; i<rowCount; i++){
    var cs = campSkus[i]||{}, ss = savedItems[i]||{};
    skuRows.push({
      skuCode:    ss.skuCode    || cs.code || '',
      inflow:     ss.inflow     || 0,
      buyers:     ss.buyers     || 0,
      newMembers: ss.newMembers || 0,
      netOrders:  ss.netOrders  || 0,
      convRate:   ss.convRate   || 0,
      dealPrice:  ss.dealPrice  || 0,
      netAmt:     ss.netAmt     || 0,
      adCommRate: ss.adCommRate || infFeeRate || 0  // 저장값 없으면 인플루언서 확정수수료율 자동 적용
    });
  }

  var skuTbody = skuRows.map(function(s){
    var cr = (s.inflow>0) ? (s.netOrders/s.inflow*100).toFixed(2) : (s.convRate||'');
    return '<tr class="settle-sku-item" style="border-bottom:1px solid var(--border2)">'
      +'<td style="padding:3px 4px"><input class="inp inp-sm settle-sc" value="'+(s.skuCode||'')+'" placeholder="상품코드" style="width:100%;min-width:75px;font-size:11px"></td>'
      +'<td style="padding:3px 4px"><input class="inp inp-sm settle-inf" type="number" value="'+(s.inflow||'')+'" placeholder="0" style="width:62px;text-align:right;font-size:11px" oninput="calcSettleSkuNet(this.closest(\'.settle-sku-item\'))"></td>'
      +'<td style="padding:3px 4px"><input class="inp inp-sm settle-buy" type="number" value="'+(s.buyers||'')+'" placeholder="0" style="width:60px;text-align:right;font-size:11px"></td>'
      +'<td style="padding:3px 4px"><input class="inp inp-sm settle-cr" value="'+cr+'" placeholder="자동" style="width:50px;text-align:right;font-size:11px;background:var(--bg4);color:var(--accent2);font-weight:600" readonly></td>'
      +'<td style="padding:3px 4px"><input class="inp inp-sm settle-new" type="number" value="'+(s.newMembers||'')+'" placeholder="0" style="width:60px;text-align:right;font-size:11px"></td>'
      +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money settle-dp" value="'+fmtV(s.dealPrice)+'" placeholder="0" style="width:80px;text-align:right;font-size:11px" oninput="formatMoney(this);calcSettleSkuNet(this.closest(\'.settle-sku-item\'))"></td>'
      +'<td style="padding:3px 4px"><input class="inp inp-sm settle-no" type="number" value="'+(s.netOrders||'')+'" placeholder="0" style="width:58px;text-align:right;font-size:11px" oninput="calcSettleSkuNet(this.closest(\'.settle-sku-item\'))"></td>'
      +'<td style="padding:3px 4px"><input class="inp inp-sm settle-na" value="'+fmtV(s.netAmt||s.netOrders*s.dealPrice||0)+'" placeholder="자동" style="width:90px;text-align:right;font-size:11px;color:var(--accent2);font-weight:600;background:var(--bg4)" readonly></td>'
      +'<td style="padding:3px 4px"><input class="inp inp-sm settle-acr" type="number" step="0.1" value="'+(s.adCommRate||'')+'" placeholder="0.0" style="width:46px;text-align:right;font-size:11px" oninput="onSettleAcrInput(this)"></td>'
      +'</tr>';
  }).join('');

  var block = document.createElement('div');
  block.className = 'settle-block';
  block.style.cssText = 'border:1px solid var(--border2);border-radius:var(--r);padding:14px;margin-bottom:12px;background:var(--bg2)';
  block.setAttribute('data-settle-n', n);

  var thS = 'padding:4px 5px;white-space:nowrap;font-size:10.5px;font-weight:600;background:var(--bg3);border-bottom:1px solid var(--border2);text-align:left;';
  block.innerHTML =
    '<div style="font-size:12.5px;font-weight:700;color:var(--accent2);margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border2)">💰 정산 정보 - 인플루언서 '+n+'</div>'
    // ── 상품별 compact 테이블
    +'<div style="overflow-x:auto;margin-bottom:10px">'
    +'<table style="width:100%;border-collapse:collapse;font-size:11px">'
    +'<thead><tr>'
    +'<th style="'+thS+'color:var(--text3)">상품코드</th>'
    +'<th style="'+thS+'color:var(--text3);text-align:right">당사유입수</th>'
    +'<th style="'+thS+'color:var(--text3);text-align:right">구매자수</th>'
    +'<th style="'+thS+'color:var(--accent2);text-align:right">전환율%<br><span style="font-size:9px;font-weight:400">(자동)</span></th>'
    +'<th style="'+thS+'color:var(--text3);text-align:right">신규회원수</th>'
    +'<th style="'+thS+'color:var(--text3);text-align:right">공구가(원)</th>'
    +'<th style="'+thS+'color:var(--text3);text-align:right">순주문수</th>'
    +'<th style="'+thS+'color:var(--accent2);text-align:right">순주문금액(정산)<br><span style="font-size:9px;font-weight:400">(자동)</span></th>'
    +'<th style="'+thS+'color:var(--text3);text-align:right">수수료(%)</th>'
    +'</tr></thead>'
    +'<tbody>'+skuTbody+'</tbody>'
    +'</table>'
    +'<button type="button" onclick="addSettleSkuRow(this.closest(\'.settle-block\'))" style="margin-top:4px;font-size:10.5px;color:var(--text3);background:none;border:none;cursor:pointer;padding:2px 4px">+ 행 추가</button>'
    +'</div>'
    // ── 광고비 / 세금계산서
    +'<div style="background:var(--bg3);border:1px solid var(--border2);border-radius:var(--r-sm);padding:10px;margin-bottom:10px">'
    +'<div style="font-weight:700;color:var(--text2);margin-bottom:7px;font-size:11.5px">🧾 광고비 / 세금계산서</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:7px">'
    +'<div><label style="font-size:10.5px;color:var(--accent2);display:block;margin-bottom:2px">수수료 광고비 (부가세포함) <span style="font-size:9px;font-weight:400">(자동)</span></label>'
    +'<input class="inp inp-sm settle-commfee-'+n+'" placeholder="자동" value="'+fmtV(d.commFeeVat)+'" style="background:var(--bg4);color:var(--accent2);font-weight:600" readonly></div>'
    +'<div><label style="font-size:10.5px;color:var(--accent2);display:block;margin-bottom:2px">수수료 광고비2 (부가세별도) <span style="font-size:9px;font-weight:400">(자동)</span></label>'
    +'<input class="inp inp-sm settle-commfee2-'+n+'" placeholder="자동" value="'+fmtV(d.commFee2)+'" style="background:var(--bg4);color:var(--accent2);font-weight:600" readonly></div>'
    +'<div><label style="font-size:10.5px;color:var(--text3);display:block;margin-bottom:2px">정액 광고비 (부가세별도)</label>'
    +'<input class="inp inp-sm inp-money settle-fixedfee-'+n+'" placeholder="0" value="'+fmtV(d.fixedFee)+'" oninput="formatMoney(this);calcSettleBlockFees(this.closest(\'.settle-block\'))"></div>'
    +'<div><label style="font-size:10.5px;color:var(--text3);display:block;margin-bottom:2px">별도 광고비 (메타광고)</label>'
    +'<input class="inp inp-sm inp-money settle-metafee-'+n+'" placeholder="0" value="'+fmtV(d.metaFee)+'" oninput="formatMoney(this);calcSettleBlockFees(this.closest(\'.settle-block\'))"></div>'
    +'</div>'
    +'<div><label style="font-size:10.5px;color:var(--accent2);display:block;margin-bottom:2px">세금계산서 공급가액 (부가세별도) <span style="font-size:9px;font-weight:400">(자동)</span></label>'
    +'<input class="inp inp-sm settle-taxsupply-'+n+'" placeholder="자동" value="'+fmtV(d.taxSupply)+'" style="background:var(--bg4);color:var(--accent2);font-weight:600" readonly></div>'
    +'</div>'
    // ── 콘텐츠 반응도 + 정산일자
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:10px">'
    +'<div><label style="font-size:10.5px;color:var(--text3);display:block;margin-bottom:2px">📣 릴스 조회수 (만)</label>'
    +'<input class="inp inp-sm settle-views-'+n+'" type="number" placeholder="0" value="'+(d.views||'')+'"></div>'
    +'<div><label style="font-size:10.5px;color:var(--text3);display:block;margin-bottom:2px">📣 릴스 댓글수</label>'
    +'<input class="inp inp-sm settle-comments-'+n+'" type="number" placeholder="0" value="'+(d.comments||'')+'"></div>'
    +'<div><label style="font-size:10.5px;color:var(--text3);display:block;margin-bottom:2px">정산일자</label>'
    +'<input class="inp inp-sm settle-settledate-'+n+'" type="date" value="'+(d.settleDate||'')+'"></div>'
    +'</div>'
    // ── 이슈 및 결과
    +'<div><label style="font-size:11.5px;font-weight:600;display:block;margin-bottom:4px">이슈 및 결과</label>'
    +'<textarea class="inp settle-issueresult-'+n+'" rows="3" placeholder="이슈 내용 및 결과 메모" style="resize:vertical;font-size:11.5px">'+(d.issueResult||'')+'</textarea>'
    +'</div>';

  block.querySelectorAll('.inp-money').forEach(function(el){
    el.addEventListener('input', function(){ formatMoney(this); });
  });
  container.appendChild(block);
  // 초기 자동계산
  block.querySelectorAll('.settle-sku-item').forEach(function(row){ calcSettleSkuNet(row); });
  calcSettleBlockFees(block);
}

function addSettleSkuRow(block){
  var tbody = block && block.querySelector('tbody');
  if(!tbody) return;
  var row = document.createElement('tr');
  row.className = 'settle-sku-item';
  row.style.borderBottom = '1px solid var(--border2)';
  row.innerHTML =
    '<td style="padding:3px 4px"><input class="inp inp-sm settle-sc" placeholder="상품코드" style="width:100%;min-width:75px;font-size:11px"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm settle-inf" type="number" placeholder="0" style="width:62px;text-align:right;font-size:11px" oninput="calcSettleSkuNet(this.closest(\'.settle-sku-item\'))"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm settle-buy" type="number" placeholder="0" style="width:60px;text-align:right;font-size:11px"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm settle-cr" placeholder="자동" style="width:50px;text-align:right;font-size:11px;background:var(--bg4);color:var(--accent2);font-weight:600" readonly></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm settle-new" type="number" placeholder="0" style="width:60px;text-align:right;font-size:11px"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money settle-dp" placeholder="0" style="width:80px;text-align:right;font-size:11px" oninput="formatMoney(this);calcSettleSkuNet(this.closest(\'.settle-sku-item\'))"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm settle-no" type="number" placeholder="0" style="width:58px;text-align:right;font-size:11px" oninput="calcSettleSkuNet(this.closest(\'.settle-sku-item\'))"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm settle-na" placeholder="자동" style="width:90px;text-align:right;font-size:11px;color:var(--accent2);font-weight:600;background:var(--bg4)" readonly></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm settle-acr" type="number" step="0.1" placeholder="0.0" style="width:46px;text-align:right;font-size:11px" oninput="onSettleAcrInput(this)"></td>';
  row.querySelectorAll('.inp-money').forEach(function(el){
    el.addEventListener('input', function(){ formatMoney(this); });
  });
  // 새 행의 수수료율: 같은 블록의 첫 번째 settle-acr 값을 기본값으로 채움
  var block = tbody.closest('.settle-block');
  if(block){
    var firstAcr = block.querySelector('.settle-acr');
    if(firstAcr && firstAcr !== row.querySelector('.settle-acr')){
      var defRate = parseFloat(firstAcr.value)||0;
      var newAcr = row.querySelector('.settle-acr');
      if(newAcr && defRate) newAcr.value = defRate;
    }
  }
  tbody.appendChild(row);
}

// 인플루언서 N의 확정수수료율 변경 → 정산 블록 N의 모든 settle-acr 동기화
function syncInfFrateToSettle(el, n){
  var rate = parseFloat(el.value)||0;
  var block = document.querySelector('.settle-block[data-settle-n="'+n+'"]');
  if(!block) return;
  block.querySelectorAll('.settle-acr').forEach(function(acrEl){
    acrEl.value = rate ? rate : '';
  });
  calcSettleBlockFees(block);
}

// settle-acr 입력 → 수수료 재계산 + 인플루언서 확정수수료율이 없으면 역방향 반영
function onSettleAcrInput(el){
  var block = el ? el.closest('.settle-block') : null;
  calcSettleBlockFees(block);
  var n = block ? block.getAttribute('data-settle-n') : null;
  if(n){
    var infFrateEl = document.querySelector('.inf-frate-'+n);
    var acrVal = parseFloat(el.value)||0;
    // 인플루언서 확정 수수료율이 비어 있을 때만 역방향 반영
    if(infFrateEl && acrVal && !parseFloat(infFrateEl.value)){
      infFrateEl.value = acrVal;
    }
  }
}

function calcSettleSkuNet(row){
  if(!row) return;
  var netOrd    = parseInt(row.querySelector('.settle-no')?.value)||0;
  var dealPrice = parseInt((row.querySelector('.settle-dp')?.value||'').replace(/,/g,''))||0;
  var netAmt    = netOrd * dealPrice;
  var naEl = row.querySelector('.settle-na');
  if(naEl) naEl.value = netAmt > 0 ? netAmt.toLocaleString('ko-KR') : '';
  calcSettleConvRate(row);
  var block = row.closest('.settle-block');
  if(block) calcSettleBlockFees(block);
}

function calcSettleBlockFees(block){
  if(!block) return;
  var n = block.getAttribute('data-settle-n');
  var pM = function(el){ return parseInt((el?.value||'').replace(/,/g,''))||0; };
  // 수수료광고비(부가세포함) = Σ(순주문금액 × 수수료%)
  var totalCommFee = 0;
  block.querySelectorAll('.settle-sku-item').forEach(function(row){
    var na  = pM(row.querySelector('.settle-na'));
    var acr = parseFloat(row.querySelector('.settle-acr')?.value)||0;
    totalCommFee += Math.round(na * acr / 100);
  });
  var cfEl = block.querySelector('.settle-commfee-'+n);
  if(cfEl) cfEl.value = totalCommFee > 0 ? totalCommFee.toLocaleString('ko-KR') : '';
  // 수수료광고비2(부가세별도) = 수수료광고비 / 1.1
  var cf2 = Math.round(totalCommFee / 1.1);
  var cf2El = block.querySelector('.settle-commfee2-'+n);
  if(cf2El) cf2El.value = cf2 > 0 ? cf2.toLocaleString('ko-KR') : '';
  // 세금계산서 공급가액 = 수수료광고비2 + 정액광고비 + 별도광고비
  var fixed = pM(block.querySelector('.settle-fixedfee-'+n));
  var meta  = pM(block.querySelector('.settle-metafee-'+n));
  var tax   = cf2 + fixed + meta;
  var tsEl  = block.querySelector('.settle-taxsupply-'+n);
  if(tsEl) tsEl.value = tax > 0 ? tax.toLocaleString('ko-KR') : '';
}

function calcSettleConvRate(row){
  if(!row) return;
  var inflow  = parseInt(row.querySelector('.settle-inf')?.value)||0;
  var netOrd  = parseInt(row.querySelector('.settle-no')?.value)||0;
  var crEl    = row.querySelector('.settle-cr');
  if(crEl) crEl.value = inflow>0 ? (netOrd/inflow*100).toFixed(2) : '';
}

function calcSettleNet(n){
  var block = document.querySelectorAll('.settle-block')[n-1];
  if(!block) return;
  var pI = function(sel){ return parseInt((block.querySelector(sel)?.value||'').replace(/,/g,''))||0; };
  var deal = pI('.settle-dealamt-'+n), cancel = pI('.settle-cancelamt-'+n), ret = pI('.settle-returnamt-'+n);
  var netAmt = deal - cancel - ret;
  var netEl = block.querySelector('.settle-netamt-'+n);
  if(netEl) netEl.value = netAmt > 0 ? netAmt.toLocaleString('ko-KR') : (netAmt < 0 ? netAmt.toLocaleString('ko-KR') : '');
  var ord = pI('.settle-ord-'+n), cancelOrd = pI('.settle-cancelord-'+n), retOrd = pI('.settle-returnord-'+n);
  var netOrdEl = block.querySelector('.settle-netord-'+n);
  if(netOrdEl) netOrdEl.value = (ord - cancelOrd - retOrd) || '';
}

function updateSettleCostDisplay(block, n){
  var infBlocks = document.querySelectorAll('.inf-block');
  var idx = Array.from(document.querySelectorAll('.settle-block')).indexOf(block);
  var infBlock = infBlocks[idx];

  // 비용 기준: 순주문금액
  var rev = parseInt((block.querySelector('.settle-netamt-'+n)?.value||'').replace(/,/g,''))||0;
  if(!rev) rev = parseInt((block.querySelector('.settle-dealamt-'+n)?.value||'').replace(/,/g,''))||0;
  var fr=0, fa=0, ar=0;
  if(infBlock){
    var infN = infBlock.id.replace('inf-block-','');
    fr = parseFloat(infBlock.querySelector('.inf-frate-'+infN)?.value)||0;
    fa = parseInt((infBlock.querySelector('.inf-famt-'+infN)?.value||'').replace(/,/g,''))||0;
    ar = parseFloat(infBlock.querySelector('.inf-arate-'+infN)?.value)||0;
  }
  var da = parseInt((document.getElementById('p-settle-da')?.value||'').replace(/,/g,''))||0;

  var infFee  = Math.round(rev * fr / 100);
  var agFee   = Math.round(rev * ar / 100);
  var total   = infFee + fa + agFee + da;
  var fmt = function(v){ return v>0?v.toLocaleString('ko-KR')+'원':'-'; };

  // 디스플레이 업데이트
  var sd = block.querySelector('.settle-frate-disp-'+n); if(sd) sd.textContent = fr?fr+'%':'';
  var fd = block.querySelector('.settle-famt-disp-'+n);  if(fd) fd.textContent = fa?fa.toLocaleString('ko-KR')+'원':'';
  var ad = block.querySelector('.settle-arate-disp-'+n); if(ad) ad.textContent = ar?ar+'%':'';

  var cfr = block.querySelector('.settle-calc-fr-'+n); if(cfr) cfr.textContent = fmt(infFee);
  var cfa = block.querySelector('.settle-calc-fa-'+n); if(cfa) cfa.textContent = fmt(fa);
  var car = block.querySelector('.settle-calc-ar-'+n); if(car) car.textContent = fmt(agFee);
  var cda = block.querySelector('.settle-calc-da-'+n); if(cda) cda.textContent = fmt(da);
  var ctt = block.querySelector('.settle-cost-'+n);    if(ctt) ctt.textContent = fmt(total);
}

function getSettleBlocksData(){
  var result = [];
  document.querySelectorAll('.settle-block').forEach(function(block, idx){
    var n = idx+1;
    var pI = function(sel){ return parseInt((block.querySelector(sel)?.value||'').replace(/,/g,''))||0; };
    var pIM = function(el){ return parseInt((el?.value||'').replace(/,/g,''))||0; };
    // 상품별 행 읽기
    var skuItems = [];
    block.querySelectorAll('.settle-sku-item').forEach(function(row){
      skuItems.push({
        skuCode:    row.querySelector('.settle-sc')?.value||'',
        inflow:     parseInt(row.querySelector('.settle-inf')?.value)||0,
        netOrders:  parseInt(row.querySelector('.settle-no')?.value)||0,
        convRate:   parseFloat(row.querySelector('.settle-cr')?.value)||0,
        buyers:     parseInt(row.querySelector('.settle-buy')?.value)||0,
        newMembers: parseInt(row.querySelector('.settle-new')?.value)||0,
        dealPrice:  pIM(row.querySelector('.settle-dp')),
        netAmt:     pIM(row.querySelector('.settle-na')),
        adCommRate: parseFloat(row.querySelector('.settle-acr')?.value)||0
      });
    });
    result.push({
      skuItems:    skuItems,
      commFeeVat:  pI('.settle-commfee-'+n),
      commFee2:    pI('.settle-commfee2-'+n),
      fixedFee:    pI('.settle-fixedfee-'+n),
      metaFee:     pI('.settle-metafee-'+n),
      taxSupply:   pI('.settle-taxsupply-'+n),
      views:       parseFloat(block.querySelector('.settle-views-'+n)?.value)||0,
      comments:    parseInt(block.querySelector('.settle-comments-'+n)?.value)||0,
      settleDate:  block.querySelector('.settle-settledate-'+n)?.value||'',
      issueResult: block.querySelector('.settle-issueresult-'+n)?.value||'',
    });
  });
  return result;
}

function renderSettleBlocks(settleList, campaignSkus){
  var container = document.getElementById('settle-blocks-container');
  if(!container) return;
  container.innerHTML = '';
  if(settleList && settleList.length > 0){
    settleList.forEach(function(d,i){ addSettleBlock(i+1, d, campaignSkus||[]); });
  }
}


function toggleRoleExpand(id){
  var arrow = document.getElementById(id+'-arrow');
  var detailRows = document.querySelectorAll('.'+id+'-detail');
  var noRow = document.getElementById(id+'-r0');
  var firstDetail = detailRows[0] || noRow;
  
  var isOpen = firstDetail && firstDetail.style.display !== 'none';
  var newDisplay = isOpen ? 'none' : 'table-row';
  
  if(noRow) noRow.style.display = newDisplay;
  detailRows.forEach(function(r){ r.style.display = newDisplay; });
  if(arrow) arrow.textContent = isOpen ? '▶' : '▼';
}
function toggleSection(id){
  var body = document.getElementById(id);
  var arr  = document.getElementById('arr-'+id);
  if(!body) return;
  var isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  if(arr) arr.style.transform = isOpen ? '' : 'rotate(180deg)';
}

// 모달 열 때 기본 섹션 상태 초기화
function initSections(openAll){
  var secs=['sec-product','sec-inf','sec-appmkt','sec-settle'];
  secs.forEach(function(id){
    var body=document.getElementById(id);
    var arr=document.getElementById('arr-'+id);
    if(body){ body.classList.toggle('open', !!openAll); }
    if(arr){ arr.style.transform = openAll ? 'rotate(180deg)' : ''; }
  });
}

function updateCamptypeLabels(){
  var online = document.getElementById('p-camptype-online');
  var broadcast = document.getElementById('p-camptype-broadcast');
  var lblOnline = document.getElementById('p-camptype-label-online');
  var lblBroadcast = document.getElementById('p-camptype-label-broadcast');
  if(lblOnline) lblOnline.style.borderColor = (online&&online.checked) ? 'var(--blue)' : 'var(--border)';
  if(lblBroadcast) lblBroadcast.style.borderColor = (broadcast&&broadcast.checked) ? 'var(--orange)' : 'var(--border)';
}
function updateProdRoleLabels(){
  var map={'p-role-mega':'p-role-label-mega','p-role-encore':'p-role-label-encore','p-role-new':'p-role-label-new','p-role-seeding':'p-role-label-seeding'};
  Object.keys(map).forEach(function(rid){
    var r=document.getElementById(rid), l=document.getElementById(map[rid]);
    if(!r||!l) return;
    l.style.borderColor = r.checked?'var(--accent)':'var(--border)';
    l.style.background  = r.checked?'var(--accent-bg)':'var(--bg3)';
  });
}

// ── 캠페인 유형(인플루언서 마케팅 / 모바일라이브) 전환 ──
// 모바일라이브: 시작시간 입력 시 종료시간 자동 +1시간 + 방송일시 동기화
// 동일 편성코드로 등록된 인플루언서 마케팅 캠페인으로 이동
function gotoInfCampFromMlive(){
  var liveCode = (document.getElementById('appmkt-live-code')?.value||'').trim();
  if(!liveCode){ showToast('편성코드가 입력되지 않았습니다.'); return; }
  // 동일 편성코드를 가진 인플루언서 마케팅 캠페인 찾기
  var infCamp = DB.campaigns.find(function(c){
    if((c.campType||'')==='모바일라이브') return false;
    return c.appMkt && String(c.appMkt.liveCode||'').trim() === liveCode;
  });
  if(!infCamp){
    showToast('편성코드 '+liveCode+'로 등록된 인플루언서 마케팅 캠페인이 없습니다.');
    return;
  }
  closeMo('product');
  editProd(infCamp.id);
  showToast('인플루언서 마케팅 캠페인 ['+infCamp.name+'] 으로 이동');
}

function autoSetMliveEndTime(){
  if(getCampType()!=='모바일라이브') return;
  var startEl = document.getElementById('p-start');
  var endEl   = document.getElementById('p-end');
  if(!startEl||!startEl.value) return;
  var sd = new Date(startEl.value);
  if(isNaN(sd.getTime())) return;
  // 종료일이 비어 있으면 시작 +1시간
  if(endEl && !endEl.value){
    var ed = new Date(sd.getTime());
    ed.setHours(ed.getHours()+1);
    endEl.value = _dtLocalStr(ed);
  }
  // APP마케팅 모바일라이브 방송일시 자동 동기화
  var liveDtEl = document.getElementById('appmkt-live-dt');
  if(liveDtEl) liveDtEl.value = startEl.value;
}
function _dtLocalStr(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
    +'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}

function getCampType(){
  var mlive = document.getElementById('p-camptype-mlive');
  return (mlive && mlive.checked) ? '모바일라이브' : '인플루언서';
}
// 인플루언서 매출 영역 계산 + M라이브 실적 표시
function calcInfTotalWithMlive(){
  var infArea = document.getElementById('p-inf-revenue-area');
  if(!infArea) return;
  var isMlive = getCampType()==='모바일라이브';
  // 모바일라이브 캠페인이면 이 영역 숨김
  if(isMlive){ infArea.style.display='none'; return; }
  infArea.style.display='';

  var includeML = document.getElementById('p-inf-rev-include-mlive')?.checked;

  // 인플 매출/건수 (정산블록에서)
  var settleBlocks = document.querySelectorAll('#settle-blocks-container .settle-block-row');
  var infRev=0, infOrd=0;
  settleBlocks.forEach(function(blk){
    infRev += parseInt((blk.querySelector('.settle-revenue')?.value||'').replace(/,/g,''))||0;
    infOrd += parseInt((blk.querySelector('.settle-orders')?.value||'').replace(/,/g,''))||0;
  });
  var editId = parseInt(document.getElementById('p-edit-id')?.value)||0;
  if(!infRev && editId){
    var camp = DB.campaigns.find(function(c){ return c.id===editId; });
    if(camp){ infRev = camp.settleRevenue||0; infOrd = camp.settleOrders||0; }
  }

  // M라이브 실적 (편성코드 매칭)
  var mlOnair=0, mlOnairQty=0, mlOffair=0, mlOffairQty=0, mlTotal=0, mlTotalQty=0;
  var hasMlive = false;
  var codes = _mliveCodes.length ? _mliveCodes : [];
  if(!codes.length){
    var lc = (document.getElementById('appmkt-live-code')?.value||'').trim();
    if(lc) codes=[lc];
  }
  if(codes.length && _mliveData && _mliveData.length){
    codes.forEach(function(lc){
      var lc2=String(lc).trim();
      var m = _mliveData.find(function(x){ return String(x.code).trim()===lc2; })
           || _mliveData.find(function(x){ return String(x.code).trim()===lc2.replace(/\D/g,''); });
      if(m){
        hasMlive=true;
        mlOnair += m.mobOrderAmt||0;
        mlOnairQty += m.mobOrderQty||0;
        var oa = (m.orderAmt||0)-(m.mobOrderAmt||0);
        var oq = (m.orderQty||0)-(m.mobOrderQty||0);
        mlOffair += oa;
        mlOffairQty += oq;
        mlTotal += m.orderAmt||0;
        mlTotalQty += m.orderQty||0;
      }
    });
  }
  // 저장된 값 폴백
  if(!hasMlive && editId){
    var camp2 = DB.campaigns.find(function(c){ return c.id===editId; });
    if(camp2 && (camp2.onairRevenue||camp2.offairRevenue)){
      hasMlive=true;
      mlOnair=camp2.onairRevenue||0; mlOffair=camp2.offairRevenue||0;
      mlTotal=mlOnair+mlOffair; mlTotalQty=camp2.mliveOrderQty||0;
    }
  }

  // 인플루언서 전체매출 표시
  var fk = function(n){ return n ? n.toLocaleString('ko-KR')+'원' : '-'; };
  var fq = function(n){ return n ? n.toLocaleString('ko-KR')+'건' : '-'; };
  var dispRev = includeML ? infRev + mlOnair : infRev;
  var dispOrd = includeML ? infOrd + mlOnairQty : infOrd;
  var totalD = document.getElementById('p-inf-total-display');
  var ordersD = document.getElementById('p-inf-orders-display');
  if(totalD) totalD.textContent = fk(dispRev);
  if(ordersD) ordersD.textContent = fq(dispOrd);

  // M라이브 실적 상세
  var perfRow = document.getElementById('p-mlive-perf-row');
  if(perfRow) perfRow.style.display = hasMlive ? '' : 'none';
  if(hasMlive){
    var el=function(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; };
    el('p-mlive-onair-display', fk(mlOnair));
    el('p-mlive-onair-qty-display', fq(mlOnairQty));
    el('p-mlive-offair-display', fk(mlOffair));
    el('p-mlive-offair-qty-display', fq(mlOffairQty));
    el('p-mlive-total-display', fk(mlTotal));
    el('p-mlive-total-qty-display', fq(mlTotalQty));
  }

  // 방송중/방송외 input DIM 처리 (엑셀 데이터 있으면)
  var onairInp = document.getElementById('p-onair-revenue');
  var offairInp = document.getElementById('p-offair-revenue');
  var onairRow = document.getElementById('p-onair-offair-row');
  if(hasMlive && onairRow){
    onairRow.style.opacity='0.4';
    if(onairInp){ onairInp.readOnly=true; onairInp.style.background='var(--bg)'; }
    if(offairInp){ offairInp.readOnly=true; offairInp.style.background='var(--bg)'; }
  } else if(onairRow){
    onairRow.style.opacity='';
    if(onairInp){ onairInp.readOnly=false; onairInp.style.background=''; }
    if(offairInp){ offairInp.readOnly=false; offairInp.style.background=''; }
  }
}
// 전체매출 라벨/DIM: 인플루언서일 때 편성코드 유무에 따라 변경
function updateTotalRevLabel(){
  var isMlive = getCampType()==='모바일라이브';
  var label = document.getElementById('p-total-revenue-label');
  var desc  = document.getElementById('p-total-revenue-desc');
  var wrap  = document.getElementById('p-total-revenue-wrap');
  var inp   = document.getElementById('p-total-revenue');
  if(!label) return;
  if(isMlive){
    // M라이브: 기존 라벨 유지
    label.textContent = '전체 매출';
    if(desc) desc.textContent = '엑셀 업로드 자동 기입';
    if(wrap) wrap.style.opacity = '';
    if(inp){ inp.style.background = ''; inp.readOnly = false; }
  } else {
    // 인플루언서: 편성코드 입력 여부 확인 (복수 코드 포함)
    var liveCode = (document.getElementById('appmkt-live-code')?.value||'').trim();
    var hasCode = !!liveCode || (_mliveCodes && _mliveCodes.length > 0);
    if(!liveCode && _mliveCodes && _mliveCodes.length) liveCode = _mliveCodes[0];
    label.textContent = '모바일라이브포함 전체매출';
    if(desc) desc.textContent = hasCode ? '편성코드 연동 자동 합산' : '편성코드 미입력';
    if(wrap){ wrap.style.opacity = hasCode ? '' : '0.4'; }
    if(inp){
      inp.style.background = hasCode ? '' : 'var(--bg)';
      inp.readOnly = true; // 인플루언서에서는 자동 합산값이므로 수정 불가
    }
    // 편성코드가 있으면 M라이브 매출 연동 값 표시
    if(hasCode) syncInfTotalRevFromMlive(liveCode);
  }
  // 인플루언서 매출 영역 갱신
  calcInfTotalWithMlive();
}
// 인플루언서 캠페인: 편성코드 기반 M라이브 매출 연동
function syncInfTotalRevFromMlive(liveCode){
  if(!liveCode) return;
  var mlData = null;
  // _mliveData에서 편성코드로 검색
  if(_mliveData && _mliveData.length){
    mlData = _mliveData.find(function(m){ return String(m.code).trim()===liveCode; })
          || _mliveData.find(function(m){ return String(m.code).trim()===liveCode.replace(/\D/g,''); });
  }
  // 또는 M라이브 캠페인에서 검색
  var mlCamp = null;
  if(!mlData){
    mlCamp = (DB.campaigns||[]).find(function(c){
      return c.campType==='모바일라이브' && c.appMkt && String(c.appMkt.liveCode||'').trim()===liveCode;
    });
  }
  var mlRevenue = mlData ? (mlData.orderAmt||0) : (mlCamp ? (mlCamp.totalRevenue||0) : 0);
  // 인플루언서 자체 매출 (settleRevenue)
  var infRev = 0;
  var settleBlocks = document.querySelectorAll('#settle-blocks-container .settle-block-row');
  if(settleBlocks.length){
    settleBlocks.forEach(function(blk){
      infRev += parseInt((blk.querySelector('.settle-revenue')?.value||'').replace(/,/g,''))||0;
    });
  }
  // 또는 현재 편집 중인 캠페인의 settleRevenue
  var editId = parseInt(document.getElementById('p-edit-id')?.value)||0;
  if(!infRev && editId){
    var camp = DB.campaigns.find(function(c){ return c.id===editId; });
    if(camp) infRev = camp.settleRevenue||0;
  }
  var totalRev = infRev + mlRevenue;
  var inp = document.getElementById('p-total-revenue');
  if(inp && totalRev) inp.value = totalRev.toLocaleString('ko-KR');
  // 부가 정보 표시
  var desc = document.getElementById('p-total-revenue-desc');
  if(desc && mlRevenue){
    desc.textContent = '인플 '+(infRev?Math.round(infRev/10000).toLocaleString()+'만':'0')+' + M라이브 '+Math.round(mlRevenue/10000).toLocaleString()+'만';
  }
}
function updateCampTypeUI(){
  var type = getCampType();
  var isMlive = (type === '모바일라이브');
  // 라디오 버튼 시각 강조 (선택된 카드에 accent 컬러, 볼드 박스)
  var lInf = document.getElementById('p-camptype-label-inf');
  var lMl  = document.getElementById('p-camptype-label-mlive');
  if(lInf){
    lInf.style.borderColor = !isMlive?'var(--accent)':'var(--border)';
    lInf.style.background  = !isMlive?'var(--accent-bg)':'var(--bg)';
    lInf.style.boxShadow   = !isMlive?'0 0 0 3px rgba(108,92,231,0.18)':'none';
  }
  if(lMl){
    lMl.style.borderColor  =  isMlive?'var(--accent)':'var(--border)';
    lMl.style.background   =  isMlive?'var(--accent-bg)':'var(--bg)';
    lMl.style.boxShadow    =  isMlive?'0 0 0 3px rgba(108,92,231,0.18)':'none';
  }
  // M라이브: 예산 / 캠페인 선정 사유 숨김
  var budgetRow = document.getElementById('p-budget-row');
  if(budgetRow) budgetRow.style.display = isMlive ? 'none' : '';
  var reasonsWrap = document.getElementById('p-reasons-wrap');
  if(reasonsWrap) reasonsWrap.style.display = isMlive ? 'none' : '';
  // M라이브: 상품정보 내 담당MD 숨김 (기본정보로 이동)
  var ownerProductWrap = document.getElementById('p-owner-product-wrap');
  if(ownerProductWrap) ownerProductWrap.style.display = isMlive ? 'none' : '';
  // M라이브: 상품코드·가격 테이블 숨김
  var skuTableWrap = document.getElementById('p-sku-table-wrap');
  if(skuTableWrap) skuTableWrap.style.display = isMlive ? 'none' : '';
  // M라이브: CS/배송정보 숨김 (인플루언서만 표시)
  var csDeliveryWrap = document.getElementById('p-cs-delivery-wrap');
  if(csDeliveryWrap) csDeliveryWrap.style.display = isMlive ? 'none' : '';
  // M라이브: 소구포인트 숨김 (인플루언서만 표시)
  var appealWrap = document.getElementById('p-appeal-wrap');
  if(appealWrap) appealWrap.style.display = isMlive ? 'none' : '';
  // M라이브 전용 필드 (담당MD/상품마진/편성사유/마케팅요청/협력사마케팅/외부채널송출)
  var mliveExtra = document.getElementById('p-mlive-extra-wrap');
  if(mliveExtra) mliveExtra.style.display = isMlive ? '' : 'none';
  // M라이브: 일자 라벨 변경 + 확정일자 표시
  var startLabel = document.getElementById('p-start-label');
  var endLabel = document.getElementById('p-end-label');
  if(startLabel) startLabel.textContent = isMlive ? '요청시작일' : '시작일';
  if(endLabel) endLabel.textContent = isMlive ? '요청종료일' : '종료일';
  var confirmDatesRow = document.getElementById('p-confirm-dates-row');
  if(confirmDatesRow) confirmDatesRow.style.display = isMlive ? '' : 'none';
  // M라이브: 캠페인 역할 / 캠페인담당 / 인플루언서 정보 섹션 숨김
  var roleWrap = document.getElementById('p-role-wrap');
  if(roleWrap) roleWrap.style.display = isMlive ? 'none' : '';
  var pdRow = document.getElementById('p-pd-single-row');
  if(pdRow) pdRow.style.display = isMlive ? 'none' : '';
  var infWrap = document.getElementById('sec-inf-wrap');
  if(infWrap) infWrap.style.display = isMlive ? 'none' : '';
  // 쇼호스트 섹션 표시/숨김 (Phase 4에서 추가 예정)
  var hostWrap = document.getElementById('sec-host-wrap');
  if(hostWrap) hostWrap.style.display = isMlive ? '' : 'none';
  // M라이브 편성 달력 버튼 표시/숨김
  var calBtn = document.getElementById('mlive-sched-cal-btn');
  if(calBtn) calBtn.style.display = isMlive ? '' : 'none';
  // 유형 아래 버튼 표시/숨김
  var mliveBtns = document.getElementById('p-camptype-mlive-btns');
  if(mliveBtns) mliveBtns.style.display = isMlive ? 'flex' : 'none';
  var infBtns = document.getElementById('p-camptype-inf-btns');
  if(infBtns) infBtns.style.display = !isMlive ? 'flex' : 'none';
  // 모바일라이브 소구포인트 가이드 표시/숨김
  var appealGuide = document.getElementById('p-appeal-mlive-guide');
  if(appealGuide) appealGuide.style.display = isMlive ? '' : 'none';
  // M라이브: 정산처리일/비용지불일 숨김
  var settleDatesRow = document.getElementById('p-settle-dates-row');
  if(settleDatesRow) settleDatesRow.style.display = isMlive ? 'none' : '';
  // M라이브: 인플루언서 랜딩 페이지 숨김
  var landingRow = document.getElementById('appmkt-landing-row');
  if(landingRow) landingRow.style.display = isMlive ? 'none' : '';
  // M라이브: 인플루언서 정산 블록 숨김
  var settleBlocks = document.getElementById('settle-blocks-container');
  if(settleBlocks) settleBlocks.style.display = isMlive ? 'none' : '';
  // M라이브: 마케팅 항목 숨김
  var mktItemsWrap = document.getElementById('p-marketing-items-wrap');
  if(mktItemsWrap) mktItemsWrap.style.display = isMlive ? 'none' : '';
  // M라이브: 정산완료 체크박스 숨김
  var settleDoneWrap = document.getElementById('p-settle-done-wrap');
  if(settleDoneWrap) settleDoneWrap.style.display = isMlive ? 'none' : '';
  // M라이브 + PUSH 체크 시에만 APP PUSH 섹션 표시
  updatePushSectionVisibility();
  // AI챗봇 섹션 (재방 전용)
  updateAiChatSection();
  // M라이브: 업체광고비 → 광고수익 라벨 변경
  var adIncLabel = document.getElementById('p-ad-income-label');
  var adIncDesc = document.querySelector('#p-ad-income-wrap label span[style*="font-size:10px"]');
  if(adIncLabel) adIncLabel.textContent = isMlive ? '광고수익' : '업체광고비';
  if(adIncDesc) adIncDesc.textContent = isMlive ? '업체에서 수취한 광고수익' : '업체에서 수취한 광고비';
  // p-settle-da: M라이브일 때 '마케팅비'(한계이익 계산용, 엑셀 CJ열), 인플은 '광고수익' 유지
  var sdLabel = document.getElementById('p-settle-da-label');
  var sdDesc  = document.getElementById('p-settle-da-desc');
  if(sdLabel) sdLabel.textContent = isMlive ? '마케팅비' : '광고수익';
  if(sdDesc)  sdDesc.textContent  = isMlive ? 'M라이브마케팅비 (한계이익 계산용)' : '';
  // M라이브/인플루언서: 단계 select 옵션 전환
  var stageSelect = document.getElementById('prod-stage-select');
  if(stageSelect){
    var curVal = stageSelect.value;
    stageSelect.innerHTML = isMlive
      ? '<option value="1.캠페인요청">1단계 · 편성요청</option>'
       +'<option value="2.캠페인확정">2단계 · 편성확정</option>'
       +'<option value="3.상품정보등록">3단계 · 상품정보등록</option>'
       +'<option value="6.APP마케팅확정">4단계 · 모바일마케팅</option>'
       +'<option value="7.정산">5단계 · 정산</option>'
       +'<option value="8.성과분석">6단계 · 성과분석</option>'
      : '<option value="1.캠페인요청">1단계 · 캠페인요청</option>'
       +'<option value="2.캠페인확정">2단계 · 캠페인확정</option>'
       +'<option value="4.MCN요청">4단계 · MCN요청</option>'
       +'<option value="5.인플루언서확정">5단계 · 인플루언서확정</option>'
       +'<option value="6.APP마케팅확정">6단계 · 모바일마케팅확정</option>'
       +'<option value="7.정산">7단계 · 정산</option>'
       +'<option value="8.성과분석">8단계 · 성과분석</option>';
    // 기존 값 복원 시도
    if(curVal){ var opt=stageSelect.querySelector('option[value="'+curVal+'"]'); if(opt) stageSelect.value=curVal; }
  }
  // 인플루언서: 전체매출 라벨/DIM 상태 (편성코드 연동)
  updateTotalRevLabel();
}

// ── 모바일라이브 확정일 변경 시 단계 배지 갱신 ──
function onConfirmDateChange(){
  var cs = (document.getElementById('p-confirm-start')?.value||'').trim();
  var ce = (document.getElementById('p-confirm-end')?.value||'').trim();
  if(cs && ce){
    var badge = document.getElementById('prod-stage-badge');
    var sel   = document.getElementById('prod-stage-select');
    if(badge){ badge.textContent='2.캠페인확정'; badge.style.background='var(--green-bg)'; badge.style.color='var(--green)'; }
    if(sel) sel.value='2.캠페인확정';
  }
}

// ── M라이브 편성 달력 ──
var _mliveCalDate = (function(){ var d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
function openMliveSchedCal(){
  _mliveCalDate = (function(){ var d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
  renderMliveSchedCal();
  openMo('mlive-sched-cal');
}
function mliveCalPrev(){ _mliveCalDate.setMonth(_mliveCalDate.getMonth()-1); renderMliveSchedCal(); }
function mliveCalNext(){ _mliveCalDate.setMonth(_mliveCalDate.getMonth()+1); renderMliveSchedCal(); }
function renderMliveSchedCal(){
  var y=_mliveCalDate.getFullYear(), m=_mliveCalDate.getMonth();
  var titleEl = document.getElementById('mlive-cal-title');
  if(titleEl) titleEl.textContent = y+'년 '+(m+1)+'월';
  var firstDay = new Date(y,m,1).getDay();
  var daysInMonth = new Date(y,m+1,0).getDate();
  var monthStart = y+'-'+String(m+1).padStart(2,'0')+'-01';
  var monthEnd   = y+'-'+String(m+1).padStart(2,'0')+'-'+String(daysInMonth).padStart(2,'0');
  // M라이브 캠페인만 (전체 사용자 기준)
  var camps = (DB.campaigns||[]).filter(function(c){
    if((c.campType||'') !== '모바일라이브') return false;
    var cs=(c.start||c.startDate||'').slice(0,10);
    if(!cs) return false;
    return cs>=monthStart && cs<=monthEnd;
  });
  // 날짜별 그룹
  var byDay = {};
  camps.forEach(function(c){
    var d = (c.start||c.startDate||'').slice(0,10);
    if(!byDay[d]) byDay[d]=[];
    byDay[d].push(c);
  });
  // 각 날짜별로 시간 순 정렬
  Object.keys(byDay).forEach(function(k){
    byDay[k].sort(function(a,b){
      var da = a.confirmStart||(a.appMkt&&a.appMkt.liveDt)||a.start||'';
      var db = b.confirmStart||(b.appMkt&&b.appMkt.liveDt)||b.start||'';
      return da < db ? -1 : da > db ? 1 : 0;
    });
  });
  var cntEl = document.getElementById('mlive-cal-count');
  if(cntEl) cntEl.textContent = camps.length+'건 편성';
  var today = new Date(); today.setHours(0,0,0,0);
  var grid = document.getElementById('mlive-cal-grid');
  if(!grid) return;
  var html = '';
  for(var i=0;i<firstDay;i++) html += '<div style="min-height:80px;background:var(--bg);border-radius:4px"></div>';
  for(var d=1; d<=daysInMonth; d++){
    var dStr = y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var dayDate = new Date(y,m,d); dayDate.setHours(0,0,0,0);
    var isToday = dayDate.getTime()===today.getTime();
    var dow = dayDate.getDay();
    var dayColor = dow===0?'var(--red)':(dow===6?'var(--blue)':'var(--text2)');
    var dayCamps = byDay[dStr]||[];
    var itemsHtml = dayCamps.slice(0,3).map(function(c){
      // 방송 시간 추출 (확정시작일 > liveDt > start 순)
      var dt = c.confirmStart||(c.appMkt&&c.appMkt.liveDt)||c.start||'';
      var hh = '';
      if(dt && dt.length>=13){
        var h = parseInt(dt.slice(11,13))||0;
        hh = h+'시';
      }
      // 본방/재방 구분 (캠페인명에 "다시보는" 포함 여부)
      var isReplay = (c.name||'').indexOf('다시보는')>=0;
      var nm = (c.name||'-').length>8 ? (c.name.slice(0,8)+'…') : (c.name||'-');
      var label = (hh ? '['+hh+'] ' : '') + nm;
      // 본방: 파랑 / 재방: 주황
      var bg = isReplay ? 'rgba(255,159,67,0.18)' : 'rgba(8,116,212,0.18)';
      var col = isReplay ? 'var(--orange)' : 'var(--blue)';
      var bd = isReplay ? 'var(--orange)' : 'var(--blue)';
      return '<div title="'+escHtml(c.name||'')+' · '+escHtml(c.stage||'')+'" style="font-size:10px;padding:2px 4px;background:'+bg+';border:1px solid '+bd+';color:'+col+';border-radius:3px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600">'+escHtml(label)+'</div>';
    }).join('');
    if(dayCamps.length>3) itemsHtml += '<div style="font-size:9px;color:var(--text3);text-align:center">+'+(dayCamps.length-3)+'</div>';
    html += '<div style="min-height:80px;background:'+(isToday?'var(--accent-bg)':'var(--bg2)')+';border:1px solid '+(isToday?'var(--accent)':'var(--border)')+';border-radius:4px;padding:4px"><div style="font-size:11px;font-weight:700;color:'+dayColor+';margin-bottom:3px">'+d+'</div>'+itemsHtml+'</div>';
  }
  grid.innerHTML = html;
}

// ── M라이브 편성 중복 체크 ──
function checkMliveScheduleDup(){
  var dt = (document.getElementById('appmkt-live-dt')?.value||'').trim();
  if(!dt) return;
  var editId = parseInt(document.getElementById('p-edit-id')?.value)||0;
  var inputStart = dt.slice(0,16); // YYYY-MM-DDTHH:MM
  var dups = (DB.campaigns||[]).filter(function(c){
    if(c.id === editId) return false;
    if((c.campType||'') !== '모바일라이브') return false;
    var liveDt = (c.appMkt&&c.appMkt.liveDt)||c.start||'';
    return liveDt.slice(0,16) === inputStart;
  });
  if(!dups.length) return;
  _showDupPopup(dups, inputStart);
}

function checkMliveScheduleDupOnSave(){
  var dt = (document.getElementById('appmkt-live-dt')?.value||'').trim();
  if(!dt) return true; // no date = no check
  var editId = parseInt(document.getElementById('p-edit-id')?.value)||0;
  var inputStart = dt.slice(0,16);
  var dups = (DB.campaigns||[]).filter(function(c){
    if(c.id === editId) return false;
    if((c.campType||'') !== '모바일라이브') return false;
    var liveDt = (c.appMkt&&c.appMkt.liveDt)||c.start||'';
    return liveDt.slice(0,16) === inputStart;
  });
  if(dups.length) _showDupPopup(dups, inputStart);
  return true; // don't block save
}

function _showDupPopup(dups, inputStart){
  var existing = document.getElementById('mlive-dup-popup');
  if(existing) existing.remove();
  var timeStr = inputStart.replace('T',' ');
  var listHtml = dups.map(function(c){
    var code = (c.appMkt&&c.appMkt.liveCode)||'-';
    return '<div style="padding:8px 12px;border-bottom:1px solid var(--border);font-size:12.5px">'
      +'<span style="font-weight:700">'+escHtml(c.name||'-')+'</span>'
      +' <span style="font-family:monospace;color:var(--accent2);font-size:11px">'+escHtml(code)+'</span>'
      +'</div>';
  }).join('');
  var el = document.createElement('div');
  el.id = 'mlive-dup-popup';
  el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.3);z-index:99999;display:flex;align-items:center;justify-content:center';
  el.innerHTML = '<div style="background:var(--bg2);border:2px solid var(--orange);border-radius:var(--r-lg);width:480px;max-width:90vw;overflow:hidden">'
    +'<div style="padding:16px 20px;background:var(--orange-bg);display:flex;align-items:center;justify-content:space-between">'
    +'<div style="font-size:14px;font-weight:800;color:var(--orange)">⚠️ 편성 시간 중복 안내</div>'
    +'<button class="btn btn-ghost btn-xs" onclick="document.getElementById(\'mlive-dup-popup\').remove()">✕</button>'
    +'</div>'
    +'<div style="padding:14px 20px">'
    +'<div style="font-size:12.5px;color:var(--text2);margin-bottom:10px"><b>'+timeStr+'</b> 에 이미 편성된 M라이브가 <b>'+dups.length+'건</b> 있습니다.</div>'
    +listHtml
    +'<div style="text-align:right;margin-top:14px"><button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'mlive-dup-popup\').remove()">닫기</button></div>'
    +'</div></div>';
  document.body.appendChild(el);
}

function addPdRow(){
  var container = document.getElementById('pd-list');
  var row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;align-items:center';
  row.innerHTML = `<input class="inp pd-input" placeholder="PD 이름" style="flex:1">
    <button class="btn btn-danger btn-xs" onclick="this.parentNode.remove()" type="button">✕</button>`;
  container.appendChild(row);
}

// SKU 행 추가
function addSkuRow(data){
  var container = document.getElementById('sku-list');
  if(!container) return;
  var d = data || {};
  var num = container.children.length + 1;
  var row = document.createElement('tr');
  row.className = 'sku-row';
  row.innerHTML =
    '<td style="padding:3px 4px;text-align:center;font-size:11px;font-weight:700;color:var(--text3)" class="sku-num">'+num+'</td>'
    +'<td style="padding:3px 4px;text-align:center"><input type="checkbox" class="sku-main" title="대표상품" style="accent-color:var(--accent);width:14px;height:14px;cursor:pointer"'+(d.isMain?' checked':'')+' onchange="setMainSku(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm sku-code" placeholder="상품코드" value="'+(d.code||'')+'" style="width:90px" oninput="autoFillSku(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm sku-mdcat" placeholder="MDCAT" value="'+(d.mdcat||'')+'" style="width:80px"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm sku-cat" placeholder="카테고리" value="'+(d.cat||'')+'" style="width:80px"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm sku-pname" placeholder="상품명" value="'+(d.productName||'')+'" style="width:100px"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm sku-brand" placeholder="브랜드" value="'+(d.brand||'')+'" style="width:80px"></td>'
    // 가격 컬럼 (border-left로 구분)
    +'<td style="padding:3px 4px;border-left:2px solid var(--border2)"><input class="inp inp-sm inp-money pg-price" placeholder="0" value="'+(d.price?(+d.price).toLocaleString('ko-KR'):'')+'" style="width:76px;text-align:right" oninput="formatMoney(this);calcSkuPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-md" placeholder="0" value="'+(d.mdPrice?(+d.mdPrice).toLocaleString('ko-KR'):'')+'" style="width:76px;text-align:right" oninput="formatMoney(this);calcSkuPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-card" placeholder="0" value="'+(d.cardDiscount?(+d.cardDiscount).toLocaleString('ko-KR'):'')+'" style="width:70px;text-align:right" oninput="formatMoney(this);calcSkuPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-mileage" placeholder="0" value="'+(d.mileage?(+d.mileage).toLocaleString('ko-KR'):'')+'" style="width:70px;text-align:right" oninput="formatMoney(this);calcSkuPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-coupon" placeholder="0" value="'+(d.coupon?(+d.coupon).toLocaleString('ko-KR'):'')+'" style="width:70px;text-align:right" oninput="formatMoney(this);calcSkuPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-broadcast-coupon" placeholder="0" value="'+(d.broadcastCoupon?(+d.broadcastCoupon).toLocaleString('ko-KR'):'')+'" style="width:70px;text-align:right" oninput="formatMoney(this);calcSkuPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-post-mileage" placeholder="0" value="'+(d.postMileage?(+d.postMileage).toLocaleString('ko-KR'):'')+'" style="width:70px;text-align:right" oninput="formatMoney(this);calcSkuPriceRow(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm pg-promo" placeholder="기타" value="'+(d.promoText||'')+'" style="width:80px"></td>'
    +'<td style="padding:3px 4px;text-align:right;font-size:12px;font-weight:700;color:var(--accent);white-space:nowrap" class="pg-final">'+(d.finalPrice?(+d.finalPrice).toLocaleString('ko-KR'):'-')+'</td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-online-lowest" placeholder="0" value="'+(d.onlineLowestPrice?(+d.onlineLowestPrice).toLocaleString('ko-KR'):'')+'" style="width:80px;text-align:right" oninput="formatMoney(this)"></td>'
    +'<td style="padding:3px 4px"><input class="inp inp-sm inp-money pg-stock" placeholder="0" value="'+(d.stock?(+d.stock).toLocaleString('ko-KR'):'')+'" style="width:60px;text-align:right" oninput="formatMoney(this)"></td>'
    +'<td style="padding:3px 4px"><button class="btn btn-danger btn-xs" onclick="this.closest(\'tr\').remove();updateSkuNumbers()" type="button">✕</button></td>';
  container.appendChild(row);
  row.querySelectorAll('.inp-money').forEach(function(el){
    el.addEventListener('input', function(){ formatMoney(this); calcSkuPriceRow(this); });
  });
}

function calcSkuPriceRow(inp){
  var row = inp.closest('.sku-row');
  if(!row) return;
  var parse = function(cls){ return parseInt((row.querySelector(cls)?.value||'').replace(/,/g,''))||0; };
  var md   = parse('.pg-md');
  var card = parse('.pg-card');
  var mile = parse('.pg-mileage');
  var cpn  = parse('.pg-coupon');
  var bcpn = parse('.pg-broadcast-coupon');
  var postM = parse('.pg-post-mileage');
  var final = md > 0 ? Math.max(0, md - card - mile - cpn - bcpn - postM) : 0;
  var cel = row.querySelector('.pg-final');
  if(cel) cel.textContent = final > 0 ? final.toLocaleString('ko-KR') : '-';
}

function updateSkuNumbers(){
  var rows = document.querySelectorAll('#sku-list .sku-row');
  rows.forEach(function(row, i){
    var num = row.querySelector('.sku-num');
    if(num) num.textContent = i+1;
  });
}

function setMainSku(cb){
  // 대표상품은 하나만 — 다른 체크 해제
  if(cb.checked){
    document.querySelectorAll('#sku-list .sku-main').forEach(function(other){
      if(other !== cb) other.checked = false;
    });
  }
}

// 내부 DB 연동 시 자동완성 (현재는 샘플 매핑 - 실제 DB 연동 시 API 호출로 교체)
var PRODUCT_DB_MOCK = {
  'SKU-001': {mdcat:'BEAUTY-01', cat:'뷰티', productName:'비타민C 세럼 30ml', brand:'스킨랩', md:'이소연'},
  'SKU-002': {mdcat:'FOOD-01',   cat:'식품', productName:'그린스무디 파우더',  brand:'헬씨팜',  md:'박민준'},
  'SKU-007': {mdcat:'BEAUTY-02', cat:'뷰티', productName:'UV 선크림 SPF50+',  brand:'선케어랩',md:'이소연'},
};
function autoFillSku(inp){
  var code = inp.value.trim().toUpperCase();
  var matched = PRODUCT_DB_MOCK[code];
  if(!matched) return;
  var row = inp.closest('.sku-row');
  if(!row) return;
  row.querySelector('.sku-mdcat').value  = matched.mdcat;
  row.querySelector('.sku-cat').value    = matched.cat;
  row.querySelector('.sku-pname').value  = matched.productName;
  row.querySelector('.sku-brand').value  = matched.brand;
  row.querySelector('.sku-md').value     = matched.md;
  showToast(`${code} 자동 입력됨`);
}
// 캠페인 역할 선택 시 카드 하이라이트
function updateCampRoleDisplay(campId){
  var c = DB.campaigns.find(function(x){return x.id===parseInt(campId);});
  var el = document.getElementById('c-role-display');
  if(el) el.textContent = (c && c.role) ? c.role : '(미지정)';
}
function updateRoleLabels(){
  var roleMap = {
    'c-role-sales':   'role-label-sales',
    'c-role-encore':  'role-label-encore',
    'c-role-new':     'role-label-new',
    'c-role-seeding': 'role-label-seeding',
  };
  Object.entries(roleMap).forEach(([radioId, labelId])=>{
    var radio = document.getElementById(radioId);
    var label = document.getElementById(labelId);
    if(!radio||!label) return;
    if(radio.checked){
      label.style.borderColor='var(--accent)';
      label.style.background='var(--accent-bg)';
    } else {
      label.style.borderColor='var(--border)';
      label.style.background='var(--bg3)';
    }
  });
}

function saveCamp(){
  var campId = parseInt(v('c-prod'));
  if(!campId){ alert('캠페인을 선택해주세요'); return; }
  var reasons=[];
  document.querySelectorAll('.c-reason-cb:checked').forEach(function(cb){ reasons.push(cb.value); });
  // 기존 캠페인에 확정 정보만 업데이트
  var idx = DB.campaigns.findIndex(function(c){return c.id===campId;});
  if(idx===-1){ alert('캠페인을 찾을 수 없습니다'); return; }
  var existing = DB.campaigns[idx];
  var newStage = reasons.length > 0 ? '2.캠페인확정' : existing.stage;
  DB.campaigns[idx] = Object.assign({}, existing, {
    stage: newStage,
    reasons: reasons,
    promo: v('c-promo')||existing.promo,
    gift:  v('c-gift')||existing.gift,
    owner: v('c-owner')||existing.owner,
    desc:  v('c-desc')||existing.desc,
    tags:  v('c-tags')||existing.tags,
  });
  addAct('✅', existing.name+' 캠페인 확정', nowStr(), v('c-owner'));
  addNotif('✅', existing.name+' 캠페인 확정됨', '방금 전');
  showToast(existing.name+(reasons.length>0?' 확정됨':' 업데이트됨'));
  broadcastData(); closeMo('campaign'); renderS2(); renderDash();
}
// 캠페인 수정 열기
function editCamp(id){
  var c=DB.campaigns.find(x=>x.id===id); if(!c) return;
  openMo('campaign');
  // openMo가 c-edit-id를 초기화하므로 반드시 openMo 호출 후에 세팅
  setTimeout(function(){
    document.getElementById('c-edit-id').value=id;
    document.getElementById('camp-mo-title').textContent='캠페인 수정 (2단계 · 캠페인확정)';
    document.getElementById('camp-save-btn').textContent='수정 저장';
    document.getElementById('c-name').value=c.name||'';
    document.getElementById('c-budget').value=c.budget||'';
    document.getElementById('c-start').value=c.start||'';
    document.getElementById('c-end').value=c.end||'';
    document.getElementById('c-promo').value=c.promo||'';
    document.getElementById('c-gift').value=c.gift||'';
    document.getElementById('c-target').value=c.target||'';
    // c-owner 드롭다운 갱신 후 값 복원
    var cOwnerEl = document.getElementById('c-owner');
    if(cOwnerEl && cOwnerEl.tagName==='SELECT'){
      cOwnerEl.innerHTML = buildManagerOptions(c.owner||'');
    } else if(cOwnerEl){ cOwnerEl.value=c.owner||''; }
    document.getElementById('c-desc').value=c.desc||'';
    document.getElementById('c-tags').value=c.tags||'';
    // 확정 사유 체크
    var reasons=c.reasons||[];
    document.querySelectorAll('.c-reason-cb').forEach(function(cb){ cb.checked=reasons.includes(cb.value); });
    // 캠페인 역할 복원
    document.querySelectorAll('input[name="c-role"]').forEach(function(r){ r.checked=(r.value===c.role); });
    updateRoleLabels();
    // 연결 상품
    var prodSel=document.getElementById('c-prod');
    for(var i=0;i<prodSel.options.length;i++){ if(parseInt(prodSel.options[i].value)===c.product){ prodSel.selectedIndex=i; break; } }
  }, 0);
}
function saveInf(){
  if(!canEdit() || isExtMcn()){ showToast('권한이 없습니다.'); return; }
  var name=document.getElementById('i-name').value.trim(); if(!name){alert('이름 필수');return;}
  DB.influencers.push({id:nid.influencers++,name,insta:v('i-insta'),youtube:v('i-youtube'),twitter:v('i-twitter'),followers:iv('i-flw'),cat:v('i-cat'),contact:v('i-contact'),address:v('i-address'),fee:iv('i-fee'),memo:v('i-memo')});
  addAct('👤',`${name} 인플루언서 등록`,nowStr(),'');
  addNotif('👤',`${name} DB 추가됨`,'방금 전');
  // Firebase에 influencers만 개별 저장 (전체 덮어쓰기 방지)
  if(fbReady){
    fbRef.child('influencers').set(arrToObj(DB.influencers))
      .then(function(){ console.log('[saveInf] Firebase 저장 성공'); })
      .catch(function(e){ console.warn('[saveInf] Firebase 저장 실패:', e); });
  }
  broadcastData(); closeMo('influencer'); renderInfs();
  showToast(`${name} 등록됨`);
}

// ═══════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════
function renderNotif(){
  var h='';
  if(!DB.notifications.length) h='<div class="empty" style="padding:24px"><p>알림 없음</p></div>';
  else DB.notifications.forEach(function(n){
    var linkBtn = '';
    if(n.campId){
      linkBtn = '<button onclick="toggleNotif();editProd('+n.campId+')" style="margin-top:4px;background:var(--accent-bg);color:var(--accent2);border:1px solid var(--accent);border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">→ 바로가기</button>';
    }
    h+='<div class="notif-item '+(n.unread?'unread':'')+'">'      +'<div class="notif-ico">'+n.ico+'</div>'      +'<div style="flex:1"><div class="notif-txt">'+n.txt+'</div>'      +'<div class="notif-time">'+n.time+'</div>'      +linkBtn      +'</div></div>';
  });
  document.getElementById('notif-list').innerHTML=h;
  var unread=DB.notifications.filter(function(n){return n.unread;}).length;
  document.getElementById('notif-pip').style.display=unread?'':'none';
}
function toggleNotif(){
  var p=document.getElementById('notif-panel');
  p.classList.toggle('open');
  if(p.classList.contains('open')) renderNotif();
}
function markAllRead(){
  DB.notifications.forEach(function(n){ n.unread=false; });
  // localStorage에 현재 읽음 상태 저장 (사용자별)
  try{ localStorage.setItem('notif-read-'+ME, JSON.stringify(DB.notifications.map(function(n){return n.txt+n.time;}))); }catch(e){}
  renderNotif();
}
function addNotif(ico,txt,time,campId){
  // 이미 읽은 알림인지 확인
  var readList = [];
  try{ readList = JSON.parse(localStorage.getItem('notif-read-'+ME)||'[]'); }catch(e){}
  var key = txt+time;
  var isRead = readList.includes(key);
  DB.notifications.unshift({ico:ico,txt:txt,time:time,unread:!isRead,campId:campId||null});
  if(DB.notifications.length>50) DB.notifications.pop();
  var hasUnread = DB.notifications.some(function(n){return n.unread;});
  document.getElementById('notif-pip').style.display = hasUnread ? '' : 'none';
}
document.addEventListener('click',e=>{ if(!e.target.closest('#notif-panel')&&!e.target.closest('#notif-btn')) document.getElementById('notif-panel').classList.remove('open'); });

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════
const v=(id)=>document.getElementById(id)?.value||'';
const iv=(id)=>parseInt((document.getElementById(id)?.value||'').replace(/,/g,''))||0;

// 금액 입력 필드 콤마 포맷팅
function formatMoney(input){
  var raw = input.value.replace(/[^0-9]/g,'');
  if(raw==='') { input.value=''; return; }
  input.value = parseInt(raw,10).toLocaleString('ko-KR');
}
function initMoneyInputs(){
  document.querySelectorAll('.inp-money').forEach(function(el){
    el.addEventListener('input', function(){ formatMoney(this); });
    el.addEventListener('blur',  function(){ formatMoney(this); });
  });
}
function addAct(ico,txt,time,by){ DB.activities.unshift({ico,txt,time,by}); if(DB.activities.length>30) DB.activities.pop(); }


// 기간 필터 상태
// 날짜 기본값: 현재월 ~ 현재월+1
function _defaultDateRange(){
  var now = new Date();
  var y = now.getFullYear(), m = now.getMonth(); // 0-based
  var fromStr = y+'-'+String(m+1).padStart(2,'0');
  var toDate  = new Date(y, m+1, 1); // 다음달
  var toStr   = toDate.getFullYear()+'-'+String(toDate.getMonth()+1).padStart(2,'0');
  return {from: fromStr, to: toStr};
}
var _dr = _defaultDateRange();
var dateFilter = {
  s1:{from:_dr.from,to:_dr.to,stage:''},
  s2:{from:'',to:''},
  s3:{from:'',to:''},
  s4:{from:'',to:''},
  s5:{from:'',to:''},
  s6:{from:'',to:''},
  s7:{from:'',to:''},
  camp:{from:_dr.from,to:_dr.to}
};

function applyDateFilter(page){
  var from = document.getElementById('df-'+page+'-from')?.value||'';
  var to   = document.getElementById('df-'+page+'-to')?.value||'';
  if(dateFilter[page]) { dateFilter[page].from = from; dateFilter[page].to = to; }
  // 필터 변경 시 페이지 1로 리셋
  if(_pageState && _pageState[page] !== undefined) _pageState[page] = 1;
  if(page==='camp') _campPage = 1;
  if(page==='s1') renderS1();
  else if(page==='s2') renderS2();
  else if(page==='s3') renderS3();
  else if(page==='s4') renderS4();
  else if(page==='s5') renderS5();
  else if(page==='s6') renderS6();
  else if(page==='s7') renderS7();
  else if(page==='camp') renderCamps();
}

function clearDateFilter(page){
  var fEl = document.getElementById('df-'+page+'-from');
  var tEl = document.getElementById('df-'+page+'-to');
  if(fEl) fEl.value='';
  if(tEl) tEl.value='';
  dateFilter[page].from='';
  dateFilter[page].to='';
  if(page==='s1'){
    var sEl=document.getElementById('sf-s1'); if(sEl) sEl.value='';
    dateFilter.s1.stage='';
  }
  var ownerSel=document.getElementById('sf-'+page+'-owner'); if(ownerSel) ownerSel.value='';
  var mdSel=document.getElementById('sf-'+page+'-md');    if(mdSel)    mdSel.value='';
  applyDateFilter(page);
}

// 날짜 범위 체크 헬퍼 (월 단위)
function matchesDateFilter(c, page){
  var df = dateFilter[page];
  if(!df||(!df.from&&!df.to)) return true;
  var cStart = (c.start||c.startDate||'').slice(0,7); // YYYY-MM
  var cEnd   = (c.end  ||c.endDate  ||'').slice(0,7);
  // df.from/to 도 YYYY-MM 형식
  if(df.from && cEnd   && cEnd   < df.from) return false;
  if(df.to   && cStart && cStart > df.to)   return false;
  return true;
}

// 각 페이지 필터 상태 (target=확정대상, all=전체)
var pageFilter = {s1:'all',s2:'target',s3:'target',s4:'target',s5:'target',s6:'target',s7:'target',s8:'target'};

function setPageFilter(page, val){
  pageFilter[page] = val;
  // 라디오 버튼 스타일 업데이트
  var tb=document.getElementById('fb-target-'+page);
  var ab=document.getElementById('fb-all-'+page);
  if(tb) tb.classList.toggle('active', val==='target');
  if(ab) ab.classList.toggle('active', val==='all');
  // 확정대상 모드: 날짜 필터 dim + 값 초기화
  var fromEl = document.getElementById('df-'+page+'-from');
  var toEl   = document.getElementById('df-'+page+'-to');
  var dateWrap = fromEl ? fromEl.closest('.date-filter') : null;
  if(dateWrap){
    if(val === 'target'){
      dateWrap.style.opacity = '0.35';
      dateWrap.style.pointerEvents = 'none';
      if(fromEl){ fromEl.value = ''; fromEl.style.color = 'transparent'; }
      if(toEl){   toEl.value   = ''; toEl.style.color   = 'transparent'; }
      if(dateFilter[page]){ dateFilter[page].from=''; dateFilter[page].to=''; }
    } else {
      dateWrap.style.opacity = '';
      dateWrap.style.pointerEvents = '';
      if(fromEl) fromEl.style.color = '';
      if(toEl)   toEl.style.color   = '';
      // 전체보기로 전환 시 기본 날짜 복원
      var dr = _defaultDateRange();
      if(fromEl && !fromEl.value) fromEl.value = dr.from;
      if(toEl   && !toEl.value)   toEl.value   = dr.to;
      if(dateFilter[page]){ dateFilter[page].from=dr.from; dateFilter[page].to=dr.to; }
    }
  }
  // s7 전체보기일 때만 정산일자 필터 노출
  if(page === 's7'){
    var sdWrap = document.getElementById('s7-settle-date-wrap');
    if(sdWrap) sdWrap.style.display = (val === 'all') ? '' : 'none';
    // 확정대상으로 돌아갈 때 정산일자 값 초기화
    if(val === 'target'){
      var sfFrom = document.getElementById('sf-s7-settle-from');
      var sfTo   = document.getElementById('sf-s7-settle-to');
      if(sfFrom) sfFrom.value = '';
      if(sfTo)   sfTo.value   = '';
    }
  }
  // 해당 페이지 리렌더
  if(page==='s1') renderS1();
  else if(page==='s2') renderS2();
  else if(page==='s3') renderS3();
  else if(page==='s4') renderS4();
  else if(page==='s5') renderS5();
  else if(page==='s6') renderS6();
  else if(page==='s7') renderS7();
}

function updateBadges(){
  // 역할별 캠페인 필터링 — renderCamps와 동일 기준 (이름 없는 빈 캠페인 제외)
  var allValid = DB.campaigns.filter(function(c){ return c.name && c.name.trim(); });
  var camps;
  if(isExtMcn()){
    camps = allValid.filter(function(c){ return campHasMcn(c, ME_MCN_COMPANY); });
  } else if(ME_ROLE === 'md'){
    camps = allValid.filter(function(c){ return isMycamp(c); });
  } else {
    camps = allValid;
  }

  // 각 단계 뱃지 = 해당 화면의 "확정 대상(target)" 필터 기준과 동일하게 맞춤
  // S1: 캠페인요청 단계 전체
  var s1cnt = camps.filter(function(c){ return c.stage==='1.캠페인요청'; }).length;
  // S2: 2단계 캠페인확정 화면 = 1.캠페인요청 + 2.캠페인확정
  var s2cnt = camps.filter(function(c){ return c.stage==='1.캠페인요청'||c.stage==='2.캠페인확정'; }).length;
  // S3: renderS3 target = 2.캠페인확정 OR 3.상품정보등록
  var s3cnt = camps.filter(function(c){
    return c.stage==='2.캠페인확정' || c.stage==='3.상품정보등록';
  }).length;
  // S4: renderS4 target = 3.상품정보등록
  var s4cnt = camps.filter(function(c){ return c.stage==='3.상품정보등록'; }).length;
  // S5: renderS5 target = 5.인플루언서확정
  var s5cnt = camps.filter(function(c){ return c.stage==='5.인플루언서확정'; }).length;
  // S6: renderS6 target = 6.APP마케팅확정 && APP채널 미설정
  var s6cnt = camps.filter(function(c){
    if(c.stage !== '6.APP마케팅확정') return false;
    var ch = c.appMkt && c.appMkt.channels || [];
    if(Array.isArray(ch)) return ch.length === 0;
    return Object.keys(ch).length === 0;
  }).length;
  // S7: 정산 처리 필요 = 6.APP마케팅확정 + 7.정산(미완료)
  var s7cnt = camps.filter(function(c){ return c.stage==='6.APP마케팅확정' || (c.stage==='7.정산' && !c.settleDone && c.stage!=='7.정산완료'); }).length;
  // 전체캠페인 뱃지: 모드에 따라 필터 (M라이브 모드면 M라이브만, 인플모드면 인플만)
  var campTotalFiltered = camps.filter(function(c){
    var ct = c.campType||'인플루언서';
    return _dashMode==='mlive' ? ct==='모바일라이브' : ct!=='모바일라이브';
  }).length;

  function setBadge(id, n){ var el=document.getElementById(id); if(el) el.textContent=n||0; }
  setBadge('b-camp', campTotalFiltered);
  setBadge('b-s2', s2cnt);
  setBadge('b-s3', s3cnt);
  setBadge('b-s4', s4cnt);
  setBadge('b-s5', s5cnt);
  setBadge('b-s6', s6cnt);
  setBadge('b-s7', s7cnt);

  // M-live 사이드바 뱃지
  var mlCamps = allValid.filter(function(c){ return (c.campType||'')==='모바일라이브'; });
  setBadge('b-ml-s1', mlCamps.filter(function(c){ return c.stage==='1.캠페인요청'; }).length);
  setBadge('b-ml-s2', mlCamps.filter(function(c){ return c.stage==='1.캠페인요청'||c.stage==='2.캠페인확정'; }).length);
  setBadge('b-ml-s3', mlCamps.filter(function(c){ return c.stage==='2.캠페인확정'||c.stage==='3.상품정보등록'; }).length);
  setBadge('b-ml-s6', mlCamps.filter(function(c){ return c.stage==='6.APP마케팅확정'&&(!c.appMkt||!(c.appMkt.channels||[]).length); }).length);
  setBadge('b-ml-s7', mlCamps.filter(function(c){ return c.stage==='6.APP마케팅확정'||(c.stage==='7.정산'&&!c.settleDone); }).length);
}
function openMo(t){
  var el=document.getElementById('mo-'+t); if(!el) return;
    if(t==='campaign'){
    // 담당자 드롭다운 갱신
    var cOwnerSel = document.getElementById('c-owner');
    if(cOwnerSel && cOwnerSel.tagName==='SELECT') cOwnerSel.innerHTML = buildManagerOptions('');
    document.getElementById('c-prod').innerHTML=DB.campaigns
      .map(c=>`<option value="${c.id}">${c.name}${c.role?' ['+c.role+']':''}</option>`).join('');
    document.getElementById('c-edit-id').value='';
    document.getElementById('camp-mo-title').textContent='캠페인 확정 (2단계)';
    document.getElementById('camp-save-btn').textContent='확정 저장';
    ['c-promo','c-gift','c-owner','c-desc','c-tags'].forEach(id=>{
      var el=document.getElementById(id); if(el) el.value='';
    });
    ['c-reason-target','c-reason-new','c-reason-encore'].forEach(id=>{
      var el=document.getElementById(id); if(el) el.checked=false;
    });
    var firstCamp=DB.campaigns[0];
    var rd=document.getElementById('c-role-display');
    if(rd) rd.textContent=firstCamp?.role||'(미지정)';
  }
  if(t==='product'){
    // p-edit-id는 여기서 건드리지 않음 — 호출하는 쪽(openNewProd/editProd)에서 세팅
    // sku-list 초기화도 openNewProd/editProd에서 직접 처리 (addSkuRow 중복 방지)
    var skuListEl = document.getElementById('sku-list');
    if(skuListEl){ skuListEl.innerHTML=''; }
  }
  if(t==='matching'){
    document.getElementById('mc-camp').innerHTML=DB.campaigns.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('mc-inf').innerHTML=DB.influencers.map(i=>`<option value="${i.id}">${i.name} (${i.handle})</option>`).join('');
    document.getElementById('mc-prod').innerHTML=DB.products.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  }
  if(t==='appmarketing') document.getElementById('app-camp').innerHTML=DB.campaigns.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  if(t==='settlement'){
    var settCamps = DB.campaigns.filter(function(cc){ return cc.appMkt && cc.appMkt.landingUrl; });
    document.getElementById('st-camp').innerHTML=settCamps.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('st-inf').innerHTML=DB.influencers.map(i=>`<option value="${i.id}">${i.name}</option>`).join('');
  }
  el.classList.add('open');
  // 모바일: main 영역이 보이도록 + 모달 body 스크롤 보장
  if(window.innerWidth <= 768){
    // 모달은 fixed이므로 main 표시 여부와 무관하게 표시되나
    // main이 transform:translateX(100%)이면 z-index 계층 문제 발생 → 강제로 콘텐츠 화면 오픈
    var main = document.querySelector('.main');
    if(main && !main.classList.contains('mob-content-open')){
      main.classList.add('mob-content-open');
      var back = document.getElementById('mob-back-btn');
      if(back) back.style.display = 'flex';
    }
    var moBody = el.querySelector('.mo-body');
    if(moBody){
      moBody.style.overflowY = 'auto';
      moBody.style.webkitOverflowScrolling = 'touch';
      moBody.style.flex = '1';
      moBody.style.minHeight = '0';
    }
    document.body.style.overflow = 'hidden';
  }
}
function closeMo(t){
  document.getElementById('mo-'+t)?.classList.remove('open');
  if(!document.querySelector('.mo.open') && window.innerWidth <= 768){
    document.body.style.overflow = '';
  }
}

function renderAllPages(){
  renderS1(); renderS2(); renderS3(); renderS4(); renderS5(); renderS6(); renderS7();
  renderCamps(); renderReports(); renderDash(); updateBadges();
  if(_dashMode==='mlive') renderMliveDash();
}
function openQuick(){ openMo('quick'); }
// 팝업 외부클릭 닫힘 비활성화 - 닫기/취소 버튼으로만 닫힘

let toastTimer;
function showToast(msg){
  var t=document.getElementById('toast');
  t.innerHTML=`<span class="sync-dot"></span>${msg}`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),2800);
}


// ═══════════════════════════════════════
// "내 캠페인만" 필터 헬퍼
// ═══════════════════════════════════════
function isMyOnlyFilter(page){
  var ck = document.getElementById('my-only-'+page);
  return ck && ck.checked;
}
// 캠페인이 현재 로그인 사용자의 담당인지 확인
// pdSingle(캠페인담당) 또는 owner(담당MD) 중 하나라도 일치하면 true
function isMycamp(c){
  var pd = (c.pdSingle||(c.pds&&c.pds[0])||'').trim();
  var owner = (c.owner||'').trim();
  return pd === ME || owner === ME;
}
// 현재 대시보드 모드에 따른 캠페인 유형 필터
// 캠페인 코드 표시 (M-live=편성코드, inf=캠페인코드)
function displayCampCode(c){
  if((c.campType||'')==='모바일라이브') return (c.appMkt&&c.appMkt.liveCode)||'-';
  return c.campCode||'-';
}
// M-live 방송일시 포맷: 2026/4/13 20시
// AI챗봇 섹션 표시/숨김 (재방=다시보는 + 모바일라이브일 때만)
function updateAiChatSection(){
  var wrap = document.getElementById('sec-aichat-wrap');
  if(!wrap) return;
  var isMlive = getCampType()==='모바일라이브';
  var name = (document.getElementById('p-name')?.value||'');
  var isRebroadcast = name.indexOf('다시보는')>=0;
  wrap.style.display = (isMlive && isRebroadcast) ? '' : 'none';
}
// APP PUSH 랜딩링크 미리보기 + 복사
var PUSH_LANDING_SUFFIX = '?viewType&broadcastId=lkshinsegaelive-2b088e36671d4747a59c2a80a958750f&fc=apppush';
function copyPushLandingLink(){
  var el = document.getElementById('p-push-landing-preview');
  var txt = el ? el.textContent : '';
  if(!txt || txt==='-'){ showToast('복사할 링크가 없습니다.'); return; }
  navigator.clipboard.writeText(txt).then(function(){ showToast('랜딩링크가 복사되었습니다.'); }).catch(function(){ showToast('복사 실패'); });
}
function updatePushLandingPreview(){
  var base = (document.getElementById('p-push-landing-base')?.value||'').trim();
  var preview = document.getElementById('p-push-landing-preview');
  if(preview) preview.textContent = base ? base + PUSH_LANDING_SUFFIX : '-';
}
// 주차 계산: 월~일 기준, 4월 17일 → "4월 3주차"
function getWeekLabel(c){
  var dt = c.confirmStart||'';
  if(!dt||dt.length<10) return '-';
  var d = new Date(dt);
  if(isNaN(d.getTime())) return '-';
  var month = d.getMonth()+1;
  // 해당 월 1일의 요일 (0=일, 1=월...)
  var firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  var firstMonday = new Date(firstDay);
  var dow = firstDay.getDay(); // 0=일
  // 첫 월요일 찾기
  if(dow===0) firstMonday.setDate(firstDay.getDate()+1);
  else if(dow===1) firstMonday = firstDay;
  else firstMonday.setDate(firstDay.getDate()+(8-dow));
  // 해당 날짜가 첫 월요일 이전이면 1주차
  var dayOfMonth = d.getDate();
  var diff = Math.floor((d - firstMonday)/(86400000));
  var week = diff < 0 ? 1 : Math.floor(diff/7)+1+(firstMonday.getDate()>1?1:0);
  if(week < 1) week = 1;
  return month+'월 '+week+'주차';
}
function fmtBroadcastDt(c){
  var dt = c.confirmStart||'';
  if(!dt||dt.length<10) return '-';
  var d = new Date(dt);
  if(isNaN(d.getTime())) return dt.slice(0,10);
  return d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate()+(dt.length>=16?' '+d.getHours()+'시':'');
}
// 날짜 컬럼 (M-live=방송일시, inf=시작~종료)
function displayDateCol(c){
  if((c.campType||'')==='모바일라이브') return fmtBroadcastDt(c);
  return (c.start||'').slice(5)+'~'+(c.end||'').slice(5);
}
// M-live 전용 행 생성 (각 단계별)
function mliveStageRow(stage, c, rowNum){
  var code = displayCampCode(c);
  var dt = fmtBroadcastDt(c);
  var wk = getWeekLabel(c);
  var md = c.owner||'-';
  var rev = c.revenue?(c.revenue/100000000).toFixed(1)+'억':'-';
  var cat = c.mdcat||(c.skus&&c.skus[0]?c.skus[0].mdcat:'')||c.cat||'-';
  var dealCode = c.dealCode||'-';
  var host = (c.showhosts&&(c.showhosts.conf1||c.showhosts.req1))||'-';
  var reasons = (c.reasons||[]).join(', ')||'-';
  var appCh = c.appMkt&&c.appMkt.channels?c.appMkt.channels.filter(function(x){return x!=='모바일라이브';}).join(', '):'';
  var mktBadge = appCh?'<span style="background:var(--green-bg);color:var(--green);padding:1px 6px;border-radius:10px;font-size:10px;font-weight:700">'+escHtml(appCh)+'</span>':'-';
  var base = '<tr style="cursor:pointer" onclick="editProd('+c.id+')">'
    +'<td style="text-align:center;font-size:11px;font-weight:700;color:var(--text3);width:36px">'+rowNum+'</td>'
    +'<td style="font-size:11px;color:var(--accent2);font-weight:700;white-space:nowrap">'+wk+'</td>'
    +'<td style="font-size:12px;color:var(--text3);white-space:nowrap">'+dt+'</td>'
    +'<td class="mob-hide" style="font-size:11px;font-family:monospace;color:var(--accent2);white-space:nowrap">'+escHtml(code)+'</td>'
    +'<td style="font-weight:600">'+escHtml(c.name)+'</td>';
  if(stage==='s1') return base+'<td>'+escHtml(cat)+'</td><td>'+escHtml(md)+'</td><td style="font-weight:700;color:var(--green)">'+rev+'</td><td><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd('+c.id+')">✏️</button></td></tr>';
  if(stage==='s2') return base+'<td>'+escHtml(md)+'</td><td style="font-size:11px">'+escHtml(reasons)+'</td><td style="font-weight:700;color:var(--green)">'+rev+'</td><td><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd('+c.id+')">✏️</button></td></tr>';
  if(stage==='s3') return base+'<td>'+escHtml(md)+'</td><td style="font-family:monospace;font-size:11px">'+escHtml(dealCode)+'</td><td><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd('+c.id+')">✏️</button></td></tr>';
  if(stage==='s6') return base+'<td>'+escHtml(md)+'</td><td>'+escHtml(host)+'</td><td>'+mktBadge+'</td><td><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editProd('+c.id+')">✏️</button></td></tr>';
  return base+'</tr>';
}
var _mliveHeaders = {
  s1:'<tr><th style="width:36px">#</th><th>주차</th><th>방송일시</th><th>편성코드</th><th>라이브명</th><th>카테고리</th><th>담당MD</th><th>예상매출</th><th></th></tr>',
  s2:'<tr><th style="width:36px">#</th><th>주차</th><th>방송일시</th><th>편성코드</th><th>라이브명</th><th>담당MD</th><th>확정사유</th><th>예상매출</th><th></th></tr>',
  s3:'<tr><th style="width:36px">#</th><th>주차</th><th>방송일시</th><th>편성코드</th><th>라이브명</th><th>담당MD</th><th>딜코드</th><th></th></tr>',
  s6:'<tr><th style="width:36px">#</th><th>주차</th><th>방송일시</th><th>편성코드</th><th>라이브명</th><th>담당MD</th><th>쇼호스트</th><th>모바일마케팅요청</th><th></th></tr>',
};
function matchesDashMode(c){
  if(_dashMode==='mlive') return (c.campType||'')==='모바일라이브';
  return (c.campType||'')!=='모바일라이브'; // inf 모드면 M-live 제외
}
// ═══════════════════════════════════════
// 팝업 섹션별 권한 제어
// ═══════════════════════════════════════
function applyModalPermissions(){
  setTimeout(function(){
    var isMcn = isExtMcn();
    var isView = isViewer();

    // 팝업 내 섹션 요소들
    var priceSec   = document.getElementById('sec-product');
    var priceHd    = priceSec ? priceSec.previousElementSibling : null;
    var appmktSec  = document.getElementById('sec-appmkt');
    var appmktHd   = appmktSec ? appmktSec.previousElementSibling : null;
    var settleSec  = document.getElementById('sec-settle');
    var settleHd   = settleSec ? settleSec.previousElementSibling : null;
    var infSec     = document.getElementById('sec-inf');
    var prodSec    = document.getElementById('sec-product');
    // 섹션 A(기본정보)는 mo-body 첫 번째 자식 div
    var moBody     = document.querySelector('#mo-product .mo-body');
    var basicSec   = moBody ? moBody.querySelector(':scope > div:first-child') : null;

    if(isMcn){
      // 단계 변경 드롭다운 비활성화
      var stgSelMcn=document.getElementById('prod-stage-select');
      if(stgSelMcn) stgSelMcn.disabled=true;
      // external_mcn: 가격정보·APP마케팅·정산정보 섹션 전체 숨김
      if(priceHd)   priceHd.style.display = 'none';
      if(priceSec)  priceSec.style.display = 'none';
      if(appmktHd)  appmktHd.style.display = 'none';
      if(appmktSec) appmktSec.style.display = 'none';
      if(settleHd)  settleHd.style.display = 'none';
      if(settleSec) settleSec.style.display = 'none';
      // 캠페인기본정보·상품정보: 읽기전용 (pointer-events 차단)
      if(basicSec) basicSec.style.pointerEvents = 'none';
      if(prodSec)  prodSec.style.pointerEvents  = 'none';
      // 인플루언서 정보: 수정 가능
      if(infSec) infSec.style.pointerEvents = '';
      // 저장 버튼 레이블 변경
      var saveBtn = document.getElementById('prod-save-btn');
      if(saveBtn) saveBtn.textContent = '인플루언서 정보 저장';
    } else if(isView){
      // viewer: 전체 팝업 읽기전용 + 저장 버튼 숨김
      if(moBody) moBody.style.pointerEvents = 'none';
      var stgSel=document.getElementById('prod-stage-select'); if(stgSel) stgSel.disabled=true;
      var saveBtn2 = document.getElementById('prod-save-btn');
      if(saveBtn2) saveBtn2.style.display = 'none';
    } else {
      // 일반 권한: 모두 복원
      if(basicSec) basicSec.style.pointerEvents = '';
      if(prodSec)  prodSec.style.pointerEvents  = '';
      if(infSec)   infSec.style.pointerEvents   = '';
      if(priceHd)   priceHd.style.display = '';
      if(priceSec)  priceSec.style.display = '';
      if(appmktHd)  appmktHd.style.display = '';
      if(appmktSec) appmktSec.style.display = '';
      if(settleHd)  settleHd.style.display = '';
      if(settleSec) settleSec.style.display = '';
      if(moBody) moBody.style.pointerEvents = '';
      var saveBtn3 = document.getElementById('prod-save-btn');
      if(saveBtn3){ saveBtn3.style.display = ''; saveBtn3.textContent = saveBtn3.getAttribute('data-orig') || '저장'; }
    }
  }, 50);
}



// ═══════════════════════════════════════
// 담당자 목록 관리 (role=manager 사용자만)
// ═══════════════════════════════════════
var MANAGER_USERS = []; // 메모리 캐시 (manager 권한)
var MD_USERS = [];      // 메모리 캐시 (md 권한)
var MDCAT_CODES = [];   // Firebase mdcat-codes 캐시

// Firebase에서 manager/md 역할 사용자 실시간 로드
function initManagerUsers(){
  if(!fbReady) return;
  fbDB.ref('users').on('value', function(snap){
    var data = snap.val();
    var users = data ? Object.values(data) : [];
    MANAGER_USERS = users
      .filter(function(u){ return (u.role === 'manager' || u.role === 'admin') && u.status === 'active'; })
      .sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); });
    MD_USERS = users
      .filter(function(u){ return u.role === 'md' && u.status === 'active'; })
      .sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); });
    refreshManagerDropdowns();
    refreshFilterDropdowns();
  });

  // MDCAT 코드 실시간 로드 (루트 레벨 데이터 자동 마이그레이션 포함)
  fbDB.ref('influencer-hub/mdcat-codes').on('value', function(snap){
    var data = snap.val();
    console.log('[MDCAT] 로드됨, 데이터 수:', data ? Object.keys(data).length : 0);
    if(data && Object.keys(data).length > 0){
      // influencer-hub/mdcat-codes에 데이터 있음
      MDCAT_CODES = Object.values(data)
        .sort(function(a,b){ var oa=a.sortOrder!=null?a.sortOrder:9999, ob=b.sortOrder!=null?b.sortOrder:9999; return oa!==ob?oa-ob:(a.label||a.code||'').localeCompare(b.label||b.code||''); });
      renderMdcatTable();
      mdcatDdRefresh();
    } else {
      // influencer-hub/mdcat-codes 데이터 없음 → 빈 목록으로 처리
      MDCAT_CODES = [];
      renderMdcatTable();
      mdcatDdRefresh();
    }
  });
}


// ── 빈 캠페인 정리 함수 (콘솔에서 cleanEmptyCamps() 실행) ──
window.cleanEmptyCamps = function(){
  if(!fbReady){ console.error('Firebase 미연결'); return; }
  var empty = DB.campaigns.filter(function(c){ return !c.name || !c.name.trim(); });
  console.log('[cleanEmptyCamps] 빈 캠페인 수:', empty.length, empty.map(function(c){return c.id;}));
  if(!empty.length){ alert('빈 캠페인 없음'); return; }
  if(!confirm(empty.length+'개의 빈 캠페인을 삭제합니다. 계속?')) return;
  var promises = empty.map(function(c){
    return fbDB.ref('influencer-hub/campaigns/' + c.id).remove();
  });
  Promise.all(promises)
    .then(function(){
      DB.campaigns = DB.campaigns.filter(function(c){ return c.name && c.name.trim(); });
      renderCamps(); renderS1(); updateBadges();
      alert('빈 캠페인 ' + empty.length + '개 삭제 완료');
    })
    .catch(function(e){ console.error('[cleanEmptyCamps] 실패:', e); });
};

// ── MDCAT 초기화 함수 (콘솔에서 resetMdcat() 실행) ──
window.resetMdcat = function(){
  if(!fbReady){ console.error('Firebase 미연결'); return; }
  if(!confirm('influencer-hub/mdcat-codes를 완전히 삭제하고 초기화합니다. 계속하시겠습니까?')) return;
  fbDB.ref('influencer-hub/mdcat-codes').remove()
    .then(function(){
      MDCAT_CODES = [];
      console.log('[resetMdcat] 초기화 완료. 기본정보 관리에서 MDCAT을 다시 등록하세요.');
      alert('MDCAT 초기화 완료! 기본정보 관리에서 새로 등록하세요.');
    })
    .catch(function(e){ console.error('[resetMdcat] 실패:', e); });
};

// ── 저장 테스트 함수 (콘솔에서 testSave() 로 호출) ──
window.checkStages = function(){
  var stages = {};
  DB.campaigns.forEach(function(c){ stages[c.stage] = (stages[c.stage]||0)+1; });
  console.log('[checkStages]', JSON.stringify(stages));
};
window.testSave = function(){
  console.log('[testSave] fbReady:', fbReady, 'ME:', ME, 'ME_ROLE:', ME_ROLE);
  if(!fbReady){ console.error('[testSave] Firebase 미연결'); return; }
  fbDB.ref('influencer-hub/_test').set({t: Date.now(), by: ME||'test'})
    .then(function(){ console.log('[testSave] 테스트 저장 성공!'); })
    .catch(function(e){ console.error('[testSave] 테스트 저장 실패:', e.code, e.message); });
};
// 캠페인 저장 직접 테스트
window.testCampSave = function(campId){
  var id = campId || (DB.campaigns[0] && DB.campaigns[0].id);
  var camp = DB.campaigns.find(function(c){ return c.id === id; });
  if(!camp){ console.error('[testCampSave] 캠페인 없음, id:', id); return; }
  console.log('[testCampSave] 저장 시도:', id, camp.name);
  var cleanCamp;
  try { cleanCamp = JSON.parse(JSON.stringify(camp)); } catch(e){ cleanCamp = camp; }
  fbDB.ref('influencer-hub/campaigns/' + id).set(cleanCamp)
    .then(function(){ console.log('[testCampSave] 성공!', id); })
    .catch(function(e){ console.error('[testCampSave] 실패:', e.code, e.message); });
};
// 신규 캠페인 테스트
window.testNewCamp = function(){
  var testId = Date.now();
  var testData = {id: testId, name: '테스트캠페인_'+testId, stage: '1.캠페인요청', revenue: 0, budget: 0};
  console.log('[testNewCamp] 신규 저장 시도:', testId);
  fbDB.ref('influencer-hub/campaigns/' + testId).set(testData)
    .then(function(){ console.log('[testNewCamp] 성공!'); })
    .catch(function(e){ console.error('[testNewCamp] 실패:', e.code, e.message); });
};

// 필터바 담당자/MD 드롭다운 갱신
function buildFilterOptions(users, selected){
  var opts = '<option value="">전체</option>';
  users.forEach(function(u){
    opts += '<option value="'+escHtml(u.name)+'"'+(u.name===selected?' selected':'')+'>'+escHtml(u.name)+'</option>';
  });
  return opts;
}

function refreshFilterDropdowns(){
  // 필터바가 텍스트 input으로 변경됨 — 드롭다운 갱신 불필요
}

// ═══════════════════════════════════════
// 필터 검색 드롭다운 (캠페인담당 / 담당MD)
// ═══════════════════════════════════════
var _fddRole = {}; // key → 'manager' | 'md'
var _fddVal  = {}; // key → 현재 선택값

function _fddUsers(role){
  if(role === 'manager'){
    if(MANAGER_USERS && MANAGER_USERS.length){
      // 객체 배열이면 name 추출, 문자열 배열이면 그대로
      return MANAGER_USERS.map(function(u){ return typeof u==='string'?u:(u.name||''); }).filter(Boolean);
    }
    var set = new Set();
    (DB.campaigns||[]).forEach(function(c){
      var p = c.pdSingle||(c.pds&&c.pds[0])||'';
      if(p) set.add(p);
    });
    return Array.from(set).sort();
  }
  if(role === 'md'){
    if(MD_USERS && MD_USERS.length){
      return MD_USERS.map(function(u){ return typeof u==='string'?u:(u.name||''); }).filter(Boolean);
    }
    var set2 = new Set();
    (DB.campaigns||[]).forEach(function(c){ if(c.owner) set2.add(c.owner); });
    return Array.from(set2).sort();
  }
  return [];
}

function fddOpen(key, role){
  _fddRole[key] = role;
  var list = document.getElementById('fdd-list-'+key);
  if(!list) return;
  // 이미 열려있으면 닫기
  if(list.classList.contains('open')){ fddClose(key); return; }
  // 다른 드롭다운 모두 닫기
  document.querySelectorAll('.fdd-list.open').forEach(function(el){ el.classList.remove('open'); });
  // 검색창 초기화 후 목록 렌더
  var search = document.getElementById('fdd-search-'+key);
  if(search) search.value = '';
  fddRender(key, role, '');
  // position:fixed 좌표 계산
  var inpEl = document.getElementById('fdd-input-'+key) || document.querySelector('[id$="-'+key+'"]');
  var wrapEl = document.getElementById('fdd-wrap-'+key);
  var anchorEl = wrapEl || inpEl;
  if(anchorEl){
    var rect2 = anchorEl.getBoundingClientRect();
    list.style.top   = (rect2.bottom + 3) + 'px';
    list.style.left  = rect2.left + 'px';
    list.style.width = rect2.width + 'px';
  }
  list.classList.add('open');
  if(search) setTimeout(function(){ search.focus(); }, 50);
}

function fddRender(key, role, q){
  var list = document.getElementById('fdd-list-'+key);
  if(!list) return;
  var users = _fddUsers(role);
  var cur   = _fddVal[key] || '';
  var filtered = q ? users.filter(function(u){ return u.toLowerCase().includes(q.toLowerCase()); }) : users;
  var html = '<input class="fdd-search" id="fdd-search-'+key+'" placeholder="검색..." oninput="fddFilter(this,\''+key+'\')">';
  filtered.forEach(function(u){
    var active = u === cur ? ' active' : '';
    html += '<div class="fdd-item'+active+'" onclick="fddPick(\''+key+'\',\''+u.replace(/'/g,"\\'")+'\')">'+ u +'</div>';
  });
  if(!filtered.length) html += '<div class="fdd-item" style="color:var(--text3);cursor:default">검색 결과 없음</div>';
  list.innerHTML = html;
  // 검색창 값 복원
  setTimeout(function(){
    var s = document.getElementById('fdd-search-'+key);
    if(s){ s.value = q; s.focus(); }
  }, 0);
}

function fddFilter(inp, key){
  fddRender(key, _fddRole[key]||'manager', inp.value);
}

function fddPick(key, val){
  _fddVal[key] = val;
  var input = document.getElementById('sf-'+key);
  if(input) input.value = val || '';
  fddClose(key);
  // 해당 페이지 재렌더
  var pg = key.replace(/-owner|-md/,'');
  var renderFn = {s1:renderS1,s2:renderS2,s3:renderS3,s4:renderS4,
                  s5:renderS5,s6:renderS6,s7:renderS7,camp:renderCamps}[pg];
  if(renderFn) renderFn();
}

function fddClose(key){
  var list = document.getElementById('fdd-list-'+key);
  if(list) list.classList.remove('open');
}

function fddKey(e, key){
  if(e.key === 'Escape') fddClose(key);
}

// 외부 클릭 시 드롭다운 닫기
document.addEventListener('click', function(e){
  if(!e.target.closest('.fdd-wrap')){
    document.querySelectorAll('.fdd-list.open').forEach(function(el){ el.classList.remove('open'); });
  }
});

// 캠페인담당(manager+admin) 옵션 HTML

// ═══════════════════════════════════════
// 검색형 드롭다운 (담당MD / 캠페인담당)
// ═══════════════════════════════════════
var _searchSelFocusIdx = {};

function _searchSelUsers(role){
  if(role === 'md') return MD_USERS;
  if(role === 'showhost') return (DB.showhosts||[]).map(function(s){ return {name:s.name, id:s.id}; });
  return MANAGER_USERS;
}

function searchSelOpen(id, role){
  var list = document.getElementById('list-'+id);
  if(!list) return;
  searchSelFilter(id, role);
  list.classList.add('open');
  _searchSelFocusIdx[id] = -1;
}

function searchSelFilter(id, role){
  var inp  = document.getElementById(id);
  var list = document.getElementById('list-'+id);
  var clr  = document.getElementById('clear-'+id);
  if(!inp||!list) return;
  var q = inp.value.trim().toLowerCase();
  var users = _searchSelUsers(role);
  var filtered = q ? users.filter(function(u){ return (u.name||'').toLowerCase().includes(q); }) : users;
  if(clr) clr.style.display = inp.value ? 'block' : 'none';
  var html = '<div class="search-sel-item" data-val="" onclick="searchSelPick(\'' + id + '\',\'\')">-- 선택 안함 --</div>';
  if(filtered.length === 0){
    html += '<div class="search-sel-item empty-hint">검색 결과 없음</div>';
  } else {
    filtered.forEach(function(u){
      var n = u.name.replace(/'/g,'\\u0027');
      html += '<div class="search-sel-item" data-val="'+escHtml(u.name)+'" onclick="searchSelPick(\'' + id + '\',\''+n+'\')">'+escHtml(u.name)+'</div>';
    });
  }
  list.innerHTML = html;
  list.classList.add('open');
  _searchSelFocusIdx[id] = -1;
}

function searchSelPick(id, val){
  var inp = document.getElementById(id);
  if(inp) inp.value = val || '';
  var clr = document.getElementById('clear-'+id);
  if(clr) clr.style.display = val ? 'block' : 'none';
  var list = document.getElementById('list-'+id);
  if(list) list.classList.remove('open');
}

function searchSelClear(id){
  searchSelPick(id, '');
}

function searchSelKey(e, id){
  var list = document.getElementById('list-'+id);
  if(!list) return;
  var items = Array.from(list.querySelectorAll('.search-sel-item:not(.empty-hint)'));
  if(!items.length) return;
  var idx = _searchSelFocusIdx[id] !== undefined ? _searchSelFocusIdx[id] : -1;
  if(e.key === 'ArrowDown'){
    e.preventDefault();
    idx = Math.min(idx+1, items.length-1);
    _searchSelFocusIdx[id] = idx;
    items.forEach(function(it,i){ it.classList.toggle('focused', i===idx); });
    if(items[idx]) items[idx].scrollIntoView({block:'nearest'});
  } else if(e.key === 'ArrowUp'){
    e.preventDefault();
    idx = Math.max(idx-1, 0);
    _searchSelFocusIdx[id] = idx;
    items.forEach(function(it,i){ it.classList.toggle('focused', i===idx); });
    if(items[idx]) items[idx].scrollIntoView({block:'nearest'});
  } else if(e.key === 'Enter'){
    e.preventDefault();
    if(idx >= 0 && items[idx]) items[idx].click();
  } else if(e.key === 'Escape'){
    if(list) list.classList.remove('open');
  }
}

document.addEventListener('click', function(e){
  document.querySelectorAll('.search-sel-list.open').forEach(function(list){
    var wrap = list.closest('.search-sel-wrap');
    if(wrap && !wrap.contains(e.target)) list.classList.remove('open');
  });
});

function searchSelSetValue(id, val){
  var inp = document.getElementById(id);
  if(inp) inp.value = val || '';
  var clr = document.getElementById('clear-'+id);
  if(clr) clr.style.display = val ? 'block' : 'none';
}

function buildManagerOptions(selected){
  var opts = '<option value="">-- 담당자 선택 --</option>';
  MANAGER_USERS.forEach(function(u){
    opts += '<option value="'+escHtml(u.name)+'"'+(u.name===selected?' selected':'')+'>'+escHtml(u.name)+'</option>';
  });
  return opts;
}

// 담당MD(md) 옵션 HTML
function buildMdOptions(selected){
  var opts = '<option value="">-- MD 선택 --</option>';
  MD_USERS.forEach(function(u){
    opts += '<option value="'+escHtml(u.name)+'"'+(u.name===selected?' selected':'')+'>'+escHtml(u.name)+'</option>';
  });
  return opts;
}

// 모든 담당자 드롭다운 갱신
function refreshManagerDropdowns(){
  // 검색형 드롭다운은 값을 유지하기만 함 (목록은 열 때 동적 생성)
  // c-owner (캠페인확정 모달 - 기존 select 방식 유지)
  var cOwnerSel = document.getElementById('c-owner');
  if(cOwnerSel && cOwnerSel.tagName === 'SELECT'){
    var cur = cOwnerSel.value;
    cOwnerSel.innerHTML = buildManagerOptions(cur);
    if(cur) cOwnerSel.value = cur;
  }
  // p-pd-single, p-owner는 검색형 드롭다운이므로 별도 처리 불필요
}


// ═══════════════════════════════════════
// 기본정보 관리 탭 전환
// ═══════════════════════════════════════
function switchBmTab(tab, el){
  _bmCurrentTab = tab; // 현재 탭 기억
  ['mdcat','users','roles','mcn','showhost'].forEach(function(t){
    var panel = document.getElementById('bm-panel-'+t);
    var tabEl  = document.getElementById('bm-tab-'+t);
    if(panel) panel.style.display = t === tab ? '' : 'none';
    if(tabEl)  tabEl.classList.toggle('active', t === tab);
  });
  var area = document.getElementById('bm-action-area');
  if(area){
    if(tab==='users')  area.innerHTML = '<button class="btn btn-ghost btn-sm" onclick="openUserBulkModal()" style="display:inline-flex;align-items:center;gap:6px"><svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;display:inline-block;vertical-align:middle"><rect width="24" height="24" rx="4" fill="#217346"/><text x="12" y="17" text-anchor="middle" font-size="15" font-weight="900" fill="white" font-family="Arial,sans-serif">X</text></svg> 엑셀 등록</button><button class="btn btn-primary btn-sm" onclick="openAddUserModal()">+ 사용자 추가</button>';
    else if(tab==='mcn')   area.innerHTML = '<button class="btn btn-primary btn-sm" onclick="openAddMcnModal()">+ MCN 업체 추가</button>';
    else if(tab==='mdcat') area.innerHTML = '<button class="btn btn-primary btn-sm" onclick="openAddMdcatModal()">+ MDCAT 추가</button>';
    else if(tab==='roles') area.innerHTML = '<button class="btn btn-primary btn-sm" onclick="openAddRoleModal()">+ 역할 추가</button>';
    else if(tab==='showhost') area.innerHTML = '<button class="btn btn-primary btn-sm" onclick="openAddShowhostModal()">+ 쇼호스트 추가</button>';
    else area.innerHTML = '';
  }
  if(tab==='users') renderUserTable();
  else if(tab==='mcn') renderMcnTable();
  else if(tab==='mdcat') renderMdcatTable();
  else if(tab==='roles'){ renderRoleTable(); loadPermMatrix(); }
  else if(tab==='showhost') renderShowhostTable();
}

var _bmCurrentTab = 'mdcat'; // 현재 열린 탭 기억

function renderBasemgmt(){
  // 현재 탭 유지 (탭이 이미 열려있으면 그 탭 유지, 처음이면 mdcat)
  var tabEl = document.getElementById('bm-tab-' + _bmCurrentTab);
  switchBmTab(_bmCurrentTab, tabEl);
  if(fbReady) syncMdcatFromCampaigns();
}

// ═══════════════════════════════════════
// 쇼호스트 DB 관리
// ═══════════════════════════════════════
function renderShowhostTable(){
  var hosts = (DB.showhosts||[]).slice().sort(function(a,b){
    return (a.createdAt||0) - (b.createdAt||0);
  });
  var cnt = document.getElementById('showhost-count');
  if(cnt) cnt.textContent = hosts.length+'명';
  var tbl = document.getElementById('showhost-tbl');
  if(!tbl) return;
  if(!hosts.length){
    tbl.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text3);font-size:13px">등록된 쇼호스트가 없습니다. [+ 쇼호스트 추가] 버튼으로 추가하세요.</td></tr>';
    return;
  }
  tbl.innerHTML = hosts.map(function(h, i){
    var dateStr = h.createdAt ? new Date(h.createdAt).toLocaleDateString('ko-KR') : '-';
    return '<tr>'
      +'<td style="text-align:center;color:var(--text3)">'+(i+1)+'</td>'
      +'<td style="font-weight:700">'+escHtml(h.name||'-')+'</td>'
      +'<td>'+escHtml(h.company||'-')+'</td>'
      +'<td>'+escHtml(h.phone||'-')+'</td>'
      +'<td>'+escHtml(h.category||'-')+'</td>'
      +'<td style="font-size:11px;color:var(--text3);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escHtml(h.memo||'')+'</td>'
      +'<td style="font-size:11px;color:var(--text3)">'+dateStr+'</td>'
      +'<td style="white-space:nowrap"><button class="btn btn-ghost btn-xs" onclick="editShowhost('+h.id+')">수정</button> <button class="btn btn-danger btn-xs" onclick="delShowhost('+h.id+')">삭제</button></td>'
      +'</tr>';
  }).join('');
}

function openAddShowhostModal(){
  document.getElementById('sh-edit-id').value = '';
  document.getElementById('addshowhost-title').textContent = '+ 쇼호스트 추가';
  ['sh-name','sh-company','sh-phone','sh-category','sh-memo'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
  openMo('addshowhost');
}

function editShowhost(id){
  var h = (DB.showhosts||[]).find(function(x){ return parseInt(x.id)===parseInt(id); });
  if(!h){ showToast('쇼호스트를 찾을 수 없습니다.'); return; }
  document.getElementById('sh-edit-id').value = h.id;
  document.getElementById('addshowhost-title').textContent = '쇼호스트 수정';
  document.getElementById('sh-name').value     = h.name||'';
  document.getElementById('sh-company').value  = h.company||'';
  document.getElementById('sh-phone').value    = h.phone||'';
  document.getElementById('sh-category').value = h.category||'';
  document.getElementById('sh-memo').value     = h.memo||'';
  openMo('addshowhost');
}

function saveShowhost(){
  if(!isAdmin()){ showToast('관리자만 쇼호스트를 관리할 수 있습니다.'); return; }
  var name = (document.getElementById('sh-name')?.value||'').trim();
  if(!name){ showToast('이름을 입력해주세요.'); return; }
  var editId = document.getElementById('sh-edit-id').value;
  var data = {
    name:    name,
    company: (document.getElementById('sh-company')?.value||'').trim(),
    phone:   (document.getElementById('sh-phone')?.value||'').trim(),
    category:(document.getElementById('sh-category')?.value||'').trim(),
    memo:    (document.getElementById('sh-memo')?.value||'').trim(),
  };
  if(!DB.showhosts) DB.showhosts = [];
  if(editId){
    var idx = DB.showhosts.findIndex(function(x){ return parseInt(x.id)===parseInt(editId); });
    if(idx>=0) DB.showhosts[idx] = Object.assign({}, DB.showhosts[idx], data);
  } else {
    var maxId = DB.showhosts.length ? Math.max.apply(null, DB.showhosts.map(function(x){return parseInt(x.id)||0;})) : 0;
    data.id = maxId + 1;
    data.createdAt = Date.now();
    DB.showhosts.push(data);
  }
  if(fbReady) pushToFirebase();
  closeMo('addshowhost');
  renderShowhostTable();
  showToast(editId?'쇼호스트 수정 완료':'쇼호스트 추가 완료');
}

function delShowhost(id){
  if(!isAdmin()){ showToast('관리자만 쇼호스트를 관리할 수 있습니다.'); return; }
  showConfirm('이 쇼호스트를 삭제하시겠습니까?', function(){
    DB.showhosts = (DB.showhosts||[]).filter(function(x){ return parseInt(x.id)!==parseInt(id); });
    if(fbReady) pushToFirebase();
    renderShowhostTable();
    showToast('삭제됨');
  });
}

// ═══════════════════════════════════════
// MDCAT 코드 관리
// ═══════════════════════════════════════
function syncMdcatFromCampaigns(){
  if(!fbReady) return;
  var existing = new Set(MDCAT_CODES.map(function(m){ return m.label||m.code||''; }));
  var fromCamps = new Set();
  (DB.campaigns||[]).forEach(function(c){
    if(c.mdcat && c.mdcat.trim()) fromCamps.add(c.mdcat.trim());
    (c.skus||[]).forEach(function(s){ if(s.mdcat && s.mdcat.trim()) fromCamps.add(s.mdcat.trim()); });
  });
  fromCamps.forEach(function(code){
    if(!existing.has(code)){
      var id = 'mdcat_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
      fbDB.ref('influencer-hub/mdcat-codes/'+id).set({ id:id, code:code, label:code, desc:'', status:'active', createdAt:new Date().toISOString() });
    }
  });
}

function renderMdcatTable(){
  var tbl = document.getElementById('mdcat-tbl'); if(!tbl) return;
  if(!MDCAT_CODES.length){
    tbl.innerHTML = '<tr><td colspan="7" class="empty" style="padding:24px;text-align:center;color:var(--text3)">등록된 MDCAT 코드가 없습니다</td></tr>';
    return;
  }
  tbl.innerHTML = MDCAT_CODES.map(function(m, i){
    var statusBg  = m.status==='active' ? 'var(--green-bg)'  : 'var(--bg3)';
    var statusCol = m.status==='active' ? 'var(--green)'     : 'var(--text3)';
    var isFirst = i === 0, isLast = i === MDCAT_CODES.length - 1;
    var upBtn   = isFirst ? '<span style="display:inline-block;width:18px;height:18px"></span>'
      : '<button onclick="mdcatMoveUp(\''+m.id+'\')" style="background:var(--bg4);border:1px solid var(--border);border-radius:3px;width:18px;height:18px;cursor:pointer;font-size:9px;line-height:1;padding:0;color:var(--text2)" title="위로">▲</button>';
    var dnBtn   = isLast  ? '<span style="display:inline-block;width:18px;height:18px"></span>'
      : '<button onclick="mdcatMoveDown(\''+m.id+'\')" style="background:var(--bg4);border:1px solid var(--border);border-radius:3px;width:18px;height:18px;cursor:pointer;font-size:9px;line-height:1;padding:0;color:var(--text2)" title="아래로">▼</button>';
    return '<tr>'
      +'<td style="text-align:center;white-space:nowrap">'
      +'<span style="display:inline-flex;align-items:center;gap:3px">'
      +'<span style="font-size:11px;font-weight:700;color:var(--text3);min-width:18px;text-align:right">'+(i+1)+'</span>'
      +upBtn+dnBtn
      +'</span></td>'
      +'<td style="font-weight:700">'+escHtml(m.label||m.code||'')+'</td>'
      +'<td style="color:var(--text3);font-size:12px">'+escHtml(m.desc||'-')+'</td>'
      +'<td><span style="background:'+statusBg+';color:'+statusCol+';padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">'+(m.status==='active'?'활성':'비활성')+'</span></td>'
      +'<td style="color:var(--text3);font-size:12px">'+(m.createdAt||'').slice(0,10)+'</td>'
      +'<td><div class="row-acts">'
      +'<button class="btn btn-ghost btn-xs" onclick="openAddMdcatModal(\''+m.id+'\')">수정</button>'
      +'<button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="deleteMdcatCode(\''+m.id+'\')">삭제</button>'
      +'</div></td></tr>';
  }).join('');
}

function openAddMdcatModal(editId){
  var m = editId ? MDCAT_CODES.find(function(x){ return x.id===editId; }) : null;
  var el = document.createElement('div');
  el.id = 'mdcat-modal';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px';
  el.innerHTML = '<div style="background:var(--bg);border-radius:var(--r-lg);padding:24px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">'
    +'<div style="font-size:16px;font-weight:800">'+(m?'MDCAT 수정':'MDCAT 추가')+'</div>'
    +'<button onclick="document.getElementById(\'mdcat-modal\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3)">✕</button></div>'
    +'<div style="display:flex;flex-direction:column;gap:12px">'
    +'<div><label style="font-size:12px;font-weight:600;margin-bottom:4px;display:block">카테고리명 <span style="color:var(--red)">*</span></label>'
    +'<input class="inp" id="mdcat-label-inp" placeholder="예) 뷰티, 식품, IT/가전" value="'+(m?escHtml(m.label||m.code||''):'')+'"></div>'
    +'<div><label style="font-size:12px;font-weight:600;margin-bottom:4px;display:block">설명</label>'
    +'<input class="inp" id="mdcat-desc-inp" placeholder="선택 입력" value="'+(m?escHtml(m.desc||''):'')+'"></div>'
    +'<div><label style="font-size:12px;font-weight:600;margin-bottom:4px;display:block">상태</label>'
    +'<select class="sel" id="mdcat-status-inp">'
    +'<option value="active"'+((!m||m.status==='active')?' selected':'')+'>활성</option>'
    +'<option value="inactive"'+(m&&m.status==='inactive'?' selected':'')+'>비활성</option>'
    +'</select></div>'
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-top:20px;justify-content:flex-end">'
    +'<button class="btn btn-ghost" onclick="document.getElementById(\'mdcat-modal\').remove()">취소</button>'
    +'<button class="btn btn-primary" onclick="saveMdcatCode(\''+(editId||'')+'\')">'+(m?'저장':'추가')+'</button>'
    +'</div></div>';
  document.body.appendChild(el);
  // 외부클릭 닫힘 비활성화
  setTimeout(function(){ document.getElementById('mdcat-label-inp')?.focus(); }, 50);
}

function saveMdcatCode(editId){
  var label  = (document.getElementById('mdcat-label-inp')?.value||'').trim();
  var desc   = (document.getElementById('mdcat-desc-inp')?.value||'').trim();
  var status = document.getElementById('mdcat-status-inp')?.value||'active';
  if(!label){ showToast('카테고리명을 입력해주세요.'); return; }
  // code = label 과 동일하게 저장 (하위 호환 유지)
  var code = label;
  // editId가 빈 문자열이면 신규 → null로 통일
  var isEdit = !!(editId && editId.trim());
  var dup = MDCAT_CODES.find(function(m){
    var mLabel = m.label || m.code || '';
    return mLabel === label && m.id !== (isEdit ? editId : null);
  });
  if(dup){ showToast('이미 존재하는 카테고리명입니다.'); return; }
  var origCreatedAt = isEdit ? (MDCAT_CODES.find(function(m){return m.id===editId;})||{}).createdAt : null;
  var id   = isEdit ? editId : ('mdcat_'+Date.now());
  var data = { id:id, code:code, label:label, desc:desc, status:status, createdAt: origCreatedAt||new Date().toISOString() };
  var btn = document.querySelector('#mdcat-modal .btn-primary');
  if(btn){ btn.disabled = true; btn.textContent = '저장 중...'; }

  // 데모 모드(Firebase 미연결): 로컬 배열에 직접 반영
  if(!fbReady){
    if(isEdit){
      var idx = MDCAT_CODES.findIndex(function(m){ return m.id===editId; });
      if(idx >= 0) MDCAT_CODES[idx] = data; else MDCAT_CODES.push(data);
    } else {
      MDCAT_CODES.push(data);
    }
    MDCAT_CODES.sort(function(a,b){ return (a.label||a.code||'').localeCompare(b.label||b.code||''); });
    renderMdcatTable();
    mdcatDdRefresh();
    showToast('✅ MDCAT '+(isEdit?'수정':'추가')+'됐습니다. (데모 모드 — 새로고침 시 초기화)');
    document.getElementById('mdcat-modal')?.remove();
    return;
  }

  fbDB.ref('influencer-hub/mdcat-codes/'+id).set(data)
    .then(function(){
      showToast('✅ MDCAT '+(isEdit?'수정':'추가')+'됐습니다.');
      document.getElementById('mdcat-modal')?.remove();
    })
    .catch(function(e){
      showToast('저장 실패: '+e.message);
      if(btn){ btn.disabled = false; btn.textContent = isEdit?'저장':'추가'; }
    });
}

function deleteMdcatCode(id){
  var target = MDCAT_CODES.find(function(m){ return m.id === id; });
  var targetLabel = target ? (target.label || target.code || id) : id;

  // ── 커스텀 확인 모달 ──
  var existing = document.getElementById('mdcat-del-confirm');
  if(existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'mdcat-del-confirm';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:19999;display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML =
    '<div style="background:var(--bg2);border-radius:var(--r-lg);padding:28px 28px 22px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.35)">'
    +'<div style="font-size:16px;font-weight:800;margin-bottom:8px;color:var(--red)">⚠️ MDCAT 삭제 확인</div>'
    +'<div style="font-size:13.5px;font-weight:700;margin-bottom:8px">['+escHtml(targetLabel)+']</div>'
    +'<div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:20px">이 MDCAT를 삭제하시겠습니까?<br>해당 MDCAT이 등록된 캠페인은 MDCAT 항목이 <b>공란</b>으로 변경됩니다.</div>'
    +'<div style="display:flex;gap:8px;justify-content:flex-end">'
    +'<button class="btn btn-ghost" onclick="document.getElementById(\'mdcat-del-confirm\').remove()">취소</button>'
    +'<button class="btn btn-danger" id="mdcat-del-confirm-btn">삭제</button>'
    +'</div></div>';
  document.body.appendChild(overlay);
  // 외부클릭 닫힘 비활성화

  document.getElementById('mdcat-del-confirm-btn').onclick = function(){
    overlay.remove();
    _doDeleteMdcatCode(id, targetLabel);
  };
}

function _doDeleteMdcatCode(id, targetLabel){
  // 관련 캠페인 mdcat 공란 처리 (로컬 DB)
  var affected = [];
  DB.campaigns.forEach(function(c){
    if((c.mdcat||'') === targetLabel){ c.mdcat = ''; affected.push(c.id); }
    (c.skus||[]).forEach(function(s){ if((s.mdcat||'') === targetLabel) s.mdcat = ''; });
  });

  // MDCAT_CODES 로컬 배열에서 즉시 제거
  var idx2 = MDCAT_CODES.findIndex(function(m){ return m.id === id; });
  if(idx2 >= 0) MDCAT_CODES.splice(idx2, 1);
  renderMdcatTable();
  mdcatDdRefresh();

  // 데모 모드
  if(!fbReady){
    renderAllPages();
    showToast('삭제됐습니다.' + (affected.length ? ' (캠페인 ' + affected.length + '개 MDCAT 공란 처리)' : ''));
    return;
  }

  // Firebase 삭제 (pushPath 방식으로 통일)
  if(fbReady){
    fbDB.ref('influencer-hub/mdcat-codes/'+id).remove()
      .then(function(){
        // 영향받은 캠페인 mdcat 공란 처리
        if(affected.length){
          affected.forEach(function(cid){
            pushPath('campaigns/'+cid+'/mdcat', null);
          });
        }
        renderAllPages();
        var msg = '삭제됐습니다.' + (affected.length ? ' (캠페인 '+affected.length+'개 MDCAT 공란 처리)' : '');
        showToast(msg);
      })
      .catch(function(e){
        console.error('[deleteMdcat] 실패 코드:', e.code, '메시지:', e.message);
        showToast('삭제 실패: '+e.code+' - '+e.message);
      });
  } else {
    renderAllPages();
    showToast('삭제됐습니다.' + (affected.length ? ' (캠페인 '+affected.length+'개 MDCAT 공란 처리)' : ''));
  }
}

function _mdcatSaveOrder(){
  // MDCAT_CODES 배열 현재 순서대로 sortOrder 부여 후 Firebase 저장
  if(!fbReady){
    renderMdcatTable();
    mdcatDdRefresh();
    return;
  }
  var update = {};
  MDCAT_CODES.forEach(function(m, i){
    m.sortOrder = i;
    update['influencer-hub/mdcat-codes/'+m.id+'/sortOrder'] = i;
  });
  fbDB.ref('/').update(update)
    .then(function(){ renderMdcatTable(); mdcatDdRefresh(); })
    .catch(function(e){ showToast('순서 저장 실패: '+e.message); });
}

function mdcatMoveUp(id){
  var idx = MDCAT_CODES.findIndex(function(m){ return m.id===id; });
  if(idx <= 0) return;
  var tmp = MDCAT_CODES[idx-1];
  MDCAT_CODES[idx-1] = MDCAT_CODES[idx];
  MDCAT_CODES[idx]   = tmp;
  _mdcatSaveOrder();
}

function mdcatMoveDown(id){
  var idx = MDCAT_CODES.findIndex(function(m){ return m.id===id; });
  if(idx < 0 || idx >= MDCAT_CODES.length-1) return;
  var tmp = MDCAT_CODES[idx+1];
  MDCAT_CODES[idx+1] = MDCAT_CODES[idx];
  MDCAT_CODES[idx]   = tmp;
  _mdcatSaveOrder();
}


// ── MDCAT 드롭다운 (캠페인 팝업 p-mdcat 필드) ──
function mdcatDdOpen(){
  var list = document.getElementById('fdd-list-p-mdcat'); if(!list) return;
  console.log('[mdcatDdOpen] list found, adding open class');
  document.querySelectorAll('.fdd-list.open').forEach(function(el){ el.classList.remove('open'); });
  mdcatDdRender('');
  // position:fixed 좌표 계산
  var inp = document.getElementById('p-mdcat');
  if(inp){
    var rect = inp.getBoundingClientRect();
    list.style.top  = (rect.bottom + 3) + 'px';
    list.style.left = rect.left + 'px';
    list.style.width = rect.width + 'px';
  }
  list.classList.add('open');
  console.log('[mdcatDdOpen] open class added, top:', list.style.top);
  setTimeout(function(){ document.getElementById('fdd-search-p-mdcat')?.focus(); }, 50);
}
function mdcatDdClose(){
  var list = document.getElementById('fdd-list-p-mdcat'); if(list) list.classList.remove('open');
}
function mdcatDdFilter(q){ mdcatDdRender(q); }
function mdcatDdRender(q){
  var list = document.getElementById('fdd-list-p-mdcat'); if(!list) return;
  var cur  = document.getElementById('p-mdcat')?.value||'';
  console.log('[mdcatDdRender] MDCAT_CODES.length:', MDCAT_CODES.length);
  var codes = MDCAT_CODES.filter(function(m){ return !m.status || m.status==='active'; });
  if(q) codes = codes.filter(function(m){
    var lbl = m.label||m.code||'';
    return lbl.toLowerCase().includes(q.toLowerCase());
  });
  var html = '<input class="fdd-search" id="fdd-search-p-mdcat" placeholder="MDCAT 검색..." oninput="mdcatDdFilter(this.value)">';
  // 선택 안함 항목 제거
  codes.forEach(function(m){
    var lbl = m.label || m.code || '';
    var val = m.label || m.code || '';
    html += '<div class="fdd-item'+(val===cur?' active':'')+'" onclick="mdcatDdPick(\''+val.replace(/'/g,"\\'")+'\')">'
      + escHtml(lbl)
      +'</div>';
  });
  if(!codes.length) html += '<div class="fdd-item" style="color:var(--text3);cursor:default">'+(MDCAT_CODES.length?'검색 결과 없음':'등록된 MDCAT 없음 — 기본정보 관리에서 추가하세요')+'</div>';
  list.innerHTML = html;
  setTimeout(function(){
    var s = document.getElementById('fdd-search-p-mdcat');
    if(s){ s.value = q; s.focus(); }
  }, 0);
}
function mdcatDdPick(code){
  var inp = document.getElementById('p-mdcat');
  if(inp) inp.value = code;
  mdcatDdClose();
}
function mdcatDdRefresh(){
  // MDCAT_CODES 갱신 시 드롭다운이 열려있으면 재렌더
  var list = document.getElementById('fdd-list-p-mdcat');
  if(list && list.classList.contains('open')) mdcatDdRender('');
}

// ═══════════════════════════════════════
// MCN 업체 관리
// ═══════════════════════════════════════

// Firebase에서 MCN 업체 목록 로드 (실시간)
function initMcnCompanies(){
  if(!fbReady) return;
  fbDB.ref('influencer-hub/mcn-companies').on('value', function(snap){
    var data = snap.val();
    MCN_COMPANIES = data ? Object.values(data).sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); }) : [];
    refreshMcnDropdowns();
    // MCN 관리 페이지가 현재 열려있으면 테이블 즉시 갱신
    var mcnPage = document.getElementById('page-mcnmgmt');
    if(mcnPage && mcnPage.classList.contains('active')){
      renderMcnTable();
    }
  });
}

// 모든 MCN 드롭다운 갱신
function refreshMcnDropdowns(){
  // 사용자 관리 모달 드롭다운
  var auSel = document.getElementById('au-mcn-company');
  if(auSel){
    var auVal = auSel.value;
    auSel.innerHTML = '<option value="">-- 업체 선택 --</option>'
      + MCN_COMPANIES.map(function(c){ return '<option value="'+escHtml(c.name)+'"'+(c.name===auVal?' selected':'')+'>'+escHtml(c.name)+'</option>'; }).join('');
  }
  // 인플루언서 블록 드롭다운들 (동적 생성된 것들)
  document.querySelectorAll('[class*="inf-mcn-"]').forEach(function(sel){
    var cur = sel.value;
    sel.innerHTML = '<option value="">-- 업체 선택 --</option>'
      + MCN_COMPANIES.map(function(c){ return '<option value="'+escHtml(c.name)+'"'+(c.name===cur?' selected':'')+'>'+escHtml(c.name)+'</option>'; }).join('');
    if(cur) sel.value = cur;
  });
}

// MCN 옵션 HTML 생성 (인플루언서 블록 초기 렌더용)
function buildMcnOptions(selected){
  return '<option value="">-- 업체 선택 --</option>'
    + MCN_COMPANIES.map(function(c){
        return '<option value="'+escHtml(c.name)+'"'+(c.name===selected?' selected':'')+'>'+escHtml(c.name)+'</option>';
      }).join('');
}

// MCN 업체 관리 페이지 렌더
function renderMcnTable(){
  if(!isAdmin()){ showToast('접근 권한이 없습니다.'); return; }
  var count = MCN_COMPANIES.length;
  var countEl = document.getElementById('mcn-company-count');
  if(countEl) countEl.textContent = '총 '+count+'개';
  var rows = '';
  MCN_COMPANIES.forEach(function(c){
    var createdAt = c.createdAt ? c.createdAt.slice(0,10) : '-';
    rows += '<tr style="cursor:pointer" onclick="editProd('+c.id+')">' 
      +'<td style="font-weight:700">'+escHtml(c.name||'-')+'</td>'
      +'<td style="color:var(--text2)">'+escHtml(c.contact||'-')+'</td>'
      +'<td style="font-size:12.5px;color:var(--text3)">'+escHtml(c.phone||'-')+'</td>'
      +'<td style="font-size:12px;color:var(--text3)">'+(c.email?'<a href="mailto:'+escHtml(c.email)+'" style="color:var(--blue);text-decoration:none" onclick="event.stopPropagation()">'+escHtml(c.email)+'</a>':'-')+'</td>'
      +'<td style="font-size:12px;color:var(--text3)">'+escHtml(c.memo||'-')+'</td>'
      +'<td style="font-size:12px;color:var(--text3)">'+createdAt+'</td>'
      +'<td><div class="row-acts">'
      +'<button class="btn btn-ghost btn-xs" data-mid="'+c.id+'" onclick="openEditMcnModal(Number(this.dataset.mid))">수정</button>'
      +'<button class="btn btn-danger btn-xs" data-mid="'+c.id+'" data-mname="'+escHtml(c.name||'')+'" onclick="deleteMcnCompany(Number(this.dataset.mid),this.dataset.mname)">삭제</button>'
      +'</div></td>'
      +'</tr>';
  });
  var tbl = document.getElementById('mcn-company-tbl');
  if(tbl) tbl.innerHTML = rows || '<tr><td colspan="6" class="empty">등록된 MCN 업체가 없습니다</td></tr>';
}

// MCN 업체 추가 모달 열기
function openAddMcnModal(){
  document.getElementById('addmcn-title').textContent = 'MCN 업체 추가';
  document.getElementById('edit-mcn-id').value = '';
  document.getElementById('mcn-name').value = '';
  document.getElementById('mcn-contact').value = '';
  document.getElementById('mcn-phone').value = '';
  document.getElementById('mcn-email').value = '';
  document.getElementById('mcn-memo').value = '';
  document.getElementById('addmcn-save-btn').textContent = '추가';
  openMo('addmcn');
  setTimeout(function(){ document.getElementById('mcn-name').focus(); }, 100);
}

// MCN 업체 수정 모달 열기
function openEditMcnModal(id){
  var c = MCN_COMPANIES.find(function(x){ return x.id === id; });
  if(!c) return;
  document.getElementById('addmcn-title').textContent = 'MCN 업체 수정';
  document.getElementById('edit-mcn-id').value = id;
  document.getElementById('mcn-name').value = c.name || '';
  document.getElementById('mcn-contact').value = c.contact || '';
  document.getElementById('mcn-phone').value = c.phone || '';
  document.getElementById('mcn-email').value = c.email || '';
  document.getElementById('mcn-memo').value = c.memo || '';
  document.getElementById('addmcn-save-btn').textContent = '저장';
  openMo('addmcn');
}

// MCN 업체 저장 (추가/수정)
function saveMcnCompany(){
  var name = document.getElementById('mcn-name').value.trim();
  var contact = document.getElementById('mcn-contact').value.trim();
  var phone = document.getElementById('mcn-phone').value.trim();
  var email = document.getElementById('mcn-email').value.trim();
  var memo = document.getElementById('mcn-memo').value.trim();
  var editId = document.getElementById('edit-mcn-id').value;
  var saveBtn = document.getElementById('addmcn-save-btn');

  if(!name){ showToast('업체명을 입력하세요.'); document.getElementById('mcn-name').focus(); return; }

  // 중복 체크
  var dup = MCN_COMPANIES.find(function(c){
    return c.name === name && String(c.id) !== String(editId);
  });
  if(dup){ showToast('이미 등록된 업체명입니다.'); return; }

  saveBtn.disabled = true;

  if(!editId){
    // 신규 추가
    var newId = Date.now();
    var newData = { id:newId, name:name, contact:contact, phone:phone, email:email, memo:memo, createdAt:new Date().toISOString() };
    if(fbReady){
      fbDB.ref('influencer-hub/mcn-companies/'+newId).set(newData)
        .then(function(){
          showToast(name+' 업체 추가 완료');
          closeMo('addmcn'); saveBtn.disabled = false;
        })
        .catch(function(e){ showToast('저장 실패: '+e.message); saveBtn.disabled=false; });
    } else {
      // 데모 모드: 로컬 배열에 추가
      MCN_COMPANIES.push(newData);
      showToast(name+' 업체 추가 완료 (데모)');
      closeMo('addmcn'); renderMcnTable(); saveBtn.disabled = false;
    }
  } else {
    // 수정
    var updateData = { id:parseInt(editId)||editId, name:name, contact:contact, phone:phone, email:email, memo:memo };
    if(fbReady){
      fbDB.ref('influencer-hub/mcn-companies/'+editId).update(updateData)
        .then(function(){
          showToast(name+' 수정 완료');
          closeMo('addmcn'); saveBtn.disabled = false;
        })
        .catch(function(e){ showToast('수정 실패: '+e.message); saveBtn.disabled=false; });
    } else {
      // 데모 모드: 로컬 배열 수정
      var idx = MCN_COMPANIES.findIndex(function(c){ return String(c.id)===String(editId); });
      if(idx >= 0) MCN_COMPANIES[idx] = Object.assign(MCN_COMPANIES[idx], updateData);
      showToast(name+' 수정 완료 (데모)');
      closeMo('addmcn'); renderMcnTable(); saveBtn.disabled = false;
    }
  }
}

// MCN 업체 삭제
function deleteMcnCompany(id, name){
  showConfirm('['+name+'] 업체를 삭제하시겠습니까?', function(){
    if(!fbReady){
      // 데모 모드: 로컬 배열에서 제거
      MCN_COMPANIES = MCN_COMPANIES.filter(function(c){ return String(c.id) !== String(id); });
      showToast(name+' 삭제 완료 (데모)');
      renderMcnTable();
      return;
    }
    fbDB.ref('influencer-hub/mcn-companies/'+id).remove()
      .then(function(){ showToast(name+' 삭제 완료'); })
      .catch(function(e){ showToast('삭제 실패: '+e.message); });
  });
}


// ═══════════════════════════════════════
// 권한 매트릭스
function loadPermMatrix(){
  if(fbReady){
    // Firebase에서 로드
    fbDB.ref('influencer-hub/permissions').once('value').then(function(snap){
      var saved = snap.val();
      CURR_PERMS = saved ? saved : JSON.parse(JSON.stringify(DEFAULT_PERMS));
      BUILTIN_ROLES.concat(CUSTOM_ROLES).forEach(function(r){
        if(!CURR_PERMS[r.code]) CURR_PERMS[r.code] = JSON.parse(JSON.stringify(DEFAULT_PERMS[r.code]||{}));
        PERM_ROWS.forEach(function(row){
          if(CURR_PERMS[r.code][row.key] === undefined)
            CURR_PERMS[r.code][row.key] = (DEFAULT_PERMS[r.code]||{})[row.key] || false;
        });
      });
      renderPermMatrix();
    });
  } else {
    // 데모 모드: 기본값으로 렌더
    CURR_PERMS = JSON.parse(JSON.stringify(DEFAULT_PERMS));
    renderPermMatrix();
  }
}

// ═══════════════════════════════════════

// 매트릭스 행 정의: { group, label, key, naRoles }
// naRoles: 해당 역할은 회색(해당없음) 처리
var PERM_ROWS = [
  // ── 화면 접근 ──
  { group:'화면 접근', label:'대시보드',         key:'page_dashboard',   naRoles:[] },
  { group:'화면 접근', label:'1단계 캠페인요청',  key:'page_s1',          naRoles:['external_mcn'] },
  { group:'화면 접근', label:'2단계 캠페인확정',  key:'page_s2',          naRoles:['external_mcn'] },
  { group:'화면 접근', label:'3단계 상품정보등록',key:'page_s3',          naRoles:['external_mcn'] },
  { group:'화면 접근', label:'4단계 MCN요청',    key:'page_s4',          naRoles:['external_mcn'] },
  { group:'화면 접근', label:'5단계 인플루언서확정',key:'page_s5',         naRoles:[] },
  { group:'화면 접근', label:'6단계 APP마케팅',   key:'page_s6',          naRoles:['external_mcn'] },
  { group:'화면 접근', label:'7단계 정산',        key:'page_s7',          naRoles:[] },
  { group:'화면 접근', label:'8단계 성과분석',    key:'page_s8',          naRoles:['external_mcn'] },
  { group:'화면 접근', label:'전체 캠페인',       key:'page_campaigns',   naRoles:['external_mcn'] },
  { group:'화면 접근', label:'인플루언서 DB',     key:'page_influencers', naRoles:['external_mcn'] },
  { group:'화면 접근', label:'사용자 관리',       key:'page_usermgmt',    naRoles:['manager','md','viewer','external_mcn'] },
  { group:'화면 접근', label:'MCN 업체 관리',     key:'page_mcnmgmt',     naRoles:['manager','md','viewer','external_mcn'] },
  // ── 캠페인 데이터 ──
  { group:'캠페인 데이터', label:'캠페인 기본정보 조회', key:'data_camp_read',   naRoles:[] },
  { group:'캠페인 데이터', label:'캠페인 기본정보 저장/수정', key:'data_camp_write', naRoles:['viewer','external_mcn'] },
  { group:'캠페인 데이터', label:'상품/가격 정보 조회',  key:'data_price_read',  naRoles:[] },
  { group:'캠페인 데이터', label:'상품/가격 정보 저장/수정', key:'data_price_write', naRoles:['viewer','external_mcn'] },
  { group:'캠페인 데이터', label:'인플루언서 정보 조회', key:'data_inf_read',    naRoles:[] },
  { group:'캠페인 데이터', label:'인플루언서 정보 저장/수정', key:'data_inf_write', naRoles:['viewer'] },
  { group:'캠페인 데이터', label:'가격정보 조회',        key:'data_pricetbl_read', naRoles:[] },
  { group:'캠페인 데이터', label:'가격정보 외부 공개',   key:'data_pricetbl_ext', naRoles:['manager','md','viewer','admin'] },
  // ── APP 마케팅 ──
  { group:'APP 마케팅', label:'APP 마케팅 조회',  key:'appmkt_read',  naRoles:['external_mcn'] },
  { group:'APP 마케팅', label:'APP 마케팅 저장/수정', key:'appmkt_write', naRoles:['viewer','external_mcn'] },
  // ── 정산 ──
  { group:'정산', label:'정산 정보 조회',      key:'settle_read',  naRoles:['external_mcn'] },
  { group:'정산', label:'정산 정보 저장/수정', key:'settle_write', naRoles:['viewer','external_mcn'] },
  // ── 관리 ──
  { group:'관리', label:'캠페인 삭제',   key:'mgmt_delete',   naRoles:['manager','md','viewer','external_mcn'] },
  { group:'관리', label:'사용자 관리',   key:'mgmt_users',    naRoles:['manager','md','viewer','external_mcn'] },
];

// 역할 컬럼 정의
var PERM_ROLES = [
  { code:'admin',        label:'admin\n전체관리자' },
  { code:'manager',      label:'manager\n내부담당자' },
  { code:'md',           label:'md\n내부MD' },
  { code:'viewer',       label:'viewer\n조회자' },
  { code:'external_mcn', label:'external_mcn\n외부MCN' },
];

// 기본 권한값 (true=허용, false=불가)
var DEFAULT_PERMS = {
  admin:        { page_dashboard:true,page_s1:true,page_s2:true,page_s3:true,page_s4:true,page_s5:true,page_s6:true,page_s7:true,page_s8:true,page_s7:true,page_campaigns:true,page_influencers:true,page_usermgmt:true,page_mcnmgmt:true,data_camp_read:true,data_camp_write:true,data_price_read:true,data_price_write:true,data_inf_read:true,data_inf_write:true,data_pricetbl_read:true,data_pricetbl_ext:false,appmkt_read:true,appmkt_write:true,settle_read:true,settle_write:true,mgmt_delete:true,mgmt_users:true },
  manager:      { page_dashboard:true,page_s1:true,page_s2:true,page_s3:true,page_s4:true,page_s5:true,page_s6:true,page_s7:true,page_s8:true,page_s7:true,page_campaigns:true,page_influencers:true,page_usermgmt:false,page_mcnmgmt:false,data_camp_read:true,data_camp_write:true,data_price_read:true,data_price_write:true,data_inf_read:true,data_inf_write:true,data_pricetbl_read:true,data_pricetbl_ext:false,appmkt_read:true,appmkt_write:true,settle_read:true,settle_write:true,mgmt_delete:false,mgmt_users:false },
  md:           { page_dashboard:true,page_s1:true,page_s2:true,page_s3:true,page_s4:true,page_s5:true,page_s6:true,page_s7:true,page_s8:true,page_s7:true,page_campaigns:true,page_influencers:true,page_usermgmt:false,page_mcnmgmt:false,data_camp_read:true,data_camp_write:true,data_price_read:true,data_price_write:true,data_inf_read:true,data_inf_write:true,data_pricetbl_read:true,data_pricetbl_ext:false,appmkt_read:true,appmkt_write:true,settle_read:true,settle_write:true,mgmt_delete:false,mgmt_users:false },
  viewer:       { page_dashboard:true,page_s1:true,page_s2:true,page_s3:true,page_s4:true,page_s5:true,page_s6:true,page_s7:true,page_s8:true,page_s7:true,page_campaigns:true,page_influencers:true,page_usermgmt:false,page_mcnmgmt:false,data_camp_read:true,data_camp_write:false,data_price_read:true,data_price_write:false,data_inf_read:true,data_inf_write:false,data_pricetbl_read:true,data_pricetbl_ext:false,appmkt_read:true,appmkt_write:false,settle_read:true,settle_write:false,mgmt_delete:false,mgmt_users:false },
  external_mcn: { page_dashboard:true,page_s1:false,page_s2:false,page_s3:false,page_s4:true,page_s5:false,page_s6:true,page_s7:false,page_campaigns:false,page_influencers:false,page_usermgmt:false,page_mcnmgmt:false,data_camp_read:true,data_camp_write:false,data_price_read:false,data_price_write:false,data_inf_read:true,data_inf_write:true,data_pricetbl_read:false,data_pricetbl_ext:true,appmkt_read:false,appmkt_write:false,settle_read:true,settle_write:false,mgmt_delete:false,mgmt_users:false },
};

// 현재 편집중인 권한 상태 (메모리)
var CURR_PERMS = {};

function initPermMatrix(){
  // Firebase에서 저장된 권한 로드, 없으면 기본값 사용
  if(!fbReady){ CURR_PERMS = JSON.parse(JSON.stringify(DEFAULT_PERMS)); renderPermMatrix(); return; }
  fbDB.ref('influencer-hub/permissions').once('value').then(function(snap){
    var saved = snap.val();
    CURR_PERMS = saved ? saved : JSON.parse(JSON.stringify(DEFAULT_PERMS));
    // 누락된 역할/키 기본값으로 보완
    PERM_ROLES.forEach(function(r){
      if(!CURR_PERMS[r.code]) CURR_PERMS[r.code] = JSON.parse(JSON.stringify(DEFAULT_PERMS[r.code]||{}));
      PERM_ROWS.forEach(function(row){
        if(CURR_PERMS[r.code][row.key] === undefined)
          CURR_PERMS[r.code][row.key] = (DEFAULT_PERMS[r.code]||{})[row.key] || false;
      });
    });
    renderPermMatrix();
  });
}

function renderPermMatrix(){
  var head = document.getElementById('perm-matrix-head');
  var body = document.getElementById('perm-matrix-body');
  if(!head||!body) return;

  // 헤더
  var thHtml = '<tr><th class="perm-hd" style="text-align:left;min-width:140px">항목</th>';
  PERM_ROLES.forEach(function(r){
    var parts = r.label.split('\n');
    thHtml += '<th class="perm-hd" style="min-width:80px">'
      + '<div style="font-size:12px;font-weight:800;color:var(--accent2)">'+parts[0]+'</div>'
      + '<div style="font-size:10px;font-weight:400;color:var(--text3);margin-top:2px">'+parts[1]+'</div>'
      + '</th>';
  });
  thHtml += '</tr>';
  head.innerHTML = thHtml;

  // 바디
  var bodyHtml = '';
  var lastGroup = '';
  PERM_ROWS.forEach(function(row, ri){
    // 그룹 헤더
    if(row.group !== lastGroup){
      bodyHtml += '<tr class="perm-group-hd"><td colspan="'+(PERM_ROLES.length+1)+'" style="padding:7px 12px">'
        +'<span style="font-size:12px">'+row.group+'</span></td></tr>';
      lastGroup = row.group;
    }
    bodyHtml += '<tr>';
    bodyHtml += '<td class="perm-row-hd" style="border-bottom:1px solid var(--border)">'+row.label+'</td>';
    PERM_ROLES.forEach(function(r){
      var isNa = row.naRoles.includes(r.code);
      if(isNa){
        bodyHtml += '<td class="perm-cell" style="border-bottom:1px solid var(--border)">'
          +'<span class="perm-btn perm-na" title="해당없음">—</span></td>';
      } else {
        var val = (CURR_PERMS[r.code]||{})[row.key];
        var on = val === true;
        bodyHtml += '<td class="perm-cell" style="border-bottom:1px solid var(--border)"'
          +' onclick="togglePerm(\''+r.code+'\',\''+row.key+'\')" title="클릭하여 전환">'
          +'<button class="perm-btn '+(on?'perm-on':'perm-off')+'" id="pm-'+r.code+'-'+row.key+'">'
          +(on?'✓':'✗')+'</button></td>';
      }
    });
    bodyHtml += '</tr>';
  });
  body.innerHTML = bodyHtml;
}

function togglePerm(roleCode, permKey){
  if(!CURR_PERMS[roleCode]) CURR_PERMS[roleCode] = {};
  CURR_PERMS[roleCode][permKey] = !CURR_PERMS[roleCode][permKey];
  // 버튼만 즉시 갱신 (전체 리렌더 없이)
  var btn = document.getElementById('pm-'+roleCode+'-'+permKey);
  if(btn){
    var on = CURR_PERMS[roleCode][permKey];
    btn.className = 'perm-btn ' + (on ? 'perm-on' : 'perm-off');
    btn.textContent = on ? '✓' : '✗';
  }
}

function savePermMatrix(){
  if(!fbReady){
    // 데모 모드: 메모리에만 저장 (새로고침 시 초기화)
    showToast('✅ 권한 설정 변경됨 (데모 모드 — 새로고침 시 초기화)');
    return;
  }
  fbDB.ref('influencer-hub/permissions').set(CURR_PERMS)
    .then(function(){
      showToast('✅ 권한 설정이 저장되었습니다.');
    })
    .catch(function(e){ showToast('저장 실패: '+e.message); });
}

// ═══════════════════════════════════════
// ═══════════════════════════════════════
// ═══════════════════════════════════════
// 캠페인 엑셀 일괄 등록
// ═══════════════════════════════════════
var _campBulkData = [];

function openCampBulkModal(){
  _campBulkData = [];
  document.getElementById('campbulk-preview').style.display = 'none';
  document.getElementById('campbulk-result').style.display  = 'none';
  document.getElementById('campbulk-submit').style.display  = 'none';
  var fi = document.getElementById('campbulk-file'); if(fi) fi.value = '';
  openMo('campbulk');
}

// 정산 엑셀 다운로드 (현재 화면 필터 적용, downloadSettleTemplate과 동일 포맷)
function exportS7ExcelFiltered(camps){
  if(!window.XLSX){ showToast('XLSX 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
  if(!camps || !camps.length){ showToast('다운로드할 캠페인이 없습니다'); return; }
  var hdStyle = {font:{name:'맑은 고딕',sz:9,bold:true,color:{rgb:'FF222222'}},fill:{patternType:'solid',fgColor:{rgb:'FFD9E1F2'}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:{top:{style:'thin',color:{rgb:'FFB0B0B0'}},bottom:{style:'thin',color:{rgb:'FFB0B0B0'}},left:{style:'thin',color:{rgb:'FFB0B0B0'}},right:{style:'thin',color:{rgb:'FFB0B0B0'}}}};
  var _BD7 = {top:{style:'thin',color:{rgb:'FFB0B0B0'}},bottom:{style:'thin',color:{rgb:'FFB0B0B0'}},left:{style:'thin',color:{rgb:'FFB0B0B0'}},right:{style:'thin',color:{rgb:'FFB0B0B0'}}};
  var dtStyle = {font:{name:'맑은 고딕',sz:9},fill:{patternType:'solid',fgColor:{rgb:'FFFFFFFF'}},alignment:{horizontal:'left',vertical:'center'},border:_BD7};
  var nmStyle = Object.assign({},dtStyle,{fill:{patternType:'solid',fgColor:{rgb:'FFFFF2CC'}}});
  var numStyle = {font:{name:'맑은 고딕',sz:9},fill:{patternType:'solid',fgColor:{rgb:'FFFFFFFF'}},alignment:{horizontal:'right',vertical:'center'},border:_BD7,numFmt:'#,##0'};
  var pctStyle = {font:{name:'맑은 고딕',sz:9},fill:{patternType:'solid',fgColor:{rgb:'FFFFFFFF'}},alignment:{horizontal:'right',vertical:'center'},border:_BD7,numFmt:'0.00'};
  var hdrs = ['캠페인코드(KEY)','캠페인명','상품코드','인플루언서','당사유입수','구매자수','구매전환율(%)','신규회원수','공구가(원)','순주문수','순주문 금액(정산기준)','광고수수료(%)','수수료 광고비(부가세포함)','수수료 광고비2(부가세별도)','정액 광고비(부가세별도)','별도 광고비(메타광고)','세금계산서 공급가액(부가세별도)','릴스조회수','릴스댓글','정산일자','이슈 및 결과'];
  var ws = {};
  ws['!cols'] = [{wch:14},{wch:22},{wch:14},{wch:14},{wch:11},{wch:10},{wch:13},{wch:10},{wch:13},{wch:11},{wch:18},{wch:16},{wch:20},{wch:20},{wch:18},{wch:18},{wch:22},{wch:11},{wch:10},{wch:14},{wch:24}];
  var R = 0;
  hdrs.forEach(function(h,ci){ ws[XLSX.utils.encode_cell({r:R,c:ci})] = {v:h,t:'s',s:hdStyle}; });
  // ── 2행: 입력 가이드 (A열 공백 → 업로드 시 자동 스킵)
  R++;
  var guideStyle = {font:{name:'맑은 고딕',sz:8,italic:true,color:{rgb:'FF888888'}},fill:{patternType:'solid',fgColor:{rgb:'FFF2F2F2'}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:{top:{style:'thin',color:{rgb:'FFD9D9D9'}},bottom:{style:'thin',color:{rgb:'FFD9D9D9'}},left:{style:'thin',color:{rgb:'FFD9D9D9'}},right:{style:'thin',color:{rgb:'FFD9D9D9'}}}};
  var _guides = ['','조회용(입력불필요)','상품코드 입력','인플루언서명','건수 입력','건수 입력','자동계산(입력불필요)','건수 입력','원 단위 숫자\n(예: 59000)','건수 입력','자동계산(입력불필요)','% 숫자 입력\n(예: 20 → 20%)\n(0.2입력시 자동변환)','자동계산(입력불필요)','자동계산(입력불필요)','원 단위 직접 입력','원 단위 직접 입력','자동계산(입력불필요)','만 단위 숫자','건수 입력','날짜 형식\n(예: 2026-05-01)','텍스트 입력'];
  _guides.forEach(function(g,ci){ ws[XLSX.utils.encode_cell({r:R,c:ci})] = {v:g,t:'s',s:guideStyle}; });
  ws['!rows'] = [null, {hpt:42}]; // 가이드 행 높이
  camps.forEach(function(c){
    var inf = (c.infData&&c.infData[0])||{};
    var sd = (c.settleData&&c.settleData[0])||{};
    var skuItems = (sd.skuItems&&sd.skuItems.length) ? sd.skuItems
      : (c.skus&&c.skus.length) ? c.skus.map(function(s){ return {skuCode:s.code||''}; })
      : [{skuCode:''}];
    var codeStyle = {font:{name:'맑은 고딕',sz:9,bold:true,color:{rgb:'FF0563C1'}},fill:{patternType:'solid',fgColor:{rgb:'FFFFFFFF'}},alignment:{horizontal:'left',vertical:'center'},border:_BD7};
    // 부동소수점 오차 방지: commFee2/taxSupply는 commFeeVat 기준 재계산
    var _expCF2  = Math.round((sd.commFeeVat||0) / 1.1);
    var _expTax  = _expCF2 + (sd.fixedFee||0) + (sd.metaFee||0);
    skuItems.forEach(function(si, idx){
      R++;
      var convR = si.inflow>0 ? parseFloat((si.netOrders/si.inflow*100).toFixed(2)) : (si.convRate||0);
      var row = [
        {v:c.campCode||'',t:'s',s:codeStyle},
        {v:c.name||'',t:'s',s:nmStyle},
        {v:si.skuCode||'',t:'s',s:dtStyle},
        {v:inf.infName||c.infName||'',t:'s',s:dtStyle},
        {v:si.inflow||0,t:'n',s:numStyle},
        {v:si.buyers||0,t:'n',s:numStyle},
        {v:convR,t:'n',s:pctStyle},
        {v:si.newMembers||0,t:'n',s:numStyle},
        {v:si.dealPrice||0,t:'n',s:numStyle},
        {v:si.netOrders||0,t:'n',s:numStyle},
        {v:si.netAmt||(si.netOrders*si.dealPrice)||0,t:'n',s:numStyle},
        {v:si.adCommRate||0,t:'n',s:pctStyle},
        {v:idx===0?(sd.commFeeVat||0):0,t:'n',s:numStyle},
        {v:idx===0?_expCF2:0,t:'n',s:numStyle},
        {v:idx===0?(sd.fixedFee||0):0,t:'n',s:numStyle},
        {v:idx===0?(sd.metaFee||0):0,t:'n',s:numStyle},
        {v:idx===0?_expTax:0,t:'n',s:numStyle},
        {v:idx===0?(sd.views||0):0,t:'n',s:numStyle},
        {v:idx===0?(sd.comments||0):0,t:'n',s:numStyle},
        {v:idx===0?(sd.settleDate||''):'',t:'s',s:dtStyle},
        {v:idx===0?(sd.issueResult||''):'',t:'s',s:dtStyle}
      ];
      row.forEach(function(cell,ci){ ws[XLSX.utils.encode_cell({r:R,c:ci})] = cell; });
    });
  });
  ws['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(R,2),c:hdrs.length-1}});
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'정산입력');
  XLSX.writeFile(wb,'정산다운로드_'+new Date().toISOString().slice(0,10)+'.xlsx');
}

function downloadSettleTemplate(){
  if(!window.XLSX){ showToast('XLSX 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
  var camps = DB.campaigns.filter(function(c){
    return c.campCode && (c.stage==='7.정산'||c.stage==='7.정산완료'||c.stage==='8.성과분석');
  });
  var hdStyle = {font:{name:'맑은 고딕',sz:9,bold:true,color:{rgb:'FF222222'}},fill:{patternType:'solid',fgColor:{rgb:'FFD9E1F2'}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:{top:{style:'thin',color:{rgb:'FFB0B0B0'}},bottom:{style:'thin',color:{rgb:'FFB0B0B0'}},left:{style:'thin',color:{rgb:'FFB0B0B0'}},right:{style:'thin',color:{rgb:'FFB0B0B0'}}}};
  var _BD7 = {top:{style:'thin',color:{rgb:'FFB0B0B0'}},bottom:{style:'thin',color:{rgb:'FFB0B0B0'}},left:{style:'thin',color:{rgb:'FFB0B0B0'}},right:{style:'thin',color:{rgb:'FFB0B0B0'}}};
  var dtStyle = {font:{name:'맑은 고딕',sz:9},fill:{patternType:'solid',fgColor:{rgb:'FFFFFFFF'}},alignment:{horizontal:'left',vertical:'center'},border:_BD7};
  var nmStyle = Object.assign({},dtStyle,{fill:{patternType:'solid',fgColor:{rgb:'FFFFF2CC'}}});
  var numStyle = {font:{name:'맑은 고딕',sz:9},fill:{patternType:'solid',fgColor:{rgb:'FFFFFFFF'}},alignment:{horizontal:'right',vertical:'center'},border:_BD7,numFmt:'#,##0'};
  var pctStyle = {font:{name:'맑은 고딕',sz:9},fill:{patternType:'solid',fgColor:{rgb:'FFFFFFFF'}},alignment:{horizontal:'right',vertical:'center'},border:_BD7,numFmt:'0.00'};
  var hdrs = ['캠페인코드(KEY)','캠페인명','상품코드','인플루언서','당사유입수','구매자수','구매전환율(%)','신규회원수','공구가(원)','순주문수','순주문 금액(정산기준)','광고수수료(%)','수수료 광고비(부가세포함)','수수료 광고비2(부가세별도)','정액 광고비(부가세별도)','별도 광고비(메타광고)','세금계산서 공급가액(부가세별도)','릴스조회수','릴스댓글','정산일자','이슈 및 결과'];
  var ws = {};
  ws['!cols'] = [{wch:14},{wch:22},{wch:14},{wch:14},{wch:11},{wch:10},{wch:13},{wch:10},{wch:13},{wch:11},{wch:18},{wch:16},{wch:20},{wch:20},{wch:18},{wch:18},{wch:22},{wch:11},{wch:10},{wch:14},{wch:24}];
  var R = 0;
  hdrs.forEach(function(h,ci){ ws[XLSX.utils.encode_cell({r:R,c:ci})] = {v:h,t:'s',s:hdStyle}; });
  // ── 2행: 입력 가이드 (A열 공백 → 업로드 시 자동 스킵)
  R++;
  var guideStyle = {font:{name:'맑은 고딕',sz:8,italic:true,color:{rgb:'FF888888'}},fill:{patternType:'solid',fgColor:{rgb:'FFF2F2F2'}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:{top:{style:'thin',color:{rgb:'FFD9D9D9'}},bottom:{style:'thin',color:{rgb:'FFD9D9D9'}},left:{style:'thin',color:{rgb:'FFD9D9D9'}},right:{style:'thin',color:{rgb:'FFD9D9D9'}}}};
  var _guides = ['','조회용(입력불필요)','상품코드 입력','인플루언서명','건수 입력','건수 입력','자동계산(입력불필요)','건수 입력','원 단위 숫자\n(예: 59000)','건수 입력','자동계산(입력불필요)','% 숫자 입력\n(예: 20 → 20%)\n(0.2입력시 자동변환)','자동계산(입력불필요)','자동계산(입력불필요)','원 단위 직접 입력','원 단위 직접 입력','자동계산(입력불필요)','만 단위 숫자','건수 입력','날짜 형식\n(예: 2026-05-01)','텍스트 입력'];
  _guides.forEach(function(g,ci){ ws[XLSX.utils.encode_cell({r:R,c:ci})] = {v:g,t:'s',s:guideStyle}; });
  ws['!rows'] = [null, {hpt:42}]; // 가이드 행 높이
  camps.forEach(function(c){
    var inf = (c.infData&&c.infData[0])||{};
    var sd = (c.settleData&&c.settleData[0])||{};
    // skuItems 우선, 없으면 c.skus 목록으로 fallback (빈 값)
    var skuItems = (sd.skuItems&&sd.skuItems.length) ? sd.skuItems
      : (c.skus&&c.skus.length) ? c.skus.map(function(s){ return {skuCode:s.code||''}; })
      : [{skuCode:''}];
    var codeStyle = {font:{name:'맑은 고딕',sz:9,bold:true,color:{rgb:'FF0563C1'}},fill:{patternType:'solid',fgColor:{rgb:'FFFFFFFF'}},alignment:{horizontal:'left',vertical:'center'},border:dtStyle.border};
    // 부동소수점 오차 방지: commFee2/taxSupply는 commFeeVat 기준 재계산
    var _expCF2  = Math.round((sd.commFeeVat||0) / 1.1);
    var _expTax  = _expCF2 + (sd.fixedFee||0) + (sd.metaFee||0);
    skuItems.forEach(function(si, idx){
      R++;
      var convR = si.inflow>0 ? parseFloat((si.netOrders/si.inflow*100).toFixed(2)) : (si.convRate||0);
      var row = [
        {v:c.campCode||'',t:'s',s:codeStyle},
        {v:c.name||'',t:'s',s:nmStyle},
        {v:si.skuCode||'',t:'s',s:dtStyle},
        {v:inf.infName||c.infName||'',t:'s',s:dtStyle},
        {v:si.inflow||0,t:'n',s:numStyle},
        {v:si.buyers||0,t:'n',s:numStyle},
        {v:convR,t:'n',s:pctStyle},
        {v:si.newMembers||0,t:'n',s:numStyle},
        {v:si.dealPrice||0,t:'n',s:numStyle},
        {v:si.netOrders||0,t:'n',s:numStyle},
        {v:si.netAmt||(si.netOrders*si.dealPrice)||0,t:'n',s:numStyle},
        {v:si.adCommRate||0,t:'n',s:pctStyle},
        {v:idx===0?(sd.commFeeVat||0):0,t:'n',s:numStyle},
        {v:idx===0?_expCF2:0,t:'n',s:numStyle},
        {v:idx===0?(sd.fixedFee||0):0,t:'n',s:numStyle},
        {v:idx===0?(sd.metaFee||0):0,t:'n',s:numStyle},
        {v:idx===0?_expTax:0,t:'n',s:numStyle},
        {v:idx===0?(sd.views||0):0,t:'n',s:numStyle},
        {v:idx===0?(sd.comments||0):0,t:'n',s:numStyle},
        {v:idx===0?(sd.settleDate||''):'',t:'s',s:dtStyle},
        {v:idx===0?(sd.issueResult||''):'',t:'s',s:dtStyle}
      ];
      row.forEach(function(cell,ci){ ws[XLSX.utils.encode_cell({r:R,c:ci})] = cell; });
    });
  });
  ws['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(R,2),c:hdrs.length-1}});
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'정산입력');
  XLSX.writeFile(wb,'정산업로드양식_'+new Date().toISOString().slice(0,10)+'.xlsx');
}

function importSettleExcel(input){
  if(!input.files||!input.files[0]) return;
  if(!window.XLSX){ showToast('XLSX 라이브러리 로딩 중입니다.'); return; }
  var file = input.files[0];
  input.value='';
  var reader = new FileReader();
  reader.onload = function(e){
    try{
      var wb = XLSX.read(e.target.result,{type:'array'});
      var ws = wb.Sheets[wb.SheetNames[0]];
      var data = XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(!data.length){ showToast('파일이 비어 있습니다.'); return; }
      var hdrRow = -1;
      for(var i=0;i<Math.min(5,data.length);i++){
        var cell = String(data[i][0]||'').trim().replace('(KEY)','').trim();
        if(cell==='캠페인코드'){ hdrRow=i; break; }
      }
      if(hdrRow===-1){ showToast('헤더를 찾을 수 없습니다. 업로드 양식을 사용해주세요.'); return; }
      var hdr = data[hdrRow].map(function(h){ return String(h||'').trim(); });
      function col(name){ return hdr.indexOf(name); }
      var iCode = col('캠페인코드(KEY)'); if(iCode<0) iCode = col('캠페인코드');
      var iSku=col('상품코드'),
          iInflow=col('당사유입수'), iNetOrd=col('순주문수'), iConvRate=col('구매전환율(%)'),
          iBuyers=col('구매자수'), iNewMem=col('신규회원수'),
          iDealPrice=col('공구가(원)'), iNet=col('순주문 금액(정산기준)'),
          iAdComm=col('광고수수료(%)'),
          iCommFee=col('수수료 광고비(부가세포함)'), iCommFee2=col('수수료 광고비2(부가세별도)'),
          iFixedFee=col('정액 광고비(부가세별도)'), iMetaFee=col('별도 광고비(메타광고)'),
          iTaxSupply=col('세금계산서 공급가액(부가세별도)'),
          iView=col('릴스조회수'), iCmt=col('릴스댓글'),
          iSettleDate=col('정산일자'), iIssue=col('이슈 및 결과');
      if(iCode<0){ showToast('캠페인코드 열을 찾을 수 없습니다.'); return; }
      function pInt(v){ var n=parseInt(String(v||'').replace(/,/g,'')); return isNaN(n)?0:n; }
      function pFlt(v){ var n=parseFloat(String(v||'')); return isNaN(n)?0:n; }
      // 캠페인코드별로 skuItems 수집 + 캠페인레벨 필드는 첫 행 기준
      var aggMap = {};
      for(var r=hdrRow+1;r<data.length;r++){
        var row=data[r];
        var code=String(row[iCode]||'').trim();
        if(!code) continue;
        if(!aggMap[code]) aggMap[code]={skuItems:[],commFeeVat:0,commFee2:0,fixedFee:0,metaFee:0,taxSupply:0,views:0,comments:0,settleDate:'',issueResult:''};
        var a=aggMap[code];
        // 상품별 행: skuItems에 push
        var inf0 = iInflow>=0 ? pInt(row[iInflow]) : 0;
        var no0  = iNetOrd>=0 ? pInt(row[iNetOrd]) : 0;
        var cr0  = inf0>0 ? parseFloat((no0/inf0*100).toFixed(2)) : (iConvRate>=0 ? pFlt(row[iConvRate]) : 0);
        var skuItem={
          skuCode:    iSku>=0       ? String(row[iSku]||'').trim() : '',
          inflow:     inf0,
          netOrders:  no0,
          convRate:   cr0,
          buyers:     iBuyers>=0    ? pInt(row[iBuyers])   : 0,
          newMembers: iNewMem>=0    ? pInt(row[iNewMem])   : 0,
          dealPrice:  iDealPrice>=0 ? pInt(row[iDealPrice]): 0,
          netAmt:     iNet>=0       ? pInt(row[iNet])      : 0,
          adCommRate: (function(){ if(iAdComm<0) return 0; var r=pFlt(row[iAdComm]); return (r>0&&r<1)?(Math.round(r*10000)/100):r; })()
        };
        a.skuItems.push(skuItem);
        // 캠페인레벨 필드는 첫 행만 (광고비는 합산)
        if(iCommFee>=0)   a.commFeeVat+=pInt(row[iCommFee]);
        if(iCommFee2>=0)  a.commFee2+=pInt(row[iCommFee2]);
        if(iFixedFee>=0)  a.fixedFee+=pInt(row[iFixedFee]);
        if(iMetaFee>=0)   a.metaFee+=pInt(row[iMetaFee]);
        if(iTaxSupply>=0) a.taxSupply+=pInt(row[iTaxSupply]);
        if(iView>=0)      a.views+=pInt(row[iView]);
        if(iCmt>=0)       a.comments+=pInt(row[iCmt]);
        if(iSettleDate>=0 && !a.settleDate) a.settleDate=String(row[iSettleDate]||'').trim();
        if(iIssue>=0 && !a.issueResult) a.issueResult=String(row[iIssue]||'').trim();
      }
      // 캠페인에 반영
      var updated=0, notFound=[];
      Object.keys(aggMap).forEach(function(code){
        var camp=null;
        for(var ci=0;ci<DB.campaigns.length;ci++){
          if(DB.campaigns[ci].campCode===code){ camp=DB.campaigns[ci]; break; }
        }
        if(!camp){ notFound.push(code); return; }
        if(!camp.settleData||!camp.settleData.length) camp.settleData=[{}];
        var sd=camp.settleData[0], a=aggMap[code];
        sd.skuItems=a.skuItems;
        sd.commFeeVat=a.commFeeVat; sd.commFee2=a.commFee2;
        sd.fixedFee=a.fixedFee; sd.metaFee=a.metaFee; sd.taxSupply=a.taxSupply;
        sd.views=a.views; sd.comments=a.comments;
        if(a.settleDate) sd.settleDate=a.settleDate;
        if(a.issueResult) sd.issueResult=a.issueResult;
        // S7 표시용: skuItems 합산 → settleData + camp 루트 양쪽 모두 업데이트
        var totalNet=0, totalOrd=0;
        a.skuItems.forEach(function(s){ totalNet+=s.netAmt||0; totalOrd+=s.netOrders||0; });
        camp.settleRevenue=totalNet; camp.settleOrders=totalOrd;
        sd.revenue=totalNet; sd.orders=totalOrd;  // 그리드 표시용
        // 상품정보(c.skus) 상품코드 동기화: 엑셀의 상품코드를 c.skus[]에 반영
        if(!camp.skus) camp.skus = [];
        a.skuItems.forEach(function(si, idx){
          if(!si.skuCode) return;
          if(camp.skus[idx]){
            camp.skus[idx].code = si.skuCode;  // 기존 항목 코드 업데이트
          } else {
            camp.skus.push({code: si.skuCode}); // 새 상품 추가
          }
        });
        updated++;
      });
      pushToFirebase();
      renderS7(); renderReports();
      var msg='✅ '+updated+'건 정산 데이터 업데이트 완료';
      if(notFound.length) msg+=' / 미매칭 코드: '+notFound.join(', ');
      showToast(msg);
    }catch(err){ showToast('파일 읽기 오류: '+err.message); }
  };
  reader.readAsArrayBuffer(file);
}

function downloadCampTemplate(){
  var wb = XLSX.utils.book_new();
  var headers = ['캠페인명*','시작일*','종료일*','예상매출*','예산*','역할*','캠페인담당','담당MD','브랜드','협력업체','카테고리','MDCAT','MCN업체','상품코드','상품명','MD할인가','카드할인','신규적립금','신규쿠폰','소구포인트','선정사유(쉼표구분)'];
  var sample  = ['2026 여름 선케어','2026-06-01','2026-07-15','150000000','5000000','미들','홍길동','김민지','선케어랩','(주)선케어랩','뷰티','BEAUTY-01','(주)크리에이터스','SKU-001','UV선크림50ml','89000','5000','3000','2000','워터프루프 SPF50+','브랜드력,가격경쟁력'];
  var ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  ws['!cols'] = headers.map(function(){ return {wch:14}; });
  XLSX.utils.book_append_sheet(wb, ws, '캠페인목록');
  XLSX.writeFile(wb, 'SSGLIVE_캠페인_일괄등록_템플릿.xlsx');
}

function handleCampBulkDrop(e){
  var f = e.dataTransfer.files[0]; if(f) parseCampBulkFile(f);
}
function handleCampBulkSelect(inp){
  var f = inp.files[0]; if(f) parseCampBulkFile(f);
}

function parseCampBulkFile(file){
  var reader = new FileReader();
  reader.onload = function(e){
    try {
      var wb   = XLSX.read(e.target.result, {type:'binary'});
      var ws   = wb.Sheets[wb.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
      var data = rows.slice(1).filter(function(r){ return String(r[0]||'').trim(); });

      _campBulkData = data.map(function(r){
        var name    = String(r[0]||'').trim();
        var start   = _normDate(r[1]);
        var end     = _normDate(r[2]);
        var revenue = _numVal(r[3]);
        var budget  = _numVal(r[4]);
        var role    = String(r[5]||'').trim();
        var pd      = String(r[6]||'').trim();
        var owner   = String(r[7]||'').trim();
        var brand   = String(r[8]||'').trim();
        var company = String(r[9]||'').trim();
        var cat     = String(r[10]||'').trim();
        var mdcat   = String(r[11]||'').trim();
        var mcn     = String(r[12]||'').trim();
        var skuCode = String(r[13]||'').trim();
        var skuName = String(r[14]||'').trim();
        var mdPrice = _numVal(r[15]);
        var card    = _numVal(r[16]);
        var mile    = _numVal(r[17]);
        var cpn     = _numVal(r[18]);
        var appeal  = String(r[19]||'').trim();
        var reasons = String(r[20]||'').split(',').map(function(s){return s.trim();}).filter(Boolean);

        var err = [];
        if(!name)    err.push('캠페인명 없음');
        if(!start)   err.push('시작일 오류');
        if(!end)     err.push('종료일 오류');
        if(!revenue) err.push('예상매출 없음');
        if(!budget)  err.push('예산 없음');
        if(!['메가','앵콜','미들','시딩'].includes(role)) err.push('역할 오류('+role+')');

        var skus = skuCode ? [{
          code: skuCode, productName: skuName, isMain: true,
          mdcat: mdcat, cat: cat, brand: brand,
          price: 0, mdPrice: mdPrice, cardDiscount: card,
          mileage: mile, coupon: cpn,
          finalPrice: mdPrice > 0 ? Math.max(0, mdPrice-card-mile-cpn) : 0
        }] : [];

        return { name, start, end, revenue, budget, role,
          pdSingle: pd, owner, brand, company, cat, mdcat, mcn,
          skus, appeal, reasons, err };
      });

      renderCampBulkPreview();
    } catch(ex){ showToast('파일 읽기 실패: '+ex.message); }
  };
  reader.readAsBinaryString(file);
}

function _normDate(v){
  if(!v) return '';
  var s = String(v).trim().replace(/[./]/g,'-');
  // Excel 날짜 숫자 처리
  if(/^\d{5}$/.test(s)){
    var d = new Date((parseInt(s)-25569)*86400000);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  var m = s.match(/(20\d{2})-?(\d{1,2})-?(\d{1,2})/);
  return m ? m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0') : '';
}
function _numVal(v){
  if(!v) return 0;
  var s = String(v).replace(/,/g,'');
  var a = s.match(/([\d.]+)\s*억/); if(a) return Math.round(parseFloat(a[1])*1e8);
  var w = s.match(/([\d.]+)\s*만/); if(w) return Math.round(parseFloat(w[1])*1e4);
  return parseInt(s.replace(/[^0-9]/g,''))||0;
}

function renderCampBulkPreview(){
  var tbl   = document.getElementById('campbulk-tbl');
  var cnt   = document.getElementById('campbulk-count');
  var prev  = document.getElementById('campbulk-preview');
  var submitBtn = document.getElementById('campbulk-submit');
  var valid = _campBulkData.filter(function(d){ return !d.err.length; }).length;

  cnt.textContent = '총 '+_campBulkData.length+'행 (등록 가능: '+valid+'건)';

  tbl.innerHTML = _campBulkData.map(function(d){
    var hasErr = d.err.length > 0;
    return '<tr style="background:'+(hasErr?'rgba(255,118,117,0.07)':'')+';">'
      +'<td style="padding:6px 10px;font-weight:600">'+(d.name||'-')+'</td>'
      +'<td style="padding:6px 10px;font-size:11.5px;color:var(--text3)">'+(d.start||'?')+' ~ '+(d.end||'?')+'</td>'
      +'<td style="padding:6px 10px;font-size:11.5px">'+(d.revenue?( d.revenue/1e8).toFixed(1)+'억':'-')+'</td>'
      +'<td style="padding:6px 10px"><span style="font-size:11px;background:var(--bg3);padding:2px 7px;border-radius:10px">'+(d.role||'-')+'</span></td>'
      +'<td style="padding:6px 10px;font-size:11.5px;color:var(--text3)">'+(d.brand||'-')+'</td>'
      +'<td style="padding:6px 10px;font-size:11.5px">'+(hasErr
        ? '<span style="color:#e74c3c">⚠️ '+d.err.join(', ')+'</span>'
        : '<span style="color:var(--green)">✓ 정상</span>')+'</td>'
      +'</tr>';
  }).join('');

  prev.style.display = '';
  submitBtn.style.display = valid > 0 ? '' : 'none';
}

function submitCampBulk(){
  if(!fbReady){ showToast('Firebase 연결이 필요합니다.'); return; }
  var btn = document.getElementById('campbulk-submit');
  btn.disabled = true; btn.textContent = '등록 중...';

  var valid = _campBulkData.filter(function(d){ return !d.err.length; });
  var maxId = Math.max(0, ...DB.campaigns.map(function(c){ return c.id||0; }));
  var now   = new Date().toISOString();
  var ok = 0, fail = 0;

  valid.forEach(function(d){
    maxId++;
    var camp = Object.assign({}, d, {
      id: maxId,
      stage: '1.캠페인요청',
      role: d.role,
      pds: d.pdSingle ? [d.pdSingle] : [],
      priceGrid: d.skus,
      infName: '', mcnRequests: [],
      appMkt: {}, settleRevenue: 0, settleDa: 0,
      createdAt: now
    });
    DB.campaigns.push(camp);
    ok++;
  });

  if(ok > 0){
    broadcastData();
    renderPage(document.querySelector('.page.active')?.id?.replace('page-','') || 'dashboard');
    updateBadges();
  }

  var resHtml = '<div style="background:var(--bg3);border-radius:8px;padding:12px;font-size:13px">'
    +'✅ <b>'+ok+'건</b> 등록 완료'
    +(fail>0 ? ' &nbsp; ❌ '+fail+'건 실패' : '')
    +'</div>';
  document.getElementById('campbulk-result').innerHTML = resHtml;
  document.getElementById('campbulk-result').style.display = '';
  btn.disabled = false; btn.textContent = '✅ 등록 완료';
  if(ok > 0) showToast('✅ '+ok+'개 캠페인이 등록됐습니다!');
}

// 사용자 일괄 등록 (엑셀 업로드)
// ═══════════════════════════════════════
var _bulkUsers = []; // 파싱된 사용자 데이터
var BULK_DEFAULT_PW = 'tlstprPfkdlqm';
var VALID_ROLES = ['admin','manager','md','viewer','external_mcn'];

function openUserBulkModal(){
  resetBulkModal();
  openMo('userbulk');
}

function resetBulkModal(){
  _bulkUsers = [];
  var preview = document.getElementById('bulk-preview'); if(preview) preview.style.display='none';
  var result  = document.getElementById('bulk-result');  if(result)  result.style.display='none';
  var submitBtn = document.getElementById('bulk-submit-btn'); if(submitBtn) submitBtn.style.display='none';
  var fi = document.getElementById('bulk-file-input'); if(fi) fi.value='';
  var dz = document.getElementById('bulk-drop-zone');
  if(dz){ dz.style.background=''; dz.style.borderColor=''; }
}

function downloadUserTemplate(){
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.aoa_to_sheet([
    ['이름','이메일','역할','MCN업체명(external_mcn만)'],
    ['홍길동','hong@company.com','manager',''],
    ['김담당','kim@company.com','md',''],
    ['이MCN','lee@agency.com','external_mcn','(주)크리에이터스'],
  ]);
  ws['!cols'] = [{wch:14},{wch:26},{wch:16},{wch:22}];
  XLSX.utils.book_append_sheet(wb, ws, '사용자목록');
  XLSX.writeFile(wb, 'SSGLIVE_사용자_일괄등록_템플릿.xlsx');
}

function handleBulkFileDrop(e){
  var file = e.dataTransfer.files[0];
  if(file) parseBulkFile(file);
}
function handleBulkFileSelect(input){
  var file = input.files[0];
  if(file) parseBulkFile(file);
}

function parseBulkFile(file){
  var reader = new FileReader();
  reader.onload = function(e){
    try {
      var wb = XLSX.read(e.target.result, {type:'binary'});
      var ws = wb.Sheets[wb.SheetNames[0]];
      var rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
      // 1행 스킵 (헤더)
      var dataRows = rows.slice(1).filter(function(r){ return r[1] && String(r[1]).includes('@'); });
      _bulkUsers = dataRows.map(function(r){
        var name  = String(r[0]||'').trim();
        var email = String(r[1]||'').trim().toLowerCase();
        var role  = String(r[2]||'').trim().toLowerCase();
        var mcn   = String(r[3]||'').trim();
        var validRole = VALID_ROLES.includes(role) ? role : 'viewer';
        var err = '';
        if(!name)  err = '이름 없음';
        else if(!email || !email.includes('@')) err = '이메일 오류';
        else if(!VALID_ROLES.includes(role)) err = '역할 오류('+role+')→viewer로 설정';
        return { name, email, role: validRole, mcnCompany: mcn, err };
      });
      renderBulkPreview();
    } catch(ex){
      showToast('파일 읽기 실패: '+ex.message);
    }
  };
  reader.readAsBinaryString(file);
}

function renderBulkPreview(){
  var tbl = document.getElementById('bulk-preview-tbl');
  var cnt = document.getElementById('bulk-preview-count');
  var preview = document.getElementById('bulk-preview');
  var submitBtn = document.getElementById('bulk-submit-btn');
  if(!tbl||!preview) return;

  var validCount = _bulkUsers.filter(function(u){ return !u.err || u.err.includes('→'); }).length;
  cnt.textContent = '총 '+_bulkUsers.length+'명 (등록 가능: '+validCount+'명)';

  var rows = '';
  _bulkUsers.forEach(function(u){
    var hasErr = u.err && !u.err.includes('→');
    var roleCls = 'role-'+u.role;
    rows += '<tr style="background:'+(hasErr?'rgba(255,118,117,0.08)':'')+';">'
      +'<td style="padding:7px 12px;font-weight:600">'+(u.name||'<span style="color:var(--orange)">없음</span>')+'</td>'
      +'<td style="padding:7px 12px;color:var(--text3);font-size:12px">'+u.email+'</td>'
      +'<td style="padding:7px 12px"><span class="role-badge '+roleCls+'">'+u.role+'</span></td>'
      +'<td style="padding:7px 12px;font-size:12px;color:var(--text2)">'+(u.mcnCompany||'-')+'</td>'
      +'<td style="padding:7px 12px;font-size:11.5px">'
      +(hasErr
        ? '<span style="color:#e74c3c">⚠️ '+u.err+'</span>'
        : (u.err ? '<span style="color:var(--orange)">⚠️ '+u.err+'</span>' : '<span style="color:var(--green)">✓ 정상</span>'))
      +'</td>'
      +'</tr>';
  });

  tbl.innerHTML = rows || '<tr><td colspan="5" class="empty">데이터 없음</td></tr>';
  preview.style.display = '';
  submitBtn.style.display = validCount > 0 ? '' : 'none';
}

async function submitBulkUsers(){
  if(!fbReady){ showToast('Firebase 연결이 필요합니다.'); return; }
  var btn = document.getElementById('bulk-submit-btn');
  btn.disabled = true; btn.textContent = '등록 중...';

  var resultEl = document.getElementById('bulk-result');
  resultEl.style.display = '';
  resultEl.innerHTML = '<div style="color:var(--text3);font-size:13px">⏳ 등록 처리 중... 잠시 기다려 주세요.</div>';

  // 기존 이메일 목록 조회
  var existingSnap = await fbDB.ref('users').once('value');
  var existingUsers = existingSnap.val() ? Object.values(existingSnap.val()) : [];
  var existingEmails = existingUsers.map(function(u){ return (u.email||'').toLowerCase(); });

  var validUsers = _bulkUsers.filter(function(u){ return u.name && u.email && u.email.includes('@'); });
  var ok=0, skip=0, fail=0, results=[];

  for(var i=0; i<validUsers.length; i++){
    var u = validUsers[i];
    if(existingEmails.includes(u.email)){
      results.push({name:u.name, email:u.email, status:'skip', msg:'이미 등록된 이메일'});
      skip++; continue;
    }
    try {
      // Firebase Auth에 사용자 생성 (Admin SDK 없이 Secondary App 방식)
      var secondaryApp = null;
      try {
        secondaryApp = firebase.app('bulk-'+Date.now());
      } catch(e) {
        secondaryApp = firebase.initializeApp(firebase.app().options, 'bulk-'+i+'-'+Date.now());
      }
      var userCred = await secondaryApp.auth().createUserWithEmailAndPassword(u.email, BULK_DEFAULT_PW);
      var uid = userCred.user.uid;
      await secondaryApp.auth().signOut();
      try { secondaryApp.delete(); } catch(e2){}

      // Firebase DB에 사용자 정보 저장
      var userData = {
        uid: uid, email: u.email, name: u.name,
        role: u.role, mcnCompany: u.mcnCompany||'',
        status: 'active', createdAt: new Date().toISOString()
      };
      await fbDB.ref('users/'+uid).set(userData);
      results.push({name:u.name, email:u.email, status:'ok', msg:'등록 완료'});
      ok++;
    } catch(e){
      var msg = e.message||'오류';
      if(e.code === 'auth/email-already-in-use') msg = '이미 Auth에 등록된 이메일';
      results.push({name:u.name, email:u.email, status:'fail', msg:msg});
      fail++;
    }
  }

  // 결과 표시
  var resHtml = '<div style="background:var(--bg3);border-radius:10px;padding:14px;margin-top:4px">'
    +'<div style="font-size:13px;font-weight:700;margin-bottom:10px">'
    +'✅ 등록완료: <span style="color:var(--green)">'+ok+'명</span> &nbsp;'
    +'⏭ 건너뜀: <span style="color:var(--text3)">'+skip+'명</span> &nbsp;'
    +'❌ 실패: <span style="color:#e74c3c">'+fail+'명</span>'
    +'</div>'
    +'<div style="max-height:160px;overflow-y:auto">';
  results.forEach(function(r){
    var color = r.status==='ok'?'var(--green)':r.status==='skip'?'var(--text3)':'#e74c3c';
    var ico = r.status==='ok'?'✅':r.status==='skip'?'⏭':'❌';
    resHtml += '<div style="font-size:12px;padding:3px 0;color:'+color+'">'
      +ico+' '+escHtml(r.name)+' ('+escHtml(r.email)+') — '+escHtml(r.msg)+'</div>';
  });
  resHtml += '</div></div>';
  resultEl.innerHTML = resHtml;

  btn.disabled = false; btn.textContent = '✅ 등록 완료';
  if(ok>0){
    showToast('✅ '+ok+'명 등록 완료');
    renderUserTable();
  }
}

// 사용자 관리 탭 전환
// ═══════════════════════════════════════
function switchUmTab(tab, el){
  document.querySelectorAll('#page-usermgmt .tab').forEach(function(t){ t.classList.remove('active'); });
  if(el) el.classList.add('active');
  var panels = ['users','roles'];
  panels.forEach(function(p){
    var panel = document.getElementById('um-panel-'+p);
    if(panel) panel.style.display = p===tab ? '' : 'none';
  });
  var addBtn = document.getElementById('um-action-btns');
  if(addBtn){
    if(tab==='users'){
      addBtn.innerHTML = '<button class="btn btn-primary" onclick="openAddUserModal()">+ 사용자 추가</button>';
    } else {
      addBtn.innerHTML = '<button class="btn btn-primary" onclick="openAddRoleModal()">+ 역할 추가</button>';
    }
  }
  if(tab==='roles'){ renderRoleTable(); initPermMatrix(); }
}

// ═══════════════════════════════════════
// 역할(Role) 관리 — Firebase roles/ 노드
// ═══════════════════════════════════════
var CUSTOM_ROLES = []; // Firebase에서 로드한 커스텀 역할

// 기본 내장 역할 (수정 불가)
var BUILTIN_ROLES = [
  { code:'admin',        label:'전체 관리자',  desc:'사용자 관리 포함 모든 기능 접근', stages:'all',       canEdit:true,  builtin:true },
  { code:'manager',      label:'내부 담당자',  desc:'전체 조회·수정·저장',             stages:'all',       canEdit:true,  builtin:true },
  { code:'md',           label:'내부 MD',      desc:'전체 조회·수정·저장',             stages:'all',       canEdit:true,  builtin:true },
  { code:'viewer',       label:'내부 조회자',  desc:'전체 조회만, 수정 불가',           stages:'all',       canEdit:false, builtin:true },
  { code:'external_mcn', label:'외부 MCN',     desc:'4·6단계, 인플루언서 정보 수정 가능', stages:'s4,s6',     canEdit:true,  builtin:true },
];

function initCustomRoles(){
  if(!fbReady) return;
  fbDB.ref('influencer-hub/roles').on('value', function(snap){
    var data = snap.val();
    CUSTOM_ROLES = data ? Object.values(data) : [];
    // 역할 탭이 열려 있으면 갱신
    var panel = document.getElementById('um-panel-roles');
    if(panel && panel.style.display !== 'none') renderRoleTable();
    // 사용자 추가 모달의 역할 드롭다운도 갱신
    refreshRoleDropdown();
  });
}

function refreshRoleDropdown(){
  var sel = document.getElementById('au-role');
  if(!sel) return;
  var cur = sel.value;
  var allRoles = BUILTIN_ROLES.concat(CUSTOM_ROLES.filter(function(r){ return r.status!=='inactive'; }));
  sel.innerHTML = allRoles.map(function(r){
    var label = r.label || r.code;
    return '<option value="'+escHtml(r.code)+'"'+(r.code===cur?' selected':'')+'>'+escHtml(r.code)+' · '+escHtml(label)+'</option>';
  }).join('');
}

function renderRoleTable(){
  var allRoles = BUILTIN_ROLES.concat(CUSTOM_ROLES);
  var rows = '';
  allRoles.forEach(function(r){
    var stages = r.stages==='all' ? '전체' : (r.stages||'');
    var canEditLabel = r.canEdit ? '<span class="badge bg">허용</span>' : '<span class="badge bk">조회만</span>';
    var statusLabel  = r.status==='inactive' ? '<span class="badge bk">비활성</span>' : '<span class="badge bg">활성</span>';
    var builtinBadge = r.builtin ? '<span style="font-size:10px;background:var(--bg4);color:var(--text3);border-radius:4px;padding:1px 5px;margin-left:4px">내장</span>' : '';
    rows += '<tr>' 
      +'<td style="font-family:monospace;font-size:12.5px;font-weight:700">'+escHtml(r.code)+builtinBadge+'</td>'
      +'<td style="font-weight:600">'+escHtml(r.label||'-')+'</td>'
      +'<td style="font-size:12px;color:var(--text3)">'+escHtml(r.desc||'-')+'</td>'
      +'<td style="font-size:12px;color:var(--text2)">'+escHtml(stages)+'</td>'
      +'<td>'+canEditLabel+'</td>'
      +'<td>'+statusLabel+'</td>'
      +'<td><div class="row-acts">'
      +(r.builtin
        ? '<span style="font-size:11px;color:var(--text3)">내장 역할</span>'
        : '<button class="btn btn-ghost btn-xs" data-rcode="'+escHtml(r.code)+'" onclick="openEditRoleModal(this.dataset.rcode)">수정</button>'
          +'<button class="btn btn-danger btn-xs" data-rcode="'+escHtml(r.code)+'" data-rlabel="'+escHtml(r.label||r.code)+'" onclick="deleteRole(this.dataset.rcode,this.dataset.rlabel)">삭제</button>')
      +'</div></td>'
      +'</tr>';
  });
  var tbl = document.getElementById('role-tbl');
  if(tbl) tbl.innerHTML = rows || '<tr><td colspan="7" class="empty">등록된 역할 없음</td></tr>';
}

function openAddRoleModal(){
  document.getElementById('addrole-title').textContent = '역할 추가';
  document.getElementById('edit-role-code-orig').value = '';
  document.getElementById('role-code').value = '';
  document.getElementById('role-code').disabled = false;
  document.getElementById('role-label').value = '';
  document.getElementById('role-desc').value = '';
  document.getElementById('role-can-edit').value = 'true';
  document.getElementById('role-status').value = 'active';
  document.querySelectorAll('.role-stage-cb').forEach(function(cb){ cb.checked=false; });
  document.getElementById('addrole-save-btn').textContent = '추가';
  openMo('addrole');
}

function openEditRoleModal(code){
  var r = CUSTOM_ROLES.find(function(x){ return x.code===code; });
  if(!r){ showToast('역할을 찾을 수 없습니다.'); return; }
  document.getElementById('addrole-title').textContent = '역할 수정';
  document.getElementById('edit-role-code-orig').value = code;
  document.getElementById('role-code').value = r.code;
  document.getElementById('role-code').disabled = true; // 코드 변경 불가
  document.getElementById('role-label').value = r.label||'';
  document.getElementById('role-desc').value = r.desc||'';
  document.getElementById('role-can-edit').value = r.canEdit ? 'true' : 'false';
  document.getElementById('role-status').value = r.status||'active';
  var stageArr = (r.stages||'').split(',').map(function(s){ return s.trim(); });
  document.querySelectorAll('.role-stage-cb').forEach(function(cb){
    cb.checked = r.stages==='all' || stageArr.includes(cb.value);
  });
  document.getElementById('addrole-save-btn').textContent = '저장';
  openMo('addrole');
}

function saveRole(){
  var code     = document.getElementById('role-code').value.trim();
  var label    = document.getElementById('role-label').value.trim();
  var desc     = document.getElementById('role-desc').value.trim();
  var canEdit  = document.getElementById('role-can-edit').value === 'true';
  var status   = document.getElementById('role-status').value;
  var origCode = document.getElementById('edit-role-code-orig').value;
  var saveBtn  = document.getElementById('addrole-save-btn');

  if(!code){ showToast('역할 코드를 입력하세요.'); return; }
  if(!/^[a-zA-Z0-9_]+$/.test(code)){ showToast('역할 코드는 영문·숫자·_ 만 사용 가능합니다.'); return; }
  if(!label){ showToast('역할명을 입력하세요.'); return; }

  // 내장 역할 코드 중복 체크
  var builtinCodes = BUILTIN_ROLES.map(function(r){ return r.code; });
  if(!origCode && builtinCodes.includes(code)){
    showToast('내장 역할 코드와 동일한 코드는 사용할 수 없습니다.'); return;
  }

  var stages = [];
  document.querySelectorAll('.role-stage-cb:checked').forEach(function(cb){ stages.push(cb.value); });
  var stagesVal = stages.length === 10 ? 'all' : stages.join(',');

  var data = { code:code, label:label, desc:desc, canEdit:canEdit, stages:stagesVal, status:status };
  if(!origCode) data.createdAt = new Date().toISOString();

  saveBtn.disabled = true;
  fbDB.ref('influencer-hub/roles/'+code).set(data)
    .then(function(){
      showToast(label+' 역할 '+(origCode?'수정':'추가')+'완료');
      closeMo('addrole');
      saveBtn.disabled = false;
    })
    .catch(function(e){ showToast('저장 실패: '+e.message); saveBtn.disabled=false; });
}

function deleteRole(code, label){
  showConfirm('['+label+'] 역할을 삭제하시겠습니까?\n이 역할이 지정된 사용자는 영향을 받을 수 있습니다.', function(){
    _deleteRoleConfirmed(code, label);
  });
}
function _deleteRoleConfirmed(code, label){
  fbDB.ref('influencer-hub/roles/'+code).remove()
    .then(function(){ showToast(label+' 삭제 완료'); })
    .catch(function(e){ showToast('삭제 실패: '+e.message); });
}

// ═══════════════════════════════════════
// 사용자 관리 (admin 전용)
// ═══════════════════════════════════════
// ── 사용자 목록: 페이지 상태 ──
var _umPage = 1;
var _umPageSize = 30;
var _umAllUsers = []; // Firebase에서 로드한 전체 사용자

function umToggleSort(){
  var sel = document.getElementById('um-sort');
  if(!sel) return;
  if(sel.value === 'createdAt_desc') sel.value = 'createdAt_asc';
  else sel.value = 'createdAt_desc';
  var th = document.getElementById('um-th-createdAt');
  if(th) th.textContent = '등록일 ' + (sel.value === 'createdAt_desc' ? '▼' : '▲');
  _umPage = 1;
  _umRenderFiltered();
}

function _umRenderFiltered(){
  var nameQ  = (document.getElementById('um-search-name')?.value||'').trim().toLowerCase();
  var emailQ = (document.getElementById('um-search-email')?.value||'').trim().toLowerCase();
  var roleQ  = (document.getElementById('um-search-role')?.value||'');
  var sortV  = (document.getElementById('um-sort')?.value||'createdAt_desc');

  // 필터
  var filtered = _umAllUsers.filter(function(u){
    if(nameQ  && !(u.name||'').toLowerCase().includes(nameQ))   return false;
    if(emailQ && !(u.email||'').toLowerCase().includes(emailQ)) return false;
    if(roleQ  && u.role !== roleQ)                               return false;
    return true;
  });

  // 정렬
  filtered.sort(function(a, b){
    if(sortV === 'createdAt_desc') return (b.createdAt||'') > (a.createdAt||'') ? 1 : -1;
    if(sortV === 'createdAt_asc')  return (a.createdAt||'') > (b.createdAt||'') ? 1 : -1;
    if(sortV === 'name_asc')  return (a.name||'').localeCompare(b.name||'');
    if(sortV === 'name_desc') return (b.name||'').localeCompare(a.name||'');
    return 0;
  });

  // 페이징
  var total   = filtered.length;
  var totalPg = Math.max(1, Math.ceil(total / _umPageSize));
  window._umTotalPg = totalPg; // onclick 클로저에서 참조 가능하도록
  if(_umPage > totalPg) _umPage = totalPg;
  var start   = (_umPage - 1) * _umPageSize;
  var paged   = filtered.slice(start, start + _umPageSize);

  // 카운트 업데이트
  var countEl = document.getElementById('user-count');
  if(countEl) countEl.textContent = '총 '+_umAllUsers.length+'명' + (total < _umAllUsers.length ? ' (검색결과 '+total+'명)' : '');

  // 행 렌더
  var rows = '';
  paged.forEach(function(u){
    var roleCls  = 'role-'+u.role;
    var rlLabel  = ROLE_LABELS[u.role]||u.role;
    var statusBadge = u.status==='active'
      ? '<span class="badge bg">활성</span>'
      : '<span class="badge bk">비활성</span>';
    var createdAt = u.createdAt ? u.createdAt.slice(0,10) : '-';
    rows += '<tr style="cursor:pointer" onclick="openEditUserModal(\''+u.uid+'\')">'
      +'<td style="font-weight:600">'+escHtml(u.name||'-')+'</td>'
      +'<td style="color:var(--text3);font-size:12.5px">'+escHtml(u.email||'-')+'</td>'
      +'<td><span class="role-badge '+roleCls+'">'+rlLabel+'</span></td>'
      +'<td style="font-size:12.5px;color:var(--text2)">'+(u.mcnCompany||'-')+'</td>'
      +'<td>'+statusBadge+'</td>'
      +'<td style="font-size:12px;color:var(--text3)">'+createdAt+'</td>'
      +'<td><div class="row-acts">'
      +(u.uid !== ME_UID
        ? '<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();openEditUserModal(\''+u.uid+'\')">수정</button>'
         +'<button class="btn btn-danger btn-xs" onclick="event.stopPropagation();deleteUserDirect(\''+u.uid+'\',\''+escHtml(u.name||u.email||'')+'\')">삭제</button>'
        : '<span style="font-size:11px;color:var(--text3)">내 계정</span>')
      +'</div></td>'
      +'</tr>';
  });
  var tbl = document.getElementById('user-tbl');
  if(tbl) tbl.innerHTML = rows || '<tr><td colspan="7" class="empty" style="padding:24px;text-align:center;color:var(--text3)">검색 결과가 없습니다</td></tr>';

  // 페이지네이션
  var pgEl = document.getElementById('um-pagination');
  if(pgEl){
    if(totalPg <= 1){ pgEl.innerHTML=''; return; }
    var pgHtml = '';
    var btnStyle = 'background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-sm);padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit;color:var(--text2);transition:all .15s';
    var activeStyle = 'background:var(--accent);border:1px solid var(--accent);border-radius:var(--r-sm);padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit;color:#fff;font-weight:700';
    // 이전
    pgHtml += '<button style="'+btnStyle+'"'+((_umPage===1)?'disabled':'')+' onclick="_umPage=Math.max(1,_umPage-1);_umRenderFiltered()">← 이전</button>';
    // 페이지 번호 (최대 7개 표시)
    var pgStart = Math.max(1, _umPage-3), pgEnd = Math.min(totalPg, pgStart+6);
    if(pgEnd - pgStart < 6) pgStart = Math.max(1, pgEnd-6);
    for(var pi=pgStart; pi<=pgEnd; pi++){
      pgHtml += '<button style="'+(pi===_umPage?activeStyle:btnStyle)+'" onclick="_umPage='+pi+';_umRenderFiltered()">'+pi+'</button>';
    }
    // 다음
    pgHtml += '<button style="'+btnStyle+'"'+((_umPage===_umTotalPg)?'disabled':'')+' onclick="_umPage=Math.min(_umTotalPg,_umPage+1);_umRenderFiltered()">다음 →</button>';
    pgHtml += '<span style="font-size:12px;color:var(--text3);margin-left:4px">'+_umPage+'/'+totalPg+'페이지</span>';
    pgEl.innerHTML = pgHtml;
  }
}

function renderUserTable(){
  if(!isAdmin()){ showToast('접근 권한이 없습니다.'); return; }
  if(fbReady){
    fbDB.ref('users').once('value').then(function(snap){
      _umAllUsers = snap.val() ? Object.values(snap.val()) : [];
      _umPage = 1;
      _umRenderFiltered();
    });
  } else {
    _umPage = 1;
    _umRenderFiltered();
  }
}

function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function openAddUserModal(){
  document.getElementById('adduser-title').textContent='사용자 추가';
  document.getElementById('edit-user-uid').value='';
  document.getElementById('au-name').value='';
  document.getElementById('au-email').value='';
  document.getElementById('au-pw').value='';
  document.getElementById('au-role').value='manager';
  document.getElementById('au-status').value='active';
  document.getElementById('au-mcn-company').value='';
  document.getElementById('au-pw-fr').style.display='';
  document.getElementById('au-pw-change-fr').style.display='none';
  document.getElementById('au-delete-btn').style.display='none';
  document.getElementById('mcn-company-fr').style.display='none';
  document.getElementById('adduser-save-btn').textContent='추가';
  // MCN 드롭다운 갱신
  var mcnSel2 = document.getElementById('au-mcn-company');
  if(mcnSel2){
    mcnSel2.innerHTML = '<option value="">-- 업체 선택 --</option>'
      + MCN_COMPANIES.map(function(c){ return '<option value="'+escHtml(c.name)+'">'+escHtml(c.name)+'</option>'; }).join('');
  }
  refreshRoleDropdown();
  openMo('adduser');
}

function openEditUserModal(uid){
  fbDB.ref('users/'+uid).once('value').then(function(snap){
    var u = snap.val(); if(!u) return;
    document.getElementById('adduser-title').textContent='사용자 수정';
    document.getElementById('edit-user-uid').value=uid;
    document.getElementById('au-name').value=u.name||'';
    document.getElementById('au-email').value=u.email||'';
    document.getElementById('au-pw').value='';
    document.getElementById('au-role').value=u.role||'viewer';
    document.getElementById('au-status').value=u.status||'active';
    // MCN 드롭다운 갱신 후 현재 값 선택
    var mcnSel = document.getElementById('au-mcn-company');
    if(mcnSel){
      mcnSel.innerHTML = '<option value="">-- 업체 선택 --</option>'
        + MCN_COMPANIES.map(function(c){ return '<option value="'+escHtml(c.name)+'"'+(c.name===(u.mcnCompany||'')?'selected':'')+'>'+escHtml(c.name)+'</option>'; }).join('');
    }
    document.getElementById('au-pw-fr').style.display='none';        // 신규용 비번 필드 숨김
    document.getElementById('au-pw-change-fr').style.display='';       // 비번 변경 영역 표시
    document.getElementById('au-pw-new').value='';
    document.getElementById('au-pw-new-confirm').value='';
    document.getElementById('au-pw-change-body').style.display='none'; // 접힌 상태로 초기화
    document.getElementById('au-pw-change-arr').textContent='▶ 펼치기';
    document.getElementById('au-pw-change-msg').textContent='';
    document.getElementById('mcn-company-fr').style.display=u.role==='external_mcn'?'':'none';
    document.getElementById('adduser-save-btn').textContent='저장';
    // 삭제 버튼: 본인 계정 제외
    var delBtn = document.getElementById('au-delete-btn');
    if(delBtn) delBtn.style.display = (uid !== ME_UID) ? '' : 'none';
    openMo('adduser');
  });
}

function toggleMcnField(){
  var role = document.getElementById('au-role').value;
  document.getElementById('mcn-company-fr').style.display = role==='external_mcn' ? '' : 'none';
}

// ── 비밀번호 변경 영역 토글 ──
function togglePwChangeArea(){
  var body = document.getElementById('au-pw-change-body');
  var arr  = document.getElementById('au-pw-change-arr');
  var msg  = document.getElementById('au-pw-change-msg');
  if(!body) return;
  var open = body.style.display === 'none';
  body.style.display = open ? '' : 'none';
  arr.textContent = open ? '▼ 접기' : '▶ 펼치기';
  if(!open && msg) msg.textContent = '';
}

// ── 비밀번호 변경 (Admin SDK 없이 Secondary App 재로그인 방식) ──
function changeUserPassword(){
  var uid      = document.getElementById('edit-user-uid').value;
  var newPw    = document.getElementById('au-pw-new').value;
  var confirm  = document.getElementById('au-pw-new-confirm').value;
  var msg      = document.getElementById('au-pw-change-msg');
  var btn      = document.getElementById('au-pw-change-btn');

  if(!newPw || newPw.length < 8){
    msg.style.color='var(--red)'; msg.textContent='비밀번호는 8자 이상이어야 합니다.'; return;
  }
  if(newPw !== confirm){
    msg.style.color='var(--red)'; msg.textContent='비밀번호가 일치하지 않습니다.'; return;
  }
  if(!uid){ msg.style.color='var(--red)'; msg.textContent='사용자 UID를 찾을 수 없습니다.'; return; }

  btn.disabled = true;
  msg.style.color='var(--text3)'; msg.textContent='처리 중...';

  // Firebase Admin SDK 없이: Cloud Function 또는 사용자 본인 변경만 가능
  // → 현재 로그인 계정이 admin이므로 현재 유저가 아닌 타 유저 비번은
  //   Firebase Auth REST API (Admin) 또는 Custom Token 방식이 필요.
  // → 실용적 대안: Secondary App으로 해당 이메일 계정의 비밀번호 재설정 이메일 발송
  fbDB.ref('users/'+uid).once('value').then(function(snap){
    var u = snap.val();
    if(!u || !u.email){ throw new Error('이메일 정보를 찾을 수 없습니다.'); }
    var email = u.email;
    // Secondary app으로 비밀번호 업데이트 (현재 비번을 모르면 불가)
    // → Firebase Auth에서 admin이 직접 비번 변경하려면 Admin SDK(서버) 필요
    // → 클라이언트에서 가능한 방법: 비밀번호 재설정 이메일 발송
    return firebase.auth().sendPasswordResetEmail(email).then(function(){
      return email;
    });
  }).then(function(email){
    msg.style.color='var(--green)';
    msg.textContent='✅ '+email+'로 비밀번호 재설정 이메일을 발송했습니다.';
    btn.disabled = false;
    document.getElementById('au-pw-new').value='';
    document.getElementById('au-pw-new-confirm').value='';
  }).catch(function(e){
    msg.style.color='var(--red)';
    msg.textContent='실패: '+e.message;
    btn.disabled = false;
  });
}

// ── 모달 내 삭제 버튼 ──
function deleteUser(){
  var uid  = document.getElementById('edit-user-uid').value;
  var name = document.getElementById('au-name').value || '이 사용자';
  if(!uid){ showToast('삭제할 사용자를 찾을 수 없습니다.'); return; }
  deleteUserDirect(uid, name);
  closeMo('adduser');
}

// ── 테이블 행 삭제 (직접 호출) ──
function deleteUserDirect(uid, name){
  showConfirm('['+name+'] 사용자를 삭제하시겠습니까?', function(){
    if(!fbReady){
      _umAllUsers = _umAllUsers.filter(function(u){ return u.uid !== uid; });
      showToast(name+' 삭제 완료 (데모)');
      renderUserTable();
      return;
    }
    fbDB.ref('users/'+uid).remove()
      .then(function(){ showToast(name+' 삭제 완료'); renderUserTable(); })
      .catch(function(e){ showToast('삭제 실패: '+e.message); });
  });
}


function saveUser(){
  var uid = document.getElementById('edit-user-uid').value;
  var name = document.getElementById('au-name').value.trim();
  var email = document.getElementById('au-email').value.trim();
  var pw = document.getElementById('au-pw').value;
  var role = document.getElementById('au-role').value;
  var status = document.getElementById('au-status').value;
  var mcnCompany = document.getElementById('au-mcn-company').value.trim();
  var saveBtn = document.getElementById('adduser-save-btn');

  if(!name){ showToast('이름을 입력하세요.'); return; }
  if(!email){ showToast('이메일을 입력하세요.'); return; }
  if(role==='external_mcn' && !mcnCompany){ showToast('MCN 업체명을 입력하세요.'); return; }

  saveBtn.disabled = true;

  // 데모 모드: 로컬 배열에 직접 반영
  if(!fbReady){
    if(!uid){
      if(!pw || pw.length < 8){ showToast('비밀번호를 8자 이상 입력하세요.'); saveBtn.disabled=false; return; }
      var newUid2 = 'demo-user-'+Date.now();
      _umAllUsers.push({ uid:newUid2, name:name, email:email, role:role, mcnCompany:mcnCompany, status:status, createdAt:new Date().toISOString() });
      showToast(name+' 사용자 추가 완료 (데모)');
    } else {
      var uidx = _umAllUsers.findIndex(function(u){ return u.uid===uid; });
      if(uidx >= 0) Object.assign(_umAllUsers[uidx], { name:name, role:role, mcnCompany:mcnCompany, status:status });
      showToast(name+' 정보 수정 완료 (데모)');
    }
    closeMo('adduser'); renderUserTable(); saveBtn.disabled=false;
    return;
  }

  if(!uid){
    // 신규 추가: Firebase Auth 계정 생성 후 DB에 저장
    if(!pw || pw.length < 8){ showToast('비밀번호를 8자 이상 입력하세요.'); saveBtn.disabled=false; return; }
    var secondaryApp;
    try {
      secondaryApp = firebase.app('secondary');
    } catch(e) {
      secondaryApp = firebase.initializeApp(FIREBASE_CONFIG, 'secondary');
    }
    secondaryApp.auth().createUserWithEmailAndPassword(email, pw)
      .then(function(cred){
        var newUid = cred.user.uid;
        var userData = {
          uid: newUid, email: email, name: name, role: role,
          mcnCompany: mcnCompany, status: status,
          createdAt: new Date().toISOString()
        };
        return fbDB.ref('users/'+newUid).set(userData);
      })
      .then(function(){
        secondaryApp.auth().signOut();
        showToast(name+' 사용자 추가 완료');
        closeMo('adduser'); renderUserTable(); saveBtn.disabled=false;
      })
      .catch(function(e){
        saveBtn.disabled=false;
        var msg='사용자 추가 실패: '+e.message;
        if(e.code==='auth/email-already-in-use') msg='이미 등록된 이메일입니다.';
        if(e.code==='auth/weak-password') msg='비밀번호는 6자 이상이어야 합니다.';
        showToast(msg);
      });
  } else {
    // 수정
    var updateData = { name:name, role:role, mcnCompany:mcnCompany, status:status };
    fbDB.ref('users/'+uid).update(updateData)
      .then(function(){
        showToast(name+' 정보 수정 완료');
        closeMo('adduser'); renderUserTable(); saveBtn.disabled=false;
      })
      .catch(function(e){ saveBtn.disabled=false; showToast('수정 실패: '+e.message); });
  }
}

// ═══════════════════════════════════════
// ── 정산처리일 자동 계산 (캠페인 종료일 +14일) ──
function autoCalcSettleProcessDate(){
  var endVal = document.getElementById('p-end')?.value||'';
  var spEl = document.getElementById('p-settle-process-date');
  if(!spEl) return;
  // 기존 값이 있으면 덮어쓰지 않음 (수동 수정 보호)
  if(spEl.value) return;
  if(!endVal) return;
  // datetime-local이면 날짜 부분만 추출
  var dateStr = endVal.length > 10 ? endVal.substring(0,10) : endVal;
  try {
    var d = new Date(dateStr);
    d.setDate(d.getDate() + 14);
    spEl.value = d.toISOString().substring(0,10);
  } catch(e){ /* ignore */ }
}
// p-end 변경 시 자동 계산
document.addEventListener('change', function(e){
  if(e.target && e.target.id === 'p-end') autoCalcSettleProcessDate();
});

// INIT
// ═══════════════════════════════════════
// Auth 확인 전: 로딩 오버레이 표시 (로그인 화면 깜빡임 방지)
(function(){
  var ov = document.createElement('div');
  ov.id = 'auth-loading-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:#1a1c2e;z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px';
  ov.innerHTML = '<div style="width:38px;height:38px;border:3px solid rgba(108,92,231,0.3);border-top-color:#6c5ce7;border-radius:50%;animation:spin .8s linear infinite"></div>'
    + '<div style="color:rgba(255,255,255,0.5);font-size:13px;font-family:inherit">SSGLIVE 로딩 중...</div>'
    + '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
  document.body.appendChild(ov);
  window._removeAuthOverlay = function(){
    var el = document.getElementById('auth-loading-overlay');
    if(el) el.remove();
  };
})();
document.querySelector('.sidebar').style.display = 'none';
document.querySelector('.main').style.display = 'none';

// Firebase 초기화 → Auth 상태감지 → 로그인 또는 앱 진입
// Firebase 초기화
if(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== '여기에_API_KEY' && typeof firebase !== 'undefined'){
  initFirebase();
} else {
  // Firebase 설정 없거나 SDK 로드 실패 → 로그인 화면 바로 표시
  if(window._removeAuthOverlay) window._removeAuthOverlay();
}
</script>