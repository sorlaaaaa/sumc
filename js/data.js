/* =====================================================================
   选择你的川传生活 · 数据层
   地图 / 建筑 / 人物 / 校友照片均为占位，后续替换请同步 assets/README.md
   修改属性数值、对话文案、点位坐标都在这里完成，无需动 app.js
   ===================================================================== */

/* ---------- 全局配置 ---------- */
const GAME = {
  actionMax: 12,            // 一局行动点（开学后前两周）
  settleMin: 5,             // 至少探索多少处才开放「提前结算」
  attrMax: 10,              // 单项属性上限
  balancedMinAttr: 4,       // 隐藏结局「双馨」：五项都 ≥ 此值
  balancedMinExplored: 10,  // 隐藏结局「双馨」：地图熟悉度 ≥ 此值
  emptyMaxExplored: 3,      // 隐藏小结局「空镜」：探索过少就结算
};

/* ---------- 五项属性（界面用胶片五格显示） ---------- */
const ATTRS = {
  lens:  { key: 'lens',  name: '镜头感', icon: '🎥', desc: '构图、现场、影像思维' },
  voice: { key: 'voice', name: '声线',   icon: '🎙️', desc: '表达、主持、有声' },
  story: { key: 'story', name: '叙事',   icon: '📝', desc: '编导、新闻、剧本结构' },
  stage: { key: 'stage', name: '舞台',   icon: '🎭', desc: '表演、形体、临场' },
  life:  { key: 'life',  name: '烟火',   icon: '🍲', desc: '生活适应、社交、把日子过明白' },
};
const ATTR_ORDER = ['lens', 'voice', 'story', 'stage', 'life'];

/* ---------- 开场身份（不影响通关，只改旁白/少量台词） ---------- */
const ARCHETYPES = [
  { id: 'machine',  name: '爱扛机器的',   emoji: '🎥', flavor: '你的眼睛总在找机位，连走路都像在运镜。' },
  { id: 'mic',      name: '爱对着话筒的', emoji: '🎙️', flavor: '你习惯先听声音，再听内容，连呼吸都数着拍。' },
  { id: 'stage',    name: '爱在舞台的',   emoji: '🎭', flavor: '你不怕被看，站到亮处反而更自在。' },
  { id: 'undecided',name: '还没想好的',   emoji: '🎬', flavor: '你什么都想试试，镜头、话筒、舞台，都先看看。' },
];

const RESIDENCE = [
  { id: 'east',    name: '东区',   emoji: '🌅' },
  { id: 'west',    name: '西区',   emoji: '🏙️' },
  { id: 'unknown', name: '还没分清', emoji: '🧭' },
];

/* ---------- 校园小贴士库（分类，图鉴「贴士」分页可搜索） ---------- */
const TIP_CATS = {
  survival: '生存',
  learning: '学习',
  device:   '设备',
  safety:   '安全',
};

const TIPS = {
  t_gift:    { id: 't_gift',    cat: 'survival', text: '学生事务中心可录宿舍密码锁指纹；东西区间有校车通勤。', src: '迎新礼包' },
  t_gate:    { id: 't_gate',    cat: 'survival', text: '地址是郫都区团结街道学院街67号；东区报到常在教学楼大厅一带（以当年通知为准）。', src: '东区校门' },
  t_timetable:{ id: 't_timetable', cat: 'learning', text: '打开「智慧川传」看课表楼号，比问十个人都快。', src: 'A1教学楼' },
  t_av:      { id: 't_av',      cat: 'device',   text: '视听中心可凭学生证、身份证登记借用相机等设备。', src: '视听中心' },
  t_room:    { id: 't_room',    cat: 'device',   text: '实训室普遍要预约，先问再进。', src: '视听中心' },
  t_media:   { id: 't_media',   cat: 'learning', text: '融媒体不是「发得快就赢」，是同一事实的多种表达。', src: '融合媒体实验教学中心' },
  t_lib:     { id: 't_lib',     cat: 'learning', text: '川传图书馆公众号激活账号；隔音研讨室可线上预约；每本书可续借一次。', src: '图书馆' },
  t_arts:    { id: 't_arts',    cat: 'survival', text: '艺体中心常办大型活动，抢票和占座要提前看通知。', src: '艺体中心' },
  t_acting:  { id: 't_acting',  cat: 'learning', text: '看排练要安静；跨专业旁听先问老师。', src: '表演学院' },
  t_record:  { id: 't_record',  cat: 'device',   text: '录音棚时间要预约，爱惜录音设备。', src: 'A12录音课' },
  t_service: { id: 't_service', cat: 'survival', text: '学生事务中心办一卡通、热水卡；一卡通能吃饭、借书、存包、坐校车、看病。', src: '学生事务中心' },
  t_canteen: { id: 't_canteen', cat: 'survival', text: '一卡通可绑定微信；「川传邦」可下单外卖。', src: '食堂' },
  t_dorm:    { id: 't_dorm',    cat: 'survival', text: '热水分时段供应；门禁是真的，晚归提前打招呼。', src: '学生公寓' },
  t_lake:    { id: 't_lake',    cat: 'survival', text: '星光湖是情绪缓冲带，也是出片外景地；晚上散步注意安全。', src: '星光湖' },
  t_museum:  { id: 't_museum',  cat: 'learning', text: '传媒博物馆对外可开放，是拍作业空镜的好地方。', src: '传媒博物馆' },
  t_westgate:{ id: 't_westgate',cat: 'survival', text: '西区地址：花石路116号一带；两区间有校车，开学先搞懂班次。', src: '西区校门' },
  t_studio:  { id: 't_studio',  cat: 'safety',   text: '摄影棚是工业现场，不是网红打卡地：别踩线、别碰灯。', src: '大型摄影棚群落' },
  t_libwest: { id: 't_libwest', cat: 'learning', text: '西区图书馆设施齐全，研讨室与自习位建议提前预约。', src: '西区图书馆' },
  t_body:    { id: 't_body',    cat: 'survival', text: '身体是第一台机器：体测和通宵剪片会打架，只能自己排期。', src: '西区运动场' },
  t_clinic:  { id: 't_clinic',  cat: 'survival', text: '生病先到校卫生所就诊，再去医院才可医保报销。', src: '校园卫生所' },
  t_cinema:  { id: 't_cinema',  cat: 'survival', text: '东区电影院在艺体中心旁。', src: '东区电影院' },
  t_cat:     { id: 't_cat',     cat: 'survival', text: '校园里有流浪猫，喂食注意卫生，别上手逗弄。', src: '校园流浪猫' },
};

/* ---------- 正式点位（14+，含东区 / 西区） ----------
   坐标 pos 为地图上的百分比 {x, y}（左上角为原点），供图后只需改坐标与底图。
   事件四拍：空镜 → 遭遇 → 选择（约一半有）→ 收获。
   attr 取值：{lens/voice/story/stage/life: delta}
------------------------------------------------------------------------- */
const LOCATIONS = [
  /* ─────── 东区 · 老片场 ─────── */
  {
    id: 'gate_east', name: '东区校门 / 学院街', short: '东区校门', region: 'east',
    pos: { x: 50, y: 86 }, emoji: '🚪', key: true,
    hover: '报到、第一印象',
    lure: '校门口的风里，有行李箱轮子的声音。',
    desc: '学院街67号，川传的第一帧。行李箱轮子在石板路上响，到处是举着手机找角度的新生。',
    encounter: { role: '保安', line: '同学，你是来报到的新生吧？' },
    choice: {
      prompt: '怎么接话？',
      options: [
        { label: '认真问路', attr: { life: 1 }, result: '你把报到路线问得明明白白，保安大叔还顺手帮你指了教学楼大厅的方向。' },
        { label: '自行探索', attr: { story: 1 }, result: '你没急着问路，决定自己先逛逛。绕了一圈——不过，绕路也是认识校园的一种方式。' },
      ],
    },
    tipIds: ['t_gate'],
    revisit: ['校门口还是那么多人举着手机。', '保安大叔今天在帮一位家长指路。'],
  },
  {
    id: 'a1', name: 'A1 教学楼', short: 'A1教学楼', region: 'east',
    pos: { x: 30, y: 30 }, emoji: '🏫',
    hover: '公共课',
    lure: '像场记板一样的课表，一格一格排满了。',
    desc: '第一教学楼，公共课的大本营。走廊里到处是低头找教室的新生，手机上的「智慧川传」把课表一格一格排得明明白白。',
    encounter: { role: '学长', line: '找教室？打开「智慧川传」，楼号、课表、上课地点都在里面。' },
    flatAttr: { story: 1 },
    tipIds: ['t_timetable'],
    revisit: ['今天走廊里有人在背英语。', '课表又更新了，还是先拍照记下来最保险。'],
  },
  {
    id: 'av', name: '视听中心', short: '视听中心', region: 'east',
    pos: { x: 39, y: 46 }, emoji: '🎙️',
    hover: '播音主持、节目实训',
    lure: '话筒亮着的地方，正在倒计时。',
    desc: '视听中心，话筒亮着的地方。隔音门后头，导播间里正有人在倒计时。',
    encounter: { role: '导播', line: '三、二、一——' },
    choice: {
      prompt: '你更想待在哪儿？',
      options: [
        { label: '主动试音', attr: { voice: 2 }, result: '你凑到话筒前试了一句，气息还有点飘，但那种被听见的感觉，很上瘾。' },
        { label: '躲在监视器后面看', attr: { lens: 1 }, result: '你缩在监视器后头看构图，原来机位和走位是这么配合的。' },
      ],
    },
    tipIds: ['t_av', 't_room'],
    revisit: ['导播又在喊三二一。', '今天有人在试音，声音还挺好听。'],
  },
  {
    id: 'media', name: '融合媒体实验教学中心', short: '融媒体中心', region: 'east',
    pos: { x: 47, y: 38 }, emoji: '📱', key: true,
    hover: '新闻、新媒体、融合生产',
    lure: '一条选题，在这里被拆成三种形态。',
    desc: '融媒体中心，一条选题在这里要被拆成短视频、图文、音频三种形态。',
    encounter: { role: '学姐', line: '热点来了，你是先抢速度，还是先把事实核对完？' },
    choice: {
      prompt: '你的选择——',
      options: [
        { label: '追热点速度', attr: { life: 1 }, result: '你抢着先发了，流量上去了，回头才发现有个细节得更正。手忙脚乱，也算上了一课。' },
        { label: '把事实核对完再发', attr: { story: 2 }, result: '你晚了一点点，但稿子立得住。学姐点点头：融媒体不是发得快就赢。' },
      ],
    },
    tipIds: ['t_media'],
    revisit: ['三块屏幕同时亮着，一个选题三种模样。', '这里永远在赶稿，也永远在教人沉住气。'],
  },
  {
    id: 'library_east', name: '图书馆', short: '图书馆', region: 'east',
    pos: { x: 61, y: 27 }, emoji: '📚',
    hover: '纸质书 + 数据库 + 自习',
    lure: '靠窗的位置最抢手，得早点来。',
    desc: '图书馆坐得满满当当，翻书声很轻。靠窗的位置最抢手，得早点来。',
    encounter: { role: '管理员', line: '用公众号激活账号，就能约研讨室、续借了。' },
    flatAttr: { story: 1, life: 1 },
    tipIds: ['t_lib'],
    revisit: ['靠窗的位置又被占了。', '有人抱着书睡着了，你轻手轻脚路过。'],
  },
  {
    id: 'arts', name: '艺体中心', short: '艺体中心', region: 'east',
    pos: { x: 72, y: 47 }, emoji: '🎪',
    hover: '演出、大型活动',
    lure: '灯光一打，就是舞台。',
    desc: '艺体中心，灯光一打就是舞台。有人在走台，有人在下面架机器。',
    encounter: { role: '场务', line: '缺人手——搬道具还是维持秩序，你挑一个。' },
    choice: {
      prompt: '你想搭把手？',
      options: [
        { label: '帮着搬道具', attr: { stage: 2 }, result: '你扛起一块景片，才知道道具也讲究站位和节奏。' },
        { label: '帮助协调秩序', attr: { life: 1 }, result: '你站在门口引导人流，认识了几个等着看彩排的同学。' },
      ],
    },
    tipIds: ['t_arts'],
    revisit: ['台上在走位，你在台下看得入神。', '今天在搭一个新舞台。'],
  },
  {
    id: 'acting', name: '表演学院', short: '表演学院', region: 'east',
    pos: { x: 56, y: 56 }, emoji: '🎭',
    hover: '表演、形体、剧场思维',
    lure: '练功房里，正在「解放天性」。',
    desc: '表演学院，练功房里同学们正模仿动物，在地上又爬又跳——这叫「解放天性」。',
    encounter: { role: '老师', line: '看排练，安静是第一课。' },
    flatAttr: { stage: 3 },
    tipIds: ['t_acting'],
    revisit: ['练功房里还在解放天性。', '有人在对着镜子练台词。'],
  },
  {
    id: 'recording', name: 'A12 录音课', short: 'A12录音课', region: 'east',
    pos: { x: 30, y: 62 }, emoji: '🎛️',
    hover: '声音制作',
    lure: '隔音门一关，世界就变小了。',
    desc: '录音棚的隔音门一关，世界就变小了，只剩下你自己的呼吸。',
    encounter: { role: '学长', line: '棚子要预约，设备轻拿轻放——它们比你想的贵。' },
    flatAttr: { voice: 1, lens: 1 },
    tipIds: ['t_record'],
    revisit: ['隔音门一关，外面的一切都静了。', '今天有人录了三个小时还没出来。'],
  },
  {
    id: 'service', name: '学生事务中心', short: '学生事务中心', region: 'east',
    pos: { x: 49, y: 18 }, emoji: '🪪', key: true,
    hover: '一卡通、热水卡',
    lure: '队伍很长，但问题三分钟能解决。',
    desc: '学生事务中心，队伍排得很长，但多数问题三分钟就能解决。',
    encounter: { role: '工作人员', line: '下一个。密码锁指纹、热水卡、一卡通，一次能办齐。' },
    flatAttr: { life: 2 },
    tipIds: ['t_service'],
    revisit: ['队伍还是很长，不过排得很快。', '窗口的小姐姐说话又稳又快。'],
  },
  {
    id: 'canteen', name: '食堂 / 学院美食城', short: '食堂', region: 'east',
    pos: { x: 63, y: 64 }, emoji: '🍜',
    hover: '吃饭、社交',
    lure: '香气混在一起，先吃还是先拍？',
    desc: '食堂里香气混在一起。你第一次端盘，突然不确定该把盘子送到哪个回收点。',
    encounter: { role: '同学', line: '先吃还是先拍？隔壁桌已经在拍vlog了。' },
    choice: {
      prompt: '你选择——',
      options: [
        { label: '认真吃饭', attr: { life: 2 }, result: '你找了个位置好好吃了一顿。热乎饭下肚，才算真的落了地。' },
        { label: '拍完再吃', attr: { lens: 1 }, result: '你端起手机拍了一段，顺手帮隔壁桌录了个转场镜头。' },
      ],
    },
    tipIds: ['t_canteen'],
    revisit: ['今天窗口换了新菜。', '有人拍vlog，有人在认真干饭。'],
  },
  {
    id: 'dorm', name: '学生公寓', short: '学生公寓', region: 'east',
    pos: { x: 81, y: 70 }, emoji: '🛏️',
    hover: '四人间、独卫独浴、门禁',
    lure: '对灯、对作息、对谁先洗澡。',
    desc: '公寓里，你和舍友第一次碰头：对灯、对作息、对谁先洗澡。',
    encounter: { role: '舍友', line: '要不……先立个公约？还是先忍一周？' },
    choice: {
      prompt: '怎么开始合租生活？',
      options: [
        { label: '先立公约', attr: { life: 2 }, result: '你们把熄灯时间和值日说清楚，后面真的少了很多摩擦。' },
        { label: '先忍一周', attr: { life: 1 }, result: '你决定先看看，结果第五天还是没忍住，坐下来把话说开了。' },
      ],
    },
    tipIds: ['t_dorm'],
    revisit: ['宿舍楼下总有人在等外卖。', '你的床铺还空着半张，等着收拾。'],
  },
  {
    id: 'lake', name: '星光湖', short: '星光湖', region: 'east',
    pos: { x: 21, y: 74 }, emoji: '🌌',
    hover: '风景、情绪缓冲、外景',
    lure: '湖面的灯，天一黑就散开。',
    desc: '星光湖边，有人在拍作业，有人在给家里打电话。风一吹，水面的灯就散成一片。',
    encounter: { role: '陌生人', line: '能帮我按一下快门吗？就一张。' },
    choice: {
      prompt: '你想——',
      options: [
        { label: '坐一会儿', attr: { story: 1 }, result: '你坐在湖边发了会儿呆，很多想不通的事，慢慢自己就顺了。' },
        { label: '帮陌生人按快门', attr: { lens: 1 }, result: '你按下快门，画面里有湖、有灯、还有她的笑。' },
      ],
    },
    tipIds: ['t_lake'],
    revisit: ['湖面的灯又亮起来了。', '有人在岸边背书，声音轻轻的。'],
  },
  {
    id: 'a9', name: 'A9 有声语言艺术学院', short: 'A9有声语言', region: 'east',
    pos: { x: 40, y: 64 }, emoji: '🎙️',
    hover: '播音主持专业课',
    lure: '有人在拍作业，有人在练声。',
    desc: 'A9 有声语言艺术学院，播音主持的专业课都在这上。有人在拍作业，有人在练声。',
    encounter: { role: '老师', line: '气息放稳，声音才有根。' },
    flatAttr: { voice: 3 },
    tipIds: [],
    revisit: ['练声房里还是「八百标兵奔北坡」。', '有人在拍作业，有人在练声。'],
  },

  /* ─────── 西区 · 成都影视硅谷 ─────── */
  {
    id: 'museum', name: '传媒博物馆', short: '传媒博物馆', region: 'west',
    pos: { x: 30, y: 30 }, emoji: '🏛️', key: true,
    hover: '校史与行业器物，2021年开馆',
    lure: '一百年的传媒史，在一间屋子里排队。',
    desc: '传媒博物馆，2021年开馆。从老收音机到演播台，行业的一百年在这里排成一列。',
    encounter: { role: '讲解员', line: '想先看机器，还是先看校史墙？' },
    choice: {
      prompt: '你往哪边走？',
      options: [
        { label: '看机器', attr: { lens: 1 }, result: '你在那些老设备前站了很久，每一台都像一句没说完的台词。' },
        { label: '看校史墙', attr: { story: 1 }, result: '你顺着校史墙走，慢慢看懂了「传党声、聚民心」是怎么来的。' },
      ],
    },
    tipIds: ['t_museum'],
    revisit: ['那台老收音机还在那里。', '展馆很静，适合一个人慢慢走。'],
  },
  {
    id: 'gate_west', name: '西区校门 / 花石路印象', short: '西区校门', region: 'west',
    pos: { x: 50, y: 86 }, emoji: '🚏',
    hover: '另一半校园的心理门槛',
    lure: '你差点以为自己走错了片场。',
    desc: '花石路116号一带。你第一次来，差点以为自己走错了片场。',
    encounter: { role: '司机', line: '东区西区有校车，先搞懂班次，来回就顺了。' },
    flatAttr: { life: 1 },
    tipIds: ['t_westgate'],
    revisit: ['校车刚好开过去。', '花石路这边，人比东区少一点，安静一点。'],
  },
  {
    id: 'studio', name: '大型摄影棚群落', short: '摄影棚', region: 'west',
    pos: { x: 55, y: 35 }, emoji: '🎬', key: true,
    hover: '高端摄制、产教融合现场',
    lure: '有座棚，比宿舍还大。',
    desc: '摄影棚比宿舍还大。灯光、轨道、置景，工业现场的味道扑面而来。',
    encounter: { role: '场务', line: '别踩线，别碰灯。想不想当场务？' },
    choice: {
      prompt: '你怎么办？',
      options: [
        { label: '申请当场务', attr: { lens: 2, stage: 1 }, result: '你跟着搬灯、清场，第一次明白一个镜头背后有多少人。' },
        { label: '只参观不说话', attr: { lens: 2 }, result: '你安静地看完整场拍摄，把每个岗位记在了心里。' },
      ],
    },
    tipIds: ['t_studio'],
    revisit: ['棚里今天在拍夜戏。', '轨道车从你面前缓缓推过去。'],
  },
  {
    id: 'library_west', name: '西区图书馆', short: '西区图书馆', region: 'west',
    pos: { x: 76, y: 46 }, emoji: '📖',
    hover: '新教学与自习',
    lure: '环境新、座位多，窗外是一整片安静。',
    desc: '西区图书馆，环境新、座位多。你找了个靠窗的位置坐下，窗外是整片安静。',
    encounter: { role: '同学', line: '这里约研讨室也方便，期末得早点来。' },
    flatAttr: { story: 1, life: 1 },
    tipIds: ['t_libwest'],
    revisit: ['今天人不多，座位随便挑。', '有人在窗边拍延时。'],
  },
  {
    id: 'sports', name: '西区运动场', short: '运动场', region: 'west',
    pos: { x: 40, y: 66 }, emoji: '🏃',
    hover: '出汗、组队、非镜头的身体',
    lure: '有人把运动相机绑在身上拍自己。',
    desc: '西区运动场，有人在跑步，还有人把运动相机绑在身上拍自己。',
    encounter: { role: '同学', line: '身体才是第一台机器，剪片熬夜和体测，得自己排期。' },
    flatAttr: { stage: 1, life: 1 },
    tipIds: ['t_body'],
    revisit: ['跑道上的人一圈一圈。', '今晚有人在操场唱歌。'],
  },
];

/* ---------- 不耗行动点的彩蛋点 ---------- */
const EASTER_EGGS = [
  {
    id: 'clinic', name: '校园卫生所', short: '卫生所', region: 'east',
    pos: { x: 18, y: 15 }, emoji: '🏥',
    hover: '先来卫生所，再去医院',
    text: '着凉了才想起来这儿。医生说：「先来卫生所就诊，再去医院，才能医保报销。」',
    tipIds: ['t_clinic'],
  },
  {
    id: 'cat', name: '校园流浪猫', short: '流浪猫', region: 'east',
    pos: { x: 71, y: 14 }, emoji: '🐈',
    hover: '随手拍一张',
    text: '草丛里蹲着一只校园猫。你随手拍了张照，它看都不看你一眼。',
    tipIds: ['t_cat'],
  },
  {
    id: 'plaza', name: '东区小广场', short: '小广场', region: 'east',
    pos: { x: 50, y: 50 }, emoji: '✨',
    hover: '夜晚灯火，温暖放松',
    text: '傍晚的东区小广场，灯暖得刚刚好。你站了一会儿，觉得很踏实。',
    tipIds: [],
  },
  {
    id: 'cinema', name: '东区电影院', short: '电影院', region: 'east',
    pos: { x: 78, y: 39 }, emoji: '🎞️',
    hover: '就在艺体中心旁',
    text: '电影院就在艺体中心旁。选个周末，来补一部没看完的片。',
    tipIds: ['t_cinema'],
  },
];

/* ---------- 「园校合一」隐藏标记：去过摄影棚 + 融媒体 + 博物馆 ---------- */
const YUANXIAO_SET = ['studio', 'media', 'museum'];

/* ---------- 结局 ---------- */
const ENDINGS = {
  A: {
    key: 'A', title: '《灯亮着》', name: '棚内的人', attr: 'lens',
    narr: '你习惯先问「机位在哪」。',
    share: '我在川传走成了「棚内的人」。',
    alumni: 'kong', backup: 'ren',
    slides: [
      '从第一声「卡」开始，你就习惯先问：机位在哪。',
      '你在监视器后头，找到了一种秩序。',
      '灯亮着的时候，你知道该往哪儿站。',
    ],
  },
  B: {
    key: 'B', title: '《三、二、一》', name: '话筒前的人', attr: 'voice',
    narr: '你开始注意呼吸和停顿，用声音传递内容与温度。',
    share: '我在川传走成了「话筒前的人」。',
    alumni: 'li', backup: 'li_dan',
    slides: [
      '你开始注意呼吸，注意停顿。',
      '话筒很沉，但你想把每一个字说清楚。',
      '三、二、一——声音，是有温度的。',
    ],
  },
  C: {
    key: 'C', title: '《该我上场了》', name: '讲故事的人', attr: 'story',
    narr: '你更喜欢新媒体视频创作，各个平台都有你的足迹。',
    share: '我在川传走成了「讲故事的人」。',
    alumni: 'ma', backup: 'backup_c',
    slides: [
      '你不满足于只讲一个版本。',
      '短视频、图文、音频，你都想试一遍。',
      '平台换了一个又一个，你的足迹没断过。',
      '该我上场了。',
    ],
  },
  D: { // 表演方向：舞台最高，或舞台与镜头感接近（判定见 computeEnding）
    key: 'D', title: '《灯光已经给你了》', name: '台上的人', attr: 'stage',
    narr: '你不怕被看，你愿意站在台上。',
    share: '我在川传走成了「台上的人」。',
    alumni: 'wang', backup: 'zhang',
    slides: [
      '你不怕被看。',
      '你愿意站在台上。',
      '灯光已经给你了——上台吧。',
    ],
  },
  E: { // 占位结局：烟火向（原表未单列，暂补，待确认）
    key: 'E', title: '《把日子过成片场》', name: '把日子过明白的人', attr: 'life',
    narr: '你把食堂、校车、门禁都摸熟了，日子被你过得有滋有味。',
    share: '我在川传，把日子过成了片场。',
    alumni: null, backup: null, placeholder: true,
    slides: [
      '你没有惊天动地的镜头，却把每一天都安排得妥帖。',
      '食堂哪个窗口好吃、校车几点一班，你门儿清。',
      '烟火气，也是川传生活的一种底色。',
    ],
  },
  F: {
    key: 'F', title: '《博学笃行》', name: '德艺双馨', attr: 'balanced', hidden: true,
    narr: '你没有把专业当成单行道。镜头、舞台、生活都在。',
    share: '我在川传走成了「德艺双馨」。',
    alumni: 'wall', backup: null,
    slides: [
      '你没有把专业，当成单行道。',
      '镜头、舞台、生活，都在你身上。',
      '博学笃行，德艺双馨。',
    ],
  },
  G: {
    key: 'G', title: '《空镜》', name: '还没对上焦', attr: 'empty', hidden: true,
    narr: '校园很大，你才刚开机。',
    share: '我在川传，还没对上焦。',
    alumni: null, backup: null,
    slides: [
      '校园很大，你才刚开机。',
      '有些地方，还没走到。',
      '没关系——空镜，也是镜头。',
    ],
  },
};

/* ---------- 校友名片 ---------- */
const ALUMNI = {
  kong:     { id: 'kong',     name: '孔大山',   dir: '导演 · 编剧方向', bio: '金鸡奖最佳编剧奖。', ending: 'A', photo: 'assets/alumni/kong.png' },
  ren:      { id: 'ren',      name: '任洋',     dir: '导演 · 编导方向', bio: '湖南卫视制片人。', ending: 'A', photo: 'assets/alumni/ren.jpg' },
  li:       { id: 'li',       name: '李璟娅',   dir: '播音方向', bio: '青海卫视主持人、金声奖获得者。', ending: 'B', photo: 'assets/alumni/li.png' },
  li_dan:   { id: 'li_dan',   name: '李丹',     dir: '播音方向', bio: '四川卫视主持人、金声奖获得者。', ending: 'B', photo: 'assets/alumni/li_dan.jpg' },
  ma:       { id: 'ma',       name: '马赵凌云', dir: '融媒体 · 新媒体方向', bio: '四川非遗推广大使、峨眉武术宣传大使。', ending: 'C', photo: 'assets/alumni/ma.jpg' },
  backup_c: { id: 'backup_c', name: '待补充',   dir: '新媒体方向', bio: '同方向备选校友（待补）。', ending: 'C', placeholder: true },
  wang:     { id: 'wang',     name: '王天放',   dir: '表演方向', bio: '知名喜剧演员。', ending: 'D', photo: 'assets/alumni/wang.jpg' },
  zhang:    { id: 'zhang',    name: '张问初',   dir: '编导 · 表演方向', bio: '《逃出大型博物馆》主创。', ending: 'D', photo: 'assets/alumni/zhang.jpg' },
  // 隐藏结局「德艺双馨」特殊校友墙（一次亮 3 张剪影）
  wall:     { id: 'wall',     name: '特殊校友墙', dir: '三位川传人', bio: '一次点亮 3 张剪影，全部点亮需新周目。', ending: 'F', placeholder: true },
};

/* ---------- 今日场记 · 通用勾引文案 ---------- */
const DAILY_HOOKS = [
  '新生最容易迷路的，其实不是楼，是「先往哪边走」。',
  '贴士图鉴收齐有彩蛋，别问，先去逛。',
  '川传没有标准答案，只有十二次选择。',
  '有些楼的惊喜，藏在回头再看一眼里。',
];

/* ---------- 建筑内景图（点位 id → 图片路径） ----------
   已到图的点位直接显示实景，其余仍用占位色块。
   备用图：assets/scenes/av2.jpg（视听中心2）、assets/scenes/library_study.jpg（图书馆自习区） */
const SCENES = {
  gate_east: 'assets/scenes/gate_east.jpg',
  a1: 'assets/scenes/a1.jpg',
  a9: 'assets/scenes/a9.jpg',
  av: 'assets/scenes/av.jpg',
  media: 'assets/scenes/media.jpg',
  library_east: 'assets/scenes/library_east.jpg',
  arts: 'assets/scenes/arts.jpg',
  acting: 'assets/scenes/acting.jpg',
  canteen: 'assets/scenes/canteen.jpg',
  dorm: 'assets/scenes/dorm.jpg',
  museum: 'assets/scenes/museum.webp',
  library_west: 'assets/scenes/library_west.jpg',
  // 彩蛋场景
  cat: 'assets/scenes/cat.jpg',
  cinema: 'assets/scenes/cinema.jpg',
};
