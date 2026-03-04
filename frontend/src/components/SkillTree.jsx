import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

function SkillTree({ skills, onSkillClick }) {
  const svgRef = useRef();
  const containerRef = useRef();

  const draw = useCallback(() => {
    if (!skills || skills.length === 0 || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const defs = svg.append('defs');

    defs.append('radialGradient')
      .attr('id', 'glow-cyan')
      .selectAll('stop')
      .data([{offset: '0%', color: '#00e5ff', opacity: 0.6}, {offset: '100%', color: '#00e5ff', opacity: 0}])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)
      .attr('stop-opacity', d => d.opacity);

    defs.append('radialGradient')
      .attr('id', 'glow-green')
      .selectAll('stop')
      .data([{offset: '0%', color: '#00ff41', opacity: 0.6}, {offset: '100%', color: '#00ff41', opacity: 0}])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)
      .attr('stop-opacity', d => d.opacity);

    defs.append('radialGradient')
      .attr('id', 'glow-amber')
      .selectAll('stop')
      .data([{offset: '0%', color: '#ffaa00', opacity: 0.6}, {offset: '100%', color: '#ffaa00', opacity: 0}])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)
      .attr('stop-opacity', d => d.opacity);

    const filter = defs.append('filter').attr('id', 'node-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const gridGroup = g.append('g').attr('class', 'grid');
    for (let x = -200; x < 800; x += 100) {
      gridGroup.append('line')
        .attr('x1', x).attr('y1', -200).attr('x2', x).attr('y2', 800)
        .attr('stroke', '#00e5ff').attr('stroke-width', 0.3).attr('opacity', 0.06);
    }
    for (let y = -200; y < 800; y += 100) {
      gridGroup.append('line')
        .attr('x1', -200).attr('y1', y).attr('x2', 800).attr('y2', y)
        .attr('stroke', '#00e5ff').attr('stroke-width', 0.3).attr('opacity', 0.06);
    }

    skills.forEach(skill => {
      skill.dependencies?.forEach(depId => {
        const depSkill = skills.find(s => s.id === depId);
        if (depSkill) {
          const gradient = defs.append('linearGradient')
            .attr('id', `edge-${depSkill.id}-${skill.id}`)
            .attr('x1', depSkill.position_x).attr('y1', depSkill.position_y)
            .attr('x2', skill.position_x).attr('y2', skill.position_y)
            .attr('gradientUnits', 'userSpaceOnUse');
          gradient.append('stop').attr('offset', '0%').attr('stop-color', '#00e5ff').attr('stop-opacity', 0.5);
          gradient.append('stop').attr('offset', '100%').attr('stop-color', '#d946ef').attr('stop-opacity', 0.2);

          g.append('line')
            .attr('x1', depSkill.position_x).attr('y1', depSkill.position_y)
            .attr('x2', skill.position_x).attr('y2', skill.position_y)
            .attr('stroke', `url(#edge-${depSkill.id}-${skill.id})`)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '6 4')
            .attr('opacity', 0.5);
        }
      });
    });

    const getNodeColor = (d) => {
      if (d.completed) return '#00ff41';
      if (d.submission_status === 'pending') return '#ffaa00';
      const allDepsCompleted = d.dependencies?.every(depId => {
        const dep = skills.find(s => s.id === depId);
        return dep?.completed;
      }) ?? true;
      return allDepsCompleted ? '#00e5ff' : '#2a2f52';
    };

    const getGlowId = (d) => {
      if (d.completed) return 'url(#glow-green)';
      if (d.submission_status === 'pending') return 'url(#glow-amber)';
      return 'url(#glow-cyan)';
    };

    const getRadius = (d) => {
      if (d.level === 1) return 22;
      if (d.level === 2) return 28;
      return 34;
    };

    const nodes = g.selectAll('.skill-node')
      .data(skills)
      .enter()
      .append('g')
      .attr('class', 'skill-node')
      .attr('transform', d => `translate(${d.position_x},${d.position_y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => onSkillClick(d));

    nodes.append('circle')
      .attr('r', d => getRadius(d) + 15)
      .attr('fill', d => getGlowId(d))
      .attr('opacity', d => d.completed || d.submission_status === 'pending' ? 0.4 : 0.15);

    const hexPath = (r) => {
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        points.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
      }
      return `M${points.join('L')}Z`;
    };

    nodes.append('path')
      .attr('d', d => hexPath(getRadius(d)))
      .attr('fill', d => {
        const color = getNodeColor(d);
        return color === '#2a2f52' ? '#151a3a' : color + '15';
      })
      .attr('stroke', d => getNodeColor(d))
      .attr('stroke-width', d => d.completed ? 2.5 : 1.5)
      .attr('filter', 'url(#node-glow)');

    nodes.append('path')
      .attr('d', d => hexPath(getRadius(d) - 5))
      .attr('fill', 'none')
      .attr('stroke', d => getNodeColor(d))
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);

    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 2)
      .attr('fill', d => {
        const color = getNodeColor(d);
        return color === '#2a2f52' ? '#4a5568' : '#ffffff';
      })
      .attr('font-family', 'Orbitron, sans-serif')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('letter-spacing', '0.1em')
      .text(d => `L${d.level}`);

    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => getRadius(d) + 18)
      .attr('fill', d => getNodeColor(d) === '#2a2f52' ? '#4a5568' : '#c8d6e5')
      .attr('font-family', 'Rajdhani, sans-serif')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(d => d.name.length > 18 ? d.name.substring(0, 18) + '...' : d.name);

    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => getRadius(d) + 32)
      .attr('fill', '#ffaa00')
      .attr('font-family', 'Share Tech Mono, monospace')
      .attr('font-size', '10px')
      .attr('opacity', 0.7)
      .text(d => `${d.xp} XP`);

  }, [skills, onSkillClick]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden cyber-border" style={{background: 'radial-gradient(ellipse at center, #0d1230 0%, #080c24 70%)'}}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}

export default SkillTree;
