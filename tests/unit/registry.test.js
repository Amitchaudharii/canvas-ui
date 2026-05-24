import { describe, it, expect, beforeEach } from 'vitest';
import { ElementRegistry } from '@/lib/topology/registry.js';

describe('ElementRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new ElementRegistry();
  });

  const createDummyRouter = (id, classNames = 'router', meta = {}) => ({
    id,
    type: 'router',
    className: classNames,
    meta,
    style: {},
    state: {},
  });

  const createDummyBridge = (id, meta = {}) => ({
    id,
    type: 'bridge',
    className: 'bridge',
    meta,
    style: {},
    state: {},
  });

  describe('Registration & Indexing', () => {
    it('populates all 4 indexes on register()', () => {
      const el = createDummyRouter('r1', 'primary', { status: 'active', zone: 'A' });
      registry.register(el);

      // _byId
      expect(registry.getElementById('r1')).toBe(el);
      
      // _byType
      const byType = registry.getByType('router');
      expect(byType.count).toBe(1);
      expect(byType.elements).toContain(el);

      // _byClass
      expect(registry.querySelector('.primary')).toBe(el);

      // _byAttr
      expect(registry.querySelectorAll('[status=active]')).toContain(el);
      expect(registry.querySelectorAll('[zone=A]')).toContain(el);
    });

    it('removes from all indexes cleanly on unregister()', () => {
      const el = createDummyRouter('r1', 'router', { status: 'active' });
      registry.register(el);
      registry.unregister('r1');

      expect(registry.getElementById('r1')).toBeNull();
      expect(registry.getByType('router').count).toBe(0);
      expect(registry.querySelector('.router')).toBeNull();
      expect(registry.querySelectorAll('[status=active]')).toHaveLength(0);
    });

    it('empties everything on clear()', () => {
      registry.register(createDummyRouter('r1'));
      registry.register(createDummyBridge('b1'));
      
      expect(registry.size).toBe(2);
      registry.clear();
      expect(registry.size).toBe(0);
      expect(registry.getByType('router').count).toBe(0);
    });
  });

  describe('DOM-style Query API', () => {
    beforeEach(() => {
      registry.register(createDummyRouter('r1', 'router', { status: 'active' }));
      registry.register(createDummyRouter('r2', 'highlighted', { status: 'inactive' }));
      registry.register(createDummyBridge('b1', { parent: 'r1' }));
    });

    it('getElementById()', () => {
      expect(registry.getElementById('r1').id).toBe('r1');
      expect(registry.getElementById('missing')).toBeNull();
    });

    it('querySelector() by id (#id)', () => {
      expect(registry.querySelector('#r2').id).toBe('r2');
      expect(registry.querySelector('#missing')).toBeNull();
    });

    it('querySelector() by class (.class)', () => {
      expect(registry.querySelector('.highlighted').id).toBe('r2');
      expect(registry.querySelector('.missing')).toBeNull();
    });

    it('querySelectorAll() by type', () => {
      const routers = registry.querySelectorAll('router');
      expect(routers).toHaveLength(2);
      expect(routers.map(r => r.id)).toEqual(expect.arrayContaining(['r1', 'r2']));
    });

    it('querySelectorAll() by attribute ([key=val])', () => {
      const active = registry.querySelectorAll('[status=active]');
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('r1');

      const missingAttr = registry.querySelectorAll('[foo=bar]');
      expect(missingAttr).toHaveLength(0);
    });

    it('querySelectorAll() with multi-selector (a, b)', () => {
      const mixed = registry.querySelectorAll('router, bridge');
      expect(mixed).toHaveLength(3); // r1, r2, b1
      
      const mixedWithDuplicates = registry.querySelectorAll('router, .highlighted');
      expect(mixedWithDuplicates).toHaveLength(2); // Should deduplicate r2
    });

    it('getAll() returns all elements', () => {
      const all = registry.getAll();
      expect(all).toHaveLength(3);
    });
  });

  describe('Bulk Mutation Helpers', () => {
    it('applyStyle() applies to all matching elements', () => {
      registry.register(createDummyRouter('r1'));
      registry.register(createDummyRouter('r2'));
      
      registry.applyStyle('router', { strokeColor: '#f00' });
      
      expect(registry.getElementById('r1').style.strokeColor).toBe('#f00');
      expect(registry.getElementById('r2').style.strokeColor).toBe('#f00');
    });

    it('applyState() applies to all matching elements', () => {
      registry.register(createDummyRouter('r1'));
      registry.register(createDummyBridge('b1'));
      
      registry.applyState('bridge', { visible: false });
      
      expect(registry.getElementById('r1').state.visible).toBeUndefined();
      expect(registry.getElementById('b1').state.visible).toBe(false);
    });
  });
});
