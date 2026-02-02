import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface MiniTrendChartProps {
  data: number[];
  color?: string;
}

export default function MiniTrendChart({ data, color = '#4caf50' }: MiniTrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 100;
    const height = svgRef.current.clientHeight || 40;
    const margin = { top: 4, right: 4, bottom: 4, left: 4 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([0, innerWidth]);

    const yExtent = d3.extent(data) as [number, number];
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1 || 1;
    
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([innerHeight, 0]);

    // Create line generator
    const line = d3.line<number>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX);

    // Create area generator
    const area = d3.area<number>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1(d => yScale(d))
      .curve(d3.curveMonotoneX);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add gradient
    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0);

    // Draw area
    g.append('path')
      .datum(data)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area);

    // Draw line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

  }, [data, color]);

  return (
    <svg 
      ref={svgRef} 
      width="100%" 
      height="100%"
      style={{ display: 'block' }}
    />
  );
}
