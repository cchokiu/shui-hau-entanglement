/* 路線二「如果我是一隻沙白」資料。文字取自路線設計 Doc（2026-10-28 版）。
   「//」包住的草稿句不收錄；Doc 的錯字已修正（見 PROJECT_LOG）。
   gps_dms 為 Sheet「Location」原文照錄；lat／lng 由 gps_dms 換算（6 位小數）；precision 一律為 approx。
   status：沒有 Sheet 座標的站點為 "gps_missing"（lat／lng 為 null）；候選位置為 "candidate"。
   missing 只作資料紀錄，前端不顯示。 */
window.ROUTE2 = {
  id: "clam",
  title: "二、如果我是一隻沙白",
  intro: [
    "如果你是一隻沙白，會如何感知這個世界和周遭地景的變遷？此路線將帶你從沙白的視角，感受沙白在水口灘生活的心路歷程，讓我們從人類高高在上的視角轉換到泥灘內的沙層之中，想像沙白是如何看待同類、人類活動同自然環境的變化。"
  ],
  sources: [],
  related: ["laiwok"],
  stops: [
    { id: "s1", order: 1, name: "水口灣", species: ["翅口（沙白）"], point_ref: "1.1", gps_dms: "22°13'15.5\"N 113°55'39.2\"E", lat: 22.220972, lng: 113.927556, precision: "approx",
      text: ["和暖的海水浸沒整個身軀，沙子劃過外殼、溜進兩瓣殼之間的狹縫，這種熟悉不過的觸感，構成我的日常。"],
      photos: [], links: [], missing: ["【相片】水口灘的沙白：DSC08818_adj.JPG"] },
    { id: "s2", order: 2, name: "泥灘（潮退時會露出的部分）", species: ["翅口（沙白）"], point_ref: "1.2", gps_dms: "22°13'10.3\"N 113°55'11.9\"E", lat: 22.219528, lng: 113.919972, precision: "approx",
      text: ["這兒的四足大怪獸不時走來想掘走我的同類，我們雖說不上是「同伴」，但知道他們被那個尖尖的東西刺到的下場，也沒有太好受呢。我們不像那些魚蝦蟹，能夠快速移動救自己脫離險境，最多只能用盡全力靠斧足鑽進沙子裡。躲不過的時候，也只能奢求那些大怪獸嫌棄沙子太多，把我們放回水中。"],
      photos: [], links: [], missing: ["【影片】水口村民馮瑞珍展示如何使用翅口鐮尋找沙白位置：翅口鐮.mp4", "【相片】沙白／蜆（？）伸出斧足（TBC）：DSC08930.JPG", "【相片】其他泥灘生物：DSC08926.JPG、DSC08977.JPG、DSC08825_adj.JPG、DSC08803_adj.JPG（TBC）", "【影片】蟹：C2586.MP4"] },
    { id: "s3", order: 3, name: "水口灣", species: ["翅口（沙白）"], point_ref: "1.1", gps_dms: "22°13'15.5\"N 113°55'39.2\"E", lat: 22.220972, lng: 113.927556, precision: "approx",
      text: ["喜歡每天那段身軀能夠被海水完全覆蓋的時間，能夠隱身於水和沙之中，不用擔心四足大怪獸的突襲，只顧在黑暗的沙層靜靜待著就很好了。"],
      photos: [], links: [{ label: "天文潮汐預測資訊（石壁）", url: "https://www.hko.gov.hk/tc/tide/predtide.htm?s=SPW" }], missing: ["【相片】水口灘沙層：DSC08958.JPG"] },
    { id: "s4", order: 4, name: "泥灘（潮退時會露出的部分）", species: ["翅口（沙白）"], point_ref: "1.2", gps_dms: "22°13'10.3\"N 113°55'11.9\"E", lat: 22.219528, lng: 113.919972, precision: "approx",
      text: ["最近有一些大怪獸拿著一個方方正正的東西來到泥灘，那個東西上面有個跟我們身軀差不多大的洞，只見他們把那個東西套在同類們身上，是甚麼新發明用來抓我們嗎？似乎不是，穿過那個洞的同類，就這樣原封不動的留在泥灘上，看來是個好東西？"],
      photos: [], links: [{ label: "WWF 蜆類保育尺（相片來源：WWF 網頁）", url: "https://www.wwf.org.hk/oceans/advocating_for_more_marine_protected_areas/clam_gauge/" }], missing: ["【相片】蜆尺（WWF 網頁相片，未下載）"] },
    { id: "s5", order: 5, name: "泥灘（潮退時會露出的部分）", species: ["翅口（沙白）"], point_ref: "1.2", gps_dms: "22°13'10.3\"N 113°55'11.9\"E", lat: 22.219528, lng: 113.919972, precision: "approx",
      text: ["又一次的海水退去，每次身軀露出水面都讓我緊張不已，希望大怪獸們不要留意到我的存在。每次有堅硬的東西插進沙裡，每一下的移動都足以令我缺氧死掉了——有時真的想知道，我們究竟有多好吃？值得讓那些怪獸們帶上不同的東西來撥開泥沙、走進水裡去找我們？他們的身軀如此龐大，究竟要吃多少才會覺得飽呢？"],
      photos: [], links: [], missing: ["【相片】沙白埋藏在沙底時延伸出沙面的蜆眼（圍頭話稱「翅口眼」）：DSC08956.JPG", "【相片】底棲動物的洞口與活動痕跡：DSC08992.JPG", "【相片】遊客在水口泥灘摸蜆：DSC08929.JPG"] },
    { id: "s6", order: 6, name: "水口村", species: ["翅口（沙白）"], point_ref: "5.2", gps_dms: "22°13'19.8\"N 113°54'52.4\"E", lat: 22.222167, lng: 113.914556, precision: "approx",
      text: ["或許直到我死去的一天，也不會知道真正的答案。"],
      photos: [], links: [], missing: ["【相片】客家傳統菜式「瀨鑊邊」：待補相"] }
  ]
};
