/* PLEASE DO NOT CHANGE THIS FRAMEWORK ....
the get requests are all implemented and working ... 
so there is no need to alter ANY of the existing code: 
rather you just ADD your own ... */

window.onload = function () {
  document.querySelector("#queryChoice").selectedIndex = 0;
  //create once :)
  let description = document.querySelector("#Ex4_title");
  //array to hold the dataPoints
  let dataPoints = [];

  // /**** GeT THE DATA initially :: default view *******/
  // /*** no need to change this one  **/
  runQueryDefault("onload");

  /***** Get the data from drop down selection ****/
  let querySelectDropDown = document.querySelector("#queryChoice");

  querySelectDropDown.onchange = function () {
    console.log(this.value);
    let copyVal = this.value;
    console.log(copyVal);
    runQuery(copyVal);
  };

  /******************* RUN QUERY***************************  */
  async function runQuery(queryPath) {
    // // //build the url -end point
    const url = `/${queryPath}`;
    try {
      let res = await fetch(url);
      let resJSON = await res.json();
      console.log(resJSON);

      //reset the
      document.querySelector("#childOne").innerHTML = "";
      description.textContent = "";
      document.querySelector("#parent-wrapper").style.background =
        "rgba(51,102,255,.2)";

      switch (queryPath) {
        case "default": {
          displayAsDefault(resJSON);
          break;
        }
        case "one": {
          //sabine done
          displayInCirclularPattern(resJSON);
          break;
        }
        case "two": {
          //sabine done
          displayByGroups(resJSON, "weather", "eventName");
          break;
        }
        /***** TO DO FOR EXERCISE 4 *************************
         ** 1: Once you have implemented the mongodb query in server.py,
         ** you will receive it from the get request (THE FETCH HAS ALREADY BEEN IMPLEMENTED:: SEE ABOVE) 
         ** and will automatically will enter into the correct select case
         **  - based on the value that the user chose from the drop down list...)
         ** You need to design and call a custom display function FOR EACH query that you construct ...
         ** 4 queries - I want 4 UNIQUE display functions - you can use the ones I created
         ** as inspiration ONLY - DO NOT just copy and change colors ... experiment, explore, change ...
         ** you can create your own custom objects - but NO images, video or sound... (will get 0).
         ** bonus: if your visualizations(s) are interactive or animate.
         ****/
        case "three": {
          console.log("three");
          displayPositiveSpiral(resJSON);
          break;
        }
        case "four": {
          console.log("four")
          displayEventShelves(resJSON);
          break;
        }

        case "five": {
          console.log("five")
          displayImpactTracks(resJSON);
          break;
        }
        case "six": {
          console.log("six")
          displayStormBands(resJSON);
          break;
        }
        default: {
          console.log("default case");
          break;
        }
      } //switch
    } catch (err) {
      console.log(err);
    }
  }
  //will make a get request for the data ...

  /******************* RUN DEFAULT QUERY***************************  */
  async function runQueryDefault(queryPath) {
    // // //build the url -end point
    const url = `/${queryPath}`;
    try {
      let res = await fetch(url);
      let resJSON = await res.json();
      console.log(resJSON);
      displayAsDefault(resJSON);
    } catch (err) {
      console.log(err);
    }
  }
  /*******************DISPLAY AS GROUP****************************/

  function displayByGroups(resultObj, propOne, propTwo) {
    dataPoints = [];
    let finalHeight = 0;
    //order by WEATHER and Have the event names as the color  ....

    //set background of parent ... for fun ..
    document.querySelector("#parent-wrapper").style.background =
      "rgba(51, 153, 102,1)";
    description.textContent = "BY WEATHER AND ALSO HAVE EVENT NAMES {COLOR}";
    description.style.color = "rgb(179, 230, 204)";

    let coloredEvents = {};
    let resultSet = resultObj.results;

    //reget
    let possibleEvents = resultObj.events;
    let possibleColors = [
      "rgb(198, 236, 217)",
      "rgb(179, 230, 204)",
      "rgb(159, 223, 190)",
      "rgb(140, 217, 177)",
      "rgb(121, 210, 164)",
      "rgb(102, 204, 151)",
      "rgb(83, 198, 138)",
      "rgb(64, 191, 125)",
      "rgb(255, 204, 179)",
      "rgb(255, 170, 128)",
      "rgb(255, 153, 102)",
      "rgb(255, 136, 77)",
      "rgb(255, 119, 51)",
      "rgb(255, 102, 26)",
      "rgb(255, 85, 0)",
      "rgb(230, 77, 0)",
      "rgb(204, 68, 0)",
    ];

    for (let i = 0; i < possibleColors.length; i++) {
      coloredEvents[possibleEvents[i]] = possibleColors[i];
    }

    let offsetX = 20;
    let offsetY = 150;
    // find the weather of the first one ...
    let currentGroup = resultSet[0][propOne];
    console.log(currentGroup);
    let xPos = offsetX;
    let yPos = offsetY;

    for (let i = 0; i < resultSet.length - 1; i++) {
      dataPoints.push(
        new myDataPoint(
          resultSet[i].dataId,
          resultSet[i].day,
          resultSet[i].weather,
          resultSet[i].start_mood,
          resultSet[i].after_mood,
          resultSet[i].after_mood_strength,
          resultSet[i].event_affect_strength,
          resultSet[i].event_name,
          //map to the EVENT ...
          coloredEvents[resultSet[i].event_name],
          //last parameter is where should this go...
          document.querySelector("#childOne"),
          //which css style///
          "point_two"
        )
      );

      /** check if we have changed group ***/
      if (resultSet[i][propOne] !== currentGroup) {
        //update
        currentGroup = resultSet[i][propOne];
        offsetX += 150;
        offsetY = 150;
        xPos = offsetX;
        yPos = offsetY;
      }
      // if not just keep on....
      else {
        if (i % 10 === 0 && i !== 0) {
          xPos = offsetX;
          yPos = yPos + 15;
        } else {
          xPos = xPos + 15;
        }
      } //end outer else

      dataPoints[i].update(xPos, yPos);
      finalHeight = yPos;
    } //for

    document.querySelector("#childOne").style.height = `${finalHeight + 20}px`;
  } //function

  /*****************DISPLAY IN CIRCUlAR PATTERN:: <ONE>******************************/
  function displayInCirclularPattern(resultOBj) {
    //reset
    dataPoints = [];
    let xPos = 0;
    let yPos = 0;
    //for circle drawing
    let angle = 0;
    let centerX = window.innerWidth / 2;
    let centerY = 350;

    let scalar = 300;
    let yHeight = Math.cos(angle) * scalar + centerY;

    let resultSet = resultOBj.results;
    let coloredMoods = {};

    let possibleMoods = resultOBj.moods;
    let possibleColors = [
      "rgba(0, 64, 255,.5)",
      "rgba(26, 83, 255,.5)",
      "rgba(51, 102, 255,.7)",
      "rgba(51, 102, 255,.4)",
      "rgba(77, 121,255,.6)",
      "rgba(102, 140, 255,.6)",
      "rgba(128, 159, 255,.4)",
      "rgba(153, 179, 255,.3)",
      "rgba(179, 198, 255,.6)",
      "rgba(204, 217, 255,.4)",
    ];

    for (let i = 0; i < possibleMoods.length; i++) {
      coloredMoods[possibleMoods[i]] = possibleColors[i];
    }

    //set background of parent ... for fun ..
    document.querySelector("#parent-wrapper").style.background =
      "rgba(0, 26, 102,1)";
    description.textContent = "BY AFTER MOOD";
    description.style.color = "rgba(0, 64, 255,.5)";

    for (let i = 0; i < resultSet.length - 1; i++) {
      dataPoints.push(
        new myDataPoint(
          resultSet[i].dataId,
          resultSet[i].day,
          resultSet[i].weather,
          resultSet[i].start_mood,
          resultSet[i].after_mood,
          resultSet[i].after_mood_strength,
          resultSet[i].event_affect_strength,
          resultSet[i].event_name,
          //map to the day ...
          coloredMoods[resultSet[i].after_mood],
          //last parameter is where should this go...
          document.querySelector("#childOne"),
          //which css style///
          "point_two"
        )
      );
      /*** circle drawing ***/
      xPos = Math.sin(angle) * scalar + centerX;
      yPos = Math.cos(angle) * scalar + centerY;
      angle += 0.13;

      if (angle > 2 * Math.PI) {
        angle = 0;
        scalar -= 20;
      }
      dataPoints[i].update(xPos, yPos);
    } //for

    document.querySelector("#childOne").style.height = `${yHeight}px`;
  } //function

  /*****************DISPLAY AS DEFAULT GRID :: AT ONLOAD ******************************/
  function displayAsDefault(resultOBj) {
    //reset
    dataPoints = [];
    let xPos = 0;
    let yPos = 0;
    const NUM_COLS = 50;
    const CELL_SIZE = 20;
    let coloredDays = {};
    let resultSet = resultOBj.results;
    possibleDays = resultOBj.days;
    /*
  1: get the array of days (the second entry in the resultOBj)
  2: for each possible day (7)  - create a key value pair -> day: color and put in the
  coloredDays object
  */
    console.log(possibleDays);
    let possibleColors = [
      "rgb(255, 102, 153)",
      "rgb(255, 77, 136)",
      "rgb(255, 51, 119)",
      "rgb(255, 26, 102)",
      "rgb(255, 0, 85)",
      "rgb(255, 0, 85)",
      "rgb(255, 0, 85)",
    ];

    for (let i = 0; i < possibleDays.length; i++) {
      coloredDays[possibleDays[i]] = possibleColors[i];
    }
/* for through each result
1: create a new MyDataPoint object and pass the properties from the db result entry to the object constructor
2: set the color using the coloredDays object associated with the resultSet[i].day
3:  put into the dataPoints array.
**/
    //set background of parent ... for fun ..
    document.querySelector("#parent-wrapper").style.background =
      "rgba(255,0,0,.4)";
    description.textContent = "DEfAULT CASE";
    description.style.color = "rgb(255, 0, 85)";

    //last  element is the helper array...
    for (let i = 0; i < resultSet.length - 1; i++) {
      dataPoints.push(
        new myDataPoint(
          resultSet[i].dataId,
          resultSet[i].day,
          resultSet[i].weather,
          resultSet[i].start_mood,
          resultSet[i].after_mood,
          resultSet[i].after_mood_strength,
          resultSet[i].event_affect_strength,
          resultSet[i].evnet_name,
          //map to the day ...
          coloredDays[resultSet[i].day],
          //last parameter is where should this go...
          document.querySelector("#childOne"),
          //which css style///
          "point"
        )
      );

      /** this code is rather brittle - but does the job for now .. draw a grid of data points ..
//*** drawing a grid ****/
      if (i % NUM_COLS === 0) {
        //reset x and inc y (go to next row)
        xPos = 0;
        yPos += CELL_SIZE;
      } else {
        //just move along in the column
        xPos += CELL_SIZE;
      }
      //update the position of the data point...
      dataPoints[i].update(xPos, yPos);
    } //for
    document.querySelector("#childOne").style.height = `${yPos + CELL_SIZE}px`;
  } //function

  /***********************************************/


/************* THREE: Positive Spiral (after_mood is positive) *************/
  function displayPositiveSpiral(resultObj) {
    dataPoints = [];
    const resultSet = resultObj.results;
    const parent = document.querySelector("#childOne");

    // Background & title
    document.querySelector("#parent-wrapper").style.background =
      "radial-gradient(circle at center, rgba(255,255,204,1) 0%, rgba(255,204,102,0.7) 40%, rgba(255,153,51,0.8) 100%)";
    description.textContent = "POSITIVE MOODS — Spiral of intensity";
    description.style.color = "rgb(153, 76, 0)";

    const centerX = window.innerWidth / 2;
    const centerY = 350;
    const angleStep = 0.18;
    const baseRadius = 60;
    const radiusStep = 12;
    let angle = 0;
    let maxY = centerY;

    for (let i = 0; i < resultSet.length; i++) {
      const entry = resultSet[i];
      const strength = parseInt(entry.after_mood_strength) || 5;

      // Warm color based on strength
      const hue = 45 - (strength - 1) * 3; // 45 ~ yellow → lower = more orange
      const color = `hsl(${hue}, 90%, 55%)`;

      const dp = new myDataPoint(
        entry.dataId,
        entry.day,
        entry.weather,
        entry.start_mood,
        entry.after_mood,
        entry.after_mood_strength,
        entry.event_affect_strength,
        entry.event_name,
        color,
        parent,
        "point_two"
      );
      dataPoints.push(dp);

      const radius = baseRadius + strength * radiusStep + i * 0.2;
      const xPos = Math.sin(angle) * radius + centerX;
      const yPos = Math.cos(angle) * radius + centerY;
      dp.update(xPos, yPos);

      if (yPos > maxY) maxY = yPos;
      angle += angleStep;
      if (angle > Math.PI * 2) {
        angle = 0;
      }
    }

    parent.style.height = `${maxY + 60}px`;
  }

  /************* FOUR: Event Shelves (sorted by event_name) *************/
  function displayEventShelves(resultObj) {
    dataPoints = [];
    const resultSet = resultObj.results;
    const parent = document.querySelector("#childOne");

    document.querySelector("#parent-wrapper").style.background =
      "linear-gradient(180deg, rgba(245,245,245,1) 0%, rgba(220,235,255,1) 100%)";
    description.textContent = "EVENT SHELVES — entries grouped by event name";
    description.style.color = "rgb(0, 76, 153)";

    const shelfGap = 70;
    const leftMargin = 90;
    const xStep = 18;

    let currentEvent =
      resultSet.length > 0 ? resultSet[0].event_name : null;
    let shelfIndex = 0;
    let itemIndexOnShelf = 0;
    let maxY = 0;

    for (let i = 0; i < resultSet.length; i++) {
      const entry = resultSet[i];

      if (entry.event_name !== currentEvent) {
        currentEvent = entry.event_name;
        shelfIndex++;
        itemIndexOnShelf = 0;
      }

      const baseY = 120 + shelfIndex * shelfGap;
      const xPos = leftMargin + itemIndexOnShelf * xStep;
      const yPos = baseY + (Math.random() * 10 - 5);

      const strength = parseInt(entry.after_mood_strength) || 5;
      const lightness = 35 + strength * 4; // stronger mood = brighter tile
      const color = `hsl(210, 70%, ${lightness}%)`;

      const dp = new myDataPoint(
        entry.dataId,
        entry.day,
        entry.weather,
        entry.start_mood,
        entry.after_mood,
        entry.after_mood_strength,
        entry.event_affect_strength,
        entry.event_name,
        color,
        parent,
        "point_two"
      );
      dataPoints.push(dp);
      dp.update(xPos, yPos);

      itemIndexOnShelf++;
      if (yPos > maxY) maxY = yPos;

      // label the shelf once at its start
      if (itemIndexOnShelf === 1) {
        const label = document.createElement("span");
        label.textContent = entry.event_name;
        label.style.position = "absolute";
        label.style.left = "10px";
        label.style.top = baseY - 6 + "px";
        label.style.fontSize = "11px";
        label.style.color = "rgb(0, 51, 102)";
        parent.appendChild(label);
      }
    }

    parent.style.height = `${maxY + 60}px`;
  }

  /************* FIVE: Impact Tracks (Mon vs Tue, event_affect_strength) *************/
  function displayImpactTracks(resultObj) {
    dataPoints = [];
    const resultSet = resultObj.results;
    const parent = document.querySelector("#childOne");

    document.querySelector("#parent-wrapper").style.background =
      "linear-gradient(180deg, rgba(230,255,240,1) 0%, rgba(204,230,255,1) 100%)";
    description.textContent = "IMPACT TRACKS — Monday vs Tuesday by event impact";
    description.style.color = "rgb(0, 102, 51)";

    const baseX = 80;
    const stepX = 50;
    const rowY = {
      Monday: 220,
      Tuesday: 360,
    };

    const eventColors = {};
    const palette = [
      "#ff6f61",
      "#ffb347",
      "#ffd966",
      "#9ad0c2",
      "#6fa8dc",
      "#8e7cc3",
      "#d78ad2",
      "#f4b6c2",
    ];
    let colorIndex = 0;
    let maxX = 0;

    resultSet.forEach((entry) => {
      const day = entry.day;
      if (!rowY[day]) return;

      if (!eventColors[entry.event_name]) {
        eventColors[entry.event_name] =
          palette[colorIndex % palette.length];
        colorIndex++;
      }

      const strength = parseInt(entry.event_affect_strength) || 5;
      const xPos =
        baseX + strength * stepX + (Math.random() * 12 - 6);
      const yPos = rowY[day] + (Math.random() * 10 - 5);

      const dp = new myDataPoint(
        entry.dataId,
        entry.day,
        entry.weather,
        entry.start_mood,
        entry.after_mood,
        entry.after_mood_strength,
        entry.event_affect_strength,
        entry.event_name,
        eventColors[entry.event_name],
        parent,
        "point_two"
      );
      dataPoints.push(dp);
      dp.update(xPos, yPos);

      if (xPos > maxX) maxX = xPos;
    });

    // Track labels
    Object.keys(rowY).forEach((day) => {
      const label = document.createElement("span");
      label.textContent = day;
      label.style.position = "absolute";
      label.style.left = "10px";
      label.style.top = rowY[day] - 6 + "px";
      label.style.fontSize = "12px";
      label.style.fontWeight = "600";
      label.style.color = "rgb(0, 102, 51)";
      parent.appendChild(label);
    });

    // Legend
    const legend = document.createElement("div");
    legend.style.position = "absolute";
    legend.style.right = "20px";
    legend.style.top = "40px";
    legend.style.fontSize = "11px";
    legend.style.background = "rgba(255,255,255,0.85)";
    legend.style.padding = "8px 10px";
    legend.style.borderRadius = "8px";
    legend.style.maxWidth = "220px";
    legend.style.lineHeight = "1.4";
    legend.innerHTML = "<strong>Event Colors</strong><br>";

    Object.keys(eventColors).forEach((evName) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.marginTop = "2px";
      row.innerHTML = `
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:${eventColors[evName]};"></span>
        <span>${evName}</span>
      `;
      legend.appendChild(row);
    });
    parent.appendChild(legend);

    parent.style.height = `430px`;
    parent.style.width = `${maxX + 80}px`;
  }

  /************* SIX: Storm Bands (negative→negative, by weather) *************/
  function displayStormBands(resultObj) {
    dataPoints = [];
    const resultSet = resultObj.results;
    const parent = document.querySelector("#childOne");

    document.querySelector("#parent-wrapper").style.background =
      "radial-gradient(circle at top, rgba(0,0,30,1) 0%, rgba(10,10,40,1) 40%, rgba(20,20,60,1) 100%)";
    description.textContent = "STORM BANDS — persistent negative moods by weather";
    description.style.color = "rgb(204, 230, 255)";

    const weatherOrder = [];
    resultSet.forEach((entry) => {
      if (!weatherOrder.includes(entry.weather)) {
        weatherOrder.push(entry.weather);
      }
    });

    const bandWidth = 120;
    const baseTop = 150;
    const rowHeight = 18;
    const baseLeft = 80;
    const rowsPerBand = 18;
    let maxY = 0;

    const bandRowIndex = {};
    weatherOrder.forEach((w) => (bandRowIndex[w] = 0));

    resultSet.forEach((entry) => {
      const weather = entry.weather;
      const bandIndex = weatherOrder.indexOf(weather);
      if (bandIndex === -1) return;

      const rowIndex = bandRowIndex[weather];
      const colIndex = rowIndex % rowsPerBand;
      const stackIndex = Math.floor(rowIndex / rowsPerBand);

      const xBase = baseLeft + bandIndex * bandWidth + stackIndex * 14;
      const xPos = xBase + (Math.random() * 10 - 5);
      const yPos =
        baseTop + colIndex * rowHeight + (Math.random() * 6 - 3);

      const affect = parseInt(entry.event_affect_strength) || 5;
      const lightness = 80 - affect * 4; // stronger affect = darker
      const color = `hsl(220, 70%, ${lightness}%)`;

      const dp = new myDataPoint(
        entry.dataId,
        entry.day,
        entry.weather,
        entry.start_mood,
        entry.after_mood,
        entry.after_mood_strength,
        entry.event_affect_strength,
        entry.event_name,
        color,
        parent,
        "point_two"
      );
      dataPoints.push(dp);
      dp.update(xPos, yPos);

      bandRowIndex[weather]++;
      if (yPos > maxY) maxY = yPos;
    });

    // Weather labels
    weatherOrder.forEach((weather, idx) => {
      const label = document.createElement("span");
      label.textContent = weather;
      label.style.position = "absolute";
      label.style.left = baseLeft + idx * bandWidth + "px";
      label.style.top = maxY + 30 + "px";
      label.style.fontSize = "11px";
      label.style.color = "rgb(204, 230, 255)";
      parent.appendChild(label);
    });

    parent.style.height = `${maxY + 80}px`;
  }

  /***********************************************/
};