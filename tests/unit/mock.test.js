import { describe, it, expect } from 'vitest';
import { generateMockConfig } from '@/lib/topology/mock.js';

describe('Mock Config Generator', () => {
  it('generates deterministic output for same seed', () => {
    const config1 = generateMockConfig({ rows: 3, cols: 3, seed: 123 });
    const config2 = generateMockConfig({ rows: 3, cols: 3, seed: 123 });
    
    expect(config1).toEqual(config2);
  });

  it('generates different output for different seeds', () => {
    const config1 = generateMockConfig({ rows: 3, cols: 3, seed: 123 });
    const config2 = generateMockConfig({ rows: 3, cols: 3, seed: 456 });
    
    // Test that something random is different, e.g. number of bridges/connections
    const connections1 = config1.connections.length;
    const connections2 = config2.connections.length;
    
    // We can't guarantee length is different, but deep equality should be false
    expect(config1).not.toEqual(config2);
  });

  it('generates correct number of routers', () => {
    const config = generateMockConfig({ rows: 4, cols: 2 });
    expect(config.routers).toHaveLength(8);
  });

  it('returns valid element structures', () => {
    const config = generateMockConfig({ rows: 1, cols: 2 });
    
    const r0 = config.routers[0];
    expect(r0.id).toBe('router-0-0');
    expect(r0.x).toBeTypeOf('number');
    expect(r0.y).toBeTypeOf('number');
    
    const b0 = config.bridges[0];
    expect(b0.id).toMatch(/^bridge-0-0-\d+$/);
    expect(b0.routerId).toBe('router-0-0');
    expect(b0.x).toBeTypeOf('number');
    expect(b0.y).toBeTypeOf('number');

    const c0 = config.connections[0];
    expect(c0.id).toBeDefined();
    expect(c0.fromId).toBeDefined();
    expect(c0.toId).toBeDefined();
    expect(c0.lineCount).toBeGreaterThan(0);
    expect(['from', 'to', 'bidirectional']).toContain(c0.direction);
  });

  it('generates horizontal and vertical links', () => {
    const config = generateMockConfig({ rows: 3, cols: 3 });
    
    // Look for horizontal links
    const hLinks = config.connections.filter(c => c.meta?.axis === 'horizontal');
    // 3 rows, 2 links per row = 6
    expect(hLinks).toHaveLength(6);
    
    // Look for vertical links (only in center column)
    const vLinks = config.connections.filter(c => c.meta?.axis === 'vertical');
    // 2 links in center column
    expect(vLinks).toHaveLength(2);
  });
});
