// @flow


const Chance = require('chance');

const chance = new Chance();

const firstNames = {};
firstNames.male = {
  en: ['Rotem', 'Itamar', 'Tal', 'Sefi', 'Nofar', 'Rony', 'Yaniv', 'Amihay', 'Simon', 'Daniel', 'Sun',
    'Lod', 'Yarin', 'Alexey', 'Itzik', 'Oren', 'Eli', 'Lior', 'Igor', 'Shmulik', 'Tzvika', 'Omer',
    'Amihay', 'Gil', 'Dimitry', 'Itay', 'Nativ', 'Doron', 'Uri', 'Eli', 'Maor', 'Haim', 'Zachary', 'Kfir'],
};

firstNames.female = {
  en: ['Denise', 'Keren', 'Danielle', 'Moran', 'Yael', 'Liza', 'Shir', 'Yelena'],
};

chance.set('firstNames', firstNames);

const lastNames = {
  en: ['Bloom', 'Arjuan', 'Avissar', 'Eini', 'Sharabi', 'Chaplik', 'Orkabi', 'Cohen', 'Kochanovitch',
    'Schlezinger', 'Lawson', 'Goldman', 'Rahlin', 'Ashkenazi', 'Homri', 'Sivan', 'Weissman', 'Loutrin', 'Zabatani',
    'Barel', 'Naveh', 'Aharoni', 'Haim', 'Dery', 'Borovsky', 'Faiman', 'ZerKavod', 'Alkotser', 'Tayar', 'Nutels',
    'Fridman', 'BenDavid', 'Tabakman', 'Katz', 'Sivan', 'Peretz', 'Solomon', 'Matishevsky', 'Erskine', 'Arad'],
};

chance.set('lastNames', lastNames);

module.exports = chance;
