import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

function SkillTree({ skills, onSkillClick }) {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

  useEffect(() => {
    if (!skills || skills.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const dependencyMap = new Map();
    skills.forEach(skill => {
      skill.dependencies?.forEach(depId => {
        if (!dependencyMap.has(skill.id)) {
          dependencyMap.set(skill.id, []);
        }
        dependencyMap.get(skill.id).push(depId);
      });
    });

    skills.forEach(skill => {
      skill.dependencies?.forEach(depId => {
        const depSkill = skills.find(s => s.id === depId);
        if (depSkill) {
          g.append('line')
            .attr('x1', depSkill.position_x)
            .attr('y1', depSkill.position_y)
            .attr('x2', skill.position_x)
            .attr('y2', skill.position_y)
            .attr('stroke', '#00f0ff')
            .attr('stroke-width', 2)
            .attr('opacity', 0.3);
        }
      });
    });

    const nodes = g.selectAll('.skill-node')
      .data(skills)
      .enter()
      .append('g')
      .attr('class', 'skill-node')
      .attr('transform', d => `translate(${d.position_x},${d.position_y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => onSkillClick(d));

    nodes.append('circle')
      .attr('r', d => {
        if (d.level === 1) return 25;
        if (d.level === 2) return 30;
        return 35;
      })
      .attr('fill', d => {
        if (d.completed) return '#00ff41';
        const allDepsCompleted = d.dependencies?.every(depId => {
          const depSkill = skills.find(s => s.id === depId);
          return depSkill?.completed;
        }) ?? true;
        return allDepsCompleted ? '#00f0ff' : '#666666';
      })
      .attr('stroke', d => {
        if (d.level === 3) return '#ff00ff';
        if (d.level === 2) return '#ffaa00';
        return '#00f0ff';
      })
      .attr('stroke-width', 3)
      .style('filter', d => 
        d.completed ? 'drop-shadow(0 0 10px #00ff41)' : 
        'drop-shadow(0 0 5px #00f0ff)'
      );

    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', d => d.completed ? '#0a0e27' : '#ffffff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(d => `L${d.level}`);

    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 50)
      .attr('fill', '#00f0ff')
      .attr('font-size', '11px')
      .text(d => {
        const maxLength = 20;
        return d.name.length > maxLength ? 
          d.name.substring(0, maxLength) + '...' : 
          d.name;
      });

    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 65)
      .attr('fill', '#ffaa00')
      .attr('font-size', '10px')
      .text(d => `${d.xp} XP`);

  }, [skills, dimensions, onSkillClick]);

  return (
    <div className="w-full h-full bg-cyber-bg rounded-lg border-2 border-cyber-accent overflow-hidden">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
}

export default SkillTree;
