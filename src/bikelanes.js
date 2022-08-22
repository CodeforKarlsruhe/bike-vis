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
    //deckgl.setProps({layers: [tiles, trips, scatter, bmap, bg]});
    await deckgl.setProps({ layers: [tiles, trips, labels] });
    setTimeout(animate, 100)
  } else {
    console.log("Finished")
    tm = startWeek
    setTimeout(animate, 100)
  }
}


// load data 
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

//setTimeout(animate,1000)

