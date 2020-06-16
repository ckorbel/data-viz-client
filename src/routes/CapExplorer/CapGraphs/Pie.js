import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import * as d3 from "d3";
import { filterCapCategories } from "../../../utils/cap-explorer";

const PieStyled = styled.div`
  width: 45%;
  height: "fit-content";
  margin-left: 20px;
  svg:not(:root) {
    overflow: visible;
  }
`;

const width = 550;
const height = 550;
const margin = 40;

const Pie = ({ selectedTeamsData, removeSelection }) => {
  const [filters, setFilters] = useState({
    id: 1,
    __typename: "",
    year: "",
  });

  const d3Container = useRef(null);

  useEffect(() => {
    buildDataVizualtion();
  }, [selectedTeamsData]);

  const buildDataVizualtion = () => {
    if (selectedTeamsData && d3Container.current) {
      const radius = Math.min(width, height) / 2 - margin;

      const svg = d3
        .select(d3Container.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      const data = filterCapCategories(
        selectedTeamsData?.yearlyPostSpending?.[0],
        filters
      );
      const color = d3.scaleOrdinal(d3.schemeBlues[9]);

      // Compute the position of each group on the pie:
      const pie = d3
        .pie()
        .sort(null) // Do not sort group by size
        .value((d) => {
          return d.value;
        });
      const data_ready = pie(d3.entries(data));

      // The arc generator
      const arc = d3
        .arc()
        .innerRadius(radius * 0.5) // This is the size of the donut hole
        .outerRadius(radius * 0.8);

      // Another arc that won't be drawn. Just for labels positioning
      const outerArc = d3
        .arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

      // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
      svg
        .selectAll("allSlices")
        .data(data_ready)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) => {
          return color(d.data.key);
        })
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7);

      // Add the polylines between chart and labels:
      svg
        .selectAll("allPolylines")
        .data(data_ready)
        .enter()
        .append("polyline")
        .attr("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr("points", (d) => {
          const posA = arc.centroid(d); // line insertion in the slice
          const posB = outerArc.centroid(d); // line break: we use the other arc generator that has been built only for that
          const posC = outerArc.centroid(d); // Label position = almost the same as posB
          const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2; // we need the angle to see if the X position will be at the extreme right or extreme left
          posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
          return [posA, posB, posC];
        });

      // Add the polylines between chart and labels:

      svg
        .selectAll("allLabels")
        .data(data_ready)
        .enter()
        .append("text")
        .text((d) => {
          const sum = d3.sum(d3.values(data));
          const percentage = (d.data.value / sum) * 100;
          const percent = percentage.toString().split(".")[0];
          console.log(percent);
          console.log(d.data.value, percentage * 100);
          return `${d.data.key.toUpperCase()} ${percent}%`;
        })
        .attr("transform", (d) => {
          const pos = outerArc.centroid(d);
          const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
          pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
          return "translate(" + pos + ")";
        })
        .style("text-anchor", (d) => {
          const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
          return midangle < Math.PI ? "start" : "end";
        });
    }
  };

  const removeFromExplorer = (event) => {
    event.preventDefault();
    removeSelection(selectedTeamsData.id);
  };

  return (
    <>
      <PieStyled>
        <div>{selectedTeamsData.name}</div>
        <button onClick={removeFromExplorer}>X</button>
        <svg
          viewBox="0 0 550 550"
          xmlns="http://www.w3.org/2000/svg"
          overflow="visible"
          className="d3-component"
          ref={d3Container}
        />
      </PieStyled>
    </>
  );
};

export default Pie;
