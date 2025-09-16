import { renderHook, act } from '@/test/utils';
import { useCart } from '@/hooks/useCart';
import { expect, test, describe, beforeEach, vi } from 'vitest';
import { createMockCabinetType, createMockColor, createMockDoorStyle, createMockHardwareBrand } from '@/test/factories/cabinetFactory';
import type { CabinetConfiguration } from '@/types/cabinet';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client');

describe('useCart Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('initializes with empty cart', () => {
    const { result } = renderHook(() => useCart());
    
    expect(result.current.cartItems).toEqual([]);
    expect(result.current.totalAmount).toBe(0);
    expect(result.current.totalItems).toBe(0);
  });

  test('adds item to cart', async () => {
    const { result } = renderHook(() => useCart());
    
    const mockConfiguration: CabinetConfiguration = {
      cabinetType: createMockCabinetType(),
      width: 600,
      height: 720,
      depth: 560,
      quantity: 1,
      color: createMockColor(),
      doorStyle: createMockDoorStyle(),
      hardwareBrand: createMockHardwareBrand(),
    };

    const mockParts = [
      { partName: 'Side Panel', width: 560, height: 720, quantity: 2, area: 0.8064, isDoor: false, isHardware: false },
    ];

    const mockSettings = {
      hmrRate: 50,
      hardwareBaseCost: 10,
      gstRate: 0.1,
      wastageFactor: 0.05,
      carcassMaterial: { rate: 50 },
      hardware: { hingeRate: 10, drawerSlideRate: 15 },
    };

    await act(async () => {
      await result.current.addToCart(mockConfiguration, mockParts, mockSettings);
    });

    expect(result.current.cartItems.length).toBeGreaterThan(0);
  });

  test('removes item from cart', async () => {
    const { result } = renderHook(() => useCart());
    
    // First add an item
    const mockConfiguration: CabinetConfiguration = {
      cabinetType: createMockCabinetType(),
      width: 600,
      height: 720,
      depth: 560,
      quantity: 1,
    };

    await act(async () => {
      await result.current.addToCart(mockConfiguration, [], {
        hmrRate: 50,
        hardwareBaseCost: 10,
        gstRate: 0.1,
        wastageFactor: 0.05,
      });
    });

    const itemId = result.current.cartItems[0]?.id;
    if (itemId) {
      await act(async () => {
        await result.current.removeFromCart(itemId);
      });
    }

    expect(result.current.cartItems).toHaveLength(0);
  });

  test('updates item quantity', async () => {
    const { result } = renderHook(() => useCart());
    
    const mockConfiguration: CabinetConfiguration = {
      cabinetType: createMockCabinetType(),
      width: 600,
      height: 720,
      depth: 560,
      quantity: 1,
    };

    await act(async () => {
      await result.current.addToCart(mockConfiguration, [], {
        hmrRate: 50,
        hardwareBaseCost: 10,
        gstRate: 0.1,
        wastageFactor: 0.05,
      });
    });

    const itemId = result.current.cartItems[0]?.id;
    if (itemId) {
      await act(async () => {
        await result.current.updateCartItemQuantity(itemId, 3);
      });

      expect(result.current.cartItems[0]?.quantity).toBe(3);
    }
  });
});