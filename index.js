// Set up the chart dimensions
const width = document.querySelector(".main").clientWidth;
const height = width * 0.66;

let countriesData;
let regionsData;

function getCountriesDataTransform(data) {
  // Transforms countries data into something that can be used by d3.
  return data.map((d) => {
    return {
      name: d.country,
      label: d.alpha3Code,
      border: d.borders.length,
      timezone: d.timezones.length,
      language: d.languages.length,
      ...d,
    };
  });
}

function getRegionsDataTransform(data) {
  // Transforms countries data into regions data by counting
  // countries and timezones.
  regions = {};

  data.forEach((country) => {
    if (!regions[country.region]) {
      regions[country.region] = {
        countries: 1,
        timezones: new Set(country.timezones),
      };
    } else {
      regions[country.region].countries += 1;
      const newTimezones = new Set(country.timezones);
      regions[country.region].timezones =
        regions[country.region].timezones.union(newTimezones);
    }
  });

  transformedData = [];
  for (const [key, value] of Object.entries(regions)) {
    transformedData.push({
      name: key,
      label: key,
      regionCountries: value.countries,
      regionTimezones: value.timezones.size,
    });
  }
  return transformedData;
}

function drawBubbleChart(data, selection) {
  d3.selectAll(".bubble").remove();

  const svg = d3
    .select("#bubbleChart")
    .attr("width", width)
    .attr("height", height);

  // Create a "packed bubble chart" where the radius of each bubble
  // corresponds to the value of the datapoint.
  const pack = d3.pack().size([width, height]).padding(2);

  const hierarchy = d3.hierarchy({ children: data }).sum((d) => d[selection]);

  const root = pack(hierarchy);

  const bubbles = svg
    .selectAll(".bubble")
    .data(root.descendants().slice(1))
    .enter()
    .append("g")
    .attr("class", "bubble")
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`);

  bubbles.append("circle").attr("r", (d) => d.r);

  // Scale the font of a bubble to the size of the bubble.
  var max_value = d3.max(data, (d) => d[selection]);
  var fontScale = d3.scaleLinear().domain([0, max_value]).range([0, 15]);

  // Put text on the bubble, showing the designated label and selected statistic.
  bubbles
    .append("text")
    .attr("dy", "-0.4em")
    .style("text-anchor", "middle")
    .style("font-size", (d) => `${fontScale(d.data[selection])}px`)
    .append("tspan")
    .text((d) => d.data.label)
    .append("tspan")
    .attr("x", 0)
    .attr("dy", "1.2em")
    .text((d) => d.data[selection]);

  d3.selectAll("text").style("fill", "white");

  // Apply a tooltip to each bubble that shows information about the country.
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  svg
    .selectAll(".bubble")
    .on("mouseover", (event, d) => {
      console.log(d);
      if (d.data.capital) {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(
            `Country: ${d.data.name}<br>Capital: ${d.data.capital}<br>Region: ${d.data.region}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      }
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

function drawTable(data, option) {
  data.sort((a, b) => a[option] - b[option]).reverse();
  tableBodyElement = document.querySelector("#dataTable tbody");

  tableElement = document.querySelector("#dataTable");

  // Remove the tbody to redraw the table entirely.
  tableBodyElement = tableElement.querySelector("tbody");
  if (tableBodyElement) {
    tableBodyElement.remove();
  }

  data.forEach((item) => {
    newRow = tableElement.insertRow(-1);
    let labelCell = newRow.insertCell(-1);
    // Append a text node to the cell
    let label = document.createTextNode(item.name);
    labelCell.appendChild(label);
    let valueCell = newRow.insertCell(-1);
    let value = document.createTextNode(item[option].toLocaleString());
    valueCell.appendChild(value);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  d3.json("data/countries.json").then((data) => {
    countriesData = getCountriesDataTransform(data);
    regionsData = getRegionsDataTransform(data);

    // Display population as a default on page load.
    drawBubbleChart(countriesData, "population");
    drawTable(countriesData, "population");
  });

  d3.select("#chartSelect").on("change", function () {
    var option = d3.select(this).property("value");
    if (option.startsWith("region")) {
      drawBubbleChart(regionsData, option);
      drawTable(regionsData, option);
    } else {
      drawBubbleChart(countriesData, option);
      drawTable(countriesData, option);
    }
  });
});
