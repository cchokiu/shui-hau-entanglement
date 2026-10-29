/* 物種標記點位（Sheet「Location」分頁）。
   gps_dms 為 Sheet 原文，一字不改；lat／lng 由 gps_dms 換算，取 6 位小數；precision 一律為 approx。
   此檔不含說明文字；missing 只作資料紀錄，前端不顯示。
   1.1、1.2 為沙白；3.1–3.5 為水牛；5.1、5.2 為水稻。 */
window.SPECIES_POINTS = [
  {
    id: "p1-1",
    order: null,
    name: "海",
    species: ["翅口（沙白）"],
    point_ref: "1.1",
    gps_dms: "22°13'15.5\"N 113°55'39.2\"E",
    lat: 22.220972,
    lng: 113.927556,
    precision: "approx",
    photos: [],
    missing: ["點位說明文字及相片：缺"]
  },
  {
    id: "p1-2",
    order: null,
    name: "泥灘",
    species: ["翅口（沙白）"],
    point_ref: "1.2",
    gps_dms: "22°13'10.3\"N 113°55'11.9\"E",
    lat: 22.219528,
    lng: 113.919972,
    precision: "approx",
    photos: [],
    missing: ["點位說明文字及相片：缺"]
  },
  {
    id: "p3-1",
    order: null,
    name: "馬路（來往貝澳）",
    species: ["水牛"],
    point_ref: "3.1",
    gps_dms: "22°13'19.9\"N 113°55'10.6\"E",
    lat: 22.222194,
    lng: 113.919611,
    precision: "approx",
    photos: [],
    missing: ["點位說明文字及相片：缺"]
  },
  {
    id: "p3-2",
    order: null,
    name: "馬路（來往貝澳）",
    species: ["水牛"],
    point_ref: "3.2",
    gps_dms: "22°13'16.5\"N 113°54'52.3\"E",
    lat: 22.221250,
    lng: 113.914528,
    precision: "approx",
    photos: [],
    missing: ["點位說明文字及相片：缺"]
  },
  {
    id: "p3-3",
    order: null,
    name: "田／濕地",
    species: ["水牛"],
    point_ref: "3.3",
    gps_dms: "22°13'13.9\"N 113°54'58.5\"E",
    lat: 22.220528,
    lng: 113.916250,
    precision: "approx",
    photos: [],
    missing: ["點位說明文字及相片：缺"]
  },
  {
    id: "p3-4",
    order: null,
    name: "濕地／沼澤地",
    species: ["水牛"],
    point_ref: "3.4",
    gps_dms: "22°13'11.0\"N 113°54'59.5\"E",
    lat: 22.219722,
    lng: 113.916528,
    precision: "approx",
    photos: [],
    missing: ["點位說明文字及相片：缺"]
  },
  {
    id: "p3-5",
    order: null,
    name: "泥灘",
    species: ["水牛"],
    point_ref: "3.5",
    gps_dms: "22°13'14.1\"N 113°55'08.0\"E",
    lat: 22.220583,
    lng: 113.918889,
    precision: "approx",
    photos: [],
    missing: ["點位說明文字及相片：缺"]
  },
  {
    id: "p5-1",
    order: null,
    name: "田／濕地",
    species: ["水稻"],
    point_ref: "5.1",
    gps_dms: "22°13'13.6\"N 113°54'58.7\"E",
    lat: 22.220444,
    lng: 113.916306,
    precision: "approx",
    photos: [],
    missing: ["點位說明文字及相片：缺"]
  },
  {
    id: "p5-2",
    order: null,
    name: "村",
    species: ["水稻"],
    point_ref: "5.2",
    gps_dms: "22°13'19.8\"N 113°54'52.4\"E",
    lat: 22.222167,
    lng: 113.914556,
    precision: "approx",
    photos: [],
    missing: ["點位說明文字及相片：缺"]
  }
];
