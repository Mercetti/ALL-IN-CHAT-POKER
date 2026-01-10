const { aceyPhrases } = require('./aceyPhrases');

module.exports = {
  formatDealerLine: (type, player = '', card = '') => {
    const pool = aceyPhrases.dealer?.[type] || [];
    const phrase = pool[Math.floor(Math.random() * pool.length)] || '';
    return phrase
      .replace(/{player}/g, player || 'Player')
      .replace(/{card}/g, card || 'a wild card');
  }
};
