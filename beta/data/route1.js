/* 路線一「瀨鑊邊：一頓飯的路線」資料。文字逐字取自內容資料。
   coordStatus 一律為 approx（大約位置）。 */
window.ROUTE1 = {
  id: "laiwok",
  title: "一、「瀨鑊邊」：一頓飯的路線",
  intro: [
    "「瀨鑊邊」是本地客家人的傳統家常菜。根據香港中文大學人類學系張展鴻教授研究沙頭角和南大嶼的客家飲食，「瀨鑊邊」在1960至1970年代十分普遍，當中的食材反映出該地區的環境特色。雖然水口村不是客家村，但與毗鄰客家村落長年交流和通婚下，飲食文化亦隨之交融流傳。",
    "按水口村民馮瑞珍分享，村民會從水口灣起行，採集當地海產沙白，經過農田時就採收自家種的蔬菜，回家後將食材煮成一鍋。村民順應季節當造的農產漁產，沿路就地取材，一道菜式呈現了在地人類與環境和其他物種的互動。"
  ],
  stops: [
    {
      n: 1,
      place: "水口灣",
      species: "文蛤",
      lat: 22.219528,
      lng: 113.919972,
      coordStatus: "approx",
      paragraphs: [
        "村民會從水口灣採集沙白。他們使用掘蜆工具例如翅口鐮或翅口耙，並收獲放進竹籮中。"
      ],
      media: [
        {
          type: "video",
          src: "https://drive.google.com/file/d/1T5TSQrBUepc0D8DIGk4NtlGMZ42mKsSw/preview",
          caption: "水口村民馮瑞珍展示如何使用翅口鐮",
          note: ""
        }
      ],
      meet: [
        { label: "文蛤（沙白）", color: "--c-clam" },
        { label: "人（村民）", color: "--black" }
      ]
    },
    {
      n: 2,
      place: "農田",
      species: "稻米、農產食品如九層塔、蔥、蔬菜",
      lat: 22.220417,
      lng: 113.916472,
      coordStatus: "approx",
      paragraphs: [
        "離開水口灣，村民經過田間小路時，就順道採收當季的農作物，例如葉菜、香蔥，作為「瀨鑊邊」的食材配料。",
        "稻田生產的大米是「瀨鑊邊」主要食材。村民每年種兩造稻米，收成的穀粒會存放在家，食用前才拿去舂米、去殼。"
      ],
      media: [
        {
          type: "image",
          src: "assets/route1/s2-ricefield.jpg",
          caption: "稻米田",
          note: ""
        }
      ],
      meet: [
        { label: "水稻", color: "--c-rice" },
        { label: "九層塔、蔥、蔬菜", color: "--text" }
      ]
    },
    {
      n: 3,
      place: "水口村",
      species: "大米、農產品從山上斬取的柴草，例如芒萁、松樹",
      lat: 22.222167,
      lng: 113.914556,
      coordStatus: "approx",
      paragraphs: [
        "家中有村民預先從後山搜集的柴草，以及自家種植的大米儲糧。",
        "烹煮「瀨鑊邊」時，村民先在灶頭裡燃點柴枝，並用石舂將米粒研磨成粉漿。大鐵鑊中爆香乾蔥、薑蒜，加入沙白和蔬菜熬煮成湯，再沿鑊邊瀨（酻）一圈粉漿，待粉漿熱熟成形後，便能鏟進湯中，一同熬煮。這道菜煮法省時方便，亦易飽腹，是水口村的家常菜式。"
      ],
      media: [
        {
          type: "image",
          src: "assets/route1/s3-pine-1.jpg",
          caption: "柴草：松樹、松果",
          note: ""
        },
        {
          type: "image",
          src: "assets/route1/s3-pine-2.jpg",
          caption: "柴草：松樹、松果",
          note: ""
        },
        {
          type: "image",
          src: "assets/route1/s3-fern.jpg",
          caption: "柴草：芒萁",
          note: ""
        },
        {
          type: "image",
          src: "assets/route1/s3-chopper.jpg",
          caption: "斬柴刀",
          note: ""
        },
        {
          type: "image",
          src: "assets/route1/s3-stove-1.jpg",
          caption: "以磚頭砌成的傳統柴火灶",
          note: ""
        },
        {
          type: "image",
          src: "assets/route1/s3-stove-2.jpg",
          caption: "以磚頭砌成的傳統柴火灶",
          note: ""
        },
        {
          type: "placeholder",
          src: "",
          caption: "瀨鑊邊",
          note: "待補相"
        }
      ],
      meet: [
        { label: "水稻（大米）", color: "--c-rice" },
        { label: "芒萁、松樹", color: "--text" },
        { label: "文蛤（沙白）", color: "--c-clam" }
      ]
    }
  ]
};
