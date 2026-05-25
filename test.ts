const { getStockPageData } = require('./src/lib/data/router');

async function main() {
  try {
    const data = await getStockPageData('AAPL');
    console.log(Object.keys(data));
  } catch (e) {
    console.error(e);
  }
}

main();
