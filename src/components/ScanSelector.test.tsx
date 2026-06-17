import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, describe, beforeEach } from 'vitest';
import { ScanSelector } from './ScanSelector';
import * as api from '@/lib/api';

// Mock the API and toast
vi.mock('@/lib/api', () => ({
  getScans: vi.fn(),
  getFindings: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

describe('ScanSelector Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading state initially', () => {
    // Return a promise that never resolves for the test
    vi.mocked(api.getScans).mockImplementation(() => new Promise(() => {}));
    
    render(<ScanSelector onScanSelected={vi.fn()} />);
    
    expect(screen.getByText(/Loading previous scans.../i)).toBeDefined();
  });

  test('does not render anything if no scans are found', async () => {
    vi.mocked(api.getScans).mockResolvedValue([]);
    
    const { container } = render(<ScanSelector onScanSelected={vi.fn()} />);
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('renders select box with scans and handles selection', async () => {
    const mockScans = [
      { id: '1', domain: 'example.com', created_at: '2026-06-17T12:00:00Z' },
      { id: '2', domain: 'test.com', created_at: '2026-06-16T12:00:00Z' }
    ] as any;
    
    const mockFindings = [{ id: 'f1', title: 'XSS' }] as any;

    vi.mocked(api.getScans).mockResolvedValue(mockScans);
    vi.mocked(api.getFindings).mockResolvedValue(mockFindings);
    
    const onScanSelected = vi.fn();
    
    render(<ScanSelector onScanSelected={onScanSelected} />);
    
    // Wait for the select to appear
    await waitFor(() => {
      expect(screen.getByText(/Quick Fill from Past Scan/i)).toBeDefined();
    });

    // Select should have options
    const select = screen.getByRole('combobox');
    expect(select.children.length).toBe(3); // 1 placeholder + 2 scans
    
    // Select the first scan
    fireEvent.change(select, { target: { value: '1' } });
    
    // It should call getFindings and then onScanSelected
    await waitFor(() => {
      expect(api.getFindings).toHaveBeenCalledWith('1');
      expect(onScanSelected).toHaveBeenCalledWith(mockScans[0], mockFindings);
    });
  });
});
