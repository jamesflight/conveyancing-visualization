"use strict";

var concatAll = R.reduce(R.concat, []);

var flatGroupBy = (pred, collection) => R.map(pair => pair[1], R.toPairs(R.groupBy(pred, collection)));

function formatMoney(num) {
  return Number(num).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function init(allRateCards) {
  var feeTypes = R.uniq(R.map(el => el[2], allRateCards));
  feeTypes.forEach(el => {
    var node = document.createElement("div");
    node.className = 'diagram-window';
    node.id = 'myDiagramDiv_' + el.replace(/\s+/g, '-').toLowerCase();
    var title = document.createElement("h1");
    title.innerHTML = el;
    document.getElementById("wrapper").appendChild(title);
    document.getElementById("wrapper").appendChild(node);
    var tree = createTreeStructure(el, allRateCards);
    var map = tree_chartmap(tree); // map = flattenExtraConditions(el, map);

    map = flattenPurchase(el, map);
    createDiagram(node.id, map);
  });
}

function flattenPurchase(feeType, map) {
  var purchaseLevelOnly = R.filter(obj => obj.level === 2, map);

  if (purchaseLevelOnly.length === 4) {
    return map;
  }

  map.push({
    parent: 'start',
    key: 'other_products',
    name: 'All Other Products',
    color: '#B5D3E7',
    level: 2
  });
  map.push({
    parent: 'other_products',
    key: 'other_products_fee',
    name: feeType + ' does not apply.',
    color: 'red',
    level: 3
  });
  return map;
}

function flattenExtraConditions(feeType, map) {
  var potentialItemsToRemove = R.filter(item => item.level === 3 && isOnlyItemForParentInMap(item, map), map);
  console.log(potentialItemsToRemove);
  R.map(item => {
    if (item.name === "All quotes") {
      map = R.reject(rejectItem => rejectItem.key === item.key, map);
      map = R.map(mapItem => {
        if (mapItem.parent === item.key) {
          mapItem.parent = item.parent;
        }

        return mapItem;
      }, map);
    }
  }, potentialItemsToRemove);
  return map;
}

function isOnlyItemForParentInMap(item, map) {
  var filter = R.filter(innerItem => innerItem.parent === item.parent, map);
  return filter.length === 1 ? true : false;
}

function createDiagram(divId, data) {
  var $ = go.GraphObject.make;
  var myDiagram = $(go.Diagram, divId, {
    "undoManager.isEnabled": true,
    layout: $(go.TreeLayout, {
      angle: 0,
      layerSpacing: 70,
      layerStyle: go.TreeLayout.LayerUniform
    })
  });
  myDiagram.nodeTemplate = $(go.Node, "Auto", $(go.Shape, "RoundedRectangle", new go.Binding("fill", "color")), $(go.Panel, "Horizontal", {
    defaultAlignment: go.Spot.Left,
    margin: 5
  }, $(go.TextBlock, {
    row: 1,
    column: 1,
    font: '12pt sans-serif'
  }, new go.Binding("text", "name")), $(go.TextBlock, {
    row: 2,
    column: 1,
    font: '12pt sans-serif'
  }, new go.Binding("text", "gross")), $(go.TextBlock, {
    row: 3,
    column: 1,
    font: '12pt sans-serif'
  }, new go.Binding("text", "per_applicant"))));
  var model = $(go.TreeModel);
  model.nodeDataArray = data;
  myDiagram.model = model;
}

function getDaigramDataFromRateCards(feeType, rateCards) {
  var rateCardsFilteredByFeeType = R.filter(card => card[2] === feeType, rateCards);
  var groups = splitRateCardsByProduct(rateCardsFilteredByFeeType);
  return concatAll([[{
    key: 'start',
    name: 'Start',
    color: 'yellow'
  }], getMapForProductGroups(groups), [{
    parent: 'start',
    key: 'not_for_product',
    name: 'Otherwise no fee.',
    color: 'red'
  }]]); // return [
  //   { key: "1",              name: "New Build?", color: "red", net: "Net: £40"   },
  //   { key: "2", parent: "1", name: "Demeter", color: "green"    },
  //   { key: "3", parent: "1", name: "Copricat", color: "red"   },
  //   { key: "4", parent: "3", name: "Jellylorum", color: "yellow" },
  //   { key: "5", parent: "3", name: "Alonzo", color: "red"     },
  //   { key: "6", parent: "2", name: "Munkustrap", color: "red" }
  // ];
}

function splitRateCardsByProduct(rateCards) {
  var productTypes = R.uniq(R.map(el => el[1], rateCards));
  return R.fromPairs(R.map(type => [type, R.filter(card => card[1] === type, rateCards)], productTypes));
}

function getMapForProductGroups(groups) {
  return R.chain(x => x, groups.map((group, index) => {
    return R.concat([{
      parent: 'start',
      key: 'product_' + group[0][1].replace(/\s+/g, '-').toLowerCase(),
      name: 'Quote is for a ' + group[0][1],
      color: '#B5D3E7'
    }], getMapForExtraConditionsRateCards(getExtraConditionsGroups(group)));
  }, groups));
}

function getExtraConditionsString(rateCard) {
  return '' + (rateCard[9] ? rateCard[9] : '_') + (rateCard[10] ? rateCard[10] : '_') + (rateCard[11] ? rateCard[11] : '_') + (rateCard[12] ? rateCard[12] : '_') + (rateCard[13] ? rateCard[13] : '_') + (rateCard[14] ? rateCard[14] : '_') + (rateCard[15] ? rateCard[15] : '_');
}

function getExtraConditionsGroups(rateCards) {
  var uniqueCombinationsOfConditions = R.uniq(R.map(card => getExtraConditionsString(card), rateCards));
  return R.map(condition => {
    return R.filter(card => getExtraConditionsString(card) == condition, rateCards);
  }, uniqueCombinationsOfConditions);
}

function getMapForExtraConditionsRateCards(rateCards) {
  console.log(rateCards);
  return rateCards.length === 1 && rateCards[0].length === 1 && getExtraConditionsString(rateCards[0][0]) === '_______' ? [createRateCardMap(rateCards[0][0])] : [];
}

function createRateCardMap(rateCard) {
  return {
    parent: 'product_' + rateCard[1].replace(/\s+/g, '-').toLowerCase(),
    key: 'extra_conditions_' + getExtraConditionsString(rateCard),
    gross: 'Gross Fee: £' + rateCard[5],
    color: 'green',
    per_applicant: rateCard[18] ? '(Per applicant)' : undefined
  };
}

function createTreeStructure(feeType, rateCards) {
  var rateCardsFilteredByFeeType = R.filter(card => card[2] === feeType, rateCards);
  var tree = splitRateCardsByProduct(rateCardsFilteredByFeeType);
  tree = splitRateCardsByExtraConditions(tree);
  tree = splitRateCardsByOriginator(tree);
  tree = splitRateCardsByCountry(tree);
  tree = splitRateCardsByPropertyVal(tree);
  return tree;
}

function splitRateCardsByExtraConditions(rateCardsSplitByProduct) {
  return R.mapObjIndexed((cards, product) => R.groupBy(card => getExtraConditionsString(card), cards), rateCardsSplitByProduct);
}

function splitRateCardsByOriginator(rateCardsSplitByProductAndConds) {
  return R.mapObjIndexed((condGroups, product) => R.mapObjIndexed((cards, cond) => R.groupBy(card => card[0], cards), condGroups), rateCardsSplitByProductAndConds);
}

function splitRateCardsByCountry(rateCardsSplitByProductAndCondsAndOrig) {
  return R.mapObjIndexed((condGroups, product) => R.mapObjIndexed((originatorGroups, cond) => R.mapObjIndexed((cards, originator) => R.groupBy(card => card[16], cards), originatorGroups), condGroups), rateCardsSplitByProductAndCondsAndOrig);
}

function splitRateCardsByPropertyVal(rateCardsSplitByProductAndCondsAndOrigAndCountry) {
  return R.mapObjIndexed((condGroups, product) => R.mapObjIndexed((originatorGroups, cond) => R.mapObjIndexed((countryGroups, originator) => R.mapObjIndexed((cards, country) => R.groupBy(card => getPropertyValueString(card), cards), countryGroups), originatorGroups), condGroups), rateCardsSplitByProductAndCondsAndOrigAndCountry);
}

function getPropertyValueString(card) {
  return '£' + formatMoney(card[3]) + ' to ' + '£' + formatMoney(card[4]);
}

function tree_chartmap(tree) {
  var map = [{
    key: 'start',
    name: 'Start Quote Creation',
    color: 'yellow',
    level: 1
  }];
  R.mapObjIndexed((productGroup, product) => {
    map.push({
      parent: 'start',
      key: product,
      name: product,
      color: '#B5D3E7',
      level: 2
    });
    R.mapObjIndexed((extraConditionsGroup, extraConditions) => {
      if (extraConditions === '1______') {
        map.push({
          parent: product,
          key: product + extraConditions,
          name: 'New build',
          color: '#B5D3E7',
          level: 3
        });
      }

      if (extraConditions === '_1_____') {
        map.push({
          parent: product,
          key: product + extraConditions,
          name: 'Auction',
          color: '#B5D3E7',
          level: 3
        });
      }

      if (extraConditions === '__1____') {
        map.push({
          parent: product,
          key: product + extraConditions,
          name: 'Gifted Deposit',
          color: '#B5D3E7',
          level: 3
        });
      }

      if (extraConditions === '___1___') {
        map.push({
          parent: product,
          key: product + extraConditions,
          name: 'Help to Buy (Equity Loan)',
          color: '#B5D3E7',
          level: 3
        });
      }

      if (extraConditions === '____1__') {
        map.push({
          parent: product,
          key: product + extraConditions,
          name: 'Help to Buy (ISA)',
          color: '#B5D3E7',
          level: 3
        });
      }

      if (extraConditions === '_____1_') {
        map.push({
          parent: product,
          key: product + extraConditions,
          name: 'Right To Buy',
          color: '#B5D3E7',
          level: 3
        });
      }

      if (extraConditions === '______1') {
        map.push({
          parent: product,
          key: product + extraConditions,
          name: 'Shared Ownership',
          color: '#B5D3E7',
          level: 3
        });
      }

      if (extraConditions === '_______') {
        map.push({
          parent: product,
          key: product + extraConditions,
          name: 'All quotes',
          color: '#B5D3E7',
          level: 3
        });
      }

      R.mapObjIndexed((originatorGroup, originator) => {
        originator = originator ? originator : "OtherClients";
        map.push({
          parent: product + extraConditions,
          key: product + extraConditions + originator,
          name: originator,
          color: '#B5D3E7',
          level: 4
        });
        R.mapObjIndexed((countryGroup, country) => {
          country = country ? country : "OtherCountries";
          map.push({
            parent: product + extraConditions + originator,
            key: product + extraConditions + originator + country,
            name: country,
            color: '#B5D3E7',
            level: 5
          });
          R.mapObjIndexed((rateCards, propertyVal) => {
            map.push({
              parent: product + extraConditions + originator + country,
              key: product + extraConditions + originator + country + propertyVal,
              name: 'For value: ' + propertyVal,
              color: '#B5D3E7',
              level: 6
            });
            map.push({
              parent: product + extraConditions + originator + country + propertyVal,
              key: product + extraConditions + originator + country + propertyVal + '_ratecard',
              gross: rateCards[0][2] + ': £' + rateCards[0][7],
              color: '#90EE90',
              level: 7
            });
          }, countryGroup);
        }, originatorGroup);
      }, extraConditionsGroup);
    }, productGroup);
  }, tree);
  return map;
}