"use strict";

var concatAll = R.reduce(R.concat, []);

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
    createDiagram(node.id, getDaigramDataFromRateCards(el, allRateCards));
  });
}

function createDiagram(divId, data) {
  var $ = go.GraphObject.make;
  var myDiagram = $(go.Diagram, divId, {
    "undoManager.isEnabled": true,
    layout: $(go.TreeLayout, {
      angle: 90,
      layerSpacing: 35
    })
  });
  myDiagram.nodeTemplate = $(go.Node, "Auto", $(go.Shape, "RoundedRectangle", new go.Binding("fill", "color")), $(go.Panel, "Table", {
    defaultAlignment: go.Spot.Left,
    margin: 10
  }, $(go.TextBlock, {
    row: 1,
    column: 1,
    font: '15pt sans-serif'
  }, new go.Binding("text", "name")), $(go.TextBlock, {
    row: 2,
    column: 1,
    font: '15pt sans-serif'
  }, new go.Binding("text", "gross")), $(go.TextBlock, {
    row: 3,
    column: 1,
    font: '15pt sans-serif'
  }, new go.Binding("text", "per_applicant"))));
  var model = $(go.TreeModel);
  model.nodeDataArray = data;
  myDiagram.model = model;
}

function getDaigramDataFromRateCards(feeType, rateCards) {
  var rateCardsFilteredByFeeType = R.filter(card => card[2] === feeType, rateCards);
  var groups = getProductGroups(rateCardsFilteredByFeeType);
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

function getProductGroups(rateCards) {
  var productTypes = R.uniq(R.map(el => el[1], rateCards));
  return R.map(type => R.filter(card => card[1] === type, rateCards), productTypes);
}

function getMapForProductGroups(groups) {
  return R.chain(x => x, groups.map((group, index) => {
    return R.concat([{
      parent: 'start',
      key: 'product_' + group[0][1].replace(/\s+/g, '-').toLowerCase(),
      name: 'Quote is for a ' + group[0][1],
      color: 'blue'
    }], getMapForExtraConditionsRateCards(getExtraConditionsGroups(group)));
  }, groups));
}

function getExtraConditionsString(rateCard) {
  return R.join('_', [rateCard[9], rateCard[10], rateCard[11], rateCard[12], rateCard[13], rateCard[14], rateCard[15]]);
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