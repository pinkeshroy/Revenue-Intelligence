import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface MonthlyData {
  month: string;
  revenue: number;
  target: number;
}

interface RevenueTrendChartProps {
  data: MonthlyData[];
}

function formatMonth(monthStr: string): string {
  const date = new Date(monthStr + '-01');
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }
  return value.toString();
}

export default function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight || 200;
    const width = containerWidth;
    const height = Math.max(200, containerHeight);
    const margin = { top: 20, right: 40, bottom: 40, left: 60 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, innerWidth])
      .padding(0.3);

    const maxValue = Math.max(
      d3.max(data, d => d.revenue) || 0,
      d3.max(data, d => d.target) || 0
    );

    const yScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([innerHeight, 0]);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#e0e0e0')
      .attr('stroke-dasharray', '3,3');

    g.selectAll('.grid .domain').remove();

    // Draw bars (revenue)
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.month) || 0)
      .attr('y', d => yScale(d.revenue))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.revenue))
      .attr('fill', '#1e3a5f')
      .attr('rx', 4);

    // Create line generator for target
    const line = d3.line<MonthlyData>()
      .x(d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .y(d => yScale(d.target))
      .curve(d3.curveMonotoneX);

    // Draw target line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#f5a623')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Draw target dots
    g.selectAll('.target-dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'target-dot')
      .attr('cx', d => (xScale(d.month) || 0) + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.target))
      .attr('r', 5)
      .attr('fill', '#f5a623')
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(formatMonth))
      .selectAll('text')
      .attr('font-size', '12px')
      .attr('fill', '#666');

    g.selectAll('.domain').attr('stroke', '#ccc');
    g.selectAll('.tick line').attr('stroke', '#ccc');

    // Y axis
    g.append('g')
      .call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickFormat(d => formatCurrency(d as number))
      )
      .selectAll('text')
      .attr('font-size', '12px')
      .attr('fill', '#666');

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left + 10}, ${height - 15})`);

    // Revenue legend
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 16)
      .attr('height', 12)
      .attr('fill', '#1e3a5f')
      .attr('rx', 2);

    legend.append('text')
      .attr('x', 22)
      .attr('y', 10)
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text('Revenue');

    // Target legend
    legend.append('line')
      .attr('x1', 100)
      .attr('y1', 6)
      .attr('x2', 130)
      .attr('y2', 6)
      .attr('stroke', '#f5a623')
      .attr('stroke-width', 3);

    legend.append('circle')
      .attr('cx', 115)
      .attr('cy', 6)
      .attr('r', 4)
      .attr('fill', '#f5a623');

    legend.append('text')
      .attr('x', 138)
      .attr('y', 10)
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text('Target');

  }, [data]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, flexShrink: 0 }}>
          Revenue Trend (Last 6 Months)
        </Typography>
        <Box ref={containerRef} sx={{ flex: 1, width: '100%', minHeight: 180 }}>
          <svg ref={svgRef} width="100%" height="100%" />
        </Box>
      </CardContent>
    </Card>
  );
}
