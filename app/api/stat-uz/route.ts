import { NextResponse } from "next/server";

// Данные Госкомстата Узбекистана (stat.uz, раздел «Демография предприятий
// и организаций», https://stat.uz/ru/ofitsialnaya-statistika/usreo).
//
// Раньше этот роут ходил за данными в stat.uz на каждый запрос (с кэшем на
// сутки). От этого отказались осознанно: 1) сами данные там обновляются
// примерно раз в год, живой фетч не давал никакой свежести, только лишний
// риск отказа; 2) их JSON оборачивает ответ в массив из одного объекта
// ([{ metadata, data }], а не { metadata, data }) — из-за этого на проде
// живой фетч тихо возвращал пустой список для всех показателей.
//
// Вместо этого числа вбиты сюда напрямую — сняты вручную со stat.uz
// 12.09.2026 (см. ссылку на источник внизу раздела на сайте, там же можно
// сверить актуальность). Чтобы обновить в следующем году: зайти на
// https://stat.uz/ru/ofitsialnaya-statistika/usreo → «Демография
// предприятий», выгрузить свежие цифры по каждому из 4 показателей ниже
// (по Республике в целом и по каждому региону) и переписать значения в
// STAT_UZ_DATA — код и структура компонента меняться не должны.
export type StatUzIndicatorKey = "operating" | "registered" | "newlyCreated" | "smallBusinessOperating";

export type StatUzRegion = {
  code: string;
  name: { ru: string; en: string; uz: string };
  values: number[];
};

export type StatUzIndicator = {
  key: StatUzIndicatorKey;
  years: number[];
  republic: number[];
  regions: StatUzRegion[];
};

const STAT_UZ_DATA: StatUzIndicator[] = [
  {
    key: "operating",
    years: [2022, 2023, 2024, 2025, 2026],
    republic: [528929, 592371, 485024, 424840, 474899],
    regions: [
      {
        code: "1735",
        name: { ru: "Республика Каракалпакстан", en: "Republic of Karakalpakstan", uz: "Qoraqalpogʻiston Respublikasi" },
        values: [23721, 26692, 25928, 21001, 23747],
      },
      {
        code: "1703",
        name: { ru: "Андижанская область", en: "Andijan region", uz: "Andijon viloyati" },
        values: [40474, 44658, 29717, 25163, 27002],
      },
      {
        code: "1706",
        name: { ru: "Бухарская область", en: "Bukhara region", uz: "Buxoro viloyati" },
        values: [31160, 33686, 31203, 26186, 28831],
      },
      {
        code: "1708",
        name: { ru: "Джизакская область", en: "Jizzakh region", uz: "Jizzax viloyati" },
        values: [22714, 25847, 19923, 16606, 18461],
      },
      {
        code: "1710",
        name: { ru: "Кашкадарьинская область", en: "Kashkadarya region", uz: "Qashqadaryo viloyati" },
        values: [36168, 41612, 33064, 27456, 30424],
      },
      {
        code: "1712",
        name: { ru: "Навоийская область", en: "Navoi region", uz: "Navoiy viloyati" },
        values: [22711, 25179, 21880, 18515, 20982],
      },
      {
        code: "1714",
        name: { ru: "Наманганская область", en: "Namangan region", uz: "Namangan viloyati" },
        values: [33422, 36914, 27634, 23920, 27097],
      },
      {
        code: "1718",
        name: { ru: "Самаркандская область", en: "Samarkand region", uz: "Samarqand viloyati" },
        values: [46667, 54163, 43477, 37514, 41091],
      },
      {
        code: "1722",
        name: { ru: "Сурхандарьинская область", en: "Surkhandarya region", uz: "Surxondaryo viloyati" },
        values: [28291, 31427, 24657, 23098, 25065],
      },
      {
        code: "1724",
        name: { ru: "Сырдарьинская область", en: "Syrdarya region", uz: "Sirdaryo viloyati" },
        values: [15920, 17259, 13432, 10717, 12239],
      },
      {
        code: "1727",
        name: { ru: "Ташкентская область", en: "Tashkent region", uz: "Toshkent viloyati" },
        values: [50296, 55472, 45295, 40500, 46479],
      },
      {
        code: "1730",
        name: { ru: "Ферганская область", en: "Fergana region", uz: "Fargʻona viloyati" },
        values: [46622, 52746, 42574, 34302, 37846],
      },
      {
        code: "1733",
        name: { ru: "Хорезмская область", en: "Khorezm region", uz: "Xorazm viloyati" },
        values: [25160, 28904, 27089, 23779, 26957],
      },
      {
        code: "1726",
        name: { ru: "город Ташкент", en: "Tashkent city", uz: "Toshkent shahri" },
        values: [105603, 117812, 99151, 96083, 108678],
      },
    ],
  },
  {
    key: "registered",
    years: [2022, 2023, 2024, 2025, 2026],
    republic: [557756, 627475, 688345, 725857, 671664],
    regions: [
      {
        code: "1735",
        name: { ru: "Республика Каракалпакстан", en: "Republic of Karakalpakstan", uz: "Qoraqalpogʻiston Respublikasi" },
        values: [24855, 27903, 32547, 32810, 30573],
      },
      {
        code: "1703",
        name: { ru: "Андижанская область", en: "Andijan region", uz: "Andijon viloyati" },
        values: [43754, 47925, 50831, 53301, 46032],
      },
      {
        code: "1706",
        name: { ru: "Бухарская область", en: "Bukhara region", uz: "Buxoro viloyati" },
        values: [33158, 35905, 39403, 41332, 38486],
      },
      {
        code: "1708",
        name: { ru: "Джизакская область", en: "Jizzakh region", uz: "Jizzax viloyati" },
        values: [24029, 27732, 30555, 32368, 28434],
      },
      {
        code: "1710",
        name: { ru: "Кашкадарьинская область", en: "Kashkadarya region", uz: "Qashqadaryo viloyati" },
        values: [37758, 44323, 47391, 48521, 43750],
      },
      {
        code: "1712",
        name: { ru: "Навоийская область", en: "Navoi region", uz: "Navoiy viloyati" },
        values: [23595, 26437, 28521, 29599, 27398],
      },
      {
        code: "1714",
        name: { ru: "Наманганская область", en: "Namangan region", uz: "Namangan viloyati" },
        values: [34600, 38374, 40820, 42585, 38185],
      },
      {
        code: "1718",
        name: { ru: "Самаркандская область", en: "Samarkand region", uz: "Samarqand viloyati" },
        values: [49370, 57511, 61620, 62992, 58075],
      },
      {
        code: "1722",
        name: { ru: "Сурхандарьинская область", en: "Surkhandarya region", uz: "Surxondaryo viloyati" },
        values: [29807, 33122, 36228, 38492, 35993],
      },
      {
        code: "1724",
        name: { ru: "Сырдарьинская область", en: "Syrdarya region", uz: "Sirdaryo viloyati" },
        values: [17108, 18550, 20338, 21444, 21055],
      },
      {
        code: "1727",
        name: { ru: "Ташкентская область", en: "Tashkent region", uz: "Toshkent viloyati" },
        values: [54768, 60647, 66580, 70363, 65954],
      },
      {
        code: "1730",
        name: { ru: "Ферганская область", en: "Fergana region", uz: "Fargʻona viloyati" },
        values: [48481, 55716, 62021, 63946, 57707],
      },
      {
        code: "1733",
        name: { ru: "Хорезмская область", en: "Khorezm region", uz: "Xorazm viloyati" },
        values: [26694, 30956, 35181, 38555, 37886],
      },
      {
        code: "1726",
        name: { ru: "город Ташкент", en: "Tashkent city", uz: "Toshkent shahri" },
        values: [109779, 122374, 136309, 149549, 142136],
      },
    ],
  },
  {
    key: "newlyCreated",
    years: [2021, 2022, 2023, 2024, 2025],
    republic: [102804, 93611, 88787, 79667, 87775],
    regions: [
      {
        code: "1735",
        name: { ru: "Республика Каракалпакстан", en: "Republic of Karakalpakstan", uz: "Qoraqalpogʻiston Respublikasi" },
        values: [4491, 4472, 6436, 3254, 3969],
      },
      {
        code: "1703",
        name: { ru: "Андижанская область", en: "Andijan region", uz: "Andijon viloyati" },
        values: [7968, 5656, 4388, 4294, 5023],
      },
      {
        code: "1706",
        name: { ru: "Бухарская область", en: "Bukhara region", uz: "Buxoro viloyati" },
        values: [6578, 4572, 5784, 5121, 4781],
      },
      {
        code: "1708",
        name: { ru: "Джизакская область", en: "Jizzakh region", uz: "Jizzax viloyati" },
        values: [4502, 4667, 4542, 4469, 3761],
      },
      {
        code: "1710",
        name: { ru: "Кашкадарьинская область", en: "Kashkadarya region", uz: "Qashqadaryo viloyati" },
        values: [9747, 8869, 6145, 4669, 5257],
      },
      {
        code: "1712",
        name: { ru: "Навоийская область", en: "Navoi region", uz: "Navoiy viloyati" },
        values: [4993, 4464, 3910, 3046, 3168],
      },
      {
        code: "1714",
        name: { ru: "Наманганская область", en: "Namangan region", uz: "Namangan viloyati" },
        values: [6687, 5774, 4778, 4031, 4638],
      },
      {
        code: "1718",
        name: { ru: "Самаркандская область", en: "Samarkand region", uz: "Samarqand viloyati" },
        values: [11063, 10877, 7771, 6841, 7075],
      },
      {
        code: "1722",
        name: { ru: "Сурхандарьинская область", en: "Surkhandarya region", uz: "Surxondaryo viloyati" },
        values: [5207, 4316, 3915, 4940, 5122],
      },
      {
        code: "1724",
        name: { ru: "Сырдарьинская область", en: "Syrdarya region", uz: "Sirdaryo viloyati" },
        values: [2407, 2187, 2270, 1852, 2357],
      },
      {
        code: "1727",
        name: { ru: "Ташкентская область", en: "Tashkent region", uz: "Toshkent viloyati" },
        values: [8049, 7094, 7156, 6987, 8989],
      },
      {
        code: "1730",
        name: { ru: "Ферганская область", en: "Fergana region", uz: "Fargʻona viloyati" },
        values: [9300, 9099, 8248, 6153, 6858],
      },
      {
        code: "1733",
        name: { ru: "Хорезмская область", en: "Khorezm region", uz: "Xorazm viloyati" },
        values: [5061, 5792, 6457, 6989, 7597],
      },
      {
        code: "1726",
        name: { ru: "город Ташкент", en: "Tashkent city", uz: "Toshkent shahri" },
        values: [16751, 15772, 16987, 17021, 19180],
      },
    ],
  },
  {
    key: "smallBusinessOperating",
    years: [2022, 2023, 2024, 2025, 2026],
    republic: [462834, 523556, 417080, 358116, 403767],
    regions: [
      {
        code: "1735",
        name: { ru: "Республика Каракалпакстан", en: "Republic of Karakalpakstan", uz: "Qoraqalpogʻiston Respublikasi" },
        values: [19998, 22863, 22066, 17180, 19606],
      },
      {
        code: "1703",
        name: { ru: "Андижанская область", en: "Andijan region", uz: "Andijon viloyati" },
        values: [34999, 39038, 24381, 19967, 21503],
      },
      {
        code: "1706",
        name: { ru: "Бухарская область", en: "Bukhara region", uz: "Buxoro viloyati" },
        values: [27690, 30082, 27594, 22615, 24948],
      },
      {
        code: "1708",
        name: { ru: "Джизакская область", en: "Jizzakh region", uz: "Jizzax viloyati" },
        values: [19463, 22474, 16677, 13534, 15208],
      },
      {
        code: "1710",
        name: { ru: "Кашкадарьинская область", en: "Kashkadarya region", uz: "Qashqadaryo viloyati" },
        values: [31152, 36421, 27980, 22452, 25038],
      },
      {
        code: "1712",
        name: { ru: "Навоийская область", en: "Navoi region", uz: "Navoiy viloyati" },
        values: [20472, 22844, 19539, 16165, 18400],
      },
      {
        code: "1714",
        name: { ru: "Наманганская область", en: "Namangan region", uz: "Namangan viloyati" },
        values: [28949, 32305, 23136, 19547, 22471],
      },
      {
        code: "1718",
        name: { ru: "Самаркандская область", en: "Samarkand region", uz: "Samarqand viloyati" },
        values: [40724, 47943, 37398, 31470, 34495],
      },
      {
        code: "1722",
        name: { ru: "Сурхандарьинская область", en: "Surkhandarya region", uz: "Surxondaryo viloyati" },
        values: [24395, 27368, 20589, 19101, 20753],
      },
      {
        code: "1724",
        name: { ru: "Сырдарьинская область", en: "Syrdarya region", uz: "Sirdaryo viloyati" },
        values: [13808, 15036, 11217, 8639, 9975],
      },
      {
        code: "1727",
        name: { ru: "Ташкентская область", en: "Tashkent region", uz: "Toshkent viloyati" },
        values: [44156, 49145, 38953, 34389, 40139],
      },
      {
        code: "1730",
        name: { ru: "Ферганская область", en: "Fergana region", uz: "Fargʻona viloyati" },
        values: [40403, 46350, 36238, 28076, 31289],
      },
      {
        code: "1733",
        name: { ru: "Хорезмская область", en: "Khorezm region", uz: "Xorazm viloyati" },
        values: [21984, 25616, 23854, 20528, 23465],
      },
      {
        code: "1726",
        name: { ru: "город Ташкент", en: "Tashkent city", uz: "Toshkent shahri" },
        values: [94641, 106071, 87458, 84453, 96477],
      },
    ],
  },
];

export async function GET() {
  return NextResponse.json(STAT_UZ_DATA, {
    headers: {
      // Статика, но заголовок оставляем — так кеш CDN/браузера ведёт себя
      // предсказуемо, как и раньше.
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=21600",
    },
  });
}
