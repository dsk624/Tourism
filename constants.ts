import { Attraction } from './types';

export const PROVINCES = [
  "河南", "北京", "四川", "云南", "陕西", "浙江", "江苏", "广东", "湖南", "新疆"
];

export const ATTRACTIONS: Attraction[] = [
  // 河南 (Priority)
  {
    id: 'hn-1',
    name: '龙门石窟',
    province: '河南',
    description: '中国四大石窟之一，世界文化遗产，位于洛阳市南郊伊河两岸的龙门山与香山上。',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    tags: ['历史', '文化遗产', '佛教'],
    rating: 4.9
  },
  {
    id: 'hn-2',
    name: '少林寺',
    province: '河南',
    description: '位于登封市嵩山五乳峰下，由于其坐落于嵩山腹地少室山的茂密丛林之中，故名“少林寺”。',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    tags: ['武术', '佛教', '名山'],
    rating: 4.8
  },
  {
    id: 'hn-3',
    name: '清明上河园',
    province: '河南',
    description: '坐落在开封市龙亭湖西岸，是以画家张择端的写实画作《清明上河图》为蓝本，以宋朝市井文化为主题的文化主题公园。',
    imageUrl: 'https://picsum.photos/800/600?random=3',
    tags: ['宋代文化', '园林', '表演'],
    rating: 4.7
  },
  {
    id: 'hn-4',
    name: '云台山',
    province: '河南',
    description: '位于焦作市修武县境内，以独具特色的“北方岩溶地貌”被列入首批世界地质公园名录。',
    imageUrl: 'https://picsum.photos/800/600?random=4',
    tags: ['自然风光', '地质奇观', '山水'],
    rating: 4.9
  },
  // 北京
  {
    id: 'bj-1',
    name: '故宫博物院',
    province: '北京',
    description: '中国明清两代的皇家宫殿，旧称为紫禁城，位于北京中轴线的中心，是中国古代宫廷建筑之精华。',
    imageUrl: 'https://picsum.photos/800/600?random=5',
    tags: ['皇宫', '历史', '建筑'],
    rating: 5.0
  },
  {
    id: 'bj-2',
    name: '八达岭长城',
    province: '北京',
    description: '位于北京市延庆区军都山关沟古道北口，是明长城的一个隘口。',
    imageUrl: 'https://picsum.photos/800/600?random=6',
    tags: ['长城', '历史', '登山'],
    rating: 4.8
  },
  // 四川
  {
    id: 'sc-1',
    name: '九寨沟',
    province: '四川',
    description: '位于四川省阿坝藏族羌族自治州九寨沟县境内，是中国第一个以保护自然风景为主要目的的自然保护区。',
    imageUrl: 'https://picsum.photos/800/600?random=7',
    tags: ['自然', '湖泊', '彩林'],
    rating: 4.9
  },
  {
    id: 'sc-2',
    name: '成都大熊猫繁育研究基地',
    province: '四川',
    description: '位于成都市成华区，是世界著名的大熊猫迁地保护基地、科研繁育基地、公众教育基地和旅游体验基地。',
    imageUrl: 'https://picsum.photos/800/600?random=8',
    tags: ['熊猫', '动物', '亲子'],
    rating: 4.9
  },
  // 云南
  {
    id: 'yn-1',
    name: '玉龙雪山',
    province: '云南',
    description: '位于丽江市玉龙纳西族自治县，是北半球最近赤道终年积雪的山脉。',
    imageUrl: 'https://picsum.photos/800/600?random=9',
    tags: ['雪山', '自然', '登山'],
    rating: 4.7
  },
  // 陕西
  {
    id: 'sx-1',
    name: '秦始皇兵马俑',
    province: '陕西',
    description: '位于西安市临潼区，是秦始皇陵的一部分，被誉为“世界第八大奇迹”。',
    imageUrl: 'https://picsum.photos/800/600?random=10',
    tags: ['历史', '考古', '奇迹'],
    rating: 5.0
  },
    // 浙江
  {
    id: 'zj-1',
    name: '杭州西湖',
    province: '浙江',
    description: '位于杭州市西部，是中国大陆首批国家重点风景名胜区和中国十大风景名胜之一。',
    imageUrl: 'https://picsum.photos/800/600?random=11',
    tags: ['湖泊', '园林', '文化'],
    rating: 4.9
  },
];
