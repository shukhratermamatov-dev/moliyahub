import type { LocalizedText } from "@/lib/i18n-text";

export type SubIndustry = {
  id: string;
  name: LocalizedText;
  // Необязательный подзаголовок-группа внутри отрасли (например, у
  // "Промышленности" — "Добывающая промышленность и энергетика" /
  // "Обрабатывающая промышленность"). Используется только для визуальной
  // группировки в детализации, отдельным уровнем выбора не является.
  group?: LocalizedText;
};

export type Industry = {
  id: string;
  name: LocalizedText;
  subIndustries: SubIndustry[];
};

// Справочник отраслей для «Биржи проектов»: общие отрасли + детализация внутри
// каждой. Источник — классификация секторов экономики Узбекистана, переданная
// пользователем; ru — как задано пользователем, uz/en — перевод.
export const INDUSTRIES: Industry[] = [
  {
    id: "industry",
    name: { ru: "Промышленность", uz: "Sanoat", en: "Industry" },
    subIndustries: [
      {
        id: "mining",
        group: {
          ru: "Добывающая промышленность и энергетика",
          uz: "Qazib olish sanoati va energetika",
          en: "Extractive industry and energy",
        },
        name: {
          ru: "Горнодобывающая (золото, уран, медь, серебро, фосфориты)",
          uz: "Konchilik (oltin, uran, mis, kumush, fosforitlar)",
          en: "Mining (gold, uranium, copper, silver, phosphorites)",
        },
      },
      {
        id: "oil-gas",
        group: {
          ru: "Добывающая промышленность и энергетика",
          uz: "Qazib olish sanoati va energetika",
          en: "Extractive industry and energy",
        },
        name: {
          ru: "Нефтегазовая (добыча и переработка природного газа, нефти, газового конденсата)",
          uz: "Neft-gaz (tabiiy gaz, neft, gaz kondensatini qazib olish va qayta ishlash)",
          en: "Oil & gas (extraction and processing of natural gas, oil, gas condensate)",
        },
      },
      {
        id: "power-generation",
        group: {
          ru: "Добывающая промышленность и энергетика",
          uz: "Qazib olish sanoati va energetika",
          en: "Extractive industry and energy",
        },
        name: {
          ru: "Электроэнергетика (тепловая, гидро-, солнечная и ветровая энергетика)",
          uz: "Elektroenergetika (issiqlik, gidro-, quyosh va shamol energetikasi)",
          en: "Power generation (thermal, hydro, solar and wind power)",
        },
      },
      {
        id: "machinery-automotive",
        group: {
          ru: "Обрабатывающая промышленность",
          uz: "Qayta ishlash sanoati",
          en: "Manufacturing",
        },
        name: {
          ru: "Машиностроение и автомобилестроение (легковые и грузовые авто, автобусы, сельхозтехника)",
          uz: "Mashinasozlik va avtomobilsozlik (yengil va yuk avtomobillari, avtobuslar, qishloq xoʻjaligi texnikasi)",
          en: "Machine building & automotive (cars, trucks, buses, farm machinery)",
        },
      },
      {
        id: "metallurgy",
        group: {
          ru: "Обрабатывающая промышленность",
          uz: "Qayta ishlash sanoati",
          en: "Manufacturing",
        },
        name: { ru: "Металлургия (чёрная и цветная)", uz: "Metallurgiya (qora va rangli)", en: "Metallurgy (ferrous and non-ferrous)" },
      },
      {
        id: "textiles",
        group: {
          ru: "Обрабатывающая промышленность",
          uz: "Qayta ishlash sanoati",
          en: "Manufacturing",
        },
        name: {
          ru: "Текстильная и швейная (пряжа, ткани, трикотаж, готовая одежда)",
          uz: "Toʻqimachilik va tikuvchilik (ip, mato, trikotaj, tayyor kiyim)",
          en: "Textiles & apparel (yarn, fabric, knitwear, ready-made clothing)",
        },
      },
      {
        id: "silk",
        group: {
          ru: "Обрабатывающая промышленность",
          uz: "Qayta ishlash sanoati",
          en: "Manufacturing",
        },
        name: {
          ru: "Шёлковая промышленность (производство шёлка-сырца и готовой продукции)",
          uz: "Ipakchilik sanoati (xom ipak va tayyor mahsulot ishlab chiqarish)",
          en: "Silk industry (raw silk and finished goods production)",
        },
      },
      {
        id: "chemicals",
        group: {
          ru: "Обрабатывающая промышленность",
          uz: "Qayta ishlash sanoati",
          en: "Manufacturing",
        },
        name: {
          ru: "Химическая и нефтехимическая (минеральные удобрения, полимеры, бытовая химия)",
          uz: "Kimyo va neft-kimyo (mineral oʻgʻitlar, polimerlar, maishiy kimyo)",
          en: "Chemicals & petrochemicals (mineral fertilizers, polymers, household chemicals)",
        },
      },
      {
        id: "pharma",
        group: {
          ru: "Обрабатывающая промышленность",
          uz: "Qayta ishlash sanoati",
          en: "Manufacturing",
        },
        name: {
          ru: "Фармацевтическая (лекарственные средства, медицинские изделия)",
          uz: "Farmatsevtika (dori vositalari, tibbiy buyumlar)",
          en: "Pharmaceuticals (medicines, medical devices)",
        },
      },
      {
        id: "electrical",
        group: {
          ru: "Обрабатывающая промышленность",
          uz: "Qayta ishlash sanoati",
          en: "Manufacturing",
        },
        name: {
          ru: "Электротехническая (бытовая техника, кабели, трансформаторы)",
          uz: "Elektrotexnika (maishiy texnika, kabellar, transformatorlar)",
          en: "Electrical engineering (appliances, cables, transformers)",
        },
      },
      {
        id: "building-materials",
        group: {
          ru: "Обрабатывающая промышленность",
          uz: "Qayta ishlash sanoati",
          en: "Manufacturing",
        },
        name: {
          ru: "Производство строительных материалов (цемент, стекло, кирпич, сухие смеси, керамика)",
          uz: "Qurilish materiallari ishlab chiqarish (sement, shisha, gʻisht, quruq aralashmalar, keramika)",
          en: "Building materials production (cement, glass, brick, dry mixes, ceramics)",
        },
      },
      {
        id: "food",
        group: {
          ru: "Обрабатывающая промышленность",
          uz: "Qayta ishlash sanoati",
          en: "Manufacturing",
        },
        name: {
          ru: "Пищевая (переработка плодоовощной продукции, молочная, мясная, масложировая, кондитерская)",
          uz: "Oziq-ovqat (meva-sabzavot mahsulotlarini qayta ishlash, sut, goʻsht, yogʻ-moy, qandolat)",
          en: "Food industry (fruit & vegetable processing, dairy, meat, fats & oils, confectionery)",
        },
      },
      {
        id: "leather-fur",
        group: {
          ru: "Обрабатывающая промышленность",
          uz: "Qayta ishlash sanoati",
          en: "Manufacturing",
        },
        name: {
          ru: "Кожевенно-обувная и пушно-меховая",
          uz: "Charm-poyabzal va mo'yna",
          en: "Leather & footwear, fur",
        },
      },
    ],
  },
  {
    id: "agriculture",
    name: {
      ru: "Сельское, лесное и рыбное хозяйство",
      uz: "Qishloq, oʻrmon va baliq xoʻjaligi",
      en: "Agriculture, forestry and fisheries",
    },
    subIndustries: [
      {
        id: "cotton-grain",
        group: { ru: "Растениеводство", uz: "Oʻsimlikchilik", en: "Crop farming" },
        name: {
          ru: "Хлопководство и зерноводство (пшеница, ячмень, рис)",
          uz: "Paxtachilik va gʻallachilik (bugʻdoy, arpa, sholi)",
          en: "Cotton and grain growing (wheat, barley, rice)",
        },
      },
      {
        id: "fruit-viticulture",
        group: { ru: "Растениеводство", uz: "Oʻsimlikchilik", en: "Crop farming" },
        name: {
          ru: "Плодоовощеводство, садоводство и виноградарство",
          uz: "Sabzavotchilik, bogʻdorchilik va uzumchilik",
          en: "Fruit & vegetable growing, horticulture and viticulture",
        },
      },
      {
        id: "melons-potato",
        group: { ru: "Растениеводство", uz: "Oʻsimlikchilik", en: "Crop farming" },
        name: {
          ru: "Бахчеводство и картофелеводство",
          uz: "Poliz ekinlari va kartoshkachilik",
          en: "Melon growing and potato farming",
        },
      },
      {
        id: "cattle",
        group: { ru: "Животноводство", uz: "Chorvachilik", en: "Livestock farming" },
        name: {
          ru: "Скотоводство (мясное и молочное)",
          uz: "Qoramolchilik (goʻshtchilik va sutchilik)",
          en: "Cattle farming (beef and dairy)",
        },
      },
      {
        id: "sheep-goat",
        group: { ru: "Животноводство", uz: "Chorvachilik", en: "Livestock farming" },
        name: {
          ru: "Овцеводство и козоводство (включая каракулеводство)",
          uz: "Qoʻychilik va echkichilik (jumladan qorakoʻlchilik)",
          en: "Sheep and goat farming (including karakul)",
        },
      },
      {
        id: "poultry-fish-bee",
        group: { ru: "Животноводство", uz: "Chorvachilik", en: "Livestock farming" },
        name: {
          ru: "Птицеводство, рыбоводство и пчеловодство",
          uz: "Parrandachilik, baliqchilik va asalarichilik",
          en: "Poultry, fish and bee farming",
        },
      },
      {
        id: "sericulture",
        group: { ru: "Животноводство", uz: "Chorvachilik", en: "Livestock farming" },
        name: {
          ru: "Шелководство (выращивание тутового шелкопряда)",
          uz: "Ipakchilik (tut ipak qurti yetishtirish)",
          en: "Sericulture (silkworm breeding)",
        },
      },
    ],
  },
  {
    id: "construction",
    name: { ru: "Строительство", uz: "Qurilish", en: "Construction" },
    subIndustries: [
      {
        id: "residential-construction",
        name: {
          ru: "Жилищное и коммерческое строительство",
          uz: "Turar-joy va tijorat qurilishi",
          en: "Residential and commercial construction",
        },
      },
      {
        id: "infrastructure-construction",
        name: {
          ru: "Инфраструктурное и дорожное строительство",
          uz: "Infratuzilma va yoʻl qurilishi",
          en: "Infrastructure and road construction",
        },
      },
      {
        id: "industrial-construction",
        name: {
          ru: "Промышленное строительство и монтажные работы",
          uz: "Sanoat qurilishi va montaj ishlari",
          en: "Industrial construction and installation works",
        },
      },
    ],
  },
  {
    id: "logistics",
    name: {
      ru: "Сфера услуг (транспорт, логистика)",
      uz: "Xizmat koʻrsatish sohasi (transport, logistika)",
      en: "Services (transport, logistics)",
    },
    subIndustries: [
      {
        id: "rail-road-air-pipeline",
        name: {
          ru: "Железнодорожный, автомобильный, авиационный и трубопроводный транспорт",
          uz: "Temir yoʻl, avtomobil, havo va quvur transporti",
          en: "Rail, road, air and pipeline transport",
        },
      },
      {
        id: "warehousing-cold-chain",
        name: {
          ru: "Складская и холодильная логистика",
          uz: "Ombor va sovutgich logistikasi",
          en: "Warehousing and cold-chain logistics",
        },
      },
    ],
  },
  {
    id: "it",
    name: {
      ru: "Информационные технологии и связь (IT)",
      uz: "Axborot texnologiyalari va aloqa (IT)",
      en: "Information technology and communications (IT)",
    },
    subIndustries: [
      { id: "software-dev", name: { ru: "Разработка ПО", uz: "Dasturiy taʼminot ishlab chiqish", en: "Software development" } },
      { id: "it-outsourcing", name: { ru: "Аутсорсинг (IT-экспорт)", uz: "Autsorsing (IT-eksport)", en: "Outsourcing (IT export)" } },
      {
        id: "ecommerce-telecom",
        name: { ru: "E-commerce, телекоммуникации", uz: "E-tijorat, telekommunikatsiya", en: "E-commerce, telecommunications" },
      },
    ],
  },
  {
    id: "finance",
    name: {
      ru: "Финансовый сектор и страхование",
      uz: "Moliya sektori va sugʻurta",
      en: "Financial sector and insurance",
    },
    subIndustries: [
      { id: "banking", name: { ru: "Банковские услуги", uz: "Bank xizmatlari", en: "Banking services" } },
      { id: "fintech", name: { ru: "Финтех", uz: "Fintex", en: "Fintech" } },
      { id: "microfinance", name: { ru: "Микрофинансирование", uz: "Mikromoliyalashtirish", en: "Microfinance" } },
      { id: "leasing-insurance", name: { ru: "Лизинг, страхование", uz: "Lizing, sugʻurta", en: "Leasing, insurance" } },
    ],
  },
  {
    id: "tourism",
    name: {
      ru: "Туризм и индустрия гостеприимства",
      uz: "Turizm va mehmondoʻstlik sanoati",
      en: "Tourism and hospitality",
    },
    subIndustries: [
      { id: "hospitality", name: { ru: "Гостиничный бизнес", uz: "Mehmonxona biznesi", en: "Hotel business" } },
      { id: "cultural-tourism", name: { ru: "Культурно-исторический туризм", uz: "Madaniy-tarixiy turizm", en: "Cultural & historical tourism" } },
      { id: "gastro-tourism", name: { ru: "Гастрономический туризм", uz: "Gastronomik turizm", en: "Gastronomic tourism" } },
      {
        id: "pilgrimage-tourism",
        name: {
          ru: "Паломнический и паломническо-экологический туризм",
          uz: "Ziyorat va ziyorat-ekologik turizm",
          en: "Pilgrimage and eco-pilgrimage tourism",
        },
      },
    ],
  },
  {
    id: "trade",
    name: { ru: "Торговля и общественное питание", uz: "Savdo va umumiy ovqatlanish", en: "Trade and catering" },
    subIndustries: [
      {
        id: "wholesale-retail",
        name: {
          ru: "Оптовая и розничная торговля (включая маркетплейсы)",
          uz: "Ulgurji va chakana savdo (marketpleyslar bilan)",
          en: "Wholesale and retail trade (incl. marketplaces)",
        },
      },
      { id: "restaurant", name: { ru: "Ресторанный бизнес", uz: "Restoran biznesi", en: "Restaurant business" } },
    ],
  },
  {
    id: "education",
    name: { ru: "Образование и EdTech", uz: "Taʼlim va EdTech", en: "Education and EdTech" },
    subIndustries: [
      {
        id: "public-private-education",
        name: { ru: "Государственное и частное образование", uz: "Davlat va xususiy taʼlim", en: "Public and private education" },
      },
      {
        id: "online-education",
        name: {
          ru: "Онлайн-обучение, повышение квалификации",
          uz: "Onlayn taʼlim, malaka oshirish",
          en: "Online learning, professional development",
        },
      },
    ],
  },
  {
    id: "healthcare",
    name: {
      ru: "Здравоохранение и социальные услуги",
      uz: "Sogʻliqni saqlash va ijtimoiy xizmatlar",
      en: "Healthcare and social services",
    },
    subIndustries: [
      { id: "medical-centers", name: { ru: "Медицинские центры", uz: "Tibbiyot markazlari", en: "Medical centers" } },
      { id: "sanatorium-resort", name: { ru: "Санаторно-курортный комплекс", uz: "Sanatoriya-kurort majmuasi", en: "Sanatorium & resort complex" } },
    ],
  },
  {
    id: "creative",
    name: { ru: "НД и творческие индустрии", uz: "Ijodiy sanoat", en: "Creative industries" },
    subIndustries: [
      {
        id: "handicrafts",
        name: { ru: "Ремесленничество, народные промыслы", uz: "Hunarmandchilik, xalq amaliy sanʼati", en: "Handicrafts, folk arts" },
      },
      { id: "design", name: { ru: "Дизайн", uz: "Dizayn", en: "Design" } },
      { id: "film-media", name: { ru: "Кино и медиа", uz: "Kino va media", en: "Film and media" } },
    ],
  },
];

export function findIndustry(id: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

export function findSubIndustry(industryId: string, subIndustryId: string | undefined): SubIndustry | undefined {
  if (!subIndustryId) return undefined;
  return findIndustry(industryId)?.subIndustries.find((s) => s.id === subIndustryId);
}
