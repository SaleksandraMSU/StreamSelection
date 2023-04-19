const map = new ol.Map({
    layers:[
        new ol.layer.Tile({
            source: new ol.source.TileJSON({
                url: 'https://api.maptiler.com/maps/basic-v2/tiles.json?key=pKZZptLfdOLREyAbjgBu',
                tileSize: 512,
            })
        })
    ],
    target: 'map',
    view: new ol.View({
        center: ol.proj.fromLonLat([-59.000000, -3.026387]),
        zoom: 7
    })
})

var N = 7
function getRange(){
    N = Number(document.getElementById('range').value);
    update_styles();
    streams.getSource().changed();
    return N
}

var W = 0.5
function getMinWidth(){
    W = Number(document.getElementById('min_width').value);
    update_styles();
    streams.getSource().changed();
    return W
}

var M = 4
function getMaxWidth(){
    M = Number(document.getElementById('max_width').value);
    update_styles();
    streams.getSource().changed();
    return M
}

function stepper(btn, inputId, min, max, step) {
    let id = btn.getAttribute("id");
    let inputEl = document.getElementById(inputId);
    let val = inputEl.getAttribute("value");
    let calcStep = (id == "increment") ? (step * 1) : (step * -1);
    let newValue = parseFloat(val) + calcStep;

    if (newValue >= min && newValue <= max) {
        inputEl.setAttribute("value", newValue);
    }
}

const emptystyle = new ol.style.Style({});
var styles = [];
var stylesCopy = undefined;
var styles_reversed = undefined;

function update_styles() {
    styles = [];
    for (let i = 0; i < N; ++i) {
        styles.push(
            new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'blue',
                    width: W + i*((M-W)/(N-1))
                }),
            })
        )
    }
    stylesCopy = Array.from(styles)
    styles_reversed = stylesCopy.reverse();
    
}

update_styles();

const xhr = new XMLHttpRequest();
xhr.open('GET', 'https://raw.githubusercontent.com/SaleksandraMSU/StreamSelection/main/ClippedStreams.geojson');
const maxValues = {};
xhr.onload = function() {
  if (xhr.status === 200) {
    const geojson = JSON.parse(xhr.responseText);
    const table = [];
    geojson.features.forEach(feature => {
      const row = {};
      Object.entries(feature.properties).forEach(([key, value]) => {
        row[key] = value;
      });
      table.push(row);
    });

    Object.keys(table[0]).forEach(column => {
      maxValues[column] = Math.max(...table.map(row => row[column]));
    });
  }
};
xhr.send();

function getstyle(order) {
    if (streamorder == 'Hack' ) {
    let style_choice = Math.round(((Math.log(order+1)))/(Math.log(maxValues.Hack+1))*N)
    for(let i=0; i<N; i++) {
        index = i + 1
        if(index == style_choice) {
        return styles_reversed[i];
            }
        }
    } 
    if (streamorder == 'Shreve' ) {
    let style_choice = Math.round(((Math.log(order+1))/(Math.log(maxValues.Shreve+1)))*N)
    for(let i=0; i<N; i++) {
        index = i + 1
        if(index == style_choice) {
        return styles[i];
            }
        }
    } else {
    let style_choice = Math.round((order/maxValues.Strahler)*N)
    for(let i=0; i<N; i++) {
        index = i + 1
        if(index == style_choice) {
        return styles[i];
            }
        } 
    }
};

var streamorder = 'Hack'; 

const streams = new ol.layer.Vector({
    source: new ol.source.Vector({
    url: 'https://raw.githubusercontent.com/SaleksandraMSU/StreamSelection/main/ClippedStreams.geojson',
    format: new ol.format.GeoJSON(),
    }),
    style: function (feature, resolution) {
        const order = feature.get(streamorder)
        if (streamorder == 'Hack') {
            if (order <= 52.292*(resolution**(-0.529))
                ) {
                return getstyle(order)
            } else {
                return emptystyle
            }
        } 
        if (streamorder == 'Strahler') {
            if (order >= 0.0602*(resolution**(0.6276))
                ) {
                return getstyle(order)
            } else {
                return emptystyle
            }
        } 
        if (streamorder == 'Horton') {
            if (order >= (1.64*Math.log(resolution))-6.5196
                ) {
                return getstyle(order)
            } else {
                return emptystyle
            }
        }
        if (streamorder == 'Shreve') {
            if (order >= 0.0000000002*(resolution**4)-0.0000001*(resolution**3)+0.00004*(resolution**2) + 0.0132*resolution - 0.9973
                ) {
                return getstyle(order)
            } else {
                return emptystyle
            }  
    }
}})

map.addLayer(streams);

const streamsorderElements = document.querySelectorAll('.sidebar > input[type=radio]')
for(let streamsorderElement of streamsorderElements){
    streamsorderElement.addEventListener('click', function(){
        streamorder = this.value;
        streams.getSource().changed();
    })
}