/* 水口共用示意資料（公開版）
 * 來源：項目 Drive 內的 Data Catalogue、物種編碼敘事整合、Mapping draft、會議紀錄。
 * 村民以代號標示：村民 A、村民 B、村民 C 家庭、村民 D、村民 E。直接引述已改為轉述。
 * status: "observed" 研究員觀察／影像紀錄；"oral" 村民口述未核實；"consensus" 多人口述一致；"check" 待科學核實；"conflict" 爭議
 * 標明 simulated:true 的資料是為示範介面而擬，並非真實紀錄。
 */
window.SHUIHAU = {
  meta: {
    title: "水口生物多樣性數碼地圖",
    center: [22.2205, 113.9175],
    note: "示意資料，供討論介面之用；年代與數量未經核實。"
  },

  places: [
    { id: "sea", zh: "海", en: "Sea" },
    { id: "flat", zh: "泥灘", en: "Mudflat" },
    { id: "village", zh: "村", en: "Village" },
    { id: "forest", zh: "林", en: "Woodland" },
    { id: "field", zh: "田／濕地", en: "Paddy / wetland" },
    { id: "marsh", zh: "濕地／沼澤地", en: "Marsh" },
    { id: "road", zh: "馬路（來往貝澳）", en: "Road to Pui O" },
    { id: "orchard", zh: "果園", en: "Orchard" }
  ],

  /* 地圖檢查點，GPS 取自 Data Catalogue（大約位置） */
  checkpoints: [
    { id: "1.1", species: "clam", place: "sea", lat: 22.220972, lng: 113.927556 },
    { id: "1.2", species: "clam", place: "flat", lat: 22.219528, lng: 113.919972 },
    { id: "2.1", species: "cattle", place: "village", lat: 22.221583, lng: 113.914194 },
    { id: "2.2", species: "cattle", place: "forest", lat: 22.222333, lng: 113.916222, alt: { lat: 22.219833, lng: 113.91375, label: "林（往蘿萁灣）" } },
    { id: "2.3", species: "cattle", place: "field", lat: 22.22075, lng: 113.916417 },
    { id: "3.1", species: "buffalo", place: "road", lat: 22.222194, lng: 113.919611 },
    { id: "3.2", species: "buffalo", place: "road", lat: 22.22125, lng: 113.914528 },
    { id: "3.3", species: "buffalo", place: "field", lat: 22.220528, lng: 113.91625 },
    { id: "3.4", species: "buffalo", place: "marsh", lat: 22.219722, lng: 113.916528 },
    { id: "3.5", species: "buffalo", place: "flat", lat: 22.220583, lng: 113.918889 },
    { id: "4.1", species: "human", place: "village", lat: 22.222167, lng: 113.914556 },
    { id: "4.2", species: "human", place: "field", lat: 22.220417, lng: 113.916472 },
    { id: "4.3", species: "human", place: "forest", lat: 22.219722, lng: 113.914, label: "林（往蘿萁灣）" },
    { id: "4.4", species: "human", place: "flat", lat: 22.219528, lng: 113.919972 },
    { id: "4.5", species: "human", place: "forest", lat: 22.222333, lng: 113.916222 },
    { id: "4.6", species: "human", place: "orchard", lat: 22.218056, lng: 113.91825 },
    { id: "4.7", species: "human", place: "sea", lat: 22.220972, lng: 113.927556 },
    { id: "5.1", species: "rice", place: "field", lat: 22.220444, lng: 113.916306 },
    { id: "5.2", species: "rice", place: "village", lat: 22.222167, lng: 113.914556 }
  ],

  /* 節點：四個主角物種、人、以及關係中出現的其他生命、機構與物件 */
  nodes: [
    { id: "clam", zh: "沙白（刺口）", en: "Sand clam", sci: "Meretrix spp.", kind: "species", main: true, color: "--c-clam",
      blurb: "潮間帶的蜆類，村民叫刺口或翅口。在灘上幾乎不移動，靠濾食海水中的微藻生長；殼上的細紋記下潮汐與季節。" },
    { id: "buffalo", zh: "水牛", en: "Water buffalo", sci: "Bubalus bubalis", kind: "species", main: true, color: "--c-buffalo",
      blurb: "村民說水牛多由貝澳一帶過來，常在馬路與小路上出現。牠們在濕地打滾，形成的水氹成為其他小生物的棲所。" },
    { id: "cattle", zh: "黃牛", en: "Feral cattle", sci: "Bos taurus", kind: "species", main: true, color: "--c-cattle",
      blurb: "耕作年代的夥伴。棄耕後牛群在村、林、田之間活動。村民口述指本地牛隻曾經絕育後減少。" },
    { id: "rice", zh: "水稻", en: "Rice", sci: "Oryza sativa", kind: "species", main: true, color: "--c-rice",
      blurb: "曾是村民主糧。1960 年代灌溉水源改變後棄耕；近年有團體復耕，稻田同時成為雀鳥的覓食地。" },
    { id: "villager", zh: "村民", en: "Villagers", kind: "human", main: true, color: "--c-human",
      blurb: "人類在這張地圖上是其中一條物種路線：採沙白、耕田、斬柴、摘蔥，把不同生命帶進同一個廚房。" },
    { id: "visitor", zh: "遊客", en: "Visitors", kind: "human", color: "--c-visitor", blurb: "掘蜆、拍牛、行山的訪客。" },
    { id: "birdclub", zh: "觀鳥團體", en: "Birdwatching NGO", kind: "org", color: "--c-club", blurb: "近年復耕稻田以吸引雀鳥。" },
    { id: "gov", zh: "政府部門", en: "Government", kind: "org", color: "--c-human", blurb: "管理牛隻與水源的機構。" },
    { id: "reservoir", zh: "石壁水塘", en: "Shek Pik Reservoir", kind: "infrastructure", color: "--c-human", blurb: "1960 年代興建，截取山水。" },
    { id: "frog", zh: "蛙類", en: "Frogs", kind: "species", color: "--c-club", blurb: "包括盧氏小樹蛙（待科學核實）。" },
    { id: "dragonfly", zh: "蜻蜓、小魚小蟹", en: "Dragonflies, small fish and crabs", kind: "species", color: "--c-club", blurb: "利用牛打滾形成的水氹。" },
    { id: "egret", zh: "鷺鳥", en: "Egrets", kind: "species", color: "--c-visitor", blurb: "在復耕稻田覓食。村民稱白鶴。" },
    { id: "bee", zh: "蜜蜂", en: "Bees", kind: "species", color: "--c-rice", blurb: "村民說以前田邊多蜜蜂，為作物傳粉。" },
    { id: "scallion", zh: "蔥", en: "Spring onion", kind: "species", color: "--c-club", blurb: "年尾至年初擔去西環菜欄。" },
    { id: "sweetpotato", zh: "番薯", en: "Sweet potato", kind: "species", color: "--c-rice", blurb: "九月割禾後種在田裡。" },
    { id: "herbs", zh: "山林草藥", en: "Wild herbs", kind: "species", color: "--c-club", blurb: "雞屎藤、地膽草、布渣葉、油甘子、山棯等。" },
    { id: "firewood", zh: "柴草", en: "Firewood", kind: "material", color: "--c-cattle", blurb: "松樹、芒萁，曾以蝦艇運往長洲賣。" },
    { id: "crab", zh: "馬蹄蟹", en: "Horseshoe crab", kind: "species", color: "--c-buffalo", blurb: "村民說以前很多、很大隻，現在少見。" },
    { id: "urchin", zh: "海膽", en: "Sea urchin", kind: "species", color: "--c-clam", blurb: "曾是早期旅遊的買賣對象。" },
    { id: "cattletrail", zh: "牛徑", en: "Cattle trail", kind: "infrastructure", color: "--c-cattle", blurb: "籮箕灣至水口的行山徑前身。" },
    { id: "pond", zh: "牛打滾的水氹", en: "Wallow pond", kind: "place", color: "--c-tide", blurb: "牛的身體造出的小型濕地。" },
    { id: "dish", zh: "瀨鑊邊", en: "Lai wok bin (rice-batter dish)", kind: "practice", color: "--c-human", blurb: "沙白、蔥、自種米磨的粘米粉、山上斬來的柴，一鑊煮成。" },
    { id: "camera", zh: "紅外線相機", en: "Trail camera", kind: "instrument", color: "--c-tide", blurb: "定時 21:00 至 04:00 拍攝。" },
    { id: "audiomoth", zh: "AudioMoth 錄音器", en: "AudioMoth recorder", kind: "instrument", color: "--c-tide", blurb: "長時間錄下濕地聲景。" }
  ],

  /* 有類型的關係；verb 取自受控詞彙 */
  verbs: ["食／被食", "造棲地", "踩出／開路", "採集", "耕作／飼養", "傳粉", "截水／改變水源", "取代／佔據", "買賣", "記錄", "衝突", "曾經"],
  relations: [
    { from: "buffalo", to: "pond", verb: "造棲地", period: "現在", cp: "3.4", source: "研究員觀察（Mapping draft）", status: "observed", note: "在濕地打滾，壓出水氹" },
    { from: "pond", to: "dragonfly", verb: "造棲地", period: "現在", cp: "3.4", source: "研究員觀察", status: "observed", note: "蜻蜓、小魚小蟹在水氹棲息" },
    { from: "pond", to: "frog", verb: "造棲地", period: "現在", cp: "3.3", source: "研究員觀察", status: "observed" },
    { from: "cattle", to: "frog", verb: "造棲地", period: "現在", cp: "2.3", source: "Emilie 地圖簡介", status: "check", note: "打滾、吃草清疏水道，有利盧氏小樹蛙" },
    { from: "reservoir", to: "rice", verb: "截水／改變水源", period: "1960 年代", cp: "5.1", source: "村民 A（第一、二次訪問）", status: "oral", note: "截取山水，稻田灌溉失效" },
    { from: "villager", to: "rice", verb: "曾經", period: "耕作期", cp: "5.1", source: "村民 A、村民 B", status: "consensus", note: "以前全部都是耕種為生" },
    { from: "birdclub", to: "rice", verb: "耕作／飼養", period: "近年", cp: "5.1", source: "村民 A", status: "oral", note: "復耕種稻" },
    { from: "rice", to: "egret", verb: "造棲地", period: "近年", cp: "5.1", source: "村民 A", status: "oral", note: "復耕後雀鳥增加" },
    { from: "birdclub", to: "villager", verb: "衝突", period: "近年", cp: "4.2", source: "村民 A（第二次訪問）", status: "conflict", note: "村民指觀鳥團體截走農田用水" },
    { from: "villager", to: "cattle", verb: "曾經", period: "耕作期", cp: "4.2", source: "村民 A、村民 C 家庭", status: "consensus", note: "以黃牛耕田，因此不吃牛肉" },
    { from: "gov", to: "cattle", verb: "衝突", period: "近數十年", cp: "2.1", source: "村民 A（第一次訪問）", status: "oral", note: "村民口述：絕育後本地牛隻減少" },
    { from: "cattle", to: "cattletrail", verb: "踩出／開路", period: "過去", cp: "2.2", source: "村民 B（第二次訪問）", status: "oral", note: "牛徑後來成為行山徑" },
    { from: "cattle", to: "sweetpotato", verb: "食／被食", period: "過去", cp: "2.2", source: "村民 B", status: "oral", note: "牛在林邊吃飽了，就不會偷吃人種的番薯" },
    { from: "villager", to: "clam", verb: "採集", period: "過去至今", cp: "4.4", source: "村民 B（第三次訪問）、村民 C 家庭", status: "observed", note: "用刺口鉗，認沙面的「眼」" },
    { from: "visitor", to: "clam", verb: "買賣", period: "近年", cp: "4.4", source: "村民 B（第三次訪問）", status: "oral", note: "曾一次賣給遊客四百元" },
    { from: "visitor", to: "clam", verb: "衝突", period: "近年", cp: "1.2", source: "村民 B", status: "conflict", note: "以前整個灘都有，現在要走到近水線才有" },
    { from: "villager", to: "crab", verb: "曾經", period: "過去", cp: "4.4", source: "村民 B、村民 C 家庭", status: "consensus", note: "以前會捉來吃，現在少見" },
    { from: "bee", to: "scallion", verb: "傳粉", period: "過去", cp: "4.2", source: "村民 A", status: "oral", note: "以前田邊多蜜蜂" },
    { from: "villager", to: "herbs", verb: "採集", period: "過去至今", cp: "4.3", source: "村民 B、研究員", status: "observed" },
    { from: "villager", to: "firewood", verb: "採集", period: "過去", cp: "4.3", source: "村民 A", status: "oral", note: "斬柴，以蝦艇運往長洲賣" },
    { from: "clam", to: "dish", verb: "食／被食", period: "過去", cp: "4.1", source: "Mapping draft", status: "oral" },
    { from: "scallion", to: "dish", verb: "食／被食", period: "過去", cp: "4.1", source: "Mapping draft", status: "oral" },
    { from: "rice", to: "dish", verb: "食／被食", period: "過去", cp: "4.1", source: "Mapping draft", status: "oral", note: "自種米磨成粘米粉" },
    { from: "firewood", to: "dish", verb: "食／被食", period: "過去", cp: "4.1", source: "Mapping draft", status: "oral", note: "柴火灶" },
    { from: "buffalo", to: "villager", verb: "取代／佔據", period: "現在", cp: "3.2", source: "訪談影片", status: "observed", note: "水牛佔路，母子避牛" },
    { from: "camera", to: "cattle", verb: "記錄", period: "現在", cp: "2.3", source: "紅外線相機", status: "observed" },
    { from: "audiomoth", to: "frog", verb: "記錄", period: "現在", cp: "3.4", source: "AudioMoth", status: "observed" }
  ],

  /* 路徑（方案 03） */
  trails: [
    { id: "laiwok", zh: "瀨鑊邊：一頓飯的路線", lead: "villager",
      intro: "人類被「降格」為眾多物種路線之一。這條路線把不在重點名單上的生命也帶進來。",
      stops: [
        { cp: "4.4", title: "泥灘：採沙白", text: "退潮時在沙面找「眼」，用刺口鉗插入約四寸。村民 B 說這種眼力教不來，要自己看。", meet: ["clam"], media: "影片：示範刺口鉗（村民 B，第三次訪問）" },
        { cp: "4.2", title: "田：摘蔥摘菜", text: "年尾至年初是蔥的季節，以前會擔去西環菜欄賣。", meet: ["scallion", "bee"], media: "錄音：村民 A 談蔥的季節" },
        { cp: "4.3", title: "林（往蘿萁灣）：斬柴", text: "山上的松樹與芒萁是柴火，也曾用蝦艇運往長洲賣。沿路有雞屎藤、地膽草、布渣葉。", meet: ["firewood", "herbs"], media: "相片：山林草藥（研究員）" },
        { cp: "4.1", title: "村：舂米、煮瀨鑊邊", text: "門前的石是以前舂米的台。自種米磨成粘米粉，加沙白和蔥，柴火灶上一鑊煮成。", meet: ["rice", "dish"], media: "影片：舂米石示範（村民 A）" }
      ] },
    { id: "buffalo", zh: "水牛的一天", lead: "buffalo",
      intro: "按檢查點 3.1 至 3.5，由馬路走到泥灘。",
      stops: [
        { cp: "3.1", title: "馬路（來往貝澳）", text: "村民說水牛多由貝澳那邊過來。", meet: ["visitor"], media: "相片：水牛擋路（研究員）" },
        { cp: "3.2", title: "村邊小路", text: "身軀與小路差不多一樣寬。一對母子遇上約十隻水牛，小朋友仰望著，覺得牠們很大。", meet: ["villager"], media: "影片：母子避牛" },
        { cp: "3.3", title: "田／濕地", text: "吃草。村民說以前草坪不廣，要小助跑才能回到小路。", meet: ["rice", "egret"], media: "影片：踏進泥氹的身姿" },
        { cp: "3.4", title: "濕地／沼澤地", text: "打滾。壓出的水氹成為蜻蜓、蛙、小魚小蟹的棲所。", meet: ["pond", "frog", "dragonfly"], media: "聲音：濕地聲景（AudioMoth）" },
        { cp: "3.5", title: "泥灘", text: "有時會走到灘上，與掘沙白的人和遊客同在。", meet: ["clam", "visitor"], media: "影片：水牛漫步灘上" }
      ] }
  ],

  /* 二十四節氣，0 = 立春 */
  solarTerms: ["立春","雨水","驚蟄","春分","清明","穀雨","立夏","小滿","芒種","夏至","小暑","大暑","立秋","處暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至","小寒","大寒"],
  /* 2026 年各節氣開始日期（香港天文台資料，約數；示意） */
  solarTermDates2026: ["02-04","02-18","03-05","03-20","04-05","04-20","05-05","05-21","06-05","06-21","07-07","07-23","08-07","08-23","09-07","09-23","10-08","10-23","11-07","11-22","12-07","12-22","01-05","01-20"],
  /* 活動；start/end 以節氣序號表示（可跨年），lunar 為村民原本的農曆說法 */
  calendar: [
    { id: "rice1", node: "rice", zh: "一造水稻", start: 0, end: 12, lunar: "正月開田翻泥，三月插秧，四月轉禾，五月除草，六月割禾", source: "村民 B（第二次訪問）" },
    { id: "rice2", node: "rice", zh: "二造水稻", start: 11, end: 18, lunar: "六月尾再插秧，九月收割", source: "村民 B（第二次訪問）" },
    { id: "autumn", node: "rice", zh: "立秋前要落田", start: 12, end: 12.4, lunar: "立秋前一定要落田", source: "訪談觀察（Emily）", marker: true },
    { id: "scallion", node: "scallion", zh: "蔥、番薯", start: 17, end: 24, lunar: "九月後種番薯和蔥；年尾至年初擔蔥去西環", source: "村民 A、村民 B" },
    { id: "taro", node: "rice", zh: "種芋頭", start: 0, end: 1, lunar: "正月初種芋頭", source: "村民 B" },
    { id: "squid", node: "villager", zh: "釣大墨魚", start: 2, end: 10, lunar: "二月到五月（未確認農曆或西曆）", source: "村民 A" },
    { id: "clamSummer", node: "clam", zh: "沙白：日間低潮，易掘", start: 6, end: 13, lunar: "夏季較易", source: "會議紀錄（Helen）" },
    { id: "clamWinter", node: "clam", zh: "沙白：低潮多在凌晨", start: 20, end: 24, lunar: "冬季潮汐關係較難", source: "Mapping draft" }
  ],

  /* 示意潮汐：以正弦近似，僅供介面示範，並非天文台預報 */
  tide: { simulated: true, periodHours: 12.42, meanM: 1.3, ampM: 0.9, lowTideRef: "2026-10-12T05:10:00+08:00", lowThresholdM: 0.8 },

  /* 夜班時間軸（方案 05）——全部為模擬示範資料 */
  night: {
    simulated: true,
    window: ["21:00", "04:00"],
    bands: [
      { id: "insect", zh: "昆蟲", khz: [4, 12], activity: [[21, 0.9], [23, 1], [1, 0.8], [3, 0.6], [4, 0.5]] },
      { id: "frog", zh: "蛙", khz: [1, 4], activity: [[21, 1], [22, 0.9], [0, 0.5], [2, 0.3], [4, 0.2]] },
      { id: "bird", zh: "雀鳥", khz: [2, 8], activity: [[21, 0.2], [0, 0.05], [3, 0.2], [3.75, 0.7], [4, 0.9]] },
      { id: "low", zh: "低頻（牛步、風、浪）", khz: [0, 1], activity: [[21, 0.4], [23, 0.5], [1, 0.6], [3, 0.4], [4, 0.4]] }
    ],
    cameraEvents: [
      { t: "21:42", what: "黃牛 2 隻", conf: "高", cp: "2.3" },
      { t: "22:15", what: "未能辨認（快速移動）", conf: "低", cp: "2.3" },
      { t: "23:58", what: "黃牛 1 隻", conf: "中", cp: "2.3" },
      { t: "01:07", what: "水牛 1 隻", conf: "高", cp: "3.4" },
      { t: "02:14", what: "水牛 3 隻，其中一隻打滾", conf: "中", cp: "3.4" },
      { t: "03:31", what: "細小哺乳類？", conf: "低", cp: "3.4" }
    ],
    limits: ["AudioMoth 錄不到超過約 12 kHz 以上的部分蝙蝠聲（視設定）", "紅外線相機只在有熱源移動時觸發，靜止的動物不會被拍到", "夜間畫面為黑白，難以分辨顏色與個體", "物種辨認是候選答案，需本地專家核實"]
  },

  /* 因果鏈（方案 06） */
  chain: [
    { period: "1960 年代前", title: "山水灌田", text: "村民幾乎全部以耕種為生，山水沿溪流入稻田，黃牛耕田。", active: ["villager", "rice", "cattle"], scene: "paddy" },
    { period: "1960 年代", title: "石壁水塘截山水", text: "水塘工程截取山水，稻田灌溉變得困難。", active: ["reservoir", "rice"], scene: "cut" },
    { period: "1970 至 1990 年代", title: "棄耕", text: "田地荒廢，村民轉向其他生計。牛群不再耕作。", active: ["rice", "cattle", "villager"], scene: "abandon" },
    { period: "此後約 30 至 40 年", title: "濕地與紅樹林形成", text: "沒有人耕的田慢慢變成濕地，水牛進駐打滾，形成水氹。", active: ["buffalo", "pond", "frog", "dragonfly"], scene: "wetland" },
    { period: "近年", title: "復耕與雀鳥", text: "觀鳥團體復耕種稻，雀鳥增加。", active: ["birdclub", "rice", "egret"], scene: "restore" },
    { period: "近年", title: "誰的水？", text: "同一片田，對不同的人有不同意義。下面並列幾種說法，不作裁決。", active: ["birdclub", "villager", "rice"], scene: "conflict", voices: true }
  ],
  voices: [
    { who: "村民 A", role: "村民", text: "認為觀鳥團體復耕時把水截走，影響傳統農田用水。", status: "oral" },
    { who: "村民 B", role: "村民", text: "質疑外來團體沒有耕作經驗，復耕未必做得到以前的樣子。", status: "oral" },
    { who: "觀鳥團體", role: "保育團體", text: "（待訪問）復耕令雀鳥覓食地增加。", status: "pending" },
    { who: "科學資料", role: "科學", text: "（待補充）稻田對濕地雀鳥的生態價值研究。", status: "pending" }
  ]
};
