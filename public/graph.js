/* PARAMETERS */

const minYear = 1937,
maxYear = 2020;

const states = ['USA','Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Washington DC', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana','Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

/* Get totals */

let allHundreds=[], temp;

for (let i=0; i<=maxYear - minYear; i++) {
    temp = [];
    for (let j=0; j<states.length; j++) {
        temp.push(100);
    }
    allHundreds.push(temp);
}

let totals, overallTotals;

fetch('/api/totals')
.then(response => response.json())
.then(data => {
    totals = data;
    overallTotals = data.reduce((acc,vec) => {
        return acc.map((x,i) => x + vec[i]);
    });
});

/* STATE VARIABLES */

/* List of all names */
var allNames = [];
/* List of main names */
var mainNameList = [];
/* Lists of subnames */
var subNames = {};
/* Names with corresponding display names */
var displayNames = {};
/* Colors to begin with to avoid random similar colors or difficult to see ones, user can override and make random */
var starterColors = ['#000', '#F00', '#090', '#00F', '#F0F', '#0FF', '#F90', '#909', '#963'];
/* Shuffle starter colors */
let s, t, r = starterColors.length;
while (r != 0) {
    t = Math.floor(Math.random() * r);
    r -= 1;
    s = starterColors[r];
    starterColors[r] = starterColors[t];
    starterColors[t] = s;
  }
/* An object to store name, color pairs */
var nameColors = {};
/* Current US state */
var state = 0;
/* Current graph being displayed, either a main name or just "main" */
var currentDisplay = "main";
/* Option to view raw count or percent */
var rawOrPercent = "raw";












/* SET UP DISPLAY */

const height = 700,
width = 960,
tPad = 75,
rPad = 50,
bPad = 50,
lPad = 50,
textLengthMultiplier = 8,
textBoxYUnit = 13,
textBoxXOffset = 10;

const mainSVG = d3.select("#mainSVG");

const graphSVG = mainSVG
.append("svg")
.attr("height","100%")
.attr("width", "100%")
.attr("viewBox", `0 0 ${width} ${height}`);


/* Add bottom axis */
const tScale = d3.scaleLinear()
.domain([minYear,maxYear])
.range([lPad, width - rPad]);

const tAxis = d3.axisBottom(tScale)
.tickFormat(d3.format("d"))
.ticks(10);

graphSVG.append("g")
.attr("transform", `translate(0, ${height - bPad})`)
.call(tAxis);

/* Add initial left axis */
let yScale = d3.scaleLinear()
.range([height - bPad, tPad]);

updateGraph("main", '');

/* Add helpful line */
const helpfulLine = graphSVG.append("path")
.attr("id", "helpfulLine")
.attr("d", d3.line()([[tScale(maxYear), height - bPad],[tScale(maxYear), tPad]]))
.attr("stroke","black")
.style("display", "none");

graphSVG.on("mouseover", helpfulLineOn)
.on("mousemove", helpfulLineOn)
.on("mouseout", helpfulLineOff);

/* Add name area */

const nameInput = d3.select("#nameInput");

nameInput
.on("keypress", (event) => {
        if (event.keyCode === 13) {
            nameSubmission("main", '');
        }
});

d3.select("#submitName")
.on("click", () => nameSubmission("main", ''));

const mainFlash = d3.select("#mainFlash");

const currentNames = d3.select("#currentNames");



/* Add options */

const stateSelection = d3.select("#stateSelection")
.attr("value", 0);

for (let i=0; i<=states.length; i++) {
    stateSelection.append("option")
    .attr("value", `${i}`)
    .html(states[i]);
}

stateSelection.on("change", () => {
    type = currentDisplay == "main" ? "main" : "sub";
    state = stateSelection.property("value");
    arrangeButtons(currentDisplay);
    updateGraph(type, currentDisplay);
});

const typeSelection = d3.select("#typeSelection");

typeSelection.on("change", () => {
    type = currentDisplay == "main" ? "main" : "sub";
    rawOrPercent = typeSelection.property("value");
    arrangeButtons(currentDisplay);
    updateGraph(type, currentDisplay);
});


d3.select("#randomName")
.on("click", () => {
    fetch('/api/Random')
    .then(response => response.json())
    .then(data => {
        nameDataReceived(data[1], data[0], data[0], data[0], "main");
    });
});







/* GRAPH UPDATE FUNCTIONS */

function updateYAxis(yMax) {
    yScale.domain([0, yMax]);
    const yAxis = d3.axisLeft(yScale)
    .ticks(10);

    graphSVG.select("#yAxis")
    .remove();

    graphSVG.append("g")
    .attr("id", "yAxis")
    .attr("transform", `translate(${lPad}, 0)`)
    .call(yAxis);
}

function makePath(data, name, mainName, type) {

    graphSVG.append("path")
    .datum(data)
    .attr("class", `${name} ${type} namePath`)
    .classed(mainName, true)
    .attr("fill", "none")
    .attr("stroke", nameColors[name + type])
    .attr("stroke-width", 1.5);

}

function updateGraph(type, mainName) {

    const adjustment = rawOrPercent == "raw" ? allHundreds : totals;


    let listOfNames;

    if (type == "sub") {
        listOfNames = subNames[mainName].map(name => name == mainName ? `.${name}.sub` : `.${name}.${mainName}.sub`);
    } else {
        listOfNames = mainNameList.map(name => `.${name}.main`);
    }

    /* Make all paths invisible */
    d3.selectAll(".namePath")
    .attr("display", "none");

    /* Get the maximum y-value from the listed names, default to min of 10 */
    let yMax = rawOrPercent == "raw" ? 10 : 0.0001;

    for (let i=0; i<listOfNames.length; i++) {
        dataMax = d3.select(`path${listOfNames[i]}`)
        .datum()
        .map((d,i) => (100/adjustment[i][state]) * d[state])
        .reduce((M, d) => Math.max(M,d), 0);
        yMax = Math.max(yMax, dataMax);
    }


    /* Update the y-axis */
    updateYAxis(yMax);


    /* Update paths to show */

    for (let i=0; i<listOfNames.length; i++) {
        d3.select(`path${listOfNames[i]}`)
        .attr("d", d3.line()
            .x((d,i) => tScale(i + minYear))
            .y((d,i) => yScale((100/adjustment[i][state]) * d[state])))
        .attr("display","block");


    }

    /* Update title */
    d3.select("#title")
    .remove()
    graphSVG.append("text")
    .attr("id", "title")
    .attr("x", width/2)
    .attr("y", tPad/3)
    .attr("text-anchor", "middle")
    .text(states[state]);


}














/* SIDEBAR UPDATE FUNCTIONS */

function arrangeButtons(name = "main") {
    if (name != "main") {
        arrangeButtons("main");
        expandButton(name);
    }
    const listOfNames = name == "main" ? mainNameList : subNames[name];
    const type = name == "main" ? "main" : "sub";
    listOfNames.sort((a,b) => {
        const aSum = d3.select(`path.${a}.${type}`)
        .datum()
        .reduce((sum,d) => sum + d[state], 0),
        bSum = d3.select(`path.${b}.${type}`)
        .datum()
        .reduce((sum,d) => sum + d[state], 0);
        return bSum - aSum;
    });

    d3.selectAll(`.nameButton.${type}.${name}`)
    .remove();

    for (let i=0; i<listOfNames.length; i++) {
        makeButton(listOfNames[i], name, type);
    }
}

function makeButton(name, mainName, type) {
    let nameButton;

    if (type == "main") {
        nameButton = currentNames.append("div")
        .attr("class", `nameButton ${name} ${type}`)
        .classed("nameButtonMain", true)
        .attr("open", false);
    } else {
        nameButton = d3.select(`.nameButtonMain.${mainName}.main`)
        .select("div.subButtons")
        .append("div")
        .attr("class", `nameButtonSub sub nameButton ${mainName}`)
        .classed(name, true);
    }

    let sumTotal = d3.select(`path.${name}.${type}`)
    .datum()
    .reduce((sum,d) => sum + d[state], 0);

    let displayTotal = rawOrPercent == "raw" ? commaInteger(sumTotal) : `${(100 * (sumTotal/overallTotals[state])).toFixed(3)}%`;
    
    nameButton
    .classed(mainName, true)
    .attr("name", name)
    .attr("type", type)
    .attr("sumTotal", sumTotal)
    .on("mouseover", nameButtonOver)
    .on("mouseout", nameButtonOut);


    const topRow = nameButton
    .append("div")
    .attr("class", "nameButtonTopRow");

    const nameAndColorDiv = topRow
    .append("div")
    .attr("class", "nameAndColor")

    nameAndColorDiv
    .append("svg")
    .attr("height", 15)
    .attr("width", 15)
    .append("rect")
    .attr("class", `colorSquare ${name} ${type}`)
    .attr("name", name)
    .attr("type", type)
    .attr("x", 0)
    .attr("y",0)
    .attr("height", 15)
    .attr("width", 15)
    .attr("fill", nameColors[name + type])
    .on("click", changeColor);

    nameAndColorDiv
    .append("p")
    .attr("class", `buttonText ${name} ${type}`)
    .text(`${displayNames[name]} ${displayTotal}`);

    const buttonDiv = topRow
    .append("div")
    .attr("class", `buttonDiv ${name} ${type}`)
    .style("visibility", "hidden");

    if (type=="main") {
        buttonDiv
        .append("button")
        .attr("class", `${name} moreButton`)
        .attr("name", name)
        .html('<i class="fa fa-caret-square-o-down"></i>')
        .on("click", moreClick);
    }

    buttonDiv
    .append("button")
    .attr("class", `${name} ${type} closeButton`)
    .html('<i class="fa fa-close"></i>')
    .on("click", () => removeName(name, mainName, type));
}












/* DATA IO AND EVENT HANDLING */

function nameSubmission(type, mainName) {

    /* remove any error messages */
    mainFlash.html('');
    if (d3.select('#subFlash')) {
        d3.select('#subFlash').html('');
    }

    /* Close any currently expanded buttons if main name submission */
    if (type=="main") {
        for (let i=0; i<mainNameList.length; i++) {
            collapseButton(mainNameList[i]);
        }
    }
    

    const flash = type=="main" ? mainFlash : d3.select("#subFlash");
    const nameIn = type=="main" ? nameInput : d3.select("#subNameInput");


    /* check and sanitize user input */
    const name = nameIn.property("value");
    const validation = validateName(name);

    if (!validation.ok) {
        return flash.html("<h3>Not a valid name.</h3>");
    }

    if (allNames.includes(validation.cleanedName)) {
        return flash.html(`<h3>${validation.cleanedName} is already added.</h3>`);
    }

    mainName = mainName == '' ? validation.cleanedName : mainName;

    /* Fetch data from API */
    fetch(`/api/${validation.cleanedName}`)
        .then(response => response.json())
        .then(data => {
            nameDataReceived(data, validation.cleanedName, mainName, validation.enteredName, type);
        });

    /* Clear input field */
    nameIn.property("value", '');
}

function nameDataReceived(data, name, mainName, displayName, type) {

    const flash = type=="main" ? mainFlash : d3.select("#subFlash");

    /* Flash an error if no data returned */
    if (!data) {
        return flash
        .html(`<h3>${name} did not occur at least five times in any of the years.</h3>`);
    }

    /* Add name/info to the relevant lists */
    allNames.push(name);
    displayNames[name] = displayName;
    if (type == "main") {
        mainNameList.push(name);
        subNames[name] = [name];
    } else {
        subNames[mainName].push(name);
    }

    /* Assign this name a starter color */
    if (type=="main") {
        if (starterColors.length > 0) {
            nameColors[name + type] = starterColors.shift();
        } else {
            newColor(name + type);
        }
    }
    newColor(name + "sub");
    

    /* Add data to path for name */
    bindNewNameData(data, name, mainName);

    /* Make button for name */
    if (type == "main") {
        arrangeButtons("main");
    } else {
        arrangeButtons(mainName);
    }

    /* Update display */
    updateGraph(type, mainName);

}


function bindNewNameData(data, name, mainName) {
    /* Make a new path for the name as a sub (either of a distinct primary name or of itself). */
    makePath(data, name, mainName, "sub");
    if (name == mainName) {
         /* If the path is for one of the main names, then we want to make a second new path for the name as a main name. */
        makePath(data, name, name, "main");
    } else {
        /* If the name is a sub of another, then we want to update the path of the main name by adding the new data of the subname. */
        let mainNameData = d3.select(`path.${mainName}.main`)
        .datum();

        mainNameData = addDataSets(mainNameData, data);
        d3.select(`path.${mainName}.main`)
        .datum(mainNameData);
        d3.selectAll(`circle.${mainName}.main`)
        .data(mainNameData);
    }

}

function removeName(name, mainName, type) {

    /* Clear any error message */
    mainFlash.html('');
    if (d3.select('#subFlash')) {
        d3.select('#subFlash').html('');
    }

    if (type == "sub") {
        /* Remove subname from main name's list */
        subNames[mainName] = subNames[mainName].filter(element => element != name);

        if (name == mainName) {
            /* If there were any other names, replace main name with the first other name to become the new main name */
            if (subNames[name].length > 0) {
                mainName = subNames[name][0];
                subNames[mainName] = subNames[name];
                mainNameList.push(mainName);
                nameColors[mainName + "main"] = nameColors[name + "main"];
                d3.select(`path.${name}.main`)
                .classed(mainName, true)
                .classed(name, false)

                d3.selectAll(`circle.${name}.main`)
                .classed(mainName, true)
                .classed(name, false);
                for (let i=0; i<subNames[mainName].length; i++) {
                    d3.selectAll(`path.${subNames[mainName][i]}.sub`)
                    .classed(mainName, true)
                    .classed(name, false);
                    d3.selectAll(`circle.${subNames[mainName][i]}.main`)
                    .classed(mainName, true)
                    .classed(name, false);
                }

                

                
            } else {
                type = "main";
            }

        }
    }

    if (type == "sub") {
        /* Adjust data associated with main name */
        let mainNameData = d3.select(`path.${mainName}.main`)
        .datum();
        let data = d3.select(`path.${name}.sub`).datum();
        mainNameData = subtractDataSets(mainNameData, data);
        d3.select(`path.${mainName}.main`)
        .datum(mainNameData);
        graphSVG.selectAll(`circle.${mainName}.main`)
        .data(mainNameData);

    }

    /* Delete name from lists */
    allNames = allNames.filter(element => element != name);
    mainNameList = mainNameList.filter(element => element != name);
    starterColors.push(nameColors[name + "main"]);
    starterColors.push(nameColors[name + "sub"]);
    delete nameColors[name + "main"];
    delete nameColors[name + "sub"];
    delete displayNames[name];
    delete subNames[name];

    /* Remove all of name's elements */
    d3.selectAll(`.${name}`)
    .remove();

    currentDisplay = "main";

    /* Update Buttons */
    arrangeButtons("main");
    if (type=="sub") {
        expandButton(mainName);
        currentDisplay = mainName;
    }

    /* Update graph */
    updateGraph(type, mainName);

}

function collapseButton(name) {

    /* Remove everything */
    d3.select(`.${name}.subButtons`)
    .remove();
    d3.select(`.${name}.subControls`)
    .remove();
    d3.select(`#subFlash`)
    .remove();
    d3.select("#divide")
    .remove();
    /* Set open attribute to false and reverse button arrow */
    d3.select(`.${name}.moreButton`)
    .html('<i class="fa fa-caret-square-o-down"></i>');
    d3.select(`.nameButtonMain.${name}.main`).attr("open", false);

    currentDisplay = "main";
}

function expandButton(name) {

    /* Select button */
    const button = d3.select(`.nameButtonMain.${name}.main`);

    /* Divide expanded part with horizontal line */

    button.append("hr")
    .attr("id","divide");
    
    /* Create area for subName Buttons */
    button.append("div")
    .attr("class", `${name} subButtons`);
    for (let i=0; i<subNames[name].length; i++) {
        makeButton(subNames[name][i], name, "sub");
    }

    /* Create new form to submit subnames */
    const subControls = button.append("div")
    .attr("class", `${name} subControls`);
    subControls.append("input")
    .attr("id", "subNameInput")
    .attr("type", "text")
    .on("keypress", (event) => {
        if (event.keyCode === 13) {
            nameSubmission("sub", name);
        }
    });

    subControls.append("button")
    .attr("id", "submitSubName")
    .html("Add Name")
    .on("click", () => nameSubmission("sub", name));

    button.append("div")
    .attr("id", `subFlash`)
    .attr("class", "flash");

    /* Set open attribute to true and reverse button arrow */
    d3.select(`.${name}.moreButton`)
    .html('<i class="fa fa-caret-square-o-up"></i>');
    button.attr("open", true);

    currentDisplay = name;
}

function moreClick() {

    /* Clear any error message */
    mainFlash.html('');
    if (d3.select('#subFlash')) {
        d3.select('#subFlash').html('');
    }

    /* Select the button to expand/collapse */
    const name = d3.select(this).attr("name");
    const button = d3.select(`.nameButtonMain.${name}.main`);

    /* Get value of open */
    const open = button.attr("open") == "false" ? false : true;

    /* Close any currently expanded buttons */
    for (let i=0; i<mainNameList.length; i++) {
        collapseButton(mainNameList[i]);
    }

    if (open) {
        /* Already collapsed above so just update graph */
        updateGraph("main", '');
    } else {
        /* Expand button */
        expandButton(name);
        /* Update graph */
        updateGraph("sub", `${name}`);
    }

}

function nameButtonOver() {
    

    let name = d3.select(this).attr("name");
    let type = d3.select(this).attr("type");

    d3.select(`path.${name}.${type}`)
    .attr("stroke-width", 3);

    d3.select(`.${name}.buttonDiv.${type}`)
    .style("visibility", "visible");

}

function nameButtonOut() {

    let name = d3.select(this).attr("name");
    let type = d3.select(this).attr("type");

    d3.select(`path.${name}.${type}`)
    .attr("stroke-width", 1.5);

    d3.select(`.${name}.buttonDiv.${type}`)
    .style("visibility", "hidden");

}

function changeColor() {

    /* Clear any error message */
    mainFlash.html('');
    if (d3.select('#subFlash')) {
        d3.select('#subFlash').html('');
    }

    const name = d3.select(this).attr("name");
    const type = d3.select(this).attr("type");
    newColor(name + type);

    d3.select(this).attr("fill", nameColors[name + type]);
    d3.select(`path.${name}.${type}`)
    .attr("stroke", nameColors[name + type]);

}

function helpfulLineOn(event) {

    d3.selectAll('.hover')
    .remove();

    let nearestYear = Math.round(tScale.invert(d3.pointer(event)[0]));
    if (nearestYear < minYear) {
        nearestYear = minYear;
    }
    if (nearestYear > maxYear) {
        nearestYear = maxYear;
    }

    helpfulLine
    .attr("d", d3.line()([[tScale(nearestYear), height - bPad],[tScale(nearestYear), tPad]]))
    .style("display", "block");

    graphSVG.append("text")
    .attr("class", "hover hoverYear")
    .attr("x", tScale(nearestYear))
    .attr("y", 0.95*tPad)
    .attr("text-anchor", "middle")
    .text(nearestYear);


    const listOfNames = currentDisplay == "main" ? mainNameList : subNames[currentDisplay];
    const type = currentDisplay == "main" ? "main" : "sub";
    let name, data, dataString, textBoxes = [];

    for (let i=0; i<listOfNames.length; i++) {
        name = listOfNames[i];

        data = d3.select(`path.${name}.${type}`).datum()[nearestYear - minYear][state];

        if (rawOrPercent == "percent") {
            data = (100/totals[nearestYear - minYear][state]) * data;
        }

        dataString = rawOrPercent == "raw" ? commaInteger(data) : `${data.toFixed(3)}%`;

        textBoxes.push([yScale(data), [`${displayNames[name]}: ${dataString}`]]);

        graphSVG.append("circle")
        .attr("class", "hoverDot hover")
        .attr("fill", "red")
        .attr("r", 5)
        .attr("cx", tScale(nearestYear))
        .attr("cy", yScale(data));

    }

    textBoxes.sort((a,b) => b[0] - a[0]);

    textBoxes = textBoxes.reduce((acc, item) => {
        if (acc.length == 0) return [item];
        const last = acc[acc.length - 1];

        if (last[0] - 2 * textBoxYUnit * last[1].length - item[0] > 0) {
            acc.push(item);
        } else {
            acc[acc.length-1][1].push(item[1][0]);
        }
        return acc;
    }, []);

    let boxX = tScale(nearestYear) + textBoxXOffset,
    boxY, boxHeight, boxWidth, edgeShift;

    for (let i=0; i<textBoxes.length; i++) {

        boxWidth = textLengthMultiplier * Math.max(...textBoxes[i][1].map(t => t.length));
        boxHeight = 2 * textBoxYUnit * textBoxes[i][1].length;
        boxY = textBoxes[i][0] + textBoxYUnit - boxHeight;

        edgeShift = boxX + boxWidth > width ? -2 * textBoxXOffset - boxWidth : 0;

        graphSVG.append("rect")
        .attr("class", "hoverRect hover")
        .attr("x", boxX + edgeShift)
        .attr("y", boxY)
        .attr("height", boxHeight)
        .attr("width", boxWidth)
        .attr("fill", "rgba(240,240,240,0.8)")
        .attr("stroke-width", 1)
        .attr("stroke", "#00F");

        for (let j=0; j<textBoxes[i][1].length; j++) {
            graphSVG.append("text")
            .attr("class", "hoverText hover")
            .attr("x", boxX + textBoxXOffset*0.5 + edgeShift)
            .attr("y", boxY + (3/2) * textBoxYUnit + 2 * textBoxYUnit * (textBoxes[i][1].length - 1 - j))
            .text(textBoxes[i][1][j]);

        }
    }
}

function helpfulLineOff() {
    helpfulLine.style("display", "none");

    d3.selectAll('.hover')
    .remove();

}








/* OTHER */

function commaInteger(n) {
    let splitIt = `${n}`.split('');

    const l = splitIt.length;

    return splitIt.map((c,i) => {
        if (i == l-1) return c;
        return (l - 1 - i) % 3 == 0 ? c + "," : c;
    }).join('');
}

function newColor(name) {

    const red = Math.floor(Math.random() * 16).toString(16),
    green = Math.floor(Math.random() * 16).toString(16),
    blue = Math.floor(Math.random() * 16).toString(16);

    nameColors[name] = `#${red}${green}${blue}`;

}

function validateName(name) {
    let parts = name.split(' ').filter(part => part != '');

    let result = parts.reduce((acc, part) => {
            if (!acc.ok) {
                    return acc;
            }

            let normPart = part.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

            if (!/[^a-z-]/.test(normPart)) {
                    acc.enteredName = acc.enteredName == '' ? part : acc.enteredName + ' ' + part;
                    normPart = normPart.split('-').join('');
                    acc.cleanedName = acc.cleanedName + normPart;
                    return acc;
            }

            return {
                    ok: false,
                    enteredName: '',
                    cleanedName: ''
            }

    }, {
            ok: true,
            enteredName: '',
            cleanedName: ''
    });

    if (result.ok) {
            result.cleanedName = result.cleanedName.slice(0,1).toUpperCase() 
            + result.cleanedName.slice(1,15);
    }

    return result;
}

function addDataSets(data1, data2) {
    let data = data1.map((d,i) => {
        if (typeof d == "number") {
            return d + data2[i];
        } else {
            return addDataSets(d, data2[i]);
        }
    });

    return data;
}

function subtractDataSets(data1, data2) {
    let data = data1.map((d,i) => {
        if (typeof d == "number") {
            return d - data2[i];
        } else {
            return subtractDataSets(d, data2[i]);
        }
    });

    return data;
}

