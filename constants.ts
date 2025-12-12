import { Attraction } from './types';

export const PROVINCES = [
  "河南", "北京", "四川", "云南", "陕西", "浙江", "江苏", "广东", "湖南", "新疆"
];

export const ATTRACTIONS: Attraction[] = [
  // --- 河南 (Priority: Kaifeng First) ---
  {
    id: 'hn-kf-1',
    name: '清明上河园',
    province: '河南',
    description: '位于开封市龙亭湖西岸，是以画家张择端的写实画作《清明上河图》为蓝本，以宋朝市井文化为主题的大型文化主题公园。',
    imageUrl: 'https://picsum.photos/800/600?random=101',
    tags: ['开封', '宋代文化', '实景演出', '5A景区'],
    rating: 4.8,
    coordinates: { lat: 34.8093, lng: 114.3377 }
  },
  {
    id: 'hn-kf-2',
    name: '开封府',
    province: '河南',
    description: '位于开封市包公东湖北岸，是北宋京都官吏行政、司法的衙署，被誉为“天下首府”，包龙图扶正祛邪之地。',
    imageUrl: 'https://picsum.photos/800/600?random=102',
    tags: ['开封', '历史', '包青天', '府衙'],
    rating: 4.7,
    coordinates: { lat: 34.7936, lng: 114.3541 }
  },
  {
    id: 'hn-kf-3',
    name: '万岁山大宋武侠城',
    province: '河南',
    description: '位于开封市，是一座以大宋武侠文化为核心的主题景区，以《三打祝家庄》等实景剧演出闻名，江湖气息浓厚。',
    imageUrl: 'https://picsum.photos/800/600?random=103',
    tags: ['开封', '武侠', '王婆说媒', '实景剧'],
    rating: 4.6,
    coordinates: { lat: 34.8192, lng: 114.3245 }
  },
  {
    id: 'hn-kf-4',
    name: '龙亭公园',
    province: '河南',
    description: '位于开封市中山路北端，建于六朝皇宫遗址之上，以金碧辉煌、气势雄伟的龙亭大殿为主，是开封文物古迹的一个代表。',
    imageUrl: 'https://picsum.photos/800/600?random=104',
    tags: ['开封', '皇家园林', '菊花展', '历史'],
    rating: 4.5,
    coordinates: { lat: 34.8105, lng: 114.3482 }
  },
  // --- 河南 (Luoyang) ---
  {
    id: 'hn-ly-1',
    name: '龙门石窟',
    province: '河南',
    description: '中国四大石窟之一，世界文化遗产，位于洛阳市南郊伊河两岸，拥有卢舍那大佛等数十万尊造像，展现了北魏至唐代的佛教艺术高峰。',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    tags: ['洛阳', '世界遗产', '石窟艺术', '佛教'],
    rating: 4.9,
    coordinates: { lat: 34.5562, lng: 112.4687 }
  },
  {
    id: 'hn-ly-2',
    name: '老君山',
    province: '河南',
    description: '位于洛阳市栾川县，八百里伏牛山主峰，道教圣地，因太上老君李耳在此归隐修炼而得名，金顶云海蔚为壮观。',
    imageUrl: 'https://picsum.photos/800/600?random=105',
    tags: ['洛阳', '道教名山', '云海', '自然风光'],
    rating: 4.9,
    coordinates: { lat: 33.7258, lng: 111.6433 }
  },
  {
    id: 'hn-ly-3',
    name: '白马寺',
    province: '河南',
    description: '位于洛阳市东郊，创建于东汉永平十一年（公元68年），是佛教传入中国后兴建的第一座官办寺院，被誉为“中国第一古刹”。',
    imageUrl: 'https://picsum.photos/800/600?random=106',
    tags: ['洛阳', '佛教祖庭', '古刹', '历史'],
    rating: 4.7,
    coordinates: { lat: 34.7214, lng: 112.5997 }
  },
  // --- 河南 (Zhengzhou) ---
  {
    id: 'hn-zz-1',
    name: '少林寺',
    province: '河南',
    description: '位于登封市嵩山五乳峰下，禅宗祖庭，武林圣地。以禅宗文化和少林武术闻名于世。',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    tags: ['郑州', '功夫', '禅宗', '名山'],
    rating: 4.8,
    coordinates: { lat: 34.5074, lng: 112.9326 }
  },
  {
    id: 'hn-zz-2',
    name: '河南博物院',
    province: '河南',
    description: '位于郑州市，国家级重点博物馆，馆藏文物17万余件，尤以史前文物、商周青铜器、历代陶瓷器、玉器最具特色。',
    imageUrl: 'https://picsum.photos/800/600?random=107',
    tags: ['郑州', '历史', '国宝', '博物馆'],
    rating: 4.9,
    coordinates: { lat: 34.7924, lng: 113.6667 }
  },
  {
    id: 'hn-zz-3',
    name: '只有河南·戏剧幻城',
    province: '河南',
    description: '位于郑州市中牟县，由王潮歌导演，拥有21个剧场，是目前中国规模最大、演出时长最长的戏剧聚落群。',
    imageUrl: 'https://picsum.photos/800/600?random=108',
    tags: ['郑州', '戏剧', '文化体验', '打卡'],
    rating: 4.8,
    coordinates: { lat: 34.7289, lng: 114.0203 }
  },
  // --- 河南 (Others) ---
  {
    id: 'hn-jz-1',
    name: '云台山',
    province: '河南',
    description: '位于焦作市修武县，以独具特色的“北方岩溶地貌”和“云台山水”被列入首批世界地质公园名录，红石峡景色绝美。',
    imageUrl: 'https://picsum.photos/800/600?random=4',
    tags: ['焦作', '地质奇观', '山水', '5A景区'],
    rating: 4.9,
    coordinates: { lat: 35.4244, lng: 113.3644 }
  },
  {
    id: 'hn-ay-1',
    name: '殷墟',
    province: '河南',
    description: '位于安阳市，是中国商代晚期的都城遗址，甲骨文的发现地，世界文化遗产，证明了中国商代历史的存在。',
    imageUrl: 'https://picsum.photos/800/600?random=109',
    tags: ['安阳', '考古', '甲骨文', '世界遗产'],
    rating: 4.8,
    coordinates: { lat: 36.1264, lng: 114.3167 }
  },
  {
    id: 'hn-ay-2',
    name: '红旗渠',
    province: '河南',
    description: '位于安阳林州市，是20世纪60年代林县人民在太行山腰修建的引水工程，被誉为“人工天河”和“世界第八大奇迹”。',
    imageUrl: 'https://picsum.photos/800/600?random=110',
    tags: ['安阳', '红色旅游', '工程奇迹', '精神'],
    rating: 4.9,
    coordinates: { lat: 36.3533, lng: 113.7583 }
  },

  // --- 北京 ---
  {
    id: 'bj-1',
    name: '故宫博物院',
    province: '北京',
    description: '中国明清两代的皇家宫殿，旧称为紫禁城，位于北京中轴线的中心，是中国古代宫廷建筑之精华。',
    imageUrl: 'https://picsum.photos/800/600?random=5',
    tags: ['皇宫', '历史', '建筑'],
    rating: 5.0,
    coordinates: { lat: 39.9163, lng: 116.3972 }
  },
  {
    id: 'bj-2',
    name: '八达岭长城',
    province: '北京',
    description: '位于北京市延庆区军都山关沟古道北口，是明长城的一个隘口，著名的“不到长城非好汉”即指此处。',
    imageUrl: 'https://picsum.photos/800/600?random=6',
    tags: ['长城', '历史', '登山'],
    rating: 4.8,
    coordinates: { lat: 40.3598, lng: 116.0199 }
  },
  // --- 四川 ---
  {
    id: 'sc-1',
    name: '九寨沟',
    province: '四川',
    description: '位于四川省阿坝藏族羌族自治州九寨沟县境内，泉、瀑、河、滩108个海子，构成一个个五彩斑斓的瑶池玉盆。',
    imageUrl: 'https://picsum.photos/800/600?random=7',
    tags: ['自然', '湖泊', '彩林', '童话世界'],
    rating: 4.9,
    coordinates: { lat: 33.2600, lng: 103.9186 }
  },
  {
    id: 'sc-2',
    name: '成都大熊猫繁育研究基地',
    province: '四川',
    description: '位于成都市成华区，是世界著名的大熊猫迁地保护基地，近距离观看国宝大熊猫的最佳去处。',
    imageUrl: 'https://picsum.photos/800/600?random=8',
    tags: ['熊猫', '动物', '亲子'],
    rating: 4.9,
    coordinates: { lat: 30.7336, lng: 104.1466 }
  },
  // --- 云南 ---
  {
    id: 'yn-1',
    name: '玉龙雪山',
    province: '云南',
    description: '位于丽江市，纳西族心中的神山。其十三座雪峰连绵不绝，宛若一条“巨龙”腾越飞舞，故称为“玉龙”。',
    imageUrl: 'https://picsum.photos/800/600?random=9',
    tags: ['雪山', '自然', '登山'],
    rating: 4.7,
    coordinates: { lat: 27.0984, lng: 100.2052 }
  },
  // --- 陕西 ---
  {
    id: 'sx-1',
    name: '秦始皇兵马俑',
    province: '陕西',
    description: '位于西安市临潼区，是秦始皇陵的一部分，被誉为“世界第八大奇迹”，展示了秦军的雄壮军阵。',
    imageUrl: 'https://picsum.photos/800/600?random=10',
    tags: ['历史', '考古', '奇迹'],
    rating: 5.0,
    coordinates: { lat: 34.3841, lng: 109.2785 }
  },
    // --- 浙江 ---
  {
    id: 'zj-1',
    name: '杭州西湖',
    province: '浙江',
    description: '位于杭州市西部，秀丽的湖光山色和众多的名胜古迹闻名中外，是中国著名的旅游胜地，也被誉为“人间天堂”。',
    imageUrl: 'https://picsum.photos/800/600?random=11',
    tags: ['湖泊', '园林', '文化', '爱情'],
    rating: 4.9,
    coordinates: { lat: 30.2460, lng: 120.1450 }
  },
];