import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface MiniBarChartProps {
  data: number[];
  color?: string;
}

export default function MiniBarChart({ data, color = '#1e3a5f' }: MiniBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 120;
    const height = svgRef.current.clientHeight || 40;
    const margin = { top: 2, right: 2, bottom: 2, left: 2 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.map((_, i) => i.toString()))
      .range([0, innerWidth])
      .padding(0.3);

    const yMax = d3.max(data) || 1;
    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([innerHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw bars
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (_, i) => xScale(i.toString()) || 0)
      .attr('y', d => yScale(d))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d))
      .attr('fill', color)
      .attr('rx', 1);

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
