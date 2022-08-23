/*
* https://deck.gl/docs/api-reference/geo-layers/trips-layer

from https://codepen.io/pen?&editors=001

https://deck.gl/docs/get-started/using-standalone

https://deck.gl/docs/api-reference/core/view

https://ckochis.com/deck-gl-time-frame-animations

https://deck.gl/docs/developer-guide/custom-layers/layer-lifecycle

https://deck.gl/docs/faq

https://stackoverflow.com/questions/59296549/deck-gl-without-react-but-with-webpack-is-not-rendered-the-specified-container

https://deck.gl/docs/developer-guide/interactivity

https://github.com/streamlit/streamlit/issues/475

https://deck.gl/docs/api-reference/layers/bitmap-layer

https://deck.gl/docs/api-reference/geo-layers/tile-layer

https://deck.gl/docs/api-reference/layers/text-layer

https://deck.gl/docs/api-reference/layers/path-layer


*/

import { Deck } from '@deck.gl/core';
import { TripsLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { PolygonLayer } from '@deck.gl/layers';
import { BitmapLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { TextLayer } from '@deck.gl/layers';
import { GeoJsonLayer } from '@deck.gl/layers';

import { MapView } from '@deck.gl/core';

var tripData = []
var startYear = 0
var stopYear = 0
var startWeek = 20
var tm = startWeek
var speed = 5
var fadeTrips = false


const INITIAL_VIEW_STATE = {
  longitude: 8.4013, // -122.4,
  latitude: 49.0045, // 37.74,
  zoom: 12,
  minZoom: 0,
  maxZoom: 19,
  pitch: 0, // (Number, optional) - pitch angle in degrees. Default 0 (top-down). was 30
  bearing: 0 //  (Number, optional) - bearing angle in degrees. Default 0 (north).
};


const LABEL_VIEW_STATE = {
  longitude: INITIAL_VIEW_STATE.longitude, // - .1, // -122.4,
  latitude: INITIAL_VIEW_STATE.latitude, // + .01, // 37.74,
  zoom: 11,
  minZoom: 11,
  maxZoom: 11,
  pitch: 0, // (Number, optional) - pitch angle in degrees. Default 0 (top-down). was 30
  bearing: 0 //  (Number, optional) - bearing angle in degrees. Default 0 (north).
};


const tiles = new TileLayer({
  // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
  id: 'TileLayer',
  data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',

  zoom: INITIAL_VIEW_STATE.zoom,
  minZoom: INITIAL_VIEW_STATE.minZoom,
  maxZoom: INITIAL_VIEW_STATE.maxZoom,
  tileSize: 256,

  /*
  one tile for center plus adjacent rows and columns
  e.g. 512*256 => 6 tiles: 1 center plus 5 surroundings 
  */

  renderSubLayers: props => {
    const {
      bbox: { west, south, east, north }
    } = props.tile;

    return new BitmapLayer(props, {
      data: null,
      image: props.data,
      bounds: [west, south, east, north]
    });
  }
});

var kaDistricts = {
  "type":"FeatureCollection",
  "features":[
    {
      "type":"Feature",
      "properties":{
        "Stadtteilnummer":24,
        "name":"Gruenwettersbach"
      },
      "geometry":{
        "type":"Polygon",
        "coordinates":[
          [
            [8.462117977546761,48.96734486425342],
            [8.462746381549259,48.96691292074247],
            [8.46297316113151,48.96700856796365],
            [8.463574455685585,48.96726216936275],
            [8.463877989004013,48.96739018587112],
            [8.464317849897355,48.96757569557222],
            [8.465483061813076,48.96825639613044],
            [8.46157983718158,48.96756208620175],
            [8.461932511421717,48.96743470287827],
            [8.462117977546761,48.96734486425342]            
          ]
        ]
      }
    }
  ]
}

var districts = new GeoJsonLayer({
  id: 'districts',
  data : kaDistricts,
  pickable: true,
  stroked: false,
  filled: true,
  extruded: true,
  pointType: 'circle',
  lineWidthScale: 20,
  lineWidthMinPixels: 2,
  getFillColor: [10,10,10,10],
  getLineColor: [200,0,0], // d => colorToRGBArray(d.properties.color),
  getPointRadius: 100,
  getLineWidth: 5,
  getElevation: 30
});

async function mkDistricts(data) {
  const districts = new GeoJsonLayer({
    id: 'CityLayer',
    data : data,
    pickable: true,
    stroked: false,
    filled: true,
    extruded: true,
    pointType: 'circle',
    lineWidthScale: 20,
    lineWidthMinPixels: 2,
    getFillColor: [10,10,10,100],
    getLineColor: [200,0,0,100], // d => colorToRGBArray(d.properties.color),
    getPointRadius: 100,
    getLineWidth: 5,
    getElevation: 30,
    opacity: 0.2,
  });
  return districts  
}

async function mkLabel(lbl = "Jahr ...") {
  const labels = new TextLayer({
    id: 'TextLayer',
    data: [
      {
        name: lbl.toString(),
        coordinates: [LABEL_VIEW_STATE.longitude, LABEL_VIEW_STATE.latitude]
      },
    ],
    pickable: false,
    background: true,
    getBackgroundColor: [255,255,255],
    backgroundPadding: [10,10],
    getPosition: d => d.coordinates,
    getText: d => d.name,
    getSize: 24,
    getAngle: 0,
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center'
  })
  return labels
}


async function mkTrips(tm = 500) {
  const trips = await new TripsLayer({
    id: 'TripsLayer',
    data: tripData, //'/data/lanes.json', // trips2.json', // sf-trips.json',

    /* props from TripsLayer class */

    currentTime: tm,
    fadeTrail: fadeTrips, // default: true
    // modify timetamps
    //getTimestamps: d => d.waypoints.map(p => p.timestamp - 1554772579000),
    getTimestamps: d => d.waypoints.map(p => p.timestamp),
    //getColor: [253, 128, 93],
    // can use color from trip, don't neet color per point
    getColor: d => d.color, // d.waypoints.map(p => p.color),
    trailLength: 600,

    /* props inherited from PathLayer class */

    // billboard: false,
    capRounded: true,
    getPath: d => d.waypoints.map(p => p.coordinates),
    // getWidth: 1,
    jointRounded: true,
    // miterLimit: 4,
    // rounded: true,
    // widthMaxPixels: Number.MAX_SAFE_INTEGER,
    widthMinPixels: 8,
    // widthScale: 1,
    // widthUnits: 'meters',

    /* props inherited from Layer class */

    // autoHighlight: false,
    // coordinateOrigin: [0, 0, 0],
    // coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
    // highlightColor: [0, 0, 128, 128],
    // modelMatrix: null,
    opacity: 0.8,
    // pickable: false,
    // visible: true,
    // wrapLongitude: false,

  });
  return trips
}


function layerFilter({ layer, viewport }) {
  if (viewport.id === 'label' && layer.id === 'TripsLayer') {
    // Exclude layer on view
    return false;
  }
  if (viewport.id === 'label' && layer.id === 'TileLayer') {
    return false;
  }
  if (viewport.id === 'label' && layer.id === 'CityLayer') {
    return false;
  }
  if (viewport.id === 'map' && layer.id === 'TextLayer') {
    return false;
  }
  //console.log("Filter:",layer,viewport)
  return true;
}

const deckgl = new Deck({
  // The container to append the auto-created canvas to.
  parent: document.getElementById("#deck"), //document.body,
  canvas: "cv", // document.getElementById("#cv"), // unset
  width: "1280px",
  height: "720px",
  initialViewState: INITIAL_VIEW_STATE,
  controller: { dragRotate: false }, //true,
  layerFilter: layerFilter,
  layers: [tiles],
  views: [
    new MapView({
      id: "map",
      initialViewState: INITIAL_VIEW_STATE,
      controller: { dragRotate: false },
      x: 0,
      y: 0,
      width: "100%",
      height: "100%",
    }),
    new MapView({
      id: "label",
      x: 0,
      y: 0,
      width: "100px",
      height: "30px",
      initialViewState: LABEL_VIEW_STATE,
      controller: false,
    }),
  ]

});

function setS(e) {
  speed = parseInt(e.target.value)
  document.getElementById("sp").innerHTML = speed.toString()
  //console.log("Speed:", speed)
}

async function restart() {
  tm = startWeek
}

document.getElementById("sets").addEventListener("input", setS)
document.getElementById("restart").addEventListener("click", restart)

async function animate() {
  const tmVal = document.getElementById("tm") || null
  if (tmVal != null)
    tmVal.innerHTML = tm.toString()

  if (tm == startWeek) {
    // maybe we could load the data here and initialize all paths.
    // don't know how to do this yet ...
  }
  if (tm < (stopYear - startYear + 1) * 52) {
    tm += speed / 10 // speed is int, scale here
    //console.log("Current:",tm)
    const trips = await mkTrips(tm)
    // time is in weeks, first year is 2012
    const year = Math.floor(startYear + tm / 52)
    const labels = await mkLabel(year)
    const districts = await mkDistricts(kaDistricts)
    //deckgl.setProps({layers: [tiles, trips, scatter, bmap, bg]});
    await deckgl.setProps({ layers: [tiles, trips, labels, districts] });
    setTimeout(animate, 100)
  } else {
    console.log("Finished")
    tm = startWeek
    setTimeout(animate, 100)
  }
}


// load data 
async function loadLanes() {
  try {
    const response = await fetch("/data/lanes.json")
    console.log("Fetch1 status", response.status)
    if (!response.ok) throw (new Error ("Fetch lanes failed"))
    const data = await response.json()
    tripData = data
    startYear = data[0].year
    startWeek = data[0].week
    stopYear = data[data.length - 1].year
    console.log("Start/stop:", startYear, stopYear)
    const evt = new Event('input', { bubbles: true })
    document.getElementById("sets").dispatchEvent(evt) // set initial speed
    setTimeout(animate, 1000) // start animation
  } catch (e) {
    alert("Fetch1 failed: ", e.message)
  }
}

async function loadCity() {
  try {
    const response = await fetch("/data/ka.geojson")
    console.log("Fetch2 status", response.status)
    if (!response.ok) throw (new Error ("Fetch city failed"))
    const data = await response.json()
    kaDistricts = data
    //districts = await mkDistricts(data)
    await loadLanes()
  } catch (e) {
    alert("Fetch1 failed: ", e.message)
  }
}


loadCity()

/*
fetch("/data/lanes.json")
  .then((response) => {
    if (!response.ok) {
      alert("Fetch failed: ", response.status)
      throw (new Error("HTTP error!"))
    }
    console.log("Fetch status", response.status)
    return response.json()
  }
  )
  .then((data) => {
    //console.log("Fetch data",data)
    tripData = data
    startYear = data[0].year
    startWeek = data[0].week
    stopYear = data[data.length - 1].year
    console.log("Start/stop:", startYear, stopYear)
    const evt = new Event('input', { bubbles: true })
    document.getElementById("sets").dispatchEvent(evt) // set initial speed
    setTimeout(animate, 1000) // start animation
  }
  )

// load data 
fetch("/data/ka.geojson")
  .then((response) => {
    if (!response.ok) {
      alert("Fetch2 failed: ", response.status)
      throw (new Error("HTTP error!"))
    }
    console.log("Fetch2 status", response.status)
    return response.json()
    }
  )
  .then((data) => {
    //console.log("Fetch data",data)
    kaDistricts = data
    districtsLoaded = true
    }
  )

*/

//setTimeout(animate,1000)
