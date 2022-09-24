const database = require('genshin-db/src/min/data.min.json').data;
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, '../src/data');
const publicDir = path.resolve(__dirname, '../public');

const generatedLocales = [
  'ChineseSimplified',
  'ChineseTraditional',
  'English',
  'French',
  'German',
  'Indonesian',
  'Japanese',
  'Korean',
  'Portuguese',
  'Russian',
  'Spanish',
  'Thai',
  'Vietnamese',
];

const localesMap = {
  ['zh-cn']: 'ChineseSimplified',
  en: 'English',
};

const getLocaleData = (locale) => {
  if (locale in database) return database[locale];
  if (locale in localesMap) return database[localesMap[locale]];

  throw new Error('cannot find locale' + locale);
};

const baseData = getLocaleData('en');
const characterKeys = Object.keys(baseData.characters);
const weaponKeys = Object.keys(baseData.weapons);

// function generateTypes() {
//   const enData = getLocaleData('en');
//   const cnData = getLocaleData('zh-cn');

//   const generateEnumKey = (key, getDataTip) => {
//     return `  /**
//    * @en ${getDataTip(enData)}
//    * @zh ${getDataTip(cnData)}
//    */
//   ${key},\n`;
//   };
//   return `// generated by scripts/generateData.js
// export enum ECharacters {
// ${characterKeys.map((key) => generateEnumKey(key, (data) => data.characters[key].name)).join('')}
// }

// export enum EWeapons {
// ${weaponKeys.map((key) => generateEnumKey(key, (data) => data.weapons[key].name)).join('')}
// }`;
// }

// function generateItemLocale(locale) {
//   const { characters, weapons } = getLocaleData(locale);
//   const data = _.merge(_.mapValues(characters, 'name'), _.mapValues(weapons, 'name'));

//   return `// generated by scripts/generateData.js
// export const itemsLocale =  ${JSON.stringify(data, null, '\t')};`;
// }

// function generateItemsInfo() {
//   const { characters, weapons } = baseData;
//   const data = _.merge(
//     _.mapValues(characters, (character) => ({
//       type: 'character',
//       rarity: parseInt(character.rarity),
//     })),
//     _.mapValues(weapons, (weapon) => ({
//       type: 'weapon',
//       rarity: parseInt(weapon.rarity),
//     })),
//   );
//   return `// generated by scripts/generateData.js
// export const itemsInfo = ${JSON.stringify(data, null, '\t')};`;
// }

function generatePoolsV2() {
  const { characters, weapons } = getLocaleData('zh-cn');
  const data = _.merge(_.mapValues(characters, 'name'), _.mapValues(weapons, 'name'));

  const name2Key = _.invert(data);
  const poolsStr = fs.readFileSync(path.resolve(publicDir, 'pools.js'), 'utf-8');

  const matchWordReg = /\'([^']*?)\'/gm;
  const matchNameLineReg = /^\s*name:.*\n/gm;

  const poolsV2Str = poolsStr.replace(matchWordReg, (str, name) => {
    if (name in name2Key) return `'${name2Key[name]}'`;
    return str;
  });

  const localesData = _.zipObject(
    generatedLocales,
    generatedLocales.map((locale) => {
      const { characters, weapons } = getLocaleData(locale);
      return _.merge(_.mapValues(characters, 'name'), _.mapValues(weapons, 'name'));
    }),
  );

  const dataInfo = _.merge(
    _.mapValues(characters, (character) => ({
      type: 'character',
      rarity: parseInt(character.rarity),
    })),
    _.mapValues(weapons, (weapon) => ({
      type: 'weapon',
      rarity: parseInt(weapon.rarity),
    })),
  );

  return `// generated by scripts/generateData.js\n${poolsV2Str.replace(
    matchNameLineReg,
    '',
  )}\nwindow.LOCALES_DATA = ${JSON.stringify(
    localesData,
    null,
    '\t',
  )};\nwindow.DATA_INFO = ${JSON.stringify(dataInfo, null, '\t')};`;
}

// fs.writeFileSync(path.resolve(outputDir, 'index.ts'), generateItemsInfo(), 'utf-8');
// fs.writeFileSync(path.resolve(outputDir, 'types.ts'), generateTypes(), 'utf-8');

// generatedLocales.map((locale) => {
//   fs.writeFileSync(
//     path.resolve(outputDir, `locales/${locale}.ts`),
//     generateItemLocale(locale),
//     'utf-8',
//   );
// });

fs.writeFileSync(path.resolve(publicDir, 'pools-v2.js'), generatePoolsV2(), 'utf-8');
