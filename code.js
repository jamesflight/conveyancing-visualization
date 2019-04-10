function init(allRateCards) {
    var feeTypes = R.uniq(R.map((el) => el[2], allRateCards));

    feeTypes.forEach((el) => {
      var node = document.createElement("div");
      node.className = 'diagram-window';
      node.id='myDiagramDiv_' + el.replace(/\s+/g, '-').toLowerCase();
      var title = document.createElement("h1");
      title.innerHTML = el;
      document.getElementById("wrapper").appendChild(title);
      document.getElementById("wrapper").appendChild(node);
      createDiagram(node.id, getDaigramDataFromRateCards(el, allRateCards)); 
    })
}

function createDiagram(divId, data) {
  var $ = go.GraphObject.make;
  var myDiagram =
    $(go.Diagram, divId,
      {
        "undoManager.isEnabled": true,
        layout: $(go.TreeLayout,
                  { angle: 90, layerSpacing: 35 })
      });
  
  myDiagram.nodeTemplate =
  $(go.Node, "Auto",
  $(go.Shape, "RoundedRectangle",
    new go.Binding("fill", "color")),
  $(go.Panel, "Table",
    { defaultAlignment: go.Spot.Left, margin: 10 },
    $(go.TextBlock, { row: 1, column: 1, font: '20pt sans-serif' }, new go.Binding("text", "name")),
    $(go.TextBlock, { row: 2, column: 1, font: '20pt sans-serif' }, new go.Binding("text", "net")),
  )
);
  
  var model = $(go.TreeModel);
  model.nodeDataArray = data;
  myDiagram.model = model;
}

export function getUniqueKeys(x) {
    return x + 1;
}

function getDaigramDataFromRateCards(feeType, rateCards) {
  var rateCardsFilteredByFeeType = R.filter((card) => card[2] === feeType, rateCards);
  var groups = getProductGroups(rateCardsFilteredByFeeType);
  return R.chain(x => x, groups.map((group, index) => {
    return [{
      key: index.toString(),
      name: group[0][1] + '?',
      color: 'blue',
    }];
  }, groups));
  // return [
  //   { key: "1",              name: "New Build?", color: "red", net: "Net: £40"   },
  //   { key: "2", parent: "1", name: "Demeter", color: "green"    },
  //   { key: "3", parent: "1", name: "Copricat", color: "red"   },
  //   { key: "4", parent: "3", name: "Jellylorum", color: "yellow" },
  //   { key: "5", parent: "3", name: "Alonzo", color: "red"     },
  //   { key: "6", parent: "2", name: "Munkustrap", color: "red" }
  // ];
}

function getProductGroups(rateCards) {
  var productTypes = R.uniq(R.map((el) => el[1], rateCards));
  return R.map((type) => R.filter((card) => card[1] === type, rateCards), productTypes);
}