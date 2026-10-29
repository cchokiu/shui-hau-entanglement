/* 路線三「歷史地景變遷見證人－水稻」資料。文字取自路線設計 Doc（2026-10-28 版）；Doc 的錯字已修正（見 PROJECT_LOG）。
   gps_dms 為 Sheet「Location」原文照錄；lat／lng 由 gps_dms 換算；precision 一律為 approx。
   status："gps_missing" 表示沒有 Sheet 座標（lat／lng 為 null，不上地圖）；"candidate" 表示以推斷位置代用。
   s1、s3、s5 的公開地標大約座標（Wikipedia）只作參考，保存在 gps_candidate，未用於地圖。
   s2 水口灣借用田地點 4.2 的座標（22°13'13.5"N 113°54'59.3"E），s4 禾寮取村屋較高位置（依 Chris 指示，22.2229, 113.9149），兩者皆為推斷、待確認。
   s6 嶼南道借用水牛點 3.2「馬路（來往貝澳）」的座標，為推斷，待確認。 */
window.ROUTE3 = {
  id: "rice",
  title: "三、歷史地景變遷見證人－水稻",
  intro: [
    "水稻曾是水口村重要的維生作物，也是塑造村落地景的力量。從「農耕—棄耕—復耕」的歷程中，它串連起村民的生計、水源的分配、土地的使用，以及人與其他生物的關係。水稻除了是水口村經濟轉型的見證人，更是老一輩村民深刻的地景記憶。一大片的金黃稻田景色，多年後仍然記憶猶新。讓水稻成為此路線的導遊，引領我們走進水口的歷史迴廊。"
  ],
  sources: [],
  related: ["laiwok", "clam"],
  stops: [
    { id: "s1", order: 1, name: "石壁村", era: "1625年", species: ["水稻"], point_ref: null, gps_dms: null, lat: null, lng: null, precision: "approx", status: "gps_missing",
      gps_candidate: { lat: 22.2275, lng: 113.8950, gps_dms: "22°13′39″N 113°53′42″E", source: "Wikipedia：石壁水塘（舊石壁村 1963 年被水塘淹沒），大約位置" },
      text: ["相傳池姓婦人為免兒子被徵召入伍從軍，由石壁村搬遷至水口，種水稻為生。"], photos: [], links: [], missing: ["【相片】1945年的航拍照片：Screenshot 2026-08-23 at 1.13.38 AM.png", "【相片】1959年的水口村及村內農地：Screenshot 2026-08-23 at 1.20.07 AM.png"] },
    { id: "s2", order: 2, name: "水口灣", era: "1945–1970年", species: ["水稻"], point_ref: "4.2", gps_dms: "22°13'13.5\"N 113°54'59.3\"E", lat: 22.220417, lng: 113.916472, precision: "approx", status: "candidate",
      text: ["水口村村民在水口灣的廣闊土地種植水稻，並輔以蔬菜、捕魚和飼養牲畜，形成近於自給自足的農村經濟。"], photos: [], links: [], missing: ["座標借用田地點 4.2，推斷，待確認", "【影片】水口村民祥叔講解如何利用石頭去除穀殼：DJI Copy_20260625165134_0034_D.MP4", "【相片】村民家中昔日用作去除穀殼的石頭：DSC08253.JPG"] },
    { id: "s3", order: 3, name: "長洲", era: "1945–1960年", species: ["水稻"], point_ref: null, gps_dms: null, lat: null, lng: null, precision: "approx", status: "gps_missing",
      gps_candidate: { lat: 22.210556, lng: 114.028889, gps_dms: "22°12′38″N 114°01′44″E", source: "Wikipedia：長洲，大約位置（相距水口約 11 km，不計入地圖範圍）" },
      text: ["水口村村民會將大部分農產品售往長洲，換取接近兩倍份量的次等米。"], photos: [], links: [], missing: ["【錄音】祥叔提及「到長洲賣東西，換柴米油鹽」：需找相關訪談剪接 Audio"] },
    { id: "s4", order: 4, name: "禾寮", era: "1945–1960年", species: ["水稻"], point_ref: null, gps_dms: null, lat: 22.2229, lng: 113.9149, precision: "approx", status: "candidate",
      text: ["在昔日的農耕時期，大戶的農戶一般會建一間禾寮，用來儲藏收割回來的數百斤以上穀物以及農具。"], photos: [], links: [], missing: ["推斷：村屋較高位置（依 Chris 指示），待實地確認", "【相片】農具：用作清除田內雜草：DSC08283_adjusted.JPG", "【相片】舊禾寮：待補相", "【相片】復修後的新禾寮：待補相"] },
    { id: "s5", order: 5, name: "塘福村", era: "1960年代", species: ["水稻"], point_ref: null, gps_dms: null, lat: null, lng: null, precision: "approx", status: "gps_missing",
      gps_candidate: { lat: 22.228, lng: 113.933, gps_dms: "22°13′41″N 113°55′59″E", source: "Wikipedia：塘福，大約位置" },
      text: [
        "塘福村及水口村村民因為兩村長期攤分同一水源，1962年因水源使用權有打鬥，當年政府隨即為水口另闢水源。但1963年天氣反常，清明節後仍未見降雨，加上水口水源供水異常緩慢，兩村再次因爭水出現紛爭，最終水口村在1964年早造青苗失收。",
        "此後，水口又因山泥沖毀農田或缺水等種種原因，分別於1966年及1967年農作物失收。"
      ], photos: [], links: [], missing: ["Doc 註：有村民錄音提及過嗎？（待查）"] },
    { id: "s6", order: 6, name: "嶼南道", era: "1960至1970年代", species: ["水稻"], point_ref: "3.2", gps_dms: "22°13'16.5\"N 113°54'52.3\"E", lat: 22.221250, lng: 113.914528, precision: "approx", status: "candidate",
      text: ["嶼南道建成及通車後，村落和農田分隔兩邊；因交通便利，加上市區工錢、從商利潤較農耕高，而且政府也開始提供廉租屋予市民申請，不少村民放棄當區農業，陸續遷到市區生活。"], photos: [], links: [], missing: ["【相片】1973年的航拍照片（可見嶼南道將水口村及農地分隔兩邊）：Screenshot 2026-08-23 at 1.13.45 AM.png", "座標借用水牛點 3.2「馬路（來往貝澳）」，推斷，待確認"] },
    { id: "s7", order: 7, name: "水口濕地", era: "1970年後", species: ["水稻"], point_ref: "3.4", gps_dms: "22°13'11.0\"N 113°54'59.5\"E", lat: 22.219722, lng: 113.916528, precision: "approx",
      text: [
        "農耕式微，水口村的農地相繼荒廢。失去定期耕作、蓄水與收割的農田，逐漸轉為淡水沼澤和濕地，成為水生植物、兩棲類、鳥類及其他野生動物的棲息地。",
        "由於灌溉設施失修、水源管理中斷，部分濕地乾涸；野草、灌木及入侵種擴張，使原本開闊的濕地與農田地景逐漸被茂密植被覆蓋。"
      ], photos: [], links: [], missing: ["【相片】1993年的航拍照片：Screenshot 2026-08-23 at 1.13.50 AM.png"] },
    { id: "s8", order: 8, name: "水口復耕稻田", era: "2021年", species: ["水稻"], point_ref: "5.1", gps_dms: "22°13'13.6\"N 113°54'58.7\"E", lat: 22.220444, lng: 113.916306, precision: "approx",
      text: ["2021年香港觀鳥會獲大嶼山保育基金資助，推行「山海之間——水口自然保育管理計劃」，2023年起透過開田、修復引水道、建設生態池與蓄水池，並與村民合作重新在水口村種植水稻。"], photos: [], links: [], missing: ["【錄音】祥叔提及「鳥會復耕米田，生態多咗」：新錄音 47.m4a（需找相關訪談剪接 Audio）", "【相片】水口村內由香港觀鳥會推行復耕的稻田：待補相"] },
    { id: "s9", order: 9, name: "水口村內", era: "", species: ["水稻"], point_ref: "5.2", gps_dms: "22°13'19.8\"N 113°54'52.4\"E", lat: 22.222167, lng: 113.914556, precision: "approx",
      text: ["稻米是本地客家人的傳統家常菜「瀨鑊邊」主要食材，「瀨鑊邊」在1960至1970年代十分普遍，當中的食材反映出該地區的環境特色。雖然水口村不是客家村，但與毗鄰客家村落長年交流和通婚下，飲食文化亦隨之交融流傳。水口村村民會從水口灣起行，採集當地海產沙白，經過農田時就採收自家種的蔬菜，回家後將食材煮成一鍋。"], photos: [], links: [], missing: ["【錄音】水口村民提及村內傳統會在兒子滿月時煮「瀨鑊邊」，與鄰里分享：新錄音 48.m4a（需剪走最後無關的對話）"] }
  ]
};
